import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Download,
  FileText,
  HelpCircle,
  Loader2,
  LockKeyhole,
  MessageSquare,
  RefreshCw,
  Send,
  Users,
} from "lucide-react";
import "./customer-workspace.css";

type TicketMessage = {
  id: string;
  author: "customer" | "staff";
  authorName: string;
  message: string;
  internal: boolean;
  createdAt: string;
};
type Ticket = {
  id: string;
  customerId: string;
  inquiryId?: string | null;
  subject: string;
  category: string;
  status: string;
  priority: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  messages?: TicketMessage[];
};
type Inquiry = {
  id: string;
  subject: string;
  product?: string;
  message?: string;
  stage?: string;
  district?: string;
  dimensions?: string;
  createdAt: string;
  notes?: string;
  customerMessage?: string;
};
type Message = {
  id: string;
  inquiryId: string;
  author?: string;
  kind?: string;
  message: string;
  createdAt: string;
  source?: "support" | "inquiry";
  ticketId?: string;
  internal?: boolean;
};
type File = {
  id: string;
  inquiryId: string;
  name: string;
  kind: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  scan?: { status: string; engine?: string; scannedAt?: string };
};
type Offer = {
  id: string;
  inquiryId: string;
  title: string;
  version: number;
  status: string;
  currency: string;
  totalMinor: number;
  createdAt: string;
  pdfUrl: string;
};
type Overview = {
  customer: { id: string; name: string; pending?: boolean };
  inquiries: Inquiry[];
  messages: Message[];
  files: File[];
  offers: Offer[];
  activity: { id: string; action: string; detail: string; createdAt: string }[];
  sessions: {
    scoped: boolean;
    inquiryId?: string;
    expiresAt: string;
    lastSeenAt: string;
  }[];
  tickets: Ticket[];
  truncated?: Record<string, boolean>;
  summary: {
    inquiryCount: number;
    activeInquiryCount: number;
    messageCount: number;
    fileCount: number;
    offerCount: number;
    openTicketCount: number;
    activeSessionCount: number;
  };
};
const states: Record<string, string> = {
  open: "Yeni / açık",
  in_progress: "İnceleniyor",
  waiting_customer: "Müşteriden yanıt bekliyor",
  resolved: "Çözüldü",
};
const priorities: Record<string, string> = {
  low: "Düşük",
  normal: "Normal",
  high: "Yüksek",
};
const categories: Record<string, string> = {
  account: "Hesap erişimi",
  technical: "Teknik destek",
  quotation: "Teklif / fiyat",
  document: "Dosya / belge",
  other: "Diğer",
};
const stages: Record<string, string> = {
  received: "Talep alındı",
  assigned: "Keşif planlanıyor",
  surveyed: "Keşif tamamlandı",
  production: "Üretimde",
  installation: "Montaj bekliyor",
  completed: "Tamamlandı",
};
const date = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
const reference = (value?: string | null) =>
  value ? "#" + value.slice(0, 8).toUpperCase() : "Hesap desteği";
const size = (bytes: number) =>
  Number.isFinite(bytes)
    ? bytes >= 1048576
      ? (bytes / 1048576).toFixed(1) + " MB"
      : Math.max(1, Math.round(bytes / 1024)) + " KB"
    : "—";
const json = (method: string, body: unknown) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, { ...options, credentials: "same-origin" });
  const result = await response
    .json()
    .catch(() => ({ error: "Sunucu yanıtı okunamadı." }));
  if (!response.ok) throw new Error(result.error || "İşlem tamamlanamadı.");
  return result as T;
}
function Help({ children }: { children: React.ReactNode }) {
  return (
    <div className="cw-help">
      <HelpCircle size={18} />
      <p>{children}</p>
    </div>
  );
}
function ErrorBox({ message }: { message: string }) {
  return message ? (
    <div className="cw-alert" role="alert">
      {message}
    </div>
  ) : null;
}
function Empty({ children }: { children: React.ReactNode }) {
  return <p className="cw-empty">{children}</p>;
}
function DownloadLink({
  url,
  children,
}: {
  url: string;
  children: React.ReactNode;
}) {
  return /^\/api\/admin\/(?:documents|project-files|offers)\/[a-zA-Z0-9-]+\/(?:download|pdf)$/.test(
    url,
  ) ? (
    <a className="cw-download" href={url}>
      <Download size={14} />
      {children}
    </a>
  ) : null;
}

export default function CustomerWorkspace({
  customerId,
  role = "admin",
}: {
  customerId: string;
  role?: string;
}) {
  const [overview, setOverview] = useState<Overview | null>(null),
    [tab, setTab] = useState("summary"),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const data = await api<Overview>(
        `/api/admin/customers/${customerId}/overview`,
      );
      setOverview(data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [customerId]);
  useEffect(() => {
    setOverview(null);
    setTab("summary");
    void load();
  }, [load]);
  const tabs = [
    { id: "summary", label: "Talepler", count: overview?.summary.inquiryCount },
    {
      id: "messages",
      label: "Mesajlar",
      count: overview?.summary.messageCount,
    },
    { id: "files", label: "Dosyalar", count: overview?.summary.fileCount },
    { id: "offers", label: "Teklifler", count: overview?.summary.offerCount },
    {
      id: "support",
      label: "Destek",
      count: overview?.summary.openTicketCount,
    },
    ...(role === "admin"
      ? [
          {
            id: "access",
            label: "Oturum & kayıt",
            count: overview?.summary.activeSessionCount,
          },
        ]
      : []),
  ];
  return (
    <section
      className="ka-panel cw-workspace"
      aria-label="Müşterinin tüm kayıtları"
    >
      <div className="cw-heading">
        <div>
          <span className="cw-eyebrow">MÜŞTERİ DOSYASI</span>
          <h2>{overview?.customer.name || "Müşteri kayıtları"}</h2>
          <p>
            {overview?.customer.pending
              ? "Üyelik tamamlanmamış güvenli takip hesabı"
              : "Hesap, talepler ve iletişim geçmişi"}
          </p>
        </div>
        <button
          type="button"
          className="ka-button secondary"
          disabled={busy}
          onClick={() => void load()}
          aria-label="Müşteri dosyasını yenile"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      <Help>
        İlgili sekmeden müşterinin taleplerini, mesajlarını ve belgelerini
        inceleyin. Profil veya giriş sorununu düzeltmek için aşağıdaki{" "}
        <strong>Müşteri profili</strong> alanını kullanın. Yalnızca yetki
        kapsamınızdaki kayıtlar gösterilir.
      </Help>
      <ErrorBox message={error} />
      {busy && !overview ? (
        <div className="cw-loading">
          <Loader2 size={20} className="spin" />
          Kayıtlar yükleniyor…
        </div>
      ) : (
        overview && (
          <>
            <div className="cw-kpis">
              <span>
                <strong>{overview.summary.activeInquiryCount}</strong>Aktif
                talep
              </span>
              <span>
                <strong>{overview.summary.fileCount}</strong>Dosya
              </span>
              <span>
                <strong>{overview.summary.openTicketCount}</strong>Açık destek
              </span>
            </div>
            <div
              className="cw-tabs"
              role="tablist"
              aria-label="Müşteri kayıt türü"
            >
              {tabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === item.id}
                  className={tab === item.id ? "active" : ""}
                  onClick={() => setTab(item.id)}
                >
                  {item.label}
                  <span>{item.count ?? 0}</span>
                </button>
              ))}
            </div>
            <div className="cw-tab-content" role="tabpanel">
              {overview.truncated?.[tab === "summary" ? "inquiries" : tab] && (
                <Help>
                  Bu hesapta çok sayıda kayıt var; ekranda son kayıtların
                  sınırlı bir bölümü gösteriliyor. Veriler silinmedi. Tüm
                  kayıtların taşınması için veri tabanı yedeğini kullanın.
                </Help>
              )}
              {tab === "summary" &&
                (overview.inquiries.length ? (
                  overview.inquiries.map((item) => (
                    <article className="cw-record" key={item.id}>
                      <div className="cw-record-top">
                        <strong>
                          {item.product ||
                            item.subject ||
                            "Keşif / teklif talebi"}
                        </strong>
                        <span className="cw-badge">
                          {stages[item.stage || ""] || item.stage || "Talep"}
                        </span>
                      </div>
                      <small>
                        {reference(item.id)} · {date(item.createdAt)}
                      </small>
                      <dl className="cw-meta">
                        <dt>Bölge</dt>
                        <dd>{item.district || "Belirtilmedi"}</dd>
                        <dt>Yaklaşık ölçü</dt>
                        <dd>{item.dimensions || "Belirtilmedi"}</dd>
                      </dl>
                      {item.message && (
                        <p className="cw-text">{item.message}</p>
                      )}
                      {item.customerMessage && (
                        <p className="cw-note">
                          <strong>Müşteriye açıklama:</strong>{" "}
                          {item.customerMessage}
                        </p>
                      )}
                      {item.notes && (
                        <p className="cw-note internal">
                          <strong>Firma içi not:</strong> {item.notes}
                        </p>
                      )}
                    </article>
                  ))
                ) : (
                  <Empty>Bu hesaba bağlı talep bulunmuyor.</Empty>
                ))}
              {tab === "messages" && (
                <>
                  <Help>
                    Talep ve destek konuşmaları burada birlikte listelenir.
                    Hesap sorunu için <strong>Destek</strong> sekmesini, süreç
                    mesajı göndermek için <strong>Talep süreçleri</strong>{" "}
                    bölümündeki ilgili talebi kullanın.
                  </Help>
                  {overview.messages.length ? (
                    overview.messages.map((item, index) => (
                      <article
                        className={`cw-message ${item.internal ? "internal" : item.author === "customer" ? "customer" : ""}`}
                        key={`${item.source || "inquiry"}-${item.id || index}`}
                      >
                        <div>
                          <strong>
                            {item.internal
                              ? "Firma içi not"
                              : item.author === "customer"
                                ? "Müşteri"
                                : "Firma / teknik ekip"}
                          </strong>
                          <small>
                            {item.source === "support"
                              ? `Destek ${reference(item.ticketId)}`
                              : reference(item.inquiryId)}{" "}
                            · {date(item.createdAt)}
                          </small>
                        </div>
                        <p>{item.message}</p>
                      </article>
                    ))
                  ) : (
                    <Empty>Talep konuşması bulunmuyor.</Empty>
                  )}
                </>
              )}
              {tab === "files" && (
                <>
                  <Help>
                    Proje çizimleri ve firmadan paylaşılan belgeler tek listede
                    bulunur. Dosyayı indirmek için yetkili oturum gerekir;
                    herkese açık dosya bağlantısı oluşturulmaz. Tarama durumu
                    dosyanın indirilebilirliğini etkileyebilir.
                  </Help>
                  {overview.files.length ? (
                    overview.files.map((file) => (
                      <article className="cw-file" key={file.kind + file.id}>
                        <FileText size={20} />
                        <div>
                          <strong>{file.name}</strong>
                          <small>
                            {file.kind === "project"
                              ? "Müşteri proje dosyası"
                              : "Firma belgesi"}{" "}
                            · {size(file.size)}
                          </small>
                          <small>
                            {reference(file.inquiryId)} · {date(file.createdAt)}
                          </small>
                          {file.scan && (
                            <small>
                              Denetim:{" "}
                              {file.scan.status === "clean"
                                ? "Antivirüs taraması temiz"
                                : file.scan.status === "limited_checks"
                                  ? "Sınırlı biçim kontrolü; antivirüs doğrulaması yok"
                                  : file.scan.status === "infected"
                                    ? "Zararlı dosya engellendi"
                                    : file.scan.status === "scan_error"
                                      ? "Tarama tamamlanamadı"
                                      : "Denetim bekliyor"}
                            </small>
                          )}
                        </div>
                        <DownloadLink url={file.downloadUrl}>
                          İndir
                        </DownloadLink>
                      </article>
                    ))
                  ) : (
                    <Empty>Kayıtlı özel dosya bulunmuyor.</Empty>
                  )}
                </>
              )}
              {tab === "offers" &&
                (overview.offers.length ? (
                  overview.offers.map((offer) => (
                    <article className="cw-record" key={offer.id}>
                      <div className="cw-record-top">
                        <strong>{offer.title}</strong>
                        <span className="cw-badge">
                          {offer.status === "published"
                            ? "Yayımlandı"
                            : "Özel taslak"}{" "}
                          · V{offer.version}
                        </span>
                      </div>
                      <small>
                        {reference(offer.inquiryId)} · {date(offer.createdAt)}
                      </small>
                      <p className="cw-amount">
                        {Number.isFinite(offer.totalMinor)
                          ? new Intl.NumberFormat("tr-TR", {
                              style: "currency",
                              currency: ["TRY", "USD", "EUR"].includes(
                                offer.currency,
                              )
                                ? offer.currency
                                : "TRY",
                            }).format(offer.totalMinor / 100)
                          : "Tutar belirtilmedi"}
                      </p>
                      <DownloadLink url={offer.pdfUrl}>Teklif PDF</DownloadLink>
                    </article>
                  ))
                ) : (
                  <Empty>Bu müşteriye ait teklif bulunmuyor.</Empty>
                ))}
              {tab === "support" && (
                <SupportDesk
                  role={role}
                  customerId={customerId}
                  onChanged={() => void load()}
                  compact
                />
              )}
              {tab === "access" && role === "admin" && (
                <>
                  <Help>
                    Oturum belirteçleri ve parolalar bu ekranda gösterilmez.
                    Şüpheli erişimde aşağıdaki profil bölümünden{" "}
                    <strong>Oturumları kapat</strong> işlemini uygulayın;
                    kurtarma bağlantısını kimliği doğrulanan müşteriye iletin.
                  </Help>
                  <h3>Geçerli oturumlar ({overview.sessions.length})</h3>
                  {overview.sessions.length ? (
                    overview.sessions.map((session, index) => (
                      <article className="cw-record" key={index}>
                        <strong>
                          <LockKeyhole size={15} />{" "}
                          {session.scoped
                            ? "Tek talebe özel takip oturumu"
                            : "Üye oturumu"}
                        </strong>
                        <small>
                          Son etkinlik: {date(session.lastSeenAt)} · Bitiş:{" "}
                          {date(session.expiresAt)}
                        </small>
                        {session.scoped && (
                          <small>{reference(session.inquiryId)}</small>
                        )}
                      </article>
                    ))
                  ) : (
                    <Empty>Geçerli oturum bulunmuyor.</Empty>
                  )}
                  <h3>Son hesap hareketleri</h3>
                  {overview.activity.length ? (
                    overview.activity.map((event) => (
                      <article className="cw-activity" key={event.id}>
                        <strong>
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
                              "support-created": "Destek kaydı açıldı",
                              "support-reply": "Destek yanıtı gönderildi",
                            } as Record<string, string>
                          )[event.action] || "Hesap işlemi"}
                        </strong>
                        {event.detail && <p>{event.detail}</p>}
                        <small>{date(event.createdAt)}</small>
                      </article>
                    ))
                  ) : (
                    <Empty>Hesap hareketi bulunmuyor.</Empty>
                  )}
                </>
              )}
            </div>
          </>
        )
      )}
    </section>
  );
}

export function SupportDesk({
  role = "admin",
  customerId,
  compact = false,
  onChanged,
}: {
  role?: string;
  customerId?: string;
  compact?: boolean;
  onChanged?: () => void;
}) {
  const [tickets, setTickets] = useState<Ticket[]>([]),
    [truncated, setTruncated] = useState(false),
    [total, setTotal] = useState(0),
    [selected, setSelected] = useState(""),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const params = new URLSearchParams();
      if (customerId) params.set("customerId", customerId);
      if (filter !== "all") params.set("status", filter);
      const result = await api<{
        tickets: Ticket[];
        truncated?: boolean;
        total: number;
      }>("/api/admin/support-tickets?" + params);
      const rows = customerId
        ? result.tickets.filter((item) => item.customerId === customerId)
        : result.tickets;
      setTickets(rows);
      setTruncated(result.truncated === true);
      setTotal(result.total);
      setSelected((current) =>
        rows.some((item) => item.id === current) ? current : "",
      );
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [customerId, filter]);
  useEffect(() => {
    void load();
  }, [load]);
  async function loadMore() {
    setBusy(true);
    try {
      const params = new URLSearchParams({ offset: String(tickets.length) });
      if (customerId) params.set("customerId", customerId);
      if (filter !== "all") params.set("status", filter);
      const result = await api<{
        tickets: Ticket[];
        hasMore: boolean;
        total: number;
      }>("/api/admin/support-tickets?" + params);
      setTickets((current) => [
        ...current,
        ...result.tickets.filter(
          (item) => !current.some((existing) => existing.id === item.id),
        ),
      ]);
      setTruncated(result.hasMore);
      setTotal(result.total);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visible = tickets.filter(
    (ticket) =>
      (filter === "all" || ticket.status === filter) &&
      `${ticket.subject} ${ticket.id} ${ticket.customerId}`
        .toLocaleLowerCase("tr-TR")
        .includes(query.toLocaleLowerCase("tr-TR")),
  );
  if (!["admin", "manager", "technician"].includes(role))
    return (
      <ErrorBox message="Destek kayıtları için müşteri operasyonu yetkisi gerekir." />
    );
  return (
    <div className={`cw-support ${compact ? "compact" : ""}`}>
      <div className="cw-heading">
        <div>
          <span className="cw-eyebrow">MÜŞTERİ HİZMETLERİ</span>
          <h2>Destek & hesap sorunları</h2>
          <p>
            {total} kayıt · {tickets.length} kayıt gösteriliyor
          </p>
        </div>
        <button
          type="button"
          className="ka-button secondary"
          disabled={busy}
          onClick={() => void load()}
        >
          <RefreshCw size={15} />
          Yenile
        </button>
      </div>
      <Help>
        Müşterinin sorununu açın, konuşmayı inceleyin ve yanıt yazın.{" "}
        <strong>Firma içi not</strong> yalnızca yetkili personele görünür.
        Çözümden sonra durumu <strong>Çözüldü</strong> yapın; müşterinin yeni
        mesajı kaydı tekrar açabilir. Hesap erişimi sorunları ana yönetici
        tarafından çözülür.
      </Help>
      <ErrorBox message={error} />
      {truncated && (
        <Help>
          Listede son destek kayıtları gösteriliyor. Daha eski kayıtları görmek
          için liste sonundaki <strong>Daha fazla kayıt yükle</strong> düğmesini
          kullanın. Arama yüklenen kayıtlar üzerinde çalışır.
        </Help>
      )}
      <div className="cw-support-layout">
        <section className="cw-ticket-list">
          <div className="cw-filters">
            <input
              aria-label="Destek kayıtlarında ara"
              placeholder="Konu veya kayıt numarası ara"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <select
              aria-label="Destek durumu filtresi"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Tüm durumlar</option>
              {Object.entries(states).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {busy && !tickets.length ? (
            <div className="cw-loading">
              <Loader2 size={18} className="spin" />
              Destek kayıtları yükleniyor…
            </div>
          ) : visible.length ? (
            visible.map((ticket) => (
              <button
                type="button"
                className={`cw-ticket-row ${selected === ticket.id ? "active" : ""}`}
                key={ticket.id}
                onClick={() => setSelected(ticket.id)}
              >
                <span>
                  <strong>{ticket.subject}</strong>
                  <small>
                    {reference(ticket.id)} ·{" "}
                    {categories[ticket.category] || ticket.category}
                  </small>
                  <small>
                    {states[ticket.status]} · {priorities[ticket.priority]}{" "}
                    öncelik
                  </small>
                  <small>Güncelleme: {date(ticket.updatedAt)}</small>
                </span>
                <MessageSquare size={16} />
              </button>
            ))
          ) : (
            <Empty>Bu filtrede destek kaydı bulunmuyor.</Empty>
          )}
          {truncated && (
            <button
              type="button"
              className="ka-button secondary"
              disabled={busy}
              onClick={() => void loadMore()}
            >
              {busy ? <Loader2 className="spin" size={14} /> : null}Daha fazla
              kayıt yükle
            </button>
          )}
        </section>
        <section className="cw-ticket-detail">
          {selected ? (
            <TicketConversation
              key={selected}
              ticketId={selected}
              role={role}
              onChanged={() => {
                void load();
                onChanged?.();
              }}
            />
          ) : (
            <div className="cw-placeholder">
              <Users size={30} />
              <h3>Bir destek kaydı seçin</h3>
              <p>Mesajları, durumu ve çözüm notlarını burada yönetin.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function TicketConversation({
  ticketId,
  role,
  onChanged,
}: {
  ticketId: string;
  role: string;
  onChanged: () => void;
}) {
  const [ticket, setTicket] = useState<Ticket | null>(null),
    [customerName, setCustomerName] = useState(""),
    [message, setMessage] = useState(""),
    [internal, setInternal] = useState(false),
    [status, setStatus] = useState("open"),
    [priority, setPriority] = useState("normal"),
    [assigneeId, setAssigneeId] = useState(""),
    [staff, setStaff] = useState<
      { id: string; name?: string; username: string }[]
    >([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const canWrite = role === "admin" || role === "manager";
  const load = useCallback(async () => {
    try {
      const result = await api<{ ticket: Ticket; customer?: { name: string } }>(
        `/api/admin/support-tickets/${ticketId}`,
      );
      setTicket(result.ticket);
      setCustomerName(result.customer?.name || "");
      setStatus(result.ticket.status);
      setPriority(result.ticket.priority);
      setAssigneeId(result.ticket.assigneeId || "");
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [ticketId]);
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (role === "admin")
      void api<{
        staff: {
          id: string;
          name?: string;
          username: string;
          status?: string;
          role?: string;
        }[];
      }>("/api/admin/staff")
        .then((result) =>
          setStaff(
            result.staff.filter(
              (person) =>
                person.status === "active" && person.role === "manager",
            ),
          ),
        )
        .catch(() => setStaff([]));
  }, [role]);
  async function update(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/admin/support-tickets/${ticketId}`,
        json("PATCH", {
          status,
          priority,
          ...(role === "admin" ? { assigneeId } : {}),
        }),
      );
      setNotice("Destek durumu kaydedildi.");
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function reply(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(
        `/api/admin/support-tickets/${ticketId}/messages`,
        json("POST", { message, internal }),
      );
      setNotice(
        internal
          ? "Firma içi not kaydedildi; müşteriye gösterilmez."
          : "Yanıt müşteri destek kaydına eklendi.",
      );
      setMessage("");
      await load();
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <ErrorBox message={error} />
      {notice && (
        <p className="cw-success" role="status">
          {notice}
        </p>
      )}
      {ticket ? (
        <>
          <header className="cw-thread-heading">
            <span className="cw-eyebrow">{reference(ticket.id)}</span>
            <h3>{ticket.subject}</h3>
            <p>
              {customerName || reference(ticket.customerId)} ·{" "}
              {categories[ticket.category] || ticket.category}
            </p>
            <small>
              {reference(ticket.inquiryId)} · {date(ticket.createdAt)}
            </small>
          </header>
          <form className="cw-state-form" onSubmit={update}>
            <label>
              Durum
              <select
                aria-label="Durum"
                value={status}
                disabled={!canWrite || busy}
                onChange={(event) => setStatus(event.target.value)}
              >
                {Object.entries(states).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Öncelik
              <select
                aria-label="Öncelik"
                value={priority}
                disabled={!canWrite || busy}
                onChange={(event) => setPriority(event.target.value)}
              >
                {Object.entries(priorities).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {role === "admin" && (
              <label>
                Sorumlu personel
                <select
                  aria-label="Sorumlu personel"
                  value={assigneeId}
                  disabled={busy}
                  onChange={(event) => setAssigneeId(event.target.value)}
                >
                  <option value="">Henüz atanmadı</option>
                  {ticket.assigneeId &&
                    !staff.some(
                      (person) => person.id === ticket.assigneeId,
                    ) && (
                      <option value={ticket.assigneeId}>
                        Atanmış personel
                      </option>
                    )}
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name || person.username}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canWrite && (
              <button
                className="ka-button secondary"
                type="submit"
                disabled={busy}
              >
                Durumu kaydet
              </button>
            )}
          </form>
          <div className="cw-thread" aria-label="Destek konuşması">
            {(ticket.messages || []).map((item) => (
              <article
                key={item.id}
                className={`cw-message ${item.internal ? "internal" : item.author === "customer" ? "customer" : ""}`}
              >
                <div>
                  <strong>
                    {item.internal
                      ? "Firma içi not"
                      : item.author === "customer"
                        ? "Müşteri"
                        : "Firma yanıtı"}
                    {item.authorName ? ` · ${item.authorName}` : ""}
                  </strong>
                  <small>{date(item.createdAt)}</small>
                </div>
                <p>{item.message}</p>
              </article>
            ))}
          </div>
          {canWrite ? (
            <form className="cw-reply" onSubmit={reply}>
              <label>
                {internal ? "Firma içi notunuz" : "Müşteriye yanıtınız"}
                <textarea
                  required
                  minLength={2}
                  maxLength={4000}
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={
                    internal
                      ? "Yalnızca yetkili ekip tarafından görülecek çözüm notu…"
                      : "Müşterinin göreceği yanıtı yazın…"
                  }
                />
              </label>
              <label className="cw-check">
                <input
                  type="checkbox"
                  checked={internal}
                  onChange={(event) => setInternal(event.target.checked)}
                />
                Firma içi not — müşteriye gösterilmez
              </label>
              <button
                className="ka-button primary"
                disabled={busy}
                type="submit"
              >
                {busy ? (
                  <Loader2 size={15} className="spin" />
                ) : (
                  <Send size={15} />
                )}
                {internal ? "İç notu kaydet" : "Yanıtı ekle"}
              </button>
              <small>
                Yanıt destek panelinde görünür. Dış e-posta teslimi, bildirim
                sağlayıcısının yapılandırmasına bağlıdır.
              </small>
            </form>
          ) : (
            <Help>
              Teknik personel bu kaydı yalnızca görüntüleyebilir. Yanıt ve durum
              değişikliğini yönetici veya operasyon sorumlusu yapar.
            </Help>
          )}
        </>
      ) : (
        !error && (
          <div className="cw-loading">
            <Loader2 className="spin" size={18} />
            Konuşma yükleniyor…
          </div>
        )
      )}
    </>
  );
}
