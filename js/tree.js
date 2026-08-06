"use strict";

/**
 * Menyusun tata letak pohon keluarga, menggambar kartu + garis relasi,
 * dan menangani interaksi kanvas (geser, zoom, sorot, fokus).
 *
 * Konsep utama: "unit" = satu orang berdarah keluarga (anchor) beserta
 * pasangannya. Anak digantung pada unit orang tuanya, bukan pada
 * individu, sehingga garis keturunan turun dari titik tengah pasangan.
 */
const TreeView = (() => {
  const { NODE_W, NODE_H, SPOUSE_GAP, SIBLING_GAP, LEVEL_GAP,
    STAGE_PADDING, GEN_LABEL_OFFSET } = CONFIG;

  let viewportEl = null;
  let stageEl = null;
  let nodesEl = null;
  let linesEl = null;

  let units = [];
  let roots = [];
  let unitOfPerson = new Map();
  let nodes = [];                  // { person, unit, x, y, el }
  let nodeById = new Map();
  let stageW = 0;
  let stageH = 0;
  let contentCenterX = 0;   // titik tengah pohon saja, tanpa kolom label generasi
  let maxDepth = 0;

  const view = { x: 0, y: 0, scale: 1 };
  let onSelect = null;

  /* ═══════════════════════════════════════════════
     1. Menyusun unit keluarga
     ═══════════════════════════════════════════════ */

  function buildUnits() {
    units = [];
    unitOfPerson = new Map();
    const assigned = new Set();

    Relations.all().forEach(person => {
      if (assigned.has(person.id)) return;

      const seen = new Set();
      const members = [];
      [person, ...Relations.spousesOf(person)].forEach(m => {
        if (assigned.has(m.id) || seen.has(m.id)) return;
        seen.add(m.id);
        members.push(m);
      });

      // Anchor = anggota yang punya orang tua di dalam pohon; dialah
      // titik sambung ke generasi di atasnya. Taruh di posisi paling kiri.
      let anchorIdx = members.findIndex(m => m.parents.length > 0);
      if (anchorIdx > 0) {
        const [anchor] = members.splice(anchorIdx, 1);
        members.unshift(anchor);
      }

      const unit = {
        id: `u${units.length}`,
        members,
        memberIds: new Set(members.map(m => m.id)),
        anchor: members[0],
        anchorIndex: 0,
        kids: [],
        parent: null,
        x: 0, y: 0, depth: 0, selfW: 0, kidsW: 0, width: 0,
      };
      members.forEach(m => { assigned.add(m.id); unitOfPerson.set(m.id, unit); });
      units.push(unit);
    });

    // Sambungkan tiap unit ke unit orang tuanya.
    units.forEach(u => {
      const parents = u.anchor.parents;
      if (parents.length === 0) return;
      const parentUnit = unitOfPerson.get(parents[0]);
      if (!parentUnit || parentUnit === u) return;
      if (!parents.every(pid => parentUnit.memberIds.has(pid))) return;
      u.parent = parentUnit;
      parentUnit.kids.push(u);
    });

    // Urutkan saudara dari yang tertua.
    units.forEach(u => {
      u.kids.forEach((k, i) => { k._order = i; });
      u.kids.sort((a, b) => {
        const ay = a.anchor.birthDate || "";
        const by = b.anchor.birthDate || "";
        if (ay && by && ay !== by) return ay < by ? -1 : 1;
        return a._order - b._order;
      });
    });

    roots = units.filter(u => !u.parent);
  }

  /* ═══════════════════════════════════════════════
     2. Tata letak
     ═══════════════════════════════════════════════ */

  function anchorCenterX(u) {
    return u.x + u.anchorIndex * (NODE_W + SPOUSE_GAP) + NODE_W / 2;
  }

  /** Titik turun garis keturunan: tengah blok pasangan. */
  function joinX(u) {
    return u.x + u.selfW / 2;
  }

  function measure(u, guard) {
    if (guard.has(u.id)) { u.width = 0; u.selfW = 0; u.kidsW = 0; return; }
    guard.add(u.id);

    u.selfW = u.members.length * NODE_W + (u.members.length - 1) * SPOUSE_GAP;
    u.kids.forEach(k => measure(k, guard));
    u.kidsW = u.kids.length
      ? u.kids.reduce((sum, k) => sum + k.width, 0) + (u.kids.length - 1) * SIBLING_GAP
      : 0;
    u.width = Math.max(u.selfW, u.kidsW);
  }

  function place(u, left, depth, guard) {
    if (guard.has(u.id)) return;
    guard.add(u.id);

    u.depth = depth;
    u.y = depth * (NODE_H + LEVEL_GAP);
    if (depth > maxDepth) maxDepth = depth;

    let cursor = left + (u.width - u.kidsW) / 2;
    u.kids.forEach(k => {
      place(k, cursor, depth + 1, guard);
      cursor += k.width + SIBLING_GAP;
    });

    if (u.kids.length) {
      // Pusatkan pasangan tepat di tengah anak pertama & terakhir.
      const first = anchorCenterX(u.kids[0]);
      const last = anchorCenterX(u.kids[u.kids.length - 1]);
      u.x = (first + last) / 2 - u.selfW / 2;
    } else {
      u.x = left + (u.width - u.selfW) / 2;
    }
  }

  function layout() {
    maxDepth = 0;
    const measureGuard = new Set();
    roots.forEach(r => measure(r, measureGuard));

    const placeGuard = new Set();
    let cursor = 0;
    roots.forEach(r => {
      place(r, cursor, 0, placeGuard);
      cursor += r.width + SIBLING_GAP * 2;
    });

    // Normalisasi ke koordinat positif + ruang untuk label generasi.
    const placed = units.filter(u => placeGuard.has(u.id));
    if (placed.length === 0) { stageW = 0; stageH = 0; return; }

    const minX = Math.min(...placed.map(u => u.x));
    const maxX = Math.max(...placed.map(u => u.x + u.selfW));
    const maxY = Math.max(...placed.map(u => u.y + NODE_H));
    const dx = STAGE_PADDING + GEN_LABEL_OFFSET - minX;
    const dy = STAGE_PADDING;
    placed.forEach(u => { u.x += dx; u.y += dy; });

    stageW = (maxX - minX) + GEN_LABEL_OFFSET + STAGE_PADDING * 2;
    stageH = maxY + STAGE_PADDING * 2;
    contentCenterX = STAGE_PADDING + GEN_LABEL_OFFSET + (maxX - minX) / 2;
  }

  /* ═══════════════════════════════════════════════
     3. Render
     ═══════════════════════════════════════════════ */

  function buildCard(person, unit, x, y) {
    const btn = Utils.el("button", "person-card");
    btn.type = "button";
    btn.dataset.id = person.id;
    btn.dataset.gender = person.gender || "";
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.width = `${NODE_W}px`;
    btn.style.height = `${NODE_H}px`;
    btn.style.setProperty("--enter-delay", `${unit.depth * 90}ms`);
    if (Relations.isDeceased(person)) btn.classList.add("is-deceased");
    if (person.parents.length === 0 && unit.depth > 0) btn.classList.add("is-inlaw");
    btn.setAttribute("aria-label", `Lihat detail ${person.name}`);

    const photoWrap = Utils.el("span", "card-photo");
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = person.photo || Utils.avatarDataUri(person.name);
    img.addEventListener("error", () => { img.src = Utils.avatarDataUri(person.name); }, { once: true });
    photoWrap.appendChild(img);

    if (Relations.isDeceased(person)) {
      photoWrap.appendChild(Utils.el("span", "card-cross", "†"));
    }

    const years = person.birthDate ? String(person.birthDate).slice(0, 4) : "—";
    const until = person.deathDate ? ` – ${String(person.deathDate).slice(0, 4)}` : "";

    btn.append(
      photoWrap,
      Utils.el("span", "card-name", person.nickname || person.name),
      Utils.el("span", "card-years", `${years}${until}`),
      Utils.el("span", "card-role", person.occupation || ""),
    );
    return btn;
  }

  function renderNodes() {
    nodesEl.textContent = "";
    nodes = [];
    nodeById = new Map();

    units.forEach(u => {
      u.members.forEach((person, i) => {
        const x = u.x + i * (NODE_W + SPOUSE_GAP);
        const y = u.y;
        const el = buildCard(person, u, x, y);
        const node = { person, unit: u, x, y, el };
        nodes.push(node);
        nodeById.set(person.id, node);
        nodesEl.appendChild(el);
      });
    });
  }

  function renderGenerationLabels() {
    for (let d = 0; d <= maxDepth; d++) {
      const y = STAGE_PADDING + d * (NODE_H + LEVEL_GAP);
      const label = Utils.el("div", "gen-label");
      label.style.left = `${STAGE_PADDING}px`;
      label.style.top = `${y}px`;
      label.style.height = `${NODE_H}px`;
      label.append(
        Utils.el("span", "gen-label-kicker", "Generasi"),
        Utils.el("span", "gen-label-num", CONFIG.GEN_ROMAN[d] || String(d + 1)),
      );
      nodesEl.appendChild(label);
    }
  }

  /** Siku dengan sudut membulat dari titik orang tua ke satu anak. */
  function elbowPath(px, py, cx, busY, childY) {
    if (Math.abs(cx - px) < 1) return `M${px},${py} L${px},${childY}`;
    const dir = cx > px ? 1 : -1;
    const r = Math.min(16, Math.abs(cx - px) / 2, (busY - py) / 2, (childY - busY) / 2);
    if (r <= 1) return `M${px},${py} L${px},${busY} L${cx},${busY} L${cx},${childY}`;
    return `M${px},${py} L${px},${busY - r} Q${px},${busY} ${px + dir * r},${busY} ` +
           `L${cx - dir * r},${busY} Q${cx},${busY} ${cx},${busY + r} L${cx},${childY}`;
  }

  function renderLines() {
    linesEl.textContent = "";
    linesEl.setAttribute("width", stageW);
    linesEl.setAttribute("height", stageH);
    linesEl.setAttribute("viewBox", `0 0 ${stageW} ${stageH}`);

    units.forEach(u => {
      // ── Garis pernikahan ──
      for (let i = 0; i < u.members.length - 1; i++) {
        const x1 = u.x + i * (NODE_W + SPOUSE_GAP) + NODE_W;
        const x2 = x1 + SPOUSE_GAP;
        const y = u.y + NODE_H * 0.42;
        const kin = `${u.members[i].id} ${u.members[i + 1].id}`;

        const line = Utils.svgEl("path", { class: "link link-spouse", d: `M${x1},${y} L${x2},${y}` });
        line.dataset.kin = kin;
        const knot = Utils.svgEl("circle", { class: "link-knot", cx: (x1 + x2) / 2, cy: y, r: 4.5 });
        knot.dataset.kin = kin;
        linesEl.append(line, knot);
      }

      // ── Garis keturunan ──
      if (u.kids.length === 0) return;
      const px = joinX(u);
      const py = u.y + NODE_H;
      const busY = py + LEVEL_GAP / 2;
      const parentKin = u.members.map(m => m.id).join(" ");

      u.kids.forEach(k => {
        const cx = anchorCenterX(k);
        const path = Utils.svgEl("path", {
          class: "link link-descent",
          d: elbowPath(px, py, cx, busY, k.y),
        });
        path.dataset.kin = `${parentKin} ${k.anchor.id}`;
        linesEl.appendChild(path);
      });
    });
  }

  /* ═══════════════════════════════════════════════
     4. Transformasi kanvas (geser & zoom)
     ═══════════════════════════════════════════════ */

  function applyTransform(animate) {
    stageEl.style.transition = animate
      ? "transform 480ms cubic-bezier(0.22, 0.61, 0.36, 1)"
      : "none";
    stageEl.style.transform =
      `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewportEl.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const next = Utils.clamp(view.scale * factor, CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM);
    const k = next / view.scale;
    view.x = px - (px - view.x) * k;
    view.y = py - (py - view.y) * k;
    view.scale = next;
    applyTransform(false);
  }

  function zoomBy(step) {
    const rect = viewportEl.getBoundingClientRect();
    zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, 1 + step);
  }

  function fit() {
    const rect = viewportEl.getBoundingClientRect();
    if (!stageW || !stageH || !rect.width) return;
    // Jangan mengecil sampai kartunya tidak terbaca — di layar sempit
    // lebih baik pohonnya dipotong lalu digeser oleh pengguna.
    const scale = Utils.clamp(
      Math.min(rect.width / stageW, rect.height / stageH, CONFIG.FIT_MAX_ZOOM),
      CONFIG.FIT_MIN_ZOOM, CONFIG.MAX_ZOOM,
    );
    view.scale = scale;
    view.x = rect.width / 2 - contentCenterX * scale;
    view.y = stageH * scale > rect.height ? 16 : (rect.height - stageH * scale) / 2;
    applyTransform(true);
  }

  function focusPerson(id, scale) {
    const node = nodeById.get(id);
    if (!node) return;
    const rect = viewportEl.getBoundingClientRect();
    view.scale = Utils.clamp(scale || view.scale, CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM);
    view.x = rect.width / 2 - (node.x + NODE_W / 2) * view.scale;
    view.y = rect.height / 2 - (node.y + NODE_H / 2) * view.scale;
    applyTransform(true);
  }

  /* ═══════════════════════════════════════════════
     5. Interaksi
     ═══════════════════════════════════════════════ */

  const pointers = new Map();
  let panStart = null;
  let pinchStart = null;
  let dragged = false;

  function pointerCenter() {
    const pts = [...pointers.values()];
    const sum = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / pts.length, y: sum.y / pts.length };
  }

  function pointerDistance() {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0 && e.pointerType === "mouse") return;
    // Jangan mulai menggeser dari tombol/overlay — pointer capture di
    // viewport bisa menelan klik tombolnya.
    if (e.target.closest(".zoom-controls, .tree-empty")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;

    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
      viewportEl.classList.add("is-panning");
      // Capture-nya sengaja belum diambil di sini: selama pointer di-capture
      // viewport, event click ikut diarahkan ke viewport, sehingga listener
      // di .tree-nodes tidak pernah kebagian dan kartu jadi tidak bisa diklik.
      // Lihat onPointerMove — capture diambil begitu geseran benar-benar mulai.
    } else if (pointers.size === 2) {
      panStart = null;
      pinchStart = { dist: pointerDistance(), scale: view.scale, center: pointerCenter() };
    }
  }

  function onPointerMove(e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2 && pinchStart) {
      const dist = pointerDistance();
      if (pinchStart.dist > 0) {
        const target = Utils.clamp(
          pinchStart.scale * (dist / pinchStart.dist),
          CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM,
        );
        zoomAt(pinchStart.center.x, pinchStart.center.y, target / view.scale);
      }
      dragged = true;
      return;
    }

    if (!panStart) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    if (!dragged && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      dragged = true;
      // Geseran sudah pasti, bukan klik — sekarang aman mengambil alih pointer
      // supaya panning tetap jalan meski kursor keluar dari viewport.
      try { viewportEl.setPointerCapture(e.pointerId); } catch (_) { /* pointer sudah lepas */ }
    }
    view.x = panStart.viewX + dx;
    view.y = panStart.viewY + dy;
    applyTransform(false);
  }

  function onPointerUp(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) {
      panStart = null;
      viewportEl.classList.remove("is-panning");
    }
  }

  function onWheel(e) {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * CONFIG.WHEEL_ZOOM_SENSITIVITY);
    zoomAt(e.clientX, e.clientY, factor);
  }

  function highlightKin(personId, on) {
    if (!personId) return;
    const person = Relations.get(personId);
    if (!person) return;
    const kin = new Set([
      ...Relations.parentsOf(person),
      ...Relations.spousesOf(person),
      ...Relations.childrenOf(person),
    ].map(p => p.id));

    kin.forEach(id => {
      const node = nodeById.get(id);
      if (node) node.el.classList.toggle("is-kin", on);
    });
    linesEl.querySelectorAll("[data-kin]").forEach(elm => {
      if (elm.dataset.kin.split(" ").includes(personId)) elm.classList.toggle("is-hi", on);
    });
  }

  function bindInteractions() {
    viewportEl.addEventListener("pointerdown", onPointerDown);
    viewportEl.addEventListener("pointermove", onPointerMove);
    viewportEl.addEventListener("pointerup", onPointerUp);
    viewportEl.addEventListener("pointercancel", onPointerUp);
    viewportEl.addEventListener("wheel", onWheel, { passive: false });

    nodesEl.addEventListener("click", e => {
      const card = e.target.closest(".person-card");
      if (!card || dragged) return;
      if (onSelect) onSelect(card.dataset.id);
    });

    nodesEl.addEventListener("pointerover", e => {
      const card = e.target.closest(".person-card");
      if (card) highlightKin(card.dataset.id, true);
    });
    nodesEl.addEventListener("pointerout", e => {
      const card = e.target.closest(".person-card");
      if (card) highlightKin(card.dataset.id, false);
    });
    nodesEl.addEventListener("focusin", e => {
      const card = e.target.closest(".person-card");
      if (card) highlightKin(card.dataset.id, true);
    });
    nodesEl.addEventListener("focusout", e => {
      const card = e.target.closest(".person-card");
      if (card) highlightKin(card.dataset.id, false);
    });
  }

  /* ═══════════════════════════════════════════════
     6. Pencarian & status kartu
     ═══════════════════════════════════════════════ */

  function searchText(person) {
    return Utils.normalize([
      person.name, person.nickname, person.domicile, person.birthPlace,
      person.occupation, (person.hobbies || []).join(" "),
      (person.favoriteFoods || []).join(" "),
    ].join(" "));
  }

  function search(query) {
    const q = Utils.normalize(query);
    const matches = [];
    nodes.forEach(n => {
      const hit = !q || searchText(n.person).includes(q);
      n.el.classList.toggle("is-dim", Boolean(q) && !hit);
      n.el.classList.toggle("is-match", Boolean(q) && hit);
      if (hit) matches.push(n.person);
    });
    return q ? matches : [];
  }

  function setActive(id) {
    nodes.forEach(n => n.el.classList.toggle("is-active", n.person.id === id));
  }

  function stats() {
    return {
      total: nodes.length,
      generations: nodes.length ? maxDepth + 1 : 0,
      living: nodes.filter(n => !Relations.isDeceased(n.person)).length,
    };
  }

  /* ═══════════════════════════════════════════════
     7. Init
     ═══════════════════════════════════════════════ */

  function render() {
    buildUnits();
    layout();
    stageEl.style.width = `${stageW}px`;
    stageEl.style.height = `${stageH}px`;
    renderLines();
    renderNodes();
    renderGenerationLabels();
    viewportEl.classList.toggle("is-empty", nodes.length === 0);
  }

  /**
   * Menggambar ulang setelah data berubah. Secara bawaan posisi & zoom
   * dipertahankan supaya pengguna tidak kehilangan konteks setelah menyunting.
   */
  function refresh(options) {
    const keepView = !(options && options.refit);
    render();
    if (keepView && nodes.length) applyTransform(false);
    else fit();
  }

  function init(options) {
    viewportEl = document.getElementById("tree-viewport");
    stageEl = document.getElementById("tree-stage");
    nodesEl = document.getElementById("tree-nodes");
    linesEl = document.getElementById("tree-lines");
    onSelect = options && options.onSelect;

    render();
    bindInteractions();
    fit();

    window.addEventListener("resize", Utils.debounce(() => fit(), 200));
  }

  return Object.freeze({
    init, render, refresh, fit, zoomBy, focusPerson, search, setActive, stats,
  });
})();
