"""Scrub harness: jump the master timeline to a list of times/labels and shoot each frame."""
import sys, json, pathlib
from playwright.sync_api import sync_playwright

OUT = pathlib.Path("shots")   # relative to where you run it
OUT.mkdir(exist_ok=True)

# each entry: (name, label or None, offset in timeline units)
SPEC = json.loads(sys.argv[1]) if len(sys.argv) > 1 else [["s5", "s5", 0]]

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1920, "height": 1080}, device_scale_factor=1)
    errs = []
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.goto("http://localhost:8321/?debug", wait_until="load")
    pg.wait_for_function("() => window.__tl && window.__scrollLen", timeout=30000)
    pg.wait_for_timeout(1500)

    for name, label, off in SPEC:
        pg.evaluate(
            """([label, off]) => {
                const tl = window.__tl;
                const t = (label ? tl.labels[label] : 0) + off;
                const px = (t / tl.duration()) * window.__scrollLen;
                window.__lenis.scrollTo(px, { immediate: true });
                window.scrollTo(0, px);
                tl.time(t);
                tl.pause();
                return t;
            }""",
            [label, off],
        )
        pg.wait_for_timeout(180)
        pg.screenshot(path=str(OUT / f"{name}.png"))
        print("shot", name, label, off)

    print("CONSOLE ERRORS:", errs if errs else "none")
    b.close()
