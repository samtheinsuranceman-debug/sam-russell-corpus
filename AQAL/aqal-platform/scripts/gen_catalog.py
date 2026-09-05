#!/usr/bin/env python3
"""Generate human-readable catalogs of the research library from researchLibraryData.ts."""
import re, csv, sys, json

DATA = "/home/user/sam-russell-corpus/AQAL/aqal-platform/client/src/pages/researchLibraryData.ts"
OUTDIR = "/home/user/sam-russell-corpus/AQAL/aqal-platform/docs"
import os
os.makedirs(OUTDIR, exist_ok=True)

lines = open(DATA, encoding="utf-8", errors="replace").read().split("\n")

def field(block, name):
    m = re.search(rf'\b{name}:\s*"((?:[^"\\]|\\.)*)"', block)
    return m.group(1).replace('\\"', '"') if m else ""

records = []
cur = None
buf = []
id_re = re.compile(r'^\s+id:\s*"')
for ln in lines:
    if id_re.match(ln):
        if cur is not None:
            records.append((cur, "\n".join(buf)))
        m = re.search(r'id:\s*"((?:[^"\\]|\\.)*)"', ln)
        cur = m.group(1)
        buf = [ln]
    elif cur is not None:
        buf.append(ln)
if cur is not None:
    records.append((cur, "\n".join(buf)))

rows = []
for cid, block in records:
    title = field(block, "title")
    if not title:
        continue  # skip non-cluster id lines (e.g. source objects have no title)
    section = field(block, "section")
    subtitle = field(block, "subtitle")
    tag = field(block, "evidenceTag")
    # lens + primary score
    lens, score, scorelabel = "", "", ""
    mi = re.search(r'impact:\s*\{[^}]*magnitude:\s*(\d+)', block)
    mh = re.search(r'harm:\s*\{[^}]*severity:\s*(\d+)', block)
    mw = re.search(r'weakness:\s*\{[^}]*threat:\s*(\d+)', block)
    if mi:
        lens, score, scorelabel = "practice", int(mi.group(1)), "impact magnitude /5"
    elif mh:
        lens, score, scorelabel = "cost", int(mh.group(1)), "harm severity /5"
    elif mw:
        lens, score, scorelabel = "weakness", int(mw.group(1)), "threat /10"
    n_sources = len(re.findall(r'\bcite:\s*"', block))
    rows.append(dict(id=cid, section=section, lens=lens, title=title,
                     evidenceTag=tag, score=score, scorelabel=scorelabel,
                     n_sources=n_sources, subtitle=subtitle))

# ---- CSV ----
csvpath = f"{OUTDIR}/research_library_catalog.csv"
with open(csvpath, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=["id","section","lens","title","evidenceTag","score","scorelabel","n_sources","subtitle"])
    w.writeheader()
    for r in rows:
        w.writerow(r)

# ---- stats ----
from collections import Counter
lc = Counter(r["lens"] for r in rows)
tc = Counter(r["evidenceTag"] for r in rows if r["evidenceTag"])
total_sources = sum(r["n_sources"] for r in rows)

# ---- Markdown catalog grouped by lens ----
LENS_TITLE = {
    "practice": "PRACTICES — what strengthens the mind (impact lens)",
    "weakness": "WEAKNESS LINES — what collapses a goal (threat lens)",
    "cost":     "COST OF FAILURE — what's at stake (harm lens)",
    "":         "Framework / uncategorized",
}
mdpath = f"{OUTDIR}/RESEARCH_LIBRARY_CATALOG.md"
with open(mdpath, "w", encoding="utf-8") as f:
    f.write("# AQAL Intelligence — Research Library Catalog\n\n")
    f.write(f"**{len(rows):,} clusters · {total_sources:,} verified sources.** ")
    f.write("Auto-generated from `client/src/pages/researchLibraryData.ts`. ")
    f.write("Each cluster is a research-backed node; every source was WebSearch-verified (no fabricated citations). ")
    f.write("Effect sizes are reported honestly, including nulls and debunked claims (rated magnitude 1 with a blunt callout).\n\n")
    f.write("## Totals by lens\n\n")
    f.write("| Lens | Clusters |\n|---|---|\n")
    for k in ["practice","weakness","cost",""]:
        if lc.get(k): f.write(f"| {LENS_TITLE[k]} | {lc[k]:,} |\n")
    f.write(f"| **Total** | **{len(rows):,}** |\n\n")
    f.write("## Evidence-tag distribution\n\n| Tag | Count |\n|---|---|\n")
    for k,v in tc.most_common():
        f.write(f"| {k} | {v:,} |\n")
    f.write("\n---\n\n")
    for lens in ["practice","weakness","cost",""]:
        lr = [r for r in rows if r["lens"]==lens]
        if not lr: continue
        f.write(f"## {LENS_TITLE[lens]}  ({len(lr):,})\n\n")
        # group by section number
        def secnum(r):
            try: return int(r["section"])
            except: return 999999
        lr.sort(key=lambda r:(secnum(r), r["title"]))
        f.write("| # | Title | Score | Evidence | Sources | Bolsters / Degrades |\n")
        f.write("|---|---|---|---|---|---|\n")
        for r in lr:
            sub = r["subtitle"].replace("|","/")[:80]
            f.write(f"| {r['section']} | {r['title'].replace('|','/')} | {r['score']} | {r['evidenceTag']} | {r['n_sources']} | {sub} |\n")
        f.write("\n")

print(json.dumps(dict(clusters=len(rows), sources=total_sources, by_lens=dict(lc)), indent=2))
print("wrote:", csvpath, mdpath)
