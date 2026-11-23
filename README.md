# AkalBakal Digital Class

Halaman katalog kelas & produk digital (`/`) + panel admin (`/admin`).
Hosting: Cloudflare Pages + Pages Functions + Workers KV (paket gratis).

Langkah deploy dan persiapan payment: lihat **PANDUAN.md**.

## Struktur

```
public/                 file statis (output directory di Cloudflare)
  index.html            halaman publik
  admin/index.html      panel admin
  assets/js/app.js      render halaman publik dari data
  assets/js/admin.js    editor CRUD
  data/site.json        data awal / cadangan kalau KV kosong
  _headers              header cache & keamanan
functions/
  api/data.js           GET data, POST simpan (butuh ADMIN_PASSWORD)
  api/upload.js         upload gambar ke KV
  img/[name].js         menyajikan gambar dari KV
lib/shared.js           cek password + pembersih data
```

Binding yang dibutuhkan di Cloudflare:
- KV namespace dengan variable name `DATA`
- Secret `ADMIN_PASSWORD`

## Preview lokal

Tanpa backend (admin tersimpan di browser saja):
```
cd public && python3 -m http.server 8000
```

Lengkap dengan backend:
```
echo "ADMIN_PASSWORD=tes123" > .dev.vars
npx wrangler pages dev public --kv DATA
```
