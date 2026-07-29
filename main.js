/* ═══════════════════════════════════════════════════════════════
   Fandom × My Complex — scroll-driven storyboard
   One master GSAP timeline scrubbed by scroll (Lenis smoothing).
   All coordinates are 1920×1080 stage px, 1:1 with the Figma file.
   ═══════════════════════════════════════════════════════════════ */

gsap.registerPlugin(ScrollTrigger);

const PX_PER_UNIT = 800;            // scroll px per timeline unit — master pacing knob
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Budget for the whole s5 hover pass (REACT → COMMENT → BOOKMARK → FOLLOW).
   Spec: all four stops inside ~1.5s. 1 unit = PX_PER_UNIT scroll px, so this is
   exactly 800 px of scroll — ≈1.35s at a 60s read of the full timeline, and under
   1.5s for any scroll rate above ~535 px/s. The four stops divide it evenly;
   lower it to make the pass snappier still. */
const HOVER_PASS = 1.0;

/* How far a callout's icon tilts on hover. Negative = the direction Figma tilts the
   REACT glyph (-7°) in Scene 5.1. This plus the `.chip` IS the whole hover — no art
   swap, so nothing has to crossfade. */
const ICON_TILT = -8;

/* ── The automatic fling home (s7) ──
   The second and last beat on the page that runs on WALL-CLOCK time instead of scroll
   (the s6 reaction wall is the other). Everything else is scrubbed, which is right for a
   gesture the reader is performing — but wrong for the ~7,000 px of inertia that follows
   it. Scrubbed, the feed only travels while the wheel turns, so getting back to the top
   means cranking the whole feed up by hand; the flick reads as something the reader has
   to finish rather than something the page does. So the whip itself stays scrubbed (the
   drag is theirs, 1:1) and the RELEASE hands off to `AUTO.tl`, which plays itself out.
   `buildTimeline` fills these in; the gate that fires, rewinds and force-completes it
   lives in boot(). Times are master-timeline units.
     release — the frame the finger lifts: `AUTO.tl` takes ownership of #page-latest y
     snap    — cursor reaches the MY COMPLEX tab. Scrubbed this far and the fling is not
               done? Force it complete: the reader is ahead of the inertia, and a feed
               still flying while the tab is being clicked is worse than no inertia.
     from    — where the drag left the strip, so a reverse scrub can hand y back cleanly */
const AUTO = { tl: null, from: 0, release: Infinity, snap: Infinity, playing: false };
const FLING_HOME = 1.15;    /* seconds of real time for the fling — see AUTO */

/* The screen's top-left in stage px (#phone left/top in styles.css; the screen is inset 0).
   Anything positioned in strip-local px converts through here. */
const SCREEN_X = 740, SCREEN_Y = 64;
/* the two side slabs' top-left in stage px (#gray-panel / #panel-rerank in styles.css).
   Both are 390x887 — the pages' own authored width — so they mount 1:1. */
const PANEL_X = 277, PANEL_Y = 97;
const RERANK_X = 1253, RERANK_Y = 97;

/* Per-scene resting offsets — the translateY of the strip (or, for `latest`, of the live
   page wrapper) inside the screen. */
const POS = {
  /* `latest` is the LIVE page (pages/home-editorial.html) as of 2026-07-29, not the strip.
     The strip was `.main` alone with the nav as a separate 159px image on top; the live
     page is `.s01` (the nav, measured 159 tall — the same number) followed by `.main`. So
     every old offset shifts by exactly one nav height: **new = old − 159**.
       s1  159 → 0       s4  −4346 → −4505      s5  −7476 → −7635
     Verified by rendering, not just arithmetic: at −7635 the story card whose action row
     the s5 callouts annotate is the one in view, and its heart lands within 1.2px of where
     the storyboard put the s6 click. Re-derive the same way if the page changes — the old
     −4346 was itself a recovery from a wrong number, see HANDOFF. */
  latest: { s1: 0, s4: -4505, s5: -7635 },
  /* `myc` is the LIVE pages/home-feed.html.
     s7/s8 follow the same −159 nav shift as `latest`, and that is confirmed: the chips land
     at page y 933, i.e. the strip's 774 + one 159px nav. **Below that the shift does NOT
     hold** — the live `.main2` is 9801 tall against the strip's 8324, so ~1477px of content
     was added and anything past the insertion lands somewhere else entirely (−159 put s13 on
     the quiz card and s15 past it). So the deeper offsets are derived the other way round:
     take the storyboard's cursor tip for that beat and solve for the offset that puts the
     TARGET under it, which keeps the storyboard's framing of the cursor.
       s12  poll option 1  under tip y 518  → −3526
       s13  WNBA headline  under tip y 392  → −4048   (the scene the user re-specified)
       s14  same frame as s13 for now; the rerank panel is step 5
       s15  START QUIZ     under tip y 811  → −7751
     s9 keeps −1220 (old −1061 − 159): checked by eye, the cursor lands on a card's action
     row, which is the beat. Re-derive any of these with the same solve if the page changes. */
  myc:    { s7: 0, s8: -326, s9: -1220, s12: -3526, s13: -4048, s14: -4048, s15: -7751,
            s16: -5361 },
  /* No `rail` any more. The "fandoms rail" was its own strip export; in the live build it is
     just a CARD INSIDE home-feed (page y 4800, 574 tall), so s16 is a scroll to it rather
     than a strip crossfade — simpler, and what actually happens in the product.
     s16 solves for the Playboi Carti entry (page cy 5273) sitting under CUR.s16's tip. */
  fandom: {
    /* the LIVE pages/fandom.html. Its nav (`.s01`) is 92 tall, not 159 — this page has no
       tab row — so the old s17: 95 was one nav height, same pattern as the other two pages,
       and the page's own top is 0. Below that the content differs again (live `.main3` is
       6786 against the strip's 8301, ×0.817), so s18 frames the fandom tabs near the top of
       the screen and s19/s20 carry the old deltas scaled by that ratio. */
    s17: 0, s18: -649, s19: -1617, s20: -3118,
  },
};

/* ── s8 topic picks ──
   The pills used to be coded DOM over the baked block, because the export had them
   pre-picked. `pages/home-feed.html` ships them as real `.chip` elements — with the SAME
   four pre-picked (Style / Bets / Watch / ComplexCon), so the state still has to be undone —
   so the coded block, its Inter @font-face and the PILLS table are all gone. `preparePages`
   strips `.sel` off every chip and stacks a picked twin over the three Zack chooses, which
   the timeline then fades in on each press. Matching by LABEL, not index: the page is free
   to reorder them. */
const PICKS = ['Sneakers', 'Sports', 'ComplexCon'];

/* what Zack types in the s10 comment box. Kept here rather than in the markup because the
   timeline reveals it a character at a time. */
const COMMENT_TEXT = 'This is freaking awesome!! \u{1F525}\u{1F525}';

/* ── s11: the XP popup, played frame by frame ──
   `assets/xp-frames.webp` is an 8-column grid of every frame of the Scene 11 video, built by
   tools/make-xp-frames.py (the video itself cannot be seeked — read that docstring before
   reaching for a <video>). The scene sweeps a proxy across the frames and positions the sheet
   with a transform, so it is deterministic, reverses, and touches nothing but `transform`.
   XP_CELL_H is the cell height in DISPLAY px: the sheet is scaled to 8 x 358 wide, so a cell
   is 358 x 358*(1504/1120). */
const XP_FRAMES = 63, XP_COLS = 8;
const XP_CELL_W = 358, XP_CELL_H = 358 * 1504 / 1120;

/* ── s24: the ending, played frame by frame ──
   `assets/ending-frames.webp` is the closing Jordan Rose I.D. video as a sprite grid, built by
   tools/make-ending-frames.py — same reasoning as the s11 popup above (a <video> cannot be
   seeked deterministically) and the same machinery, just full-bleed: the source is 16:9, so a
   cell IS the whole 1920x1080 stage. This is what replaced `assets/lanyard.webp`, the static
   "worn in the real world" still. Resampled to 12 fps — see the tool for why the source's 24
   buys nothing here and costs a third of the deploy.
   END_SWEEP is the scene's real knob: the timeline units the 5 seconds of video take, i.e.
   60 frames at ~30px of scroll each. */
const END_FRAMES = 60, END_COLS = 8;
const END_CELL_W = 1920, END_CELL_H = 1080;
const END_SWEEP = 2.25;

/* ── How s24 hands the card over to the video, and the two dead ends before it ──
   The video opens on the same subject the reader is already looking at: the encased card, still,
   on black. Whether that is an asset or a liability depends entirely on whether the two REGISTER,
   and the answer changed twice while this was built. Keep the history — the wrong answer is very
   easy to re-derive from the wrong asset:
     1. Against the ORIGINAL `gold-card.webp` (white-cased, a different photo, a different
        revision) they did not register at all, and no transform made them. Registration was
        pushed to the end of the line: edge-gradient correlation over scale and offset, then an
        anisotropic (scaleX, scaleY, dx, dy) FFT search. Best fit 0.91/0.83/−29/−2, and it still
        left the XP block ~20px out and put the sticker cluster somewhere else entirely.
     2. So the handover became a push-in through black: the card grew past the frame, faded to
        black, and the video came up after it. That works — a fade-through-black on a black stage
        is a cut, not a gap — and it was right for as long as the two shots disagreed. **It is no
        longer what the code does.**
     3. `gold-card.webp` was then rebuilt from `General/Jordan Rose Id Wrapped.png` and fitted so
        its INNER CARD lands on `#id-card`'s box, which is itself the video's frame-0 card
        (tools/make-gold-card.py, tools/make-id-card.py). That closes the gap: blending the s24+0
        render against frame 0 shows the case, the clip, the photo, the rule, the barcode and the
        stickers all coincident. The raw aspect figures still disagree (inner card 1.5591 against
        the video frame's 1.6111) and they are a red herring — make-gold-card.py fits the case
        anisotropically on purpose, absorbing that difference in the case, which has no alignment
        obligation to anything. Trust the render over the ratio.
   So the handover is now a plain crossfade at frame 0, and the ONLY residue is a little ghosting
   on the four lines whose text genuinely differs between revisions (500 PTS/Regular vs 5000
   PTS/Gold, 60% vs 1%, 2023 vs 2026). Keep it short for that reason.
   **The standing warning:** a NEAR match is the worst outcome available — two copies of the same
   type ~25px apart read as a rendering fault, and the closer the fit the harder the eye tries to
   fuse them. If s23's card and frame 0 ever drift, re-register them; do not go back to hiding the
   seam behind a push-in, and do not "split the difference" with a partial match. */
const END_XFADE = 0.3;

/* Cursor beats: arrow top-left in stage px (+flip = tag sits left of arrow).
   `rot` tilts the arrow to an arbitrary angle and holds it (the swipe pose). */
const CUR = {
  s2:  { x: 1386, y: 576 },
  /* The swipe. Storyboard scenes 3 AND 4 both hold one pose — tilted 30° with the tip
     exactly on the screen's right edge, (1161,616) putting it at (1180, 609). Derived
     from the Figma tag position and cross-checked against the rendered arrow outline
     (1218 measured vs 1219 predicted at 30°). That held pose is the *cocked* moment:
     the bottom of the windup, just before the flick. */
  s3:  { x: 1200, y: 530 },                       /* comes in off the bezel, untilted */
  s3b: { x: 1161, y: 616, rot: 30, click: true }, /* dips DOWN, turning — the windup */
  s4:  { x: 1120, y: 150, rot: 30 },              /* top of the up-whip = release */
  s4b: { x: 1262, y: 595 },                       /* withdraws right, upright (storyboard s5) */
  /* FALLBACK ONLY — resolvePageTargets() overwrites this from the live page's heart icon
     at boot. Kept so a failed lookup degrades to the storyboard's number instead of
     crashing; the resolved value lands ~15px left of it, on the glyph's true centre. */
  s6:  { x: 730,  y: 525, flip: true },
  s6b: { x: 576,  y: 469 },               /* drifts onto the tray (Scene 06 frame) */
  /* The swipe home (s7) — the s3/s4 gesture upside down, same 30° cocked pose and the
     same 466px amplitude, but the windup rises and the whip goes DOWN, which is how you
     scroll a feed back up. Cocked tip sits on the screen's right edge (x=1180) like s3b's
     does; the whip drifts left as it falls, the way s4's drifted left as it rose. */
  s7a: { x: 1161, y: 207, rot: 30 },      /* rises off the tray, turning — the windup */
  s7b: { x: 1120, y: 673, rot: 30 },      /* bottom of the down-whip = release */
  /* FALLBACK ONLY — resolvePageTargets() overwrites this from the live page's tab element.
     The number is the Figma node 1838:87226 centre (1066.6, 190.8) less TIP_OFF, and the
     live page resolves to the same point, which is a good independent check. */
  s7:  { x: 1064.2, y: 188.4 },
  /* no s8 entry: that scene's four beats (three chips + CONTINUE) are resolved from the
     live page's own elements in its own block, so they follow the page */
  /* FALLBACK ONLY — resolvePageTargets() overwrites this from the live page's comment icon.
     The old number sat 39px right of the icon, in the gap before the bookmark. */
  s9:  { x: 829,  y: 904, flip: true, click: true },
  /* FALLBACK ONLY — resolveTrayTarget() overwrites this from the coded post button's own box.
     The number came off the retired drawer export, whose button read "LOUD" and sat at
     1417..1517 x 924..962. The coded button is laid out by flex and sized to its label, so a
     label change ("LOUD" → "POST") moves its left edge; resolving it means that cannot drift
     the click off the button. */
  s10: { x: 1464.6, y: 940.6, click: true },
  s12: { x: 776,  y: 516, flip: true, click: true },
  s13: { x: 348,  y: 390, flip: true },
  s14: { x: 1601, y: 611 },
  s15: { x: 787,  y: 809, flip: true, click: true },
  s16: { x: 1012, y: 650 },
  s17: { x: 1160, y: 762, click: true },
  s18: { x: 1188, y: 707, click: true },
  s19: { x: 1160, y: 886 },
  /* FALLBACK ONLY — resolvePageTargets() overwrites this from the live page's own avatar.
     The DP Zack clicks to open the Complex I.D.: `.up-av` on the UGC post the page rests
     on at s20, measured tip (776.1, 200.2). Flipped for the same reason s12 is — at this
     x the tag would otherwise sit straight over the name it belongs to. */
  s20: { x: 721.1, y: 198.2, flip: true, click: true },
  s22: { x: 752,  y: 572, flip: true },
  s21: { x: 1400, y: 783 },
  s23: { x: 1474, y: 846 },
};

/* s5 hover stops — arrow top-left per Figma Scenes 5.1 / 5.2 / 5.3 / 5.3(follow).
   No turn in this pass: the tag stays on the right the whole way down. */
const HOV = [
  { x: 514, y: 342, sel: '#callout-react' },
  { x: 556, y: 499, sel: '#callout-comment' },
  { x: 602, y: 646, sel: '#callout-bookmark' },
  { x: 610, y: 779, sel: '#callout-follow', hold: true },  /* pressed — FOLLOWING stays on */
];

/* The s22 badge pile — [left, top, w, h] in IN-SCREEN stage px, straight off Scene 21.
   They superseded a set that had been eyeballed to "content-center align with the old
   shadowed render", which is why the pile never quite matched the storyboard.
   **MEASURED off a 1920x1080 render of Scene 21 (node 1844:39703), not copied from the node
   boxes.** `get_metadata` reports x/y/w/h for these nodes, and w/h IS the rotated bounding
   box (solving the rotation out of it closes to c2+s2 = 1.000 within rounding) — but its x/y
   is NOT where a rotated node renders. Placing the art at the reported x/y put six of the
   eight badges up to 72px out; only the two unrotated ones (3 and 7) landed. So each badge
   was located by matching its own art against the Scene 21 render over opaque pixels only,
   at 1px steps: every one now sits at dx=dy=0 with the error dropping from ~80-100 to 6-25,
   and badge 4's bottom edge falls at 952.1 against the screen's 952, which is the independent
   check that the whole set is right. Re-measure the same way if the design moves; do not
   trust the node coordinates.
   The art is the ROTATED export: each badge is turned 8.3-29.7 deg in the design (3 and 7
   alone are at 0), and that angle is baked into the bitmap — which is why the timeline
   settles these to rotation 0 and BADGE_DROP's tumble is an EXTRA spin during the fall.
   Rebuild with tools/make-badges.py; read its docstring before re-exporting. */
const STICKERS = [
  [-0.17, 672.49, 254.0, 138.5], [36.89, 563.42, 153.5, 154.0], [242.0, 775.28, 99.0, 94.0], [114.54, 789.56, 164.5, 162.5],
  [20.73, 760.93, 125.5, 184.0], [284.88, 648.16, 155.5, 225.0], [261.0, 860.28, 115.0, 81.0], [148.04, 567.81, 205.0, 210.5],
];
/* ── s22 badge gravity ──
   The badges FALL into the pile rather than popping in place. Three things are doing
   the work, and each replaces a shortcut that reads as weightless:

   * ONE gravity, not eight durations. Every badge starts at the same ceiling —
     BADGE_CEIL px above the screen's top edge, where `#screen`'s overflow:hidden clips
     it, so nothing has to fade in — and freefalls to the position it already holds in
     the Figma cluster. `power2.in` IS constant acceleration (distance ∝ t²), so the
     durations are solved from the fall heights (t ∝ √d) and every badge shares the same
     g: the far ones take longer, and arrive faster. Give them all one duration instead
     and the short falls are secretly in slow motion, which is what makes a drop float.
   * MASS, judged from what the badge IS, not from its area — the Cactus Jack rope
     letterform is one of the biggest boxes here and one of the lightest objects.
     **Nothing rebounds: metal does not bounce** (user's call, 2026-07-29). An earlier
     pass gave every badge a little hop off the floor, mass-scaled, and it read as
     rubber. So the impact is a squash against the floor — `transformOrigin` is the
     bottom edge for exactly this, it has to compress at the contact and not around the
     badge's middle — and the mass is expressed by how hard the badge SHAKES THE PHONE
     instead of by how high it comes back up. See SHAKE below: the four metal badges
     jolt the device, the three printed stickers do not move it at all, which is a much
     truer weight cue than airtime was.
   * Landing order is BOTTOM-UP — the badges lowest in the pile arrive first and the pile
     builds upward from the floor (user's call, 2026-07-29, given as an explicit list).
     The order is Top Contributor → Post of the Day → Family Style → doge → Cactus Jack →
     COMPLEXCON → Comment of the Month → black star, i.e. array indices **5,4,7,3,6,1,2,8**,
     which is why the delay column below is not sorted. Note the ordering that matters is
     the LANDING order, not the delay order — the falls differ in length, so the audit
     below checks land times.

   [mass 0..1, tumble° during flight, delay in timeline units] */
const BADGE_DROP = [
  [0.90,  -6, 0.60],   /* 1 COMPLEXCON — chunky enamel bar        (lands 6th) */
  [0.85,   8, 0.68],   /* 2 Comment of the Month — metal disc     (lands 7th) */
  [0.35, -12, 0.34],   /* 3 doge — printed sticker                (lands 4th) */
  [0.80,   7, 0.12],   /* 4 Post of the Day — metal octagon       (lands 2nd) */
  [1.00,  -5, 0.00],   /* 5 Top Contributor — solid bar, heaviest (lands 1st) */
  [0.30,  10, 0.47],   /* 6 Cactus Jack — rope letters, near zero (lands 5th) */
  [0.25, -13, 0.26],   /* 7 Family Style — printed sticker        (lands 3rd) */
  [0.90,   6, 0.80],   /* 8 black star token — thick disc         (lands 8th) */
];

/* ── landing order vs PAINT order ──
   `#stickers img` carries no z-index, so paint order is DOM order and buildDom appends in
   BADGE_DROP's order: badge 1 is the back of the pile, badge 8 the front. That is Figma's
   composition and it is NOT changed to match the drop order, so where a badge that lands
   late paints *behind* one already resting, it tucks in underneath instead of landing on
   top. Measured against the art's real ALPHA (not its bounding box — every badge is rotated
   inside its box), the true Scene 21 layout barely overlaps at all: of the 28 possible pairs
   exactly ONE touches, Post of the Day over the doge, and it is a 70px nick — 1.1% of the
   doge — that the octagon slides in behind. So the bottom-up pour and Figma's composition
   very nearly agree, and there is nothing here worth spending a `z-index` on. Worth knowing
   that this was NOT true of the earlier eyeballed positions, which overlapped in 7 places and
   produced three visible tucks: if the pile ever drifts off Scene 21, expect the conflicts
   back. Both tables stay declared so a retuned delay or a reordered array reports a NEW
   conflict instead of silently burying a badge. */
const BADGE_OVERLAPS = [[3, 4]];                           /* [back, front] by badge number */
const BADGE_TUCK = new Set(['3<4']);                       /* 'back<front' — back lands later */
const BADGE_CEIL = 20;      /* px above the screen top the ceiling sits — just out of the clip */
const BADGE_FALL = 0.5;     /* timeline units for the LONGEST fall; the rest scale by √d */
const BADGE_SQUASH = 0.05;  /* the impact itself: fast, and the same for every mass */
const BADGE_SETTLE = 0.07;  /* and out of the squash — power2.out, NO overshoot: an overshoot is a bounce */

/* ── the screen jolt (what replaced the bounce) ──
   Every impact heavy enough to matter kicks #phone down and lets it settle. It is summed
   from decaying impulses inside ONE proxy tween rather than built as a tween per impact,
   and that is load-bearing three ways: overlapping impacts ADD instead of fighting over
   the same property (b7 and b8 land 0.05 units apart, and two `to`s on #phone.y there
   would jitter and could leave the phone parked off-centre); the offset is a pure
   function of time, so it scrubs backwards for free; and it is exactly 0 outside the
   impulse windows, so the phone cannot drift. Same reasoning as the s13.1 vote proxy.
   `#phone` is the right thing to move: the bezel travels with the screen so no gap opens
   at the edges, and the badges — being inside it — get jolted along with the pile they
   just landed on, which is what a real frame-of-reference shake does. Nothing else owns
   #phone's transform between the boot intro and the s23 fade. */
const SHAKE_AMP = 8;        /* px per unit of (mass − 0.5); below that mass, no jolt at all */
const SHAKE_FLOOR = 0.55;   /* a printed sticker does not move a phone. Metal does */
const SHAKE_DUR = 0.13;     /* timeline units for one impulse to die out */
const SHAKE_BEATS = 2;      /* half-cycles: down, back, done. A thud, not a ring */
/* s6 reaction wall — one animated 800×800 image (`react-wall.webp`, a 4×5 grid of
   20 looping reactions) shown through 20 clipping cells so each can be staggered in
   on its own. Cells tile the image exactly, so at rest the composite is pixel-
   identical to the whole frame — an emoji that overflows its cell (the
   jack-in-the-box, the NO sign) simply lands in the neighbour cell it belongs to.
   Source cells are 200×160; on stage the wall is 596×596, so 149 × 119.2. */
const WALL_COLS = 4, WALL_ROWS = 5;
const WALL_W = 596, WALL_CELL_W = WALL_W / WALL_COLS, WALL_CELL_H = WALL_W / WALL_ROWS;

/* Small-card resting state of #id-card (see scenes 22/21).
   The element box is now the VIDEO's frame-0 card (466.5,291 958.5x594 — see styles.css), so
   its centre is (945.75, 588): the video's card is not horizontally centred on the stage, which
   is why the small state needs an X offset as well as a Y one. The small state targets Figma's
   own small-card node 1844:42327, (749,359) 422x251, centre (960, 484.5), and is scaled to match
   that node's WIDTH — the user's call, so the card keeps its on-screen presence in s22; the new
   card's aspect makes it 422x273 rather than the node's 422x251. */
const ID_SMALL_SC = 422 / 958.5;   /* = 0.440271 */
const ID_SMALL_X = 14.25;
const ID_SMALL_Y = -103.5;

const $ = (s) => document.querySelector(s);

/* ── Stage scaler ── */
function fitStage() {
  const s = Math.min(innerWidth / 1920, innerHeight / 1080);
  gsap.set('#stage', { scale: s });
}
addEventListener('resize', fitStage);
fitStage();

/* ── Build dynamic DOM (strip tiles, emoji, stickers) from manifest ── */
async function buildDom() {
  const manifest = await (await fetch('assets/manifest.json')).json();
  const A = manifest.assets;
  /* Strips are being retired one at a time as each live page is mounted in its place
     (see the in-flight table in HANDOFF), so a missing holder is expected, not a bug. */
  for (const key of ['strip-latest', 'strip-myc', 'strip-rail', 'strip-fandom']) {   /* all retired now; loop kept so a re-added strip still builds */
    const holder = $('#' + key);
    if (!holder) continue;
    for (const t of A[key].tiles) {
      const img = new Image();
      img.src = 'assets/' + t.file;
      img.style.top = t.cssY + 'px';
      img.style.height = t.cssH + 'px';
      holder.appendChild(img);
    }
  }
  const grid = $('#emoji-grid');
  for (let r = 0; r < WALL_ROWS; r++) {
    for (let c = 0; c < WALL_COLS; c++) {
      const cell = document.createElement('div');
      cell.className = 'wall-cell';
      cell.style.left = c * WALL_CELL_W + 'px';
      cell.style.top = r * WALL_CELL_H + 'px';
      /* every cell shows the same resource, so one decode and all 20 stay in sync */
      const img = new Image();
      img.src = 'assets/react-wall.webp?v=1';
      img.style.left = -c * WALL_CELL_W + 'px';
      img.style.top = -r * WALL_CELL_H + 'px';
      cell.appendChild(img);
      grid.appendChild(cell);
    }
  }
  const st = $('#stickers');
  STICKERS.forEach(([x, y, w, h], i) => {
    const img = new Image();
    img.src = `assets/sticker-${i + 1}.webp?v=3`;
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    img.style.width = w + 'px';
    img.style.height = h + 'px';
    st.appendChild(img);
  });
}

/* ── Live product pages ──
   Each `.page` iframe holds one real product page (pages/*.html, generated by
   tools/make-page-assets.py). Mounting is: wait for the document, zoom it to the screen's
   width, then size the frame to the whole zoomed document so the page can be moved with
   translateY exactly as the flat strips were.
   PAGE_ZOOM is exact, not a fudge: the pages are authored at 390 and the screen is 440.
   Applied as `zoom` so the document re-lays out at the target size — a transform would
   resample 12.8% up and soften every glyph.
   Returns the measured document heights, which is what the scene offsets are derived
   from; nothing here hard-codes a page's length. */
const PAGE_W = 390, PAGE_ZOOM = 440 / 390;
const PAGE_Z = {};      /* frame id → its actual zoom, filled by mountPages */

function mountPages() {
  const wraps = [...document.querySelectorAll('.page')];
  return Promise.all(wraps.map((wrap) => new Promise((res) => {
    const f = wrap.querySelector('iframe');
    const ready = () => {
      const d = f.contentDocument;
      /* the frame must never scroll itself — the wrapper's translateY IS the scroll */
      d.documentElement.style.scrollBehavior = 'auto';
      d.documentElement.style.overflow = 'hidden';
      /* the frame is full-height, so nothing is really lazy; be explicit anyway, or a
         `loading=lazy` image could decide to pop in mid-scrub */
      d.querySelectorAll('img[loading]').forEach((i) => i.setAttribute('loading', 'eager'));
      /* size the frame to the whole document, in the page's own 390px units. The CSS zoom
         then paints it at 440 wide and PAGE_ZOOM taller, which is the height the scene
         offsets are measured against. */
      const pageH = d.documentElement.scrollHeight;
      f.style.height = pageH + 'px';
      /* read the zoom rather than assume it: the phone's pages are at 440/390 and the side
         panels are 1:1, and every page-local → stage conversion depends on which */
      const z = parseFloat(getComputedStyle(f).zoom) || 1;
      PAGE_Z[wrap.id] = z;
      res({ id: wrap.id, pageH, zoom: z, stageH: Math.round(pageH * z),
            stageW: Math.round(d.documentElement.scrollWidth * z) });
    };
    if (f.contentDocument && f.contentDocument.readyState === 'complete') ready();
    else f.addEventListener('load', ready, { once: true });
  })));
}

/* ── s8 chip prep, inside the live page ──
   The page ships four chips pre-picked, so first undo that; then stack a `.sel` CLONE over
   each of the three Zack chooses and leave it at opacity 0 for the timeline to bring up on
   the press. A clone rather than a class toggle, because a class flip is not something a
   scrub can interpolate or reverse cleanly and the two faces differ in fill — the same
   reason the FOLLOW callout has two faces. Boxes are captured here so the cursor beats can
   be derived from them. Matching is by LABEL, not index: the page may reorder the chips. */
const CHIPS = { twin: {}, box: {}, cont: null };

function prepareChips() {
  const d = $('#page-myc')?.querySelector('iframe')?.contentDocument;
  if (!d) return;
  const all = [...d.querySelectorAll('.chip')];
  all.forEach((c) => c.classList.remove('sel'));      /* nobody starts picked */
  const norm = (e) => (e.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
  for (const lbl of PICKS) {
    const c = all.find((k) => norm(k) === lbl.toLowerCase());
    if (!c) { console.warn('s8: chip not found:', lbl); continue; }
    CHIPS.box[lbl] = c.getBoundingClientRect();
    c.style.position = 'relative';
    const twin = c.cloneNode(true);
    twin.classList.add('sel');
    Object.assign(twin.style, { position: 'absolute', left: '0', top: '0',
      width: '100%', height: '100%', opacity: '0' });
    c.appendChild(twin);
    CHIPS.twin[lbl] = twin;
  }
  const cont = [...d.querySelectorAll('*')].find(
    (e) => !e.children.length && /^continue$/i.test((e.textContent || '').trim()));
  CHIPS.cont = (cont?.closest('.ob-btn') || cont)?.getBoundingClientRect() || null;
}

/* ── s13.1: the article's vote ──
   `pages/article.html` is 33,615px of ranked list; s13.1 parks it on the FIRST entry, rank
   30 (Paige Bueckers), inside #gray-panel — the slab that used to be an empty placeholder.
   `.ecard` is that entry, `.evote-row` its three options (Underrated / Agree / Overrated).
   The page ships real vote JS, but the timeline drives the DOM itself instead: the page's
   handler is built for a real pointer and cannot be scrubbed backwards. Voting is exactly
   two class flips — `.evote` gains `voted`, the pressed button gains `on` — which reveals
   the results row. Given as absolute className strings so reversing restores them.
   ART_PARK frames the card: its top sits ART_INSET below the panel's top edge. */
const ART_VOTE = 0;          /* which option Zack presses: 0 = Underrated, per the user */
const ART_INSET = 40;        /* px of panel above the card */
const ART = { park: 0, btn: null, evote: null, btnBox: null };

function prepareArticle() {
  const wrap = $('#page-article');
  const d = wrap?.querySelector('iframe')?.contentDocument;
  if (!d) return;
  const card = d.querySelector('.ecard');
  const evote = card?.querySelector('.evote');
  const btn = evote?.querySelectorAll('.evote-row button')[ART_VOTE];
  if (!card || !evote || !btn) { console.warn('s13.1: article vote widget not found'); return; }
  ART.park = ART_INSET - card.getBoundingClientRect().top;
  ART.evote = evote;
  ART.btn = btn;
  ART.btnBox = btn.getBoundingClientRect();
  /* The percentages in the results row are COMPUTED by the page's own vote script, not
     present in the markup — flipping classes alone reveals an empty row. So let the real
     handler run once here, which writes the real tally, then take the classes back off. The
     numbers stay in the (still hidden) row and the timeline only has to reveal it. That way
     the figures are the product's, computed by the product, and nothing is invented. */
  btn.click();
  evote.classList.remove('voted');
  btn.classList.remove('on');
  /* The results row is display:none until the vote, so revealing it grows .evote 68 → 106
     and pushes the rest of THAT CARD down 38px. That reflow is the product's real behaviour
     and it is contained inside the frame, so it is allowed here — but it also means the
     document gets 38px taller than the height mountPages measured, and the frame does not
     grow with it. Only the page's very bottom is affected and no scene shows it. */
}

/* ── s14: the rerank drags ──
   `pages/rerank.html`'s editor (`.s5shell`) is 390×887, exactly #panel-rerank, so it mounts
   1:1 and never scrolls. Two drags: the row at position 3 goes to 4, then 6 to 7.
   The page ships real drag code over Pointer Events, and the timeline does NOT use it — a
   handler built for a live pointer cannot be scrubbed backwards, and this has to reverse. So
   the rows are moved directly: the dragged row and the one it displaces swap by exactly one
   ROW_H, the dragged row tracking the cursor **1:1** the way the s3/s4 swipe does. The
   position badges then renumber, off a proxy so they reverse (see the s13.1 note for why
   `set({className})` is not trustworthy for discrete state).
   The page opens on a full-screen onboarding sheet (`.s5onb`, z-index 70), which is
   dismissed at prep through the page's own Skip button rather than by hiding it, so whatever
   state that path sets is set. */
/* ONE swap, 3 → 4. There was a second (6 → 7) and it made the scene drag — user's call,
   2026-07-29. The loop still handles any number of pairs. */
const RERANK_DRAGS = [[3, 4]];              /* [from position, to position], 1-based */
const ROW_H = 68;                            /* measured .s5li pitch */
const RR = { rows: [], ready: false };

function prepareRerank() {
  const d = $('#page-rerank')?.querySelector('iframe')?.contentDocument;
  if (!d) return;
  const skip = [...d.querySelectorAll('.s5onb button')].find((e) => /skip/i.test(e.textContent || ''));
  if (skip) skip.click(); else console.warn('s14: no Skip on the rerank onboarding');
  RR.rows = [...d.querySelectorAll('.s5li')].map((li) => ({
    li,
    badge: li.querySelector('.s5rank'),
    handle: li.querySelector('.s5handle'),
    box: li.getBoundingClientRect(),
    handleBox: li.querySelector('.s5handle')?.getBoundingClientRect(),
  }));
  RR.ready = RR.rows.length >= 7 && RR.rows.every((r) => r.badge && r.handleBox);
  if (!RR.ready) console.warn('s14: rerank rows not as expected', RR.rows.length);
}

/* ── s12: the poll vote ──
   The scene used to move the cursor onto an option, "click", and then drop the +20 XP toast —
   with nothing happening to the option in between, so the reward arrived for an interaction the
   reader never saw. The live page has the whole thing already:

     `.bars` starts with class `unvoted`, and while it is there the CSS forces every
     `.bar-fill` to `width: 20px` with a transparent background and hides every `.bar-pct` —
     which is why the options read as plain white pills. Voting removes `unvoted` and adds
     `chosen` to the picked bar (`box-shadow: inset 0 0 0 2px #000`, the selection ring), and
     the fills take their real widths while the percentages become visible.

   So the reveal is two class changes plus the numbers, and the numbers are COMPUTED by the
   page's poll script — as with the s13.1 article vote, the real handler is run once here to
   get them, both states are snapshotted, and the timeline swaps between the two. Nothing is
   invented and nothing is hard-coded.

   **The `win` treatment is MOVED onto the reader's pick.** In the product, `.win` (black fill +
   `.bar-ink`'s inverted copy + a dark percentage) follows whichever option is *leading* — the
   page says so itself — while your own choice gets only `chosen`'s 2px inset ring. On a screen
   that is correct and legible. In this storyboard it read as the wrong row being selected: the
   cursor sat on option 1 and option 2 was the black one. So the emphasis follows the pick and
   nothing else carries it, which is what makes the selection unambiguous. The widths still
   encode the real tally, so the chosen bar's black fill is only as wide as its share — that is
   the point, not a bug. Nothing new is styled: `win` is the page's own class and every
   `.bar-fill` already ships a `.bar-ink`, so this is a class move, not a restyle.
   `.bar-fill` carries the page's own `transition: width 450ms` and it is deliberately left
   alone: it is the product's reveal, it is short, and it hangs off a discrete press. It does
   mean a screenshot taken inside that 450ms is mid-growth — wait it out when verifying. */
const POLL = { bars: null, target: null, pre: null, post: null, ready: false };

function preparePoll() {
  const d = $('#page-myc')?.querySelector('iframe')?.contentDocument;
  if (!d) return;
  const bars = d.querySelector('.bars');
  const all = bars ? [...bars.querySelectorAll('.bar')] : [];
  if (!all.length) { console.warn('s12: poll bars not found'); return; }
  /* the option under the cursor, not a hard-coded index — the beat and the target cannot
     disagree, and reordering the poll cannot silently select the wrong row */
  const tipY = CUR.s12.y + TIP;
  POLL.target = all.find((bar) => {
    const r = bar.getBoundingClientRect();
    const top = SCREEN_Y + r.top * PAGE_ZOOM + POS.myc.s12;
    return tipY >= top && tipY <= top + r.height * PAGE_ZOOM;
  }) || all[0];
  /* Write the percentage into the INNER `<p class="trim">`, never onto `.bar-pct` itself:
     setting textContent on the container destroys that p, and with it the styling that
     right-aligns the figure — which showed up as percentages sitting centred over the option
     text instead of at the bar's right edge. */
  const pctEl = (bar) => bar.querySelector('.bar-pct p') || bar.querySelector('.bar-pct');
  const snap = () => all.map((bar) => ({
    chosen: bar.classList.contains('chosen'),
    fill: bar.querySelector('.bar-fill').getAttribute('style') || '',
    fillCls: bar.querySelector('.bar-fill').className,
    pct: pctEl(bar).textContent,
    pctCls: bar.querySelector('.bar-pct').className,
  }));
  POLL.bars = bars;
  POLL.pre = snap();
  POLL.target.click();                 /* the page's own script does the arithmetic */
  const setWin = (cls, on) => {
    const set = new Set(cls.split(/\s+/).filter(Boolean));
    if (on) set.add('win'); else set.delete('win');
    return [...set].join(' ');
  };
  const pick = all.indexOf(POLL.target);
  POLL.post = snap().map((s, i) => Object.assign({}, s, {
    fillCls: setWin(s.fillCls, i === pick),
    pctCls: setWin(s.pctCls, i === pick),
  }));
  /* put it back to unvoted so the scene can play the vote */
  bars.classList.add('unvoted');
  POLL.target.classList.remove('chosen');
  POLL.pre.forEach((s, i) => {
    all[i].querySelector('.bar-fill').setAttribute('style', s.fill);
    all[i].querySelector('.bar-fill').className = s.fillCls;
    all[i].querySelector('.bar-pct').className = s.pctCls;
    pctEl(all[i]).textContent = s.pct;
  });
  POLL.all = all;
  POLL.ready = true;
}

function applyPoll(voted) {
  if (!POLL.ready) return;
  const src = voted ? POLL.post : POLL.pre;
  POLL.bars.classList.toggle('unvoted', !voted);
  POLL.all.forEach((bar, i) => {
    bar.classList.toggle('chosen', voted && src[i].chosen);
    const fill = bar.querySelector('.bar-fill'), pct = bar.querySelector('.bar-pct');
    fill.setAttribute('style', src[i].fill);
    fill.className = src[i].fillCls;
    pct.className = src[i].pctCls;
    (pct.querySelector('p') || pct).textContent = src[i].pct;
  });
}

/* ── Cursor beats that point INSIDE a live page ──
   A beat aimed at real page furniture must not be a copied number: the page can change and
   the number would rot silently. `PAGE_TARGETS` names the element instead, and `resolvePageTargets`
   (called from boot once the frames have measured themselves) writes the resolved beat into
   CUR. `at` is the POS offset in force when the beat happens, because a page-local y only
   becomes a stage y once you know where the page is parked.
   Each entry: the frame, the offset in force, a finder, and the cursor pose. */
const PAGE_TARGETS = {
  /* the heart on the story card the s5 callouts annotate. `.i20 > .heart-in` is the 23×23
     icon itself, not the icon+count control, so the tip lands on the glyph. */
  s6: {
    page: 'page-latest', at: () => POS.latest.s5, flip: true,
    find: (d) => {
      const rows = [...d.querySelectorAll('.act-row')];
      const inView = rows.filter((r) => {
        const y = r.getBoundingClientRect().top * PAGE_ZOOM + POS.latest.s5;
        return y > 0 && y < 952;
      });
      return (inView[0] || rows[0]).querySelector('.i20 .heart-in');
    },
  },
  /* the COMMENT icon on the story card s9 rests on — the beat that opens the comments tray.
     In home-feed an action row is `.eact` x3 (react, comment, bookmark), so the comment one is
     index 1. It used to be a hand-placed number that landed 39px right of the icon, in the gap
     between comment and bookmark: it opened the tray from a click on nothing. */
  s9: {
    page: 'page-myc', at: () => POS.myc.s9, flip: true, click: true,
    find: (d) => {
      const rows = new Map();
      for (const e of d.querySelectorAll('.eact')) {
        if (!rows.has(e.parentElement)) rows.set(e.parentElement, []);
        rows.get(e.parentElement).push(e);
      }
      for (const [row, acts] of rows) {
        const y = row.getBoundingClientRect().top * PAGE_ZOOM + POS.myc.s9;
        if (y > 0 && y < 952 && acts.length >= 2) return acts[1];   /* [react, COMMENT, mark] */
      }
      return null;
    },
  },
  /* the MY COMPLEX tab, clicked at the end of the s7 fling home (page parked at the top).
     Measured centre (1066.6, 190.8) — the same point the retired nav export gave, which is
     a useful independent check that page and export are the same design. */
  s7: {
    page: 'page-latest', at: () => POS.latest.s1,
    find: (d) => [...d.querySelectorAll('*')].find(
      (e) => !e.children.length && (e.textContent || '').trim().toUpperCase() === 'MY COMPLEX'),
  },
  /* the profile picture on the UGC post the fandom page rests on at s20 — the press that
     opens that member's Complex I.D. `.up-av` is the 32px avatar itself, so the tip lands
     on the photo and not on the name beside it. First one in the screen, same in-view scan
     as s6/s9: the page owns which post that is, so a scroll change can't strand the beat
     on an avatar that is no longer there. */
  s20: {
    page: 'page-fandom', at: () => POS.fandom.s20, flip: true, click: true,
    find: (d) => [...d.querySelectorAll('.post .ph .up-av')].find((e) => {
      const y = e.getBoundingClientRect().top * PAGE_ZOOM + POS.fandom.s20;
      return y > 0 && y < 952;
    }),
  },
};

/* arrow top-left that puts the TIP on a stage point. Flipped, the arrow turns 90° and its
   tip sits at (x + ARROW_W − TIP, y + TIP) instead — the same convention cursorTo turns on. */
function beatOnTip([x, y], opts = {}) {
  const b = opts.flip
    ? { x: x - (ARROW_W - TIP), y: y - TIP }
    : { x: x - TIP_OFF[0], y: y - TIP_OFF[1] };
  return Object.assign(b, opts);
}

/* The s10 post button lives in our own document, not a page frame, so it resolves separately:
   #drawer is `position: absolute` and nothing between it and the button is positioned, which
   makes the button's offsetLeft/offsetTop drawer-relative. Deliberately NOT
   getBoundingClientRect — #stage is scaled to fit the window, so that would return viewport
   px and the beat would move with the browser size. */
const DRAWER_X = 1113, DRAWER_Y = 123;

function resolveTrayTarget() {
  const btn = document.querySelector('#drawer .tlc-post');
  if (!btn) { console.warn('s10: post button not found'); return; }
  CUR.s10 = beatOnTip([DRAWER_X + btn.offsetLeft + btn.offsetWidth / 2,
                       DRAWER_Y + btn.offsetTop + btn.offsetHeight / 2], { click: true });
}

function resolvePageTargets() {
  for (const [beat, t] of Object.entries(PAGE_TARGETS)) {
    const frame = $('#' + t.page)?.querySelector('iframe');
    const el = frame && t.find(frame.contentDocument);
    if (!el) { console.warn('page target unresolved:', beat, t.page); continue; }
    const r = el.getBoundingClientRect();
    const z = PAGE_Z[t.page] ?? PAGE_ZOOM;
    const [ox, oy] = t.origin || [SCREEN_X, SCREEN_Y];
    const cx = ox + (r.left + r.width / 2) * z;
    const cy = oy + (r.top + r.height / 2) * z + t.at();
    CUR[beat] = beatOnTip([cx, cy], { flip: t.flip, rot: t.rot, click: t.click });
  }
}

/* ── Preload & decode every image ──
   Counts the images inside the page frames too, or the loader would clear while the
   product pages are still blank. */
function preload() {
  const imgs = [...document.images];
  for (const f of document.querySelectorAll('.page')) {
    try { imgs.push(...f.contentDocument.images); } catch { /* same-origin, shouldn't throw */ }
  }
  const fill = $('#loader-fill');
  let done = 0;
  const bump = () => { fill.style.width = (++done / imgs.length) * 100 + '%'; };
  return Promise.all(imgs.map((img) =>
    (img.complete ? Promise.resolve() : new Promise((res) => {
      img.onload = res; img.onerror = res;
    })).then(() => img.decode?.().catch(() => {})).then(bump)
  ));
}

/* ── Cursor helpers ──
   Arrow box 57px, tip inset ~2px, tag rests at left:47 → 45px tip→tag gap.
   Flipped, the tip sits at x=55; the tag's RIGHT edge keeps the same 45px gap,
   which needs the measured tag width (computed in boot as TAG_FLIP_X). */
const TAG_X = 47, ARROW_W = 57, TIP = 2;
let TAG_FLIP_X = -111; // recomputed from the real tag width in boot()

function cursorTo(tl, beat, at, dur = 0.55) {
  tl.to('#cursor', { x: beat.x, y: beat.y, duration: dur, ease: 'power3.inOut' }, at);
  /* 2D turn: rotating this arrow +90° swings the tip from top-left to top-right
     (exactly where a mirror would put it) — reads as turning on a path, no 3D flip.
     `rot` overrides it for the s3/s4 swipe pose, where the tilt is an intermediate
     angle taken from the storyboard. The tag never rotates — Figma keeps it upright. */
  const rot = beat.rot != null ? beat.rot : (beat.flip ? 90 : 0);
  tl.to('#cursor-arrow', { rotation: rot, duration: 0.3, ease: 'power2.inOut' }, at + dur * 0.3);
  tl.to('#cursor-tag', { x: beat.flip ? TAG_FLIP_X : 0, duration: 0.3, ease: 'power2.inOut' }, at + dur * 0.3);
  if (beat.click) click(tl, at + dur + 0.05);
  return at + dur;
}
function click(tl, at) {
  /* quick 10% press; scales the inner wrapper so it can't clobber the arrow's turn */
  tl.to('#cursor-inner', { scale: 0.9, duration: 0.08, ease: 'power2.in' }, at)
    .to('#cursor-inner', { scale: 1, duration: 0.12, ease: 'power2.out' }, at + 0.08);
}

/* ── Hover hit-testing (s5) ──
   The cursor's position is a pure function of timeline time, so we can SOLVE the exact
   moment its tip crosses into and out of a callout instead of guessing an offset around
   the arrival. That guess is what read as lag. `.chip`'s box is the hit area — the same
   box Figma draws the hover chip in — and it's measured from the DOM so it can't drift
   from the CSS.
   Everything here is evaluated once at build time; nothing hit-tests per frame. */
const TIP_OFF = [2.43652, 2.43555];      /* arrow tip inside its 57px box, unrotated */
const HOVER_ATTACK  = 0.04;              /* units: ≈32 px of scroll, ≈55 ms — a UI transition */
/* The release must FINISH on the band boundary, not start there. The bands tile, so
   leaving one row and entering the next happen at the same instant — if both ramps start
   then, two rows are lit at once, which hover never is. Ending the release on the
   boundary means the outgoing row is dark exactly as the incoming one begins. */
const HOVER_RELEASE = 0.03;              /* ≈24 px, ≈40 ms */

/* the row's own painted box: the chip where there is one, else the callout itself */
function rowBox(sel) {
  const c = $(sel), chip = c.querySelector('.chip');
  if (!chip) return { x: c.offsetLeft, y: c.offsetTop, w: c.offsetWidth, h: c.offsetHeight };
  return { x: c.offsetLeft + chip.offsetLeft, y: c.offsetTop + chip.offsetTop,
           w: chip.offsetWidth, h: chip.offsetHeight };
}

/* Hit bands, TILED. A real list has no dead gutter between rows — the row's hit area
   fills the space — so each band takes half the gap above and below it. Testing the
   painted boxes alone left 63% of the pass with nothing lit (the boxes are ~90px tall
   with ~50px gaps, and the cursor covers 157px a hop), which is what read as the hover
   having gone missing. Tiled bands hand over instantly: react goes out on the exact
   frame comment comes in. */
function hitBands(sels) {
  const b = sels.map(rowBox);
  return b.map((r, i) => {
    const top = i ? (b[i - 1].y + b[i - 1].h + r.y) / 2 : r.y - 24;
    const bot = i < b.length - 1 ? (r.y + r.h + b[i + 1].y) / 2 : r.y + r.h + 24;
    return { x: r.x, w: r.w, y: top, h: bot - top };
  });
}

/* piecewise cursor path: [{ t0, dur, ease, from:[x,y], to:[x,y] }, …] */
function tipAt(segs, t) {
  for (const s of segs) {
    if (t <= s.t0) return [s.from[0] + TIP_OFF[0], s.from[1] + TIP_OFF[1]];
    if (t <= s.t0 + s.dur) {
      const u = gsap.parseEase(s.ease)((t - s.t0) / s.dur);
      return [s.from[0] + (s.to[0] - s.from[0]) * u + TIP_OFF[0],
              s.from[1] + (s.to[1] - s.from[1]) * u + TIP_OFF[1]];
    }
  }
  const l = segs[segs.length - 1];
  return [l.to[0] + TIP_OFF[0], l.to[1] + TIP_OFF[1]];
}

/* first/last time the tip is inside `box`, scanned at ~1.6px of scroll resolution */
function hoverWindow(segs, box, from, to, dt = 0.0005) {
  let enter = null, exit = null;
  for (let t = from; t <= to; t += dt) {
    const [x, y] = tipAt(segs, t);
    if (x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h) {
      if (enter === null) enter = t;
      exit = t;
    }
  }
  return enter === null ? null : { enter, exit: exit + dt };
}

/* Toast in/out (in-screen, slides from above the nav) */
function toastIn(tl, id, at) {
  tl.fromTo(id, { autoAlpha: 0, y: -170 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)' }, at);
}
function toastOut(tl, id, at) {
  tl.to(id, { autoAlpha: 0, y: -170, duration: 0.28, ease: 'power2.in' }, at);
}

/* ═══════════════ Timeline ═══════════════ */
function buildTimeline() {
  const tl = gsap.timeline({ defaults: { ease: 'none' } });
  let t = 0;
  const label = (name, dur) => { tl.addLabel(name, t); const s = t; t += dur; return s; };

  /* Initial states */
  gsap.set('#page-latest', { y: POS.latest.s1, autoAlpha: 1 });
  gsap.set('#cursor', { x: 2050, y: 600, autoAlpha: 0 });

  /* ── Scene 1: hero hold ── */
  label('s1', 1.0);

  /* ── Scene 2: Zack arrives ── */
  {
    const s = label('s2', 0.9);
    tl.to('#cursor', { autoAlpha: 1, duration: 0.2 }, s);
    cursorTo(tl, CUR.s2, s, 0.7);
  }

  /* ── Scene 3: comes onto the screen and winds up ──
     Arrives off the bezel, then a short accelerating dip DOWN, turning as it drops so
     it lands in the storyboard pose (30°, tip on the screen edge) cocked and loaded.
     The feed does NOT move on the way down — the backswing is the cursor's, and the
     screen only answers the upstroke. ── */
  {
    const s = label('s3', 1.2);
    cursorTo(tl, CUR.s3, s, 0.55);
    tl.to('#cursor', { x: CUR.s3b.x, y: CUR.s3b.y, duration: 0.26, ease: 'power2.in' }, s + 0.62);
    tl.to('#cursor-arrow', { rotation: CUR.s3b.rot, duration: 0.26, ease: 'power2.in' }, s + 0.62);
    click(tl, s + 0.9);
  }

  /* ── Scene 4: the whip ──
     Contact → flick up → release. The feed tracks the cursor **1:1** through the drag,
     because that is what a real swipe does — the content is stuck to the finger. Then
     the cursor lifts and the strip flings on alone with a hard decel: inertia carries
     far more distance than the drag did (446 px dragged, ~4.7k flung), which is also
     true of a phone. Doing it the other way round — feed on its own ease, cursor
     merely nearby — is what made this beat read as unmotivated before. ── */
  /* Scene length is trimmed to the fling's landing (s+1.34) so s5 picks the scroll straight
     back up with nothing dead in between. This has been tightened twice: first from 2.4 (which
     left 448px where nothing moved), then from 1.9 — that still left 392px of near-still scroll
     across the 4→5 seam, because the fling's own tail was crawling. See the fling's ease. */
  {
    const s = label('s4', 1.34);
    const DRAG = CUR.s3b.y - CUR.s4.y;                /* 466 px of upstroke, feed 1:1 */
    const dragTo = POS.latest.s1 - DRAG;
    /* the whip — short and accelerating, so the release is its fastest moment */
    tl.to('#cursor',       { x: CUR.s4.x, y: CUR.s4.y, duration: 0.28, ease: 'power2.in' }, s + 0.06);
    tl.to('#page-latest', { y: dragTo,                duration: 0.28, ease: 'power2.in' }, s + 0.06);
    /* release: the feed flies on alone to the article list, cursor peels off and un-tilts */
    /* `power2.out` over 1.0, not `power3.out` over 1.5. The old pair spent its last half-unit
       crawling: measured, 392px of scroll passed across the s4→s5 handover with the feed moving
       under 0.15px per scroll px, which is the "tiny break" the user saw.
       The ease is the whole story: the HIGHER the power, the earlier it reaches 96% and the
       longer it then creeps. power3.out is 96% done at 55% of its duration, power2.out at 66%,
       power1.out at 80% — so power1 has the shortest tail, which is what a seam needs. */
    tl.to('#page-latest', { y: POS.latest.s4, duration: 1.0, ease: 'power1.out' }, s + 0.34);
    tl.to('#cursor-arrow', { rotation: 0, duration: 0.4, ease: 'power2.out' }, s + 0.38);
    tl.to('#cursor', { x: CUR.s4b.x, y: CUR.s4b.y, duration: 0.85, ease: 'power2.inOut' }, s + 0.4);
  }

  /* ── Scene 5: REACT/COMMENT/BOOKMARK/FOLLOW callouts + the hover pass ──
     Zack touches all four stops inside HOVER_PASS units (≈1.5s at the reference
     read pace). Each stop swaps that callout to its Figma hover face (Scenes
     5.1–5.3) and drops it again as he leaves; FOLLOW is a press, so its
     FOLLOWING face stays on into scene 6. ── */
  {
    const s = label('s5', 2.7);
    /* `sine.inOut`, not `power2.inOut`: both leave at zero velocity, but sine ramps up fastest
       of the inOuts, so the least scroll passes with the feed still crawling out of the seam. */
    tl.to('#page-latest', { y: POS.latest.s5, duration: 1.4, ease: 'sine.inOut' }, s);
    HOV.forEach(({ sel }, i) => {
      tl.fromTo(sel, { autoAlpha: 0, x: -36 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out' }, s + 0.5 + i * 0.12);
    });

    /* ONE continuous sweep, not four hops. Two things made this read as choppy:
       (1) each glide took only 0.6 of a step, so the cursor sat fully parked for the
           other 0.4 — 80 px of scroll of nothing, four times over;
       (2) the crossfades named no ease, and this timeline `defaults: { ease: 'none' }`,
           so all eight opacity ramps were LINEAR over 66 px — a mechanical blink.
       Now the segments butt straight up against each other (the cursor is never still,
       its speed just dips as it passes each callout) and every ramp is eased and long
       enough to read. The on/off swells of neighbouring stops nearly touch, so the four
       hovers flow as one wave instead of blinking in sequence.
       Any tween added here MUST name an ease — the timeline default is linear. */
    const step = HOVER_PASS / 4;
    const p0 = s + 1.45;                    /* tip reaches REACT once the feed has settled */
    /* the path, declared once so the hit-test and the tweens can't disagree */
    const SEGS = [{ t0: p0 - 0.55, dur: 0.55, ease: 'power2.inOut',
                    from: [CUR.s4b.x, CUR.s4b.y], to: [HOV[0].x, HOV[0].y] }];
    for (let i = 1; i < HOV.length; i++)
      SEGS.push({ t0: p0 + (i - 1) * step, dur: step, ease: 'sine.inOut',
                  from: [HOV[i - 1].x, HOV[i - 1].y], to: [HOV[i].x, HOV[i].y] });
    SEGS.forEach((sg) => tl.to('#cursor', { x: sg.to[0], y: sg.to[1], duration: sg.dur, ease: sg.ease }, sg.t0));
    const BANDS = hitBands(HOV.map((h) => h.sel));

    HOV.forEach((beat, i) => {
      const arrive = p0 + i * step;

      if (beat.hold) {
        /* FOLLOW is a press, not a hover: it commits at the bottom of the click — the
           press has to land before the state flips, or the button changes before it's hit */
        const press = arrive + step * 0.04;
        click(tl, press);
        tl.to(beat.sel + ' .act',  { autoAlpha: 1, duration: HOVER_ATTACK, ease: 'power2.out' }, press + 0.08);
        tl.to(beat.sel + ' .idle', { autoAlpha: 0, duration: HOVER_ATTACK, ease: 'power2.out' }, press + 0.08);
        return;
      }
      /* Hover fires on the geometric crossing — the frame the tip enters the chip's box,
         and the frame it leaves. No offsets, no lag, and it stays correct if a stop moves.
         Chip opacity + icon tilt + the Bold flip all land together on one short attack, so
         the row simply lights up and drops, the way a real hover does. */
      const win = hoverWindow(SEGS, BANDS[i], SEGS[0].t0, p0 + HOVER_PASS);
      if (!win) { console.warn('s5: cursor never enters', beat.sel); return; }
      tl.to(beat.sel + ' .chip',   { autoAlpha: 1, duration: HOVER_ATTACK, ease: 'power2.out' }, win.enter);
      tl.to(beat.sel + ' .ci svg', { rotation: ICON_TILT, duration: HOVER_ATTACK, ease: 'power2.out' }, win.enter);
      const rel = win.exit - HOVER_RELEASE;   /* so it lands ON the boundary, not after it */
      /* Bold is a `set`, not a `to`: font-weight is a LAYOUT property and the only smooth
         way to ramp it is a variable font, which this page doesn't ship. Discrete is right
         anyway — the two-layer weight dissolve it replaced is what looked smeary. */
      tl.set(beat.sel + ' .cl', { fontWeight: 700 }, win.enter);
      tl.to(beat.sel + ' .chip',   { autoAlpha: 0, duration: HOVER_RELEASE, ease: 'power2.in' }, rel);
      tl.to(beat.sel + ' .ci svg', { rotation: 0, duration: HOVER_RELEASE, ease: 'power2.in' }, rel);
      tl.set(beat.sel + ' .cl', { fontWeight: 400 }, rel);
    });
  }

  /* ── Scene 6: reaction picker + emoji wall (callouts clear out) ── */
  {
    const s = label('s6', 1.9);
    tl.to('#callouts .callout', { autoAlpha: 0, duration: 0.3, stagger: 0.05 }, s);
    cursorTo(tl, CUR.s6, s, 0.55);
    click(tl, s + 0.6);
    /* tray grows out of its pointer tail, which sits right above the clicked heart */
    tl.fromTo('#picker', { autoAlpha: 0, scale: 0.55, transformOrigin: '49% 100%' },
      { autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, s + 0.68);
    /* the wall cascades in on the diagonal from the top-left corner nearest the phone */
    document.querySelectorAll('#emoji-grid .wall-cell').forEach((cell, i) => {
      const c = i % WALL_COLS, r = (i / WALL_COLS) | 0;
      tl.fromTo(cell, { autoAlpha: 0, y: 46, rotation: (c + r) % 2 ? 7 : -7 },
        { autoAlpha: 1, y: 0, rotation: 0, duration: 0.4, ease: 'back.out(1.5)' },
        s + 0.75 + (c + r) * 0.075);
    });
    /* then up onto the tray, where the storyboard frame leaves him (already turned) */
    tl.to('#cursor', { x: CUR.s6b.x, y: CUR.s6b.y, duration: 0.5, ease: 'power2.inOut' }, s + 1.2);
  }

  /* ── Scene 7: whip the feed home, then switch to MY COMPLEX ──
     The s3/s4 swipe played the other way: Zack rises off the tray into the same 30° cocked
     pose, makes contact, then whips DOWN — and the feed is stuck to the finger 1:1 through
     the drag, same as the upstroke in s4. That 1:1 lock is again the whole point; it makes
     the return look CAUSED by the gesture.
     On release the feed keeps going all the way to the top of the "Latest Stories" feed
     under its own inertia, and the sticky nav slides back down with it — which is what a
     real feed does when you throw it upward. That fling is the wall-clock beat: see AUTO.
     Then Zack glides up to the MY COMPLEX tab in the nav he just brought back, clicks it,
     and the page swaps to MY COMPLEX. ── */
  {
    const s = label('s7', 2.9);
    /* the tray has to be off the screen before the gesture starts */
    tl.to('#picker', { autoAlpha: 0, duration: 0.3 }, s);
    tl.to('#emoji-grid .wall-cell', { autoAlpha: 0, y: -26, duration: 0.3, stagger: 0.015 }, s);

    /* windup: up and right off the tray, turning into the cocked pose as it rises.
       The tag comes back to the arrow's right for the swipe, as it is in s3/s4. */
    tl.to('#cursor', { x: CUR.s7a.x, y: CUR.s7a.y, duration: 0.6, ease: 'power2.inOut' }, s + 0.2);
    tl.to('#cursor-arrow', { rotation: CUR.s7a.rot, duration: 0.4, ease: 'power2.inOut' }, s + 0.34);
    tl.to('#cursor-tag', { x: 0, duration: 0.3, ease: 'power2.inOut' }, s + 0.34);
    click(tl, s + 0.84);                              /* contact, at the top of the windup */

    /* the whip — short and accelerating, so the release is its fastest moment (as s4) */
    const DRAG = CUR.s7b.y - CUR.s7a.y;               /* 466 px down, feed tracks it 1:1 */
    const dragTo = POS.latest.s5 + DRAG;              /* +ve = the feed moves back up */
    tl.to('#cursor',       { x: CUR.s7b.x, y: CUR.s7b.y, duration: 0.3, ease: 'power2.in' }, s + 0.92);
    tl.to('#page-latest', { y: dragTo,                  duration: 0.3, ease: 'power2.in' }, s + 0.92);

    /* release: the finger lifts and un-tilts, and AUTO.tl takes the feed home on the clock.
       Nothing in the master timeline may touch #page-latest y past this point. */
    tl.to('#cursor-arrow', { rotation: 0, duration: 0.4, ease: 'power2.out' }, s + 1.26);
    AUTO.from = dragTo;
    AUTO.release = s + 1.22;
    AUTO.tl = gsap.timeline({ paused: true })
      .to('#page-latest', { y: POS.latest.s1, duration: FLING_HOME, ease: 'power3.out' }, 0)
      ;

    /* Up to the MY COMPLEX tab in the nav the whip just brought back. Raw tweens rather
       than cursorTo: that helper would add its own rotation tween on top of the un-tilt
       above, and two tweens racing the same property is how a turn ends up wobbling. */
    const arrive = s + 2.15;
    tl.to('#cursor', { x: CUR.s7.x, y: CUR.s7.y, duration: 0.85, ease: 'power3.inOut' }, s + 1.3);
    AUTO.snap = arrive;
    click(tl, arrive + 0.05);

    /* The tab press swaps the nav in place — a hard cut, not a slide or a crossfade. The
       bar is already on screen and the two arts differ only in which pill is filled, so
       sliding it again would re-enter a nav that never left, and dissolving near-identical
       bars ghosts (same reason the callout labels flip weight instead of fading). */
    const press = arrive + 0.11;
    tl.set('#page-myc', { y: POS.myc.s7 }, press);
    tl.to('#page-latest', { autoAlpha: 0, duration: 0.3 }, press + 0.02);
    tl.fromTo('#page-myc', { autoAlpha: 0, y: POS.myc.s7 + 40 },
      { autoAlpha: 1, y: POS.myc.s7, duration: 0.45, ease: 'power2.out' }, press + 0.04);
  }

  /* ── Scene 8: pick three topics, then Continue ──
     Zack picks SNEAKERS → SPORTS → COMPLEXCON on the live page's own chips, each snapping to
     its picked face at the bottom of its press, then hits CONTINUE.
     Every position is resolved from the page (see prepareChips), so moving a chip in the
     page moves the cursor with it. Flipped for the chips: they sit left of centre, and
     flipped the "Zack" tag falls into the feed's left margin rather than onto the rows
     below. It still crosses one row on the SPORTS press — the rows are 8px apart and the tag
     is 47px tall, so no placement clears every one; nothing on that row is a target. ── */
  {
    const s = label('s8', 3.7);
    tl.to('#page-myc', { y: POS.myc.s8, duration: 0.9, ease: 'power2.inOut' }, s);

    /* page-local box → the stage point at this scene's resting offset */
    const centre = (r) => [SCREEN_X + (r.left + r.width / 2) * PAGE_ZOOM,
                           SCREEN_Y + (r.top + r.height / 2) * PAGE_ZOOM + POS.myc.s8];

    let at = s + 0.7;
    PICKS.forEach((pick, i) => {
      const r = CHIPS.box[pick];
      if (!r) return;
      at = cursorTo(tl, beatOnTip(centre(r), { flip: true, click: true }), at, i ? 0.45 : 0.6);
      /* the picked face snaps in at the BOTTOM of the press — before that and the chip
         changes before it is hit, the mistake the FOLLOW callout had */
      tl.to(CHIPS.twin[pick], { opacity: 1, duration: 0.06, ease: 'power2.out' }, at + 0.13);
      at += 0.25;
    });
    if (CHIPS.cont) cursorTo(tl, beatOnTip(centre(CHIPS.cont), { click: true }), at, 0.5);
  }

  /* ── Scene 9: story page, like + save ── */
  {
    const s = label('s9', 1.5);
    tl.to('#page-myc', { y: POS.myc.s9, duration: 1.0, ease: 'power2.inOut' }, s);
    cursorTo(tl, CUR.s9, s + 0.6, 0.6);
  }

  /* ── Scene 10: the comments tray, typed live, then posted ──
     The tray floats in on the s9 comment-icon click. The box arrives EMPTY — the export bakes
     someone else's comment into it, which `#cmt-patch` covers — and the text types in as Zack
     writes it, character by character, with the counter following. Then he presses POST and it
     sends: the text lifts out of the box and fades, and the box and counter reset.
     Typing is driven off a proxy tween, so it scrubs and reverses like everything else; a
     per-character timeline of 29 tweens would be neither. Array.from, not slice, because the
     string ends in two emoji and slicing a surrogate pair renders a replacement glyph. ── */
  {
    const s = label('s10', 3.4);
    tl.to('#screen-scrim', { autoAlpha: 1, duration: 0.35 }, s);
    tl.fromTo('#drawer', { autoAlpha: 1, y: 1100 }, { y: 0, duration: 0.75, ease: 'power3.out' }, s + 0.1);

    const CHARS = Array.from(COMMENT_TEXT);
    const node = $('#cmt-node'), cnt = $('#cmt-count'), caret = $('#cmt-caret');
    const mine = $('#cmt-mine'), posted = $('#cmt-posted');
    posted.textContent = COMMENT_TEXT;
    const type = { n: 0, sent: 0 };
    const render = () => {
      const n = Math.round(type.n), s = type.sent;
      node.textContent = CHARS.slice(0, n).join('');
      cnt.textContent = (s > 0.5 ? 0 : n) + ' / 2,000';
      caret.style.opacity = s > 0.5 ? '0' : '1';
      /* the box empties on the send and Zack's comment appears at the TOP of the list.
         Both sides driven off this one proxy, so a reverse scrub undoes the post as cleanly
         as it undoes the typing — a class or display flip on its own would not come back. */
      node.style.opacity = String(1 - s);
      mine.style.display = s > 0.02 ? 'flex' : 'none';
      mine.style.opacity = String(s);
      mine.style.transform = 'translateY(' + ((1 - s) * -10).toFixed(2) + 'px)';
    };
    render();
    /* ~1.1 units of typing: at 28px this is the thing the scene is about, so it is paced to
       be read rather than to be fast */
    tl.to(type, { n: CHARS.length, duration: 1.1, ease: 'none', onUpdate: render }, s + 0.95);
    const at = cursorTo(tl, CUR.s10, s + 2.2, 0.5);      /* over to POST */
    tl.to(type, { sent: 1, duration: 0.3, ease: 'power2.out', onUpdate: render }, at + 0.13);
  }

  /* ── Scene 11: +100 XP ── */
  {
    /* 2.2 units: the frame sweep alone is 1.6 (63 frames at ~20px of scroll each) and it
       starts at +0.5. It used to be 1.4 with 320px of dead tail, so most of this is reclaimed
       rather than added. */
    const s = label('s11', 2.2);
    tl.to('#drawer', { y: 1100, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, s);
    /* No scale-pop any more: the video opens with its own entrance, so popping the container
       as well would play the arrival twice. The container just fades; the frames do the rest. */
    tl.fromTo('#xp-modal', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, s + 0.45);
    /* the frame sweep — 63 frames over 1.6 units, i.e. ~20px of scroll each */
    const sheet = $('#xp-sheet');
    const xp = { f: 0 };
    const frame = () => {
      const i = Math.max(0, Math.min(XP_FRAMES - 1, Math.round(xp.f)));
      gsap.set(sheet, { x: -(i % XP_COLS) * XP_CELL_W,
                        y: -Math.floor(i / XP_COLS) * XP_CELL_H });
    };
    frame();
    tl.to(xp, { f: XP_FRAMES - 1, duration: 1.6, ease: 'none', onUpdate: frame }, s + 0.5);
    tl.to('#cursor', { x: CUR.s21.x - 60, y: CUR.s10.y - 60, duration: 0.8, ease: 'power2.inOut' }, s + 0.2);
  }

  /* ── Scene 12: poll + first toast ── */
  {
    const s = label('s12', 1.8);
    tl.to('#xp-modal', { autoAlpha: 0, scale: 0.85, duration: 0.3 }, s);
    tl.to('#screen-scrim', { autoAlpha: 0, duration: 0.3 }, s);
    tl.to('#page-myc', { y: POS.myc.s12, duration: 1.1, ease: 'power2.inOut' }, s + 0.15);
    const at = cursorTo(tl, CUR.s12, s + 0.75, 0.55);
    /* the vote lands at the BOTTOM of the press, and the XP follows it rather than racing it —
       the toast used to arrive 0.02 units after the press with nothing having visibly happened */
    const vote = { v: 0 };
    const applyVote = () => applyPoll(vote.v > 0.5);
    applyVote();
    tl.to(vote, { v: 1, duration: 0.06, ease: 'none', onUpdate: applyVote }, at + 0.13);
    toastIn(tl, '#toast-20', at + 0.38);
  }

  /* ── Scene 13: pause on the WNBA article card, and the article opens beside the phone ──
     The phone rests on "The 30 Best WNBA Players of All Time, Ranked" (POS.myc.s13, derived
     to put that headline under the storyboard's cursor) and the left slab — which is now
     pages/article.html itself — fades up already parked on rank 30. ── */
  {
    const s = label('s13', 2.0);
    /* autoAlpha too: `.page` starts hidden, and #gray-panel's own fade only reveals the
       slab, not the frame inside it */
    gsap.set('#page-article', { y: ART.park, autoAlpha: 1 });
    toastOut(tl, '#toast-20', s + 0.1);
    tl.to('#page-myc', { y: POS.myc.s13, duration: 1.5, ease: 'power2.inOut' }, s);
    /* toast-30 ("You List Voted!") is NOT here — it is the reward for the vote, so it drops
       in s13.1 once Zack has actually pressed UNDERRATED. It used to land here, a whole
       scene before the vote it was congratulating. */
    tl.fromTo('#gray-panel', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, s + 1.1);
    cursorTo(tl, CUR.s13, s + 0.9, 0.7);
  }

  /* ── Scene 13.1: vote on rank 30 ──
     Zack presses UNDERRATED on the first entry and the results row reveals. Two class flips,
     not a crossfade: a vote is a commit, the same call as the FOLLOW callout and the topic
     chips. Position comes from the button's own box (see prepareArticle), so it follows the
     page. The panel is 390 wide — the article's authored width — so this is 1:1, no zoom. ── */
  {
    /* 1.9 units: the press lands at s+1.08 and the XP toast finishes arriving at s+1.57, so
       the rest is a deliberate hold that lets it be read before s14 pulls it out. At 1.25 the
       toast started 0.03 units before the scene ended and never appeared at all. */
    const s = label('s13.1', 1.9);
    if (ART.btn) {
      const r = ART.btnBox;
      const tip = [PANEL_X + r.left + r.width / 2,
                   PANEL_Y + r.top + r.height / 2 + ART.park];
      /* flipped, as the storyboard's own s13 beat is for this panel: the tag then sits off
         the panel's left edge over empty stage instead of on top of the results row it is
         about to reveal (unflipped it lands squarely on the percentages) */
      const at = cursorTo(tl, beatOnTip(tip, { flip: true, click: true }), s + 0.25, 0.7);
      const press = at + 0.13;          /* bottom of the press, as the chips do */
      /* Driven off a PROXY, not `set(className)`. GSAP's className handling would not give
         the button its empty class back on a reverse scrub (verified: `voted` came off,
         `on` stayed), whereas a proxy tween re-derives both classes from its own value in
         either direction — and a scrub that jumps clean past the tween still renders it at
         its end, so the state can never be skipped. */
      const vote = { v: 0 };
      const apply = () => {
        const on = vote.v > 0.5;
        ART.evote.classList.toggle('voted', on);
        ART.btn.classList.toggle('on', on);
      };
      apply();
      tl.to(vote, { v: 1, duration: 0.06, ease: 'none', onUpdate: apply }, press);
      /* the XP lands on the vote — it is what the vote earned. Moved here from s13, where it
         congratulated a vote that had not happened yet. */
      toastIn(tl, '#toast-30', press + 0.14);
    }
  }

  /* ── Scene 14: the rerank editor, and two real drags ──
     The panel slides in, then Zack drags the row at 3 down to 4 and the row at 6 down to 7,
     each row tracking the cursor 1:1 through the move and the badges renumbering on the drop.
     Positions come from the rows' own boxes, so they follow the page. ── */
  {
    /* 3.0 units for one drag plus the panel's entrance. Budgeted from where the last tween
       actually lands (toast-80 finishing at s+2.93). Watch this if a drag is ever added back:
       at 3.6 with two drags the SECOND one ran past the scene boundary into s15 and simply
       never played — no error, and the closing frame looked fine. */
    const s = label('s14', 3.0);
    toastOut(tl, '#toast-30', s + 0.1);
    tl.to('#page-myc', { y: POS.myc.s14, duration: 1.3, ease: 'power2.inOut' }, s);
    tl.fromTo('#panel-rerank', { autoAlpha: 0, x: 460 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, s + 0.35);
    gsap.set('#page-rerank', { autoAlpha: 1 });      /* `.page` starts hidden — see s13.1 */

    let at = s + 1.0;
    if (RR.ready) {
      RERANK_DRAGS.forEach(([from, to], i) => {
        const a = RR.rows[from - 1], b = RR.rows[to - 1];
        const dy = (to - from) * ROW_H;
        /* the handle is the drag affordance, so that is what the cursor takes hold of */
        const hb = a.handleBox;
        const tip = [RERANK_X + hb.left + hb.width / 2, RERANK_Y + hb.top + hb.height / 2];
        at = cursorTo(tl, beatOnTip(tip, { click: true }), at, i ? 0.5 : 0.55);
        const grab = at + 0.13;                       /* bottom of the press = the grab */
        /* lift the dragged row over its neighbour for the duration of the move */
        tl.set(a.li, { zIndex: 5, position: 'relative' }, grab);
        tl.to(a.li, { scale: 1.03, duration: 0.12, ease: 'power2.out' }, grab);
        /* the move: cursor and dragged row 1:1, the displaced row sliding the other way */
        tl.to('#cursor', { y: `+=${dy}`, duration: 0.5, ease: 'power2.inOut' }, grab + 0.1);
        tl.to(a.li, { y: dy, duration: 0.5, ease: 'power2.inOut' }, grab + 0.1);
        tl.to(b.li, { y: -dy, duration: 0.5, ease: 'power2.inOut' }, grab + 0.1);
        const drop = grab + 0.6;
        tl.to(a.li, { scale: 1, duration: 0.14, ease: 'power2.out' }, drop);
        /* renumber on the drop: the badges label POSITIONS, so they stay 1..10 top to bottom
           while the names move. Proxy-driven so a reverse scrub puts them back. */
        const sw = { v: 0 };
        const apply = () => {
          const done = sw.v > 0.5;
          a.badge.textContent = String(done ? to : from);
          b.badge.textContent = String(done ? from : to);
        };
        apply();
        tl.to(sw, { v: 1, duration: 0.06, ease: 'none', onUpdate: apply }, drop);
        at = drop + 0.25;
      });
    }
    toastIn(tl, '#toast-80', at + 0.05);
  }

  /* ── Scene 15: 5-for-5 quiz — panel enters on the START QUIZ click, then
     the quiz autoplays: Q1 → select → Q2 → select → 5/5 reveal → first badge.
     Frames are live captures from the reference app (see index.html). ── */
  {
    const s = label('s15', 4.6);
    toastOut(tl, '#toast-80', s + 0.1);
    tl.to('#panel-rerank', { autoAlpha: 0, x: 460, duration: 0.4, ease: 'power2.in' }, s);
    tl.to('#gray-panel', { autoAlpha: 0, duration: 0.35 }, s);
    tl.to('#page-myc', { y: POS.myc.s15, duration: 1.1, ease: 'power2.inOut' }, s + 0.1);
    cursorTo(tl, CUR.s15, s + 0.55, 0.6);           /* click lands ≈ s+1.2 */
    tl.set('#qf-1', { autoAlpha: 1 }, s + 1.3);
    tl.fromTo('#panel-quiz', { autoAlpha: 0, x: 520 },
      { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, s + 1.35);
    tl.to('#qf-2', { autoAlpha: 1, duration: 0.12 }, s + 2.35);  /* option A locks */
    tl.to('#qf-3', { autoAlpha: 1, duration: 0.18 }, s + 2.75);  /* Q2 */
    tl.to('#qf-4', { autoAlpha: 1, duration: 0.12 }, s + 3.35);  /* option A locks */
    tl.to('#qf-5', { autoAlpha: 1, duration: 0.25 }, s + 3.75);  /* Perfect. 5/5 */
    tl.fromTo('#qf-6', { autoAlpha: 0, scale: 0.94, transformOrigin: '50% 55%' },
      { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'back.out(1.4)' }, s + 4.15); /* first badge */
    toastIn(tl, '#toast-120', s + 4.25);
  }

  /* ── Scene 16: fandoms rail ── */
  {
    const s = label('s16', 1.6);
    toastOut(tl, '#toast-120', s + 0.1);
    tl.to('#panel-quiz', { autoAlpha: 0, x: 520, duration: 0.45, ease: 'power2.in' }, s);
    /* the rail is a card in this same page, so this is a scroll — the old crossfade between
       two strip exports was only ever standing in for one */
    tl.to('#page-myc', { y: POS.myc.s16, duration: 1.0, ease: 'power2.inOut' }, s + 0.2);
    cursorTo(tl, CUR.s16, s + 0.7, 0.6);
  }

  /* ── Scene 17: enter the Playboi Carti fandom (page push) ── */
  {
    const s = label('s17', 1.7);
    click(tl, s + 0.05);
    /* the push is now between two live pages. The fandom page carries its own (92px) nav, so
       the old nav image and its clip-path reveal are both gone. */
    tl.set('#page-fandom', { y: POS.fandom.s17, x: 460, autoAlpha: 1 }, s + 0.1);
    tl.to('#page-myc', { x: -230, autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, s + 0.15);
    tl.to('#page-fandom', { x: 0, duration: 0.7, ease: 'power2.inOut' }, s + 0.15);
    cursorTo(tl, CUR.s17, s + 0.85, 0.6);
  }

  /* ── Scene 18: fandom tab feed ── */
  {
    const s = label('s18', 1.4);
    tl.to('#page-fandom', { y: POS.fandom.s18, duration: 0.9, ease: 'power2.inOut' }, s);
    cursorTo(tl, CUR.s18, s + 0.5, 0.55);
  }

  /* ── Scene 19: UGC explodes around the phone ── */
  {
    const s = label('s19', 2.0);
    tl.to('#page-fandom', { y: POS.fandom.s19, duration: 1.1, ease: 'power2.inOut' }, s);
    /* [id, resting rotation (was baked into the old renders), extra spin during flight] */
    /* [id, resting rotation, extra spin during flight]. The two merch tiles rest at 0 because
       their rotation is baked into the art — see the styles.css note. */
    const sats = [['#sat-editorial', -5, -12], ['#sat-ugc', 10, 10], ['#sat-comment', -16, -10],
                  ['#sat-video', 16.5, 8], ['#sat-merch-left', 0, -11], ['#sat-merch-right', 0, 9]];
    sats.forEach(([id, base, spin], i) => {
      const el = $(id);
      const dx = 960 - (el.offsetLeft + el.offsetWidth / 2);
      const dy = 540 - (el.offsetTop + el.offsetHeight / 2);
      tl.fromTo(id, { autoAlpha: 0, x: dx * 0.75, y: dy * 0.75, scale: 0.45, rotation: base + spin },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: base, duration: 0.8, ease: 'power3.out' }, s + 0.5 + i * 0.1);
    });
    cursorTo(tl, CUR.s19, s + 0.7, 0.6);
  }

  /* ── Scene 20: cards recede, and Zack goes for the profile picture ──
     The cursor used to fade OUT here and get teleported back in during s22, after the I.D.
     card had already appeared — so the card arrived with nothing having caused it, and the
     cursor vanished for two whole scenes. It now stays on screen and travels to the poster's
     DP, and the press at the end of this scene is what s22 answers. ── */
  {
    const s = label('s20', 1.7);
    document.querySelectorAll('#sats img').forEach((el, i) => {
      const dx = 960 - (el.offsetLeft + el.offsetWidth / 2);
      const dy = 540 - (el.offsetTop + el.offsetHeight / 2);
      tl.to(el, { autoAlpha: 0, x: dx * 0.5, y: dy * 0.5, scale: 0.55, duration: 0.6, ease: 'power2.in' }, s + i * 0.06);
    });
    tl.to('#page-fandom', { y: POS.fandom.s20, duration: 1.1, ease: 'power2.inOut' }, s + 0.3);
    /* starts while the page is still settling and lands late in the scene, so the press sits
       right on the s20/s22 boundary — the card is 0.13 units behind it, not most of a scene */
    cursorTo(tl, CUR.s20, s + 1.0, 0.6);
  }

  /* ── Scene 22: the Complex I.D. surfaces ──
     This is the ANSWER to the s20 press on the DP, so the card leads: it opens 0.1 units in,
     just behind the press, and the stickers follow it rather than preceding it. The cursor
     is already here and already flipped (it never left the DP), so it just glides onto the
     card — the old `set` teleport + fade-in is gone, and with it the two-scene blackout. ── */
  {
    const s = label('s22', 2.1);
    tl.to('#screen-scrim', { autoAlpha: 1, duration: 0.35 }, s);
    /* Small-card state of the single clean card image — see the ID_SMALL_* block for where the
       numbers come from. x is carried as well as y because the expanded box (the video's frame 0)
       sits at centre x 945.75, not 960. */
    tl.fromTo('#id-card', { autoAlpha: 0, x: ID_SMALL_X, y: ID_SMALL_Y + 70, scale: ID_SMALL_SC * 0.82, transformOrigin: '50% 50%' },
      { autoAlpha: 1, x: ID_SMALL_X, y: ID_SMALL_Y, scale: ID_SMALL_SC, duration: 0.6, ease: 'back.out(1.3)' }, s + 0.1);
    /* ── the badges drop in and pile up (see BADGE_DROP) ──
       Starts as the card settles, not with it: two back-to-back entrances on top of each
       other is what the old in-place pop looked like. The falls pass BEHIND #id-card —
       it's a stage-level overlay, above the whole phone — which is why the cascade cannot
       start any earlier: the card is still swelling across the flight path. */
    const drop = s + 0.55;
    const dist = STICKERS.map(([, y, , h]) => y + h + BADGE_CEIL);
    const dMax = Math.max(...dist);
    const impacts = [];        /* [time relative to `drop`, jolt amplitude in px] */
    const land = {};           /* badge number → when it hits, relative to `drop` */
    document.querySelectorAll('#stickers img').forEach((el, i) => {
      const [mass, tumble, delay] = BADGE_DROP[i];
      const t0 = drop + delay;
      const fall = BADGE_FALL * Math.sqrt(dist[i] / dMax);   /* one g for all eight */
      /* squash on contact, mirrored in x so the badge conserves its area instead of just
         getting shorter. Deeper for heavier — this is impact force, not deformability */
      const sqY = 1 - 0.07 * mass, sqX = 1 + (1 - sqY) * 0.55;

      /* The `from` is deliberately VISIBLE, which the no-visible-from rule otherwise
         forbids: the ceiling is outside #screen's overflow:hidden + contain:strict box,
         so a pre-start render paints nothing. It has to be visible — fading a falling
         object in is the tell that it did not come from anywhere. */
      tl.fromTo(el, { autoAlpha: 1, y: -dist[i], rotation: tumble, scaleX: 1, scaleY: 1, transformOrigin: '50% 100%' },
        { y: 0, rotation: 0, duration: fall, ease: 'power2.in' }, t0);
      tl.to(el, { scaleX: sqX, scaleY: sqY, duration: BADGE_SQUASH, ease: 'power2.out' }, t0 + fall);
      tl.to(el, { scaleX: 1, scaleY: 1, duration: BADGE_SETTLE, ease: 'power2.out' }, t0 + fall + BADGE_SQUASH);

      if (mass >= SHAKE_FLOOR) impacts.push([delay + fall, (mass - 0.5) * SHAKE_AMP]);
      land[i + 1] = delay + fall;
    });

    /* audit the landing order against the paint order (see BADGE_OVERLAPS / BADGE_TUCK):
       silent while the three known tucks are the only ones, loud the moment a delay change
       buries a badge that used to land on top */
    const tucks = BADGE_OVERLAPS.filter(([bk, f]) => land[bk] > land[f]).map(([bk, f]) => `${bk}<${f}`);
    tucks.filter((k) => !BADGE_TUCK.has(k)).forEach((k) => {
      const [bk, f] = k.split('<');
      console.warn(`s22: badge ${bk} now lands after badge ${f} but paints behind it, so it will tuck UNDER a badge already resting. Either reorder BADGE_DROP or accept it in BADGE_TUCK.`);
    });

    /* the jolt: one proxy sweeping the cascade, offset summed from the impulses above */
    const phone = $('#phone');
    const shake = { t: 0 };
    const shakeSpan = Math.max(...impacts.map(([t]) => t)) + SHAKE_DUR;
    tl.to(shake, {
      t: shakeSpan, duration: shakeSpan, ease: 'none',
      onUpdate: () => {
        let dy = 0, dx = 0;
        impacts.forEach(([ti, amp], k) => {
          const u = (shake.t - ti) / SHAKE_DUR;
          if (u < 0 || u >= 1) return;                          /* exactly 0 outside the window */
          const d = Math.cos(u * Math.PI * SHAKE_BEATS) * (1 - u) * (1 - u);
          dy += amp * d;                                        /* +y = driven DOWN by the hit */
          dx += amp * d * (k % 2 ? 0.22 : -0.22);               /* alternating lateral grit */
        });
        gsap.set(phone, { y: dy, x: dx });
      },
    }, drop);
    /* Zack glides onto the small card and PRESSES it, and s21's expansion is the answer —
       the same cause→effect pairing as the s20 press on the DP. The press waits for the pile
       to finish (the last badge settles at ~+1.93) and lands on the s22/s21 boundary, so the
       card blows up as the finger lifts instead of most of a scene later. The card takes the
       press too: a 3% dip under the tip, which the expansion then releases. */
    cursorTo(tl, CUR.s22, s + 0.8, 0.5);
    tl.to('#id-card', { scale: ID_SMALL_SC * 0.97, duration: 0.08, ease: 'power2.in' }, s + 1.95);
    click(tl, s + 1.95);
  }

  /* ── Scene 21: the card blows up ──
     Single clean card image: pure scale+translate, no crossfade needed. Starts 0.05 in, which
     is the frame the s22 press finishes releasing on — see the press at the end of s22. */
  {
    const s = label('s21', 1.7);
    tl.to('#id-card', { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' }, s + 0.05);
    /* lands EXACTLY on the video's frame 0, which is where the frame-by-frame playback picks up */
    cursorTo(tl, CUR.s21, s + 0.7, 0.6);
  }

  /* ── Scene 23: the card gets encased ──
     **The blown-up I.D. does not go anywhere here — the MOCKUP does.** This used to fade
     `#id-card` out at +0 and pop a different card in at 55% scale, so the card the reader had
     just opened vanished and an unrelated object arrived in its place. Now the phone, the pile
     and the scrim dissolve away and leave the card sitting alone on black, exactly where the
     ending video's first frame has it — which is the whole point, because that is the card the
     video morphs (user's call).
     The case then closes AROUND it. `#gold-card` is positioned so its inner card registers on
     `#id-card`'s box (see styles.css / tools/make-gold-card.py), so this is one card gaining a
     case rather than two cards trading places, and it settles from 1.06 instead of crossfading
     dead-still: the two arts differ inside (500 PTS/Regular vs 5000 PTS/Gold, and the encased
     one carries the sticker cluster), and a motionless dissolve between two near-identical
     layouts is exactly what the END_XFADE note warns reads as a rendering fault. A little travel
     gives the eye something to follow instead.
     `#id-card` is then SET hidden, not faded — by that point the opaque inner card covers it
     completely, so it costs nothing and s24 cannot reveal it underneath. ── */
  {
    const s = label('s23', 2.0);
    tl.to(['#stickers img', '#screen-scrim'], { autoAlpha: 0, duration: 0.45 }, s);
    tl.to('#phone', { autoAlpha: 0, duration: 0.5 }, s + 0.15);
    tl.fromTo('#gold-card', { autoAlpha: 0, scale: 1.06, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.out' }, s + 0.35);
    tl.set('#id-card', { autoAlpha: 0 }, s + 1.25);   /* fully covered by then — invisible */
    cursorTo(tl, CUR.s23, s + 0.8, 0.6);
  }

  /* ── Scene 24: worn in the real world — the ending video, frame by frame ──
     The finale IS the closing I.D. video (see END_* at the top): the encased card glows, morphs
     onto a real person's chest and pulls back over the ComplexCon floor. The retired
     `#lanyard` still said the same thing in one frame; this says it as the reader scrolls out.
     The handover is a plain CROSSFADE at frame 0, and it is very nearly invisible, because the
     chain s21 → s23 → here is built to make it so: `#id-card`'s box was measured off this
     video's frame 0 (tools/make-id-card.py), and `#gold-card`'s case is fitted so its inner card
     lands on that same box (tools/make-gold-card.py). Verified by blending the s24+0 render
     against frame 0: the case, the clip, the photo, the rule, the barcode and the sticker
     cluster all coincide, and the ONLY ghosting is on the four lines whose text genuinely
     differs between the two revisions (500 PTS/Regular vs 5000 PTS/Gold, 60% vs 1%, 2023 vs
     2026). So nothing here moves the card, dips to black or pushes it past the frame to cover a
     seam — there is no seam to cover, and an earlier pass that did push it through black threw
     the registration away for nothing.
     What keeps the dissolve from reading dead-still — the objection the END_XFADE note raises,
     and the reason s23 settles from 1.06 — is that the sweep starts ON the crossfade rather
     than after it, so the video's own glow is already rising through the dissolve. That motion
     comes from the CONTENT, which is the only place it can come from: any transform on
     `#ending` would break the registration that makes this work. ── */
  {
    const s = label('s24', 2.95);
    tl.to('#cursor', { autoAlpha: 0, duration: 0.3 }, s);
    tl.fromTo('#ending', { autoAlpha: 0 }, { autoAlpha: 1, duration: END_XFADE, ease: 'power1.inOut' }, s + 0.45);
    tl.to('#gold-card', { autoAlpha: 0, duration: END_XFADE, ease: 'power1.inOut' }, s + 0.45);
    /* The frame sweep — 60 frames over END_SWEEP units, ~30px of scroll each. Starts on the
       crossfade (see above), so ~8 frames of glow build while the card is handing over. It ends
       0.25 units before the scene does and the `end` label holds after that, so the ComplexCon
       wide shot RESTS at the bottom of the page instead of landing on the last pixel of scroll. */
    const sheet = $('#ending-sheet');
    const end = { f: 0 };
    const frame = () => {
      const i = Math.max(0, Math.min(END_FRAMES - 1, Math.round(end.f)));
      gsap.set(sheet, { x: -(i % END_COLS) * END_CELL_W,
                        y: -Math.floor(i / END_COLS) * END_CELL_H });
    };
    frame();
    tl.to(end, { f: END_FRAMES - 1, duration: END_SWEEP, ease: 'none', onUpdate: frame }, s + 0.45);
  }

  label('end', 0.6);
  tl.to({}, { duration: 0.6 }, t - 0.6);
  return tl;
}

/* ═══════════════ Boot ═══════════════ */
(async function boot() {
  await buildDom();
  const pageSizes = await mountPages();
  window.__pages = Object.fromEntries(pageSizes.map((p) => [p.id, p]));
  await preload();
  /* must run before buildTimeline: it rewrites the CUR entries that aim inside a page */
  prepareChips();
  prepareArticle();
  prepareRerank();
  preparePoll();
  resolvePageTargets();
  resolveTrayTarget();

  /* symmetric tag: flipped, the tag's right edge keeps the normal 45px tip gap */
  const tagW = $('#cursor-tag').offsetWidth || 74;
  TAG_FLIP_X = (ARROW_W - TIP) - (TAG_X - TIP) - tagW - TAG_X;

  const tl = buildTimeline();
  const SCROLL_LEN = Math.round(tl.duration() * PX_PER_UNIT);
  const sizeTrack = () => { $('#scroll-track').style.height = SCROLL_LEN + innerHeight + 'px'; };
  sizeTrack();
  addEventListener('resize', () => { sizeTrack(); ScrollTrigger.refresh(); });

  /* Lenis smooth scroll → ScrollTrigger */
  const lenis = new Lenis({ lerp: REDUCED ? 1 : 0.09, wheelMultiplier: 1.0 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  ScrollTrigger.create({
    animation: tl,
    trigger: document.body,
    start: 0,
    end: () => SCROLL_LEN,
    scrub: true,
    invalidateOnRefresh: false,
  });

  /* ── Wall-clock gate for the s7 fling home (see AUTO) ──
     Registered AFTER the lenis ticker, so within a frame it runs after ScrollTrigger has
     rendered the master timeline: while the fling owns #page-latest, its value is the one
     that lands. The drag tween is complete by then and GSAP does not re-render completed
     tweens, so the two never fight over y — but the ordering makes that safe rather than
     lucky. Scrub back before the release and the strip and nav are handed straight back. */
  gsap.ticker.add(() => {
    if (tl.time() >= AUTO.release) {
      if (!AUTO.playing) { AUTO.playing = true; AUTO.tl.invalidate().restart(); }
      if (tl.time() >= AUTO.snap) AUTO.tl.progress(1);   /* reader is ahead of the inertia */
    } else if (AUTO.playing) {
      AUTO.playing = false;
      AUTO.tl.pause();
      gsap.set('#page-latest', { y: AUTO.from });
    }
  });

  window.__tl = tl;
  window.__scrollLen = SCROLL_LEN;
  window.__lenis = lenis;
  window.__auto = AUTO;
  window.__CUR = CUR;        /* resolved beats, for tools/scrub.py and the probes */

  /* HUD (?debug) */
  if (location.search.includes('debug')) {
    const hud = $('#hud');
    hud.classList.add('on');
    const labels = Object.entries(tl.labels).sort((a, b) => a[1] - b[1]);
    gsap.ticker.add(() => {
      const p = tl.progress();
      const cur = labels.filter(([, time]) => time <= tl.time()).pop();
      hud.textContent = `progress ${(p * 100).toFixed(1)}%\nscene    ${cur ? cur[0] : '-'}\nscroll   ${Math.round(lenis.scroll)} / ${SCROLL_LEN}`;
    });
  }

  /* Scroll hint fades on first movement */
  const hint = $('#scroll-hint');
  lenis.on('scroll', () => { if (lenis.scroll > 40) hint.style.opacity = 0; });

  /* Intro: reveal */
  $('#loader').classList.add('done');
  gsap.from('#phone', { y: 26, scale: 0.975, autoAlpha: 0, duration: 0.9, ease: 'power3.out', delay: 0.15 });
})();
