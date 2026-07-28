#!/usr/bin/env python3
"""Rebuild assets/picker.webp (the s6 reaction tray) for the dark stage.

Why this is a composite and not a plain node export:

The tray fill is translucent with a backdrop blur, so Figma bakes whatever sits
behind it into any export. Exporting the tray node alone (1898:70619) renders it
over the frame's black background — the result is a flat dark pill that loses the
phone bleeding through its right half, which is the whole look. So instead we take
the RGB from a 2x render of the WHOLE dark Scene 06 (which has the real backdrop)
and borrow the alpha silhouette from the previous light tray asset, whose canvas
is byte-for-byte the same 1458x554 export frame. The storyboard also parks the
cursor on the tray in that scene, so its pixels get healed out afterwards.

Inputs (drop next to this script, or edit the paths):
  scene06@2x.png  — download_assets(1898:70036, png, scale 2)  -> 3840x2160
  picker-light.webp — the previous assets/picker.webp (alpha donor).
                      A copy lives in "assets/Scene 6/".
Output: picker.webp (1458x554, 2x) — drops straight into assets/, geometry
unchanged, so #picker keeps left:405 top:337 729x277. Bump the ?v= in index.html.
"""
import pathlib
import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).parent
SCENE = HERE / "scene06@2x.png"
DONOR = HERE / "picker-light.webp"
OUT = HERE / "picker.webp"

# the tray's export frame within the scene, in 2x px = stage (405, 337) * 2
CROP = (810, 674, 810 + 1458, 674 + 554)
# baked cursor: the band of tray below the reaction icons that the arrow crosses
HEAL = (316, 470, 257, 292)          # x0, x1, y0, y1
HEAL_REF = (300, 255)                # a clean column + row to lift the gradient from

rgb = np.array(Image.open(SCENE).convert("RGB").crop(CROP)).astype(np.int32)
alpha = np.array(Image.open(DONOR).convert("RGBA"))[:, :, 3].astype(np.int32)

# heal: keep the tray's horizontal gradient (row REF) and add the clean vertical
# profile (column REF) on top, so the patch matches its surroundings both ways
x0, x1, y0, y1 = HEAL
xref, yref = HEAL_REF
profile = rgb[y0:y1, xref] - rgb[yref, xref]
rgb[y0:y1, x0:x1] = np.clip(rgb[yref, x0:x1][None, :, :] + profile[:, None, :], 0, 255)

# the donor's soft baked shadow tops out around alpha 63 — lift the pill+tail out
# of it while keeping the edge antialiasing
silhouette = np.clip((alpha - 64) * 2, 0, 255)

Image.fromarray(np.dstack([rgb, silhouette]).astype("uint8")).save(
    OUT, "WEBP", quality=95, method=6
)
print("wrote", OUT)
