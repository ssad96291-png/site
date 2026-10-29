import assert from "node:assert/strict";
import { createCipheriv, createHash, hkdfSync, randomBytes } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import type { DatabaseSync } from "node:sqlite";
import { createApp } from "./app.js";
import {
  createPortableBackup,
  decodePortableBackup,
  exportBusinessJson,
  restorePortableBackup,
  type BackupManifest,
} from "./data-portability.js";
import { readProtectedFile, writeProtectedFile } from "./private-storage.js";
import { openSecureDatabase } from "./secure-database.js";

const envNames = [
  "ADMIN_PASSWORD",
  "DATA_ENCRYPTION_KEY",
  "DATA_ENCRYPTION_KEY_FILE",
  "DATA_MAX_DATABASE_MB",
  "CLAMAV_HOST",
  "CLAMAV_PORT",
] as const;
function fixture() {
  const home = mkdtempSync(join(tmpdir(), "kilinc-platform-security-"));
  const dataDir = join(home, "data");
  const saved = Object.fromEntries(
    envNames.map((name) => [name, process.env[name]]),
  );
  for (const name of envNames) delete process.env[name];
  const master = randomBytes(32);
  const password = randomBytes(24).toString("base64url");
  process.env.DATA_ENCRYPTION_KEY = master.toString("base64");
  process.env.ADMIN_PASSWORD = password;
  return {
    home,
    dataDir,
    master,
    password,
    close() {
      for (const name of envNames) {
        const before = saved[name];
        if (before === undefined) delete process.env[name];
        else process.env[name] = before;
      }
      rmSync(home, { recursive: true, force: true });
    },
  };
}

// Construct an authenticated but hostile interchange payload: the file-name
// allowlist must still reject it even when its sender knows the backup key.
function sealManifest(manifest: BackupManifest, master: Buffer) {
  const { gzipSync } = requireZlib;
  const magic = Buffer.from("KILINCBK1");
  const nonce = randomBytes(12);
  const key = Buffer.from(
    hkdfSync("sha256", master, Buffer.alloc(0), "portable-backup-v1", 32),
  );
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(magic);
  const body = Buffer.concat([
    cipher.update(gzipSync(Buffer.from(JSON.stringify(manifest)))),
    cipher.final(),
  ]);
  return Buffer.concat([magic, nonce, cipher.getAuthTag(), body]);
}
import * as requireZlib from "node:zlib";

test("Private attachments authenticate their content and storage path and fail closed on tampering", () => {
  const f = fixture();
  try {
    const context = { dataDir: f.dataDir, production: false };
    const path = join(f.dataDir, "project-files", "original.bin");
    const message = Buffer.from(
      "PRIVATE DRAWING SENTINEL — never stored as plaintext",
    );
    writeProtectedFile(path, message, context);
    const encrypted = readFileSync(path);
    assert.equal(encrypted.includes(message), false);
    assert.deepEqual(readProtectedFile(path, context), message);
    assert.throws(
      () => writeProtectedFile(path, Buffer.from("replacement"), context),
      /mevcut/,
    );

    const moved = join(f.dataDir, "project-files", "renamed.bin");
    copyFileSync(path, moved);
    assert.throws(() => readProtectedFile(moved, context), /bütünlüğü/);
    process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    assert.throws(() => readProtectedFile(path, context), /bütünlüğü/);
    process.env.DATA_ENCRYPTION_KEY = f.master.toString("base64");

    const tampered = Buffer.from(encrypted);
    tampered[tampered.length - 1] ^= 1;
    writeFileSync(path, tampered);
    assert.throws(() => readProtectedFile(path, context), /bütünlüğü/);
    tampered[0] ^= 1;
    writeFileSync(path, tampered);
    assert.throws(() => readProtectedFile(path, context), /biçimi/);
    const legacy = join(f.dataDir, "private-documents", "legacy.pdf");
    mkdirSync(join(f.dataDir, "private-documents"), { recursive: true });
    writeFileSync(legacy, "%PDF-1.4 plaintext legacy");
    assert.throws(() => readProtectedFile(legacy, context), /biçimi/);
    assert.throws(
      () => writeProtectedFile(join(f.home, "outside.bin"), message, context),
      /konumu/,
    );
  } finally {
    f.close();
  }
});

test("A portable encrypted backup restores the database and both file classes using a separately held key", () => {
  const f = fixture();
  let source: DatabaseSync | undefined;
  let restored: DatabaseSync | undefined;
  try {
    source = openSecureDatabase(f.dataDir, false);
    source.exec("CREATE TABLE records(id TEXT PRIMARY KEY,data TEXT NOT NULL)");
    const record = {
      name: "Sentetik taşınabilir müşteri",
      message: "PRIVATE CUSTOMER MESSAGE SENTINEL",
    };
    source
      .prepare("INSERT INTO records VALUES(?,?)")
      .run("customer-1", JSON.stringify(record));
    const privatePath = join(f.dataDir, "project-files", "drawing.bin");
    writeProtectedFile(privatePath, Buffer.from("PRIVATE CAD FILE SENTINEL"), {
      dataDir: f.dataDir,
      production: false,
    });
    mkdirSync(join(f.dataDir, "uploads"), { recursive: true });
    const publicImage = Buffer.from("synthetic-public-image-bytes");
    writeFileSync(join(f.dataDir, "uploads", "cover.png"), publicImage);
    const backup = createPortableBackup(source, f.dataDir, false);
    assert.equal(backup.includes(Buffer.from(record.message)), false);
    assert.equal(backup.includes(f.master), false);
    assert.equal(
      backup.includes(Buffer.from(f.master.toString("base64"))),
      false,
    );
    const decoded = decodePortableBackup(backup, f.master);
    assert.equal(decoded.format, "kilinc-backup-v1");
    assert.equal(decoded.tables.records, 1);
    assert.deepEqual(decoded.files.map((file) => file.path).sort(), [
      "project-files/drawing.bin",
      "site.sqlite.enc",
      "uploads/cover.png",
    ]);
    assert.throws(
      () => decodePortableBackup(backup, randomBytes(32)),
      /doğrulanamadı/,
    );
    const tampered = Buffer.from(backup);
    tampered[tampered.length - 1] ^= 1;
    assert.throws(
      () => decodePortableBackup(tampered, f.master),
      /doğrulanamadı/,
    );
    const target = join(f.home, "restored");
    restorePortableBackup(backup, f.master, target);
    assert.equal(
      Buffer.from(
        readFileSync(target + ".key", "utf8").trim(),
        "base64",
      ).equals(f.master),
      true,
    );
    restored = openSecureDatabase(target, true);
    assert.deepEqual(
      JSON.parse(
        String(
          restored
            .prepare("SELECT data FROM records WHERE id=?")
            .get("customer-1")?.data,
        ),
      ),
      record,
    );
    assert.deepEqual(
      readProtectedFile(join(target, "project-files", "drawing.bin"), {
        dataDir: target,
        production: true,
      }),
      Buffer.from("PRIVATE CAD FILE SENTINEL"),
    );
    assert.deepEqual(
      readFileSync(join(target, "uploads", "cover.png")),
      publicImage,
    );
    assert.throws(
      () => restorePortableBackup(backup, f.master, target),
      /mevcut olmamalıdır/,
    );
    assert.deepEqual(
      readFileSync(join(target, "uploads", "cover.png")),
      publicImage,
    );
    assert.equal(existsSync(join(target, "site.sqlite")), false);
  } finally {
    restored?.close();
    source?.close();
    f.close();
  }
});

test("Authenticated backup traversal, duplicate names and forged file digests cannot create or overwrite files", () => {
  const f = fixture();
  let source: DatabaseSync | undefined;
  try {
    source = openSecureDatabase(f.dataDir, false);
    source.exec("CREATE TABLE records(value TEXT)");
    const decoded = decodePortableBackup(
      createPortableBackup(source, f.dataDir, false),
      f.master,
    );
    const sample = Buffer.from("hostile content");
    const entry = {
      path: "../outside.txt",
      size: sample.length,
      sha256: createHash("sha256").update(sample).digest("hex"),
      content: sample.toString("base64"),
    };
    for (const path of [
      "../outside.txt",
      "/tmp/absolute.bin",
      "project-files/../../outside.bin",
      "project-files/sub/f.bin",
      "uploads/evil.svg",
    ]) {
      const manifest = {
        ...decoded,
        files: [...decoded.files, { ...entry, path }],
      };
      const target = join(f.home, "rejected");
      assert.throws(
        () =>
          restorePortableBackup(
            sealManifest(manifest, f.master),
            f.master,
            target,
          ),
        /geçersiz/,
      );
      assert.equal(existsSync(target), false);
    }
    assert.equal(existsSync(join(f.home, "outside.txt")), false);
    assert.throws(
      () =>
        decodePortableBackup(
          sealManifest(
            { ...decoded, files: [...decoded.files, decoded.files[0]] },
            f.master,
          ),
          f.master,
        ),
      /geçersiz/,
    );
    assert.throws(
      () =>
        decodePortableBackup(
          sealManifest(
            {
              ...decoded,
              files: [{ ...decoded.files[0], sha256: "0".repeat(64) }],
            },
            f.master,
          ),
          f.master,
        ),
      /bütünlüğü/,
    );
  } finally {
    source?.close();
    f.close();
  }
});

test("Business JSON retains useful customer data while excluding passwords, login sessions and recovery tokens", () => {
  const f = fixture();
  let db: DatabaseSync | undefined;
  try {
    db = openSecureDatabase(f.dataDir, false);
    db.exec(
      "CREATE TABLE users(username TEXT,password TEXT); CREATE TABLE sessions(token TEXT); CREATE TABLE portal_sessions(token TEXT); CREATE TABLE portal_staff_sessions(token TEXT); CREATE TABLE portal_tokens(token TEXT); CREATE TABLE rate_limits(key TEXT); CREATE TABLE portal_staff(id TEXT,password TEXT,data TEXT); CREATE TABLE portal_customers(id TEXT,password TEXT,data TEXT); CREATE TABLE support_messages(id TEXT,data TEXT)",
    );
    db.prepare("INSERT INTO users VALUES(?,?)").run(
      "admin",
      "SECRET_ADMIN_HASH",
    );
    for (const name of [
      "sessions",
      "portal_sessions",
      "portal_staff_sessions",
      "portal_tokens",
    ])
      db.prepare(`INSERT INTO ${name} VALUES(?)`).run("SECRET_AUTH_TOKEN");
    db.prepare("INSERT INTO rate_limits VALUES(?)").run(
      "SECRET_RATE_IDENTIFIER",
    );
    db.prepare("INSERT INTO portal_staff VALUES(?,?,?)").run(
      "s1",
      "SECRET_STAFF_HASH",
      JSON.stringify({ name: "Sentetik personel", role: "editor" }),
    );
    db.prepare("INSERT INTO portal_customers VALUES(?,?,?)").run(
      "c1",
      "SECRET_CUSTOMER_HASH",
      JSON.stringify({
        name: "Sentetik müşteri",
        contactEmail: "synthetic@example.invalid",
      }),
    );
    db.prepare("INSERT INTO support_messages VALUES(?,?)").run(
      "m1",
      JSON.stringify({ message: "Müşterinin sentetik destek mesajı" }),
    );
    const exported = exportBusinessJson(db);
    assert.equal(exported.authenticationSecretsExcluded, true);
    for (const name of [
      "users",
      "sessions",
      "portal_sessions",
      "portal_staff_sessions",
      "portal_tokens",
      "rate_limits",
    ])
      assert.equal(exported.tables[name], undefined);
    assert.equal(
      exported.tables.portal_customers[0].data.name,
      "Sentetik müşteri",
    );
    assert.equal(
      exported.tables.support_messages[0].data.message,
      "Müşterinin sentetik destek mesajı",
    );
    assert.doesNotMatch(
      JSON.stringify(exported),
      /SECRET_ADMIN_HASH|SECRET_STAFF_HASH|SECRET_CUSTOMER_HASH|SECRET_AUTH_TOKEN|SECRET_RATE_IDENTIFIER/,
    );
    assert.equal(exported.tables.portal_staff[0].password, undefined);
    assert.equal(exported.tables.portal_customers[0].password, undefined);
  } finally {
    db?.close();
    f.close();
  }
});

test("System exports require the primary admin and current password; status and event logs do not leak request secrets", async () => {
  const f = fixture();
  const app = createApp({ dataDir: f.dataDir, production: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = "";
  const request = (
    path: string,
    method = "GET",
    body?: unknown,
    overrideCookie?: string,
  ) =>
    fetch(base + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...((overrideCookie ?? cookie)
          ? { Cookie: overrideCookie ?? cookie }
          : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  try {
    assert.equal((await request("/api/admin/system/status")).status, 401);
    const login = await request("/api/admin/login", "POST", {
      username: "admin",
      password: f.password,
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie")!.split(";")[0];
    const status = await request("/api/admin/system/status");
    assert.equal(status.status, 200);
    assert.equal(status.headers.get("cache-control"), "no-store");
    const detail = await status.json();
    assert.equal(detail.database.enabled, true);
    assert.equal(detail.database.singleProcess, true);
    assert.ok(detail.counts.content > 0);
    assert.equal(detail.scanner.mode, "limited");
    assert.equal(detail.scanner.configured, false);
    assert.doesNotMatch(JSON.stringify(detail), new RegExp(f.password));
    assert.equal(
      JSON.stringify(detail).includes(f.master.toString("base64")),
      false,
    );
    assert.equal(
      JSON.stringify(detail).includes(f.master.toString("hex")),
      false,
    );

    const staffCreated = await request("/api/admin/staff", "POST", {
      username: "platform_editor",
      name: "Sentetik editör",
      role: "editor",
      status: "active",
      password: "editor-password-private-2026",
    });
    assert.equal(staffCreated.status, 201);
    const staffLogin = await request(
      "/api/staff/login",
      "POST",
      {
        username: "platform_editor",
        password: "editor-password-private-2026",
      },
      "",
    );
    assert.equal(staffLogin.status, 200);
    const staffCookie = staffLogin.headers.get("set-cookie")!.split(";")[0];
    for (const path of ["status", "backup", "key-export"])
      assert.equal(
        (
          await request(
            "/api/admin/system/" + path,
            path === "status" ? "GET" : "POST",
            path === "status" ? undefined : { currentPassword: f.password },
            staffCookie,
          )
        ).status,
        403,
      );

    assert.equal(
      (
        await request("/api/admin/system/backup", "POST", {
          currentPassword: "wrong-password-secret",
        })
      ).status,
      403,
    );
    assert.equal(
      (await request("/api/admin/system/key-export", "POST", {})).status,
      403,
    );
    const backup = await request("/api/admin/system/backup", "POST", {
      currentPassword: f.password,
    });
    assert.equal(backup.status, 200);
    assert.match(backup.headers.get("content-disposition")!, /\.kilincbackup/);
    const encrypted = Buffer.from(await backup.arrayBuffer());
    const manifest = decodePortableBackup(encrypted, f.master);
    assert.ok(manifest.tables.portal_customers !== undefined);
    assert.equal(encrypted.includes(Buffer.from(f.password)), false);
    const key = await request("/api/admin/system/key-export", "POST", {
      currentPassword: f.password,
    });
    assert.equal(key.status, 200);
    assert.equal(
      Buffer.from((await key.text()).trim(), "base64").equals(f.master),
      true,
    );

    const secret = "DO_NOT_LOG_IDENTITIES_OR_TOKENS";
    await fetch(base + "/api/customer/" + secret + "?token=" + secret, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://wrong-origin.invalid",
      },
      body: JSON.stringify({
        password: secret,
        email: secret,
        message: secret,
      }),
    });
    await request(
      "/api/admin/system/status?password=" + secret,
      "GET",
      undefined,
      "",
    );
    await new Promise<void>((resolve) => setImmediate(resolve));
    const events = app.locals.db
      .prepare("SELECT action,route,status FROM security_events")
      .all();
    assert.ok(events.length >= 3);
    assert.equal(JSON.stringify(events).includes(secret), false);
    assert.equal(
      JSON.stringify(events).includes("wrong-password-secret"),
      false,
    );
    assert.equal(JSON.stringify(events).includes(f.password), false);
    assert.ok(
      events.some(
        (event: any) =>
          event.route === "POST /api/customer/:id" && event.status === 403,
      ),
    );
    assert.ok(events.every((event: any) => !/[?@]/.test(event.route)));
    const audits = app.locals.db
      .prepare("SELECT actor,action,target FROM audit")
      .all();
    assert.ok(
      audits.some((entry: any) => entry.action === "ENCRYPTED_BACKUP_EXPORT"),
    );
    assert.ok(
      audits.some((entry: any) => entry.action === "ENCRYPTION_KEY_EXPORT"),
    );
    assert.equal(JSON.stringify(audits).includes(f.password), false);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    f.close();
  }
});
