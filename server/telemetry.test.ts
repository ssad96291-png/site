import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { DatabaseSync } from "node:sqlite";
import { installTelemetry } from "./telemetry.js";

test("Optional live analytics retains only safe consented public events", async (t) => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE content(type TEXT,slug TEXT,data TEXT); CREATE TABLE inquiries(data TEXT);",
  );
  db.prepare("INSERT INTO content VALUES(?,?,?)").run(
    "product",
    "cam-balkon",
    JSON.stringify({ title: "Cam Balkon", published: true }),
  );
  db.prepare("INSERT INTO content VALUES(?,?,?)").run(
    "product",
    "draft-product",
    JSON.stringify({ title: "Private draft", published: false }),
  );
  db.prepare("INSERT INTO inquiries VALUES(?)").run(
    JSON.stringify({
      id: "inquiry-real",
      createdAt: new Date().toISOString(),
      status: "new",
    }),
  );
  const app = express();
  app.use(express.json());
  const telemetry = installTelemetry({
    app,
    db,
    production: false,
    readAdmin: (req) => req.get("x-test-role") === "admin",
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const sid = "abcdefghijklmnop123456789";
  const post = (body: unknown, path = "/api/telemetry") =>
    fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  const event = (extra: Record<string, unknown> = {}) => ({
    consent: true,
    sessionId: sid,
    kind: "pageview",
    path: "/",
    device: "desktop",
    ...extra,
  });
  const metrics = async () =>
    await (
      await fetch(base + "/api/admin/live", {
        headers: { "x-test-role": "admin" },
      })
    ).json();
  try {
    await t.test(
      "Rejects absent/false consent and admin metrics without permission",
      async () => {
        assert.equal(
          (await post({ sessionId: sid, kind: "pageview", path: "/" })).status,
          403,
        );
        assert.equal((await post(event({ consent: false }))).status, 403);
        assert.equal((await fetch(base + "/api/admin/live")).status, 403);
        assert.equal(
          (
            await fetch(base + "/api/admin/live", {
              headers: { "x-test-role": "editor" },
            })
          ).status,
          403,
        );
        assert.equal(
          (
            db
              .prepare("SELECT count(*) AS count FROM telemetry_events")
              .get() as any
          ).count,
          0,
        );
      },
    );
    await t.test(
      "Stores canonical public paths and server titles, not submitted identity or tokens",
      async () => {
        const response = await post(
          event({
            path: "/urunler?trackingToken=SECRET-TOKEN#secret",
            title: "Sensitive name 05550000000",
            name: "Private Name",
            phone: "05550000000",
            message: "PRIVATE-MESSAGE",
          }),
        );
        assert.equal(response.status, 202);
        const row = db.prepare("SELECT * FROM telemetry_events").get() as any;
        assert.equal(row.path, "/urunler");
        assert.equal(row.title, "Ürünler");
        assert.equal(row.maskedIp, "127.0.x.x");
        assert.notEqual(row.sessionId, sid);
        const stored = JSON.stringify(row);
        for (const value of [
          "SECRET-TOKEN",
          "Sensitive name",
          "Private Name",
          "05550000000",
          "PRIVATE-MESSAGE",
          sid,
        ])
          assert.equal(stored.includes(value), false, value);
      },
    );
    await t.test(
      "Rejects account/admin paths, unknown paths, malformed input and unpublished content",
      async () => {
        for (const path of [
          "/hesabim?claim=token",
          "/yonetim",
          "/api/admin/content",
          "/bayi/panel",
          "/%68esabim",
          "//evil.example/",
          "/unknown-private-user/abc",
          "/urunler/draft-product",
          "/%zz",
        ])
          assert.equal((await post(event({ path }))).status, 400, path);
        assert.equal((await post(event({ sessionId: "short" }))).status, 400);
        assert.equal(
          (await post(event({ kind: "record_screen" }))).status,
          400,
        );
        assert.equal(
          (await post(event({ path: "/urunler/cam-balkon" }))).status,
          202,
        );
      },
    );
    await t.test(
      "Heartbeats update one active session without fabricated metrics or extra stream rows",
      async () => {
        const before = Number(
          (
            db
              .prepare("SELECT count(*) AS count FROM telemetry_events")
              .get() as any
          ).count,
        );
        assert.equal(
          (
            await post(
              event({ kind: "heartbeat", path: "/urunler/cam-balkon" }),
            )
          ).status,
          202,
        );
        const data = await metrics();
        assert.equal(data.kpis.activeVisitors, 1);
        assert.equal(data.visitors.length, 1);
        assert.equal(data.kpis.todayLeads, 1);
        assert.equal(data.kpis.totalLeads, 1);
        assert.equal(data.kpis.completedLeads, 0);
        assert.equal(data.locationAvailable, false);
        assert.equal(data.stream.length, before);
        assert.equal(data.topProducts[0].title, "Cam Balkon");
        assert.equal(data.visitors[0].maskedIp, "127.0.x.x");
        assert.equal(data.visitors[0].id.length, 10);
        db.prepare("UPDATE telemetry_sessions SET lastSeen=?").run(
          Date.now() - 91_000,
        );
        assert.equal((await metrics()).kpis.activeVisitors, 0);
      },
    );
    await t.test(
      "Opt-out deletes only the supplied opaque browser session history",
      async () => {
        assert.equal(
          (await post(event({ sessionId: "another-browser-session-1234567" })))
            .status,
          202,
        );
        const response = await post(
          { sessionId: sid },
          "/api/telemetry/forget",
        );
        assert.equal(response.status, 200);
        const data = await metrics();
        assert.equal(data.visitors.length, 1);
        assert.equal(data.stream.length, 1);
        assert.equal(
          (await post({ sessionId: "bad" }, "/api/telemetry/forget")).status,
          400,
        );
      },
    );
    await t.test(
      "Prunes expired rows and enforces finite event/session retention caps",
      async () => {
        const old = Date.now() - 31 * 86400000;
        db.prepare("INSERT INTO telemetry_sessions VALUES(?,?,?,?,?,?,?)").run(
          "expired",
          "Gizli",
          "/",
          "Ana sayfa",
          "desktop",
          old,
          old,
        );
        db.prepare(
          "INSERT INTO telemetry_events VALUES(?,?,?,?,?,?,?,?,?)",
        ).run(
          "expired",
          "expired",
          "Gizli",
          "pageview",
          "/",
          "Ana sayfa",
          "desktop",
          null,
          old,
        );
        await metrics();
        assert.equal(
          db
            .prepare("SELECT id FROM telemetry_events WHERE id='expired'")
            .get(),
          undefined,
        );
        assert.equal(
          db
            .prepare("SELECT id FROM telemetry_sessions WHERE id='expired'")
            .get(),
          undefined,
        );
        const now = Date.now();
        db.exec("BEGIN");
        const add = db.prepare(
          "INSERT INTO telemetry_events VALUES(?,?,?,?,?,?,?,?,?)",
        );
        for (let i = 0; i < 10030; i++)
          add.run(
            "event-" + i,
            "bulk",
            "Gizli",
            "pageview",
            "/",
            "Ana sayfa",
            "desktop",
            null,
            now,
          );
        const sessions = db.prepare(
          "INSERT INTO telemetry_sessions VALUES(?,?,?,?,?,?,?)",
        );
        for (let i = 0; i < 2020; i++)
          sessions.run(
            "bulk-" + i,
            "Gizli",
            "/",
            "Ana sayfa",
            "desktop",
            now,
            now,
          );
        db.exec("COMMIT");
        const data = await metrics();
        assert.ok(
          (
            db
              .prepare("SELECT count(*) AS count FROM telemetry_events")
              .get() as any
          ).count <= 10000,
        );
        assert.ok(
          (
            db
              .prepare("SELECT count(*) AS count FROM telemetry_sessions")
              .get() as any
          ).count <= 2000,
        );
        assert.equal(data.kpis.activeVisitors, 2000);
        assert.equal(data.visitors.length, 100);
      },
    );
    await t.test("Rate-limits public event ingestion", async () => {
      let limited = false;
      for (let i = 0; i < 125; i++) {
        const response = await post(event({ kind: "heartbeat" }));
        if (response.status === 429) {
          limited = true;
          assert.equal(response.headers.get("retry-after"), "60");
          break;
        }
      }
      assert.equal(limited, true);
    });
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    telemetry.cleanup();
    db.close();
  }
});

test("Regional manager analytics excludes leads from other districts", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE content(type TEXT,slug TEXT,data TEXT); CREATE TABLE inquiries(data TEXT);",
  );
  for (const [district, status] of [
    ["Etimesgut", "closed"],
    ["Çankaya", "new"],
  ])
    db.prepare("INSERT INTO inquiries(data) VALUES(?)").run(
      JSON.stringify({ district, status, createdAt: new Date().toISOString() }),
    );
  const app = express();
  const telemetry = installTelemetry({
    app,
    db,
    readAdmin: () => ({ role: "manager", region: "Etimesgut" }),
  });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  try {
    const response = await fetch(
      `http://127.0.0.1:${(server.address() as any).port}/api/admin/live`,
    );
    assert.equal(response.status, 200);
    const report = await response.json();
    assert.equal(report.kpis.totalLeads, 1);
    assert.equal(report.kpis.completedLeads, 1);
    assert.equal(report.kpis.completionRate, 100);
    assert.equal(
      report.dailyLeads.reduce((n: number, d: any) => n + d.count, 0),
      1,
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    telemetry.cleanup();
    db.close();
  }
});
