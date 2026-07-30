#!/usr/bin/env python3
"""SUPERSEDED 2026-07-30, the same day it was written: the s19.3 flip is now the designer's
VIDEO as a sprite sheet — see tools/make-flip-frames.py, which replaced the coded CSS flip
these two faces were built for. `flip-regular.webp` / `flip-bronze.webp` are retired (kept
in git, `.vercelignore`d). This stays as the record of the face-registration method, which
is what to reach for if the flip ever goes back to flat art.

Build the two s19.3 flip faces from the designer's `assets/card animation/` PNGs.

The s19.3 status modal turns Martin Hen's REGULAR card into his BRONZE card with one
180° rotateY half-turn (`#sm-card` in main.js): Regular is the front face, Bronze is the
pre-rotated BACK. The flip only reads as ONE card upgrading if the two faces REGISTER — same content box, same scale, same centre — because any
misregistration shows up as a jump the moment the Bronze back swings into view. Same reasoning as the s23 case fit (make-gold-card.py):
registration is the deliverable, the re-encode is incidental.

The sources land already matched: both PNGs carry the same 1267px-wide solid content
(card body + clear case + COMPLEX tab), just parked a few px differently inside their
canvases (card 1 sits at x3,y5 in 1270x924; card 2 at x1,y0 in 1270x920). So the
registration that survives an art change is: crop each to its own SOLID-alpha bbox
(threshold 200 — the case's translucent edge adds at most 2px at lower thresholds, and
cutting it identically on both faces cannot misregister anything) and resize both crops
to the SAME output box. Content heights differ by 1px (919 vs 918), which the shared box
absorbs as ~0.1% of aspect — invisible, and it buys exact face-on-face registration.

The output box is 2x the stage box, and the stage box is Figma's own `image 2231` node
in Scene 19.3 (2126:11248 -> 2190:64227): stage (730, 423.5) 460x333.2, so the WebPs are
920x667. Figma's placed image is inset-cropped ~1.5-4% and very slightly anisotropic —
that is the artifact of a padded intermediate export, NOT a spec; the node BOX is the
spec, and both aspects (source content 1.3786, box 1.3804) agree to 0.13%.

The PNGs' alpha is kept as-is: the clear case's soft translucency IS content here, and
there is no baked drop shadow to strip (corner alpha is 0, no >bbox spread). #sm-flip
gets no CSS filter either — a filter on the perspective wrapper or the preserve-3d card
would FLATTEN the 3D (CSS grouping), which is a hard constraint, not a taste choice.

Run bare to measure, `--write` to build. Bump the `?v=` on both URLs in index.html if
the art changes under the same filenames.
"""
import pathlib
import sys

import numpy as np
from PIL import Image

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = PROJECT / "assets" / "card animation"
OUT = PROJECT / "assets"

SOLID = 200          # alpha threshold: the card/case/tab, minus antialiasing fuzz
BOX_W, BOX_H = 920, 667   # 2x of the Figma node box 460x333.228

CARDS = [
    ("card 1.png", "flip-regular.webp"),   # 800 PTS / Regular — the face the modal opens on
    ("card 2.png", "flip-bronze.webp"),    # 1000 PTS / Bronze — what the flip reveals
]


def solid_bbox(alpha):
    ys, xs = np.where(alpha >= SOLID)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def main():
    write = "--write" in sys.argv
    for src_name, out_name in CARDS:
        im = Image.open(SRC / src_name).convert("RGBA")
        x0, y0, x1, y1 = solid_bbox(np.asarray(im)[:, :, 3])
        crop = im.crop((x0, y0, x1, y1))
        print(f"{src_name}: {im.size[0]}x{im.size[1]}, solid bbox ({x0},{y0})..({x1},{y1}) "
              f"= {x1-x0}x{y1-y0} (aspect {(x1-x0)/(y1-y0):.4f} vs box {BOX_W/BOX_H:.4f})")
        if write:
            out = crop.resize((BOX_W, BOX_H), Image.LANCZOS)
            out.save(OUT / out_name, "WEBP", quality=90, method=6)
            kb = (OUT / out_name).stat().st_size / 1024
            print(f"  -> {out_name} {BOX_W}x{BOX_H} ({kb:.0f} KB)")
    if not write:
        print("dry run — pass --write to build")


if __name__ == "__main__":
    main()
