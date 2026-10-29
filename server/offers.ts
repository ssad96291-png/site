import type { Response } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import PDFDocument from "pdfkit";
import { deliveryConfigured } from "./messaging.js";
import { validProjectEmail, type ProjectContext } from "./project-context.js";

type Currency = "TRY" | "EUR" | "USD";
type OfferItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};
type Contact = {
  id: string;
  channel: "email" | "phone";
  note: string;
  actor: string;
  createdAt: string;
};
export type Offer = {
  id: string;
  inquiryId: string;
  version: number;
  status: "draft" | "published";
  title: string;
  currency: Currency;
  items: OfferItem[];
  vatRate: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  validUntil: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  companySnapshot?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    websiteUrl: string;
  };
  customerSnapshot?: {
    name: string;
    email: string;
    phone: string;
    district: string;
    subject: string;
  };
  contacts: Contact[];
};

const fail = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
const now = () => new Date().toISOString();
function text(
  value: unknown,
  limit: number,
  label: string,
  required = false,
): string {
  if (value === undefined && !required) return "";
  if (
    typeof value !== "string" ||
    value.length > limit ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    throw fail(
      400,
      `${label} geçerli ve en fazla ${limit} karakterlik metin olmalıdır.`,
    );
  const result = value.trim();
  if (required && !result) throw fail(400, `${label} zorunludur.`);
  return result;
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const email = validProjectEmail;
const validPhone = (v: unknown) =>
  typeof v === "string" &&
  /^[+()\d .-]{7,50}$/.test(v) &&
  v.replace(/\D/g, "").length >= 7;
function scaled(
  value: unknown,
  scale: number,
  max: number,
  label: string,
  zero = false,
): number {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" &&
      (!value.trim() || !/^\d+(?:\.\d+)?$/.test(value)))
  )
    throw fail(400, `${label} geçerli bir sayı olmalıdır.`);
  const number = Number(value);
  // Test the submitted decimal precision before using floating-point arithmetic.
  // A tolerance alone would silently round tiny values such as 0.0000000001.
  const decimal = String(value).toLowerCase();
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/.exec(decimal);
  const places = match
    ? Math.max(
        0,
        (match[2] || "").replace(/0+$/, "").length - Number(match[3] || 0),
      )
    : Number.POSITIVE_INFINITY;
  const units = Math.round(number * scale);
  if (
    !Number.isFinite(number) ||
    places > Math.log10(scale) ||
    number < (zero ? 0 : 1 / scale) ||
    number > max ||
    !Number.isSafeInteger(units) ||
    Math.abs(number * scale - units) > 0.000001
  )
    throw fail(
      400,
      `${label} izin verilen aralıkta ve hassasiyette olmalıdır.`,
    );
  return units;
}
function cleanOffer(
  input: unknown,
): Pick<
  Offer,
  | "title"
  | "currency"
  | "items"
  | "vatRate"
  | "subtotalMinor"
  | "taxMinor"
  | "totalMinor"
  | "validUntil"
  | "notes"
> {
  if (!object(input)) throw fail(400, "Geçerli bir teklif gönderin.");
  const title = text(input.title, 200, "Teklif başlığı", true);
  const currency = input.currency || "TRY";
  if (!["TRY", "EUR", "USD"].includes(String(currency)))
    throw fail(400, "Geçerli para birimi seçin.");
  if (
    !Array.isArray(input.items) ||
    input.items.length < 1 ||
    input.items.length > 50
  )
    throw fail(400, "Teklif 1–50 kalem içermelidir.");
  const items = input.items.map((item): OfferItem => {
    if (!object(item)) throw fail(400, "Geçerli teklif kalemi gönderin.");
    const quantityMilli = scaled(item.quantity, 1000, 10_000, "Miktar");
    const unitPriceMinor = scaled(
      item.unitPrice,
      100,
      10_000_000,
      "Birim fiyat",
      true,
    );
    const lineTotalMinor = Math.round((quantityMilli * unitPriceMinor) / 1000);
    if (!Number.isSafeInteger(lineTotalMinor))
      throw fail(400, "Kalem tutarı sınırı aşıldı.");
    return {
      description: text(item.description, 500, "Kalem açıklaması", true),
      quantity: quantityMilli / 1000,
      unit: text(item.unit || "adet", 30, "Birim", true),
      unitPrice: unitPriceMinor / 100,
      unitPriceMinor,
      lineTotalMinor,
    };
  });
  const rate = scaled(input.vatRate ?? 20, 100, 100, "KDV oranı", true);
  const subtotalMinor = items.reduce(
    (sum, item) => sum + item.lineTotalMinor,
    0,
  );
  const taxMinor = Math.round((subtotalMinor * rate) / 10_000);
  const totalMinor = subtotalMinor + taxMinor;
  if (
    !Number.isSafeInteger(totalMinor) ||
    subtotalMinor < 1 ||
    totalMinor > 1_000_000_000_000_000
  )
    throw fail(400, "Toplam tutar izin verilen sınırda olmalıdır.");
  const validUntil = text(input.validUntil, 10, "Geçerlilik tarihi");
  if (
    validUntil &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(validUntil) ||
      !Number.isFinite(Date.parse(validUntil)) ||
      new Date(validUntil).toISOString().slice(0, 10) !== validUntil)
  )
    throw fail(400, "Geçerli bir son tarih girin.");
  return {
    title,
    currency: currency as Currency,
    items,
    vatRate: rate / 100,
    subtotalMinor,
    taxMinor,
    totalMinor,
    validUntil,
    notes: text(input.notes, 5000, "Teklif notu"),
  };
}
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(
    minor / 100,
  );
const ref = (offer: Offer) =>
  `${offer.inquiryId.slice(0, 8).toUpperCase()}-T${offer.version}`;
const date = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "medium",
      }).format(new Date(value))
    : "—";
function offerText(offer: Offer) {
  return [
    offer.companySnapshot?.name || "Kılınç Dekorasyon",
    offer.status === "draft"
      ? "TASLAK — müşteriyle paylaşılmamıştır"
      : "FİYAT TEKLİFİ",
    offer.title,
    `Teklif no: ${ref(offer)}`,
    `Tarih: ${date(offer.publishedAt || offer.createdAt)}`,
    `Müşteri: ${offer.customerSnapshot?.name || ""}`,
    "",
    ...offer.items.map(
      (item, index) =>
        `${index + 1}. ${item.description}\n${item.quantity} ${item.unit} × ${money(item.unitPriceMinor, offer.currency)} = ${money(item.lineTotalMinor, offer.currency)}`,
    ),
    "",
    `Ara toplam: ${money(offer.subtotalMinor, offer.currency)}`,
    `KDV (%${offer.vatRate}): ${money(offer.taxMinor, offer.currency)}`,
    `TOPLAM: ${money(offer.totalMinor, offer.currency)}`,
    ...(offer.validUntil ? [`Geçerlilik: ${date(offer.validUntil)}`] : []),
    ...(offer.notes ? ["", "Açıklamalar", offer.notes] : []),
    "",
    "Bu belge teklif bilgilendirmesidir; fatura, sipariş veya ödeme işlemi oluşturmaz.",
    [
      offer.companySnapshot?.phone,
      offer.companySnapshot?.email,
      offer.companySnapshot?.address,
    ]
      .filter(Boolean)
      .join(" · "),
  ].join("\n");
}
async function pdf(offer: Offer): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 48,
    info: {
      Title: offer.title,
      Author: offer.companySnapshot?.name || "Kılınç Dekorasyon",
      Subject: "Fiyat teklifi",
    },
  });
  const parts: Buffer[] = [];
  const result = new Promise<Buffer>((resolveResult, reject) => {
    doc.on("data", (part) => parts.push(Buffer.from(part)));
    doc.on("end", () => resolveResult(Buffer.concat(parts)));
    doc.on("error", reject);
  });
  const font = resolve("server/assets/DejaVuSans.ttf");
  if (!existsSync(font)) throw fail(503, "Teklif yazı tipi bulunamadı.");
  doc.font(font).fontSize(11).fillColor("#213f34");
  doc
    .fontSize(20)
    .text(offer.companySnapshot?.name || "Kılınç Dekorasyon")
    .moveDown();
  doc
    .fontSize(14)
    .text(
      offer.status === "draft" ? "TASLAK — PAYLAŞILMAMIŞTIR" : "FİYAT TEKLİFİ",
    )
    .moveDown(0.6);
  doc.fontSize(10).fillColor("#24352d").text(offerText(offer), { lineGap: 4 });
  doc.end();
  return result;
}
const encodedHeader = (value: string) => {
  // Each encoded word remains below RFC 2047's 75-character limit, without
  // splitting a UTF-8 character. Fold only at trusted word boundaries.
  const words: string[] = [];
  let chunk = "";
  for (const character of value.replace(/[\r\n]/g, " ")) {
    if (chunk && Buffer.byteLength(chunk + character) > 42) {
      words.push(`=?UTF-8?B?${Buffer.from(chunk).toString("base64")}?=`);
      chunk = "";
    }
    chunk += character;
  }
  if (chunk) words.push(`=?UTF-8?B?${Buffer.from(chunk).toString("base64")}?=`);
  return words.join("\r\n ");
};
const base64Lines = (data: Buffer) =>
  data
    .toString("base64")
    .match(/.{1,76}/g)
    ?.join("\r\n") || "";
function privateHeaders(res: Response) {
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
}

/** Structured quotations remain private until explicitly published by a scoped operator. */
export function installOffers(ctx: ProjectContext) {
  const { app, db } = ctx;
  db.exec(`CREATE TABLE IF NOT EXISTS portal_offers(id TEXT PRIMARY KEY,inquiryId TEXT NOT NULL,status TEXT NOT NULL,data TEXT NOT NULL,createdAt TEXT NOT NULL,publishedAt TEXT);
  CREATE INDEX IF NOT EXISTS portal_offers_inquiry ON portal_offers(inquiryId);`);
  const read = (id: string): Offer => {
    const row = db
      .prepare("SELECT data FROM portal_offers WHERE id=?")
      .get(id) as { data: string } | undefined;
    if (!row) throw fail(404, "Teklif bulunamadı.");
    return JSON.parse(row.data);
  };
  const save = (offer: Offer) =>
    db
      .prepare(
        "UPDATE portal_offers SET status=?,data=?,publishedAt=? WHERE id=?",
      )
      .run(offer.status, JSON.stringify(offer), offer.publishedAt, offer.id);
  const actor = (req: any, mutate = false) => {
    const user = req.portalActor;
    if (!user) throw fail(401, "Yetkili hesabınızla giriş yapın.");
    if (
      !["admin", "manager", "technician"].includes(user.role) ||
      (mutate && !["admin", "manager"].includes(user.role))
    )
      throw fail(403, "Bu teklif işlemi için yetkiniz yok.");
    return user;
  };
  const managed = (req: any, offer: Offer, mutate = false) => {
    const user = actor(req, mutate);
    const owned = ctx.getManaged(req, offer.inquiryId);
    if (user.role === "technician" && offer.status !== "published")
      throw fail(404, "Teklif bulunamadı.");
    return owned;
  };
  const own = (req: any, offer: Offer) => {
    ctx.getOwned(req, offer.inquiryId);
    if (offer.status !== "published") throw fail(404, "Teklif bulunamadı.");
  };
  const emailDelivery = (id: string) => {
    const row = db
      .prepare(
        "SELECT status,error,attempts,updatedAt FROM portal_outbox WHERE json_extract(payload,'$.offerId')=? ORDER BY rowid DESC LIMIT 1",
      )
      .get(id) as any;
    return row || null;
  };
  const view = (offer: Offer, admin = false) => {
    const { contacts, ...publicOffer } = offer;
    return {
      ...publicOffer,
      pdfUrl: `/api/${admin ? "admin" : "customer"}/offers/${offer.id}/pdf`,
      ...(admin
        ? {
            contacts,
            emailDelivery: emailDelivery(offer.id),
            emlUrl:
              offer.status === "published"
                ? `/api/admin/offers/${offer.id}/email.eml`
                : "",
          }
        : {}),
    };
  };
  const list = (id: string): Offer[] =>
    (
      db
        .prepare(
          "SELECT data FROM portal_offers WHERE inquiryId=? ORDER BY rowid DESC",
        )
        .all(id) as any[]
    ).map((row) => JSON.parse(row.data));
  const company = () => {
    const row = db.prepare("SELECT data FROM settings WHERE id=1").get() as any;
    const data = row ? JSON.parse(row.data) : {};
    return {
      name: String(data.companyName || "Kılınç Dekorasyon").slice(0, 200),
      phone: String(data.phone || "").slice(0, 100),
      email: String(data.email || "").slice(0, 254),
      address: String(data.address || "").slice(0, 1000),
      websiteUrl: String(data.websiteUrl || "").slice(0, 500),
    };
  };
  const asyncRoute =
    (fn: (req: any, res: Response) => Promise<void>) =>
    (req: any, res: Response, next: any) => {
      void fn(req, res).catch(next);
    };

  app.get(
    "/api/admin/project-requests/:inquiryId/offers",
    ctx.requireStaff,
    (req: any, res, next) => {
      try {
        const user = actor(req);
        ctx.getManaged(req, String(req.params.inquiryId));
        res.json({
          offers: list(String(req.params.inquiryId))
            .filter(
              (offer) =>
                user.role !== "technician" || offer.status === "published",
            )
            .map((offer) => view(offer, true)),
        });
      } catch (e) {
        next(e);
      }
    },
  );
  app.post(
    "/api/admin/project-requests/:inquiryId/offers",
    ctx.requireStaff,
    (req: any, res, next) => {
      try {
        const user = actor(req, true),
          id = String(req.params.inquiryId);
        ctx.getManaged(req, id);
        if (!ctx.consume("offer-create", user.id, 30, 60))
          throw fail(429, "Çok fazla teklif oluşturma denemesi.");
        const current = list(id);
        if (current.length >= 50)
          throw fail(409, "Bu talepteki teklif sürümü sınırına ulaşıldı.");
        const stamp = now();
        const offer: Offer = {
          ...cleanOffer(req.body),
          id: randomUUID(),
          inquiryId: id,
          version: Math.max(0, ...current.map((o) => o.version)) + 1,
          status: "draft",
          createdAt: stamp,
          updatedAt: stamp,
          publishedAt: null,
          contacts: [],
        };
        db.prepare(
          "INSERT INTO portal_offers(id,inquiryId,status,data,createdAt,publishedAt) VALUES(?,?,?,?,?,NULL)",
        ).run(offer.id, id, "draft", JSON.stringify(offer), stamp);
        ctx.audit(user.username, "OFFER_DRAFT_CREATE", offer.id);
        res.status(201).json({ offer: view(offer, true) });
      } catch (e) {
        next(e);
      }
    },
  );
  app.put("/api/admin/offers/:id", ctx.requireStaff, (req: any, res, next) => {
    try {
      const offer = read(String(req.params.id));
      managed(req, offer, true);
      if (offer.status !== "draft")
        throw fail(
          409,
          "Paylaşılmış teklif değiştirilemez; yeni bir teklif sürümü oluşturun.",
        );
      Object.assign(offer, cleanOffer(req.body), { updatedAt: now() });
      save(offer);
      ctx.audit(req.portalActor.username, "OFFER_DRAFT_UPDATE", offer.id);
      res.json({ offer: view(offer, true) });
    } catch (e) {
      next(e);
    }
  });
  app.post(
    "/api/admin/offers/:id/publish",
    ctx.requireStaff,
    (req: any, res, next) => {
      try {
        const offer = read(String(req.params.id));
        const { inq, s } = managed(req, offer, true);
        if (offer.status === "published")
          return res.json({ offer: view(offer, true) });
        const metadata = ctx.getProject(offer.inquiryId);
        const destination = metadata?.replyEmail || inq.email || "";
        if (destination && !email(destination))
          throw fail(
            400,
            "Teklif e-posta adresi geçersiz; müşteri bilgisini düzeltin.",
          );
        const stamp = now();
        offer.status = "published";
        offer.publishedAt = stamp;
        offer.updatedAt = stamp;
        offer.companySnapshot = company();
        offer.customerSnapshot = {
          name: String(inq.name || "").slice(0, 200),
          email: destination,
          phone: String(inq.phone || "").slice(0, 50),
          district: String(inq.district || "").slice(0, 100),
          subject: String(inq.subject || "").slice(0, 200),
        };
        db.exec("BEGIN IMMEDIATE");
        try {
          save(offer);
          ctx.notify(
            s.customerId,
            offer.inquiryId,
            "quote_offer",
            "Fiyat teklifiniz hazır",
            `${offer.title} — ${money(offer.totalMinor, offer.currency)}. Teklifi ve kapsamını hesabınızdan inceleyebilirsiniz.`,
            false,
          );
          if (destination)
            db.prepare(
              "INSERT INTO portal_outbox(id,customerId,inquiryId,channel,payload,status,error,attempts,createdAt,updatedAt) VALUES(?,?,?,'email',?,?,?,0,?,?)",
            ).run(
              randomUUID(),
              s.customerId || null,
              offer.inquiryId,
              JSON.stringify({
                name: offer.customerSnapshot.name,
                email: destination,
                phone: offer.customerSnapshot.phone,
                kind: "quote_offer",
                title: offer.title,
                message: offerText(offer),
                text: offerText(offer),
                inquiryId: offer.inquiryId,
                offerId: offer.id,
                quote: {
                  reference: ref(offer),
                  currency: offer.currency,
                  subtotalMinor: offer.subtotalMinor,
                  taxMinor: offer.taxMinor,
                  totalMinor: offer.totalMinor,
                  vatRate: offer.vatRate,
                  items: offer.items,
                  validUntil: offer.validUntil,
                  notes: offer.notes,
                },
              }),
              deliveryConfigured() ? "queued" : "waiting_configuration",
              "",
              stamp,
              stamp,
            );
          ctx.audit(req.portalActor.username, "OFFER_PUBLISH", offer.id);
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
        void ctx.dispatchPending().catch(() => {});
        res.json({ offer: view(offer, true) });
      } catch (e) {
        next(e);
      }
    },
  );
  app.get(
    "/api/customer/inquiries/:inquiryId/offers",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        ctx.getOwned(req, String(req.params.inquiryId));
        res.json({
          offers: list(String(req.params.inquiryId))
            .filter((offer) => offer.status === "published")
            .map((offer) => view(offer)),
        });
      } catch (e) {
        next(e);
      }
    },
  );
  const downloadPdf = (admin: boolean) =>
    asyncRoute(async (req, res) => {
      const offer = read(String(req.params.id));
      if (admin) managed(req, offer);
      else own(req, offer);
      const identity = admin
        ? req.portalActor.id
        : req.portalCustomer.customer.id;
      if (!ctx.consume("offer-pdf", identity, 60, 15))
        throw fail(
          429,
          "Çok fazla teklif belgesi isteği. Daha sonra tekrar deneyin.",
        );
      const content = await pdf(offer);
      privateHeaders(res);
      res
        .type("application/pdf")
        .attachment(`kilinc-teklif-${ref(offer)}.pdf`)
        .send(content);
      if (admin)
        ctx.audit(req.portalActor.username, "OFFER_PDF_DOWNLOAD", offer.id);
    });
  app.get("/api/admin/offers/:id/pdf", ctx.requireStaff, downloadPdf(true));
  app.get(
    "/api/customer/offers/:id/pdf",
    ctx.requireCustomer,
    downloadPdf(false),
  );
  app.get(
    "/api/admin/offers/:id/email.eml",
    ctx.requireStaff,
    asyncRoute(async (req, res) => {
      const offer = read(String(req.params.id));
      managed(req, offer, true);
      if (offer.status !== "published")
        throw fail(409, "E-posta taslağı için teklifi önce paylaşın.");
      const destination = offer.customerSnapshot?.email;
      if (!email(destination))
        throw fail(409, "Geçerli müşteri e-postası bulunmuyor.");
      if (!ctx.consume("offer-email-draft", req.portalActor.id, 30, 15))
        throw fail(
          429,
          "Çok fazla e-posta taslağı isteği. Daha sonra tekrar deneyin.",
        );
      const boundary = "kilinc_" + randomUUID().replaceAll("-", "");
      const attachment = await pdf(offer);
      const content = [
        `To: ${destination}`,
        `Subject: ${encodedHeader(offer.title + " — " + ref(offer))}`,
        "MIME-Version: 1.0",
        "X-Unsent: 1",
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        base64Lines(Buffer.from(offerText(offer))),
        `--${boundary}`,
        "Content-Type: application/pdf",
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="kilinc-teklif-${ref(offer)}.pdf"`,
        "",
        base64Lines(attachment),
        `--${boundary}--`,
        "",
      ].join("\r\n");
      privateHeaders(res);
      res
        .type("message/rfc822")
        .attachment(`kilinc-teklif-${ref(offer)}.eml`)
        .send(content);
      ctx.audit(
        req.portalActor.username,
        "OFFER_EMAIL_DRAFT_DOWNLOAD",
        offer.id,
      );
    }),
  );
  app.post(
    "/api/admin/offers/:id/contact",
    ctx.requireStaff,
    (req: any, res, next) => {
      try {
        const offer = read(String(req.params.id));
        const { inq } = managed(req, offer, true);
        if (offer.status !== "published")
          throw fail(409, "Önce teklifi paylaşın.");
        if (
          !object(req.body) ||
          !["phone", "email"].includes(String(req.body.channel))
        )
          throw fail(400, "Geçerli iletişim kanalı seçin.");
        if (
          req.body.channel === "phone" &&
          (!ctx.getProject(offer.inquiryId)?.phoneRequested ||
            !validPhone(inq.phone))
        )
          throw fail(
            409,
            "Müşterinin telefonla aranma tercihi ve geçerli telefon numarası gerekir.",
          );
        if (
          req.body.channel === "email" &&
          !email(offer.customerSnapshot?.email)
        )
          throw fail(409, "Geçerli müşteri e-postası bulunmuyor.");
        const contact: Contact = {
          id: randomUUID(),
          channel: req.body.channel as "phone" | "email",
          note: text(req.body.note, 2000, "İletişim notu", true),
          actor: req.portalActor.username,
          createdAt: now(),
        };
        if (offer.contacts.length >= 100)
          throw fail(409, "İletişim kaydı sınırına ulaşıldı.");
        offer.contacts.push(contact);
        offer.updatedAt = contact.createdAt;
        save(offer);
        ctx.audit(req.portalActor.username, "OFFER_MANUAL_CONTACT", offer.id);
        res.status(201).json({ offer: view(offer, true), contact });
      } catch (e) {
        next(e);
      }
    },
  );
  return {
    cleanupInquiry(id: string) {
      db.prepare("DELETE FROM portal_offers WHERE inquiryId=?").run(id);
    },
    listPublished(id: string) {
      return list(id)
        .filter((offer) => offer.status === "published")
        .map((offer) => view(offer));
    },
  };
}
