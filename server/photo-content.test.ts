import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import test from "node:test";
import { applyPhotoContentMigration } from "./photo-content.js";

function fixture() {
  const db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE content(id TEXT PRIMARY KEY,type TEXT,slug TEXT,data TEXT); CREATE TABLE settings(id INTEGER PRIMARY KEY,data TEXT); CREATE TABLE schema_migrations(version TEXT PRIMARY KEY,appliedAt TEXT);",
  );
  db.prepare("INSERT INTO settings VALUES(1,?)").run(
    JSON.stringify({
      heroImage: "/uploads/custom.png",
      phone: "operator-contact",
    }),
  );
  for (const [slug, image, gallery] of [
    ["katlanir-cam-balkon", "/images/product-1.svg", ["/images/product-1.svg"]],
    ["aluminyum-dograma", "/uploads/own-cover.png", []],
    [
      "ferforje-bahce-kapisi-korkuluk",
      "/images/metal-gate.svg",
      ["/uploads/own-gallery.png"],
    ],
  ] as const)
    db.prepare("INSERT INTO content VALUES(?,?,?,?)").run(
      slug,
      "product",
      slug,
      JSON.stringify({
        image,
        gallery,
        title: "Operator title",
        published: false,
      }),
    );
  return db;
}
const read = (db: DatabaseSync, slug: string) =>
  JSON.parse(
    (
      db.prepare("SELECT data FROM content WHERE slug=?").get(slug) as {
        data: string;
      }
    ).data,
  );

test("Photo upgrade preserves curated covers, galleries, visibility and later deletions", () => {
  const db = fixture();
  try {
    const custom = read(db, "aluminyum-dograma"),
      gallery = read(db, "ferforje-bahce-kapisi-korkuluk");
    applyPhotoContentMigration(db);
    const balcony = read(db, "katlanir-cam-balkon");
    assert.equal(balcony.published, false);
    assert.equal(balcony.title, "Operator title");
    assert.equal(balcony.gallery.length, 9);
    assert.ok(balcony.gallery.includes("/images/photo-sunset.jpg"));
    assert.deepEqual(read(db, "aluminyum-dograma"), custom);
    assert.deepEqual(read(db, "ferforje-bahce-kapisi-korkuluk"), gallery);
    assert.equal(
      JSON.parse(
        (db.prepare("SELECT data FROM settings").get() as { data: string })
          .data,
      ).heroImage,
      "/uploads/custom.png",
    );
    db.prepare("DELETE FROM content WHERE slug=?").run("katlanir-cam-balkon");
    applyPhotoContentMigration(db);
    assert.equal(db.prepare("SELECT count(*) AS n FROM content").get()!.n, 2);
  } finally {
    db.close();
  }
});

test("Invalid settings roll back photo changes and allow corrected retry", () => {
  const db = fixture();
  try {
    const before = read(db, "katlanir-cam-balkon");
    db.exec("UPDATE settings SET data='invalid'");
    assert.throws(() => applyPhotoContentMigration(db));
    assert.deepEqual(read(db, "katlanir-cam-balkon"), before);
    assert.equal(
      db.prepare("SELECT count(*) AS n FROM schema_migrations").get()!.n,
      0,
    );
    db.prepare("UPDATE settings SET data=?").run(
      JSON.stringify({ heroImage: "/images/original-terrace.png" }),
    );
    applyPhotoContentMigration(db);
    assert.equal(
      JSON.parse(
        (db.prepare("SELECT data FROM settings").get() as { data: string })
          .data,
      ).heroImage,
      "/images/photo-sunset-edited.webp",
    );
  } finally {
    db.close();
  }
});
