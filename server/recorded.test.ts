import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";
import { referencePagesVersion } from "./reference-content.js";

test("Recorded layout documents follow CMS publication and retain user edits", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-recorded-api-"));
  const password = randomBytes(24).toString("base64url");
  const previous = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = password;
  let app = createApp({ dataDir: dir, production: false });
  if (previous === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = previous;
  let server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  let base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = "";
  const request = (path: string, method = "GET", body?: unknown) =>
    fetch(base + path, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  try {
    await t.test(
      "Original knowledge pages are available and actual family catalogues are PDFs",
      async () => {
        const site = await (await request("/api/site")).json();
        assert.equal(
          site.content.filter((c: any) => c.type === "product").length,
          16,
        );
        for (const slug of [
          "terimler-sozlugu",
          "renk-kartelasi",
          "olcu-rehberi",
          "garanti-servis",
        ])
          assert.ok(
            site.content.find((c: any) => c.type === "page" && c.slug === slug),
          );
        for (const family of ["all", "outdoor", "aluminium", "metal"]) {
          const response = await request("/api/catalog.pdf?family=" + family);
          assert.equal(response.status, 200);
          assert.equal(
            Buffer.from(await response.arrayBuffer())
              .subarray(0, 5)
              .toString(),
            "%PDF-",
          );
        }
        assert.equal(
          (await request("/api/catalog.pdf?family=invalid")).status,
          400,
        );
        const guide = await request("/api/measurement-guide.pdf");
        assert.equal(guide.status, 200);
        assert.equal(
          Buffer.from(await guide.arrayBuffer())
            .subarray(0, 5)
            .toString(),
          "%PDF-",
        );
      },
    );
    const login = await request("/api/admin/login", "POST", {
      username: "admin",
      password,
    });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie")!.split(";")[0];
    let guideId = "";
    let colourId = "";
    await t.test(
      "Unpublishing the measuring page also hides its downloadable document",
      async () => {
        const { content } = await (await request("/api/admin/content")).json();
        guideId = content.find((c: any) => c.slug === "olcu-rehberi").id;
        colourId = content.find((c: any) => c.slug === "renk-kartelasi").id;
        const result = await request("/api/admin/content/" + guideId, "PUT", {
          published: false,
          title: "Firma tarafından düzenlenen ölçü rehberi",
        });
        assert.equal(result.status, 200);
        assert.equal((await request("/api/measurement-guide.pdf")).status, 404);
        assert.equal(
          (await request("/api/content/page/olcu-rehberi")).status,
          404,
        );
        assert.equal(
          (await request("/api/admin/content/" + colourId, "DELETE")).status,
          200,
        );
      },
    );
    await t.test(
      "Restart preserves edited pages and does not repopulate removed pages",
      async () => {
        await new Promise<void>((r) => server.close(() => r()));
        app.locals.close();
        app = createApp({ dataDir: dir, production: false });
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((r) => server.once("listening", r));
        base = `http://127.0.0.1:${(server.address() as any).port}`;
        const { content } = await (await request("/api/admin/content")).json();
        const guide = content.find((c: any) => c.id === guideId);
        assert.equal(guide.title, "Firma tarafından düzenlenen ölçü rehberi");
        assert.equal(guide.published, false);
        assert.equal(
          content.some((c: any) => c.id === colourId),
          false,
        );
        assert.equal((await request("/api/measurement-guide.pdf")).status, 404);
        assert.ok(
          app.locals.db
            .prepare("SELECT version FROM schema_migrations WHERE version=?")
            .get(referencePagesVersion),
        );
      },
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
