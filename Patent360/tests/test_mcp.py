"""A real MCP client handshake against the Patent360 server.

These drive the transport the way a connector does — initialize, then the
initialized notification, then discovery, then calls — rather than asserting
that a route exists. If the handshake regresses, an AI client silently sees
zero tools, and that failure is invisible from the outside.

Run: python Patent360/tests/test_mcp.py
"""

import os
import sys

# Import exactly as the container does: WORKDIR /app, "uvicorn app.main:app".
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ["MCP_API_KEY"] = "test-key-not-a-real-secret"

from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)
AUTH = {"Authorization": "Bearer test-key-not-a-real-secret"}
JSONRPC = {"Accept": "application/json, text/event-stream", **AUTH}

failures: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    if condition:
        print(f"  ok   {name}")
    else:
        failures.append(f"{name} — {detail}")
        print(f"  FAIL {name} — {detail}")


def rpc(method, params=None, req_id=1, session=None, headers=None):
    h = dict(JSONRPC)
    if session:
        h["Mcp-Session-Id"] = session
    if headers:
        h.update(headers)
    body = {"jsonrpc": "2.0", "method": method}
    if req_id is not None:
        body["id"] = req_id
    if params is not None:
        body["params"] = params
    return client.post("/mcp", json=body, headers=h)


print("\nAuthentication")
r = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
check("no token is refused", r.status_code == 401, f"got {r.status_code}")
check(
    "refusal names the scheme",
    "Bearer" in r.headers.get("WWW-Authenticate", ""),
    r.headers.get("WWW-Authenticate", "<missing>"),
)
r = client.post(
    "/mcp",
    json={"jsonrpc": "2.0", "id": 1, "method": "initialize"},
    headers={"Authorization": "Bearer wrong-key"},
)
check("wrong token is refused", r.status_code == 401, f"got {r.status_code}")

print("\nHandshake")
r = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                       "clientInfo": {"name": "probe", "version": "1.0"}})
check("initialize succeeds", r.status_code == 200, f"got {r.status_code}")
body = r.json()
result = body.get("result", {})
check("agrees the requested protocol version", result.get("protocolVersion") == "2025-06-18",
      str(result.get("protocolVersion")))
check("declares the tools capability", "tools" in result.get("capabilities", {}),
      str(result.get("capabilities")))
check("identifies itself", result.get("serverInfo", {}).get("name") == "patent360",
      str(result.get("serverInfo")))
session = r.headers.get("mcp-session-id")
check("issues a session id", bool(session), "no Mcp-Session-Id header")

r = rpc("initialize", {"protocolVersion": "1999-01-01"}, req_id=2)
check("falls back on an unknown protocol version",
      r.json()["result"]["protocolVersion"] == "2025-06-18",
      str(r.json()["result"].get("protocolVersion")))

r = client.post("/mcp", json={"jsonrpc": "2.0", "method": "notifications/initialized"},
                headers={**JSONRPC, "Mcp-Session-Id": session})
check("initialized notification returns 202 with no body",
      r.status_code == 202 and not r.content, f"{r.status_code} body={r.content!r}")

print("\nDiscovery")
r = rpc("tools/list", {}, req_id=3, session=session)
tools = r.json()["result"]["tools"]
check("lists seven tools", len(tools) == 7, f"got {len(tools)}")
names = {t["name"] for t in tools}
check("names are the expected ones",
      names == {"health_check", "connector_inventory", "funding_eligibility",
                "evidence_fingerprint", "uspto_status", "uspto_application", "uspto_search"},
      str(sorted(names)))
check("the three USPTO tools are declared open-world",
      all(t["annotations"]["openWorldHint"] for t in tools
          if t["name"] in {"uspto_application", "uspto_search"}),
      "a tool that calls out to the patent office must say so")
check("every USPTO tool is read-only",
      all(t["annotations"]["readOnlyHint"] for t in tools if t["name"].startswith("uspto")),
      "nothing here may write to the patent office")
check("every tool carries an input schema",
      all(t.get("inputSchema", {}).get("type") == "object" for t in tools), "missing inputSchema")
check("every tool carries a description",
      all(len(t.get("description", "")) > 30 for t in tools), "thin or missing description")
check("private keys are not leaked to the wire",
      all(not any(k.startswith("_") for k in t) for t in tools), "a _key reached the client")

print("\nCalls")
r = rpc("tools/call", {"name": "funding_eligibility", "arguments": {"rate_type": "fixed_rate"}},
        req_id=4, session=session)
res = r.json()["result"]
check("fixed rate is eligible", res["structuredContent"]["eligible"] is True, str(res))
check("result carries text content for the model",
      res["content"][0]["type"] == "text" and res["content"][0]["text"], str(res.get("content")))

r = rpc("tools/call", {"name": "funding_eligibility", "arguments": {"rate_type": "HELOC"}},
        req_id=5, session=session)
res = r.json()["result"]["structuredContent"]
check("HELOC is refused outright",
      res["eligible"] is False and "not eligible" in res["reason"], str(res))

r = rpc("tools/call", {"name": "funding_eligibility", "arguments": {"rate_type": "5/1 ARM"}},
        req_id=6, session=session)
res = r.json()["result"]["structuredContent"]
check("an ARM goes to manual review rather than approval",
      res["eligible"] is False and "manual review" in res["reason"], str(res))

a = rpc("tools/call", {"name": "evidence_fingerprint",
                       "arguments": {"payload": {"b": 2, "a": 1}}}, req_id=7, session=session)
b = rpc("tools/call", {"name": "evidence_fingerprint",
                       "arguments": {"payload": {"a": 1, "b": 2}}}, req_id=8, session=session)
fa = a.json()["result"]["structuredContent"]["fingerprint"]
fb = b.json()["result"]["structuredContent"]["fingerprint"]
check("fingerprint ignores key order", fa == fb, f"{fa[:12]} vs {fb[:12]}")
check("fingerprint is a sha256 digest", len(fa) == 64, f"length {len(fa)}")

r = rpc("tools/call", {"name": "connector_inventory", "arguments": {}}, req_id=9, session=session)
conns = r.json()["result"]["structuredContent"]["connectors"]
check("inventory lists connectors", len(conns) >= 5, f"got {len(conns)}")
check("inventory never returns a key value",
      all(set(c) == {"name", "configured"} for c in conns), str(conns[:2]))

print("\nError handling")
r = rpc("tools/call", {"name": "funding_eligibility", "arguments": {}}, req_id=10, session=session)
res = r.json()["result"]
check("a missing argument is a tool error, not a protocol error",
      res.get("isError") is True and "error" not in r.json(), str(r.json()))

r = rpc("tools/call", {"name": "no_such_tool", "arguments": {}}, req_id=11, session=session)
check("unknown tool is rejected", r.json()["error"]["code"] == -32602, str(r.json().get("error")))

r = rpc("resources/list", {}, req_id=12, session=session)
check("unsupported method returns method-not-found",
      r.json()["error"]["code"] == -32601, str(r.json().get("error")))

r = client.post("/mcp", content=b"{not json", headers=JSONRPC)
check("malformed JSON is a parse error", r.json()["error"]["code"] == -32700, str(r.json()))

r = client.post("/mcp", json=[{"jsonrpc": "2.0", "id": 1, "method": "ping"}], headers=JSONRPC)
check("batching is refused with a reason",
      r.json()["error"]["code"] == -32600 and "batching" in r.json()["error"]["message"].lower(),
      str(r.json().get("error")))

r = rpc("ping", {}, req_id=13, session="deadbeef" * 4)
check("an unknown session is told to re-initialize", r.status_code == 404, f"got {r.status_code}")

print("\nTransport")
r = client.get("/mcp", headers=AUTH)
check("GET declines the stream with 405, not 404", r.status_code == 405, f"got {r.status_code}")
check("GET advertises the allowed methods", "POST" in r.headers.get("Allow", ""),
      r.headers.get("Allow", "<missing>"))
r = client.delete("/mcp", headers={**AUTH, "Mcp-Session-Id": session})
check("DELETE ends the session", r.status_code == 204, f"got {r.status_code}")
r = rpc("ping", {}, req_id=14, session=session)
check("the ended session no longer works", r.status_code == 404, f"got {r.status_code}")

print("\nThe USPTO tools refuse honestly when no key is configured")
os.environ.pop("USPTO_API_KEY", None)
# The transport section above ended its session on purpose, so take a fresh one.
_r = rpc("initialize", {"protocolVersion": "2025-06-18", "capabilities": {},
                        "clientInfo": {"name": "suite", "version": "1"}}, req_id=59)
session = _r.headers.get("mcp-session-id")
rpc("notifications/initialized", session=session)
r = rpc("tools/call", {"name": "uspto_status", "arguments": {}}, req_id=60, session=session)
sc = r.json()["result"]["structuredContent"]
check("uspto_status reports unconfigured", sc["configured"] is False, str(sc))
check("it names the environment variable", "USPTO_API_KEY" in sc["detail"], sc["detail"])
r = rpc("tools/call", {"name": "uspto_application",
                       "arguments": {"application_number": "18/412,907"}}, req_id=61, session=session)
sc = r.json()["result"]["structuredContent"]
check("uspto_application refuses rather than inventing a record", sc["ok"] is False, str(sc)[:120])
check("it returns no data at all", "data" not in sc, str(sc)[:120])
r = rpc("tools/call", {"name": "uspto_application",
                       "arguments": {"application_number": "18412907", "include": "nonsense"}},
        req_id=62, session=session)
check("an unknown include is rejected", r.json()["result"].get("isError") is True, str(r.json())[:140])

print("\nThe REST surface still works")
check("/health", client.get("/health").status_code == 200)
check("/api/health", client.get("/api/health").status_code == 200)
check("dashboard renders", client.get("/").status_code == 200)
check("REST and MCP agree on the funding rule",
      client.post("/api/funding/eligibility", json={"rate_type": "heloc"}).json()["eligible"] is False)

print("\nUnconfigured deployments refuse rather than serve openly")
del os.environ["MCP_API_KEY"]
r = client.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
check("no key set means 503, not an open endpoint", r.status_code == 503, f"got {r.status_code}")

print()
if failures:
    print(f"{len(failures)} FAILED:")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("all checks passed")
