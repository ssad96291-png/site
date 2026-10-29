import express from "express";
import { installPortal } from "./portal.js";
import { installTelemetry } from "./telemetry.js";
import { deliverNotification, deliveryConfigured } from "./messaging.js";
import { referencePages, referencePagesVersion } from "./reference-content.js";
import { applyOriginalityContentMigration } from "./originality-content.js";
import { applySingleShopContentMigration } from "./single-shop-content.js";
import { applyCorporateContentMigration } from "./corporate-content.js";
import { validProjectEmail } from "./project-context.js";
import { migratePrivateStorage } from "./private-storage.js";
import {
  installSecurityEventLog,
  installSystemCenter,
} from "./system-center.js";
import { scanBuffer } from "./file-security.js";
import { installMediaRights } from "./media-rights.js";
import { legacyImageReplacement } from "./media-assets.js";
import multer from "multer";
import PDFDocument from "pdfkit";
import { openSecureDatabase } from "./secure-database.js";
import {
  randomBytes,
  randomUUID,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  mkdirSync,
  existsSync,
  writeFileSync,
  chmodSync,
  unlinkSync,
  readdirSync,
  statSync,
  renameSync,
} from "node:fs";
import { resolve, join } from "node:path";
import {
  defaultSettings,
  seedContent,
  expansionContent,
  contentExpansionVersion,
} from "./seed.js";

export interface AppOptions {
  dataDir?: string;
  production?: boolean;
  staticDir?: string;
}
const hash = (s: string) => createHash("sha256").update(s).digest("hex");
function passwordHash(password: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(password, salt, 64).toString("hex");
}
function verifyPassword(password: string, stored: string) {
  const [salt, value] = stored.split(":");
  if (!salt || !value) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(value, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
const fail = (status: number, error: string) =>
  Object.assign(new Error(error), { status });
const str = (v: unknown, max = 5000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const validImage = (v: unknown) => {
  const s = str(v, 500);
  return /^\/(?:images|uploads)\/[A-Za-z0-9_-]+\.(?:svg|png|jpe?g|webp)$/i.test(
    s,
  )
    ? s
    : "";
};
const safeUrl = (v: unknown) => {
  const s = str(v, 500);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" && !u.username && !u.password ? s : "";
  } catch {
    return "";
  }
};
const contentTypes = ["product", "project", "article", "page", "faq", "region"];
const extraSettings: Record<string, unknown> = {
  websiteUrl: "",
  siteUrl: "",
  contactIntro: "",
  quoteTitle: "",
  quoteIntro: "",
  contactTitle: "Projenizi birlikte planlayalım.",
  contactText:
    "İhtiyacınızı anlatın, size uygun çözümü birlikte değerlendirelim.",
  footerText: "Cam, alüminyum ve metal sistemleri.",
  primaryColor: "#213f34",
  accentColor: "#f0f0e6",
  showProjects: true,
  showArticles: true,
  showRegions: true,
  showFaq: true,
  servicesTitle: "Camdan metale, projenize uygun çözümler.",
  processTitle: "İyi bir sonuç, doğru bir süreçle başlar.",
  regionTitle: "Ankara'da size yakın çözümler.",
  processStep1Title: "İhtiyacınızı dinliyoruz",
  processStep1Text:
    "Kullanım amacınızı, beklentilerinizi ve uygulama alanını birlikte değerlendiriyoruz.",
  processStep2Title: "Yerinde keşif",
  processStep2Text:
    "Ölçü, zemin, cephe ve erişim koşullarını inceleyerek teknik kapsamı belirliyoruz.",
  processStep3Title: "Size özel planlama",
  processStep3Text:
    "Malzeme, tasarım ve uygulama detaylarını yazılı teklifinizde netleştiriyoruz.",
  processStep4Title: "Uygulama ve teslim",
  processStep4Text:
    "Montaj sonrası kullanım, temizlik ve bakım bilgilerini sizinle paylaşıyoruz.",
};
const plainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const passwordValue = (v: unknown) =>
  typeof v === "string" && v.length <= 256 ? v : "";
const csvCell = (value: unknown) => {
  let s = String(value ?? "");
  if (/^[\s\u0000-\u001f]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
};
const xmlText = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
function cleanContent(input: any, previous?: any) {
  if (!plainObject(input)) throw fail(400, "Geçerli bir içerik gönderin.");
  const source = { ...previous, ...input };
  const type = str(source.type, 30);
  if (!contentTypes.includes(type))
    throw fail(400, "Geçerli bir içerik türü seçin.");
  const title = str(source.title, 200);
  if (!title) throw fail(400, "Başlık zorunludur.");
  const slug = str(source.slug || title, 200)
    .toLocaleLowerCase("tr")
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw fail(400, "Geçerli bir bağlantı adı girin.");
  return {
    id: previous?.id || randomUUID(),
    type,
    slug,
    title,
    subtitle: str(source.subtitle, 500),
    summary: str(source.summary, 3000),
    body: str(source.body, 60000),
    image: validImage(source.image),
    imageAlt: str(source.imageAlt, 250),
    seoTitle: str(source.seoTitle, 160),
    seoDescription: str(source.seoDescription, 320),
    category: str(source.category, 100),
    featured: source.featured === true,
    published: source.published !== false,
    sortOrder: Number.isFinite(Number(source.sortOrder))
      ? Number(source.sortOrder)
      : 0,
    specs: Array.isArray(source.specs)
      ? source.specs.slice(0, 30).map((s: any) => ({
          label: str(s?.label, 100),
          value: str(s?.value, 1000),
        }))
      : [],
    gallery: Array.isArray(source.gallery)
      ? source.gallery.slice(0, 20).map(validImage).filter(Boolean)
      : [],
    titleEn: str(source.titleEn, 200),
    subtitleEn: str(source.subtitleEn, 500),
    summaryEn: str(source.summaryEn, 3000),
    bodyEn: str(source.bodyEn, 60000),
    createdAt: previous?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
export function createApp(options: AppOptions = {}) {
  const production =
    options.production ?? process.env.NODE_ENV === "production";
  const dataDir = resolve(options.dataDir || process.env.DATA_DIR || ".data");
  const uploadDir = join(dataDir, "uploads");
  mkdirSync(uploadDir, { recursive: true, mode: 0o700 });
  const db = openSecureDatabase(dataDir, production);
  try {
    db.exec(
      "PRAGMA temp_store=MEMORY; PRAGMA journal_mode=MEMORY; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
    );
    db.exec(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY,type TEXT NOT NULL,slug TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(type,slug));
 CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,username TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS audit (id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,target TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY,appliedAt TEXT NOT NULL);`);
    const privateStorageVersion = "private-files-encrypted-v1";
    const protectedFiles = db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(privateStorageVersion);
    migratePrivateStorage({ dataDir, production }, !protectedFiles);
    if (!protectedFiles)
      db.prepare(
        "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
      ).run(privateStorageVersion, new Date().toISOString());
    const bootstrapFile = dataDir + ".initial-admin-password";
    const oldBootstrap = join(dataDir, "initial-admin-password");
    if (existsSync(oldBootstrap)) {
      if (existsSync(bootstrapFile))
        throw new Error(
          "İki ilk yönetici parola dosyası var. Verileri yedekleyip eski kurulum dosyasını güvenli biçimde ayırın.",
        );
      renameSync(oldBootstrap, bootstrapFile);
      chmodSync(bootstrapFile, 0o600);
    }
    const firstRun = !db.prepare("SELECT id FROM settings LIMIT 1").get();
    if (firstRun)
      db.prepare("INSERT INTO settings(id,data) VALUES (1,?)").run(
        JSON.stringify({ ...extraSettings, ...defaultSettings }),
      );
    if (firstRun) {
      const insert = db.prepare(
        "INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)",
      );
      for (const seed of seedContent()) {
        const item = cleanContent(seed);
        insert.run(item.id, item.type, item.slug, JSON.stringify(item));
      }
    }
    // Add the expanded catalogue only once. Existing edits and future deletions stay intact.
    if (
      !db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(contentExpansionVersion)
    ) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const insert = db.prepare(
          "INSERT OR IGNORE INTO content(id,type,slug,data) VALUES(?,?,?,?)",
        );
        for (const seed of expansionContent()) {
          const item = cleanContent(seed);
          insert.run(item.id, item.type, item.slug, JSON.stringify(item));
        }
        db.prepare(
          "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
        ).run(contentExpansionVersion, new Date().toISOString());
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        db.close();
        throw error;
      }
    }
    if (
      !db
        .prepare("SELECT version FROM schema_migrations WHERE version=?")
        .get(referencePagesVersion)
    ) {
      db.exec("BEGIN IMMEDIATE");
      try {
        const insert = db.prepare(
          "INSERT OR IGNORE INTO content(id,type,slug,data) VALUES(?,?,?,?)",
        );
        for (const seed of referencePages()) {
          const item = cleanContent(seed);
          insert.run(item.id, item.type, item.slug, JSON.stringify(item));
        }
        db.prepare(
          "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
        ).run(referencePagesVersion, new Date().toISOString());
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        db.close();
        throw error;
      }
    }
    applyOriginalityContentMigration(db);
    applySingleShopContentMigration(db);
    applyCorporateContentMigration(db);
    if (
      !(db.prepare("SELECT COUNT(*) AS count FROM users").get() as any).count
    ) {
      const provided = process.env.ADMIN_PASSWORD;
      if (provided && (provided.length < 12 || provided.length > 256))
        throw new Error("ADMIN_PASSWORD en az 12 karakter olmalıdır.");
      const initial = provided || randomBytes(18).toString("base64url");
      const username = process.env.ADMIN_USERNAME || "admin";
      db.prepare("INSERT INTO users(username,password) VALUES(?,?)").run(
        username,
        passwordHash(initial),
      );
      if (!provided) {
        const file = bootstrapFile;
        writeFileSync(file, initial + "\n", { mode: 0o600, flag: "wx" });
        chmodSync(file, 0o600);
      }
    }
    const app = express();
    app.disable("x-powered-by");
    const proxyHops = process.env.TRUST_PROXY || "0";
    if (!["0", "1"].includes(proxyHops))
      throw new Error("TRUST_PROXY yalnızca 0 veya 1 olabilir.");
    if (proxyHops === "1") app.set("trust proxy", 1);
    app.locals.db = db;
    app.locals.close = () => db.close();
    const recordAudit = (actor: string, action: string, target: string) => {
      db.prepare(
        "INSERT INTO audit(id,actor,action,target,createdAt) VALUES(?,?,?,?,?)",
      ).run(randomUUID(), actor, action, target, new Date().toISOString());
      db.exec(
        "DELETE FROM audit WHERE rowid NOT IN (SELECT rowid FROM audit ORDER BY rowid DESC LIMIT 2000)",
      );
    };
    app.use((req: any, res, next) => {
      res.on("finish", () => {
        if (
          res.statusCode < 400 &&
          req.admin &&
          !["GET", "HEAD", "OPTIONS"].includes(req.method)
        ) {
          recordAudit(
            req.admin,
            req.method,
            req.path.replace(/^\/api\/admin/, ""),
          );
        }
      });
      next();
    });
    app.use((req, res, next) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
      res.setHeader(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()",
      );
      if (production) {
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains",
        );
        res.setHeader(
          "Content-Security-Policy",
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        );
      }
      next();
    });
    installSecurityEventLog(app, db);
    app.use("/api", (req, res, next) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
        if (
          ["POST", "PUT", "PATCH"].includes(req.method) &&
          req.path !== "/admin/upload" &&
          !/^\/admin\/pipeline\/[^/]+\/documents$/.test(req.path) &&
          !/^\/customer\/inquiries\/[^/]+\/project-files$/.test(req.path) &&
          !req.is("application/json")
        ) {
          return next(fail(415, "Bu işlem JSON biçiminde gönderilmelidir."));
        }
        const origin = req.get("origin");
        const site = req.get("sec-fetch-site");
        if (site === "cross-site" || (site === "same-site" && !origin))
          return next(fail(403, "Bu kaynaktan gelen istek kabul edilmedi."));
        if (origin) {
          let allowed = false;
          try {
            const u = new URL(origin);
            allowed =
              u.host === req.get("host") ||
              origin === process.env.PUBLIC_ORIGIN ||
              (!production && ["localhost", "127.0.0.1"].includes(u.hostname));
          } catch {}
          if (!allowed) return next(fail(403, "İstek kaynağı doğrulanamadı."));
        }
      }
      next();
    });
    app.use(express.json({ limit: "1mb" }));
    app.use(
      "/uploads",
      express.static(uploadDir, {
        dotfiles: "deny",
        setHeaders: (res) => {
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; sandbox",
          );
          res.setHeader("X-Content-Type-Options", "nosniff");
        },
      }),
    );
    const settings = () => ({
      ...extraSettings,
      ...defaultSettings,
      ...JSON.parse(
        (db.prepare("SELECT data FROM settings WHERE id=1").get() as any).data,
      ),
    });
    const allContent = () =>
      db
        .prepare("SELECT data FROM content")
        .all()
        .map((row: any) => JSON.parse(row.data))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    const findContent = (id: string) => {
      const row = db
        .prepare("SELECT data FROM content WHERE id=?")
        .get(id) as any;
      return row ? JSON.parse(row.data) : undefined;
    };
    const cookieName = production ? "__Host-kilinc_session" : "kilinc_session";
    const cookieOptions = {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: production,
      path: "/",
      maxAge: 12 * 60 * 60 * 1000,
    };
    const readUser = (req: any) => {
      const cookie = (req.headers.cookie || "")
        .split(";")
        .map((s: string) => s.trim())
        .find((s: string) => s.startsWith(cookieName + "="));
      if (!cookie) return undefined;
      const token = cookie.slice(cookieName.length + 1);
      const row = db
        .prepare("SELECT username FROM sessions WHERE token=? AND expires>?")
        .get(hash(token), Date.now()) as any;
      return row?.username;
    };
    const requireAuth = (req: any, _res: any, next: any) => {
      const actor = portal.adminContext(req);
      if (!actor) return next(fail(401, "Devam etmek için oturum açın."));
      const safeEditor =
        actor.role === "editor" &&
        (/^\/(?:content(?:\/[^/]+)?|media(?:\/[^/]+)?|media-rights(?:\/[^/]+)?|upload)$/.test(
          req.path,
        ) ||
          (req.path === "/settings" && req.method === "GET"));
      const identity = ["/me", "/logout"].includes(req.path);
      if (actor.role !== "admin" && !safeEditor && !identity)
        return next(fail(403, "Bu işlem için yetkiniz yok."));
      req.admin = actor.username;
      req.operatorRole = actor.role;
      req.operatorKind = readUser(req) ? "admin" : "staff";
      next();
    };
    const loginAttempts = "login";
    const inquiryAttempts = "inquiry";
    const consume = (
      scope: string,
      key: string,
      max: number,
      minutes: number,
    ) => {
      const now = Date.now();
      db.prepare("DELETE FROM rate_limits WHERE reset<?").run(now);
      const rateKey = scope + ":" + hash(key);
      const old = db
        .prepare("SELECT count,reset FROM rate_limits WHERE key=?")
        .get(rateKey) as { count: number; reset: number } | undefined;
      const entry =
        old && old.reset > now
          ? old
          : { count: 0, reset: now + minutes * 60000 };
      entry.count++;
      db.prepare(
        "INSERT OR REPLACE INTO rate_limits(key,count,reset) VALUES(?,?,?)",
      ).run(rateKey, entry.count, entry.reset);
      return entry.count <= max;
    };
    const portal = installPortal({
      app,
      db,
      dataDir,
      production,
      readAdmin: readUser,
      audit: recordAudit,
      deliver: deliverNotification,
      deliveryConfigured,
    });
    const telemetry = installTelemetry({
      app,
      db,
      production,
      readAdmin: (req) => {
        const actor = portal.adminContext(req);
        return actor && ["admin", "manager"].includes(actor.role)
          ? actor
          : undefined;
      },
    });
    app.locals.close = () => {
      portal.close();
      telemetry.cleanup();
      db.close();
    };
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.get("/api/site", (_req, res) =>
      res.json({
        settings: settings(),
        content: allContent().filter((c) => c.published),
      }),
    );
    app.get("/api/content/:type/:slug", (req, res, next) => {
      const row = db
        .prepare("SELECT data FROM content WHERE type=? AND slug=?")
        .get(req.params.type, req.params.slug) as any;
      const content = row ? JSON.parse(row.data) : null;
      if (!content?.published) return next(fail(404, "İçerik bulunamadı."));
      res.json({ content });
    });
    app.post("/api/inquiries", (req, res, next) => {
      if (!consume(inquiryAttempts, req.ip || "", 8, 15))
        return next(
          fail(
            429,
            "Çok fazla talep gönderildi. Lütfen daha sonra tekrar deneyin.",
          ),
        );
      const input = req.body || {};
      const obsoleteKind = String(input.kind || input.type || "").toLowerCase();
      const obsoleteSubject = str(input.subject, 200).toLocaleLowerCase("tr");
      if (
        ["dealer", "dealership", "franchise", "partnership"].includes(
          obsoleteKind,
        ) ||
        [
          "iş ortaklığı başvurusu",
          "bayilik başvurusu",
          "dealership application",
        ].includes(obsoleteSubject)
      )
        return next(
          fail(
            410,
            "Bu başvuru türü kullanıma kapalıdır. Keşif, uygulama veya servis talebi oluşturabilirsiniz.",
          ),
        );
      if (input.website) return res.status(201).json({ id: "received" });
      const name = str(input.name, 100),
        email = str(input.email, 254),
        phone = str(input.phone, 50),
        message = str(input.message, 10000);
      if (
        name.length < 2 ||
        message.length < 10 ||
        (!email && !phone) ||
        input.consent !== true
      )
        return next(
          fail(
            400,
            "Adınızı, iletişim bilginizi, en az 10 karakter mesajınızı ve aydınlatma onayınızı kontrol edin.",
          ),
        );
      if (email && !validProjectEmail(email))
        return next(fail(400, "Geçerli bir e-posta adresi girin."));
      if (
        phone &&
        (!/^[+()\d\s.-]+$/.test(phone) || phone.replace(/\D/g, "").length < 7)
      )
        return next(fail(400, "Geçerli bir telefon numarası girin."));
      const inquiry = {
        id: randomUUID(),
        name,
        email,
        phone,
        district: str(input.district, 100),
        service: str(input.service, 200),
        dimensions: str(input.dimensions, 200),
        budget: str(input.budget, 100),
        preferredContact: str(input.preferredContact, 50),
        notes: "",
        priority: "normal",
        followUpDate: "",
        message,
        subject: str(input.subject, 200) || "Teklif talebi",
        product: str(input.product, 200),
        consent: true,
        status: "new",
        createdAt: new Date().toISOString(),
      };
      let tracking: { trackingToken?: string; trackingUrl?: string };
      db.exec("BEGIN IMMEDIATE");
      try {
        db.prepare("INSERT INTO inquiries(id,data) VALUES(?,?)").run(
          inquiry.id,
          JSON.stringify(inquiry),
        );
        tracking = portal.onInquiryCreated(req, res, inquiry);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        return next(error);
      }
      res.status(201).json({ id: inquiry.id, ...tracking });
    });
    const pdfFont = () =>
      [
        process.env.PDF_FONT_PATH,
        resolve("server/assets/DejaVuSans.ttf"),
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
      ].find((file): file is string => !!file && existsSync(file));
    app.get("/api/measurement-guide.pdf", (req, res, next) => {
      if (!consume("catalog", req.ip || "", 12, 15)) {
        res.setHeader("Retry-After", "900");
        return next(
          fail(429, "Çok fazla belge isteği. Daha sonra tekrar deneyin."),
        );
      }
      const item = allContent().find(
        (c) => c.type === "page" && c.slug === "olcu-rehberi" && c.published,
      );
      if (!item) return next(fail(404, "Bu rehber henüz yayında değil."));
      try {
        const doc = new PDFDocument({ size: "A4", margin: 48 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="kilinc-on-olcu-rehberi.pdf"',
        );
        doc.pipe(res);
        const font = pdfFont();
        if (font) doc.font(font);
        doc
          .fontSize(22)
          .text(settings().companyName)
          .moveDown()
          .fontSize(18)
          .text(item.title)
          .moveDown()
          .fontSize(10)
          .text(item.body)
          .moveDown();
        for (const step of item.specs) {
          if (doc.y > 650) doc.addPage();
          doc
            .fontSize(13)
            .text(step.label)
            .moveDown(0.4)
            .fontSize(10)
            .text(step.value)
            .moveDown();
        }
        doc.end();
      } catch (error) {
        next(error);
      }
    });
    app.get("/api/catalog.pdf", (req, res, next) => {
      if (!consume("catalog", req.ip || "", 12, 15)) {
        res.setHeader("Retry-After", "900");
        return next(
          fail(
            429,
            "Çok fazla katalog isteği. Lütfen daha sonra tekrar deneyin.",
          ),
        );
      }
      try {
        const s = settings();
        const english = req.query.lang === "en";
        const family =
          typeof req.query.family === "string" ? req.query.family : "all";
        if (!["all", "outdoor", "aluminium", "metal"].includes(family))
          return next(fail(400, "Geçerli bir katalog seçin."));
        const matchesFamily = (title: string) =>
          family === "all" ||
          (family === "metal"
            ? /demir|çelik|ferforje|yangın|metal|korkuluk/i.test(title)
            : family === "aluminium"
              ? /alüminyum|cephe|ofis|doğrama/i.test(title) &&
                !/çelik|ferforje|yangın/i.test(title)
              : /pergola|bahçe|gölge/i.test(title));
        const doc = new PDFDocument({
          size: "A4",
          margin: 48,
          info: {
            Title: english ? "Kilinc Product Guide" : "Kılınç Ürün Rehberi",
            Author: s.companyName || "Kılınç Dekorasyon",
          },
        });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          'attachment; filename="kilinc-dekarasyon-katalog.pdf"',
        );
        doc.pipe(res);
        const font = pdfFont();
        if (font) doc.font(font);
        doc
          .fillColor("#233b33")
          .fontSize(26)
          .text(s.companyName || "Kılınç Dekorasyon");
        doc
          .moveDown()
          .fontSize(14)
          .text(
            english
              ? "Glass & Outdoor Living Solutions"
              : "Cam ve Açık Alan Çözümleri",
          );
        doc
          .moveDown()
          .fontSize(10)
          .fillColor("#555")
          .text(
            english
              ? "General product information. Specifications and pricing are confirmed in your project proposal. All visuals on this website are illustrative concepts."
              : "Genel ürün bilgilendirmesi. Teknik özellikler ve fiyatlar projenize özel teklifte netleştirilir. Sitedeki görseller temsili tasarım çalışmalarıdır.",
          );
        for (const item of allContent().filter(
          (i) => i.type === "product" && i.published && matchesFamily(i.title),
        )) {
          if (doc.y > 650) doc.addPage();
          doc
            .moveDown(1.2)
            .fontSize(15)
            .fillColor("#233b33")
            .text(english && item.titleEn ? item.titleEn : item.title);
          doc
            .moveDown(0.4)
            .fontSize(10)
            .fillColor("#444")
            .text(english && item.summaryEn ? item.summaryEn : item.summary);
        }
        doc
          .moveDown(2)
          .fontSize(10)
          .text(
            [s.phone, s.email, s.address].filter(Boolean).join(" · ") ||
              (english
                ? "Send us an inquiry through the contact form."
                : "İletişim formundan teklif talebinizi iletebilirsiniz."),
          );
        doc.end();
      } catch (err) {
        next(err);
      }
    });
    app.post("/api/admin/login", (req, res, next) => {
      if (!consume(loginAttempts, req.ip || "", 8, 15))
        return next(
          fail(
            429,
            "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.",
          ),
        );
      const username = str(req.body?.username, 100),
        password = passwordValue(req.body?.password);
      if (!consume("account", username.toLocaleLowerCase("en"), 30, 15))
        return next(
          fail(
            429,
            "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.",
          ),
        );
      const user = db
        .prepare("SELECT password FROM users WHERE username=?")
        .get(username) as any;
      // Perform equal-cost password verification for unknown users as well.
      const valid = verifyPassword(
        password,
        user?.password || "dummy-salt:" + Buffer.alloc(64).toString("hex"),
      );
      if (!user || !valid) {
        recordAudit("anonymous", "LOGIN_FAILED", "/login");
        return next(fail(401, "Kullanıcı adı veya şifre hatalı."));
      }
      db.prepare("DELETE FROM rate_limits WHERE key=?").run(
        "login:" + hash(req.ip || ""),
      );
      db.prepare("DELETE FROM rate_limits WHERE key=?").run(
        "account:" + hash(username.toLocaleLowerCase("en")),
      );
      db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
      const token = randomBytes(32).toString("hex");
      db.prepare(
        "INSERT INTO sessions(token,username,expires) VALUES(?,?,?)",
      ).run(hash(token), username, Date.now() + cookieOptions.maxAge);
      recordAudit(username, "LOGIN", "/login");
      const staffCookieName = production
        ? "__Host-kilinc_staff"
        : "kilinc_staff";
      const priorStaffCookie = (req.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(staffCookieName + "="));
      if (priorStaffCookie)
        db.prepare("DELETE FROM portal_staff_sessions WHERE token=?").run(
          hash(priorStaffCookie.slice(staffCookieName.length + 1)),
        );
      res.cookie(cookieName, token, cookieOptions);
      res.clearCookie(staffCookieName, { ...cookieOptions, maxAge: undefined });
      res.json({ user: { username, role: "admin", authKind: "admin" } });
    });
    app.use("/api/admin", requireAuth);
    installSystemCenter({
      app,
      db,
      dataDir,
      production,
      readAdmin: readUser,
      consume,
      audit: recordAudit,
      verifyPassword: (req, password) => {
        const username = readUser(req);
        const row =
          username &&
          (db
            .prepare("SELECT password FROM users WHERE username=?")
            .get(username) as { password: string } | undefined);
        return !!row && verifyPassword(password, row.password);
      },
    });
    app.get("/api/admin/me", (req: any, res) =>
      res.json({
        user: {
          username: req.admin,
          role: req.operatorRole,
          authKind: req.operatorKind,
        },
      }),
    );
    app.post("/api/admin/logout", (req, res) => {
      const cookie = (req.headers.cookie || "")
        .split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith(cookieName + "="));
      if (cookie)
        db.prepare("DELETE FROM sessions WHERE token=?").run(
          hash(cookie.slice(cookieName.length + 1)),
        );
      const staffCookieName = production
        ? "__Host-kilinc_staff"
        : "kilinc_staff";
      const staffCookie = (req.headers.cookie || "")
        .split(";")
        .map((v) => v.trim())
        .find((v) => v.startsWith(staffCookieName + "="));
      if (staffCookie)
        db.prepare("DELETE FROM portal_staff_sessions WHERE token=?").run(
          hash(staffCookie.slice(staffCookieName.length + 1)),
        );
      res.clearCookie(staffCookieName, { ...cookieOptions, maxAge: undefined });
      res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
      res.json({ ok: true });
    });
    app.get("/api/admin/content", (_req, res) =>
      res.json({ content: allContent() }),
    );
    app.post("/api/admin/content", (req, res, next) => {
      try {
        const item = cleanContent(req.body);
        db.prepare(
          "INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)",
        ).run(item.id, item.type, item.slug, JSON.stringify(item));
        res.status(201).json({ content: item });
      } catch (err) {
        next(err);
      }
    });
    app.put("/api/admin/content/:id", (req, res, next) => {
      try {
        const old = findContent(String(req.params.id));
        if (!old) return next(fail(404, "İçerik bulunamadı."));
        const item = cleanContent(req.body, old);
        db.prepare("UPDATE content SET type=?,slug=?,data=? WHERE id=?").run(
          item.type,
          item.slug,
          JSON.stringify(item),
          item.id,
        );
        res.json({ content: item });
      } catch (err) {
        next(err);
      }
    });
    app.delete("/api/admin/content/:id", (req, res, next) => {
      const deleted = db
        .prepare("DELETE FROM content WHERE id=?")
        .run(String(req.params.id));
      if (!deleted.changes) return next(fail(404, "İçerik bulunamadı."));
      res.json({ ok: true });
    });
    app.get("/api/admin/settings", (_req, res) =>
      res.json({ settings: settings() }),
    );
    app.put("/api/admin/settings", (req, res, next) => {
      try {
        const old = settings(),
          incoming = req.body?.settings || req.body;
        const updated = { ...old };
        if (!plainObject(incoming))
          throw fail(400, "Geçerli ayarlar gönderin.");
        for (const key of Object.keys({
          ...extraSettings,
          ...defaultSettings,
        })) {
          if (!(key in incoming)) continue;
          if (
            ["showProjects", "showArticles", "showRegions", "showFaq"].includes(
              key,
            )
          ) {
            if (typeof incoming[key] !== "boolean")
              throw fail(400, "Görünürlük ayarları doğru/yanlış olmalıdır.");
            updated[key] = incoming[key];
          } else if (["primaryColor", "accentColor"].includes(key)) {
            if (!/^#[0-9a-f]{6}$/i.test(incoming[key]))
              throw fail(400, "Renkleri #RRGGBB biçiminde girin.");
            updated[key] = incoming[key];
          } else if (["websiteUrl", "siteUrl"].includes(key)) {
            // The editor sends all settings; the legacy alias must not override
            // the canonical field with its previous value.
            if (key === "siteUrl" && "websiteUrl" in incoming) continue;
            const value = str(incoming[key], 500);
            if (value && !safeUrl(value))
              throw fail(400, "Site adresi https:// ile başlamalıdır.");
            updated[key] = value ? new URL(value).origin : "";
            updated.websiteUrl = updated[key];
            updated.siteUrl = updated[key];
          } else if (key === "heroImage") {
            const image = validImage(incoming[key]);
            if (incoming[key] && !image)
              throw fail(
                400,
                "Ana görsel için yüklenmiş veya yerel bir görsel seçin.",
              );
            updated.heroImage = image || "/images/hero.svg";
          } else if (key === "languages") {
            updated.languages = Array.isArray(incoming.languages)
              ? incoming.languages.filter((v: string) =>
                  ["tr", "en"].includes(v),
                )
              : ["tr"];
            if (!updated.languages.includes("tr"))
              updated.languages.unshift("tr");
          } else if (
            ["instagram", "facebook", "youtube", "linkedin"].includes(key)
          ) {
            const val = str(incoming[key], 500);
            if (val && !safeUrl(val))
              throw fail(
                400,
                "Sosyal bağlantıları https:// ile başlayan tam adres olarak girin.",
              );
            updated[key] = val;
          } else
            updated[key] = str(
              incoming[key],
              key.toLowerCase().includes("text") ||
                key.toLowerCase().includes("subtitle")
                ? 10000
                : 2000,
            );
        }
        db.prepare("UPDATE settings SET data=? WHERE id=1").run(
          JSON.stringify(updated),
        );
        res.json({ settings: updated });
      } catch (err) {
        next(err);
      }
    });
    app.get("/api/admin/inquiries", (_req, res) =>
      res.json({
        inquiries: db
          .prepare("SELECT data FROM inquiries ORDER BY rowid DESC")
          .all()
          .map((r: any) => JSON.parse(r.data)),
      }),
    );
    app.patch("/api/admin/inquiries/:id", (req, res, next) => {
      const row = db
        .prepare("SELECT data FROM inquiries WHERE id=?")
        .get(String(req.params.id)) as any;
      if (!row) return next(fail(404, "Talep bulunamadı."));
      if (!plainObject(req.body))
        return next(fail(400, "Geçerli bir talep güncellemesi gönderin."));
      const input = req.body;
      if (
        input.status !== undefined &&
        !["new", "contacted", "closed"].includes(input.status)
      )
        return next(fail(400, "Geçerli bir durum seçin."));
      if (
        input.priority !== undefined &&
        !["normal", "high"].includes(input.priority)
      )
        return next(fail(400, "Geçerli bir öncelik seçin."));
      if (
        input.followUpDate !== undefined &&
        typeof input.followUpDate !== "string"
      )
        return next(fail(400, "Takip tarihi metin olmalıdır."));
      if (
        input.followUpDate &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(input.followUpDate) ||
          !Number.isFinite(Date.parse(input.followUpDate)) ||
          new Date(input.followUpDate).toISOString().slice(0, 10) !==
            input.followUpDate)
      )
        return next(fail(400, "Geçerli bir takip tarihi girin."));
      const inquiry = {
        ...JSON.parse(row.data),
        updatedAt: new Date().toISOString(),
      };
      for (const field of ["status", "priority"])
        if (input[field] !== undefined) inquiry[field] = input[field];
      if (input.notes !== undefined) inquiry.notes = str(input.notes, 10000);
      if (input.followUpDate !== undefined)
        inquiry.followUpDate = str(input.followUpDate, 10);
      db.prepare("UPDATE inquiries SET data=? WHERE id=?").run(
        JSON.stringify(inquiry),
        inquiry.id,
      );
      portal.onLegacyInquiryUpdated(req, inquiry);
      res.json({ inquiry });
    });
    app.delete("/api/admin/inquiries/:id", (req, res, next) => {
      const r = db
        .prepare("DELETE FROM inquiries WHERE id=?")
        .run(String(req.params.id));
      if (!r.changes) return next(fail(404, "Talep bulunamadı."));
      portal.onInquiryDeleted(String(req.params.id));
      res.json({ ok: true });
    });
    const mediaRights = installMediaRights({ app, db, uploadDir, recordAudit });
    const upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 8 * 1024 * 1024,
        files: 1,
        fields: 6,
        parts: 7,
        fieldSize: 4096,
      },
    });
    app.post(
      "/api/admin/upload",
      upload.single("image"),
      async (req, res, next) => {
        try {
          const file = req.file;
          if (!file) return next(fail(400, "Bir görsel seçin."));
          const b = file.buffer;
          let extension = "";
          if (
            b.length > 24 &&
            b
              .subarray(0, 8)
              .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
            b.subarray(12, 16).toString() === "IHDR"
          )
            extension = "png";
          else if (
            b.length > 10 &&
            b[0] === 255 &&
            b[1] === 216 &&
            b[2] === 255 &&
            b.at(-2) === 255 &&
            b.at(-1) === 217
          )
            extension = "jpg";
          else if (
            b.length > 16 &&
            b.subarray(0, 4).toString() === "RIFF" &&
            b.subarray(8, 12).toString() === "WEBP"
          )
            extension = "webp";
          if (!extension)
            return next(
              fail(400, "Yalnızca geçerli JPG, PNG veya WebP görsel yükleyin."),
            );
          if (extension === "png") {
            const width = b.readUInt32BE(16),
              height = b.readUInt32BE(20);
            if (
              !width ||
              !height ||
              width > 16000 ||
              height > 16000 ||
              width * height > 64_000_000
            )
              return next(
                fail(
                  400,
                  "Görsel boyutları en fazla 16000 piksel ve 64 megapiksel olabilir.",
                ),
              );
          }
          const scan = await scanBuffer(b, {
            production,
            maxBytes: 8 * 1024 * 1024,
          });
          const currentActor = portal.adminContext(req);
          if (
            !currentActor ||
            currentActor.username !== (req as any).admin ||
            !["admin", "editor"].includes(currentActor.role)
          )
            return next(
              fail(401, "Oturumunuz sona erdi. Yeniden giriş yapın."),
            );
          const filename = randomUUID() + "." + extension;
          writeFileSync(join(uploadDir, filename), b, {
            mode: 0o600,
            flag: "wx",
          });
          try {
            mediaRights.recordUploadRights(
              filename,
              req.body,
              (req as any).admin,
            );
          } catch (error) {
            unlinkSync(join(uploadDir, filename));
            return next(error);
          }
          recordAudit(
            (req as any).admin,
            "MEDIA_SECURITY_SCAN",
            scan.status + ":" + filename,
          );
          res.status(201).json({ url: "/uploads/" + filename, scan });
        } catch (error) {
          next(error);
        }
      },
    );
    app.put("/api/admin/password", (req: any, res, next) => {
      if (!consume("password", req.ip || "", 8, 15))
        return next(
          fail(
            429,
            "Çok fazla şifre değiştirme denemesi. Daha sonra tekrar deneyin.",
          ),
        );
      const current = passwordValue(req.body?.currentPassword),
        newPassword = passwordValue(req.body?.newPassword);
      if (newPassword.length < 12)
        return next(fail(400, "Yeni şifre en az 12 karakter olmalıdır."));
      const user = db
        .prepare("SELECT password FROM users WHERE username=?")
        .get(req.admin) as any;
      if (!verifyPassword(current, user.password))
        return next(fail(400, "Mevcut şifre hatalı."));
      db.prepare("UPDATE users SET password=? WHERE username=?").run(
        passwordHash(newPassword),
        req.admin,
      );
      db.prepare("DELETE FROM sessions WHERE username=?").run(req.admin);
      const bootstrap = bootstrapFile;
      if (existsSync(bootstrap)) unlinkSync(bootstrap);
      res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
      res.json({ ok: true });
    });
    app.get("/api/admin/audit", (_req, res) => {
      res.json({
        events: db
          .prepare(
            "SELECT id,actor,action,target,createdAt FROM audit ORDER BY rowid DESC LIMIT 100",
          )
          .all(),
      });
    });
    const allInquiries = () =>
      db
        .prepare("SELECT data FROM inquiries ORDER BY rowid DESC")
        .all()
        .map((row: any) => JSON.parse(row.data));
    app.get("/api/admin/export", (req: any, res) => {
      recordAudit(req.admin, "EXPORT", "/export");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="kilinc-icerik-yedegi.json"',
      );
      res.json({
        version: 1,
        exportedAt: new Date().toISOString(),
        settings: settings(),
        content: allContent(),
        inquiries: allInquiries(),
      });
    });
    app.get("/api/admin/inquiries.csv", (req: any, res) => {
      recordAudit(req.admin, "EXPORT", "/inquiries.csv");
      const keys = [
        "name",
        "email",
        "phone",
        "district",
        "service",
        "subject",
        "message",
        "status",
        "priority",
        "notes",
        "followUpDate",
        "createdAt",
      ];
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="kilinc-talepler.csv"',
      );
      res
        .type("text/csv")
        .send(
          "\uFEFF" +
            [
              keys.map(csvCell).join(";"),
              ...allInquiries().map((i) =>
                keys.map((k) => csvCell(i[k])).join(";"),
              ),
            ].join("\r\n"),
        );
    });
    app.get("/api/admin/security", (_req, res) =>
      res.json({
        bootstrapPasswordPending: existsSync(bootstrapFile),
        activeSessions: (
          db
            .prepare("SELECT count(*) AS count FROM sessions WHERE expires>?")
            .get(Date.now()) as any
        ).count,
        production,
        database: "sqlite",
      }),
    );
    app.post("/api/admin/sessions/revoke", (req: any, res) => {
      const raw = (req.headers.cookie || "")
        .split(";")
        .map((s: string) => s.trim())
        .find((s: string) => s.startsWith(cookieName + "="));
      const currentHash = hash(raw?.slice(cookieName.length + 1) || "");
      db.prepare("DELETE FROM sessions WHERE username=? AND token<>?").run(
        req.admin,
        currentHash,
      );
      res.json({ ok: true });
    });
    app.get("/api/admin/media", (_req, res) => {
      res.json({
        media: readdirSync(uploadDir)
          .filter((name) => /^[a-f0-9-]+\.(png|jpg|webp)$/.test(name))
          .map((name) => ({
            url: "/uploads/" + name,
            size: statSync(join(uploadDir, name)).size,
            createdAt: statSync(join(uploadDir, name)).mtime.toISOString(),
          }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      });
    });
    app.delete("/api/admin/media/:filename", (req, res, next) => {
      const name = String(req.params.filename);
      if (!/^[a-f0-9-]+\.(png|jpg|webp)$/.test(name))
        return next(fail(400, "Geçersiz dosya adı."));
      const url = "/uploads/" + name;
      if (
        JSON.stringify(settings()).includes(url) ||
        allContent().some((c) => JSON.stringify(c).includes(url))
      )
        return next(
          fail(
            409,
            "Bu görsel bir içerikte kullanılıyor. Önce içeriği güncelleyin.",
          ),
        );
      if (!existsSync(join(uploadDir, name)))
        return next(fail(404, "Görsel bulunamadı."));
      unlinkSync(join(uploadDir, name));
      mediaRights.deleteMediaRights(name);
      res.json({ ok: true });
    });
    app.get("/robots.txt", (_req, res) => {
      const origin = settings().websiteUrl;
      res
        .type("text/plain")
        .send(
          "User-agent: *\nDisallow: /api/\nDisallow: /yonetim\nDisallow: /admin\n" +
            (origin ? "Sitemap: " + origin + "/sitemap.xml\n" : ""),
        );
    });
    app.get("/llms.txt", (_req, res) => {
      const s = settings();
      const origin = s.websiteUrl || "";
      const routes: Record<string, string> = {
        product: "urunler",
        project: "projeler",
        article: "blog",
        page: "kurumsal",
        region: "bolgeler",
      };
      const links = allContent()
        .filter((c) => c.published && routes[c.type])
        .map(
          (c) =>
            `- [${str(c.title, 200).replace(/[\[\]\r\n]/g, " ")}](${origin}/${routes[c.type]}/${c.slug}): ${str(c.summary, 500).replace(/[\r\n]/g, " ")}`,
        );
      res
        .type("text/plain")
        .send(
          `# ${s.companyName}\n\n> Cam, alüminyum ve metal sistemleri hakkında yayınlanmış ürün ve hizmet rehberleri.\n\nTeknik özellikler, uygulama kapsamı, fiyat ve garanti koşulları projeye özel yazılı teklif ile doğrulanmalıdır. Konsept görseller tamamlanmış müşteri referansı değildir.\n\n## Yayındaki içerikler\n\n${links.join("\n")}\n\n## İletişim\n\n- [İletişim ve keşif talebi](${origin}/iletisim)\n`,
        );
    });
    app.get("/sitemap.xml", (_req, res) => {
      const origin = settings().websiteUrl;
      if (!origin)
        return res
          .status(503)
          .type("text/plain")
          .send("Site adresini yönetim panelinden yapılandırın.");
      const routes: Record<string, string> = {
        product: "urunler",
        project: "projeler",
        article: "blog",
        page: "kurumsal",
        region: "bolgeler",
      };
      const paths = [
        "",
        "/hizmetler",
        "/fikir-defteri",
        "/projeler",
        "/blog",
        "/iletisim",
        "/hizmet-alani",
        "/katalog",
        "/proje-teklif",
        "/proje-birimi",
        "/kurumsal",
        "/sistem-secici",
        ...allContent()
          .filter((c) => c.published && routes[c.type])
          .map((c) => "/" + routes[c.type] + "/" + c.slug),
      ];
      res
        .type("application/xml")
        .send(
          '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
            [...new Set(paths)]
              .map(
                (path) =>
                  "<url><loc>" + xmlText(origin + path) + "</loc></url>",
              )
              .join("") +
            "</urlset>",
        );
    });
    app.use("/api", (_req, _res, next) => next(fail(404, "İşlem bulunamadı.")));
    app.get(
      ["/is-ortakligi", "/bayilik", "/bayi", "/bayiler", "/franchise"],
      (_req, res) => {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
        res
          .status(410)
          .type("text/plain")
          .send("Bu sayfa kullanıma kapalıdır.");
      },
    );
    const publicAliases: Record<string, string> = {
      "/urunler": "/hizmetler",
      "/galeri": "/fikir-defteri",
      "/dukkanimiz": "/kurumsal",
      "/bolgeler": "/hizmet-alani",
    };
    app.get(Object.keys(publicAliases), (req, res) =>
      res.redirect(302, publicAliases[req.path]),
    );
    app.use(["/hesabim", "/yonetim", "/admin"], (_req, res, next) => {
      res.setHeader("X-Robots-Tag", "noindex, nofollow");
      res.setHeader("Cache-Control", "private, no-store");
      next();
    });
    app.get(/^\/images\/[^/]+\.svg$/, (req, res, next) => {
      const replacement = legacyImageReplacement(req.path);
      if (replacement) return res.redirect(302, replacement);
      next();
    });
    if (options.staticDir) {
      const dir = resolve(options.staticDir);
      app.use(express.static(dir));
      app.get("/{*path}", (_req, res) => res.sendFile(join(dir, "index.html")));
    }
    app.use((err: any, req: any, res: any, _next: any) => {
      if (res.headersSent) return;
      if (err.type === "entity.parse.failed")
        return res.status(400).json({ error: "Geçersiz JSON verisi." });
      if (err.type === "entity.too.large")
        return res.status(413).json({ error: "İstek verisi çok büyük." });
      if (
        err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
        String(err.message).includes("UNIQUE constraint")
      )
        return res
          .status(409)
          .json({ error: "Bu bağlantı adı zaten kullanılıyor." });
      if (err.code === "LIMIT_FILE_SIZE") {
        const message =
          /^\/api\/customer\/inquiries\/[^/]+\/project-files$/.test(req.path)
            ? "Her proje dosyası en fazla 20 MB olabilir."
            : /^\/api\/admin\/pipeline\/[^/]+\/documents$/.test(req.path)
              ? "PDF belgesi en fazla 10 MB olabilir."
              : "Görsel en fazla 8 MB olabilir.";
        return res.status(413).json({ error: message });
      }
      const status = Math.min(
        599,
        Math.max(
          400,
          Number(err.status) || (err instanceof multer.MulterError ? 400 : 500),
        ),
      );
      if (status >= 500) console.error("Server request failed:", err.name);
      res.status(status).json({
        error:
          status >= 500
            ? "İşlem tamamlanamadı. Lütfen tekrar deneyin."
            : err.message || "Geçersiz istek.",
      });
    });
    return app;
  } catch (error) {
    db.close();
    throw error;
  }
}
