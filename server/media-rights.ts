import type { Express, Request } from "express";
import type { DatabaseSync } from "node:sqlite";
import { lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const mediaRightsBases = [
  "own",
  "licensed",
  "permission",
  "generated",
  "unverified",
] as const;
export type MediaRightsBasis = (typeof mediaRightsBases)[number];

export interface MediaRightsRecord {
  url: string;
  basis: MediaRightsBasis;
  source: string;
  holder: string;
  permissionRef: string;
  notes: string;
  confirmedAt: string;
  updatedAt: string;
}

interface RightsInput {
  basis: MediaRightsBasis;
  source: string;
  holder: string;
  permissionRef: string;
  notes: string;
  confirmed: boolean;
}

interface Options {
  app: Express;
  db: DatabaseSync;
  uploadDir: string;
  recordAudit: (actor: string, action: string, target: string) => void;
}

const filePattern = /^[a-f0-9-]+\.(?:png|jpg|webp)$/;
const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
const emptyRecord = (filename: string): MediaRightsRecord => ({
  url: "/uploads/" + filename,
  basis: "unverified",
  source: "",
  holder: "",
  permissionRef: "",
  notes: "",
  confirmedAt: "",
  updatedAt: "",
});

function textField(
  value: unknown,
  max: number,
  label: string,
): string {
  if (value === undefined) return "";
  if (typeof value !== "string" || value.length > max)
    throw fail(400, `${label} en fazla ${max} karakterlik metin olmalıdır.`);
  return value.trim();
}

function cleanRights(input: unknown, allowMissing = false): RightsInput {
  if (
    allowMissing &&
    (input === undefined ||
      (!!input &&
        typeof input === "object" &&
        !Array.isArray(input) &&
        Object.keys(input).length === 0))
  )
    input = { basis: "unverified", confirmed: false };
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw fail(400, "Geçerli bir kullanım hakkı kaydı gönderin.");
  const body = { ...(input as Record<string, unknown>) };
  // Multipart form fields are strings; JSON update requests must use booleans.
  if (allowMissing && ["true", "false"].includes(String(body.confirmed)))
    body.confirmed = body.confirmed === "true" || body.confirmed === true;
  if (
    typeof body.basis !== "string" ||
    !(mediaRightsBases as readonly string[]).includes(body.basis)
  )
    throw fail(400, "Geçerli bir kullanım dayanağı seçin.");
  if (body.confirmed !== undefined && typeof body.confirmed !== "boolean")
    throw fail(400, "Kayıt onayı açıkça seçilmelidir.");
  const result: RightsInput = {
    basis: body.basis as MediaRightsBasis,
    source: textField(body.source, 1000, "Kaynak"),
    holder: textField(body.holder, 300, "Hak sahibi / üretici"),
    permissionRef: textField(body.permissionRef, 1000, "İzin / üretim referansı"),
    notes: textField(body.notes, 2000, "Not"),
    confirmed: body.confirmed === true,
  };
  if (
    result.confirmed &&
    (result.basis === "unverified" ||
      !result.source ||
      !result.holder ||
      !result.permissionRef)
  )
    throw fail(
      400,
      "Kaydı onaylamak için kullanım dayanağı, kaynak, hak sahibi / üretici ve izin / üretim referansını tamamlayın.",
    );
  return result;
}

/**
 * Private operator declarations, not legal clearance or a public licence.
 * Install after the app's normal admin authentication/authorization middleware.
 */
export function installMediaRights({
  app,
  db,
  uploadDir,
  recordAudit,
}: Options) {
  db.exec(`CREATE TABLE IF NOT EXISTS media_rights (
    filename TEXT PRIMARY KEY,
    data TEXT NOT NULL
  )`);

  function fileExists(filename: string) {
    if (!filePattern.test(filename)) return false;
    try {
      // A symlink must not allow provenance endpoints to access unrelated files.
      return lstatSync(join(uploadDir, filename)).isFile();
    } catch {
      return false;
    }
  }

  function requireFile(filename: string) {
    if (!filePattern.test(filename)) throw fail(400, "Geçersiz dosya adı.");
    if (!fileExists(filename)) throw fail(404, "Görsel bulunamadı.");
  }

  function requireOperator(req: Request) {
    const user = req as Request & {
      admin?: string;
      operatorRole?: string;
    };
    if (!user.admin) throw fail(401, "Devam etmek için oturum açın.");
    if (!["admin", "editor"].includes(user.operatorRole || ""))
      throw fail(403, "Bu işlem için yetkiniz yok.");
    return user.admin;
  }

  function read(filename: string): MediaRightsRecord {
    const row = db
      .prepare("SELECT data FROM media_rights WHERE filename=?")
      .get(filename) as { data: string } | undefined;
    return row ? JSON.parse(row.data) : emptyRecord(filename);
  }

  function save(
    filename: string,
    body: RightsInput,
    actor: string,
  ): MediaRightsRecord {
    const now = new Date().toISOString();
    const record: MediaRightsRecord = {
      url: "/uploads/" + filename,
      basis: body.basis,
      source: body.source,
      holder: body.holder,
      permissionRef: body.permissionRef,
      notes: body.notes,
      confirmedAt: body.confirmed ? now : "",
      updatedAt: now,
    };
    db.prepare(
      "INSERT INTO media_rights(filename,data) VALUES(?,?) ON CONFLICT(filename) DO UPDATE SET data=excluded.data",
    ).run(filename, JSON.stringify(record));
    // Keep licence text and private source evidence out of the general audit feed.
    recordAudit(actor, "media.rights.update", record.url);
    return record;
  }

  app.get("/api/admin/media-rights", (req, res, next) => {
    try {
      requireOperator(req);
      const records = readdirSync(uploadDir)
        .filter(fileExists)
        .map(read)
        .sort((a, b) => a.url.localeCompare(b.url));
      const recorded = records.filter((record) => !!record.confirmedAt).length;
      res.json({
        records,
        summary: {
          total: records.length,
          recorded,
          unreviewed: records.length - recorded,
          unverified: records.filter((record) => record.basis === "unverified")
            .length,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/media-rights/:filename", (req, res, next) => {
    try {
      const actor = requireOperator(req);
      const filename = String(req.params.filename);
      requireFile(filename);
      const record = save(filename, cleanRights(req.body), actor);
      res.json({ record });
    } catch (error) {
      next(error);
    }
  });

  return {
    recordUploadRights(filename: string, input: unknown, actor: string) {
      requireFile(filename);
      return save(filename, cleanRights(input, true), actor);
    },
    deleteMediaRights(filename: string) {
      if (!filePattern.test(filename)) throw fail(400, "Geçersiz dosya adı.");
      db.prepare("DELETE FROM media_rights WHERE filename=?").run(filename);
    },
  };
}
