#!/usr/bin/env python3
"""Import the live product pages from the All Hands build into pages/, at a deployable weight.

The prototype used to composite flat Figma exports of these pages. It now embeds the real
HTML, so every interaction lines up with real elements instead of with baked pixels — see
CLAUDE.md. The pages come from a SIBLING FOLDER that is not part of this repo:

    ../10. My Complex All Hands/{home-editorial,home-feed,article,rerank,fandom}.html

**Why this script exists: those pages fetch 97 MB of images.** They are authored at full
source resolution — the worst is a 4096x3072 JPEG that renders 267px wide — which is fine
for a local build and hopeless for a deploy that currently ships ~10 MB behind a loader.
So each raster is resized to 2x the size it actually renders at on this stage and re-encoded
to WebP, which is the same rule the Figma exports follow (see tools/export-assets.md).
Measured, not guessed: the script loads each page in a real browser, scrolls it end to end
to trigger every lazy image, and reads the rendered box of each one.

Two scale factors matter, and they are why the widths differ per page:
  * in-phone pages (home-editorial, home-feed, fandom) are shown in the 440px phone screen
    at zoom 440/390 = 1.128205, so their images render 12.8% larger than in the page itself;
  * panel pages (article, rerank) sit in #gray-panel / #panel-rerank, which are 390x887 —
    exactly the page's own width, so 1:1 with no zoom.
An asset shared between both gets the larger requirement.

AVIF and SVG are copied untouched: the article and rerank pages are already AVIF and weigh
1.2 MB and 0.3 MB all in, so re-encoding them would only lose quality. `inter-subset.woff2`
is not copied either — the pages' font URL is rewritten to the one already in vendor/.

Anything with an ALPHA channel gets q95 and lossless alpha instead of the photo q82: alpha
means cut-out art — props, logos, the onboarding card and keychain with their soft drop
shadows — and a soft shadow's falloff is where lossy banding and halos show up worst.

Idempotent: safe to re-run after the source pages change. Run:

    python3 tools/make-page-assets.py            # convert
    python3 tools/make-page-assets.py --report   # measure only, change nothing
"""
import functools
import http.server
import math
import os
import pathlib
import re
import shutil
import socket
import socketserver
import sys
import threading

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PROJECT = HERE.parent
SRC = PROJECT.parent / "10. My Complex All Hands"
OUT = PROJECT / "pages"

PHONE_ZOOM = 440 / 390        # in-phone pages fill the 440px screen; see the docstring
PAGES = {                     # page -> the zoom it is displayed at
    "home-editorial": PHONE_ZOOM,
    "home-feed": PHONE_ZOOM,
    "article": 1.0,
    "rerank": 1.0,
    "fandom": 1.0,
}
KEEP_AS_IS = {".svg", ".avif", ".webp"}   # already vector or already efficient
CONVERT = {".png", ".jpg", ".jpeg"}
WEBP_Q = 82                   # photos
WEBP_Q_ALPHA = 95             # anything with alpha — see the note below
RETINA = 2
FALLBACK_W = 900              # for an asset that is fetched but never rendered with a box

REPORT_ONLY = "--report" in sys.argv


def free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def serve(root, port):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):      # 200-a-line access logs drown the report
            pass

    handler = functools.partial(Quiet, directory=str(root))

    class T(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    srv = T(("127.0.0.1", port), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


def measure():
    """{asset path -> widest px it is ever rendered at, x zoom x RETINA}, and per-page refs."""
    port = free_port()
    srv = serve(SRC, port)
    need, per_page = {}, {}
    try:
        with sync_playwright() as p:
            b = p.chromium.launch()
            for name, zoom in PAGES.items():
                pg = b.new_page(viewport={"width": 390, "height": 952})
                seen = set()
                pg.on("response", lambda r: seen.add(r.url))
                pg.goto(f"http://127.0.0.1:{port}/{name}.html", wait_until="load")
                pg.wait_for_timeout(1000)
                # walk the whole page so lazy/offscreen images decide to load
                h = pg.evaluate("() => document.body.scrollHeight")
                for y in range(0, h, 700):
                    pg.evaluate("(y) => window.scrollTo(0, y)", y)
                    pg.wait_for_timeout(60)
                pg.wait_for_timeout(1200)
                pg.evaluate("() => window.scrollTo(0, 0)")
                pg.wait_for_timeout(300)
                boxes = pg.evaluate("""() => {
                  const out = [];
                  for (const i of document.images) {
                    const r = i.getBoundingClientRect();
                    out.push([i.currentSrc || i.src, r.width]);
                  }
                  /* CSS backgrounds too — they are fetched but are not in document.images */
                  for (const el of document.querySelectorAll('*')) {
                    const bg = getComputedStyle(el).backgroundImage;
                    if (!bg || bg === 'none') continue;
                    for (const m of bg.matchAll(/url\\("?([^")]+)"?\\)/g))
                      out.push([m[1], el.getBoundingClientRect().width]);
                  }
                  return out;
                }""")
                refs = set()
                for src, w in boxes:
                    key = f"127.0.0.1:{port}/"
                    if key not in src:
                        continue
                    rel = src.split(key)[1].split("?")[0]
                    if not rel or rel.endswith(".html"):
                        continue
                    refs.add(rel)
                    need[rel] = max(need.get(rel, 0), math.ceil(w * zoom * RETINA))
                for u in seen:                       # anything fetched but never measured
                    key = f"127.0.0.1:{port}/"
                    if key in u:
                        rel = u.split(key)[1].split("?")[0]
                        if rel and not rel.endswith((".html", ".woff2")):
                            refs.add(rel)
                            need.setdefault(rel, 0)
                per_page[name] = refs
                pg.close()
            b.close()
    finally:
        srv.shutdown()
    return need, per_page


def convert(need):
    (OUT / "assets").mkdir(parents=True, exist_ok=True)
    before = after = 0
    stats = {"copied": 0, "resized": 0, "missing": 0}
    for rel, want_w in sorted(need.items()):
        src = SRC / rel
        if not src.exists():
            stats["missing"] += 1
            print("  MISSING", rel)
            continue
        before += src.stat().st_size
        ext = src.suffix.lower()
        if ext in KEEP_AS_IS:
            dst = OUT / rel
            dst.parent.mkdir(parents=True, exist_ok=True)
            if not REPORT_ONLY:
                shutil.copy2(src, dst)
            after += src.stat().st_size
            stats["copied"] += 1
            continue
        if ext not in CONVERT:
            print("  ?? unhandled type, copied as-is:", rel)
            if not REPORT_ONLY:
                shutil.copy2(src, OUT / rel)
            after += src.stat().st_size
            stats["copied"] += 1
            continue
        dst = (OUT / rel).with_suffix(".webp")
        dst.parent.mkdir(parents=True, exist_ok=True)
        im = Image.open(src)
        w = want_w or FALLBACK_W
        if im.width > w:                             # never upscale
            im = im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA" if "A" in im.getbands() else "RGB")
        if not REPORT_ONLY:
            # Alpha means cut-out art, not a photo — props, logos, the onboarding card and
            # keychain with their soft drop shadows. A soft shadow is the single most
            # lossy-sensitive thing here: banding and halos in the falloff are obvious in a
            # way they never are in a photo. So those get q95 (the quality the repo's other
            # composite scripts use for flat UI art) and alpha is kept lossless.
            im.save(dst, "WEBP", quality=(WEBP_Q_ALPHA if im.mode == "RGBA" else WEBP_Q),
                    method=6, alpha_quality=100)
            after += dst.stat().st_size
        else:
            after += src.stat().st_size * 0.15       # rough, report mode only
        stats["resized"] += 1
    return before, after, stats


def write_pages(per_page, need):
    """Copy each page, repointing converted rasters at .webp and the font at vendor/."""
    convertible = {r for r in need if pathlib.Path(r).suffix.lower() in CONVERT}
    for name in PAGES:
        html = (SRC / f"{name}.html").read_text(encoding="utf-8")
        for rel in sorted(convertible, key=len, reverse=True):
            html = html.replace(rel, str(pathlib.Path(rel).with_suffix(".webp")))
        # one vendored copy of the font, not five
        html = html.replace("./inter-subset.woff2", "../vendor/inter-subset.woff2")
        html = html.replace("'inter-subset.woff2'", "'../vendor/inter-subset.woff2'")
        html = html.replace('"inter-subset.woff2"', '"../vendor/inter-subset.woff2"')
        banner = (f"<!-- GENERATED by tools/make-page-assets.py from "
                  f"'../10. My Complex All Hands/{name}.html'. Do not hand-edit: re-run the "
                  f"script. Rasters are resized to {RETINA}x on-stage size and re-encoded "
                  f"to WebP; the font points at vendor/. -->\n")
        if not REPORT_ONLY:
            (OUT / f"{name}.html").write_text(banner + html, encoding="utf-8")


if __name__ == "__main__":
    if not SRC.exists():
        sys.exit(f"source folder not found: {SRC}\n"
                 "It is a sibling of this repo and is not checked in — see CLAUDE.md.")
    print(f"measuring {len(PAGES)} pages from {SRC.name} ...")
    need, per_page = measure()
    print(f"  {len(need)} distinct assets referenced")
    print("converting ..." if not REPORT_ONLY else "reporting only, nothing written ...")
    before, after, stats = convert(need)
    write_pages(per_page, need)
    print("\n  copied as-is (svg/avif/webp): %d" % stats["copied"])
    print("  resized + WebP (png/jpg):     %d" % stats["resized"])
    if stats["missing"]:
        print("  MISSING from source:          %d" % stats["missing"])
    print("\n  %6.2f MB  ->  %6.2f MB   (%.0f%% smaller)"
          % (before / 1e6, after / 1e6, 100 * (1 - after / before)))
    if not REPORT_ONLY:
        print(f"\nwrote {OUT.relative_to(PROJECT)}/ — 5 pages + assets.")
        print("Next: bump any ?v= on pages you already embedded, and re-verify the deploy "
              "set (record a real page load and diff against .vercelignore).")
