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
}
export const defaultSettings = {
  logoText: "KILINÇ",
  companyName: "Kılınç Dekarasyon",
  tagline: "Mekânınıza yeni bir bakış.",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  workingHours: "",
  instagram: "",
  facebook: "",
  youtube: "",
  linkedin: "",
  heroImage: "/images/hero.svg",
  heroEyebrow: "CAMIN ÖTESİNDE BİR YAŞAM",
  heroTitle: "Dışarıyla iç içe.\nSize ait bir alan.",
  heroSubtitle:
    "Cam balkon, sürme cam ve açık alan çözümleriyle yaşam alanınızın potansiyelini keşfedin.",
  heroTitleEn: "Closer to the outdoors.\nA space of your own.",
  heroSubtitleEn:
    "Discover the potential of your space with glazing, sliding glass and outdoor living solutions.",
  heroEyebrowEn: "LIFE BEYOND THE GLASS",
  aboutTextEn:
    "At Kılınç Dekarasyon, we believe every space has its own story. From balconies to terraces, we plan glass and shading solutions around the way you live.",
  aboutText:
    "Kılınç Dekarasyon olarak her mekânın kendine özgü bir hikâyesi olduğuna inanıyoruz. Balkonlardan teraslara, yaşam alanınıza uygun cam ve gölgelendirme çözümlerini birlikte tasarlıyoruz.",
  serviceAreas: "",
  languages: ["tr", "en"],
  seoTitle: "Kılınç Dekarasyon | Cam Balkon ve Açık Alan Çözümleri",
  seoDescription:
    "Mekânınıza uygun cam balkon, sürme cam, giyotin cam, pergola ve kış bahçesi çözümleri. Kılınç Dekarasyon ile projenizi birlikte planlayın.",
};
const products = [
  [
    "katlanir-cam-balkon",
    "Katlanır Cam Balkon",
    "Açıldığında özgürlük, kapandığında konfor.",
    "Cam balkon",
    "Bir yana toplanabilen cam panellerle balkonunuzu mevsime ve kullanımınıza göre dönüştürün. Görüşü kesmeyen bir yaklaşım, günlük yaşamınıza daha fazla alan kazandırsın.",
    "Panel düzeni|Mekâna göre projelendirilir;Cam seçimi|Ölçü ve kullanım koşullarına göre;Açılım|Katlanır panel sistemi",
  ],
  [
    "surme-cam-sistemleri",
    "Sürme Cam Sistemleri",
    "Manzaraya kesintisiz bir geçiş.",
    "Cam balkon",
    "Ray üzerinde hareket eden cam paneller, geniş açıklıkları esnek biçimde kullanmanıza yardımcı olur. Balkon, teras ve ticari mekânlarda ihtiyaca uygun açılım seçenekleri birlikte değerlendirilir.",
    "Açılım|Yatay sürme;Kullanım|Balkon ve teras;Projelendirme|Yerinde ölçüye özel",
  ],
  [
    "isi-yalitimli-cam-balkon",
    "Isı Yalıtımlı Cam Balkon",
    "Mevsimler değişir, yaşam devam eder.",
    "Cam balkon",
    "Isıcamlı panel seçenekleriyle balkonunuzu daha uzun süre kullanabileceğiniz bir alana dönüştürün. Cam, profil ve birleşim detayları mekânınızın koşullarına uygun olarak belirlenir.",
    "Cam|Çift cam seçenekleri;Profil|Projeye uygun alüminyum;Uygulama|Yerinde keşif sonrası",
  ],
  [
    "giyotin-cam",
    "Giyotin Cam",
    "Tek dokunuşla yeni bir perspektif.",
    "Hareketli cam",
    "Düşey hareket eden cam panellerle açık ve kapalı alan arasında kontrollü bir geçiş oluşturun. Teras ve işletmeler için motor, kumanda ve güvenlik detayları proje kapsamında değerlendirilir.",
    "Hareket|Düşey panel hareketi;Kontrol|Motor ve kumanda seçeneği;Kullanım|Teras ve işletmeler",
  ],
  [
    "pergola-sistemleri",
    "Pergola Sistemleri",
    "Gökyüzünün altında, kendi konforunuzda.",
    "Gölgelendirme",
    "Teras ve bahçelerinizi gölge, hava akışı ve yağış koşullarıyla birlikte düşünerek planlıyoruz. Taşıyıcı, örtü ve drenaj çözümleri uygulama alanınıza göre tasarlanır.",
    "Tasarım|Ölçüye özel;Seçenekler|Aydınlatma ve yan kapama;Planlama|Rüzgâr ve drenaj değerlendirmesi",
  ],
  [
    "biyoklimatik-tavan",
    "Biyoklimatik Tavan",
    "Işığı ve gölgeyi siz belirleyin.",
    "Gölgelendirme",
    "Hareketli tavan kanatlarıyla ışık ve hava akışını kullanım ihtiyacınıza göre düzenleyin. Açık alanınızda günün farklı saatlerine uyum sağlayan esnek bir yaşam kurgulayın.",
    "Tavan|Hareketli kanatlar;Kontrol|Motorlu seçenekler;Tamamlama|Cam kapama ile birlikte planlanabilir",
  ],
  [
    "kis-bahcesi",
    "Kış Bahçesi",
    "Bahçenin bir parçası, evinizin devamı.",
    "Yaşam alanları",
    "Şeffaf yüzeyler ve mekâna özel çatı seçenekleriyle bahçenize yeni bir kullanım alanı ekleyin. İzin, zemin, havalandırma ve su tahliyesi gibi konular keşif aşamasında birlikte ele alınır.",
    "Kapsam|Çatı ve yan kapama;Tasarım|Mekâna özel;Detaylar|Havalandırma ve drenaj",
  ],
  [
    "zip-perde",
    "Zip Perde",
    "Gölgenin en sade hâli.",
    "Gölgelendirme",
    "Dış mekân kullanımına uygun perde seçenekleriyle güneş kontrolü ve mahremiyeti birlikte düşünün. Kumaş, renk ve motor seçenekleri alanınızın yönüne ve ihtiyaçlarına göre seçilir.",
    "Kullanım|Dış mekân güneş kontrolü;Kontrol|Motorlu seçenekler;Seçim|Kumaş ve renk alternatifleri",
  ],
  [
    "cam-korkuluk",
    "Cam Korkuluk",
    "Mekânı çerçeveler, manzarayı serbest bırakır.",
    "Mimari çözümler",
    "Balkon, merdiven ve teraslarda görüşü koruyan cam korkuluk çözümleri. Taşıyıcı sistem ve cam özellikleri yapı koşulları ve ilgili güvenlik gereklilikleri dikkate alınarak projelendirilir.",
    "Uygulama|Balkon, teras ve merdiven;Cam|Proje güvenlik gerekliliklerine göre;Bağlantı|Zemine ve yapıya uygun",
  ],
  [
    "aluminyum-dograma",
    "Alüminyum Doğrama",
    "İnce detaylar, bütünlüklü bir mimari.",
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
      "\n\nHer uygulama yerinde keşif ve ölçülendirmeyle başlar. Açılım yönleri, malzeme seçenekleri ve montaj detayları size özel teklif kapsamında netleştirilir.\n\nGörseller tasarım fikrini anlatan özgün temsili çizimlerdir. Nihai ürün ve teknik özellikler seçilen sisteme göre değişir.",
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
      "Mekânınıza yeni bir bakış.",
      "Hakkımızda",
      "Kılınç Dekarasyon olarak balkon, teras ve bahçelerin günlük yaşamın daha çok parçası olmasını istiyoruz. Cam kapama, gölgelendirme ve mimari tamamlayıcıları mekânınızın ihtiyacına göre birlikte ele alıyoruz.\n\nSürecimiz sizi dinlemekle başlar. Kullanım amacınızı ve beklentinizi öğrenir; keşif, ölçülendirme ve teklif aşamalarında seçenekleri açıkça paylaşırız.\n\nHer projenin kendi koşulları vardır. Malzeme, uygulama ve takvim ayrıntılarını projenize özel netleştirerek ilerleriz.",
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
      "is-ortakligi",
      "Birlikte daha iyi mekânlar.",
      "İş ortaklığı",
      "Mimar, uygulayıcı veya çözüm ortağı olarak birlikte çalışmak isterseniz iletişim formunu kullanabilirsiniz.\n\nFaaliyet bölgenizi, uzmanlığınızı ve iş birliği beklentinizi kısaca paylaşın. Başvurular kayıt altına alınır; değerlendirme sonrasında iletişim bilgileriniz üzerinden dönüş yapılabilir.",
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
      "Bu metin yayın öncesi firma ve veri işleme süreçlerine göre tamamlanması gereken bir taslaktır.\n\nİletişim ve teklif formlarına yazdığınız ad, iletişim bilgileri ve mesajınız, talebinizi değerlendirmek amacıyla uygulamanın veritabanında saklanır. Bu site varsayılan olarak reklam veya ziyaretçi analiz hizmeti yüklemez.\n\nYönetim paneli oturumunun çalışması için gerekli oturum çerezi kullanılır. Taleplerinizi sitede yayımlanmış firma iletişim kanallarından iletebilirsiniz. Veri sorumlusu kimliği, saklama süreleri, aktarım koşulları ve başvuru yöntemi şirketin gerçek süreçlerine göre yayın öncesinde tamamlanmalıdır.",
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
      "Bu site varsayılan olarak reklam, analiz veya üçüncü taraf takip çerezi kullanmaz.\n\nYönetim panelinde oturum açıldığında güvenli girişin sürdürülmesi için gerekli oturum çerezi oluşturulur. Dil tercihi tarayıcının yerel depolamasında tutulabilir.\n\nHarita, video, analiz veya başka üçüncü taraf hizmetleri sonradan eklenirse bu politika ve gerekli izin mekanizmaları güncellenmelidir.",
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
      category: i < 6 ? "Kurumsal" : "Yasal",
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
      "Open to freedom. Closed for comfort.",
      "Glass panels that fold to one side help your balcony adapt to the season and the way you live. Layout, glazing and installation details are specified after a site survey.",
    ],
    [
      "Sliding Glass Systems",
      "A seamless connection to the view.",
      "Sliding panels make wide openings flexible. Explore opening options for balconies, terraces and commercial spaces, designed around the conditions of your project.",
    ],
    [
      "Insulated Balcony Glazing",
      "Seasons change. Life goes on.",
      "Double-glazed panel options can extend the way you use your balcony. Glass, profiles and junction details are chosen for your space; final performance depends on the complete installation.",
    ],
    [
      "Vertical Sliding Glass",
      "A new perspective at a touch.",
      "Vertically moving glass panels offer a controlled transition between enclosed and open areas. Motors, controls and safety details are specified for each terrace or business.",
    ],
    [
      "Pergola Systems",
      "Outdoor living, on your terms.",
      "Plan your terrace or garden with shade, airflow and weather in mind. Structure, covering and drainage are designed around your site conditions.",
    ],
    [
      "Bioclimatic Roof",
      "Make room for light and shade.",
      "Adjustable roof blades help manage sunlight and airflow. Explore motorised options and complementary glazing for a flexible outdoor space.",
    ],
    [
      "Winter Gardens",
      "Part of the garden. An extension of home.",
      "Transparent surfaces and tailored roof options create new possibilities in the garden. Site permissions, foundations, ventilation and drainage are addressed during planning.",
    ],
    [
      "Zip Screens",
      "The simplest form of shade.",
      "Outdoor screens bring solar control and privacy together. Fabric, colour and motor options are selected for the orientation and requirements of your space.",
    ],
    [
      "Glass Balustrades",
      "Frame the space. Free the view.",
      "Glass balustrades preserve views on balconies, stairs and terraces. Glass specifications and structural connections must meet the safety requirements of each project.",
    ],
    [
      "Aluminium Joinery",
      "Considered details. Coherent architecture.",
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
          "\n\nEvery project starts with a site survey and accurate measurements. Opening direction, material options and installation details are confirmed in your written proposal.\n\nAll visuals are original illustrative design concepts. Final products and specifications depend on the selected system.",
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
      "A new perspective for your space.",
      "About us",
      "At Kılınç Dekarasyon, we want balconies, terraces and gardens to become a greater part of daily life. We consider glazing, shading and architectural details around the needs of your space.\n\nOur process starts with listening. We discuss how you want to use the area, then explain the options during survey, measurement and proposal stages.\n\nEvery project has its own conditions. We agree the materials, scope and schedule for your specific project.",
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
      "Better spaces, together.",
      "Partnerships",
      "Architects, installers and potential partners can contact us through the enquiry form.\n\nInclude your area, specialism and what you would like to achieve together. Enquiries are saved for review and follow-up using your contact details.",
    ],
    [
      "Explore our solutions in one place.",
      "Catalogues",
      "Download the current guide to our product families and design approach.\n\nThe catalogue is general information. Exact dimensions, systems, specifications and pricing are confirmed in your project-specific proposal.",
    ],
    [
      "Privacy and personal information",
      "Privacy",
      "This is a draft that must be completed before publication to reflect the actual business and its processing activities.\n\nNames, contact details and messages submitted through enquiry forms are stored in this application database to assess your request. No advertising or visitor analytics services load by default.\n\nAn essential session cookie supports administrator login. Data controller identity, retention periods, sharing arrangements and the process for exercising legal rights must be completed before launch.",
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
      "This website does not use advertising, analytics or third-party tracking cookies by default.\n\nSigning in to the administration area creates an essential session cookie. A language preference may be stored in browser local storage.\n\nIf maps, videos, analytics or other third-party services are added later, update this policy and any required consent controls.",
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
  return rows;
}
