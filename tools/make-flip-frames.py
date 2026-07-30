#!/usr/bin/env python3
"""Turn the designer's card-flip video into the s19.3 scroll-scrubbable sprite sheet.

`assets/card animation/Flip_Transition_Animation_Reversed.mp4` (1112x834, 5s @ 60fps) is
Martin Hen's I.D. card turning from REGULAR to BRONZE — a rendered 3D flip with real
perspective, motion blur and a moving shadow. It replaced the coded CSS rotateY flip
(2026-07-30, user's call): the video simply looks better than two flat faces on a
transform. The scene shows it frame by frame as the reader scrolls, which rules out a
`<video>` for the same reasons as s11 and s24 — read tools/make-xp-frames.py's docstring
before "simplifying" any of this; every warning there was hit once:
  * capture during PLAYBACK via requestVideoFrameCallback (seek-then-draw returns stale
    frames, silently);
  * at `playbackRate` 0.25 — at 1x on a 60fps source Chromium presents fewer frames than
    the file has and nothing says so;
  * sample against an even mediaTime grid, NOT by presented-frame index.

Three decisions of its own:

* **The frames ship WHITE-ON-WHITE, not matted.** The window sits INSIDE the sheet's
  white panel (user's spec: the video must stay within the white frame's bounds, nothing
  bleeding out) and each frame's background is normalised to pure white — border-ring
  median -> per-frame gain -> clip — so the video rectangle fuses with the panel and the
  card alone reads as the object. Alpha-matting was tried and is a dead end here: the
  card's paper face is the same near-white as the backdrop, so a border flood-fill leaks
  INTO the card (frame 0 keyed to 20% foreground) and no global threshold separates them.
* **The static head and tail are TRIMMED.** The source holds the resting card for ~1s at
  each end; inside a scroll scrub a held frame is dead scroll where the wheel does
  nothing. Motion is measured (mean |diff| between consecutive sampled frames on a
  downscaled luma) and the sweep keeps one resting frame each side of the moving span, so
  the scrub starts moving on its first pixel. Scene-level holds belong to the timeline,
  not the sprite.
* **12 fps, 1.5x cells** — the s24 budget reasoning: the sweep crosses ~1,280px of
  scroll, so the video plays faster than real time at any ordinary scroll speed and
  spatial detail is worth more than temporal. 1.5x matches the s11 sheet.

Output: `assets/flip-frames.webp` + the numbers to paste into main.js/styles.css, printed
at the end. Run:

    python3 tools/make-flip-frames.py
"""
import base64
import io
import math
import pathlib
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

HERE = pathlib.Path(__file__).parent
PROJECT = HERE.parent
SRC = PROJECT / "assets" / "card animation" / "Flip_Transition_Animation_Reversed.mp4"
OUT = PROJECT / "assets" / "flip-frames.webp"

DISPLAY_W = 391.2   # the window's width in stage px — the sheet panel's inner width
                    # (392.63 minus the 0.72px border each side), see #sm-flip in styles.css
RETINA = 1.5        # native cell = 1.5x display, the s11 sheet's own trade-off
OUT_FPS = 12        # the s24 reasoning — scrubbed, temporal resolution is the cheap axis
COLS = 8
QUALITY = 82
MOTION_THR = 1.0    # mean |luma diff| (0-255) that counts as the card actually moving

if not SRC.exists():
    sys.exit(f"video not found: {SRC}")


def capture():
    """Presented frames at playbackRate 0.25, resampled to an even OUT_FPS mediaTime grid."""
    url = "http://127.0.0.1:%d/" % PORT
    with sync_playwright() as p:
        b = p.chromium.launch(args=["--autoplay-policy=no-user-gesture-required"])
        pg = b.new_page(viewport={"width": 1200, "height": 900})
        pg.set_default_timeout(180000)
        pg.goto(url, wait_until="load")
        pg.set_content('<video id="v" src="%s" muted playsinline></video>'
                       % ("/" + SRC.relative_to(PROJECT).as_posix().replace(" ", "%20")))
        pg.wait_for_function("() => { const v=document.getElementById('v'); return v && v.readyState>=2; }")
        shots = pg.evaluate("""async (fps) => {
            const v = document.getElementById('v');
            const c = document.createElement('canvas');
            c.width = v.videoWidth; c.height = v.videoHeight;
            const ctx = c.getContext('2d');
            const out = [];
            let next = 0;                      // next mediaTime gridpoint to keep
            v.playbackRate = 0.25;
            await v.play();
            await new Promise(done => {
              const cb = (now, meta) => {
                if (meta.mediaTime >= next - 1/120) {   // nearest presented frame to the gridpoint
                  ctx.drawImage(v, 0, 0);
                  out.push([meta.mediaTime, c.toDataURL('image/webp', 0.96)]);
                  next += 1/fps;
                }
                if (v.ended) done(); else v.requestVideoFrameCallback(cb);
              };
              v.requestVideoFrameCallback(cb);
              v.onended = () => done();
            });
            return out;
        }""", OUT_FPS)
        b.close()
    return [(t, Image.open(io.BytesIO(base64.b64decode(d.split(",")[1]))).convert("RGB"))
            for t, d in shots]


def whiten(im):
    """Normalise the backdrop to pure white: border-ring median -> gain -> clip.
    The ring is 10px of genuine backdrop on every side (the card never reaches the frame
    edge). A per-frame gain, not a global one: the render's exposure breathes slightly."""
    a = np.asarray(im, dtype=np.float32)
    ring = np.concatenate([a[:10].reshape(-1, 3), a[-10:].reshape(-1, 3),
                           a[:, :10].reshape(-1, 3), a[:, -10:].reshape(-1, 3)])
    # 10th percentile, not the median: the backdrop has a slight vignette, and a median
    # gain left its darker corners at ~253 — which reads as a faint window edge against
    # the panel's true white. Keying to the ring's darker end clips the WHOLE backdrop
    # to 255; the card's paper whites clip a hair more (+3.7% gain vs +2.4%), invisible.
    low = np.percentile(ring, 10, axis=0)      # per-channel: the backdrop is not neutral-exact
    out = np.clip(a * (255.0 / low), 0, 255).astype(np.uint8)
    return Image.fromarray(out)


def motion_span(frames):
    """[first, last] sampled index where the card is actually moving."""
    lumas = [np.asarray(im.convert("L").resize((139, 104)), dtype=np.float32) for _, im in frames]
    diffs = [np.abs(lumas[i + 1] - lumas[i]).mean() for i in range(len(lumas) - 1)]
    moving = [i for i, d in enumerate(diffs) if d > MOTION_THR]
    if not moving:
        sys.exit("no motion found — MOTION_THR too high?")
    return moving[0], moving[-1] + 1


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
        print("capturing at playbackRate 0.25, sampling %d fps by mediaTime ..." % OUT_FPS)
        sampled = capture()
    finally:
        srv.shutdown()

    if not sampled:
        sys.exit("no frames captured")
    vw, vh = sampled[0][1].size
    lo, hi = motion_span(sampled)
    keep = sampled[max(0, lo - 1):min(len(sampled), hi + 2)]   # one resting frame each side
    print("  sampled %d frames (%.2fs), motion spans samples %d..%d -> keeping %d (%.2fs..%.2fs)"
          % (len(sampled), sampled[-1][0], lo, hi, len(keep), keep[0][0], keep[-1][0]))

    frames = [whiten(im) for _, im in keep]
    n = len(frames)
    fw = int(round(DISPLAY_W * RETINA))
    fh = int(round(fw * vh / vw))
    rows = math.ceil(n / COLS)
    print("  %d frames at %dx%d -> cells %dx%d, grid %dx%d = %dx%d px"
          % (n, vw, vh, fw, fh, COLS, rows, COLS * fw, rows * fh))

    sheet = Image.new("RGB", (COLS * fw, rows * fh), (255, 255, 255))
    for i, im in enumerate(frames):
        sheet.paste(im.resize((fw, fh), Image.LANCZOS), ((i % COLS) * fw, (i // COLS) * fh))
    sheet.save(OUT, "WEBP", quality=QUALITY, method=6)
    print("  wrote %s  %.2f MB" % (OUT.relative_to(PROJECT), OUT.stat().st_size / 1e6))

    disp_h = round(DISPLAY_W * vh / vw, 2)
    print("\npaste into styles.css / main.js:")
    print("  #sm-flip   width: %spx; height: %spx;   (the video's aspect, %.4f)"
          % (DISPLAY_W, disp_h, vw / vh))
    print("  #sm-sheet  width: %spx;   (= %d cols x %s)" % (round(COLS * DISPLAY_W, 2), COLS, DISPLAY_W))
    print("  FLIP_FRAMES = %d, FLIP_COLS = %d" % (n, COLS))
    print("  FLIP_CELL_W = %s, FLIP_CELL_H = %s * %d / %d" % (DISPLAY_W, DISPLAY_W, vh, vw))
