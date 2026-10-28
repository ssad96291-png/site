// node --import tsx scripts/media-rights-smoke.mjs
// Isolated synthetic data; requires a prior npm run build and Chromium/Playwright.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApp } from "../server/app.ts";

let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch {
  pw =
    await import("/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
}
const dataDir = await mkdtemp(join(tmpdir(), "kilinc-media-rights-"));
const artifacts =
  process.env.BROWSER_ARTIFACTS || "/tmp/kilinc-media-rights-artifacts";
await mkdir(artifacts, { recursive: true });
const password = randomBytes(24).toString("base64url");
const previousPassword = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = password;
const app = createApp({
  dataDir,
  staticDir: resolve("dist"),
  production: false,
});
if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = previousPassword;
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve, reject) => {
  server.once("listening", resolve);
  server.once("error", reject);
});
const base = `http://127.0.0.1:${server.address().port}`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0wAAAABJRU5ErkJggg==",
  "base64",
);
let browser;
const errors = [];
let count = 0;
const pass = (message) => {
  count++;
  console.log("PASS", message);
};
async function fillDeclaration(fields, basis) {
  await fields.getByRole("combobox").selectOption(basis);
  const checkbox = fields.getByRole("checkbox");
  assert.equal(await checkbox.isEnabled(), false);
  await fields
    .getByLabel("Kaynak / oluşturulma bilgisi", { exact: true })
    .fill("Sentetik test kaynağı; 2026-10-28");
  await fields
    .getByLabel("Hak sahibi / üretici", { exact: true })
    .fill("Sentetik test üreticisi");
  await fields
    .getByLabel("İzin / lisans / üretim kayıt referansı", { exact: false })
    .fill("TEST-IZIN-2026; yalnızca doğrulama verisi");
  await fields
    .getByLabel("Kullanım kapsamı ve notlar", { exact: true })
    .fill("Sentetik test beyanıdır.");
  await checkbox.check();
}
try {
  browser = await pw.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const login = await context.request.post(base + "/api/admin/login", {
    data: { username: "admin", password },
  });
  assert.equal(login.status(), 200);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(base + "/yonetim", { waitUntil: "networkidle" });
  await page
    .getByRole("navigation", { name: "Yönetim menüsü" })
    .getByRole("button", { name: "Görsel kütüphanesi", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Görseller ve kullanım kayıtları" })
    .waitFor();

  const firstUpload = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/upload") && r.request().method() === "POST",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "sentetik.png",
      mimeType: "image/png",
      buffer: png,
    });
  assert.equal((await firstUpload).status(), 201);
  const firstCard = page.locator(".ka-media-card").first();
  await firstCard
    .getByText("Kullanım beyanı eksik · Yayın öncesi inceleyin", {
      exact: true,
    })
    .waitFor();
  pass("undeclared upload remains marked for review");

  await firstCard.locator(".ka-rights-editor summary").click();
  await fillDeclaration(firstCard.locator(".ka-rights-fields"), "own");
  const save = page.waitForResponse(
    (r) =>
      r.url().includes("/api/admin/media-rights/") &&
      r.request().method() === "PUT",
  );
  await firstCard
    .getByRole("button", { name: "Beyan kaydını kaydet", exact: true })
    .click();
  assert.equal((await save).status(), 200);
  await firstCard
    .getByText("Kullanım beyanı kayıtlı · Hukuki onay değildir", {
      exact: true,
    })
    .waitFor();
  pass(
    "operator can record a complete declaration without claiming legal clearance",
  );

  const uploadDeclaration = page.locator(".ka-media-rights-upload");
  await uploadDeclaration.locator("summary").click();
  await fillDeclaration(
    uploadDeclaration.locator(".ka-rights-fields"),
    "generated",
  );
  const declaredUpload = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/admin/upload") && r.request().method() === "POST",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "sentetik-konsept.png",
      mimeType: "image/png",
      buffer: png,
    });
  assert.equal((await declaredUpload).status(), 201);
  await page.waitForFunction(
    () => document.querySelectorAll(".ka-media-card").length === 2,
  );
  const usage = await (
    await context.request.get(base + "/api/admin/media-rights")
  ).json();
  assert.equal(usage.records.length, 2);
  assert.ok(
    usage.records.some((r) => r.basis === "generated" && r.confirmedAt),
  );
  pass("upload preserves the selected source and declaration privately");

  await page.reload({ waitUntil: "networkidle" });
  await page
    .getByRole("navigation", { name: "Yönetim menüsü" })
    .getByRole("button", { name: "Görsel kütüphanesi", exact: true })
    .click();
  const reloaded = page.locator(".ka-media-card").first();
  await reloaded.locator(".ka-rights-editor summary").click();
  assert.equal(await reloaded.getByRole("checkbox").isChecked(), true);
  await reloaded
    .getByLabel("Hak sahibi / üretici", { exact: true })
    .fill("Değişen sentetik üretici");
  assert.equal(await reloaded.getByRole("checkbox").isChecked(), false);
  pass("persisted declaration reloads and editing resets confirmation");

  const anonymous = await browser.newContext();
  assert.equal(
    (await anonymous.request.get(base + "/api/admin/media-rights")).status(),
    401,
  );
  const publicSite = await (
    await anonymous.request.get(base + "/api/site")
  ).text();
  assert.equal(publicSite.includes("TEST-IZIN-2026"), false);
  await anonymous.close();
  pass("declaration references stay outside anonymous site responses");

  await page.screenshot({
    path: join(artifacts, "gorsel-kullanim-masaustu.png"),
    fullPage: true,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: join(artifacts, "gorsel-kullanim-mobil.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  pass("mobile source editor fits the viewport with no browser exceptions");
  console.log(
    `Media declarations: ${count}/${count} checks passed; artifacts: ${artifacts}`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
