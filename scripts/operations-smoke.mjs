// Run after npm run build: node --import tsx scripts/operations-smoke.mjs
// Uses temporary data, synthetic contacts and generated credentials only.
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
const dataDir = await mkdtemp(join(tmpdir(), "kilinc-operations-browser-"));
const artifactDir =
  process.env.BROWSER_ARTIFACTS || "/tmp/kilinc-operations-artifacts";
await mkdir(artifactDir, { recursive: true });
const adminPassword = randomBytes(24).toString("base64url");
const customerPassword = randomBytes(24).toString("base64url");
const staffPassword = randomBytes(24).toString("base64url");
const previous = process.env.ADMIN_PASSWORD;
const providerVariables = [
  "NOTIFY_WEBHOOK_URL",
  "NOTIFY_WEBHOOK_TOKEN",
  "NOTIFY_ALLOWED_HOSTS",
];
const previousProvider = new Map(
  providerVariables.map((k) => [k, process.env[k]]),
);
process.env.ADMIN_PASSWORD = adminPassword;
for (const name of providerVariables) delete process.env[name];
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
let browser, page;
const errors = [];
let checks = 0;
function pass(label) {
  checks++;
  console.log("PASS", label);
}
async function json(response, expected = 200) {
  assert.equal(
    response.status(),
    expected,
    `Unexpected response from ${new URL(response.url()).pathname}`,
  );
  return response.json();
}
async function saveWithResponse(button, path, method = "POST") {
  const response = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === path && r.request().method() === method,
  );
  await button.click();
  return response;
}
async function selectSection(label) {
  const nav = page.getByRole("navigation", { name: "Yönetim menüsü" });
  const menu = page.getByRole("button", { name: "Menüyü aç", exact: true });
  if (await menu.isVisible()) {
    if (!(await page.locator(".ka-sidebar").getAttribute("class"))?.includes("is-open")) await menu.click();
    await page.waitForFunction(() => document.querySelector(".ka-sidebar").getBoundingClientRect().left >= 0);
  }
  await nav.getByRole("button", { name: label, exact: true }).click();
  await page
    .getByRole("heading", { name: label, level: 1, exact: true })
    .waitFor();
  if (await menu.isVisible()) await page.waitForFunction(() => document.querySelector(".ka-sidebar").getBoundingClientRect().right <= 0);
}
async function login(target, username, password, staff = false) {
  await target.goto(base + "/yonetim", { waitUntil: "networkidle" });
  if (staff)
    await target
      .getByLabel("Hesap türü", { exact: false })
      .selectOption("staff");
  await target.locator("[name=username]").fill(username);
  await target.locator("[name=password]").fill(password);
  const response = target.waitForResponse(
    (r) =>
      new URL(r.url()).pathname ===
        (staff ? "/api/staff/login" : "/api/admin/login") &&
      r.request().method() === "POST",
  );
  await target.getByRole("button", { name: "Giriş yap", exact: true }).click();
  await json(await response);
  await target.getByRole("navigation", { name: "Yönetim menüsü" }).waitFor();
}
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
  page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const customerContext = await browser.newContext();
  const registered = await json(
    await customerContext.request.post(base + "/api/customer/register", {
      data: {
        name: "Sentetik Operasyon Müşterisi",
        email: "operations@example.com",
        phone: "05000000010",
        password: customerPassword,
        consent: true,
      },
    }),
    201,
  );
  const customerId = registered.customer.id;
  const inquiry = await json(
    await customerContext.request.post(base + "/api/inquiries", {
      data: {
        name: "Sentetik Operasyon Müşterisi",
        email: "operations@example.com",
        phone: "05000000010",
        district: "Etimesgut",
        product: "Katlanır Cam Balkon",
        message: "İzole tarayıcı testi için sentetik keşif talebidir.",
        consent: true,
      },
    }),
    201,
  );
  const outsiderContext = await browser.newContext();
  const otherInquiry = await json(
    await outsiderContext.request.post(base + "/api/inquiries", {
      data: {
        name: "Sentetik Kapsam Dışı Talep",
        email: "outside@example.com",
        phone: "05000000019",
        district: "Çankaya",
        product: "Pergola",
        message: "Yetki kapsamı kontrolü için sentetik talep.",
        consent: true,
      },
    }),
    201,
  );
  await login(page, "admin", adminPassword);
  pass(
    "existing administrator login opens the integrated operations navigation",
  );

  await selectSection("Bayi & teknik ekip");
  await page
    .getByRole("button", { name: "Bayi / ekip ekle", exact: true })
    .click();
  const dealerForm = page.locator(".op-dealer-editor form");
  await dealerForm
    .getByLabel("Bayi / ekip adı", { exact: false })
    .fill("Sentetik Etimesgut Ekibi");
  await dealerForm
    .getByLabel("Yetkili kişi", { exact: true })
    .fill("Sentetik Ekip Sorumlusu");
  await dealerForm.getByLabel("Telefon", { exact: true }).fill("05000000011");
  await dealerForm
    .getByLabel("E-posta", { exact: true })
    .fill("operations-team@example.com");
  await dealerForm.getByLabel("Şehir", { exact: true }).fill("Ankara");
  await dealerForm.getByLabel("Merkez ilçe", { exact: true }).fill("Etimesgut");
  await dealerForm
    .getByLabel("Adres", { exact: true })
    .fill("Sentetik test adresi");
  await dealerForm
    .getByLabel("Sorumlu bölgeler", { exact: false })
    .fill("Etimesgut, Eryaman");
  const dealer = (
    await json(
      await saveWithResponse(
        dealerForm.getByRole("button", {
          name: "Bayi / ekibi kaydet",
          exact: true,
        }),
        "/api/admin/dealers",
      ),
      201,
    )
  ).dealer;
  await page
    .locator(".op-dealer-grid article")
    .filter({ hasText: dealer.name })
    .waitFor();
  assert.deepEqual(dealer.regions, ["Etimesgut", "Eryaman"]);
  const routed = await json(
    await outsiderContext.request.post(base + "/api/inquiries", {
      data: {
        name: "Sentetik Otomatik Atama",
        email: "routed@example.com",
        phone: "05000000012",
        district: "Eryaman",
        product: "Cam Balkon",
        message: "Bayi bölgelerine göre gerçek otomatik yönlendirme kontrolü.",
        consent: true,
      },
    }),
    201,
  );
  const pipelineBefore = await json(
    await context.request.get(base + "/api/admin/pipeline"),
  );
  assert.equal(
    pipelineBefore.inquiries.find((i) => i.id === routed.id).dealerId,
    dealer.id,
  );
  pass(
    "dealer form persists both comma-separated regions and routes a real matching inquiry",
  );

  await selectSection("Personel ve roller");
  async function createStaff(username, role) {
    await page
      .getByRole("button", { name: "Personel ekle", exact: true })
      .click();
    const form = page.locator(".op-dealer-editor form");
    await form.getByLabel("Kullanıcı adı", { exact: true }).fill(username);
    await form.getByLabel("İlk parola", { exact: false }).fill(staffPassword);
    await form.locator("select[name=role]").selectOption(role);
    if (role === "dealer")
      await form
        .getByLabel("Bayi / ekip", { exact: false })
        .selectOption(dealer.id);
    const staff = (
      await json(
        await saveWithResponse(
          form.getByRole("button", {
            name: "Personel hesabını kaydet",
            exact: true,
          }),
          "/api/admin/staff",
        ),
        201,
      )
    ).staff;
    await page.getByRole("row").filter({ hasText: username }).waitFor();
    return staff;
  }
  await createStaff("operations.dealer", "dealer");
  await createStaff("operations.editor", "editor");
  pass(
    "staff UI saves independent dealer and content-editor accounts with actual roles",
  );

  await selectSection("Talep süreçleri");
  await page
    .getByRole("textbox", { name: "Süreç ara", exact: true })
    .fill("Sentetik Operasyon");
  await page
    .locator(".op-card-open")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .click();
  let drawer = page.getByRole("dialog", {
    name: "Süreç detayları",
    exact: true,
  });
  await drawer
    .getByLabel("Süreç aşaması", { exact: false })
    .selectOption("surveyed");
  await drawer
    .getByLabel("Atanan bayi / ekip", { exact: false })
    .selectOption(dealer.id);
  await drawer
    .getByLabel("Teknisyen / sorumlu", { exact: true })
    .fill("Sentetik Teknisyen");
  await drawer
    .getByLabel("Keşif / montaj randevusu", { exact: true })
    .fill("2030-01-15T10:00");
  await drawer
    .getByLabel("Müşterinin göreceği durum açıklaması", { exact: false })
    .fill("Keşif tamamlandı; sentetik projenizin üretimi planlanıyor.");
  await drawer
    .getByLabel("Özel ekip notu", { exact: false })
    .fill("SADECE-EKIP-ICIN sentetik özel ekip notu.");
  await drawer.getByLabel("Öncelik", { exact: false }).selectOption("high");
  await json(
    await saveWithResponse(
      drawer.getByRole("button", {
        name: "Süreci ve atamayı kaydet",
        exact: true,
      }),
      "/api/admin/pipeline/" + inquiry.id,
      "PATCH",
    ),
  );
  const updatedPipeline = await json(
    await context.request.get(base + "/api/admin/pipeline"),
  );
  const updated = updatedPipeline.inquiries.find((i) => i.id === inquiry.id);
  assert.equal(updated.stage, "surveyed");
  assert.equal(updated.dealerId, dealer.id);
  assert.equal(updated.technician, "Sentetik Teknisyen");
  assert.equal(updated.priority, "high");
  assert.ok(updated.appointmentAt.startsWith("2030-01-15"));
  const customerView = await json(
    await customerContext.request.get(
      base + "/api/customer/inquiries/" + inquiry.id,
    ),
  );
  assert.ok(!JSON.stringify(customerView).includes("SADECE-EKIP-ICIN"));
  assert.ok(JSON.stringify(customerView).includes("Keşif tamamlandı"));
  pass(
    "pipeline editor saves assignment, stage, appointment and priority while keeping private notes private",
  );
  const guide = await context.request.get(base + "/api/measurement-guide.pdf");
  assert.equal(guide.status(), 200);
  await drawer
    .getByLabel("Belge adı", { exact: true })
    .fill("Sentetik Özel Teklif");
  const uploadResponse = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname ===
        "/api/admin/pipeline/" + inquiry.id + "/documents" &&
      r.request().method() === "POST",
  );
  await drawer
    .locator("input[type=file]")
    .setInputFiles({
      name: "operations-quote.pdf",
      mimeType: "application/pdf",
      buffer: await guide.body(),
    });
  const document = (await json(await uploadResponse, 201)).document;
  await drawer
    .getByRole("link", { name: document.name + " indir", exact: true })
    .waitFor();
  assert.equal(
    (await context.request.get(base + document.downloadUrl)).status(),
    200,
  );
  assert.equal(
    (await outsiderContext.request.get(base + document.downloadUrl)).status(),
    401,
  );
  const privateCustomer = await json(
    await customerContext.request.get(
      base + "/api/customer/inquiries/" + inquiry.id,
    ),
  );
  const ownedDocument = privateCustomer.inquiry.documents.find(
    (d) => d.id === document.id,
  );
  assert.ok(ownedDocument);
  assert.equal(
    (
      await customerContext.request.get(base + ownedDocument.downloadUrl)
    ).status(),
    200,
  );
  await drawer
    .getByLabel("Mesaj konusu", { exact: false })
    .selectOption("revision");
  await drawer
    .getByLabel("Müşteriye mesajınız", { exact: true })
    .fill("Sentetik revize teklifiniz özel belgelere eklendi.");
  await json(
    await saveWithResponse(
      drawer.getByRole("button", { name: "Mesajı gönder", exact: true }),
      "/api/admin/pipeline/" + inquiry.id + "/messages",
    ),
    201,
  );
  await drawer
    .getByText("Sentetik revize teklifiniz özel belgelere eklendi.", {
      exact: true,
    })
    .waitFor();
  await page.screenshot({
    path: join(artifactDir, "admin-pipeline-private-documents.png"),
    fullPage: false,
  });
  pass(
    "admin uploads a real private PDF, authorizes the owner download and sends a revision response",
  );
  await json(
    await saveWithResponse(
      drawer.getByRole("button", { name: document.name + " sil", exact: true }),
      "/api/admin/documents/" + document.id,
      "DELETE",
    ),
  );
  assert.equal(
    (await context.request.get(base + document.downloadUrl)).status(),
    404,
  );
  await drawer
    .getByRole("button", { name: "Süreç detayını kapat", exact: true })
    .click();
  const stageSelect = page.getByLabel(
    "Sentetik Operasyon Müşterisi süreç aşaması",
    { exact: false },
  );
  const stageChange = page.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/admin/pipeline/" + inquiry.id &&
      r.request().method() === "PATCH",
  );
  await stageSelect.selectOption("production");
  await json(await stageChange);
  await stageSelect.waitFor();
  assert.equal(await stageSelect.inputValue(), "production");
  pass(
    "private document deletion revokes access and accessible kanban select changes the saved stage",
  );

  await selectSection("Müşteriler");
  await page
    .getByRole("textbox", { name: "Müşteri ara", exact: true })
    .fill("operations@example.com");
  await page
    .locator(".op-customer-row")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .click();
  let profile = page.locator(".op-detail");
  await profile.getByLabel("Telefon", { exact: true }).fill("05000000013");
  await profile
    .getByLabel("Müşteri türü", { exact: false })
    .selectOption("corporate");
  await profile
    .getByLabel("Adres", { exact: true })
    .fill("Düzeltilmiş sentetik müşteri adresi");
  await profile
    .getByLabel("Hesap durumu", { exact: false })
    .selectOption("suspended");
  await json(
    await saveWithResponse(
      profile.getByRole("button", {
        name: "Müşteri bilgilerini kaydet",
        exact: true,
      }),
      "/api/admin/customers/" + customerId,
      "PATCH",
    ),
  );
  assert.equal(
    (await customerContext.request.get(base + "/api/customer/me")).status(),
    401,
  );
  await profile
    .getByLabel("Hesap durumu", { exact: false })
    .selectOption("active");
  await json(
    await saveWithResponse(
      profile.getByRole("button", {
        name: "Müşteri bilgilerini kaydet",
        exact: true,
      }),
      "/api/admin/customers/" + customerId,
      "PATCH",
    ),
  );
  await json(
    await customerContext.request.post(base + "/api/customer/login", {
      data: { email: "operations@example.com", password: customerPassword },
    }),
  );
  await profile
    .getByLabel("E-posta", { exact: false })
    .fill("operations-corrected@example.com");
  await json(
    await saveWithResponse(
      profile.getByRole("button", {
        name: "Müşteri bilgilerini kaydet",
        exact: true,
      }),
      "/api/admin/customers/" + customerId,
      "PATCH",
    ),
  );
  assert.equal(
    (await customerContext.request.get(base + "/api/customer/me")).status(),
    401,
  );
  const customers = await json(
    await context.request.get(base + "/api/admin/customers"),
  );
  const savedCustomer = customers.customers.find((c) => c.id === customerId);
  assert.equal(savedCustomer.email, "operations-corrected@example.com");
  assert.equal(savedCustomer.phone, "05000000013");
  assert.equal(savedCustomer.customerType, "corporate");
  assert.equal(savedCustomer.status, "active");
  await page
    .getByRole("textbox", { name: "Müşteri ara", exact: true })
    .fill("operations-corrected@example.com");
  await page
    .locator(".op-customer-row")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .click();
  profile = page.locator(".op-detail");
  await profile
    .getByRole("button", { name: "Kurtarma bağlantısı oluştur", exact: true })
    .click();
  const recovery = profile.getByRole("textbox", {
    name: "Müşteri kurtarma bağlantısı",
    exact: true,
  });
  await recovery.waitFor();
  assert.ok((await recovery.inputValue()).startsWith(base + "/hesabim#reset="));
  await profile
    .getByRole("button", { name: "Bağlantıyı ekrandan gizle", exact: true })
    .click();
  assert.equal(await recovery.count(), 0);
  await profile
    .getByRole("button", { name: "Oturumları kapat", exact: true })
    .click();
  await profile
    .getByText("Müşterinin açık oturumları kapatıldı.", { exact: true })
    .waitFor();
  assert.ok(
    (
      await json(
        await context.request.get(
          base + "/api/admin/customers/" + customerId + "/activity",
        ),
      )
    ).events.length > 0,
  );
  await page.screenshot({
    path: join(artifactDir, "admin-customer-repair.png"),
    fullPage: true,
  });
  pass(
    "customer repair saves contact/type, suspends/restores access, corrects login identity, revokes sessions and deliberately reveals/hides recovery",
  );

  await selectSection("Bildirim merkezi");
  await page
    .locator(".op-provider-panel")
    .getByText("Henüz yapılandırılmamış", { exact: false })
    .waitFor();
  await page.locator(".op-outbox").first().waitFor();
  assert.ok(
    (await page.locator(".op-outbox").allInnerTexts()).every((t) =>
      t.includes("Bağlantı bekliyor"),
    ),
  );
  const notifications = await json(
    await context.request.get(base + "/api/admin/notifications"),
  );
  assert.equal(notifications.delivery.configured, false);
  assert.ok(notifications.outbox.length > 0);
  const unread = page.locator(".op-notification.unread button").first();
  if (await unread.count()) {
    const response = page.waitForResponse(
      (r) =>
        /\/api\/admin\/notifications\/[^/]+\/read$/.test(
          new URL(r.url()).pathname,
        ) && r.request().method() === "POST",
    );
    await unread.click();
    await json(await response);
  }
  const retryResponse = page.waitForResponse(
    (r) =>
      /\/api\/admin\/outbox\/[^/]+\/retry$/.test(new URL(r.url()).pathname) &&
      r.request().method() === "POST",
  );
  await page
    .locator(".op-outbox")
    .first()
    .getByRole("button", { name: "Yeniden dene", exact: true })
    .click();
  await json(await retryResponse);
  await page.screenshot({
    path: join(artifactDir, "admin-notification-queue.png"),
    fullPage: true,
  });
  pass(
    "notifications show real unconfigured delivery, persist read state and retry without claiming delivery",
  );

  const dealerContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const dealerPage = await dealerContext.newPage();
  dealerPage.on("pageerror", (e) => errors.push(e.message));
  await login(dealerPage, "operations.dealer", staffPassword, true);
  const dealerNav = dealerPage.getByRole("navigation", {
    name: "Yönetim menüsü",
  });
  assert.equal(
    await dealerNav
      .getByRole("button", { name: "Müşteriler", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await dealerNav
      .getByRole("button", { name: "Personel ve roller", exact: true })
      .count(),
    0,
  );
  assert.equal(
    await dealerNav
      .getByRole("button", { name: "Ürün kataloğu", exact: true })
      .count(),
    0,
  );
  const dealerPipeline = await json(
    await dealerContext.request.get(base + "/api/admin/pipeline"),
  );
  assert.ok(dealerPipeline.inquiries.some((i) => i.id === inquiry.id));
  assert.ok(!dealerPipeline.inquiries.some((i) => i.id === otherInquiry.id));
  assert.equal(
    (await dealerContext.request.get(base + "/api/admin/content")).status(),
    403,
  );
  const dealerCustomers = await json(
    await dealerContext.request.get(base + "/api/admin/customers"),
  );
  const allowedCustomerIds = new Set(
    dealerPipeline.inquiries.map((i) => i.customerId).filter(Boolean),
  );
  assert.ok(
    dealerCustomers.customers.every((c) => allowedCustomerIds.has(c.id)),
  );
  assert.equal(
    (
      await dealerContext.request.patch(
        base + "/api/admin/customers/" + customerId,
        { data: { name: "Forbidden" } },
      )
    ).status(),
    403,
  );
  await dealerPage
    .getByRole("textbox", { name: "Süreç ara", exact: true })
    .fill("Sentetik Operasyon");
  await dealerPage
    .locator(".op-card-open")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .click();
  const dealerDrawer = dealerPage.getByRole("dialog", {
    name: "Süreç detayları",
    exact: true,
  });
  assert.equal(
    await dealerDrawer
      .getByLabel("Atanan bayi / ekip", { exact: false })
      .isDisabled(),
    true,
  );
  await dealerDrawer
    .getByLabel("Süreç aşaması", { exact: false })
    .selectOption("installation");
  const dealerSave = dealerPage.waitForResponse(
    (r) =>
      new URL(r.url()).pathname === "/api/admin/pipeline/" + inquiry.id &&
      r.request().method() === "PATCH",
  );
  await dealerDrawer
    .getByRole("button", { name: "Süreci ve atamayı kaydet", exact: true })
    .click();
  await json(await dealerSave);
  await dealerDrawer
    .getByRole("button", { name: "Süreç detayını kapat", exact: true })
    .click();
  await dealerPage.screenshot({
    path: join(artifactDir, "dealer-scoped-pipeline.png"),
    fullPage: false,
  });
  pass(
    "staff account-type login gives dealer only assigned inquiries and denies legacy CMS and customer mutation while saving allowed stage updates",
  );
  const editorContext = await browser.newContext();
  const editorPage = await editorContext.newPage();
  editorPage.on("pageerror", (e) => errors.push(e.message));
  await login(editorPage, "operations.editor", staffPassword, true);
  const editorNav = editorPage.getByRole("navigation", {
    name: "Yönetim menüsü",
  });
  assert.equal(
    await editorNav
      .getByRole("button", { name: "Talep süreçleri", exact: true })
      .count(),
    0,
  );
  assert.ok(
    (await editorContext.request.get(base + "/api/admin/content")).ok(),
  );
  assert.equal(
    (await editorContext.request.get(base + "/api/admin/pipeline")).status(),
    403,
  );
  assert.equal(
    (await editorContext.request.get(base + "/api/admin/staff")).status(),
    403,
  );
  pass(
    "editor account exposes content navigation and backend denies operational and staff data",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  await selectSection("Talep süreçleri");
  await page
    .getByRole("textbox", { name: "Süreç ara", exact: true })
    .fill("Sentetik Operasyon");
  await page
    .locator(".op-card-open")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .waitFor();
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Admin mobile viewport overflows horizontally",
  );
  await page.screenshot({
    path: join(artifactDir, "admin-mobile-pipeline-390.png"),
    fullPage: false,
  });
  await page
    .locator(".op-card-open")
    .filter({ hasText: "Sentetik Operasyon Müşterisi" })
    .click();
  await page
    .getByRole("dialog", { name: "Süreç detayları", exact: true })
    .waitFor();
  assert.ok(
    await page.evaluate(() => {
      const r = document.querySelector(".op-drawer").getBoundingClientRect();
      return r.width <= innerWidth && r.left >= 0;
    }),
  );
  await page.screenshot({
    path: join(artifactDir, "admin-mobile-process-detail-390.png"),
    fullPage: false,
  });
  await page.keyboard.press("Escape");
  await page
    .getByRole("dialog", { name: "Süreç detayları", exact: true })
    .waitFor({ state: "hidden" });
  pass(
    "390px admin menu, kanban and process drawer fit the screen and the drawer closes with Escape",
  );
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    `Operations browser smoke: ${checks} checks passed. Screenshots: ${artifactDir}`,
  );
} catch (error) {
  if (page) {
    await page
      .locator(".op-recovery")
      .evaluateAll((nodes) => nodes.forEach((n) => n.remove()))
      .catch(() => {});
    await page
      .screenshot({
        path: join(artifactDir, "operations-failure.png"),
        fullPage: true,
      })
      .catch(() => {});
  }
  throw error;
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
  for (const [name, value] of previousProvider) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}
