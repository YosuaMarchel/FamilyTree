"use strict";

/**
 * Membangun indeks anggota keluarga dan menyediakan lookup relasi
 * (orang tua, pasangan, anak, saudara) di atas isi DataStore.
 *
 * Panggil build() ulang setiap kali data berubah.
 */
const Relations = (() => {
  const byId = new Map();
  const childrenOfId = new Map();  // id orang tua -> array anak
  let people = [];

  function build() {
    byId.clear();
    childrenOfId.clear();

    // Salin agar bisa dinormalisasi tanpa mengubah isi DataStore.
    people = DataStore.all().map(p => ({
      ...p,
      parents: Array.isArray(p.parents) ? p.parents.slice() : [],
      spouses: Array.isArray(p.spouses) ? p.spouses.slice() : [],
    }));
    people.forEach(p => byId.set(p.id, p));

    // Buang referensi yang tidak dikenal, lalu jadikan pasangan dua arah.
    people.forEach(p => {
      p.parents = p.parents.filter(id => byId.has(id) && id !== p.id);
      p.spouses = p.spouses.filter(id => byId.has(id) && id !== p.id);
    });
    people.forEach(p => {
      p.spouses.forEach(sid => {
        const s = byId.get(sid);
        if (!s.spouses.includes(p.id)) s.spouses.push(p.id);
      });
    });

    people.forEach(p => {
      p.parents.forEach(pid => {
        if (!childrenOfId.has(pid)) childrenOfId.set(pid, []);
        childrenOfId.get(pid).push(p);
      });
    });
  }

  function all() { return people; }
  function get(id) { return byId.get(id) || null; }
  function has(id) { return byId.has(id); }

  function parentsOf(person) {
    return person.parents.map(id => byId.get(id)).filter(Boolean);
  }

  function spousesOf(person) {
    return person.spouses.map(id => byId.get(id)).filter(Boolean);
  }

  function childrenOf(person) {
    return (childrenOfId.get(person.id) || []).slice();
  }

  /** Saudara kandung/tiri: berbagi minimal satu orang tua. */
  function siblingsOf(person) {
    if (person.parents.length === 0) return [];
    const seen = new Set([person.id]);
    const out = [];
    person.parents.forEach(pid => {
      (childrenOfId.get(pid) || []).forEach(c => {
        if (!seen.has(c.id)) { seen.add(c.id); out.push(c); }
      });
    });
    return out;
  }

  /** Semua keturunan (anak, cucu, cicit, …) sebagai himpunan id. */
  function descendantIds(person) {
    const seen = new Set();
    const stack = childrenOf(person);
    while (stack.length) {
      const c = stack.pop();
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      childrenOf(c).forEach(g => stack.push(g));
    }
    return seen;
  }

  function descendantCount(person) {
    return descendantIds(person).size;
  }

  function isDeceased(person) {
    return Boolean(person.deathDate);
  }

  /**
   * Nomor baris generasi tiap anggota, memakai aturan yang sama seperti
   * kedua tampilan:
   *
   *   • Pasangan berdiri di baris yang sama — yang menentukan adalah
   *     anggota yang punya orang tua di dalam pohon ("anchor").
   *   • Rumpun yang tidak punya leluhur sendiri (mis. keluarga besan)
   *     diturunkan sejauh yang dibutuhkan, supaya orang yang menikah masuk
   *     sebaris dengan saudara-saudara kandungnya. Tanpa ini setiap akar
   *     selalu mendarat di Generasi I.
   *
   * Sengaja dibuat sebagai fungsi murni atas daftar yang diberikan — bukan
   * atas indeks internal — supaya aman dipanggil kapan saja, termasuk saat
   * DataStore menulis ulang js/data.js sebelum build() sempat berjalan.
   *
   * Hasil: Map(id anggota -> nomor baris, mulai dari 0).
   */
  function generations(list) {
    const salinan = (list || []).map(p => ({
      id: p.id,
      parents: Array.isArray(p.parents) ? p.parents.slice() : [],
      spouses: Array.isArray(p.spouses) ? p.spouses.slice() : [],
    }));
    const indeks = new Map(salinan.map(p => [p.id, p]));
    salinan.forEach(p => {
      p.parents = p.parents.filter(id => indeks.has(id) && id !== p.id);
      p.spouses = p.spouses.filter(id => indeks.has(id) && id !== p.id);
    });
    salinan.forEach(p => p.spouses.forEach(sid => {
      const s = indeks.get(sid);
      if (s && !s.spouses.includes(p.id)) s.spouses.push(p.id);
    }));

    // ── Unit: satu orang berdarah keluarga beserta pasangannya ──
    const units = [];
    const unitOf = new Map();
    const sudah = new Set();
    salinan.forEach(person => {
      if (sudah.has(person.id)) return;
      const anggota = [person];
      person.spouses.forEach(sid => {
        const s = indeks.get(sid);
        if (s && !sudah.has(s.id) && !anggota.includes(s)) anggota.push(s);
      });
      const idx = anggota.findIndex(m => m.parents.length > 0);
      if (idx > 0) anggota.unshift(anggota.splice(idx, 1)[0]);

      const unit = {
        id: `u${units.length}`,
        anggota,
        ids: new Set(anggota.map(m => m.id)),
        anchor: anggota[0],
        kids: [],
        parent: null,
      };
      anggota.forEach(m => { sudah.add(m.id); unitOf.set(m.id, unit); });
      units.push(unit);
    });

    units.forEach(u => {
      const ortu = u.anchor.parents;
      if (ortu.length === 0) return;
      const induk = unitOf.get(ortu[0]);
      if (!induk || induk === u) return;
      if (!ortu.every(pid => induk.ids.has(pid))) return;
      u.parent = induk;
      induk.kids.push(u);
    });

    // ── Kedalaman lokal di dalam rumpunnya masing-masing ──
    const akar = units.filter(u => !u.parent);
    const dalam = new Map();
    const rumpun = new Map();
    const jejak = new Set();
    const telusuri = (u, root, d) => {
      if (jejak.has(u.id)) return;
      jejak.add(u.id);
      rumpun.set(u, root);
      dalam.set(u, d);
      u.kids.forEach(k => telusuri(k, root, d + 1));
    };
    akar.forEach(r => telusuri(r, r, 0));

    // ── Pergeseran antar rumpun karena pernikahan ──
    const syarat = [];
    units.forEach(u => u.anggota.forEach(m => {
      if (m === u.anchor || m.parents.length === 0) return;
      const asal = unitOf.get(m.parents[0]);
      if (!asal || asal === u) return;
      const dari = rumpun.get(asal);
      const ke = rumpun.get(u);
      if (!dari || !ke || dari === ke) return;
      syarat.push({ dari, ke, beda: dalam.get(asal) + 1 - dalam.get(u) });
    }));

    const geser = new Map(akar.map(r => [r, 0]));
    if (syarat.length) {
      // Relaksasi berulang, dibatasi jumlah akar supaya data yang saling
      // berkait melingkar tidak membuatnya berputar tanpa henti.
      for (let putaran = 0; putaran < akar.length; putaran++) {
        let berubah = false;
        syarat.forEach(s => {
          const mau = geser.get(s.dari) + s.beda;
          if (mau > geser.get(s.ke)) { geser.set(s.ke, mau); berubah = true; }
        });
        if (!berubah) break;
      }
      const min = Math.min(...geser.values());
      geser.forEach((v, r) => geser.set(r, v - min));
    }

    const hasil = new Map();
    units.forEach(u => {
      const d = (dalam.get(u) || 0) + (geser.get(rumpun.get(u)) || 0);
      u.anggota.forEach(m => hasil.set(m.id, d));
    });
    return hasil;
  }

  return Object.freeze({
    build, all, get, has,
    parentsOf, spousesOf, childrenOf, siblingsOf,
    descendantIds, descendantCount, isDeceased, generations,
  });
})();
