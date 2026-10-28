import { createHash } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";

export const singleShopContentVersion = "single-shop-content-2026-10-29-v1";

interface Correction {
  field: string;
  previousSha256: string;
  value: string;
  type?: string;
  slug?: string;
}

// Frozen hashes identify the exact previously bundled field, not arbitrary user text.
const settingsCorrections: Correction[] = [
  {
    field: "tagline",
    previousSha256:
      "791cf18d6d44b9b5eecda253151a146d1db8360229cdc452e5dfcd68c2c0c81a",
    value: "Etimesgut’ta ölçü, keşif ve uygulama.",
  },
  {
    field: "heroEyebrow",
    previousSha256:
      "e49fc2f9df5d802d4dfc5446c9826c7c6be136dfdf75f16e774c68e97c2934c4",
    value: "KILINÇ DEKORASYON · ETİMESGUT",
  },
  {
    field: "heroTitle",
    previousSha256:
      "53787abedd1fa78914cc2e7ef3519c2c46a9c83be2bcc8b05f56eff656d88c04",
    value: "Ölçünüze göre.\nUstanızla doğrudan.",
  },
  {
    field: "heroSubtitle",
    previousSha256:
      "b694f86a3e7f25fb3427c7fc30ba752843149d9b1f5b6d01f12f466898219916",
    value:
      "Balkonunuz, terasınız veya işyeriniz için neye ihtiyacınız var? Etimesgut’taki tek dükkânımızdan sizinle doğrudan görüşüp ölçü, malzeme ve uygulama adımlarını birlikte netleştiriyoruz.",
  },
  {
    field: "heroTitleEn",
    previousSha256:
      "3b959f2eb27ac4e2813c343972d25b02d27d8e2d77f138f89341f39dee25811e",
    value: "Made to fit.\nTalk to your installer.",
  },
  {
    field: "heroSubtitleEn",
    previousSha256:
      "d9d8127ae797dfab309ea271d09469e79cc4f4e198947ef28a44137ed3f683e9",
    value:
      "What do you need for your balcony, terrace or business premises? Talk directly with our single shop in Etimesgut to agree measurements, materials and the installation steps.",
  },
  {
    field: "heroEyebrowEn",
    previousSha256:
      "7c40fa4c7e9c16be467b4c55fd657a62a5df835a1457296cde5365447bb8f794",
    value: "KILINÇ DEKORASYON · ETİMESGUT",
  },
  {
    field: "aboutTextEn",
    previousSha256:
      "5f40ddfede5f700066a181aef47216eb8e9b74e3ded6f25270915e50f92385bb",
    value:
      "Kılınç Dekorasyon is a local business with one shop in Ankara’s Etimesgut district. Share your needs directly with us and follow your survey, written proposal, installation and service enquiries in one place.",
  },
  {
    field: "aboutText",
    previousSha256:
      "eab89dc13fb51ad27083db9904aef9cbf8f11e9028b213b593f8b6d97164253a",
    value:
      "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkânı olan yerel bir firmadır. İhtiyacınızı bizimle doğrudan paylaşabilir; keşif, yazılı teklif, uygulama ve servis taleplerinizi tek yerden takip edebilirsiniz.",
  },
  {
    field: "seoTitle",
    previousSha256:
      "cdd7c2984fad3c77c5c6e019a663de2438ece61ea9c20a9219aba5b798a96db7",
    value: "Kılınç Dekorasyon | Etimesgut’ta Keşif ve Uygulama",
  },
  {
    field: "seoDescription",
    previousSha256:
      "395157a61fffd3d7c182fd1a2bc10b73b15646eba558ed2707ccb1e6715cfec2",
    value:
      "Etimesgut’taki tek dükkânımızdan cam balkon, alüminyum ve metal uygulamaları için doğrudan iletişim. Ölçü, keşif, yazılı teklif ve talep takibi.",
  },
];

const contentCorrections: Correction[] = [
  {
    type: "page",
    slug: "hakkimizda",
    field: "title",
    previousSha256:
      "791cf18d6d44b9b5eecda253151a146d1db8360229cdc452e5dfcd68c2c0c81a",
    value: "Dükkânımızdan, doğrudan sizinle.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "subtitle",
    previousSha256:
      "275c6ddbb351b57c9f0536f3d24ba4184d72181e4d81b4cc38475a195f693b5a",
    value: "Etimesgut’taki dükkânımız",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "summary",
    previousSha256:
      "c73909c99f18a8567c56975358757422d0f878ee8c1930e08ef7fee0681e1acc",
    value:
      "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkândan hizmet veren yerel bir firmadır. Balkon, teras veya işyerinizde neyi değiştirmek istediğinizi doğrudan bizimle konuşabilirsiniz.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "body",
    previousSha256:
      "8f83dbff61cfd22a7343c69875e8a7f11e359cea9f3e814cf34a629d2dd1b557",
    value:
      "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkândan hizmet veren yerel bir firmadır. Balkon, teras veya işyerinizde neyi değiştirmek istediğinizi doğrudan bizimle konuşabilirsiniz.\n\nÖnce ihtiyacı ve mekânın koşullarını anlarız. Yaklaşık ölçü ve konumla başlayan görüşmeyi, uygun olduğunda yerinde keşifle tamamlarız. Malzeme seçeneği, iş kapsamı, ücret ve takvim yazılı teklifte netleşir.\n\nTalebinizi hesabınızdan izleyebilir, belgelerinize ulaşabilir ve uygulama ya da servis hakkında mesaj bırakabilirsiniz. Her işin uygunluğu kendi koşullarıyla değerlendirilir; sitedeki konsept görseller tamamlanmış müşteri işi olarak sunulmaz.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Dükkânımız",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "titleEn",
    previousSha256:
      "c38e5ce7dc6b1bcc506b40ffbe3362425f788f634f54bb81b8158a5d42c2657b",
    value: "From our shop, directly to you.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "subtitleEn",
    previousSha256:
      "b4b580a9ad8c344fbfad26db08c76c22171cdf481ed3f7871b65bc2f5cc82dea",
    value: "Our shop in Etimesgut",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "summaryEn",
    previousSha256:
      "7979015381ee159cb9580a21aa01a6821560db6b62293df76051d516b9b31499",
    value:
      "Kılınç Dekorasyon is a local business operating from one shop in Ankara’s Etimesgut district. Talk directly with us about what you need for your balcony, terrace or business premises.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "bodyEn",
    previousSha256:
      "7915e0e7a5ba3af961ab2cbdababa2ae9810dce19b2541eae94377c0892429a5",
    value:
      "Kılınç Dekorasyon is a local business operating from one shop in Ankara’s Etimesgut district. Talk directly with us about what you need for your balcony, terrace or business premises.\n\nWe start by understanding the space and the intended use. Approximate dimensions and location support the first discussion; a site survey follows where appropriate. Materials, scope, price and timing are agreed in a written proposal.\n\nUse your account to follow the request, access documents and leave an installation or service message. Each job is assessed on its own conditions. Concept images on this website are not presented as completed customer work.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "seoTitle",
    previousSha256:
      "8cb85fabdd918ee59b67bd3773d96dea085822fa290cc9315a0c9c13ba390399",
    value: "Dükkânımızdan, doğrudan sizinle. | Kılınç Dekorasyon",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "seoDescription",
    previousSha256:
      "c73909c99f18a8567c56975358757422d0f878ee8c1930e08ef7fee0681e1acc",
    value:
      "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkândan hizmet veren yerel bir firmadır. Balkon, teras veya işyerinizde neyi değiştirmek istediğinizi doğrudan bizimle konuşabilirsiniz.",
  },
  {
    type: "page",
    slug: "hakkimizda",
    field: "imageAlt",
    previousSha256:
      "657fcaf31daa736b1e9844eebe39b61ced0e727417846eae27ddc19aa81c85aa",
    value: "Dükkânımızdan, doğrudan sizinle. için temsili mimari çizim",
  },
  {
    type: "page",
    slug: "kalite-yaklasimimiz",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Dükkânımız",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "title",
    previousSha256:
      "36c8c0cba647c4c55ef47534f8681a1788169ae10bc629749c3e22911af76220",
    value: "Çalışma Sürecimiz",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "titleEn",
    previousSha256:
      "128cad6dddd0270710305f6032e5180503afba540f07398dc65a2e84990f0559",
    value: "Our Project Process",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "subtitle",
    previousSha256:
      "ae00333d671ccfd6da36304f6766261a42dc7993c0bb869485465c81386bddae",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "subtitleEn",
    previousSha256:
      "b7f405d54a0767a6f07c13f03457b0b99bdf362d71bcec4ffbd7262233fb5887",
    value: "From a conversation with our Etimesgut shop to installation.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "summary",
    previousSha256:
      "04eb7db7eab3e669014f2b09810bef5bdabcd1eed56a3d80516a2294af4cd104",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "summaryEn",
    previousSha256:
      "397f12edc361c8c7b82bedef9c006700fa1d9a184cd43ca62f18d3466bfcbcb7",
    value: "From a conversation with our Etimesgut shop to installation.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "body",
    previousSha256:
      "ef657ca4f37737f64ed031b526523dd0509fc1e1c885284dfa030b75c0f1f88c",
    value:
      "Etimesgut’taki tek dükkânımızla doğrudan iletişim kurarsınız. Kullanım amacı, yapı, erişim, malzeme ve hedef takvimi birlikte değerlendirerek kapsamı netleştiririz.\nBu süreç akışı bir teslim süresi veya performans garantisi değildir. Onaylanacak ürün, uygulama, takvim ve ticari koşullar projeye özel yazılı teklifte yer almalıdır.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "bodyEn",
    previousSha256:
      "469da5433d8886eb4e0b783ecf4e83623778645556ce8a8675fd70495fb6c5b5",
    value:
      "You speak directly with our single shop in Etimesgut. We review the intended use, building, access, materials and target timing together. This process is not a delivery or performance guarantee; scope and terms are confirmed in a project-specific proposal.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "image",
    previousSha256:
      "9517453f5be997debfa93ba896e82169d32acafb5a57226811a9e320cf06dbdb",
    value: "",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "imageAlt",
    previousSha256:
      "5c2892676a422394a18ee85bf101e0b11829f0e3c5011fbd6a76af93c5b5d33e",
    value: "",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "seoTitle",
    previousSha256:
      "7296566433f4bfc5785ac80e1f60d47ae221cb4580f49a04e60ddc7208033c46",
    value: "Çalışma Sürecimiz | Kılınç Dekorasyon",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "seoDescription",
    previousSha256:
      "04eb7db7eab3e669014f2b09810bef5bdabcd1eed56a3d80516a2294af4cd104",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "garanti-ve-servis",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Dükkânımız",
  },
  {
    type: "page",
    slug: "kataloglar",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Dükkânımız",
  },
  {
    type: "article",
    slug: "kurumsal-proje-teknik-sartname",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "teknik-dokumanlar",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "kesif-ve-teklif-rehberi",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "region",
    slug: "etimesgut",
    field: "summary",
    previousSha256:
      "1eb2e16dc8de631a81a73d5b8447bbb8b122e1275c2dbab5f2a83376f3c52250",
    value:
      "Etimesgut konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "etimesgut",
    field: "body",
    previousSha256:
      "3e65cb272ff199f782ec903b958eb181b43f12a7c8b36295bdf8b93eb0b5e259",
    value:
      "Etimesgut konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Konut balkonları, giriş kapıları ve yenileme işlerinde bina yönetimi, mevcut yüzeyler ve montaj erişimi ilk değerlendirmede önem taşır.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "etimesgut",
    field: "summaryEn",
    previousSha256:
      "96fd0a5e7d9cd0d24f50aa84cdf19cbc30c4955e77a2846adf1880c8998620e7",
    value:
      "Contact our Etimesgut shop directly about your needs in Etimesgut. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "etimesgut",
    field: "bodyEn",
    previousSha256:
      "15487e211526dee35f5b65b98d41475723f922fde534120043999afa03c947af",
    value:
      "Tell us what you need in Etimesgut\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. For residential balconies, entrance gates and refurbishment, building management, existing surfaces and installation access are key starting points.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "etimesgut",
    field: "seoDescription",
    previousSha256:
      "1eb2e16dc8de631a81a73d5b8447bbb8b122e1275c2dbab5f2a83376f3c52250",
    value:
      "Etimesgut konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "baglica",
    field: "summary",
    previousSha256:
      "ae65ef29cee43700fc2dedf74edd41f527d55a5aea415139ab8719df8ddea9de",
    value:
      "Bağlıca konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "baglica",
    field: "body",
    previousSha256:
      "366b293cd33e87a0bc76b39ab5b393df42063f811e74afa814779897183db89e",
    value:
      "Bağlıca konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Bahçe ve teras projelerinde kot farkı, çatıya gelen yükler, gölgeleme yönü ve yağış tahliyesi birlikte ele alınmalıdır.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "baglica",
    field: "summaryEn",
    previousSha256:
      "31b0f468636cb1131bf201e00f5c0bab9ce8fc281ef8220b77d8a2e9d1d60e95",
    value:
      "Contact our Etimesgut shop directly about your needs in Bağlıca. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "baglica",
    field: "bodyEn",
    previousSha256:
      "ddc2f5d996d4efd4e6afcbd25124ce91f64bb7d109dae96a880ce768e48f9046",
    value:
      "Tell us what you need in Bağlıca\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. Garden and terrace projects need coordinated assessment of levels, roof loads, sun orientation and drainage.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "baglica",
    field: "seoDescription",
    previousSha256:
      "ae65ef29cee43700fc2dedf74edd41f527d55a5aea415139ab8719df8ddea9de",
    value:
      "Bağlıca konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "eryaman",
    field: "summary",
    previousSha256:
      "9fb50b4a2564467333d08adc543cd0e4bae654f92a025436bf7b72f28bbcaf52",
    value:
      "Eryaman konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "eryaman",
    field: "body",
    previousSha256:
      "22853bd123e2df14e9bf26dc1221736645c02c48457892dd285b244003c01c7f",
    value:
      "Eryaman konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Site ve apartmanlarda cephe bütünlüğü, panel açılımı, temizlik erişimi ve ortak alan kullanımı planlamanın parçalarıdır.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "eryaman",
    field: "summaryEn",
    previousSha256:
      "9c7ddcbe131b34b1e86f29ac073dfe67d5a2ff6da9982d3e4ebcb0ebac96ea0e",
    value:
      "Contact our Etimesgut shop directly about your needs in Eryaman. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "eryaman",
    field: "bodyEn",
    previousSha256:
      "ef77e48d2b992fa83b2f0d8f63e0a97fdb80898a07506119eb23a476049714fb",
    value:
      "Tell us what you need in Eryaman\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. In residential developments, façade consistency, panel movement, cleaning access and shared-space use all inform planning.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "eryaman",
    field: "seoDescription",
    previousSha256:
      "9fb50b4a2564467333d08adc543cd0e4bae654f92a025436bf7b72f28bbcaf52",
    value:
      "Eryaman konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "cayyolu",
    field: "summary",
    previousSha256:
      "ad35a7e798532883456d238d6e70cd682d80024c5c9d5b594248b474af714541",
    value:
      "Çayyolu konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "cayyolu",
    field: "body",
    previousSha256:
      "4ed0ba42de0fd587f82638e7496285c909e532e9a95c420ec4fcc904a422a5c7",
    value:
      "Çayyolu konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Kış bahçesi, ofis bölme ve açık alan düzenlemelerinde kullanım beklentisi, havalandırma ve mimariyle uyum birlikte değerlendirilir.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "cayyolu",
    field: "summaryEn",
    previousSha256:
      "9065a8b86a14b036c384b1b8249c3ca055abad9e2a2e55f5b1cbd36e9436222e",
    value:
      "Contact our Etimesgut shop directly about your needs in Çayyolu. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "cayyolu",
    field: "bodyEn",
    previousSha256:
      "e4259456f8e54ccf9a44495f8cc356b2d287aa54b2b3d6799c02f6b6834c7fbf",
    value:
      "Tell us what you need in Çayyolu\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. Winter gardens, office partitions and outdoor spaces should be assessed for intended use, ventilation and architectural fit.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "cayyolu",
    field: "seoDescription",
    previousSha256:
      "ad35a7e798532883456d238d6e70cd682d80024c5c9d5b594248b474af714541",
    value:
      "Çayyolu konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "batikent",
    field: "summary",
    previousSha256:
      "4f499f84931dda4fe85f66ff02786163ce793abc1789afe6f045b5bf7fc0271d",
    value:
      "Batıkent konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "batikent",
    field: "body",
    previousSha256:
      "c648784e81f6c863a6467767e399de2198cad3dccbe994daa944919229e1c49a",
    value:
      "Batıkent konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Mevcut yapılardaki yenilemelerde taşıyıcı bağlantı, eşik seviyesi, su tahliyesi ve elektrik ihtiyacının önceden incelenmesi yararlıdır.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "batikent",
    field: "summaryEn",
    previousSha256:
      "52602b69327152ad929da43408de24e91b5680fcde65d86b3b509d98d53cc9c6",
    value:
      "Contact our Etimesgut shop directly about your needs in Batıkent. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "batikent",
    field: "bodyEn",
    previousSha256:
      "f189c04f69c887931311b79f98eba16824343dbe89c711c94fc6fb02a21730c6",
    value:
      "Tell us what you need in Batıkent\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. Refurbishment in existing buildings benefits from early review of structural fixings, thresholds, drainage and electrical requirements.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "batikent",
    field: "seoDescription",
    previousSha256:
      "4f499f84931dda4fe85f66ff02786163ce793abc1789afe6f045b5bf7fc0271d",
    value:
      "Batıkent konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "incek",
    field: "summary",
    previousSha256:
      "fb0e5447751d024880ad318cb85020679f7db509156ecc2e402bf3da59c3de72",
    value:
      "İncek konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "incek",
    field: "body",
    previousSha256:
      "754e23c8406136977a1565ec197496fe5ea299352d85c48e97025f3fc2213a20",
    value:
      "İncek konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Açık alanlarda rüzgâr etkisi, kotlar, koruma gerektiren kenarlar ve bakım erişimi sistem seçiminden önce netleştirilmelidir.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "incek",
    field: "summaryEn",
    previousSha256:
      "32d6758c95d5b637dd012be0fe50c3ed7e19255872cb7d69a59dad41af0cd49b",
    value:
      "Contact our Etimesgut shop directly about your needs in İncek. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "incek",
    field: "bodyEn",
    previousSha256:
      "3b97dfed6b78e6eaa1230fb0f867ff3e33569dd310ca39a8ef116592789538df",
    value:
      "Tell us what you need in İncek\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. For exposed outdoor spaces, assess wind, changes in level, guarded edges and maintenance access before selecting systems.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "incek",
    field: "seoDescription",
    previousSha256:
      "fb0e5447751d024880ad318cb85020679f7db509156ecc2e402bf3da59c3de72",
    value:
      "İncek konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "subtitle",
    previousSha256:
      "35fe5dc1e418240401f70954ed5f594ae497ca72b1f16882a3ab2f488712003e",
    value: "İşyeri için cam ve metal işleri",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "summary",
    previousSha256:
      "2edd715f13a7eab256b1f47ff621afec3a6a663e754fda67819fe94bff601318",
    value:
      "OSTİM ve İvedik konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "body",
    previousSha256:
      "4a9c342d24c2bf39d82409a97e9e6a543284d6b89083596308a0ea665bf86491",
    value:
      "OSTİM ve İvedik konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. Dükkân ve işyerlerindeki cam, kapı, bölme ve metal işleri için kullanım amacı, yaklaşık ölçüler, çalışma saatleri ve uygulama erişimi ilk görüşmede değerlendirilir.\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "subtitleEn",
    previousSha256:
      "0c19d99402f3294cb9d2be1061623689efa0fec2e7572fcc67e79e2c1b1be06c",
    value: "Glazing and metalwork for business premises",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "summaryEn",
    previousSha256:
      "80f8048361880385167ffd34a1e72cad04361122710bc505d8ab2c7127fc7048",
    value:
      "Contact our Etimesgut shop directly about your needs in OSTİM ve İvedik. Survey and service availability are assessed for each enquiry.",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "bodyEn",
    previousSha256:
      "14ba52af33a07bfdc590dcd4ca2d1f9f7e067b2fd26cac0ca412d271ae83cc18",
    value:
      "Tell us what you need in OSTİM ve İvedik\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. For glazing, doors, partitions and metalwork at business premises, discuss intended use, approximate dimensions, working hours and installation access at the first enquiry.\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.",
  },
  {
    type: "region",
    slug: "ostim-ivedik",
    field: "seoDescription",
    previousSha256:
      "2edd715f13a7eab256b1f47ff621afec3a6a663e754fda67819fe94bff601318",
    value:
      "OSTİM ve İvedik konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.",
  },
  {
    type: "faq",
    slug: "santiye-teklif",
    field: "title",
    previousSha256:
      "ab4fbaf6bc209a97c68d06539cdfb9218930dd086662a384d1b94e714987b39b",
    value: "Keşif öncesinde çizim paylaşmalı mıyım?",
  },
  {
    type: "faq",
    slug: "santiye-teklif",
    field: "titleEn",
    previousSha256:
      "7f2332d38768d79954f447b903ce48dae016eddaccaeb178da4427d5b71a687b",
    value: "Should I share drawings before a survey?",
  },
  {
    type: "faq",
    slug: "santiye-teklif",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "faq",
    slug: "santiye-teklif",
    field: "seoTitle",
    previousSha256:
      "4c97561e6ac5ab9f1f557154433a80df3fedd3e4b88f9311fb269242f6612933",
    value: "Keşif öncesinde çizim paylaşmalı mıyım? | Kılınç Dekorasyon",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "title",
    previousSha256:
      "80126e0aa09063ccee7f18febe3e850243c459d915d6bd7599791e7fcd86ba8f",
    value: "Ankara dışından talep bırakabilir miyim?",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "summary",
    previousSha256:
      "80c18406489b2402fc580a4fed12804f59e28382442312f498dbc53a8ca0fdfc",
    value:
      "Konum, yaklaşık kapsam ve hedef takvimle talep bırakabilirsiniz. Nakliye, konaklama, saha erişimi ve montaj organizasyonu değerlendirilmeden hizmet taahhüdü veya kesin takvim verilmez.",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "body",
    previousSha256:
      "80c18406489b2402fc580a4fed12804f59e28382442312f498dbc53a8ca0fdfc",
    value:
      "Konum, yaklaşık kapsam ve hedef takvimle talep bırakabilirsiniz. Nakliye, konaklama, saha erişimi ve montaj organizasyonu değerlendirilmeden hizmet taahhüdü veya kesin takvim verilmez.",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "titleEn",
    previousSha256:
      "65d3051a22e0bad694a6efe06e5feb1b92901508f27364ca6dec6831cc176f9e",
    value: "Can I enquire from outside Ankara?",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "category",
    previousSha256:
      "4880b93c7b77b50a7b5426c856b9d800d943a6c7c7f5ec6190e34355d115c262",
    value: "Uygulama notları",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "seoTitle",
    previousSha256:
      "50fe255f01b4f3d6b6937e8d489dd8412d054e150d2c0acfeaf830d41854d5ab",
    value: "Ankara dışından talep bırakabilir miyim? | Kılınç Dekorasyon",
  },
  {
    type: "faq",
    slug: "sehir-disi-proje",
    field: "seoDescription",
    previousSha256:
      "80c18406489b2402fc580a4fed12804f59e28382442312f498dbc53a8ca0fdfc",
    value:
      "Konum, yaklaşık kapsam ve hedef takvimle talep bırakabilirsiniz. Nakliye, konaklama, saha erişimi ve montaj organizasyonu değerlendirilmeden hizmet taahhüdü veya kesin takvim verilmez.",
  },
  {
    type: "page",
    slug: "terimler-sozlugu",
    field: "category",
    previousSha256:
      "49e7d38ea807529daff5fab13a4d26b1ab89a0f2b297428ca683ca27de819a27",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "renk-kartelasi",
    field: "category",
    previousSha256:
      "49e7d38ea807529daff5fab13a4d26b1ab89a0f2b297428ca683ca27de819a27",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "olcu-rehberi",
    field: "category",
    previousSha256:
      "49e7d38ea807529daff5fab13a4d26b1ab89a0f2b297428ca683ca27de819a27",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "subtitle",
    previousSha256:
      "8e6fd22432b40982e46210872d52b4d3def9076a59a81a89358c5e28ad8b8493",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "subtitleEn",
    previousSha256:
      "5992cd79c6cda53c07108d9941f01f2586aa750e363d46a5ad51e9f8b416f226",
    value: "From a conversation with our Etimesgut shop to installation.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "summary",
    previousSha256:
      "8e6fd22432b40982e46210872d52b4d3def9076a59a81a89358c5e28ad8b8493",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "summaryEn",
    previousSha256:
      "5992cd79c6cda53c07108d9941f01f2586aa750e363d46a5ad51e9f8b416f226",
    value: "From a conversation with our Etimesgut shop to installation.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "body",
    previousSha256:
      "0017fdebad203b775ebc3f2adab357ee0542b708abd35483ac558af042cc82ff",
    value:
      "Etimesgut’taki tek dükkânımızla doğrudan iletişim kurarsınız. Kullanım amacı, yapı, erişim, malzeme ve hedef takvimi birlikte değerlendirerek kapsamı netleştiririz.\nBu süreç akışı bir teslim süresi veya performans garantisi değildir. Onaylanacak ürün, uygulama, takvim ve ticari koşullar projeye özel yazılı teklifte yer almalıdır.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "bodyEn",
    previousSha256:
      "853ee1460723fcf33b84ca067fd16a3af12e9c6a20e8baecaa3ce11c412685ae",
    value:
      "You speak directly with our single shop in Etimesgut. We review the intended use, building, access, materials and target timing together. This process is not a delivery or performance guarantee; scope and terms are confirmed in a project-specific proposal.",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "category",
    previousSha256:
      "49e7d38ea807529daff5fab13a4d26b1ab89a0f2b297428ca683ca27de819a27",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "uygulama-sureci",
    field: "seoDescription",
    previousSha256:
      "8e6fd22432b40982e46210872d52b4d3def9076a59a81a89358c5e28ad8b8493",
    value: "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
  },
  {
    type: "page",
    slug: "garanti-servis",
    field: "category",
    previousSha256:
      "49e7d38ea807529daff5fab13a4d26b1ab89a0f2b297428ca683ca27de819a27",
    value: "Uygulama notları",
  },
  {
    type: "page",
    slug: "icerik-ve-kullanim-haklari",
    field: "body",
    previousSha256:
      "01d98a90c362266aea64537dc33f071365083df8afdcc184bc6bac50bb2e4466",
    value:
      "Bu site Kılınç Dekorasyon'un hizmetleri ve proje seçenekleri hakkında bilgi verir. Ürünlerin uygulanabilirliği, malzemesi, teknik kapsamı ve ticari koşulları projeye özel yazılı teklif ile netleştirilir. Her uygulamanın kapsamı ve kullanılan malzeme, onayladığınız teklifte belirtilir.\n\nKonsept olarak işaretlenen başlangıç görselleri, bu proje için yapay zekâ desteğiyle üretilmiş mimari görselleştirmelerdir. Tamamlanmış müşteri uygulaması, gerçek saha fotoğrafı veya ürün performansının kanıtı olarak sunulmaz. Sonradan yüklenen fotoğraf, çizim ve belgelerin kaynakları ve kullanım izinleri ayrıca değerlendirilmelidir.\n\nSitede kullanılan açık kaynak yazılım, font ve ikonların hakları ilgili hak sahiplerinde kalır; bunların kullanım koşulları kendi lisanslarıyla belirlenir. Üçüncü taraf lisans bildirimleri /licenses/THIRD-PARTY-NOTICES.txt adresinde sunulur. Bu bildirim, sitedeki her görselin veya kullanıcı yüklemesinin aynı lisans altında olduğu anlamına gelmez.\n\nBir içeriğin kamuya açık olması yeniden kullanım izni verildiği anlamına gelmez. Sitedeki metin, görsel ve belgeleri yeniden yayımlamak veya ticari materyallerde kullanmak istiyorsanız ilgili hak sahibinden gerekli izinleri almalısınız. Bu açıklama, kanundan veya ilgili açık lisanstan doğan kullanım haklarını sınırlamayı amaçlamaz.\n\nBir içerik veya işaretin haklarınızı etkilediğini düşünüyorsanız İletişim sayfamızdaki formdan bize ulaşabilirsiniz: /iletisim. İncelemeye yardımcı olmak için ilgili sayfa veya dosya adresini, hak iddianızın açıklamasını, varsa kaynak veya temsil bilginizi ve yanıtlanabileceğiniz iletişim kanalını paylaşabilirsiniz. Özel müşteri belgelerini veya gereksiz kişisel bilgileri göndermeyin. Bildirimler içerik ve mevcut izinler yönünden değerlendirilir.\n\nFirma adı, marka kullanımı ve sonradan eklenen içerikler için hak sahipliği ve izinler ayrıca doğrulanmalıdır. Bu sayfa, bütün içerikler için hak sahipliği veya hiçbir üçüncü kişi hakkının etkilenmeyeceği yönünde bir garanti oluşturmaz.",
  },
  {
    type: "page",
    slug: "icerik-ve-kullanim-haklari",
    field: "bodyEn",
    previousSha256:
      "aeb10f359a6e51c44485ea163e772333ae8b8afa0bcfe6a9c1f33e9d1f6562a9",
    value:
      "This website describes Kılınç Dekorasyon's services and project options. Product suitability, materials, technical scope and commercial terms are confirmed in a project-specific written proposal. The scope of work and selected materials are set out in your approved proposal.\n\nInitial visuals labelled as concepts are architectural visualisations created for this project with AI assistance. They do not represent completed customer installations, actual site photographs or evidence of product performance. Sources and permissions for subsequently uploaded photographs, drawings and documents require separate review.\n\nRights in open-source software, fonts and icons remain with their respective rights holders and are governed by their own licences. Third-party licence notices are available at /licenses/THIRD-PARTY-NOTICES.txt. These notices do not place every image or user upload on this website under the same licence.\n\nPublic availability does not itself grant permission to reuse material. Obtain the required permission from the relevant rights holder before republishing text, visuals or documents or using them in commercial materials. This statement does not seek to restrict uses permitted by law or an applicable open licence.\n\nIf you believe material or a sign affects your rights, contact us through the form on our Contact page: /iletisim. To help us review the issue, you may identify the relevant page or file, explain your claim, provide any source or representation details and specify a reply channel. Do not send private customer documents or unnecessary personal information. Reports are assessed against the material and available permissions.\n\nRights and permissions for the business name, brand use and subsequently added material must be verified separately. This page does not guarantee ownership of every item or the absence of any effect on third-party rights.",
  },
];

const archivedPageSlugs = new Set([
  "is-ortakligi",
  "kurumsal-projeler-taahhut",
  "bayilik",
  "bayiler",
  "bayilerimiz",
  "bayi-basvurusu",
  "bayilik-basvurusu",
  "bayi-agimiz",
  "bayi-bul",
  "bayi-ol",
  "bayi-olun",
  "yetkili-bayiler",
  "distribuytorluk",
  "dealers",
  "dealer-network",
  "dealer-application",
  "dealership",
  "franchise",
  "franchising",
  "franchise-application",
  "partnerships",
]);
const networkSlug =
  /(?:^|-)(?:bayi|bayilik|bayiler|dealers?|dealership|franchise|franchising|partnerships?)(?:-|$)/i;
const matches = (value: unknown, expected: string): value is string =>
  typeof value === "string" &&
  createHash("sha256").update(value).digest("hex") === expected;
function record(value: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Tek dükkân içerik geçişinde geçersiz kayıt yapısı.");
  return parsed as Record<string, unknown>;
}

/** Convert only the known bundled copy. Retired network pages are archived,
 * including edited ones, as explicitly requested; their data is never deleted.
 * Customer accounts, enquiries, uploads and private operational tables are untouched.
 */
export function applySingleShopContentMigration(db: DatabaseSync): void {
  if (
    db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(singleShopContentVersion)
  )
    return;
  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const settingsRow = db
      .prepare("SELECT data FROM settings WHERE id=1")
      .get() as { data: string } | undefined;
    if (settingsRow) {
      const settings = record(settingsRow.data);
      let changed = false;
      for (const correction of settingsCorrections) {
        if (!matches(settings[correction.field], correction.previousSha256))
          continue;
        settings[correction.field] = correction.value;
        changed = true;
      }
      if (changed)
        db.prepare("UPDATE settings SET data=? WHERE id=1").run(
          JSON.stringify(settings),
        );
    }
    const correctionsByContent = new Map<string, Correction[]>();
    for (const correction of contentCorrections) {
      const key = correction.type + ":" + correction.slug;
      const group = correctionsByContent.get(key) || [];
      group.push(correction);
      correctionsByContent.set(key, group);
    }
    const update = db.prepare("UPDATE content SET data=? WHERE id=?");
    for (const row of db
      .prepare("SELECT id,type,slug,data FROM content")
      .all() as Array<{
      id: string;
      type: string;
      slug: string;
      data: string;
    }>) {
      const corrections =
        correctionsByContent.get(row.type + ":" + row.slug) || [];
      const archive =
        row.type === "page" &&
        (archivedPageSlugs.has(row.slug) || networkSlug.test(row.slug));
      if (!archive && !corrections.length) continue;
      const item = record(row.data);
      let changed = false;
      for (const correction of corrections) {
        if (!matches(item[correction.field], correction.previousSha256))
          continue;
        item[correction.field] = correction.value;
        changed = true;
      }
      if (archive && item.published !== false) {
        item.published = false;
        changed = true;
      }
      if (changed) {
        item.updatedAt = now;
        update.run(JSON.stringify(item), row.id);
      }
    }
    db.prepare(
      "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
    ).run(singleShopContentVersion, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
