#!/usr/bin/env python3
"""Build a machine-readable inventory of every page in the 688-page build."""
import os as _os
ROOT = _os.environ.get("RCS_ROOT") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
CACHE = _os.path.join(ROOT, "scripts", "audit", ".cache")   # intermediates, gitignored
OUTDIR = _os.path.join(ROOT, "docs", "audit")                # finals, committed
NAME = _os.environ.get("RCS_AUDIT_NAME", "PAGE_AUDIT")
A = ROOT
B = _os.environ.get("RCS_COMPARE_ROOT") or ROOT
_os.makedirs(CACHE, exist_ok=True); _os.makedirs(OUTDIR, exist_ok=True)
import json, os, re, subprocess, sys

B = _os.environ.get("RCS_COMPARE_ROOT") or ROOT
PAGES = os.path.join(A, "client/src/pages")

app = open(os.path.join(A, "client/src/App.tsx"), encoding="utf8").read()

# component -> source module, from import statements in App.tsx
imports = {}
for m in re.finditer(r'import\s+(?:\{([^}]*)\}|(\w+))\s+from\s+"([^"]+)"', app):
    named, default, mod = m.groups()
    if default:
        imports[default] = mod
    if named:
        for n in named.split(","):
            n = n.strip().split(" as ")[-1].strip()
            if n:
                imports[n] = mod
# lazy(() => import("...")) — including the .then(m => ({default: m.X})) named form
for m in re.finditer(r'(?:const|let)\s+(\w+)\s*=\s*(?:React\.)?lazy\(\s*\(\)\s*=>\s*import\("([^"]+)"\)', app):
    imports[m.group(1)] = m.group(2)

# route path -> component
routes = {}          # component -> [paths]
# component={X}, component={gated(X, "...")}, component={wrap(X)} — take the
# first capitalised identifier inside the braces.
for m in re.finditer(r'<Route\s+path="([^"]+)"[^>]*?component=\{([^}]*)\}', app):
    path, expr = m.groups()
    for ident in re.findall(r'\b([A-Z]\w+)\b', expr):
        routes.setdefault(ident, []).append(path)
        break
# <Route path="x">{...<Comp .../>}</Route>  and gated(...) wrappers
for m in re.finditer(r'<Route\s+path="([^"]+)"[^>]*>(.{0,400}?)</Route>', app, re.S):
    path, body = m.groups()
    for c in re.findall(r'<(\w+)[\s/>]', body):
        if c[0].isupper():
            routes.setdefault(c, []).append(path)
    for c in re.findall(r'gated\(\s*(\w+)', body):
        routes.setdefault(c, []).append(path)

def modpath_to_file(mod):
    if mod.startswith("@/"):
        return os.path.join(A, "client/src", mod[2:])
    if mod.startswith("./") or mod.startswith("../"):
        return os.path.normpath(os.path.join(A, "client/src", mod))
    return None

comp_by_file = {}
for comp, mod in imports.items():
    f = modpath_to_file(mod)
    if f:
        comp_by_file.setdefault(f + ".tsx", []).append(comp)

# Pages present in the live build (dedupe signal)
live_pages = set()
for root, _, files in os.walk(os.path.join(B, "client/src/pages")):
    for fn in files:
        if fn.endswith(".tsx"):
            live_pages.add(os.path.relpath(os.path.join(root, fn),
                                           os.path.join(B, "client/src/pages")))

# Nav / home-page linkage: collect every internal href or navigate target
nav_sources = []
for root, _, files in os.walk(os.path.join(A, "client/src")):
    if "pages" in root.split(os.sep) and "portal" not in root:
        pass
    for fn in files:
        if fn.endswith((".tsx", ".ts")):
            nav_sources.append(os.path.join(root, fn))

linked_paths = {}
for f in nav_sources:
    try:
        t = open(f, encoding="utf8").read()
    except Exception:
        continue
    for m in re.finditer(r'(?:href|to|setLocation\(|navigate\()\s*=?\s*["\'](/[a-zA-Z0-9\-_/]*)["\']', t):
        linked_paths.setdefault(m.group(1), set()).add(os.path.relpath(f, A))

rows = []
for root, _, files in os.walk(PAGES):
    for fn in sorted(files):
        if not fn.endswith(".tsx"):
            continue
        full = os.path.join(root, fn)
        rel = os.path.relpath(full, PAGES)
        try:
            src = open(full, encoding="utf8").read()
        except Exception:
            src = ""
        loc = src.count("\n") + 1
        comps = comp_by_file.get(full, [])
        paths = []
        for c in comps:
            paths += routes.get(c, [])
        # fall back: component name == filename stem
        stem = fn[:-4]
        if not paths:
            paths += routes.get(stem, [])
        paths = sorted(set(paths))

        trpc = len(re.findall(r'trpc\.[\w.]+\.use(?:Query|Mutation)', src))
        fetches = len(re.findall(r'fetch\(\s*["\'`]/api/', src))
        # shared/ engines AND client-side lib engines both count as real modules
        engines = sorted(set(re.findall(r'from\s+"@shared/(\w+)"', src)
                             + re.findall(r'from\s+"@/lib/(\w+)"', src)))
        engines = [e for e in engines if e not in ("utils", "cn", "trpc", "queryClient")]
        charts = len(re.findall(r'<(?:LineChart|BarChart|AreaChart|PieChart|RadarChart|ComposedChart|ScatterChart|Recharts|ResponsiveContainer)', src))
        # shadcn components AND raw DOM controls — most pages use lowercase <input>
        inputs = (len(re.findall(r'<(?:Input|Slider|Select|Textarea|Checkbox|RadioGroup|Switch)\b', src))
                  + len(re.findall(r'<(?:input|select|textarea)\b', src)))
        buttons = len(re.findall(r'<[Bb]utton\b', src))
        tables = len(re.findall(r'<(?:Table|TableBody|table|tbody)\b', src))
        tabs = len(re.findall(r'<Tabs\b', src))
        # computation density: real math in the component
        state = len(re.findall(r'useState[<(]', src))
        math_calls = len(re.findall(r'\bMath\.\w+', src))
        memo = len(re.findall(r'\buseMemo\(', src))
        pdf = 1 if re.search(r'jsPDF|html2canvas|window\.print|generatePdf|exportPdf', src, re.I) else 0
        ai = 1 if re.search(r'aiBrain|AIBrain|useAI|askAI|/api/ai|openai|anthropic', src, re.I) else 0
        motion = len(re.findall(r'framer-motion|motion\.|animate-', src))
        words = len(re.findall(r'[A-Za-z]{3,}', re.sub(r'<[^>]+>', ' ', src)))

        is_linked = any(p in linked_paths for p in paths)
        rows.append({
            "file": rel,
            "dir": os.path.dirname(rel) or ".",
            "component": stem,
            "routes": paths,
            "routed": bool(paths),
            "linked": is_linked,
            "loc": loc,
            "trpc": trpc,
            "fetch": fetches,
            "engines": engines,
            "charts": charts,
            "inputs": inputs,
            "buttons": buttons,
            "tables": tables,
            "tabs": tabs,
            "pdf": pdf,
            "ai": ai,
            "state": state,
            "math": math_calls,
            "memo": memo,
            "motion": motion,
            "words": words,
            "in_live": rel in live_pages,
        })

out = _os.path.join(CACHE, "pages.json")
json.dump(rows, open(out, "w"), indent=1)
print(f"pages: {len(rows)}")
print(f"routed: {sum(1 for r in rows if r['routed'])}   unrouted: {sum(1 for r in rows if not r['routed'])}")
print(f"linked from somewhere: {sum(1 for r in rows if r['linked'])}")
print(f"already in live build: {sum(1 for r in rows if r['in_live'])}")
print(f"with tRPC/api: {sum(1 for r in rows if r['trpc'] or r['fetch'])}")
print(f"with shared engines: {sum(1 for r in rows if r['engines'])}")
print(f"with charts: {sum(1 for r in rows if r['charts'])}")
print(f"median LOC: {sorted(r['loc'] for r in rows)[len(rows)//2]}")
print(f"total LOC: {sum(r['loc'] for r in rows):,}")
