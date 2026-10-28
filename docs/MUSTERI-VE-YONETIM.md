# Müşteri, bayi ve canlı yönetim sürümü

Bu sürüm önceki sitenin içerik, tasarım, mevcut yönetici ve veritabanını korur. Yeni tablolar ilk açılışta eklenir; müşteri ya da bayi örnekleri gerçek kayıt gibi oluşturulmaz.

## Müşteri akışı

Müşteri hesabı `/hesabim`, yönetim alanı `/yonetim` adresindedir. Teklif formu üyelik gerektirmez. Formdan sonra **Talebimi takip et** düğmesi yeni talebe özel, tek kullanımlı takip bağlantısını açar. Bağlantı yalnızca yeni talebe erişir; aynı e-postayı yazmak eski talepleri açmaz. Müşteri dilerse hesabını oluşturur veya kendi mevcut hesabına giriş yaparak talebini bağlar.

Müşteri ekranında altı aşama vardır: talep alındı, bayi/keşif atandı, keşif tamamlandı, üretimde, montaj bekliyor, tamamlandı. Bayi/ekip kartı, teknisyen ve randevu, müşteriyle paylaşılan açıklama, özel PDF arşivi ve mesajlaşma aynı ekrandadır. Özel yönetici notları müşteriye gösterilmez. Panel yaklaşık 10 saniyede yenilenir; değişiklik kontrolü için Yenile düğmesi de vardır.

Müşteri teklif revizesi, randevu değişikliği veya destek mesajı gönderebilir. İletişim profilini ve parolasını düzenleyebilir; parola değişince tüm müşteri oturumları kapanır. Parola unutulduğunda yönetici, kimliği doğruladıktan sonra kısa süreli kurtarma bağlantısı oluşturabilir.

## Yönetici için hızlı çözümler

| İş | Panelde yapılacak işlem |
| --- | --- |
| Müşteri giriş yapamıyor | Müşteriler → müşteri → hesap durumu kontrolü; gerekiyorsa aktifleştir, oturumları kapat veya kurtarma bağlantısı oluştur |
| E-posta yanlış girilmiş | Müşteriler → müşteri bilgileri → doğrulanmış yeni adresi kaydet; hesaplar otomatik birleştirilmez, oturumlar kapanır |
| Yanlış ekip atanmış | Talep süreçleri → talep → bayi/teknisyen seç → kaydet |
| Keşif tarihi değişecek | Aynı talepte randevu tarihini güncelle ve müşteri açıklamasını yaz |
| Talep ilerledi | Kartı sürükle veya erişilebilir aşama listesinden seç |
| Teklif/garanti belgesi paylaşılacak | Talep → belgeler → PDF yükle; müşteri yalnızca kendi belgesini indirebilir |
| Müşteri revize istiyor | Talep mesajları bölümünden yanıtla; iç not ile müşteri mesajını karıştırma |
| Şüpheli hesap/oturum var | Hesabı dondur veya oturumları kapat; yetkiler her istekte sunucuda yeniden kontrol edilir |
| Bölgeye otomatik ekip atansın | Bayi & teknik ekip → aktif ekip → hizmet bölgelerini tam ilçe/bölge adıyla gir; tek eşleşme varsa yeni talep otomatik atanır |
| Bildirim gitmiyor | Bildirim merkezi → bağlantı ve hata durumunu kontrol et; sağlayıcı yapılandırıldıktan sonra Yeniden dene |

Kurtarma bağlantısı hassas bir erişim anahtarıdır. Müşterinin kimliğini bağımsız biçimde doğrulayın ve bağlantıyı yalnızca doğrulanmış müşteriye güvenli kanaldan iletin. Açık sohbete veya herkese açık bir yere yapıştırmayın. Panel bağlantıyı kendiliğinden panoya kopyalamaz.

## Roller

- Ana yönetici: bütün yönetim araçları.
- Bölge yöneticisi: kendi bölgesinin talepleri, sınırlı müşteri listesi ve ilgili bildirimler; müşteri hesap kurtarma/kimlik düzeltme ve personel yetkileri ana yöneticidedir.
- İçerik editörü: ürün/sayfa/rehber/galeri içerikleri; müşteri verileri ve dışa aktarma yetkisi yoktur.
- Bayi kullanıcısı: yalnızca kendisine atanan talepler, belgeler ve bildirimler.

Personel ve bayi kullanıcıları giriş ekranında **Hesap türü → Personel / bayi** seçer. Herkesin ayrı hesabı olmalıdır. Rol değişimi veya dondurma mevcut personel oturumlarını kapatır. Parolayı görüntüleme özelliği yoktur; yalnızca değiştirme/kurtarma işlemleri vardır.

## Gerçek canlı veriler

Canlı izleme ekranı varsayılan olarak kapalı olan ziyaretçi analitiğine açıkça izin veren tarayıcıları sayar. Aktiflik penceresi 90 saniyedir. Sayfa gezintileri, belge indirme bağlantısı tıklamaları, bölge bağlantıları ve form başlama/terk sayıları tutulur. Gönderilmemiş ad, telefon, e-posta ve mesaj alanları toplanmaz. Tam IP yerine maskeli IP gösterilir; şehir/ilçe IP'den tahmin edilmez. Ekran videosu/fare kaydı alınmaz.

Analitik tercihi geri alınabilir; ilgili tarayıcı oturumunun olayları silinir. Veriler 30 gün, 10.000 olay ve 2.000 oturum sınırıyla tutulur. Bölge yöneticisinin talep istatistikleri kendi bölgesiyle sınırlıdır; anonim ziyaretçi akışı site geneline aittir. Müşterinin belge indirme isteği, belgenin okunduğunun kanıtı değildir.

## Dış bildirimlerin kurulumu

Panel içi bildirimler ek hizmet gerektirmez. E-posta/SMS/WhatsApp işleri kuyrukta tutulur. Dış gönderim, işletmenizin hesabındaki güvenilir HTTPS bildirim adaptörüne bağlanır. Henüz gerçek sağlayıcı bilgileri verilmediği için canlı dış gönderim doğrulanmadı; bağlantısız işler **Bağlantı bekliyor** durumundadır.

Sunucu veya barındırmanın güvenli ortam değişkenlerinde şunları tanımlayın; değerleri Git'e veya sohbete yazmayın:

- `NOTIFY_WEBHOOK_URL`: sadece HTTPS, izinli sağlayıcı/adaptör adresi.
- `NOTIFY_ALLOWED_HOSTS`: adresin tam alan adı; joker karakter ve yerel IP kabul edilmez.
- `NOTIFY_WEBHOOK_TOKEN`: sağlayıcı/adaptör kimlik bilgisi.
- `PUBLIC_ORIGIN`: firmanın gerçek HTTPS kökeni, örneğin `https://firmaniz.com`. Takip davetleri için gerekir.

Adaptör `POST` JSON `{id,channel,payload}` alır. Kanal `email`, `sms` veya `whatsapp` olur. Kimlik doğrulama `Authorization: Bearer ...`, tekrarları ayırma anahtarı `Idempotency-Key: id` başlığıdır. Sağlayıcı kendi API'sine uygun dönüşümü ve tekrarlı işlerin tek kez gönderilmesini sağlamalıdır. `2xx`, servis tarafından kabul anlamına gelir; müşterinin mesajı okuduğunu veya taşıyıcının teslim ettiğini göstermez.

Yeni misafir talebinin takip daveti, gönderim sırasında tek kullanımlı erişim bağlantısıyla hazırlanır. Ham erişim anahtarı kalıcı kuyrukta tutulmaz. Aşama/belge/mesaj bildirimleri kaydedilir ve bağlantı hazırsa otomatik işlenir. Otomatik zamanlanmış randevu hatırlatma, sayısal SMS OTP ve sağlayıcıya özel teslim raporu bu sürümde yoktur. Mevcut güvenli tek kullanımlık takip/kurtarma bağlantıları kullanılabilir.

`.env` otomatik okunmaz; süreç veya hosting ortamını kullanın. Docker Compose'da `NOTIFY_*` değişkenleri uygulamaya aktarılabilir; değerler dosyaya sabitlenmez. Desteklenen sağlayıcı seçilip test hesabı bağlandıktan sonra gerçek gönderim ayrıca sınanmalıdır.

## Veriler ve sınırlar

Kalıcı `.data`/`DATA_DIR` altında SQLite, yüklemeler ve özel belgeler birlikte yedeklenmelidir. Özel belgeler `private-documents` içindedir; herkese açık `/uploads` altında değildir. Paneldeki JSON içerik dışa aktarması bütün müşteri veritabanını veya dosyaları geri yükleme yedeği değildir. Tam yedek için uygulamayı durdurup tüm veri dizinini güvenli biçimde kopyalayın ve geri yüklemeyi deneyin.

Bu sürüm PDF belge arşivi, TR/EN içerik ve dört temel rol sunar. CAD/BIM kütüphanesi, ek diller, dış session-replay ve IP konum sağlayıcısı bağlı değildir. PDF boyut/imza/ad kontrolleri tam antivirüs taraması anlamına gelmez. MFA ve çevrimiçi ödeme eklenmedi. İçerik, garanti koşulları ve KVKK metinleri firmanın gerçek süreçleriyle tamamlanmalıdır.

## Önizleme ve doğrulama · 28 Ekim 2026

Görüntülerde yalnızca otomatik testlerin ürettiği sentetik kayıtlar vardır; gerçek müşteri veya gönderim sayısı olarak sunulmaz.

- [Müşteri paneli](musteri-paneli/musteri.png) · [Mobil müşteri](musteri-paneli/musteri-mobil.png)
- [Süreç ve özel belgeler](musteri-paneli/surec-belgeler.png) · [Müşteri düzeltme](musteri-paneli/musteri-duzeltme.png)
- [Mobil yönetim](musteri-paneli/yonetim-mobil.png) · [Canlı analiz](musteri-paneli/canli-analiz.png)

54 API/güvenlik testi ve 53 tarayıcı kontrolü geçti: önceki CMS ve tasarım 24, müşteri 12, operasyon/rol/mobil yönetim 11, izinli analitik 6. TypeScript/Vite derlemesi ve sunucu derlemesi başarılı. Derlenmiş üretim sürecinde üç ayrı Secure/HttpOnly/SameSite oturum çerezi, tek kullanımlık takip bağlantısı, editör yetki sınırı, özel PDF ve güvenlik başlıkları doğrulandı. Test verileri yalıtılmış geçici dizinlerde oluşturulup temizlendi. Windows başlatıcı Windows makinede bu ortamda çalıştırılmadı.

Tekrarlanabilir komutlar: `npm test`, `npm run build`, `npm run build:server`; Playwright ve Chromium bulunan ortamda `node --import tsx scripts/customer-portal-smoke.mjs`, `scripts/operations-smoke.mjs`, `scripts/analytics-smoke.mjs`; derlenmiş sunucu için `node scripts/production-smoke.mjs`.

Canlı analitiği denemek için ayrı bir tarayıcı sekmesinde genel siteyi açıp **Analitiğe izin ver** seçin. Ardından yönetim panelinde Canlı izleme & analiz ekranını açın. Yönetim ve müşteri paneli sayfaları analitik kapsamı dışındadır; açık yönetim sekmesi ziyaretçi sayısını kendiliğinden artırmaz.
