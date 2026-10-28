export interface Content {
  id: string;
  type: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  body: string;
  image: string;
  category: string;
  featured: boolean;
  published: boolean;
  sortOrder: number;
  specs: { label: string; value: string }[];
  gallery: string[];
  createdAt: string;
  updatedAt: string;
  titleEn?: string;
  subtitleEn?: string;
  summaryEn?: string;
  bodyEn?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageAlt?: string;
}
export const defaultSettings = {
  logoText: "KILINÇ",
  companyName: "Kılınç Dekorasyon",
  tagline: "Etimesgut’ta ölçü, keşif ve uygulama.",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  workingHours: "",
  instagram: "",
  facebook: "",
  youtube: "",
  linkedin: "",
  heroImage: "/images/original-terrace.png",
  heroEyebrow: "KILINÇ DEKORASYON · ETİMESGUT",
  heroTitle: "Ölçünüze göre.\nUstanızla doğrudan.",
  heroSubtitle:
    "Balkonunuz, terasınız veya işyeriniz için neye ihtiyacınız var? Etimesgut’taki tek dükkânımızdan sizinle doğrudan görüşüp ölçü, malzeme ve uygulama adımlarını birlikte netleştiriyoruz.",
  heroTitleEn: "Made to fit.\nTalk to your installer.",
  heroSubtitleEn:
    "What do you need for your balcony, terrace or business premises? Talk directly with our single shop in Etimesgut to agree measurements, materials and the installation steps.",
  heroEyebrowEn: "KILINÇ DEKORASYON · ETİMESGUT",
  aboutTextEn:
    "Kılınç Dekorasyon is a local business with one shop in Ankara’s Etimesgut district. Share your needs directly with us and follow your survey, written proposal, installation and service enquiries in one place.",
  aboutText:
    "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkânı olan yerel bir firmadır. İhtiyacınızı bizimle doğrudan paylaşabilir; keşif, yazılı teklif, uygulama ve servis taleplerinizi tek yerden takip edebilirsiniz.",
  serviceAreas: "",
  languages: ["tr", "en"],
  seoTitle: "Kılınç Dekorasyon | Etimesgut’ta Keşif ve Uygulama",
  seoDescription:
    "Etimesgut’taki tek dükkânımızdan cam balkon, alüminyum ve metal uygulamaları için doğrudan iletişim. Ölçü, keşif, yazılı teklif ve talep takibi.",
};
const products = [
  [
    "katlanir-cam-balkon",
    "Katlanır Cam Balkon",
    "Katlanarak yana toplanan cam paneller.",
    "Cam balkon",
    "Bir yana toplanabilen cam panellerle balkonunuzu mevsime ve kullanımınıza göre dönüştürün. Görüşü kesmeyen bir yaklaşım, günlük yaşamınıza daha fazla alan kazandırsın.",
    "Panel düzeni|Mekâna göre projelendirilir;Cam seçimi|Ölçü ve kullanım koşullarına göre;Açılım|Katlanır panel sistemi",
  ],
  [
    "surme-cam-sistemleri",
    "Sürme Cam Sistemleri",
    "Raylı panellerle ayarlanabilen açıklıklar.",
    "Cam balkon",
    "Ray üzerinde hareket eden cam paneller, geniş açıklıkları esnek biçimde kullanmanıza yardımcı olur. Balkon, teras ve ticari mekânlarda ihtiyaca uygun açılım seçenekleri birlikte değerlendirilir.",
    "Açılım|Yatay sürme;Kullanım|Balkon ve teras;Projelendirme|Yerinde ölçüye özel",
  ],
  [
    "isi-yalitimli-cam-balkon",
    "Isı Yalıtımlı Cam Balkon",
    "Çift cam bileşimiyle planlanan balkon kapaması.",
    "Cam balkon",
    "Çift camlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.",
    "Cam|Çift cam seçenekleri;Profil|Projeye uygun alüminyum;Uygulama|Yerinde keşif sonrası",
  ],
  [
    "giyotin-cam",
    "Giyotin Cam",
    "Düşey hareketli cam panel seçenekleri.",
    "Hareketli cam",
    "Düşey hareket eden cam panellerle açık ve kapalı alan arasında kontrollü bir geçiş oluşturun. Teras ve işletmeler için motor, kumanda ve güvenlik detayları proje kapsamında değerlendirilir.",
    "Hareket|Düşey panel hareketi;Kontrol|Motor ve kumanda seçeneği;Kullanım|Teras ve işletmeler",
  ],
  [
    "pergola-sistemleri",
    "Pergola Sistemleri",
    "Gölge ve tahliye detayları birlikte planlanır.",
    "Gölgelendirme",
    "Teras ve bahçelerinizi gölge, hava akışı ve yağış koşullarıyla birlikte düşünerek planlıyoruz. Taşıyıcı, örtü ve drenaj çözümleri uygulama alanınıza göre tasarlanır.",
    "Tasarım|Ölçüye özel;Seçenekler|Aydınlatma ve yan kapama;Planlama|Rüzgâr ve drenaj değerlendirmesi",
  ],
  [
    "biyoklimatik-tavan",
    "Biyoklimatik Tavan",
    "Hareketli kanatlarla gün ışığı kontrolü.",
    "Gölgelendirme",
    "Hareketli tavan kanatlarıyla ışık ve hava akışını kullanım ihtiyacınıza göre düzenleyin. Açık alanınızda günün farklı saatlerine uyum sağlayan esnek bir yaşam kurgulayın.",
    "Tavan|Hareketli kanatlar;Kontrol|Motorlu seçenekler;Tamamlama|Cam kapama ile birlikte planlanabilir",
  ],
  [
    "kis-bahcesi",
    "Kış Bahçesi",
    "Çatı ve yan kapaması birlikte tasarlanan alanlar.",
    "Yaşam alanları",
    "Şeffaf yüzeyler ve mekâna özel çatı seçenekleriyle bahçenize yeni bir kullanım alanı ekleyin. İzin, zemin, havalandırma ve su tahliyesi gibi konular keşif aşamasında birlikte ele alınır.",
    "Kapsam|Çatı ve yan kapama;Tasarım|Mekâna özel;Detaylar|Havalandırma ve drenaj",
  ],
  [
    "zip-perde",
    "Zip Perde",
    "Ray kılavuzlu dış mekân perde seçenekleri.",
    "Gölgelendirme",
    "Dış mekân kullanımına uygun perde seçenekleriyle güneş kontrolü ve mahremiyeti birlikte düşünün. Kumaş, renk ve motor seçenekleri alanınızın yönüne ve ihtiyaçlarına göre seçilir.",
    "Kullanım|Dış mekân güneş kontrolü;Kontrol|Motorlu seçenekler;Seçim|Kumaş ve renk alternatifleri",
  ],
  [
    "cam-korkuluk",
    "Cam Korkuluk",
    "Güvenlik koşullarına göre projelendirilen cam korkuluk.",
    "Mimari çözümler",
    "Balkon, merdiven ve teraslarda görüşü koruyan cam korkuluk çözümleri. Taşıyıcı sistem ve cam özellikleri yapı koşulları ve ilgili güvenlik gereklilikleri dikkate alınarak projelendirilir.",
    "Uygulama|Balkon, teras ve merdiven;Cam|Proje güvenlik gerekliliklerine göre;Bağlantı|Zemine ve yapıya uygun",
  ],
  [
    "aluminyum-dograma",
    "Alüminyum Doğrama",
    "Kapı, pencere ve sabit yüzeyler bir arada.",
    "Mimari çözümler",
    "Kapı, pencere ve sabit cam yüzeyleri yapınızın mimarisiyle uyum içinde tasarlayın. Profil, cam ve donanım seçimini kullanım amacı ve yapı koşullarına göre birlikte yapıyoruz.",
    "Sistem|Kapı, pencere ve sabit cam;Profil|Kullanıma uygun seri;Renk|Projeye uygun seçenekler",
  ],
];
export function seedContent(): Omit<
  Content,
  "id" | "createdAt" | "updatedAt"
>[] {
  const rows: any[] = products.map((p, i) => ({
    type: "product",
    slug: p[0],
    title: p[1],
    subtitle: p[2],
    summary: p[4],
    body:
      p[4] +
      "\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nKonsept olarak belirtilen görseller tasarım seçeneklerini anlatır; tamamlanmış müşteri projesi değildir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.",
    image: `/images/product-${i + 1}.svg`,
    category: p[3],
    featured: i < 4,
    published: true,
    sortOrder: i,
    specs: p[5].split(";").map((s) => {
      const [label, value] = s.split("|");
      return { label, value };
    }),
    gallery: [],
  }));
  const projects = [
    [
      "teras-yasami",
      "Şehirde bir nefes alanı",
      "Teras",
      "Geniş cam açıklıkları ve gölge alanları bir araya getiren temsili teras tasarımı.",
    ],
    [
      "bahceyle-bulusan-ev",
      "Bahçeyle buluşan ev",
      "Kış bahçesi",
      "Doğal ışığı günlük yaşama taşıyan, bahçeyle görsel bağı koruyan temsili kış bahçesi çalışması.",
    ],
    [
      "kompakt-balkon",
      "Küçük balkonda büyük fikirler",
      "Cam balkon",
      "Kompakt alanlar için esnek panel düzenini ve sade mobilyaları buluşturan temsili mekân çalışması.",
    ],
    [
      "restoran-terasi",
      "Sohbeti dışarı taşıyan mekân",
      "Ticari alan",
      "İşletme terasları için cam kapama ve gölgelendirmeyi birlikte ele alan temsili konsept.",
    ],
    [
      "panoramik-kose",
      "Manzaraya açılan köşe",
      "Cam balkon",
      "Köşe açıklıklarında görüşü ve günlük kullanımı önceleyen temsili cam balkon çalışması.",
    ],
    [
      "golgeli-bahce",
      "Gölgenin altında bir buluşma",
      "Pergola",
      "Bahçede yemek ve dinlenme alanını gölgeyle buluşturan temsili pergola konsepti.",
    ],
  ];
  projects.forEach((p, i) =>
    rows.push({
      type: "project",
      slug: p[0],
      title: p[1],
      subtitle: p[2],
      summary: p[3],
      body:
        p[3] +
        "\n\nBu içerik bir uygulama referansı veya tamamlanmış müşteri işi değildir. Mekân olasılıklarını göstermek için hazırlanmış temsili bir tasarım örneğidir. Kendi projeniz için ölçü, konum ve kullanım beklentinizi paylaşabilirsiniz.",
      image: `/images/project-${i + 1}.svg`,
      category: p[2],
      featured: i < 3,
      published: true,
      sortOrder: i,
      specs: [{ label: "Çalışma türü", value: "Temsili tasarım konsepti" }],
      gallery: [],
    }),
  );
  const articles = [
    [
      "cam-balkon-secerken",
      "Cam balkon seçerken nereden başlamalı?",
      "Rehber",
      "Bir sistem seçmeden önce balkonunuzun yönünü, kullanım alışkanlıklarınızı ve açılım ihtiyacınızı değerlendirin.",
      "Cam balkon seçiminde ilk adım, alanınızı nasıl kullanmak istediğinizi belirlemektir. Günlük havalandırma, temizlik erişimi ve mobilya yerleşimi açılım tercihini etkiler.\n\nYerinde ölçü sırasında zeminin durumu, tavan bağlantıları ve su tahliyesi de değerlendirilmelidir. Cam ve profil özellikleri yalnızca ürün adına bakılarak seçilmemelidir.\n\nTeklifleri karşılaştırırken malzeme kapsamı, montaj, teslim süresi ve satış sonrası destek koşullarını yazılı olarak istemeniz yararlı olur.",
    ],
    [
      "cam-yuzeylerin-bakimi",
      "Cam yüzeylerde sade bir bakım rutini",
      "Bakım",
      "Düzenli ve doğru bakım, cam sistemlerini rahat kullanmanıza yardımcı olur.",
      "Cam yüzeyleri yumuşak bir bez ve üretici önerisine uygun temizlik ürünüyle temizleyin. Aşındırıcı sünger ve güçlü kimyasallar kaplamalara zarar verebilir.\n\nRaylardaki toz ve birikintileri düzenli olarak uzaklaştırın. Su tahliye noktalarını açık tutun. Hareketli parçaların ayarı ve bakımı için sistemin kullanım kılavuzuna başvurun.\n\nPanelin hareketi zorlaşıyorsa zorlamayın; yetkili uygulayıcıdan kontrol isteyin.",
    ],
    [
      "teras-golgelendirme",
      "Teras için gölgelendirme planlarken",
      "Tasarım",
      "Güneşin yönü, gölge ihtiyacı ve mevsimsel kullanım tasarımınızın çıkış noktasıdır.",
      "Terasınızı en çok hangi saatlerde kullandığınızı not edin. Güneşin geliş yönü, çevre yapılar ve hâkim rüzgâr gölgelendirme tercihinde belirleyici olabilir.\n\nTaşıyıcı bağlantıları ve su tahliyesini en baştan planlayın. Elektrikli ürünler için enerji hattı ve bakım erişimini de projeye ekleyin.\n\nAydınlatma ve yan kapama çözümleri sonradan eklenebilir; ancak birlikte düşünülmeleri daha bütünlüklü bir sonuç sağlar.",
    ],
    [
      "kis-bahcesi-planlama",
      "Kış bahçesi fikrinden projeye",
      "Yaşam",
      "Doğru sorularla başlayan bir planlama, alanın beklentinize uygun kullanılmasını sağlar.",
      "Kış bahçesini yemek alanı, çalışma köşesi veya dinlenme mekânı olarak kullanmak farklı ihtiyaçlar doğurur. Zemin, taşıyıcı yapı, cam yüzeyler ve havalandırmayı birlikte değerlendirin.\n\nBölgenizdeki izinler ve yapı koşulları için ilgili kurum ve uzmanlardan bilgi alın. Isıtma ya da soğutma ihtiyacını yalnızca cam seçimine bağlamadan bütün yapı kapsamında ele alın.\n\nYerinde keşif sonunda sistem kapsamını, malzemeleri ve uygulama takvimini yazılı teklif üzerinden netleştirin.",
    ],
  ];
  articles.forEach((a, i) =>
    rows.push({
      type: "article",
      slug: a[0],
      title: a[1],
      subtitle: a[2],
      summary: a[3],
      body: a[4],
      image: `/images/article-${i + 1}.svg`,
      category: a[2],
      featured: i < 3,
      published: true,
      sortOrder: i,
      specs: [],
      gallery: [],
    }),
  );
  const pages = [
    [
      "hakkimizda",
      "Dükkânımızdan, doğrudan sizinle.",
      "Etimesgut’taki dükkânımız",
      "Kılınç Dekorasyon, Ankara Etimesgut’ta tek dükkândan hizmet veren yerel bir firmadır. Balkon, teras veya işyerinizde neyi değiştirmek istediğinizi doğrudan bizimle konuşabilirsiniz.\n\nÖnce ihtiyacı ve mekânın koşullarını anlarız. Yaklaşık ölçü ve konumla başlayan görüşmeyi, uygun olduğunda yerinde keşifle tamamlarız. Malzeme seçeneği, iş kapsamı, ücret ve takvim yazılı teklifte netleşir.\n\nTalebinizi hesabınızdan izleyebilir, belgelerinize ulaşabilir ve uygulama ya da servis hakkında mesaj bırakabilirsiniz. Her işin uygunluğu kendi koşullarıyla değerlendirilir; sitedeki konsept görseller tamamlanmış müşteri işi olarak sunulmaz.",
    ],
    [
      "kalite-yaklasimimiz",
      "İyi bir sonuç, doğru detaylarla başlar.",
      "Kalite yaklaşımımız",
      "Malzeme seçimi, doğru ölçü ve özenli uygulamayı bir bütün olarak değerlendiriyoruz.\n\nTeknik özellikler, sertifika ve uygunluk belgeleri seçilen ürün ve tedarikçiye göre değişir. Talep ettiğiniz belgeler teklif aşamasında ilgili ürün kapsamında paylaşılır. Bu sitede bağımsız doğrulanmamış sertifika veya performans garantisi sunulmaz.",
    ],
    [
      "uygulama-sureci",
      "Birlikte, adım adım.",
      "Uygulama süreci",
      "1. İhtiyacınızı dinliyoruz. Kullanım amacınızı, mekânınızı ve beklentinizi paylaşın.\n\n2. Yerinde değerlendiriyoruz. Ölçü, bağlantı noktaları ve uygulama koşulları belirlenir.\n\n3. Teklifi netleştiriyoruz. Sistem, malzeme kapsamı, fiyat ve takvim yazılı olarak paylaşılır.\n\n4. Uyguluyoruz. Onaylanan plan doğrultusunda montaj ve son kontroller yapılır.\n\n5. Kullanımı anlatıyoruz. Bakım ve kullanım bilgileri teslim sırasında paylaşılır.",
    ],
    [
      "garanti-ve-servis",
      "Kullanım boyunca yanınızdayız.",
      "Garanti ve servis",
      "Garanti süresi, kapsamı ve servis koşulları seçilen ürün, tedarikçi ve sözleşmeye göre belirlenir. Kesin koşulları teklif ve teslim belgelerinizden kontrol edin.\n\nServis talebinizde uygulama adresini, varsa sipariş bilginizi ve ihtiyacı anlatan fotoğrafları paylaşmanız değerlendirmeyi kolaylaştırır. Bu sayfada belirtilmeyen bir garanti taahhüdü verilmez.",
    ],
    [
      "kataloglar",
      "Çözümleri bir arada keşfedin.",
      "Kataloglar",
      "Ürün ailelerini ve tasarım yaklaşımlarını derlediğimiz güncel kataloğu indirebilirsiniz.\n\nKatalog genel bilgilendirme amaçlıdır. Kesin ölçü, sistem, teknik özellik ve fiyatlar projenize özel teklif kapsamında belirlenir.",
    ],
    [
      "gizlilik",
      "Gizlilik ve kişisel veriler",
      "Gizlilik",
      "Bu metin yayın öncesi firma ve veri işleme süreçlerine göre tamamlanması gereken bir taslaktır.\n\nİletişim ve teklif formlarına yazdığınız ad, iletişim bilgileri ve mesajınız, talebinizi değerlendirmek amacıyla uygulamanın veritabanında saklanır. Ziyaretçi analizi yalnızca tercihler alanından izin verirseniz çalışır; bu sürümde üçüncü taraf reklam takip hizmeti kullanılmaz.\n\nMüşteri, personel ve yönetim girişlerinde gerekli oturum çerezleri kullanılır. Hesabınız, talep durumları, yazışmalar ve size sunulan belgeler erişim yetkileriyle saklanır. İzinli ziyaretçi analizi; sayfa yolu, cihaz türü ve etkileşim türlerini kaydeder; form metinlerini veya parola alanlarını kaydetmez. Taleplerinizi sitede yayımlanmış firma iletişim kanallarından iletebilirsiniz. Veri sorumlusu kimliği, saklama süreleri, aktarım koşulları ve başvuru yöntemi şirketin gerçek süreçlerine göre yayın öncesinde tamamlanmalıdır.",
    ],
    [
      "kullanim-kosullari",
      "Kullanım koşulları",
      "Yasal",
      "Bu sitedeki bilgiler genel tanıtım amaçlıdır ve tek başına bir satış teklifi veya sözleşme oluşturmaz.\n\nGörseller temsili olabilir. Nihai ürün özellikleri ve uygulama koşulları projeye özel yazılı teklif ve sözleşmede belirtilir.\n\nSitedeki özgün metin ve tasarımların izinsiz ticari kullanımı uygun değildir. Bu metin yayın öncesi şirketin gerçek faaliyet ve satış süreçlerine göre gözden geçirilmelidir.",
    ],
    [
      "kvkk",
      "Kişisel verilerin korunması",
      "KVKK aydınlatma taslağı",
      "Bu aydınlatma taslağı, gerçek veri sorumlusu bilgileri ve işleme süreçleriyle tamamlanmadan yayımlanmamalıdır.\n\nİletişim formunda ad, iletişim bilgileri ve talep metni toplanır; başvurunun değerlendirilmesi ve sizinle iletişime geçilmesi için uygulamanın veritabanında saklanır. Veri sorumlusu unvanı ve adresi, hukuki sebepler, saklama süreleri, alıcı grupları ve başvuru yöntemi firma tarafından doğrulanıp tamamlanmalıdır.\n\nKişisel verilerinizle ilgili bilgi, düzeltme veya silme taleplerinizi yayımlanmış firma iletişim kanallarına iletebilirsiniz. Bu taslak hukuki danışmanlık yerine geçmez.",
    ],
    [
      "cerez-politikasi",
      "Çerez kullanımı",
      "Yasal",
      "Giriş yaptığınız müşteri, personel veya yönetim hesabını güvenle sürdürmek için gerekli oturum çerezleri kullanılır. Dil ve analiz tercihiniz yerel depolamada tutulabilir.\n\nZiyaretçi analizi başlangıçta kapalıdır. Tercihler alanında izin verdiğinizde bu site, oturum depolamasındaki rastgele kimliği kullanarak genel sayfa ve etkileşim istatistikleri toplar. Hesap ve yönetim sayfaları izlenmez; formda yazdığınız içerik kaydedilmez. Tercihler alanından izninizi geri alabilirsiniz.\n\nBu sürümde üçüncü taraf reklam takip hizmeti kullanılmaz. E-posta, SMS, WhatsApp, harita veya başka hizmetler etkinleştirilirse ilgili veri aktarımı ve saklama koşulları gerçek sağlayıcıya göre açıklanmalıdır. Bu metin yayın öncesinde gerçek hizmetlere ve veri sorumlusuna göre tamamlanmalıdır.",
    ],
  ];
  pages.forEach((p, i) =>
    rows.push({
      type: "page",
      slug: p[0],
      title: p[1],
      subtitle: p[2],
      summary: p[3].split("\n")[0],
      body: p[3],
      image: "/images/hero.svg",
      category: [
        "gizlilik",
        "kullanim-kosullari",
        "kvkk",
        "cerez-politikasi",
      ].includes(p[0])
        ? "Yasal"
        : "Dükkânımız",
      featured: false,
      published: true,
      sortOrder: i,
      specs: [],
      gallery: [],
    }),
  );
  const faqs = [
    [
      "fiyat",
      "Cam balkon fiyatı nasıl belirlenir?",
      "Ölçü, cam ve profil seçimi, açılım tipi ve uygulama koşulları birlikte değerlendirilir. Kesin fiyat yerinde keşif ve teklif sonrasında belirlenir.",
    ],
    [
      "olcu",
      "Ölçü için ne paylaşmalıyım?",
      "Yaklaşık genişlik ve yükseklik, mekânın birkaç fotoğrafı ve uygulama konumu ilk değerlendirme için yararlıdır. Üretim ölçüsü yerinde alınır.",
    ],
    [
      "sure",
      "Uygulama ne kadar sürer?",
      "Teslim ve montaj süresi sistem, sipariş yoğunluğu ve uygulama kapsamına göre değişir. Size özel takvim teklif aşamasında paylaşılır.",
    ],
    [
      "yalitim",
      "Cam balkon tamamen yalıtım sağlar mı?",
      "Yalıtım performansı sistem, cam, profil ve montaj koşullarına bağlıdır. Balkon kapamasını yapının bütününden bağımsız bir oda yalıtımı gibi değerlendirmemek gerekir.",
    ],
    [
      "izin",
      "Uygulama için izin gerekiyor mu?",
      "Bina yönetimi kararları ve yerel mevzuat uygulamaya göre değişebilir. Başlamadan önce ilgili yönetim ve kurumlarla uygunluğu doğrulamanız gerekir.",
    ],
    [
      "bakim",
      "Cam sistemlerinin bakımı nasıl yapılır?",
      "Üreticinin bakım talimatlarını izleyin. Cam ve rayları uygun ürünlerle temizleyin, tahliye noktalarını açık tutun; hareket zorlaşırsa panelleri zorlamadan servis isteyin.",
    ],
    [
      "kesif",
      "Keşif talebini nasıl oluşturabilirim?",
      "İletişim veya teklif formundan talebinizi bırakabilirsiniz. Talebiniz yönetim paneline kaydedilir; iletişim bilgileri tamamlandığında telefon ve WhatsApp kanallarını da kullanabilirsiniz.",
    ],
    [
      "garanti",
      "Garanti koşullarını nereden öğrenebilirim?",
      "Seçtiğiniz ürünün garanti kapsamı ve süresi teklif ve teslim belgelerinde belirtilir. Ayrıntıları sipariş öncesinde yazılı olarak isteyin.",
    ],
  ];
  faqs.forEach((f, i) =>
    rows.push({
      type: "faq",
      slug: f[0],
      title: f[1],
      subtitle: "",
      summary: f[2],
      body: f[2],
      image: "",
      category: "Genel",
      featured: false,
      published: true,
      sortOrder: i,
      specs: [],
      gallery: [],
    }),
  );
  const enProducts = [
    [
      "Folding Glass Balcony",
      "Glass panels that fold and stack to one side.",
      "Glass panels that fold to one side help your balcony adapt to the season and the way you live. Layout, glazing and installation details are specified after a site survey.",
    ],
    [
      "Sliding Glass Systems",
      "Adjustable openings with tracked panels.",
      "Sliding panels make wide openings flexible. Explore opening options for balconies, terraces and commercial spaces, designed around the conditions of your project.",
    ],
    [
      "Insulated Balcony Glazing",
      "Balcony enclosures planned with double glazing.",
      "Double-glazed panel options can extend the way you use your balcony. Glass, profiles and junction details are chosen for your space; final performance depends on the complete installation.",
    ],
    [
      "Vertical Sliding Glass",
      "Vertically moving glass panel options.",
      "Vertically moving glass panels offer a controlled transition between enclosed and open areas. Motors, controls and safety details are specified for each terrace or business.",
    ],
    [
      "Pergola Systems",
      "Shade and drainage planned together.",
      "Plan your terrace or garden with shade, airflow and weather in mind. Structure, covering and drainage are designed around your site conditions.",
    ],
    [
      "Bioclimatic Roof",
      "Daylight control with adjustable roof blades.",
      "Adjustable roof blades help manage sunlight and airflow. Explore motorised options and complementary glazing for a flexible outdoor space.",
    ],
    [
      "Winter Gardens",
      "Roof and side enclosures designed together.",
      "Transparent surfaces and tailored roof options create new possibilities in the garden. Site permissions, foundations, ventilation and drainage are addressed during planning.",
    ],
    [
      "Zip Screens",
      "Outdoor screens with side-guide tracks.",
      "Outdoor screens bring solar control and privacy together. Fabric, colour and motor options are selected for the orientation and requirements of your space.",
    ],
    [
      "Glass Balustrades",
      "Glass guards specified for project safety requirements.",
      "Glass balustrades preserve views on balconies, stairs and terraces. Glass specifications and structural connections must meet the safety requirements of each project.",
    ],
    [
      "Aluminium Joinery",
      "Doors, windows and fixed surfaces considered together.",
      "Plan doors, windows and fixed glass surfaces in harmony with your building. Profiles, glazing and hardware are chosen for the intended use and site conditions.",
    ],
  ];
  rows
    .filter((r) => r.type === "product")
    .forEach((r, i) => {
      const e = enProducts[i];
      Object.assign(r, {
        titleEn: e[0],
        subtitleEn: e[1],
        summaryEn: e[2],
        bodyEn:
          e[2] +
          "\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nVisuals labelled as concepts illustrate design options and do not show completed customer projects. Final products and specifications depend on the selected system.",
      });
    });
  const enProjects = [
    [
      "Room to breathe in the city",
      "Terrace",
      "An illustrative terrace concept combining generous glazed openings with comfortable shade.",
    ],
    [
      "A home connected to the garden",
      "Winter garden",
      "An illustrative winter garden concept bringing daylight into everyday living.",
    ],
    [
      "Big ideas for a compact balcony",
      "Glass balcony",
      "An illustrative concept combining flexible glass panels with simple furniture in a compact space.",
    ],
    [
      "A place for outdoor conversation",
      "Commercial space",
      "An illustrative restaurant terrace concept considering glazing and shading together.",
    ],
    [
      "A corner opening to the view",
      "Glass balcony",
      "An illustrative balcony concept prioritising clear views and everyday ease of use.",
    ],
    [
      "Gather beneath the shade",
      "Pergola",
      "An illustrative pergola concept for dining and relaxing in the garden.",
    ],
  ];
  rows
    .filter((r) => r.type === "project")
    .forEach((r, i) => {
      const e = enProjects[i];
      Object.assign(r, {
        titleEn: e[0],
        subtitleEn: e[1],
        summaryEn: e[2],
        bodyEn:
          e[2] +
          "\n\nThis is a design concept, not a completed client project or customer reference. It illustrates possible uses of a space. Share your dimensions, location and expectations to discuss your own project.",
      });
    });
  const enArticles = [
    [
      "Where to start when choosing balcony glazing",
      "Guide",
      "Think about orientation, daily habits and opening requirements before selecting a system.",
      "Start by deciding how you want to use your balcony. Ventilation, cleaning access and furniture layout influence the opening configuration.\n\nA site survey should also consider the floor, ceiling connections and drainage. Choose glass and profiles as part of a complete system rather than relying on a product name alone.\n\nWhen comparing proposals, ask for a written breakdown of materials, installation, delivery and after-sales support.",
    ],
    [
      "A simple routine for glass care",
      "Care",
      "Correct, regular maintenance helps keep glass systems comfortable to use.",
      "Clean glass with a soft cloth and products recommended by the manufacturer. Abrasive pads and strong chemicals can damage finishes.\n\nRemove dust from tracks and keep drainage points clear. Consult the operating guide for adjustment and maintenance of moving parts.\n\nIf a panel becomes difficult to move, avoid forcing it and arrange an inspection.",
    ],
    [
      "Planning shade for your terrace",
      "Design",
      "Sun direction, shade requirements and seasonal use are useful starting points.",
      "Consider when you use your terrace most. Sun exposure, surrounding buildings and prevailing winds can influence the right shading solution.\n\nPlan structural connections and drainage from the beginning. Motorised products also need a suitable power supply and maintenance access.\n\nLighting and side enclosures are easier to coordinate when considered together.",
    ],
    [
      "From winter garden idea to a considered plan",
      "Living",
      "The right questions help turn an idea into a useful space.",
      "Dining, working and relaxing each create different requirements for a winter garden. Consider the floor, structure, glass and ventilation as a whole.\n\nCheck local permissions and structural conditions with the relevant authorities and qualified professionals. Heating and cooling depend on the complete building, not just the glass.\n\nAfter a site survey, confirm the system, materials and schedule in your written proposal.",
    ],
  ];
  rows
    .filter((r) => r.type === "article")
    .forEach((r, i) => {
      const e = enArticles[i];
      Object.assign(r, {
        titleEn: e[0],
        subtitleEn: e[1],
        summaryEn: e[2],
        bodyEn: e[3],
      });
    });
  const enPages = [
    [
      "From our shop, directly to you.",
      "Our shop in Etimesgut",
      "Kılınç Dekorasyon is a local business operating from one shop in Ankara’s Etimesgut district. Talk directly with us about what you need for your balcony, terrace or business premises.\n\nWe start by understanding the space and the intended use. Approximate dimensions and location support the first discussion; a site survey follows where appropriate. Materials, scope, price and timing are agreed in a written proposal.\n\nUse your account to follow the request, access documents and leave an installation or service message. Each job is assessed on its own conditions. Concept images on this website are not presented as completed customer work.",
    ],
    [
      "Good results begin with considered details.",
      "Our approach to quality",
      "We see material selection, accurate measurement and careful installation as one process.\n\nTechnical specifications, certificates and compliance documents depend on the selected product and supplier. Request relevant documentation during the proposal stage. This website makes no unverified certification or performance claims.",
    ],
    [
      "Together, step by step.",
      "Our process",
      "1. We listen. Tell us about your space, intended use and expectations.\n\n2. We assess the site. Measurements, connection details and installation conditions are established.\n\n3. We confirm the proposal. Systems, materials, pricing and a schedule are provided in writing.\n\n4. We install. Work and final checks follow the agreed plan.\n\n5. We explain care and use. Operating and maintenance guidance is shared at handover.",
    ],
    [
      "Support throughout everyday use.",
      "Warranty and service",
      "Warranty terms, duration and service arrangements depend on the selected product, supplier and contract. Check your written proposal and handover documents for exact conditions.\n\nFor a service enquiry, include your installation address, order reference where available and photographs explaining the issue. No additional warranty is implied by this page.",
    ],
    [
      "Explore our solutions in one place.",
      "Catalogues",
      "Download the current guide to our product families and design approach.\n\nThe catalogue is general information. Exact dimensions, systems, specifications and pricing are confirmed in your project-specific proposal.",
    ],
    [
      "Privacy and personal information",
      "Privacy",
      "This is a draft that must be completed before publication to reflect the actual business and its processing activities.\n\nNames, contact details and messages submitted through enquiry forms are stored in this application database to assess your request. Visitor analytics runs only after you opt in through the preference controls; this release does not use third-party advertising trackers.\n\nEssential session cookies support customer, staff and administrator login. Account information, request progress, messages and private documents are stored with access controls. Consented analytics records page paths, device types and interaction categories, without typed form content or passwords. Data controller identity, retention periods, sharing arrangements and the process for exercising legal rights must be completed before launch.",
    ],
    [
      "Terms of use",
      "Legal",
      "Information on this website is general promotional material and does not itself constitute an offer or contract.\n\nVisuals may be illustrative. Final specifications and installation terms are set out in the project-specific written proposal and contract.\n\nOriginal text and designs should not be reused commercially without permission. Review these terms before publication against the actual business and sales process.",
    ],
    [
      "Protection of personal information",
      "Privacy notice draft",
      "This draft must not be published without the real data controller details and processing arrangements.\n\nThe enquiry form collects your name, contact details and request. These are stored in the application database to assess your enquiry and contact you. The business must verify and complete the controller identity and address, legal bases, retention periods, recipients and request procedure.\n\nYou can use the published business contact channels to ask about your data or request correction or deletion. This draft is not legal advice.",
    ],
    [
      "How cookies are used",
      "Legal",
      "Essential session cookies support customer, staff and administrator accounts. Language and analytics choices may be stored in local storage.\n\nVisitor analytics is off initially. If you opt in through the preference controls, this site uses a random identifier in session storage to collect public-page and interaction statistics. Account and administration pages are excluded, and typed form content is not recorded. You can withdraw consent through the preference controls.\n\nThis release does not use third-party advertising trackers. If email, SMS, WhatsApp, maps or other services are enabled, explain their actual providers, transfers and retention arrangements. Complete this draft for the actual services and data controller before launch.",
    ],
  ];
  rows
    .filter((r) => r.type === "page")
    .forEach((r, i) => {
      const e = enPages[i];
      Object.assign(r, {
        titleEn: e[0],
        subtitleEn: e[1],
        summaryEn: e[2].split("\n")[0],
        bodyEn: e[2],
      });
    });
  const enFaqs = [
    [
      "How is balcony glazing priced?",
      "Dimensions, glazing, profiles, opening configuration and installation conditions are assessed together. Exact pricing follows a site survey and written proposal.",
    ],
    [
      "What should I share for an initial assessment?",
      "Approximate width and height, a few photographs and your location are helpful. Final production measurements are taken on site.",
    ],
    [
      "How long does installation take?",
      "Lead time and installation duration depend on the selected system, workload and scope. Your project schedule is confirmed during the proposal stage.",
    ],
    [
      "Does balcony glazing provide complete insulation?",
      "Performance depends on the complete system, glass, profiles and installation. Balcony enclosure should not be treated as room-level insulation independently of the building.",
    ],
    [
      "Do I need permission?",
      "Building management rules and local requirements can vary. Confirm the relevant approvals before beginning any installation.",
    ],
    [
      "How should glass systems be maintained?",
      "Follow the manufacturer’s instructions. Clean glass and tracks with suitable products, keep drainage clear and ask for service if panels become difficult to move.",
    ],
    [
      "How can I request a survey?",
      "Send a contact or quotation form. Your request is saved in the administration panel. Phone and WhatsApp become available once business contact details are configured.",
    ],
    [
      "Where can I find warranty terms?",
      "Warranty scope and duration are specified in the product proposal and handover documents. Ask for written details before ordering.",
    ],
  ];
  rows
    .filter((r) => r.type === "faq")
    .forEach((r, i) => {
      const e = enFaqs[i];
      Object.assign(r, {
        titleEn: e[0],
        subtitleEn: "",
        summaryEn: e[1],
        bodyEn: e[1],
      });
    });
  const productPlanning = [
    [
      "Panel toplanma yönünü mobilya ve geçiş alanlarıyla birlikte planlayın. Panellerin içe veya dışa hareketi, temizlik erişimi, alt eşik ve tahliye noktaları keşifte netleştirilmelidir. Cam türü ve panel ölçüsü sistem gereksinimlerine göre seçilir.",
      "Plan the stacking direction around furniture and circulation. Confirm panel movement, cleaning access, threshold and drainage during the survey. Glass type and panel size must suit the complete system.",
    ],
    [
      "Ray sayısı ve panel park alanı, elde edilen net açıklığı etkiler. Eşik yüksekliği, temizlik, su tahliyesi ve varsa sineklik/perde uyumu birlikte değerlendirilmelidir. Büyük panellerde taşıma kapasitesi ve donanım seçimi kritik önemdedir.",
      "Track count and panel parking determine the usable opening. Consider threshold height, cleaning, drainage and compatibility with screens or blinds. Larger panels require appropriate hardware and load capacity.",
    ],
    [
      "Çift cam bileşimi, profilin ısı köprüsü detayı, contalar ve çevre birleşimleri birlikte düşünülmelidir. Isıtma beklentisini ve yoğuşma riskini paylaşın. Balkon kapaması tek başına yapının oda seviyesinde yalıtıldığı anlamına gelmez.",
      "Consider double-glazing build-up, profile thermal breaks, seals and perimeter junctions together. Discuss heating expectations and condensation risk. Balcony enclosure alone does not establish room-level insulation.",
    ],
    [
      "Motor ve hareketli panel seçimi; yük, ölçü ve kullanım sıklığına göre yapılır. Sıkışma riski, acil durdurma, enerji kesintisi davranışı ve servis erişimi onaylı sistemin güvenlik dokümanlarıyla birlikte değerlendirilmelidir.",
      "Motors and moving panels are specified for weight, size and operating frequency. Trapping risks, stopping, power-failure behaviour and service access must be assessed with the selected system's safety documentation.",
    ],
    [
      "Sabit ve açılır örtü seçeneklerini güneş yönüyle birlikte karşılaştırın. Taşıyıcı bağlantıları, rüzgâr etkisi, suyun aktarılacağı nokta ve elektrik hazırlığı baştan belirlenmelidir. Çatıya sonradan yük eklemek uzman değerlendirmesi gerektirir.",
      "Compare fixed and retractable coverings with sun orientation. Establish structural fixings, wind exposure, drainage discharge and power preparation early. Adding roof loads later requires professional assessment.",
    ],
    [
      "Kanatların açılım yönü ve hareketi ışık kadar suyun yönlendirilmesini de etkiler. Kar, rüzgâr, enerji kesintisi ve bakım erişimi kullanım senaryosuna göre konuşulmalıdır. Sensör veya otomasyon eklenmesi güvenli kullanım talimatlarını ortadan kaldırmaz.",
      "Blade direction and movement influence light and drainage. Discuss snow, wind, power failure and maintenance access for the intended use. Sensors and automation do not replace safe operating instructions.",
    ],
    [
      "Çatı eğimi, cam yüzeyler, havalandırma, ısıtma ihtiyacı ve zemin yalıtımı birlikte planlanmalıdır. Su tahliyesi ile mevcut binaya birleşim detaylarını netleştirin. Statik uygunluk ve gerekli izinler uygulama başlamadan doğrulanmalıdır.",
      "Plan roof falls, glazing, ventilation, heating and floor insulation together. Confirm drainage and junctions with the existing building. Structural suitability and necessary permissions must be verified before work begins.",
    ],
    [
      "Kumaşın açıklık oranı, renk ve güneş yönü görüş ile mahremiyeti farklı etkiler. Kaset konumu, kılavuz raylar, motor erişimi ve elektrik hattı uygulama alanına göre planlanır. Rüzgârlı koşullarda kullanım sınırlarını ürün kılavuzundan öğrenin.",
      "Fabric openness, colour and orientation affect views and privacy differently. Plan cassette position, guides, motor access and power supply for the site. Follow the product guide for operating limits in windy conditions.",
    ],
    [
      "Cam türü ve bileşimi, bağlantı tipi, kenar detayları ve taşıyıcı zemin güvenlik gereksinimine göre değerlendirilir. Yalnızca cam kalınlığını karşılaştırmak yeterli değildir. Kullanım yükleri ve yapı kuralları yetkin uzmanlarca doğrulanmalıdır.",
      "Glass type and build-up, fixings, edge details and substrate are selected for safety requirements. Comparing thickness alone is insufficient. Qualified professionals must verify loads and applicable building rules.",
    ],
    [
      "Kapı ve pencere açılımı, eşik, kilit ve aksesuarlar kullanım yoğunluğuna göre seçilir. Isı yalıtımlı veya standart profil seçenekleri cam ve çevre birleşimleriyle birlikte değerlendirilir. Donanım, su tahliyesi ve bakım erişimi teklif kapsamına dahil edilmelidir.",
      "Specify door and window openings, thresholds, locks and accessories for daily use. Assess thermally broken or standard profiles with glass and perimeter junctions. Include hardware, drainage and maintenance access in the proposal.",
    ],
  ];
  rows
    .filter((r) => r.type === "product")
    .forEach((r, i) => {
      r.body +=
        "\n\nPlanlamada dikkat edilecekler\n" +
        productPlanning[i][0] +
        "\n\nTeslim kontrolü\nAçılım ve kilitleri uygulayıcıyla birlikte deneyin. Yüzeyleri, tahliye yollarını ve birleşimleri kontrol edin. Kullanım talimatları, teknik kapsam ve servis koşullarını yazılı olarak teslim alın.";
      r.bodyEn +=
        "\n\nPlanning details\n" +
        productPlanning[i][1] +
        "\n\nHandover checks\nOperate panels and locks with the installer. Review surfaces, drainage paths and junctions. Receive written operating instructions, specification and service terms.";
    });
  rows.forEach((r) => {
    r.seoTitle = r.title + " | Kılınç Dekorasyon";
    r.seoDescription = r.summary.slice(0, 300);
    r.imageAlt = r.image ? r.title + " için temsili mimari çizim" : "";
  });
  return [...rows, ...expansionContent()];
}

/** Added once to an existing installation; never overwrite administrator edits. */
export const contentExpansionVersion = "2026-10-detailed-services-v1";
type SeedRow = Omit<Content, "id" | "createdAt" | "updatedAt">;

export function expansionContent(): SeedRow[] {
  const rows: SeedRow[] = [];
  const add = (
    type: string,
    slug: string,
    tr: [string, string, string, string],
    en: [string, string, string, string],
    category: string,
    image: string,
    specs: { label: string; value: string }[] = [],
  ) => {
    rows.push({
      type,
      slug,
      title: tr[0],
      subtitle: tr[1],
      summary: tr[2],
      body: tr[3],
      titleEn: en[0],
      subtitleEn: en[1],
      summaryEn: en[2],
      bodyEn: en[3],
      category,
      image,
      seoTitle: tr[0] + " | Kılınç Dekorasyon",
      seoDescription: tr[2],
      imageAlt: image ? tr[0] + " için temsili mimari çizim" : "",
      specs,
      gallery: image ? [image] : [],
      featured: false,
      published: true,
      sortOrder: 20 + rows.length,
    });
  };

  add(
    "product",
    "aluminyum-giydirme-cephe",
    [
      "Alüminyum Giydirme Cephe",
      "Yapının kimliğini ayrıntılar belirler.",
      "Ofis, ticari yapı ve kurumsal projeler için cam, alüminyum ve birleşim detaylarının birlikte değerlendirildiği cephe çözümleri.",
      "Tasarım yaklaşımı\nCepheyi yalnızca dış görünüş olarak değerlendirmiyoruz. Cam bölünmeleri, taşıyıcı sistem, iç mekân kullanımı, bakım erişimi ve bina kabuğunun sürekliliği birlikte ele alınır. Kapaklı ve yapısal silikonlu sistem seçeneklerinin uygunluğu mimari proje üzerinden incelenir.\n\nProjelendirmede gerekenler\nMevcut mimari çizimler, cephe ölçüleri, kat yükseklikleri, açıklık detayları ve uygulama konumu ilk değerlendirmeyi kolaylaştırır. Statik hesap, rüzgâr yükü ve cam seçimi yetkin proje uzmanları tarafından yapı koşullarına göre doğrulanmalıdır.\n\nMalzeme ve birleşimler\nProfil serisi, yüzey işlemi, cam bileşimi, ankrajlar, ısı köprüleri ve kat arası birleşimler yazılı teknik kapsamda tanımlanır. Su tahliyesi ve hava sızdırmazlık detayları sistem bütünlüğünün parçasıdır. Bir ürün adı tek başına performans belgesi yerine geçmez.\n\nUygulama koordinasyonu\nŞantiye erişimi, iskele veya kaldırma ekipmanı, iş programı ve diğer disiplinlerle birleşimler uygulama öncesinde planlanır. Ölçü onayı ve çizim revizyonları kesinleşmeden üretim programı netleştirilmez.\n\nTeklifte neler bulunmalı?\nMetraj, sistem ve cam tanımı, yüzey rengi, bağlantı kapsamı, nakliye, montaj, test veya belge talepleri ve teslim şartları ayrı ayrı belirtilmelidir. Kesin fiyat ve süre projeye özel değerlendirmeyle belirlenir.",
    ],
    [
      "Aluminium Curtain Walling",
      "A building's identity is shaped by its details.",
      "Coordinated glass, aluminium and connection design for offices, commercial buildings and corporate projects.",
      "Design approach\nA façade is more than its appearance. Glass divisions, structure, interior use, maintenance access and continuity of the building envelope are considered together. Capped and structural-silicone options are assessed against the architectural design.\n\nProject information\nDrawings, façade dimensions, floor heights, opening details and site location support an initial assessment. Qualified specialists must verify structural calculations, wind loads and glazing for the actual building.\n\nMaterials and junctions\nProfile series, finish, glass build-up, anchors, thermal bridges and floor junctions belong in the written scope. Drainage and air-sealing details form part of the complete system; a product name does not establish certified performance.\n\nSite coordination\nAccess, scaffolding or lifting equipment, work sequence and interfaces with other trades are planned before installation. Production dates follow approved dimensions and drawings.\n\nA clear proposal\nRequest measured quantities, system and glass specifications, colour, fixings, transport, installation, requested documentation and handover terms. Pricing and timing are project-specific.",
    ],
    "Alüminyum sistemler",
    "/images/aluminium-facade.svg",
    [
      {
        label: "Sistem seçenekleri",
        value: "Kapaklı / yapısal silikonlu; proje uygunluğuna göre",
      },
      {
        label: "Değerlendirme",
        value: "Mimari çizim, statik gereksinimler ve rüzgâr yükü",
      },
      {
        label: "Cam bileşimi",
        value: "Isıl, akustik ve güvenlik ihtiyacına göre",
      },
      {
        label: "Birleşimler",
        value: "Ankraj, kat arası, su tahliyesi ve yalıtım detayları",
      },
      {
        label: "Belgelendirme",
        value: "Seçilen sistem ve proje şartnamesine göre",
      },
      {
        label: "Fiyatlandırma",
        value: "Metraj ve yazılı teknik kapsam üzerinden",
      },
    ],
  );

  add(
    "product",
    "ofis-cam-aluminyum-bolme",
    [
      "Ofis Cam ve Alüminyum Bölme",
      "Birlikte çalışın. İhtiyaç duyduğunuzda ayrışın.",
      "Toplantı odaları, çalışma alanları ve yönetim ofislerinde gün ışığını koruyan cam bölme ve kapı çözümleri.",
      "Kullanıma göre planlama\nAçık ofis, toplantı odası ve yönetim odası farklı mahremiyet ihtiyaçlarına sahiptir. Bölme konumları; dolaşım, gün ışığı, masa düzeni ve acil çıkış güzergâhlarıyla birlikte değerlendirilir.\n\nCam ve profil seçimi\nTek camlı veya çift camlı düzenler, uygun güvenlik camı ve farklı profil kesitleri proje kapsamında ele alınır. Ses yalıtımı yalnızca cam kalınlığına bağlı değildir; kapı, conta, tavan ve zemin birleşimleri de sonucu etkiler.\n\nMahremiyet seçenekleri\nBuzlu yüzey, uygun film veya jaluzili cam seçenekleri kullanım amacına göre konuşulabilir. Görsel mahremiyet ile akustik mahremiyetin ayrı ihtiyaçlar olduğu unutulmamalıdır.\n\nKapı ve donanım detayları\nAçılır kapı yönü, geçiş genişliği, kilit, kol ve kapatıcı seçimi erişilebilirlik ve günlük yoğunluk düşünülerek planlanır. Kablo geçişleri ve mevcut yangın algılama sistemleri ilgili ekiplerle koordine edilmelidir.\n\nTeslim ve bakım\nCam yüzeyler, bağlantılar ve kapı hareketleri teslimde kontrol edilir. Temizlikte aşındırıcı ürünlerden kaçının; ayar gerektiren donanımları zorlamadan servis talebi oluşturun.",
    ],
    [
      "Office Glass and Aluminium Partitions",
      "Work together. Create space when you need it.",
      "Glass partitions and doors that preserve daylight in meeting rooms, workspaces and private offices.",
      "Plan around use\nOpen workspaces, meeting rooms and private offices need different levels of privacy. Partition locations are considered with circulation, daylight, furniture and escape routes.\n\nGlass and profiles\nSingle or double glazing, suitable safety glass and different profile sections can be assessed. Acoustic performance depends on the whole assembly, including doors, seals, ceiling and floor junctions.\n\nPrivacy\nFrosted finishes, suitable films or integral blinds may be considered. Visual privacy and acoustic privacy are separate requirements.\n\nDoors and hardware\nOpening direction, clear width, locks, handles and closers are planned for accessibility and daily traffic. Coordinate cable routes and existing fire detection with the relevant specialists.\n\nHandover and care\nCheck surfaces, connections and door operation at handover. Avoid abrasive cleaners and arrange a service inspection rather than forcing hardware that needs adjustment.",
    ],
    "Alüminyum sistemler",
    "/images/aluminium-facade.svg",
    [
      { label: "Kullanım", value: "Toplantı odası, ofis ve ticari iç mekân" },
      { label: "Panel", value: "Proje ihtiyacına göre tek / çift cam" },
      { label: "Mahremiyet", value: "Yüzey, film ve jaluzi seçenekleri" },
      { label: "Donanım", value: "Kapı, kilit, kol ve kapatıcı seçimi" },
      {
        label: "Akustik",
        value: "Tüm birleşimlerin birlikte değerlendirilmesi",
      },
      {
        label: "Keşif",
        value: "Yerleşim, tavan, zemin ve geçişlerin incelenmesi",
      },
    ],
  );

  add(
    "product",
    "aluminyum-kupeste-korkuluk",
    [
      "Alüminyum Küpeşte ve Korkuluk",
      "Güvenli bir sınır. Hafif bir görünüm.",
      "Merdiven, balkon ve teraslar için yapıya uygun bağlantı ve dolgu seçenekleriyle planlanan korkuluk çözümleri.",
      "Yapıyla birlikte değerlendirme\nKorkuluk, yalnızca dekoratif bir tamamlayıcı değildir. Kullanım yeri, yük gereksinimleri, düşme yüksekliği ve zeminin taşıma koşulları öncelikle değerlendirilir. Ölçü ve detaylar geçerli yapı kuralları ve uzman proje değerlendirmesi doğrultusunda netleştirilir.\n\nSistem seçenekleri\nAlüminyum dikme ve tutamaklar; cam, düşey eleman veya projeye uygun farklı dolgularla ele alınabilir. Çocuk güvenliği, tırmanmaya elverişli detaylar ve boşluk düzeni tasarım aşamasında incelenmelidir.\n\nBağlantı detayları\nÜstten veya yandan bağlantı seçimi zemine, kenar mesafelerine ve su yalıtımına göre yapılır. Mevcut seramik veya kaplama tek başına taşıyıcı yüzey kabul edilmez. Ankraj sistemi gerçek taşıyıcıya uygun seçilmelidir.\n\nRenk ve yüzey\nEloksal ve boya seçenekleri çevresel koşullar ve bakım beklentisiyle birlikte değerlendirilir. Numune ve renk onayı, farklı yapı elemanlarıyla uyumu netleştirmeye yardımcı olur.\n\nKullanım ve kontrol\nGevşeme, çatlak veya darbe hasarı fark edildiğinde alanın kullanımını güvenli biçimde sınırlandırın ve uzman kontrolü isteyin. Bağlantıları kendiniz sökmeyin ya da korkuluğa sonradan yük eklemeyin.",
    ],
    [
      "Aluminium Handrails and Balustrades",
      "A secure boundary. A light appearance.",
      "Balustrades for stairs, balconies and terraces, planned with suitable fixings and infill options.",
      "Assess the building\nBalustrades are safety elements. Intended use, loads, fall height and substrate condition come first. Dimensions and details must follow applicable building rules and qualified project assessment.\n\nSystem options\nAluminium posts and handrails can be considered with glass, vertical members or other appropriate infills. Child safety, climbable details and openings need attention during design.\n\nConnections\nTop or side fixing depends on the substrate, edge distances and waterproofing. Tiles and surface finishes alone are not structural support; anchors must suit the actual load-bearing material.\n\nFinish\nAnodised and painted finishes are selected for exposure and maintenance requirements. Samples help coordinate colours with other building elements.\n\nInspection\nIf looseness, cracks or impact damage appear, limit access safely and arrange professional inspection. Do not remove connections or add loads yourself.",
    ],
    "Alüminyum sistemler",
    "/images/aluminium-facade.svg",
    [
      { label: "Uygulama", value: "Balkon, merdiven, teras ve sahanlık" },
      { label: "Dolgu", value: "Proje güvenliğine uygun cam / dikey eleman" },
      { label: "Bağlantı", value: "Gerçek taşıyıcı zemine uygun ankraj" },
      { label: "Yüzey", value: "Projeye göre eloksal veya boya seçenekleri" },
      { label: "Ölçülendirme", value: "Yapı ve kullanım koşullarına göre" },
      { label: "Kontrol", value: "Bağlantı, boşluk ve son kullanım kontrolü" },
    ],
  );

  add(
    "product",
    "ferforje-bahce-kapisi-korkuluk",
    [
      "Ferforje Kapı ve Demir Korkuluk",
      "Metal işçiliğini mimarinize uyarlayın.",
      "Bahçe kapısı, pencere korkuluğu ve sınır elemanlarında ölçüye özel metal tasarım ve yüzey koruma seçenekleri.",
      "Tasarımı ihtiyacınız belirler\nSade geometrik çizgilerden klasik ferforje detaylara kadar farklı görünümler değerlendirilebilir. Kapı açılımı, araç veya yaya geçişi, komşu sınırlar ve bakım erişimi tasarımın başlangıç noktasıdır.\n\nMalzeme kapsamı\nProfil kesiti, dolgu elemanları, menteşe, kilit, sabitleme ve varsa otomasyon hazırlığı yazılı kapsamda tanımlanır. Yalnızca metrekare fiyatına bakmak; ağırlık, donanım ve yüzey koruma farklarını görünmez kılabilir.\n\nDış ortam koruması\nMetal yüzey hazırlığı, korozyon koruması ve son kat uygulaması birbiriyle uyumlu seçilmelidir. Uygun çözüm kullanım yeri ve çevresel maruziyete göre belirlenir; hiçbir kaplama düzenli gözlem ihtiyacını ortadan kaldırmaz.\n\nGüvenli kullanım\nOtomasyon varsa sıkışma riskleri, durdurma ve engel algılama gibi güvenlik önlemleri yetkin uygulayıcıyla değerlendirilir. Pencere korkulukları kaçış veya kurtarma ihtiyacını engellememelidir.\n\nTeklif ve teslim\nTasarım çizimi, ölçü, yüzey rengi, donanım, montaj ve nakliye kapsamı onaylanır. Hareketli elemanlar teslimde birlikte denenir; bakım talimatı ve varsa garanti koşulları yazılı olarak istenir.",
    ],
    [
      "Wrought-Iron Gates and Steel Railings",
      "Metalwork shaped around your architecture.",
      "Made-to-measure design and protective finish options for garden gates, window guards and boundaries.",
      "Start with the use\nSimple geometric designs and more traditional decorative details can be explored. Opening direction, pedestrian or vehicle access, boundaries and maintenance access shape the layout.\n\nDefine the specification\nSections, infill, hinges, locks, fixings and any automation preparation belong in the written scope. Price per square metre alone cannot explain differences in weight, hardware and surface protection.\n\nOutdoor protection\nSurface preparation, corrosion protection and topcoats must be compatible. Selection depends on exposure and location; regular inspection is still needed.\n\nSafe operation\nFor automated gates, qualified installers must assess trapping risks, stopping and obstacle detection. Window guards must not compromise required escape or rescue access.\n\nProposal and handover\nApprove drawings, dimensions, colour, hardware, transport and installation. Test moving elements at handover and request written care and warranty terms.",
    ],
    "Demir ve çelik",
    "/images/metal-gate.svg",
    [
      {
        label: "Kapsam",
        value: "Bahçe kapısı, pencere korkuluğu ve sınır elemanları",
      },
      { label: "Tasarım", value: "Geometrik veya dekoratif metal detaylar" },
      {
        label: "Donanım",
        value: "Kullanıma uygun menteşe, kilit ve bağlantılar",
      },
      {
        label: "Yüzey koruma",
        value: "Ortam koşullarına göre projelendirilir",
      },
      {
        label: "Otomasyon",
        value: "Uygunluk ve güvenlik değerlendirmesi sonrası",
      },
      {
        label: "Teklif",
        value: "Ölçü, metal ağırlığı, yüzey ve donanım kapsamıyla",
      },
    ],
  );

  add(
    "product",
    "celik-konstruksiyon-imalati",
    [
      "Çelik Konstrüksiyon",
      "Taşıyıcı fikri, doğru projeyle gerçeğe dönüştürün.",
      "Sundurma, platform ve projeye özel taşıyıcı metal uygulamalarında çizim, bağlantı ve saha koşullarına dayalı planlama.",
      "Önce proje ve güvenlik\nÇelik taşıyıcı uygulamalar, yalnızca ölçüye göre profil birleştirme işi değildir. Kullanım amacı, sabit ve hareketli yükler, deprem etkileri, rüzgâr ve kar yükleri ilgili uzmanların proje değerlendirmesiyle belirlenmelidir.\n\nTeknik kapsam\nÇelik sınıfı, profil kesitleri, kaynak ve cıvata bağlantıları, yüzey koruma sistemi ve montaj toleransları onaylı proje kapsamında tanımlanır. Mevcut yapıya bağlantı varsa yapı uygunluğu ayrıca doğrulanır.\n\nSaha koordinasyonu\nZemin ve temel durumu, kaldırma erişimi, montaj sırası, geçici stabilite ve iş güvenliği planı uygulama hazırlığının parçasıdır. İlgili izinler ve sorumluluk paylaşımı sözleşme öncesinde netleştirilmelidir.\n\nŞeffaf teklif\nMetraj veya tonaj, imalat çizimleri, bağlantı elemanları, koruma katmanları, nakliye ve montaj ayrı kapsamlarla belirtilir. Eksik proje üzerinden verilen ön değerlendirme kesin uygulama teklifi sayılmaz.\n\nTeslim dokümanları\nProje için gerekli kontrol kayıtları, malzeme belgeleri ve varsa bakım talimatları baştan talep edilmelidir. Gereken belge ve testler seçilen sistem ve sözleşme kapsamında teyit edilir.",
    ],
    [
      "Structural Steelwork",
      "Turn a structural idea into a considered project.",
      "Drawing-led planning for canopies, platforms and project-specific metal structures, with attention to connections and site conditions.",
      "Design and safety first\nSteel structures need more than measured sections. Qualified specialists must establish intended use, permanent and imposed loads, earthquake actions, wind and snow loads.\n\nTechnical scope\nSteel grade, sections, welded and bolted connections, protective finishes and installation tolerances belong in the approved design. Connections to an existing building require separate verification.\n\nSite coordination\nGround and foundation conditions, lifting access, installation sequence, temporary stability and a safe work plan are part of preparation. Permissions and responsibilities must be agreed before contracting.\n\nTransparent proposal\nSeparate quantities or tonnage, fabrication drawings, fixings, protection, transport and erection in the scope. An initial assessment based on incomplete drawings is not a final construction proposal.\n\nHandover documents\nSpecify required inspection records, material documents and care instructions from the start. Documentation and testing depend on the project and contract.",
    ],
    "Demir ve çelik",
    "/images/metal-gate.svg",
    [
      {
        label: "Proje",
        value: "Yetkin uzmanlarca doğrulanmış taşıyıcı tasarım",
      },
      {
        label: "Uygulama",
        value: "Sundurma, platform ve özel metal taşıyıcılar",
      },
      { label: "Bağlantı", value: "Projesine uygun kaynak / cıvata detayları" },
      { label: "Yüzey", value: "Çevre ve kullanım şartına göre koruma" },
      { label: "Saha", value: "Erişim, kaldırma ve montaj sırası planlaması" },
      {
        label: "Teklif girdisi",
        value: "Çizimler, konum, metraj ve teknik şartname",
      },
    ],
  );

  add(
    "product",
    "yangin-merdiveni-sistemleri",
    [
      "Yangın Merdiveni Sistemleri",
      "Kaçış güvenliği, projeden başlar.",
      "Yapının kullanımına ve ilgili gerekliliklere göre uzmanlarca değerlendirilmesi gereken çelik kaçış merdiveni projeleri.",
      "Bina özelinde değerlendirme\nYangın merdiveni için tek bir standart ölçü her binaya uygulanamaz. Kullanıcı yükü, yapı yüksekliği, kaçış uzaklığı, kapılar, sahanlıklar ve güvenli boşaltım noktası ilgili mevzuat ve yetkin uzman değerlendirmesiyle ele alınır.\n\nGerekli proje girdileri\nMimari planlar, mevcut kaçış düzeni, yapı konumu, zemin ve bağlantı bilgileri ilk inceleme için gereklidir. İlgili izin, onay ve proje sorumlulukları işin başında netleştirilmelidir.\n\nTaşıyıcı ve detaylar\nTaşıyıcı çelik düzeni, bağlantılar, basamak yüzeyi, korkuluklar ve korozyon koruması onaylı projeyle tanımlanır. Merdivenin bir ürün olarak satın alınması tek başına binanın yangın uygunluğunu sağlamaz.\n\nUygulama koordinasyonu\nMontaj erişimi, bina cephesiyle birleşimler, kapı açılımları ve kullanım sürekliliği planlanır. Kaçış yolunu engelleyen sonradan eklemelerden kaçınılır.\n\nPeriyodik gözlem\nKaçış güzergâhı açık tutulmalı; bağlantı, yüzey ve hareketli kapıların durumu düzenli olarak kontrol edilmelidir. Bu metin yangın projesi veya mevzuat uygunluk belgesi yerine geçmez.",
    ],
    [
      "External Escape Stair Systems",
      "Escape safety begins with the design.",
      "Steel escape stair projects requiring building-specific assessment by qualified professionals under applicable requirements.",
      "Building-specific assessment\nOne standard size cannot suit every building. Occupancy, height, escape distances, doors, landings and a safe discharge point must be assessed under applicable rules by qualified professionals.\n\nDesign information\nPlans, existing escape arrangements, location, foundations and connection details support the initial review. Permissions, approvals and design responsibilities must be established at the start.\n\nStructure and details\nThe approved design defines the steel structure, fixings, tread surface, guards and corrosion protection. Buying a staircase alone does not establish the building's fire compliance.\n\nCoordination\nPlan installation access, façade interfaces, door openings and continuity of use. Avoid later additions that obstruct escape routes.\n\nOngoing observation\nKeep routes clear and inspect connections, surfaces and doors regularly. This information is not a fire design or compliance certificate.",
    ],
    "Demir ve çelik",
    "/images/metal-gate.svg",
    [
      {
        label: "Değerlendirme",
        value: "Bina kullanımı ve kaçış projesine göre",
      },
      {
        label: "Ölçü",
        value: "İlgili mevzuat ve uzman proje değerlendirmesiyle",
      },
      { label: "Kapsam", value: "Taşıyıcı, basamak, sahanlık ve korkuluk" },
      { label: "Yüzey", value: "Kullanım şartlarına uygun koruma sistemi" },
      {
        label: "Ön koşul",
        value: "Gerekli proje, izin ve onayların netleştirilmesi",
      },
      { label: "Kullanım", value: "Kaçış yolunun sürekli açık tutulması" },
    ],
  );

  const guides: [
    string,
    [string, string, string, string],
    [string, string, string, string],
    string,
  ][] = [
    [
      "teklif-karsilastirma-rehberi",
      [
        "Doğru teklifi yalnızca fiyatla karşılaştırmayın",
        "Satın alma rehberi",
        "Cam, alüminyum ve metal uygulamalarında kapsamı görünür kılan bir teklif kontrol listesi.",
        "Aynı ölçü, farklı kapsam\nİki teklif aynı metrekareyi temel alsa bile cam bileşimi, profil serisi, donanım ve montaj kapsamı farklı olabilir. Her iki teklifin aynı ihtiyaç ve çizim üzerinden hazırlandığını kontrol edin.\n\nMalzeme listesini isteyin\nSistem adı, cam özellikleri, renk, kaplama, motor veya kilit gibi donanımlar açıkça yazılmalıdır. Marka belirtiliyorsa kullanılacak seri ve belgenin ilgili ürünle eşleşmesini isteyin.\n\nUygulama kalemlerini görün\nSöküm, moloz, nakliye, kaldırma ekipmanı, elektrik hazırlığı ve su yalıtımı gibi işler kimin kapsamında? Sonradan ek maliyet doğurabilecek işleri sözleşmeden önce ayırın.\n\nTakvim ve teslim\nÖlçü onayı, sipariş, imalat, montaj ve teslim adımlarını netleştirin. İş programını hava koşulları, saha erişimi ve diğer işlerin tamamlanmasıyla birlikte değerlendirin.\n\nÖdeme ve destek\nÖdeme planı, değişiklik talepleri, garanti kapsamı ve servis iletişimini yazılı olarak alın. Fotoğraf ve referansları inceleyin; yalnızca en düşük toplam tutarı seçmek yerine belgelenmiş kapsamı değerlendirin.",
      ],
      [
        "Compare proposals beyond the headline price",
        "Buying guide",
        "A practical checklist for comparing glass, aluminium and metalwork proposals.",
        "The same dimensions can hide different scopes\nGlass build-up, profiles, hardware and installation can differ even when measured area is identical. Check that proposals use the same brief and drawings.\n\nRequest a specification\nAsk for systems, glass, colours, finishes and hardware in writing. Named brands should identify the relevant product series and documentation.\n\nSee the site-work costs\nClarify demolition, waste, transport, lifting, electrical preparation and waterproofing. Identify exclusions before contracting.\n\nPlan the sequence\nAgree measurement approval, ordering, fabrication, installation and handover stages. Consider weather, access and dependencies on other trades.\n\nPayment and support\nRequest payment terms, change procedures, warranty scope and service contacts in writing. Compare documented scope rather than headline totals alone.",
      ],
      "Rehber",
    ],
    [
      "ankara-kis-kosullari-cam-secimi",
      [
        "Ankara'da cam sistemi planlarken kış koşulları",
        "İklim ve kullanım",
        "Soğuk, rüzgâr ve yoğuşma ihtiyacını birlikte değerlendirmek için pratik bir başlangıç.",
        "Kullanım hedefinizi belirleyin\nBalkonu yağıştan korumak, yılın daha uzun bölümünde kullanmak ve sürekli ısıtılan bir odaya dönüştürmek aynı ihtiyaç değildir. Hedefinizi açıkça paylaşmanız doğru sistem karşılaştırmasını sağlar.\n\nSistem bütünlüğüne bakın\nCam kadar profil, conta, birleşimler, zemin ve tavan da ısıl davranışı etkiler. Cam balkon uygulamasını tek başına binanın ısı yalıtımının yerine koymayın.\n\nRüzgâr ve kar yükü\nKat yüksekliği, çevredeki açıklık ve yapının konumu önemlidir. Özellikle çatı ve teras uygulamalarında rüzgâr, kar, su tahliyesi ve taşıyıcı uygunluğu uzmanlarca değerlendirilmelidir.\n\nYoğuşma ve havalandırma\nNemli iç hava soğuk yüzeylerde yoğuşabilir. Hava değişimi, kullanım alışkanlıkları ve ısıtma düzeni birlikte ele alınmalıdır. Havalandırmayı tamamen kesmek konforu artırmak yerine nem sorununa yol açabilir.\n\nKeşifte sorun\nTahliye noktaları, bakım erişimi, açılım yönleri ve mevcut yalıtımın korunması nasıl çözülecek? Kesin teknik performansı seçilen sisteme ait doğrulanabilir dokümanlardan öğrenin.",
      ],
      [
        "Planning glazing for Ankara's winter conditions",
        "Climate and use",
        "Consider cold weather, wind and condensation as part of one practical plan.",
        "Define the goal\nWeather protection, extended seasonal use and a continuously heated room are different requirements. Explain the intended use before comparing systems.\n\nLook at the whole assembly\nProfiles, seals, junctions, floors and roofs affect thermal behaviour as well as glass. Balcony glazing alone does not replace building insulation.\n\nWind and snow\nHeight, exposure and building location matter. Roof and terrace applications need professional assessment of loads, drainage and structural suitability.\n\nCondensation and ventilation\nMoist indoor air can condense on cold surfaces. Air change, daily habits and heating must be considered together. Completely stopping ventilation can create moisture problems.\n\nQuestions for the survey\nDiscuss drainage, maintenance access, opening direction and preservation of existing waterproofing. Request verified technical documents for the chosen system.",
      ],
      "Planlama",
    ],
    [
      "kurumsal-proje-teknik-sartname",
      [
        "Kurumsal projeler için teknik talep dosyası",
        "Mimar ve yükleniciler için",
        "Karşılaştırılabilir teklif ve düzenli saha koordinasyonu için hangi bilgileri paylaşmalısınız?",
        "Kapsamı ayırın\nCephe, doğrama, cam bölme, korkuluk ve çelik imalat kalemlerini ayrı pozlarla tanımlayın. Her pozun yeri, adedi, yaklaşık ölçüsü ve kullanım amacı anlaşılır olmalıdır.\n\nÇizim ve revizyon\nGüncel mimari çizimlerin revizyon tarihini belirtin. Statik hesap, uygulama çizimi ve detay onayının hangi tarafın sorumluluğunda olduğunu baştan yazın. Ön metraj ile kesin üretim ölçüsünü birbirinden ayırın.\n\nPerformans gereksinimleri\nIsıl, akustik, güvenlik, yangın ve yüzey gereksinimlerini proje uzmanınızla belirleyin. Talep edilen belge ve testleri ilgili ürün veya sistemle eşleştirin; doğrulanmamış genel sertifika ifadelerine dayanmayın.\n\nŞantiye koşulları\nTeslim adresi, çalışma saatleri, depolama alanı, vinç/iskele erişimi, elektrik ve saha güvenliği sorumluluklarını paylaşın. Diğer işlerle arayüzler uygulama takviminin önemli girdisidir.\n\nTeklifin kapanışı\nTeknik kapsam, miktarlar, fiyat, ödeme, revizyon süreci ve kabul ölçütleri aynı teklif dosyasında yer almalıdır. Değişikliklerin yazılı kaydı hem işvereni hem uygulayıcıyı korur.",
      ],
      [
        "Prepare a technical brief for corporate projects",
        "For architects and contractors",
        "The information needed for comparable proposals and coordinated site work.",
        "Separate the scope\nList façades, joinery, partitions, balustrades and steelwork as clear items with location, quantity, dimensions and intended use.\n\nDrawings and revisions\nIdentify the current drawing revision. Assign responsibility for structural calculations, shop drawings and approvals. Distinguish preliminary quantities from final fabrication measurements.\n\nPerformance requirements\nAgree thermal, acoustic, safety, fire and finish requirements with your specialists. Match requested documents and tests to the actual product or system.\n\nSite conditions\nShare location, working hours, storage, lifting access, utilities and safety responsibilities. Interfaces with other trades shape the programme.\n\nClose the proposal\nBring scope, quantities, price, payment, change process and acceptance criteria together. Written change records protect both client and installer.",
      ],
      "Uygulama notları",
    ],
    [
      "aluminyum-demir-korkuluk-secimi",
      [
        "Alüminyum, cam veya demir korkuluk?",
        "Malzeme rehberi",
        "Görünüm kadar bağlantı, güvenlik, bakım ve kullanım koşulları da seçimin parçası.",
        "Önce güvenlik gereksinimi\nKorkuluk seçiminde ilk konu renk veya malzeme değil, yapıdaki işlevdir. Kullanım yeri, yük, yükseklik ve kullanıcı profili uzman değerlendirmesiyle birlikte ele alınmalıdır.\n\nAlüminyum sistemler\nFarklı yüzey ve kesit seçenekleri mimariyle uyum kurulmasına yardımcı olur. Bağlantılar, galvanik uyum ve çevresel koşullar değerlendirilmelidir; bakım gereksinimi seçilen yüzeye bağlıdır.\n\nCam dolgular\nŞeffaflık ve manzara isteyen projelerde cam düşünülebilir. Cam türü, bileşimi ve sabitleme şekli güvenlik gereksinimine göre seçilir; yalnızca kalınlık bilgisi yeterli değildir.\n\nDemir ve çelik\nGeometrik veya dekoratif tasarımlara uygundur. Dış ortamda yüzey hazırlığı ve korozyon koruması önem taşır. Ağırlık ve ankraj gereksinimleri gerçek taşıyıcıyla birlikte hesaplanır.\n\nKarar verirken\nNumune, detay çizimi, temizlik/bakım ihtiyacı ve yazılı kapsamı inceleyin. Farklı metallerin bir araya geldiği detaylarda uygun birleşim çözümünü uygulayıcınıza sorun.",
      ],
      [
        "Aluminium, glass or steel balustrades?",
        "Material guide",
        "Appearance, connections, safety, care and exposure all inform the decision.",
        "Start with safety\nThe building function comes before colour or material. Location, loads, height and users require qualified assessment.\n\nAluminium\nDifferent finishes and sections can suit varied architecture. Connections, material compatibility and exposure need consideration; care depends on the finish.\n\nGlass infill\nGlass can preserve views. Type, build-up and fixing must meet the project safety requirements; thickness alone is insufficient.\n\nIron and steel\nThese suit geometric and decorative designs. Outdoor surface preparation and corrosion protection matter. Weight and anchors must be considered with the actual structure.\n\nMake the decision\nReview samples, details, maintenance and written scope. Ask about suitable junctions where different metals meet.",
      ],
      "Rehber",
    ],
    [
      "montaj-oncesi-hazirlik",
      [
        "Montaj gününden önce hazırlanacaklar",
        "Uygulama rehberi",
        "Erişim, eşya koruması ve saha koordinasyonuyla daha düzenli bir uygulama günü planlayın.",
        "Ölçü ve tasarımı kesinleştirin\nRenk, açılım yönü, kapı konumu ve donanım seçimlerini yazılı olarak onaylayın. Mobilya, perde ve klima gibi elemanların hareket alanıyla çakışmadığını kontrol edin.\n\nErişim ve alan\nBina yönetimini bilgilendirin; yükleme, asansör ve çalışma saatlerini netleştirin. Çalışma alanındaki eşyaları kaldırın, korunması gereken yüzeyleri uygulayıcıyla birlikte belirleyin.\n\nHazırlık işleri\nElektrik, taşıyıcı onarımı, su yalıtımı veya yüzey tesviyesi gerekiyorsa sorumlu taraf ve tamamlanma tarihi belirlenmelidir. Mevcut kusurları uygulama öncesinde kayıt altına alın.\n\nGüvenli çalışma\nÇocuklar ve evcil hayvanlar uygulama alanından uzak tutulmalıdır. Kesim, kaldırma ve yüksekte çalışma faaliyetlerinin güvenlik planı yetkin ekiplerin sorumluluğundadır.\n\nTeslim kontrolü\nPanel ve kapıları birlikte deneyin. Bağlantı, tahliye, yüzey durumu ve temizlik kontrolünü yapın; kullanım talimatlarıyla servis ve garanti belgelerini teslim alın.",
      ],
      [
        "Prepare before installation day",
        "Installation guide",
        "Plan access, protection and site coordination for an orderly installation.",
        "Confirm the choices\nApprove colour, opening direction, door locations and hardware in writing. Check clearances around furniture, blinds and equipment.\n\nAccess and space\nInform building management and agree unloading, lift access and working hours. Remove belongings and identify surfaces requiring protection.\n\nPreparation work\nAssign electrical work, structural repairs, waterproofing and levelling to the responsible party with clear dates. Record existing defects before installation.\n\nSafe working\nKeep children and pets away. Qualified teams are responsible for safe cutting, lifting and working at height.\n\nHandover\nOperate panels and doors together. Review connections, drainage, surfaces and cleaning, then receive instructions and service or warranty documents.",
      ],
      "Uygulama",
    ],
    [
      "metal-yuzey-bakimi",
      [
        "Metal ve alüminyum yüzeylerin bakım rehberi",
        "Bakım",
        "Yüzey korumasını ve hareketli donanımı düzenli gözlemle destekleyin.",
        "Ürüne uygun temizleyin\nÜreticinin bakım talimatını temel alın. Yumuşak bez, uygun pH değerinde temizleyici ve temiz su çoğu rutin için başlangıçtır; güçlü asit, alkali ve aşındırıcı malzemeleri onaysız kullanmayın.\n\nBirikintileri uzaklaştırın\nRay, birleşim ve su tahliye noktalarında kir birikmesine izin vermeyin. Temizlikte basınçlı suyu conta ve elektrikli donanıma doğrudan yöneltmeyin.\n\nYüzeyi gözlemleyin\nBoya kabarması, pas başlangıcı, çatlak veya darbe hasarı varsa erken değerlendirme isteyin. Yanlış onarım malzemeleri mevcut yüzeyle uyumsuz olabilir.\n\nHareketli parçalar\nMenteşe ve rulmanlar için yalnızca üreticinin önerdiği bakım malzemelerini kullanın. Zorlanan bir kapı veya paneli kuvvet uygulayarak çalıştırmayın. Elektrikli sistemlerde koruyucu kapakları açmayın.\n\nKayıt tutun\nÜrün bilgisi, uygulama tarihi, garanti belgesi ve servis kayıtlarını bir arada saklayın. Bakım sıklığı kullanım ve çevre koşullarına göre değişir.",
      ],
      [
        "Care for metal and aluminium surfaces",
        "Care",
        "Support protective finishes and moving hardware with regular observation.",
        "Use suitable products\nFollow the manufacturer's instructions. Soft cloths, suitable cleaners and clean water are a starting point; avoid unapproved acids, alkalis and abrasives.\n\nRemove build-up\nKeep tracks, junctions and drains clear. Do not direct pressure washers at seals or electrical equipment.\n\nObserve the finish\nSeek early assessment of blistering paint, corrosion, cracks or impact damage. Incompatible repair products may worsen the finish.\n\nMoving parts\nUse only recommended maintenance products for hinges and rollers. Do not force doors or panels or open protective covers on powered systems.\n\nKeep records\nRetain product details, installation date, warranty and service records. Care intervals depend on use and exposure.",
      ],
      "Bakım",
    ],
  ];
  guides.forEach(([slug, tr, en, category], i) =>
    add(
      "article",
      slug,
      tr,
      en,
      category,
      `/images/article-${(i % 4) + 1}.svg`,
    ),
  );

  add(
    "page",
    "teknik-dokumanlar",
    [
      "Doğru belgeyi, doğru sistem için isteyin",
      "Teknik dokümanlar",
      "Ürün seçimi, çizim onayı, belge ve teslim dosyası için bir dokümantasyon rehberi.",
      "Ürün dokümanları\nTeknik föyler, kullanım talimatları ve uygunluk belgeleri seçilen sistem ve tedarikçiye göre değişir. İhtiyaç duyduğunuz performans değerlerini proje şartnamesiyle birlikte belirtin.\n\nÇizim ve numune onayı\nRenk numunesi, panel bölünmesi, kapı yönü, bağlantı ve birleşim çizimleri üretim öncesi kararların görünür olmasını sağlar. Onay tarihi ve revizyon numarasını kayıt altına alın.\n\nBelge doğrulama\nBelgenin üretici, ürün serisi, test koşulu ve geçerlilik kapsamını inceleyin. Başka bir ürüne ait sonuçları doğrudan kendi projenize uygulamayın. Bu sayfada bağımsız doğrulanmış sertifika veya test raporu sunulmamaktadır.\n\nTeslim dosyası\nSözleşmede tanımlanan teknik belgeler, bakım bilgileri, varsa garanti koşulları ve servis iletişimi teslimde talep edilmelidir. Genel PDF kataloğu, projenize ait teknik şartname yerine geçmez.",
    ],
    [
      "Request the right document for the right system",
      "Technical documents",
      "A guide to product information, drawing approval and handover records.",
      "Product information\nDatasheets, instructions and conformity documents depend on the chosen system and supplier. State required performance alongside the project specification.\n\nDrawing and sample approval\nColour samples, panel divisions, door directions and junction drawings make decisions visible. Record approval dates and revision numbers.\n\nVerify the scope\nCheck the manufacturer, product series, test conditions and applicability. Results for a different product cannot automatically be applied to your project. No independently verified certificates or test reports are presented here.\n\nHandover\nRequest agreed technical records, care instructions, warranty terms and service contacts. A general PDF catalogue is not a project specification.",
    ],
    "Uygulama notları",
    "/images/product-10.svg",
  );

  add(
    "page",
    "kesif-ve-teklif-rehberi",
    [
      "İlk fikirden net bir teklif dosyasına",
      "Keşif ve teklif rehberi",
      "İlk başvuruda hangi bilgileri paylaşacağınızı ve keşifte hangi konuları netleştireceğinizi öğrenin.",
      "1. İhtiyacı anlatın\nHangi alanı, hangi amaçla kullanmak istediğinizi açıklayın. Cam, alüminyum veya metal uygulaması için yaklaşık genişlik, yükseklik ve konum bilgileri ilk görüşmeyi kolaylaştırır.\n\n2. Yerinde koşulları değerlendirin\nÜretim ölçüsü yerinde alınır. Zemin, tavan, mevcut yapı, su tahliyesi, elektrik ve erişim koşulları birlikte incelenir. Gerekli izin veya uzman proje ihtiyacı bu aşamada gündeme alınır.\n\n3. Alternatifleri karşılaştırın\nMalzeme, açılım, renk, donanım ve bakım ihtiyacını bütçenizle birlikte değerlendirin. Kesin performans ve garanti koşullarını ilgili ürün belgelerinden öğrenin.\n\n4. Yazılı kapsamı onaylayın\nMetraj, teknik tanım, dahil ve hariç işler, ödeme ve teslim takvimi netleşmelidir. Üretimden önce çizim ve ölçü onayını verin.\n\n5. Teslimi birlikte kontrol edin\nKullanım deneyimi, yüzeyler, bağlantılar ve bakım bilgileri gözden geçirilir. Sonraki servis başvuruları için teklif ve ürün kayıtlarını saklayın.",
    ],
    [
      "From an initial idea to a clear proposal",
      "Survey and proposal guide",
      "What to share when enquiring and what to clarify during a survey.",
      "1. Explain the need\nDescribe the space and intended use. Approximate dimensions and location help the initial discussion.\n\n2. Review the site\nFinal fabrication dimensions are measured on site. Review structure, drainage, electricity and access, including any permissions or specialist design needs.\n\n3. Compare options\nConsider materials, openings, colours, hardware and care alongside budget. Refer to actual product documents for performance and warranty terms.\n\n4. Approve the scope\nAgree quantities, specifications, inclusions, exclusions, payment and timing. Approve drawings and measurements before fabrication.\n\n5. Check handover\nReview operation, surfaces, fixings and instructions together. Retain the proposal and product records for future service enquiries.",
    ],
    "Uygulama notları",
    "/images/project-3.svg",
  );

  const regions = [
    [
      "etimesgut",
      "Etimesgut",
      "Merkez ve çevre mahalleler",
      "Central and surrounding neighbourhoods",
      "Konut balkonları, giriş kapıları ve yenileme işlerinde bina yönetimi, mevcut yüzeyler ve montaj erişimi ilk değerlendirmede önem taşır.",
      "For residential balconies, entrance gates and refurbishment, building management, existing surfaces and installation access are key starting points.",
    ],
    [
      "baglica",
      "Bağlıca",
      "Villa, bahçe ve teras planlaması",
      "Villas, gardens and terraces",
      "Bahçe ve teras projelerinde kot farkı, çatıya gelen yükler, gölgeleme yönü ve yağış tahliyesi birlikte ele alınmalıdır.",
      "Garden and terrace projects need coordinated assessment of levels, roof loads, sun orientation and drainage.",
    ],
    [
      "eryaman",
      "Eryaman",
      "Balkon ve site yaşamına uygun çözümler",
      "Balconies and residential developments",
      "Site ve apartmanlarda cephe bütünlüğü, panel açılımı, temizlik erişimi ve ortak alan kullanımı planlamanın parçalarıdır.",
      "In residential developments, façade consistency, panel movement, cleaning access and shared-space use all inform planning.",
    ],
    [
      "cayyolu",
      "Çayyolu",
      "Konut ve ticari mekân projeleri",
      "Residential and commercial spaces",
      "Kış bahçesi, ofis bölme ve açık alan düzenlemelerinde kullanım beklentisi, havalandırma ve mimariyle uyum birlikte değerlendirilir.",
      "Winter gardens, office partitions and outdoor spaces should be assessed for intended use, ventilation and architectural fit.",
    ],
    [
      "batikent",
      "Batıkent",
      "Günlük kullanımı kolaylaştıran detaylar",
      "Details for everyday use",
      "Mevcut yapılardaki yenilemelerde taşıyıcı bağlantı, eşik seviyesi, su tahliyesi ve elektrik ihtiyacının önceden incelenmesi yararlıdır.",
      "Refurbishment in existing buildings benefits from early review of structural fixings, thresholds, drainage and electrical requirements.",
    ],
    [
      "incek",
      "İncek",
      "Teras, korkuluk ve bahçe senaryoları",
      "Terrace, balustrade and garden concepts",
      "Açık alanlarda rüzgâr etkisi, kotlar, koruma gerektiren kenarlar ve bakım erişimi sistem seçiminden önce netleştirilmelidir.",
      "For exposed outdoor spaces, assess wind, changes in level, guarded edges and maintenance access before selecting systems.",
    ],
    [
      "ostim-ivedik",
      "OSTİM ve İvedik",
      "İşyeri için cam ve metal işleri",
      "Glazing and metalwork for business premises",
      "Dükkân ve işyerlerindeki cam, kapı, bölme ve metal işleri için kullanım amacı, yaklaşık ölçüler, çalışma saatleri ve uygulama erişimi ilk görüşmede değerlendirilir.",
      "For glazing, doors, partitions and metalwork at business premises, discuss intended use, approximate dimensions, working hours and installation access at the first enquiry.",
    ],
  ];
  regions.forEach(([slug, name, sub, subEn, detail, detailEn], i) =>
    add(
      "region",
      slug,
      [
        `${name} için cam, alüminyum ve metal çözümleri`,
        sub,
        `${name} konumundaki ihtiyacınızı Etimesgut’taki dükkânımıza doğrudan iletin. Keşif ve hizmet uygunluğunu birlikte değerlendirelim.`,
        `${name} konumundaki ihtiyacınızı anlatın\nEtimesgut’taki dükkânımızdan sizinle doğrudan görüşüp yapınızın koşullarını ve kullanım ihtiyacınızı birlikte değerlendiriyoruz. ${detail}\n\nDeğerlendirilebilecek çözümler\nKatlanır veya sürme cam balkon, giyotin cam, alüminyum kapı-pencere, cam bölme, korkuluk ve projeye özel metal uygulamalarını ihtiyacınıza göre konuşabilirsiniz. Kapsam ve uygulanabilirlik keşif ve teknik inceleme sonrasında netleştirilir.\n\nİlk başvuru bilgileri\nMahalle veya yaklaşık konum, uygulama alanı, yaklaşık ölçüler ve hedef takvim ilk değerlendirme için yeterlidir. Tam adres ve özel belgeleri yalnızca gereken aşamada paylaşın.\n\nKeşif ve planlama\nÜretim ölçüsü yerinde doğrulanır. Bağlantı zemini, rüzgâr veya kar etkileri, su tahliyesi, çalışma erişimi ve bina yönetimi koşulları dikkate alınır. Gerekli uzman proje veya izinler ayrıca belirlenir.\n\nTeklifin netleşmesi\nMalzeme, sistem, renk, donanım, montaj kapsamı ve teslim koşulları projenize özel yazılı teklifte yer alır. Bölgesel hizmet ve keşif takvimi başvurunuz değerlendirilirken teyit edilir.`,
      ],
      [
        `Glass, aluminium and metalwork for ${name}`,
        subEn,
        `Contact our Etimesgut shop directly about your needs in ${name}. Survey and service availability are assessed for each enquiry.`,
        `Tell us what you need in ${name}\nYou speak directly with our Etimesgut shop to review the building and the way you want to use the space. ${detailEn}\n\nPossible solutions\nDiscuss folding or sliding balcony glazing, vertical glass, doors, windows, partitions, balustrades and project-specific metalwork. Scope and feasibility follow a survey and technical review.\n\nInitial information\nShare the neighbourhood or approximate location, space type, approximate dimensions and target timing. Provide exact addresses and private documents only when needed.\n\nSurvey and planning\nProduction measurements are verified on site. Review fixings, weather exposure, drainage, access and building management requirements, including any specialist design or permissions.\n\nWritten proposal\nMaterials, systems, colours, hardware, installation and delivery terms are project-specific. Service availability and survey scheduling are confirmed when your enquiry is reviewed.`,
      ],
      "Ankara",
      `/images/project-${(i % 6) + 1}.svg`,
      [
        { label: "Bölge", value: name },
        { label: "Başvuru", value: "Konut ve işyeri uygulaması" },
        { label: "Planlama", value: "Keşif ve teknik değerlendirmeyle" },
      ],
    ),
  );

  const extraFaqs: [string, string, string, string, string, string][] = [
    [
      "metal-fiyatlandirma",
      "Demir doğrama fiyatını hangi kalemler etkiler?",
      "Profil kesiti ve ağırlığı, tasarımın işçilik yoğunluğu, yüzey koruması, donanım, nakliye ve montaj birlikte değerlendirilir. Aynı metrekareye sahip iki ürünün kapsamı farklı olabilir; karşılaştırmayı yazılı teknik liste üzerinden yapın.",
      "How is metalwork priced?",
      "Section sizes, weight, fabrication complexity, protective finishes, hardware, transport and installation affect price. Identical areas can represent different scopes; compare written specifications.",
      "Demir ve çelik",
    ],
    [
      "motorlu-cam-guvenlik",
      "Motorlu cam sisteminde hangi güvenlik detayları sorulmalı?",
      "Hareketli panelin sıkışma riskleri, kumanda, enerji kesintisi durumu, durdurma ve bakım erişimi seçilen sistem kapsamında değerlendirilmelidir. Uygulayıcıdan ilgili kullanım ve güvenlik dokümanlarını isteyin; hareket alanını boş tutun.",
      "What safety details matter for powered glazing?",
      "Assess trapping risks, controls, power failure behaviour, stopping and maintenance access for the actual system. Request operating and safety documents and keep the movement zone clear.",
      "Cam sistemleri",
    ],
    [
      "ofis-akustik",
      "Cam bölme ses yalıtımını tek başına sağlar mı?",
      "Hayır. Cam ve profil kadar kapı, contalar, zemin, tavan ve çevre birleşimleri de ses geçişini etkiler. Akustik hedefinizi projenin bütünü için tanımlayın; doğrulanabilir sistem verilerini talep edin.",
      "Does glass alone provide acoustic privacy?",
      "No. Doors, seals, floors, ceilings and junctions also influence sound transmission. Define an acoustic target for the complete assembly and request verified system information.",
      "Alüminyum sistemler",
    ],
    [
      "cam-korkuluk-secimi",
      "Korkuluk camının kalınlığını kendim seçebilir miyim?",
      "Camın türü, bileşimi, ölçüsü ve sabitleme şekli birlikte değerlendirilmelidir. Güvenli seçim yalnızca kalınlığa göre yapılmaz; kullanım yükü ve yapı koşullarına göre uzman proje değerlendirmesi gerekir.",
      "Can I choose balustrade glass by thickness alone?",
      "No. Glass type, build-up, size and fixing work together. Loads and structural conditions need qualified assessment rather than a thickness-only choice.",
      "Güvenlik",
    ],
    [
      "yangin-merdiveni-proje",
      "Yangın merdiveni siparişi için hangi bilgiler gerekir?",
      "Güncel mimari plan, yapı kullanımı, mevcut kaçış düzeni, bağlantı ve zemin koşulları gereklidir. Ölçüler ve onaylar ilgili uzmanlarca belirlenir; bir merdiven satın almak tek başına bina yangın uygunluğunu sağlamaz.",
      "What information is needed for an escape stair?",
      "Current plans, building use, escape arrangements, connections and ground conditions are needed. Qualified professionals establish dimensions and approvals; purchasing a staircase alone does not establish building compliance.",
      "Demir ve çelik",
    ],
    [
      "santiye-teklif",
      "Keşif öncesinde çizim paylaşmalı mıyım?",
      "İlk görüşme yaklaşık kapsamla başlayabilir. Karşılaştırılabilir ve kesin teklif için güncel çizimler, metraj, teknik şartname, saha konumu ve takvim gerekir. Gizli proje belgeleri için uygun aktarım kanalını önceden belirleyin.",
      "Should I share drawings before a survey?",
      "An initial discussion can use an approximate scope. A firm comparable proposal requires current drawings, quantities, specification, location and timing. Agree a suitable channel before sharing confidential documents.",
      "Uygulama notları",
    ],
    [
      "tahliye-yogusma",
      "Camda oluşan her su izi sızıntı mıdır?",
      "Yoğuşma ile dışarıdan su girişi farklı sorunlardır. Nem, yüzey sıcaklığı ve havalandırma yoğuşmayı etkiler; tahliye ve birleşimler ise su girişinde incelenir. Sorunun zamanı ve konumunu fotoğraflayarak servis değerlendirmesi isteyin.",
      "Does water on glass always mean a leak?",
      "Condensation and external water ingress are different. Humidity, surface temperature and ventilation affect condensation; drains and junctions are inspected for ingress. Record when and where it happens and request assessment.",
      "Bakım",
    ],
    [
      "bolge-kesif",
      "Ankara'da hangi ilçeler için talep bırakabilirim?",
      "Etimesgut, Bağlıca, Eryaman, Çayyolu, Batıkent, İncek ve diğer Ankara bölgeleri için konum belirterek başvurabilirsiniz. Hizmet kapsamı, saha uygunluğu ve keşif takvimi talebiniz değerlendirilirken teyit edilir.",
      "Which Ankara areas can I enquire about?",
      "Enquire for Etimesgut, Bağlıca, Eryaman, Çayyolu, Batıkent, İncek or other Ankara areas with your location. Scope, site suitability and survey availability are confirmed during review.",
      "Bölgeler",
    ],
    [
      "sehir-disi-proje",
      "Ankara dışından talep bırakabilir miyim?",
      "Konum, yaklaşık kapsam ve hedef takvimle talep bırakabilirsiniz. Nakliye, konaklama, saha erişimi ve montaj organizasyonu değerlendirilmeden hizmet taahhüdü veya kesin takvim verilmez.",
      "Can I enquire from outside Ankara?",
      "Submit location, scope, specifications and timing. Transport, accommodation, access and installation arrangements must be assessed before confirming service or dates.",
      "Uygulama notları",
    ],
    [
      "elektrik-hazirlik",
      "Motorlu sistemin elektrik hazırlığını kim yapar?",
      "Enerji hattı, koruma ve bağlantı işleri yetkin elektrik uzmanı tarafından planlanmalıdır. Teklifte elektrik hazırlığı ve bağlantının kimin sorumluluğunda olduğunu netleştirin; ürünün koruyucu parçalarını açmayın.",
      "Who prepares the power supply for motorised systems?",
      "Qualified electrical professionals should plan the supply, protection and connection. Clarify responsibility in the proposal and do not open protective covers.",
      "Güvenlik",
    ],
    [
      "renk-numune",
      "Renkleri ekrandan seçmek yeterli mi?",
      "Ekran, ışık ve malzeme yüzeyi algılanan rengi değiştirebilir. Mümkünse fiziksel numune üzerinden renk ve yüzey onayı verin; siparişte renk kodunu ve kaplama türünü yazılı belirtin.",
      "Is selecting colour on screen enough?",
      "Screens, lighting and material surfaces can change perceived colour. Approve a physical sample where possible and specify the colour code and finish in writing.",
      "Planlama",
    ],
    [
      "servis-bilgileri",
      "Servis talebimi daha hızlı değerlendirmek için ne paylaşmalıyım?",
      "Uygulama veya sipariş kaydı, ürün türü, sorunun kısa açıklaması ve güvenli mesafeden çekilmiş fotoğraflar yardımcı olur. Kırık cam, gevşek korkuluk veya elektrik sorunu varsa sistemi kullanmayı durdurup uzman desteği isteyin.",
      "What should I include in a service enquiry?",
      "Include the installation or order reference, product type, a short description and photographs taken safely. Stop use and seek professional help for broken glass, loose guards or electrical issues.",
      "Bakım",
    ],
  ];
  extraFaqs.forEach(([slug, q, a, qEn, aEn, category]) =>
    add("faq", slug, [q, "", a, a], [qEn, "", aEn, aEn], category, ""),
  );
  return rows;
}
