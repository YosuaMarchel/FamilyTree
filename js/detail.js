"use strict";

/**
 * Pop-up detail anggota keluarga: identitas, cerita, dan relasi yang
 * bisa diklik untuk melompat ke anggota lain (dengan tombol kembali).
 */
const Detail = (() => {
  const FOCUSABLE = 'button:not([hidden]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  let overlayEl, modalEl, photoEl, photoRingEl, nameEl, nicknameEl, badgesEl, bodyEl;
  let btnClose, btnBack;
  let history = [];
  let lastFocused = null;
  let onNavigate = null;
  let onEdit = null;
  let onDelete = null;

  /* ── Blok penyusun isi modal ─────────────────── */

  function infoRow(label, value) {
    if (!value) return null;
    const row = Utils.el("div", "info-row");
    row.append(Utils.el("dt", "info-label", label), Utils.el("dd", "info-value", value));
    return row;
  }

  function sectionCard(icon, title) {
    const card = Utils.el("section", "detail-card");
    const head = Utils.el("h3", "detail-card-title");
    head.append(Utils.el("span", "detail-card-icon", icon), document.createTextNode(title));
    card.appendChild(head);
    return card;
  }

  function chipList(items) {
    const wrap = Utils.el("div", "chip-list");
    items.forEach(item => wrap.appendChild(Utils.el("span", "chip", item)));
    return wrap;
  }

  function bulletList(items) {
    const ul = Utils.el("ul", "bullet-list");
    items.forEach(item => ul.appendChild(Utils.el("li", null, item)));
    return ul;
  }

  function personPill(person, relationLabel) {
    const btn = Utils.el("button", "relation-pill");
    btn.type = "button";
    btn.dataset.id = person.id;

    const img = document.createElement("img");
    img.className = "relation-photo";
    img.alt = "";
    img.src = person.photo || Utils.avatarDataUri(person.name);
    img.addEventListener("error", () => { img.src = Utils.avatarDataUri(person.name); }, { once: true });

    const texts = Utils.el("span", "relation-texts");
    texts.append(
      Utils.el("span", "relation-name", person.name),
      Utils.el("span", "relation-role", relationLabel),
    );
    btn.append(img, texts);
    return btn;
  }

  function relationGroup(title, people, labelFor) {
    if (!people.length) return null;
    const card = sectionCard("👨‍👩‍👧‍👦", title);
    const list = Utils.el("div", "relation-list");
    people.forEach(p => list.appendChild(personPill(p, labelFor(p))));
    card.appendChild(list);
    return card;
  }

  /* ── Isi modal untuk satu orang ──────────────── */

  function badge(text, variant) {
    return Utils.el("span", `modal-badge${variant ? ` badge-${variant}` : ""}`, text);
  }

  function renderBadges(person) {
    badgesEl.textContent = "";
    const deceased = Relations.isDeceased(person);
    const age = Utils.calcAge(person.birthDate, person.deathDate);

    const genIndex = generationOf(person);
    if (genIndex !== null) {
      badgesEl.appendChild(badge(`Generasi ${CONFIG.GEN_ROMAN[genIndex] || genIndex + 1}`, "gen"));
    }
    if (person.bloodType) badgesEl.appendChild(badge(`Gol. darah ${person.bloodType}`, "blood"));
    if (age !== null) {
      badgesEl.appendChild(badge(deceased ? `Wafat di usia ${age}` : `${age} tahun`, deceased ? "memorial" : "age"));
    }
    if (!deceased) {
      const days = Utils.daysToBirthday(person.birthDate);
      if (days !== null && days <= 30) {
        badgesEl.appendChild(badge(days === 0 ? "🎂 Ulang tahun hari ini!" : `🎂 ${days} hari lagi ulang tahun`, "birthday"));
      }
    }
  }

  /** Kedalaman generasi berdasarkan rantai orang tua. */
  function generationOf(person) {
    let depth = 0;
    let current = person;
    const guard = new Set();
    while (current && current.parents.length > 0 && !guard.has(current.id)) {
      guard.add(current.id);
      current = Relations.get(current.parents[0]);
      depth += 1;
    }
    // Pasangan yang menikah masuk mengikuti generasi pasangannya.
    if (depth === 0 && person.parents.length === 0) {
      const spouse = Relations.spousesOf(person)[0];
      if (spouse && spouse.parents.length > 0) {
        let d = 0;
        let cur = spouse;
        const g2 = new Set();
        while (cur && cur.parents.length > 0 && !g2.has(cur.id)) {
          g2.add(cur.id);
          cur = Relations.get(cur.parents[0]);
          d += 1;
        }
        return d;
      }
    }
    return depth;
  }

  function buildBody(person) {
    bodyEl.textContent = "";

    // ── Identitas ──
    const idCard = sectionCard("🪪", "Identitas");
    const dl = Utils.el("dl", "info-grid");
    const rows = [
      infoRow("Nama lengkap", person.name),
      infoRow("Tempat, tanggal lahir", Utils.formatTTL(person.birthPlace, person.birthDate)),
      infoRow("Jenis kelamin", CONFIG.GENDER_LABEL[person.gender] || ""),
      infoRow("Golongan darah", person.bloodType),
      infoRow("Domisili", person.domicile),
      infoRow("Pekerjaan", person.occupation),
      infoRow("Pendidikan", person.education),
      infoRow("Agama", person.religion),
      infoRow("Wafat", person.deathDate ? Utils.formatTanggal(person.deathDate) : ""),
    ].filter(Boolean);
    rows.forEach(r => dl.appendChild(r));
    idCard.appendChild(dl);
    bodyEl.appendChild(idCard);

    // ── Kutipan ──
    if (person.quote) {
      const quote = Utils.el("blockquote", "detail-quote");
      quote.append(Utils.el("span", "quote-mark", "“"), Utils.el("p", null, person.quote));
      bodyEl.appendChild(quote);
    }

    // ── Hobi, makanan, fakta seru, dst. ──
    CONFIG.DETAIL_LISTS.forEach(spec => {
      const items = (person[spec.key] || []).filter(Boolean);
      if (items.length === 0) return;
      const card = sectionCard(spec.icon, spec.title);
      card.appendChild(spec.style === "chip" ? chipList(items) : bulletList(items));
      bodyEl.appendChild(card);
    });

    // ── Relasi ──
    const parents = Relations.parentsOf(person);
    const spouses = Relations.spousesOf(person);
    const children = Relations.childrenOf(person);
    const siblings = Relations.siblingsOf(person);

    const relWrap = Utils.el("div", "relation-groups");
    const groups = [
      relationGroup("Orang Tua", parents, p => (p.gender === "F" ? "Ibu" : "Ayah")),
      relationGroup("Pasangan", spouses, p => (p.gender === "F" ? "Istri" : "Suami")),
      relationGroup("Anak", children, p => (p.gender === "F" ? "Anak perempuan" : "Anak laki-laki")),
      relationGroup("Saudara", siblings, p => (p.gender === "F" ? "Saudari" : "Saudara")),
    ].filter(Boolean);

    if (groups.length) {
      groups.forEach(g => relWrap.appendChild(g));
      bodyEl.appendChild(relWrap);
    }

    const descendants = Relations.descendantCount(person);
    if (descendants > 0) {
      bodyEl.appendChild(Utils.el("p", "detail-footnote",
        `Total keturunan langsung: ${descendants} orang.`));
    }
  }

  function paint(person) {
    photoEl.src = person.photo || Utils.avatarDataUri(person.name, 400);
    photoEl.alt = `Foto ${person.name}`;
    photoEl.onerror = () => { photoEl.onerror = null; photoEl.src = Utils.avatarDataUri(person.name, 400); };
    photoRingEl.dataset.gender = person.gender || "";
    photoRingEl.classList.toggle("is-deceased", Relations.isDeceased(person));

    nameEl.textContent = person.name;
    nicknameEl.textContent = person.nickname ? `“${person.nickname}”` : "";
    nicknameEl.hidden = !person.nickname;

    renderBadges(person);
    buildBody(person);
    modalEl.scrollTop = 0;
    btnBack.hidden = history.length <= 1;
    if (onNavigate) onNavigate(person.id);
  }

  /* ── Buka / tutup / navigasi ─────────────────── */

  function open(id) {
    const person = Relations.get(id);
    if (!person) return;
    if (!isOpen()) {
      lastFocused = document.activeElement;
      history = [];
      overlayEl.hidden = false;
      document.body.classList.add("modal-open");
      requestAnimationFrame(() => overlayEl.classList.add("is-open"));
    }
    history.push(id);
    paint(person);
    btnClose.focus();
  }

  function goTo(id) {
    const person = Relations.get(id);
    if (!person) return;
    history.push(id);
    paint(person);
  }

  function back() {
    if (history.length <= 1) return;
    history.pop();
    paint(Relations.get(history[history.length - 1]));
  }

  function isOpen() {
    return !overlayEl.hidden;
  }

  function currentId() {
    return history.length ? history[history.length - 1] : null;
  }

  /**
   * Menggambar ulang isi modal setelah data berubah. Anggota yang sudah
   * dihapus dibuang dari riwayat; kalau tidak ada lagi yang tersisa,
   * modalnya ditutup.
   */
  function refresh() {
    if (!isOpen()) return;
    history = history.filter(id => Relations.has(id));
    if (history.length === 0) { close(); return; }
    paint(Relations.get(history[history.length - 1]));
  }

  function close() {
    if (!isOpen()) return;
    overlayEl.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    setTimeout(() => { overlayEl.hidden = true; }, 220);
    history = [];
    if (onNavigate) onNavigate(null);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const items = [...modalEl.querySelectorAll(FOCUSABLE)].filter(el => !el.hidden && el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function init(options) {
    overlayEl = document.getElementById("detail-overlay");
    modalEl = document.getElementById("detail-modal");
    photoEl = document.getElementById("detail-photo");
    photoRingEl = document.getElementById("detail-photo-ring");
    nameEl = document.getElementById("detail-name");
    nicknameEl = document.getElementById("detail-nickname");
    badgesEl = document.getElementById("detail-badges");
    bodyEl = document.getElementById("detail-body");
    btnClose = document.getElementById("btn-detail-close");
    btnBack = document.getElementById("btn-detail-back");
    onNavigate = options && options.onNavigate;
    onEdit = options && options.onEdit;
    onDelete = options && options.onDelete;

    btnClose.addEventListener("click", close);
    btnBack.addEventListener("click", back);
    document.getElementById("btn-detail-edit").addEventListener("click", () => {
      if (onEdit && currentId()) onEdit(currentId());
    });
    document.getElementById("btn-detail-delete").addEventListener("click", () => {
      if (onDelete && currentId()) onDelete(currentId());
    });
    overlayEl.addEventListener("click", e => { if (e.target === overlayEl) close(); });
    modalEl.addEventListener("keydown", trapFocus);
    bodyEl.addEventListener("click", e => {
      const pill = e.target.closest(".relation-pill");
      if (pill) goTo(pill.dataset.id);
    });
  }

  return Object.freeze({ init, open, close, back, isOpen, currentId, refresh });
})();
