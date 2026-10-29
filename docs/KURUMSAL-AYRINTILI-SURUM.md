# Kurumsal bölümü korunan ayrıntılı sürüm

Güncel müşteri çalışma alanı, destek ve şifreli veri kurulumu için [Veri, güvenlik ve destek rehberini](VERI-GUVENLIK-VE-DESTEK.md) kullanın. **Yeni sürümde `.data` ile birlikte yanındaki `.data.key` dosyası da korunmalıdır**; eski açık SQLite anlatımları bu güncellemeyle değişmiştir. İlk yönetici parolası artık `.data.initial-admin-password` dosyasındadır.

29 Ekim 2026 güncellemesi. Önceki ayrıntılı tasarımın kurumsal anlatımı ve ayrı proje sayfaları yeniden öne çıkarıldı. Yeşil/krem palet, slaytlı ana sayfa, ürünler, galeri, kataloglar, bilgi rehberleri, yönetim paneli ve müşteri takip sistemi korunur. Firma Etimesgut'taki tek dükkânından hizmet verir; bayilik başvurusu veya bayi ağı bulunmaz.

Önizlemeler: [Kurumsal sayfası](kurumsal-ayrintili/kurumsal.png), [mobil kurumsal](kurumsal-ayrintili/mobil-kurumsal.png), [Proje Birimi](kurumsal-ayrintili/proje-birimi.png). Görseller yalıtılmış örnek kurulumdan alınmıştır.

## Geri getirilen bölümler

**Kurumsal** artık doğrudan `/kurumsal` adresinde açılır. Eski `/dukkanimiz` bağlantıları bu sayfaya yönlenir. Sayfada konsept görselli firma tanıtımı, yönetim ayarlarındaki Türkçe/İngilizce hakkımızda metni ve dört çalışma adımı bulunur. Süreç başlıkları ve açıklamaları da site ayarlarından gelir. Hakkımızda metnini veya süreçleri yönetim panelinde değiştirmeniz sayfaya yansır.

Kurumsal bağlantı alanı; hakkımızda, kalite yaklaşımı, çalışma süreci, garanti/bakım, terimler, renkler, ön ölçü, kataloglar, bilgi merkezi, karşılaştırma, sık sorulan sorular, hizmet bölgeleri, proje çözümleri, proje dosyalı teklif ve müşteri paneline ulaşmayı kolaylaştırır. İçerik veya bölüm yönetimden yayından kaldırılırsa ilgili bağlantı da yayın durumuna göre gösterilir.

| Adres | İşlev |
| --- | --- |
| `/kurumsal` | Firma tanıtımı, dört süreç adımı ve ayrıntılı bilgi bağlantıları |
| `/projeler` | Kategoriye göre filtrelenen ayrı proje/yaşam alanı listesi; her kart kendi detayına açılır |
| `/fikir-defteri` | Görsel arama, filtre ve büyütme içeren galeri; `/galeri` bağlantısı da buraya ulaşır |
| `/proje-birimi` | Mimari/proje yaklaşımı, süreç adımları ve dosyalı teklif başvurusuna geçiş |
| `/proje-teklif` | Üyeliksiz fiyat sorusu veya özel çizim/proje dosyasıyla teklif başvurusu |
| `/kurumsal/kurumsal-projeler-taahhut` | İşyeri ve mimari projelerde ihtiyaç dosyası, teknik kapsam, teklif/revizyon ve teslim rehberi |

Kurumsal proje rehberi, dükkânın değerlendirebileceği işyeri ve mimari uygulamaları anlatır. Büyük bir satış ağı, şube veya bayilik hizmeti sunulduğu anlamına gelmez; yapılabilirlik ve kapsam talebe göre değerlendirilir. Önceki tek dükkân geçişinin otomatik kapattığı bilinen rehber geri açılır. Kullanıcının sonradan yaptığı içerik değişiklikleri ve ayrı yayın kararları korunur; bayilik ve iş ortaklığı başvuruları kapalı kalır.

## Dosya, teklif ve yönetim özellikleri korunur

Müşteri `/proje-teklif` üzerinden hesap açmadan fiyat sorabilir veya desteklenen çizimlerini ekleyebilir. Telefonla aranma tercihi isteğe bağlıdır. Yönetici **Proje & fiyat talepleri** alanından özel dosyaları inceleyip kalemli teklif hazırlar; taslak müşteriye gösterilmez. Yayımlanan teklif müşteri hesabında ve PDF olarak erişilebilir; revizyon ayrı sürüm olarak hazırlanır.

Müşteri süreç çizgisi, belgeler, mesajlar, randevu, hesap kurtarma; yönetimde içerikler, talepler, müşteriler, teknik personel, analitik ve bildirim ayarları kullanılmaya devam eder. E-posta sağlayıcısı bağlanmadıysa otomatik gönderim bekler; yönetici PDF ekli `.eml` taslağını kendi posta uygulamasından gönderebilir. Ayrıntılı dosya sınırları, yetkiler ve kurulum: [Proje ve teklif rehberi](PROJE-TEKLIF-SURUMU.md).

## Mevcut Windows kurulumunu güncellemek

1. Açık uygulama penceresinde **Ctrl+C** ile sunucuyu durdurun.
2. Eski proje klasörünü ve özellikle **`.data` klasörünün tamamını** güvenli bir yere yedekleyin. Veritabanı, yüklenen görseller, özel müşteri belgeleri ve proje dosyaları birlikte korunmalıdır. Bu klasörü paylaşmayın.
3. Yeni kaynak ZIP'ini ayrı bir klasöre çıkarın. Eski `.data` klasörünü yeni projede `package.json` ile aynı düzeye kopyalayın. Eski kaynak kodu yeni sürümün üzerine taşımayın; aynı veriyi iki sunucuyla eş zamanlı açmayın.
4. Yeni projenin `package.json` dosyasının bulunduğu klasörde Komut İstemi açıp çalıştırın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Node.js **24 veya üzeri** gerekir. Pencere açık kalsın. Site `http://localhost:5173`, kurumsal `http://localhost:5173/kurumsal`, yönetim `http://localhost:5173/yonetim`, müşteri alanı `http://localhost:5173/hesabim` adresindedir. Eski `.data` taşındığında mevcut hesaplar ve talepler aynı veritabanından açılır. Yeni ZIP eski klasörü veya canlı sunucuyu kendiliğinden güncellemez.

## Görsel ve içerik izinleri

Özgün metinler, bu proje için hazırlanmış konsept görselleri ve font/ikon/yazılım lisans kayıtları korunur. Konseptler tamamlanmış müşteri işi olarak sunulmaz. Firma adı, gerçek fotoğraflar ve sonradan eklenen dosyaların izinleri ayrıca doğrulanmalıdır. Bu değişiklikler telif veya marka uyuşmazlığı yaşanmayacağına dair garanti değildir. [Kaynak ve lisans envanteri](THIRD-PARTY-NOTICES.md), [incelemenin erişim sınırları](TELIF-VE-MARKA-INCELEMESI.md).

## Yeniden çalıştırılabilir kontroller

```sh
npm test
npm run build
npm run build:server
npm run rights:check
```

Playwright ve Chromium bulunan ortamda `node --import tsx scripts/detailed-smoke.mjs` genel siteyi, `node --import tsx scripts/project-quote-smoke.mjs` özel dosya ve teklif akışını sınar. Testler yalıtılmış geçici kayıtlar kullanır. Bu komut listesi sonuç raporu değildir; bu güncellemenin tamamlanan kontrolleri teslim mesajında ayrıca belirtilir. Önceki proje teklifi rehberindeki sayısal sonuçlar kendi teslimine aittir. Canlı internete dağıtım veya gerçek e-posta sağlayıcısı kurulumu bu kaynak güncellemesiyle kendiliğinden yapılmaz.

## Bu güncellemede doğrulananlar

- **104 API/güvenlik/geçiş testi geçti.** Eski geçişin otomatik kapattığı kurumsal sayfa geri açılırken özel metinler, yüklemeler ve kullanıcının ayrı yayın kararları korundu; yeniden başlatmada silinen sayfa yeniden oluşturulmadı.
- **44 tarayıcı kontrolü geçti:** kurumsal geri yükleme 9, ayrıntılı site 12, içerik/yönetim 12 ve özel proje/teklif akışı 11. Kurumsal, Projeler ve Proje Birimi ekranları 390, 768, 1024 ve 1364 pikselde kontrol edildi.
- İstemci ve sunucu derlemesi, TypeScript ve kaynak/lisans tutarlılığı başarılı. Derlenmiş üretim sunucusunda güvenlik başlıkları, Secure oturumlar, özel belge ve proje yüklemeleri, taslak gizliliği, yayımlanan teklif PDF’i ve gönderilmemiş PDF ekli e-posta taslağı doğrulandı.

Bu çalışmada canlı siteye dağıtım, gerçek e-posta gönderimi veya Windows bilgisayarında çalıştırma yapılmadı.
