import { DatabaseSync, constants } from "node:sqlite";
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import { replaceAtomicFileSync } from "./atomic-file.js";

/** The only persistent database representation is an authenticated encrypted
 * SQLite snapshot. SQLite itself runs in memory; no plaintext WAL or temp file
 * is created by this connection. This is deliberately a single-process design
 * for the local shop, not a replacement for a large database server. */
const MAGIC = Buffer.from("KILINCDB1", "ascii");
const HEADER_BYTES = MAGIC.length + 12 + 16;
const SQLITE_HEADER = Buffer.from("SQLite format 3\0", "ascii");
const DATABASE_FILE = "site.sqlite.enc";
const MIGRATION_BACKUP = "migration-backup.sqlite.enc";
const records = new WeakMap<DatabaseSync, SecureRecord>();
type KeySource = "environment" | "secret-file" | "local-key-file";
interface SecureRecord {
  key: Buffer;
  keySource: KeySource;
  file: string;
  maxBytes: number;
  snapshot: () => Buffer;
}
type Effect = { write: boolean };
type PersistenceStage =
  | "serialize"
  | "size"
  | "encrypt"
  | "create"
  | "write"
  | "sync"
  | "close"
  | "replace"
  | "directory-sync";

/** Keep diagnostics useful without putting SQL, payloads or private paths in
 * the startup error. The original failure category is retained across cleanup. */
export class EncryptedDatabasePersistenceError extends Error {
  readonly code = "ENCRYPTED_DATABASE_PERSISTENCE";
  readonly storageCode: string;
  constructor(
    readonly stage: PersistenceStage,
    original: unknown,
  ) {
    const candidate = original as
      { code?: unknown; errcode?: unknown; name?: unknown } | undefined;
    const value = candidate?.code ?? candidate?.errcode;
    const storageCode =
      typeof value === "string" && /^[A-Z0-9_]{1,64}$/.test(value)
        ? value
        : typeof value === "number" && Number.isSafeInteger(value)
          ? "SQLITE_" + value
          : "UNKNOWN";
    const snapshotFailure = ["serialize", "size", "encrypt"].includes(stage);
    const description = snapshotFailure
      ? "Şifreli veri tabanı görüntüsü hazırlanamadı."
      : "Şifreli veri tabanı diske kaydedilemedi.";
    const help = ["EPERM", "EACCES", "EBUSY"].includes(storageCode)
      ? "Veri klasörüne yazma iznini ve dosyayı kullanan diğer uygulamaları kontrol edin."
      : storageCode === "ENOSPC"
        ? "Veri diski üzerinde boş alan açın."
        : "Aşağıdaki aşama ve hata koduyla kayıt sorununu kontrol edin.";
    const cause = Object.assign(
      new Error("Kayıt aşaması: " + stage + "; hata kodu: " + storageCode),
      { code: storageCode },
    );
    super(
      `${description} [aşama=${stage}; kod=${storageCode}] Veri kaybını önlemek için işlemler durduruldu. ${help} Mevcut veri ve anahtar dosyalarını silmeden sunucuyu yeniden başlatın.`,
      { cause },
    );
    this.name = "EncryptedDatabasePersistenceError";
    this.storageCode = storageCode;
  }
}

function configuredKey(value: string): Buffer {
  const raw = value.trim();
  if (/^[a-f0-9]{64}$/i.test(raw)) return Buffer.from(raw, "hex");
  if (/^[A-Za-z0-9+/]{43}=$/.test(raw)) {
    const key = Buffer.from(raw, "base64");
    if (key.length === 32 && key.toString("base64") === raw) return key;
  }
  throw new Error(
    "Veri şifreleme anahtarı 32 bayt olmalıdır: 64 haneli hex veya standart base64 kullanın.",
  );
}
function readKey(path: string): Buffer {
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > 1024)
    throw new Error("Şifreleme anahtarı küçük, normal bir dosya olmalıdır.");
  return configuredKey(readFileSync(path, "utf8"));
}
function keyConfiguration(dataDir: string, production: boolean) {
  const raw = process.env.DATA_ENCRYPTION_KEY;
  const secretFile = process.env.DATA_ENCRYPTION_KEY_FILE;
  if (raw && secretFile)
    throw new Error(
      "DATA_ENCRYPTION_KEY ile DATA_ENCRYPTION_KEY_FILE aynı anda tanımlanamaz.",
    );
  if (raw)
    return { key: configuredKey(raw), source: "environment" as KeySource };
  if (secretFile) {
    const full = realpathSync(resolve(secretFile));
    const root = existsSync(dataDir)
      ? realpathSync(resolve(dataDir))
      : resolve(dataDir);
    const rel = relative(root, full);
    if (!(rel === ".." || rel.startsWith(".." + sep) || isAbsolute(rel)))
      throw new Error("Şifreleme anahtarını veri klasörünün dışında saklayın.");
    return { key: readKey(full), source: "secret-file" as KeySource };
  }
  if (production)
    throw new Error(
      "Üretim için DATA_ENCRYPTION_KEY veya veri klasörü dışındaki DATA_ENCRYPTION_KEY_FILE tanımlayın. Anahtarı kaybederseniz şifreli veriler açılamaz.",
    );
  const keyFile = resolve(dataDir) + ".key";
  mkdirSync(dirname(keyFile), { recursive: true, mode: 0o700 });
  if (!existsSync(keyFile)) {
    if (
      existsSync(join(dataDir, DATABASE_FILE)) ||
      existsSync(join(dataDir, MIGRATION_BACKUP))
    )
      throw new Error(
        "Şifreli veriler var ancak özgün şifreleme anahtarı bulunamadı. Ayrı sakladığınız anahtarı geri yükleyin; yeni anahtar oluşturulmadı.",
      );
    let fd: number | undefined;
    try {
      fd = openSync(keyFile, "wx", 0o600);
      writeFileSync(fd, randomBytes(32).toString("base64") + "\n");
      fsyncSync(fd);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }
  return { key: readKey(keyFile), source: "local-key-file" as KeySource };
}

/** Shared master key for separately domain-separated private file encryption.
 * The development key is `${dataDir}.key`, outside the data/backup directory. */
export function getDataProtectionKey(
  dataDir: string,
  production: boolean,
): Buffer {
  return Buffer.from(keyConfiguration(dataDir, production).key);
}
function snapshotKey(master: Buffer): Buffer {
  return Buffer.from(
    hkdfSync(
      "sha256",
      master,
      Buffer.alloc(0),
      "kilinc/database-snapshot/v1",
      32,
    ),
  );
}
function encryptSnapshot(data: Uint8Array, master: Buffer): Buffer {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", snapshotKey(master), nonce);
  cipher.setAAD(MAGIC);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, nonce, cipher.getAuthTag(), ciphertext]);
}
function decryptSnapshot(
  envelope: Buffer,
  master: Buffer,
  maxBytes: number,
): Buffer {
  if (
    envelope.length <= HEADER_BYTES ||
    envelope.length > maxBytes + HEADER_BYTES ||
    !envelope.subarray(0, MAGIC.length).equals(MAGIC)
  )
    throw new Error("Şifreli veri tabanı biçimi veya boyutu geçersiz.");
  try {
    const nonce = envelope.subarray(MAGIC.length, MAGIC.length + 12);
    const tag = envelope.subarray(MAGIC.length + 12, HEADER_BYTES);
    const decipher = createDecipheriv(
      "aes-256-gcm",
      snapshotKey(master),
      nonce,
    );
    decipher.setAAD(MAGIC);
    decipher.setAuthTag(tag);
    const data = Buffer.concat([
      decipher.update(envelope.subarray(HEADER_BYTES)),
      decipher.final(),
    ]);
    if (!data.subarray(0, SQLITE_HEADER.length).equals(SQLITE_HEADER))
      throw new Error("sqlite");
    return data;
  } catch {
    throw new Error(
      "Veri tabanı açılamadı: şifreleme anahtarı yanlış veya dosya değiştirilmiş/bozulmuş. Mevcut dosyanın üzerine yazılmadı.",
    );
  }
}
function directorySync(directory: string) {
  if (process.platform === "win32") return;
  const fd = openSync(directory, "r");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function writeAtomic(
  path: string,
  bytes: Buffer,
  stage?: (value: PersistenceStage) => void,
) {
  const temporary = join(
    dirname(path),
    "." + basename(path) + "." + randomBytes(12).toString("hex") + ".tmp",
  );
  let fd: number | undefined;
  try {
    stage?.("create");
    fd = openSync(temporary, "wx", 0o600);
    stage?.("write");
    writeFileSync(fd, bytes);
    stage?.("sync");
    fsyncSync(fd);
    stage?.("close");
    closeSync(fd);
    fd = undefined;
    stage?.("replace");
    replaceAtomicFileSync(temporary, path);
    stage?.("directory-sync");
    directorySync(dirname(path));
  } finally {
    // A scanner can also hold the temporary file. Cleanup must not replace the
    // original write/rename failure; the old database is never removed here.
    if (fd !== undefined) {
      try {
        closeSync(fd);
      } catch {}
    }
    try {
      if (existsSync(temporary)) unlinkSync(temporary);
    } catch {}
  }
}
function maxDatabaseBytes() {
  const configured = process.env.DATA_MAX_DATABASE_MB || "64";
  const value = Number(configured);
  if (!/^\d+$/.test(configured) || value < 1 || value > 256)
    throw new Error(
      "DATA_MAX_DATABASE_MB 1 ile 256 arasında tam sayı olmalıdır.",
    );
  return value * 1024 * 1024;
}
function lockDatabase(directory: string) {
  // Do not auto-reclaim this very short-lived startup guard: it serializes the
  // main stale-PID check/removal, so two simultaneous restarts cannot unlink
  // each other's newly acquired lock. A crash during this phase fails closed
  // until the operator checks that all servers are stopped and removes it.
  const guard = join(directory, ".database.lock.guard");
  let guardFd: number;
  try {
    guardFd = openSync(guard, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST")
      throw new Error(
        "Veri tabanı başlatma kilidi var. Diğer sunucuları durdurun; açılış yarıda kaldıysa .database.lock.guard dosyasını çevrimdışıyken kontrol edin.",
      );
    throw error;
  }
  try {
    writeFileSync(guardFd, JSON.stringify({ pid: process.pid }));
    fsyncSync(guardFd);
  } finally {
    closeSync(guardFd);
  }
  try {
    const path = join(directory, ".database.lock");
    let own: string | undefined;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const token = randomBytes(16).toString("hex");
        const fd = openSync(path, "wx", 0o600);
        try {
          own = JSON.stringify({ pid: process.pid, token });
          writeFileSync(fd, own);
          fsyncSync(fd);
        } finally {
          closeSync(fd);
        }
        return () => {
          if (existsSync(path) && readFileSync(path, "utf8") === own)
            unlinkSync(path);
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
        let owner: unknown;
        try {
          const info = lstatSync(path);
          if (!info.isFile() || info.isSymbolicLink() || info.size > 512)
            throw error;
          owner = JSON.parse(readFileSync(path, "utf8"));
        } catch {
          throw new Error(
            "Veri tabanı kilidi doğrulanamadı. Diğer sunucuyu durdurup kilidi kontrol edin.",
          );
        }
        const pid = (owner as { pid?: unknown }).pid;
        if (!Number.isSafeInteger(pid) || Number(pid) <= 0)
          throw new Error("Veri tabanı kilidindeki süreç kimliği geçersiz.");
        try {
          process.kill(Number(pid), 0);
        } catch (check) {
          if ((check as NodeJS.ErrnoException).code === "ESRCH") {
            unlinkSync(path);
            continue;
          }
        }
        throw new Error(
          "Bu veri tabanı başka bir sunucuda açık. Aynı veri klasörüyle tek sunucu çalıştırın.",
        );
      }
    }
    throw new Error("Veri tabanı kilidi alınamadı.");
  } finally {
    unlinkSync(guard);
  }
}
function loadEnvelope(path: string, key: Buffer, maxBytes: number) {
  const info = lstatSync(path);
  if (
    !info.isFile() ||
    info.isSymbolicLink() ||
    info.size > maxBytes + HEADER_BYTES
  )
    throw new Error("Veri tabanı dosyası veya boyutu geçersiz.");
  return decryptSnapshot(readFileSync(path), key, maxBytes);
}
function openLegacySnapshot(path: string, maxBytes: number) {
  const info = lstatSync(path);
  if (!info.isFile() || info.isSymbolicLink() || info.size > maxBytes)
    throw new Error("Eski veri tabanı dosyası veya boyutu geçersiz.");
  const source = new DatabaseSync(path);
  try {
    source.exec(
      "PRAGMA busy_timeout=0; PRAGMA temp_store=MEMORY; PRAGMA locking_mode=EXCLUSIVE; BEGIN EXCLUSIVE;",
    );
    const snapshot = Buffer.from(source.serialize());
    if (snapshot.length > maxBytes)
      throw new Error("Veri tabanı boyut sınırını aşıyor.");
    // sqlite3_deserialize cannot open WAL-format database headers in memory.
    // The serialized pages already include the consistent WAL read snapshot.
    snapshot[18] = 1;
    snapshot[19] = 1;
    return {
      bytes: snapshot,
      close: () => {
        if (!source.isOpen) return;
        try {
          if (source.isTransaction) source.exec("ROLLBACK");
        } finally {
          source.close();
        }
      },
    };
  } catch (error) {
    source.close();
    throw new Error(
      "Eski veri tabanı güvenli geçiş için kilitlenemedi veya okunamadı. Önce eski sunucuyu tamamen durdurun; dosyalar korunuyor.",
      { cause: error },
    );
  }
}
function removeLegacy(directory: string) {
  for (const name of [
    "site.sqlite-wal",
    "site.sqlite-shm",
    "site.sqlite-journal",
    "site.sqlite",
  ]) {
    const path = join(directory, name);
    if (!existsSync(path)) continue;
    const info = lstatSync(path);
    if (!info.isFile() || info.isSymbolicLink())
      throw new Error(
        "Eski veri dosyası normal dosya değil; otomatik kaldırılmadı.",
      );
    unlinkSync(path);
  }
  directorySync(directory);
}

/** Open the native SQLite interface backed by authenticated, atomic encrypted
 * snapshots. An acknowledged autocommit/COMMIT has been fsynced before return.
 * A persistence failure blocks subsequent DB operations until a restart. */
export function openSecureDatabase(
  dataDir: string,
  production = false,
): DatabaseSync {
  if (
    typeof DatabaseSync.prototype.serialize !== "function" ||
    typeof DatabaseSync.prototype.deserialize !== "function" ||
    typeof DatabaseSync.prototype.setAuthorizer !== "function"
  )
    throw new Error(
      "Bu sürüm için serialize/deserialize destekli güncel Node.js 24 LTS gerekir; Node.js kurulumunu güncelleyin.",
    );
  const directory = resolve(dataDir);
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const { key, source } = keyConfiguration(directory, production);
  const maxBytes = maxDatabaseBytes();
  const file = join(directory, DATABASE_FILE);
  const legacy = join(directory, "site.sqlite");
  const migration = join(directory, MIGRATION_BACKUP);
  const unlock = lockDatabase(directory);
  const native = new DatabaseSync(":memory:");
  let fatal: Error | undefined;
  let closed = false;
  let dirty = false;
  let effect: Effect | undefined;
  let legacySnapshot: ReturnType<typeof openLegacySnapshot> | undefined;
  const finishLegacy = () => {
    // Windows does not allow deleting an open SQLite handle. The documented
    // prerequisite is that the previous server is stopped before upgrading.
    // On POSIX, retain the exclusive writer lock through deletion as well.
    if (process.platform === "win32") legacySnapshot?.close();
    removeLegacy(directory);
    legacySnapshot?.close();
    legacySnapshot = undefined;
  };
  const safe = () => {
    if (fatal) throw fatal;
    if (closed) throw new Error("Veri tabanı kapalı.");
  };
  const snapshot = (stage?: (value: PersistenceStage) => void) => {
    safe();
    if (native.isTransaction)
      throw new Error("Açık işlem sırasında veri tabanı yedeği alınamaz.");
    stage?.("serialize");
    const bytes = native.serialize();
    stage?.("size");
    if (bytes.byteLength > maxBytes)
      throw new Error(
        "Veri tabanı boyut sınırını aşıyor; yedekleyip depolama sınırını değerlendirin.",
      );
    stage?.("encrypt");
    return encryptSnapshot(bytes, key);
  };
  const persist = () => {
    let stage: PersistenceStage = "serialize";
    try {
      const onStage = (value: PersistenceStage) => {
        stage = value;
      };
      writeAtomic(file, snapshot(onStage), onStage);
      dirty = false;
    } catch (cause) {
      fatal = new EncryptedDatabasePersistenceError(stage, cause);
      throw fatal;
    }
  };
  try {
    if (existsSync(file)) {
      native.deserialize(loadEnvelope(file, key, maxBytes));
      if (existsSync(legacy)) {
        if (!existsSync(migration))
          throw new Error(
            "Şifreli ve eski veri tabanı birlikte bulundu. Eski sunucuyu durdurup verileri kontrol edin; hiçbir dosya silinmedi.",
          );
        const previous = loadEnvelope(migration, key, maxBytes);
        legacySnapshot = openLegacySnapshot(legacy, maxBytes);
        const currentLegacy = legacySnapshot.bytes;
        if (
          previous.length !== currentLegacy.length ||
          !timingSafeEqual(previous, currentLegacy)
        )
          throw new Error(
            "Eski veri tabanı şifreli geçiş yedeğinden farklı. Otomatik silme yapılmadı; eski sunucuyu durdurup verileri kontrol edin.",
          );
        finishLegacy();
      }
    } else if (existsSync(legacy)) {
      legacySnapshot = openLegacySnapshot(legacy, maxBytes);
      const bytes = legacySnapshot.bytes;
      native.deserialize(bytes);
      if (
        native.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok"
      )
        throw new Error(
          "Eski veri tabanı bütünlük denetiminden geçemedi; değiştirilmedi.",
        );
      const encrypted = encryptSnapshot(bytes, key);
      if (existsSync(migration)) {
        const old = loadEnvelope(migration, key, maxBytes);
        if (old.length !== bytes.length || !timingSafeEqual(old, bytes))
          throw new Error(
            "Önceki şifreli geçiş yedeği farklı; mevcut dosyalar korunuyor.",
          );
      } else writeAtomic(migration, encrypted);
      writeAtomic(file, encrypted);
      // Authenticate the actual on-disk files before removing legacy plaintext.
      loadEnvelope(file, key, maxBytes);
      loadEnvelope(migration, key, maxBytes);
      finishLegacy();
    }
    native.exec(
      `PRAGMA temp_store=MEMORY; PRAGMA journal_mode=MEMORY; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON; PRAGMA max_page_count=${Math.floor(maxBytes / 4096)};`,
    );
    const writes = new Set<number>([
      constants.SQLITE_CREATE_INDEX,
      constants.SQLITE_CREATE_TABLE,
      constants.SQLITE_CREATE_TEMP_INDEX,
      constants.SQLITE_CREATE_TEMP_TABLE,
      constants.SQLITE_CREATE_TEMP_TRIGGER,
      constants.SQLITE_CREATE_TEMP_VIEW,
      constants.SQLITE_CREATE_TRIGGER,
      constants.SQLITE_CREATE_VIEW,
      constants.SQLITE_DELETE,
      constants.SQLITE_DROP_INDEX,
      constants.SQLITE_DROP_TABLE,
      constants.SQLITE_DROP_TEMP_INDEX,
      constants.SQLITE_DROP_TEMP_TABLE,
      constants.SQLITE_DROP_TEMP_TRIGGER,
      constants.SQLITE_DROP_TEMP_VIEW,
      constants.SQLITE_DROP_TRIGGER,
      constants.SQLITE_DROP_VIEW,
      constants.SQLITE_INSERT,
      constants.SQLITE_UPDATE,
      constants.SQLITE_ALTER_TABLE,
      constants.SQLITE_REINDEX,
      constants.SQLITE_ANALYZE,
      constants.SQLITE_CREATE_VTABLE,
      constants.SQLITE_DROP_VTABLE,
    ]);
    native.setAuthorizer((action, first, second) => {
      if (
        action === constants.SQLITE_ATTACH ||
        action === constants.SQLITE_DETACH
      )
        return constants.SQLITE_DENY;
      if (
        action === constants.SQLITE_FUNCTION &&
        second?.toLowerCase() === "load_extension"
      )
        return constants.SQLITE_DENY;
      if (action === constants.SQLITE_PRAGMA && second !== null) {
        const name = first?.toLowerCase();
        if (
          [
            "temp_store_directory",
            "data_store_directory",
            "writable_schema",
          ].includes(name || "") ||
          (name === "temp_store" &&
            !["memory", "2"].includes(second.toLowerCase())) ||
          (name === "journal_mode" && second.toLowerCase() !== "memory") ||
          name === "max_page_count"
        )
          return constants.SQLITE_DENY;
        if (effect) effect.write = true;
      }
      if (writes.has(action) && effect) effect.write = true;
      return constants.SQLITE_OK;
    });
    const after = (current: Effect) => {
      if (current.write) dirty = true;
      if (dirty && !native.isTransaction) persist();
    };
    const prepare = (sql: string) => {
      safe();
      const current: Effect = { write: false };
      effect = current;
      let statement;
      try {
        statement = native.prepare(sql);
      } finally {
        effect = undefined;
      }
      return new Proxy(statement, {
        get(target, property) {
          const value = Reflect.get(target, property, target);
          if (typeof value !== "function") return value;
          if (["run", "get", "all"].includes(String(property)))
            return (...args: unknown[]) => {
              safe();
              effect = current;
              try {
                return value.apply(target, args);
              } finally {
                effect = undefined;
                after(current);
              }
            };
          if (property === "iterate")
            return (...args: unknown[]) => {
              safe();
              if (current.write)
                throw new Error(
                  "Yazma işlemlerinde iterate yerine run/get/all kullanın.",
                );
              return value.apply(target, args);
            };
          return value.bind(target);
        },
      });
    };
    let wrapped: DatabaseSync;
    wrapped = new Proxy(native, {
      get(target, property) {
        if (property === "prepare") return prepare;
        if (property === "exec")
          return (sql: string) => {
            safe();
            const current: Effect = { write: false };
            effect = current;
            try {
              return target.exec(sql);
            } finally {
              effect = undefined;
              after(current);
            }
          };
        if (property === "close" || property === Symbol.dispose)
          return () => {
            if (closed) return;
            try {
              if (native.isTransaction) native.exec("ROLLBACK");
              if (!fatal && dirty) persist();
            } finally {
              native.close();
              closed = true;
              unlock();
            }
          };
        if (
          [
            "setAuthorizer",
            "loadExtension",
            "enableLoadExtension",
            "deserialize",
            "open",
            "applyChangeset",
            "createTagStore",
          ].includes(String(property))
        )
          return () => {
            throw new Error(
              "Şifreli veri tabanında bu düşük seviye işlem kullanılamaz.",
            );
          };
        safe();
        const value = Reflect.get(target, property, target);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
    records.set(wrapped, { key, keySource: source, file, maxBytes, snapshot });
    if (!existsSync(file)) persist();
    return wrapped;
  } catch (error) {
    try {
      legacySnapshot?.close();
    } catch {}
    try {
      native.close();
    } catch {}
    try {
      unlock();
    } catch {}
    throw error;
  }
}

export function exportEncryptedSnapshot(db: DatabaseSync): Buffer {
  const record = records.get(db);
  if (!record) throw new Error("Bu bağlantı şifreli veri tabanı değildir.");
  return record.snapshot();
}
export function getDatabaseProtectionStatus(db: DatabaseSync) {
  const record = records.get(db);
  if (!record) return { enabled: false as const };
  return {
    enabled: true as const,
    algorithm: "AES-256-GCM",
    formatVersion: 1,
    keySource: record.keySource,
    keyFingerprint: createHash("sha256")
      .update(record.key)
      .digest("hex")
      .slice(0, 16),
    databaseFile: basename(record.file),
    maxSnapshotBytes: record.maxBytes,
    singleProcess: true,
  };
}
