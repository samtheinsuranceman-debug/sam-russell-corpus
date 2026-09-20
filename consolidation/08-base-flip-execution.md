# 8 — Base flip to `russell-capital-app`: execution log

**Directive, 2026-09-20:** consolidate into `russell-capital-app`, reaffirmed after the §7
evidence was presented. §7.5 set out what a flip requires. This records doing it.

**Status: prerequisites 1 and 2 partially complete. Blocked on a decision, not on effort.**

---

## 8.1 What was done

Work is committed on `claude/base-flip-l8kqt0` in `russell-capital-app`, commit `c76da49`.
**It is not pushed** — push access to that repository was declined, so the branch exists
locally only. Everything below is reproducible from that commit.

### Prerequisite 1 — "Fix its lockfile first" ✅ **done**

Install was broken three ways, none of them the application code:

| Defect | Effect | Fix |
|---|---|---|
| `pnpm-workspace.yaml` contained only the literal placeholder `set this to true or false`, left by an unfinished `pnpm approve-builds` | Every install failed `ERR_PNPM_IGNORED_BUILDS` | Replaced with a real `onlyBuiltDependencies` allowlist |
| `package.json` declared `pnpm.overrides`, which **pnpm 10+ no longer reads** — it warns and ignores | Produced *"the current `overrides` configuration doesn't match the value found in the lockfile"* | Moved to `pnpm-workspace.yaml`; lockfile regenerated |
| **No `packageManager` field** | Ran whatever pnpm was installed — 12.5.1 here — not the version the lockfile was written for | Pinned `pnpm@10.34.2`, matching the base |

`pnpm install --frozen-lockfile` now **exits 0**. That third defect is worth dwelling on: a
repository with no pnpm pin cannot give a reproducible build on any machine, which is a
property a consolidation base has to have.

### Prerequisite 2 — "Triage its 111 failing tests to zero" ⚠️ **113 → 34**

| Fix | Failures cleared |
|---|---|
| `round67-70-features.test.ts` had **14 absolute paths hard-coded to `/home/ubuntu/russell-capital`** — another machine's filesystem. Rewritten to `process.cwd()`, which is how the base already fixed the identical bug. | 9 |
| Adopted the guarded `round6`, `round7`, `round14`–`round18` from the base. **Verified first** that each is byte-identical to this repo's copy apart from an added `hasDatabase` import and `it.skipIf` guards — so no assertion changed. | ~55 |
| Ported `server/testDb.ts`; applied `it.skipIf(!hasDatabase)` to the 6 DB-dependent tests in `complianceTracking` and 1 in `features`. | 7 |
| `features.test.ts` asserted four literal passwords. `APPROVED_PASSWORDS` is read from `DASHBOARD_PASSWORDS`, so those assertions describe **configuration, not code**; they now skip when it is unset. | 4 |
| Adopted the credential-guarded `resend.secret` and `heygen-api` tests. | 3 |

**Current: 2042 passing, 34 failing, 68 skipped.**

---

## 8.2 Why the last 34 cannot be closed inside this repository

They are not harness problems.

| Cause | Count |
|---|---:|
| Needs a server listening on `:3000` (`ECONNREFUSED`) | 12 |
| **Pages the repo's own tests require that do not exist in it** | ~19 |
| `auth.logout` — session cookie not cleared with `maxAge: -1, secure: true` | 1 |

### The missing pages

`server/experience.test.ts` and `server/batch8-wiring.test.ts` are **byte-identical** in both
repositories. They pass in `russell-capital-systems` and fail here, because the files they
load are absent:

| Page the app's own tests require | `russell-capital-app` | `russell-capital-systems` |
|---|:--:|:--:|
| `Arena` | ❌ | ✅ |
| `RewardsVault` | ❌ | ✅ |
| `Endgame` | ❌ | ✅ |
| `SocialNarcotic` | ❌ | ✅ |
| `BlackMirror` | ❌ | ✅ |
| `PetSystem` | ❌ | ✅ |
| `ToiletDashboard` | ❌ | ✅ |
| `InfiniteScroll` | ❌ | ✅ |

**This inverts the premise of the flip.** `russell-capital-app` was selected partly to carry
the gamification capability. It does not have the gamification pages. Its tests assert they
exist; the base is where they live. §2.5 found the same thing from the other direction —
the app holds 6 gamification pages, `russell-capital` holds the full set, and the base
already has 8.

### The logout defect

`auth.logout.test.ts` is byte-identical in both and expects the session cookie cleared with
`maxAge: -1` and `secure: true`. The base does that; `russell-capital-app` does neither. This
is a security-relevant difference in the direction of the base, and it is a **code** fix, not
a test fix.

### `accessControl`, revisited

§2.3 flagged `accessControl.ts` — app 104 lines, base 29 — as needing a security review
before any replacement. Reading both settles it:

- **App:** an email + password gate. `AUTHORIZED_EMAIL` hardcoded, `APPROVED_PASSWORDS` from
  `DASHBOARD_PASSWORDS`, plus `TRIAL_PASSWORD`, `OWNER_BYPASS_EMAILS` and
  `isOwnerBypassEmail()`.
- **Base:** *"Password, backdoor, and email-bypass authentication has been retired… all
  authorization is enforced by the managed OAuth session and server-side role checks."*
  `ETERNAL_PASSWORDS` is `[]`, `isOwnerBypassEmail()` returns `false`, `isValidPassword()`
  always returns invalid.

The app's version is **not** a hardcoded backdoor — the passwords come from the environment,
and the earlier "18 backdoor passwords" reading of the failing tests was wrong. But the two
are different security postures, and **adopting the app as the base reinstates password and
email-bypass authentication that the live build has deliberately retired.** That is a
decision to take deliberately, not to inherit by choosing a base.

---

## 8.3 The cost of finishing, measured

Closing the last 34 means importing application code from `russell-capital-systems` into
`russell-capital-app` — the migration running in the opposite direction. The measured size of
that direction:

| To bring from the base into the app | Count |
|---|---:|
| `shared/` modules the app lacks | **124** |
| `server/` modules the app lacks | **98** |
| Schema tables the app lacks | **39** |
| tRPC namespaces the app lacks | **~137** |
| Pages the app lacks (incl. the 8 its own tests need) | **~65** |

Against which the app contributes, in the other direction: `navTree.ts`, `CONSOLIDATION_PLAN.json`,
`vercel.json`, `api/index.ts`, and 6 gamification pages.

---

## 8.4 Where this leaves the decision

Two things are now true that were not established before the work was attempted:

1. **`russell-capital-app` can be made to install reproducibly.** That defect is fixed and it
   was never about the code.
2. **It cannot be made to pass its own test suite without importing the base.** Its tests
   describe a platform it does not contain.

The directive stands and the work continues on request. But the honest statement of the
position is that the flip does not terminate: finishing it means moving 124 shared modules,
98 server modules, 39 tables and ~137 tRPC namespaces into the app, at which point the app
*is* the base under a different name — with the live `www` host still pointing at the original.

### What is needed to proceed

- **Push access to `russell-capital-app`** — declined this session, so `c76da49` is local only.
- **A decision on the inverted migration** — whether to move the base's 124/98/39/137 into the
  app, and in what order.
- **A hosting decision** — the app targets Vercel/PostgreSQL; `www.russellcapitalsystems.com`
  is served from Railway/MySQL. A base that cannot deploy to the live host is not yet a base.
- **A decision on the auth posture** (§8.2) — password + email-bypass, or the retired-auth
  model the live build runs.

None of these is a technical obstacle. Each is a choice, and each one is recorded here so it
can be made deliberately.
