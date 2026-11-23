# Panduan Deploy & Persiapan Payment
AkalBakal Digital Class

Total biaya hosting: Rp0. Yang dibayar hanya potongan per transaksi di platform checkout (Lynk.id / Scalev / Mayar).

---

## Kenapa Cloudflare, bukan Vercel

Paket gratis Vercel (Hobby) hanya untuk pemakaian pribadi non-komersial. Halaman ini menjual kelas, jadi
di Vercel harus pakai paket Pro (berbayar). Cloudflare Pages gratis dan tidak punya batasan seperti itu.

Kuota gratis Cloudflare yang dipakai project ini:
- File statis (halaman, CSS, JS, logo): gratis tanpa batas.
- Functions (API admin & data): 100.000 request per hari.
- KV (tempat simpan data & gambar): 100.000 baca/hari, 1.000 tulis/hari, total 1 GB.

Untuk katalog kelas, kuota ini sangat longgar.

---

## BAGIAN 1 — Deploy (sekali saja, ±20 menit)

### 1. Taruh project di GitHub
1. Buka github.com, login, lalu klik **New repository**. Nama: `akalbakal-class`. Pilih Private. Klik Create.
2. Di halaman repo kosong, klik **uploading an existing file**.
3. Ekstrak zip, lalu drag **isi** folder `akalbakal-class` (folder `functions`, `lib`, `public`, dan file README, PANDUAN, .gitignore) ke halaman upload.
   Jangan ikut upload file `.dev.vars` kalau ada.
4. Klik **Commit changes**.

### 2. Sambungkan ke Cloudflare Pages
1. Daftar/login di dash.cloudflare.com (gratis, tidak perlu kartu kredit).
2. Menu **Workers & Pages** > **Create** > pilih tab **Pages** > **Connect to Git**.
3. Hubungkan akun GitHub, pilih repo `akalbakal-class`.
4. Pengaturan build:
   - Framework preset: **None**
   - Build command: *(kosongkan)*
   - Build output directory: **public**
5. Klik **Save and Deploy**. Setelah selesai kamu dapat link `akalbakal-class.pages.dev`.

Halaman publik sudah tampil, tapi admin belum bisa menyimpan. Lanjut langkah 3.

### 3. Buat tempat penyimpanan (KV)
1. Menu **Storage & Databases** > **KV** > **Create a namespace**. Nama: `akalbakal-data`.
2. Buka project Pages kamu > **Settings** > **Bindings** > **Add** > **KV namespace**.
   - Variable name: **DATA** (huruf besar semua, harus persis)
   - KV namespace: pilih `akalbakal-data`
3. Simpan.

### 4. Pasang password admin
1. Project Pages > **Settings** > **Variables and Secrets** > **Add**.
2. Type: **Secret**. Name: **ADMIN_PASSWORD**. Value: password kamu (minimal 12 karakter, campur huruf dan angka).
3. Simpan.

### 5. Deploy ulang
Binding dan password baru aktif setelah deploy ulang.
Project Pages > **Deployments** > titik tiga di deployment teratas > **Retry deployment**.

### 6. Tes
1. Buka `https://akalbakal-class.pages.dev/admin`, login.
2. Tulisan di pojok kiri atas harus **"Tersambung ke server"**.
3. Ubah satu teks, klik **Simpan**, buka halaman depan. Perubahan muncul maksimal ±1 menit.
4. Coba upload satu thumbnail di tab Produk.

### 7. (Opsional) Domain sendiri
Project Pages > **Custom domains** > **Set up a custom domain**, lalu ikuti petunjuk DNS-nya.
Setelah domain final, buka `public/index.html` dan ganti baris `og:image` menjadi alamat lengkap,
misalnya `https://akalbakal-class.pages.dev/assets/img/og.jpg`, supaya preview link di WhatsApp/IG muncul gambarnya.

### Update kode ke depannya
Edit file di GitHub (atau upload ulang). Cloudflare otomatis deploy setiap ada commit baru.
Isi halaman (produk, harga, video, testimoni) cukup diubah dari `/admin`, tidak perlu sentuh GitHub.

---

## BAGIAN 2 — Persiapan payment

Website ini tidak memproses uang. Tombol "Belajar Sekarang" dan "Aset Gratis" hanya mengarah ke
halaman checkout platform. Platform yang mengurus pembayaran, kirim materi, dan pencairan dana.

### Pilih satu platform

| | Lynk.id | Scalev | Mayar |
|---|---|---|---|
| Biaya | Basic: 5% per transaksi + Rp5.000 tiap tarik dana. Pro Rp99.000/bulan: 3%, tarik dana gratis | 5% untuk e-payment (VA, QRIS, e-wallet), 0% untuk transfer bank | 4% untuk kelas online & produk digital |
| Paket gratis | Ada (Basic) | Ada, maksimal 3 landing page | Ada, maksimal 3 kelas online aktif |
| Cocok untuk | Paling dikenal pembeli, setup cepat | Yang mau LMS + banyak metode bayar | Kelas berisi video + portal member |

Biaya di atas belum termasuk pajak dan biaya kanal pembayaran. Cek ulang halaman harga resmi tiap platform sebelum daftar, karena bisa berubah.

Saran: mulai dengan satu platform saja supaya pembeli, laporan, dan pencairan dana tidak tercecer.

### Checklist sebelum jualan
1. **Daftar akun** dengan email bisnis (bukan email pribadi yang jarang dibuka).
2. **Lengkapi profil & verifikasi identitas** sesuai permintaan platform (biasanya KTP). Siapkan foto KTP yang jelas, tidak terpotong.
3. **Isi rekening pencairan** atas nama yang sama dengan KTP.
4. **Baca aturan pencairan** platform: kapan dana bisa ditarik dan biayanya.

### A. Produk berbayar (kelas)
1. Di platform, buat produk jenis **kelas online / e-course / produk digital**.
2. Upload materi:
   - Kalau platform punya LMS (kelas online): upload video per modul di sana. Pembeli dapat akses login.
   - Kalau tidak: upload video ke YouTube **Unlisted** atau Google Drive, lalu taruh link-nya di konten yang dikirim setelah bayar.
3. Isi **harga sama persis** dengan harga promo di website. Kalau di website Rp99.000, di checkout juga Rp99.000. Harga beda bikin pembeli ragu.
4. Isi pesan setelah pembayaran: ucapan terima kasih + cara akses materi + kontak WA kalau ada kendala.
5. Simpan, lalu **salin link checkout** produk itu.
6. Buka `/admin` > tab **Produk & Kelas** > tempel di **Link checkout** > Simpan.

### B. Aset gratis (wajib checkout dulu)
Tujuannya: orang kasih nama + email/WA dulu, baru dapat file. Kamu dapat database calon pembeli.
1. Siapkan folder Google Drive berisi asetnya.
   Klik **Bagikan** > Akses umum: **Siapa saja yang memiliki link** > peran **Viewer**. Salin link-nya.
2. Di platform, buat produk digital dengan **harga Rp0** (gratis).
3. Taruh link Drive di bagian konten/file yang dikirim setelah checkout, **bukan** di deskripsi produk (deskripsi bisa dilihat sebelum checkout).
4. Salin link checkout produk Rp0 itu.
5. `/admin` > tab **Link & Aset Gratis** > jenis "Aset gratis" > tempel link checkout > Simpan.
   Kalau yang kamu tempel link Drive langsung, admin akan memberi peringatan merah.

### C. Member Area
Isi tombol **Member Area Class** dengan link halaman login pembeli dari platform yang kamu pakai
(portal pembeli / LMS). Tanyakan ke CS platform kalau belum ketemu link-nya.

### D. Tes sebelum promosi
1. Checkout produk gratis pakai email lain. Pastikan link Drive diterima dan bisa dibuka dari HP yang belum login Google.
2. Untuk produk berbayar, minta teman beli sekali atau beli sendiri, lalu cek:
   - email/WA konfirmasi masuk,
   - materi bisa diakses,
   - transaksi muncul di dashboard platform.
3. Buka halaman website dari HP, klik semua tombol satu per satu.

---

## BAGIAN 3 — Pemakaian harian admin

- **Simpan**: wajib diklik setelah mengubah apa pun. Tombol berubah merah kalau ada perubahan belum tersimpan.
- **Backup**: unduh semua isi ke file `site.json`. Lakukan sebulan sekali atau sebelum perubahan besar.
- **Restore**: muat ulang dari file backup, lalu klik Simpan.
- Harga coret dan harga promo bisa dihapus (×) atau ditambah lagi. Harga coret hanya tampil dicoret kalau nilainya lebih besar dari harga promo.
- Bagian Video, Testimoni, Benefit, dan FAQ otomatis tersembunyi selama kosong. Isi testimoni asli saja.
- Gambar yang di-upload otomatis dikecilkan supaya halaman tetap ringan.
