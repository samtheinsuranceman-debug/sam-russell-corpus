# Migration ledger

Hand-numbered SQL files in `drizzle/migrations/`. Take the next free number
here **before** you write the file, so parallel branches don't collide.
Every migration is additive (CREATE TABLE / ADD COLUMN / CREATE INDEX).

| No. | File / owner | Status |
|---|---|---|
| 0000–0055 | drizzle-kit generated history | merged |
| 0056–0069 | not present in this folder | unused |
| 0070–0074 | runtime alignment, slide usage, risk/compliance, experience tables, engine chains | merged |
| 0075–0081 | reserved for earlier rows (see the 0082 header) | reserved |
| 0082 | `0082_site_map_and_hive.sql` | merged |
| 0083 | genome branch | open branch |
| 0084 | skins branch | open branch |
| 0085 | `claude/workspace-scoping-m1bkv3` (`slide_shares.expiresAt`) | open branch |
| 0086 | `0086_council_runs.sql` (`claude/council-engine-m1bkv3`) | open branch |

`database/rcs-schema.sql` is regenerated from `drizzle/schema.ts` by
`scripts/export_schema_sql.sh`. That script currently drops every
`CREATE INDEX` line (they end with drizzle's `--> statement-breakpoint`
marker), so indexes in a migration have to be applied to a live database
by hand.
