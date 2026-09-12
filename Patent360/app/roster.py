"""
The Office of Enrollment and Discipline roster.

A patent attorney's registration number is a poor password and an excellent
credential check. The USPTO's Office of Enrollment and Discipline publishes,
and updates nightly, the roster of everyone currently entitled to practise
before the patent office — about 53,700 people: some 38,400 attorneys, 14,700
agents, a handful of design practitioners and a few hundred on limited
recognition.

That list answers a question no password can: *is this person licensed to do
this work today?* Suspended, excluded and inactive practitioners are absent
from it, so absence is itself the answer.

## What this is for

Granting an attorney seat. Someone claiming to be a registered practitioner
supplies their number; we check the roster; if the number is not there, they
do not get the seat. Their password remains their password — this is the
other half of the check, not a replacement for it.

## Honest limits

The OED publishes a downloadable roster and a search page, not a documented
JSON API. So this reads the published roster file, and the source URL is a
variable: if the office moves it, an owner changes `OED_ROSTER_URL` rather
than waiting for a code change. Where a cached roster is unavailable, the
answer is "unverified" — never "verified" and never a guess.
"""

from __future__ import annotations

import csv
import io
import os
import re
import time
import zipfile
from dataclasses import dataclass
from typing import Any

import httpx

ROSTER_URL_ENV = "OED_ROSTER_URL"
#: The OED roster download. Published as a zipped comma-separated file and
#: refreshed nightly. Overridable because a government URL can move.
DEFAULT_ROSTER_URL = "https://oedci.uspto.gov/OEDCI/PracticionerRoster.zip"
SEARCH_PAGE = "https://oedci.uspto.gov/OEDCI/practitionerSearchEntry"

#: Refetch at most once a day; the office regenerates it nightly.
CACHE_SECONDS = 24 * 60 * 60


@dataclass
class Practitioner:
    registration_number: str
    name: str
    kind: str          # attorney | agent | design | limited recognition | unknown
    firm: str = ""
    city: str = ""
    state: str = ""

    def as_dict(self) -> dict:
        return {
            "registration_number": self.registration_number,
            "name": self.name,
            "kind": self.kind,
            "firm": self.firm,
            "city": self.city,
            "state": self.state,
        }


def roster_url() -> str:
    return os.getenv(ROSTER_URL_ENV, DEFAULT_ROSTER_URL)


def normalise_registration_number(raw: str) -> str:
    """Registration numbers are digits. Strip everything else."""
    return re.sub(r"[^0-9]", "", raw or "")


_cache: dict[str, Practitioner] | None = None
_cached_at: float = 0.0
_cache_error: str = ""


def _classify(row: list[str]) -> str:
    blob = " ".join(row).lower()
    if "limited recognition" in blob:
        return "limited recognition"
    if "design" in blob:
        return "design"
    if "agent" in blob:
        return "agent"
    if "attorney" in blob:
        return "attorney"
    return "unknown"


STATUS_WORDS = ("attorney", "agent", "design", "limited recognition", "government")


def _parse(text: str) -> dict[str, Practitioner]:
    """
    Parse the roster defensively.

    The published column order has changed before and will again, so this does
    not trust a fixed index. Nor does it simply look for "a short run of
    digits" — a first attempt did, and happily returned the ZIP code, because
    a five-digit postcode and a five-digit registration number are the same
    shape. Phone numbers collide the same way.

    The documented layout ends "... phone number, registration number,
    indication of attorney/agent/design/limited recognition status". So the
    anchor is the status word, and the number is the nearest digit field to
    its left. That survives columns moving around in front of it, which is
    what actually changes between releases.
    """
    out: dict[str, Practitioner] = {}
    for row in csv.reader(io.StringIO(text)):
        if not row or len(row) < 3:
            continue
        cells = [(c or "").strip() for c in row]

        status_at = -1
        for i in range(len(cells) - 1, -1, -1):
            low = cells[i].lower()
            if any(w in low for w in STATUS_WORDS):
                status_at = i
                break

        reg = ""
        reg_at = -1
        scan = range(status_at - 1, -1, -1) if status_at > 0 else range(len(cells) - 1, -1, -1)
        for i in scan:
            c = cells[i]
            if c.isdigit() and 2 <= len(c) <= 7:
                reg, reg_at = c, i
                break
        if not reg:
            continue

        names = [c for c in cells[:max(reg_at, 1)] if c and not c.isdigit()]
        last = names[0] if names else ""
        first = names[1] if len(names) > 1 else ""
        name = f"{first} {last}".strip() or last or "(name not in roster row)"
        firm = ""
        for c in names[2:]:
            # A firm line has letters and is not a two-letter state code.
            if len(c) > 3 and any(ch.isalpha() for ch in c):
                firm = c
                break

        out[reg] = Practitioner(
            registration_number=reg, name=name,
            kind=_classify([cells[status_at]] if status_at >= 0 else cells),
            firm=firm,
        )
    return out


def load(*, transport: httpx.BaseTransport | None = None, force: bool = False) -> dict:
    """
    Fetch and cache the roster. Returns a report rather than raising, because
    "we could not check" and "they are not on the roster" are different
    answers and must never be collapsed into each other.
    """
    global _cache, _cached_at, _cache_error
    fresh = _cache is not None and (time.time() - _cached_at) < CACHE_SECONDS
    if fresh and not force:
        return {"ok": True, "count": len(_cache or {}), "cached": True,
                "fetched_at": int(_cached_at), "source": roster_url()}

    url = roster_url()
    try:
        with httpx.Client(timeout=60.0, transport=transport, follow_redirects=True) as c:
            r = c.get(url, headers={"User-Agent": "Patent360/2.0"})
    except httpx.HTTPError as exc:
        _cache_error = f"Could not reach the OED roster: {type(exc).__name__}."
        return {"ok": False, "reason": _cache_error, "source": url}

    if r.status_code >= 400:
        _cache_error = (
            f"The OED roster returned {r.status_code}. If the office has moved the "
            f"file, set {ROSTER_URL_ENV} to the new address."
        )
        return {"ok": False, "status": r.status_code, "reason": _cache_error, "source": url}

    body = r.content
    try:
        if body[:2] == b"PK":
            with zipfile.ZipFile(io.BytesIO(body)) as z:
                names = [n for n in z.namelist() if not n.endswith("/")]
                if not names:
                    raise ValueError("the archive was empty")
                text = z.read(names[0]).decode("utf-8", errors="replace")
        else:
            text = body.decode("utf-8", errors="replace")
        parsed = _parse(text)
    except Exception as exc:
        _cache_error = f"The roster downloaded but could not be read: {type(exc).__name__}."
        return {"ok": False, "reason": _cache_error, "source": url}

    if not parsed:
        _cache_error = "The roster downloaded but no practitioner rows were recognised."
        return {"ok": False, "reason": _cache_error, "source": url}

    _cache, _cached_at, _cache_error = parsed, time.time(), ""
    return {"ok": True, "count": len(parsed), "cached": False,
            "fetched_at": int(_cached_at), "source": url}


def status() -> dict:
    """Whether a roster is loaded, and how old it is. Makes no request."""
    return {
        "loaded": _cache is not None,
        "count": len(_cache or {}),
        "fetched_at": int(_cached_at) if _cached_at else None,
        "age_seconds": int(time.time() - _cached_at) if _cached_at else None,
        "source": roster_url(),
        "search_page": SEARCH_PAGE,
        "last_error": _cache_error,
    }


def verify(registration_number: str, *, transport: httpx.BaseTransport | None = None) -> dict:
    """
    Is this an active practitioner?

    Three distinct answers, never conflated:
      verified   — on the roster, with who they are
      not_found  — the roster loaded and this number is not in it
      unverified — we could not check, and say why
    """
    reg = normalise_registration_number(registration_number)
    if not reg:
        return {"result": "unverified",
                "reason": "A registration number is required. It is digits only, e.g. 78901."}

    if _cache is None:
        report = load(transport=transport)
        if not report.get("ok"):
            return {"result": "unverified", "reason": report.get("reason", "The roster is unavailable."),
                    "registration_number": reg, "search_page": SEARCH_PAGE}

    hit = (_cache or {}).get(reg)
    if not hit:
        return {
            "result": "not_found",
            "registration_number": reg,
            "reason": (
                "That number is not on the USPTO's active practitioner roster. The roster "
                "excludes anyone inactive, suspended or excluded, so a number that was valid "
                "before may not be now. Check it at " + SEARCH_PAGE
            ),
            "search_page": SEARCH_PAGE,
        }

    return {
        "result": "verified",
        "practitioner": hit.as_dict(),
        "roster_fetched_at": int(_cached_at),
        "source": roster_url(),
        #: Only these may hold an attorney seat.
        "may_practise": hit.kind in {"attorney", "agent", "design", "limited recognition"},
    }
