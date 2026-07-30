#!/usr/bin/env python3
"""Rebuild the four UPRIGHT Scene-19 satellites from `assets/Scene 19/*.png`.

These are the only satellites the design hands over as plain node exports, so the build
is a 1:1 PNG -> WebP re-encode — no resize, no matte, no rotation. The resting rotations
(-5 / +10 / -16 / +16.5 deg) are re-applied by main.js's `sats` table, which is why the
art must stay upright. The two merch tiles are NOT here: their rotation is baked into the
bitmap and they come out of the dual-source matte instead (see tools/export-assets.md).

What this script is really for is the SECOND half: the stage box. When the art changes
height — and it has, twice — the box cannot just keep its old numbers, because
`#sats img` has no `object-fit` and a stale box stretches the card. But it also cannot be
re-derived from the Figma node, because these four boxes are TUNED: the fan was widened
+-20px past the storyboard in 2026-07-28 so the rotated corners clear the phone bezel, so
each card sits at 88-94% of its node size. So the load-bearing registration is
`(width, centre)`, declared below:

  - the CENTRE, because main.js derives every card's s19 fly-out and s20 recede from
    `offsetLeft + offsetWidth/2` — hold it and the animation vector survives an art
    change untouched (this is the rule in tools/export-assets.md: match the centre, never
    the top-left);
  - the WIDTH, because the fan's two columns are what clear the bezel, and all four cards
    are portrait-ish, so width is the dimension the layout is actually about.

Height then follows from the art's own aspect, and `left`/`top` fall out of the centre.

Run with no arguments to check (writes nothing); `--write` to re-encode the WebPs and
print the styles.css rules to paste. The reported deltas are what changed in the art;
sub-pixel deltas on cards whose PNG did not change are export rounding, not drift, and
are left alone on purpose (nudging a box by 0.2px only invalidates a verified frame).

Do not forget the `?v=` bump in index.html after writing — browsers cache these by name.
"""
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "Scene 19"

# id -> (source PNG, stage width, stage centre x, stage centre y, current styles.css box)
SATS = {
    "sat-editorial": ("Latest Editorial.png", 266.6, 541.5,  356.05, (408.2,  144.1, 266.6, 423.9)),
    "sat-ugc":       ("UGC.png",              248.3, 1385.45, 330.5, (1261.3, 124.6, 248.3, 411.9)),
    "sat-comment":   ("UGC Comment.png",      256.1, 541.45, 860.5,  (413.4,  750.6, 256.1, 219.8)),
    "sat-video":     ("Video.png",            264.8, 1384.5, 810.55, (1252.1, 689.9, 264.8, 241.3)),
}

write = "--write" in sys.argv
rules = []

for sid, (png, w, cx, cy, cur) in SATS.items():
    src = SRC / png
    im = Image.open(src).convert("RGBA")

    # A baked shadow would double against the CSS drop-shadow on `#sats img`. Antialiasing
    # alone measures well under 1%; a real shadow is several percent.
    a = im.getchannel("A")
    px = im.width * im.height
    soft = sum(c for v, c in enumerate(a.histogram()) if 8 < v < 240) / px * 100

    h = round(w * im.height / im.width, 1)
    left, top = round(cx - w / 2, 1), round(cy - h / 2, 1)
    box = (left, top, w, h)
    delta = max(abs(b - c) for b, c in zip(box, cur))

    flag = "shadow?" if soft > 1.5 else "clean"
    print(f"{sid:<14} {im.width}x{im.height}  soft-alpha {soft:4.1f}% {flag}"
          f"   box {left} {top} {w}x{h}   delta {delta:.1f}px"
          + ("  <-- UPDATE styles.css" if delta > 0.5 else ""))

    rules.append(f"#{sid:<13} {{ left: {left}px; top: {top}px; "
                 f"width: {w}px; height: {h}px; }}")

    if write:
        dst = ROOT / "assets" / f"{sid}.webp"
        im.save(dst, "WEBP", quality=92, method=6)
        print(f"{'':<14} -> {dst.name}  {dst.stat().st_size / 1024:.1f} KB")

print("\nstyles.css:")
for r in rules:
    print("  " + r)
if not write:
    print("\n(check only — pass --write to re-encode)")
