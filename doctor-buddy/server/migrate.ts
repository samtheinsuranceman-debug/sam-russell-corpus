/**
 * Apply the drizzle migrations in order, once each, against DATABASE_URL.
 *
 * Runs as the Railway pre-deploy command (`node dist/migrate.js`) so the
 * schema is on the same revision as the code that is about to serve it, and
 * a forgotten migration is a failed deploy rather than a boot loop. The
 * database named in DATABASE_URL is created when it does not exist yet.
 *
 * Bookkeeping lives in `__doctor_buddy_migrations` (file name, checksum,
 * applied-at). A file whose checksum changed after it was applied stops the
 * run: migrations are append-only.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import mysql from "mysql2/promise";

const BREAKPOINT = "--> statement-breakpoint";

function migrationsDir(): string {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    path.resolve(process.cwd(), "drizzle"),
    path.resolve(import.meta.dirname ?? ".", "../drizzle"),
  ].filter((p): p is string => Boolean(p));
  for (const dir of candidates) if (fs.existsSync(dir)) return dir;
  throw new Error(`No drizzle directory found (looked in ${candidates.join(", ")})`);
}

export function listMigrations(dir = migrationsDir()): Array<{ name: string; sql: string; checksum: string }> {
  return fs.readdirSync(dir)
    .filter(f => /^\d{4}_.*\.sql$/.test(f))
    .sort()
    .map(name => {
      const sql = fs.readFileSync(path.join(dir, name), "utf8");
      return { name, sql, checksum: createHash("sha256").update(sql).digest("hex") };
    });
}

export function splitStatements(sql: string): string[] {
  const chunks = sql.includes(BREAKPOINT) ? sql.split(BREAKPOINT) : sql.split(/;\s*(?:\r?\n|$)/);
  return chunks
    .map(c => c.split("\n").filter(line => !/^\s*--/.test(line)).join("\n").trim().replace(/;\s*$/, ""))
    .filter(c => c.length > 0);
}

async function ensureDatabase(url: URL): Promise<void> {
  const database = url.pathname.replace(/^\//, "");
  if (!database) throw new Error("DATABASE_URL must name a database");
  const admin = await mysql.createConnection({ host: url.hostname, port: Number(url.port || 3306), user: decodeURIComponent(url.username), password: decodeURIComponent(url.password), ssl: url.searchParams.get("ssl") ? { rejectUnauthorized: false } : undefined });
  try {
    await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  } finally {
    await admin.end();
  }
}

export async function migrate(databaseUrl = process.env.DATABASE_URL): Promise<{ applied: string[]; skipped: number }> {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const url = new URL(databaseUrl);
  await ensureDatabase(url);
  const conn = await mysql.createConnection({ uri: databaseUrl, multipleStatements: false });
  const applied: string[] = [];
  let skipped = 0;
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS \`__doctor_buddy_migrations\` (
      \`name\` varchar(255) NOT NULL PRIMARY KEY,
      \`checksum\` char(64) NOT NULL,
      \`appliedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const [rows] = await conn.query("SELECT `name`, `checksum` FROM `__doctor_buddy_migrations`") as unknown as [Array<{ name: string; checksum: string }>];
    const done = new Map(rows.map(r => [r.name, r.checksum]));
    for (const m of listMigrations()) {
      const seen = done.get(m.name);
      if (seen) {
        if (seen !== m.checksum) throw new Error(`Migration ${m.name} changed after it was applied (checksum ${seen} → ${m.checksum}). Migrations are append-only.`);
        skipped += 1;
        continue;
      }
      console.log(`[migrate] applying ${m.name}`);
      for (const statement of splitStatements(m.sql)) {
        try {
          await conn.query(statement);
        } catch (error) {
          const code = (error as { code?: string }).code;
          // A table or column that already exists (a hand-applied earlier
          // schema) is not a failure; anything else is.
          if (code === "ER_TABLE_EXISTS_ERROR" || code === "ER_DUP_FIELDNAME" || code === "ER_DUP_KEYNAME") continue;
          throw new Error(`Migration ${m.name} failed on: ${statement.slice(0, 120)} — ${(error as Error).message}`);
        }
      }
      await conn.query("INSERT INTO `__doctor_buddy_migrations` (`name`, `checksum`) VALUES (?, ?)", [m.name, m.checksum]);
      applied.push(m.name);
    }
  } finally {
    await conn.end();
  }
  return { applied, skipped };
}

const isMain = process.argv[1] && /migrate\.(js|ts)$/.test(process.argv[1]);
if (isMain) {
  migrate()
    .then(r => {
      console.log(`[migrate] done: ${r.applied.length} applied, ${r.skipped} already in place`);
      process.exit(0);
    })
    .catch(error => {
      console.error("[migrate] failed:", error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
