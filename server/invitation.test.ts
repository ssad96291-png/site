import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { installPortal } from "./portal.js";

test("Automatic tracking invitation keeps raw capability tokens out of the persisted outbox", async () => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-invite-"));
  const db = new DatabaseSync(join(dir, "test.sqlite"));
  db.exec(
    "CREATE TABLE inquiries(id TEXT PRIMARY KEY,data TEXT NOT NULL); CREATE TABLE users(username TEXT PRIMARY KEY,password TEXT); CREATE TABLE sessions(token TEXT PRIMARY KEY,username TEXT,expires INTEGER);",
  );
  const prior = process.env.PUBLIC_ORIGIN;
  process.env.PUBLIC_ORIGIN = "https://kilinc.example";
  const delivered: any[] = [];
  const portal = installPortal({
    app: express(),
    db,
    dataDir: dir,
    production: false,
    readAdmin: () => undefined,
    deliveryConfigured: () => true,
    deliver: async (job) => {
      delivered.push(job);
      return { status: "sent" };
    },
  });
  try {
    const inquiry = {
      id: "invitation-test",
      name: "Test Customer",
      email: "invite@example.com",
      phone: "05000000000",
      subject: "Test enquiry",
      message: "Only synthetic test data.",
      district: "",
      status: "new",
      createdAt: new Date().toISOString(),
    };
    db.prepare("INSERT INTO inquiries(id,data) VALUES(?,?)").run(
      inquiry.id,
      JSON.stringify(inquiry),
    );
    const receipt = portal.onInquiryCreated(
      { headers: {}, ip: "127.0.0.1" } as any,
      {} as any,
      inquiry,
    );
    await portal.dispatchPending();
    assert.equal(delivered.length, 1);
    assert.equal(delivered[0].payload.kind, "tracking_invite");
    const url = new URL(delivered[0].payload.trackingUrl);
    assert.equal(url.origin, "https://kilinc.example");
    assert.equal(url.pathname, "/hesabim");
    const token = new URLSearchParams(url.hash.slice(1)).get("claim")!;
    assert.ok(token && token !== receipt.trackingToken);
    const persisted = JSON.stringify(
      db.prepare("SELECT * FROM portal_outbox").all(),
    );
    assert.ok(!persisted.includes(token));
    assert.ok(!persisted.includes(receipt.trackingToken!));
    const stored = db
      .prepare("SELECT inquiryId FROM portal_tokens WHERE token=?")
      .get(createHash("sha256").update(token).digest("hex")) as any;
    assert.equal(stored.inquiryId, inquiry.id);
    assert.equal(
      (db.prepare("SELECT status FROM portal_outbox").get() as any).status,
      "sent",
    );
  } finally {
    portal.close();
    db.close();
    if (prior === undefined) delete process.env.PUBLIC_ORIGIN;
    else process.env.PUBLIC_ORIGIN = prior;
    rmSync(dir, { recursive: true, force: true });
  }
});
