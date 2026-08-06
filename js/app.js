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
    document.getElementById("family-name").textContent = FAMILY_META.familyName;
    document.getElementById("family-tagline").textContent = FAMILY_META.tagline;
    document.getElementById("footer-text").textContent = FAMILY_META.footer;
    document.title = `${FAMILY_META.familyName} — Silsilah Interaktif`;
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

  function onKeyDown(e) {
    if (e.key === "Escape") {
      if (Detail.isOpen()) { Detail.close(); return; }
      if (searchInput.value) clearSearch();
      return;
    }
    if (Detail.isOpen()) return;

    const typing = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if ((e.key === "+" || e.key === "=") && !typing) TreeView.zoomBy(CONFIG.ZOOM_STEP);
    if (e.key === "-" && !typing) TreeView.zoomBy(-CONFIG.ZOOM_STEP);
    if ((e.key === "0" || e.key.toLowerCase() === "f") && !typing) TreeView.fit();
  }

  /* ── Init ────────────────────────────────────── */

  function init() {
    applyTheme(currentTheme());
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
    });

    renderStats();

    searchInput.addEventListener("input", Utils.debounce(runSearch, 220));
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") runSearch(); });
    searchClear.addEventListener("click", () => { clearSearch(); searchInput.focus(); });

    document.getElementById("btn-theme").addEventListener("click", toggleTheme);
    document.getElementById("btn-zoom-in").addEventListener("click", () => TreeView.zoomBy(CONFIG.ZOOM_STEP));
    document.getElementById("btn-zoom-out").addEventListener("click", () => TreeView.zoomBy(-CONFIG.ZOOM_STEP));
    document.getElementById("btn-zoom-fit").addEventListener("click", () => TreeView.fit());

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
