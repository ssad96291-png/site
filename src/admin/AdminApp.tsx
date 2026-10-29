import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Download,
  Eye,
  History,
  MapPin,
  FileText,
  ImagePlus,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Pencil,
  Plus,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  X,
  Users,
  Bell,
  Activity,
  Columns3,
  Network,
  UserCog,
} from "lucide-react";
import "./admin.css";
import {
  OperationsPanel,
  OperationsSummary,
  type OperationsSection,
} from "./OperationsPanel";
import LiveAnalytics from "./LiveAnalytics";
import ProjectOffers from "./ProjectOffers";
import { SupportDesk } from "./CustomerWorkspace";
import SystemCenter from "./SystemCenter";
import AdminHelp from "./AdminHelp";
import {
  UploadRights,
  MediaRightsEditor,
  appendMediaRights,
  emptyMediaRights,
  type MediaRightsDraft,
  type MediaRightsRecord,
} from "./MediaRights";
import "./admin-integration.css";

type ContentType =
  "product" | "project" | "article" | "page" | "faq" | "region";
type Section =
  | "dashboard"
  | ContentType
  | "inquiries"
  | "settings"
  | "security"
  | "activity"
  | "media"
  | "live"
  | "customers"
  | "pipeline"
  | "teams"
  | "notifications"
  | "staff"
  | "projectRequests"
  | "support"
  | "system";
type OperatorRole = "admin" | "manager" | "editor" | "technician";
type Operator = {
  username: string;
  role?: OperatorRole;
  authKind?: "admin" | "staff";
};
type Content = {
  id: string;
  type: ContentType;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  body: string;
  image: string;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  specs: { label: string; value: string }[];
  gallery: string[];
  titleEn?: string;
  subtitleEn?: string;
  summaryEn?: string;
  bodyEn?: string;
  createdAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAlt?: string;
};
type Inquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  product?: string;
  status: "new" | "contacted" | "closed";
  createdAt: string;
  district?: string;
  service?: string;
  dimensions?: string;
  budget?: string;
  preferredContact?: string;
  notes?: string;
  priority?: "normal" | "high";
  followUpDate?: string;
};
type Settings = Record<string, string | string[] | boolean>;
const groups: {
  id: Section;
  label: string;
  singular?: string;
  icon: typeof Package;
}[] = [
  { id: "live", label: "Canlı izleme & analiz", icon: Activity },
  { id: "customers", label: "Müşteriler", icon: Users },
  { id: "support", label: "Destek & hesap sorunları", icon: MessageSquare },
  { id: "pipeline", label: "Talep süreçleri", icon: Columns3 },
  { id: "projectRequests", label: "Proje & fiyat talepleri", icon: FileText },
  { id: "teams", label: "Teknik ekip", icon: Network },
  { id: "notifications", label: "Bildirim merkezi", icon: Bell },
  { id: "staff", label: "Personel ve roller", icon: UserCog },
  { id: "system", label: "Veri, yedek & güvenlik", icon: ShieldCheck },

  { id: "dashboard", label: "Genel bakış", icon: LayoutDashboard },
  { id: "product", label: "Ürünler", singular: "ürün", icon: Package },
  { id: "project", label: "Projeler", singular: "proje", icon: Building2 },
  { id: "article", label: "Yazılar", singular: "yazı", icon: FileText },
  { id: "page", label: "Sayfalar", singular: "sayfa", icon: FileText },
  { id: "faq", label: "Sıkça sorulanlar", singular: "soru", icon: CircleHelp },
  { id: "region", label: "Hizmet bölgeleri", singular: "bölge", icon: MapPin },
  { id: "inquiries", label: "Teklif talepleri", icon: MessageSquare },
  { id: "media", label: "Görsel kütüphanesi", icon: ImagePlus },
  { id: "settings", label: "Site ayarları", icon: Settings2 },
  { id: "security", label: "Güvenlik", icon: ShieldCheck },
  { id: "activity", label: "İşlem geçmişi & yedek", icon: History },
];
const emptyContent = (type: ContentType): Content => ({
  id: "",
  type,
  slug: "",
  title: "",
  subtitle: "",
  summary: "",
  body: "",
  image: "",
  category: "",
  featured: false,
  published: false,
  sortOrder: 0,
  specs: [],
  gallery: [],
});
const statusLabels = {
  new: "Yeni talep",
  contacted: "Görüşüldü",
  closed: "Tamamlandı",
};
const formatDate = (value: string) =>
  value
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const res = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const data = await res
    .json()
    .catch(() => ({ error: "Sunucudan beklenen yanıt alınamadı." }));
  if (!res.ok) {
    if (res.status === 401 && !url.endsWith("/login") && !url.endsWith("/me"))
      window.dispatchEvent(new Event("admin-session-expired"));
    throw new Error(
      data.error || "İşlem tamamlanamadı. Lütfen tekrar deneyin.",
    );
  }
  return data as T;
}

export default function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<string | null>(null);
  const [role, setRole] = useState<OperatorRole>("admin");
  const [authKind, setAuthKind] = useState<"admin" | "staff">("admin");
  function signedIn(account: Operator) {
    setUser(account.username);
    setRole(account.role || "admin");
    setAuthKind(account.authKind || "admin");
    setSection(
      account.role === "editor"
        ? "product"
        : account.role === "technician"
          ? "pipeline"
          : account.role === "manager"
            ? "live"
            : "dashboard",
    );
  }
  const [section, setSection] = useState<Section>("dashboard");
  const [content, setContent] = useState<Content[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Content | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  function notify(message: string) {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(""), 5000);
  }
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (role === "manager" || role === "technician") return;
      const [c, i, s] = await Promise.all([
        api<{ content: Content[] }>("/api/admin/content"),
        role === "admin"
          ? api<{ inquiries: Inquiry[] }>("/api/admin/inquiries")
          : Promise.resolve({ inquiries: [] as Inquiry[] }),
        api<{ settings: Settings }>("/api/admin/settings"),
      ]);
      setContent(c.content);
      setInquiries(i.inquiries);
      setSettings(s.settings);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [role]);
  useEffect(() => {
    document.title = "Yönetim | Kılınç Dekorasyon";
    api<{ user: Operator }>("/api/admin/me")
      .then((r) => signedIn(r.user))
      .catch(() => setUser(null))
      .finally(() => setChecking(false));
    const expire = () => {
      setUser(null);
      setError("Oturumunuz sona erdi. Tekrar giriş yapın.");
    };
    window.addEventListener("admin-session-expired", expire);
    return () => {
      window.removeEventListener("admin-session-expired", expire);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);
  useEffect(() => {
    if (user) void load();
  }, [user, load]);
  function navigate(next: Section) {
    setSection(next);
    setQuery("");
    setEditor(null);
    setSelectedInquiry(null);
    setMobileOpen(false);
    setError("");
  }
  async function logout() {
    try {
      await api(
        authKind === "staff" ? "/api/staff/logout" : "/api/admin/logout",
        { method: "POST", body: "{}" },
      );
      setUser(null);
      setContent([]);
      setInquiries([]);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function remove(item: Content) {
    if (!window.confirm(`“${item.title}” silinsin mi? Bu işlem geri alınamaz.`))
      return;
    try {
      await api(`/api/admin/content/${item.id}`, { method: "DELETE" });
      await load();
      notify("İçerik silindi.");
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function saveInquiry(item: Inquiry, changes: Partial<Inquiry>) {
    await api(`/api/admin/inquiries/${item.id}`, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
    setInquiries((all) =>
      all.map((i) => (i.id === item.id ? { ...i, ...changes } : i)),
    );
    setSelectedInquiry((i) => (i?.id === item.id ? { ...i, ...changes } : i));
    notify("Talep kaydedildi.");
  }
  async function deleteInquiry(item: Inquiry) {
    if (
      !window.confirm(
        `${item.name} kişisinin talebi ve iletişim bilgileri kalıcı olarak silinsin mi?`,
      )
    )
      return;
    await api(`/api/admin/inquiries/${item.id}`, { method: "DELETE" });
    setInquiries((all) => all.filter((i) => i.id !== item.id));
    setSelectedInquiry(null);
    notify("Talep silindi.");
  }
  const newInquiries = inquiries.filter((i) => i.status === "new").length;
  if (checking)
    return (
      <div className="kd-admin kd-admin-loading">
        <Loader2 className="spin" />
        <p>Yönetim paneli açılıyor…</p>
      </div>
    );
  if (!user)
    return (
      <Login
        onLogin={(account) => {
          signedIn(account);
          setError("");
        }}
        initialError={error}
        initialNotice={authNotice}
      />
    );
  const currentGroup = groups.find((g) => g.id === section)!;
  const filtered = content.filter(
    (c) =>
      c.type === section &&
      [c.title, c.category, c.slug]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  return (
    <div className="kd-admin">
      <button
        className={`ka-sidebar-backdrop ${mobileOpen ? "visible" : ""}`}
        aria-label="Menüyü kapat"
        onClick={() => setMobileOpen(false)}
      />
      <aside className={`ka-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <a className="ka-brand" href="/">
          <span className="ka-monogram">
            K<span>.</span>
          </span>
          <span>
            KILINÇ<small>DEKORASYON · YÖNETİM</small>
          </span>
        </a>
        <div className="ka-sidebar-label">ÇALIŞMA ALANINIZ</div>
        <nav aria-label="Yönetim menüsü">
          {groups
            .filter(
              (g) =>
                role === "admin" ||
                (role === "manager"
                  ? [
                      "live",
                      "customers",
                      "support",
                      "pipeline",
                      "projectRequests",
                      "teams",
                      "notifications",
                      "security",
                    ]
                  : role === "technician"
                    ? [
                        "pipeline",
                        "support",
                        "projectRequests",
                        "notifications",
                        "security",
                      ]
                    : [
                        "product",
                        "project",
                        "article",
                        "page",
                        "faq",
                        "region",
                        "media",
                        "security",
                      ]
                ).includes(g.id),
            )
            .map((g) => (
              <button
                key={g.id}
                className={section === g.id ? "active" : ""}
                onClick={() => navigate(g.id)}
              >
                <g.icon size={18} />
                {g.label}
                {g.id === "inquiries" && newInquiries > 0 && (
                  <span className="ka-count">{newInquiries}</span>
                )}
              </button>
            ))}
        </nav>
        <div className="ka-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <ArrowUpRight size={17} />
            Siteyi görüntüle
          </a>
          <button onClick={logout}>
            <LogOut size={17} />
            Güvenli çıkış
          </button>
          <p>
            Özgün tasarım.
            <br />
            Sizin kontrolünüzde.
          </p>
        </div>
      </aside>
      <main className="ka-main">
        <header className="ka-topbar">
          <div>
            <button
              className="ka-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Menüyü aç"
            >
              <Menu />
            </button>
            <span>Yönetim paneli</span>
            <ChevronRight size={14} />
            <strong>{currentGroup.label}</strong>
          </div>
          <OperatorHeaderTools role={role} onNavigate={navigate} />
          <span className="ka-user">
            <span>{user.charAt(0).toUpperCase()}</span>
            {user}
          </span>
        </header>
        <div className="ka-workspace">
          <div className="ka-page-heading">
            <div>
              <p className="ka-eyebrow">KILINÇ DEKORASYON</p>
              <h1>
                {editor
                  ? editor.id
                    ? "İçeriği düzenle"
                    : "Yeni içerik"
                  : currentGroup.label}
              </h1>
              <p>
                {section === "dashboard"
                  ? "Sitenizin içeriği ve müşteri talepleri tek bir yerde."
                  : section === "settings"
                    ? "Marka bilgilerinizi ve iletişim kanallarınızı yönetin."
                    : section === "customers"
                      ? "Üye ve misafir hesaplarını, görüşmeleri, dosyaları ve hesap erişimini yönetin."
                      : section === "inquiries"
                        ? "Sitenizden gelen gerçek müşteri taleplerini takip edin."
                        : section === "projectRequests"
                          ? "Müşteri dosyalarını inceleyin; fiyat teklifini hazırlayıp paylaşın."
                          : section === "support"
                            ? "Müşteri ve hesap sorunlarını, yanıtları ve ekip içi notları yönetin."
                            : section === "system"
                              ? "Şifreleme durumunu, güvenlik kayıtlarını ve taşınabilir yedekleri yönetin."
                              : section === "security"
                                ? "Yönetici hesabınızın güvenliğini koruyun."
                                : "İçeriklerinizi oluşturun, düzenleyin ve yayına alın."}
              </p>
            </div>
            {[
              "product",
              "project",
              "article",
              "page",
              "faq",
              "region",
            ].includes(section) &&
              !editor && (
                <button
                  className="ka-button primary"
                  onClick={() =>
                    setEditor(emptyContent(section as ContentType))
                  }
                >
                  <Plus size={18} />
                  Yeni {currentGroup.singular} ekle
                </button>
              )}
          </div>
          {error && (
            <div className="ka-alert error" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Bildirimi kapat">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="ka-toast" role="status">
              <Check size={18} />
              {notice}
              <button
                onClick={() => setNotice("")}
                aria-label="Bildirimi kapat"
              >
                <X size={16} />
              </button>
            </div>
          )}
          {loading && (
            <div className="ka-progress" role="status">
              <Loader2 size={16} className="spin" />
              Veriler güncelleniyor…
            </div>
          )}
          {editor ? (
            <ContentEditor
              key={editor.id || "new"}
              value={editor}
              onCancel={() => setEditor(null)}
              onSave={async (item) => {
                await api(
                  editor.id
                    ? `/api/admin/content/${editor.id}`
                    : "/api/admin/content",
                  {
                    method: editor.id ? "PUT" : "POST",
                    body: JSON.stringify(item),
                  },
                );
                await load();
                setEditor(null);
                notify("İçerik kaydedildi.");
              }}
            />
          ) : (
            <>
              <AdminHelp section={section} />
              {section === "support" && <SupportDesk role={role} />}
              {section === "system" && role === "admin" && <SystemCenter />}
              {section === "live" && <LiveAnalytics />}
              {section === "projectRequests" && <ProjectOffers role={role} />}
              {[
                "customers",
                "pipeline",
                "teams",
                "notifications",
                "staff",
              ].includes(section) && (
                <OperationsPanel
                  section={section as OperationsSection}
                  role={role}
                />
              )}
              {section === "dashboard" && (
                <>
                  <OperationsSummary role={role} />

                  <ReadinessChecklist
                    settings={settings}
                    content={content}
                    onSettings={() => navigate("settings")}
                  />
                  {(!settings.phone ||
                    !settings.email ||
                    !settings.address) && (
                    <div className="ka-setup-banner">
                      <span>
                        <CircleHelp size={22} />
                      </span>
                      <div>
                        <strong>Sitenizi size ait bilgilerle tamamlayın</strong>
                        <p>
                          Telefon, e-posta ve adresinizi ekleyin. Örnek
                          içerikleri ve görselleri yayın öncesinde gözden
                          geçirin.
                        </p>
                      </div>
                      <button onClick={() => navigate("settings")}>
                        Ayarları aç <ArrowUpRight size={16} />
                      </button>
                    </div>
                  )}
                  <div className="ka-stats">
                    {[
                      {
                        label: "Yayındaki ürün",
                        value: content.filter(
                          (c) => c.type === "product" && c.published,
                        ).length,
                        icon: Package,
                        section: "product",
                      },
                      {
                        label: "Proje",
                        value: content.filter((c) => c.type === "project")
                          .length,
                        icon: Building2,
                        section: "project",
                      },
                      {
                        label: "Yeni teklif talebi",
                        value: newInquiries,
                        icon: MessageSquare,
                        section: "inquiries",
                      },
                      {
                        label: "Toplam içerik",
                        value: content.length,
                        icon: FileText,
                        section: "page",
                      },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => navigate(s.section as Section)}
                        className="ka-stat"
                      >
                        <span className="ka-stat-icon">
                          <s.icon size={21} />
                        </span>
                        <ArrowUpRight className="ka-stat-arrow" size={17} />
                        <strong>{s.value}</strong>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="ka-dashboard-grid">
                    <section className="ka-panel">
                      <div className="ka-panel-title">
                        <h2>Son teklif talepleri</h2>
                        <button onClick={() => navigate("inquiries")}>
                          Tümünü gör <ArrowUpRight size={15} />
                        </button>
                      </div>
                      {inquiries.length ? (
                        inquiries.slice(0, 5).map((i) => (
                          <button
                            className="ka-inquiry-row"
                            key={i.id}
                            onClick={() => {
                              navigate("inquiries");
                              setSelectedInquiry(i);
                            }}
                          >
                            <span className="ka-avatar">
                              {i.name.charAt(0)}
                            </span>
                            <span>
                              <strong>{i.name}</strong>
                              <small>
                                {i.subject || i.product || "Teklif talebi"}
                              </small>
                            </span>
                            <span className={`ka-badge ${i.status}`}>
                              {statusLabels[i.status]}
                            </span>
                          </button>
                        ))
                      ) : (
                        <EmptyState
                          icon={MessageSquare}
                          title="Henüz talep yok"
                          text="İletişim ve teklif formlarından gelen talepler burada görünecek."
                        />
                      )}
                    </section>
                    <section className="ka-panel">
                      <div className="ka-panel-title">
                        <h2>Hızlı işlemler</h2>
                      </div>
                      {[
                        {
                          label: "Yeni ürün ekle",
                          text: "Ürün koleksiyonunuzu genişletin",
                          section: "product",
                          icon: Package,
                        },
                        {
                          label: "Proje paylaş",
                          text: "Çalışmalarınızı sergileyin",
                          section: "project",
                          icon: Building2,
                        },
                        {
                          label: "İletişim bilgilerini düzenle",
                          text: "Müşterileriniz size kolayca ulaşsın",
                          section: "settings",
                          icon: Settings2,
                        },
                      ].map((s) => (
                        <button
                          className="ka-quick-action"
                          key={s.label}
                          onClick={() => {
                            navigate(s.section as Section);
                            if (s.section !== "settings")
                              setEditor(emptyContent(s.section as ContentType));
                          }}
                        >
                          <s.icon size={22} />
                          <span>
                            <strong>{s.label}</strong>
                            <small>{s.text}</small>
                          </span>
                          <ChevronRight size={17} />
                        </button>
                      ))}
                    </section>
                  </div>
                  <div className="ka-panel ka-note">
                    <ShieldCheck size={20} />
                    <p>
                      Form talepleri bu sunucunun veritabanında saklanır.
                      Otomatik e-posta gönderimi yapılandırılmamıştır; talepleri
                      bu panelden takip edebilirsiniz.
                    </p>
                  </div>
                </>
              )}
              {[
                "product",
                "project",
                "article",
                "page",
                "faq",
                "region",
              ].includes(section) && (
                <section className="ka-panel">
                  <div className="ka-list-toolbar">
                    <label className="ka-search">
                      <Search size={18} />
                      <input
                        placeholder="Başlık veya kategori ara…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <span>{filtered.length} içerik</span>
                  </div>
                  {filtered.length ? (
                    <div className="ka-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>İçerik</th>
                            <th>Kategori</th>
                            <th>Durum</th>
                            <th>Sıra</th>
                            <th>
                              <span className="ka-sr-only">İşlemler</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((c) => (
                              <tr key={c.id}>
                                <td>
                                  <div className="ka-content-title">
                                    {c.image ? (
                                      <img src={c.image} alt="" />
                                    ) : (
                                      <span className="ka-placeholder-image">
                                        <FileText size={20} />
                                      </span>
                                    )}
                                    <span>
                                      <strong>{c.title}</strong>
                                      <small>
                                        /{c.slug}
                                        {c.featured ? " · Öne çıkan" : ""}
                                      </small>
                                    </span>
                                  </div>
                                </td>
                                <td>{c.category || "—"}</td>
                                <td>
                                  <span
                                    className={`ka-badge ${c.published ? "published" : "draft"}`}
                                  >
                                    {c.published ? "Yayında" : "Taslak"}
                                  </span>
                                </td>
                                <td>{c.sortOrder}</td>
                                <td>
                                  <div className="ka-actions">
                                    <button
                                      className="ka-icon-button"
                                      title="Düzenle"
                                      aria-label={`${c.title} içeriğini düzenle`}
                                      onClick={() => setEditor(c)}
                                    >
                                      <Pencil size={17} />
                                    </button>
                                    <button
                                      className="ka-icon-button danger"
                                      title="Sil"
                                      aria-label={`${c.title} içeriğini sil`}
                                      onClick={() => remove(c)}
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState
                      icon={FileText}
                      title={query ? "Sonuç bulunamadı" : "Henüz içerik yok"}
                      text={
                        query
                          ? "Farklı bir arama deneyin."
                          : "Yeni içerik ekleyerek başlayın."
                      }
                    />
                  )}
                </section>
              )}
              {section === "inquiries" && (
                <InquiryWorkspace
                  inquiries={inquiries}
                  selected={selectedInquiry}
                  onSelect={setSelectedInquiry}
                  onSave={saveInquiry}
                  onDelete={deleteInquiry}
                />
              )}
              {section === "activity" && <ActivityPanel />}
              {section === "media" && <MediaLibrary />}
              {section === "settings" && (
                <SettingsEditor
                  value={settings}
                  onSave={async (value) => {
                    const result = await api<{ settings: Settings }>(
                      "/api/admin/settings",
                      { method: "PUT", body: JSON.stringify(value) },
                    );
                    setSettings(result.settings);
                    notify("Site ayarları kaydedildi.");
                  }}
                />
              )}
              {section === "security" && authKind === "staff" && (
                <StaffPassword
                  onSaved={() => {
                    setUser(null);
                    setAuthNotice("Parolanız güncellendi. Tekrar giriş yapın.");
                  }}
                />
              )}
              {section === "security" && authKind !== "staff" && (
                <Security
                  onSaved={() => {
                    setUser(null);
                    setError("");
                    setAuthNotice(
                      "Parolanız güncellendi. Yeni parolanızla tekrar giriş yapın.",
                    );
                  }}
                />
              )}
            </>
          )}
          <footer className="ka-footer">
            Kılınç Dekorasyon <span>İçerik yönetim alanı</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ReadinessChecklist({
  settings,
  content,
  onSettings,
}: {
  settings: Settings;
  content: Content[];
  onSettings: () => void;
}) {
  const checks = [
    {
      label: "İletişim bilgileri",
      done: !!settings.phone && !!settings.email && !!settings.address,
    },
    {
      label: "Arama motoru başlığı",
      done: !!settings.seoTitle && !!settings.seoDescription,
    },
    {
      label: "Yayındaki ürünler",
      done: content.some((c) => c.type === "product" && c.published),
    },
    { label: "Alan adı", done: !!settings.websiteUrl },
  ];
  return (
    <section className="ka-panel ka-readiness">
      <div>
        <ClipboardCheck size={22} />
        <span>
          <strong>Yayın hazırlığı</strong>
          <small>
            {checks.filter((c) => c.done).length}/{checks.length} içerik adımı
            tamamlandı
          </small>
        </span>
        <button type="button" onClick={onSettings}>
          Ayarları düzenle <ArrowUpRight size={15} />
        </button>
      </div>
      <ul>
        {checks.map((c) => (
          <li key={c.label} className={c.done ? "done" : ""}>
            <span>{c.done ? <Check size={13} /> : <span />}</span>
            {c.label}
          </li>
        ))}
      </ul>
      <p>
        Gerçek fotoğraflarınızı ve yasal metinleri gözden geçirin. HTTPS, kalıcı
        disk ve güvenli yedekleme sunucu tarafında ayrıca yapılandırılır.
      </p>
    </section>
  );
}

function InquiryWorkspace({
  inquiries,
  selected,
  onSelect,
  onSave,
  onDelete,
}: {
  inquiries: Inquiry[];
  selected: Inquiry | null;
  onSelect: (item: Inquiry | null) => void;
  onSave: (item: Inquiry, changes: Partial<Inquiry>) => Promise<void>;
  onDelete: (item: Inquiry) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [priority, setPriority] = useState("all");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = inquiries.filter(
    (i) =>
      (filter === "all" || i.status === filter) &&
      (priority === "all" || (i.priority || "normal") === priority) &&
      [i.name, i.email, i.phone, i.subject, i.district, i.service]
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  async function remove(item: Inquiry) {
    setError("");
    setBusy(true);
    try {
      await onDelete(item);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="ka-pipeline">
        {[
          { value: "all", label: "Tüm talepler" },
          { value: "new", label: "Yeni" },
          { value: "contacted", label: "Görüşülüyor" },
          { value: "closed", label: "Tamamlandı" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={filter === s.value ? "active" : ""}
          >
            <span>{s.label}</span>
            <strong>
              {
                inquiries.filter(
                  (i) => s.value === "all" || i.status === s.value,
                ).length
              }
            </strong>
          </button>
        ))}
      </div>
      <div className="ka-inquiry-actions">
        <p>
          Talepleriniz ve özel görüşme notlarınız yalnızca yönetim panelinde
          görünür.
        </p>
        <button
          type="button"
          className="ka-button secondary"
          onClick={() =>
            downloadAdmin(
              "/api/admin/inquiries.csv",
              "kilinc-talepler.csv",
            ).catch((e) => setError(e.message))
          }
        >
          <Download size={16} />
          CSV indir
        </button>
      </div>
      {error && (
        <div role="alert" className="ka-alert error">
          {error}
        </div>
      )}
      <div className="ka-inquiries-layout">
        <section className="ka-panel">
          <div className="ka-list-toolbar">
            <label className="ka-search">
              <Search size={18} />
              <input
                aria-label="Talep ara"
                placeholder="Ad, ilçe, telefon veya hizmet ara…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <select
              className="ka-filter"
              aria-label="Öncelik filtresi"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">Her öncelik</option>
              <option value="high">Yüksek öncelik</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          {filtered.map((i) => (
            <button
              key={i.id}
              className={`ka-lead-item ${selected?.id === i.id ? "selected" : ""}`}
              onClick={() => onSelect(i)}
            >
              <div>
                <strong>{i.name}</strong>
                <span className={`ka-badge ${i.status}`}>
                  {statusLabels[i.status]}
                </span>
              </div>
              <p>{i.subject || i.service || i.product || "Teklif talebi"}</p>
              <small>
                {i.district && `${i.district} · `}
                {formatDate(i.createdAt)}
                {i.priority === "high" && (
                  <span className="ka-priority">Yüksek öncelik</span>
                )}
                {i.followUpDate && (
                  <span className="ka-followup">Takip: {i.followUpDate}</span>
                )}
              </small>
            </button>
          ))}
          {!filtered.length && (
            <EmptyState
              icon={MessageSquare}
              title="Talep bulunamadı"
              text="Filtreleri değiştirin. Yeni form talepleri burada listelenecek."
            />
          )}
        </section>
        {selected ? (
          <section className="ka-panel ka-lead-detail">
            <div className="ka-panel-title">
              <h2>Talep detayları</h2>
              <button onClick={() => onSelect(null)} aria-label="Detayı kapat">
                <X size={18} />
              </button>
            </div>
            <h3>{selected.name}</h3>
            <p className="ka-muted">{formatDate(selected.createdAt)}</p>
            <dl>
              {[
                {
                  label: "Telefon",
                  value: selected.phone ? (
                    <a href={`tel:${selected.phone.replace(/[^+\d]/g, "")}`}>
                      {selected.phone}
                    </a>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "E-posta",
                  value: selected.email ? (
                    <a href={`mailto:${selected.email}`}>{selected.email}</a>
                  ) : (
                    "—"
                  ),
                },
                {
                  label: "Hizmet / Ürün",
                  value:
                    selected.service ||
                    selected.product ||
                    selected.subject ||
                    "—",
                },
                { label: "İlçe / Bölge", value: selected.district || "—" },
                {
                  label: "Yaklaşık ölçüler",
                  value: selected.dimensions || "—",
                },
                { label: "Bütçe aralığı", value: selected.budget || "—" },
                {
                  label: "Tercih edilen iletişim",
                  value: selected.preferredContact || "—",
                },
                { label: "Mesaj", value: selected.message },
              ].map((d) => (
                <div key={d.label}>
                  <dt>{d.label}</dt>
                  <dd className="ka-message">{d.value}</dd>
                </div>
              ))}
            </dl>
            <InquiryEditor
              key={selected.id}
              inquiry={selected}
              onSave={onSave}
            />
            <button
              disabled={busy}
              type="button"
              className="ka-delete-lead"
              onClick={() => remove(selected)}
            >
              <Trash2 size={14} />
              Talebi ve kişisel verilerini sil
            </button>
          </section>
        ) : (
          <section className="ka-panel">
            <EmptyState
              icon={MessageSquare}
              title="Bir talep seçin"
              text="Ölçü, iletişim ve proje detaylarını inceleyin; görüşme notunuzu ve takip tarihinizi kaydedin."
            />
          </section>
        )}
      </div>
    </>
  );
}

function InquiryEditor({
  inquiry,
  onSave,
}: {
  inquiry: Inquiry;
  onSave: (item: Inquiry, changes: Partial<Inquiry>) => Promise<void>;
}) {
  const [status, setStatus] = useState(inquiry.status);
  const [priority, setPriority] = useState(inquiry.priority || "normal");
  const [notes, setNotes] = useState(inquiry.notes || "");
  const [followUpDate, setFollowUpDate] = useState(inquiry.followUpDate || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSave(inquiry, { status, priority, notes, followUpDate });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="ka-crm-editor">
      <h4>Görüşme takibi</h4>
      {error && (
        <div role="alert" className="ka-alert error">
          {error}
        </div>
      )}
      <div className="ka-field-grid">
        <label className="ka-field">
          Talep durumu
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Inquiry["status"])}
          >
            {Object.entries(statusLabels).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="ka-field">
          Öncelik
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "normal" | "high")}
          >
            <option value="normal">Normal</option>
            <option value="high">Yüksek</option>
          </select>
        </label>
      </div>
      <label className="ka-field">
        Takip tarihi
        <input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
        />
        <small>
          Bu tarih panelde takip içindir; otomatik bildirim gönderilmez.
        </small>
      </label>
      <label className="ka-field">
        Özel görüşme notları
        <textarea
          rows={5}
          maxLength={10000}
          placeholder="Görüşme sonucu, keşif planı, teklif bilgileri…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button type="submit" disabled={busy} className="ka-button primary">
        {busy ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
        Takibi kaydet
      </button>
    </form>
  );
}

async function downloadAdmin(url: string, filename: string) {
  const r = await fetch(url, { credentials: "same-origin" });
  if (!r.ok) {
    const data = await r.json().catch(() => ({}));
    throw new Error(data.error || "Dosya indirilemedi.");
  }
  const objectUrl = URL.createObjectURL(await r.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function ActivityPanel() {
  const [events, setEvents] = useState<
    {
      id: string;
      actor: string;
      action: string;
      target: string;
      createdAt: string;
    }[]
  >([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<{ events: typeof events }>("/api/admin/audit")
      .then((r) => setEvents(r.events))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  async function backup() {
    setBusy(true);
    setError("");
    try {
      await downloadAdmin(
        "/api/admin/export",
        `kilinc-icerik-yedegi-${new Date().toISOString().slice(0, 10)}.json`,
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const actions: Record<string, string> = {
    login: "Oturum açıldı",
    logout: "Oturum kapatıldı",
    "content.create": "İçerik eklendi",
    "content.update": "İçerik güncellendi",
    "content.delete": "İçerik silindi",
    "settings.update": "Site ayarları güncellendi",
    "inquiry.update": "Talep güncellendi",
    "inquiry.delete": "Talep silindi",
    "password.change": "Parola değiştirildi",
    "backup.export": "İçerik dışa aktarıldı",
    "upload.create": "Görsel yüklendi",
    "sessions.revoke": "Diğer oturumlar kapatıldı",
    POST: "Kayıt / işlem oluşturuldu",
    PUT: "Kayıt güncellendi",
    PATCH: "Talep güncellendi",
    DELETE: "Kayıt silindi",
    EXPORT: "Dosya dışa aktarıldı",
    LOGIN: "Oturum açıldı",
  };
  return (
    <>
      {error && (
        <div className="ka-alert error" role="alert">
          {error}
        </div>
      )}
      <section className="ka-panel ka-export-panel">
        <div>
          <span className="ka-stat-icon">
            <Download size={24} />
          </span>
          <h2>İçeriğinizin bir kopyasını alın</h2>
          <p>
            Site ayarları, içerikler ve müşteri talepleri JSON dosyasına
            aktarılır. Parolalar ve oturum anahtarları dışa aktarılmaz. Dosya
            kişisel veriler içerir; güvenli bir yerde saklayın.
          </p>
          <small>
            Görsel dosyaları ve SQLite veritabanı için ayrıca sunucu yedeği
            alınmalıdır. Bu dosya otomatik geri yükleme özelliği sunmaz.
          </small>
        </div>
        <button
          type="button"
          disabled={busy}
          className="ka-button primary"
          onClick={backup}
        >
          {busy ? (
            <Loader2 className="spin" size={17} />
          ) : (
            <Download size={17} />
          )}
          JSON yedeği indir
        </button>
      </section>
      <section className="ka-panel">
        <div className="ka-panel-title">
          <h2>Son yönetim işlemleri</h2>
          <span className="ka-muted">{events.length} kayıt</span>
        </div>
        {loading ? (
          <div className="ka-empty">
            <Loader2 className="spin" />
          </div>
        ) : events.length ? (
          <div className="ka-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>İşlem</th>
                  <th>Kullanıcı</th>
                  <th>Kayıt</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id}>
                    <td>{actions[e.action] || e.action}</td>
                    <td>{e.actor || "—"}</td>
                    <td className="ka-audit-target">{e.target || "—"}</td>
                    <td>{formatDate(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={History}
            title="Henüz işlem kaydı yok"
            text="Yeni yönetim işlemleri bu listede görünecek."
          />
        )}
      </section>
    </>
  );
}

function Login({
  onLogin,
  initialError,
  initialNotice,
}: {
  onLogin: (account: Operator) => void;
  initialError: string;
  initialNotice: string;
}) {
  const [username, setUsername] = useState("admin");
  const [accountType, setAccountType] = useState<"admin" | "staff">("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [visible, setVisible] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await api<{ user: Operator }>(
        accountType === "staff" ? "/api/staff/login" : "/api/admin/login",
        { method: "POST", body: JSON.stringify({ username, password }) },
      );
      onLogin({ ...result.user, authKind: accountType });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="kd-admin ka-login">
      <div className="ka-login-art">
        <a className="ka-brand" href="/">
          <span className="ka-monogram">
            K<span>.</span>
          </span>
          <span>
            KILINÇ<small>DEKORASYON</small>
          </span>
        </a>
        <div>
          <p className="ka-eyebrow">SİZİN İŞİNİZ. SİZİN HİKÂYENİZ.</p>
          <h1>
            Yaşam alanlarına
            <br />
            değer katın.
          </h1>
          <p>
            İçeriklerinizi güncelleyin, projelerinizi paylaşın,
            <br />
            müşterilerinizle bağlantıda kalın.
          </p>
        </div>
        <span className="ka-login-caption">
          KILINÇ DEKORASYON · İÇERİK YÖNETİMİ
        </span>
        <div className="ka-login-lines" aria-hidden="true" />
      </div>
      <div className="ka-login-form-wrap">
        <a href="/" className="ka-back-link">
          <ArrowLeft size={16} />
          Siteye dön
        </a>
        <form onSubmit={submit} className="ka-login-form">
          <span className="ka-login-lock">
            <LockKeyhole size={24} />
          </span>
          <p className="ka-eyebrow">YÖNETİCİ GİRİŞİ</p>
          <h2>Tekrar hoş geldiniz.</h2>
          <p className="ka-muted">
            Sitenizi yönetmek için hesabınıza giriş yapın.
          </p>
          {initialNotice && (
            <div role="status" className="ka-alert success">
              {initialNotice}
            </div>
          )}
          {error && (
            <div role="alert" className="ka-alert error">
              {error}
            </div>
          )}
          <label className="ka-field">
            Hesap türü
            <select
              aria-label="Hesap türü"
              value={accountType}
              onChange={(e) => {
                setAccountType(e.target.value as "admin" | "staff");
                setUsername(e.target.value === "admin" ? "admin" : "");
              }}
            >
              <option value="admin">Ana yönetici</option>
              <option value="staff">Personel</option>
            </select>
          </label>
          <label className="ka-field">
            Kullanıcı adı
            <input
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>
          <label className="ka-field">
            Parola
            <span className="ka-password-input">
              <input
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Parolayı gizle" : "Parolayı göster"}
              >
                <Eye size={18} />
              </button>
            </span>
          </label>
          <button className="ka-button primary" disabled={busy} type="submit">
            {busy ? (
              <Loader2 className="spin" size={18} />
            ) : (
              <LockKeyhole size={17} />
            )}
            Giriş yap
            <ArrowUpRight size={17} />
          </button>
          <details className="ka-login-help">
            <summary>İlk kez mi giriş yapıyorsunuz?</summary>
            <p>
              Kullanıcı adı <strong>admin</strong>. İlk parola, sunucudaki{" "}
              <code>.data/initial-admin-password</code> dosyasındadır. Kurulumda{" "}
              <code>ADMIN_PASSWORD</code> tanımlandıysa bu parolayı kullanın.
              Sunucu yöneticinizden güvenli şekilde alın ve giriş yaptıktan
              sonra değiştirin.
            </p>
          </details>
        </form>
        <p className="ka-login-foot">
          <ShieldCheck size={14} />
          Yalnızca yetkili kullanıcılar içindir.
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Package;
  title: string;
  text: string;
}) {
  return (
    <div className="ka-empty">
      <span>
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

function ContentEditor({
  value,
  onCancel,
  onSave,
}: {
  value: Content;
  onCancel: () => void;
  onSave: (content: Content) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Content>({ ...value });
  const [tab, setTab] = useState("content");
  const [specs, setSpecs] = useState(
    value.specs?.map((s) => `${s.label}: ${s.value}`).join("\n") || "",
  );
  const [gallery, setGallery] = useState(value.gallery?.join("\n") || "");
  const [uploadRights, setUploadRights] = useState(emptyMediaRights);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  function update<K extends keyof Content>(key: K, val: Content[K]) {
    setDraft((d) => ({ ...d, [key]: val }));
  }
  const path =
    (
      {
        product: "/urunler/",
        project: "/projeler/",
        article: "/blog/",
        page: "/kurumsal/",
        faq: "/sikca-sorulan-sorular#",
        region: "/bolgeler/",
      } as const
    )[draft.type] + (draft.slug || slugify(draft.title));
  async function uploadFiles(files: FileList | null, cover = false) {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    const urls: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (file.size > 8 * 1024 * 1024)
          throw new Error("Her görsel en fazla 8 MB olabilir.");
        const data = new FormData();
        data.append("image", file);
        appendMediaRights(data, uploadRights);
        const r = await api<{ url: string }>("/api/admin/upload", {
          method: "POST",
          body: data,
        });
        urls.push(r.url);
      }
      if (cover && urls[0]) update("image", urls[0]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (!cover)
        setGallery((old) => [old, ...urls].filter(Boolean).join("\n"));
      setUploading(false);
    }
  }
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!draft.title.trim()) {
      setTab("content");
      setError("İçerik başlığını doldurun.");
      return;
    }
    setBusy(true);
    try {
      const imageUrls = [draft.image, ...gallery.split("\n")]
        .map((v) => v?.trim())
        .filter(Boolean);
      if (
        imageUrls.some(
          (v) => !v.startsWith("/images/") && !v.startsWith("/uploads/"),
        )
      )
        throw new Error(
          "Görselleri yükleyin veya /images/ ya da /uploads/ ile başlayan yerel adres kullanın.",
        );
      await onSave({
        ...draft,
        slug: draft.slug || slugify(draft.title),
        specs: specs
          .split("\n")
          .filter((s) => s.trim())
          .map((line) => {
            const ix = line.indexOf(":");
            return {
              label: ix < 0 ? line.trim() : line.slice(0, ix).trim(),
              value: ix < 0 ? "" : line.slice(ix + 1).trim(),
            };
          }),
        gallery: gallery
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="ka-editor">
      <div className="ka-editor-main ka-panel">
        <div className="ka-panel-title">
          <h2>İçerik stüdyosu</h2>
          <button type="button" onClick={onCancel}>
            <ArrowLeft size={15} />
            Listeye dön
          </button>
        </div>
        <div
          className="ka-editor-tabs"
          role="tablist"
          aria-label="İçerik alanları"
        >
          {[
            { id: "content", label: "Türkçe içerik" },
            { id: "english", label: "English" },
            { id: "details", label: "Teknik & galeri" },
            { id: "seo", label: "Arama motorları" },
          ].map((t) => (
            <button
              type="button"
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              className={tab === t.id ? "active" : ""}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {error && (
          <div className="ka-alert error" role="alert">
            {error}
          </div>
        )}
        <div
          className="ka-tab-content"
          role="tabpanel"
          id={`panel-${tab}`}
          aria-labelledby={`tab-${tab}`}
        >
          {tab === "content" && (
            <>
              <label className="ka-field">
                Başlık *
                <input
                  value={draft.title}
                  onChange={(e) => update("title", e.target.value)}
                  maxLength={200}
                  aria-required="true"
                />
              </label>
              <label className="ka-field">
                Bağlantı adı (slug)
                <input
                  value={draft.slug}
                  placeholder={slugify(draft.title) || "ornek-icerik"}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  onChange={(e) => update("slug", e.target.value)}
                  title="Küçük harf, rakam ve kelimeler arasında tire kullanın."
                />
                <small>
                  Boş bırakırsanız başlıktan oluşturulur. Yayındaki bir
                  bağlantıyı değiştirirseniz eski adres etkilenir.
                </small>
              </label>
              <label className="ka-field">
                Alt başlık
                <input
                  value={draft.subtitle || ""}
                  onChange={(e) => update("subtitle", e.target.value)}
                />
              </label>
              <label className="ka-field">
                Kısa açıklama
                <textarea
                  rows={4}
                  value={draft.summary || ""}
                  onChange={(e) => update("summary", e.target.value)}
                />
                <small>
                  Liste kartlarında gösterilir. Konuyu birkaç cümleyle anlatın.
                </small>
              </label>
              <label className="ka-field">
                {draft.type === "faq" ? "Sorunun yanıtı" : "Detaylı içerik"}
                <textarea
                  className="ka-body-input"
                  rows={15}
                  value={draft.body || ""}
                  onChange={(e) => update("body", e.target.value)}
                />
                <small>
                  Paragrafları boş satırla ayırın. HTML kodu kullanmanız
                  gerekmez; metin güvenli düz yazı olarak gösterilir.
                </small>
              </label>
              <div className="ka-editor-tip">
                <CircleHelp size={17} />
                <p>
                  Ürünün kullanım alanlarını, seçim ölçütlerini, uygulama
                  sürecini ve bakımını açıklayın. Belgesiz garanti, sertifika
                  veya performans değeri yazmayın.
                </p>
              </div>
            </>
          )}
          {tab === "english" && (
            <>
              <p className="ka-tab-intro">
                İngilizce sitede gösterilen içerikler. Boş alanlar için Türkçe
                metin kullanılır.
              </p>
              {(
                [
                  { key: "titleEn", label: "Title", rows: 1 },
                  { key: "subtitleEn", label: "Subtitle", rows: 1 },
                  { key: "summaryEn", label: "Summary", rows: 4 },
                  { key: "bodyEn", label: "Full content", rows: 14 },
                ] as const
              ).map((f) => (
                <label className="ka-field" key={f.key}>
                  {f.label}
                  {f.rows === 1 ? (
                    <input
                      lang="en"
                      value={draft[f.key] || ""}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  ) : (
                    <textarea
                      lang="en"
                      rows={f.rows}
                      value={draft[f.key] || ""}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  )}
                </label>
              ))}
            </>
          )}
          {tab === "details" && (
            <>
              <label className="ka-field">
                Teknik özellikler
                <textarea
                  rows={8}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder={
                    "Kullanım alanı: Balkon ve teras\nAçılım: Yatay sürme"
                  }
                />
                <small>
                  Her satıra “Özellik adı: Değer” girin. Yalnızca doğrulanmış
                  bilgileri kullanın.
                </small>
              </label>
              <h3 className="ka-editor-subtitle">Fotoğraf galerisi</h3>
              <UploadRights
                value={uploadRights}
                onChange={setUploadRights}
                disabled={uploading}
              />
              <label className="ka-upload">
                <ImagePlus size={24} />
                <span>
                  {uploading ? "Yükleniyor…" : "Galeriye görsel ekle"}
                </span>
                <small>Birden fazla JPG, PNG veya WebP seçebilirsiniz.</small>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(e) => uploadFiles(e.target.files)}
                />
              </label>
              <div className="ka-gallery-previews">
                {gallery
                  .split("\n")
                  .filter(Boolean)
                  .map((url, index) => (
                    <div key={`${url}-${index}`}>
                      <img src={url} alt={`Galeri önizlemesi ${index + 1}`} />
                      <button
                        type="button"
                        aria-label={`${index + 1}. görseli galeriden çıkar`}
                        onClick={() =>
                          setGallery(
                            gallery
                              .split("\n")
                              .filter((_, i) => i !== index)
                              .join("\n"),
                          )
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
              </div>
              <label className="ka-field">
                Galeri görsel adresleri
                <textarea
                  rows={5}
                  value={gallery}
                  onChange={(e) => setGallery(e.target.value)}
                  placeholder="Her satıra bir yerel görsel adresi"
                />
              </label>
            </>
          )}
          {tab === "seo" && (
            <>
              <p className="ka-tab-intro">
                Arama sonuçlarındaki görünümü yönetin. Boş alanlarda içerik
                başlığı ve özeti kullanılır.
              </p>
              <label className="ka-field">
                SEO başlığı
                <input
                  maxLength={200}
                  value={draft.seoTitle || ""}
                  placeholder={draft.title}
                  onChange={(e) => update("seoTitle", e.target.value)}
                />
                <small>
                  {(draft.seoTitle || draft.title).length} karakter · Genellikle
                  50–60 karakterlik açık bir başlık tercih edin.
                </small>
              </label>
              <label className="ka-field">
                SEO açıklaması
                <textarea
                  rows={4}
                  maxLength={500}
                  value={draft.seoDescription || ""}
                  placeholder={draft.summary}
                  onChange={(e) => update("seoDescription", e.target.value)}
                />
                <small>
                  {(draft.seoDescription || draft.summary).length} karakter ·
                  Öneri: 140–160 karakter.
                </small>
              </label>
              <div className="ka-search-preview">
                <small>Arama sonucu önizlemesi</small>
                <span>alanadiniz.com{path}</span>
                <h3>{draft.seoTitle || draft.title || "İçerik başlığınız"}</h3>
                <p>
                  {draft.seoDescription ||
                    draft.summary ||
                    "Sayfanızın kısa açıklaması burada görünür."}
                </p>
              </div>
              <p className="ka-help">
                Bu bir önizlemedir. Arama motorları başlık ve açıklamayı farklı
                gösterebilir.
              </p>
            </>
          )}
        </div>
      </div>
      <div className="ka-editor-side">
        <section className="ka-panel">
          <div className="ka-panel-title">
            <h2>Yayın ayarları</h2>
            <span
              className={`ka-badge ${draft.published ? "published" : "draft"}`}
            >
              {draft.published ? "Yayında" : "Taslak"}
            </span>
          </div>
          <label className="ka-checkbox">
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => update("published", e.target.checked)}
            />
            <span>
              Yayında<small>Ziyaretçiler içeriği görebilir.</small>
            </span>
          </label>
          <label className="ka-checkbox">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(e) => update("featured", e.target.checked)}
            />
            <span>
              Öne çıkar<small>Ana sayfa seçkisinde öncelik ver.</small>
            </span>
          </label>
          <label className="ka-field">
            Kategori
            <input
              value={draft.category || ""}
              onChange={(e) => update("category", e.target.value)}
              placeholder={
                draft.type === "region" ? "Ankara" : "Cam sistemleri"
              }
            />
          </label>
          <label className="ka-field">
            Sıralama
            <input
              type="number"
              min={0}
              step={1}
              value={draft.sortOrder}
              onChange={(e) => update("sortOrder", Number(e.target.value))}
            />
            <small>Küçük sayı önce gösterilir.</small>
          </label>
          {draft.id && (
            <a
              href={path}
              target="_blank"
              rel="noreferrer"
              className="ka-preview-link"
            >
              <Eye size={15} />
              Yayındaki sayfayı görüntüle
            </a>
          )}
          <button
            type="submit"
            className="ka-button primary"
            disabled={busy || uploading}
          >
            {busy ? <Loader2 className="spin" size={17} /> : <Save size={17} />}
            Değişiklikleri kaydet
          </button>
          <button
            className="ka-button secondary"
            type="button"
            onClick={onCancel}
          >
            Listeye dön
          </button>
          {draft.updatedAt && (
            <p className="ka-help ka-last-update">
              Son kayıt: {formatDate(draft.updatedAt)}
            </p>
          )}
        </section>
        <section className="ka-panel">
          <div className="ka-panel-title">
            <h2>Kapak görseli</h2>
          </div>
          {draft.image && (
            <img
              className="ka-cover-preview"
              src={draft.image}
              alt={draft.imageAlt || "Kapak önizlemesi"}
            />
          )}
          <UploadRights
            value={uploadRights}
            onChange={setUploadRights}
            disabled={uploading}
          />
          <label className="ka-upload">
            <ImagePlus size={22} />
            <span>{uploading ? "Yükleniyor…" : "Kapak görseli yükle"}</span>
            <small>JPG, PNG veya WebP · En fazla 8 MB</small>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              onChange={(e) => uploadFiles(e.target.files, true)}
            />
          </label>
          <label className="ka-field">
            Görsel adresi
            <input
              value={draft.image || ""}
              onChange={(e) => update("image", e.target.value)}
              placeholder="/uploads/gorsel.webp"
            />
          </label>
          <label className="ka-field">
            Görsel açıklaması (alt metin)
            <input
              maxLength={300}
              value={draft.imageAlt || ""}
              onChange={(e) => update("imageAlt", e.target.value)}
            />
            <small>
              Ekran okuyucular için görselde ne olduğunu kısaca anlatın.
            </small>
          </label>
          <p className="ka-help">
            Yalnızca kullanım hakkına sahip olduğunuz görseller yükleyin.
          </p>
        </section>
      </div>
    </form>
  );
}

const settingGroups: {
  title: string;
  description: string;
  fields: {
    key: string;
    label: string;
    textarea?: boolean;
    type?: string;
    hint?: string;
  }[];
}[] = [
  {
    title: "Marka bilgileri",
    description: "Sitenin genelinde kullanılan firma bilgileri.",
    fields: [
      { key: "companyName", label: "Firma adı" },
      { key: "logoText", label: "Logo yazısı" },
      { key: "tagline", label: "Marka sloganı" },
      { key: "aboutText", label: "Kısa hakkımızda metni", textarea: true },
      {
        key: "serviceAreas",
        label: "Hizmet bölgeleri",
        hint: "Hizmet verdiğiniz şehir veya ilçeleri yazın.",
      },
    ],
  },
  {
    title: "İletişim",
    description:
      "Bu bilgileri kaydettiğinizde site üzerindeki iletişim bağlantıları güncellenir.",
    fields: [
      {
        key: "phone",
        label: "Telefon",
        type: "tel",
        hint: "Örnek: +90 5XX XXX XX XX",
      },
      {
        key: "whatsapp",
        label: "WhatsApp numarası",
        hint: "Ülke kodu dahil: 905XXXXXXXXX",
      },
      { key: "email", label: "E-posta", type: "email" },
      { key: "address", label: "Adres", textarea: true },
      { key: "workingHours", label: "Çalışma saatleri" },
    ],
  },
  {
    title: "Ana sayfa",
    description: "Ziyaretçilerinizin ilk gördüğü başlık ve açıklamalar.",
    fields: [
      {
        key: "heroImage",
        label: "Ana sayfa görseli",
        hint: "Görsel yükleyin veya /images/ ya da /uploads/ ile başlayan yerel adres girin.",
      },
      { key: "heroEyebrow", label: "Üst etiket" },
      { key: "heroTitle", label: "Ana başlık" },
      { key: "heroSubtitle", label: "Ana açıklama", textarea: true },
      { key: "heroEyebrowEn", label: "Üst etiket (İngilizce)" },
      { key: "heroTitleEn", label: "Ana başlık (İngilizce)" },
      {
        key: "heroSubtitleEn",
        label: "Ana açıklama (İngilizce)",
        textarea: true,
      },
      { key: "aboutTextEn", label: "Hakkımızda (İngilizce)", textarea: true },
    ],
  },
  {
    title: "Arama motorları",
    description:
      "Sayfanızın arama sonuçlarında kullanılacak başlık ve açıklaması.",
    fields: [
      {
        key: "websiteUrl",
        label: "Yayın alan adı",
        type: "url",
        hint: "Örnek: https://firmaniz.com · Canonical adresler ve site haritası için kullanılır.",
      },
      { key: "seoTitle", label: "Site başlığı" },
      { key: "seoDescription", label: "Site açıklaması", textarea: true },
    ],
  },
  {
    title: "Hizmet ve süreç metinleri",
    description:
      "Ana sayfanızdaki hizmet ailelerini, proje adımlarını ve bölgesel hizmet başlığını düzenleyin.",
    fields: [
      { key: "servicesTitle", label: "Hizmetler başlığı" },
      { key: "regionTitle", label: "Hizmet bölgeleri başlığı" },
      { key: "processTitle", label: "Proje süreci başlığı" },
      ...Array.from({ length: 4 }, (_, i) => [
        { key: `processStep${i + 1}Title`, label: `${i + 1}. adım başlığı` },
        {
          key: `processStep${i + 1}Text`,
          label: `${i + 1}. adım açıklaması`,
          textarea: true,
        },
      ]).flat(),
    ],
  },
  {
    title: "İletişim sayfası ve alt alan",
    description:
      "İletişim bölümünün başlıklarını ve sayfa altı metnini düzenleyin.",
    fields: [
      { key: "contactTitle", label: "İletişim başlığı" },
      { key: "contactText", label: "İletişim açıklaması", textarea: true },
      { key: "footerText", label: "Alt alan açıklaması", textarea: true },
    ],
  },
  {
    title: "Sosyal medya",
    description:
      "Aktif hesaplarınızın tam bağlantılarını ekleyin. Kullanmadıklarınızı boş bırakın.",
    fields: [
      { key: "instagram", label: "Instagram", type: "url" },
      { key: "facebook", label: "Facebook", type: "url" },
      { key: "youtube", label: "YouTube", type: "url" },
      { key: "linkedin", label: "LinkedIn", type: "url" },
    ],
  },
];
function SettingsEditor({
  value,
  onSave,
}: {
  value: Settings;
  onSave: (value: Settings) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Settings>({ ...value });
  const [uploadRights, setUploadRights] = useState(emptyMediaRights);
  const [active, setActive] = useState(settingGroups[0].title);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  async function uploadHero(file?: File) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = new FormData();
      data.append("image", file);
      appendMediaRights(data, uploadRights);
      const response = await api<{ url: string }>("/api/admin/upload", {
        method: "POST",
        body: data,
      });
      setDraft((old) => ({ ...old, heroImage: response.url }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }
  useEffect(() => setDraft({ ...value }), [value]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (
        draft.heroImage &&
        !String(draft.heroImage).startsWith("/images/") &&
        !String(draft.heroImage).startsWith("/uploads/")
      )
        throw new Error("Ana sayfa görseli için yerel bir görsel yükleyin.");
      await onSave(draft);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  return (
    <form className="ka-settings-form" onSubmit={submit}>
      {error && (
        <div className="ka-alert error" role="alert">
          {error}
        </div>
      )}
      <div className="ka-settings-tabs" aria-label="Ayar kategorileri">
        {[...settingGroups.map((g) => g.title), "Görünüm ve dil"].map(
          (title) => (
            <button
              type="button"
              key={title}
              className={active === title ? "active" : ""}
              onClick={() => setActive(title)}
            >
              {title}
            </button>
          ),
        )}
      </div>
      {settingGroups
        .filter((g) => g.title === active)
        .map((group) => (
          <section className="ka-panel ka-settings-section" key={group.title}>
            <div>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
              <div className="ka-settings-tip">
                <ShieldCheck size={18} />
                <p>
                  Kaydedilen değerler siteye yansır. Kullanmadığınız iletişim ve
                  sosyal hesapları boş bırakabilirsiniz.
                </p>
              </div>
            </div>
            <div>
              {group.title === "Ana sayfa" && (
                <div className="ka-hero-upload">
                  {draft.heroImage && (
                    <img
                      className="ka-cover-preview"
                      src={String(draft.heroImage)}
                      alt="Ana sayfa görseli önizlemesi"
                    />
                  )}
                  <UploadRights
                    value={uploadRights}
                    onChange={setUploadRights}
                    disabled={uploading}
                  />
                  <label className="ka-upload">
                    <ImagePlus size={22} />
                    <span>
                      {uploading ? "Yükleniyor…" : "Ana sayfa görseli yükle"}
                    </span>
                    <small>JPG, PNG veya WebP · En fazla 8 MB</small>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading}
                      onChange={(e) => uploadHero(e.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
              {group.fields.map((field) => (
                <label className="ka-field" key={field.key}>
                  {field.label}
                  {field.textarea ? (
                    <textarea
                      rows={5}
                      value={String(draft[field.key] || "")}
                      onChange={(e) =>
                        setDraft({ ...draft, [field.key]: e.target.value })
                      }
                    />
                  ) : (
                    <input
                      type={field.type || "text"}
                      value={
                        Array.isArray(draft[field.key])
                          ? (draft[field.key] as string[]).join(", ")
                          : String(draft[field.key] || "")
                      }
                      onChange={(e) =>
                        setDraft({ ...draft, [field.key]: e.target.value })
                      }
                    />
                  )}{" "}
                  {field.hint && <small>{field.hint}</small>}
                </label>
              ))}
            </div>
          </section>
        ))}
      {active === "Görünüm ve dil" && (
        <section className="ka-panel ka-settings-section">
          <div>
            <h2>Görünüm ve dil</h2>
            <p>
              Mevcut renk paletinizi koruyabilir veya markanıza göre
              düzenleyebilirsiniz. İstemediğiniz ana sayfa bölümlerini gizleyin.
            </p>
          </div>
          <div>
            <div className="ka-field-grid">
              {[
                { key: "primaryColor", label: "Ana renk", fallback: "#193a31" },
                {
                  key: "accentColor",
                  label: "Arka plan rengi",
                  fallback: "#f4f0e7",
                },
              ].map((f) => (
                <label className="ka-field" key={f.key}>
                  {f.label}
                  <span className="ka-color-input">
                    <input
                      type="color"
                      value={String(draft[f.key] || f.fallback)}
                      onChange={(e) =>
                        setDraft({ ...draft, [f.key]: e.target.value })
                      }
                    />
                    <span>
                      {String(draft[f.key] || f.fallback).toUpperCase()}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <p className="ka-help">
              Renk değişikliklerinden sonra metinlerin okunabildiğini kontrol
              edin.
            </p>
            <h3 className="ka-editor-subtitle">Ana sayfa bölümleri</h3>
            {[
              { key: "showProjects", label: "Projeler / Yaşam alanları" },
              { key: "showArticles", label: "Rehber yazıları" },
              { key: "showRegions", label: "Hizmet bölgeleri" },
              { key: "showFaq", label: "Sık sorulan sorular" },
            ].map((f) => (
              <label key={f.key} className="ka-checkbox ka-toggle">
                <input
                  type="checkbox"
                  checked={draft[f.key] !== false}
                  onChange={(e) =>
                    setDraft({ ...draft, [f.key]: e.target.checked })
                  }
                />
                <span>
                  {f.label}
                  <small>Gezinmede ve ilgili ana sayfa bölümünde göster.</small>
                </span>
              </label>
            ))}
            <h3 className="ka-editor-subtitle">Site dilleri</h3>
            <label className="ka-checkbox">
              <input type="checkbox" checked disabled />
              <span>
                Türkçe<small>Varsayılan dil</small>
              </span>
            </label>
            <label className="ka-checkbox">
              <input
                type="checkbox"
                checked={
                  Array.isArray(draft.languages) &&
                  draft.languages.includes("en")
                }
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    languages: e.target.checked ? ["tr", "en"] : ["tr"],
                  })
                }
              />
              <span>
                English
                <small>
                  Ziyaretçilerin İngilizce içeriğe geçebilmesini sağlar.
                </small>
              </span>
            </label>
          </div>
        </section>
      )}
      <div className="ka-save-bar">
        <p>
          {dirty ? (
            <>
              <Pencil size={16} />
              Kaydedilmemiş değişiklikleriniz var.
            </>
          ) : (
            <>
              <Check size={16} />
              Ayarlarınız güncel.
            </>
          )}
        </p>
        <button
          className="ka-button primary"
          type="submit"
          disabled={busy || uploading || !dirty}
        >
          {busy ? <Loader2 size={17} className="spin" /> : <Save size={17} />}
          Tüm ayarları kaydet
        </button>
      </div>
    </form>
  );
}

function Security({ onSaved }: { onSaved: () => void }) {
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) {
      setError("Yeni parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    try {
      await api("/api/admin/password", {
        method: "PUT",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrent("");
      setNew("");
      setConfirm("");
      onSaved();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ka-security-layout">
      <SecurityStatus />
      <form onSubmit={submit} className="ka-panel ka-security">
        <span className="ka-security-icon">
          <ShieldCheck size={30} />
        </span>
        <h2>Parolanızı değiştirin</h2>
        <p className="ka-muted">
          En az 12 karakterden oluşan, başka yerde kullanmadığınız bir parola
          seçin.
        </p>
        {error && (
          <div className="ka-alert error" role="alert">
            {error}
          </div>
        )}
        <label className="ka-field">
          Mevcut parola
          <input
            type="password"
            autoComplete="current-password"
            required
            value={currentPassword}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <label className="ka-field">
          Yeni parola
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={newPassword}
            onChange={(e) => setNew(e.target.value)}
          />
        </label>
        <label className="ka-field">
          Yeni parola (tekrar)
          <input
            type="password"
            autoComplete="new-password"
            minLength={12}
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        <button className="ka-button primary" type="submit" disabled={busy}>
          {busy ? (
            <Loader2 className="spin" size={17} />
          ) : (
            <LockKeyhole size={17} />
          )}
          Parolayı güncelle
        </button>
      </form>
    </div>
  );
}

function MediaLibrary() {
  const [media, setMedia] = useState<
    { url: string; size: number; createdAt: string }[]
  >([]);
  const [rights, setRights] = useState<MediaRightsRecord[]>([]);
  const [uploadRights, setUploadRights] = useState(emptyMediaRights);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    const [result, usage] = await Promise.all([
      api<{ media: typeof media }>("/api/admin/media"),
      api<{ records: MediaRightsRecord[] }>("/api/admin/media-rights"),
    ]);
    setMedia(result.media);
    setRights(usage.records);
  }, []);
  useEffect(() => {
    load()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [load]);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const data = new FormData();
        data.append("image", file);
        appendMediaRights(data, uploadRights);
        await api("/api/admin/upload", { method: "POST", body: data });
      }
      await load();
      setNotice(
        "Görseller kütüphaneye eklendi. Adreslerini içerik alanlarında kullanabilirsiniz.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(url: string) {
    if (!window.confirm("Bu görsel sunucudan kalıcı olarak silinsin mi?"))
      return;
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/admin/media/${encodeURIComponent(url.split("/").pop() || "")}`,
        { method: "DELETE" },
      );
      await load();
      setNotice("Görsel silindi.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function saveRights(url: string, value: MediaRightsDraft) {
    await api(
      `/api/admin/media-rights/${encodeURIComponent(url.split("/").pop() || "")}`,
      { method: "PUT", body: JSON.stringify(value) },
    );
    await load();
  }
  const unreviewed = media.filter(
    (item) => !rights.find((record) => record.url === item.url)?.confirmedAt,
  ).length;
  return (
    <>
      {error && (
        <div role="alert" className="ka-alert error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="ka-alert success">
          {notice}
        </div>
      )}
      <section className="ka-panel ka-media-header">
        <div>
          <h2>Görseller ve kullanım kayıtları</h2>
          <p>
            Yüklediğiniz görselleri burada bulun. Kullanımdaki dosyalar
            silinmeye karşı korunur. Kaynak bilgileri yalnızca yönetimde
            tutulur; beyan kaydı hukuki onay anlamına gelmez.
          </p>
          {!loading && (
            <p>
              {unreviewed} görselin kullanım beyanı eksik. Yayınlamadan önce
              lisans ve izin kapsamını inceleyin.
            </p>
          )}
        </div>
        <label className="ka-button primary ka-upload-button">
          <ImagePlus size={18} />
          {busy ? "İşleniyor…" : "Görsel yükle"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => upload(e.target.files)}
          />
        </label>
      </section>
      <section className="ka-panel ka-media-rights-upload">
        <UploadRights
          value={uploadRights}
          onChange={setUploadRights}
          disabled={busy}
        />
      </section>
      {loading ? (
        <div className="ka-empty">
          <Loader2 className="spin" />
        </div>
      ) : media.length ? (
        <div className="ka-media-grid">
          {media.map((m) => (
            <section className="ka-panel ka-media-card" key={m.url}>
              <img src={m.url} alt="Yüklenen görsel" loading="lazy" />
              <div>
                <strong>{m.url.split("/").pop()}</strong>
                <small>
                  {Math.round(m.size / 1024)} KB · {formatDate(m.createdAt)}
                </small>
                <p
                  className={`ka-rights-status ${rights.find((r) => r.url === m.url)?.confirmedAt ? "recorded" : ""}`}
                >
                  {rights.find((r) => r.url === m.url)?.confirmedAt
                    ? "Kullanım beyanı kayıtlı · Hukuki onay değildir"
                    : "Kullanım beyanı eksik · Yayın öncesi inceleyin"}
                </p>
                <label className="ka-field">
                  Görsel adresi
                  <input
                    value={m.url}
                    readOnly
                    onFocus={(e) => e.target.select()}
                  />
                </label>
                <div>
                  <button
                    type="button"
                    className="ka-button secondary"
                    onClick={() =>
                      navigator.clipboard
                        .writeText(m.url)
                        .then(() => setNotice("Görsel adresi kopyalandı."))
                        .catch(() =>
                          setNotice(
                            "Görsel adresini seçip kopyalayabilirsiniz.",
                          ),
                        )
                    }
                  >
                    Adresi kopyala
                  </button>
                  <button
                    type="button"
                    className="ka-icon-button danger"
                    disabled={busy}
                    aria-label="Görseli sil"
                    onClick={() => remove(m.url)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <MediaRightsEditor
                  key={`${m.url}-${rights.find((r) => r.url === m.url)?.updatedAt || "unreviewed"}`}
                  record={rights.find((r) => r.url === m.url)}
                  onSave={(value) => saveRights(m.url, value)}
                />
              </div>
            </section>
          ))}
        </div>
      ) : (
        <section className="ka-panel">
          <EmptyState
            icon={ImagePlus}
            title="Henüz görsel yüklenmemiş"
            text="Ürün, proje ve yazılarınız için size ait JPG, PNG veya WebP görseller yükleyin. En fazla 8 MB."
          />
        </section>
      )}
    </>
  );
}

function SecurityStatus() {
  const [status, setStatus] = useState<{
    bootstrapPasswordPending: boolean;
    activeSessions: number;
    production: boolean;
    database: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    () =>
      api<NonNullable<typeof status>>("/api/admin/security").then(setStatus),
    [],
  );
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);
  async function revoke() {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/sessions/revoke", { method: "POST", body: "{}" });
      await load();
      setNotice("Diğer yönetim oturumları kapatıldı.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ka-panel ka-security-status">
      <div className="ka-panel-title">
        <h2>Hesap ve oturumlar</h2>
        <ShieldCheck size={20} />
      </div>
      {error && (
        <div role="alert" className="ka-alert error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="ka-alert success">
          {notice}
        </div>
      )}
      {status ? (
        <>
          <div className="ka-session-summary">
            <strong>{status.activeSessions}</strong>
            <span>aktif yönetim oturumu</span>
          </div>
          <p>
            {status.bootstrapPasswordPending
              ? "İlk kurulum parolanız hâlâ kullanılıyor. İlk girişinizin ardından benzersiz bir parola belirleyin."
              : "Parola değiştirildiğinde tüm yönetim oturumları kapatılır."}
          </p>
          <p>
            {status.production
              ? "Üretim modunda güvenli oturum çerezleri kullanılıyor. HTTPS üzerinden erişin."
              : "Geliştirme modu etkin. Canlı yayında üretim modu ve HTTPS kullanın."}
          </p>
          <button
            className="ka-button secondary"
            type="button"
            onClick={revoke}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="spin" size={16} />
            ) : (
              <LogOut size={16} />
            )}
            Diğer oturumları kapat
          </button>
        </>
      ) : (
        <p className="ka-muted">Oturum bilgileri yükleniyor…</p>
      )}
    </section>
  );
}

function StaffPassword({ onSaved }: { onSaved: () => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    if (data.newPassword !== data.confirmPassword) {
      setError("Yeni parolalar eşleşmiyor.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/api/staff/password", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      onSaved();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ka-panel ka-settings-section">
      <div>
        <h2>Hesap güvenliği</h2>
        <p>Parolanızı güncellediğinizde açık oturumlarınız kapatılır.</p>
      </div>
      <form onSubmit={submit}>
        {error && (
          <div className="ka-alert error" role="alert">
            {error}
          </div>
        )}
        <label className="ka-field">
          Mevcut parola
          <input
            required
            type="password"
            name="currentPassword"
            autoComplete="current-password"
          />
        </label>
        <label className="ka-field">
          Yeni parola
          <input
            required
            type="password"
            name="newPassword"
            minLength={12}
            maxLength={256}
            autoComplete="new-password"
          />
        </label>
        <label className="ka-field">
          Yeni parola tekrar
          <input
            required
            type="password"
            name="confirmPassword"
            minLength={12}
            maxLength={256}
            autoComplete="new-password"
          />
        </label>
        <button className="ka-button primary" disabled={busy}>
          Parolayı güncelle
        </button>
      </form>
    </section>
  );
}
function OperatorHeaderTools({
  role,
  onNavigate,
}: {
  role: OperatorRole;
  onNavigate: (section: Section) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        if (["admin", "manager"].includes(role)) {
          const data = await api<{ kpis: { activeVisitors: number } }>(
            "/api/admin/live",
          );
          if (alive) setActive(data.kpis.activeVisitors);
        }
        if (role !== "editor") {
          const data = await api<{ notifications: { readAt?: string }[] }>(
            "/api/admin/notifications",
          );
          if (alive)
            setUnread(data.notifications.filter((n) => !n.readAt).length);
        }
      } catch {}
    };
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [role]);
  const options = groups.filter(
    (g) =>
      role === "admin" ||
      (role === "manager"
        ? [
            "live",
            "customers",
            "pipeline",
            "teams",
            "notifications",
            "security",
          ]
        : role === "technician"
          ? ["pipeline", "projectRequests", "notifications", "security"]
          : [
              "product",
              "project",
              "article",
              "page",
              "faq",
              "region",
              "media",
              "security",
            ]
      ).includes(g.id),
  );
  return (
    <div className="ki-header-tools">
      <div className="ki-global-search">
        <Search size={15} />
        <input
          aria-label="Panelde modül ara"
          placeholder="Modül ara…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <div>
            {options
              .filter((g) =>
                g.label
                  .toLocaleLowerCase("tr")
                  .includes(query.toLocaleLowerCase("tr")),
              )
              .map((g) => (
                <button
                  key={g.id}
                  onClick={() => {
                    onNavigate(g.id);
                    setQuery("");
                  }}
                >
                  {g.label}
                  <ChevronRight size={13} />
                </button>
              ))}
          </div>
        )}
      </div>
      {["admin", "manager"].includes(role) && (
        <button onClick={() => onNavigate("live")} className="ki-active">
          <i />
          {active}
          <span>aktif ziyaretçi</span>
        </button>
      )}
      {role !== "editor" && (
        <button
          onClick={() => onNavigate("notifications")}
          aria-label={`${unread} okunmamış bildirim`}
          className="ki-notice"
        >
          <Bell size={18} />
          <b>{unread}</b>
        </button>
      )}
    </div>
  );
}
