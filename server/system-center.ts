import type { Express, Request } from "express";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";
import {
  backupMaxBytes,
  createPortableBackup,
  tableCounts,
} from "./data-portability.js";
import {
  getDatabaseProtectionStatus,
  getDataProtectionKey,
} from "./secure-database.js";
import { securityPolicy } from "./file-security.js";

type Options = {
  app: Express;
  db: DatabaseSync;
  dataDir: string;
  production: boolean;
  readAdmin: (req: Request) => string | undefined;
  verifyPassword: (req: Request, password: string) => boolean;
  consume: (
    scope: string,
    key: string,
    max: number,
    minutes: number,
  ) => boolean;
  audit: (actor: string, action: string, target: string) => void;
};
const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
export function installSecurityEventLog(app: Express, db: DatabaseSync) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS security_events(id TEXT PRIMARY KEY,action TEXT NOT NULL,route TEXT NOT NULL,status INTEGER NOT NULL,createdAt TEXT NOT NULL)",
  );
  const statuses = new Set([401, 403, 413, 415, 422, 429, 500, 503]);
  const add = (status: number, route: string) => {
    const action =
      status === 429
        ? "RATE_LIMIT"
        : status === 422
          ? "FILE_REJECTED"
          : status === 401
            ? "AUTH_REQUIRED"
            : status === 403
              ? "ACCESS_DENIED"
              : status === 503
                ? "SERVICE_UNAVAILABLE"
                : "REQUEST_REJECTED";
    db.prepare("INSERT INTO security_events VALUES(?,?,?,?,?)").run(
      randomUUID(),
      action,
      route,
      status,
      new Date().toISOString(),
    );
    db.prepare("DELETE FROM security_events WHERE createdAt<?").run(
      new Date(Date.now() - 30 * 86400000).toISOString(),
    );
    db.exec(
      "DELETE FROM security_events WHERE rowid NOT IN (SELECT rowid FROM security_events ORDER BY rowid DESC LIMIT 10000)",
    );
  };
  app.use("/api", (req, res, next) => {
    const segments = req.path.split("/").filter(Boolean);
    const staticWords = new Set([
      "admin",
      "customer",
      "staff",
      "login",
      "logout",
      "register",
      "claim",
      "reset",
      "password",
      "profile",
      "me",
      "customers",
      "pipeline",
      "messages",
      "documents",
      "project-files",
      "project-requests",
      "inquiries",
      "offers",
      "support-tickets",
      "system",
      "status",
      "backup",
      "key-export",
      "upload",
      "content",
      "media",
      "settings",
      "notifications",
      "telemetry",
      "teams",
      "activity",
      "download",
      "recovery",
      "revoke",
    ]);
    const route =
      req.method +
      " /api/" +
      segments
        .slice(0, 7)
        .map((p) => (staticWords.has(p) ? p : ":id"))
        .join("/");
    res.once("finish", () => {
      if (!statuses.has(res.statusCode)) return;
      try {
        add(res.statusCode, route);
      } catch {
        /* A failed database never leaks request content into console logs. */
      }
    });
    next();
  });
}
export function installSystemCenter(options: Options) {
  const { app, db, dataDir, production } = options;
  let lastExportAt: string | undefined;
  const storage = () => {
    const stats = {
      databaseBytes: 0,
      publicBytes: 0,
      privateBytes: 0,
      fileCount: 0,
    };
    const database = join(dataDir, "site.sqlite.enc");
    if (existsSync(database)) stats.databaseBytes = lstatSync(database).size;
    for (const folder of ["uploads", "private-documents", "project-files"]) {
      const path = join(dataDir, folder);
      if (!existsSync(path) || lstatSync(path).isSymbolicLink()) continue;
      for (const file of readdirSync(path, { withFileTypes: true })) {
        if (
          !file.isFile() ||
          file.isSymbolicLink() ||
          file.name.startsWith(".") ||
          file.name.endsWith(".tmp")
        )
          continue;
        const size = lstatSync(join(path, file.name)).size;
        stats[folder === "uploads" ? "publicBytes" : "privateBytes"] += size;
        stats.fileCount++;
      }
    }
    return stats;
  };
  app.use("/api/admin/system", (req, _res, next) =>
    options.readAdmin(req)
      ? next()
      : next(fail(403, "Bu alan yalnızca ana yöneticiye açıktır.")),
  );
  app.get("/api/admin/system/status", (_req, res) => {
    const policy = securityPolicy(production);
    res.json({
      database: getDatabaseProtectionStatus(db),
      scanner: {
        mode: production ? "required" : "limited",
        configured: policy.configured,
        engine: policy.configured ? "clamav" : "builtin",
        message: policy.configured
          ? "ClamAV bağlantısı tanımlı. Her yükleme ve indirmede tarama yanıtı doğrulanır; bağlantı tanımı tek başına taramanın çalıştığını göstermez."
          : production
            ? "Antivirüs bağlı değil. Dosya yükleme ve özel dosya indirme kapalıdır."
            : "Geliştirme ortamı: biçim ve sınırlı zararlı içerik kontrolleri var; tam antivirüs taraması yok. İnternete açarken ClamAV zorunludur.",
      },
      storage: storage(),
      counts: tableCounts(db),
      securityEvents: db
        .prepare(
          "SELECT id,action,route,status,createdAt FROM security_events ORDER BY rowid DESC LIMIT 100",
        )
        .all(),
      backup: {
        format: "kilinc-backup-v1",
        maxBytes: backupMaxBytes,
        lastExportAt,
      },
      generatedAt: new Date().toISOString(),
    });
  });
  for (const kind of ["backup", "key-export"] as const)
    app.post("/api/admin/system/" + kind, (req, res, next) => {
      try {
        const actor = options.readAdmin(req)!;
        if (!options.consume("data-export", actor, 5, 15))
          throw fail(
            429,
            "Çok fazla yedek/anahtar isteği. Biraz sonra yeniden deneyin.",
          );
        if (
          typeof req.body?.currentPassword !== "string" ||
          !options.verifyPassword(req, req.body.currentPassword)
        )
          throw fail(403, "Mevcut yönetici parolanızı doğrulayın.");
        if (kind === "backup") {
          options.audit(actor, "ENCRYPTED_BACKUP_EXPORT", "all-data");
          const bytes = createPortableBackup(db, dataDir, production);
          lastExportAt = new Date().toISOString();
          res
            .attachment("kilinc-" + lastExportAt.slice(0, 10) + ".kilincbackup")
            .type("application/octet-stream")
            .send(bytes);
        } else {
          options.audit(actor, "ENCRYPTION_KEY_EXPORT", "separate-key-backup");
          res
            .attachment("kilinc-veri-anahtari.key")
            .type("application/octet-stream")
            .send(
              Buffer.from(
                getDataProtectionKey(dataDir, production).toString("base64") +
                  "\n",
              ),
            );
        }
      } catch (e) {
        next(e);
      }
    });
}
