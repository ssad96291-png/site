import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdtempSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

const drawing = Buffer.from("0\nSECTION\n2\nHEADER\n0\nENDSEC\n0\nEOF\n");
const submission = {
  name: "Sentetik Proje Sahibi",
  email: "plan@example.com",
  phoneRequested: false,
  requestType: "project",
  district: "Etimesgut",
  message: "Bu çizim yalnızca yalıtılmış uygulama testine aittir.",
  consent: true,
};

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-project-files-"));
  const names = [
    "ADMIN_PASSWORD",
    "NOTIFY_WEBHOOK_URL",
    "NOTIFY_WEBHOOK_TOKEN",
    "NOTIFY_ALLOWED_HOSTS",
  ];
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  const password = randomBytes(24).toString("base64url");
  process.env.ADMIN_PASSWORD = password;
  for (const name of names.slice(1)) process.env[name] = "";
  const app = createApp({ dataDir: dir, production: false });
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
  const cookie = (r: Response, name: string) =>
    r.headers
      .getSetCookie()
      .find((v) => v.startsWith(name + "="))!
      .split(";")[0];
  const login = await request("/api/admin/login", "POST", {
    username: "admin",
    password,
  });
  assert.equal(login.status, 200);
  const admin = cookie(login, "kilinc_session");
  async function create(extra: Record<string, unknown> = {}) {
    const r = await request("/api/project-requests", "POST", {
      ...submission,
      ...extra,
    });
    assert.equal(r.status, 201);
    const result = await r.json();
    const claimed = await request("/api/customer/claim", "POST", {
      token: result.trackingToken,
    });
    assert.equal(claimed.status, 200);
    return {
      id: result.id as string,
      auth: cookie(claimed, "kilinc_customer"),
    };
  }
  return {
    app,
    dir,
    request,
    admin,
    create,
    async close() {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      app.locals.close();
      rmSync(dir, { recursive: true, force: true });
      for (const [name, value] of previous) {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      }
    },
  };
}
function upload(files: Array<{ name: string; bytes: Buffer }>) {
  const body = new FormData();
  for (const file of files)
    body.append("files", new Blob([new Uint8Array(file.bytes)]), file.name);
  return body;
}

test("Price and project enquiries enforce explicit contact preferences and preserve an email reply channel", async () => {
  const f = await fixture();
  try {
    for (const invalid of [
      { email: "" },
      { phoneRequested: "true" },
      { phoneRequested: true, phone: "" },
    ]) {
      const r = await f.request("/api/project-requests", "POST", {
        ...submission,
        ...invalid,
      });
      assert.equal(r.status, 400);
    }
    const price = await f.request("/api/project-requests", "POST", {
      ...submission,
      requestType: "price",
      email: "  Customer+Price@Example.COM  ",
      phone: "",
    });
    assert.equal(price.status, 201);
    const result = await price.json();
    assert.equal(result.project.replyEmail, "customer+price@example.com");
    assert.equal(result.project.phoneRequested, false);
    assert.equal(result.project.requestType, "price");
    assert.ok(result.trackingToken);
    const withPhone = await f.request("/api/project-requests", "POST", {
      ...submission,
      phoneRequested: true,
      phone: "+90 (500) 000 00 00",
    });
    assert.equal(withPhone.status, 201);
    assert.equal((await withPhone.json()).project.phoneRequested, true);
    const rows = f.app.locals.db
      .prepare("SELECT data FROM inquiries ORDER BY rowid")
      .all() as Array<{ data: string }>;
    assert.equal(rows.length, 2);
    assert.ok(
      rows.every((r) => JSON.parse(r.data).preferredContact === "email"),
    );
  } finally {
    await f.close();
  }
});

test("Supported drawing formats stay private and deleting one enquiry removes only its files and offers", async () => {
  const f = await fixture();
  try {
    const first = await f.create();
    const second = await f.create({ name: "Sentetik İkinci Proje" });
    const pdf = Buffer.from(
      "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n",
    );
    const ifc = Buffer.from(
      "ISO-10303-21;\nHEADER;\nFILE_SCHEMA(('IFC4'));\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n",
    );
    let r = await f.request(
      `/api/customer/inquiries/${first.id}/project-files`,
      "POST",
      upload([
        { name: "plan.pdf", bytes: pdf },
        { name: "olcu.dxf", bytes: drawing },
        { name: "yapi.ifc", bytes: ifc },
      ]),
      first.auth,
    );
    assert.equal(r.status, 201);
    const files = (await r.json()).files;
    assert.deepEqual(
      files.map((v: any) => v.name),
      ["plan.pdf", "olcu.dxf", "yapi.ifc"],
    );
    assert.equal(
      readdirSync(join(f.dir, "project-files")).filter((v) =>
        v.endsWith(".bin"),
      ).length,
      3,
    );
    for (const filename of readdirSync(join(f.dir, "project-files"))) {
      assert.match(filename, /^[a-f0-9-]{36}\.bin$/);
      assert.equal(
        statSync(join(f.dir, "project-files", filename)).mode & 0o777,
        0o600,
      );
    }
    r = await f.request(
      `/api/customer/inquiries/${first.id}/project-files`,
      "POST",
      upload([{ name: "fourth.dxf", bytes: drawing }]),
      first.auth,
    );
    assert.equal(r.status, 409);
    const step = Buffer.from(
      "ISO-10303-21;\nHEADER;\nFILE_SCHEMA(('AUTOMOTIVE_DESIGN'));\nENDSEC;\nDATA;\nENDSEC;\nEND-ISO-10303-21;\n",
    );
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0wAAAABJRU5ErkJggg==",
      "base64",
    );
    r = await f.request(
      `/api/customer/inquiries/${second.id}/project-files`,
      "POST",
      upload([
        {
          name: "cizim.dwg",
          bytes: Buffer.concat([Buffer.from("AC1032"), Buffer.alloc(64)]),
        },
        { name: "parca.step", bytes: step },
        { name: "cephe.png", bytes: png },
      ]),
      second.auth,
    );
    assert.equal(r.status, 201);
    const secondFiles = (await r.json()).files;
    const draft = await f.request(
      `/api/admin/project-requests/${first.id}/offers`,
      "POST",
      {
        title: "Sentetik ilk teklif",
        currency: "TRY",
        items: [
          {
            description: "Ölçüye özel uygulama",
            quantity: 1,
            unit: "adet",
            unitPrice: 100,
          },
        ],
        vatRate: 20,
        validUntil: "2030-12-31",
        notes: "Yalnızca test.",
      },
      f.admin,
    );
    assert.equal(draft.status, 201);
    assert.equal(
      (
        f.app.locals.db
          .prepare(
            "SELECT count(*) AS count FROM portal_offers WHERE inquiryId=?",
          )
          .get(first.id) as any
      ).count,
      1,
    );
    const deleted = await f.request(
      `/api/admin/inquiries/${first.id}`,
      "DELETE",
      undefined,
      f.admin,
    );
    assert.equal(deleted.status, 200);
    for (const table of [
      "project_requests",
      "project_files",
      "portal_offers",
      "portal_inquiries",
    ])
      assert.equal(
        (
          f.app.locals.db
            .prepare(`SELECT count(*) AS count FROM ${table} WHERE inquiryId=?`)
            .get(first.id) as any
        ).count,
        0,
      );
    assert.equal(readdirSync(join(f.dir, "project-files")).length, 3);
    const preserved = await f.request(
      secondFiles[0].downloadUrl,
      "GET",
      undefined,
      second.auth,
    );
    assert.equal(preserved.status, 200);
    assert.match(
      preserved.headers.get("content-disposition") || "",
      /attachment/,
    );
    assert.equal(
      preserved.headers.get("content-type"),
      "application/octet-stream",
    );
    assert.deepEqual(
      Buffer.from(await preserved.arrayBuffer()).subarray(0, 6),
      Buffer.from("AC1032"),
    );
  } finally {
    await f.close();
  }
});

test("Stored owner and global quotas reject before writing and failed reservations do not block a later valid upload", async () => {
  const f = await fixture();
  try {
    const current = await f.create();
    const id = randomUUID();
    // Model already retained bytes using metadata, without allocating a gigabyte fixture.
    const insert = f.app.locals.db.prepare(
      "INSERT INTO project_files(id,inquiryId,filename,size,data) VALUES(?,?,?,?,?)",
    );
    insert.run(
      id,
      "synthetic-existing-enquiry",
      id + ".bin",
      1024 * 1024 * 1024,
      JSON.stringify({ id, name: "existing.dxf", size: 1024 * 1024 * 1024 }),
    );
    let r = await f.request(
      `/api/customer/inquiries/${current.id}/project-files`,
      "POST",
      upload([{ name: "plan.dxf", bytes: drawing }]),
      current.auth,
    );
    assert.equal(r.status, 413);
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    f.app.locals.db.prepare("DELETE FROM project_files WHERE id=?").run(id);
    insert.run(
      id,
      current.id,
      id + ".bin",
      256 * 1024 * 1024,
      JSON.stringify({ id, name: "existing.dxf", size: 256 * 1024 * 1024 }),
    );
    r = await f.request(
      `/api/customer/inquiries/${current.id}/project-files`,
      "POST",
      upload([{ name: "plan.dxf", bytes: drawing }]),
      current.auth,
    );
    assert.equal(r.status, 413);
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    f.app.locals.db.prepare("DELETE FROM project_files WHERE id=?").run(id);
    r = await f.request(
      `/api/customer/inquiries/${current.id}/project-files`,
      "POST",
      upload([{ name: "plan.dxf", bytes: drawing }]),
      current.auth,
    );
    assert.equal(r.status, 201);
    assert.equal((await r.json()).files.length, 1);
    assert.equal(
      readdirSync(join(f.dir, "project-files")).filter((name) =>
        name.endsWith(".tmp"),
      ).length,
      0,
    );
  } finally {
    await f.close();
  }
});

test("A malformed batch or oversized project file is removed completely and does not consume the request's file capacity", async () => {
  const f = await fixture();
  try {
    const current = await f.create();
    const path = `/api/customer/inquiries/${current.id}/project-files`;
    const activePdf = Buffer.from(
      "%PDF-1.4\n/JavaScript (synthetic active content)\n%%EOF\n",
    );
    let response = await f.request(
      path,
      "POST",
      upload([
        { name: "valid-first.dxf", bytes: drawing },
        { name: "active.pdf", bytes: activePdf },
      ]),
      current.auth,
    );
    assert.equal(response.status, 400);
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    assert.equal(
      (
        f.app.locals.db
          .prepare(
            "SELECT count(*) AS count FROM project_files WHERE inquiryId=?",
          )
          .get(current.id) as any
      ).count,
      0,
    );
    const oversized = Buffer.alloc(20 * 1024 * 1024 + 1);
    oversized.write("AC1032");
    response = await f.request(
      path,
      "POST",
      upload([{ name: "oversized.dwg", bytes: oversized }]),
      current.auth,
    );
    assert.equal(response.status, 413);
    assert.match((await response.json()).error, /20 MB/);
    assert.deepEqual(readdirSync(join(f.dir, "project-files")), []);
    assert.equal(
      (
        f.app.locals.db
          .prepare(
            "SELECT count(*) AS count FROM project_files WHERE inquiryId=?",
          )
          .get(current.id) as any
      ).count,
      0,
    );
    response = await f.request(
      path,
      "POST",
      upload([{ name: "retry.dxf", bytes: drawing }]),
      current.auth,
    );
    assert.equal(response.status, 201);
    assert.equal((await response.json()).files.length, 1);
    assert.equal(
      readdirSync(join(f.dir, "project-files")).some((file) =>
        file.endsWith(".tmp"),
      ),
      false,
    );
  } finally {
    await f.close();
  }
});
