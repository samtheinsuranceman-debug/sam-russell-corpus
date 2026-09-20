# 05 — CI checks, test instructions, secret scan

**Date:** 2026-09-20
**Tree scanned:** `claude/consolidation-foundation-audit` @ `76ed5f2` (= `master`)

---

## 1. Secret scan — clean

### 1.1 Method

All **2,039 git-tracked files** were scanned with 14 credential patterns.
Binary and large-media extensions were skipped; nothing else was excluded.
`node_modules` is not tracked and was not scanned.

Patterns: AWS access key · GitHub PAT · OpenAI key · Anthropic key · Stripe
live key · Stripe restricted key · Google API key · Slack token · PEM/OpenSSH
private-key block · JWT · database URL with inline password · SendGrid key ·
Twilio SID · Resend key.

### 1.2 Result

| Measure | Count |
|---|---:|
| Tracked files scanned | 2,039 |
| Raw pattern hits | 10 |
| Classified as placeholder/example | 2 |
| Escalated for manual review | 8 |
| **Confirmed real credentials after review** | **0** ✅ |

All 8 escalated hits were manually inspected and are **documentation
placeholders**:

| File | Matched text | Verdict |
|---|---|---|
| `LAUNCH.md:123` | `mysql://USER:PASS@HOST:3306` | Literal placeholder in a deploy table |
| `docs/RECOVERY_PLAN.md:19` | `mysql://USER:PASS@HOST:3306` | Placeholder in a runbook |
| `scripts/DEPLOY.md:18` | `mysql://USER:PASS@HOST:3306` | Placeholder, annotated *"NEVER in code"* |
| `scripts/build_database.sh:5` | `mysql://USER:PASS@HOST:3306` | Placeholder in a header comment |
| `scripts/restore_database.mjs:5` | `mysql://USER:PASS@HOST:3306` | Placeholder in a header comment |
| `scripts/export_schema_sql.sh:14` | `mysql://unused:unused@127.0.0.1` | Deliberate dummy — the script never connects; the config only requires the variable to exist |

They were escalated only because the placeholder heuristic did not recognise
the literal token `USER:PASS`. They are recorded here rather than suppressed so
the false-positive rate of the scan is visible.

### 1.3 History scan — clean

```
$ git log --all -p | grep -oE "AKIA…|ghp_…|sk-ant-…|sk_live_…|AIza…" | sort -u
(no output)
```

**No key-shaped string appears in any commit across all 143 commits.** There is
no credential to rotate and no history to rewrite.

### 1.4 Ignore hygiene — correct

`.gitignore` covers `.env`, `.env.local`, `.env.development.local`,
`.env.test.local`, `.env.production.local`. No `.env` file is tracked, and none
is present untracked on disk.

### 1.5 Filenames that look like secrets but are not

A name-based scan flags 11 paths. All are product surface or env-gated tests,
not credentials:

- `client/src/pages/portal/SecretSecrets.tsx`, `SecretDetail.tsx` and
  `audit/page_inputs/209_portal-secret-secrets.json`, `210_…-id.json` — the
  **"Tax Secrets"** product feature.
- `server/{groq,mistral,openrouter,resend,xai}.secret.test.ts`,
  `server/providerCredentials.live.test.ts` — tests that **skip** unless a
  provider credential is present in the environment. They read credentials;
  they do not contain them.
- `scripts/owner_totp_secret.mjs` — a generator that *creates* a TOTP secret at
  runtime. No secret is stored in it.

---

## 2. Test instructions

### 2.1 Required — use pnpm

```bash
pnpm install --frozen-lockfile     # npm install FAILS — see doc 03 §1
```

`npm install` exits 1 with `Cannot read properties of null (reading 'matches')`
because npm's arborist cannot walk the committed pnpm store. The repo declares
`"packageManager": "pnpm@10.34.2"` and ships `pnpm-lock.yaml`.

### 2.2 The four gates

```bash
npx tsc --noEmit     # typecheck  → expect exit 0, no output
npm run build        # build      → expect "330 route patterns", exit 0
npx vitest run       # FULL suite → expect 4,138 passed / 82 skipped
npm run test:ci      # CI suite   → expect 3,757 passed /  5 skipped
```

### 2.3 Running a single file

```bash
npx vitest run server/navReachability.test.ts
```

**Always capture the exit code directly.** Do not pipe the run through `tail`
or `head` and read `$?` — you will get the pager's exit code, not the test
runner's. Earlier in this consolidation a commit was pushed with two failing
tests for exactly that reason.

```bash
npx vitest run > out.txt 2>&1; echo "EXIT=$?"; tail -20 out.txt   # correct
npx vitest run | tail -20; echo "EXIT=$?"                          # WRONG
```

### 2.4 ES5 emit constraint

`tsconfig.json` sets no `target` and no `downlevelIteration`, so emit is ES5.
In any file added or modified during this consolidation:

- no `[...someSet]` / `[...someMap]` spreads — use `Array.from(...)`
- no `for…of` over a `Map` or `Set` — index over `Object.keys()` or an array
- no `String.prototype.matchAll()` — use a `while ((m = re.exec(s)) !== null)` loop

---

## 3. Proposed CI workflow

No CI workflow file exists in the repository today. This PR **does not add
one** — it is documentation-only by the owner's instruction. The following is
the recommendation for a later, separate PR.

```yaml
# .github/workflows/ci.yml  — PROPOSED, not added by this PR
name: CI
on:
  pull_request:
  push: { branches: [master] }

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4        # pnpm BEFORE node, so cache resolves
        with: { version: 10.34.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }

      - run: pnpm install --frozen-lockfile
      - run: npx tsc --noEmit
      - run: npm run build
      - run: npx vitest run              # FULL suite, not test:ci — see §4
```

### 3.1 Required status checks

| Check | Gate |
|---|---|
| `pnpm install --frozen-lockfile` | must succeed; a lockfile drift fails the build |
| `tsc --noEmit` | zero errors |
| `npm run build` | exit 0 **and** the emitted route count matches `App.tsx` |
| `vitest run` (full) | zero failures |
| secret scan | zero confirmed credentials |

---

## 4. The CI coverage gap

`test:ci` carries **26 `--exclude` flags**, so CI runs a materially smaller
suite than a developer does locally:

| Suite | Test files | Tests |
|---|---:|---:|
| `npx vitest run` (full) | 216 passed / 9 skipped | **4,138** passed |
| `npm run test:ci` | 194 passed | **3,757** passed |
| **Gap** | **22 files** | **381 tests** |

Some exclusions are correct — `*.secret.test.ts` and `*.live.test.ts` need
credentials CI does not hold, and they self-skip regardless. But these four are
not in that category:

- `server/databaseSchemaFile.test.ts`
- `server/persistence-schema.test.ts`
- `server/core-table-queryability.test.ts`
- `server/subscriptionGate.test.ts`

They cover **schema and access control** — the two areas a consolidation is
most likely to break, and the second of which is already this project's highest
risk (doc 02 §3.1).

**Both suites pass today**, so nothing is currently hidden. The exposure is
forward-looking: a migration PR could break a schema test and still show green.

**Decision taken for this consolidation:** every migration PR in document 06
gates on the **full** `vitest run`, not `test:ci`. Narrowing the exclusion list
itself is proposed as a separate, non-blocking change.

---

## 5. Summary

| Item | Status |
|---|---|
| Secrets in tracked files | ✅ **0 confirmed** (8 placeholders reviewed) |
| Secrets in git history | ✅ **0** across 143 commits |
| `.gitignore` env coverage | ✅ correct |
| Reproducible install | ✅ pnpm — ❌ npm (documented, doc 03 §1) |
| Typecheck / build / tests | ✅ all green |
| CI workflow present | ❌ none — proposed above, not added here |
| CI/local test parity | ⚠️ 381-test gap — full suite gated instead |
