import { ArrowUpRight, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSite } from "./site-context";

/** Reads the CMS galleries, so removed/unpublished photos disappear here too. */
export function PhotoJournal() {
  const { content, t } = useSite();
  const available = new Set(content.flatMap((item) => item.gallery || []));
  const photos = [
    ...new Set(content.flatMap((item) => item.gallery || [])),
  ].filter((url) => /^\/images\/photo-[a-z-]+\.jpg$/.test(url));
  const selection = [
    "sunset",
    "entrance",
    "wood-balcony",
    "garden-gate",
    "dark-balcony",
    "terrace",
  ]
    .map((name) => `/images/photo-${name}.jpg`)
    .filter((url) => photos.includes(url));
  if (!selection.length) return null;
  return (
    <section
      className="rs-photo-journal"
      aria-label={t("Fotoğraf arşivinden", "From the photo archive")}
    >
      <div className="rs-container">
        <div className="rs-photo-journal-heading">
          <div>
            <small>
              {t("DETAYLARA YAKINDAN BAKIN", "A CLOSER LOOK AT THE DETAILS")}
            </small>
            <h2>
              {t(
                "Camın ötesinde,\nhayatın içinden.",
                "Beyond the glass,\nfrom everyday life.",
              )}
            </h2>
          </div>
          <div>
            <p>
              {t(
                "Balkonlardan giriş kapılarına, fotoğraf arşivimizden bir seçki. AI etiketli karelerde görüntü iyileştirmesi uygulanmıştır; orijinalleri galeride bulabilirsiniz.",
                "From balconies to entrance doors: a selection from our photo archive. Images labelled AI have been enhanced; originals are available in the gallery.",
              )}
            </p>
            <Link to="/fikir-defteri" className="rs-text-link">
              {t("Fotoğraflara göz atın", "Explore the photos")}
              <ArrowUpRight size={17} />
            </Link>
          </div>
        </div>
        <div className="rs-photo-film">
          {selection.map((url, i) => (
            <Link to="/fikir-defteri" key={url} className="rs-photo-print">
              <div>
                <img
                  src={
                    ["sunset", "entrance", "wood-balcony", "garden-gate"].some(
                      (name) => url === `/images/photo-${name}.jpg`,
                    ) && available.has(url.replace(".jpg", "-edited.webp"))
                      ? url.replace(".jpg", "-edited.webp")
                      : url
                  }
                  alt={t(
                    url.includes("entrance")
                      ? "Alüminyum giriş kapısı"
                      : url.includes("garden-gate")
                        ? "Metal bahçe kapısı"
                        : "Fotoğraf arşivinden cam balkon detayı",
                    url.includes("entrance")
                      ? "Aluminium entrance door"
                      : url.includes("garden-gate")
                        ? "Metal garden gate"
                        : "Balcony detail from the photo archive",
                  )}
                  width="229"
                  height="286"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <span>
                <ImageIcon size={12} />
                {t(
                  url.includes("entrance")
                    ? "Giriş & doğrama"
                    : url.includes("garden-gate")
                      ? "Metal detaylar"
                      : "Balkon & yaşam",
                  url.includes("entrance")
                    ? "Doors & frames"
                    : url.includes("garden-gate")
                      ? "Metal details"
                      : "Balconies & living",
                )}
                <small>
                  {available.has(url.replace(".jpg", "-edited.webp"))
                    ? "AI"
                    : String(i + 1).padStart(2, "0")}
                </small>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
