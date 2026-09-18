# Page audit pipeline

Regenerates `docs/audit/` from the current source tree. Run in order:

```bash
python3 scripts/audit/inventory.py   # -> pages.json      (per-page metadata)
python3 scripts/audit/integrity.py   # -> integrity.json  (defect flags)
python3 scripts/audit/score.py       # -> scored.json, audit.csv
python3 scripts/audit/report.py      # -> docs/audit/*.md, *.csv, pageRegistry.json
```

Intermediate JSON is written next to the scripts. Everything is static analysis —
no build, no server, no network.

`pageRegistry.json` is the contract the AI brain should consume. It must be
regenerated in CI, never hand-edited.
