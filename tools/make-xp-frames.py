#!/usr/bin/env python3
"""Turn the Scene 11 XP video into a scroll-scrubbable sprite sheet.

`assets/Scene 11/360-Degree Animation 1.mp4` is the +100 XP popup with its charm rotating in
3D. The scene shows it frame by frame as the reader scrolls, which rules out a `<video>`:

  * **Seeking that file does not work.** `video.currentTime = t` leaves currentTime at 0 —
    `python3 -m http.server` does not implement HTTP Range, so the browser cannot seek at all
    locally. Even served properly, the file has an `stss` table (so it is NOT all-keyframe) and
    per-frame seek accuracy would be at the decoder's mercy.
  * Scrubbing has to be **deterministic and reversible** — every other beat on this page is.
    A frame sequence is; a seeking video is not.

So the frames are extracted once, here, and shipped as a sprite sheet that the timeline
indexes with a transform. Extraction captures during PLAYBACK via `requestVideoFrameCallback`,
which fires when a frame is actually presented. Do not "simplify" this to seek-then-draw: with
`onseeked` alone the canvas returns a stale frame and every extracted frame comes out
IDENTICAL — which is exactly what happened first time, and it is silent.

Why the whole card and not just the charm: the card's text renders differently in the video
than in the retired `assets/xp-modal.webp` (bolder), so compositing video charm frames over
the old static card would show a mismatch in the type. The 99.5%-energy moving box is 65% of
the frame anyway, so cropping saves little.

Output: `assets/xp-frames.webp` (a COLS x ROWS grid) and the geometry to paste into styles.css,
printed at the end. Run:

    python3 tools/make-xp-frames.py
"""
import base64
import io
import math
import pathlib
import sys

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PROJECT = HERE.parent
SRC = PROJECT / "assets" / "Scene 11" / "360-Degree Animation 1.mp4"
OUT = PROJECT / "assets" / "xp-frames.webp"

DISPLAY_W = 358           # the popup's width in stage px (see #xp-modal in styles.css)
RETINA = 1.5              # sprite scale. 2x would be crisper but the sheet's decoded size
                          # grows with the square of this — 1.5 keeps it under ~70 MB in VRAM
                          # for large text and a shiny object, which is what this frame is.
COLS = 8                  # grid, not a strip: a 64-frame strip would be ~38,000px tall, past
                          # what browsers will decode in one dimension.
QUALITY = 80

if not SRC.exists():
    sys.exit(f"video not found: {SRC}")


def capture():
    """Every presented frame, as PIL images, captured during playback."""
    url = "http://127.0.0.1:%d/" % PORT
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = b.new_page(viewport={"width": 600, "height": 600})
        pg.set_default_timeout(180000)
        pg.goto(url, wait_until="load")
        pg.set_content('<video id="v" src="%s" muted playsinline></video>'
                       % ("/" + SRC.relative_to(PROJECT).as_posix().replace(" ", "%20")))
        pg.wait_for_function("() => { const v=document.getElementById('v'); return v && v.readyState>=2; }")
        shots = pg.evaluate("""async () => {
            const v = document.getElementById('v');
            const c = document.createElement('canvas');
            c.width = v.videoWidth; c.height = v.videoHeight;
            const ctx = c.getContext('2d');
            const out = [];
            await v.play();
            await new Promise(done => {
              const cb = () => {
                ctx.drawImage(v, 0, 0);
                out.push(c.toDataURL('image/webp', 0.96));
                if (v.ended || out.length > 400) done(); else v.requestVideoFrameCallback(cb);
              };
              v.requestVideoFrameCallback(cb);
              v.onended = () => done();
            });
            return out;
        }""")
        b.close()
    return [Image.open(io.BytesIO(base64.b64decode(d.split(",")[1]))).convert("RGB") for d in shots]


if __name__ == "__main__":
    import functools, http.server, socket, socketserver, threading

    s = socket.socket(); s.bind(("127.0.0.1", 0)); PORT = s.getsockname()[1]; s.close()

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    class T(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    srv = T(("127.0.0.1", PORT), functools.partial(Quiet, directory=str(PROJECT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    try:
        print("capturing frames during playback ...")
        frames = capture()
    finally:
        srv.shutdown()

    n = len(frames)
    if not n:
        sys.exit("no frames captured")
    vw, vh = frames[0].size
    fw = int(round(DISPLAY_W * RETINA))
    fh = int(round(fw * vh / vw))
    rows = math.ceil(n / COLS)
    print("  %d frames at %dx%d  ->  cells %dx%d, grid %dx%d = %dx%d px"
          % (n, vw, vh, fw, fh, COLS, rows, COLS * fw, rows * fh))

    sheet = Image.new("RGB", (COLS * fw, rows * fh), (255, 255, 255))
    for i, im in enumerate(frames):
        sheet.paste(im.resize((fw, fh), Image.LANCZOS), ((i % COLS) * fw, (i // COLS) * fh))
    sheet.save(OUT, "WEBP", quality=QUALITY, method=6)
    print("  wrote %s  %.2f MB" % (OUT.relative_to(PROJECT), OUT.stat().st_size / 1e6))

    disp_h = round(DISPLAY_W * vh / vw, 2)
    print("\npaste into styles.css / main.js:")
    print("  #xp-modal  width: %spx; height: %spx;   (the video's aspect, %.4f)"
          % (DISPLAY_W, disp_h, vw / vh))
    print("  XP_FRAMES = %d, XP_COLS = %d" % (n, COLS))
    print("  sprite cell in DISPLAY px: %s x %s" % (DISPLAY_W, disp_h))
    print("  inner img width: %spx  (= %d cols x %s)" % (COLS * DISPLAY_W, COLS, DISPLAY_W))
