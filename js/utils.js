"use strict";

const Utils = (() => {
  /** "1968-04-12" -> "12 April 1968". Menerima juga "1968-04" atau "1968". */
  function formatTanggal(iso) {
    if (!iso) return "";
    const [y, m, d] = String(iso).split("-");
    if (!y) return "";
    if (!m) return y;
    const month = CONFIG.MONTHS[parseInt(m, 10) - 1] || "";
    if (!d) return `${month} ${y}`;
    return `${parseInt(d, 10)} ${month} ${y}`;
  }

  /** Gabungan tempat & tanggal lahir, mengabaikan bagian yang kosong. */
  function formatTTL(place, iso) {
    const tgl = formatTanggal(iso);
    if (place && tgl) return `${place}, ${tgl}`;
    return place || tgl || "";
  }

  function parseDate(iso) {
    if (!iso) return null;
    const [y, m, d] = String(iso).split("-").map(n => parseInt(n, 10));
    if (!y) return null;
    return new Date(y, (m || 1) - 1, d || 1);
  }

  /** Umur dalam tahun penuh. Untuk yang sudah wafat, dihitung sampai tanggal wafat. */
  function calcAge(birthIso, deathIso) {
    const birth = parseDate(birthIso);
    if (!birth) return null;
    const end = parseDate(deathIso) || new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const beforeBirthday =
      end.getMonth() < birth.getMonth() ||
      (end.getMonth() === birth.getMonth() && end.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? age : null;
  }

  /** Ulang tahun berikutnya dalam berapa hari (null bila tanggal tidak lengkap). */
  function daysToBirthday(birthIso) {
    const birth = parseDate(birthIso);
    if (!birth || String(birthIso).split("-").length < 3) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let next = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (next < today) next = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
    return Math.round((next - today) / 86400000);
  }

  /** Inisial maksimal 2 huruf dari nama lengkap. */
  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function hashCode(str) {
    let h = 0;
    for (let i = 0; i < String(str).length; i++) {
      h = (h << 5) - h + String(str).charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }

  /**
   * Avatar cadangan berupa data-URI SVG: lingkaran gradien + inisial.
   * Dipakai saat `photo` kosong atau file fotonya gagal dimuat.
   */
  function avatarDataUri(name, size = 200) {
    const pair = CONFIG.AVATAR_PALETTE[hashCode(name) % CONFIG.AVATAR_PALETTE.length];
    const text = initials(name);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">` +
      `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0%" stop-color="${pair[0]}"/><stop offset="100%" stop-color="${pair[1]}"/>` +
      `</linearGradient></defs>` +
      `<rect width="100" height="100" fill="url(#g)"/>` +
      `<text x="50" y="50" font-family="Plus Jakarta Sans, Segoe UI, sans-serif" font-size="36" ` +
      `font-weight="700" fill="#FFFFFF" fill-opacity="0.92" text-anchor="middle" ` +
      `dominant-baseline="central">${text}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function debounce(fn, delayMs) {
    let timer = null;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delayMs);
    };
  }

  /** Normalisasi untuk pencarian: huruf kecil & tanpa spasi ganda. */
  function normalize(str) {
    return String(str || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function svgEl(tag, attrs) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs || {}).forEach(([k, v]) => node.setAttribute(k, v));
    return node;
  }

  return Object.freeze({
    formatTanggal, formatTTL, parseDate, calcAge, daysToBirthday,
    initials, hashCode, avatarDataUri, clamp, debounce, normalize, el, svgEl,
  });
})();
