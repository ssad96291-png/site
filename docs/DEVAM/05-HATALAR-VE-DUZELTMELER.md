# 05 · Hatalar ve düzeltmeler

Bu kayıt gerçek gözlemleri ve geliştirme/test incelemelerinde bulunan sorunları ayırır. Aşağıdakiler gerçek veri ihlali veya saldırı yaşandığı iddiası değildir.

| Aşama / sorun | Düzeltme ve ders |
| --- | --- |
| Kullanıcının beğendiği ayrıntılar özgünleştirmede fazla sadeleştirildi | Ayrıntılı yapı geri getirildi. Kurumsal ve işlev zenginliği ürün kararıdır; telif kaygısı tüm özelliği silme gerekçesi yapılmamalı. |
| Kurumsal `/dukkanimiz` adresine, Projeler galeriye, Proje Birimi doğrudan forma yönlenmişti | Ayrı sayfalar geri açıldı; uyumlu eski bağlantılar korunuyor. Kurumsal hub tamamen silinmiş değildi; adres değişimini gerçek silinmeyle karıştırmamak gerekir. |
| Bayi dışındaki kurumsal proje rehberi de eski tek dükkân geçişinde kapatılmıştı | Bilinen otomatik arşiv geri açıldı; özel metinler ve ayrı yayın kararları korundu. |
| Windows'ta Node kurulu olduğu halde başlatıcı/terminal bulamıyordu | Kurulu `C:\Program Files\nodejs` yolu önceliklendirildi; çalışan PATH komutu not edildi. `winget` kullanıcının sisteminde yoktu. |
| Bulut çevrimdışıyken dosyalar üzerinde iş tamamlanamıyordu | Hazır ZIP varmış gibi sunulmadı; bağlantı döndükten sonra gerçek dosya ve GitHub indirmesi doğrulandı. |
| Tarayıcı testlerinde iç içe locator, erişilebilir etiket veya yönlenme zamanlaması sorunları | Ürün davranışı doğrulanarak test seçicileri/bekleme ve gerçek etiketler düzeltildi. Testin hatası otomatik ürün hatası sayılmadı. |
| Şifreli SQLite ilk incelemesinde PRAGMA kalıcılığı, eski kilit yarışı ve anahtar yolu sınırı açıkları | Metadata yazıları izlenir; başlangıç kilidi, doğru gerçek yol kontrolü ve eski veri tabanı yazıcı kilidi eklendi. Bağımsız inceleme ve 13 test tamamlandı. |
| Bozulmuş özel dosya başlığı eski açık dosya gibi yorumlanabiliyordu | Varsayılan okuma şifreli biçimi zorunlu kılar. Eski açık dosya geçişi yalnız ilk sürümlü geçişte yapılır; sonraki açılışta açık dosya kabul edilmez. |
| Yeni destek tabloları misafirden üyeye talep bağlamasında geride kalabilirdi | Yalnız doğrulanan talebin destek sahibi de taşınır; aynı e-postalı başka misafir geçmişi taşınmaz. Üyelik ve mevcut hesaba bağlama test edildi. |
| Dosya taraması sırasında hesap/oturum iptal edilirse ilk yetki kontrolü yetersiz kalırdı | Asenkron tarama sonrasında yetki tekrar okunur; iptal edilen oturumla dosya kaydı yapılmaz. |
| Güvenlik ekranında ham SQL tablo adları, müşteri ekranında yanlış genel açıklama görünüyordu | Anlamlı Türkçe sayaç/işlem adları ve müşteri yönetimi açıklaması eklendi. |
| Tam sayfa ekran görüntüsünde yapışkan menü kaymış görünüyordu | Görüntü almadan önce kaydırma/odak sıfırlandı; ürün hatasıyla test görüntüleme etkisi ayrıldı. |

Yeni hata bulduğunuzda bu tabloyu geçmişi yeniden yazmak için kullanmayın. Yeni aşama dosyasında somut hatayı, düzeltmeyi ve doğrulama sonucunu belirtip çalışma günlüğüne bağlantı ekleyin.
