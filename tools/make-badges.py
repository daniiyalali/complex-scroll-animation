#!/usr/bin/env python3
"""Rebuild the eight s22 badge overlays from the ROTATED Figma exports.

Why this script exists rather than a plain node export (read before re-exporting):

The badges are ROTATED in the Figma design — 8.3, 14.2, 0, 21.9, 12.3, 17.6, 0 and 29.7
degrees respectively. The first exports (`assets/Scene 21/Badge 0N.png`) were taken with the
rotation reset, so they held the nodes' *unrotated* art, and the page then drew them at
rotation 0 with positions eyeballed to "content-center align with the old shadowed render".
That is why the pile never matched Scene 21: every badge sat at the wrong angle, at a
position derived from a guess.

`assets/General/Rotated/` holds re-exports WITH the rotation applied, so each PNG's canvas is
the node's rotated bounding box and the art can go straight onto the stage. The angle is now
baked into the bitmap, which is why the timeline still settles these to `rotation: 0` — the
tumble in `BADGE_DROP` is an EXTRA spin during the fall, on top of the baked angle.

SIZES come from the exports (canvas / 2 — they are 2x), so the art is never resampled.

POSITIONS are MEASURED off a 1920x1080 render of Scene 21 (node 1844:39703), NOT read from the
node coordinates. `get_metadata` does report x/y/w/h for nodes 1844:42148-42155 in the badges'
parent frame — which is 440x953, i.e. the phone screen at stage scale, so the units are already
in-screen stage px — and its w/h is genuinely the rotated bounding box (solve the rotation out
of it and c^2 + s^2 closes to 1.000 within rounding). But its **x/y is not where a rotated node
renders**: placing the art there left six of the eight badges up to 72px out, and only the two
unrotated badges (3 and 7) landed. Each badge was therefore located by matching its own art
against the Scene 21 render over opaque pixels only, at 1px steps. All eight now sit at
dx = dy = 0, with the match error down from ~80-100 to 6-25, and badge 4's bottom edge falls at
952.1 against the screen's 952 — the independent check that the whole set is right.

Re-measure the same way if the design moves. Do not trust the node x/y.

Run from the project root. Prints the STICKERS table to paste into main.js.
"""
import json
import pathlib
from PIL import Image

SRC = pathlib.Path("assets/General/Rotated")
OUT = pathlib.Path("assets")

# badge -> (Figma node id, node name == source filename stem, measured left, top)
BADGES = [
    (1, "1844:42148", "Screenshot 2026-07-22 at 3.48.58 PM 1", -0.17, 672.49),
    (2, "1844:42149", "image 1963", 36.89, 563.42),
    (3, "1844:42150", "Screenshot 2026-07-22 at 3.48.58 PM 5", 242.00, 775.28),
    (4, "1844:42151", "image 1965", 114.54, 789.56),
    (5, "1844:42152", "image 1964", 20.73, 760.93),
    (6, "1844:42153", "Screenshot 2026-07-22 at 3.51.49 PM 2", 284.88, 648.16),
    (7, "1844:42154", "Screenshot 2026-07-22 at 3.51.34 PM 2", 261.00, 860.28),
    (8, "1844:42155", "Screenshot 2026-07-22 at 3.52.10 PM 2", 148.04, 567.81),
]


def norm(s):
    """macOS names screenshots with U+202F (narrow no-break space) before PM while the Figma
    node name uses a plain space. Match on collapsed whitespace so either form resolves."""
    return " ".join(s.replace(" ", " ").replace(" ", " ").split())


FILES = {norm(p.stem): p for p in SRC.iterdir() if p.suffix.lower() == ".png"}

rows, manifest = [], {}
for n, node, stem, left, top in BADGES:
    src = FILES.get(norm(stem))
    if src is None:
        raise SystemExit(f"badge {n}: no export matching {stem!r} in {SRC}/ — have {sorted(FILES)}")
    im = Image.open(src).convert("RGBA")
    ew, eh = im.width / 2, im.height / 2            # stage px — exports are 2x
    dst = OUT / f"sticker-{n}.webp"
    im.save(dst, "WEBP", quality=92, method=6)
    rows.append((n, left, top, round(ew, 2), round(eh, 2)))
    manifest[f"sticker-{n}"] = {
        "file": dst.name, "w": round(ew, 2), "h": round(eh, 2),
        "figmaNodeId": node, "scale": 2,
        "screenPos": [left, top],
        "source": f"General/Rotated/{stem}.png",
        "note": "ROTATED export — the node's rotation is baked into the bitmap, so the page "
                "draws it at rotation 0. In-screen stage px, MEASURED off a render of Scene 21 "
                "(node 1844:39703) rather than read from the node x/y, which is not where a "
                "rotated node renders. Rebuild with tools/make-badges.py",
    }
    print(f"  sticker-{n}.webp  {im.width}x{im.height} -> {ew:7.2f} x {eh:7.2f} "
          f"at ({left:7.2f}, {top:7.2f})   {dst.stat().st_size / 1024:6.1f} KB")

print("\nconst STICKERS = [")
for i in range(0, 8, 4):
    print("  " + " ".join(f"[{l}, {t}, {w}, {h}]," for _, l, t, w, h in rows[i:i + 4]))
print("];")

mf = pathlib.Path("assets/manifest.json")
data = json.loads(mf.read_text())
data["assets"].update(manifest)
mf.write_text(json.dumps(data, indent=1) + "\n")
print(f"\nmanifest.json updated for {len(manifest)} badges")
