import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  FileText,
  GripVertical,
  KeyRound,
  Loader2,
  LockKeyhole,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import "./operations.css";

export type OperationsSection =
  "customers" | "pipeline" | "teams" | "notifications" | "staff";
type Stage =
  | "received"
  | "assigned"
  | "surveyed"
  | "production"
  | "installation"
  | "completed";
const stages: { id: Stage; label: string; short: string }[] = [
  { id: "received", label: "Talep alındı", short: "Yeni talep" },
  { id: "assigned", label: "Planlama", short: "Planlama" },
  { id: "surveyed", label: "Keşif tamamlandı", short: "Keşif tamam" },
  { id: "production", label: "Üretimde", short: "Üretimde" },
  { id: "installation", label: "Montaj bekliyor", short: "Montaj" },
  { id: "completed", label: "Tamamlandı", short: "Tamamlandı" },
];
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  customerType: "individual" | "architect" | "corporate";
  status: "active" | "suspended";
  pending?: boolean;
  createdAt: string;
  lastLoginAt?: string;
  inquiryCount: number;
  activeInquiryCount: number;
  online: boolean;
};
type Team = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  active: boolean;
  inquiryCount?: number;
  completedCount?: number;
};
type Document = {
  id: string;
  name: string;
  kind: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
};
type Conversation = {
  id: string;
  kind: string;
  message: string;
  createdAt: string;
  sender?: string;
  actor?: string;
  authorRole?: string;
  author?: string;
};
type Activity = {
  id: string;
  action: string;
  createdAt: string;
  detail?: string;
};
type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  product?: string;
  district?: string;
  service?: string;
  customerId?: string;
  stage: Stage;
  teamId?: string;
  technician?: string;
  appointmentAt?: string;
  customerMessage?: string;
  notes?: string;
  priority?: "normal" | "high";
  createdAt: string;
  updatedAt?: string;
  documents?: Document[];
  messages?: Conversation[];
  timeline?: {
    stage: string;
    createdAt: string;
    message?: string;
    at?: string;
  }[];
  assignedTeam?: Team;
};
type Staff = {
  id: string;
  username: string;
  role: "manager" | "editor" | "technician";
  status: "active" | "suspended";
  teamId?: string;
  region?: string;
  lastLoginAt?: string;
};
const customerTypes = {
  individual: "Bireysel müşteri",
  architect: "Mimar / mühendis",
  corporate: "Müteahhit / kurumsal",
};
const roles = {
  manager: "Operasyon sorumlusu",
  editor: "İçerik editörü",
  technician: "Teknik personel",
};
const date = (value?: string) =>
  value
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const stageOf = (lead: Lead): Stage =>
  stages.some((s) => s.id === lead.stage) ? lead.stage : "received";
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "İşlem tamamlanamadı.";
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Sunucudan beklenen yanıt alınamadı." }));
  if (!response.ok) throw new Error(data.error || "İşlem tamamlanamadı.");
  return data as T;
}
function json(method: string, body: unknown): RequestInit {
  return { method, body: JSON.stringify(body) };
}
function Alert({ children }: { children: ReactNode }) {
  return (
    <div className="ka-alert error" role="alert">
      {children}
    </div>
  );
}
function Empty({ title, text }: { title: string; text: string }) {
  return (
    <div className="op-empty">
      <FileText size={28} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="op-notice" role="status">
      <CheckCircle2 size={17} />
      {text}
      <button type="button" aria-label="Bildirimi kapat" onClick={onClose}>
        <X size={15} />
      </button>
    </div>
  );
}

export function OperationsPanel({
  section,
  role = "admin",
}: {
  section: OperationsSection;
  role?: string;
}) {
  const allowed =
    role === "admin" ||
    (role === "manager" && section !== "staff") ||
    (role === "technician" && ["pipeline", "notifications"].includes(section));
  if (!allowed) return <Alert>Bu bölüm için erişim yetkiniz bulunmuyor.</Alert>;
  return (
    <div className="op-workspace">
      {section === "customers" ? (
        <Customers canManage={role === "admin"} />
      ) : section === "pipeline" ? (
        <Pipeline canAssign={role !== "technician"} />
      ) : section === "teams" ? (
        <Teams canManage={role === "admin"} />
      ) : section === "staff" ? (
        <StaffManager />
      ) : (
        <Notifications />
      )}
    </div>
  );
}
export function OperationsSummary({ role = "admin" }: { role?: string } = {}) {
  const [data, setData] = useState<{
    customers: Customer[];
    inquiries: Lead[];
    teams: Team[];
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [customers, pipeline, teams] = await Promise.all([
          api<{ customers: Customer[] }>("/api/admin/customers"),
          api<{ inquiries: Lead[] }>("/api/admin/pipeline"),
          api<{ teams: Team[] }>("/api/admin/teams"),
        ]);
        if (alive) {
          setData({ ...customers, ...pipeline, ...teams });
          setError("");
        }
      } catch (e) {
        if (alive) setError(errorText(e));
      }
    };
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);
  if (error) return <Alert>{error}</Alert>;
  return (
    <div className="op-summary">
      {[
        { label: "Müşteri hesabı", value: data?.customers.length, icon: Users },
        {
          label: "Aktif proje / talep",
          value: data?.inquiries.filter((i) => stageOf(i) !== "completed")
            .length,
          icon: MessageSquare,
        },
        {
          label: "Aktif teknik ekip",
          value: data?.teams.filter((d) => d.active).length,
          icon: Users,
        },
        {
          label: "Keşif / montaj randevusu",
          value: data?.inquiries.filter(
            (i) =>
              i.appointmentAt &&
              new Date(i.appointmentAt).getTime() >= Date.now(),
          ).length,
          icon: CalendarDays,
        },
      ].map((c) => (
        <div className="ka-panel op-summary-card" key={c.label}>
          <c.icon size={20} />
          <strong>{c.value === undefined ? "—" : c.value}</strong>
          <span>{c.label}</span>
        </div>
      ))}
    </div>
  );
}

function Customers({ canManage }: { canManage: boolean }) {
  const [customers, setCustomers] = useState<Customer[]>([]),
    [selected, setSelected] = useState<Customer | null>(null),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState("all"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await api<{ customers: Customer[] }>(
        "/api/admin/customers",
      );
      setCustomers(result.customers);
      setSelected((c) =>
        c ? result.customers.find((i) => i.id === c.id) || null : null,
      );
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const visible = customers.filter(
    (c) =>
      (filter === "all" || c.status === filter) &&
      [c.name, c.email, c.phone, c.address]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <div className="op-section-intro">
        <div>
          <h2>Müşterileriniz tek bir yerde</h2>
          <p>
            Profil bilgilerini düzeltin, hesap erişimini yönetin ve müşterinin
            işlem geçmişini inceleyin.
          </p>
        </div>
        <button
          className="ka-button secondary"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>
      <div className="op-master-detail">
        <section className="ka-panel">
          <div className="ka-list-toolbar op-toolbar">
            <label className="ka-search">
              <Search size={17} />
              <input
                aria-label="Müşteri ara"
                placeholder="Ad, e-posta veya telefon ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              aria-label="Müşteri hesap durumu filtresi"
              className="ka-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">Tüm hesaplar</option>
              <option value="active">Aktif</option>
              <option value="suspended">Dondurulmuş</option>
            </select>
          </div>
          {loading ? (
            <div className="op-loading">
              <Loader2 className="spin" />
              Müşteriler yükleniyor…
            </div>
          ) : visible.length ? (
            visible.map((c) => (
              <button
                className={`op-customer-row ${selected?.id === c.id ? "selected" : ""}`}
                key={c.id}
                onClick={() => setSelected(c)}
              >
                <span className="op-avatar">{c.name?.charAt(0) || "M"}</span>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {c.email || c.phone || "İletişim bilgisi eklenmemiş"}
                  </small>
                  <small>
                    {customerTypes[c.customerType] || "Bireysel müşteri"} ·{" "}
                    {c.activeInquiryCount} aktif talep
                  </small>
                </span>
                <span
                  className={`op-state ${c.status === "suspended" ? "suspended" : c.online ? "online" : ""}`}
                >
                  {c.status === "suspended"
                    ? "Donduruldu"
                    : c.online
                      ? "Çevrimiçi"
                      : "Çevrimdışı"}
                </span>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <Empty
              title="Müşteri bulunamadı"
              text="Hesap açan ve talebini takip eden müşteriler burada görünür."
            />
          )}
        </section>
        {selected ? (
          <CustomerEditor
            key={selected.id}
            customer={selected}
            canManage={canManage}
            onSave={async (changes) => {
              await api(
                `/api/admin/customers/${selected.id}`,
                json("PATCH", changes),
              );
              await load();
              setNotice("Müşteri bilgileri kaydedildi.");
            }}
          />
        ) : (
          <section className="ka-panel">
            <Empty
              title="Bir müşteri seçin"
              text="Profil, hesap erişimi ve işlem geçmişini buradan yönetin."
            />
          </section>
        )}
      </div>
    </>
  );
}
function CustomerEditor({
  customer,
  onSave,
  canManage,
}: {
  customer: Customer;
  canManage: boolean;
  onSave: (changes: Partial<Customer>) => Promise<void>;
}) {
  const [draft, setDraft] = useState(customer),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [recovery, setRecovery] = useState<{
      url: string;
      expiresAt: string;
    } | null>(null),
    [events, setEvents] = useState<Activity[]>([]),
    [activityError, setActivityError] = useState("");
  useEffect(() => {
    if (!canManage) return;
    let alive = true;
    api<{ events: Activity[] }>(`/api/admin/customers/${customer.id}/activity`)
      .then((r) => {
        if (alive) {
          setEvents(r.events);
          setActivityError("");
        }
      })
      .catch((error) => {
        if (alive) setActivityError(errorText(error));
      });
    return () => {
      alive = false;
    };
  }, [customer.id, canManage]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    if (
      !customer.pending &&
      draft.email !== customer.email &&
      !window.confirm(
        "Müşterinin kimliğini doğruladınız mı? Giriş e-postası değişecek ve açık oturumları kapatılacak.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      await onSave({
        ...(!customer.pending ? { email: draft.email } : {}),
        name: draft.name,
        phone: draft.phone,
        address: draft.address,
        customerType: draft.customerType,
        status: draft.status,
      });
      setNotice("Profil güncellendi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function access(action: "revoke" | "recovery") {
    if (
      action === "revoke" &&
      !window.confirm("Bu müşterinin tüm açık oturumları kapatılsın mı?")
    )
      return;
    setBusy(true);
    setError("");
    try {
      const result = await api<{ url: string; expiresAt: string }>(
        `/api/admin/customers/${customer.id}/${action}`,
        json("POST", {}),
      );
      if (action === "recovery") setRecovery(result);
      else setNotice("Müşterinin açık oturumları kapatıldı.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ka-panel op-detail">
      <div className="ka-panel-title">
        <h2>Müşteri profili</h2>
        <span className="ka-badge published">
          {customer.inquiryCount} talep
        </span>
      </div>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <form onSubmit={submit} className="op-form">
        {!canManage && (
          <p className="op-muted">
            Profil bilgilerini görüntülüyorsunuz. Hesap değişiklikleri yönetici
            tarafından yapılır.
          </p>
        )}
        <fieldset className="op-fields" disabled={!canManage || busy}>
          <label className="ka-field">
            Ad soyad
            <input
              required
              minLength={2}
              maxLength={100}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="ka-field">
            E-posta
            <input
              type="email"
              maxLength={254}
              required={!customer.pending}
              value={draft.email || ""}
              readOnly={!!customer.pending}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            />
            <small>
              {customer.pending
                ? "Takip hesabının iletişim e-postasıdır; henüz bir giriş hesabına dönüşmemiştir."
                : "Giriş e-postasını yalnızca müşteri kimliğini doğruladıktan sonra düzeltin. Değişiklik açık oturumları kapatır; hesaplar birleştirilmez."}
            </small>
          </label>
          <div className="ka-field-grid">
            <label className="ka-field">
              Telefon
              <input
                maxLength={50}
                value={draft.phone || ""}
                onChange={(e) => setDraft({ ...draft, phone: e.target.value })}
              />
            </label>
            <label className="ka-field">
              Müşteri türü
              <select
                value={draft.customerType || "individual"}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    customerType: e.target.value as Customer["customerType"],
                  })
                }
              >
                {Object.entries(customerTypes).map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="ka-field">
            Adres
            <textarea
              rows={3}
              maxLength={1000}
              value={draft.address || ""}
              onChange={(e) => setDraft({ ...draft, address: e.target.value })}
            />
          </label>
          <label className="ka-field">
            Hesap durumu
            <select
              value={draft.status}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  status: e.target.value as Customer["status"],
                })
              }
            >
              <option value="active">Aktif — giriş yapabilir</option>
              <option value="suspended">Dondurulmuş — erişim kapalı</option>
            </select>
          </label>
          <button className="ka-button primary" disabled={busy} type="submit">
            {busy ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            Müşteri bilgilerini kaydet
          </button>
        </fieldset>
      </form>
      {canManage && (
        <div className="op-detail-block">
          <h3>
            <ShieldCheck size={17} />
            Hesap erişimini düzelt
          </h3>
          <p>
            Müşterinin parolasını görüntüleyemezsiniz. Kimliğini doğruladıktan
            sonra tek kullanımlık kurtarma bağlantısını güvenli bir kanaldan
            iletin.
          </p>
          <div className="op-button-row">
            <button
              type="button"
              disabled={busy}
              className="ka-button secondary"
              onClick={() => void access("recovery")}
            >
              <KeyRound size={15} />
              Kurtarma bağlantısı oluştur
            </button>
            <button
              type="button"
              disabled={busy}
              className="ka-button secondary"
              onClick={() => void access("revoke")}
            >
              <LockKeyhole size={15} />
              Oturumları kapat
            </button>
          </div>
          {recovery && (
            <div className="op-recovery">
              <strong>Tek kullanımlık bağlantı</strong>
              <p>
                Bu bağlantı hassastır. Yalnızca kimliği doğrulanmış müşteriye
                iletin. Son kullanım: {date(recovery.expiresAt)}
              </p>
              <input
                aria-label="Müşteri kurtarma bağlantısı"
                readOnly
                value={new URL(recovery.url, window.location.origin).href}
              />
              <button
                type="button"
                className="ka-button secondary"
                onClick={() =>
                  navigator.clipboard
                    .writeText(
                      new URL(recovery.url, window.location.origin).href,
                    )
                    .then(() => setNotice("Kurtarma bağlantısı kopyalandı."))
                    .catch(() =>
                      setError(
                        "Kopyalanamadı; bağlantıyı elle seçebilirsiniz.",
                      ),
                    )
                }
              >
                <Copy size={14} />
                Bağlantıyı kopyala
              </button>
              <button
                type="button"
                className="op-text-button"
                onClick={() => setRecovery(null)}
              >
                Bağlantıyı ekrandan gizle
              </button>
            </div>
          )}
        </div>
      )}
      <div className="op-detail-block">
        <h3>Hesap ve etkileşim geçmişi</h3>
        <dl className="op-meta">
          <dt>Kayıt tarihi</dt>
          <dd>{date(customer.createdAt)}</dd>
          <dt>Son giriş</dt>
          <dd>{date(customer.lastLoginAt)}</dd>
          <dt>Hesap kurulumu</dt>
          <dd>
            {customer.pending ? "Müşteri parola belirlememiş" : "Tamamlanmış"}
          </dd>
        </dl>
        {activityError && <Alert>{activityError}</Alert>}
        {!canManage ? (
          <p className="op-muted">
            Tüm hesap etkileşim geçmişini ana yönetici görüntüleyebilir.
          </p>
        ) : events.length ? (
          <ol className="op-events">
            {events.map((event) => (
              <li key={event.id}>
                <span>
                  {(
                    {
                      login: "Hesaba giriş yapıldı",
                      register: "Hesap oluşturuldu",
                      claim: "Talep takibi açıldı",
                      view: "Talep görüntülendi",
                      download: "Belge indirildi",
                      message: "Mesaj gönderildi",
                      profile: "Profil güncellendi",
                      "password-change": "Parola değiştirildi",
                      "password-reset": "Hesap kurtarıldı",
                      "admin-update": "Yönetici profil değişikliği",
                    } as Record<string, string>
                  )[event.action] || event.action}
                </span>
                {event.detail && <p>{event.detail}</p>}
                <small>{date(event.createdAt)}</small>
              </li>
            ))}
          </ol>
        ) : (
          <p className="op-muted">Henüz kayıtlı müşteri etkileşimi yok.</p>
        )}
      </div>
    </section>
  );
}

function Pipeline({ canAssign }: { canAssign: boolean }) {
  const [leads, setLeads] = useState<Lead[]>([]),
    [teams, setTeams] = useState<Team[]>([]),
    [selected, setSelected] = useState<Lead | null>(null),
    [query, setQuery] = useState(""),
    [view, setView] = useState<"board" | "list">("board"),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      const [p, d] = await Promise.all([
        api<{ inquiries: Lead[] }>("/api/admin/pipeline"),
        api<{ teams: Team[] }>("/api/admin/teams"),
      ]);
      setLeads(p.inquiries);
      setTeams(d.teams);
      setSelected((current) =>
        current ? p.inquiries.find((l) => l.id === current.id) || null : null,
      );
      setError("");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 30000);
    return () => clearInterval(timer);
  }, [load]);
  useEffect(() => {
    if (!selected) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const drawer = document.querySelector<HTMLElement>(".op-drawer");
    drawer?.querySelector<HTMLElement>("button,input,select")?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "Tab") {
        const nodes = Array.from(
          drawer?.querySelectorAll<HTMLElement>(
            "button,a,input,select,textarea",
          ) || [],
        ).filter(
          (node) =>
            !node.hasAttribute("disabled") && node.offsetParent !== null,
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          last?.focus();
          event.preventDefault();
        } else if (!event.shiftKey && document.activeElement === last) {
          first?.focus();
          event.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [selected?.id]);
  async function move(id: string, stage: Stage) {
    setError("");
    try {
      await api(`/api/admin/pipeline/${id}`, json("PATCH", { stage }));
      await load();
      setNotice("Süreç aşaması güncellendi; müşteri paneline yansıdı.");
    } catch (e) {
      setError(errorText(e));
    }
  }
  const visible = leads.filter((l) =>
    [
      l.id,
      l.name,
      l.email,
      l.phone,
      l.subject,
      l.district,
      l.product,
      l.service,
    ]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <div className="op-section-intro">
        <div>
          <h2>Talep ve proje süreçleri</h2>
          <p>
            Kartı bir aşamaya taşıyın veya seçim kutusunu kullanın. Belge ve
            müşteri mesajlarını kart detayından yönetin.
          </p>
        </div>
        <button
          className="ka-button secondary"
          type="button"
          onClick={() => void load()}
        >
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>
      <div className="op-pipeline-toolbar">
        <label className="ka-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Müşteri, ilçe, ürün veya talep numarası ara…"
            aria-label="Süreç ara"
          />
        </label>
        <div className="op-tabs">
          <button
            className={view === "board" ? "active" : ""}
            onClick={() => setView("board")}
          >
            Süreç panosu
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            Liste
          </button>
        </div>
      </div>
      {loading ? (
        <div className="op-loading">
          <Loader2 className="spin" />
          Süreçler yükleniyor…
        </div>
      ) : view === "board" ? (
        <div className="op-kanban" aria-label="Talep süreç panosu">
          {stages.map((stage) => (
            <section
              className="op-column"
              key={stage.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (leads.some((l) => l.id === id)) void move(id, stage.id);
              }}
            >
              <h3>
                <span>{stage.short}</span>
                <strong>
                  {visible.filter((l) => stageOf(l) === stage.id).length}
                </strong>
              </h3>
              {visible
                .filter((l) => stageOf(l) === stage.id)
                .map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onOpen={() => setSelected(lead)}
                    onMove={(stage) => void move(lead.id, stage)}
                  />
                ))}
              {!visible.some((l) => stageOf(l) === stage.id) && (
                <p className="op-column-empty">Bu aşamada talep yok.</p>
              )}
            </section>
          ))}
        </div>
      ) : (
        <section className="ka-panel">
          <div className="ka-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Müşteri / talep</th>
                  <th>Bölge</th>
                  <th>Aşama</th>
                  <th>Son işlem</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.name}</strong>
                      <small className="op-table-sub">
                        {lead.product || lead.subject}
                      </small>
                    </td>
                    <td>{lead.district || "—"}</td>
                    <td>
                      <select
                        aria-label={`${lead.name} süreç aşaması`}
                        value={stageOf(lead)}
                        onChange={(e) =>
                          void move(lead.id, e.target.value as Stage)
                        }
                      >
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{date(lead.updatedAt || lead.createdAt)}</td>
                    <td>
                      <button
                        className="ka-button secondary"
                        onClick={() => setSelected(lead)}
                      >
                        Detayı aç
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!visible.length && (
            <Empty
              title="Talep bulunamadı"
              text="Siteden gönderilen talepler burada süreç kartlarına dönüşür."
            />
          )}
        </section>
      )}
      {selected && (
        <div className="op-drawer-backdrop" onClick={() => setSelected(null)}>
          <section
            className="op-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Süreç detayları"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="op-drawer-title">
              <div>
                <small>TALEP #{selected.id.slice(0, 8).toUpperCase()}</small>
                <h2>{selected.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Süreç detayını kapat"
                onClick={() => setSelected(null)}
              >
                <X size={21} />
              </button>
            </div>
            <LeadEditor
              key={selected.id}
              lead={selected}
              teams={teams}
              canAssign={canAssign}
              onRefresh={load}
              onSaved={(message) => setNotice(message)}
            />
          </section>
        </div>
      )}
    </>
  );
}
function LeadCard({
  lead,
  onOpen,
  onMove,
}: {
  lead: Lead;
  onOpen: () => void;
  onMove: (stage: Stage) => void;
}) {
  return (
    <article
      className="op-lead-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", lead.id)}
    >
      <button className="op-card-open" onClick={onOpen}>
        <span>
          <small>#{lead.id.slice(0, 7).toUpperCase()}</small>
          <GripVertical size={14} />
        </span>
        <strong>{lead.name}</strong>
        <p>{lead.product || lead.service || lead.subject || "Teklif talebi"}</p>
        <small>
          {lead.district || "Bölge belirtilmedi"} · {date(lead.createdAt)}
        </small>
      </button>
      {lead.appointmentAt && (
        <p className="op-card-appointment">
          <CalendarDays size={12} />
          {date(lead.appointmentAt)}
        </p>
      )}
      <label className="op-card-stage">
        <span className="ka-sr-only">{lead.name} süreç aşaması</span>
        <select
          value={stageOf(lead)}
          onChange={(e) => onMove(e.target.value as Stage)}
        >
          {stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.short}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
function localDate(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function LeadEditor({
  lead,
  teams,
  canAssign,
  onRefresh,
  onSaved,
}: {
  lead: Lead;
  teams: Team[];
  canAssign: boolean;
  onRefresh: () => Promise<void>;
  onSaved: (message: string) => void;
}) {
  const [draft, setDraft] = useState({
      stage: stageOf(lead),
      teamId: lead.teamId || "",
      technician: lead.technician || "",
      appointmentAt: localDate(lead.appointmentAt),
      customerMessage: lead.customerMessage || "",
      notes: lead.notes || "",
      priority: lead.priority || "normal",
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [kind, setKind] = useState("support"),
    [documentTitle, setDocumentTitle] = useState(""),
    [documentKind, setDocumentKind] = useState("quote");
  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/admin/pipeline/${lead.id}`,
        json("PATCH", {
          ...draft,
          ...(!canAssign ? { teamId: undefined } : {}),
          appointmentAt: draft.appointmentAt
            ? new Date(draft.appointmentAt).toISOString()
            : "",
        }),
      );
      await onRefresh();
      onSaved("Süreç bilgileri kaydedildi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/admin/pipeline/${lead.id}/messages`,
        json("POST", { kind, message }),
      );
      setMessage("");
      await onRefresh();
      onSaved("Mesaj müşterinin paneline gönderildi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024 || file.type !== "application/pdf") {
      setError("En fazla 10 MB boyutunda bir PDF seçin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.set("document", file);
      await api(
        `/api/admin/pipeline/${lead.id}/documents?${new URLSearchParams({ title: documentTitle || file.name, kind: documentKind })}`,
        { method: "POST", body: form },
      );
      setDocumentTitle("");
      await onRefresh();
      onSaved("Belge müşterinin özel arşivine eklendi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(doc: Document) {
    if (!window.confirm(`“${doc.name}” belgesi kalıcı olarak silinsin mi?`))
      return;
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/documents/${doc.id}`, { method: "DELETE" });
      await onRefresh();
      onSaved("Belge silindi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="op-lead-editor">
      {error && <Alert>{error}</Alert>}
      <div className="op-lead-contact">
        <p>
          <strong>{lead.product || lead.subject}</strong>
        </p>
        <p>{lead.message}</p>
        <div>
          {lead.phone && (
            <a href={`tel:${lead.phone.replace(/[^+\d]/g, "")}`}>
              {lead.phone}
            </a>
          )}
          {lead.email && <a href={`mailto:${lead.email}`}>{lead.email}</a>}
        </div>
      </div>
      <form onSubmit={save} className="op-form">
        <div className="ka-field-grid">
          <label className="ka-field">
            Süreç aşaması
            <select
              value={draft.stage}
              onChange={(e) =>
                setDraft({ ...draft, stage: e.target.value as Stage })
              }
            >
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="ka-field">
            Sorumlu teknik ekip
            <select
              disabled={!canAssign}
              value={draft.teamId}
              onChange={(e) => setDraft({ ...draft, teamId: e.target.value })}
            >
              <option value="">Henüz atanmadı</option>
              {teams
                .filter((d) => d.active || d.id === draft.teamId)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {!d.active ? " (pasif)" : ""}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <div className="ka-field-grid">
          <label className="ka-field">
            Teknisyen / sorumlu
            <input
              maxLength={100}
              value={draft.technician}
              onChange={(e) =>
                setDraft({ ...draft, technician: e.target.value })
              }
            />
          </label>
          <label className="ka-field">
            Keşif / montaj randevusu
            <input
              type="datetime-local"
              value={draft.appointmentAt}
              onChange={(e) =>
                setDraft({ ...draft, appointmentAt: e.target.value })
              }
            />
          </label>
        </div>
        <label className="ka-field">
          Müşterinin göreceği durum açıklaması
          <textarea
            maxLength={3000}
            rows={3}
            value={draft.customerMessage}
            onChange={(e) =>
              setDraft({ ...draft, customerMessage: e.target.value })
            }
          />
          <small>Bu açıklama müşteri panelinde görünür.</small>
        </label>
        <label className="ka-field">
          Özel ekip notu
          <textarea
            maxLength={10000}
            rows={3}
            value={draft.notes}
            onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
          />
          <small>
            Yalnızca yetkili yönetim ekibi görür; müşteriye gösterilmez.
          </small>
        </label>
        <label className="ka-field">
          Öncelik
          <select
            value={draft.priority}
            onChange={(e) =>
              setDraft({
                ...draft,
                priority: e.target.value as "normal" | "high",
              })
            }
          >
            <option value="normal">Normal</option>
            <option value="high">Yüksek öncelik</option>
          </select>
        </label>
        <button className="ka-button primary" disabled={busy} type="submit">
          <Save size={16} />
          Süreci ve atamayı kaydet
        </button>
      </form>
      <section className="op-detail-block">
        <h3>
          <FileText size={18} />
          Müşteriye özel belgeler
        </h3>
        <p>
          Bu dosyalar herkese açık görsel klasörüne yüklenmez. Yalnızca ilgili
          müşteri ve yetkili ekip erişebilir.
        </p>
        <div className="ka-field-grid">
          <label className="ka-field">
            Belge adı
            <input
              maxLength={150}
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="Örn. Revize fiyat teklifi"
            />
          </label>
          <label className="ka-field">
            Belge türü
            <select
              value={documentKind}
              onChange={(e) => setDocumentKind(e.target.value)}
            >
              <option value="quote">Teklif / sözleşme</option>
              <option value="survey">Keşif / ölçü formu</option>
              <option value="warranty">Garanti belgesi</option>
              <option value="project">Proje belgesi</option>
            </select>
          </label>
        </div>
        <label
          className={`ka-button secondary op-upload ${busy ? "disabled" : ""}`}
        >
          <Upload size={15} />
          PDF yükle · en fazla 10 MB
          <input
            type="file"
            accept="application/pdf,.pdf"
            disabled={busy}
            onChange={(e) => {
              void upload(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        <div className="op-document-list">
          {(lead.documents || []).map((doc) => (
            <div key={doc.id}>
              <FileText size={19} />
              <span>
                <strong>{doc.name}</strong>
                <small>
                  {date(doc.createdAt)} · {Math.ceil(doc.size / 1024)} KB
                </small>
              </span>
              <a
                href={
                  doc.downloadUrl || `/api/admin/documents/${doc.id}/download`
                }
                aria-label={`${doc.name} indir`}
              >
                <Download size={17} />
              </a>
              <button
                disabled={busy}
                type="button"
                aria-label={`${doc.name} sil`}
                onClick={() => void remove(doc)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!lead.documents?.length && (
            <p className="op-muted">Bu talep için henüz belge eklenmedi.</p>
          )}
        </div>
      </section>
      <section className="op-detail-block">
        <h3>
          <MessageSquare size={18} />
          Müşteri ile yazışma
        </h3>
        <div className="op-message-list">
          {(lead.messages || []).map((m) => (
            <article
              className={
                m.authorRole === "customer" ||
                m.sender === "customer" ||
                m.author === "customer"
                  ? "customer"
                  : ""
              }
              key={m.id}
            >
              <small>
                {m.authorRole === "customer" ||
                m.sender === "customer" ||
                m.author === "customer"
                  ? "Müşteri"
                  : "Ekip"}{" "}
                · {date(m.createdAt)}
              </small>
              <p>{m.message}</p>
            </article>
          ))}
          {!lead.messages?.length && (
            <p className="op-muted">Henüz mesaj yok.</p>
          )}
        </div>
        <form onSubmit={send} className="op-form">
          <label className="ka-field">
            Mesaj konusu
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="support">Bilgilendirme / destek</option>
              <option value="revision">Teklif revizyonu</option>
              <option value="appointment">Randevu planlaması</option>
            </select>
          </label>
          <label className="ka-field">
            Müşteriye mesajınız
            <textarea
              required
              minLength={2}
              maxLength={5000}
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Müşteriye iletmek istediğiniz açıklamayı yazın…"
            />
          </label>
          <button
            className="ka-button primary"
            disabled={busy || !message.trim()}
            type="submit"
          >
            <MessageSquare size={16} />
            Mesajı gönder
          </button>
        </form>
      </section>
      {!!lead.timeline?.length && (
        <section className="op-detail-block">
          <h3>Süreç geçmişi</h3>
          <ol className="op-events">
            {lead.timeline.map((event, i) => (
              <li key={i}>
                <span>
                  {stages.find((s) => s.id === event.stage)?.label ||
                    event.stage}
                </span>
                {event.message && <p>{event.message}</p>}
                <small>{date(event.createdAt || event.at)}</small>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function Teams({ canManage }: { canManage: boolean }) {
  const [teams, setTeams] = useState<Team[]>([]),
    [draft, setDraft] = useState<Team | null>(null),
    [query, setQuery] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setTeams((await api<{ teams: Team[] }>("/api/admin/teams")).teams);
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const empty: Team = {
    id: "",
    name: "",
    contactName: "",
    phone: "",
    email: "",
    active: true,
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const body = {
        name: draft.name,
        contactName: draft.contactName,
        phone: draft.phone,
        email: draft.email,
        active: draft.active,
      };
      await api(
        draft.id ? `/api/admin/teams/${draft.id}` : "/api/admin/teams",
        json(draft.id ? "PATCH" : "POST", body),
      );
      await load();
      setDraft(null);
      setNotice(
        "Teknik ekip kaydedildi. Taleplerde sorumlu ekibi siz seçebilirsiniz.",
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(team: Team) {
    if (
      !window.confirm(
        `“${team.name}” kaydı silinsin mi? Atanmış talepler varsa önce sorumlu ekibi değiştirin.`,
      )
    )
      return;
    try {
      await api(`/api/admin/teams/${team.id}`, { method: "DELETE" });
      await load();
      setNotice("Teknik ekip kaydı silindi.");
    } catch (e) {
      setError(errorText(e));
    }
  }
  const visible = teams.filter((team) =>
    [team.name, team.contactName, team.phone, team.email]
      .join(" ")
      .toLocaleLowerCase("tr-TR")
      .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <div className="op-section-intro">
        <div>
          <h2>Dükkânın teknik ekibi</h2>
          <p>
            Keşif, üretim veya montaj işlerini birlikte yaptığınız kendi
            çalışanlarınızın iletişim kayıtları. Tek başınıza çalışıyorsanız bu
            alanı boş bırakabilirsiniz.
          </p>
        </div>
        <button
          className="ka-button primary"
          disabled={!canManage}
          onClick={() => setDraft(empty)}
        >
          <Plus size={16} />
          Teknik ekip ekle
        </button>
      </div>
      {draft && (
        <section className="ka-panel op-team-editor">
          <div className="ka-panel-title">
            <h2>{draft.id ? "Teknik ekip düzenle" : "Yeni teknik ekip"}</h2>
            <button
              type="button"
              onClick={() => setDraft(null)}
              aria-label="Ekip editörünü kapat"
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={save} className="op-form">
            <div className="ka-field-grid">
              {[
                { key: "name", label: "Ekip adı", required: true },
                { key: "contactName", label: "Sorumlu çalışan" },
                { key: "phone", label: "Telefon", type: "tel" },
                { key: "email", label: "E-posta", type: "email" },
              ].map((field) => (
                <label key={field.key} className="ka-field">
                  {field.label}
                  {field.required ? " *" : ""}
                  <input
                    required={field.required}
                    type={field.type || "text"}
                    maxLength={200}
                    value={String(draft[field.key as keyof Team] || "")}
                    onChange={(e) =>
                      setDraft({ ...draft, [field.key]: e.target.value })
                    }
                  />
                </label>
              ))}
            </div>
            <label className="ka-checkbox">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.checked })
                }
              />
              <span>Aktif — taleplerde sorumlu ekip olarak seçilebilir</span>
            </label>
            <button className="ka-button primary" disabled={busy} type="submit">
              <Save size={16} />
              Teknik ekibi kaydet
            </button>
          </form>
        </section>
      )}
      <section className="ka-panel">
        <div className="ka-list-toolbar">
          <label className="ka-search">
            <Search size={17} />
            <input
              aria-label="Teknik ekip ara"
              placeholder="Ekip veya çalışan ara…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <span>{teams.length} kayıt</span>
        </div>
        <div className="op-team-grid">
          {visible.map((team) => (
            <article key={team.id}>
              <div>
                <Users size={22} />
                <span
                  className={`ka-badge ${team.active ? "published" : "draft"}`}
                >
                  {team.active ? "Aktif" : "Pasif"}
                </span>
              </div>
              <h3>{team.name}</h3>
              <p>{team.contactName || "Sorumlu çalışan belirtilmedi"}</p>
              {team.phone && (
                <a href={`tel:${team.phone.replace(/[^+\d]/g, "")}`}>
                  {team.phone}
                </a>
              )}
              {team.email && <a href={`mailto:${team.email}`}>{team.email}</a>}
              {typeof team.inquiryCount === "number" && (
                <small>
                  {team.inquiryCount} atanan · {team.completedCount || 0}{" "}
                  tamamlanan
                </small>
              )}
              <div className="op-button-row">
                <button
                  className="ka-button secondary"
                  disabled={!canManage}
                  onClick={() => setDraft(team)}
                >
                  Düzenle
                </button>
                <button
                  className="ka-icon-button danger"
                  disabled={!canManage}
                  aria-label={`${team.name} kaydını sil`}
                  onClick={() => void remove(team)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <Empty
            title={
              query ? "Eşleşen teknik ekip yok" : "Henüz teknik ekip eklenmedi"
            }
            text={
              query
                ? "Başka bir ekip veya çalışan adıyla arayın."
                : "Ekibiniz varsa iletişim kaydı ekleyin. Talepleri ekip eklemeden de kendiniz takip edebilirsiniz."
            }
          />
        )}
      </section>
    </>
  );
}

function StaffManager() {
  const [staff, setStaff] = useState<Staff[]>([]),
    [teams, setTeams] = useState<Team[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [editing, setEditing] = useState<Staff | null>(null);
  const load = useCallback(async () => {
    try {
      const [s, d] = await Promise.all([
        api<{ staff: Staff[] }>("/api/admin/staff"),
        api<{ teams: Team[] }>("/api/admin/teams"),
      ]);
      setStaff(s.staff);
      setTeams(d.teams);
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    if (editing?.id && values.newPassword === "") delete values.newPassword;
    try {
      await api(
        editing?.id ? `/api/admin/staff/${editing.id}` : "/api/admin/staff",
        json(editing?.id ? "PATCH" : "POST", values),
      );
      setEditing(null);
      await load();
      setNotice("Personel hesabı kaydedildi.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function revoke(item: Staff) {
    try {
      await api(`/api/admin/staff/${item.id}/revoke`, json("POST", {}));
      setNotice("Personelin açık oturumları kapatıldı.");
    } catch (e) {
      setError(errorText(e));
    }
  }
  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <div className="op-section-intro">
        <div>
          <h2>Personel ve erişim rolleri</h2>
          <p>
            Dükkânınızdaki çalışanlara ayrı hesap verin. Teknik personel
            atandığı taleplere, editörler içerik yönetimine erişir.
          </p>
        </div>
        <button
          type="button"
          className="ka-button primary"
          onClick={() =>
            setEditing({
              id: "",
              username: "",
              role: "technician",
              status: "active",
            })
          }
        >
          <Plus size={16} />
          Personel ekle
        </button>
      </div>
      {editing && (
        <section className="ka-panel op-team-editor">
          <div className="ka-panel-title">
            <h2>{editing.id ? "Yetkileri düzenle" : "Yeni personel hesabı"}</h2>
            <button
              aria-label="Personel editörünü kapat"
              onClick={() => setEditing(null)}
            >
              <X size={18} />
            </button>
          </div>
          <form className="op-form" onSubmit={save}>
            <div className="ka-field-grid">
              <label className="ka-field">
                Kullanıcı adı
                <input
                  name="username"
                  required
                  readOnly={!!editing.id}
                  maxLength={100}
                  defaultValue={editing.username}
                />
              </label>
              {!editing.id && (
                <label className="ka-field">
                  İlk parola
                  <input
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={12}
                    maxLength={256}
                  />
                  <small>En az 12 karakter; güvenli bir kanaldan iletin.</small>
                </label>
              )}
              {editing.id && (
                <label className="ka-field">
                  Yeni parola (isteğe bağlı)
                  <input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    maxLength={256}
                  />
                  <small>
                    Boş bırakılırsa mevcut parola korunur. Değişiklik personelin
                    açık oturumlarını kapatır.
                  </small>
                </label>
              )}
              <label className="ka-field">
                Rol
                <select
                  name="role"
                  defaultValue={editing.role}
                  onChange={(event) =>
                    setEditing({
                      ...editing,
                      role: event.target.value as Staff["role"],
                    })
                  }
                >
                  {Object.entries(roles).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="ka-field">
                Hesap durumu
                <select name="status" defaultValue={editing.status}>
                  <option value="active">Aktif</option>
                  <option value="suspended">Dondurulmuş</option>
                </select>
              </label>
              {editing.role === "technician" && (
                <label className="ka-field">
                  Teknik ekip
                  <select
                    name="teamId"
                    required
                    defaultValue={editing.teamId || ""}
                  >
                    <option value="">Teknik ekip seçin</option>
                    {teams.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  <small>
                    Bu personel yalnızca seçtiğiniz ekibin taleplerine erişir.
                  </small>
                </label>
              )}
              {editing.role === "manager" && (
                <label className="ka-field">
                  Müşteri ilçesi filtresi
                  <input
                    name="region"
                    required
                    maxLength={100}
                    defaultValue={editing.region || ""}
                    placeholder="Örn. Etimesgut"
                  />
                  <small>
                    Operasyon sorumlusu yalnızca bu ilçedeki müşteri taleplerini
                    görür.
                  </small>
                </label>
              )}
            </div>
            <button className="ka-button primary" type="submit" disabled={busy}>
              <Save size={16} />
              Personel hesabını kaydet
            </button>
          </form>
        </section>
      )}
      <section className="ka-panel">
        <div className="ka-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>Rol</th>
                <th>Durum</th>
                <th>Son giriş</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={s.id}>
                  <td>
                    <strong>{s.username}</strong>
                    <small className="op-table-sub">
                      {teams.find((d) => d.id === s.teamId)?.name ||
                        s.region ||
                        "—"}
                    </small>
                  </td>
                  <td>{roles[s.role] || s.role}</td>
                  <td>{s.status === "active" ? "Aktif" : "Dondurulmuş"}</td>
                  <td>{date(s.lastLoginAt)}</td>
                  <td>
                    <div className="op-button-row">
                      <button
                        className="ka-button secondary"
                        onClick={() => setEditing(s)}
                      >
                        Düzenle
                      </button>
                      <button
                        className="ka-icon-button"
                        aria-label={`${s.username} oturumlarını kapat`}
                        onClick={() => void revoke(s)}
                      >
                        <LockKeyhole size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!staff.length && (
          <Empty
            title="Ek personel hesabı yok"
            text="Yönetici hesabınıza ek olarak ihtiyaç duyduğunuz rolleri oluşturun."
          />
        )}
      </section>
    </>
  );
}

function Notifications() {
  const [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      setData(await api("/api/admin/notifications"));
      setError("");
    } catch (e) {
      setError(errorText(e));
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, [load]);
  const notifications = (data?.notifications || []) as {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    readAt?: string;
    read?: boolean;
  }[];
  const outbox = (data?.outbox || []) as {
    id: string;
    channel: string;
    status: string;
    recipient?: string;
    message?: string;
    createdAt: string;
    error?: string;
    lastError?: string;
    attempts?: number;
  }[];
  async function mark(id: string) {
    try {
      await api(`/api/admin/notifications/${id}/read`, json("POST", {}));
      await load();
    } catch (e) {
      setError(errorText(e));
    }
  }
  async function retry(id: string) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/admin/outbox/${id}/retry`, json("POST", {}));
      await load();
      setNotice(
        "Bildirim yeniden gönderim için işlendi. Güncel sonucu kuyruk durumundan kontrol edin.",
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {error && <Alert>{error}</Alert>}
      {notice && <Notice text={notice} onClose={() => setNotice("")} />}
      <div className="op-section-intro">
        <div>
          <h2>Bildirim merkezi</h2>
          <p>
            Müşteri mesajları ve süreç değişiklikleri burada görünür. Dış
            gönderimler sağlayıcı bağlantısının gerçek durumuyla gösterilir.
          </p>
        </div>
        <button className="ka-button secondary" onClick={() => void load()}>
          <RefreshCw size={16} />
          Yenile
        </button>
      </div>
      {data?.delivery && (
        <section className="ka-panel op-provider-panel">
          <ShieldCheck size={20} />
          <div>
            <h3>Gönderim bağlantıları</h3>
            <p>
              <strong>Bildirim sağlayıcısı</strong>:{" "}
              {data.delivery.configured
                ? "Bağlantı yapılandırılmış"
                : "Henüz yapılandırılmamış"}
            </p>
            <p>
              Bağlantı kurulmadan SMS / e-posta / WhatsApp gönderilmiş sayılmaz.
              Site içi bildirimler sağlayıcı olmadan çalışır. Sağlayıcıya
              iletildi durumu, müşteriye teslim edildiği anlamına gelmez.
            </p>
          </div>
        </section>
      )}
      <div className="op-master-detail">
        <section className="ka-panel">
          <div className="ka-panel-title">
            <h2>Site içi bildirimler</h2>
            <span>
              {notifications.filter((n) => !n.readAt && !n.read).length}{" "}
              okunmamış
            </span>
          </div>
          {notifications.map((n) => (
            <article
              className={`op-notification ${!n.readAt && !n.read ? "unread" : ""}`}
              key={n.id}
            >
              <Bell size={18} />
              <div>
                <strong>{n.title || "Yeni bildirim"}</strong>
                <p>{n.message}</p>
                <small>{date(n.createdAt)}</small>
              </div>
              {!n.readAt && !n.read && (
                <button
                  aria-label={`${n.title || "Bildirim"} okundu işaretle`}
                  className="ka-icon-button"
                  onClick={() => void mark(n.id)}
                >
                  <Check size={16} />
                </button>
              )}
            </article>
          ))}
          {!notifications.length && (
            <Empty
              title="Yeni bildirim yok"
              text="Müşteri etkileşimleri ve süreç bildirimleri burada listelenir."
            />
          )}
        </section>
        <section className="ka-panel">
          <div className="ka-panel-title">
            <h2>Dış gönderim kuyruğu</h2>
            <span>{outbox.length} kayıt</span>
          </div>
          {outbox.map((item) => (
            <article className="op-outbox" key={item.id}>
              <div>
                <span
                  className={`op-state ${item.status === "sent" ? "online" : item.status === "failed" ? "suspended" : ""}`}
                >
                  {(
                    {
                      sent: "Sağlayıcıya iletildi",
                      queued: "Kuyrukta",
                      pending: "Bekliyor",
                      failed: "Hata",
                      unconfigured: "Bağlantı bekliyor",
                      waiting_configuration: "Bağlantı bekliyor",
                    } as Record<string, string>
                  )[item.status] || item.status}
                </span>
                <small>
                  {item.channel} · {date(item.createdAt)}
                </small>
              </div>
              {item.recipient && <strong>{item.recipient}</strong>}
              {item.message && <p>{item.message}</p>}
              {(item.error || item.lastError) && (
                <p className="op-error-text">{item.error || item.lastError}</p>
              )}
              <small>{item.attempts || 0} gönderim denemesi</small>
              {item.status !== "sent" && (
                <button
                  className="ka-button secondary"
                  disabled={busy}
                  onClick={() => void retry(item.id)}
                >
                  <RefreshCw size={14} />
                  Yeniden dene
                </button>
              )}
            </article>
          ))}
          {!outbox.length && (
            <Empty
              title="Gönderim kaydı yok"
              text="Süreç güncellemelerinde oluşan SMS / e-posta / WhatsApp işleri burada takip edilir."
            />
          )}
        </section>
      </div>
    </>
  );
}
