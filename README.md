# 🌳 Pohon Keluarga — Silsilah Interaktif

Website satu halaman untuk menampilkan riwayat keluarga. Pohon keluarga digambar
otomatis dari data, dan setiap anggota bisa diklik untuk membuka pop-up detail
berisi identitas, foto, hobi, makanan kesukaan, sampai fakta-fakta seru.

Dibangun dengan **HTML + CSS + JavaScript murni** — tanpa framework, tanpa proses
build, tanpa dependensi yang perlu di-install. Cukup buka `index.html`.

---

## ✨ Fitur

| Fitur | Keterangan |
|---|---|
| **CRUD lengkap** | Tambah, ubah, dan hapus anggota langsung dari halaman — tanpa menyentuh kode. Perubahan tersimpan otomatis di browser. |
| **Pilihan Domisili & Agama** | Domisili menyediakan 38 provinsi dan 514 kabupaten/kota Indonesia; Agama punya tujuh pilihan bawaan. Keduanya tetap bisa diketik bebas untuk menambah nilai sendiri. |
| **Pohon otomatis** | Tata letak generasi, pasangan, dan garis keturunan dihitung sendiri dari data — tidak ada koordinat yang perlu diatur manual. |
| **Pop-up detail** | Klik kartu mana pun untuk melihat foto besar, identitas lengkap, kutipan favorit, hobi, makanan kesukaan, dan fakta seru. |
| **Lompat antar relasi** | Di dalam pop-up, orang tua/pasangan/anak/saudara bisa diklik untuk langsung berpindah, lengkap dengan tombol kembali. |
| **Geser & zoom** | Drag untuk menjelajah, scroll atau cubit (pinch) untuk zoom, plus tombol perbesar/perkecil/sesuaikan layar. |
| **Sorot keluarga** | Arahkan kursor ke satu kartu — pasangan, orang tua, dan anaknya ikut tersorot beserta garis relasinya. |
| **Pencarian** | Cari berdasarkan nama, panggilan, domisili, pekerjaan, atau hobi; hasilnya langsung disorot dan dibawa ke tengah layar. |
| **Tema terang & gelap** | Mengikuti preferensi sistem, dan bisa diganti manual (pilihan tersimpan di browser). |
| **Unggah foto** | Pilih foto dari perangkat; otomatis dipotong persegi dan diperkecil agar hemat penyimpanan. |
| **Avatar otomatis** | Belum punya foto? Avatar inisial bergradasi dibuat otomatis dari nama. |
| **Ekspor & impor** | Cadangkan seluruh data sebagai JSON, pulihkan kapan saja, atau salin kembali menjadi `js/data.js`. |
| **Responsif** | Di ponsel, pop-up tampil sebagai bottom sheet dan kanvas tetap bisa dicubit. |

### Pintasan papan ketik

| Tombol | Fungsi |
|---|---|
| `/` | Fokus ke kotak pencarian |
| `N` | Tambah anggota baru |
| `Esc` | Tutup form/pop-up/menu, atau bersihkan pencarian |
| `+` / `-` | Perbesar / perkecil |
| `0` atau `F` | Sesuaikan pohon ke layar |

---

## 🚀 Cara menjalankan

Klik dua kali `index.html` — selesai. Tidak ada langkah lain.

Kalau ingin dijalankan lewat server lokal (opsional, misalnya untuk mengetes di
ponsel dalam jaringan yang sama):

```bash
python -m http.server 8000
# lalu buka http://localhost:8000
```

---

## 🗂️ Mengelola data lewat aplikasi

Ada dua cara mengisi data: **lewat halaman** (paling praktis) atau **mengedit
`js/data.js`** langsung. Keduanya bisa dipadukan.

### Tambah, ubah, hapus

- **Tambah** — tombol `+ Tambah` di header, atau tekan `N`.
- **Ubah** — klik kartu anggota, lalu `Ubah Data` di bawah pop-up.
- **Hapus** — klik kartu anggota, lalu `Hapus Anggota`. Dialog konfirmasi
  menjelaskan dampaknya lebih dulu (berapa anak dan pasangan yang kehilangan
  relasi). Anak-anaknya tidak ikut terhapus, hanya kehilangan satu orang tua.

Relasi dijaga otomatis: pasangan selalu dua arah, dan pilihan orang tua tidak
pernah memuat diri sendiri maupun keturunannya, jadi silsilahnya tidak bisa
membentuk lingkaran.

### Kolom Domisili & Agama

Keduanya berupa **daftar pilihan yang tetap bisa diketik bebas** — klik kolomnya
untuk melihat semua pilihan, atau langsung ketik untuk menyaringnya.

- **Domisili** memuat 38 provinsi dan 514 kabupaten/kota Indonesia sesuai
  Kepmendagri No. 300.2.2-2138 Tahun 2025, tersimpan offline di `js/wilayah.js`.
  Labelnya sengaja dipendekkan (`Bandung, Jawa Barat`, bukan `Kota Bandung, …`).
  Awalan `Kab.` hanya dipakai pada 25 nama yang kalau dipolos akan bentrok
  dengan kotanya — misalnya `Kab. Bandung` versus `Bandung`.
- **Agama** berisi tujuh pilihan bawaan dari `CONFIG.RELIGIONS` di
  `js/config.js`.

Karena bukan dropdown tertutup, nilai apa pun boleh diketik — domisili luar
negeri seperti `Singapura`, atau agama di luar tujuh bawaan. **Nilai baru yang
Anda simpan otomatis ikut muncul sebagai pilihan** saat form dibuka lagi, jadi
daftarnya tumbuh sendiri mengikuti isi keluarga Anda. Nilai yang sudah dipakai
anggota lain selalu ditaruh paling atas.

### 📌 Di mana datanya tersimpan?

Perubahan disimpan di **localStorage browser** — hanya di komputer dan browser
itu. Data tidak dikirim ke mana pun, tapi juga tidak otomatis ikut ter-commit
ke repo.

> **Penting:** begitu ada perubahan tersimpan di browser, isi `js/data.js`
> tidak lagi dibaca. Mengedit `js/data.js` tidak akan terlihat sampai Anda
> memilih **Muat Ulang dari js/data.js** di menu ☰.

### Menu ☰ (Kelola Data)

| Menu | Fungsi |
|---|---|
| **Ubah Nama Keluarga** | Ganti nama keluarga, tagline, dan teks footer. |
| **Ekspor Data (JSON)** | Unduh seluruh data sebagai cadangan atau untuk dipindah ke perangkat lain. |
| **Impor Data (JSON)** | Muat file hasil ekspor. Seluruh data saat ini akan diganti. |
| **Salin untuk js/data.js** | Menyalin isi lengkap `js/data.js` ke clipboard — inilah cara membuat perubahan **permanen di repo**. |
| **Muat Ulang dari js/data.js** | Buang perubahan di browser, kembali ke isi `js/data.js`. |

### Membuat perubahan permanen di repo

1. Sunting keluarga Anda lewat halaman sampai puas.
2. Buka menu ☰ → **Salin untuk js/data.js**.
3. Tempelkan (paste) ke `js/data.js`, timpa seluruh isinya.
4. `git add js/data.js && git commit && git push`

Kalau clipboard tidak tersedia (misalnya halaman dibuka lewat `file://`),
file `data.js` otomatis diunduh sebagai gantinya — tinggal timpakan.

---

## ✏️ Mengedit `js/data.js` langsung

Kalau lebih suka mengetik data dalam jumlah banyak sekaligus, edit
**`js/data.js`**. Ingat untuk memilih **Muat Ulang dari js/data.js** di menu ☰
supaya perubahannya terbaca bila sebelumnya sudah pernah menyunting lewat
halaman.

### 1. Identitas keluarga

```js
const FAMILY_META = Object.freeze({
  familyName: "Keluarga Besar Wijaya",
  tagline: "Empat generasi, satu cerita — sejak 1938",
  footer: "Silsilah Keluarga Wijaya · dibuat dengan penuh sayang",
});
```

### 2. Anggota keluarga

Setiap anggota adalah satu objek di dalam `FAMILY_DATA`:

```js
{
  id: "g2-bambang",              // WAJIB, unik, dipakai sebagai acuan relasi
  name: "Bambang Wijaya",        // WAJIB
  gender: "M",                   // WAJIB — "M" (laki-laki) atau "F" (perempuan)

  nickname: "Om Bambang",
  photo: "assets/photos/bambang.jpg",   // kosongkan untuk pakai avatar inisial
  birthPlace: "Semarang",
  birthDate: "1965-01-22",       // format YYYY-MM-DD (boleh "1965" atau "1965-01")
  deathDate: "",                 // isi bila sudah wafat — kartu ditandai otomatis
  bloodType: "O",
  domicile: "Jakarta Selatan",   // teks bebas; di form tersedia daftar wilayah
  occupation: "Insinyur Sipil",
  education: "S1 Teknik Sipil",
  religion: "Katolik",           // teks bebas; di form tersedia daftar agama

  parents: ["g1-soekarno", "g1-sri"],   // id ayah & ibu
  spouses: ["g2-ratna"],                // cukup ditulis di satu sisi saja

  quote: "Kalau fondasinya benar, sisanya tinggal sabar.",
  hobbies: ["Bersepeda", "Fotografi"],
  favoriteFoods: ["Sate kambing", "Gudeg"],
  favoriteMusic: ["Koes Plus"],
  traits: ["Perfeksionis"],
  funFacts: ["Ikut membangun tiga jembatan di Jawa Tengah."],
}
```

Hanya `id`, `name`, dan `gender` yang wajib. Field lain yang dikosongkan otomatis
tidak ditampilkan di pop-up — jadi tidak akan ada baris kosong yang menggantung.

### 3. Empat aturan yang perlu diingat

1. **`id` harus unik.** Semua relasi mengacu ke `id`, jadi kalau diubah,
   `parents` dan `spouses` di anggota lain harus ikut diperbarui.
2. **Generasi paling atas memakai `parents: []`.** Begitu juga pasangan yang
   menikah masuk ke keluarga.
3. **Tulis anggota berdarah keluarga lebih dulu, baru pasangannya.** Urutan ini
   menentukan posisi kiri/kanan pada kartu pasangan dan titik sambung ke
   generasi di atasnya.
4. **`spouses` cukup satu arah.** Relasi kebalikannya dibuat otomatis.

### 4. Menambahkan foto

Simpan file di `assets/photos/`, lalu isi field `photo` dengan path relatifnya:

```js
photo: "assets/photos/oma-sri.jpg",
```

Foto ditampilkan dalam bingkai lingkaran, jadi **gambar persegi (1:1)** memberi
hasil terbaik — ukuran 400×400 px sudah lebih dari cukup. Kalau file tidak
ditemukan, avatar inisial otomatis dipakai sebagai pengganti, tanpa error.

---

## 🎨 Menyesuaikan tampilan

Semua warna dan bentuk didefinisikan sebagai token CSS di bagian atas
`css/style.css`:

```css
:root {
  --primary: #2E6B4F;   /* hijau utama: header, aksen, tombol */
  --accent:  #B98A2E;   /* emas: garis pernikahan, label generasi */
  --male:    #3D6EA8;   /* aksen kartu laki-laki */
  --female:  #B0567F;   /* aksen kartu perempuan */
  ...
}
```

Blok `html[data-theme="dark"]` tepat di bawahnya mengatur versi gelapnya.

Ukuran kartu dan jarak antar generasi diatur di `js/config.js`:

```js
NODE_W: 158,       // lebar kartu
NODE_H: 178,       // tinggi kartu
SPOUSE_GAP: 18,    // jarak antar pasangan
SIBLING_GAP: 34,   // jarak antar keluarga bersaudara
LEVEL_GAP: 96,     // jarak vertikal antar generasi
```

Ingin menambah kategori baru di pop-up (misalnya "Prestasi")? Tambahkan field
array di `data.js`, lalu daftarkan di `CONFIG.DETAIL_LISTS`:

```js
{ key: "achievements", title: "Prestasi", icon: "🏆", style: "chip" },
```

`style` bisa `"chip"` (label bulat) atau `"bullet"` (daftar berpoin).

---

## 📁 Struktur proyek

```
├── index.html          # Satu-satunya halaman
├── css/
│   └── style.css       # Seluruh gaya + tema terang/gelap
├── js/
│   ├── config.js       # Konstanta layout, warna avatar, label, field, agama
│   ├── wilayah.js      # Daftar provinsi & kabupaten/kota (pilihan Domisili)
│   ├── utils.js        # Format tanggal, hitung umur, avatar SVG, resize foto
│   ├── components.js   # Dialog konfirmasi, peringatan, notifikasi toast
│   ├── data.js         # ← DATA BENIH keluarga (dipakai saat pertama dibuka)
│   ├── storage.js      # Sumber data: localStorage, CRUD, ekspor/impor
│   ├── relations.js    # Indeks & lookup relasi antar anggota
│   ├── tree.js         # Tata letak pohon, gambar kartu & garis, geser/zoom
│   ├── detail.js       # Pop-up detail anggota
│   ├── editor.js       # Form tambah/ubah anggota + validasi
│   └── app.js          # Perakitan: header, ringkasan, pencarian, tema, menu
└── assets/
    └── photos/         # Simpan foto anggota keluarga di sini
```

Alur datanya: `data.js` (benih) → `storage.js` (salinan kerja di localStorage)
→ `relations.js` (indeks relasi) → `tree.js` & `detail.js` (tampilan).

---

## 📝 Catatan

Data yang ada sekarang adalah **contoh** (Keluarga Besar Wijaya, 18 anggota,
4 generasi) supaya tampilannya bisa langsung dilihat. Ganti dengan data
keluarga sungguhan sebelum dibagikan — lewat halaman, atau dengan mengedit
`js/data.js`.

Tidak ada server dan tidak ada database. Data keluarga, foto yang diunggah, dan
preferensi tema semuanya tersimpan di `localStorage` browser; tidak ada apa pun
yang dikirim ke luar.

Karena localStorage terbatas (umumnya ~5 MB), foto yang diunggah otomatis
dipotong persegi dan diperkecil ke 400 px. Untuk keluarga besar dengan banyak
foto, lebih hemat menaruh file foto di `assets/photos/` lalu mengisi kolom
**path file** di form, bukan mengunggahnya.
