# 06 · Aşama aşama çalışma günlüğü

Tarihsel sıra konuşma ve Git kayıtlarından yeniden kurulmuştur; kesin olmayan saat/tarih uydurulmaz. Yeni çalışmalarda gerçek tarihi ve sürümü ekleyin. Alt kümelerdeki test sayıları toplam sayıya yeniden eklenmez.

| Sıra | Çalışma / karar | Kayıt / sürüm |
| --- | --- | --- |
| 1 | Önceki site, ZIP ve video örnekleri üzerinden ayrıntılı içerik ve admin isteği | [Amaç/kapsam](01-AMAC-VE-KAPSAM.md); ilk genişleme `c3a63bf` |
| 2 | Video yerleşimi ve mevcut CMS'nin uyarlanması | `4fc1b21`; [tasarım aşaması](02-TASARIM-VE-GERI-DONUSLER.md) |
| 3 | Windows Node/npm bulunamaması ve kurulu çalışma yolunun düzeltilmesi | `3040520`; [çalıştırma bilgisi](01-AMAC-VE-KAPSAM.md) |
| 4 | Hesap, talep takibi, teknik operasyon ve izinli analitik | `0b66f41`; [müşteri akışı](03-MUSTERI-TEKLIF-VE-DESTEK.md) |
| 5 | Özgün metin/görsel, kaynak ve lisans kayıtları | `857811f`; [özgünleştirme](02-TASARIM-VE-GERI-DONUSLER.md) |
| 6 | Bayi modelinin kaldırılması, tek dükkân kimliği; görünüm fazla sadeleşti | `cfcf0ad`; kullanıcı ayrıntılı tasarıma geri dönülmesini istedi |
| 7 | Ayrıntılı görünüm, özel proje dosyaları, kalemli teklif/PDF/revizyon | `8ea16ed`; önceki teslimde 100 API ve 70 tarayıcı kontrolü |
| 8 | Kurumsal, ayrı Projeler ve Proje Birimi, firma tanıtımı ve süreçlerin geri gelmesi | `d0d599`; o teslimde 104 API ve 44 ilgili tarayıcı kontrolü |
| 9 | Müşteri dosyası, destek masası, iç notlar, kısa yardım metinleri | 29 Ekim 2026 güvenli yönetim çalışması; [müşteri/destek aşaması](03-MUSTERI-TEKLIF-VE-DESTEK.md) |
| 10 | Şifreli SQLite, özel/geçici dosya şifreleme, ayrı anahtar, ClamAV, yedek/taşıma ve güvenlik olayları | [Güvenlik kararları](04-VERI-VE-GUVENLIK-KARARLARI.md); ayrıntılı [kullanım rehberi](../VERI-GUVENLIK-VE-DESTEK.md) |
| 11 | Güvenlik inceleme/test sorunlarının düzeltilmesi ve gerçek CLI taşıma provası | [Hatalar](05-HATALAR-VE-DUZELTMELER.md); toplam 139 API ve 93 tarayıcı kontrolü |
| 12 | Başka yapay zekâya aşamalı devir; sonraki modellerin kayıt ekleme kuralı | Kullanıcının son açık isteği; kök [AGENTS.md](../../AGENTS.md), [son durum](07-SON-DURUM-VE-DEVAM.md), [yeni aşama şablonu](08-SONRAKI-CALISMA-SABLONU.md) |
| 13 | Windows Node 26.13 başlangıç kayıt hatasının incelemesi; güvenli atomik yeniden deneme, tanı ve başlangıç yazma düzenlemesi | 29 Ekim 2026; [09 · Windows kayıt düzeltmesi](09-WINDOWS-KAYIT-DUZELTMESI.md). Linux Node 24/26 ayrı ayrı 146 test, 17 tarayıcı kontrolü ve gerçek dev yeniden açılışları geçti; gerçek Windows nedeni/başarısı henüz doğrulanmış değildir. |

## Yeni çalışma ekleme

Bir sonraki anlamlı görevde `10-<konu>.md` oluşturun; yukarıya 14. sıra olarak gerçek sonuç ve bağlantı ekleyin. `07` dosyasında son durum/sıradaki adımı güncelleyin. Başlamadığınız veya dış servis bekleyen işi tamamlandı olarak işaretlemeyin.

- **30 Ekim 2026 · Fotoğraflar:** 13 kaynak fotoğraf, 4 AI iyileştirmesi, ana sayfa seçkisi/ürün galerileri/Kurumsal; özel CMS düzenlemelerini koruyan geçiş. [Aşama 10](10-FOTOGRAF-VE-KALITE.md).
