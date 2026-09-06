#!/usr/bin/env bash
# Build the Russell Capital Systems database from database/rcs-schema.sql,
# then prove every table defined in drizzle/schema.ts exists.
#
#   DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME" pnpm db:build
#
# The database itself must already exist (cPanel → MySQL Databases, or
# `CREATE DATABASE ...`). Every CREATE TABLE runs as CREATE TABLE IF NOT EXISTS,
# so this is safe to re-run: existing tables (and their data) are untouched and
# missing tables are added. Works on MySQL 8 and MariaDB 10.6+.
#
# To evolve an existing database after schema.ts changes (new columns etc.),
# use `npx drizzle-kit push` against MySQL 8, or regenerate the SQL file with
# scripts/export_schema_sql.sh and apply the difference by hand.
set -euo pipefail
APP="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP"

: "${DATABASE_URL:?DATABASE_URL is required, e.g. mysql://USER:PASS@HOST:3306/DBNAME}"
[ -f database/rcs-schema.sql ] || bash scripts/export_schema_sql.sh

node --input-type=module - <<'EOF'
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";

const url = new URL(process.env.DATABASE_URL);
const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
const sql = readFileSync("database/rcs-schema.sql", "utf8");
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
  .filter(Boolean)
  .map((s) => s.replace(/^CREATE TABLE `/, "CREATE TABLE IF NOT EXISTS `"));

const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: false });
const listTables = async () => {
  const [rows] = await conn.query(
    "SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ? ORDER BY table_name",
    [dbName],
  );
  return new Set(rows.map((r) => r.t ?? r.TABLE_NAME));
};
const before = await listTables();
console.log(`▶ applying ${statements.filter((s) => s.startsWith("CREATE TABLE")).length} tables to ${dbName} (${before.size} already there) …`);
// CREATE TABLE is made IF NOT EXISTS above; CREATE INDEX has no such form in
// MySQL, so an index that already exists (every re-run) is simply skipped.
const IGNORABLE = new Set(["ER_DUP_KEYNAME", "ER_TABLE_EXISTS_ERROR", "ER_DUP_FIELDNAME"]);
for (const stmt of statements) {
  try { await conn.query(stmt); }
  catch (e) { if (!IGNORABLE.has(e.code)) throw e; }
}

// Column evolutions that CREATE TABLE IF NOT EXISTS cannot apply to a table
// that already exists. Each is idempotent (MODIFY to the full current list).
const evolutions = [
  "ALTER TABLE `plan_events` MODIFY `kind` ENUM('fact','assumption','decision','message','document','outcome','scenario','journey','status','note','consent','mandate','advice','control','automation','rules') NOT NULL",
];
for (const stmt of evolutions) {
  try { await conn.query(stmt); } catch (e) { console.warn("  evolution skipped:", String(e.message ?? e).slice(0, 120)); }
}

const present = await listTables();
const created = [...present].filter((t) => !before.has(t)).length;
const expected = [...readFileSync("drizzle/schema.ts", "utf8").matchAll(/mysqlTable\("([^"]+)"/g)].map((m) => m[1]);
const missing = expected.filter((t) => !present.has(t));
await conn.end();

console.log(`  ${created} newly created; ${present.size} tables now in ${dbName}; ${expected.length} defined in schema`);
if (missing.length) {
  console.error("✘ MISSING: " + missing.join(", "));
  process.exit(1);
}
console.log("✔ database is complete — public_leads, users, workspaces, … all present");
EOF
