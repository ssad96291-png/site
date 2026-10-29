import type { DatabaseSync } from "node:sqlite";

export const photoContentVersion = "user-photo-selection-2026-10-30-v1";

/** Only empty bundled galleries/default covers change; operator edits stay intact. */
export function applyPhotoContentMigration(db: DatabaseSync) {
  if (
    db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(photoContentVersion)
  )
    return;
  db.exec("BEGIN IMMEDIATE");
  try {
    const groups = [
      {
        slug: "katlanir-cam-balkon",
        cover: "/images/product-1.svg",
        photos: [
          "sunset",
          "wood-balcony",
          "corner-balcony",
          "long-balcony",
          "dark-balcony",
          "terrace",
          "glass-detail",
          "garden-balcony",
        ],
      },
      {
        slug: "aluminyum-dograma",
        cover: "/images/product-10.svg",
        photos: ["entrance", "glazed-door"],
      },
      {
        slug: "ferforje-bahce-kapisi-korkuluk",
        cover: "/images/metal-gate.svg",
        photos: ["garden-gate", "metal-railing"],
      },
    ];
    for (const group of groups) {
      const row = db
        .prepare("SELECT id,data FROM content WHERE type='product' AND slug=?")
        .get(group.slug) as { id: string; data: string } | undefined;
      if (!row) continue;
      const item = JSON.parse(row.data);
      if (
        Array.isArray(item.gallery) &&
        item.gallery.length &&
        !(item.gallery.length === 1 && item.gallery[0] === group.cover)
      )
        continue;
      // A custom cover also signals an intentionally curated content item.
      if (item.image !== group.cover) continue;
      item.gallery = group.photos.map((name) => `/images/photo-${name}.jpg`);
      // Keep the sunset original in the gallery; prefer a wide, calm cover.
      const coverName =
        group.slug === "katlanir-cam-balkon" ? "wood-balcony" : group.photos[0];
      item.image = `/images/photo-${coverName}-edited.webp`;
      item.gallery = [item.image, ...item.gallery];
      item.imageAlt = "Fotoğraf arşivi · " + item.title;
      db.prepare("UPDATE content SET data=? WHERE id=?").run(
        JSON.stringify(item),
        row.id,
      );
    }
    const settingsRow = db
      .prepare("SELECT data FROM settings WHERE id=1")
      .get() as { data: string } | undefined;
    if (settingsRow) {
      const settings = JSON.parse(settingsRow.data);
      if (
        ["/images/original-terrace.png", "/images/hero.svg"].includes(
          settings.heroImage,
        )
      ) {
        settings.heroImage = "/images/photo-sunset-edited.webp";
        db.prepare("UPDATE settings SET data=? WHERE id=1").run(
          JSON.stringify(settings),
        );
      }
    }
    db.prepare(
      "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
    ).run(photoContentVersion, new Date().toISOString());
    db.exec("COMMIT");
  } catch (error) {
    try {
      if (db.isTransaction) db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}
