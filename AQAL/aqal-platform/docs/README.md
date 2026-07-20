# AQAL Intelligence — Documentation

Start here, in order:

1. **AQAL_MASTER_CONTINUITY.md** — what the platform is, the measurement model, what's built,
   what's not, open decisions, and where everything lives. Read this first.
2. **INSTRUCTIONS_TO_ASSEMBLE.md** — build/run/deploy + the external services and manual steps a
   human must wire up (DB, Stripe, voice STT, LLM keys, PDF, generational data).
3. **RESEARCH_LIBRARY_CATALOG.md** — human-readable catalog of all 3,307 research clusters
   (grouped by lens + section, with scores, evidence tags, and source counts).
4. **research_library_catalog.csv** — the same catalog as a spreadsheet (one row per cluster).

Also at project root: HANDOFF_TO_MANUS.md, LAUNCH_KIT.md, RESEARCH_PIPELINE.md, MECHANICS_REVIEW.md.

Regenerate the catalog after adding clusters:  `python3 scripts/gen_catalog.py`
