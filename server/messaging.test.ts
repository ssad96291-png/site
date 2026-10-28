import test from "node:test";
import assert from "node:assert/strict";
import { deliverNotification, deliveryConfigured } from "./messaging.js";

const environment = {
  NOTIFY_WEBHOOK_URL: "https://notify.example.com/messages",
  NOTIFY_WEBHOOK_TOKEN: "synthetic-test-token",
  NOTIFY_ALLOWED_HOSTS: "notify.example.com",
};
const notification = {
  id: "test-notification-123",
  channel: "sms",
  payload: { phone: "+900000000000", message: "Synthetic test message" },
};
const resolve = async () => [{ address: "93.184.216.34", family: 4 }];

test("Notification delivery requires complete allowed configuration without attempting network", async () => {
  let requests = 0;
  const transport = (async () => {
    requests++;
    throw new Error("must not run");
  }) as typeof fetch;
  for (const env of [
    {},
    { ...environment, NOTIFY_WEBHOOK_TOKEN: "" },
    { ...environment, NOTIFY_ALLOWED_HOSTS: "other.example.com" },
  ]) {
    assert.equal(deliveryConfigured(env), false);
    assert.equal(
      (
        await deliverNotification(notification, {
          environment: env,
          fetch: transport,
          resolve,
        })
      ).status,
      "waiting_configuration",
    );
  }
  assert.equal(requests, 0);
});

test("Notification adapter rejects private targets, credentials, ports and wildcard allowlists", async () => {
  const urls = [
    "http://notify.example.com/messages",
    "https://localhost/x",
    "https://127.0.0.1/x",
    "https://[::1]/x",
    "https://2130706433/x",
    "https://notify.example.com:8443/x",
    "https://user:pass@notify.example.com/x",
    "https://notify.example.com/x#fragment",
  ];
  for (const url of urls)
    assert.equal(
      deliveryConfigured({ ...environment, NOTIFY_WEBHOOK_URL: url }),
      false,
      url,
    );
  assert.equal(
    deliveryConfigured({
      ...environment,
      NOTIFY_ALLOWED_HOSTS: "*.example.com",
    }),
    false,
  );
  assert.equal(
    deliveryConfigured({
      ...environment,
      NOTIFY_ALLOWED_HOSTS: "notify.example.com,127.0.0.1",
    }),
    false,
  );
  assert.equal(deliveryConfigured(environment), true);
});

test("Private DNS answers never reach the transport", async () => {
  let requests = 0;
  const transport = (async () => {
    requests++;
    return new Response(null, { status: 202 });
  }) as typeof fetch;
  for (const address of [
    "127.0.0.1",
    "169.254.169.254",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "100.64.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "fd00::1",
    "fe80::1",
    "64:ff9b::7f00:1",
    "64:ff9b:1::7f00:1",
  ]) {
    const result = await deliverNotification(notification, {
      environment,
      fetch: transport,
      resolve: async () => [{ address, family: address.includes(":") ? 6 : 4 }],
    });
    assert.equal(result.status, "failed", address);
  }
  assert.equal(requests, 0);
});

test("Actual adapter acceptance sends authenticated idempotent JSON and never follows redirects", async () => {
  let calls = 0;
  const transport = (async (url: URL | RequestInfo, options?: RequestInit) => {
    calls++;
    assert.equal(String(url), environment.NOTIFY_WEBHOOK_URL);
    assert.equal(options?.method, "POST");
    assert.equal(options?.redirect, "error");
    const headers = new Headers(options?.headers);
    assert.equal(
      headers.get("authorization"),
      "Bearer " + environment.NOTIFY_WEBHOOK_TOKEN,
    );
    assert.equal(headers.get("idempotency-key"), notification.id);
    assert.deepEqual(JSON.parse(options?.body as string), notification);
    return new Response("private provider response", { status: 202 });
  }) as typeof fetch;
  assert.deepEqual(
    await deliverNotification(notification, {
      environment,
      resolve,
      fetch: transport,
    }),
    { status: "sent" },
  );
  assert.equal(calls, 1);
});

test("Provider failures and malformed payloads remain unsent without exposing response secrets", async () => {
  const transport = (async () =>
    new Response("provider secret synthetic-test-token", {
      status: 403,
    })) as typeof fetch;
  const result = await deliverNotification(notification, {
    environment,
    resolve,
    fetch: transport,
  });
  assert.equal(result.status, "failed");
  assert.doesNotMatch(
    JSON.stringify(result),
    /synthetic-test-token|provider secret/,
  );
  assert.equal(
    (
      await deliverNotification(
        { ...notification, id: "bad\r\nheader" },
        { environment, resolve, fetch: transport },
      )
    ).status,
    "failed",
  );
  assert.equal(
    (
      await deliverNotification(
        { ...notification, channel: "arbitrary" },
        { environment, resolve, fetch: transport },
      )
    ).status,
    "failed",
  );
  assert.equal(
    (
      await deliverNotification(
        { ...notification, payload: { oversized: "x".repeat(65536) } },
        { environment, resolve, fetch: transport },
      )
    ).status,
    "failed",
  );
});

test("Timeout and transport exceptions are sanitized and leave the job retryable", async () => {
  const transport = (async () => {
    throw new Error(
      "secret endpoint response " + environment.NOTIFY_WEBHOOK_TOKEN,
    );
  }) as typeof fetch;
  const result = await deliverNotification(notification, {
    environment,
    resolve,
    fetch: transport,
  });
  assert.equal(result.status, "failed");
  assert.doesNotMatch(
    JSON.stringify(result),
    /synthetic-test-token|secret endpoint/,
  );
  const slow = await deliverNotification(notification, {
    environment,
    resolve: () => new Promise(() => {}),
    timeoutMs: 10,
    fetch: transport,
  });
  assert.equal(slow.status, "failed");
});
