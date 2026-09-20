import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path

from fastapi import Depends, FastAPI, HTTPException, Query, Request
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from fastapi.staticfiles import StaticFiles
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

app = FastAPI(title="Patent360", version="2.0.0")

PRODUCT_NAME = "Patent360"
PRODUCT_VERSION = "2.0.0"

CONNECTOR_ENV_VARS = {
    "OpenAI": "OPENAI_API_KEY",
    "Anthropic": "ANTHROPIC_API_KEY",
    "Perplexity": "PERPLEXITY_API_KEY",
    "USPTO": "USPTO_API_KEY",
    "GitHub": "GITHUB_TOKEN",
    "Railway": "RAILWAY_TOKEN",
}

ELIGIBLE_RATE_TYPES = {"fixed_rate", "fixed_segment"}

# The built single-page application, vendored at Patent360/web by the client
# build. If it is absent the service still starts and still serves the API and
# the MCP endpoint — a missing front end must never take the connector down.
WEB_ROOT = Path(__file__).resolve().parent.parent / "web"
WEB_INDEX = WEB_ROOT / "index.html"
WEB_PRESENT = WEB_INDEX.is_file()

from app import operational_data as _ops  # noqa: E402


@app.on_event("startup")
def startup() -> None:
    try:
        _ops.init_operational_data()
    except HTTPException:
        # Operational storage is optional at startup; endpoints fail closed when
        # DATABASE_URL is not configured.
        pass


def _connector_availability() -> dict:
    """Return connector availability booleans based only on env var presence."""
    return {
        f"{name.lower()}_available": bool(os.getenv(env_var))
        for name, env_var in CONNECTOR_ENV_VARS.items()
    }


def _connector_inventory() -> list:
    """Return connector inventory with configured booleans only (no secrets)."""
    return [
        {"name": name, "configured": bool(os.getenv(env_var))}
        for name, env_var in CONNECTOR_ENV_VARS.items()
    ]


def _health_payload() -> dict:
    payload = {
        "status": "ok",
        "product": PRODUCT_NAME,
        "version": PRODUCT_VERSION,
    }
    payload.update(_connector_availability())
    return payload


def _evaluate_funding(rate_type: str) -> dict:
    """The fixed-rate-only rule. Shared by the REST route and the MCP tool."""
    normalized = rate_type.strip().lower()
    if normalized in ELIGIBLE_RATE_TYPES:
        return {
            "eligible": True,
            "reason": f"'{rate_type}' financing meets fixed-rate eligibility criteria",
        }
    if "heloc" in normalized:
        reason = "HELOC financing is not eligible"
    elif "variable" in normalized or "arm" in normalized:
        reason = "Variable-rate products require manual review"
    else:
        reason = f"'{rate_type}' financing does not meet fixed-rate eligibility criteria"
    return {"eligible": False, "reason": reason}


def _fingerprint(payload) -> dict:
    """Stable SHA-256 over canonical JSON: sorted keys, no whitespace."""
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
    return {
        "fingerprint": hashlib.sha256(canonical.encode("utf-8")).hexdigest(),
        "algorithm": "sha256",
    }


@app.get("/", response_class=HTMLResponse)
def dashboard():
    # The application itself, when the client build is vendored in. The
    # operator dashboard below stays as the fallback so a service with no
    # front end still says something useful rather than 404ing.
    if WEB_PRESENT:
        return FileResponse(WEB_INDEX, media_type="text/html")

    try:
        connectors = _connector_inventory()

        connector_cards = ""
        for connector in connectors:
            status_label = "Configured" if connector["configured"] else "Not configured"
            status_class = "configured" if connector["configured"] else "not-configured"
            connector_cards += f"""
            <div class="card">
                <h3>{connector['name']}</h3>
                <span class="badge {status_class}">{status_label}</span>
            </div>
            """

        tools = [
            "Health Check (/health, /api/health)",
            "Funding Eligibility (/api/funding/eligibility)",
            "Evidence Fingerprinting (/api/evidence/fingerprint)",
            "Connector Inventory (/api/connectors)",
        ]
        tools_list = "".join(f"<li>{tool}</li>" for tool in tools)

        html = f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Patent360 v2.0 Dashboard</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
                :root {{
                    color-scheme: dark;
                }}
                body {{
                    margin: 0;
                    padding: 2rem;
                    background: #0f172a;
                    color: #e2e8f0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }}
                h1 {{
                    margin-bottom: 0.25rem;
                }}
                .subtitle {{
                    color: #94a3b8;
                    margin-bottom: 1.5rem;
                }}
                .status-banner {{
                    display: inline-block;
                    padding: 0.5rem 1rem;
                    background: #14532d;
                    border: 1px solid #22c55e;
                    border-radius: 0.5rem;
                    margin-bottom: 2rem;
                }}
                .grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 1rem;
                    margin-bottom: 2rem;
                }}
                .card {{
                    background: #1e293b;
                    border: 1px solid #334155;
                    border-radius: 0.75rem;
                    padding: 1rem;
                    text-align: center;
                }}
                .card h3 {{
                    margin: 0 0 0.5rem 0;
                }}
                .badge {{
                    display: inline-block;
                    padding: 0.25rem 0.6rem;
                    border-radius: 999px;
                    font-size: 0.8rem;
                }}
                .badge.configured {{
                    background: #14532d;
                    color: #86efac;
                }}
                .badge.not-configured {{
                    background: #450a0a;
                    color: #fca5a5;
                }}
                ul {{
                    line-height: 1.8;
                }}
                section {{
                    margin-bottom: 2rem;
                }}
            </style>
        </head>
        <body>
            <h1>Patent360 v2.0 Dashboard</h1>
            <p class="subtitle">Version {PRODUCT_VERSION}</p>
            <div class="status-banner">System status: OK</div>

            <section>
                <h2>Connectors</h2>
                <div class="grid">
                    {connector_cards}
                </div>
            </section>

            <section>
                <h2>Tools</h2>
                <ul>
                    {tools_list}
                </ul>
            </section>
        </body>
        </html>
        """
        return HTMLResponse(content=html, status_code=200)
    except Exception:
        return HTMLResponse(
            content="<h1>Patent360</h1><p>Dashboard temporarily unavailable.</p>",
            status_code=500,
        )


@app.get("/health")
def health():
    try:
        return JSONResponse(content=_health_payload(), status_code=200)
    except Exception:
        return JSONResponse(
            content={"status": "error", "product": PRODUCT_NAME, "version": PRODUCT_VERSION},
            status_code=500,
        )


@app.get("/api/health")
def api_health():
    try:
        return JSONResponse(content=_health_payload(), status_code=200)
    except Exception:
        return JSONResponse(
            content={"status": "error", "product": PRODUCT_NAME, "version": PRODUCT_VERSION},
            status_code=500,
        )


@app.post("/api/funding/eligibility")
async def funding_eligibility(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content={"error": "Request body must be valid JSON"}, status_code=400
        )

    if not isinstance(body, dict):
        return JSONResponse(
            content={"error": "Request body must be a JSON object"}, status_code=400
        )

    rate_type = body.get("rate_type")

    if not rate_type or not isinstance(rate_type, str):
        return JSONResponse(
            content={"error": "Field 'rate_type' is required and must be a string"},
            status_code=400,
        )

    try:
        return JSONResponse(content=_evaluate_funding(rate_type), status_code=200)
    except Exception:
        return JSONResponse(
            content={"error": "Unable to evaluate funding eligibility"}, status_code=500
        )


@app.post("/api/evidence/fingerprint")
async def evidence_fingerprint(request: Request):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(
            content={"error": "Request body must be valid JSON"}, status_code=400
        )

    try:
        return JSONResponse(content=_fingerprint(body), status_code=200)
    except Exception:
        return JSONResponse(
            content={"error": "Unable to compute fingerprint"}, status_code=500
        )


# ── Sign-in ───────────────────────────────────────────────────────────────
# Real authentication: hashed passwords, signed sessions, server-held roles.
from app import auth as _auth  # noqa: E402
from app import roster as _roster  # noqa: E402


@app.get("/api/auth/status")
def auth_status():
    """What an operator needs to know before anyone tries to sign in."""
    return JSONResponse(
        content={
            "accounts_configured": _auth.users_configured(),
            "session_secret_configured": _auth.session_secret_configured(),
            "detail": (
                "Ready."
                if _auth.users_configured() and _auth.session_secret_configured()
                else "Set PATENT360_USERS (accounts) and SESSION_SECRET (signing key) on "
                     "the service. Without a SESSION_SECRET, sessions are signed with a "
                     "per-process key and end at every restart."
            ),
        },
        status_code=200,
    )


@app.post("/api/auth/login")
async def auth_login(request: Request, response: Response):
    try:
        body = await request.json()
    except Exception:
        return JSONResponse(content={"error": "Send JSON."}, status_code=400)

    out = _auth.authenticate(str(body.get("email", "")), str(body.get("password", "")))
    if not out.ok:
        payload = {"ok": False, "reason": out.reason}
        if out.retry_after:
            payload["retry_after_seconds"] = out.retry_after
        return JSONResponse(content=payload, status_code=429 if out.retry_after else 401)

    u = out.user
    token = _auth.issue_session(u.email, u.role)
    r = JSONResponse(
        content={
            "ok": True,
            "user": {"email": u.email, "role": u.role, "name": u.name, "firm": u.firm,
                     "registration_number": u.registration_number},
        },
        status_code=200,
    )
    # HttpOnly so script cannot read it; SameSite=Lax so it does not ride
    # along on a cross-site request; Secure because this is served over TLS.
    r.set_cookie(_auth.SESSION_COOKIE, token, httponly=True, samesite="lax",
                 secure=True, max_age=_auth.SESSION_TTL_SECONDS, path="/")
    return r


@app.post("/api/auth/logout")
def auth_logout():
    r = JSONResponse(content={"ok": True}, status_code=200)
    r.delete_cookie(_auth.SESSION_COOKIE, path="/")
    return r


@app.get("/api/auth/me")
def auth_me(request: Request):
    """The session as the server understands it — never as the browser claims."""
    payload = _auth.read_session(request.cookies.get(_auth.SESSION_COOKIE))
    if not payload:
        return JSONResponse(content={"authenticated": False}, status_code=401)
    return JSONResponse(
        content={"authenticated": True, "email": payload["sub"], "role": payload["role"],
                 "expires_at": payload["exp"]},
        status_code=200,
    )


def _require_authenticated_email(request: Request) -> str:
    payload = _auth.read_session(request.cookies.get(_auth.SESSION_COOKIE))
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Authentication required")
    return str(payload["sub"]).strip().lower()


def _as_matter_out(matter: _ops.MatterRecord) -> _ops.MatterOut:
    return _ops.MatterOut.model_validate(matter)


def _as_deadline_out(deadline: _ops.DeadlineRecord, matter: _ops.MatterRecord) -> _ops.DeadlineOut:
    return _ops.DeadlineOut(
        id=deadline.id,
        matter_id=deadline.matter_id,
        docket=matter.docket,
        title=deadline.title,
        owner=deadline.owner,
        due_date=deadline.due_date,
        is_statutory=deadline.is_statutory,
        status=deadline.status,
        classification=_ops.classify_deadline(due_date=deadline.due_date, status=deadline.status),
        created_at=deadline.created_at,
        updated_at=deadline.updated_at,
    )


@app.get("/api/matters", response_model=_ops.MatterListResponse)
def list_matters(request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    matters = db.execute(
        select(_ops.MatterRecord)
        .where(_ops.MatterRecord.user_email == user_email)
        .order_by(_ops.MatterRecord.updated_at.desc(), _ops.MatterRecord.id.desc())
    ).scalars().all()
    return _ops.MatterListResponse(items=[_as_matter_out(m) for m in matters])


@app.post("/api/matters", response_model=_ops.MatterOut, status_code=201)
def create_matter(payload: _ops.MatterCreate, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    now = datetime.now(timezone.utc)
    matter = _ops.MatterRecord(
        user_email=user_email,
        docket=payload.docket,
        application_number=payload.application_number,
        title=payload.title,
        client=payload.client,
        status=payload.status,
        attorney=payload.attorney,
        cpc=payload.cpc,
        next_step=payload.next_step,
        created_at=now,
        updated_at=now,
    )
    db.add(matter)
    db.commit()
    db.refresh(matter)
    return _as_matter_out(matter)


@app.get("/api/matters/{matter_id}", response_model=_ops.MatterOut)
def get_matter(matter_id: int, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    return _as_matter_out(_ops.require_matter_for_user(db, matter_id, user_email))


@app.put("/api/matters/{matter_id}", response_model=_ops.MatterOut)
def update_matter(
    matter_id: int,
    payload: _ops.MatterUpdate,
    request: Request,
    db: Session = Depends(_ops.get_db),
):
    user_email = _require_authenticated_email(request)
    matter = _ops.require_matter_for_user(db, matter_id, user_email)
    matter.docket = payload.docket
    matter.application_number = payload.application_number
    matter.title = payload.title
    matter.client = payload.client
    matter.status = payload.status
    matter.attorney = payload.attorney
    matter.cpc = payload.cpc
    matter.next_step = payload.next_step
    matter.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(matter)
    return _as_matter_out(matter)


@app.delete("/api/matters/{matter_id}", status_code=204)
def delete_matter(matter_id: int, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    matter = _ops.require_matter_for_user(db, matter_id, user_email)
    db.delete(matter)
    db.commit()
    return Response(status_code=204)


@app.get("/api/deadlines", response_model=_ops.DeadlineListResponse)
def list_deadlines(
    request: Request,
    matter_id: int | None = Query(default=None, gt=0),
    db: Session = Depends(_ops.get_db),
):
    user_email = _require_authenticated_email(request)
    stmt = (
        select(_ops.DeadlineRecord, _ops.MatterRecord)
        .join(_ops.MatterRecord, _ops.DeadlineRecord.matter_id == _ops.MatterRecord.id)
        .where(_ops.MatterRecord.user_email == user_email)
    )
    if matter_id is not None:
        _ops.require_matter_for_user(db, matter_id, user_email)
        stmt = stmt.where(_ops.DeadlineRecord.matter_id == matter_id)
    rows = db.execute(
        stmt.order_by(_ops.DeadlineRecord.due_date.asc(), _ops.DeadlineRecord.id.asc())
    ).all()
    return _ops.DeadlineListResponse(items=[_as_deadline_out(deadline, matter) for deadline, matter in rows])


@app.post("/api/deadlines", response_model=_ops.DeadlineOut, status_code=201)
def create_deadline(payload: _ops.DeadlineCreate, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    matter = _ops.require_matter_for_user(db, payload.matter_id, user_email)
    if _deadline_duplicate_exists(
        db,
        matter_id=matter.id,
        title=payload.title,
        owner=payload.owner,
        due_date=payload.due_date,
        is_statutory=payload.is_statutory,
        status=payload.status,
    ):
        raise HTTPException(status_code=409, detail="Duplicate deadline already exists")
    now = datetime.now(timezone.utc)
    deadline = _ops.DeadlineRecord(
        matter_id=matter.id,
        title=payload.title,
        owner=payload.owner,
        due_date=payload.due_date,
        is_statutory=payload.is_statutory,
        status=payload.status,
        created_at=now,
        updated_at=now,
    )
    db.add(deadline)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate deadline already exists")
    db.refresh(deadline)
    return _as_deadline_out(deadline, matter)


def _require_deadline_for_user(db: Session, deadline_id: int, user_email: str) -> tuple[_ops.DeadlineRecord, _ops.MatterRecord]:
    row = db.execute(
        select(_ops.DeadlineRecord, _ops.MatterRecord)
        .join(_ops.MatterRecord, _ops.DeadlineRecord.matter_id == _ops.MatterRecord.id)
        .where(_ops.DeadlineRecord.id == deadline_id, _ops.MatterRecord.user_email == user_email)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Deadline not found")
    return row


def _deadline_duplicate_exists(
    db: Session,
    *,
    matter_id: int,
    title: str,
    owner: str,
    due_date,
    is_statutory: bool,
    status: str,
    exclude_id: int | None = None,
) -> bool:
    stmt = select(_ops.DeadlineRecord.id).where(
        _ops.DeadlineRecord.matter_id == matter_id,
        _ops.DeadlineRecord.title == title,
        _ops.DeadlineRecord.owner == owner,
        _ops.DeadlineRecord.due_date == due_date,
        _ops.DeadlineRecord.is_statutory == is_statutory,
        _ops.DeadlineRecord.status == status,
    )
    if exclude_id is not None:
        stmt = stmt.where(_ops.DeadlineRecord.id != exclude_id)
    return db.execute(stmt).first() is not None


@app.get("/api/deadlines/{deadline_id}", response_model=_ops.DeadlineOut)
def get_deadline(deadline_id: int, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    deadline, matter = _require_deadline_for_user(db, deadline_id, user_email)
    return _as_deadline_out(deadline, matter)


@app.put("/api/deadlines/{deadline_id}", response_model=_ops.DeadlineOut)
def update_deadline(
    deadline_id: int,
    payload: _ops.DeadlineUpdate,
    request: Request,
    db: Session = Depends(_ops.get_db),
):
    user_email = _require_authenticated_email(request)
    deadline, matter = _require_deadline_for_user(db, deadline_id, user_email)
    if _deadline_duplicate_exists(
        db,
        matter_id=deadline.matter_id,
        title=payload.title,
        owner=payload.owner,
        due_date=payload.due_date,
        is_statutory=payload.is_statutory,
        status=payload.status,
        exclude_id=deadline.id,
    ):
        raise HTTPException(status_code=409, detail="Duplicate deadline already exists")
    deadline.title = payload.title
    deadline.owner = payload.owner
    deadline.due_date = payload.due_date
    deadline.is_statutory = payload.is_statutory
    deadline.status = payload.status
    deadline.updated_at = datetime.now(timezone.utc)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Duplicate deadline already exists")
    db.refresh(deadline)
    return _as_deadline_out(deadline, matter)


@app.delete("/api/deadlines/{deadline_id}", status_code=204)
def delete_deadline(deadline_id: int, request: Request, db: Session = Depends(_ops.get_db)):
    user_email = _require_authenticated_email(request)
    deadline, _ = _require_deadline_for_user(db, deadline_id, user_email)
    db.delete(deadline)
    db.commit()
    return Response(status_code=204)


# ── Practitioner roster ───────────────────────────────────────────────────
# A registration number is a public identifier, so it is checked, never
# trusted as a secret. The roster says who may practise today.

@app.get("/api/practitioner/status")
def practitioner_status():
    return JSONResponse(content=_roster.status(), status_code=200)


@app.get("/api/practitioner/{registration_number}")
def practitioner_verify(registration_number: str):
    out = _roster.verify(registration_number)
    code = 200 if out["result"] == "verified" else 404 if out["result"] == "not_found" else 503
    return JSONResponse(content=out, status_code=code)


# ── USPTO ─────────────────────────────────────────────────────────────────
# The office of record. Without these the rest of this product is a mock.
from app.uspto import UsptoClient  # noqa: E402

_uspto = UsptoClient()


@app.get("/api/uspto/status")
def uspto_status():
    """Is this deployment wired to the patent office? Makes no outbound call."""
    return JSONResponse(content=_uspto.status(), status_code=200)


@app.get("/api/uspto/application/{application_number}")
def uspto_application(application_number: str):
    r = _uspto.application(application_number)
    return JSONResponse(content=r.as_dict(), status_code=200 if r.ok else 502)


@app.get("/api/uspto/application/{application_number}/transactions")
def uspto_transactions(application_number: str):
    """Prosecution history. A deadline computed from this is a fact."""
    r = _uspto.transactions(application_number)
    return JSONResponse(content=r.as_dict(), status_code=200 if r.ok else 502)


@app.get("/api/uspto/application/{application_number}/continuity")
def uspto_continuity(application_number: str):
    r = _uspto.continuity(application_number)
    return JSONResponse(content=r.as_dict(), status_code=200 if r.ok else 502)


@app.get("/api/uspto/application/{application_number}/documents")
def uspto_documents(application_number: str):
    """The file wrapper."""
    r = _uspto.documents(application_number)
    return JSONResponse(content=r.as_dict(), status_code=200 if r.ok else 502)


@app.get("/api/uspto/search")
def uspto_search(q: str = "", limit: int = 20, offset: int = 0):
    r = _uspto.search(q, limit=limit, offset=offset)
    return JSONResponse(content=r.as_dict(), status_code=200 if r.ok else 502)


@app.get("/api/connectors")
def connectors():
    try:
        return JSONResponse(content=_connector_inventory(), status_code=200)
    except Exception:
        return JSONResponse(
            content={"error": "Unable to retrieve connector inventory"}, status_code=500
        )


# ── MCP ───────────────────────────────────────────────────────────────────
# The connector endpoint. It speaks JSON-RPC 2.0 over Streamable HTTP and is
# handed the same functions the REST routes above call, so a tool result and
# an API response can never disagree.
from app.mcp import build_router as _build_mcp_router  # noqa: E402

app.include_router(
    _build_mcp_router(
        {
            "product_version": PRODUCT_VERSION,
            "health_payload": _health_payload,
            "connector_inventory": _connector_inventory,
            "funding_eligibility": _evaluate_funding,
            "evidence_fingerprint": _fingerprint,
            "uspto_status": _uspto.status,
            "uspto_application": lambda n, include: (
                {
                    "bibliographic": _uspto.application,
                    "transactions": _uspto.transactions,
                    "continuity": _uspto.continuity,
                    "documents": _uspto.documents,
                }[include](n)
            ).as_dict(),
            "uspto_search": lambda q, limit: _uspto.search(q, limit=limit).as_dict(),
        }
    )
)


# ── The application ───────────────────────────────────────────────────────
# Static assets first, then a catch-all so the client router owns every path
# it does not. Registered last on purpose: /health, /api/* and /mcp are
# already bound above and keep winning, because FastAPI matches in order.
if WEB_PRESENT:
    for _sub in ("assets", "plates", "fonts", "images"):
        _dir = WEB_ROOT / _sub
        if _dir.is_dir():
            app.mount(f"/{_sub}", StaticFiles(directory=_dir), name=f"web-{_sub}")

    _RESERVED = ("api", "health", "mcp", "docs", "openapi.json", "redoc")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        """Serve a real file if there is one, otherwise hand the path to the
        client router. Reserved prefixes 404 as JSON rather than silently
        returning an HTML page to something expecting an API."""
        if path.split("/", 1)[0] in _RESERVED:
            return JSONResponse(content={"error": "Not found"}, status_code=404)

        candidate = (WEB_ROOT / path).resolve()
        # Never serve anything outside the build directory.
        if candidate.is_file() and str(candidate).startswith(str(WEB_ROOT.resolve())):
            return FileResponse(candidate)

        return FileResponse(WEB_INDEX, media_type="text/html")
