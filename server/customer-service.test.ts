import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createApp } from "./app.js";

const secret = () => randomBytes(24).toString("base64url");
const authCookie = (response: Response) =>
  response.headers.getSetCookie()[0]?.split(";")[0] || "";

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-customer-service-"));
  const password = secret(),
    previous = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = password;
  const app = createApp({ dataDir: dir, production: false });
  if (previous === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previous;
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (path: string, method = "GET", body?: unknown, auth = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(auth ? { Cookie: auth } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const login = await request("/api/admin/login", "POST", {
    username: "admin",
    password,
  });
  assert.equal(login.status, 200);
  const admin = authCookie(login);
  const member = async (name: string, email: string) => {
    const result = await request("/api/customer/register", "POST", {
      name,
      email,
      password: secret(),
    });
    assert.equal(result.status, 201);
    return {
      auth: authCookie(result),
      customer: (await result.json()).customer,
    };
  };
  const inquiry = async (auth: string, district = "Etimesgut") => {
    const result = await request(
      "/api/inquiries",
      "POST",
      {
        name: "Synthetic customer",
        email: "synthetic@example.com",
        phone: "05000000000",
        message: "Synthetic enquiry for isolated account support tests.",
        district,
        consent: true,
      },
      auth,
    );
    assert.equal(result.status, 201);
    return result.json();
  };
  const staff = async (
    username: string,
    role: string,
    extra: Record<string, string> = {},
  ) => {
    const staffPassword = secret();
    const created = await request(
      "/api/admin/staff",
      "POST",
      { username, role, password: staffPassword, ...extra },
      admin,
    );
    assert.equal(created.status, 201);
    const data = (await created.json()).staff;
    const login = await request("/api/staff/login", "POST", {
      username,
      password: staffPassword,
    });
    assert.equal(login.status, 200);
    return { ...data, auth: authCookie(login) };
  };
  return {
    app,
    request,
    admin,
    member,
    inquiry,
    staff,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      app.locals.close();
      rmSync(dir, { recursive: true, force: true });
      rmSync(dir + ".key", { force: true });
      rmSync(dir + ".initial-admin-password", { force: true });
    },
  };
}

test("Support messages, staff notes and account sessions remain isolated by customer identity", async () => {
  const f = await fixture();
  try {
    const alice = await f.member(
      "Synthetic Alice",
      "support-alice@example.com",
    );
    const bob = await f.member("Synthetic Bob", "support-bob@example.com");
    const created = await f.request(
      "/api/customer/support-tickets",
      "POST",
      {
        subject: "Hesabıma ait telefon bilgisi",
        category: "account",
        message: "Telefon bilgilerimi düzenlerken yardım istiyorum.",
        status: "resolved",
        priority: "high",
        customerId: bob.customer.id,
      },
      alice.auth,
    );
    assert.equal(created.status, 201);
    const ticket = (await created.json()).ticket;
    assert.equal(ticket.customerId, alice.customer.id);
    assert.equal(ticket.status, "open");
    assert.equal(ticket.priority, "normal");
    assert.equal(ticket.assigneeId, undefined);
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${ticket.id}`,
          "GET",
          undefined,
          bob.auth,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${ticket.id}/messages`,
          "POST",
          { message: "Intrusion attempt" },
          bob.auth,
        )
      ).status,
      404,
    );
    const internal = await f.request(
      `/api/admin/support-tickets/${ticket.id}/messages`,
      "POST",
      { message: "Private operator verification note.", internal: true },
      f.admin,
    );
    assert.equal(internal.status, 201);
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${ticket.id}/messages`,
          "POST",
          { message: "Telefon bilginizi birlikte doğrulayalım." },
          f.admin,
        )
      ).status,
      201,
    );
    const visible = (
      await (
        await f.request(
          `/api/customer/support-tickets/${ticket.id}`,
          "GET",
          undefined,
          alice.auth,
        )
      ).json()
    ).ticket;
    assert.equal(visible.messages.length, 2);
    assert.equal(visible.status, "waiting_customer");
    assert.doesNotMatch(
      JSON.stringify(visible),
      /Private operator|assigneeId|admin/,
    );
    const overviewResponse = await f.request(
      `/api/admin/customers/${alice.customer.id}/overview`,
      "GET",
      undefined,
      f.admin,
    );
    assert.equal(overviewResponse.status, 200);
    const overview = await overviewResponse.json();
    assert.equal(overview.customer.id, alice.customer.id);
    assert.equal(overview.summary.activeSessionCount, 1);
    assert.equal(overview.sessions[0].scoped, false);
    assert.doesNotMatch(
      JSON.stringify(overview),
      /password|sessionHash|kilinc_customer|"token"/,
    );
    assert.equal(
      (await f.request(`/api/admin/customers/${alice.customer.id}/overview`))
        .status,
      401,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/customers/${alice.customer.id}/revoke`,
          "POST",
          {},
          f.admin,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${ticket.id}`,
          "GET",
          undefined,
          alice.auth,
        )
      ).status,
      401,
    );
  } finally {
    await f.close();
  }
});

test("Guest receipts stay on their own enquiries despite repeated email and cannot submit another owner's support ticket", async () => {
  const f = await fixture();
  try {
    const one = await f.inquiry(""),
      two = await f.inquiry("");
    const claimOne = await f.request("/api/customer/claim", "POST", {
      token: one.trackingToken,
    });
    const claimTwo = await f.request("/api/customer/claim", "POST", {
      token: two.trackingToken,
    });
    const authOne = authCookie(claimOne),
      authTwo = authCookie(claimTwo);
    const body = {
      subject: "Çizim dosyam hakkında",
      category: "document",
      message: "Çizim dosyamın değerlendirmesini öğrenmek istiyorum.",
    };
    const create = await f.request(
      "/api/customer/support-tickets",
      "POST",
      body,
      authOne,
    );
    assert.equal(create.status, 201);
    const ticket = (await create.json()).ticket;
    assert.equal(ticket.inquiryId, one.id);
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${ticket.id}`,
          "GET",
          undefined,
          authTwo,
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await f.request(
          "/api/customer/support-tickets",
          "POST",
          { ...body, inquiryId: two.id },
          authOne,
        )
      ).status,
      404,
    );
    const list = await (
      await f.request(
        "/api/customer/support-tickets",
        "GET",
        undefined,
        authTwo,
      )
    ).json();
    assert.deepEqual(list.tickets, []);
    const first = await (
      await f.request(
        "/api/customer/support-tickets",
        "GET",
        undefined,
        authOne,
      )
    ).json();
    assert.equal(first.tickets.length, 1);
  } finally {
    await f.close();
  }
});

test("Regional customer overview and support actions exclude other districts, private account activity, and editor/technician writes", async () => {
  const f = await fixture();
  try {
    const alice = await f.member(
      "Synthetic region customer",
      "support-region@example.com",
    );
    const local = await f.inquiry(alice.auth, "Etimesgut"),
      remote = await f.inquiry(alice.auth, "Çankaya");
    const ticket = async (inquiryId?: string) => {
      const result = await f.request(
        "/api/customer/support-tickets",
        "POST",
        {
          subject: "Projem hakkında destek",
          category: "technical",
          message: "Projemdeki ölçü bilgisini kontrol etmek istiyorum.",
          ...(inquiryId ? { inquiryId } : {}),
        },
        alice.auth,
      );
      assert.equal(result.status, 201);
      return (await result.json()).ticket;
    };
    const localTicket = await ticket(local.id),
      remoteTicket = await ticket(remote.id),
      accountTicket = await ticket();
    const manager = await f.staff("service-manager", "manager", {
      region: "Etimesgut",
    });
    const editor = await f.staff("service-editor", "editor");
    const teamResult = await f.request(
      "/api/admin/teams",
      "POST",
      {
        name: "Synthetic Team",
        contactName: "Synthetic Technician",
        active: true,
      },
      f.admin,
    );
    assert.equal(teamResult.status, 201);
    const team = (await teamResult.json()).team;
    const technician = await f.staff("service-technician", "technician", {
      teamId: team.id,
    });
    assert.equal(
      (
        await f.request(
          `/api/admin/pipeline/${local.id}`,
          "PATCH",
          { teamId: team.id },
          f.admin,
        )
      ).status,
      200,
    );
    const list = await (
      await f.request(
        "/api/admin/support-tickets",
        "GET",
        undefined,
        manager.auth,
      )
    ).json();
    assert.deepEqual(
      list.tickets.map((v: any) => v.id),
      [localTicket.id],
    );
    for (const id of [remoteTicket.id, accountTicket.id])
      assert.equal(
        (
          await f.request(
            `/api/admin/support-tickets/${id}`,
            "GET",
            undefined,
            manager.auth,
          )
        ).status,
        403,
      );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${localTicket.id}`,
          "PATCH",
          { status: "in_progress", assigneeId: manager.id },
          manager.auth,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${remoteTicket.id}`,
          "PATCH",
          { assigneeId: manager.id },
          f.admin,
        )
      ).status,
      400,
    );
    const overview = await (
      await f.request(
        `/api/admin/customers/${alice.customer.id}/overview`,
        "GET",
        undefined,
        manager.auth,
      )
    ).json();
    assert.deepEqual(
      overview.inquiries.map((v: any) => v.id),
      [local.id],
    );
    assert.deepEqual(overview.sessions, []);
    assert.deepEqual(overview.activity, []);
    assert.equal(
      (
        await f.request(
          `/api/admin/customers/${alice.customer.id}/overview`,
          "GET",
          undefined,
          editor.auth,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          "/api/admin/support-tickets",
          "GET",
          undefined,
          editor.auth,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${localTicket.id}`,
          "GET",
          undefined,
          technician.auth,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${localTicket.id}`,
          "PATCH",
          { status: "resolved" },
          technician.auth,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${localTicket.id}/messages`,
          "POST",
          { message: "Unauthorized staff reply" },
          technician.auth,
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${remoteTicket.id}`,
          "GET",
          undefined,
          technician.auth,
        )
      ).status,
      403,
    );
  } finally {
    await f.close();
  }
});

test("Support validation, resolution and customer follow-up are bounded, audited and persist across database reads", async () => {
  const f = await fixture();
  try {
    const alice = await f.member(
      "Synthetic follow up",
      "support-followup@example.com",
    );
    const body = {
      subject: "Hesap erişim sorunu",
      category: "account",
      message: "Hesabımdaki erişim sorunu için destek istiyorum.",
    };
    for (const wrong of [
      { subject: "x" },
      { message: "x" },
      { category: "franchise" },
      { message: "x".repeat(4001) },
    ])
      assert.equal(
        (
          await f.request(
            "/api/customer/support-tickets",
            "POST",
            { ...body, ...wrong },
            alice.auth,
          )
        ).status,
        400,
      );
    const ticket = (
      await (
        await f.request(
          "/api/customer/support-tickets",
          "POST",
          body,
          alice.auth,
        )
      ).json()
    ).ticket;
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${ticket.id}`,
          "PATCH",
          { status: "unknown" },
          f.admin,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${ticket.id}`,
          "PATCH",
          { priority: "high", status: "resolved" },
          f.admin,
        )
      ).status,
      200,
    );
    const reply = await f.request(
      `/api/customer/support-tickets/${ticket.id}/messages`,
      "POST",
      {
        message: "Sorun devam ediyor, tekrar kontrol eder misiniz?",
        internal: true,
      },
      alice.auth,
    );
    assert.equal(reply.status, 201);
    const reopened = (await reply.json()).ticket;
    assert.equal(reopened.status, "open");
    assert.equal(reopened.messages[1].internal, false);
    const stored = JSON.parse(
      f.app.locals.db
        .prepare("SELECT data FROM support_tickets WHERE id=?")
        .get(ticket.id).data,
    );
    assert.equal(stored.status, "open");
    assert.equal(stored.priority, "high");
    const audit = f.app.locals.db
      .prepare("SELECT action FROM audit WHERE target=?")
      .all(ticket.id);
    assert.ok(audit.some((record: any) => record.action === "SUPPORT_CREATE"));
    assert.ok(audit.some((record: any) => record.action === "SUPPORT_UPDATE"));
    assert.ok(audit.some((record: any) => record.action === "SUPPORT_REPLY"));
  } finally {
    await f.close();
  }
});

test("Account overview aggregates private files and both correspondence sources without leaking another customer's documents or technician pricing drafts", async () => {
  const f = await fixture();
  try {
    const alice = await f.member(
      "Synthetic workspace Alice",
      "workspace-alice@example.com",
    );
    const bob = await f.member(
      "Synthetic workspace Bob",
      "workspace-bob@example.com",
    );
    const own = await f.inquiry(alice.auth),
      foreign = await f.inquiry(bob.auth);
    const db = f.app.locals.db;
    const createdAt = new Date().toISOString();
    const projectFile = randomUUID(),
      privateDocument = randomUUID();
    db.prepare(
      "INSERT INTO project_files(id,inquiryId,filename,size,data) VALUES(?,?,?,?,?)",
    ).run(
      projectFile,
      own.id,
      projectFile + ".bin",
      150,
      JSON.stringify({
        id: projectFile,
        inquiryId: own.id,
        name: "Synthetic own drawing.dxf",
        extension: "dxf",
        size: 150,
        createdAt,
      }),
    );
    db.prepare(
      "INSERT INTO portal_documents(id,inquiryId,filename,data) VALUES(?,?,?,?)",
    ).run(
      privateDocument,
      own.id,
      privateDocument + ".pdf",
      JSON.stringify({
        id: privateDocument,
        name: "Synthetic own measurement",
        size: 200,
        createdAt,
      }),
    );
    const otherDocument = randomUUID();
    db.prepare(
      "INSERT INTO portal_documents(id,inquiryId,filename,data) VALUES(?,?,?,?)",
    ).run(
      otherDocument,
      foreign.id,
      otherDocument + ".pdf",
      JSON.stringify({
        id: otherDocument,
        name: "BOB PRIVATE FILE SENTINEL",
        size: 200,
        createdAt,
      }),
    );
    for (const [inquiryId, status, title] of [
      [own.id, "draft", "Own draft offer"],
      [own.id, "published", "Own issued offer"],
      [foreign.id, "published", "BOB PRIVATE OFFER SENTINEL"],
    ]) {
      const id = randomUUID();
      db.prepare(
        "INSERT INTO portal_offers(id,inquiryId,status,data,createdAt,publishedAt) VALUES(?,?,?,?,?,?)",
      ).run(
        id,
        inquiryId,
        status,
        JSON.stringify({
          id,
          inquiryId,
          status,
          title,
          version: 1,
          currency: "TRY",
          totalMinor: 123400,
          createdAt,
          publishedAt: status === "published" ? createdAt : null,
        }),
        createdAt,
        status === "published" ? createdAt : null,
      );
    }
    assert.equal(
      (
        await f.request(
          `/api/customer/inquiries/${own.id}/messages`,
          "POST",
          { message: "INQUIRY CORRESPONDENCE SENTINEL", kind: "support" },
          alice.auth,
        )
      ).status,
      201,
    );
    const support = (
      await (
        await f.request(
          "/api/customer/support-tickets",
          "POST",
          {
            subject: "Dosya kontrolü",
            category: "document",
            inquiryId: own.id,
            message: "SUPPORT CORRESPONDENCE SENTINEL",
          },
          alice.auth,
        )
      ).json()
    ).ticket;
    assert.equal(
      (
        await f.request(
          `/api/admin/support-tickets/${support.id}/messages`,
          "POST",
          { message: "STAFF INTERNAL SENTINEL", internal: true },
          f.admin,
        )
      ).status,
      201,
    );
    const result = await f.request(
      `/api/admin/customers/${alice.customer.id}/overview`,
      "GET",
      undefined,
      f.admin,
    );
    assert.equal(result.status, 200);
    const overview = await result.json();
    assert.equal(overview.summary.fileCount, 2);
    assert.equal(overview.summary.offerCount, 2);
    assert.equal(
      overview.files.find((file: any) => file.id === projectFile).downloadUrl,
      `/api/admin/project-files/${projectFile}/download`,
    );
    assert.equal(
      overview.files.find((file: any) => file.id === privateDocument)
        .downloadUrl,
      `/api/admin/documents/${privateDocument}/download`,
    );
    assert.ok(
      overview.messages.some(
        (message: any) =>
          message.source === "support" &&
          message.message === "SUPPORT CORRESPONDENCE SENTINEL",
      ),
    );
    assert.ok(
      overview.messages.some(
        (message: any) =>
          message.source === "inquiry" &&
          message.message === "INQUIRY CORRESPONDENCE SENTINEL",
      ),
    );
    assert.ok(
      overview.messages.some(
        (message: any) =>
          message.internal && message.message === "STAFF INTERNAL SENTINEL",
      ),
    );
    assert.doesNotMatch(JSON.stringify(overview), /BOB PRIVATE/);
    const team = (
      await (
        await f.request(
          "/api/admin/teams",
          "POST",
          { name: "Synthetic view team", active: true },
          f.admin,
        )
      ).json()
    ).team;
    assert.equal(
      (
        await f.request(
          `/api/admin/pipeline/${own.id}`,
          "PATCH",
          { teamId: team.id },
          f.admin,
        )
      ).status,
      200,
    );
    const technician = await f.staff("workspace-technician", "technician", {
      teamId: team.id,
    });
    const scoped = await (
      await f.request(
        `/api/admin/customers/${alice.customer.id}/overview`,
        "GET",
        undefined,
        technician.auth,
      )
    ).json();
    assert.equal(scoped.offers.length, 1);
    assert.equal(scoped.offers[0].status, "published");
    assert.deepEqual(scoped.sessions, []);
    assert.deepEqual(scoped.activity, []);
    const list = await (
      await f.request(
        `/api/admin/support-tickets?customerId=${alice.customer.id}`,
        "GET",
        undefined,
        f.admin,
      )
    ).json();
    assert.equal(list.total, 1);
    assert.equal(list.tickets[0].id, support.id);
    assert.equal(list.hasMore, false);
  } finally {
    await f.close();
  }
});

test("Receipt-backed registration and signed-in claim transfer only that enquiry's support conversation", async () => {
  const f = await fixture();
  try {
    const makeGuest = async () => {
      const inquiry = await f.inquiry("");
      const claimed = await f.request("/api/customer/claim", "POST", {
        token: inquiry.trackingToken,
      });
      assert.equal(claimed.status, 200);
      const auth = authCookie(claimed);
      const created = await f.request(
        "/api/customer/support-tickets",
        "POST",
        {
          subject: "Misafir talebim hakkında",
          category: "technical",
          message: "Hesap oluşturmadan önce talebim için destek istiyorum.",
        },
        auth,
      );
      assert.equal(created.status, 201);
      return { inquiry, auth, ticket: (await created.json()).ticket };
    };
    const own = await makeGuest(),
      separate = await makeGuest();
    const registered = await f.request(
      "/api/customer/register",
      "POST",
      {
        name: "Receipt-backed member",
        email: "synthetic@example.com",
        password: secret(),
      },
      own.auth,
    );
    assert.equal(registered.status, 201);
    const auth = authCookie(registered),
      customer = (await registered.json()).customer;
    const first = (
      await (
        await f.request(
          `/api/customer/support-tickets/${own.ticket.id}`,
          "GET",
          undefined,
          auth,
        )
      ).json()
    ).ticket;
    assert.equal(first.customerId, customer.id);
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${separate.ticket.id}`,
          "GET",
          undefined,
          auth,
        )
      ).status,
      404,
    );
    const list = await (
      await f.request("/api/customer/support-tickets", "GET", undefined, auth)
    ).json();
    assert.deepEqual(
      list.tickets.map((ticket: any) => ticket.id),
      [own.ticket.id],
    );
    const recovery = await f.request(
      `/api/admin/customers/${separate.ticket.customerId}/recovery`,
      "POST",
      {},
      f.admin,
    );
    assert.equal(recovery.status, 200);
    const token = (await recovery.json()).url.split("#claim=")[1];
    const moved = await f.request(
      "/api/customer/claim",
      "POST",
      { token },
      auth,
    );
    assert.equal(moved.status, 200);
    const movedAuth = authCookie(moved);
    const second = await f.request(
      `/api/customer/support-tickets/${separate.ticket.id}`,
      "GET",
      undefined,
      movedAuth,
    );
    assert.equal(second.status, 200);
    assert.equal((await second.json()).ticket.customerId, customer.id);
    assert.equal(
      (
        await f.request(
          `/api/customer/support-tickets/${separate.ticket.id}`,
          "GET",
          undefined,
          separate.auth,
        )
      ).status,
      404,
    );
  } finally {
    await f.close();
  }
});
