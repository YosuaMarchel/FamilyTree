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
| **Pulau langit** | Tampilan utama: setiap keluarga jadi satu pulau melayang yang tersambung jembatan cahaya ke pulau orang tuanya. Klik pulau untuk zoom masuk, klik anggotanya untuk detail. |
| **Dua tata letak pulau** | *Berjenjang* — ketinggian mengikuti generasi, paling mudah dibaca. *Sebaran* — kepulauan menyebar mengelilingi pulau leluhur. Bisa ditukar kapan saja, pulaunya berpindah dengan animasi. |
| **Dua mode tampilan** | Sakelar 🏝️ Pulau / 🌳 Pohon di header. Pilihannya diingat browser. |
| **CRUD lengkap** | Tambah, ubah, dan hapus anggota langsung dari halaman — tanpa menyentuh kode. Perubahan tersimpan otomatis di browser. |
| **Mode baca-saja saat di-deploy** | Kontrol penyuntingan otomatis disembunyikan di luar `localhost`, jadi situs publiknya bersih dan tidak menyesatkan pengunjung. |
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
| **Sinkron otomatis ke `js/data.js`** | Setiap penambahan, perubahan, dan penghapusan langsung ditulis ke `js/data.js` — tinggal commit, tanpa salin-tempel. |
| **Ekspor & impor** | Cadangkan seluruh data sebagai JSON, pulihkan kapan saja, atau salin kembali menjadi `js/data.js`. |
| **Responsif** | Di ponsel, pop-up tampil sebagai bottom sheet dan kanvas tetap bisa dicubit. |

### Pintasan papan ketik

| Tombol | Fungsi |
|---|---|
| `/` | Fokus ke kotak pencarian |
| `N` | Tambah anggota baru |
| `Esc` | Tutup form/pop-up/menu, atau bersihkan pencarian |
| `+` / `-` | Perbesar / perkecil |
| `0` atau `F` | Sesuaikan ke layar (di mode pulau: keluar dari pulau yang dibuka) |
| `V` | Tukar tampilan Pulau ⇄ Pohon |
| `L` | Tukar tata letak pulau Berjenjang ⇄ Sebaran |

---

## 🚀 Cara menjalankan

**Cara cepat.** Klik dua kali `index.html` — selesai. Perubahan tersimpan di
browser, tapi `js/data.js` harus disalin manual (menu ☰ → *Salin untuk
js/data.js*).

**Cara yang disarankan.** Jalankan server lokal kecil yang disertakan di repo
ini. Selama server hidup, `js/data.js` **ikut diperbarui otomatis** setiap kali
data ditambah, diubah, atau dihapus:

```bash
python serve.py
# lalu buka http://127.0.0.1:8000
```

Di Windows bisa juga klik dua kali **`jalankan.bat`**. Untuk memakai port lain:
`python serve.py 8001`.

Server hanya mendengarkan di `127.0.0.1` (tidak terlihat dari jaringan lain) dan
hanya boleh menulis ke satu berkas: `js/data.js`. Isi sebelumnya selalu disalin
dulu ke `js/data.backup.js`.

> Butuh server statis biasa (misalnya untuk mengetes di ponsel dalam jaringan
> yang sama)? `python -m http.server 8000` tetap bisa — hanya saja sinkron
> otomatis lewat server tidak aktif di sana.

---

## ☁️ Deploy ke Netlify

Situs ini statis, jadi tidak ada langkah build: hubungkan repo ke Netlify,
biarkan *build command* kosong, dan *publish directory* diisi `.` — semuanya
sudah tertulis di `netlify.toml`.

**Pembagian perannya:**

| Tempat | Peran |
|---|---|
| Lokal (`python serve.py`) | **Menyunting.** `js/data.js` diperbarui otomatis. |
| `git push` | Jembatan ke Netlify. |
| Netlify | **Menampilkan.** Build ulang otomatis, keluarga melihat versi terbaru. |

Netlify tidak menjalankan Python dan berkasnya baca-saja, jadi sinkron otomatis
tidak (dan tidak bisa) bekerja di sana. Karena itu halaman **otomatis masuk mode
baca-saja** begitu dibuka dari domain selain `localhost`/`127.0.0.1`: tombol
Tambah, Ubah, Hapus, dan seluruh menu ☰ disembunyikan. Pohon, pencarian, pop-up
detail, zoom, dan tema tetap berfungsi penuh. Deteksinya ada di
`Utils.isLocalEnvironment()` (`js/utils.js`).

### ⚠️ Situs Netlify itu publik

`netlify.toml` dan `robots.txt` memasang `noindex` supaya situs tidak muncul di
mesin pencari — tapi itu **bukan pembatas akses**. Siapa pun yang tahu
alamatnya tetap bisa membukanya dan membaca nama lengkap, tanggal lahir, agama,
domisili, pekerjaan, serta foto seluruh keluarga. Sebelum deploy, pertimbangkan:

- Aktifkan **password protection** di dashboard Netlify (perlu paket berbayar)
  bila datanya benar-benar tidak untuk umum.
- Atau kosongkan field yang paling sensitif untuk versi yang di-deploy.
- Ingat bahwa data yang pernah ter-commit tetap ada di riwayat git.

### Foto untuk versi publik

Foto yang diunggah lewat form tersimpan sebagai data-URI di dalam `js/data.js`,
sehingga berkasnya membengkak dan ikut diunduh setiap pengunjung. Untuk situs
yang di-deploy, lebih hemat menaruh berkas foto di `assets/photos/` lalu mengisi
kolom **path file** di form.

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
itu. Data tidak dikirim ke mana pun. Bila **sinkron otomatis** menyala (lihat
di bawah), salinan yang sama sekaligus ditulis ke `js/data.js` di folder ini,
jadi tinggal di-commit.

> **Penting:** begitu ada perubahan tersimpan di browser, isi `js/data.js`
> tidak lagi dibaca. Mengedit `js/data.js` tidak akan terlihat sampai Anda
> memilih **Muat Ulang dari js/data.js** di menu ☰.

### Menu ☰ (Kelola Data)

| Menu | Fungsi |
|---|---|
| **Ubah Nama Keluarga** | Ganti nama keluarga, tagline, dan teks footer. |
| **Sinkron otomatis ke js/data.js** | Nyalakan/matikan penulisan otomatis ke `js/data.js`. Kartu di atasnya menunjukkan keadaannya sekarang. |
| **Ekspor Data (JSON)** | Unduh seluruh data sebagai cadangan atau untuk dipindah ke perangkat lain. |
| **Impor Data (JSON)** | Muat file hasil ekspor. Seluruh data saat ini akan diganti. |
| **Salin untuk js/data.js** | Menyalin isi lengkap `js/data.js` ke clipboard — cadangan cara manual bila sinkron otomatis tidak tersedia. |
| **Muat Ulang dari js/data.js** | Buang perubahan di browser, kembali ke isi `js/data.js`. |

### 🔄 Sinkron otomatis ke `js/data.js`

Biasanya perubahan hanya tersimpan di browser, sehingga `js/data.js` harus
disalin manual. Dengan sinkron otomatis, berkas itu ditulis ulang sendiri setiap
kali data berubah — kira-kira setengah detik setelah menyimpan — jadi yang
tersisa hanya `git commit`.

Jalurnya dipilih otomatis sesuai cara halaman dibuka:

| Cara membuka | Jalur | Keterangan |
|---|---|---|
| `python serve.py` → `http://127.0.0.1:8000` | **Server** | Langsung menyala, tanpa dialog apa pun. Paling praktis. |
| Server statis lain di `http://…` (Chrome/Edge) | **Berkas** | Menu ☰ → *Sambungkan ke js/data.js*, tunjuk berkas `js/data.js` sekali. Browser mengingatnya; izin tulis kadang diminta lagi setelah browser ditutup. |
| Klik dua kali `index.html` (`file://`) | — | Browser melarang penulisan berkas dari `file://`. Pakai `serve.py`, atau salin manual lewat menu ☰. |

Kartu status di menu ☰ menampilkan jalur yang dipakai dan jam penulisan
terakhir. Kalau sebuah penulisan gagal, kartunya berubah merah dan muncul
notifikasi berisi sebabnya — data di browser tetap aman.

Pilihan menyala/mati diingat per browser, jadi mematikannya sekali berarti
tetap mati sampai dinyalakan lagi.

### Membuat perubahan permanen di repo

Dengan sinkron otomatis menyala, cukup:

```bash
git add js/data.js && git commit -m "Perbarui data keluarga" && git push
```

Tanpa sinkron otomatis, cara manualnya:

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
├── serve.py            # Server lokal: menyajikan situs + menulis js/data.js
├── jalankan.bat        # Pintasan Windows untuk menjalankan serve.py
├── netlify.toml        # Pengaturan deploy + header noindex
├── robots.txt          # Larangan indeks mesin pencari
├── css/
│   ├── style.css       # Gaya dasar, pohon klasik, modal + tema terang/gelap
│   └── islands.css     # Gaya tampilan pulau: langit, pulau, jembatan
├── js/
│   ├── config.js       # Konstanta layout, warna avatar, label, field, agama
│   ├── wilayah.js      # Daftar provinsi & kabupaten/kota (pilihan Domisili)
│   ├── utils.js        # Format tanggal, hitung umur, avatar SVG, resize foto
│   ├── components.js   # Dialog konfirmasi, peringatan, notifikasi toast
│   ├── data.js         # ← DATA BENIH keluarga (dipakai saat pertama dibuka)
│   ├── storage.js      # Sumber data: localStorage, CRUD, ekspor/impor
│   ├── filesync.js     # Sinkron otomatis: menulis ulang js/data.js
│   ├── relations.js    # Indeks & lookup relasi antar anggota
│   ├── tree.js         # Tata letak pohon, gambar kartu & garis, geser/zoom
│   ├── islands.js      # Tampilan pulau: bangun pulau, 2 tata letak, kamera
│   ├── detail.js       # Pop-up detail anggota
│   ├── editor.js       # Form tambah/ubah anggota + validasi
│   └── app.js          # Perakitan: header, ringkasan, pencarian, tema, menu
└── assets/
    └── photos/         # Simpan foto anggota keluarga di sini
```

Alur datanya: `data.js` (benih) → `storage.js` (salinan kerja di localStorage)
→ `relations.js` (indeks relasi) → `tree.js` / `islands.js` & `detail.js`
(tampilan). `tree.js` dan `islands.js` punya API yang sama (`refresh`, `fit`,
`zoomBy`, `focusPerson`, `search`, `setActive`), sehingga `app.js` bisa
memperlakukan keduanya sebagai "tampilan aktif" yang bisa ditukar.

### Bagaimana sebuah pulau ditentukan

Satu pulau = satu **unit keluarga**: pasangan suami-istri beserta anak-anak
yang **belum menikah**. Begitu seorang anak menikah, ia berangkat ke pulaunya
sendiri yang tetap tersambung jembatan ke pulau orang tua. Anggota generasi
teratas selalu mendapat pulau, walaupun sendirian.

---

## 📝 Catatan

Data yang ada sekarang adalah **contoh** (Keluarga Besar Wijaya, 18 anggota,
4 generasi) supaya tampilannya bisa langsung dilihat. Ganti dengan data
keluarga sungguhan sebelum dibagikan — lewat halaman, atau dengan mengedit
`js/data.js`.

Tidak ada database. Data keluarga, foto yang diunggah, dan preferensi tema
semuanya tersimpan di `localStorage` browser; tidak ada apa pun yang dikirim ke
luar. `serve.py` pun hanya berjalan di komputer Anda sendiri — ia mendengarkan
di `127.0.0.1` saja dan satu-satunya berkas yang boleh ditulisnya adalah
`js/data.js`.

Karena localStorage terbatas (umumnya ~5 MB), foto yang diunggah otomatis
dipotong persegi dan diperkecil ke 400 px. Untuk keluarga besar dengan banyak
foto, lebih hemat menaruh file foto di `assets/photos/` lalu mengisi kolom
**path file** di form, bukan mengunggahnya.
