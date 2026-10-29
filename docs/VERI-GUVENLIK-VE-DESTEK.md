# Müşteri yönetimi, şifreli veri ve güvenli taşıma

29 Ekim 2026 güncellemesi. Ayrıntılı kurumsal site, tek dükkân modeli ve mevcut teklif akışı korunur. Yeni yönetim ekranları müşterinin hesabını, görüşmelerini, özel dosyalarını ve destek sorunlarını birlikte değerlendirmek içindir. Ekranlardaki kısa açıklamalar hangi işlemin ne yaptığını ve hangi adımın izleneceğini anlatır.

Önizlemeler: [Müşteri dosyası](veri-guvenlik/musteri-dosyasi.png), [destek masası](veri-guvenlik/destek-masasi.png), [veri ve güvenlik merkezi](veri-guvenlik/veri-guvenlik.png), [mobil destek](veri-guvenlik/mobil-destek.png), [mobil güvenlik](veri-guvenlik/mobil-veri-guvenlik.png). Ekranlar sentetik, yalıtılmış örnek kayıtlarla alınmıştır.

## Yönetimde hangi ekranı kullanacağım?

| Yapılacak iş | Ekran ve yöntem |
| --- | --- |
| Müşterinin bütün işlerini incelemek | **Müşteriler** bölümünde kaydı açın; müşteri çalışma alanındaki talepler, mesajlar, dosyalar, teklifler ve destek kayıtlarını inceleyin. Misafir başvuruları da ayrı kayıt olarak görünür. |
| Ad, iletişim bilgisi veya hesap durumunu düzeltmek | Mevcut müşteri düzenleme alanını kullanın. E-posta değişikliği ve askıya alma açık oturumları kapatır. Müşterinin parolası görüntülenmez. |
| Hesaba erişim sorununu çözmek | Müşterinin kimliğini bilinen iletişim kanalından doğruladıktan sonra **Kurtarma bağlantısı** oluşturun veya **Oturumları kapat** işlemini kullanın. Bağlantı kısa süreli ve gizlidir; mesajlara kalıcı olarak yapıştırmayın. |
| Hesap veya hizmet sorununu takip etmek | **Destek & hesap sorunları** bölümünde durum, öncelik ve sorumluyu belirleyin; müşteriye yanıt yazın veya ekibe özel iç not ekleyin. |
| Proje çizimi ve fiyatlandırma | **Proje & fiyat talepleri** bölümünde özel dosyaları inceleyin; kalemli teklif taslağını kaydedip kontrol ettikten sonra yayımlayın. |
| Veri tabanı, dosya alanı ve güvenlik durumunu görmek | **Veri, yedek & güvenlik** bölümündeki kayıt sayıları, depolama, şifreleme ve tarama açıklamalarını kontrol edin. Bu ekran ana yöneticiye açıktır. |
| Başka sunucuya eksiksiz taşımak | **Şifreli yedek** ile **anahtar dosyasını** ayrı ayrı alın; aşağıdaki yeni klasöre geri yükleme adımlarını izleyin. |

Müşteri çalışma alanı, sadece yetkili olduğunuz müşterinin kayıtlarını bir araya getirir. Mesajlar hem talep görüşmelerini hem destek yazışmalarını kapsar. Dosyalar, özel proje çizimlerini ve müşteriye sunulan belgeleri ayırır. Büyük geçmişlerde ekran için sınır uygulanır; sınıra ulaşıldığı belirtilir. Destek listesi müşteri filtresi ve sayfalama ile kullanılabilir. Tam yedek bu ekran sınırlarıyla kesilmez.

Ana yönetici hesap düzeltme, kurtarma ve tüm kayıtları inceleme yetkisine sahiptir. Operasyon sorumlusu kendi hizmet bölgesindeki taleplere bağlı kayıtları yönetir; hesap düzeyindeki, herhangi bir talebe bağlanmayan destek kayıtlarını ana yönetici inceler. Teknik personel yalnızca atandığı taleplere bağlı destek kayıtlarını okur; destek durumunu değiştiremez, yanıt gönderemez veya taslak fiyatı göremez. İçerik editörü müşteri operasyonlarına ve yedeklere erişmez. Müşteri oturumlarının yalnızca güvenli özetleri gösterilir; oturum belirteçleri ve parola özetleri ekrana aktarılmaz.

## Müşteri destek kaydı nasıl çalışır?

Müşteri `/hesabim` içinde destek alanından **Hesap**, **Teknik**, **Teklif**, **Belge** veya **Diğer** kategorisi seçip konuyu ve açıklamayı yazar. İsterse kendi talebine bağlar. Misafir takip oturumu yalnızca kendisine verilen talep için destek açabilir; aynı e-posta adresini yazmak başka taleplere erişim sağlamaz.

Durumlar **Açık → İnceleniyor → Müşteriden yanıt bekleniyor → Çözüldü** şeklindedir; gerekirse tekrar açılır. Müşterinin yeni yanıtı kaydı yeniden açık duruma getirir. **İç not** yalnızca yetkili ekip içindir ve müşteri yanıtına eklenmez. Müşteriye açık yanıt verildiğinde panel içi bildirim oluşturulur. Bu, otomatik e-postanın teslim edildiği anlamına gelmez; gerçek dış bildirimler ayrıca sağlayıcı kurulumu gerektirir.

Misafir kişi takip oturumundan hesap oluşturursa veya mevcut hesabına güvenli takip bağlantısıyla talebini bağlarsa, yalnızca o talebin destek konuşmaları birlikte taşınır. Aynı e-postayla geçmişte oluşturulmuş diğer misafir kayıtları otomatik birleştirilmez. Yetki kontrolleri, değişiklik kaydı ve mesaj sınırları uygulanır; bir kayıtta en fazla 250 mesaj ve bir müşteri için en fazla 20 açık destek kaydı olabilir. Parola, ödeme kartı bilgisi veya gereksiz kimlik belgesi istemeyin.

## Veriler artık nerede tutuluyor?

Site zaten SQLite veri tabanı kullanıyordu. Bu sürümde kalıcı veri tabanı, doğrulamalı **AES-256-GCM** ile şifrelenmiş `site.sqlite.enc` dosyasıdır. SQLite çalışma sırasında bellekte açılır; başarılı yazma ve işlem onaylarında şifreli anlık görüntü diske kaydedilir. Kullanıcı/üye bilgileri, misafir talepleri, site içerikleri, destek konuşmaları, teklifler, dosya kayıtları, işlem ve güvenlik olayları aynı veri tabanında yer alır. Canlı analitik ve güvenlik kayıtları için boyut/saklama sınırları vardır; kayıtlar sınırsız süre ve hacimde biriktirilmez.

| Konum | İçerik |
| --- | --- |
| `.data/site.sqlite.enc` | Şifreli SQLite veri tabanı |
| `.data/migration-backup.sqlite.enc` | Eski açık SQLite'tan geçiş sırasında oluşturulan şifreli güvenlik kopyası; varsa korunur |
| `.data/private-documents/` | Müşteriye sunulan özel PDF'ler; dosya içeriği ayrıca AES-256-GCM ile şifrelenir |
| `.data/project-files/` | Özel müşteri çizim/proje dosyaları; dosya içeriği ayrıca AES-256-GCM ile şifrelenir |
| `.data/uploads/` | Sitede yayımlanmak üzere yüklenen genel görseller; özel müşteri arşivi olarak kullanılmaz |
| `.data.key` | Yerel geliştirmede otomatik oluşturulan şifreleme anahtarı; `.data` klasörünün **yanında**, dışında tutulur |
| `.data.initial-admin-password` | Yalnız ilk kurulumda oluşturulan yönetici parolası; veri klasörünün dışında tutulur ve parola değişince silinir |

`DATA_DIR` farklıysa yerel anahtar yolu `<DATA_DIR>.key`, ilk parola yolu `<DATA_DIR>.initial-admin-password` olur. Normal kaynak ZIP'i gerçek veri, gerçek anahtar veya yönetici parolası içermez. Özel dosyalar herkese açık `/uploads` adresine taşınmaz. Yayınladığınız ürün metinleri ve genel görseller ziyaretçiler tarafından görülebilir; diskte şifreleme, herkese açık içeriği gizlemek için kullanılmaz.

Bu saklama yöntemi **tek uygulama süreci** içindir. Aynı veri klasörünü iki sunucuyla eş zamanlı açmayın. Veri tabanı bütünüyle bellekte tutulur ve yazıldıkça şifreli görüntü kaydedilir; bu nedenle büyük veri tabanlarında RAM ve disk yazma maliyeti artar. Varsayılan veri tabanı sınırı **64 MiB**, `DATA_MAX_DATABASE_MB` ile izin verilen en yüksek değer **256 MiB**'dır. Proje dosyaları ayrı klasörlerde tutulur ve bu veri tabanı boyutuna dosya içerikleri olarak eklenmez. Çok sayıda eş zamanlı kullanıcı veya büyük veri için farklı bir veri tabanı sunucusuna planlı geçiş gerekir.

## Anahtarı nasıl koruyacağım?

**Anahtar kaybolursa şifreli veri ve yedek açılamaz.** Yeni bir anahtar üretmek eski veriyi çözmez. Yerel kurulumda `.data.key` dosyasını kaybetmeden yedekleyin; yedek dosyası ve anahtarı farklı, erişimi kısıtlı yerlerde saklayın. Anahtarı siteye, genel medya alanına, Git'e veya sohbete yüklemeyin.

Üretim ortamında otomatik yerel anahtar oluşturulmaz. `DATA_ENCRYPTION_KEY_FILE` ile veri klasörü dışındaki bir secret dosyası veya `DATA_ENCRYPTION_KEY` ile güvenli ortam değişkeni tanımlanmalıdır. İkisini aynı anda tanımlamayın. Anahtar 32 bayt standart base64 veya 64 haneli hex biçimindedir. İşletim sistemi/hosting erişim izinleriyle anahtara yalnız uygulama hesabının ulaşmasını sağlayın. Yeni, henüz verisi olmayan bir kurulum için örnek:

```cmd
npm run data:keygen -- --out kilinc-veri-anahtari.key
set "DATA_ENCRYPTION_KEY_FILE=C:\guvenli-klasor\kilinc-veri-anahtari.key"
```

Örnekteki dosyayı güvenli klasöre siz yerleştirmelisiniz; gerçek konumu kullanın. Mevcut kurulum için yeni anahtar üretmek yerine mevcut anahtarı taşıyın. Paneldeki **Anahtar dosyasını indir** işlemi mevcut anahtarın kopyasını verir; şifrelemeyi değiştirmez. Yeniden parola doğrulaması ve ana yönetici yetkisi gerekir.

Şifreleme, veri diski veya şifreli yedeğin tek başına ele geçirilmesine karşı koruma sağlar. Uygulama çalışırken yetkili istekleri yanıtlamak için veriyi çözebilir. Saldırgan uygulama sürecini, yönetici oturumunu veya hem veri hem anahtarı tamamen ele geçirirse şifreleme bunu tek başına önleyemez. HTTPS, güncel sunucu, erişim izinleri ve güçlü yönetici parolası birlikte kullanılmalıdır; hiçbir web sistemi için mutlak sızılmazlık sözü verilmez.

## Eski Windows kurulumunu güncellemek

1. Açık uygulama penceresinde **Ctrl+C** ile sunucuyu durdurun. Eski proje klasörünü ve `.data` klasörünün tamamını yedekleyin.
2. Şifreli bir sürüm kullanıyorsanız **`.data.key` dosyasını da ayrıca koruyun**. Veri klasörünü tek başına kopyalamak yeterli değildir. İlk parolanızı henüz değiştirmediyseniz `.data.initial-admin-password` dosyasını da güvenli yerde tutun. Daha eski sürümün `.data/initial-admin-password` dosyası bu sürüm açılırken dış konuma taşınır.
3. Yeni kaynak ZIP'ini ayrı klasöre çıkarın; eski `.data` klasörünü yeni `package.json` ile aynı düzeye, yerel `.data.key` dosyasını da yeni `.data` klasörünün yanına kopyalayın. `.env` dosyası otomatik yüklenmez; hosting/servis ayarlarında kullanılan anahtar yöntemi varsa aynı değeri veya aynı secret dosyasını tanımlayın.
4. Yeni proje klasöründe Komut İstemi açın:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

Güncel Node.js **24 LTS** gerekir; şifreli SQLite için `serialize/deserialize` destekleyen güncel sürüm kullanılmalıdır. Site `http://localhost:5173`, yönetim `/yonetim`, müşteri hesabı `/hesabim` adresindedir. Eski açık `site.sqlite` varsa başlangıçta veriler okunup şifreli kopya oluşturularak geçiş yapılır; eski dosyayı uygulama çalışırken elle değiştirmeyin. Kaynak ZIP'i kendi bilgisayarınızdaki eski klasörü veya canlı yayını otomatik güncellemez.

## Yedek alma ve başka sunucuya taşıma

Ana yönetici **Veri, yedek & güvenlik** alanında parolasını yeniden doğrulayıp `.kilincbackup` yedeğini indirir. **Anahtarı ayrıca indirip ayrı yerde koruyun.** Yedek; şifreli veri tabanını, genel yüklemeleri ve özel dosyaları bütünlük bilgileriyle taşır. Anahtar, ilk yönetici parolası, ortam değişkenleri ve sunucu/hosting sırları pakete konmaz. Veri tabanındaki hesap parola özetleri tam yedekte korunur; bunlar açık parola değildir. Yedek dosyasını ve anahtarı birlikte herkese açık bir yere koymayın.

Panel/taşınabilir yedek sınırı toplam dosya içeriği için **128 MiB**'dır. Daha büyük arşivde sunucuyu durdurup tüm veri dizinini çevrimdışı kopyalayın ve anahtarı ayrı koruyun. Yalnız veri tabanını kopyalamak özel ek dosyaları taşımaz. Komut satırından, sunucu durdurulmuşken:

```cmd
npm run data:backup -- --data .data --key-file .data.key --out yedek.kilincbackup
```

Geri yükleme, var olan klasörün üzerine yazmaz. Dosya bütünlüğü ve anahtar doğrulanır; **henüz mevcut olmayan** yeni hedefe aktarılır:

```cmd
npm run data:restore -- --file yedek.kilincbackup --key-file kilinc-veri-anahtari.key --target .data-yeni
```

`kilinc-veri-anahtari.key`, yedek alınırken kullanılan mevcut anahtarın kopyası olmalıdır. İşlem `.data-yeni` ile yanında `.data-yeni.key` oluşturur; eski `.data` dizinine dokunmaz. İlk denemeyi ayrı klasörde yapın, `DATA_DIR` ve anahtar ayarını yeni hedefe yönlendirip kayıtları kontrol edin. Üretimde secret dosyasını veri dizininin dışında güvenli biçimde bağlayın. Alan adı, HTTPS, bildirim sağlayıcısı, antivirüs bağlantısı ve servis ayarları yeni sunucuda ayrıca kurulmalıdır.

Farklı bir yazılıma geçerken okunabilir bir veri eşlemesi de gerekebilir. İsteğe bağlı çevrimdışı iş verisi JSON'u, parola ve oturum sırlarını çıkarır; kişisel verileri **açık metin** içerir. Bilerek izin verilmeden oluşturulmaz:

```cmd
npm run data:export-json -- --data .data --key-file .data.key --out is-verileri.json --allow-plaintext
```

Bu JSON tam geri yükleme paketi değildir: oturum, parola ve token aktarmaz; ek dosyaların içeriklerini taşımaz. Başka sitenin tablolara/veri biçimine uyarlaması gerekir. Dosyayı güvenli ortamda işleyin ve iş bitince kaldırın. Hesapları ve dosyaları eksiksiz aynı uygulamaya taşımak için şifreli tam yedek kullanılmalıdır.

## Zararlı dosyalara karşı ne yapılıyor?

Dosya adı, uzantı, gerçek içerik/imza, boyut ve yetki kontrolleri uygulanır. ZIP ve çalıştırılabilir dosyalar yüklenmez; etkin PDF içeriği ve şüpheli adlar reddedilir. Yeni özel dosyalar, henüz aktarılırken şifreli geçici alanda tutulur; kontrol tamamlanmadan müşteri belgesine dönüşmez. Dosyalar sunucuda çalıştırılmaz, CAD içeriğindeki dış bağlantılar açılmaz; özel belgeler yetkili kullanıcıya ek dosya olarak indirilir.

Üretimde **ClamAV zorunludur**. `CLAMAV_HOST`, isteğe bağlı `CLAMAV_PORT` (varsayılan 3310) ve `CLAMAV_TIMEOUT_MS` ile yalnız güvenilir iç ağdaki tarama servisi tanımlanır. Temiz tarama yanıtı alınamazsa yükleme/özel dosya indirme engellenir; zaman aşımı veya servis arızası dosyayı temiz saymaz. Tarama portunu genel internete açmayın. ClamAV motoru ve imza verisi güncel tutulmalı, gerçek sunucuda bağlantı ve temiz/zararlı örnek davranışı doğrulanmalıdır. Sistem ekranında bağlantı tanımı görünmesi servisin çalıştığına veya imzaların güncelliğine kanıt değildir.

Yerel `npm run dev` ortamında ClamAV bağlı değilse yalnız sınırlı imza/biçim kontrolleri vardır; ekranda **sınırlı geliştirme denetimi** olarak belirtilir. Bu dosyalar tam antivirüs taramasından geçmiş sayılmaz. Kayıtta tarama durumu ve zaman bilgisi gösterilir; özel indirme sırasında dosya tekrar denetlenir. EICAR test imzası engellenir; bu özellik bütün zararlıları tespit eden bir motor değildir. Bu bulut çalışmasındaki protokol testleri gerçek ClamAV motoru ve güncel imza kurulumu yerine geçmez.

## Kontrol ve işletim

```sh
npm test
npm run build
npm run build:server
npm run rights:check
```

Bu komutlar tekrar çalıştırılabilir kontrollerdir; tamamlanan sonuçlar teslim mesajında ayrıca bildirilir. Sitenin lisans/kaynak kayıtları ve özgün kurumsal tasarımı korunur. Günlük işletimde yedek alın, geri yüklemeyi ayrı klasörde deneyin, anahtarı ayrı saklayın ve paneldeki güvenlik olaylarını inceleyin. Güvenlik logları hassas form metni/parola/anahtar toplamak için kullanılmaz; rota türü, durum ve olay özetiyle sınırlanır.

## Bu teslimde doğrulanan sonuçlar

- **93 tarayıcı kontrolü geçti:** ayrıntılı site 12, kurumsal 9, CMS 12, müşteri 12, operasyon 11, proje/teklif 11, analitik 6, görsel kaynak kayıtları 6, yeni destek/müşteri dosyası 8 ve veri merkezi 6.
- **139 API/güvenlik/geçiş testi geçti.** Yanlış anahtar ve değişen şifreli içerik reddi, işlem/yeniden başlatma kalıcılığı, eski SQLite/WAL geçişi, hesap yetkileri, misafirden üyeye destek aktarımı, gizli ekip notları, virüs test imzası, tarama sırasında oturum iptali ve şifreli geçici yükleme sınandı.
- Şifreli yedek gerçek komutlarla yeni klasöre geri yüklendi; özgün veri korundu. `data:backup`, `data:restore`, `data:export-json` çalıştırıldı; mevcut hedefin üzerine yazma reddedildi.
- İstemci/sunucu derlemeleri, TypeScript ve 104 çalışma zamanı paketi/7 görsel-font envanteri doğrulandı. Derlenmiş üretim sürecinde Secure oturumlar, özel dosyalar, teklif PDF’i ve gönderilmemiş e-posta taslağı kontrol edildi.
- Üretim tarama testleri yerel ClamAV protokol taklidiyle yapıldı; gerçek motor ve güncel imza kurulumunun kanıtı değildir. Canlı alan adına dağıtım veya gerçek Windows oturumu bu çalışmada yapılmadı.
