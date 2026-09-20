# Consolidation Foundation — Verification of the Live Build

**Date:** 20 September 2026 · Commands run in `russell-capital-systems/`

| Check | Command | Result |
|---|---|---|
| Toolchain | `node -v` / `pnpm -v` | node v22.22.2 · pnpm 10.34.2 |
| Install | `node_modules` present, lockfile `pnpm-lock.yaml` | OK |
| Typecheck | `pnpm check` (`tsc --noEmit`) | **exit 0 · 0 errors** |
| Build | `pnpm build` | **exit 0** · `dist/index.js` 3.2 MB · **313 route patterns** written to `dist/public/routes.json` |
| CI tests | `pnpm test:ci` | **exit 0** · 163 files · 2877 passed · 3 skipped |
| Full tests | `pnpm test` | **exit 0** · 194 files (185 passed, 9 skipped) · 3258 passed · 80 skipped |

## Notes

- The build's own route emitter reports **313 patterns**, independently confirming the route count
  used throughout these documents.
- `test:ci` excludes 25 test files that `test` includes. **Both suites pass**, so the exclusions are
  not masking failures — they appear to be slower or integration-shaped tests. No action required,
  but CI should run the full suite where runtime allows.
- Secret scan over tracked files found **no live credentials**; the only pattern hit is a clearly
  labelled placeholder in `client/src/pages/portal/Integrations.tsx`.

## Regression baseline

These numbers are the baseline. Any consolidation PR must match or improve them:

```
typecheck errors : 0
build            : success, 313 routes
test:ci          : 2877 passed / 0 failed
test (full)      : 3258 passed / 0 failed
```
