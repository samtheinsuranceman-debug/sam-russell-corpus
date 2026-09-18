#!/usr/bin/env python3
"""Render the 688-page audit into a markdown report + an AI-brain page registry."""
import json, os, collections, csv, shutil

SCRATCH = os.path.dirname(os.path.abspath(__file__))
REPO = A
OUT = os.path.join(REPO, "docs", "audit")
os.makedirs(OUT, exist_ok=True)

scored = json.load(open(os.path.join(SCRATCH, "scored.json")))
shutil.copy(os.path.join(SCRATCH, "audit.csv"), os.path.join(OUT, "PAGE_AUDIT_688.csv"))

HUB_ORDER = ["debt","policy","re","retire","tax","estate","business","insure","invest",
             "scenario","risk","discover","ai","client","practice","compliance","report",
             "education","engage","ops","public","misc"]
by_hub = collections.defaultdict(list)
for r in scored:
    by_hub[r["hub"]].append(r)
for k in by_hub:
    by_hub[k].sort(key=lambda r: (-r["value"], -r["loc"]))

def band(v):
    return ("9-10" if v >= 9 else "8" if v >= 8 else "7" if v >= 7 else
            "5-6" if v >= 5 else "3-4" if v >= 3.5 else "1-3")

# ── Markdown report ─────────────────────────────────────────────────────────
L = []
w = L.append
w("# Russell Capital Systems — 688-Page Audit\n")
w("Generated from static analysis of every page in `client/src/pages`, cross-checked")
w("against the deployed build. Every number below is measured, not estimated.\n")

tot = len(scored)
w("## Scoreboard\n")
w("| Band | Pages | Share |")
w("|---|---:|---:|")
b = collections.Counter(band(r["value"]) for r in scored)
for k in ["9-10","8","7","5-6","3-4","1-3"]:
    w(f"| {k} | {b[k]} | {b[k]/tot*100:.1f}% |")
w("")
w(f"- **Mean value today: {sum(r['value'] for r in scored)/tot:.2f} / 10**")
w(f"- **Mean value as built (before integrity penalties): {sum(r['built'] for r in scored)/tot:.2f} / 10**")
w(f"- **Mean effectiveness (value × discoverability): {sum(r['effectiveness'] for r in scored)/tot:.2f} / 10**")
w(f"- Pages with a URL: {sum(1 for r in scored if r['routed'])} — of which **{sum(1 for r in scored if r['routed'] and not r['linked'])} are linked from nowhere**")
w(f"- Pages with no route at all (dead files): {sum(1 for r in scored if not r['routed'])}")
w(f"- Pages already present in the deployed build: {sum(1 for r in scored if r['in_live'])}")
w("")

w("## Integrity findings\n")
w("These are the reason the mean score is low. They are defects, not missing features.\n")
flagc = collections.Counter()
for r in scored:
    for f in r["integrity_flags"]:
        flagc[f] += 1
LABEL = {
 "ts-nocheck": "`@ts-nocheck` — type checking disabled on the file",
 "fabricated-constant": "Invented constants marked *Simplified/Assumed* standing in for real IRS or product limits",
 "literal-chart-data": "Chart fed a hard-coded array — the picture is decorative, not computed",
 "undeclared-var": "**Reads a variable that is never declared** — output silently falls back to a fixed number and ignores user input",
 "frozen-chart": "**Chart memo has empty dependencies** — the graph never moves when inputs change",
 "baked-outperformance": "**Hard-codes a product performance advantage** — a suitability exposure",
}
w("| Pages | Defect |")
w("|---:|---|")
for k, v in flagc.most_common():
    w(f"| {v} | {LABEL.get(k,k)} |")
w("")
w("### Worked example — `portal/MegaBackdoorRothCalc.tsx`\n")
w("```ts")
w("const maxContribution = 20000;                  // 'Simplified IRS limit' — not the real §415(c) limit")
w("const afterTaxContribution = annualIncome*0.10; // 'Assume 10% of income' — fabricated, not a user input")
w("const futureValueIUL = effectiveContribution *")
w("  Math.pow(1 + growthRate + 0.02, years);       // bakes in a 2% IUL advantage")
w("")
w("const startVal = typeof portfolioValue !== 'undefined'")
w("  ? portfolioValue : 1000000;                   // portfolioValue is NEVER declared in this file")
w("...")
w("}, []);                                         // empty deps — this chart never updates")
w("```")
w("`AMTCalculator.tsx:50` and `Budget503020Calc.tsx:43` carry the identical defect with")
w("`primaryIncome` (always $250,000) and `annualIncome` (always $300,000). `@ts-nocheck`")
w("is what allows these to compile.\n")

w("## Disposition summary\n")
w("| Action | Pages | Meaning |")
w("|---|---:|---|")
DISPMEAN = {
 "PROMOTE — hub / top nav": "Becomes a destination in primary navigation.",
 "EMBED — named tab": "Keeps its URL; appears as a labelled tab inside its hub.",
 "EMBED — accordion section": "Keeps its URL; appears as an expandable section inside its hub.",
 "EMBED — reference card": "Keeps its URL; appears as a linked card in the hub's reference rail.",
 "MERGE into canonical version": "Duplicate version — fold into the canonical page and delete.",
 "FIX FIRST — defective output": "Produces wrong numbers today. Repair before it is surfaced anywhere.",
 "UPGRADE or fold into library": "Too thin to stand alone. Either invest to 9/10 or fold into the reference library.",
}
for k, v in collections.Counter(r["disposition"] for r in scored).most_common():
    w(f"| {k} | {v} | {DISPMEAN.get(k,'')} |")
w("")

w("## The 21 hubs\n")
w("Every one of the 688 pages keeps its URL. Only these 21 earn a navigation entry.\n")
w("| Hub | Destination | Pages | Mean value | Best page |")
w("|---|---|---:|---:|---|")
for k in HUB_ORDER:
    g = by_hub.get(k)
    if not g: continue
    mv = sum(r["value"] for r in g)/len(g)
    w(f"| {g[0]['hub_name']} | `{g[0]['hub_path']}` | {len(g)} | {mv:.1f} | {g[0]['component']} ({g[0]['value']}) |")
w("")

# ── Per-page detail ─────────────────────────────────────────────────────────
w("---\n")
w("# Page-by-page\n")
w("`V` = value today (after integrity penalties). `B` = value as built. `E` = effectiveness")
w("(value × discoverability). Every page below keeps its URL.\n")

for k in HUB_ORDER:
    g = by_hub.get(k)
    if not g: continue
    w(f"\n## {g[0]['hub_name']}  ·  `{g[0]['hub_path']}`  ·  {len(g)} pages\n")
    w("| V | B | E | Page | URL | Action | Why / what it needs |")
    w("|---:|---:|---:|---|---|---|---|")
    for r in g:
        why = r["gaps"][0] if r["gaps"] else "sound — depth, live data, computed output"
        fix = r["upgrade"][0] if r["upgrade"] else "—"
        note = f"{why}. **Fix:** {fix}" if r["value"] < 9 else why
        url = f"`{r['route']}`" if r["route"] else "*(no route)*"
        tgt = f" → `{r['target']}`" if r["disposition"].startswith(("EMBED","MERGE")) else ""
        w(f"| {r['value']} | {r['built']} | {r['effectiveness']} | {r['component']} | {url} | {r['disposition']}{tgt} | {note} |")

open(os.path.join(OUT, "PAGE_AUDIT_688.md"), "w").write("\n".join(L))

# ── AI-brain page registry ──────────────────────────────────────────────────
registry = []
for r in scored:
    if not r["route"]:
        continue
    registry.append({
        "route": r["route"],
        "title": r["component"],
        "hub": r["hub"],
        "hubPath": r["hub_path"],
        "value": r["value"],
        "surface": r["disposition"],
        "capabilities": {
            "computes": bool(r["engines"]) or r["math"] >= 15,
            "engines": r["engines"],
            "persists": (r["trpc"] + r["fetch"]) > 0,
            "charts": r["charts"],
            "exportsPdf": bool(r["pdf"]),
        },
        "trustworthy": not any(f in r["integrity_flags"]
                               for f in ("undeclared-var", "frozen-chart", "baked-outperformance")),
        "integrityFlags": r["integrity_flags"],
    })
registry.sort(key=lambda x: -x["value"])
json.dump({"generated": "static-analysis", "count": len(registry), "pages": registry},
          open(os.path.join(OUT, "pageRegistry.json"), "w"), indent=1)

print(f"wrote {OUT}/PAGE_AUDIT_688.md  ({len(L)} lines)")
print(f"wrote {OUT}/PAGE_AUDIT_688.csv")
print(f"wrote {OUT}/pageRegistry.json  ({len(registry)} routed pages)")
print(f"  of which trustworthy today: {sum(1 for x in registry if x['trustworthy'])}")
