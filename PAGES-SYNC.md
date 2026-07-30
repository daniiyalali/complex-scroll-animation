# Keeping `pages/` in sync with the All Hands build

**Run this at the start of every session, before judging anything on screen:**

```bash
python3 tools/check-pages-sync.py
```

`✓ in sync` — carry on. `! STALE` — re-import before you look at the prototype, or you are
reviewing an old product page. Six pages as of 2026-07-30; `product.html` is s19.2's PDP.

---

## Why this exists

`pages/` is **generated**, from a folder that is not in this repo and is edited continuously
while the prototype is being reviewed:

```
../10. My Complex All Hands/{home-editorial,home-feed,article,rerank,fandom,product}.html
      │
      │  tools/make-page-assets.py   (resize rasters to 2x on-stage size, re-encode to WebP,
      ▼                               rewrite refs, repoint the font, prepend a banner)
pages/*.html + pages/assets/
```

Because the import rewrites the markup, **`pages/` can never be diffed against the source**,
so "is the prototype current?" used to be unanswerable except by eye. On 2026-07-30 it was
answered wrong twice in one afternoon, in both directions:

- finished work was reported as missing (it was a **browser cache**, not a stale import — see
  `tools/serve.py`, which is why the dev server now sends `no-store`);
- an import was believed current when the source had been saved again **eight minutes later**.

Both cost a review cycle. The fix is that the importer now writes
`pages/.import-stamp.json` — the SHA-256 of every source page it read — and the checker
compares that against the sources as they are now.

**A hash, not a timestamp.** The source is saved constantly and most saves change bytes
without changing anything the prototype renders. An mtime moves on every save including a
no-op, and a check that cries wolf gets ignored — which is worse than no check.

## The three places it runs

| when | what | on failure |
|---|---|---|
| **session start** | you (or the agent) run `check-pages-sync.py` — CLAUDE.md says so in Run | re-import before reviewing |
| **before a push** | `.githooks/pre-push` runs it automatically | prints the drift and **asks** y/N |
| **after any source edit** | re-run the importer | — |

The pre-push hook **asks rather than blocks**. The source folder is local-only and edited
constantly, so there are legitimate reasons to ship a known-behind import — a mid-edit source,
a deliberate snapshot. It fails safe: no terminal to ask on means no push.

It is installed with:

```bash
git config core.hooksPath .githooks      # already set locally; re-run after a fresh clone
```

Hooks are **not** carried by `git clone`, and `core.hooksPath` is local config — so on a fresh
clone this must be re-run or the guard silently does nothing. That is the one failure mode to
know about. `git push --no-verify` skips it deliberately.

## Re-importing

```bash
python3 tools/make-page-assets.py          # rebuild pages/ + re-stamp
python3 tools/derive-page-offsets.py       # ONLY if the page GEOMETRY moved — see below
```

**Content changes are free; geometry changes are not.** `POS.fandom` and friends are scroll
offsets into a live page, and nothing in Figma gives you them. A revision that only swaps copy
or photos leaves every offset valid — verified twice on 2026-07-30, where the page went
57,148 → 65,917 bytes with its document height unchanged at 7307 css px and every section in
the same place. But a revision that **adds or resizes a section moves everything below it**,
silently: the shop-grid section landed mid-feed and put s20 2,512 px out, framing an ad instead
of the post whose profile picture the cursor clicks.

So after re-importing, check the document height and section positions. If they moved, re-run
`derive-page-offsets.py` and paste its answers into `POS` in `main.js`.

## Reading the prototype itself

Use `python3 tools/serve.py`, **not** `python3 -m http.server`. `index.html` loads `main.js`
and `styles.css` with no `?v=`, and the stdlib server's `Last-Modified`/304 handling lets a
long-lived tab keep the previous build straight through a hard refresh — iframes especially,
since a reload need not revalidate a frame's document.

Quickest check that a tab is current: the **`scroll x / N` denominator** in the `?debug` HUD.
`N` is the timeline length, so it changes whenever any scene span does.
