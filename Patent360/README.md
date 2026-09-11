# Patent360 MCP Hub v2

Production MCP (Model Context Protocol) server for Patent360. Built on
Node.js 20+, TypeScript, native `node:http`, and the
`@modelcontextprotocol/server` v2 SDK. No Express or other HTTP
framework is used.

Repository: https://github.com/samtheinsuranceman-debug/sam-russell-corpus

## Overview

The hub exposes two read-only MCP tools (`health_check`, `echo`) over a
bearer-protected `POST /mcp` endpoint, plus public `/` (landing page) and
`GET /api/health` endpoints for monitoring and Railway healthchecks.

## Environment variables

| Variable      | Required | Default   | Description                                              |
|---------------|----------|-----------|------------------------------------------------------------|
| `MCP_API_KEY` | yes      | -         | Shared secret bearer token required to call `POST /mcp`. Minimum 32 characters. |
| `PORT`        | no       | `3000`    | Port the HTTP server listens on (injected by Railway).     |
| `MCP_PORT`    | no       | `3000`    | Local-development fallback port if `PORT` is unset.        |
| `MCP_HOST`    | no       | `0.0.0.0` | Host the HTTP server binds to.                             |

`MCP_API_KEY` must be set for the process to start at all — startup
fails fast if it is missing or shorter than 32 characters. There are no
hardcoded credentials anywhere in this codebase. See `.env.example`.

## Setup

```bash
cd Patent360
npm install
npm run build
npm start
```

The server listens on `0.0.0.0:$PORT` (defaults to `3000`).

## API endpoints

- `GET /` — public HTML landing page showing the derived MCP URL.
- `GET /api/health` — public JSON health check (`{ ok, service, version, timestamp }`).
- `POST /mcp` — MCP JSON-RPC endpoint. Requires `Authorization: Bearer <MCP_API_KEY>`.

## MCP tools

Both tools are read-only and require the `mcp:read` scope, which is
granted automatically to any request that presents a valid
`MCP_API_KEY`.

- `health_check` — returns a status content block describing hub health.
- `echo` — returns the input `text` as a content block.

## Security

- Bearer token comparison is timing-safe: both the candidate and
  expected key are SHA-256 hashed and compared with
  `crypto.timingSafeEqual`.
- Minimum `MCP_API_KEY` length is enforced (32 characters) at startup.
- Host and Origin headers are validated against the deployment's public
  domain.
- Baseline security headers are applied to every response
  (`Content-Security-Policy: default-src 'none'`, `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, and `Strict-Transport-Security` when served over HTTPS).
- Per-IP rate limiting: 60 requests/minute.
- Request bodies are capped at 1 MiB.
- The bearer token is never logged; log output only ever includes a
  redacted placeholder (`<redacted:NNchars>`).

## Build & tooling

- `npm run build` — compiles `src/` to `dist/` with `tsc`.
- `npm start` — runs `dist/index.js`.
- `npm test` — placeholder; the real test suite runs in CI only (see
  `tests/`).

`tests/` contains stub test files (`source-contract.test.ts`,
`crypto.test.ts`) describing the expected auth and tool contracts. They
are documentation of intent, not executed CI assertions in this
environment. `examples/client.ts` is a manual smoke script that
exercises the public routes and both tools against a running instance.

## Deployment

Deployed on Railway using the Railpack builder (see `railway.json`) —
no Dockerfile is required or present in this directory. The build runs
`npm run build`, the process starts with `npm start`, and Railway
healthchecks hit `GET /api/health`.
