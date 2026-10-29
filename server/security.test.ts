import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";
import { randomBytes } from "node:crypto";
import { startTestScanner } from "./scanner-fixture.test-helper.js";
import { expansionContent, contentExpansionVersion } from "./seed.js";

test("CMS extensions, private CRM exports, audit and hardened request boundaries", async (t) => {
  const dataDir = mkdtempSync(join(tmpdir(), "kilinc-security-"));
  const scanner = await startTestScanner();
  const saved = { DATA_ENCRYPTION_KEY: process.env.DATA_ENCRYPTION_KEY, CLAMAV_HOST: process.env.CLAMAV_HOST, CLAMAV_PORT: process.env.CLAMAV_PORT };
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("base64");
  process.env.CLAMAV_HOST = scanner.host; process.env.CLAMAV_PORT = scanner.port;
  let app = createApp({ dataDir, production: true });
  let server = app.listen(0, "127.0.0.1");
  await new Promise<void>(r => server.once("listening", r));
  let base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = "";
  const password = readFileSync(dataDir + ".initial-admin-password", "utf8").trim();
  const request = (path: string, method = "GET", body?: any, headers: Record<string, string> = {}) => fetch(base + path, {
    method, headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  try {
    await t.test("All exports, audit and media endpoints require authentication", async () => {
      for (const path of ["/api/admin/audit", "/api/admin/export", "/api/admin/inquiries.csv", "/api/admin/security", "/api/admin/media"])
        assert.equal((await request(path)).status, 401, path);
    });
    await t.test("Reject form posts, cross-site and malformed JSON with safe errors", async () => {
      const form = await fetch(base + "/api/admin/login", {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: "username=admin&password=no"});
      assert.equal(form.status, 415);
      assert.equal((await request("/api/admin/login", "POST", {}, {"Sec-Fetch-Site": "same-site"})).status, 403);
      assert.equal((await request("/api/admin/login", "POST", {}, {Origin: "null"})).status, 403);
      const malformed = await fetch(base + "/api/admin/login", {method: "POST", headers: {"Content-Type": "application/json"}, body: '{"secret":'});
      assert.equal(malformed.status, 400); assert.deepEqual(await malformed.json(), {error: "Geçersiz JSON verisi."});
    });
    await t.test("Production sessions and security headers are hardened", async () => {
      const login = await request("/api/admin/login", "POST", {username: "admin", password});
      assert.equal(login.status, 200);
      const header = login.headers.get("set-cookie")!;
      assert.match(header, /^__Host-kilinc_session=/); assert.match(header, /Secure/); assert.match(header, /HttpOnly/);
      cookie = header.split(";")[0];
      const health = await request("/api/health");
      assert.match(health.headers.get("content-security-policy")!, /frame-ancestors 'none'/);
      assert.match(health.headers.get("strict-transport-security")!, /max-age=31536000/);
      assert.equal(health.headers.get("cache-control"), "no-store");
      assert.equal(health.headers.get("x-powered-by"), null);
    });
    let regionId = "";
    await t.test("Full settings saves keep canonical origin ahead of the legacy alias", async () => {
      const current = (await (await request("/api/admin/settings")).json()).settings;
      const saved = await request("/api/admin/settings", "PUT", { ...current, websiteUrl: "https://example.com/path", siteUrl: "" });
      assert.equal(saved.status, 200);
      const updated = (await saved.json()).settings;
      assert.equal(updated.websiteUrl, "https://example.com");
      assert.equal(updated.siteUrl, "https://example.com");
      const sitemap = await request("/sitemap.xml");
      assert.equal(sitemap.status, 200);
      assert.match(await sitemap.text(), /https:\/\/example\.com\/bolgeler/);
      const changed = await request("/api/admin/settings", "PUT", { ...updated, websiteUrl: "https://new.example.com" });
      assert.equal((await changed.json()).settings.websiteUrl, "https://new.example.com");
    });
    await t.test("Region SEO is editable; image traversal and malformed specs are neutralized", async () => {
      const r = await request("/api/admin/content", "POST", {type: "region", title: "Etimesgut özel rehber", slug: "security-test-region", seoTitle: "Etimesgut | Kılınç", seoDescription: "Keşif rehberi", imageAlt: "Mekân çizimi", image: "/images/../../.data/site.sqlite", specs: [null, {label: "Hizmet", value: "Cam"}]});
      assert.equal(r.status, 201); const {content} = await r.json(); regionId = content.id;
      assert.equal(content.image, ""); assert.equal(content.imageAlt, "Mekân çizimi"); assert.equal(content.seoTitle, "Etimesgut | Kılınç");
      assert.equal((await request("/api/content/region/security-test-region")).status, 200);
      assert.equal((await request("/api/admin/settings", "PUT", {primaryColor: "red; color:black"})).status, 400);
      assert.equal((await request("/api/admin/settings", "PUT", {showRegions: "false"})).status, 400);
      assert.equal((await request("/api/admin/settings", "PUT", {websiteUrl: "https://example.com/some-path", showRegions: true, primaryColor: "#233b33"})).status, 200);
      const sitemap = await request("/sitemap.xml"); assert.equal(sitemap.status, 200); const xml = await sitemap.text();
      assert.match(xml, /https:\/\/example.com\/bolgeler\/security-test-region/); assert.doesNotMatch(xml, /\/admin|\/yonetim/);
    });
    await t.test("Media inventory refuses deletion while an image is used", async () => {
      const form = new FormData();
      form.append("image", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=", "base64")], {type: "image/png"}), "photo.png");
      const upload = await fetch(base + "/api/admin/upload", {method: "POST", headers: {Cookie: cookie}, body: form});
      assert.equal(upload.status, 201); const {url} = await upload.json();
      const inventory = await (await request("/api/admin/media")).json(); assert.ok(inventory.media.find((i: any) => i.url === url));
      await request("/api/admin/content/" + regionId, "PUT", {image: url});
      const path = "/api/admin/media/" + url.split("/").at(-1);
      assert.equal((await request(path, "DELETE")).status, 409);
      await request("/api/admin/content/" + regionId, "PUT", {image: ""});
      assert.equal((await request(path, "DELETE")).status, 200);
      assert.equal((await request(url)).status, 404);
    });
    let inquiryId = "";
    await t.test("Detailed enquiries retain private notes and follow-up data", async () => {
      const input = {name: "=Dangerous Cell", phone: "05550000000", message: "Projem için keşif talebi iletiyorum.", district: "Etimesgut", service: "Cam balkon", dimensions: "4 x 2 metre", budget: "Keşif sonrası", preferredContact: "phone", consent: true};
      const response = await request("/api/inquiries", "POST", input); assert.equal(response.status, 201); inquiryId = (await response.json()).id;
      const updated = await request("/api/admin/inquiries/" + inquiryId, "PATCH", {notes: "Yalnızca yöneticinin notu", priority: "high", followUpDate: "2026-11-01"});
      assert.equal(updated.status, 200); const {inquiry} = await updated.json();
      assert.equal(inquiry.notes, "Yalnızca yöneticinin notu"); assert.equal(inquiry.priority, "high"); assert.equal(inquiry.district, "Etimesgut"); assert.equal(inquiry.status, "new");
      assert.equal((await request("/api/admin/inquiries/" + inquiryId, "PATCH", {priority: "urgent"})).status, 400);
      assert.equal((await request("/api/admin/inquiries/" + inquiryId, "PATCH", {followUpDate: "not-a-date"})).status, 400);
      const publicData = JSON.stringify(await (await request("/api/site")).json()); assert.doesNotMatch(publicData, /Yalnızca yöneticinin notu/);
    });
    await t.test("Exports omit authentication data and neutralize spreadsheet formulas", async () => {
      const r = await request("/api/admin/export"); assert.equal(r.status, 200); const backup = await r.json();
      assert.ok(backup.content.find((c: any) => c.id === regionId)); assert.ok(backup.inquiries.find((i: any) => i.id === inquiryId));
      assert.deepEqual(Object.keys(backup).sort(), ["content", "exportedAt", "inquiries", "settings", "version"]);
      assert.ok(!JSON.stringify(backup).includes(password)); assert.ok(!JSON.stringify(backup).includes(cookie));
      const csv = await request("/api/admin/inquiries.csv"); assert.equal(csv.status, 200); assert.match(await csv.text(), /"'=Dangerous Cell"/);
      const {events} = await (await request("/api/admin/audit")).json();
      assert.ok(events.find((e: any) => e.action === "EXPORT")); assert.ok(events.find((e: any) => e.action === "PATCH"));
      assert.ok(events.every((e: any) => !JSON.stringify(e).includes(password)));
      const security = await (await request("/api/admin/security")).json(); assert.equal(security.bootstrapPasswordPending, true); assert.equal(security.production, true);
      const oldCookie = cookie;
      const secondLogin = await request("/api/admin/login", "POST", {username: "admin", password});
      cookie = secondLogin.headers.get("set-cookie")!.split(";")[0];
      assert.equal((await request("/api/admin/sessions/revoke", "POST", {})).status, 200);
      assert.equal((await request("/api/admin/me")).status, 200);
      assert.equal((await request("/api/admin/me", "GET", undefined, {Cookie: oldCookie})).status, 401);
    });
    await t.test("Login throttling survives a process restart", async () => {
      for(let i=0; i<8; i++) await request("/api/admin/login", "POST", {username: "admin", password: "wrong"});
      assert.equal((await request("/api/admin/login", "POST", {username: "admin", password: "wrong"})).status, 429);
      await new Promise<void>(r => server.close(() => r())); app.locals.close();
      app = createApp({dataDir, production: true}); server = app.listen(0,"127.0.0.1"); await new Promise<void>(r => server.once("listening", r));
      base = `http://127.0.0.1:${(server.address() as any).port}`;
      assert.equal((await request("/api/admin/login", "POST", {username: "admin", password: "wrong"})).status, 429);
    });
  } finally {
    await new Promise<void>(r => server.close(() => r())); app.locals.close(); rmSync(dataDir, {recursive: true, force: true});
    await scanner.close();
    for (const [name, value] of Object.entries(saved)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  }
});


test("Existing databases receive one additive content migration without overwriting user work", () => {
  const dataDir = mkdtempSync(join(tmpdir(), "kilinc-migration-"));
  let app = createApp({dataDir, production: false});
  try {
    const db = app.locals.db;
    const initialCount = db.prepare("SELECT count(*) AS count FROM content").get().count;
    const expansions = expansionContent();
    const retained = expansions[0];
    for (const row of expansions.slice(1)) db.prepare("DELETE FROM content WHERE type=? AND slug=?").run(row.type, row.slug);
    const retainedRow = db.prepare("SELECT id,data FROM content WHERE type=? AND slug=?").get(retained.type, retained.slug);
    const custom = {...JSON.parse(retainedRow.data), title: "Kullanıcının değiştirdiği başlık"};
    db.prepare("UPDATE content SET data=? WHERE id=?").run(JSON.stringify(custom), retainedRow.id);
    db.prepare("DELETE FROM content WHERE type='product' AND slug='katlanir-cam-balkon'").run();
    db.prepare("DELETE FROM schema_migrations WHERE version=?").run(contentExpansionVersion);
    const savedSettings = JSON.parse(db.prepare("SELECT data FROM settings WHERE id=1").get().data);
    savedSettings.phone = "+90 312 123 45 67";
    db.prepare("UPDATE settings SET data=? WHERE id=1").run(JSON.stringify(savedSettings));
    app.locals.close();
    app = createApp({dataDir, production: false});
    assert.equal(app.locals.db.prepare("SELECT count(*) AS count FROM content").get().count, initialCount - 1);
    const preserved = JSON.parse(app.locals.db.prepare("SELECT data FROM content WHERE id=?").get(retainedRow.id).data);
    assert.equal(preserved.title, "Kullanıcının değiştirdiği başlık");
    assert.equal(JSON.parse(app.locals.db.prepare("SELECT data FROM settings WHERE id=1").get().data).phone, savedSettings.phone);
    const removed = expansions[1];
    app.locals.db.prepare("DELETE FROM content WHERE type=? AND slug=?").run(removed.type, removed.slug);
    app.locals.close();
    app = createApp({dataDir, production: false});
    assert.equal(app.locals.db.prepare("SELECT count(*) AS count FROM content").get().count, initialCount - 2);
    assert.equal(app.locals.db.prepare("SELECT id FROM content WHERE type=? AND slug=?").get(removed.type, removed.slug), undefined);
    assert.equal(app.locals.db.prepare("SELECT count(*) AS count FROM schema_migrations").get().count, 7);
  } finally {
    app.locals.close(); rmSync(dataDir, {recursive: true, force: true});
  }
});
