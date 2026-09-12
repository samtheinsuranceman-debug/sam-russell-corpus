"""
The connection to the United States Patent and Trademark Office.

Patent360 without USPTO data is a mock. This is the seam where it stops being
one: real application status, real continuity, real transaction history and
real prosecution documents, pulled from the office of record.

## Which USPTO service

The USPTO Open Data Portal is the current one: the API lives at
`api.uspto.gov/api/v1` and the portal at `data.uspto.gov`. It replaced the
Patent Examination Data System (PEDS), and the legacy Developer Hub at
developer.uspto.gov was decommissioned on 5 June 2026 — any guide pointing
there is out of date.

A key is free but not instant: it needs a USPTO.gov account with MFA and a
verified ID.me identity linked to it. The key is sent as `X-API-KEY`. Nothing
here ships a key, and nothing here ever logs or returns one.

## Why the base URL is configurable

`USPTO_BASE_URL` overrides the endpoint. That is not decoration. A government
API path can move under a service that is already deployed, and when it does
the fix should be a variable an owner sets in thirty seconds, not a code
change, a review and a redeploy.

## What this will not do

It will not invent an answer. Every failure — no key, rejected key, rate
limit, timeout, moved path, malformed body — returns a result saying which of
those happened and what the office actually sent. A docket that quietly
substitutes a plausible guess for a real filing date is worse than no docket,
because nobody double-checks a number that looks right.
"""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from typing import Any

import httpx

DEFAULT_BASE_URL = "https://api.uspto.gov/api/v1"
DEFAULT_TIMEOUT = 20.0

#: Env var carrying the key. Set it on the host; never in the repository.
API_KEY_ENV = "USPTO_API_KEY"
BASE_URL_ENV = "USPTO_BASE_URL"


def base_url() -> str:
    return os.getenv(BASE_URL_ENV, DEFAULT_BASE_URL).rstrip("/")


def api_key() -> str | None:
    key = os.getenv(API_KEY_ENV, "").strip()
    return key or None


@dataclass
class UsptoResult:
    """
    One call to the office, and an honest account of how it went.

    `ok` is true only when the USPTO answered with the data asked for. Every
    other outcome carries a `reason` a person can act on, and `status` is the
    code the office actually returned, so a surprise can be looked up rather
    than guessed at.
    """

    ok: bool
    reason: str = ""
    status: int | None = None
    data: Any = None
    source: str = "uspto-open-data-portal"
    endpoint: str = ""

    def as_dict(self) -> dict:
        out = {
            "ok": self.ok,
            "source": self.source,
            "endpoint": self.endpoint,
        }
        if self.status is not None:
            out["status"] = self.status
        if self.reason:
            out["reason"] = self.reason
        if self.data is not None:
            out["data"] = self.data
        return out


#: The office writes application numbers as eight digits, often shown with a
#: slash and commas. Normalise before asking, so "18/412,907" and "18412907"
#: are the same question.
def normalise_application_number(raw: str) -> str:
    return re.sub(r"[^0-9]", "", raw or "")


#: The legacy Developer Hub at developer.uspto.gov was decommissioned on
#: 5 June 2026. The Open Data Portal at data.uspto.gov replaced it, and a key
#: now needs a USPTO.gov account with multi-factor authentication plus a
#: verified ID.me identity linked to it. That is a real errand, not a form —
#: so the message says so rather than implying it takes a minute.
KEY_PAGE = "https://data.uspto.gov/apikey"
ACCOUNT_PAGE = "https://account.uspto.gov"

NOT_CONFIGURED = (
    f"No {API_KEY_ENV} is set on this service. Get a free key at {KEY_PAGE} — "
    f"it needs a USPTO.gov account ({ACCOUNT_PAGE}) with MFA enabled, and a "
    "verified ID.me identity linked to it. One key per person; it is deleted "
    "after 90 days unused. Until a key is set, no live patent data is "
    "available and nothing here is invented to fill the gap."
)


class UsptoClient:
    """
    A thin, honest client. Thin because the value is in the office's data, not
    in wrapping it; honest because every path returns UsptoResult rather than
    raising into a handler that might swallow it.

    `transport` exists so the test suite can exercise every failure path
    without touching the network or needing a key.
    """

    def __init__(
        self,
        *,
        timeout: float = DEFAULT_TIMEOUT,
        transport: httpx.BaseTransport | None = None,
    ) -> None:
        self._timeout = timeout
        self._transport = transport

    # ── plumbing ─────────────────────────────────────────────────────────
    def _get(self, path: str, params: dict | None = None) -> UsptoResult:
        key = api_key()
        endpoint = f"{base_url()}{path}"
        if not key:
            return UsptoResult(ok=False, reason=NOT_CONFIGURED, endpoint=endpoint)

        headers = {
            "X-API-KEY": key,
            "Accept": "application/json",
            "User-Agent": "Patent360/2.0 (+https://patent360-production.up.railway.app)",
        }
        try:
            with httpx.Client(timeout=self._timeout, transport=self._transport) as c:
                r = c.get(endpoint, params=params or {}, headers=headers)
        except httpx.TimeoutException:
            return UsptoResult(
                ok=False,
                endpoint=endpoint,
                reason=f"The USPTO did not answer within {self._timeout:.0f} seconds.",
            )
        except httpx.HTTPError as exc:
            return UsptoResult(
                ok=False,
                endpoint=endpoint,
                reason=f"Could not reach the USPTO: {type(exc).__name__}.",
            )

        if r.status_code == 401 or r.status_code == 403:
            return UsptoResult(
                ok=False,
                status=r.status_code,
                endpoint=endpoint,
                reason=(
                    f"The USPTO rejected the key ({r.status_code}). Check that "
                    f"{API_KEY_ENV} is current and authorised for this dataset."
                ),
            )
        if r.status_code == 404:
            return UsptoResult(
                ok=False,
                status=404,
                endpoint=endpoint,
                reason="The USPTO has no record at that path. Either the identifier is "
                f"wrong or the API path has moved — {BASE_URL_ENV} overrides the base URL.",
            )
        if r.status_code == 429:
            return UsptoResult(
                ok=False,
                status=429,
                endpoint=endpoint,
                reason="Rate limited by the USPTO. Wait and retry; do not hammer it.",
            )
        if r.status_code >= 400:
            return UsptoResult(
                ok=False,
                status=r.status_code,
                endpoint=endpoint,
                reason=f"The USPTO returned {r.status_code}.",
            )

        try:
            body = r.json()
        except ValueError:
            return UsptoResult(
                ok=False,
                status=r.status_code,
                endpoint=endpoint,
                reason="The USPTO answered but the body was not JSON. The API contract "
                "may have changed.",
            )
        return UsptoResult(ok=True, status=r.status_code, data=body, endpoint=endpoint)

    # ── the questions worth asking ───────────────────────────────────────
    def status(self) -> dict:
        """
        Is this service actually wired to the patent office?

        Deliberately reports configuration without calling out, so it is safe
        to poll and cannot be used to burn someone's rate limit.
        """
        return {
            "configured": api_key() is not None,
            "base_url": base_url(),
            "key_env": API_KEY_ENV,
            "key_page": KEY_PAGE,
            "detail": (
                "A key is set; live calls will be attempted."
                if api_key()
                else NOT_CONFIGURED
            ),
        }

    def application(self, application_number: str) -> UsptoResult:
        """Status, dates, title, applicant and examiner for one application."""
        n = normalise_application_number(application_number)
        if not n:
            return UsptoResult(
                ok=False,
                reason="An application number is required, e.g. 18/412,907.",
                endpoint=f"{base_url()}/patent/applications/",
            )
        return self._get(f"/patent/applications/{n}")

    def continuity(self, application_number: str) -> UsptoResult:
        """Parents and children — the family this application sits in."""
        n = normalise_application_number(application_number)
        return self._get(f"/patent/applications/{n}/continuity")

    def transactions(self, application_number: str) -> UsptoResult:
        """
        The prosecution history: every action the office recorded and when.

        This is the one that matters for a docket. A deadline computed from a
        mailing date the office actually recorded is a fact; one computed from
        a date somebody typed is a hope.
        """
        n = normalise_application_number(application_number)
        return self._get(f"/patent/applications/{n}/transactions")

    def documents(self, application_number: str) -> UsptoResult:
        """The file wrapper: what has been filed and mailed, with dates."""
        n = normalise_application_number(application_number)
        return self._get(f"/patent/applications/{n}/documents")

    def search(self, query: str, *, limit: int = 20, offset: int = 0) -> UsptoResult:
        """
        Search applications. Used for prior art and for finding a matter when
        somebody has the title but not the number.
        """
        if not (query or "").strip():
            return UsptoResult(
                ok=False,
                reason="A search needs a query.",
                endpoint=f"{base_url()}/patent/applications/search",
            )
        limit = max(1, min(int(limit), 100))
        return self._get(
            "/patent/applications/search",
            {"q": query, "limit": limit, "offset": max(0, int(offset))},
        )
