#!/usr/bin/env python3
"""Is `pages/` still the All Hands build, or has the source moved on?

`pages/` is GENERATED from a sibling folder that is not in this repo
(`../10. My Complex All Hands`), and that folder is edited continuously while the prototype
is being reviewed. The imported page is deliberately not a copy — asset references are
rewritten to .webp, the font is repointed, a banner is prepended — so you cannot answer
"is the prototype current?" by diffing the two, and until 2026-07-30 nobody could answer it
at all. It was got wrong twice in one afternoon, in both directions: finished work was
reported as missing, and an import was believed current when the source had moved on eight
minutes later. Both cost a review cycle.

So `make-page-assets.py` now records the SHA-256 of every source page it read into
`pages/.import-stamp.json`, and this compares that against the sources as they are now.

    python3 tools/check-pages-sync.py          # report; exit 1 if stale
    python3 tools/check-pages-sync.py --quiet  # print only when something is wrong

Exit codes: 0 in sync · 1 stale (re-run the importer) · 2 cannot tell (no stamp, or the
source folder is missing — e.g. a fresh clone, where `pages/` is committed on purpose).

A hash rather than a timestamp, deliberately: the source is saved constantly and most saves
change bytes without changing anything the prototype renders, but an mtime moves on every
save including a no-op. A check that cries wolf gets ignored, and an ignored check is worse
than no check.
"""
import hashlib
import json
import pathlib
import sys

PROJECT = pathlib.Path(__file__).resolve().parent.parent
SRC = PROJECT.parent / "10. My Complex All Hands"
STAMP = PROJECT / "pages" / ".import-stamp.json"
QUIET = "--quiet" in sys.argv


def say(*a):
    if not QUIET:
        print(*a)


def main():
    if not SRC.exists():
        say(f"· source folder not present ({SRC.name}) — nothing to compare.")
        say("  Expected on a fresh clone: pages/ is committed precisely so the prototype "
            "runs without it.")
        return 2
    if not STAMP.exists():
        print(f"! no {STAMP.relative_to(PROJECT)} — cannot tell whether pages/ is current.")
        print("  Run: python3 tools/make-page-assets.py")
        return 2

    stamp = json.loads(STAMP.read_text(encoding="utf-8"))
    recorded = stamp.get("pages", {})
    drift, missing, added = [], [], []

    for name, info in sorted(recorded.items()):
        src = SRC / f"{name}.html"
        if not src.exists():
            missing.append(name)
            continue
        b = src.read_bytes()
        now = hashlib.sha256(b).hexdigest()
        if now != info["sha256"]:
            drift.append((name, info["bytes"], len(b)))

    # A page that exists in the source but is NOT imported is the most dangerous kind of stale,
    # because nothing else surfaces it: on 2026-07-30 the All Hands build gained `pdp.html` and
    # the prototype went on serving a `product.html` authored from this side for an hour and a
    # half, with every check green — they were both "in sync", just not the same page.
    # So this reports EVERY source page that is not imported, not only the ones already known to
    # the importer. IGNORE is for source files that are deliberately not pages.
    # `all-scenes` is the combined build, not a page. `product` is the PDP authored from this
    # side while the design did not exist yet — superseded by the All Hands build's own
    # `pdp.html` on 2026-07-30. It is left in the source folder (not ours to delete) but is
    # deliberately not imported; drop it from here if it is ever removed or revived.
    IGNORE = {"all-scenes", "product"}
    for src in sorted(SRC.glob("*.html")):
        if src.stem not in recorded and src.stem not in IGNORE:
            added.append(src.stem)

    if not (drift or missing or added):
        say(f"✓ pages/ is in sync with {SRC.name} ({len(recorded)} pages).")
        return 0

    print(f"! pages/ is STALE against {SRC.name}:")
    for name, was, now in drift:
        print(f"    {name}.html changed since import  ({was:,} -> {now:,} bytes)")
    for name in missing:
        print(f"    {name}.html no longer in the source folder")
    for name in added:
        known = name in _known_pages()
        print(f"    {name}.html exists in the source but is NOT imported"
              + ("" if known else "  — and is not in make-page-assets.py's PAGES, so it never will be"))
    print("\n  Fix:  python3 tools/make-page-assets.py")
    print("  Then: python3 tools/derive-page-offsets.py   "
          "# ONLY the offsets are geometry-sensitive — re-solve them if any section moved")
    return 1


def _known_pages():
    """The pages the importer knows about, read from its own PAGES table."""
    t = (PROJECT / "tools" / "make-page-assets.py").read_text(encoding="utf-8")
    block = t.split("PAGES = {", 1)[1].split("}", 1)[0]
    return {ln.split('"')[1] for ln in block.splitlines() if ln.strip().startswith('"')}


if __name__ == "__main__":
    sys.exit(main())
