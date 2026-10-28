import { useEffect, useState } from "react";
import { ArrowRight, MapPin, Phone, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useSite } from "./site-context";
type Dealer = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  district: string;
  regions: string[];
};
export default function DealerDirectory() {
  const { t } = useSite();
  const [dealers, setDealers] = useState<Dealer[]>([]),
    [query, setQuery] = useState(""),
    [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/dealers")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        if (active) setDealers(d.dealers || []);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);
  if (!dealers.length && !error) return null;
  const visible = dealers.filter((d) =>
    [d.name, d.city, d.district, ...d.regions]
      .join(" ")
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <section className="rs-dealer-directory">
      <div className="rs-section-title">
        <h2>{t("Bayi ve teknik ekipler", "Dealers & technical teams")}</h2>
        <label className="rs-search">
          <Search size={16} />
          <input
            aria-label={t("Bayi veya bölge ara", "Search dealers or regions")}
            placeholder={t("İsim veya bölge ara…", "Search name or region…")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      {error ? (
        <p role="status">
          {t(
            "Ekip listesi şu anda alınamadı. İletişim sayfasından bize ulaşabilirsiniz.",
            "The team directory is unavailable. Please contact us.",
          )}
        </p>
      ) : (
        <>
          <div className="rs-region-grid">
            {visible.map((d) => (
              <article key={d.id}>
                <MapPin size={24} />
                <small>{d.city}</small>
                <h2>{d.name}</h2>
                <p>{d.contactName}</p>
                <p>
                  {[d.address, d.district, d.city].filter(Boolean).join(", ")}
                </p>
                {d.phone && (
                  <a href={`tel:${d.phone.replace(/[^+\d]/g, "")}`}>
                    <Phone size={13} />
                    {d.phone}
                  </a>
                )}
                {d.address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([d.address, d.district, d.city].filter(Boolean).join(", "))}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("Haritada göster", "View map")}
                    <ArrowRight size={14} />
                  </a>
                )}
                <Link
                  to={`/teklif-al?bolge=${encodeURIComponent(d.district || d.regions[0] || "")}`}
                >
                  {t("Keşif talebi oluştur", "Request a survey")}
                  <ArrowRight size={14} />
                </Link>
              </article>
            ))}
          </div>
          {!visible.length && (
            <p>
              {t("Bu aramada ekip bulunamadı.", "No teams match your search.")}
            </p>
          )}
        </>
      )}
    </section>
  );
}
