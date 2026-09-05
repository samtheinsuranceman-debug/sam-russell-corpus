#!/usr/bin/env bash
# Export the complete database schema (every table in drizzle/schema.ts) as one
# plain SQL file: database/rcs-schema.sql. Needs no database — drizzle-kit
# generates it from the TypeScript schema. Import the file in phpMyAdmin / the
# mysql CLI to build the database on any MySQL 8 or MariaDB 10.6+ host, or use
# scripts/build_database.sh to apply the schema directly with DATABASE_URL.
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# drizzle-kit generate never connects; the config only insists the variable exists.
DATABASE_URL="${DATABASE_URL:-mysql://unused:unused@127.0.0.1:1/unused}" \
  npx drizzle-kit generate --dialect=mysql --schema=./drizzle/schema.ts --out="$TMP" >/dev/null

SRC="$(ls "$TMP"/*.sql | head -1)"
mkdir -p database
{
  echo "-- Russell Capital Systems — complete database schema"
  echo "-- Generated from drizzle/schema.ts by scripts/export_schema_sql.sh; do not hand-edit."
  echo "-- Tables: $(grep -c '^CREATE TABLE' "$SRC")"
  echo "-- Import: mysql -u USER -p DBNAME < database/rcs-schema.sql   (or phpMyAdmin → Import)"
  echo "-- The database itself must already exist (create it in cPanel → MySQL Databases)."
  echo
  echo "SET NAMES utf8mb4;"
  echo "SET FOREIGN_KEY_CHECKS = 0;"
  echo
  # drizzle separates statements with a marker comment; plain SQL needs none.
  grep -v -- '--> statement-breakpoint' "$SRC"
  echo
  echo "SET FOREIGN_KEY_CHECKS = 1;"
} > database/rcs-schema.sql
echo "wrote database/rcs-schema.sql ($(grep -c '^CREATE TABLE' database/rcs-schema.sql) tables)"
