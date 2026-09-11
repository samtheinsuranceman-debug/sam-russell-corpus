# Security Review — Patent360 MCP Hub

This document summarizes the security posture of the Patent360 MCP Hub as implemented.

## Authentication

- All calls to `POST /mcp` require an `Authorization: Bearer <token>` header.
- Missing or malformed headers, and tokens that do not match `MCP_API_KEY`, are rejected with `401 Unauthorized` and a `WWW-Authenticate: Bearer realm="Patent360 MCP Hub"` response header.
- Token comparison uses `crypto.timingSafeEqual` (constant-time comparison) to avoid leaking information via timing side channels.
- On success, `{ scopes: ['mcp:read'] }` is attached to the request context and re-validated inside every individual tool handler before it executes any logic.

## Rate Limiting

- 60 requests per minute per client IP, enforced via an in-memory `Map<ip, timestamp[]>`.
- Entries older than 60 seconds are pruned on every check.
- **Limitation**: this store is process-local. It is **not** persistent across restarts and is **not** shared across multiple replicas. If this service is scaled beyond a single replica, rate limiting should be migrated to a shared store (e.g. Redis) — noted here as a future improvement.

## Request Size Limits

- The `/mcp` endpoint enforces a 1 MiB request body cap via `express.json({ limit: '1mb' })`. Oversized requests are rejected by Express before reaching application logic.

## Input Validation

- Every tool parameter is validated with a strict Zod schema (`.strict()`), rejecting unknown properties.
- `echo.message` is capped at 1024 characters; validation failures produce descriptive error messages rather than opaque failures.
- `health_check` takes no parameters and rejects any unexpected input.

## Authorization Scopes

- The only scope currently issued is `mcp:read`.
- Both tools (`health_check`, `echo`) are read-only — neither mutates state — and both explicitly check for `mcp:read` in the request's `auth.scopes` before executing, independent of the transport-level auth check.

## Timeout Protection

- Every tool invocation is wrapped in a 5-second timeout. If a handler does not resolve within that window, the call is rejected rather than left to hang indefinitely.

## Logging

- All structured logs are passed through `sanitizeLog`, which recursively redacts any object key containing `key`, `secret`, `token`, `password`, or `auth` (case-insensitive).
- Raw request bodies, Authorization headers, and API keys are never logged, including in error paths.
- Error responses in production never include stack traces; each error response includes a generated `request_id` (UUID v4) for correlation with server-side logs.

## Future Work

- **AES-256-GCM helper**: `src/utils.ts` exports `createCryptoHelper()`, a ready-to-use AES-256-GCM encrypt/decrypt helper. It is intentionally **not** wired into any current code path — it exists in anticipation of future Railway provider secret integration, at which point secrets may need to be encrypted at rest or in transit.
- **Distributed rate limiting**: migrate the in-memory rate limit store to Redis (or similar) if this service is ever scaled to multiple replicas.

## HTTPS / Transport Security

- This service binds to plain HTTP on `0.0.0.0:$PORT`. TLS termination is expected to be handled by Railway's edge/reverse proxy, consistent with standard Railway deployment practice. No HTTPS enforcement is performed at the application layer.
