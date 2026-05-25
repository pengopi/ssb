# Panduan Deployment & Instalasi - SSB Academy

Panduan lengkap untuk menjalankan dan men-deploy aplikasi SSB Academy (Sekolah Sepak Bola).

---

## Daftar Isi

1. [Prasyarat](#prasyarat)
2. [Setup Development Lokal](#setup-development-lokal)
3. [Deploy MongoDB ke MongoDB Atlas](#deploy-mongodb-ke-mongodb-atlas)
4. [Deploy Backend ke Render](#deploy-backend-ke-render)
5. [Menjalankan Frontend dengan Expo Go](#menjalankan-frontend-dengan-expo-go)
6. [Build APK dengan EAS Build](#build-apk-dengan-eas-build)
7. [Referensi Environment Variables](#referensi-environment-variables)
8. [Troubleshooting](#troubleshooting)

---

## Prasyarat

Pastikan tools berikut sudah terinstall di komputer Anda:

| Tool | Versi Minimum | Cara Install |
|------|---------------|--------------|
| Python | 3.10+ | [python.org](https://www.python.org/downloads/) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org/) |
| Yarn | 1.22+ | `npm install -g yarn` |
| Git | 2.30+ | [git-scm.com](https://git-scm.com/) |
| Expo CLI | Terbaru | `npm install -g expo-cli` |
| Expo Go App | Terbaru | Install dari Play Store / App Store |

---

## Setup Development Lokal

### 1. Clone Repository

```bash
git clone https://github.com/pengopi/ssb.git
cd ssb
```

### 2. Setup Backend

```bash
# Masuk ke folder backend
cd backend

# Buat virtual environment Python
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy file environment
cp .env.example .env
```

Edit file `backend/.env` dan isi dengan konfigurasi Anda:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=ssb_academy
JWT_SECRET=ganti-dengan-secret-key-anda-yang-aman
```

> **Catatan:** Jika menggunakan MongoDB Atlas, ganti `MONGO_URL` dengan connection string dari Atlas.

Jalankan backend:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

Backend akan berjalan di `http://localhost:8001`. Dokumentasi API tersedia di `http://localhost:8001/docs`.

**Akun Demo (otomatis dibuat saat pertama kali backend dijalankan):**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ssb.id | admin123 |
| Coach | coach@ssb.id | coach123 |
| Parent | parent@ssb.id | parent123 |

### 3. Setup Frontend

Buka terminal baru:

```bash
# Masuk ke folder frontend
cd frontend

# Install dependencies
yarn install

# Copy file environment
cp .env.example .env
```

Edit file `frontend/.env`:

```env
EXPO_PUBLIC_BACKEND_URL=http://192.168.x.x:8001
```

> **Penting:** Gunakan IP lokal komputer Anda (bukan `localhost`) agar perangkat mobile bisa terhubung. Cek IP dengan `ipconfig` (Windows) atau `ifconfig` (macOS/Linux).

Jalankan frontend:

```bash
yarn start
```

Scan QR code yang muncul menggunakan aplikasi Expo Go di HP Anda.

---

## Deploy MongoDB ke MongoDB Atlas

MongoDB Atlas menyediakan database gratis (tier M0) yang cukup untuk development dan demo.

### Langkah 1: Buat Akun Atlas

1. Buka [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Klik **"Try Free"** dan daftar dengan email atau Google Account
3. Pilih plan **M0 FREE** (gratis selamanya, 512MB storage)

### Langkah 2: Buat Cluster

1. Setelah login, klik **"Build a Database"**
2. Pilih **M0 (Free)** tier
3. Pilih provider: **AWS** (disarankan)
4. Pilih region terdekat: **Singapore (ap-southeast-1)** untuk latency terbaik dari Indonesia
5. Beri nama cluster, misalnya: `ssb-academy`
6. Klik **"Create Deployment"**

### Langkah 3: Setup Akses Database

1. **Buat Database User:**
   - Username: `ssb_admin` (atau sesuai keinginan)
   - Password: buat password yang kuat (catat baik-baik!)
   - Klik **"Create User"**

2. **Whitelist IP Address:**
   - Untuk development: klik **"Add My Current IP Address"**
   - Untuk production (Render): klik **"Allow Access from Anywhere"** (`0.0.0.0/0`)
   - Klik **"Add Entry"**

### Langkah 4: Dapatkan Connection String

1. Klik **"Connect"** pada cluster Anda
2. Pilih **"Connect your application"**
3. Pilih Driver: **Python** versi **3.12 or later**
4. Copy connection string, formatnya seperti ini:

```
mongodb+srv://ssb_admin:<password>@ssb-academy.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

5. Ganti `<password>` dengan password yang Anda buat tadi
6. Gunakan string ini sebagai nilai `MONGO_URL`

### Langkah 5: Buat Database

Database akan otomatis dibuat saat backend pertama kali terhubung. Nama database sesuai nilai `DB_NAME` di environment variable.

---

## Deploy Backend ke Render

Render menyediakan hosting gratis untuk web service yang cocok untuk demo dan development.

### Langkah 1: Persiapan

Pastikan repository sudah ada di GitHub dan berisi:
- `backend/Dockerfile`
- `backend/requirements.txt`
- `backend/server.py`

### Langkah 2: Buat Akun Render

1. Buka [https://render.com](https://render.com)
2. Daftar dengan akun GitHub (disarankan agar bisa langsung connect repo)

### Langkah 3: Buat Web Service

1. Di Dashboard Render, klik **"New +"** > **"Web Service"**
2. Connect repository GitHub Anda (`pengopi/ssb`)
3. Isi konfigurasi berikut:

| Setting | Nilai |
|---------|-------|
| Name | `ssb-academy-api` |
| Region | Singapore (Southeast Asia) |
| Branch | `main` |
| Root Directory | `backend` |
| Runtime | Docker |
| Instance Type | Free |

### Langkah 4: Set Environment Variables

Di halaman Environment pada Render, tambahkan:

| Key | Value |
|-----|-------|
| `MONGO_URL` | Connection string MongoDB Atlas Anda |
| `DB_NAME` | `ssb_academy` |
| `JWT_SECRET` | String acak yang panjang dan aman (min 32 karakter) |

> **Tips:** Generate JWT_SECRET yang aman dengan: `python -c "import secrets; print(secrets.token_hex(32))"`

### Langkah 5: Deploy

1. Klik **"Create Web Service"**
2. Tunggu proses build selesai (biasanya 3-5 menit pertama kali)
3. Setelah deploy berhasil, Anda akan mendapat URL seperti: `https://ssb-academy-api.onrender.com`
4. Test dengan membuka: `https://ssb-academy-api.onrender.com/docs`

### Deploy Otomatis dengan render.yaml (Opsional)

Jika ingin menggunakan Infrastructure as Code, file `backend/render.yaml` sudah disediakan. Caranya:

1. Buka [https://render.com/blueprints](https://render.com/blueprints)
2. Klik **"New Blueprint Instance"**
3. Connect repository Anda
4. Render akan otomatis membaca `render.yaml` dan membuat service
5. Isi environment variables yang diminta

### Catatan Penting tentang Free Tier Render

- Service akan **sleep** setelah 15 menit tidak ada traffic
- Request pertama setelah sleep akan memakan waktu ~30 detik (cold start)
- Bandwidth terbatas 100GB/bulan
- Untuk produksi, pertimbangkan upgrade ke plan berbayar

---

## Menjalankan Frontend dengan Expo Go

### Langkah 1: Install Expo Go

- **Android:** Download dari [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS:** Download dari [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

### Langkah 2: Konfigurasi Environment

Edit `frontend/.env`:

```env
# Untuk development lokal (gunakan IP komputer Anda):
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:8001

# Untuk menggunakan backend yang sudah di-deploy ke Render:
EXPO_PUBLIC_BACKEND_URL=https://ssb-academy-api.onrender.com
```

### Langkah 3: Jalankan Expo

```bash
cd frontend
yarn start
```

### Langkah 4: Connect dari HP

1. Pastikan HP dan komputer terhubung ke WiFi yang sama
2. Buka aplikasi Expo Go di HP
3. Scan QR code yang muncul di terminal
4. Aplikasi akan ter-load di HP Anda

### Tips Development

- Shake HP untuk membuka Developer Menu
- Tekan `r` di terminal untuk reload aplikasi
- Tekan `m` di terminal untuk toggle menu
- Gunakan `--tunnel` jika berada di jaringan yang berbeda: `yarn start --tunnel`

---

## Build APK dengan EAS Build

EAS (Expo Application Services) memungkinkan Anda membuat file APK untuk distribusi.

### Langkah 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Langkah 2: Login ke Expo

```bash
eas login
```

Masukkan kredensial akun Expo Anda. Jika belum punya, daftar di [expo.dev](https://expo.dev).

### Langkah 3: Konfigurasi EAS

```bash
cd frontend
eas build:configure
```

Ini akan membuat file `eas.json`. Edit sesuai kebutuhan:

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Langkah 4: Konfigurasi Environment untuk Build

Buat file `frontend/.env.production`:

```env
EXPO_PUBLIC_BACKEND_URL=https://ssb-academy-api.onrender.com
```

### Langkah 5: Build APK

```bash
# Build APK untuk testing/preview
eas build --platform android --profile preview
```

### Langkah 6: Download APK

1. Setelah build selesai (biasanya 10-15 menit), Anda akan mendapat link download
2. Atau buka [https://expo.dev](https://expo.dev) > Project Anda > Builds
3. Download file APK
4. Transfer ke HP dan install (aktifkan "Install from Unknown Sources" di Settings)

### Build App Bundle untuk Play Store

```bash
# Build AAB untuk upload ke Google Play Console
eas build --platform android --profile production
```

---

## Referensi Environment Variables

### Backend (`backend/.env`)

| Variable | Wajib | Deskripsi | Contoh |
|----------|-------|-----------|--------|
| `MONGO_URL` | Ya | Connection string MongoDB | `mongodb+srv://user:pass@cluster.mongodb.net/` |
| `DB_NAME` | Ya | Nama database MongoDB | `ssb_academy` |
| `JWT_SECRET` | Ya | Secret key untuk JWT token | `random-string-min-32-chars` |

### Frontend (`frontend/.env`)

| Variable | Wajib | Deskripsi | Contoh |
|----------|-------|-----------|--------|
| `EXPO_PUBLIC_BACKEND_URL` | Ya | URL backend API | `https://ssb-academy-api.onrender.com` |

> **Catatan:** Semua environment variable frontend yang menggunakan prefix `EXPO_PUBLIC_` akan tersedia di client-side code. Jangan simpan data sensitif di sini.

---

## Troubleshooting

### Backend tidak bisa connect ke MongoDB

**Gejala:** Error `ServerSelectionTimeoutError` saat startup

**Solusi:**
1. Pastikan `MONGO_URL` benar dan password sudah diganti
2. Jika menggunakan Atlas, pastikan IP Anda sudah di-whitelist
3. Periksa apakah cluster Atlas sedang aktif (tidak di-pause)
4. Coba test koneksi dengan: `python -c "from pymongo import MongoClient; MongoClient('MONGO_URL_ANDA').admin.command('ping')"`

### Frontend tidak bisa connect ke backend

**Gejala:** Error Network Request Failed

**Solusi:**
1. Pastikan backend sudah berjalan
2. Gunakan IP lokal komputer (bukan `localhost` atau `127.0.0.1`)
3. Pastikan HP dan komputer di jaringan WiFi yang sama
4. Cek apakah firewall memblokir port 8001
5. Coba akses backend dari browser HP: `http://192.168.x.x:8001/docs`

### Expo Go tidak bisa scan QR code

**Solusi:**
1. Pastikan koneksi internet aktif di HP
2. Coba jalankan dengan tunnel: `yarn start --tunnel`
3. Pastikan versi Expo Go di HP kompatibel dengan SDK di project (SDK 54)
4. Clear cache Expo: `yarn start --clear`

### Error "Module not found" di frontend

**Solusi:**
```bash
cd frontend
rm -rf node_modules
yarn install
yarn start --clear
```

### Backend error "JWT_SECRET not set"

**Solusi:**
1. Pastikan file `.env` ada di folder `backend/`
2. Pastikan variabel `JWT_SECRET` sudah diisi
3. Restart backend setelah mengubah `.env`

### Build APK gagal

**Solusi:**
1. Pastikan sudah login EAS: `eas whoami`
2. Pastikan `app.json` atau `app.config.js` memiliki `android.package` yang valid
3. Cek log build di [expo.dev](https://expo.dev) untuk detail error
4. Pastikan versi EAS CLI terbaru: `npm install -g eas-cli@latest`

### Render deploy gagal

**Solusi:**
1. Cek build logs di dashboard Render
2. Pastikan `Dockerfile` ada di folder `backend/`
3. Pastikan `requirements.txt` tidak memiliki dependency yang konflik
4. Verifikasi semua environment variables sudah diset di Render

### Data demo tidak muncul

**Gejala:** Login dengan akun demo gagal

**Solusi:**
1. Akun demo (admin@ssb.id, coach@ssb.id, parent@ssb.id) dibuat otomatis saat backend pertama kali start
2. Jika database sudah ada tapi kosong, restart backend
3. Cek log backend untuk melihat apakah seeding berhasil
4. Pastikan koneksi ke database berhasil terlebih dahulu

---

## Tips Tambahan

### Untuk Development Tim

- Gunakan branch terpisah untuk setiap fitur
- Jangan commit file `.env` ke repository
- Gunakan `.env.example` sebagai referensi
- Setup MongoDB Atlas dengan akses terpisah per developer

### Untuk Demo/Presentasi

- Deploy backend ke Render 30 menit sebelum demo (agar service sudah warm)
- Gunakan akun demo yang sudah disediakan
- Siapkan koneksi internet yang stabil
- Sebagai backup, siapkan juga setup lokal

### Keamanan

- Selalu ganti `JWT_SECRET` default untuk production
- Gunakan password MongoDB yang kuat (minimal 16 karakter)
- Jangan expose database langsung ke internet tanpa whitelist IP
- Rotasi secret key secara berkala

---

*Dokumentasi ini terakhir diperbarui untuk SSB Academy v1.0*
