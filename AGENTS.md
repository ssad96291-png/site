# Projede devam eden yapay zekâ ve geliştiriciler için

Bu dosya kullanıcının açık isteğiyle hazırlanmıştır: çalışmalar, kararlar, hatalar ve devam noktası aşama aşama dosyalarda tutulmalı; sonraki modeller de kayda ekleyerek çalışmalıdır.

## Başlangıçta okuyun

1. [Okuma sırası ve aşamalar](docs/DEVAM/00-ONCE-OKU.md).
2. [Son durum ve devam noktası](docs/DEVAM/07-SON-DURUM-VE-DEVAM.md).
3. Değiştireceğiniz alanın ilgili aşaması ve [güncel güvenlik/taşıma rehberi](docs/VERI-GUVENLIK-VE-DESTEK.md).

Kayıtların bazıları geçmiş konuşma, Git commitleri ve önceki rehberlerden yeniden kurulmuştur. Gerçekte gözleneni, kullanıcının talebini ve varsayımı ayrı değerlendirin. Yeni kullanıcı talimatı önceki kararı değiştirirse değişikliği gerekçesiyle kaydedin.

## Korunacak ürün kararları

- Kullanıcı ayrıntılı yeşil/krem tasarımı ve Kurumsal bölümünü beğeniyor. Özgünleştirme gerekçesiyle özellikleri topluca kaldırmayın.
- Firma Etimesgut'taki tek dükkândır; bayilik/franchise, bayi başvurusu veya bayi ağı eklemeyin. Teknik personel firma içi operasyon içindir.
- Üyelik zorunlu olmadan fiyat/proje başvurusu yapılabilir. Misafir erişimi yalnız doğrulanan talebe aittir; aynı e-posta geçmiş kayıtları otomatik bağlamaz.
- Müşteriye açık yanıt ile ekibe özel iç notu ayırın; taslak teklif ve diğer müşterinin verisini göstermeyin.

## Veri ve çalışma güvenliği

- Gerçek `.data`, anahtar, bootstrap parolası, müşteri yüklemesi, token ve kurtarma bağlantısını Git'e, notlara veya sohbete koymayın. Örnekler sentetik olmalıdır.
- `.data` ile özgün anahtarı koruyun. Anahtarın yeri veri klasörünün dışıdır; yeni anahtar eski şifreli veriyi açmaz. Veri geçişinden önce sunucu durdurulmalıdır.
- Bu ortamda `work` dalında korunmuş yerel değişiklikler vardır. Önce gerçek `git status` ve dal durumunu inceleyin; önceki işi temizlemek için reset/checkout yapmayın. Önceki teslimler ayrı dallarda geçici index ile oluşturulmuştur.
- Gerçek ClamAV imzaları, canlı yayın, gerçek Windows oturumu veya hukuki inceleme yapılmadıysa yapılmış gibi raporlamayın. Protokol taklidi gerçek antivirüs testi değildir; hiçbir sisteme mutlak sızılmazlık/telif güvencesi vermeyin.

## Her anlamlı çalışma sonunda

1. [Şablondan](docs/DEVAM/08-SONRAKI-CALISMA-SABLONU.md) yeni, artan numaralı aşama dosyası oluşturun; ilk yeni dosya `10-<konu>.md` olabilir.
2. İstek, başlangıç durumu, değişen dosyalar, kararın nedeni, hata/düzeltme, gerçek test sonucu ve kalan tek somut adımı yazın.
3. [Çalışma günlüğüne](docs/DEVAM/06-CALISMA-GUNLUGU.md) yeni satır ekleyin; [son durum dosyasını](docs/DEVAM/07-SON-DURUM-VE-DEVAM.md) güncelleyin. Yeni aşama bağlantısını okuma sırasına ekleyin.
4. Önceki tarihsel kayıtları topluca değiştirmek yerine yeni düzeltme kaydı ekleyin. `07` güncel durum dosyasıdır; yeni durumla yenilenmesi beklenir.
5. Değişikliğe uygun kontrolleri çalıştırın; çalışmayan/dış servise bağlı kalan kısmı açıkça belirtin. Sadece belge değişikliğinde bağlantı ve tutarlılık kontrolü yeterlidir.
