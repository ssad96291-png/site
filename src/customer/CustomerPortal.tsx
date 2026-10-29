import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  FolderKanban,
  HelpCircle,
  Loader2,
  LockKeyhole,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import "./customer.css";
import ProjectQuotes from "./ProjectQuotes";

type Stage =
  | "received"
  | "assigned"
  | "surveyed"
  | "production"
  | "installation"
  | "completed";
type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  customerType?: "individual" | "architect" | "corporate";
  status?: string;
  createdAt?: string;
  lastLoginAt?: string;
};
type Session = { customer: Customer; scoped?: boolean };
type AssignedTeam = {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  active?: boolean;
};
type Document = {
  id: string;
  name: string;
  kind: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
};
type Message = {
  id: string;
  kind: string;
  message: string;
  author: "customer" | "team";
  createdAt: string;
};
type Timeline = {
  id: string;
  stage: Stage;
  message: string;
  createdAt: string;
};
type Inquiry = {
  id: string;
  name: string;
  subject: string;
  product?: string;
  status: string;
  stage: Stage;
  createdAt: string;
  updatedAt?: string;
  appointmentAt?: string;
  technician?: string;
  customerMessage?: string;
  assignedTeam?: AssignedTeam | null;
  timeline: Timeline[];
  documents: Document[];
  messages: Message[];
};
type Notification = {
  id: string;
  title?: string;
  message?: string;
  body?: string;
  createdAt: string;
  read?: boolean;
  readAt?: string | null;
  inquiryId?: string;
};
const stages: { id: Stage; label: string; short: string }[] = [
  { id: "received", label: "Talebiniz alındı", short: "Talep" },
  { id: "assigned", label: "Keşif planlanıyor", short: "Planlama" },
  { id: "surveyed", label: "Keşif tamamlandı", short: "Keşif" },
  { id: "production", label: "Üretim aşamasında", short: "Üretim" },
  { id: "installation", label: "Montaj bekliyor", short: "Montaj" },
  { id: "completed", label: "Tamamlandı", short: "Teslim" },
];
const kinds: Record<string, string> = {
  project: "Proje çizimi",
  revision: "Teklif revizesi",
  appointment: "Keşif / randevu değişikliği",
  support: "Destek talebi",
  quote: "Fiyat teklifi",
  survey: "Keşif raporu",
  warranty: "Garanti belgesi",
  contract: "Sözleşme",
  other: "Diğer belge",
};
const date = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Henüz belirlenmedi";
const stageLabel = (value?: string) =>
  stages.find((s) => s.id === value)?.label || "Talebiniz alındı";
const ref = (value: string) => value.slice(0, 8).toUpperCase();
class PortalError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`/api/customer${path}`, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Sunucudan beklenen yanıt alınamadı." }));
  if (!response.ok)
    throw new PortalError(
      data.error || "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
      response.status,
    );
  return data as T;
}

export default function CustomerPortal() {
  const [session, setSession] = useState<Session | null>(null),
    [checking, setChecking] = useState(true),
    [inquiries, setInquiries] = useState<Inquiry[]>([]),
    [notifications, setNotifications] = useState<Notification[]>([]),
    [selected, setSelected] = useState(""),
    [section, setSection] = useState<"requests" | "profile" | "notifications">(
      "requests",
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [claimNotice, setClaimNotice] = useState("");
  const [recoveryToken, setRecoveryToken] = useState(
    () =>
      new URLSearchParams(window.location.hash.replace(/^#/, "")).get(
        "reset",
      ) ||
      new URLSearchParams(window.location.search).get("reset") ||
      sessionStorage.getItem("kilinc-portal-reset") ||
      "",
  );
  const initialRequest = useRef<Promise<Session> | null>(null),
    noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 6500);
  }, []);
  useEffect(() => {
    if (recoveryToken) {
      sessionStorage.setItem("kilinc-portal-reset", recoveryToken);
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname,
      );
      setChecking(false);
      return;
    }
    if (!initialRequest.current) {
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, "")),
        query = new URLSearchParams(window.location.search);
      const raw =
        hash.get("claim") ||
        hash.get("receipt") ||
        query.get("claim") ||
        query.get("receipt") ||
        sessionStorage.getItem("kilinc-portal-claim");
      if (raw) {
        sessionStorage.removeItem("kilinc-portal-claim");
        window.history.replaceState(
          window.history.state,
          "",
          window.location.pathname,
        );
        setClaimNotice("Talebinize ait güvenli takip bağlantısı açılıyor.");
        initialRequest.current = api<Session>("/claim", {
          method: "POST",
          body: JSON.stringify({ token: raw }),
        });
      } else initialRequest.current = api<Session>("/me");
    }
    let cancelled = false;
    initialRequest.current
      .then((value) => {
        if (!cancelled) {
          setSession(value);
          setClaimNotice(
            value.scoped
              ? "Bu güvenli oturum yalnızca yeni talebinizi gösterir. İsterseniz hesabınızı tamamlayarak daha sonra da giriş yapabilirsiniz."
              : "",
          );
        }
      })
      .catch((err) => {
        if (!cancelled && (!(err instanceof PortalError) || err.status !== 401))
          setError((err as Error).message);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const load = useCallback(async (quiet = false) => {
    if (!quiet) setBusy(true);
    try {
      const [requests, bells] = await Promise.all([
        api<{ inquiries: Inquiry[] }>("/inquiries"),
        api<{ notifications: Notification[] }>("/notifications"),
      ]);
      setInquiries(requests.inquiries);
      setNotifications(bells.notifications);
      setSelected((current) =>
        requests.inquiries.some((i) => i.id === current)
          ? current
          : requests.inquiries[0]?.id || "",
      );
      if (!quiet) setError("");
    } catch (err) {
      if (
        err instanceof PortalError &&
        (err.status === 401 || err.status === 403)
      ) {
        setSession(null);
        setInquiries([]);
        setNotifications([]);
      }
      setError((err as Error).message);
    } finally {
      if (!quiet) setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (!session) return;
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [session, load]);
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  async function logout() {
    setBusy(true);
    try {
      await api("/logout", { method: "POST", body: "{}" });
      setSession(null);
      setInquiries([]);
      setNotifications([]);
      setClaimNotice("");
      notify("Güvenli çıkış yapıldı.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function readNotification(item: Notification) {
    try {
      await api(`/notifications/${item.id}/read`, {
        method: "POST",
        body: "{}",
      });
      setNotifications((all) =>
        all.map((n) =>
          n.id === item.id
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n,
        ),
      );
      if (item.inquiryId && inquiries.some((i) => i.id === item.inquiryId)) {
        setSelected(item.inquiryId);
        setSection("requests");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  }
  const current = inquiries.find((i) => i.id === selected),
    unread = notifications.filter((n) => !n.read && !n.readAt).length;
  if (checking)
    return (
      <div className="cp-shell cp-loading" role="status">
        <Loader2 className="cp-spin" />
        <h1>Takip paneliniz hazırlanıyor</h1>
        <p>Güvenli oturumunuz kontrol ediliyor…</p>
      </div>
    );
  if (recoveryToken)
    return (
      <div className="cp-shell">
        <div className="cp-reset-layout">
          <section className="cp-panel">
            <span className="cp-eyebrow">GÜVENLİ HESAP KURTARMA</span>
            <h1>Yeni parolanızı belirleyin.</h1>
            <p className="cp-muted">
              Bu bağlantı hesabınız için tek kullanımlıktır. Yeni parolanızı
              belirledikten sonra e-posta adresinizle giriş yapabilirsiniz.
            </p>
            <ResetPassword
              token={recoveryToken}
              onDone={() => {
                sessionStorage.removeItem("kilinc-portal-reset");
                setRecoveryToken("");
                setNotice(
                  "Parolanız yenilendi. Yeni parolanızla giriş yapabilirsiniz.",
                );
              }}
              onCancel={() => {
                sessionStorage.removeItem("kilinc-portal-reset");
                setRecoveryToken("");
              }}
            />
          </section>
        </div>
      </div>
    );
  if (!session)
    return (
      <AuthCard
        error={error}
        notice={notice}
        onAuthenticated={(value) => {
          setSession(value);
          setSection("requests");
          setError("");
          setNotice("");
        }}
      />
    );
  return (
    <div className="cp-shell">
      <div className="cp-container">
        <header className="cp-top">
          <div>
            <span className="cp-eyebrow">KILINÇ / MÜŞTERİ ALANI</span>
            <h1>
              Merhaba, {session.customer.name.split(" ")[0] || "hoş geldiniz"}.
            </h1>
            <p>Talebinizin her adımı, tek bir yerde.</p>
          </div>
          <div className="cp-top-actions">
            <Link to="/urunler">
              <ArrowLeft size={15} />
              Siteye dön
            </Link>
            <button
              className="cp-notifications-trigger"
              onClick={() => setSection("notifications")}
              aria-label={`Bildirimler${unread ? `, ${unread} okunmamış` : ""}`}
            >
              <Bell size={19} />
              {unread > 0 && <span>{unread}</span>}
            </button>
            <button
              onClick={logout}
              disabled={busy}
              className="cp-icon"
              aria-label="Müşteri hesabından çıkış"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        {error && (
          <div role="alert" className="cp-alert error">
            {error}
            <button
              onClick={() => setError("")}
              aria-label="Hata bildirimini kapat"
            >
              <X size={15} />
            </button>
          </div>
        )}
        {notice && (
          <div role="status" className="cp-alert success">
            <CheckCircle2 size={17} />
            {notice}
          </div>
        )}
        {claimNotice && session.scoped && (
          <div className="cp-claim-note">
            <ShieldCheck size={21} />
            <p>{claimNotice}</p>
            <button onClick={() => setSection("profile")}>
              Hesabımı tamamla
              <ArrowRight size={14} />
            </button>
          </div>
        )}
        <div className="cp-layout">
          <aside className="cp-sidebar">
            <div className="cp-account">
              <span className="cp-avatar">
                {session.customer.name.charAt(0) || "K"}
              </span>
              <strong>{session.customer.name}</strong>
              <small>
                {session.scoped
                  ? "Güvenli talep oturumu"
                  : session.customer.email}
              </small>
            </div>
            <nav aria-label="Müşteri paneli menüsü">
              <button
                className={section === "requests" ? "active" : ""}
                onClick={() => setSection("requests")}
              >
                <FolderKanban size={18} />
                Taleplerim & Projelerim<span>{inquiries.length}</span>
              </button>
              <button
                className={section === "notifications" ? "active" : ""}
                onClick={() => setSection("notifications")}
              >
                <Bell size={18} />
                Bildirimler{unread > 0 && <span>{unread}</span>}
              </button>
              <button
                className={section === "profile" ? "active" : ""}
                onClick={() => setSection("profile")}
              >
                <UserRound size={18} />
                {session.scoped ? "Hesabımı tamamla" : "Hesap bilgilerim"}
              </button>
            </nav>
            <div className="cp-sidebar-help">
              <HelpCircle size={19} />
              <strong>Bir değişiklik mi gerekiyor?</strong>
              <p>
                İlgili talebinizi seçerek ekipten destek veya teklif revizesi
                isteyebilirsiniz.
              </p>
              <Link to="/proje-teklif">
                Yeni proje / fiyat talebi
                <ArrowRight size={13} />
              </Link>
              <Link to="/iletisim">
                İletişim bilgileri
                <ArrowRight size={13} />
              </Link>
            </div>
          </aside>
          <main className="cp-main">
            {section === "requests" && (
              <>
                <div className="cp-stats">
                  <article>
                    <span>
                      <FolderKanban size={18} />
                      Toplam talep
                    </span>
                    <strong>{inquiries.length}</strong>
                  </article>
                  <article>
                    <span>
                      <Clock3 size={18} />
                      Devam eden
                    </span>
                    <strong>
                      {inquiries.filter((i) => i.stage !== "completed").length}
                    </strong>
                  </article>
                  <article>
                    <span>
                      <FileCheck2 size={18} />
                      Paylaşılan belge
                    </span>
                    <strong>
                      {inquiries.reduce(
                        (total, i) => total + (i.documents?.length || 0),
                        0,
                      )}
                    </strong>
                  </article>
                </div>
                <div className="cp-section-heading">
                  <div>
                    <h2>Taleplerim & Projelerim</h2>
                    <p>
                      Güncellemeler açık panelinizde yaklaşık 10 saniyede
                      yenilenir.
                    </p>
                  </div>
                  <button
                    className="cp-refresh"
                    onClick={() => void load()}
                    disabled={busy}
                    aria-label="Taleplerimi yenile"
                  >
                    <RefreshCw size={16} className={busy ? "cp-spin" : ""} />
                  </button>
                </div>
                {inquiries.length > 0 ? (
                  <>
                    <div className="cp-request-selector" role="list">
                      {inquiries.map((item) => (
                        <button
                          role="listitem"
                          className={selected === item.id ? "selected" : ""}
                          onClick={() => setSelected(item.id)}
                          key={item.id}
                        >
                          <span>
                            <small>#{ref(item.id)}</small>
                            <strong>
                              {item.product ||
                                item.subject ||
                                "Keşif ve teklif talebi"}
                            </strong>
                            <small>{date(item.createdAt)}</small>
                          </span>
                          <span
                            className={`cp-status ${item.stage === "completed" ? "complete" : ""}`}
                          >
                            {stageLabel(item.stage)}
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </div>
                    {current && (
                      <RequestDetail
                        key={current.id}
                        inquiry={current}
                        onChanged={() => load(true)}
                        notify={notify}
                      />
                    )}
                  </>
                ) : (
                  <div className="cp-empty">
                    <FolderKanban size={35} />
                    <h3>Henüz hesabınıza bağlı bir talep yok</h3>
                    <p>
                      Yeni bir keşif veya teklif talebi oluşturabilirsiniz.
                      Önceden farklı bir bağlantıyla oluşturduğunuz talepler
                      için ekibimizden yardım isteyin.
                    </p>
                    <Link className="cp-button primary" to="/teklif-al">
                      Yeni talep oluştur
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}
              </>
            )}
            {section === "notifications" && (
              <section className="cp-panel">
                <div className="cp-section-heading">
                  <div>
                    <h2>Bildirimler</h2>
                    <p>
                      Talep durumları, ekip mesajları ve paylaşılan belgeler.
                    </p>
                  </div>
                  <span className="cp-count">{unread} okunmamış</span>
                </div>
                {notifications.length ? (
                  notifications.map((item) => (
                    <button
                      key={item.id}
                      className={`cp-notification ${!item.read && !item.readAt ? "unread" : ""}`}
                      onClick={() => void readNotification(item)}
                    >
                      <span>
                        <Bell size={17} />
                      </span>
                      <span>
                        <strong>
                          {item.title || "Talebinizle ilgili güncelleme"}
                        </strong>
                        <p>
                          {item.message ||
                            item.body ||
                            "Talebinizin son durumunu takip panelinden inceleyebilirsiniz."}
                        </p>
                        <small>{date(item.createdAt)}</small>
                      </span>
                      {!item.read && !item.readAt && (
                        <i aria-label="Okunmamış" />
                      )}
                    </button>
                  ))
                ) : (
                  <div className="cp-empty compact">
                    <Bell size={30} />
                    <h3>Şimdilik yeni bildirim yok</h3>
                    <p>Talebinizle ilgili güncellemeler burada görünecek.</p>
                  </div>
                )}
              </section>
            )}
            {section === "profile" &&
              (session.scoped ? (
                <section className="cp-panel">
                  <div className="cp-section-heading">
                    <div>
                      <h2>Hesabınızı tamamlayın</h2>
                      <p>
                        Bir parola belirleyerek daha sonra e-posta adresinizle
                        giriş yapabilirsiniz.
                      </p>
                    </div>
                    <ShieldCheck size={23} />
                  </div>
                  <Registration
                    initial={session.customer}
                    scoped
                    onAuthenticated={(value) => {
                      setSession(value);
                      setClaimNotice("");
                      notify(
                        "Hesabınız oluşturuldu. Yeni parolanızla tekrar giriş yapabilirsiniz.",
                      );
                    }}
                  />
                  <p className="cp-footnote">
                    Bu e-posta adresiyle zaten hesabınız varsa çıkış yapmadan
                    önce aşağıdaki alandan hesabınıza giriş yapabilirsiniz.
                    E-posta adresi eşleşmesi tek başına önceki taleplere erişim
                    sağlamaz.
                  </p>
                  <ExistingAccount
                    onAuthenticated={(value) => {
                      setSession(value);
                      setClaimNotice("");
                      notify("Hesabınıza giriş yapıldı.");
                    }}
                  />
                </section>
              ) : (
                <Profile
                  customer={session.customer}
                  onUpdated={(customer) => {
                    setSession({ ...session, customer });
                    notify("Hesap bilgileriniz güncellendi.");
                  }}
                  onPasswordChanged={() => {
                    setSession(null);
                    setInquiries([]);
                    setNotifications([]);
                    setNotice(
                      "Parolanız güncellendi. Yeni parolanızla tekrar giriş yapın.",
                    );
                  }}
                />
              ))}
          </main>
        </div>
        <footer className="cp-footer">
          <ShieldCheck size={14} />
          Yalnızca size ait talepler ve sizinle paylaşılan bilgiler
          görüntülenir.
        </footer>
      </div>
    </div>
  );
}

function AuthCard({
  error,
  notice,
  onAuthenticated,
}: {
  error: string;
  notice: string;
  onAuthenticated: (session: Session) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  return (
    <div className="cp-shell">
      <div className="cp-auth-layout">
        <section className="cp-auth-story">
          <Link to="/" className="cp-wordmark">
            KILINÇ<small>DEKORASYON</small>
          </Link>
          <span className="cp-eyebrow">MÜŞTERİ TAKİP PANELİ</span>
          <h1>
            Projenizin her adımına
            <br />
            daha yakın olun.
          </h1>
          <p>
            Keşif, teklif, üretim ve montaj sürecinizi takip edin. Belgeleriniz
            ve ekibimizle iletişiminiz bir arada.
          </p>
          <div>
            {[
              <FolderKanban key="a" />,
              <CalendarDays key="b" />,
              <FileText key="c" />,
            ].map((icon, i) => (
              <span key={i}>
                {icon}
                {["Süreç takibi", "Randevu bilgileri", "Özel PDF arşivi"][i]}
              </span>
            ))}
          </div>
          <small>
            Takip bağlantınız varsa bağlantıyı açmanız yeterli. Teklif istemek
            için üye olmanız gerekmez.
          </small>
        </section>
        <section className="cp-auth-card">
          <div
            className="cp-auth-tabs"
            role="tablist"
            aria-label="Müşteri hesabı"
          >
            <button
              role="tab"
              aria-selected={mode === "login"}
              className={mode === "login" ? "active" : ""}
              onClick={() => setMode("login")}
            >
              Giriş yap
            </button>
            <button
              role="tab"
              aria-selected={mode === "register"}
              className={mode === "register" ? "active" : ""}
              onClick={() => setMode("register")}
            >
              Hesap oluştur
            </button>
          </div>
          <h2>
            {mode === "login"
              ? "Tekrar hoş geldiniz."
              : "Hesabınızı oluşturun."}
          </h2>
          <p>
            {mode === "login"
              ? "E-posta adresiniz ve parolanızla sürecinizi takip edin."
              : "Yeni taleplerinizi tek bir hesapta takip edin."}
          </p>
          {error && (
            <div className="cp-alert error" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="cp-alert success" role="status">
              {notice}
            </div>
          )}
          {mode === "login" ? (
            <ExistingAccount onAuthenticated={onAuthenticated} />
          ) : (
            <Registration onAuthenticated={onAuthenticated} />
          )}
          <div className="cp-auth-help">
            <HelpCircle size={18} />
            <div>
              <strong>Giriş yapamıyor musunuz?</strong>
              <p>
                Takip bağlantınızı yeniden açın veya iletişim sayfasından hesap
                desteği isteyin. Parolanızı kimseyle paylaşmayın.
              </p>
              <Link to="/iletisim">
                Destek isteyin
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
          <Link className="cp-back" to="/">
            <ArrowLeft size={14} />
            Siteye dön
          </Link>
        </section>
      </div>
    </div>
  );
}
function ExistingAccount({
  onAuthenticated,
}: {
  onAuthenticated: (session: Session) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [visible, setVisible] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      onAuthenticated(
        await api<Session>("/login", {
          method: "POST",
          body: JSON.stringify({
            email: form.get("email"),
            password: form.get("password"),
          }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="cp-form" onSubmit={submit}>
      {error && (
        <div role="alert" className="cp-alert error">
          {error}
        </div>
      )}
      <label>
        E-posta adresiniz
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          maxLength={254}
          placeholder="ornek@eposta.com"
        />
      </label>
      <label>
        Parolanız
        <span className="cp-password">
          <input
            type={visible ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            maxLength={256}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
          >
            {visible ? "Gizle" : "Göster"}
          </button>
        </span>
      </label>
      <button className="cp-button primary" type="submit" disabled={busy}>
        {busy ? (
          <Loader2 size={17} className="cp-spin" />
        ) : (
          <LockKeyhole size={16} />
        )}
        Müşteri hesabına giriş yap
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
function Registration({
  initial,
  scoped = false,
  onAuthenticated,
}: {
  initial?: Customer;
  scoped?: boolean;
  onAuthenticated: (session: Session) => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("password") !== data.get("confirmPassword")) {
      setError("Parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      onAuthenticated(
        await api<Session>("/register", {
          method: "POST",
          body: JSON.stringify({
            name: data.get("name"),
            email: data.get("email"),
            phone: data.get("phone"),
            password: data.get("password"),
          }),
        }),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="cp-form" onSubmit={submit}>
      {error && (
        <div className="cp-alert error" role="alert">
          {error}
        </div>
      )}
      <label>
        Adınız soyadınız
        <input
          name="name"
          required
          minLength={2}
          maxLength={100}
          autoComplete="name"
          defaultValue={initial?.name || ""}
        />
      </label>
      <label>
        E-posta adresiniz
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          defaultValue={initial?.email || ""}
        />
      </label>
      <label>
        Telefon numaranız
        <input
          name="phone"
          type="tel"
          maxLength={50}
          autoComplete="tel"
          defaultValue={initial?.phone || ""}
        />
      </label>
      <div className="cp-field-pair">
        <label>
          Yeni parolanız
          <input
            name="password"
            type="password"
            required
            minLength={12}
            maxLength={256}
            autoComplete="new-password"
          />
          <small>En az 12 karakter kullanın.</small>
        </label>
        <label>
          Parolanızı tekrar yazın
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={12}
            maxLength={256}
            autoComplete="new-password"
          />
        </label>
      </div>
      <label className="cp-checkbox">
        <input type="checkbox" required />
        <span>
          <Link to="/kurumsal/kvkk" target="_blank" rel="noreferrer">
            Aydınlatma metnini
          </Link>{" "}
          ve{" "}
          <Link to="/kurumsal/gizlilik" target="_blank" rel="noreferrer">
            gizlilik bilgisini
          </Link>{" "}
          okudum.
        </span>
      </label>
      <button className="cp-button primary" disabled={busy}>
        {busy ? (
          <Loader2 size={17} className="cp-spin" />
        ) : (
          <UserRound size={16} />
        )}{" "}
        {scoped ? "Hesabımı tamamla" : "Hesap oluştur"}
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
function RequestDetail({
  inquiry,
  onChanged,
  notify,
}: {
  inquiry: Inquiry;
  onChanged: () => Promise<void>;
  notify: (message: string) => void;
}) {
  const [tab, setTab] = useState<
      "overview" | "documents" | "messages" | "projects"
    >("overview"),
    [kind, setKind] = useState("support"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const composer = useRef<HTMLTextAreaElement>(null);
  const index = Math.max(
    0,
    stages.findIndex((s) => s.id === inquiry.stage),
  );
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/inquiries/${inquiry.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ kind, message }),
      });
      setMessage("");
      await onChanged();
      notify("Mesajınız ekibimize iletildi.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const messages = inquiry.messages || [],
    documents = inquiry.documents || [],
    timeline = inquiry.timeline || [];
  return (
    <section className="cp-panel cp-request-detail">
      <header className="cp-request-heading">
        <div>
          <span className="cp-eyebrow">TALEP #{ref(inquiry.id)}</span>
          <h2>
            {inquiry.product || inquiry.subject || "Keşif ve teklif talebiniz"}
          </h2>
          <p>Oluşturuldu: {date(inquiry.createdAt)}</p>
        </div>
        <span
          className={`cp-status ${inquiry.stage === "completed" ? "complete" : ""}`}
        >
          {stageLabel(inquiry.stage)}
        </span>
      </header>
      <div className="cp-progress" aria-label="Talep süreci">
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            className={`${i < index ? "done" : ""} ${i === index ? "current" : ""}`}
            aria-current={i === index ? "step" : undefined}
          >
            <span>
              {i < index ? <Check size={15} /> : String(i + 1).padStart(2, "0")}
            </span>
            <small>{stage.short}</small>
          </div>
        ))}
      </div>
      <nav className="cp-detail-tabs" aria-label="Talep detayları">
        <button
          className={tab === "overview" ? "active" : ""}
          onClick={() => setTab("overview")}
        >
          Süreç & Ekip
        </button>
        <button
          className={tab === "projects" ? "active" : ""}
          onClick={() => setTab("projects")}
        >
          Proje dosyaları & teklifler
        </button>
        <button
          className={tab === "documents" ? "active" : ""}
          onClick={() => setTab("documents")}
        >
          Belgelerim<span>{documents.length}</span>
        </button>
        <button
          className={tab === "messages" ? "active" : ""}
          onClick={() => setTab("messages")}
        >
          Mesajlar<span>{messages.length}</span>
        </button>
      </nav>
      {tab === "projects" && (
        <ProjectQuotes
          key={inquiry.id}
          inquiryId={inquiry.id}
          onRequestRevision={(reference) => {
            setKind("revision");
            setMessage(
              (current) =>
                current ||
                `#${reference} numaralı teklif hakkında revize talebim: `,
            );
            setTab("messages");
            window.setTimeout(() => composer.current?.focus(), 0);
          }}
        />
      )}
      {tab === "overview" && (
        <>
          {inquiry.customerMessage && (
            <div className="cp-team-update">
              <MessageSquare size={18} />
              <div>
                <strong>Ekibimizden güncel bilgi</strong>
                <p>{inquiry.customerMessage}</p>
              </div>
            </div>
          )}
          <div className="cp-detail-grid">
            <div>
              <h3 className="cp-subheading">Süreç geçmişi</h3>
              {timeline.length ? (
                <ol className="cp-event-list">
                  {[...timeline].reverse().map((event) => (
                    <li key={event.id}>
                      <span />
                      <div>
                        <strong>{stageLabel(event.stage)}</strong>
                        {event.message && <p>{event.message}</p>}
                        <small>{date(event.createdAt)}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="cp-inline-empty">
                  <Clock3 size={20} />
                  <p>
                    Talebiniz alındı. Ekibimizin paylaştığı süreç güncellemeleri
                    burada görünecek.
                  </p>
                </div>
              )}
            </div>
            <div>
              <div className="cp-team-card">
                <div className="cp-card-title">
                  <UserRound size={19} />
                  <h3>Teknik irtibat</h3>
                </div>
                {inquiry.assignedTeam ? (
                  <>
                    <strong>{inquiry.assignedTeam.name}</strong>
                    {inquiry.assignedTeam.contactName && (
                      <p>{inquiry.assignedTeam.contactName}</p>
                    )}
                    {inquiry.assignedTeam.phone && (
                      <a
                        href={`tel:${inquiry.assignedTeam.phone.replace(/[^+\d]/g, "")}`}
                      >
                        <Phone size={14} />
                        {inquiry.assignedTeam.phone}
                      </a>
                    )}
                    {inquiry.assignedTeam.email && (
                      <a href={`mailto:${inquiry.assignedTeam.email}`}>
                        <Mail size={14} />
                        {inquiry.assignedTeam.email}
                      </a>
                    )}
                  </>
                ) : (
                  <p className="cp-muted">
                    Talebiniz değerlendiriliyor. İşinizle ilgilenecek kişinin
                    iletişim bilgileri planlama sırasında burada paylaşılacak.
                  </p>
                )}
                {inquiry.technician && (
                  <div className="cp-technician">
                    <span>Uygulama sorumlusu</span>
                    <strong>{inquiry.technician}</strong>
                  </div>
                )}
              </div>
              <div className="cp-appointment">
                <CalendarDays size={21} />
                <div>
                  <span>Keşif / uygulama randevusu</span>
                  <strong>{date(inquiry.appointmentAt)}</strong>
                </div>
              </div>
            </div>
          </div>
          <div className="cp-quick-requests">
            <h3>Bir değişiklik mi gerekiyor?</h3>
            <div>
              {[
                {
                  id: "revision",
                  title: "Teklifte değişiklik istiyorum",
                  icon: FileText,
                },
                {
                  id: "appointment",
                  title: "Keşif gününü değiştirmek istiyorum",
                  icon: CalendarDays,
                },
                {
                  id: "support",
                  title: "Destek istiyorum",
                  icon: MessageSquare,
                },
              ].map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    setKind(action.id);
                    setTab("messages");
                    setTimeout(() => composer.current?.focus(), 0);
                  }}
                >
                  <action.icon size={17} />
                  {action.title}
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {tab === "documents" && (
        <div className="cp-documents">
          {documents.length ? (
            documents.map((doc) => (
              <a
                key={doc.id}
                className="cp-document"
                href={
                  doc.downloadUrl ||
                  `/api/customer/documents/${doc.id}/download`
                }
                download
              >
                <span>
                  <FileText size={23} />
                </span>
                <span>
                  <strong>{doc.name}</strong>
                  <small>
                    {kinds[doc.kind] || "Paylaşılan belge"} ·{" "}
                    {Math.max(1, Math.round(doc.size / 1024))} KB ·{" "}
                    {date(doc.createdAt)}
                  </small>
                </span>
                <Download size={19} />
              </a>
            ))
          ) : (
            <div className="cp-empty compact">
              <FileText size={33} />
              <h3>Henüz paylaşılan belge yok</h3>
              <p>
                Ekibimizin sizinle paylaştığı teklif, keşif ve garanti belgeleri
                burada listelenir.
              </p>
            </div>
          )}
        </div>
      )}
      {tab === "messages" && (
        <div className="cp-message-area">
          <div className="cp-conversation">
            {messages.length ? (
              messages.map((item) => (
                <article
                  className={`cp-message ${item.author === "customer" ? "mine" : "team"}`}
                  key={item.id}
                >
                  <div>
                    <strong>
                      {item.author === "customer" ? "Siz" : "Kılınç ekibi"}
                    </strong>
                    <small>{kinds[item.kind] || "Mesaj"}</small>
                  </div>
                  <p>{item.message}</p>
                  <time>{date(item.createdAt)}</time>
                </article>
              ))
            ) : (
              <div className="cp-inline-empty">
                <MessageSquare size={23} />
                <p>
                  Talebinizle ilgili soru, destek veya değişiklik isteğinizi
                  aşağıdan iletebilirsiniz.
                </p>
              </div>
            )}
          </div>
          <form className="cp-form cp-composer" onSubmit={submit}>
            {error && (
              <div className="cp-alert error" role="alert">
                {error}
              </div>
            )}
            <label>
              Talebinizin konusu
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                {["support", "revision", "appointment"].map((k) => (
                  <option value={k} key={k}>
                    {kinds[k]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Mesajınız
              <textarea
                ref={composer}
                name="customerMessage"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={5}
                maxLength={5000}
                rows={4}
                placeholder="Değişiklik isteğinizi veya sorunuzu açıklayın…"
              />
            </label>
            <div>
              <small>
                Ödeme bilgisi veya hassas kişisel belge paylaşmayın.
              </small>
              <button className="cp-button primary" disabled={busy}>
                {busy ? (
                  <Loader2 className="cp-spin" size={17} />
                ) : (
                  <Send size={16} />
                )}
                Mesajı gönder
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
function Profile({
  customer,
  onUpdated,
  onPasswordChanged,
}: {
  customer: Customer;
  onUpdated: (customer: Customer) => void;
  onPasswordChanged: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [passwordError, setPasswordError] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      const result = await api<{ customer: Customer }>("/profile", {
        method: "PUT",
        body: JSON.stringify({
          name: form.get("name"),
          phone: form.get("phone"),
          address: form.get("address"),
          customerType: form.get("customerType"),
        }),
      });
      onUpdated(result.customer);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function password(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("newPassword") !== form.get("confirmPassword")) {
      setPasswordError("Yeni parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    setPasswordError("");
    try {
      await api("/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: form.get("currentPassword"),
          newPassword: form.get("newPassword"),
        }),
      });
      onPasswordChanged();
    } catch (err) {
      setPasswordError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="cp-profile">
      <section className="cp-panel">
        <div className="cp-section-heading">
          <div>
            <h2>Hesap bilgilerim</h2>
            <p>İletişim bilgilerinizi güncel tutun.</p>
          </div>
          <UserRound size={24} />
        </div>
        <form className="cp-form" onSubmit={save}>
          {error && (
            <div role="alert" className="cp-alert error">
              {error}
            </div>
          )}
          <label>
            Adınız soyadınız
            <input
              name="name"
              required
              minLength={2}
              maxLength={100}
              defaultValue={customer.name}
              autoComplete="name"
            />
          </label>
          <div className="cp-field-pair">
            <label>
              E-posta adresiniz
              <input type="email" value={customer.email} readOnly />
              <small>E-posta değişikliği için destek isteyin.</small>
            </label>
            <label>
              Telefon numaranız
              <input
                name="phone"
                type="tel"
                maxLength={50}
                defaultValue={customer.phone || ""}
                autoComplete="tel"
              />
            </label>
          </div>
          <label>
            Müşteri türü
            <select
              name="customerType"
              defaultValue={customer.customerType || "individual"}
            >
              <option value="individual">Bireysel müşteri</option>
              <option value="architect">Mimar / Mühendis</option>
              <option value="corporate">Kurumsal / Müteahhit</option>
            </select>
          </label>
          <label>
            Adresiniz
            <textarea
              name="address"
              rows={3}
              maxLength={2000}
              defaultValue={customer.address || ""}
              autoComplete="street-address"
            />
          </label>
          <button className="cp-button primary" disabled={busy}>
            {busy ? (
              <Loader2 className="cp-spin" size={16} />
            ) : (
              <Check size={16} />
            )}
            Bilgilerimi kaydet
          </button>
        </form>
      </section>
      <section className="cp-panel">
        <div className="cp-section-heading">
          <div>
            <h2>Parola değiştir</h2>
            <p>
              Yeni parolanız kaydedildiğinde yeniden giriş yapmanız gerekir.
            </p>
          </div>
          <LockKeyhole size={23} />
        </div>
        <form className="cp-form" onSubmit={password}>
          {passwordError && (
            <div className="cp-alert error" role="alert">
              {passwordError}
            </div>
          )}
          <label>
            Mevcut parolanız
            <input
              type="password"
              name="currentPassword"
              required
              autoComplete="current-password"
              maxLength={256}
            />
          </label>
          <div className="cp-field-pair">
            <label>
              Yeni parolanız
              <input
                type="password"
                name="newPassword"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
              />
              <small>En az 12 karakter.</small>
            </label>
            <label>
              Yeni parolanızı tekrar yazın
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={12}
                maxLength={256}
                autoComplete="new-password"
              />
            </label>
          </div>
          <button className="cp-button" disabled={busy}>
            {busy ? (
              <Loader2 className="cp-spin" size={16} />
            ) : (
              <ShieldCheck size={16} />
            )}
            Parolamı güncelle
          </button>
        </form>
      </section>
    </div>
  );
}

function ResetPassword({
  token,
  onDone,
  onCancel,
}: {
  token: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (data.get("newPassword") !== data.get("confirmPassword")) {
      setError("Parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/reset", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: data.get("newPassword") }),
      });
      onDone();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="cp-form" onSubmit={submit}>
      {error && (
        <div role="alert" className="cp-alert error">
          {error}
        </div>
      )}
      <label>
        Yeni parolanız
        <input
          name="newPassword"
          type="password"
          required
          minLength={12}
          maxLength={256}
          autoComplete="new-password"
        />
        <small>En az 12 karakter kullanın.</small>
      </label>
      <label>
        Parolanızı tekrar yazın
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={12}
          maxLength={256}
          autoComplete="new-password"
        />
      </label>
      <button className="cp-button primary" disabled={busy}>
        {busy ? (
          <Loader2 className="cp-spin" size={17} />
        ) : (
          <ShieldCheck size={17} />
        )}
        Yeni parolamı kaydet
      </button>
      <button
        type="button"
        className="cp-back cp-reset-cancel"
        onClick={onCancel}
      >
        <ArrowLeft size={14} />
        Giriş ekranına dön
      </button>
    </form>
  );
}
