"use strict";

/**
 * Tampilan "Pulau Langit".
 *
 * Setiap keluarga menjadi satu pulau yang melayang di langit: pasangan
 * beserta anak-anak yang belum menikah tinggal di pulau yang sama. Begitu
 * seorang anak menikah, ia berangkat ke pulaunya sendiri yang tetap
 * tersambung ke pulau orang tua lewat jembatan cahaya.
 *
 * Dua tata letak tersedia dan bisa ditukar kapan saja tanpa render ulang:
 *   • "tier"    — ketinggian mengikuti generasi, paling mudah dibaca
 *   • "organic" — kepulauan menyebar mengelilingi pulau leluhur
 *
 * API-nya sengaja dibuat kembar dengan TreeView supaya app.js bisa
 * memperlakukan keduanya sebagai "tampilan aktif" yang bisa ditukar.
 */
const IslandView = (() => {
  const {
    ISLAND_CARD, ISLAND_PER_ROW_MAX, ISLAND_MIN_W, ISLAND_MAX_W, ISLAND_RATIO,
    ISLAND_LABEL_H, ISLAND_GAP_X, ISLAND_GAP_Y, ISLAND_RING_GAP,
    ISLAND_ORGANIC_SQUASH, ISLAND_ORGANIC_JITTER, ISLAND_PADDING,
    ISLAND_MIN_ZOOM, ISLAND_MAX_ZOOM, ISLAND_FIT_MAX_ZOOM, ISLAND_FIT_MIN_ZOOM,
    ISLAND_FOCUS_ZOOM, ISLAND_FOCUS_ROW_H, ISLAND_PARALLAX,
  } = CONFIG;

  // Proporsi gambar pulau (koordinat viewBox SVG). Rumput ada di bagian
  // atas, batunya menjuntai ke bawah.
  const ART_W = 200;
  // Tinggi viewBox harus mengikuti ISLAND_RATIO. Kalau tidak, rasio elemen dan
  // rasio gambar berbeda, lalu SVG "meet" menyusutkan pulaunya dan menyisakan
  // celah kosong di kiri-kanan.
  const ART_H = Math.round(ART_W * ISLAND_RATIO);
  const GRASS_CY = 46;      // titik tengah rumput
  const GRASS_RY = 27;
  const DECK_BOTTOM = 1 - (GRASS_CY - 4) / ART_H;  // batas bawah "halaman" pulau

  let viewportEl = null;
  let stageEl = null;
  let nodesEl = null;
  let linksEl = null;
  let skyEl = null;

  let islands = [];
  let islandById = new Map();
  let islandOfPerson = new Map();
  let personEls = new Map();
  let roots = [];

  let stageW = 0;
  let stageH = 0;
  let contentCX = 0;
  let contentCY = 0;
  let maxDepth = 0;

  let layoutMode = "tier";
  let focusedId = null;
  let onSelect = null;
  let onFocusChange = null;
  let isActive = false;

  const view = { x: 0, y: 0, scale: 1 };

  /* ═══════════════════════════════════════════════
     1. Menyusun pulau dari data keluarga
     ═══════════════════════════════════════════════ */

  /**
   * Unit = satu orang berdarah keluarga (anchor) beserta pasangannya.
   * Sama persis dengan konsep unit di TreeView — pulau dibangun di atasnya.
   */
  function buildUnits() {
    const units = [];
    const unitOf = new Map();
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

      // Anchor = anggota yang punya orang tua di dalam pohon; dialah yang
      // menyambungkan pulau ini ke pulau generasi di atasnya.
      const anchorIdx = members.findIndex(m => m.parents.length > 0);
      if (anchorIdx > 0) {
        const [anchor] = members.splice(anchorIdx, 1);
        members.unshift(anchor);
      }

      const unit = {
        members,
        memberIds: new Set(members.map(m => m.id)),
        anchor: members[0],
        kids: [],
        parent: null,
      };
      members.forEach(m => { assigned.add(m.id); unitOf.set(m.id, unit); });
      units.push(unit);
    });

    units.forEach(u => {
      const parents = u.anchor.parents;
      if (parents.length === 0) return;
      const parentUnit = unitOf.get(parents[0]);
      if (!parentUnit || parentUnit === u) return;
      if (!parents.every(pid => parentUnit.memberIds.has(pid))) return;
      u.parent = parentUnit;
      parentUnit.kids.push(u);
    });

    units.forEach(u => {
      u.kids.forEach((k, i) => { k._order = i; });
      u.kids.sort((a, b) => {
        const ay = a.anchor.birthDate || "";
        const by = b.anchor.birthDate || "";
        if (ay && by && ay !== by) return ay < by ? -1 : 1;
        return a._order - b._order;
      });
    });

    return units;
  }

  /**
   * Sebuah unit berhak atas pulaunya sendiri bila sudah menikah, sudah punya
   * anak, atau merupakan leluhur paling atas. Selain itu ia hanyalah anak
   * yang masih tinggal di pulau orang tuanya.
   */
  function deservesIsland(unit) {
    return unit.members.length > 1 || unit.kids.length > 0 || !unit.parent;
  }

  function coupleTitle(members) {
    const names = members.map(m => m.nickname || String(m.name).split(/\s+/)[0]);
    if (names.length === 0) return "Keluarga";
    if (names.length === 1) return names[0];
    return names.join(" & ");
  }

  function buildIslands() {
    const units = buildUnits();
    islands = [];
    islandById = new Map();
    islandOfPerson = new Map();

    const islandOfUnit = new Map();

    units.filter(deservesIsland).forEach(unit => {
      const residents = unit.kids
        .filter(k => !deservesIsland(k))
        .flatMap(k => k.members);

      const isle = {
        id: `isle-${unit.anchor.id}`,
        unit,
        couple: unit.members,
        residents,
        people: [...unit.members, ...residents],
        title: coupleTitle(unit.members),
        kids: [],
        parent: null,
        depth: 0,
        seed: Utils.hashCode(unit.anchor.id),
        x: 0, y: 0, w: 0, h: 0,
        tier: null, organic: null,
        el: null,
      };
      islandOfUnit.set(unit, isle);
      islandById.set(isle.id, isle);
      islands.push(isle);
    });

    islands.forEach(isle => {
      isle.people.forEach(p => islandOfPerson.set(p.id, isle));

      // Unit induk yang punya anak selalu lolos deservesIsland, jadi
      // pulau induknya dijamin ada selama unitnya memang punya induk.
      const parentIsle = isle.unit.parent ? islandOfUnit.get(isle.unit.parent) : null;
      if (parentIsle && parentIsle !== isle) {
        isle.parent = parentIsle;
        parentIsle.kids.push(isle);
      }
    });

    roots = islands.filter(i => !i.parent);
    measureIslands();
    assignDepth();
  }

  function measureIslands() {
    islands.forEach(isle => {
      const n = Math.max(1, isle.people.length);
      isle.perRow = Math.min(ISLAND_PER_ROW_MAX, n);
      isle.rows = Math.ceil(n / isle.perRow);
      isle.w = Utils.clamp(
        112 + isle.perRow * ISLAND_CARD,
        ISLAND_MIN_W, ISLAND_MAX_W,
      );
      isle.h = Math.round(isle.w * ISLAND_RATIO) + (isle.rows - 1) * 30;
      isle.boxH = isle.h + ISLAND_LABEL_H;

      // Kartu anggota berdiri di garis rumput lalu menumpuk ke ATAS, sehingga
      // baris teratas bisa menjulang keluar dari kotak pulau. Tinggi tampak
      // inilah — bukan boxH — yang harus muat di layar saat pulau dibuka.
      const deck = ISLAND_LABEL_H + DECK_BOTTOM * isle.h;
      const peopleH = isle.rows * ISLAND_FOCUS_ROW_H + (isle.rows - 1) * 6;
      isle.visualH = Math.max(isle.boxH, Math.round(deck + peopleH));
    });
  }

  /**
   * Kepulauan yang tidak punya induk sendiri (mis. keluarga besan) perlu
   * diturunkan sejauh yang dibutuhkan, supaya pasangan yang menikah masuk
   * melayang di ketinggian generasi yang sama dengan saudara-saudara
   * kandungnya. Tanpa ini setiap akar selalu mendarat di Generasi I.
   */
  function clusterOffsets(rootOf, depthOf) {
    const offset = new Map(roots.map(r => [r, 0]));

    // Tiap jembatan ke pulau orang tua pasangan menjadi satu syarat jarak
    // minimum antar rumpun: pulau tujuan harus satu jenjang di bawahnya.
    const demands = [];
    islands.forEach(isle => {
      isle.couple.forEach(person => {
        if (person === isle.unit.anchor || person.parents.length === 0) return;
        const origin = islandOfPerson.get(person.parents[0]);
        if (!origin || origin === isle) return;
        const from = rootOf.get(origin);
        const to = rootOf.get(isle);
        if (!from || !to || from === to) return;
        demands.push({ from, to, gap: depthOf.get(origin) + 1 - depthOf.get(isle) });
      });
    });
    if (demands.length === 0) return offset;

    // Relaksasi berulang, dibatasi jumlah akar supaya data yang saling
    // berkait melingkar tidak membuatnya berputar tanpa henti.
    for (let pass = 0; pass < roots.length; pass++) {
      let changed = false;
      demands.forEach(d => {
        const want = offset.get(d.from) + d.gap;
        if (want > offset.get(d.to)) { offset.set(d.to, want); changed = true; }
      });
      if (!changed) break;
    }

    const min = Math.min(...offset.values());
    offset.forEach((v, r) => offset.set(r, v - min));
    return offset;
  }

  function assignDepth() {
    const rootOf = new Map();
    const depthOf = new Map();
    const guard = new Set();
    const walk = (isle, root, depth) => {
      if (guard.has(isle.id)) return;
      guard.add(isle.id);
      rootOf.set(isle, root);
      depthOf.set(isle, depth);
      isle.kids.forEach(k => walk(k, root, depth + 1));
    };
    roots.forEach(r => walk(r, r, 0));

    const offset = clusterOffsets(rootOf, depthOf);

    maxDepth = 0;
    islands.forEach(isle => {
      const depth = (depthOf.get(isle) || 0) + (offset.get(rootOf.get(isle)) || 0);
      isle.depth = depth;
      if (depth > maxDepth) maxDepth = depth;
    });
  }

  /* ═══════════════════════════════════════════════
     2. Tata letak A — berjenjang per generasi
     ═══════════════════════════════════════════════ */

  function layoutTier() {
    const measureGuard = new Set();
    const measure = isle => {
      if (measureGuard.has(isle.id)) { isle._w = 0; return; }
      measureGuard.add(isle.id);
      isle.kids.forEach(measure);
      const kidsW = isle.kids.length
        ? isle.kids.reduce((sum, k) => sum + k._w, 0) + (isle.kids.length - 1) * ISLAND_GAP_X
        : 0;
      isle._kidsW = kidsW;
      isle._w = Math.max(isle.w, kidsW);
    };
    roots.forEach(measure);

    // Tinggi tiap jenjang mengikuti pulau tertinggi di generasi itu, supaya
    // pulau besar tidak menabrak generasi di bawahnya.
    const rowH = [];
    islands.forEach(i => {
      rowH[i.depth] = Math.max(rowH[i.depth] || 0, i.boxH);
    });
    const rowY = [];
    let acc = 0;
    for (let d = 0; d <= maxDepth; d++) {
      rowY[d] = acc;
      acc += (rowH[d] || 0) + ISLAND_GAP_Y;
    }

    const placeGuard = new Set();
    const place = (isle, left) => {
      if (placeGuard.has(isle.id)) return;
      placeGuard.add(isle.id);

      let cursor = left + (isle._w - isle._kidsW) / 2;
      isle.kids.forEach(k => {
        place(k, cursor);
        cursor += k._w + ISLAND_GAP_X;
      });

      if (isle.kids.length) {
        const first = isle.kids[0].tier.x + isle.kids[0].w / 2;
        const last = isle.kids[isle.kids.length - 1];
        const lastC = last.tier.x + last.w / 2;
        isle.tier = { x: (first + lastC) / 2 - isle.w / 2, y: rowY[isle.depth] };
      } else {
        isle.tier = { x: left + (isle._w - isle.w) / 2, y: rowY[isle.depth] };
      }
    };

    let cursor = 0;
    roots.forEach(r => {
      place(r, cursor);
      cursor += r._w + ISLAND_GAP_X * 2;
    });

    islands.forEach(i => { if (!i.tier) i.tier = { x: 0, y: rowY[i.depth] || 0 }; });
  }

  /* ═══════════════════════════════════════════════
     3. Tata letak B — sebaran organik mengelilingi leluhur
     ═══════════════════════════════════════════════ */

  /** Acak yang stabil: pulau yang sama selalu mendapat pergeseran yang sama. */
  function seeded(seed, index) {
    const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function layoutOrganic() {
    // Lebar sudut tiap pulau sebanding dengan jumlah keturunannya, supaya
    // cabang yang ramai tidak berdesakan dengan cabang yang sepi.
    const leafGuard = new Set();
    const countLeaves = isle => {
      if (leafGuard.has(isle.id)) return 1;
      leafGuard.add(isle.id);
      isle._leaves = isle.kids.length
        ? isle.kids.reduce((sum, k) => sum + countLeaves(k), 0)
        : 1;
      return isle._leaves;
    };
    roots.forEach(countLeaves);

    // Jari-jari tiap lingkar harus memenuhi dua syarat sekaligus:
    //  (a) keliling lingkar cukup untuk semua pulau di generasi itu, dan
    //  (b) jaraknya ke lingkar sebelumnya lebih besar daripada setengah
    //      tinggi kedua pulau — kalau tidak, pulau induk dan anak yang
    //      kebetulan sejajar tegak lurus akan saling menimpa.
    // Langit dipipihkan secara vertikal, jadi kedua syarat dibagi faktor
    // pipih tersebut agar tetap berlaku di sisi atas dan bawah lingkar.
    const perDepth = [];
    islands.forEach(i => {
      if (!perDepth[i.depth]) perDepth[i.depth] = { n: 0, w: 0, h: 0 };
      perDepth[i.depth].n += 1;
      perDepth[i.depth].w = Math.max(perDepth[i.depth].w, i.w);
      perDepth[i.depth].h = Math.max(perDepth[i.depth].h, i.boxH);
    });

    const radius = [];
    for (let d = 0; d <= maxDepth; d++) {
      if (d === 0) { radius[0] = 0; continue; }
      const row = perDepth[d] || { n: 1, w: ISLAND_MIN_W, h: ISLAND_MIN_W };
      const prev = perDepth[d - 1] || row;

      const keliling = (row.n * (row.w + ISLAND_GAP_X)) / (2 * Math.PI * ISLAND_ORGANIC_SQUASH);
      const antarLingkar = ((row.h + prev.h) / 2 + ISLAND_GAP_Y) / ISLAND_ORGANIC_SQUASH;

      radius[d] = Math.max(
        d * ISLAND_RING_GAP,
        keliling,
        radius[d - 1] + antarLingkar,
      );
    }

    const guard = new Set();
    const spread = (isle, a0, a1) => {
      if (guard.has(isle.id)) return;
      guard.add(isle.id);

      const mid = (a0 + a1) / 2;
      const r = radius[isle.depth] || 0;
      const jitterR = ISLAND_RING_GAP * ISLAND_ORGANIC_JITTER;
      const jx = (seeded(isle.seed, 1) - 0.5) * jitterR;
      const jy = (seeded(isle.seed, 2) - 0.5) * jitterR * ISLAND_ORGANIC_SQUASH;

      const cx = Math.cos(mid) * r + jx;
      const cy = Math.sin(mid) * r * ISLAND_ORGANIC_SQUASH + jy;
      isle.organic = { x: cx - isle.w / 2, y: cy - isle.h / 2 };

      // Sisakan sedikit celah di tepi sektor agar cabang tidak menempel.
      const span = (a1 - a0) * 0.9;
      const start = a0 + ((a1 - a0) - span) / 2;
      let a = start;
      isle.kids.forEach(k => {
        const share = span * (k._leaves / Math.max(1, isle._leaves));
        spread(k, a, a + share);
        a += share;
      });
    };

    if (roots.length === 1) {
      spread(roots[0], -Math.PI / 2, Math.PI * 1.5);
    } else {
      const total = roots.reduce((s, r) => s + r._leaves, 0) || 1;
      let a = -Math.PI / 2;
      roots.forEach(r => {
        const share = (Math.PI * 2) * (r._leaves / total);
        spread(r, a, a + share);
        a += share;
      });
    }

    islands.forEach(i => { if (!i.organic) i.organic = { x: 0, y: 0 }; });
  }

  /* ═══════════════════════════════════════════════
     4. Menerapkan koordinat & ukuran panggung
     ═══════════════════════════════════════════════ */

  function applyLayout(animate) {
    if (islands.length === 0) { stageW = 0; stageH = 0; return; }

    const coords = islands.map(i => (layoutMode === "organic" ? i.organic : i.tier));

    const minX = Math.min(...coords.map((c, k) => c.x));
    const minY = Math.min(...coords.map(c => c.y));
    const maxX = Math.max(...islands.map((i, k) => coords[k].x + i.w));
    const maxY = Math.max(...islands.map((i, k) => coords[k].y + i.boxH));

    stageW = (maxX - minX) + ISLAND_PADDING * 2;
    stageH = (maxY - minY) + ISLAND_PADDING * 2;
    contentCX = ISLAND_PADDING + (maxX - minX) / 2;
    contentCY = ISLAND_PADDING + (maxY - minY) / 2;

    islands.forEach((isle, k) => {
      isle.x = coords[k].x - minX + ISLAND_PADDING;
      isle.y = coords[k].y - minY + ISLAND_PADDING;
      if (isle.el) {
        isle.el.classList.toggle("is-moving", Boolean(animate));
        isle.el.style.left = `${isle.x}px`;
        isle.el.style.top = `${isle.y}px`;
      }
    });

    stageEl.style.width = `${stageW}px`;
    stageEl.style.height = `${stageH}px`;
    renderLinks();
  }

  /* ═══════════════════════════════════════════════
     5. Render
     ═══════════════════════════════════════════════ */

  /** Bongkahan batu bergerigi. Bentuknya diacak stabil dari id pulau. */
  function rockPath(seed) {
    const top = GRASS_CY;
    const spikes = 9;
    const parts = [`M2,${top}`];
    for (let i = 1; i < spikes; i++) {
      const t = i / spikes;
      const x = 2 + t * (ART_W - 4);
      const bell = Math.sin(t * Math.PI);              // paling panjang di tengah
      const jag = i % 2 === 0 ? 0.62 : 1;              // gerigi selang-seling
      const noise = 0.78 + seeded(seed, i) * 0.42;
      const y = top + bell * (ART_H - top) * jag * noise;
      parts.push(`L${x.toFixed(1)},${Math.min(y, ART_H - 2).toFixed(1)}`);
    }
    parts.push(`L${ART_W - 2},${top} Z`);
    return parts.join(" ");
  }

  function buildRock(isle) {
    const svg = Utils.svgEl("svg", {
      class: "isle-rock",
      viewBox: `0 0 ${ART_W} ${ART_H}`,
      "aria-hidden": "true",
      focusable: "false",
    });

    // Warna gradien diambil dari kelas CSS, bukan atribut stop-color: var()
    // di dalam atribut presentasi SVG tidak didukung merata antar peramban.
    const gradId = `rock-${isle.seed}`;
    const grassId = `grass-${isle.seed}`;
    const defs = Utils.svgEl("defs", {});
    const rockGrad = Utils.svgEl("linearGradient", { id: gradId, x1: "0", y1: "0", x2: "0", y2: "1" });
    rockGrad.append(
      Utils.svgEl("stop", { class: "stop-rock-top", offset: "0%" }),
      Utils.svgEl("stop", { class: "stop-rock-bottom", offset: "100%" }),
    );
    const grassGrad = Utils.svgEl("linearGradient", { id: grassId, x1: "0", y1: "0", x2: "0.2", y2: "1" });
    grassGrad.append(
      Utils.svgEl("stop", { class: "stop-grass-top", offset: "0%" }),
      Utils.svgEl("stop", { class: "stop-grass-bottom", offset: "100%" }),
    );
    defs.append(rockGrad, grassGrad);

    const rock = Utils.svgEl("path", { class: "rock-body", d: rockPath(isle.seed), fill: `url(#${gradId})` });
    const shade = Utils.svgEl("path", {
      class: "rock-shade",
      d: rockPath(isle.seed + 7),
    });
    const grass = Utils.svgEl("ellipse", {
      class: "rock-grass",
      cx: ART_W / 2, cy: GRASS_CY, rx: ART_W / 2 - 3, ry: GRASS_RY,
      fill: `url(#${grassId})`,
    });
    const rim = Utils.svgEl("ellipse", {
      class: "rock-rim",
      cx: ART_W / 2, cy: GRASS_CY - 3, rx: ART_W / 2 - 8, ry: GRASS_RY - 7,
    });

    svg.append(defs, rock, shade, grass, rim);

    // Sedikit tetumbuhan supaya tiap pulau tidak kembar.
    const flora = Utils.svgEl("g", { class: "rock-flora" });
    const count = 2 + Math.floor(seeded(isle.seed, 20) * 2);
    for (let i = 0; i < count; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const fx = ART_W / 2 + side * (52 + seeded(isle.seed, 30 + i) * 36);
      const fy = GRASS_CY - 4 + (seeded(isle.seed, 40 + i) - 0.5) * 10;
      const scale = 0.8 + seeded(isle.seed, 50 + i) * 0.5;
      const tree = Utils.svgEl("g", { transform: `translate(${fx.toFixed(1)} ${fy.toFixed(1)}) scale(${scale.toFixed(2)})` });
      tree.append(
        Utils.svgEl("rect", { class: "flora-trunk", x: -1.6, y: -9, width: 3.2, height: 10, rx: 1.4 }),
        Utils.svgEl("circle", { class: "flora-leaf", cx: 0, cy: -14, r: 7.5 }),
        Utils.svgEl("circle", { class: "flora-leaf", cx: -5, cy: -10, r: 5.2 }),
        Utils.svgEl("circle", { class: "flora-leaf", cx: 5.2, cy: -10.5, r: 5 }),
      );
      flora.appendChild(tree);
    }
    svg.appendChild(flora);

    // Air terjun kecil dari tepi pulau untuk pulau yang punya keturunan.
    // Sengaja dijauhkan dari sumbu tengah supaya tidak terbaca sebagai
    // garis pembelah pulau.
    if (isle.kids.length) {
      const side = seeded(isle.seed, 61) > 0.5 ? 1 : -1;
      const wx = ART_W / 2 + side * (34 + seeded(isle.seed, 60) * 30);
      svg.appendChild(Utils.svgEl("path", {
        class: "rock-fall",
        d: `M${wx.toFixed(1)},${GRASS_CY + 8} q${side * -3},32 ${side * 1},58 q${side * 2},14 ${side * -2},22`,
      }));
    }

    return svg;
  }

  function buildPerson(person, role) {
    const btn = Utils.el("button", "isle-person");
    btn.type = "button";
    btn.dataset.id = person.id;
    btn.dataset.role = role;
    btn.dataset.gender = person.gender || "";
    if (Relations.isDeceased(person)) btn.classList.add("is-deceased");
    btn.setAttribute("aria-label", `Lihat detail ${person.name}`);

    const ring = Utils.el("span", "isle-person-ring");
    const img = document.createElement("img");
    img.alt = "";
    img.loading = "lazy";
    img.src = person.photo || Utils.avatarDataUri(person.name);
    img.addEventListener("error", () => { img.src = Utils.avatarDataUri(person.name); }, { once: true });
    ring.appendChild(img);
    if (Relations.isDeceased(person)) ring.appendChild(Utils.el("span", "isle-person-cross", "†"));

    const years = person.birthDate ? String(person.birthDate).slice(0, 4) : "—";
    const until = person.deathDate ? `–${String(person.deathDate).slice(0, 4)}` : "";

    btn.append(
      ring,
      Utils.el("span", "isle-person-name", person.nickname || String(person.name).split(/\s+/)[0]),
      Utils.el("span", "isle-person-years", `${years}${until}`),
    );
    return btn;
  }

  function buildIsland(isle) {
    const el = Utils.el("div", "isle");
    el.dataset.id = isle.id;
    el.style.width = `${isle.w}px`;
    el.style.height = `${isle.boxH}px`;
    el.style.setProperty("--art-h", `${isle.h}px`);
    // Jarak garis rumput dari dasar kotak pulau (papan nama ikut dihitung),
    // supaya kartu anggota benar-benar berdiri di atas rumput.
    el.style.setProperty("--deck-bottom", `${(ISLAND_LABEL_H + DECK_BOTTOM * isle.h).toFixed(1)}px`);
    el.style.setProperty("--label-h", `${ISLAND_LABEL_H}px`);
    el.style.setProperty("--float-dur", `${(7 + seeded(isle.seed, 3) * 5).toFixed(2)}s`);
    el.style.setProperty("--float-delay", `${(-seeded(isle.seed, 4) * 8).toFixed(2)}s`);
    el.style.setProperty("--enter-delay", `${isle.depth * 110}ms`);
    el.style.setProperty("--deck-w", `${isle.perRow * ISLAND_CARD}px`);

    const float = Utils.el("div", "isle-float");

    const hit = Utils.el("button", "isle-hit");
    hit.type = "button";
    hit.setAttribute("aria-label", `Buka pulau keluarga ${isle.title}, ${isle.people.length} anggota`);

    // Dua baris terpisah: pasangan berdiri di atas rumput, anak-anak
    // berbaris di belakangnya. Urutan baris tidak boleh bergantung pada
    // pembungkusan flex agar posisinya tetap sama di semua ukuran pulau.
    const deck = Utils.el("div", "isle-deck");
    const people = Utils.el("div", "isle-people");

    if (isle.residents.length) {
      const kidsRow = Utils.el("div", "isle-row isle-row-kids");
      isle.residents.forEach(p => kidsRow.appendChild(buildPerson(p, "child")));
      people.appendChild(kidsRow);
    }

    const coupleRow = Utils.el("div", "isle-row isle-row-couple");
    isle.couple.forEach(p => coupleRow.appendChild(buildPerson(p, "couple")));
    people.appendChild(coupleRow);

    deck.appendChild(people);

    const plate = Utils.el("div", "isle-plate");
    const generasi = CONFIG.GEN_ROMAN[isle.depth] || String(isle.depth + 1);
    const jumlah = isle.residents.length
      ? `${isle.couple.length} + ${isle.residents.length} anak`
      : `${isle.couple.length} anggota`;
    plate.append(
      Utils.el("span", "isle-title", isle.title),
      Utils.el("span", "isle-meta", `Generasi ${generasi} · ${jumlah}`),
    );

    float.append(hit, buildRock(isle), deck, plate);
    el.appendChild(float);
    isle.el = el;
    return el;
  }

  function renderIslands() {
    nodesEl.textContent = "";
    personEls = new Map();

    islands.forEach(isle => {
      const el = buildIsland(isle);
      nodesEl.appendChild(el);
      el.querySelectorAll(".isle-person").forEach(btn => {
        personEls.set(btn.dataset.id, btn);
      });
    });
  }

  /** Jembatan cahaya melengkung dari bawah pulau induk ke rumput pulau anak. */
  function bridgePath(a, b) {
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h * 0.58;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h * 0.2;
    const dist = Math.hypot(bx - ax, by - ay);
    const sag = Math.min(110, dist * 0.2);
    return `M${ax.toFixed(1)},${ay.toFixed(1)} Q${((ax + bx) / 2).toFixed(1)},${((ay + by) / 2 + sag).toFixed(1)} ${bx.toFixed(1)},${by.toFixed(1)}`;
  }

  /**
   * Satu pulau hanya bisa digantung pada satu pulau induk, yaitu induk
   * anchor-nya. Pasangan yang menikah masuk tetapi orang tuanya ada di
   * pulau lain karena itu diberi jembatan tersendiri — lebih tipis dan
   * tanpa cahaya — supaya dua jalur keluarga yang bertemu lewat
   * pernikahan tetap terlihat menyambung.
   */
  function renderInlawLinks() {
    islands.forEach(isle => {
      isle.couple.forEach(person => {
        if (person === isle.unit.anchor || person.parents.length === 0) return;
        const origin = islandOfPerson.get(person.parents[0]);
        if (!origin || origin === isle || origin === isle.parent) return;

        const path = Utils.svgEl("path", {
          class: "bridge bridge-inlaw",
          d: bridgePath(origin, isle),
        });
        path.dataset.kin = `${origin.id} ${isle.id}`;
        linksEl.appendChild(path);
      });
    });
  }

  function renderLinks() {
    linksEl.textContent = "";
    linksEl.setAttribute("width", stageW);
    linksEl.setAttribute("height", stageH);
    linksEl.setAttribute("viewBox", `0 0 ${stageW} ${stageH}`);

    renderInlawLinks();

    islands.forEach(isle => {
      isle.kids.forEach(kid => {
        const d = bridgePath(isle, kid);
        const glow = Utils.svgEl("path", { class: "bridge bridge-glow", d });
        const line = Utils.svgEl("path", { class: "bridge bridge-core", d });
        const kin = `${isle.id} ${kid.id}`;
        glow.dataset.kin = kin;
        line.dataset.kin = kin;
        linksEl.append(glow, line);
      });
    });
  }

  function buildSky() {
    skyEl.textContent = "";
    ISLAND_PARALLAX.forEach((depth, layerIndex) => {
      const layer = Utils.el("div", "sky-layer");
      layer.dataset.depth = String(depth);
      const count = 4 + layerIndex * 2;
      for (let i = 0; i < count; i++) {
        const cloud = Utils.el("div", "sky-cloud");
        const seed = layerIndex * 100 + i;
        cloud.style.left = `${(seeded(seed, 1) * 118 - 9).toFixed(1)}%`;
        cloud.style.top = `${(seeded(seed, 2) * 92).toFixed(1)}%`;
        cloud.style.setProperty("--cloud-scale", (0.34 + seeded(seed, 3) * (0.36 + layerIndex * 0.3)).toFixed(2));
        cloud.style.setProperty("--cloud-dur", `${(48 + seeded(seed, 4) * 70).toFixed(1)}s`);
        cloud.style.setProperty("--cloud-delay", `${(-seeded(seed, 5) * 90).toFixed(1)}s`);
        layer.appendChild(cloud);
      }
      skyEl.appendChild(layer);
    });

    const stars = Utils.el("div", "sky-stars");
    for (let i = 0; i < 90; i++) {
      const star = Utils.el("span", "sky-star");
      star.style.left = `${(seeded(i, 7) * 100).toFixed(2)}%`;
      star.style.top = `${(seeded(i, 8) * 100).toFixed(2)}%`;
      star.style.setProperty("--star-size", `${(1 + seeded(i, 9) * 1.8).toFixed(2)}px`);
      star.style.setProperty("--star-dur", `${(2.4 + seeded(i, 10) * 4).toFixed(2)}s`);
      star.style.setProperty("--star-delay", `${(-seeded(i, 11) * 6).toFixed(2)}s`);
      stars.appendChild(star);
    }
    skyEl.appendChild(stars);
  }

  /* ═══════════════════════════════════════════════
     6. Kamera: geser, zoom, fokus
     ═══════════════════════════════════════════════ */

  function applyTransform(animate) {
    stageEl.style.transition = animate
      ? "transform 760ms cubic-bezier(0.22, 0.68, 0.24, 1)"
      : "none";
    stageEl.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;

    // Langit ikut bergeser pelan mengikuti kamera — kesan kedalaman.
    skyEl.querySelectorAll(".sky-layer").forEach(layer => {
      const depth = parseFloat(layer.dataset.depth) || 0;
      layer.style.transition = animate ? "transform 760ms cubic-bezier(0.22, 0.68, 0.24, 1)" : "none";
      layer.style.transform = `translate3d(${(view.x * depth).toFixed(1)}px, ${(view.y * depth).toFixed(1)}px, 0)`;
    });
  }

  function zoomAt(clientX, clientY, factor) {
    const rect = viewportEl.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const next = Utils.clamp(view.scale * factor, ISLAND_MIN_ZOOM, ISLAND_MAX_ZOOM);
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

  function centerOn(cx, cy, scale, animate) {
    const rect = viewportEl.getBoundingClientRect();
    view.scale = Utils.clamp(scale, ISLAND_MIN_ZOOM, ISLAND_MAX_ZOOM);
    view.x = rect.width / 2 - cx * view.scale;
    view.y = rect.height / 2 - cy * view.scale;
    applyTransform(animate !== false);
  }

  function fit(animate) {
    const rect = viewportEl.getBoundingClientRect();
    if (!stageW || !stageH || !rect.width) return;

    const scale = Utils.clamp(
      Math.min(rect.width / stageW, rect.height / stageH, ISLAND_FIT_MAX_ZOOM),
      ISLAND_FIT_MIN_ZOOM, ISLAND_MAX_ZOOM,
    );
    view.scale = scale;
    view.x = rect.width / 2 - contentCX * scale;
    // Bila langitnya lebih tinggi daripada layar, mulai dari generasi
    // teratas — pulau leluhur adalah titik baca yang paling wajar.
    view.y = stageH * scale > rect.height
      ? -(ISLAND_PADDING * 0.5) * scale
      : rect.height / 2 - contentCY * scale;
    applyTransform(animate !== false);
  }

  /* ═══════════════════════════════════════════════
     7. Zoom ke satu pulau
     ═══════════════════════════════════════════════ */

  function focusIsland(id, animate) {
    const isle = islandById.get(id);
    if (!isle) return;

    focusedId = id;
    viewportEl.classList.add("has-focus");
    islands.forEach(i => {
      i.el.classList.toggle("is-focused", i === isle);
      i.el.classList.toggle("is-related", i !== isle && (i === isle.parent || i.parent === isle));
    });
    linksEl.querySelectorAll("[data-kin]").forEach(elm => {
      elm.classList.toggle("is-hi", elm.dataset.kin.split(" ").includes(id));
    });

    // Titik tengah diukur dari dasar pulau ke atas sepanjang tinggi tampak,
    // supaya baris anak paling atas ikut masuk layar.
    centerOn(
      isle.x + isle.w / 2,
      isle.y + isle.boxH - isle.visualH / 2,
      focusScale(isle),
      animate !== false,
    );
    if (onFocusChange) onFocusChange(isle);
  }

  /**
   * Zoom saat pulau dibuka. Pulau dengan banyak anak jauh lebih tinggi
   * daripada pulau berisi dua orang, jadi skalanya dihitung agar seluruh
   * pulau — termasuk papan namanya — muat di layar, bukan dipatok tetap.
   */
  function focusScale(isle) {
    const rect = viewportEl.getBoundingClientRect();
    if (!rect.height) return ISLAND_FOCUS_ZOOM;
    return Utils.clamp(
      Math.min(
        (rect.height * 0.88) / isle.visualH,
        (rect.width * 0.72) / isle.w,
        ISLAND_FOCUS_ZOOM,
      ),
      ISLAND_FIT_MIN_ZOOM, ISLAND_MAX_ZOOM,
    );
  }

  function clearFocus(refit) {
    if (!focusedId) return;
    focusedId = null;
    viewportEl.classList.remove("has-focus");
    islands.forEach(i => i.el.classList.remove("is-focused", "is-related"));
    linksEl.querySelectorAll("[data-kin]").forEach(elm => elm.classList.remove("is-hi"));
    if (refit !== false) fit(true);
    if (onFocusChange) onFocusChange(null);
  }

  function focusPerson(id, scale) {
    const isle = islandOfPerson.get(id);
    if (!isle) return;
    focusIsland(isle.id, true);
  }

  /* ═══════════════════════════════════════════════
     8. Interaksi
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
    if (e.target.closest(".zoom-controls, .layout-switch, .isle-back")) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    dragged = false;

    if (pointers.size === 1) {
      panStart = { x: e.clientX, y: e.clientY, viewX: view.x, viewY: view.y };
      viewportEl.classList.add("is-panning");
      // Pointer sengaja belum di-capture: selama di-capture, event click
      // dialihkan ke viewport sehingga pulau tidak bisa diklik. Capture
      // baru diambil di onPointerMove begitu geseran benar-benar terjadi.
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
          ISLAND_MIN_ZOOM, ISLAND_MAX_ZOOM,
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

  function bindInteractions() {
    viewportEl.addEventListener("pointerdown", onPointerDown);
    viewportEl.addEventListener("pointermove", onPointerMove);
    viewportEl.addEventListener("pointerup", onPointerUp);
    viewportEl.addEventListener("pointercancel", onPointerUp);
    viewportEl.addEventListener("wheel", onWheel, { passive: false });

    nodesEl.addEventListener("click", e => {
      if (dragged) return;

      const person = e.target.closest(".isle-person");
      if (person) {
        const isle = islandOfPerson.get(person.dataset.id);
        // Klik pertama membuka pulaunya, klik berikutnya membuka detail —
        // supaya anggota di pulau yang masih jauh tidak salah tekan.
        if (isle && focusedId !== isle.id) { focusIsland(isle.id, true); return; }
        if (onSelect) onSelect(person.dataset.id);
        return;
      }

      const isleEl = e.target.closest(".isle");
      if (!isleEl) return;
      if (focusedId === isleEl.dataset.id) return;
      focusIsland(isleEl.dataset.id, true);
    });

    // Klik di langit kosong menutup pulau yang sedang dibuka.
    viewportEl.addEventListener("click", e => {
      if (dragged || !focusedId) return;
      if (e.target.closest(".isle, .zoom-controls, .layout-switch")) return;
      clearFocus(true);
    });
  }

  /* ═══════════════════════════════════════════════
     9. Pencarian, status, ringkasan
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
    const hitIslands = new Set();

    islands.forEach(isle => {
      isle.people.forEach(p => {
        const hit = !q || searchText(p).includes(q);
        const el = personEls.get(p.id);
        if (el) {
          el.classList.toggle("is-dim", Boolean(q) && !hit);
          el.classList.toggle("is-match", Boolean(q) && hit);
        }
        if (hit) { matches.push(p); if (q) hitIslands.add(isle.id); }
      });
    });

    islands.forEach(isle => {
      isle.el.classList.toggle("is-dim", Boolean(q) && !hitIslands.has(isle.id));
      isle.el.classList.toggle("is-match", Boolean(q) && hitIslands.has(isle.id));
    });

    return q ? matches : [];
  }

  function setActive(id) {
    personEls.forEach((el, pid) => el.classList.toggle("is-active", pid === id));
  }

  function stats() {
    return {
      islands: islands.length,
      generations: islands.length ? maxDepth + 1 : 0,
    };
  }

  /* ═══════════════════════════════════════════════
     10. Siklus hidup
     ═══════════════════════════════════════════════ */

  function computeLayouts() {
    layoutTier();
    layoutOrganic();
  }

  function render() {
    buildIslands();
    computeLayouts();
    renderIslands();
    applyLayout(false);
    viewportEl.classList.toggle("is-empty", islands.length === 0);
  }

  function setLayout(mode, animate) {
    const next = mode === "organic" ? "organic" : "tier";
    if (next === layoutMode) return layoutMode;
    layoutMode = next;
    viewportEl.dataset.layout = layoutMode;
    applyLayout(animate !== false);

    if (focusedId && islandById.has(focusedId)) {
      const isle = islandById.get(focusedId);
      centerOn(isle.x + isle.w / 2, isle.y + isle.boxH / 2, view.scale, true);
    } else {
      fit(true);
    }
    try { localStorage.setItem(CONFIG.STORAGE_ISLAND_LAYOUT_KEY, layoutMode); } catch { /* diabaikan */ }
    return layoutMode;
  }

  function getLayout() { return layoutMode; }
  function focusedIsland() { return focusedId ? islandById.get(focusedId) : null; }

  /** Digambar ulang setelah data berubah; fokus dipertahankan bila masih ada. */
  function refresh(options) {
    const keepFocus = focusedId;
    const keepView = !(options && options.refit);
    const saved = { ...view };

    render();

    if (keepFocus && islandById.has(keepFocus)) {
      focusIsland(keepFocus, false);
    } else if (keepView && islands.length) {
      Object.assign(view, saved);
      focusedId = null;
      viewportEl.classList.remove("has-focus");
      applyTransform(false);
    } else {
      focusedId = null;
      viewportEl.classList.remove("has-focus");
      fit(false);
    }
  }

  /** Dipanggil saat tampilan pulau ditampilkan (ukuran viewport baru valid di sini). */
  function activate() {
    isActive = true;
    requestAnimationFrame(() => {
      if (focusedId && islandById.has(focusedId)) {
        const isle = islandById.get(focusedId);
        centerOn(isle.x + isle.w / 2, isle.y + isle.boxH / 2, focusScale(isle), false);
      } else {
        fit(false);
      }
    });
  }

  function deactivate() { isActive = false; }

  function init(options) {
    viewportEl = document.getElementById("island-viewport");
    stageEl = document.getElementById("island-stage");
    nodesEl = document.getElementById("island-nodes");
    linksEl = document.getElementById("island-links");
    skyEl = document.getElementById("island-sky");
    onSelect = options && options.onSelect;
    onFocusChange = options && options.onFocusChange;

    try {
      const saved = localStorage.getItem(CONFIG.STORAGE_ISLAND_LAYOUT_KEY);
      if (saved === "organic" || saved === "tier") layoutMode = saved;
    } catch { /* localStorage tidak tersedia */ }
    viewportEl.dataset.layout = layoutMode;

    buildSky();
    render();
    bindInteractions();

    window.addEventListener("resize", Utils.debounce(() => {
      if (isActive && !focusedId) fit(true);
    }, 220));
  }

  return Object.freeze({
    init, render, refresh, fit, zoomBy, focusPerson, search, setActive, stats,
    setLayout, getLayout, focusIsland, clearFocus, focusedIsland, activate, deactivate,
  });
})();
