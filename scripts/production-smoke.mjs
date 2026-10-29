// npm run build && npm run build:server && node scripts/production-smoke.mjs
// Checks the compiled production process with disposable data and credentials.
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { startTestScanner } from "../server/scanner-fixture.test-helper.ts";
const testScanner = await startTestScanner();
const dir = await mkdtemp(join(tmpdir(), "kilinc-production-"));
const reserved = createServer();
await new Promise((r) => reserved.listen(0, "127.0.0.1", r));
const port = reserved.address().port;
await new Promise((r) => reserved.close(r));
const base = `http://127.0.0.1:${port}`;
const password = randomBytes(24).toString("base64url");
const child = spawn(process.execPath, ["build-server/production.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    PORT: String(port),
    APP_HOST: "127.0.0.1",
    DATA_DIR: dir,
    DATA_ENCRYPTION_KEY: randomBytes(32).toString("base64"),
    CLAMAV_HOST: testScanner.host,
    CLAMAV_PORT: testScanner.port,
    ADMIN_PASSWORD: password,
    PUBLIC_ORIGIN: "https://example.invalid",
    NOTIFY_WEBHOOK_URL: "",
    NOTIFY_WEBHOOK_TOKEN: "",
    NOTIFY_ALLOWED_HOSTS: "",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
child.stdout.resume();
child.stderr.resume();
const request = (path, method = "GET", data, cookie = "") =>
  fetch(base + path, {
    method,
    headers: {
      ...(data === undefined ? {} : { "Content-Type": "application/json" }),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
const cookie = (response, name) => {
  const value = response.headers
    .getSetCookie()
    .find((s) => s.startsWith(name + "="));
  assert.ok(value);
  assert.match(value, /Secure/);
  assert.match(value, /HttpOnly/);
  assert.match(value, /SameSite=Lax/);
  assert.match(value, /Path=\//);
  return value.split(";")[0];
};
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    try {
      ready = (await request("/api/health")).ok;
      if (ready) break;
    } catch {}
    if (child.exitCode !== null) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.ok(ready, "compiled production server starts");
  const health = await request("/api/health");
  assert.match(
    health.headers.get("content-security-policy"),
    /frame-ancestors 'none'/,
  );
  assert.match(
    health.headers.get("strict-transport-security"),
    /max-age=31536000/,
  );
  const lead = await request("/api/inquiries", "POST", {
    name: "Production Test",
    email: "production@example.com",
    phone: "05000000000",
    message: "Only isolated production test data.",
    consent: true,
  });
  assert.equal(lead.status, 201);
  const receipt = await lead.json();
  const claim = await request("/api/customer/claim", "POST", {
    token: receipt.trackingToken,
  });
  assert.equal(claim.status, 200);
  const owner = cookie(claim, "__Host-kilinc_customer");
  assert.equal(
    (
      await request("/api/customer/claim", "POST", {
        token: receipt.trackingToken,
      })
    ).status,
    400,
  );
  assert.equal(
    (await request("/api/customer/inquiries", "GET", undefined, owner)).status,
    200,
  );
  const login = await request("/api/admin/login", "POST", {
    username: "admin",
    password,
  });
  assert.equal(login.status, 200);
  const admin = cookie(login, "__Host-kilinc_session");
  const staffPass = randomBytes(24).toString("base64url");
  assert.equal(
    (
      await request(
        "/api/admin/staff",
        "POST",
        { username: "production.editor", password: staffPass, role: "editor" },
        admin,
      )
    ).status,
    201,
  );
  const signed = await request("/api/staff/login", "POST", {
    username: "production.editor",
    password: staffPass,
  });
  assert.equal(signed.status, 200);
  const editor = cookie(signed, "__Host-kilinc_staff");
  assert.equal(
    (await request("/api/admin/content", "GET", undefined, editor)).status,
    200,
  );
  for (const path of ["/api/admin/pipeline", "/api/admin/export"])
    assert.equal((await request(path, "GET", undefined, editor)).status, 403);
  const guide = await request("/api/measurement-guide.pdf");
  assert.equal(guide.status, 200);
  const form = new FormData();
  form.append(
    "document",
    new Blob([await guide.arrayBuffer()], { type: "application/pdf" }),
    "production-test.pdf",
  );
  const upload = await fetch(
    base + "/api/admin/pipeline/" + receipt.id + "/documents?kind=quote",
    { method: "POST", headers: { Cookie: admin }, body: form },
  );
  assert.equal(upload.status, 201);
  const document = (await upload.json()).document;
  const customerUrl = "/api/customer/documents/" + document.id + "/download";
  assert.equal((await request(customerUrl)).status, 401);
  const download = await request(customerUrl, "GET", undefined, owner);
  assert.equal(download.status, 200);
  assert.equal(
    Buffer.from(await download.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  assert.equal(
    (
      await request("/api/customer/login", "POST", {
        email: "none@example.com",
        password: "wrong",
      })
    ).status,
    401,
  );
  const projectResponse = await request("/api/project-requests", "POST", {
    name: "Production Project Test",
    email: "production-project@example.com",
    message: "Isolated compiled project quotation test.",
    requestType: "project",
    phoneRequested: false,
    consent: true,
  });
  assert.equal(projectResponse.status, 201);
  const project = await projectResponse.json();
  const projectClaim = await request("/api/customer/claim", "POST", {
    token: project.trackingToken,
  });
  assert.equal(projectClaim.status, 200);
  const projectOwner = cookie(projectClaim, "__Host-kilinc_customer");
  const drawing = new FormData();
  drawing.append(
    "files",
    new Blob(["0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n"], {
      type: "application/octet-stream",
    }),
    "production-plan.dxf",
  );
  const drawingResponse = await fetch(
    base + `/api/customer/inquiries/${project.id}/project-files`,
    {
      method: "POST",
      headers: { Cookie: projectOwner },
      body: drawing,
    },
  );
  assert.equal(drawingResponse.status, 201);
  const uploaded = (await drawingResponse.json()).files[0];
  assert.equal((await request(uploaded.downloadUrl)).status, 401);
  assert.equal(
    (await request(uploaded.downloadUrl, "GET", undefined, owner)).status,
    404,
  );
  const drawingDownload = await request(
    uploaded.downloadUrl,
    "GET",
    undefined,
    projectOwner,
  );
  assert.equal(drawingDownload.status, 200);
  assert.match(
    drawingDownload.headers.get("content-disposition"),
    /^attachment/,
  );
  assert.equal(
    (await request("/api/admin/project-requests", "GET", undefined, editor))
      .status,
    403,
  );
  const draftResponse = await request(
    `/api/admin/project-requests/${project.id}/offers`,
    "POST",
    {
      title: "Compiled project offer",
      currency: "TRY",
      vatRate: 20,
      items: [
        {
          description: "Synthetic installation",
          quantity: 2,
          unit: "adet",
          unitPrice: 120,
        },
      ],
      validUntil: "",
      notes: "Only isolated verification data.",
    },
    admin,
  );
  assert.equal(draftResponse.status, 201);
  const draft = (await draftResponse.json()).offer;
  assert.equal(draft.totalMinor, 28800);
  const hidden = await request(
    `/api/customer/inquiries/${project.id}/offers`,
    "GET",
    undefined,
    projectOwner,
  );
  assert.deepEqual((await hidden.json()).offers, []);
  const publication = await request(
    `/api/admin/offers/${draft.id}/publish`,
    "POST",
    {},
    admin,
  );
  assert.equal(publication.status, 200);
  assert.equal(
    (await publication.json()).offer.emailDelivery.status,
    "waiting_configuration",
  );
  const proposalPdf = await request(
    `/api/customer/offers/${draft.id}/pdf`,
    "GET",
    undefined,
    projectOwner,
  );
  assert.equal(proposalPdf.status, 200);
  assert.equal(
    Buffer.from(await proposalPdf.arrayBuffer())
      .subarray(0, 5)
      .toString(),
    "%PDF-",
  );
  const eml = await request(
    `/api/admin/offers/${draft.id}/email.eml`,
    "GET",
    undefined,
    admin,
  );
  assert.equal(eml.status, 200);
  const message = await eml.text();
  assert.match(message, /To: production-project@example\.com/);
  assert.match(message, /X-Unsent: 1/);
  assert.match(message, /Content-Type: application\/pdf/);
  console.log(
    "PASS compiled production: security headers,3 Secure cookies,one-use receipt,editor boundaries,private PDF,project DXF,private draft,published offer,PDF and unsent EML",
  );
} finally {
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((r) => child.once("exit", r)),
    new Promise((r) => setTimeout(r, 2500)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
  await rm(dir, { recursive: true, force: true });
  await testScanner.close();
}
