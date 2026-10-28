import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { setGlobalProxyFromEnv } from "node:http";

// Node's fetch must use the inherited session proxy for its scoped credentials.
if (
  process.env.HTTPS_PROXY ||
  process.env.HTTP_PROXY ||
  process.env.https_proxy ||
  process.env.http_proxy
) {
  setGlobalProxyFromEnv();
}

export type NotificationChannel = "email" | "sms" | "whatsapp";
export interface OutboundNotification {
  id: string;
  channel: string;
  payload: Record<string, unknown>;
}
export interface DeliveryResult {
  status: "sent" | "waiting_configuration" | "failed";
  error?: string;
}
interface DeliveryRuntime {
  environment?: NodeJS.ProcessEnv;
  fetch?: typeof globalThis.fetch;
  resolve?: (
    hostname: string,
  ) => Promise<{ address: string; family: number }[]>;
  timeoutMs?: number;
}
interface Configuration {
  url: URL;
  token: string;
}

const CHANNELS = new Set<NotificationChannel>(["email", "sms", "whatsapp"]);
const HOSTNAME =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

function allowedPublicHostname(hostname: string) {
  return (
    HOSTNAME.test(hostname) &&
    !isIP(hostname) &&
    !/(?:^|\.)(?:localhost|local|internal|lan|home|invalid|test)$/.test(
      hostname,
    )
  );
}

function configuration(environment: NodeJS.ProcessEnv): Configuration | null {
  const rawUrl = environment.NOTIFY_WEBHOOK_URL?.trim();
  const token = environment.NOTIFY_WEBHOOK_TOKEN?.trim();
  const rawHosts = environment.NOTIFY_ALLOWED_HOSTS?.trim();
  if (
    !rawUrl ||
    !token ||
    !rawHosts ||
    rawUrl.length > 2048 ||
    token.length > 8192
  )
    return null;
  const hosts = rawHosts
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (!hosts.length || hosts.some((host) => !allowedPublicHostname(host)))
    return null;
  try {
    const url = new URL(rawUrl);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.hash ||
      (url.port && url.port !== "443") ||
      !allowedPublicHostname(url.hostname) ||
      !hosts.includes(url.hostname)
    )
      return null;
    return { url, token };
  } catch {
    return null;
  }
}

/** Configuration presence only. This does not claim provider authorization or delivery. */
export function deliveryConfigured(
  environment: NodeJS.ProcessEnv = process.env,
) {
  return configuration(environment) !== null;
}

function publicAddress(address: string) {
  const family = isIP(address);
  if (family === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2)))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  if (family === 6) {
    const normalized = new URL(`https://[${address}]/`).hostname
      .slice(1, -1)
      .toLowerCase();
    return !/^::|^f[cd]|^fe[89ab]|^ff|^2001:db8:|^2002:|^64:ff9b:/.test(
      normalized,
    );
  }
  return false;
}

/**
 * Sends only to the operator-configured, explicitly allowlisted HTTPS adapter.
 * "sent" means the adapter accepted the request (HTTP 2xx), not carrier delivery.
 * No destination, token, provider response body or customer payload is logged.
 */
export async function deliverNotification(
  notification: OutboundNotification,
  runtime: DeliveryRuntime = {},
): Promise<DeliveryResult> {
  const config = configuration(runtime.environment || process.env);
  if (!config)
    return {
      status: "waiting_configuration",
      error: "Bildirim servisi bağlantısı yapılandırılmalı.",
    };
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(notification.id) ||
    !CHANNELS.has(notification.channel as NotificationChannel) ||
    !notification.payload ||
    typeof notification.payload !== "object" ||
    Array.isArray(notification.payload)
  ) {
    return { status: "failed", error: "Geçersiz bildirim isteği." };
  }
  let body: string;
  try {
    body = JSON.stringify({
      id: notification.id,
      channel: notification.channel,
      payload: notification.payload,
    });
    if (Buffer.byteLength(body) > 64 * 1024)
      return { status: "failed", error: "Bildirim içeriği çok büyük." };
  } catch {
    return { status: "failed", error: "Bildirim içeriği hazırlanamadı." };
  }
  const controller = new AbortController();
  const timeout = Math.max(1, Math.min(runtime.timeoutMs || 10000, 10000));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timedOut = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("delivery-timeout"));
    }, timeout);
    timer.unref?.();
  });
  try {
    const operation = async (): Promise<DeliveryResult> => {
      const resolve =
        runtime.resolve ||
        ((hostname: string) => lookup(hostname, { all: true, verbatim: true }));
      // Defense in depth only: the inherited proxy may resolve this hostname
      // again. The operator must allowlist a trusted provider, never customer-
      // controlled domains. Egress policy remains the final network boundary.
      const addresses = await resolve(config.url.hostname);
      if (
        !addresses.length ||
        addresses.some((item) => !publicAddress(item.address))
      ) {
        return {
          status: "failed",
          error: "Bildirim servisinin ağ adresi kabul edilmedi.",
        };
      }
      const response = await (runtime.fetch || globalThis.fetch)(config.url, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${config.token}`,
          "Idempotency-Key": notification.id,
        },
        body,
      });
      // The adapter response may contain sensitive service details; never surface it.
      await response.body?.cancel();
      if (response.ok) return { status: "sent" };
      return {
        status: "failed",
        error:
          "Bildirim servisi isteği kabul etmedi. Bağlantı ve yetkileri kontrol edin.",
      };
    };
    return await Promise.race([operation(), timedOut]);
  } catch {
    return {
      status: "failed",
      error: "Bildirim servisine ulaşılamadı. Daha sonra yeniden deneyin.",
    };
  } finally {
    if (timer) clearTimeout(timer);
  }
}
