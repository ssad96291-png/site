# 09 · Windows'ta şifreli veri tabanı kayıt hatasının düzeltilmesi

Tarih: 29 Ekim 2026 (Europe/Istanbul). Başlangıç sürümü: `e2b0cb1e432a10a17e76b8cdea3cac078a6f603d` güvenli yönetim/devir teslimi. Ayrıntılı Kurumsal tasarım, müşteri/destek/teklif ve veri koruma kararları korunur.

## 1. Kullanıcının gözlediği hata

Windows'ta Node **26.13.0** bulunuyor; Vite açılıyor. API ise başlangıç içerik geçişinin `COMMIT` adımında `Şifreli veri tabanı diske kaydedilemedi` hatasıyla kapanıyor. Sonraki `/api/site` için `ECONNREFUSED 127.0.0.1:3000`, API'nin kapanmasının sonucudur; bağımsız bir Vite/proxy sorunu olduğuna kanıt değildir.

Eski kayıt kodu SQLite görüntüsünü çıkarma ile dosyayı değiştirme hatalarını aynı mesajda topluyor ve asıl hatayı saklıyordu. Bu nedenle verilen günlükten disk alanı, Windows dosya kilidi veya Node sürümü tek başına kesin neden olarak belirlenemez. Gerçek Windows hata kodu bu oturumda alınamadı.

## 2. Karşılaştırma ve inceleme

Resmî Node **26.13.0 Linux** paketiyle temiz başlangıç ve iki yeniden açılış denendi; karşılaştırma aşamasında 142 test geçti. Bu sonuç Node 26'nın bütünüyle uyumsuz olduğunu göstermedi; gerçek Windows dosya davranışının doğrulanması yerine geçmez.

İncelemede Windows'ta antivirüs/dizinleyici gibi bir süreç dosyayı kısa süre açık tuttuğunda tek `rename` denemesinin geçici `EPERM`, `EACCES` veya `EBUSY` ile başarısız olabileceği görüldü. Bu, raporlanan hatanın kanıtlanmış nedeni değil; kayıt yolunda giderilen somut dayanıklılık eksikliğidir.

## 3. Yapılan düzeltmeler

1. `server/atomic-file.ts`: Windows'ta yalnız belirtilen geçici değiştirme hatalarını, toplam en fazla **300 ms** beklemeyle yeniden dener. Önceki hedef dosya hiçbir aşamada silinmez. Kalıcı hata özgün hata bilgisiyle döner; Windows dışı ve kalıcı hatalar bekletilmez.
2. `server/secure-database.ts`: görüntü çıkarma ve dosyaya kaydetme aşamalarını ayıran, güvenli hata aşaması/kodu bilgisi eklenir. Geçici dosya temizleme hatası ilk hatayı örtemez. Anahtar, kayıt içeriği veya SQL parametresi günlüklenmez.
3. `server/app.ts`: başlangıç içeriği işlemler halinde topluca yazılır; ilk açılışta gereksiz sayıda şifreli görüntü/dosya değişimi azaltılır.
4. `scripts/check-startup.mjs`: `predev` ve `npm run diagnose` ile aynı dosya sisteminde yalıtılmış şifreli kayıt/açma denemesi yapar. Kullanıcının gerçek `.data` veya özgün anahtarını açmaz; kendi geçici alanını kullanır. Başlangıç kontrolü başarısızsa Vite/API birlikte başlatılmış gibi gösterilmez.

Şifreli dosya biçimi, var olan anahtar ve müşteri verisi değiştirilmez. Şifreleme kaldırılmaz; hata çözümü olarak veri sıfırlanmaz. Sadece bu günlük nedeniyle Node'u kaldırıp yeniden kurma kararı alınmadı.

## 4. Hata ve doğrulama ayrımı

- Önceki genel hata, diske yazma sorunu kesinmiş gibi görünen yetersiz bir açıklamaydı; görüntü çıkarma hatası da aynı yere düşebiliyordu.
- Atomik değiştirme için üç kontrollü test: kısa kilit sonrası başarı, kalıcı hatada eski dosyanın korunması, Windows dışı/kalıcı hatada yeniden denememe. Bunlar enjekte edilen dosya sistemi davranışlarıdır; gerçek Windows çalıştırması değildir.
- Son doğrulamada Node 24.19.0 ile **146/146**, resmî Node 26.13.0 ile **146/146** API/güvenlik testi geçti. Karşılaştırma aşamasındaki 142 sonucu bu son sayıyla toplamayın.
- **17 tarayıcı kontrolü** geçti: proje/teklif 11, veri/güvenlik merkezi 6. İstemci/sunucu derlemeleri ve TypeScript başarılı. Önceki 93 tarayıcı kontrolü önceki teslimin sonucudur; bu aşamada hepsinin tekrarlandığı iddia edilmez.
- Gerçek `npm run dev`, hem Node 24 hem Node 26 ile aynı şifreli veri ve aynı anahtarla denendi: ön kontrol, Vite üzerinden `/api/site`, 76 içerik ve yeniden başlatmada aynı kayıt kimlikleri doğrulandı. Bu çalışmalar **Linux** üzerinde yapıldı; gerçek Windows çalıştırması değildir.

## 5. Kullanıcının kurulumunu koruyarak güncelleme

1. Eski uygulama penceresinde **Ctrl+C** ile sunucuyu durdurun.
2. `.data` klasörünün tamamını ve özgün `.data.key` dosyasını ayrı güvenli bir yere yedekleyin. Varsa henüz değiştirilmemiş ilk parola dosyasını da koruyun.
3. Mevcut `e2b0cb1` kaynak klasörüne küçük düzeltme ZIP’inin kaynak dosyalarını ekleyip üzerine yazabilirsiniz; `.data` veya anahtar pakette yoktur. Alternatif olarak tam yeni kaynak klasörüne aynı `.data` ve aynı anahtarı taşıyın. Eski ve yeni sunucuyu aynı veriyle eş zamanlı çalıştırmayın. Ayrıntı: [Windows düzeltme rehberi](../WINDOWS-BASLATMA-DUZELTMESI.md).
4. `package.json` klasöründe `npm ci`, ardından `npm run dev` çalıştırın. Daha önce çalışan Windows PATH komutu gerekirse [kurulum aşamasındadır](01-AMAC-VE-KAPSAM.md).
5. Hata sürerse `npm run diagnose` çalıştırıp anahtar/parola içermeyen aşama ve hata kodunu değerlendirin. Gerçek veri dosyalarını ya da anahtarı sohbete yüklemek gerekmez.

Bu kaynak güncellemesi, kullanıcının bilgisayarındaki klasörü kendiliğinden değiştirmez. Canlı ClamAV/HTTPS/hosting işleri önceki rehberdeki ayrı gereksinimler olarak kalır.

## 6. Sonuç ve sonraki adım

Kod ve otomatik testler düzeyindeki düzeltmeler tamamlandı; yukarıdaki iki Node sürümü ve Linux başlangıç kanıtı alındı. Teslim hedef dalı **`codex/windows-startup-fix-20261029`**; başlangıç commit’i `e2b0cb1e432a10a17e76b8cdea3cac078a6f603d`. Mevcut sürüme uygulanabilecek küçük kaynak yaması `docs/patches/windows-startup-fix-e2b0cb1.zip` olarak hazırlanır; tam kaynak ZIP’i de teslim edilir. Kesin commit/indirilebilir adresler teslim mesajındadır.

Gerçek Windows başarısı bu testlerle kanıtlanmış değildir. Kullanıcıda hata sürerse ilk somut adım, yeni `npm run diagnose` çıktısındaki aşama ve özgün hata kodunu incelemektir. Veri veya özgün anahtar sıfırlanmaz.
