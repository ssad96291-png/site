# 08 · Sonraki yapay zekâ için kayıt şablonu

Her anlamlı geliştirmeyi ayrı, artan numaralı bir aşama dosyasına kaydedin. İlk yeni dosya `10-<kisa-konu>.md` olabilir. Önceki aşamaları topluca yeniden yazmayın; değişen bir kararın hangi önceki kararı neden değiştirdiğini yeni kayıtla belirtin. Sonra [çalışma günlüğüne](06-CALISMA-GUNLUGU.md) kısa satır ekleyin ve [son durumu](07-SON-DURUM-VE-DEVAM.md) güncelleyin.

Aşağıdaki alanları gerçek sonuçlarla doldurun:

```md
# NN · Çalışmanın adı

Tarih / saat dilimi:
Başlangıç sürümü veya commit:

## 1. Kullanıcının bu aşamadaki isteği

İstek ve korunacak mevcut özellikler.

## 2. Başlangıçta ne vardı?

İncelenen dosyalar ve gözlenen sorun. Varsayımı gözlemden ayırın.

## 3. Ne yaptım?

Sırayla işlemler, değişen dosyalar, veri geçişi ve mevcut kayıtların korunması.

## 4. Neye karar verdim, neden?

Seçilen çözüm, alternatifin somut eksisi ve varsa önceki karardaki değişiklik.

## 5. Hata / düzeltme

Gerçekte karşılaşılan hata, nedeni, düzeltme ve kalan etkisi. Gerçek saldırı yaşanmadıysa testte bulunan sorunu saldırı olmuş gibi yazmayın.

## 6. Nasıl doğruladım?

Çalıştırılan komutlar, geçen/kalan testler, gerçek ve taklit servis farkı, ekranlar. Çalıştırılmayan kontrolü belirtin.

## 7. Teslim / devam

Dal, kesin commit veya sürüm, veri/anahtar taşıma gereksinimi; tamamlananlar ve gerçekten kalan adımlar. İlk yapılacak tek somut adımı yazın.
```

Parola, şifreleme anahtarı, canlı token, kurtarma bağlantısı veya müşteri dosya içeriğini örneğe koymayın. Dosya konumu ve sentetik kayıt yeterlidir. Gerçek sunucuya dağıtılmamış kaynak değişikliğini canlıya alınmış gibi işaretlemeyin.
