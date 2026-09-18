#!/usr/bin/env python3
"""Per-page integrity scan: does this page's math actually work?"""
import json, os, re

import os as _os
A = _os.environ.get("RCS_ROOT") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
PAGES = os.path.join(A, "client/src/pages")
SCRATCH = os.path.dirname(os.path.abspath(__file__))

JS_GLOBALS = set("""Math Date JSON Number String Boolean Array Object window document
console localStorage sessionStorage navigator location fetch URL URLSearchParams
Intl Promise Set Map parseInt parseFloat isNaN isFinite undefined null true false
React require process globalThis performance crypto""".split())

out = {}
for root, _, files in os.walk(PAGES):
    for fn in sorted(files):
        if not fn.endswith(".tsx"):
            continue
        full = os.path.join(root, fn)
        rel = os.path.relpath(full, PAGES)
        src = open(full, encoding="utf8").read()

        flags = []

        # 1. Type checking suppressed
        if re.search(r"^\s*//\s*@ts-nocheck", src, re.M):
            flags.append("ts-nocheck")

        # 2. Frozen derived data: useMemo(() => {...}, []) whose value is charted.
        frozen = []
        for m in re.finditer(
                r"const\s+(\w+)\s*=\s*useMemo\(\s*\(\)\s*=>\s*\{.*?\n\s*\}\s*,\s*\[\s*\]\s*\)",
                src, re.S):
            name = m.group(1)
            body = m.group(0)
            # only a problem if the body reads state/props, or it is fed to a chart
            charted = re.search(rf"(?:data|dataset)=\{{\s*{re.escape(name)}\b", src)
            if charted:
                frozen.append(name)
        if frozen:
            flags.append(f"frozen-chart:{','.join(frozen[:3])}")

        # 3. Identifiers referenced but never declared anywhere in the file.
        declared = set(re.findall(r"\b(?:const|let|var|function|class)\s+(\w+)", src))
        declared |= set(re.findall(r"\bimport\s+(\w+)\s+from", src))
        for m in re.finditer(r"import\s*\{([^}]*)\}\s*from", src):
            for n in m.group(1).split(","):
                n = n.strip().split(" as ")[-1].strip()
                if n:
                    declared.add(n)
        # destructured locals and params
        declared |= set(re.findall(r"\{\s*([\w,\s:]+)\}\s*=", src)) and declared
        for m in re.finditer(r"(?:const|let)\s*\{([^}]*)\}\s*=", src):
            for n in re.findall(r"(\w+)", m.group(1)):
                declared.add(n)
        for m in re.finditer(r"(?:const|let)\s*\[([^\]]*)\]\s*=", src):
            for n in re.findall(r"(\w+)", m.group(1)):
                declared.add(n)
        for m in re.finditer(r"\(([^)]*)\)\s*=>", src):
            for n in re.findall(r"(\w+)", m.group(1)):
                declared.add(n)
        for m in re.finditer(r"function\s*\w*\s*\(([^)]*)\)", src):
            for n in re.findall(r"(\w+)", m.group(1)):
                declared.add(n)

        # the explicit copy-paste tell
        guarded = re.findall(r"typeof\s+(\w+)\s*!==\s*['\"]undefined['\"]", src)
        undeclared_guarded = [g for g in guarded
                              if g not in declared and g not in JS_GLOBALS]
        if undeclared_guarded:
            flags.append(f"undeclared-var:{','.join(sorted(set(undeclared_guarded))[:3])}")

        # 4. Fabricated constants presented as authority
        assumptions = re.findall(r"//\s*(?:Simplified|Assume[sd]?|Placeholder|Dummy|Approx)[^\n]{0,70}", src)
        if assumptions:
            flags.append(f"fabricated-constant:{len(assumptions)}")

        # 5. Baked-in product outperformance (a suitability/compliance problem)
        perf = re.findall(r"[\w.]*[Rr]ate\s*\+\s*0\.0\d+[^\n]{0,60}", src)
        perf = [p for p in perf if re.search(r"iul|tax.?free|advantage|better|outperf", p, re.I)]
        if perf:
            flags.append("baked-outperformance")

        # 6. Charts fed a literal array rather than computed data
        if re.search(r"(?:data)=\{\s*\[\s*\{", src):
            flags.append("literal-chart-data")

        if flags:
            out[rel] = flags

json.dump(out, open(os.path.join(SCRATCH, "integrity.json"), "w"), indent=1)

import collections
c = collections.Counter()
for rel, fl in out.items():
    for f in fl:
        c[f.split(":")[0]] += 1
total = sum(1 for _, _, fs in os.walk(PAGES) for f in fs if f.endswith(".tsx"))
print(f"pages with at least one integrity flag: {len(out)} / {total}")
for k, v in c.most_common():
    print(f"  {v:4d}  {k}")
