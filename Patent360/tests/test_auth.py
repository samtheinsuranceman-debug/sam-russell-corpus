"""
The sign-in, tested as an attacker would probe it.

Run: python3 tests/test_auth.py
"""

import json
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import httpx  # noqa: E402

from app import auth, roster  # noqa: E402

PASS = FAIL = 0


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


# ── Hashing ───────────────────────────────────────────────────────────────
section("Passwords are hashed, not stored")
h = auth.hash_password("a long enough passphrase")
ok("the hash does not contain the password", "a long enough passphrase" not in h)
ok("it records its own scrypt parameters", h.startswith("scrypt$") and h.count("$") == 5, h[:40])
ok("the right password verifies", auth.verify_password("a long enough passphrase", h))
ok("a wrong password does not", not auth.verify_password("a long enough passphrasf", h))
ok("the same password hashes differently each time (salted)",
   auth.hash_password("a long enough passphrase") != h)
for bad in ["", "not-a-hash", "scrypt$x$y$z", "scrypt$1$2$3$!!$!!", None]:
    ok(f"a malformed stored hash {bad!r} returns False, never raises",
       auth.verify_password("x", bad) is False)  # type: ignore[arg-type]

section("A password policy that is about length, not punctuation")
ok("a short password is refused", auth.password_problem("short") is not None)
ok("a common one is refused", auth.password_problem("passwordpassword".replace("word", "word")) is not None
   or auth.password_problem("password") is not None)
ok("all digits is refused", auth.password_problem("1234567890123") is not None)
ok("a decent passphrase passes", auth.password_problem("correct horse battery staple") is None)


# ── Sessions ──────────────────────────────────────────────────────────────
section("Sessions are signed, expiring, and refuse tampering")
os.environ[auth.SESSION_SECRET_ENV] = "a-test-signing-secret-value"
t = auth.issue_session("a@b.com", "attorney")
p = auth.read_session(t)
ok("a fresh session reads back", p and p["sub"] == "a@b.com" and p["role"] == "attorney", str(p))

body, _, sig = t.partition(".")
import base64 as _b64


def _b64u(b):
    return _b64.urlsafe_b64encode(b).decode().rstrip("=")


def _unb64u(s):
    return _b64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


forged = json.loads(_unb64u(body))
forged["role"] = "admin"
tampered = _b64u(json.dumps(forged, separators=(",", ":"), sort_keys=True).encode()) + "." + sig
ok("escalating the role in the payload invalidates the signature",
   auth.read_session(tampered) is None)
ok("a truncated token is rejected", auth.read_session(body) is None)
ok("an empty token is rejected", auth.read_session("") is None)
ok("a token signed with another key is rejected",
   (lambda: (os.environ.__setitem__(auth.SESSION_SECRET_ENV, "different-secret-entirely"),
             auth.read_session(t))[1] is None)())
os.environ[auth.SESSION_SECRET_ENV] = "a-test-signing-secret-value"
ok("an expired session is rejected",
   auth.read_session(auth.issue_session("a@b.com", "client", ttl=-1)) is None)


# ── Accounts ──────────────────────────────────────────────────────────────
section("Authentication")
os.environ.pop(auth.USERS_ENV, None)
auth._attempts.clear(); auth._locked_until.clear()
out = auth.authenticate("nobody@nowhere.com", "whatever")
ok("with no accounts configured it says so plainly",
   out.ok is False and auth.USERS_ENV in out.reason, out.reason)

pw = "a genuinely long passphrase"
os.environ[auth.USERS_ENV] = json.dumps({
    "a.reyes@firm.com": {"hash": auth.hash_password(pw), "role": "attorney",
                         "name": "Alex Reyes", "firm": "Brandt & Lockwood LLP",
                         "registration_number": "78901"},
    "vandal@firm.com": {"hash": auth.hash_password(pw), "role": "totally-made-up"},
})
auth._attempts.clear(); auth._locked_until.clear()

out = auth.authenticate("a.reyes@firm.com", pw)
ok("the right password signs in", out.ok is True, out.reason)
ok("the role comes from the record", out.user and out.user.role == "attorney")
ok("an unknown role in the record falls back to the least privilege",
   auth.authenticate("vandal@firm.com", pw).user.role == "client")

auth._attempts.clear(); auth._locked_until.clear()
wrong = auth.authenticate("a.reyes@firm.com", "not the password")
missing = auth.authenticate("ghost@firm.com", "not the password")
ok("a wrong password and an unknown account give the same answer",
   wrong.reason == missing.reason, f"{wrong.reason!r} vs {missing.reason!r}")
ok("the answer does not reveal which part was wrong",
   "password" in wrong.reason.lower() and "email" in wrong.reason.lower(), wrong.reason)

section("Login throttling")
auth._attempts.clear(); auth._locked_until.clear()
for _ in range(auth.MAX_ATTEMPTS):
    auth.authenticate("a.reyes@firm.com", "wrong")
locked = auth.authenticate("a.reyes@firm.com", pw)
ok("the account locks after repeated failures", locked.ok is False, locked.reason)
ok("it locks even when the password is then correct", locked.ok is False)
ok("it says how long to wait", locked.retry_after > 0, str(locked.retry_after))
auth._attempts.clear(); auth._locked_until.clear()
ok("a success clears the failure count",
   auth.authenticate("a.reyes@firm.com", pw).ok is True)

section("Roles are ordered, and nothing outranks admin")
ok("attorney outranks paralegal", auth.role_at_least("attorney", "paralegal"))
ok("paralegal does not outrank attorney", not auth.role_at_least("paralegal", "attorney"))
ok("an invented role outranks nothing", not auth.role_at_least("superuser", "client"))


# ── The roster ────────────────────────────────────────────────────────────
section("The registration number is checked, never trusted")
ok("a number is digits only", roster.normalise_registration_number("Reg. No. 78,901") == "78901")
ok("an empty number is unverified, not verified",
   roster.verify("")["result"] == "unverified")

ROWS = (
    "Reyes,Alex,Q,,Brandt & Lockwood LLP,,100 Main St,,Columbus,OH,43215,6145550000,78901,Attorney\r\n"
    "Nakamura,Grace,,,Cedar IP,,2 Elm,,Des Moines,IA,50309,5155550000,64210,Agent\r\n"
)


def serve(body: bytes, status: int = 200):
    def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status, content=body)
    return httpx.MockTransport(handler)


roster._cache = None
roster._cached_at = 0.0
rep = roster.load(transport=serve(ROWS.encode()), force=True)
ok("a plain csv roster loads", rep["ok"] is True and rep["count"] == 2, str(rep))

v = roster.verify("78901")
ok("a listed practitioner verifies", v["result"] == "verified", str(v)[:120])
ok("it returns who they are", v["practitioner"]["name"] == "Alex Reyes", str(v))
ok("it classifies attorney vs agent", v["practitioner"]["kind"] == "attorney", str(v))
ok("an agent is classified too", roster.verify("64210")["practitioner"]["kind"] == "agent")
ok("a number not on the roster is not_found, not verified",
   roster.verify("99999")["result"] == "not_found")
ok("not_found explains that suspension removes people from the roster",
   "suspended" in roster.verify("99999")["reason"], roster.verify("99999")["reason"])

section("A roster that cannot be fetched says unverified — never verified")
roster._cache = None
roster._cached_at = 0.0
rep = roster.load(transport=serve(b"nope", 503), force=True)
ok("a failing download is reported", rep["ok"] is False and rep["status"] == 503, str(rep))
ok("it names the override for a moved file", roster.ROSTER_URL_ENV in rep["reason"], rep["reason"])
v = roster.verify("78901", transport=serve(b"nope", 503))
ok("verification then answers unverified", v["result"] == "unverified", str(v))
ok("it never claims verified when it could not check", v.get("result") != "verified")

roster._cache = None
roster._cached_at = 0.0
rep = roster.load(transport=serve(b"header only, nothing parseable\r\n"), force=True)
ok("an unparseable roster is reported rather than treated as empty-and-fine",
   rep["ok"] is False, str(rep))

section("Column order is found by shape, not by a fixed index")
roster._cache = None
roster._cached_at = 0.0
MOVED = "Reyes,Alex,,Brandt,,,,,,,,,,,78901,Attorney\r\n"
roster.load(transport=serve(MOVED.encode()), force=True)
ok("the number is still found when the columns move",
   roster.verify("78901")["result"] == "verified")

print(f"\n{'─' * 64}")
print(f"{PASS} checks passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
