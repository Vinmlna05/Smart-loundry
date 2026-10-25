<p align="center">
  <h1 align="center">Cleanora</h1>
  <p align="center"><strong>Smart Laundry &amp; Care</strong></p>
  <p align="center">Web pemesanan dan manajemen laundry dengan pemesanan manual dan Chatbot AI (teks dan suara).</p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-FF2D20?logo=laravel&logoColor=white" alt="Laravel">
  <img src="https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Inertia.js-9553E9?logo=inertia&logoColor=white" alt="Inertia.js">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Gemini_API-4285F4?logo=googlegemini&logoColor=white" alt="Gemini API">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

## Tentang Cleanora

Cleanora adalah aplikasi web laundry yang membuat pemesanan lebih praktis bagi pelanggan dan pengelolaan pesanan lebih rapi bagi pemilik usaha. Pelanggan bisa memesan lewat formulir atau mengobrol dengan Chatbot AI, lalu memantau status cucian dari penjemputan sampai diterima kembali.

Fitur utama:

- **Dua cara memesan.** Pesan manual lewat formulir, atau Chatbot AI berbasis Gemini yang memahami pesan teks maupun voice note.
- **Satu format data pesanan.** Kedua jalur menghasilkan struktur data yang sama, sehingga validasi, estimasi harga, dan penyimpanan memakai proses yang sama.
- **Estimasi dan harga final.** Estimasi harga saat memesan, harga final setelah cucian ditimbang.
- **Penjemputan atau antar sendiri.** Pelanggan memilih dijemput petugas atau mengantar ke outlet.
- **Pelacakan pesanan.** Status penjemputan, penerimaan, pembayaran, pencucian, dan penyerahan bisa dilihat pelanggan.
- **Nota dan pembayaran.** Nota, instruksi pembayaran, unggah bukti transfer, dan konfirmasi lunas oleh admin.
- **Notifikasi WhatsApp.** Konfirmasi pesanan, nota, pengingat pembayaran, cucian siap, dan pengingat penerimaan.
- **Dashboard admin.** Kelola pesanan, pelanggan, layanan dan tarif, pembayaran, pengaturan chatbot, dan laporan transaksi.

## Alur Singkat

```
Pelanggan buka website
   -> Pesan Manual  atau  Chatbot AI
   -> Data pesanan (format sama) -> validasi -> estimasi harga -> konfirmasi
   -> Pesanan tersimpan, nomor pesanan dibuat
   -> Penjemputan / antar sendiri -> penimbangan -> harga final
   -> Pembayaran -> pencucian -> penyerahan -> selesai
```

## Halaman

**Pelanggan:** Beranda, Layanan dan Tarif, Pesan Manual, Chatbot AI, Ringkasan dan Konfirmasi, Lacak Pesanan, Detail Pesanan dan Nota, Login, Registrasi, Profil dan Riwayat.

**Admin dan petugas:** Dashboard, Manajemen Pesanan, Detail dan Proses Pesanan, Manajemen Pelanggan, Layanan dan Tarif, Pembayaran dan Nota, Pengaturan Chatbot AI, Laporan Transaksi.

Pelanggan tidak wajib login. Pemesanan tamu memakai nama dan nomor WhatsApp, dan pelacakan memakai nomor pesanan dan nomor WhatsApp.

## Teknologi

| Bagian | Teknologi |
|---|---|
| Backend | Laravel, PHP, MySQL/PostgreSQL |
| Frontend | React, Inertia.js, Tailwind CSS |
| AI | Google Gemini API (teks dan audio), dipanggil dari backend |
| Antrian | Laravel Queue (notifikasi dan pemanggilan Gemini) |
| Notifikasi | Gateway WhatsApp (dapat diganti lewat interface) |

## Persyaratan

- PHP 8.2 atau lebih baru (sesuaikan dengan versi Laravel yang dipakai)
- Composer
- Node.js 20 atau lebih baru dan npm
- MySQL 8 atau PostgreSQL
- API key Google Gemini

## Instalasi

```bash
# 1. Clone repositori
git clone https://github.com/<username>/<nama-repo>.git
cd <nama-repo>

# 2. Pasang dependensi
composer install
npm install

# 3. Siapkan environment
cp .env.example .env
php artisan key:generate

# 4. Atur koneksi database di .env, lalu migrasi dan isi data awal
php artisan migrate --seed

# 5. Tautkan storage (untuk bukti transfer dan berkas unggahan)
php artisan storage:link
```

## Konfigurasi `.env`

```env
APP_NAME=Cleanora
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=cleanora
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database

# Gemini (hanya dipakai di backend, jangan ekspos ke frontend)
GEMINI_API_KEY=
GEMINI_MODEL=

# WhatsApp (isi sesuai gateway yang dipakai)
WHATSAPP_DRIVER=
WHATSAPP_API_URL=
WHATSAPP_API_TOKEN=
```

Jangan pernah meng-commit file `.env` atau API key ke repositori.

## Menjalankan

Buka beberapa terminal:

```bash
php artisan serve        # server Laravel
npm run dev              # Vite (React + Tailwind)
php artisan queue:work   # pemroses antrian (notifikasi, Gemini)
php artisan schedule:work  # pengingat otomatis (pembayaran, penerimaan)
```

Aplikasi berjalan di `http://localhost:8000`.

## Akun Awal

Seeder membuat akun untuk pengembangan. Ganti kata sandinya sebelum produksi.

| Peran | Email | Kata sandi |
|---|---|---|
| Admin | `admin@cleanora.test` | `password` |
| Petugas | `petugas@cleanora.test` | `password` |

## Status Pesanan

```
draft -> terkonfirmasi -> menunggu_penjemputan / menunggu_antaran_pelanggan
-> diterima -> ditimbang -> menunggu_pembayaran -> lunas
-> siap_diproses -> diproses -> selesai_dicuci
-> siap_diambil / dalam_pengantaran -> diterima_pelanggan -> selesai
(sebelum lunas) -> dibatalkan
```

Setiap perubahan status dicatat di log beserta pelaku dan waktunya.

## Pengujian

```bash
php artisan test
```

Pengujian mencakup pembuatan pesanan (manual dan chatbot menghasilkan data identik), perhitungan harga, transisi status, dan hak akses per peran.

## Struktur Proyek

```
app/
  Actions/Orders/       logika pesanan (buat, timbang, bayar, selesai)
  Enums/                OrderStatus
  Services/
    Gemini/             ekstraksi pesanan dan transkripsi audio
    Pricing/            perhitungan estimasi dan harga final
    Notifications/      pengirim WhatsApp dan template pesan
  Http/Requests/        validasi (dipakai bersama manual dan chatbot)
resources/js/
  Pages/Customer/       halaman pelanggan
  Pages/Admin/          halaman admin dan petugas
  Components/           komponen UI bersama
```

## Keamanan

- Validasi dan otorisasi dilakukan di server. Hasil ekstraksi Gemini selalu divalidasi ulang.
- API key hanya di backend. Bukti transfer disimpan privat.
- Rate limit pada chatbot, pelacakan pesanan, dan login.

Jika menemukan celah keamanan, hubungi pengelola proyek secara langsung dan jangan membuka isu publik.

## Kontribusi

1. Fork repositori ini
2. Buat cabang fitur: `git checkout -b fitur/nama-fitur`
3. Commit perubahan: `git commit -m "Tambah nama fitur"`
4. Push ke cabang: `git push origin fitur/nama-fitur`
5. Buka Pull Request

## Lisensi

Proyek ini berlisensi [MIT](LICENSE). Ubah bagian ini jika memakai lisensi lain.
