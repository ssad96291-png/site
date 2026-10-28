import { createHash, randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import type { Content } from "./seed.js";

/** Immutable corrections to the originally bundled text. Never rewrite custom content. */
export const originalityContentVersion = "original-content-2026-10-28-v1";
interface DefaultCorrection {
  type: string;
  slug: string;
  field: string;
  previousSha256: string;
  value: string;
}
const defaultCorrections: DefaultCorrection[] = [
  {
    type: "product",
    slug: "katlanir-cam-balkon",
    field: "subtitle",
    previousSha256:
      "69b6ec34ff26baab1a219512c422f1412eb7ca0b48548aeb5e3c03dab4ec84e6",
    value: "Katlanarak yana toplanan cam paneller.",
  },
  {
    type: "product",
    slug: "katlanir-cam-balkon",
    field: "body",
    previousSha256:
      "0985413c901609bc75d666de50a9514c0382f2fe54fbca267d9a4f94566d52b0",
    value:
      "Bir yana toplanabilen cam panellerle balkonunuzu mevsime ve kullanımınıza göre dönüştürün. Görüşü kesmeyen bir yaklaşım, günlük yaşamınıza daha fazla alan kazandırsın.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nPanel toplanma yönünü mobilya ve geçiş alanlarıyla birlikte planlayın. Panellerin içe veya dışa hareketi, temizlik erişimi, alt eşik ve tahliye noktaları keşifte netleştirilmelidir. Cam türü ve panel ölçüsü sistem gereksinimlerine göre seçilir.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "katlanir-cam-balkon",
    field: "subtitleEn",
    previousSha256:
      "9f54d3d5e8581cd4538185e8f42355381905db616cae41b92328c5fabef25749",
    value: "Glass panels that fold and stack to one side.",
  },
  {
    type: "product",
    slug: "katlanir-cam-balkon",
    field: "bodyEn",
    previousSha256:
      "217785ba9dbbae2a2e61a1c8863478b61ef97e8740180f123ce59387652d859d",
    value:
      "Glass panels that fold to one side help your balcony adapt to the season and the way you live. Layout, glazing and installation details are specified after a site survey.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nPlan the stacking direction around furniture and circulation. Confirm panel movement, cleaning access, threshold and drainage during the survey. Glass type and panel size must suit the complete system.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "surme-cam-sistemleri",
    field: "subtitle",
    previousSha256:
      "4dd938d94c84c50a3cd6e7295f4cde8a3494161b230826cbda9f5642ea577c72",
    value: "Raylı panellerle ayarlanabilen açıklıklar.",
  },
  {
    type: "product",
    slug: "surme-cam-sistemleri",
    field: "body",
    previousSha256:
      "afbf7bffb4af5f767c835ebc544abcd97e9a6308a699c72919e2e2a4d8097eeb",
    value:
      "Ray üzerinde hareket eden cam paneller, geniş açıklıkları esnek biçimde kullanmanıza yardımcı olur. Balkon, teras ve ticari mekânlarda ihtiyaca uygun açılım seçenekleri birlikte değerlendirilir.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nRay sayısı ve panel park alanı, elde edilen net açıklığı etkiler. Eşik yüksekliği, temizlik, su tahliyesi ve varsa sineklik/perde uyumu birlikte değerlendirilmelidir. Büyük panellerde taşıma kapasitesi ve donanım seçimi kritik önemdedir.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "surme-cam-sistemleri",
    field: "subtitleEn",
    previousSha256:
      "e344228dbe4b5d379f59cb3a5a300184fe00228e4c40a09963b950171feab114",
    value: "Adjustable openings with tracked panels.",
  },
  {
    type: "product",
    slug: "surme-cam-sistemleri",
    field: "bodyEn",
    previousSha256:
      "0e924a41ee3270e677f8ebfb5d48b742b99cc9ef6fe28d7b6c2eed3333fffbe6",
    value:
      "Sliding panels make wide openings flexible. Explore opening options for balconies, terraces and commercial spaces, designed around the conditions of your project.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nTrack count and panel parking determine the usable opening. Consider threshold height, cleaning, drainage and compatibility with screens or blinds. Larger panels require appropriate hardware and load capacity.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "subtitle",
    previousSha256:
      "3353661c5dcbfb51081c03b4ddb99ff98c216213c42c708916409d60c13b20b2",
    value: "Çift cam bileşimiyle planlanan balkon kapaması.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "summary",
    previousSha256:
      "0f1b7c289b48ce65b1bbd87f5f8e4c3d081c2c5c3583fab394f7d763671c2176",
    value:
      "Çift camlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "body",
    previousSha256:
      "f8ec085ef490a8c16bcb3405993f345b1b0c68fbf23dad916399a36def83a82c",
    value:
      "Çift camlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nÇift cam bileşimi, profilin ısı köprüsü detayı, contalar ve çevre birleşimleri birlikte düşünülmelidir. Isıtma beklentisini ve yoğuşma riskini paylaşın. Balkon kapaması tek başına yapının oda seviyesinde yalıtıldığı anlamına gelmez.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "subtitleEn",
    previousSha256:
      "5cf1fac7df3ea626b3d177e76265ea05e64050b14018c0947cd09a805c6143d7",
    value: "Balcony enclosures planned with double glazing.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "bodyEn",
    previousSha256:
      "cbc307a80eb81d5151be62f253e706bb23918624bc2121e80dd37f1f73ecbcc0",
    value:
      "Double-glazed panel options can extend the way you use your balcony. Glass, profiles and junction details are chosen for your space; final performance depends on the complete installation.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nConsider double-glazing build-up, profile thermal breaks, seals and perimeter junctions together. Discuss heating expectations and condensation risk. Balcony enclosure alone does not establish room-level insulation.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "isi-yalitimli-cam-balkon",
    field: "seoDescription",
    previousSha256:
      "0f1b7c289b48ce65b1bbd87f5f8e4c3d081c2c5c3583fab394f7d763671c2176",
    value:
      "Çift camlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.",
  },
  {
    type: "product",
    slug: "giyotin-cam",
    field: "subtitle",
    previousSha256:
      "05bf69863d2d7b6d1f4a7c7153eebb1320d6d39b34c61faa3f3188d88c1809d8",
    value: "Düşey hareketli cam panel seçenekleri.",
  },
  {
    type: "product",
    slug: "giyotin-cam",
    field: "body",
    previousSha256:
      "6752c961619cb2f992fc40ad3198cc90344f4f44353f0ea8851d0268724dabf7",
    value:
      "Düşey hareket eden cam panellerle açık ve kapalı alan arasında kontrollü bir geçiş oluşturun. Teras ve işletmeler için motor, kumanda ve güvenlik detayları proje kapsamında değerlendirilir.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nMotor ve hareketli panel seçimi; yük, ölçü ve kullanım sıklığına göre yapılır. Sıkışma riski, acil durdurma, enerji kesintisi davranışı ve servis erişimi onaylı sistemin güvenlik dokümanlarıyla birlikte değerlendirilmelidir.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "giyotin-cam",
    field: "subtitleEn",
    previousSha256:
      "b84f2409109be945208a20365510725755efc959dfd4279cd2a20f438c031aa8",
    value: "Vertically moving glass panel options.",
  },
  {
    type: "product",
    slug: "giyotin-cam",
    field: "bodyEn",
    previousSha256:
      "79eb76c51d7834dbf706b5e67c6f3059714e56739af0a59e55d828d77299593a",
    value:
      "Vertically moving glass panels offer a controlled transition between enclosed and open areas. Motors, controls and safety details are specified for each terrace or business.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nMotors and moving panels are specified for weight, size and operating frequency. Trapping risks, stopping, power-failure behaviour and service access must be assessed with the selected system's safety documentation.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "pergola-sistemleri",
    field: "subtitle",
    previousSha256:
      "c7fbecdda13b5694741fa2359018a00c4e2576d34d8b2daa6fe894188c7e0643",
    value: "Gölge ve tahliye detayları birlikte planlanır.",
  },
  {
    type: "product",
    slug: "pergola-sistemleri",
    field: "body",
    previousSha256:
      "e24c9c767d4409fe0711e0744978f7bc798da1c767d0c3b120d4673ee478287f",
    value:
      "Teras ve bahçelerinizi gölge, hava akışı ve yağış koşullarıyla birlikte düşünerek planlıyoruz. Taşıyıcı, örtü ve drenaj çözümleri uygulama alanınıza göre tasarlanır.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nSabit ve açılır örtü seçeneklerini güneş yönüyle birlikte karşılaştırın. Taşıyıcı bağlantıları, rüzgâr etkisi, suyun aktarılacağı nokta ve elektrik hazırlığı baştan belirlenmelidir. Çatıya sonradan yük eklemek uzman değerlendirmesi gerektirir.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "pergola-sistemleri",
    field: "subtitleEn",
    previousSha256:
      "b9890a5e7b28bffef2fe9f1392c41a5225d882737d813cfeeb3475bf9df63014",
    value: "Shade and drainage planned together.",
  },
  {
    type: "product",
    slug: "pergola-sistemleri",
    field: "bodyEn",
    previousSha256:
      "384e26bff4b7c9dba22be46ce434d588bac61b77f37023fe443095b2c0bb778b",
    value:
      "Plan your terrace or garden with shade, airflow and weather in mind. Structure, covering and drainage are designed around your site conditions.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nCompare fixed and retractable coverings with sun orientation. Establish structural fixings, wind exposure, drainage discharge and power preparation early. Adding roof loads later requires professional assessment.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "biyoklimatik-tavan",
    field: "subtitle",
    previousSha256:
      "3fa12837ef46f1f2e253df0258afcaf846bc1e24a8c0a0ee047316a1dffbe0a2",
    value: "Hareketli kanatlarla gün ışığı kontrolü.",
  },
  {
    type: "product",
    slug: "biyoklimatik-tavan",
    field: "body",
    previousSha256:
      "f6f358aa6a38611d539316bf1d42b2eed9d659a9f337da2d93ca1a384787d628",
    value:
      "Hareketli tavan kanatlarıyla ışık ve hava akışını kullanım ihtiyacınıza göre düzenleyin. Açık alanınızda günün farklı saatlerine uyum sağlayan esnek bir yaşam kurgulayın.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nKanatların açılım yönü ve hareketi ışık kadar suyun yönlendirilmesini de etkiler. Kar, rüzgâr, enerji kesintisi ve bakım erişimi kullanım senaryosuna göre konuşulmalıdır. Sensör veya otomasyon eklenmesi güvenli kullanım talimatlarını ortadan kaldırmaz.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "biyoklimatik-tavan",
    field: "subtitleEn",
    previousSha256:
      "c59a5d541166915c96f8d1b67af1c593268206bc2ea325c9d401ba367a999b80",
    value: "Daylight control with adjustable roof blades.",
  },
  {
    type: "product",
    slug: "biyoklimatik-tavan",
    field: "bodyEn",
    previousSha256:
      "40a9a599190d43857b16d6816dcd07912ee8d63062741d19e18bca3c1a177531",
    value:
      "Adjustable roof blades help manage sunlight and airflow. Explore motorised options and complementary glazing for a flexible outdoor space.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nBlade direction and movement influence light and drainage. Discuss snow, wind, power failure and maintenance access for the intended use. Sensors and automation do not replace safe operating instructions.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "kis-bahcesi",
    field: "subtitle",
    previousSha256:
      "1ac4ed4374061acad7fdf9f3d714c831d9e21d4e4563e7e026a27e0a1e6d17bf",
    value: "Çatı ve yan kapaması birlikte tasarlanan alanlar.",
  },
  {
    type: "product",
    slug: "kis-bahcesi",
    field: "body",
    previousSha256:
      "44614b101df6f15fa216f88c4bb56ce47c9ad9c946c4e7f56d0369ffe0b43aef",
    value:
      "Şeffaf yüzeyler ve mekâna özel çatı seçenekleriyle bahçenize yeni bir kullanım alanı ekleyin. İzin, zemin, havalandırma ve su tahliyesi gibi konular keşif aşamasında birlikte ele alınır.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nÇatı eğimi, cam yüzeyler, havalandırma, ısıtma ihtiyacı ve zemin yalıtımı birlikte planlanmalıdır. Su tahliyesi ile mevcut binaya birleşim detaylarını netleştirin. Statik uygunluk ve gerekli izinler uygulama başlamadan doğrulanmalıdır.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "kis-bahcesi",
    field: "subtitleEn",
    previousSha256:
      "7f1298877833b5badfedf0a9afe78c894814d28d4829a908c07d79c824f3843a",
    value: "Roof and side enclosures designed together.",
  },
  {
    type: "product",
    slug: "kis-bahcesi",
    field: "bodyEn",
    previousSha256:
      "9d1ac81d1b92a040e6b0e0a844b9d88931913fc6ac6923711189861595a79123",
    value:
      "Transparent surfaces and tailored roof options create new possibilities in the garden. Site permissions, foundations, ventilation and drainage are addressed during planning.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nPlan roof falls, glazing, ventilation, heating and floor insulation together. Confirm drainage and junctions with the existing building. Structural suitability and necessary permissions must be verified before work begins.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "zip-perde",
    field: "subtitle",
    previousSha256:
      "d346fe78182370683976ec162778ddfa4e3621b9587943eb102255f84af6060f",
    value: "Ray kılavuzlu dış mekân perde seçenekleri.",
  },
  {
    type: "product",
    slug: "zip-perde",
    field: "body",
    previousSha256:
      "6fce28540b12d51f96433db0b22895ff766224319d14082832c72f758b198584",
    value:
      "Dış mekân kullanımına uygun perde seçenekleriyle güneş kontrolü ve mahremiyeti birlikte düşünün. Kumaş, renk ve motor seçenekleri alanınızın yönüne ve ihtiyaçlarına göre seçilir.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nKumaşın açıklık oranı, renk ve güneş yönü görüş ile mahremiyeti farklı etkiler. Kaset konumu, kılavuz raylar, motor erişimi ve elektrik hattı uygulama alanına göre planlanır. Rüzgârlı koşullarda kullanım sınırlarını ürün kılavuzundan öğrenin.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "zip-perde",
    field: "subtitleEn",
    previousSha256:
      "95dc379ce60a85dec0a6e40495444525f5f1aacbfc68dc7fd9cc28b1ce1b43ff",
    value: "Outdoor screens with side-guide tracks.",
  },
  {
    type: "product",
    slug: "zip-perde",
    field: "bodyEn",
    previousSha256:
      "9b5592bc22477ebbdb45d879881ca85a073d422663c5e76c496c54c6b110c6c0",
    value:
      "Outdoor screens bring solar control and privacy together. Fabric, colour and motor options are selected for the orientation and requirements of your space.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nFabric openness, colour and orientation affect views and privacy differently. Plan cassette position, guides, motor access and power supply for the site. Follow the product guide for operating limits in windy conditions.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "cam-korkuluk",
    field: "subtitle",
    previousSha256:
      "41044e881d707b491452e529b89e0e9bd51acb2fae75804f85fe555d8542f46c",
    value: "Güvenlik koşullarına göre projelendirilen cam korkuluk.",
  },
  {
    type: "product",
    slug: "cam-korkuluk",
    field: "body",
    previousSha256:
      "c381ddc03398fadf1f907aa7c3cfce6f75d025686b7c025ac14ea4e38d5c3931",
    value:
      "Balkon, merdiven ve teraslarda görüşü koruyan cam korkuluk çözümleri. Taşıyıcı sistem ve cam özellikleri yapı koşulları ve ilgili güvenlik gereklilikleri dikkate alınarak projelendirilir.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nCam türü ve bileşimi, bağlantı tipi, kenar detayları ve taşıyıcı zemin güvenlik gereksinimine göre değerlendirilir. Yalnızca cam kalınlığını karşılaştırmak yeterli değildir. Kullanım yükleri ve yapı kuralları yetkin uzmanlarca doğrulanmalıdır.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "cam-korkuluk",
    field: "subtitleEn",
    previousSha256:
      "25311633da8fcbac44e0aaba7a7d1f0ee2dd97eaa95210b798dd7eb03ba3d72d",
    value: "Glass guards specified for project safety requirements.",
  },
  {
    type: "product",
    slug: "cam-korkuluk",
    field: "bodyEn",
    previousSha256:
      "7fa67bbf4656fbd30eb395e92439d9469601b063477b80527eef39290a1849ad",
    value:
      "Glass balustrades preserve views on balconies, stairs and terraces. Glass specifications and structural connections must meet the safety requirements of each project.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nGlass type and build-up, fixings, edge details and substrate are selected for safety requirements. Comparing thickness alone is insufficient. Qualified professionals must verify loads and applicable building rules.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "product",
    slug: "aluminyum-dograma",
    field: "subtitle",
    previousSha256:
      "3c71e5d9f5a2372801d32bb8e0eae4fd2981c4436a050cc830ece13d99d85517",
    value: "Kapı, pencere ve sabit yüzeyler bir arada.",
  },
  {
    type: "product",
    slug: "aluminyum-dograma",
    field: "body",
    previousSha256:
      "bbb14459ff7fa2b9c35d9ab7395bef0a87ffa0f0ecbb69b3daeea5e49cc8e340",
    value:
      "Kapı, pencere ve sabit cam yüzeyleri yapınızın mimarisiyle uyum içinde tasarlayın. Profil, cam ve donanım seçimini kullanım amacı ve yapı koşullarına göre birlikte yapıyoruz.\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.\n\nPlanlamada dikkat edilecekler\nKapı ve pencere açılımı, eşik, kilit ve aksesuarlar kullanım yoğunluğuna göre seçilir. Isı yalıtımlı veya standart profil seçenekleri cam ve çevre birleşimleriyle birlikte değerlendirilir. Donanım, su tahliyesi ve bakım erişimi teklif kapsamına dahil edilmelidir.\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.",
  },
  {
    type: "product",
    slug: "aluminyum-dograma",
    field: "subtitleEn",
    previousSha256:
      "95b97a67b0575da5d7145ac1047bd3c4ef99889d37d1bd4537b00c611db1a1c2",
    value: "Doors, windows and fixed surfaces considered together.",
  },
  {
    type: "product",
    slug: "aluminyum-dograma",
    field: "bodyEn",
    previousSha256:
      "08571727117c7d5a9a8b889aebcb37fb2c4d3561b4672d44bff1484da4944f27",
    value:
      "Plan doors, windows and fixed glass surfaces in harmony with your building. Profiles, glazing and hardware are chosen for the intended use and site conditions.\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.\n\nPlanning details\nSpecify door and window openings, thresholds, locks and accessories for daily use. Assess thermally broken or standard profiles with glass and perimeter junctions. Include hardware, drainage and maintenance access in the proposal.\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.",
  },
  {
    type: "page",
    slug: "gizlilik",
    field: "body",
    previousSha256:
      "3556fb2652a26bdb3a3f88922d07034af1727fc4875c6838e5aa62b20d487e41",
    value:
      "Bu metin yayın öncesi firma ve veri işleme süreçlerine göre tamamlanması gereken bir taslaktır.\n\nİletişim ve teklif formlarına yazdığınız ad, iletişim bilgileri ve mesajınız, talebinizi değerlendirmek amacıyla uygulamanın veritabanında saklanır. Ziyaretçi analizi yalnızca tercihler alanından izin verirseniz çalışır; bu sürümde üçüncü taraf reklam takip hizmeti kullanılmaz.\n\nMüşteri, personel ve yönetim girişlerinde gerekli oturum çerezleri kullanılır. Hesabınız, talep durumları, yazışmalar ve size sunulan belgeler erişim yetkileriyle saklanır. İzinli ziyaretçi analizi; sayfa yolu, cihaz türü ve etkileşim türlerini kaydeder; form metinlerini veya parola alanlarını kaydetmez. Taleplerinizi sitede yayımlanmış firma iletişim kanallarından iletebilirsiniz. Veri sorumlusu kimliği, saklama süreleri, aktarım koşulları ve başvuru yöntemi şirketin gerçek süreçlerine göre yayın öncesinde tamamlanmalıdır.",
  },
  {
    type: "page",
    slug: "gizlilik",
    field: "bodyEn",
    previousSha256:
      "f5b96d499f779b284cf1c61191d3bd527845c19487f2eb3aceaeb574bae72fcd",
    value:
      "This is a draft that must be completed before publication to reflect the actual business and its processing activities.\n\nNames, contact details and messages submitted through enquiry forms are stored in this application database to assess your request. Visitor analytics runs only after you opt in through the preference controls; this release does not use third-party advertising trackers.\n\nEssential session cookies support customer, staff and administrator login. Account information, request progress, messages and private documents are stored with access controls. Consented analytics records page paths, device types and interaction categories, without typed form content or passwords. Data controller identity, retention periods, sharing arrangements and the process for exercising legal rights must be completed before launch.",
  },
  {
    type: "page",
    slug: "cerez-politikasi",
    field: "summary",
    previousSha256:
      "b916a0af663eba710b0210517eeeee7a613b392751cd804328cce145d6a6b070",
    value:
      "Giriş yaptığınız müşteri, personel veya yönetim hesabını güvenle sürdürmek için gerekli oturum çerezleri kullanılır. Dil ve analiz tercihiniz yerel depolamada tutulabilir.",
  },
  {
    type: "page",
    slug: "cerez-politikasi",
    field: "body",
    previousSha256:
      "4345bee4a50666c41d1a45da6b4c4b26bdac0e6471cc3fccfe46566c79e996b5",
    value:
      "Giriş yaptığınız müşteri, personel veya yönetim hesabını güvenle sürdürmek için gerekli oturum çerezleri kullanılır. Dil ve analiz tercihiniz yerel depolamada tutulabilir.\n\nZiyaretçi analizi başlangıçta kapalıdır. Tercihler alanında izin verdiğinizde bu site, oturum depolamasındaki rastgele kimliği kullanarak genel sayfa ve etkileşim istatistikleri toplar. Hesap ve yönetim sayfaları izlenmez; formda yazdığınız içerik kaydedilmez. Tercihler alanından izninizi geri alabilirsiniz.\n\nBu sürümde üçüncü taraf reklam takip hizmeti kullanılmaz. E-posta, SMS, WhatsApp, harita veya başka hizmetler etkinleştirilirse ilgili veri aktarımı ve saklama koşulları gerçek sağlayıcıya göre açıklanmalıdır. Bu metin yayın öncesinde gerçek hizmetlere ve veri sorumlusuna göre tamamlanmalıdır.",
  },
  {
    type: "page",
    slug: "cerez-politikasi",
    field: "summaryEn",
    previousSha256:
      "b5eb0b122770d4613e7eb791fe692bac42ef55038fb2873490df98b1b47cab4a",
    value:
      "Essential session cookies support customer, staff and administrator accounts. Language and analytics choices may be stored in local storage.",
  },
  {
    type: "page",
    slug: "cerez-politikasi",
    field: "bodyEn",
    previousSha256:
      "31992339286bdf10d33e32ed62a41a49a196a62b8bb31ca2f98586dfd5a4f6f0",
    value:
      "Essential session cookies support customer, staff and administrator accounts. Language and analytics choices may be stored in local storage.\n\nVisitor analytics is off initially. If you opt in through the preference controls, this site uses a random identifier in session storage to collect public-page and interaction statistics. Account and administration pages are excluded, and typed form content is not recorded. You can withdraw consent through the preference controls.\n\nThis release does not use third-party advertising trackers. If email, SMS, WhatsApp, maps or other services are enabled, explain their actual providers, transfers and retention arrangements. Complete this draft for the actual services and data controller before launch.",
  },
  {
    type: "page",
    slug: "cerez-politikasi",
    field: "seoDescription",
    previousSha256:
      "b916a0af663eba710b0210517eeeee7a613b392751cd804328cce145d6a6b070",
    value:
      "Giriş yaptığınız müşteri, personel veya yönetim hesabını güvenle sürdürmek için gerekli oturum çerezleri kullanılır. Dil ve analiz tercihiniz yerel depolamada tutulabilir.",
  },
];

function rightsPage(now: string): Content {
  return {
    id: randomUUID(),
    type: "page",
    slug: "icerik-ve-kullanim-haklari",
    title: "İçerik ve Kullanım Hakları",
    titleEn: "Content and Usage Rights",
    subtitle: "Görsel kaynakları, kullanım koşulları ve hak bildirimleri.",
    subtitleEn: "Image sources, usage terms and rights enquiries.",
    summary:
      "Sitedeki konsept görselleri, üçüncü taraf hakları ve içerik bildirimleri hakkında bilgi.",
    summaryEn:
      "Information about concept visuals, third-party rights and content enquiries.",
    body: [
      "Bu site Kılınç Dekorasyon'un hizmetleri ve proje seçenekleri hakkında bilgi verir. Ürünlerin uygulanabilirliği, malzemesi, teknik kapsamı ve ticari koşulları projeye özel yazılı teklif ile netleştirilir. Genel ürün tanımları, başka bir üreticiyle yetkili bayilik veya ortaklık ilişkisi bulunduğu anlamına gelmez.",
      "Konsept olarak işaretlenen başlangıç görselleri, bu proje için yapay zekâ desteğiyle üretilmiş mimari görselleştirmelerdir. Tamamlanmış müşteri uygulaması, gerçek saha fotoğrafı veya ürün performansının kanıtı olarak sunulmaz. Sonradan yüklenen fotoğraf, çizim ve belgelerin kaynakları ve kullanım izinleri ayrıca değerlendirilmelidir.",
      "Sitede kullanılan açık kaynak yazılım, font ve ikonların hakları ilgili hak sahiplerinde kalır; bunların kullanım koşulları kendi lisanslarıyla belirlenir. Üçüncü taraf lisans bildirimleri /licenses/THIRD-PARTY-NOTICES.txt adresinde sunulur. Bu bildirim, sitedeki her görselin veya kullanıcı yüklemesinin aynı lisans altında olduğu anlamına gelmez.",
      "Bir içeriğin kamuya açık olması yeniden kullanım izni verildiği anlamına gelmez. Sitedeki metin, görsel ve belgeleri yeniden yayımlamak veya ticari materyallerde kullanmak istiyorsanız ilgili hak sahibinden gerekli izinleri almalısınız. Bu açıklama, kanundan veya ilgili açık lisanstan doğan kullanım haklarını sınırlamayı amaçlamaz.",
      "Bir içerik veya işaretin haklarınızı etkilediğini düşünüyorsanız İletişim sayfamızdaki formdan bize ulaşabilirsiniz: /iletisim. İncelemeye yardımcı olmak için ilgili sayfa veya dosya adresini, hak iddianızın açıklamasını, varsa kaynak veya temsil bilginizi ve yanıtlanabileceğiniz iletişim kanalını paylaşabilirsiniz. Özel müşteri belgelerini veya gereksiz kişisel bilgileri göndermeyin. Bildirimler içerik ve mevcut izinler yönünden değerlendirilir.",
      "Firma adı, marka kullanımı ve sonradan eklenen içerikler için hak sahipliği ve izinler ayrıca doğrulanmalıdır. Bu sayfa, bütün içerikler için hak sahipliği veya hiçbir üçüncü kişi hakkının etkilenmeyeceği yönünde bir garanti oluşturmaz.",
    ].join("\n\n"),
    bodyEn: [
      "This website describes Kılınç Dekorasyon's services and project options. Product suitability, materials, technical scope and commercial terms are confirmed in a project-specific written proposal. Generic product descriptions do not establish an authorised dealership or partnership with another manufacturer.",
      "Initial visuals labelled as concepts are architectural visualisations created for this project with AI assistance. They do not represent completed customer installations, actual site photographs or evidence of product performance. Sources and permissions for subsequently uploaded photographs, drawings and documents require separate review.",
      "Rights in open-source software, fonts and icons remain with their respective rights holders and are governed by their own licences. Third-party licence notices are available at /licenses/THIRD-PARTY-NOTICES.txt. These notices do not place every image or user upload on this website under the same licence.",
      "Public availability does not itself grant permission to reuse material. Obtain the required permission from the relevant rights holder before republishing text, visuals or documents or using them in commercial materials. This statement does not seek to restrict uses permitted by law or an applicable open licence.",
      "If you believe material or a sign affects your rights, contact us through the form on our Contact page: /iletisim. To help us review the issue, you may identify the relevant page or file, explain your claim, provide any source or representation details and specify a reply channel. Do not send private customer documents or unnecessary personal information. Reports are assessed against the material and available permissions.",
      "Rights and permissions for the business name, brand use and subsequently added material must be verified separately. This page does not guarantee ownership of every item or the absence of any effect on third-party rights.",
    ].join("\n\n"),
    image: "",
    imageAlt: "",
    category: "Bilgilendirme",
    featured: false,
    published: true,
    sortOrder: 98,
    specs: [],
    gallery: [],
    seoTitle: "İçerik ve Kullanım Hakları | Kılınç Dekorasyon",
    seoDescription:
      "Konsept görselleri, açık kaynak lisansları ve içerik hakkı bildirimleri hakkında bilgi.",
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Apply the fixed legacy-text corrections once, matching each original field's
 * exact bytes. A custom field (including an unpublished or renamed item) is not
 * replaced simply because another field still contains a bundled default.
 */
export function applyOriginalityContentMigration(db: DatabaseSync): void {
  if (
    db
      .prepare("SELECT version FROM schema_migrations WHERE version=?")
      .get(originalityContentVersion)
  )
    return;

  db.exec("BEGIN IMMEDIATE");
  try {
    const now = new Date().toISOString();
    const lookup = db.prepare(
      "SELECT id,data FROM content WHERE type=? AND slug=?",
    );
    const update = db.prepare("UPDATE content SET data=? WHERE id=?");
    const pending = new Map<
      string,
      { id: string; content: Record<string, unknown>; changed: boolean }
    >();
    for (const correction of defaultCorrections) {
      const key = `${correction.type}:${correction.slug}`;
      let record = pending.get(key);
      if (!record) {
        const row = lookup.get(correction.type, correction.slug) as
          { id: string; data: string } | undefined;
        if (!row) continue;
        const content: unknown = JSON.parse(row.data);
        if (!content || typeof content !== "object" || Array.isArray(content)) {
          throw new Error("İçerik geçişinde geçersiz kayıt yapısı.");
        }
        record = {
          id: row.id,
          content: content as Record<string, unknown>,
          changed: false,
        };
        pending.set(key, record);
      }
      const previous = record.content[correction.field];
      if (
        typeof previous === "string" &&
        createHash("sha256").update(previous).digest("hex") ===
          correction.previousSha256
      ) {
        record.content[correction.field] = correction.value;
        record.changed = true;
      }
    }
    for (const record of pending.values()) {
      if (!record.changed) continue;
      record.content.updatedAt = now;
      update.run(JSON.stringify(record.content), record.id);
    }

    const page = rightsPage(now);
    db.prepare(
      "INSERT OR IGNORE INTO content(id,type,slug,data) VALUES(?,?,?,?)",
    ).run(page.id, page.type, page.slug, JSON.stringify(page));
    db.prepare(
      "INSERT INTO schema_migrations(version,appliedAt) VALUES(?,?)",
    ).run(originalityContentVersion, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
