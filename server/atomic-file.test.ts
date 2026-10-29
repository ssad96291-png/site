import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { replaceAtomicFileSync } from "./atomic-file.js";

function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "kilinc-atomic-replace-"));
  const source = join(dir, "snapshot.tmp");
  const target = join(dir, "snapshot.enc");
  writeFileSync(source, "NEW-ENCRYPTED-SNAPSHOT");
  writeFileSync(target, "PREVIOUS-ACKNOWLEDGED-SNAPSHOT");
  return { dir, source, target };
}

test("Windows sharing violations retry while the previous acknowledged file stays intact", () => {
  const f = fixture();
  const delays: number[] = [];
  let calls = 0;
  try {
    replaceAtomicFileSync(f.source, f.target, {
      platform: "win32",
      wait: (milliseconds) => delays.push(milliseconds),
      rename: (source, target) => {
        calls++;
        assert.equal(
          readFileSync(target, "utf8"),
          "PREVIOUS-ACKNOWLEDGED-SNAPSHOT",
        );
        if (calls < 4)
          throw Object.assign(new Error("temporary sharing violation"), {
            code: ["EPERM", "EACCES", "EBUSY"][calls - 1],
          });
        renameSync(source, target);
      },
    });
    assert.deepEqual(delays, [10, 20, 40]);
    assert.equal(calls, 4);
    assert.equal(readFileSync(f.target, "utf8"), "NEW-ENCRYPTED-SNAPSHOT");
    assert.equal(existsSync(f.source), false);
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("Persistent Windows denial has a finite retry budget, preserves both files and rethrows the original failure", () => {
  const f = fixture();
  const original = Object.assign(new Error("permanent denial"), {
    code: "EPERM",
  });
  let calls = 0;
  const delays: number[] = [];
  try {
    assert.throws(
      () =>
        replaceAtomicFileSync(f.source, f.target, {
          platform: "win32",
          wait: (milliseconds) => delays.push(milliseconds),
          rename: () => {
            calls++;
            throw original;
          },
        }),
      (error) => error === original,
    );
    assert.equal(calls, 7);
    assert.equal(delays.reduce((total, delay) => total + delay, 0), 300);
    assert.equal(
      readFileSync(f.target, "utf8"),
      "PREVIOUS-ACKNOWLEDGED-SNAPSHOT",
    );
    assert.equal(readFileSync(f.source, "utf8"), "NEW-ENCRYPTED-SNAPSHOT");
  } finally {
    rmSync(f.dir, { recursive: true, force: true });
  }
});

test("Non-transient failures and non-Windows platforms do not delay or retry", () => {
  for (const [platform, code] of [
    ["win32", "ENOSPC"],
    ["win32", "ENOENT"],
    ["linux", "EPERM"],
  ] as const) {
    let calls = 0;
    const error = Object.assign(new Error("injected failure"), { code });
    assert.throws(
      () =>
        replaceAtomicFileSync("source", "target", {
          platform,
          rename: () => {
            calls++;
            throw error;
          },
          wait: () => assert.fail("unexpected wait"),
        }),
      (actual) => actual === error,
    );
    assert.equal(calls, 1);
  }
});
