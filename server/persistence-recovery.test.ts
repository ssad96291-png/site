import assert from "node:assert/strict";
import fs from "node:fs";
import { randomBytes } from "node:crypto";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { createApp } from "./app.js";
import { referencePagesVersion } from "./reference-content.js";
import { contentExpansionVersion, seedContent } from "./seed.js";
import {
  EncryptedDatabasePersistenceError,
  openSecureDatabase,
} from "./secure-database.js";

const envNames = [
  "ADMIN_PASSWORD",
  "DATA_ENCRYPTION_KEY",
  "DATA_ENCRYPTION_KEY_FILE",
  "DATA_MAX_DATABASE_MB",
] as const;
function fixture() {
  const home = fs.mkdtempSync(join(tmpdir(), "kilinc-persistence-recovery-"));
  const directory = join(home, "data");
  const saved = Object.fromEntries(
    envNames.map((name) => [name, process.env[name]]),
  );
  for (const name of envNames) delete process.env[name];
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.ADMIN_PASSWORD = randomBytes(24).toString("base64url");
  return {
    home,
    directory,
    close() {
      for (const name of envNames) {
        if (saved[name] === undefined) delete process.env[name];
        else process.env[name] = saved[name];
      }
      fs.rmSync(home, { recursive: true, force: true });
    },
  };
}
function persistenceFailure(
  actual: unknown,
  stage: string,
  storageCode: string,
): actual is EncryptedDatabasePersistenceError {
  assert.ok(actual instanceof EncryptedDatabasePersistenceError);
  assert.equal(actual.stage, stage);
  assert.equal(actual.storageCode, storageCode);
  assert.equal(actual.code, "ENCRYPTED_DATABASE_PERSISTENCE");
  return true;
}

test("Native serialization failures identify the snapshot stage without exposing SQL, values or private paths", () => {
  const f = fixture();
  const originalSerialize = DatabaseSync.prototype.serialize;
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec("CREATE TABLE records(value TEXT)");
    const previous = fs.readFileSync(join(f.directory, "site.sqlite.enc"));
    const sensitive =
      "SELECT SECRET-CUSTOMER-VALUE FROM C:\\Users\\private-customer\\private.sqlite";
    DatabaseSync.prototype.serialize = function () {
      throw Object.assign(new Error(sensitive), {
        code: "ERR_SQLITE_ERROR",
        sql: sensitive,
        path: sensitive,
      });
    };
    assert.throws(
      () =>
        db!
          .prepare("INSERT INTO records VALUES(?)")
          .run("UNACKNOWLEDGED-PRIVATE-VALUE"),
      (actual) => {
        persistenceFailure(actual, "serialize", "ERR_SQLITE_ERROR");
        const error = actual as EncryptedDatabasePersistenceError;
        assert.match(error.message, /görüntüsü hazırlanamadı/);
        assert.doesNotMatch(error.message, /diske kaydedilemedi/);
        assert.ok(error.cause instanceof Error);
        const exposed =
          error.message +
          String(error.stack) +
          String(error.cause) +
          JSON.stringify(error);
        for (const sentinel of [
          sensitive,
          "SECRET-CUSTOMER-VALUE",
          "private-customer",
          "UNACKNOWLEDGED-PRIVATE-VALUE",
        ])
          assert.equal(exposed.includes(sentinel), false, sentinel);
        return true;
      },
    );
    assert.deepEqual(
      fs.readFileSync(join(f.directory, "site.sqlite.enc")),
      previous,
    );
    assert.throws(
      () => db!.prepare("SELECT * FROM records").all(),
      (actual) => persistenceFailure(actual, "serialize", "ERR_SQLITE_ERROR"),
    );
    DatabaseSync.prototype.serialize = originalSerialize;
    db.close();
    db = openSecureDatabase(f.directory);
    assert.equal(db.prepare("SELECT count(*) AS n FROM records").get()?.n, 0);
  } finally {
    DatabaseSync.prototype.serialize = originalSerialize;
    db?.close();
    f.close();
  }
});

test("Replacement failure preserves the acknowledged ciphertext and its diagnostic even when temporary cleanup also fails", () => {
  const f = fixture();
  const originalRename = fs.renameSync;
  const originalUnlink = fs.unlinkSync;
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.directory);
    db.exec(
      "CREATE TABLE records(value TEXT); INSERT INTO records VALUES('ACKNOWLEDGED');",
    );
    const databaseFile = join(f.directory, "site.sqlite.enc");
    const previous = fs.readFileSync(databaseFile);
    fs.renameSync = (source, target) => {
      if (String(target) === databaseFile)
        throw Object.assign(new Error("PRIVATE-RENAME-PATH secret"), {
          code: "EBUSY",
          path: "PRIVATE-RENAME-PATH",
        });
      originalRename(source, target);
    };
    fs.unlinkSync = (path) => {
      if (
        /^\.site\.sqlite\.enc\.[a-f0-9]{24}\.tmp$/.test(basename(String(path)))
      )
        throw Object.assign(new Error("PRIVATE-CLEANUP-PATH secret"), {
          code: "EPERM",
        });
      originalUnlink(path);
    };
    syncBuiltinESMExports();
    assert.throws(
      () =>
        db!.prepare("INSERT INTO records VALUES(?)").run("NOT-ACKNOWLEDGED"),
      (actual) => {
        persistenceFailure(actual, "replace", "EBUSY");
        const error = actual as EncryptedDatabasePersistenceError;
        assert.match(error.message, /diske kaydedilemedi/);
        assert.doesNotMatch(
          error.message + String(error.cause),
          /EPERM|PRIVATE-RENAME-PATH|PRIVATE-CLEANUP-PATH/,
        );
        return true;
      },
    );
    assert.deepEqual(fs.readFileSync(databaseFile), previous);
    const temporary = fs
      .readdirSync(f.directory)
      .find((name) => /^\.site\.sqlite\.enc\.[a-f0-9]{24}\.tmp$/.test(name));
    assert.ok(
      temporary,
      "locked temporary snapshot remains available for later cleanup",
    );
    const bytes = fs.readFileSync(join(f.directory, temporary));
    assert.equal(bytes.subarray(0, 9).toString(), "KILINCDB1");
    assert.equal(bytes.includes(Buffer.from("NOT-ACKNOWLEDGED")), false);
    fs.renameSync = originalRename;
    fs.unlinkSync = originalUnlink;
    syncBuiltinESMExports();
    db.close();
    db = openSecureDatabase(f.directory);
    assert.deepEqual(
      db
        .prepare("SELECT value FROM records")
        .all()
        .map((row) => row.value),
      ["ACKNOWLEDGED"],
    );
  } finally {
    fs.renameSync = originalRename;
    fs.unlinkSync = originalUnlink;
    syncBuiltinESMExports();
    db?.close();
    f.close();
  }
});

test("A failed reference-page COMMIT releases startup locks and retries without losing custom content or recording an unpersisted migration", () => {
  const f = fixture();
  const originalSerialize = DatabaseSync.prototype.serialize;
  let app: ReturnType<typeof createApp> | undefined;
  let recovered: DatabaseSync | undefined;
  try {
    app = createApp({ dataDir: f.directory, production: false });
    const db = app.locals.db as DatabaseSync;
    const row = db
      .prepare(
        "SELECT id,data FROM content WHERE type='product' ORDER BY id LIMIT 1",
      )
      .get() as { id: string; data: string };
    const data = {
      ...JSON.parse(row.data),
      title: "CUSTOM-OPERATOR-TITLE-RETAINED",
      body: "CUSTOM-OPERATOR-BODY-RETAINED",
    };
    db.prepare("UPDATE content SET data=? WHERE id=?").run(
      JSON.stringify(data),
      row.id,
    );
    const idsBefore = db
      .prepare("SELECT id FROM content ORDER BY id")
      .all()
      .map((item) => item.id);
    const versionCount = Number(
      (db.prepare("SELECT count(*) AS n FROM schema_migrations").get() as any)
        .n,
    );
    db.prepare("DELETE FROM schema_migrations WHERE version=?").run(
      referencePagesVersion,
    );
    app.locals.close();
    app = undefined;
    let injected = false;
    DatabaseSync.prototype.serialize = function (
      ...args: Parameters<typeof originalSerialize>
    ) {
      const marker = this.prepare(
        "SELECT version FROM schema_migrations WHERE version=?",
      ).get(referencePagesVersion);
      if (!injected && marker && !this.isTransaction) {
        injected = true;
        throw Object.assign(
          new Error(
            "private SQL or customer text must never leave this injected exception",
          ),
          { code: "ERR_SQLITE_ERROR" },
        );
      }
      return originalSerialize.apply(this, args);
    };
    assert.throws(
      () => createApp({ dataDir: f.directory, production: false }),
      (actual) => persistenceFailure(actual, "serialize", "ERR_SQLITE_ERROR"),
    );
    assert.equal(
      injected,
      true,
      "failure is injected at the migration's autocommit snapshot",
    );
    DatabaseSync.prototype.serialize = originalSerialize;
    assert.equal(fs.existsSync(join(f.directory, ".database.lock")), false);
    assert.equal(
      fs.existsSync(join(f.directory, ".database.lock.guard")),
      false,
    );
    recovered = openSecureDatabase(f.directory);
    assert.equal(
      recovered
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(referencePagesVersion),
      undefined,
    );
    assert.equal(
      Number(
        (
          recovered
            .prepare("SELECT count(*) AS n FROM schema_migrations")
            .get() as any
        ).n,
      ),
      versionCount - 1,
    );
    assert.deepEqual(
      JSON.parse(
        (
          recovered
            .prepare("SELECT data FROM content WHERE id=?")
            .get(row.id) as any
        ).data,
      ),
      data,
    );
    recovered.close();
    recovered = undefined;
    app = createApp({ dataDir: f.directory, production: false });
    assert.deepEqual(
      app.locals.db
        .prepare("SELECT id FROM content ORDER BY id")
        .all()
        .map((item: any) => item.id),
      idsBefore,
    );
    assert.deepEqual(
      JSON.parse(
        app.locals.db.prepare("SELECT data FROM content WHERE id=?").get(row.id)
          .data,
      ),
      data,
    );
    assert.ok(
      app.locals.db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(referencePagesVersion),
    );
    assert.equal(
      Number(
        app.locals.db
          .prepare("SELECT count(*) AS n FROM schema_migrations")
          .get().n,
      ),
      versionCount,
    );
  } finally {
    DatabaseSync.prototype.serialize = originalSerialize;
    recovered?.close();
    app?.locals.close();
    f.close();
  }
});

test("Initial settings and the base catalogue are committed together so a failed first snapshot can restart cleanly", () => {
  const f = fixture();
  const originalSerialize = DatabaseSync.prototype.serialize;
  const baseCount = seedContent().length;
  let app: ReturnType<typeof createApp> | undefined;
  let recovered: DatabaseSync | undefined;
  let injected = false;
  try {
    DatabaseSync.prototype.serialize = function (
      ...args: Parameters<typeof originalSerialize>
    ) {
      const table = this.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='settings'",
      ).get();
      if (table && !injected && !this.isTransaction) {
        const settings = this.prepare("SELECT id FROM settings LIMIT 1").get();
        const count = Number(
          (this.prepare("SELECT count(*) AS n FROM content").get() as any).n,
        );
        const expansion = this.prepare(
          "SELECT version FROM schema_migrations WHERE version=?",
        ).get(contentExpansionVersion);
        if (settings && count === baseCount && !expansion) {
          injected = true;
          throw Object.assign(
            new Error("injected first catalogue snapshot failure"),
            { code: "ERR_SQLITE_ERROR" },
          );
        }
      }
      return originalSerialize.apply(this, args);
    };
    assert.throws(
      () => createApp({ dataDir: f.directory, production: false }),
      (actual) => persistenceFailure(actual, "serialize", "ERR_SQLITE_ERROR"),
    );
    assert.equal(injected, true);
    DatabaseSync.prototype.serialize = originalSerialize;
    assert.equal(fs.existsSync(join(f.directory, ".database.lock")), false);
    recovered = openSecureDatabase(f.directory);
    assert.equal(
      Number(
        (recovered.prepare("SELECT count(*) AS n FROM settings").get() as any)
          .n,
      ),
      0,
    );
    assert.equal(
      Number(
        (recovered.prepare("SELECT count(*) AS n FROM content").get() as any).n,
      ),
      0,
    );
    recovered.close();
    recovered = undefined;
    app = createApp({ dataDir: f.directory, production: false });
    assert.equal(
      Number(
        app.locals.db.prepare("SELECT count(*) AS n FROM settings").get().n,
      ),
      1,
    );
    assert.equal(
      Number(
        app.locals.db.prepare("SELECT count(*) AS n FROM content").get().n,
      ),
      76,
    );
    assert.ok(
      app.locals.db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(referencePagesVersion),
    );
  } finally {
    DatabaseSync.prototype.serialize = originalSerialize;
    recovered?.close();
    app?.locals.close();
    f.close();
  }
});
