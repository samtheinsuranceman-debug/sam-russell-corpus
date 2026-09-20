# Addendum 03 — A duplicate NLP hazard, migration numbering, and the third route leg

**Author:** a second session, working in parallel on the same branch.
**Relationship to existing docs:** additive. Nothing in `FOUNDATION.md`,
`REPOSITORY-INVENTORY.md`, `MIGRATION-PRS.md`, `ADDENDUM-01-open-items.md` or `ADDENDUM-02-deploy-trigger.md` is
replaced, and no file of theirs is edited except `consolidation-ci.yml`, for which
§4 is the comparison the directive requires.

Where our findings overlap they agree, independently: the Sacred Seven is already
on the base, `russell-capital-app` has zero gamification pages, eight of the
seventeen are already home, and the base wins by default. Those are settled and not
re-argued here.

This addendum covers three things Addendum 01 does not, and one correction that
applies to both of our documents.

---

## 1. NEW HAZARD — the base already has a superior NLP brain

This is the same class of hazard as Addendum 01 §5 (four parallel implementations
of two engines), and it is the largest instance of it. `nlpBrain` appears **zero**
times across the existing consolidation documents, so an import proposal is live
and unflagged.

### What the base has

| File | Lines |
|---|---|
| `shared/nlpBrain.ts` | 917 |
| `shared/compositeMind.ts` | 251 |
| `shared/council/nlpEngine.ts` | 324 |

Per `docs/NLP_BRAIN.md`, and verified in source, this holds:

- **51 meta-programs**, each with the authors' own elicitation question, its poles,
  the text markers that reveal which pole is running, and a **`speakTo` instruction
  per pole** — with a test that fails if any pole lacks one.
- **Representational systems** with predicate lexicons **tested to be disjoint**,
  because an overlapping predicate makes the count meaningless.
- **32 language patterns** across Milton, Meta-model, reframing and pacing.
- A **seven-phase emotional arc** with a hard sentence cap per phase.
- **Twelve composite-mind channels** as working memory — explicitly not personalities,
  never named to the client.
- **Per-block provenance** naming the corpus file each block was lifted from.

### The competing implementation

A `shared/nlpCalibration.ts` (~700 lines, 29 axes) exists on
`samtheinsuranceman-debug/russell-capital`, branch
`claude/russell-capital-consolidation-pe793n`. It was written earlier in this
session, before the canonical base was correctly identified. Side by side:

| | base `nlpBrain.ts` | donor `nlpCalibration.ts` |
|---|---|---|
| Meta-programs | **51**, with per-pole `speakTo` | 29 axes |
| Test enforcement | fails if a pole has no `speakTo` | none |
| Predicate lexicons | **tested disjoint** | prose |
| Language patterns | **32** | none |
| Emotional arc | 7 phases, capped | none |
| Composite mind | 12 channels | none |
| Provenance | per block | general |

**Verdict: REJECT the import.** It is a downgrade on every shared axis and would
create a second, competing voice grammar — exactly the four-parallel-engines
failure mode Addendum 01 §5 warns about, in the one subsystem where inconsistency
is most visible to a client.

### The carve-out — two constructs that are genuinely additive

Measured across `shared/` and `server/` (excluding tests): **zero** occurrences of
`metaState`, `meta-state`, `hysteresis`, `recalibrat`, `confidenceGate`, or
`deepestConfident`. Two ideas in the rejected module are therefore new:

| Construct | What it does |
|---|---|
| **Meta-layer ladder (L0–L4)** | Five reflexive layers — state, state-about-state, the standing rule, the identity frame, and the frame about being a framer — with a rising evidence gate per layer (1/2/3/4/5 confirming observations, a contradiction costing double), a ceiling function so the system works at the deepest layer it has *earned* rather than guessing deeper, and a read-deep/speak-shallow rule |
| **Two-loop recalibration calculus** | Reading every turn, unthrottled; style switching event-driven behind a 90-second dwell floor with hysteresis so it cannot flap; three immediate overrides (distress marker, domain change, explicit correction); a separate 30-second advisor-nudge loop |

**Recommendation:** re-implement both **inside `nlpBrain.ts`**, against its existing
types, as a depth-and-cadence governor over the 51 meta-programs. Roughly 120 lines.
Governing 51 is strictly more useful than governing 29.

**This is not a Phase 1–3 item.** It changes pacing on every AI surface, so it
merges alone, behind a flag defaulting off, with its own tests. Nothing else from
the rejected module should be taken.

### Blocked by this decision

A `client_calibration` table and migrations `0056`/`0057` on that same donor branch
were designed to persist the 29-axis model. **They were never applied to any
database.** If the ladder lands inside `nlpBrain.ts` the persistence shape changes,
so those migrations should be rewritten rather than ported — and renumbered, per §2.

---

## 2. CORRECTION — migration numbering, in both our documents

`FOUNDATION.md` §1.2 records the base as having **5** migrations. That is the count
of `drizzle/*.sql` at the configured output root. The full picture:

| Location | Files | Highest number |
|---|---|---|
| `drizzle/` — `drizzle.config.ts` `out` | 5 | **0069** |
| `drizzle/migrations/` — legacy location | 60 | **0073** |
| **Total** | **65** | **0073** |

`drizzle.config.ts` sets `out: "./drizzle"`, so `drizzle-kit generate` writes to
`drizzle/` and will pick the next number from what it finds there — **0070** — while
`drizzle/migrations/0070`–`0073` already exist.

**The next safe migration number is `0074`.** Any schema PR must set it explicitly
and not trust the generator's default. A correction I owe here too: my own draft of
this plan said 0061, which is also wrong.

Two consequences worth recording:

- The donor's `0056`/`0057` collide with **existing files in both locations** and
  must be renumbered on import, not just moved.
- The split across two directories is itself a hazard — two sources of truth for
  "what has been applied." Worth consolidating, but that is a schema change and
  belongs in its own approved PR, not here.

---

## 3. The third leg of the route check

`scripts/consolidation/route-collisions.mjs --check` compares `App.tsx` against
`shared/routeManifest.ts` in both directions. That is the right check and it should
stay.

There is a third artifact it does not see. `pnpm build` emits
`dist/public/routes.json`, which carries its own route list:

```
[build] 330 route patterns written to dist/public/routes.json
```

Verified in this environment, all three agree:

```
App.tsx=330  routeManifest.ts=330  dist/public/routes.json=330
```

The build output can diverge from the other two without either noticing — a
build-time filter, a code-splitting boundary, or a path pattern the emitter handles
differently would drop a route that `App.tsx` and the manifest still agree on. That
failure is a production 404 with green CI.

Added to `consolidation-ci.yml` in §4 as a step **after** the build, so all three
are compared. Note `routes.json` is an object, not an array — the list is under
`.routes`.

---

## 4. Changes to `consolidation-ci.yml` — the documented comparison

The directive requires a documented comparison before changing existing CI, and
Addendum 01 §7 explicitly left the gitleaks decision open ("the change is yours to
take or leave"). Taking it, plus the route leg above. **Nothing existing is removed
or reordered.**

| Step | Before | After | Why |
|---|---|---|---|
| Install, Typecheck, Route reconciliation, Tests, Build, credential regex scan | present | **unchanged** | All six keep their current form and order |
| Built-route agreement | absent | **added**, after Build | §3 — catches a build-output divergence neither existing check can see |
| gitleaks | absent | **added**, alongside the regex scan | Addendum 01 §7. Maintained rule packs catch provider formats a regex set misses; `fetch-depth: 0` so a secret added and later removed mid-branch is still caught |

The regex scan is **kept**, not replaced. It already earned its place by finding the
plaintext access codes in the donor's `shared/identityVerification.ts:110`, and a
hand-written rule that has caught a real secret in this codebase is worth more than
a generic pack's opinion of it.

Permissions stay `contents: read` and no secrets are passed, so the workflow still
cannot deploy. The deployment boundary is unchanged: `deploy-branch.yml` and
`pages.yml` fire only on `push` to `master`, so a branch push reaches neither
Railway nor Pages.

---

## 5. Data added — the three-way view including `russell-capital-app`

`FOUNDATION.md` §1.1 records `russell-capital-app` as **NOT ATTACHED — access denied
this session**, with its routes explicitly excluded from the inventory. It was
attachable from this session, so two datasets are added to close that gap. Both are
generated, not hand-written.

| File | Contents |
|---|---|
| `data/base-vs-both-donors.json` | Every route across all three repositories, resolved to its component **source file**. 438 candidates and 236 collisions, each tagged with which donor it came from and whether both have it |
| `data/capability-matrix-3way.json` | Shared modules, engines and schema tables across all three, each marked canonical or candidate, plus the per-repo SQL dialect |

Measured, and consistent with Addendum 01 where they overlap:

| | base | `russell-capital` | `russell-capital-app` |
|---|---|---|---|
| Routes | 330 | 664 | **612** |
| Shared modules | 174 | 65 | 62 |
| Engines | 55 | 32 | 32 |
| Schema tables | 155 | 117 | 116 |
| **SQL dialect** | mysql | mysql | **postgres** |

Candidate pool across both donors: **438**, of which **382 exist in both** — each of
those needs one implementation chosen, not two imported. 53 are `russell-capital`
only; **3 are `russell-capital-app` only**.

Two findings specific to `-app` that only became checkable once it was attached:

- **It is a Postgres/Vercel fork, confirmed:** `drizzle-orm/pg-core`, `vercel.json`,
  `api/index.ts` serverless entry. So its UI can be read and ported with ordinary
  review, but anything touching the database is a dialect migration — `serial`,
  `jsonb`, array columns, `ON CONFLICT` and `RETURNING` all differ from MySQL — and
  its Vercel patterns do not map onto a long-lived Express process on Railway.
  **Treat it as a reference for how something was solved, not as source to lift.**
- **Only 3 routes are unique to it.** Whatever `-app` is worth, it is not worth much
  as a route donor; the overlap with `russell-capital` is near total.

Only 226 of the 236 collisions resolve to the same component file path on both
sides. **Ten are genuinely different implementations of the same route** and are the
only collisions worth a comparison — `/`, `/register`, `/forgot-password`,
`/portal/long-term-care`, `/portal/market-pulse`, `/portal/meeting-prep`,
`/portal/mortgage-killer-v2`, `/portal/myga-waterfall` and two more, all enumerated
in the JSON. Recommend closing `/`, `/register` and `/forgot-password` as
**keep-base** without further work: the base's `FrontDoor` is a deliberate rewrite
documented in `docs/HOMEPAGE_SEQUENCES.md`, and both auth routes go through
`ManagedAuthLegacy`, which is an architectural choice rather than a cosmetic one.

---

## 6. Disclosure

Before the canonical base was correctly identified, this session audited
`samtheinsuranceman-debug/russell-capital` and concluded **it** was the live build.
That was wrong. The evidence used — the domain string in server source — is present
there because of shared lineage, not because it serves the domain.
`sam-russell-corpus` was mis-triaged as a personal archive from its name and never
opened until the decision came down.

Five commits were pushed to that repository on branch
`claude/russell-capital-consolidation-pe793n` under that mistaken belief. **None
reached `master` in any repository and none touched production.** Their contents
enter this programme as ordinary donor material with no standing:

| Artifact | Disposition |
|---|---|
| `shared/nlpCalibration.ts` + calibration page + `client_calibration` table | **Rejected** — §1. Two constructs carved out for re-implementation in `nlpBrain.ts` |
| `shared/plasticToCash.ts` + page | Candidate. Net-new capability, no test coverage, unproven against the base |
| `shared/mutualCarriers.ts` + page | Candidate. Overlaps the base's `shared/carriers/` and `carrierRatings` — diff before considering |
| 41 `ToggleHub` hub pages | **Deferred.** Lifted from `russell-capital-app`. The base has 330 routes, not 620, so the duplication they absorb largely does not exist here; importing them adds a scheme competing with the route manifest |
| Migrations `0056`/`0057` | Blocked on §1, and must be renumbered to 0074+ per §2 |

Authoring something does not make it canonical. Each of these faces the same
comparison gate as any other donor artifact, and the largest of them is rejected
above on its merits.
