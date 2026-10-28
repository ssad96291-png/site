import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import {
  existsSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApp } from "./app.js";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4t8AAAAASUVORK5CYII=",
  "base64",
);
const cookie = (response: Response, name: string) =>
  response.headers
    .getSetCookie()
    .find((value) => value.startsWith(name + "="))
    ?.split(";")[0] || "";

test("Real CMS media provenance guard, upload cleanup and retired-image compatibility", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-media-rights-integration-"));
  const password = randomBytes(24).toString("base64url");
  const old = process.env.ADMIN_PASSWORD;
  process.env.ADMIN_PASSWORD = password;
  const publicDir = resolve("public");
  const app = createApp({
    dataDir: dir,
    production: false,
    staticDir: publicDir,
  });
  if (old === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = old;
  const uploadDir = join(dir, "uploads");
  const legacy = "00000000-1111-2222-3333-444444444444.png";
  writeFileSync(join(uploadDir, legacy), png);
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
  const form = (fields?: Record<string, string>) => {
    const value = new FormData();
    value.append(
      "image",
      new Blob([new Uint8Array(png)], { type: "image/png" }),
      "synthetic.png",
    );
    for (const [key, field] of Object.entries(fields || {}))
      value.append(key, field);
    return value;
  };
  let admin = "",
    editor = "",
    manager = "",
    imageUrl = "";
  const rightsPath = "/api/admin/media-rights";
  const declaration = {
    basis: "own",
    source: "Synthetic in-house photo archive",
    holder: "Synthetic photographer",
    permissionRef: "Synthetic assignment record 1",
    notes: "PRIVATE_MEDIA_LICENSE_CANARY",
    confirmed: true,
  };
  try {
    const signed = await request("/api/admin/login", "POST", {
      username: "admin",
      password,
    });
    assert.equal(signed.status, 200);
    admin = cookie(signed, "kilinc_session");
    for (const role of ["editor", "manager"]) {
      const username = "rights_" + role;
      const staffPassword = randomBytes(24).toString("base64url");
      assert.equal(
        (
          await request(
            "/api/admin/staff",
            "POST",
            { username, password: staffPassword, role, region: "Etimesgut" },
            admin,
          )
        ).status,
        201,
      );
      const login = await request("/api/staff/login", "POST", {
        username,
        password: staffPassword,
      });
      assert.equal(login.status, 200);
      const auth = cookie(login, "kilinc_staff");
      assert.ok(auth);
      if (role === "editor") editor = auth;
      else manager = auth;
    }

    await t.test(
      "Actual admin middleware protects records while allowing editor media work",
      async () => {
        assert.equal((await request(rightsPath)).status, 401);
        assert.equal(
          (await request(rightsPath, "GET", undefined, manager)).status,
          403,
        );
        const response = await request(rightsPath, "GET", undefined, editor);
        assert.equal(response.status, 200);
        const body = await response.json();
        assert.deepEqual(body.summary, {
          total: 1,
          recorded: 0,
          unreviewed: 1,
          unverified: 1,
        });
        assert.equal(body.records[0].url, "/uploads/" + legacy);
        assert.equal(body.records[0].confirmedAt, "");
        assert.equal(
          (await request(rightsPath + "/" + legacy, "PUT", declaration)).status,
          401,
        );
        assert.equal(
          (
            await request(
              rightsPath + "/" + legacy,
              "PUT",
              declaration,
              manager,
            )
          ).status,
          403,
        );
      },
    );

    await t.test(
      "Existing one-file clients stay compatible and explicit multipart declarations are retained",
      async () => {
        const original = await request(
          "/api/admin/upload",
          "POST",
          form(),
          editor,
        );
        assert.equal(original.status, 201);
        imageUrl = (await original.json()).url;
        const originalRecord = (
          await (await request(rightsPath, "GET", undefined, admin)).json()
        ).records.find((value: any) => value.url === imageUrl);
        assert.equal(originalRecord.basis, "unverified");
        assert.equal(originalRecord.confirmedAt, "");
        const declared = await request(
          "/api/admin/upload",
          "POST",
          form(
            Object.fromEntries(
              Object.entries(declaration).map(([key, value]) => [
                key,
                String(value),
              ]),
            ),
          ),
          editor,
        );
        assert.equal(declared.status, 201);
        const declaredUrl = (await declared.json()).url;
        const records = await (
          await request(rightsPath, "GET", undefined, admin)
        ).json();
        const record = records.records.find(
          (value: any) => value.url === declaredUrl,
        );
        assert.equal(record.notes, declaration.notes);
        assert.equal(record.holder, declaration.holder);
        assert.ok(record.confirmedAt);
        assert.equal(records.summary.recorded, 1);
        const publicResponse = await request("/api/site");
        assert.equal(publicResponse.status, 200);
        const publicSite = await publicResponse.text();
        assert.doesNotMatch(publicSite, /PRIVATE_MEDIA_LICENSE_CANARY/);
        const auditResponse = await request(
          "/api/admin/audit",
          "GET",
          undefined,
          admin,
        );
        assert.equal(auditResponse.status, 200);
        const audits = await auditResponse.text();
        assert.match(audits, /media\.rights\.update/);
        assert.doesNotMatch(
          audits,
          /PRIVATE_MEDIA_LICENSE_CANARY|Synthetic assignment record/,
        );
      },
    );

    await t.test(
      "Rejected multipart metadata leaves neither an orphan file nor a provenance row",
      async () => {
        const filesBefore = readdirSync(uploadDir).sort();
        const countBefore = (
          app.locals.db
            .prepare("SELECT COUNT(*) AS count FROM media_rights")
            .get() as any
        ).count;
        for (const body of [
          { basis: "licensed", confirmed: "true" },
          { basis: "unverified", confirmed: "true" },
          { basis: "own", source: "x".repeat(1001), confirmed: "false" },
          { basis: "own", confirmed: "yes" },
        ] as Array<Record<string, string>>)
          assert.equal(
            (await request("/api/admin/upload", "POST", form(body), editor))
              .status,
            400,
          );
        const duplicated = form({ basis: "own", confirmed: "false" });
        duplicated.append("source", "first");
        duplicated.append("source", "second");
        assert.equal(
          (await request("/api/admin/upload", "POST", duplicated, editor))
            .status,
          400,
        );
        assert.deepEqual(readdirSync(uploadDir).sort(), filesBefore);
        assert.equal(
          (
            app.locals.db
              .prepare("SELECT COUNT(*) AS count FROM media_rights")
              .get() as any
          ).count,
          countBefore,
        );
      },
    );

    await t.test(
      "Editors can withdraw/update legacy declarations and delete provenance together with an unused image",
      async () => {
        const update = await request(
          rightsPath + "/" + legacy,
          "PUT",
          declaration,
          editor,
        );
        assert.equal(update.status, 200);
        assert.ok((await update.json()).record.confirmedAt);
        const withdraw = await request(
          rightsPath + "/" + legacy,
          "PUT",
          { ...declaration, confirmed: false },
          editor,
        );
        assert.equal(withdraw.status, 200);
        assert.equal((await withdraw.json()).record.confirmedAt, "");
        const filename = imageUrl.split("/").pop()!;
        assert.ok(
          app.locals.db
            .prepare("SELECT filename FROM media_rights WHERE filename=?")
            .get(filename),
        );
        assert.equal(
          (
            await request(
              "/api/admin/media/" + filename,
              "DELETE",
              undefined,
              editor,
            )
          ).status,
          200,
        );
        assert.equal(existsSync(join(uploadDir, filename)), false);
        assert.equal(
          app.locals.db
            .prepare("SELECT filename FROM media_rights WHERE filename=?")
            .get(filename),
          undefined,
        );
      },
    );

    await t.test(
      "All 21 withdrawn asset URLs redirect to existing documented replacements",
      async () => {
        const expected: Record<string, string> = {
          "hero.svg": "original-terrace.png",
          "product-1.svg": "original-balcony.png",
          "product-2.svg": "original-terrace.png",
          "product-3.svg": "original-balcony.png",
          "product-4.svg": "original-terrace.png",
          "product-5.svg": "original-pergola.png",
          "product-6.svg": "original-pergola.png",
          "product-7.svg": "original-terrace.png",
          "product-8.svg": "original-terrace.png",
          "product-9.svg": "original-balcony.png",
          "product-10.svg": "aluminium-facade.svg",
          "project-1.svg": "original-terrace.png",
          "project-2.svg": "original-balcony.png",
          "project-3.svg": "original-pergola.png",
          "project-4.svg": "original-terrace.png",
          "project-5.svg": "original-pergola.png",
          "project-6.svg": "aluminium-facade.svg",
          "article-1.svg": "original-balcony.png",
          "article-2.svg": "original-terrace.png",
          "article-3.svg": "original-pergola.png",
          "article-4.svg": "original-balcony.png",
        };
        assert.equal(Object.keys(expected).length, 21);
        for (const [retired, replacement] of Object.entries(expected)) {
          const response = await fetch(base + "/images/" + retired, {
            redirect: "manual",
          });
          assert.equal(response.status, 302, retired);
          assert.equal(
            response.headers.get("location"),
            "/images/" + replacement,
            retired,
          );
          assert.equal(
            existsSync(join(publicDir, "images", replacement)),
            true,
            replacement,
          );
          assert.equal(
            existsSync(join(publicDir, "images", retired)),
            false,
            retired + " remains in distribution",
          );
        }
      },
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    app.locals.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
