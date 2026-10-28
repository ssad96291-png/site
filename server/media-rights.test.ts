import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installMediaRights } from "./media-rights.js";

test("Media provenance remains a private operator declaration with explicit confirmation", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-media-rights-"));
  const uploadDir = join(dir, "uploads");
  mkdirSync(uploadDir);
  const filename = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.png";
  const legacy = "00000000-bbbb-cccc-dddd-eeeeeeeeeeee.jpg";
  const external = join(dir, "external.txt");
  writeFileSync(join(uploadDir, filename), "Synthetic image fixture");
  writeFileSync(join(uploadDir, legacy), "Synthetic legacy fixture");
  writeFileSync(external, "PRIVATE_EXTERNAL_FILE_CANARY");
  symlinkSync(external, join(uploadDir, "deadbeef.png"));
  writeFileSync(join(uploadDir, "private.pdf"), "Private document fixture");
  const db = new DatabaseSync(join(dir, "test.sqlite"));
  const audits: Array<{ actor: string; action: string; target: string }> = [];
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const role = req.get("x-test-role");
    if (role) {
      req.admin = "synthetic-operator";
      req.operatorRole = role;
    }
    next();
  });
  const rights = installMediaRights({
    app,
    db,
    uploadDir,
    recordAudit: (actor, action, target) => audits.push({ actor, action, target }),
  });
  app.use((err: any, _req: any, res: any, _next: any) =>
    res.status(err.status || 500).json({ error: err.message }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const request = (
    path = "/api/admin/media-rights",
    method = "GET",
    body?: unknown,
    role = "admin",
  ) =>
    fetch(base + path, {
      method,
      headers: {
        ...(role ? { "x-test-role": role } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  const path = "/api/admin/media-rights/" + filename;
  const declaration = {
    basis: "permission",
    holder: "Synthetic photographer",
    source: "PRIVATE_SOURCE_EVIDENCE_CANARY",
    permissionRef: "Written permission / synthetic test record 17",
    notes: "Permission limited to this firm's website.",
    confirmed: true,
  };
  try {
    await t.test("Authentication, role scope and actual public-image inventory", async () => {
      assert.equal((await request(undefined, "GET", undefined, "")).status, 401);
      for (const role of ["dealer", "manager", "customer"])
        assert.equal((await request(undefined, "GET", undefined, role)).status, 403);
      const r = await request(undefined, "GET", undefined, "editor");
      assert.equal(r.status, 200);
      const body = await r.json();
      assert.deepEqual(body.summary, { total: 2, recorded: 0, unreviewed: 2, unverified: 2 });
      assert.deepEqual(body.records.map((v: any) => v.url).sort(), ["/uploads/" + legacy, "/uploads/" + filename].sort());
      assert.ok(body.records.every((v: any) => v.confirmedAt === ""));
      assert.doesNotMatch(JSON.stringify(body), /PRIVATE_EXTERNAL_FILE_CANARY|private\.pdf|deadbeef/);
    });

    await t.test("A new upload or incomplete draft never implies clearance", async () => {
      const created = rights.recordUploadRights(filename, undefined, "synthetic-operator");
      assert.equal(created.basis, "unverified");
      assert.equal(created.confirmedAt, "");
      const draft = rights.recordUploadRights(filename, { basis: "licensed", source: "Draft stock reference", confirmed: "false" }, "synthetic-operator");
      assert.equal(draft.basis, "licensed");
      assert.equal(draft.confirmedAt, "");
      const empty = rights.recordUploadRights(filename, {}, "synthetic-operator");
      assert.equal(empty.basis, "unverified");
      assert.throws(() => rights.recordUploadRights(filename, { basis: "licensed", confirmed: "true" }, "synthetic-operator"), /tamamlayın/);
      const body = await (await request()).json();
      assert.equal(body.summary.recorded, 0);
      assert.equal(body.summary.unreviewed, 2);
    });

    await t.test("Explicit complete confirmation persists privately and can be withdrawn", async () => {
      const response = await request(path, "PUT", declaration, "editor");
      assert.equal(response.status, 200);
      const record = (await response.json()).record;
      assert.ok(record.confirmedAt);
      assert.equal(record.source, declaration.source);
      const stored = JSON.parse((db.prepare("SELECT data FROM media_rights WHERE filename=?").get(filename) as any).data);
      assert.deepEqual(stored, record);
      const body = await (await request()).json();
      assert.deepEqual(body.summary, { total: 2, recorded: 1, unreviewed: 1, unverified: 1 });
      assert.doesNotMatch(JSON.stringify(audits), /PRIVATE_SOURCE_EVIDENCE_CANARY|Written permission/);
      assert.ok(audits.every((v) => v.actor === "synthetic-operator" && v.action === "media.rights.update"));
      assert.equal((await request(path, "GET", undefined, "")).status, 404);
      assert.equal((await request(path, "PUT", declaration, "")).status, 401);
      assert.equal((await request(path, "PUT", declaration, "dealer")).status, 403);
      const withdrawal = await request(path, "PUT", { ...declaration, confirmed: false });
      assert.equal(withdrawal.status, 200);
      assert.equal((await withdrawal.json()).record.confirmedAt, "");
      assert.equal((await (await request()).json()).summary.recorded, 0);
    });

    await t.test("Invalid claims and filenames fail without modifying the existing declaration", async () => {
      const before = (db.prepare("SELECT data FROM media_rights WHERE filename=?").get(filename) as any).data;
      for (const body of [
        { ...declaration, basis: "unverified" },
        { ...declaration, source: " " },
        { ...declaration, holder: "" },
        { ...declaration, permissionRef: "" },
        { ...declaration, basis: "copyright-free" },
        { ...declaration, source: "x".repeat(1001) },
        { ...declaration, holder: "x".repeat(301) },
        { ...declaration, permissionRef: "x".repeat(1001) },
        { ...declaration, notes: "x".repeat(2001) },
        { ...declaration, confirmed: "true" },
        { ...declaration, source: ["malformed", "repeated field"] },
        [],
      ]) assert.equal((await request(path, "PUT", body)).status, 400);
      assert.equal((db.prepare("SELECT data FROM media_rights WHERE filename=?").get(filename) as any).data, before);
      assert.equal((await request("/api/admin/media-rights/ffffffff.png", "PUT", declaration)).status, 404);
      assert.equal((await request("/api/admin/media-rights/deadbeef.png", "PUT", declaration)).status, 404);
      assert.equal((await request("/api/admin/media-rights/private.pdf", "PUT", declaration)).status, 400);
      assert.equal((await request("/api/admin/media-rights/%2E%2E%2Fexternal.txt", "PUT", declaration)).status, 400);
      assert.throws(() => rights.recordUploadRights("../external.txt", undefined, "test"), /dosya adı/);
      assert.throws(() => rights.deleteMediaRights("../external.txt"), /dosya adı/);
    });

    await t.test("Deleting provenance removes metadata and a missing file is never inventoried", async () => {
      rights.deleteMediaRights(filename);
      assert.equal(db.prepare("SELECT filename FROM media_rights WHERE filename=?").get(filename), undefined);
      const legacyRecord = rights.recordUploadRights(legacy, { ...declaration, confirmed: "true" }, "synthetic-operator");
      assert.ok(legacyRecord.confirmedAt);
      rmSync(join(uploadDir, legacy));
      const body = await (await request()).json();
      assert.equal(body.summary.total, 1);
      assert.equal(body.summary.recorded, 0);
      assert.equal(body.records[0].url, "/uploads/" + filename);
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
