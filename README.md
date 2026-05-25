# SSB Academy

Aplikasi manajemen Sekolah Sepak Bola (SSB) berbasis mobile. Dibangun untuk membantu pengelola SSB, pelatih, dan orang tua murid dalam mengelola kegiatan akademi sepak bola secara digital -- mulai dari manajemen siswa, absensi, pembayaran SPP, hingga penilaian skill pemain.

---

## Tech Stack

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB dengan Motor (async driver)
- **Autentikasi:** JWT (JSON Web Token)
- **Dokumentasi API:** Swagger UI (otomatis dari FastAPI)

### Frontend
- **Framework:** React Native dengan Expo (SDK 54)
- **State Management:** React Context
- **Navigasi:** Expo Router

---

## Fitur Utama

- **Manajemen Siswa** -- Data lengkap siswa beserta riwayat akademi
- **Absensi** -- Pencatatan kehadiran latihan dan pertandingan
- **Pembayaran SPP** -- Pencatatan dan monitoring pembayaran bulanan
- **Penilaian Skill** -- Rating kemampuan teknis pemain oleh pelatih
- **Sesi Latihan** -- Penjadwalan dan pencatatan sesi latihan
- **Pertandingan** -- Manajemen jadwal dan hasil pertandingan
- **Pengumuman** -- Broadcast informasi ke seluruh pengguna
- **Izin/Perizinan** -- Pengajuan dan persetujuan izin ketidakhadiran
- **Notifikasi** -- Pemberitahuan real-time untuk berbagai aktivitas

### Peran Pengguna

| Peran | Hak Akses |
|-------|-----------|
| Admin | Pengelolaan penuh seluruh fitur dan data |
| Coach (Pelatih) | Absensi, penilaian skill, sesi latihan, pertandingan |
| Parent (Orang Tua) | Melihat data anak, pembayaran SPP, pengajuan izin |

---

## Struktur Proyek

```
ssb/
├── backend/             # API server (FastAPI + MongoDB)
│   ├── server.py        # Entry point aplikasi backend
│   ├── requirements.txt # Dependencies Python
│   ├── Dockerfile       # Container image untuk deployment
│   └── tests/           # Unit tests
├── frontend/            # Aplikasi mobile (React Native + Expo)
│   ├── app/             # Halaman dan navigasi (Expo Router)
│   ├── components/      # Komponen UI reusable
│   └── package.json     # Dependencies Node.js
└── docs/
    └── DEPLOYMENT.md    # Panduan deployment lengkap
```

---

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env sesuai konfigurasi Anda
uvicorn server:app --reload --host 0.0.0.0 --port 8001
```

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env
# Edit .env, arahkan ke backend URL
yarn start
```

Untuk panduan lengkap termasuk setup MongoDB, deployment ke cloud, dan build APK, lihat [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Akun Demo

Akun berikut dibuat secara otomatis saat backend pertama kali dijalankan (auto-seeded):

| Peran | Email | Password |
|-------|-------|----------|
| Admin | admin@ssb.id | admin123 |
| Coach | coach@ssb.id | coach123 |
| Parent | parent@ssb.id | parent123 |

---

## Dokumentasi API

Dokumentasi API interaktif (Swagger UI) tersedia secara otomatis saat backend berjalan:

- **Swagger UI:** `http://localhost:8001/docs`
- **ReDoc:** `http://localhost:8001/redoc`

---

## Deployment

Panduan lengkap untuk deployment tersedia di [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), mencakup:

- Setup MongoDB Atlas (free tier)
- Deploy backend ke Render
- Menjalankan frontend dengan Expo Go
- Build APK dengan EAS Build
- Konfigurasi environment variables
- Troubleshooting

---

## Lisensi

MIT License. Lihat file [LICENSE](LICENSE) untuk detail.
