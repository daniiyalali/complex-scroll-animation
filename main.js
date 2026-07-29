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
  s9:  { x: 829,  y: 904, flip: true, click: true },
  s10: { x: 1507, y: 929, click: true },
  s12: { x: 776,  y: 516, flip: true, click: true },
  s13: { x: 348,  y: 390, flip: true },
  s14: { x: 1601, y: 611 },
  s15: { x: 787,  y: 809, flip: true, click: true },
  s16: { x: 1012, y: 650 },
  s17: { x: 1160, y: 762, click: true },
  s18: { x: 1188, y: 707, click: true },
  s19: { x: 1160, y: 886 },
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

/* Shadow-free exports; positions align each badge's content center with the
   old shadowed renders (verified: badges 3 & 7 land on identical coords) */
const STICKERS = [
  [-8.5, 688.8, 241.5, 104.5], [50, 555.5, 129.5, 130.5], [242, 775, 99, 94], [133.2, 779, 128.5, 130],
  [19.2, 768.8, 92, 168.5], [310.8, 632.8, 98, 205], [261, 860, 115, 81], [177.5, 540, 145, 159.5],
];
/* s6 reaction wall — one animated 800×800 image (`react-wall.webp`, a 4×5 grid of
   20 looping reactions) shown through 20 clipping cells so each can be staggered in
   on its own. Cells tile the image exactly, so at rest the composite is pixel-
   identical to the whole frame — an emoji that overflows its cell (the
   jack-in-the-box, the NO sign) simply lands in the neighbour cell it belongs to.
   Source cells are 200×160; on stage the wall is 596×596, so 149 × 119.2. */
const WALL_COLS = 4, WALL_ROWS = 5;
const WALL_W = 596, WALL_CELL_W = WALL_W / WALL_COLS, WALL_CELL_H = WALL_W / WALL_ROWS;

/* Small-card resting state of #id-card (see scenes 22/21) */
const ID_SMALL_SC = 422 / 1000;
const ID_SMALL_Y = -63;

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
    img.src = `assets/sticker-${i + 1}.webp?v=2`;
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
  /* the MY COMPLEX tab, clicked at the end of the s7 fling home (page parked at the top).
     Measured centre (1066.6, 190.8) — the same point the retired nav export gave, which is
     a useful independent check that page and export are the same design. */
  s7: {
    page: 'page-latest', at: () => POS.latest.s1,
    find: (d) => [...d.querySelectorAll('*')].find(
      (e) => !e.children.length && (e.textContent || '').trim().toUpperCase() === 'MY COMPLEX'),
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
  /* Scene length is trimmed to just past the fling's landing (it settles at s+1.84), so
     s5 picks the scroll straight back up — there used to be 0.56 units / 448 px of dead
     scroll here, which read as having to nudge the wheel to get anything to happen.
     The `power3.out` fling is 96% done by s+1.34, so the article list is still legible
     for ~0.5 units before s5 moves on; the trim costs no readability. */
  {
    const s = label('s4', 1.9);
    const DRAG = CUR.s3b.y - CUR.s4.y;                /* 466 px of upstroke, feed 1:1 */
    const dragTo = POS.latest.s1 - DRAG;
    /* the whip — short and accelerating, so the release is its fastest moment */
    tl.to('#cursor',       { x: CUR.s4.x, y: CUR.s4.y, duration: 0.28, ease: 'power2.in' }, s + 0.06);
    tl.to('#page-latest', { y: dragTo,                duration: 0.28, ease: 'power2.in' }, s + 0.06);
    /* release: the feed flies on alone to the article list, cursor peels off and un-tilts */
    tl.to('#page-latest', { y: POS.latest.s4, duration: 1.5, ease: 'power3.out' }, s + 0.34);
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
    tl.to('#page-latest', { y: POS.latest.s5, duration: 1.4, ease: 'power2.inOut' }, s);
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

  /* ── Scene 10: comments drawer, post ── */
  {
    const s = label('s10', 1.6);
    tl.to('#screen-scrim', { autoAlpha: 1, duration: 0.35 }, s);
    tl.fromTo('#drawer', { autoAlpha: 1, y: 1100 }, { y: 0, duration: 0.75, ease: 'power3.out' }, s + 0.1);
    cursorTo(tl, CUR.s10, s + 0.75, 0.55);
  }

  /* ── Scene 11: +100 XP ── */
  {
    const s = label('s11', 1.4);
    tl.to('#drawer', { y: 1100, autoAlpha: 0, duration: 0.45, ease: 'power2.in' }, s);
    tl.fromTo('#xp-modal', { autoAlpha: 0, scale: 0.5, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, s + 0.45);
    tl.to('#cursor', { x: CUR.s21.x - 60, y: CUR.s10.y - 60, duration: 0.8, ease: 'power2.inOut' }, s + 0.2);
  }

  /* ── Scene 12: poll + first toast ── */
  {
    const s = label('s12', 1.8);
    tl.to('#xp-modal', { autoAlpha: 0, scale: 0.85, duration: 0.3 }, s);
    tl.to('#screen-scrim', { autoAlpha: 0, duration: 0.3 }, s);
    tl.to('#page-myc', { y: POS.myc.s12, duration: 1.1, ease: 'power2.inOut' }, s + 0.15);
    cursorTo(tl, CUR.s12, s + 0.75, 0.55);
    toastIn(tl, '#toast-20', s + 1.45);
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
    const sats = [['#sat-editorial', -5, -12], ['#sat-ugc', 10, 10], ['#sat-comment', -16, -10], ['#sat-video', 16.5, 8]];
    sats.forEach(([id, base, spin], i) => {
      const el = $(id);
      const dx = 960 - (el.offsetLeft + el.offsetWidth / 2);
      const dy = 540 - (el.offsetTop + el.offsetHeight / 2);
      tl.fromTo(id, { autoAlpha: 0, x: dx * 0.75, y: dy * 0.75, scale: 0.45, rotation: base + spin },
        { autoAlpha: 1, x: 0, y: 0, scale: 1, rotation: base, duration: 0.8, ease: 'power3.out' }, s + 0.5 + i * 0.1);
    });
    cursorTo(tl, CUR.s19, s + 0.7, 0.6);
  }

  /* ── Scene 20: cards recede ── */
  {
    const s = label('s20', 1.7);
    document.querySelectorAll('#sats img').forEach((el, i) => {
      const dx = 960 - (el.offsetLeft + el.offsetWidth / 2);
      const dy = 540 - (el.offsetTop + el.offsetHeight / 2);
      tl.to(el, { autoAlpha: 0, x: dx * 0.5, y: dy * 0.5, scale: 0.55, duration: 0.6, ease: 'power2.in' }, s + i * 0.06);
    });
    tl.to('#page-fandom', { y: POS.fandom.s20, duration: 1.1, ease: 'power2.inOut' }, s + 0.3);
    tl.to('#cursor', { autoAlpha: 0, duration: 0.3 }, s + 0.9);
  }

  /* ── Scene 22: the Complex I.D. surfaces ── */
  {
    const s = label('s22', 1.7);
    tl.to('#screen-scrim', { autoAlpha: 1, duration: 0.4 }, s);
    document.querySelectorAll('#stickers img').forEach((el, i) => {
      tl.fromTo(el, { autoAlpha: 0, scale: 0.3, rotation: i % 2 ? 14 : -12, transformOrigin: '50% 50%' },
        { autoAlpha: 1, scale: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.7)' }, s + 0.25 + i * 0.08);
    });
    /* Small-card state of the single clean card image: element box is the large
       card (460,260) 1000x561; small card bb (749,359) 422x237 -> scale .422,
       center shift (960,540.5) -> (960,477.5) = y -63 */
    tl.fromTo('#id-card', { autoAlpha: 0, y: ID_SMALL_Y + 70, scale: ID_SMALL_SC * 0.82, transformOrigin: '50% 50%' },
      { autoAlpha: 1, y: ID_SMALL_Y, scale: ID_SMALL_SC, duration: 0.6, ease: 'back.out(1.3)' }, s + 0.55);
    tl.set('#cursor', { x: CUR.s22.x + 160, y: CUR.s22.y + 60 }, s + 0.6);
    tl.set('#cursor-arrow', { rotation: 90 }, s + 0.6);
    tl.set('#cursor-tag', { x: TAG_FLIP_X }, s + 0.6);
    tl.to('#cursor', { autoAlpha: 1, x: CUR.s22.x, y: CUR.s22.y, duration: 0.5, ease: 'power2.out' }, s + 0.75);
  }

  /* ── Scene 21: card expands ──
     Single clean card image: pure scale+translate, no crossfade needed */
  {
    const s = label('s21', 1.7);
    tl.to('#id-card', { y: 0, scale: 1, duration: 0.8, ease: 'power3.inOut' }, s + 0.1);
    cursorTo(tl, CUR.s21, s + 0.7, 0.6);
  }

  /* ── Scene 23: the gold card ── */
  {
    const s = label('s23', 2.0);
    tl.to(['#id-card', '#stickers img', '#screen-scrim'], { autoAlpha: 0, duration: 0.45 }, s);
    tl.to('#phone', { autoAlpha: 0, duration: 0.5 }, s + 0.15);
    tl.fromTo('#gold-card', { autoAlpha: 0, scale: 0.55, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.9, ease: 'power2.inOut' }, s + 0.35);
    cursorTo(tl, CUR.s23, s + 0.8, 0.6);
  }

  /* ── Scene 24: worn in the real world ── */
  {
    const s = label('s24', 2.4);
    tl.to('#cursor', { autoAlpha: 0, duration: 0.3 }, s);
    tl.to('#gold-card', { scale: 1.16, duration: 1.0, ease: 'power2.in' }, s + 0.2)
      .to('#gold-card', { autoAlpha: 0, duration: 0.55, ease: 'power1.in' }, s + 0.55);
    tl.fromTo('#lanyard', { autoAlpha: 0, scale: 1.08, transformOrigin: '50% 42%' },
      { autoAlpha: 1, scale: 1, duration: 1.35, ease: 'power2.out' }, s + 0.85);
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
  resolvePageTargets();

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
