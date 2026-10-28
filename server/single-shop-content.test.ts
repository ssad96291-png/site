import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { applyOriginalityContentMigration } from "./originality-content.js";
import { referencePages } from "./reference-content.js";
import { defaultSettings, seedContent } from "./seed.js";
import {
  applySingleShopContentMigration,
  singleShopContentVersion,
} from "./single-shop-content.js";

const oldHero = "Dışarıyla iç içe.\nSize ait bir alan.";
function database(settings: Record<string, unknown> = {}) {
  const db = new DatabaseSync(":memory:");
  db.exec(`CREATE TABLE settings(id INTEGER PRIMARY KEY,data TEXT NOT NULL);
    CREATE TABLE content(id TEXT PRIMARY KEY,type TEXT NOT NULL,slug TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(type,slug));
    CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,appliedAt TEXT NOT NULL);`);
  db.prepare("INSERT INTO settings(id,data) VALUES(1,?)").run(
    JSON.stringify(settings),
  );
  return db;
}
function add(
  db: DatabaseSync,
  slug: string,
  data: Record<string, unknown> = {},
) {
  const item = {
    id: randomUUID(),
    type: "page",
    slug,
    title: "Firma metni",
    body: "Firmaya özel açıklama.",
    image: "",
    published: true,
    createdAt: "2024-03-02T10:00:00.000Z",
    updatedAt: "2024-03-02T10:00:00.000Z",
    ...data,
  };
  db.prepare("INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)").run(
    item.id,
    item.type,
    item.slug,
    JSON.stringify(item),
  );
  return item;
}
function content(db: DatabaseSync, slug: string): Record<string, unknown> {
  return JSON.parse(
    (
      db.prepare("SELECT data FROM content WHERE slug=?").get(slug) as {
        data: string;
      }
    ).data,
  );
}
function settings(db: DatabaseSync): Record<string, unknown> {
  return JSON.parse(
    (
      db.prepare("SELECT data FROM settings WHERE id=1").get() as {
        data: string;
      }
    ).data,
  );
}

test("Single-shop migration updates bundled fields while retaining individual operator edits and real contact details", () => {
  const db = database({
    heroTitle: oldHero,
    heroTitleEn: "Closer to the outdoors.\nA space of your own.",
    heroSubtitle: "Yönetici tarafından yazılan tanıtım.",
    phone: "+90 312 000 00 00",
    address: "Sentetik dükkân adresi",
    primaryColor: "#214030",
    customSetting: { enabled: true },
  });
  try {
    const about = add(db, "hakkimizda", {
      title: "Mekânınıza yeni bir bakış.",
      body: "İşletmenin kendi hazırladığı açıklama.",
      category: "Kurumsal",
      published: false,
      image: "/uploads/my-photo.png",
    });
    const unrelated = add(db, "firmadan-haberler", {
      title: "Dokunulmayacak özel sayfa",
    });
    applySingleShopContentMigration(db);
    assert.deepEqual(settings(db), {
      heroTitle: defaultSettings.heroTitle,
      heroTitleEn: defaultSettings.heroTitleEn,
      heroSubtitle: "Yönetici tarafından yazılan tanıtım.",
      phone: "+90 312 000 00 00",
      address: "Sentetik dükkân adresi",
      primaryColor: "#214030",
      customSetting: { enabled: true },
    });
    const next = content(db, about.slug);
    assert.equal(next.title, "Dükkânımızdan, doğrudan sizinle.");
    assert.equal(next.body, about.body);
    assert.equal(next.published, false);
    assert.equal(next.image, about.image);
    assert.equal(next.id, about.id);
    assert.equal(next.createdAt, about.createdAt);
    assert.deepEqual(content(db, unrelated.slug), unrelated);
  } finally {
    db.close();
  }
});

test("Retired network and enterprise pages are archived without removing custom content or identifiers", () => {
  const db = database();
  try {
    const archived = [
      "is-ortakligi",
      "kurumsal-projeler-taahhut",
      "bayilik-basvurusu",
      "ankara-yetkili-bayi-agi",
      "franchise-application",
    ].map((slug) =>
      add(db, slug, {
        title: "Önceki kaydın özel başlığı",
        privateReference: "SYNTHETIC_ARCHIVE_RECORD",
      }),
    );
    const beforeUnpublished = add(db, "bayilerimiz", { published: false });
    const unrelated = add(db, "olcu-notlari", {
      body: "Müşterinin korunacak özel notu.",
    });
    applySingleShopContentMigration(db);
    for (const previous of archived) {
      const next = content(db, previous.slug);
      assert.equal(next.published, false);
      assert.equal(next.id, previous.id);
      assert.equal(next.title, previous.title);
      assert.equal(next.body, previous.body);
      assert.equal(next.privateReference, "SYNTHETIC_ARCHIVE_RECORD");
    }
    assert.deepEqual(content(db, beforeUnpublished.slug), beforeUnpublished);
    assert.deepEqual(content(db, unrelated.slug), unrelated);
    assert.equal(
      (db.prepare("SELECT count(*) AS n FROM content").get() as { n: number })
        .n,
      7,
    );
  } finally {
    db.close();
  }
});

test("Fresh defaults and the previous rights notice describe one local shop without network offerings", () => {
  const db = database({ ...defaultSettings });
  try {
    for (const row of [...seedContent(), ...referencePages()]) {
      const exists = db
        .prepare("SELECT id FROM content WHERE type=? AND slug=?")
        .get(row.type, row.slug);
      if (!exists) add(db, row.slug, { ...row });
    }
    applyOriginalityContentMigration(db);
    applySingleShopContentMigration(db);
    const rows = db.prepare("SELECT data FROM content").all() as Array<{
      data: string;
    }>;
    const publicRecords = rows
      .map((row) => JSON.parse(row.data))
      .filter((item) => item.published);
    assert.ok(
      !publicRecords.some((item) =>
        ["is-ortakligi", "kurumsal-projeler-taahhut"].includes(item.slug),
      ),
    );
    const rights = content(db, "icerik-ve-kullanim-haklari");
    assert.doesNotMatch(String(rights.body), /bayilik|ortaklık ilişkisi/i);
    assert.doesNotMatch(String(rights.bodyEn), /dealership|partnership/i);
    assert.match(String(rights.body), /onayladığınız teklifte/);
    assert.equal(
      publicRecords.filter((item) => item.type === "page").length,
      16,
    );
    assert.match(defaultSettings.aboutText, /tek dükkânı/);
    assert.match(defaultSettings.aboutTextEn, /one shop/);
    for (const item of publicRecords) {
      assert.doesNotMatch(
        [
          item.title,
          item.summary,
          item.body,
          item.titleEn,
          item.summaryEn,
          item.bodyEn,
        ].join(" "),
        /bayilik|bayiler|dealership|franchise/i,
      );
    }
  } finally {
    db.close();
  }
});

test("A separately edited rights paragraph is preserved and the frozen English default is corrected", () => {
  const db = database();
  try {
    applyOriginalityContentMigration(db);
    const rights = content(db, "icerik-ve-kullanim-haklari");
    rights.body =
      "Firma hukuk danışmanının bağımsız olarak düzenlediği kullanım metni.";
    db.prepare("UPDATE content SET data=? WHERE id=?").run(
      JSON.stringify(rights),
      String(rights.id),
    );
    applySingleShopContentMigration(db);
    const next = content(db, "icerik-ve-kullanim-haklari");
    assert.equal(next.body, rights.body);
    assert.doesNotMatch(String(next.bodyEn), /dealership|partnership/);
  } finally {
    db.close();
  }
});

test("Restart does not recreate deleted pages or overwrite changes made after the one-time migration", () => {
  const db = database({ heroTitle: oldHero });
  try {
    add(db, "is-ortakligi");
    applySingleShopContentMigration(db);
    db.prepare("DELETE FROM content WHERE slug='is-ortakligi'").run();
    db.prepare("UPDATE settings SET data=? WHERE id=1").run(
      JSON.stringify({ heroTitle: oldHero }),
    );
    applySingleShopContentMigration(db);
    assert.equal(settings(db).heroTitle, oldHero);
    assert.equal(
      (db.prepare("SELECT count(*) AS n FROM content").get() as { n: number })
        .n,
      0,
    );
    assert.equal(
      (
        db
          .prepare(
            "SELECT count(*) AS n FROM schema_migrations WHERE version=?",
          )
          .get(singleShopContentVersion) as { n: number }
      ).n,
      1,
    );
  } finally {
    db.close();
  }
});

test("Invalid matching content rolls back settings and the migration marker before a corrected retry", () => {
  const db = database({ heroTitle: oldHero });
  try {
    const row = add(db, "hakkimizda");
    db.prepare("UPDATE content SET data='[]' WHERE id=?").run(row.id);
    assert.throws(() => applySingleShopContentMigration(db), /geçersiz kayıt/);
    assert.equal(settings(db).heroTitle, oldHero);
    assert.equal(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(singleShopContentVersion),
      undefined,
    );
    db.prepare("UPDATE content SET data=? WHERE id=?").run(
      JSON.stringify(row),
      row.id,
    );
    applySingleShopContentMigration(db);
    assert.equal(settings(db).heroTitle, defaultSettings.heroTitle);
    assert.ok(
      db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(singleShopContentVersion),
    );
  } finally {
    db.close();
  }
});
