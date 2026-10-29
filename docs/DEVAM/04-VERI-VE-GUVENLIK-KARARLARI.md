# 04 · Veri ve güvenlik kararları

## 1. Mevcut veri tabanı ve yeni koruma

Site zaten SQLite kullanıyordu. Son istekte kalıcı kayıtların şifrelenmesi ve taşınabilirliği geliştirildi. Yeni bağlantı native SQLite'ı bellekte çalıştırır; kalıcı `site.sqlite.enc` AES-256-GCM ile doğrulanan şifreli anlık görüntüdür. Eski SQLite/WAL kayıtları okunur, şifreli geçiş yedeği doğrulanır, ardından eski açık dosyalar kaldırılır. Eski sunucu yükseltmeden önce tamamen durmalıdır.

Bu tasarım tek süreç içindir; varsayılan 64 MiB veri tabanı sınırı vardır (en fazla 256 MiB yapılandırma). Büyük ölçekte farklı veri tabanı sunucusuna planlı geçiş gerekir. Karar mevcut native SQL API'sini ve kayıtları korumak için alındı; şifrelemeyi olmayan SQLite PRAGMA key ayarıyla taklit etmekten kaçınıldı.

## 2. Anahtar ve özel dosya

Yerel anahtar `<DATA_DIR>.key` dosyasında, veri klasörünün dışındadır. Üretimde dış secret dosyası veya güvenli ortam değişkeni gerekir. Yanlış/kayıp anahtarda yeni anahtarla eski verinin üzerine yazılmaz.

Özel PDF/proje dosyaları ayrıca AES-256-GCM ile şifrelenir; dosya konumu doğrulamalı veriye bağlanır. Proje yüklemesinin geçici diski de istek belleğindeki geçici anahtarla şifrelenir. İlk admin parolası veri dizini dışına taşındı; parola değişince silinir.

## 3. Zararlı dosya denetimi

Ad/uzantı/gerçek imza/boyut/etkin içerik kontrolleri ve ClamAV INSTREAM bağlantısı vardır. Üretimde temiz tarama yanıtı alınmazsa yükleme/özel indirme engellenir. Yerel geliştirmede ClamAV yoksa sadece sınırlı denetim gösterilir; temiz antivirüs taraması iddia edilmez. EICAR test imzası her durumda reddedilir. Dosya sunucuda çalıştırılmaz; özel indirme yetkiyle ve ek dosya olarak sunulur.

## 4. Yedek ve taşıma

Admin parolasını tekrar doğrulayarak şifreli `.kilincbackup` ve anahtarı ayrı indirir. Anahtar pakete konmaz. Geri yükleme mevcut klasörün üzerine yazmaz; yeni hedef ister. İsteğe bağlı iş verisi JSON'u açıkça `--allow-plaintext` verilince oluşturulur; kimlik doğrulama sırlarını ve dosya içeriklerini taşımaz. Güncel komutlar: [güvenlik/taşıma rehberi](../VERI-GUVENLIK-VE-DESTEK.md).

## 5. Korumanın sınırı

Şifreleme tek başına disk/yedek ele geçirildiğinde önemlidir. Uygulama süreci ve anahtar birlikte ele geçirilirse mutlak koruma sağlamaz. HTTPS, güvenli hosting, güncel ClamAV imzaları, güçlü parolalar ve ayrı yedek birlikte gerekir. Gerçek canlı sunucu/Windows oturumu/ClamAV motoru kurulumu bu geliştirmede yapılmadı. Oturum, yetki, kaynak denetimi ve hız sınırları test edilmiştir; bu bir tam sızma testi garantisi değildir.
