#!/usr/bin/env python3
"""Rebuild the four XP toasts (assets/toast-{20,30,80,120}.webp).

These are NOT plain node exports — read this before re-exporting them.

The toasts are the one overlay group still carrying a BAKED soft shadow (there is
no `#toasts` rule in the styles.css drop-shadow block), and they are positioned by
their 440x299 *render box* at 0,0 in the phone screen, not by their content box. So
a rebuild has to land the pill on exactly the same canvas or every toast shifts.

Neither Figma render path gives that asset on its own:

  * `download_assets` at scale 2 gives the right 880x598 canvas and exact content
    RGB, but renders fully OPAQUE — the phone screen's light background and its
    rounded top corners are baked in (this is gotcha 2 in export-assets.md).
  * `get_screenshot` with `contentsOnly: true` renders properly transparent with the
    soft shadow intact, but only ever at 1x (maxDimension will not upscale).

So this script combines them: content RGB from the 2x opaque export, alpha from the
1x transparent render. The pill's own coverage is re-derived analytically from its
rounded-rect geometry so the edge stays crisp at 2x, and the shadow is solved out of
the 1x alpha (`s = (a - m) / (1 - m)`) before being upscaled — a blurred field
survives that, a hard edge would not.

toast-20 needs one extra step: its Figma node (1838:113166) has no drop shadow and
no 440x299 render box any more, so there is no shadow to lift. A pill's drop shadow
is translation-invariant along its straight middle, so toast-20's shadow is SPLICED
from toast-30's by inserting plateau columns at the centre. Verified against the two
widths that do have exports: predicting toast-80 (291px) and toast-120 (309px) from
toast-30 (293px) lands within 0.25/255 mean, 11/255 max.

All four pills are CENTRED in the 440px screen: `x = (440 - width) / 2`. They used to
sit at a shared left edge of x=85, which was centre while the old speech-bubble art
made them 267-291 wide — the taller, wider coin grew every pill rightward and pushed
them all off centre (user caught it, 2026-07-29). Centring is also what Figma's own
toast-20 node now does: its x=62 is exactly (440-316)/2.

Because the source renders all have the pill at x=85, the shadow is lifted at 85 and
then shifted. The shift is a half-pixel at 1x for three of the four, so it is applied
AFTER the 1x -> 2x upscale, where every offset is a whole pixel (-46/-23/-21/-39).
It costs the outermost ~23px of the shadow's left tail, where alpha is <= 11/255 and
which the screen's own overflow clips anyway.

Inputs (in INPUT_DIR, fetched once via the Figma MCP server; node IDs below):
    op-<n>.png   download_assets, defaultFormat png, defaultScale 2
    co-<n>.png   get_screenshot, contentsOnly true
Re-fetch both for a toast whose design changed, then re-run. Bump the `?v=` on that
toast's src in index.html afterwards — browsers cache same-name images.
"""
import sys
import numpy as np
from PIL import Image, ImageDraw

HERE = __file__.rsplit('/', 2)[0]
INPUT_DIR = f'{HERE}/assets/General/toast-src'
OUT_DIR = f'{HERE}/assets'

W, H = 440, 299          # the toasts' render box, in stage px; assets are 2x this
SS = 4                   # supersampling for the analytic pill mask
SRC_X, PILL_Y, PILL_H = 85, 48, 87    # SRC_X: where the Figma renders put the pill


def pill_x(width):
    """Centred in the screen. Always lands on a whole pixel at 2x."""
    return (W - width) / 2

# node id -> pill width, measured off each node's metadata
TOASTS = {
    '20':  dict(node='1838:113166', width=316, shadow_from='30'),
    '30':  dict(node='1838:113788', width=293),
    '80':  dict(node='1838:114592', width=291),
    '120': dict(node='1838:115423', width=309),
}


def pill_mask(width, scale, x):
    """Analytic coverage of the pill's rounded rect, at `scale`x, in [0,1]."""
    w, h = W * scale, H * scale
    x, y = x * scale, PILL_Y * scale
    pw, ph = width * scale, PILL_H * scale
    m = Image.new('L', (w * SS, h * SS), 0)
    ImageDraw.Draw(m).rounded_rectangle(
        [x * SS, y * SS, (x + pw) * SS - 1, (y + ph) * SS - 1],
        radius=ph * SS / 2, fill=255)
    return np.asarray(m.resize((w, h), Image.BOX), dtype=float) / 255.0


def shift_x(arr, dx):
    """Slide an array horizontally by a whole number of pixels, zero-filling."""
    out = np.zeros_like(arr)
    if dx == 0:
        return arr.copy()
    if dx < 0:
        out[:, :dx] = arr[:, -dx:]
    else:
        out[:, dx:] = arr[:, :-dx]
    return out


def splice_width(field, from_w, to_w):
    """Re-width a pill-shaped shadow field by adding/removing plateau columns at the
    pill's centre. Exact wherever the split column sits on the straight middle."""
    c = SRC_X + from_w // 2
    delta = to_w - from_w
    out = np.zeros_like(field)
    out[:, :c] = field[:, :c]
    if delta >= 0:
        out[:, c:c + delta] = field[:, c:c + 1]
        n = W - (c + delta)
        out[:, c + delta:] = field[:, c:c + n]
    else:
        src = field[:, c - delta:]
        out[:, c:c + src.shape[1]] = src
    return out


def shadow_1x(tag, width):
    """Solve the shadow's own alpha out of the 1x transparent render."""
    a = np.asarray(Image.open(f'{INPUT_DIR}/co-{tag}.png').convert('RGBA'),
                   dtype=float)[..., 3] / 255.0
    if a.shape[:2] != (H, W):
        raise SystemExit(f'co-{tag}.png is {a.shape[1]}x{a.shape[0]}, expected {W}x{H}')
    m = pill_mask(width, 1, SRC_X)
    s = np.zeros_like(a)
    free = m < 0.5                      # where the pill is not covering, s is solvable
    s[free] = np.clip((a[free] - m[free]) / (1.0 - m[free]), 0.0, 1.0)
    return s


def content_2x(tag, width, x):
    """The pill's RGB at 2x, landed at `x` and with the edge colour extended outward so
    masking cannot drag the export's light background in as a fringe."""
    im = Image.open(f'{INPUT_DIR}/op-{tag}.png').convert('RGB')
    if im.size == (W * 2, H * 2):
        rgb = shift_x(np.asarray(im, dtype=float), int(round((x - SRC_X) * 2)))
    elif im.size == (width * 2, PILL_H * 2):
        # toast-20 exports as the bare pill — place it on the shared canvas
        canvas = Image.new('RGB', (W * 2, H * 2), (0, 0, 0))
        canvas.paste(im, (int(x * 2), PILL_Y * 2))
        rgb = np.asarray(canvas, dtype=float)
    else:
        raise SystemExit(f'op-{tag}.png is {im.size[0]}x{im.size[1]}, unexpected')

    solid = pill_mask(width, 2, x) > 0.98
    for _ in range(3):                  # nearest-neighbour dilate into the edge band
        nb = np.zeros_like(rgb)
        cnt = np.zeros(rgb.shape[:2])
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            sh = np.roll(np.where(solid[..., None], rgb, 0.0), (dy, dx), (0, 1))
            shs = np.roll(solid, (dy, dx), (0, 1)).astype(float)
            nb += sh
            cnt += shs
        grow = (~solid) & (cnt > 0)
        rgb[grow] = (nb[grow] / cnt[grow][:, None])
        solid = solid | grow
    return rgb


def build(tag, spec):
    width = spec['width']
    x = pill_x(width)
    dx2 = int(round((x - SRC_X) * 2))               # whole pixels at 2x by construction
    if dx2 / 2 != x - SRC_X:
        raise SystemExit(f'toast-{tag}: centring by {x - SRC_X}px is not a whole 2x pixel')

    donor = spec.get('shadow_from', tag)
    s1 = shadow_1x(donor, TOASTS[donor]['width'])
    if donor != tag:
        s1 = splice_width(s1, TOASTS[donor]['width'], width)

    # the shadow is a smooth blurred field, so 1x -> 2x costs nothing; the centring shift
    # goes AFTER the upscale, where a half-pixel at 1x is a whole pixel here
    s2 = np.asarray(Image.fromarray((np.clip(s1, 0, 1) * 255).astype(np.uint8))
                    .resize((W * 2, H * 2), Image.LANCZOS), dtype=float) / 255.0
    s2 = shift_x(np.clip(s2, 0.0, 1.0), dx2)

    m2 = pill_mask(width, 2, x)
    a = m2 + (1.0 - m2) * s2                          # pill over its own shadow
    premul = m2[..., None] * content_2x(tag, width, x)  # the shadow itself is pure black
    with np.errstate(invalid='ignore', divide='ignore'):
        rgb = np.where(a[..., None] > 1e-4, premul / np.maximum(a[..., None], 1e-4), 0.0)

    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    path = f'{OUT_DIR}/toast-{tag}.webp'
    Image.fromarray(out).save(path, 'WEBP', quality=92, method=6)
    print(f'toast-{tag:<4} {width}x{PILL_H} pill @ ({x},{PILL_Y})  '
          f'gaps {x:g}/{W - x - width:g}  ->  {path}')


if __name__ == '__main__':
    only = sys.argv[1:] or list(TOASTS)
    for tag in only:
        build(tag, TOASTS[tag])
