// Real optional-consent analytics browser test; all data is temporary.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/app.ts";
let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch {
  pw =
    await import("/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
}
const dataDir = await mkdtemp(join(tmpdir(), "kilinc-analytics-browser-"));
const artifactDir = "/tmp/kilinc-analytics-artifacts";
await mkdir(artifactDir, { recursive: true });
const passphrase = randomBytes(24).toString("base64url");
const prior = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = passphrase;
const app = createApp({
  dataDir,
  staticDir: resolve("dist"),
  production: false,
});
if (prior === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = prior;
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const pass = (s) => {
  checks++;
  console.log("PASS", s);
};
try {
  browser = await pw.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const admin = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  assert.equal(
    (
      await admin.request.post(base + "/api/admin/login", {
        data: { username: "admin", password: passphrase },
      })
    ).status(),
    200,
  );
  const metrics = async () =>
    await (await admin.request.get(base + "/api/admin/live")).json();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let telemetryRequests = 0;
  page.on("request", (r) => {
    if (r.url().endsWith("/api/telemetry")) telemetryRequests++;
  });
  await page.goto(base, { waitUntil: "domcontentloaded" });
  assert.equal(telemetryRequests, 0);
  assert.equal((await metrics()).kpis.activeVisitors, 0);
  pass("no tracking before explicit analytics consent");
  const accepted = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/telemetry") && r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Analitiğe izin ver", exact: true })
    .click();
  assert.equal((await accepted).status(), 202);
  let report = await metrics();
  assert.equal(report.kpis.activeVisitors, 1);
  assert.ok(report.stream.some((e) => e.path === "/"));
  assert.equal(report.locationAvailable, false);
  assert.ok(report.visitors.every((v) => v.maskedIp !== "127.0.0.1"));
  pass("explicit consent creates a real active visitor and masked event");
  const productEvent = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/telemetry") &&
      r.request().postDataJSON()?.path?.startsWith("/urunler/"),
  );
  await page.locator(".ls-service-row h3 a").first().click();
  assert.equal((await productEvent).status(), 202);
  report = await metrics();
  assert.ok(report.topProducts.length);
  assert.ok(report.topProducts[0].views >= 1);
  pass("product ranking derives from a real product navigation");
  await page.goto(base + "/teklif-al", { waitUntil: "domcontentloaded" });
  const formStarted = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/telemetry") &&
      r.request().postDataJSON()?.kind === "form_start",
  );
  await page.locator("[name=name]").fill("UNSUBMITTED-PRIVATE-NAME");
  await formStarted;
  await page.locator("[name=phone]").fill("05559998877");
  await page.goto(base + "/hizmetler", { waitUntil: "domcontentloaded" });
  report = await metrics();
  assert.ok(report.stream.some((e) => e.kind === "form_start"));
  assert.ok(report.stream.some((e) => e.kind === "form_abandoned"));
  assert.ok(!JSON.stringify(report).includes("UNSUBMITTED-PRIVATE-NAME"));
  assert.ok(!JSON.stringify(report).includes("05559998877"));
  pass("abandoned form counter contains no typed identity or phone");
  const dashboard = await admin.newPage();
  dashboard.on("pageerror", (e) => errors.push(e.message));
  await dashboard.goto(base + "/yonetim", { waitUntil: "domcontentloaded" });
  await dashboard
    .getByRole("navigation", { name: "Yönetim menüsü" })
    .getByRole("button", { name: "Canlı izleme & analiz", exact: true })
    .click();
  await dashboard.locator(".la-kpis").waitFor();
  assert.match(await dashboard.locator(".la-kpis").innerText(), /1/);
  await dashboard.screenshot({
    path: join(artifactDir, "live-admin-desktop.png"),
    fullPage: true,
  });
  pass("admin dashboard renders genuine live metrics and stream");
  await page
    .getByRole("button", { name: "Gizlilik tercihleri", exact: true })
    .click();
  const forgotten = page.waitForResponse((r) =>
    r.url().endsWith("/api/telemetry/forget"),
  );
  await page
    .getByRole("button", { name: "Yalnızca gerekli", exact: true })
    .click();
  assert.equal((await forgotten).status(), 200);
  report = await metrics();
  assert.equal(report.kpis.activeVisitors, 0);
  assert.equal(report.stream.length, 0);
  const before = telemetryRequests;
  await page.goto(base + "/fikir-defteri", { waitUntil: "domcontentloaded" });
  assert.equal(telemetryRequests, before);
  assert.deepEqual(errors, []);
  pass("revoking consent deletes session history and stops further tracking");
  console.log(
    `Analytics browser smoke: ${checks}/${checks} checks passed; artifacts: ${artifactDir}`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
