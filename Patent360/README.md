# Patent360

One service: the application, the REST API, and an MCP connector, built and
deployed together from this directory.

No secrets are committed to this repository.


## MCP connector

`POST /mcp` is a Model Context Protocol server over the Streamable HTTP
transport. An AI client can initialize, discover the tools and call them:

    https://patent360-production.up.railway.app/mcp

Four read-only tools. None of them writes, files or sends anything.

| Tool | What it does |
|---|---|
| `health_check` | Service status, deployed version, which connectors are configured |
| `connector_inventory` | Every upstream connector and whether its key is set — names only, never values |
| `funding_eligibility` | The fixed-rate-only rule. Fixed is eligible, HELOC refused, variable/ARM referred for manual review |
| `evidence_fingerprint` | Stable SHA-256 over canonical JSON, so a record can later be shown unchanged |

### Connecting

The endpoint is closed by default. Set `MCP_API_KEY` on the service (Railway →
patent360 → Variables) to a long random value, then connect with:

    Authorization: Bearer <that value>

With no key set the endpoint answers `503` rather than serving an open tool
surface. A missing or wrong token gets `401` with a `WWW-Authenticate: Bearer`
header.

Optionally set `MCP_ALLOWED_ORIGINS` to a comma-separated list to permit
browser callers; with it unset, any request carrying an `Origin` header is
refused, which is what stops DNS-rebinding attacks.

### Notes on the transport

- One endpoint. `POST` carries every message; `GET` answers `405` with an
  `Allow` header because this server offers no server-initiated stream, and
  `DELETE` ends a session.
- `initialize` mints an `Mcp-Session-Id`. Later requests must present it; an
  unknown session gets `404`, the client's cue to re-initialize.
- Protocol versions `2025-06-18` and `2025-03-26` are supported, negotiated at
  initialize.
- JSON-RPC batching was removed from the spec in `2025-06-18` and is refused
  with a reason rather than half-handled.
- Tool results come back as text content *and* `structuredContent`, and the
  tool functions are the same ones the REST routes call, so the two surfaces
  cannot drift apart.

### Tests

    python Patent360/tests/test_mcp.py

Drives the full client handshake — initialize, initialized, discovery, calls,
error paths, session lifecycle — because a broken handshake shows up as an AI
client silently seeing zero tools, which is invisible from the outside.

## Operational data (Matters + Deadlines)

Matters and deadlines are persisted server-side and scoped to the authenticated
session identity (`/api/auth/login` cookie). Every matter/deadline query checks
ownership on the server: guessing another user's ID returns `404`.

### Required environment

- `DATABASE_URL` (**required for operational data endpoints**)
  - Local development example (explicit local-only file):
    - `sqlite:///./patent360-dev.db`
  - Production example:
    - `postgresql+psycopg2://...`
- `SESSION_SECRET` (required for stable session signing across restarts)
- `PATENT360_USERS` (JSON account document used by existing auth flow)

No fallback database is auto-selected. If `DATABASE_URL` is unset, operational
data endpoints fail closed with `503`.

### Local setup

```bash
cd Patent360
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL='sqlite:///./patent360-dev.db'
export SESSION_SECRET='replace-with-long-random-value'
export PATENT360_USERS='{\"a.reyes@firm.com\":{\"hash\":\"...\",\"role\":\"attorney\"}}'
uvicorn app.main:app --reload
```

Schema bootstrap is automatic at service startup (`CREATE TABLE IF NOT EXISTS`).

### API surface

- Matters:
  - `GET /api/matters`
  - `POST /api/matters`
  - `GET /api/matters/{matter_id}`
  - `PUT /api/matters/{matter_id}`
  - `DELETE /api/matters/{matter_id}`
- Deadlines:
  - `GET /api/deadlines` (ordered by `due_date` then `id`)
  - `POST /api/deadlines`
  - `GET /api/deadlines/{deadline_id}`
  - `PUT /api/deadlines/{deadline_id}`
  - `DELETE /api/deadlines/{deadline_id}`

Validation is strict (length limits, allowed statuses, typed dates). Malformed
payloads and malformed dates are rejected with `422`.

### Deadline classification

Deadlines are classified for docket visibility:

- `completed`: deadline `status == "completed"`
- `overdue`: open deadline with due date before UTC today
- `due_soon`: open deadline due in `0..7` days (UTC date basis)
- `upcoming`: open deadline due in more than 7 days

This classification is an operational tracking aid only; it is not legal advice
or an automatic docketing guarantee.

### Focused tests

```bash
python3 tests/test_auth.py
python3 tests/test_uspto.py
python3 tests/test_mcp.py
python3 tests/test_operational_data.py
```
