**Güncel veri ve güvenlik kurulumu:** [Şifreleme anahtarı, ClamAV, yedek ve geri yükleme](VERI-GUVENLIK-VE-DESTEK.md). Bu sürümde üretim anahtarı, başlangıç yönetici parolası ve ClamAV bağlantısı ayrıca gerekir. Eski düz SQLite taşıma açıklamaları yerine güncel rehberdeki şifreli veri akışını kullanın.

# Yayınlama ve işletim

Bu paket bir sunucuya henüz dağıtılmadı. Alan adı, sunucu ve kalıcı disk sizin hesabınızda hazırlanır. Canlıya almadan önce paneldeki yayın kontrol listesini tamamlayın.

## Geliştirme

Node.js 24+ ve DejaVu Sans fontu gerekir. `/workspace/site` içinde `npm ci`, `npm test`, `npm run build` ve `npm run dev` kullanılır. Aynı dizinde eş zamanlı iki bağımlılık kurulumu çalıştırmayın. `.env` uygulama tarafından kendiliğinden okunmaz; çalışma zamanı değişkenlerini servis yöneticisinden verin.

## HTTPS ile Docker Compose

Önkoşullar: Docker + Compose, gerçek alan adının sunucuya yönlendirilmiş A/AAAA kayıtları ve erişilebilir 80/443 portları. `SITE_DOMAIN` şema veya yol içermeyen gerçek alan adıdır. Otomatik sertifika edinimi dış ağ erişimi ister.

```sh
export SITE_DOMAIN=gercek-alan-adiniz.com
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

Bu komutlar yayına alır; geliştirme ortamında örnek alan adıyla çalıştırmayın. Compose yalnızca Caddy'nin 80/443 portlarını yayımlar. Uygulamanın 3000 portu internete açılmaz. `TRUST_PROXY=1` yalnızca bu tek ve güvenilir ters vekil için ayarlanmıştır. Uygulamayı başka bir şekilde sunarsanız ağ topolojinize göre `TRUST_PROXY=0` veya `1` seçin; rastgele bir vekil zincirine güvenmeyin.

Uygulama root olmayan kullanıcıyla ve salt okunur kök dosya sistemiyle çalışır. SQLite, yüklemeler ve ilk parola `site_data` biriminde saklanır. Caddy sertifikaları ayrı birimlerde saklanır. İlk parola verilmediyse sunucu güçlü rastgele parola üretir ve sadece veri birimine yazar; loga yazmaz. Yönetici kendi güvenli terminalinde bu dosyayı inceleyerek `/yonetim` üzerinden giriş yapmalı ve ilk parolayı hemen değiştirmelidir. Parolayı sohbete, Git'e veya ekran görüntüsüne taşımayın. Şifre değişimi önceki oturumları kapatır ve ilk parola dosyasını siler.

Güvenilir ağ vekili kullanılan bir derleme ortamında kurum CA'sını imaja kopyalamadan BuildKit secret ile iletin:

```sh
docker build --secret id=proxy_ca,src="$CODEX_PROXY_CERT" -t kilinc-site .
```

Genel bir sunucuda bu secret gerekmez. TLS veya paket doğrulamasını kapatmayın.

## Docker olmadan

```sh
npm ci
npm run build
npm run build:server
# NODE_ENV, PUBLIC_ORIGIN, DATA_DIR ve TRUST_PROXY değerlerini servis yöneticisinde tanımlayın.
npm run start:compiled
```

Node.js 24, `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`, HTTPS ters vekili ve kalıcı veri dizini gerekir. `PUBLIC_ORIGIN` tarayıcıdaki gerçek HTTPS kökeniyle aynı olmalıdır; paneldeki `websiteUrl` SEO içindir ve bu güvenlik değişkeninin yerini almaz. Üretim oturum çerezleri `Secure` olduğundan düz HTTP üzerinde yönetici oturumu açılmaz. Süreci systemd veya eşdeğer bir servis yöneticisiyle yeniden başlatılabilir tutun.

## Panelden yönetilenler

- Ürün, konsept proje, rehber, kurumsal/yasal sayfa, hizmet bölgesi ve SSS kayıtları; TR/EN metinleri, teknik tablolar, galeriler, sıralama ve taslak/yayın.
- Her içerik için SEO başlığı, açıklama ve görsel açıklaması; sitede arama, ürün karşılaştırma ve sistem seçici.
- Marka/iletişim bilgileri, ana sayfa metin ve görseli, renkler, bölüm görünürlüğü ve dil seçenekleri.
- Teklif talepleri, özel notlar, öncelik ve takip tarihi; CSV ve kimlik bilgilerini içermeyen JSON dışa aktarma.
- Medya yükleme/silme, işlem geçmişi, aktif oturum sayısı ve diğer oturumları kapatma.

JSON içerik dışa aktarması tam sunucu yedeği değildir: yüklemeleri, hesapları ve oturumları içermez. Panelden JSON geri yükleme özelliği sunulmaz. Dosya tabanlı yedekleme aşağıdadır.

## Veri kaybını önleme

Kaynak güncellemeleri mevcut içerikleri sıfırlamaz. Yeni içerik paketi sürümlü geçişle yalnızca eksik başlangıç kayıtlarını bir kez ekler; düzenlemeleri ve bilinçli silmeleri sonraki başlangıçlarda geri almaz. Güncellemeden önce yedek alın.

`docker compose down -v` kalıcı birimleri siler; veri korunacaksa kullanmayın. Tutarlı tam yedek için uygulamayı durdurun, `/data` içeriğinin tamamını güvenli bir konuma kopyalayın, ardından tekrar başlatın. SQLite veritabanıyla beraber varsa WAL/SHM dosyaları ve `uploads` klasörünü de saklayın. Yedekler müşteri iletişim verileri ve parola özetleri içerebilir; erişimini kısıtlayın, şifreli saklayın ve gerçek bir geri yükleme denemesi yapın. Docker dışında aynı işlem `DATA_DIR` dizinine uygulanır.

## Canlı kabul kontrolleri

1. HTTPS ana sayfa, ürün/bölge detay sayfaları ve yerel görseller açılıyor.
2. `/api/health` `{ "ok": true }` döndürüyor; katalog gerçek PDF indiriyor.
3. Yönetici giriş/çıkış ve parola değiştirme çalışıyor. Anonim `/api/admin/content` isteği 401 alıyor.
4. Gerçek bir deneme talebi panelde görünüyor; not/takip/durum değişimi ve yeniden başlatma sonrası kalıcılık doğrulanıyor.
5. Panelde gerçek HTTPS site adresi girilince `/sitemap.xml` doğru kökeni ve yayındaki içerikleri içeriyor. Yönetim ve API sayfaları indekslenmiyor.
6. Otomatik yedek, disk doluluğu, süreç sağlığı ve sertifika yenileme izleniyor.

## Bilinen sınırlar

Müşteri üyeliği, bayi/personel rolleri, özel PDF arşivi, talep süreçleri ve bildirim kuyruğu eklendi; [yeni yönetim rehberine](MUSTERI-VE-YONETIM.md) bakın. Gerçek e-posta/SMS/WhatsApp gönderimi için sağlayıcı bağlantısı gerekir. MFA ve çevrimiçi ödeme entegrasyonu yoktur. İlk kurulum içerikleri, hukuki metinler ve teknik bilgiler firma tarafından doğrulanmalıdır. Belgesiz sertifika, müşteri sayısı, kesin fiyat/teslim süresi veya garanti iddiası yayımlamayın. Görseller özgün konsept çizimleridir; gerçek uygulama gibi sunmayın. Ticari fotoğraflarınızı kullanım izinleriyle ekleyin.

Giriş/form/PDF hız sınırları SQLite'da kalıcıdır; tek sunucu kullanımı hedeflenir. Yatay ölçekleme için ortak veri, dosya ve oturum mimarisi gerekir. Güvenlik testleri riski azaltır; sürekli güncelleme ve sunucu güvenliğinin yerini almaz.
