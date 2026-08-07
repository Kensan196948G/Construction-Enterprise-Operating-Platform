"""Spin up a local-only HTTP server that serves the Construction Hub UI.

The server injects a ``<meta name="cdx-server-url">`` tag into ``index.html``
so the JS does not have to hardcode the central API URL — the operator (or
later the OS imaging step) configures it via ``CDX_API_BASE``.

PoC quality: bound to 127.0.0.1 only. Phase 2 will replace this with a
proper desktop integration (likely GTK or webview wrapper).
"""

from __future__ import annotations

import http.server
import os
import socketserver
import sys
import threading
import webbrowser
from pathlib import Path

DEFAULT_PORT = 8765
DEFAULT_CDX_SERVER_URL = "http://127.0.0.1:8080"
WEBROOT = Path(__file__).resolve().parent.parent  # static assets one level up
META_TOKEN = "<!-- cdx-server-meta -->"


def _build_index_html(cdx_server_url: str) -> bytes:
    raw = (WEBROOT / "index.html").read_text(encoding="utf-8")
    safe_url = cdx_server_url.replace('"', "")  # crude but adequate for env-supplied value
    meta = f'<meta name="cdx-server-url" content="{safe_url}">'
    if META_TOKEN in raw:
        raw = raw.replace(META_TOKEN, meta)
    else:
        # Fallback: inject before </head>
        raw = raw.replace("</head>", f"    {meta}\n</head>", 1)
    return raw.encode("utf-8")


class _Handler(http.server.SimpleHTTPRequestHandler):
    cdx_server_url: str = DEFAULT_CDX_SERVER_URL

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEBROOT), **kwargs)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in ("/", "/index.html"):
            body = _build_index_html(type(self).cdx_server_url)
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()


def serve(port: int = DEFAULT_PORT, cdx_server_url: str = DEFAULT_CDX_SERVER_URL) -> None:
    _Handler.cdx_server_url = cdx_server_url
    with socketserver.TCPServer(("127.0.0.1", port), _Handler) as server:
        url = f"http://127.0.0.1:{port}/"
        print(
            f"Construction Hub listening on {url} "
            f"(cdx-server={cdx_server_url}, Ctrl-C to stop)",
            flush=True,
        )
        if not os.environ.get("CONSTRUCTION_HUB_NO_BROWSER"):
            threading.Timer(0.5, lambda: webbrowser.open(url)).start()
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down.", flush=True)


def main() -> int:
    port = int(os.environ.get("CONSTRUCTION_HUB_PORT", DEFAULT_PORT))
    cdx_server_url = os.environ.get("CDX_API_BASE", DEFAULT_CDX_SERVER_URL)
    serve(port, cdx_server_url)
    return 0


if __name__ == "__main__":
    sys.exit(main())
