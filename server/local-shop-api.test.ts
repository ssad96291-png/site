import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

test("The public site describes one shop and closes the retired application flow", async () => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-local-api-"));
  const previous = process.env.ADMIN_PASSWORD;
  const password = randomBytes(24).toString("base64url");
  process.env.ADMIN_PASSWORD = password;
  const staticDir = join(dir, "web");
  mkdirSync(staticDir);
  writeFileSync(
    join(staticDir, "index.html"),
    "<!doctype html><title>Synthetic site</title>",
  );
  const app = createApp({ dataDir: dir, staticDir, production: false });
  if (previous === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previous;
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  const json = { "Content-Type": "application/json" };
  try {
    const site = await (await fetch(base + "/api/site")).json();
    assert.match(site.settings.heroTitle, /Ölçünüze göre/);
    assert.match(site.settings.aboutText, /tek dükkân/);
    assert.doesNotMatch(
      JSON.stringify(site),
      /bayilik|bayi ağı|dealership|franchise|partnership/i,
    );
    for (const path of [
      "/is-ortakligi",
      "/bayilik",
      "/bayi",
      "/bayiler",
      "/franchise",
    ]) {
      const response = await fetch(base + path);
      assert.equal(response.status, 410);
      assert.match(response.headers.get("x-robots-tag") || "", /noindex/);
    }
    for (const [from, to] of Object.entries({
      "/urunler": "/hizmetler",
      "/galeri": "/fikir-defteri",
      "/dukkanimiz": "/kurumsal",
      "/bolgeler": "/hizmet-alani",
    })) {
      const response = await fetch(base + from, { redirect: "manual" });
      assert.equal(response.status, 302);
      assert.equal(response.headers.get("location"), to);
    }
    for (const path of [
      "/kurumsal",
      "/projeler",
      "/proje-birimi",
      "/proje-teklif",
    ]) {
      const response = await fetch(base + path, { redirect: "manual" });
      assert.equal(
        response.status,
        200,
        path + " remains a separate public page",
      );
      assert.equal(response.headers.get("location"), null);
    }
    const inquiry = {
      name: "Sentetik Yerel Talep",
      phone: "05000000000",
      message: "Yalnızca sentetik test için keşif bilgisi.",
      consent: true,
    };
    for (const extra of [
      { kind: "dealer" },
      { type: "franchise" },
      { subject: "İş ortaklığı başvurusu" },
    ]) {
      const response = await fetch(base + "/api/inquiries", {
        method: "POST",
        headers: json,
        body: JSON.stringify({ ...inquiry, ...extra }),
      });
      assert.equal(response.status, 410);
    }
    assert.equal(
      (
        app.locals.db
          .prepare("SELECT count(*) AS count FROM inquiries")
          .get() as any
      ).count,
      0,
    );
    const response = await fetch(base + "/api/inquiries", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ ...inquiry, subject: "Servis talebi" }),
    });
    assert.equal(response.status, 201);
    assert.ok((await response.json()).trackingToken);
    const login = await fetch(base + "/api/admin/login", {
      method: "POST",
      headers: json,
      body: JSON.stringify({ username: "admin", password }),
    });
    assert.equal(login.status, 200);
    const cookie = login.headers
      .getSetCookie()
      .find((c) => c.startsWith("kilinc_session="))!
      .split(";")[0];
    const settings = await fetch(base + "/api/admin/settings", {
      method: "PUT",
      headers: { ...json, Cookie: cookie },
      body: JSON.stringify({ websiteUrl: "https://example.invalid" }),
    });
    assert.equal(settings.status, 200);
    const sitemap = await (await fetch(base + "/sitemap.xml")).text();
    for (const path of [
      "hizmetler",
      "fikir-defteri",
      "kurumsal",
      "projeler",
      "proje-birimi",
      "hizmet-alani",
    ])
      assert.ok(sitemap.includes(`https://example.invalid/${path}<`));
    assert.doesNotMatch(sitemap, /is-ortakligi|bayilik|franchise/);
    assert.ok(
      site.content.some(
        (item: any) => item.slug === "kurumsal-projeler-taahhut",
      ),
    );
    assert.ok(sitemap.includes("/kurumsal/kurumsal-projeler-taahhut<"));
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
