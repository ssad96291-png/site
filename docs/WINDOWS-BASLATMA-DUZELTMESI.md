# Windows başlangıcında şifreli veri tabanı kayıt hatası

29 Ekim 2026 düzeltmesi; `e2b0cb1` sürümünün Windows/Node 26.13.0 hata bildirimi üzerine hazırlandı. Veritabanı biçimi ve anahtar değiştirilmez; ayrıntılı tasarım ve yönetim özellikleri korunur.

## 1. Mevcut kurulum için küçük düzeltme

Küçük paket: [windows-startup-fix-e2b0cb1.zip](https://github.com/ssad96291-png/site/raw/refs/heads/codex/windows-startup-fix-20261029/docs/patches/windows-startup-fix-e2b0cb1.zip). Bu paket yalnız `site-e2b0cb1e432a10a17e76b8cdea3cac078a6f603d` / aynı kaynak sürümü içindir. Başka sürümlerde tam güncel kaynak ZIP'ini kullanın.

1. Çalışan terminalde **Ctrl+C** ile uygulamayı durdurun.
2. Mevcut proje klasörünü, özellikle `.data` klasörünün tamamını ve yanında bulunan `.data.key` dosyasını güvenli biçimde yedekleyin. Anahtar dosyası yoksa elinizde olmayan bir anahtar üretmeye çalışmayın; kullanılan dış anahtar/secret yöntemini koruyun.
3. Küçük ZIP içindeki `server`, `scripts`, `docs` klasörlerini ve kök dosyaları mevcut projenin **`package.json` dosyasının bulunduğu klasöre** kopyalayın. Aynı adlı kaynak dosyalarını değiştirin. Yeni bir iç içe `site-*` klasörüne kopyalamayın. Paket `.data`, `.data.key`, ilk parola veya müşteri dosyası içermez.
4. Aynı klasörde `BASLAT-WINDOWS.cmd` dosyasını açın veya şu komutları çalıştırın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm run dev
```

Yeni npm bağımlılığı eklenmedi; mevcut `node_modules` korunabilir. Paket yüklü değilse önce `npm ci` gerekir. Yeni `predev` adımı önce geçici bir alanda şifreli kayıt/yeniden açma kontrolü yapar; başarılı olursa API ve Vite başlar.

## 2. Tam kaynak ZIP'iyle güncellemek

Sunucuyu durdurup yedek aldıktan sonra tam ZIP'i ayrı klasöre çıkarın. Mevcut `.data` klasörünün tamamını ve **özgün** `.data.key` dosyasını yeni `package.json` yanına kopyalayın; aynı veriyle iki sunucuyu açmayın. `npm ci` ve `npm run dev` çalıştırın. İlk parolanız henüz değiştirilmediyse `.data.initial-admin-password` dosyasını da ayrı koruyun. Üretimde dış secret kullanılıyorsa aynı anahtar yöntemi uygulanır.

## 3. Ne değişti?

- Windows'un geçici `EPERM`, `EACCES`, `EBUSY` dosya kilitleri en fazla 300 ms yeniden denenir. Eski veritabanı dosyası yeni kayıt uğruna önce silinmez.
- İlk ayarlar ve başlangıç içerikleri tek işlemde kaydedilir; başlangıçta her kayıt için dosya değiştirme yapılmaz. Başarısız ilk kaydın ardından eksik başlangıç durumu korunmaz.
- Hata mesajı artık `aşama=serialize/create/write/sync/replace/...` ve güvenli hata kodunu içerir. SQL, kişisel veri, anahtar veya özel dosya yolu tanılamaya eklenmez.
- Geçici dosya temizliği/rollback/kapatma hatası, asıl kayıt hatasını gizlemez.
- `npm run diagnose`, aynı veri diski üzerinde geçici bir şifreli veritabanını açıp kapatır. Gerçek veri tabanını veya gerçek anahtarı açmaz/değiştirmez.

## 4. Devam ederse

```cmd
npm run diagnose
```

`aşama` ve `kod` satırı kullanılmalıdır; genel Vite `ECONNREFUSED` mesajı API'nin başlayamamasının sonucudur. `ENOSPC` boş alanı, `EACCES/EPERM/EBUSY` erişim veya dosya kullanımını, `serialize` ise görüntü hazırlama aşamasını işaret eder. Bunlar tek başına kesin neden veya antivirüsün hatası olduğu kanıtı değildir. `.data` ve anahtarı silmek çözüm değildir.

## 5. Doğrulama sınırı

Güncel kaynakla Node 24.19.0 ve aynı resmî Node 26.13.0 sürümünde 146'şar API/güvenlik testi geçti. Her iki sürümde gerçek `npm run dev`, Vite üzerinden API erişimi ve aynı kayıtların yeniden açılması doğrulandı. İlgili 17 tarayıcı kontrolü, istemci/sunucu derlemesi başarılıdır. Windows dosya kilidi davranışı kontrollü hatalarla test edildi; bu ortamda gerçek Windows oturumu çalıştırılmadı. Kullanıcının önceki genel hata mesajı gerçek sebebi sakladığı için kesin işletim sistemi nedeni belirlenmiş değildir.

Aşamalı devir kaydı: [09 · Windows kayıt düzeltmesi](DEVAM/09-WINDOWS-KAYIT-DUZELTMESI.md).
