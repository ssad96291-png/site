# Ayrıntılı site ve dosyalı proje teklifi

29 Ekim 2026 sürümü. Önceki ayrıntılı görünüm; ürün kartları, duraklatılabilir ana slaytlar, filtreli galeri, katalog PDF'leri, bilgi sayfaları ve mobil menüyle geri getirildi. Tek Etimesgut dükkânından doğrudan hizmet verilir; bayilik başvurusu, bayi listesi ve otomatik bayi atama akışı kapalı kalır. Yeşil/krem palet, bu proje için hazırlanan konsept görselleri, lisans kayıtları ve müşteri takip altyapısı korunur.

Önizlemeler: [Ana sayfa](proje-teklif/ana-sayfa.png), [dosyalı başvuru](proje-teklif/basvuru-formu.png), [yönetimde teklif](proje-teklif/yonetim-teklifi.png), [müşteride teklif](proje-teklif/musteri-teklifi.png), [mobil başvuru](proje-teklif/mobil-basvuru.png), [mobil müşteri](proje-teklif/mobil-musteri.png). Panel kayıtları yalnızca sentetik test verileridir.

## Müşteri nasıl başvurur?

Menüdeki **Proje & teklif** bağlantısı veya `/proje-teklif` adresi kullanılır. Müşteri **Fiyat sorusu** ya da **Çizim / proje üzerinden teklif** seçer; adını, e-posta adresini, ihtiyacını ve varsa ürün, bölge ve yaklaşık ölçüleri yazar. Dosya eklemek ve hesap açmak zorunlu değildir.

**Telefonla aranmak istiyorum** başlangıçta seçili değildir. Müşteri bu kutuyu işaretlerse geçerli telefon numarası gerekir. Formda yazılı telefon bulunması tek başına telefonla aranma tercihi olarak işlenmez. E-posta ve telefon bilgileri talebe dönüş içindir; pazarlama aboneliği oluşturulmaz.

Talep kaydolduğunda yeni başvuruya özel güvenli takip oturumu açılır. Giriş yapan müşteri talebi kendi hesabında görür. Hesapsız başvuru da yalnızca oluşturduğu talebe erişir; aynı e-posta adresini yazmak önceki talepleri açmaz. Müşteri isterse takip panelinden hesap oluşturup parolasını belirleyebilir. E-posta üzerinden doğrudan yanıt almak için hesap açması gerekmez.

Dosya veya bağlantı adımı başarısız olursa oluşturulan talep korunur. Ekrandaki yeniden deneme aynı talebin dosya adımını sürdürür; tekrar başvuru göndermeye gerek yoktur. Sayfa yenilendiğinde tarayıcı güvenliği gereği aktarılacak dosyalar yeniden seçilir.

## Çizim ve proje dosyaları

| Koşul | Desteklenen değer |
| --- | --- |
| Dosya biçimleri | PDF, JPG/JPEG, PNG, WebP, DWG, DXF, IFC, STEP/STP |
| Bir talepte toplam dosya | En fazla 3 |
| Tek dosya | En fazla 20 MiB |
| Dosyaların toplamı | Bir talepte en fazla 60 MiB |
| Arşiv ve çalıştırılabilir içerik | ZIP, EXE, komut dosyaları, HTML ve SVG kabul edilmez |

Hesap başına 256 MiB ve uygulamadaki proje dosyaları için toplam 1 GiB depolama sınırı da uygulanır. Alan planlaması ve gerektiğinde eski dosyaların güvenli arşivlenmesi işletmenin sorumluluğundadır; sınır aşıldığında yeni yükleme kabul edilmez.

Dosyalar herkese açık galeriye veya `/uploads` dizinine konmaz. Müşteri yalnızca kendi talebinin dosyalarını, yetkili personel de yalnızca erişimine izin verilen talebin dosyalarını indirebilir. İndirmeler ek dosya olarak sunulur; uygulama CAD dosyasını çalıştırmaz, dış bağlantılarını açmaz veya teknik uygunluk hesabı yapmaz. Boyut, ad ve biçim kontrolleri tam antivirüs taraması garantisi değildir. İndirilen dosyayı açacak işletme kendi güvenlik taramasını uygulamalıdır.

Müşteri sadece paylaşma yetkisine sahip olduğu dosyaları yüklemelidir. Müşteri ekranından dosya kaldırma, yayımlanmış teklif öncesiyle sınırlıdır; yayımlanmış teklifin dayandığı dosyalarda değişiklik gerekiyorsa firmayla iletişime geçilir. Yetkili yönetici gerekli kaldırma işlemini panelden yapabilir. Yüklenen dosya adları veya proje içeriği ziyaretçi analitiğine gönderilmez.

## Yönetimde değerlendirme ve teklif hazırlama

`/yonetim` → **Proje & fiyat talepleri** alanında yeni başvurular, iletişim tercihleri, ek dosyalar ve teklif durumu listelenir. Yönetici talebi açıp özel dosyaları indirebilir; kalem açıklaması, miktar, birim, birim fiyat, para birimi, KDV oranı, geçerlilik tarihi ve açıklamalarla teklif taslağı hazırlar. Tutarlar sunucuda hesaplanır; tarayıcıdan gönderilen toplamlar kabul edilmez.

**Taslağı kaydet** müşteriye teklif göstermez. **Teklifi yayımla** ile teklif müşteri hesabında görünür ve yayımlanan sürüm sabitlenir. Daha sonra değişiklik gerekiyorsa **revizyon** için yeni taslak hazırlanır; önceki yayımlanmış teklif değiştirilmez. PDF, o teklif sürümünün kalemlerini ve yayımlandığı andaki firma/müşteri bilgilerini içerir. Teklif ekranı çevrimiçi ödeme veya sipariş oluşturmaz; gerçek ticari koşullar firma tarafından doğru biçimde doldurulmalıdır.

Ana yönetici ve erişim kapsamındaki operasyon sorumlusu fiyat teklifini hazırlayıp yayımlayabilir. Teknik personel yalnızca atanmış talebin izin verilen dosyalarına ve yayımlanmış teklifine erişir; taslak fiyatı değiştiremez. İçerik editörü bu müşteri operasyonlarına erişmez.

## Müşteri teklifini nereden görür?

`/hesabim` içinde ilgili talebin **Proje dosyaları & teklifler** alanından kendi dosyalarını ve kendisine yayımlanan teklifleri görür. Kalemleri, toplamı, geçerlilik tarihini ve açıklamaları inceleyip PDF'ini indirebilir. Yönetici taslakları ve diğer müşterilerin belgeleri gösterilmez. Mevcut süreç çizgisi, özel PDF arşivi, mesajlaşma, randevu ve hesap kurtarma özellikleri kullanılmaya devam eder.

## E-posta ve telefonla dönüş

Teklif yayımlandığında uygulama içi bildirim hazırlanır. E-posta gönderimi için işletmenin bildirim sağlayıcısı yapılandırılmışsa iş gönderim kuyruğuna alınır; sağlayıcı bağlı değilse **Bağlantı bekliyor** görünür. Kuyruk kaydı veya sağlayıcının kabul yanıtı, mesajın müşteriye teslim edildiği ya da okunduğu anlamına gelmez.

Sağlayıcı bağlamadan da yönetici **E-posta taslağını indir** düğmesiyle `.eml` dosyası alabilir. Taslak, müşterinin yanıt e-postasına hitap eder; kalemli teklif metni ve PDF ekini içerir. İşletme bunu kendi posta uygulamasında açıp kontrol eder ve kendi hesabından gönderir. Taslağı indirmek e-posta göndermez ve uygulamada otomatik olarak “gönderildi” sayılmaz. Gerçekte yapılan e-posta veya telefon görüşmesi panelde ayrıca not edilebilir; telefonla dönüş düğmesi müşterinin aranma tercihi varsa kullanılabilir.

Gerçek otomatik e-posta için `NOTIFY_WEBHOOK_URL`, `NOTIFY_ALLOWED_HOSTS`, `NOTIFY_WEBHOOK_TOKEN` ve gerçek HTTPS `PUBLIC_ORIGIN` güvenli hosting ortamında tanımlanır. Değerleri Git'e veya sohbete koymayın. Sağlayıcı kurulumu ve gerçek teslim testi bu kaynak güncellemesiyle kendiliğinden tamamlanmaz. Ayrıntı: [bildirim ve müşteri yönetimi rehberi](MUSTERI-VE-YONETIM.md).

## Mevcut Windows sürümünü güvenle güncellemek

1. Açık uygulama penceresinde **Ctrl+C** ile sunucuyu durdurun.
2. Eski proje klasörünü ve özellikle **`.data` klasörünün tamamını** güvenli bir yere yedekleyin. SQLite, yüklemeler, özel PDF'ler ve proje dosyaları birlikte korunmalıdır. Veri klasörünü paylaşmayın.
3. Yeni kaynak ZIP'ini ayrı bir klasöre çıkarın. Eski `.data` klasörünü yeni projede `package.json` ile aynı düzeye kopyalayın. Eski kaynak kodu yeni sürümün üzerine kopyalamayın; aynı veri diziniyle iki sunucuyu eş zamanlı çalıştırmayın.
4. Yeni projenin `package.json` dosyasının bulunduğu klasörde Komut İstemi açıp çalıştırın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Site `http://localhost:5173`, yönetim `http://localhost:5173/yonetim`, müşteri paneli `http://localhost:5173/hesabim`, dosyalı teklif formu `http://localhost:5173/proje-teklif` adresindedir. Pencere açık kalsın. Mevcut veri klasörü taşındığında hesaplar ve talepler aynı veritabanından açılır. Yeni ZIP, bilgisayardaki eski sürümü veya başka sunucudaki yayını kendiliğinden güncellemez. Bu çalışmada canlı internete dağıtım yapılmaz.

## Kaynak ve izin kayıtları

Başlangıç görselleri tamamlanmış müşteri işi olarak sunulmaz; bu proje için hazırlanmış konseptlerdir. Açık kaynak font, ikon ve yazılım lisansları dağıtımda korunur. Firma adı/logo, ürün ve kullanıcı dosyalarının izinleri ayrıca doğrulanmalıdır. Tasarımın değiştirilmesi bütün telif/marka risklerini ortadan kaldıran bir garanti değildir. [İnceleme sınırları](TELIF-VE-MARKA-INCELEMESI.md), [lisans ve görsel envanteri](THIRD-PARTY-NOTICES.md).

## Tekrarlanabilir doğrulama

```sh
npm test
npm run build
npm run build:server
npm run rights:check
```

Playwright ve Chromium bulunan ortamda `node --import tsx scripts/detailed-smoke.mjs`, `scripts/browser-smoke.mjs` ve `scripts/analytics-smoke.mjs` genel site/CMS/analitik akışlarını sınar. Yeni proje–teklif akışının tarayıcı testi `scripts/project-quote-smoke.mjs` dosyasındadır. Testler yalıtılmış geçici kayıtlar kullanır. Son teslimin gerçek doğrulama sonuçları ayrıca bildirilir; bu komut listesi çalıştırılma veya hukuki uygunluk kanıtı değildir.

## Bu teslimde doğrulanan sonuçlar

- `npm test`: **100 API, güvenlik ve geçiş kontrolü geçti**. Aynı e-postalı misafirlerin birbirine erişememesi, yetkisiz ve bozuk yüklemelerin temizlenmesi, yükleme sırasında iptal edilen oturumun kaydı durdurması, tek alıcı e-posta denetimi, taslak gizliliği, yayımlanan tekliflerin değişmezliği ve personel kapsamları sınandı.
- **70 tarayıcı kontrolü geçti**: ayrıntılı site 12, CMS 12, analitik 6, yeni proje/teklif akışı 11, mevcut müşteri alanı 12, operasyon paneli 11, görsel kaynak kayıtları 6. Ayrıntılı site kontrolü dört genişlikte 28 sayfa/ekran birleşimini de kapsar.
- İstemci ve sunucu derlemeleri, TypeScript ve lisans/envanter tutarlılık kontrolü başarılı. 104 çalışma zamanı paket girdisinin lisans bildirimleri ve 7 görsel/font dosyasının kaynak kaydı korunur.
- Derlenmiş üretim sunucusunda güvenlik başlıkları, Secure oturumlar, tek kullanımlık takip, editör sınırları ve özel PDF kontrol edildi. Aynı üretim sürecinde DXF yükleme, özel teklif taslağı, teklif yayımlama, müşteri PDF'i ve gönderilmemiş PDF ekli `.eml` taslağı doğrulandı.

Gerçek e-posta sağlayıcısı, canlı alan adı ve Windows oturumu bu kontrollerin parçası değildir. E-posta testleri gerçek alıcılara gönderim yapmaz; sağlayıcı kurulmadan gönderim kuyruğunun bağlantı beklemesi doğrulanır. Testlerin geçmesi hukuki uygunluk veya tam antivirüs güvencesi oluşturmaz.
