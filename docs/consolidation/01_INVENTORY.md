# 1. Repository and Capability Inventory

**Canonical base:** `sam-russell-corpus` → `russell-capital-systems/`
**Measured at:** corpus `76ed5f2`, rc-app `ef74f3f`, rc `863b3f0`
**Method:** every number below was produced by running the command shown, not read
from documentation. Raw route lists are in `data/`.

---

## 1.1 The three repositories in scope

| | **canonical**<br>sam-russell-corpus | **donor**<br>russell-capital-app | **donor**<br>russell-capital |
|---|---|---|---|
| App root | `russell-capital-systems/` | repo root | repo root |
| Default branch | `master` | `master` | `main` |
| Database | **MySQL** (`drizzle-orm/mysql2`) | **PostgreSQL** (`drizzle-orm/postgres-js`) | MySQL |
| Hosting shape | Node server (`dist/index.js`) | **Vercel** (`vercel.json`, `api/index.ts`) | Node server |
| Engines (`shared/*Engine.ts`) | **54** | 31 | 31 |
| Shared modules (`shared/*.ts`) | **174** | 62 | 62 |
| DB tables | **155** | 116 | 116 |
| tRPC procedures | 284 | **303** | — |
| Server test files | **225** | 100 | 100 |
| Page files (`client/src/pages/**/*.tsx`) | 325 | **722** | 687 |
| Registered routes (`<Route path=>`) | 330 | **612** | 620 |
| **Test result** | **4138 pass / 0 fail** | 2096 pass / **102 fail** | 2117 pass / **93 fail** |
| Route manifest | **yes, 0 drift** | no | no |
| Hardcoded credentials in source | **none** | none (env vars) | **yes — 3 in `shared/`** |

The canonical base leads on every engineering axis except raw page count. The two
donors lead on page count and nothing else.

### The two donors are near-duplicates of each other

`russell-capital-app` and `russell-capital` report identical engine counts (31),
identical shared-module counts (62), and identical table counts (116). They offer
**the same four engines** the canonical lacks. They are two forks of one ancestor,
not two independent sources. This matters for sequencing: importing from both is
mostly importing the same thing twice.

---

## 1.2 Verified capability counts — canonical base

```
$ ls shared/*Engine.ts | wc -l                      →  54
$ ls shared/*.ts | wc -l                            → 174
$ grep -cP 'export const \w+ = mysqlTable' \
    drizzle/schema.ts                               → 155
$ ls server/*.test.ts | wc -l                       → 225
$ find client/src/pages -name '*.tsx' | wc -l       → 325
$ node scripts/build.mjs                            → 330 route patterns
```

The build emits `dist/public/routes.json` with 330 patterns, matching
`shared/routeManifest.ts` exactly (§1.4).

---

## 1.3 Engines the canonical base lacks

Only **four**, and both donors carry the identical set:

| Engine | In rc-app | In rc | Notes |
|---|:--:|:--:|---|
| `clientOnboardingEngine.ts` | ✅ | ✅ | |
| `complianceDocGeneratorEngine.ts` | ✅ | ✅ | |
| `familyTreeFinancialEngine.ts` | ✅ | ✅ | |
| `multiCurrencyWealthEngine.ts` | ✅ | ✅ | |

Because both donors carry the same four, the donor choice for these is a coin
flip on content and should be decided by which copy has tests — resolved per
engine in the phased plan, not here.

## 1.4 The route manifest invariant

`shared/routeManifest.ts` lists every served route as one path per line. Cross-check:

```
manifest entries:              330
App.tsx <Route> entries:       330
in App.tsx but not manifest:     0
in manifest but not App.tsx:     0
```

Zero drift in both directions. Neither donor has an equivalent. **This invariant is
a precondition of every later migration PR** — a route import that does not also
append to the manifest must fail CI (§5).

---

## 1.5 Every other repository: classification

The account holds ~130 repositories. None is an automatic merge candidate. Per the
standing directive they are donors, references, or archive candidates only.

| Class | Repositories | Disposition |
|---|---|---|
| **Canonical** | `sam-russell-corpus` | Sole consolidation base |
| **Donor (scoped)** | `russell-capital-app`, `russell-capital` | Named capabilities only, per §2 |
| **Reference — platform** | `russell-capital-patents`, `Patent360`, `russell-capital-domain-redirect`, `russell-capital-reports`, `russell-capital-skills`, `russell-capital-nlp`, `russell-capital-analyses`, `russell-capital-combinations`, `Russell-Capital-Solutions-NEW`, `Really-Russell-Capital`, `Russell-Capital-Calibrate-System` | Read-only until individually assessed |
| **Reference — adjacent product** | `joinaqal-superior-build`, `AQAL`, `aqal-platform`, `russell-biomedical`, `four-halls`, `axiom-atlas`, `onlyfarms` | Separate products; not consolidation inputs |
| **Archive — corpus/identity** | ~100 `brother-*`, `*-Identity`, `brotherhood-*`, `kanara/kanawha-covenant`, `book-journals`, `private-life`, `sam-russell-corpus-backup`, `21-intelligences-reports`, `one-million-calibration-questions` | Content archives. Several are **public** and hold personal material — audit separately; out of scope here |
| **Superseded** | `sandbox-backup`, `The-New-Plan`, `New-New-New`, `SS`, `S-and-S`, `Steph` | Archive candidates |

Three repositories already live *inside* the canonical corpus as directories
(`AQAL/aqal-platform`, `Patent360`, `doctor-buddy`, `stop-fatty`), each with its own
`package.json`. They are not part of `russell-capital-systems` and are untouched by
this plan.

---

## 1.6 Findings that contradict the brief

Recorded here because acting on the brief as written would import work that already
exists, or would not find what it went looking for. Each is evidence-backed.

**(a) The Sacred Seven is already complete in the canonical base, and absent from
`russell-capital`.**

```
$ grep -ril "sacred seven" <canonical>   → 10 files
$ grep -ril "sacred seven" russell-capital → 0 files
```

All seven pages are present and canonical:
`TheArrival`, `TheField`, `TheMirror`, `TheMap`, `TheStrategyTable`,
`TheBrotherhood`, `TheLegacy` (plus `server/fieldRouter.ts` and
`_genome/GenomeKit.tsx`). `russell-capital` contains no match for the term, nor for
plausible aliases. **Nothing to import; do not overwrite.**

**(b) `russell-capital-app` does not have 18 gamification routes the canonical lacks.**

The canonical already serves `/portal/arena`, `/portal/leaderboard`,
`/portal/rewards`, `/portal/explore`, `/portal/the-experience`, and carries **13**
gamification tables against rc-app's **12** — including `clientBadges`,
`leaderboardProfiles`, `userQuests`, `userAchievements`, `dailyRewardClaims`,
`dealScores`. Of rc-app's 385 routes new to canonical, three match a gamification
word list, and all three are tax/expense tools
(`/portal/expat-tax`, `/portal/overhead-expense`, `/portal/tool-explorer`).

rc-app's genuine exclusive contribution is a **16-procedure analytics/telemetry
suite**, not gamification — see §2. That suite is worth taking; it should be
labelled correctly.

**(c) Two of rc-app's 21 exclusive procedures were added by this session.**
`verifyLoginPin` and `resendLoginPin` come from the sign-in PIN work in
`russell-capital-app#1`, opened earlier today. They are not pre-existing donor
capability and must not be counted as such.

**(d) "Postgres/Vercel implementation patterns" is a migration, not a copy.**
The canonical base is MySQL on a Node server. Adopting rc-app's Postgres/Vercel
patterns means changing the canonical database engine and hosting model. That is
the largest possible change to a green, live build and is explicitly out of scope
for this foundation PR. See §6, Phase E, which recommends **not** doing it.
