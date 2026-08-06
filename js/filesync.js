"use strict";

/**
 * Menjaga `js/data.js` tetap sinkron dengan data yang tersimpan di browser:
 * setiap kali data ditambah, diubah, atau dihapus, berkasnya ikut ditulis
 * ulang — tanpa salin-tempel manual.
 *
 * Ada dua jalur, dipilih otomatis sesuai cara halaman dibuka:
 *
 *   "server" — halaman disajikan oleh `serve.py`. Perubahan dikirim lewat
 *              POST dan langsung ditulis. Tanpa dialog, tanpa izin.
 *   "file"   — File System Access API (Chrome/Edge lewat http://). Pengguna
 *              menunjuk `js/data.js` sekali, penunjuknya diingat di IndexedDB.
 *
 * Kalau keduanya tidak tersedia (misalnya halaman dibuka lewat `file://`),
 * fitur ini mati dengan tenang dan alur "Salin untuk js/data.js" tetap ada.
 */
const FileSync = (() => {
  const API_STATUS = "__api/status";
  const API_WRITE = "__api/data.js";
  const DB_NAME = "familytree-sync";
  const DB_STORE = "handles";
  const HANDLE_KEY = "dataJs";

  let mode = "none";        // "none" | "server" | "file"
  let enabled = false;
  let handle = null;        // FileSystemFileHandle, hanya pada mode "file"
  let getContent = () => "";
  let onStatus = () => {};

  let lastWritten = null;   // isi terakhir yang sukses ditulis (hindari tulis ulang sia-sia)
  let lastWriteAt = null;
  let lastError = "";
  let notice = "";          // keterangan yang bukan kegagalan
  let timer = null;
  let busy = false;
  let queued = false;
  let everWrote = false;

  /* ═══ Penyimpanan penunjuk berkas (IndexedDB) ════ */

  function openDb() {
    return new Promise((resolve, reject) => {
      let req;
      try {
        req = indexedDB.open(DB_NAME, 1);
      } catch (err) {
        reject(err);
        return;
      }
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(DB_STORE)) req.result.createObjectStore(DB_STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbRun(mode_, fn) {
    return openDb().then(db => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, mode_);
      const req = fn(tx.objectStore(DB_STORE));
      tx.oncomplete = () => { db.close(); resolve(req ? req.result : undefined); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    }));
  }

  /** IndexedDB tidak selalu ada (mode privat, `file://`) — kegagalannya diabaikan. */
  async function rememberHandle(value) {
    try {
      if (value) await idbRun("readwrite", store => store.put(value, HANDLE_KEY));
      else await idbRun("readwrite", store => store.delete(HANDLE_KEY));
    } catch { /* tidak apa-apa: penunjuk cukup bertahan selama sesi ini */ }
  }

  async function recallHandle() {
    try {
      const value = await idbRun("readonly", store => store.get(HANDLE_KEY));
      return value || null;
    } catch {
      return null;
    }
  }

  /* ═══ Preferensi ════════════════════════════════ */

  function readPreference() {
    try {
      return localStorage.getItem(CONFIG.STORAGE_SYNC_KEY);
    } catch {
      return null;
    }
  }

  function writePreference(value) {
    try { localStorage.setItem(CONFIG.STORAGE_SYNC_KEY, value); } catch { /* diabaikan */ }
  }

  /* ═══ Deteksi jalur ═════════════════════════════ */

  function isWebOrigin() {
    return /^https?:$/.test(location.protocol);
  }

  /**
   * `file://` sengaja dianggap tidak didukung: di sana asal-usul halaman
   * dianggap buram, sehingga pemilih berkas maupun IndexedDB ditolak browser.
   */
  function supportsFilePicker() {
    return isWebOrigin() && typeof window.showSaveFilePicker === "function";
  }

  async function detectServer() {
    if (!isWebOrigin()) return false;
    try {
      const res = await fetch(API_STATUS, { cache: "no-store" });
      if (!res.ok) return false;
      const info = await res.json();
      return Boolean(info && info.familyTreeServer);
    } catch {
      return false;
    }
  }

  async function permissionState() {
    if (!handle || typeof handle.queryPermission !== "function") return "granted";
    try {
      return await handle.queryPermission({ mode: "readwrite" });
    } catch {
      return "prompt";
    }
  }

  /* ═══ Status ════════════════════════════════════ */

  function status() {
    return {
      mode,
      enabled,
      supported: mode !== "none",
      connected: mode === "server" || Boolean(handle),
      fileName: handle ? handle.name : "",
      lastWriteAt,
      lastError,
      notice,
    };
  }

  function emit(event) {
    try { onStatus(status(), event || null); } catch { /* jangan sampai UI menjatuhkan sinkronisasi */ }
  }

  /** Penjelasan kenapa fitur ini tidak tersedia, untuk ditampilkan apa adanya. */
  function unavailableReason() {
    if (isWebOrigin()) {
      return "Browser ini tidak mendukung penulisan berkas langsung. Jalankan halaman lewat "
        + "serve.py (python serve.py) agar server yang menulis js/data.js, atau pakai Chrome/Edge.";
    }
    return "Halaman ini dibuka langsung dari berkas (file://), dan browser melarang penulisan "
      + "berkas dari sana. Jalankan \"python serve.py\" di folder ini lalu buka "
      + "http://127.0.0.1:8000 — setelah itu js/data.js diperbarui otomatis.";
  }

  /* ═══ Menulis ═══════════════════════════════════ */

  async function writeViaServer(content) {
    let res;
    try {
      res = await fetch(API_WRITE, {
        method: "POST",
        headers: { "Content-Type": "text/javascript;charset=utf-8" },
        body: content,
      });
    } catch {
      throw new Error("Server lokal tidak menjawab. Pastikan serve.py masih berjalan.");
    }
    if (!res.ok) {
      let message = `Server menolak permintaan (${res.status}).`;
      try {
        const info = await res.json();
        if (info && info.error) message = info.error;
      } catch { /* pakai pesan bawaan */ }
      throw new Error(message);
    }
  }

  async function writeViaHandle(content) {
    if (!handle) throw new Error("Berkas js/data.js belum dipilih.");
    if ((await permissionState()) !== "granted") {
      let granted = "denied";
      try {
        granted = await handle.requestPermission({ mode: "readwrite" });
      } catch { /* di luar gestur pengguna izin tidak bisa diminta */ }
      if (granted !== "granted") {
        throw new Error("Izin menulis js/data.js belum diberikan. Buka menu ☰ lalu sambungkan ulang.");
      }
    }
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  async function flush() {
    if (!enabled || mode === "none") return;
    if (busy) { queued = true; return; }

    const content = getContent();
    if (!content || content === lastWritten) return;

    busy = true;
    try {
      if (mode === "server") await writeViaServer(content);
      else await writeViaHandle(content);

      lastWritten = content;
      lastWriteAt = new Date();
      lastError = "";
      notice = "";
      const first = !everWrote;
      everWrote = true;
      emit({ type: "written", first });
    } catch (err) {
      lastError = err.message || "Penulisan js/data.js gagal.";
      emit({ type: "error", message: lastError });
    } finally {
      busy = false;
      if (queued) {
        queued = false;
        setTimeout(flush, 0);
      }
    }
  }

  /** Dipanggil setiap kali data berubah; penulisan digabung sebentar. */
  function schedule() {
    if (!enabled || mode === "none") return;
    clearTimeout(timer);
    timer = setTimeout(flush, CONFIG.SYNC_DEBOUNCE_MS);
  }

  /* ═══ Sambung & putus ═══════════════════════════ */

  /**
   * Menyalakan sinkronisasi. Pada mode "file" ini membuka pemilih berkas,
   * jadi hanya boleh dipanggil dari dalam gestur pengguna (klik).
   * Melempar Error berpesan ramah; membatalkan pemilih menghasilkan `false`.
   */
  async function connect() {
    if (mode === "none") throw new Error(unavailableReason());

    if (mode === "file" && !handle) {
      let picked;
      try {
        picked = await window.showSaveFilePicker({
          suggestedName: "data.js",
          types: [{ description: "Berkas JavaScript", accept: { "text/javascript": [".js"] } }],
        });
      } catch (err) {
        if (err && err.name === "AbortError") return false;
        throw new Error("Pemilih berkas tidak bisa dibuka di sini. Coba jalankan serve.py.");
      }

      let granted = "denied";
      try {
        granted = await picked.requestPermission({ mode: "readwrite" });
      } catch { /* biarkan jadi "denied" */ }
      if (granted !== "granted") throw new Error("Izin menulis ke berkas itu tidak diberikan.");

      handle = picked;
      await rememberHandle(handle);
    }

    enabled = true;
    lastError = "";
    notice = "";
    writePreference("on");
    emit({ type: "connected" });

    lastWritten = null;   // paksa satu penulisan supaya berkasnya langsung sepadan
    await flush();
    return true;
  }

  function disconnect() {
    enabled = false;
    clearTimeout(timer);
    writePreference("off");
    emit({ type: "disconnected" });
  }

  /** Melupakan penunjuk berkas sekaligus mematikan sinkronisasi. */
  async function forget() {
    handle = null;
    await rememberHandle(null);
    disconnect();
  }

  /* ═══ Init ══════════════════════════════════════ */

  /**
   * @param {{getContent: () => string, onStatus?: (status, event) => void}} options
   */
  async function init(options) {
    const opts = options || {};
    if (typeof opts.getContent === "function") getContent = opts.getContent;
    if (typeof opts.onStatus === "function") onStatus = opts.onStatus;

    const preference = readPreference();
    emit({ type: "detecting" });

    if (await detectServer()) {
      // Kalau serve.py yang menyajikan halaman, niat penggunanya sudah jelas:
      // nyalakan kecuali pernah dimatikan sendiri.
      mode = "server";
      enabled = preference !== "off";
    } else if (supportsFilePicker()) {
      mode = "file";
      handle = await recallHandle();
      if (handle) {
        const state = await permissionState();
        enabled = preference !== "off" && state !== "denied";
        if (state === "denied") {
          lastError = "Izin menulis js/data.js sudah dicabut. Sambungkan ulang.";
        } else if (state === "prompt") {
          notice = "Browser akan meminta izin sekali lagi saat penyimpanan berikutnya.";
        }
      } else {
        enabled = false;
      }
    } else {
      mode = "none";
      enabled = false;
    }

    emit({ type: "ready" });
    return status();
  }

  return Object.freeze({
    init, schedule, flush, connect, disconnect, forget,
    status, unavailableReason,
  });
})();
