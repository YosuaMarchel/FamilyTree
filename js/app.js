"use strict";

const App = (() => {
  let searchInput = null;
  let searchClear = null;
  let searchEmpty = null;

  /* ── Tema terang / gelap ─────────────────────── */

  function currentTheme() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch { /* localStorage tidak tersedia */ }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const btn = document.getElementById("btn-theme");
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("aria-label", theme === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap");
  }

  function toggleTheme() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(CONFIG.STORAGE_THEME_KEY, next); } catch { /* diabaikan */ }
  }

  /* ── Header & ringkasan ──────────────────────── */

  function renderHeader() {
    const meta = DataStore.getMeta();
    document.getElementById("family-name").textContent = meta.familyName;
    document.getElementById("family-tagline").textContent = meta.tagline;
    document.getElementById("footer-text").textContent = meta.footer;
    document.title = `${meta.familyName} — Silsilah Interaktif`;
  }

  function renderStats() {
    const strip = document.getElementById("stats-strip");
    const s = TreeView.stats();
    const oldest = Relations.all()
      .filter(p => p.birthDate)
      .sort((a, b) => (a.birthDate < b.birthDate ? -1 : 1))[0];

    const items = [
      { value: s.total, label: "Anggota" },
      { value: s.generations, label: "Generasi" },
      { value: s.living, label: "Masih bersama kita" },
      { value: oldest ? String(oldest.birthDate).slice(0, 4) : "—", label: "Sejak tahun" },
    ];

    strip.textContent = "";
    items.forEach(it => {
      const card = Utils.el("div", "stat");
      card.append(
        Utils.el("span", "stat-value", String(it.value)),
        Utils.el("span", "stat-label", it.label),
      );
      strip.appendChild(card);
    });
  }

  /**
   * Titik tunggal setelah data berubah: bangun ulang relasi, gambar ulang
   * pohon, segarkan ringkasan, modal detail, dan sorotan pencarian.
   */
  function applyDataChange(focusId, refit) {
    Relations.build();
    TreeView.refresh({ refit });
    renderHeader();
    renderStats();
    Detail.refresh();
    if (searchInput.value.trim()) TreeView.search(searchInput.value);
    TreeView.setActive(Detail.isOpen() ? Detail.currentId() : null);
    if (focusId && Relations.has(focusId)) TreeView.focusPerson(focusId);
  }

  /* ── CRUD ────────────────────────────────────── */

  function deleteMember(id) {
    const person = Relations.get(id);
    if (!person) return;

    const impact = DataStore.removalImpact(id);
    const consequences = [];
    if (impact.children) consequences.push(`${impact.children} anak akan kehilangan satu orang tua`);
    if (impact.spouses) consequences.push(`${impact.spouses} pasangan akan kehilangan relasinya`);
    const extra = consequences.length ? `\n\n${consequences.join(", dan ")}.` : "";

    Components.showConfirm(
      "Hapus Anggota",
      `${person.name} akan dihapus dari data.${extra}\n\nTindakan ini tidak bisa dibatalkan. Lanjutkan?`,
      () => {
        try {
          DataStore.remove(id);
          applyDataChange(null, false);
          Components.showToast(`${person.name} dihapus.`);
        } catch (err) {
          Components.showAlert("Gagal Menghapus", err.message);
        }
      },
      { danger: true, confirmText: "Hapus" },
    );
  }

  /* ── Menu data ───────────────────────────────── */

  function toggleMenu(force) {
    const menu = document.getElementById("slide-menu");
    const overlay = document.getElementById("slide-menu-overlay");
    const btn = document.getElementById("btn-menu-toggle");
    const open = force !== undefined ? force : !menu.classList.contains("open");

    menu.classList.toggle("open", open);
    overlay.classList.toggle("open", open);
    menu.setAttribute("aria-hidden", String(!open));
    btn.setAttribute("aria-expanded", String(open));
    if (open) document.getElementById("btn-menu-close").focus();
  }

  function exportJson() {
    toggleMenu(false);
    Utils.downloadFile(
      `silsilah-keluarga-${Utils.todayIso()}.json`,
      DataStore.toJson(),
      "application/json;charset=utf-8",
    );
    Components.showToast("Data diekspor sebagai JSON.");
  }

  function importJson(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => Components.showAlert("Gagal Membaca", "File itu tidak bisa dibaca.");
    reader.onload = () => {
      Components.showConfirm(
        "Impor Data",
        `Seluruh data saat ini (${DataStore.count()} anggota) akan diganti dengan isi file "${file.name}".\n\nLanjutkan?`,
        () => {
          try {
            const total = DataStore.fromJson(reader.result);
            applyDataChange(null, true);
            Components.showToast(`${total} anggota berhasil diimpor.`);
          } catch (err) {
            Components.showAlert("Impor Gagal", err.message);
          }
        },
        { danger: true, confirmText: "Ganti Data" },
      );
    };
    reader.readAsText(file);
  }

  async function copyDataJs() {
    toggleMenu(false);
    const content = DataStore.toDataJs();
    try {
      await navigator.clipboard.writeText(content);
      Components.showAlert(
        "Tersalin",
        "Isi lengkap js/data.js sudah disalin ke clipboard. Tempelkan (paste) ke file js/data.js di repo, lalu commit agar perubahannya permanen.",
      );
    } catch {
      // Clipboard butuh konteks aman (https/localhost) — jatuhkan ke unduhan.
      Utils.downloadFile("data.js", content, "text/javascript;charset=utf-8");
      Components.showAlert(
        "Diunduh",
        "Clipboard tidak tersedia di sini, jadi data.js diunduh sebagai file. Timpa js/data.js di repo dengan file itu, lalu commit.",
      );
    }
  }

  function resetData() {
    toggleMenu(false);
    Components.showConfirm(
      "Muat Ulang dari js/data.js",
      "Semua perubahan yang tersimpan di browser ini akan dibuang dan diganti dengan isi js/data.js.\n\nEkspor dulu bila perlu menyimpannya. Lanjutkan?",
      () => {
        try {
          DataStore.resetToSeed();
          applyDataChange(null, true);
          Components.showToast("Data dimuat ulang dari js/data.js.");
        } catch (err) {
          Components.showAlert("Gagal", err.message);
        }
      },
      { danger: true, confirmText: "Muat Ulang" },
    );
  }

  /* ── Pengaturan keluarga ─────────────────────── */

  function openMetaForm() {
    toggleMenu(false);
    const meta = DataStore.getMeta();
    document.getElementById("m-familyName").value = meta.familyName;
    document.getElementById("m-tagline").value = meta.tagline;
    document.getElementById("m-footer").value = meta.footer;
    document.getElementById("meta-error").hidden = true;

    const overlay = document.getElementById("meta-overlay");
    overlay.hidden = false;
    document.body.classList.add("modal-open");
    requestAnimationFrame(() => overlay.classList.add("is-open"));
    document.getElementById("m-familyName").focus();
  }

  function closeMetaForm() {
    const overlay = document.getElementById("meta-overlay");
    if (overlay.hidden) return;
    overlay.classList.remove("is-open");
    setTimeout(() => { overlay.hidden = true; }, 220);
    if (!Detail.isOpen() && !Editor.isOpen()) document.body.classList.remove("modal-open");
  }

  function saveMetaForm(e) {
    e.preventDefault();
    const error = document.getElementById("meta-error");
    const familyName = document.getElementById("m-familyName").value.trim();
    if (!familyName) {
      error.textContent = "Nama keluarga wajib diisi.";
      error.hidden = false;
      return;
    }
    try {
      DataStore.updateMeta({
        familyName,
        tagline: document.getElementById("m-tagline").value.trim(),
        footer: document.getElementById("m-footer").value.trim(),
      });
      closeMetaForm();
      renderHeader();
      Components.showToast("Nama keluarga diperbarui.");
    } catch (err) {
      error.textContent = err.message;
      error.hidden = false;
    }
  }

  /* ── Pencarian ───────────────────────────────── */

  function runSearch() {
    const q = searchInput.value;
    const matches = TreeView.search(q);
    searchClear.hidden = q.length === 0;
    searchEmpty.hidden = !(q.trim().length > 0 && matches.length === 0);
    if (q.trim().length > 0 && matches.length > 0) {
      TreeView.focusPerson(matches[0].id, Math.max(0.8, CONFIG.FOCUS_ZOOM));
    }
  }

  function clearSearch() {
    searchInput.value = "";
    TreeView.search("");
    searchClear.hidden = true;
    searchEmpty.hidden = true;
    TreeView.fit();
  }

  /* ── Pintasan papan ketik ────────────────────── */

  function anyModalOpen() {
    return Editor.isOpen() || Detail.isOpen() || !document.getElementById("meta-overlay").hidden;
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      if (Editor.isOpen()) { Editor.close(); return; }
      if (!document.getElementById("meta-overlay").hidden) { closeMetaForm(); return; }
      if (Detail.isOpen()) { Detail.close(); return; }
      if (document.getElementById("slide-menu").classList.contains("open")) { toggleMenu(false); return; }
      if (searchInput.value) clearSearch();
      return;
    }
    if (anyModalOpen()) return;

    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
    if (typing) return;

    if (e.key === "/") {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if (e.key === "+" || e.key === "=") TreeView.zoomBy(CONFIG.ZOOM_STEP);
    if (e.key === "-") TreeView.zoomBy(-CONFIG.ZOOM_STEP);
    if (e.key === "0" || e.key.toLowerCase() === "f") TreeView.fit();
    if (e.key.toLowerCase() === "n") { e.preventDefault(); Editor.open(null); }
  }

  /* ── Init ────────────────────────────────────── */

  function init() {
    applyTheme(currentTheme());
    DataStore.load();
    Relations.build();
    renderHeader();

    searchInput = document.getElementById("search-input");
    searchClear = document.getElementById("btn-search-clear");
    searchEmpty = document.getElementById("search-empty");

    TreeView.init({ onSelect: id => Detail.open(id) });

    // Kartu di belakang modal ikut berpindah, jadi saat modal ditutup
    // pengguna langsung melihat orang yang barusan dibuka.
    Detail.init({
      onNavigate: id => {
        TreeView.setActive(id);
        if (id) TreeView.focusPerson(id);
      },
      onEdit: id => Editor.open(id),
      onDelete: deleteMember,
    });

    Editor.init({ onSaved: id => applyDataChange(id, false) });

    renderStats();

    searchInput.addEventListener("input", Utils.debounce(runSearch, 220));
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
    searchClear.addEventListener("click", () => { clearSearch(); searchInput.focus(); });

    document.getElementById("btn-theme").addEventListener("click", toggleTheme);
    document.getElementById("btn-zoom-in").addEventListener("click", () => TreeView.zoomBy(CONFIG.ZOOM_STEP));
    document.getElementById("btn-zoom-out").addEventListener("click", () => TreeView.zoomBy(-CONFIG.ZOOM_STEP));
    document.getElementById("btn-zoom-fit").addEventListener("click", () => TreeView.fit());

    // ── CRUD & menu data ──
    document.getElementById("btn-add-member").addEventListener("click", () => Editor.open(null));
    document.getElementById("btn-add-first").addEventListener("click", () => Editor.open(null));
    document.getElementById("btn-menu-toggle").addEventListener("click", () => toggleMenu());
    document.getElementById("btn-menu-close").addEventListener("click", () => toggleMenu(false));
    document.getElementById("slide-menu-overlay").addEventListener("click", () => toggleMenu(false));
    document.getElementById("btn-edit-meta").addEventListener("click", openMetaForm);
    document.getElementById("btn-export-json").addEventListener("click", exportJson);
    document.getElementById("btn-copy-datajs").addEventListener("click", copyDataJs);
    document.getElementById("btn-reset-data").addEventListener("click", resetData);

    const importInput = document.getElementById("import-file-input");
    document.getElementById("btn-import-json").addEventListener("click", () => {
      toggleMenu(false);
      importInput.click();
    });
    importInput.addEventListener("change", () => {
      importJson(importInput.files[0]);
      importInput.value = "";
    });

    document.getElementById("meta-form").addEventListener("submit", saveMetaForm);
    document.getElementById("btn-meta-cancel").addEventListener("click", closeMetaForm);
    document.getElementById("btn-meta-close").addEventListener("click", closeMetaForm);
    document.getElementById("meta-overlay").addEventListener("click", e => {
      if (e.target.id === "meta-overlay") closeMetaForm();
    });

    document.addEventListener("keydown", onKeyDown);

    // Sembunyikan petunjuk kanvas setelah interaksi pertama.
    const hint = document.getElementById("canvas-hint");
    const hideHint = () => hint.classList.add("is-hidden");
    document.getElementById("tree-viewport").addEventListener("pointerdown", hideHint, { once: true });
    setTimeout(hideHint, 8000);
  }

  document.addEventListener("DOMContentLoaded", init);

  return Object.freeze({ init });
})();
