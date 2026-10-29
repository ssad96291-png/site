# Kılınç Dekorasyon

**Başka yapay zekâ / geliştiriciyle devam:** önce [aşama sırası ve devir kaydı](docs/DEVAM/00-ONCE-OKU.md), sonra [son durum ve devam noktası](docs/DEVAM/07-SON-DURUM-VE-DEVAM.md) okunmalı. Kararlar, hatalar ve geçmiş işlemler ayrı aşama dosyalarında tutulur; kök [AGENTS.md](AGENTS.md) sonraki çalışmaların kayda eklenmesini ister.

**Güncel müşteri yönetimi ve veri güvenliği sürümü · 29 Ekim 2026:** [Müşteri dosyası, destek kayıtları, şifreli veri tabanı, antivirüs ve taşınabilir yedekleme](docs/VERI-GUVENLIK-VE-DESTEK.md). Önceki ayrıntılı Kurumsal tasarım korunur. Bu sürümde `.data/site.sqlite.enc` şifreli veritabanı kullanılır; yerel anahtar `.data.key` ve ilk parola `.data.initial-admin-password` dosyaları veri dizininin dışında tutulur. **Güncellerken `.data` ile mevcut `.data.key` ayrı ayrı korunmalıdır.**

**Güncel kurumsal ve ayrıntılı tasarım sürümü · 29 Ekim 2026:** [Firma tanıtımı, ayrı proje sayfaları ve güvenli güncelleme](docs/KURUMSAL-AYRINTILI-SURUM.md). Kurumsal bölüm, yönetimden değiştirilen firma anlatımı ve dört süreç adımıyla korunur. Tek dükkânın doğrudan hizmet modeli sürer; bayilik başvurusu veya bayi ağı bulunmaz. [Dosya gönderme ve fiyat teklifi rehberi](docs/PROJE-TEKLIF-SURUMU.md) mevcut teklif akışını açıklar.

**Müşteri ve yönetim rehberi:** [Hesaplar, talep süreçleri, teknik personel, analitik ve bildirim kurulumu](docs/MUSTERI-VE-YONETIM.md).

**İçerik izinleri:** [Görsel kaynak ve izin kaydı](docs/OZGUNLUK-VE-KULLANIM.md), [telif/marka incelemesi ve erişim sınırları](docs/TELIF-VE-MARKA-INCELEMESI.md), [lisans ve kaynak envanteri](docs/THIRD-PARTY-NOTICES.md). Son kurumsal düzen için güncel ayrıntılı sürüm rehberini kullanın; sade tek dükkân tasarımının önizlemeleri önceki sürüme aittir.

Slaytlı açılış, ürün kartları, filtreli galeri, kataloglar, bilgi merkezi ve özel dosyalı teklif akışı içeren Türkçe/İngilizce cam, alüminyum, metal ve açık alan sitesi. React + TypeScript + Vite, Express ve SQLite. Metin ve konsept görsellerinin kaynak kaydı tutulur; hak ihlali olmayacağına dair garanti verilmez.

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

İlk sunucu başlangıcında rastgele güçlü bir parola oluşturulur ve yalnızca `.data.initial-admin-password` dosyasına kaydedilir. Dosyayı kendi güvenli terminalinizde okuyun; parolayı sohbette veya Git'te paylaşmayın. Alternatif olarak ilk başlangıçtan önce `ADMIN_USERNAME` ve en az 12 karakterlik `ADMIN_PASSWORD` ortam değişkenlerini tanımlayın. Mevcut veritabanında bu değişkenler parolayı sıfırlamaz. İlk girişten sonra panelde şifrenizi değiştirin; ilk parola dosyası otomatik silinir ve açık oturumlar kapatılır.

Panelde ürünler, yaşam alanları, yazılar, kurumsal sayfalar, hizmet bölgeleri ve SSS kayıtları eklenebilir/düzenlenebilir/silinebilir. Taslak/yayın, ana sayfa önceliği, sıralama, TR/EN metinleri, teknik özellikler, kapak ve galeri görselleri desteklenir. JPG/PNG/WebP yüklemeleri en fazla 8 MB'dır; SVG yüklenmez. Site ayarları, gerçek iletişim bilgileri, sosyal hesaplar, SEO, ana sayfa metinleri düzenlenebilir. Gelen talepler hizmet/bölge bilgileriyle listelenir; özel not, öncelik ve takip tarihi eklenir, durumları değiştirilir ve silinebilir. SEO alanları, renk paleti, görünür bölümler ve süreç metinleri panelden ayarlanır. Medya kütüphanesi, işlem geçmişi, JSON/CSV dışa aktarma ve diğer oturumları kapatma desteklenir.

## Gerçek çalışan akışlar

- `/hizmetler` üzerinde hizmet grubu filtresi, arama, 2–3 ürün karşılaştırma ve detay sayfaları.
- `/sistem-secici` üzerinde ihtiyaca göre öneri ve yaklaşık açıklık alanı hesabı; ölçülerle hazır teklif bağlantısı. Kesin fiyat veya mühendislik uygunluk hesabı değildir.
- `/hizmet-alani` üzerinde tek dükkândan keşif planlaması ve bölge notları; SEO kökeni panelde tanımlandığında sitemap, robots ve llms.txt.
- Yayındaki içeriklere göre genel site araması.
- `/kurumsal` üzerinde yönetimden değiştirilen firma tanıtımı, dört süreç adımı ve bilgi bağlantıları; `/dukkanimiz` uyumlu yönlendirmedir. `/projeler` ayrı kategori listesi, `/proje-birimi` ayrıntılı proje yaklaşımıdır; galeri ve özel dosyalı teklif formu ayrıca korunur.
- `/fikir-defteri` üzerinde filtreli galeri ve görsel büyütme; rehber detayları, bilgi sayfaları ve SSS yanıtları.
- `/proje-teklif` üzerinde üyelik gerektirmeyen fiyat/proje başvurusu, isteğe bağlı özel dosya yükleme ve telefonla aranma tercihi. Yönetimde Proje & fiyat talepleri alanından kalemli teklif, PDF, e-posta taslağı ve revizyon hazırlanır. Müşteri yalnızca kendisine yayımlanan teklifleri ve kendi proje dosyalarını görür.
- Keşif/teklif, iletişim ve servis formları; sunucu doğrulaması ve SQLite'a kayıt. Bayilik ve iş ortaklığı başvuruları kapatıldı.
- Yönetim panelinde talep takibi. Panel içi bildirimler ve dış mesaj kuyruğu hazırdır; gerçek e-posta/SMS/WhatsApp gönderimi için bildirim adaptörü ve güvenli sunucu değişkenleri gerekir.
- Ürünlerin güncel verisinden üretilen PDF bilgi özeti (`/api/catalog.pdf`, İngilizce için `?lang=en`). Türkçe font için kaynak pakette lisansıyla bulunan DejaVu Sans kullanılır.
- Telefon, WhatsApp, e-posta, sosyal medya ve harita yönlendirmeleri gerçek bilgiler girildiğinde görünür. Uydurma telefon veya sosyal hesap eklenmez.

## Veriler ve yayın öncesi

Veritabanı `.data/site.sqlite.enc` (şifreli SQLite anlık görüntüsü), genel görseller `.data/uploads/`, özel müşteri belgeleri `.data/private-documents/` ve özel proje dosyaları `.data/project-files/` içinde tutulur. Bu klasörler kaynak koddan ayrı kalıcı diskte saklanmalıdır. `DATA_DIR` ile farklı bir kalıcı dizin seçilebilir. Sunucuyu durdurup tüm veri dizinini güvenli bir yere kopyalamak tutarlı yedek alma yöntemidir. Kaynak kodu yeniden dağıtmak veritabanını sıfırlamaz; başlangıç içerikleri yeni veritabanında oluşturulur. İçerik genişletme paketi, mevcut kayıtlara dokunmadan eksik yeni kayıtları bir kez ekleyen sürümlü geçiş kullanır; sonradan silinen kayıtları geri getirmez.

Hazır içerik hizmetleri, mekân konseptlerini, bakım/seçim rehberlerini, firma ve yasal taslak sayfaları, SSS yanıtlarını ve bölge notlarını kapsar. Bayilik/iş ortaklığı başvuruları yayından kaldırılır; bağımsız kurumsal proje rehberi korunur. Önceki geçişin otomatik kapattığı bilinen kurumsal rehber geri açılır; kullanıcının sonraki içerik ve yayın kararları korunur. Başlangıç görselleri, kaynak kaydı bulunan proje konseptleridir; tamamlanmış müşteri işi olarak sunulmaz. Harici font/görsel/takip servisine istek yapılmaz; fontlar yerel paketlerden sunulur. Font ve ikon lisansları `/licenses/THIRD-PARTY-NOTICES.txt` adresinde dağıtılır. `npm run rights:check` kayıtların kilitli bağımlılık ve görsellerle tutarlılığını denetler; hak sahipliğini doğrulamaz.

Yayın öncesinde panelde dükkânın gerçek iletişim bilgilerini, çalışma saatlerini, hizmet alanını, ürün doğruluğunu ve kullanım izinli fotoğraflarınızı tamamlayın. KVKK/gizlilik/kullanım metinleri taslaktır; gerçek veri sorumlusu ve süreçlerinizle tamamlanmalıdır. Ayrıntılı yerleşim; ürünler, galeri, kataloglar ve bilgi sayfalarıyla geri getirildi. Bayilik başvuruları ve bayi ağı kapalı kalır. Tek dükkânın gerçek iletişim bilgileri ve teknik irtibatları kullanılır. Kaynağı doğrulanamayan eski SVG'ler dağıtımdan çıkarılmıştır; eski görsel adresleri yeni konsept görsellerine yönlendirilir. Kullanıcı yüklemeleri değiştirilmez. Mevzuatın güncel metnine erişim, marka/tasarım sicil taraması ve kullanıcı içeriklerinin izin kontrolündeki açık noktalar inceleme raporunda belirtilir.

## Güvenlik

Kalıcı veritabanı ve özel dosyalar AES-256-GCM ile şifrelenir. SQLite tek süreçte bellekte çalışır; değişiklikler atomik şifreli anlık görüntü olarak diske yazılır. Anahtar yedekten ayrı saklanır; anahtarsız veri kurtarılamaz. Üretimde çalışan ClamAV olmadan dosya yükleme/özel indirme açılmaz. Yerel geliştirmedeki sınırlı kontrol tam antivirüs değildir. Parolalar scrypt ile özetlenir; rastgele oturum belirteçlerinin yalnızca SHA-256 özeti saklanır. HttpOnly/SameSite oturumlar, oturum zaman aşımı, şifre değişiminde oturum iptali, giriş/form hız sınırı, yazma isteklerinde kaynak denetimi, SQL parametreleri, yükleme imza/tür kontrolleri ve üretimde CSP uygulanır. Canlı ortam için HTTPS, kalıcı disk ve düzenli yedekler sağlayın. İnternet üzerinden ödeme veya satış işlemi içermez.

## Dağıtım ve işletim

[HTTPS, Docker Compose, yedekleme ve canlı kabul rehberi](docs/YAYINLAMA.md) hazırlandı. `npm run build:server` sunucuyu JavaScript olarak derler; `npm run start:compiled` derlenmiş sunucuyu çalıştırır. Docker root olmayan kullanıcı, sağlık kontrolü ve kalıcı veri birimi kullanır. Bu dosyaların bulunması dağıtım yapıldığı anlamına gelmez.

Tarayıcı kontrolleri için Playwright ve Chromium gerekir: `node --import tsx scripts/detailed-smoke.mjs` ve `node --import tsx scripts/browser-smoke.mjs`. Testler geçici veri dizini ve rastgele test parolası kullanır, gerçek verileri değiştirmez. Sistem Playwright kurulumu yoksa `PLAYWRIGHT_MODULE` ve `CHROMIUM_EXECUTABLE` ile yolları belirtin.
