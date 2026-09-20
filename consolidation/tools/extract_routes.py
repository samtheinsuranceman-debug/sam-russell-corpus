#!/usr/bin/env python3
"""Route inventory that understands both SPA <Route path> and Next.js file routing."""
import re, sys, pathlib, json
root = pathlib.Path(sys.argv[1]).resolve()
SKIP = ('node_modules', '.git', 'dist', 'build', '.next')
def ok(p): return not any(s in p.parts for s in SKIP)

routes = {}
# 1. SPA declarations
pat = re.compile(r'<Route\s[^>]*path=(?:"([^"]+)"|\{`([^`]+)`\}|\'([^\']+)\')', re.S)
compre = re.compile(r'component=\{?([A-Za-z0-9_]+)')
for f in root.rglob('*.tsx'):
    if not ok(f) or f.name not in ('App.tsx','routes.tsx','Router.tsx','AppRoutes.tsx'): continue
    s = f.read_text(errors='ignore')
    for m in pat.finditer(s):
        p = m.group(1) or m.group(2) or m.group(3)
        c = compre.search(s[m.start():m.start()+400])
        routes.setdefault(p, {'route':p,'component':c.group(1) if c else None,
                              'decl':str(f.relative_to(root)),'kind':'spa'})
# 2. Next.js app-router / pages-router
for f in root.rglob('page.tsx'):
    if not ok(f): continue
    rel = f.relative_to(root)
    parts = list(rel.parts)
    if 'app' not in parts: continue
    i = parts.index('app')
    segs = [s for s in parts[i+1:-1] if not (s.startswith('(') and s.endswith(')'))]
    p = '/' + '/'.join(segs)
    routes.setdefault(p, {'route':p,'component':None,'decl':str(rel),'kind':'next-app'})
json.dump(sorted(routes.values(), key=lambda r: r['route']), sys.stdout)
