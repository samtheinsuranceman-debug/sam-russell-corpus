# Patent360 and Doctor Buddy are separate entities

**Decided by:** Samuel A. Russell V, 2026-09-22
**Rule:** neither product lives inside Russell Capital Systems. Both keep running as
their own projects. Nothing is merged into RCS, and **nothing is deleted on Railway.**

## Neither was ever coupled to RCS

Verified by search before any change:

| Direction | Result |
|---|---|
| RCS app → Patent360 / Doctor Buddy | 0 references in `client/src`, `server/`, `shared/` |
| Patent360 → anything outside `Patent360/` | 0 imports |
| Doctor Buddy → anything outside `doctor-buddy/` | 0 imports |

Doctor Buddy has its own `wealthGenomeDurability.ts` and `genomeBridge.ts` — its own
copies of the idea, not imports from RCS. Both products stand alone as written.
They were roommates in one repository, never dependencies.

## Patent360 — already its own entity. Removed from RCS.

It already has everything it needs elsewhere:

| | |
|---|---|
| Repository | `samtheinsuranceman-debug/Patent360`, branch `main`, last push 2026-09-13 |
| Railway project | `Patent360` (`48e06266-8271-455d-a96c-e4394f074454`) |
| Service | `Patent360` (`3714036e-3a43-4fe3-957a-4da813ee095e`), deploying from that repo |
| Live at | `patent360-production-fb27.up.railway.app` |

The copy inside this repository was a stale duplicate — last touched 2026-09-12, a day
older than the standalone repo. Deleting it loses nothing. **Done on this branch:**
`Patent360/` (203 files), `patent360-build-2026-09-18.zip`, `patent360-master.zip`.

## Doctor Buddy — not yet its own entity. Still here, on purpose.

This is the finding that changed the plan. Doctor Buddy has **no repository of its own.**

| | |
|---|---|
| Repository | none exists |
| Only source | `doctor-buddy/` in this repo — 336 files, v2.2, last touched 2026-09-16 |
| Only real deployment | service `doctor-buddy` in the **RCS** Railway project |
| `DoctorBuddy-Emergent-Preview` | `nginx:alpine` serving a base64 HTML blob — a preview card, not the app |
| `doctor-buddy-emergent-preview` | the same thing, created three minutes earlier |

Deleting `doctor-buddy/` from this repository today would leave its only copy in git
history and take its only running deployment down with the next build. So it stays
until it has somewhere to go.

**The order is: give it a home, then remove it from here.**

1. Create `samtheinsuranceman-debug/doctor-buddy` (private).
2. Push `doctor-buddy/` to it as the repository root, history preserved.
3. Create a Railway project `doctor-buddy`, pointed at that repo.
4. Carry across the 48 environment variables from the current service, including
   `DATABASE_URL` and the HIPAA posture flags.
5. Confirm the new deployment serves `/healthz` and the database is reachable.
6. Only then: delete `doctor-buddy/` and `.github/workflows/drbuddy-probe.yml` from
   this repository, and remove the `doctor-buddy` service from the RCS project.

Step 6 is the only step that destroys anything, and it comes last.

## Railway — what to leave alone

**Do not delete any Railway project.** Both products keep running. The only Railway
changes in scope are inside the RCS project, and only to stop RCS hosting other
people's products:

| Service in project `russell-capital-systems` | ID | Action |
|---|---|---|
| `patent360` | `189fd66c-7431-4439-9a55-f530923bf333` | Remove — duplicate of the standalone `Patent360` project |
| `patent360-web` | `4e598b8e-a87d-4d17-a580-977047e1e2e9` | Remove — never deployed, empty |
| `doctor-buddy` | `0e8e1dde-580f-4afd-ba0f-1771efa34387` | Remove **only after** its own project is live |

Leave untouched: projects `Patent360`, `DoctorBuddy-Emergent-Preview`,
`doctor-buddy-emergent-preview`, and everything in them.

## Open pull requests

**#176** — "Patent360: authenticated DATABASE_URL-backed matters/deadlines APIs" — is
written against this repository. It belongs in the `Patent360` repo instead. Close it
here; re-open it there if the work is still wanted.

Also Patent360, now out of scope for this repo: **#145, #144, #143, #142, #141**.
Stale branch: `origin/feature/patent360-mcp-security`.

## Effect on the live site

None. `www.russellcapitalsystems.com` is the `web` service, whose build watch pattern
is `/russell-capital-systems/**`. Nothing removed here sits inside that path.
Re-verified after the deletion: typecheck clean, build clean at 321 routes,
3,439 tests passing.
