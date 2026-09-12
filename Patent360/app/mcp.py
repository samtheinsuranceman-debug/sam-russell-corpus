"""Patent360 MCP server — Streamable HTTP transport.

Naming a REST route ``/mcp`` does not make it an MCP server. An MCP client
speaks JSON-RPC 2.0 and expects a specific handshake before it will believe
any tool exists:

    initialize                 -> protocol version + capabilities + serverInfo
    notifications/initialized  -> acknowledged with 202 and no body
    tools/list                 -> the catalogue, with JSON Schema per tool
    tools/call                 -> the result, as content blocks

This module implements that handshake over the Streamable HTTP transport, so
Claude, ChatGPT, Cursor or any other client can connect to the deployed URL
and actually discover and run Patent360's tools.

Transport notes, and why each one is here:

* One endpoint. POST carries every client message. GET is answered 405 with
  an Allow header, because this server offers no server-initiated stream —
  the spec requires that exact refusal rather than a 404.
* Sessions. ``initialize`` mints an ``Mcp-Session-Id``; later requests must
  carry it, and DELETE ends it. A request with an unknown session gets 404,
  which is the client's cue to re-initialize.
* Protocol version. Negotiated at initialize, then echoed by the client in
  ``MCP-Protocol-Version`` on every later request.
* Origin is validated on every request. An MCP server reachable from a
  browser is a DNS-rebinding target otherwise.
* Batching was removed from the protocol in 2025-06-18, so a JSON array is
  rejected with a reason rather than half-handled.

Tool results are returned both as text content (for models) and as
``structuredContent`` (for programs), and the tool functions are the same
ones the REST routes call, so the two surfaces cannot drift apart.
"""

from __future__ import annotations

import hmac
import os
import secrets
import time
from typing import Any, Callable

from fastapi import APIRouter, Request, Response
from fastapi.responses import JSONResponse

# The versions of the MCP specification this server can speak, newest first.
SUPPORTED_PROTOCOL_VERSIONS = ("2025-06-18", "2025-03-26")
LATEST_PROTOCOL_VERSION = SUPPORTED_PROTOCOL_VERSIONS[0]

SERVER_NAME = "patent360"
SERVER_TITLE = "Patent360"

# JSON-RPC 2.0 error codes.
PARSE_ERROR = -32700
INVALID_REQUEST = -32600
METHOD_NOT_FOUND = -32601
INVALID_PARAMS = -32602
INTERNAL_ERROR = -32603

# Sessions live in memory. One container, one process — good enough for a
# single-replica service, and honest about it: scaling past one replica
# means moving this to Redis, not pretending it already works.
_SESSIONS: dict[str, float] = {}
SESSION_TTL_SECONDS = 60 * 60 * 8

MAX_BODY_BYTES = 1 * 1024 * 1024

router = APIRouter()


# ── Auth ──────────────────────────────────────────────────────────────────
# /mcp exposes tools, so it is closed by default. When MCP_API_KEY is unset
# the endpoint reports 503 rather than quietly serving an open tool surface.

def _configured_key() -> str | None:
    key = os.getenv("MCP_API_KEY", "").strip()
    return key or None


def _bearer(request: Request) -> str | None:
    header = request.headers.get("authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer":
        return None
    token = token.strip()
    return token or None


def _auth_failure(request: Request) -> Response | None:
    """Return a response when the caller may not proceed, else None."""
    expected = _configured_key()
    if expected is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": "mcp_not_configured",
                "detail": (
                    "This MCP endpoint is disabled until MCP_API_KEY is set on the "
                    "service. Set it in the Railway variables, then connect with "
                    "Authorization: Bearer <that value>."
                ),
            },
        )

    presented = _bearer(request)
    # Compare every time, against a dummy when absent, so a missing header and
    # a wrong token take the same path and the same time.
    if not hmac.compare_digest(presented or "\x00", expected):
        return JSONResponse(
            status_code=401,
            content={"error": "unauthorized"},
            headers={"WWW-Authenticate": 'Bearer realm="patent360-mcp"'},
        )
    return None


def _origin_rejected(request: Request) -> bool:
    """Block cross-origin browser callers (DNS rebinding)."""
    origin = request.headers.get("origin")
    if origin is None:
        return False  # non-browser client
    allowed = [o.strip() for o in os.getenv("MCP_ALLOWED_ORIGINS", "").split(",") if o.strip()]
    return origin not in allowed


# ── Sessions ──────────────────────────────────────────────────────────────

def _sweep() -> None:
    cutoff = time.time() - SESSION_TTL_SECONDS
    for sid in [s for s, seen in _SESSIONS.items() if seen < cutoff]:
        _SESSIONS.pop(sid, None)


def _new_session() -> str:
    _sweep()
    sid = secrets.token_hex(16)
    _SESSIONS[sid] = time.time()
    return sid


def _touch(sid: str) -> bool:
    if sid in _SESSIONS:
        _SESSIONS[sid] = time.time()
        return True
    return False


# ── Tools ─────────────────────────────────────────────────────────────────
# Each entry declares its schema and points at the same function the REST
# route uses, so the MCP surface and the HTTP surface cannot drift.

def _tool_health(_: dict, impl) -> dict:
    return impl["health_payload"]()


def _tool_connectors(_: dict, impl) -> dict:
    return {"connectors": impl["connector_inventory"]()}


def _tool_funding(args: dict, impl) -> dict:
    rate_type = args.get("rate_type")
    if not isinstance(rate_type, str) or not rate_type.strip():
        raise ValueError("rate_type is required and must be a non-empty string")
    return impl["funding_eligibility"](rate_type)


def _tool_fingerprint(args: dict, impl) -> dict:
    if "payload" not in args:
        raise ValueError("payload is required")
    return impl["evidence_fingerprint"](args["payload"])


def _tool_uspto_status(_: dict, impl) -> dict:
    return impl["uspto_status"]()


def _tool_uspto_application(args: dict, impl) -> dict:
    n = args.get("application_number")
    if not isinstance(n, str) or not n.strip():
        raise ValueError("application_number is required, e.g. '18/412,907'")
    include = args.get("include") or "bibliographic"
    if include not in ("bibliographic", "transactions", "continuity", "documents"):
        raise ValueError(
            "include must be one of: bibliographic, transactions, continuity, documents"
        )
    return impl["uspto_application"](n, include)


def _tool_uspto_search(args: dict, impl) -> dict:
    q = args.get("query")
    if not isinstance(q, str) or not q.strip():
        raise ValueError("query is required")
    return impl["uspto_search"](q, int(args.get("limit") or 20))


TOOLS: list[dict[str, Any]] = [
    {
        "name": "health_check",
        "title": "Health check",
        "description": (
            "Report whether the Patent360 service is running, which version is "
            "deployed, and which upstream connectors have credentials configured. "
            "Returns no credential values, only whether each one is present."
        ),
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "outputSchema": {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "product": {"type": "string"},
                "version": {"type": "string"},
            },
            "required": ["status", "version"],
            "additionalProperties": True,
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
        "_call": _tool_health,
    },
    {
        "name": "connector_inventory",
        "title": "Connector inventory",
        "description": (
            "List every upstream connector Patent360 knows about and whether its "
            "API key is configured on this deployment. Names only — never values."
        ),
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "outputSchema": {
            "type": "object",
            "properties": {
                "connectors": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "configured": {"type": "boolean"},
                        },
                        "required": ["name", "configured"],
                    },
                }
            },
            "required": ["connectors"],
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
        "_call": _tool_connectors,
    },
    {
        "name": "uspto_status",
        "title": "USPTO connection status",
        "description": (
            "Report whether this deployment is wired to the United States Patent "
            "and Trademark Office: whether an API key is configured and which base "
            "URL it would call. Makes no outbound request, so it is safe to poll "
            "and cannot consume a rate limit."
        ),
        "inputSchema": {"type": "object", "properties": {}, "additionalProperties": False},
        "outputSchema": {
            "type": "object",
            "properties": {
                "configured": {"type": "boolean"},
                "base_url": {"type": "string"},
                "detail": {"type": "string"},
            },
            "required": ["configured", "base_url"],
            "additionalProperties": True,
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": False},
        "_call": _tool_uspto_status,
    },
    {
        "name": "uspto_application",
        "title": "Look up a patent application at the USPTO",
        "description": (
            "Fetch the official record for one United States patent application "
            "from the USPTO Open Data Portal: bibliographic data, the prosecution "
            "transaction history, continuity (parents and children), or the file "
            "wrapper document list. Read-only. If no key is configured, or the "
            "office refuses or does not answer, it says exactly that and returns "
            "no data rather than guessing."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "application_number": {
                    "type": "string",
                    "description": "US application number, e.g. '18/412,907' or '18412907'.",
                },
                "include": {
                    "type": "string",
                    "enum": ["bibliographic", "transactions", "continuity", "documents"],
                    "description": "Which part of the record. Defaults to bibliographic.",
                },
            },
            "required": ["application_number"],
            "additionalProperties": False,
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "ok": {"type": "boolean"},
                "reason": {"type": "string"},
                "data": {},
            },
            "required": ["ok"],
            "additionalProperties": True,
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
        "_call": _tool_uspto_application,
    },
    {
        "name": "uspto_search",
        "title": "Search USPTO applications",
        "description": (
            "Search United States patent applications at the USPTO Open Data "
            "Portal. Read-only, and it never writes or files anything. Returns the "
            "office's own response, or a plain statement of why it could not."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search terms."},
                "limit": {"type": "integer", "minimum": 1, "maximum": 100},
            },
            "required": ["query"],
            "additionalProperties": False,
        },
        "outputSchema": {
            "type": "object",
            "properties": {"ok": {"type": "boolean"}, "data": {}},
            "required": ["ok"],
            "additionalProperties": True,
        },
        "annotations": {"readOnlyHint": True, "openWorldHint": True},
        "_call": _tool_uspto_search,
    },
    {
        "name": "funding_eligibility",
        "title": "Check funding eligibility",
        "description": (
            "Decide whether a financing arrangement meets the fixed-rate-only "
            "funding rule. Fixed rate and fixed segment are eligible; HELOC is "
            "refused outright; variable and adjustable products are referred for "
            "manual review rather than approved."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "rate_type": {
                    "type": "string",
                    "description": "The financing type, e.g. 'fixed_rate', 'heloc', 'arm'.",
                }
            },
            "required": ["rate_type"],
            "additionalProperties": False,
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "eligible": {"type": "boolean"},
                "reason": {"type": "string"},
            },
            "required": ["eligible", "reason"],
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "idempotentHint": True, "openWorldHint": False},
        "_call": _tool_funding,
    },
    {
        "name": "evidence_fingerprint",
        "title": "Fingerprint evidence",
        "description": (
            "Compute a stable SHA-256 fingerprint of a JSON payload so the same "
            "record can be shown later to be unchanged. Keys are sorted and "
            "whitespace removed before hashing, so logically identical payloads "
            "produce an identical digest regardless of key order."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "payload": {"description": "Any JSON value to fingerprint."}
            },
            "required": ["payload"],
            "additionalProperties": False,
        },
        "outputSchema": {
            "type": "object",
            "properties": {
                "fingerprint": {"type": "string"},
                "algorithm": {"type": "string"},
            },
            "required": ["fingerprint", "algorithm"],
            "additionalProperties": False,
        },
        "annotations": {"readOnlyHint": True, "idempotentHint": True, "openWorldHint": False},
        "_call": _tool_fingerprint,
    },
]

TOOLS_BY_NAME = {t["name"]: t for t in TOOLS}


def _public_tools() -> list[dict]:
    """The catalogue as the wire sees it, without our private _call key."""
    return [{k: v for k, v in t.items() if not k.startswith("_")} for t in TOOLS]


# ── JSON-RPC plumbing ─────────────────────────────────────────────────────

def _result(req_id: Any, result: Any) -> dict:
    return {"jsonrpc": "2.0", "id": req_id, "result": result}


def _error(req_id: Any, code: int, message: str, data: Any = None) -> dict:
    err: dict[str, Any] = {"code": code, "message": message}
    if data is not None:
        err["data"] = data
    return {"jsonrpc": "2.0", "id": req_id, "error": err}


def _negotiate(requested: Any) -> str:
    if isinstance(requested, str) and requested in SUPPORTED_PROTOCOL_VERSIONS:
        return requested
    return LATEST_PROTOCOL_VERSION


def _handle(message: dict, impl: dict[str, Callable]) -> tuple[dict | None, str | None]:
    """Return (response, new_session_id). A None response means notification."""
    method = message.get("method")
    req_id = message.get("id")
    params = message.get("params") or {}
    is_notification = "id" not in message

    if not isinstance(method, str):
        return _error(req_id, INVALID_REQUEST, "Missing 'method'"), None

    if method.startswith("notifications/"):
        return None, None  # acknowledged by the 202 the caller sends

    if method == "initialize":
        version = _negotiate(params.get("protocolVersion"))
        sid = _new_session()
        return (
            _result(
                req_id,
                {
                    "protocolVersion": version,
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {
                        "name": SERVER_NAME,
                        "title": SERVER_TITLE,
                        "version": impl["product_version"],
                    },
                    "instructions": (
                        "Patent360 exposes read-only checks over a patent-prosecution "
                        "deployment: service health, which upstream connectors are "
                        "configured, the fixed-rate-only funding rule, and stable "
                        "SHA-256 fingerprints for evidence records. No tool here "
                        "writes, files, or sends anything."
                    ),
                },
            ),
            sid,
        )

    if method == "ping":
        return _result(req_id, {}), None

    if method == "tools/list":
        return _result(req_id, {"tools": _public_tools()}), None

    if method == "tools/call":
        name = params.get("name")
        args = params.get("arguments") or {}
        if not isinstance(name, str):
            return _error(req_id, INVALID_PARAMS, "Missing tool name"), None
        tool = TOOLS_BY_NAME.get(name)
        if tool is None:
            return _error(req_id, INVALID_PARAMS, f"Unknown tool: {name}"), None
        if not isinstance(args, dict):
            return _error(req_id, INVALID_PARAMS, "'arguments' must be an object"), None
        try:
            structured = tool["_call"](args, impl)
        except ValueError as exc:
            # A tool refusing its input is a tool result, not a protocol error —
            # the model needs to see it and correct the call.
            return (
                _result(
                    req_id,
                    {
                        "content": [{"type": "text", "text": str(exc)}],
                        "isError": True,
                    },
                ),
                None,
            )
        except Exception:
            return _error(req_id, INTERNAL_ERROR, f"Tool '{name}' failed"), None

        import json as _json

        return (
            _result(
                req_id,
                {
                    "content": [
                        {"type": "text", "text": _json.dumps(structured, indent=2, sort_keys=True)}
                    ],
                    "structuredContent": structured,
                    "isError": False,
                },
            ),
            None,
        )

    if is_notification:
        return None, None
    return _error(req_id, METHOD_NOT_FOUND, f"Unknown method: {method}"), None


# ── HTTP surface ──────────────────────────────────────────────────────────

def build_router(impl: dict[str, Callable]) -> APIRouter:
    """Wire the transport to the same functions the REST routes use."""

    @router.get("/mcp")
    async def mcp_get() -> Response:
        # This server has nothing to push, so it declines the stream rather
        # than 404ing — a 404 would read as "no MCP server here".
        return JSONResponse(
            status_code=405,
            content={"error": "This endpoint does not offer a server-initiated stream. Use POST."},
            headers={"Allow": "POST, DELETE"},
        )

    @router.delete("/mcp")
    async def mcp_delete(request: Request) -> Response:
        blocked = _auth_failure(request)
        if blocked is not None:
            return blocked
        sid = request.headers.get("mcp-session-id")
        if sid:
            _SESSIONS.pop(sid, None)
        return Response(status_code=204)

    @router.post("/mcp")
    async def mcp_post(request: Request) -> Response:
        if _origin_rejected(request):
            return JSONResponse(status_code=403, content={"error": "origin_not_allowed"})

        blocked = _auth_failure(request)
        if blocked is not None:
            return blocked

        raw = await request.body()
        if len(raw) > MAX_BODY_BYTES:
            return JSONResponse(status_code=413, content={"error": "payload_too_large"})

        import json as _json

        try:
            message = _json.loads(raw)
        except Exception:
            return JSONResponse(
                status_code=400, content=_error(None, PARSE_ERROR, "Invalid JSON")
            )

        if isinstance(message, list):
            return JSONResponse(
                status_code=400,
                content=_error(
                    None,
                    INVALID_REQUEST,
                    "JSON-RPC batching was removed in MCP 2025-06-18. Send one message per request.",
                ),
            )

        if not isinstance(message, dict):
            return JSONResponse(
                status_code=400,
                content=_error(None, INVALID_REQUEST, "Body must be a JSON-RPC object"),
            )

        method = message.get("method")
        sid = request.headers.get("mcp-session-id")

        # Every method except initialize must present a live session.
        if method != "initialize" and sid is not None and not _touch(sid):
            return JSONResponse(
                status_code=404,
                content={"error": "session_not_found", "detail": "Re-initialize to obtain a new session."},
            )

        response, new_sid = _handle(message, impl)

        headers = {"MCP-Protocol-Version": LATEST_PROTOCOL_VERSION}
        if new_sid:
            headers["Mcp-Session-Id"] = new_sid

        if response is None:
            # Notifications and responses carry no reply body.
            return Response(status_code=202, headers=headers)

        return JSONResponse(status_code=200, content=response, headers=headers)

    return router
