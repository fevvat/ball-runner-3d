# 🎮 Ball Runner 3D

**Ball Runner 3D**, Three.js kullanılarak geliştirilmiş, refleks, denge ve zamanlama odaklı bir **3D top parkur oyunudur**.  
Oyuncu; engelleri aşar, coin toplar, güçlendirmeleri kullanır ve bölümleri tamamlayarak en yüksek skora ulaşmaya çalışır.

---

## 🚀 Proje Hakkında

  
Sadece basit bir hareket sistemi değil; farklı oyun mekanikleri, kullanıcı arayüzleri ve modüler JavaScript yapısıyla daha kapsamlı bir oyun deneyimi sunmayı hedefler.

Oyunun temel amacı:

- 🟡 Topu kontrol etmek
- 🧱 Engelleri aşmak
- 💰 Coin toplamak
- ⚡ Power-up kullanmak
- 🏁 Bölümü başarıyla tamamlamak
- 🏆 En yüksek skoru elde etmek

---

## ✨ Öne Çıkan Özellikler

- 🎯 3 farklı level
- 🟡 Akıcı top kontrol sistemi
- ⬆️ Zıplama ve double jump
- 💰 Coin toplama sistemi
- ❤️ Can sistemi
- 📍 Checkpoint sistemi
- ⚡ Power-up sistemi
- 🚧 Farklı engel türleri
- 🗺️ Minimap
- 🏆 Leaderboard
- ⏸️ Pause / Game Over / Level Complete ekranları
- 📱 Mobil kontrol desteği
- 🔊 Ses ve müzik sistemi

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5**
- **CSS3**
- **JavaScript (ES6 Modules)**
- **Three.js**
- **LocalStorage**

---

## 🎮 Oynanış Mekanikleri

### 🟢 Temel Mekanikler
- Top hareketi
- Yön kontrolü
- Zıplama
- Çift zıplama
- Bölüm tamamlama

### 🔥 Gelişmiş Sistemler
- Checkpoint üzerinden yeniden doğma
- Coin ve skor sistemi
- Combo mantığı
- Geçici güçlendirmeler
- Farklı engel türleri
- Mobil cihaz desteği
- Kayıtlı skor tablosu

---

## ⌨️ Kontroller

### 💻 Klavye Kontrolleri
- `W / A / S / D` → Hareket
- `Yön Tuşları` → Hareket
- `Space` → Zıplama
- `P` → Oyunu duraklat
- `ESC` → Pause menüsü

### 📱 Mobil Kontroller
- Sol alt joystick alanı → Hareket
- Sağ alt jump butonu → Zıplama
- Pause butonu → Oyunu duraklatma

---

## 📂 Proje Yapısı

```bash
ball-runner-3d/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── physics.js
│   ├── ui.js
│   ├── controls.js
│   ├── audio.js
│   ├── levels.js
│   ├── obstacles.js
│   ├── powerups.js
│   └── minimap.js
└── assets/
    ├── textures/
    └── generate-textures.html
