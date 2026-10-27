# Kayıtlardan uyarlanan yeni sürüm

Yedi video parçasındaki gezinme ve sayfa yapıları incelendi; önceki Kılınç sitesi üzerine özgün bir tasarım uyarlaması yapıldı. Önceki ürünler, müşteri talepleri, yönetici hesabı ve ayarlar korunur. Ödül, sertifika, firma yaşı, bayi ağı veya kredi kampanyası gibi doğrulanmamış bilgiler eklenmedi.

## Yeni görünüm ve akışlar

- Ortalanmış Kılınç logosu, kaydırmada küçülen başlık ve yatay açılır menüler.
- Üç slaytlı, duraklatılabilir ana görsel; dikdörtgen ürün ve bahçe/teras kartları.
- Ürün ailesine göre akordeon liste ve arama; önceki karşılaştırma aracı `/urun-karsilastir` adresinde.
- `/galeri`: kategori ve arama filtresi, büyütme penceresi, önceki/sonraki görsel.
- `/katalog`: genel, bahçe/teras, alüminyum ve metal için dört gerçek PDF kataloğu.
- `/proje-birimi`: uygulama süreci ve panele kaydedilen kurumsal proje başvurusu.
- `/bolgeler`: Ankara bölge filtresi ve bölgesi önceden doldurulmuş keşif talebi.
- `/kurumsal`: on iki bağlantılı bilgi merkezi, aranabilir sözlük, renk seçici, ön ölçü rehberi ve bakım bilgileri.
- Renk seçimi teklif mesajına aktarılır. Renkler ekranda yaklaşık ön seçimdir; gerçek kaplama numunesiyle teyit edilir.
- `/servis-talebi`: özel servis başvuruları yönetim panelindeki talep listesine kaydedilir.
- Dört sütunlu koyu alt bölüm ve mobil açılır menü.

Görseller özgün yapay zekâ destekli mimari tasarım görselleştirmeleridir; tamamlanmış müşteri işleri değildir. Kayıtlardaki marka, fotoğraf, metin veya ödül işaretleri kullanılmadı. Hukuki uygunluk için mutlak garanti verilmez.

## Panelden düzenleme

Önceki `/yonetim` paneli geçerlidir. Yeni bilgi sayfalarını **Sayfalar** bölümünden düzenleyin:

- **Terimler Sözlüğü:** teknik özellik tablosundaki etiket/açıklama çiftleri sözlük maddeleridir.
- **Renk Kartelası:** etiket renk adı, değer `#RRGGBB` biçiminde renk kodudur.
- **Ön Ölçü Rehberi:** gövde ve teknik özellik çiftleri hem sayfada hem PDF'de kullanılır. Sayfayı taslak yapınca PDF de erişime kapanır.
- **Garanti ve Bakım:** gövde ve başlıklar firmanın gerçek şartlarıyla tamamlanmalıdır.
- **Uygulama Süreci:** mevcut içerik korunur; teknik tablo boşsa Site Ayarları'ndaki dört süreç adımı kullanılır.

Mevcut kayıtların başlıkları ve metinleri üzerine yazılmaz. Yeni sayfa paketi bir kez eksik kayıtları ekler; sonradan silinen içerikleri her açılışta geri getirmez. Yüklediğiniz kendi görselleriniz korunur. Yeni mimari görseller yalnızca hazır paket görsellerinin gösterimini yeniler.

## Windows'ta çalıştırma

1. ZIP'i yeni bir klasöre çıkarın.
2. Node.js 24+ kuruluysa `BASLAT-WINDOWS.cmd` dosyasına çift tıklayın.
3. Paket kurulumu ve sunucu başlangıcını bekleyin. Pencere açık kalmalı.
4. Tarayıcıda `http://localhost:5173`, panel için `http://localhost:5173/yonetim` açılır.

Node.js yoksa başlatıcı kurulum adresini gösterir. Windows Installer MSI kurarken Add to PATH açık kalmalıdır. Başlatıcı Windows üzerinde bu çalışma ortamında çalıştırılmadı; gerçek uygulama ve tarayıcı kontrolleri Linux'ta yapıldı. Elle çalıştırma: `npm ci`, ardından `npm run dev`.

Eski siteden taşırken `.data` klasörünün tamamını güvenli yedekleyin. Node 24 kullanın ve eski sunucuyu durdurduktan sonra yeni kaynaklarla aynı veri dizinini kullanın. İlk şifre ve mevcut parola ayrı kavramlardır; güncelleme parolayı sıfırlamaz.

## Önizlemeler

- [Masaüstü](onizleme/masaustu.png)
- [Mobil](onizleme/mobil.png)

## Doğrulama · 28 Ekim 2026

- 26 API/güvenlik/veri geçişi testi geçti.
- Önceki teklif, CMS, SEO, dil, medya, CRM ve oturum akışlarını kapsayan 12 tarayıcı kontrolü geçti.
- Yeni menü, slayt, akordeon, galeri, katalog, sözlük, renk, bölge, servis ve mobil akışlarını kapsayan 12 tarayıcı kontrolü geçti.
- Altı ana sayfa türü 390, 768, 1024 ve 1364 piksel genişlikte yatay taşma açısından kontrol edildi.
- TypeScript/Vite üretim derlemesi ve derlenmiş Node sunucusu kontrol edildi.
- Docker üretim imajı derlendi; root olmayan kullanıcı ve salt okunur kök ile 76 içerik, yeni PDF uçları, görseller, CSP ve anonim erişim sınırları doğrulandı. Geçici test konteyneri ve verileri temizlendi.

Testleri çalıştırmak için `npm test`; Playwright ve Chromium bulunan ortamda `node --import tsx scripts/browser-smoke.mjs` ve `node --import tsx scripts/recorded-smoke.mjs` kullanılır.
