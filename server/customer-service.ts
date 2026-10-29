import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import type { ProjectContext } from "./project-context.js";

const statuses = ["open", "in_progress", "waiting_customer", "resolved"];
const priorities = ["low", "normal", "high"];
const categories = ["account", "technical", "quotation", "document", "other"];
const failure = (status: number, message: string) =>
  Object.assign(new Error(message), { status });
const now = () => new Date().toISOString();
const string = (value: unknown, max: number, label: string, min = 0) => {
  if (
    typeof value !== "string" ||
    value.length > max ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)
  )
    throw failure(
      400,
      `${label} geçerli ve en fazla ${max} karakterlik metin olmalıdır.`,
    );
  const text = value.trim();
  if (text.length < min)
    throw failure(400, `${label} en az ${min} karakter olmalıdır.`);
  return text;
};
type Ticket = {
  id: string;
  customerId: string;
  inquiryId: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
};
type Message = {
  id: string;
  author: "customer" | "staff";
  authorName: string;
  message: string;
  internal: boolean;
  createdAt: string;
};

/** A proven receipt claim can move exactly one enquiry's conversations. Never
 * merge records merely because two submitted email addresses are the same. */
export function transferSupportOwnership(
  db: ProjectContext["db"],
  inquiryId: string,
  previousCustomerId: string,
  customerId: string,
) {
  const rows = db
    .prepare(
      "SELECT id,data FROM support_tickets WHERE inquiryId=? AND customerId=?",
    )
    .all(inquiryId, previousCustomerId) as any[];
  for (const row of rows) {
    const value: Ticket = JSON.parse(row.data);
    value.customerId = customerId;
    value.updatedAt = now();
    db.prepare("UPDATE support_tickets SET customerId=?,data=? WHERE id=?").run(
      customerId,
      JSON.stringify(value),
      row.id,
    );
  }
}

/** Customer support and aggregate account views reuse the portal's ownership
 * checks. Email or phone matches never establish customer identity. */
export function installCustomerService(ctx: ProjectContext) {
  const { app, db } = ctx;
  db.exec(`CREATE TABLE IF NOT EXISTS support_tickets(
    id TEXT PRIMARY KEY,customerId TEXT NOT NULL,inquiryId TEXT,
    status TEXT NOT NULL,priority TEXT NOT NULL,data TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS support_messages(id TEXT PRIMARY KEY,ticketId TEXT NOT NULL,data TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS support_owner_idx ON support_tickets(customerId);
    CREATE INDEX IF NOT EXISTS support_inquiry_idx ON support_tickets(inquiryId);
    CREATE INDEX IF NOT EXISTS support_message_idx ON support_messages(ticketId);`);

  const staff: RequestHandler = (req: any, _res, next) => {
    if (!["admin", "manager", "technician"].includes(req.portalActor?.role))
      return next(
        failure(403, "Bu bölüm için müşteri operasyonu yetkisi gerekir."),
      );
    next();
  };
  const canWrite = (req: any) => {
    if (!["admin", "manager"].includes(req.portalActor?.role))
      throw failure(
        403,
        "Destek yanıtı ve durum değişikliği için yönetici veya operasyon sorumlusu gerekir.",
      );
  };
  const customerRow = (id: string) =>
    db
      .prepare("SELECT id,email,data FROM portal_customers WHERE id=?")
      .get(id) as any;
  const customerView = (row: any) => {
    const data = JSON.parse(row.data);
    return {
      id: row.id,
      name: data.name || "",
      email: row.email || data.contactEmail || "",
      phone: data.phone || "",
      address: data.address || "",
      customerType: data.customerType || "individual",
      status: data.status,
      pending: data.pending === true,
      createdAt: data.createdAt,
      lastLoginAt: data.lastLoginAt || null,
    };
  };
  const messages = (id: string): Message[] =>
    (
      db
        .prepare(
          "SELECT data FROM support_messages WHERE ticketId=? ORDER BY rowid LIMIT 250",
        )
        .all(id) as any[]
    ).map((row) => JSON.parse(row.data));
  const ticket = (id: string): Ticket => {
    const row = db
      .prepare("SELECT data FROM support_tickets WHERE id=?")
      .get(id) as any;
    if (!row) throw failure(404, "Destek kaydı bulunamadı.");
    return JSON.parse(row.data);
  };
  const save = (value: Ticket) =>
    db
      .prepare(
        "UPDATE support_tickets SET status=?,priority=?,data=? WHERE id=?",
      )
      .run(value.status, value.priority, JSON.stringify(value), value.id);
  const view = (value: Ticket, admin: boolean, full = true) => {
    const all = messages(value.id).filter(
      (message) => admin || !message.internal,
    );
    return {
      ...value,
      ...(admin ? {} : { assigneeId: undefined }),
      ...(full ? { messages: all } : {}),
      messageCount: all.length,
      lastMessageAt: all.at(-1)?.createdAt || value.createdAt,
    };
  };
  const customerTicket = (req: any, id: string) => {
    const value = ticket(id),
      current = req.portalCustomer;
    if (
      value.customerId !== current.customer.id ||
      (current.scoped && value.inquiryId !== current.inquiryId)
    )
      throw failure(404, "Destek kaydı bulunamadı.");
    if (value.inquiryId && current.scoped) ctx.getOwned(req, value.inquiryId);
    return value;
  };
  const managedTicket = (req: any, id: string) => {
    const value = ticket(id);
    if (req.portalActor.role === "admin") return value;
    if (!value.inquiryId)
      throw failure(
        403,
        "Hesap düzeyindeki destek kaydını yalnızca ana yönetici inceleyebilir.",
      );
    ctx.getManaged(req, value.inquiryId);
    return value;
  };
  const managedTickets = (req: any, ownerId = "") => {
    const ids = [...new Set(ctx.allManaged(req).map((i) => i.id as string))];
    if (req.portalActor.role !== "admin" && !ids.length) return [];
    // Apply ownership and staff scope before pagination. Unrelated customers'
    // recent tickets must not hide the selected customer's older history.
    const clauses: string[] = [],
      params: string[] = [];
    if (ownerId) {
      clauses.push("customerId=?");
      params.push(ownerId);
    }
    if (req.portalActor.role !== "admin") {
      clauses.push(`inquiryId IN (${ids.map(() => "?").join(",")})`);
      params.push(...ids);
    }
    return (
      db
        .prepare(
          `SELECT data FROM support_tickets${clauses.length ? " WHERE " + clauses.join(" AND ") : ""} ORDER BY rowid DESC`,
        )
        .all(...params) as any[]
    ).map((row) => JSON.parse(row.data) as Ticket);
  };
  const append = (value: Ticket, message: Message) => {
    const count = (
      db
        .prepare("SELECT count(*) AS n FROM support_messages WHERE ticketId=?")
        .get(value.id) as any
    ).n;
    if (count >= 250)
      throw failure(
        409,
        "Bu destek kaydının mesaj sınırına ulaşıldı. Yeni bir destek kaydı açın.",
      );
    db.prepare(
      "INSERT INTO support_messages(id,ticketId,data) VALUES(?,?,?)",
    ).run(message.id, value.id, JSON.stringify(message));
  };
  const recordActivity = (id: string, action: string) => {
    db.prepare(
      "INSERT INTO portal_activity(id,customerId,action,detail,createdAt) VALUES(?,?,?,?,?)",
    ).run(randomUUID(), id, action, "Destek kaydı güncellendi.", now());
  };
  const transaction = <T>(fn: () => T): T => {
    db.exec("BEGIN IMMEDIATE");
    try {
      const result = fn();
      db.exec("COMMIT");
      return result;
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  const throttle = (req: any, scope: string, limit = 40) => {
    const key = req.portalCustomer?.customer.id || req.portalActor.id;
    if (!ctx.consume("support-" + scope, key, limit, 60))
      throw failure(
        429,
        "Çok fazla destek işlemi yapıldı. Bir süre sonra tekrar deneyin.",
      );
  };

  app.get(
    "/api/customer/support-tickets",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        const current = req.portalCustomer;
        const values = (
          db
            .prepare(
              "SELECT data FROM support_tickets WHERE customerId=? ORDER BY rowid DESC LIMIT 500",
            )
            .all(current.customer.id) as any[]
        )
          .map((row) => JSON.parse(row.data) as Ticket)
          .filter(
            (value) => !current.scoped || value.inquiryId === current.inquiryId,
          );
        res.json({
          tickets: values.map((value) => view(value, false, false)),
          statuses,
          categories,
        });
      } catch (error) {
        next(error);
      }
    },
  );
  app.post(
    "/api/customer/support-tickets",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        throttle(req, "create", 12);
        const current = req.portalCustomer;
        const subject = string(req.body?.subject, 160, "Konu", 3);
        const message = string(req.body?.message, 4000, "Mesaj", 10);
        const category = req.body?.category || "account";
        if (!categories.includes(category))
          throw failure(400, "Geçerli destek kategorisi seçin.");
        const inquiryId = req.body?.inquiryId
          ? string(req.body.inquiryId, 100, "Talep numarası", 1)
          : current.scoped
            ? current.inquiryId
            : null;
        if (inquiryId) ctx.getOwned(req, inquiryId);
        const active = (
          db
            .prepare(
              "SELECT count(*) AS n FROM support_tickets WHERE customerId=? AND status<>'resolved'",
            )
            .get(current.customer.id) as any
        ).n;
        if (active >= 20)
          throw failure(
            409,
            "En fazla 20 açık destek kaydı olabilir. Mevcut kayıtlardan devam edin.",
          );
        const value: Ticket = {
          id: randomUUID(),
          customerId: current.customer.id,
          inquiryId,
          subject,
          category,
          status: "open",
          priority: "normal",
          assigneeId: "",
          createdAt: now(),
          updatedAt: now(),
        };
        transaction(() => {
          db.prepare(
            "INSERT INTO support_tickets(id,customerId,inquiryId,status,priority,data) VALUES(?,?,?,?,?,?)",
          ).run(
            value.id,
            value.customerId,
            value.inquiryId,
            value.status,
            value.priority,
            JSON.stringify(value),
          );
          append(value, {
            id: randomUUID(),
            author: "customer",
            authorName: current.customer.name,
            message,
            internal: false,
            createdAt: now(),
          });
          recordActivity(value.customerId, "support-created");
          ctx.audit("customer:" + value.customerId, "SUPPORT_CREATE", value.id);
        });
        res.status(201).json({ ticket: view(value, false) });
      } catch (error) {
        next(error);
      }
    },
  );
  app.get(
    "/api/customer/support-tickets/:id",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        res.json({
          ticket: view(customerTicket(req, String(req.params.id)), false),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  app.post(
    "/api/customer/support-tickets/:id/messages",
    ctx.requireCustomer,
    (req: any, res, next) => {
      try {
        throttle(req, "message");
        const value = customerTicket(req, String(req.params.id));
        const message = string(req.body?.message, 4000, "Mesaj", 2);
        transaction(() => {
          append(value, {
            id: randomUUID(),
            author: "customer",
            authorName: req.portalCustomer.customer.name,
            message,
            internal: false,
            createdAt: now(),
          });
          value.status = "open";
          value.updatedAt = now();
          save(value);
          recordActivity(value.customerId, "support-reply");
          ctx.audit("customer:" + value.customerId, "SUPPORT_REPLY", value.id);
        });
        res.status(201).json({ ticket: view(value, false) });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/admin/support-tickets",
    ctx.requireStaff,
    staff,
    (req: any, res, next) => {
      try {
        const filter = req.query.status;
        if (filter !== undefined && !statuses.includes(String(filter)))
          throw failure(400, "Geçerli destek durumu seçin.");
        const ownerId =
          req.query.customerId === undefined
            ? ""
            : string(req.query.customerId, 100, "Müşteri numarası", 1);
        const rawOffset =
          req.query.offset === undefined ? "0" : String(req.query.offset);
        if (!/^\d{1,7}$/.test(rawOffset))
          throw failure(400, "Geçerli sayfa başlangıcı girin.");
        const offset = Number(rawOffset);
        const values = managedTickets(req, ownerId).filter(
          (value) => !filter || value.status === filter,
        );
        res.json({
          tickets: values.slice(offset, offset + 250).map((value) => ({
            ...view(value, true, false),
            customerName: customerView(customerRow(value.customerId)).name,
          })),
          total: values.length,
          offset,
          limit: 250,
          hasMore: values.length > offset + 250,
          statuses,
          priorities,
          categories,
          truncated: values.length > offset + 250,
        });
      } catch (error) {
        next(error);
      }
    },
  );
  app.get(
    "/api/admin/support-tickets/:id",
    ctx.requireStaff,
    staff,
    (req: any, res, next) => {
      try {
        const value = managedTicket(req, String(req.params.id));
        res.json({
          ticket: view(value, true),
          customer: customerView(customerRow(value.customerId)),
        });
      } catch (error) {
        next(error);
      }
    },
  );
  app.patch(
    "/api/admin/support-tickets/:id",
    ctx.requireStaff,
    staff,
    (req: any, res, next) => {
      try {
        canWrite(req);
        throttle(req, "manage", 100);
        const value = managedTicket(req, String(req.params.id));
        for (const [field, allowed] of [
          ["status", statuses],
          ["priority", priorities],
        ] as const) {
          if (req.body?.[field] !== undefined) {
            if (!allowed.includes(req.body[field]))
              throw failure(
                400,
                `Geçerli ${field === "status" ? "durum" : "öncelik"} seçin.`,
              );
            value[field] = req.body[field];
          }
        }
        if (req.body?.assigneeId !== undefined) {
          const id = string(req.body.assigneeId, 100, "Sorumlu");
          if (id && id !== req.portalActor.id) {
            if (req.portalActor.role !== "admin")
              throw failure(
                403,
                "Başka personele atama için ana yönetici gerekir.",
              );
            const assigned = db
              .prepare("SELECT data FROM portal_staff WHERE id=?")
              .get(id) as any;
            const info = assigned ? JSON.parse(assigned.data) : null;
            if (!info || info.status !== "active" || info.role !== "manager")
              throw failure(400, "Aktif bir operasyon sorumlusu seçin.");
            // A regional manager must actually be able to see the associated enquiry.
            const managed = ctx
              .allManaged(req)
              .find((item) => item.id === value.inquiryId);
            const normal = (s: string) =>
              s
                .toLocaleLowerCase("tr")
                .normalize("NFD")
                .replace(/\p{M}/gu, "")
                .replaceAll("ı", "i")
                .trim();
            if (
              !managed ||
              normal(managed.district || "") !== normal(info.region || "")
            )
              throw failure(
                400,
                "Seçilen sorumlunun bölgesi bu destek talebiyle eşleşmiyor.",
              );
          }
          value.assigneeId = id;
        }
        transaction(() => {
          value.updatedAt = now();
          save(value);
          ctx.audit(req.portalActor.username, "SUPPORT_UPDATE", value.id);
          ctx.notify(
            value.customerId,
            value.inquiryId,
            "support",
            "Destek kaydınız güncellendi",
            "Destek bölümünden kaydınızın durumunu inceleyebilirsiniz.",
            false,
          );
        });
        res.json({ ticket: view(value, true) });
      } catch (error) {
        next(error);
      }
    },
  );
  app.post(
    "/api/admin/support-tickets/:id/messages",
    ctx.requireStaff,
    staff,
    (req: any, res, next) => {
      try {
        canWrite(req);
        throttle(req, "staff-reply", 100);
        const value = managedTicket(req, String(req.params.id));
        const message = string(req.body?.message, 4000, "Mesaj", 2);
        if (
          req.body?.internal !== undefined &&
          typeof req.body.internal !== "boolean"
        )
          throw failure(400, "Not türü geçerli olmalıdır.");
        const internal = req.body?.internal === true;
        transaction(() => {
          append(value, {
            id: randomUUID(),
            author: "staff",
            authorName: internal
              ? req.portalActor.username
              : "Kılınç Dekorasyon",
            message,
            internal,
            createdAt: now(),
          });
          value.updatedAt = now();
          if (!internal) value.status = "waiting_customer";
          save(value);
          ctx.audit(
            req.portalActor.username,
            internal ? "SUPPORT_INTERNAL_NOTE" : "SUPPORT_STAFF_REPLY",
            value.id,
          );
          if (!internal)
            ctx.notify(
              value.customerId,
              value.inquiryId,
              "support",
              "Destek kaydınıza yanıt var",
              "Yanıtı müşteri panelinizdeki destek bölümünden okuyabilirsiniz.",
              false,
            );
        });
        res.status(201).json({ ticket: view(value, true) });
      } catch (error) {
        next(error);
      }
    },
  );

  app.get(
    "/api/admin/customers/:id/overview",
    ctx.requireStaff,
    staff,
    (req: any, res, next) => {
      try {
        const id = String(req.params.id),
          actor = req.portalActor;
        const row = customerRow(id);
        if (!row) throw failure(404, "Müşteri bulunamadı.");
        const allInquiries = ctx
          .allManaged(req)
          .filter((item) => item.customerId === id);
        const inquiries = allInquiries.slice(0, 500);
        if (actor.role !== "admin" && !inquiries.length)
          throw failure(403, "Bu müşterinin kayıtlarına erişim yetkiniz yok.");
        const inquiryIds = inquiries.map((item) => item.id);
        const allFiles = inquiries.flatMap((item) => [
          ...ctx
            .listProjectFiles(item.id, true)
            .map((file) => ({ ...file, kind: "project" })),
          ...(item.documents || []).map((file: any) => ({
            ...file,
            inquiryId: item.id,
            kind: "document",
          })),
        ]);
        const files = allFiles.slice(0, 1500);
        const allOffers = inquiryIds.length
          ? (
              db
                .prepare(
                  `SELECT data FROM portal_offers WHERE inquiryId IN (${inquiryIds.map(() => "?").join(",")}) ORDER BY rowid DESC LIMIT 1001`,
                )
                .all(...inquiryIds) as any[]
            )
              .map((record) => JSON.parse(record.data))
              .filter(
                (value) =>
                  actor.role !== "technician" || value.status === "published",
              )
          : [];
        const offers = allOffers.slice(0, 1000).map((value) => ({
          id: value.id,
          inquiryId: value.inquiryId,
          version: value.version,
          title: value.title,
          status: value.status,
          currency: value.currency,
          totalMinor: value.totalMinor,
          createdAt: value.createdAt,
          publishedAt: value.publishedAt,
          pdfUrl: `/api/admin/offers/${value.id}/pdf`,
        }));
        const activity =
          actor.role === "admin"
            ? db
                .prepare(
                  "SELECT id,action,detail,createdAt FROM portal_activity WHERE customerId=? ORDER BY rowid DESC LIMIT 200",
                )
                .all(id)
            : [];
        const sessions =
          actor.role === "admin"
            ? (
                db
                  .prepare(
                    "SELECT inquiryId,expires,lastSeen FROM portal_sessions WHERE customerId=? AND expires>? ORDER BY lastSeen DESC LIMIT 100",
                  )
                  .all(id, Date.now()) as any[]
              ).map((session) => ({
                scoped: !!session.inquiryId,
                inquiryId: session.inquiryId || null,
                expiresAt: new Date(session.expires).toISOString(),
                lastSeenAt: new Date(session.lastSeen).toISOString(),
              }))
            : [];
        const inquiryMessages = inquiries.flatMap((item) =>
          (item.messages || []).map((message: any) => ({
            ...message,
            inquiryId: item.id,
            source: "inquiry",
          })),
        );
        const allTickets = managedTickets(req, id);
        const supportMessages = allTickets.flatMap((value) =>
          messages(value.id).map((message) => ({
            ...message,
            inquiryId: value.inquiryId,
            ticketId: value.id,
            source: "support",
          })),
        );
        const allMessages = [...inquiryMessages, ...supportMessages].sort(
          (a, b) =>
            String(b.createdAt || "").localeCompare(String(a.createdAt || "")),
        );
        const tickets = allTickets
          .slice(0, 250)
          .map((value) => view(value, true, false));
        ctx.audit(actor.username, "CUSTOMER_OVERVIEW", id);
        res.json({
          customer: customerView(row),
          inquiries,
          messages: allMessages.slice(0, 1500),
          files,
          offers,
          activity,
          sessions,
          tickets,
          limits: {
            inquiries: 500,
            messages: 1500,
            files: 1500,
            offers: 1000,
            tickets: 250,
            activity: 200,
            sessions: 100,
          },
          truncated: {
            inquiries: allInquiries.length > 500,
            messages: allMessages.length > 1500,
            files: allFiles.length > 1500,
            offers: allOffers.length > 1000,
            tickets: allTickets.length > 250,
          },
          summary: {
            inquiryCount: allInquiries.length,
            activeInquiryCount: allInquiries.filter(
              (i) => i.stage !== "completed",
            ).length,
            messageCount: allMessages.length,
            fileCount: allFiles.length,
            offerCount: allOffers.length,
            openTicketCount: allTickets.filter((t) => t.status !== "resolved")
              .length,
            activeSessionCount: sessions.length,
          },
        });
      } catch (error) {
        next(error);
      }
    },
  );
}
