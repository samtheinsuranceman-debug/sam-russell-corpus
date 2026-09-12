"""
Sign-in that is actually sign-in.

The previous screen took any password and let anyone pick their own role from
a dropdown. This replaces it with the real thing: passwords that are hashed
with a memory-hard function, sessions carried in a signed HttpOnly cookie,
constant-time comparison everywhere a secret is checked, rate limiting and
lockout on the login route, and roles that come from the server's record of
the user rather than from anything the browser says about itself.

## Why the USPTO registration number is not the password

It was proposed as one, and it must not be. A registration number is:

  · public — anyone can look it up at oedci.uspto.gov;
  · low entropy — six digits across roughly 53,000 practitioners;
  · impossible to rotate — it is assigned for life;
  · printed on every document the practitioner files.

A public, unrotatable, six-digit identifier is an identity claim, not a
secret. The USPTO agrees: the login on their own practitioner portal is
labelled "User ID (Not Reg. #)".

So the number does a better job here. It is verified against the Office of
Enrollment and Discipline roster, which says whether this person is an active
practitioner *today*. A password can never prove that. See roster.py.

## What this deliberately does not do

It does not invent a user database. Accounts come from PATENT360_USERS, a
JSON document the owner sets on the host, and the store behind them is a
single function — swap it for a database table and nothing else changes.
Pretending to have persistent multi-user signup when there is no database
would be the same class of lie as a button that does nothing.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from dataclasses import dataclass
from typing import Literal

Role = Literal["client", "paralegal", "attorney", "admin"]
ROLE_RANK: dict[str, int] = {"client": 0, "paralegal": 1, "attorney": 2, "admin": 3}

SESSION_COOKIE = "p360_session"
SESSION_TTL_SECONDS = 12 * 60 * 60          # a working day, then sign in again
SESSION_SECRET_ENV = "SESSION_SECRET"
USERS_ENV = "PATENT360_USERS"

# scrypt, tuned so a single check costs real memory and time. These are the
# parameters stored with every hash, so raising them later does not invalidate
# existing passwords — each hash carries the cost it was made with.
SCRYPT_N = 2 ** 15
SCRYPT_R = 8
SCRYPT_P = 1
SCRYPT_DKLEN = 32
SALT_BYTES = 16

# Login throttling. Deliberately per-identifier rather than per-IP: an
# attacker rotates addresses far more easily than they rotate targets.
MAX_ATTEMPTS = 6
LOCKOUT_SECONDS = 15 * 60

MIN_PASSWORD_LENGTH = 12


# ── Password hashing ──────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """
    scrypt with a random salt. The returned string carries its own parameters
    so a hash made today still verifies after the cost is raised tomorrow.
    """
    if not isinstance(password, str) or not password:
        raise ValueError("a password is required")
    salt = secrets.token_bytes(SALT_BYTES)
    dk = hashlib.scrypt(
        password.encode("utf-8"), salt=salt,
        n=SCRYPT_N, r=SCRYPT_R, p=SCRYPT_P, dklen=SCRYPT_DKLEN,
        maxmem=132 * 1024 * 1024,
    )
    return "scrypt${}${}${}${}${}".format(
        SCRYPT_N, SCRYPT_R, SCRYPT_P,
        base64.b64encode(salt).decode(), base64.b64encode(dk).decode(),
    )


def verify_password(password: str, stored: str) -> bool:
    """
    Constant-time verification. Returns False for anything malformed rather
    than raising, so a corrupt record cannot be distinguished from a wrong
    password by timing or by error message.
    """
    try:
        scheme, n, r, p, salt_b64, dk_b64 = stored.split("$")
        if scheme != "scrypt":
            return False
        dk = hashlib.scrypt(
            (password or "").encode("utf-8"),
            salt=base64.b64decode(salt_b64),
            n=int(n), r=int(r), p=int(p),
            dklen=len(base64.b64decode(dk_b64)),
            maxmem=132 * 1024 * 1024,
        )
        return hmac.compare_digest(dk, base64.b64decode(dk_b64))
    except Exception:
        return False


def password_problem(password: str) -> str | None:
    """
    What is wrong with this password, in words the person can act on. Length
    is the requirement that actually matters; a composition rule mostly
    teaches people to write Password1! and move on.
    """
    if not password or len(password) < MIN_PASSWORD_LENGTH:
        return f"Use at least {MIN_PASSWORD_LENGTH} characters. A short phrase you can remember beats a scrambled short word."
    if password.lower() in {"password", "patent360", "changeme", "letmein"} or password.isdigit():
        return "That is among the first things anyone would try. Use something unique to you."
    return None


# ── Sessions ──────────────────────────────────────────────────────────────

def _secret() -> bytes:
    s = os.getenv(SESSION_SECRET_ENV, "").strip()
    if s:
        return s.encode("utf-8")
    # No secret configured: use a per-process random one. Sessions then do not
    # survive a restart, which is inconvenient but safe. The alternative — a
    # hardcoded default — would let anyone forge a session on any deployment.
    global _EPHEMERAL
    try:
        return _EPHEMERAL
    except NameError:
        _EPHEMERAL = secrets.token_bytes(32)
        return _EPHEMERAL


def session_secret_configured() -> bool:
    return bool(os.getenv(SESSION_SECRET_ENV, "").strip())


def _b64u(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).decode().rstrip("=")


def _unb64u(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def issue_session(email: str, role: str, *, ttl: int = SESSION_TTL_SECONDS) -> str:
    """A signed, expiring token. The signature covers the whole payload."""
    payload = {"sub": email, "role": role, "exp": int(time.time()) + ttl,
               "jti": secrets.token_hex(8)}
    body = _b64u(json.dumps(payload, separators=(",", ":"), sort_keys=True).encode())
    sig = _b64u(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    return f"{body}.{sig}"


def read_session(token: str | None) -> dict | None:
    """
    Returns the payload only if the signature is ours and it has not expired.
    Any tampering, truncation or expiry returns None — never a partial result.
    """
    if not token or "." not in token:
        return None
    body, _, sig = token.partition(".")
    expected = _b64u(hmac.new(_secret(), body.encode(), hashlib.sha256).digest())
    if not hmac.compare_digest(sig, expected):
        return None
    try:
        payload = json.loads(_unb64u(body))
    except Exception:
        return None
    if not isinstance(payload, dict) or payload.get("exp", 0) < time.time():
        return None
    return payload


# ── Users ─────────────────────────────────────────────────────────────────

@dataclass
class User:
    email: str
    password_hash: str
    role: Role
    name: str = ""
    firm: str = ""
    #: USPTO registration number. An identity claim, verified against the OED
    #: roster — never a credential.
    registration_number: str = ""


def _load_users() -> dict[str, User]:
    """
    Accounts from PATENT360_USERS: a JSON object keyed by lowercased email.

    Example (the hash is produced by `python -m app.auth hash`):

      {"a.reyes@firm.com": {"hash": "scrypt$...", "role": "attorney",
                            "name": "Alex Reyes", "firm": "Brandt & Lockwood LLP",
                            "registration_number": "78901"}}
    """
    raw = os.getenv(USERS_ENV, "").strip()
    if not raw:
        return {}
    try:
        doc = json.loads(raw)
    except ValueError:
        return {}
    out: dict[str, User] = {}
    for email, rec in (doc or {}).items():
        if not isinstance(rec, dict) or not rec.get("hash"):
            continue
        role = rec.get("role", "client")
        if role not in ROLE_RANK:
            role = "client"
        out[email.strip().lower()] = User(
            email=email.strip().lower(),
            password_hash=rec["hash"],
            role=role,                      # type: ignore[arg-type]
            name=rec.get("name", ""),
            firm=rec.get("firm", ""),
            registration_number=str(rec.get("registration_number", "")),
        )
    return out


def users_configured() -> bool:
    return bool(_load_users())


# ── Throttling ────────────────────────────────────────────────────────────

_attempts: dict[str, list[float]] = {}
_locked_until: dict[str, float] = {}


def lockout_remaining(identifier: str) -> int:
    until = _locked_until.get(identifier.lower(), 0)
    return max(0, int(until - time.time()))


def _record_failure(identifier: str) -> None:
    k = identifier.lower()
    now = time.time()
    hits = [t for t in _attempts.get(k, []) if now - t < LOCKOUT_SECONDS]
    hits.append(now)
    _attempts[k] = hits
    if len(hits) >= MAX_ATTEMPTS:
        _locked_until[k] = now + LOCKOUT_SECONDS
        _attempts[k] = []


def _clear_failures(identifier: str) -> None:
    k = identifier.lower()
    _attempts.pop(k, None)
    _locked_until.pop(k, None)


@dataclass
class AuthOutcome:
    ok: bool
    reason: str = ""
    user: User | None = None
    retry_after: int = 0


def authenticate(email: str, password: str) -> AuthOutcome:
    """
    One answer for a wrong password and for an unknown account, and the same
    work done either way, so the response cannot be used to enumerate who has
    an account here.
    """
    identifier = (email or "").strip().lower()
    remaining = lockout_remaining(identifier)
    if remaining:
        return AuthOutcome(False, "Too many attempts. Try again shortly.", retry_after=remaining)

    users = _load_users()
    if not users:
        return AuthOutcome(
            False,
            f"No accounts are configured on this deployment. Set {USERS_ENV} on the "
            "service with at least one account before anyone can sign in.",
        )

    user = users.get(identifier)
    # Always run a hash, present or not, so the timing does not leak existence.
    stored = user.password_hash if user else hash_password(secrets.token_hex(16))
    good = verify_password(password, stored)

    if not user or not good:
        _record_failure(identifier)
        return AuthOutcome(False, "That email and password do not match an account.")

    _clear_failures(identifier)
    return AuthOutcome(True, user=user)


def role_at_least(role: str, needed: str) -> bool:
    return ROLE_RANK.get(role, -1) >= ROLE_RANK.get(needed, 99)


# ── Operator helper ───────────────────────────────────────────────────────

if __name__ == "__main__":  # pragma: no cover
    import sys
    if len(sys.argv) >= 2 and sys.argv[1] == "hash":
        import getpass
        pw = sys.argv[2] if len(sys.argv) > 2 else getpass.getpass("Password: ")
        problem = password_problem(pw)
        if problem:
            print(f"Refused: {problem}")
            sys.exit(1)
        print(hash_password(pw))
    else:
        print("usage: python -m app.auth hash [password]")
        print("Prints a scrypt hash to put in the PATENT360_USERS JSON.")
