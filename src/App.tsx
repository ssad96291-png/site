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
type Context = {
  settings: Settings;
  content: Content[];
  en: boolean;
  setEn: (v: boolean) => void;
  t: (tr: string, en: string) => string;
  local: (c: Content, k: "title" | "subtitle" | "summary" | "body") => string;
};
const SiteContext = createContext<Context>(null!);
const useSite = () => useContext(SiteContext);
const pathFor = (c: Content) =>
  `/${({ product: "urunler", project: "projeler", article: "blog", page: "kurumsal", region: "bolgeler", faq: "sikca-sorulan-sorular" } as Record<string, string>)[c.type] || "kurumsal"}/${c.slug}`;
function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}
function Logo({ light = false }: { light?: boolean }) {
  const { settings } = useSite();
  return (
    <Link
      to="/"
      className={`brand ${light ? "light" : ""}`}
      aria-label={`${settings.logoText || "Kılınç Dekorasyon"} ana sayfa`}
    >
      <span className="brand-symbol" aria-hidden="true">
        <i />
        <i />
        <i />
      </span>
      <span>
        <strong>{settings.logoText || "Kılınç"}</strong>
        <small>DEKORASYON</small>
      </span>
    </Link>
  );
}
function Header() {
  const { t, en, setEn, content, settings } = useSite();
  const [menu, setMenu] = useState(false),
    [products, setProducts] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  const loc = useLocation();
  useEffect(() => {
    setMenu(false);
    setProducts(false);
    setSearch(false);
  }, [loc.pathname]);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setSearch(false);
        setProducts(false);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);
  const found = content
    .filter(
      (c) =>
        c.type !== "faq" &&
        `${c.title} ${c.titleEn || ""} ${c.summary}`
          .toLocaleLowerCase("tr")
          .includes(query.toLocaleLowerCase("tr")),
    )
    .slice(0, 12);
  return (
    <>
      <div className="topline">
        <div className="container">
          <span>
            {t(
              "Açık havanın özgürlüğü. Evinizin konforu.",
              "The freedom of outdoors. The comfort of home.",
            )}
          </span>
          <Link to="/katalog">
            {t(
              "İlham kataloğunu keşfedin",
              "Explore our inspiration catalogue",
            )}{" "}
            <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>
      <header className="header">
        <div className="container header-inner">
          <Logo />
          <nav
            className={menu ? "nav mobile-open" : "nav"}
            aria-label={t("Ana menü", "Main navigation")}
          >
            <div className="nav-products">
              <div className="nav-product-row">
                <NavLink to="/urunler">
                  {t("Sistemlerimiz", "Our systems")}
                </NavLink>
                <button
                  className="icon-button"
                  aria-label={t("Ürün menüsü", "Product menu")}
                  aria-expanded={products}
                  onClick={() => setProducts(!products)}
                >
                  <ChevronDown size={14} />
                </button>
              </div>
              {products && (
                <div className="mega-menu">
                  <div>
                    <small>
                      {t(
                        "MEKÂNINIZA ÖZEL ÇÖZÜMLER",
                        "SOLUTIONS FOR YOUR SPACE",
                      )}
                    </small>
                    <h3>
                      {t("Dışarıya daha yakın.", "Closer to the outdoors.")}
                    </h3>
                    <Link to="/urunler">
                      {t("Tüm sistemler", "All systems")}{" "}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                  <div>
                    {content
                      .filter((c) => c.type === "product")
                      .map((c) => (
                        <Link key={c.id} to={pathFor(c)}>
                          {en && c.titleEn ? c.titleEn : c.title}
                          <ArrowUpRight size={15} />
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
            {settings.showProjects !== false && (
              <NavLink to="/projeler">
                {t("Yaşam Alanları", "Living spaces")}
              </NavLink>
            )}
            <NavLink to="/kurumsal">{t("Biz Kimiz?", "Our story")}</NavLink>
            {settings.showArticles !== false && (
              <NavLink to="/blog">{t("Rehber", "Guides")}</NavLink>
            )}
            {settings.showRegions !== false && (
              <NavLink to="/bolgeler">{t("Bölgeler", "Regions")}</NavLink>
            )}
            <NavLink to="/iletisim">{t("İletişim", "Contact")}</NavLink>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button search-trigger"
              aria-label={t("Sitede ara", "Search website")}
              onClick={() => setSearch(true)}
            >
              <Search size={19} />
            </button>
            {(!Array.isArray(settings.languages) || settings.languages.includes("en")) && <button
              className="language"
              onClick={() => setEn(!en)}
              aria-label={en ? "Türkçeye geç" : "Switch to English"}
            >
              {en ? "EN" : "TR"}
              <ChevronDown size={11} />
            </button>}
            <Link to="/teklif-al" className="button small header-quote">
              {t("Projenizi konuşalım", "Let’s talk")}
              <ArrowUpRight size={15} />
            </Link>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMenu(!menu)}
              aria-expanded={menu}
              aria-label={t("Menüyü aç/kapat", "Toggle menu")}
            >
              {menu ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      {search && (
        <div className="modal-overlay" onClick={() => setSearch(false)}>
          <section
            className="search-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={t("Arama", "Search")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-heading">
              <h2>
                {t(
                  "Neyi keşfetmek istersiniz?",
                  "What would you like to discover?",
                )}
              </h2>
              <button
                className="icon-button"
                onClick={() => setSearch(false)}
                aria-label={t("Kapat", "Close")}
              >
                <X />
              </button>
            </div>
            <label className="search-input">
              <Search />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(
                  "Ürün, fikir veya yaşam alanı arayın…",
                  "Search systems, ideas or spaces…",
                )}
              />
            </label>
            <div className="search-results">
              {found.map((c) => (
                <Link key={c.id} to={pathFor(c)}>
                  {en && c.titleEn ? c.titleEn : c.title}
                  <ArrowUpRight size={18} />
                </Link>
              ))}
              {!found.length && (
                <p>
                  {t(
                    "Sonuç bulunamadı. Başka bir kelime deneyin.",
                    "No results. Please try another word.",
                  )}
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
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
          src={item.image || `/images/product-${(index % 8) + 1}.svg`}
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
function Home() {
  const { content, settings, t, en, local } = useSite();
  const products = content.filter((c) => c.type === "product"),
    projects = content.filter((c) => c.type === "project"),
    articles = content.filter((c) => c.type === "article");
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <Eyebrow>
            {en
              ? String(
                  settings.heroEyebrowEn || "A NEW PERSPECTIVE ON YOUR SPACE",
                )
              : settings.heroEyebrow || "MEKÂNINIZA YENİ BİR BAKIŞ"}
          </Eyebrow>
          <h1>
            {en
              ? String(settings.heroTitleEn || "Open up to a better living.")
              : settings.heroTitle || "Yaşam alanınıza yeni bir bakış."}
          </h1>
          <p>
            {en
              ? String(
                  settings.heroSubtitleEn ||
                    "Thoughtfully designed glass systems that bring the outdoors closer. Discover a new way to enjoy your balcony, terrace and garden.",
                )
              : settings.heroSubtitle ||
                "Balkonunuzdan bahçenize, hayatın içeriyle dışarı arasında akıp gittiği ferah yaşam alanları tasarlıyoruz."}
          </p>
          <Link to="/urunler" className="button">
            {t("Size uygun sistemi keşfedin", "Find your perfect system")}
            <ArrowUpRight size={18} />
          </Link>
          <div className="hero-bottom">
            <span className="scroll-line" />
            <span>{t("DAHA FAZLASINI KEŞFEDİN", "SCROLL TO DISCOVER")}</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src={String(settings.heroImage || "/images/hero.svg")}
            alt={t(
              "Cam panellerle bahçeye açılan, sıcak tonlarda tasarlanmış modern teras görselleştirmesi",
              "Architectural visualization of a warm modern terrace opening to a garden through glass panels",
            )}
          />
          <div className="hero-image-label">
            <span className="label-dot" />
            {t(
              "İçeride konfor, dışarıda hayat.",
              "Comfort within. Life beyond.",
            )}
            <ArrowUpRight size={17} />
          </div>
          <span className="hero-caption">KILINÇ / OUTDOOR LIVING</span>
        </div>
      </section>
      <div className="promise-bar">
        <div className="container">
          <span>
            <Layers size={18} />
            {t("Mekâna özel tasarım", "Designed for your space")}
          </span>
          <span>
            <Sun size={19} />
            {t("Dört mevsim kullanım", "Four-season living")}
          </span>
          <span>
            <ShieldCheck size={19} />
            {t("Özenli uygulama", "Careful installation")}
          </span>
          <span>
            <Wind size={19} />
            {t("Kesintisiz manzara", "An uninterrupted view")}
          </span>
        </div>
      </div>
      <ServiceFamilies />
      <section className="section container">
        <div className="section-heading">
          <div>
            <Eyebrow>{t("SİSTEMLERİMİZ", "OUR SYSTEMS")}</Eyebrow>
            <h2>
              {t("Her mekânın bir", "Every space has")}
              <br />
              <em>{t("açılma şekli var.", "a way to open up.")}</em>
            </h2>
          </div>
          <div className="section-heading-aside">
            <p>
              {t(
                "İhtiyaçlarınıza göre şekillenen, mimariyle uyumlu çözümler. Size en uygun sistemi birlikte bulalım.",
                "Architectural solutions shaped around your needs. Let’s find the system that feels right for your space.",
              )}
            </p>
            <Link to="/urunler" className="text-link">
              {t("Tüm sistemleri inceleyin", "Explore all systems")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="product-grid home-products">
          {[...products]
            .sort((a, b) => Number(b.featured) - Number(a.featured))
            .slice(0, 4)
            .map((p, i) => (
              <ProductCard key={p.id} item={p} index={i} />
            ))}
        </div>
      </section>
      <section className="story-section">
        <div className="story-image">
          <img
            src="/images/project-2.svg"
            loading="lazy"
            alt={t(
              "Modern bir cam balkonun mimari görselleştirmesi",
              "Architectural concept of a modern glass balcony",
            )}
          />
          <span>
            {t("DAHA AYDINLIK BİR YAŞAM İÇİN", "FOR A BRIGHTER WAY OF LIVING")}
          </span>
        </div>
        <div className="story-copy">
          <Eyebrow light>
            {t("KILINÇ DEKORASYON İLE", "WITH KILINÇ DEKORASYON")}
          </Eyebrow>
          <h2>
            {t("Sadece bir balkon değil,", "More than a balcony,")}
            <br />
            <em>{t("yeni bir yaşam alanı.", "a new way to live.")}</em>
          </h2>
          <p>
            {en
              ? String(
                  settings.aboutTextEn ||
                    "A morning coffee, an unhurried conversation, a quiet moment with a view. We create spaces that make room for the little things in life.",
                )
              : settings.aboutText ||
                "Sabah kahvenizin, uzun sohbetlerin ve manzaraya karşı kendinize ayırdığınız anların yeni adresi. İhtiyacınızı dinliyor, mekânınıza uygun çözümü özenle hayata geçiriyoruz."}
          </p>
          <div className="story-values">
            <span>
              <Check size={17} />
              {t("İhtiyaca göre sistem seçimi", "A system selected for you")}
            </span>
            <span>
              <Check size={17} />
              {t("Ölçüye özel üretim", "Made to measure")}
            </span>
            <span>
              <Check size={17} />
              {t("Montaj sonrası destek", "After-installation support")}
            </span>
          </div>
          <Link to="/kurumsal" className="text-link light">
            {t("Bizi daha yakından tanıyın", "Get to know us")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      {settings.showProjects !== false && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <Eyebrow>{t("YAŞAM ALANLARI", "LIVING SPACES")}</Eyebrow>
              <h2>
                {t("Hayalinizdeki mekâna", "A little closer to")}
                <br />
                <em>{t("bir adım daha yakın.", "the space you imagine.")}</em>
              </h2>
            </div>
            <Link to="/projeler" className="text-link">
              {t("Tüm alanları keşfedin", "Explore living spaces")}
              <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className="project-grid">
            {[...projects]
              .sort((a, b) => Number(b.featured) - Number(a.featured))
              .slice(0, 3)
              .map((c, i) => (
                <Link
                  className={`project-card project-${i}`}
                  to={pathFor(c)}
                  key={c.id}
                >
                  <img
                    src={c.image || `/images/project-${(i % 4) + 1}.svg`}
                    alt={local(c, "title")}
                    loading="lazy"
                  />
                  <div>
                    <small>{c.category}</small>
                    <h3>{local(c, "title")}</h3>
                    <span>
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                </Link>
              ))}
          </div>
          <p className="image-disclosure">
            {t(
              "Görseller ve yaşam alanları tasarım önerileridir; tamamlanmış müşteri projesi olarak sunulmaz.",
              "Images and living spaces are design concepts, not completed customer projects.",
            )}
          </p>
        </section>
      )}
      <section className="catalog-band container">
        <div className="catalog-art" aria-hidden="true">
          <div className="catalog-book">
            <span>
              KILINÇ<small>DEKORASYON</small>
            </span>
            <img src="/images/product-3.svg" alt="" />
            <p>
              DIŞARIDA HAYAT VAR.<small>YAŞAM ALANLARI / SİSTEMLER</small>
            </p>
          </div>
        </div>
        <div>
          <Eyebrow>
            {t("İLHAMINIZ YANINIZDA OLSUN", "TAKE YOUR INSPIRATION WITH YOU")}
          </Eyebrow>
          <h2>
            {t("Yeni fikirler,", "New ideas,")}
            <br />
            <em>{t("yeni olasılıklar.", "new possibilities.")}</em>
          </h2>
          <p>
            {t(
              "Sistemlerimizi tek bir yerde inceleyin. Projeniz için ilk adımı birlikte atalım.",
              "Explore our systems in one place. Let’s take the first step towards your project.",
            )}
          </p>
          <Link to="/katalog" className="button outline">
            {t("Kataloğu keşfedin", "Explore the catalogue")}
            <Download size={17} />
          </Link>
        </div>
      </section>
      {settings.showArticles !== false && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <Eyebrow>{t("İLHAM & FİKİRLER", "IDEAS & INSPIRATION")}</Eyebrow>
              <h2>
                {t("İyi bir fikirle", "It starts with")}{" "}
                <em>{t("başlar.", "a good idea.")}</em>
              </h2>
            </div>
            <Link to="/blog" className="text-link">
              {t("Tüm yazılar", "All stories")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="journal-grid">
            {[...articles]
              .sort((a, b) => Number(b.featured) - Number(a.featured))
              .slice(0, 3)
              .map((c) => (
                <ArticleCard key={c.id} item={c} />
              ))}
          </div>
        </section>
      )}
      <ProjectJourney />
      {settings.showRegions !== false && <RegionPreview />}
      {settings.showFaq !== false && <FAQPreview />}
      <CallToAction />
    </>
  );
}
function ServiceFamilies() {
  const { t, settings, en } = useSite();
  const families = [
    {
      title: t("Cam ile ferahlık.", "Room to breathe."),
      name: t("Cam sistemleri", "Glass systems"),
      text: t(
        "Katlanır, sürme ve giyotin camdan kış bahçesine; açıklığı, ışığı ve kullanım konforunu birlikte düşünün.",
        "From folding and sliding glazing to winter gardens, consider light, openness and everyday comfort.",
      ),
      image: "/images/product-1.svg",
      match: /cam|bahçe|pergola|gölge/i,
    },
    {
      title: t("Alüminyum ile denge.", "Precision in aluminium."),
      name: t("Alüminyum sistemler", "Aluminium systems"),
      text: t(
        "Kapı, pencere, cephe ve ofis bölmeleri. Mimariyle uyumlu profil ve birleşim detayları.",
        "Doors, windows, façades and office partitions. Profiles and connections that fit the architecture.",
      ),
      image: "/images/aluminium-facade.svg",
      match: /alüminyum|cephe|ofis|doğrama/i,
    },
    {
      title: t("Metal ile karakter.", "Character in metal."),
      name: t("Demir & çelik imalat", "Steel & metalwork"),
      text: t(
        "Korkuluk, ferforje, çelik konstrüksiyon ve özel imalat. Ölçü, güvenlik ve uygulama bir arada.",
        "Railings, gates, structural steel and bespoke fabrication. Dimensions, safety and installation together.",
      ),
      image: "/images/metal-gate.svg",
      match: /demir|çelik|ferforje|metal|yangın/i,
    },
  ];
  return (
    <section className="section container service-overview">
      <div className="section-heading">
        <div>
          <Eyebrow>
            {t(
              "BİR PROJE. BÜTÜNCÜL BİR YAKLAŞIM.",
              "ONE PROJECT. A COMPLETE APPROACH.",
            )}
          </Eyebrow>
          <h2>
            {!en && settings.servicesTitle ? (
              String(settings.servicesTitle)
            ) : (
              <>
                {t("Camın hafifliği,", "The lightness of glass,")}
                <br />
                <em>{t("metalin gücü.", "the strength of metal.")}</em>
              </>
            )}
          </h2>
        </div>
        <Link className="text-link" to="/sistem-secici">
          {t("Nereden başlayacağımı bul", "Find my starting point")}
          <ArrowUpRight size={18} />
        </Link>
      </div>
      <div className="service-family-grid">
        {families.map((family, i) => {
          return (
            <Link
              to={`/urunler?grup=${["glass", "aluminium", "metal"][i]}`}
              className="service-family"
              key={family.name}
            >
              <div className="service-family-image">
                <img src={family.image} alt="" loading="lazy" />
                <span>
                  0{i + 1} / {family.name}
                </span>
                <ArrowUpRight size={22} />
              </div>
              <h3>{family.title}</h3>
              <p>{family.text}</p>
              <span className="text-link">
                {t("Çözümleri inceleyin", "Explore solutions")}
                <ArrowRight size={16} />
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
function ProjectJourney() {
  const { t, settings, en } = useSite();
  const steps = [
    [
      t("İhtiyacınızı dinliyoruz", "We listen first"),
      t(
        "Kullanım amacınızı, beklentilerinizi ve mekânın koşullarını birlikte netleştirelim.",
        "Let’s understand your needs, expectations and the conditions of your space.",
      ),
    ],
    [
      t("Yerinde değerlendiriyoruz", "We assess the site"),
      t(
        "Ölçü, taşıyıcı yüzey, su tahliyesi ve erişim gibi uygulama detaylarını inceleyelim.",
        "We assess dimensions, supporting surfaces, drainage and access.",
      ),
    ],
    [
      t("Kapsamı birlikte seçiyoruz", "We define the scope"),
      t(
        "Malzeme, cam, renk, donanım ve teslim koşulları yazılı teklifin parçası olsun.",
        "Materials, glazing, colour, hardware and delivery terms form your written proposal.",
      ),
    ],
    [
      t("Uygulama & teslim", "Installation & handover"),
      t(
        "Kontrol, kullanım bilgilendirmesi ve bakım önerileriyle süreci tamamlayalım.",
        "Complete the project with checks, operating guidance and maintenance advice.",
      ),
    ],
  ];
  return (
    <section className="journey-section">
      <div className="container">
        <div className="section-heading">
          <div>
            <Eyebrow>
              {t("FİKİRDEN UYGULAMAYA", "FROM IDEA TO INSTALLATION")}
            </Eyebrow>
            <h2>
              {!en && settings.processTitle ? (
                String(settings.processTitle)
              ) : (
                <>
                  {t("Her adımda,", "At every step,")}{" "}
                  <em>{t("birlikte.", "together.")}</em>
                </>
              )}
            </h2>
          </div>
          <p>
            {t(
              "Konutunuz veya kurumsal projeniz için açık, anlaşılır bir süreç.",
              "A clear, considered process for your home or commercial project.",
            )}
          </p>
        </div>
        <div className="journey-grid">
          {steps.map(([title, text], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <h3>
                {!en && settings[`processStep${i + 1}Title`]
                  ? String(settings[`processStep${i + 1}Title`])
                  : title}
              </h3>
              <p>
                {!en && settings[`processStep${i + 1}Text`]
                  ? String(settings[`processStep${i + 1}Text`])
                  : text}
              </p>
            </article>
          ))}
        </div>
        <Link className="text-link" to="/is-ortakligi">
          {t(
            "Kurumsal projenizi paylaşın",
            "Tell us about your commercial project",
          )}
          <ArrowUpRight size={18} />
        </Link>
      </div>
    </section>
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
function RegionPreview() {
  const { content, t, local, settings, en } = useSite();
  const regions = content.filter((c) => c.type === "region");
  if (!regions.length) return null;
  return (
    <section className="section container region-preview">
      <div>
        <Eyebrow>{t("ANKARA & ÇEVRESİ", "ANKARA & SURROUNDINGS")}</Eyebrow>
        <h2>
          {!en && settings.regionTitle ? (
            String(settings.regionTitle)
          ) : (
            <>
              {t("Size daha", "A little")}{" "}
              <em>{t("yakın.", "closer to you.")}</em>
            </>
          )}
        </h2>
        <p>
          {t(
            "Etimesgut merkezli yaklaşımımızla bölgenizin yapı ve kullanım koşullarını birlikte değerlendirelim.",
            "With an Etimesgut-based approach, let’s assess local building and use conditions together.",
          )}
        </p>
        <Link className="text-link" to="/bolgeler">
          {t("Tüm hizmet bölgeleri", "All service areas")}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="region-links">
        {regions.slice(0, 7).map((c) => (
          <Link key={c.id} to={pathFor(c)}>
            <MapPin size={17} />
            <span>{local(c, "title")}</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </div>
    </section>
  );
}
function Regions() {
  const { content, t, local, settings } = useSite();
  return (
    <>
      <PageHead
        title={t("Projenizin olduğu yerde.", "Where your project is.")}
        subtitle={t(
          "Cam, alüminyum ve metal uygulamalarını bölgenizin ihtiyaçlarıyla birlikte planlayın. Ziyaret ve uygulama uygunluğu talebinize göre teyit edilir.",
          "Plan glass, aluminium and metal applications around local needs. Site visits and service availability are confirmed for your enquiry.",
        )}
        tag={t("HİZMET BÖLGELERİ", "SERVICE AREAS")}
      />
      <section className="section container">
        <div className="regions-grid">
          {content
            .filter((c) => c.type === "region")
            .map((c) => (
              <Link className="region-card" to={pathFor(c)} key={c.id}>
                <MapPin size={28} />
                <small>{c.category || "ANKARA"}</small>
                <h2>{local(c, "title")}</h2>
                <p>{local(c, "summary")}</p>
                <span className="text-link">
                  {t("Bölgeyi inceleyin", "Explore area")}
                  <ArrowUpRight size={17} />
                </span>
              </Link>
            ))}
        </div>
        {settings.serviceAreas && (
          <p className="form-note">{String(settings.serviceAreas)}</p>
        )}
      </section>
      <ProjectJourney />
      <CallToAction />
    </>
  );
}
function FAQPreview() {
  const { content, t, local } = useSite();
  return (
    <section className="section container faq-preview">
      <div className="section-heading">
        <div>
          <Eyebrow>{t("KARAR VERMEDEN ÖNCE", "BEFORE YOU DECIDE")}</Eyebrow>
          <h2>
            {t("Sormak", "It starts with")}{" "}
            <em>{t("iyi gelir.", "a question.")}</em>
          </h2>
        </div>
        <Link className="text-link" to="/sikca-sorulan-sorular">
          {t("Tüm sorular & yanıtlar", "All questions & answers")}
          <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="faq-preview-grid">
        {content
          .filter((c) => c.type === "faq")
          .slice(0, 4)
          .map((c) => (
            <details key={c.id}>
              <summary>
                {local(c, "title")}
                <Plus size={19} />
              </summary>
              <p>{local(c, "body")}</p>
            </details>
          ))}
      </div>
    </section>
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
  tag,
}: {
  title: string;
  subtitle?: string;
  tag?: string;
}) {
  const { t } = useSite();
  return (
    <section className="page-head">
      <div className="container">
        <div className="breadcrumbs">
          <Link to="/">{t("Ana Sayfa", "Home")}</Link>
          <span>/</span>
          <span>{title}</span>
        </div>
        <Eyebrow>{tag || "KILINÇ DEKORASYON"}</Eyebrow>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </section>
  );
}
function Products() {
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
                    <img src={c.image} alt="" />
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
          src={item.image || "/images/hero.svg"}
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
                  <img
                    src={c.image || `/images/project-${(i % 4) + 1}.svg`}
                    alt={local(c, "title")}
                  />
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
            <img
              src={c.image || "/images/hero.svg"}
              alt={c.imageAlt || local(c, "title")}
            />
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
function Corporate() {
  const { content, settings, t, en } = useSite();
  return (
    <>
      <PageHead
        title={t(
          "İyi mekânlar, özenle başlar.",
          "Good spaces start with care.",
        )}
        subtitle={t(
          "Kılınç Dekorasyon ile balkon, teras ve bahçenizin potansiyelini keşfedin.",
          "Discover the potential of your balcony, terrace and garden with Kılınç Dekorasyon.",
        )}
        tag={t("BİZ KİMİZ?", "OUR STORY")}
      />
      <section className="container section corporate-intro">
        <img
          src="/images/project-3.svg"
          alt={t(
            "Cam sistemli yaşam alanı tasarımı",
            "Glass-enclosed living space concept",
          )}
        />
        <div>
          <Eyebrow>{t("İHTİYACINIZI DİNLİYORUZ", "WE LISTEN FIRST")}</Eyebrow>
          <h2>
            {t("Mekânı değil,", "Designed around")}
            <br />
            <em>{t("yaşamı düşünüyoruz.", "the way you live.")}</em>
          </h2>
          <p>
            {(en ? String(settings.aboutTextEn || "") : settings.aboutText) ||
              t(
                "Cam balkon ve açık alan çözümlerinde, kullanım ihtiyaçlarınıza uygun sistemleri bir araya getiriyoruz. Önce sizi ve mekânınızı tanıyor, ardından ölçü, malzeme ve uygulama seçeneklerini birlikte değerlendiriyoruz.",
                "We bring together glass and outdoor systems that fit your everyday needs. First we get to know you and your space, then explore measurements, materials and installation options together.",
              )}
          </p>
          <Link to="/iletisim" className="text-link">
            {t("Tanışalım", "Let’s meet")}
            <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="process-section">
        <div className="container">
          <Eyebrow>{t("NASIL ÇALIŞIYORUZ?", "HOW WE WORK")}</Eyebrow>
          <h2>
            {t("İlk fikirden", "From first idea")}{" "}
            <em>{t("son dokunuşa.", "to final detail.")}</em>
          </h2>
          <div className="process-grid">
            {[
              [
                t("Sizi dinliyoruz", "We listen"),
                t(
                  "Beklentilerinizi, mekânınızı ve kullanım alışkanlıklarınızı öğreniyoruz.",
                  "We learn about your expectations, space and everyday needs.",
                ),
              ],
              [
                t("Birlikte planlıyoruz", "We plan together"),
                t(
                  "Keşif ve ölçü sonrası sistem, cam ve renk seçeneklerini değerlendiriyoruz.",
                  "After a site assessment, we discuss systems, glazing and finishes.",
                ),
              ],
              [
                t("Özenle uyguluyoruz", "We install with care"),
                t(
                  "Onaylanan projeyi planlanan uygulama adımlarıyla hayata geçiriyoruz.",
                  "We bring the agreed design to life with a considered installation plan.",
                ),
              ],
              [
                t("Yanınızda oluyoruz", "We stay in touch"),
                t(
                  "Kullanım, bakım ve servis sorularınızda destek sağlıyoruz.",
                  "We support you with use, maintenance and service questions.",
                ),
              ],
            ].map(([title, body], i) => (
              <div key={i}>
                <span>0{i + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="corporate-links">
          {content
            .filter(
              (c) =>
                c.type === "page" &&
                !["gizlilik", "kvkk", "cerez-politikasi"].includes(c.slug),
            )
            .map((c) => (
              <Link to={pathFor(c)} key={c.id}>
                <span>{c.title}</span>
                <ArrowUpRight />
              </Link>
            ))}
        </div>
      </section>
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
function InquiryForm({ dealer = false }: { dealer?: boolean }) {
  const { content, t } = useSite();
  const [params] = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle"),
    [error, setError] = useState(""),
    [receipt, setReceipt] = useState("");
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
          subject: dealer
            ? "İş ortaklığı başvurusu"
            : data.subject || "Teklif talebi",
          consent: data.consent === "on",
        }),
      });
      const body = await res.json();
      if (!res.ok)
        throw new Error(
          body.error ||
            t("Talep gönderilemedi.", "Could not submit your request."),
        );
      setReceipt(body.id || "");
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
            "Bilgileriniz kaydedildi. Ekibimiz talebinizi yönetim panelinden inceleyebilir.",
            "Your information has been saved for our team to review.",
          )}
        </p>
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
          {dealer
            ? t("Firma / başvuru konusu", "Company / enquiry subject")
            : t("İlgilendiğiniz sistem", "System of interest")}
          {dealer ? (
            <input name="subject" maxLength={200} />
          ) : (
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
          )}
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
            <option>Kurumsal proje</option>
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
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={4}
          placeholder={
            dealer
              ? t(
                  "Firmanız, bölgeniz ve iş birliği beklentileriniz…",
                  "Your company, region and partnership expectations…",
                )
              : t(
                  "Uygulama yapılacak alan, yaklaşık ölçüler, bulunduğunuz il/ilçe…",
                  "Your location, approximate measurements and what you have in mind…",
                )
          }
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
          : dealer
            ? t("Başvuruyu gönder", "Submit application")
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
function Contact({
  quote = false,
  dealer = false,
}: {
  quote?: boolean;
  dealer?: boolean;
}) {
  const { settings, t } = useSite();
  const phone = settings.phone,
    email = settings.email,
    address = settings.address,
    wa = String(settings.whatsapp || "").replace(/\D/g, "");
  return (
    <>
      <PageHead
        title={
          dealer
            ? t(
                "Birlikte daha fazlası mümkün.",
                "Let’s build something together.",
              )
            : quote
              ? t("Hayalinizdeki alanı konuşalım.", "Tell us about your space.")
              : t("Tanışmak için ilk adım.", "A conversation starts here.")
        }
        subtitle={
          dealer
            ? t(
                "İş ortaklığı ve uygulama iş birliği için başvurunuzu paylaşın.",
                "Share your application for installation and business partnerships.",
              )
            : t(
                "Bize projenizi anlatın. Size uygun sistemi ve uygulama seçeneklerini birlikte değerlendirelim.",
                "Tell us about your project. Let’s explore the systems and options that work for you.",
              )
        }
        tag={
          dealer
            ? t("İŞ ORTAKLIĞI", "PARTNERSHIPS")
            : quote
              ? t("TEKLİF & KEŞİF TALEBİ", "QUOTE & SITE ASSESSMENT")
              : t("İLETİŞİM", "CONTACT")
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
          <h3>
            {dealer
              ? t("İş ortaklığı başvuru formu", "Partnership application")
              : t("Sizi dinliyoruz.", "We’re listening.")}
          </h3>
          <p>
            {t(
              "* ile işaretli alanlar zorunludur.",
              "Fields marked * are required.",
            )}
          </p>
          <InquiryForm dealer={dealer} />
        </div>
      </section>
    </>
  );
}
function Catalog() {
  const { t, content, en } = useSite();
  return (
    <>
      <PageHead
        title={t("İlham veren bir başlangıç.", "An inspiring place to start.")}
        subtitle={t(
          "Ürün ve sistem özetlerini tek bir PDF kataloğunda inceleyin.",
          "Browse product and system overviews in one PDF catalogue.",
        )}
        tag={t("DİJİTAL KATALOG", "DIGITAL CATALOGUE")}
      />
      <section className="container section catalog-page">
        <div className="catalog-preview">
          <div className="catalog-book large">
            <span>
              KILINÇ<small>DEKORASYON</small>
            </span>
            <img
              src="/images/hero.svg"
              alt={t(
                "Kılınç Dekorasyon katalog kapağı",
                "Kılınç Dekorasyon catalogue cover",
              )}
            />
            <p>
              DIŞARIDA HAYAT VAR.<small>YAŞAM ALANLARI / SİSTEMLER</small>
            </p>
          </div>
        </div>
        <div>
          <Eyebrow>
            {t("SİSTEMLERE GENEL BAKIŞ", "SYSTEMS AT A GLANCE")}
          </Eyebrow>
          <h2>
            {t("Birlikte keşfedeceğimiz", "A world of")}
            <br />
            <em>{t("yeni olasılıklar.", "new possibilities.")}</em>
          </h2>
          <p>
            {t(
              "Kataloğumuzda cam balkon, sürme, giyotin ve açık alan çözümlerimizi bulabilirsiniz. İçerik, güncel ürün bilgilerimizden oluşturulur.",
              "Explore glass balcony, sliding, guillotine and outdoor solutions. The catalogue is generated from our current product information.",
            )}
          </p>
          <div className="catalog-facts">
            <span>
              {content.filter((c) => c.type === "product").length}{" "}
              {t("sistem", "systems")}
            </span>
            <span>PDF</span>
            <span>{t("Ücretsiz indirme", "Free download")}</span>
          </div>
          <a
            href={en ? "/api/catalog.pdf?lang=en" : "/api/catalog.pdf"}
            download="kilinc-dekarasyon-katalog.pdf"
            className="button"
          >
            {t("PDF kataloğu indir", "Download PDF catalogue")}
            <Download size={18} />
          </a>
          <p className="muted">
            {t(
              "Nihai teknik özellikler ve fiyatlar, projeniz için hazırlanacak teklifte belirtilir.",
              "Final technical specifications and prices are confirmed in your project quotation.",
            )}
          </p>
        </div>
      </section>
      <CallToAction />
    </>
  );
}
function Footer() {
  const { settings, content, t } = useSite();
  const socials = [
    { key: "instagram", Icon: Instagram },
    { key: "facebook", Icon: Facebook },
    { key: "youtube", Icon: Youtube },
    { key: "linkedin", Icon: Linkedin },
  ];
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Logo />
          <p>
            {String(
              settings.footerText ||
                t(
                  "Hayata açılan mekânlar. Cam, alüminyum ve metal çözümleri, projenize özel.",
                  "Spaces that open up to life. Glass, aluminium and metal, designed for your project.",
                ),
            )}
          </p>
          <div className="social-links">
            {socials.map(
              ({ key, Icon }) =>
                Boolean(settings[key]) && (
                  <a
                    key={key}
                    href={String(settings[key])}
                    aria-label={key}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon size={18} />
                  </a>
                ),
            )}
          </div>
        </div>
        <div>
          <h4>{t("SİSTEMLERİMİZ", "OUR SYSTEMS")}</h4>
          {content
            .filter((c) => c.type === "product")
            .slice(0, 6)
            .map((c) => (
              <Link to={pathFor(c)} key={c.id}>
                {t(c.title, c.titleEn || c.title)}
              </Link>
            ))}
          <Link to="/urunler">
            {t("Tüm sistemler", "All systems")}
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <div>
          <h4>{t("KEŞFEDİN", "EXPLORE")}</h4>
          <Link to="/kurumsal">{t("Hakkımızda", "About us")}</Link>
          {settings.showProjects !== false && (
            <Link to="/projeler">{t("Yaşam alanları", "Living spaces")}</Link>
          )}
          {settings.showArticles !== false && (
            <Link to="/blog">
              {t("İlham & fikirler", "Ideas & inspiration")}
            </Link>
          )}
          {settings.showRegions !== false && (
            <Link to="/bolgeler">{t("Hizmet bölgeleri", "Service areas")}</Link>
          )}
          <Link to="/sistem-secici">{t("Sistem seçici", "System finder")}</Link>
          <Link to="/katalog">{t("Dijital katalog", "Digital catalogue")}</Link>
          {settings.showFaq !== false && (
            <Link to="/sikca-sorulan-sorular">
              {t("Sıkça sorulan sorular", "FAQs")}
            </Link>
          )}
          <Link to="/is-ortakligi">{t("İş ortaklığı", "Partnerships")}</Link>
          <Link to="/kurumsal/garanti-ve-servis">
            {t("Garanti & servis", "Warranty & service")}
          </Link>
        </div>
        <div>
          <h4>{t("BİRLİKTE PLANLAYALIM", "LET’S MAKE A PLAN")}</h4>
          <p>
            {t(
              "Mekânınız için yeni bir fikir mi var?",
              "Have an idea for your space?",
            )}
          </p>
          <Link to="/teklif-al" className="footer-contact">
            {t("Projenizi konuşalım", "Let’s talk")}
            <ArrowUpRight size={23} />
          </Link>
          {settings.phone && (
            <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
              {settings.phone}
            </a>
          )}
          {settings.email && (
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
          )}
          <Link to="/iletisim">
            {t("İletişim bilgileri", "Contact details")}
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>
          © {new Date().getFullYear()} Kılınç Dekorasyon.{" "}
          {t("Tüm hakları saklıdır.", "All rights reserved.")}
        </span>
        <div>
          <Link to="/kurumsal/kvkk">KVKK</Link>
          <Link to="/kurumsal/gizlilik">{t("Gizlilik", "Privacy")}</Link>
          <Link to="/kurumsal/cerez-politikasi">
            {t("Çerez politikası", "Cookie policy")}
          </Link>
          <Link to="/yonetim">{t("Yönetim", "Admin")}</Link>
        </div>
      </div>
    </footer>
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
    if (data && Array.isArray(data.settings.languages) && !data.settings.languages.includes("en")) {
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
    setMeta("robots", admin ? "noindex, nofollow" : "index, follow");
    if (admin) {
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
      "/is-ortakligi": [
        "Kurumsal Projeler ve İş Ortaklığı",
        "Commercial Projects & Partnerships",
      ],
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
      <ScrollTop />
      <a className="skip-link" href="#main">
        {en ? "Skip to content" : "İçeriğe geç"}
      </a>
      <Header />
      <main id="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/urunler" element={<Products />} />
          <Route path="/sistem-secici" element={<SystemFinder />} />
          <Route path="/bolgeler" element={<Regions />} />
          <Route path="/bolgeler/:slug" element={<Detail type="region" />} />
          <Route path="/urunler/:slug" element={<Detail type="product" />} />
          <Route path="/projeler" element={<Listing type="project" />} />
          <Route path="/projeler/:slug" element={<Detail type="project" />} />
          <Route path="/blog" element={<Listing type="article" />} />
          <Route path="/blog/:slug" element={<Detail type="article" />} />
          <Route path="/kurumsal" element={<Corporate />} />
          <Route path="/kurumsal/:slug" element={<Detail type="page" />} />
          <Route path="/sikca-sorulan-sorular" element={<FAQ />} />
          <Route path="/iletisim" element={<Contact />} />
          <Route path="/teklif-al" element={<Contact quote />} />
          <Route path="/is-ortakligi" element={<Contact dealer />} />
          <Route path="/katalog" element={<Catalog />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
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
    </SiteContext.Provider>
  );
}
