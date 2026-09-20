# 6 — Phased PR Plan

One bounded capability per pull request. No phase begins until the previous one is
merged and green.

**Paths below:** source paths are relative to a donor clone root; target paths are
relative to `russell-capital-systems/` in this repository.

---

## Rules that apply to every phase

1. **Branch from `master`**, named `claude/consolidation-phase-N-<slug>`.
2. **One capability.** If a PR needs two headings to describe it, split it.
3. **Never overwrite a live implementation** without a side-by-side comparison and
   a regression proof in the PR body.
4. **Route manifest is append-only.** Add lines. Never regenerate, never sort.
5. **Fill in the baseline contract table** from `03_VERIFICATION_EVIDENCE.md`.
6. **Regenerate, don't hand-edit,** `audit/route_manifest.json` (via
   `scripts/reconcile-route-manifest.mjs`) and `docs/audit/pageRegistry.json`.
7. **Secret-scan the donor file set** before opening the PR.
8. **No DNS, domain, hosting, credential, or production-deployment change** in any
   phase. Those require separate explicit approval.

### The per-PR template

```markdown
## Capability
<one sentence>

## Source → target
| Source (repo + path) | Target path | New or replacing? |

## Comparison (only if replacing something live)
| Aspect | Live | Donor | Chosen | Why |

## Verification
| Gate | Baseline | This PR |
| pnpm check | exit 0 | |
| pnpm build | exit 0, 330 routes | |
| pnpm test:ci | 3757 / 0 failed | |
| pnpm test | 4138 / 0 failed | |
| Route three-way | 330 = 330 = 330 | |

## Rollback
git revert -m 1 <sha>; <plus any schema reversal>

## Risk
<what breaks if this is wrong, and who notices first>
```

---

## Phase 0 — Foundation *(this PR)*

**Contains:** the six documents, two JSON datasets, and `rcs-verify.yml`.
**Touches no application code.**

**Exit criteria:** `rcs-verify.yml` runs and passes on this PR; the six deliverables
are reviewed; the four corrections in `00_DECISION_AND_SCOPE.md` are accepted or
challenged with evidence.

**Rollback:** revert the merge. Nothing is at risk — no runtime file changes.

---

## Phase 1 — Tag the baseline

**Not a PR.** One command, after Phase 0 merges:

```bash
git tag -a consolidation-baseline <phase-0-merge-sha> \
  -m "Verified baseline: tsc 0 errors, build 330 routes, 4138 tests passing"
git push origin consolidation-baseline
```

**Exit criteria:** tag exists on the remote and points at a commit where CI is green.

---

## Phase 2 — Resolve the ten real collisions

**Capability:** decide, in writing, keep-or-swap for the 10 routes where live and
donor resolve to genuinely different components. See
`04_ROUTE_COLLISION_REPORT.md`.

**Source:** comparison only — **no code moves in this phase.**
**Target:** `docs/consolidation/07_COLLISION_DECISIONS.md`

**Test criteria:** documentation only; CI must stay green.

**Constraint:** `/register` and `/forgot-password` both resolve to
`ManagedAuthLegacy` in live. **Recommend keeping live unconditionally** and closing
those two rows without further work — auth is not worth the risk for a cosmetic
difference. `/` is likewise a recommended keep: live's `FrontDoor` is a deliberate
rewrite documented in `docs/HOMEPAGE_SEQUENCES.md`.

**Rollback:** revert. Documentation only.

---

## Phase 3 — The 9 gamification pages

**Capability:** the gamification routes genuinely missing from live.

**Source:** `russell-capital` (**not** `russell-capital-app` — it has none; see
correction 2 in `00_DECISION_AND_SCOPE.md`):

```
client/src/pages/portal/EliteShowdown.tsx
client/src/pages/portal/EntrainmentEngine.tsx
client/src/pages/portal/GamifiedPavlovianEngagement.tsx
client/src/pages/portal/HolographicMirage.tsx
client/src/pages/portal/MoatFortress.tsx
client/src/pages/portal/PredictiveInsightArena.tsx
client/src/pages/portal/StrategyComparisonArena.tsx
client/src/pages/portal/WealthOdyssey.tsx
client/src/pages/portal/WealthWarriorChallenges.tsx
```

**Target:** `client/src/pages/portal/` · routes in `client/src/App.tsx` ·
**9 lines appended** to `shared/routeManifest.ts`.

**Test criteria:** route three-way agreement reads **339 = 339 = 339**. `tsc` clean.
No reduction in passing tests. Each page renders without a console error.

**Risk:** 8 sibling gamification pages are already live, so the shared dependencies
(contexts, UI components, gamification state) most likely already exist. **Verify
each page's import tree resolves before opening the PR** — if one pulls in a shared
module that is not in live, that module becomes its own earlier phase.

**Rollback:** `git revert -m 1 <sha>`. Removes 9 routes and 9 files. No schema, no
data.

---

## Phase 4 — Two low-risk engines

**Capability:** `clientOnboardingEngine`, `familyTreeFinancialEngine`.

**Source:** `russell-capital/shared/` (MySQL lineage, same dialect as live).
Diff against the `russell-capital-app` copies first; if identical, take the
`russell-capital` one.

**Target:** `shared/`

**Test criteria:** `tsc` clean. **Each engine ships with unit tests in this PR** —
live's engines are tested and a new one arriving untested lowers the bar.

**Risk:** low — pure computation, no routes, no schema. But an engine nothing calls
is dead weight, so the PR must name the Phase 5+ pages that will consume it.

**Rollback:** revert. Nothing imports them yet.

---

## Phase 5 — Pages that depend on Phase 4

**Capability:** the donor pages consuming the two new engines, selected
individually from the 397 non-hub candidates.

**Source:** `russell-capital/client/src/pages/**` — named explicitly in the PR.
**Target:** `client/src/pages/` + `App.tsx` + manifest lines.

**Test criteria:** route three-way agreement. `tsc` clean. Regenerated
`audit/route_manifest.json` and `pageRegistry.json` committed.

**Constraint:** **cap each PR at roughly 10 pages.** 397 candidates is not one PR;
it is dozens. A 100-file PR cannot be reviewed and its rollback blast radius is
the whole phase.

**Rollback:** revert. Per-PR, so a bad batch does not take the good ones with it.

---

## Phase 6 — `multiCurrencyWealthEngine` and `complianceDocGeneratorEngine`

Held back from Phase 4 deliberately.

`complianceDocGeneratorEngine` **generates compliance documents**. In a regulated
insurance context a generator producing wrong output is materially worse than no
generator. **This PR requires review by someone who can speak to the compliance
obligations**, not just a code review.

`multiCurrencyWealthEngine` implies FX rates. **Confirm whether it needs a live
rate feed** — if it does, it is blocked behind a connector decision and should not
land as a stub with hardcoded rates.

**Test criteria:** as Phase 4, plus documented compliance sign-off for the generator.

---

## Phase 7 — The NLP depth ladder and cadence governor

**Capability:** add the meta-layer ladder (L0–L4, confidence-gated) and the two-loop
recalibration calculus **to the existing `shared/nlpBrain.ts`**.

**This is not a port.** Per `02_CAPABILITY_MATRIX.md`, `shared/nlpCalibration.ts` is
**rejected** — live's 51-meta-program brain with tested-disjoint predicate lexicons
and per-pole `speakTo` instructions is materially better. Only two constructs from
that module are additive, confirmed absent from live by measurement.

**Source:** concepts only, re-implemented against `nlpBrain.ts`'s existing types.
**Target:** `shared/nlpBrain.ts` (extended) + tests.

**Test criteria:** every existing `nlpBrain` test still passes. New tests cover the
confidence gate at each rung and the dwell/hysteresis switch decisions.

**Risk — the highest in the programme.** This changes pacing on **every** AI surface.
It must merge alone, and it must be behind a flag that defaults off until observed.

**Rollback:** flag off first (instant), then revert.

---

## Phase 8+ — The remaining candidates

Reassess after Phase 5. Do **not** pre-plan 397 pages: the collision decisions and
the first page batches will change what is worth taking.

**Standing exclusions until explicitly revisited:**

| Excluded | Why |
|---|---|
| The 41 `/portal/hub/*` pages | Live solved route sprawl differently; importing them adds a competing scheme |
| Anything from `russell-capital-app` touching the DB | Postgres → MySQL dialect migration, not a copy |
| Vercel serverless patterns | Live is a long-lived Express process on Railway |
| `clientCalibration` + migrations 0056/0057 | Blocked on the Phase 7 outcome; also need renumbering to 0061+ |
| Auth routes | Not worth the risk for a cosmetic difference |

---

## Sequencing summary

| Phase | Capability | Gate | Schema? |
|---|---|---|---|
| 0 | Foundation docs + CI | CI green on this PR | no |
| 1 | Baseline tag | tag pushed | no |
| 2 | 10 collision decisions | written, reviewed | no |
| 3 | 9 gamification pages | 339 routes three-way | no |
| 4 | 2 engines + tests | tsc + tests | no |
| 5 | Pages using them, ≤10/PR | three-way + regenerated audits | no |
| 6 | 2 sensitive engines | + compliance sign-off | no |
| 7 | NLP ladder into `nlpBrain.ts` | flagged off, full nlp suite | no |
| 8+ | Reassess | — | **any schema PR is its own phase, alone, with a backup** |

No phase deploys. No phase touches DNS. Production remains a separate, explicitly
approved decision at every point.
