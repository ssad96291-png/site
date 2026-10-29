import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { createApp } from "./app.js";

const secret = () => randomBytes(24).toString("base64url");
const cookie = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith(name + "="))
    ?.split(";")[0] || "";
const dxf = Buffer.from(
  "0\nSECTION\n2\nHEADER\n9\n$ACADVER\n1\nAC1032\n0\nENDSEC\n0\nEOF\n",
);

function storedFiles(directory: string): string[] {
  const paths: string[] = [];
  function walk(folder: string, relative = "") {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = relative ? relative + "/" + entry.name : entry.name;
      if (entry.isDirectory()) walk(join(folder, entry.name), path);
      else if (!/^site\.sqlite(?:-wal|-shm)?$/.test(path)) paths.push(path);
    }
  }
  walk(directory);
  return paths.sort();
}

test("Project receipts, private uploads and issued offers resist cross-request access", async (t) => {
  const dataDir = mkdtempSync(join(tmpdir(), "kilinc-project-boundaries-"));
  const password = secret();
  const prior = Object.fromEntries(
    [
      "ADMIN_PASSWORD",
      "NOTIFY_WEBHOOK_URL",
      "NOTIFY_ALLOWED_HOSTS",
      "NOTIFY_WEBHOOK_TOKEN",
    ].map((key) => [key, process.env[key]]),
  );
  process.env.ADMIN_PASSWORD = password;
  // This independent test must never contact a real provider configured by an operator.
  process.env.NOTIFY_WEBHOOK_URL = "";
  process.env.NOTIFY_ALLOWED_HOSTS = "";
  process.env.NOTIFY_WEBHOOK_TOKEN = "";
  const app = createApp({ dataDir, production: false });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (path: string, method = "GET", body?: unknown, auth = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(auth ? { Cookie: auth } : {}),
        ...(body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(body !== undefined
        ? { body: body instanceof FormData ? body : JSON.stringify(body) }
        : {}),
    });
  const form = (
    files: Array<{ name: string; bytes: Buffer; type?: string }>,
  ) => {
    const body = new FormData();
    for (const file of files)
      body.append(
        "files",
        new Blob([new Uint8Array(file.bytes)], {
          type: file.type || "application/octet-stream",
        }),
        file.name,
      );
    return body;
  };
  const submission = {
    name: "Synthetic Plan Owner",
    email: "same-address-project@example.com",
    phone: "05000000000",
    phoneRequested: false,
    requestType: "project",
    product: "Cam balkon",
    district: "Etimesgut",
    message: "Synthetic project drawing for independent authorization checks.",
    consent: true,
  };
  let admin = "",
    alice = "",
    bob = "",
    registered = "";
  let aliceId = "",
    bobId = "",
    aliceCustomerId = "",
    bobCustomerId = "",
    fileId = "",
    offerId = "";
  try {
    const login = await request("/api/admin/login", "POST", {
      username: "admin",
      password,
    });
    assert.equal(login.status, 200);
    admin = cookie(login, "kilinc_session");

    await t.test(
      "Same-email guests and a later registered account remain distinct owners",
      async () => {
        const firstResponse = await request(
          "/api/project-requests",
          "POST",
          submission,
        );
        assert.equal(firstResponse.status, 201);
        const first = await firstResponse.json();
        aliceId = first.id;
        const secondResponse = await request("/api/project-requests", "POST", {
          ...submission,
          name: "Synthetic Other Plan Owner",
        });
        assert.equal(secondResponse.status, 201);
        const second = await secondResponse.json();
        bobId = second.id;
        assert.notEqual(aliceId, bobId);
        assert.notEqual(first.trackingToken, second.trackingToken);
        for (const [receipt, set] of [
          [
            first,
            (value: string) => {
              alice = value;
            },
          ],
          [
            second,
            (value: string) => {
              bob = value;
            },
          ],
        ] as const) {
          const claimed = await request("/api/customer/claim", "POST", {
            token: receipt.trackingToken,
          });
          assert.equal(claimed.status, 200);
          const claim = await claimed.json();
          assert.equal(claim.scoped, true);
          set(cookie(claimed, "kilinc_customer"));
          if (receipt.id === aliceId) aliceCustomerId = claim.customer.id;
          if (receipt.id === bobId) bobCustomerId = claim.customer.id;
        }
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${bobId}/project-files`,
              "GET",
              undefined,
              alice,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "GET",
              undefined,
              bob,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "POST",
              form([{ name: "cross-owner.dxf", bytes: dxf }]),
              bob,
            )
          ).status,
          404,
        );
        const account = await request("/api/customer/register", "POST", {
          name: "Synthetic Registered Same Email",
          email: submission.email,
          password: secret(),
        });
        assert.equal(account.status, 201);
        registered = cookie(account, "kilinc_customer");
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "GET",
              undefined,
              registered,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${bobId}/offers`,
              "GET",
              undefined,
              registered,
            )
          ).status,
          404,
        );
        const list = await (
          await request("/api/customer/inquiries", "GET", undefined, registered)
        ).json();
        assert.deepEqual(list.inquiries, []);
      },
    );

    await t.test(
      "Reply addresses cannot become multiple MIME recipients or injected headers",
      async () => {
        const before = (
          app.locals.db
            .prepare("SELECT count(*) AS count FROM project_requests")
            .get() as any
        ).count;
        for (const email of [
          "first,second@example.com",
          "first;second@example.com",
          "<recipient@example.com>",
          "recipient@example.com\r\nBcc: other@example.com",
        ]) {
          const response = await request("/api/project-requests", "POST", {
            ...submission,
            email,
          });
          assert.equal(response.status, 400, JSON.stringify(email));
        }
        assert.equal(
          (
            app.locals.db
              .prepare("SELECT count(*) AS count FROM project_requests")
              .get() as any
          ).count,
          before,
        );
      },
    );

    await t.test(
      "Unauthorized and malformed multipart requests leave no private file behind",
      async () => {
        const before = storedFiles(dataDir);
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "POST",
              form([{ name: "anonymous.dxf", bytes: dxf }]),
            )
          ).status,
          401,
        );
        assert.deepEqual(storedFiles(dataDir), before);
        const uploaded = await request(
          `/api/customer/inquiries/${aliceId}/project-files`,
          "POST",
          form([{ name: "client-plan.dxf", bytes: dxf }]),
          alice,
        );
        assert.equal(uploaded.status, 201);
        const uploadedBody = await uploaded.json();
        const files = uploadedBody.files;
        assert.ok(Array.isArray(files) && files.length === 1);
        fileId = files[0].id;
        assert.ok(fileId);
        const stable = storedFiles(dataDir);
        const invalid = [
          {
            name: "image.png",
            bytes: Buffer.from(
              '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
            ),
          },
          {
            name: "drawing.dxf",
            bytes: Buffer.from("<!doctype html><script>alert(1)</script>"),
          },
          {
            name: "proposal.pdf.exe",
            bytes: Buffer.from(
              "%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\n%%EOF",
            ),
          },
          {
            name: "active.pdf",
            bytes: Buffer.from(
              "%PDF-1.7\n1 0 obj<</OpenAction<</S/JavaScript/JS(alert(1))>>>>endobj\n%%EOF",
            ),
          },
          {
            name: "project.zip",
            bytes: Buffer.from(
              "PK\u0003\u0004not-an-allowed-project-container",
            ),
          },
          { name: "payload.exe.dxf", bytes: dxf },
          { name: "encoded%2fpath.dxf", bytes: dxf },
          {
            name: "late-active.pdf",
            bytes: Buffer.concat([
              Buffer.from("%PDF-1.7\n"),
              Buffer.alloc(100_000, 32),
              Buffer.from("/Java#53cript /JS(alert(1))\n%%EOF"),
            ]),
          },
        ];
        for (const file of invalid) {
          assert.equal(
            (
              await request(
                `/api/customer/inquiries/${aliceId}/project-files`,
                "POST",
                form([file]),
                alice,
              )
            ).status,
            400,
            file.name,
          );
          assert.deepEqual(
            storedFiles(dataDir),
            stable,
            `${file.name} must not leave a staged file`,
          );
        }
        const overflow = await request(
          `/api/customer/inquiries/${aliceId}/project-files`,
          "POST",
          form(
            [1, 2, 3, 4].map((value) => ({
              name: `overflow-${value}.dxf`,
              bytes: dxf,
            })),
          ),
          alice,
        );
        assert.ok([400, 409, 413].includes(overflow.status));
        assert.deepEqual(storedFiles(dataDir), stable);
        const overSize = Buffer.alloc(20 * 1024 * 1024 + 1);
        overSize.write("AC1032");
        const oversized = await request(
          `/api/customer/inquiries/${aliceId}/project-files`,
          "POST",
          form([{ name: "too-large.dwg", bytes: overSize }]),
          alice,
        );
        assert.equal(oversized.status, 413);
        assert.deepEqual(storedFiles(dataDir), stable);
      },
    );

    await t.test(
      "Private CAD downloads require the matching receipt and are always attachments",
      async () => {
        const route = `/api/customer/project-files/${fileId}/download`;
        assert.equal((await request(route)).status, 401);
        assert.equal((await request(route, "GET", undefined, bob)).status, 404);
        assert.equal(
          (await request(route, "GET", undefined, registered)).status,
          404,
        );
        const download = await request(route, "GET", undefined, alice);
        assert.equal(download.status, 200);
        assert.match(
          download.headers.get("content-disposition") || "",
          /^attachment;/,
        );
        assert.equal(download.headers.get("x-content-type-options"), "nosniff");
        assert.equal(
          download.headers.get("content-type"),
          "application/octet-stream",
        );
        assert.equal(
          (await request(route + "?token=" + encodeURIComponent(alice))).status,
          401,
          "A query parameter cannot substitute for an authenticated session",
        );
        assert.match(
          download.headers.get("content-security-policy") || "",
          /sandbox/,
        );
        assert.deepEqual(Buffer.from(await download.arrayBuffer()), dxf);
        const publicSite = await (await request("/api/site")).text();
        assert.ok(
          !publicSite.includes("client-plan.dxf") &&
            !publicSite.includes(fileId),
        );
        const file = (
          await (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "GET",
              undefined,
              alice,
            )
          ).json()
        ).files[0];
        assert.ok(!("filename" in file) && !("path" in file));
        assert.equal((await request(`/uploads/${fileId}.dxf`)).status, 404);
      },
    );

    await t.test(
      "Drafts stay private, totals are computed on the server and publication is immutable",
      async () => {
        const draftInput = {
          title: "Synthetic measured proposal\r\nBcc: never-send@example.com",
          currency: "TRY",
          items: [
            {
              description: "Synthetic panel item",
              quantity: 3,
              unit: "adet",
              unitPrice: 12.34,
            },
          ],
          vatRate: 20,
          validUntil: "2030-01-15",
          notes: "PRIVATE_DRAFT_TERMS_CANARY",
          subtotalMinor: 1,
          taxMinor: 1,
          totalMinor: 1,
        };
        const created = await request(
          `/api/admin/project-requests/${aliceId}/offers`,
          "POST",
          draftInput,
          admin,
        );
        assert.equal(created.status, 201);
        const draft = (await created.json()).offer;
        offerId = draft.id;
        assert.equal(draft.subtotalMinor, 3702);
        assert.equal(draft.taxMinor, 740);
        assert.equal(draft.totalMinor, 4442);
        const customerDrafts = await request(
          `/api/customer/inquiries/${aliceId}/offers?includeDrafts=true`,
          "GET",
          undefined,
          alice,
        );
        assert.equal(customerDrafts.status, 200);
        assert.deepEqual((await customerDrafts.json()).offers, []);
        assert.equal(
          (
            await request(
              `/api/customer/offers/${offerId}/pdf`,
              "GET",
              undefined,
              alice,
            )
          ).status,
          404,
        );
        assert.equal(
          (await request(`/api/admin/offers/${offerId}/email.eml`)).status,
          401,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${aliceId}/offers`,
              "POST",
              {
                ...draftInput,
                items: [{ ...draftInput.items[0], quantity: -1 }],
              },
              admin,
            )
          ).status,
          400,
        );
        const published = await request(
          `/api/admin/offers/${offerId}/publish`,
          "POST",
          {},
          admin,
        );
        assert.ok([200, 201].includes(published.status));
        assert.equal((await published.json()).offer.status, "published");
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/publish`,
              "POST",
              {},
              admin,
            )
          ).status,
          200,
        );
        const jobs = app.locals.db
          .prepare("SELECT id,status,payload FROM portal_outbox")
          .all() as Array<{ id: string; status: string; payload: string }>;
        const offerJobs = jobs.filter(
          (job) => JSON.parse(job.payload).offerId === offerId,
        );
        assert.equal(offerJobs.length, 1);
        assert.equal(offerJobs[0].status, "waiting_configuration");
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}`,
              "PUT",
              { ...draftInput, notes: "Attempted replacement terms" },
              admin,
            )
          ).status,
          409,
        );
        const ownerOffers = await (
          await request(
            `/api/customer/inquiries/${aliceId}/offers`,
            "GET",
            undefined,
            alice,
          )
        ).json();
        assert.equal(ownerOffers.offers.length, 1);
        assert.equal(ownerOffers.offers[0].notes, draftInput.notes);
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/offers`,
              "GET",
              undefined,
              bob,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/customer/offers/${offerId}/pdf`,
              "GET",
              undefined,
              bob,
            )
          ).status,
          404,
        );
        const pdf = await request(
          `/api/customer/offers/${offerId}/pdf`,
          "GET",
          undefined,
          alice,
        );
        assert.equal(pdf.status, 200);
        assert.equal(
          Buffer.from(await pdf.arrayBuffer())
            .subarray(0, 5)
            .toString(),
          "%PDF-",
        );
        const eml = await request(
          `/api/admin/offers/${offerId}/email.eml`,
          "GET",
          undefined,
          admin,
        );
        assert.equal(eml.status, 200);
        const draftMail = await eml.text();
        const headers = draftMail.split(/\r?\n\r?\n/, 1)[0];
        assert.match(headers, /^To: same-address-project@example\.com$/m);
        assert.ok(
          !headers.includes("never-send@example.com"),
          "Untrusted title must remain encoded inside Subject",
        );
        assert.doesNotMatch(headers, /^Bcc:/im);
        assert.match(draftMail, /application\/pdf/i);
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/contact`,
              "POST",
              { channel: "phone", note: "Unrequested phone call" },
              admin,
            )
          ).status,
          409,
        );
        const savedOffer = JSON.parse(
          (
            app.locals.db
              .prepare("SELECT data FROM portal_offers WHERE id=?")
              .get(offerId) as any
          ).data,
        );
        assert.deepEqual(
          savedOffer.contacts,
          [],
          "Rejected phone contact must not be recorded",
        );
        assert.equal(
          (
            await request(
              `/api/customer/project-files/${fileId}`,
              "DELETE",
              undefined,
              alice,
            )
          ).status,
          409,
        );
      },
    );

    await t.test(
      "Project files and financial operations preserve technician, editor and manager scopes",
      async () => {
        const teamResponse = await request(
          "/api/admin/teams",
          "POST",
          {
            name: "Synthetic boundary technical team",
            contactName: "Synthetic technician",
            phone: "05000000001",
            email: "tech-boundary@example.com",
            active: true,
          },
          admin,
        );
        assert.equal(teamResponse.status, 201);
        const teamId = (await teamResponse.json()).team.id;
        const staff = async (
          role: "technician" | "editor" | "manager",
          region = "",
        ) => {
          const staffPassword = secret();
          const username = "project_qa_" + randomBytes(5).toString("hex");
          const created = await request(
            "/api/admin/staff",
            "POST",
            {
              username,
              password: staffPassword,
              role,
              ...(role === "technician" ? { teamId } : {}),
              ...(role === "manager" ? { region } : {}),
            },
            admin,
          );
          assert.equal(created.status, 201);
          const id = (await created.json()).staff.id;
          const logged = await request("/api/staff/login", "POST", {
            username,
            password: staffPassword,
          });
          assert.equal(logged.status, 200);
          return { id, cookie: cookie(logged, "kilinc_staff") };
        };
        const tech = await staff("technician");
        const editor = await staff("editor");
        const outside = await staff("manager", "Çankaya");
        const inside = await staff("manager", "Etimesgut");
        const fileRoute = `/api/admin/project-files/${fileId}/download`;
        assert.equal(
          (await request(fileRoute, "GET", undefined, tech.cookie)).status,
          403,
        );
        assert.deepEqual(
          (
            await (
              await request(
                "/api/admin/project-requests",
                "GET",
                undefined,
                tech.cookie,
              )
            ).json()
          ).requests,
          [],
        );
        assert.equal(
          (
            await request(
              `/api/admin/pipeline/${aliceId}`,
              "PATCH",
              { teamId },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request(fileRoute, "GET", undefined, tech.cookie)).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${bobId}/project-files`,
              "GET",
              undefined,
              tech.cookie,
            )
          ).status,
          403,
        );
        const draftInput = {
          title: "PRIVATE_UNPUBLISHED_TECH_CANARY",
          currency: "TRY",
          items: [
            {
              description: "Synthetic technical review",
              quantity: 1,
              unit: "adet",
              unitPrice: 10,
            },
          ],
          vatRate: 20,
          validUntil: "2030-01-15",
          notes: "PRIVATE_UNPUBLISHED_TERMS_CANARY",
        };
        const draftResponse = await request(
          `/api/admin/project-requests/${aliceId}/offers`,
          "POST",
          draftInput,
          admin,
        );
        assert.equal(draftResponse.status, 201);
        const draftId = (await draftResponse.json()).offer.id;
        const visible = await request(
          `/api/admin/project-requests/${aliceId}/offers`,
          "GET",
          undefined,
          tech.cookie,
        );
        assert.equal(visible.status, 200);
        const visibleBody = await visible.text();
        assert.doesNotMatch(
          visibleBody,
          /PRIVATE_UNPUBLISHED_TECH_CANARY|PRIVATE_UNPUBLISHED_TERMS_CANARY/,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${draftId}/pdf`,
              "GET",
              undefined,
              tech.cookie,
            )
          ).status,
          404,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${aliceId}/offers`,
              "POST",
              draftInput,
              tech.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}`,
              "PUT",
              draftInput,
              tech.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/publish`,
              "POST",
              {},
              tech.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/email.eml`,
              "GET",
              undefined,
              tech.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/contact`,
              "POST",
              { channel: "email", note: "Unauthorized attempt" },
              tech.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-files/${fileId}`,
              "DELETE",
              undefined,
              tech.cookie,
            )
          ).status,
          403,
        );
        for (const route of [
          "/api/admin/project-requests",
          `/api/admin/project-requests/${aliceId}/project-files`,
          `/api/admin/project-requests/${aliceId}/offers`,
          fileRoute,
        ]) {
          assert.equal(
            (await request(route, "GET", undefined, editor.cookie)).status,
            403,
          );
        }
        assert.deepEqual(
          (
            await (
              await request(
                "/api/admin/project-requests",
                "GET",
                undefined,
                outside.cookie,
              )
            ).json()
          ).requests,
          [],
        );
        assert.equal(
          (await request(fileRoute, "GET", undefined, outside.cookie)).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${aliceId}/offers`,
              "POST",
              draftInput,
              outside.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request(
              `/api/admin/offers/${offerId}/publish`,
              "POST",
              {},
              outside.cookie,
            )
          ).status,
          403,
        );
        assert.equal(
          (await request(fileRoute, "GET", undefined, inside.cookie)).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/api/admin/project-requests/${aliceId}/offers`,
              "GET",
              undefined,
              inside.cookie,
            )
          ).status,
          200,
        );
        assert.equal(
          (
            await request(
              `/api/admin/staff/${tech.id}`,
              "PATCH",
              { status: "suspended" },
              admin,
            )
          ).status,
          200,
        );
        assert.equal(
          (await request(fileRoute, "GET", undefined, tech.cookie)).status,
          401,
        );
      },
    );

    await t.test(
      "Session revocation and suspension during a streamed upload reject the final commit",
      async () => {
        assert.ok(bobCustomerId);
        const streamed = async (
          auth: string,
          revoke: () => Promise<Response>,
        ) => {
          const before = storedFiles(dataDir);
          const countBefore = (
            app.locals.db
              .prepare(
                "SELECT count(*) AS count FROM project_files WHERE inquiryId=?",
              )
              .get(bobId) as any
          ).count;
          const boundary =
            "project_boundary_" + randomBytes(12).toString("hex");
          let resolveResponse!: (value: {
            status: number;
            body: string;
          }) => void;
          let rejectResponse!: (error: Error) => void;
          const result = new Promise<{ status: number; body: string }>(
            (resolve, reject) => {
              resolveResponse = resolve;
              rejectResponse = reject;
            },
          );
          const stream = httpRequest(
            base + `/api/customer/inquiries/${bobId}/project-files`,
            {
              method: "POST",
              headers: {
                Cookie: auth,
                "Content-Type": `multipart/form-data; boundary=${boundary}`,
                "Transfer-Encoding": "chunked",
              },
            },
            (response) => {
              let body = "";
              response.on("data", (part: Buffer) => {
                body += part.toString("utf8");
              });
              response.on("end", () =>
                resolveResponse({ status: response.statusCode || 0, body }),
              );
              response.on("error", rejectResponse);
            },
          );
          stream.on("error", rejectResponse);
          stream.setTimeout(5000, () =>
            stream.destroy(new Error("Synthetic stream timed out")),
          );
          try {
            stream.write(
              `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="revoked-during-stream.dxf"\r\nContent-Type: application/octet-stream\r\n\r\n0\nSECTION\n2\nHEADER\n`,
            );
            const deadline = Date.now() + 3000;
            while (
              !readdirSync(join(dataDir, "project-files")).some((name) =>
                name.endsWith(".tmp"),
              )
            ) {
              assert.ok(
                Date.now() < deadline,
                "Server must start the temporary upload before credentials are revoked",
              );
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            assert.equal((await revoke()).status, 200);
            stream.end(`0\nENDSEC\n0\nEOF\n\r\n--${boundary}--\r\n`);
            const response = await result;
            assert.equal(response.status, 401, response.body);
            assert.equal(
              (
                app.locals.db
                  .prepare(
                    "SELECT count(*) AS count FROM project_files WHERE inquiryId=?",
                  )
                  .get(bobId) as any
              ).count,
              countBefore,
            );
            assert.deepEqual(
              storedFiles(dataDir),
              before,
              "Rejected in-flight upload must remove every temporary or committed file",
            );
          } finally {
            stream.destroy();
          }
        };
        await streamed(bob, () =>
          request(
            `/api/admin/customers/${bobCustomerId}/revoke`,
            "POST",
            {},
            admin,
          ),
        );
        const recovery = await request(
          `/api/admin/customers/${bobCustomerId}/recovery`,
          "POST",
          {},
          admin,
        );
        assert.equal(recovery.status, 200);
        const recoveryUrl = new URL((await recovery.json()).url, base);
        const token = new URLSearchParams(recoveryUrl.hash.slice(1)).get(
          "claim",
        );
        assert.ok(token);
        const claim = await request("/api/customer/claim", "POST", { token });
        assert.equal(claim.status, 200);
        bob = cookie(claim, "kilinc_customer");
        await streamed(bob, () =>
          request(
            `/api/admin/customers/${bobCustomerId}`,
            "PATCH",
            { status: "suspended" },
            admin,
          ),
        );
      },
    );

    await t.test(
      "A suspended receipt owner immediately loses attachment and offer access",
      async () => {
        assert.ok(aliceCustomerId);
        const changed = await request(
          `/api/admin/customers/${aliceCustomerId}`,
          "PATCH",
          { status: "suspended" },
          admin,
        );
        assert.equal(changed.status, 200);
        assert.equal(
          (
            await request(
              `/api/customer/project-files/${fileId}/download`,
              "GET",
              undefined,
              alice,
            )
          ).status,
          401,
        );
        assert.equal(
          (
            await request(
              `/api/customer/offers/${offerId}/pdf`,
              "GET",
              undefined,
              alice,
            )
          ).status,
          401,
        );
        assert.equal(
          (
            await request(
              `/api/customer/inquiries/${aliceId}/project-files`,
              "POST",
              form([{ name: "after-suspension.dxf", bytes: dxf }]),
              alice,
            )
          ).status,
          401,
        );
      },
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    rmSync(dataDir, { recursive: true, force: true });
    for (const [key, value] of Object.entries(prior)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
