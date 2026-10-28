import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "./app.js";
import {
  migrateSingleShopOperations,
  singleShopOperationsVersion,
} from "./single-shop.js";

function migrationFixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE portal_staff(id TEXT PRIMARY KEY,username TEXT,password TEXT,data TEXT);
    CREATE TABLE portal_staff_sessions(token TEXT PRIMARY KEY,staffId TEXT,expires INTEGER);
    CREATE TABLE portal_inquiries(inquiryId TEXT PRIMARY KEY,customerId TEXT,data TEXT);
    CREATE TABLE portal_notifications(id TEXT PRIMARY KEY,message TEXT);
    CREATE TABLE portal_outbox(id TEXT PRIMARY KEY,payload TEXT);
    CREATE TABLE portal_dealers(id TEXT PRIMARY KEY,data TEXT);
    CREATE TABLE portal_documents(id TEXT PRIMARY KEY,data TEXT);
    CREATE TABLE portal_customers(id TEXT PRIMARY KEY,data TEXT);
  `);
  const staff = {
    role: "dealer",
    dealerId: "legacy-contact",
    status: "active",
    createdAt: "2024-02-03T10:00:00.000Z",
    operatorNote: "PRIVATE_OPERATOR_CANARY",
  };
  db.prepare("INSERT INTO portal_staff VALUES(?,?,?,?)").run(
    "legacy-staff",
    "legacy.staff",
    "existing-password-hash",
    JSON.stringify(staff),
  );
  db.prepare("INSERT INTO portal_staff VALUES(?,?,?,?)").run(
    "editor",
    "existing.editor",
    "editor-password-hash",
    JSON.stringify({ role: "editor", status: "active" }),
  );
  db.prepare("INSERT INTO portal_staff_sessions VALUES(?,?,?)").run(
    "old-session",
    "legacy-staff",
    Date.now() + 100000,
  );
  db.prepare("INSERT INTO portal_staff_sessions VALUES(?,?,?)").run(
    "editor-session",
    "editor",
    Date.now() + 100000,
  );
  const state = {
    dealerId: "legacy-contact",
    customerMessage: "Firmamızın kendi notu; otomatik mesaj değildir.",
    timeline: [
      { id: "generated", message: "Bayi / keşif atandı" },
      { id: "auto-routed", message: "Bölgenizdeki ekip talebinize atandı." },
      { id: "custom", message: "Bayi ile ilgili müşterinin kendi özgün notu." },
    ],
  };
  db.prepare("INSERT INTO portal_inquiries VALUES(?,?,?)").run(
    "existing-request",
    "existing-customer",
    JSON.stringify(state),
  );
  db.prepare("INSERT INTO portal_notifications VALUES(?,?)").run(
    "generated",
    "Bayi / keşif atandı",
  );
  db.prepare("INSERT INTO portal_notifications VALUES(?,?)").run(
    "custom",
    "Özel bildirim korunmalı.",
  );
  db.prepare("INSERT INTO portal_outbox VALUES(?,?)").run(
    "generated",
    JSON.stringify({
      message: "Bayi / keşif atandı",
      destination: "private@example.invalid",
    }),
  );
  db.prepare("INSERT INTO portal_outbox VALUES(?,?)").run(
    "custom",
    JSON.stringify({ message: "Özel müşteri mesajı." }),
  );
  for (const [table, id, data] of [
    [
      "portal_dealers",
      "legacy-contact",
      {
        id: "legacy-contact",
        address: "PRIVATE_LEGACY_ADDRESS",
        regions: ["Etimesgut"],
      },
    ],
    [
      "portal_documents",
      "private-document",
      { filename: "private-document.pdf" },
    ],
    [
      "portal_customers",
      "existing-customer",
      { name: "Existing customer", status: "active" },
    ],
  ] as const)
    db.prepare(`INSERT INTO ${table} VALUES(?,?)`).run(
      id,
      JSON.stringify(data),
    );
  return db;
}

test("Single-shop migration preserves records and invalidates only obsolete-role sessions once", () => {
  const db = migrationFixture();
  try {
    const preserved = [
      "portal_dealers",
      "portal_documents",
      "portal_customers",
    ].map((table) =>
      JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all()),
    );
    migrateSingleShopOperations(db);
    const row = db
      .prepare("SELECT * FROM portal_staff WHERE id=?")
      .get("legacy-staff") as any;
    const data = JSON.parse(row.data);
    assert.equal(data.role, "technician");
    assert.equal(data.teamId, "legacy-contact");
    assert.equal(data.dealerId, undefined);
    assert.equal(data.createdAt, "2024-02-03T10:00:00.000Z");
    assert.equal(data.operatorNote, "PRIVATE_OPERATOR_CANARY");
    assert.equal(row.password, "existing-password-hash");
    assert.equal(
      db
        .prepare(
          "SELECT * FROM portal_staff_sessions WHERE token='old-session'",
        )
        .get(),
      undefined,
    );
    assert.ok(
      db
        .prepare(
          "SELECT * FROM portal_staff_sessions WHERE token='editor-session'",
        )
        .get(),
    );
    const state = JSON.parse(
      (
        db
          .prepare(
            "SELECT data FROM portal_inquiries WHERE inquiryId='existing-request'",
          )
          .get() as any
      ).data,
    );
    assert.equal(state.dealerId, "legacy-contact");
    assert.equal(
      state.customerMessage,
      "Firmamızın kendi notu; otomatik mesaj değildir.",
    );
    assert.deepEqual(
      state.timeline.map((entry: any) => entry.message),
      [
        "Keşif planlanıyor",
        "Talebiniz için planlama kaydı oluşturuldu.",
        "Bayi ile ilgili müşterinin kendi özgün notu.",
      ],
    );
    assert.equal(
      (
        db
          .prepare(
            "SELECT message FROM portal_notifications WHERE id='generated'",
          )
          .get() as any
      ).message,
      "Keşif planlanıyor",
    );
    assert.equal(
      (
        db
          .prepare("SELECT message FROM portal_notifications WHERE id='custom'")
          .get() as any
      ).message,
      "Özel bildirim korunmalı.",
    );
    const payload = JSON.parse(
      (
        db
          .prepare("SELECT payload FROM portal_outbox WHERE id='generated'")
          .get() as any
      ).payload,
    );
    assert.equal(payload.message, "Keşif planlanıyor");
    assert.equal(payload.destination, "private@example.invalid");
    assert.deepEqual(
      ["portal_dealers", "portal_documents", "portal_customers"].map((table) =>
        JSON.stringify(db.prepare(`SELECT * FROM ${table}`).all()),
      ),
      preserved,
    );
    assert.ok(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(singleShopOperationsVersion),
    );
    db.prepare("INSERT INTO portal_staff_sessions VALUES(?,?,?)").run(
      "new-session",
      "legacy-staff",
      Date.now() + 100000,
    );
    migrateSingleShopOperations(db);
    assert.ok(
      db
        .prepare(
          "SELECT * FROM portal_staff_sessions WHERE token='new-session'",
        )
        .get(),
      "restart keeps newly authenticated technician sessions",
    );
  } finally {
    db.close();
  }
});

test("Single-shop migration rolls back all partial updates if legacy data is malformed", () => {
  const db = migrationFixture();
  try {
    db.prepare(
      "UPDATE portal_outbox SET payload='malformed-json' WHERE id='generated'",
    ).run();
    assert.throws(() => migrateSingleShopOperations(db));
    assert.equal(
      JSON.parse(
        (
          db
            .prepare("SELECT data FROM portal_staff WHERE id='legacy-staff'")
            .get() as any
        ).data,
      ).role,
      "dealer",
    );
    assert.ok(
      db
        .prepare(
          "SELECT token FROM portal_staff_sessions WHERE token='old-session'",
        )
        .get(),
    );
    assert.equal(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(singleShopOperationsVersion),
      undefined,
    );
    db.prepare("UPDATE portal_outbox SET payload=? WHERE id='generated'").run(
      JSON.stringify({ message: "Bayi / keşif atandı" }),
    );
    migrateSingleShopOperations(db);
    assert.equal(
      JSON.parse(
        (
          db
            .prepare("SELECT data FROM portal_staff WHERE id='legacy-staff'")
            .get() as any
        ).data,
      ).role,
      "technician",
    );
  } finally {
    db.close();
  }
});

test("One-shop enquiries remain unassigned until explicit scheduling; retired directories cannot create records", async () => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-single-shop-api-"));
  const password = randomBytes(24).toString("base64url");
  const old = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = password;
  const app = createApp({ dataDir: dir, production: false });
  if (old === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = old;
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const req = (path: string, method = "GET", body?: unknown, cookie = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  try {
    const login = await req("/api/admin/login", "POST", {
      username: "admin",
      password,
    });
    assert.equal(login.status, 200);
    const admin = login.headers.get("set-cookie")!.split(";")[0];
    const legacy = {
      id: "legacy-internal-contact",
      name: "Internal technical contact",
      contactName: "Synthetic technician",
      phone: "05000000000",
      email: "technical@example.invalid",
      active: true,
      city: "Ankara",
      address: "PRIVATE_LEGACY_ADDRESS",
      regions: ["Etimesgut"],
      createdAt: "2024-02-03T10:00:00.000Z",
      updatedAt: "2024-02-03T10:00:00.000Z",
    };
    app.locals.db
      .prepare("INSERT INTO portal_dealers VALUES(?,?)")
      .run(legacy.id, JSON.stringify(legacy));
    const created = await req("/api/inquiries", "POST", {
      name: "Synthetic single shop request",
      email: "request@example.invalid",
      phone: "05000000000",
      message: "Synthetic request; no automatic external assignment.",
      district: "Etimesgut",
      consent: true,
    });
    assert.equal(created.status, 201);
    const receipt = await created.json();
    const pipeline = await (
      await req("/api/admin/pipeline", "GET", undefined, admin)
    ).json();
    const inquiry = pipeline.inquiries.find(
      (item: any) => item.id === receipt.id,
    );
    assert.equal(inquiry.stage, "received");
    assert.equal(inquiry.teamId, "");
    assert.equal(inquiry.assignedTeam, null);
    assert.equal(inquiry.dealerId, undefined);
    for (const path of ["/api/dealers", "/api/admin/dealers"]) {
      for (const method of ["GET", "POST"])
        assert.equal(
          (
            await req(
              path,
              method,
              method === "POST" ? { name: "Forbidden record" } : undefined,
              path.includes("/admin/") ? admin : "",
            )
          ).status,
          410,
        );
    }
    assert.equal(
      (
        app.locals.db
          .prepare("SELECT count(*) AS total FROM portal_dealers")
          .get() as any
      ).total,
      1,
    );
    assert.equal(
      (
        await req(
          "/api/admin/staff",
          "POST",
          {
            username: "obsolete.role",
            password,
            role: "dealer",
            dealerId: legacy.id,
          },
          admin,
        )
      ).status,
      400,
    );
    const teams = await (
      await req("/api/admin/teams", "GET", undefined, admin)
    ).json();
    assert.equal(teams.teams.length, 1);
    assert.equal(teams.teams[0].updatedAt, legacy.updatedAt);
    assert.doesNotMatch(
      JSON.stringify(teams),
      /PRIVATE_LEGACY_ADDRESS|"regions"|"city"/,
    );
    const claimed = await req("/api/customer/claim", "POST", {
      token: receipt.trackingToken,
    });
    assert.equal(claimed.status, 200);
    const customer = claimed.headers.get("set-cookie")!.split(";")[0];
    const before = await (
      await req(
        "/api/customer/inquiries/" + receipt.id,
        "GET",
        undefined,
        customer,
      )
    ).json();
    assert.equal(before.inquiry.assignedTeam, null);
    assert.equal(
      (
        await req(
          "/api/admin/pipeline/" + receipt.id,
          "PATCH",
          { teamId: legacy.id, stage: "assigned" },
          admin,
        )
      ).status,
      200,
    );
    const after = await (
      await req(
        "/api/customer/inquiries/" + receipt.id,
        "GET",
        undefined,
        customer,
      )
    ).json();
    assert.equal(after.inquiry.assignedTeam.id, legacy.id);
    assert.equal(after.inquiry.stage, "assigned");
    assert.ok(
      after.inquiry.timeline.some(
        (entry: any) => entry.message === "Keşif planlanıyor",
      ),
    );
    assert.doesNotMatch(
      JSON.stringify(after),
      /PRIVATE_LEGACY_ADDRESS|"regions"|"dealer"|"dealerId"/,
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
