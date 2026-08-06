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

  // ── Blok detail: kunci data -> judul & ikon kartu di modal ──
  DETAIL_LISTS: Object.freeze([
    Object.freeze({ key: "hobbies", title: "Hobi", icon: "🎯", style: "chip" }),
    Object.freeze({ key: "favoriteFoods", title: "Makanan Kesukaan", icon: "🍽️", style: "chip" }),
    Object.freeze({ key: "favoriteMusic", title: "Musik & Hiburan", icon: "🎵", style: "chip" }),
    Object.freeze({ key: "traits", title: "Ciri Khas", icon: "✨", style: "chip" }),
    Object.freeze({ key: "funFacts", title: "Fakta Seru", icon: "💡", style: "bullet" }),
  ]),

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

  STORAGE_THEME_KEY: "familytree.theme",
});
