import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { lstat } from "node:fs/promises";
import { createConnection, type Socket } from "node:net";

export interface FileScanMetadata {
  status: "clean" | "limited_checks" | "infected" | "scan_error";
  engine: "clamav" | "builtin" | "none";
  sha256?: string;
  scannedAt: string;
  reason?: string;
}
export interface FileScanOptions {
  production: boolean;
  maxBytes?: number;
}
export class FileSecurityError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly scan: FileScanMetadata,
  ) {
    super(message);
    this.name = "FileSecurityError";
  }
}
const maxUploadBytes = 20 * 1024 * 1024;
const signature = Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE", "ascii");
const stamp = () => new Date().toISOString();
function configuration() {
  const host = (process.env.CLAMAV_HOST || "").trim();
  const portText = process.env.CLAMAV_PORT || "3310";
  const port = /^\d{1,5}$/.test(portText) ? Number(portText) : 0;
  const configured = !!host;
  const valid =
    configured &&
    host.length <= 253 &&
    !/[\s\x00-\x1f/\\]/.test(host) &&
    port >= 1 &&
    port <= 65535;
  const requested = Number(process.env.CLAMAV_TIMEOUT_MS || "10000");
  const timeout = Number.isFinite(requested)
    ? Math.max(100, Math.min(30000, requested))
    : 10000;
  return { host, port, timeout, configured, valid };
}
/** Configuration is not a scanner-health assertion. A successful per-file
 * INSTREAM reply is required before production files can be accepted or read.
 */
export function securityPolicy(production: boolean) {
  const config = configuration();
  return {
    required: production,
    configured: config.valid,
    mode:
      config.configured && !config.valid
        ? "invalid_configuration"
        : production
          ? "required"
          : config.valid
            ? "clamav"
            : "limited_development",
    label:
      config.configured && !config.valid
        ? "Dosya tarayıcısı ayarları geçersiz; dosya yüklemeleri ve indirmeleri engellenir."
        : production
          ? "Üretimde ClamAV taraması zorunlu; tarayıcı yanıt vermezse dosya kabul edilmez veya indirilmez."
          : config.valid
            ? "Dosyalar ClamAV ile taranır; temiz yanıtı alınmadan erişim verilmez."
            : "Yerel geliştirme: yalnızca sınırlı imza ve biçim kontrolleri. Antivirüs taraması yapılmış sayılmaz.",
  };
}
export function assertFileScannerConfigured(production: boolean): void {
  const config = configuration();
  if ((production && !config.valid) || (config.configured && !config.valid))
    throw new FileSecurityError(
      503,
      "Dosya güvenlik tarayıcısı yapılandırılmamış. Yönetici ClamAV bağlantısını tamamlamalıdır.",
      {
        status: "scan_error",
        engine: "none",
        scannedAt: stamp(),
        reason: "scanner_not_configured",
      },
    );
}

function unavailable(reason = "scanner_unavailable") {
  return new FileSecurityError(
    503,
    "Dosya güvenlik taraması tamamlanamadı. Dosyaya erişim verilmedi; daha sonra tekrar deneyin.",
    { status: "scan_error", engine: "clamav", scannedAt: stamp(), reason },
  );
}
function infected(engine: "clamav" | "builtin", sha256?: string) {
  return new FileSecurityError(
    422,
    "Dosyada zararlı içerik veya antivirüs test imzası saptandı. Dosya engellendi.",
    {
      status: "infected",
      engine,
      sha256,
      scannedAt: stamp(),
      reason: "malware_detected",
    },
  );
}

async function inspect(
  source: AsyncIterable<Buffer>,
  options: FileScanOptions,
): Promise<FileScanMetadata> {
  assertFileScannerConfigured(options.production);
  const config = configuration();
  const maxBytes = Math.min(options.maxBytes ?? maxUploadBytes, maxUploadBytes);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1)
    throw new Error("Geçersiz dosya tarama boyut sınırı.");
  const digest = createHash("sha256");
  let size = 0;
  let overlap = Buffer.alloc(0);
  let socket: Socket | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let connectionFailed: FileSecurityError | undefined;
  let completed = false;
  let reply = Buffer.alloc(0);
  let resolveReply: ((value: string) => void) | undefined;
  let rejectReply: ((reason: unknown) => void) | undefined;
  const response = new Promise<string>((resolve, reject) => {
    resolveReply = resolve;
    rejectReply = reject;
  });
  // A local signature check may throw while clamd is still processing. Keep the
  // reply rejection observed even when that check prevents awaiting response.
  void response.catch(() => undefined);
  const failConnection = (reason = "scanner_unavailable") => {
    if (completed) return;
    connectionFailed = unavailable(reason);
    rejectReply!(connectionFailed);
    socket?.destroy();
  };
  try {
    if (config.valid) {
      socket = createConnection({ host: config.host, port: config.port });
      socket.on("error", () => failConnection());
      socket.on("close", () => {
        if (!completed) failConnection("scanner_connection_closed");
      });
      socket.on("data", (chunk: Buffer) => {
        reply = Buffer.concat([reply, chunk]);
        if (reply.length > 4096) return failConnection("scanner_invalid_reply");
        const end = reply.indexOf(0);
        if (end !== -1) {
          completed = true;
          resolveReply!(reply.subarray(0, end).toString("utf8"));
        }
      });
      timer = setTimeout(
        () => failConnection("scanner_timeout"),
        config.timeout,
      );
      await new Promise<void>((resolve, reject) => {
        socket!.once("connect", resolve);
        socket!.once("error", () => reject(connectionFailed || unavailable()));
        socket!.once("close", () => reject(connectionFailed || unavailable()));
      });
      socket.write(Buffer.from("zINSTREAM\0", "ascii"));
    }
    const write = async (buffer: Buffer) => {
      if (!socket) return;
      if (connectionFailed) throw connectionFailed;
      await new Promise<void>((resolve, reject) => {
        socket!.write(buffer, (error) =>
          error ? reject(connectionFailed || unavailable()) : resolve(),
        );
      });
    };
    for await (const chunk of source) {
      size += chunk.length;
      if (size > maxBytes)
        throw new FileSecurityError(
          413,
          "Dosya tarama boyut sınırını aşıyor.",
          {
            status: "scan_error",
            engine: "none",
            scannedAt: stamp(),
            reason: "file_too_large",
          },
        );
      digest.update(chunk);
      const combined = Buffer.concat([overlap, chunk]);
      if (combined.includes(signature)) throw infected("builtin");
      overlap = combined.subarray(
        Math.max(0, combined.length - signature.length + 1),
      );
      if (socket) {
        const length = Buffer.alloc(4);
        length.writeUInt32BE(chunk.length);
        await write(length);
        await write(chunk);
      }
    }
    const sha256 = digest.digest("hex");
    if (!size)
      throw new FileSecurityError(400, "Boş dosya kabul edilmez.", {
        status: "scan_error",
        engine: "none",
        scannedAt: stamp(),
        reason: "empty_file",
      });
    if (socket) {
      await write(Buffer.alloc(4));
      const result = await response;
      if (result === "stream: OK")
        return {
          status: "clean",
          engine: "clamav",
          sha256,
          scannedAt: stamp(),
        };
      if (/^stream: .+ FOUND$/.test(result)) throw infected("clamav", sha256);
      throw unavailable("scanner_invalid_reply");
    }
    return {
      status: "limited_checks",
      engine: "builtin",
      sha256,
      scannedAt: stamp(),
    };
  } finally {
    if (timer) clearTimeout(timer);
    socket?.destroy();
  }
}

export async function scanBuffer(
  bytes: Buffer,
  options: FileScanOptions,
): Promise<FileScanMetadata> {
  async function* chunks() {
    for (let offset = 0; offset < bytes.length; offset += 65536)
      yield bytes.subarray(offset, offset + 65536);
  }
  return inspect(chunks(), options);
}
export async function scanFile(
  path: string,
  options: FileScanOptions,
): Promise<FileScanMetadata> {
  const info = await lstat(path);
  if (!info.isFile() || info.size > (options.maxBytes ?? maxUploadBytes))
    throw new FileSecurityError(413, "Geçerli boyutta normal dosya gerekli.", {
      status: "scan_error",
      engine: "none",
      scannedAt: stamp(),
      reason: "invalid_file",
    });
  return inspect(createReadStream(path, { highWaterMark: 65536 }), options);
}
