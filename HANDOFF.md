# HANDOFF — Fandom × My Complex scroll animation

_Last updated: 2026-07-30, late (**Scene 19.3 built** — the STATUS UNLOCKED level-up sheet, its
card flip played as the designer's VIDEO scrubbed frame by frame, the strict PDP → pill → sheet →
flip order over an unmoved page, s20 retargeted to clear the sheet and hold the page until it has
gone, and the **s24 finale fading to black** from the video's 3.5s mark. Earlier the same day:
live product pages, the scene rebuilds, the XP-coin toasts, the s22 badge gravity drop, the gold
I.D. card sized to the ending video's first frame, s23 wrapping the card, the s24 ending video)_

## Status: complete and working. **Today's work is UNCOMMITTED** — and one earlier commit is local-only (`origin/main` is at `8e40bea`).

`main` is public and wired to Vercel, so **a push is a publication**. The last push was
`8e40bea` (2026-07-29). One later commit (`6aa6a58`, docs) is local-only, and everything from
2026-07-30 — the whole s19.3 wave included — sits **uncommitted in the working tree**. Re-read
the deploy-set rule below before pushing; since the last measured set, `flip-frames.webp`
(+0.86 MB) is the only new fetched file (the two coded-flip faces it obsoleted never shipped).

**60.29 timeline units / 48,232 px** (re-measure rather than trust it — it moves with every span
change, and `window.__tl.duration()` / `window.__scrollLen` are exposed on the page).
Deploy set **261 files / 17.86 MB** — up from 14.93 MB because the s24 ending sprite is 2.96 MB
and the badge/card re-cuts are larger than what they replaced. Zero console errors;
reverse scrub `end → s2` clean. Always re-derived by diffing a real page load against
`.vercelignore`, never a regex over the source: **nothing fetched that would 404.** That diff is
also what caught `Feedback/` shipping to a public URL (1.94 MB of internal reference renders — now
denied in `.vercelignore` **and** gitignored, since the repo is public). The only files left shipping unfetched are
`vercel.json` (must — its headers are read from the deployment) and two stale
`pages/assets/*.webp` (130 KB, referenced by no page; see the watch list).

**The biggest change: the flat Figma strip exports are gone.** The phone and both side slabs now
hold the **live product pages** from `../10. My Complex All Hands/`, so cursor beats land on real
elements and the interactions are the product's own behaviour. Six-step rollout, all done — see
"swapping the baked strips for the live pages".

**Where the prototype now goes past the original storyboard**, all on the user's direction. Each
has its own dated section below; read that section before touching the scene.

| scene | what changed |
|---|---|
| s4→s5 | the seam is continuous — 392px of near-still scroll removed, and it was the fling's *ease*, not the scene length |
| s7 | no longer cuts to MY COMPLEX: whips the feed home (the s3/s4 gesture inverted) then clicks the tab. The fling is **wall-clock** |
| s8 | topics are picked, not pre-picked — on the page's own `.chip` elements |
| s9 | the click that opens comments now lands on the real comment icon; it used to hit nothing |
| s10 | the comments tray is **coded DOM**, types the comment live at 28px, and posts it as the first item. `drawer.webp` retired |
| s11 | the XP popup **is** the Scene 11 video, scrubbed frame by frame off a sprite grid. `xp-modal.webp` retired |
| s12 | the poll option under the cursor is actually selected, and the XP follows the selection |
| s13 / s13.1 | s13 pauses on the WNBA card; **s13.1 is new** — the article opens in the left slab and votes on rank 30 |
| s14 | the live rerank editor, one drag (3→4) |
| s19 | six satellites, not four; sizes and positions matched to the user's reference render |
| s20 → s22 | the I.D. card is **caused by a click**: the cursor stays on screen, goes to the poster's profile picture and presses it. It used to fade out for two whole scenes and the card just appeared |
| s20 / s22 | the poster **is** the person on the card — both UGC posts are Jordan Rose with his photo, not a stock "Adam Kwazoski" |

Two things carried over from the original build that are still true and still load-bearing:
all 28 storyboard frames are implemented on the black stage, and only `transform`/`opacity` are
animated (plus one `clip-path`, and the discrete in-page state described per scene).

Source of truth is `github.com/daniiyalali/complex-scroll-animation` (`main`), but it is
**behind**: the s7 and s8 work above is uncommitted in the working tree. `main` is public
and wired to Vercel, so pushing publishes — the user asks for that per-task.
`vendor/inter-subset.woff2` is new and untracked; stage it explicitly with the rest.
Hosting: import the repo at vercel.com/new — see "repo + hosting" below.

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
- **The cursor is visible continuously from s2 to s24.** There are exactly **two**
  `#cursor` autoAlpha tweens in the timeline — the s2 reveal and the s24 exit — and it
  must stay that way. A third one in s20 is what made the cursor vanish for two scenes
  (user's report, 2026-07-29); if a scene wants the cursor out of the way, move it, don't
  hide it. Corollary: a beat that hides the cursor also hides the *cause* of whatever
  happens next — that fade is why the I.D. card used to appear with nothing pressing it.

## Scene → mechanism map

Rebuilt 2026-07-29 from the code, in timeline order, with the offsets that are actually in `POS`.
The phone shows a **live page** in every scene now, so "strip" language is gone; `latest` =
`pages/home-editorial.html`, `myc` = `home-feed.html`, `fandom` = `fandom.html`.

| Scene | Span | Beat | Mechanism |
|---|---|---|---|
| s1–s2 | 1.0 / 0.9 | Hero, cursor arrives | `latest` @ **0** (the page carries its own nav, so the old +159 offset is gone); cursor in |
| s3 | 1.2 | Comes in, winds up | arrives off the bezel untilted, dips **DOWN** while turning into the storyboard pose — 30°, tip on the screen's right edge (1180,609). The feed does **not** move on the backswing |
| s4 | **1.34** | The whip | fast upstroke (0.28) → release. Feed tracks the cursor **1:1** for 466px (`CUR.s3b.y − CUR.s4.y`), then flings to **−4505** on **`power1.out` over 1.0**. Span ends exactly on the landing — the ease and the span are both seam decisions, see the 4→5 note |
| s5 | 2.7 | Callouts + hover pass | page → **−7635** on `sine.inOut`; callouts stagger in; then the `HOVER_PASS` pass over REACT → COMMENT → BOOKMARK → FOLLOW, hit-tested against the cursor's own path |
| s6 | 1.9 | React click → picker + reaction wall | cursor clicks the card's react glyph — **resolved from the live page** (`.i20 .heart-in`), not a hand-placed number; the dark tray grows from its tail; the animated 4×5 wall cascades in |
| s7 | 2.9 | Whip home → MY COMPLEX | the s3/s4 gesture inverted; the release hands off to a **wall-clock** fling that carries the feed home while the page's own nav returns with it. Then the MY COMPLEX tab is clicked and the page swaps as a hard cut |
| s8 | 3.7 | Pick three topics → Continue | `myc` → **−326**. Zack picks SNEAKERS → SPORTS → COMPLEXCON on the page's **own `.chip` elements** (the page ships four pre-picked; `prepareChips()` undoes that and stacks a picked clone on the three), then hits CONTINUE |
| s9 | 1.5 | Story card → opens comments | `myc` → **−1220**; the cursor clicks the card's **comment icon**, resolved from the live page (`.eact` index 1). It used to land 39px right of it, on nothing |
| s10 | 3.4 | Comments tray: type + post | the tray is **coded DOM** (`drawer.webp` retired). Floats in empty, the comment types in at 28px with a caret, then POST sends it and it becomes the **first** comment in the list |
| s11 | 2.2 | +100 XP, frame by frame | the popup **is** the Scene 11 video — `assets/xp-frames.webp`, an 8-col sprite grid of 63 frames swept by a proxy and positioned with a transform, so the charm rotates in 3D as you scroll. `xp-modal.webp` retired |
| s12 | 1.8 | Poll: select, then XP | `myc` → **−3526**. The option under the cursor gets `chosen`, `unvoted` comes off `.bars` and the bars reveal — the page's own interaction, with the `win` emphasis **moved onto the pick**. The +20 XP toast follows the selection |
| s13 | 2.0 | Pause on the WNBA card | `myc` → **−4048**; the left slab (now `pages/article.html`) fades up already parked on rank 30. **No XP toast here** |
| s13.1 | 1.9 | Vote on rank 30 | cursor presses UNDERRATED; the results row reveals with the page's own computed tally (30/36/34%), and **then** the +30 XP toast drops |
| s14 | 3.0 | Rerank: one swap | `pages/rerank.html` in the right slab, its onboarding sheet dismissed via the page's own Skip. Row **3 → 4**, tracking the cursor 1:1, badges renumbering on the drop |
| s15 | 4.6 | Quiz autoplay | `myc` → **−7751**; cursor clicks START QUIZ and only then the right panel slides in; 6 captured frames autoplay to the 5/5 reveal and first badge |
| s16 | 1.6 | Fandoms rail | `myc` → **−5361**, a **scroll** to the Fandoms card inside this same page. `strip-rail` is retired entirely — the rail was its own export before, but it is a card in this page |
| s17–s18 | 1.7 / 1.4 | Carti fandom page | app-style push between two **live pages**; `fandom` @ **0** then **−649**. That page's nav is 92px (no tab row), so the old nav image and its clip-path reveal are gone |
| s19–s20 | 2.0 / 1.7 | UGC + merch explode/recede, then **click the DP** | **six** satellites (four UGC/editorial + two merch tiles) fly out from **behind** the phone (`z-index: -1`). Resting rotations −5/+10/−16/+16.5 and **0** for both merch tiles (theirs is baked in). `fandom` → −1617 then −3118. All six boxes derived from `Feedback/Scene 31.png` — do not nudge by eye. s20 then walks the cursor onto Jordan Rose's profile picture (`PAGE_TARGETS.s20`, the live `.up-av`) and presses it at +1.65, on the scene boundary |
| s22→s21 | **2.1** / 1.7 | I.D. surfaces, **is clicked**, expands | **the card is the answer to the s20 press**: it opens at s22+0.1, as the finger lifts. ONE clean `#id-card` scales **0.4403→1** with x 14.25→0, y −103.5→0, no crossfade — those constants are the *video's frame 0*, not the Figma node (see `ID_SMALL_*` / `tools/make-id-card.py`). Cursor is already here and already flipped, so it just glides onto the card — no teleport. Canvas order really is 22 before 21. The eight badges then **fall in under gravity and pile up** (cascade s22+0.55 → +1.91) instead of popping in place; each impact **jolts the phone** rather than bouncing the badge — see `BADGE_DROP`. **Then the card is CLICKED open**: the cursor presses it at s22+**1.95** — after the pile settles at ~+1.93, so it reads as a press on a finished card — with a 3% dip on the card itself (0.4403 → 0.4271), and s21's expansion starts at **+0.05**, the frame the release finishes on. The blow-up used to happen off nothing |
| s23–s24 | 2.0 / **2.95** | Card gets encased → **the ending video, scrubbed** | s23 wraps the card already on screen in its case. s24 then hands over to `assets/ending-frames.webp` — the closing I.D. video as a full-bleed 8×8 sprite grid (60 frames, 12 fps) swept frame by frame across `END_SWEEP` (2.25u ≈ 1,800px): the card glows, morphs onto a real person at ComplexCon, and the shot pulls back over the crowd. The handover is a plain **crossfade at frame 0**, which works only because `#id-card`'s box was measured off that frame and the case is fitted onto the same box. `lanyard.webp` (the static still) is retired |

**How `POS` is derived now.** The offsets no longer come from Figma scene metadata — they are
solved against the **live pages**, because the pages' content lengths do not match the retired
strips' and will not match each other's between versions. The method that works: take the
storyboard's cursor tip for the beat and solve for the offset that puts the target under it, then
look at the frame. Arithmetic shifts (e.g. −159 for a nav height) hold only near a page's top;
applied deeper into `home-feed` they put s13 on the quiz card and s15 past it. Historical note for
context: under the strips, `POS.latest.s4` was once wrong by 623px and was recovered by matching
tiles against the Figma frame — that era's numbers (−4346, 159, −7476) are all superseded. Most interaction states (Following, liked hearts, answered
poll) are **baked into the strips** — verified by pixel-diffing all scene copies (zero
differences). The s8 topic chips **used to be** in that list and no longer are: being baked
is exactly what stopped them being pickable, so the block is now coded DOM over the top
(see the 2026-07-29 s8 note). Anything else the storyboard needs to *change* on screen has
the same problem and needs the same treatment.

## 2026-07-28 asset refresh (shadow-free exports)

The user dropped clean exports into `assets/Scene N/` folders (kept as source
masters). All converted to WebP and wired in. Key outcomes:

- Drop shadows live in the CSS block at the bottom of `styles.css` — tune/delete there.
- `id-small`/`id-large` → single `id-card.webp` (2000×1122 = exactly the large-card
  box (460,260) 1000×561); the s21 morph is one scale+translate tween.
- Callouts rebuilt as HTML/CSS + `icon-*.svg` + live text ("Following" is a pure-CSS
  pill). Note: `#overlays > img` selector must NOT match the icon imgs inside `.callout`.
  → **Superseded** by the dark-stage pass: two faces per callout and the icons are now
  inlined SVG, so no icon `img` elements exist at all. See "dark stage + the new Scene
  5.x hover states".
- Sticker positions re-derived by content-center alignment (badges 3 & 7 landed on
  identical coords → method validated).
- Emoji tiles renumbered (new react06–09 arrived in a different order; manifest
  `source` fields record the mapping).
  → **Superseded**: the 10 static tiles were replaced by the animated `react-wall.webp`.
  They're retired-but-kept, and flagged as such in the manifest.
- Drawer (1113,123 · 420×854) and quiz (1245,97 · 390×887) repositioned to content
  boxes; the s24 ending sheet is full-bleed 1920×1080 (as the retired lanyard still was).
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
  letter-spacing correction was needed. **Inter is now actually vendored** (2026-07-29,
  for the s8 pills), so the callouts could switch to the real face if the ~2px ever
  matters — they were left on Helvetica Neue because they sit on the black stage with no
  baked type beside them to disagree with, unlike the pills.
- Figma's auto-layout pushes the whole column when a hovered row grows taller
  (the react row goes 88 → 96.24). Reproducing that would reflow mid-scrub, so
  instead both faces of a callout share an icon centre and every row stays put.
- The chip is translucent, so **both** faces have to be tweened — fading only
  `.act` in leaves the Regular label ghosting under the Bold one.

**Smoothness (fixed 2026-07-29).** The pass read as choppy for two measurable reasons,
both worth remembering:
1. Each glide ran only 0.6 of a step, so the cursor sat **fully parked for the other
   0.4 — 80 px of scroll, four times over**. Move, stop, move, stop. Segments now run a
   full step and butt together: traced speed through the pass never drops below
   ~120 px/unit (it only dips as it passes each callout) instead of hitting zero.
2. The crossfades named **no ease**, and this timeline is built with
   `defaults: { ease: 'none' }` — so all eight opacity ramps were **linear**, over 66 px.
   Linear opacity reads mechanical. **Any tween added to this timeline must name an ease.**
3. Even once eased, **swapping the icon art still had to crossfade**, and dissolving two
   near-identical shapes always looks soft. Fixed by removing the swap entirely: REACT /
   COMMENT / BOOKMARK dropped to a single face, and their hover is now just the `.chip`
   fading up + the same icon rotating `ICON_TILT` (−8°, the direction Figma tilts the
   REACT glyph). Only opacity on a text-free layer and a transform on the icon, both on
   one ramp — there is nothing left that can smear. The label still goes **Bold**, via a
   `tl.set` of `font-weight` rather than a dissolve: it's a layout property, so a smooth
   ramp would need a variable font we don't ship, and a discrete flip in true Bold reads
   better anyway. It fires just after the tip lands, inside the chip's swell. Verified the
   Bold label still fits the chip on all three, and that a reverse scrub restores weight
   400 (a `set` in a scrubbed timeline is the one thing here worth re-testing after edits).
   The cost is that Figma's hover ICON art (mirrored bubble, filled bookmark) is not
   reproduced; that was the user's explicit call.
4. The hover still *felt* late, because the trigger was a hand-placed offset around
   `arrive` and the ramp was 110 px long. Both replaced: `hoverWindow()` solves when the
   cursor's tip actually crosses each `.chip` box (build-time, from the declared `SEGS`
   path — nothing hit-tests per frame), and the fade is `HOVER_ATTACK` = 0.05 units
   (≈40 px, ≈70 ms) starting ON the crossing. **Measured lag: 2 px in, i.e. the scan
   resolution; the release begins the frame the tip leaves.** REACT now lights while the
   cursor is still gliding in — correct, the pointer is over the row.
5. First attempt hit-tested the painted `.chip` boxes, and that broke it the other way:
   **63% of the pass had nothing lit** (boxes ~90 px tall, ~50 px dead gutters between
   them, cursor covering 157 px a hop), so the hover looked like it had been removed —
   at one point the cursor sat on comment's edge with react already dropped and comment
   not yet on. Fixed with `hitBands()`, which TILES the bands: each row owns half the gap
   above and below, the way a real list row's hit area fills the space rather than
   leaving a gutter. Coverage went 37% → **100%** of the sweep, lit windows evened out to
   214 / 211 / 218 px. Measure coverage, not just trigger lag — zero lag on a state
   nobody sees is worse than late.
6. Tiling then caused the opposite fault: because the bands abut, leaving react and
   entering comment happen at the *same instant*, and both ramps started there — so
   **two rows were lit simultaneously** for ~48 px. Hover is exclusive; that's never
   right. Fixed by splitting the timing in two: the exit runs `HOVER_RELEASE` (0.03)
   *ending* on the boundary, the entry runs `HOVER_ATTACK` (0.04) *starting* on it. The
   outgoing row is dark exactly as the incoming one begins.
   **Three invariants to re-check after touching this block** (all measured, all pass):
   trigger lag ≈ 0; coverage 100% of the sweep; and at no sample is more than one row
   lit or more than one label bold. Scan resolution is `dt = 0.0005` units (0.4 px) —
   the earlier 0.002 was too coarse to place the boundary cleanly.
   FOLLOW still swaps faces, because FOLLOW → FOLLOWING is a real state change; it now
   commits at the *bottom* of the click rather than before it.

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

## 2026-07-29: repo + hosting

Pushed to `github.com/daniiyalali/complex-scroll-animation` (`main`, initial commit
`a9d9029`, 123 files, 38 MB of git objects). Hosting plan is Vercel's Git integration,
so pushes redeploy; there is no build step and `vercel.json` only sets cache headers.

**Open step:** import the repo at vercel.com/new. Nothing else is needed — the
config files are already committed.

What ships, and how that was established:
- The working directory is **1.1 GB**, nearly all of it `Reference Projects/`. That is
  gitignored, so it is local-only; a fresh clone will not have the reference apps and
  the s15 capture workflow can't be re-run from a clone alone.
- `assets/Scene */` masters (~28 MB) **are** tracked, deliberately — `make-react-wall.py`
  and `make-picker-dark.py` read them, so ignoring them would break the asset pipeline
  for anyone cloning. Largest tracked files: the 7.2 MB Scene 6 GIF, a 6.7 MB Scene 24
  PNG. Both well inside GitHub's limits.
- `.vercelignore` cuts the deploy to **261 files / 17.86 MB** — `pages/` is 221 files / 8.56 MB of
  that, `assets/` 31 / 8.98 MB — and 257 of those paths are what a real page load fetches
  (re-measured 2026-07-30, after the s24 ending sprite added 2.96 MB). It also names every
  **retired** asset explicitly (four strips, three navs, `panel-rerank.webp`, `drawer.webp`,
  `xp-modal.webp`, `lanyard.webp`), which matters because the file
  is a deny-list: without those lines ~7 MB of superseded art would still ship. That set was derived by
  recording every request a real page load makes and diffing it against what the ignore
  file keeps — not by grepping the source. Do it that way again if you change what loads:
  a regex over `index.html`/`main.js` misses anything built from a template literal
  (the sticker and, formerly, the emoji srcs in `buildDom`), and would have shipped a
  broken page.
- It also keeps `CLAUDE.md`, `HANDOFF.md`, `tools/` and the retired assets off the
  served URL.

**Three ways this has bitten — all because `.vercelignore` is a DENY-list, so
anything new ships by default:**
1. `git add -A` swept in three files dropped into `assets/` mid-session (a badge
   animation mp4, a cinematic-morph SVG, a Scene 11 360° mp4 — material for scenes not
   built yet). Harmless in git at 2 MB, but two of them sat in the *deploy* set,
   unreferenced. Now excluded via `*.mp4` / `*.mov` and an explicit line. **Check
   `git status` before `git add -A` — the user drops assets in while you work.**
2. `tools/deploy-vercel.py` walks the directory literally, and `.git/` did not exist the
   first time the walk was validated. Once the repo was created, that script would have
   uploaded the whole git store — `.git/config` included — to a public host. Fixed in
   both places: `.git/` is in `.vercelignore` *and* in a `NEVER_WALK` set in the script,
   because the repo itself is too costly to leave to one ignore rule.
3. **New folders, 2026-07-29.** `Feedback/` (the user's reference renders and feedback
   screenshots, 1.9 MB) and `assets/General/` (raw art drops plus the toast build inputs, ~12 MB
   and growing — the user adds to it live) were both shipping: internal working material, at
   full source resolution, on a public URL. Both now denied.
   These are the *hardest* case to notice: unlike a stray mp4 they are never referenced from the
   source at all, so nothing in the page breaks and no grep finds them. Only the load-vs-walk
   diff does. **Treat "the user added a folder" as a trigger to re-derive the set.**

Re-run the check after touching assets or the ignore file — it takes seconds and caught
all three of the above:
```
# record a real page load's requests, diff against what .vercelignore keeps
# (the collect() in tools/deploy-vercel.py is the same walk the deploy uses)
```

**Cache headers** are `max-age=86400, stale-while-revalidate=604800` on `/assets` and
`/vendor` — deliberately NOT `immutable`. The asset convention is to overwrite the same
filename and bump `?v=`, but several assets are referenced with no `?v=` at all (strips,
navs, toasts, quiz frames, `xp-modal`, `id-card`), so a year-long immutable cache would
strand a re-export.

**Credentials / security:**
- Git pushes need no token: the credential is in the macOS Keychain under host
  `github.com` / user `daniiyalali`, and `credential.helper=osxkeychain` is configured.
  Nothing secret is in `.git/config` — verified. If a push 403s, the stored token was
  probably rotated; re-seed the keychain rather than putting a token in a URL.
- The token that seeded this was pasted into a chat transcript and **should be treated
  as leaked and rotated**.
- **The repo is public**, so `CLAUDE.md`/`HANDOFF.md` and the Figma file key in them are
  publicly readable. No credentials in either, but this is client work — the user may
  want it private.

`tools/deploy-vercel.py` is a stdlib-only REST-API deploy path, written because this
machine has no node toolchain (no `node`/`npm`/`npx`, no Homebrew, no `gh`, no `vercel`).
Unneeded once the Git integration is live, but it works and is the escape hatch.

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
3. FPS: scripted scroll s5→s8 (the heaviest block — dark tray, animated wall, callout
   crossfades, CSS drop-shadow filters all live) measured **120 fps average, 9.4 ms
   worst frame** in headless Chromium on 2026-07-29. Indicative only; still wants a
   real-hardware pass.
4. Deploy set: after any change to what the page loads, re-derive it by recording a page
   load's requests and diffing against `.vercelignore` (see "repo + hosting").

## Dead scroll between scenes (re-measured 2026-07-30, after the s22 press and the s24 ending video)

Every scene is a fixed span, so if its last tween finishes early the remainder is scroll
where **nothing moves** — it reads as having to nudge the wheel to make the page continue.
The user has flagged this twice at the 4→5 handover; s4 is now **0**, and the second fix was
about the fling's *ease* rather than the span (see that note). Full table, worst first:

**A dead tail is not the only way a seam stalls.** A decelerating ease can crawl for hundreds of
px while the timeline says it is still animating, so this table under-reports. To find a real
stall, sample the moving element's position across the seam and look for windows where it travels
under ~0.15px per px of scroll — over ~200px of that reads as a break, under ~100px does not.

| scene | dead tail | px | note |
|---|---|---|---|
| s1 | 1.00 | 800 | intentional hero hold |
| s23 | 0.60 | 480 | the case settling. **Now the worst real tail on the page** — the biggest single candidate if the finale needs tightening |
| s13 | 0.40 | 320 | |
| s21 | 0.40 | 320 | the card is fully expanded by +0.85 and the scene runs to 1.70 |
| s13.1 | 0.33 | 264 | deliberate — holds the +20/+30 XP toast so it can be read |
| s16 | 0.30 | 240 | |
| s5 | 0.29 | 232 | FOLLOWING held (deliberate) |
| s10 | 0.27 | 216 | deliberate — holds the posted comment |
| s24 | 0.25 | 200 | deliberate — the frame sweep ends at +2.70 of 2.95 so the ComplexCon wide shot RESTS before the `end` hold, instead of landing on the last pixel of scroll |
| s2, s6, s19 | 0.20 | 160 | |
| s7 | 0.15 | 120 | |
| s3, s11, s18 | 0.10 | 80 | s11 was 320 before the XP video — most of the new span is reclaimed, not added |
| s14 | 0.07 | 56 | |
| s9 | 0.05 | 40 | |
| **s4** | **0.00** | **0** | trimmed three times: 2.4 → 1.9 → 1.34. The last one was about the fling's *ease*, not the span — see the 4→5 seam note |
| **s22** | **0.00** | **0** | **was 0.19 / 150.** The press that opens the card now lands at +1.95 of 2.10, so the scene runs to its edge — the pile is still readable because the press sits after it, and s21 answers on the boundary |
| s8, s12, s15, s17, s20, end | 0.00 | 0 | |

Some are deliberate holds that let a beat land — don't trim blindly. Re-measure with the
per-scene walk over `tl.getChildren()` rather than reading durations by eye; the numbers
above came from that (re-measured 2026-07-30, after the s22 press and the s24 ending video). Note a `power3.out` fling is ~96% done at two thirds of its
duration, so a scene can look static well before its last tween actually ends.

Every scene rebuilt in this session was budgeted against this table as it was written, which is
the habit to keep: pick the span from where the last tween actually lands, not from a round
number. **And then verify per-beat state, not just the closing frame** — a span that is too short
silently truncates its own tweens, which cost a whole drag in s14, the XP toast in s13.1 and the
second rerank swap, three times over, with no error and a plausible-looking final frame.

## Known quirks / watch list

- **S13→S14 back-scroll**: the storyboard itself re-scrolls the feed up to the poll for
  the rerank beat. Kept faithful. If it feels odd in the hand, alternative: hold the feed
  at the KATSEYE position during s14 and only move the side panel.
- **Picker export has its backdrop baked in** (translucent fill + backdrop blur,
  sampled in Figma). This is why it is a composite — see the dark-stage section
  above and `tools/make-picker-dark.py`. It also means the tray only lines up while
  the latest strip rests at `POS.latest.s5`; move that and the bleed-through
  desynchronises from the live feed behind it.
- **Two blocks are NOT scroll-driven**, so their look at a given scroll position isn't
  deterministic and screenshot diffs across them will never match byte-for-byte:
  - the **s6 reaction wall** — its 2.33s loop runs on wall-clock, like the `hintbob`
    keyframes. Correct for an ambient idle. Judge it by eye.
  - the **s7 fling home** (added 2026-07-29, see its section) — deliberate, so one flick
    carries the feed to the top without the reader cranking it. `scrub.py` will catch it
    mid-flight: wait `FLING_HOME` (1.15 s) after seeking, or seek past `AUTO.snap`, where
    the gate force-completes it. Both were done when it was verified.
- **Safari untested** (only headless Chromium). WebP, clip-path, Lenis all support
  Safari 14+, but do one manual pass.
- **file:// doesn't work** — needs any static server (manifest fetch). Consider inlining
  the manifest into main.js if double-click-to-open matters.
- **The deny-list leaks internal material by default, and it has now done so twice.**
  `.vercelignore` is a DENY-list, so every new folder ships until someone names it. Caught
  2026-07-29 by diffing a real page load against the walk: **`Feedback/` was in the deploy set**
  — 1.94 MB of the user's own reference renders and feedback screenshots, on a public URL. Added,
  along with `assets/General/`. The lesson is the method, not the two folders: after adding *any*
  directory, re-derive the set (the snippet is in "repo + hosting") rather than assuming. A regex
  over the source will not find this, because these files are never referenced by the source at all
  — being unreferenced is exactly why they go unnoticed.
- **Two stale `pages/assets/*.webp`** (`b5550e64-…`, `eebeb893-…`, 130 KB total) are in the deploy
  set but fetched by no page — leftovers from a page change. Safe to delete; left in place in case
  an in-flight edit is about to reference them. `make-page-assets.py` will not regenerate them,
  since it builds its list from what the pages actually fetch.
- **`assets/General/`'s Jordan Rose art is now RESOLVED** — the open question in the earlier
  revision of this note ("the `.mp4` may mean a finale scene is meant to *play* rather than
  scale") was answered yes, by the user, on 2026-07-29. Three of the four are built and wired:
  `Jordan Rose ID.png` → `id-card.webp` (`make-id-card.py`), `Jordan Rose Id Wrapped.png` →
  `gold-card.webp` (`make-gold-card.py`), and `Jordan Rose ID Video.mp4` → `ending-frames.webp`
  (`make-ending-frames.py`) **and** the source of `#id-card`'s stage box. Still unbuilt and
  referenced by nothing: **`Jordan Rose ID on Lanyard.png`** — the still equivalent of the video's
  end state, superseded before it was ever used — plus `exp coin.png` / `Exp.png` (the coin the
  toasts already carry) and `Badge Packet Animation.mp4`. Ask before building those.
- **Unbuilt material still sitting in `assets/`** as of 2026-07-30: `Badge Packet
  Animation.mp4` and `Last frameCinematic Morph Video 1.svg`. Tracked in git, excluded from
  the deploy, referenced by nothing — confirm with the user before wiring either in.
  `Scene 11/360-Degree Animation 1.mp4` is **no longer on this list**: it is the source of
  `xp-frames.webp` via `tools/make-xp-frames.py`, i.e. the s11 popup the reader scrubs.
- The Figma file was temporarily modified during the original export (EXPORT-* clones);
  **all were deleted** — verified zero leftovers. Re-exports will do the same dance.
- `PX_PER_UNIT=800` — 57.39 units, so a **45,912 px** page. Has NOT had a human trackpad
  feel-pass yet. `HOVER_PASS` rides on the same unit, so retuning `PX_PER_UNIT` changes
  how long the s5 hover pass takes in seconds; re-check it against the ~1.5s spec.
- **A fresh clone can't re-run the s15 capture** — `Reference Projects/` is gitignored
  (~1.1 GB). The captured `quiz-*.webp` frames are committed, so the page is complete;
  only re-capturing needs the reference app back.

## 2026-07-29: the s7 swipe home (wall-clock)

Scene 7 used to be a straight cut — the cursor slid to the tab and the nav slid down over a
feed that was still parked 7,476 px deep. Now it earns the switch: **the s3/s4 swipe played
upside down**, then a click on the MY COMPLEX tab. Details in CLAUDE.md; the parts worth
knowing before touching it:

- **The fling home is the second wall-clock beat on the page** (the s6 reaction wall is the
  other — the "only element" claim in CLAUDE.md was corrected). Scrubbed, ~7,000 px of
  inertia only travels while the wheel turns, which turns a flick into a chore. So the whip
  is scrubbed (the drag is the reader's, 1:1 as in s4) and the RELEASE hands off to
  `AUTO.tl`. `AUTO` + a `gsap.ticker` gate in `boot()` is the whole mechanism.
- The gate is registered **after** the Lenis ticker, so within a frame it runs after
  ScrollTrigger has rendered the master timeline. That ordering is why the fling's value is
  the one that lands rather than a coin-flip. **Nothing in the master timeline may touch
  `#strip-latest` y after `AUTO.release`.**
- Three gate behaviours, all measured (see the verification below): it fires on the first
  forward crossing; it **force-completes** at `AUTO.snap` (the cursor reaching the tab) so a
  fast reader is never clicking the tab while the feed is still flying; and it hands the
  strip and nav straight back on a reverse scrub, including *mid-flight*.
- The nav is timed to be seated **before** the strip's top edge clears the screen top —
  the strip's y goes positive at ≈0.83 s of the fling and the nav lands at 0.77 s. Later
  than that and there is a white band above the feed for a beat.
- MY COMPLEX tab centre is Figma node `1838:87226` → nav-local (326.62, 126.85), stage
  (1066.6, 190.8), cross-checked against the label's ink in `nav-latest.webp` (1066.5,
  190.8). `CUR.s7` is that less `TIP_OFF`, so the **tip** lands on it. The old `CUR.s7`
  (1162,196) was inside the tab frame but 98 px right of the label, near the pill's edge.
- The tab press swaps the nav with a hard `set`, not the old slide-down: the bar is already
  on screen (the whip brought it back), so re-entering it would be a nav arriving twice, and
  the two arts differ only in which pill is filled — crossfading those ghosts.

**Verified** (scripts were throwaway; re-derive if this changes):

| check | result |
|---|---|
| park the timeline at the release, scroll no further | fling completes on its own → strip y **159**, nav y **0** |
| jump past `AUTO.snap` | already home, one frame, no wait |
| reverse before the release (settled *and* mid-flight) | strip handed back to −7010, nav to −170, fling stops dead, no creep |
| forward again | re-fires, lands at 159 |
| real wheel scrolling through the release (458 frames) | **0** backward jumps in strip y — no scrub/fling fight |
| full reverse scrub `end` → `s2` | no NaN transforms; lands strip 159 / nav 0, gate re-armed |
| dead scroll in s7 | 0.15 units / 120 px — tighter than every other non-zero scene |
| console | clean throughout |

Cost: s7 went 1.7 → 2.9 units, taking the page to 45.7 units / 36,560 px (was 35,600).
The s8 rebuild below then took it to 47.7 / 38,160 — see the header for the current figure.

## 2026-07-29: s8 picks the topics (coded pills)

Scene 8 was a cursor sliding to a button over pills that were **already picked** — Figma
baked the section (`1838:107337`) with Style / Bets / Watch / ComplexCon filled, so the
export had no unpicked state to show. Now Zack chooses SNEAKERS → SPORTS → COMPLEXCON and
only then hits CONTINUE.

**Why all eleven pills are coded, not the six that change.** Three approaches were tried:

1. *Synthesise the missing faces from the baked raster* — recover each label's glyph
   coverage from the pixels (`a = (px−bg)/(255−bg)` for an unpicked source, `(255−px)/250`
   for a picked one) and re-composite it over a freshly drawn pill. Attractive because the
   type stays literally Figma's pixels, so it can't mismatch the five pills left baked.
   **Rejected on measurement**: round-tripping a face the raster already has (rebuild
   Sneakers-off from Sneakers-off) left mean |diff| 4–5 with **max 177**, concentrated on
   the 1.128px ring — an analytically drawn ring doesn't land on Figma's to the pixel, and
   a 1px ring half a pixel out reads as a doubled edge. The script was deleted.
2. *Code only the six that change* — cheap, but the type is **Inter** and this page shipped
   no webfonts, so six coded pills would have sat next to five baked ones in a different
   face. Not viable without the font.
3. *Code all eleven, over an opaque block* — what shipped. The user pointed at
   `../10. My Complex All Hands/`, their hand-built HTML of these same pages, which has
   both `.chip` and `.chip.sel` **and** `inter-subset.woff2`. With the real font the
   mismatch problem disappears, and covering the whole block means nothing has to line up
   with baked art except the container, whose box comes from Figma.

**Details worth knowing.**
- Tokens were confirmed from two independent sources that agree exactly: Figma's design
  context (`#dfdfdf` / `#303338` rings at 1.128px, `#fff` fill, `#fff` / `#050505` ink,
  radius 33.846) and the All Hands build's `.chip`. Both use an **inset** ring — a real
  `border` would grow the box and shift every pill.
- The feed's section fill is `#101213`, sampled from the strip beside the block with a
  channel spread of **0.00**, which is what makes an opaque cover seam-free. Verified: the
  block's top edge is visible at the bottom of the screen during s7 and shows no band.
- Inter reproduces Figma's own text-node widths to **≤3.14px** (worst: Cover Stories,
  114 → 110.86), and Figma reports those widths as integers, so that is inside its
  rounding. Each pill's width is pinned to Figma's anyway and the label is centred, so the
  residual only means a fraction more padding.
- Coded rings land within **1px on every edge** of the baked ones (checked on Music,
  Verzuz, Pop Culture) — the leftover diff is rasteriser antialiasing, not misplacement.
- The four cursor beats are derived from the pill and button boxes (`PILLS`,
  `CONTINUE_BOX`), so moving a pill moves the cursor. `CUR.s8` was deleted.
- **The pills are flipped, and that is the least-bad option, not a good one.** The rows are
  8px apart and the "Zack" tag is 47px tall hanging 39px below the tip, so it always lands
  on a neighbouring row — no cursor placement can clear every one. Flipped, the tag falls
  into the feed's left margin for SNEAKERS and COMPLEXCON and clips **one** pill (Cover
  Stories) on the SPORTS press; unflipped it clips two (Verzuz + Watch). Nothing on row 3
  is a target or changes state. Raised with the user rather than moved — the label stays
  where Figma puts it.

**Verified**: picks come on in order at s8+1.5 / +2.2 / +2.9, persist into s9, and clear
cleanly on reverse; full reverse scrub `end → s2` has no NaN transforms; **zero** dead
scroll in s8; Inter loads on the real page (`document.fonts.check` true, computed family
Inter — an early measurement that said the widths were 13% off was a fallback font, not
Inter); console clean. Deploy set re-verified the way CLAUDE.md requires — recorded a real
page load's **61 resource requests** (62 files counting `index.html`) and diffed them
against `.vercelignore`: nothing fetched is excluded, and the woff2 ships, since the ignore
file is a deny-list. Page was 47.7 units / 38,160 px at this point.

## ⏳ IN FLIGHT (2026-07-29): swapping the baked strips for the live product pages

The user is replacing the composited Figma exports with the **real HTML pages** from
`../10. My Complex All Hands/` so interactions land on real elements. Agreed with them to
roll it out **page by page, keeping the prototype playable at every point** rather than
ripping all four strips out at once. Do not start a step until the previous one is verified
and they have reviewed it.

| # | step | state |
|---|---|---|
| 1 | asset pipeline (`tools/make-page-assets.py`) | **DONE, verified** |
| 2 | `home-editorial` → the phone's page for s1–s6 | **DONE, verified** |
| 3 | `home-feed` → s7–s12; retire the coded `#pills` | **DONE, verified** |
| 4 | `article.html` → new **s13.1** in `#gray-panel`, vote on rank 30 | **DONE, verified** |
| 5 | `rerank.html` → s14, drag row 3→4 | **DONE, verified** (the 6→7 swap was added then removed — it made the scene drag) |
| 6 | `fandom.html` → s17–s20; delete the strips; docs | **DONE, verified** |

**Geometry, measured and confirmed — this is what makes the swap tractable:**

- The pages are **390px** wide. The phone screen is **440px**: exactly ×**1.128205**. That
  is the same ratio that explains every token difference found during the s8 pill work
  (font 16→18.051, radius 30→33.846, ring 1→1.128), so the two builds are the same design
  at two scales, not two designs. Apply it as **`zoom`, not `transform: scale`**, so the
  page re-lays out and re-rasterises crisply instead of being resampled.
- `#gray-panel` (left, 277,97) and `#panel-rerank` (right, 1253,97) are **390×887** — the
  page's own width. So `article.html` and `rerank.html` go in **1:1, no zoom**. The gray
  slab was always a placeholder for the article page.
- Page heights at 390px: home-editorial 9964 · home-feed 8829 · article 33615 ·
  rerank 2740 · fandom 6870. These do **not** match the strips they replace, so every
  `POS` offset and every in-screen `CUR` beat has to be re-derived against live layout.

**Step 1, done.** `tools/make-page-assets.py` imports the five pages into `pages/`.
It exists because the pages fetch **101 MB** of images — authored at source resolution, the
worst a 4096×3072 JPEG that renders 267px wide. Each raster is resized to 2× the size it
actually renders at on this stage (per-page: ×1.128205 for in-phone pages, ×1 for panels;
an asset shared by both gets the larger) and re-encoded to WebP q82. AVIF and SVG are copied
untouched — the article and rerank pages are already AVIF and weigh 1.2 MB and 0.3 MB all
in. The font URL is repointed at the one copy in `vendor/`.

Result **101.23 MB → 6.75 MB (93% smaller)**, and verified: all five pages have
**byte-identical scrollHeight** before and after (so the offsets derived from them are
safe), mean pixel diff 0.0–2.6 with ≤0.5% of pixels differing by >40 (WebP noise on photos,
confirmed indistinguishable side by side), zero 404s, zero failed requests. Re-runnable;
`--report` measures without writing. **`pages/` must be committed** — the source folder is
a local-only sibling, so a fresh clone cannot regenerate it (same reasoning as the s15 quiz
captures).

**Known temporary cost of the incremental rollout:** `.vercelignore` is a deny-list, so
`pages/` (7.4 MB) ships from now on, while the strips it will replace are *also* still
shipping. The deploy carries both until step 6 retires the strips. Do not "fix" this by
ignoring `pages/` — step 2 starts fetching it immediately.

**Step 2, mounted.** `#strip-latest` is gone; `#page-latest` is a `.page` wrapper holding an
iframe of `pages/home-editorial.html`.

- **The nesting is deliberate**: the iframe keeps its authored **390px** width so the page
  lays out as designed, and carries the `zoom` so it *rasterises* at 440 — crisp glyphs
  rather than a 12.8% resample. The **wrapper** carries the translateY and has no zoom, so
  every scene offset stays in plain stage px. Put the zoom on the moving element instead and
  all the offsets silently come out ×1.128.
- **`pointer-events: none` is load-bearing.** Every page ships a `data-goto` click router
  that calls `location.href`; one stray click would navigate the frame out of the prototype.
- **Offsets: new = old − 159, and the 159 is measured, not assumed.** The old strip was
  `.main` alone with the nav as a separate 159px image; the live page is `.s01` — which
  measures exactly 159 tall — followed by `.main`. So `POS.latest` went
  `{159, −4346, −7476}` → `{0, −4505, −7635}`.
- **`#nav-latest` is deleted.** None of the three feed pages has a sticky nav, so the nav
  scrolls off with the content by itself. The s4 slide-away tween and the fling's nav-return
  tween are both gone — the nav now arrives simply because the page's top does.
- **Beats that aim inside a page are resolved, not copied.** `PAGE_TARGETS` +
  `resolvePageTargets()` (run in boot before `buildTimeline`) name the *element* and write
  the beat into `CUR`. s6 resolves onto the story card's `.i20 .heart-in` glyph, 15.7px left
  of the old hand-placed number — the old one was slightly off the icon. s7 resolves to
  **(1064.19, 188.42)**, matching the Figma-derived fallback (1064.2, 188.4), which is a
  strong independent check that page and export are the same design. The static
  `CUR.s6`/`CUR.s7` entries are kept as fallbacks so a failed lookup degrades, not crashes.
- `buildDom` now skips a missing strip holder — expected during this migration, not a bug.

Verified: the fling home lands the live page at exactly y=0 with no further scrolling;
reverse before the release hands back to −7169 (`POS.latest.s5` + the 466px drag); full
reverse scrub `end → s2` has no bad transforms and returns to y=0 at s1; timeline length
unchanged at 47.7 units; no GSAP "target not found" warnings; console clean.

**The s6 tray still registers — checked, because it was the obvious thing to break.**
`#picker` is a composite with the old strip's content baked into its translucent fill, and
CLAUDE.md flags it as fragile ("the tray only lines up while the latest strip rests at
`POS.latest.s5`"). Swapping what is behind it is exactly the change that should have broken
it. It did not: shooting s6 with the tray `display:none` and again with it shown, then
correlating edge maps inside the tray across ±14px of vertical shift, peaks at **dy = 0**
(0.395, against 0.18 and 0.16 either side). The baked backdrop lands on the live content.
That follows from `POS.latest.s5` being derived to put the card where the storyboard has it,
which is the same place Figma's Scene 06 sampled the tray's backdrop from.

A first read of the frame looked like the feed text was ghosting. It is not — the text under
the tray is *dimmed* and the text outside it is crisp, and the tray's rounded right edge
crosses a line mid-word, so "With Stunning" is half dim and half black. That is what a
translucent panel over text does. Worth knowing before someone else "fixes" it.

The fragility itself is unchanged and still real: if the page content or `POS.latest.s5`
moves, the baked backdrop will desynchronise, and the durable fix is then to rebuild the
tray as CSS with a real `backdrop-filter` over the iframe — now possible, since what is
behind it is live DOM rather than a flat image. That needs clean glyph art for the five
faces; `react-wall.webp`'s 4×5 grid **does contain all five** (sunglasses r1c0, angry r0c2,
surprised r0c3, heart r4c0, fire r4c1), but on opaque black with dark outlines, so keying it
off black would eat the outlines. Getting them from Figma would be the way in.

**Step 3, mounted.** `#strip-myc` → `#page-myc` (`pages/home-feed.html`), `#nav-myc` deleted.

- **The coded `#pills` block is gone, and so is the `@font-face`.** The live page ships the
  chips as real `.chip` elements — with the *same* four pre-picked (Style / Bets / Watch /
  ComplexCon), so that state still has to be undone. `prepareChips()` strips `.sel` off all
  eleven and stacks a `.sel` **clone** over the three Zack picks, at opacity 0 for the
  timeline to bring up on each press. A clone rather than a class toggle because a class flip
  is not something a scrub can interpolate or reverse, and the two faces differ in fill — the
  same reason the FOLLOW callout has two faces. Chips are matched by **label**, not index, so
  the page is free to reorder them. `vendor/inter-subset.woff2` stays: the pages load it
  themselves from inside their frames.
- **The −159 nav shift holds for s7/s8 and nowhere below.** The chips land at page y 933 =
  the strip's 774 + one nav, which confirms it there. But live `.main2` is 9801 tall against
  the strip's 8324 — ~1477px of content was added — so applying −159 deeper put **s13 on the
  quiz card and s15 past it**. The deeper offsets are therefore derived the other way round:
  take the storyboard's cursor tip for that beat and solve for the offset that puts the
  target under it, which preserves the storyboard's framing of the cursor.
      s12  poll option 1  under tip y 518  → **−3526**
      s13  WNBA headline  under tip y 392  → **−4048**
      s15  START QUIZ     under tip y 811  → **−7751**
  Confirmed by eye: s12 frames the poll with the cursor on its first option, s13 frames the
  WNBA card, s15 puts the cursor on START QUIZ. s9 keeps −1220 (old −1061 − 159); the cursor
  lands on a card's action row, which is the beat.
- A useful side-effect: s12's poll and s13's WNBA card are **adjacent** in the live page
  (3507 and 3861), so the s12 → s13 move is now a short scroll rather than the old
  4,000px whoosh — which is exactly the "pause on this article" the user described.

Verified: reverse scrub `end → s2` clean, no bad transforms, `#page-latest` back to y=0;
timeline still 47.7 units; zero dead scroll in s8/s12/s14/s15; console clean. Deploy set
re-recorded: **196 files / 13.38 MB**, nothing fetched is excluded, and the retired
`strip-latest*`, `strip-myc*`, `nav-latest`, `nav-myc` assets are **no longer fetched**.
10 strip files remain in the set — `strip-rail` and `strip-fandom`, which step 6 retires.

**Step 4, mounted.** `#gray-panel` was an empty dark slab placeholder; it is now a clipped
viewport onto `pages/article.html`, and there is a new scene label **`s13.1`** (1.25 units).

- **The side panels mount 1:1.** `#gray-panel` and `#panel-rerank` are 390×887 — the pages'
  own authored width — so no zoom. `mountPages` now **reads** the zoom off each frame
  (`PAGE_Z[id]`) instead of assuming the phone's 1.128205, which is what lets a 1.128 phone
  page and a 1:1 panel page coexist. `PAGE_TARGETS` entries can name their own `origin`, so
  a beat can resolve against a panel instead of the screen.
- **Parked on rank 30 (Paige Bueckers), derived not guessed.** `ART.park` is
  `ART_INSET − .ecard.top`, so the entry's card sits 40px below the panel's top edge. The
  card is 775px and the panel 887, so it frames whole.
- **The vote's percentages are the product's own.** `.evote-res` is `display:none` and its
  figures are **computed by the page's vote script**, not present in the markup — flipping
  classes alone reveals an empty row. So `prepareArticle()` lets the real handler run once
  (`btn.click()`), which writes the real tally, then takes the classes back off. The numbers
  stay in the hidden row and the timeline only has to reveal it: 30% (121) / 36% (144) /
  34% (136), computed by the product, nothing invented.
- **The flip is driven off a PROXY, not `set({className})`.** Verified failure: with
  `set(className)` the reverse scrub took `voted` off `.evote` but left `on` on the button —
  GSAP would not restore an empty starting class. A proxy tween re-derives both classes from
  its own value in either direction, and a scrub that jumps clean past it still renders it at
  its end, so the state cannot be skipped. Checked at before / after / reverse-out /
  forward-again / far-past: all correct.
- **The cursor is flipped**, as the storyboard's own s13 beat is for this panel. Unflipped,
  the "Zack" tag lands squarely on the percentages it just revealed; flipped it sits off the
  panel's left edge over empty stage.
- The vote grows `.evote` 68 → 106 and pushes the rest of that card down 38px. That reflow is
  the product's real behaviour and is contained inside the frame, so it is allowed — but the
  document ends up 38px taller than the height `mountPages` measured and the frame does not
  grow, so the page's very bottom clips. No scene shows it.
- **Gotcha worth remembering**: `.page` starts `visibility: hidden`, and `#gray-panel`'s own
  fade only reveals the *slab* — the frame inside it stays hidden. The panel came up empty
  until s13 set `autoAlpha: 1` on `#page-article` too.

Verified: reverse scrub `end → s2` clean; dead scroll in s13.1 trimmed 240px → **40px**;
timeline 48.95 units / 39,160 px; console clean.

**Step 5, mounted.** `#panel-rerank` was a flat `panel-rerank.webp`; it is now a viewport onto
`pages/rerank.html`, and s14 performs two real drags. Scene grew 1.8 → **4.5 units**.

- **No scrolling needed.** The editor's `.s5shell` is 390×887 — exactly this slab — so it
  mounts 1:1 and never moves. `assets/panel-rerank.webp` is no longer fetched.
- **The page opens on a full-screen onboarding sheet** (`.s5onb`, `position: fixed`,
  z-index 70 — "THINK YOU KNOW BETTER?"). `prepareRerank()` dismisses it through the page's
  **own Skip button** rather than by hiding it, so whatever state that path sets gets set.
- **The page's real drag code is deliberately unused** (the user's call): it is built over
  Pointer Events for a live pointer and cannot be scrubbed backwards. Instead the rows move
  directly — the dragged row and the one it displaces swap by exactly one `ROW_H` (68px,
  measured), with the dragged row tracking the cursor **1:1** the way the s3/s4 swipe does,
  lifted on `zIndex` + a 1.03 scale for the duration of the move.
- **Badges label POSITIONS, not rows**, so they renumber on the drop while the names move:
  3↔4 then 6↔7. Driven off a proxy, like the s13.1 vote, so a reverse scrub restores them.
- The cursor takes hold of the row's `.s5handle`, which is the real drag affordance, and stays
  unflipped so the tag falls off the panel's right edge over empty stage.

**The bug worth remembering: a scene's span silently truncates its own beats.** At the first
attempt s14 was 3.6 units while its beats ran to 4.41, so **the second drag never played** —
it started past the scene boundary and was simply never reached. Nothing errored and the
frame at the scene's end looked plausible; only walking the row transforms at several scrub
positions caught it. Budget a scene from where its last tween actually lands, and verify
per-beat state, not just the closing frame.

Verified: both drags land (Tamika 3→4 at +68, Maya 4→3 at −68; Breanna 6→7, Candace 7→6),
badges renumber, and a reverse scrub puts every row and badge back — checked at start /
after each drag / reversed-out / forward-again. Reverse scrub `end → s2` clean; dead scroll
in s14 is 72px; timeline 51.65 units / 41,320 px; console clean. Deploy set: **239 files /
14.47 MB**, nothing fetched is excluded. 10 strip files remain — all `strip-fandom` and
`strip-rail`, which step 6 retires.

**Step 6, mounted — the rollout is complete.** `pages/fandom.html` drives s17–s20, and every
strip is retired.

- **`strip-rail` is gone entirely, not replaced.** The "fandoms rail" was its own strip export;
  in the live build it is just a **card inside home-feed** (page y 4800, 574 tall). So s16 is a
  scroll to it rather than a crossfade between two strips — fewer moving parts, and what
  actually happens in the product.
- **The fandom page's nav is 92px, not 159** — it has no tab row. The old `s17: 95` was one nav
  height, the same pattern as the other two pages. `#nav-fandom` and its `clip-path` reveal are
  both deleted; the page carries its own nav.
- `POS.fandom` re-derived: `{ s17: 0, s18: −649, s19: −1617, s20: −3118 }`. Live `.main3` is
  6786 against the strip's 8301 (×0.817), so s18 frames the fandom tabs near the top of the
  screen and s19/s20 carry the old deltas scaled by that ratio. All five checked by eye — every
  scene lands on real content, none blank.
- **`.vercelignore` now names the 25 retired files** (four strips' tiles, three navs,
  `panel-rerank.webp`) — 5.05 MB. They are no longer fetched, but the ignore file is a
  **deny-list**, so without this they would have kept shipping. That is precisely the leak the
  file's own comment warns about.

### The rollout, end to end

| | | |
|---|---|---|
| deploy | 61 files / ~10 MB | 255 files / 12.7 MB *(at the time — see the header for current)* |
| timeline | 44.5 units / 35,600 px | 50.8 units / 40,640 px *(at the time)* |
| strips + navs | 7 exports driving the phone | retired, kept as source |
| in-page interactions | baked pixels | the product's own DOM |

**What to re-derive when a page changes** (this is the part that bites): the pages' content
lengths do not match the strips' and will not match each other's between versions. Arithmetic
shifts (`−159` for a nav height) hold only near a page's top; deeper down they put scenes on
completely wrong content — applying `−159` below home-feed's insertion put **s13 on the quiz
card and s15 past it**. The method that works: take the storyboard's cursor tip for the beat
and solve for the offset that puts the target under it, then look at the frame.

**Three failure modes worth carrying forward**, all found the hard way here:
1. **A scene's span silently truncates its own beats.** s14 at 3.6 units while its beats ran to
   4.41 meant the second drag *never played* — no error, and the closing frame looked fine.
   Verify per-beat state, not just the frame at the scene's end.
2. **`set({className})` does not reverse** an empty starting class. Use a proxy tween.
3. **A `str.replace` that does not match fails silently.** Two edits in this rollout no-matched
   because an earlier edit had already replaced their anchor. Assert on anchors.

## 2026-07-29 (later): two timing corrections from the user

- **The +30 XP toast now follows the vote.** It was firing in s13, a whole scene before the
  vote it congratulates — "You List Voted!" arriving before Zack had voted. Moved into s13.1
  at `press + 0.14`.
- **The rerank keeps one swap, 3 → 4.** The second (6 → 7) made the scene drag. `RERANK_DRAGS`
  still takes any number of pairs, so it is one line to put back; if you do, re-budget s14 —
  see below.
- **Both changes hit the same trap, again**: a scene's span silently truncates its own beats.
  s13.1 was 1.25 units and the toast started at 1.22, so it never appeared — no error, and the
  frame at the scene's end looked fine. s13.1 is now 1.9 (press at 1.08, toast fully in at
  1.57, then a deliberate hold) and s14 is 3.0 for the single drag. **Third time this bug has
  cost a beat.** When you move or add a tween, re-check the span it lives in.

Verified: the toast is absent through s13 and pre-press, in by s13.1+1.6, held to the scene
end, and pulled out by s14; the vote and the toast both clear on a reverse scrub; only the
3↔4 swap remains and it reverses; reverse scrub `end → s2` clean; console clean.
Page was **50.8 units / 40,640 px** at this point.

## 2026-07-29 (later still): the Welcome tile's card + keychain

The user updated `home-feed.html` in the All Hands build — the onboarding card and keychain in
the "Welcome to MY COMPLEX" tile are new assets (`s2-idcard.png`, `s2-keychain.png`) with
better drop shadows. Picked up by re-running `tools/make-page-assets.py`, which is what that
script is for.

**One change to the tool went with it.** Anything with an **alpha channel** now converts at
q95 with lossless alpha, instead of the q82 used for photos. Alpha means cut-out art — props,
logos, exactly these two — and a soft shadow's falloff is where lossy banding and halos show
up worst. That is also the quality the repo's other composite scripts use for flat UI art.
Cost: the pipeline output went 6.75 MB → 8.01 MB, deploy 12.7 MB → 13.9 MB.

Verified: the tile is pixel-faithful to the source render (mean |diff| 1.15, 1.35% of pixels
over 16 — WebP noise on the photo behind), both shadows present in the prototype at s7, and
**`scrollHeight` is still 8829** so every `POS.myc` offset stays valid — that was the check
worth doing, since a taller page would have silently moved five scenes. Reverse scrub clean,
console clean, nothing fetched is excluded.

**No `?v=` bump needed for `pages/`**: `vercel.json`'s cache rule only covers `/(assets|vendor)/`,
so `pages/` and `pages/assets/` revalidate and a regenerated file always lands. If anyone adds
a long-cache header for `pages/`, they take on the stale-asset problem the `?v=` rule exists to
solve — the filenames inside those generated pages do not change between versions.

## 2026-07-29 (later still): the comments tray is coded

Two problems with s9/s10, both the user's report:

1. **The click that opened the tray landed on nothing.** `CUR.s9` was a hand-placed number
   whose tip sat 39px right of the card's comment icon, in the gap between comment and
   bookmark. In home-feed an action row is `.eact` ×3 (react, comment, bookmark), so it is
   index 1 — now resolved through `PAGE_TARGETS` like the rest, and it lands on (845, 906).
   Note the class differs from home-editorial's (`.act-row`/`.i20`): **do not assume one
   page's class names hold in another**, which is what made the first probe report "no action
   row in view" when the row was right there.
2. **`drawer.webp` baked a pre-filled comment and its character count into the composer.** The
   first attempt patched over both with coded text on flat-colour patches. It worked and it
   was verified — but the user's call was that patching baked art is fragile and will rot, so
   **the whole tray is now coded** and the asset is retired.

**The tray is lifted from the sibling `3. Article Comments` prototype** (`live-inject.js`),
which the user pointed at — a factored comment component with a composer, counter, post
button, likes and threaded replies. Classes keep its `tlc-` prefix so they cannot collide
with anything here, and its avatars are **initials**, so the tray needs no image assets at
all. That also settled what Zack's avatar should be: an initial circle in the cursor tag's
orange, which reads as "you" rather than borrowing a stranger's face.

- **The composer's type is 28px against the component's 14.** Deliberate, user's call: this is
  a demo watched on a shared screen and the comment being typed is the point of the scene, so
  at the product's real size it is unreadable at playback scale.
- The post button reads **POST**. The export's button said "LOUD" (the product's branded
  label) and that carried into the coded tray by transcription; the user renamed it. The beat
  is now resolved from the button's own box rather than the export's, because the coded button
  is sized to its label — so relabelling it moves its left edge, and a copied number would
  quietly slide off centre. It resolves through `offsetLeft`/`offsetTop`, **not**
  `getBoundingClientRect`: `#stage` is scaled to fit the window, so a rect would be viewport px
  and the beat would move with the browser size.
- **Typing and posting are one proxy.** `{n, sent}` with `onUpdate` — the box text, the
  counter, the caret, the box fade and Zack's comment appearing all derive from it, so a
  reverse scrub undoes the post as cleanly as it undoes the typing. A `display`/class flip on
  its own would not come back, which is the trap already recorded for s13.1.
- `Array.from`, not `slice`, for the reveal: the string ends in two emoji and slicing a
  surrogate pair renders a replacement glyph.
- The caret is an **inline** element, so it follows the text with nobody measuring a width,
  and it is static rather than blinking — a blink would be a third wall-clock motion and buys
  nothing over a caret parked after the last character.

Verified across empty → typing → typed → posted → into s11 → reversed → far back: the box
fills and empties, the counter tracks and resets, and Zack's comment is the **first** `.tlc-cmt`
in the list, hidden until the post. `drawer.webp` is no longer fetched and is now named in
`.vercelignore`. Reverse scrub `end → s2` clean; console clean; 254 files / 13.8 MB; page
52.6 units / 42,080 px.

## 2026-07-29 (later still): the XP popup is the Scene 11 video

The user dropped `assets/Scene 11/360-Degree Animation 1.mp4` — the +100 XP popup with its
charm rotating in 3D — and wanted it to *be* the popup, played frame by frame on scroll.

**It is a sprite sheet, not a `<video>`, and that was forced rather than chosen:**

- **The file cannot be seeked.** `video.currentTime = t` leaves `currentTime` at 0 for every
  value — `python3 -m http.server` does not implement HTTP **Range**, so the browser cannot
  seek at all locally. Worth remembering well beyond this scene: it makes any local video work
  look broken. Even served properly the file has an `stss` table (not all-keyframe), so
  per-frame seek accuracy would be at the decoder's mercy.
- Scrubbing here has to be deterministic and reversible, which a frame sequence is and a
  seeking video is not.

`tools/make-xp-frames.py` extracts once into `assets/xp-frames.webp` — 63 frames, 8-col grid,
4296×5768, **1.45 MB** — and s11 sweeps a proxy across it, positioning the sheet with a
**transform** so only one cell shows. Pure transform, so it obeys the animate-transforms-only
rule and reverses for free.

**Three traps, all hit:**

1. **Extraction must capture during PLAYBACK** (`requestVideoFrameCallback`). Seek-then-draw
   with `onseeked` returns a *stale* frame, so all 12 of my first samples came out
   byte-identical — and nothing errors. The contact sheet looked plausible until a pixel diff
   said every frame was the same.
2. **The card's corners went square.** The video's frames are RGB, so the card's rounded
   corners are drawn against white and disappear over the s10/s11 scrim. Fixed with
   `border-radius: 15.5px` — the retired asset's own radius, measured off its alpha channel
   (31px at 2×), not guessed.
3. **`#xp-modal` is inside `#screen`**, so its `left`/`top` are screen-relative: the card is at
   stage (781, 300.13), not (41, 236). Cost me one wrong crop while checking the corners.

Also: the container's scale-pop is gone. The video opens with its own entrance, so popping the
container as well played the arrival twice. The box now uses the **video's** aspect (0.7447)
centred where the old card was. `assets/xp-modal.webp` is retired and named in `.vercelignore`;
the `.mp4` was never in the deploy (`*.mp4` was already ignored).

Sizing rationale, in case it needs revisiting: the sheet is built at **1.5×** display size, not
2×. A sprite's decoded footprint grows with the square of that, and 2× would have put ~176 MB
of bitmap in memory; 1.5× is ~70 MB for content that is large text and a shiny object. If it
ever looks soft on a retina screen, raise `RETINA` in the tool and re-run — but check the
decoded size, not just the file size.

Verified: 63 frames step correctly across the grid, the sweep reverses, dead scroll in s11 is
80px (down from 320 — most of the new span is reclaimed, not added), `xp-modal.webp` is no
longer fetched, no `.mp4` in the deploy, nothing fetched is excluded, console clean.
254 files / 15.19 MB; page 53.4 units / 42,720 px *(both at the time — the header carries the current figures)*.

## 2026-07-29 (later still): the s12 poll actually gets voted on

The user's report: the cursor moved onto a poll option, "clicked", and the +20 XP toast dropped —
with nothing happening to the option. The reward arrived for an interaction that was never shown.

**The live page already had all of it**, which the user pointed out (`10. My Complex All Hands`):

- `.bars` carries class **`unvoted`**. While it is there:
  `.bars.unvoted .bar-fill { background: transparent; width: 20px !important }` and
  `.bars.unvoted .bar-pct { visibility: hidden }` — which is exactly why the options render as
  plain white pills with no percentages.
- Voting **removes `unvoted`** and adds **`chosen`** to the picked bar
  (`box-shadow: inset 0 0 0 2px #000` — the selection ring). The fills take their real widths,
  the percentages become visible, and the winner's `.bar-fill.win .bar-ink` shows.

So the reveal is two class changes plus recomputed numbers, and the numbers come from the page's
own poll script — `preparePoll()` runs the real handler once, snapshots the before and after
states, restores the before, and the timeline swaps between them off a proxy. Nothing invented,
nothing hard-coded, and it reverses.

- The target is **the bar under the cursor's tip** (computed from `CUR.s12` and `POS.myc.s12`),
  not index 0. The beat and the selection therefore cannot drift apart, and reordering the poll
  cannot silently select the wrong row.
- **The emphasis had to move onto the pick, and the first pass got this wrong.** The user's
  report was blunt and correct: the cursor was on option 1 while option 2 looked selected. The
  cause is a real product-design distinction I had reproduced without thinking about it — the
  page's own comment says "the black `.win` treatment follows whichever option is leading", so
  `.win` marks the *vote leader* (black fill, `.bar-ink`'s inverted copy, dark percentage) while
  your own choice gets only `chosen`'s 2px ring. Correct on a real screen where you know what
  you tapped; wrong in a storyboard where a viewer is being shown a selection. So `applyPoll`
  now **moves `win` onto the chosen bar and strips it from every other**, which is a class move,
  not a restyle — `win` is the page's own class and every `.bar-fill` already ships a
  `.bar-ink`. The bar widths still encode the real tally, so the chosen bar's black fill is only
  as wide as its share (16%); that is the honest reading, not a defect.
  **Lesson worth keeping**: reproducing a product's interaction faithfully is not the same as
  making it legible in a storyboard. Ask what a viewer is meant to read, not only what the
  product does.
- The toast moved from `s + 1.45` (0.02 units after the press, effectively simultaneous) to
  `press + 0.25`, so the selection reads before the reward.

**The bug I introduced and caught:** the first version wrote the percentage with
`.bar-pct.textContent = '16%'`, which **destroys the inner `<p class="trim">`** — and with it
the styling that right-aligns the figure. The symptom was percentages sitting centred over the
option text instead of at the bar's right edge. Caught by rendering the source page's own voted
state and comparing, not by reading the DOM. Write to the inner `p`.

Also worth knowing: `.bar-fill` carries the page's own `transition: width 450ms ease-out`. It is
deliberately left in — it is the product's reveal, it is short, and it hangs off a discrete
press — but it means a screenshot taken inside that window catches the bars mid-growth, which
cost one confusing frame during verification.

Verified pre / voted / reversed / forward again / far past: `unvoted` and `chosen` toggle
correctly, the figures track (15%→16%, 40%→39%), the inner `p` survives every swap, reverse
scrub `end → s2` clean, console clean.

## 2026-07-29 (later still): the 4→5 seam is continuous

The user felt "a little tiny break" between scenes 4 and 5. Measured rather than eyeballed —
sampling `#page-latest`'s y across the handover and flagging every window where the feed moves
under **0.15px per px of scroll** — it was **392px of scroll**, roughly half a second at a normal
reading pace. Real, and worth fixing.

**It was the fling's ease, not the scene length.** s4's span had already been trimmed twice
(2.4 → 1.9) so its dead tail was only 48px. The rest was the `power3.out` fling *crawling*: the
higher the power, the earlier it reaches 96% and the longer it then creeps — power3.out at 55% of
its duration, power2.out at 66%, power1.out at 80%. So a high power buys a dramatic launch and
pays for it with a long dead tail, which is exactly what a scene seam cannot afford.

Changed: the fling is **`power1.out` over 1.0** (was `power3.out` over 1.5), s4's span is
**1.34** — ending precisely on the landing — and s5's feed move is **`sine.inOut`** (was
`power2.inOut`), sine being the fastest-ramping of the inOuts and so the one that spends least
scroll crawling out of the seam.

Result: the 4→5 seam has **zero** near-still scroll. The two windows that remain in this stretch
are both deliberate and were left alone:
  * 80px on the s3/s4 backswing — the feed is *supposed* to hold while the cursor winds up;
  * 168px late in s5 — the feed settles before the hover pass, which needs it still.

s4 still lands on the article list (checked: the fling's landing frame is the same content it
always was), s5 passes through continuously, and the hover pass still starts settled. Page was 52.84 units / 42,272 px after this change, 448px shorter than before.

**Method worth reusing**: the "does this feel continuous" question has a number behind it. Sample
the moving element's position across a seam and look for windows where it barely moves per unit
of scroll; a stall over ~200px reads as a break, under ~100px does not.

## 2026-07-29 (later still): the s19 editorial satellite was re-exported

The user updated `assets/Scene 19/Latest Editorial.png`. It is not a re-crop — the **content
changed**, from an article card ("Playboi Carti Returns With New Song and Video 'Ketamine'") to a
poll card ("Vote for Best Playboi Carti Album"), and it is **55 stage px shorter** (565×1009 →
565×899 at 2×, i.e. 282.5×449.5 displayed).

**The height change forced a positioning decision, and the animation settled it.** `main.js`
computes each satellite's s19 fly-out from its **centre**
(`dx = 960 − (offsetLeft + offsetWidth/2)`), so:
  * hold the *top* at 86 and the centre moves — the explosion path changes;
  * hold the **centre** at its old 338 and the path is bit-identical.
So `top` went 86 → **113.25**, and the fly-out vector is unchanged at (447, 202) — verified, not
assumed. The fan also stays balanced: the gap down to `#sat-comment` goes 52 → 79px, against 68px
in the right-hand column, so the two columns read more alike than before rather than less.

Both old and new exports are **shadow-free** (0.2–0.3% soft alpha, i.e. edge antialiasing only),
so the CSS `drop-shadow` on `#sats img` stays correct and there is no doubled shadow.

`?v=` bumped 2 → 3 on the `<img>`, per the cache-buster rule — the filename is unchanged, so
without it browsers would serve the old card from cache.

**⚠ Figma node `1838:120852` NO LONGER EXISTS** in the file (the metadata call 404s), which is why
the size comes from the export and the position from the preserved centre rather than from node
bounds. Recorded in `assets/manifest.json` with `figmaNodeId: null` — **ask for the new node id
before re-exporting this one**, or the position cannot be re-derived from the design again.

Verified: the asset loads at `?v=3`, box (372, 113, 283, 450) with centre y exactly 338, all four
fly-out vectors unchanged, the fan reads balanced, reverse scrub clean, console clean, nothing
fetched is excluded. 254 files / 14.66 MB.

## 2026-07-29 (later still): Scene 19 gained two merch tiles

Scene 19 (`1838:120893`, canvas x=48480, so **stage = canvas − 48480**) now has **six** cards, not
four. The two new ones are "Primary Product Tiles" — merch: a white *Hoodie Box Set* card far
left (`2077:8910`) and a dark *NBA Playboi Carti × M&N jersey* card far right (`2077:8969`).
Both are now placed. Also confirmed: "Latest Editorial" is `1974:8918` now — the old
`1838:120852` really is gone, which is why the previous task could not read its bounds.

**These two are the one exception to the upright-export rule**, and it is a forced one: Figma
reports only their **rotated bounding box**, so recovering an upright card would mean un-rotating
in PIL and resampling the whole thing. Their rotation is therefore baked into the art and
main.js rests them at 0° (the s19 spin still applies on top, so the fly-out is unaffected).

**The dual-source matte, because neither export route gives 2× *and* alpha:**
- `download_assets(png, scale 2)` → rotated bbox at 2× but **fully opaque**; the transparent area
  comes back filled, and since the left card is *white* it cannot be keyed out.
- `get_screenshot(contentsOnly: true)` → genuinely transparent but **1× only**. `maxDimension`
  only caps a render; it will not upscale past the node's natural size (asked for 860, got 368).
So: RGB from the first, alpha from the second upscaled 2× with LANCZOS. The card edges are
straight lines, so the matte is effectively exact — verified on a mid-tone background, which is
the only way to see a halo (white hides it on one card, black on the other).

Checked for a baked shadow before shipping: soft alpha (`8 < a < 240`) is **0.8%**, i.e.
antialiasing only. A real baked shadow is several percent and would have doubled against the CSS
`drop-shadow` on `#sats img`.

**Positions match the CENTRE, not the top-left** — rotation is about the centre, and main.js
derives each card's fly-out from its centre, so centre-matching is both faithful to the design and
correct for the animation. Left → css (34.15, 405.50) 367.5×430; right → (1646.45, 348.80)
369×430.5.

Two things that look wrong and are not: the right card is **cropped by the stage's right edge** —
its box runs to x 2015 in a 1920 frame, and Figma crops it the same way; and the left card
**overlaps** the UGC comment card by ~50px, which the design also does, with the merch tile in
front (matching Figma's child order).

Verified: six satellites, all with correct boxes and centres; the merch tiles settle at 0° and
spin during the fly-out; s20's recede picked them up for free because it iterates `#sats img`;
s19's stagger still fits its span (last card lands at s+1.8 of 2.0 — worth checking, since a
scene truncating its own beats has bitten three times); reverse scrub clean; console clean;
256 files / 14.78 MB, nothing fetched is excluded.

## 2026-07-29 (later still): s19 card sizes + positions matched to the reference

The user supplied a reference render (`Feedback/Scene 31.png`) and a shot of the current state,
asking for the cards ~5–7% smaller and repositioned. All six boxes were re-derived from the
reference rather than nudged by eye.

**Method, worth reusing for any "match this comp" request:**
1. The reference is at **1:1 stage scale, cropped 66px each side** — established by detecting its
   phone, which comes out exactly 440×952. So reference stage coords = image coords + (66, 0). Do
   this registration first; the two images the user sent are different sizes (1788×1080 vs
   1788×1051) and neither is a plain scale of the stage.
2. Measure each card's **rendered** bbox with every other card hidden. Cards overlap here, and a
   connected-component pass merges the hoodie tile with the comment card into one blob — which is
   exactly what made the first automated comparison useless.
3. Per card, `k = target_bbox / current_bbox`, then scale the CSS box by `k` and **centre-match**
   to the reference. Centre, not top-left: rotation is about the centre and main.js derives the
   fly-out from the centre, so it is right for both composition and motion.

**The reference is not a uniform shrink** — the per-card factors came out 0.88–0.94, so applying
one number would have missed. Result, measured after the change: five of six cards land within
**±3px** of the reference on both position and size. The editorial card is within ±10px (about 2%
on its height).

That last 2% was chased and then deliberately abandoned. The bbox suggests it should be wider and
shorter; the corner diagonals say its rotation matches the reference (−48.49° vs −48.93° on the
same diagonal) and it should simply be ~4% smaller in both. Those two readings disagree because
the reference's card has a slightly different **aspect ratio** than the export — the content was
re-laid out, not just scaled — and because rounded corners plus a drop shadow make extreme-point
corner detection unreliable at small angles. Two contradictory fits at ±10px on an antialiased
edge is the point to stop, not to keep fitting.

Side effect worth knowing: **every centre moved, so every s19 fly-out vector changed.** Checked
that all six still point outward in a sensible fan (the merch tiles now travel furthest at
dx ±650, being outermost). The jersey card is also **no longer cropped** by the stage edge, which
is what the reference shows.

Verified: all six settle at opacity 1, s20's recede still clears all of them, reverse scrub clean,
console clean, dead scroll unchanged (s19 160px, s20 0).

## 2026-07-29 (later still): the XP toasts got the new coin, and got re-centred

The user updated the coin art in Figma and dropped `assets/General/{Exp.png, exp coin.png}` in.
All four toast nodes (`1838:113166 / 113788 / 114592 / 115423`) were already updated there, so
this was a re-export, not a patch over the old art.

**Neither Figma render path gives the asset on its own**, and that is why
`tools/make-toasts.py` exists. The toasts are the one overlay group still carrying a **baked**
shadow, positioned by their 440×299 render box at 0,0 in the screen, so a rebuild has to land on
exactly that canvas:

- `download_assets` @ scale 2 → the right 880×598 canvas and exact content RGB, but **fully
  opaque**: the phone screen's light background *and its rounded top corners* bake in. This is
  gotcha 2 in `export-assets.md` and it is not solvable with a single-background matte — the
  background is a gradient, and a black-shadow assumption gets the pill interior wrong (measured:
  alpha 105 where it should be 255).
- `get_screenshot` with **`contentsOnly: true`** → genuinely transparent, soft shadow intact, but
  it never upscales, so 1× only. **This is a better answer than the dual-background matting trick
  the older notes describe** — it needs no Figma edits at all. Worth knowing generally.

So: content RGB from the 2× export, alpha from the 1× render, the pill's own coverage re-derived
analytically from its rounded-rect geometry so the edge stays crisp at 2×, and the shadow solved
out of the 1× alpha (`s = (a − m)/(1 − m)`) before upscaling — a blurred field survives that, a
hard edge does not. Validated against `Exp.png`, which turned out to be the user's own transparent
**3×** export of toast-30: composited over the light UI it matches at **1.73/255 mean**.

**toast-20's node has no drop shadow and no 440×299 render box any more**, so there was no shadow
to lift. A pill's drop shadow is translation-invariant along its straight middle, so its shadow is
**spliced** from toast-30's by inserting plateau columns at the centre. Verified by prediction, not
assertion: deriving toast-80 (291px) and toast-120 (309px) from toast-30 (293px) lands within
**0.25/255 mean, 11/255 max**. A single-Gaussian fit of the shadow was tried first and was 35×
worse (8.8/255) — the splice is exact where the fit is a model.

**Then the user caught that they sat right of centre, and they were.** All four used to share a
left edge of x=85, which *was* centre while the old speech-bubble art made them 267–291 wide. The
coin is wider, every pill grew rightward, and toast-20 ended up 85/39. They are now at
`(440 − width)/2` — gaps equal to the half-pixel. Two notes:

- the shift is a **half-pixel at 1×** for three of the four, so it is applied *after* the 1×→2×
  upscale where every offset is a whole pixel (−46/−23/−21/−39). It costs the outermost ~23px of
  the shadow's left tail, where alpha is ≤ 11/255 and which the screen's overflow clips anyway;
- Figma's own toast-20 node is at **x=62 = (440−316)/2**, i.e. already centred. The other three
  are not. So centring is where the design was going, and the script does it rather than trusting
  the nodes.

Nothing in CSS or JS moved: `#toasts .toast` is still 440×299 at 0,0 and nothing measures a toast's
width. `?v=` bumped to 3 in `index.html`; `manifest.json` `bb` updated (widths 316/293/291/309, x
now 62/73.5/74.5/65.5 within the render box). Files got *smaller* — 172–190 KB → 59–62 KB each —
because the rebuilt shadow is clean instead of dither-noisy.

Verified: all four at full opacity on the live page, pills straddling the screen centre line, no
console errors, hidden at every rest point, clean reverse scrub, and a recorded page load fetches
all four at `?v=3` with nothing 4xx.

## 2026-07-29 (later still): the cursor stopped vanishing, and the I.D. card got a cause

User's report: "after scene 19 the cursor disappears". It did, explicitly —
`tl.to('#cursor', { autoAlpha: 0 }, s + 0.9)` in s20 — and s22 then **teleported** it back in with
a hard `set` at +0.6, which was 0.05 units **after** the card had already popped. So the cursor was
gone for two whole scenes and the card arrived with nothing having caused it.

The user's ask was the fix: the cursor should travel to the poster's profile picture and *that*
press should open the card.

- **s20**: fade-out gone. `cursorTo(tl, CUR.s20, s + 1.0, 0.6)` — arrives +1.6, presses +1.65,
  deliberately late so the press sits on the s20/s22 boundary instead of most of a scene away.
- **s22**: the card now **leads** at +0.1 and the stickers follow at +0.35 (they used to precede
  it). The `set` teleport and the arrow/tag re-alignment it needed are all gone; the cursor is
  already here and already flipped, so `cursorTo(tl, CUR.s22, s + 0.8, 0.5)` just glides it onto
  the card. Measured: press bottoms out at s22+0.05, card starts at s22+0.15 — **it opens as the
  finger lifts**.
- The beat **names the element**, per the standing rule: `PAGE_TARGETS.s20` finds the first
  `.post .ph .up-av` in view at `POS.fandom.s20`, same in-view scan as s6/s9. Good cross-check —
  it resolves to (776.09, 200.19) and the hand-measured storyboard fallback is (776.1, 200.2).
- Pose is **flipped**, like s12 at the same x: unflipped, the "Zack" tag sits straight over the
  name being clicked.

**And the poster was the wrong person.** Clicking one stranger produced a different stranger's
card, so the user asked for the DP and name to match. Both UGC posts on the fandom page are now
**Jordan Rose** with his photo (`tools/make-jordan-av.py`, from `assets/General/Jordan Rose`).
Three things about that:

- `.up-av img` has **no `border-radius`** — the circle is baked into the avatar's **alpha**, the
  way the existing avatars are. RGB keeps the full square photo *underneath* the transparent ring
  so a later downscale resamples real pixels instead of pulling a halo in at the edge.
- **The crop was judged at the true 32px, not zoomed.** The source is a wide shot; fitting the
  whole bucket hat in leaves the face an unreadable dark smudge at that size, so it crops into the
  hat's crown and lets the brim, sunglasses and beard identify him — the features the card's photo
  also leads with.
- **`pages/` is generated**, so the change is written into *both* places: a 512px master PNG into
  `../10. My Complex All Hands/assets/` and the 73px WebP the prototype fetches (matching the
  importer's own rule, `ceil(32 × 440/390 × 2) = 73`, q95 + lossless alpha). Without the master the
  next `make-page-assets.py` run would silently put the stranger back. `all-scenes.html` in that
  build was updated too, for consistency. The importer was **not** re-run — it regenerates all five
  pages and would pull in unrelated drift.

The old headshot (`pages/assets/269954e0-….webp`) is deleted — nothing referenced it, and the
deny-list would have kept shipping it. Its master survives in the All Hands build.

Verified: cursor `visible` at every probe from s18 to s23, tip dead-centre on the avatar, card
opacity 0 before the press and 1 after, **reverse scrub end → s2 reproduces every value exactly**
(position, arrow rotation, tag offset, card, scrim), no console errors, one fewer request than
before. Dead scroll: s20 **0**, s22 0.34 — both already in the table above.

## 2026-07-29 (last): the s22 badges fall under gravity, and the phone takes the hit

The eight badges under the I.D. card used to appear with `back.out(1.7)` — a scale-pop in place,
all eight the same, which is the one beat on the page that had no physics at all. They now drop in
from above the screen and pile up on the floor. `STICKERS` is **untouched**: the resting cluster is
still Figma's, only the arrival changed. New in main.js: `BADGE_DROP` (the per-badge table) plus
`BADGE_FALL / BADGE_SQUASH / BADGE_SETTLE / BADGE_CEIL` and the `SHAKE_*` constants. s22 went
**1.7 → 2.1** units (page 42,272 → 42,592 px, +0.8%).

Three decisions worth not re-litigating:

- **One gravity, not eight durations.** All eight start at the same ceiling (20px above the screen
  top, inside `#screen`'s `overflow:hidden` + `contain:strict`, so **nothing fades in** — a fade is
  the tell that a falling object came from nowhere) and the fall durations are solved from the
  heights, t ∝ √d, because `power2.in` is literally constant acceleration. Same duration for
  everyone puts the short falls in slow motion.
- **The bounce is gone — metal does not bounce** (user's note, mid-session). The first pass gave
  each badge a mass-scaled hop off the floor: heavy ones 5px, printed stickers 20px with a 2°
  flutter. It read as rubber. Replaced by a squash against the floor (bottom `transformOrigin`) and
  a `power2.out` recovery with **no overshoot**, since an overshoot is just a small bounce.
- **The mass moved into a screen jolt.** Each impact heavy enough to matter kicks `#phone` down and
  lets it settle. Built as **one proxy tween summing decaying impulses**, not a tween per impact —
  badges 7 and 8 land 0.05 units apart, and two `to`s on `#phone.y` there would jitter and could
  leave the phone parked off-centre. Being a pure function of time it also scrubs backwards for
  free and is exactly 0 outside the windows. Only the four metal badges clear `SHAKE_FLOOR`; the
  doge, Cactus Jack and Family Style stickers do not move the device at all, and that contrast is
  doing more for the weight than the airtime ever did.

Verified — the checks that actually caught things, in case this gets retuned:

- **s23 now WRAPS the card instead of swapping it, and the wrapped asset was replaced.** The
  blown-up I.D. stays on screen; the *mockup* dissolves (phone + pile + scrim), leaving the card
  alone on black at the video's frame-0 geometry — that is the card the video morphs. `gold-card.webp`
  is rebuilt by `tools/make-gold-card.py` from `General/Jordan Rose Id Wrapped.png`; the old one was
  a **different revision on a white background** with a different photo ("Saints" hat, gold chain),
  which read as a white slab on the black stage. The case is placed so its inner card registers on
  `#id-card`'s box — they are the same card at the same scale (1899×1218 vs 1880×1218) — so it reads
  as one card gaining a case. `#gold-card` box **405.43, 149.57, 1092.26×786.15**, `?v=2`.
  Verified: `#id-card` holds opacity 1 through the entire mockup fade, is `set` hidden (not faded)
  only at s23+1.25 once the opaque inner card covers it, and reverse scrub `end → s2` restores both.
  **Flagged:** the two card arts differ in content — 500 PTS/Regular vs 5000 PTS/Gold, the sticker
  cluster appears, and the issue date runs *backwards* 05.22.2026 → 05.19.2023. The `END_PUSH` note
  was re-measured against the new asset: it is much closer to the video than the old one but still a
  different revision (inner-card aspect 1.5591 vs 1.6111), so its conclusion stands.
- **The I.D. card asset was replaced and its box re-derived from the VIDEO.** `id-card.webp` is now
  built by `tools/make-id-card.py` from Figma node `1878:63616` "Jordan Rose ID" — 2× pixels out of
  `assets/General/Jordan Rose ID.png`, alpha out of the MCP `contentsOnly` render (that endpoint
  returns 1× only, even at `maxDimension` 2814). The old asset was aspect **1.7825**; the design is
  **1.5452**, so the card really was the wrong shape. `#id-card`'s box is now **466.5, 291,
  958.5×594** = the card in frame 0 of `Jordan Rose ID Video.mp4` (639×396 of 1280×720, video is
  exactly 16:9 so ×1.5), because the video takes over frame-by-frame after the s21 blow-up.
  `ID_SMALL_SC` = 422/958.5, and the small state gained an **X** offset (+14.25) because the video's
  card is not horizontally centred — expanded centre x is 945.75. Cache-buster `?v=2`.
  Verified: expanded card's top and height land on the video's frame 0 exactly (291 / 594) and the
  outer rect matches by construction (the art fills its box — alpha bbox is the full 1880×1218).
  **Two mismatches are inherent to the two card designs, flagged not fixed:** the video's gold strip
  is 60 stage px against our black strip's 39, so the white body differs by ~21px; and the video's
  card sits in a clear slab extending to 417,157.5 1080×778.5, which the video adds.
- **The pile is Scene 21's, measured off a render rather than copied from the node boxes.** The
  badges are **rotated** 8.3/14.2/0/21.9/12.3/17.6/0/29.7° in the design. The original
  `assets/Scene 21/Badge 0N.png` exports had that rotation reset, and the page drew them at
  rotation 0 at positions eyeballed to "content-center align with the old shadowed render" — so
  every badge was at the wrong angle in the wrong place. The user supplied pre-rotated re-exports
  in `assets/General/Rotated/`; `tools/make-badges.py` (new) turns those into the eight
  `sticker-*.webp` and writes the manifest. The angle is baked into the bitmap, so the timeline
  still settles them to `rotation: 0`. **`get_metadata`'s `x/y` is not the render position of a
  rotated node** — its `w/h` *is* the rotated bounding box, but placing the art at the reported
  `x/y` left six of eight badges up to 72px out and only the two unrotated ones (3, 7) landed.
  Positions came instead from matching each badge's own art against a render of Scene 21 (node
  `1844:39703`). Cache-buster bumped to `?v=3`. `assets/General/` was already on the deny-list,
  so the rotated sources do not ship.
- **Landing order is bottom-up, and it is the user's explicit list** (given after two passes got
  it wrong): Top Contributor → Post of the Day → Family Style → doge → Cactus Jack → COMPLEXCON →
  Comment of the Month → black star = `BADGE_DROP` indices **5,4,7,3,6,1,2,8**, which is why that
  delay column is not sorted. Verify by watching when each badge reaches y 0, **not** by reading
  the delays — the falls differ in length, so delay order and landing order are not the same thing.
  Paint order stays Figma's (DOM order, badge 1 back), deliberately not reshuffled to match, so
  three badges tuck in behind a resting neighbour: doge under Post of the Day (8.1% of the doge),
  COMPLEXCON under Post of the Day (1.2%) and under Top Contributor (0.2%). Those are edge nicks
  and each lands the badge where the design has it, so it reads as sliding into the pile;
  `BADGE_OVERLAPS` / `BADGE_TUCK` declare them and warn on a new one. Flipping one for real needs a
  `z-index`, which changes the resting composition.

| check | result |
|---|---|
| landing order | matches the requested 5,4,7,3,6,1,2,8 exactly, measured off when each badge reaches y 0 |
| **positions vs Scene 21** | all eight at **dx = dy = 0** against a 1920×1080 render of node `1844:39703`, match error down from ~80-100 to 6-25, and a control comparison 8px off scores 56 — so the alignment is real. Badge 4's bottom edge lands at **952.1** against the screen's 952, which is the independent corroboration. Residual 18-25/255 on opaque pixels is Scene 21's scrim making its badges darker, not a position error |
| pile overlaps vs **alpha** (not bbox — every badge is rotated inside its box) | at the true positions only **one** pair of 28 touches (Post of the Day over the doge, 70px = 1.1%), and it is the one accepted tuck. The old eyeballed positions overlapped in 7 places with 3 visible tucks |
| any badge moving back **up** after landing | none, at 0.005-unit resolution — the bounce is really gone |
| peak squash | metal 0.930–0.944 scaleY, printed stickers 0.976–0.983 |
| `#phone` jolt | 5 impacts, peaks **+3.09/+2.55/+2.30/+3.78/+3.00 px** down, ~1px back, exactly 0,0 at s22+0.00, +0.50, +2.05, +2.10, s21 and s20. `scale` never touched (the boot intro owns that) |
| jolt visible on the pixels | phone top edge y **52 → 56 → 51 → 52** through the heaviest impact |
| pre-start render | all eight parked at y −706…−961 with bottom edges exactly 20px above the screen top, i.e. clipped |
| reverse scrub end → s2 | rest state, pre state and `#phone` all reproduce forward values exactly |
| console | clean, and the order guard silent |

Dead scroll in s22 is **0.19 / 150 px** — *down* from 272 despite the scene getting longer. It is
deliberate now: it is the only span where the finished pile is readable, because s21 immediately
expands the card over most of it.

## Next steps (suggested)

0. **Commit and push.** Everything in this session is local only — the live-page rollout, the
   coded comments tray, the XP video sprite, the poll vote, the 4→5 seam, the Scene 19 work, the
   re-coined and re-centred toasts, and the s20 → s22 DP click. Stage **explicit paths**; the user
   drops assets into `assets/` while you work (there are currently untracked files of theirs in
   there), so never `git add -A`. Ask before pushing: `main` is public and wired to Vercel, so a
   push is a publication. Three things in this batch are easy to miss when staging:
   - **new files**: `tools/make-toasts.py`, `tools/make-jordan-av.py`, `tools/make-xp-frames.py`,
     `assets/xp-frames.webp`, `pages/assets/jordan-rose.webp`;
   - **deletions**: `pages/assets/269954e0-….webp` (the old headshot);
   - **outside this repo**: `../10. My Complex All Hands/{fandom,all-scenes}.html` and
     `assets/jordan-rose.png` were edited there too, and are *not* covered by any commit here.
     That folder is the source `make-page-assets.py` imports from, so it has no version control of
     ours — if it is ever restored from a backup, the Jordan Rose swap goes with it.
1. **Ask what the new `assets/General/` Jordan Rose art is for.** Four files landed there on
   2026-07-29 (`Jordan Rose ID.png`, `… Id Wrapped.png`, `… ID on Lanyard.png`, `… ID Video.mp4`)
   that look like updated versions of the three finale assets — but those already show Jordan Rose
   correctly, so this is a refresh, not a fix, and the `.mp4` may mean a scene is meant to *play*
   rather than scale. Nothing is broken; don't guess the scope.
2. **Keep going scene by scene.** This is the shape every task in this session took: the user
   watches a scene, says what it should *do* rather than how, and the answer is usually "the
   export baked a state that should be an interaction — the live page already has it". Still
   baked, still could be earned: **s17's fandom join** (the JOIN button on `pages/fandom.html`)
   and **s9's like + save** (the heart and bookmark on the story card, next to the comment icon
   that s9 already clicks). Check `../10. My Complex All Hands/` first — the interaction is
   usually already implemented there.
3. **Figma has scenes the prototype does not.** Listing the canvas turned up **Scene 13.1, 15.1,
   25, 29 and 30** frames. 13.1 is built; the rest are not. Worth asking whether they are queued.
4. **In-betweening / finesse pass** (user's standing request): continuous shared-element
   transitions instead of fade-swaps — candidates left are the s16 rail crossfade and the
   toast/panel handoffs. The single-image s21 card morph is the pattern to follow.
5. User feel-pass on real hardware → tune `PX_PER_UNIT`, per-scene durations, Lenis lerp (and
   re-check `HOVER_PASS` against the ~1.5s spec afterwards). The page is ~19% longer than when
   pacing was last discussed (35,600 → 42,272 px), which is worth raising before a stakeholder
   sees it.
6. **Safari + Firefox manual check**, and the risks are specific now:
   - **five same-origin iframes** with CSS `zoom` — everything from `mountPages` to the chip prep
     to the drags reaches into `contentDocument`. This is the one thing that would fail wholesale
     rather than subtly, so check it first on the live URL;
   - the vendored woff2 (`font-display: block`) drives the coded comments tray, the first text the
     page renders itself;
   - `assets/xp-frames.webp` is a 4296×5768 sprite — worth confirming it decodes on a weaker
     machine, since that is where a sprite's decoded footprint bites.
7. **Import the repo at vercel.com/new** — still the outstanding shipping step. Then rotate the
   GitHub token, and decide whether the repo should stay public.
8. Optional deferred polish: the poll-bar grow already comes from the page's own transition;
   remaining candidates are keyboard/screen-reader affordances and a reduced-motion pass
   (`REDUCED` is read but only wired to Lenis's lerp).
9. **Open questions for the user**, both raised and both deliberately left alone:
   - the "Zack" tag overlaps one non-target chip on the s8 SPORTS press. Unavoidable at the
     current tag size (8px row gaps vs a 47px tag) and the label is not to be moved, so the
     levers are the pick order or the tag's size.
   - the s19 editorial card is ~2% off the reference on height. Two measurements of the reference
     disagree at that scale (bbox vs corner diagonals), because its card has a slightly different
     aspect than the export — so it needs a decision, not more fitting.

## 2026-07-29 (last): the card is CLICKED open, and the prototype ends on the video

Two changes, both the user's call: the I.D. blow-up now has a cause, and the finale is the
closing video played frame by frame instead of a static lanyard photo.

**The blow-up is a press.** s21 expanded the card off nothing — the cursor was parked on it and
the card simply grew. Now the cursor presses the small card at the very end of s22 and s21's
expansion answers it, the same cause→effect pairing as the s20 press on the DP:
- the press waits for the badge pile to finish (the last badge settles at ~s22+1.93) and lands at
  **s22+1.95**, on the s22/s21 boundary, so the card blows up as the finger lifts rather than
  the better part of a scene later;
- the card takes the press too — a **3% dip** (`ID_SMALL_SC * 0.97`, measured at 0.4271 against
  the resting 0.4403) which the expansion then releases. s21's tween starts at **+0.05**, the
  frame the cursor's release finishes on.

**The ending is `assets/ending-frames.webp`.** `assets/General/Jordan Rose ID Video.mp4` as an
8×8 sprite grid — the same machinery as the s11 XP popup, for the same reason (that file cannot
be reliably seeked, and every beat here has to scrub deterministically in both directions), just
full-bleed: the source is 1280×720, exactly the stage's 16:9. `assets/lanyard.webp` is retired.
- **12 fps, not the source's 24** — 60 frames at a 1024px cell, 2.96 MB. All 119 frames measured
  5.1 MB even at a soft 768px cell against a ~15 MB deploy, and it buys resolution the content
  cannot use: the reader scrubs 5 seconds of video across ~1,800px, so it plays *faster* than
  real time at any ordinary scroll speed. `--measure` prints the table this came from.
- **Extraction gotcha, and it is silent.** At `playbackRate` 1.0 the per-frame `toDataURL` cannot
  keep up and Chromium stops presenting frames: the first pass captured **81 of 120** at uneven
  spacing (~16 fps) and reported nothing wrong. At 0.25 all 120 arrive at a dead-even 1/24s.
  `check_spacing()` now asserts it. Sampling to 12 fps is by `mediaTime` against an even grid,
  **not** by index — the capture still misses one frame at the head, and striding the index would
  put every later sample half a frame off its slot.

**The handover took three attempts, and the first two are worth knowing.** The video opens on the
same subject the reader is looking at, so whether that is an asset or a liability turns entirely
on whether the two *register*:
1. Against the old `gold-card.webp` they did not, and no transform fixed it. Registration was
   pushed to the end of the line — edge-gradient correlation over scale and offset, then an
   anisotropic (scaleX, scaleY, dx, dy) FFT search. Best fit 0.91/0.83/−29/−2, still ~20px out on
   the XP block with the sticker cluster somewhere else entirely. A **near** match is the worst
   outcome available: two copies of the same type ~25px apart read as a rendering fault, and the
   closer the fit the harder the eye tries to fuse them. Verified by eye at the 50/50 frame.
2. So it became a push-in through black — card grows past the frame, fades out, video fades up
   after it. That reads fine (on a black stage a fade-through-black is a cut, not a gap) and was
   correct while the two shots disagreed. **It is no longer what the code does.**
3. `gold-card.webp` was then rebuilt and fitted so its inner card lands on `#id-card`'s box, which
   is itself the video's frame-0 card. That closes the gap, so the handover is now a **plain
   crossfade at frame 0** and nothing moves. Verified by blending the s24+0 render against frame
   0: case, clip, photo, rule, barcode and stickers all coincide. The only residue is ghosting on
   the four lines whose text genuinely differs between revisions (500 PTS/Regular vs 5000
   PTS/Gold, 60% vs 1%, 2023 vs 2026) — which is why `END_XFADE` stays at 0.3.
   The raw aspect figures still disagree (inner card 1.5591 vs the video frame's 1.6111) and they
   are a red herring: `make-gold-card.py` fits the case anisotropically on purpose and absorbs
   that difference in the case, which has no alignment obligation to anything. **Trust the render
   over the ratio.**
What keeps the dissolve from reading dead-still is that the sweep starts **on** the crossfade, so
the video's own glow is already rising through it. That motion has to come from the content — any
transform on `#ending` would break the registration the whole thing depends on.

**Verified.** Forward and reverse (`end → s2`) probes of `#id-card`, `#gold-card`, `#ending`,
the cursor and the sprite cell agree at **every** sample, no console errors; the sweep advances
monotonically and the last cell (59) holds byte-identical through the `end` label (rms 0.00).
Timeline is now **53.79 units / 43,032 px**. Deploy set re-derived the required way — recording a
real page load and diffing it against `.vercelignore`, not a regex over the source: **261 files /
17.86 MB**, nothing fetched-but-excluded, `lanyard.webp` added to the deny-list.

**Not done / worth knowing:**
- The sheet is 8192×4608 (37.7 Mpx) and `preload()` decodes it before the loader clears, so it
  adds to first load. Acceptable for a prototype; the lever is `CELL_W`/`OUT_FPS`.
- s23 still has the gold case as its own beat between the blow-up and the video. That reads fine,
  but if the ending should follow the blow-up *directly* (the user's phrasing was "after that,
  the video"), s23 is the scene to cut — the registration already spans all three.
- Two unreferenced files in `pages/assets/` (~128 KB) still ship. Pre-existing, harmless.

---

## 2026-07-30: the s19 satellites were re-exported — Carti → KATSEYE

The user replaced three of the four upright Scene 19 masters (`Latest Editorial.png`, `UGC.png`,
`Video.png`). Not re-crops — the **content pivoted from Playboi Carti to KATSEYE**:

| card | was | now | source px |
|---|---|---|---|
| `sat-editorial` | poll "Vote for Best Playboi Carti Album" | poll "Vote for Best KATSEYE Song" | 565×899, **unchanged** |
| `sat-ugc` | Adam Kwazoski / "CARTI DID NOT MISS" | Kiji Fiji / "GUESS WHO MADE IT TO THE LIVE SHOW!!" | 563×998 → **563×934** |
| `sat-video` | interview thumb: Carti on Hot 97 | interview thumb: KATSEYE *Wild Hearts* | 563×514, **unchanged** |

`UGC Comment.png` was **not** touched — see the flag at the bottom.

**One box had to move, and only one.** `#sats img` has no `object-fit`, so a stale box does not
letterbox a shorter card, it **stretches** it. The registration that survives an art change is
`(width, centre)`, never the top edge — main.js derives every card's s19 fly-out *and* s20 recede
from `offsetLeft + offsetWidth/2`, so holding the centre keeps both vectors identical, and holding
the width keeps the fan's two columns clearing the bezel. So `#sat-ugc` went
`110.8 / 439.4` → `124.6 / 411.9`, centre pinned at **330.5**. The other three came out within
**0.5px** of their existing boxes (export rounding on the .1px values, not drift) and were left
alone on purpose — nudging a box by 0.2px only invalidates a verified frame.

**`tools/make-satellites.py` now owns this**, because it is the third time these boxes have had to
be re-derived by hand. It re-encodes the four upright PNGs 1:1 to WebP (quality 92, method 6 — the
repo's convention), declares each card's `(width, centre)` as the load-bearing data, derives
height from the art's own aspect, and prints the styles.css rules plus a per-card delta. Run it
bare to check, `--write` to build. It also measures soft alpha (`8 < a < 240`) as the baked-shadow
guard, since a baked shadow would double against the CSS `drop-shadow` on `#sats img` — all four
came back 0.2–0.4%, i.e. antialiasing only.

**A stale invariant got corrected in passing.** The comment above these rules claimed the rotated
edges clear the phone "bezel edge x=1195" by "editorial↔ugc ≈ 50px, comment↔video ≈ 69px". Both
figures were wrong. `#bezel` is `box-sizing: border-box` at `inset: -12px`, so its painted outer
edges are **728 / 1192**; measured against those, and accounting for the ~(h/2)·sinθ corner swing,
the gaps are editorial **35.2** ↔ ugc **35.4**, comment **33.2** ↔ video **31.3**. The shorter UGC
card swings less, so the pair it mirrors now agrees to **0.2px** where it was 2.2px apart before —
the re-export improved the symmetry rather than costing anything.

**Verified.** s19 mid-flight and resting, s20 mid and end, s22, s18 — no console errors. Rendered
box vs natural-image aspect for all six satellites is within **0.4%** (sub-pixel, from the .1px
CSS values); all six centres hold; a reverse scrub (`end → s24 → s2 → s19`) restores all six to
`visibility: visible`, opacity 1 and their resting rotations. s20's recede still clears every card
and leaves the cursor on Jordan Rose's DP. Deploy set: **no new paths** — `assets/Scene */` and
`*.mp4` are both already in `.vercelignore` — and **+110.9 KB** on the three WebPs (the new art is
photographic, so it costs more than the old flat cards: 120 KB → 231 KB for the three).

**Flagged to the user, NOT changed — the pivot is only half done.** These three satellites are the
only things on the page that are KATSEYE. Everything they sit around is still Carti:
- **`pages/fandom.html`** — the page inside the phone throughout s17–s22. Its poll asks "Which of
  Playboi Carti's moments…", its lead article is "Playboi Carti Returns With New Song and Video
  'Ketamine'", and its first UGC post is Jordan Rose / "CARTI DID NOT MISS". That last one is the
  post `sat-ugc` used to be a copy of, so **the satellite no longer mirrors the post it flies out
  of** — and per the "the poster IS the person on the card" note, this page's identity chain feeds
  s20 → s22. Changing it means editing **both** `pages/fandom.html` and the All Hands source, or
  the next `make-page-assets.py` run reverts it.
- **The two merch tiles** (`sat-merch-left` / `sat-merch-right`) — a Carti hoodie box set and an
  "NBA PLAYBOI CARTI × M&N" jersey. Still Carti, and they sit in the same fan as the new cards.
- **`assets/Scene 19/UGC Comment.png`** (`sat-comment`) — untouched, and already internally
  mixed: the quote reads "yoonchae mid-spin under the rig lights" (KATSEYE) but the article it
  links is "The Wildest YouTube Comments on Playboi Carti and Travis Scott's 'BACKR00MS' Video".
  Pre-existing, not introduced here.
- **`assets/Scene 19/Badge Packet Animation.mp4`** — new, 508 KB, dropped into the Scene 19 folder
  in the same batch but never mentioned. Nothing in the page references it, and "badge packet"
  sounds like **s22**, not s19. Left in place, unused, and it does not ship (`*.mp4` is denied).
  Ask what it is for before wiring it up.

---

## 2026-07-30 (later): the fandom page was rebuilt, and Scene 19 grew three sub-scenes

Two things landed while the satellite re-export above was being verified, and they are bigger
than that was.

### 1. The live fandom page was replaced — this is what "the products" meant

The user's question "the products are still the same from the old assets" was **not** about the
two merch satellites. `10. My Complex All Hands/fandom.html` was rewritten at 17:23 and now
carries a **new Section 15, "Complex Style — shop grid" (`2156:34792`, 743px tall)** — four
KATSEYE × GAP hoodies (Lara / Daniela / Manon / Yoonchae, $130). Confirmed by the user: "the
fandom page is being updated in parallel, and that will be the new page."

Re-imported with `tools/make-page-assets.py` (idempotent, so re-run it when they save again):
119.43 MB of source → **8.36 MB**, `pages/` now **236 files / 8.95 MB** (was 221 / 8.56). The
page is 7307 css px tall = **8244 stage px**, which matches Figma's own fandom node height
(8243.79) to 0.2px — a useful independent check that the import is faithful.

**Two things the import broke, and one it didn't.**

- **`POS.fandom` was silently wrong and is now SOLVED, not scaled.** The old values were the
  retired strip's deltas × a height ratio, checked by eye. Dropping a 743px section into the
  middle of the feed put **s20 2,512px out** — it framed an ad instead of the post whose profile
  picture it clicks. New tool `tools/derive-page-offsets.py` solves each offset by registering
  the live page against the storyboard render of that scene — the same match-against-a-render
  method the s22 badges use, for the same reason. Result:

  | scene | was | now | Figma node y | note |
  |---|---|---|---|---|
  | s17 | 0 | **0** | 0 | page top |
  | s18 | −649 | **−941** | −972 | render is right; at −972 the post sits 31px high (checked by eye) |
  | s19 | −1617 | **−977** | −977 | exact agreement |
  | s20 | −3118 | **−5630** | −5632 | 2px |

  Two independent derivations agreeing to 2px on three of four is the reason to trust these.
  **The write-up of the harness matters more than the numbers**: the obvious implementation —
  screenshot once per candidate offset — is a trap. With `zoom` on the root, `scrollHeight` is
  already post-zoom while `scrollTo` is not, so the conversion lands twice and every offset
  comes back plausible and wrong (that first pass put s20 at −6352 with a confident-looking
  33× score). Capturing ONE full-page strip and sliding the window in numpy has no scroll
  coordinates in it at all, is exact at 1px, and is faster. Score on **row-mean luminance**,
  not pixels: the two renderers disagree everywhere at pixel level, and the band positions are
  the only signal that actually moves with the offset.

- **The poster identity reverted, exactly as CLAUDE.md warned.** `Jordan Rose` is gone from
  `pages/fandom.html` (0 occurrences; 4× `Adam Kwazoski`), because the rewrite dropped that
  edit. `tools/make-jordan-av.py` only builds the *image* — the name/src swap was always a
  manual edit in both files. **Not re-applied here** — see the flags below.

- **What did NOT break: `PAGE_TARGETS.s20`.** It finds the first `.post .ph .up-av` in view at
  `POS.fandom.s20` rather than holding a coordinate, so the corrected offset carried the DP
  press onto the right avatar with no edit. This is the "name the element, not a number" rule
  paying for itself — a coordinate would have needed re-measuring and would have failed silently.

**Verified.** s16–s20, s22, s24 and a reverse scrub to s2: no console errors. s20 now registers
on its reference frame — same post, same "KATSEYE: 11 Things You Didn't Know" article, shop grid
below. s19 shows the KATSEYE poll and the KATSEYE satellites together.

### 2. Scene 19 now has 19.1, 19.2 and 19.3 in Figma — NOT yet built

**Scene 19's canvas x moved: it is `1838:120893` at x=46460, not 48480.** CLAUDE.md and
tools/export-assets.md both still say 48480 for the "stage = canvas − 48480" conversion; 48480
is now **Scene 19.1**. Anything derived with the old constant is 2020px out.

| frame | node | canvas x | what it is |
|---|---|---|---|
| Scene 19.1 | `2126:9851` | 48480 | the page scrolled to the shop grid; cursor hovering the **camo (Daniela) hoodie** |
| Scene 19.2 | `2159:49676` | 50500 | a **product-detail panel** slides in right (KATSEYE X GAP / Daniela Hoodie / $130 / qty / Select size / ADD TO BAG / shop Pay), phone dims behind a scrim, and a **+200 XP "You Copped a Drop"** toast drops in |
| Scene 19.3 | `2126:11248` | 52520 | a **"YOU UNLOCKED A new badge!"** modal — COMMENT OF THE DAY badge in a case, over the dimmed page |

Page offsets already solved for these (same harness): **19.1 = −6091** (score 0.966) and
**19.3 = −3658** (0.892, but next-best 0.807 — weakly determined *because* the modal covers the
screen, so there is almost no page signal; it barely matters at that opacity). **19.2 = −6091**,
same as 19.1 — the panel slides over a page that does not move, and Figma agrees (its 19.1 and
19.2 fandom nodes carry identical y).

**`assets/Scene 19/Badge Packet Animation.mp4` is 19.3's asset** — that answers the earlier
flag. It is byte-identical (508,455 bytes) to `assets/General/Badge Packet Animation.mp4` from
2026-07-29, so it is a copy, not new material. Per the s11 / s24 precedent it must become a
**sprite sheet, not a `<video>`** — read `tools/make-ending-frames.py`'s docstring first
(capture during playback via `requestVideoFrameCallback` at `playbackRate` 0.25).

**Still open, in the order they block work:**
1. **The two merch satellites are still Playboi Carti** (hoodie box set + NBA Carti × M&N
   jersey) and there is **no new source anywhere** — `assets/Scene 19/Product 1.png` and
   `Product 2.png` are byte-identical to what is already built, and Figma's Scene 19 frame still
   shows the Carti pair on nodes `2077:8910` / `2077:8969`. This is a design-side gap, not
   something to invent.
2. **`sat-comment` / `UGC Comment.png` is out of date after all** — Figma's s20 frame has that
   card as **Jordan Rose**, "YO!! These are effin fire!!!", linking to "KATSEYE: 11 Things You
   Didn't Know About the Global Girl Group". Our card is Amara Diallo linking to the Carti
   "BACKR00MS" article. It was the one card not re-exported in the morning batch.
3. **Amara Diallo vs Jordan Rose on the s20 post.** Figma's s20 says Jordan Rose — which is the
   documented invariant (the poster IS the person whose I.D. s22 opens). The live page says
   Amara Diallo. **Deliberately not edited**: the user is rewriting that exact file right now,
   so patching only our copy would create a divergence the next import reverts silently, and
   patching theirs risks a lost update. It belongs in the All Hands source.
4. **Maria Jose's post image** is an Iverson jersey in the live page and the KAT × GAP hoodie in
   Figma. Probably just the in-flight rewrite; worth re-checking after the user's next save.

---

## 2026-07-30 (later still): 19.1 / 19.2 SKELETON built — cursor registered, PDP panel in

Built at the user's request so the motion could be reviewed before the designed PDP exists:
"build the skeleton so that the cursor is in the right position as per the Figma frame, and then
the Add to Bag interaction screen is there. When the build is ready, we can just plug it in."

Timeline is now **57.09 units / 45,672 px** (was 53.79 / 43,032) — `s19.1` 1.5 and `s19.2` 1.8.

### The cursor is registered on the storyboard, to ~1px

| beat | Figma tip (stage) | built tip | delta |
|---|---|---|---|
| s19.1 | 1110, 450 | 1108.8, 449.6 | **−1.2, −0.4** |
| s19.2 | 1282.3, 929.3 | 1282.1, 929.2 | **−0.2, −0.1** |

Neither is a copied coordinate — both are `PAGE_TARGETS` selectors, which is why they survive the
page moving. What made that possible is a new `frac` option on a page target: it puts the tip at a
fraction of the resolved element's own box instead of its centre. Both beats need it, and for
different reasons:

- **s19.1** targets `.stile-img` of the tile whose text matches `/Daniela/` — the product shot, not
  the whole `.stile`, whose brand/price block would drag the centre down. The storyboard's tip is
  at **0.755 across, 0.749 down**, which rounds to a clean **three-quarters/three-quarters** and
  still lands within 1.2px. The element centre would have been **80px** up and left, which reads
  as a different beat, so the fraction is doing real work rather than decorating.
- **s19.2** targets `.pdp-shoppay`. Figma presses the button's **vertical** centre but sits well
  left of the horizontal one — **0.315 across**. Centring it put the tip **66px** right of the
  render, most of an arrow width. First pass got this wrong by checking only the y (which matched
  exactly at 929.5) and concluding "dead centre"; the x was never verified until the built frame
  was measured against the render. **Verify both axes.**

### The PDP panel

`#panel-product` is a real `.page` frame at Figma's own box — `Complex.com PDP [Mobile]`
(`2159:50283`), **388×858.3 at (1154, 110.6)**. It is the first panel that is *not* 1:1: the page
is authored 390 like every other product page, so the frame carries **zoom 388/390** and
`mountPages` reads it back, rather than the panel being widened to 390 to dodge the issue.

`pages/product.html` is a **measured placeholder**, clearly labelled as one in-page and in a header
comment. What is load-bearing in it and must survive the swap: authored width 390, document height
863, and `.pdp-addbag` / `.pdp-shoppay` at the boxes measured off the 19.2 render — ADD TO BAG at
stage y 851..893, shop Pay at 906..953, i.e. 390-space tops 744.2 and 799.5.

**Plugging in the real page is a re-run, not an edit.** `"product": 388/390` is already registered
in `make-page-assets.py`'s PAGES, and the importer now **skips a page whose source does not exist**
with a warning instead of dying on the `goto`/`read_text` — which is what lets that entry sit there
harmlessly. Author `product.html` in the All Hands build, re-run the importer, done.

Two bugs worth recording because both rendered as something other than what they were:
- **The panel first slid in as a blank white slab.** `.page` ships `visibility: hidden` and each
  scene reveals its own (as s14 does for `#page-rerank`); without `gsap.set('#page-product',
  {autoAlpha: 1})` the frame is invisible while its container is not. It is a `set`, not a tween —
  `#panel-product`'s own fade is the reveal, and animating both would double the dissolve.
- **`place-items: center` on the shop Pay grid stacked the lockup vertically** (two children, two
  implicit rows). It is flex now.

The s19 satellite recede **moved from s20 into s19.1** — the cards belong to the UGC beat and 19.1
is already a different subject. Same converging vectors, just earlier; s20 now clears the 19.2
panel and scrim instead, back out to the right the way s15 exits `#panel-rerank`.

**Verified.** s19, 19.1, 19.2, s20, s22, s24 and an 11-sample forward+reverse state probe of
`#panel-product` / `#screen-scrim` / `#cursor` / `#page-product`: panel and scrim are 0 everywhere
except 19.2 and mid-dismiss in s20, the cursor never disappears before its documented s24 exit, and
a reverse scrub to s2 restores every one. No console errors anywhere.

**Not built, deliberately — both need art or a decision:**
- **The +200 XP "You Copped a Drop" toast.** Measured and ready to drop in: Figma `Exp`
  (`2159:50272`) at stage **(802, 115) 316×87**. It is a fifth toast, so it needs a source through
  `tools/make-toasts.py` rather than being drawn by hand. **This is also what should fill s19.2's
  0.35 units (~280px) of dead scroll after the cursor lands** — the hold is deliberate for now, but
  it is the toast's slot, not a permanent pause.
- **The tile → panel transition.** The panel currently just arrives. The storyboard may want it to
  grow out of the tile Zack pressed.
- **Scene 19.3** (the badge-unlock modal) — untouched. Offset solved (−3658) and its asset
  identified (`Badge Packet Animation.mp4`, needs sprite extraction, not a `<video>`).

**One caveat on everything above:** the All Hands `fandom.html` was saved again at **17:45** while
this was being verified (`pages/` holds the 17:23 snapshot). The scroll offsets were solved against
that snapshot, so **re-run `tools/derive-page-offsets.py` after the page build finishes** — s19.1's
−6091 in particular points at a section whose position can still move.

---

## 2026-07-30 (later still): re-imported the finished fandom page, and killed a caching trap

**The 17:45 revision of the page is in.** Re-ran `tools/make-page-assets.py` — 118.21 MB →
8.34 MB. Its content changed (source 57,148 → 65,117 bytes) but its **geometry did not**: document
height is still 7307 css px / 8244 stage px, and every section sits where it did, shop tiles
included. So all four solved offsets survived, re-confirmed by re-running the solver against the
new import: s17 **0**, s18 **−941**, s19 **−977**, s20 **−5630**, and s19.1 came back **−6090**
(1px off the earlier −6091, with a better score of 0.975 — `POS` now carries −6090 so the code and
the tool agree). Both cursor tips still register: s19.1 within 1.2px, s19.2 within 0.2px.

**The review cycle that was lost was a browser-cache problem, not a build problem.** Two new
scenes were reported as not visible while `curl` showed the server returning the new `main.js` and
a fresh Chromium reported `57.09 units / 45,672 px` with both labels present. Cause:
`index.html` loads `main.js` and `styles.css` with **no `?v=`**, and `python3 -m http.server`
sends `Last-Modified` and answers `If-Modified-Since` with a 304, so a long-lived tab keeps the
previous build — through a hard refresh, and the more so for the iframes, since a reload need not
revalidate a frame's document.

Ruled out first, in this order, rather than guessed at: a stale or duplicate server (one process,
pid 75415, correct cwd, sole owner of 8321), the served bytes (`curl` had the new offsets), and the
build itself (headless load reported the new labels and length).

Fix is `tools/serve.py` — `no-store` on everything and `Last-Modified` stripped, so there is
nothing to revalidate against and a stale tab is impossible. Threading, or one stalled iframe
request blocks the page load. **CLAUDE.md's Run section now points at it instead of
`python3 -m http.server`**, which is the actual repair: a `?v=` bump on two files would have been
the same trap with an extra step. Dev-only — Vercel still serves `vercel.json`'s headers.

Worth keeping: **the `scroll x / N` denominator in the `?debug` HUD is the fastest check that a tab
is current**, because N is the timeline length and moves whenever any scene span does. 43,032 is
pre-19.1; 45,672 is current.

---

## 2026-07-30 (end of day): all five pages re-imported, an importer bug fixed, and a sync guard

### The import was real but kept going stale

`pages/fandom.html` **was** imported (twice), and each time the source moved again minutes
later — 17:23, then 17:45, then 18:24. Verified rather than asserted: a visible-text diff of
`pages/fandom.html` against the source now returns **nothing**, i.e. identical. Geometry has been
stable across all three revisions (7307 css px / 8244 stage px, every section and shop tile in the
same place), so the solved offsets survived each one — re-checked with the solver, not assumed.

`home-editorial` and `home-feed` came across in the same runs (the importer does all five every
time) and both now carry the KATSEYE fandom tile: 7 KATSEYE / 0 Carti in home-editorial, and the
one remaining "carti" in home-feed is editorial copy in a ComplexCon card, not a fandom entry.

**s16 needed no change, and that is worth knowing.** The fandoms rail is still at page y 4800,
574 tall, and its first `.fnd-card` is now "Music / KATSEYE / Follow" where Playboi Carti used to
be — the swap happened in place. Confirmed by hit-testing `CUR.s16`'s tip against the live cards:
it reports **"Music KATSEYE Follow"**. So the whole chain now reads: Zack follows KATSEYE in the
rail → enters the KATSEYE fandom page → the KATSEYE feed → the shop grid → the PDP.

### An importer bug that produced a single silent 404

`.fan-img` on home-editorial stacks several `<img>` on top of each other. The hidden ones are
never fetched, so they landed in neither the measured boxes nor the response log, so they were
absent from `need` — and `need` is what `write_pages` uses to decide which references to rewrite
to `.webp`. So the page kept asking for a `.png` that convert() had never written. It 404s only
when an *earlier* run happened to convert that file, which is exactly what happened: one 404 in
the middle of the KATSEYE fandom tile, in a section that otherwise looked fine.

Fixed at the root: `measure()` now also parses each source page for `assets/…` references and
adds anything missing to `need` at width 0 (which falls back to `FALLBACK_W` — right, because an
image with no measured box is one we have no size evidence for). Verified: **zero** unconverted
raster references left in `pages/*.html`, and a full page load reports **no failed requests**.

### The sync guard (user's request)

`pages/` is generated from a local-only folder that is edited *while* the prototype is reviewed,
and the import rewrites markup — so `pages/` can never be diffed against its source and staleness
was invisible. It was got wrong twice in one afternoon in **both** directions: finished work
reported missing (a browser cache — see `tools/serve.py`), and an import believed current when the
source had moved on eight minutes later.

- `make-page-assets.py` now writes **`pages/.import-stamp.json`** — the SHA-256 of every source
  page it read. A hash, not an mtime: the source is saved constantly and most saves change bytes
  without changing anything that renders, and a check that cries wolf gets ignored.
- **`tools/check-pages-sync.py`** compares that against the sources now. Exit 0 in sync, 1 stale,
  2 cannot tell (no stamp, or no source folder — normal on a fresh clone, where `pages/` is
  committed precisely so the prototype runs without it). Proven in both directions by mutating a
  source file and restoring it.
- **`.githooks/pre-push`** runs it before every push and **asks** y/N rather than hard-blocking —
  the source is local-only and mid-edit snapshots are legitimate. It reads from `/dev/tty`, not
  stdin (git puts the ref list there), probes the tty in a **subshell** (a failed redirection is
  reported by the shell itself, so `2>/dev/null` on the command still leaks the error), and
  refuses when it cannot ask. Installed with `git config core.hooksPath .githooks`.
- **`PAGES-SYNC.md`** documents all of it, and CLAUDE.md's Run section now leads with the check.

**Known failure mode, called out in both docs:** hooks are not carried by `git clone` and
`core.hooksPath` is local config, so on a fresh clone the guard silently does nothing until
`git config core.hooksPath .githooks` is re-run.

`pages/.import-stamp.json` is tracked in git (it is the mechanism) but added to `.vercelignore` —
the page never fetches it.

**Verified end to end.** `✓ in sync`, timeline 57.09 units / 45,672 px, s16/s17/s19/19.1/19.2/
s20/s22/s24 plus a reverse scrub to s2: no 404s, no JS errors.

---

## 2026-07-30: the real PDP is built (Track A), and the buy is rewarded

`pages/product.html` is no longer a placeholder. Built from Figma `Complex.com PDP [Mobile]`
(`2159:50283`) to PROCESS.md **Track A**, authored into the All Hands build as `product.html` and
imported — so it survives the next `make-page-assets.py` run rather than being a local patch.

**Authored 388, not 390.** The Figma frame is genuinely 388 wide, so the page is authored at its
real width and mounts **1:1** (`.page-1x`), like the two side slabs. It briefly carried a 388/390
zoom while the placeholder was 390-authored; authoring to the design's own width is simpler and
keeps both interaction targets on whole numbers.

**Phase 4 — numeric QA: worst deviation 0.064px** across 17 `data-node` sections (tolerance
< 0.5px; the build's best previous passes were Fandom 0.016 and Home Feed 0.023). Scene height
858.281 against the tree's 858.285. The small accumulation is sub-pixel rounding of the design's
fractional gaps, not drift.

**Phase 5 — visual QA.** First whole-image RMS was 21.5 with a *uniform* score across every band
including a blank one, which is the signature of global misalignment rather than per-band error —
so nothing was tuned until it was explained. It was a **1px inside stroke of #303338 with square
corners** on the frame, measured off the reference render (left column reads 48,229 against
white) and confirmed in scene context. Width picked by RMS sweep over
{0.995, 1.0, 1.13, 1.194, 1.25} rather than by eye: **0.995px** wins, which is also the border
width the rest of the design system uses. Whole-image 21.5 → 17.0, and interior-only 13.6 with
the blank gap band at **0.0** — exact.

The one remaining outlier, `brand+title` at 32.1, was **localised before being accepted** (the
Phase 5 rule): text widths measure within 1.3px of the tree ("KATSEYE X GAP" 158.45 vs 158), and a
3× side-by-side crop is indistinguishable. It is Figma-vs-Chrome antialiasing on large bold
glyphs — irreducible, accepted. Photo band 8.4 is resampling texture, same call.

Quirks reproduced verbatim per Phase 3: the frame's empty 388×388 "Product Image" node, the
opacity-0 "Pre-order" badge, and the two **opacity-0 leftovers "x" and "drake"** in the brand row,
which still occupy their 13px and 56px of it.

`#panel-product` lost its 12px `border-radius`: the design's corners are square and the page draws
its own stroke, so a radius on the container would clip the design's own edge.

**The cursor `frac` was re-solved against the designed page** — 0.315/0.494 was a fraction of the
placeholder's guessed 16px button inset and was worth **3.7px** of vertical error. Now
[0.3155, 0.5096] against the real box (stage x 1169.92..1526.08, y 906.48..951.14), and the tip
lands within **0.1px** of the storyboard. ADD TO BAG and shop Pay solve to stage y 850.77 and
906.48 against the tree's 850.82 and 906.54.

### The buy is rewarded — +200 XP drops from the top

User's call: "once the cursor buys the hoodie, the experience pill should appear from the top."
`assets/toast-200.webp` is the fifth toast, built from the supplied `Exp01.png` onto the same
880×598 canvas (= the 440×299 render box at 2×) as the other four, with the pill registered on
Figma `Exp` (`2159:50272`)'s own position — screen-local **(62, 51) 316×87**, verified back at
(62, 51). It therefore reuses `.toast` and `toastIn` unchanged and arrives with exactly the
language the other four do.

It lands at s+1.5, **after** the press at s+1.45 — the reward answers the press rather than
accompanying it, the ordering s12's poll and s13.1's vote already follow. **s19.2 grew 1.8 → 2.1**
because at 1.8 the 0.35-unit arrival finished exactly on the scene boundary, and a toast that
starts too near the end never appears at all (the s13.1 lesson). It leaves with the panel at s20.

**Caveat worth carrying:** the supplied `Exp01.png` is **1×** (pill 315×87) where this pipeline is
2× (632×174), so `toast-200.webp` is a LANCZOS upscale and is softer than its four siblings at
full-screen scale. The proper fix is `make-toasts.py`'s dual-source route on node `2159:50272`;
the 2× opaque export lands on an 880×604 canvas that does not share the supplied art's framing,
so aligning the two needs the offset solved rather than assumed. Not done here.

Timeline **57.39 units / 45,912 px**. Verified: pill hidden before s+1.45, arriving at 1.55
(op 0.52), resting at 1.9, and gone by s20+0.3 and on reverse scrub; no 404s, no console errors.

---

## 2026-07-30: the XP pills are one family now, with a progress bar

All five toasts rebuilt from the designer's `assets/General/Exp01-05.png`. They are now identical
art at an identical 310x86 pill, all **centred** on the shared slot at stage y 48 (the 440x299
render box, 880x598 at 2x) — the convention `make-toasts.py` already documented. The four old
pills had *different* widths and so different left edges; registering the new art onto those old
left edges would have left them off-centre, which is the trap here.

**The first award is now +10, not +20** — the new art says so — so `toast-20` was renamed
`toast-10` (index.html + 2 references in main.js).

**Each pill carries a mini progress bar, and the fill is baked into the art.** Measured off a
124px track, in story order: **29 / 29 / 50 / 74 / 99 %** for +10 / +30 / +80 / +120 / +200. So
the progression needs no code — swapping the art is the whole change. Verified: all five reach
opacity 1.00 at their own beats, in ascending time order (t = 24.60, 27.95, 31.20, 35.85, 45.90).

**Flagged, not "fixed": Exp04 and Exp05 carry the SAME 29% fill**, so the first two beats (+10 at
s12 and +30 at s13.1) do not visibly advance the bar. That is what the supplied art does; changing
it is a design decision, not a build one. If the bar should move on every award, the fills need
re-drawing (or the build has to override them, which would mean the art and the render disagree).

**The level-up moment is NOT built** — user's directive pending.

**Resolution caveat still stands:** all five sources are **1x** (pill ~315x87) against a 2x
pipeline, so every toast is now a LANCZOS upscale, not just toast-200. They are softer than the
retired exports at full-screen scale. The fix is `make-toasts.py`'s dual-source route per node;
the 2x opaque export lands on a differently-framed canvas, so the offset must be solved, not
assumed.

**Fandom re-import: nothing to pull.** `check-pages-sync.py` reports in sync against all 6 source
pages — the "slight update" had not been saved to `10. My Complex All Hands/fandom.html` at the
time of writing (the check is SHA-256 over the source, so this is authoritative, not a guess).
Re-run the importer once it lands; geometry has been stable across the last three revisions, but
re-run `derive-page-offsets.py` if any section moves.

---

## 2026-07-30: s8 was only picking two of the three chips

User's report: on the "Welcome to My Complex" section the cursor no longer selected Sneakers.
Cause: `home-feed` renamed that chip **"Sneakers" -> "Sneaker"**, `PICKS` still said the plural,
`prepareChips()`'s exact match found nothing, and the pick was dropped — Zack chose two topics and
pressed Continue anyway. It warned to the console, which nobody had open.

Fixed twice over: `PICKS` now carries the page's own wording, and the matcher falls back to a
singular/plural stem when the exact match misses, warning when it does. Matching by label is still
right (index would break on a reorder); it just has to survive a plural.

Verified: all three twins (Sneaker / Sports / ComplexCon) sit at opacity 1.00 by the end of s8,
no warnings, no errors.

Worth knowing: the page's PRE-picked chips have also changed — now Sneaker / Music / Sports /
ComplexCon, not the Style / Bets / Watch / ComplexCon that CLAUDE.md's s8 note describes.
`prepareChips()` strips `.sel` off all eleven first, so this does not break anything, but the
count in that note is stale.

---

## 2026-07-30: the I.D. card is the GOLD variant now

User dropped `assets/Scene 21/COMPLEX I.D - Gold.png` and `assets/Scene 22/COMPLEX I.D - Gold -
Big.png`. `id-card.webp` is rebuilt from the **Big** one (1023x609 opaque vs 843x502).

Two things had to be handled rather than copied:

- **The supplied art carries a baked shadow** — 34% soft alpha, against the <1.5% that is just
  antialiasing — and `#id-card` already has a CSS `drop-shadow`. Shipping it whole would have
  doubled the shadow. It is cropped to the card's own opaque rectangle, so the CSS shadow stays
  correct and the repo's shadow-free rule holds. Result measures 0.04% soft alpha.
- **The stage box is NOT negotiable.** `#id-card` is 466.5, 291, 958.5x594 because that box IS the
  ending video's frame 0, and `make-gold-card.py` fits s23's case onto it. So the art is fitted to
  2x that box (1917x1188). The new source's aspect is 1.6798 against the box's 1.6136, so it takes
  a x1.874 / x1.951 fit — the previous card was stretched the other way (1.5435). Do not "fix"
  this by moving the box.

**This closes most of the s23/s24 ghosting.** CLAUDE.md recorded four lines that ghost through
`END_XFADE` because our card was the 500-PTS Regular revision while the video morphs the gold
5000-PTS one. Our card is now gold: X.P. reads **5000 PTS**, Status **Gold**, and the held-by
figure **1%** — all three now match the video. Only the date still differs (05.22.2026 on the card
vs 05.19.2023 in the video). The strip is gold (155,116,61) where it was black, which is the other
half of that mismatch — CLAUDE.md's note that "the video's gold strip is 60 stage px against our
black strip's 39" should be re-measured now.

Verified: s22 small, s21 expanded, s23 wrapped and s24 frame 0 all render; no 404s, no console
errors. Previous asset saved at /tmp/id-card-prev.webp for the session.

**Not re-derived:** `tools/make-id-card.py` still describes the old two-source route from
`COMPLEX I.D No Shadow.png`. It no longer matches how this asset is built — update it before the
next rebuild, or it will regenerate the black-strip card.

---

## 2026-07-30 (final): the XP bar accumulates, and the s13.1 glide is smooth again

**The bar is now one running total across the story.** Each award animates from where the
previous one left it, and the pill *arrives* already showing that total (a `tl.set` on the bar at
the same instant the pill starts dropping), so nothing ever snaps back to zero. Measured:
0 → 0.072 → 0.29 → 0.50 → 0.74 → 0.99, each start matching the previous end exactly.

The one judgement call is in `FILL`: **Exp04 and Exp05 were drawn with the same 29% fill**, so
taking both literally would leave the +30 award moving the bar not at all. The shared checkpoint is
split by the XP actually awarded — +10 then +30 is 40 points to reach 29%, so +10 lands at
10/40 × 29% = **7.25%**. Every award now advances the bar and every checkpoint the designer drew
distinctly (29 / 50 / 74 / 99) is still hit exactly. This is safe to re-derive because the track is
empty in the WebP now — no bitmap can contradict the table.

**s13.1's glide read as choppy because the wrong thing was shortened.** Cutting the lead-in 80%
took the glide itself to 0.15 units, so the cursor covered its whole travel in ~120px of scroll —
a jump, not a move. The delay was never the glide; it was the 0.25 units of nothing before it plus
a glide twice as long as it needed to be. Now **wait 0.04, glide 0.40** — lead-in 0.44 against the
old 0.95, still a 54% cut, with the motion readable. Verified by sampling cursor travel per 0.05u
across the beat: `0.0 0.6 6.3 24.1 58.8 43.5 15.1 3.0 0.1` — a clean ease bell, not a step.
Scene is 1.55 (press at s+0.57, toast arriving by s+1.30). **If it needs to be faster again,
shorten the WAIT, not the glide.**

Timeline **57.04 units / 45,632 px**. No 404s, no console errors.

---

## 2026-07-30 (final): the vote glide moved to s13, and the XP bar is real DOM

**The cursor no longer travels inside s13.1.** User's proposal, and it is the right shape: the
cursor moves to UNDERRATED *pre-emptively during s13*, while the feed is still scrolling and the
panel is still fading in, so the travel is covered by motion that is already happening. By the
time s13.1 begins the cursor is resting on the button and that beat is only the press.

This is what finally fixed a problem two retimes could not. The glide went 0.7 -> 0.15 (choppy)
-> 0.40 (still choppy) because the duration was never the issue: **a move that has to finish
inside the beat it triggers is either slow or abrupt, with nothing in between.** Measured proof —
cursor travel per 0.05u:

    s13    0 0 0 0 0 1 3 7 13 21 32 46 64 87 87 64 46 32 21 13 7 3 1 0 0 ...
    s13.1  0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0

A clean ease bell across ~1.1 units in s13, and dead still in s13.1. The `cursorTo` left in s13.1
is a zero-distance move kept only so the click stays one implementation. s13.1 is 1.2 units.

**The progress bar is real DOM now, not a bitmap hack.** It had been the track painted flat into
each WebP with a bare div scaled over it at fractional geometry — `top: 111.5px`, `height: 4.5px`.
On a stage that is itself scaled to fit the window those land on half-pixels, which is what read as
pixelated (user's report). Now `.tbar` is a rounded track element with a rounded `<b>` fill inside
it, whole-pixel box (218, 111, 126x5, radius 2.5), `overflow: hidden` so the fill's radius cannot
poke past the track, and only the inner fill transforms. The flat patch still in each WebP sits
exactly underneath and is covered.

Verified after both changes: all five bars still accumulate exactly —
0 → 0.072 → 0.29 → 0.50 → 0.74 → 0.99. Timeline **56.69 units / 45,352 px**. No 404s, no errors.

---

## 2026-07-30: docs pass — what every MD now claims

All four MD files brought up to what the code does. Corrections worth knowing, because each was
a claim that had gone false rather than merely missing:

- **Timeline is 56.69 units / 45,352 px.** CLAUDE.md and HANDOFF's own status header both still
  said 57.09/57.39. It has moved five times today; treat any written figure as stale and read the
  `?debug` HUD.
- **`tools/make-id-card.py` is marked STALE in both CLAUDE.md and export-assets.md.** Running it
  as-is regenerates the retired *black-strip* card. `id-card.webp` is now hand-built from the gold
  source, cropped to its opaque box so its baked shadow does not double with the CSS one.
- **The I.D. card note's "gold strip 60px vs our black 39px" is retired** — ours is gold now, and
  the s23→s24 ghosting is down to the date line alone.
- **`tools/make-toasts.py` no longer builds what ships.** Both files now say so; it stays as the
  record of why the canvas is 440×299 and why the pill is centred.
- **New XP-toast section in CLAUDE.md's Architecture** covering the accumulating bar, the real-DOM
  `.tbar`, why the bitmap version pixelated, and the derived 7.25% for +10.
- **New s19.1/s19.2 section** covering the PDP panel, the 388 authored width, and the `frac`
  cursor targets. The scene-order quirk now records the 19.x insertion and that **19.3 is not
  built**.
- **PAGES-SYNC.md and export-assets.md** updated for the sixth page (`product.html`) and the new
  toast family.

Outstanding, and stated in the docs rather than hidden: 19.3 unbuilt; the two Carti merch
satellites have no new source; `sat-comment` is a revision behind Figma; the five toast sources
are 1× against a 2× pipeline; a flat patch is still baked under each pill's CSS track; and the
fandom "slight update" had not been saved at the time of writing (`check-pages-sync.py` green).

---

## 2026-07-30: s13.1 REVERTED to its original timing — do not retime it again

Every attempt to make the UNDERRATED vote feel faster was rejected, and the last one (moving the
glide pre-emptively into s13) was rejected outright: "revert the underrated cursor movement to its
original state with the delay and all."

**s13 and s13.1 are now exactly as they were before 2026-07-30:**

- `s13` — `cursorTo(tl, CUR.s13, s + 0.9, 0.7)`, span 2.0
- `s13.1` — `cursorTo(..., s + 0.25, 0.7)`, span 1.9, press at s+1.08

Timeline back to **57.39 units / 45,912 px**.

The three rejected attempts, so nobody repeats them: glide 0.7 → **0.15** (read as choppy);
0.15 → **0.40** (still choppy); and moving the travel into s13 entirely so s13.1 only presses
(measured perfectly smooth — a clean ease bell in s13, dead still in s13.1 — and still not what
was wanted). **Leave this beat alone unless the user asks again, and if they do, ask what
specifically feels wrong before changing a number.**

The XP progress bars are unaffected by the revert and still accumulate:
0 → 0.072 → 0.29 → 0.50 → 0.74 → 0.99.

---

## 2026-07-30: the stray white line in the XP bar

User: "I still see that weird white line preemptively, part of the progress bar, and then there is
the actual fill on top of it." Correct — the art still had part of the old bar in it.

The first repaint covered only the grey track's rows (223–231). The baked **white fill is ~1px
taller on each side** (rows 223 and 232 measured bright after the paint), so a sliver of the
designer's pre-filled bar survived outside the CSS element and read as a second, static bar under
the animated one.

Fixed by rebuilding all five from `Exp01–05.png` and inpainting rows **218–238** across the bar's
own columns, interpolating the pill's vertical gradient between two clean rows. Two things this
had to avoid, both of which were hit on the way:
- a flat fill leaves a visible band, because the pill's background is a gradient;
- a generous x-window **smears the XP coin** — the paint span must be derived from the bar's own
  bright columns, not guessed.

Verified: no pixel above the background threshold survives in the bar region of any of the five,
and the rendered bar profiles as fill-then-track with nothing beyond it. Cache-busters at `?v=9`.
The bar is now entirely CSS — the art contributes nothing to it.

## 2026-07-30: Scene 19.3 is BUILT — STATUS UNLOCKED, and the card flips to Bronze

The Figma 19.3 changed under the earlier notes: node `2126:11248` is no longer the
"YOU UNLOCKED A new badge!" modal — it is a **STATUS UNLOCKED sheet** ("You've earned Bronze
Status" / "Complex I.D. Card · 1,500 XP to Silver") with Martin Hen's I.D. card featured over
the dimmed fandom page. The user's brief: card 1 (800 PTS / Regular) flips in 3D and
becomes card 2 (1000 PTS / Bronze), scrubbed frame-by-frame with the scroll — first specced
as a 360° turn, revised the same day to ONE slower 180° half-turn. Sources are
`assets/card animation/card 1.png` / `card 2.png`. That makes 19.3 the purchase's second
answer: +200 XP at 19.2 is what tips Martin past 1,000 PTS.

**What was built (label `s19.3`, 2.9 units, between 19.2 and s20):**
- `tools/make-flip-cards.py` → `flip-regular.webp` / `flip-bronze.webp`, both registered on
  their solid-alpha bboxes into ONE 920×667 box (2× of Figma's own card node: stage
  (730, 423.48) 460×333.23). The sources land already matched — both carry the same 1267px
  solid content — so the crop-and-fit registers them within a pixel (mask IoU 0.992). The
  TYPE inside the card sits ~15px differently between the designer's two revisions; harmless
  here because nothing dissolves and only one face shows at a time (contrast END_XFADE, where
  exactly this kind of mismatch ghosts).
- `#status-modal` in index.html — coded sheet (live Inter type per the Figma specs) + a real
  3D stack: `#sm-flip` carries `perspective: 1300px`, `#sm-card` carries `preserve-3d`, two
  faces with `backface-visibility: hidden` — Regular is the front, Bronze is the BACK,
  pre-rotated 180° so the half-turn lands it un-mirrored. **No filter and no animated opacity on or between those two
  elements** — CSS grouping flattens preserve-3d silently; the sheet's drop-shadow lives on
  `#sm-panel` and the entrance pop on `#status-modal`, both safely outside the 3D context.
  Stage-level overlay, deliberately: the card overhangs the phone screen by 10px each side by
  design, and a mid-turn card projects past its box — `#screen`'s overflow would slice it.
- The timeline rotates `#sm-card` 0→180° over 1.6 units, `power2.inOut` — one continuous
  tween with NO discrete state anywhere in the scene: `backface-visibility` alone does the
  reveal, so there is nothing to mis-restore on a reverse scrub. NOT a back/elastic ease: an
  overshoot past 180° swings the revealed Bronze face past flat and back, a visible wobble.
  (The first build was a full 360° with a hidden second front revealed by two `tl.set`s at
  the exact midpoint; the user cut it to a single, slower half-turn the same day. If a full
  turn ever returns, that machinery is in the git history — and its midpoint arithmetic only
  holds for a symmetric ease.)
- s20's opening moves shifted one scene later, and the ORDER inside 19.3 is the user's spec:
  the pill's bar fills at the end of 19.2 (that is the level-up), then the PDP leaves, then
  the pill floats back up and goes, and only then does the sheet arrive. **The page does not
  scroll under any of it** — there is deliberately NO `POS.fandom.s19_3`; the level-up plays
  over the same frame the purchase happened on. (The offset solved at −3665 against the
  current design, 18.1× confidence, if Figma's own framing — a different post — is ever
  wanted; breadcrumbs in POS and derive-page-offsets.py, ref kept at shots/refs/ref-s19_3.png.)
  **s20 clears the sheet + the scrim, and holds the page still until the sheet has fully
  dismissed** — the scroll to Jordan Rose's post is the next thing that happens, not something
  the level-up dissolves into. `CUR.s19_3` = (1677, 905), Figma 19.3's own parked cursor
  pose — the press that caused this scene was 19.2's, so the cursor stands aside at s+0.15
  before the sheet pops.

**Verified** (scrub.py, forward + backward seeks, re-run after the 180° cut): pre-scene frame
shows no sheet; Regular card at rest over the unmoved shop grid; mid-turn shows the un-mirrored
Bronze back; rest state is the Bronze card matching the Figma render; s20+0.38 has the sheet
and scrim gone with the page still parked, and the scroll to Jordan Rose's post starts only
after; seeking BACK from past the flip restores the Regular face. No console errors. Timeline
is now 48,232px (was 45,912) — the `?debug` denominator to expect.

**Fallout for the earlier notes:** `assets/Scene 19/Badge Packet Animation.mp4` is now
ORPHANED — it was the old 19.3's asset and nothing references the badge-unlock modal any more.
Leave it (tracked source material, `.vercelignore`d via `*.mp4`) unless the design brings the
beat back. `.vercelignore` also gained `assets/card animation/` (sources for shipped WebPs),
and — found while there — `PAGES-SYNC.md` and `.githooks/`, which were shipping to the public
URL by default.

---

## 2026-07-30: s19.2 now serves the All Hands build's own `pdp.html`

The PDP authored from this side (`product.html`) is superseded by **`pdp.html`** in the All Hands
build. `make-page-assets.py`'s PAGES imports `pdp` instead; `product.html` is left in the source
folder (not ours to delete) and is no longer imported.

It dropped in almost cleanly — same `.scene` root of **388 × 858.2847**, so `#panel-product` did
not move. Two things did change:
- **Selector**: `PAGE_TARGETS.s19_2` now finds `.btn-pay` (their class) instead of `.pdp-shoppay`.
  The `frac` needed no change at all — shop Pay lands at stage y **906.46** against the Figma
  tree's 906.54, ADD TO BAG at 850.76 against 850.82, and the cursor tip at **(1282.3, 929.2)**
  against the storyboard's (1282.3, 929.3).
- **`border-radius: 12px` restored on `#panel-product`.** Their `.scene` carries it, and this
  container clips (`overflow: hidden`), so a square container shears the design's corners off. It
  was square because I read the *isolated Figma render's* corner alpha instead of the page.
  **Read the page.**

### The checker now catches an unimported source page

This is the gap that let it happen: `pdp.html` sat in the source folder for ~90 minutes while the
prototype served `product.html`, and **every sync check was green** — both files were individually
in sync, they just were not the same page. `check-pages-sync.py` now reports *every* `*.html` in
the source that is not imported, not only the ones already in PAGES, and says so explicitly when
one is not in PAGES at all ("…so it never will be"). `IGNORE` holds `all-scenes` (a combined
build, not a page) and `product` (superseded — drop it from there if it is revived or removed).

It earned its keep immediately: on first run it flagged both `product.html` and a **fresh save of
`pdp.html`** (13,459 → 14,362 bytes) that had landed mid-task.

## 2026-07-30: the s19.3 flip is the designer's VIDEO now, scrubbed frame by frame

Third revision of the flip in one afternoon, superseding both coded versions below: the user
dropped `assets/card animation/Flip_Transition_Animation_Reversed.mp4` (1112×834, 5s @ 60fps —
the card turning Regular → Bronze, rendered with real perspective, motion blur and a moving
shadow) and asked for it to play frame-by-frame with the scroll, **contained inside the white
sheet so nothing bleeds out and the 3D illusion holds**.

- `tools/make-flip-frames.py` → `assets/flip-frames.webp`: 60 frames at 12 fps, 8×8 grid,
  1.5× cells, 0.86 MB. All the s11/s24 capture rules apply (rVFC during playback,
  `playbackRate` 0.25, sample by mediaTime) plus one of its own: **each frame's backdrop is
  normalised to pure white** with a per-frame gain keyed to the border ring's **10th
  percentile** — the median left the vignette corners at ~253, which reads as a faint window
  edge against the panel's true white.
- The window (`#sm-flip`) is now the s11 machinery — a clipping box over the sheet, one cell
  shown, moved by transform — at the **panel's inner width** (391.2 stage px, video's 4:3),
  flush inside the borders. It deliberately does NOT honour Figma's card box, which overhangs
  the panel: an RGB video cannot overhang anything. The card reads ~10% smaller than the
  Figma node — the price of containment, accepted by the spec above.
- The sweep is `ease: none` (unlike the coded flips): the video's own animation curve is
  baked into its frames, and easing the sweep would double-ease the motion. 1.6 units,
  ~21px of scroll per frame, s+1.1 → s+2.7 of the 2.9-unit scene.
- **Alpha-matting the video was tried and is a dead end** — the card's paper face is the same
  near-white as the backdrop, so a border flood-fill leaks INTO the card (frame 0 keyed to
  20% foreground). White-on-white containment is the robust answer; the tool's docstring
  records this so nobody re-attempts it.
- Retired: `flip-regular.webp` / `flip-bronze.webp` (the coded flip's registered faces) —
  kept in git, added to `.vercelignore`; `make-flip-cards.py` marked superseded, kept as the
  face-registration record. Manifest updated (flip-frames added, faces marked retired).

**Verified** (scrub.py): sheet pops with the video's frame 0 (Regular card) showing; quarter
and mid frames show the rendered 3D turn with its own shadow, edge-on at the sweep's centre;
the video region is indistinguishable from the panel (no window edge, no bleed past the white
frame); rest state is the Bronze card; backward seek restores the Regular frame; s20 handoff
unchanged. No console errors. Page length unchanged at 48,232px.

## 2026-07-30: the finale fades to black from the video's 3.5s mark

User's spec: "exactly at the 3.5-second mark, start fading out the video to black until it's
all black till the end of it." Built as `#ending-fade` — a black overlay ABOVE `#ending`
(fading `#ending` itself would expose the s23 layers under it, and any transform on it breaks
the frame-0 registration) — ramping 0→1 with `ease: none` from `END_FADE_FRAME` (42, = 3.5s ×
the sheet's 12 fps) to the sweep's last frame. The fade's timeline position derives from the
SAME frame→time mapping the sweep uses (`s + 0.45 + f/(END_FRAMES−1) × END_SWEEP`), so the
two cannot drift and the fade scrubs and reverses like everything else. The page's held
bottom (`end` label) now rests on black.

This is NOT the dip-to-black the s24 header warns against — that warning is about covering
the frame-0 handover seam, at the other end of the sweep; this fade never reaches it.

**Verified** (scrub.py + luminance measurement): s24+2.0 full brightness (fade not yet
started); s24+2.35 mean luma 27/max 136 ≈ 47% faded, matching the scrub fraction exactly;
sweep end and the `end` rest both measure 0.00 — pure black; reverse seek to s24+1.5 restores
the video fully. No console errors.
