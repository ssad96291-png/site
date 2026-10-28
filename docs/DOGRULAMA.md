# Önceki sürümün doğrulama kaydı

Güncel müşteri/CRM sürümü sonuçları için [MUSTERI-VE-YONETIM.md](MUSTERI-VE-YONETIM.md) dosyasına bakın.

Yeni sürümün 28 Ekim 2026 sonuçları için [YENI-TASARIM.md](YENI-TASARIM.md) dosyasına bakın.

27 Ekim 2026 tarihinde bu çalışma ortamında:

| Kontrol | Sonuç |
| --- | --- |
| `npm test` | 22 test geçti, 0 başarısız, 0 atlanan |
| `npm run build` | TypeScript ve Vite üretim derlemesi geçti |
| `npm run build:server` | Bağımsız Node sunucusu derlendi |
| `node --import tsx scripts/browser-smoke.mjs` | Gerçek Chromium'da 12 akış kontrolü geçti |
| `npm audit --omit=dev` | Üretim bağımlılıklarında 0 bilinen açık raporlandı |
| Docker imajı | Derlendi; salt okunur kök, ayrı veri birimi ve UID 1000 ile çalıştı |
| Üretim HTTP kontrolleri | HTML, API, 72 içerik, PDF, SVG, güvenlik başlıkları ve anonim 401 doğrulandı |
| Docker Compose | Yapılandırma doğrulaması geçti; canlıya alınmadı |
| Caddy | Resmi imajda `caddy validate` geçti; gerçek alan adı/sertifika henüz sınanmadı |

Tarayıcı kontrolleri: masaüstü ana sayfa, bölge detayları, sistem seçici→teklif formu, yönetici girişi ve CRM güncellemeleri, taslak/yayın ve SEO, alan adı/canonical, dil görünürlüğü ve kaydedilmiş dil tercihi, medya, JSON/CSV, güvenli çıkış, 390px genel site ve giriş yapılmış yönetim paneli. Testler geçici veritabanı ve rastgele test hesabı parolası kullanır; işletme verilerine dokunmaz.

API testleri ayrıca mevcut içerik düzenlemelerini/silmelerini koruyan geçişi, anonim erişim sınırlarını, kaynak kontrolünü, üretim çerezlerini, dosya kısıtlarını ve yeniden başlatma sonrası giriş hız sınırını kapsar.

Bu sonuçlar mevcut ortamı doğrular. Gerçek barındırma, DNS, TLS sertifikası, yedekten dönüş ve firmanın içerik doğruluğu canlı ortamda ayrıca kontrol edilmelidir. E-posta/SMS gönderimi kurulmuş değildir; talepler panelde izlenir. Kontroller mutlak güvenlik veya hukuki uygunluk garantisi değildir.
