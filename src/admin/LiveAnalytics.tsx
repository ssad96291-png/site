import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock3,
  Eye,
  FileDown,
  Laptop,
  Loader2,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Users,
} from "lucide-react";
import "./live-analytics.css";
interface LiveVisitor {
  id: string;
  maskedIp: string;
  path: string;
  title: string;
  device: string;
  startedAt: string;
  lastSeen: string;
  secondsOnSite: number;
}
interface LiveEvent {
  id: string;
  sessionId: string;
  maskedIp: string;
  kind: string;
  path: string;
  title: string;
  device: string;
  form?: string;
  createdAt: string;
}
interface PageMetric {
  path: string;
  title: string;
  views: number;
  share: number;
}
interface LiveData {
  generatedAt: string;
  consentRequired: boolean;
  retentionDays: number;
  presenceWindowSeconds: number;
  locationAvailable: boolean;
  kpis: {
    activeVisitors: number;
    todayLeads: number;
    totalLeads: number;
    completedLeads: number;
    completionRate: number;
    totalPageviews: number;
  };
  visitors: LiveVisitor[];
  stream: LiveEvent[];
  topPages: PageMetric[];
  topProducts: PageMetric[];
  dailyLeads: { date: string; count: number }[];
}
const eventLabels: Record<string, string> = {
  pageview: "Sayfayı görüntüledi",
  document_download: "Belge indirme bağlantısına tıkladı",
  dealer_click: "Hizmet bölgesini açtı",
  form_start: "Formu doldurmaya başladı",
  form_abandoned: "Formdan gönderim yapmadan ayrıldı",
};
const clock = (date: string) =>
  new Date(date).toLocaleTimeString("tr-TR", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
const duration = (seconds: number) =>
  seconds < 60
    ? `${seconds} sn`
    : `${Math.floor(seconds / 60)} dk ${seconds % 60} sn`;
function Device({ device }: { device: string }) {
  return device === "desktop" ? <Laptop size={16} /> : <Smartphone size={16} />;
}
function TopPages({ items, empty }: { items: PageMetric[]; empty: string }) {
  return items.length ? (
    <div className="la-top-pages">
      {items.map((page, i) => (
        <div className="la-page-metric" key={page.path}>
          <div>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <a href={page.path} target="_blank" rel="noreferrer">
              {page.title}
              <ArrowUpRight size={12} />
            </a>
            <strong>{page.views}</strong>
          </div>
          <div className="la-progress-track">
            <span style={{ width: `${Math.min(100, page.share)}%` }} />
          </div>
          <small>Görüntülemelerin %{page.share}’i</small>
        </div>
      ))}
    </div>
  ) : (
    <div className="ka-empty">
      <span>
        <BarChart3 size={24} />
      </span>
      <h3>Henüz veri yok</h3>
      <p>{empty}</p>
    </div>
  );
}
export default function LiveAnalytics({
  variant = "full",
}: {
  variant?: "full" | "summary";
}) {
  const [data, setData] = useState<LiveData | null>(null),
    [error, setError] = useState(""),
    [refresh, setRefresh] = useState(0),
    [kind, setKind] = useState("all");
  useEffect(() => {
    const controller = new AbortController();
    let running = false;
    async function load() {
      if (running) return;
      running = true;
      try {
        const response = await fetch("/api/admin/live", {
          credentials: "same-origin",
          signal: controller.signal,
        });
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error || "Canlı rapor yüklenemedi.");
        setData(body);
        setError("");
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        running = false;
      }
    }
    void load();
    const timer = setInterval(
      () => void load(),
      variant === "summary" ? 10000 : 5000,
    );
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [refresh, variant]);
  const metrics = [
    {
      label: "Bugün gelen talep",
      value: data?.kpis.todayLeads,
      icon: MessageSquare,
    },
    { label: "Aktif ziyaretçi", value: data?.kpis.activeVisitors, icon: Users },
    {
      label: "Tamamlanan talep",
      value: data?.kpis.completedLeads,
      icon: ShieldCheck,
    },
    { label: "Sayfa görüntüleme", value: data?.kpis.totalPageviews, icon: Eye },
  ];
  return (
    <div className={`la-root ${variant === "summary" ? "is-summary" : ""}`}>
      {error && (
        <div className="ka-alert error" role="alert">
          {error}
          <button
            onClick={() => setRefresh((v) => v + 1)}
            aria-label="Tekrar dene"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      )}
      <div className="la-kpis">
        {metrics.map((metric) => (
          <article key={metric.label}>
            <span className="la-kpi-icon">
              <metric.icon size={19} />
            </span>
            <strong>{metric.value ?? "—"}</strong>
            <span>{metric.label}</span>
          </article>
        ))}
      </div>
      {variant === "summary" ? (
        <div className="la-summary-note">
          <span className="la-live-dot" />
          İzin veren ziyaretçilerin son 90 saniyedeki oturumları.{" "}
          {data && <span>Güncellendi: {clock(data.generatedAt)}</span>}
        </div>
      ) : (
        <>
          <div className="la-toolbar">
            <div>
              <span className="la-live-dot" />
              <strong>Canlı akış</strong>
              <span>5 saniyede bir güncellenir</span>
            </div>
            <button
              className="ka-button secondary"
              onClick={() => setRefresh((v) => v + 1)}
            >
              <RefreshCw size={14} />
              Yenile
            </button>
          </div>
          {!data && !error && (
            <div className="ka-progress">
              <Loader2 size={16} className="spin" />
              Gerçek ziyaretçi verileri yükleniyor…
            </div>
          )}
          <div className="la-privacy-note">
            <ShieldCheck size={18} />
            <p>
              Yalnızca isteğe bağlı analitiğe izin veren ziyaretçiler görünür.
              IP’ler maskelenir; form alanları ve ekran kayıtları toplanmaz.
              IP’den konum belirleme hizmeti bağlı değildir.
            </p>
          </div>
          <div className="la-main-grid">
            <section className="ka-panel">
              <div className="ka-panel-title">
                <h2>Aktif oturumlar</h2>
                <span className="la-muted">Son 90 saniye</span>
              </div>
              {data?.visitors.length ? (
                <div className="ka-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Oturum</th>
                        <th>Şu anki sayfa</th>
                        <th>Süre</th>
                        <th>Cihaz</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.visitors.map((v) => (
                        <tr key={v.id}>
                          <td>
                            <strong>#{v.id}</strong>
                            <small className="la-block la-muted">
                              {v.maskedIp}
                            </small>
                          </td>
                          <td>
                            <a
                              className="la-current-page"
                              href={v.path}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {v.title}
                              <ArrowUpRight size={12} />
                            </a>
                          </td>
                          <td className="la-nowrap">
                            {duration(v.secondsOnSite)}
                          </td>
                          <td>
                            <span className="la-device">
                              <Device device={v.device} />
                              {v.device === "desktop"
                                ? "Masaüstü"
                                : v.device === "tablet"
                                  ? "Tablet"
                                  : "Mobil"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="ka-empty">
                  <span>
                    <Users size={24} />
                  </span>
                  <h3>Şu anda aktif oturum yok</h3>
                  <p>
                    İzin veren bir ziyaretçi siteyi kullandığında oturumu burada
                    görünür.
                  </p>
                </div>
              )}
            </section>
            <section className="ka-panel">
              <div className="ka-panel-title">
                <h2>En çok incelenen ürünler</h2>
                <span className="la-muted">Son 30 gün</span>
              </div>
              <TopPages
                items={data?.topProducts || []}
                empty="Ürün sayfaları görüntülendikçe gerçek sıralama oluşur."
              />
            </section>
          </div>
          <section className="ka-panel la-stream-panel">
            <div className="ka-panel-title">
              <h2>Oturum ve etkileşim kayıtları</h2>
              <select
                aria-label="Akış filtresi"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="all">Tüm olaylar</option>
                {Object.entries(eventLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            {data?.stream.filter((e) => kind === "all" || e.kind === kind)
              .length ? (
              <div className="la-stream">
                {data.stream
                  .filter((e) => kind === "all" || e.kind === kind)
                  .map((event) => (
                    <article key={event.id}>
                      <span className="la-event-icon">
                        {event.kind === "document_download" ? (
                          <FileDown size={16} />
                        ) : event.kind.startsWith("form_") ? (
                          <MessageSquare size={16} />
                        ) : (
                          <Activity size={16} />
                        )}
                      </span>
                      <div>
                        <p>
                          <strong>#{event.sessionId}</strong>
                          <span>{eventLabels[event.kind] || event.kind}</span>
                        </p>
                        <small>
                          {event.title} · {event.maskedIp}
                        </small>
                      </div>
                      <time>{clock(event.createdAt)}</time>
                    </article>
                  ))}
              </div>
            ) : (
              <div className="ka-empty">
                <span>
                  <Activity size={24} />
                </span>
                <h3>Bu filtrede kayıt yok</h3>
                <p>
                  Olaylar yalnızca analitik izni verildikten sonra kaydedilir.
                  Gönderilmemiş form alanları saklanmaz.
                </p>
              </div>
            )}
          </section>
          <div className="la-main-grid">
            <section className="ka-panel">
              <div className="ka-panel-title">
                <h2>Son 7 gün gelen talepler</h2>
                <span className="la-muted">Tüm talep formları</span>
              </div>
              <div className="la-daily-chart">
                {data?.dailyLeads.map((day) => (
                  <div key={day.date}>
                    <strong>{day.count}</strong>
                    <span className="la-daily-track">
                      <i
                        style={{
                          height: `${Math.max(0, (day.count / Math.max(1, ...data.dailyLeads.map((d) => d.count))) * 100)}%`,
                        }}
                      />
                    </span>
                    <small>
                      {new Date(
                        day.date + "T12:00:00+03:00",
                      ).toLocaleDateString("tr-TR", {
                        timeZone: "Europe/Istanbul",
                        day: "2-digit",
                        month: "short",
                      })}
                    </small>
                  </div>
                ))}
              </div>
              <div className="la-completion">
                <span>Tamamlanma oranı</span>
                <strong>%{data?.kpis.completionRate ?? 0}</strong>
                <small>
                  {data?.kpis.completedLeads ?? 0} /{" "}
                  {data?.kpis.totalLeads ?? 0} talep tamamlandı
                </small>
              </div>
            </section>
            <section className="ka-panel">
              <div className="ka-panel-title">
                <h2>En çok görüntülenen sayfalar</h2>
                <span className="la-muted">Son 30 gün</span>
              </div>
              <TopPages
                items={data?.topPages || []}
                empty="İzin veren ziyaretçiler sayfalarda gezindikçe rapor oluşur."
              />
            </section>
          </div>
          <p className="la-retention">
            <Clock3 size={13} />
            Ölçüm kayıtları en fazla 30 gün tutulur. Son 10.000 olay ve 2.000
            oturum saklanır. Aktif ziyaretçi sayısı açık analitik izni olan
            oturum sayısıdır.
          </p>
        </>
      )}
    </div>
  );
}
export { LiveAnalytics };
