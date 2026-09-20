#!/usr/bin/env python3
"""
Regenerate the consolidation route analysis.

Reads client/src/App.tsx from the canonical base and each donor tree, extracts
every registered route and its bound component, and writes:

    raw_routes.json              every route + component, per tree
    route_collision_report.json  collisions, duplicates, dependencies

Adjust TREES for your checkout. Donor `russell-capital` should be read from
origin/main, NOT from a working branch — see 01_REPOSITORY_INVENTORY.md §1.3.

    python3 consolidation/data/regenerate.py
    git diff --exit-code consolidation/data/   # expect no change on an unchanged tree
"""

import collections
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

TREES = {
    "canonical": "/home/user/sam-russell-corpus/russell-capital-systems/client/src/App.tsx",
    "donor_app": "/home/user/russell-capital-app/client/src/App.tsx",
    # Produce with: git show origin/main:client/src/App.tsx > /tmp/rc_main_App.tsx
    "donor_rc": "/tmp/rc_main_App.tsx",
}

ROUTE_RE = re.compile(r'<Route\s+path="([^"]+)"')
COMP_RE = re.compile(r'<Route\s+path="([^"]+)"[^>]*?component=\{(?:gated\()?([A-Za-z0-9_]+)')

# The engagement routes the consolidation tracks explicitly.
GAMIFICATION = [
    "/portal/arena", "/portal/rewards", "/portal/black-mirror", "/portal/social",
    "/portal/endgame", "/portal/wealth-reels", "/portal/infinite-scroll",
    "/portal/pet", "/portal/toilet", "/portal/wealth-warrior",
    "/portal/wealth-odyssey", "/portal/elite-showdown", "/portal/holographic-mirage",
    "/portal/predictive-arena", "/portal/moat-fortress", "/portal/pavlovian-engagement",
    "/portal/entrainment-engine", "/portal/strategy-comparison",
]


def parse(path):
    with open(path, encoding="utf-8", errors="replace") as fh:
        src = fh.read()
    routes = ROUTE_RE.findall(src)
    return {
        "unique": sorted(set(routes)),
        "components": dict(COMP_RE.findall(src)),
        "internal_dupes": sorted(
            r for r, n in collections.Counter(routes).items() if n > 1
        ),
        "_declared": len(routes),
    }


def main():
    missing = [p for p in TREES.values() if not os.path.exists(p)]
    if missing:
        sys.exit("Missing tree(s):\n  " + "\n  ".join(missing))

    data = {name: parse(path) for name, path in TREES.items()}
    for name, d in data.items():
        print(
            f"{name:10s} declared={d['_declared']:4d} "
            f"unique={len(d['unique']):4d} internal_dupes={len(d['internal_dupes'])}"
        )

    C = set(data["canonical"]["unique"])
    A = set(data["donor_app"]["unique"])
    R = set(data["donor_rc"]["unique"])
    cc, ca, cr = (data[k]["components"] for k in ("canonical", "donor_app", "donor_rc"))

    report = {
        "generated": "2026-09-20",
        "canonical": "sam-russell-corpus/russell-capital-systems",
        "counts": {
            "canonical_routes": len(C),
            "donor_app_routes": len(A),
            "donor_rc_routes": len(R),
            "canonical_internal_duplicates": len(data["canonical"]["internal_dupes"]),
            "donor_app_internal_duplicates": len(data["donor_app"]["internal_dupes"]),
            "donor_rc_internal_duplicates": len(data["donor_rc"]["internal_dupes"]),
            "donor_rc_not_in_canonical": len(R - C),
            "donor_app_not_in_canonical": len(A - C),
            "union_not_in_canonical": len((A | R) - C),
            "union_all": len(C | A | R),
            "collisions_rc_vs_canonical": len(R & C),
            "collisions_app_vs_canonical": len(A & C),
        },
        "donor_app_internal_duplicates": data["donor_app"]["internal_dupes"],
        "gamification": {
            g: {
                "canonical": g in C,
                "donor_app": g in A,
                "donor_rc": g in R,
                "component_canonical": cc.get(g),
                "component_donor_rc": cr.get(g),
            }
            for g in GAMIFICATION
        },
        "donor_app_exclusive": sorted(A - C - R),
        "donor_rc_exclusive": sorted(R - C - A),
        "collisions_rc_vs_canonical": [
            {
                "route": r,
                "canonical_component": cc.get(r),
                "donor_rc_component": cr.get(r),
                "same_component_name": cc.get(r) == cr.get(r),
            }
            for r in sorted(R & C)
        ],
        "donor_rc_not_in_canonical": sorted(R - C),
    }

    for name, d in data.items():
        d.pop("_declared", None)

    with open(os.path.join(HERE, "raw_routes.json"), "w") as fh:
        json.dump(data, fh, indent=1)
    with open(os.path.join(HERE, "route_collision_report.json"), "w") as fh:
        json.dump(report, fh, indent=1)

    conflicts = sum(
        1 for x in report["collisions_rc_vs_canonical"] if not x["same_component_name"]
    )
    print(
        f"\n|R-C|={len(R - C)}  collisions={len(R & C)} "
        f"(component-name conflicts: {conflicts})"
    )
    print("wrote raw_routes.json + route_collision_report.json")


if __name__ == "__main__":
    main()
