# Fandom × My Complex — Scroll-Driven Storyboard Animation

A standalone scrollytelling page that plays the 28-frame Figma storyboard
("Fandom x My Complex", file key `0Wn6kFfKuKalOCTev3uUjA`, canvas `1838:87183`)
as one continuous scroll-scrubbed animation: Zack's cursor browses the Complex
mobile site inside a phone mockup — following, reacting, commenting, earning XP,
joining the Playboi Carti fandom — ending on the Complex I.D. gold card and a
real-world lanyard photo.

**The stage is black.** Only stage-level furniture is dark-themed (background,
phone frame, callouts, s13/s14 slab, reaction tray); everything inside the phone
screen stays the light product UI it is in the exports. The palette lives in the
`:root` token block at the top of `styles.css` — change it there, not per rule.
Figma's Scene 06 (`1898:70036`) is the reference frame for the dark treatment.

## Run

```bash
python3 -m http.server 8321   # from this directory
open http://localhost:8321
```

A server is REQUIRED — `file://` fails silently (the page fetches
`assets/manifest.json`). Append `?debug` for a HUD (progress %, scene label,
scroll px).

## Files

| Path | What |
|---|---|
| `index.html` | Static DOM: stage → phone/screen → strips, overlays, satellites, cursor |
| `styles.css` | All positioning in 1920×1080 stage px, 1:1 with Figma coordinates |
| `main.js` | Scene offsets (`POS`), cursor beats (`CUR`), master GSAP timeline, Lenis wiring, loader |
| `vendor/` | gsap 3.12.5, ScrollTrigger, lenis 1.1.14 (vendored, no CDN) |
| `assets/` | WebP assets + `manifest.json` (asset → Figma node ID / source map). Two origins: shadow-free Figma exports (masters in `assets/Scene N/`) and live captures of reference apps (s15 quiz frames) |
| `Reference Projects/` | Full reference apps the user drops in (e.g. `4. Complex Quiz`, a Next.js prototype) — run them and capture real UI states when a scene needs product-true frames |
| `tools/export-assets.md` | How to re-export assets when the design changes + export gotchas |
| `tools/make-picker-dark.py` | Regenerates the s6 reaction tray (a composite — read the docstring before re-exporting it) |
| `tools/make-react-wall.py` | Rebuilds the s6 animated reaction wall from the Scene 6 GIF |
| `tools/scrub.py` | Playwright scrub harness: jump to any label ± offset and screenshot |
| `HANDOFF.md` | Current state, verification results, known quirks, next steps |

## Architecture (read this before touching main.js)

- **Stage**: fixed 1920×1080 `#stage`, scaled to fit the window (`fitStage`).
  Every coordinate in CSS/JS is a storyboard pixel from Figma — never viewport-relative.
- **Scroll engine**: body height = `SCROLL_LEN + innerHeight` (spacer `#scroll-track`);
  one ScrollTrigger scrubs ONE master timeline. Lenis (lerp 0.09) smooths input and
  drives `ScrollTrigger.update`; GSAP ticker drives `lenis.raf`. Don't add per-scene
  ScrollTriggers — everything hangs off the single timeline via labels `s1…s24`.
- **Phone feed**: 4 tall strips (`strip-latest/myc/rail/fandom`), each a stack of
  4096px-tall image tiles, moved with `translateY`. Per-scene resting offsets live in
  `POS` (values derived from the Figma scene metadata — see HANDOFF for the mapping).
  Nav bars are separate sticky images layered over the strips (z-index: navs 8,
  scrim 10, xp-modal/stickers 11, toasts 12). The s19 satellites are the one
  BELOW-phone layer (`#sats img { z-index: -1 }`) so they fly out from behind
  the mockup.
- **Reaction wall** (s6): one animated WebP (`react-wall.webp`, a 4×5 grid of 20
  looping reactions) shown through 20 clipping cells built in `buildDom` — each cell
  holds its own `<img>` of the same file, so there's one decode, all 20 stay
  frame-synced, and each can be staggered independently. This is the only element on
  the page whose motion is wall-clock rather than scroll-driven; its background is
  the same black as the stage, which is why the cells need no alpha.
- **Callouts** (s5): coded, not exported. Each of the four holds two absolutely
  stacked faces — `.idle` (Scene 05) and `.act` (the hover/pressed state from
  Scenes 5.1–5.4) — crossfaded on opacity only. Icons are inline SVG using
  `currentColor` so the dark palette flows through. Figma's auto-layout shifts the
  whole column when a hovered row grows; we pin row positions and share an icon
  centre between the two faces instead, so nothing reflows mid-scrub.
- **Cursor**: coded SVG arrow + HTML "Zack" tag (`#cursor`). `CUR` table holds per-scene
  arrow positions; `flip: true` turns the arrow in 2D (rotation 0↔90°, tip lands where a
  mirror would) and glides the tag to the left at a symmetric distance; `click: true` is a
  quick 10% press (scales `#cursor-inner`, never the arrow's transform — that would clobber
  the turn; no ring/pulse, removed by request). Change the name by editing the tag text
  in `index.html`.
- **Scene order quirk**: canvas order is …19, 20, **22, 21**, 23, 24 — intentional in
  the storyboard (small I.D. card appears before the expanded one).

## Motion language

Feed scrolls `power2.inOut`; pops (picker, XP modal, stickers, hearts)
`back.out(1.3–1.7)`; panels slide `power3.out`; cursor glides `power3.inOut` and
always arrives a beat *before* the effect it triggers. Only `transform`/`opacity`
are animated (plus one small `clip-path` on the fandom nav).

## Tuning knobs

- `PX_PER_UNIT` (main.js, currently 800) — total scroll length / overall pace.
- Per-scene durations — the `label('sN', dur)` second argument in `buildTimeline()`.
- `HOVER_PASS` (main.js, currently 1.0) — the whole s5 four-stop hover pass, in
  timeline units. 1 unit = `PX_PER_UNIT` px of scroll, so this is the spec'd
  "≈1.5s for all four". The four stops divide it evenly.
- Lenis `lerp` (0.09) — lower = floatier, higher = tighter.
- Palette — the `:root` tokens at the top of `styles.css`.

## Rules

- Animate transforms/opacity only; no layout/filter properties in the timeline.
  (Static CSS `drop-shadow` filters are fine — assets are exported shadow-free and the
  shadows live in one marked block at the bottom of `styles.css`.)
- Keep all placement in stage px; if a Figma node moves, update the constant, don't eyeball.
- Asset changes: re-export shadow-free per `tools/export-assets.md` (2×, WebP), same
  filename, and **bump the `?v=` cache-buster** on that asset's URL (index.html /
  buildDom) — browsers cache same-name images across sessions.
- Never give a `fromTo` visible `from` values — pre-start renders show them on
  backward scrubs. Enter from hidden states only.
- Verify with the Playwright scrub harness (see HANDOFF) — capture each label's resting
  frame and compare against the storyboard screenshots before calling a change done.
