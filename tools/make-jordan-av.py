"""Build Jordan Rose's profile picture for the fandom page's UGC posts.

`.up-av img` carries NO border-radius (verified in pages/fandom.html) — the circle is
baked into the avatar's ALPHA, which is how the existing avatars are built. RGB keeps the
full square photo UNDERNEATH the transparent ring so any later downscale resamples real
pixels at the circle's edge instead of undefined ones (a straight-alpha resize would
otherwise pull a halo in).

Two outputs, because the page is generated:
  * a 512px master PNG into the All Hands build, which is the source tools/make-page-assets.py
    imports from — without it, the next import would revert this change;
  * the 73px WebP the prototype actually fetches, byte-identical in settings to what that
    importer produces: ceil(32px * 440/390 * 2) = 73, q95 + lossless alpha (it has alpha).
"""
import pathlib

from PIL import Image, ImageDraw

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = PROJECT / 'assets/General/Jordan Rose'          # the user's drop, no file extension
ALLHANDS = PROJECT.parent / '10. My Complex All Hands'

# Square crop, judged at the TRUE 32px the avatar renders at, not zoomed. The source is a
# full-body-ish shot: fitting the whole bucket hat in leaves the face a small dark smudge at
# that size, so this crops into the hat's crown and lets the brim, sunglasses and beard do the
# identifying — the same features the I.D. card photo leads with. Left edge stays right of
# x=310 so the pale pink poster behind his shoulder never enters the circle.
CROP_S, CROP_CX, CROP_CY = 1150, 900, 1000
MASTER = 512
WANT = 73                      # ceil(32 * 440/390 * 2), the importer's own rule


def circled(size):
    im = Image.open(SRC).convert('RGB')
    x0, y0 = CROP_CX - CROP_S // 2, CROP_CY - CROP_S // 2
    im = im.crop((x0, y0, x0 + CROP_S, y0 + CROP_S)).resize((size, size), Image.LANCZOS)
    m = Image.new('L', (size * 8, size * 8), 0)
    ImageDraw.Draw(m).ellipse([0, 0, size * 8 - 1, size * 8 - 1], fill=255)
    im.putalpha(m.resize((size, size), Image.BOX))
    return im


master = ALLHANDS / 'assets/jordan-rose.png'
circled(MASTER).save(master, 'PNG')

out = PROJECT / 'pages/assets/jordan-rose.webp'
circled(WANT).save(out, 'WEBP', quality=95, method=6, alpha_quality=100)

for p in (master, out):
    im = Image.open(p)
    print(f'{im.size[0]:>4}x{im.size[1]:<4} {im.mode:5} {p}')
