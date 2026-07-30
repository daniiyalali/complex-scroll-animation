#!/usr/bin/env python3
"""Local dev server that does NOT let the browser cache anything.

`python3 -m http.server` sends `Last-Modified` and honours `If-Modified-Since`, which is
correct HTTP and wrong for this project. `index.html` loads `main.js` and `styles.css` with no
`?v=`, so Chrome will happily keep a tab running the previous build after an edit: the file on
disk is new, the served bytes are new, and the page is old. That has now cost a review cycle —
the reader hard-refreshed, saw the pre-edit timeline, and reasonably concluded nothing had been
built. The iframes make it worse, because a reload does not necessarily revalidate a frame's
document.

So: `Cache-Control: no-store` on everything, and drop `Last-Modified` so there is nothing to
revalidate against. Slower on reload, which does not matter at all on localhost, and the page
you see is always the page on disk.

    python3 tools/serve.py            # port 8321, this directory
    python3 tools/serve.py 8322       # somewhere else

Use this instead of `python3 -m http.server`. It is dev-only and ships nothing: Vercel serves
the real cache headers from `vercel.json`.
"""
import functools
import http.server
import socketserver
import sys


class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()

    def send_header(self, key, value):
        # nothing to revalidate against means no 304s, so a stale tab is impossible
        if key.lower() == "last-modified":
            return
        super().send_header(key, value)

    def log_message(self, fmt, *args):
        # one line per request drowns anything useful; keep errors only
        if not str(args[1] if len(args) > 1 else "").startswith("2"):
            super().log_message(fmt, *args)


class Server(socketserver.ThreadingTCPServer):
    """Threading, or one stalled iframe request blocks the whole page load."""
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8321
    handler = functools.partial(NoCache, directory=".")
    try:
        with Server(("", port), handler) as httpd:
            print(f"serving . on http://localhost:{port}/  (no-store; ?debug for the HUD)")
            httpd.serve_forever()
    except OSError as e:
        sys.exit(f"could not bind port {port}: {e}\n"
                 f"Something else is already listening — find it with "
                 f"`lsof -nP -iTCP:{port} -sTCP:LISTEN`.")
