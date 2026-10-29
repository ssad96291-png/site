import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

const secret = () => randomBytes(24).toString("base64url");
const cookie = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith(name + "="))
    ?.split(";")[0] || "";

test("Issued price proposals preserve financial, recipient and operator boundaries", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-offers-api-"));
  const keys = [
    "ADMIN_PASSWORD",
    "NOTIFY_WEBHOOK_URL",
    "NOTIFY_ALLOWED_HOSTS",
    "NOTIFY_WEBHOOK_TOKEN",
  ];
  const previous = Object.fromEntries(
    keys.map((key) => [key, process.env[key]]),
  );
  const password = secret();
  process.env.ADMIN_PASSWORD = password;
  for (const key of keys.slice(1)) process.env[key] = "";
  const app = createApp({ dataDir: dir, production: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (path: string, method = "GET", body?: unknown, auth = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(auth ? { Cookie: auth } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  let admin = "",
    owner = "",
    manager = "",
    technician = "";
  let inquiryId = "",
    offerId = "",
    revisionId = "",
    noCallId = "";
  const title = "Ölçü 📐 ".repeat(15).trim() + "\r\nBcc: nobody@example.com";
  const input = {
    title,
    currency: "TRY",
    items: [
      {
        description: "Sentetik ölçüye özel kalem",
        quantity: 2.5,
        unit: "m²",
        unitPrice: 12.34,
      },
      {
        description: "Sentetik küçük aksesuar",
        quantity: 1,
        unit: "adet",
        unitPrice: 0.29,
      },
    ],
    vatRate: 10.5,
    validUntil: "2030-05-20",
    notes: "Yalnızca yalıtılmış test teklifidir.",
    subtotalMinor: 1,
    taxMinor: 1,
    totalMinor: 1,
  };
  const submission = {
    name: "Sentetik Teklif Sahibi",
    email: "one.owner+proposal@example.com",
    phone: "05000000000",
    phoneRequested: true,
    requestType: "project",
    district: "Etimesgut",
    message: "Yalıtılmış teklif testi için ölçü ve kapsam talebi.",
    consent: true,
  };
  try {
    const login = await request("/api/admin/login", "POST", {
      username: "admin",
      password,
    });
    assert.equal(login.status, 200);
    admin = cookie(login, "kilinc_session");
    const submitted = await request(
      "/api/project-requests",
      "POST",
      submission,
    );
    assert.equal(submitted.status, 201);
    const receipt = await submitted.json();
    inquiryId = receipt.id;
    const claimed = await request("/api/customer/claim", "POST", {
      token: receipt.trackingToken,
    });
    assert.equal(claimed.status, 200);
    owner = cookie(claimed, "kilinc_customer");
    const settingsRow = app.locals.db
      .prepare("SELECT data FROM settings WHERE id=1")
      .get() as any;
    const originalSettings = JSON.parse(settingsRow.data);
    app.locals.db
      .prepare("UPDATE settings SET data=? WHERE id=1")
      .run(
        JSON.stringify({
          ...originalSettings,
          companyName: "Sentetik İlk Firma",
          email: "shop@example.com",
          phone: "03120000000",
        }),
      );

    await t.test(
      "Server computes integer minor units and rejects unsupported precision instead of trusting client totals",
      async () => {
        const created = await request(
          `/api/admin/project-requests/${inquiryId}/offers`,
          "POST",
          input,
          admin,
        );
        assert.equal(created.status, 201);
        const offer = (await created.json()).offer;
        offerId = offer.id;
        assert.equal(offer.version, 1);
        assert.equal(offer.status, "draft");
        assert.equal(offer.items[0].unitPriceMinor, 1234);
        assert.equal(offer.items[0].lineTotalMinor, 3085);
        assert.equal(offer.subtotalMinor, 3114);
        assert.equal(offer.taxMinor, 327);
        assert.equal(offer.totalMinor, 3441);
        const bad = [
          { ...input, items: [{ ...input.items[0], quantity: 0 }] },
          { ...input, items: [{ ...input.items[0], quantity: -1 }] },
          { ...input, items: [{ ...input.items[0], quantity: 1.0001 }] },
          { ...input, items: [{ ...input.items[0], unitPrice: 2.675 }] },
          { ...input, items: [{ ...input.items[0], unitPrice: 0.0000000001 }] },
          { ...input, items: [{ ...input.items[0], unitPrice: Number.NaN }] },
          {
            ...input,
            items: [{ ...input.items[0], unitPrice: Number.POSITIVE_INFINITY }],
          },
          { ...input, vatRate: 100.01 },
          { ...input, currency: "ZZZ" },
          { ...input, validUntil: "2030-02-30" },
          { ...input, items: [] },
        ];
        for (const body of bad)
          assert.equal(
            (
              await request(
                `/api/admin/project-requests/${inquiryId}/offers`,
                "POST",
                body,
                admin,
              )
            ).status,
            400,
          );
        const list = await (
          await request(
            `/api/admin/project-requests/${inquiryId}/offers`,
            "GET",
            undefined,
            admin,
          )
        ).json();
        assert.equal(list.offers.length, 1);
      },
    );

    await t.test(
      "Publication is idempotent, queues one truthful email job and freezes the issued snapshot",
      async () => {
        const draftList = await (
          await request(
            `/api/customer/inquiries/${inquiryId}/offers`,
            "GET",
            undefined,
            owner,
          )
        ).json();
        assert.deepEqual(draftList.offers, []);
        assert.equal(
          (
            await request(
              `/api/customer/offers/${offerId}/pdf`,
              "GET",
              undefined,
              owner,
            )
          ).status,
          404,
        );
        const published = await request(
          `/api/admin/offers/${offerId}/publish`,
          "POST",
          {},
          admin,
        );
        assert.equal(published.status, 200);
        const issued = (await published.json()).offer;
        assert.equal(issued.companySnapshot.name, "Sentetik İlk Firma");
        assert.equal(issued.customerSnapshot.email, submission.email);
        assert.equal(issued.emailDelivery.status, "waiting_configuration");
        assert.equal(issued.totalMinor, 3441);
        app.locals.db
          .prepare("UPDATE settings SET data=? WHERE id=1")
          .run(
            JSON.stringify({
              ...originalSettings,
              companyName: "Değişen Sentetik Firma",
            }),
          );
        const row = app.locals.db
          .prepare("SELECT data FROM inquiries WHERE id=?")
          .get(inquiryId) as any;
        app.locals.db
          .prepare("UPDATE inquiries SET data=? WHERE id=?")
          .run(
            JSON.stringify({
              ...JSON.parse(row.data),
              name: "Değişen Görüşme Adı",
              email: "later-recipient@example.com",
            }),
            inquiryId,
          );
        const repeated = await request(
          `/api/admin/offers/${offerId}/publish`,
          "POST",
          {},
          admin,
        );
        assert.equal(repeated.status, 200);
        const unchanged = (await repeated.json()).offer;
        assert.deepEqual(unchanged.companySnapshot, issued.companySnapshot);
        assert.deepEqual(unchanged.customerSnapshot, issued.customerSnapshot);
        assert.equal(unchanged.publishedAt, issued.publishedAt);
        const jobs = app.locals.db
          .prepare(
            "SELECT payload,status FROM portal_outbox WHERE json_extract(payload,'$.offerId')=?",
          )
          .all(offerId) as any[];
        assert.equal(jobs.length, 1);
        assert.equal(jobs[0].status, "waiting_configuration");
        const payload = JSON.parse(jobs[0].payload);
        assert.equal(payload.email, submission.email);
        assert.match(payload.text, /TOPLAM/);
        assert.equal(payload.quote.totalMinor, 3441);
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}`,
              "PUT",
              { ...input, totalMinor: 1 },
              admin,
            )
          ).status,
          409,
        );
      },
    );

    await t.test(
      "A revision is a separate draft and only issued versions appear to the customer",
      async () => {
        const response = await request(
          `/api/admin/project-requests/${inquiryId}/offers`,
          "POST",
          { ...input, title: "Sentetik revize önerisi" },
          admin,
        );
        assert.equal(response.status, 201);
        const revision = (await response.json()).offer;
        revisionId = revision.id;
        assert.equal(revision.version, 2);
        assert.notEqual(revisionId, offerId);
        const update = await request(
          `/api/admin/offers/${revisionId}`,
          "PUT",
          {
            ...input,
            title: "Düzenlenmiş sentetik revize",
            items: [
              {
                description: "Yeni kalem",
                quantity: "0.001",
                unit: "m",
                unitPrice: "100.00",
              },
            ],
            vatRate: 0,
          },
          admin,
        );
        assert.equal(update.status, 200);
        assert.equal((await update.json()).offer.totalMinor, 10);
        const visible = await (
          await request(
            `/api/customer/inquiries/${inquiryId}/offers`,
            "GET",
            undefined,
            owner,
          )
        ).json();
        assert.deepEqual(
          visible.offers.map((offer: any) => offer.id),
          [offerId],
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${revisionId}/email.eml`,
              "GET",
              undefined,
              admin,
            )
          ).status,
          409,
        );
      },
    );

    await t.test(
      "PDF and email drafts keep the original recipient and encode long Unicode subjects without injected headers",
      async () => {
        const pdf = await request(
          `/api/customer/offers/${offerId}/pdf`,
          "GET",
          undefined,
          owner,
        );
        assert.equal(pdf.status, 200);
        assert.match(
          pdf.headers.get("content-disposition") || "",
          /attachment/,
        );
        assert.match(pdf.headers.get("cache-control") || "", /private/);
        assert.equal(
          Buffer.from(await pdf.arrayBuffer())
            .subarray(0, 5)
            .toString(),
          "%PDF-",
        );
        const response = await request(
          `/api/admin/offers/${offerId}/email.eml`,
          "GET",
          undefined,
          admin,
        );
        assert.equal(response.status, 200);
        const eml = await response.text();
        const header = eml.split("\r\n\r\n", 1)[0];
        assert.match(
          header,
          new RegExp(
            `^To: ${submission.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
            "m",
          ),
        );
        assert.doesNotMatch(header, /^Bcc:|later-recipient@example\.com/im);
        assert.match(header, /^X-Unsent: 1$/m);
        const subject =
          /^Subject: ([\s\S]*?)(?=\r\n[^ ])/m.exec(header)?.[1] || "";
        const words = [...subject.matchAll(/=\?UTF-8\?B\?([^?]+)\?=/g)];
        assert.ok(words.length > 1);
        assert.ok(words.every((word) => word[0].length <= 75));
        const decoded = words
          .map((word) => Buffer.from(word[1], "base64").toString("utf8"))
          .join("");
        assert.match(decoded, /Ölçü 📐/);
        assert.ok(
          !decoded.includes("\r") &&
            !decoded.includes("\n") &&
            !decoded.includes("�"),
        );
        assert.match(eml, /Content-Type: application\/pdf/);
        const attachment =
          /Content-Disposition: attachment; filename="[^"]+"\r\n\r\n([\s\S]*?)\r\n--/.exec(
            eml,
          )?.[1] || "";
        assert.equal(
          Buffer.from(attachment.replace(/\s/g, ""), "base64")
            .subarray(0, 5)
            .toString(),
          "%PDF-",
        );
      },
    );

    await t.test(
      "Manual contact is operator-recorded and a phone number alone does not grant a call preference",
      async () => {
        const phone = await request(
          `/api/admin/offers/${offerId}/contact`,
          "POST",
          { channel: "phone", note: "Sentetik izinli arama kaydı" },
          admin,
        );
        assert.equal(phone.status, 201);
        const withContact = (await phone.json()).offer;
        assert.equal(withContact.contacts.length, 1);
        assert.equal(withContact.contacts[0].channel, "phone");
        assert.equal(withContact.emailDelivery.status, "waiting_configuration");
        const ownerView = await (
          await request(
            `/api/customer/inquiries/${inquiryId}/offers`,
            "GET",
            undefined,
            owner,
          )
        ).json();
        assert.equal("contacts" in ownerView.offers[0], false);
        assert.equal("emailDelivery" in ownerView.offers[0], false);
        const noCall = await request("/api/project-requests", "POST", {
          ...submission,
          phoneRequested: false,
          email: "do-not-call@example.com",
        });
        assert.equal(noCall.status, 201);
        noCallId = (await noCall.json()).id;
        const draft = await request(
          `/api/admin/project-requests/${noCallId}/offers`,
          "POST",
          { ...input, title: "Yalnızca e-posta teklifi" },
          admin,
        );
        assert.equal(draft.status, 201);
        const noCallOffer = (await draft.json()).offer.id;
        assert.equal(
          (
            await request(
              `/api/admin/offers/${noCallOffer}/publish`,
              "POST",
              {},
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${noCallOffer}/contact`,
              "POST",
              { channel: "phone", note: "İzinsiz arama denemesi" },
              admin,
            )
          ).status,
          409,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${noCallOffer}/contact`,
              "POST",
              {
                channel: "email",
                note: "Kendi posta hesabından gönderildiği operatörce kaydedildi",
              },
              admin,
            )
          ).status,
          201,
        );
      },
    );

    await t.test(
      "Scoped operators cannot use known offer identifiers to escape their request or role",
      async () => {
        const teamResponse = await request(
          "/api/admin/teams",
          "POST",
          { name: "Sentetik İç Ekip", phone: "05000000001", active: true },
          admin,
        );
        assert.equal(teamResponse.status, 201);
        const teamId = (await teamResponse.json()).team.id;
        for (const [username, role, more] of [
          ["proposal_manager", "manager", { region: "Etimesgut" }],
          ["proposal_technician", "technician", { teamId }],
        ] as const) {
          const staffPassword = secret();
          assert.equal(
            (
              await request(
                "/api/admin/staff",
                "POST",
                { username, password: staffPassword, role, ...more },
                admin,
              )
            ).status,
            201,
          );
          const logged = await request("/api/staff/login", "POST", {
            username,
            password: staffPassword,
          });
          assert.equal(logged.status, 200);
          if (role === "manager") manager = cookie(logged, "kilinc_staff");
          else technician = cookie(logged, "kilinc_staff");
        }
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${inquiryId}/offers`,
              "GET",
              undefined,
              manager,
            )
          ).status,
          200,
        );
        const externalRequest = await request("/api/project-requests", "POST", {
          ...submission,
          district: "Çankaya",
          email: "other-area@example.com",
        });
        assert.equal(externalRequest.status, 201);
        const otherId = (await externalRequest.json()).id;
        const otherDraft = await request(
          `/api/admin/project-requests/${otherId}/offers`,
          "POST",
          { ...input, title: "Diğer kapsam" },
          admin,
        );
        assert.equal(otherDraft.status, 201);
        const otherOffer = (await otherDraft.json()).offer.id;
        assert.equal(
          (
            await request(
              `/api/admin/offers/${otherOffer}/publish`,
              "POST",
              {},
              manager,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${otherOffer}/pdf`,
              "GET",
              undefined,
              manager,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/pipeline/${inquiryId}`,
              "PATCH",
              { teamId },
              admin,
            )
          ).status,
          200,
        );
        const staffView = await request(
          `/api/admin/project-requests/${inquiryId}/offers`,
          "GET",
          undefined,
          technician,
        );
        assert.equal(staffView.status, 200);
        assert.deepEqual(
          (await staffView.json()).offers.map((offer: any) => offer.id),
          [offerId],
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${revisionId}/pdf`,
              "GET",
              undefined,
              technician,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/email.eml`,
              "GET",
              undefined,
              technician,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/contact`,
              "POST",
              { channel: "email", note: "Yetkisiz gönderim kaydı" },
              technician,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/customer/offers/${otherOffer}/pdf`,
              "GET",
              undefined,
              owner,
            )
          ).status,
          404,
        );
      },
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
    for (const key of keys)
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
  }
});
