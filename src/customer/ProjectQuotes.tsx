import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Download,
  FileText,
  FolderUp,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useSite } from "../site-context";
import "./project-quotes.css";

type ProjectFile = {
  id: string;
  name: string;
  size: number;
  extension?: string;
  createdAt?: string;
  downloadUrl: string;
};
type Project = {
  requestType: "price" | "project";
  phoneRequested: boolean;
  replyEmail: string;
};
type Offer = {
  id: string;
  version: number;
  status: string;
  title: string;
  currency: "TRY" | "EUR" | "USD";
  items: {
    description: string;
    quantity: number;
    unit: string;
    unitPriceMinor: number;
    lineTotalMinor: number;
  }[];
  vatRate: number;
  subtotalMinor: number;
  taxMinor: number;
  totalMinor: number;
  validUntil: string;
  notes: string;
  publishedAt: string | null;
  pdfUrl?: string;
};
type FilesResponse = {
  project: Project | null;
  files: ProjectFile[];
  limits?: { maxFiles: number; maxFileBytes: number; extensions: string[] };
};
class RequestError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    credentials: "same-origin",
    headers: { Accept: "application/json", ...options.headers },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "Sunucudan beklenen yanıt alınamadı." }));
  if (!response.ok)
    throw new RequestError(
      data.error || "İşlem tamamlanamadı.",
      response.status,
    );
  return data as T;
}
const formats = [
  "pdf",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "dwg",
  "dxf",
  "ifc",
  "step",
  "stp",
];
const fileSize = (value: number) =>
  value >= 1024 * 1024
    ? `${(value / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(value / 1024))} KB`;

export default function ProjectQuotes({
  inquiryId,
  onRequestRevision,
}: {
  inquiryId: string;
  onRequestRevision: (reference: string) => void;
}) {
  const { en, t } = useSite();
  const [data, setData] = useState<FilesResponse | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [selection, setSelection] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mounted = useRef(true);
  const fileInput = useRef<HTMLInputElement>(null);
  const load = useCallback(async () => {
    try {
      const [files, proposals] = await Promise.all([
        request<FilesResponse>(
          `/api/customer/inquiries/${inquiryId}/project-files`,
        ),
        request<{ offers: Offer[] }>(
          `/api/customer/inquiries/${inquiryId}/offers`,
        ),
      ]);
      if (!mounted.current) return;
      setData(files);
      setOffers(
        proposals.offers.filter((offer) => offer.status === "published"),
      );
      setError("");
    } catch (err) {
      if (!mounted.current) return;
      if (err instanceof RequestError && [401, 403, 404].includes(err.status)) {
        setData(null);
        setOffers([]);
      }
      setError((err as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [inquiryId]);
  useEffect(() => {
    mounted.current = true;
    void load();
    const interval = window.setInterval(() => {
      if (!document.hidden) void load();
    }, 30_000);
    return () => {
      mounted.current = false;
      window.clearInterval(interval);
    };
  }, [load]);
  const limit = data?.limits?.maxFiles || 3;
  const bytes = data?.limits?.maxFileBytes || 20 * 1024 * 1024;
  const published = offers.length > 0;
  function choose(files: FileList | null) {
    if (!files || busy) return;
    setError("");
    setNotice("");
    const next = [...selection];
    for (const file of Array.from(files)) {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "";
      if (!formats.includes(extension)) {
        setError(
          t(
            "Desteklenmeyen dosya biçimi. PDF, görsel veya desteklenen CAD dosyası seçin.",
            "Unsupported format. Choose a PDF, image or supported CAD file.",
          ),
        );
        return;
      }
      if (!file.size || file.size > bytes) {
        setError(
          t(
            "Her dosya boş olmamalı ve en fazla 20 MB olmalıdır.",
            "Each file must be non-empty and no larger than 20 MB.",
          ),
        );
        return;
      }
      if (
        !next.some(
          (item) =>
            item.name === file.name &&
            item.size === file.size &&
            item.lastModified === file.lastModified,
        )
      )
        next.push(file);
    }
    if (next.length + (data?.files.length || 0) > limit) {
      setError(
        t(
          `Talebinizde toplam en fazla ${limit} dosya bulunabilir.`,
          `A request can contain up to ${limit} files in total.`,
        ),
      );
      return;
    }
    setSelection(next);
  }
  async function upload() {
    if (!selection.length || busy) return;
    const knownFiles = new Set((data?.files || []).map((file) => file.id));
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const body = new FormData();
      selection.forEach((file) => body.append("files", file));
      const response = await request<FilesResponse>(
        `/api/customer/inquiries/${inquiryId}/project-files`,
        { method: "POST", body },
      );
      setData(response);
      setSelection([]);
      if (fileInput.current) fileInput.current.value = "";
      setNotice(
        t(
          "Dosyalarınız talebinize eklendi.",
          "Your files were added to the request.",
        ),
      );
    } catch (err) {
      // A lost response can follow a successful write. Match only newly stored
      // records, so existing files with the same name do not hide validation errors.
      try {
        const verified = await request<FilesResponse>(
          `/api/customer/inquiries/${inquiryId}/project-files`,
        );
        setData(verified);
        const stored = verified.files.filter(
          (file) => !knownFiles.has(file.id),
        );
        const remaining = selection.filter(
          (file) =>
            !stored.some(
              (saved) => saved.name === file.name && saved.size === file.size,
            ),
        );
        setSelection(remaining);
        if (!remaining.length && stored.length) {
          setNotice(
            t(
              "Dosyalarınızın talebinize kaydedildiği doğrulandı.",
              "Your files have been confirmed as saved with your request.",
            ),
          );
          return;
        }
      } catch (verificationError) {
        if (
          verificationError instanceof RequestError &&
          [401, 403, 404].includes(verificationError.status)
        ) {
          setData(null);
          setOffers([]);
        }
      }
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(file: ProjectFile) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await request(`/api/customer/project-files/${file.id}`, {
        method: "DELETE",
      });
      setData((current) =>
        current
          ? {
              ...current,
              files: current.files.filter((item) => item.id !== file.id),
            }
          : current,
      );
      setNotice(
        t(
          "Dosya talebinizden kaldırıldı.",
          "The file was removed from your request.",
        ),
      );
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const money = (minor: number, currency: Offer["currency"]) =>
    new Intl.NumberFormat(en ? "en-GB" : "tr-TR", {
      style: "currency",
      currency,
    }).format(minor / 100);
  const date = (value: string | null, dateOnly = false) =>
    value
      ? new Date(dateOnly ? `${value}T12:00:00` : value).toLocaleDateString(
          en ? "en-GB" : "tr-TR",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : "—";
  return (
    <div className="cpq-area">
      <div className="cpq-heading">
        <div>
          <h3>
            {t(
              "Proje dosyaları ve teklifleriniz",
              "Your project files and proposals",
            )}
          </h3>
          <p>
            {t(
              "Yalnızca bu talebinize ait dosyalar ve sizinle paylaşılan teklifler gösterilir.",
              "Only files and proposals belonging to this request are shown.",
            )}
          </p>
        </div>
        <button
          type="button"
          className="cpq-button light"
          disabled={busy || loading}
          onClick={() => void load()}
          aria-label={t(
            "Dosya ve tekliflerimi yenile",
            "Refresh my files and proposals",
          )}
        >
          <RefreshCw size={16} />
        </button>
      </div>
      {loading && (
        <p className="cpq-loading">
          <Loader2 size={18} className="cpq-spin" />
          {t("Dosya ve teklifler yükleniyor…", "Loading files and proposals…")}
        </p>
      )}
      {error && (
        <p className="cpq-alert" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="cpq-notice" role="status">
          {notice}
        </p>
      )}
      {!loading && data && (
        <>
          <section
            className="cpq-files"
            aria-label={t(
              "Gönderdiğim proje dosyaları",
              "My submitted project files",
            )}
          >
            <div className="cpq-section-heading">
              <h4>{t("Gönderdiğiniz dosyalar", "Your submitted files")}</h4>
              <span>
                {data.files.length} / {limit}
              </span>
            </div>
            {data.files.length ? (
              <ul>
                {data.files.map((file) => (
                  <li key={file.id}>
                    <FileText size={20} />
                    <div>
                      <a href={file.downloadUrl} download>
                        {file.name}
                        <Download size={14} />
                      </a>
                      <small>
                        {fileSize(file.size)}
                        {file.createdAt ? ` · ${date(file.createdAt)}` : ""}
                      </small>
                    </div>
                    {!published && (
                      <button
                        className="cpq-button light danger"
                        type="button"
                        disabled={busy}
                        onClick={() => void remove(file)}
                        aria-label={`${file.name} ${t("dosyasını sil", "delete file")}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="cpq-empty">
                {t(
                  "Bu talebe henüz proje dosyası eklenmedi.",
                  "No project files have been added to this request yet.",
                )}
              </p>
            )}
            {data.project ? (
              published ? (
                <p className="cpq-help">
                  <ShieldCheck size={16} />
                  {t(
                    "Yayımlanan teklifin dayanağı olan dosyalar korunur. Yeni çizim veya değişiklik için mesaj alanından revize talebi gönderebilirsiniz.",
                    "Files supporting the issued proposal are preserved. Use messages to request a revision or share a change.",
                  )}
                </p>
              ) : (
                data.files.length < limit && (
                  <div className="cpq-upload">
                    <label>
                      <FolderUp size={21} />
                      <span>
                        {t(
                          "Ek çizim / proje dosyası seç",
                          "Choose another drawing or project file",
                        )}
                      </span>
                      <input
                        ref={fileInput}
                        type="file"
                        multiple
                        disabled={busy}
                        accept={formats
                          .map((extension) => `.${extension}`)
                          .join(",")}
                        onChange={(event) => {
                          choose(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                    <p>
                      PDF, JPG, PNG, WebP, DWG, DXF, IFC, STEP / STP ·{" "}
                      {t(
                        "Dosya başına en fazla 20 MB, toplam 3 dosya.",
                        "20 MB per file, 3 files in total.",
                      )}
                    </p>
                    {selection.length > 0 && (
                      <>
                        <ul className="cpq-selected">
                          {selection.map((file, index) => (
                            <li key={`${file.name}-${file.lastModified}`}>
                              <span>
                                {file.name} · {fileSize(file.size)}
                              </span>
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  setSelection((current) =>
                                    current.filter((_, i) => i !== index),
                                  )
                                }
                                aria-label={`${file.name} ${t("seçimini kaldır", "remove selection")}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </li>
                          ))}
                        </ul>
                        <button
                          className="cpq-button"
                          disabled={busy}
                          type="button"
                          onClick={() => void upload()}
                        >
                          {busy ? (
                            <Loader2 className="cpq-spin" size={16} />
                          ) : (
                            <Plus size={16} />
                          )}
                          {t(
                            "Dosyaları talebime ekle",
                            "Add files to my request",
                          )}
                        </button>
                      </>
                    )}
                  </div>
                )
              )
            ) : (
              <p className="cpq-help">
                {t(
                  "Çizimlerinize göre ayrı bir fiyat talebi oluşturmak için proje alanını kullanabilirsiniz.",
                  "Use the project enquiry area to request a proposal based on your drawings.",
                )}{" "}
                <Link to="/proje-teklif">
                  {t(
                    "Proje / fiyat talebi oluştur",
                    "Create a project / pricing enquiry",
                  )}
                </Link>
              </p>
            )}
          </section>
          <section
            className="cpq-proposals"
            aria-label={t(
              "Paylaşılan fiyat tekliflerim",
              "My issued pricing proposals",
            )}
          >
            <div className="cpq-section-heading">
              <h4>{t("Fiyat teklifleriniz", "Your pricing proposals")}</h4>
              <span>{offers.length}</span>
            </div>
            {!offers.length && (
              <div className="cpq-waiting">
                <FileText size={28} />
                <h4>
                  {t(
                    "Teklifiniz henüz paylaşılmadı",
                    "Your proposal has not been issued yet",
                  )}
                </h4>
                <p>
                  {t(
                    "Talebiniz değerlendirilip teklif hazırlandığında tutar, iş kalemleri ve PDF belgesi burada yer alır. Taslaklar müşteriye gösterilmez.",
                    "Once your request has been reviewed, the price, itemised scope and PDF proposal will appear here. Drafts are not shown to customers.",
                  )}
                </p>
              </div>
            )}
            {offers.map((offer) => (
              <article className="cpq-offer" key={offer.id}>
                <header>
                  <div>
                    <small>
                      {t("TEKLİF", "PROPOSAL")} #
                      {offer.id.slice(0, 8).toUpperCase()} ·{" "}
                      {t("Sürüm", "Version")} {offer.version}
                    </small>
                    <h4>{offer.title}</h4>
                    <p>
                      {t("Paylaşıldı", "Issued")}: {date(offer.publishedAt)} ·{" "}
                      {t("Geçerlilik", "Valid until")}:{" "}
                      {date(offer.validUntil, true)}
                    </p>
                  </div>
                  <span className="cpq-ready">
                    {t("Teklif hazır", "Proposal ready")}
                  </span>
                </header>
                <div className="cpq-table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>{t("İş kalemi", "Item")}</th>
                        <th>{t("Miktar", "Quantity")}</th>
                        <th>{t("Birim fiyat", "Unit price")}</th>
                        <th>{t("Tutar", "Amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offer.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>
                            {new Intl.NumberFormat(en ? "en-GB" : "tr-TR", {
                              maximumFractionDigits: 3,
                            }).format(item.quantity)}{" "}
                            {item.unit}
                          </td>
                          <td>{money(item.unitPriceMinor, offer.currency)}</td>
                          <td>{money(item.lineTotalMinor, offer.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <dl className="cpq-totals">
                  <div>
                    <dt>{t("Ara toplam", "Subtotal")}</dt>
                    <dd>{money(offer.subtotalMinor, offer.currency)}</dd>
                  </div>
                  <div>
                    <dt>KDV / VAT %{offer.vatRate}</dt>
                    <dd>{money(offer.taxMinor, offer.currency)}</dd>
                  </div>
                  <div className="cpq-total">
                    <dt>{t("Genel toplam", "Total")}</dt>
                    <dd>{money(offer.totalMinor, offer.currency)}</dd>
                  </div>
                </dl>
                {offer.notes && (
                  <div className="cpq-notes">
                    <strong>
                      {t("Kapsam ve koşullar", "Scope and terms")}
                    </strong>
                    <p>{offer.notes}</p>
                  </div>
                )}
                <footer>
                  <a
                    className="cpq-button"
                    href={
                      offer.pdfUrl || `/api/customer/offers/${offer.id}/pdf`
                    }
                    download
                  >
                    <Download size={16} />
                    {t("Teklif PDF’ini indir", "Download proposal PDF")}
                  </a>
                  <button
                    className="cpq-button light"
                    type="button"
                    onClick={() =>
                      onRequestRevision(offer.id.slice(0, 8).toUpperCase())
                    }
                  >
                    {t("Bu teklif için revize iste", "Request a revision")}
                  </button>
                </footer>
                <p className="cpq-fine">
                  {t(
                    "Bu alan teklif bilgilendirmesi içindir; sipariş veya ödeme işlemi oluşturmaz.",
                    "This area provides proposal information; it does not place an order or process a payment.",
                  )}
                </p>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
