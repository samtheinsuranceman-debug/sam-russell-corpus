# 3. Live Build Verification

Every command below was run against `sam-russell-corpus` at `76ed5f2`, in
`russell-capital-systems/`, on a clean shallow clone. Output is quoted as emitted.

**Result: the canonical base installs, typechecks, builds, and passes its full test
suite with zero failures.**

---

## 3.1 Install

```
$ pnpm install --prefer-offline
Done in 4.6s using pnpm v10.34.2
```

✅ Clean. Warning about ignored build scripts (`@tailwindcss/oxide`, `esbuild`) is
pnpm's default posture and does not affect the build.

## 3.2 Typecheck

```
$ pnpm run check
> russell-capital-unified@1.0.0 check
> tsc --noEmit
exit=0
```

✅ Zero type errors across 174 shared modules, 325 pages, and the server.

## 3.3 Build

```
$ pnpm run build
[build] 330 route patterns written to dist/public/routes.json
[build] Frontend emitted to dist/public with esbuild code splitting and compiled Tailwind CSS.
  dist/index.js  3.8mb
exit=0
```

✅ Clean. 404 output files. **330 route patterns** — matches
`shared/routeManifest.ts` exactly.

## 3.4 Tests — the project's own CI gate

```
$ pnpm run test:ci
Test Files  194 passed (194)
     Tests  3757 passed | 5 skipped (3762)
```

✅ **Zero failures.** `test:ci` excludes ~25 suites requiring a live database or
external service.

## 3.5 Tests — the full suite, nothing excluded

```
$ pnpm test
Test Files  216 passed | 9 skipped (225)
     Tests  4138 passed | 82 skipped (4220)
```

✅ **Zero failures here too.** The suites `test:ci` excludes do not fail without a
database — they self-skip. The exclusion list in `package.json` is therefore
**more conservative than it needs to be**, and is a cleanup candidate (Phase A).

## 3.6 Comparison against the donors

Identical methodology; donor baselines measured on untouched checkouts.

| | canonical | rc-app | rc |
|---|---|---|---|
| Install | ✅ | ✅ | ✅ |
| Typecheck | ✅ | ✅ | ✅ |
| Build | ✅ | ✅ (`build:vercel`) | ✅ |
| Test files failing | **0** | 24 | 20 |
| Tests failing | **0** | 102 | 93 |
| Tests passing | **4138** | 2096 | 2117 |

The canonical base has roughly **twice the passing tests and none of the failures.**
This is the strongest single argument for the base selection and the reason no
donor test suite should replace it.

## 3.7 Security posture

Secret scan across 1,772 tracked non-binary files:

| Pattern | Files |
|---|---|
| `sk-…` (OpenAI-style) | 0 |
| `AKIA…` (AWS) | 0 |
| `re_…` (Resend) | 0 |
| `ghp_…` (GitHub PAT) | 0 |
| `xox[baprs]-` (Slack) | 4 — **all placeholders** |
| `BEGIN … PRIVATE KEY` | 0 |

The four Slack matches are `xoxb-1234567890`, `xoxb-EXAMPLE-`,
`xoxb-EXAMPLE-PLACEHOLDER` in `audit/`, `client/src/pages/portal/Integrations.tsx`,
and a handoff transcript. ✅ **No live credential found in the canonical base.**

By contrast `russell-capital` carries three working dashboard passwords in
`shared/accessControl.ts` — a module the client bundle imports. That is one reason
it is a scoped donor and not a base.

## 3.8 Reproducing this

```bash
git clone --depth 1 https://github.com/samtheinsuranceman-debug/sam-russell-corpus
cd sam-russell-corpus/russell-capital-systems
pnpm install --prefer-offline
pnpm run check && pnpm run build && pnpm test
```

## 3.9 What is NOT verified here

Honest limits of the above:

- **No runtime verification.** Nothing was started against a live database; no page
  was loaded in a browser. "Builds" is not "runs".
- **No deployment verification.** No DNS, host, or environment was inspected or
  touched, per the standing directive.
- **9 suites self-skip** without a database, so their assertions are unproven here.
- **Donor page quality is unassessed.** 394 new routes exist; whether the pages
  behind them work is a Phase B question, not answered by this PR.
