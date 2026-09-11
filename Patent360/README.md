# Patent360 MCP Hub

Node.js/TypeScript MCP Server v2.0.0 for secure, Railway-native AI integration.

## Overview

Patent360 MCP Hub exposes a minimal, read-only Model Context Protocol (MCP)
server over HTTP, built on `@modelcontextprotocol/server` and
`@modelcontextprotocol/node` using the `createMcpHandler` + `toNodeHandler`
pattern. It is designed to run as a single Railway service with strict
security defaults and no hand-written JSON-RPC.

## Features

- Modern MCP transport via `createMcpHandler` + `toNodeHandler` — no manual JSON-RPC handling
- Bearer token authentication with constant-time comparison
- Exact host/origin validation via `ALLOWED_HOSTS`
- In-memory IP rate limiting (60 requests / minute)
- 1 MiB request body size cap on `/mcp`
- Strict Zod input validation on every tool
- 5-second execution timeout enforced per tool call
- Two read-only tools: `health_check` and `echo` — no state mutation
- Structured, sanitized logging — API keys, tokens, and raw bodies are never logged
- Railway-native health checks and Railpack build

## Quick Start

```bash
npm install
npm run build
MCP_API_KEY=xxx npm start
```

For local iteration without a build step:

```bash
npm install
MCP_API_KEY=xxx npm run dev
```

## Environment Variables

| Variable        | Required | Default                   | Description                                                        |
| --------------- | -------- | -------------------------- | -------------------------------------------------------------------- |
| `PORT`          | No       | `3000`                     | Port the HTTP server binds to.                                       |
| `MCP_API_KEY`   | Yes      | —                           | Bearer token required to call `/mcp`.                                |
| `ALLOWED_HOSTS` | No       | `localhost,127.0.0.1`      | Comma-separated list of hostnames permitted to reach this service.   |
| `NODE_ENV`      | No       | `development`              | Set to `production` on Railway; disables local dev host bypass.      |

## API Endpoints

| Method | Path          | Auth        | Description                                   |
| ------ | ------------- | ----------- | ---------------------------------------------- |
| GET    | `/`           | None        | Landing page for Patent360 MCP Hub.            |
| GET    | `/api/health` | None        | Public health check, returns uptime & version. |
| POST   | `/mcp`        | Bearer token| MCP protocol endpoint (tools/list, tools/call).|

## Security

- **Auth model**: Requests to `/mcp` must include `Authorization: Bearer <MCP_API_KEY>`. Missing or malformed headers, and invalid tokens, return `401` with a `WWW-Authenticate: Bearer realm="Patent360 MCP Hub"` header. Token comparison is constant-time.
- **Scopes**: Successful auth attaches `{ scopes: ['mcp:read'] }` to the request; every tool handler re-checks this scope before executing.
- **Rate limiting**: 60 requests per minute per IP, enforced in-memory.
- **Validation**: All tool inputs are validated with strict Zod schemas (e.g. `echo.message` is capped at 1024 characters).
- **Timeouts**: Every tool call is bounded to 5 seconds.
- **Logging**: Structured logs redact any key containing `key`, `secret`, `token`, `password`, or `auth`. Raw request bodies and Authorization headers are never logged.

See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md) for full details.

## Smoke Test

With the server running locally (`MCP_API_KEY=test npm start`), run:

```bash
node scripts/mcp-smoke.mjs
```

This exercises health checks, auth rejection paths, and both MCP tools, printing a PASS/FAIL line per test and exiting non-zero on any failure.
