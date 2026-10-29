import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  FolderOpen,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from "lucide-react";
import "./project-offers.css";

type Role = "admin" | "manager" | "editor" | "technician";
type ProjectFile = {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  extension?: string;
};
type ProjectRequest = {
  id: string;
  name: string;
  email?: string;
  replyEmail?: string;
  phone?: string;
  phoneRequested: boolean;
  requestType: "price" | "project";
  subject: string;
  message: string;
  product?: string;
  district?: string;
  dimensions?: string;
  createdAt: string;
  stage?: string;
  fileCount: number;
  offerCount: number;
  publishedOfferCount: number;
};
type Contact = {
  id: string;
  channel: "email" | "phone";
  note: string;
  actor?: string;
  createdAt: string;
};
type OfferItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  unitPriceMinor?: number;
  lineTotalMinor?: number;
};
type Offer = {
  id: string;
  inquiryId: string;
  version: number;
  status: "draft" | "published";
  title: string;
  currency: "TRY" | "EUR" | "USD";
  items: OfferItem[];
  vatRate: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  validUntil: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  contacts: Contact[];
  pdfUrl: string;
  emlUrl?: string;
  emailDelivery?: {
    status: string;
    error?: string;
    attempts: number;
    updatedAt?: string;
  } | null;
};
type OfferDraft = Pick<
  Offer,
  "title" | "currency" | "items" | "vatRate" | "validUntil" | "notes"
>;
const date = (value?: string) =>
  value && Number.isFinite(Date.parse(value))
    ? new Date(value).toLocaleString("tr-TR", {
        dateStyle: "medium",
        timeStyle: value.length > 10 ? "short" : undefined,
      })
    : "—";
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(
    (minor || 0) / 100,
  );
const bytes = (size: number) =>
  size >= 1048576
    ? `${(size / 1048576).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MB`
    : `${Math.max(1, Math.ceil(size / 1024))} KB`;
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "İşlem tamamlanamadı.";
const deliveryLabels: Record<string, string> = {
  waiting_configuration: "Bağlantı bekliyor",
  queued: "Gönderim kuyruğunda",
  processing: "İşleniyor",
  sent: "Sağlayıcı kabul etti",
  failed: "Gönderilemedi",
};
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
const json = (method: string, body: unknown): RequestInit => ({
  method,
  body: JSON.stringify(body),
});
const freshDraft = (request: ProjectRequest): OfferDraft => ({
  title: request.product ? `${request.product} fiyat teklifi` : "Fiyat teklifi",
  currency: "TRY",
  items: [{ description: "", quantity: 1, unit: "adet", unitPrice: 0 }],
  vatRate: 20,
  validUntil: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  notes: "",
});
const copyDraft = (offer: Offer): OfferDraft => ({
  title: offer.title,
  currency: offer.currency,
  items: offer.items.map(({ description, quantity, unit, unitPrice }) => ({
    description,
    quantity,
    unit,
    unitPrice,
  })),
  vatRate: offer.vatRate,
  validUntil: offer.validUntil,
  notes: offer.notes,
});

export default function ProjectOffers({ role = "admin" }: { role?: Role }) {
  const [requests, setRequests] = useState<ProjectRequest[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await api<{ requests: ProjectRequest[] }>(
        "/api/admin/project-requests",
      );
      setRequests(data.requests);
      setError("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 30000);
    return () => clearInterval(timer);
  }, [load]);
  const selected = requests.find((request) => request.id === selectedId);
  const visible = requests.filter((request) => {
    const matches =
      `${request.name} ${request.replyEmail || request.email || ""} ${request.phone || ""} ${request.product || ""} ${request.district || ""} ${request.id}`
        .toLocaleLowerCase("tr-TR")
        .includes(search.toLocaleLowerCase("tr-TR"));
    return (
      matches &&
      (filter === "all" ||
        (filter === "waiting"
          ? !request.publishedOfferCount
          : !!request.publishedOfferCount))
    );
  });
  return (
    <div className="kp-offers">
      <div className="kp-toolbar ka-panel">
        <div>
          <h2>Dosyadan fiyat teklifine</h2>
          <p>
            Fiyat sorularını ve proje dosyalarını inceleyin; hazırladığınız
            teklifi müşteriye paylaşın.
          </p>
        </div>
        <button
          className="ka-button secondary"
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
        >
          <RefreshCw size={15} className={refreshing ? "spin" : ""} />
          Yenile
        </button>
      </div>
      {error && (
        <p className="ka-alert error" role="alert">
          {error}
        </p>
      )}
      <div className="kp-counts" aria-label="Proje talepleri özeti">
        <div>
          <strong>{requests.length}</strong>
          <span>Gelen başvuru</span>
        </div>
        <div>
          <strong>
            {requests.filter((request) => !request.publishedOfferCount).length}
          </strong>
          <span>Teklif bekliyor</span>
        </div>
        <div>
          <strong>
            {
              requests.filter((request) => request.publishedOfferCount > 0)
                .length
            }
          </strong>
          <span>Teklif paylaşılmış</span>
        </div>
      </div>
      {loading ? (
        <p className="kp-loading" role="status">
          <Loader2 className="spin" size={18} />
          Talepler yükleniyor…
        </p>
      ) : (
        <div className={`kp-workspace ${selected ? "has-selected" : ""}`}>
          <section
            className="kp-request-list ka-panel"
            aria-label="Proje ve fiyat başvuruları"
          >
            <div className="kp-filters">
              <label className="ka-search">
                <Search size={16} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Proje taleplerinde ara"
                  placeholder="Ad, e-posta, ürün…"
                />
              </label>
              <label className="ka-field">
                Teklif durumu
                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="all">Tüm talepler</option>
                  <option value="waiting">Teklif bekleyenler</option>
                  <option value="quoted">Teklif paylaşılanlar</option>
                </select>
              </label>
            </div>
            <ul>
              {visible.map((request) => (
                <li key={request.id}>
                  <button
                    type="button"
                    className={selectedId === request.id ? "active" : ""}
                    onClick={() => setSelectedId(request.id)}
                  >
                    <span className="kp-row-top">
                      <strong>{request.name}</strong>
                      <small>#{request.id.slice(0, 8).toUpperCase()}</small>
                    </span>
                    <span>
                      {request.product ||
                        (request.requestType === "project"
                          ? "Proje üzerinden teklif"
                          : "Fiyat sorusu")}
                    </span>
                    <span className="kp-row-meta">
                      <small>
                        <FileText size={12} />
                        {request.fileCount || 0} dosya
                      </small>
                      <small>{date(request.createdAt)}</small>
                    </span>
                    <em className={request.publishedOfferCount ? "shared" : ""}>
                      {request.publishedOfferCount
                        ? "Teklif paylaşıldı"
                        : "Teklif bekliyor"}
                    </em>
                  </button>
                </li>
              ))}
            </ul>
            {!visible.length && (
              <div className="kp-empty">
                <FolderOpen size={28} />
                <h3>
                  {requests.length
                    ? "Bu aramada talep bulunamadı"
                    : "Henüz proje başvurusu yok"}
                </h3>
                <p>
                  {requests.length
                    ? "Filtreyi veya arama sözcüğünü değiştirin."
                    : "Sitedeki Proje & fiyat teklifi alanından gönderilen talepler burada görünür."}
                </p>
              </div>
            )}
          </section>
          {selected ? (
            <RequestDetail
              key={selected.id}
              request={selected}
              role={role}
              onBack={() => setSelectedId("")}
              onChanged={load}
            />
          ) : (
            <section className="kp-empty kp-detail-placeholder ka-panel">
              <FileText size={34} />
              <h2>Başvuruyu seçin</h2>
              <p>
                Dosyalar, iletişim tercihleri ve teklif hazırlama alanı burada
                açılır.
              </p>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function RequestDetail({
  request,
  role,
  onBack,
  onChanged,
}: {
  request: ProjectRequest;
  role: Role;
  onBack: () => void;
  onChanged: () => Promise<void>;
}) {
  const canWrite = role === "admin" || role === "manager";
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<{
    id?: string;
    draft: OfferDraft;
  } | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [documents, pricing] = await Promise.all([
        api<{ files: ProjectFile[] }>(
          `/api/admin/project-requests/${request.id}/project-files`,
        ),
        api<{ offers: Offer[] }>(
          `/api/admin/project-requests/${request.id}/offers`,
        ),
      ]);
      setFiles(documents.files);
      setOffers(pricing.offers);
      setError("");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setLoading(false);
    }
  }, [request.id]);
  useEffect(() => {
    void load();
  }, [load]);
  async function removeFile(file: ProjectFile) {
    if (!window.confirm(`“${file.name}” dosyası kalıcı olarak silinsin mi?`))
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/project-files/${file.id}`, { method: "DELETE" });
      await load();
      await onChanged();
      setNotice("Dosya silindi.");
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function saveDraft(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api<{ offer: Offer }>(
        editing.id
          ? `/api/admin/offers/${editing.id}`
          : `/api/admin/project-requests/${request.id}/offers`,
        json(editing.id ? "PUT" : "POST", editing.draft),
      );
      setEditing(null);
      await load();
      await onChanged();
      setNotice(
        `Taslak kaydedildi: ${result.offer.title}. Tutarlar sunucuda hesaplandı.`,
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function publish(offer: Offer) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(`/api/admin/offers/${offer.id}/publish`, json("POST", {}));
      await load();
      await onChanged();
      setNotice(
        "Teklif müşteriyle paylaşıldı. E-posta durumu teklif kartında gösterilir.",
      );
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }
  async function logContact(
    offer: Offer,
    channel: "email" | "phone",
    note: string,
  ) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(
        `/api/admin/offers/${offer.id}/contact`,
        json("POST", { channel, note }),
      );
      await load();
      setNotice("İletişim kaydı eklendi.");
    } catch (err) {
      setError(errorText(err));
      throw err;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="kp-request-detail ka-panel"
      aria-label="Başvuru ve teklif ayrıntıları"
    >
      <header className="kp-detail-heading">
        <button
          type="button"
          className="ka-button secondary kp-back"
          onClick={onBack}
        >
          <ArrowLeft size={15} />
          Listeye dön
        </button>
        <div>
          <small>
            #{request.id.slice(0, 8).toUpperCase()} · {date(request.createdAt)}
          </small>
          <h2>{request.name}</h2>
          <p>
            {request.requestType === "project"
              ? "Proje üzerinden teklif talebi"
              : "Fiyat sorusu"}
          </p>
        </div>
      </header>
      <dl className="kp-request-facts">
        <div>
          <dt>E-posta ile dönüş</dt>
          <dd>{request.replyEmail || request.email || "Belirtilmedi"}</dd>
        </div>
        <div>
          <dt>Telefonla aranma</dt>
          <dd>
            {request.phoneRequested ? (
              <>
                <CheckCircle2 size={14} />
                Müşteri talep etti
                {request.phone && (
                  <a href={`tel:${request.phone.replace(/[^+\d]/g, "")}`}>
                    {request.phone}
                  </a>
                )}
              </>
            ) : (
              "Talep edilmedi"
            )}
          </dd>
        </div>
        {request.district && (
          <div>
            <dt>Uygulama bölgesi</dt>
            <dd>{request.district}</dd>
          </div>
        )}
        {request.dimensions && (
          <div>
            <dt>Yaklaşık ölçüler</dt>
            <dd>{request.dimensions}</dd>
          </div>
        )}
      </dl>
      <div className="kp-customer-note">
        <h3>Müşterinin notu</h3>
        <p>{request.message}</p>
      </div>
      {error && (
        <p role="alert" className="ka-alert error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="ka-alert success">
          {notice}
        </p>
      )}
      <section className="kp-files">
        <div className="kp-section-heading">
          <h3>
            Gönderilen proje dosyaları <span>{files.length}</span>
          </h3>
          <button
            type="button"
            className="ka-button secondary"
            onClick={() => void load()}
            disabled={loading || busy}
          >
            <RefreshCw size={14} />
            Yenile
          </button>
        </div>
        <p className="kp-help">
          Dosyaları indirmek için bu başvuruya erişim yetkisi gerekir. Çizimler
          tarayıcı içinde çalıştırılmaz.
        </p>
        {loading ? (
          <p role="status">Dosyalar ve teklifler yükleniyor…</p>
        ) : files.length ? (
          <ul>
            {files.map((file) => (
              <li key={file.id}>
                <FileText size={19} />
                <div>
                  <strong>{file.name}</strong>
                  <small>
                    {bytes(file.size)} · {date(file.createdAt)}
                  </small>
                </div>
                <a
                  className="ka-button secondary"
                  href={
                    file.downloadUrl ||
                    `/api/admin/project-files/${file.id}/download`
                  }
                >
                  <Download size={14} />
                  İndir
                </a>
                {canWrite && (
                  <button
                    type="button"
                    className="kp-icon-button"
                    aria-label={`${file.name} dosyasını sil`}
                    onClick={() => void removeFile(file)}
                    disabled={busy}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="kp-help">
            Bu başvuruda dosya bulunmuyor; müşteri yalnızca fiyat sorusu
            göndermiş olabilir.
          </p>
        )}
      </section>
      <section className="kp-pricing">
        <div className="kp-section-heading">
          <h3>
            Fiyat teklifleri <span>{offers.length}</span>
          </h3>
          {canWrite && !editing && (
            <button
              type="button"
              className="ka-button primary"
              onClick={() => {
                setEditing({ draft: freshDraft(request) });
                setNotice("");
              }}
            >
              <Plus size={15} />
              Yeni teklif hazırla
            </button>
          )}
        </div>
        {editing && canWrite && (
          <OfferEditor
            value={editing.draft}
            onChange={(draft) => setEditing({ ...editing, draft })}
            onSave={saveDraft}
            onCancel={() => setEditing(null)}
            editingId={editing.id}
            busy={busy}
          />
        )}
        {!loading && !offers.length && !editing && (
          <div className="kp-empty kp-pricing-empty">
            <Mail size={26} />
            <h4>Henüz teklif hazırlanmadı</h4>
            <p>
              {canWrite
                ? "Dosyaları inceleyip kalemleri ve fiyatları girerek bir taslak oluşturun."
                : "Paylaşılan teklifler burada görünür."}
            </p>
          </div>
        )}
        <div className="kp-offer-list">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              canWrite={canWrite}
              phoneRequested={!!request.phoneRequested && !!request.phone}
              busy={busy}
              onEdit={() => {
                setEditing({ id: offer.id, draft: copyDraft(offer) });
                setNotice("");
              }}
              onRevise={() => {
                setEditing({ draft: copyDraft(offer) });
                setNotice("");
              }}
              onPublish={() => void publish(offer)}
              onContact={(channel, note) => logContact(offer, channel, note)}
            />
          ))}
        </div>
      </section>
    </section>
  );
}

function OfferEditor({
  value,
  onChange,
  onSave,
  onCancel,
  editingId,
  busy,
}: {
  value: OfferDraft;
  onChange: (draft: OfferDraft) => void;
  onSave: (event: FormEvent) => void;
  onCancel: () => void;
  editingId?: string;
  busy: boolean;
}) {
  const changeItem = (index: number, patch: Partial<OfferItem>) =>
    onChange({
      ...value,
      items: value.items.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  return (
    <form
      className="kp-offer-editor"
      onSubmit={onSave}
      aria-label="Fiyat teklifi düzenleyici"
    >
      <div className="kp-editor-title">
        <div>
          <small>{editingId ? "KAYITLI TASLAK" : "YENİ TASLAK"}</small>
          <h4>Teklifin kapsamını ve kalemlerini yazın</h4>
        </div>
        <button
          type="button"
          className="kp-icon-button"
          aria-label="Teklif düzenleyiciyi kapat"
          onClick={onCancel}
          disabled={busy}
        >
          <X size={18} />
        </button>
      </div>
      <fieldset disabled={busy}>
        <div className="kp-editor-fields">
          <label className="ka-field">
            Teklif başlığı
            <input
              required
              maxLength={200}
              value={value.title}
              onChange={(event) =>
                onChange({ ...value, title: event.target.value })
              }
            />
          </label>
          <label className="ka-field">
            Para birimi
            <select
              value={value.currency}
              onChange={(event) =>
                onChange({
                  ...value,
                  currency: event.target.value as Offer["currency"],
                })
              }
            >
              <option value="TRY">Türk lirası · TRY</option>
              <option value="EUR">Euro · EUR</option>
              <option value="USD">ABD doları · USD</option>
            </select>
          </label>
        </div>
        <div className="kp-edit-items">
          {value.items.map((item, index) => (
            <div className="kp-edit-item" key={index}>
              <div className="kp-item-head">
                <strong>Kalem {index + 1}</strong>
                {value.items.length > 1 && (
                  <button
                    type="button"
                    className="kp-icon-button"
                    aria-label={`${index + 1}. kalemi kaldır`}
                    onClick={() =>
                      onChange({
                        ...value,
                        items: value.items.filter((_item, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <label className="ka-field">
                İş / malzeme açıklaması
                <input
                  required
                  maxLength={500}
                  value={item.description}
                  onChange={(event) =>
                    changeItem(index, { description: event.target.value })
                  }
                />
              </label>
              <div className="kp-item-numbers">
                <label className="ka-field">
                  Miktar
                  <input
                    type="number"
                    min="0.001"
                    max="10000"
                    step="0.001"
                    required
                    value={item.quantity}
                    onChange={(event) =>
                      changeItem(index, {
                        quantity: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="ka-field">
                  Birim
                  <input
                    required
                    maxLength={30}
                    value={item.unit}
                    onChange={(event) =>
                      changeItem(index, { unit: event.target.value })
                    }
                    placeholder="adet, m², metre"
                  />
                </label>
                <label className="ka-field">
                  Birim fiyat
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    step="0.01"
                    required
                    value={item.unitPrice}
                    onChange={(event) =>
                      changeItem(index, {
                        unitPrice: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="ka-button secondary"
          disabled={value.items.length >= 50}
          onClick={() =>
            onChange({
              ...value,
              items: [
                ...value.items,
                { description: "", quantity: 1, unit: "adet", unitPrice: 0 },
              ],
            })
          }
        >
          <Plus size={14} />
          Teklif kalemi ekle
        </button>
        <div className="kp-editor-fields kp-editor-terms">
          <label className="ka-field">
            KDV oranı (%)
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              required
              value={value.vatRate}
              onChange={(event) =>
                onChange({ ...value, vatRate: Number(event.target.value) })
              }
            />
          </label>
          <label className="ka-field">
            Geçerlilik tarihi
            <input
              type="date"
              required
              value={value.validUntil}
              onChange={(event) =>
                onChange({ ...value, validUntil: event.target.value })
              }
            />
          </label>
        </div>
        <label className="ka-field">
          Kapsam, teslim ve teklif notları
          <textarea
            rows={4}
            maxLength={5000}
            value={value.notes}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value })
            }
            placeholder="Dahil olan işler, hariç tutulanlar, ölçü/keşif koşulları, ödeme ve teslim bilgileri…"
          />
        </label>
        <p className="kp-help">
          Kalem tutarları ve KDV sunucuda hesaplanır. Taslak müşteriye görünmez;
          kaydettikten sonra PDF önizlemesini inceleyebilirsiniz.
        </p>
        <div className="kp-editor-actions">
          <button
            type="button"
            className="ka-button secondary"
            onClick={onCancel}
          >
            Vazgeç
          </button>
          <button type="submit" className="ka-button primary">
            {busy ? <Loader2 className="spin" size={15} /> : <Save size={15} />}
            Taslağı kaydet
          </button>
        </div>
      </fieldset>
    </form>
  );
}

function OfferCard({
  offer,
  canWrite,
  phoneRequested,
  busy,
  onEdit,
  onRevise,
  onPublish,
  onContact,
}: {
  offer: Offer;
  canWrite: boolean;
  phoneRequested: boolean;
  busy: boolean;
  onEdit: () => void;
  onRevise: () => void;
  onPublish: () => void;
  onContact: (channel: "email" | "phone", note: string) => Promise<void>;
}) {
  const [channel, setChannel] = useState<"email" | "phone">("email");
  const [note, setNote] = useState("");
  const [contactError, setContactError] = useState("");
  const published = offer.status === "published";
  async function saveContact(event: FormEvent) {
    event.preventDefault();
    setContactError("");
    try {
      await onContact(channel, note);
      setNote("");
    } catch (err) {
      setContactError(errorText(err));
    }
  }
  return (
    <article className={`kp-offer-card ${published ? "published" : "draft"}`}>
      <header>
        <div>
          <small>TEKLİF · SÜRÜM {offer.version}</small>
          <h4>{offer.title}</h4>
          <p>
            {published
              ? `Paylaşım: ${date(offer.publishedAt)}`
              : `Taslak: ${date(offer.updatedAt || offer.createdAt)}`}
          </p>
        </div>
        <span className="kp-offer-status">
          {published ? "Müşteriyle paylaşıldı" : "Özel taslak"}
        </span>
      </header>
      <div className="kp-offer-table-wrap">
        <table className="kp-offer-table">
          <thead>
            <tr>
              <th>İş / malzeme</th>
              <th>Miktar</th>
              <th>Birim fiyat</th>
              <th>Tutar</th>
            </tr>
          </thead>
          <tbody>
            {offer.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>
                  {item.quantity.toLocaleString("tr-TR")} {item.unit}
                </td>
                <td>
                  {money(
                    item.unitPriceMinor ?? Math.round(item.unitPrice * 100),
                    offer.currency,
                  )}
                </td>
                <td>{money(item.lineTotalMinor || 0, offer.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="kp-offer-totals">
        <div>
          <dt>Ara toplam</dt>
          <dd>{money(offer.subtotalMinor, offer.currency)}</dd>
        </div>
        <div>
          <dt>KDV · %{offer.vatRate}</dt>
          <dd>{money(offer.taxMinor, offer.currency)}</dd>
        </div>
        <div>
          <dt>Genel toplam</dt>
          <dd>{money(offer.totalMinor, offer.currency)}</dd>
        </div>
      </dl>
      <p className="kp-validity">
        Geçerlilik: <strong>{date(offer.validUntil)}</strong>
      </p>
      {offer.notes && <p className="kp-offer-notes">{offer.notes}</p>}
      <div className="kp-offer-actions">
        <a
          className="ka-button secondary"
          href={offer.pdfUrl || `/api/admin/offers/${offer.id}/pdf`}
        >
          <Download size={14} />
          {published ? "Teklif PDF" : "Taslak PDF önizle"}
        </a>
        {canWrite && !published && (
          <>
            <button
              type="button"
              className="ka-button secondary"
              disabled={busy}
              onClick={onEdit}
            >
              Taslağı düzenle
            </button>
            <button
              type="button"
              className="ka-button primary"
              disabled={busy}
              onClick={onPublish}
            >
              <Send size={14} />
              Müşteriyle paylaş
            </button>
          </>
        )}
        {canWrite && published && (
          <>
            <button
              type="button"
              className="ka-button secondary"
              disabled={busy}
              onClick={onRevise}
            >
              <Plus size={14} />
              Revizyon hazırla
            </button>
            <a
              className="ka-button secondary"
              href={offer.emlUrl || `/api/admin/offers/${offer.id}/email.eml`}
            >
              <Mail size={14} />
              E-posta taslağını indir
            </a>
          </>
        )}
      </div>
      {!published && canWrite && (
        <p className="kp-help">
          Paylaşınca teklif müşterinin hesabında görünür ve e-posta kuyruğuna
          eklenir. Paylaşılan sürüm değiştirilemez; sonraki değişiklikler için
          yeni revizyon hazırlayın.
        </p>
      )}
      {published && (
        <div className="kp-email-state">
          <Mail size={17} />
          <div>
            <strong>
              E-posta:{" "}
              {offer.emailDelivery
                ? deliveryLabels[offer.emailDelivery.status] ||
                  "Durum bekleniyor"
                : "Gönderim kaydı yok"}
            </strong>
            {offer.emailDelivery?.error && <p>{offer.emailDelivery.error}</p>}
            <p>
              Sağlayıcının kabulü, teslim veya okunma kanıtı değildir. İndirilen
              .eml bir taslaktır; kendi e-posta hesabınızdan ayrıca göndermeniz
              gerekir.
            </p>
          </div>
        </div>
      )}
      {published && canWrite && (
        <form className="kp-contact-log" onSubmit={saveContact}>
          <h5>Yaptığınız geri dönüşü kaydedin</h5>
          <p>
            E-posta göndermez veya arama başlatmaz; gerçekleştirdiğiniz
            görüşmenin kaydını tutar.
          </p>
          <div className="kp-contact-fields">
            <label className="ka-field">
              İletişim kanalı
              <select
                value={channel}
                onChange={(event) =>
                  setChannel(event.target.value as "email" | "phone")
                }
              >
                <option value="email">E-posta ile dönüldü</option>
                {phoneRequested && (
                  <option value="phone">Telefonla görüşüldü</option>
                )}
              </select>
            </label>
            <label className="ka-field">
              Görüşme notu
              <input
                required
                minLength={2}
                maxLength={2000}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Müşteriye iletilen bilgi veya görüşme sonucu"
              />
            </label>
            <button
              className="ka-button secondary"
              type="submit"
              disabled={busy}
            >
              İletişimi kaydet
            </button>
          </div>
          {!phoneRequested && (
            <small>Bu başvuruda telefonla aranma talebi yoktur.</small>
          )}
          {contactError && (
            <p role="alert" className="ka-alert error">
              {contactError}
            </p>
          )}
        </form>
      )}
      {!!offer.contacts?.length && (
        <ul className="kp-contact-history">
          {offer.contacts.map((contact) => (
            <li key={contact.id}>
              {contact.channel === "phone" ? (
                <Phone size={14} />
              ) : (
                <Mail size={14} />
              )}
              <div>
                <strong>
                  {contact.channel === "phone"
                    ? "Telefon görüşmesi"
                    : "E-posta geri dönüşü"}
                </strong>
                <p>{contact.note}</p>
                <small>
                  {date(contact.createdAt)}
                  {contact.actor ? ` · ${contact.actor}` : ""}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
