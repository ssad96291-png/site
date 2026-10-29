import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { gzipSync, gunzipSync } from "node:zlib";
import type { DatabaseSync } from "node:sqlite";
import {
  exportEncryptedSnapshot,
  getDataProtectionKey,
} from "./secure-database.js";

const MAGIC = Buffer.from("KILINCBK1");
export const backupMaxBytes = 128 * 1024 * 1024;
const JSON_LIMIT = 190 * 1024 * 1024;
type Entry = { path: string; size: number; sha256: string; content: string };
export type BackupManifest = {
  format: "kilinc-backup-v1";
  version: 1;
  createdAt: string;
  tables: Record<string, number>;
  files: Entry[];
};
const digest = (b: Buffer) => createHash("sha256").update(b).digest("hex");
const derive = (master: Buffer) =>
  Buffer.from(
    hkdfSync("sha256", master, Buffer.alloc(0), "portable-backup-v1", 32),
  );
const allowedPath = (name: string) =>
  /^(site\.sqlite\.enc|migration-backup\.sqlite\.enc|(?:uploads|private-documents|project-files)\/[A-Za-z0-9_-]+\.(?:bin|pdf|jpe?g|png|webp))$/.test(
    name,
  );
export function tableCounts(db: DatabaseSync): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all() as { name: string }[]) {
    if (!/^[a-zA-Z0-9_]+$/.test(row.name)) continue;
    result[row.name] = Number(
      (db.prepare(`SELECT count(*) AS count FROM "${row.name}"`).get() as any)
        .count,
    );
  }
  return result;
}
export function createPortableBackup(
  db: DatabaseSync,
  dataDir: string,
  production: boolean,
): Buffer {
  const entries: Entry[] = [];
  let total = 0;
  const add = (path: string, bytes: Buffer) => {
    if (!allowedPath(path)) throw new Error("Yedek dosya yolu desteklenmiyor.");
    total += bytes.length;
    if (total > backupMaxBytes)
      throw Object.assign(
        new Error(
          "Panel yedeği 128 MiB sınırını aşıyor; sunucuyu durdurup veri dizinini çevrimdışı yedekleyin.",
        ),
        { status: 413 },
      );
    entries.push({
      path,
      size: bytes.length,
      sha256: digest(bytes),
      content: bytes.toString("base64"),
    });
  };
  add("site.sqlite.enc", exportEncryptedSnapshot(db));
  for (const folder of ["uploads", "private-documents", "project-files"]) {
    const dir = join(dataDir, folder);
    if (!existsSync(dir)) continue;
    if (lstatSync(dir).isSymbolicLink())
      throw new Error("Yedekte sembolik dizin kullanılamaz.");
    for (const file of readdirSync(dir, { withFileTypes: true })) {
      if (file.name.startsWith(".") || file.name.endsWith(".tmp")) continue;
      if (
        !file.isFile() ||
        file.isSymbolicLink() ||
        !allowedPath(folder + "/" + file.name)
      )
        throw new Error(
          "Veri dizinindeki beklenmeyen dosya için çevrimdışı yedek kullanın.",
        );
      const path = join(dir, file.name);
      if (lstatSync(path).size + total > backupMaxBytes)
        throw Object.assign(
          new Error("Panel yedeği 128 MiB sınırını aşıyor."),
          { status: 413 },
        );
      add(folder + "/" + file.name, readFileSync(path));
    }
  }
  const manifest: BackupManifest = {
    format: "kilinc-backup-v1",
    version: 1,
    createdAt: new Date().toISOString(),
    tables: tableCounts(db),
    files: entries,
  };
  const packed = gzipSync(Buffer.from(JSON.stringify(manifest)));
  // The nonce is stored beside the ciphertext; the master key is never included.
  const nonce = randomBytes(12),
    sealed = createCipheriv(
      "aes-256-gcm",
      derive(getDataProtectionKey(dataDir, production)),
      nonce,
    );
  sealed.setAAD(MAGIC);
  const body = Buffer.concat([sealed.update(packed), sealed.final()]);
  return Buffer.concat([MAGIC, nonce, sealed.getAuthTag(), body]);
}
export function decodePortableBackup(
  bytes: Buffer,
  master: Buffer,
): BackupManifest {
  if (
    master.length !== 32 ||
    bytes.length < 37 ||
    bytes.length > JSON_LIMIT ||
    !bytes.subarray(0, 9).equals(MAGIC)
  )
    throw new Error("Yedek biçimi veya boyutu geçersiz.");
  let unpacked: Buffer;
  try {
    const d = createDecipheriv(
      "aes-256-gcm",
      derive(master),
      bytes.subarray(9, 21),
    );
    d.setAAD(MAGIC);
    d.setAuthTag(bytes.subarray(21, 37));
    unpacked = gunzipSync(
      Buffer.concat([d.update(bytes.subarray(37)), d.final()]),
      { maxOutputLength: JSON_LIMIT },
    );
  } catch {
    throw new Error("Yedek doğrulanamadı. Anahtar yanlış veya dosya bozulmuş.");
  }
  const data = JSON.parse(unpacked.toString("utf8")) as BackupManifest;
  if (
    data.format !== "kilinc-backup-v1" ||
    data.version !== 1 ||
    !Array.isArray(data.files) ||
    !data.files.length ||
    data.files.length > 10000
  )
    throw new Error("Yedek manifesti geçersiz.");
  const seen = new Set<string>();
  let total = 0;
  for (const entry of data.files) {
    if (
      !entry ||
      typeof entry.path !== "string" ||
      !allowedPath(entry.path) ||
      seen.has(entry.path) ||
      typeof entry.content !== "string" ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
        entry.content,
      )
    )
      throw new Error("Yedekte geçersiz veya yinelenen dosya var.");
    seen.add(entry.path);
    const decoded = Buffer.from(entry.content, "base64");
    total += decoded.length;
    if (
      entry.size !== decoded.length ||
      total > backupMaxBytes ||
      entry.sha256 !== digest(decoded)
    )
      throw new Error("Yedek dosya bütünlüğü doğrulanamadı.");
  }
  if (!seen.has("site.sqlite.enc"))
    throw new Error("Yedekte veri tabanı bulunamadı.");
  return data;
}
export function restorePortableBackup(
  bytes: Buffer,
  master: Buffer,
  targetDir: string,
): BackupManifest {
  const manifest = decodePortableBackup(bytes, master),
    target = resolve(targetDir);
  if (existsSync(target) || existsSync(target + ".key"))
    throw new Error(
      "Hedef klasör ve anahtar dosyası mevcut olmamalıdır. Yeni bir hedef seçin.",
    );
  mkdirSync(target, { recursive: false, mode: 0o700 });
  for (const entry of manifest.files) {
    const path = join(target, entry.path);
    const parent = dirname(path);
    if (parent && !existsSync(parent))
      mkdirSync(parent, { recursive: true, mode: 0o700 });
    writeFileSync(path, Buffer.from(entry.content, "base64"), {
      mode: 0o600,
      flag: "wx",
    });
  }
  writeFileSync(target + ".key", master.toString("base64") + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  return manifest;
}
/** Optional offline portability export. Never exports authentication secrets. */
export function exportBusinessJson(db: DatabaseSync) {
  const excluded = new Set([
    "users",
    "sessions",
    "portal_sessions",
    "portal_staff_sessions",
    "portal_tokens",
    "rate_limits",
  ]);
  const tables: Record<string, any[]> = {};
  for (const name of Object.keys(tableCounts(db))) {
    if (excluded.has(name)) continue;
    tables[name] = db
      .prepare(`SELECT * FROM "${name}"`)
      .all()
      .map((row: any) => {
        const copy = { ...row };
        delete copy.password;
        for (const key of ["data", "payload"])
          if (typeof copy[key] === "string") {
            try {
              copy[key] = JSON.parse(copy[key]);
            } catch {}
          }
        return copy;
      });
  }
  return {
    format: "kilinc-business-json-v1",
    exportedAt: new Date().toISOString(),
    containsPersonalData: true,
    authenticationSecretsExcluded: true,
    tables,
  };
}
