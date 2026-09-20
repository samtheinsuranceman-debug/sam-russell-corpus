# Consolidation Foundation — Repository & Capability Inventory

**Date:** 20 September 2026 · **Canonical base:** `sam-russell-corpus` → `russell-capital-systems/` (the live build)

## Scope decision (recorded)

- `sam-russell-corpus` is the **sole canonical consolidation base**.
- `russell-capital-app` is a **donor** for gamification routes and Postgres/Vercel patterns.
- `russell-capital` is a **donor** for the Sacred Seven, behavioral schema, and selected page/content modules.
- Every other repository is donor / reference / archive — **not** an automatic merge candidate.
- No DNS, domain, traffic, hosting, database or credential changes. No wholesale repository merges.

---

## The sixteen repositories

| Repository | Visibility | Role |
|---|---|---|
| `sam-russell-corpus` | public | **CANONICAL BASE** — hosts the live build |
| `russell-capital-app` | private | **DONOR** — gamification, Postgres/Vercel patterns |
| `russell-capital` | private | **DONOR** — Sacred Seven, behavioral schema, selected modules |
| `Russell-Capital-Solutions-NEW` | public | Reference |
| `Really-Russell-Capital` | public | Reference |
| `Russell-Capital-Calibrate-System` | public | Reference |
| `russell-capital-patents` | private | Reference — patent filings |
| `russell-capital-reports` | private | Archive |
| `russell-capital-skills` | private | Reference |
| `russell-capital-analyses` | private | Archive |
| `russell-capital-combinations` | private | Archive |
| `russell-capital-nlp` | private | Reference |
| `russell-capital-domain-redirect` | private | Infra — do not touch |
| `russell-biomedical` | private | Unrelated |
| `sam-russell-catechism-brotherhood` | public | Content |
| `sam-russell-corpus-backup` | private | Archive |

---

## Size comparison — live base vs the app donor

| | Live (`russell-capital-systems`) | Donor (`russell-capital-app`) |
|---|---|---|
| Routes | **313** | **612** |
| Page components | 310 | 722 |
| `shared/` modules | 115 | 63 |
| `server/` modules | 130 | 48 |
| Stack | React 19 · wouter · tRPC 11 · Drizzle · Express · Vite | same family, Vercel/Postgres target |

**The stacks are compatible.** Both are React 19 + wouter + tRPC 11 + Drizzle, so migration is a
code-selection problem rather than a rewrite.

> ### Correction to the working assumption
>
> The brief referred to *"the proposed 391 pages."* The measured figures are different and
> materially change scope:
>
> - Live routes: **313**
> - Donor routes: **612**
> - **Identical paths in both: 227** — each needs one chosen implementation
> - Donor-only routes: **385**
> - Live-only routes: **86**
> - Union if everything were taken: **698**
>
> The real work is not importing 391 new pages. It is adjudicating **227 collisions** and then
> selecting from 385 donor-only candidates.

