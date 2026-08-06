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
| **Pohon otomatis** | Tata letak generasi, pasangan, dan garis keturunan dihitung sendiri dari data — tidak ada koordinat yang perlu diatur manual. |
| **Pop-up detail** | Klik kartu mana pun untuk melihat foto besar, identitas lengkap, kutipan favorit, hobi, makanan kesukaan, dan fakta seru. |
| **Lompat antar relasi** | Di dalam pop-up, orang tua/pasangan/anak/saudara bisa diklik untuk langsung berpindah, lengkap dengan tombol kembali. |
| **Geser & zoom** | Drag untuk menjelajah, scroll atau cubit (pinch) untuk zoom, plus tombol perbesar/perkecil/sesuaikan layar. |
| **Sorot keluarga** | Arahkan kursor ke satu kartu — pasangan, orang tua, dan anaknya ikut tersorot beserta garis relasinya. |
| **Pencarian** | Cari berdasarkan nama, panggilan, domisili, pekerjaan, atau hobi; hasilnya langsung disorot dan dibawa ke tengah layar. |
| **Tema terang & gelap** | Mengikuti preferensi sistem, dan bisa diganti manual (pilihan tersimpan di browser). |
| **Avatar otomatis** | Belum punya foto? Avatar inisial bergradasi dibuat otomatis dari nama. |
| **Responsif** | Di ponsel, pop-up tampil sebagai bottom sheet dan kanvas tetap bisa dicubit. |

### Pintasan papan ketik

| Tombol | Fungsi |
|---|---|
| `/` | Fokus ke kotak pencarian |
| `Esc` | Tutup pop-up, atau bersihkan pencarian |
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

## ✏️ Mengganti dengan data keluarga sendiri

Satu-satunya file yang perlu diedit adalah **`js/data.js`**.

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
  domicile: "Jakarta Selatan",
  occupation: "Insinyur Sipil",
  education: "S1 Teknik Sipil",
  religion: "Katolik",

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
│   ├── config.js       # Konstanta layout, warna avatar, label
│   ├── utils.js        # Format tanggal, hitung umur, avatar SVG
│   ├── data.js         # ← DATA KELUARGA (satu-satunya file yang perlu diedit)
│   ├── relations.js    # Indeks & lookup relasi antar anggota
│   ├── tree.js         # Tata letak pohon, gambar kartu & garis, geser/zoom
│   ├── detail.js       # Pop-up detail anggota
│   └── app.js          # Perakitan: header, ringkasan, pencarian, tema
└── assets/
    └── photos/         # Simpan foto anggota keluarga di sini
```

---

## 📝 Catatan

Data yang ada sekarang adalah **contoh** (Keluarga Besar Wijaya, 18 anggota,
4 generasi) supaya tampilannya bisa langsung dilihat. Ganti isi `js/data.js`
dengan data keluarga sungguhan sebelum dibagikan.

Semua data tersimpan di dalam file — tidak ada server, tidak ada database, dan
tidak ada apa pun yang dikirim ke luar. Preferensi tema disimpan di
`localStorage` browser.
