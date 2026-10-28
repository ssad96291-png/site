// Run from repository root: node --import tsx scripts/customer-portal-smoke.mjs
// Uses an isolated temporary database and synthetic customer credentials.
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { createApp } from "../server/app.ts";
let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch {
  pw =
    await import("/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
}
const dataDir = await mkdtemp(join(tmpdir(), "kilinc-customer-browser-"));
const artifactDir =
  process.env.BROWSER_ARTIFACTS || "/tmp/kilinc-customer-artifacts";
await mkdir(artifactDir, { recursive: true });
const adminPassword = randomBytes(24).toString("base64url"),
  password = randomBytes(24).toString("base64url"),
  nextPassword = randomBytes(24).toString("base64url"),
  recoveredPassword = randomBytes(24).toString("base64url");
const previous = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = adminPassword;
const app = createApp({
  dataDir,
  staticDir: resolve("dist"),
  production: false,
});
if (previous === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = previous;
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const errors = [];
const pass = (label) => {
  checks++;
  console.log("PASS", label);
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
  await context.addInitScript(() =>
    localStorage.setItem("kilinc-analytics-consent-v1", "off"),
  );
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror", (e) => errors.push(e.message));
  const adminContext = await browser.newContext();
  assert.equal(
    (
      await adminContext.request.post(base + "/api/admin/login", {
        data: { username: "admin", password: adminPassword },
      })
    ).status(),
    200,
  );
  const created = await context.request.post(base + "/api/inquiries", {
    data: {
      name: "Sentetik Müşteri",
      email: "portal-browser@example.com",
      phone: "05000000000",
      district: "Etimesgut",
      product: "Katlanır Cam Balkon",
      message: "Tarayıcı testi için sentetik keşif talebidir.",
      consent: true,
    },
  });
  assert.equal(created.status(), 201);
  const receipt = await created.json();
  assert.ok(receipt.trackingToken);
  const inquiryId = receipt.id;
  await page.goto(base + "/hesabim#claim=" + receipt.trackingToken, {
    waitUntil: "networkidle",
  });
  await page
    .getByRole("heading", { name: "Taleplerim & Projelerim", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).hash, "");
  assert.equal(await page.locator(".cp-request-selector>button").count(), 1);
  assert.match(
    await page.locator(".cp-claim-note").innerText(),
    /yalnızca yeni talebinizi/,
  );
  pass(
    "single-use receipt opens scoped customer dashboard and removes token from URL",
  );
  await page
    .getByRole("navigation", { name: "Müşteri paneli menüsü" })
    .getByRole("button", { name: "Hesabımı tamamla", exact: true })
    .click();
  const registration = page.locator(".cp-main .cp-panel form").first();
  await registration.locator("[name=email]").fill("portal-browser@example.com");
  await registration.locator("[name=password]").fill(password);
  await registration.locator("[name=confirmPassword]").fill(password);
  await registration.locator("input[type=checkbox]").check();
  const registrationResponse = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/customer/register") &&
      r.request().method() === "POST",
  );
  await registration
    .getByRole("button", { name: "Hesabımı tamamla", exact: true })
    .click();
  assert.equal((await registrationResponse).status(), 201);
  await page
    .getByRole("heading", { name: "Hesap bilgilerim", exact: true })
    .waitFor();
  const profile = await (
    await context.request.get(base + "/api/customer/me")
  ).json();
  assert.equal(profile.scoped, false);
  assert.equal(profile.customer.email, "portal-browser@example.com");
  const customerId = profile.customer.id;
  pass(
    "optional membership upgrades scoped session and keeps the owned request",
  );
  await page
    .getByRole("navigation", { name: "Müşteri paneli menüsü" })
    .getByRole("button", { name: /Taleplerim & Projelerim/ })
    .click();
  const teamResponse = await adminContext.request.post(
    base + "/api/admin/teams",
    {
      data: {
        name: "Sentetik Etimesgut Ekibi",
        contactName: "Teknik Ekip",
        phone: "05000000001",
        email: "synthetic-team@example.com",
        active: true,
      },
    },
  );
  assert.equal(teamResponse.status(), 201);
  const team = (await teamResponse.json()).team;
  assert.equal(
    (
      await adminContext.request.patch(
        base + "/api/admin/pipeline/" + inquiryId,
        {
          data: {
            stage: "assigned",
            teamId: team.id,
            technician: "Sentetik Teknisyen",
            appointmentAt: "2030-01-15T10:00:00.000Z",
            customerMessage: "Keşif randevunuz planlandı.",
          },
        },
      )
    ).status(),
    200,
  );
  await page
    .getByRole("button", { name: "Taleplerimi yenile", exact: true })
    .click();
  await page.getByText("Sentetik Etimesgut Ekibi", { exact: true }).waitFor();
  await page
    .getByRole("heading", { name: "Teknik irtibat", exact: true })
    .waitFor();
  await page.getByText("Keşif planlanıyor", { exact: true }).first().waitFor();
  assert.doesNotMatch(
    await page.locator(".cp-request-detail").innerText(),
    /bayi|dealership/i,
  );
  assert.equal(
    await page.locator('.cp-team-card a[href="tel:05000000001"]').count(),
    1,
  );
  const publicRequest = await (
    await context.request.get(base + "/api/customer/inquiries/" + inquiryId)
  ).json();
  assert.equal(publicRequest.inquiry.assignedTeam.id, team.id);
  assert.equal("dealer" in publicRequest.inquiry, false);
  assert.equal("dealerId" in publicRequest.inquiry, false);
  for (const key of ["address", "city", "district", "regions"])
    assert.equal(key in publicRequest.inquiry.assignedTeam, false);
  assert.match(await page.locator(".cp-appointment").innerText(), /2030/);
  assert.match(
    await page.locator(".cp-team-update").innerText(),
    /Keşif randevunuz/,
  );
  pass(
    "internal technical contact and planning appear without a dealership or region directory",
  );
  assert.equal(
    (
      await adminContext.request.patch(
        base + "/api/admin/pipeline/" + inquiryId,
        {
          data: {
            stage: "production",
            customerMessage: "Üretim planına alındı.",
          },
        },
      )
    ).status(),
    200,
  );
  await page
    .getByText("Üretim aşamasında", { exact: true })
    .first()
    .waitFor({ timeout: 16000 });
  assert.equal(
    await page.locator(".cp-progress [aria-current=step] small").innerText(),
    "Üretim",
  );
  pass("polling reflects an actual pipeline change without a page reload");
  const pdf = await adminContext.request.get(
    base + "/api/measurement-guide.pdf",
  );
  assert.equal(pdf.status(), 200);
  const upload = await adminContext.request.post(
    base + "/api/admin/pipeline/" + inquiryId + "/documents?kind=quote",
    {
      multipart: {
        document: {
          name: "sentetik-teklif.pdf",
          mimeType: "application/pdf",
          buffer: await pdf.body(),
        },
      },
    },
  );
  assert.equal(upload.status(), 201);
  await page
    .getByRole("button", { name: "Taleplerimi yenile", exact: true })
    .click();
  await page.getByRole("button", { name: /Belgelerim/ }).click();
  await page.locator(".cp-document").first().waitFor();
  const download = await context.request.get(
    base + (await page.locator(".cp-document").first().getAttribute("href")),
  );
  assert.equal(download.status(), 200);
  assert.equal((await download.body()).subarray(0, 5).toString(), "%PDF-");
  const anon = await browser.newContext();
  assert.equal(
    (
      await anon.request.get(
        base +
          (await page.locator(".cp-document").first().getAttribute("href")),
      )
    ).status(),
    401,
  );
  await anon.close();
  pass(
    "private PDF archive downloads only with an authorized customer session",
  );
  await page.getByRole("button", { name: /Mesajlar/ }).click();
  await page.getByLabel("Talebinizin konusu").selectOption("appointment");
  await page
    .locator("[name=customerMessage]")
    .fill("Sentetik randevu değişikliği isteğidir.");
  await page
    .getByRole("button", { name: "Mesajı gönder", exact: true })
    .click();
  await page
    .locator(".cp-message.mine")
    .filter({ hasText: "Sentetik randevu değişikliği" })
    .waitFor();
  const adminMessages = await adminContext.request.post(
    base + "/api/admin/pipeline/" + inquiryId + "/messages",
    {
      data: {
        kind: "appointment",
        message: "Ekibimiz sentetik talebinizi incelemeye aldı.",
      },
    },
  );
  assert.equal(adminMessages.status(), 201);
  await page
    .getByRole("button", { name: "Taleplerimi yenile", exact: true })
    .click();
  await page
    .locator(".cp-message.team")
    .filter({ hasText: "Ekibimiz sentetik talebinizi" })
    .waitFor();
  pass(
    "support and appointment requests create a two-way customer conversation",
  );
  await page
    .getByRole("navigation", { name: "Müşteri paneli menüsü" })
    .getByRole("button", { name: "Hesap bilgilerim", exact: true })
    .click();
  await page
    .locator(".cp-profile [name=address]")
    .fill("Sentetik güncel müşteri adresi");
  await page
    .locator(".cp-profile [name=customerType]")
    .selectOption("architect");
  const savedProfile = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/customer/profile") &&
      r.request().method() === "PUT",
  );
  await page
    .getByRole("button", { name: "Bilgilerimi kaydet", exact: true })
    .click();
  assert.equal((await savedProfile).status(), 200);
  assert.equal(
    (await (await context.request.get(base + "/api/customer/me")).json())
      .customer.customerType,
    "architect",
  );
  pass("customer profile changes persist");
  await page.setViewportSize({ width: 390, height: 844 });
  for (const section of [
    /Taleplerim & Projelerim/,
    /Bildirimler/,
    "Hesap bilgilerim",
  ]) {
    await page
      .getByRole("navigation", { name: "Müşteri paneli menüsü" })
      .getByRole("button", {
        name: section,
        exact: typeof section === "string",
      })
      .click();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
  }
  await page
    .getByRole("navigation", { name: "Müşteri paneli menüsü" })
    .getByRole("button", { name: /Taleplerim & Projelerim/ })
    .click();
  await page.screenshot({
    path: join(artifactDir, "customer-mobile.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: join(artifactDir, "customer-desktop.png"),
    fullPage: true,
  });
  pass("authenticated customer dashboard, notifications and profile fit 390px");
  await page
    .getByRole("navigation", { name: "Müşteri paneli menüsü" })
    .getByRole("button", { name: "Hesap bilgilerim", exact: true })
    .click();
  await page.locator("[name=currentPassword]").fill(password);
  await page.locator("[name=newPassword]").fill(nextPassword);
  await page.locator("[name=confirmPassword]").fill(nextPassword);
  await page
    .getByRole("button", { name: "Parolamı güncelle", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .waitFor();
  assert.equal(
    (await context.request.get(base + "/api/customer/me")).status(),
    401,
  );
  await page.locator("[name=email]").fill("portal-browser@example.com");
  await page.locator("[name=password]").fill(nextPassword);
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Taleplerim & Projelerim", exact: true })
    .waitFor();
  pass("password rotation revokes sessions and the new password logs in");
  assert.equal(
    (
      await adminContext.request.patch(
        base + "/api/admin/customers/" + customerId,
        { data: { status: "suspended" } },
      )
    ).status(),
    200,
  );
  assert.equal(
    (await context.request.get(base + "/api/customer/me")).status(),
    401,
  );
  await page
    .getByRole("button", { name: "Taleplerimi yenile", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .waitFor();
  assert.equal(await page.locator(".cp-request-detail").count(), 0);
  pass(
    "admin suspension removes customer access and private request data from the UI",
  );
  assert.equal(
    (
      await adminContext.request.patch(
        base + "/api/admin/customers/" + customerId,
        { data: { status: "active" } },
      )
    ).status(),
    200,
  );
  const recovery = await adminContext.request.post(
    base + "/api/admin/customers/" + customerId + "/recovery",
    { data: {} },
  );
  assert.equal(recovery.status(), 200);
  const reset = await recovery.json();
  await page.goto(base + reset.url, { waitUntil: "networkidle" });
  await page
    .getByRole("heading", { name: "Yeni parolanızı belirleyin.", exact: true })
    .waitFor();
  assert.equal(new URL(page.url()).hash, "");
  await page.locator("[name=newPassword]").fill(recoveredPassword);
  await page.locator("[name=confirmPassword]").fill(recoveredPassword);
  await page
    .getByRole("button", { name: "Yeni parolamı kaydet", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .waitFor();
  await page.locator("[name=email]").fill("portal-browser@example.com");
  await page.locator("[name=password]").fill(recoveredPassword);
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Taleplerim & Projelerim", exact: true })
    .waitFor();
  pass("admin recovery link resets the password safely and restores access");
  await page
    .getByRole("button", { name: "Müşteri hesabından çıkış", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Müşteri hesabına giriş yap", exact: true })
    .waitFor();
  assert.equal(
    (await context.request.get(base + "/api/customer/inquiries")).status(),
    401,
  );
  assert.deepEqual(errors, []);
  pass("logout clears access; no browser exceptions");
  console.log(
    `Customer portal browser: ${checks}/${checks} checks passed; artifacts: ${artifactDir}`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
