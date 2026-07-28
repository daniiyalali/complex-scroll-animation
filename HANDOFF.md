# HANDOFF — Fandom × My Complex scroll animation

_Last updated: 2026-07-28 (late night — dark stage + the Scene 5.1–5.4 hover states)_

## Status: COMPLETE, verified scene-by-scene. Awaiting stakeholder feel-pass.

All 28 storyboard frames (24 scenes + the four 5.x hover states) are implemented,
choreographed, and visually verified, on the black stage.
Zero console errors; ~9.6 MB WebP payload, preloaded behind a loader. The user has
flagged that transitions still feel "a bit choppy between frames" and wants
Figma-auto-animate-style in-betweening — that finesse pass is the expected next task.

## Decisions made (with the user)

- **Visuals**: Figma image exports composited in the browser (not rebuilt UI).
  Assets are **exported shadow-free**; drop shadows are applied in CSS (one
  clearly-marked block at the bottom of `styles.css` — static filters, never animated).
- **Deliverable**: standalone static page (no build step, vendored GSAP+Lenis).
- **Scroll**: continuous scrub + Lenis inertial smoothing (no snapping/paging).
- **Viewport**: desktop-first 1920×1080 stage, scaled to fit any window.
- **Cursor language** (user-directed): direction changes must **turn in 2D**
  (rotation, not a mirror/3D flip); clicks are a quick 10% shrink — no ring/pulse.

## Current cursor mechanics (main.js)

- `flip: true` tweens `#cursor-arrow` `rotation` 0↔90° (0.3s, mid-glide) —
  rotating this arrow +90° lands its tip exactly where a mirror would (top-right),
  so it reads as turning on a path. The "Zack" tag glides to the other side in the
  same beat; its flipped offset (`TAG_FLIP_X`) is computed in `boot()` from the
  measured tag width so the tip→tag gap is 45px on both sides.
- `click: true` = `#cursor-inner` scale 1 → 0.9 → 1 (0.08s in / 0.12s out).
  Always scale the **inner wrapper**, never the arrow (would clobber the turn's
  rotation state). There is no click ring anymore — removed by request.
- Scrub-safety rule learned the hard way: never give a `fromTo` **visible** `from`
  values — pre-start renders show them when scrubbing backwards.

## Scene → mechanism map

| Scenes | Beat | Mechanism |
|---|---|---|
| 1–3 | Hero, cursor arrives, points | latest strip @159; cursor in |
| 4 | Scroll, follow | strip → −4969 (nav slides away) |
| 5 | Callouts + hover pass | strip → −7476; callouts stagger in; then the `HOVER_PASS` pass — cursor stops on REACT → COMMENT → BOOKMARK → FOLLOW (exact Figma beats in `HOV`), each swapping that callout to its `.act` face and back; FOLLOW is a press and its FOLLOWING face stays. Scene is 2.7 units |
| 6 | Heart click → picker + reaction wall | callouts fade out at scene start; cursor clicks the story's heart (tip ≈ (785,527)); the DARK tray grows from its pointer tail above the heart (origin '49% 100%'); the animated 4×5 wall of 20 reactions cascades in on the diagonal; cursor then drifts up onto the tray (`CUR.s6b`) where the storyboard leaves it. Scene is 1.9 units |
| 7 | MY COMPLEX tab switch | strips crossfade; nav-myc slides down SOLID (no alpha ghost) |
| 8–9 | Topics, like+save | myc strip −167 → −1061 |
| 10–11 | Comments drawer, +100 XP | drawer slides from bottom over scrim; modal pops |
| 12–14 | Poll → list vote → rerank | myc −3765 → −7694 → −3765 (intentional back-scroll, see quirks); XP toasts 20/30/80 drop over the nav; side panels slide in |
| 15 | Quiz autoplay (4.6 units) | myc → −6118; cursor clicks START QUIZ on the feed card (≈ s+1.2) and only THEN the right panel slides in; it then autoplays 6 stacked frames captured from the live reference app (`Reference Projects/4. Complex Quiz`, prod build `/play` at 390×887@2x): Q1 → option A locks → Q2 → option A locks → "Perfect. 5/5" reveal → First Play badge (pop, `back.out`); toast-120 lands with the badge |
| 16 | Fandoms rail | myc→rail strip crossfade @−1497 |
| 17–18 | Carti fandom page | app-style push (rail slides left, fandom in from right); fandom nav tabs revealed via clip-path |
| 19–20 | UGC cards explode/recede | 4 upright satellites fly out **from behind the phone** (`#sats img { z-index: -1 }` — above the stage bg, below the phone) with rotation+stagger; resting rotations: editorial −5°, ugc +10°, comment −16°, video +16.5°. Right-card lefts are gap-matched to the mirrored left cards using ROTATED bounding edges (phone bezel x=1195: editorial↔ugc ≈50px, comment↔video ≈69px) — see the comment in styles.css before nudging |
| 22→21 | I.D. surfaces, expands | stickers pop; ONE clean `#id-card` image scales .422→1 with y −63→0 (no crossfade) |
| 23–24 | Gold card → lanyard photo | zoom-in, then dissolve into full-bleed Ken Burns photo |

Strip offsets in `POS` come from the Figma scene metadata ("Scene 1" container Y +
strip child Y per scene). All interaction states (Following, liked hearts, answered
poll, selected chips) are **baked into the strips** — verified by pixel-diffing all
scene copies (zero differences).

## 2026-07-28 asset refresh (shadow-free exports)

The user dropped clean exports into `assets/Scene N/` folders (kept as source
masters). All converted to WebP and wired in. Key outcomes:

- Drop shadows live in the CSS block at the bottom of `styles.css` — tune/delete there.
- `id-small`/`id-large` → single `id-card.webp` (2000×1122 = exactly the large-card
  box (460,260) 1000×561); the s21 morph is one scale+translate tween.
- Callouts rebuilt as HTML/CSS + `icon-*.svg` + live text ("Following" is a pure-CSS
  pill). Note: `#overlays > img` selector must NOT match the icon imgs inside `.callout`.
- Sticker positions re-derived by content-center alignment (badges 3 & 7 landed on
  identical coords → method validated).
- Emoji tiles renumbered (new react06–09 arrived in a different order; manifest
  `source` fields record the mapping).
- Drawer (1113,123 · 420×854) and quiz (1245,97 · 390×887) repositioned to content
  boxes; lanyard is full-bleed 1920×1080.
- **Cache-busting**: swapped assets are referenced as `...webp?v=2` (HTML + the
  react/sticker srcs in `buildDom`). Bump the version whenever re-exporting over the
  same filename — a stale-cache hit was once misread as a missing asset update.
- `Cursor Light.svg` in assets == the inline cursor in index.html (Dark = inverse).

## 2026-07-28: s15 quiz autoplay (frames from the reference app)

`panel-quiz.webp` (static Figma frame) is gone. `#panel-quiz` is now a rounded
390×887 container of 6 stacked `.qframe` images (`assets/quiz-*.webp`) revealed
in order by the master timeline — see the s15 block. The frames are Playwright
captures of the real 5-for-5 app in `Reference Projects/4. Complex Quiz`
(prod build on :3100 — `npm run dev` crash-loops via a Turbopack panic and
force-reloads the page; use `npm run build && npm start`). Capture notes:
`/play?skip=question` starts at Q1; answers lock for only 280ms before
advancing, so the "selected" frames were shot with that `setTimeout` neutralized;
the First Play badge comes from a REAL fresh play-through (5 correct answers →
reveal → NEXT) — `?skip=badge-unlock` hardcodes the 7-day streak badge instead.

## 2026-07-28 (late): dark stage + the new Scene 5.x hover states

The user added four frames after Scene 05 — **5.1 / 5.2 / 5.3 / 5.3** (that second
5.3 is the FOLLOW press; the duplicate name is in the file) — and asked for the
whole thing on black.

**Hover states.** Each callout is now two absolutely-stacked faces, `.idle`
(Scene 05) and `.act`, crossfaded on opacity. What actually changes per stop:
a `#f8f8f8` chip appears behind the row, the label goes Regular → **Bold**, and
the icon swaps art — react keeps its glyph but tilts **−7°**, comment flips to the
**mirrored** bubble (80.25×72, overhanging its 72px slot to the right), bookmark
**fills**, and FOLLOW's `+` becomes a `✓` in an inverse-filled pill reading
FOLLOWING. Row geometry is in the `callouts` entry in `assets/manifest.json`.
Two things worth knowing:
- Scene 05's labels are Inter **Regular** 32px, not Bold — the old build had all
  four bold at 33px. Helvetica Neue lands within ~2px of Inter's advance widths at
  32px (measured REACT 106 vs 104, COMMENT 166 vs 169, BOOKMARK 184 vs 182), so no
  letter-spacing correction was needed.
- Figma's auto-layout pushes the whole column when a hovered row grows taller
  (the react row goes 88 → 96.24). Reproducing that would reflow mid-scrub, so
  instead both faces of a callout share an icon centre and every row stays put.
- The chip is translucent, so **both** faces have to be tweened — fading only
  `.act` in leaves the Regular label ghosting under the Bold one.

**Timing.** `HOVER_PASS` (main.js) is the budget for all four stops: 1.0 unit =
800 px of scroll ≈ 1.35s at a 60s read, under the spec'd 1.5s for any scroll rate
above ~535 px/s. Each stop gets 200 px: glide 0.6 of it, chip on just before
arrival, off as he leaves. The old `scale 1.06` pop is gone — the real hover state
replaces it. FOLLOW snaps instead of crossfading (0.14 of a step, on the click) so
the two different labels don't smear into each other.

**Dark stage.** Palette tokens live in `:root` at the top of `styles.css`.
Measured off Figma's dark Scene 06 (`1898:70036`) rather than invented:
- stage/viewport/loader `#000`.
- Phone frame: **12px `#D7D7D7`**, outer radius 55 (screen radius 43 + 12). The
  storyboard is inconsistent here — the light scenes draw a 20px black bezel, the
  dark one a 12px light bezel; the build had 15px. Went with the dark scene, since
  a black bezel disappears into a black stage. Its `box-shadow` is gone (invisible).
- Callouts inverted via `--fg`/`--bg`; hover chip `rgba(255,255,255,.10)`
  (`--background/b2` inverted); FOLLOWING = white fill, black label.
- The empty s13/s14 placeholder slab (`Rectangle 238087`) inverted `#E8E8E8` →
  `#1A1A1A`, otherwise it's a big light void on black.
- Scroll hint → `rgba(255,255,255,.45)`.
- Everything inside `#screen` is untouched — the exports stay light UI, which is
  exactly what the storyboard does.

**Reaction wall** (s6) is now the animated 4×5 grid of 20 reactions the user dropped
into Scene 06 (`1898:70637`), replacing the static 2×5 column of 10 tiles. Rebuild
with `tools/make-react-wall.py`: `assets/Scene 6/download (2).gif` → `react-wall.webp`,
**2.6 MB against the GIF's 7.5 MB and visibly cleaner** (the GIF is palette-capped, so
its gradients dither). Two things to know:
- Pillow coalesces identical consecutive frames 70 → 56 and folds their durations, so
  the loop still totals exactly 2330 ms. Pillow's WebP *reader* reports per-frame
  durations as `None`, which looks like data loss — it isn't. The script asserts the
  total against the RIFF `ANMF` chunks; trust that, not the reader.
- It renders through **20 clipping cells** built in `buildDom`, each holding its own
  `<img>` pointing at the same file — one decode, all 20 frame-synced, and each cell
  can be staggered independently (they cascade in on the diagonal). The cells tile the
  image exactly, so at rest the composite is pixel-identical to the whole frame and the
  emoji that overflow their cell (jack-in-the-box, NO sign) aren't clipped. During the
  0.4s pop those overflow pixels briefly travel with the neighbour cell — invisible in
  practice, and the reason not to bother slicing 20 separate files.
- Its background is opaque black, the same black as the stage, so no keying was needed.
  **If the stage ever stops being `#000`, this asset needs alpha.**
- Measured 120 fps avg / 9.4 ms worst frame scripted through s5→s8 with the wall live
  (headless Chromium — still wants a real-hardware pass).

**Reaction tray** (`picker.webp`) re-exported dark, and it is a **composite** —
regenerate with `tools/make-picker-dark.py`, never by exporting the node. The tray
is translucent with a backdrop blur, so Figma bakes the backdrop in: exporting the
node alone (`1898:70619`) renders it over flat black and loses the phone bleeding
through its right half. The script takes RGB from a 2x render of the whole dark
scene, borrows the alpha silhouette from the previous light asset (same 1458×554
export frame, so all the CSS geometry holds), and heals out the cursor the
storyboard parks on the tray. Cache-buster is now `?v=3`. The light asset is kept
as `assets/Scene 6/Reactions Light (previous picker.webp).webp`.

## Verification performed (repeat after any change)

1. Serve locally, then run `tools/scrub.py` (Python Playwright; there is no node on
   this machine): it jumps `window.__lenis.scrollTo()` + `tl.time()` to each label ±
   an offset (`window.__tl.labels`, `window.__scrollLen` are exposed), screenshots,
   and reports console errors. Compare against the storyboard.
   `python3 tools/scrub.py '[["name","s5",1.45], ...]'` → `shots/`.
2. Mid-transition frames checked: s5 flyby hovers, s6 turn + heart click, s7 tab
   switch, s15 pre-click (no panel) / each quiz frame / badge+toast, s16
   crossfade, s17 push, s19 emergence-from-behind-phone + balanced resting fan,
   s21 morph, s24 dissolve. Reverse-scrub spot checks are clean (including the
   worst case: end → s2).
3. FPS: scripted scroll through the heaviest section measured ~120fps average
   (before the CSS drop-shadow filters were added — re-check on real hardware).

## Known quirks / watch list

- **S13→S14 back-scroll**: the storyboard itself re-scrolls the feed up to the poll for
  the rerank beat. Kept faithful. If it feels odd in the hand, alternative: hold the feed
  at the KATSEYE position during s14 and only move the side panel.
- **Picker export has its backdrop baked in** (translucent fill + backdrop blur,
  sampled in Figma). This is why it is a composite — see the dark-stage section
  above and `tools/make-picker-dark.py`. It also means the tray only lines up while
  the latest strip rests at `POS.latest.s5`; move that and the bleed-through
  desynchronises from the live feed behind it.
- **The s6 reaction wall is the one thing on the page that is NOT scroll-driven.**
  Its 2.33s loop runs on wall-clock, like the `hintbob` keyframes — correct for an
  ambient idle, but it means the wall is the only element whose look at a given
  scroll position isn't deterministic. Screenshot diffs across that block will never
  match byte-for-byte; judge it by eye.
- **Safari untested** (only headless Chromium). WebP, clip-path, Lenis all support
  Safari 14+, but do one manual pass.
- **file:// doesn't work** — needs any static server (manifest fetch). Consider inlining
  the manifest into main.js if double-click-to-open matters.
- The Figma file was temporarily modified during the original export (EXPORT-* clones);
  **all were deleted** — verified zero leftovers. Re-exports will do the same dance.
- `PX_PER_UNIT=800` (~33k px scroll) has NOT had a human trackpad feel-pass yet.

## Next steps (suggested)

1. **In-betweening / finesse pass** (user's standing request): continuous shared-element
   transitions instead of fade-swaps — candidates: s7 tab switch, s16 rail crossfade,
   toast/panel handoffs. The single-image s21 card morph is the pattern to follow.
2. User feel-pass on real hardware → tune `PX_PER_UNIT`, per-scene durations, Lenis lerp.
3. Safari + Firefox manual check.
4. Decide hosting (any static host works; drag the folder to Netlify/Vercel/S3).
5. Optional deferred polish: typing reveal in the comments drawer, poll-bar grow animation
   (would need answered/unanswered poll patch exports), keyboard/screen-reader affordances.
