import hashlib
import json
import os

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse

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


@app.get("/", response_class=HTMLResponse)
def dashboard():
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

    normalized = rate_type.strip().lower()

    try:
        if normalized in ELIGIBLE_RATE_TYPES:
            return JSONResponse(
                content={
                    "eligible": True,
                    "reason": f"'{rate_type}' financing meets fixed-rate eligibility criteria",
                },
                status_code=200,
            )

        if "heloc" in normalized:
            reason = "HELOC financing is not eligible"
        elif "variable" in normalized or "arm" in normalized:
            reason = "Variable-rate products require manual review"
        else:
            reason = f"'{rate_type}' financing does not meet fixed-rate eligibility criteria"

        return JSONResponse(
            content={"eligible": False, "reason": reason},
            status_code=200,
        )
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
        canonical = json.dumps(body, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        return JSONResponse(
            content={"fingerprint": digest, "algorithm": "sha256"}, status_code=200
        )
    except Exception:
        return JSONResponse(
            content={"error": "Unable to compute fingerprint"}, status_code=500
        )


@app.get("/api/connectors")
def connectors():
    try:
        return JSONResponse(content=_connector_inventory(), status_code=200)
    except Exception:
        return JSONResponse(
            content={"error": "Unable to retrieve connector inventory"}, status_code=500
        )
