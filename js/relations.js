"use strict";

/**
 * Membangun indeks anggota keluarga dan menyediakan lookup relasi
 * (orang tua, pasangan, anak, saudara) di atas FAMILY_DATA.
 */
const Relations = (() => {
  const byId = new Map();
  const childrenOfId = new Map();  // id orang tua -> array anak
  let people = [];

  function build() {
    byId.clear();
    childrenOfId.clear();

    // Salin agar bisa dinormalisasi tanpa mengubah FAMILY_DATA.
    people = FAMILY_DATA.map(p => ({
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

  /** Jumlah keturunan langsung (anak, cucu, cicit, …). */
  function descendantCount(person) {
    const seen = new Set();
    const stack = childrenOf(person);
    while (stack.length) {
      const c = stack.pop();
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      childrenOf(c).forEach(g => stack.push(g));
    }
    return seen.size;
  }

  function isDeceased(person) {
    return Boolean(person.deathDate);
  }

  return Object.freeze({
    build, all, get, has,
    parentsOf, spousesOf, childrenOf, siblingsOf,
    descendantCount, isDeceased,
  });
})();
