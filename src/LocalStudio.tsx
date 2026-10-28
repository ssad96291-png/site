import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Ruler,
  Search,
  UserRound,
  X,
} from "lucide-react";
import { contentImage, contentPath, useSite } from "./site-context";
import type { Content } from "./types";

const number = (index: number) => String(index + 1).padStart(2, "0");
function LocalMark() {
  return (
    <span className="ls-mark" aria-hidden="true">
      <span>K</span>
      <i />
    </span>
  );
}
function LocalBrand() {
  const { settings, t } = useSite();
  return (
    <Link
      to="/"
      className="ls-brand"
      aria-label={t("Kılınç Dekorasyon ana sayfa", "Kılınç Dekorasyon home")}
    >
      <LocalMark />
      <span>
        <strong>{String(settings.logoText || "KILINÇ")}</strong>
        <small>DEKORASYON</small>
      </span>
    </Link>
  );
}
export function LocalHeader() {
  const { content, t, en, setEn, settings, local } = useSite();
  const location = useLocation();
  const [menu, setMenu] = useState(false),
    [search, setSearch] = useState(false),
    [query, setQuery] = useState("");
  useEffect(() => {
    setMenu(false);
    setSearch(false);
    setQuery("");
  }, [location.pathname, location.search]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenu(false);
        setSearch(false);
      }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, []);
  const matches =
    query.trim().length > 1
      ? content
          .filter(
            (c) =>
              c.published &&
              !/bayi|ortakl|franchise|dealer|partner/i.test(
                c.title + " " + c.slug,
              ) &&
              `${local(c, "title")} ${local(c, "summary")}`
                .toLocaleLowerCase("tr")
                .includes(query.trim().toLocaleLowerCase("tr")),
          )
          .slice(0, 7)
      : [];
  return (
    <header className="ls-header">
      <div className="ls-header-main ls-wrap">
        <LocalBrand />
        <nav
          className={`ls-nav ${menu ? "is-open" : ""}`}
          aria-label={t("Ana menü", "Main navigation")}
        >
          <NavLink to="/hizmetler">{t("Hizmetler", "What we do")}</NavLink>
          {settings.showProjects !== false && (
            <NavLink to="/fikir-defteri">
              {t("Fikir defteri", "Idea notebook")}
            </NavLink>
          )}
          <NavLink to="/dukkanimiz">{t("Dükkânımız", "Our workshop")}</NavLink>
          <NavLink to="/iletisim">{t("İletişim", "Get in touch")}</NavLink>
          <Link to="/hesabim" className="ls-mobile-account">
            <UserRound size={16} />
            {t("Talep takibi", "Track a request")}
          </Link>
        </nav>
        <div className="ls-header-tools">
          <Link to="/hesabim" className="ls-account">
            <UserRound size={15} />
            <span>{t("Talep takibi", "Your request")}</span>
          </Link>
          {settings.languages?.includes("en") && (
            <button
              className="ls-language"
              onClick={() => setEn(!en)}
              aria-label={t("İngilizceye geç", "Switch to Turkish")}
            >
              {en ? "TR" : "EN"}
            </button>
          )}
          <button
            className="ls-icon-button"
            aria-label={t("Site içinde ara", "Search this site")}
            aria-expanded={search}
            onClick={() => {
              setSearch(!search);
              setMenu(false);
            }}
          >
            <Search size={18} />
          </button>
          <button
            className="ls-menu-button ls-icon-button"
            aria-label={t("Menüyü aç/kapat", "Open or close menu")}
            aria-expanded={menu}
            onClick={() => {
              setMenu(!menu);
              setSearch(false);
            }}
          >
            {menu ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {search && (
        <section
          className="ls-site-search ls-wrap"
          aria-label={t("Site araması", "Site search")}
        >
          <label>
            <span>
              {t("Neyi merak ediyorsunuz?", "What would you like to know?")}
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(
                "Cam balkon, bakım, ölçü…",
                "Glazing, care, measuring…",
              )}
              autoFocus
            />
          </label>
          {matches.length > 0 ? (
            <div className="ls-search-results">
              {matches.map((c) => (
                <Link key={c.id} to={contentPath(c)}>
                  {local(c, "title")}
                  <ArrowUpRight size={16} />
                </Link>
              ))}
            </div>
          ) : (
            query.trim().length > 1 && (
              <p>
                {t(
                  "Sonuç bulunamadı. Sorunuzu iletişim formundan iletebilirsiniz.",
                  "No matches. Send us your question through the contact form.",
                )}
              </p>
            )
          )}
        </section>
      )}
    </header>
  );
}

export function LocalPageHead({
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
    <section className="ls-page-head ls-wrap">
      <div className="ls-page-kicker">
        <Link to="/">{t("Kılınç Dekorasyon", "Kılınç Dekorasyon")}</Link>
        <span>/</span>
        <span>{tag || t("Dükkân notları", "Workshop notes")}</span>
      </div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      <span className="ls-page-line" aria-hidden="true" />
    </section>
  );
}
function ContactLink({ className = "ls-button" }: { className?: string }) {
  const { t } = useSite();
  return (
    <Link to="/teklif-al" className={className}>
      {t("İşinizi konuşalım", "Tell us what you need")}
      <ArrowUpRight size={18} />
    </Link>
  );
}
function WorkSheet() {
  const { t } = useSite();
  const [space, setSpace] = useState("Balkon"),
    [need, setNeed] = useState("Yeni uygulama");
  const spaces = [
    ["Balkon", "Balcony"],
    ["Teras / bahçe", "Terrace / garden"],
    ["Kapı / cephe", "Door / façade"],
    ["Diğer", "Other"],
  ];
  const needs = [
    ["Yeni uygulama", "New installation"],
    ["Bakım / onarım", "Care / repair"],
  ];
  const chosenSpace = spaces.find(([value]) => value === space)!;
  const chosenNeed = needs.find(([value]) => value === need)!;
  const message = `${t(chosenSpace[0], chosenSpace[1])} — ${t(chosenNeed[0], chosenNeed[1])}. ${t("Yaklaşık ölçüler ve uygulama detayları için görüşmek istiyorum.", "I would like to discuss measurements and installation details.")}`;
  return (
    <aside className="ls-work-sheet" aria-labelledby="ls-work-sheet-title">
      <div className="ls-sheet-punch" aria-hidden="true">
        <i />
        <i />
      </div>
      <span className="ls-small-label">
        {t("İLK GÖRÜŞME NOTU", "FIRST CONVERSATION")}
      </span>
      <h2 id="ls-work-sheet-title">
        {t("Aklınızda nasıl bir iş var?", "What do you have in mind?")}
      </h2>
      <label>
        {t("Uygulama alanı", "Your space")}
        <select value={space} onChange={(e) => setSpace(e.target.value)}>
          {spaces.map(([tr, eng]) => (
            <option value={tr} key={tr}>
              {t(tr, eng)}
            </option>
          ))}
        </select>
        <ChevronDown size={15} />
      </label>
      <fieldset>
        <legend>{t("İhtiyacınız", "What you need")}</legend>
        {needs.map(([tr, eng]) => (
          <label key={tr}>
            <input
              type="radio"
              name="local-need"
              value={tr}
              checked={need === tr}
              onChange={() => setNeed(tr)}
            />
            <span>{t(tr, eng)}</span>
          </label>
        ))}
      </fieldset>
      <Link
        className="ls-button"
        to={`/teklif-al?mesaj=${encodeURIComponent(message)}`}
      >
        {t("Bu notla devam et", "Continue with this note")}
        <ArrowRight size={17} />
      </Link>
      <small>
        {t(
          "Formda iletişim bilgilerinizi ekleyebilirsiniz.",
          "Add your contact details on the next page.",
        )}
      </small>
      <span className="ls-sheet-id" aria-hidden="true">
        K / 01 — {t("İŞ NOTU", "WORK NOTE")}
      </span>
    </aside>
  );
}
function ServiceRows({
  items,
  compact = false,
}: {
  items: Content[];
  compact?: boolean;
}) {
  const { local, t } = useSite();
  return (
    <div className={`ls-service-rows ${compact ? "ls-rows-compact" : ""}`}>
      {items.map((item, index) => (
        <article className="ls-service-row" key={item.id}>
          <span className="ls-row-number">{number(index)}</span>
          <div className="ls-service-description">
            <small>{item.category}</small>
            <h3>
              <Link to={contentPath(item)}>{local(item, "title")}</Link>
            </h3>
            <p>{local(item, "summary")}</p>
          </div>
          {!compact && (
            <img
              src={contentImage(item)}
              alt={item.imageAlt || local(item, "title")}
              loading="lazy"
            />
          )}
          <Link
            className="ls-row-link"
            to={contentPath(item)}
            aria-label={`${local(item, "title")} ${t("detayları", "details")}`}
          >
            <ArrowUpRight size={23} />
          </Link>
        </article>
      ))}
    </div>
  );
}
function LocalProcess() {
  const { t } = useSite();
  const stages = [
    [
      t("Önce dinleyelim.", "First, we listen."),
      t(
        "Alanı, kullanım ihtiyacınızı ve varsa sorunu birlikte tanımlıyoruz.",
        "We talk about the space, how you use it and any problem that needs attention.",
      ),
    ],
    [
      t("Yerinde netleştirelim.", "Make it clear on site."),
      t(
        "Ölçü, mevcut yapı ve uygulama koşulları keşifte değerlendirilir.",
        "Dimensions, the existing building and installation conditions are checked during the survey.",
      ),
    ],
    [
      t("Yazılı anlaşalım.", "Put it in writing."),
      t(
        "Malzeme, iş kapsamı, takvim ve ticari koşulları teklifinizde görürsünüz.",
        "Your proposal sets out materials, scope, timing and commercial terms.",
      ),
    ],
    [
      t("Uygulayıp teslim edelim.", "Install and hand over."),
      t(
        "İş tamamlandığında kullanım ve bakım notlarını sizinle paylaşırız.",
        "We share operating and care notes when the agreed work is handed over.",
      ),
    ],
  ];
  return (
    <ol className="ls-process">
      {stages.map(([title, text], i) => (
        <li key={title}>
          <span>{number(i)}</span>
          <div>
            <h3>{title}</h3>
            <p>{text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function LocalHome() {
  const { settings, content, t, local, en } = useSite();
  const products = content.filter((c) => c.type === "product");
  const featured = products.filter((c) => c.featured).slice(0, 4);
  const services = featured.length ? featured : products.slice(0, 4);
  const hero = en
    ? String(
        settings.heroTitleEn ||
          "Made for your space. Talk to the people doing the work.",
      )
    : String(settings.heroTitle || "Ölçünüze göre. Ustanızla doğrudan.");
  const intro = en
    ? String(
        settings.heroSubtitleEn ||
          "Glass, aluminium and metalwork, planned from our one workshop in Etimesgut. Tell us what you need, and we will discuss the next step together.",
      )
    : String(
        settings.heroSubtitle ||
          "Cam, alüminyum ve metal işlerinizi Etimesgut'taki tek dükkânımızdan planlıyoruz. Ne yapmak istediğinizi anlatın; ölçü, malzeme ve uygulama detaylarını birlikte konuşalım.",
      );
  const visual = String(settings.heroImage || "");
  const heroImage =
    visual && visual !== "/images/hero.svg"
      ? visual
      : "/images/original-balcony.png";
  return (
    <>
      <section className="ls-home-intro ls-wrap">
        <div className="ls-intro-copy">
          <span className="ls-location">
            <i />
            {t("ANKARA / ETİMESGUT", "ANKARA / ETİMESGUT")}
          </span>
          <h1>{hero}</h1>
          <p>{intro}</p>
          <div className="ls-intro-actions">
            <ContactLink />
            {settings.phone && (
              <a
                className="ls-phone-link"
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
              >
                <Phone size={15} />
                {settings.phone}
              </a>
            )}
          </div>
          <span className="ls-intro-note">
            <span aria-hidden="true">↳</span>
            {t(
              "Tek dükkân. Aynı muhatap. İşin her adımında açık iletişim.",
              "One workshop. A direct conversation. Clear communication at every step.",
            )}
          </span>
        </div>
        <WorkSheet />
      </section>
      <section className="ls-photo-band ls-wrap">
        <figure>
          <img
            src={heroImage}
            alt={t(
              "Balkon kullanımı için temsili tasarım görselleştirmesi",
              "Concept visualisation of a balcony living space",
            )}
          />
          <figcaption>
            <span>{t("MEKÂN FİKRİ / 01", "SPACE STUDY / 01")}</span>
            <span>
              {t(
                "Başlangıç görseli bir tasarım konseptidir.",
                "The initial image is a design concept.",
              )}
            </span>
          </figcaption>
        </figure>
        <div className="ls-photo-note">
          <Ruler size={26} strokeWidth={1.2} />
          <p>
            {t(
              "Güzel bir sonuç, doğru ölçüyle başlar.",
              "A good result starts with the right measurements.",
            )}
          </p>
          <Link to="/kurumsal/olcu-rehberi">
            {t("İlk görüşmeye hazırlık", "Prepare for our first conversation")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
      <section className="ls-services-section ls-wrap">
        <div className="ls-section-heading">
          <div>
            <span className="ls-small-label">
              {t("DÜKKÂNDA NELER YAPIYORUZ?", "WHAT DO WE DO?")}
            </span>
            <h2>
              {String(
                settings.servicesTitle ||
                  t(
                    "Birlikte çözebileceğimiz işler.",
                    "Work we can plan together.",
                  ),
              )}
            </h2>
          </div>
          <Link className="ls-inline-link" to="/hizmetler">
            {t("Tüm hizmetler", "All services")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <ServiceRows items={services} compact />
      </section>
      <section className="ls-direct-panel">
        <div className="ls-wrap ls-direct-layout">
          <div>
            <span className="ls-small-label">
              {t("KILINÇ DEKORASYON", "KILINÇ DEKORASYON")}
            </span>
            <h2>
              {t(
                "İşinizi anlatırken arada mesafe olmasın.",
                "Keep the conversation close to the work.",
              )}
            </h2>
          </div>
          <div>
            <p>
              {t(
                "Bir yerel işletmeyiz. İhtiyacınızı doğrudan bizimle konuşabilir, ilk görüşmeden sonra talebinizin durumunu müşteri panelinden takip edebilirsiniz.",
                "We are a local business. Discuss your needs directly with us, then follow your request through your customer account.",
              )}
            </p>
            <div className="ls-direct-links">
              <Link to="/dukkanimiz">
                {t("Dükkânımızı tanıyın", "Meet the workshop")}
                <ArrowRight size={16} />
              </Link>
              <Link to="/hesabim">
                {t("Mevcut talebime bak", "View my request")}
                <UserRound size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="ls-wrap ls-process-section">
        <div className="ls-section-heading">
          <div>
            <span className="ls-small-label">
              {t("BİR İŞ NASIL İLERLER?", "HOW DOES A JOB MOVE FORWARD?")}
            </span>
            <h2>
              {t("Karışık değil, konuşarak.", "A clear plan, step by step.")}
            </h2>
          </div>
          <Link className="ls-inline-link" to="/kurumsal/uygulama-sureci">
            {t("Sürecin ayrıntıları", "More about the process")}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <LocalProcess />
      </section>
      {settings.showProjects !== false && (
        <section className="ls-notebook-callout ls-wrap">
          <div className="ls-notebook-stamp" aria-hidden="true">
            <span>K</span>
            <small>{t("FİKİR DEFTERİ", "IDEA NOTEBOOK")}</small>
          </div>
          <div>
            <h2>
              {t(
                "Önce bir fikir, sonra size özel detaylar.",
                "An idea first. The details come next.",
              )}
            </h2>
            <p>
              {t(
                "Başlangıç konseptleri farklı kullanım olanaklarını gösterir. Kendi alanınıza uygunluğunu yerinde birlikte değerlendiririz.",
                "Concept studies show ways a space might be used. We assess what works for your own site together.",
              )}
            </p>
            <Link className="ls-inline-link" to="/fikir-defteri">
              {t("Fikir defterini aç", "Open the notebook")}
              <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      )}
      <section className="ls-final-note ls-wrap">
        <span>{t("BİR SORUNUZ MU VAR?", "HAVE A QUESTION?")}</span>
        <h2>
          {t(
            "Ölçüler hazır olmasa da konuşabiliriz.",
            "You do not need all the measurements to start.",
          )}
        </h2>
        <ContactLink />
      </section>
    </>
  );
}

function familyOf(item: Content) {
  if (/demir|çelik|ferforje|yangın|metal/i.test(item.title)) return "metal";
  if (/alüminyum|cephe|ofis|doğrama/i.test(item.title)) return "aluminium";
  if (/pergola|tavan|tente|bahçe|teras/i.test(item.title)) return "outdoor";
  return "glass";
}
export function LocalProducts() {
  const { content, t, local } = useSite();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const family = params.get("grup") || "all";
  const items = content.filter(
    (c) =>
      c.type === "product" &&
      (family === "all" || familyOf(c) === family) &&
      `${local(c, "title")} ${local(c, "summary")} ${c.category}`
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <>
      <LocalPageHead
        title={t(
          "Hangi işi birlikte planlayalım?",
          "What would you like us to work on?",
        )}
        subtitle={t(
          "Bir malzeme listesi kadar, nasıl kullanacağınızı da önemsiyoruz. Hizmetleri inceleyin; alanınıza uygun seçeneği birlikte netleştirelim.",
          "How you use the space matters as much as the materials. Explore our services, then we can discuss the right option for you.",
        )}
        tag={t("HİZMETLER", "OUR SERVICES")}
      />
      <section className="ls-wrap ls-service-index">
        <div className="ls-service-tools">
          <div
            className="ls-filter-tabs"
            aria-label={t("Hizmet grubu", "Service family")}
          >
            {[
              ["all", t("Hepsi", "All")],
              ["glass", t("Cam", "Glass")],
              ["outdoor", t("Dış alan", "Outdoor")],
              ["aluminium", t("Alüminyum", "Aluminium")],
              ["metal", t("Metal", "Metal")],
            ].map(([value, label]) => (
              <button
                key={value}
                className={family === value ? "active" : ""}
                aria-pressed={family === value}
                onClick={() =>
                  setParams(value === "all" ? {} : { grup: value })
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="ls-search-label">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("Bir hizmet arayın", "Find a service")}
              aria-label={t("Ürün ara", "Search systems")}
            />
          </label>
        </div>
        <ServiceRows items={items} />
        {items.length === 0 && (
          <p className="ls-empty">
            {t(
              "Bu aramayla eşleşen hizmet bulunamadı.",
              "No services match this search.",
            )}
          </p>
        )}
        <div className="ls-helper-links">
          <span>{t("Karar vermeden önce", "Before you choose")}</span>
          <Link to="/sistem-secici">
            {t("İhtiyacımı tarif edeyim", "Describe my needs")}
            <ArrowRight size={15} />
          </Link>
          <Link to="/urun-karsilastir">
            {t("Seçenekleri karşılaştırayım", "Compare the options")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function LocalCorporate() {
  const { settings, t, en, content } = useSite();
  const about = en
    ? String(
        settings.aboutTextEn ||
          "We plan glass, aluminium and metalwork from one local workshop in Etimesgut, Ankara. Talk with us directly about your space, dimensions and what you need from the installation.",
      )
    : String(
        settings.aboutText ||
          "Ankara Etimesgut'ta tek dükkânı olan bir yerel işletmeyiz. Cam, alüminyum ve metal işlerinizde ihtiyacınızı dinliyor; ölçü, malzeme ve uygulama detaylarını sizinle birlikte planlıyoruz.",
      );
  const pages = [
    ["hakkimizda", t("Bizi biraz daha tanıyın", "A little more about us")],
    ["uygulama-sureci", t("Nasıl çalışıyoruz?", "How do we work?")],
    ["garanti-servis", t("Bakım ve servis notları", "Care and service notes")],
  ].filter(([slug]) =>
    content.some((c) => c.type === "page" && c.slug === slug),
  );
  return (
    <>
      <LocalPageHead
        title={t(
          "Bir dükkân, doğrudan iletişim.",
          "One workshop. A direct conversation.",
        )}
        tag={t("DÜKKÂNIMIZ", "OUR WORKSHOP")}
      />
      <section className="ls-wrap ls-workshop-page">
        <div className="ls-workshop-copy">
          <span className="ls-small-label">ANKARA / ETİMESGUT</span>
          <h2>{t("Kılınç Dekorasyon", "Kılınç Dekorasyon")}</h2>
          {about
            .split("\n")
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          <p>
            {t(
              "İşin kapsamını ve takvimini yerinde değerlendirdikten sonra yazılı olarak netleştiririz. İlk başvurudan teslim sonrasındaki servis talebine kadar aynı firma ile iletişim kurarsınız.",
              "We confirm scope and timing in writing after reviewing the site. From the first enquiry to a service request after handover, you are in touch with the same business.",
            )}
          </p>
          <ContactLink />
        </div>
        <StoreNote />
      </section>
      <section className="ls-wrap ls-workshop-notes">
        <span className="ls-small-label">
          {t("DÜKKÂNDAN NOTLAR", "NOTES FROM THE WORKSHOP")}
        </span>
        {pages.map(([slug, label]) => (
          <Link key={slug} to={`/kurumsal/${slug}`}>
            <span>{label}</span>
            <ArrowUpRight size={20} />
          </Link>
        ))}
      </section>
    </>
  );
}
function StoreNote() {
  const { settings, t } = useSite();
  return (
    <aside className="ls-store-note">
      <span className="ls-small-label">{t("BİZE ULAŞIN", "FIND US")}</span>
      <MapPin size={31} strokeWidth={1.2} />
      <h3>{t("Etimesgut, Ankara", "Etimesgut, Ankara")}</h3>
      {settings.address && <p>{settings.address}</p>}
      {settings.workingHours && (
        <div>
          <small>{t("ÇALIŞMA SAATLERİ", "OPENING HOURS")}</small>
          <p>{settings.workingHours}</p>
        </div>
      )}
      {settings.phone && (
        <a href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}>
          <Phone size={16} />
          {settings.phone}
        </a>
      )}
      {settings.email && (
        <a href={`mailto:${settings.email}`}>
          <Mail size={16} />
          {settings.email}
        </a>
      )}
      {settings.address ? (
        <a
          className="ls-inline-link"
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
          target="_blank"
          rel="noreferrer"
        >
          {t("Adresi haritada aç", "Open the address in maps")}
          <ArrowUpRight size={17} />
        </a>
      ) : (
        <Link className="ls-inline-link" to="/iletisim">
          {t("Ziyaret ve randevu için yazın", "Arrange a visit")}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </aside>
  );
}
export function LocalServiceAreas() {
  const { content, settings, t, local } = useSite();
  const [district, setDistrict] = useState("all");
  const regions = content.filter((c) => c.type === "region");
  return (
    <>
      <LocalPageHead
        title={t(
          "Dükkânımız Etimesgut’ta. İşinizi birlikte planlayalım.",
          "Our workshop is in Etimesgut. Let’s plan your job.",
        )}
        subtitle={t(
          "Keşif ve uygulama uygunluğunu adresiniz, işin kapsamı ve takvimimiz üzerinden görüşerek netleştiriyoruz.",
          "Survey and installation availability are confirmed against your address, the scope and our schedule.",
        )}
        tag={t("KEŞİF PLANLAMASI", "PLANNING A SURVEY")}
      />
      <section className="ls-wrap ls-area-page">
        <StoreNote />
        <div>
          <label className="ls-district-choice">
            {t("Bulunduğunuz bölge", "Your district")}
            <select
              aria-label={t("Bölge", "District")}
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="all">{t("Bütün başlıklar", "All areas")}</option>
              {regions.map((c) => (
                <option value={c.slug} key={c.id}>
                  {local(c, "title").split(" için")[0]}
                </option>
              ))}
            </select>
          </label>
          <div className="ls-area-list">
            {regions
              .filter((c) => district === "all" || c.slug === district)
              .map((c) => (
                <article key={c.id}>
                  <h2>{local(c, "title").split(" için")[0]}</h2>
                  <p>{local(c, "summary")}</p>
                  <div>
                    <Link to={contentPath(c)}>
                      {t("Bölge notlarını oku", "Read the area notes")}
                      <ArrowUpRight size={15} />
                    </Link>
                    <Link
                      to={`/teklif-al?bolge=${encodeURIComponent(c.title.split(" için")[0])}`}
                    >
                      {t("Adresim için keşif iste", "Request a survey here")}
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </article>
              ))}
          </div>
          {settings.serviceAreas && <p>{String(settings.serviceAreas)}</p>}
        </div>
      </section>
    </>
  );
}
export function LocalGallery() {
  const { content, t, local } = useSite();
  const projects = content.filter((c) => c.type === "project");
  const [selected, setSelected] = useState("");
  const current = projects.find((c) => c.id === selected) || projects[0];
  return (
    <>
      <LocalPageHead
        title={t("Fikir defteri.", "The idea notebook.")}
        subtitle={t(
          "Alanı nasıl kullanabileceğinize dair başlangıç notları. Konsept olarak sunulan görseller tamamlanmış müşteri işi değildir.",
          "Starting points for thinking about your space. Visuals labelled as concepts do not represent completed customer work.",
        )}
        tag={t("BAK / DÜŞÜN / KONUŞ", "LOOK / THINK / TALK")}
      />
      <section className="ls-wrap ls-notebook-page">
        {projects.length ? (
          <>
            <div
              className="ls-notebook-tabs"
              role="tablist"
              aria-label={t("Mekân fikirleri", "Space ideas")}
            >
              {projects.map((c, i) => (
                <button
                  id={`idea-tab-${c.id}`}
                  key={c.id}
                  role="tab"
                  aria-selected={current.id === c.id}
                  aria-controls={`idea-panel-${c.id}`}
                  tabIndex={current.id === c.id ? 0 : -1}
                  onClick={() => setSelected(c.id)}
                  onKeyDown={(e) => {
                    const movements: Record<string, number> = {
                      ArrowDown: 1,
                      ArrowRight: 1,
                      ArrowUp: -1,
                      ArrowLeft: -1,
                    };
                    let index = i;
                    if (e.key === "Home") index = 0;
                    else if (e.key === "End") index = projects.length - 1;
                    else if (movements[e.key])
                      index =
                        (i + movements[e.key] + projects.length) %
                        projects.length;
                    else return;
                    e.preventDefault();
                    const next = projects[index];
                    setSelected(next.id);
                    document.getElementById(`idea-tab-${next.id}`)?.focus();
                  }}
                >
                  <span>{number(i)}</span>
                  {local(c, "title")}
                  <ArrowUpRight size={16} />
                </button>
              ))}
            </div>
            <article
              id={`idea-panel-${current.id}`}
              role="tabpanel"
              aria-labelledby={`idea-tab-${current.id}`}
              className="ls-notebook-spread"
              tabIndex={0}
            >
              <figure>
                <img
                  src={contentImage(current)}
                  alt={current.imageAlt || local(current, "title")}
                />
                <figcaption>
                  {t("TASARIM / KULLANIM FİKRİ", "DESIGN / SPACE STUDY")}
                </figcaption>
              </figure>
              <div>
                <span className="ls-small-label">{current.category}</span>
                <h2>{local(current, "title")}</h2>
                <p>{local(current, "summary")}</p>
                <Link className="ls-inline-link" to={contentPath(current)}>
                  {t("Bu fikrin ayrıntıları", "More about this idea")}
                  <ArrowRight size={16} />
                </Link>
                <Link
                  className="ls-button"
                  to={`/teklif-al?mesaj=${encodeURIComponent(local(current, "title") + ": " + t("Kendi alanıma uygunluğunu görüşmek istiyorum.", "I would like to discuss this for my own space."))}`}
                >
                  {t("Kendi alanım için konuşalım", "Talk about my space")}
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          </>
        ) : (
          <div className="ls-empty">
            <p>
              {t(
                "Yeni fikir notları hazırlanıyor. Alanınızı doğrudan bize anlatabilirsiniz.",
                "New ideas are being prepared. Tell us about your space directly.",
              )}
            </p>
            <ContactLink />
          </div>
        )}
      </section>
    </>
  );
}
export function LocalCatalog() {
  const { t, en } = useSite();
  const [family, setFamily] = useState("all");
  return (
    <>
      <LocalPageHead
        title={t(
          "Görüşmeden önce elinizin altında.",
          "A little information before we talk.",
        )}
        tag={t("BİLGİ DOSYASI", "INFORMATION FILE")}
        subtitle={t(
          "Bu dosya sitede yayındaki hizmetlerden hazırlanır. Kapsam, ölçü, malzeme ve fiyat için yerinde değerlendirme gerekir.",
          "This file is generated from the services published on our website. Scope, dimensions, materials and pricing require a site review.",
        )}
      />
      <section className="ls-wrap ls-download-page">
        <div className="ls-file-illustration" aria-hidden="true">
          <span>KILINÇ</span>
          <i />
          <i />
          <i />
          <small>PDF / {t("HİZMET NOTLARI", "SERVICE NOTES")}</small>
        </div>
        <div>
          <h2>
            {t(
              "İlgilendiğiniz işleri seçin.",
              "Choose the work you are interested in.",
            )}
          </h2>
          <label>
            {t("Dosya kapsamı", "File contents")}
            <select value={family} onChange={(e) => setFamily(e.target.value)}>
              {[
                ["all", t("Tüm hizmetler", "All services")],
                ["outdoor", t("Teras ve bahçe", "Terrace and garden")],
                ["aluminium", t("Alüminyum işleri", "Aluminium work")],
                ["metal", t("Metal ve çelik işleri", "Metal and steel work")],
              ].map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <a
            className="ls-button"
            href={`/api/catalog.pdf?lang=${en ? "en" : "tr"}&family=${family}`}
            download
          >
            {t("Seçtiğim dosyayı indir", "Download this file")}
            <Download size={17} />
          </a>
          <p>
            {t(
              "Üretici markası, sertifika veya belirli bir performans belgesi yerine geçmez.",
              "This is not a manufacturer certificate or evidence of a specific performance.",
            )}
          </p>
          <Link className="ls-inline-link" to="/kurumsal/olcu-rehberi">
            {t("Ön ölçü notlarına da bakın", "See the measuring notes too")}
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function LocalInformation({
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
      <LocalPageHead
        title={t(
          "Bu not henüz yayında değil.",
          "This note is not published yet.",
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
      <LocalPageHead
        title={local(page, "title")}
        subtitle={local(page, "subtitle")}
        tag={t("DÜKKÂN NOTLARI", "WORKSHOP NOTES")}
      />
      <section className="ls-wrap ls-information-page">
        <div className="ls-reading-copy">
          {local(page, "body")
            .split("\n")
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
        {kind === "glossary" && (
          <label className="ls-search-label">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("Terim ara", "Search terms")}
              placeholder={t("Bir terim arayın", "Find a term")}
            />
          </label>
        )}
        {kind === "colours" ? (
          <div className="ls-colour-notes">
            {specs.map((spec, i) => (
              <button
                key={i}
                className={selected === spec.label ? "is-selected" : ""}
                onClick={() => setSelected(spec.label)}
                aria-pressed={selected === spec.label}
              >
                <span
                  style={{
                    backgroundColor: /^#[\da-f]{6}$/i.test(spec.value)
                      ? spec.value
                      : "#ddd",
                  }}
                />
                <span>{spec.label}</span>
                {selected === spec.label && <Check size={16} />}
              </button>
            ))}
          </div>
        ) : (
          <dl className="ls-definition-notes">
            {specs.map((spec, i) => (
              <div key={i}>
                <dt>
                  <span>{number(i)}</span>
                  {spec.label}
                </dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {kind === "colours" && (
          <div className="ls-choice-summary">
            <p>
              {selected
                ? t(`Seçiminiz: ${selected}`, `Your selection: ${selected}`)
                : t(
                    "Beğendiğiniz bir tonu notunuza ekleyebilirsiniz.",
                    "Include a colour you like in your note.",
                  )}
            </p>
            <Link
              className="ls-button"
              to={`/teklif-al?renk=${encodeURIComponent(selected)}`}
            >
              {t("Bu renkle teklif iste", "Enquire about this colour")}
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
        {kind === "measuring" && (
          <a className="ls-button" href="/api/measurement-guide.pdf" download>
            {t("Ön ölçü rehberi PDF indir", "Download the measuring guide")}
            <Download size={17} />
          </a>
        )}
        <div className="ls-helper-links">
          <Link to="/hizmetler">
            {t("Hizmetlere dön", "Back to services")}
            <ArrowRight size={15} />
          </Link>
          <Link to="/servis-talebi">
            {t("Bakım / onarım sorum var", "Ask about care or repair")}
            <ArrowUpRight size={15} />
          </Link>
        </div>
      </section>
    </>
  );
}
export function LocalFooter() {
  const { settings, t } = useSite();
  return (
    <footer className="ls-footer">
      <div className="ls-wrap">
        <div className="ls-footer-main">
          <div>
            <LocalBrand />
            <p>
              {t(
                "Etimesgut'taki tek dükkânımızdan,\nalanınıza uygun cam, alüminyum ve metal işleri.",
                "Glass, aluminium and metalwork for your space,\nfrom our one workshop in Etimesgut.",
              )}
            </p>
            <span className="ls-footer-location">
              <MapPin size={14} />
              {settings.address || "Etimesgut, Ankara"}
            </span>
            {settings.workingHours && <small>{settings.workingHours}</small>}
          </div>
          <section>
            <h2>{t("Konuşalım.", "Let’s talk.")}</h2>
            {settings.phone && (
              <a
                className="ls-footer-phone"
                href={`tel:${settings.phone.replace(/[^+\d]/g, "")}`}
              >
                {settings.phone}
                <ArrowUpRight size={22} />
              </a>
            )}
            {settings.email && (
              <a href={`mailto:${settings.email}`}>{settings.email}</a>
            )}
            <Link className="ls-footer-contact" to="/iletisim">
              {t("İletişim formunu aç", "Open the contact form")}
              <ArrowRight size={16} />
            </Link>
          </section>
          <nav aria-label={t("Alt menü", "Footer navigation")}>
            <Link to="/hizmetler">{t("Hizmetler", "Services")}</Link>
            <Link to="/servis-talebi">
              {t("Bakım / onarım", "Care / repair")}
            </Link>
            <Link to="/sikca-sorulan-sorular">
              {t("Aklınızdaki sorular", "Common questions")}
            </Link>
            <Link to="/hesabim">{t("Talep takibi", "Track your request")}</Link>
            <Link to="/hizmet-alani">
              {t("Keşif planlaması", "Planning a survey")}
            </Link>
          </nav>
        </div>
        <div className="ls-footer-bottom">
          <span>
            © {new Date().getFullYear()}{" "}
            {String(settings.companyName || "Kılınç Dekorasyon")}
          </span>
          <div>
            <Link to="/kurumsal/kvkk">KVKK</Link>
            <Link to="/kurumsal/gizlilik">{t("Gizlilik", "Privacy")}</Link>
            <Link to="/kurumsal/icerik-ve-kullanim-haklari">
              {t("İçerik hakları", "Content rights")}
            </Link>
            <a href="/licenses/THIRD-PARTY-NOTICES.txt">
              {t("Lisanslar", "Licences")}
            </a>
            <Link to="/yonetim">{t("Yönetim", "Admin")}</Link>
          </div>
        </div>
        <p className="ls-footer-disclosure">
          {t(
            "Başlangıç görselleri tasarım konseptidir; tamamlanmış uygulama örneği değildir. Teknik ve ticari koşullar işinize özel belirlenir.",
            "Initial visuals are design concepts, not completed installations. Technical and commercial terms are agreed for your job.",
          )}
        </p>
      </div>
    </footer>
  );
}
