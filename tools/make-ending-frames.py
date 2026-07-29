#!/usr/bin/env python3
"""Turn the closing Jordan Rose I.D. video into a scroll-scrubbable sprite sheet.

`assets/General/Jordan Rose ID Video.mp4` is the finale: the encased Complex I.D. sits on
black, its edges start to glow, and it morphs into a real person wearing it on the ComplexCon
floor before the shot pulls back over the whole crowd. It REPLACED `assets/lanyard.webp` (the
static "worn in the real world" still) as scene 24 — the video says the same thing, moving.

Same reasoning as tools/make-xp-frames.py, and the same two traps, so read both:

  * **Not a `<video>`.** `video.currentTime = t` cannot be relied on — `python3 -m
    http.server` implements no HTTP Range so a local seek goes nowhere, and per-frame seek
    accuracy is at the decoder's mercy even when served properly. Every other beat on this
    page is deterministic and reversible under a scrub; a frame sequence is, a seek is not.
  * **Capture during PLAYBACK** via `requestVideoFrameCallback`, never seek-then-draw:
    `onseeked` hands back a stale frame and every extracted frame comes out IDENTICAL,
    silently.

One thing this script does that make-xp-frames.py does not: it plays at **`RATE` = 0.25**.
At 1.0 the `toDataURL` per callback cannot keep up with a 24 fps 1280x720 source and Chromium
simply skips presenting frames — the first pass captured 81 of 120 at uneven spacing (~16 fps)
and nothing said so. At 0.25 all 120 arrive with a dead-even 1/24 s gap. `mediaTime` is
asserted below so a regression here is loud instead of silent.

Geometry: the video is 1280x720, exactly the stage's 16:9, so the sheet plays FULL-BLEED over
the whole 1920x1080 stage — `#ending` in styles.css is the stage box itself, no letterboxing
and no aspect fudge. Cells are CELL_W wide; at 1280 that is the source 1:1 (the stage upscales
it either way, as the retired still was upscaled).

Output: `assets/ending-frames.webp` plus the constants to paste into main.js. Run:

    python3 tools/make-ending-frames.py            # write the sheet
    python3 tools/make-ending-frames.py --measure  # size/memory table for the variants, no write
"""
import base64
import functools
import http.server
import io
import math
import pathlib
import socket
import socketserver
import sys
import threading

from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PROJECT = HERE.parent
SRC = PROJECT / "assets" / "General" / "Jordan Rose ID Video.mp4"
OUT = PROJECT / "assets" / "ending-frames.webp"

STAGE_W = 1920            # the sheet plays full-bleed, so the display width IS the stage
CELL_W = 1024             # sprite cell width. The source is 1280 and the stage upscales it
                          # either way; both the file and the decoded size scale with CELL_W².
COLS = 8                  # a grid, not a strip: 60 cells in one column would be ~34,000px
                          # tall, far past what a browser will decode in one dimension.
QUALITY = 76
RATE = 0.25               # playback rate during capture — see the docstring. Do not raise.
FPS = 24                  # the source rate; asserted against the captured mediaTime spacing

# ── Why 12 fps and not the source's 24 ──
# The sheet's cost is linear in frames and quadratic in CELL_W, and BOTH matter here: the
# deploy is ~15 MB in total and the decoded sheet sits in memory for the whole session. All
# 119 frames measured 5.1 MB even at a soft 768px cell (`--measure` prints the table), which
# buys temporal resolution the content cannot use: the reader scrubs these 5 seconds across
# ~2,900 px of scroll, so at any ordinary scroll speed the video plays FASTER than real time
# and the limiting factor is spatial, not temporal. The two halves are also forgiving in
# opposite ways — the morph is a heavy motion-blurred dissolve (blur hides steps, which is why
# cinema gets away with 24) and the ComplexCon pull-back is slow. So: half the frames, and
# spend the budget on the cell instead.
# Sampling is by mediaTime against an even grid, NOT by index — `check_spacing` found the
# capture missing one frame at the head, and index striding would have shifted everything
# after it by half a frame.
OUT_FPS = 12

if not SRC.exists():
    sys.exit(f"video not found: {SRC}")


def capture():
    """Every presented frame as a PIL image, captured during slowed-down playback.

    Returns (frames, media_times). The times are only used to verify nothing was dropped.
    """
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()

    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass

    class T(socketserver.ThreadingMixIn, http.server.HTTPServer):
        daemon_threads = True
        allow_reuse_address = True

    srv = T(("127.0.0.1", port), functools.partial(Quiet, directory=str(PROJECT)))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    rel = "/" + SRC.relative_to(PROJECT).as_posix().replace(" ", "%20")
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
            pg = b.new_page(viewport={"width": 600, "height": 600})
            pg.set_default_timeout(240000)
            pg.goto("http://127.0.0.1:%d/" % port, wait_until="load")
            pg.set_content('<video id="v" src="%s" muted playsinline></video>' % rel)
            pg.wait_for_function(
                "() => { const v=document.getElementById('v'); return !!(v && v.readyState>=2); }")
            shots = pg.evaluate("""async (rate) => {
                const v = document.getElementById('v');
                const c = document.createElement('canvas');
                c.width = v.videoWidth; c.height = v.videoHeight;
                const ctx = c.getContext('2d');
                const out = [];
                v.playbackRate = rate;          /* see docstring: 1.0 drops ~a third of them */
                await v.play();
                await new Promise(done => {
                  const cb = (now, md) => {
                    ctx.drawImage(v, 0, 0);
                    out.push([md.mediaTime, c.toDataURL('image/webp', 0.96)]);
                    if (v.ended || out.length > 900) done(); else v.requestVideoFrameCallback(cb);
                  };
                  v.requestVideoFrameCallback(cb);
                  v.onended = () => done();
                });
                return out;
            }""", RATE)
            b.close()
    finally:
        srv.shutdown()

    frames = [Image.open(io.BytesIO(base64.b64decode(d.split(",")[1]))).convert("RGB")
              for _, d in shots]
    return frames, [t for t, _ in shots]


def check_spacing(times):
    """Loud if the capture dropped frames — the failure this script exists to avoid."""
    gaps = [times[i + 1] - times[i] for i in range(len(times) - 1)]
    step = 1.0 / FPS
    bad = [(i, round(g, 4)) for i, g in enumerate(gaps) if g > step * 1.5]
    print("  mediaTime %.4f .. %.4f, %d gaps, expected step %.4f" % (times[0], times[-1], len(gaps), step))
    if bad:
        print("  WARNING: %d dropped frame(s) at %s — lower RATE and re-run" % (len(bad), bad[:8]))
    else:
        print("  spacing even — no dropped frames")


def resample(frames, times, out_fps):
    """Pick the frame nearest each slot of an even `out_fps` grid across the captured span.

    By TIME, not by index: one frame went missing at the head of the capture, and striding the
    index would put every later sample half a frame off its slot — a wobble in the playback
    rate that no amount of scrubbing would explain.
    """
    t0, t1 = times[0], times[-1]
    n = int(round((t1 - t0) * out_fps)) + 1
    kept, idx = [], []
    for k in range(n):
        want = t0 + k / out_fps
        j = min(range(len(times)), key=lambda i: abs(times[i] - want))
        kept.append(frames[j])
        idx.append(j)
    return kept, idx


def build(frames, cell_w, cols, quality, out):
    n = len(frames)
    vw, vh = frames[0].size
    fw = int(round(cell_w))
    fh = int(round(fw * vh / vw))
    rows = math.ceil(n / cols)
    sheet = Image.new("RGB", (cols * fw, rows * fh), (0, 0, 0))
    for i, im in enumerate(frames):
        sheet.paste(im.resize((fw, fh), Image.LANCZOS), ((i % cols) * fw, (i // cols) * fh))
    sheet.save(out, "WEBP", quality=quality, method=6)
    return fw, fh, rows, sheet.size


if __name__ == "__main__":
    print("capturing frames during playback at %gx ..." % RATE)
    frames, times = capture()
    if not frames:
        sys.exit("no frames captured")
    check_spacing(times)
    vw, vh = frames[0].size
    print("  %d frames captured at %dx%d" % (len(frames), vw, vh))

    if "--measure" in sys.argv:
        import tempfile
        print("\n  fps  cell_w   sheet px        decoded  file")
        for fps in (24, 12):
            fr, _ = resample(frames, times, fps)
            for cw in (768, 896, 1024, 1120, 1280):
                with tempfile.NamedTemporaryFile(suffix=".webp") as tmp:
                    fw, fh, rows, size = build(fr, cw, COLS, QUALITY, tmp.name)
                    print("  %3d   %4d   %5dx%-5d  %6.1f Mpx  %5.2f MB"
                          % (fps, cw, size[0], size[1], size[0] * size[1] / 1e6,
                             pathlib.Path(tmp.name).stat().st_size / 1e6))
        sys.exit(0)

    frames, idx = resample(frames, times, OUT_FPS)
    n = len(frames)
    print("  resampled to %d frames at %d fps (source indices %s ...)" % (n, OUT_FPS, idx[:6]))
    fw, fh, rows, size = build(frames, CELL_W, COLS, QUALITY, OUT)
    print("  cells %dx%d, grid %dx%d = %dx%d px" % (fw, fh, COLS, rows, size[0], size[1]))
    print("  wrote %s  %.2f MB" % (OUT.relative_to(PROJECT), OUT.stat().st_size / 1e6))

    print("\npaste into main.js:")
    print("  const END_FRAMES = %d, END_COLS = %d;" % (n, COLS))
    print("  const END_CELL_W = %d, END_CELL_H = %s;   /* DISPLAY px (%d x 9/16) */"
          % (STAGE_W, round(STAGE_W * vh / vw, 2), STAGE_W))
    print("styles.css #ending-sheet width: %dpx  (= %d cols x %d)" % (COLS * STAGE_W, COLS, STAGE_W))
