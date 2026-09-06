# Recovery Plan — Russell Capital Systems

What to do when the database, the host, or the domain is lost. Every step
uses only what is in this repository plus the host's environment panel.

## What is backed up, and where
- **The database** (every table, as SQL) — daily at `BACKUP_HOUR_UTC` (default 04:00 UTC) by `server/backups.ts`, and on demand from `/portal/site-health` → **Back up now**.
  - Off-site when `BACKUP_S3_BUCKET` and the `S3_*` credentials are set: `s3://<bucket>/<BACKUP_S3_PREFIX>rcs-backup-<timestamp>.sql.gz` (any S3-compatible store: AWS S3, Cloudflare R2, Backblaze B2, MinIO).
  - On the host otherwise: `BACKUP_DIR` (default `./backups`), last `BACKUP_KEEP` (14) copies. On Railway this folder is ephemeral unless a volume is mounted — set the bucket.
  - Every run is recorded in `backup_runs` (status, destination, size, rows).
- **The code** — GitHub `master`; the deploy branch `deploy/rcs` is a subtree of it.
- **Secrets** — only in the host's environment panel. Keep a copy of the *names* (`docs/ULTRA_AI_ENV.md`, `LAUNCH.md` §4); never the values, in any file.
- **Files uploaded by clients** — the storage provider configured for uploads (S3 / Forge); not part of the SQL dump.

## Restore the database (about 10 minutes)
1. Create an empty MySQL 8 / MariaDB 10.6+ database and note its `DATABASE_URL`.
2. From a checkout of the repo with dependencies installed:
   ```bash
   DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME" pnpm db:restore backups/rcs-backup-2026-09-06T04-00-00.sql.gz
   # or straight from the bucket:
   DATABASE_URL="…" S3_REGION=… S3_ENDPOINT=… S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… pnpm db:restore s3://BUCKET/rcs-backups/rcs-backup-….sql.gz
   ```
   The dump is one statement per line; the script replays it with foreign-key checks off and prints the table and statement counts.
3. Run `DATABASE_URL="…" pnpm db:build` — it adds any table created by code newer than the backup (CREATE TABLE IF NOT EXISTS; existing data untouched).
4. Point the app at the new `DATABASE_URL` and open `/healthz` (expects `"db":"ok"`), then `/portal/site-health`.

## Rebuild the host (about 20 minutes)
1. Railway → New service from GitHub, repo `samtheinsuranceman-debug/sam-russell-corpus`, branch `deploy/rcs`, root `/`.
2. Set the variables from `LAUNCH.md` §4 (at minimum `DATABASE_URL`, `JWT_SECRET`, `OWNER_EMAIL`, `OWNER_PASSWORD_HASH`; then `CANONICAL_HOST`, `PUBLIC_BASE_URL`, mail, AI, backup and business variables). Rotate any key that ever appeared outside the panel.
3. Boot runs `scripts/build_database.sh` and creates missing tables; restore the dump per the section above if the database is new.
4. Attach the domain in Railway and update DNS per `docs/grok-handoff/09_DNS_AND_MAIL_RECORDS.md`; set `CANONICAL_HOST` so http and the apex/www sibling 301 to the canonical host.
5. Verify from outside: `/healthz`, `/robots.txt`, `/sitemap.xml`, a 404 for a made-up path, and the headers (`strict-transport-security`, `content-security-policy`).

## Quarterly drill (30 minutes)
Restore the newest backup into a scratch database, start the app against it locally (`LAUNCH.md` §5–7), sign in as owner, open `/portal/leads` and `/portal/site-health`. Record the date in the quarterly audit note.

## If the domain is lost
The app keeps serving on the Railway domain; canonical links follow `PUBLIC_BASE_URL`. Re-point DNS when the registrar account is recovered; nothing in the code needs to change.
