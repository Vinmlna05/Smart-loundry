---
name: smart-laundry-web
description: Panduan membangun web Smart Laundry (Laravel + React/Inertia). Pakai skill ini untuk setiap tugas yang menyentuh pemesanan manual, chatbot AI (Gemini, teks dan suara), alur operasional laundry, status pesanan, pembayaran, notifikasi WhatsApp, halaman pelanggan, halaman admin, atau tampilan web laundry ini.
---

# Smart Laundry Web (Cleanora)

Sistem pemesanan dan operasional laundry. Pelanggan memesan lewat **formulir manual** atau **Chatbot AI**, keduanya menghasilkan **struktur data pesanan yang sama**. Setelah pesanan dikonfirmasi, admin dan petugas menjalankan alur operasional sampai cucian diterima pelanggan.

Semua teks antarmuka, pesan error, dan notifikasi memakai **Bahasa Indonesia**, kalimat biasa (sentence case), kata kerja aktif. Nama tombol konsisten sepanjang alur: tombol "Konfirmasi pesanan" menghasilkan toast "Pesanan dikonfirmasi".

## 1. Stack dan struktur

- Backend: Laravel (versi LTS terbaru), MySQL/PostgreSQL, Laravel Queue untuk notifikasi dan pemanggilan Gemini.
- Frontend: React lewat Inertia.js (disarankan, satu repo) dengan Tailwind CSS. Jika memakai SPA terpisah, API di `routes/api.php` dengan Sanctum.
- Auth: Laravel Breeze/Fortify + Sanctum. Role lewat kolom `role` (`admin`, `petugas`, `pelanggan`) atau spatie/laravel-permission.
- AI: Google Gemini API, dipanggil **hanya dari backend**. API key tidak boleh sampai ke browser.
- Notifikasi: WhatsApp (gateway dipilih pemilik, bungkus di satu interface `WhatsAppSender` agar mudah diganti).
- Pembayaran: awalnya transfer manual + bukti transfer. Sediakan interface `PaymentGateway` jika nanti pakai Midtrans/Xendit.

Struktur yang dianjurkan:

```
app/
  Actions/Orders/        CreateOrder, ConfirmWeight, ConfirmPayment, ...
  Enums/OrderStatus.php
  Services/
    Gemini/              GeminiClient, OrderExtractor, AudioTranscriber
    Pricing/             PriceCalculator
    Notifications/       WhatsAppSender, NotificationTemplates
  Http/Requests/         StoreOrderRequest (dipakai manual DAN chatbot)
resources/js/
  Pages/Customer/  Pages/Admin/  Components/  Layouts/
```

## 2. Aturan inti (jangan dilanggar)

1. **Satu skema pesanan.** Manual dan chatbot sama-sama memanggil `StoreOrderRequest` dan `CreateOrder`. Dilarang membuat logika validasi, hitung harga, atau simpan yang terpisah per jalur.
2. **Backend adalah sumber kebenaran.** Harga, status, dan validasi dihitung di server. Hasil ekstraksi Gemini dianggap input tidak tepercaya dan wajib divalidasi.
3. **Dua jenis harga.** `estimated_price` dihitung saat memesan dari estimasi jumlah. `final_price` dihitung setelah berat aktual dimasukkan admin. Simpan keduanya, jangan menimpa estimasi.
4. **Status lewat state machine.** Perubahan status hanya lewat `OrderStatus` dan transisi yang diizinkan (bagian 5). Setiap perubahan dicatat di `order_status_logs` (siapa, kapan, dari, ke).
5. **Notifikasi lewat queue**, dengan catatan di `notification_logs` agar bisa dicek jika gagal.
6. **Pelanggan tidak wajib login.** Pemesanan tamu didukung (nama + nomor WhatsApp). Akun hanya untuk riwayat dan alamat tersimpan. Pelacakan tamu memakai nomor pesanan + nomor WhatsApp.
7. **Nomor pesanan** unik, mudah dibaca, contoh `LDR-20261024-0001`, dibuat di server saat pesanan disimpan.

## 3. Alur pemesanan

### 3.1 Manual (`/pesan`)
Buka website, Pesan Manual, isi nama dan nomor WhatsApp, pilih layanan, isi jenis cucian dan estimasi jumlah, pilih metode:
- **Dijemput**: isi alamat dan jadwal jemput.
- **Antar sendiri**: pilih outlet dan perkiraan kedatangan.

Lalu `/pesan/konfirmasi`: periksa ringkasan. Jika data belum benar, kembali ke langkah yang salah. Jika benar, sistem hitung estimasi, pelanggan konfirmasi, simpan, terbitkan nomor pesanan, kirim konfirmasi dan status, lanjut ke alur bersama.

### 3.2 Chatbot AI (`/chatbot`)
1. Pelanggan memilih input: **teks** (ketik) atau **suara** (rekam/unggah voice note, Gemini memproses audio).
2. Gemini memahami pesan, lalu mengekstrak data pesanan ke JSON terstruktur.
3. Cek kelengkapan di backend. Jika belum lengkap, chatbot menanyakan **hanya data yang kurang**, pelanggan menjawab, kembali ke langkah 2 (loop sampai lengkap).
4. Jika lengkap, validasi backend, tampilkan ringkasan dan estimasi harga.
5. Pelanggan setuju: simpan, buat nomor pesanan, chatbot kirim konfirmasi, lanjut ke alur bersama. Tidak setuju: ubah data atau batalkan.

Ketentuan Gemini:
- Gunakan structured output (JSON schema) yang cocok dengan field `StoreOrderRequest`. Respons non-JSON atau tidak valid ditangani dengan satu kali coba ulang, lalu fallback pesan sopan dan tawaran pindah ke Pesan Manual.
- Chatbot hanya menjawab seputar layanan, tarif, dan pemesanan. Isi prompt sistem dari halaman Pengaturan Chatbot AI (`/admin/chatbot`).
- Chatbot tidak boleh mengarang tarif atau layanan. Daftar layanan dan tarif aktif disuntikkan ke konteks dari database.
- Batasi ukuran dan durasi audio, validasi tipe file, terapkan rate limit per IP/sesi.
- Simpan percakapan (`chat_sessions`, `chat_messages`) untuk audit dan perbaikan prompt. Jangan simpan audio mentah lebih lama dari yang perlu.

### 3.3 Alur bersama setelah pesanan dikonfirmasi
1. Pesanan masuk dashboard admin.
2. Penerimaan: petugas menjemput, atau pelanggan mengantar ke outlet.
3. Petugas menerima dan menimbang, admin memasukkan berat aktual, sistem menghitung harga final.
4. Kirim nota dan instruksi pembayaran.
5. Pembayaran terkonfirmasi? Belum: kirim pengingat dan cek ulang. Sudah: catat lunas.
6. Status menjadi siap diproses, petugas mencuci dan menyelesaikan, status diperbarui dan notifikasi dikirim.
7. Penyerahan: ambil sendiri (notifikasi siap diambil) atau diantar (atur pengiriman ke alamat).
8. Cucian sudah diterima? Belum: pengingat bertahap. Sudah: catat pesanan selesai.

## 4. Halaman

### A. Pelanggan
| # | Halaman | Route | Fungsi |
|---|---|---|---|
| 1 | Beranda | `/` | Info laundry, layanan, tarif, keunggulan, tombol pesan (pilihan Manual atau Chatbot AI) |
| 2 | Layanan dan tarif | `/layanan` | Jenis laundry, harga per kg/satuan, estimasi pengerjaan |
| 3 | Pesan manual | `/pesan` | Formulir nama, kontak, layanan, cucian, metode, alamat/jadwal/outlet |
| 4 | Chatbot AI | `/chatbot` | Pesan lewat teks atau suara |
| 5 | Ringkasan dan konfirmasi | `/pesan/konfirmasi` | Periksa detail dan estimasi sebelum simpan |
| 6 | Lacak pesanan | `/lacak-pesanan` | Status penjemputan sampai penyerahan |
| 7 | Detail pesanan dan nota | `/pesanan/{id}` | Berat aktual, rincian biaya, nota, status bayar, **unggah bukti transfer** |
| 8 | Login | `/login` | Opsional |
| 9 | Registrasi | `/register` | Opsional |
| 10 | Profil dan riwayat | `/akun` | Profil, riwayat, alamat tersimpan |

Tambahan yang disarankan (kerjakan setelah 10 halaman inti):
- Halaman sukses pesanan `/pesan/berhasil/{nomor}`: tampilkan nomor pesanan dan langkah berikutnya.
- Info outlet `/outlet`: alamat, jam buka, peta (dipakai juga di pilihan antar sendiri).

### B. Admin dan petugas
| # | Halaman | Route | Fungsi |
|---|---|---|---|
| 11 | Dashboard | `/admin` | Pesanan masuk, cucian diproses, pendapatan, tugas tertunda |
| 12 | Manajemen pesanan | `/admin/pesanan` | Cari dan filter semua pesanan (manual dan chatbot) |
| 13 | Detail dan proses pesanan | `/admin/pesanan/{id}` | Input berat aktual, perbarui harga, ubah status, catat penyerahan |
| 14 | Manajemen pelanggan | `/admin/pelanggan` | Kontak dan riwayat transaksi |
| 15 | Layanan dan tarif | `/admin/layanan` | Jenis layanan, tarif per kg/satuan, estimasi waktu |
| 16 | Pembayaran dan nota | `/admin/pembayaran` | Catat bayar, cek bukti transfer, buat nota, status lunas |
| 17 | Pengaturan Chatbot AI | `/admin/chatbot` | Sambutan, info layanan, aturan jawaban, konfigurasi |
| 18 | Laporan transaksi | `/admin/laporan` | Rekap pesanan, pendapatan, pembayaran, layanan terlaris |

Tambahan yang disarankan karena dibutuhkan alur:
- Outlet `/admin/outlet`: data outlet yang dipilih pelanggan saat antar sendiri.
- Petugas dan peran `/admin/petugas`: kelola akun admin/petugas dan hak aksesnya.
- Jemput dan antar `/admin/pengiriman`: jadwal dan penugasan penjemputan serta pengantaran.
- Notifikasi WhatsApp `/admin/notifikasi`: template pesan, log kirim, status gagal.

Hak akses: `admin` akses penuh. `petugas` hanya pesanan, input berat, dan ubah status operasional (tanpa laporan, tarif, dan pengaturan). Pelanggan hanya melihat pesanannya sendiri (cek kepemilikan atau pasangan nomor pesanan + WhatsApp untuk tamu).

## 5. Status pesanan

Enum `OrderStatus` dan transisi yang diizinkan:

```
draft -> terkonfirmasi
terkonfirmasi -> menunggu_penjemputan | menunggu_antaran_pelanggan
menunggu_penjemputan -> diterima
menunggu_antaran_pelanggan -> diterima
diterima -> ditimbang
ditimbang -> menunggu_pembayaran            (nota + instruksi dikirim)
menunggu_pembayaran -> lunas                (admin konfirmasi)
lunas -> siap_diproses -> diproses -> selesai_dicuci
selesai_dicuci -> siap_diambil | dalam_pengantaran
siap_diambil | dalam_pengantaran -> diterima_pelanggan -> selesai
(apa pun sebelum lunas) -> dibatalkan
```

Pengingat otomatis (scheduler Laravel): pembayaran belum dikonfirmasi (interval, misal 1 hari dan 3 hari), cucian belum diterima pelanggan (bertahap). Interval dibuat bisa diatur, jangan hardcode.

## 6. Model data minimal

`users` (role), `customers` (nama, whatsapp, user_id nullable), `addresses`, `outlets`, `services` (nama, unit kg/satuan, harga, estimasi_jam, aktif), `orders` (nomor, customer_id, source `manual|chatbot`, intake_method `jemput|antar`, delivery_method `ambil|antar`, pickup_address/schedule atau outlet_id + eta, estimated_weight, actual_weight, estimated_price, final_price, status, payment_status), `order_items` (service_id, jenis cucian, estimasi qty, qty aktual, harga), `payments` (jumlah, metode, bukti, dikonfirmasi_oleh, waktu), `order_status_logs`, `chat_sessions`, `chat_messages`, `notification_logs`, `settings`.

Pakai uang sebagai integer rupiah (bukan float). Nomor WhatsApp dinormalisasi ke format `62...`.

## 7. Tema dan desain (merek Cleanora)

Nama merek: **Cleanora, Laundry & Care**. Logo berupa ikon bintang berkilau putih/teal pada kotak membulat berwarna teal muda, diikuti nama merek dengan huruf serif. Tampilan: **terang, bersih, teal sebagai warna utama**, tenang dan terasa premium-rumahan. Jangan memakai tema gelap atau biru navy pada halaman pelanggan maupun admin. Semua warna lewat token (CSS variable / Tailwind theme), bukan hex yang tersebar.

Nilai hex di bawah adalah perkiraan dari tangkapan layar beranda. **Jika proyek sudah punya konfigurasi Tailwind atau file CSS dengan warna asli, nilai di sana yang dipakai dan tabel ini disesuaikan.**

Token warna:

| Token | Perkiraan | Pemakaian |
|---|---|---|
| `--bg` | `#F4FAFA` | Latar halaman dan bagian terang |
| `--surface` | `#FFFFFF` | Navbar, kartu, kolom formulir |
| `--border` | `#D9E6E8` | Garis tepi tipis kartu dan input |
| `--primary` | `#0B7A85` | Tombol utama, tautan aktif, garis bawah menu aktif |
| `--primary-hover` | `#096A74` | Hover/aktif tombol utama |
| `--primary-deep` | `#0A5F70` | Judul, bagian CTA (dipakai sebagai gradasi ke `--primary`) |
| `--footer` | `#064A5A` | Latar footer |
| `--tint` | `#E3F3F3` | Kotak ikon/logo, badge lembut, latar pilihan terpilih |
| `--text` | `#12303A` | Teks utama dan judul |
| `--text-muted` | `#4F6670` | Paragraf, keterangan |
| `--on-dark` | `#FFFFFF` | Teks di atas teal/footer |
| `--success` | `#2E9E6B` | Lunas, selesai |
| `--warning` | `#D99A2B` | Menunggu pembayaran, perlu tindakan |
| `--danger` | `#C94B4B` | Error, dibatalkan |

Tipografi:
- Judul dan nama merek: serif kontras tinggi (Playfair Display), bobot 600-700, huruf besar-kecil biasa. Jangan pakai untuk teks kecil atau isi formulir.
- Isi, menu, tombol, formulir, tabel: sans-serif geometris yang bersih (Plus Jakarta Sans), bobot 400/500/600/700. Jika proyek sudah memakai font lain, pakai font itu.
- Panjang baris isi di bawah 80 karakter. Teks kecil pendukung boleh `--text-muted`.

Aturan komponen:
- **Navbar** putih, tinggi lega, logo di kiri, menu tengah (Beranda, Layanan & Tarif, Pesan Manual, Cara Pesan, Tentang Kami), kanan: sapaan pengguna ("Halo, {nama}") dan tombol utama "Pesan Sekarang". Menu aktif diberi teks `--primary` dengan garis bawah.
- **Tombol utama**: isi `--primary`, teks putih, sudut membulat sedang (sekitar 8px), bobot 600. Tombol di atas latar teal: putih berisi (aksi utama) dan outline putih (aksi kedua), seperti pasangan "Pesan Manual" dan "Gunakan Chatbot AI".
- **Kartu**: putih, border 1px `--border`, sudut membulat sedang, bayangan sangat tipis atau tanpa bayangan. Kartu gambar boleh bersudut tegas dengan bingkai garis tipis yang bergeser, sesuai beranda.
- **Bagian CTA**: latar gradasi teal (`--primary-deep` ke `--primary`), judul serif putih rata tengah, satu kalimat pendukung, dua tombol berdampingan.
- **Footer**: latar `--footer`, logo dan slogan di kiri, tiga kolom tautan (Navigasi, Layanan, Bantuan). Judul kolom putih bobot 600, tautan putih redup.
- **Dua jalur pemesanan** tetap dibedakan secara konsisten: Pesan Manual memakai gaya utama (`--primary` solid), Chatbot AI memakai gaya kedua (outline `--primary` dengan latar `--tint`, plus ikon bintang berkilau). Pola ini dipakai pada kartu pilihan, tombol, dan badge `source` di tabel pesanan admin.
- **Status pesanan**: badge pill dengan teks status dan titik warna (`--success`, `--warning`, `--danger`, `--primary`). Jangan hanya mengandalkan warna.
- **Formulir**: label selalu terlihat di atas kolom, input putih dengan border `--border`, fokus memakai cincin `--primary`, pesan error di bawah kolom dengan `--danger` dan menjelaskan cara memperbaiki.
- **Halaman admin**: tema terang yang sama. Sidebar putih atau `--footer` dengan tautan aktif `--tint`, tabel dengan baris tipis, filter di atas tabel, kartu ringkasan di dashboard.
- **Chatbot**: gelembung pelanggan `--primary` dengan teks putih, gelembung bot putih dengan border `--border`. Ringkasan pesanan di akhir percakapan tampil sebagai kartu dengan tombol "Konfirmasi pesanan" dan "Ubah data".
- **Layout**: mobile first (mayoritas pelanggan memakai ponsel). Konten dibatasi lebar maksimum sekitar 1200px dan rata kiri untuk teks, rata tengah untuk bagian CTA.
- **Gerak**: hemat. Hanya transisi yang menjawab aksi pengguna (hover tombol, buka panel, konfirmasi, loading chatbot). Hormati `prefers-reduced-motion`.
- **Aksesibilitas**: kontras teks minimal AA (teks putih di atas `--primary` dan `--footer` sudah memenuhi, periksa lagi untuk `--text-muted`), fokus keyboard terlihat, target sentuh minimal 44px.
- **Gaya penulisan**: Bahasa Indonesia, sapaan "kamu" seperti di beranda, nada ramah dan singkat. Tombol memakai kata kerja ("Pesan sekarang", "Konfirmasi pesanan", "Lacak pesanan"). Keadaan kosong mengajak bertindak, pesan error menjelaskan apa yang terjadi dan langkah berikutnya.

## 8. Keamanan dan kualitas

- Validasi di server dengan FormRequest. Otorisasi dengan Policy/Gate.
- Bukti transfer: validasi mime dan ukuran, simpan di disk privat, tampilkan lewat URL bertanda tangan.
- Rate limit untuk `/chatbot`, `/lacak-pesanan`, dan login.
- Jangan mencatat API key, isi voice note, atau data sensitif ke log aplikasi.
- Tulis feature test untuk: pembuatan pesanan (manual dan chatbot menghasilkan data identik), perhitungan estimasi dan harga final, transisi status yang valid dan tidak valid, hak akses per role.
- Seeder: layanan contoh, satu outlet, akun admin dan petugas untuk pengembangan.

## 9. Cara agent bekerja dengan skill ini

1. Sebelum membuat fitur, tentukan tahap alur (bagian 3), halaman (bagian 4), dan status (bagian 5) yang disentuh.
2. Bangun dari bawah ke atas: migrasi dan model, Action/Service, FormRequest dan controller, lalu halaman React. Hindari logika bisnis di komponen React.
3. Setiap fitur baru yang mengubah status harus memakai state machine dan mencatat log.
4. Setiap halaman baru harus memakai token tema bagian 7 dan lolos pengecekan mobile.
5. Jika ada keputusan yang belum jelas (gateway WhatsApp, gateway pembayaran, apakah login wajib, aturan jam pengingat), tanyakan ke pemilik proyek, jangan berasumsi.
6. Akhiri tiap tugas dengan ringkasan: file yang berubah, test yang dijalankan, dan hal yang belum dikerjakan.
