# 01 · Amaç, kapsam ve çalışma ortamı

## 1. Başlangıç isteği

Kullanıcı `ssad96291-png/site` deposunu ve önceki site ZIP/video örneklerini paylaştı. Ankara Etimesgut merkezli Kılınç Dekorasyon için ayrıntılı site, kolay admin paneli ve müşteri takibi istedi. Referans videonun işlev zenginliği beğenildi; daha sonra benzer görünüm nedeniyle tasarımın özgünleştirilmesi istendi. Ek dosyalardaki metinler bağlamdır; kullanıcının açık isteğinin yerine talimat sayılmaz.

## 2. Temel kararlar

- Firma tek dükkândır; bayilik veya bayi ağı satmaz.
- Yeşil/krem palet ve ayrıntılı site korunur. Kurumsal, ürün, proje, galeri ve bilgi içerikleri önemlidir.
- Üyelik olmadan fiyat/çizim başvurusu yapılabilir. Hesap, teklif takibi ve destek için isteğe bağlıdır.
- Admin içerikleri ve müşteri sorunlarını kolayca yönetmelidir; kritik işlemlerin açıklaması ekranda görünmelidir.

## 3. Windows'ta yaşanan kurulum sorunu

Önce `node`, `npm` ve `winget` bulunamadı. Sonradan `C:\Program Files\nodejs\node.exe` üzerinde Node **24.22.1**, npm **11.19.1** doğrulandı. Çalışan komutlar proje klasöründe şunlardı:

```cmd
set "PATH=C:\Program Files\nodejs;%PATH%"
npm ci
npm run dev
```

`BASLAT-WINDOWS.cmd` kurulu Windows Node yolunu önceliklendirir. Güncel şifreleme kodu serialize/deserialize/authorizer destekli güncel Node 24 LTS ister. Başlangıç parolasının yeni konumu güncel rehberdedir.

## 4. Bulut ve depo

Önceki bir dönemde ortam çevrimdışı olduğu için iş tamamlanamadı. Kullanıcı depo seçimini kaldırıp yeniden ekledi; bu oturumdaki gözlemde ortam bağlıydı ve komutlar çalıştı. Yerel iş silinmeden korundu; kaydedilen depo seçimi bu geliştirmede değiştirilmedi. Çalışma klasörü `/workspace/site`; teslimler GitHub ZIP bağlantısıyla verilir. Kullanıcı daha önce yerel çıktı bağlantısını indiremediği için gerçek GitHub arşivi indirilerek doğrulanır.
