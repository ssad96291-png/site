// Run from the repository root with: node --import tsx scripts/browser-smoke.mjs
// Requires Playwright and a Chromium executable; all test data is temporary.
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { createApp } from '../server/app.ts';

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = await import('/opt/codex/cua_node/lib/node_modules/playwright/index.mjs'); }
const dataDir = await mkdtemp(join(tmpdir(), 'kilinc-browser-'));
const artifactDir = process.env.BROWSER_ARTIFACTS || join(tmpdir(), 'kilinc-browser-artifacts');
await mkdir(artifactDir, { recursive: true });
const password = randomBytes(24).toString('base64url');
const previousPassword = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = password;
const app = createApp({ dataDir, staticDir: resolve('dist'), production: false });
if (previousPassword === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = previousPassword;
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
const pageErrors = [];
const checkpoints = [];
function pass(label) { checkpoints.push(label); console.log(`PASS ${label}`); }
async function loadLazyImages(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 65));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => [...document.images].every(image => image.complete));
}
try {
  browser = await playwright.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const initialSite = await (await context.request.get(`${base}/api/site`)).json();
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await loadLazyImages(page);
  assert.ok(await page.locator('h1').innerText());
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.screenshot({ path: join(artifactDir, 'home-desktop.png'), fullPage: true });
  pass('desktop homepage renders without overflow');

  await page.goto(`${base}/bolgeler`, { waitUntil: 'networkidle' });
  const regionLink = page.locator('a[href^="/bolgeler/"]').first();
  assert.ok(await regionLink.count(), 'seeded region links exist');
  const regionPath = await regionLink.getAttribute('href');
  await regionLink.click();
  await page.waitForURL(`${base}${regionPath}`);
  assert.ok((await page.locator('h1').innerText()).length > 4);
  pass('region listing opens a populated detail page');

  await page.goto(`${base}/sistem-secici`, { waitUntil: 'networkidle' });
  await page.getByLabel('Genişlik (m)', { exact: true }).fill('4');
  await page.getByLabel('Yükseklik (m)', { exact: true }).fill('2.5');
  assert.match(await page.locator('.area-result').innerText(), /10/);
  await page.getByRole('link', { name: 'Bu bilgilerle keşif iste' }).click();
  await page.waitForURL(/\/teklif-al\?/);
  assert.equal(await page.locator('[name="dimensions"]').inputValue(), '4 m × 2.5 m');
  await page.locator('[name="name"]').fill('Tarayıcı Test Müşterisi');
  await page.locator('[name="phone"]').fill('05000000000');
  await page.locator('[name="email"]').fill('browser-test@example.com');
  await page.locator('[name="district"]').fill('Etimesgut');
  await page.locator('[name="message"]').fill('Balkon sistemleri için sentetik tarayıcı testi talebidir.');
  await page.locator('[name="consent"]').check();
  const inquiryResult = page.waitForResponse(r => r.url().endsWith('/api/inquiries') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Talebimi gönder' }).click();
  assert.equal((await inquiryResult).status(), 201);
  await page.getByRole('heading', { name: 'Talebiniz bize ulaştı.' }).waitFor();
  pass('system finder pre-fills dimensions and public form stores enquiry');

  await page.goto(`${base}/yonetim`, { waitUntil: 'networkidle' });
  await page.locator('[name="username"]').fill('admin');
  await page.locator('[name="password"]').fill(password);
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).click();
  await page.getByRole('heading', { name: 'Genel bakış', exact: true }).waitFor();
  await page.getByRole('navigation', { name: 'Yönetim menüsü' }).getByRole('button', { name: /Teklif talepleri/ }).click();
  await page.locator('.ka-lead-item').filter({ hasText: 'Tarayıcı Test Müşterisi' }).click();
  await page.getByLabel('Talep durumu').selectOption('contacted');
  await page.getByLabel('Öncelik', { exact: false }).last().selectOption('high');
  await page.getByLabel('Takip tarihi').fill('2030-01-15');
  await page.getByPlaceholder('Görüşme sonucu, keşif planı, teklif bilgileri…').fill('Sentetik özel görüşme notu.');
  const patchResult = page.waitForResponse(r => r.request().method() === 'PATCH' && r.url().includes('/api/admin/inquiries/'));
  await page.getByRole('button', { name: 'Takibi kaydet' }).click();
  assert.equal((await patchResult).status(), 200);
  const leads = await (await context.request.get(`${base}/api/admin/inquiries`)).json();
  const lead = leads.inquiries.find(i => i.name === 'Tarayıcı Test Müşterisi');
  assert.equal(lead.status, 'contacted'); assert.equal(lead.priority, 'high');
  assert.equal(lead.notes, 'Sentetik özel görüşme notu.'); assert.equal(lead.followUpDate, '2030-01-15');
  pass('admin login and CRM status, priority, notes and follow-up persist');

  const nav = page.getByRole('navigation', { name: 'Yönetim menüsü' });
  await nav.getByRole('button', { name: 'Ürünler', exact: true }).click();
  await page.getByRole('button', { name: 'Yeni ürün ekle' }).click();
  await page.getByLabel('Başlık *', { exact: true }).fill('Tarayıcı Test Ürünü');
  await page.getByLabel('Kısa açıklama').fill('Test için oluşturulan sentetik ürün açıklaması.');
  await page.getByLabel('Detaylı içerik').fill('Bu kayıt tarayıcı testi tarafından oluşturulmuştur.');
  await page.getByRole('tab', { name: 'Arama motorları', exact: true }).click();
  await page.getByLabel('SEO başlığı').fill('Tarayıcı Test SEO');
  await page.getByLabel('SEO açıklaması').fill('Tarayıcıyla doğrulanan SEO açıklaması.');
  const createdResult = page.waitForResponse(r => r.url().endsWith('/api/admin/content') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  const createdResponse = await createdResult;
  assert.equal(createdResponse.status(), 201);
  const draft = (await createdResponse.json()).content;
  assert.equal(draft.published, false); assert.equal(draft.seoTitle, 'Tarayıcı Test SEO');
  let publicContent = await (await context.request.get(`${base}/api/site`)).json();
  assert.equal(publicContent.content.some(c => c.id === draft.id), false);
  await page.getByRole('button', { name: 'Tarayıcı Test Ürünü içeriğini düzenle', exact: true }).click();
  await page.getByRole('checkbox', { name: /^Yayında/ }).check();
  const updatedResult = page.waitForResponse(r => r.url().endsWith(`/api/admin/content/${draft.id}`) && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Değişiklikleri kaydet' }).click();
  assert.equal((await updatedResult).status(), 200);
  publicContent = await (await context.request.get(`${base}/api/site`)).json();
  assert.equal(publicContent.content.some(c => c.id === draft.id), true);
  pass('content editor saves SEO and safely transitions draft to published');

  await nav.getByRole('button', { name: 'Site ayarları', exact: true }).click();
  await page.getByRole('button', { name: 'Ana sayfa', exact: true }).click();
  await page.getByLabel('Ana başlık', { exact: true }).fill('Tarayıcı testinden güncellenen başlık');
  const settingsResult = page.waitForResponse(r => r.url().endsWith('/api/admin/settings') && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Tüm ayarları kaydet' }).click();
  assert.equal((await settingsResult).status(), 200);
  const publicPage = await context.newPage();
  publicPage.on('pageerror', error => pageErrors.push(error.message));
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await publicPage.locator('h1').innerText(), 'Tarayıcı testinden güncellenen başlık');
  await publicPage.goto(`${base}/urunler/${draft.slug}`, { waitUntil: 'networkidle' });
  assert.equal(await publicPage.title(), 'Tarayıcı Test SEO');
  assert.equal(await publicPage.locator('meta[name="description"]').getAttribute('content'), 'Tarayıcıyla doğrulanan SEO açıklaması.');
  await page.getByRole('button', { name: 'Arama motorları', exact: true }).click();
  await page.getByLabel('Yayın alan adı').fill('https://example.com');
  const canonicalSettings = page.waitForResponse(r => r.url().endsWith('/api/admin/settings') && r.request().method() === 'PUT');
  await page.getByRole('button', { name: 'Tüm ayarları kaydet' }).click();
  assert.equal((await canonicalSettings).status(), 200);
  await publicPage.reload({ waitUntil: 'networkidle' });
  assert.equal(await publicPage.locator('link[rel="canonical"]').getAttribute('href'), `https://example.com/urunler/${draft.slug}`);
  pass('saved homepage settings and per-content SEO appear publicly');

  const languageSetting = await context.request.put(`${base}/api/admin/settings`, { data: { languages: ['tr'] } });
  assert.equal(languageSetting.status(), 200);
  await publicPage.evaluate(() => localStorage.setItem('kilinc-locale', 'en'));
  await publicPage.goto(base, { waitUntil: 'networkidle' });
  assert.equal(await publicPage.locator('.language').count(), 0);
  assert.equal(await publicPage.locator('html').getAttribute('lang'), 'tr');
  assert.equal((await context.request.put(`${base}/api/admin/settings`, { data: { languages: ['tr', 'en'], heroTitle: initialSite.settings.heroTitle } })).status(), 200);
  await publicPage.reload({ waitUntil: 'networkidle' });
  assert.equal(await publicPage.locator('.language').count(), 1);
  pass('language setting hides disabled English and restores switch when enabled');

  await nav.getByRole('button', { name: 'Görsel kütüphanesi', exact: true }).click();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0wAAAABJRU5ErkJggg==', 'base64');
  const uploadResult = page.waitForResponse(r => r.url().endsWith('/api/admin/upload') && r.request().method() === 'POST');
  await page.locator('input[type="file"]').setInputFiles({ name: 'browser-test.png', mimeType: 'image/png', buffer: png });
  const uploadResponse = await uploadResult;
  assert.equal(uploadResponse.status(), 201);
  const uploaded = (await uploadResponse.json()).url;
  await page.locator('.ka-media-card').first().waitFor();
  assert.equal((await context.request.get(`${base}${uploaded}`)).status(), 200);
  pass('media upload is listed and accessible');

  await nav.getByRole('button', { name: 'İşlem geçmişi & yedek', exact: true }).click();
  await page.locator('.ka-audit-target').first().waitFor();
  const backupResponse = await context.request.get(`${base}/api/admin/export`);
  assert.equal(backupResponse.status(), 200);
  const backup = await backupResponse.json();
  assert.ok(backup.content.some(c => c.id === draft.id));
  assert.equal('users' in backup, false); assert.equal('sessions' in backup, false);
  const csvResponse = await context.request.get(`${base}/api/admin/inquiries.csv`);
  assert.equal(csvResponse.status(), 200); assert.match(await csvResponse.text(), /Tarayıcı Test Müşterisi/);
  pass('audit and safe JSON/CSV exports work');
  await page.screenshot({ path: join(artifactDir, 'admin-desktop.png'), fullPage: true });

  const mobileAdmin = await context.newPage();
  await mobileAdmin.setViewportSize({ width: 390, height: 844 });
  mobileAdmin.setDefaultTimeout(10000);
  await mobileAdmin.goto(`${base}/yonetim`, { waitUntil: 'networkidle' });
  await mobileAdmin.getByRole('heading', { name: 'Genel bakış', exact: true }).waitFor();
  assert.equal(await mobileAdmin.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await mobileAdmin.getByRole('button', { name: 'Menüyü aç', exact: true }).click();
  await mobileAdmin.getByRole('navigation', { name: 'Yönetim menüsü' }).getByRole('button', { name: 'Site ayarları', exact: true }).click();
  await mobileAdmin.getByRole('heading', { name: 'Site ayarları', exact: true }).waitFor();
  await mobileAdmin.waitForFunction(() => document.querySelector('.ka-sidebar').getBoundingClientRect().right <= 1);
  assert.equal(await mobileAdmin.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.equal(await mobileAdmin.evaluate(() => ['.ka-settings-form','.ka-settings-section','.ka-settings-section>div','.ka-settings-section .ka-field'].every(selector => document.querySelector(selector).getBoundingClientRect().right <= innerWidth)), true);
  await mobileAdmin.screenshot({ path: join(artifactDir, 'admin-mobile.png'), fullPage: true });
  pass('authenticated mobile dashboard, menu and settings fit 390px');

  await page.getByRole('button', { name: 'Güvenli çıkış', exact: true }).click();
  await page.getByRole('button', { name: 'Giriş yap', exact: true }).waitFor();
  assert.equal((await context.request.get(`${base}/api/admin/content`)).status(), 401);
  pass('logout revokes authenticated access');

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  for (const path of ['/', '/urunler', '/bolgeler', '/sistem-secici', '/teklif-al', '/yonetim']) {
    await mobile.goto(base + path, { waitUntil: 'networkidle' });
    assert.equal(await mobile.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} mobile overflow`);
  }
  await mobile.goto(base, { waitUntil: 'networkidle' });
  await loadLazyImages(mobile);
  await mobile.screenshot({ path: join(artifactDir, 'home-mobile.png'), fullPage: true });
  pass('390px layouts have no horizontal overflow');
  assert.deepEqual(pageErrors, []);
  console.log(`Browser smoke: ${checkpoints.length} checks passed; artifacts: ${artifactDir}`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
