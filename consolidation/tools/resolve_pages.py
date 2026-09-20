#!/usr/bin/env python3
"""route -> component -> source file -> sha256, for one SPA repo."""
import re, sys, json, pathlib, hashlib
root = pathlib.Path(sys.argv[1]).resolve(); app = root/'client/src/App.tsx'
s = app.read_text(errors='ignore')
# component -> import path (lazy or static)
imp = {}
for m in re.finditer(r'const\s+([A-Za-z0-9_]+)\s*=\s*lazy\(\s*\(\)\s*=>\s*import\(\s*["\']([^"\']+)["\']', s):
    imp[m.group(1)] = m.group(2)
for m in re.finditer(r'^import\s+([A-Za-z0-9_]+)\s+from\s+["\']([^"\']+)["\']', s, re.M):
    imp.setdefault(m.group(1), m.group(2))
def resolve(spec):
    if spec.startswith('@/'): base = root/'client/src'/spec[2:]
    elif spec.startswith('.'): base = (app.parent/spec).resolve()
    else: return None
    for ext in ('.tsx','.ts','/index.tsx','/index.ts'):
        p = pathlib.Path(str(base)+ext)
        if p.exists(): return p
    return p if base.exists() else None
pat = re.compile(r'<Route\s[^>]*path=(?:"([^"]+)"|\{`([^`]+)`\})', re.S)
out = {}
for m in pat.finditer(s):
    p = m.group(1) or m.group(2)
    c = re.search(r'component=\{?(?:gated\()?([A-Za-z0-9_]+)', s[m.start():m.start()+400])
    comp = c.group(1) if c else None
    f = resolve(imp[comp]) if comp and comp in imp else None
    rec = {'component': comp, 'file': str(f.relative_to(root)) if f else None,
           'sha': hashlib.sha256(f.read_bytes()).hexdigest()[:16] if f else None,
           'lines': len(f.read_text(errors='ignore').splitlines()) if f else 0}
    out.setdefault(p, rec)
json.dump(out, sys.stdout)
