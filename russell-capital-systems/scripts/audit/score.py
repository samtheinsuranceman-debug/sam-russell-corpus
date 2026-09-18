#!/usr/bin/env python3
"""Score, categorise and assign a disposition to every page in the 688 build."""
import os as _os
ROOT = _os.environ.get("RCS_ROOT") or _os.path.abspath(_os.path.join(_os.path.dirname(__file__), "..", ".."))
CACHE = _os.path.join(ROOT, "scripts", "audit", ".cache")   # intermediates, gitignored
OUTDIR = _os.path.join(ROOT, "docs", "audit")                # finals, committed
NAME = _os.environ.get("RCS_AUDIT_NAME", "PAGE_AUDIT")
A = ROOT
B = _os.environ.get("RCS_COMPARE_ROOT") or ROOT
_os.makedirs(CACHE, exist_ok=True); _os.makedirs(OUTDIR, exist_ok=True)
import json, re, csv, collections, os

SCRATCH = CACHE
rows = json.load(open(os.path.join(SCRATCH, "pages.json")))
INTEG = json.load(open(os.path.join(SCRATCH, "integrity.json")))

# Integrity penalties. A page whose numbers are wrong is worth less than a page
# that shows nothing — it is worse, because it is confidently wrong in front of
# a client. These are capped deductions, not multipliers.
PENALTY = {
    "undeclared-var":      (2.5, "reads a variable that is never declared — the output is a hard-coded fallback that ignores user input"),
    "frozen-chart":        (1.5, "chart memo has empty deps — the graph never changes when inputs change"),
    "literal-chart-data":  (1.0, "chart is fed a literal array — the picture is decorative, not computed"),
    "fabricated-constant": (1.2, "carries invented constants marked Simplified/Assumed in place of real limits"),
    "baked-outperformance":(3.0, "hard-codes a product outperformance assumption — a suitability exposure"),
    "ts-nocheck":          (0.4, "type checking disabled on the file"),
}

def integrity_for(rel):
    flags = INTEG.get(rel, [])
    hits, notes, total = [], [], 0.0
    for f in flags:
        key = f.split(":")[0]
        if key in PENALTY:
            pts, why = PENALTY[key]
            total += pts
            hits.append(key)
            notes.append(why)
    return min(total, 5.0), hits, notes

# ── Hubs: the destinations that survive as real navigation ──────────────────
HUBS = [
 ("debt",      "Mortgage & Debt Elimination",        "/portal/mortgage-killer",
  r"mortgage|debt|heloc|refinanc|amortiz|payoff|\bloan|lien|foreclos|escrow|piti|recycl|velocity.?bank"),
 ("policy",    "IUL & Policy Engineering",           "/portal/time-machine-calculator",
  r"\biul\b|time.?machine|indexed.?universal|policy|premium|cash.?value|ag49|illustration|lapse|cost.?of.?insurance|\bcoi\b|surrender|1035|whole.?life|\bvul\b|par.?loan|participating"),
 ("re",        "Real Estate Intelligence",           "/portal/real-estate-mogul",
  r"real.?estate|rental|propert|landlord|syndicat|depreciat|1031|cap.?rate|\bdscr\b|brrrr|airbnb|\bstr\b|\breit\b|mogul|tenant|appraisal|house.?hack"),
 ("retire",    "Retirement Income & Drawdown",       "/portal/ecological-drivers",
  r"retire|drawdown|withdraw|\brmd\b|social.?security|pension|income.?for.?life|longevity|sequence|decumul|safe.?withdrawal|ecolog|income.?gap|income.?timeline|hot.?income"),
 ("tax",       "Tax Strategy",                       "/portal/tax-command",
  r"\btax|roth|conversion|niit|\bamt\b|\bqbi\b|deduct|bracket|capital.?gain|harvest|section.?\d|irmaa|gift.?tax|charitable|\bdaf\b|\bcrt\b|clat|opportunity.?zone|cost.?seg|basis"),
 ("estate",    "Estate, Trust & Legacy",             "/portal/estate-command",
  r"estate|trust|legacy|inherit|probate|\bwill\b|beneficiar|dynasty|\bilit\b|\bslat\b|\bgrat\b|generation.?skip|succession|heir|multi.?gen|wealth.?transfer"),
 ("business",  "Business & Succession",              "/portal/business-command",
  r"business|buy.?sell|entity|\bllc\b|s.?corp|c.?corp|partnership|key.?person|exit.?plan|valuation|deferred.?comp|409a|\besop\b|owner.?oversight"),
 ("insure",    "Insurance, Annuity & Carrier",       "/portal/carrier-command",
  r"insur|carrier|underwrit|\bltc\b|long.?term.?care|disabilit|annuit|rider|mortality|morbidity|term.?life|medicare|athene|axonic|\bmyga\b|\bfia\b|\bpe.?plus|guaranteed.?income|quick.?quote|own.?occ"),
 ("invest",    "Investments & Portfolio",            "/portal/portfolio-command",
  r"portfolio|invest|allocation|equit|\bbond|stock|\betf\b|mutual.?fund|crypto|rebalanc|monte.?carlo|efficient.?frontier|sharpe|market|ibbotson|index.?strateg|\bsp.?500|inflation|\bfee\b"),
 ("scenario",  "Scenario Lab & Comparison",          "/portal/scenario-lab",
  r"scenario|compare|comparison|side.?by.?side|versus|\bvs\b|play.?zone|strategy.?lab|what.?if|sensitivity|predictive|simulat|synerg|multi.?scenario|saved.?scenario"),
 ("client",    "Client Management & CRM",            "/portal/clients",
  r"client|\bcrm\b|lead|pipeline|prospect|contact|household|book.?of.?business|referral|appointment|meeting|hubspot|collaborative.?plan"),
 ("practice",  "Advisor Practice & Sales Enablement","/portal/practice-command",
  r"advisor|agent|commission|seminar|sales|slide|present|script|story|training|email.?campaign|marketing|branding|workspace|\bteam\b|webhook|workflow|automation|template|vault|bulk|batch|competitive|affiliate|onboard.?advisor"),
 ("compliance","Compliance & Supervision",           "/portal/compliance-center",
  r"complian|regulat|finra|\bsec\b|suitab|disclosure|audit|supervis|\bkyc\b|\baml\b|fiduciar|reg.?bi|\badv\b|archive|stale|hidden.?material"),
 ("ai",        "AI Brain & Intelligence",            "/portal/ai-brain-hub",
  r"\bai\b|artificial|intelligen|\bagent\b|\bllm\b|whisper|copilot|assistant|memory.?bank|knowledge|\brag\b|semantic|natural.?language|recommend|voice.?plan"),
 ("discover",  "Discovery, Calibration & Onboarding","/portal/onboarding",
  r"onboard|calibrat|intake|fact.?finder|discovery|questionnaire|\bnlp\b|profil|genome|persona|values|sensory|representational|goals.?based"),
 ("risk",      "Risk, Divorce & Protection",         "/portal/risk-command",
  r"divorce|shield|asset.?protect|liabilit|umbrella|lawsuit|creditor|prenup|alimony|child.?support|emergenc|catastroph|longitudinal.?risk"),
 ("report",    "Reports & Deliverables",             "/portal/reports",
  r"report|deliverab|proposal|summary|export|\bpdf\b|print|scorecard|statement|dashboard|war.?room|oversight|analytics|usage"),
 ("education", "Education & Knowledge",              "/portal/education",
  r"educat|learn|course|lesson|academy|glossary|faq|guide|explain|secret|tutorial|how.?it.?works|how.?a.?figure"),
 ("engage",    "Engagement & Behavioral",            "/portal/engagement",
  r"gamif|pavlov|\bpet\b|avatar|badge|achievement|streak|reward|engagement|entrainment|breath|dopamine|twin"),
 ("ops",       "Admin, Ops & System",                "/portal/admin",
  r"admin|setting|config|system|diagnostic|debug|\btest\b|\bdev\b|internal|\bops\b|billing|subscription|seat|permission|feature.?flag|data.?bus|sync|integration"),
 ("public",    "Public, Marketing & Legal",          "/",
  r"landing|pricing|legal|privacy|terms|support|about|contact|blog|login|register|password|invite|not.?found|\bhome\b|trial|checkout|subscribe"),
]
HUBNAME = {k: (n, p) for k, n, p, _ in HUBS}
HUBNAME["misc"] = ("Cross-Cutting Reference Library", "/portal/library")

def spaced(s):
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s).lower()

def hub_for(r):
    hay = spaced(" ".join([r["component"]] + r["routes"] + [r["file"]]))
    scores = {k: len(re.findall(pat, hay)) for k, _, _, pat in HUBS}
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "public" if r["dir"] == "." else "misc"
    return best

# ── Version-sprawl detection ────────────────────────────────────────────────
def base_name(c):
    s = re.sub(r"(V\d+|Page|Screen|New|Old|Copy|Final|Legacy|Enhanced|Advanced|Pro)+$", "", c)
    s = re.sub(r"V\d+(?=[A-Z]|$)", "", s)
    return (s or c).lower()

fam = collections.defaultdict(list)
for r in rows:
    fam[base_name(r["component"])].append(r)
canon = {k: max(g, key=lambda r: (len(r["engines"]), r["trpc"] + r["fetch"],
                                  r["charts"], r["loc"]))["component"]
         for k, g in fam.items()}

# ── Scoring ─────────────────────────────────────────────────────────────────
def score_tool(r):
    """Rubric for a decision/calculator page."""
    v = 0.6
    ne = len(r["engines"])
    if   ne >= 3: v += 2.5
    elif ne >= 1: v += 2.0
    elif r["math"] >= 40: v += 1.5
    elif r["math"] >= 15: v += 1.0
    elif r["math"] >= 4:  v += 0.4
    live = r["trpc"] + r["fetch"]
    v += 2.0 if live >= 5 else 1.2 if live >= 2 else 0.7 if live >= 1 else 0.0
    surf = 0.0
    if r["inputs"] >= 12: surf += 1.2
    elif r["inputs"] >= 6: surf += 0.8
    elif r["inputs"] >= 2: surf += 0.4
    if r["charts"] >= 10: surf += 1.0
    elif r["charts"] >= 4: surf += 0.7
    elif r["charts"] >= 1: surf += 0.3
    if r["tables"] >= 6: surf += 0.5
    elif r["tables"] >= 2: surf += 0.3
    v += min(surf, 2.4)
    if r["pdf"]: v += 0.7
    if r["ai"]:  v += 0.8
    v += 1.4 if r["loc"] >= 1200 else 1.0 if r["loc"] >= 600 else 0.6 if r["loc"] >= 300 else 0.1
    return min(v, 10.0)

def score_public(r):
    """Rubric for a marketing/legal/auth page — conversion, not computation."""
    v = 1.5
    v += 1.8 if r["loc"] >= 500 else 1.2 if r["loc"] >= 250 else 0.5
    v += 1.5 if r["motion"] >= 20 else 0.8 if r["motion"] >= 5 else 0.0
    v += 1.2 if r["buttons"] >= 6 else 0.7 if r["buttons"] >= 2 else 0.0
    v += 0.8 if r["charts"] >= 1 else 0.0
    live = r["trpc"] + r["fetch"]
    v += 1.0 if live >= 2 else 0.5 if live >= 1 else 0.0
    if r["ai"]: v += 0.7
    return min(v, 10.0)

def gaps(r, hub):
    g = []
    if hub == "public":
        if r["motion"] < 5:  g.append("static — no motion or cinematic treatment")
        if r["buttons"] < 2: g.append("weak call-to-action")
        if r["loc"] < 250:   g.append("thin copy")
        return g
    if not r["engines"] and r["math"] < 15: g.append("no real computation — display-only")
    elif not r["engines"]:                  g.append("math inlined in the component — untestable, un-reusable, cannot be called by the AI brain")
    if r["trpc"] + r["fetch"] == 0:         g.append("no live data — nothing persists, no client record")
    if r["charts"] == 0:                    g.append("no visualisation of the outcome")
    if r["inputs"] < 6:                     g.append("thin input surface — cannot model a real scenario")
    if not r["pdf"]:                        g.append("no client-ready export")
    if not r["ai"]:                         g.append("invisible to the AI brain")
    if not r["linked"]:                     g.append("orphan URL — reachable only by typing it")
    if r["loc"] < 250:                      g.append("stub depth")
    return g

def upgrade(r, hub):
    s = []
    if hub == "public":
        if r["motion"] < 5:  s.append("apply the CinematicEngine treatment (Ken Burns + breath-locked bloom)")
        if r["buttons"] < 2: s.append("add a primary CTA into the portal funnel")
        if r["loc"] < 250:   s.append("expand copy: proof, mechanism, outcome")
        return s
    if not r["engines"]:
        s.append("extract the math into `shared/<name>Engine.ts` as a pure, deterministic module with a vitest suite")
    if r["trpc"] + r["fetch"] == 0:
        s.append("add a tRPC procedure so scenarios save against the client record")
    if r["charts"] < 4:
        s.append("add projection + sensitivity + comparison charts")
    if r["inputs"] < 6:
        s.append("widen inputs to a full scenario (assumptions, ranges, alternatives)")
    if not r["pdf"]:
        s.append("add branded PDF export with sources and method notes")
    if not r["ai"]:
        s.append("register in `pageRegistry.ts` with intent tags so the AI brain can cite and deep-link it")
    if r["loc"] < 250:
        s.append("write the explanatory layer: source, method, what the number means, what to do next")
    if not r["linked"]:
        s.append("surface as a tab/accordion inside its hub — keep the URL, drop the top-level nav claim")
    return s

scored = []
for r in rows:
    hub = hub_for(r)
    built = score_public(r) if hub == "public" else score_tool(r)   # what was built
    pen, hits, notes = integrity_for(r["file"])
    v = max(round(built - pen, 1), 0.5)                             # what it is worth today
    key = base_name(r["component"])
    is_dupe = canon[key] != r["component"] and len(fam[key]) > 1
    if is_dupe:
        v = min(v, 4.5)
    e = round(v * (1.0 if r["linked"] else 0.45 if r["routed"] else 0.10), 1)

    if is_dupe:                       disp = "MERGE into canonical version"
    elif "undeclared-var" in hits or "baked-outperformance" in hits:
                                      disp = "FIX FIRST — defective output"
    elif v >= 8.5:                    disp = "PROMOTE — hub / top nav"
    elif v >= 7.0:                    disp = "EMBED — named tab"
    elif v >= 5.0:                    disp = "EMBED — accordion section"
    elif v >= 3.5:                    disp = "EMBED — reference card"
    else:                             disp = "UPGRADE or fold into library"

    scored.append({**r,
        "hub": hub, "hub_name": HUBNAME[hub][0], "hub_path": HUBNAME[hub][1],
        "built": round(built, 1), "penalty": round(pen, 1),
        "value": v, "effectiveness": e,
        "integrity_flags": hits, "integrity_notes": notes,
        "duplicate_of": canon[key] if is_dupe else "",
        "disposition": disp,
        "target": canon[key] if is_dupe else HUBNAME[hub][1],
        "gaps": notes + gaps(r, hub), "upgrade": upgrade(r, hub),
        "route": r["routes"][0] if r["routes"] else "",
    })

scored.sort(key=lambda r: (-r["value"], -r["loc"]))
json.dump(scored, open(os.path.join(SCRATCH, "scored.json"), "w"), indent=1)

with open(os.path.join(SCRATCH, "audit.csv"), "w", newline="") as fh:
    w = csv.writer(fh)
    w.writerow(["value","built","penalty","effectiveness","component","route","hub","disposition","target",
                "loc","engines","trpc_fetch","charts","inputs","tables","pdf","ai",
                "routed","linked","in_live","integrity_flags","gaps","upgrade_to_9_10"])
    for r in scored:
        w.writerow([r["value"], r["built"], r["penalty"], r["effectiveness"], r["component"], r["route"], r["hub_name"],
                    r["disposition"], r["target"], r["loc"], "|".join(r["engines"]),
                    r["trpc"]+r["fetch"], r["charts"], r["inputs"], r["tables"], r["pdf"], r["ai"],
                    r["routed"], r["linked"], r["in_live"], "|".join(r["integrity_flags"]),
                    " ; ".join(r["gaps"]), " ; ".join(r["upgrade"])])

band = collections.Counter()
for r in scored:
    v = r["value"]
    b = "9-10" if v >= 9 else "8-8.9" if v >= 8 else "7-7.9" if v >= 7 else \
        "5-6.9" if v >= 5 else "3.5-4.9" if v >= 3.5 else "<3.5"
    band[b] += 1
print("=== VALUE BANDS ===")
for b in ["9-10","8-8.9","7-7.9","5-6.9","3.5-4.9","<3.5"]:
    print(f"  {b:>8}: {band[b]:4d}")
print("\n=== DISPOSITION ===")
for k, v in collections.Counter(r["disposition"] for r in scored).most_common():
    print(f"  {v:4d}  {k}")
print("\n=== BY HUB ===")
for k, v in collections.Counter(r["hub_name"] for r in scored).most_common():
    print(f"  {v:4d}  {k}")
print(f"\nmean value {sum(r['value'] for r in scored)/len(scored):.2f}"
      f"   mean effectiveness {sum(r['effectiveness'] for r in scored)/len(scored):.2f}")
print(f"duplicates to merge: {sum(1 for r in scored if r['duplicate_of'])}")
