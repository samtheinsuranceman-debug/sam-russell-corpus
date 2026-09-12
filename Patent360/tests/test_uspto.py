"""
The USPTO client, tested against every way the office can fail.

No network and no key are used. httpx's MockTransport stands in for the
office, so a rate limit, a rejected key, a moved path and a body that is not
JSON can each be provoked deliberately — which is the only way to be sure the
client reports them honestly rather than turning them into silence or,
worse, into a plausible-looking number.

Run: python3 tests/test_uspto.py
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx  # noqa: E402

from app import uspto  # noqa: E402
from app.uspto import UsptoClient, normalise_application_number  # noqa: E402

PASS = 0
FAIL = 0


def ok(name, cond, detail=""):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ok   {name}")
    else:
        FAIL += 1
        print(f"  FAIL {name}\n       {detail}")


def section(t):
    print(f"\n{t}")


def responder(status=200, json_body=None, text=None):
    def handler(request: httpx.Request) -> httpx.Response:
        handler.last_request = request
        if text is not None:
            return httpx.Response(status, text=text)
        return httpx.Response(status, json=json_body if json_body is not None else {})
    handler.last_request = None
    return handler


def client(handler):
    return UsptoClient(transport=httpx.MockTransport(handler), timeout=2.0)


# ── Application numbers ───────────────────────────────────────────────────
section("An application number is the same question however it is written")
for raw, want in [
    ("18/412,907", "18412907"),
    ("18412907", "18412907"),
    (" 18/412907 ", "18412907"),
    ("US 18/412,907", "18412907"),
    ("", ""),
]:
    ok(f"{raw!r} normalises to {want!r}", normalise_application_number(raw) == want,
       normalise_application_number(raw))


# ── No key ────────────────────────────────────────────────────────────────
section("With no key configured it refuses clearly and calls nothing")
os.environ.pop(uspto.API_KEY_ENV, None)
called = {"n": 0}


def must_not_call(request):
    called["n"] += 1
    return httpx.Response(200, json={})


c = client(must_not_call)
r = c.application("18/412,907")
ok("it does not call the office without a key", called["n"] == 0)
ok("it reports not-ok", r.ok is False)
ok("the reason names the environment variable", uspto.API_KEY_ENV in r.reason, r.reason)
ok("the reason says where to get a key", "developer.uspto.gov" in r.reason, r.reason)
ok("no data is invented", r.data is None)

st = c.status()
ok("status reports unconfigured", st["configured"] is False)
ok("status still reports the base url", st["base_url"].startswith("http"), st["base_url"])


# ── With a key ────────────────────────────────────────────────────────────
section("With a key it calls the office and passes the key as a header")
os.environ[uspto.API_KEY_ENV] = "test-key-not-real"
h = responder(200, {"applicationNumberText": "18412907", "inventionTitle": "A thing"})
c = client(h)
r = c.application("18/412,907")
ok("the call succeeds", r.ok is True, r.reason)
ok("the office's body is returned unchanged", r.data["inventionTitle"] == "A thing")
ok("the key goes in X-API-KEY", h.last_request.headers.get("x-api-key") == "test-key-not-real")
ok("the key is never echoed back in the result", "test-key-not-real" not in str(r.as_dict()))
ok("the path carries the normalised number",
   h.last_request.url.path.endswith("/patent/applications/18412907"), str(h.last_request.url))

section("Each part of the record hits its own documented path")
for method, suffix in [("transactions", "/transactions"), ("continuity", "/continuity"),
                       ("documents", "/documents")]:
    h = responder(200, {"ok": True})
    c = client(h)
    getattr(c, method)("18412907")
    ok(f"{method} -> {suffix}", h.last_request.url.path.endswith(suffix), str(h.last_request.url))

section("Search sends the query and clamps the page size")
h = responder(200, {"results": []})
c = client(h)
c.search("thermal battery", limit=5000)
q = dict(h.last_request.url.params)
ok("the query is sent", q.get("q") == "thermal battery", q)
ok("limit is clamped to 100", q.get("limit") == "100", q)
r = c.search("   ")
ok("an empty query is refused before calling out", r.ok is False and "query" in r.reason.lower())


# ── Every way it can go wrong ─────────────────────────────────────────────
section("Failures are reported as themselves, never as data")
for status, needle in [(401, "rejected the key"), (403, "rejected the key"),
                       (404, "no record"), (429, "Rate limited"), (500, "returned 500")]:
    c = client(responder(status, {"error": "x"}))
    r = c.application("18412907")
    ok(f"HTTP {status} is reported as {needle!r}", r.ok is False and needle.lower() in r.reason.lower(),
       f"{r.status} {r.reason}")
    ok(f"HTTP {status} carries the status code through", r.status == status, str(r.status))
    ok(f"HTTP {status} returns no data", r.data is None)

c = client(responder(200, text="<html>we moved</html>"))
r = c.application("18412907")
ok("a non-JSON body is reported, not parsed hopefully",
   r.ok is False and "not JSON" in r.reason, r.reason)


def timeout_handler(request):
    raise httpx.ReadTimeout("slow", request=request)


c = client(timeout_handler)
r = c.application("18412907")
ok("a timeout says so and names the budget", r.ok is False and "did not answer" in r.reason, r.reason)


def network_handler(request):
    raise httpx.ConnectError("no route", request=request)


c = client(network_handler)
r = c.application("18412907")
ok("an unreachable office says so", r.ok is False and "Could not reach" in r.reason, r.reason)

section("A moved API path is fixable without a code change")
os.environ[uspto.BASE_URL_ENV] = "https://example.invalid/v2"
h = responder(200, {"ok": True})
c = client(h)
c.application("18412907")
ok("the override is honoured", str(h.last_request.url).startswith("https://example.invalid/v2"),
   str(h.last_request.url))
os.environ.pop(uspto.BASE_URL_ENV, None)

section("An empty application number never becomes a call")
called["n"] = 0
c = client(must_not_call)
r = c.application("")
ok("it refuses locally", r.ok is False and called["n"] == 0, r.reason)

os.environ.pop(uspto.API_KEY_ENV, None)

print(f"\n{'─' * 64}")
print(f"{PASS} checks passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
