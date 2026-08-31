# Core Workflow Verification

The imported client directory and detail workflows now operate against the managed `clients` table rather than an absent source database. A rollback-only integration test performed a real workspace insert, client insert, client read, client update, and post-rollback absence check. No verification record remains in the database.

The new Planning Cases workspace is a primary Client Journey destination at `/portal/planning-cases`. Its protected tRPC API scopes every request to the authenticated user's workspace, validates linked-client ownership, and persists case title, client association, status, stage, assumptions, recommendation summary, workflow state, timestamps, and case notes. Advisors can create a case, save progress, advance stages, archive a case, and add timestamped notes. The UI includes explicit loading, empty, failure, retry, and saving states.

The main dashboard now reads persisted planning cases and displays Active Planning Cases plus review count. It provides a real-data empty state and a retryable error state alongside the existing client and pipeline metrics. It does not display live AUM; the empty state explicitly states that no fabricated client or AUM data is shown.

Validation completed:

| Check | Result |
|---|---|
| Planning API unit tests | 4 passed |
| Planning UI integration tests | 4 passed |
| Live rollback-only client CRUD | Passed; no retained row |
| Persistence and table tests | 5 passed |
| TypeScript after workflow integration | Passed |
| Planning route and primary navigation | Registered; authenticated browser content pending final OAuth round trip |

Additional integration coverage now loads the actual client directory and detail modules, verifies their protected tRPC contracts, validates directory loading/empty/retry states, confirms client form validation and save feedback, and requires a profile refetch after update before reporting success. The dashboard now tracks loading, empty, error, and retry behavior across practice metrics, planning cases, analytics, history, activity, top clients, allocation, goals, meetings, and coaching. Four focused suites currently pass 14 tests; authenticated browser create/edit/reload verification remains reserved for the final managed OAuth round trip.
