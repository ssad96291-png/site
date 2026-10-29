import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Grid2X2,
  Home,
  Image,
  Layers,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  Minus,
  Palette,
  Pause,
  Phone,
  Play,
  Plus,
  Ruler,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sprout,
  UserRound,
  X,
  ZoomIn,
} from "lucide-react";
import type { Content, Settings } from "./types";
import { contentImage, contentPath, useSite } from "./site-context";
import { PhotoJournal } from "./PhotoJournal";

export function DetailedBrand({ light = false }: { light?: boolean }) {
  const { settings } = useSite();
  return (
    <Link
      to="/"
      className={`rs-brand ${light ? "rs-brand-light" : ""}`}
      aria-label="Kılınç Dekorasyon ana sayfa"
    >
      <span className="rs-brand-mark" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>{settings.logoText || "KILINÇ"}</strong>
        <small>DEKORASYON</small>
      </span>
    </Link>
  );
}
export function DetailedHeader() {
  const { settings, content, t, en, setEn, local } = useSite();
  const location = useLocation();
  const [open, setOpen] = useState(""),
    [mobile, setMobile] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState(""),
    [compact, setCompact] = useState(false);
  useEffect(() => {
    setOpen("");
    setMobile(false);
    setSearch(false);
  }, [location.pathname, location.search]);
  useEffect(() => {
    const scroll = () => setCompact(window.scrollY > 70);
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen("");
        setSearch(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("scroll", scroll);
      window.removeEventListener("keydown", key);
    };
  }, []);
  const items = [
    {
      label: t("Ürünler", "Systems"),
      href: "/hizmetler",
      links: content
        .filter((c) => c.type === "product")
        .map((c) => ({ label: local(c, "title"), href: contentPath(c) })),
    },
    ...(settings.showProjects !== false
      ? [
          {
            label: t("Projeler", "Projects"),
            href: "/projeler",
            links: [
              {
                label: t("Mekân çözümleri", "Space ideas"),
                href: "/projeler",
              },
              ...content
                .filter((c) => c.type === "project")
                .map((c) => ({
                  label: local(c, "title"),
                  href: contentPath(c),
                })),
            ],
          },
        ]
      : []),
    {
      label: t("Galeri", "Gallery"),
      href: "/fikir-defteri",
      links: [],
    },
    {
      label: t("Proje & teklif", "Project & quote"),
      href: "/proje-teklif",
      links: [
        { label: t("Proje birimi", "Project office"), href: "/proje-birimi" },
        {
          label: t("Proje & fiyat teklifi", "Project & price quotation"),
          href: "/proje-teklif",
        },
        { label: t("Sistem seçici", "System finder"), href: "/sistem-secici" },
        {
          label: t("Sistemleri karşılaştırın", "Compare systems"),
          href: "/urun-karsilastir",
        },
        { label: t("Kataloglar", "Catalogues"), href: "/katalog" },
        {
          label: t("Ön ölçü rehberi", "Measuring guide"),
          href: "/kurumsal/olcu-rehberi",
        },
        {
          label: t("Talebinizi takip edin", "Track your request"),
          href: "/hesabim",
        },
      ],
    },
    {
      label: t("Kurumsal", "Company"),
      href: "/kurumsal",
      links: visibleCorporateHub(content, settings).map((item) => ({
        label: t(item.title, item.en),
        href: item.href,
      })),
    },
    {
      label: t("İletişim", "Contact"),
      href: "/iletisim",
      links: [
        { label: t("Keşif ve teklif", "Quote & survey"), href: "/teklif-al" },
        {
          label: t("Servis talebi", "Service request"),
          href: "/servis-talebi",
        },
        ...(settings.showRegions !== false
          ? [
              {
                label: t("Hizmet bölgeleri", "Service areas"),
                href: "/hizmet-alani",
              },
              ...content
                .filter((c) => c.type === "region")
                .map((c) => ({
                  label: local(c, "title").split(" için")[0],
                  href: contentPath(c),
                })),
            ]
          : []),
      ],
    },
  ];
  return (
    <>
      <header className={`rs-header ${compact ? "is-compact" : ""}`}>
        <div className="rs-header-shell">
          <div className="rs-masthead">
            <DetailedBrand />
            <div className="rs-language">
              <Link
                to="/proje-teklif"
                className="rs-project-quick-link"
                aria-label={t(
                  "Proje & fiyat teklifi",
                  "Project & price quotation",
                )}
                title={t("Proje & fiyat teklifi", "Project & price quotation")}
              >
                <FileText size={17} />
              </Link>
              <Link
                to="/hesabim"
                className="rs-account-link"
                aria-label={t("Müşteri paneli", "Customer account")}
                title={t("Müşteri paneli", "Customer account")}
              >
                <UserRound size={17} />
              </Link>
              {(!Array.isArray(settings.languages) ||
                settings.languages.includes("en")) && (
                <button
                  onClick={() => setEn(!en)}
                  aria-label={en ? "Türkçeye geç" : "Switch to English"}
                >
                  <span className={!en ? "active" : ""}>TR</span>
                  <span className={en ? "active" : ""}>EN</span>
                </button>
              )}
              <button
                aria-label={t("Sitede ara", "Search")}
                onClick={() => setSearch(true)}
              >
                <Search size={16} />
              </button>
            </div>
            <button
              className="rs-menu-toggle"
              aria-label={t("Menüyü aç/kapat", "Toggle menu")}
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              {mobile ? <X /> : <Menu />}
            </button>
          </div>
          <nav
            className={`rs-nav ${mobile ? "is-open" : ""}`}
            aria-label={t("Ana menü", "Main navigation")}
          >
            <Link
              className="rs-home-link"
              to="/"
              aria-label={t("Ana sayfa", "Home")}
            >
              <Home size={21} />
            </Link>
            {items.map((item) => (
              <div
                key={item.href}
                className={`rs-nav-item ${open === item.href ? "is-open" : ""} ${location.pathname.startsWith(item.href) ? "is-current" : ""}`}
              >
                <div>
                  <Link to={item.href}>{item.label}</Link>
                  {item.links.length > 0 && (
                    <button
                      aria-label={`${item.label} ${t("alt menüsü", "submenu")}`}
                      aria-expanded={open === item.href}
                      onClick={() =>
                        setOpen(open === item.href ? "" : item.href)
                      }
                    >
                      <ChevronDown size={10} />
                    </button>
                  )}
                </div>
                {item.links.length > 0 && (
                  <div className="rs-dropdown">
                    {item.links.map((link) => (
                      <Link to={link.href} key={link.href}>
                        {link.label}
                        <ChevronRight size={11} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </header>
      {search && (
        <AccessibleDialog
          label={t("Sitede ara", "Search website")}
          onClose={() => setSearch(false)}
        >
          <h2>{t("Ne aramıştınız?", "What are you looking for?")}</h2>
          <label className="rs-search">
            <Search size={19} />
            <input
              autoFocus
              placeholder={t(
                "Ürün, bölge veya rehber ara…",
                "Search systems, regions or guides…",
              )}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="rs-search-results">
            {content
              .filter(
                (c) =>
                  c.type !== "faq" &&
                  `${local(c, "title")} ${local(c, "summary")}`
                    .toLocaleLowerCase("tr")
                    .includes(query.toLocaleLowerCase("tr")),
              )
              .slice(0, 12)
              .map((c) => (
                <Link to={contentPath(c)} key={c.id}>
                  {local(c, "title")}
                  <ArrowUpRight size={17} />
                </Link>
              ))}
          </div>
        </AccessibleDialog>
      )}
    </>
  );
}
function AccessibleDialog({
  children,
  label,
  onClose,
}: {
  children: ReactNode;
  label: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("input,button,a");
    first?.focus();
    const keys = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const all = Array.from(
          node?.querySelectorAll<HTMLElement>(
            'button,a,input,select,[tabindex="0"]',
          ) || [],
        ).filter((el) => !el.hasAttribute("disabled"));
        const first = all[0],
          last = all.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          last?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first?.focus();
          e.preventDefault();
        }
      }
    };
    node?.addEventListener("keydown", keys);
    return () => {
      document.body.style.overflow = old;
      node?.removeEventListener("keydown", keys);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="rs-dialog-backdrop" onClick={onClose}>
      <div
        ref={ref}
        className="rs-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="rs-dialog-close"
          onClick={onClose}
          aria-label="Kapat"
        >
          <X />
        </button>
        {children}
      </div>
    </div>
  );
}
export function DetailedPageHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { t } = useSite();
  return (
    <>
      <section className="rs-page-head">
        <div className="rs-container">
          <h1>{title}</h1>
          <div>
            <Link to="/">{t("Ana Sayfa", "Home")}</Link>
            <ChevronRight size={11} />
            <span>{title}</span>
          </div>
        </div>
      </section>
      {subtitle && <p className="rs-page-intro rs-container">{subtitle}</p>}
    </>
  );
}
function ImageTile({
  item,
  large = false,
}: {
  item: Content;
  large?: boolean;
}) {
  const { local } = useSite();
  return (
    <Link
      to={contentPath(item)}
      className={`rs-image-tile ${large ? "large" : ""}`}
    >
      <img
        src={contentImage(item)}
        alt={item.imageAlt || local(item, "title")}
        loading="lazy"
      />
      <div>
        <h3>{local(item, "title")}</h3>
        <p>{local(item, "summary")}</p>
        <ArrowUpRight size={19} />
      </div>
    </Link>
  );
}
export function DetailedHome() {
  const { settings, content, t, en, local } = useSite();
  const [slide, setSlide] = useState(0),
    [paused, setPaused] = useState(false);
  const products = content.filter((c) => c.type === "product");
  const ids = ["katlanir-cam-balkon", "surme-cam-sistemleri", "giyotin-cam"];
  const primary = ids
    .map((id) => products.find((p) => p.slug === id))
    .filter(Boolean) as Content[];
  const garden = products
    .filter((p) => /pergola|bahçesi/i.test(p.title))
    .slice(0, 2);
  const slides = [
    {
      title: en
        ? String(settings.heroTitleEn || "A space of your own.")
        : settings.heroTitle,
      subtitle: en
        ? String(
            settings.heroSubtitleEn ||
              "Glass, aluminium and metal solutions designed for your space.",
          )
        : settings.heroSubtitle,
      image:
        !settings.heroImage || settings.heroImage === "/images/hero.svg"
          ? "/images/original-terrace.png"
          : String(settings.heroImage),
      href: "/hizmetler",
      tag: t("CAM · ALÜMİNYUM · METAL", "GLASS · ALUMINIUM · METAL"),
      photo: String(settings.heroImage || "").includes("/photo-"),
    },
    {
      title: t(
        "Her mevsim,\nyeni bir yaşam alanı.",
        "A space for\nevery season.",
      ),
      subtitle: t(
        "Teras ve bahçeniz için ihtiyaca özel cam ve gölgelendirme çözümlerini keşfedin.",
        "Discover glazing and shading options for your terrace and garden.",
      ),
      image: "/images/original-pergola.png",
      href: "/fikir-defteri",
      tag: t("BAHÇE & TERAS", "GARDEN & TERRACE"),
    },
    {
      title: t(
        "İyi bir proje,\nbirlikte başlar.",
        "Great projects\nstart together.",
      ),
      subtitle: t(
        "Mimarlar, işletmeler ve konut sahipleri için keşiften teslimata açık bir süreç.",
        "A clear journey from survey to handover, for homes and commercial spaces.",
      ),
      image: "/images/aluminium-facade.svg",
      href: "/proje-teklif",
      tag: t("PROJE & FİYAT TEKLİFİ", "PROJECT & PRICE QUOTATION"),
    },
  ];
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const timer = setInterval(() => {
      if (!document.hidden) setSlide((s) => (s + 1) % slides.length);
    }, 7500);
    return () => clearInterval(timer);
  }, [paused]);
  const current = slides[slide];
  return (
    <>
      <section
        className="rs-hero"
        aria-roledescription="carousel"
        aria-label={t("Öne çıkan çözümler", "Featured solutions")}
      >
        <div className="rs-container rs-hero-layout">
          <div className="rs-hero-copy">
            <small>
              <span aria-hidden="true" />
              {current.tag}
            </small>
            <h1>{current.title}</h1>
            <p>{current.subtitle}</p>
            <div className="rs-hero-actions">
              <Link className="rs-button" to={current.href}>
                {t("Sistemlerimizi keşfedin", "Explore our systems")}
                <ArrowUpRight size={18} />
              </Link>
              <Link className="rs-text-link" to="/proje-teklif">
                {t("Proje & fiyat teklifi", "Project & price quotation")}
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="rs-hero-note">
              <Ruler size={20} strokeWidth={1.4} />
              <p>
                {t(
                  "Seçim, yerinde ölçü ve uygulama koşullarıyla netleşir.",
                  "The final choice takes shape through site measurements and project conditions.",
                )}
              </p>
            </div>
          </div>
          <div className="rs-hero-visual">
            <div className="rs-frame-motif" aria-hidden="true">
              <span />
              <span />
            </div>
            <img
              key={current.image}
              src={current.image}
              alt={
                current.photo
                  ? t(
                      "Gün batımında cam balkon · fotoğraftan AI ile düzenlendi",
                      "Sunset balcony · AI-edited from a photograph",
                    )
                  : t(
                      "Mimari tasarım görselleştirmesi",
                      "Architectural design visualization",
                    )
              }
              fetchPriority="high"
            />
            <div className="rs-hero-controls">
              <button
                onClick={() => setSlide((slide + 2) % 3)}
                aria-label="Önceki slayt"
              >
                <ChevronLeft size={17} />
              </button>
              {slides.map((s, i) => (
                <button
                  className={slide === i ? "active" : ""}
                  aria-label={`${i + 1}. slayt`}
                  aria-current={slide === i ? "true" : undefined}
                  onClick={() => setSlide(i)}
                  key={s.href}
                >
                  {String(i + 1).padStart(2, "0")}
                </button>
              ))}
              <button
                onClick={() => setSlide((slide + 1) % 3)}
                aria-label="Sonraki slayt"
              >
                <ChevronRight size={17} />
              </button>
              <button
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Slaytları oynat" : "Slaytları duraklat"}
              >
                {paused ? <Play size={13} /> : <Pause size={13} />}
              </button>
            </div>
            <span className="rs-concept-label">
              {current.photo
                ? t("Fotoğraftan düzenlendi · AI", "AI-edited photograph")
                : t("Tasarım görselleştirmesi", "Design visualization")}
            </span>
          </div>
        </div>
      </section>
      <section
        className="rs-container rs-start-strip"
        aria-label={t("Projeniz için kısa yollar", "Project shortcuts")}
      >
        <Link to="/sistem-secici">
          <span className="rs-start-number" aria-hidden="true">
            01
          </span>
          <span>
            <strong>
              {t("İhtiyacınızı belirleyin", "Find your starting point")}
            </strong>
            <small>
              {t(
                "Sistem seçici ile seçenekleri daraltın",
                "Explore options with the system finder",
              )}
            </small>
          </span>
          <ArrowUpRight size={20} />
        </Link>
        <Link to="/proje-teklif">
          <span className="rs-start-number" aria-hidden="true">
            02
          </span>
          <span>
            <strong>{t("Detayları paylaşın", "Share the details")}</strong>
            <small>
              {t(
                "Fiyat sorun, çizim ve proje dosyalarınızı iletin",
                "Ask for pricing and share your drawings or project files",
              )}
            </small>
          </span>
          <ArrowUpRight size={20} />
        </Link>
        <Link to="/hesabim">
          <span className="rs-start-number" aria-hidden="true">
            03
          </span>
          <span>
            <strong>{t("Talebinizi izleyin", "Follow your request")}</strong>
            <small>
              {t(
                "Süreç ve belgeler müşteri panelinizde",
                "View progress and documents in your account",
              )}
            </small>
          </span>
          <ArrowUpRight size={20} />
        </Link>
      </section>
      <section className="rs-container rs-section rs-home-systems">
        <div className="rs-heading">
          <small>
            {t(
              "YAŞAM ALANINIZA DEĞER KATAN SİSTEMLER",
              "SYSTEMS THAT COMPLETE YOUR SPACE",
            )}
          </small>
          <h2>{t("Mekânınıza göre seçin.", "Choose for your space.")}</h2>
          <p>
            {t(
              "Kullanım alışkanlıklarınıza ve yapınızın koşullarına uygun sistemi birlikte seçelim.",
              "Find a system that suits the way you live and the character of your building.",
            )}
          </p>
        </div>
        <div className="rs-feature-grid">
          {primary.map((p) => (
            <ImageTile key={p.id} item={p} />
          ))}
        </div>
        <div className="rs-center">
          <Link to="/hizmetler" className="rs-outline">
            {t("Tüm ürünler", "All systems")}
            <ArrowRight size={16} />
          </Link>
          <Link to="/sistem-secici" className="rs-text-link">
            {t("Hangi sistem bana uygun?", "Which system suits me?")}
          </Link>
        </div>
      </section>
      <section className="rs-container rs-section rs-garden">
        <div className="rs-heading">
          <h2>
            {t("Bahçe · Teras Yaşam Alanları", "Garden · Terrace Living")}
          </h2>
          <p>
            {t(
              "Açık alanınızı günün daha çok anında kullanmak için tasarlanan çözümler.",
              "Make more room for everyday moments in your outdoor space.",
            )}
          </p>
        </div>
        <div className="rs-feature-grid two">
          {garden.map((p) => (
            <ImageTile large key={p.id} item={p} />
          ))}
        </div>
      </section>
      <PhotoJournal />
      <section className="rs-container rs-material-strip">
        <div>
          <small>{t("CAMDAN METALE", "FROM GLASS TO METAL")}</small>
          <h2>
            {settings.servicesTitle
              ? String(settings.servicesTitle)
              : t(
                  "Projenize bütüncül bir yaklaşım.",
                  "One project. A complete approach.",
                )}
          </h2>
        </div>
        <Link to="/hizmetler?grup=aluminium">
          <img src="/images/photo-entrance-edited.webp" alt="" loading="lazy" />
          <span>
            {t("Alüminyum sistemler", "Aluminium systems")}
            <ArrowRight size={16} />
          </span>
        </Link>
        <Link to="/hizmetler?grup=metal">
          <img
            src="/images/photo-garden-gate-edited.webp"
            alt=""
            loading="lazy"
          />
          <span>
            {t("Demir & çelik imalat", "Steel & metalwork")}
            <ArrowRight size={16} />
          </span>
        </Link>
      </section>
      <section className="rs-catalog-section">
        <div className="rs-container">
          <div className="rs-heading">
            <small>{t("FİKİRDEN PROJEYE", "FROM IDEAS TO PROJECTS")}</small>
            <h2>
              {t("Sistemleri yakından tanıyın.", "Get to know the systems.")}
            </h2>
          </div>
          <CatalogCards />
        </div>
      </section>
      <section className="rs-container rs-project-banner">
        <img
          src="/images/original-terrace.png"
          alt={t("Teras tasarım konsepti", "Terrace design concept")}
          loading="lazy"
        />
        <div>
          <small>
            {t("PROJE & FİYAT TEKLİFİ", "PROJECT & PRICE QUOTATION")}
          </small>
          <h2>
            {t(
              "İyi bir uygulama,\ndoğru planlamayla başlar.",
              "Good installation\nstarts with good planning.",
            )}
          </h2>
          <p>
            {t(
              "Fiyat sorularınızı ve proje dosyalarınızı paylaşın. Etimesgut’taki tek dükkânımızdan ihtiyacınızı inceleyip size özel teklif hazırlayalım.",
              "Share your pricing questions and project files. We review your needs from our single shop in Etimesgut and prepare a quotation for you.",
            )}
          </p>
          <Link to="/proje-teklif" className="rs-button">
            {t(
              "Dosya gönderin, teklif isteyin",
              "Send your files and request a quote",
            )}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      {settings.showArticles !== false && (
        <section className="rs-container rs-section">
          <div className="rs-section-title">
            <h2>{t("Bilgi & İlham", "Knowledge & Inspiration")}</h2>
            <Link to="/blog">
              {t("Tüm rehberler", "All guides")}
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="rs-guide-grid">
            {content
              .filter((c) => c.type === "article")
              .slice(0, 3)
              .map((c) => (
                <Link key={c.id} to={contentPath(c)}>
                  <img
                    src={contentImage(c)}
                    alt={c.imageAlt || local(c, "title")}
                    loading="lazy"
                  />
                  <small>{c.category}</small>
                  <h3>{local(c, "title")}</h3>
                  <p>{local(c, "summary")}</p>
                  <span>
                    {t("Devamını oku", "Read more")}
                    <ArrowRight size={14} />
                  </span>
                </Link>
              ))}
          </div>
        </section>
      )}
      {settings.showFaq !== false && (
        <section className="rs-faq-band">
          <div className="rs-container">
            <div className="rs-section-title">
              <h2>{t("Aklınızdaki sorular", "Your questions")}</h2>
              <Link to="/sikca-sorulan-sorular">
                {t("Tüm sorular", "All questions")}
                <ArrowRight size={15} />
              </Link>
            </div>
            <div className="rs-faq-grid">
              {content
                .filter((c) => c.type === "faq")
                .slice(0, 4)
                .map((c) => (
                  <details key={c.id}>
                    <summary>
                      {local(c, "title")}
                      <Plus size={16} />
                    </summary>
                    <p>{local(c, "body")}</p>
                  </details>
                ))}
            </div>
          </div>
        </section>
      )}
      <section className="rs-contact-band rs-container">
        <span>
          <small>{t("SİZE ÖZEL BİR ÇÖZÜM", "A SOLUTION FOR YOU")}</small>
          <h2>
            {t(
              "Mekânınızı birlikte dönüştürelim.",
              "Let’s transform your space.",
            )}
          </h2>
        </span>
        <Link className="rs-button" to="/teklif-al">
          {t("Keşif ve teklif isteyin", "Request a quote")}
          <ArrowRight size={17} />
        </Link>
      </section>
    </>
  );
}
const groups = [
  {
    id: "folding",
    tr: "Katlanır Cam Balkon Sistemleri",
    en: "Folding Balcony Glazing",
  },
  {
    id: "guillotine",
    tr: "Giyotin Cam Sistemleri",
    en: "Vertical Sliding Glass",
  },
  { id: "sliding", tr: "Sürme Cam Sistemleri", en: "Sliding Glass Systems" },
  {
    id: "outdoor",
    tr: "Pergola ve Kış Bahçesi Sistemleri",
    en: "Pergolas & Winter Gardens",
  },
  {
    id: "aluminium",
    tr: "Alüminyum ve Cephe Sistemleri",
    en: "Aluminium & Façades",
  },
  {
    id: "metal",
    tr: "Demir, Çelik ve Korkuluk Sistemleri",
    en: "Steel, Metal & Balustrades",
  },
  { id: "other", tr: "Tamamlayıcı Sistemler", en: "Complementary Systems" },
];
function groupOf(c: Content) {
  if (/demir|çelik|ferforje|yangın|metal|korkuluk/i.test(c.title))
    return "metal";
  if (/alüminyum|cephe|ofis|doğrama/i.test(c.title)) return "aluminium";
  if (/pergola|bahçe|gölge/i.test(c.title)) return "outdoor";
  if (/giyotin/i.test(c.title)) return "guillotine";
  if (/sürme|surme/i.test(c.title)) return "sliding";
  if (/katlanır|yalıtımlı/i.test(c.title)) return "folding";
  return "other";
}
export function DetailedProducts() {
  const { content, t, local } = useSite();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(""),
    [expanded, setExpanded] = useState<string[]>(["folding"]);
  const family = params.get("grup") || "";
  useEffect(() => {
    if (family) setExpanded(groups.map((g) => g.id));
  }, [family]);
  const items = content
    .filter((c) => c.type === "product")
    .filter(
      (c) =>
        !family ||
        (family === "glass"
          ? !["metal", "aluminium"].includes(groupOf(c))
          : groupOf(c) === family),
    )
    .filter((c) =>
      `${local(c, "title")} ${c.category}`
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
    );
  return (
    <>
      <DetailedPageHead title={t("Ürünler", "Systems")} />
      <section className="rs-container rs-products">
        <div className="rs-list-toolbar">
          <p>
            {t(
              "Mekânınıza uygun sistemi keşfedin.",
              "Explore a system for your space.",
            )}
          </p>
          <label className="rs-search">
            <Search size={16} />
            <input
              aria-label={t("Ürün ara", "Search systems")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Sistem ara…", "Search systems…")}
            />
          </label>
        </div>
        {family && (
          <div className="rs-filter-note">
            {t("Seçili hizmet grubu", "Selected family")}:{" "}
            {family === "glass"
              ? t("Cam sistemleri", "Glass systems")
              : family === "metal"
                ? t("Metal sistemler", "Metal systems")
                : t("Alüminyum sistemler", "Aluminium systems")}
            <Link to="/hizmetler">
              {t("Tümünü göster", "Show all")}
              <X size={13} />
            </Link>
          </div>
        )}
        {groups.map((g) => {
          const rows = items.filter((c) => groupOf(c) === g.id);
          if (!rows.length) return null;
          const isOpen = expanded.includes(g.id) || !!query;
          return (
            <section className="rs-product-group" key={g.id}>
              <h2>
                <button
                  aria-expanded={isOpen}
                  aria-controls={`group-${g.id}`}
                  onClick={() =>
                    setExpanded((all) =>
                      all.includes(g.id)
                        ? all.filter((id) => id !== g.id)
                        : [...all, g.id],
                    )
                  }
                >
                  {isOpen ? <Minus size={14} /> : <Plus size={14} />}{" "}
                  {t(g.tr, g.en)}
                  <span>{rows.length}</span>
                </button>
              </h2>
              {isOpen && (
                <div id={`group-${g.id}`} className="rs-product-grid">
                  {rows.map((c) => (
                    <Link to={contentPath(c)} key={c.id}>
                      <div>
                        <img
                          src={contentImage(c)}
                          alt={c.imageAlt || local(c, "title")}
                          loading="lazy"
                        />
                        <span>
                          <ArrowUpRight size={17} />
                        </span>
                      </div>
                      <small>{c.category}</small>
                      <h3>{local(c, "title")}</h3>
                      <p>{local(c, "summary")}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
        {!items.length && (
          <p className="rs-empty">
            {t("Bu aramada ürün bulunamadı.", "No systems found.")}
          </p>
        )}
        <div className="rs-dual-links">
          <Link to="/urun-karsilastir">
            <Layers size={23} />
            <span>{t("Sistemleri karşılaştırın", "Compare systems")}</span>
            <ArrowRight />
          </Link>
          <Link to="/sistem-secici">
            <SlidersHorizontal size={23} />
            <span>{t("Sistem seçici", "System finder")}</span>
            <ArrowRight />
          </Link>
        </div>
      </section>
    </>
  );
}
function CatalogCards() {
  const { t, en } = useSite();
  return (
    <div className="rs-catalog-grid">
      {[
        {
          name: t("Genel Sistem Kataloğu", "Complete System Catalogue"),
          family: "all",
          image: "/images/original-balcony.png",
          color: "sage",
        },
        {
          name: t("Bahçe & Teras Çözümleri", "Garden & Terrace Solutions"),
          family: "outdoor",
          image: "/images/original-pergola.png",
          color: "sand",
        },
        {
          name: t("Alüminyum Sistemler", "Aluminium Systems"),
          family: "aluminium",
          image: "/images/aluminium-facade.svg",
          color: "blue",
        },
        {
          name: t("Metal & Çelik İmalat", "Steel & Metalwork"),
          family: "metal",
          image: "/images/metal-gate.svg",
          color: "clay",
        },
      ].map((c, i) => (
        <a
          key={c.family}
          href={`/api/catalog.pdf?lang=${en ? "en" : "tr"}&family=${c.family}`}
          className={`rs-catalog-card ${c.color}`}
          download
        >
          <div className="rs-catalog-top">
            <small>KILINÇ / {t("SİSTEM REHBERİ", "SYSTEM GUIDE")}</small>
            <span>0{i + 1}</span>
            <h3>{c.name}</h3>
          </div>
          <img src={c.image} alt="" loading="lazy" />
          <div className="rs-catalog-bottom">
            <span>{t("PDF İNDİR", "DOWNLOAD PDF")}</span>
            <Download size={17} />
          </div>
        </a>
      ))}
    </div>
  );
}
export function DetailedCatalog() {
  const { t } = useSite();
  return (
    <>
      <DetailedPageHead title={t("Kataloglar", "Catalogues")} />
      <section className="rs-catalog-section">
        <div className="rs-container">
          <h2>
            {t(
              "Projenizin ilk adımı, doğru bilgi.",
              "Good information is the first step.",
            )}
          </h2>
          <p>
            {t(
              "Yayındaki güncel ürünlerden oluşturulan katalogları PDF olarak indirebilirsiniz.",
              "Download PDFs generated from our current published systems.",
            )}
          </p>
          <CatalogCards />
          <p className="rs-muted">
            {t(
              "Kataloglar bilgilendirme amaçlıdır. Kesin ölçü, performans ve fiyat proje koşullarına göre belirlenir.",
              "Catalogues provide general information. Dimensions, performance and pricing depend on the project.",
            )}
          </p>
          <Link className="rs-text-link" to="/kurumsal/olcu-rehberi">
            {t("Ön ölçü rehberini inceleyin", "Explore the measurement guide")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function DetailedGallery() {
  const { content, local, t } = useSite();
  const [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<number | null>(null);
  const gallery = content
    .filter((c) => ["product", "project"].includes(c.type) && c.image)
    .flatMap((c) =>
      [...new Set([contentImage(c), ...(c.gallery || [])])].map((url) => ({
        item: c,
        url,
      })),
    );
  const visible = gallery.filter(
    ({ item }) =>
      (filter === "all" ||
        (filter === "project"
          ? item.type === "project"
          : item.type === "product" &&
            (filter === "folding"
              ? ["folding", "sliding", "guillotine"].includes(groupOf(item))
              : groupOf(item) === filter))) &&
      local(item, "title")
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  useEffect(() => setSelected(null), [filter, query]);
  return (
    <>
      <DetailedPageHead title={t("Galeri", "Gallery")} />
      <section className="rs-container rs-section">
        <div className="rs-gallery-toolbar">
          <div className="rs-tabs">
            {[
              ["all", "Tümü", "All"],
              ["folding", "Cam balkon", "Balcony"],
              ["outdoor", "Bahçe & Teras", "Outdoor"],
              ["aluminium", "Alüminyum", "Aluminium"],
              ["metal", "Metal", "Metal"],
              ["project", "Mekânlar", "Spaces"],
            ].map(([id, tr, en]) => (
              <button
                className={filter === id ? "active" : ""}
                onClick={() => setFilter(id)}
                key={id}
              >
                {t(tr, en)}
              </button>
            ))}
          </div>
          <label className="rs-search">
            <Search size={16} />
            <input
              aria-label="Galeride ara"
              placeholder={t("Galeride ara…", "Search gallery…")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <p className="rs-muted">
          {t(
            "Fotoğraf arşivi ve tasarım konseptleri birlikte sunulmaktadır. Konseptler tamamlanmış uygulama fotoğrafı değildir; fotoğraflar teknik performans belgesi yerine geçmez.",
            "The photo archive and design concepts are presented together. Concepts are not completed installation photos; photographs do not certify technical performance.",
          )}
        </p>
        <div className="rs-gallery-grid">
          {visible.map(({ item, url }, i) => (
            <button
              key={`${item.id}-${i}`}
              onClick={() => setSelected(i)}
              aria-label={`${local(item, "title")} ${t("görselini büyüt", "enlarge image")}`}
            >
              <div>
                <img
                  src={url}
                  alt={item.imageAlt || local(item, "title")}
                  loading="lazy"
                />
                <ZoomIn size={23} />
              </div>
              <span>
                {local(item, "title")}
                <small className="rs-photo-kind">
                  {url.includes("-edited.webp")
                    ? t("Fotoğraftan düzenlendi · AI", "AI-edited photograph")
                    : url.startsWith("/images/photo-")
                      ? t("Fotoğraf arşivi", "Photo archive")
                      : url.startsWith("/images/")
                        ? t("Tasarım konsepti", "Design concept")
                        : t("Yüklenen görsel", "Uploaded image")}
                </small>
              </span>
            </button>
          ))}
        </div>
        {!visible.length && (
          <p className="rs-empty">
            {t(
              "Bu filtrede görsel bulunamadı.",
              "No images match this filter.",
            )}
          </p>
        )}
      </section>
      {selected !== null && visible[selected] && (
        <AccessibleDialog
          label={t("Galeri görseli", "Gallery image")}
          onClose={() => setSelected(null)}
        >
          <div className="rs-lightbox">
            <img
              src={visible[selected].url}
              alt={local(visible[selected].item, "title")}
            />
            <div>
              <button
                aria-label="Önceki görsel"
                onClick={() =>
                  setSelected((selected + visible.length - 1) % visible.length)
                }
              >
                <ChevronLeft />
              </button>
              <span>
                {local(visible[selected].item, "title")}
                <small>
                  {selected + 1} / {visible.length}
                </small>
              </span>
              <button
                aria-label="Sonraki görsel"
                onClick={() => setSelected((selected + 1) % visible.length)}
              >
                <ChevronRight />
              </button>
            </div>
            <Link
              to={contentPath(visible[selected].item)}
              className="rs-text-link"
            >
              {t("İlgili çözümü incele", "Explore this solution")}
              <ArrowRight size={15} />
            </Link>
          </div>
        </AccessibleDialog>
      )}
    </>
  );
}
const hub = [
  {
    title: "Hakkımızda",
    en: "About us",
    href: "/kurumsal/hakkimizda",
    icon: Building2,
  },
  {
    title: "Çalışma Sürecimiz",
    en: "Our process",
    href: "/kurumsal/uygulama-sureci",
    icon: Layers,
  },
  {
    title: "Terimler Sözlüğü",
    en: "Glossary",
    href: "/kurumsal/terimler-sozlugu",
    icon: BookOpen,
  },
  {
    title: "Bilgi Merkezi",
    en: "Knowledge centre",
    href: "/blog",
    icon: MessageSquare,
  },
  {
    title: "Sistem Seçim Rehberi",
    en: "System finder",
    href: "/sistem-secici",
    icon: SlidersHorizontal,
  },
  {
    title: "Ön Ölçü Rehberi",
    en: "Measuring guide",
    href: "/kurumsal/olcu-rehberi",
    icon: Ruler,
  },
  {
    title: "Teknik Dokümanlar",
    en: "Technical documents",
    href: "/kurumsal/teknik-dokumanlar",
    icon: FileText,
  },
  {
    title: "Proje Birimi",
    en: "Project office",
    href: "/proje-birimi",
    icon: Building2,
  },
  {
    title: "Proje & Fiyat Teklifi",
    en: "Project & price quotation",
    href: "/proje-teklif",
    icon: Grid2X2,
  },
  {
    title: "Hizmet Bölgeleri",
    en: "Service areas",
    href: "/hizmet-alani",
    icon: MapPin,
  },
  {
    title: "Servis Talebi",
    en: "Service request",
    href: "/servis-talebi",
    icon: Phone,
  },
  {
    title: "Garanti ve Bakım",
    en: "Warranty & care",
    href: "/kurumsal/garanti-servis",
    icon: ShieldCheck,
  },
  {
    title: "Renk Kartelası",
    en: "Colours",
    href: "/kurumsal/renk-kartelasi",
    icon: Palette,
  },
  {
    title: "Müşteri Paneli",
    en: "Customer account",
    href: "/hesabim",
    icon: UserRound,
  },
  {
    title: "Proje Çözümleri",
    en: "Project solutions",
    href: "/projeler",
    icon: Image,
  },
  {
    title: "Kataloglar",
    en: "Catalogues",
    href: "/katalog",
    icon: Download,
  },
  {
    title: "Sistem Karşılaştırma",
    en: "Compare systems",
    href: "/urun-karsilastir",
    icon: Layers,
  },
  {
    title: "Sıkça Sorulan Sorular",
    en: "Frequently asked questions",
    href: "/sikca-sorulan-sorular",
    icon: MessageSquare,
  },
  {
    title: "İşyeri & Mimari Projeler",
    en: "Commercial & architectural projects",
    href: "/kurumsal/kurumsal-projeler-taahhut",
    icon: Grid2X2,
  },
];
function visibleCorporateHub(content: Content[], settings: Settings) {
  return hub.filter((item) => {
    if (item.href === "/projeler" && settings.showProjects === false)
      return false;
    if (item.href === "/hizmet-alani" && settings.showRegions === false)
      return false;
    if (item.href === "/sikca-sorulan-sorular" && settings.showFaq === false)
      return false;
    if (item.href === "/blog" && settings.showBlog === false) return false;
    return (
      !item.href.startsWith("/kurumsal/") ||
      content.some(
        (page) => page.type === "page" && contentPath(page) === item.href,
      )
    );
  });
}
function CompanyProcess() {
  const { settings, en, t } = useSite();
  const defaults = [
    [
      "İhtiyaç analizi",
      "Needs assessment",
      "Mekânınızı, kullanım beklentilerinizi ve projenin kapsamını birlikte değerlendiriyoruz.",
      "We review your space, needs and project scope together.",
    ],
    [
      "Yerinde keşif",
      "Site survey",
      "Ölçüleri, mevcut yüzeyleri ve uygulama koşullarını keşifle netleştiriyoruz.",
      "A site survey clarifies dimensions, existing surfaces and installation conditions.",
    ],
    [
      "Teknik planlama",
      "Technical planning",
      "Malzeme, renk, detaylar ve yazılı teklif onayının ardından uygulama planını hazırlıyoruz.",
      "Materials, finishes, details and an approved written quotation shape the installation plan.",
    ],
    [
      "Uygulama ve teslim",
      "Installation & handover",
      "Uygulama sonrası kullanım, bakım ve servis bilgilerini sizinle paylaşıyoruz.",
      "After installation, we share use, maintenance and service information.",
    ],
  ];
  return (
    <div className="rs-process-grid rs-company-process-grid">
      {defaults.map(([titleTr, titleEn, textTr, textEn], i) => {
        const n = i + 1;
        return (
          <article key={n}>
            <span>0{n}</span>
            <h3>
              {String(
                (en && settings[`processStep${n}TitleEn`]) ||
                  settings[`processStep${n}Title`] ||
                  t(titleTr, titleEn),
              )}
            </h3>
            <p>
              {String(
                (en && settings[`processStep${n}TextEn`]) ||
                  settings[`processStep${n}Text`] ||
                  t(textTr, textEn),
              )}
            </p>
          </article>
        );
      })}
    </div>
  );
}
export function DetailedCorporate() {
  const { t, content, local, settings, en } = useSite();
  const links = visibleCorporateHub(content, settings);
  const pages = content.filter(
    (c) => c.type === "page" && !links.some((h) => h.href === contentPath(c)),
  );
  return (
    <>
      <DetailedPageHead title={t("Kurumsal", "Company")} />
      <section
        className="rs-container rs-section rs-company-story"
        aria-label={t("Firmamızı tanıyın", "Meet our company")}
      >
        <figure>
          <img
            src="/images/photo-shop.jpg"
            alt={t(
              "Kılınç Dekorasyon dükkânının dış cephesi",
              "Kılınç Dekorasyon shop exterior",
            )}
          />
          <figcaption>
            {t(
              "Kılınç Dekorasyon · dükkânımızdan bir kare.",
              "Kılınç Dekorasyon · a view of our shop.",
            )}
          </figcaption>
        </figure>
        <div>
          <small>
            {t(
              "KILINÇ DEKORASYON · ETİMESGUT",
              "KILINÇ DEKORASYON · ETİMESGUT",
            )}
          </small>
          <h2>
            {t(
              "İhtiyacınızı dinliyor,\ndetayları birlikte planlıyoruz.",
              "We listen to your needs\nand plan the details together.",
            )}
          </h2>
          <p className="rs-company-about">
            {String(
              (en && settings.aboutTextEn) ||
                settings.aboutText ||
                t(
                  "Cam, alüminyum ve metal uygulamalarında ihtiyaçlarınızı bizimle doğrudan paylaşabilirsiniz.",
                  "Talk directly with us about your glass, aluminium and metal installation needs.",
                ),
            )}
          </p>
          <Link to="/iletisim" className="rs-text-link">
            {t("Bizimle tanışın", "Meet us")}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
      <section
        className="rs-container rs-company-process"
        aria-label={t("Nasıl çalışıyoruz?", "How we work")}
      >
        <div className="rs-company-section-heading">
          <small>{t("NASIL ÇALIŞIYORUZ?", "HOW WE WORK")}</small>
          <h2>
            {t(
              "İlk fikirden uygulama ve teslim aşamasına.",
              "From first idea to installation and handover.",
            )}
          </h2>
        </div>
        <CompanyProcess />
      </section>
      <section className="rs-container rs-section rs-company-layout">
        <div className="rs-company-intro">
          <small>{t("KILINÇ DEKORASYON", "KILINÇ DEKORASYON")}</small>
          <h2>
            {t(
              "Projenizin her adımında, açık bilgi.",
              "Clear information at every step.",
            )}
          </h2>
          <p>
            {t(
              "Çalışma biçimimizi tanıyın, hazırlık rehberlerinden yararlanın ve ihtiyacınız olduğunda bize ulaşın.",
              "Learn how we work, prepare with practical guides and get in touch when you need us.",
            )}
          </p>
          <Link className="rs-text-link" to="/iletisim">
            {t("Birlikte konuşalım", "Let’s talk")}
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="rs-hub-grid">
          {links.map((c, i) => (
            <Link to={c.href} key={c.href}>
              <span className="rs-hub-number" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <c.icon size={23} strokeWidth={1.4} />
              <h2>{t(c.title, c.en)}</h2>
              <ArrowRight size={15} />
            </Link>
          ))}
        </div>
        {pages.length > 0 && (
          <div className="rs-extra-pages">
            <h2>{t("Diğer bilgiler", "More information")}</h2>
            {pages.map((c) => (
              <Link to={contentPath(c)} key={c.id}>
                {local(c, "title")}
                <ArrowRight size={14} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
export function DetailedServiceAreas() {
  const { content, settings, t, local } = useSite();
  const [district, setDistrict] = useState("all");
  const regions = content.filter((c) => c.type === "region");
  const visible = regions.filter(
    (c) => district === "all" || c.slug === district,
  );
  return (
    <>
      <DetailedPageHead title={t("Hizmet Bölgeleri", "Service Areas")} />
      <section className="rs-container rs-section">
        <div className="rs-info-banner">
          <MapPin size={27} />
          <div>
            <h2>
              {t(
                "Etimesgut’taki tek dükkânımızdan keşif planlaması.",
                "Survey planning from our single shop in Etimesgut.",
              )}
            </h2>
            <p>
              {t(
                "Uygulama adresinizi bizimle paylaşın. Keşif takvimini, işin kapsamını ve hizmet uygunluğunu sizinle doğrudan görüşerek netleştiriyoruz.",
                "Share your project address. We discuss the survey schedule, scope and service availability directly with you.",
              )}
            </p>
          </div>
        </div>
        <div className="rs-region-filter">
          <label>
            {t("Şehir", "City")}
            <select aria-label="Şehir">
              <option>Ankara</option>
            </select>
          </label>
          <label>
            {t("Bölge", "District")}
            <select
              aria-label="Bölge"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="all">{t("Tüm bölgeler", "All districts")}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.slug}>
                  {local(r, "title").split(" için")[0]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="rs-region-grid">
          {visible.map((c) => (
            <article key={c.id}>
              <MapPin size={24} />
              <small>ANKARA</small>
              <h2>{local(c, "title").split(" için")[0]}</h2>
              <p>{local(c, "summary")}</p>
              <Link to={contentPath(c)}>
                {t("Bölgeyi inceleyin", "Explore this area")}
                <ArrowRight size={15} />
              </Link>
              <Link
                to={`/teklif-al?bolge=${encodeURIComponent(c.title.split(" için")[0])}`}
                className="rs-text-link"
              >
                {t("Keşif talebi", "Request a survey")}
              </Link>
            </article>
          ))}
        </div>
        {settings.serviceAreas && (
          <p className="rs-muted">{String(settings.serviceAreas)}</p>
        )}
        <div className="rs-center">
          <Link to="/proje-teklif" className="rs-button">
            {t(
              "Proje ve fiyat talebi oluşturun",
              "Request a project quotation",
            )}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function DetailedProjectOffice({ children }: { children: ReactNode }) {
  const { t } = useSite();
  return (
    <>
      <DetailedPageHead title={t("Proje Birimi", "Project Office")} />
      <section className="rs-container rs-section">
        <div className="rs-office-hero">
          <img
            src="/images/aluminium-facade.svg"
            alt={t("Alüminyum cephe konsepti", "Aluminium façade concept")}
          />
          <div>
            <small>
              {t("MİMARİ & UYGULAMA", "ARCHITECTURE & INSTALLATION")}
            </small>
            <h2>
              {t(
                "Her detay,\nprojenizin bir parçası.",
                "Every detail\nis part of your project.",
              )}
            </h2>
            <p>
              {t(
                "Eviniz veya işyeriniz için fiyat sorun; varsa çizimlerinizi, ölçülerinizi ve uygulama notlarınızı talebinize ekleyin. İncelemenin ardından teklifinizi hesabınızdan izleyebilirsiniz.",
                "Ask for a price for your home or workplace, and attach drawings, dimensions and installation notes. After review, you can see your quotation in your account.",
              )}
            </p>
            <Link to="/proje-teklif" className="rs-button">
              {t(
                "Proje dosyanızla teklif isteyin",
                "Request a quote with your project files",
              )}
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
        <CompanyProcess />
        <div className="rs-project-form" id="proje-formu">
          <div>
            <small>{t("DANIŞMANLIK TALEBİ", "PROJECT ENQUIRY")}</small>
            <h2>
              {t(
                "Projenizi birlikte\nşekillendirelim.",
                "Let’s shape\nyour project together.",
              )}
            </h2>
            <p>
              {t(
                "Uygulama alanını, yaklaşık ölçüleri, konumu ve beklentilerinizi paylaşın. Desteklenen çizim ve proje dosyalarını talebinize ekleyebilir; dönüş için e-posta ve telefon tercihinizi belirtebilirsiniz.",
                "Share the space, approximate dimensions, location and expectations. Attach supported drawings or project files and choose your email or telephone contact preference.",
              )}
            </p>
            <Link to="/kurumsal/olcu-rehberi" className="rs-text-link">
              {t("Ön ölçü almadan önce", "Before measuring")}
              <ArrowRight size={15} />
            </Link>
          </div>
          {children}
        </div>
      </section>
    </>
  );
}
export function DetailedInformation({
  kind,
}: {
  kind: "glossary" | "colours" | "measuring" | "process" | "warranty";
}) {
  const { content, settings, t, local } = useSite();
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState("");
  const slug = {
    glossary: "terimler-sozlugu",
    colours: "renk-kartelasi",
    measuring: "olcu-rehberi",
    process: "uygulama-sureci",
    warranty: "garanti-servis",
  }[kind];
  const page = content.find((c) => c.type === "page" && c.slug === slug);
  if (!page)
    return (
      <DetailedPageHead
        title={t(
          "Bu içerik henüz yayında değil.",
          "This content is not published yet.",
        )}
      />
    );
  const allSpecs =
    kind === "process" && !page.specs.length
      ? [1, 2, 3, 4].map((n) => ({
          label: String(settings[`processStep${n}Title`] || ""),
          value: String(settings[`processStep${n}Text`] || ""),
        }))
      : page.specs;
  const specs = allSpecs.filter((s) =>
    `${s.label} ${s.value}`
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <DetailedPageHead title={local(page, "title")} />
      <section className="rs-information">
        <div className="rs-container">
          <div className="rs-information-intro">
            <small>
              {t("KILINÇ / BİLGİ MERKEZİ", "KILINÇ / KNOWLEDGE CENTRE")}
            </small>
            <h2>{local(page, "subtitle") || local(page, "title")}</h2>
            <div className="prose">
              {local(page, "body")
                .split("\n")
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </div>
          </div>
          {kind === "glossary" && (
            <label className="rs-search rs-glossary-search">
              <Search size={17} />
              <input
                placeholder={t("Bir terim arayın…", "Search for a term…")}
                aria-label="Terim ara"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          <div
            className={
              kind === "colours"
                ? "rs-swatch-grid"
                : kind === "process"
                  ? "rs-timeline"
                  : "rs-information-grid"
            }
          >
            {specs.map((s, i) =>
              kind === "colours" ? (
                <button
                  key={i}
                  className={selected === s.label ? "selected" : ""}
                  onClick={() => setSelected(s.label)}
                >
                  <span
                    style={{
                      backgroundColor: /^#[\da-f]{6}$/i.test(s.value)
                        ? s.value
                        : "#dddddd",
                    }}
                  />
                  {s.label}
                  {selected === s.label && <Check size={17} />}
                </button>
              ) : (
                <article key={i}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{s.label}</h3>
                  <p>{s.value}</p>
                </article>
              ),
            )}
          </div>
          {kind === "colours" && (
            <div className="rs-colour-choice">
              <p>
                {selected
                  ? t(`Seçiminiz: ${selected}`, `Your selection: ${selected}`)
                  : t(
                      "Bir renk seçerek teklif talebinize ekleyin.",
                      "Select a colour to include in your enquiry.",
                    )}
              </p>
              <Link
                className="rs-button"
                to={`/teklif-al?renk=${encodeURIComponent(selected)}`}
              >
                {t("Bu renkle teklif iste", "Enquire about this colour")}
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {kind === "measuring" && (
            <a className="rs-button" href="/api/measurement-guide.pdf" download>
              {t("Ön ölçü rehberi PDF indir", "Download measuring guide")}
              <Download size={17} />
            </a>
          )}
          <div className="rs-dual-links">
            <Link to="/hizmetler">
              <Layers />
              <span>{t("Sistemlerimiz", "Our systems")}</span>
              <ArrowRight />
            </Link>
            <Link to="/servis-talebi">
              <MessageSquare />
              <span>{t("Bir sorum var", "Ask a question")}</span>
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
export function DetailedFooter() {
  const { settings, content, t, local } = useSite();
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      if (navigator.share)
        await navigator.share({ title: document.title, url: location.href });
      else {
        await navigator.clipboard.writeText(location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch {
      setCopied(false);
    }
  };
  return (
    <>
      <div className="rs-prefooter">
        <div className="rs-container">
          <Link to="/">{t("Ana Sayfa", "Home")}</Link>
          <span>/</span>
          <Link to="/teklif-al">{t("Keşif ve teklif", "Quote & survey")}</Link>
          <button onClick={share}>
            <ArrowUpRight size={13} />
            {copied
              ? t("Bağlantı kopyalandı", "Link copied")
              : t("Paylaş", "Share")}
          </button>
        </div>
      </div>
      <footer className="rs-footer">
        <div className="rs-container">
          <div className="rs-footer-grid">
            <section>
              <h2>{t("KURUMSAL", "COMPANY")}</h2>
              <Link to="/kurumsal">
                {t("Kurumsal merkez", "Company centre")}
              </Link>
              {visibleCorporateHub(content, settings)
                .filter((h) =>
                  [
                    "/kurumsal/hakkimizda",
                    "/kurumsal/uygulama-sureci",
                    "/kurumsal/terimler-sozlugu",
                    "/blog",
                    "/kurumsal/garanti-servis",
                    "/kurumsal/olcu-rehberi",
                    "/kurumsal/renk-kartelasi",
                    "/kurumsal/teknik-dokumanlar",
                  ].includes(h.href),
                )
                .map((h) => (
                  <Link to={h.href} key={h.href}>
                    {t(h.title, h.en)}
                  </Link>
                ))}
            </section>
            <section>
              <h2>{t("ÜRÜNLER", "SYSTEMS")}</h2>
              {content
                .filter((c) => c.type === "product")
                .slice(0, 9)
                .map((c) => (
                  <Link to={contentPath(c)} key={c.id}>
                    {local(c, "title")}
                  </Link>
                ))}
              <Link to="/hizmetler">{t("Tüm sistemler", "All systems")}</Link>
            </section>
            <section>
              <h2>{t("KEŞFET", "EXPLORE")}</h2>
              <Link to="/fikir-defteri">{t("Tüm galeri", "Gallery")}</Link>
              {settings.showProjects !== false && (
                <Link to="/projeler">
                  {t("Proje çözümleri", "Project solutions")}
                </Link>
              )}
              <Link to="/proje-birimi">
                {t("Proje birimi", "Project office")}
              </Link>
              <Link to="/proje-teklif">
                {t("Proje & fiyat teklifi", "Project & price quotation")}
              </Link>
              <Link to="/katalog">{t("Kataloglar", "Catalogues")}</Link>
              <Link to="/sistem-secici">
                {t("Sistem seçici", "System finder")}
              </Link>
              <Link to="/urun-karsilastir">
                {t("Ürün karşılaştırma", "Compare systems")}
              </Link>
              {settings.showFaq !== false && (
                <Link to="/sikca-sorulan-sorular">
                  {t("Sık sorulan sorular", "FAQ")}
                </Link>
              )}
            </section>
            <section>
              <h2>{t("DESTEK", "SUPPORT")}</h2>
              <Link to="/iletisim">{t("İletişim", "Contact")}</Link>
              {settings.showRegions !== false && (
                <Link to="/hizmet-alani">
                  {t("Hizmet bölgeleri", "Service areas")}
                </Link>
              )}
              <Link to="/proje-teklif">
                {t("Proje & fiyat teklifi", "Project & price quotation")}
              </Link>
              <Link to="/servis-talebi">
                {t("Servis talebi", "Service request")}
              </Link>
              <Link to="/hesabim">
                {t("Müşteri paneli", "Customer account")}
              </Link>
              <Link to="/yonetim">{t("Yönetim paneli", "Administration")}</Link>
              {settings.phone && (
                <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
                  <Phone size={12} />
                  {settings.phone}
                </a>
              )}
              {settings.email && (
                <a href={`mailto:${settings.email}`}>
                  <Mail size={12} />
                  {settings.email}
                </a>
              )}
            </section>
          </div>
          <div className="rs-social-links">
            {["instagram", "facebook", "youtube", "linkedin"]
              .filter((k) => settings[k])
              .map((k) => (
                <a
                  href={String(settings[k])}
                  key={k}
                  target="_blank"
                  rel="noreferrer"
                >
                  {k}
                </a>
              ))}
          </div>
          <div className="rs-footer-bottom">
            <DetailedBrand light />
            <p>
              {String(
                settings.footerText ||
                  t(
                    "Cam, alüminyum ve metal sistemleri.",
                    "Glass, aluminium and metal systems.",
                  ),
              )}
            </p>
            <div>
              <Link to="/kurumsal/kvkk">KVKK</Link>
              <Link to="/kurumsal/gizlilik">{t("Gizlilik", "Privacy")}</Link>
              <Link to="/kurumsal/icerik-ve-kullanim-haklari">
                {t("İçerik ve kullanım hakları", "Content and usage rights")}
              </Link>
              <a href="/licenses/THIRD-PARTY-NOTICES.txt">
                {t("Açık kaynak lisansları", "Open-source licences")}
              </a>
              <span>
                © {new Date().getFullYear()}{" "}
                {String(settings.companyName || "Kılınç Dekorasyon")}
              </span>
            </div>
            <small>
              {t(
                "Fotoğraf arşivi ve tasarım konseptleri ayrı etiketlenir. Konseptler tamamlanmış uygulama değildir. Teknik ve ticari koşullar projeye özel belirlenir.",
                "Archive photos and design concepts are labelled separately. Concepts are not completed installations. Technical and commercial terms are agreed for each project.",
              )}
            </small>
          </div>
        </div>
      </footer>
    </>
  );
}
