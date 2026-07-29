#!/usr/bin/env python3
"""Rebuild `assets/id-card.webp` — the Complex I.D. card that opens in s22 and expands in s21.

Two sources, because neither alone is enough (read before re-exporting):

* `assets/General/Jordan Rose ID.png` (2815x1689) is the user's **2x** render of Figma node
  1878:63616 "Jordan Rose ID". It is a presentation render: the card sits on a baked grainy
  dark background with a baked drop shadow, and the shadow spreads down and sideways but NOT
  upward, which is why the card's top edge is flush with y=0. It is not clipped — that misread
  cost time. The card occupies (468, 0) 1880x1218 inside it.
* The MCP `get_screenshot` render of the same node with `contentsOnly` has real alpha but comes
  back at 1x only (1408x845; asking for maxDimension 2814 still returns 1x). Its opaque card
  rect is (234, 0) 940x609 — i.e. the node's own box — and the corner radius measures ~11px.

So: take the pixels from the 2x PNG and the ALPHA from the 1x render, upscaled. That gives a
shadow-free card at 2x with the design's true rounded corners, instead of either a soft 1x card
or a 2x card with dark corners cut out of the baked background. The CSS drop-shadow in the
marked block at the bottom of styles.css supplies the shadow, per the project rule.

GEOMETRY — the card's expanded box is the VIDEO's first frame, not the Figma node's box.
`assets/General/Jordan Rose ID Video.mp4` (1280x720) takes over frame-by-frame after the card
blows up, so the two have to coincide or the handover jumps. Measured on frame 0: the card
including its vertical strip spans x 311-949, y 194-589 = 639x396. The video is exactly 16:9,
so at full stage (x1.5) that is **466.5, 291, 958.5 x 594**.

Note the video's card is the GOLD/slabbed 5000-PTS variant in a clear case, and its aspect is
1.6136 against the static card's 1.5452 — so fitting the art to the video's box stretches it
1.9% wider and 2.5% shorter. That is deliberate: matching the box is what makes the morph
seamless, and the user's call was that the colour difference is expected.

Run from the project root.
"""
import json
import pathlib
from PIL import Image

SRC2X = pathlib.Path("assets/General/Jordan Rose ID.png")   # 2x pixels, baked bg + shadow
SRC1X = pathlib.Path("shots/card-1x.png")                   # 1x, real alpha (MCP contentsOnly)
DST = pathlib.Path("assets/id-card.webp")

CARD_2X = (468, 0, 468 + 1880, 0 + 1218)     # card rect inside the 2x render
CARD_1X = (234, 0, 234 + 940, 0 + 609)       # same card in the 1x alpha render

# expanded box on stage == the video's first frame (see docstring)
STAGE = dict(left=466.5, top=291.0, width=958.5, height=594.0)
SMALL_NODE = (749, 359, 422, 251)            # Figma's small-card node 1844:42327 — centre only

if not SRC1X.exists():
    raise SystemExit(f"{SRC1X} missing — re-fetch it with the Figma MCP:\n"
                     "  get_screenshot(nodeId='1878:63616', contentsOnly=True, maxDimension=2814)\n"
                     "then curl the returned URL to that path.")

rgb = Image.open(SRC2X).convert("RGBA").crop(CARD_2X)
alpha = Image.open(SRC1X).convert("RGBA").split()[3].crop(CARD_1X).resize(rgb.size, Image.LANCZOS)
card = Image.new("RGBA", rgb.size)
card.paste(rgb, (0, 0))
card.putalpha(alpha)
card.save(DST, "WEBP", quality=94, method=6)

w, h = card.size
print(f"  {DST}  {w}x{h} (2x)  {DST.stat().st_size/1024:.1f} KB   art aspect {w/h:.4f}")

cx = STAGE["left"] + STAGE["width"] / 2
cy = STAGE["top"] + STAGE["height"] / 2
sx, sy, sw, sh = SMALL_NODE
scx, scy = sx + sw / 2, sy + sh / 2
sc = sw / STAGE["width"]
print(f"\n  styles.css  #id-card {{ left: {STAGE['left']}px; top: {STAGE['top']}px; "
      f"width: {STAGE['width']}px; height: {STAGE['height']}px; }}")
print(f"     expanded box = the video's frame 0 card, aspect {STAGE['width']/STAGE['height']:.4f}")
print(f"     art is {w/h:.4f}, so it is fitted: {100*(STAGE['width']/(w/2)-1):+.1f}% wide, "
      f"{100*(STAGE['height']/(h/2)-1):+.1f}% tall")
print(f"\n  main.js   const ID_SMALL_SC = {sw} / {STAGE['width']};   // = {sc:.6f}")
print(f"            const ID_SMALL_X  = {scx - cx:.2f};")
print(f"            const ID_SMALL_Y  = {scy - cy:.2f};")
print(f"     expanded centre ({cx}, {cy})  ->  small centre ({scx}, {scy}) = Figma node 1844:42327")

mf = pathlib.Path("assets/manifest.json")
data = json.loads(mf.read_text())
data["assets"]["id-card"] = {
    "file": DST.name, "w": STAGE["width"], "h": STAGE["height"],
    "stage": [STAGE["left"], STAGE["top"]], "scale": 2,
    "figmaNodeId": "1878:63616",
    "source": "General/Jordan Rose ID.png (2x pixels) + MCP contentsOnly render (alpha)",
    "note": "Complex I.D. card, black strip. The STAGE BOX is the first frame of "
            "General/Jordan Rose ID Video.mp4 (card incl. strip, 639x396 of 1280x720, x1.5), "
            "not the Figma node box, because the video takes over frame-by-frame after the s21 "
            "blow-up and the two must coincide. Rebuild with tools/make-id-card.py",
}
mf.write_text(json.dumps(data, indent=1) + "\n")
print("\n  manifest.json updated for id-card")
