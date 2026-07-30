# Fandom × My Complex — Scroll-Driven Storyboard Animation

A standalone scrollytelling page that plays the 28-frame Figma storyboard
("Fandom x My Complex", file key `0Wn6kFfKuKalOCTev3uUjA`, canvas `1838:87183`)
as one continuous scroll-scrubbed animation: Zack's cursor browses the Complex
mobile site inside a phone mockup — following, reacting, commenting, earning XP,
joining the KATSEYE fandom, shopping the drop, buying a hoodie and levelling up to Bronze
(the s19.3 STATUS UNLOCKED sheet, where his I.D. card flips over) — ending on the Complex I.D.
gold card, which then plays out as the closing video: the encased card glows, morphs onto a real person at
ComplexCon, pulls back over the crowd and fades to black, scrubbed frame by frame like everything else.

**The stage is black.** Only stage-level furniture is dark-themed (background,
phone frame, callouts, s13/s14 slab, reaction tray); everything inside the phone
screen stays the light product UI it is in the exports. The palette lives in the
`:root` token block at the top of `styles.css` — change it there, not per rule.
Figma's Scene 06 (`1898:70036`) is the reference frame for the dark treatment.

## Run

```bash
python3 tools/check-pages-sync.py   # FIRST — is pages/ still the All Hands build?
python3 tools/serve.py              # from this directory — port 8321, no-store
open http://localhost:8321
```

**Run the sync check at the start of every session, before judging anything on screen.**
`pages/` is generated from a local-only sibling folder that is edited *while* the prototype is
being reviewed, and the import rewrites the markup, so `pages/` cannot be diffed against its
source — staleness is invisible. If it reports STALE, re-run `tools/make-page-assets.py` before
looking at anything, and re-run `tools/derive-page-offsets.py` **if the page geometry moved**
(content-only revisions leave the offsets valid; a new or resized section does not). The same
check runs from `.githooks/pre-push` and asks before publishing a stale prototype. Full
reasoning and the failure modes: **`PAGES-SYNC.md`**.

A server is REQUIRED — `file://` fails silently (the page fetches
`assets/manifest.json`). Append `?debug` for a HUD (progress %, scene label,
scroll px) — optional, purely diagnostic.

**Deep-link to a scene: `localhost:8321/#s19.2`.** Any timeline label works, and a bare label
lands **75% through** the scene, where the beat has resolved — a label marks the frame *before*
its scene has happened, so `+0` shows the thing you linked to as absent. `#s19.2+0.2` addresses
an exact offset, the same (label, offset) pair `tools/scrub.py` takes. This exists because the
page is one ~48,000px scroll and everything before ~66% is unchanged by most edits: "reload and
scroll three quarters of the way down" read as the work not existing, twice, on 2026-07-30.

**Use `tools/serve.py`, not `python3 -m http.server`.** `index.html` loads `main.js`
and `styles.css` with no `?v=`, and the plain module sends `Last-Modified` and answers
`If-Modified-Since` with a 304 — so Chrome will keep a tab running the *previous* build
after an edit even through a hard refresh, and the iframes are worse because a reload
need not revalidate a frame's document. That has already cost a review cycle
(2026-07-30: two new scenes were reported as missing while the server was demonstrably
serving them). `serve.py` sends `no-store` and strips `Last-Modified`, so what you see is
what is on disk. **The `scroll x / N` denominator in the `?debug` HUD is the quickest
check that a tab is current** — it is the timeline length, so it changes whenever a scene
span does.

## Ship

Origin is `github.com/daniiyalali/complex-scroll-animation` (**public**, `main`).
Hosting is Vercel via its Git integration, so **every push to `main` redeploys** —
there is no build step, `vercel.json` only sets cache headers. `.vercelignore`
trims the 1.1 GB working directory to **261 files / ~17.9 MB** (`pages/` is 221 files / 8.56 MB
of it, `assets/` 31 / 8.98 MB — 2.96 MB of that is the s24 ending sprite sheet), of which
**257 paths** are fetched by a real page load (that measured set predates s19.3 — since then
`flip-frames.webp` ships, +1 file / +0.86 MB, and the two coded-flip faces it obsoleted never
shipped; **re-derive at the next push**, the way the rule below says); it also
keeps `CLAUDE.md`, `HANDOFF.md`, `PAGES-SYNC.md`, `tools/`, `.githooks/`, `Feedback/`,
`assets/General/` and `assets/card animation/` off the served URL.

If you change what the page loads, re-verify the deploy set the way it was
derived in the first place — record a real page load's requests and diff them
against what `.vercelignore` keeps, rather than trusting a regex over the source.
`.vercelignore` is a **deny-list**, so anything new ships by default; that has already
leaked unreferenced video into the deploy set once, and nearly published `.git/`.
Also: the user drops assets into `assets/` while you work — check `git status` before
`git add -A`.

**Toolchain on this machine**: no `node`/`npm`/`npx`, no Homebrew, no `gh`, no
`vercel` CLI. Playwright is the **Python** package. `tools/deploy-vercel.py` is a
stdlib-only fallback that deploys straight to Vercel's REST API with a
`VERCEL_TOKEN`; you only need it to ship without going through GitHub. Git pushes
need no token — the credential lives in the macOS Keychain and
`credential.helper=osxkeychain` is already configured. Never put a token in
`.git/config` or any tracked file.

- **Nothing here needs Node** — this page is static and verified with Python Playwright.
  But if a task genuinely does (2026-07-29: a Next.js section for the `/editions`
  deck in the sibling `MYCOMPLEX-site`), you do not have to give up or install
  anything: fetch an official standalone build into the scratchpad and put it on
  `PATH` for that shell —
  `curl -fsSLo node.tar.gz https://nodejs.org/dist/v22.14.0/node-v22.14.0-darwin-arm64.tar.gz`,
  untar, `export PATH="…/bin:$PATH"`. 45 MB, no system install, gone with the
  scratchpad. `npm` fails with `env: node: No such file or directory` until `node`
  itself is on `PATH` — that error is the shebang, not a broken download. This is
  what made `tsc` / `next build` / a real browser pass possible, and the browser
  pass immediately caught a bug static review had missed.
- **A PR without `gh`**: `git credential fill` (fed `protocol=https\nhost=github.com`)
  returns the token git already uses to push, which can POST to
  `api.github.com/repos/…/pulls`. It works, but it is reaching into the user's
  credentials — **ask first** unless they have clearly asked you to complete the PR,
  and never print or persist the token.

## Files

| Path | What |
|---|---|
| `index.html` | Static DOM: stage → phone/screen → live page frames, overlays, satellites, cursor |
| `styles.css` | All positioning in 1920×1080 stage px, 1:1 with Figma coordinates. `.page` / `.page-1x` are the live-page frames |
| `main.js` | Scene offsets (`POS`), cursor beats (`CUR`), page mounting + `prepare*()` prep, master GSAP timeline, Lenis wiring, loader |
| `vendor/` | gsap 3.12.5, ScrollTrigger, lenis 1.1.14, and `inter-subset.woff2` — the product typeface. Needed by the coded s10 comments tray, and loaded by the `pages/` frames themselves (vendored, no CDN) |
| `assets/` | WebP overlay art + `manifest.json` (asset → Figma node ID / source map). **Retired but kept in git** as source material, and excluded in `.vercelignore`: the four feed strips, three nav bars, `panel-rerank.webp`, `drawer.webp`, `xp-modal.webp`, `lanyard.webp` and the two coded-flip faces `flip-regular/bronze.webp`. Everything the live pages, the coded components or the three scrubbed videos replaced |
| `pages/product.html` | **Placeholder**, not generated — the s19.2 product-detail panel (Figma `Complex.com PDP [Mobile]` `2159:50283`). Carries the measured `.pdp-addbag` / `.pdp-shoppay` boxes so the 19.2 beat resolves today. `"product"` is already registered in `make-page-assets.py`, which **skips a page whose source is missing**, so importing the designed page later is a re-run rather than an edit |
| `pages/` | The five live product pages + their assets, generated by `tools/make-page-assets.py`. **Committed on purpose**: the source folder is a local-only sibling, so a fresh clone cannot regenerate them (same reasoning as the s15 quiz captures) |
| `Reference Projects/` | Full reference apps the user drops in (e.g. `4. Complex Quiz`, a Next.js prototype) — run them and capture real UI states when a scene needs product-true frames. **Gitignored** (~1.1 GB); local-only |
| `Feedback/` | Reference renders and screenshots the user drops in when a scene should look different. `Scene 31.png` is the s19 layout reference — see HANDOFF for how to register one of these against the stage before measuring it. **Gitignored AND `.vercelignore`d**: it is internal working material and `main` is a public repo, so it is local-only and a fresh clone loses nothing |
| `../10. My Complex All Hands/` | **Sibling folder, not part of this repo.** The user's hand-built HTML of these same product pages (`scene*.html`, `all-scenes.html`). When a scene needs a product state the storyboard export doesn't have, check here first: it has the real markup, the real tokens and the real font, so it beats re-deriving them from Figma or the raster. `inter-subset.woff2` came from it, its `.chip` / `.chip.sel` rules drive the s8 picks, and — see `tools/make-jordan-av.py` — a change meant to survive the next import has to be written back into **this** folder, not just into `pages/` |
| `tools/export-assets.md` | How to re-export assets when the design changes + export gotchas |
| `tools/make-picker-dark.py` | Regenerates the s6 reaction tray (a composite — read the docstring before re-exporting it) |
| `tools/make-react-wall.py` | Rebuilds the s6 animated reaction wall from the Scene 6 GIF |
| `tools/make-toasts.py` | **Superseded for the current art** — the five pills are now built from the designer's `assets/General/Exp01–05.png`, not from Figma nodes. Still the reference for *why* the canvas is 440×299 and why the pill is centred in the 440px screen. Read it before any rebuild; then see the XP-toast note in Architecture for what actually ships |
| `tools/make-gold-card.py` | Rebuilds `gold-card.webp` (the **encased** I.D.) from `assets/General/Jordan Rose Id Wrapped.png`, and derives the stage box that registers the case's inner card onto `#id-card` — which is what lets s23 wrap the card already on screen |
| `tools/make-id-card.py` | **STALE — do not run as-is**: it still builds the retired black-strip card from `Scene 22/COMPLEX I.D No Shadow.png` via a two-source matte. `id-card.webp` is now the **gold** card, cropped from `assets/Scene 22/COMPLEX I.D - Gold - Big.png`'s opaque box and fitted to 2× the stage box (see the I.D. card note in Architecture). Update this script before the next rebuild. It remains the record of why the card's stage box is the **video's first frame** rather than the Figma node box |
| `tools/make-flip-frames.py` | Turns the designer's card-flip video (`assets/card animation/Flip_Transition_Animation_Reversed.mp4`) into `assets/flip-frames.webp`, the sprite grid s19.3 scrubs. Same `<video>` warnings as the s11/s24 tools (rVFC capture at `playbackRate` 0.25, mediaTime sampling), plus its own: the frames' backdrop is normalised to **pure white** so the window fuses with the sheet panel it sits inside |
| `tools/make-flip-cards.py` | **Superseded same-day** by the video above — it built the two coded-flip faces (`flip-regular/bronze.webp`, now retired). Kept as the record of the face-registration method, for if the flip ever goes back to flat art |
| `tools/make-badges.py` | Rebuilds the eight s22 badges from the **rotated** Figma exports in `assets/General/Rotated/`. Read the docstring before re-exporting: the badges are rotated 8-30° in the design, the first exports had that rotation reset, and the node's `x/y` is **not** where a rotated node renders — the positions are measured off a render of Scene 21 |
| `tools/make-satellites.py` | Rebuilds the four **upright** s19 satellites from `assets/Scene 19/*.png` (the two merch tiles are not here — their rotation is baked in). A 1:1 PNG→WebP re-encode, but it also owns the **stage boxes**: those are tuned, so the registration that survives an art change is `(width, centre)` — never the top edge — and height follows from the art's aspect. Run bare to check, `--write` to build. Needed because `#sats img` has no `object-fit`, so a stale box *stretches* a card |
| `tools/make-xp-frames.py` | Turns the Scene 11 video into `assets/xp-frames.webp`, the sprite grid s11 scrubs. **Read its docstring before reaching for a `<video>`** — that file cannot be seeked |
| `tools/make-ending-frames.py` | Turns the closing I.D. video into `assets/ending-frames.webp`, the full-bleed sprite grid s24 scrubs. Same `<video>` warning as above, plus its own: capture at `playbackRate` 0.25 or Chromium silently drops a third of the frames. `--measure` prints the size/memory table the 12 fps + 1024px cell was chosen from |
| `tools/make-jordan-av.py` | Builds one fandom-page avatar. Writes a master back into the All Hands build as well as the served WebP, so the next `make-page-assets.py` run does not revert it |
| `tools/make-page-assets.py` | Imports the five pages from the All Hands build into `pages/`, resizing every raster to 2× its on-stage size and re-encoding to WebP (101 MB → 6.75 MB). Re-run after the source pages change; `--report` measures without writing |
| `tools/derive-page-offsets.py` | Solves `POS.<page>.<scene>` by registering the live page against the storyboard render of that scene. **Re-run after ANY change to a page's markup** — those offsets are the one set of numbers no Figma node gives you, and a new section dropped mid-feed moves every offset below it silently (2026-07-30: s20 was 2,512px out). Read the docstring before editing: screenshotting once per candidate offset is a trap, because `zoom` makes `scrollHeight` post-zoom while `scrollTo` is not |
| `tools/serve.py` | The dev server to use — `no-store`, `Last-Modified` stripped. `python3 -m http.server` lets Chrome keep a tab on the previous build because `main.js`/`styles.css` carry no `?v=`; that has already been mistaken for work not existing |
| `tools/scrub.py` | Playwright scrub harness: jump to any label ± offset and screenshot |
| `tools/deploy-vercel.py` | Stdlib-only Vercel REST deploy, for when there's no CLI (needs `VERCEL_TOKEN`) |
| `vercel.json` | Cache headers only — there is no build step |
| `.vercelignore` | Deny-list that cuts the deploy to the ~17.9 MB the page fetches, and names every retired asset explicitly. Being a deny-list, it has now leaked internal material twice — re-derive the set after adding any directory |
| `.gitignore` | Keeps `Reference Projects/`, `shots/` and `Feedback/` out; `assets/Scene */` masters are tracked **on purpose** (the `make-*.py` scripts read them) |
| `PAGES-SYNC.md` | How `pages/` stays in sync with the All Hands build — the session-start check, the pre-push hook, and when a re-import also needs the offsets re-solved. Read it before trusting anything on screen |
| `.githooks/pre-push` | Runs the sync check before a push and **asks** before publishing a stale prototype. Installed with `git config core.hooksPath .githooks` — **not** carried by `git clone`, so re-run that on a fresh one or the guard silently does nothing |
| `tools/check-pages-sync.py` | Answers "is `pages/` current?" by SHA-256 against `pages/.import-stamp.json`, which the importer writes. A hash not an mtime: the source is saved constantly and most saves change nothing that renders |
| `HANDOFF.md` | Current state, verification results, known quirks, next steps |

## Architecture (read this before touching main.js)

- **Stage**: fixed 1920×1080 `#stage`, scaled to fit the window (`fitStage`).
  Every coordinate in CSS/JS is a storyboard pixel from Figma — never viewport-relative.
- **Scroll engine**: body height = `SCROLL_LEN + innerHeight` (spacer `#scroll-track`);
  one ScrollTrigger scrubs ONE master timeline. Lenis (lerp 0.09) smooths input and
  drives `ScrollTrigger.update`; GSAP ticker drives `lenis.raf`. Don't add per-scene
  ScrollTriggers — everything hangs off the single timeline via labels `s1…s24` (plus `s13.1`, `s19.1`, `s19.2`, `s19.3`).
- **Pages, not strips** (rebuilt 2026-07-29). The phone and the two side slabs each hold a
  **live product page** in an iframe — the real HTML from the All Hands build, imported by
  `tools/make-page-assets.py` into `pages/`. The four flat strip exports and the three nav-bar
  images they needed are retired. This is what lets a cursor beat land on a real element
  instead of on a guessed pixel, and it is why interactions (topic picks, the article vote,
  the rerank drags) are the product's own behaviour rather than a re-drawing of it.
  - `#page-latest` home-editorial · `#page-myc` home-feed · `#page-fandom` fandom — in the
    phone screen. `#page-article` and `#page-rerank` — in `#gray-panel` / `#panel-rerank`.
  - **Each is a `.page` wrapper around an iframe, and the split is load-bearing.** The iframe
    keeps the page's authored **390px** width so it lays out as designed, and carries `zoom`
    so it *rasterises* at the target width — crisp glyphs, not a resample. The **wrapper**
    carries the `translateY` and has no zoom, so scene offsets stay in plain stage px. Zoom
    the moving element instead and every offset silently comes out ×1.128.
  - Phone pages zoom **440/390 = 1.128205** exactly; the two slabs are 390×887 — the pages'
    own width — so they are **1:1**. `mountPages` *reads* each frame's zoom (`PAGE_Z[id]`)
    rather than assuming, which is what lets the two coexist.
  - **`pointer-events: none` on `.page` is load-bearing**: every page ships a `data-goto`
    click router that calls `location.href`, so one stray click navigates a frame out of the
    prototype.
  - Full document height + `translateY`, exactly as the strips worked, so `POS`, the s3/s4
    1:1 drag and the s7 fling all keep their maths. No page ever scrolls internally.
  - **Beats that aim inside a page name the ELEMENT, not a number** — `PAGE_TARGETS` +
    `resolvePageTargets()` in boot, and the `prepare*()` functions for the interactive ones.
    A copied coordinate rots silently when a page changes; a selector does not.
    A target's `frac` puts the tip at a fraction of the element's own box instead of its centre,
    for beats where the storyboard is deliberately off-centre on a big target — still a selector,
    so it survives the page moving. Both s19 sub-beats need it, by 80px and 66px respectively.
    **When checking a tip against a render, verify BOTH axes**: s19.2's y matched the button's
    centre exactly, which made "dead centre" look true while the x was 66px out.
  - **`.page` ships `visibility: hidden` and each scene reveals its own** (`gsap.set('#page-x',
    {autoAlpha: 1})`, as s14 does for `#page-rerank` and s19.2 for `#page-product`). Skip it and
    the panel slides in as an empty slab while its container looks fine.
  - z-index inside the screen is unchanged: scrim 10, xp-modal/stickers 11, toasts 12. The
    s19 satellites are still the one BELOW-phone layer (`#sats img { z-index: -1 }`) so they
    fly out from behind the mockup.
- **Reaction wall** (s6): one animated WebP (`react-wall.webp`, a 4×5 grid of 20
  looping reactions) shown through 20 clipping cells built in `buildDom` — each cell
  holds its own `<img>` of the same file, so there's one decode, all 20 stay
  frame-synced, and each can be staggered independently. Its motion is wall-clock rather
  than scroll-driven (the s7 fling home is the only other thing on the page that is); its
  background is the same black as the stage, which is why the cells need no alpha.
- **Topic picks** (s8): the chips are the live page's own `.chip` elements. `home-feed` ships
  four of them **pre-picked** (Style / Bets / Watch / ComplexCon), so `prepareChips()` strips
  `.sel` off all eleven and stacks a `.sel` **clone** over the three Zack chooses, at opacity
  0 for the timeline to bring up on each press. A clone, not a class toggle: a class flip is
  not something a scrub can interpolate or reverse, and the two faces differ in fill — the
  same reason FOLLOW has two faces. Chips match by **label, not index**, so the page can
  reorder them. (This replaced a coded 11-pill overlay; `vendor/inter-subset.woff2` stays,
  because the pages load it themselves from inside their frames.)
- **Discrete in-page state must be driven off a PROXY, not `set({className})`.** Verified
  failure: on a reverse scrub GSAP took `voted` off the article's vote widget but left `on`
  on the button, because it will not restore an empty starting class. A proxy tween
  (`{v:0}→{v:1}` with `onUpdate` re-deriving the classes) is correct in both directions, and
  a scrub that jumps clean past it still renders it at its end, so the state cannot be
  skipped. Used by the s13.1 vote and the s14 badge renumbering.
- **Poll vote** (s12): the option the cursor is on gets **selected**, and only then does the XP
  toast drop. The live page already had the whole interaction: `.bars` starts with class
  `unvoted`, and while it is there the CSS pins every `.bar-fill` to `width: 20px` with a
  transparent background and hides every `.bar-pct` — which is why the options read as plain
  white pills. Voting removes `unvoted` and adds `chosen` to the picked bar (the selection ring
  is `box-shadow: inset 0 0 0 2px #000`), the fills take their real widths and the percentages
  appear. `preparePoll()` runs the page's own handler once to get the recomputed figures, snaps
  both states, and the timeline swaps between them off a proxy.
  - The target is **the bar under the cursor's tip**, not a hard-coded index, so the beat and
    the selection cannot disagree and reordering the poll cannot select the wrong row.
  - **The `win` treatment is MOVED onto the reader's pick.** In the product `.win` (black fill +
    `.bar-ink`'s inverted copy + a dark percentage) follows whichever option is *leading* — the
    page says so itself — while your own choice gets only `chosen`'s 2px ring. Here that read as
    the wrong row being selected: the cursor sat on option 1 and option 2 was the black one. So
    the emphasis follows the pick and nothing else carries it. The widths still encode the real
    tally, so the chosen bar's black fill is only as wide as its share — intended, not a bug.
    It is a class MOVE, not a restyle: `win` is the page's own class and every `.bar-fill`
    already ships a `.bar-ink`.
  - **Write the percentage into `.bar-pct`'s inner `<p class="trim">`, never onto `.bar-pct`.**
    Setting textContent on the container destroys that p and the styling that right-aligns the
    figure; the symptom is percentages sitting centred over the option text.
  - `.bar-fill` keeps the page's own `transition: width 450ms`, so a screenshot taken inside
    that window catches the bars mid-growth. Wait it out when verifying.
- **XP popup** (s11): the popup **is** the Scene 11 video, played frame by frame as the reader
  scrolls. Not a `<video>`: that file cannot be seeked (`currentTime` assignment does nothing —
  `python3 -m http.server` has no HTTP Range, and the file is not all-keyframe anyway), and
  scrubbing here has to be deterministic and reversible like every other beat. So
  `tools/make-xp-frames.py` extracts the frames once into `assets/xp-frames.webp`, an 8-column
  sprite grid, and the timeline sweeps a proxy across it and positions the sheet with a
  **transform** — one cell visible at a time. 63 frames, 1.45 MB.
  - **Extraction must capture during PLAYBACK** via `requestVideoFrameCallback`. Seek-then-draw
    with `onseeked` returns a stale frame and every frame comes out identical — silently.
  - The box is the **video's** aspect (0.7447), not the retired card's, centred where that card
    was. `border-radius: 15.5px` is needed because the video's frames are RGB, so the card's
    rounded corners are drawn against white and would read as a hard square over the scrim;
    15.5 is the retired asset's own radius, measured off its alpha.
  - There is no scale-pop on the container any more — the video opens with its own entrance, so
    popping the container too played the arrival twice. `assets/xp-modal.webp` is retired.
- **XP toasts** (s12 / s13.1 / s14 / s15 / s19.2): five pills, rebuilt 2026-07-30 from the
  designer's `assets/General/Exp01–05.png`. One family — same art, same 310×86 pill, all
  **centred** on a shared slot in the 440×299 render box. The first award is **+10**, not +20
  (`toast-20` was renamed `toast-10`).
  - **The progress bar is real DOM, not part of the art.** `.tbar` is a rounded track with a
    rounded `<b>` fill inside it, whole-pixel box (218, 111, 126×5, radius 2.5), `overflow:
    hidden` so the fill's radius cannot poke past the track, and only the inner fill transforms.
    It was briefly the track painted flat into each WebP with a bare div scaled over it at
    fractional geometry — on a stage that is itself scaled to fit the window, half-pixels are
    what read as **pixelation**.
    **The bar is now gone from the art entirely.** A first attempt painted over only the grey
    track's row band, but the baked white fill is ~1px taller on each side, so a white sliver
    survived *outside* the CSS bar and showed as a stray line before the fill ran. The pills are
    rebuilt from source with rows 218–238 inpainted across the bar's own columns only, by
    interpolating the pill's vertical gradient between two clean rows — a flat fill would band,
    and a wider x-window smears the XP coin (both were hit). Verified: no pixel over the
    background threshold survives in that region, and the rendered bar is fill-then-track with
    nothing beyond it.
  - **The bar ACCUMULATES.** Each award animates from where the previous one left it, and the
    pill *arrives* already showing the running total (a `set` at the same instant it drops), so
    it never restarts from zero: 0 → 0.072 → 0.29 → 0.50 → 0.74 → 0.99. `FILL` in main.js is the
    table. Four values are the designer's own, measured off the art; **+10's 7.25% is derived**,
    because Exp04 and Exp05 were drawn with the same 29% fill and honouring both literally would
    leave the +30 award moving the bar not at all. The shared checkpoint is split by the XP
    awarded (10/40 × 29%). Safe to re-derive — the track is empty in the WebP.
  - Every fill must finish before its own `toastOut`, or the bar freezes mid-way: s12's pill has
    the tightest window and was stuck at 0.23 of 0.29 until its exit moved to s13+0.45.
- **Comments tray** (s10): coded, not exported — `drawer.webp` is retired. It baked a
  pre-filled comment and character count into the composer, and patching over baked art was
  judged too fragile to keep (user's call). Structure and tokens come from the comment
  component in the sibling `3. Article Comments` prototype (`live-inject.js`), classes kept on
  its `tlc-` prefix so they cannot collide; avatars are **initials**, so the tray needs no
  image assets. The composer's type is 28px against the component's 14 — deliberate, so the
  comment being typed is readable at playback scale. Typing, the counter, the caret and the
  posted comment all derive from ONE proxy tween, which is what makes the post reversible.
- **Callouts** (s5): coded, not exported. Icons are inline SVG using `currentColor` so
  the dark palette flows through.
  - REACT / COMMENT / BOOKMARK have **one face**. Hover = the `.chip` layer fading up
    behind the row, the same icon rotating `ICON_TILT` (−8°), and the label flipping to
    **Bold**. **Nothing crossfades**: opacity on a text-free layer, a transform on the
    icon, and one discrete weight change.
    **The trigger is hit-tested, not hand-timed.** `hoverWindow()` walks the cursor's
    actual path at build time and solves the exact moment its tip enters and leaves each
    row's hit band, so the hover fires on the crossing — measured 2 px of lag, i.e. the
    scan resolution. `HOVER_ATTACK` (0.05 units ≈ 70 ms) is the fade itself, and it
    *starts* on the crossing in both directions. Never go back to offsets around
    `arrive`: that guess is what read as lag, and it silently rots the moment a stop
    moves. `SEGS` declares the path once so the tweens and the hit-test cannot disagree.
    **`hitBands()` TILES the bands** — each row owns half the gap above and below it, the
    way a real list row's hit area fills the space. Hit-testing the painted `.chip` boxes
    instead leaves 63% of the pass with nothing lit (they're ~90 px tall with ~50 px
    gutters, and the cursor covers 157 px a hop), which reads as the hover having vanished.
    **Because the bands tile, leaving one row and entering the next happen at the SAME
    instant — so the release has to FINISH on the boundary, not start there.** That's why
    there are two constants: the exit runs `HOVER_RELEASE` *before* `win.exit`, the entry
    runs `HOVER_ATTACK` *after* `win.enter`. Start both on the boundary and two rows are
    lit at once, which hover never is. Invariants worth re-testing after any edit here:
    coverage 100%, and never more than one row lit (or one label bold) at any sample.
    The weight is a `tl.set`, not a `to` — `font-weight` is a layout property and the only
    way to ramp it smoothly is a variable font, which this page doesn't ship. So it flips
    once, in true Bold, just after the tip lands and while the chip is still swelling
    around it. Discrete is right here: the two-layer weight dissolve it replaced is
    exactly what looked smeary, and there's nothing to gain from weight 400.5. Chip widths
    are Figma's hover widths, so the Bold label still fits inside them (verified).
    Figma's hover ICON art (mirrored bubble, filled bookmark) is NOT reproduced — that
    would need a dissolve. User's call, 2026-07-29.
  - FOLLOW keeps two faces (`.idle` / `.act`): it's a press that commits to FOLLOWING —
    different text, so it must swap. It snaps on the click instead of crossfading.
- **Cursor**: coded SVG arrow + HTML "Zack" tag (`#cursor`). `CUR` table holds per-scene
  arrow positions; `flip: true` turns the arrow in 2D (rotation 0↔90°, tip lands where a
  mirror would) and glides the tag to the left at a symmetric distance; `rot: <deg>`
  holds an arbitrary tilt instead (used for the s3/s4 swipe pose); `click: true` is a
  quick 10% press (scales `#cursor-inner`, never the arrow's transform — that would clobber
  the turn; no ring/pulse, removed by request). The tag never rotates. Change the name by
  editing the tag text in `index.html`.
- **The s3/s4 swipe** is a windup: the cursor comes in off the bezel, dips DOWN while
  turning, lands cocked in the storyboard pose (`CUR.s3b` — tilted 30°, tip on the
  screen's right edge at 1180,609), then whips up. The feed **does not move on the
  backswing** — the screen only answers the upstroke, where it tracks the cursor **1:1**
  before the cursor lifts and the page flings on alone. That 1:1 lock is the point: it
  makes the scroll look caused by the gesture rather than merely concurrent with it. The
  drag distance derives from `CUR.s3b.y − CUR.s4.y`, so moving either re-derives it.
- **The s7 swipe home** is that same gesture upside down — same 30° cocked pose, same
  466px amplitude, cocked tip on the same screen edge — but the windup RISES and the whip
  goes DOWN, which is how you throw a feed back to the top. Same 1:1 lock on the drag
  (`CUR.s7b.y − CUR.s7a.y`). Two things differ:
  - it lands at the top of the feed (`POS.latest.s1`), which brings the page's own nav back
    with it, so the LATEST/MY COMPLEX tabs are there to be clicked;
  - **the fling is WALL-CLOCK, not scrubbed** — see `AUTO` in main.js and the ticker gate
    in `boot()`. Scrubbed, those ~7,000 px of inertia only travel while the wheel turns, so
    getting home means cranking the whole feed up by hand. The whip stays scrubbed (the
    drag is the reader's) and the release hands off. The gate also force-completes the fling
    if the reader scrubs as far as the tab (`AUTO.snap`) before the inertia is done, and
    hands the page straight back on a reverse scrub. Nothing in the master
    timeline may touch `#page-latest` y after `AUTO.release`, or the two will fight.
  Then Zack clicks MY COMPLEX (`CUR.s7`, tab centre from Figma node `1838:87226`) and the
  nav swaps in place — a hard `set`, because the bar never left and the two arts differ
  only in which pill is filled.
- **s19.1 / s19.2 — the shop beat.** 19.1 scrolls the fandom page to the Complex Style shop grid
  and lands the cursor on the Daniela hoodie; 19.2 slides the product panel in over a dimmed
  phone and presses shop Pay, which drops the +200 XP pill. The s19 satellite recede moved into
  19.1 (the cards belong to the UGC beat); **19.3 clears the 19.2 panel and its pill**, and s20
  clears what 19.3 leaves (the sheet and the scrim).
  - `#panel-product` is Figma `Complex.com PDP [Mobile]` (`2159:50283`) — **388×858.3 at
    (1154, 110.6)**, and `pages/product.html` is authored **388**, the frame's own width, so it
    mounts **1:1** (`.page-1x`). No radius and no border on the container: the design's corners
    are square and the page draws its own 0.995px inside stroke of #303338.
  - Both cursor beats use `PAGE_TARGETS` with a **`frac`** — the storyboard is deliberately
    off-centre on both targets, by 80px on the hoodie and 66px on shop Pay. Selectors, not
    coordinates, so they survive the page moving.
- **s19.3 — STATUS UNLOCKED, and the card flips to Bronze.** The +200 XP the buy just paid out
  fills the pill's bar — that IS the level-up — so this sheet answers it in strict order
  (user's spec, 2026-07-30): the PDP leaves first, then the pill floats back up and goes, and
  only then does the coded `#status-modal` sheet pop in showing the **Regular** card, which
  flips over and lands **Bronze**. **The page does not scroll anywhere under any of it** — the
  level-up plays over the same frame the purchase happened on (there is deliberately no
  `POS.fandom.s19_3`; Figma's 19.3 frames a different post and is not honoured — it solved at
  −3665 if the design ever insists). The scrim stands from 19.2 straight through, and s20
  holds the page still until the sheet has fully dismissed — the scroll to the profile is the
  NEXT thing that happens, not something the level-up dissolves into.
  - **The flip IS the designer's video, scrubbed** — `assets/card animation/
    Flip_Transition_Animation_Reversed.mp4` as `assets/flip-frames.webp`, an 8×8 sprite grid
    built by `tools/make-flip-frames.py` and swept by a proxy exactly like the s11 popup, for
    the same reasons (that file cannot be seeked; the scrub must be deterministic and
    reversible — read that tool's docstring before reaching for a `<video>` or re-extracting).
    `ease: none` on the sweep: the video's own animation curve is baked into its frames, and
    easing on top would double-ease the motion. 60 frames at 12 fps over 1.6 units.
  - **The video stays INSIDE the white sheet** (user's spec: nothing bleeds past the white
    frame, so the 3D illusion holds). The window `#sm-flip` is the panel's inner width at the
    video's 4:3, and each frame's backdrop is normalised to **pure white** by the tool — the
    ring-median gain left the vignette corners at ~253, which read as a faint window edge, so
    the gain keys off the ring's 10th percentile instead. Deliberately NOT Figma's card box,
    which overhangs the panel — an RGB video can't overhang anything. The card comes out ~10%
    smaller than the Figma node; that is the price of containment.
  - **History (all 2026-07-30, one afternoon):** coded 360° CSS-3D flip with a midpoint face
    swap → coded 180° single turn → this video, each a user revision. The coded-flip
    machinery (perspective/preserve-3d, registered faces, the CSS-grouping-flattens-3D
    landmine) is in git history with `tools/make-flip-cards.py` as its record;
    `flip-regular/bronze.webp` are retired.
  - The cursor **stands aside first** (`CUR.s19_3`, Figma's own parked pose at 1677,905): the
    press that caused this scene was 19.2's, so the sheet pops into a frame the arrow has
    already left.
- **Scene order quirk**: canvas order is …19, **19.1, 19.2, 19.3**, 20, **22, 21**, 23, 24 —
  the 22-before-21 inversion is intentional in the storyboard (small I.D. card appears before the
  expanded one). 19.1–19.3 were inserted 2026-07-30 and shifted every later frame's canvas x by
  2020px per frame. 19.3 was a badge-unlock modal when it landed and is now the **STATUS
  UNLOCKED card flip** (built — see its own bullet below); `assets/Scene 19/Badge Packet
  Animation.mp4` was the old design's asset and is **orphaned**, kept only in case the beat
  returns.
- **The I.D. card is CAUSED by a click** (s20 → s22). Zack's cursor travels to the poster's
  profile picture on the fandom page — `PAGE_TARGETS.s20`, the live `.up-av`, not a
  coordinate — and presses it late in s20; s22's card opens 0.1 units later, as the finger
  lifts. s20 used to fade the cursor OUT and s22 teleported it back in *after* the card had
  already popped, so the card arrived uncaused and the cursor was gone for two scenes (fixed
  2026-07-29, user's report). **Nothing between the s2 reveal and the s24 exit may hide the
  cursor** — those are the only two `#cursor` autoAlpha tweens in the timeline, and a third
  is what caused this.
  - **The poster IS the person on the card.** Both UGC posts on the fandom page read
    **Jordan Rose** with his photo as the avatar, because s22 opens *his* Complex I.D. — they
    used to say "Adam Kwazoski" with a stock headshot, so clicking one stranger produced
    another stranger's card. Built by `tools/make-jordan-av.py` from `assets/General/Jordan
    Rose`; the circle is baked into the avatar's **alpha** (`.up-av img` has no
    `border-radius`), and the crop is judged at the true 32px, not zoomed. If the name or
    face changes again, change **both** `pages/fandom.html` and the All Hands source, or the
    next `make-page-assets.py` run puts the stranger back.
- **The I.D. card's expanded box IS the video's first frame** (s21). `assets/General/Jordan Rose
  ID Video.mp4` takes over frame-by-frame once the card blows up, so the static card and frame 0
  have to coincide or the handover jumps. Measured on frame 0: the card including its vertical
  strip is 639×396 of that 1280×720 frame, and the video is exactly 16:9, so at full stage it is
  **466.5, 291, 958.5×594** — that is `#id-card`'s box now, not the old 460,260 1000×561.
  - **The card is the GOLD variant as of 2026-07-30**, cropped from `assets/Scene 22/COMPLEX I.D -
    Gold - Big.png`'s opaque box (1023×609) and fitted to 2× the stage box. The supplied art
    carries a **baked shadow** (34% soft alpha against the <1.5% that is only antialiasing), and
    `#id-card` already has a CSS `drop-shadow` — so it is cropped to the card's own rectangle or
    the two would double. Fit is ×1.874 / ×1.951, because the source aspect is 1.6798 against the
    box's 1.6136. **Do not "fix" that by moving the box** — the box IS the ending video's frame 0.
  - This closed most of the s23→s24 ghosting. The card used to be the 500-PTS Regular revision
    while the video morphs the gold 5000-PTS one, so four lines ghosted through `END_XFADE`. Ours
    now reads **5000 PTS / Gold / 1%**, all matching the video; only the date still differs
    (05.22.2026 vs the video's 05.19.2023). The strip is gold too, so the old note that "the
    video's gold strip is 60 stage px against our black strip's 39" no longer applies —
    **re-measure before relying on it.** Still inherent: the video's card sits inside a clear slab
    extending well past it (417,157.5 1080×778.5), which the video introduces as new content.
  - Built by `tools/make-id-card.py` from two sources, because neither is sufficient alone — read
    its docstring. The user's `Jordan Rose ID.png` is the **2×** render but has a baked grainy
    background and shadow; the MCP `contentsOnly` render has real alpha but returns **1× only**
    (asking for `maxDimension` 2814 still gives 1408×845). So: pixels from the 2×, alpha from the
    1× upscaled. The card's top edge is flush with y=0 in that PNG because the shadow spreads down
    and sideways but not up — it is **not** clipped, and misreading that cost time.
  - The small state targets Figma's own small-card node `1844:42327` ((749,359) 422×251, centre
    960,484.5) and is scaled to match that node's **WIDTH** (`ID_SMALL_SC = 422/958.5`), so the
    card keeps its s22 presence; the new aspect makes it 422×273 rather than 422×251. Because the
    video's card is not horizontally centred on the stage (expanded centre x is **945.75**), the
    small state needs `ID_SMALL_X` as well as `ID_SMALL_Y` — the s21 expansion carries x back to 0.
- **s23 wraps the card; it does not swap it.** The blown-up I.D. **stays on screen** — the
  *mockup* is what dissolves (phone, badge pile, scrim), leaving the card alone on black exactly
  where the ending video's first frame has it, because that is the card the video morphs (user's
  call, 2026-07-29). s23 used to fade `#id-card` out at +0 and pop a different card in at 55%
  scale, so the card the reader had just opened vanished and an unrelated object replaced it.
  - `gold-card.webp` is now `General/Jordan Rose Id Wrapped.png`. What it replaced was a
    **different revision on a white background** — light case, and a different photo entirely
    (a "Saints" bucket hat, gold chain, different face). On a black stage that read as a white
    slab, and it was not the person whose I.D. the reader had just opened.
  - The case is positioned so its **inner card registers on `#id-card`'s box**: the two are the
    same card at the same pixel scale (inner card 1899×1218 against `id-card.webp`'s 1880×1218),
    so the beat reads as one card gaining a case. `tools/make-gold-card.py` derives the box —
    don't nudge it.
  - It settles from **1.06**, not a dead-still crossfade: the two arts differ inside (500 PTS /
    Regular vs 5000 PTS / Gold, plus the sticker cluster), and a motionless dissolve between two
    near-identical layouts is exactly what the `END_XFADE` note warns reads as a rendering fault.
  - `#id-card` is then **`set` hidden, not faded**, once the opaque inner card covers it — so it
    never fades away, and s24 cannot reveal it underneath. Verified: the card holds
    opacity 1 across the whole mockup fade, and reverse scrub restores it.
- **The ending IS the closing video, scrubbed** (s24, `END_*` in main.js). The finale is
  `assets/General/Jordan Rose ID Video.mp4` played frame by frame as the reader scrolls out —
  the encased card glows, morphs onto a real person's chest at ComplexCon, and the shot pulls
  back over the whole floor. It replaced `assets/lanyard.webp`, the static "worn in the real
  world" still (user's call, 2026-07-29). Four things are load-bearing:
  - **A sprite grid, not a `<video>`** — `assets/ending-frames.webp`, an 8×8 grid built by
    `tools/make-ending-frames.py`, swept by a proxy and positioned with a transform. Exactly the
    s11 popup's machinery and for the same reasons: that file cannot be reliably seeked, and the
    scrub has to be deterministic and reversible. **Read that tool's docstring before reaching
    for a `<video>`,** and before re-extracting — capture must happen during *playback* via
    `requestVideoFrameCallback`, at `playbackRate` 0.25, or Chromium silently drops a third of
    the frames (the first pass got 81 of 120 at uneven spacing and nothing said so).
  - **Full-bleed.** The source is 1280×720 — exactly the stage's 16:9 — so a cell IS the whole
    1920×1080 stage. No letterbox, no aspect fudge, and the cells need no alpha because their
    own near-black background is the stage's.
  - **12 fps, not the source's 24.** Cost is linear in frames and quadratic in the cell, and all
    119 frames measured 5.1 MB even at a soft 768px cell against a ~15 MB deploy. The reader
    scrubs these 5 seconds across ~1,800 px, so the video plays *faster* than real time at any
    ordinary scroll speed and the limiting factor is spatial, not temporal — and both halves are
    forgiving (the morph is a motion-blurred dissolve, the pull-back is slow). Sampling is by
    `mediaTime` against an even grid, **not** by index, because the capture dropped a frame at
    the head and index striding would shift everything after it by half a frame.
  - **The handover from s23 is a plain crossfade, and that is only safe because the two
    REGISTER** — see the long `END_XFADE` note in main.js for the two dead ends before it. The
    chain is built for it: `#id-card`'s box was measured off the video's frame 0
    (`tools/make-id-card.py`), and the case's inner card is fitted onto that same box
    (`tools/make-gold-card.py`). Verified by blending the s24+0 render against frame 0 — case,
    clip, photo, rule, barcode and stickers all coincide, and the only ghosting is on the four
    lines whose text genuinely differs between revisions (500 PTS/Regular vs 5000 PTS/Gold,
    60% vs 1%, 2023 vs 2026). **Don't cover a seam here with a push-in or a dip to black** — that
    was built while the assets were mismatched, it works, and it throws the registration away.
    The motion that keeps the dissolve from reading dead-still comes from the *content*: the
    sweep starts ON the crossfade so the video's own glow is already rising through it. Any
    transform on `#ending` would break the registration.
  - **The finale FADES TO BLACK from the video's 3.5s mark** (user's spec, 2026-07-30):
    `#ending-fade`, a black overlay above `#ending`, ramps 0→1 from `END_FADE_FRAME` (42, =
    3.5s × 12 fps) to the sweep's last frame, so the story closes on black and the page's
    held bottom is black too. Scrubbed off the same frame→time mapping as the sweep — the two
    cannot drift, and it reverses. This is **not** the dip-to-black the warning above forbids:
    that seam is at frame 0, the other end of the sweep, and this fade never reaches it. An
    overlay, not `#ending`'s own alpha — fading `#ending` would expose the s23 layers under it.
- **The badges FALL and pile up** (s22, `BADGE_DROP` in main.js). They used to pop in place
  with `back.out(1.7)`. Now they drop in from above the screen under one gravity and stack up
  on the floor of the phone. Four things are load-bearing:
  - **One `g`, not eight durations.** Every badge starts at the same ceiling — 20px above the
    screen top, where `#screen`'s `overflow: hidden` + `contain: strict` clips it, which is why
    nothing has to fade in — and freefalls to the position it already had in the Figma cluster
    (`STICKERS` is unchanged; only the arrival changed). `power2.in` **is** constant
    acceleration, so the durations are solved from the fall heights (t ∝ √d) and the far
    badges take longer *and* land faster. Give them all one duration and the short falls are
    secretly in slow motion — that is what makes a drop read as weightless.
  - **Nothing rebounds — metal does not bounce** (user's call). The first pass gave each badge
    a mass-scaled hop off the floor and it read as rubber. The impact is now a squash against
    the floor (`transformOrigin` is the **bottom** edge, so it compresses at the contact, not
    around the badge's middle) with a `power2.out` recovery and **no overshoot** — an overshoot
    is a bounce. Mass shows up as the jolt below instead of as airtime.
  - **Each heavy impact SHAKES `#phone`.** Summed from decaying impulses inside ONE proxy tween,
    not a tween per impact: overlapping impacts then *add* instead of fighting over the same
    property (badges 7 and 8 land 0.05 units apart, and two `to`s on `#phone.y` there would
    jitter and could leave the phone parked off-centre), the offset is a pure function of time
    so it scrubs backwards for free, and it is exactly 0 outside the impulse windows so the
    phone cannot drift. Same reasoning as the s13.1 vote proxy. `#phone` is the right element:
    the bezel travels with the screen so no gap opens at the edges, and the badges get jolted
    along with the pile they just landed on. Only the four metal badges pass `SHAKE_FLOOR` —
    the three printed stickers do not move the device at all, which is the whole weight cue.
    Measured: 2.3–3.8px down, then ~1px back, and 0 by the next impact.
  - **Landing order is BOTTOM-UP** — the badges lowest in the pile arrive first and it builds
    upward off the floor: Top Contributor → Post of the Day → Family Style → doge → Cactus
    Jack → COMPLEXCON → Comment of the Month → black star, i.e. `BADGE_DROP` indices
    **5,4,7,3,6,1,2,8**, which is why that table's delay column is not sorted. Order given
    explicitly by the user (2026-07-29) after two passes got it wrong. What matters is the
    **landing** order, not the delay order — the falls differ in length, so verify by watching
    when each badge reaches y 0, not by reading the delays.
  - **The positions and the art are Scene 21's, measured — not copied from the node boxes.**
    The badges are **rotated** 8.3/14.2/0/21.9/12.3/17.6/0/29.7° in the design; the original
    exports had that rotation reset and were placed at rotation 0 with positions eyeballed to
    "content-center align with the old shadowed render", so the pile never matched. The art is
    now the pre-rotated export (`assets/General/Rotated/` → `tools/make-badges.py`) with the
    angle **baked into the bitmap**, which is why the timeline still settles these to
    `rotation: 0` and `BADGE_DROP`'s tumble is an *extra* spin during the fall.
    **`get_metadata`'s `x/y` is not where a rotated node renders** — its `w/h` genuinely is the
    rotated bounding box (solve the rotation out and c²+s² closes to 1.000), but placing the art
    at the reported `x/y` left six of eight badges up to 72px out, and only the two unrotated
    ones landed. Every badge was located by matching its own art against a render of Scene 21
    (node `1844:39703`) over opaque pixels at 1px steps: all eight now sit at dx=dy=0, error
    down from ~80-100 to 6-25, and badge 4's bottom edge falls at 952.1 against the screen's
    952 — the independent check. **Re-measure that way if the design moves; don't trust the
    node coordinates.**
  - **Paint order stays Figma's.** `#stickers img` has no z-index, so paint order is DOM order
    (badge 1 back, badge 8 front) and it is not reshuffled to match the drop order. At the true
    Scene 21 positions that costs almost nothing: of 28 possible pairs exactly **one** touches
    (Post of the Day over the doge, a 70px nick = 1.1% of the doge) and the octagon slides in
    behind it. Worth knowing this was *not* true of the old eyeballed positions — they
    overlapped in 7 places and produced three visible tucks — so if the pile ever drifts off
    Scene 21, expect the conflicts back. `BADGE_OVERLAPS` + `BADGE_TUCK` declare the state and
    a `console.warn` fires if a retuned delay creates a **new** tuck.

## Motion language

Feed scrolls `power2.inOut`; pops (picker, XP modal, hearts)
`back.out(1.3–1.7)`; panels slide `power3.out`; cursor glides `power3.inOut` and
always arrives a beat *before* the effect it triggers. Only `transform`/`opacity`
are animated (plus one small `clip-path` on the fandom nav).

## Tuning knobs

- `PX_PER_UNIT` (main.js, currently 800) — total scroll length / overall pace.
  At 60.29 timeline units that's a 48,232 px page. It moves with every scene span — re-measure
  from the `?debug` HUD rather than trusting this line.
- Per-scene durations — the `label('sN', dur)` second argument in `buildTimeline()`.
  A scene is a fixed span, so any span left over after its last tween is **dead scroll**
  where nothing moves; that reads as having to nudge the wheel. See the dead-scroll table
  in HANDOFF before lengthening a scene.
- `HOVER_PASS` (main.js, currently 1.0) — the whole s5 four-stop hover pass, in
  timeline units. 1 unit = `PX_PER_UNIT` px of scroll, so this is the spec'd
  "≈1.5s for all four". The four stops divide it evenly, and each segment runs a FULL
  step so they butt together — the cursor is never parked mid-pass. Shortening a segment
  below a step reintroduces the dead stops that made this read as choppy.
- The s3/s4 swipe — `CUR.s4.y` sets how far the upstroke travels and the drag distance
  follows from it, so the 1:1 lock holds automatically. Raising it means less drag and
  more fling; lowering it, the reverse. The other half of the feel is the whip's 0.28-unit
  duration and the fling's **`power1.out` over 1.0**. `CUR.s3` → `CUR.s3b` is the backswing.
  **The fling's ease is a seam decision, not a taste one.** Higher powers reach 96% earlier and
  then creep: power3.out at 55% of its duration, power2.out at 66%, power1.out at 80%. That
  creep is what put a stall between scenes 4 and 5 — 392px of scroll with the feed moving under
  0.15px per scroll px. power1.out plus `sine.inOut` on s5's move (the fastest-ramping inOut)
  takes the 4→5 seam to **zero** near-still scroll. Measure it if you retune: sample
  `#page-latest`'s y across the handover, don't judge by eye.
- The s7 swipe home — `CUR.s7a` → `CUR.s7b` is the whip and sets the drag; `FLING_HOME`
  (1.15) is the fling's length in **seconds of real time**, not timeline units, because
  that beat is wall-clock. Lengthen it and the reader can outrun it (the `AUTO.snap` gate
  then cuts it short at the tab); shorten it and the 7,000 px goes by as a hard blur.
- The s22 badge drop — `BADGE_FALL` (0.5) is the **longest** fall in timeline units and every
  other fall scales off it by √d, so this one number sets the whole cascade's gravity; the
  `delay` column in `BADGE_DROP` sets the pour (it is **not** sorted — see the bottom-up order
  above, and re-check the resulting *landing* order after any change). `mass` drives
  both the squash depth and the jolt, so it is the knob for how heavy a given badge feels.
  `SHAKE_AMP` (8 px per unit of mass over 0.5) is the jolt's size — the user asked for *tiny*,
  and the current peak is 3.8px; `SHAKE_FLOOR` (0.55) is the mass below which a badge does not
  move the phone at all, and dropping it below 0.35 would make even the paper stickers shake the
  device. `SHAKE_BEATS` (2) is a thud; raise it and metal starts to ring.
- The s19.3 flip — the sweep's `duration` (1.6 units at s+1.1, in the scene block) is the only
  pacing knob: 60 frames at ~21px of scroll each, `ease: none` because the video's own curve is
  baked into the frames. Frame count and sharpness are a budget, not knobs — `OUT_FPS` /
  `RETINA` in `tools/make-flip-frames.py`, re-run after reading its docstring.
- The s24 ending — `END_SWEEP` (2.25) is how many timeline units the 5 seconds of video take,
  i.e. ~30px of scroll per frame at 60 frames; it is the only pacing knob the finale has, since
  nothing else in the scene may move (a transform on `#ending` breaks the registration the
  crossfade depends on). `END_XFADE` (0.3) is the handover dissolve — keep it short, because
  the four lines whose text differs between the card revisions ghost for its duration.
  `END_FADE_FRAME` (42 = the video's 3.5s × 12 fps) is where the closing fade to black begins;
  it always completes on the sweep's last frame, so moving it changes the fade's length, not
  its end. Frame
  count and sharpness are **not** knobs here, they're a budget: change `OUT_FPS` / `CELL_W` in
  `tools/make-ending-frames.py` and re-run, after reading why 12 fps and 1024px were chosen.
- Lenis `lerp` (0.09) — lower = floatier, higher = tighter.
- Palette — the `:root` tokens at the top of `styles.css`.

## Rules

- Animate transforms/opacity only; no layout/filter properties in the timeline.
  (Static CSS `drop-shadow` filters are fine — assets are exported shadow-free and the
  shadows live in one marked block at the bottom of `styles.css`.)
- Keep all placement in stage px; if a Figma node moves, update the constant, don't eyeball.
- Asset changes: re-export shadow-free per `tools/export-assets.md` (2×, WebP), same
  filename, and **bump the `?v=` cache-buster** on that asset's URL (index.html /
  buildDom) — browsers cache same-name images across sessions. Several assets are NOT
  plain node exports (`picker.webp`, `react-wall.webp`, `xp-frames.webp`,
  `ending-frames.webp`, `flip-frames.webp`, `id-card.webp`, `gold-card.webp`, the five
  `toast-*.webp`, the eight `sticker-*.webp`); rebuild those with their `tools/make-*.py`
  script, and read the docstring first — `tools/export-assets.md` has the table and the reason for each.
- Never give a `fromTo` visible `from` values — pre-start renders show them on
  backward scrubs. Enter from hidden states only.
- Verify with `tools/scrub.py` — capture each label's resting frame and compare against
  the storyboard screenshots before calling a change done. Reverse-scrub too: the worst
  case (end → s2) has caught real bugs.
  **Two blocks are not deterministic per scroll position**, because they run on wall-clock:
  the s6 reaction wall (judge by eye; diffs never match byte-for-byte) and the s7 fling
  home (`scrub.py` will catch it mid-flight — either wait `FLING_HOME` after seeking, or
  seek past `AUTO.snap`, where the gate force-completes it).
  Also note `wait_for_function` must return a **boolean**: `() => !!(window.__tl &&
  window.__scrollLen)`. Returning `window.__tl` itself hangs for the full timeout — GSAP
  timelines don't survive Playwright's serialisation. That has cost debugging time twice.
- **Don't push, deploy, or publish unless asked for it in that message.** `main` is
  public and wired to Vercel, so a push is a publication, not a save. Work locally;
  commit locally if it keeps the tree clean, then stop and say it's unpushed. Approval
  to push once does not carry to the next task.
- Stage explicit paths, never `git add -A` — assets get dropped into `assets/` while
  you work, and `-A` will commit them for you.
