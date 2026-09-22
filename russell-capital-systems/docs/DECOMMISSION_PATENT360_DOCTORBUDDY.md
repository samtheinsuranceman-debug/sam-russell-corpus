# Decommission: Patent360 and Doctor Buddy

**Decided by:** Samuel A. Russell V, 2026-09-22
**Scope:** remove both products from the Russell Capital Systems program.

## Why this was safe to do in one pass

Neither product shared a single line of code with the application. Verified by
search across `client/src`, `server/` and `shared/` before deletion:

| Search | Hits in the app |
|---|---|
| `patent360`, `patent-360` | 0 |
| `doctor-buddy`, `doctorBuddy`, `doctor_buddy`, `dr buddy` | 0 |

They were siblings in the repository, not dependencies of it. Each was its own
Railway service pointed at its own `rootDirectory` in this same repo.

## Removed from the repository

| Path | Size | What it was |
|---|---|---|
| `Patent360/` | 123 MB | Python / FastAPI app (`uvicorn app.main:app`), own Dockerfile and `requirements.txt` |
| `doctor-buddy/` | 18 MB | Node app, own Drizzle schema and `DATABASE_URL`, HIPAA posture flags |
| `patent360-build-2026-09-18.zip` | — | build snapshot |
| `patent360-master.zip` | — | build snapshot |
| `.github/workflows/drbuddy-probe.yml` | — | CI probe against `doctor-buddy-production.up.railway.app` |

542 paths in total.

## Deliberately kept

Written records are not program wiring, and deleting them would erase history
rather than scope:

- `DOCTOR_BUDDY_HANDOFF_2026-09-16.md` — the handoff record
- `patents/2026-09-18/` — the RCS patent archive (its own claims; unrelated to the Patent360 product)
- `russell-capital-systems/shared/patentStatus.ts` — guards RCS's own "patent pending" language; nothing to do with Patent360
- Passing mentions in `buddy_memory/`, the corpus, and the session transcripts

## Still live on Railway — requires owner action

Deleting a Railway service is irreversible and was **not** performed. Until these
are removed, merging this branch to `master` will leave three services pointing at
directories that no longer exist, and their next build will fail.

Workspace `samtheinsuranceman-debug's Projects`:

**Inside project `russell-capital-systems` (`a16ef4bb-3aea-4147-a751-20661ae76eb8`):**

| Service | ID | Source | State |
|---|---|---|---|
| `patent360` | `189fd66c-7431-4439-9a55-f530923bf333` | master · `/Patent360` | live, last deploy 2026-09-18 |
| `patent360-web` | `4e598b8e-a87d-4d17-a580-977047e1e2e9` | — | never deployed |
| `doctor-buddy` | `0e8e1dde-580f-4afd-ba0f-1771efa34387` | master · `/doctor-buddy` | live, last deploy 2026-09-16 |

**Standalone projects:**

| Project | ID |
|---|---|
| `Patent360` | `48e06266-8271-455d-a96c-e4394f074454` |
| `DoctorBuddy-Emergent-Preview` | `1a281b4a-0641-47dc-a349-8f004709c469` |
| `doctor-buddy-emergent-preview` | `e2b6415e-fd15-47f5-b103-dc51f9c645c7` |

**Before deleting the `doctor-buddy` service, export its database.** It carries its
own `DATABASE_URL` and health-related records under a declared HIPAA posture. The
service holds no Railway volume, so the data lives in whatever that variable points
at; confirm where, and take a dump, before anything is torn down.

## Open pull requests to close

Patent360 work, now out of scope: **#176, #145, #144, #143, #142, #141**.
Stale branch: `origin/feature/patent360-mcp-security`.

## Effect on the live site

None. `www.russellcapitalsystems.com` is served by the `web` service, whose build
watch pattern is `/russell-capital-systems/**`. Nothing deleted here is inside that
path, and the application's typecheck, build and test suite were re-run after the
deletion to confirm it.
