import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  applyCorporateContentMigration,
  corporateContentVersion,
} from "./corporate-content.js";
import { singleShopContentVersion } from "./single-shop-content.js";

const slug = "kurumsal-projeler-taahhut";
const migrationTime = "2026-10-29T08:00:00.000Z";
function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE content(id TEXT PRIMARY KEY,type TEXT NOT NULL,slug TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(type,slug)); CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,appliedAt TEXT NOT NULL);",
  );
  db.prepare("INSERT INTO schema_migrations VALUES(?,?)").run(
    singleShopContentVersion,
    migrationTime,
  );
  return db;
}
function add(db: DatabaseSync, data: Record<string, unknown> = {}): Record<string, any> {
  const item = {
    id: randomUUID(),
    type: "page",
    slug,
    title: "Firma tarafından düzenlenen başlık",
    body: "Firmaya özel kapsam.",
    published: false,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: migrationTime,
    ...data,
  };
  db.prepare("INSERT INTO content VALUES(?,?,?,?)").run(
    item.id,
    item.type,
    item.slug,
    JSON.stringify(item),
  );
  return item;
}
const read = (db: DatabaseSync) =>
  JSON.parse(
    (
      db.prepare("SELECT data FROM content WHERE slug=?").get(slug) as {
        data: string;
      }
    ).data,
  );

test("Corporate page is added once with original local-service copy and deletion remains respected on restart", () => {
  const db = fixture();
  try {
    applyCorporateContentMigration(db);
    const page = read(db);
    assert.equal(page.published, true);
    assert.equal(page.title, "Kurumsal Projeler");
    assert.match(page.body, /Etimesgut’taki dükkânımızla doğrudan/);
    assert.match(page.body, /\/proje-teklif/);
    assert.doesNotMatch(JSON.stringify(page), /bayilik|dealership|franchise/i);
    db.prepare("DELETE FROM content WHERE slug=?").run(slug);
    applyCorporateContentMigration(db);
    assert.equal(
      db.prepare("SELECT id FROM content WHERE slug=?").get(slug),
      undefined,
    );
    assert.equal(
      (
        db
          .prepare(
            "SELECT count(*) AS n FROM schema_migrations WHERE version=?",
          )
          .get(corporateContentVersion) as { n: number }
      ).n,
      1,
    );
  } finally {
    db.close();
  }
});

test("Only the migration-archived corporate page is republished and custom fields and unrelated network pages survive", () => {
  const db = fixture();
  try {
    const before = add(db, {
      title: "Mimardan sahaya, aynı proje dili",
      body: "İşletmenin kendi ayrıntılı hizmet açıklaması.",
      image: "/uploads/our-office.png",
      custom: "retained",
    });
    const network = add(db, {
      slug: "bayilik-basvurusu",
      updatedAt: migrationTime,
    });
    applyCorporateContentMigration(db);
    const after = read(db);
    assert.equal(after.published, true);
    assert.equal(after.title, "Kurumsal Projeler");
    assert.equal(after.body, before.body);
    assert.equal(after.id, before.id);
    assert.equal(after.createdAt, before.createdAt);
    assert.equal(after.image, before.image);
    assert.equal(after.custom, "retained");
    assert.deepEqual(
      JSON.parse(
        (
          db.prepare("SELECT data FROM content WHERE id=?").get(network.id) as {
            data: string;
          }
        ).data,
      ),
      network,
    );
  } finally {
    db.close();
  }
});

test("Explicit publication decisions before and after the archive migration are retained", () => {
  for (const updatedAt of [
    "2026-10-28T09:00:00.000Z",
    "2026-10-29T09:00:00.000Z",
  ]) {
    const db = fixture();
    try {
      const before = add(db, { updatedAt });
      applyCorporateContentMigration(db);
      assert.deepEqual(read(db), before);
    } finally {
      db.close();
    }
  }
});

test("Malformed corporate content rolls back the new migration and can be repaired before retry", () => {
  const db = fixture();
  try {
    const before = add(db);
    db.prepare("UPDATE content SET data='[]' WHERE id=?").run(before.id);
    assert.throws(() => applyCorporateContentMigration(db), /geçersiz kayıt/);
    assert.equal(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(corporateContentVersion),
      undefined,
    );
    db.prepare("UPDATE content SET data=? WHERE id=?").run(
      JSON.stringify(before),
      before.id,
    );
    applyCorporateContentMigration(db);
    assert.equal(read(db).published, true);
  } finally {
    db.close();
  }
});
