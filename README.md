# Kılınç Dekarasyon

Özgün tasarım, metinler ve yerel mimari SVG görselleştirmeler içeren Türkçe/İngilizce cam balkon ve açık alan sitesi. React + TypeScript + Vite, Express ve SQLite.

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

Panelde ürünler, yaşam alanları, yazılar, kurumsal sayfalar ve SSS kayıtları eklenebilir/düzenlenebilir/silinebilir. Taslak/yayın, ana sayfa önceliği, sıralama, TR/EN metinleri, teknik özellikler, kapak ve galeri görselleri desteklenir. JPG/PNG/WebP yüklemeleri en fazla 8 MB'dır; SVG yüklenmez. Site ayarları, gerçek iletişim bilgileri, sosyal hesaplar, SEO, ana sayfa metinleri düzenlenebilir. Gelen talepler listelenir, durumları değiştirilir ve silinebilir.

## Gerçek çalışan akışlar

- Ürün kategori filtresi, arama, 2–3 ürün karşılaştırma ve detay sayfaları.
- Yayındaki içeriklere göre genel site araması.
- Proje/konsept ve blog listeleri/detayları, SSS akordeonları.
- Teklif, iletişim ve iş ortaklığı formları; sunucu doğrulaması ve SQLite'a kayıt.
- Yönetim panelinde talep takibi. **Otomatik e-posta/SMS gönderimi kurulmuş değildir**; talepleri panelden takip edin.
- Ürünlerin güncel verisinden üretilen gerçek PDF katalog (`/api/catalog.pdf`, İngilizce için `?lang=en`). Türkçe font için DejaVuSans sistem fontu kullanılır.
- Telefon, WhatsApp, e-posta, sosyal medya ve harita yönlendirmeleri gerçek bilgiler girildiğinde görünür. Uydurma telefon veya sosyal hesap eklenmez.

## Veriler ve yayın öncesi

Veritabanı `.data/site.sqlite`, yüklemeler `.data/uploads/` içinde tutulur. Bu klasörler kaynak koddan ayrı kalıcı diskte saklanmalıdır. `DATA_DIR` ile farklı bir kalıcı dizin seçilebilir. Sunucuyu durdurup tüm veri dizinini güvenli bir yere kopyalamak tutarlı yedek alma yöntemidir. Kaynak kodu yeniden dağıtmak veritabanını sıfırlamaz; başlangıç içerikleri yalnızca yeni veritabanında oluşturulur.

Hazır içerik: 10 sistem, 6 konsept yaşam alanı, 4 rehber yazı, 10 kurumsal/yasal sayfa ve 8 SSS. Görseller özgün yerel mimari illüstrasyonlardır; tamamlanmış müşteri işi olarak sunulmaz. Harici font/görsel/takip servisine istek yapılmaz; fontlar yerel paketlerden sunulur.

Yayın öncesinde panelde firma iletişim bilgilerini, çalışma saatlerini, hizmet bölgelerini, ürün doğruluğunu ve kendi kullanım izinli fotoğraflarınızı tamamlayın. KVKK/gizlilik/kullanım metinleri taslaktır; gerçek veri sorumlusu ve süreçlerinizle tamamlanmalıdır. Referans siteye ortam ağ politikası nedeniyle erişilemediğinden onun bütün sayfa/kartlarıyla birebir kapsam eşleşmesi doğrulanmamıştır. Başka markanın logo, metin veya görselleri alınmamıştır; telif konusunda hukuki garanti verilmez.

## Güvenlik

Parolalar scrypt ile özetlenir; rastgele oturum belirteçlerinin yalnızca SHA-256 özeti saklanır. HttpOnly/SameSite oturumlar, oturum zaman aşımı, şifre değişiminde oturum iptali, giriş/form hız sınırı, yazma isteklerinde kaynak denetimi, SQL parametreleri, yükleme imza/tür kontrolleri ve üretimde CSP uygulanır. Canlı ortam için HTTPS, kalıcı disk ve düzenli yedekler sağlayın. İnternet üzerinden ödeme veya satış işlemi içermez.
