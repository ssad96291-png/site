import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Content } from "./seed.js";
import { singleShopContentVersion } from "./single-shop-content.js";

export const corporateContentVersion = "corporate-sections-2026-10-29-v1";
const slug = "kurumsal-projeler-taahhut";

function corporatePage(now: string): Content {
  const summary =
    "İşyeri, ofis ve mimari projeleriniz için çizim, ölçü, malzeme ve uygulama kapsamını birlikte değerlendirelim.";
  return {
    id: randomUUID(),
    type: "page",
    slug,
    title: "Kurumsal Projeler",
    titleEn: "Commercial Projects",
    subtitle: "İşyeriniz için, ayrıntıları belli bir uygulama planı.",
    subtitleEn: "A clear installation plan for your business premises.",
    summary,
    summaryEn:
      "Review drawings, dimensions, materials and installation scope for your workplace, office or architectural project.",
    body: [
      "Projenizi tanıyalım\nOfis bölmesi, işyeri girişi, cam kapama, cephe veya metal imalat ihtiyacınızı Etimesgut’taki dükkânımızla doğrudan paylaşabilirsiniz. Yapılabilirlik, iş büyüklüğü ve hizmet uygunluğu ilk değerlendirmede birlikte netleştirilir.",
      "Çizim ve ihtiyaç dosyası\nGüncel çizimleri, yaklaşık ölçüleri, uygulama adresini ve hedef takvimi Proje & fiyat teklifi alanından iletin: /proje-teklif. Dosyalarda paylaşma yetkiniz olmayan bilgi bulunmamasına dikkat edin. Ön ölçüler kesin üretim ölçüsü yerine geçmez.",
      "Teknik kapsam ve sorumluluklar\nMalzeme, renk, açılım, birleşimler, saha erişimi ve diğer işlerle bağlantıları yazılı kapsamda ayırın. Statik, yangın, elektrik ve izin gereksinimleri ilgili yetkin uzmanlarla doğrulanmalıdır. Bu sayfa bağımsız mühendislik hizmeti veya sertifikalı performans taahhüdü oluşturmaz.",
      "Kalemli teklif ve revizyon\nİncelenen talebe göre miktar, birim, fiyat, dahil ve hariç işler ile teslim koşulları belirtilir. Yayımlanan teklifinizi müşteri panelinden inceleyip PDF olarak indirebilirsiniz. Çizim veya kapsam değişirse yeni revizyon hazırlanır; kesin fiyat ve takvim yazılı teklifte belirlenir.",
      "Uygulama ve teslim\nKeşif, ölçü onayı, saha hazırlığı, uygulama ve teslim adımlarını birlikte planlarız. İş programı, mevcut koşullar ve malzeme temini doğrulandıktan sonra kesinleşir. Teslimde kullanım, bakım, servis ve varsa sözleşmede belirlenen belgeler kontrol edilir.",
    ].join("\n\n"),
    bodyEn: [
      "Tell us about the project\nDiscuss office partitions, entrances, glazing, façades or metalwork directly with our shop in Etimesgut. Feasibility, project size and service availability are confirmed during the initial review.",
      "Drawings and requirements\nUse /proje-teklif to share current drawings, approximate dimensions, the site location and target timing. Share only information you are authorised to provide. Preliminary dimensions do not replace final fabrication measurements.",
      "Scope and responsibilities\nSpecify materials, colours, openings, junctions, site access and interfaces with other trades. Structural, fire, electrical and permission requirements need qualified assessment. This page is not a commitment to independent engineering services or certified performance.",
      "Itemised quotation and revisions\nYour quotation identifies quantities, units, prices, inclusions, exclusions and delivery conditions. Review published quotations and download their PDFs from your customer account. Drawing or scope changes require a new revision; the written proposal confirms price and timing.",
      "Installation and handover\nPlan the survey, dimension approval, site preparation, installation and handover together. Timing is confirmed after reviewing site conditions and material availability. Review operation, care, service contacts and any agreed documents at handover.",
    ].join("\n\n"),
    image: "/images/aluminium-facade.svg",
    imageAlt: "Alüminyum cephe tasarım konsepti",
    category: "Kurumsal",
    featured: false,
    published: true,
    sortOrder: 85,
    specs: [],
    gallery: [],
    seoTitle: "Kurumsal Projeler | Kılınç Dekorasyon",
    seoDescription: summary,
    createdAt: now,
    updatedAt: now,
  };
}

// Exact fields from the former bundled corporate page. Operator-authored copy,
// uploaded images and any separate publication decisions are retained.
const previousFields: Record<string, string> = {
  title: "1254aca6bb47229971e4385ec9f9671f37566cf870a1b4569ad6d64e59f3c9cf",
  subtitle: "1641912452b601565cacc4b533ae7d399bb13a4c92be7609639f1051e950ff44",
  summary: "56d3c7fe7f594f738609715bb168e864a78d675fc0aed94d946e845fbdfdf4dd",
  body: "b3dbccc82e51ea8d6106ad5278591e9bd1c607c817c64f553f4f8655e760098b",
  titleEn: "b5becda8c9b5dabe0deba42cef23e36b4763f81751d05c9e7cb567755ba860ed",
  subtitleEn:
    "3a23c70319ad177c72db4cfd135fb01a0b682e5cdde33eeb1e8a63cdef99f61d",
  summaryEn: "78faf013ea31e6ca2303cf8be4434989d768278c6e7395d013a86c25ef5407ca",
  bodyEn: "eae60302c98d9b7650a172fc8a97d4de96cdf98a4c88f0a47349cb573ceab827",
  image: "9517453f5be997debfa93ba896e82169d32acafb5a57226811a9e320cf06dbdb",
  imageAlt: "d38b53e7c6e4877d031930862871a88d6fd0d66399e93229da2d391f8d9aaf9f",
  seoTitle: "da3db247c218af7eb9e84fe9069107066433b89f28e58eba0b36eab4d2eeeb1d",
  seoDescription:
    "56d3c7fe7f594f738609715bb168e864a78d675fc0aed94d946e845fbdfdf4dd",
};

/** Restore the non-network corporate page once without touching private data. */
export function applyCorporateContentMigration(db: DatabaseSync): void {
  if (
    db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(corporateContentVersion)
  )
    return;
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const defaults = corporatePage(now);
    const row = db
      .prepare("SELECT id,data FROM content WHERE type='page' AND slug=?")
      .get(slug) as { id: string; data: string } | undefined;
    if (!row) {
      db.prepare("INSERT INTO content(id,type,slug,data) VALUES(?,?,?,?)").run(
        defaults.id,
        defaults.type,
        defaults.slug,
        JSON.stringify(defaults),
      );
    } else {
      const parsed: unknown = JSON.parse(row.data);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error("Kurumsal içerik geçişinde geçersiz kayıt yapısı.");
      const item = parsed as Record<string, unknown>;
      const archive = db
        .prepare("SELECT appliedAt FROM schema_migrations WHERE version=?")
        .get(singleShopContentVersion) as { appliedAt: string } | undefined;
      let changed = false;
      // Only the previous migration's own archive timestamp establishes that
      // publication was removed automatically. Later edits/unpublishing survive.
      if (
        item.published === false &&
        archive &&
        item.updatedAt === archive.appliedAt
      ) {
        item.published = true;
        changed = true;
      }
      for (const [field, digest] of Object.entries(previousFields)) {
        if (
          typeof item[field] !== "string" ||
          createHash("sha256").update(item[field]).digest("hex") !== digest
        )
          continue;
        item[field] = defaults[field as keyof Content];
        changed = true;
      }
      if (changed) {
        item.updatedAt = now;
        db.prepare("UPDATE content SET data=? WHERE id=?").run(
          JSON.stringify(item),
          row.id,
        );
      }
    }
    db.prepare(
      "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
    ).run(corporateContentVersion, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
