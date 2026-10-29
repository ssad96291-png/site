import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { getDataProtectionKey } from "./secure-database.js";

export interface StorageContext {
  dataDir: string;
  production: boolean;
}
const MAGIC = Buffer.from("KILINCPR1");
const LIMIT = 24 * 1024 * 1024;
function storageError(message: string) {
  return Object.assign(new Error(message), { status: 503 });
}
function checkedPath(path: string, context: StorageContext) {
  const root = resolve(context.dataDir),
    target = resolve(path),
    rel = relative(root, target);
  if (
    isAbsolute(rel) ||
    rel.startsWith(".." + sep) ||
    !/^(private-documents|project-files)[/\\][A-Za-z0-9_.-]+$/.test(rel)
  )
    throw storageError("Özel dosya konumu doğrulanamadı.");
  const directory = dirname(target);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (lstatSync(directory).isSymbolicLink())
    throw storageError("Özel dosya dizini güvenli değil.");
  if (
    existsSync(target) &&
    (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink())
  )
    throw storageError("Özel dosya güvenli bir dosya değil.");
  return {
    target,
    aad: Buffer.from("private-file-v1:" + rel.split(sep).join("/")),
  };
}
function key(context: StorageContext) {
  return Buffer.from(
    hkdfSync(
      "sha256",
      getDataProtectionKey(context.dataDir, context.production),
      Buffer.alloc(0),
      "private-file-v1",
      32,
    ),
  );
}
function encode(bytes: Buffer, aad: Buffer, context: StorageContext) {
  if (bytes.length > LIMIT)
    throw storageError("Özel dosya depolama sınırını aşıyor.");
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(context), nonce);
  cipher.setAAD(Buffer.concat([MAGIC, aad]));
  const encrypted = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), encrypted]);
}
function atomicWrite(path: string, bytes: Buffer, replace: boolean) {
  if (!replace && existsSync(path))
    throw storageError("Özel dosya zaten mevcut.");
  const tmp = join(
    dirname(path),
    ".encrypted-" + randomBytes(16).toString("hex") + ".tmp",
  );
  let fd: number | undefined;
  try {
    fd = openSync(tmp, "wx", 0o600);
    writeFileSync(fd, bytes);
    fsyncSync(fd);
    closeSync(fd);
    fd = undefined;
    if (!replace && existsSync(path))
      throw storageError("Özel dosya zaten mevcut.");
    renameSync(tmp, path);
  } finally {
    if (fd !== undefined) closeSync(fd);
    if (existsSync(tmp)) unlinkSync(tmp);
  }
}
export function writeProtectedFile(
  path: string,
  bytes: Buffer,
  context: StorageContext,
): void {
  const { target, aad } = checkedPath(path, context);
  atomicWrite(target, encode(bytes, aad, context), false);
}
export function readProtectedFile(
  path: string,
  context: StorageContext,
  allowLegacy = false,
): Buffer {
  const { target, aad } = checkedPath(path, context);
  if (lstatSync(target).size > LIMIT + 64)
    throw storageError("Özel dosya depolama sınırını aşıyor.");
  const bytes = readFileSync(target);
  if (!bytes.subarray(0, MAGIC.length).equals(MAGIC)) {
    if (allowLegacy) return bytes;
    throw storageError("Özel dosyanın şifreli biçimi doğrulanamadı.");
  }
  try {
    if (bytes.length < MAGIC.length + 28) throw new Error("invalid envelope");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(context),
      bytes.subarray(MAGIC.length, MAGIC.length + 12),
    );
    decipher.setAAD(Buffer.concat([MAGIC, aad]));
    decipher.setAuthTag(bytes.subarray(MAGIC.length + 12, MAGIC.length + 28));
    return Buffer.concat([
      decipher.update(bytes.subarray(MAGIC.length + 28)),
      decipher.final(),
    ]);
  } catch {
    throw storageError("Özel dosyanın şifreli bütünlüğü doğrulanamadı.");
  }
}
export function protectExistingFile(
  path: string,
  context: StorageContext,
): void {
  const { target, aad } = checkedPath(path, context);
  const bytes = readProtectedFile(target, context, true);
  const header = readFileSync(target).subarray(0, MAGIC.length);
  if (header.equals(MAGIC)) return;
  atomicWrite(target, encode(bytes, aad, context), true);
}
/** Upgrade private attachments at startup without changing their identifiers. */
export function migratePrivateStorage(
  context: StorageContext,
  allowLegacy = true,
): void {
  for (const folder of ["private-documents", "project-files"]) {
    const directory = join(context.dataDir, folder);
    if (!existsSync(directory)) continue;
    if (lstatSync(directory).isSymbolicLink())
      throw storageError("Özel dosya dizini güvenli değil.");
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || !entry.isFile())
        throw storageError("Özel dosya dizininde beklenmeyen içerik var.");
      // Multer owns its interrupted staging files; they are never downloadable.
      if (/^[a-f0-9-]{36}\.tmp$/.test(entry.name)) continue;
      if (/^\.encrypted-[a-f0-9]{32}\.tmp$/.test(entry.name)) {
        unlinkSync(join(directory, entry.name));
        continue;
      }
      if (allowLegacy)
        protectExistingFile(join(directory, entry.name), context);
      else readProtectedFile(join(directory, entry.name), context);
    }
  }
}
