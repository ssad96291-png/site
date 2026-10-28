import type { DatabaseSync } from "node:sqlite";

export const singleShopOperationsVersion =
  "single-shop-operations-2026-10-28-v1";
const oldStageMessage = "Bayi / keşif atandı";
const stageMessage = "Keşif planlanıyor";

/** Preserve legacy records and their identifiers, while removing the obsolete
 * external-account role and generated network wording. Arbitrary customer or
 * operator messages are deliberately left untouched.
 */
export function migrateSingleShopOperations(db: DatabaseSync): void {
  db.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations(version TEXT PRIMARY KEY,appliedAt TEXT NOT NULL)",
  );
  if (
    db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(singleShopOperationsVersion)
  )
    return;
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const row of db
      .prepare("SELECT id,data FROM portal_staff")
      .all() as Array<{ id: string; data: string }>) {
      const data = JSON.parse(row.data);
      if (data.role !== "dealer") continue;
      data.role = "technician";
      data.teamId = data.dealerId || "";
      delete data.dealerId;
      db.prepare("UPDATE portal_staff SET data=? WHERE id=?").run(
        JSON.stringify(data),
        row.id,
      );
      db.prepare("DELETE FROM portal_staff_sessions WHERE staffId=?").run(
        row.id,
      );
    }
    for (const row of db
      .prepare("SELECT inquiryId,data FROM portal_inquiries")
      .all() as Array<{ inquiryId: string; data: string }>) {
      const data = JSON.parse(row.data);
      let changed = false;
      if (Array.isArray(data.timeline))
        for (const entry of data.timeline) {
          if (entry.message === oldStageMessage) {
            entry.message = stageMessage;
            changed = true;
          } else if (entry.message === "Bölgenizdeki ekip talebinize atandı.") {
            entry.message = "Talebiniz için planlama kaydı oluşturuldu.";
            changed = true;
          }
        }
      if (changed)
        db.prepare("UPDATE portal_inquiries SET data=? WHERE inquiryId=?").run(
          JSON.stringify(data),
          row.inquiryId,
        );
    }
    db.prepare("UPDATE portal_notifications SET message=? WHERE message=?").run(
      stageMessage,
      oldStageMessage,
    );
    // Only exact automatically generated messages are changed. Delivery jobs,
    // documents, original lead data and all customer accounts are preserved.
    for (const row of db
      .prepare("SELECT id,payload FROM portal_outbox")
      .all() as Array<{ id: string; payload: string }>) {
      const payload = JSON.parse(row.payload);
      if (payload.message !== oldStageMessage) continue;
      payload.message = stageMessage;
      db.prepare("UPDATE portal_outbox SET payload=? WHERE id=?").run(
        JSON.stringify(payload),
        row.id,
      );
    }
    db.prepare(
      "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
    ).run(singleShopOperationsVersion, new Date().toISOString());
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
