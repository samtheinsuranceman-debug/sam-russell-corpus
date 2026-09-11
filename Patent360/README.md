# Patent360 MCP Hub v2

Production MCP (Model Context Protocol) server for Patent360, part of the
Russell Capital Systems platform. Built on Node.js 20+, TypeScript, Express 5,
and the `@modelcontextprotocol/server` v2 SDK.

## Overview

The hub exposes a small set of read-only MCP tools over a bearer-protected
`/mcp` endpoint, plus public health/landing endpoints for monitoring and
Railway healthchecks.

## Environment variables

| Variable     | Required | Default | Description                                            |
|--------------|----------|---------|----------------------------------------------------------|
| `MCP_TOKEN`  | yes      | -       | Shared secret bearer token required to call `POST /mcp`  |
| `PORT`       | no       | `3000`  | Port the HTTP server listens on (injected by Railway)     |
| `NODE_ENV`   | no       | -       | `production` / `development` / `test`                    |
| `LOG_LEVEL`  | no       | `info`  | Reserved for future structured logging configuration      |

`MCP_TOKEN` must be set for the server to accept any `/mcp` requests. There
are no hardcoded credentials anywhere in this codebase.

## Setup

```bash
cd Patent360
npm install
npm run build
npm run start
```

The server listens on `0.0.0.0:$PORT` (defaults to `3000`).

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run build       # tsc -> dist/
npm run test        # local smoke test against a running instance
```

The smoke test (`scripts/smoke-test.js`) exercises the public routes, the
bearer-auth flow on `/mcp`, tool listing, tool invocation, and rate limiting.
Start the server first (e.g. `PORT=3001 MCP_TOKEN=test-token npm run start`)
and then run `npm run test` in a separate shell.

## API endpoints

- `GET /` — public landing page (JSON)
- `GET /api/health` — public healthcheck, returns `{ ok, timestamp, uptime, version }`
- `POST /mcp` — MCP protocol endpoint, requires `Authorization: Bearer <MCP_TOKEN>`

## Tools

Both tools require the `mcp:read` capability and are read-only:

- `health_check` — returns `{ status: "ok", timestamp, version }`
- `echo` — accepts `{ text: string (max 1000 chars) }`, returns `{ echoed, length }`

## Security

- Timing-safe bearer token comparison via `crypto.timingSafeEqual`
- Exact Host/Origin whitelist validation
- Per-IP in-memory rate limiting (100 requests/minute)
- Request body size capped at 1 MiB
- Tool execution timeout of 30 seconds
- Sanitized logging — no secrets, tokens, or request bodies are ever logged
- Graceful shutdown on `SIGTERM` / `SIGINT`
