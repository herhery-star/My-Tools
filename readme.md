# MY TOOLS V2 — Personal Multi-Device HTML App Launcher

MY TOOLS V2 adalah launcher personal berbasis web yang dirancang untuk mengorganisasi dan mengakses berbagai aplikasi HTML buatan sendiri secara cepat dari seluruh perangkat (PC, Laptop, Tablet, Smartphone) dengan dukungan **Google Sheets Cloud Sync** dan **Offline Local Cache**.

---

## 🛠️ LANGKAH SETUP GOOGLE SHEETS & GOOGLE APPS SCRIPT (BACKEND)

### 1. Membuat Spreadsheet Database
1. Buka [Google Sheets](https://sheets.google.com) dan buat spreadsheet baru.
2. Beri nama spreadsheet, misalnya: `MY_TOOLS_DATABASE`.
3. Ubah nama sheet pertama dari `Sheet1` menjadi **`Apps`** (Wajib).
4. Pada Baris 1 (Header), masukkan nama kolom berikut secara berurutan:
   - `A1`: `id`
   - `B1`: `name`
   - `C1`: `description`
   - `D1`: `category`
   - `E1`: `icon`
   - `F1`: `onlineUrl`
   - `G1`: `version`
   - `H1`: `favorite`
   - `I1`: `order`
   - `J1`: `updatedAt`
   - `K1`: `updatedBy`

---

### 2. Membuat Google Apps Script Web App
1. Di dalam Google Sheets tersebut, klik menu **Extensions (Ekstensi)** → **Apps Script**.
2. Hapus seluruh isi kode bawaan pada `Code.gs`.
3. Salin seluruh isi file `Code.gs` dari proyek ini dan tempelkan ke editor Apps Script.
4. Klik tombol **Save 💾** (Ctrl + S).

---

### 3. Deploy Web App API
1. Klik tombol **Deploy** di kanan atas → pilih **New deployment**.
2. Klik ikon ⚙️ (*Select type*) → pilih **Web app**.
3. Isi konfigurasi deployment:
   - **Description**: `MY TOOLS V2 API`
   - **Execute as**: **Me** (Email Anda)
   - **Who has access**: **Anyone** *(Wajib agar Launcher dari perangkat manapun dapat mengakses API tanpa hambatan OAuth CORS)*.
4. Klik **Deploy**.
5. Berikan izin akses (*Authorize access*) dengan login akun Google Anda jika diminta (Klik *Advanced* → *Go to Code.gs (unsafe)*).
6. Salin **Web App URL** yang dihasilkan.
   *(Format URL: `https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`)*.

---

## 📱 KONFIGURASI PADA LAUNCHER V2

1. Buka `index.html` launcher pada browser PC, Tablet, atau HP Anda.
2. Klik ikon Pengaturan **⚙️** di sudut kanan atas header.
3. Tempelkan URL Apps Script ke kolom **Google Apps Script Web App URL**.
4. Berikan nama perangkat pada **Nama Perangkat Ini** (misal: `PC Utama` atau `Tablet Samsung`).
5. Klik **Test Connection** untuk memverifikasi.
6. Klik **Simpan & Sync**. Data lokal akan otomatis tersinkronisasi dengan Google Sheets!

---

## 🚀 HOSTING DAN INSTALL PWA (GITHUB PAGES)

1. Push folder proyek `MY-TOOLS-V2` ke repository GitHub milik Anda.
2. Aktifkan **GitHub Pages** melalui `Settings` → `Pages` → Source: `main` branch `/root`.
3. Akses URL GitHub Pages di browser smartphone/tablet Anda.
4. Pilih opsi **Add to Home Screen** atau **Install App** pada browser untuk menggunakannya sebagai **Native Progressive Web App (PWA)**.

---

## 🔒 PENJELASAN LOCAL PATH PERANGKAT
Kolom **Local Path Spesifik Perangkat Ini** pada Form Add/Edit Tool disimpan secara eksklusif di `localStorage` masing-masing perangkat. Konfigurasi ini tidak akan di-sync ke cloud sehingga path lokal PC (`D:\MyTools\...`) tidak mengganggu path lokal tablet atau smartphone Anda.