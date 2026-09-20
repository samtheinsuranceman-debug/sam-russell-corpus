# 3 — Build Verification of the Canonical Base

**Date:** 2026-09-20
**Target:** `sam-russell-corpus` @ `76ed5f2`, directory `russell-capital-systems/`
**Package:** `russell-capital-unified` v1.0.0
**Toolchain:** pnpm 10.34.2 · Node 20 · TypeScript · Vite/esbuild · Vitest · Drizzle (MySQL)

Every command below was run in this session against a clean shallow clone. Raw results, no
editing.

---

## 3.1 Results

| Step | Command | Result |
|---|---|---|
| Install | `pnpm install --frozen-lockfile` | **PASS** — 5.6 s, lockfile honoured, no resolution drift |
| Typecheck | `pnpm check` (`tsc --noEmit`) | **PASS — 0 errors** |
| Build | `pnpm build` | **PASS** — frontend + server bundle |
| Tests (CI suite) | `pnpm test:ci` | **PASS — 194/194 files, 3,757 passed, 5 skipped, 0 failed** |
| Tests (full suite) | `pnpm test` | **PASS — 216 passed, 9 skipped, 0 failed; 4,138 tests passed, 82 skipped** |

**No step required a workaround, a flag, an override, or a skipped check.**

---

## 3.2 Detail

### Install
```
pnpm install --frozen-lockfile
Done in 5.6s using pnpm v10.34.2
```
Build scripts not auto-approved for `@parcel/watcher`, `@tailwindcss/oxide`, `esbuild`
(pnpm 10 default). Neither the build nor the tests need them. `pnpm approve-builds` is
available if native watcher performance is ever wanted in local dev.

### Typecheck
```
tsc --noEmit
→ 0 errors
```
A 487-file client plus a 372-module server typechecking clean with zero suppressions is the
single strongest signal in this verification.

### Build
```
pnpm build
  → node scripts/build.mjs
      dist/public/... 401+ output files, esbuild code splitting, compiled Tailwind
      [build] 330 route patterns written to dist/public/routes.json
      [build] Frontend emitted to dist/public
      Done in 2022ms
  → esbuild server/_core/index.ts --platform=node --bundle --format=esm --outdir=dist
      dist/index.js  3.8mb
      Done in 149ms
```

The build emits **`dist/public/routes.json` — a 330-pattern route manifest**. This is the
artifact that makes phased page migration reviewable: every migration PR's manifest diff shows
exactly which routes were added, and proves none were removed or re-pointed.

### Tests
```
pnpm test:ci
  Test Files  194 passed (194)
       Tests  3757 passed | 5 skipped (3762)
    Duration  51.89s

pnpm test
  Test Files  216 passed | 9 skipped (225)
       Tests  4138 passed | 82 skipped (4220)
    Duration  64.56s
```

`test:ci` is the project's own script and already excludes the suites that need a live database
or network (`round6/7/14–18`, `heygen-api`, `*.secret.test.ts`, `*.live.test.ts`, and others).
Notably **the full suite passes too** in this environment — the 9 skipped files self-skip on
absent configuration rather than failing.

---

## 3.3 Baseline comparison against the live build

Run for contrast, on `russell-capital` @ `863b3f0` in a clean git worktree, same machine:

| Suite | Canonical base | `russell-capital` (live) |
|---|---|---|
| Test files | **216 passed, 0 failed** | 78 passed, **20 failed** |
| Tests | **4,138 passed, 0 failed** | 2,086 passed, **95 failed** |
| Typecheck | **0 errors** | 0 errors |

The live build's 95 failures are pre-existing and environmental — integration tests requiring a
server on `127.0.0.1:3000` and a database. They are not defects introduced by anyone. But the
contrast is the point: **the canonical base is green end-to-end in an environment where the live
build cannot be.** That is a real argument for the base decision, independent of size.

---

## 3.4 What was NOT done

Per the stated constraints, and stated explicitly so the boundary is on the record:

- No DNS, domain, GoDaddy, Railway, or Vercel change.
- No database created, migrated, seeded, or connected. `drizzle-kit` was **not** run.
  `DATABASE_URL` was never set; no database was reachable from this session.
- No environment variable or credential read, written, or transmitted.
- No deployment of any kind.
- No repository deleted, archived, renamed, or overwritten.
- No merge to `master`.
- **No application code imported.** This branch adds documentation and one CI workflow. Nothing
  else. `git diff --stat` against `master` is the proof.

---

## 3.5 Reproducing this

```bash
git clone https://github.com/samtheinsuranceman-debug/sam-russell-corpus
cd sam-russell-corpus/russell-capital-systems
pnpm install --frozen-lockfile
pnpm check        # expect 0 errors
pnpm build        # expect 330 route patterns written
pnpm test:ci      # expect 194/194 files, 0 failed
```

No `.env` is required for any of the four commands.
