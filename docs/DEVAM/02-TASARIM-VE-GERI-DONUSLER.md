# 02 · Tasarım ve geri dönüşler

## 1. Ayrıntılı ilk yapı

İlk genişletme (`c3a63bf`) ürünler, projeler, bilgi içerikleri ve admin altyapısını büyüttü. Video benzeri yerleşim sonraki aşamalarda uygulandı; kullanıcı sonradan referansa fazla benzediğini belirtti.

## 2. Özgünleştirme

`857811f` sürümünde projeye ait görseller/metinler ve lisans kayıtlarıyla benzerlik azaltıldı. Kaynağı doğrulanamayan eski başlangıç SVG'leri dağıtımdan çıkarıldı; eski görsel adreslerine uyumlu yönlendirme kondu. Konsept görseller gerçek tamamlanmış müşteri işi olarak sunulmaz.

Bu işlem hukuki onay değildir. Önceki incelemede bazı resmî hukuk/sicil kaynaklarına ağ erişimi sağlanamadı; tam güncel marka/tasarım sicil taraması yapılmış gibi anlatılmamalıdır. Ayrıntı: [inceleme raporu](../TELIF-VE-MARKA-INCELEMESI.md).

## 3. Fazla sadeleştirme ve kullanıcı düzeltmesi

`cfcf0ad` tek dükkân kimliğini güçlendirirken tasarımı fazla sadeleştirdi. Kullanıcı önceki zengin görünümü tercih etti; sadece bayi kısmının olmamasını istedi. Sonraki karar, özgünleştirmeyi özellik silmek yerine metin/görsel/yerleşim ayrıntılarıyla sürdürmek oldu.

## 4. Ayrıntılı yapının geri gelmesi

`8ea16ed` ayrıntılı görünümü ve özel proje/teklif akışını getirdi. Ancak bazı sayfalar aynı ekrana yönlenmişti. `d0d599` ile bunlar ayrıldı:

- `/kurumsal`: firma tanıtımı, panelden değişen TR/EN metin ve dört süreç adımı; kapsamlı kaynak bağlantıları.
- `/projeler`: kendi kategori filtreli kartları ve proje detayları.
- `/fikir-defteri`: ayrı görsel galeri; filtre ve büyütme.
- `/proje-birimi`: ayrıntılı proje yaklaşımı; `/proje-teklif` formuna geçiş.
- İşyeri/mimari projeler rehberi geri açıldı. Bu sayfa bayi programı değildir.

Bayilik, franchise ve iş ortaklığı başvuru/dizinleri kapalı kaldı. Kullanıcı bu son ayrıntılı tasarımı beğendi; yeni geliştirme odağı admin ve güvenliktir. [Ayrıntılı sürüm rehberi](../KURUMSAL-AYRINTILI-SURUM.md).
