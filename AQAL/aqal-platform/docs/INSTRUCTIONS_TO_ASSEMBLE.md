# INSTRUCTIONS TO ASSEMBLE, BUILD & DEPLOY
_The parts a human (or deploy agent) must wire up — the things that cannot be committed into source._

This complements `AQAL_MASTER_CONTINUITY.md` (what the platform is) and `HANDOFF_TO_MANUS.md` (deploy
handoff). It is the practical checklist to go from this zip to a running site.

## 1. Stack
- **Client**: React 19 + TypeScript + Vite (`client/`).
- **Server**: Node + tsx/esbuild, tRPC routers (`server/`).
- **DB**: Drizzle ORM + migrations (`drizzle/`), Postgres via `DATABASE_URL`.
- **Package manager**: pnpm (has `patches/` — use pnpm so patches apply).

## 2. Install & run (local)
```bash
cd aqal-platform
pnpm install                 # applies patches/
pnpm db:push                 # drizzle-kit generate && migrate  (needs DATABASE_URL)
pnpm dev                     # tsx watch server/_core/index.ts  → serves client + API
# production:
pnpm build                   # vite build + esbuild server bundle → dist/
pnpm start                   # NODE_ENV=production node dist/index.js
pnpm check                   # tsc --noEmit (typecheck)
pnpm test                    # vitest
```
> The library data (`researchLibraryData.ts`, ~7 MB) is code-split; `pnpm build` emits it as a separate
> chunk. This is expected. Do not inline it back into the main bundle.

## 3. Environment variables you MUST provide (nothing secret is in this zip)
Create `.env` (server) and Vite env as needed:

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | server | Postgres connection (assessments, commitments, reminders) |
| `JWT_SECRET` | server | auth token signing |
| `PORT` | server | HTTP port |
| `OAUTH_SERVER_URL`, `OWNER_OPEN_ID` | server | auth/owner identity |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | server | payments (Pricing → checkout, PaymentSuccess) |
| `BUILT_IN_FORGE_API_KEY`, `BUILT_IN_FORGE_API_URL` | server | LLM/backend forge calls |
| `VOICE_CONSENSUS` | server | voice panel / multi-AI consensus flag |
| `VITE_APP_ID` | client+server | app id |
| `VITE_FRONTEND_FORGE_API_KEY`, `VITE_FRONTEND_FORGE_API_URL` | client | frontend forge calls |
| `VITE_OAUTH_PORTAL_URL` | client | portal login redirect |

## 4. External services to connect (manual — cannot be assembled in code)
1. **Postgres database** — provision, set `DATABASE_URL`, run `pnpm db:push`.
2. **Stripe** — products/prices for the pricing tiers; set keys; register the webhook endpoint for
   `STRIPE_WEBHOOK_SECRET`; verify PaymentSuccess flow.
3. **Voice speech-to-text** — the assessment and 30/90-day tracker are microphone-first (never typed).
   Wire an STT provider for audio → transcript so answers/commitment reasons can be captured by voice.
4. **LLM keys (forge)** — for per-answer richness feedback, results coaching, and any consensus panel.
5. **PDF generation** — for downloadable reports/tracker templates (earlier requests asked for PDFs of
   the assessment + research). Wire a server-side PDF step or reuse the repo's `ai-consciousness-100k/
   build_pdf.py` pattern if generating from Markdown.
6. **Generational normative data** *(see OPEN DECISION #1 in the continuity doc)* — cohort rarity is
   currently a **model-based estimate**, not measured percentiles. To make it real, supply an
   age/generation normative table per line and replace the estimate in `Results.tsx` /
   `IntelligenceProfile.tsx`. If you instead decide to **remove** generational rarity, strip
   `GenerationSection` from `Home.tsx`, the `generation`/`cohortRarity` branches in `Results.tsx`, and
   `generationalNote`/`sameGeneration` in `IntelligenceProfile.tsx`, and keep only population rarity.

## 5. Research-library moat before public launch
The 3,307-cluster corpus currently ships in the client bundle (bulk-exportable). Before opening search
to members: move `researchLibraryData.ts` behind an **authenticated, rate-limited, paginated API**;
return only the page the user is viewing; never ship the whole array to the browser. Real moat =
curation + scoring + freshness, not DRM. (Details in `HANDOFF_TO_MANUS.md`.)

## 6. Continuity backlog to finish (from AQAL_MASTER_CONTINUITY.md §4)
- [ ] Add 2–3 **goals/outcomes questions** (top-5 goals × 5/10/20/30/40 yr + NLP "how will you know").
- [ ] **AI results coaching**: name the controlling weakness, give % friction vs their stated outcomes,
      prescribe research-backed moves + expected outcome-probability lift.
- [ ] **30/60/90-day audio tracker** + monthly re-estimation (recurring-revenue hook).
- [ ] Decide **generational rarity** (keep / toggle / remove) and wire the data source if kept.
- [ ] Reframed **meta-level explainer pages** (engineer strengths / dismantle weaknesses).

## 7. How to regenerate the readable catalog after adding clusters
```bash
python3 scripts/gen_catalog.py     # (script included in docs/) → refreshes
                                    # docs/RESEARCH_LIBRARY_CATALOG.md + .csv
```
