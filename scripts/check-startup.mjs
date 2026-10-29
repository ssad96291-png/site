// A disposable encrypted-database check in the same data directory/filesystem.
// Existing customer data, master keys and bootstrap passwords are never opened.
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";
import { openSecureDatabase } from "../server/secure-database.ts";

const savedKey = process.env.DATA_ENCRYPTION_KEY;
const savedKeyFile = process.env.DATA_ENCRYPTION_KEY_FILE;
let probe;
let db;
try {
  const directory = resolve(process.env.DATA_DIR || ".data");
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  probe = mkdtempSync(join(directory, ".startup-check-"));
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  delete process.env.DATA_ENCRYPTION_KEY_FILE;
  db = openSecureDatabase(probe, false);
  db.exec(
    "CREATE TABLE startup_check(id INTEGER PRIMARY KEY, value TEXT NOT NULL); BEGIN IMMEDIATE;",
  );
  const insert = db.prepare("INSERT INTO startup_check(value) VALUES(?)");
  const sentinel = "DISPOSABLE-STARTUP-CHECK";
  for (let i = 0; i < 32; i++) insert.run(sentinel + "-".repeat(8192));
  db.exec("COMMIT");
  db.close();
  db = undefined;
  if (
    readFileSync(join(probe, "site.sqlite.enc")).includes(Buffer.from(sentinel))
  )
    throw new Error("ENCRYPTION_CHECK_FAILED");
  db = openSecureDatabase(probe, false);
  if (
    db.prepare("SELECT count(*) AS count FROM startup_check").get().count !== 32
  )
    throw new Error("REOPEN_CHECK_FAILED");
  console.log(
    `Başlangıç denetimi geçti: ${process.version}; şifreli kayıt, dosya değiştirme ve yeniden açma başarılı.`,
  );
} catch (error) {
  const known = /^[A-Z0-9_]{1,64}$/;
  const code =
    error.storageCode ||
    (known.test(String(error.code)) ? error.code : "UNKNOWN");
  console.error(
    `Başlangıç denetimi durdu: aşama=${error.stage || "startup-check"}; kod=${code}.`,
  );
  if (error.name === "EncryptedDatabasePersistenceError")
    console.error(error.message);
  else
    console.error(
      "Node.js güncel olmalı; veri klasörü yazılabilir olmalı. Mevcut .data ve .data.key dosyalarını silmeyin.",
    );
  process.exitCode = 1;
} finally {
  try {
    db?.close();
  } catch {}
  if (probe) {
    try {
      rmSync(probe, {
        recursive: true,
        force: true,
        maxRetries: 3,
        retryDelay: 30,
      });
    } catch {}
  }
  if (savedKey === undefined) delete process.env.DATA_ENCRYPTION_KEY;
  else process.env.DATA_ENCRYPTION_KEY = savedKey;
  if (savedKeyFile === undefined) delete process.env.DATA_ENCRYPTION_KEY_FILE;
  else process.env.DATA_ENCRYPTION_KEY_FILE = savedKeyFile;
}
