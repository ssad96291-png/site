// Restored corporate/project navigation, CMS content and responsive public flow.
// Run: node --import tsx scripts/corporate-smoke.mjs
// All records are synthetic and isolated from the real .data directory.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../server/app.ts';

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = await import('/opt/codex/cua_node/lib/node_modules/playwright/index.mjs'); }
const dataDir = await mkdtemp(join(tmpdir(), 'kilinc-corporate-'));
const artifactDir = process.env.BROWSER_ARTIFACTS || '/tmp/kilinc-corporate-artifacts';
await mkdir(artifactDir, { recursive: true });
const password = randomBytes(24).toString('base64url');
const oldPassword = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = password;
const app = createApp({ dataDir, staticDir: resolve('dist'), production: false });
if (oldPassword === undefined) delete process.env.ADMIN_PASSWORD;
else process.env.ADMIN_PASSWORD = oldPassword;
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const pageErrors = [];
let browser;
let checks = 0;
const pass = label => { checks++; console.log(`PASS ${label}`); };

try {
  browser = await playwright.chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium',
    headless: true, args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1364, height: 900 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => localStorage.setItem('kilinc-analytics-consent-v1', 'off'));
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => pageErrors.push(error.message));
  const go = async path => {
    await page.goto(base + path, { waitUntil: 'networkidle' });
    await page.locator('#main h1').waitFor();
  };
  const snapshot = async name => {
    await page.mouse.move(5, 500);
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
        scrollTo(0, y);
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      scrollTo(0, 0);
    });
    await page.waitForFunction(() => [...document.images].every(image => image.complete));
    assert.equal(await page.locator('img').evaluateAll(images => images.filter(image => image.getAttribute('src') && !image.naturalWidth).length), 0);
    await page.screenshot({ path: join(artifactDir, name), fullPage: true });
  };
  const initialSite = await (await context.request.get(base + '/api/site')).json();
  await go('/kurumsal');
  assert.equal(new URL(page.url()).pathname, '/kurumsal');
  assert.match(await page.locator('#main h1').innerText(), /Kurumsal/);
  const nav = page.getByRole('navigation', { name: 'Ana menü' });
  assert.equal(await nav.getByRole('link', { name: 'Kurumsal', exact: true }).getAttribute('href'), '/kurumsal');
  await nav.getByRole('button', { name: 'Kurumsal alt menüsü', exact: true }).click();
  const corporateMenu = page.locator('.rs-nav-item').filter({ has: page.getByRole('button', { name: 'Kurumsal alt menüsü', exact: true }) }).locator('.rs-dropdown');
  for (const href of ['/kurumsal/hakkimizda', '/kurumsal/uygulama-sureci', '/kurumsal/teknik-dokumanlar', '/kurumsal/garanti-servis', '/kurumsal/renk-kartelasi', '/kurumsal/terimler-sozlugu']) {
    assert.equal(await corporateMenu.locator(`a[href="${href}"]`).count(), 1, `corporate menu resource ${href}`);
  }
  assert.ok((await corporateMenu.locator('a').count()) >= 8, 'corporate menu exposes rich resources');
  pass('Kurumsal is its own page with the complete resource menu');

  for (const href of ['/kurumsal/hakkimizda', '/kurumsal/uygulama-sureci', '/kurumsal/terimler-sozlugu', '/kurumsal/teknik-dokumanlar', '/kurumsal/olcu-rehberi', '/kurumsal/garanti-servis', '/kurumsal/renk-kartelasi', '/proje-birimi', '/proje-teklif', '/katalog', '/sikca-sorulan-sorular', '/hesabim']) {
    assert.equal(await page.locator(`.rs-hub-grid a[href="${href}"]`).count(), 1, `corporate hub resource ${href}`);
  }
  assert.ok((await page.locator('#main').innerText()).includes(initialSite.settings.aboutText), 'CMS company introduction is visible');
  assert.equal(await page.locator('#main .rs-process-grid article').count(), 4);
  for (let n = 1; n <= 4; n++) {
    assert.ok((await page.locator('#main').innerText()).includes(initialSite.settings[`processStep${n}Title`]));
    assert.ok((await page.locator('#main').innerText()).includes(initialSite.settings[`processStep${n}Text`]));
  }
  await page.keyboard.press('Escape');
  await snapshot('kurumsal-desktop.png');
  pass('company introduction, all four process stages and rich corporate hub are restored');

  const login = await context.request.post(base + '/api/admin/login', { data: { username: 'admin', password } });
  assert.equal(login.status(), 200);
  const updates = {
    aboutText: 'Sentetik firma tanıtımı: Etimesgut’taki dükkânımızda ihtiyaçları birlikte değerlendiriyoruz.',
    aboutTextEn: 'Synthetic company introduction: we review project needs at our Etimesgut shop.',
    processStep1Title: 'Sentetik ihtiyaç görüşmesi',
    processStep1Text: 'Sentetik süreç açıklaması yönetim paneli ayarından değiştirilmiştir.',
  };
  assert.equal((await context.request.put(base + '/api/admin/settings', { data: updates })).status(), 200);
  await go('/kurumsal');
  assert.ok((await page.locator('#main').innerText()).includes(updates.aboutText));
  assert.ok((await page.locator('#main').innerText()).includes(updates.processStep1Title));
  assert.ok((await page.locator('#main').innerText()).includes(updates.processStep1Text));
  await page.getByRole('button', { name: 'Switch to English', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  assert.ok((await page.locator('#main').innerText()).includes(updates.aboutTextEn));
  await page.getByRole('button', { name: 'Türkçeye geç', exact: true }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'tr');
  pass('admin changes to company text and process explanations appear in corporate TR/EN content');

  const corporateProject = initialSite.content.find(item => item.type === 'page' && item.slug === 'kurumsal-projeler-taahhut');
  assert.ok(corporateProject, 'non-dealership corporate project guide is published');
  await go('/kurumsal/kurumsal-projeler-taahhut');
  assert.equal(await page.locator('#main h1').innerText(), corporateProject.title);
  assert.ok(corporateProject.body.length > 100);
  assert.ok((await page.locator('.detail-body .prose').innerText()).includes(corporateProject.body.split('\n').filter(Boolean)[0]));
  assert.equal(await page.locator('a[href*="is-ortakligi"], a[href*="bayi"], a[href*="dealer"]').count(), 0);
  pass('corporate project planning guide returns without dealership features');

  await go('/projeler');
  assert.equal(new URL(page.url()).pathname, '/projeler');
  const projects = initialSite.content.filter(item => item.type === 'project');
  assert.equal(await page.locator('.project-list .project-card').count(), projects.length);
  const filterCategory = projects[0].category;
  await page.locator('.filter-tabs').getByRole('button', { name: filterCategory, exact: true }).click();
  await page.waitForFunction(count => document.querySelectorAll('.project-list .project-card').length === count, projects.filter(item => item.category === filterCategory).length);
  const firstCard = page.locator('.project-list .project-card').first();
  const projectPath = await firstCard.getAttribute('href');
  await firstCard.click();
  await page.waitForURL(base + projectPath);
  await page.locator('#main h1').waitFor();
  assert.ok((await page.locator('.detail-body').innerText()).length > 100);
  pass('separate projects listing filters categories and opens detailed project content');

  await go('/proje-birimi');
  assert.equal(new URL(page.url()).pathname, '/proje-birimi');
  assert.equal(await page.locator('.rs-office-hero').count(), 1);
  assert.equal(await page.locator('.rs-process-grid article').count(), 4);
  assert.ok((await page.locator('#main').innerText()).includes(updates.processStep1Title));
  assert.equal((await context.request.put(base + '/api/admin/settings', { data: {
    aboutText: initialSite.settings.aboutText,
    aboutTextEn: initialSite.settings.aboutTextEn,
    processStep1Title: initialSite.settings.processStep1Title,
    processStep1Text: initialSite.settings.processStep1Text,
  } })).status(), 200);
  await go('/proje-birimi');
  await snapshot('proje-birimi-desktop.png');
  await page.locator('#main a[href="/proje-teklif"]').first().click();
  await page.waitForURL(base + '/proje-teklif');
  await page.locator('.pr-page').waitFor();
  assert.ok(await page.locator('input[type="file"]').count());
  assert.ok(await page.getByText('Çizim / proje üzerinden teklif', { exact: true }).count());
  pass('detailed project office retains CMS process cards and leads to the secure file quotation form');

  const alias = await context.request.get(base + '/dukkanimiz', { maxRedirects: 0 });
  assert.equal(alias.status(), 302);
  assert.equal(alias.headers().location, '/kurumsal');
  await go('/dukkanimiz');
  assert.equal(new URL(page.url()).pathname, '/kurumsal');
  for (const path of ['/bayi', '/bayilik', '/bayiler', '/is-ortakligi', '/franchise']) {
    assert.equal((await context.request.get(base + path)).status(), 410);
  }
  pass('legacy shop address stays compatible while dealership addresses remain closed');

  for (const width of [390, 768, 1024, 1364]) {
    await page.setViewportSize({ width, height: 850 });
    for (const path of ['/kurumsal', '/projeler', '/proje-birimi']) {
      await go(path);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px ${path} overflow`);
    }
  }
  pass('restored corporate, project and project-office screens fit four viewport widths');

  await page.setViewportSize({ width: 390, height: 844 });
  await go('/');
  await page.getByRole('button', { name: 'Menüyü aç/kapat', exact: true }).click();
  await nav.getByRole('button', { name: 'Kurumsal alt menüsü', exact: true }).click();
  const warranty = corporateMenu.locator('a[href="/kurumsal/garanti-servis"]');
  await warranty.scrollIntoViewIfNeeded();
  await warranty.click();
  await page.waitForURL(base + '/kurumsal/garanti-servis');
  await page.locator('#main h1').waitFor();
  await go('/kurumsal');
  await snapshot('kurumsal-mobile.png');
  assert.deepEqual(pageErrors, []);
  pass('mobile corporate submenu reaches warranty guidance without browser errors');

  console.log(`Corporate restoration: ${checks}/${checks} checks passed; artifacts: ${artifactDir}`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  app.locals.close();
  await rm(dataDir, { recursive: true, force: true });
}
