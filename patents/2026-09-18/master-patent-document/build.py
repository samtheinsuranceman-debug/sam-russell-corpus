# -*- coding: utf-8 -*-
import sys, html, datetime
sys.path.insert(0, '/tmp/claude-0/-home-user-russell-capital/892a4733-e3a6-5853-bbe7-2ccf010523a8/scratchpad/master')
import data_a, data_b, data_c, adjust

entries = data_a.DRASS + data_b.COMBOS_SHALLOW + data_c.COMBOS_DEEP
ORDER = ["Critical to file","High importance","Important","Moderate","Low priority"]
for e in entries:
    e["alice"], e["alice_note"] = adjust.REVISED[e["id"]]
entries.sort(key=lambda e: (ORDER.index(e["priority"]), -e["alice"], e["id"]))
counts = {p: sum(1 for e in entries if e["priority"]==p) for p in ORDER}
esc = html.escape

def entry_html(e):
    ways = f'{e["ways"]}-way combination' if "ways" in e else "Platform patent — Drass Wealth Management"
    parents = f'<p class="par"><span class="k">Built from</span> {esc(e["parents"])}</p>' if "parents" in e else ""
    cls = "p-" + e["priority"].split()[0].lower()
    return f'''
<article class="pat">
  <header class="ph">
    <div class="pid">{esc(e["id"])}</div>
    <h3>{esc(e["name"])}</h3>
    <div class="tags"><span class="tag {cls}">{esc(e["priority"])}</span><span class="tag alice">Alice {e["alice"]}/10</span><span class="tag ways">{esc(ways)}</span></div>
  </header>
  {parents}
  <h4>The simple version</h4><p>{esc(e["simple"])}</p>
  <h4>How it works</h4><p>{esc(e["works"])}</p>
  <h4>Why it can be patented</h4><p>{esc(e["patentable"])}</p>
  <h4>Why this one is {esc(e["priority"].lower())}</h4><p>{esc(e["urgency"])}</p>
  <p class="alicenote"><span class="k">On the Alice score.</span> {esc(e["alice_note"])}</p>
</article>'''

rows = "".join(
    f'<tr><td class="mono">{esc(e["id"])}</td><td>{esc(e["name"])}</td>'
    f'<td class="ctr">{e.get("ways","—")}</td><td class="ctr mono">{e["alice"]}</td>'
    f'<td><span class="tag {"p-"+e["priority"].split()[0].lower()}">{esc(e["priority"])}</span></td></tr>'
    for e in entries)

sections = ""
for p in ORDER:
    grp = [e for e in entries if e["priority"]==p]
    if not grp: continue
    sections += f'<h2 class="pri {"p-"+p.split()[0].lower()}">{esc(p)} <span class="cnt">{len(grp)} patent{"s" if len(grp)!=1 else ""}</span></h2>'
    sections += "".join(entry_html(e) for e in grp)

doc = f'''<!doctype html><html><head><meta charset="utf-8"><title>Master Patent Document</title>
<style>
@page {{ size: Letter; margin: 18mm 16mm; }}
* {{ box-sizing: border-box; }}
body {{ font-family: Georgia, "Times New Roman", serif; font-size: 11pt; line-height: 1.55; color: #14171a; margin: 0; }}
.cover {{ page-break-after: always; padding-top: 55mm; }}
.cover h1 {{ font-size: 34pt; line-height: 1.05; margin: 0 0 10px; letter-spacing: -.02em; }}
.cover .sub {{ font-size: 14pt; color: #4a5057; margin: 0 0 30px; }}
.cover .meta {{ font-family: "Courier New", monospace; font-size: 9.5pt; color: #6b7280; border-top: 1px solid #d5d0c5; padding-top: 12px; }}
h2.pri {{ font-size: 17pt; margin: 26px 0 4px; padding: 7px 11px; color: #fff; border-radius: 3px; page-break-after: avoid; }}
h2.pri .cnt {{ float: right; font-size: 10pt; font-weight: normal; opacity: .9; }}
.p-critical {{ background: #9e2a22; }} .p-high {{ background: #a8650f; }}
.p-important {{ background: #2f5d7c; }} .p-moderate {{ background: #5c666f; }} .p-low {{ background: #7a8288; }}
span.tag.p-critical, span.tag.p-high, span.tag.p-important, span.tag.p-moderate, span.tag.p-low {{ color:#fff; }}
.pat {{ border: 1px solid #ded9cf; border-radius: 4px; padding: 13px 16px; margin: 12px 0; page-break-inside: avoid; }}
.ph {{ border-bottom: 1px solid #ebe7de; padding-bottom: 7px; margin-bottom: 9px; }}
.pid {{ font-family: "Courier New", monospace; font-size: 9pt; color: #8a6d1f; letter-spacing: .09em; }}
.ph h3 {{ font-size: 15pt; margin: 2px 0 7px; }}
.tag {{ display: inline-block; font-family: "Courier New", monospace; font-size: 8pt; padding: 2px 7px; border-radius: 2px; margin-right: 5px; }}
.tag.alice {{ background: #efe9d8; color: #6b5512; }} .tag.ways {{ background: #eceef0; color: #4a5057; }}
h4 {{ font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: #8a6d1f; margin: 11px 0 3px; font-family: Helvetica, Arial, sans-serif; }}
p {{ margin: 0 0 6px; }}
.par {{ font-size: 9.5pt; color: #4a5057; background: #faf8f3; padding: 6px 9px; border-left: 2px solid #c9a94a; }}
.k {{ font-weight: bold; color: #14171a; }}
.alicenote {{ font-size: 9pt; color: #5c666f; border-top: 1px dotted #ded9cf; padding-top: 6px; margin-top: 9px; }}
table {{ width: 100%; border-collapse: collapse; font-size: 9.5pt; margin: 10px 0 0; }}
th {{ text-align: left; border-bottom: 2px solid #14171a; padding: 5px 6px; font-family: Helvetica, Arial, sans-serif; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .06em; }}
td {{ border-bottom: 1px solid #ebe7de; padding: 5px 6px; }}
.ctr {{ text-align: center; }} .mono {{ font-family: "Courier New", monospace; }}
.note {{ background: #f6f3ec; border-left: 3px solid #9e2a22; padding: 12px 15px; margin: 14px 0; font-size: 10pt; }}
.note h3 {{ margin: 0 0 7px; font-size: 12pt; }}
.howto {{ background: #f4f6f8; border-left: 3px solid #2f5d7c; padding: 12px 15px; margin: 14px 0; font-size: 10pt; }}
.howto h3 {{ margin: 0 0 7px; font-size: 12pt; }}
h2.plain {{ font-size: 16pt; margin: 22px 0 6px; border-bottom: 1px solid #d5d0c5; padding-bottom: 5px; }}
</style></head><body>

<div class="cover">
  <h1>Master Patent Document</h1>
  <p class="sub">New inventions that only exist because four platforms were built by the same person.<br>Written so a fifth grader can follow every one.</p>
  <p class="meta">Samuel Andrew Russell V &nbsp;·&nbsp; Russell Holdings Management LLC<br>
  {len(entries)} patents &nbsp;·&nbsp; 2-way through 20-way combinations &nbsp;·&nbsp; {datetime.date.today().strftime("%d %B %Y")}<br>
  Platforms: Russell Capital Systems &nbsp;·&nbsp; JoinAQAL &nbsp;·&nbsp; Dr. Buddy &nbsp;·&nbsp; Drass Wealth Management</p>
</div>

<h1 style="font-size:22pt;margin:0 0 4px;">Start here</h1>
<p>Every invention in this document is a <strong>combination</strong>. On their own the parts already exist and are already
spoken for. Put together in the specific way described, each one does something none of the parts can do alone, and that
new ability is the thing worth owning.</p>
<p>These continue your existing numbering. Your earlier work covered SE-001 through SE-016 across three companies.
This document adds <strong>Drass Wealth Management as the fourth platform</strong> (DR-01 to DR-04) and then
<strong>SE-017 onward</strong> — combinations that reach across all four.</p>

<div class="howto">
<h3>How to read each entry</h3>
<p><strong>The simple version</strong> — what it does, in plain words, with a picture you can hold in your head. Every
entry uses a different picture; no metaphor is used twice in this document.</p>
<p><strong>How it works</strong> — the way the thing behaves. Deliberately not a parts list.</p>
<p><strong>Why it can be patented</strong> — what nobody else has done, and the new ability that appears when the pieces meet.</p>
<p><strong>Why this one is urgent</strong> — the honest case for filing it now, or for waiting.</p>
<p><strong>Alice score</strong> — a rough guess, out of 10, at whether US patent law will treat it as a real technical
invention rather than an idea with a computer bolted on. Higher is safer.</p>
</div>

<div class="note">
<h3>Read this before you spend money</h3>
<p>{esc(adjust.PANEL_DISSENT).replace(chr(10)+chr(10), "</p><p>")}</p>
</div>

<h2 class="plain">All {len(entries)} at a glance</h2>
<p>Ordered by how urgently they should be filed, then by how likely they are to survive an eligibility challenge.</p>
<table><thead><tr><th>ID</th><th>Name</th><th class="ctr">Ways</th><th class="ctr">Alice</th><th>Priority</th></tr></thead><tbody>{rows}</tbody></table>
<p style="margin-top:10px;font-size:10pt;color:#4a5057;">
<strong>{counts["Critical to file"]}</strong> critical &nbsp;·&nbsp; <strong>{counts["High importance"]}</strong> high importance &nbsp;·&nbsp;
<strong>{counts["Important"]}</strong> important &nbsp;·&nbsp; <strong>{counts["Moderate"]}</strong> moderate &nbsp;·&nbsp;
<strong>{counts["Low priority"]}</strong> low priority</p>

{sections}

<div class="note" style="border-left-color:#5c666f;">
<h3>One last honest note</h3>
<p>Nothing in this document is a filed patent, and nothing in it is legal advice. These are proposed combination claims
written by software engineers who read the code, plus one AI reviewer who argued the scores down. Every Alice number
started higher and was lowered after that review. Before any money is spent, a registered patent attorney should read
the full technical descriptions and confirm that what is claimed matches what is actually built.</p>
</div>

</body></html>'''

out = '/tmp/claude-0/-home-user-russell-capital/892a4733-e3a6-5853-bbe7-2ccf010523a8/scratchpad/master/master_patent_document.html'
open(out,'w').write(doc)
print(f"  entries: {len(entries)}")
print("  priority spread:", {k:v for k,v in counts.items() if v})
print(f"  html: {len(doc):,} bytes")
