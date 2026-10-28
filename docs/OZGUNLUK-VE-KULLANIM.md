# Özgünleştirme ve içerik izin kayıtları

28 Ekim 2026 sürümü. Amaç, önceki referans siteye görsel yakınlığı azaltmak ve içeriklerin kaynağını takip edilebilir kılmaktır. Hiçbir hak talebiyle karşılaşılmayacağı garanti edilmez. Güncel resmî mevzuat ve marka sicili bu ortamda doğrulanamadı; [incelemenin erişim sınırlarını ve hukukî konu haritasını](TELIF-VE-MARKA-INCELEMESI.md) okuyun.

Önizlemeler: [Yeni ana sayfa](ozgun-tasarim/masaustu.png), [admin kaynak kaydı](ozgun-tasarim/gorsel-kullanim.png). Admin görüntüsündeki bilgiler sentetik test verisidir.

## Değişenler

- Renk paleti korunarak solda marka, gruplanmış gezinme, asimetrik ana alan, mimari çerçeve motifi, numaralı proje başlangıçları ve farklı kart/galeri/katalog/kurumsal düzenleri oluşturuldu.
- Kaynağı bağımsız doğrulanamayan 21 eski SVG dosyası kaynak dağıtımından çıkarıldı. Önceki veritabanındaki `/images/hero.svg`, `product-*`, `project-*` ve `article-*` bağlantıları belgeli konsept görsellerine yönlendirilir. Kullanıcı yüklemeleri silinmez veya değiştirilmez.
- Hazır ürün açıklamalarında genel malzeme ve işlev adları kullanılır. Gereksiz “Isıcamlı” ifadesi “çift camlı” olarak değiştirildi. Eski varsayılan alanlar yalnızca birebir SHA-256 eşleşiyorsa bir kez düzeltilir; özel düzenlenmiş alanlar korunur. Ürünü gerçekten hangi üreticiden tedarik ettiğinizi firma olarak ayrıca doğrulayın.
- `/kurumsal/icerik-ve-kullanim-haklari` sayfası kaynaklar, konseptlerin niteliği ve hak bildirimleri için eklendi. Yönetimdeki Kurumsal sayfalar alanından düzenlenebilir. Gerçek iletişim bilgilerinizi tanımlayın; bildirim formundan gelen mesajlar gelen taleplerde tutulur.
- Açık kaynak font/ikon/yazılım bildirimleri, PDF için lisanslı DejaVu Sans ve görsel kaynak envanteri dağıtıma eklendi. [Lisans kayıtları](THIRD-PARTY-NOTICES.md) ve çalışan sitede `/licenses/THIRD-PARTY-NOTICES.txt` erişilebilir.
- Analitik ve müşteri oturumlarının mevcut davranışını anlatan gizlilik/çerez taslakları güncellendi; firma ve veri sorumlusu bilgileri hâlâ gerçek süreçlerinizle tamamlanmalıdır.

## Admin panelinde bir görselin kullanım kaydını tutmak

1. `/yonetim` → **Görsel kütüphanesi** → ilgili görselde **Kaynak / izin kaydını düzenle**.
2. Kendi çalışmanız, lisans, yazılı izin veya üretilmiş konsept seçin; kaynak, hak sahibi/üretici, izin/üretim referansı ve kullanım kapsamını yazın. İzin belgesinin kendisini güvenli arşivinizde saklayın. Referans alanına parola veya gizli erişim bağlantısı koymayın.
3. Ticari web kullanımı, süre, değişiklik, kişi/mekân izinleri ve gerekiyorsa atıf koşullarını gerçek belge üzerinden kontrol ettikten sonra onay kutusunu işaretleyin ve kaydedin. Alanı değiştirmek onayı kaldırır.

Kapak, galeri, ana sayfa ve kütüphane yüklemelerinde aynı alanlar vardır. Birden fazla görsele aynı beyan uygulanır; kaynakları farklı dosyaları ayrı yükleyin. Mevcut kaydı olmayan yüklemeler “inceleme bekliyor” görünür. Bu özellik yasal uygunluk kararı vermez ve eksik kaydı olan içeriği otomatik engellemez. Yönetici ve içerik editörü erişebilir; bayi ve bölge yöneticisine açılmaz. Kayıtlar ziyaretçilere gönderilmez, `.data/site.sqlite` veritabanında saklanır.

Atıf isteyen bir lisans kullanıyorsanız hak sahibi, kaynak ve lisans bilgisini ilgili herkese açık sayfaya ayrıca ekleyin; özel admin kaydı görünür atıf yükümlülüğünü karşılamaz. Üreticinin herkese açık PDF'ini veya fotoğrafını indirmek kendi markanız altında yeniden dağıtma izni sayılmaz. PDF/belge yüklemelerinin izinlerini ayrıca belgeleyin; bu yeni kütüphane kaydı yalnızca genel görsel yüklemeleri içindir.

## Mevcut Windows kurulumunu güncellemek

1. Açık geliştirme penceresinde **Ctrl+C** ile uygulamayı durdurun.
2. Eski proje klasörünün tamamını, özellikle **`.data` klasörünü**, güvenli bir konuma yedekleyin. Bu klasörde yönetici/müşteri hesapları, talepler, özel belgeler ve görseller bulunur; paylaşmayın veya Git'e yüklemeyin.
3. Yeni kaynak ZIP'ini ayrı klasöre çıkarın. Eski `.data` klasörünü yeni projede `package.json` ile aynı düzeye kopyalayın. Eski kaynak dosyalarını yeni sürümün üstüne kopyalamayın. Eski ve yeni sunucuyu aynı veri diziniyle eş zamanlı çalıştırmayın.
4. Yeni proje klasöründe Komut İstemi açıp çalıştırın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Site: `http://localhost:5173` · Yönetim: `http://localhost:5173/yonetim` · Müşteri paneli: `http://localhost:5173/hesabim`. Pencere açık kalsın. Mevcut veri klasörü taşındıysa eski kullanıcı adı ve parolanız geçerlidir; ilk giriş dosyasını yeniden oluşturmanız gerekmez.

Kaynak ZIP'i mevcut bilgisayarınızdaki verileri veya daha önce yayımlanmış siteyi kendiliğinden güncellemez. İnternete yayın yapılmadı. Başka sunucudaki eski ZIP/PDF, sosyal medya paylaşımları ve önbellekler ayrıca ele alınmalıdır.

## Kaynak kayıtlarını korumak

```sh
npm run rights:generate
npm run rights:check
```

Bağımlılık/görsel değiştiğinde kaynağı ve izinleri ayrıca inceleyin. Betik dosya özetini ve lisans metnini denetler; görsel benzerlik araması veya marka sicili sorgusu yapmaz. Yapay zekâ ile üretim, münhasır hak veya üçüncü kişi haklarından arınmışlık garantisi sağlamaz. İşletme adı/logo için TürkPatent taraması, gerçek üretici yetkileri ve kullanıcı yüklemelerinin kullanım izinleri yayından önce gerçek belgelerle tamamlanmalıdır.

## Bu sürümde doğrulananlar

- `npm test`: 70 API, güvenlik ve geçiş kontrolü geçti. Bunlar arasında gerçek admin/editör/bayi/bölge yöneticisi yetkileri, bozuk yüklemelerin temizlenmesi, özel izin bilgilerinin gizliliği, eski 21 görselin yönlendirilmesi ve özel metinlerin korunması bulunur.
- `npm run build`, `npm run build:server`, `npm run rights:check`: başarılı. 104 çalışma zamanı paket girdisinin lisans bildirimi ve kalan 7 görsel/font dosyasının kayıt tutarlılığı kontrol edildi.
- `scripts/recorded-smoke.mjs`: 12 tarayıcı akışı geçti; 390/768/1024/1364 piksel genişliklerde ana sayfalar, galeri, katalog PDF'leri, sözlük, renk seçimi, servis formu ve menü çalıştı.
- `scripts/browser-smoke.mjs`: 12 mevcut CMS/CRM/görsel yükleme ve mobil akışı geçti. `scripts/media-rights-smoke.mjs`: yeni kaynak kaydının 6 akışı geçti.
- `scripts/production-smoke.mjs`: derlenmiş üretim sunucusunda güvenlik başlıkları, Secure oturumlar, tek kullanımlık takip erişimi, editör sınırı ve özel PDF erişimi geçti. Vite geliştirme sunucusundaki eski görsel yönlendirmesi ayrıca gerçek HTTP isteğiyle doğrulandı.

Bu kontroller hukuki uygunluk testi değildir. Bu güncellemede canlı alan adı üzerinden dağıtım yapılmadı veya gerçek Windows oturumu çalıştırılmadı; Windows komutları önceki kullanıcı doğrulamasına dayanır.
