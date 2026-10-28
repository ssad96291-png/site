import type { Express, Request, Response, NextFunction } from "express";
import { DatabaseSync } from "node:sqlite";
import {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { mkdirSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { join } from "node:path";
import multer from "multer";

export const portalStages = [
  "received",
  "assigned",
  "surveyed",
  "production",
  "installation",
  "completed",
] as const;
export const portalStageLabels: Record<string, string> = {
  received: "Talebiniz alındı",
  assigned: "Bayi / keşif atandı",
  surveyed: "Keşif tamamlandı",
  production: "Üretimde",
  installation: "Montaj bekliyor",
  completed: "Tamamlandı",
};
type Actor = {
  id: string;
  username: string;
  role: "admin" | "manager" | "editor" | "dealer";
  dealerId?: string;
  region?: string;
};
type DeliveryResult = {
  status: "sent" | "waiting_configuration" | "failed";
  error?: string;
};
interface PortalOptions {
  app: Express;
  db: DatabaseSync;
  dataDir: string;
  production: boolean;
  readAdmin: (req: any) => string | undefined;
  audit?: (actor: string, action: string, target: string) => void;
  deliver?: (job: {
    id: string;
    channel: string;
    payload: any;
  }) => Promise<DeliveryResult>;
  deliveryConfigured?: () => boolean;
}
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const text = (v: any, max = 5000) =>
  typeof v === "string" ? v.trim().slice(0, max) : "";
const error = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
const password = (v: any) =>
  typeof v === "string" && v.length <= 256 ? v : "";
const passwordHash = (value: string) => {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(value, salt, 64).toString("hex");
};
const verify = (value: string, stored: string) => {
  const [salt, digest] = (stored || "").split(":");
  const actual = scryptSync(value, salt || "unknown-account", 64);
  const expected = Buffer.from(digest || "00".repeat(64), "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const validPassword = (v: string) => v.length >= 12 && v.length <= 256;
const email = (v: any) => text(v, 254).toLowerCase();
const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const now = () => new Date().toISOString();
const canonical = (v: string) =>
  v
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
const asyncRoute =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };

export function installPortal(options: PortalOptions) {
  const { app, db, dataDir, production } = options;
  let disposed = false,
    dispatching = false;
  const audit = (actor: string, action: string, target: string) =>
    options.audit?.(actor, action, target);
  const privateDir = join(dataDir, "private-documents");
  mkdirSync(privateDir, { recursive: true, mode: 0o700 });
  db.exec(`CREATE TABLE IF NOT EXISTS portal_customers(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_sessions(token TEXT PRIMARY KEY,customerId TEXT NOT NULL,inquiryId TEXT,expires INTEGER NOT NULL,lastSeen INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_tokens(token TEXT PRIMARY KEY,customerId TEXT NOT NULL,inquiryId TEXT,purpose TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS portal_inquiries(inquiryId TEXT PRIMARY KEY,customerId TEXT,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_dealers(id TEXT PRIMARY KEY,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_documents(id TEXT PRIMARY KEY,inquiryId TEXT NOT NULL,filename TEXT NOT NULL,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_activity(id TEXT PRIMARY KEY,customerId TEXT NOT NULL,action TEXT NOT NULL,detail TEXT NOT NULL,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_notifications(id TEXT PRIMARY KEY,customerId TEXT,inquiryId TEXT,kind TEXT NOT NULL,title TEXT NOT NULL,message TEXT NOT NULL,readAt TEXT,createdAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_outbox(id TEXT PRIMARY KEY,customerId TEXT,inquiryId TEXT,channel TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL,error TEXT NOT NULL,attempts INTEGER NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_staff(id TEXT PRIMARY KEY,username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,data TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS portal_staff_sessions(token TEXT PRIMARY KEY,staffId TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE INDEX IF NOT EXISTS portal_customer_inquiry_idx ON portal_inquiries(customerId);
 CREATE INDEX IF NOT EXISTS portal_activity_customer_idx ON portal_activity(customerId,createdAt);
 CREATE INDEX IF NOT EXISTS portal_session_customer_idx ON portal_sessions(customerId);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,reset INTEGER NOT NULL);`);
  db.prepare(
    "UPDATE portal_outbox SET status='failed',error='Önceki gönderimin sonucu belirsiz; sağlayıcı kaydını kontrol edin.' WHERE status='processing'",
  ).run();
  const cookieName = production ? "__Host-kilinc_customer" : "kilinc_customer";
  const staffCookie = production ? "__Host-kilinc_staff" : "kilinc_staff";
  const cookieOptions = {
    httpOnly: true,
    secure: production,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 12 * 60 * 60 * 1000,
  };
  const readCookie = (req: any, name: string) =>
    String(req.headers.cookie || "")
      .split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith(name + "="))
      ?.slice(name.length + 1) || "";
  const consume = (scope: string, key: string, max = 12, minutes = 15) => {
    const time = Date.now();
    db.prepare("DELETE FROM portal_tokens WHERE expires<?").run(time);
    const id = "portal:" + scope + ":" + hash(key);
    db.prepare("DELETE FROM rate_limits WHERE reset<?").run(time);
    const old = db
      .prepare("SELECT count,reset FROM rate_limits WHERE key=?")
      .get(id) as any;
    const count = old && old.reset > time ? old.count + 1 : 1;
    db.prepare(
      "INSERT OR REPLACE INTO rate_limits(key,count,reset) VALUES(?,?,?)",
    ).run(
      id,
      count,
      old && old.reset > time ? old.reset : time + minutes * 60000,
    );
    return count <= max;
  };
  const customerRow = (id: string) =>
    db
      .prepare("SELECT id,email,password,data FROM portal_customers WHERE id=?")
      .get(id) as any;
  const customerData = (id: string) => {
    const row = customerRow(id);
    return row ? JSON.parse(row.data) : undefined;
  };
  const safeCustomer = (row: any): any => {
    if (!row) return undefined;
    const d = JSON.parse(row.data);
    return {
      id: row.id,
      name: d.name,
      email: row.email || d.contactEmail || "",
      phone: d.phone || "",
      address: d.address || "",
      customerType: d.customerType || "individual",
      status: d.status,
      pending: d.pending === true,
      createdAt: d.createdAt,
      lastLoginAt: d.lastLoginAt || null,
    };
  };
  const activity = (id: string, action: string, detail = "") => {
    db.prepare(
      "INSERT INTO portal_activity(id,customerId,action,detail,createdAt) VALUES(?,?,?,?,?)",
    ).run(randomUUID(), id, action, text(detail, 500), now());
    db.exec(
      "DELETE FROM portal_activity WHERE rowid NOT IN (SELECT rowid FROM portal_activity ORDER BY rowid DESC LIMIT 30000)",
    );
  };
  const customer = (req: any) => {
    const raw = readCookie(req, cookieName);
    if (!/^[a-f0-9]{64}$/.test(raw)) return undefined;
    const session = db
      .prepare("SELECT * FROM portal_sessions WHERE token=? AND expires>?")
      .get(hash(raw), Date.now()) as any;
    if (!session) return undefined;
    const row = customerRow(session.customerId);
    if (!row || JSON.parse(row.data).status !== "active") return undefined;
    db.prepare("UPDATE portal_sessions SET lastSeen=? WHERE token=?").run(
      Date.now(),
      hash(raw),
    );
    return {
      customer: safeCustomer(row),
      scoped: !!session.inquiryId,
      inquiryId: session.inquiryId || null,
      sessionHash: hash(raw),
    };
  };
  const requireCustomer = (req: any, _res: Response, next: NextFunction) => {
    const current = customer(req);
    if (!current)
      return next(
        error(401, "Devam etmek için müşteri hesabınıza giriş yapın."),
      );
    req.portalCustomer = current;
    next();
  };
  const issueSession = (
    res: Response,
    id: string,
    inquiryId: string | null = null,
  ) => {
    const raw = randomBytes(32).toString("hex");
    db.prepare("DELETE FROM portal_sessions WHERE expires<?").run(Date.now());
    db.prepare(
      "INSERT INTO portal_sessions(token,customerId,inquiryId,expires,lastSeen) VALUES(?,?,?,?,?)",
    ).run(
      hash(raw),
      id,
      inquiryId,
      Date.now() + cookieOptions.maxAge,
      Date.now(),
    );
    res.cookie(cookieName, raw, cookieOptions);
  };
  const revokeCustomer = (id: string) => {
    db.prepare("DELETE FROM portal_sessions WHERE customerId=?").run(id);
    db.prepare("UPDATE portal_tokens SET used=1 WHERE customerId=?").run(id);
  };
  const adminContext = (req: any): Actor | undefined => {
    const old = options.readAdmin(req);
    if (old) return { id: old, username: old, role: "admin" };
    const raw = readCookie(req, staffCookie);
    if (!/^[a-f0-9]{64}$/.test(raw)) return undefined;
    const row = db
      .prepare(
        "SELECT s.id,s.username,s.data FROM portal_staff s JOIN portal_staff_sessions ss ON ss.staffId=s.id WHERE ss.token=? AND ss.expires>?",
      )
      .get(hash(raw), Date.now()) as any;
    if (!row) return undefined;
    const info = JSON.parse(row.data);
    if (info.status !== "active") return undefined;
    return {
      id: row.id,
      username: row.username,
      role: info.role,
      dealerId: info.dealerId || "",
      region: info.region || "",
    };
  };
  const requireStaff = (req: any, _res: Response, next: NextFunction) => {
    const actor = adminContext(req);
    if (!actor) return next(error(401, "Yetkili hesabınızla giriş yapın."));
    req.portalActor = actor;
    req.admin = actor.username;
    next();
  };
  const onlyAdmin = (req: any, _res: Response, next: NextFunction) =>
    req.portalActor.role === "admin"
      ? next()
      : next(error(403, "Bu işlem için yönetici yetkisi gerekir."));
  const dealer = (id: string) => {
    const row = db
      .prepare("SELECT data FROM portal_dealers WHERE id=?")
      .get(id) as any;
    return row ? JSON.parse(row.data) : null;
  };
  const originalInquiry = (id: string) => {
    const row = db
      .prepare("SELECT data FROM inquiries WHERE id=?")
      .get(id) as any;
    return row ? JSON.parse(row.data) : undefined;
  };
  const initialState = (inq: any): any => ({
    inquiryId: inq.id,
    customerId: null,
    stage:
      inq.status === "closed"
        ? "completed"
        : inq.status === "contacted"
          ? "assigned"
          : "received",
    dealerId: "",
    technician: "",
    appointmentAt: "",
    customerMessage: "",
    timeline: [
      {
        id: randomUUID(),
        stage: "received",
        message: "Talebiniz sisteme kaydedildi.",
        createdAt: inq.createdAt,
      },
    ],
    messages: [],
  });
  const state = (id: string) => {
    const row = db
      .prepare("SELECT customerId,data FROM portal_inquiries WHERE inquiryId=?")
      .get(id) as any;
    if (row) return { ...JSON.parse(row.data), customerId: row.customerId };
    const inq = originalInquiry(id);
    return inq ? initialState(inq) : undefined;
  };
  const saveState = (s: any) =>
    db
      .prepare(
        "INSERT OR REPLACE INTO portal_inquiries(inquiryId,customerId,data) VALUES(?,?,?)",
      )
      .run(s.inquiryId, s.customerId || null, JSON.stringify(s));
  const allowed = (actor: Actor, inq: any, s: any) =>
    actor.role === "admin" ||
    (actor.role === "dealer" &&
      !!actor.dealerId &&
      s.dealerId === actor.dealerId) ||
    (actor.role === "manager" &&
      !!actor.region &&
      canonical(inq.district || "") === canonical(actor.region));
  const getOwned = (req: any, id: string) => {
    const s = state(id);
    const current = req.portalCustomer;
    if (
      !s ||
      s.customerId !== current.customer.id ||
      (current.scoped && current.inquiryId !== id)
    )
      throw error(404, "Talep bulunamadı.");
    const inq = originalInquiry(id);
    if (!inq) throw error(404, "Talep bulunamadı.");
    return { inq, s };
  };
  const getManaged = (req: any, id: string) => {
    const s = state(id),
      inq = originalInquiry(id);
    if (!s || !inq) throw error(404, "Talep bulunamadı.");
    if (!allowed(req.portalActor, inq, s))
      throw error(403, "Bu talebe erişim yetkiniz yok.");
    return { inq, s };
  };
  const documents = (id: string, admin = false) =>
    db
      .prepare(
        "SELECT id,data FROM portal_documents WHERE inquiryId=? ORDER BY rowid DESC",
      )
      .all(id)
      .map((r: any) => ({
        ...JSON.parse(r.data),
        downloadUrl: `/api/${admin ? "admin" : "customer"}/documents/${r.id}/download`,
      }));
  const customerInquiry = (inq: any, s: any) => ({
    id: inq.id,
    name: inq.name,
    message: inq.message,
    subject: inq.subject,
    product: inq.product,
    service: inq.service,
    district: inq.district,
    dimensions: inq.dimensions,
    status: inq.status,
    stage: s.stage,
    createdAt: inq.createdAt,
    updatedAt: inq.updatedAt || inq.createdAt,
    appointmentAt: s.appointmentAt,
    technician: s.technician,
    customerMessage: s.customerMessage,
    dealer: s.dealerId ? dealer(s.dealerId) : null,
    timeline: s.timeline || [],
    messages: s.messages || [],
    documents: documents(inq.id),
  });
  const managedInquiry = (inq: any, s: any) => ({
    ...inq,
    ...s,
    id: inq.id,
    dealer: s.dealerId ? dealer(s.dealerId) : null,
    documents: documents(inq.id, true),
  });
  const notify = (
    customerId: string | null,
    inquiryId: string | null,
    kind: string,
    title: string,
    message: string,
  ) => {
    const stamp = now();
    db.prepare(
      "INSERT INTO portal_notifications(id,customerId,inquiryId,kind,title,message,createdAt) VALUES(?,?,?,?,?,?,?)",
    ).run(
      randomUUID(),
      customerId,
      inquiryId,
      kind,
      text(title, 200),
      text(message, 1000),
      stamp,
    );
    if (customerId) {
      const row = customerRow(customerId);
      if (row) {
        const profile = safeCustomer(row);
        const preference = inquiryId
          ? originalInquiry(inquiryId)?.preferredContact
          : "";
        const channel =
          preference === "whatsapp" && profile.phone
            ? "whatsapp"
            : preference === "phone" && profile.phone
              ? "sms"
              : profile.email
                ? "email"
                : profile.phone
                  ? "sms"
                  : "";
        if (channel)
          db.prepare(
            "INSERT INTO portal_outbox(id,customerId,inquiryId,channel,payload,status,error,attempts,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)",
          ).run(
            randomUUID(),
            customerId,
            inquiryId,
            channel,
            JSON.stringify({
              name: profile.name,
              email: profile.email || "",
              phone: profile.phone || "",
              kind,
              title: text(title, 200),
              message: text(message, 1000),
              inquiryId,
            }),
            options.deliveryConfigured?.() ? "queued" : "waiting_configuration",
            "",
            0,
            stamp,
            stamp,
          );
      }
    }
    setImmediate(() => {
      void dispatchPending().catch(() => {});
    });
  };
  async function dispatchPending() {
    if (
      disposed ||
      dispatching ||
      !options.deliver ||
      !options.deliveryConfigured?.()
    )
      return;
    dispatching = true;
    try {
      const jobs = db
        .prepare(
          "SELECT * FROM portal_outbox WHERE status IN ('queued','waiting_configuration') ORDER BY rowid LIMIT 20",
        )
        .all() as any[];
      for (const job of jobs) {
        if (disposed) break;
        const locked = db
          .prepare(
            "UPDATE portal_outbox SET status='processing',updatedAt=? WHERE id=? AND status IN ('queued','waiting_configuration')",
          )
          .run(now(), job.id);
        if (!locked.changes) continue;
        let result: DeliveryResult;
        try {
          const payload = JSON.parse(job.payload);
          if (payload.kind === "tracking_invite") {
            let origin: URL;
            try {
              origin = new URL(process.env.PUBLIC_ORIGIN || "");
              if (
                origin.protocol !== "https:" ||
                origin.username ||
                origin.password
              )
                throw new Error();
            } catch {
              db.prepare(
                "UPDATE portal_outbox SET status='waiting_configuration',error=?,updatedAt=? WHERE id=?",
              ).run(
                "Takip bağlantısı için HTTPS PUBLIC_ORIGIN ayarlanmalı.",
                now(),
                job.id,
              );
              continue;
            }
            const current = state(job.inquiryId);
            if (!current || current.customerId !== job.customerId)
              throw new Error("invitation-owner-changed");
            const invitation = randomBytes(32).toString("hex");
            db.prepare(
              "INSERT INTO portal_tokens(token,customerId,inquiryId,purpose,expires) VALUES(?,?,?,?,?)",
            ).run(
              hash(invitation),
              job.customerId,
              job.inquiryId,
              "claim",
              Date.now() + 48 * 60 * 60 * 1000,
            );
            payload.trackingUrl =
              origin.origin + "/hesabim#claim=" + invitation;
          }
          result = await options.deliver({
            id: job.id,
            channel: job.channel,
            payload,
          });
        } catch {
          result = {
            status: "failed",
            error: "Bildirim sağlayıcısına ulaşılamadı.",
          };
        }
        if (disposed) break;
        db.prepare(
          "UPDATE portal_outbox SET status=?,error=?,attempts=attempts+1,updatedAt=? WHERE id=?",
        ).run(result.status, text(result.error, 200), now(), job.id);
      }
    } finally {
      dispatching = false;
      if (
        !disposed &&
        options.deliveryConfigured?.() &&
        db
          .prepare("SELECT id FROM portal_outbox WHERE status='queued' LIMIT 1")
          .get()
      ) {
        setImmediate(() => {
          void dispatchPending().catch(() => {});
        });
      }
    }
  }
  setImmediate(() => {
    void dispatchPending().catch(() => {});
  });
  const attachScoped = (req: any, newId: string) => {
    const current = customer(req);
    if (current?.scoped) {
      const s = state(current.inquiryId);
      if (s && s.customerId === current.customer.id) {
        s.customerId = newId;
        saveState(s);
        db.prepare(
          "UPDATE portal_notifications SET customerId=? WHERE customerId=? AND inquiryId=?",
        ).run(newId, current.customer.id, current.inquiryId);
        db.prepare("DELETE FROM portal_sessions WHERE token=?").run(
          current.sessionHash,
        );
        activity(newId, "claim", "Yeni talep hesabınıza bağlandı.");
      }
    }
  };
  const claim = (req: any, res: Response, token: string) => {
    const hashed = hash(token);
    const row = db
      .prepare(
        "SELECT * FROM portal_tokens WHERE token=? AND purpose='claim' AND used=0 AND expires>?",
      )
      .get(hashed, Date.now()) as any;
    if (!row) throw error(400, "Takip bağlantısı geçersiz veya süresi dolmuş.");
    const profile = customerData(row.customerId);
    if (
      !profile ||
      profile.status !== "active" ||
      !originalInquiry(row.inquiryId) ||
      state(row.inquiryId)?.customerId !== row.customerId
    )
      throw error(400, "Takip bağlantısı kullanılamıyor.");
    const changed = db
      .prepare("UPDATE portal_tokens SET used=1 WHERE token=? AND used=0")
      .run(hashed);
    if (!changed.changes) throw error(400, "Bu takip bağlantısı kullanılmış.");
    const signed = customer(req);
    if (signed && !signed.scoped) {
      const s = state(row.inquiryId);
      s.customerId = signed.customer.id;
      saveState(s);
      issueSession(res, signed.customer.id);
      activity(signed.customer.id, "claim", "Yeni talep bağlandı.");
      return { customer: signed.customer, scoped: false };
    }
    issueSession(res, row.customerId, row.inquiryId);
    activity(
      row.customerId,
      "claim",
      "Tek talep için takip bağlantısı açıldı.",
    );
    return {
      customer: safeCustomer(customerRow(row.customerId)),
      scoped: true,
    };
  };
  const onInquiryCreated = (req: any, _res: Response, inq: any) => {
    const signed = customer(req);
    let id: string;
    if (signed && !signed.scoped) id = signed.customer.id;
    else {
      id = randomUUID();
      const profile = {
        id,
        name: inq.name,
        phone: inq.phone || "",
        contactEmail: inq.email || "",
        address: "",
        customerType: "individual",
        status: "active",
        pending: true,
        createdAt: now(),
        lastLoginAt: null,
      };
      db.prepare(
        "INSERT INTO portal_customers(id,email,password,data) VALUES(?,NULL,NULL,?)",
      ).run(id, JSON.stringify(profile));
    }
    const s = initialState(inq);
    s.customerId = id;
    const region = canonical(inq.district || "");
    if (region) {
      const routes = db
        .prepare("SELECT data FROM portal_dealers")
        .all()
        .map((r: any) => JSON.parse(r.data))
        .filter(
          (d: any) =>
            d.active &&
            Array.isArray(d.regions) &&
            d.regions.some((r: string) => canonical(r) === region),
        );
      if (routes.length === 1) {
        s.dealerId = routes[0].id;
        s.stage = "assigned";
        s.timeline.push({
          id: randomUUID(),
          stage: "assigned",
          message: "Bölgenizdeki ekip talebinize atandı.",
          createdAt: now(),
        });
      }
    }
    saveState(s);
    notify(
      null,
      inq.id,
      "lead",
      "Yeni talep",
      `${inq.name} yeni bir talep gönderdi.`,
    );
    if (signed && !signed.scoped) {
      notify(
        id,
        inq.id,
        "received",
        "Talebiniz alındı",
        "Talebiniz hesabınıza kaydedildi.",
      );
      return { trackingUrl: "/hesabim" };
    }
    const token = randomBytes(32).toString("hex");
    db.prepare(
      "INSERT INTO portal_tokens(token,customerId,inquiryId,purpose,expires) VALUES(?,?,?,?,?)",
    ).run(hash(token), id, inq.id, "claim", Date.now() + 48 * 60 * 60 * 1000);
    notify(
      id,
      inq.id,
      "tracking_invite",
      "Talebinizi takip edin",
      "Talebiniz alındı. Güvenli takip bağlantınızla sürecinizi görüntüleyebilirsiniz.",
    );
    return { trackingToken: token, trackingUrl: "/hesabim#claim=" + token };
  };

  app.post("/api/customer/register", (req, res, next) => {
    try {
      if (!consume("register", req.ip || "", 6, 60))
        throw error(
          429,
          "Çok fazla kayıt denemesi. Daha sonra tekrar deneyin.",
        );
      const name = text(req.body?.name, 100),
        mail = email(req.body?.email),
        pass = password(req.body?.password);
      if (name.length < 2 || !validEmail(mail) || !validPassword(pass))
        throw error(
          400,
          "Adınızı, e-postanızı ve en az 12 karakter parolanızı kontrol edin.",
        );
      if (db.prepare("SELECT id FROM portal_customers WHERE email=?").get(mail))
        throw error(
          409,
          "Bu bilgilerle hesap oluşturulamıyor. Giriş yapmayı deneyin.",
        );
      const id = randomUUID();
      const data = {
        id,
        name,
        email: mail,
        phone: text(req.body?.phone, 50),
        address: "",
        customerType: "individual",
        status: "active",
        pending: false,
        createdAt: now(),
        lastLoginAt: now(),
      };
      db.prepare(
        "INSERT INTO portal_customers(id,email,password,data) VALUES(?,?,?,?)",
      ).run(id, mail, passwordHash(pass), JSON.stringify(data));
      attachScoped(req, id);
      issueSession(res, id);
      activity(id, "register", "Hesap oluşturuldu.");
      notify(
        id,
        null,
        "welcome",
        "Hesabınız hazır",
        "Taleplerinizi ve belgelerinizi bu panelden takip edebilirsiniz.",
      );
      res.status(201).json({ customer: data, scoped: false });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/customer/login", (req, res, next) => {
    try {
      const mail = email(req.body?.email);
      if (
        !consume("login-ip", req.ip || "", 12) ||
        !consume("login-email", mail, 20)
      )
        throw error(
          429,
          "Çok fazla giriş denemesi. Daha sonra tekrar deneyin.",
        );
      const row = db
        .prepare(
          "SELECT id,email,password,data FROM portal_customers WHERE email=?",
        )
        .get(mail) as any;
      const okay = verify(password(req.body?.password), row?.password || "");
      if (!row || !okay || JSON.parse(row.data).status !== "active")
        throw error(
          401,
          "E-posta veya parola hatalı ya da hesap kullanılamıyor.",
        );
      attachScoped(req, row.id);
      const data = { ...JSON.parse(row.data), lastLoginAt: now() };
      db.prepare("UPDATE portal_customers SET data=? WHERE id=?").run(
        JSON.stringify(data),
        row.id,
      );
      issueSession(res, row.id);
      activity(row.id, "login", "Hesaba giriş yapıldı.");
      res.json({ customer: { ...data, email: row.email }, scoped: false });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/customer/claim", (req, res, next) => {
    try {
      if (!consume("claim", req.ip || "", 20))
        throw error(429, "Çok fazla bağlantı denemesi.");
      const token = text(req.body?.token, 256);
      if (!/^[a-f0-9]{64}$/.test(token))
        throw error(400, "Geçersiz takip bağlantısı.");
      res.json(claim(req, res, token));
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/customer/reset", (req, res, next) => {
    try {
      if (!consume("reset", req.ip || "", 10))
        throw error(429, "Çok fazla deneme.");
      const token = text(req.body?.token, 256),
        pass = password(req.body?.newPassword ?? req.body?.password);
      if (!validPassword(pass))
        throw error(400, "Yeni parola en az 12 karakter olmalıdır.");
      const row = db
        .prepare(
          "SELECT * FROM portal_tokens WHERE token=? AND purpose='reset' AND used=0 AND expires>?",
        )
        .get(hash(token), Date.now()) as any;
      if (!row)
        throw error(400, "Kurtarma bağlantısı geçersiz veya süresi dolmuş.");
      const profile = customerData(row.customerId);
      if (!profile || profile.pending || profile.status !== "active")
        throw error(400, "Hesap kurtarılamıyor.");
      db.prepare("UPDATE portal_customers SET password=? WHERE id=?").run(
        passwordHash(pass),
        row.customerId,
      );
      revokeCustomer(row.customerId);
      activity(
        row.customerId,
        "password-reset",
        "Parola güvenli kurtarma bağlantısıyla yenilendi.",
      );
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/customer/logout", (req, res) => {
    const raw = readCookie(req, cookieName);
    db.prepare("DELETE FROM portal_sessions WHERE token=?").run(hash(raw));
    res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });
  app.get("/api/customer/me", requireCustomer, (req: any, res) =>
    res.json({
      customer: req.portalCustomer.customer,
      scoped: req.portalCustomer.scoped,
    }),
  );
  app.put("/api/customer/profile", requireCustomer, (req: any, res, next) => {
    try {
      if (req.portalCustomer.scoped)
        throw error(403, "Profil düzenlemek için hesap oluşturun.");
      const row = customerRow(req.portalCustomer.customer.id),
        old = JSON.parse(row.data);
      const name = text(req.body?.name ?? old.name, 100);
      if (name.length < 2) throw error(400, "Adınızı kontrol edin.");
      const type = req.body?.customerType ?? old.customerType;
      if (!["individual", "architect", "corporate"].includes(type))
        throw error(400, "Geçerli müşteri türü seçin.");
      const data = {
        ...old,
        name,
        phone: text(req.body?.phone ?? old.phone, 50),
        address: text(req.body?.address ?? old.address, 1000),
        customerType: type,
      };
      db.prepare("UPDATE portal_customers SET data=? WHERE id=?").run(
        JSON.stringify(data),
        row.id,
      );
      activity(row.id, "profile", "Profil güncellendi.");
      res.json({ customer: { ...data, email: row.email } });
    } catch (e) {
      next(e);
    }
  });
  app.put("/api/customer/password", requireCustomer, (req: any, res, next) => {
    try {
      if (req.portalCustomer.scoped) throw error(403, "Önce hesap oluşturun.");
      const row = customerRow(req.portalCustomer.customer.id),
        pass = password(req.body?.newPassword);
      if (
        !validPassword(pass) ||
        !verify(password(req.body?.currentPassword), row.password)
      )
        throw error(
          400,
          "Mevcut parolanızı ve en az 12 karakter yeni parolanızı kontrol edin.",
        );
      db.prepare("UPDATE portal_customers SET password=? WHERE id=?").run(
        passwordHash(pass),
        row.id,
      );
      revokeCustomer(row.id);
      res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
      activity(
        row.id,
        "password-change",
        "Parola değiştirildi ve diğer oturumlar kapatıldı.",
      );
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/customer/inquiries", requireCustomer, (req: any, res) => {
    const current = req.portalCustomer;
    const rows = db
      .prepare(
        "SELECT inquiryId FROM portal_inquiries WHERE customerId=? ORDER BY rowid DESC",
      )
      .all(current.customer.id) as any[];
    res.json({
      inquiries: rows
        .filter((r) => !current.scoped || current.inquiryId === r.inquiryId)
        .map((r) => {
          const inq = originalInquiry(r.inquiryId);
          return inq ? customerInquiry(inq, state(r.inquiryId)) : null;
        })
        .filter(Boolean),
    });
  });
  app.get(
    "/api/customer/inquiries/:id",
    requireCustomer,
    (req: any, res, next) => {
      try {
        const { inq, s } = getOwned(req, String(req.params.id));
        activity(
          req.portalCustomer.customer.id,
          "view",
          `Talep ${inq.id.slice(0, 8)} görüntülendi.`,
        );
        res.json({ inquiry: customerInquiry(inq, s) });
      } catch (e) {
        next(e);
      }
    },
  );
  app.post(
    "/api/customer/inquiries/:id/messages",
    requireCustomer,
    (req: any, res, next) => {
      try {
        const { inq, s } = getOwned(req, String(req.params.id));
        if (
          !consume("customer-message", req.portalCustomer.customer.id, 30, 60)
        )
          throw error(429, "Çok fazla mesaj.");
        const message = text(req.body?.message, 5000),
          kind = text(req.body?.kind, 30) || "support";
        if (
          message.length < 3 ||
          !["support", "revision", "appointment"].includes(kind)
        )
          throw error(400, "Geçerli mesaj ve talep türü girin.");
        s.messages.push({
          id: randomUUID(),
          kind,
          message,
          author: "customer",
          createdAt: now(),
        });
        saveState(s);
        notify(null, inq.id, kind, "Müşteriden yeni mesaj", message);
        activity(
          req.portalCustomer.customer.id,
          "message",
          "Destek / revize mesajı gönderildi.",
        );
        res.status(201).json({ inquiry: customerInquiry(inq, s) });
      } catch (e) {
        next(e);
      }
    },
  );
  app.get("/api/customer/notifications", requireCustomer, (req: any, res) => {
    const c = req.portalCustomer;
    const rows = db
      .prepare(
        "SELECT * FROM portal_notifications WHERE customerId=? ORDER BY rowid DESC LIMIT 100",
      )
      .all(c.customer.id) as any[];
    res.json({
      notifications: rows.filter(
        (n) => !c.scoped || n.inquiryId === c.inquiryId,
      ),
    });
  });
  app.post(
    "/api/customer/notifications/:id/read",
    requireCustomer,
    (req: any, res, next) => {
      const c = req.portalCustomer;
      const row = db
        .prepare(
          "SELECT * FROM portal_notifications WHERE id=? AND customerId=?",
        )
        .get(req.params.id, c.customer.id) as any;
      if (!row || (c.scoped && row.inquiryId !== c.inquiryId))
        return next(error(404, "Bildirim bulunamadı."));
      db.prepare("UPDATE portal_notifications SET readAt=? WHERE id=?").run(
        now(),
        row.id,
      );
      res.json({ ok: true });
    },
  );
  const downloadDocument =
    (admin: boolean) => (req: any, res: Response, next: NextFunction) => {
      try {
        const row = db
          .prepare("SELECT * FROM portal_documents WHERE id=?")
          .get(req.params.id) as any;
        if (!row) throw error(404, "Belge bulunamadı.");
        if (admin) getManaged(req, row.inquiryId);
        else getOwned(req, row.inquiryId);
        const data = JSON.parse(row.data);
        const file = join(privateDir, row.filename);
        if (!existsSync(file)) throw error(404, "Belge dosyası bulunamadı.");
        res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("X-Content-Type-Options", "nosniff");
        if (!admin)
          activity(
            req.portalCustomer.customer.id,
            "download",
            `${data.kind}: ${data.name}`,
          );
        res.download(file, data.name);
      } catch (e) {
        next(e);
      }
    };
  app.get(
    "/api/customer/documents/:id/download",
    requireCustomer,
    downloadDocument(false),
  );

  app.post("/api/staff/login", (req, res, next) => {
    try {
      const username = text(req.body?.username, 100);
      if (
        !consume("staff-login", req.ip || "", 10) ||
        !consume("staff-account", username, 20)
      )
        throw error(429, "Çok fazla giriş denemesi.");
      const row = db
        .prepare("SELECT * FROM portal_staff WHERE username=?")
        .get(username) as any;
      const okay = verify(password(req.body?.password), row?.password || "");
      if (!row || !okay) throw error(401, "Kullanıcı adı veya parola hatalı.");
      const data = JSON.parse(row.data);
      if (data.status !== "active") throw error(401, "Hesap kullanılamıyor.");
      data.lastLoginAt = now();
      db.prepare("UPDATE portal_staff SET data=? WHERE id=?").run(
        JSON.stringify(data),
        row.id,
      );
      const raw = randomBytes(32).toString("hex");
      db.prepare(
        "INSERT INTO portal_staff_sessions(token,staffId,expires) VALUES(?,?,?)",
      ).run(hash(raw), row.id, Date.now() + cookieOptions.maxAge);
      res.cookie(staffCookie, raw, cookieOptions);
      const legacyName = production
        ? "__Host-kilinc_session"
        : "kilinc_session";
      db.prepare("DELETE FROM sessions WHERE token=?").run(
        hash(readCookie(req, legacyName)),
      );
      res.clearCookie(legacyName, { ...cookieOptions, maxAge: undefined });
      audit(username, "STAFF_LOGIN", row.id);
      res.json({
        user: {
          username: row.username,
          role: data.role,
          dealerId: data.dealerId,
          region: data.region,
        },
      });
    } catch (e) {
      next(e);
    }
  });
  app.put("/api/staff/password", requireStaff, (req: any, res, next) => {
    try {
      const row = db
        .prepare("SELECT * FROM portal_staff WHERE id=?")
        .get(req.portalActor.id) as any;
      if (!row)
        throw error(403, "Bu hesap için yönetici güvenlik bölümünü kullanın.");
      const pass = password(req.body?.newPassword);
      if (
        !validPassword(pass) ||
        !verify(password(req.body?.currentPassword), row.password)
      )
        throw error(
          400,
          "Mevcut parolanızı ve en az 12 karakter yeni parolanızı kontrol edin.",
        );
      db.prepare("UPDATE portal_staff SET password=? WHERE id=?").run(
        passwordHash(pass),
        row.id,
      );
      db.prepare("DELETE FROM portal_staff_sessions WHERE staffId=?").run(
        row.id,
      );
      res.clearCookie(staffCookie, { ...cookieOptions, maxAge: undefined });
      audit(req.portalActor.username, "STAFF_PASSWORD", row.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/staff/me", requireStaff, (req: any, res) =>
    res.json({ user: req.portalActor }),
  );
  app.post("/api/staff/logout", (req, res) => {
    db.prepare("DELETE FROM portal_staff_sessions WHERE token=?").run(
      hash(readCookie(req, staffCookie)),
    );
    res.clearCookie(staffCookie, { ...cookieOptions, maxAge: undefined });
    res.json({ ok: true });
  });
  const prefixes = [
    "customers",
    "pipeline",
    "dealers",
    "notifications",
    "outbox",
    "staff",
  ];
  for (const prefix of prefixes)
    app.use(
      "/api/admin/" + prefix,
      requireStaff,
      (req: any, _res: Response, next: NextFunction) => {
        if (req.portalActor.role === "editor")
          return next(
            error(403, "İçerik editörü müşteri operasyonlarına erişemez."),
          );
        next();
      },
    );
  const allManaged = (req: any) =>
    db
      .prepare("SELECT data FROM inquiries ORDER BY rowid DESC")
      .all()
      .map((r: any) => JSON.parse(r.data))
      .filter((inq: any) => allowed(req.portalActor, inq, state(inq.id)))
      .map((inq: any) => managedInquiry(inq, state(inq.id)));
  const canSeeCustomer = (req: any, id: string) =>
    req.portalActor.role === "admin" ||
    allManaged(req).some((i: any) => i.customerId === id);
  app.get("/api/admin/customers", (req: any, res) => {
    const managed = allManaged(req);
    const ids = new Set(managed.map((i: any) => i.customerId));
    const rows = db
      .prepare("SELECT id,email,data FROM portal_customers ORDER BY rowid DESC")
      .all() as any[];
    res.json({
      customers: rows
        .filter((row) => req.portalActor.role === "admin" || ids.has(row.id))
        .map((row) => {
          const data = safeCustomer(row),
            inquiries = managed.filter((i: any) => i.customerId === row.id);
          const online = !!db
            .prepare(
              "SELECT token FROM portal_sessions WHERE customerId=? AND expires>? AND lastSeen>? LIMIT 1",
            )
            .get(row.id, Date.now(), Date.now() - 90000);
          return {
            ...data,
            inquiryCount: inquiries.length,
            activeInquiryCount: inquiries.filter(
              (i: any) => i.stage !== "completed",
            ).length,
            online,
          };
        }),
    });
  });
  app.get(
    "/api/admin/customers/:id/activity",
    onlyAdmin,
    (req: any, res, next) => {
      if (!canSeeCustomer(req, String(req.params.id)))
        return next(error(403, "Bu müşteriye erişim yetkiniz yok."));
      res.json({
        events: db
          .prepare(
            "SELECT id,action,detail,createdAt FROM portal_activity WHERE customerId=? ORDER BY rowid DESC LIMIT 200",
          )
          .all(req.params.id),
      });
    },
  );
  app.patch("/api/admin/customers/:id", onlyAdmin, (req: any, res, next) => {
    try {
      const row = customerRow(req.params.id);
      if (!row) throw error(404, "Müşteri bulunamadı.");
      const old = JSON.parse(row.data),
        data = { ...old };
      for (const key of ["name", "phone", "address"])
        if (req.body?.[key] !== undefined)
          data[key] = text(req.body[key], key === "address" ? 1000 : 100);
      if (data.name.length < 2) throw error(400, "Geçerli ad girin.");
      if (req.body?.customerType !== undefined) {
        if (
          !["individual", "architect", "corporate"].includes(
            req.body.customerType,
          )
        )
          throw error(400, "Geçerli müşteri türü seçin.");
        data.customerType = req.body.customerType;
      }
      if (req.body?.status !== undefined) {
        if (!["active", "suspended"].includes(req.body.status))
          throw error(400, "Geçerli hesap durumu seçin.");
        data.status = req.body.status;
      }
      let mail = row.email;
      if (req.body?.email !== undefined && !old.pending) {
        mail = email(req.body.email);
        if (!validEmail(mail)) throw error(400, "Geçerli e-posta girin.");
        const conflict = db
          .prepare("SELECT id FROM portal_customers WHERE email=? AND id<>?")
          .get(mail, row.id);
        if (conflict)
          throw error(409, "Bu e-posta başka hesapta kullanılıyor.");
        data.email = mail;
      }
      db.prepare("UPDATE portal_customers SET email=?,data=? WHERE id=?").run(
        mail,
        JSON.stringify(data),
        row.id,
      );
      if (data.status === "suspended" || mail !== row.email)
        revokeCustomer(row.id);
      audit(req.portalActor.username, "CUSTOMER_UPDATE", row.id);
      activity(
        row.id,
        "admin-update",
        "Hesap bilgileri yönetici tarafından güncellendi.",
      );
      res.json({
        customer: { ...data, email: mail || data.contactEmail || "" },
      });
    } catch (e) {
      next(e);
    }
  });
  app.post(
    "/api/admin/customers/:id/revoke",
    onlyAdmin,
    (req: any, res, next) => {
      if (!customerRow(req.params.id))
        return next(error(404, "Müşteri bulunamadı."));
      revokeCustomer(req.params.id);
      audit(req.portalActor.username, "CUSTOMER_REVOKE", req.params.id);
      res.json({ ok: true });
    },
  );
  app.post(
    "/api/admin/customers/:id/recovery",
    onlyAdmin,
    (req: any, res, next) => {
      try {
        const profile = customerData(req.params.id);
        if (!profile || profile.status !== "active")
          throw error(
            400,
            "Yalnızca aktif hesap için bağlantı oluşturulabilir.",
          );
        const token = randomBytes(32).toString("hex"),
          expires = Date.now() + 15 * 60000;
        if (profile.pending) {
          const owned = db
            .prepare(
              "SELECT inquiryId FROM portal_inquiries WHERE customerId=?",
            )
            .all(profile.id) as any[];
          if (owned.length !== 1 || !originalInquiry(owned[0].inquiryId))
            throw error(400, "Tek talep takip bağlantısı oluşturulamıyor.");
          db.prepare(
            "UPDATE portal_tokens SET used=1 WHERE customerId=? AND purpose='claim'",
          ).run(profile.id);
          db.prepare(
            "INSERT INTO portal_tokens(token,customerId,inquiryId,purpose,expires) VALUES(?,?,?,?,?)",
          ).run(hash(token), profile.id, owned[0].inquiryId, "claim", expires);
          audit(
            req.portalActor.username,
            "CUSTOMER_TRACKING_RECOVERY",
            profile.id,
          );
          return res.json({
            url: "/hesabim#claim=" + token,
            expiresAt: new Date(expires).toISOString(),
          });
        }
        db.prepare(
          "UPDATE portal_tokens SET used=1 WHERE customerId=? AND purpose='reset'",
        ).run(profile.id);
        db.prepare(
          "INSERT INTO portal_tokens(token,customerId,purpose,expires) VALUES(?,?,?,?)",
        ).run(hash(token), profile.id, "reset", expires);
        audit(req.portalActor.username, "CUSTOMER_RECOVERY", profile.id);
        res.json({
          url: "/hesabim#reset=" + token,
          expiresAt: new Date(expires).toISOString(),
        });
      } catch (e) {
        next(e);
      }
    },
  );
  app.get("/api/admin/pipeline", (req: any, res) =>
    res.json({ inquiries: allManaged(req), stages: portalStages }),
  );
  app.patch("/api/admin/pipeline/:id", (req: any, res, next) => {
    try {
      const { inq, s } = getManaged(req, String(req.params.id));
      const input = req.body || {};
      if (input.stage !== undefined && !portalStages.includes(input.stage))
        throw error(400, "Geçerli süreç aşaması seçin.");
      if (
        input.priority !== undefined &&
        !["normal", "high"].includes(input.priority)
      )
        throw error(400, "Geçerli öncelik seçin.");
      if (input.dealerId !== undefined) {
        if (req.portalActor.role === "dealer")
          throw error(403, "Bayi atamasını yalnızca yönetici yapabilir.");
        const id = text(input.dealerId, 100);
        if (id) {
          const assigned = dealer(id);
          if (!assigned || !assigned.active)
            throw error(400, "Aktif bayi seçin.");
          if (
            req.portalActor.role === "manager" &&
            !assigned.regions.some(
              (r: string) =>
                canonical(r) === canonical(req.portalActor.region || ""),
            )
          )
            throw error(403, "Bu bayi bölgenizde değil.");
        }
        s.dealerId = id;
      }
      if (input.appointmentAt !== undefined) {
        const date = text(input.appointmentAt, 40);
        if (
          date &&
          (!Number.isFinite(Date.parse(date)) || !/^[0-9T:.+Z-]+$/.test(date))
        )
          throw error(400, "Geçerli keşif tarihi girin.");
        s.appointmentAt = date;
      }
      if (input.technician !== undefined)
        s.technician = text(input.technician, 200);
      if (input.customerMessage !== undefined)
        s.customerMessage = text(input.customerMessage, 2000);
      if (input.notes !== undefined) inq.notes = text(input.notes, 10000);
      if (input.priority !== undefined) inq.priority = input.priority;
      const changed = input.stage && input.stage !== s.stage;
      if (changed) {
        s.stage = input.stage;
        s.timeline.push({
          id: randomUUID(),
          stage: s.stage,
          message: s.customerMessage || portalStageLabels[s.stage],
          createdAt: now(),
        });
        inq.status =
          s.stage === "completed"
            ? "closed"
            : s.stage === "received"
              ? "new"
              : "contacted";
        notify(
          s.customerId,
          inq.id,
          "stage",
          "Talebiniz güncellendi",
          s.customerMessage || portalStageLabels[s.stage],
        );
      } else if (
        input.customerMessage !== undefined ||
        input.appointmentAt !== undefined
      )
        notify(
          s.customerId,
          inq.id,
          "update",
          "Talebiniz hakkında yeni bilgi",
          s.customerMessage || "Randevu / ekip bilgileriniz güncellendi.",
        );
      inq.updatedAt = now();
      db.prepare("UPDATE inquiries SET data=? WHERE id=?").run(
        JSON.stringify(inq),
        inq.id,
      );
      saveState(s);
      audit(req.portalActor.username, "PIPELINE_UPDATE", inq.id);
      res.json({ inquiry: managedInquiry(inq, s) });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/admin/pipeline/:id/messages", (req: any, res, next) => {
    try {
      const { inq, s } = getManaged(req, String(req.params.id));
      const message = text(req.body?.message, 5000),
        kind = text(req.body?.kind, 30) || "support";
      if (
        message.length < 3 ||
        !["support", "revision", "appointment"].includes(kind)
      )
        throw error(400, "Geçerli mesaj girin.");
      s.messages.push({
        id: randomUUID(),
        kind,
        message,
        author: "team",
        createdAt: now(),
      });
      saveState(s);
      notify(
        s.customerId,
        inq.id,
        "message",
        "Ekibinizden yeni mesaj",
        message,
      );
      audit(req.portalActor.username, "CUSTOMER_MESSAGE", inq.id);
      res.status(201).json({ inquiry: managedInquiry(inq, s) });
    } catch (e) {
      next(e);
    }
  });
  const documentUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 0, parts: 1 },
  });
  app.post(
    "/api/admin/pipeline/:id/documents",
    (req: any, _res, next) => {
      try {
        getManaged(req, String(req.params.id));
        if (!consume("document-upload", req.portalActor.id, 20, 60))
          throw error(429, "Çok fazla belge yükleme denemesi.");
        next();
      } catch (e) {
        next(e);
      }
    },
    documentUpload.single("document"),
    (req: any, res, next) => {
      try {
        const { inq, s } = getManaged(req, String(req.params.id));
        const file = req.file;
        if (!file) throw error(400, "Bir PDF dosyası seçin.");
        const bytes = file.buffer as Buffer;
        if (
          bytes.length < 12 ||
          bytes.subarray(0, 5).toString() !== "%PDF-" ||
          !bytes.subarray(-2048).includes(Buffer.from("%%EOF"))
        )
          throw error(400, "Geçerli bir PDF dosyası yükleyin.");
        if (
          /\/(JavaScript|JS|Launch|EmbeddedFile|OpenAction)\b/i.test(
            bytes
              .toString("latin1")
              .replace(/#([0-9a-f]{2})/gi, (_all: string, code: string) =>
                String.fromCharCode(parseInt(code, 16)),
              ),
          )
        )
          throw error(400, "Etkin içerik içeren PDF kabul edilmedi.");
        const kind = text(req.query.kind, 30) || "quote";
        if (!["quote", "survey", "warranty", "project"].includes(kind))
          throw error(400, "Geçerli belge türü seçin.");
        const sourceName = text(file.originalname, 160)
          .split(/[\\/]/)
          .at(-1)!
          .replace(/[\u0000-\u001f\u007f]/g, "");
        let name = text(req.query.title, 120) || sourceName || "Belge.pdf";
        if (!name.toLowerCase().endsWith(".pdf")) name += ".pdf";
        name = name.replace(/[\\/\u0000-\u001f\u007f]/g, "-");
        const id = randomUUID(),
          filename = id + ".pdf";
        writeFileSync(join(privateDir, filename), bytes, {
          mode: 0o600,
          flag: "wx",
        });
        const data = {
          id,
          inquiryId: inq.id,
          name,
          kind,
          size: bytes.length,
          createdAt: now(),
        };
        try {
          db.prepare(
            "INSERT INTO portal_documents(id,inquiryId,filename,data) VALUES(?,?,?,?)",
          ).run(id, inq.id, filename, JSON.stringify(data));
        } catch (e) {
          unlinkSync(join(privateDir, filename));
          throw e;
        }
        notify(s.customerId, inq.id, "document", "Yeni belgeniz hazır", name);
        audit(req.portalActor.username, "DOCUMENT_UPLOAD", id);
        res.status(201).json({
          document: {
            ...data,
            downloadUrl: "/api/admin/documents/" + id + "/download",
          },
        });
      } catch (e) {
        next(e);
      }
    },
  );
  app.get(
    "/api/admin/documents/:id/download",
    requireStaff,
    downloadDocument(true),
  );
  app.delete(
    "/api/admin/documents/:id",
    requireStaff,
    (req: any, res, next) => {
      try {
        const row = db
          .prepare("SELECT * FROM portal_documents WHERE id=?")
          .get(req.params.id) as any;
        if (!row) throw error(404, "Belge bulunamadı.");
        getManaged(req, row.inquiryId);
        db.prepare("DELETE FROM portal_documents WHERE id=?").run(row.id);
        const file = join(privateDir, row.filename);
        if (existsSync(file)) unlinkSync(file);
        audit(req.portalActor.username, "DOCUMENT_DELETE", row.id);
        res.json({ ok: true });
      } catch (e) {
        next(e);
      }
    },
  );
  const cleanDealer = (input: any, previous: any = {}) => {
    const data = { ...previous };
    for (const key of [
      "name",
      "contactName",
      "phone",
      "email",
      "address",
      "city",
      "district",
    ])
      if (input[key] !== undefined)
        data[key] = text(input[key], key === "address" ? 1000 : 200);
    if (!data.name || data.name.length < 2)
      throw error(400, "Bayi adını girin.");
    if (data.email && !validEmail(data.email))
      throw error(400, "Geçerli bayi e-postası girin.");
    if (input.regions !== undefined) {
      if (!Array.isArray(input.regions))
        throw error(400, "Bölgeler liste olmalıdır.");
      data.regions = [
        ...new Set(input.regions.map((v: any) => text(v, 100)).filter(Boolean)),
      ].slice(0, 100);
    }
    data.regions ??= [];
    if (input.active !== undefined && typeof input.active !== "boolean")
      throw error(400, "Bayi durumu doğru/yanlış olmalıdır.");
    data.active = input.active ?? data.active ?? true;
    data.id = previous.id || randomUUID();
    data.createdAt = previous.createdAt || now();
    data.updatedAt = now();
    return data;
  };
  app.get("/api/admin/dealers", (req: any, res) => {
    const rows = db
      .prepare("SELECT data FROM portal_dealers ORDER BY rowid DESC")
      .all()
      .map((r: any) => JSON.parse(r.data));
    res.json({
      dealers: rows.filter(
        (d: any) =>
          req.portalActor.role === "admin" ||
          (req.portalActor.role === "dealer"
            ? d.id === req.portalActor.dealerId
            : req.portalActor.role === "manager" &&
              d.regions.some(
                (r: string) =>
                  canonical(r) === canonical(req.portalActor.region || ""),
              )),
      ),
    });
  });
  app.post("/api/admin/dealers", onlyAdmin, (req: any, res, next) => {
    try {
      const data = cleanDealer(req.body || {});
      db.prepare("INSERT INTO portal_dealers(id,data) VALUES(?,?)").run(
        data.id,
        JSON.stringify(data),
      );
      audit(req.portalActor.username, "DEALER_CREATE", data.id);
      res.status(201).json({ dealer: data });
    } catch (e) {
      next(e);
    }
  });
  app.patch("/api/admin/dealers/:id", onlyAdmin, (req: any, res, next) => {
    try {
      const old = dealer(req.params.id);
      if (!old) throw error(404, "Bayi bulunamadı.");
      const data = cleanDealer(req.body || {}, old);
      db.prepare("UPDATE portal_dealers SET data=? WHERE id=?").run(
        JSON.stringify(data),
        data.id,
      );
      audit(req.portalActor.username, "DEALER_UPDATE", data.id);
      res.json({ dealer: data });
    } catch (e) {
      next(e);
    }
  });
  app.delete("/api/admin/dealers/:id", onlyAdmin, (req: any, res, next) => {
    try {
      if (!dealer(req.params.id)) throw error(404, "Bayi bulunamadı.");
      const used = db
        .prepare("SELECT data FROM portal_inquiries")
        .all()
        .some((r: any) => JSON.parse(r.data).dealerId === req.params.id);
      if (used)
        throw error(
          409,
          "Bu bayi taleplere atanmış. Önce atamaları kaldırın veya bayiyi pasife alın.",
        );
      db.prepare("DELETE FROM portal_dealers WHERE id=?").run(req.params.id);
      db.prepare(
        "DELETE FROM portal_staff_sessions WHERE staffId IN (SELECT id FROM portal_staff WHERE json_extract(data,'$.dealerId')=?)",
      ).run(req.params.id);
      audit(req.portalActor.username, "DEALER_DELETE", req.params.id);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
  app.get("/api/dealers", (_req, res) =>
    res.json({
      dealers: db
        .prepare("SELECT data FROM portal_dealers")
        .all()
        .map((r: any) => JSON.parse(r.data))
        .filter((d: any) => d.active)
        .map((d: any) => ({
          id: d.id,
          name: d.name,
          contactName: d.contactName,
          phone: d.phone,
          email: d.email,
          address: d.address,
          city: d.city,
          district: d.district,
          regions: d.regions,
        })),
    }),
  );
  const safeStaff = (row: any) => ({
    id: row.id,
    username: row.username,
    ...JSON.parse(row.data),
  });
  app.get("/api/admin/staff", onlyAdmin, (_req, res) =>
    res.json({
      staff: db
        .prepare(
          "SELECT id,username,data FROM portal_staff ORDER BY rowid DESC",
        )
        .all()
        .map(safeStaff),
    }),
  );
  const staffFields = (input: any, old: any = {}) => {
    const role = input.role ?? old.role;
    if (!["manager", "editor", "dealer"].includes(role))
      throw error(400, "Geçerli çalışan rolü seçin.");
    const dealerId = text(input.dealerId ?? old.dealerId, 100),
      region = text(input.region ?? old.region, 100);
    if (role === "dealer" && (!dealerId || !dealer(dealerId)))
      throw error(400, "Bayi rolü için bayi seçin.");
    if (role === "manager" && !region)
      throw error(400, "Bölge yöneticisi için bölge girin.");
    const status = input.status ?? old.status ?? "active";
    if (!["active", "suspended"].includes(status))
      throw error(400, "Geçerli çalışan durumu seçin.");
    return {
      role,
      dealerId: role === "dealer" ? dealerId : "",
      region: role === "manager" ? region : "",
      status,
      createdAt: old.createdAt || now(),
    };
  };
  app.post("/api/admin/staff", onlyAdmin, (req: any, res, next) => {
    try {
      const username = text(req.body?.username, 100),
        pass = password(req.body?.password);
      if (!/^[a-zA-Z0-9_.@-]{3,100}$/.test(username) || !validPassword(pass))
        throw error(400, "Kullanıcı adı ve en az 12 karakter parola girin.");
      if (
        db
          .prepare("SELECT id FROM portal_staff WHERE username=?")
          .get(username) ||
        db.prepare("SELECT username FROM users WHERE username=?").get(username)
      )
        throw error(409, "Bu kullanıcı adı kullanılıyor.");
      const data = staffFields(req.body),
        id = randomUUID();
      db.prepare(
        "INSERT INTO portal_staff(id,username,password,data) VALUES(?,?,?,?)",
      ).run(id, username, passwordHash(pass), JSON.stringify(data));
      audit(req.portalActor.username, "STAFF_CREATE", id);
      res.status(201).json({ staff: { id, username, ...data } });
    } catch (e) {
      next(e);
    }
  });
  app.patch("/api/admin/staff/:id", onlyAdmin, (req: any, res, next) => {
    try {
      const row = db
        .prepare("SELECT * FROM portal_staff WHERE id=?")
        .get(req.params.id) as any;
      if (!row) throw error(404, "Çalışan bulunamadı.");
      const data = staffFields(req.body, JSON.parse(row.data));
      if (req.body?.newPassword !== undefined) {
        const pass = password(req.body.newPassword);
        if (!validPassword(pass))
          throw error(400, "Yeni parola en az 12 karakter olmalıdır.");
        db.prepare("UPDATE portal_staff SET password=? WHERE id=?").run(
          passwordHash(pass),
          row.id,
        );
      }
      db.prepare("UPDATE portal_staff SET data=? WHERE id=?").run(
        JSON.stringify(data),
        row.id,
      );
      db.prepare("DELETE FROM portal_staff_sessions WHERE staffId=?").run(
        row.id,
      );
      audit(req.portalActor.username, "STAFF_UPDATE", row.id);
      res.json({ staff: { id: row.id, username: row.username, ...data } });
    } catch (e) {
      next(e);
    }
  });
  app.post("/api/admin/staff/:id/revoke", onlyAdmin, (req: any, res, next) => {
    if (
      !db.prepare("SELECT id FROM portal_staff WHERE id=?").get(req.params.id)
    )
      return next(error(404, "Çalışan bulunamadı."));
    db.prepare("DELETE FROM portal_staff_sessions WHERE staffId=?").run(
      req.params.id,
    );
    audit(req.portalActor.username, "STAFF_REVOKE", req.params.id);
    res.json({ ok: true });
  });
  app.get("/api/admin/notifications", (req: any, res) => {
    const actor = req.portalActor as Actor;
    const notifications = (
      db
        .prepare(
          "SELECT * FROM portal_notifications ORDER BY rowid DESC LIMIT 200",
        )
        .all() as any[]
    ).filter(
      (n) =>
        !n.customerId &&
        (actor.role === "admin" ||
          (n.inquiryId &&
            (() => {
              const inq = originalInquiry(n.inquiryId);
              return inq && allowed(actor, inq, state(n.inquiryId));
            })())),
    );
    const outbox =
      actor.role === "admin"
        ? db
            .prepare(
              "SELECT id,inquiryId,channel,status,error,attempts,createdAt,updatedAt FROM portal_outbox ORDER BY rowid DESC LIMIT 200",
            )
            .all()
        : [];
    res.json({
      notifications,
      outbox,
      delivery: { configured: options.deliveryConfigured?.() || false },
    });
  });
  app.post("/api/admin/notifications/:id/read", (req: any, res, next) => {
    const n = db
      .prepare(
        "SELECT * FROM portal_notifications WHERE id=? AND customerId IS NULL",
      )
      .get(req.params.id) as any;
    if (!n) return next(error(404, "Bildirim bulunamadı."));
    if (req.portalActor.role !== "admin") {
      const inq = originalInquiry(n.inquiryId);
      if (!inq || !allowed(req.portalActor, inq, state(n.inquiryId)))
        return next(error(403, "Bildirime erişim yetkiniz yok."));
    }
    db.prepare("UPDATE portal_notifications SET readAt=? WHERE id=?").run(
      now(),
      n.id,
    );
    res.json({ ok: true });
  });
  app.post(
    "/api/admin/outbox/:id/retry",
    onlyAdmin,
    asyncRoute(async (req, res) => {
      const row = db
        .prepare("SELECT * FROM portal_outbox WHERE id=?")
        .get(req.params.id) as any;
      if (!row) throw error(404, "Bildirim işi bulunamadı.");
      if (row.status === "sent")
        throw error(409, "Bu iş sağlayıcıya zaten iletilmiş.");
      if (!consume("delivery-retry", req.portalActor.id, 30, 60))
        throw error(429, "Çok fazla gönderim denemesi.");
      if (row.status === "processing")
        throw error(409, "Bu bildirim şu anda işleniyor.");
      const configured = options.deliveryConfigured?.() || false;
      db.prepare(
        "UPDATE portal_outbox SET status=?,error='',updatedAt=? WHERE id=? AND status<>'processing'",
      ).run(configured ? "queued" : "waiting_configuration", now(), row.id);
      await dispatchPending();
      const result = db
        .prepare("SELECT status FROM portal_outbox WHERE id=?")
        .get(row.id) as { status: string };
      audit(req.portalActor.username, "NOTIFICATION_RETRY", row.id);
      res.json({ ok: true, status: result.status });
    }),
  );
  const onLegacyInquiryUpdated = (req: any, inq: any) => {
    const s = state(inq.id);
    if (!s) return;
    let stage = s.stage;
    if (inq.status === "closed") stage = "completed";
    else if (inq.status === "new") stage = "received";
    else if (
      inq.status === "contacted" &&
      s.stage === "received" &&
      (s.dealerId || s.appointmentAt)
    )
      stage = "assigned";
    if (stage !== s.stage) {
      s.stage = stage;
      s.timeline.push({
        id: randomUUID(),
        stage,
        message: portalStageLabels[stage],
        createdAt: now(),
      });
      saveState(s);
      notify(
        s.customerId,
        inq.id,
        "stage",
        "Talebiniz güncellendi",
        portalStageLabels[stage],
      );
    }
  };
  const onInquiryDeleted = (id: string) => {
    const docs = db
      .prepare("SELECT filename FROM portal_documents WHERE inquiryId=?")
      .all(id) as any[];
    db.prepare("DELETE FROM portal_documents WHERE inquiryId=?").run(id);
    db.prepare("DELETE FROM portal_inquiries WHERE inquiryId=?").run(id);
    db.prepare("DELETE FROM portal_tokens WHERE inquiryId=?").run(id);
    db.prepare("DELETE FROM portal_sessions WHERE inquiryId=?").run(id);
    db.prepare("DELETE FROM portal_notifications WHERE inquiryId=?").run(id);
    db.prepare("DELETE FROM portal_outbox WHERE inquiryId=?").run(id);
    for (const d of docs) {
      const file = join(privateDir, d.filename);
      if (existsSync(file)) unlinkSync(file);
    }
  };
  const authorizeLegacy = (req: any, path: string, method: string) => {
    const actor = adminContext(req);
    if (!actor) return false;
    if (actor.role === "admin") return true;
    if (actor.role !== "editor") return false;
    const route = path.replace(/^\/api\/admin/, "");
    return (
      route === "/me" ||
      route === "/logout" ||
      /^\/(?:content|media)(?:\/|$)/.test(route) ||
      route === "/upload" ||
      (method === "GET" && route === "/settings")
    );
  };
  return {
    onInquiryCreated,
    onLegacyInquiryUpdated,
    onInquiryDeleted,
    adminContext,
    customer,
    authorizeLegacy,
    requireStaff,
    stages: portalStages,
    close: () => {
      disposed = true;
    },
    dispatchPending,
  };
}
