import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "./app.js";

test("Persistent CMS, admin authentication, enquiries, uploads and catalogue", async (t) => {
  const dataDir = mkdtempSync(join(tmpdir(), "kilinc-test-"));
  let app = createApp({ dataDir, production: false });
  let server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  let base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = "";
  let contentId = "";
  let inquiryId = "";
  const initialPassword = readFileSync(
    join(dataDir, "initial-admin-password"),
    "utf8",
  ).trim();
  const request = async (
    path: string,
    method = "GET",
    body?: any,
    extra: Record<string, string> = {},
  ) =>
    fetch(base + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...extra,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    await t.test(
      "Public seed has full bilingual content and no invented contact details",
      async () => {
        const r = await request("/api/site");
        assert.equal(r.status, 200);
        const data = await r.json();
        assert.equal(data.settings.phone, "");
        assert.equal(
          data.content.filter((c: any) => c.type === "product").length,
          16,
        );
        assert.equal(
          data.content.filter((c: any) => c.type === "project").length,
          6,
        );
        assert.equal(data.content.filter((c: any) => c.type === "region").length, 7);
        assert.equal(data.content.filter((c: any) => c.type === "faq").length, 20);
        assert.ok(data.content.every((c: any) => c.titleEn && c.bodyEn));
        assert.ok(data.content.find((c: any) => c.slug === "kvkk"));
      },
    );
    await t.test(
      "Anonymous writes and cross-origin login are rejected",
      async () => {
        assert.equal(
          (await request("/api/admin/content", "POST", { title: "No" })).status,
          401,
        );
        assert.equal(
          (
            await request(
              "/api/admin/login",
              "POST",
              { username: "admin", password: initialPassword },
              { Origin: "https://evil.example" },
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request("/api/admin/login", "POST", {
              username: "admin",
              password: "incorrect",
            })
          ).status,
          401,
        );
      },
    );
    await t.test("Admin login uses HttpOnly cookie", async () => {
      const r = await request("/api/admin/login", "POST", {
        username: "admin",
        password: initialPassword,
      });
      assert.equal(r.status, 200);
      const header = r.headers.get("set-cookie")!;
      assert.match(header, /HttpOnly/);
      assert.match(header, /SameSite=Lax/);
      cookie = header.split(";")[0];
      assert.equal((await request("/api/admin/me")).status, 200);
    });
    await t.test(
      "Content create, visibility, uniqueness, update and remove",
      async () => {
        let r = await request("/api/admin/content", "POST", {
          type: "product",
          slug: "test-product",
          title: "Test Ürünü",
          body: "Açıklama",
          published: false,
        });
        assert.equal(r.status, 201);
        const data = await r.json();
        contentId = data.content.id;
        assert.equal(
          (await request("/api/content/product/test-product")).status,
          404,
        );
        r = await request("/api/admin/content", "POST", {
          type: "product",
          slug: "test-product",
          title: "Duplicate",
        });
        assert.equal(r.status, 409);
        r = await request("/api/admin/content/" + contentId, "PUT", {
          published: true,
          title: "Güncel Ürün",
        });
        assert.equal(r.status, 200);
        assert.equal(
          (await (await request("/api/content/product/test-product")).json())
            .content.title,
          "Güncel Ürün",
        );
        assert.equal(
          (await request("/api/admin/content/" + contentId, "DELETE")).status,
          200,
        );
        assert.equal(
          (await request("/api/content/product/test-product")).status,
          404,
        );
      },
    );
    await t.test("Settings persist and reject unsafe social URLs", async () => {
      assert.equal(
        (
          await request("/api/admin/settings", "PUT", {
            phone: "+90 555 000 00 00",
            heroTitleEn: "Updated hero",
            heroImage: "/images/product-1.svg",
          })
        ).status,
        200,
      );
      assert.equal(
        (await (await request("/api/site")).json()).settings.phone,
        "+90 555 000 00 00",
      );
      assert.equal(
        (await (await request("/api/site")).json()).settings.heroImage,
        "/images/product-1.svg",
      );
      assert.equal(
        (
          await request("/api/admin/settings", "PUT", {
            heroImage: "https://evil.example/image.svg",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await request("/api/admin/settings", "PUT", {
            instagram: "javascript:alert(1)",
          })
        ).status,
        400,
      );
    });
    await t.test(
      "Enquiries require consent, persist and update status",
      async () => {
        const input = {
          name: "Test Kullanıcısı",
          phone: "05550000000",
          message: "Cam balkon için keşif talep ediyorum.",
          consent: false,
        };
        assert.equal(
          (await request("/api/inquiries", "POST", input)).status,
          400,
        );
        const r = await request("/api/inquiries", "POST", {
          ...input,
          consent: true,
        });
        assert.equal(r.status, 201);
        inquiryId = (await r.json()).id;
        const list = await (await request("/api/admin/inquiries")).json();
        assert.equal(list.inquiries[0].id, inquiryId);
        assert.equal(
          (
            await request("/api/admin/inquiries/" + inquiryId, "PATCH", {
              status: "contacted",
            })
          ).status,
          200,
        );
        assert.equal(
          (
            await request("/api/admin/inquiries/" + inquiryId, "PATCH", {
              status: "anything",
            })
          ).status,
          400,
        );
      },
    );
    await t.test(
      "Upload rejects active SVG and stores a valid PNG",
      async () => {
        const form = new FormData();
        form.append(
          "image",
          new Blob(['<svg onload="alert(1)"></svg>'], {
            type: "image/svg+xml",
          }),
          "evil.svg",
        );
        assert.equal(
          (
            await fetch(base + "/api/admin/upload", {
              method: "POST",
              headers: { Cookie: cookie },
              body: form,
            })
          ).status,
          400,
        );
        const valid = new FormData();
        valid.append(
          "image",
          new Blob(
            [
              Buffer.from(
                "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
                "base64",
              ),
            ],
            { type: "image/png" },
          ),
          "photo.png",
        );
        const r = await fetch(base + "/api/admin/upload", {
          method: "POST",
          headers: { Cookie: cookie },
          body: valid,
        });
        assert.equal(r.status, 201);
        const { url } = await r.json();
        const image = await request(url);
        assert.equal(image.status, 200);
        assert.match(image.headers.get("content-type")!, /image\/png/);
      },
    );
    await t.test(
      "Catalogue produces an actual PDF in both languages",
      async () => {
        for (const lang of ["tr", "en"]) {
          const r = await request("/api/catalog.pdf?lang=" + lang);
          assert.equal(r.status, 200);
          assert.match(r.headers.get("content-type")!, /application\/pdf/);
          const bytes = Buffer.from(await r.arrayBuffer());
          assert.equal(bytes.subarray(0, 4).toString(), "%PDF");
          assert.ok(bytes.length > 5000);
        }
      },
    );
    await t.test(
      "Server restart retains settings and enquiry changes",
      async () => {
        await new Promise<void>((resolve, reject) =>
          server.close((e) => (e ? reject(e) : resolve())),
        );
        app.locals.close();
        app = createApp({ dataDir, production: false });
        server = app.listen(0, "127.0.0.1");
        await new Promise<void>((r) => server.once("listening", r));
        base = `http://127.0.0.1:${(server.address() as any).port}`;
        const site = await (await request("/api/site")).json();
        assert.equal(site.settings.phone, "+90 555 000 00 00");
        const inquiries = await (await request("/api/admin/inquiries")).json();
        assert.equal(inquiries.inquiries[0].status, "contacted");
      },
    );
    await t.test(
      "Password rotation invalidates sessions and removes bootstrap password",
      async () => {
        assert.equal(
          (
            await request("/api/admin/password", "PUT", {
              currentPassword: initialPassword,
              newPassword: "a-new-secure-password-2026",
            })
          ).status,
          200,
        );
        assert.equal((await request("/api/admin/me")).status, 401);
        assert.equal(
          (
            await request("/api/admin/login", "POST", {
              username: "admin",
              password: initialPassword,
            })
          ).status,
          401,
        );
        const r = await request("/api/admin/login", "POST", {
          username: "admin",
          password: "a-new-secure-password-2026",
        });
        assert.equal(r.status, 200);
      },
    );
  } finally {
    await new Promise<void>((r) => server.close(() => r()));
    app.locals.close();
    rmSync(dataDir, { recursive: true, force: true });
  }
});
