// Editable service notes; independent from the public site layout.
export const referencePagesVersion = "recorded-layout-2026-10-28";
export function referencePages() {
  const make = (
    slug: string,
    title: string,
    titleEn: string,
    subtitle: string,
    subtitleEn: string,
    body: string,
    bodyEn: string,
    specs: { label: string; value: string }[],
  ) => ({
    type: "page",
    slug,
    title,
    titleEn,
    subtitle,
    subtitleEn,
    summary: subtitle,
    summaryEn: subtitleEn,
    body,
    bodyEn,
    specs,
    category: "Uygulama notları",
    image: "",
    imageAlt: "",
    gallery: [],
    published: true,
    featured: false,
    sortOrder: 90,
    seoTitle: `${title} | Kılınç Dekorasyon`,
    seoDescription: subtitle,
  });
  return [
    make(
      "terimler-sozlugu",
      "Terimler Sözlüğü",
      "System Glossary",
      "Malzemeyi tanıyın, seçenekleri daha kolay karşılaştırın.",
      "Understand the materials and compare your options.",
      "Tekliflerde sık karşılaşılan terimleri sade bir dille açıklıyoruz. Bir malzeme adı tek başına sistem performansını veya kullanım uygunluğunu göstermez; bileşenler, ölçüler ve montaj koşulları birlikte değerlendirilmelidir.",
      "A plain-language introduction to terms used in proposals. A material name alone does not establish performance or suitability: components, dimensions and installation conditions need to be considered together.",
      [
        {
          label: "Temperli cam",
          value:
            "Kontrollü ısıl işlemle mekanik davranışı değiştirilmiş camdır. Kalınlık ve kullanım yeri proje koşullarına göre belirlenir.",
        },
        {
          label: "Lamine cam",
          value:
            "Ara katmanla birleştirilen cam tabakalarıdır. Kırılma sonrası tutunma davranışı, seçilen katman ve cam yapısına bağlıdır.",
        },
        {
          label: "Yalıtım camı",
          value:
            "Aralarında boşluk bulunan birden çok camdan oluşur. Cam kaplaması, ara boşluk ve kenar birleşimi performansı etkiler.",
        },
        {
          label: "Isı bariyeri",
          value:
            "Alüminyum profilin iç ve dış parçaları arasındaki ısı geçişini sınırlamaya yönelik bileşendir; tek başına tüm yapının yalıtımını garanti etmez.",
        },
        {
          label: "EPDM conta",
          value:
            "Uygun birleşim detayında kullanılan elastomer sızdırmazlık elemanıdır. Süreklilik ve doğru sıkışma montaj sırasında kontrol edilir.",
        },
        {
          label: "Elektrostatik boya",
          value:
            "Metal yüzeyin hazırlanması, toz boya uygulaması ve uygun kürleme sürecini içeren bir kaplama yöntemidir.",
        },
        {
          label: "Eloksal",
          value:
            "Alüminyum yüzeyde kontrollü oksit tabakası oluşturan yüzey işlemidir. Doku ve renk numune üzerinden değerlendirilmelidir.",
        },
        {
          label: "Tahliye kanalı",
          value:
            "Sistemde toplanan suyun kontrollü uzaklaştırılması için planlanan yoldur. Periyodik temizlik ve bağlantı detayı önemlidir.",
        },
        {
          label: "Ankraj",
          value:
            "Sistemi taşıyıcı zemine bağlayan sabitleme çözümüdür. Zemin türü, yükler ve kenar mesafeleri teknik değerlendirme gerektirir.",
        },
        {
          label: "Keşif ölçüsü",
          value:
            "Mevcut yapıda uygulama koşullarını değerlendirmek için alınan ölçüdür. Müşterinin ön ölçüsü üretim ölçüsü olarak kullanılmaz.",
        },
        {
          label: "Giyotin sistem",
          value:
            "Cam panellerin düşey doğrultuda hareket ettiği sistem ailesidir. Hareket güvenliği ve bakım erişimi projede ele alınmalıdır.",
        },
        {
          label: "Bioklimatik pergola",
          value:
            "Hareketli lamellerle gün ışığı ve açıklık kontrolü sağlayan örtü sistemidir. Yağmur, kar ve rüzgâr koşulları ayrıca projelendirilir.",
        },
      ],
    ),
    make(
      "renk-kartelasi",
      "Renk Kartelası",
      "Colour Palette",
      "Mimarinize uygun tonu birlikte seçelim.",
      "Choose a tone that complements your architecture.",
      "Buradaki renkler ekran üzerinde yaklaşık ön seçim içindir. Renkler RAL veya başka bir standardın onaylı karşılığı olarak sunulmaz. Işık, monitör ve yüzey dokusu algıyı değiştirebilir.\nÜretim öncesinde gerçek profil veya kaplama numunesiyle ton, parlaklık, doku ve ürün için uygulanabilirlik yazılı olarak teyit edilmelidir. Seçtiğiniz rengi teklif talebine ekleyebilirsiniz.",
      "These colours are approximate on-screen selection aids, not certified matches to RAL or another standard. Lighting, displays and surface texture affect appearance. Confirm colour, gloss, texture and availability using a physical sample before production.",
      [
        { label: "Orman yeşili", value: "#213f34" },
        { label: "Antrasit", value: "#343a3b" },
        { label: "Kırık beyaz", value: "#eeeae0" },
        { label: "Taş grisi", value: "#a1a49b" },
        { label: "Kum beji", value: "#c6b79c" },
        { label: "Siyah", value: "#202420" },
        { label: "Bronz", value: "#8d7455" },
        { label: "Açık gri", value: "#c9cdca" },
        { label: "Koyu kahve", value: "#54473b" },
        { label: "Adaçayı", value: "#879783" },
      ],
    ),
    make(
      "olcu-rehberi",
      "Ön Ölçü Rehberi",
      "Preliminary Measuring Guide",
      "İlk görüşmeye hazırlanmak için basit ve güvenli adımlar.",
      "Simple, safe steps to prepare for your first conversation.",
      "Ön ölçü yalnızca ilk değerlendirmeye yardımcı olur. Üretim, statik hesap veya uygulama onayı yerine geçmez. Balkon dışına uzanmayın, yükseğe çıkmayın ve hareketli mekanizmaları sökmeyin.\nGüvenli erişiminiz olmayan alanları ölçmeyin. Son ölçü, taşıyıcı zemin, bağlantı detayları, su tahliyesi ve hareket boşlukları uzman ekip tarafından yerinde doğrulanmalıdır.",
      "Preliminary dimensions are only an initial discussion aid, not production measurements, structural calculations or installation approval. Do not lean outside the balcony, climb or dismantle mechanisms. Leave inaccessible areas to the survey team.",
      [
        {
          label: "1 · Uygulama alanını tanımlayın",
          value:
            "Balkon, teras, bahçe, ofis veya giriş alanını belirtin. Kat bilgisi ve yapının mevcut durumunu not edin.",
        },
        {
          label: "2 · Yaklaşık açıklığı ölçün",
          value:
            "Güvenli zeminden yatay genişlik ve düşey yüksekliği metre veya santimetre olarak not edin. Birim belirtmeyi unutmayın.",
        },
        {
          label: "3 · Farklı noktaları not edin",
          value:
            "Taban ve tavan arasında eğim, kademelenme veya farklı açıklıklar varsa belirtin. Bunları kendi başınıza düzeltmeye çalışmayın.",
        },
        {
          label: "4 · Kullanım ihtiyacını yazın",
          value:
            "Açılım yönü, manzara, havalandırma, temizlik erişimi ve yalıtım beklentinizi paylaşın.",
        },
        {
          label: "5 · Kısıtları belirtin",
          value:
            "Bina yönetimi koşulları, erişim güçlüğü, korkuluk, elektrik hattı veya su tahliyesi gibi detayları ilk görüşmede konuşun.",
        },
        {
          label: "6 · Yerinde keşifle doğrulayın",
          value:
            "Ön ölçüye dayanarak üretim siparişi vermeyin. Kesin kapsam ve ölçüler yerinde keşif ve yazılı teklifle netleştirilir.",
        },
      ],
    ),
    make(
      "uygulama-sureci",
      "Çalışma Sürecimiz",
      "Our Project Process",
      "Etimesgut’taki dükkânımızla görüşmeden uygulamaya.",
      "From a conversation with our Etimesgut shop to installation.",
      "Etimesgut’taki tek dükkânımızla doğrudan iletişim kurarsınız. Kullanım amacı, yapı, erişim, malzeme ve hedef takvimi birlikte değerlendirerek kapsamı netleştiririz.\nBu süreç akışı bir teslim süresi veya performans garantisi değildir. Onaylanacak ürün, uygulama, takvim ve ticari koşullar projeye özel yazılı teklifte yer almalıdır.",
      "You speak directly with our single shop in Etimesgut. We review the intended use, building, access, materials and target timing together. This process is not a delivery or performance guarantee; scope and terms are confirmed in a project-specific proposal.",
      [
        {
          label: "İhtiyaç ve ilk görüşme",
          value:
            "Alanı nasıl kullanmak istediğinizi, yaklaşık ölçüleri ve beklentilerinizi dinliyoruz.",
        },
        {
          label: "Yerinde keşif",
          value:
            "Uygulanabilirlik, üretim ölçüsü, taşıyıcı bağlantılar, erişim ve tahliye detaylarını değerlendiriyoruz.",
        },
        {
          label: "Yazılı teklif ve plan",
          value:
            "Sistem, bileşenler, renk, montaj kapsamı, takvim, ödeme ve garanti koşullarını birlikte netleştiriyoruz.",
        },
        {
          label: "Uygulama ve teslim",
          value:
            "Onaylı kapsam üzerinden ilerliyor; kullanım, temizlik, bakım ve servis iletişim bilgilerini teslimde paylaşıyoruz.",
        },
      ],
    ),
    make(
      "garanti-servis",
      "Garanti ve Bakım",
      "Warranty & Care",
      "Teslimden sonra da doğru kullanım ve bakım önemli.",
      "Correct use and maintenance matter after handover.",
      "Garanti kapsamı ve süresi; sözleşme, seçilen sistem, bileşen üreticileri ve yürürlükteki mevzuata göre yazılı olarak belirlenir. Bu sayfa belirli bir yıl garantisi veya tüm koşulları kapsayan bir taahhüt içermez.\nTeslim belgesi, fatura ve ürün bilgilerini saklayın. Bir sorun gördüğünüzde kullanımı güvenle durdurun; cam, motor veya taşıyıcı mekanizmayı kendiniz sökmeyin.\nServis formunda sistemin türünü, yaklaşık uygulama tarihini ve sorunun ne zaman oluştuğunu açıklayın. Hassas kişisel belge veya ödeme bilgisi paylaşmayın. Servis uygunluğu, kapsamı ve ücreti inceleme sırasında teyit edilir.",
      "Warranty scope and duration are defined in writing through the contract, selected components and applicable law. Keep the handover record, invoice and product information. Stop use safely if a problem occurs; do not dismantle glass, motors or structural mechanisms. Explain the issue through the service form without sharing sensitive documents or payment details.",
      [
        {
          label: "Günlük kullanım",
          value:
            "Panelleri zorlamayın; hareket alanını eşya, çocuk ve evcil hayvanlardan uzak tutun. Üreticinin kullanım talimatını takip edin.",
        },
        {
          label: "Temizlik",
          value:
            "Aşındırıcı malzeme ve uygunsuz kimyasallardan kaçının. Güvenli erişim olmayan cam yüzeylerde profesyonel destek alın.",
        },
        {
          label: "Periyodik kontrol",
          value:
            "Ray, conta ve tahliye kanallarını kullanım talimatına göre kontrol edin. Ses, sürtünme veya gevşek bağlantıyı görmezden gelmeyin.",
        },
        {
          label: "Servis başvurusu",
          value:
            "Sistem türü ve sorun açıklamasıyla başvurun. İnceleme ve servis koşulları size ayrıca bildirilir.",
        },
      ],
    ),
  ];
}
