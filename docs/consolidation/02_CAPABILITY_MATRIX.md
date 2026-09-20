# 2. Authoritative Capability Matrix

One chosen implementation per capability. **Canonical wins by default**; a donor
wins only where the row states a reason and names the evidence.

Legend — **KEEP**: canonical implementation stands, import nothing.
**IMPORT**: take the donor implementation. **ADD**: capability absent everywhere
in canonical, add it new. **DEFER**: do not decide yet; needs its own comparison.
**REJECT**: do not import.

---

## 2.1 Engines

| Capability | Canonical | rc-app | rc | **Decision** | Evidence / reason |
|---|:--:|:--:|:--:|---|---|
| 50 engines present in canonical | ✅ 54 | 31 | 31 | **KEEP** | Canonical is a strict superset except the four below. Donors add nothing to these. |
| `clientOnboardingEngine` | ❌ | ✅ | ✅ | **ADD** (Phase C) | Absent from canonical. Donor copies identical — pick the one with tests. |
| `complianceDocGeneratorEngine` | ❌ | ✅ | ✅ | **ADD** (Phase C) | As above. Compliance surface — needs regression proof before it ships. |
| `familyTreeFinancialEngine` | ❌ | ✅ | ✅ | **ADD** (Phase C) | As above. |
| `multiCurrencyWealthEngine` | ❌ | ✅ | ✅ | **ADD** (Phase C) | As above. |

## 2.2 Registries and manifests

| Capability | **Decision** | Reason |
|---|---|---|
| Engine registry | **KEEP canonical** | 54 vs 31. Donor registry is a subset; replacing it loses 23 engines. |
| Calculator registry | **KEEP canonical** | Same subset relationship. |
| `shared/routeManifest.ts` | **KEEP canonical, and enforce** | Zero drift against `App.tsx`. Neither donor has one. Becomes a CI gate (§5). |
| `drizzle/schema.ts` | **KEEP canonical** | 155 tables vs 116. Canonical is the superset including gamification. |
| Test suite | **KEEP canonical** | 225 files, 4138 passing, 0 failing. Donors: 100 files, 93–102 failing. |

**No registry is replaced by this plan.** Additions are appends, proven per §6.

## 2.3 The Sacred Seven

| Page | Canonical | rc | **Decision** |
|---|:--:|:--:|---|
| `TheArrival`, `TheField`, `TheMirror`, `TheMap`, `TheStrategyTable`, `TheBrotherhood`, `TheLegacy` | ✅ all 7 | ❌ none | **KEEP canonical — REJECT import** |

The brief assigns Sacred Seven to `russell-capital` as donor. `grep -ril "sacred
seven"` returns **0 files** there and 10 in canonical. The capability is already
canonical and complete. Importing is impossible and overwriting would be a
regression. Supporting files `server/fieldRouter.ts` and `_genome/GenomeKit.tsx`
are likewise canonical.

## 2.4 Gamification

| Capability | Canonical | rc-app | **Decision** |
|---|:--:|:--:|---|
| Gamification tables | **13** | 12 | **KEEP canonical** |
| `/portal/arena`, `/portal/leaderboard`, `/portal/rewards`, `/portal/explore`, `/portal/the-experience` | ✅ | — | **KEEP canonical** |
| `clientBadges`, `leaderboardProfiles`, `userQuests`, `userAchievements`, `dailyRewardClaims`, `dealScores` | ✅ | subset | **KEEP canonical** |
| "18 gamification routes" from rc-app | — | not found | **REJECT** — premise unsupported (§1.6b) |

## 2.5 Analytics / telemetry — rc-app's real contribution

19 procedures exist in rc-app and not in canonical (21 minus the 2 this session
added). They form one coherent suite and should migrate as one bounded capability:

| Group | Procedures |
|---|---|
| Usage | `dailyUsageTrend`, `getSummary`, `getUserPageActivity`, `getSessionActivity`, `getUserSessions`, `listUsers`, `record` |
| Performance | `performanceSummary`, `performanceTrend`, `slowestPages`, `reportPerformance` |
| Errors | `errorsByPage`, `recentErrors` |
| Content ranking | `popular`, `recent`, `trending` |
| Other | `getUserSignatures`, `requestResetCode`, `verifyPassword` |

**Decision: IMPORT as one capability (Phase D)** — with the caveat that these are
Postgres-flavoured and need porting to MySQL, plus whatever tables they read must
be added to the canonical schema. Sized in §6.

| Excluded | Reason |
|---|---|
| `verifyLoginPin`, `resendLoginPin` | Added by this session in `russell-capital-app#1`; not donor capability (§1.6c) |

## 2.6 Auth — canonical already leads

| Capability | Canonical | Donors | **Decision** |
|---|---|---|---|
| Owner password | `scripts/owner_password_hash.mjs`, hashed | rc: **3 plaintext passwords in `shared/`**; rc-app: env vars | **KEEP canonical** |
| Owner second factor | `scripts/owner_totp_secret.mjs` — **TOTP** | none (rc-app has emailed PIN from this session) | **KEEP canonical TOTP** |
| Hardcoded credentials in source | **none** | rc: 3 | **KEEP canonical** |

The sign-in PIN work in `russell-capital#12` and `russell-capital-app#1` was built
to fix a donor-specific lockout bug. **The canonical base does not have that bug and
already has a stronger second factor (TOTP).** Those two PRs are therefore donor
remediation, not canonical candidates.

**Decision: REJECT import of the PIN flow into canonical.** Revisit only if a
deliberate choice is made to prefer emailed PINs over TOTP — a product decision,
not a consolidation one.

## 2.7 Database and hosting

| Capability | Canonical | rc-app | **Decision** |
|---|---|---|---|
| DB engine | MySQL | PostgreSQL | **KEEP MySQL** |
| Hosting | Node server | Vercel + `api/index.ts` | **KEEP Node** |
| "Postgres/Vercel patterns" as donor | — | ✅ | **DEFER — recommend REJECT** (§6 Phase E) |

Adopting these means migrating the engine and host of a green, live build. It
cannot be done as a capability import and is not attempted here.

## 2.8 Pages and routes

| Set | Count | **Decision** |
|---|---|---|
| Canonical routes | 330 | **KEEP all** |
| Already in canonical, donors also have | 227 (rc-app) / 229 (rc) | **KEEP canonical — do not import** |
| Contested: both donors add, canonical lacks | **382** | **DEFER** — per-path decision, batched in Phase B |
| Only rc-app adds | 3 | **DEFER** — Phase B |
| Only rc adds | 9 | **DEFER** — Phase B |
| Union of genuinely new paths | **394** | Phase B, batched |

Full lists in `data/`. Route arithmetic in §4.

---

## 2.9 Summary of decisions

| Decision | Count | Where |
|---|---|---|
| KEEP canonical, import nothing | 50 engines, all registries, schema, test suite, Sacred Seven, gamification, auth, DB, hosting | — |
| ADD (absent from canonical) | 4 engines | Phase C |
| IMPORT (donor is better/exclusive) | 1 analytics suite, 19 procedures | Phase D |
| DEFER (needs per-item comparison) | 394 routes | Phase B |
| REJECT | Sacred Seven import, gamification import, PIN flow, Postgres/Vercel migration | — |

**Nothing in this matrix replaces a canonical registry, schema, or test.**
