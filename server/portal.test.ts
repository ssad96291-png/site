import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import PDFDocument from "pdfkit";
import { createApp } from "./app.js";

test("Customer portal ownership, private documents, staff scopes and recovery", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-portal-"));
  const app = createApp({ dataDir: dir, production: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const pass = randomBytes(20).toString("base64url");
  let admin = "",
    member = "",
    scoped = "",
    other = "",
    staff = "";
  let first = "",
    second = "",
    third = "",
    memberId = "",
    teamId = "",
    docId = "";
  const cookies = (response: Response, name: string) =>
    response.headers
      .getSetCookie()
      .find((s) => s.startsWith(name + "="))
      ?.split(";")[0] || "";
  const req = (path: string, method = "GET", body?: any, cookie = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    });
  const inquiry = (
    name: string,
    email = "member@example.com",
    district = "Etimesgut",
    cookie = "",
  ) =>
    req(
      "/api/inquiries",
      "POST",
      {
        name,
        email,
        phone: "05000000000",
        district,
        subject: "Portal test",
        message: "Bu kayıt geçici entegrasyon testine aittir.",
        consent: true,
      },
      cookie,
    );
  try {
    const login = await req("/api/admin/login", "POST", {
      username: "admin",
      password: readFileSync(
        dir + ".initial-admin-password",
        "utf8",
      ).trim(),
    });
    assert.equal(login.status, 200);
    admin = cookies(login, "kilinc_session");
    await t.test(
      "Registration never links older requests by email and receipt scope is one inquiry",
      async () => {
        const old = await (await inquiry("Eski talep")).json();
        third = old.id;
        const registered = await req("/api/customer/register", "POST", {
          name: "Üye Müşteri",
          email: "member@example.com",
          password: pass,
        });
        assert.equal(registered.status, 201);
        member = cookies(registered, "kilinc_customer");
        memberId = (await registered.json()).customer.id;
        assert.deepEqual(
          (
            await (
              await req("/api/customer/inquiries", "GET", undefined, member)
            ).json()
          ).inquiries,
          [],
        );
        const own = await (
          await inquiry("Üye talebi", "member@example.com", "Etimesgut", member)
        ).json();
        first = own.id;
        assert.equal(own.trackingUrl, "/hesabim");
        const fresh = await (await inquiry("Yeni anonim talep")).json();
        second = fresh.id;
        assert.ok(fresh.trackingToken);
        assert.match(fresh.trackingUrl, /^\/hesabim#claim=/);
        const claim = await req("/api/customer/claim", "POST", {
          token: fresh.trackingToken,
        });
        assert.equal(claim.status, 200);
        scoped = cookies(claim, "kilinc_customer");
        assert.equal((await claim.json()).scoped, true);
        assert.equal(
          (
            await req("/api/customer/claim", "POST", {
              token: fresh.trackingToken,
            })
          ).status,
          400,
        );
        const rows = (
          await (
            await req("/api/customer/inquiries", "GET", undefined, scoped)
          ).json()
        ).inquiries;
        assert.deepEqual(
          rows.map((r: any) => r.id),
          [second],
        );
        assert.equal(
          (
            await req(
              "/api/customer/inquiries/" + first,
              "GET",
              undefined,
              scoped,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await req(
              "/api/customer/inquiries/" + third,
              "GET",
              undefined,
              member,
            )
          ).status,
          404,
        );
        const stored = app.locals.db
          .prepare("SELECT token FROM portal_tokens WHERE inquiryId=?")
          .get(second) as any;
        assert.notEqual(stored.token, fresh.trackingToken);
      },
    );
    await t.test(
      "Both receipt and password proofs safely attach just the fresh request",
      async () => {
        assert.equal(
          (
            await req(
              "/api/customer/login",
              "POST",
              { email: "member@example.com", password: "wrong" },
              scoped,
            )
          ).status,
          401,
        );
        const signed = await req(
          "/api/customer/login",
          "POST",
          { email: "member@example.com", password: pass },
          scoped,
        );
        assert.equal(signed.status, 200);
        member = cookies(signed, "kilinc_customer");
        assert.equal(
          (await req("/api/customer/me", "GET", undefined, scoped)).status,
          401,
        );
        const rows = (
          await (
            await req("/api/customer/inquiries", "GET", undefined, member)
          ).json()
        ).inquiries;
        assert.deepEqual(
          new Set(rows.map((r: any) => r.id)),
          new Set([first, second]),
        );
        assert.ok(!rows.some((r: any) => r.id === third));
      },
    );
    await t.test(
      "Pipeline assignment and private messages update customer view without internal notes",
      async () => {
        const created = await req(
          "/api/admin/teams",
          "POST",
          {
            name: "Geçici Teknik İrtibat",
            contactName: "Test Yetkilisi",
            phone: "05000000000",
            email: "technician@example.com",
            city: "Ankara",
            district: "Etimesgut",
            address: "Sentetik test adresi",
            regions: ["Etimesgut"],
            active: true,
          },
          admin,
        );
        assert.equal(created.status, 201);
        teamId = (await created.json()).team.id;
        const changed = await req(
          "/api/admin/pipeline/" + first,
          "PATCH",
          {
            stage: "surveyed",
            teamId,
            technician: "Test Teknisyeni",
            appointmentAt: "2030-01-15T10:00:00.000Z",
            customerMessage: "Keşif tamamlandı.",
            notes: "YALNIZCA YÖNETİCİ ÖZEL NOTU",
            priority: "high",
          },
          admin,
        );
        assert.equal(changed.status, 200);
        const customer = (
          await (
            await req(
              "/api/customer/inquiries/" + first,
              "GET",
              undefined,
              member,
            )
          ).json()
        ).inquiry;
        assert.equal(customer.stage, "surveyed");
        assert.equal(customer.assignedTeam.id, teamId);
        assert.equal(customer.technician, "Test Teknisyeni");
        assert.ok(
          customer.timeline.some((row: any) => row.stage === "surveyed"),
        );
        assert.ok(!JSON.stringify(customer).includes("YALNIZCA YÖNETİCİ"));
        const message = await req(
          "/api/customer/inquiries/" + first + "/messages",
          "POST",
          { kind: "revision", message: "Teklifte revize istiyorum." },
          member,
        );
        assert.equal(message.status, 201);
        const queue = await (
          await req("/api/admin/notifications", "GET", undefined, admin)
        ).json();
        assert.ok(queue.notifications.some((n: any) => n.kind === "revision"));
        assert.equal(queue.delivery.configured, false);
        assert.ok(
          queue.outbox.some(
            (job: any) => job.status === "waiting_configuration",
          ),
        );
      },
    );
    await t.test(
      "Documents are private attachments protected by inquiry owner checks",
      async () => {
        const doc = new PDFDocument();
        const chunks: Buffer[] = [];
        const pdf = new Promise<Buffer>((resolve) => {
          doc.on("data", (b) => chunks.push(b));
          doc.on("end", () => resolve(Buffer.concat(chunks)));
        });
        doc.text("Synthetic private quotation");
        doc.end();
        const bytes = await pdf;
        const form = new FormData();
        form.set(
          "document",
          new Blob([new Uint8Array(bytes)], { type: "application/pdf" }),
          "quote.pdf",
        );
        const uploaded = await req(
          "/api/admin/pipeline/" + first + "/documents?kind=quote&title=Teklif",
          "POST",
          form,
          admin,
        );
        assert.equal(uploaded.status, 201);
        docId = (await uploaded.json()).document.id;
        assert.equal(
          (await req("/api/customer/documents/" + docId + "/download")).status,
          401,
        );
        const stranger = await req("/api/customer/register", "POST", {
          name: "Diğer Müşteri",
          email: "other@example.com",
          password: pass,
        });
        assert.equal(stranger.status, 201);
        other = cookies(stranger, "kilinc_customer");
        assert.equal(
          (
            await req(
              "/api/customer/documents/" + docId + "/download",
              "GET",
              undefined,
              other,
            )
          ).status,
          404,
        );
        const downloaded = await req(
          "/api/customer/documents/" + docId + "/download",
          "GET",
          undefined,
          member,
        );
        assert.equal(downloaded.status, 200);
        assert.match(
          downloaded.headers.get("content-disposition") || "",
          /attachment/,
        );
        assert.match(
          downloaded.headers.get("content-security-policy") || "",
          /sandbox/,
        );
        assert.equal(
          Buffer.from(await downloaded.arrayBuffer())
            .subarray(0, 5)
            .toString(),
          "%PDF-",
        );
        const events = (
          await (
            await req(
              "/api/admin/customers/" + memberId + "/activity",
              "GET",
              undefined,
              admin,
            )
          ).json()
        ).events;
        assert.ok(events.some((e: any) => e.action === "download"));
      },
    );
    await t.test(
      "Suspension revokes sessions, recovery is one use, and email correction never merges accounts",
      async () => {
        assert.equal(
          (
            await req(
              "/api/admin/customers/" + memberId,
              "PATCH",
              { status: "suspended" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (await req("/api/customer/me", "GET", undefined, member)).status,
          401,
        );
        assert.equal(
          (
            await req("/api/customer/login", "POST", {
              email: "member@example.com",
              password: pass,
            })
          ).status,
          401,
        );
        assert.equal(
          (
            await req(
              "/api/admin/customers/" + memberId,
              "PATCH",
              { status: "active", email: "corrected@example.com" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (await req("/api/customer/me", "GET", undefined, member)).status,
          401,
        );
        const recovery = await req(
          "/api/admin/customers/" + memberId + "/recovery",
          "POST",
          {},
          admin,
        );
        assert.equal(recovery.status, 200);
        const url = (await recovery.json()).url;
        const token = url.split("#reset=")[1];
        assert.ok(token);
        const nextPass = pass + "-new";
        assert.equal(
          (
            await req("/api/customer/reset", "POST", {
              token,
              newPassword: nextPass,
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await req("/api/customer/reset", "POST", {
              token,
              newPassword: nextPass,
            })
          ).status,
          400,
        );
        const signed = await req("/api/customer/login", "POST", {
          email: "corrected@example.com",
          password: nextPass,
        });
        assert.equal(signed.status, 200);
        member = cookies(signed, "kilinc_customer");
        const ids = (
          await (
            await req("/api/customer/inquiries", "GET", undefined, member)
          ).json()
        ).inquiries.map((i: any) => i.id);
        assert.equal(ids.length, 2);
        assert.ok(!ids.includes(third));
      },
    );
    await t.test(
      "Technician authorization cannot inherit an admin cookie or access unrelated customers",
      async () => {
        const created = await req(
          "/api/admin/staff",
          "POST",
          {
            username: "test-technician",
            password: pass,
            role: "technician",
            teamId,
          },
          admin,
        );
        assert.equal(created.status, 201);
        const signed = await req(
          "/api/staff/login",
          "POST",
          { username: "test-technician", password: pass },
          admin,
        );
        assert.equal(signed.status, 200);
        staff = cookies(signed, "kilinc_staff");
        assert.ok(staff);
        assert.equal(
          (await req("/api/admin/me", "GET", undefined, admin)).status,
          401,
          "old admin session revoked on role switch",
        );
        assert.equal(
          (await req("/api/admin/export", "GET", undefined, staff)).status,
          403,
        );
        assert.equal(
          (await req("/api/admin/staff", "GET", undefined, staff)).status,
          403,
        );
        const list = (
          await (
            await req("/api/admin/pipeline", "GET", undefined, staff)
          ).json()
        ).inquiries;
        assert.ok(list.some((i: any) => i.id === first));
        assert.ok(!list.some((i: any) => i.id === third));
        assert.equal(
          (
            await req(
              "/api/admin/pipeline/" + third,
              "PATCH",
              { stage: "completed" },
              staff,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await req(
              "/api/admin/customers/" + memberId + "/activity",
              "GET",
              undefined,
              staff,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await req(
              "/api/staff/password",
              "PUT",
              { currentPassword: pass, newPassword: pass + "-staff" },
              staff,
            )
          ).status,
          200,
        );
        assert.equal(
          (await req("/api/staff/me", "GET", undefined, staff)).status,
          401,
        );
      },
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
