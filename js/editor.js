"use strict";

/**
 * Form tambah/ubah anggota keluarga, termasuk pemilihan relasi,
 * unggah foto, dan validasi sebelum disimpan ke DataStore.
 */
const Editor = (() => {
  let overlayEl, modalEl, formEl, titleEl, errorEl;
  let photoPreviewEl, photoFileEl, spouseChipsEl, spouseSelectEl;
  let listFieldEls = new Map();   // key -> textarea/input

  let editingId = null;           // null = mode tambah
  let photoValue = "";            // data-URI hasil unggah, atau path manual
  let spouseIds = [];
  let lastFocused = null;
  let onSaved = null;

  /* ═══════════════════════════════════════════════
     Pengisian pilihan
     ═══════════════════════════════════════════════ */

  function fillSelect(select, people, placeholder, selectedId) {
    select.textContent = "";
    const blank = Utils.el("option", null, placeholder);
    blank.value = "";
    select.appendChild(blank);

    people.forEach(p => {
      const opt = Utils.el("option", null, optionLabel(p));
      opt.value = p.id;
      select.appendChild(opt);
    });
    select.value = selectedId && people.some(p => p.id === selectedId) ? selectedId : "";
  }

  function optionLabel(person) {
    const year = person.birthDate ? ` (${String(person.birthDate).slice(0, 4)})` : "";
    return `${person.name}${year}`;
  }

  function byName(a, b) {
    return a.name.localeCompare(b.name, "id");
  }

  /**
   * Kandidat orang tua: semua orang kecuali diri sendiri dan seluruh
   * keturunannya — mencegah lingkaran "jadi kakek dari kakeknya sendiri".
   */
  function parentCandidates() {
    if (!editingId) return DataStore.all().slice().sort(byName);
    const self = Relations.get(editingId);
    const blocked = self ? Relations.descendantIds(self) : new Set();
    return DataStore.all()
      .filter(p => p.id !== editingId && !blocked.has(p.id))
      .sort(byName);
  }

  function spouseCandidates() {
    return DataStore.all()
      .filter(p => p.id !== editingId && !spouseIds.includes(p.id))
      .sort(byName);
  }

  function refreshSpouseUi() {
    spouseChipsEl.textContent = "";
    if (spouseIds.length === 0) {
      spouseChipsEl.appendChild(Utils.el("span", "field-hint", "Belum ada pasangan."));
    }
    spouseIds.forEach(id => {
      const person = DataStore.get(id);
      if (!person) return;
      const chip = Utils.el("span", "spouse-chip");
      chip.appendChild(Utils.el("span", null, person.name));

      const remove = Utils.el("button", "spouse-chip-remove", "×");
      remove.type = "button";
      remove.setAttribute("aria-label", `Hapus pasangan ${person.name}`);
      remove.addEventListener("click", () => {
        spouseIds = spouseIds.filter(sid => sid !== id);
        refreshSpouseUi();
      });

      chip.appendChild(remove);
      spouseChipsEl.appendChild(chip);
    });

    fillSelect(spouseSelectEl, spouseCandidates(), "— pilih untuk ditambahkan —", "");
  }

  function setPhoto(value) {
    photoValue = value || "";
    document.getElementById("f-photo").value = photoValue.startsWith("data:") ? "" : photoValue;
    const name = document.getElementById("f-name").value.trim() || "?";
    photoPreviewEl.src = photoValue || Utils.avatarDataUri(name, 200);
  }

  /* ═══════════════════════════════════════════════
     Baca & tulis form
     ═══════════════════════════════════════════════ */

  function fieldValue(key) {
    return document.getElementById(`f-${key}`).value.trim();
  }

  function readForm() {
    const draft = {
      name: document.getElementById("f-name").value.trim(),
      gender: formEl.querySelector('input[name="f-gender"]:checked').value,
      parents: [
        document.getElementById("f-parent1").value,
        document.getElementById("f-parent2").value,
      ].filter(Boolean),
      spouses: spouseIds.slice(),
      photo: photoValue,
    };
    CONFIG.PERSON_TEXT_FIELDS.forEach(key => {
      if (key !== "photo") draft[key] = fieldValue(key);
    });
    CONFIG.DETAIL_LISTS.forEach(spec => {
      const raw = listFieldEls.get(spec.key).value;
      const parts = spec.input === "lines" ? raw.split("\n") : raw.split(",");
      draft[spec.key] = parts.map(s => s.trim()).filter(Boolean);
    });
    return draft;
  }

  function writeForm(person) {
    document.getElementById("f-name").value = person ? person.name : "";
    const gender = person ? person.gender : "M";
    formEl.querySelector(`input[name="f-gender"][value="${gender}"]`).checked = true;

    CONFIG.PERSON_TEXT_FIELDS.forEach(key => {
      if (key === "photo") return;
      document.getElementById(`f-${key}`).value = person ? person[key] || "" : "";
    });
    CONFIG.DETAIL_LISTS.forEach(spec => {
      const items = person ? person[spec.key] || [] : [];
      listFieldEls.get(spec.key).value = items.join(spec.input === "lines" ? "\n" : ", ");
    });

    const candidates = parentCandidates();
    const parents = person ? person.parents : [];
    fillSelect(document.getElementById("f-parent1"), candidates, "— tidak ada —", parents[0]);
    fillSelect(document.getElementById("f-parent2"), candidates, "— tidak ada —", parents[1]);

    spouseIds = person ? person.spouses.slice() : [];
    refreshSpouseUi();
    setPhoto(person ? person.photo : "");
  }

  /* ═══════════════════════════════════════════════
     Validasi
     ═══════════════════════════════════════════════ */

  function validate(draft) {
    if (!draft.name) return "Nama lengkap wajib diisi.";
    if (!Utils.isValidPartialDate(draft.birthDate)) {
      return "Tanggal lahir tidak valid. Gunakan format YYYY, YYYY-MM, atau YYYY-MM-DD.";
    }
    if (!Utils.isValidPartialDate(draft.deathDate)) {
      return "Tanggal wafat tidak valid. Gunakan format YYYY, YYYY-MM, atau YYYY-MM-DD.";
    }
    if (draft.birthDate && draft.deathDate && draft.deathDate < draft.birthDate) {
      return "Tanggal wafat tidak boleh lebih awal daripada tanggal lahir.";
    }
    if (draft.parents.length === 2 && draft.parents[0] === draft.parents[1]) {
      return "Kedua orang tua tidak boleh orang yang sama.";
    }
    if (draft.parents.some(id => draft.spouses.includes(id))) {
      return "Seseorang tidak bisa menjadi orang tua sekaligus pasangan.";
    }
    if (draft.bloodType && !CONFIG.BLOOD_TYPES.includes(draft.bloodType)) {
      return "Golongan darah tidak dikenali.";
    }
    return null;
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = !message;
    if (message) modalEl.scrollTop = modalEl.scrollHeight;
  }

  /* ═══════════════════════════════════════════════
     Buka / tutup / simpan
     ═══════════════════════════════════════════════ */

  function isOpen() { return !overlayEl.hidden; }

  function open(id) {
    editingId = id || null;
    const person = editingId ? DataStore.get(editingId) : null;
    if (editingId && !person) return;

    titleEl.textContent = person ? `Ubah Data — ${person.name}` : "Tambah Anggota";
    showError("");
    writeForm(person);

    lastFocused = document.activeElement;
    overlayEl.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => overlayEl.classList.add("is-open"));
    modalEl.scrollTop = 0;
    document.getElementById("f-name").focus();
  }

  function close() {
    if (!isOpen()) return;
    overlayEl.classList.remove("is-open");
    setTimeout(() => { overlayEl.hidden = true; }, 220);
    if (!Detail.isOpen()) document.body.classList.remove("modal-open");
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function save(e) {
    e.preventDefault();
    const draft = readForm();
    const problem = validate(draft);
    if (problem) { showError(problem); return; }

    try {
      const saved = editingId ? DataStore.update(editingId, draft) : DataStore.create(draft);
      close();
      Components.showToast(editingId ? "Perubahan tersimpan." : `${saved.name} ditambahkan.`);
      if (onSaved) onSaved(saved.id);
    } catch (err) {
      showError(err.message);
    }
  }

  /* ═══════════════════════════════════════════════
     Foto
     ═══════════════════════════════════════════════ */

  async function handlePhotoFile(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showError("File yang dipilih bukan gambar.");
      return;
    }
    try {
      setPhoto(await Utils.shrinkImage(file));
      showError("");
    } catch (err) {
      showError(err.message);
    }
  }

  /* ═══════════════════════════════════════════════
     Init
     ═══════════════════════════════════════════════ */

  function buildListFields() {
    const container = document.getElementById("f-list-fields");
    container.textContent = "";
    listFieldEls = new Map();

    CONFIG.DETAIL_LISTS.forEach(spec => {
      const isLines = spec.input === "lines";
      const label = Utils.el("label", `field${isLines ? " field-wide" : ""}`);
      label.appendChild(Utils.el("span", "field-label", `${spec.icon} ${spec.title}`));

      const input = isLines ? document.createElement("textarea") : document.createElement("input");
      input.id = `f-${spec.key}`;
      if (isLines) input.rows = 3;
      else input.type = "text";
      label.appendChild(input);

      label.appendChild(Utils.el("span", "field-hint",
        isLines ? "Satu per baris" : "Pisahkan dengan koma"));

      container.appendChild(label);
      listFieldEls.set(spec.key, input);
    });
  }

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    const items = [...modalEl.querySelectorAll(
      'button:not([hidden]), input:not([type="hidden"]), select, textarea, [href]',
    )].filter(el => !el.disabled && el.offsetParent !== null);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function init(options) {
    overlayEl = document.getElementById("editor-overlay");
    modalEl = document.getElementById("editor-modal");
    formEl = document.getElementById("editor-form");
    titleEl = document.getElementById("editor-title");
    errorEl = document.getElementById("editor-error");
    photoPreviewEl = document.getElementById("f-photo-preview");
    photoFileEl = document.getElementById("f-photo-file");
    spouseChipsEl = document.getElementById("f-spouse-chips");
    spouseSelectEl = document.getElementById("f-spouse-select");
    onSaved = options && options.onSaved;

    // Pilihan golongan darah
    const blood = document.getElementById("f-bloodType");
    const none = Utils.el("option", null, "— tidak diisi —");
    none.value = "";
    blood.appendChild(none);
    CONFIG.BLOOD_TYPES.forEach(type => {
      const opt = Utils.el("option", null, type);
      opt.value = type;
      blood.appendChild(opt);
    });

    buildListFields();

    formEl.addEventListener("submit", save);
    document.getElementById("btn-editor-cancel").addEventListener("click", close);
    document.getElementById("btn-editor-close").addEventListener("click", close);
    overlayEl.addEventListener("click", e => { if (e.target === overlayEl) close(); });
    modalEl.addEventListener("keydown", trapFocus);

    document.getElementById("btn-add-spouse").addEventListener("click", () => {
      const id = spouseSelectEl.value;
      if (!id || spouseIds.includes(id)) return;
      spouseIds.push(id);
      refreshSpouseUi();
    });

    document.getElementById("btn-photo-pick").addEventListener("click", () => photoFileEl.click());
    document.getElementById("btn-photo-clear").addEventListener("click", () => setPhoto(""));
    photoFileEl.addEventListener("change", () => {
      handlePhotoFile(photoFileEl.files[0]);
      photoFileEl.value = "";   // agar file yang sama bisa dipilih lagi
    });
    document.getElementById("f-photo").addEventListener("input", e => {
      photoValue = e.target.value.trim();
      photoPreviewEl.src = photoValue
        || Utils.avatarDataUri(document.getElementById("f-name").value.trim() || "?", 200);
    });
    photoPreviewEl.addEventListener("error", () => {
      photoPreviewEl.src = Utils.avatarDataUri(document.getElementById("f-name").value.trim() || "?", 200);
    });

    // Avatar cadangan ikut berubah saat nama diketik.
    document.getElementById("f-name").addEventListener("input", () => {
      if (!photoValue) setPhoto("");
    });
  }

  return Object.freeze({ init, open, close, isOpen });
})();
