# Consolidation Foundation — Repository & Capability Inventory

**Date:** 20 September 2026

## Decision (recorded)

| | Repository | Role |
|---|---|---|
| **Live at the domain** | `russell-capital-domain-redirect` | **DO NOT MERGE THE PLATFORM INTO IT.** Five files, GitHub Pages, `CNAME` = `russellcapitalsystems.com`. Its own README: *"contains no credentials, customer data, tracking code, or application source."* Leave untouched. |
| **Consolidation base** | **`russell-capital-app`** | The full platform consolidates here. |
| Donor | `sam-russell-corpus/russell-capital-systems` | 86 base-absent routes, a green test suite, and engine work worth harvesting. |
| Donor | `russell-capital` | Sacred Seven, behavioural schema, selected modules. Not yet inventoried. |
| Reference / archive | the remaining twelve | Not automatic merge candidates. |

### Why `russell-capital-app` is the base — evidence verified

| Claim | Verified |
|---|---|
| Vercel configuration | `vercel.json` + `api/index.ts` serverless function, 60s maxDuration, SPA rewrites |
| API folder | present |
| Consolidation manifest | `CONSOLIDATION_PLAN.json`, **687 scored entries** with Verdict / Layer / Cluster / Hierarchy Role |
| Recursive navigation | `client/src/navTree.ts`, **1058 lines**, `NavNode { children?: NavNode[] }`, nesting 3+ deep |
| Shared calculator-data layer | `annuityData.ts`, `indexCreditingData.ts`, `advisorySummaryData.ts`; 23,342 lines across `shared/` |

The recursive `navTree` is the decisive structural advantage: it supports arbitrarily nested,
collapsible navigation. The donor's flat two-level `NAV_SECTIONS` cannot express that.

### An important note on the redirect repo

Its `README.md` states the redirect target is `https://russellcap.com/`, but `index.html` sends
visitors to `https://www.russellcapitalsystems.com/` — the same hostname its own `CNAME` claims.
That is either a stale README or a redirect loop. **Flagged, not touched** — no DNS or domain change
is in scope.

---

## Size comparison

| | **Base** `russell-capital-app` | **Donor** `russell-capital-systems` |
|---|---|---|
| Routes | **612** | 313 |
| Page components | **722** | 310 |
| `shared/` modules | 63 | 115 |
| `server/` modules | 48 | 130 |
| Navigation | recursive `NavNode` tree | flat sections + one subgroup level |
| Deploy target | Vercel (`vercel.json`, `api/`) | Express bundle |

Both are React 19 · wouter · tRPC 11 · Drizzle. Migration is code selection, not a rewrite.
