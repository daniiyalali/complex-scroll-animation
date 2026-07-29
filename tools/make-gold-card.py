#!/usr/bin/env python3
"""Rebuild `assets/gold-card.webp` — the ENCASED Complex I.D. that s23 wraps around the card.

Source: `assets/General/Jordan Rose Id Wrapped.png` (2164x1612, already transparent outside the
case). It replaced a render that was a **different revision on a white background**: light/white
case, and a different photo entirely (a "Saints" bucket hat, gold chain, different face angle).
On a black stage that read as a white slab, and it was not the person whose I.D. the reader just
opened. The new one is dark-cased on transparency with Jordan Rose's actual photo — the same
subject as `id-card.webp` and as the ending video.

GEOMETRY — the element is placed so the case's INNER CARD lands exactly on `#id-card`'s box.
That is what lets s23 keep the plain card on screen and wrap it, instead of fading one card out
and popping a different one in. It works because the two assets are the same card at the same
pixel scale: the inner card measures 1899x1218 here against `id-card.webp`'s 1880x1218.

Measured on this asset: the case fills the canvas (0,4 2164x1608) and the inner card, including
its gold strip, is at (121,290) 1899x1218. `#id-card`'s stage box is 466.5,291 958.5x594 (the
video's frame 0 — see tools/make-id-card.py), so:

    sx = 958.5/1899   sy = 594/1218
    left = 466.5 - 121*sx      top = 291 - 290*sy
    width = 2164*sx            height = 1612*sy

The fit is slightly anisotropic (sx/sy differ by 3.4%) because the inner card's aspect is 1.5591
against the box's 1.6136. Registering the CARD is what matters — it is the thing the reader is
already looking at — so that difference is absorbed by the case, which has no alignment
obligation to anything.

Run from the project root.
"""
import json
import pathlib
from PIL import Image

SRC = pathlib.Path("assets/General/Jordan Rose Id Wrapped.png")
DST = pathlib.Path("assets/gold-card.webp")

INNER = (121, 290, 1899, 1218)          # inner card (incl. gold strip) inside SRC
ID_BOX = (466.5, 291.0, 958.5, 594.0)   # #id-card's stage box == the video's frame 0

im = Image.open(SRC).convert("RGBA")
im.save(DST, "WEBP", quality=92, method=6)

iw, ih = im.size
ix, iy, icw, ich = INNER
bx, by, bw, bh = ID_BOX
sx, sy = bw / icw, bh / ich
left, top = bx - ix * sx, by - iy * sy
width, height = iw * sx, ih * sy

print(f"  {DST}  {iw}x{ih} (2x)  {DST.stat().st_size/1024:.1f} KB")
print(f"\n  styles.css  #gold-card {{ left: {left:.2f}px; top: {top:.2f}px; "
      f"width: {width:.2f}px; height: {height:.2f}px; }}")
print(f"     inner card lands on {bx},{by} {bw}x{bh} = #id-card's box, so s23 wraps the card "
      f"already on screen")
print(f"     scale sx {sx:.5f} / sy {sy:.5f} (anisotropic by {100*abs(sx/sy-1):.1f}% — absorbed by the case)")
print(f"     case on stage: {left:.1f},{top:.1f} -> {left+width:.1f},{top+height:.1f}")

mf = pathlib.Path("assets/manifest.json")
data = json.loads(mf.read_text())
data["assets"]["gold-card"] = {
    "file": DST.name, "w": round(width, 2), "h": round(height, 2),
    "stage": [round(left, 2), round(top, 2)], "scale": 2,
    "source": "General/Jordan Rose Id Wrapped.png",
    "note": "The encased I.D. Replaced a different revision that had a WHITE case and a "
            "different photo. Positioned so the case's inner card (121,290 1899x1218 in the "
            "source) lands exactly on #id-card's stage box, which is why s23 can keep the plain "
            "card on screen and wrap it. Rebuild with tools/make-gold-card.py",
}
mf.write_text(json.dumps(data, indent=1) + "\n")
print("\n  manifest.json updated for gold-card")
