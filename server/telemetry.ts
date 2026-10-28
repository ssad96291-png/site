import type { Express, Request } from "express";
import type { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes, randomUUID } from "node:crypto";

export interface TelemetryOptions {
  app: Express;
  db: DatabaseSync;
  production?: boolean;
  /** Return a value only for administrators/managers allowed to see analytics. */
  readAdmin: (request: Request) => unknown;
}
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRESENCE_MS = 90_000;
const MAX_EVENTS = 10_000;
const MAX_SESSIONS = 2_000;
const allowedEvents = new Set([
  "pageview",
  "heartbeat",
  "document_download",
  "area_click",
  "form_start",
  "form_abandoned",
]);
const allowedForms = new Set(["quote", "contact", "service", "project"]);
const staticPages: Record<string, string> = {
  "/": "Ana sayfa",
  "/urunler": "Hizmetler",
  "/hizmetler": "Hizmetler",
  "/fikir-defteri": "Fikir defteri",
  "/dukkanimiz": "Dükkânımız",
  "/hizmet-alani": "Hizmet alanımız",
  "/projeler": "Mekân çözümleri",
  "/galeri": "Galeri",
  "/blog": "Bilgi merkezi",
  "/kurumsal": "Kurumsal",
  "/bolgeler": "Hizmet bölgeleri",
  "/katalog": "Kataloglar",
  "/sistem-secici": "Sistem seçici",
  "/teklif-al": "Keşif ve teklif",
  "/iletisim": "İletişim",
  "/servis-talebi": "Servis talebi",
  "/urun-karsilastir": "Ürün karşılaştırma",
  "/sikca-sorulan-sorular": "Sık sorulan sorular",
};
function maskIp(raw: string) {
  const ip = raw.replace(/^::ffff:/, "");
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(ip))
    return ip.split(".").slice(0, 2).join(".") + ".x.x";
  if (ip.includes(":"))
    return ip.split(":").filter(Boolean).slice(0, 2).join(":") + ":…";
  return "Gizli";
}
function validSession(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}
function canonicalPath(value: unknown): string | undefined {
  if (
    typeof value !== "string" ||
    value.length > 500 ||
    !value.startsWith("/") ||
    value.startsWith("//")
  )
    return undefined;
  const path = value.split(/[?#]/, 1)[0];
  try {
    const decoded = decodeURIComponent(path).replace(/\/$/, "") || "/";
    if (
      decoded.length > 250 ||
      /[\x00-\x20\\]/.test(decoded) ||
      /^\/(api|admin|yonetim|hesabim|musteri|bayi|uploads)(\/|$)/i.test(decoded)
    )
      return undefined;
    return decoded;
  } catch {
    return undefined;
  }
}
function istanbulDate(time: number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(time);
}
export function installTelemetry({ app, db, readAdmin }: TelemetryOptions) {
  const salt = randomBytes(32).toString("hex");
  const digest = (value: string) =>
    createHash("sha256")
      .update(salt + value)
      .digest("hex");
  const limits = new Map<string, { count: number; until: number }>();
  db.exec(`CREATE TABLE IF NOT EXISTS telemetry_sessions (
    id TEXT PRIMARY KEY, maskedIp TEXT NOT NULL, path TEXT NOT NULL, title TEXT NOT NULL,
    device TEXT NOT NULL, startedAt INTEGER NOT NULL, lastSeen INTEGER NOT NULL
  ); CREATE TABLE IF NOT EXISTS telemetry_events (
    id TEXT PRIMARY KEY, sessionId TEXT NOT NULL, maskedIp TEXT NOT NULL, kind TEXT NOT NULL,
    path TEXT NOT NULL, title TEXT NOT NULL, device TEXT NOT NULL, form TEXT, createdAt INTEGER NOT NULL
  ); CREATE INDEX IF NOT EXISTS telemetry_events_created ON telemetry_events(createdAt);
  CREATE INDEX IF NOT EXISTS telemetry_sessions_seen ON telemetry_sessions(lastSeen);`);
  const prune = (now: number) => {
    db.prepare("DELETE FROM telemetry_events WHERE createdAt<?").run(
      now - RETENTION_MS,
    );
    db.prepare("DELETE FROM telemetry_sessions WHERE lastSeen<?").run(
      now - RETENTION_MS,
    );
    db.exec(`DELETE FROM telemetry_events WHERE rowid NOT IN (SELECT rowid FROM telemetry_events ORDER BY createdAt DESC LIMIT ${MAX_EVENTS});
      DELETE FROM telemetry_sessions WHERE rowid NOT IN (SELECT rowid FROM telemetry_sessions ORDER BY lastSeen DESC LIMIT ${MAX_SESSIONS});`);
    for (const [key, entry] of limits)
      if (entry.until <= now) limits.delete(key);
  };
  function pageTitle(path: string) {
    if (staticPages[path]) return staticPages[path];
    const match =
      /^\/(urunler|projeler|blog|kurumsal|bolgeler)\/([a-zA-Z0-9_-]+)$/.exec(
        path,
      );
    if (!match) return undefined;
    const type = (
      {
        urunler: "product",
        projeler: "project",
        blog: "article",
        kurumsal: "page",
        bolgeler: "region",
      } as Record<string, string>
    )[match[1]];
    try {
      const row = db
        .prepare("SELECT data FROM content WHERE type=? AND slug=?")
        .get(type, match[2]) as { data: string } | undefined;
      if (!row) return undefined;
      const item = JSON.parse(row.data);
      return item.published ? String(item.title).slice(0, 180) : undefined;
    } catch {
      return undefined;
    }
  }
  function limited(req: Request) {
    const key = digest(req.ip || "unknown");
    const now = Date.now();
    const previous = limits.get(key);
    const entry =
      previous && previous.until > now
        ? previous
        : { count: 0, until: now + 60_000 };
    entry.count++;
    limits.set(key, entry);
    if (limits.size > 3_000) {
      for (const [key, value] of limits)
        if (value.until <= now) limits.delete(key);
      if (limits.size > 3_000) limits.delete(limits.keys().next().value!);
    }
    return entry.count > 120;
  }
  app.post("/api/telemetry", (req, res) => {
    if (req.body?.consent !== true)
      return res
        .status(403)
        .json({ error: "Analitik için açık tercih gereklidir." });
    if (limited(req)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ error: "Çok fazla izleme isteği." });
    }
    if (
      !validSession(req.body?.sessionId) ||
      !allowedEvents.has(req.body?.kind)
    )
      return res.status(400).json({ error: "Geçersiz izleme olayı." });
    const path = canonicalPath(req.body?.path);
    const title = path && pageTitle(path);
    if (!path || !title)
      return res
        .status(400)
        .json({ error: "Bu sayfa analitik kapsamı dışındadır." });
    const now = Date.now();
    const sessionId = digest(req.body.sessionId);
    const maskedIp = maskIp(req.ip || "");
    const device = ["desktop", "mobile", "tablet"].includes(req.body?.device)
      ? req.body.device
      : "desktop";
    const form = allowedForms.has(req.body?.form) ? req.body.form : null;
    // Client titles, coordinates, identities, form values, query strings and tokens are never persisted.
    db.prepare(
      `INSERT INTO telemetry_sessions(id,maskedIp,path,title,device,startedAt,lastSeen) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET maskedIp=excluded.maskedIp,path=excluded.path,title=excluded.title,device=excluded.device,lastSeen=excluded.lastSeen`,
    ).run(sessionId, maskedIp, path, title, device, now, now);
    if (req.body.kind !== "heartbeat")
      db.prepare(
        "INSERT INTO telemetry_events(id,sessionId,maskedIp,kind,path,title,device,form,createdAt) VALUES(?,?,?,?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        sessionId,
        maskedIp,
        req.body.kind,
        path,
        title,
        device,
        form,
        now,
      );
    prune(now);
    return res.status(202).json({ ok: true });
  });
  app.post("/api/telemetry/forget", (req, res) => {
    if (limited(req))
      return res.status(429).json({ error: "Çok fazla istek." });
    if (!validSession(req.body?.sessionId))
      return res.status(400).json({ error: "Geçersiz oturum." });
    const id = digest(req.body.sessionId);
    db.prepare("DELETE FROM telemetry_events WHERE sessionId=?").run(id);
    db.prepare("DELETE FROM telemetry_sessions WHERE id=?").run(id);
    return res.json({ ok: true });
  });
  app.get("/api/admin/live", (req, res) => {
    const actor = readAdmin(req) as
      { role?: string; region?: string } | undefined;
    if (!actor)
      return res.status(403).json({ error: "Bu rapor için yetkiniz yok." });
    const now = Date.now();
    prune(now);
    const visitors = (
      db
        .prepare(
          "SELECT * FROM telemetry_sessions WHERE lastSeen>? ORDER BY lastSeen DESC LIMIT 100",
        )
        .all(now - PRESENCE_MS) as any[]
    ).map((v) => ({
      ...v,
      id: v.id.slice(0, 10),
      startedAt: new Date(v.startedAt).toISOString(),
      lastSeen: new Date(v.lastSeen).toISOString(),
      secondsOnSite: Math.max(0, Math.floor((now - v.startedAt) / 1000)),
    }));
    const stream = (
      db
        .prepare(
          "SELECT * FROM telemetry_events ORDER BY createdAt DESC LIMIT 100",
        )
        .all() as any[]
    ).map((v) => ({
      ...v,
      sessionId: v.sessionId.slice(0, 10),
      createdAt: new Date(v.createdAt).toISOString(),
    }));
    const activeVisitors = Number(
      (
        db
          .prepare(
            "SELECT count(*) AS count FROM telemetry_sessions WHERE lastSeen>?",
          )
          .get(now - PRESENCE_MS) as any
      ).count,
    );
    const productPageviews = Number(
      (
        db
          .prepare(
            "SELECT count(*) AS count FROM telemetry_events WHERE kind='pageview' AND path LIKE '/urunler/%'",
          )
          .get() as any
      ).count,
    );
    const totalPageviews = Number(
      (
        db
          .prepare(
            "SELECT count(*) AS count FROM telemetry_events WHERE kind='pageview'",
          )
          .get() as any
      ).count,
    );
    const topPages = (
      db
        .prepare(
          "SELECT path,title,count(*) AS views FROM telemetry_events WHERE kind='pageview' GROUP BY path ORDER BY views DESC LIMIT 10",
        )
        .all() as any[]
    ).map((v) => ({
      ...v,
      share: totalPageviews ? Math.round((v.views / totalPageviews) * 100) : 0,
    }));
    const topProducts = (
      db
        .prepare(
          "SELECT path,title,count(*) AS views FROM telemetry_events WHERE kind='pageview' AND path LIKE '/urunler/%' GROUP BY path ORDER BY views DESC LIMIT 8",
        )
        .all() as any[]
    ).map((v) => ({
      ...v,
      share: productPageviews
        ? Math.round((v.views / productPageviews) * 100)
        : 0,
    }));
    let inquiries: any[] = [];
    try {
      inquiries = (
        db.prepare("SELECT data FROM inquiries").all() as any[]
      ).flatMap((row) => {
        try {
          return [JSON.parse(row.data)];
        } catch {
          return [];
        }
      });
    } catch {}
    if (actor.role === "manager") {
      const canonical = (value: unknown) =>
        String(value || "")
          .toLocaleLowerCase("tr-TR")
          .replaceAll("ı", "i")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim();
      inquiries = inquiries.filter(
        (item) =>
          !!actor.region &&
          canonical(item.district) === canonical(actor.region),
      );
    }
    const today = istanbulDate(now);
    const dailyLeads = Array.from({ length: 7 }, (_, i) => {
      const date = istanbulDate(now - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        date,
        count: inquiries.filter(
          (item) =>
            Number.isFinite(Date.parse(item.createdAt)) &&
            istanbulDate(Date.parse(item.createdAt)) === date,
        ).length,
      };
    });
    const completedLeads = inquiries.filter(
      (i) =>
        i.status === "closed" ||
        i.stage === "completed" ||
        i.pipelineStage === "completed",
    ).length;
    res.setHeader("Cache-Control", "no-store");
    return res.json({
      generatedAt: new Date(now).toISOString(),
      consentRequired: true,
      retentionDays: 30,
      presenceWindowSeconds: 90,
      locationAvailable: false,
      kpis: {
        activeVisitors,
        todayLeads: inquiries.filter(
          (i) =>
            Number.isFinite(Date.parse(i.createdAt)) &&
            istanbulDate(Date.parse(i.createdAt)) === today,
        ).length,
        totalLeads: inquiries.length,
        completedLeads,
        completionRate: inquiries.length
          ? Math.round((completedLeads / inquiries.length) * 100)
          : 0,
        totalPageviews,
      },
      visitors,
      stream,
      topPages,
      topProducts,
      dailyLeads,
    });
  });
  return {
    cleanup() {
      limits.clear();
    },
  };
}
