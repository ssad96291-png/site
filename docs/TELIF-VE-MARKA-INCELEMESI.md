# Telif, marka ve tasarım incelemesi

İnceleme tarihi: **28 Ekim 2026**. Kapsam: Kılınç Dekorasyon sitesinin dağıtılan kaynak kodu, hazır içerikleri ve görselleri; başka bir ticari sitenin kayıtlardan uyarlanmasına ilişkin riskler. Bu belge teknik risk azaltma çalışmasıdır. Hak sahipliği kararı, marka uygunluk görüşü veya ihlal olmayacağına dair garanti değildir.

## Araştırmanın erişim sınırı

Bu ortamda kullanılabilir bir web arama aracı bulunmadı. Resmî mevzuat ve WIPO sayfaları aşağıdaki doğrudan adreslerden alınmaya çalışıldı. Ağ vekili, hedefe bağlantı kurulmadan **CONNECT 403 Forbidden** yanıtı verdi. Yasak aşılarak başka yoldan erişilmeye çalışılmadı. Bu nedenle resmî kaynakların güncel içeriği bu oturumda okunamadı; mevzuatın yürürlükteki son hâli veya mahkeme içtihadı taranmış gibi bir sonuç çıkarılamaz.

| Kaynak | Adres | Bu oturumdaki durum |
| --- | --- | --- |
| Fikir ve Sanat Eserleri Kanunu, 5846 | https://www.mevzuat.gov.tr/MevzuatMetin/1.3.5846.pdf | Doğrudan erişim denendi; vekil CONNECT 403 ile engelledi. PDF okunamadı. |
| WIPO, Copyright | https://www.wipo.int/copyright/en/ | Doğrudan erişim denendi; vekil CONNECT 403 ile engelledi. Sayfa okunamadı. |
| Türk Ticaret Kanunu, 6102 | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6102.pdf | Başvuru adresi; güncel metin bu oturumda doğrulanmadı. |
| Sınai Mülkiyet Kanunu, 6769 | https://www.mevzuat.gov.tr/MevzuatMetin/1.5.6769.pdf | Başvuru adresi; güncel metin bu oturumda doğrulanmadı. |
| Kültür ve Turizm Bakanlığı, Telif Hakları Genel Müdürlüğü | https://telifhaklari.ktb.gov.tr/ | Ek resmî başvuru kaynağı; bu oturumda okunmadı. |
| Türk Patent ve Marka Kurumu | https://www.turkpatent.gov.tr/ | Marka ve tasarım araştırması için resmî başlangıç noktası; sicil araştırması bu oturumda yapılmadı. |

Aşağıdaki maddeler, yayından önce güncel metinde ve işin somut özellikleriyle birlikte kontrol edilmesi gereken bir **hukukî konu haritasıdır**. Özellikle tarihsel değişiklikler, istisnalar, yargı kararları ve hak sahiplerinin sözleşmeleri hakkında doğrulanmış güncel görüş sunulmaz.

## Bir web sitesinde hangi haklar ayrı ayrı değerlendirilir?

| Konu | Kontrol edilecek hükümler / haklar | Sitede uygulanabilir sonuç |
| --- | --- | --- |
| Metin, fotoğraf, illüstrasyon, yazılım, grafik çalışma | 5846 m. 1/B, 2 ve 4: eser niteliği ve eser türleri; m. 8: eser sahipliği | Bir dosyanın internette bulunması kullanım izni değildir. İçerik ve kaynak kodunun hakkı ayrı ayrı incelenir. |
| Metni/görseli değiştirme ve yeniden yayımlama | 5846 m. 6 ve 21: işleme; m. 22: çoğaltma; m. 25: umuma iletim | Rakibin dosyasını yeniden çizmek, kırpmak, rengini değiştirmek veya çevirisini yapmak tek başına izin sorununu çözmez. |
| İsim belirtme ve içerikte değişiklik | 5846 m. 15–16: manevi haklar | Lisansın gerektirdiği atıf korunmalı; izin verilmiş kullanımlarda bile hak sahibinin manevi hakları göz ardı edilmemeli. |
| Kaynak belirtme / alıntı | 5846 m. 35: iktibasın şartları | Kaynak bağlantısı veya “tüm hakları sahibine aittir” yazısı, ticari tanıtım sayfasında metin ve fotoğraf kopyalamak için genel bir izin oluşturmaz. |
| Devir ve kullanım sözleşmesi | 5846 m. 52: mali haklara ilişkin yazılı işlem ve hakların ayrı belirtilmesi | Fotoğrafçı/tasarımcı/ajansla sözleşmede web, katalog/PDF, sosyal medya, değişiklik ve süre gibi kullanım alanları açık olmalı; yalnızca ödeme faturası kapsamı kendiliğinden kanıtlamaz. |
| Logo, ürün serisi, işletme adı ve karıştırılma | 6769 m. 7; ayrıca 6102 m. 54 ve 55/1(a)(4) | Başka işletmeye bağlı veya onun yetkili bayisi gibi görünmekten kaçınılmalı. Benzer kelime, sembol, ürün adı ve genel sunum birlikte değerlendirilebilir. |
| Ürün ve görsel tasarım | 6769 m. 55–56 ve 59 | Bir ürünün teknik çizimi/görseli teliften ayrı tasarım hakkı doğurabilir. “Fotoğrafı kendim ürettim” demek ürün tasarımının tüm haklarını çözmez. |
| Başkasının ticari çalışma ürününden yararlanma | 6102 m. 54–55; özellikle şartları varsa 55/1(c) | Telif kapsamı tartışmalı olsa da ticari dürüstlük ve haksız rekabet değerlendirmesi ayrıca yapılmalıdır. |

Bu maddelerin varlığı, her arayüz öğesinin otomatik olarak eser veya tescilli tasarım olduğu anlamına gelmez. Menü, arama, ürün filtresi, form ve yönetim paneli gibi işlevlerden hareketle bağımsız bir uygulama geliştirmek mümkündür. Risk, başka işletmenin ayırt edici metin, görsel, işaret ve kompozisyonunun ne ölçüde kullanıldığına ve somut olaya bağlıdır.

## Bu proje için alınan yaklaşım

1. **İşlevleri koruyup görünümü bağımsızlaştırma.** Referanstaki tek bir logonun değiştirilmesi yeterli görülmemeli. Başlık, navigasyon, ana görsel kompozisyonu, kart oranları, köşeler, boşluklar, motifler ve bölüm ritmi birlikte özgünleştirilir. Renk paletinin korunması tek başına uygunluk veya ihlal kararı oluşturmaz.
2. **Rakibe özgü isimleri kullanmama.** Ürünler genel malzeme/işlev tanımlarıyla anlatılır. Başka üreticinin ürün serisi veya logosu, doğrulanmış gerçek ürün ve gerekli yetki bulunmadan “bizim ürünümüz” olarak sunulmaz. “Yetkili bayi”, ödül, sertifika ve performans iddiaları belgeye dayanmalıdır.
3. **Bağımsız metin ve görseller.** Rakibin metinleri, fotoğrafları, PDF'leri, çizimleri ve ekran görüntüleri dağıtılan siteye taşınmamalı. Kullanıcı tarafından sağlanan eski kaynak dosyalarına sahip olmak, bunların tüm haklarına sahip olunduğunun kanıtı sayılmaz. Dosya envanterindeki kaynağı belirsiz öğeler ayrıca kontrol edilir.
4. **Yapay zekâ görsellerini doğru anlatma.** Bu proje için oluşturulan görseller tamamlanmış müşteri işi veya gerçek saha fotoğrafı gibi sunulmaz. Üretim kaydı bir kaynak izi sağlar; üçüncü kişi haklarına benzemediği, otomatik telif koruması kazandığı veya her kullanımın risksiz olduğu anlamına gelmez. Görselde tanınabilir marka, karakter, eser, özel tasarım ya da kişi varsa ayrıca incelenir.
5. **Açık kaynak yükümlülükleri.** Font, ikon ve yazılım paketlerinin gerekli lisans/atıf metinleri dağıtıma eklenir. Açık kaynak lisansı, sitede kullanılan firma adını veya dışarıdan yüklenen içeriği otomatik olarak kapsamına almaz.
6. **Mevcut müşteri verisini koruma.** Hak incelemesi müşteri hesabı, talep ve özel belgelerin silinmesi için gerekçe değildir. İçerik düzeltmeleri sınırlı ve izlenebilir yapılmalı; firma tarafından sonradan eklenmiş dosyalar kaynak kontrolüne tabi tutulmalıdır.

Bir üçüncü tarafın hakları sürüyorsa alt bilgiye “telif hakkı yoktur”, “esinlenilmiştir” veya “haklar sahibine aittir” yazmak bu kullanımı kendiliğinden hukuka uygun hâle getirmez. Güvenilir bir **%20/%30 değiştirme**, farklı renk kullanma veya dosya adını değiştirme kuralı yoktur.

## Yayından önce firma tarafından tamamlanacak somut işler

| İş | Saklanacak kanıt / sonuç |
| --- | --- |
| “Kılınç Dekorasyon”, “Kilinc/Kılınç” benzerleri ve kullanılacak logo için marka taraması | TürkPatent sicil sorgu tarihi ve ilgili mal/hizmet sınıfları; gerekiyorsa marka vekili görüşü. Şirket unvanı/alan adı kaydı tek başına marka uygunluk araştırması değildir. Bu çalışmada marka temizliği doğrulanmadı. |
| Gerçek ürün/üretici ilişkisi | Üretici sözleşmesi, bayi/temsil yetkisi ve varsa marka kullanım kılavuzu. Genel tanımlar tescilli ürün serisi yerine kullanılabilir; marka tanımlaması gerekiyorsa ilişki doğru belirtilir. |
| Gerçek proje fotoğrafları | Fotoğrafçı lisansı/devri, gerektiğinde proje sahibi/mekân/kişi izinleri ve web/PDF kullanım kapsamı. Plaka, yüz ve özel konum bilgileri ayrıca değerlendirilir. |
| Yüklenecek katalog, teknik çizim, garanti belgesi | Kaynak, hak sahibi, kullanım izni, izin süresi ve değişiklik hakkı. Üreticinin herkese açık PDF bağlantısı, dosyayı kendi markası altında yeniden dağıtma izni değildir. |
| Marka veya içerik hakkı bildirimleri | Firma tarafından izlenen gerçek e-posta/iletişim kanalı. Yalnızca görünür bir bağlantı değil, sorumlusu belli bir değerlendirme süreci. |
| Arşiv ve eski yayınlar | Eski sürüm dosyaları, sosyal medya, arama motoru önbellekleri ve daha önce yayımlanmış PDF'ler ayrıca ele alınmalı. Kaynak kod güncellemesi önceki yayınları otomatik silmez. |

Mal/hizmet sınıfları işletmenin gerçek faaliyetine göre belirlenir. Metal yapı malzemeleri, metal olmayan yapı malzemeleri, montaj/inşaat, özel imalat veya satış hizmetleri farklı sınıflar gerektirebilir. Buradaki örnekler marka başvurusu tavsiyesi veya sınıf uygunluk kararı değildir.

## İçerik hakkı bildirimi için kısa şablon

Firma, mevcut iletişim kanalında şu bilgileri isteyebilir; bunlar bir bildirimi baştan reddetmek için zorunlu hukukî şartlar olarak sunulmamalıdır:

> Konu: İçerik / marka kullanım bildirimi
>
> İlgili sayfa veya dosya adresi: …
>
> Hak iddia edilen eser / işaret ve mümkünse kaynağı: …
>
> Bildiren kişinin hak sahipliği veya temsil açıklaması: …
>
> İletişim bilgisi ve talep edilen işlem: …

Bildirim gelince URL ve içerik kaydı tutulur; gerektiğinde tartışmalı içerik inceleme süresince yayından kaldırılır, lisans belgeleri karşılaştırılır ve yetkin hukuk desteğiyle yanıtlanır. Müşteri kişisel verileri veya özel belgeleri bildirim sahibine gönderilmez. Bu süreç, resmî tebligatlara ya da mahkeme kararlarına uyma yükümlülüğünün yerine geçmez.

## Sonuçların sınırı

Bu sürümdeki özgünleştirme, kaynak envanteri ve lisans metinleri somut risk azaltımlarıdır. Başka sitenin erişilemeyen güncel içeriğiyle kapsamlı metin/görsel benzerliği taraması, tersine görsel arama, marka/tasarım sicil taraması ve güncel yargı kararı incelemesi tamamlanmış değildir. Mevcut işletme adı, kullanıcı yüklemeleri, gerçek üretici ilişkileri ve lisans belgeleri yalnızca kod üzerinden doğrulanamaz. Ticari yayından önce özellikle bu açık noktalar gerçek belgelerle tamamlanmalıdır.
