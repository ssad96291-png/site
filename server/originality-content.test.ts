import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  applyOriginalityContentMigration,
  originalityContentVersion,
} from "./originality-content.js";
import { seedContent, type Content } from "./seed.js";

const oldSummary =
  "Isıcamlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.";
const newSummary =
  "Çift camlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.";
const rightsSlug = "icerik-ve-kullanim-haklari";

function database() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE content (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, slug TEXT NOT NULL,
      data TEXT NOT NULL, UNIQUE(type,slug)
    );
    CREATE TABLE schema_migrations (version TEXT PRIMARY KEY, appliedAt TEXT NOT NULL);
  `);
  return db;
}

function product(overrides: Partial<Content> = {}): Content {
  const source = seedContent().find(
    (item) =>
      item.type === "product" && item.slug === "isi-yalitimli-cam-balkon",
  )!;
  return {
    ...source,
    id: randomUUID(),
    createdAt: "2025-01-01T10:00:00.000Z",
    updatedAt: "2025-02-01T10:00:00.000Z",
    ...overrides,
  };
}

function insert(db: DatabaseSync, item: Content) {
  db.prepare("INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)").run(
    item.id,
    item.type,
    item.slug,
    JSON.stringify(item),
  );
}

function get(db: DatabaseSync, slug: string): Content | undefined {
  const row = db.prepare("SELECT data FROM content WHERE slug=?").get(slug) as
    { data: string } | undefined;
  return row ? JSON.parse(row.data) : undefined;
}

test("Originality migration replaces exact old wording while preserving separately edited fields and publication state", () => {
  const db = database();
  try {
    const custom = product({
      title: "Firmaya özel başlık",
      summary: oldSummary,
      body: "Firmanın hazırladığı özel açıklama. Isıcam ürününe ilişkin gerçek teklif bilgisi.",
      subtitle: "Yönetici tarafından düzenlenen alt başlık",
      image: "/uploads/company-photo.png",
      published: false,
    });
    insert(db, custom);
    applyOriginalityContentMigration(db);
    const result = get(db, custom.slug)!;
    assert.equal(result.summary, newSummary);
    assert.equal(result.body, custom.body);
    assert.equal(result.subtitle, custom.subtitle);
    assert.equal(result.title, custom.title);
    assert.equal(result.image, custom.image);
    assert.equal(result.published, false);
    assert.equal(result.id, custom.id);
    assert.equal(result.createdAt, custom.createdAt);
    assert.notEqual(result.updatedAt, custom.updatedAt);
    assert.ok(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(originalityContentVersion),
    );
  } finally {
    db.close();
  }
});

test("Custom records and a pre-existing unpublished rights page retain their complete stored content", () => {
  const db = database();
  try {
    const custom = product({
      summary: `${oldSummary} Firma tarafından ek bilgi.`,
    });
    const page = product({
      type: "page",
      slug: rightsSlug,
      title: "Firmanın kendi kullanım metni",
      body: "Hukuk danışmanının hazırladığı metin.",
      published: false,
    });
    insert(db, custom);
    insert(db, page);
    const before = db.prepare("SELECT id,data FROM content ORDER BY id").all();
    applyOriginalityContentMigration(db);
    assert.deepEqual(
      db.prepare("SELECT id,data FROM content ORDER BY id").all(),
      before,
    );
  } finally {
    db.close();
  }
});

test("Rights page is initially published and bilingual, then deletion and later edits survive repeated startup", () => {
  const db = database();
  try {
    applyOriginalityContentMigration(db);
    const page = get(db, rightsSlug)!;
    assert.equal(page.type, "page");
    assert.equal(page.published, true);
    assert.equal(page.image, "");
    assert.match(page.body, /yapay zekâ/);
    assert.match(page.body, /Tamamlanmış müşteri uygulaması/);
    assert.match(page.body, /sonradan eklenen içerikler/i);
    assert.match(page.body, /\/iletisim/);
    assert.match(page.bodyEn!, /AI assistance/);
    assert.match(page.bodyEn!, /does not guarantee ownership/);
    db.prepare("DELETE FROM content WHERE id=?").run(page.id);
    const custom = product({ summary: oldSummary });
    insert(db, custom);
    applyOriginalityContentMigration(db);
    assert.equal(get(db, rightsSlug), undefined);
    assert.equal(get(db, custom.slug)!.summary, oldSummary);
    assert.equal(
      (
        db.prepare("SELECT count(*) AS count FROM schema_migrations").get() as {
          count: number;
        }
      ).count,
      1,
    );
  } finally {
    db.close();
  }
});

test("Failed rights-page insertion rolls back text corrections and migration marker and allows a clean retry", () => {
  const db = database();
  try {
    const original = product({ summary: oldSummary });
    insert(db, original);
    db.exec(`CREATE TRIGGER reject_rights_page BEFORE INSERT ON content
      WHEN NEW.slug='${rightsSlug}' BEGIN SELECT RAISE(FAIL,'simulated insert failure'); END;`);
    assert.throws(
      () => applyOriginalityContentMigration(db),
      /simulated insert failure/,
    );
    assert.deepEqual(get(db, original.slug), original);
    assert.equal(get(db, rightsSlug), undefined);
    assert.equal(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(originalityContentVersion),
      undefined,
    );
    db.exec("DROP TRIGGER reject_rights_page");
    applyOriginalityContentMigration(db);
    assert.equal(get(db, original.slug)!.summary, newSummary);
    assert.equal(get(db, rightsSlug)!.published, true);
  } finally {
    db.close();
  }
});
