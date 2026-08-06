#!/usr/bin/env python3
"""
Server lokal untuk situs silsilah keluarga.

Selain menyajikan berkas statis (seperti `python -m http.server`), server ini
menerima satu permintaan tulis:

    GET  /__api/status    ->  menandakan "server ini bisa menulis data.js"
    POST /__api/data.js   ->  menimpa js/data.js dengan isi permintaan

Halaman memakainya untuk memperbarui `js/data.js` secara otomatis setiap kali
data ditambah, diubah, atau dihapus — jadi tidak perlu lagi salin-tempel manual.

Jalankan:  python serve.py [port]
Lalu buka: http://127.0.0.1:8000

Server hanya mendengarkan di 127.0.0.1 (tidak terlihat dari jaringan lain) dan
hanya boleh menulis ke satu berkas: js/data.js.
"""

import json
import os
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent
TARGET = ROOT / "js" / "data.js"
BACKUP = ROOT / "js" / "data.backup.js"

HOST = "127.0.0.1"
DEFAULT_PORT = 8000
MAX_BYTES = 32 * 1024 * 1024  # foto disimpan sebagai data-URI, jadi dilonggarkan


def write_atomic(content):
    """
    Menulis lewat berkas sementara lalu menggantinya sekaligus, supaya
    js/data.js tidak pernah tertinggal dalam keadaan setengah jadi.
    Isi sebelumnya disalin ke js/data.backup.js sebagai jaring pengaman.
    """
    TARGET.parent.mkdir(parents=True, exist_ok=True)
    if TARGET.exists():
        BACKUP.write_bytes(TARGET.read_bytes())

    fd, tmp_path = tempfile.mkstemp(dir=str(TARGET.parent), prefix=".data-", suffix=".js")
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        os.replace(tmp_path, TARGET)
    except BaseException:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
        raise


class Handler(SimpleHTTPRequestHandler):
    server_version = "FamilyTreeServer/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    # ── Bantu-bantu ──────────────────────────────────

    def route(self):
        return self.path.split("?", 1)[0].rstrip("/") or "/"

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        # Berkas berubah terus selama menyunting — jangan sampai browser
        # menyajikan versi lama dari cache.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    # ── Rute ─────────────────────────────────────────

    def do_GET(self):
        if self.route().endswith("/__api/status"):
            self.send_json(200, {
                "familyTreeServer": True,
                "target": "js/data.js",
            })
            return
        super().do_GET()

    def do_POST(self):
        if not self.route().endswith("/__api/data.js"):
            self.send_json(404, {"ok": False, "error": "Alamat itu tidak dikenal."})
            return

        try:
            length = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            length = 0

        if length <= 0:
            self.send_json(400, {"ok": False, "error": "Isi permintaan kosong."})
            return
        if length > MAX_BYTES:
            self.send_json(413, {"ok": False, "error": "Data terlalu besar untuk ditulis."})
            return

        raw = self.rfile.read(length)
        try:
            content = raw.decode("utf-8")
        except UnicodeDecodeError:
            self.send_json(400, {"ok": False, "error": "Isi permintaan bukan teks UTF-8."})
            return

        # Penjaga sederhana: hanya terima yang benar-benar berbentuk data.js.
        if "FAMILY_DATA" not in content or "FAMILY_META" not in content:
            self.send_json(400, {"ok": False, "error": "Isi itu bukan berkas data.js yang sah."})
            return

        try:
            write_atomic(content)
        except OSError as err:
            self.send_json(500, {"ok": False, "error": "Gagal menulis js/data.js: %s" % err})
            return

        self.send_json(200, {"ok": True, "bytes": len(raw)})
        print("  ✔ js/data.js diperbarui ({:,} bita)".format(len(raw)))

    def log_message(self, fmt, *args):
        """Senyapkan log per-berkas; yang penting hanya catatan penulisan."""


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Port '%s' tidak sah. Contoh: python serve.py 8001" % sys.argv[1])
            return 2

    try:
        server = ThreadingHTTPServer((HOST, port), Handler)
    except OSError as err:
        print("Tidak bisa memakai port %d: %s" % (port, err))
        print("Coba port lain, misalnya:  python serve.py 8001")
        return 1

    url = "http://%s:%d" % (HOST, port)
    print("\n  Silsilah Keluarga — server lokal")
    print("  " + "-" * 42)
    print("  Buka di browser : %s" % url)
    print("  Menulis ke      : js/data.js (otomatis dari halaman)")
    print("  Hentikan        : Ctrl+C\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Server dihentikan.\n")
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
