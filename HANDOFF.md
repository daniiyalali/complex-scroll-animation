# HANDOFF — Fandom × My Complex scroll animation

_Last updated: 2026-07-29 (**the whole prototype now runs on live product pages**; all local
and unpushed)_

## Status: complete and working locally. A long way ahead of `origin/main`.

All 28 storyboard frames (24 scenes + the four 5.x hover states) are implemented,
choreographed, and visually verified, on the black stage. Zero console errors;
~10 MB WebP payload plus a 61 KB font, preloaded behind a loader.

**The biggest change since the original build: the flat Figma strip exports are gone.** The
phone and both side slabs now hold the **live product pages** from `../10. My Complex All
Hands/`, so cursor beats land on real elements and the interactions are the product's own
behaviour. Six-step rollout, all done — see "swapping the baked strips for the live pages".

Three scenes also grew past the storyboard, on the user's direction:

- **s7** no longer cuts to MY COMPLEX. Zack whips the feed back to the top with the s3/s4
  gesture inverted and clicks the MY COMPLEX tab. The fling home is the page's second
  **wall-clock** beat.
- **s8** no longer arrives with the topics pre-picked. He picks SNEAKERS → SPORTS →
  COMPLEXCON on the page's own chips, then hits CONTINUE.
- **s13.1 is new**: the article opens in the left slab, parked on rank 30, and he votes.
  **s14** now drags two rows in the live rerank editor.

Together these took the page from 44.5 units / 35,600 px to **50.8 units / 40,640 px**.

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

## Scene → mechanism map

| Scenes | Beat | Mechanism |
|---|---|---|
| 1–2 | Hero, cursor arrives | latest strip @159; cursor in |
| 3 | Comes in, winds up | arrives off the bezel untilted, then a short accelerating dip **DOWN** while turning, landing cocked in the storyboard pose — tilted **30°**, tip exactly on the screen's right edge (1180,609). The feed does **not** move on the backswing. 1.2 units |
| 4 | **The whip** | fast upstroke (0.28 units) → release. Feed tracks the cursor **1:1** for the 466 px upstroke (`CUR.s3b.y − CUR.s4.y`), then the cursor peels away + un-tilts and the strip flings the remaining ~4k to **−4346, the article list** on `power3.out`. Nav slides away with the upstroke. **1.9 units** — trimmed to just past the fling's landing (s+1.84) so s5 picks the scroll straight back up; it used to run to 2.4 and leave 448 px of dead scroll. |
| 5 | Callouts + hover pass | strip → −7476; callouts stagger in; then the `HOVER_PASS` pass — cursor stops on REACT → COMMENT → BOOKMARK → FOLLOW (exact Figma beats in `HOV`), each swapping that callout to its `.act` face and back; FOLLOW is a press and its FOLLOWING face stays. Scene is 2.7 units |
| 6 | Heart click → picker + reaction wall | callouts fade out at scene start; cursor clicks the story's heart (tip ≈ (785,527)); the DARK tray grows from its pointer tail above the heart (origin '49% 100%'); the animated 4×5 wall of 20 reactions cascades in on the diagonal; cursor then drifts up onto the tray (`CUR.s6b`) where the storyboard leaves it. Scene is 1.9 units |
| 7 | Whip home → MY COMPLEX tab switch | the s3/s4 swipe upside down: cursor rises off the tray into the same 30° cocked pose, contacts, whips DOWN, feed tracks it 1:1 for 466px — then the release hands off to a **wall-clock** fling that carries the feed the remaining ~7,000px to the top of the feed while the sticky nav slides back down with it (`AUTO` in main.js; not scrubbed, so the reader doesn't crank it home by hand). Cursor then glides to the MY COMPLEX tab (centre from Figma node `1838:87226`), clicks, and the nav swaps in place as a hard cut + the feed crossfades to MY COMPLEX. Scene is 2.9 units |
| 8 | Pick three topics → Continue | myc strip → −167, then Zack **picks** SNEAKERS → SPORTS → COMPLEXCON and hits CONTINUE. All 11 pills are coded DOM over the baked block (`#pills` inside `#strip-myc`, Inter vendored) because Figma baked Style/Bets/Watch/ComplexCon pre-filled; picked faces snap in at the bottom of each press. Cursor beats derived from the pill/button boxes. Scene is 3.7 units |
| 9 | Story page, like+save | myc strip → −1061 |
| 13 | WNBA card pause + the article opens | phone rests on the WNBA card; the left slab (now `pages/article.html`) fades up parked on rank 30. **No XP toast here** — see 13.1 |
| 13.1 | Vote on rank 30 | cursor presses UNDERRATED, the results row reveals with the page's own tally, and **then** the +30 XP toast drops. 1.9 units, the tail being a deliberate hold so the toast can be read |
| 14 | Rerank: one swap | `pages/rerank.html` in the right slab; row 3 → 4 only. 3.0 units |
| 10–11 | Comments drawer, +100 XP | drawer slides from bottom over scrim; modal pops |
| 12–14 | Poll → list vote → rerank | myc −3765 → −7694 → −3765 (intentional back-scroll, see quirks); XP toasts 20/30/80 drop over the nav; side panels slide in |
| 15 | Quiz autoplay (4.6 units) | myc → −6118; cursor clicks START QUIZ on the feed card (≈ s+1.2) and only THEN the right panel slides in; it then autoplays 6 stacked frames captured from the live reference app (`Reference Projects/4. Complex Quiz`, prod build `/play` at 390×887@2x): Q1 → option A locks → Q2 → option A locks → "Perfect. 5/5" reveal → First Play badge (pop, `back.out`); toast-120 lands with the badge |
| 16 | Fandoms rail | a **scroll** in home-feed to its Fandoms card (page y 4800), not a strip crossfade — the rail was its own export before, but it is a card inside this page. `POS.myc.s16 = −5361`, solved so the Playboi Carti entry sits under the cursor |
| 17–18 | Carti fandom page | app-style push between two **live pages** (home-feed slides left, `pages/fandom.html` in from the right). That page's nav is 92px, not 159 — it has no tab row — so the old nav image and its clip-path reveal are both gone |
| 19–20 | UGC cards explode/recede | 4 upright satellites fly out **from behind the phone** (`#sats img { z-index: -1 }` — above the stage bg, below the phone) with rotation+stagger; resting rotations: editorial −5°, ugc +10°, comment −16°, video +16.5°. Right-card lefts are gap-matched to the mirrored left cards using ROTATED bounding edges (phone bezel x=1195: editorial↔ugc ≈50px, comment↔video ≈69px) — see the comment in styles.css before nudging |
| 22→21 | I.D. surfaces, expands | stickers pop; ONE clean `#id-card` image scales .422→1 with y −63→0 (no crossfade) |
| 23–24 | Gold card → lanyard photo | zoom-in, then dissolve into full-bleed Ken Burns photo |

Strip offsets in `POS` come from the Figma scene metadata ("Scene 1" container Y +
strip child Y per scene). **`POS.latest.s4` was wrong** — it read −4969 and overshot the
storyboard's article list by 623 px into "Suggested channels". Recovered as **−4346** by
composing the strip tiles and matching the Figma frame row-by-row (diff 2.4 vs 7.5 for
the neighbouring offsets); the rendered frame is now pixel-equal to scene 4 (diff 2.10).
`s1` (159) and `s5` (−7476) were re-checked the same way and are correct. Prefer that
matcher over re-reading the metadata — it is direct evidence and it took one pass. Most interaction states (Following, liked hearts, answered
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
- `.vercelignore` cuts the deploy to **62 files / ~10.0 MB** (61 + `inter-subset.woff2`,
  61 KB, added 2026-07-29 for the coded s8 pills). That set was derived by
  recording every request a real page load makes and diffing it against what the ignore
  file keeps — not by grepping the source. Do it that way again if you change what loads:
  a regex over `index.html`/`main.js` misses anything built from a template literal
  (the sticker and, formerly, the emoji srcs in `buildDom`), and would have shipped a
  broken page.
- It also keeps `CLAUDE.md`, `HANDOFF.md`, `tools/` and the retired assets off the
  served URL.

**Two ways this bit on day one — both because `.vercelignore` is a DENY-list, so
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

Re-run the check after touching assets or the ignore file — it takes seconds and caught
both of the above:
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

## Dead scroll between scenes (re-measured 2026-07-29, after s7 + s8)

Every scene is a fixed span, so if its last tween finishes early the remainder is scroll
where **nothing moves** — it reads as having to nudge the wheel to make the page continue.
The user flagged this at the 4→5 handover (0.56 units = 448 px); s4 is now trimmed to 1.9,
leaving 0.06 units / 48 px. Full table, worst first:

| scene | dead tail | px | note |
|---|---|---|---|
| s1 | 1.00 | 800 | intentional hero hold |
| s23 | 0.60 | 480 | gold card settling |
| s22 | 0.44 | 352 | |
| s11 | 0.40 | 320 | XP modal held |
| s13 | 0.40 | 320 | |
| s19 | 0.40 | 320 | satellites held |
| s21 | 0.40 | 320 | |
| s16 | 0.30 | 240 | |
| s20 | 0.30 | 240 | |
| s5 | 0.29 | 232 | FOLLOWING held (deliberate) |
| s24 | 0.20 | 160 | |
| s13.1 | 0.33 | 264 | deliberate — holds the +30 XP toast |
| s14 | 0.07 | 56 | |
| s2 | 0.20 | 160 | |
| s6 | 0.20 | 160 | |
| s7 | 0.15 | 120 | rebuilt scene, budgeted to its own last tween |
| s9, s10 | 0.05 | 40 | |
| s3 | 0.10 | 80 | |
| s18 | 0.10 | 80 | |
| s4 | 0.06 | 48 | trimmed from 0.56 |
| s8, s12, s14, s15, s17 | 0.00 | 0 | |

Some are deliberate holds that let a beat land — don't trim blindly. Re-measure with the
per-scene walk over `tl.getChildren()` rather than reading durations by eye; the numbers
above came from that. Note a `power3.out` fling is ~96% done at two thirds of its
duration, so a scene can look static well before its last tween actually ends.

The two scenes rebuilt on 2026-07-29 were budgeted against this table as they were written
(s7 → 0.15, s8 → 0.00), which is the habit to keep: pick the span from where the last tween
actually lands, not from a round number.

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
- **Unbuilt material is sitting in `assets/`** as of 2026-07-29: `Badge Packet
  Animation.mp4`, `Last frameCinematic Morph Video 1.svg`, and `Scene 11/360-Degree
  Animation 1.mp4`. Tracked in git, excluded from the deploy, referenced by nothing.
  They look like the next scenes' source material (a badge reveal, a cinematic morph,
  and a 360° spin for s11) — confirm with the user before wiring any of it in.
- The Figma file was temporarily modified during the original export (EXPORT-* clones);
  **all were deleted** — verified zero leftovers. Re-exports will do the same dance.
- `PX_PER_UNIT=800` — 50.8 units, so a **40,640 px** page. Has NOT had a human trackpad
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
file is a deny-list. Page is now 47.7 units / **38,160 px**.

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
| 5 | `rerank.html` → s14, drag row 3→4 and 6→7 | **DONE, verified** |
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
| deploy | 61 files / ~10 MB | **255 files / 12.7 MB** |
| timeline | 44.5 units / 35,600 px | **50.8 units / 40,640 px** |
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
Page is now **50.8 units / 40,640 px**.

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

## Next steps (suggested)

0. **Commit and push the s7 + s8 work** — it is local only. Stage explicit paths
   (`main.js styles.css CLAUDE.md HANDOFF.md vendor/inter-subset.woff2`); the user drops
   assets into `assets/` while you work, so never `git add -A`. Ask before pushing: `main`
   is public and wired to Vercel, so a push is a publication.
1. **Keep going scene by scene** — this is the shape the last two tasks took: the user
   watches a scene, says what it should *do* rather than how, and the answer is usually
   "the export baked a state that needs to become an interaction". Scenes with baked
   interaction states still to earn: s9's like+save, s12's poll vote, s13's list vote,
   s17's fandom join. Same treatment as s8 (coded DOM over the baked block) if asked, and
   `../10. My Complex All Hands/` is the fastest source for the real markup and tokens.
2. **In-betweening / finesse pass** (user's standing request): continuous shared-element
   transitions instead of fade-swaps — candidates: s16 rail crossfade, toast/panel
   handoffs. The single-image s21 card morph is the pattern to follow. (s7's tab switch
   was on this list and is now done — see above.)
3. User feel-pass on real hardware → tune `PX_PER_UNIT`, per-scene durations, Lenis lerp
   (and re-check `HOVER_PASS` against the ~1.5s spec afterwards). The page is now 7% longer
   than when the pacing was last discussed, which is worth raising.
4. Safari + Firefox manual check. **New risk**: the vendored woff2 (`font-display: block`)
   and the coded pills are the first text the page renders itself — check the pill block in
   both, since a font fallback there would be obvious against the baked art around it.
5. **Import the repo at vercel.com/new** — the only outstanding shipping step. Then
   rotate the GitHub token, and decide whether the repo should stay public.
6. Optional deferred polish: typing reveal in the comments drawer, poll-bar grow animation
   (would need answered/unanswered poll patch exports), keyboard/screen-reader affordances.
7. **Open question for the user**: the "Zack" tag overlaps one non-target pill on the s8
   SPORTS press. Unavoidable at the current tag size (8px row gaps vs a 47px tag) and the
   label is not to be moved, so the remaining levers are the pick order or the tag's size.
