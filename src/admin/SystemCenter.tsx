import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Database,
  Download,
  FileKey2,
  FolderArchive,
  HardDrive,
  Info,
  Loader2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import "./system-center.css";

interface SystemStatus {
  database: {
    enabled: boolean;
    algorithm: string;
    formatVersion: number;
    keySource: string;
    keyFingerprint: string;
    databaseFile: string;
    maxSnapshotBytes: number;
    singleProcess: boolean;
  };
  scanner: {
    mode: "required" | "limited";
    configured: boolean;
    engine: "clamav" | "builtin";
    available?: boolean;
    message: string;
  };
  storage: {
    databaseBytes: number;
    publicBytes: number;
    privateBytes: number;
    fileCount: number;
  };
  counts: Record<string, number>;
  securityEvents: {
    id: string;
    action: string;
    route: string;
    status: number;
    createdAt: string;
  }[];
  backup: {
    format: "kilinc-backup-v1";
    maxBytes: number;
    lastExportAt?: string;
  };
  generatedAt: string;
}

const bytes = (value: number | undefined) => {
  if (value === undefined || !Number.isFinite(value)) return "—";
  if (value < 1024) return `${value.toLocaleString("tr-TR")} B`;
  if (value < 1024 * 1024)
    return `${(value / 1024).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} KiB`;
  return `${(value / (1024 * 1024)).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} MiB`;
};
const date = (value?: string) => {
  if (!value) return "Henüz kayıt yok";
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? "—"
    : parsed.toLocaleString("tr-TR", {
        timeZone: "Europe/Istanbul",
        dateStyle: "medium",
        timeStyle: "short",
      });
};
const countLabels: Record<string, string> = {
  customers: "Müşteri hesabı",
  portal_customers: "Müşteri / misafir kaydı",
  inquiries: "Talep",
  supportTickets: "Destek kaydı",
  support_tickets: "Destek kaydı",
  supportMessages: "Destek mesajı",
  support_messages: "Destek mesajı",
  content: "Site içeriği",
  offers: "Teklif sürümü",
  portal_offers: "Teklif sürümü",
  projectFiles: "Proje dosyası",
  project_files: "Proje dosyası",
  documents: "Müşteri belgesi",
  portal_documents: "Müşteri belgesi",
  audit: "İşlem kaydı",
  securityEvents: "Güvenlik olayı",
  security_events: "Güvenlik olayı",
  staff: "Personel",
  portal_staff: "Personel",
  messages: "Talep mesajı",
  sessions: "Oturum kaydı",
  notifications: "Bildirim",
  portal_notifications: "Bildirim",
  media_rights: "Görsel izin kaydı",
  portal_activity: "Müşteri işlem kaydı",
  portal_dealers: "Teknik irtibat",
  portal_inquiries: "Talep süreç kaydı",
  portal_outbox: "Dış mesaj kuyruğu",
  portal_sessions: "Müşteri / takip oturumu",
  portal_staff_sessions: "Personel oturumu",
  portal_tokens: "Süreli erişim kaydı",
  project_requests: "Proje başvurusu",
  rate_limits: "İstek sınırı kaydı",
  schema_migrations: "Veri şeması geçişi",
  settings: "Site ayarları",
  telemetry_events: "İzinli ziyaretçi olayı",
  telemetry_sessions: "İzinli ziyaretçi oturumu",
  users: "Yönetici hesabı",
};
const keySourceLabels: Record<string, string> = {
  environment: "Sunucu ortam değişkeni",
  "secret-file": "Güvenli anahtar dosyası",
  "local-key-file": "Veri klasörü dışındaki yerel anahtar dosyası",
};
const actionLabels: Record<string, string> = {
  login_failed: "Başarısız giriş",
  LOGIN_FAILED: "Başarısız giriş",
  AUTH_FAILED: "Kimlik doğrulama reddedildi",
  rate_limited: "İstek sınırı uygulandı",
  RATE_LIMITED: "İstek sınırı uygulandı",
  upload_rejected: "Dosya yükleme reddedildi",
  UPLOAD_REJECTED: "Dosya yükleme reddedildi",
  MALWARE_DETECTED: "Zararlı dosya engellendi",
  SCANNER_UNAVAILABLE: "Dosya tarayıcısına ulaşılamadı",
  access_denied: "Erişim reddedildi",
  ACCESS_DENIED: "Erişim reddedildi",
  BACKUP_EXPORT: "Şifreli yedek indirildi",
  KEY_EXPORT: "Veri anahtarı dışa aktarıldı",
};

async function errorFrom(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "error" in body &&
      typeof body.error === "string"
    )
      return body.error;
  } catch {
    /* A proxy may return an HTML error page. */
  }
  return fallback;
}

export default function SystemCenter() {
  const [data, setData] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"backup" | "key-export" | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const mounted = useRef(true);
  const downloadController = useRef<AbortController | null>(null);
  const statusController = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    statusController.current?.abort();
    const controller = new AbortController();
    statusController.current = controller;
    setLoading(true);
    try {
      const response = await fetch("/api/admin/system/status", {
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          await errorFrom(response, "Sistem durumu yüklenemedi."),
        );
      const next = (await response.json()) as SystemStatus;
      if (!controller.signal.aborted && mounted.current) {
        setData(next);
        setError("");
      }
    } catch (e) {
      if (!controller.signal.aborted && mounted.current)
        setError((e as Error).message);
    } finally {
      if (!controller.signal.aborted && mounted.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
      statusController.current?.abort();
      downloadController.current?.abort();
    };
  }, [load]);

  async function download(kind: "backup" | "key-export") {
    if (busy || !form.current?.reportValidity()) return;
    setBusy(kind);
    setError("");
    setNotice("");
    const controller = new AbortController();
    downloadController.current = controller;
    try {
      const response = await fetch(`/api/admin/system/${kind}`, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new Error(
          await errorFrom(response, "Dosya hazırlanamadı. Tekrar deneyin."),
        );
      const blob = await response.blob();
      if (!blob.size)
        throw new Error("Sunucu boş dosya döndürdü. Dosya kaydedilmedi.");
      if (controller.signal.aborted) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download =
        kind === "backup"
          ? `kilinc-yedek-${new Date().toISOString().slice(0, 10)}.kilincbackup`
          : "kilinc-veri-anahtari.key";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      if (mounted.current) {
        setNotice(
          kind === "backup"
            ? "Şifreli yedek dosyasının indirmesi başlatıldı. Dosyanın kaydedildiğini kontrol edin; geri yüklemek için veri anahtarının ayrıca saklanması gerekir."
            : "Veri anahtarının indirmesi başlatıldı. Anahtarı yedek dosyasından ayrı, yalnızca yetkili kişilerin erişebildiği güvenli bir yerde saklayın.",
        );
        void load();
      }
    } catch (e) {
      if (!controller.signal.aborted && mounted.current)
        setError((e as Error).message);
    } finally {
      if (mounted.current) {
        setPassword("");
        setBusy(null);
      }
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void download("backup");
  }

  const scannerWarning =
    data?.scanner.mode !== "required" ||
    !data?.scanner.configured ||
    data.scanner.available === false;
  const storage = [
    {
      label: "Veri tabanı",
      value: bytes(data?.storage.databaseBytes),
      icon: Database,
    },
    {
      label: "Genel site görselleri",
      value: bytes(data?.storage.publicBytes),
      icon: HardDrive,
    },
    {
      label: "Özel müşteri dosyaları",
      value: bytes(data?.storage.privateBytes),
      icon: LockKeyhole,
    },
    {
      label: "Toplam dosya",
      value: data?.storage.fileCount.toLocaleString("tr-TR") ?? "—",
      icon: FolderArchive,
    },
  ];

  return (
    <div className="sc-root">
      <div className="sc-heading">
        <div>
          <h2>Veri, yedek ve güvenlik merkezi</h2>
          <p>
            Depolanan kayıtları inceleyin, şifreli yedek alın ve dosya tarama
            durumunu kontrol edin.
          </p>
        </div>
        <button
          className="ka-button secondary"
          onClick={() => void load()}
          disabled={loading || !!busy}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Durumu
          yenile
        </button>
      </div>
      {error && (
        <div className="ka-alert error" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="ka-alert success sc-notice" role="status">
          {notice}
        </div>
      )}
      {loading && !data && (
        <div className="sc-loading" role="status">
          <Loader2 size={19} className="spin" /> Sistem bilgileri yükleniyor…
        </div>
      )}

      <div className="sc-storage-grid">
        {storage.map((item) => (
          <article key={item.label}>
            <item.icon size={20} />
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      {data && (
        <>
          <div className="sc-status-grid">
            <section className="ka-panel sc-panel">
              <div className="sc-panel-heading">
                <LockKeyhole size={20} />
                <h3>Veri tabanı koruması</h3>
              </div>
              <span
                className={`sc-badge ${data.database.enabled ? "ok" : "attention"}`}
              >
                {data.database.enabled
                  ? "Diskte şifreli saklama etkin"
                  : "Şifreli saklama etkin değil"}
              </span>
              <dl className="sc-facts">
                <div>
                  <dt>Şifreleme</dt>
                  <dd>{data.database.algorithm || "—"}</dd>
                </div>
                <div>
                  <dt>Dosya biçimi</dt>
                  <dd>Sürüm {data.database.formatVersion}</dd>
                </div>
                <div>
                  <dt>Anahtar kaynağı</dt>
                  <dd>
                    {keySourceLabels[data.database.keySource] ||
                      data.database.keySource ||
                      "—"}
                  </dd>
                </div>
                <div>
                  <dt>Anahtar parmak izi</dt>
                  <dd>
                    <code>{data.database.keyFingerprint || "—"}</code>
                  </dd>
                </div>
                <div>
                  <dt>Veri dosyası</dt>
                  <dd>
                    <code>{data.database.databaseFile || "—"}</code>
                  </dd>
                </div>
                <div>
                  <dt>Veri tabanı boyut sınırı</dt>
                  <dd>{bytes(data.database.maxSnapshotBytes)}</dd>
                </div>
                <div>
                  <dt>Çalışma düzeni</dt>
                  <dd>
                    {data.database.singleProcess
                      ? "Aynı veriye tek sunucu süreci"
                      : "Sunucu yapılandırmasına bağlı"}
                  </dd>
                </div>
              </dl>
              <p className="sc-footnote">
                Parmak izi anahtarın kendisi değildir. Şifreleme diskteki
                kopyayı korur; sunucu çalışırken yetki kontrolleri,
                güncellemeler ve güvenli anahtar saklama da gereklidir.
              </p>
            </section>
            <section className="ka-panel sc-panel">
              <div className="sc-panel-heading">
                {scannerWarning ? (
                  <ShieldAlert size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
                <h3>Yüklenen dosyaların denetimi</h3>
              </div>
              <span
                className={`sc-badge ${scannerWarning ? "attention" : "ok"}`}
              >
                {data.scanner.mode === "required"
                  ? "Antivirüs taraması zorunlu"
                  : "Geliştirme: sınırlı denetim"}
              </span>
              <dl className="sc-facts">
                <div>
                  <dt>Tarama motoru</dt>
                  <dd>
                    {data.scanner.engine === "clamav"
                      ? "ClamAV"
                      : "Yerleşik tür / içerik kontrolleri"}
                  </dd>
                </div>
                <div>
                  <dt>Bağlantı yapılandırması</dt>
                  <dd>
                    {data.scanner.configured ? "Tanımlı" : "Tanımlanmamış"}
                  </dd>
                </div>
                <div>
                  <dt>Son erişim denetimi</dt>
                  <dd>
                    {data.scanner.available === true
                      ? "Ulaşılabiliyor"
                      : data.scanner.available === false
                        ? "Ulaşılamıyor"
                        : "Bu yanıtta sınanmadı"}
                  </dd>
                </div>
              </dl>
              <p
                className={`sc-scanner-message ${scannerWarning ? "attention" : ""}`}
              >
                {data.scanner.message}
              </p>
              <p className="sc-footnote">
                Canlı ortamda gerekli tarayıcıya ulaşılamazsa yükleme kabul
                edilmez. Geliştirmedeki sınırlı kontroller tam antivirüs
                taraması sayılmaz. Yalnızca yetkili olduğunuz belgeleri indirip
                açın.
              </p>
            </section>
          </div>

          <section className="ka-panel sc-panel">
            <div className="sc-panel-heading">
              <Database size={20} />
              <h3>Kalıcı kayıtlar</h3>
            </div>
            {Object.keys(data.counts).length ? (
              <div className="sc-counts">
                {Object.entries(data.counts).map(([key, value]) => (
                  <div key={key}>
                    <strong>{value.toLocaleString("tr-TR")}</strong>
                    <span>{countLabels[key] || key.replaceAll("_", " ")}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="sc-footnote">
                Bu yanıtta kayıt sayıları bulunmuyor.
              </p>
            )}
            <p className="sc-footnote">
              Bunlar sunucudaki güncel kayıt sayılarıdır. İleride siteyi
              yenilerken şifreli yedek ve ayrı veri anahtarı birlikte
              kullanılır.
            </p>
          </section>

          <section className="ka-panel sc-panel sc-backup-panel">
            <div className="sc-panel-heading">
              <FolderArchive size={20} />
              <h3>Taşınabilir şifreli yedek</h3>
            </div>
            <p>
              Önce yedeği indirin, ardından veri anahtarını ayrı bir yerde
              saklayın. Aynı anahtar kullanıldığı sürece her yedek için yeni
              anahtar üretmeniz gerekmez.
            </p>
            <div className="sc-backup-info">
              <span>
                Son dışa aktarma:{" "}
                <strong>{date(data.backup.lastExportAt)}</strong>
              </span>
              <span>
                Yedek sınırı: <strong>{bytes(data.backup.maxBytes)}</strong>
              </span>
            </div>
            <form ref={form} onSubmit={submit} className="sc-backup-form">
              <label className="ka-field">
                Yönetici parolanız
                <input
                  type="password"
                  name="currentPassword"
                  required
                  autoComplete="current-password"
                  maxLength={256}
                  value={password}
                  disabled={!!busy}
                  onChange={(event) => setPassword(event.target.value)}
                  aria-describedby="sc-password-help"
                />
                <small id="sc-password-help">
                  Bu iki işlem için parolanız yeniden doğrulanır. İşlem bitince
                  alan temizlenir.
                </small>
              </label>
              <div className="sc-backup-actions">
                <button
                  type="submit"
                  className="ka-button"
                  disabled={!!busy || loading}
                >
                  {busy === "backup" ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <Download size={16} />
                  )}
                  {busy === "backup"
                    ? "Yedek hazırlanıyor…"
                    : "Şifreli yedeği indir"}
                </button>
                <button
                  type="button"
                  className="ka-button secondary"
                  disabled={!!busy || loading}
                  onClick={() => void download("key-export")}
                >
                  {busy === "key-export" ? (
                    <Loader2 size={16} className="spin" />
                  ) : (
                    <FileKey2 size={16} />
                  )}
                  {busy === "key-export"
                    ? "Anahtar hazırlanıyor…"
                    : "Veri anahtarını ayrı indir"}
                </button>
              </div>
            </form>
            <div className="sc-key-note">
              <FileKey2 size={18} />
              <p>
                Veri anahtarını yedeğin yanında, e-postada veya herkese açık bir
                klasörde saklamayın. Anahtar kaybolursa şifreli yedek açılamaz;
                başkasının eline geçerse yedeği açmak için kullanılabilir.
              </p>
            </div>
            <details className="sc-restore-guide">
              <summary>
                <Info size={17} /> Başka bir siteye / sunucuya nasıl taşırım?
              </summary>
              <ol>
                <li>
                  Şifreli yedeği ve ayrı sakladığınız veri anahtarını
                  hazırlayın. Yeni sürümün veri biçimini desteklediğini kontrol
                  edin.
                </li>
                <li>
                  Yeni kurulumda boş bir veri klasörü seçin. Rehberdeki geri
                  yükleme komutunu yedek ve anahtar dosyalarının konumlarıyla
                  çalıştırın.
                </li>
                <li>
                  Yeni kurulumdaki hesap, içerik ve dosyaları kontrol edin.
                  Doğrulamadan eski kurulumu ve yedekleri silmeyin.
                </li>
              </ol>
              <p>
                Geri yükleme yeni bir klasöre yapılır; çalışan sitenin verisini
                bu ekrandan değiştirmez. Anahtarı veya yedeği destek mesajına
                eklemeyin.
              </p>
            </details>
          </section>

          <section className="ka-panel sc-panel">
            <div className="sc-panel-heading">
              <ShieldCheck size={20} />
              <h3>Son güvenlik olayları</h3>
            </div>
            <p className="sc-footnote">
              Reddedilen istekler bir saldırı olduğunun tek başına kanıtı
              değildir. Aynı durum tekrar ediyorsa hesabı, işlemi ve sunucu
              kayıtlarını birlikte inceleyin.
            </p>
            {data.securityEvents.length ? (
              <div
                className="sc-events"
                role="table"
                aria-label="Son güvenlik olayları"
              >
                <div className="sc-event-head" role="row">
                  <span role="columnheader">Olay / adres</span>
                  <span role="columnheader">Durum</span>
                  <span role="columnheader">Tarih</span>
                </div>
                {data.securityEvents.map((event) => (
                  <div className="sc-event" role="row" key={event.id}>
                    <div role="cell">
                      <strong>
                        {actionLabels[event.action] || event.action}
                      </strong>
                      <code>{event.route || "—"}</code>
                    </div>
                    <span role="cell" className="sc-http-status">
                      {event.status}
                    </span>
                    <time role="cell" dateTime={event.createdAt}>
                      {date(event.createdAt)}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sc-empty">
                <ShieldCheck size={24} />
                <p>Kaydedilmiş güvenlik olayı bulunmuyor.</p>
              </div>
            )}
          </section>
          <p className="sc-updated">
            Son veri yenileme: {date(data.generatedAt)} · Saat dilimi: İstanbul
          </p>
        </>
      )}
    </div>
  );
}
