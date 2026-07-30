#!/usr/bin/env python3
"""Solve `POS.<page>.<scene>` by REGISTERING the live page against the storyboard render.

Why this exists: the scroll offsets in main.js's `POS` table are the one set of numbers that
cannot be read off a Figma node. They say how far a live page is translated inside the phone
screen at each scene, and the live page is not the storyboard's flat export — it has its own
section heights. Historically they were derived by scaling the old strip's deltas by a height
ratio and then checking by eye, which held only until the page changed. On 2026-07-30 the
fandom page was rebuilt (a whole new shop-grid section landed mid-feed) and every offset
below it silently pointed at the wrong post.

The method here is the one the s22 badges already use, and for the same reason: match the art
against a RENDER OF THE SCENE rather than trusting coordinates. For each scene we crop the
phone screen out of the 1920x1080 storyboard frame, render the live page at a range of
candidate offsets, and score each one. The winner is the offset whose content lines up.

Three details make the score trustworthy:
  * **Score on a HORIZONTAL PROFILE, not raw pixels.** The live page and the Figma frame are
    the same layout but not the same rasteriser — text hinting, image resampling and the odd
    revised photo differ everywhere at the pixel level, so a plain difference is dominated by
    noise that does not move with the offset. Collapsing each row to its mean luminance keeps
    exactly the signal we are solving for (where the horizontal bands — post edges, rules, ad
    slabs, image blocks — sit vertically) and throws away the rest.
  * **Capture ONE tall strip and slide the window over it in numpy** — do not screenshot the
    page once per candidate offset. Scrolling per candidate looks obvious and is a trap: with
    `zoom` on the root, `scrollHeight` is already post-zoom while `scrollTo` is not, so the
    conversion gets applied twice and every offset comes back plausible and wrong (measured:
    s20 off by ~700px, with a confident-looking 33x score). A single full-page shot has no
    scroll coordinates in it at all, and the slide is then exact at 1px for free.
  * **Normalise per window.** Compare each candidate window's own standardised profile, so a
    dark band (an ad slab, a photo) cannot win on brightness alone.

The offsets are reported in STAGE px (the 440-wide screen space), which is what `POS` holds —
the `.page` wrapper carries the translateY unzoomed, so no 1.128205 conversion is needed here.
A confidence figure comes back with each: the winning score against the median score. Under
about 1.5x, treat the answer as unregistered and check the crop by eye before trusting it.

    python3 tools/derive-page-offsets.py                 # all known scenes
    python3 tools/derive-page-offsets.py s19 s20         # just these

Reference frames are expected as `<REFS>/ref-<scene>.png`, full-frame 1920x1080 exports of
the storyboard scene (`get_screenshot` at maxDimension 1920). Pass --refs to point elsewhere.
"""
import pathlib
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

PROJECT = pathlib.Path(__file__).resolve().parent.parent
REFS = PROJECT / "shots" / "refs"

# The phone screen in stage px — #phone at (740,64) 440x952, and #screen is inset 0.
SCREEN = (740, 64, 440, 952)
PHONE_ZOOM = 440 / 390

# scene -> (page file, page zoom). Only in-phone pages need the zoom.
SCENES = {
    "s17": ("fandom.html", PHONE_ZOOM),
    "s18": ("fandom.html", PHONE_ZOOM),
    "s19": ("fandom.html", PHONE_ZOOM),
    "s19_1": ("fandom.html", PHONE_ZOOM),
    "s19_2": ("fandom.html", PHONE_ZOOM),
    # no s19_3: the page deliberately does not move under the STATUS UNLOCKED sheet — the
    # level-up plays over 19.2's own frame (user's call, 2026-07-30). It solved at -3665
    # (ref-s19_3.png) if the design ever insists on Figma's framing.
    "s20": ("fandom.html", PHONE_ZOOM),
}


def rowmeans(img):
    """Row-mean luminance — the vertical band signature, minus the rasteriser noise."""
    return np.asarray(img.convert("L"), dtype=np.float32).mean(axis=1)


def norm(p):
    return (p - p.mean()) / (p.std() + 1e-6)


def main():
    want = [a for a in sys.argv[1:] if not a.startswith("--")] or list(SCENES)
    refs = REFS
    if "--refs" in sys.argv:
        refs = pathlib.Path(sys.argv[sys.argv.index("--refs") + 1])

    x, y, w, h = SCREEN
    targets = {}
    for s in want:
        p = refs / f"ref-{s}.png"
        if not p.exists():
            print(f"  {s}: no reference at {p} — skipped")
            continue
        im = Image.open(p)
        if im.size != (1920, 1080):
            im = im.resize((1920, 1080), Image.LANCZOS)
        targets[s] = norm(rowmeans(im.crop((x, y, x + w, y + h))))
    if not targets:
        return

    import io

    with sync_playwright() as p:
        b = p.chromium.launch()
        # Render the page the way the prototype does: authored 390 wide, zoomed to 440, so the
        # rasterisation matches the iframe's rather than being a resample of a 390px shot.
        pg = b.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
        page_file = SCENES[want[0]][0]
        pg.goto(f"http://localhost:8321/pages/{page_file}", wait_until="load")
        pg.add_style_tag(content=f"html {{ zoom: {PHONE_ZOOM}; }}")
        pg.wait_for_timeout(1200)
        for yy in range(0, pg.evaluate("() => document.body.scrollHeight"), 600):
            pg.evaluate("(y) => window.scrollTo(0, y)", yy)          # wake every lazy image
            pg.wait_for_timeout(40)
        pg.evaluate("() => window.scrollTo(0, 0)")
        pg.wait_for_timeout(1200)
        strip = Image.open(io.BytesIO(pg.screenshot(full_page=True)))
        b.close()

    if strip.width != w:
        strip = strip.resize((w, round(strip.height * w / strip.width)), Image.LANCZOS)
    col = rowmeans(strip)
    limit = len(col) - h
    print(f"page {page_file}: strip {strip.width}x{strip.height} stage px, "
          f"offset range 0..{limit}\n")

    for s, tgt in targets.items():
        scores = np.array([float(np.dot(norm(col[o:o + h]), tgt) / h)
                           for o in range(limit + 1)])
        off = int(scores.argmax())
        top = float(scores[off])
        conf = top / (abs(float(np.median(scores))) + 1e-6)
        # runner-up outside +-40px, so a genuinely ambiguous page says so
        mask = np.ones_like(scores, dtype=bool)
        mask[max(0, off - 40):off + 41] = False
        second = float(scores[mask].max()) if mask.any() else 0.0
        print(f"  {s:<6} POS = {-off:>6}   score {top:.3f}  next-best {second:.3f}  "
              f"conf {conf:5.1f}x  {'OK' if top > 0.5 and top - second > 0.05 else 'LOW — check by eye'}")


if __name__ == "__main__":
    main()
