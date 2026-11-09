"""개발용 정적 서버 — 캐시를 끄고 서빙한다(수정한 CSS·JS가 바로 보이도록).

사용법: python tools/serve.py [포트] [폴더]
"""
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCacheHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript", ".webp": "image/webp", ".svg": "image/svg+xml"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 8650
root = sys.argv[2] if len(sys.argv) > 2 else "."
ThreadingHTTPServer(("127.0.0.1", port), partial(NoCacheHandler, directory=root)).serve_forever()
