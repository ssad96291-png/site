import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { spawnSync } from "node:child_process";
import test from "node:test";
import {
  exportEncryptedSnapshot,
  getDatabaseProtectionStatus,
  getDataProtectionKey,
  openSecureDatabase,
} from "./secure-database.js";

const envNames = [
  "DATA_ENCRYPTION_KEY",
  "DATA_ENCRYPTION_KEY_FILE",
  "DATA_MAX_DATABASE_MB",
] as const;
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "kilinc-secure-db-"));
  const directory = join(home, "data");
  const previous = Object.fromEntries(
    envNames.map((name) => [name, process.env[name]]),
  );
  for (const name of envNames) delete process.env[name];
  return {
    home,
    directory,
    close() {
      for (const name of envNames) {
        if (previous[name] === undefined) delete process.env[name];
        else process.env[name] = previous[name];
      }
      rmSync(home, { recursive: true, force: true });
    },
  };
}

test("Encrypted database acknowledges durable snapshots without plaintext database, WAL or in-directory key", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("CREATE TABLE private_data(id INTEGER PRIMARY KEY,body TEXT)");
    db.prepare("INSERT INTO private_data(body) VALUES(?)").run(
      "PRIVATE-CUSTOMER-MESSAGE-123",
    );
    const encrypted = readFileSync(join(f.directory, "site.sqlite.enc"));
    assert.ok(encrypted.subarray(0, 9).equals(Buffer.from("KILINCDB1")));
    assert.equal(
      encrypted.includes(Buffer.from("PRIVATE-CUSTOMER-MESSAGE-123")),
      false,
    );
    assert.equal(encrypted.includes(Buffer.from("SQLite format 3")), false);
    assert.deepEqual(readdirSync(f.directory).sort(), [
      ".database.lock",
      "site.sqlite.enc",
    ]);
    assert.equal(statSync(f.directory + ".key").mode & 0o777, 0o600);
    assert.equal(
      statSync(join(f.directory, "site.sqlite.enc")).mode & 0o777,
      0o600,
    );
    assert.equal(getDataProtectionKey(f.directory, false).byteLength, 32);
    assert.equal(getDatabaseProtectionStatus(db).enabled, true);
    db.close();
    db = openSecureDatabase(f.directory);
    assert.equal(
      db.prepare("SELECT body FROM private_data").get()?.body,
      "PRIVATE-CUSTOMER-MESSAGE-123",
    );
  } finally {
    db?.close();
    f.close();
  }
});

test("Explicit commits and rollbacks, reused prepared statements, RETURNING and multi-statement exec persist correctly", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("CREATE TABLE items(id INTEGER PRIMARY KEY,value TEXT)");
    const insert = db.prepare("INSERT INTO items(value) VALUES(?)");
    db.exec("BEGIN IMMEDIATE");
    insert.run("rolled-back");
    assert.throws(() => exportEncryptedSnapshot(db!), /Açık işlem/);
    db.exec("ROLLBACK");
    db.prepare("BEGIN").run();
    insert.run("kept");
    db.prepare("COMMIT").run();
    assert.equal(
      db
        .prepare("INSERT INTO items(value) VALUES(?) RETURNING value")
        .get("returning")?.value,
      "returning",
    );
    db.prepare(
      "UPDATE items SET value=value||'-updated' RETURNING value",
    ).all();
    db.exec("BEGIN; INSERT INTO items(value) VALUES('multi'); COMMIT;");
    db.close();
    db = openSecureDatabase(f.directory);
    assert.deepEqual(
      db
        .prepare("SELECT value FROM items ORDER BY id")
        .all()
        .map((row) => row.value),
      ["kept-updated", "returning-updated", "multi"],
    );
  } finally {
    db?.close();
    f.close();
  }
});

test("Wrong keys and modified authentication tags fail closed without overwriting the stored ciphertext", () => {
  const f = fixture();
  const key = randomBytes(32).toString("base64");
  let db: DatabaseSync | undefined;
  try {
    process.env.DATA_ENCRYPTION_KEY = key;
    db = openSecureDatabase(f.directory, true);
    db.exec(
      "CREATE TABLE secrets(message TEXT); INSERT INTO secrets VALUES('retained');",
    );
    db.close();
    const file = join(f.directory, "site.sqlite.enc");
    const original = readFileSync(file);
    process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    assert.throws(
      () => openSecureDatabase(f.directory, true),
      /anahtarı yanlış|bozulmuş/,
    );
    assert.deepEqual(readFileSync(file), original);
    process.env.DATA_ENCRYPTION_KEY = key;
    const corrupted = Buffer.from(original);
    corrupted[25] ^= 1;
    writeFileSync(file, corrupted);
    assert.throws(
      () => openSecureDatabase(f.directory, true),
      /anahtarı yanlış|bozulmuş/,
    );
    assert.deepEqual(readFileSync(file), corrupted);
    writeFileSync(file, original);
    db = openSecureDatabase(f.directory, true);
    assert.equal(
      db.prepare("SELECT message FROM secrets").get()?.message,
      "retained",
    );
  } finally {
    db?.close();
    f.close();
  }
});

test("Plain SQLite databases migrate through authenticated encrypted backups and survive a portable snapshot restore", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    mkdirSync(f.directory);
    const old = new DatabaseSync(join(f.directory, "site.sqlite"));
    old.exec(
      "CREATE TABLE customers(id TEXT PRIMARY KEY,body TEXT); INSERT INTO customers VALUES('cust-1','PRIVATE legacy body');",
    );
    old.close();
    db = openSecureDatabase(f.directory);
    assert.equal(
      db.prepare("SELECT body FROM customers").get()?.body,
      "PRIVATE legacy body",
    );
    assert.equal(existsSync(join(f.directory, "site.sqlite")), false);
    assert.equal(
      existsSync(join(f.directory, "migration-backup.sqlite.enc")),
      true,
    );
    for (const name of readdirSync(f.directory).filter((name) =>
      name.endsWith(".enc"),
    ))
      assert.equal(
        readFileSync(join(f.directory, name)).includes(
          Buffer.from("PRIVATE legacy body"),
        ),
        false,
      );
    db.prepare("INSERT INTO customers VALUES(?,?)").run("cust-2", "New data");
    const portable = exportEncryptedSnapshot(db);
    const master = getDataProtectionKey(f.directory, false);
    db.close();
    const restored = join(f.home, "restored");
    mkdirSync(restored);
    writeFileSync(join(restored, "site.sqlite.enc"), portable);
    process.env.DATA_ENCRYPTION_KEY = master.toString("base64");
    db = openSecureDatabase(restored, true);
    assert.equal(db.prepare("SELECT count(*) AS n FROM customers").get()?.n, 2);
  } finally {
    db?.close();
    f.close();
  }
});

test("Migration includes committed rows left in an old SQLite WAL after an abrupt process exit", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    mkdirSync(f.directory);
    const script = `const {DatabaseSync}=require('node:sqlite'); const d=new DatabaseSync(process.argv[1]); d.exec("PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0; CREATE TABLE records(value TEXT); INSERT INTO records VALUES('COMMITTED-WAL-ROW');"); process.kill(process.pid,'SIGKILL');`;
    const result = spawnSync(process.execPath, [
      "-e",
      script,
      join(f.directory, "site.sqlite"),
    ]);
    assert.equal(result.signal, "SIGKILL");
    assert.ok(existsSync(join(f.directory, "site.sqlite-wal")));
    db = openSecureDatabase(f.directory);
    assert.equal(
      db.prepare("SELECT value FROM records").get()?.value,
      "COMMITTED-WAL-ROW",
    );
    assert.equal(
      readdirSync(f.directory).some((name) =>
        /^site\.sqlite(?:-wal|-shm|-journal)?$/.test(name),
      ),
      false,
    );
  } finally {
    db?.close();
    f.close();
  }
});

test("The encrypted connection forbids file-spilling SQL, extension loading and competing processes", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("CREATE TABLE safe(value TEXT)");
    const escaped = join(f.home, "escaped.sqlite").replaceAll("'", "''");
    for (const sql of [
      `ATTACH DATABASE '${escaped}' AS another`,
      `VACUUM INTO '${escaped}'`,
      "PRAGMA temp_store=FILE",
      "PRAGMA journal_mode=WAL",
      "PRAGMA writable_schema=ON",
      "SELECT load_extension('anything')",
    ])
      assert.throws(() => db!.exec(sql));
    assert.equal(existsSync(join(f.home, "escaped.sqlite")), false);
    assert.throws(() => db!.enableLoadExtension(true), /düşük seviye/);
    assert.throws(() => db!.setAuthorizer(() => 0), /düşük seviye/);
    assert.throws(
      () => openSecureDatabase(f.directory),
      /başka bir sunucuda açık/,
    );
    db.close();
    db = openSecureDatabase(f.directory);
    assert.equal(db.prepare("PRAGMA temp_store").get()?.temp_store, 2);
  } finally {
    db?.close();
    f.close();
  }
});

test("Production requires a separately configured valid key and rejects keys stored inside the backup directory", () => {
  const f = fixture();
  try {
    assert.throws(() => openSecureDatabase(f.directory, true), /Üretim için/);
    assert.equal(existsSync(f.directory + ".key"), false);
    process.env.DATA_ENCRYPTION_KEY = "invalid";
    assert.throws(() => getDataProtectionKey(f.directory, true), /32 bayt/);
    delete process.env.DATA_ENCRYPTION_KEY;
    mkdirSync(f.directory, { recursive: true });
    const badKey = join(f.directory, "not-separate.key");
    writeFileSync(badKey, randomBytes(32).toString("base64"));
    process.env.DATA_ENCRYPTION_KEY_FILE = badKey;
    assert.throws(() => getDataProtectionKey(f.directory, true), /dışında/);
    const secret = join(f.home, "secret.key");
    const key = randomBytes(32).toString("base64");
    writeFileSync(secret, key, { mode: 0o600 });
    process.env.DATA_ENCRYPTION_KEY_FILE = secret;
    assert.equal(
      getDataProtectionKey(f.directory, true).toString("base64"),
      key,
    );
  } finally {
    f.close();
  }
});

test("A failed encrypted persistence stops future reads and writes rather than serving unpersisted state", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("CREATE TABLE records(value TEXT)");
    chmodSync(f.directory, 0o500);
    assert.throws(
      () => db!.prepare("INSERT INTO records VALUES('not-acknowledged')").run(),
      /diske kaydedilemedi/,
    );
    assert.throws(
      () => db!.prepare("SELECT * FROM records").all(),
      /işlemler durduruldu/,
    );
    assert.throws(() => exportEncryptedSnapshot(db!), /işlemler durduruldu/);
    chmodSync(f.directory, 0o700);
    db.close();
    db = openSecureDatabase(f.directory);
    assert.equal(db.prepare("SELECT count(*) AS n FROM records").get()?.n, 0);
  } finally {
    chmodSync(f.directory, 0o700);
    db?.close();
    f.close();
  }
});

test("SQLite schema metadata PRAGMA writes survive immediate close and restart", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("PRAGMA user_version=19;");
    db.prepare("PRAGMA application_id=1234").get();
    db.close();
    db = openSecureDatabase(f.directory);
    assert.equal(db.prepare("PRAGMA user_version").get()?.user_version, 19);
    assert.equal(
      db.prepare("PRAGMA application_id").get()?.application_id,
      1234,
    );
  } finally {
    db?.close();
    f.close();
  }
});

test("A missing original local key never creates a misleading replacement key for existing encrypted data", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec(
      "CREATE TABLE retained(value TEXT); INSERT INTO retained VALUES('safe');",
    );
    db.close();
    const keyFile = f.directory + ".key";
    const originalKey = readFileSync(keyFile);
    const originalDatabase = readFileSync(join(f.directory, "site.sqlite.enc"));
    unlinkSync(keyFile);
    assert.throws(
      () => openSecureDatabase(f.directory),
      /özgün şifreleme anahtarı bulunamadı/,
    );
    assert.equal(existsSync(keyFile), false);
    assert.deepEqual(
      readFileSync(join(f.directory, "site.sqlite.enc")),
      originalDatabase,
    );
    writeFileSync(keyFile, originalKey, { mode: 0o600 });
    db = openSecureDatabase(f.directory);
    assert.equal(db.prepare("SELECT value FROM retained").get()?.value, "safe");
  } finally {
    db?.close();
    f.close();
  }
});

test("A filename starting with two dots cannot place a production key inside the data directory", () => {
  const f = fixture();
  try {
    mkdirSync(f.directory);
    const badKey = join(f.directory, "..secret.key");
    writeFileSync(badKey, randomBytes(32).toString("base64"), { mode: 0o600 });
    process.env.DATA_ENCRYPTION_KEY_FILE = badKey;
    assert.throws(() => getDataProtectionKey(f.directory, true), /dışında/);
  } finally {
    f.close();
  }
});

test("The startup guard fails closed instead of competing to reclaim another process's stale lock", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    mkdirSync(f.directory);
    const lock = join(f.directory, ".database.lock");
    const guard = join(f.directory, ".database.lock.guard");
    writeFileSync(lock, JSON.stringify({ pid: 2_147_483_647, token: "old" }));
    writeFileSync(guard, JSON.stringify({ pid: 2_147_483_647 }));
    assert.throws(() => openSecureDatabase(f.directory), /başlatma kilidi/);
    assert.equal(JSON.parse(readFileSync(lock, "utf8")).token, "old");
    unlinkSync(guard); // Explicit offline operator recovery, never automatic.
    db = openSecureDatabase(f.directory);
    assert.equal(JSON.parse(readFileSync(lock, "utf8")).pid, process.pid);
    assert.equal(existsSync(guard), false);
    assert.throws(
      () => openSecureDatabase(f.directory),
      /başka bir sunucuda açık/,
    );
    assert.equal(existsSync(guard), false);
  } finally {
    db?.close();
    f.close();
  }
});

test("An active legacy writer prevents migration before any plaintext file is removed", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  let old: DatabaseSync | undefined;
  try {
    mkdirSync(f.directory);
    const legacy = join(f.directory, "site.sqlite");
    old = new DatabaseSync(legacy);
    old.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE preserved(value TEXT); INSERT INTO preserved VALUES('committed'); BEGIN IMMEDIATE; INSERT INTO preserved VALUES('not-yet-committed');",
    );
    assert.throws(
      () => openSecureDatabase(f.directory),
      /eski sunucuyu tamamen durdurun/,
    );
    assert.equal(existsSync(legacy), true);
    assert.equal(existsSync(join(f.directory, "site.sqlite.enc")), false);
    old.exec("ROLLBACK");
    old.close();
    old = undefined;
    db = openSecureDatabase(f.directory);
    assert.equal(
      db.prepare("SELECT value FROM preserved").get()?.value,
      "committed",
    );
    assert.equal(db.prepare("SELECT count(*) AS n FROM preserved").get()?.n, 1);
  } finally {
    old?.close();
    db?.close();
    f.close();
  }
});
