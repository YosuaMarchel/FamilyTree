"use strict";

/**
 * Sumber data aplikasi. `js/data.js` berperan sebagai benih (seed);
 * salinan kerjanya disimpan di localStorage supaya hasil edit bertahan
 * setelah halaman ditutup.
 *
 * Begitu ada salinan kerja, dialah yang dipakai — mengubah `js/data.js`
 * tidak lagi berpengaruh sampai pengguna memilih "Muat ulang dari data.js".
 * Semua perubahan bisa diekspor ke JSON, atau disalin kembali menjadi isi
 * `js/data.js` agar permanen di dalam repo.
 */
const DataStore = (() => {
  const LIST_KEYS = CONFIG.DETAIL_LISTS.map(spec => spec.key);

  let meta = {};
  let people = [];
  let changeListener = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  /* ═══ Normalisasi ═══════════════════════════════ */

  function cleanText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function cleanList(value) {
    if (Array.isArray(value)) return value.map(cleanText).filter(Boolean);
    return [];
  }

  /** Bentuk aman satu anggota — tahan terhadap JSON yang diedit tangan. */
  function normalizePerson(raw, fallbackIndex) {
    const person = {
      id: cleanText(raw && raw.id) || `p${fallbackIndex}`,
      name: cleanText(raw && raw.name).slice(0, CONFIG.MAX_NAME_LENGTH) || "Tanpa Nama",
      gender: raw && raw.gender === "F" ? "F" : "M",
      parents: Array.isArray(raw && raw.parents)
        ? raw.parents.map(cleanText).filter(Boolean).slice(0, CONFIG.MAX_PARENTS)
        : [],
      spouses: Array.isArray(raw && raw.spouses)
        ? raw.spouses.map(cleanText).filter(Boolean)
        : [],
    };
    CONFIG.PERSON_TEXT_FIELDS.forEach(key => { person[key] = cleanText(raw && raw[key]); });
    LIST_KEYS.forEach(key => { person[key] = cleanList(raw && raw[key]); });
    return person;
  }

  function normalizeMeta(raw) {
    return {
      familyName: cleanText(raw && raw.familyName) || "Pohon Keluarga",
      tagline: cleanText(raw && raw.tagline),
      footer: cleanText(raw && raw.footer) || "Silsilah Keluarga",
    };
  }

  /**
   * Membuang id ganda dan acuan relasi yang menunjuk ke anggota yang
   * tidak ada, lalu menjadikan pasangan dua arah.
   */
  function reconcile(list) {
    const seen = new Set();
    const result = [];
    list.forEach((raw, i) => {
      const person = normalizePerson(raw, i);
      let id = person.id;
      let n = 2;
      while (seen.has(id)) id = `${person.id}-${n++}`;
      person.id = id;
      seen.add(id);
      result.push(person);
    });

    const ids = new Set(result.map(p => p.id));
    const byId = new Map(result.map(p => [p.id, p]));

    result.forEach(p => {
      p.parents = [...new Set(p.parents.filter(id => ids.has(id) && id !== p.id))]
        .slice(0, CONFIG.MAX_PARENTS);
      p.spouses = [...new Set(p.spouses.filter(id => ids.has(id) && id !== p.id))];
    });
    result.forEach(p => {
      p.spouses.forEach(sid => {
        const spouse = byId.get(sid);
        if (spouse && !spouse.spouses.includes(p.id)) spouse.spouses.push(p.id);
      });
    });
    return result;
  }

  /* ═══ Muat & simpan ═════════════════════════════ */

  function seed() {
    return { meta: normalizeMeta(FAMILY_META), people: reconcile(clone(FAMILY_DATA)) };
  }

  function load() {
    let stored = null;
    try {
      const raw = localStorage.getItem(CONFIG.STORAGE_DATA_KEY);
      if (raw) stored = JSON.parse(raw);
    } catch { stored = null; }

    if (stored && Array.isArray(stored.people)) {
      meta = normalizeMeta(stored.meta);
      people = reconcile(stored.people);
    } else {
      const fresh = seed();
      meta = fresh.meta;
      people = fresh.people;
    }
  }

  /**
   * Dipanggil sekali setiap data selesai tersimpan. Dipakai App untuk
   * meneruskan perubahan ke `js/data.js` lewat FileSync.
   */
  function onChange(fn) {
    changeListener = typeof fn === "function" ? fn : null;
  }

  /** Melempar Error berpesan ramah bila kuota localStorage penuh. */
  function persist() {
    try {
      localStorage.setItem(CONFIG.STORAGE_DATA_KEY, JSON.stringify({ meta, people }));
    } catch (err) {
      const quotaFull = err && (err.name === "QuotaExceededError" || err.code === 22);
      throw new Error(quotaFull
        ? "Penyimpanan browser penuh. Hapus beberapa foto yang diunggah, atau ekspor data lalu muat ulang."
        : "Data gagal disimpan di browser ini. Coba ekspor data sebagai cadangan.");
    }
    // Sinkronisasi berkas tidak boleh menggagalkan penyimpanan itu sendiri.
    if (changeListener) {
      try { changeListener(); } catch { /* diabaikan */ }
    }
  }

  function resetToSeed() {
    const fresh = seed();
    meta = fresh.meta;
    people = fresh.people;
    persist();
  }

  /* ═══ Baca ══════════════════════════════════════ */

  function all() { return people; }
  function getMeta() { return meta; }
  function get(id) { return people.find(p => p.id === id) || null; }
  function count() { return people.length; }

  /* ═══ Tulis (CRUD) ══════════════════════════════ */

  /** Slug id yang mudah dibaca dan dijamin unik. */
  function makeId(name) {
    const base = String(name).toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "")  // buang tanda diakritik
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32) || "anggota";
    if (!get(base)) return base;
    let n = 2;
    while (get(`${base}-${n}`)) n += 1;
    return `${base}-${n}`;
  }

  /** Menyelaraskan daftar pasangan dua arah untuk satu anggota. */
  function syncSpouses(person, nextSpouseIds) {
    const next = new Set(nextSpouseIds.filter(id => id !== person.id && get(id)));
    const previous = new Set(person.spouses);

    previous.forEach(id => {
      if (next.has(id)) return;
      const other = get(id);
      if (other) other.spouses = other.spouses.filter(sid => sid !== person.id);
    });
    next.forEach(id => {
      const other = get(id);
      if (other && !other.spouses.includes(person.id)) other.spouses.push(person.id);
    });
    person.spouses = [...next];
  }

  function create(draft) {
    const person = normalizePerson({ ...draft, id: makeId(draft.name) }, people.length);
    const spouseIds = person.spouses;
    person.spouses = [];
    people.push(person);
    syncSpouses(person, spouseIds);
    persist();
    return person;
  }

  function update(id, draft) {
    const existing = get(id);
    if (!existing) return null;
    const next = normalizePerson({ ...draft, id }, 0);
    const spouseIds = next.spouses;

    next.spouses = existing.spouses.slice();
    Object.assign(existing, next);
    syncSpouses(existing, spouseIds);
    persist();
    return existing;
  }

  /**
   * Menghapus satu anggota sekaligus membersihkan seluruh acuan ke
   * dirinya. Anak-anaknya tetap ada, hanya kehilangan satu orang tua.
   */
  function remove(id) {
    const target = get(id);
    if (!target) return false;
    people = people.filter(p => p.id !== id);
    people.forEach(p => {
      p.parents = p.parents.filter(pid => pid !== id);
      p.spouses = p.spouses.filter(sid => sid !== id);
    });
    persist();
    return true;
  }

  /** Ringkasan dampak penghapusan, untuk ditampilkan di dialog konfirmasi. */
  function removalImpact(id) {
    const children = people.filter(p => p.parents.includes(id)).length;
    const spouses = people.filter(p => p.spouses.includes(id)).length;
    return { children, spouses };
  }

  function updateMeta(draft) {
    meta = normalizeMeta({ ...meta, ...draft });
    persist();
    return meta;
  }

  /* ═══ Ekspor & impor ════════════════════════════ */

  function toJson() {
    return JSON.stringify({ meta, people }, null, 2);
  }

  /** Menerima format {meta, people} maupun array anggota polos. */
  function fromJson(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("File itu bukan JSON yang valid.");
    }
    const list = Array.isArray(parsed) ? parsed : parsed && parsed.people;
    if (!Array.isArray(list)) {
      throw new Error('Struktur JSON tidak dikenali — harus berupa array anggota atau objek berisi "people".');
    }
    if (list.length === 0) throw new Error("File itu tidak berisi satu anggota pun.");

    meta = normalizeMeta(Array.isArray(parsed) ? meta : parsed.meta || meta);
    people = reconcile(list);
    persist();
    return people.length;
  }

  /**
   * Isi array anggota, ditulis sendiri (bukan JSON.stringify sekaligus)
   * supaya bisa disisipi penanda generasi. Tanpa penanda ini js/data.js
   * mentah sulit dibaca: 60 objek beruntun tanpa batas yang terlihat.
   *
   * Nomor generasinya diambil dari Relations.generations() — sumber yang
   * sama dengan label di layar, jadi berkasnya tidak pernah bercerita lain
   * daripada aplikasinya.
   */
  function peopleWithGenerations() {
    const gen = Relations.generations(people);
    const potongan = people.map(person => ({
      gen: gen.has(person.id) ? gen.get(person.id) : null,
      teks: JSON.stringify(person, null, 2)
        .split("\n").map(baris => `  ${baris}`).join("\n"),
    }));

    const isi = potongan.map((p, i) => {
      const awalGenerasi = i === 0 || p.gen !== potongan[i - 1].gen;
      if (p.gen === null || !awalGenerasi) return p.teks;
      const nomor = CONFIG.GEN_ROMAN[p.gen] || String(p.gen + 1);
      return `${i === 0 ? "" : "\n"}  // ═══ Generasi ${nomor} ═══\n${p.teks}`;
    }).join(",\n");

    return `[\n${isi}\n]`;
  }

  /** Isi lengkap `js/data.js` — untuk menyimpan perubahan secara permanen. */
  function toDataJs() {
    const header = `"use strict";

/**
 * ═══════════════════════════════════════════════════════════════
 *  DATA KELUARGA — dihasilkan dari editor pada ${Utils.formatTanggal(Utils.todayIso())}.
 *  Lihat README.md untuk panduan penyuntingan manual.
 * ═══════════════════════════════════════════════════════════════
 */

const FAMILY_META = Object.freeze(${JSON.stringify(meta, null, 2)});

const FAMILY_DATA = Object.freeze(`;
    return `${header}${peopleWithGenerations()});\n`;
  }

  return Object.freeze({
    load, persist, resetToSeed, onChange,
    all, getMeta, get, count,
    create, update, remove, removalImpact, updateMeta,
    toJson, fromJson, toDataJs,
  });
})();
