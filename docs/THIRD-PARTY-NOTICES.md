# Üçüncü taraf lisansları ve görsel kaynak kaydı

Bu kayıt 28 Ekim 2026 incelemesinde, kurulu bağımlılıklar ve kilit dosyası üzerinden hazırlanmıştır. Bir telif uygunluk garantisi veya marka araştırması sonucu değildir.

## Dağıtımda korunacak kayıtlar

- [Tam lisans ve atıf metinleri](../public/licenses/THIRD-PARTY-NOTICES.txt) Vite tarafından üretim çıktısına kopyalanır; çalışan sitede `/licenses/THIRD-PARTY-NOTICES.txt` adresinde bulunur. Bu dosyayı dağıtımdan çıkarmayın.
- [Çalışma zamanı paket listesi](licenses/runtime-packages.json), paket sürümlerini, kaynaklarını ve tespit edilen lisanslarını kaydeder. Geliştirme araçlarının tamamını kapsamaz. Kaynak dağıtımı `node_modules` içermez; paketler kendi lisanslarıyla npm üzerinden kurulur. Docker taban imajı ve işletim sistemi paketleri kendi lisans kayıtlarını da içerir.
- [Görsel envanteri](licenses/asset-inventory.json), sunulan dosyaların SHA-256 özetlerini ve bilinen kaynak durumunu kaydeder. Kaynak beyanları [ayrı kayıtta](licenses/asset-sources.json) dosya yolu ve birebir özetle eşleştirilir; aynı dosya adında sonradan farklı içerik bulunması önceki kaynak kaydını devralmaz. Müşterinin sonradan yüklediği dosyalar ve mevcut veritabanı bu envanter kapsamında değildir.
- PDF için dağıtılan `server/assets/DejaVuSans.ttf` dosyasının lisansı [yanında saklanır](../server/assets/DejaVuSans-COPYRIGHT.txt). Bitstream Vera font lisansının metni ve DejaVu kamu malı değişiklik bildirimi korunur. Debian kaydındaki GPL bölümü Debian paketleme dosyalarına aittir; fontu GPL olarak yeniden etiketlemez.

## Bulunan lisans ayrıntıları

DM Sans ve Manrope, SIL Open Font License 1.1 ile; Lucide ikonları ISC ve belirtilen Feather kısımları MIT ile dağıtılır. Lisanslar ticari kullanım için koşullu izin verir; bu izin, yazı tipi veya ikon yazarlarının işletmeyi desteklediği anlamına gelmez. Yerel yazı tipleri yeniden adlandırılıp değiştirilmemiştir.

`fontkit@2.0.4`, `dfa@1.2.0` ve `brotli@1.3.3` kurulu paketlerinde ve karşılık gelen Git sürüm etiketlerinde bağımsız LICENSE dosyası bulunmaz; paket/README bilgisi MIT lisansını ve yazarı belirtir. Bu nedenle kaynak beyanı, yazar atfı ve standart MIT izin metni açıkça bir **tamamlayıcı kayıt** olarak eklenmiştir; upstream kaynaktan birebir alınmış telif bildirimi gibi sunulmaz. `brotli` çözücü dosyalarının ayrıca Google 2013 Apache 2.0 başlıkları, `fontkit` içindeki base64-arraybuffer kaynak atfı ve Lucide'ın Feather atfı da tam lisans metinleriyle korunur.

## Görseller hakkında kanıt sınırı

İlk kullanıcı kaynak paketinde bulunan SVG'lerin içinde “özgün” yazması tek başına hak sahipliği kanıtı değildir. Bu nedenle önceki `hero.svg`, `product-1…10.svg`, `project-1…6.svg` ve `article-1…4.svg` dosyaları yeni dağıtımın `public` klasöründen çıkarıldı; önceki veri kayıtlarındaki adresler, belgeli yeni görsellere yönlendirilir. Eski yüklenen ZIP dosyaları yeni kaynak dağıtımına dahil edilmez. Yeni üretilmiş görseller de otomatik olarak üçüncü kişi haklarından arınmış veya münhasır hak sağlamış sayılmaz. Görselleri gerçek tamamlanmış müşteri işi olarak sunmayın; gerçek bir projeyi yayınlarken fotoğrafın kullanım iznini, ilgili tasarım hakkını ve görünür kişi/adres bilgilerini ayrıca değerlendirin.

Bir internet sitesindeki referansın herkese açık olması; ekran görüntüsü, video, logo, metin veya fotoğrafı yeniden yayınlama izni vermez. Yüklenen referans videoları dağıtım paketine alınmamıştır. Kullanıcı kaynak paketinin sağlanmış olması da dosya haklarının otomatik devri anlamına gelmez.

## Kayıtları yenileme

```sh
node scripts/generate-rights-notices.mjs
node scripts/generate-rights-notices.mjs --check
```

İlk komut kurulu kilitli paketlerden kayıtları yeniler; ikincisi dosyaların güncel olduğunu doğrular. Yeni ve lisans metni eksik bir paket otomatik olarak onaylanmaz; betik inceleme hatası verir. Bağımlılık veya görsel değişikliğinde kaynak durumunu da insan olarak değerlendirin. Betik görsel benzerlik araması, marka sicili araştırması veya lisans sözleşmesi doğrulaması yapmaz.
