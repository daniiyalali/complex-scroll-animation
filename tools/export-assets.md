# Re-exporting assets when the Figma design changes

## ⚠ The feed strips and nav bars are RETIRED (2026-07-29)

The four strip exports and the three nav-bar images are **no longer used**. The phone and the
two side slabs now hold the **live product pages** from `../10. My Complex All Hands/`,
imported by `tools/make-page-assets.py` into `pages/` — see CLAUDE.md. Do not re-export the
nodes below expecting them to appear on the page; they will not. They are kept in git as
source material and as the record of what the storyboard's framing was measured against, and
`.vercelignore` keeps them out of the deploy.

**To change what the phone shows, change the page** in the All Hands build and re-run
`tools/make-page-assets.py`. Then re-derive the affected `POS` offsets — the pages' content
lengths do not match the strips', and they will not match each other's between versions
either. The method that works: take the storyboard's cursor tip for the beat and solve for the
offset that puts the target under it. `-159`-style arithmetic shifts only hold near a page's
top; deeper down they put scenes on the wrong content entirely (this happened — see HANDOFF).

All visuals come from the Figma file **Fandom x My Complex**
(`https://www.figma.com/design/0Wn6kFfKuKalOCTev3uUjA/...`, storyboard canvas `1838:87183`).
`assets/manifest.json` maps every asset → its Figma node ID (and, since the 2026-07-28
refresh, a `source` field pointing at the raw export it came from). To update one asset
after a design change: re-export that node at **2×, shadow-free**, convert to WebP with the
same filename, and **bump that asset's `?v=` cache-buster** in `index.html` (or `buildDom`
in `main.js` for emoji/sticker srcs) — browsers cache same-name images across sessions.
Positions only change if the layout itself moves.

**Some assets are NOT plain node exports.** Do not re-export them from Figma; run their
script and read the docstring first:

| Asset | Script | Why |
|---|---|---|
| `picker.webp` (s6 tray) | `tools/make-picker-dark.py` | Translucent + backdrop-blurred, so Figma bakes the backdrop in. An isolated export lands on flat black and loses the phone bleeding through it. |
| `react-wall.webp` (s6 wall) | `tools/make-react-wall.py` | Animated; converted from the Scene 6 GIF, not exported as a frame. |
| `toast-{20,30,80,120}.webp` | `tools/make-toasts.py` | The one overlay group still carrying a **baked** shadow, positioned by its 440×299 render box. `download_assets` @2× has the right canvas but renders opaque (the screen's background bakes in); `get_screenshot` + `contentsOnly` is properly transparent but only ever 1×. The script combines them. toast-20's node has no shadow at all, so its shadow is spliced from toast-30's, and the pill is **centred** in the 440px screen by the script — not left at the shared x=85 the Figma nodes still use. |
| `xp-frames.webp` (s11) | `tools/make-xp-frames.py` | A sprite grid of every frame of the Scene 11 video. The video **cannot be seeked**, so this is not optional — read the docstring before reaching for a `<video>`. |
| `ending-frames.webp` (s24) | `tools/make-ending-frames.py` | The closing I.D. video as a full-bleed sprite grid — same reason as above, plus two of its own. Capture at `playbackRate` **0.25**: at 1× Chromium silently drops ~a third of the frames (81 of 120, unevenly). And it ships **12 fps, not 24** — a budget decision, not a quality one; `--measure` prints the table. Frame 0 must keep registering on `#id-card`/`#gold-card` or s24's crossfade breaks. |
| `sticker-1…8.webp` (s22 badges) | `tools/make-badges.py` | The badges are **rotated 8.3–29.7°** in the design. The first exports had that rotation reset, so the page drew them upright at eyeballed positions and the pile never matched Scene 21. Source is now `assets/General/Rotated/` — pre-rotated, angle baked into the bitmap, so main.js rests them at 0°. **Positions are measured off a render of Scene 21, not read from the node** — see the rotated-node warning below. |
| `id-card.webp` (s22/s21) | `tools/make-id-card.py` | Dual-source matte (below): 2× pixels from `assets/General/Jordan Rose ID.png`, alpha from the MCP `contentsOnly` render. Its stage box is **the first frame of the ending video**, not the Figma node box, because s24 hands over to that video frame-by-frame. |
| `gold-card.webp` (s23) | `tools/make-gold-card.py` | Placed so the case's **inner card registers on `#id-card`'s box**, which is what lets s23 wrap the card already on screen instead of swapping one card for another. Replaced a different revision that had a white case and a different photo. |
| fandom avatars | `tools/make-jordan-av.py` | The circle is baked into the avatar's **alpha**, not a `border-radius`. It also writes a master back into the All Hands build, so the next `make-page-assets.py` run does not revert it. |

**Retired, and excluded in `.vercelignore` — do not re-export expecting them to appear:** the four
feed strips, the three nav bars, `panel-rerank.webp` (all replaced by the live `pages/`),
`drawer.webp` (s10 is coded DOM now), `xp-modal.webp` (s11 is the video sprite) and
`lanyard.webp` (s24 is the ending video, scrubbed). They stay in
git as source material and as the record of what the storyboard's framing was measured against.

**After any asset change**: re-verify with `tools/scrub.py`, then commit and push —
`main` is the deploy source, so a push republishes. New filenames ship automatically
(`.vercelignore` is a deny-list); it does name the *retired* assets explicitly, so if
you retire something, add it there too.

## Shadow policy (2026-07-28 refresh)

Assets are exported **without drop shadows**; shadows are applied in CSS (one marked
`drop-shadow` block at the bottom of `styles.css`). Export the node's content box only.
Raw source exports live in `assets/Scene N/` folders — keep new masters there.
Because of this, the dual-background alpha-matting trick below (gotcha 2, overlays case)
is only needed if you must export something WITH a soft shadow baked in — normally you don't.

## Gotchas discovered during the original export (read before re-exporting)

1. **Ancestor clipping**: Figma's export/render API clips every node to what is visible on
   canvas. The tall feed strips live inside the clipped phone frame, so exporting them directly
   yields only the visible 793px window. **Fix**: duplicate the strip node to the open canvas
   (e.g. x=50000), set `clipsContent = true` on the clone, export the clone, delete it.

2. **Transparent backgrounds render as the page color** (dark gray, `rgb(30,30,30)`), not
   transparency. Two cases:
   - **Feed strips** (must be opaque white): give the clone a white fill before export.
   - **Overlays with soft shadows** (toasts, drawer, panels, cards, stickers, emoji): export
     twice — once on a white-filled parent frame, once black-filled — then solve per-pixel
     alpha: `a = 1 − (white − black)/255`, `color = black / a`. This preserves soft shadows
     exactly. (See the original pipeline; PIL/numpy, ~10 lines.)

3. **Positions use content boxes** (shadow-free assets): CSS positions in `styles.css`
   are the node's content bounding box in stage px. (Historical note: the original
   shadowed exports were positioned by `absoluteRenderBounds`; that era's alignment math
   is gone — don't reintroduce baked shadows.)

4. **Feed strip offsets**: the per-scene resting offsets in `main.js` (`POS`) come from the
   storyboard's "Scene 1" container / strip child Y values. If content is added or removed from
   a strip, those offsets shift — re-read them from the scene metadata.

## Asset inventory (node IDs) — historical, for the retired exports

Feed strips (sliced into `-t0…-tN` 4096px-tall tiles at 2×):
- `strip-latest` — 1838:87228 (Latest Stories, 440×11083)
- `strip-myc` — 1838:107316 (My Complex feed, 440×8324)
- `strip-rail` — 1838:117238 (fandoms rail continuation, 440×9842)
- `strip-fandom` — 1838:120004 (Playboi Carti fandom page, 440×8301)

Navs: nav-latest 1838:87201 · nav-myc 1838:104877 · nav-fandom 1838:120681
Overlays: drawer 1838:110417 · xp-modal 1838:111574 · toasts 1838:113166/113788/114592/115423
Picker 1898:70619 in the **dark** Scene 06 (was 1844:38087 in the old light one).
Do **not** re-export this node directly — its translucent fill + backdrop blur mean
Figma bakes the backdrop in, and an isolated export lands on flat black, losing the
phone bleeding through the tray's right half. Run `tools/make-picker-dark.py`
instead; the docstring lists the two inputs. · reaction wall 1898:70637 — the
animated 4×5 grid of 20 reactions, built from `Scene 6/download (2).gif` by
`tools/make-react-wall.py` (animated WebP, 2.6 MB vs 7.5 MB and cleaner than the
palette-dithered GIF; the script asserts the 2330 ms loop survives Pillow's
frame coalescing). It replaced the static 2×5 grid (1844:38061, `react-1…10.webp`
+ `emoji-grid.webp`) — those files are retired but kept, and flagged as such in the
manifest.
Panels: rerank 1838:114790 · quiz — NOT a Figma export anymore: 6 `quiz-*.webp`
frames captured from the live reference app (see HANDOFF → "s15 quiz autoplay";
the old static node was 1838:115609)
Scene-19 satellites (scene frame `1838:120893`, canvas x=48480 — **stage = canvas − 48480**):
- UGC `1838:121413` · UGC Comment `1838:121440` · Video `1838:121477` — exported upright, resting
  rotations re-applied in main.js (ugc +10°, comment −16°, video +16.5°).
- Latest Editorial — the old `1838:120852` **no longer exists**; it is now `1974:8918` and the art
  changed (article card → poll card, 55px shorter). See HANDOFF 2026-07-29.
- Merch tiles `2077:8910` (left) / `2077:8969` (right) — added 2026-07-29. **The one exception to
  the upright rule**: their rotation is BAKED IN, because Figma reports only the rotated bounding
  box for them and un-rotating in PIL would resample the whole card. main.js rests them at 0°.

**A rotated node's `x`/`y` is NOT where it renders — do not place art from it.** Learned on the s22
badges (2026-07-29), and it applies to every rotated node in this file. `get_metadata` gives x/y/w/h,
and the **w/h is** genuinely the rotated bounding box — solve the rotation out of it and c²+s² closes
to 1.000 within rounding, which is how the badge angles above were recovered. But placing the art at
the reported x/y left six of the eight badges up to **72px** out, and only the two badges with zero
rotation landed. The fix that works: match each piece's own art against a **render of the scene**
(`get_screenshot` on the scene frame, e.g. Scene 21 = `1844:39703`) over opaque pixels at 1px steps.
All eight then sit at dx=dy=0, with the match error dropping from ~80–100 to 6–25, and an independent
check available — badge 4's bottom edge lands at 952.1 against the screen's 952. Re-measure that way
if the design moves; the node coordinates will look plausible and be wrong.

**Getting a rotated card out with alpha at 2× — the dual-source matte.** Used by the Scene-19
satellites and by `make-id-card.py`. Neither export route gives you both on its own:
- `download_assets(png, scale 2)` → the rotated bbox at 2×, but **fully opaque** (the transparent
  area comes back filled, so a white card cannot be keyed out of it);
- `get_screenshot(contentsOnly: true)` → genuinely transparent, but **1× only** — `maxDimension`
  only *caps* the render, it will not upscale past the node's natural size (re-confirmed on the
  I.D. card: asking for `maxDimension` 2814 on a 1407px-wide render still returns 1408×845).
So take RGB from the first and alpha from the second, upscaling the alpha to 2× (LANCZOS). The
card edges are straight lines, so the upscaled matte is effectively exact. Check the result on a
mid-tone background, not on white or black — a halo hides on both.
**Also check for a baked shadow before shipping**: measure the fraction of pixels with
`8 < alpha < 240`. Antialiasing alone is well under 1% (these two measured 0.8%); a real baked
shadow is several percent, and would double against the CSS `drop-shadow` on `#sats img`.
**Positions: match the CENTRE, not the top-left.** Rotation is about the centre, and main.js
derives each card's s19 fly-out from its centre — so centre-matching places the card where the
design has it *and* keeps the animation vector honest.
Finale: id-card (single clean card, replaces the old id-small 1844:42327 + id-large
1844:39437 pair — source `Scene 22/COMPLEX I.D No Shadow.png`) · stickers 1844:42148–42155 ·
gold card 1844:43712 (crop transparent padding to the content box) ·
lanyard photo 1845:43918 (full-bleed 3840×2160)
Topic pills (s8): **coded, not exported** — all eleven, over the baked block. Container
`1838:107337`; the pills are plain frames (`1838:107338` Sneakers · `107340` Style ·
`107342` Pop Culture · `107344` Music · `107346` Sports · `107348` Bets · `107350` Cover
Stories · `107352` Verzuz · `107354` Watch · `107356` ComplexCon · `107358` family style),
**not component instances**, so there is no second variant to export — that is half the
reason they are coded. CONTINUE button `1838:107360` stays baked; the cursor just clicks it.
Tokens (confirmed against `../10. My Complex All Hands/` `scene2.html` `.chip`): inset ring
1.128px `#dfdfdf` unpicked / `#303338` picked, fill `#fff` picked, ink `#fff` / `#050505`,
radius 33.846, Inter Regular 18.051px, tracking −0.1805, `text-transform: capitalize`.
The ring is **inset** — a real `border` would grow the box and shift every pill.
Callouts (s5): rebuilt as HTML/CSS, and since the dark-stage pass the icons are
**inlined** in `index.html` so `currentColor` can carry the palette. Six glyphs, two
per callout — idle from Scene 05 (`1844:37192`), active from Scenes 5.1–5.4
(`1901:71437` react · `1901:72282` mirrored bubble · `1901:73106` filled bookmark ·
`1901:74269` plus · `1901:74295` tick). `assets/icon-*.svg` and `assets/Scene 5/*.svg`
are kept as the source masters for those paths but are no longer fetched at runtime.
Labels are live text — edit them in `index.html`.
Cursor: coded in HTML/SVG (path from node 1838:88790, == `Cursor Light.svg`); the "Zack"
tag is plain HTML text — edit it directly in `index.html`.
