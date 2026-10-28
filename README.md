# Kılınç Dekorasyon

**Güncel tek dükkân sürümü · 29 Ekim 2026:** [Yeni görünüm, teknik ekip ve güvenli güncelleme](docs/TEK-DUKKAN-SURUMU.md). Site Etimesgut'taki tek dükkândan doğrudan hizmet veren yerel işletmeye göre düzenlendi.

**Müşteri ve yönetim rehberi:** [Hesaplar, talep süreçleri, teknik personel, analitik ve bildirim kurulumu](docs/MUSTERI-VE-YONETIM.md).

**İçerik izinleri:** [Görsel kaynak ve izin kaydı](docs/OZGUNLUK-VE-KULLANIM.md), [telif/marka incelemesi ve erişim sınırları](docs/TELIF-VE-MARKA-INCELEMESI.md), [lisans ve kaynak envanteri](docs/THIRD-PARTY-NOTICES.md). Tasarımın son görünümü için tek dükkân rehberini kullanın; diğer tasarım önizlemeleri önceki sürümlere aittir.

İş notu açılışı, hizmet satırları, fikir defteri ve doğrudan dükkân iletişimi içeren Türkçe/İngilizce cam, alüminyum, metal ve açık alan sitesi. React + TypeScript + Vite, Express ve SQLite. Metin ve konsept görsellerinin kaynak kaydı tutulur; hak ihlali olmayacağına dair garanti verilmez.

## Geliştirme

Node.js **24 veya üzeri** gerekir (`node:sqlite` kullanılır).

```sh
cd /workspace/site
npm ci --cache /tmp/kilinc-npm-cache
npm run dev
```

Vite 5173, API 3000 portunda çalışır. Vite `/api` ve `/uploads` isteklerini API'ye iletir. Geliştirme ortamı zaten yalıtılmıştır; mevcut checkout'u kullanın, ayrıca Git worktree oluşturmayın.

```sh
npm test        # API, kimlik doğrulama, CRUD, talepler, PDF ve kalıcılık testleri
npm run build  # TypeScript kontrolü ve üretim derlemesi
npm start      # dist/ ve API'yi 3000 portunda üretim modunda sunar
```

Üretim modunda yönetim oturum çerezi Secure'dür. Yönetim paneli için HTTPS gerekir. Ters vekil kullanıyorsanız gerçek alan adını `PUBLIC_ORIGIN` olarak verin. Başka bir port için `PORT` tanımlayın. `.env.example` bir örnektir; uygulama `.env` dosyasını otomatik yüklemez. Değişkenleri servis/hosting ortamında tanımlayın.

## Yönetim paneli

`/yonetim` (veya `/admin`). Varsayılan kullanıcı adı **admin**.

İlk sunucu başlangıcında rastgele güçlü bir parola oluşturulur ve yalnızca `.data/initial-admin-password` dosyasına kaydedilir. Dosyayı kendi güvenli terminalinizde okuyun; parolayı sohbette veya Git'te paylaşmayın. Alternatif olarak ilk başlangıçtan önce `ADMIN_USERNAME` ve en az 12 karakterlik `ADMIN_PASSWORD` ortam değişkenlerini tanımlayın. Mevcut veritabanında bu değişkenler parolayı sıfırlamaz. İlk girişten sonra panelde şifrenizi değiştirin; ilk parola dosyası otomatik silinir ve açık oturumlar kapatılır.

Panelde ürünler, yaşam alanları, yazılar, kurumsal sayfalar, hizmet bölgeleri ve SSS kayıtları eklenebilir/düzenlenebilir/silinebilir. Taslak/yayın, ana sayfa önceliği, sıralama, TR/EN metinleri, teknik özellikler, kapak ve galeri görselleri desteklenir. JPG/PNG/WebP yüklemeleri en fazla 8 MB'dır; SVG yüklenmez. Site ayarları, gerçek iletişim bilgileri, sosyal hesaplar, SEO, ana sayfa metinleri düzenlenebilir. Gelen talepler hizmet/bölge bilgileriyle listelenir; özel not, öncelik ve takip tarihi eklenir, durumları değiştirilir ve silinebilir. SEO alanları, renk paleti, görünür bölümler ve süreç metinleri panelden ayarlanır. Medya kütüphanesi, işlem geçmişi, JSON/CSV dışa aktarma ve diğer oturumları kapatma desteklenir.

## Gerçek çalışan akışlar

- `/hizmetler` üzerinde hizmet grubu filtresi, arama, 2–3 ürün karşılaştırma ve detay sayfaları.
- `/sistem-secici` üzerinde ihtiyaca göre öneri ve yaklaşık açıklık alanı hesabı; ölçülerle hazır teklif bağlantısı. Kesin fiyat veya mühendislik uygunluk hesabı değildir.
- `/hizmet-alani` üzerinde tek dükkândan keşif planlaması ve bölge notları; SEO kökeni panelde tanımlandığında sitemap, robots ve llms.txt.
- Yayındaki içeriklere göre genel site araması.
- `/fikir-defteri` üzerinde tek tek incelenen mekân konseptleri; rehber detayları ve SSS yanıtları.
- Keşif/teklif, iletişim ve servis formları; sunucu doğrulaması ve SQLite'a kayıt. Bayilik ve iş ortaklığı başvuruları kapatıldı.
- Yönetim panelinde talep takibi. Panel içi bildirimler ve dış mesaj kuyruğu hazırdır; gerçek e-posta/SMS/WhatsApp gönderimi için bildirim adaptörü ve güvenli sunucu değişkenleri gerekir.
- Ürünlerin güncel verisinden üretilen PDF bilgi özeti (`/api/catalog.pdf`, İngilizce için `?lang=en`). Türkçe font için kaynak pakette lisansıyla bulunan DejaVu Sans kullanılır.
- Telefon, WhatsApp, e-posta, sosyal medya ve harita yönlendirmeleri gerçek bilgiler girildiğinde görünür. Uydurma telefon veya sosyal hesap eklenmez.

## Veriler ve yayın öncesi

Veritabanı `.data/site.sqlite`, yüklemeler `.data/uploads/` içinde tutulur. Bu klasörler kaynak koddan ayrı kalıcı diskte saklanmalıdır. `DATA_DIR` ile farklı bir kalıcı dizin seçilebilir. Sunucuyu durdurup tüm veri dizinini güvenli bir yere kopyalamak tutarlı yedek alma yöntemidir. Kaynak kodu yeniden dağıtmak veritabanını sıfırlamaz; başlangıç içerikleri yeni veritabanında oluşturulur. İçerik genişletme paketi, mevcut kayıtlara dokunmadan eksik yeni kayıtları bir kez ekleyen sürümlü geçiş kullanır; sonradan silinen kayıtları geri getirmez.

Hazır içerik hizmetleri, mekân konseptlerini, bakım/seçim rehberlerini, firma ve yasal taslak sayfaları, SSS yanıtlarını ve bölge notlarını kapsar. Tek dükkân geçişi eski başvuru ve büyük kurumsal proje sayfalarını silmeden yayından kaldırır; diğer özel düzenlemeler korunur. Başlangıç görselleri, kaynak kaydı bulunan proje konseptleridir; tamamlanmış müşteri işi olarak sunulmaz. Harici font/görsel/takip servisine istek yapılmaz; fontlar yerel paketlerden sunulur. Font ve ikon lisansları `/licenses/THIRD-PARTY-NOTICES.txt` adresinde dağıtılır. `npm run rights:check` kayıtların kilitli bağımlılık ve görsellerle tutarlılığını denetler; hak sahipliğini doğrulamaz.

Yayın öncesinde panelde dükkânın gerçek iletişim bilgilerini, çalışma saatlerini, hizmet alanını, ürün doğruluğunu ve kullanım izinli fotoğraflarınızı tamamlayın. KVKK/gizlilik/kullanım metinleri taslaktır; gerçek veri sorumlusu ve süreçlerinizle tamamlanmalıdır. Yeni yerleşimde slaytlı vitrin, büyük kurumsal menü ve bayi ağı bulunmaz. Kaynağı doğrulanamayan eski SVG'ler dağıtımdan çıkarılmıştır; eski görsel adresleri yeni konsept görsellerine yönlendirilir. Kullanıcı yüklemeleri değiştirilmez. Mevzuatın güncel metnine erişim, marka/tasarım sicil taraması ve kullanıcı içeriklerinin izin kontrolündeki açık noktalar inceleme raporunda belirtilir.

## Güvenlik

Parolalar scrypt ile özetlenir; rastgele oturum belirteçlerinin yalnızca SHA-256 özeti saklanır. HttpOnly/SameSite oturumlar, oturum zaman aşımı, şifre değişiminde oturum iptali, giriş/form hız sınırı, yazma isteklerinde kaynak denetimi, SQL parametreleri, yükleme imza/tür kontrolleri ve üretimde CSP uygulanır. Canlı ortam için HTTPS, kalıcı disk ve düzenli yedekler sağlayın. İnternet üzerinden ödeme veya satış işlemi içermez.

## Dağıtım ve işletim

[HTTPS, Docker Compose, yedekleme ve canlı kabul rehberi](docs/YAYINLAMA.md) hazırlandı. `npm run build:server` sunucuyu JavaScript olarak derler; `npm run start:compiled` derlenmiş sunucuyu çalıştırır. Docker root olmayan kullanıcı, sağlık kontrolü ve kalıcı veri birimi kullanır. Bu dosyaların bulunması dağıtım yapıldığı anlamına gelmez.

Tarayıcı kontrolleri için Playwright ve Chromium gerekir: `node --import tsx scripts/local-shop-smoke.mjs` ve `node --import tsx scripts/browser-smoke.mjs`. Testler geçici veri dizini ve rastgele test parolası kullanır, gerçek verileri değiştirmez. Sistem Playwright kurulumu yoksa `PLAYWRIGHT_MODULE` ve `CHROMIUM_EXECUTABLE` ile yolları belirtin.
