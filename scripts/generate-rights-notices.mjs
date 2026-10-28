import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8').replace(/\r\n/g, '\n');
const lock = JSON.parse(read('package-lock.json'));
const supplements = JSON.parse(read('docs/licenses/supplements.json'));
const assetSources = JSON.parse(read('docs/licenses/asset-sources.json')).sources;
const check = process.argv.includes('--check');
const packages = [];
const sections = [
  'THIRD-PARTY SOFTWARE AND FONT NOTICES',
  'Generated from package-lock.json and installed runtime packages. Keep this file with redistributed copies, including the built website.',
  'These notices cover third-party components only. They do not grant rights to customer content, images, logos, trademarks or the rest of this application.',
];
const knownMissing = new Map([['brotli', '1.3.3'], ['dfa', '1.2.0'], ['fontkit', '2.0.4']]);

for (const [path, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
  if (!path || entry.dev || entry.link) continue;
  const pkg = JSON.parse(read(`${path}/package.json`));
  if (pkg.version !== entry.version) throw new Error(`Installed version differs from lockfile: ${path}`);
  const files = readdirSync(join(root, path)).filter((file) => /^(licen[sc]e|copying|notice|copyright)([._-]|$)/i.test(file));
  const texts = files.map((file) => `${file}\n\n${read(`${path}/${file}`)}`);
  let note = '';
  if (!texts.length) {
    if (knownMissing.get(pkg.name) !== pkg.version || pkg.license !== 'MIT') {
      throw new Error(`Review required: no license notice found for ${pkg.name}@${pkg.version}`);
    }
    note = 'Upstream package and the exact release Git tag declare MIT but omit a standalone LICENSE file. The declared author attribution and standard MIT wording below are a notice supplement, not a verbatim upstream copyright notice.';
    const author = typeof pkg.author === 'string' ? pkg.author : pkg.author?.name || '';
    texts.push(`Upstream author attribution: ${author}\nDeclared license: MIT\n\n${supplements.standardMit.text}`);
  }
  const license = pkg.license || entry.license || 'See included upstream LICENSE text';
  const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url || pkg.homepage || '';
  packages.push({name: pkg.name, version: pkg.version, path, license, repository, noticeFiles: files, supplemented: !!note});
  sections.push(`\n${'='.repeat(72)}\n${pkg.name} ${pkg.version}\nLicense: ${license}\nSource: ${repository}\n${note}\n\n${texts.join('\n\n')}`);
}

for (const key of ['feather', 'base64Arraybuffer', 'brotliDecoder', 'pakoZlib']) {
  const item = supplements[key];
  sections.push(`\n${'='.repeat(72)}\nSupplement: ${key}\nSource: ${item.source}\n${item.reason}\n\n${item.text}`);
}
sections.push(`\n${'='.repeat(72)}\nDejaVu Sans (PDF font)\nSource: server/assets/DejaVuSans-COPYRIGHT.txt\nThe upstream font license is Bitstream Vera; DejaVu changes are public domain. Debian packaging terms in the copied record apply to packaging, not the font itself.\n\n${read('server/assets/DejaVuSans-COPYRIGHT.txt')}`);

function output(file, text) {
  text = text.replace(/\r\n/g, '\n');
  const full = join(root, file);
  if (check) {
    if (!existsSync(full) || read(file) !== text) throw new Error(`Out-of-date rights record: ${file}. Run node scripts/generate-rights-notices.mjs`);
  } else {
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
}

output('public/licenses/THIRD-PARTY-NOTICES.txt', sections.join('\n\n') + '\n');
output('docs/licenses/runtime-packages.json', JSON.stringify({lockfileSha256: createHash('sha256').update(readFileSync(join(root, 'package-lock.json'))).digest('hex'), packages}, null, 2) + '\n');

const files = [];
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push(full);
  }
}
walk(join(root, 'public/images'));
files.push(join(root, 'public/favicon.svg'), join(root, 'server/assets/DejaVuSans.ttf'));
const assets = files.sort().map((file) => {
  const path = relative(root, file).split('\\').join('/');
  const data = readFileSync(file);
  const sha256 = createHash('sha256').update(data).digest('hex');
  const record = assetSources[path];
  const verified = record?.sha256 === sha256;
  return {
    path, bytes: data.length, sha256, provenanceRecordMatches: verified,
    origin: verified ? record.origin : 'No matching filename-and-hash provenance record. A self-description such as original in a file is not evidence of authorship or permission.',
    review: verified ? record.review : 'Provenance not established; obtain source/permission or replace with a documented original. A changed file cannot inherit the source record of a previous file at this path.',
    ...(verified ? {record: record.record} : {}),
  };
});
output('docs/licenses/asset-inventory.json', JSON.stringify({scope: 'Bundled public visual assets and PDF font only; excludes private customer uploads and database content.', assets}, null, 2) + '\n');
console.log(`${check ? 'Verified' : 'Generated'} notices for ${packages.length} runtime package entries and ${assets.length} bundled assets.`);
