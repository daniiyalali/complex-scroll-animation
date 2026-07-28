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

/* Feed strip resting offsets (strip translateY inside the screen), from Figma */
const POS = {
  latest: { s1: 159, s4: -4969, s5: -7476 },
  myc:    { s7: 159, s8: -167, s9: -1061, s12: -3765, s13: -7694, s14: -3765, s15: -6118 },
  rail:   { s16: -1497 },
  fandom: { s17: 95, s18: -639, s19: -1823, s20: -3660 },
};

/* Cursor beats: arrow top-left in stage px (+flip = tag sits left of arrow) */
const CUR = {
  s2:  { x: 1386, y: 576 },
  s3:  { x: 1155, y: 665, click: true },
  s4:  { x: 1179, y: 606, click: true },
  s6:  { x: 730,  y: 525, flip: true },   /* tip lands on the story's heart icon */
  s6b: { x: 576,  y: 469 },               /* drifts onto the tray (Scene 06 frame) */
  s7:  { x: 1162, y: 196, click: true },
  s8:  { x: 1065, y: 954, click: true },
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
  for (const key of ['strip-latest', 'strip-myc', 'strip-rail', 'strip-fandom']) {
    const holder = $('#' + key);
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

/* ── Preload & decode every image ── */
function preload() {
  const imgs = [...document.images];
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
     (exactly where a mirror would put it) — reads as turning on a path, no 3D flip */
  tl.to('#cursor-arrow', { rotation: beat.flip ? 90 : 0, duration: 0.3, ease: 'power2.inOut' }, at + dur * 0.3);
  tl.to('#cursor-tag', { x: beat.flip ? TAG_FLIP_X : 0, duration: 0.3, ease: 'power2.inOut' }, at + dur * 0.3);
  if (beat.click) click(tl, at + dur + 0.05);
  return at + dur;
}
function click(tl, at) {
  /* quick 10% press; scales the inner wrapper so it can't clobber the arrow's turn */
  tl.to('#cursor-inner', { scale: 0.9, duration: 0.08, ease: 'power2.in' }, at)
    .to('#cursor-inner', { scale: 1, duration: 0.12, ease: 'power2.out' }, at + 0.08);
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
  gsap.set('#strip-latest', { y: POS.latest.s1, autoAlpha: 1 });
  gsap.set('#nav-latest', { autoAlpha: 1 });
  gsap.set('#cursor', { x: 2050, y: 600, autoAlpha: 0 });

  /* ── Scene 1: hero hold ── */
  label('s1', 1.0);

  /* ── Scene 2: Zack arrives ── */
  {
    const s = label('s2', 0.9);
    tl.to('#cursor', { autoAlpha: 1, duration: 0.2 }, s);
    cursorTo(tl, CUR.s2, s, 0.7);
  }

  /* ── Scene 3: points at the hero story ── */
  {
    const s = label('s3', 0.9);
    cursorTo(tl, CUR.s3, s, 0.6);
  }

  /* ── Scene 4: scroll to Suggested channels, follow ── */
  {
    const s = label('s4', 2.4);
    tl.to('#nav-latest', { y: -170, duration: 0.4, ease: 'power2.in' }, s);
    tl.to('#strip-latest', { y: POS.latest.s4, duration: 2.0, ease: 'power2.inOut' }, s);
    cursorTo(tl, CUR.s4, s + 1.5, 0.6);
  }

  /* ── Scene 5: REACT/COMMENT/BOOKMARK/FOLLOW callouts + the hover pass ──
     Zack touches all four stops inside HOVER_PASS units (≈1.5s at the reference
     read pace). Each stop swaps that callout to its Figma hover face (Scenes
     5.1–5.3) and drops it again as he leaves; FOLLOW is a press, so its
     FOLLOWING face stays on into scene 6. ── */
  {
    const s = label('s5', 2.7);
    tl.to('#strip-latest', { y: POS.latest.s5, duration: 1.4, ease: 'power2.inOut' }, s);
    HOV.forEach(({ sel }, i) => {
      tl.fromTo(sel, { autoAlpha: 0, x: -36 }, { autoAlpha: 1, x: 0, duration: 0.4, ease: 'power3.out' }, s + 0.5 + i * 0.12);
    });

    const step = HOVER_PASS / 4;
    const p0 = s + 1.45;                    /* tip reaches REACT once the feed has settled */
    /* one long approach from the s4 position so the pass itself stays tight */
    tl.to('#cursor', { x: HOV[0].x, y: HOV[0].y, duration: 0.55, ease: 'power3.inOut' }, p0 - 0.55);
    HOV.forEach((beat, i) => {
      const arrive = p0 + i * step;
      if (i) tl.to('#cursor', { x: beat.x, y: beat.y, duration: step * 0.6, ease: 'power2.inOut' }, arrive - step * 0.6);
      /* crossfade, both ways — the hover chip is translucent, so the idle face
         has to leave or its lighter label ghosts through the bold one.
         FOLLOW is a press, not a hover: it snaps on the click and stays. */
      const on = beat.hold ? arrive + step * 0.10 : arrive - step * 0.11;
      const onDur = step * (beat.hold ? 0.14 : 0.33);
      tl.to(beat.sel + ' .act',  { autoAlpha: 1, duration: onDur }, on);
      tl.to(beat.sel + ' .idle', { autoAlpha: 0, duration: onDur }, on);
      if (beat.hold) { click(tl, arrive + step * 0.04); return; }
      const off = arrive + step * 0.5, offDur = step * 0.35;
      tl.to(beat.sel + ' .act',  { autoAlpha: 0, duration: offDur }, off);
      tl.to(beat.sel + ' .idle', { autoAlpha: 1, duration: offDur }, off);
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

  /* ── Scene 7: switch to MY COMPLEX ── */
  {
    const s = label('s7', 1.7);
    tl.to('#picker', { autoAlpha: 0, duration: 0.3 }, s);
    tl.to('#emoji-grid .wall-cell', { autoAlpha: 0, y: -26, duration: 0.3, stagger: 0.015 }, s);
    cursorTo(tl, CUR.s7, s + 0.15, 0.55);
    /* nav returns with MY COMPLEX active (solid slide — no alpha ghosting), feed swaps */
    tl.set('#nav-myc', { y: -170, autoAlpha: 1 }, s);
    tl.to('#nav-myc', { y: 0, duration: 0.4, ease: 'power3.out' }, s + 0.95);
    tl.set('#nav-latest', { autoAlpha: 0 }, s + 0.95);
    tl.set('#strip-myc', { y: POS.myc.s7 }, s + 0.9);
    tl.to('#strip-latest', { autoAlpha: 0, duration: 0.35 }, s + 0.95);
    tl.fromTo('#strip-myc', { autoAlpha: 0, y: POS.myc.s7 + 40 },
      { autoAlpha: 1, y: POS.myc.s7, duration: 0.45, ease: 'power2.out' }, s + 1.0);
  }

  /* ── Scene 8: pick topics, continue ── */
  {
    const s = label('s8', 1.7);
    tl.to('#strip-myc', { y: POS.myc.s8, duration: 0.9, ease: 'power2.inOut' }, s);
    cursorTo(tl, CUR.s8, s + 0.7, 0.6);
  }

  /* ── Scene 9: story page, like + save ── */
  {
    const s = label('s9', 1.5);
    tl.to('#strip-myc', { y: POS.myc.s9, duration: 1.0, ease: 'power2.inOut' }, s);
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
    tl.to('#strip-myc', { y: POS.myc.s12, duration: 1.1, ease: 'power2.inOut' }, s + 0.15);
    cursorTo(tl, CUR.s12, s + 0.75, 0.55);
    toastIn(tl, '#toast-20', s + 1.45);
  }

  /* ── Scene 13: list vote, whoosh down the feed ── */
  {
    const s = label('s13', 2.0);
    toastOut(tl, '#toast-20', s + 0.1);
    tl.to('#strip-myc', { y: POS.myc.s13, duration: 1.5, ease: 'power2.inOut' }, s);
    toastIn(tl, '#toast-30', s + 1.0);
    tl.fromTo('#gray-panel', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, s + 1.1);
    cursorTo(tl, CUR.s13, s + 0.9, 0.7);
  }

  /* ── Scene 14: rerank editor ── */
  {
    const s = label('s14', 1.8);
    toastOut(tl, '#toast-30', s + 0.1);
    tl.to('#strip-myc', { y: POS.myc.s14, duration: 1.3, ease: 'power2.inOut' }, s);
    tl.fromTo('#panel-rerank', { autoAlpha: 0, x: 460 }, { autoAlpha: 1, x: 0, duration: 0.7, ease: 'power3.out' }, s + 0.35);
    toastIn(tl, '#toast-80', s + 1.05);
    const end = cursorTo(tl, CUR.s14, s + 0.55, 0.6);
    tl.to('#cursor', { y: '+=34', duration: 0.25, ease: 'power2.inOut' }, end + 0.1)
      .to('#cursor', { y: '-=34', duration: 0.25, ease: 'power2.inOut' }, end + 0.4);
  }

  /* ── Scene 15: 5-for-5 quiz — panel enters on the START QUIZ click, then
     the quiz autoplays: Q1 → select → Q2 → select → 5/5 reveal → first badge.
     Frames are live captures from the reference app (see index.html). ── */
  {
    const s = label('s15', 4.6);
    toastOut(tl, '#toast-80', s + 0.1);
    tl.to('#panel-rerank', { autoAlpha: 0, x: 460, duration: 0.4, ease: 'power2.in' }, s);
    tl.to('#gray-panel', { autoAlpha: 0, duration: 0.35 }, s);
    tl.to('#strip-myc', { y: POS.myc.s15, duration: 1.1, ease: 'power2.inOut' }, s + 0.1);
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
    tl.set('#strip-rail', { y: POS.rail.s16 + 130 }, s);
    tl.to('#strip-myc', { autoAlpha: 0, duration: 0.5 }, s + 0.3);
    tl.fromTo('#strip-rail', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, s + 0.35);
    tl.to('#strip-rail', { y: POS.rail.s16, duration: 0.9, ease: 'power2.out' }, s + 0.35);
    cursorTo(tl, CUR.s16, s + 0.7, 0.6);
  }

  /* ── Scene 17: enter the Playboi Carti fandom (page push) ── */
  {
    const s = label('s17', 1.7);
    click(tl, s + 0.05);
    tl.set('#strip-fandom', { y: POS.fandom.s17, x: 460, autoAlpha: 1 }, s + 0.1);
    tl.set('#nav-fandom', { clipPath: 'inset(0px 0px 64px 0px)' }, s);
    tl.to('#strip-rail', { x: -230, autoAlpha: 0, duration: 0.7, ease: 'power2.inOut' }, s + 0.15);
    tl.to('#strip-fandom', { x: 0, duration: 0.7, ease: 'power2.inOut' }, s + 0.15);
    /* incoming nav fades in fully on top first, then the old one is dropped */
    tl.to('#nav-fandom', { autoAlpha: 1, duration: 0.25 }, s + 0.35);
    tl.set('#nav-myc', { autoAlpha: 0 }, s + 0.62);
    cursorTo(tl, CUR.s17, s + 0.85, 0.6);
  }

  /* ── Scene 18: fandom tab feed ── */
  {
    const s = label('s18', 1.4);
    tl.to('#strip-fandom', { y: POS.fandom.s18, duration: 0.9, ease: 'power2.inOut' }, s);
    tl.to('#nav-fandom', { clipPath: 'inset(0px 0px 0px 0px)', duration: 0.3 }, s + 0.35);
    cursorTo(tl, CUR.s18, s + 0.5, 0.55);
  }

  /* ── Scene 19: UGC explodes around the phone ── */
  {
    const s = label('s19', 2.0);
    tl.to('#strip-fandom', { y: POS.fandom.s19, duration: 1.1, ease: 'power2.inOut' }, s);
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
    tl.to('#strip-fandom', { y: POS.fandom.s20, duration: 1.1, ease: 'power2.inOut' }, s + 0.3);
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
  await preload();

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

  window.__tl = tl;
  window.__scrollLen = SCROLL_LEN;
  window.__lenis = lenis;

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
