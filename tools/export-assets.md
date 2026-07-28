# Re-exporting assets when the Figma design changes

All visuals come from the Figma file **Fandom x My Complex**
(`https://www.figma.com/design/0Wn6kFfKuKalOCTev3uUjA/...`, storyboard canvas `1838:87183`).
`assets/manifest.json` maps every asset → its Figma node ID (and, since the 2026-07-28
refresh, a `source` field pointing at the raw export it came from). To update one asset
after a design change: re-export that node at **2×, shadow-free**, convert to WebP with the
same filename, and **bump that asset's `?v=` cache-buster** in `index.html` (or `buildDom`
in `main.js` for emoji/sticker srcs) — browsers cache same-name images across sessions.
Positions only change if the layout itself moves.

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

## Asset inventory (node IDs)

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
Scene-19 satellites: 1838:120852 / 121413 / 121440 / 121477 — exported upright; their
resting rotations are re-applied in main.js (editorial −5°, ugc +10°, comment −16°, video +16.5°)
Finale: id-card (single clean card, replaces the old id-small 1844:42327 + id-large
1844:39437 pair — source `Scene 22/COMPLEX I.D No Shadow.png`) · stickers 1844:42148–42155 ·
gold card 1844:43712 (crop transparent padding to the content box) ·
lanyard photo 1845:43918 (full-bleed 3840×2160)
Callouts (s5): rebuilt as HTML/CSS, and since the dark-stage pass the icons are
**inlined** in `index.html` so `currentColor` can carry the palette. Six glyphs, two
per callout — idle from Scene 05 (`1844:37192`), active from Scenes 5.1–5.4
(`1901:71437` react · `1901:72282` mirrored bubble · `1901:73106` filled bookmark ·
`1901:74269` plus · `1901:74295` tick). `assets/icon-*.svg` and `assets/Scene 5/*.svg`
are kept as the source masters for those paths but are no longer fetched at runtime.
Labels are live text — edit them in `index.html`.
Cursor: coded in HTML/SVG (path from node 1838:88790, == `Cursor Light.svg`); the "Zack"
tag is plain HTML text — edit it directly in `index.html`.
