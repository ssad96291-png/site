// Original single-shop public flows. All enquiries, users and credentials are temporary.
// Run after npm run build: node --import tsx scripts/local-shop-smoke.mjs
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../server/app.ts';
let pw;
try { pw = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { pw = await import('/opt/codex/cua_node/lib/node_modules/playwright/index.mjs'); }
const dataDir = await mkdtemp(join(tmpdir(), 'kilinc-local-browser-'));
const artifactDir = process.env.BROWSER_ARTIFACTS || '/tmp/kilinc-local-artifacts';
await mkdir(artifactDir, { recursive: true });
const password = randomBytes(24).toString('base64url');
const previous = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = password;
const app = createApp({ dataDir, staticDir: resolve('dist'), production: false });
if (previous === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = previous;
const server = app.listen(0, '127.0.0.1');
await new Promise((r, reject) => { server.once('listening', r); server.once('error', reject); });
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const errors = [];
const pass = message => { checks++; console.log('PASS', message); };
try {
  browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1364, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => { try { localStorage.setItem('kilinc-analytics-consent-v1', 'off'); } catch {} });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', e => errors.push(e.message));
  const go = path => page.goto(base + path, { waitUntil: 'networkidle' });
  const screenshot = async name => {
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
        scrollTo(0, y); await new Promise(r => setTimeout(r, 50));
      }
      scrollTo(0, 0);
    });
    await page.waitForFunction(() => [...document.images].every(i => i.complete));
    assert.equal(await page.locator('img').evaluateAll(images => images.filter(i => i.getAttribute('src') && !i.naturalWidth).length), 0, 'all public illustrations load');
    await page.screenshot({ path: join(artifactDir, name), fullPage: true });
  };
  await go('/');
  await page.locator('h1').waitFor();
  assert.match(await page.locator('h1').innerText(), /Ölçünüze göre/);
  assert.match(await page.locator('#main').innerText(), /Tek dükkân/);
  const nav = page.getByRole('navigation', { name: 'Ana menü', exact: true });
  for (const href of ['/hizmetler', '/fikir-defteri', '/dukkanimiz', '/iletisim']) assert.equal(await nav.locator(`a[href="${href}"]`).count(), 1);
  assert.equal(await page.locator('[class^="rs-"], [class*=" rs-"]').count(), 0);
  assert.equal(await page.getByRole('button', { name: /slayt|alt menüsü/i }).count(), 0);
  assert.equal(await page.locator('a[href*="is-ortakligi"],a[href*="bayi"],a[href*="dealer"]').count(), 0);
  assert.doesNotMatch(await page.locator('body').innerText(), /bayilik|\bbayi\b|franchise|dealership/i);
  await screenshot('home-desktop.png');
  pass('single-shop identity, direct navigation and new workshop layout replace the old carousel and dealer links');

  await page.getByRole('combobox', { name: /Uygulama alanı/ }).selectOption('Teras / bahçe');
  await page.getByRole('radio', { name: 'Bakım / onarım', exact: true }).check();
  await page.getByRole('link', { name: 'Bu notla devam et', exact: true }).click();
  await page.waitForURL(/\/teklif-al\?mesaj=/);
  assert.match(await page.locator('[name=message]').inputValue(), /Teras \/ bahçe.*Bakım \/ onarım/);
  pass('the initial conversation note carries selected space and repair need into the actual enquiry');

  await go('/hizmetler');
  const total = await page.locator('.ls-service-row').count();
  assert.ok(total >= 16);
  await page.getByRole('button', { name: 'Metal', exact: true }).click();
  await page.waitForURL(/grup=metal/);
  await page.waitForFunction(before => document.querySelectorAll('.ls-service-row').length < before, total);
  assert.ok(await page.locator('.ls-service-row').count() < total);
  await page.getByRole('textbox', { name: 'Ürün ara', exact: true }).fill('ferforje');
  assert.equal(await page.locator('.ls-service-row').count(), 1);
  const detail = page.locator('.ls-service-row h3 a');
  const title = await detail.innerText();
  await detail.click();
  await page.waitForURL(/\/urunler\//);
  await page.getByRole('heading', { name: title, exact: true, level: 1 }).waitFor();
  assert.equal(await page.locator('h1').innerText(), title);
  pass('service family and search filter real CMS rows and open the correct product detail');

  await go('/fikir-defteri');
  const tabs = page.getByRole('tab');
  assert.ok(await tabs.count() >= 2);
  await tabs.first().focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(id => document.getElementById(id)?.getAttribute('aria-selected') === 'true', await tabs.nth(1).getAttribute('id'));
  assert.equal(await tabs.nth(1).getAttribute('aria-selected'), 'true');
  const ideaTitle = await page.getByRole('tabpanel').locator('h2').innerText();
  await page.getByRole('link', { name: 'Kendi alanım için konuşalım', exact: true }).click();
  assert.ok((await page.locator('[name=message]').inputValue()).includes(ideaTitle));
  await go('/fikir-defteri');
  await screenshot('notebook-desktop.png');
  pass('the notebook has accessible project selection and carries the actual selected concept into a quote');

  await go('/dukkanimiz');
  assert.match(await page.locator('h1').innerText(), /Bir dükkân/);
  assert.doesNotMatch(await page.locator('body').innerText(), /bayilik|\bbayi\b|franchise|dealership/i);
  await go('/hizmet-alani');
  await page.getByRole('combobox', { name: 'Bölge', exact: true }).selectOption('baglica');
  assert.equal(await page.locator('.ls-area-list article').count(), 1);
  await page.getByRole('link', { name: 'Adresim için keşif iste', exact: true }).click();
  assert.equal(await page.locator('[name=district]').inputValue(), 'Bağlıca');
  assert.equal((await context.request.get(base + '/api/dealers')).status(), 410);
  pass('one local shop and service-area planning replace the public dealer directory');

  await page.locator('[name=name]').fill('Yerel Dükkân Sentetik Müşteri');
  await page.locator('[name=phone]').fill('05000000000');
  await page.locator('[name=message]').fill('Bağlıca için tek dükkân üzerinden sentetik keşif talebi.');
  await page.locator('[name=consent]').check();
  const created = page.waitForResponse(r => r.url().endsWith('/api/inquiries') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Talebimi gönder', exact: true }).click();
  const createdResponse = await created;
  assert.equal(createdResponse.status(), 201);
  const receipt = await createdResponse.json();
  assert.ok(receipt.trackingToken);
  await page.getByRole('heading', { name: 'Talebiniz bize ulaştı.', exact: true }).waitFor();
  await page.getByRole('link', { name: 'Talebimi takip et', exact: true }).waitFor();
  assert.equal((await context.request.post(base + '/api/admin/login', { data: { username: 'admin', password } })).status(), 200);
  const leads = await (await context.request.get(base + '/api/admin/inquiries')).json();
  assert.equal(leads.inquiries.find(i => i.id === receipt.id).district, 'Bağlıca');
  pass('a real public enquiry persists in the private CRM and provides protected customer tracking');

  await go('/urun-karsilastir');
  const compareButtons = page.locator('.product-card .compare-button');
  await compareButtons.nth(0).click();
  await compareButtons.nth(1).click();
  await page.locator('.compare-bar').getByRole('button', { name: 'Karşılaştır', exact: true }).click();
  await page.getByRole('dialog', { name: 'Sistem karşılaştırması', exact: true }).waitFor();
  assert.equal(await page.locator('.compare-grid > div').count(), 2);
  await page.getByRole('button', { name: 'Kapat', exact: true }).click();
  await go('/kurumsal/terimler-sozlugu');
  await page.getByRole('textbox', { name: 'Terim ara', exact: true }).fill('EPDM');
  assert.equal(await page.locator('.ls-definition-notes > div').count(), 1);
  pass('existing comparison and searchable technical notes remain functional');

  await go('/kurumsal/renk-kartelasi');
  await page.getByRole('button', { name: 'Orman yeşili', exact: true }).click();
  await page.getByRole('link', { name: 'Bu renkle teklif iste', exact: true }).click();
  assert.match(await page.locator('[name=message]').inputValue(), /Orman yeşili/);
  await go('/katalog');
  for (const family of ['all', 'outdoor', 'aluminium', 'metal']) {
    await page.getByRole('combobox').selectOption(family);
    const href = await page.getByRole('link', { name: 'Seçtiğim dosyayı indir', exact: true }).getAttribute('href');
    assert.ok(new URL(href, base).searchParams.get('family') === family);
    const response = await context.request.get(base + href);
    assert.equal(response.status(), 200);
    assert.equal((await response.body()).subarray(0, 5).toString(), '%PDF-');
  }
  const measurement = await context.request.get(base + '/api/measurement-guide.pdf');
  assert.equal(measurement.status(), 200);
  assert.equal((await measurement.body()).subarray(0, 5).toString(), '%PDF-');
  pass('colour enquiries and the simplified file selector download genuine current PDFs');

  await go('/');
  await page.locator('.ls-footer').getByRole('link', { name: 'İçerik hakları', exact: true }).click();
  await page.getByRole('heading', { name: 'İçerik ve Kullanım Hakları', exact: true, level: 1 }).waitFor();
  assert.match(await page.locator('h1').innerText(), /İçerik ve Kullanım Hakları/);
  const notices = await context.request.get(base + '/licenses/THIRD-PARTY-NOTICES.txt');
  assert.equal(notices.status(), 200);
  assert.match(await notices.text(), /SIL OPEN FONT LICENSE|SIL Open Font License/i);
  await go('/servis-talebi');
  await page.locator('[name=name]').fill('Yerel Sentetik Servis');
  await page.locator('[name=phone]').fill('05000000000');
  await page.locator('[name=message]').fill('Ray bakım kontrolü için sentetik servis talebidir.');
  await page.locator('[name=consent]').check();
  await page.getByRole('button', { name: 'Talebimi gönder', exact: true }).click();
  await page.getByRole('heading', { name: 'Talebiniz bize ulaştı.', exact: true }).waitFor();
  const serviceLeads = await (await context.request.get(base + '/api/admin/inquiries')).json();
  assert.equal(serviceLeads.inquiries.find(i => i.name === 'Yerel Sentetik Servis').subject, 'Servis talebi');
  pass('content rights notices and direct service requests remain available without a partnership application');

  await go('/');
  await page.getByRole('button', { name: 'İngilizceye geç', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.match(await page.locator('h1').innerText(), /Made to fit/);
  assert.doesNotMatch(await page.locator('body').innerText(), /dealership|franchise/i);
  await page.getByRole('button', { name: 'Switch to Turkish', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'tr');
  assert.equal(await page.locator('html').getAttribute('lang'), 'tr');
  pass('the same single-shop identity and accessible navigation work in Turkish and English');

  for (const width of [390, 768, 1024, 1364]) {
    await page.setViewportSize({ width, height: 850 });
    for (const path of ['/', '/hizmetler', '/fikir-defteri', '/dukkanimiz', '/hizmet-alani', '/teklif-al', '/kurumsal/renk-kartelasi']) {
      await go(path);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px ${path} overflow`);
    }
  }
  pass('seven key pages fit 390, 768, 1024 and 1364 pixel viewports');
  await page.setViewportSize({ width: 390, height: 844 });
  await go('/');
  await page.getByRole('button', { name: 'Menüyü aç/kapat', exact: true }).click();
  await page.getByRole('navigation', { name: 'Ana menü', exact: true }).getByRole('link', { name: 'Fikir defteri', exact: true }).click();
  await page.waitForURL(base + '/fikir-defteri');
  await screenshot('notebook-mobile.png');
  await go('/');
  await screenshot('home-mobile.png');
  assert.deepEqual(errors, []);
  pass('mobile navigation works and public flows produce no browser exceptions');
  console.log(`Local shop browser: ${checks}/${checks} checks passed; artifacts: ${artifactDir}`);
} finally {
  if (browser) await browser.close();
  await new Promise(r => server.close(r));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
