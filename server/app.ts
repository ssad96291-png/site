import express from "express";
import multer from "multer";
import PDFDocument from "pdfkit";
import { DatabaseSync } from "node:sqlite";
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
} from "node:fs";
import { resolve, join } from "node:path";
import { defaultSettings, seedContent, type Content } from "./seed.js";

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
  return s.startsWith("/images/") || s.startsWith("/uploads/") ? s : "";
};
const safeUrl = (v: unknown) => {
  const s = str(v, 500);
  if (!s) return "";
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? s : "";
  } catch {
    return "";
  }
};
const contentTypes = ["product", "project", "article", "page", "faq"];
function cleanContent(input: any, previous?: any) {
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
    category: str(source.category, 100),
    featured: source.featured === true,
    published: source.published !== false,
    sortOrder: Number.isFinite(Number(source.sortOrder))
      ? Number(source.sortOrder)
      : 0,
    specs: Array.isArray(source.specs)
      ? source.specs
          .slice(0, 30)
          .map((s: any) => ({
            label: str(s.label, 100),
            value: str(s.value, 1000),
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
  const db = new DatabaseSync(join(dataDir, "site.sqlite"));
  db.exec(
    "PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;",
  );
  db.exec(`CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS content (id TEXT PRIMARY KEY,type TEXT NOT NULL,slug TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(type,slug));
 CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY,username TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS inquiries (id TEXT PRIMARY KEY,data TEXT NOT NULL);`);
  const firstRun = !db.prepare("SELECT id FROM settings LIMIT 1").get();
  if (firstRun)
    db.prepare("INSERT INTO settings(id,data) VALUES (1,?)").run(
      JSON.stringify(defaultSettings),
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
  if (!(db.prepare("SELECT COUNT(*) AS count FROM users").get() as any).count) {
    const provided = process.env.ADMIN_PASSWORD;
    if (provided && provided.length < 12)
      throw new Error("ADMIN_PASSWORD en az 12 karakter olmalıdır.");
    const initial = provided || randomBytes(18).toString("base64url");
    const username = process.env.ADMIN_USERNAME || "admin";
    db.prepare("INSERT INTO users(username,password) VALUES(?,?)").run(
      username,
      passwordHash(initial),
    );
    if (!provided) {
      const file = join(dataDir, "initial-admin-password");
      writeFileSync(file, initial + "\n", { mode: 0o600, flag: "wx" });
      chmodSync(file, 0o600);
    }
  }
  const app = express();
  app.disable("x-powered-by");
  app.locals.db = db;
  app.locals.close = () => db.close();
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()",
    );
    if (production)
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
    next();
  });
  app.use("/api", (req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = req.get("origin");
      const site = req.get("sec-fetch-site");
      if (site === "cross-site")
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
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
        res.setHeader("X-Content-Type-Options", "nosniff");
      },
    }),
  );
  const settings = () =>
    JSON.parse(
      (db.prepare("SELECT data FROM settings WHERE id=1").get() as any).data,
    );
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
  const requireAuth = (req: any, res: any, next: any) => {
    const username = readUser(req);
    if (!username) return next(fail(401, "Devam etmek için oturum açın."));
    req.admin = username;
    next();
  };
  const loginAttempts = new Map<string, { count: number; reset: number }>();
  const inquiryAttempts = new Map<string, { count: number; reset: number }>();
  const consume = (
    map: Map<string, { count: number; reset: number }>,
    key: string,
    max: number,
    minutes: number,
  ) => {
    const now = Date.now();
    for (const [k, v] of map) if (v.reset < now) map.delete(k);
    const old = map.get(key);
    const entry =
      old && old.reset > now ? old : { count: 0, reset: now + minutes * 60000 };
    entry.count++;
    map.set(key, entry);
    return entry.count <= max;
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return next(fail(400, "Geçerli bir e-posta adresi girin."));
    const inquiry = {
      id: randomUUID(),
      name,
      email,
      phone,
      message,
      subject: str(input.subject, 200) || "Teklif talebi",
      product: str(input.product, 200),
      consent: true,
      status: "new",
      createdAt: new Date().toISOString(),
    };
    db.prepare("INSERT INTO inquiries(id,data) VALUES(?,?)").run(
      inquiry.id,
      JSON.stringify(inquiry),
    );
    res.status(201).json({ id: inquiry.id });
  });
  app.get("/api/catalog.pdf", (req, res, next) => {
    try {
      const s = settings();
      const english = req.query.lang === "en";
      const doc = new PDFDocument({
        size: "A4",
        margin: 48,
        info: {
          Title: english ? "Kilinc Product Guide" : "Kılınç Ürün Rehberi",
          Author: s.companyName || "Kılınç Dekarasyon",
        },
      });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="kilinc-dekarasyon-katalog.pdf"',
      );
      doc.pipe(res);
      const font = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
      if (existsSync(font)) doc.font(font);
      doc
        .fillColor("#233b33")
        .fontSize(26)
        .text(s.companyName || "Kılınç Dekarasyon");
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
        (i) => i.type === "product" && i.published,
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
        fail(429, "Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin."),
      );
    const username = str(req.body?.username, 100),
      password = str(req.body?.password, 256);
    const user = db
      .prepare("SELECT password FROM users WHERE username=?")
      .get(username) as any;
    // Perform equal-cost password verification for unknown users as well.
    const valid = verifyPassword(
      password,
      user?.password || "dummy-salt:" + Buffer.alloc(64).toString("hex"),
    );
    if (!user || !valid)
      return next(fail(401, "Kullanıcı adı veya şifre hatalı."));
    loginAttempts.delete(req.ip || "");
    db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
    const token = randomBytes(32).toString("hex");
    db.prepare(
      "INSERT INTO sessions(token,username,expires) VALUES(?,?,?)",
    ).run(hash(token), username, Date.now() + cookieOptions.maxAge);
    res.cookie(cookieName, token, cookieOptions);
    res.json({ user: { username } });
  });
  app.use("/api/admin", requireAuth);
  app.get("/api/admin/me", (req: any, res) =>
    res.json({ user: { username: req.admin } }),
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
    res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });
  app.get("/api/admin/content", (_req, res) =>
    res.json({ content: allContent() }),
  );
  app.post("/api/admin/content", (req, res, next) => {
    try {
      const item = cleanContent(req.body);
      db.prepare("INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)").run(
        item.id,
        item.type,
        item.slug,
        JSON.stringify(item),
      );
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
      for (const key of Object.keys(defaultSettings)) {
        if (!(key in incoming)) continue;
        if (key === "heroImage") {
          const image = validImage(incoming[key]);
          if (incoming[key] && !image)
            throw fail(
              400,
              "Ana görsel için yüklenmiş veya yerel bir görsel seçin.",
            );
          updated.heroImage = image || "/images/hero.svg";
        } else if (key === "languages") {
          updated.languages = Array.isArray(incoming.languages)
            ? incoming.languages.filter((v: string) => ["tr", "en"].includes(v))
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
    if (!["new", "contacted", "closed"].includes(req.body?.status))
      return next(fail(400, "Geçerli bir durum seçin."));
    const inquiry = { ...JSON.parse(row.data), status: req.body.status };
    db.prepare("UPDATE inquiries SET data=? WHERE id=?").run(
      JSON.stringify(inquiry),
      inquiry.id,
    );
    res.json({ inquiry });
  });
  app.delete("/api/admin/inquiries/:id", (req, res, next) => {
    const r = db
      .prepare("DELETE FROM inquiries WHERE id=?")
      .run(String(req.params.id));
    if (!r.changes) return next(fail(404, "Talep bulunamadı."));
    res.json({ ok: true });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });
  app.post("/api/admin/upload", upload.single("image"), (req, res, next) => {
    const file = req.file;
    if (!file) return next(fail(400, "Bir görsel seçin."));
    const b = file.buffer;
    let extension = "";
    if (
      b.length > 24 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
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
    const filename = randomUUID() + "." + extension;
    writeFileSync(join(uploadDir, filename), b, { mode: 0o600, flag: "wx" });
    res.status(201).json({ url: "/uploads/" + filename });
  });
  app.put("/api/admin/password", (req: any, res, next) => {
    const current = str(req.body?.currentPassword, 256),
      newPassword = str(req.body?.newPassword, 256);
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
    const bootstrap = join(dataDir, "initial-admin-password");
    if (existsSync(bootstrap)) unlinkSync(bootstrap);
    res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });
  app.use("/api", (_req, _res, next) => next(fail(404, "İşlem bulunamadı.")));
  if (options.staticDir) {
    const dir = resolve(options.staticDir);
    app.use(express.static(dir));
    app.get("/{*path}", (_req, res) => res.sendFile(join(dir, "index.html")));
  }
  app.use((err: any, _req: any, res: any, _next: any) => {
    if (res.headersSent) return;
    if (
      err.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      String(err.message).includes("UNIQUE constraint")
    )
      return res
        .status(409)
        .json({ error: "Bu bağlantı adı zaten kullanılıyor." });
    if (err.code === "LIMIT_FILE_SIZE")
      return res.status(413).json({ error: "Görsel en fazla 8 MB olabilir." });
    const status =
      Number(err.status) || (err instanceof multer.MulterError ? 400 : 500);
    if (status >= 500) console.error("Server request failed:", err.name);
    res
      .status(status)
      .json({
        error:
          status >= 500
            ? "İşlem tamamlanamadı. Lütfen tekrar deneyin."
            : err.message || "Geçersiz istek.",
      });
  });
  return app;
}
