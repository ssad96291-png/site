import { CircleHelp, ChevronDown } from "lucide-react";
import "./admin-help.css";

type Help = { title: string; intro: string; steps: string[]; note?: string };
const help: Record<string, Help> = {
  dashboard: {
    title: "Güne nereden başlayayım?",
    intro:
      "Özet ekrandan yeni işleri görün, ardından ilgili yönetim alanına geçin.",
    steps: [
      "Yeni talepleri ve bekleyen müşteri dönüşlerini kontrol edin.",
      "Fiyat / proje başvuruları için Proje & fiyat talepleri alanını açın.",
      "İşin ilerleyişini Talep süreci, hesap sorunlarını Destek merkezi üzerinden yönetin.",
    ],
  },
  customers: {
    title: "Müşterinin hesabını nasıl yönetirim?",
    intro: "Üyeler ve hesapsız başvuruların müşteri kayıtları burada toplanır.",
    steps: [
      "Ad, e-posta veya telefonla arayıp müşteriyi seçin.",
      "Profilini ve bağlı taleplerini inceleyin; mesaj, dosya, teklif ve destek geçmişine geçin.",
      "Hesap sorunu varsa bilgiyi düzeltin, oturumları kapatın veya tek kullanımlık kurtarma bağlantısı oluşturun.",
    ],
    note: "Kurtarma bağlantısını yalnızca kimliğini doğruladığınız müşteriye güvenli kanaldan iletin. Hesabı dondurmak verileri silmez.",
  },
  support: {
    title: "Hesap ve destek sorununu nasıl çözerim?",
    intro: "Müşterinin yazdığı sorunları kaybetmeden takip edin.",
    steps: [
      "Açık kaydı seçip müşterinin açıklamasını ve ilgili talebi inceleyin.",
      "Müşteriye yanıt yazın; ekip içi notu ayrı seçenekle kaydedin.",
      "Önceliği ve durumu güncelleyin; çözüm netleştiğinde kaydı çözüldü olarak işaretleyin.",
    ],
    note: "Ekip içi not müşteriye gösterilmez. Parola, veri anahtarı veya gereksiz kişisel bilgi istemeyin.",
  },
  pipeline: {
    title: "Talebin aşamasını nasıl ilerletirim?",
    intro: "Keşiften teslimata kadar müşteriyle aynı süreç kaydını kullanın.",
    steps: [
      "Talebi seçip ürün, adres ve mevcut aşamayı kontrol edin.",
      "Gerekli teknik kişiyi, keşif randevusunu veya belgeyi ekleyin.",
      "Gerçekleşen işe göre aşamayı güncelleyin; müşteriye kısa açıklama yazın.",
    ],
    note: "Aşamayı değiştirmek işin fiziksel olarak tamamlandığı anlamına gelir; planlanan işi tamamlanmış göstermeyin.",
  },
  projectRequests: {
    title: "Dosyadan fiyat teklifine nasıl geçerim?",
    intro:
      "Başvuruyu inceleyin, taslak hazırlayın ve hazır olduğunda yayımlayın.",
    steps: [
      "Başvuruyu açın; ihtiyaç, ek dosyalar ve aranma tercihini kontrol edin.",
      "İş kalemlerini, miktarları, birim fiyatları ve KDV oranını girip taslağı kaydedin.",
      "Teklifi kontrol ederek yayımlayın. Değişiklik gerekirse yeni revizyon açın.",
    ],
    note: "Taslak müşteriye görünmez. E-posta taslağını indirmek e-posta göndermez; telefonla dönüş için müşterinin aranma tercihini kontrol edin.",
  },
  teams: {
    title: "Teknik irtibatı nasıl tanımlarım?",
    intro:
      "Dükkânınızla çalışan teknik kişilerin doğru iletişim bilgisini kaydedin.",
    steps: [
      "Teknik kişi veya ekip kaydına ad ve güncel iletişim bilgilerini ekleyin.",
      "Kullanılmayan irtibatı pasife alın; mevcut geçmişi koruyun.",
      "İlgili talebi açıp uygun teknik irtibatı açıkça atayın.",
    ],
    note: "Teknik irtibat kaydı tek başına panele giriş hesabı oluşturmaz; giriş yetkisini Personel alanından yönetin.",
  },
  staff: {
    title: "Personele nasıl yetki veririm?",
    intro:
      "Herkese yaptığı iş kadar erişim verin; hesapları ortak kullanmayın.",
    steps: [
      "Personel için ayrı kullanıcı adı ve güçlü başlangıç parolası belirleyin.",
      "İçerik editörü, operasyon sorumlusu veya teknik personel rolünü seçin; kapsamını kontrol edin.",
      "İşten ayrılma veya hesap sorunu halinde hesabı pasife alıp açık oturumlarını kapatın.",
    ],
    note: "Müşterinin özel bilgilerini yalnızca görevi gerektiren personele açın. Başlangıç parolasını güvenli kanaldan paylaşın.",
  },
  notifications: {
    title: "Bildirim neden bekliyor?",
    intro: "Panel bildirimleri ile dış mesaj gönderimleri farklı kayıtlardır.",
    steps: [
      "Bildirimin hangi talep veya müşteriyle ilişkili olduğunu açın.",
      "Dış mesaj kuyruğunda bekleme ya da hata açıklamasını okuyun.",
      "Sağlayıcı ayarını veya sorunu düzelttikten sonra uygun kaydı yeniden deneyin.",
    ],
    note: "Bağlantı bekliyor durumu sağlayıcının kurulmadığını gösterebilir. Sağlayıcının kabul yanıtı mesajın okunduğu anlamına gelmez.",
  },
  settings: {
    title: "Sitedeki bilgileri nasıl değiştiririm?",
    intro:
      "Firma metinleri, iletişim bilgileri ve görünür alanları bu bölümden ayarlayın.",
    steps: [
      "İlgili ayar grubunu açıp gerçek firma bilgilerini ve TR / EN metinlerini girin.",
      "Değişikliği kaydedin; görünür bölüm seçeneklerini ihtiyacınıza göre düzenleyin.",
      "Siteyi yeni sekmede açarak metni, bağlantıları ve mobil görünümü kontrol edin.",
    ],
    note: "Alan adı ve dış bildirim sağlayıcısının gizli anahtarları sunucu ortamında tanımlanır; açıklama alanlarına parola veya token yazmayın.",
  },
  content: {
    title: "İçeriği nasıl hazırlayıp yayımlarım?",
    intro:
      "Önce taslakla çalışın, metin ve görseller hazır olduğunda yayımlayın.",
    steps: [
      "Yeni kayıt oluşturun veya mevcut kaydı açın; başlık, açıklama ve ayrıntıları doldurun.",
      "İzinli görseli, teknik bilgileri ve gerekiyorsa İngilizce metinleri ekleyin.",
      "Yayın durumunu ve sırasını ayarlayıp kaydedin; sitedeki sayfasını kontrol edin.",
    ],
    note: "Yayından kaldırmak kaydı silmez. Gerçek müşteri işi olmayan konsept görselleri uygulama referansı gibi sunmayın.",
  },
  inquiries: {
    title: "Gelen talebi nasıl takip ederim?",
    intro:
      "İlk iletişim ve takip notlarını kaydederek aynı işi iki kez yapmayın.",
    steps: [
      "Yeni talebi açıp müşteri ihtiyacını ve iletişim bilgisini okuyun.",
      "Görüşme sonrası durumu, önceliği ve takip tarihini güncelleyin.",
      "Ayrıntılı aşama takibi için Talep süreci, fiyatlandırma için Proje & fiyat talepleri alanını kullanın.",
    ],
  },
  media: {
    title: "Görseli nasıl güvenle eklerim?",
    intro:
      "Genel sitede kullanılacak görseller müşteri belgelerinden ayrı tutulur.",
    steps: [
      "Desteklenen görseli seçin; dosya boyutunu ve görüntüsünü kontrol edin.",
      "Kaynak, hak sahibi ve kullanım izni kaydını doğru bilgilerle tamamlayın.",
      "Görseli içeriğe bağlayıp sayfayı kontrol edin; kullanılmayan görseli ancak bağı yoksa kaldırın.",
    ],
    note: "Müşterinin özel çizimini veya kişisel belgesini genel medya kütüphanesine yüklemeyin.",
  },
  activity: {
    title: "Değişikliği kimin yaptığını nasıl bulurum?",
    intro: "İşlem geçmişi, paneldeki önemli yönetim değişikliklerini gösterir.",
    steps: [
      "İşlemin tarihini, kullanıcı adını ve kayıt türünü inceleyin.",
      "İlgili müşteri veya içerik ekranını açıp güncel kaydı karşılaştırın.",
      "Tekrarlanan erişim hataları için Veri & güvenlik merkezindeki olay kayıtlarına bakın.",
    ],
    note: "İşlem geçmişi bir geri alma düğmesi değildir. Büyük değişikliklerden önce şifreli yedek alın.",
  },
  security: {
    title: "Hesap güvenliğini nasıl yönetirim?",
    intro: "Kendi parolanızı ve açık oturumlarınızı kontrol edin.",
    steps: [
      "Yalnızca bu sitede kullandığınız güçlü bir parola belirleyin.",
      "Şüpheli kullanımda parolayı değiştirip diğer oturumları kapatın.",
      "Veri şifreleme, dosya tarama ve yedek durumunu Veri & güvenlik merkezinden inceleyin.",
    ],
    note: "Parola değişiminden sonra yeniden giriş gerekir. Gerçek parolanızı veya kurtarma bağlantınızı destek mesajına yazmayın.",
  },
  system: {
    title: "Yedek ve veri aktarımını nasıl yaparım?",
    intro:
      "Veriyi taşımak için şifreli yedek ile ayrı veri anahtarına ihtiyacınız olur.",
    steps: [
      "Veri tabanı ve dosya tarama durumunu kontrol edin.",
      "Yönetici parolanızla şifreli yedeği indirin; veri anahtarını ayrı güvenli yerde saklayın.",
      "Taşıma sırasında yedeği yeni, boş veri klasörüne geri yükleyip kayıt ve dosyaları doğrulayın.",
    ],
    note: "Yedeği indirmek otomatik bir yedekleme takvimi kurmaz. Düzenli kopyalar alın; aynı veri klasörünü iki sunucuyla açmayın.",
  },
  live: {
    title: "Canlı raporu nasıl yorumlarım?",
    intro:
      "Bu ekran yalnızca analitik izni veren ziyaretçilerin sınırlı olaylarını gösterir.",
    steps: [
      "Canlı ziyaretçi sayısını ve son sayfa hareketlerini inceleyin.",
      "En çok görülen sistemlerle gerçek talepleri birlikte değerlendirin.",
      "Olay türü filtresiyle belge veya form hareketlerini daraltın.",
    ],
    note: "Çevrimiçi sayısı tüm ziyaretçileri kapsamaz. IP bilgisi maskelidir; bu veriden kesin kişi veya adres sonucu çıkarmayın.",
  },
};

export default function AdminHelp({ section }: { section: string }) {
  const info = help[section] || help.content;
  return (
    <details className="ah-root" key={section}>
      <summary>
        <CircleHelp size={17} />
        <span>
          <strong>Nasıl kullanılır?</strong>
          <span>{info.title}</span>
        </span>
        <ChevronDown size={15} className="ah-chevron" aria-hidden="true" />
      </summary>
      <div className="ah-body">
        <p>{info.intro}</p>
        <ol>
          {info.steps.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
        {info.note && <p className="ah-note">{info.note}</p>}
      </div>
    </details>
  );
}
