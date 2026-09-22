# Live build audit — russellcapitalsystems.com
**Date:** 2026-09-19
**Build audited:** `sam-russell-corpus/russell-capital-systems`
**Branch:** `claude/engine-harvest-catalog-backlink`

This is the reference document to read BEFORE opening any other repo, and to
re-read before deciding where a harvested feature lands. Written first, on
purpose, so that merging decisions are made against a known baseline rather
than an impression.

---

## 1. Which build is live

`sam-russell-corpus/russell-capital-systems` is the live build. Identified by
three markers no other repo on disk carries:

- `server/domainRedirect.test.ts` — asserts the production domain behaviour
- `server/livePageParity.test.ts` — pins the live page set
- `server/siteHealthRouter.ts` + `server/siteHardening.test.ts`

Twenty-one other repos exist locally under `/home/user`. None of them carry
domain or parity tests. They are candidate donors, not the live site.

## 2. Size

| | count |
|---|---|
| Routes registered in `App.tsx` | **330** |
| Page components in `client/src/pages` | 65 |
| Components | 93 |
| Modules in `shared/` | 189 |
| Server modules (non-test) | 111 |
| Test files | 237 |
| Tests passing | 4,409 |
| Engine-like modules in `shared/` | ~68 |

The build is not small and it is not broken. `tsc --noEmit` is clean and the
full suite is green. The problem is not quality; it is reachability.

## 3. THE HEADLINE FINDING: half the site is unreachable

```
routes registered ................ 330
routes with a menu entry ......... 170
routes with NO menu entry ........ 160   <-- 48% of the site
dead menu links (no route) ....... 2
```

**160 routes are built, routed, and tested — and cannot be reached from the
menu.** Among them, by name:

`/portal/annuity-explorer`, `/portal/carrier-rates`, `/portal/carrier-ratings`,
`/portal/commission-calculator`, `/portal/commission-tracker`,
`/portal/client-report-generator`, `/portal/client-scorecard`,
`/portal/collaborative-planning`, `/portal/advanced-reporting`,
`/portal/ai-brain-hub`, `/portal/athene-guaranteed-income`,
`/portal/axonic-sp500`, `/portal/auto-closer`, `/portal/batch-illustration`,
`/portal/career-path`, `/portal/certifications`, `/portal/charitable-giving`,
`/portal/compliance-audit`, `/portal/command`, `/portal/compete`, and 140 more.

This is the single highest-value fix available. Nothing needs to be built to
recover these; they need menu entries. Any harvest from another repo should
happen AFTER this, because a feature that already exists here and is merely
hidden must not be re-imported from elsewhere as though it were missing.

**Two dead menu links** point at routes that do not exist:
`/portal/knowledge-library`, `/portal/tool-explorer`. These 404 today.

## 4. The menu as it stands

Twelve top-level groups, 170 links:

| Group | items | assessment |
|---|---|---|
| Home | 11 | fine |
| Rental Properties | 21 | **too big for a top-level group**; wants sub-grouping |
| Clients | 7 | fine |
| New Client Welcome List | 20 | **misnamed** — 20 items is not a "welcome list"; owner flagged this |
| Planning | 23 | **too big**; wants sub-grouping |
| Products | 26 | **largest group**; wants sub-grouping |
| AI & Tools | 13 | fine |
| Compliance | 4 | thin — 160 hidden routes include compliance pages |
| The Experience | 25 | **too big and unclear** — owner flagged "I don't even know what that is" |
| Tax Secrets | 8 | fine |
| Secondary Information | 5 | **meaningless name** — owner flagged |
| Settings | 19 | large but acceptable for settings |

Structural problems, in priority order:

1. **Flat two-level menu.** Every group is `label -> items[]`. There is no third
   level, so a 26-item group renders as 26 flat links. Groups over ~12 items
   need nesting.
2. **Three groups are named badly.** "New Client Welcome List", "The Experience"
   and "Secondary Information" describe neither a task nor a product. Owner
   could not identify what two of them contain.
3. **No search.** With 330 routes and no menu search, hidden pages stay hidden
   even after they are linked.
4. **Real-estate pages span two groups** (Rental Properties, and several inside
   Planning), so related work is split.

## 5. What is genuinely strong here

Recorded so that a merge from another repo does not overwrite it:

- **Statement-calibrated IUL crediting.** `shared/securianBGA2Statement.ts`,
  `shared/prismAccountSolve.ts`, `shared/securianAnnualPolicyReview.ts`,
  `shared/segmentAudit.ts`. Eighteen PRISM segments and six BGA II segments
  solved to the cent against carrier statements. No other repo has this.
- **Segment-aware policy engine.** `shared/iulPolicyEngine.ts` models segment
  maturity month by month — money asleep in unmatured segments, charges
  deducted regardless, loans accruing. Nothing else on disk does this.
- **AG 49-A gating.** `shared/ag49Validator.ts`, `shared/ag49Products.ts`,
  `shared/iulIllustrationGate.ts`. Withholds rather than clamps.
- **Evidence-tier discipline.** `shared/illustrationEvidenceTiers.ts`,
  `shared/calibrationDisclosure.ts`, `participationProvenance()`. Every rate
  carries where it came from and what may be said about it.
- **Patent catalogue.** `shared/patentCatalog.ts` — 68 claims, engine back-links.
- **237 test files, 4,409 tests.** Any donor code arriving from another repo
  will be held to this, which is the right bar.

## 6. Merge rules for the harvest

Derived from the findings above. These bind the next phase.

1. **Reachability before acquisition.** Link the 160 hidden routes first. A page
   that exists here and is hidden is not missing.
2. **No duplicate menu entries.** One concept, one menu link. If two repos each
   have an IUL calculator, the menu gets one entry.
3. **Most sophisticated wins, but "sophisticated" means tested.** A donor page
   with more features and no tests does not beat an incumbent with fewer
   features and a test suite. Where the donor genuinely wins, its tests come
   with it or get written.
4. **Never overwrite Section 5.** The statement-calibrated engines are unique to
   this build and are the most defensible work in it.
5. **Flag, do not merge, anything novel.** Owner's instruction: genuinely
   clever code gets described first and merged only on his say-so.
6. **Five passes.** Read the donor, read this build, re-read the donor — the
   owner asked for five alternations before placement decisions. Record each
   pass's findings in this document rather than in memory.

## 7. Repos to survey

Twenty-one on disk, all under `github.com/samtheinsuranceman-debug`:

**Likely donors (RCS-family):** `rcs-axiom-atlas`, `rcs-four-halls`,
`rcs-new-new-new`, `rcs-really-russell-capital`,
`rcs-russell-capital-calibrate-system`, `rcs-samtheinsuranceman-debug.github.io`,
`rcs-solutions-new`, `rcs-the-new-plan`, `russell-capital`,
`russell-capital-app`, `russell-capital-analyses`,
`russell-capital-combinations`, `russell-capital-nlp`,
`russell-capital-patents`, `russell-capital-skills`

**Adjacent:** `patent360`, `aqal`, `aqal-platform`, `joinaqal-superior-build`,
`russell-biomedical`, `sam-russell-corpus`

## 8. Status of this audit

**Complete for:** live-build identification, route/menu reachability, menu
structure, engine inventory, merge rules.

**Not yet done:** the five-pass read of each donor repo; the feature-by-feature
comparison; the actual merges. Those follow, against this baseline.
