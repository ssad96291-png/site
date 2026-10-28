import {
  lazy,
  Suspense,
  useEffect,
  useState,
  createContext,
  useContext,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useSearchParams,
  Navigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Menu,
  X,
  Search,
  ChevronDown,
  Check,
  MoveUpRight,
  Sun,
  ShieldCheck,
  Wind,
  Layers,
  Download,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  Facebook,
  Youtube,
  Linkedin,
  SlidersHorizontal,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import type { Content, Settings } from "./types";
const AdminApp = lazy(() => import("./admin/AdminApp"));
const CustomerPortal = lazy(() => import("./customer/CustomerPortal"));
import VisitorConsent from "./VisitorConsent";
import {
  SiteContext,
  useSite,
  contentImage,
  type SiteContextValue as Context,
} from "./site-context";
import {
  LocalHeader as Header,
  LocalHome as Home,
  LocalFooter as Footer,
  LocalProducts as Products,
  LocalCorporate as Corporate,
  LocalCatalog as Catalog,
  LocalGallery,
  LocalServiceAreas,
  LocalInformation,
  LocalPageHead,
} from "./LocalStudio";
const pathFor = (c: Content) =>
  `/${({ product: "urunler", project: "projeler", article: "blog", page: "kurumsal", region: "bolgeler", faq: "sikca-sorulan-sorular" } as Record<string, string>)[c.type] || "kurumsal"}/${c.slug}`;
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
function Eyebrow({
  children,
  light = false,
}: {
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <div className={`eyebrow ${light ? "on-dark" : ""}`}>
      <span />
      {children}
    </div>
  );
}
function ProductCard({
  item,
  index = 0,
  compare,
  toggle,
}: {
  item: Content;
  index?: number;
  compare?: boolean;
  toggle?: (id: string) => void;
}) {
  const { t, local } = useSite();
  return (
    <article className="product-card">
      <Link to={pathFor(item)} className="product-image">
        <img
          src={contentImage(item)}
          alt={item.imageAlt || local(item, "title")}
          loading="lazy"
        />
        <span className="image-arrow">
          <ArrowUpRight size={21} />
        </span>
        <span className="product-number">
          {String(index + 1).padStart(2, "0")}
        </span>
      </Link>
      <div className="product-meta">
        <small>{item.category}</small>
        {toggle && (
          <button
            className={compare ? "compare-button selected" : "compare-button"}
            onClick={() => toggle(item.id)}
            aria-label={`${local(item, "title")} ${t("karşılaştır", "compare")}`}
          >
            {compare ? <Check size={13} /> : <Plus size={13} />}{" "}
            {t("Karşılaştır", "Compare")}
          </button>
        )}
      </div>
      <Link to={pathFor(item)}>
        <h3>{local(item, "title")}</h3>
      </Link>
      <p>{local(item, "summary")}</p>
    </article>
  );
}
function PlanningChecklist() {
  const { t } = useSite();
  return (
    <div className="planning-checklist">
      <h2>
        {t(
          "Keşif öncesi küçük bir hazırlık.",
          "A little preparation before the site visit.",
        )}
      </h2>
      <p>
        {t(
          "Bu bilgiler doğru çözümü konuşmayı kolaylaştırır. Kesin sistem seçimi ve fiyat, teknik değerlendirmeyle belirlenir.",
          "These details help us discuss the right solution. Final selection and pricing require a technical assessment.",
        )}
      </p>
      {[
        [
          t("Mekân & ölçü", "Space & dimensions"),
          t(
            "Açıklığın yaklaşık genişliği ve yüksekliği, bulunduğu kat, kullanım amacı.",
            "Approximate opening width and height, floor level and intended use.",
          ),
        ],
        [
          t("Yapı & izinler", "Structure & permissions"),
          t(
            "Taşıyıcı zemin, bina yönetimi kararları, gerekli proje ve izin koşulları.",
            "Supporting surfaces, building management decisions and required project approvals.",
          ),
        ],
        [
          t("Malzeme & detay", "Materials & details"),
          t(
            "Cam seçimi, profil rengi, açılım yönü, tahliye ve bakım erişimi.",
            "Glazing, profile colour, opening direction, drainage and maintenance access.",
          ),
        ],
        [
          t("Teklif & teslim", "Proposal & handover"),
          t(
            "İş kapsamı, hariç tutulan işler, ödeme, termin ve garanti koşullarının yazılı paylaşımı.",
            "Written scope, exclusions, payment, schedule and warranty terms.",
          ),
        ],
      ].map(([title, text]) => (
        <div className="planning-item" key={title}>
          <CheckCircle2 size={21} />
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
function SystemFinder() {
  const { content, t, local } = useSite();
  const [use, setUse] = useState("balcony"),
    [need, setNeed] = useState("openness"),
    [width, setWidth] = useState(""),
    [height, setHeight] = useState("");
  const area = Number(width) * Number(height);
  const patterns: Record<string, RegExp> = {
    balcony:
      need === "insulation"
        ? /ısı|yalıtım/i
        : need === "automation"
          ? /giyotin/i
          : /katlanır|sürme/i,
    terrace: /bahçesi|pergola|giyotin|tente/i,
    commercial: /ofis|cephe|alüminyum/i,
    metal: /çelik|demir|ferforje|yangın|metal/i,
  };
  const recommended = content
    .filter((c) => c.type === "product" && patterns[use].test(c.title))
    .slice(0, 3);
  const dimensions = width && height ? `${width} m × ${height} m` : "";
  return (
    <>
      <PageHead
        title={t("Mekânınızı tanıyalım.", "Let’s understand your space.")}
        subtitle={t(
          "Birkaç seçimle incelemeye nereden başlayacağınızı bulun. Bu araç teknik proje veya fiyat teklifi oluşturmaz.",
          "A few choices help you find your starting point. This tool does not produce a technical design or price quote.",
        )}
        tag={t("SİSTEM SEÇİCİ", "SYSTEM FINDER")}
      />
      <section className="section container finder-layout">
        <div className="finder-controls">
          <h2>{t("Nasıl bir alan?", "What kind of space?")}</h2>
          <div className="finder-options">
            {[
              ["balcony", t("Balkon", "Balcony")],
              ["terrace", t("Teras & bahçe", "Terrace & garden")],
              ["commercial", t("Ofis & ticari alan", "Office & commercial")],
              ["metal", t("Metal & yapı", "Metal & structure")],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setUse(value)}
                className={use === value ? "active" : ""}
                aria-pressed={use === value}
              >
                {label}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <label>
            {t("Önceliğiniz", "Your priority")}
            <select value={need} onChange={(e) => setNeed(e.target.value)}>
              <option value="openness">
                {t("Açıklık ve manzara", "Openness and views")}
              </option>
              <option value="insulation">
                {t("Isı konforu", "Thermal comfort")}
              </option>
              <option value="automation">
                {t("Motorlu kullanım", "Motorised operation")}
              </option>
            </select>
          </label>
          <fieldset>
            <legend>
              {t(
                "Yaklaşık açıklık ölçüsü (isteğe bağlı)",
                "Approximate opening size (optional)",
              )}
            </legend>
            <div className="dimension-inputs">
              <label>
                {t("Genişlik (m)", "Width (m)")}
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                />
              </label>
              <span>×</span>
              <label>
                {t("Yükseklik (m)", "Height (m)")}
                <input
                  type="number"
                  min="0.1"
                  max="30"
                  step="0.1"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </label>
            </div>
            {area > 0 && Number(width) <= 100 && Number(height) <= 30 && (
              <p className="area-result">
                {t("Yaklaşık açıklık alanı", "Approximate opening area")}
                <strong>
                  {area.toLocaleString("tr-TR", { maximumFractionDigits: 2 })}{" "}
                  m²
                </strong>
              </p>
            )}
            <small>
              {t(
                "Ölçü ve taşıyıcı uygunluğu yerinde doğrulanır. Alan, fiyat hesabı değildir.",
                "Dimensions and structural suitability require site verification. Area is not a price calculation.",
              )}
            </small>
          </fieldset>
          <Link
            className="button"
            to={`/teklif-al?${new URLSearchParams({ olcu: dimensions, hizmet: use === "metal" ? "Demir & çelik imalat" : use === "commercial" ? "Kurumsal proje" : "Cam sistemleri" })}`}
          >
            {t("Bu bilgilerle keşif iste", "Request an assessment")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="finder-results">
          <Eyebrow>{t("İNCELEMEYE DEĞER", "WORTH EXPLORING")}</Eyebrow>
          <h2>{t("Başlangıç noktanız.", "Your starting point.")}</h2>
          <p>
            {t(
              "Tercihlerinize göre inceleyebileceğiniz sistemler. Kesin uygunluk teknik keşifle belirlenir.",
              "Systems to explore based on your preferences. Final suitability requires a technical assessment.",
            )}
          </p>
          {recommended.map((c) => (
            <Link className="finder-result" to={pathFor(c)} key={c.id}>
              <img src={c.image} alt={c.imageAlt || local(c, "title")} />
              <span>
                <small>{c.category}</small>
                <h3>{local(c, "title")}</h3>
                <p>{local(c, "summary")}</p>
              </span>
              <ArrowUpRight size={20} />
            </Link>
          ))}
          {!recommended.length && (
            <Link className="text-link" to="/urunler">
              {t("Tüm sistemleri inceleyin", "Explore all systems")}
              <ArrowUpRight size={17} />
            </Link>
          )}
          <PlanningChecklist />
        </div>
      </section>
    </>
  );
}

function CallToAction() {
  const { t } = useSite();
  return (
    <section className="cta">
      <div className="container">
        <div>
          <Eyebrow light>
            {t("BİRLİKTE TASARLAYALIM", "LET’S DESIGN IT TOGETHER")}
          </Eyebrow>
          <h2>
            {t("Sizin mekânınız.", "Your space.")}{" "}
            <em>{t("Sizin hikâyeniz.", "Your story.")}</em>
          </h2>
          <p>
            {t(
              "Aklınızdaki projeyi anlatın, size uygun çözümleri birlikte değerlendirelim.",
              "Tell us what you have in mind. We’ll explore the possibilities together.",
            )}
          </p>
        </div>
        <Link to="/teklif-al" className="button cream">
          {t("Projenizi konuşalım", "Let’s talk about your project")}
          <ArrowUpRight size={19} />
        </Link>
      </div>
    </section>
  );
}
function PageHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
}) {
  return <LocalPageHead title={title} subtitle={subtitle} />;
}
function ProductComparison() {
  const { content, t, local } = useSite();
  const all = content.filter((c) => c.type === "product");
  const [params] = useSearchParams();
  const [category, setCategory] = useState(params.get("kategori") || "all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string[]>([]),
    [comparing, setComparing] = useState(false);
  useEffect(() => {
    setCategory(params.get("kategori") || "all");
  }, [params]);
  const categories = [...new Set(all.map((c) => c.category))];
  const familyPattern: Record<string, RegExp> = {
    glass: /cam|bahçe|pergola|gölge/i,
    aluminium: /alüminyum|cephe|ofis|doğrama/i,
    metal: /demir|çelik|ferforje|metal|yangın/i,
  };
  const family = params.get("grup") || "";
  const visible = all.filter(
    (c) =>
      (!familyPattern[family] || familyPattern[family].test(c.title)) &&
      (category === "all" || c.category === category) &&
      local(c, "title")
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  function toggle(id: string) {
    setSelected((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length < 3
          ? [...s, id]
          : s,
    );
  }
  return (
    <>
      <PageHead
        title={t("Mekânınıza uyan sistemler.", "Systems that fit your space.")}
        subtitle={t(
          "Cam balkon, teras ve bahçe çözümlerini keşfedin. Kullanım alışkanlığınıza en uygun sistemi birlikte seçelim.",
          "Explore glass balcony, terrace and garden systems. Find the right solution for the way you live.",
        )}
        tag={t("SİSTEMLERİMİZ", "OUR SYSTEMS")}
      />
      <section className="container section compact">
        {familyPattern[family] && (
          <div className="family-filter-note">
            <span>
              {t("Seçili hizmet grubu", "Selected service family")}:{" "}
              {
                {
                  glass: t("Cam sistemleri", "Glass systems"),
                  aluminium: t("Alüminyum sistemler", "Aluminium systems"),
                  metal: t("Demir & çelik", "Steel & metal"),
                }[family as "glass" | "aluminium" | "metal"]
              }
            </span>
            <Link to="/urunler">
              {t("Tüm sistemlere dön", "Show all systems")} <X size={14} />
            </Link>
          </div>
        )}
        <div className="filters">
          <div className="filter-tabs">
            <button
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              {t("Tüm sistemler", "All systems")}
              <span>{all.length}</span>
            </button>
            {categories.map((c) => (
              <button
                className={category === c ? "active" : ""}
                key={c}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <label className="filter-search">
            <Search size={17} />
            <input
              placeholder={t("Sistem ara", "Search systems")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="product-grid listing">
          {visible.map((c, i) => (
            <ProductCard
              item={c}
              index={i}
              key={c.id}
              compare={selected.includes(c.id)}
              toggle={toggle}
            />
          ))}
        </div>
        {!visible.length && (
          <div className="empty-state">
            {t(
              "Bu aramada bir sistem bulunamadı.",
              "No systems found for this search.",
            )}
          </div>
        )}
      </section>
      {selected.length > 0 && (
        <div className="compare-bar">
          <span>
            {selected.length}/3 {t("sistem seçildi", "systems selected")}
          </span>
          <button
            className="button small"
            disabled={selected.length < 2}
            onClick={() => setComparing(true)}
          >
            {t("Karşılaştır", "Compare")}
            <SlidersHorizontal size={16} />
          </button>
          <button
            className="icon-button"
            onClick={() => setSelected([])}
            aria-label={t("Seçimi temizle", "Clear selection")}
          >
            <X size={19} />
          </button>
        </div>
      )}
      {comparing && (
        <div className="modal-overlay" onClick={() => setComparing(false)}>
          <section
            className="compare-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("Sistem karşılaştırması", "System comparison")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-heading">
              <h2>{t("Birlikte karşılaştıralım.", "Let’s compare.")}</h2>
              <button
                className="icon-button"
                onClick={() => setComparing(false)}
                aria-label={t("Kapat", "Close")}
              >
                <X />
              </button>
            </div>
            <div className="compare-grid">
              {all
                .filter((c) => selected.includes(c.id))
                .map((c) => (
                  <div key={c.id}>
                    <img src={contentImage(c)} alt="" />
                    <h3>{local(c, "title")}</h3>
                    <p>{local(c, "summary")}</p>
                    {c.specs.map((s, i) => (
                      <div className="spec" key={i}>
                        <span>{s.label}</span>
                        <strong>{s.value}</strong>
                      </div>
                    ))}
                    <Link to={pathFor(c)} className="text-link">
                      {t("İncele", "Explore")}
                      <ArrowUpRight size={17} />
                    </Link>
                  </div>
                ))}
            </div>
            <p className="muted">
              {t(
                "Teknik özellikler projeye ve seçilen bileşenlere göre netleştirilir.",
                "Technical specifications are confirmed for each project and selected components.",
              )}
            </p>
          </section>
        </div>
      )}
      <CallToAction />
    </>
  );
}
function ArticleCard({ item }: { item: Content }) {
  const { local, t } = useSite();
  return (
    <article className="journal-card">
      <Link className="journal-image" to={pathFor(item)}>
        <img
          src={contentImage(item)}
          alt={item.imageAlt || local(item, "title")}
          loading="lazy"
        />
      </Link>
      <small>{item.category || t("YAŞAM REHBERİ", "LIVING GUIDE")}</small>
      <Link to={pathFor(item)}>
        <h3>{local(item, "title")}</h3>
      </Link>
      <Link to={pathFor(item)} className="text-link">
        {t("Yazıyı okuyun", "Read the story")}
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}
function Listing({ type }: { type: "project" | "article" }) {
  const { content, t, local } = useSite();
  const [category, setCategory] = useState("all");
  const items = content.filter((c) => c.type === type),
    categories = [...new Set(items.map((c) => c.category))];
  return (
    <>
      <PageHead
        title={
          type === "project"
            ? t("Birlikte hayal edelim.", "Imagine the possibilities.")
            : t("Yaşam alanınıza ilham.", "Inspiration for your space.")
        }
        subtitle={
          type === "project"
            ? t(
                "Balkonunuzdan bahçenize, farklı mekânlar için hazırladığımız tasarım önerilerini keşfedin.",
                "Discover design concepts for every space, from your balcony to your garden.",
              )
            : t(
                "Sistem seçiminden bakım önerilerine, daha keyifli mekânlar için fikirler.",
                "From choosing a system to caring for it, ideas for spaces you’ll love.",
              )
        }
        tag={
          type === "project"
            ? t("YAŞAM ALANLARI", "LIVING SPACES")
            : t("İLHAM & FİKİRLER", "IDEAS & INSPIRATION")
        }
      />
      <section className="container section compact">
        <div className="filter-tabs standalone">
          <button
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
          >
            {t("Tümü", "All")}
          </button>
          {categories.map((c) => (
            <button
              className={category === c ? "active" : ""}
              key={c}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <div className={type === "project" ? "project-list" : "journal-grid"}>
          {items
            .filter((c) => category === "all" || c.category === category)
            .map((c, i) =>
              type === "article" ? (
                <ArticleCard key={c.id} item={c} />
              ) : (
                <Link key={c.id} className="project-card" to={pathFor(c)}>
                  <img src={contentImage(c)} alt={local(c, "title")} />
                  <div>
                    <small>{c.category}</small>
                    <h3>{local(c, "title")}</h3>
                    <span>
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                </Link>
              ),
            )}
        </div>
        {type === "project" && (
          <p className="image-disclosure">
            {t(
              "Bu bölümdeki alanlar özgün tasarım önerileri ve mimari görselleştirmelerdir; tamamlanmış uygulama referansı değildir.",
              "These spaces are original design concepts and architectural visualizations, not completed project references.",
            )}
          </p>
        )}
      </section>
      <CallToAction />
    </>
  );
}
function Detail({
  type,
}: {
  type: "product" | "project" | "article" | "page" | "region";
}) {
  const { content, t, local } = useSite();
  const location = useLocation();
  const rawSlug = location.pathname.split("/").filter(Boolean).at(-1) || "";
  let slug = rawSlug;
  try {
    slug = decodeURIComponent(rawSlug);
  } catch {
    // Malformed percent escapes remain unmatched and use the normal 404 view.
  }
  const c = content.find((c) => c.type === type && c.slug === slug);
  const [tab, setTab] = useState("overview");
  useEffect(() => setTab("overview"), [slug]);
  if (!c) return <NotFound />;
  const related = content
    .filter((x) => x.type === type && x.id !== c.id)
    .slice(0, 3);
  return (
    <>
      <PageHead
        title={local(c, "title")}
        subtitle={local(c, "subtitle") || local(c, "summary")}
        tag={c.category || t("DETAYLARI KEŞFEDİN", "EXPLORE THE DETAILS")}
      />
      <section className="container detail-section">
        {type !== "page" && (
          <div className="detail-cover">
            <img src={contentImage(c)} alt={c.imageAlt || local(c, "title")} />
            <span>
              {t(
                "Özgün mimari görselleştirme",
                "Original architectural visualization",
              )}
            </span>
          </div>
        )}
        <div className="detail-layout">
          <article className="detail-body">
            {type === "product" && (
              <div className="filter-tabs detail-tabs">
                <button
                  className={tab === "overview" ? "active" : ""}
                  onClick={() => setTab("overview")}
                >
                  {t("Genel bakış", "Overview")}
                </button>
                <button
                  className={tab === "specs" ? "active" : ""}
                  onClick={() => setTab("specs")}
                >
                  {t("Sistem özellikleri", "System features")}
                </button>
                <button
                  className={tab === "planning" ? "active" : ""}
                  onClick={() => setTab("planning")}
                >
                  {t("Keşif & uygulama", "Planning & installation")}
                </button>
              </div>
            )}
            {tab === "planning" ? (
              <PlanningChecklist />
            ) : tab === "overview" ? (
              <>
                <Eyebrow>
                  {t("AYRINTILARDA SAKLI KONFOR", "COMFORT IN THE DETAILS")}
                </Eyebrow>
                <h2>{local(c, "subtitle") || local(c, "title")}</h2>
                <div className="prose">
                  {local(c, "body")
                    .split("\n")
                    .filter(Boolean)
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
                {c.specs.length > 0 && (
                  <div className="features-grid">
                    {c.specs.map((s, i) => (
                      <div key={i}>
                        <CheckCircle2 size={23} />
                        <strong>{s.label}</strong>
                        <p>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div>
                {c.specs.map((s, i) => (
                  <div className="spec" key={i}>
                    <span>{s.label}</span>
                    <strong>{s.value}</strong>
                  </div>
                ))}
                <p className="muted">
                  {t(
                    "Performans ve uygulanabilirlik; yerinde ölçü, cam seçimi ve proje koşullarıyla birlikte değerlendirilir.",
                    "Performance and suitability are assessed with site measurements, glazing selection and project conditions.",
                  )}
                </p>
              </div>
            )}
            {type === "product" && (
              <div className="detail-help">
                <h3>
                  {t("Seçiminizi kolaylaştıralım.", "Make an informed choice.")}
                </h3>
                <p>
                  {t(
                    "Doğru sistem; kullanım amacı, açıklık ölçüsü, kat yüksekliği ve bakım erişimi birlikte değerlendirilerek seçilir.",
                    "Select your system with its use, opening dimensions, floor height and maintenance access in mind.",
                  )}
                </p>
                <Link className="text-link" to="/sistem-secici">
                  {t("Sistem seçiciyi deneyin", "Try the system finder")}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            )}
            {c.gallery?.length > 0 && (
              <div className="gallery">
                {c.gallery.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`${local(c, "title")} ${i + 1}`}
                    loading="lazy"
                  />
                ))}
              </div>
            )}
            {type === "project" && (
              <p className="image-disclosure">
                {t(
                  "Bu sayfa bir tasarım önerisidir. Görsel, tamamlanmış müşteri projesi değildir.",
                  "This page presents a design concept. The image is not a completed customer project.",
                )}
              </p>
            )}
          </article>
          <aside className="detail-aside">
            <small>{t("SİZE ÖZEL PLANLAYALIM", "LET’S MAKE IT YOURS")}</small>
            <h3>
              {t(
                "Bu çözüm mekânınıza uygun mu?",
                "Could this work in your space?",
              )}
            </h3>
            <p>
              {t(
                "Ölçülerinizi ve beklentilerinizi paylaşın. Birlikte değerlendirelim.",
                "Share your measurements and expectations. Let’s explore your options.",
              )}
            </p>
            <Link
              to={`/teklif-al?urun=${encodeURIComponent(c.title)}`}
              className="button"
            >
              {t("Teklif isteyin", "Request a quote")}
              <ArrowUpRight size={17} />
            </Link>
            <Link to="/katalog" className="text-link">
              {t("Kataloğu inceleyin", "View the catalogue")}
              <Download size={16} />
            </Link>
            <Link to="/sikca-sorulan-sorular" className="text-link">
              {t("Merak ettikleriniz", "Your questions answered")}
              <Plus size={16} />
            </Link>
          </aside>
        </div>
      </section>
      {type === "product" && (
        <section className="section container detail-guides">
          <div className="section-heading">
            <div>
              <Eyebrow>
                {t("BİLGİYLE PLANLAYIN", "PLAN WITH CONFIDENCE")}
              </Eyebrow>
              <h2>
                {t("Kararınıza eşlik eden", "Guidance for your")}{" "}
                <em>{t("rehberler.", "decision.")}</em>
              </h2>
            </div>
            <Link className="text-link" to="/blog">
              {t("Tüm rehberler", "All guides")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="journal-grid">
            {content
              .filter((x) => x.type === "article")
              .slice(0, 3)
              .map((item) => (
                <ArticleCard key={item.id} item={item} />
              ))}
          </div>
        </section>
      )}
      {related.length > 0 && (
        <section className="section container">
          <div className="section-heading">
            <h2>
              {t("Keşfetmeye", "Keep")}{" "}
              <em>{t("devam edin.", "exploring.")}</em>
            </h2>
          </div>
          <div
            className={
              type === "product" ? "product-grid related" : "journal-grid"
            }
          >
            {related.map((r, i) =>
              type === "product" ? (
                <ProductCard key={r.id} item={r} index={i} />
              ) : (
                <ArticleCard key={r.id} item={r} />
              ),
            )}
          </div>
        </section>
      )}
      <CallToAction />
    </>
  );
}
function FAQ() {
  const { content, t, local } = useSite();
  const [open, setOpen] = useState<string | null>(null);
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("all");
  const questions = content.filter((c) => c.type === "faq");
  const categories = [
    ...new Set(questions.map((c) => c.category).filter(Boolean)),
  ];
  const visible = questions.filter(
    (c) =>
      (category === "all" || c.category === category) &&
      `${local(c, "title")} ${local(c, "body")}`
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <PageHead
        title={t("Aklınızdaki sorular.", "Your questions, answered.")}
        subtitle={t(
          "Sistem seçimi, montaj ve bakım hakkında merak ettikleriniz.",
          "What you need to know about choosing, installing and caring for your system.",
        )}
        tag={t("SIKÇA SORULAN SORULAR", "FREQUENTLY ASKED QUESTIONS")}
      />
      <section className="container section faq-layout">
        <div>
          <h2>
            {t("Doğru bilgiyle,", "The right information.")}
            <br />
            <em>{t("doğru seçim.", "The right choice.")}</em>
          </h2>
          <p>
            {t(
              "Sorunuzun yanıtını bulamadınız mı? Bize yazın.",
              "Can’t find what you’re looking for? Get in touch.",
            )}
          </p>
          <Link to="/iletisim" className="text-link">
            {t("Bize ulaşın", "Contact us")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="faq-list">
          <label className="faq-search">
            <Search size={18} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Sorularda ara…", "Search questions…")}
              aria-label={t("Sorularda ara", "Search questions")}
            />
          </label>
          <div className="filter-tabs faq-categories">
            <button
              className={category === "all" ? "active" : ""}
              onClick={() => setCategory("all")}
            >
              {t("Tümü", "All")}
            </button>
            {categories.map((value) => (
              <button
                key={value}
                className={category === value ? "active" : ""}
                onClick={() => setCategory(value)}
              >
                {value}
              </button>
            ))}
          </div>
          {!visible.length && (
            <p className="empty-state">
              {t(
                "Aramanızla eşleşen soru bulunamadı.",
                "No questions match your search.",
              )}
            </p>
          )}
          {visible.map((c, i) => (
            <div className="faq-item" key={c.id}>
              <button
                onClick={() => setOpen(open === c.id ? null : c.id)}
                aria-expanded={open === c.id}
                aria-controls={`answer-${c.id}`}
              >
                <span className="faq-number">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{local(c, "title")}</span>
                {open === c.id ? <Minus size={20} /> : <Plus size={20} />}
              </button>
              {open === c.id && (
                <div className="faq-answer" id={`answer-${c.id}`}>
                  {local(c, "body")
                    .split("\n")
                    .map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
      <CallToAction />
    </>
  );
}
function InquiryForm({ service = false }: { service?: boolean }) {
  const { content, t } = useSite();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle"),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
  const [trackingReady, setTrackingReady] = useState(false);
  const [trackingHref, setTrackingHref] = useState("/hesabim");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setStatus("loading");
    setError("");
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          subject: service ? "Servis talebi" : "Teklif talebi",
          consent: data.consent === "on",
        }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(
          body.error ||
            t("Talep gönderilemedi.", "Could not submit your request."),
        );
      window.dispatchEvent(new Event("kilinc-inquiry-submitted"));
      setReceipt(body.id || "");
      if (body.trackingToken) {
        try {
          sessionStorage.setItem("kilinc-portal-claim", body.trackingToken);
          setTrackingHref("/hesabim");
        } catch {
          setTrackingHref(
            `/hesabim#claim=${encodeURIComponent(body.trackingToken)}`,
          );
        }
        setTrackingReady(true);
      } else {
        setTrackingHref("/hesabim");
        setTrackingReady(!!body.trackingUrl);
      }

      setStatus("success");
      form.reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("Bir bağlantı hatası oluştu.", "A connection error occurred."),
      );
      setStatus("idle");
    }
  }
  if (status === "success")
    return (
      <div className="form-success" role="status">
        <CheckCircle2 size={48} />
        <h2>{t("Talebiniz bize ulaştı.", "We received your request.")}</h2>
        <p>
          {t(
            "Notunuz kaydedildi. İhtiyacınızı değerlendirip belirttiğiniz kanaldan size ulaşacağız.",
            "Your information has been saved for us to review.",
          )}
        </p>
        {trackingReady && (
          <Link className="button" to={trackingHref}>
            {t("Talebimi takip et", "Track my request")}
            <ArrowRight size={17} />
          </Link>
        )}
        {receipt && (
          <small>
            {t("Başvuru numarası", "Reference")}:{" "}
            {receipt.slice(0, 8).toUpperCase()}
          </small>
        )}
        <button className="button outline" onClick={() => setStatus("idle")}>
          {t("Yeni talep oluştur", "Send another request")}
          <ArrowRight size={17} />
        </button>
      </div>
    );
  return (
    <form className="inquiry-form" onSubmit={submit}>
      <div className="form-grid">
        <label>
          {t("Adınız soyadınız", "Full name")} *
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            placeholder={t("Adınız ve soyadınız", "Your full name")}
          />
        </label>
        <label>
          {t("Telefon numaranız", "Phone number")} *
          <input
            type="tel"
            name="phone"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={30}
            placeholder="05XX XXX XX XX"
          />
        </label>
        <label>
          {t("E-posta adresiniz", "Email address")}
          <input
            type="email"
            name="email"
            autoComplete="email"
            maxLength={150}
            placeholder="ornek@eposta.com"
          />
        </label>
        <label>
          {t("İlgilendiğiniz hizmet", "Service of interest")}
          <select name="product" defaultValue={params.get("urun") || ""}>
            <option value="">
              {t("Birlikte karar verelim", "Let’s decide together")}
            </option>
            {content
              .filter((c) => c.type === "product")
              .map((c) => (
                <option key={c.id} value={c.title}>
                  {c.title}
                </option>
              ))}
            {params.get("urun") &&
              !content.some((c) => c.title === params.get("urun")) && (
                <option>{params.get("urun")}</option>
              )}
          </select>
        </label>
        <label>
          {t("Uygulama bölgesi / ilçe", "Project district / area")}
          <input
            name="district"
            maxLength={100}
            defaultValue={params.get("bolge") || ""}
            placeholder={t(
              "Örn. Etimesgut, Bağlıca",
              "e.g. Etimesgut, Bağlıca",
            )}
          />
        </label>
        <label>
          {t("Hizmet grubu", "Service family")}
          <select name="service" defaultValue={params.get("hizmet") || ""}>
            <option value="">
              {t("Henüz karar vermedim", "Help me decide")}
            </option>
            <option>Cam sistemleri</option>
            <option>Alüminyum sistemler</option>
            <option>Demir & çelik imalat</option>
            <option>Bakım ve servis</option>
          </select>
        </label>
        <label>
          {t("Yaklaşık ölçüler", "Approximate dimensions")}
          <input
            name="dimensions"
            maxLength={200}
            defaultValue={params.get("olcu") || ""}
            placeholder={t(
              "Örn. genişlik 4 m × yükseklik 2,5 m",
              "e.g. width 4 m × height 2.5 m",
            )}
          />
          <small>
            {t(
              "Ön değerlendirme içindir; yerinde ölçünün yerini almaz.",
              "For initial planning; site measurements are still required.",
            )}
          </small>
        </label>
        <label>
          {t("Planladığınız bütçe (isteğe bağlı)", "Planned budget (optional)")}
          <input
            name="budget"
            maxLength={100}
            placeholder={t(
              "Örn. keşif sonrası değerlendirelim",
              "e.g. discuss after site assessment",
            )}
          />
        </label>
        <label>
          {t("İletişim tercihiniz", "Preferred contact")}
          <select name="preferredContact">
            <option value="phone">{t("Telefon", "Phone")}</option>
            <option value="email">{t("E-posta", "Email")}</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>
      </div>
      <label>
        {t("Projenizi biraz anlatın", "Tell us about your project")} *
        <textarea
          defaultValue={
            params.get("mesaj") ||
            (params.get("renk")
              ? `${t("Renk tercihim", "Colour preference")}: ${params.get("renk")}`
              : "")
          }
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          placeholder={t(
            "Nerede uygulama yapılacak? Yaklaşık ölçüleri ve ihtiyacınızı yazabilirsiniz.",
            "Where is the work needed? Share approximate dimensions and what you need.",
          )}
        />
      </label>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="consent">
        <input type="checkbox" name="consent" required />
        <span>
          {t(
            "Talebimin yanıtlanması için kişisel verilerimin işlenmesini kabul ediyorum.",
            "I agree to the processing of my personal data to respond to my enquiry.",
          )}{" "}
          <Link to="/kurumsal/kvkk" target="_blank">
            {t("Aydınlatma metni", "Privacy notice")}
          </Link>
        </span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" disabled={status === "loading"} className="button">
        {status === "loading" ? (
          <LoaderCircle className="spin" size={18} />
        ) : null}
        {status === "loading"
          ? t("Gönderiliyor…", "Sending…")
          : t("Talebimi gönder", "Send my enquiry")}
        <ArrowUpRight size={18} />
      </button>
      <small className="form-note">
        {t(
          "Form bir sipariş veya ödeme işlemi oluşturmaz.",
          "Submitting this form does not place an order or process a payment.",
        )}
      </small>
    </form>
  );
}
function Contact({ quote = false }: { quote?: boolean }) {
  const { settings, t } = useSite();
  const phone = settings.phone,
    email = settings.email,
    address = settings.address,
    wa = String(settings.whatsapp || "").replace(/\D/g, "");
  return (
    <>
      <PageHead
        title={
          quote
            ? t(
                "Ölçüyü konuşalım, ihtiyacı netleştirelim.",
                "Let’s discuss the space and what you need.",
              )
            : t(
                "Dükkâna uğrayın. Ya da buradan yazın.",
                "Visit our shop. Or write to us here.",
              )
        }
        subtitle={t(
          "Etimesgut'taki tek dükkânımızdan sizinle doğrudan görüşüyoruz. Uygulama alanını ve beklentinizi paylaşmanız yeterli.",
          "We speak with you directly from our single shop in Etimesgut. Tell us about the space and what you need.",
        )}
        tag={
          quote
            ? t("KEŞİF NOTU", "SITE VISIT NOTE")
            : t("DOĞRUDAN İLETİŞİM", "DIRECT CONTACT")
        }
      />
      <section className="container section contact-layout">
        <div className="contact-copy">
          <h2>
            {String(
              settings.contactTitle ||
                t(
                  "Her güzel mekân, bir sohbetle başlar.",
                  "Every great space starts with a conversation.",
                ),
            )}
          </h2>
          <p>
            {String(
              settings.contactText ||
                t(
                  "Sorularınız, fikirleriniz ve projeleriniz için buradayız. Formu doldurun, talebinizi birlikte değerlendirelim.",
                  "We’re here for your questions, ideas and projects. Complete the form to start the conversation.",
                ),
            )}
          </p>
          <div className="contact-details">
            {phone && (
              <a href={`tel:${phone.replace(/[^+\d]/g, "")}`}>
                <Phone size={21} />
                <div>
                  <small>{t("TELEFON", "PHONE")}</small>
                  <strong>{phone}</strong>
                </div>
                <ArrowUpRight size={17} />
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`}>
                <Mail size={21} />
                <div>
                  <small>{t("E-POSTA", "EMAIL")}</small>
                  <strong>{email}</strong>
                </div>
                <ArrowUpRight size={17} />
              </a>
            )}
            {address && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={21} />
                <div>
                  <small>{t("ADRES", "ADDRESS")}</small>
                  <strong>{address}</strong>
                </div>
                <ArrowUpRight size={17} />
              </a>
            )}
            {settings.serviceAreas && (
              <div>
                <MapPin size={21} />
                <div>
                  <small>{t("HİZMET BÖLGELERİ", "SERVICE AREAS")}</small>
                  <strong>{settings.serviceAreas}</strong>
                </div>
              </div>
            )}
            {settings.workingHours && (
              <div>
                <Clock size={21} />
                <div>
                  <small>{t("ÇALIŞMA SAATLERİ", "OPENING HOURS")}</small>
                  <strong>{settings.workingHours}</strong>
                </div>
              </div>
            )}
          </div>
          {!phone && !email && !address && (
            <div className="contact-note">
              <Mail size={20} />
              <p>
                {t(
                  "İletişim formumuzdan bize yazabilirsiniz. Doğrudan iletişim bilgileri güncellendiğinde bu alanda yer alacak.",
                  "You can reach us using this form. Direct contact details will appear here when available.",
                )}
              </p>
            </div>
          )}
          {wa && (
            <a
              className="button outline"
              href={`https://wa.me/${wa}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={18} />
              WhatsApp
              <ArrowUpRight size={17} />
            </a>
          )}
        </div>
        <div className="form-panel">
          <h3>{t("Bize bir not bırakın.", "Leave us a note.")}</h3>
          <p>
            {t(
              "* ile işaretli alanlar zorunludur.",
              "Fields marked * are required.",
            )}
          </p>
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
function NotFound() {
  const { t } = useSite();
  return (
    <section className="not-found container">
      <Eyebrow>404</Eyebrow>
      <h1>{t("Burada yeni bir yol açalım.", "Let’s find a new way.")}</h1>
      <p>
        {t(
          "Aradığınız sayfa bulunamadı veya henüz yayına alınmadı.",
          "This page could not be found or has not been published yet.",
        )}
      </p>
      <Link to="/" className="button">
        {t("Ana sayfaya dön", "Return home")}
        <ArrowRight size={18} />
      </Link>
    </section>
  );
}
export default function App() {
  const [data, setData] = useState<{
      settings: Settings;
      content: Content[];
    } | null>(null),
    [error, setError] = useState(false),
    [en, setEnglish] = useState(
      () => localStorage.getItem("kilinc-locale") === "en",
    );
  const location = useLocation();
  const admin =
    location.pathname.startsWith("/yonetim") ||
    location.pathname.startsWith("/admin");
  useEffect(() => {
    fetch("/api/site")
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then(setData)
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    if (
      data &&
      Array.isArray(data.settings.languages) &&
      !data.settings.languages.includes("en")
    ) {
      setEnglish(false);
      localStorage.setItem("kilinc-locale", "tr");
    }
  }, [data]);
  useEffect(() => {
    document.documentElement.lang = en ? "en" : "tr";
    document.title = admin
      ? "Yönetim | Kılınç Dekorasyon"
      : en
        ? "Kılınç Dekorasyon — A new perspective on your space."
        : "Kılınç Dekorasyon — Mekânınıza yeni bir bakış.";
  }, [en, admin, location.pathname]);
  useEffect(() => {
    if (!data) return;
    const setMeta = (name: string, value: string, property = false) => {
      const selector = property
        ? `meta[property="${name}"]`
        : `meta[name="${name}"]`;
      let element = document.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(property ? "property" : "name", name);
        document.head.appendChild(element);
      }
      element.content = value;
    };
    setMeta(
      "robots",
      admin || location.pathname.startsWith("/hesabim")
        ? "noindex, nofollow"
        : "index, follow",
    );
    if (admin || location.pathname.startsWith("/hesabim")) {
      document.querySelector("link[rel=canonical]")?.remove();
      document.getElementById("site-structured-data")?.remove();
      return;
    }
    const found = data.content.find((c) => pathFor(c) === location.pathname);
    const labels: Record<string, [string, string]> = {
      "/urunler": [
        "Cam, Alüminyum ve Metal Sistemleri",
        "Glass, Aluminium & Metal Systems",
      ],
      "/galeri": ["Galeri ve Tasarım Konseptleri", "Gallery & Design Concepts"],
      "/hizmetler": ["Hizmetlerimiz", "Our Services"],
      "/fikir-defteri": ["Fikir Defteri", "Ideas Notebook"],
      "/dukkanimiz": ["Etimesgut’taki Dükkânımız", "Our Etimesgut Shop"],
      "/hizmet-alani": ["Hizmet Alanımız", "Our Service Area"],
      "/servis-talebi": ["Servis Talebi", "Service Request"],
      "/urun-karsilastir": ["Ürün Karşılaştırma", "Compare Systems"],
      "/projeler": [
        "Yaşam Alanları ve Tasarım Önerileri",
        "Living Spaces & Design Concepts",
      ],
      "/blog": [
        "Sistem Seçimi ve Bakım Rehberi",
        "Buying & Maintenance Guides",
      ],
      "/kurumsal": [
        "Hakkımızda ve Çalışma Yaklaşımımız",
        "About & Our Approach",
      ],
      "/bolgeler": ["Ankara Hizmet Bölgeleri", "Ankara Service Areas"],
      "/sistem-secici": [
        "Projenize Uygun Sistemi Bulun",
        "Find a System for Your Space",
      ],
      "/sikca-sorulan-sorular": [
        "Sıkça Sorulan Sorular",
        "Frequently Asked Questions",
      ],
      "/iletisim": ["İletişim", "Contact"],
      "/teklif-al": ["Teklif ve Keşif Talebi", "Quote & Site Assessment"],
      "/katalog": ["Dijital Sistem Kataloğu", "Digital System Catalogue"],
    };
    const brand = String(data.settings.companyName || "Kılınç Dekorasyon");
    const title = found
      ? found.seoTitle ||
        `${en && found.titleEn ? found.titleEn : found.title} | ${brand}`
      : labels[location.pathname]
        ? `${labels[location.pathname][en ? 1 : 0]} | ${brand}`
        : String(data.settings.seoTitle || brand);
    const description = found
      ? found.seoDescription ||
        (en && found.summaryEn ? found.summaryEn : found.summary)
      : String(
          data.settings.seoDescription ||
            "Cam, alüminyum ve metal sistemleri. Projenize özel planlama ve uygulama.",
        );
    document.title = title;
    setMeta("description", description);
    setMeta("og:title", title, true);
    setMeta("og:description", description, true);
    setMeta("og:type", found?.type === "article" ? "article" : "website", true);
    setMeta("og:locale", en ? "en_GB" : "tr_TR", true);
    const configured = String(data.settings.websiteUrl || "");
    const origin = /^https:\/\//i.test(configured)
      ? new URL(configured).origin
      : "";
    let canonical = document.querySelector<HTMLLinkElement>(
      "link[rel=canonical]",
    );
    if (origin) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = origin + location.pathname;
      setMeta("og:url", canonical.href, true);
      setMeta(
        "og:image",
        new URL(
          found?.image || String(data.settings.heroImage || "/images/hero.svg"),
          origin,
        ).href,
        true,
      );
    } else {
      canonical?.remove();
      document.querySelector('meta[property="og:url"]')?.remove();
      document.querySelector('meta[property="og:image"]')?.remove();
    }
    const graph: Record<string, unknown>[] = [];
    if (location.pathname === "/")
      graph.push({
        "@type": "LocalBusiness",
        name: brand,
        description,
        ...(origin ? { url: origin } : {}),
        ...(data.settings.phone ? { telephone: data.settings.phone } : {}),
        ...(data.settings.address ? { address: data.settings.address } : {}),
        ...(data.settings.email ? { email: data.settings.email } : {}),
      });
    if (location.pathname === "/sikca-sorulan-sorular")
      graph.push({
        "@type": "FAQPage",
        mainEntity: data.content
          .filter((c) => c.type === "faq")
          .map((c) => ({
            "@type": "Question",
            name: en && c.titleEn ? c.titleEn : c.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: en && c.bodyEn ? c.bodyEn : c.body,
            },
          })),
      });
    if (found?.type === "article")
      graph.push({
        "@type": "Article",
        headline: en && found.titleEn ? found.titleEn : found.title,
        description,
        datePublished: found.createdAt,
        dateModified: found.updatedAt,
        ...(origin ? { url: origin + location.pathname } : {}),
      });
    let structured = document.getElementById("site-structured-data");
    if (graph.length) {
      if (!structured) {
        structured = document.createElement("script");
        structured.id = "site-structured-data";
        structured.setAttribute("type", "application/ld+json");
        document.head.appendChild(structured);
      }
      structured.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": graph,
      }).replace(/</g, "\\u003c");
    } else structured?.remove();
  }, [data, location.pathname, en, admin]);
  useEffect(() => {
    const root = document.documentElement;
    for (const [key, variable] of [
      ["primaryColor", "--green"],
      ["accentColor", "--cream"],
    ]) {
      const color = String(data?.settings[key] || "");
      if (/^#[0-9a-f]{6}$/i.test(color))
        root.style.setProperty(variable, color);
      else root.style.removeProperty(variable);
    }
  }, [data]);
  const setEn = (v: boolean) => {
    setEnglish(v);
    localStorage.setItem("kilinc-locale", v ? "en" : "tr");
  };
  if (admin)
    return (
      <Suspense
        fallback={
          <div className="loading-screen">
            <LoaderCircle className="spin" />
            <p>Yönetim paneli yükleniyor…</p>
          </div>
        }
      >
        <AdminApp />
      </Suspense>
    );
  if (!data)
    return (
      <div className="loading-screen">
        {error ? (
          <>
            <h2>Bağlantı kurulamadı.</h2>
            <p>Sunucuya erişilemiyor. Lütfen yeniden deneyin.</p>
            <button className="button" onClick={() => window.location.reload()}>
              Yeniden dene
              <ArrowRight size={18} />
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Yeni bir bakış açısı yükleniyor…</p>
          </>
        )}
      </div>
    );
  const ctx: Context = {
    ...data,
    en,
    setEn,
    t: (tr, eng) => (en ? eng : tr),
    local: (c, k) => (en ? String(c[`${k}En` as keyof Content] || c[k]) : c[k]),
  };
  return (
    <SiteContext.Provider value={ctx}>
      <div className="local-studio">
        <ScrollTop />
        <a className="skip-link" href="#main">
          {en ? "Skip to content" : "İçeriğe geç"}
        </a>
        <Header />
        <main id="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/hesabim/*"
              element={
                <Suspense
                  fallback={
                    <div className="loading-screen">
                      Müşteri paneli yükleniyor…
                    </div>
                  }
                >
                  <CustomerPortal
                    key={location.pathname + location.search + location.hash}
                  />
                </Suspense>
              }
            />
            <Route path="/hizmetler" element={<Products />} />
            <Route
              path="/urunler"
              element={<Navigate to="/hizmetler" replace />}
            />
            <Route path="/urun-karsilastir" element={<ProductComparison />} />
            <Route path="/fikir-defteri" element={<LocalGallery />} />
            <Route
              path="/galeri"
              element={<Navigate to="/fikir-defteri" replace />}
            />
            <Route
              path="/proje-birimi"
              element={<Navigate to="/teklif-al" replace />}
            />
            <Route
              path="/servis-talebi"
              element={
                <>
                  <LocalPageHead
                    title={en ? "Service request" : "Servis Talebi"}
                  />
                  <section className="ls-container ls-service-form">
                    <div>
                      <h2>
                        {en
                          ? "How can we help?"
                          : "Size nasıl yardımcı olabiliriz?"}
                      </h2>
                      <p>
                        {en
                          ? "Tell us about the system and the support you need."
                          : "Sisteminiz ve destek ihtiyacınız hakkında bilgi verin. Talebiniz yönetim panelinden takip edilir."}
                      </p>
                    </div>
                    <InquiryForm service />
                  </section>
                </>
              }
            />
            <Route
              path="/kurumsal/terimler-sozlugu"
              element={<LocalInformation kind="glossary" />}
            />
            <Route
              path="/kurumsal/renk-kartelasi"
              element={<LocalInformation kind="colours" />}
            />
            <Route
              path="/kurumsal/olcu-rehberi"
              element={<LocalInformation kind="measuring" />}
            />
            <Route
              path="/kurumsal/uygulama-sureci"
              element={<LocalInformation kind="process" />}
            />
            <Route
              path="/kurumsal/garanti-servis"
              element={<LocalInformation kind="warranty" />}
            />
            <Route path="/sistem-secici" element={<SystemFinder />} />
            <Route path="/hizmet-alani" element={<LocalServiceAreas />} />
            <Route
              path="/bolgeler"
              element={<Navigate to="/hizmet-alani" replace />}
            />
            <Route path="/bolgeler/:slug" element={<Detail type="region" />} />
            <Route path="/urunler/:slug" element={<Detail type="product" />} />
            <Route
              path="/projeler"
              element={<Navigate to="/fikir-defteri" replace />}
            />
            <Route path="/projeler/:slug" element={<Detail type="project" />} />
            <Route path="/blog" element={<Listing type="article" />} />
            <Route path="/blog/:slug" element={<Detail type="article" />} />
            <Route path="/dukkanimiz" element={<Corporate />} />
            <Route
              path="/kurumsal"
              element={<Navigate to="/dukkanimiz" replace />}
            />
            <Route path="/kurumsal/:slug" element={<Detail type="page" />} />
            <Route path="/sikca-sorulan-sorular" element={<FAQ />} />
            <Route path="/iletisim" element={<Contact />} />
            <Route path="/teklif-al" element={<Contact quote />} />
            <Route path="/is-ortakligi" element={<NotFound />} />
            <Route path="/katalog" element={<Catalog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <VisitorConsent />
        {data.settings.whatsapp && (
          <a
            className="whatsapp-float"
            href={`https://wa.me/${data.settings.whatsapp.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            aria-label="WhatsApp"
          >
            <MessageCircle size={25} />
          </a>
        )}
      </div>
    </SiteContext.Provider>
  );
}
