# Tek dükkândan doğrudan hizmet

Bu belge önceki sade görünümün rehberidir. Güncel ayrıntılı tasarım ve dosyalı teklif akışı için [Proje ve teklif sürümü](PROJE-TEKLIF-SURUMU.md) rehberini kullanın.

29 Ekim 2026 sürümü. Kılınç Dekorasyon'un Etimesgut'taki tek dükkânından müşterileriyle doğrudan görüşmesine göre hazırlandı. Bu sürümün görünümü ve çalışma modeli, önceki tasarım rehberlerinin yerini alır.

Güncel önizlemeler [proje ve teklif rehberindedir](PROJE-TEKLIF-SURUMU.md); eski sade görünümün görüntüleri dağıtımdan çıkarılmıştır.

## Yeni görünüm

Ana sayfada büyük bir slayt vitrini yerine ziyaretçinin ihtiyacını seçip keşif mesajına taşıyabildiği bir **iş notu** alanı bulunur. Hizmetler numaralı satırlarla anlatılır; **fikir defteri** mekân konseptlerini tek tek gösterir. Menü, dükkânın sunduğu işleri ve iletişimi öne çıkarır. Yeşil/krem renk paleti korunur.

| Adres | İçerik |
| --- | --- |
| `/hizmetler` | Aranabilir ve hizmet grubuna göre süzülebilir hizmet listesi |
| `/fikir-defteri` | Mekân konseptleri ve ilgili fikirle keşif mesajı oluşturma |
| `/dukkanimiz` | Tek dükkânın çalışma yaklaşımı ve gerçek iletişim bilgileri |
| `/hizmet-alani` | Adres ve takvime göre keşif planlaması, bölge notları |
| `/teklif-al` | Keşif/uygulama talebi; üyelik gerektirmez |
| `/servis-talebi` | Bakım/onarım sorusu ve servis talebi |
| `/hesabim` | Müşterinin kendi talepleri, süreçleri, belgeleri ve mesajları |
| `/yonetim` | Firma sahibinin içerik, müşteri, talep ve personel yönetimi |

Ürün detayları, karşılaştırma, sistem seçimi, ölçü rehberi, renk tercihleri ve PDF bilgi özeti kullanılabilir. Eski `/urunler`, `/galeri`, `/kurumsal` ve `/bolgeler` liste adresleri yeni sayfalara yönlenir; tekil ürün ve bölge bağlantıları çalışmaya devam eder. Eski proje birimi bağlantısı keşif formuna gider.

## Bayilik yapısı kaldırıldı

Bayilik/iş ortaklığı başvuru formu, herkese açık bayi listesi ve bölgeye göre otomatik bayi ataması kaldırıldı. Eski başvuru sayfaları ve liste uç noktaları `410` ile kullanıma kapalıdır. Eski başvuru sayfalarının içerik kayıtları silinmeden yayından kaldırılır.

Paneldeki **Teknik ekip**, yalnızca firmanın kendi işindeki teknik irtibat kayıtlarıdır. Ad, irtibat kişisi, telefon, e-posta ve aktiflik durumu girilir. Şube, harita veya satış ağı oluşturmaz. Yeni talep kendiliğinden bir ekibe atanmaz; firma sahibi gerektiğinde talepteki teknik ekibi, uygulama sorumlusunu ve randevuyu seçer. Müşteri bunları **Teknik irtibat** alanında görür.

Personel hesabında teknik personel rolü yalnızca kendisine atanan işleri görür. İçerik editörü müşteri verilerine erişmez. Operasyon sorumlusunun müşteri ilçesi filtresi erişimi sınırlar; bütün hesap ve yetki yönetimi ana yöneticidedir. [Müşteri ve yönetim rehberi](MUSTERI-VE-YONETIM.md) ayrıntıları açıklar.

## Mevcut Windows kurulumunu güncellemek

1. Uygulamanın açık olduğu pencerede **Ctrl+C** ile sunucuyu durdurun.
2. Eski proje klasörünü, özellikle **`.data` klasörünün tamamını**, güvenli bir konuma yedekleyin. Bu klasör hesapları, müşteri taleplerini, görselleri ve özel belgeleri içerir; paylaşmayın.
3. Yeni kaynak ZIP'ini ayrı bir klasöre çıkarın. Eski `.data` klasörünü yeni projede `package.json` ile aynı düzeye kopyalayın. Eski kaynak dosyalarını yeni sürümün üzerine taşımayın. Aynı veri dizinini iki sunucuda eş zamanlı açmayın.
4. Yeni projenin `package.json` dosyasının bulunduğu klasörde Komut İstemi açıp çalıştırın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Site `http://localhost:5173`, yönetim `http://localhost:5173/yonetim`, müşteri alanı `http://localhost:5173/hesabim` adresindedir. Pencere açık kalsın. Windows'ta `BASLAT-WINDOWS.cmd` de kullanılabilir; yukarıdaki komutlar önceki kullanıcı oturumunda çalıştığı doğrulanan yöntemdir.

Mevcut `.data` taşındıysa yönetici ve müşteri hesapları korunur. Eski dış kullanıcı rolünden teknik personel rolüne geçirilen hesapların oturumları güvenlik için kapatılır; yeniden giriş gerekir. Veritabanındaki eski teknik kayıtlar ve kimlikler, taleplerin bağlantısını korumak için tutulur. Diğer özel içerik düzenlemeleri korunur; yeni başlangıç metinleri yalnızca bilinen eski varsayılan değerlerle eşleşen alanlara uygulanır.

Yeni ZIP bilgisayarınızdaki siteyi veya başka sunucudaki yayını kendiliğinden güncellemez. Kaynak dağıtımı `.data`, parolalar veya müşteri belgeleri içermez. Bu çalışma kapsamında canlı internete yayın yapılmadı.

## İçerik izinleri ve gerçek firma bilgileri

Başlangıç görselleri tasarım konseptidir; tamamlanmış müşteri işleri olarak sunulmaz. Gerçek fotoğraflarınızın kullanım izinlerini ve gerekiyorsa görünür kaynak atıflarını tamamlayın. Admin görsel kütüphanesindeki kaynak/izin kaydı belge takibine yardımcı olur; hukuki uygunluk kararı vermez. [Lisans ve kaynak envanteri](THIRD-PARTY-NOTICES.md) dağıtımda korunur.

Bağımsız görünüm, bütün telif/marka risklerinin ortadan kalktığı anlamına gelmez. Firma adı/logo, gerçek ürün ilişkileri ve sonradan yüklenen içeriklerin izinleri ayrıca doğrulanmalıdır. Güncel mevzuat ve sicil araştırmasının erişim sınırları [inceleme raporunda](TELIF-VE-MARKA-INCELEMESI.md) yer alır. İletişim bilgileri, çalışma saatleri, teknik kapsam ve KVKK taslakları firmanın gerçek süreçleriyle tamamlanmalıdır.

## Yeniden çalıştırılabilir kontroller

```sh
npm test
npm run build
npm run build:server
npm run rights:check
```

Playwright ve Chromium bulunan ortamda `node --import tsx scripts/local-shop-smoke.mjs`, `scripts/customer-portal-smoke.mjs`, `scripts/operations-smoke.mjs` ve `scripts/analytics-smoke.mjs` tarayıcı akışlarını sınar. Testler gerçek müşteriler yerine yalıtılmış geçici kayıtlar kullanır.

29 Ekim tesliminde `npm test` ile **80 API/güvenlik/geçiş kontrolü** geçti. **59 tarayıcı kontrolü** geçti: yeni genel site 12, mevcut CMS 12, müşteri paneli 12, operasyon paneli 11, analitik 6 ve görsel izin kaydı 6. Yeni genel site testi, 390/768/1024/1364 piksel genişliklerde toplam 28 sayfa/ekran kombinasyonunu da kapsar. TypeScript/Vite derlemesi, sunucu derlemesi ve 104 çalışma zamanı paketinin lisans bildirimleri ile 7 görsel/font kaydının tutarlılık kontrolü başarılıdır.

Derlenmiş üretim sunucusunda güvenlik başlıkları, Secure oturumlar, tek kullanımlık takip erişimi, editör sınırları ve özel PDF erişimi ayrıca doğrulandı. Canlı alan adına dağıtım veya gerçek Windows oturumu bu bulut çalışmasında yürütülmedi. Bu kontroller hukuki uygunluk testi değildir.
