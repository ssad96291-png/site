import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  FolderUp,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { useSite } from "./site-context";
import "./ProjectRequest.css";

const maxFileBytes = 20 * 1024 * 1024;
const extensions = [
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
const pendingKey = "kilinc-project-request-pending";
type PendingRequest = { id: string; trackingToken?: string; createdAt: number };
type ProjectFile = {
  id: string;
  name: string;
  size: number;
  downloadUrl?: string;
};
type Identity = { name: string; email: string; phone?: string };
const size = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  const response = await fetch(path, {
    ...options,
    headers,
    credentials: "same-origin",
  });
  const body = await response
    .json()
    .catch(() => ({ error: "Sunucudan beklenen yanıt alınamadı." }));
  if (!response.ok) throw new Error(body.error || "İşlem tamamlanamadı.");
  return body as T;
}
function savedPending(): PendingRequest | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(pendingKey) || "null");
    return value &&
      /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(value.id) &&
      Number.isFinite(value.createdAt) &&
      value.createdAt > 0 &&
      value.createdAt <= Date.now() + 60_000 &&
      Date.now() - value.createdAt < 48 * 60 * 60 * 1000
      ? {
          id: value.id,
          trackingToken: /^[a-f\d]{64}$/i.test(value.trackingToken || "")
            ? value.trackingToken
            : undefined,
          createdAt: value.createdAt,
        }
      : null;
  } catch {
    return null;
  }
}
function remember(value: PendingRequest | null) {
  try {
    if (value) sessionStorage.setItem(pendingKey, JSON.stringify(value));
    else sessionStorage.removeItem(pendingKey);
  } catch {
    /* The current form still works without browser storage. */
  }
}

export default function ProjectRequest() {
  const { content, t } = useSite();
  const [params] = useSearchParams();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    phoneRequested: false,
    requestType: "project",
    product: params.get("urun") || "",
    district: params.get("bolge") || "",
    dimensions: params.get("olcu") || "",
    message: params.get("mesaj") || "",
    consent: false,
    website: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [pending, setPending] = useState<PendingRequest | null>(savedPending);
  const [submittedFiles, setSubmittedFiles] = useState<ProjectFile[]>([]);
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState("");
  const [error, setError] = useState("");
  const inFlight = useRef(false),
    edited = useRef(false);
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let active = true;
    request<{ customer: Identity }>("/api/customer/me")
      .then(({ customer }) => {
        if (!active || !customer) return;
        setIdentity(customer);
        if (!edited.current)
          setForm((value) => ({
            ...value,
            name: customer.name || "",
            email: customer.email || "",
            phone: customer.phone || "",
          }));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (error) alert.current?.focus();
  }, [error]);
  function change<K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) {
    edited.current = true;
    setForm((current) => ({ ...current, [key]: value }));
  }
  function choose(incoming: FileList | File[] | null) {
    if (!incoming) return;
    setError("");
    const next = [...files];
    for (const file of Array.from(incoming)) {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "";
      if (!extensions.includes(extension)) {
        setError(
          t(
            `${file.name}: Bu dosya biçimi desteklenmiyor.`,
            `${file.name}: This file format is not supported.`,
          ),
        );
        return;
      }
      if (!file.size || file.size > maxFileBytes) {
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
    if (next.length > 3) {
      setError(
        t(
          "Bir talebe en fazla 3 dosya ekleyebilirsiniz.",
          "You can add up to 3 files to a request.",
        ),
      );
      return;
    }
    setFiles(next);
  }
  async function establishOwnership(value: PendingRequest) {
    const forgetConsumedClaim = () => {
      const claimed = { ...value, trackingToken: undefined };
      setPending(claimed);
      remember(claimed);
      try {
        sessionStorage.removeItem("kilinc-portal-claim");
      } catch {}
    };
    // Check first: the browser may already own this request after a previous retry.
    try {
      const current = await request<{ files: ProjectFile[] }>(
        `/api/customer/inquiries/${value.id}/project-files`,
      );
      forgetConsumedClaim();
      return current;
    } catch {
      /* A new guest still needs to claim their receipt. */
    }
    if (!value.trackingToken)
      throw new Error(
        t(
          "Takip oturumunuzu açmak için hesabınıza giriş yapıp bu talebe dönün.",
          "Sign in to your account to reopen this request.",
        ),
      );
    try {
      await request("/api/customer/claim", {
        method: "POST",
        body: JSON.stringify({ token: value.trackingToken }),
      });
    } catch (claimError) {
      // A response can be lost after the server has set the cookie. Do not create another request.
      try {
        const current = await request<{ files: ProjectFile[] }>(
          `/api/customer/inquiries/${value.id}/project-files`,
        );
        forgetConsumedClaim();
        return current;
      } catch {
        throw claimError;
      }
    }
    forgetConsumedClaim();
    return await request<{ files: ProjectFile[] }>(
      `/api/customer/inquiries/${value.id}/project-files`,
    );
  }
  async function finish(value: PendingRequest) {
    setPhase(
      t(
        "Güvenli takip oturumu açılıyor…",
        "Opening your secure tracking session…",
      ),
    );
    const current = await establishOwnership(value);
    let all = current.files || [];
    setSubmittedFiles(all);
    // A previous response can be lost after the server stores the files. This
    // pending form resumes the original submission rather than adding revisions.
    const remaining = files.filter(
      (file) =>
        !all.some(
          (saved) => saved.name === file.name && saved.size === file.size,
        ),
    );
    if (remaining.length !== files.length) setFiles(remaining);
    if (remaining.length) {
      if (all.length + remaining.length > 3)
        throw new Error(
          t(
            "Bu talepteki mevcut dosyalarla birlikte en fazla 3 dosya olabilir. Dosyalarınızı müşteri panelinden kontrol edin.",
            "A request can contain up to 3 files in total. Review existing files in your account.",
          ),
        );
      setPhase(
        t("Proje dosyaları yükleniyor…", "Uploading your project files…"),
      );
      const body = new FormData();
      for (const file of remaining) body.append("files", file);
      try {
        const result = await request<{ files: ProjectFile[] }>(
          `/api/customer/inquiries/${value.id}/project-files`,
          { method: "POST", body },
        );
        all = result.files || [];
        setFiles([]);
      } catch (uploadError) {
        try {
          const verified = await request<{ files: ProjectFile[] }>(
            `/api/customer/inquiries/${value.id}/project-files`,
          );
          setSubmittedFiles(verified.files || []);
          setFiles(
            remaining.filter(
              (file) =>
                !(verified.files || []).some(
                  (saved) =>
                    saved.name === file.name && saved.size === file.size,
                ),
            ),
          );
        } catch {
          /* Keep the same request and local selections for a later retry. */
        }
        throw uploadError;
      }
    }
    setSubmittedFiles(all);
    setFiles([]);
    setComplete(true);
    remember(null);
  }
  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    let value = pending;
    try {
      if (!value) {
        setPhase(t("Talebiniz kaydediliyor…", "Saving your request…"));
        const result = await request<{
          id: string;
          trackingToken?: string;
          trackingUrl?: string;
        }>("/api/project-requests", {
          method: "POST",
          body: JSON.stringify(form),
        });
        if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(result.id))
          throw new Error(
            t(
              "Başvurunuz işlenemedi. Sayfayı yenileyip yeniden deneyin.",
              "Your enquiry could not be processed. Refresh the page and try again.",
            ),
          );
        value = {
          id: result.id,
          trackingToken: result.trackingToken,
          createdAt: Date.now(),
        };
        setPending(value);
        remember(value);
        window.dispatchEvent(new Event("kilinc-inquiry-submitted"));
      }
      await finish(value);
    } catch (err) {
      setError(
        (value
          ? t(
              "Talebiniz kaydedildi. Dosya veya takip adımı tamamlanamadı: ",
              "Your request was saved. The file or tracking step could not be completed: ",
            )
          : "") + (err as Error).message,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
      setPhase("");
    }
  }
  const fileChooser = (
    <div className="pr-file-area">
      <label
        className="pr-dropzone"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          if (!busy) choose(event.dataTransfer.files);
        }}
      >
        <FolderUp size={30} aria-hidden="true" />
        <strong>
          {t(
            "Çizim veya proje dosyanızı ekleyin",
            "Add your drawing or project files",
          )}
        </strong>
        <span>
          {t(
            "Dosya seçin veya bu alana bırakın",
            "Choose files or drop them here",
          )}
        </span>
        <input
          type="file"
          multiple
          accept={extensions.map((extension) => "." + extension).join(",")}
          disabled={busy}
          onChange={(event) => {
            choose(event.target.files);
            event.target.value = "";
          }}
          aria-label={t("Proje dosyaları seç", "Choose project files")}
        />
      </label>
      <p className="pr-file-help">
        PDF, JPG, PNG, WebP, DWG, DXF, IFC, STEP / STP ·{" "}
        {t("En fazla 3 dosya, dosya başına 20 MB", "Up to 3 files, 20 MB each")}
      </p>
      {files.length > 0 && (
        <ul className="pr-selected-files">
          {files.map((file, index) => (
            <li key={`${file.name}-${file.lastModified}-${file.size}`}>
              <FileText size={18} />
              <span>
                <strong>{file.name}</strong>
                <small>{size(file.size)}</small>
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  setFiles((current) => current.filter((_, i) => i !== index))
                }
                aria-label={`${file.name} ${t("dosyasını kaldır", "remove file")}`}
              >
                <Trash2 size={17} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <small className="pr-privacy-note">
        <ShieldCheck size={16} />
        {t(
          "Dosyalarınız herkese açık galeride yayımlanmaz. Yalnızca talebinize yetkili kişiler erişebilir. Paylaşma yetkiniz olan dosyaları yükleyin.",
          "Your files are not published in the public gallery. Only people authorised for your request can access them. Upload files you are permitted to share.",
        )}
      </small>
    </div>
  );
  return (
    <div className="pr-page">
      <section className="pr-heading rs-container">
        <span>{t("PROJE & FİYAT TALEBİ", "PROJECT & PRICE ENQUIRY")}</span>
        <h1>
          {t(
            "Projenizi paylaşın.\nTeklifinizi birlikte netleştirelim.",
            "Share your project.\nLet’s define your proposal together.",
          )}
        </h1>
        <p>
          {t(
            "Fiyat sorunuzu yazın, isterseniz çiziminizi veya projenizi ekleyin. İnceledikten sonra teklifimizi hesabınızda paylaşabilir, e-posta ve seçtiyseniz telefonla sizinle görüşebiliriz.",
            "Send a pricing question and, if useful, your drawings or project files. After reviewing them, we can share a proposal in your account and contact you by email or by phone if requested.",
          )}
        </p>
        <ol className="pr-steps">
          <li>
            <span>01</span>
            {t("İhtiyacınızı anlatın", "Describe what you need")}
          </li>
          <li>
            <span>02</span>
            {t("Dosyanızı paylaşın", "Share your files")}
          </li>
          <li>
            <span>03</span>
            {t("Teklifinizi takip edin", "Track your proposal")}
          </li>
        </ol>
      </section>
      <section className="pr-layout rs-container">
        <aside className="pr-aside">
          <h2>
            {t(
              "Bir başlangıç için ölçülerinizin kesin olması gerekmiyor.",
              "Your dimensions do not have to be final to get started.",
            )}
          </h2>
          <p>
            {t(
              "Uygulama alanı, yaklaşık ölçüler ve beklentiniz ilk değerlendirmeyi kolaylaştırır. Kesin kapsam ve fiyat, teknik inceleme ve gerektiğinde yerinde keşifle netleşir.",
              "The location, approximate dimensions and your expectations help with the first assessment. Scope and pricing are confirmed after technical review and a site visit when needed.",
            )}
          </p>
          <div>
            <Mail size={22} />
            <h3>{t("Üyeliksiz başvuru", "Enquire without registering")}</h3>
            <p>
              {t(
                "Hesabınız olmasa da talep gönderebilirsiniz. E-posta adresinizi paylaşın; isterseniz talebinizi takip etmek için daha sonra hesap oluşturun.",
                "You can submit a request without an account. Provide your email and create an account later if you wish to track your request.",
              )}
            </p>
          </div>
          <div>
            <Phone size={22} />
            <h3>{t("İletişim tercihi sizde", "Choose how we contact you")}</h3>
            <p>
              {t(
                "Telefonla aranmak isterseniz kutuyu işaretleyip numaranızı yazın. E-posta ve telefon bilgileri talebinize dönüş için kullanılır.",
                "Tick the call-back box and enter your number if you would like a phone call. Contact details are used to respond to your enquiry.",
              )}
            </p>
          </div>
        </aside>
        <div className="pr-card">
          {error && (
            <div className="pr-alert" role="alert" ref={alert} tabIndex={-1}>
              {error}
            </div>
          )}
          {complete && pending ? (
            <div className="pr-success" role="status">
              <CheckCircle2 size={42} />
              <span>{t("TALEP ALINDI", "REQUEST RECEIVED")}</span>
              <h2>
                {t("Projeniz bize ulaştı.", "We have received your project.")}
              </h2>
              <p>
                {t(
                  "İnceleme sonrası hazırlanan teklifinizi talep panelinizden görüntüleyebilirsiniz. İletişim tercihiniz talebinizle birlikte kaydedildi.",
                  "After our review, you can view the proposal in your request panel. Your contact preferences were saved with your enquiry.",
                )}
              </p>
              <code>#{pending.id.slice(0, 8).toUpperCase()}</code>
              {submittedFiles.length > 0 && (
                <ul>
                  {submittedFiles.map((file) => (
                    <li key={file.id}>
                      <Check size={16} />
                      {file.name}
                      <small>{size(file.size)}</small>
                    </li>
                  ))}
                </ul>
              )}
              <Link className="pr-primary" to="/hesabim">
                {t(
                  "Talebimi ve tekliflerimi takip et",
                  "Track my request and proposals",
                )}
                <ArrowRight size={18} />
              </Link>
              <p className="pr-fine">
                {t(
                  "Hesap açmak zorunlu değildir. Panelinizden isterseniz şifre belirleyip daha sonra yeniden giriş yapabilirsiniz.",
                  "Creating an account is optional. You can set a password in your panel if you would like to sign in again later.",
                )}
              </p>
            </div>
          ) : pending ? (
            <div className="pr-pending">
              <FileText size={35} />
              <h2>
                {t(
                  "Talebiniz kayıtlı; dosya adımından devam edin.",
                  "Your request is saved; continue with your files.",
                )}
              </h2>
              <p>
                {t(
                  "Yeniden başvuru göndermenize gerek yok. Sayfayı yenilediyseniz aktarılacak dosyaları tekrar seçin; aynı talebe eklenecekler.",
                  "There is no need to submit another enquiry. If you refreshed this page, select your files again to attach them to the same request.",
                )}
              </p>
              <code>#{pending.id.slice(0, 8).toUpperCase()}</code>
              {submittedFiles.length > 0 && (
                <div className="pr-existing-files">
                  <strong>
                    {t(
                      "Talebinizde kayıtlı dosyalar",
                      "Files already saved with your request",
                    )}
                  </strong>
                  <ul>
                    {submittedFiles.map((file) => (
                      <li key={file.id}>
                        <Check size={15} />
                        {file.name}
                        <small>{size(file.size)}</small>
                      </li>
                    ))}
                  </ul>
                  <p>
                    {t(
                      "Bu dosyalar yeniden yüklenmez. Aynı talebi aşağıdaki düğmeden tamamlayabilirsiniz.",
                      "These files will not be uploaded again. Complete the same request using the button below.",
                    )}
                  </p>
                </div>
              )}
              {fileChooser}
              <button
                className="pr-primary"
                type="button"
                disabled={busy}
                onClick={() => void submit()}
              >
                {busy ? (
                  <Loader2 className="pr-spin" size={18} />
                ) : (
                  <Upload size={18} />
                )}
                {busy
                  ? phase
                  : t(
                      "Takip ve dosya adımını tamamla",
                      "Complete tracking and file upload",
                    )}
              </button>
              <Link className="pr-text-link" to="/hesabim">
                {t("Talep panelini aç", "Open the request panel")}
              </Link>
            </div>
          ) : (
            <form className="pr-form inquiry-form" onSubmit={submit}>
              <div className="pr-form-title">
                <h2>
                  {t("Size nasıl yardımcı olabiliriz?", "How can we help?")}
                </h2>
                {identity && (
                  <small>
                    {t("Giriş yapılan hesap", "Signed-in account")}:{" "}
                    {identity.email}
                  </small>
                )}
              </div>
              <fieldset className="pr-type-options">
                <legend>{t("Talep türü", "Request type")}</legend>
                <label>
                  <input
                    type="radio"
                    name="requestType"
                    value="price"
                    checked={form.requestType === "price"}
                    onChange={() => change("requestType", "price")}
                  />
                  <span>{t("Fiyat sorusu", "Pricing question")}</span>
                </label>
                <label>
                  <input
                    type="radio"
                    name="requestType"
                    value="project"
                    checked={form.requestType === "project"}
                    onChange={() => change("requestType", "project")}
                  />
                  <span>
                    {t(
                      "Çizim / proje üzerinden teklif",
                      "Proposal based on a drawing or project",
                    )}
                  </span>
                </label>
              </fieldset>
              <div className="pr-fields">
                <label>
                  {t("Adınız soyadınız", "Full name")} *
                  <input
                    name="name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(event) => change("name", event.target.value)}
                    required
                    minLength={2}
                    maxLength={100}
                  />
                </label>
                <label>
                  {t("E-posta adresiniz", "Email address")} *
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(event) => change("email", event.target.value)}
                    required
                    maxLength={254}
                  />
                </label>
                <label>
                  {t("İlgilendiğiniz hizmet", "Service of interest")}
                  <select
                    name="product"
                    value={form.product}
                    onChange={(event) => change("product", event.target.value)}
                  >
                    <option value="">
                      {t(
                        "Birlikte değerlendirelim",
                        "Let’s assess it together",
                      )}
                    </option>
                    {content
                      .filter((item) => item.type === "product")
                      .map((item) => (
                        <option key={item.id} value={item.title}>
                          {item.title}
                        </option>
                      ))}
                    {form.product &&
                      !content.some((item) => item.title === form.product) && (
                        <option value={form.product}>{form.product}</option>
                      )}
                  </select>
                </label>
                <label>
                  {t("Uygulama bölgesi / ilçe", "Project area / district")}
                  <input
                    name="district"
                    value={form.district}
                    onChange={(event) => change("district", event.target.value)}
                    maxLength={100}
                  />
                </label>
                <label className="pr-full">
                  {t("Yaklaşık ölçüler", "Approximate dimensions")}
                  <input
                    name="dimensions"
                    value={form.dimensions}
                    onChange={(event) =>
                      change("dimensions", event.target.value)
                    }
                    maxLength={200}
                    placeholder={t(
                      "Örn. 4 m genişlik × 2,5 m yükseklik",
                      "e.g. 4 m wide × 2.5 m high",
                    )}
                  />
                </label>
                <label className="pr-full">
                  {t(
                    "Fiyat sorunuzu veya projenizi anlatın",
                    "Describe your project or pricing question",
                  )}{" "}
                  *
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={(event) => change("message", event.target.value)}
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={5}
                  />
                </label>
              </div>
              <div className="pr-contact-preference">
                <label className="pr-checkbox">
                  <input
                    name="phoneRequested"
                    type="checkbox"
                    checked={form.phoneRequested}
                    onChange={(event) =>
                      change("phoneRequested", event.target.checked)
                    }
                  />
                  <span>
                    {t(
                      "Telefonla aranmak istiyorum",
                      "I would like a phone call",
                    )}
                  </span>
                </label>
                <label>
                  {t("Telefon numaranız", "Phone number")}
                  {form.phoneRequested
                    ? " *"
                    : ` (${t("isteğe bağlı", "optional")})`}
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={(event) => change("phone", event.target.value)}
                    required={form.phoneRequested}
                    minLength={form.phoneRequested ? 7 : undefined}
                    maxLength={50}
                    placeholder="05XX XXX XX XX"
                  />
                </label>
              </div>
              {fileChooser}
              <label className="pr-honeypot" aria-hidden="true">
                Website
                <input
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => change("website", event.target.value)}
                />
              </label>
              <label className="pr-checkbox pr-consent">
                <input
                  name="consent"
                  type="checkbox"
                  checked={form.consent}
                  onChange={(event) => change("consent", event.target.checked)}
                  required
                />
                <span>
                  {t(
                    "Talebimin değerlendirilmesi ve yanıtlanması için bilgilerimin işlenmesini kabul ediyorum.",
                    "I agree to the processing of my information to assess and respond to this request.",
                  )}{" "}
                  <Link to="/kurumsal/kvkk" target="_blank" rel="noreferrer">
                    {t("Aydınlatma metni", "Privacy notice")}
                  </Link>
                </span>
              </label>
              <button className="pr-primary" type="submit" disabled={busy}>
                {busy ? (
                  <Loader2 className="pr-spin" size={18} />
                ) : (
                  <ArrowRight size={18} />
                )}
                {busy ? phase : t("Talebimi gönder", "Send my request")}
              </button>
              <small className="pr-fine">
                {t(
                  "Başvuru bir sipariş, ödeme veya kesin fiyat işlemi oluşturmaz. Dosya eklemek isteğe bağlıdır.",
                  "Submitting this enquiry does not place an order, process a payment or establish a final price. Files are optional.",
                )}
              </small>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
