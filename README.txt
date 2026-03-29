Hive Task - Canlı Kullanıma Hazır HTML/CSS/JS + Firebase Sürümü

İçerik:
- index.html
- register.html
- login.html
- dashboard.html
- admin.html
- style.css
- app.js
- firebase-config.example.js
- firestore.rules
- firebase.json
- assets/htp-logo.png

ÖNEMLİ:
Bu paket demo mantığıyla localStorage kullanmıyor.
Gerçek çalışan sürüm için Firebase projesi açıp firebase-config.example.js dosyasını
firebase-config.js olarak kopyalaman ve kendi anahtarlarını girmen gerekiyor.

Kurulum:
1) Firebase Console'da proje oluştur.
2) Authentication -> Email/Password aktif et.
3) Firestore Database oluştur.
4) firebase-config.example.js dosyasını firebase-config.js olarak kopyala.
5) İçini kendi Firebase bilgilerle doldur.
6) firestore.rules içeriğini Firestore rules kısmına yapıştır.
7) İstersen Firebase Hosting ile yayınla.

İlk admin yapmak:
- Bir kullanıcı kaydol.
- Firestore -> users koleksiyonunda o kullanıcının role alanını "admin" yap.
- Sonra admin.html sayfasına gir.

Canlı çalışan özellikler:
- Kayıt
- Giriş
- Kullanıcı profil verileri
- Zorunlu twitter / telegram / terra wallet alanları
- Görev ekleme
- Admin panel
- Kullanıcı listeleme
- Çekim talebi oluşturma
- Çekim talebi onay / red
- Dashboard veri çekme
- HiveTaskPuan logosu düzgün boyutta gösterme

Not:
Buradan doğrudan sunucuya deploy edemem ama sana canlı kullanıma hazır dosya yapısını verdim.
İstersen sonraki adımda bunu Firebase Hosting'e uygun tek tek kurulum rehberiyle de çıkarırım.


KRİTİK DÜZELTME:
- Artık zip içinde firebase-config.js de var. İçini sen dolduracaksın.
- Önce debug.html sayfasını aç ve test et.
- register çalışmazsa ekranda doğrudan hata kodunu gösterecek.
