// Real admin status, re-authenticated downloads and mobile instructions.
// node --import tsx scripts/system-smoke.mjs (Playwright + Chromium required)
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createApp } from '../server/app.ts';
import { decodePortableBackup } from '../server/data-portability.ts';

let playwright;
try { playwright = await import(process.env.PLAYWRIGHT_MODULE || 'playwright'); }
catch { playwright = await import('/opt/codex/cua_node/lib/node_modules/playwright/index.mjs'); }
const home = await mkdtemp(join(tmpdir(), 'kilinc-system-browser-'));
const dataDir = join(home, 'data');
const artifacts = process.env.SYSTEM_BROWSER_ARTIFACTS || '/tmp/kilinc-system-artifacts';
await mkdir(artifacts, { recursive: true });
const envNames = ['ADMIN_PASSWORD', 'DATA_ENCRYPTION_KEY', 'DATA_ENCRYPTION_KEY_FILE', 'CLAMAV_HOST', 'CLAMAV_PORT'];
const saved = Object.fromEntries(envNames.map(name => [name, process.env[name]]));
for (const name of envNames) delete process.env[name];
const password = randomBytes(24).toString('base64url');
const master = randomBytes(32);
process.env.ADMIN_PASSWORD = password;
process.env.DATA_ENCRYPTION_KEY = master.toString('base64');
const app = createApp({ dataDir, staticDir: resolve('dist'), production: false });
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
let checks = 0;
const pass = label => { checks++; console.log('PASS', label); };
const pageErrors = [];

try {
  browser = await playwright.chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1364, height: 920 }, acceptDownloads: true, reducedMotion: 'reduce' });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => pageErrors.push(error.message));
  assert.equal((await context.request.post(base + '/api/admin/login', { data: { username: 'admin', password } })).status(), 200);
  await page.goto(base + '/yonetim', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Veri, yedek & güvenlik', exact: true }).click();
  await page.getByRole('heading', { name: 'Veri, yedek ve güvenlik merkezi', exact: true }).waitFor();
  await page.getByText('Diskte şifreli saklama etkin', { exact: true }).waitFor();
  const status = await (await context.request.get(base + '/api/admin/system/status')).json();
  assert.equal(status.database.enabled, true);
  const contentMetric = page.locator('.sc-counts > div').filter({ hasText: 'Site içeriği' });
  assert.equal(await contentMetric.locator('strong').innerText(), status.counts.content.toLocaleString('tr-TR'));
  assert.equal(await page.getByText('Geliştirme: sınırlı denetim', { exact: true }).count(), 1);
  assert.equal((await page.locator('.sc-root').innerText()).includes(master.toString('base64')), false);
  pass('system screen shows live encrypted-database counts and honest limited development scanning status');

  await page.locator('.ah-root > summary').click();
  assert.equal(await page.locator('.ah-root[open] .ah-body li').count(), 3);
  await page.locator('.sc-restore-guide > summary').click();
  assert.match(await page.locator('.sc-restore-guide').innerText(), /boş bir veri klasörü/);
  pass('short expandable instructions explain backup, separate keys and restoration into a new folder');

  const passwordInput = page.locator('.sc-backup-form input[name="currentPassword"]');
  await passwordInput.fill('synthetic-wrong-password');
  await page.getByRole('button', { name: 'Şifreli yedeği indir', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Mevcut yönetici parolanızı doğrulayın.' }).waitFor();
  assert.equal(await passwordInput.inputValue(), '');
  pass('incorrect re-authentication is rejected and clears the password field');

  await passwordInput.fill(password);
  const backupDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Şifreli yedeği indir', exact: true }).click();
  const downloadedBackup = await backupDownload;
  assert.match(downloadedBackup.suggestedFilename(), /\.kilincbackup$/);
  const backupBytes = await readFile(await downloadedBackup.path());
  const decoded = decodePortableBackup(backupBytes, master);
  assert.equal(decoded.tables.content, status.counts.content);
  await page.waitForFunction(() => document.querySelector('.sc-backup-form input[name="currentPassword"]').value === '');
  assert.equal(backupBytes.includes(master), false);
  pass('backup button downloads a real authenticated encrypted archive without bundling its key');

  await passwordInput.fill(password);
  const keyDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Veri anahtarını ayrı indir', exact: true }).click();
  const downloadedKey = await keyDownload;
  assert.match(downloadedKey.suggestedFilename(), /\.key$/);
  const keyText = (await readFile(await downloadedKey.path(), 'utf8')).trim();
  assert.equal(Buffer.from(keyText, 'base64').equals(master), true);
  await page.waitForFunction(() => document.querySelector('.sc-backup-form input[name="currentPassword"]').value === '');
  assert.equal((await page.locator('.sc-root').innerText()).includes(keyText), false);
  pass('separate key download matches the backup master key and never renders the secret in page text');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.evaluate(() => { scrollTo(0, 0); if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  await page.mouse.move(2, 2); await new Promise(resolve => setTimeout(resolve, 100));
  await page.screenshot({ path: join(artifacts, 'system-mobile.png'), fullPage: true });
  await page.setViewportSize({ width: 1364, height: 920 });
  await page.evaluate(() => scrollTo(0, 0)); await new Promise(resolve => setTimeout(resolve, 100));
  await page.screenshot({ path: join(artifacts, 'system-desktop.png'), fullPage: true });
  assert.deepEqual(pageErrors, []);
  pass('system controls, instructions and downloads fit a 390px viewport without browser exceptions');
  console.log(`System browser: ${checks}/${checks} checks passed; artifacts: ${artifacts}`);
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
  app.locals.close();
  for (const name of envNames) {
    if (saved[name] === undefined) delete process.env[name];
    else process.env[name] = saved[name];
  }
  await rm(home, { recursive: true, force: true });
}
