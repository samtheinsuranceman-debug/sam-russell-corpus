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
