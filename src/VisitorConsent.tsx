import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { BarChart3, ShieldCheck, X } from "lucide-react";
import "./visitor-consent.css";
const CHOICE_KEY = "kilinc-analytics-consent-v1";
const SESSION_KEY = "kilinc-analytics-session-v1";
type Choice = "on" | "off" | "pending";
type EventKind =
  | "pageview"
  | "heartbeat"
  | "document_download"
  | "dealer_click"
  | "form_start"
  | "form_abandoned";
const privatePath = (path: string) =>
  /^\/(api|admin|yonetim|hesabim|musteri|bayi|uploads)(\/|$)/i.test(path);
function currentChoice(): Choice {
  try {
    const value = localStorage.getItem(CHOICE_KEY);
    return value === "on" || value === "off" ? value : "pending";
  } catch {
    return "pending";
  }
}
function sessionId() {
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const bytes = crypto.getRandomValues(new Uint8Array(20));
    const id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
      "",
    );
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return undefined;
  }
}
export function trackVisitorEvent(
  kind: EventKind,
  details: { path?: string; form?: string } = {},
) {
  if (currentChoice() !== "on") return;
  const path = (details.path || window.location.pathname).split(/[?#]/, 1)[0];
  if (privatePath(path)) return;
  const id = sessionId();
  if (!id) return;
  const device = window.matchMedia("(max-width: 600px)").matches
    ? "mobile"
    : window.matchMedia("(max-width: 1024px)").matches
      ? "tablet"
      : "desktop";
  void fetch("/api/telemetry", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      consent: true,
      sessionId: id,
      kind,
      path,
      device,
      ...(details.form ? { form: details.form } : {}),
    }),
  }).catch(() => {});
}
export default function VisitorConsent() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState<Choice>(currentChoice);
  const [editing, setEditing] = useState(false);
  const activeForm = useRef<string | null>(null);
  const restricted = privatePath(pathname);
  useEffect(() => {
    if (choice !== "on" || restricted) return;
    activeForm.current = null;
    trackVisitorEvent("pageview", { path: pathname });
    const timer = setInterval(() => {
      if (!document.hidden) trackVisitorEvent("heartbeat", { path: pathname });
    }, 30_000);
    const click = (event: MouseEvent) => {
      const element = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("a[href]");
      if (!element) return;
      try {
        const url = new URL(element.href, location.origin);
        if (url.origin !== location.origin) return;
        if (/^\/api\/(catalog\.pdf|measurement-guide\.pdf)$/.test(url.pathname))
          trackVisitorEvent("document_download", { path: pathname });
        else if (
          url.pathname === "/bolgeler" ||
          url.pathname.startsWith("/bolgeler/")
        )
          trackVisitorEvent("dealer_click", { path: pathname });
      } catch {}
    };
    const focus = (event: Event) => {
      if (activeForm.current) return;
      const form = (event.target as Element | null)?.closest(
        "form.inquiry-form",
      );
      if (!form) return;
      const type =
        pathname === "/teklif-al"
          ? "quote"
          : pathname === "/servis-talebi"
            ? "service"
            : pathname === "/proje-birimi"
              ? "project"
              : "contact";
      activeForm.current = type;
      trackVisitorEvent("form_start", { path: pathname, form: type });
    };
    const submitted = () => {
      activeForm.current = null;
    };
    const leaving = () => {
      if (activeForm.current) {
        trackVisitorEvent("form_abandoned", {
          path: pathname,
          form: activeForm.current,
        });
        activeForm.current = null;
      }
    };
    document.addEventListener("click", click);
    document.addEventListener("input", focus);
    window.addEventListener("kilinc-inquiry-submitted", submitted);
    window.addEventListener("pagehide", leaving);
    return () => {
      clearInterval(timer);
      leaving();
      document.removeEventListener("click", click);
      document.removeEventListener("input", focus);
      window.removeEventListener("kilinc-inquiry-submitted", submitted);
      window.removeEventListener("pagehide", leaving);
    };
  }, [choice, pathname, restricted]);
  async function choose(value: "on" | "off") {
    try {
      localStorage.setItem(CHOICE_KEY, value);
    } catch {}
    setChoice(value);
    setEditing(false);
    if (value === "off") {
      try {
        const id = sessionStorage.getItem(SESSION_KEY);
        if (id)
          await fetch("/api/telemetry/forget", {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId: id }),
          });
        sessionStorage.removeItem(SESSION_KEY);
      } catch {}
    }
  }
  if (restricted) return null;
  const open = choice === "pending" || editing;
  return (
    <div className="vc-root">
      {open ? (
        <section className="vc-banner" aria-label="Gizlilik tercihleri">
          <div className="vc-icon">
            <ShieldCheck size={23} />
          </div>
          <div className="vc-copy">
            <strong>Gizlilik tercihiniz sizin elinizde.</strong>
            <p>
              İzin verirseniz gezilen sayfaları ve anonim etkileşim sayılarını
              ölçeriz. Formlara yazdığınız ad, telefon ve mesajları toplamadan
              önce gönderiminizi bekleriz; ekran kaydı alınmaz. Hesap ve talep
              takibi bu izne bağlı değildir.
            </p>
            <a href="/kurumsal/gizlilik">Gizlilik bilgisi</a>
          </div>
          <div className="vc-actions">
            <button onClick={() => void choose("off")} className="vc-essential">
              Yalnızca gerekli
            </button>
            <button onClick={() => void choose("on")} className="vc-accept">
              Analitiğe izin ver
            </button>
            {choice !== "pending" && (
              <button
                onClick={() => setEditing(false)}
                aria-label="Tercihleri kapat"
                className="vc-close"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </section>
      ) : (
        <button className="vc-settings" onClick={() => setEditing(true)}>
          <BarChart3 size={13} />
          Gizlilik tercihleri
        </button>
      )}
    </div>
  );
}
