import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { createServer, type Socket } from "node:net";
import { request as httpRequest } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApp } from "./app.js";

const dxf = Buffer.from("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n");
const pdf = Buffer.from(
  "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n",
);
const testMarker = Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE");
async function fixture(production = false) {
  const keys = [
    "ADMIN_PASSWORD",
    "CLAMAV_HOST",
    "CLAMAV_PORT",
    "CLAMAV_TIMEOUT_MS",
    "DATA_ENCRYPTION_KEY",
    "DATA_ENCRYPTION_KEY_FILE",
    "NOTIFY_WEBHOOK_URL",
    "NOTIFY_WEBHOOK_TOKEN",
    "NOTIFY_ALLOWED_HOSTS",
  ];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  const password = randomBytes(24).toString("base64url");
  process.env.ADMIN_PASSWORD = password;
  process.env.DATA_ENCRYPTION_KEY = randomBytes(32).toString("hex");
  const dir = mkdtempSync(join(tmpdir(), "kilinc-file-integration-"));
  const app = createApp({ dataDir: dir, production });
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (path: string, method = "GET", body?: any, auth = "") =>
    fetch(base + path, {
      method,
      headers: {
        ...(auth ? { Cookie: auth } : {}),
        ...(body !== undefined && !(body instanceof FormData)
          ? { "Content-Type": "application/json" }
          : {}),
      },
      ...(body === undefined
        ? {}
        : { body: body instanceof FormData ? body : JSON.stringify(body) }),
    });
  const cookie = (r: Response, name: string) =>
    r.headers
      .getSetCookie()
      .find((value) => value.startsWith(name + "="))!
      .split(";")[0];
  const login = await request("/api/admin/login", "POST", {
    username: "admin",
    password,
  });
  assert.equal(login.status, 200);
  const admin = cookie(
    login,
    production ? "__Host-kilinc_session" : "kilinc_session",
  );
  const enquiry = await request("/api/project-requests", "POST", {
    name: "Sentetik Güvenli Dosya",
    email: "scan@example.com",
    phoneRequested: false,
    requestType: "project",
    message: "Sentetik dosya tarama entegrasyon kontrolüdür.",
    consent: true,
  });
  assert.equal(enquiry.status, 201);
  const created = await enquiry.json();
  const claim = await request("/api/customer/claim", "POST", {
    token: created.trackingToken,
  });
  assert.equal(claim.status, 200);
  return {
    app,
    base,
    dir,
    request,
    admin,
    id: created.id,
    auth: cookie(
      claim,
      production ? "__Host-kilinc_customer" : "kilinc_customer",
    ),
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      app.locals.close();
      rmSync(dir, { recursive: true, force: true });
      for (const [key, value] of previous) {
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    },
  };
}
function body(bytes: Buffer, name: string, field = "files") {
  const form = new FormData();
  form.append(field, new Blob([new Uint8Array(bytes)]), name);
  return form;
}

test("Member/guest project uploads block the harmless test marker and store accepted files encrypted with honest scan metadata", async () => {
  const f = await fixture();
  try {
    const infectedPdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n"),
      testMarker,
      Buffer.from("\n%%EOF\n"),
    ]);
    const blocked = await f.request(
      `/api/customer/inquiries/${f.id}/project-files`,
      "POST",
      body(infectedPdf, "test.pdf"),
      f.auth,
    );
    assert.equal(blocked.status, 422);
    assert.equal(
      (
        f.app.locals.db
          .prepare("SELECT count(*) AS n FROM project_files")
          .get() as any
      ).n,
      0,
    );
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    const result = await f.request(
      `/api/customer/inquiries/${f.id}/project-files`,
      "POST",
      body(dxf, "drawing.dxf"),
      f.auth,
    );
    assert.equal(result.status, 201);
    const uploaded = (await result.json()).files[0];
    assert.equal(uploaded.scan.status, "limited_checks");
    assert.equal(uploaded.scan.engine, "builtin");
    const saved = f.app.locals.db
      .prepare("SELECT filename FROM project_files WHERE id=?")
      .get(uploaded.id) as any;
    const raw = readFileSync(join(f.dir, "project-files", saved.filename));
    assert.equal(raw.includes(dxf), false);
    assert.equal(raw.subarray(0, 9).toString(), "KILINCPR1");
    const download = await f.request(
      uploaded.downloadUrl,
      "GET",
      undefined,
      f.auth,
    );
    assert.equal(download.status, 200);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), dxf);
    assert.match(
      download.headers.get("content-disposition") || "",
      /attachment/,
    );
    assert.match(
      download.headers.get("content-type") || "",
      /application\/octet-stream/,
    );
  } finally {
    await f.close();
  }
});

test("An interrupted multipart stream leaves only encrypted staging bytes and removes them on abort", async () => {
  const f = await fixture();
  const boundary = "kilinc-encrypted-staging-test";
  const marker = "SENTETIK_CIZIM_GIZLI_VERISI_";
  let upload: ReturnType<typeof httpRequest> | undefined;
  try {
    const ended = new Promise<void>((resolve) => {
      upload = httpRequest(
        f.base + `/api/customer/inquiries/${f.id}/project-files`,
        {
          method: "POST",
          headers: {
            Cookie: f.auth,
            "Content-Type": `multipart/form-data; boundary=${boundary}`,
          },
        },
      );
      upload.on("error", () => resolve());
      upload.on("response", (response) => {
        response.resume();
        response.on("end", resolve);
      });
      upload.write(
        `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="private.dwg"\r\nContent-Type: application/octet-stream\r\n\r\n`,
      );
      upload.write("AC1032" + marker.repeat(2048));
    });
    let staged: string[] = [];
    for (let attempt = 0; attempt < 80; attempt++) {
      staged = readdirSync(join(f.dir, "project-files")).filter((name) =>
        name.endsWith(".tmp"),
      );
      if (
        staged.length &&
        readFileSync(join(f.dir, "project-files", staged[0])).length > 100
      )
        break;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(staged.length, 1);
    const raw = readFileSync(join(f.dir, "project-files", staged[0]));
    assert.ok(raw.length > 100);
    assert.equal(raw.includes(Buffer.from(marker)), false);
    assert.equal(raw.includes(Buffer.from("AC1032")), false);
    upload!.destroy();
    await ended;
    for (
      let attempt = 0;
      attempt < 80 && readdirSync(join(f.dir, "project-files")).length;
      attempt++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    assert.equal(
      (
        f.app.locals.db
          .prepare("SELECT count(*) AS n FROM project_files")
          .get() as any
      ).n,
      0,
    );
  } finally {
    upload?.destroy();
    await f.close();
  }
});

test("Private PDFs also require scanning and remain encrypted, while production uploads fail closed without a scanner", async () => {
  const local = await fixture();
  try {
    const infectedPdf = Buffer.concat([
      Buffer.from("%PDF-1.4\n"),
      testMarker,
      Buffer.from("\n%%EOF\n"),
    ]);
    assert.equal(
      (
        await local.request(
          `/api/admin/pipeline/${local.id}/documents`,
          "POST",
          body(infectedPdf, "test.pdf", "document"),
          local.admin,
        )
      ).status,
      422,
    );
    const uploaded = await local.request(
      `/api/admin/pipeline/${local.id}/documents`,
      "POST",
      body(pdf, "quote.pdf", "document"),
      local.admin,
    );
    assert.equal(uploaded.status, 201);
    const document = (await uploaded.json()).document;
    assert.equal(document.scan.status, "limited_checks");
    const row = local.app.locals.db
      .prepare("SELECT filename FROM portal_documents WHERE id=?")
      .get(document.id) as any;
    assert.equal(
      readFileSync(join(local.dir, "private-documents", row.filename)).includes(
        pdf,
      ),
      false,
    );
    const download = await local.request(
      `/api/customer/documents/${document.id}/download`,
      "GET",
      undefined,
      local.auth,
    );
    assert.equal(download.status, 200);
    assert.deepEqual(Buffer.from(await download.arrayBuffer()), pdf);
  } finally {
    await local.close();
  }
  const live = await fixture(true);
  try {
    assert.equal(
      (
        await live.request(
          `/api/customer/inquiries/${live.id}/project-files`,
          "POST",
          body(dxf, "drawing.dxf"),
          live.auth,
        )
      ).status,
      503,
    );
    assert.equal(
      (
        await live.request(
          `/api/admin/pipeline/${live.id}/documents`,
          "POST",
          body(pdf, "quote.pdf", "document"),
          live.admin,
        )
      ).status,
      503,
    );
    assert.equal(
      (
        live.app.locals.db
          .prepare("SELECT count(*) AS n FROM project_files")
          .get() as any
      ).n,
      0,
    );
    assert.equal(
      (
        live.app.locals.db
          .prepare("SELECT count(*) AS n FROM portal_documents")
          .get() as any
      ).n,
      0,
    );
  } finally {
    await live.close();
  }
});

test("A previously accepted file is re-scanned on download and a later malware detection blocks it and records the result", async () => {
  const f = await fixture();
  const clients = new Set<Socket>();
  let infected = false;
  const scanner = createServer((socket) => {
    clients.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => clients.delete(socket));
    let pending = Buffer.alloc(0),
      started = false,
      length: number | undefined;
    socket.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      if (!started) {
        if (pending.length < 10) return;
        pending = pending.subarray(10);
        started = true;
      }
      while (pending.length) {
        if (length === undefined) {
          if (pending.length < 4) return;
          length = pending.readUInt32BE(0);
          pending = pending.subarray(4);
          if (!length) {
            socket.end(
              (infected ? "stream: Synthetic.Signature FOUND" : "stream: OK") +
                "\0",
            );
            return;
          }
        }
        if (pending.length < length) return;
        pending = pending.subarray(length);
        length = undefined;
      }
    });
  });
  await new Promise<void>((resolve) => scanner.listen(0, "127.0.0.1", resolve));
  process.env.CLAMAV_HOST = "127.0.0.1";
  process.env.CLAMAV_PORT = String((scanner.address() as any).port);
  try {
    const accepted = await f.request(
      `/api/customer/inquiries/${f.id}/project-files`,
      "POST",
      body(dxf, "drawing.dxf"),
      f.auth,
    );
    assert.equal(accepted.status, 201);
    const file = (await accepted.json()).files[0];
    assert.equal(file.scan.status, "clean");
    infected = true;
    const blocked = await f.request(file.downloadUrl, "GET", undefined, f.auth);
    assert.equal(blocked.status, 422);
    assert.doesNotMatch(await blocked.text(), /SECTION|ENDSEC/);
    const row = f.app.locals.db
      .prepare("SELECT data FROM project_files WHERE id=?")
      .get(file.id) as any;
    assert.equal(JSON.parse(row.data).scan.status, "infected");
    assert.ok(
      (
        f.app.locals.db
          .prepare(
            "SELECT count(*) AS n FROM audit WHERE action='PROJECT_FILE_SECURITY_BLOCK'",
          )
          .get() as any
      ).n > 0,
    );
  } finally {
    for (const socket of clients) socket.destroy();
    await new Promise<void>((resolve) => scanner.close(() => resolve()));
    await f.close();
  }
});

test("Revoking an account while antivirus is processing prevents the final upload commit", async () => {
  const f = await fixture();
  const clients = new Set<Socket>();
  let finishScan: (() => void) | undefined;
  let markStarted: (() => void) | undefined;
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });
  const scanner = createServer((socket) => {
    clients.add(socket);
    socket.on("error", () => {});
    socket.on("close", () => clients.delete(socket));
    let pending = Buffer.alloc(0),
      header = false,
      length: number | undefined;
    socket.on("data", (chunk) => {
      pending = Buffer.concat([pending, chunk]);
      if (!header) {
        if (pending.length < 10) return;
        pending = pending.subarray(10);
        header = true;
      }
      while (pending.length) {
        if (length === undefined) {
          if (pending.length < 4) return;
          length = pending.readUInt32BE(0);
          pending = pending.subarray(4);
          if (!length) {
            finishScan = () => socket.end("stream: OK\0");
            markStarted!();
            return;
          }
        }
        if (pending.length < length) return;
        pending = pending.subarray(length);
        length = undefined;
      }
    });
  });
  await new Promise<void>((resolve) => scanner.listen(0, "127.0.0.1", resolve));
  process.env.CLAMAV_HOST = "127.0.0.1";
  process.env.CLAMAV_PORT = String((scanner.address() as any).port);
  try {
    const uploading = f.request(
      `/api/customer/inquiries/${f.id}/project-files`,
      "POST",
      body(dxf, "drawing.dxf"),
      f.auth,
    );
    void uploading.catch(() => undefined);
    let waitTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        started,
        new Promise<never>((_resolve, reject) => {
          waitTimer = setTimeout(
            () =>
              reject(
                new Error(
                  "Synthetic scanner did not receive a complete INSTREAM request.",
                ),
              ),
            3000,
          );
        }),
      ]);
    } finally {
      if (waitTimer) clearTimeout(waitTimer);
    }
    const state = f.app.locals.db
      .prepare("SELECT customerId FROM portal_inquiries WHERE inquiryId=?")
      .get(f.id) as any;
    assert.equal(
      (
        await f.request(
          `/api/admin/customers/${state.customerId}/revoke`,
          "POST",
          {},
          f.admin,
        )
      ).status,
      200,
    );
    finishScan!();
    assert.equal((await uploading).status, 401);
    assert.equal(
      (
        f.app.locals.db
          .prepare("SELECT count(*) AS n FROM project_files")
          .get() as any
      ).n,
      0,
    );
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
  } finally {
    for (const socket of clients) socket.destroy();
    await new Promise<void>((resolve) => scanner.close(() => resolve()));
    await f.close();
  }
});
