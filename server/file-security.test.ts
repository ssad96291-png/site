import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { createServer, type Socket } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  FileSecurityError,
  scanBuffer,
  scanFile,
  securityPolicy,
} from "./file-security.js";

async function settings(
  values: Record<string, string>,
  fn: () => Promise<void>,
) {
  const keys = ["CLAMAV_HOST", "CLAMAV_PORT", "CLAMAV_TIMEOUT_MS"];
  const previous = new Map(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) delete process.env[key];
  Object.assign(process.env, values);
  try {
    await fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}
async function clamd(reply: string | null) {
  const clients = new Set<Socket>();
  const received: Buffer[] = [];
  const server = createServer((socket) => {
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
        assert.equal(pending.subarray(0, 10).toString(), "zINSTREAM\0");
        pending = pending.subarray(10);
        started = true;
      }
      while (pending.length) {
        if (length === undefined) {
          if (pending.length < 4) return;
          length = pending.readUInt32BE(0);
          pending = pending.subarray(4);
          if (!length) {
            if (reply !== null) socket.end(Buffer.from(reply + "\0"));
            return;
          }
        }
        if (pending.length < length) return;
        received.push(pending.subarray(0, length));
        pending = pending.subarray(length);
        length = undefined;
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    env: {
      CLAMAV_HOST: "127.0.0.1",
      CLAMAV_PORT: String((server.address() as any).port),
      CLAMAV_TIMEOUT_MS: "500",
    },
    received,
    close: async () => {
      for (const socket of clients) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

test("Local development labels its bounded signature check honestly and computes the file digest", async () => {
  await settings({}, async () => {
    const bytes = Buffer.from("Synthetic harmless drawing bytes");
    const scan = await scanBuffer(bytes, { production: false });
    assert.equal(scan.status, "limited_checks");
    assert.equal(scan.engine, "builtin");
    assert.equal(scan.sha256, createHash("sha256").update(bytes).digest("hex"));
    assert.equal(securityPolicy(false).configured, false);
    assert.equal(securityPolicy(false).mode, "limited_development");
    assert.match(
      securityPolicy(false).label,
      /Antivirüs taraması yapılmış sayılmaz/,
    );
  });
});

test("Production never accepts a file without valid scanner configuration", async () => {
  for (const env of [
    {},
    { CLAMAV_HOST: "invalid/host" },
    { CLAMAV_HOST: "localhost", CLAMAV_PORT: "999999" },
  ] as Array<Record<string, string>>)
    await settings(env, async () => {
      assert.equal(securityPolicy(true).required, true);
      await assert.rejects(
        scanBuffer(Buffer.from("file"), { production: true }),
        (error: unknown) =>
          error instanceof FileSecurityError &&
          error.status === 503 &&
          error.scan.status === "scan_error",
      );
    });
});

test("ClamAV INSTREAM sends the exact bounded bytes and only an explicit OK yields clean", async () => {
  const fake = await clamd("stream: OK");
  try {
    await settings(fake.env, async () => {
      const bytes = Buffer.concat([
        Buffer.alloc(65536, 1),
        Buffer.from("synthetic drawing"),
      ]);
      const result = await scanBuffer(bytes, { production: true });
      assert.equal(result.status, "clean");
      assert.equal(result.engine, "clamav");
      assert.deepEqual(Buffer.concat(fake.received), bytes);
      assert.equal(
        result.sha256,
        createHash("sha256").update(bytes).digest("hex"),
      );
    });
  } finally {
    await fake.close();
  }
});

test("Malware responses, unknown replies and scanner timeouts all deny file access", async () => {
  for (const reply of [
    "stream: Synthetic.Test.Signature FOUND",
    "stream: scan ERROR",
    null,
  ]) {
    const fake = await clamd(reply);
    try {
      await settings({ ...fake.env, CLAMAV_TIMEOUT_MS: "100" }, async () => {
        await assert.rejects(
          scanBuffer(Buffer.from("synthetic bytes"), { production: true }),
          (error: unknown) =>
            error instanceof FileSecurityError &&
            error.status === (reply?.endsWith("FOUND") ? 422 : 503),
        );
      });
    } finally {
      await fake.close();
    }
  }
});

test("The harmless EICAR test marker is blocked even across stream chunk boundaries and without ClamAV", async () => {
  await settings({}, async () => {
    const bytes = Buffer.concat([
      Buffer.alloc(65530, 32),
      Buffer.from("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"),
      Buffer.from("synthetic tail"),
    ]);
    await assert.rejects(
      scanBuffer(bytes, { production: false }),
      (error: unknown) =>
        error instanceof FileSecurityError &&
        error.status === 422 &&
        error.scan.status === "infected",
    );
  });
});

test("Empty, oversized and symbolic-link inputs cannot enter the scan pipeline", async () => {
  await settings({}, async () => {
    await assert.rejects(
      scanBuffer(Buffer.alloc(0), { production: false }),
      (error: any) => error.status === 400,
    );
    await assert.rejects(
      scanBuffer(Buffer.alloc(12), { production: false, maxBytes: 10 }),
      (error: any) => error.status === 413,
    );
    const dir = await mkdtemp(join(tmpdir(), "kilinc-scan-"));
    try {
      await writeFile(join(dir, "file"), "safe bytes");
      await symlink(join(dir, "file"), join(dir, "link"));
      await assert.rejects(
        scanFile(join(dir, "link"), { production: false }),
        (error: any) => error.status === 413,
      );
      assert.equal(
        (await scanFile(join(dir, "file"), { production: false })).status,
        "limited_checks",
      );
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
