"""
Operational data API checks for matters and deadlines.

Run: python3 tests/test_operational_data.py
"""

import os
import sys
import tempfile
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient  # noqa: E402

from app import auth  # noqa: E402

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


def authed(client: TestClient, email: str, role: str = "attorney"):
    token = auth.issue_session(email, role, ttl=3600)
    client.cookies.set(auth.SESSION_COOKIE, token)


with tempfile.NamedTemporaryFile(prefix="patent360-test-", suffix=".db", delete=False) as f:
    db_path = f.name

os.environ["DATABASE_URL"] = f"sqlite:///{db_path}"
os.environ[auth.SESSION_SECRET_ENV] = "test-session-secret"

from app.main import app  # noqa: E402  # imported after environment configuration

client = TestClient(app)

section("Unauthenticated requests are rejected")
r = client.get("/api/matters")
ok("list matters requires auth", r.status_code == 401, str(r.json()))
r = client.get("/api/deadlines")
ok("list deadlines requires auth", r.status_code == 401, str(r.json()))

section("CRUD lifecycle with per-user isolation")
authed(client, "one@example.com")
r = client.post(
    "/api/matters",
    json={
        "docket": "BL-1000-US",
        "application_number": "18/500,111",
        "title": "Battery module airflow",
        "client": "Northfield Labs",
        "status": "drafting",
        "attorney": "A. Reyes",
        "cpc": "H01M 10/653",
        "next_step": "Draft claims",
    },
)
ok("create matter returns 201", r.status_code == 201, str(r.json()))
matter = r.json()

r = client.get("/api/matters")
ok("creator sees created matter", len(r.json()["items"]) == 1, str(r.json()))

r = client.post(
    "/api/deadlines",
    json={
        "matter_id": matter["id"],
        "title": "Respond to office action",
        "owner": "A. Reyes",
        "due_date": str(date.today() + timedelta(days=5)),
        "is_statutory": True,
        "status": "open",
    },
)
ok("create deadline returns 201", r.status_code == 201, str(r.json()))
deadline = r.json()

r = client.get(f"/api/deadlines/{deadline['id']}")
ok("creator can read deadline", r.status_code == 200 and r.json()["matter_id"] == matter["id"], str(r.json()))

authed(client, "two@example.com")
r = client.get("/api/matters")
ok("second user sees no first-user matters", r.status_code == 200 and r.json()["items"] == [], str(r.json()))
r = client.get(f"/api/matters/{matter['id']}")
ok("second user cannot read first-user matter", r.status_code == 404, str(r.json()))
r = client.get(f"/api/deadlines/{deadline['id']}")
ok("second user cannot read first-user deadline", r.status_code == 404, str(r.json()))
r = client.delete(f"/api/matters/{matter['id']}")
ok("second user cannot delete first-user matter", r.status_code == 404, str(r.text))

section("Validation errors are explicit")
authed(client, "one@example.com")
r = client.post(
    "/api/matters",
    json={
        "docket": "BL-1001-US",
        "title": "X",
        "client": "Y",
        "status": "not-a-status",
        "attorney": "Z",
    },
)
ok("invalid matter status is rejected", r.status_code == 422, str(r.json()))

r = client.post(
    "/api/deadlines",
    json={
        "matter_id": matter["id"],
        "title": "Bad date",
        "owner": "A. Reyes",
        "due_date": "09-31-2026",
        "status": "open",
    },
)
ok("malformed deadline date is rejected", r.status_code == 422, str(r.json()))

section("Update and delete lifecycle")
r = client.put(
    f"/api/matters/{matter['id']}",
    json={
        "docket": matter["docket"],
        "application_number": matter["application_number"],
        "title": matter["title"],
        "client": matter["client"],
        "status": "filed",
        "attorney": matter["attorney"],
        "cpc": matter["cpc"],
        "next_step": "Filed",
    },
)
ok("matter update succeeds", r.status_code == 200 and r.json()["status"] == "filed", str(r.json()))

r = client.put(
    f"/api/deadlines/{deadline['id']}",
    json={
        "title": deadline["title"],
        "owner": deadline["owner"],
        "due_date": deadline["due_date"],
        "is_statutory": deadline["is_statutory"],
        "status": "completed",
    },
)
ok("deadline update succeeds", r.status_code == 200 and r.json()["classification"] == "completed", str(r.json()))

r = client.delete(f"/api/deadlines/{deadline['id']}")
ok("deadline delete returns 204", r.status_code == 204, str(r.status_code))
r = client.get(f"/api/deadlines/{deadline['id']}")
ok("deleted deadline is gone", r.status_code == 404, str(r.json()))

section("Deadline ordering is deterministic and due-date first")
r = client.post(
    "/api/matters",
    json={
        "docket": "BL-1002-US",
        "title": "Ordering matter",
        "client": "Northfield Labs",
        "status": "drafting",
        "attorney": "A. Reyes",
    },
)
matter_two = r.json()

for due in [
    date.today() + timedelta(days=30),
    date.today() + timedelta(days=2),
    date.today() + timedelta(days=2),
    date.today() + timedelta(days=10),
]:
    client.post(
        "/api/deadlines",
        json={
            "matter_id": matter_two["id"],
            "title": f"Due {due.isoformat()}",
            "owner": "A. Reyes",
            "due_date": due.isoformat(),
            "status": "open",
        },
    )

r = client.get("/api/deadlines")
items = r.json()["items"]
ordered_pairs = [(d["due_date"], d["id"]) for d in items]
ok(
    "deadlines are sorted by due date then id",
    ordered_pairs == sorted(ordered_pairs, key=lambda p: (p[0], p[1])),
    str(ordered_pairs),
)

section("Classification covers overdue, due soon, upcoming, and completed")
classifications = {d["classification"] for d in items}
ok("includes due soon", "due_soon" in classifications, str(classifications))
ok("includes upcoming", "upcoming" in classifications, str(classifications))

r = client.post(
    "/api/deadlines",
    json={
        "matter_id": matter_two["id"],
        "title": "Past due",
        "owner": "A. Reyes",
        "due_date": (date.today() - timedelta(days=1)).isoformat(),
        "status": "open",
    },
)
ok("can create past due deadline", r.status_code == 201, str(r.json()))
r = client.post(
    "/api/deadlines",
    json={
        "matter_id": matter_two["id"],
        "title": "Completed item",
        "owner": "A. Reyes",
        "due_date": (date.today() + timedelta(days=15)).isoformat(),
        "status": "completed",
    },
)
ok("can create completed deadline", r.status_code == 201 and r.json()["classification"] == "completed", str(r.json()))
r = client.get("/api/deadlines")
classifications = {d["classification"] for d in r.json()["items"]}
ok("includes overdue", "overdue" in classifications, str(classifications))
ok("includes completed", "completed" in classifications, str(classifications))

print(f"\n{'─' * 64}")
print(f"{PASS} checks passed, {FAIL} failed")
sys.exit(1 if FAIL else 0)
