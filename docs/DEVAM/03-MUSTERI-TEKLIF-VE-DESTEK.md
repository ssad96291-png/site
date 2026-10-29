# 03 · Müşteri, teklif ve destek akışı

## 1. Talep ve hesap temeli

Müşteri keşif/teklif/servis talebi bırakır. Yeni misafir talebi için tek kullanımlık, yalnız o talebe erişen takip oturumu açılır. E-posta benzerliği kimlik kanıtı değildir. İsteğe bağlı üyelik ve güvenli talep bağlama akışı korunur.

Talep aşamaları: alındı, planlama, keşif, üretim, montaj ve tamamlandı. Müşteri kendisine açık mesaj, randevu ve belgeyi görür. Firma içi notlar aktarılmaz. Eski bayi kavramı iç teknik irtibat/personel olarak düzenlendi; otomatik bayi ataması yoktur.

## 2. Dosyalı fiyat/proje isteği

`/proje-teklif` fiyat sorusu veya çizim üzerinden başvuru alır. Dosya ve hesap zorunlu değildir. Telefonla aranma kutusu başlangıçta boş; işaretlenirse telefon gerekir. Tek e-posta alıcısı doğrulanır; pazarlama aboneliği oluşturulmaz.

PDF, JPG/PNG/WebP, DWG/DXF, IFC ve STEP/STP desteklenir. En fazla 3 dosya; dosya başına 20 MiB. Arşiv/çalıştırılabilir içerik kabul edilmez. Dosya ve hata sonrası yeniden deneme aynı talebi sürdürür; bağlantı hatası yeni kopyalar üretmemelidir.

## 3. Teklif hazırlama

Admin/izinli operasyon sorumlusu iş kalemi, miktar, birim fiyat ve KDV ile taslak hazırlar. Tutarlar sunucuda hesaplanır. Taslak müşteriye görünmez. Yayımlanmış teklif sabittir; değişiklik yeni revizyonla yapılır. Müşteri kendi teklif PDF'ini indirir.

Gerçek e-posta sağlayıcısı yoksa gönderim bekler. PDF ekli `.eml` taslağı indirilip işletmenin posta uygulamasından gönderilebilir; taslağı indirmek gönderim sayılmaz. [Teklif rehberi](../PROJE-TEKLIF-SURUMU.md).

## 4. Son aşamadaki müşteri dosyası ve destek

Admin Müşteriler bölümünde üye/misafir filtresi kullanır; seçilen müşterinin taleplerini, talep ve destek konuşmalarını, özel dosyalarını, tekliflerini ve güvenli oturum özetini birlikte görür. Profil düzeltme, dondurma, kurtarma ve oturum kapatma korunur.

Müşteri destek kaydı açabilir; ekip durum, öncelik, sorumlu ve yanıtı yönetir. İç not ayrı işaretlenir ve müşteri API'sine çıkmaz. Misafirden üyeye geçişte yalnız doğrulanan talebin destek geçmişi taşınır. Teknik personel atanmış kayıtları okuyabilir; editör müşteri operasyonlarına erişmez. Büyük geçmişler arayüzde sınır/sayfalama ile gösterilir; tam yedek bu ekran sınırlarıyla kesilmez.
