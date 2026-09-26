# CATATAN HERY

Project GitHub Pages untuk aplikasi CATATAN HERY.

## Struktur
- `index.html` — aplikasi utama
- `manifest.json` — metadata PWA
- `sw.js` — cache shell aplikasi

## GitHub Pages
1. Buat repository, misalnya `Catatan-Hery`.
2. Upload ketiga file ini ke root repository.
3. Buka Settings → Pages.
4. Source: Deploy from a branch.
5. Branch: `main`, folder `/ (root)`.
6. Simpan.
7. Gunakan URL Pages yang diberikan GitHub sebagai alamat tetap aplikasi.

## Catatan arsitektur
IndexedDB digunakan sebagai cache/data lokal per-browser dan per-origin.
Google Apps Script tetap menjadi pusat pertukaran data.
SAVE: Lokal → GAS.
SINKRONISASI: GAS → Lokal.
