# 07 · Son durum ve devam noktası

Kayıt tarihi: 29 Ekim 2026. Bu kayıt, güvenli yönetim sürümü ve başka yapay zekâya devir isteği tamamlanırken hazırlanmıştır. Önce [okuma sırasını](00-ONCE-OKU.md), ardından ihtiyacınız olan aşama dosyasını okuyun.

## Son güncelleme: Fotoğraf seçkisi (30 Ekim 2026)

Kullanıcının foto.zip arşivinden 13 fotoğraf seçildi; dört kare AI ile iyileştirildi ve açıkça etiketlendi. Ana sayfa, ürün galerileri ve Kurumsal görselleri güncellendi. Ayrıntılar [10 · Fotoğraf ve kalite](10-FOTOGRAF-VE-KALITE.md). Mevcut düzenlenmiş kapak/galeriler korunur; yeni tek seferlik geçişle şema kayıt sayısı 8 olur. 148/148 sunucu testi ve 12/12 tarayıcı kontrolü; istemci/sunucu derlemesi ve hak envanteri kontrolü başarılı. Teslim dalı `codex/photo-refresh-20261030`. [Güncelleme adımları](../FOTOGRAF-GUNCELLEMESI.md). Sonraki kayıt 11 olmalıdır. Önceki Windows düzeltmesi kaynakta korunmuştur.

## Önceki güncelleme: Windows kayıt düzeltmesi

Kullanıcı `e2b0cb1` sürümünü Windows Node **26.13.0** ile açarken şifreli kayıt hatası bildirdi. API kapanınca Vite `/api/site` için bağlantı reddi gösterdi. Son iş, bu kayıt yolunu veri/anahtar koruyarak düzeltmek ve daha açıklayıcı tanı eklemekti; kod ve otomatik kontroller tamamlandı. Ayrıntı ve gerçek/doğrulanmamış bulgular [09 · Windows kayıt düzeltmesi](09-WINDOWS-KAYIT-DUZELTMESI.md) dosyasındadır.

Windows'a özel atomik değiştirme yeniden denemesi en fazla 300 ms'dir; önceki hedef silinmez. Kayıt aşaması/hata kodu ayrılır, başlangıç içerik yazıları işlemlerde toplanır ve `npm run diagnose` gerçek veriye dokunmadan aynı dosya sisteminde yalıtılmış kontrol yapar. Şifreli biçim ve özgün anahtar korunur. Resmî Node 26.13.0 **Linux** karşılaştırması temiz açılış/iki yeniden başlatmada başarılıdır; gerçek Windows çalıştırması yapılmış değildir. Son kanıt: Node 24.19.0 ve resmî Node 26.13.0 ile ayrı ayrı **146/146 API/güvenlik testi**, **17 tarayıcı kontrolü**, istemci/sunucu derlemesi ve TypeScript başarılı. Her iki Node sürümünde gerçek `npm run dev` aynı şifreli veri/anahtarla açıldı; Vite proxy üzerinden 76 içerik ve yeniden başlatmada aynı kayıt kimlikleri doğrulandı. Bu son testler Linux üzerindedir.

Sonraki model, kullanıcı hatanın sürdüğünü bildirirse önce yeni tanı çıktısının aşama/kodunu incelemelidir; `.data` ve anahtarı sıfırlama önerilmez. Aşağıdaki güvenli yönetim özeti ve 139/93 sonuçları **önceki `e2b0cb1` teslimine** aittir.

## Önceki güvenli yönetim aşamasındaki kullanıcı isteği

Kullanıcı ayrıntılı tasarımı beğendi. Sonraki isteği: daha ayrıntılı ve açıklamalı admin paneli; üye/misafir hesapları, sorunları, mesajları ve dosyalarının tek yerde yönetilmesi; ileride başka siteye taşınabilecek veri tabanı; zararlı yükleme önlemleri ve veri şifreleme. Ardından başka bir yapay zekâyla devam edeceğini, yapılanları/kararları/hataları aşamalar halinde dosyalamayı ve sonraki modellerin de bu kaydı sürdürmesini istedi.

## Tamamlanan son geliştirme

1. **Müşteriler:** üye/misafir filtresi; müşteri dosyasında talepler, iki tür yazışma, dosyalar, teklifler, destek ve güvenli oturum özeti. Önceki profil düzeltme, askıya alma, kurtarma ve oturum kapatma korunur.
2. **Destek & hesap sorunları:** müşteri destek kaydı açar/yanıtlar; yetkili ekip durum, öncelik, sorumlu ve yanıtı yönetir. İç notlar müşteriye aktarılmaz. Misafirden üyeye doğrulanan talebin destek kaydı da taşınır.
3. **Nasıl kullanılır?:** bölüm bazında kısa açılır açıklamalar. Ana yöneticiye ayrı **Veri, yedek & güvenlik** ekranı.
4. **Veri tabanı:** native SQLite bellekte; kalıcı dosya `.data/site.sqlite.enc`, AES-256-GCM ile doğrulamalı şifreli anlık görüntü. Eski SQLite/WAL için güvenli geçiş. Özel PDF/proje dosyaları ve proje yüklemesinin geçici disk içeriği de şifreli.
5. **Dosya denetimi:** ClamAV INSTREAM bağlantısı; üretimde temiz yanıt olmadan dosya kabulü/özel indirme yok. Yerelde ClamAV yoksa açıkça sınırlı denetim. Üretim testleri gerçek motor yerine protokol taklidi kullandı.
6. **Taşıma:** parola doğrulamalı şifreli `.kilincbackup` ve ayrı anahtar indirme; yeni klasöre geri yükleme; bilerek izin verilen, kimlik doğrulama sırlarını dışarıda bırakan iş verisi JSON aktarımı.
7. **Devir kaydı:** kök `AGENTS.md`, bu aşama dosyaları ve sonraki çalışma şablonu eklendi.

## Önemli dosya haritası

| İş | Başlangıç dosyaları |
| --- | --- |
| Genel API ve uygulama açılışı | `server/app.ts` |
| Hesaplar, roller, talep akışı | `server/portal.ts`, `server/single-shop.ts` |
| Destek / müşteri dosyası | `server/customer-service.ts`, `src/admin/CustomerWorkspace.tsx`, `src/customer/SupportCenter.tsx` |
| Şifreli SQLite ve kilitleme | `server/secure-database.ts` |
| Windows atomik değiştirme | `server/atomic-file.ts` |
| Gerçek veriye dokunmayan ön kontrol / tanı | `scripts/check-startup.mjs` |
| Özel dosyaların şifrelenmesi | `server/private-storage.ts` |
| Dosya denetimi ve yükleme | `server/file-security.ts`, `server/project-requests.ts`, ilgili `portal.ts` yolları |
| Yedek / aktarım / güvenlik olayları | `server/data-portability.ts`, `server/data-cli.ts`, `server/system-center.ts` |
| Admin yardım / güvenlik merkezi | `src/admin/AdminHelp.tsx`, `src/admin/SystemCenter.tsx`, `src/admin/AdminApp.tsx` |
| Ayrıntılı site | `src/DetailedSite.tsx`, `src/detailed-site.css`, `src/App.tsx` |
| Teklifler / müşteri dosyaları | `server/offers.ts`, `src/admin/ProjectOffers.tsx`, `src/customer/ProjectQuotes.tsx` |
| Kurulum ve güvenlik rehberi | [VERI-GUVENLIK-VE-DESTEK.md](../VERI-GUVENLIK-VE-DESTEK.md) |

## Önceki güvenli yönetim tesliminin doğrulama kanıtı (`e2b0cb1`)

- **139 API/güvenlik/geçiş testi geçti:** `npm test`.
- **93 tarayıcı kontrolü geçti:** ayrıntılı site 12, kurumsal 9, CMS 12, müşteri 12, operasyon 11, proje/teklif 11, analitik 6, görsel kaynak kayıtları 6, yeni destek/müşteri dosyası 8, veri merkezi 6.
- `npm run build`, `npm run build:server`, `npm run rights:check` başarılı. Lisans/envanter: 104 çalışma zamanı paket girdisi ve 7 görsel/font.
- Derlenmiş üretim sunucusu güvenlik/teklif/dosya testi başarılı. Gerçek `npm run data:backup`, `data:restore` ve `data:export-json` komutları yalıtılmış verilerle çalıştı; eski hedefe yazma reddedildi.
- Son toplu API logu `/tmp/kilinc-platform-final-api.log`; browser logları `/tmp/kilinc-platform-*.log`, `/tmp/kilinc-support-admin-browser.log`, `/tmp/kilinc-system-browser.log`. Bunlar geçici çalışma ortamı kanıtıdır; başka bilgisayarda bulunmaları beklenmez. Tekrarlanabilir test kaynakları ZIP'tedir.

## Çalıştırma ve korunacak veri

Windows'ta Node **24.22.1**, npm **11.19.1** ile daha önce çalışan komutlar, `package.json` klasöründe:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Site `http://localhost:5173`, yönetim `/yonetim`, müşteri `/hesabim`. İlk kullanıcı adı `admin`; yeni kurulumdaki rastgele ilk parola `.data.initial-admin-password` dosyasındadır. Gerçek değerini notlara/sohbete eklemeyin.

Veri taşırken sunucuyu durdurun. **`.data` bütünü ile mevcut `.data.key` ayrı ayrı korunmalı.** Anahtar kaybolursa yeni anahtar eski veriyi çözmez. Üretimde anahtar veri dizini dışındaki secret dosyası veya güvenli ortam değişkenindedir. Güncelleme kullanıcının Windows klasörüne otomatik uygulanmış değildir; yeni kaynakla açılışta geçiş çalışır.

## Depo ve teslim durumu

Bu çalışma ortamında `work` checkout'u tarihsel ana dal başlığında kalırken önceki kaynak değişiklikleri korunmuştur. Teslimler geçici Git index'iyle ayrı commit/dallarda oluşturulmuştur. Kurumsal teslim `d0d599da36463571764094434aa046883eced1b3` (`codex/restore-corporate-20261029`), ardından güvenlik/yönetim/devir teslimi `e2b0cb1e432a10a17e76b8cdea3cac078a6f603d` (`codex/secure-admin-data-20261029`) yayımlandı. Son Windows kayıt düzeltmesinin hedef dalı **`codex/windows-startup-fix-20261029`**, başlangıç commit’i `e2b0cb1`dir. Küçük kaynak yaması `docs/patches/windows-startup-fix-e2b0cb1.zip` ve tam kaynak ZIP’i hazırlanır; kesin teslim commit’i/indirilebilir adres teslim mesajında verilir. [Windows düzeltme rehberi](../WINDOWS-BASLATMA-DUZELTMESI.md) güncelleme adımlarını açıklar. Paylaşılan klasördeki kaydedilmemiş işi koruyun; yeni görev başlangıcında gerçek `git status` ve dal durumunu okuyun.

## Canlıda ayrıca yapılacaklar

1. Gerçek hosting/alan adı ve HTTPS kurulumu; uygulama portunu genel erişime açmadan ters vekil arkasında çalıştırma.
2. Mevcut şifreleme anahtarının güvenli secret olarak bağlanması, dosya izinleri ve ayrı anahtar yedeği. Aynı veri dizininde tek uygulama süreci.
3. Gerçek ClamAV motoru, güncel imzalar ve iç ağ bağlantısı. Temiz dosya, EICAR, servis kesintisi ve özel indirme davranışını gerçek sunucuda sınama.
4. Düzenli şifreli yedek ve ayrı ortamda geri yükleme provası. Panel bir otomatik yedek takvimi kurmaz.
5. İsteniyorsa gerçek e-posta/SMS/WhatsApp sağlayıcısının kurulumu. Kuyruk veya `.eml` taslağı gerçek teslim değildir.
6. Gerçek iletişim bilgileri, kullanım izinli fotoğraflar, KVKK ve ticari metinlerin işletmeye göre tamamlanması. Kesin hukuki uygunluk/marka sicil taraması yapılmış değildir.

Yeni göreve bu listedeki bir adımdan veya kullanıcının yeni isteğinden devam edin. Varsayılan sınırlar: veri tabanı 64 MiB (en fazla 256 MiB yapılandırılabilir); panel yedeği 128 MiB; özel proje dosyası 20 MiB ve talepte en fazla 3 dosya. Bu sınırları ve tek süreç mimarisini değerlendirmeden büyük ölçekli kullanıma genellemeyin.
