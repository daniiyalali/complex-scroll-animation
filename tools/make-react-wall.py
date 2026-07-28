#!/usr/bin/env python3
"""Convert the Scene 06 reaction wall GIF into assets/react-wall.webp.

Source: `assets/Scene 6/download (2).gif` — the animated 4x5 grid of 20 reactions
the user dropped into the dark Scene 06 (node 1898:70637), 800x800, 70 frames,
2330 ms loop, opaque black background.

Animated WebP is ~2.6 MB against the GIF's 7.5 MB *and* looks better: the GIF is
capped at a 256-colour palette, so its gradients carry visible dither that the WebP
does not. Pillow coalesces identical consecutive frames (70 -> 56) and folds their
durations together, so the loop still totals exactly 2330 ms — verify with the ANMF
check at the bottom, because Pillow's WebP *reader* does not expose per-frame
durations and will report None.

The wall is kept at the source's 800x800 even though it renders at 596 CSS px:
800 is all the real detail there is, and upscaling to a nominal 2x would only add
bytes. Its background stays opaque black — identical to the stage — so the 20 cells
can be sliced and staggered without any keying.
"""
import pathlib
import struct
from PIL import Image, ImageSequence

HERE = pathlib.Path(__file__).parent
SRC = HERE.parent / "assets" / "Scene 6" / "download (2).gif"
OUT = HERE.parent / "assets" / "react-wall.webp"
QUALITY = 82

src = Image.open(SRC)
frames = [f.convert("RGB").copy() for f in ImageSequence.Iterator(src)]
src.seek(0)
durations = [f.info.get("duration", 33) for f in ImageSequence.Iterator(src)]

frames[0].save(
    OUT, "WEBP", save_all=True, append_images=frames[1:],
    duration=durations, loop=0, quality=QUALITY, method=6,
)


def anmf_durations(path):
    """Read frame durations straight out of the RIFF chunks."""
    data = path.read_bytes()
    assert data[:4] == b"RIFF" and data[8:12] == b"WEBP"
    i, out = 12, []
    while i + 8 <= len(data):
        tag = data[i:i + 4]
        size = struct.unpack("<I", data[i + 4:i + 8])[0]
        if tag == b"ANMF":
            p = i + 8
            out.append(data[p + 12] | (data[p + 13] << 8) | (data[p + 14] << 16))
        i += 8 + size + (size & 1)
    return out


got = anmf_durations(OUT)
print(f"wrote {OUT.name}: {OUT.stat().st_size // 1024} KB, "
      f"{len(frames)} source frames -> {len(got)} encoded, "
      f"{sum(got)} ms (source {sum(durations)} ms)")
assert sum(got) == sum(durations), "loop length changed — do not ship this"
