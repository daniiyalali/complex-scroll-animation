#!/usr/bin/env python3
"""Deploy this folder to Vercel through the REST API.

There is no node toolchain on this machine, so `vercel` / `npx vercel` are not
available — this does the same job with stdlib HTTP:

  1. walk the project, honouring .vercelignore  (1.1 GB dir -> ~10 MB of runtime files)
  2. POST each file to /v2/files, addressed by its sha1
  3. POST /v13/deployments referencing those shas
  4. poll until the deployment is READY and print the URL

Usage (token is read from the environment and never written anywhere):

  VERCEL_TOKEN=... python3 tools/deploy-vercel.py [--preview] [--team <slug-or-id>]

Defaults to a production deploy of the project named by PROJECT below. Re-running
deploys to the same project, so this is the redeploy path too.
"""
import fnmatch
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

PROJECT = "complex-scroll-animation"
API = "https://api.vercel.com"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TOKEN = os.environ.get("VERCEL_TOKEN", "").strip()
if not TOKEN:
    sys.exit("VERCEL_TOKEN is not set")

args = sys.argv[1:]
TARGET = "preview" if "--preview" in args else "production"
TEAM = None
if "--team" in args:
    TEAM = args[args.index("--team") + 1]

# vercel.json must ship (its headers are read from the deployment); .vercelignore
# is only for the CLI/drag-drop paths, so it is not uploaded.
NEVER_UPLOAD = {".vercelignore"}

# Belt and braces: .vercelignore also lists these, but this walk is literal and a
# missing rule here would mean publishing the git store. Never rely on the ignore
# file alone for the repo itself.
NEVER_WALK = {".git", "node_modules"}


def ignore_patterns():
    path = os.path.join(ROOT, ".vercelignore")
    with open(path) as fh:
        return [l.strip() for l in fh if l.strip() and not l.startswith("#")]


def is_ignored(rel, pats):
    for p in pats:
        if p.endswith("/") and (rel.startswith(p) or fnmatch.fnmatch(rel, p.rstrip("/"))):
            return True
        if fnmatch.fnmatch(rel, p) or fnmatch.fnmatch(rel, p + "/*"):
            return True
        if p.startswith("**/") and fnmatch.fnmatch(os.path.basename(rel), p[3:]):
            return True
    return False


def collect():
    pats = ignore_patterns()
    out = []
    for base, dirs, files in os.walk(ROOT):
        rel_base = os.path.relpath(base, ROOT).replace(os.sep, "/")
        prefix = "" if rel_base == "." else rel_base + "/"
        dirs[:] = [d for d in dirs
                   if d not in NEVER_WALK and not is_ignored(prefix + d + "/", pats)]
        for f in files:
            rel = prefix + f
            if rel in NEVER_UPLOAD or is_ignored(rel, pats):
                continue
            out.append(rel)
    return sorted(out)


def call(method, path, body=None, ctype="application/json", extra=None):
    url = API + path
    if TEAM:
        url += ("&" if "?" in url else "?") + urllib.parse.urlencode({"teamId": TEAM})
    headers = {"Authorization": "Bearer " + TOKEN}
    if body is not None:
        headers["Content-Type"] = ctype
    headers.update(extra or {})
    data = body if isinstance(body, bytes) else (json.dumps(body).encode() if body else None)
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            raw = r.read()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        detail = e.read().decode(errors="replace")
        raise SystemExit(f"{method} {path} -> HTTP {e.code}\n{detail}")


who = call("GET", "/v2/user")["user"]
print(f"authenticated as {who.get('username') or who.get('email')}"
      + (f"  (team {TEAM})" if TEAM else "  (personal scope)"))

files = collect()
manifest, total = [], 0
for rel in files:
    blob = open(os.path.join(ROOT, rel), "rb").read()
    sha = hashlib.sha1(blob).hexdigest()
    manifest.append({"file": rel, "sha": sha, "size": len(blob)})
    total += len(blob)
print(f"{len(manifest)} files, {total / 1024 / 1024:.2f} MB")

for i, entry in enumerate(manifest, 1):
    blob = open(os.path.join(ROOT, entry["file"]), "rb").read()
    call("POST", "/v2/files", body=blob, ctype="application/octet-stream",
         extra={"x-vercel-digest": entry["sha"], "Content-Length": str(len(blob))})
    print(f"  [{i}/{len(manifest)}] {entry['file']}")

dep = call("POST", "/v13/deployments", body={
    "name": PROJECT,
    "files": manifest,
    "target": TARGET,
    "projectSettings": {
        "framework": None,
        "buildCommand": None,
        "installCommand": None,
        "devCommand": None,
        "outputDirectory": None,
    },
})
dep_id, url = dep["id"], dep.get("url")
print(f"created {dep_id} ({TARGET}) -> https://{url}")

deadline = time.time() + 300
while time.time() < deadline:
    st = call("GET", f"/v13/deployments/{dep_id}")
    state = st.get("readyState") or st.get("status")
    if state in ("READY", "ERROR", "CANCELED"):
        print("state:", state)
        if state != "READY":
            raise SystemExit(json.dumps(st.get("errorMessage") or st, indent=1)[:2000])
        aliases = st.get("alias") or []
        print("\nlive at:")
        for a in [url] + aliases:
            print("  https://" + a)
        break
    time.sleep(3)
else:
    raise SystemExit("timed out waiting for READY — check the Vercel dashboard")
