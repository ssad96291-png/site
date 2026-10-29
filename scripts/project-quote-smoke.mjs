// Full project/price enquiry flow. Uses disposable data and synthetic credentials only.
// Run after npm run build: node --import tsx scripts/project-quote-smoke.mjs
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import PDFDocument from "pdfkit";
import { createApp } from "../server/app.ts";

let pw;
try {
  pw = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
} catch {
  pw =
    await import("/opt/codex/cua_node/lib/node_modules/playwright/index.mjs");
}
const dataDir = await mkdtemp(join(tmpdir(), "kilinc-project-browser-"));
const artifacts =
  process.env.BROWSER_ARTIFACTS || "/tmp/kilinc-project-artifacts";
await mkdir(artifacts, { recursive: true });
const adminPassword = randomBytes(24).toString("base64url");
const customerPassword = randomBytes(24).toString("base64url");
const staffPassword = randomBytes(24).toString("base64url");
const keys = [
  "ADMIN_PASSWORD",
  "NOTIFY_WEBHOOK_URL",
  "NOTIFY_ALLOWED_HOSTS",
  "NOTIFY_WEBHOOK_TOKEN",
];
const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
process.env.ADMIN_PASSWORD = adminPassword;
for (const key of keys.slice(1)) process.env[key] = "";
const app = createApp({
  dataDir,
  staticDir: resolve("dist"),
  production: false,
});
const server = app.listen(0, "127.0.0.1");
await new Promise((r, reject) => {
  server.once("listening", r);
  server.once("error", reject);
});
const base = `http://127.0.0.1:${server.address().port}`;
const dxf = Buffer.from(
  "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1032\n0\nENDSEC\n0\nEOF\n",
);
const pdf = await new Promise((resolve, reject) => {
  const document = new PDFDocument();
  const parts = [];
  document.on("data", (value) => parts.push(value));
  document.once("error", reject);
  document.once("end", () => resolve(Buffer.concat(parts)));
  document.text("Synthetic drawing attachment for browser validation only.");
  document.end();
});
let browser;
let checks = 0;
const errors = [];
const pass = (message) => {
  checks++;
  console.log("PASS", message);
};
const json = async (response, status = 200) => {
  assert.equal(
    response.status(),
    status,
    `Unexpected status at ${new URL(response.url()).pathname}`,
  );
  return response.json();
};
async function context(options = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
    ...options,
  });
  await ctx.addInitScript(() =>
    localStorage.setItem("kilinc-analytics-consent-v1", "off"),
  );
  return ctx;
}
async function watchPage(ctx) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (error) => errors.push(error.message));
  return page;
}
async function fillRequest(
  page,
  { name, email, phoneRequested = false, phone = "" },
) {
  await page.goto(base + "/proje-teklif", { waitUntil: "domcontentloaded" });
  await page.locator("form.pr-form").waitFor();
  await page.locator("[name=name]").fill(name);
  await page.locator("[name=email]").fill(email);
  await page.locator("[name=district]").fill("Etimesgut");
  await page
    .locator("[name=message]")
    .fill(
      "Bu proje ve fiyat talebi yalnızca sentetik tarayıcı doğrulama kaydıdır.",
    );
  if (phoneRequested) await page.locator("[name=phoneRequested]").check();
  if (phone) await page.locator("[name=phone]").fill(phone);
  await page.locator("[name=consent]").check();
}
async function selectAdminSection(page) {
  const menu = page.getByRole("button", { name: "Menüyü aç", exact: true });
  if (await menu.isVisible()) {
    if (
      !(await page.locator(".ka-sidebar").getAttribute("class"))?.includes(
        "is-open",
      )
    )
      await menu.click();
    await page.waitForFunction(
      () =>
        document.querySelector(".ka-sidebar").getBoundingClientRect().left >= 0,
    );
  }
  await page
    .getByRole("navigation", { name: "Yönetim menüsü" })
    .getByRole("button", { name: "Proje & fiyat talepleri", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Proje & fiyat talepleri", level: 1 })
    .waitFor();
  if (await menu.isVisible())
    await page.waitForFunction(
      () =>
        document.querySelector(".ka-sidebar").getBoundingClientRect().right <=
        0,
    );
}
async function openRequest(page, name) {
  await page
    .locator(".kp-request-list button")
    .filter({ hasText: name })
    .click();
  await page
    .locator(".kp-request-detail h2")
    .filter({ hasText: name })
    .waitFor();
  await page
    .getByRole("button", { name: "Yeni teklif hazırla", exact: true })
    .waitFor();
}
async function openCustomerProjects(page) {
  await page.goto(base + "/hesabim", { waitUntil: "domcontentloaded" });
  await page
    .getByRole("heading", { name: "Taleplerim & Projelerim", exact: true })
    .waitFor();
  await page
    .getByRole("navigation", { name: "Talep detayları" })
    .getByRole("button", { name: "Proje dosyaları & teklifler", exact: true })
    .click();
  await page.locator(".cpq-area").waitFor();
}
const noOverflow = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

try {
  browser = await pw.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const customer = await context();
  const customerPage = await watchPage(customer);
  await fillRequest(customerPage, {
    name: "Sentetik Proje Müşterisi",
    email: "project-browser@example.com",
    phoneRequested: true,
    phone: "05000000000",
  });
  await customerPage
    .getByLabel("Proje dosyaları seç", { exact: true })
    .setInputFiles([
      { name: "sentetik-cizim.dxf", mimeType: "application/dxf", buffer: dxf },
      { name: "sentetik-olcu.pdf", mimeType: "application/pdf", buffer: pdf },
    ]);
  await customerPage.screenshot({
    path: join(artifacts, "proje-formu.png"),
    fullPage: true,
  });
  const createdResponse = customerPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/project-requests" &&
      r.request().method() === "POST",
  );
  await customerPage
    .getByRole("button", { name: "Talebimi gönder", exact: true })
    .click();
  const receipt = await json(await createdResponse, 201);
  const inquiryId = receipt.id;
  await customerPage
    .getByRole("heading", { name: "Projeniz bize ulaştı.", exact: true })
    .waitFor();
  const profile = await json(
    await customer.request.get(base + "/api/customer/me"),
  );
  assert.equal(profile.scoped, true);
  const files = (
    await json(
      await customer.request.get(
        base + `/api/customer/inquiries/${inquiryId}/project-files`,
      ),
    )
  ).files;
  assert.equal(files.length, 2);
  assert.deepEqual(files.map((file) => file.name).sort(), [
    "sentetik-cizim.dxf",
    "sentetik-olcu.pdf",
  ]);
  pass(
    "a guest submits drawings and a price enquiry with explicit call-back preference and receives scoped access",
  );

  const outsider = await context();
  assert.equal(
    (await outsider.request.get(base + files[0].downloadUrl)).status(),
    401,
  );
  const fileDownload = await customer.request.get(
    base + files.find((file) => file.name.endsWith(".dxf")).downloadUrl,
  );
  assert.equal(fileDownload.status(), 200);
  assert.match(fileDownload.headers()["content-disposition"], /attachment/i);
  assert.deepEqual(await fileDownload.body(), dxf);
  assert.doesNotMatch(
    await (await outsider.request.get(base + "/api/site")).text(),
    /sentetik-cizim|project-browser@example/,
  );
  pass(
    "project attachments are private owner-only downloads and stay outside the public site response",
  );

  const admin = await context();
  await json(
    await admin.request.post(base + "/api/admin/login", {
      data: { username: "admin", password: adminPassword },
    }),
  );
  const adminPage = await watchPage(admin);
  await adminPage.goto(base + "/yonetim", { waitUntil: "domcontentloaded" });
  await adminPage.getByRole("navigation", { name: "Yönetim menüsü" }).waitFor();
  await selectAdminSection(adminPage);
  await openRequest(adminPage, "Sentetik Proje Müşterisi");
  await adminPage.getByText("sentetik-cizim.dxf", { exact: true }).waitFor();
  await adminPage
    .getByRole("button", { name: "Yeni teklif hazırla", exact: true })
    .click();
  const editor = adminPage.getByRole("form", {
    name: "Fiyat teklifi düzenleyici",
  });
  await editor
    .getByLabel("Teklif başlığı", { exact: true })
    .fill("Sentetik Cam Balkon Teklifi");
  const item = editor.locator(".kp-edit-item").first();
  await item
    .getByLabel("İş / malzeme açıklaması", { exact: true })
    .fill("Ölçüye göre cam ve profil uygulaması");
  await item.getByLabel("Miktar", { exact: true }).fill("2");
  await item.getByLabel("Birim", { exact: true }).fill("m²");
  await item.getByLabel("Birim fiyat", { exact: true }).fill("1250.50");
  await editor
    .getByRole("button", { name: "Teklif kalemi ekle", exact: true })
    .click();
  const secondItem = editor.locator(".kp-edit-item").nth(1);
  await secondItem
    .getByLabel("İş / malzeme açıklaması", { exact: true })
    .fill("Keşif ve montaj planlaması");
  await secondItem.getByLabel("Birim fiyat", { exact: true }).fill("500");
  await editor.getByLabel("KDV oranı (%)", { exact: true }).fill("20");
  await editor
    .getByLabel("Kapsam, teslim ve teklif notları", { exact: false })
    .fill("Sentetik kapsam: ölçüler yerinde doğrulanır; ödeme alınmaz.");
  const draftResponse = adminPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname ===
        `/api/admin/project-requests/${inquiryId}/offers` &&
      r.request().method() === "POST",
  );
  await editor
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  const offer = (await json(await draftResponse, 201)).offer;
  assert.equal(offer.subtotalMinor, 300100);
  assert.equal(offer.taxMinor, 60020);
  assert.equal(offer.totalMinor, 360120);
  await adminPage
    .locator(".kp-offer-card.draft h4")
    .filter({ hasText: offer.title })
    .waitFor();
  const hidden = await json(
    await customer.request.get(
      base + `/api/customer/inquiries/${inquiryId}/offers`,
    ),
  );
  assert.equal(hidden.offers.length, 0);
  await adminPage.screenshot({
    path: join(artifacts, "teklif-taslagi.png"),
    fullPage: true,
  });
  pass(
    "the admin prepares an itemised draft whose server-computed tax and totals remain hidden from the customer",
  );

  const draftPdf = await admin.request.get(
    base + `/api/admin/offers/${offer.id}/pdf`,
  );
  assert.equal(draftPdf.status(), 200);
  assert.equal((await draftPdf.body()).subarray(0, 5).toString(), "%PDF-");
  assert.equal(
    (
      await customer.request.get(base + `/api/customer/offers/${offer.id}/pdf`)
    ).status(),
    404,
  );
  const publishResponse = adminPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/admin/offers/${offer.id}/publish` &&
      r.request().method() === "POST",
  );
  await adminPage
    .getByRole("button", { name: "Müşteriyle paylaş", exact: true })
    .click();
  await json(await publishResponse);
  await adminPage
    .getByText("E-posta: Bağlantı bekliyor", { exact: true })
    .waitFor();
  await openCustomerProjects(customerPage);
  await customerPage
    .locator(".cpq-offer")
    .getByText(offer.title, { exact: true })
    .waitFor();
  assert.match(
    await customerPage.locator(".cpq-offer").innerText(),
    /3\.601,20/,
  );
  const customerPdf = await customer.request.get(
    base + `/api/customer/offers/${offer.id}/pdf`,
  );
  assert.equal(customerPdf.status(), 200);
  assert.equal((await customerPdf.body()).subarray(0, 5).toString(), "%PDF-");
  assert.equal(
    (
      await outsider.request.get(base + `/api/customer/offers/${offer.id}/pdf`)
    ).status(),
    401,
  );
  await customerPage.screenshot({
    path: join(artifacts, "musteri-teklifi.png"),
    fullPage: true,
  });
  pass(
    "publishing reveals the immutable proposal and downloadable PDF only in the owning customer's account",
  );

  const eml = await admin.request.get(
    base + `/api/admin/offers/${offer.id}/email.eml`,
  );
  assert.equal(eml.status(), 200);
  const emailDraft = await eml.text();
  assert.match(emailDraft, /To: project-browser@example\.com\r\n/);
  assert.match(emailDraft, /X-Unsent: 1\r\n/);
  assert.match(
    emailDraft,
    /Content-Disposition: attachment; filename="kilinc-teklif-/,
  );
  assert.match(emailDraft, /Content-Type: application\/pdf/);
  const sharedCard = adminPage.locator(".kp-offer-card.published").first();
  await sharedCard
    .getByRole("combobox", { name: /İletişim kanalı/ })
    .selectOption("phone");
  await sharedCard
    .getByLabel("Görüşme notu", { exact: true })
    .fill("Sentetik telefon görüşmesi kaydı; gerçek arama yapılmadı.");
  const contactResponse = adminPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === `/api/admin/offers/${offer.id}/contact` &&
      r.request().method() === "POST",
  );
  await sharedCard
    .getByRole("button", { name: "İletişimi kaydet", exact: true })
    .click();
  await json(await contactResponse, 201);
  await sharedCard.getByText("Telefon görüşmesi", { exact: true }).waitFor();
  const published = (
    await json(
      await admin.request.get(
        base + `/api/admin/project-requests/${inquiryId}/offers`,
      ),
    )
  ).offers.find((item) => item.id === offer.id);
  assert.equal(published.emailDelivery.status, "waiting_configuration");
  assert.equal(published.emailDelivery.attempts, 0);
  pass(
    "manual email drafts contain the actual offer and PDF, while opted-in call logging never claims an email was delivered",
  );

  await sharedCard
    .getByRole("button", { name: "Revizyon hazırla", exact: true })
    .click();
  await adminPage
    .getByRole("form", { name: "Fiyat teklifi düzenleyici" })
    .getByLabel("Teklif başlığı", { exact: true })
    .fill("Sentetik Gizli Revizyon");
  const revisionResponse = adminPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname ===
        `/api/admin/project-requests/${inquiryId}/offers` &&
      r.request().method() === "POST",
  );
  await adminPage
    .getByRole("button", { name: "Taslağı kaydet", exact: true })
    .click();
  const revision = (await json(await revisionResponse, 201)).offer;
  assert.equal(revision.version, 2);
  const visibleOffers = (
    await json(
      await customer.request.get(
        base + `/api/customer/inquiries/${inquiryId}/offers`,
      ),
    )
  ).offers;
  assert.equal(visibleOffers.length, 1);
  assert.equal(visibleOffers[0].id, offer.id);
  assert.equal(
    (
      await admin.request.put(base + `/api/admin/offers/${offer.id}`, {
        data: { ...offer, title: "Changed issued title" },
      })
    ).status(),
    409,
  );
  pass(
    "revisions create separate private drafts and cannot overwrite an issued offer",
  );

  await json(
    await customer.request.post(base + "/api/customer/register", {
      data: {
        name: "Sentetik Proje Müşterisi",
        email: "project-browser@example.com",
        password: customerPassword,
      },
    }),
    201,
  );
  await customerPage.goto(base + "/proje-teklif", {
    waitUntil: "domcontentloaded",
  });
  await customerPage.waitForFunction(
    () =>
      document.querySelector("[name=email]")?.value ===
      "project-browser@example.com",
  );
  await customerPage
    .getByRole("radio", { name: "Fiyat sorusu", exact: true })
    .check();
  await customerPage
    .locator("[name=message]")
    .fill("Hesap üzerinden yalnızca fiyat bilgisi için sentetik yeni başvuru.");
  await customerPage.locator("[name=consent]").check();
  const signedResponse = customerPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/project-requests" &&
      r.request().method() === "POST",
  );
  await customerPage
    .getByRole("button", { name: "Talebimi gönder", exact: true })
    .click();
  const signedReceipt = await json(await signedResponse, 201);
  assert.equal(signedReceipt.trackingToken, undefined);
  await customerPage
    .getByRole("heading", { name: "Projeniz bize ulaştı.", exact: true })
    .waitFor();
  const owned = (
    await json(await customer.request.get(base + "/api/customer/inquiries"))
  ).inquiries;
  assert.equal(owned.length, 2);
  assert.ok(owned.some((item) => item.id === signedReceipt.id));
  pass(
    "an existing account submits a file-free pricing question directly into its own request list",
  );

  const retryCustomer = await context();
  const retryPage = await watchPage(retryCustomer);
  await fillRequest(retryPage, {
    name: "Sentetik Yeniden Deneme",
    email: "project-retry@example.com",
  });
  await retryPage
    .getByLabel("Proje dosyaları seç", { exact: true })
    .setInputFiles({
      name: "yeniden-cizim.dxf",
      mimeType: "application/dxf",
      buffer: dxf,
    });
  let abortUpload = true;
  await retryPage.route(
    "**/api/customer/inquiries/*/project-files",
    async (route) => {
      if (route.request().method() === "POST" && abortUpload) {
        abortUpload = false;
        const response = await route.fetch();
        assert.equal(response.status(), 201);
        await route.abort("failed");
      } else await route.continue();
    },
  );
  const retriedCreate = retryPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/project-requests" &&
      r.request().method() === "POST",
  );
  await retryPage
    .getByRole("button", { name: "Talebimi gönder", exact: true })
    .click();
  const retryReceipt = await json(await retriedCreate, 201);
  await retryPage
    .getByRole("heading", {
      name: "Talebiniz kayıtlı; dosya adımından devam edin.",
      exact: true,
    })
    .waitFor();
  await retryPage.getByRole("alert").waitFor();
  await retryPage
    .getByRole("button", {
      name: "Takip ve dosya adımını tamamla",
      exact: true,
    })
    .click();
  await retryPage
    .getByRole("heading", { name: "Projeniz bize ulaştı.", exact: true })
    .waitFor();
  const recoveredFiles = (
    await json(
      await retryCustomer.request.get(
        base + `/api/customer/inquiries/${retryReceipt.id}/project-files`,
      ),
    )
  ).files;
  assert.equal(recoveredFiles.length, 1);
  const requests = (
    await json(await admin.request.get(base + "/api/admin/project-requests"))
  ).requests;
  assert.equal(
    requests.filter((item) => item.name === "Sentetik Yeniden Deneme").length,
    1,
  );
  pass(
    "a lost upload response retries the same saved request without duplicating the enquiry or uploaded file",
  );

  const secondOffer = (
    await json(
      await admin.request.post(
        base + `/api/admin/project-requests/${retryReceipt.id}/offers`,
        {
          data: {
            title: "Sentetik E-posta Teklifi",
            currency: "TRY",
            items: [
              {
                description: "Teknik değerlendirme",
                quantity: 1,
                unit: "adet",
                unitPrice: 100,
              },
            ],
            vatRate: 20,
            validUntil: "2030-01-31",
            notes: "Yalnızca sentetik teklif.",
          },
        },
      ),
      201,
    )
  ).offer;
  await json(
    await admin.request.post(
      base + `/api/admin/offers/${secondOffer.id}/publish`,
      { data: {} },
    ),
  );
  await adminPage.goto(base + "/yonetim", { waitUntil: "domcontentloaded" });
  await adminPage.getByRole("navigation", { name: "Yönetim menüsü" }).waitFor();
  await selectAdminSection(adminPage);
  await openRequest(adminPage, "Sentetik Yeniden Deneme");
  const secondCard = adminPage.locator(".kp-offer-card.published").first();
  assert.equal(
    await secondCard
      .getByRole("combobox", { name: /İletişim kanalı/ })
      .locator('option[value="phone"]')
      .count(),
    0,
  );
  await secondCard
    .getByText("Bu başvuruda telefonla aranma talebi yoktur.", { exact: true })
    .waitFor();
  assert.equal(
    (
      await admin.request.post(
        base + `/api/admin/offers/${secondOffer.id}/contact`,
        { data: { channel: "phone", note: "Invalid call attempt" } },
      )
    ).status(),
    409,
  );
  pass(
    "a customer who did not opt into a phone call has no phone-contact action in either UI or API",
  );

  const team = (
    await json(
      await admin.request.post(base + "/api/admin/teams", {
        data: {
          name: "Sentetik İç Teknik Ekip",
          contactName: "Teknik Sorumlu",
          phone: "05000000001",
          email: "synthetic-tech@example.com",
          active: true,
        },
      }),
      201,
    )
  ).team;
  await json(
    await admin.request.patch(base + `/api/admin/pipeline/${inquiryId}`, {
      data: { teamId: team.id },
    }),
  );
  await json(
    await admin.request.post(base + "/api/admin/staff", {
      data: {
        username: "project-technician",
        password: staffPassword,
        role: "technician",
        teamId: team.id,
        status: "active",
      },
    }),
    201,
  );
  const technician = await context();
  await json(
    await technician.request.post(base + "/api/staff/login", {
      data: { username: "project-technician", password: staffPassword },
    }),
  );
  const technicianPage = await watchPage(technician);
  await technicianPage.goto(base + "/yonetim", {
    waitUntil: "domcontentloaded",
  });
  await technicianPage
    .getByRole("navigation", { name: "Yönetim menüsü" })
    .waitFor();
  await selectAdminSection(technicianPage);
  await technicianPage
    .locator(".kp-request-list button")
    .filter({ hasText: "Sentetik Proje Müşterisi" })
    .click();
  await technicianPage
    .locator(".kp-request-detail h2")
    .filter({ hasText: "Sentetik Proje Müşterisi" })
    .waitFor();
  await technicianPage
    .locator(".kp-offer-card.published h4")
    .filter({ hasText: offer.title })
    .waitFor();
  assert.equal(await technicianPage.locator(".kp-offer-card.draft").count(), 0);
  assert.equal(
    await technicianPage
      .getByRole("button", { name: "Yeni teklif hazırla", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await technicianPage
      .getByRole("link", { name: "E-posta taslağını indir", exact: true })
      .count(),
    0,
  );
  assert.equal(
    (
      await technician.request.get(
        base + `/api/admin/offers/${offer.id}/email.eml`,
      )
    ).status(),
    403,
  );
  pass(
    "assigned technical staff can inspect project files and issued offers while pricing drafts and email actions remain restricted",
  );

  await adminPage.setViewportSize({ width: 390, height: 844 });
  assert.equal(await noOverflow(adminPage), true);
  await adminPage.screenshot({
    path: join(artifacts, "teklif-yonetim-mobil.png"),
    fullPage: true,
  });
  await retryPage.setViewportSize({ width: 390, height: 844 });
  await openCustomerProjects(retryPage);
  await retryPage
    .locator(".cpq-offer")
    .getByText(secondOffer.title, { exact: true })
    .waitFor();
  assert.equal(await noOverflow(retryPage), true);
  await retryPage.screenshot({
    path: join(artifacts, "musteri-teklif-mobil.png"),
    fullPage: true,
  });
  const mobile = await context({ viewport: { width: 390, height: 844 } });
  const mobilePage = await watchPage(mobile);
  await mobilePage.goto(base + "/proje-teklif", {
    waitUntil: "domcontentloaded",
  });
  await mobilePage.locator("form.pr-form").waitFor();
  assert.equal(await noOverflow(mobilePage), true);
  await mobilePage.screenshot({
    path: join(artifacts, "proje-formu-mobil.png"),
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  pass(
    "project enquiry, quotation editor and customer offer screens fit a 390px viewport without browser exceptions",
  );
  console.log(
    `Project quotation browser: ${checks}/${checks} checks passed; artifacts: ${artifacts}`,
  );
} finally {
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
  app.locals.close();
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  await rm(dataDir, { recursive: true, force: true });
}
