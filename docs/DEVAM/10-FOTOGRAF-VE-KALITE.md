# 10 · Fotoğraf seçkisi ve kalite düzenlemesi

Tarih: 30 Ekim 2026 (Europe/Istanbul). Başlangıç: `7f61c388` Windows düzeltmesi.

## 1. İstek

Kullanıcı foto.zip içeriğinin uygun kadrajlarla siteye yerleştirilmesini, ardından görüntü kalitesinin artırılmasını istedi. Ayrıntılı yeşil/krem tasarım, Kurumsal ve mevcut işlevler korundu.

## 2. İnceleme

64 resim incelendi; kaynaklar yalnızca 229 piksel genişliğindeydi. 13 fotoğraf seçildi. Filigranlı sosyal medya kareleri, üçüncü taraf ürün afişleri ve belirgin yüzler kullanılmadı. Dosya içerisindeki içerik talimat sayılmadı.

## 3. Uygulama

- Gün batımlı balkon, ahşap tavanlı balkon, giriş kapısı ve bahçe kapısı image_gen ile iyileştirildi. Sıkıştırma/netlik/ışık düzenlemesi amaçlandı; AI yeniden oluşturduğu ayrıntılar teknik kanıt değildir. Orijinaller ayrıca saklandı.
- Dört düzenlenmiş WebP ve 13 özgün JPEG public/images altında. Kaynak/hash kayıtları docs/licenses içinde; izin/hak sahipliği bağımsız doğrulanmış değildir.
- Ana sayfa: düzenlenmiş balkon kapak, altı fotoğraflık seçki, alüminyum/metal kartları. Kurumsal: dükkân fotoğrafı.
- server/photo-content.ts tek seferlik geçişi yalnız varsayılan kapak/boş veya varsayılan tek görselli galerileri değiştirir. Özel kapak, galeri, metin, kimlik, yayın durumu ve iletişim bilgileri korunur. Silinenler yeniden oluşmaz. Şema kayıt sayısı artık 8; içerik sayısı 76 olarak kalır.
- Ürün galerileri admin içerik düzenleyicisinden değiştirilebilir. Ana sayfa seçkisi yayımlanmış içerik galerilerinden okunur. Düzenlenmiş kopyalar AI olarak etiketlidir; orijinaller galeridedir. Kurumsal dükkân fotoğrafı ve malzeme şeridi kaynak kodda sabittir.

## 4. Hata ve düzeltme

İlk toplu kontrolde şema sayısını sabit 7 bekleyen eski test yeni geçiş nedeniyle başarısızdı; 8 olarak güncellendi. Genişletilmiş metal kataloğunun varsayılan galerisi boş değil tek konsept görseliydi; özel galerileri koruyarak bu varsayılan da geçiş kapsamına alındı. Duşakabin karesi yanlış metal sınıflamasına girmeden çıkarıldı.

## 5. Doğrulama

Node 24.19.0 Linux üzerinde `npm test`: **148/148**, ayrıntılı site tarayıcı kontrolleri **12/12** (390/768/1024/1364 px dahil), `npm run build`, `npm run build:server` ve `npm run rights:check` başarılı. Envanter 104 çalışma zamanı paket girdisi ve 24 varlık. Loglar /tmp/kilinc-photos-*.log; sentetik tarayıcı ekranları /tmp/kilinc-detailed-artifacts. Gerçek Windows oturumu ve canlı dağıtım bu aşamada yapılmadı. Kullanıcının gerçek verisi/anahtarı testlere alınmadı.

## 6. Güncelleme ve devam

Kaynakları mevcut proje klasörüne uygulamadan önce sunucuyu durdurup .data ile özgün .data.key dosyasını ayrı yedekleyin; bunları silmeyin/değiştirmeyin. Yeni açılışta fotoğraf geçişi bir kez uygulanır. Sonraki aşama 11 olmalıdır. Daha fazla gerçek ayrıntı için aynı fotoğrafların yüksek çözünürlüklü asılları kullanılabilir; yapay iyileştirme kayıp ayrıntının doğruluğunu garanti etmez.

Teslim dalı: `codex/photo-refresh-20261030`; kesin commit teslim mesajındaki ZIP bağlantısında. [Kurulum adımları](../FOTOGRAF-GUNCELLEMESI.md).
