"use strict";

const CONFIG = Object.freeze({
  // ── Layout kartu & jarak antar node (satuan px, koordinat "stage") ──
  NODE_W: 158,
  NODE_H: 178,
  SPOUSE_GAP: 18,   // jarak antar pasangan dalam satu unit keluarga
  SIBLING_GAP: 34,  // jarak antar unit keluarga bersaudara
  LEVEL_GAP: 96,    // jarak vertikal antar generasi
  STAGE_PADDING: 80,
  GEN_LABEL_OFFSET: 150, // ruang kiri untuk label "Generasi I"

  // ── Zoom & pan ──
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 2.5,
  ZOOM_STEP: 0.18,
  WHEEL_ZOOM_SENSITIVITY: 0.0016,
  FIT_MAX_ZOOM: 1,
  FIT_MIN_ZOOM: 0.5,  // di layar sempit, lebih baik kartu tetap terbaca lalu digeser
  FOCUS_ZOOM: 1.1,

  // ── Label ──
  GENDER_LABEL: Object.freeze({ M: "Laki-laki", F: "Perempuan" }),
  GEN_ROMAN: Object.freeze(["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"]),
  MONTHS: Object.freeze([
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]),
  DAYS: Object.freeze(["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]),

  // ── Blok detail: kunci data -> judul, ikon, gaya tampil, & gaya isian ──
  //    Satu-satunya sumber kebenaran: dipakai modal detail DAN form editor.
  //    input "comma" = dipisah koma pada satu baris; "lines" = satu per baris.
  DETAIL_LISTS: Object.freeze([
    Object.freeze({ key: "hobbies", title: "Hobi", icon: "🎯", style: "chip", input: "comma" }),
    Object.freeze({ key: "favoriteFoods", title: "Makanan Kesukaan", icon: "🍽️", style: "chip", input: "comma" }),
    Object.freeze({ key: "favoriteMusic", title: "Musik & Hiburan", icon: "🎵", style: "chip", input: "comma" }),
    Object.freeze({ key: "traits", title: "Ciri Khas", icon: "✨", style: "chip", input: "comma" }),
    Object.freeze({ key: "funFacts", title: "Fakta Seru", icon: "💡", style: "bullet", input: "lines" }),
  ]),

  // ── Field teks bebas pada satu anggota (di luar id/name/gender/relasi) ──
  PERSON_TEXT_FIELDS: Object.freeze([
    "nickname", "photo", "birthPlace", "birthDate", "deathDate", "bloodType",
    "domicile", "occupation", "education", "religion", "quote",
  ]),

  BLOOD_TYPES: Object.freeze(["A", "B", "AB", "O"]),

  // Pilihan awal agama. Bukan daftar tertutup — nilai lain yang diketik
  // pengguna ikut tersimpan dan otomatis muncul sebagai pilihan berikutnya.
  RELIGIONS: Object.freeze([
    "Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Konghucu",
    "Kepercayaan kepada Tuhan YME",
  ]),

  MAX_NAME_LENGTH: 100,
  MAX_PARENTS: 2,

  // Foto diperkecil sebelum disimpan agar tidak menghabiskan kuota localStorage.
  PHOTO_MAX_SIZE: 400,
  PHOTO_QUALITY: 0.82,
  TOAST_DURATION_MS: 2600,

  // Jeda sebelum js/data.js ditulis ulang, supaya beberapa perubahan
  // beruntun cukup menghasilkan satu penulisan.
  SYNC_DEBOUNCE_MS: 400,

  // ── Warna avatar cadangan (dipakai saat foto belum tersedia) ──
  AVATAR_PALETTE: Object.freeze([
    Object.freeze(["#2E6B4F", "#5FA985"]),
    Object.freeze(["#8A5A2B", "#C79A3F"]),
    Object.freeze(["#3B5C8A", "#7FA4D4"]),
    Object.freeze(["#7A3B5E", "#C4789B"]),
    Object.freeze(["#4A5A2E", "#93A85F"]),
    Object.freeze(["#8A4230", "#D08560"]),
    Object.freeze(["#3A5F63", "#79A7AC"]),
    Object.freeze(["#5B4A82", "#9B8AC4"]),
  ]),

  // ── Tampilan "Pulau Langit" ──────────────────────────────────
  //    Satu pulau = satu keluarga: pasangan + anak yang belum menikah.
  //    Anak yang sudah menikah berangkat ke pulaunya sendiri.
  ISLAND_CARD: 80,          // lebar satu kartu anggota di atas pulau
  ISLAND_PER_ROW_MAX: 4,    // anggota per baris sebelum menumpuk ke atas
  ISLAND_MIN_W: 244,
  ISLAND_MAX_W: 470,
  ISLAND_RATIO: 0.62,       // tinggi bongkahan batu = lebar × rasio
  ISLAND_LABEL_H: 52,       // ruang papan nama di bawah pulau
  ISLAND_GAP_X: 92,         // jarak antar pulau bersaudara (mode berjenjang)
  ISLAND_GAP_Y: 84,         // jarak antar generasi (mode berjenjang)
  ISLAND_RING_GAP: 470,     // jarak antar lingkar generasi (mode sebaran)
  ISLAND_ORGANIC_SQUASH: 0.7, // langit lebih lebar daripada tinggi
  ISLAND_ORGANIC_JITTER: 0.2, // goyangan posisi agar tidak terlihat melingkar sempurna
  ISLAND_PADDING: 96,
  ISLAND_MIN_ZOOM: 0.1,
  ISLAND_MAX_ZOOM: 1.9,
  ISLAND_FIT_MAX_ZOOM: 0.8,
  // Cukup kecil supaya keluarga bertiga generasi muat seluruhnya saat dibuka —
  // ikhtisar dulu, wajah dan nama menyusul begitu satu pulau dibuka.
  ISLAND_FIT_MIN_ZOOM: 0.32,
  ISLAND_FOCUS_ZOOM: 1.25,
  ISLAND_FOCUS_ROW_H: 96,   // tinggi satu baris kartu anggota saat pulau dibuka
  ISLAND_PARALLAX: Object.freeze([0.03, 0.07, 0.13]), // lapisan langit terjauh → terdekat

  STORAGE_THEME_KEY: "familytree.theme",
  STORAGE_DATA_KEY: "familytree.data.v1",
  STORAGE_SYNC_KEY: "familytree.autosync",
  STORAGE_VIEW_KEY: "familytree.view",
  STORAGE_ISLAND_LAYOUT_KEY: "familytree.islandLayout",
});
