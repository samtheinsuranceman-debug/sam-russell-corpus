// ============================================================
// DATABASE BACKUPS — a daily dump of every table, written as plain SQL
// (one statement per line, gzip-compressed) that scripts/restore_database.mjs
// or the mysql client can replay on any MySQL 8 / MariaDB host. Uploaded to
// S3-compatible storage when BACKUP_S3_BUCKET is set (off-site), otherwise
// kept in BACKUP_DIR (on-host). Every run is recorded in backup_runs so the
// site-health page can say when the last good copy was made and where it is.
//
// Switches (host environment only):
//   BACKUP_DISABLED=1          turn the schedule off
//   BACKUP_HOUR_UTC=4          hour of the day to run (default 04:00 UTC)
//   BACKUP_S3_BUCKET           bucket for off-site copies (S3, R2, B2, MinIO…)
//   BACKUP_S3_PREFIX           key prefix (default "rcs-backups/")
//   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY  credentials
//   BACKUP_DIR=./backups       local folder when no bucket is set
//   BACKUP_KEEP=14             how many local copies to keep
// ============================================================
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import mysql from "mysql2/promise";
import { desc, eq } from "drizzle-orm";
import { backupRuns } from "../drizzle/schema";
import { getDb } from "./db";

type Env = Record<string, string | undefined>;

export type BackupTarget = { kind: "s3"; bucket: string; prefix: string } | { kind: "local"; dir: string } | { kind: "off"; reason: string };

export function backupTarget(env: Env = process.env): BackupTarget {
  if (env.BACKUP_DISABLED === "1") return { kind: "off", reason: "BACKUP_DISABLED=1" };
  if (!env.DATABASE_URL) return { kind: "off", reason: "no DATABASE_URL" };
  const bucket = env.BACKUP_S3_BUCKET?.trim();
  if (bucket) return { kind: "s3", bucket, prefix: (env.BACKUP_S3_PREFIX ?? "rcs-backups/").replace(/^\/+/, "") };
  return { kind: "local", dir: path.resolve(env.BACKUP_DIR || "backups") };
}

/** Values the SQL dump can carry: JSON columns come back as objects on MySQL 8 and must be re-serialised, never spread as `key = value`. */
export function sqlLiteral(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number" || typeof v === "bigint") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (Buffer.isBuffer(v)) return `X'${v.toString("hex")}'`;
  if (v instanceof Date) return mysql.escape(v.toISOString().slice(0, 19).replace("T", " "));
  if (typeof v === "object") return mysql.escape(JSON.stringify(v));
  return mysql.escape(String(v));
}

export type DumpResult = { sql: string; tables: number; rows: number };

/** Dumps every table of the connected database: DROP + CREATE + INSERT batches, one statement per line. */
export async function dumpDatabase(databaseUrl: string, batch = 500): Promise<DumpResult> {
  const conn = await mysql.createConnection({ uri: databaseUrl, dateStrings: true, supportBigNumbers: true, bigNumberStrings: true });
  try {
    const dbName = decodeURIComponent(new URL(databaseUrl).pathname.replace(/^\//, ""));
    const [tableRows] = await conn.query<mysql.RowDataPacket[]>("SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE' ORDER BY table_name", [dbName]);
    const lines: string[] = [
      `-- Russell Capital Systems backup of ${dbName} at ${new Date().toISOString()}`,
      "SET NAMES utf8mb4;",
      "SET FOREIGN_KEY_CHECKS = 0;",
    ];
    let rows = 0;
    for (const { t } of tableRows as Array<{ t: string }>) {
      const [[create]] = await conn.query<mysql.RowDataPacket[]>(`SHOW CREATE TABLE \`${t}\``);
      const ddl = String((create as Record<string, unknown>)["Create Table"] ?? "").replace(/\r?\n/g, " ");
      lines.push(`DROP TABLE IF EXISTS \`${t}\`;`, `${ddl};`);
      let offset = 0;
      for (;;) {
        const [data] = await conn.query<mysql.RowDataPacket[]>(`SELECT * FROM \`${t}\` LIMIT ${batch} OFFSET ${offset}`);
        if (!data.length) break;
        const cols = Object.keys(data[0]!);
        const values = data.map((r) => `(${cols.map((c) => sqlLiteral((r as Record<string, unknown>)[c])).join(",")})`).join(",");
        lines.push(`INSERT INTO \`${t}\` (${cols.map((c) => `\`${c}\``).join(",")}) VALUES ${values};`);
        rows += data.length;
        offset += data.length;
        if (data.length < batch) break;
      }
    }
    lines.push("SET FOREIGN_KEY_CHECKS = 1;", "");
    return { sql: lines.join("\n"), tables: tableRows.length, rows };
  } finally {
    await conn.end().catch(() => undefined);
  }
}

async function uploadToS3(target: Extract<BackupTarget, { kind: "s3" }>, key: string, body: Buffer, env: Env): Promise<string> {
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: env.S3_REGION || env.AWS_REGION || "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(env.S3_ENDPOINT),
    credentials: env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY } : undefined,
  });
  await client.send(new PutObjectCommand({ Bucket: target.bucket, Key: key, Body: body, ContentType: "application/gzip", ContentEncoding: "gzip", Metadata: { sha256: createHash("sha256").update(body).digest("hex") } }));
  return `s3://${target.bucket}/${key}`;
}

function pruneLocal(dir: string, keep: number) {
  const files = fs.readdirSync(dir).filter((f) => /^rcs-backup-.*\.sql\.gz$/.test(f)).sort();
  for (const f of files.slice(0, Math.max(0, files.length - keep))) fs.rmSync(path.join(dir, f), { force: true });
}

export type BackupOutcome = { ok: boolean; destination: string; tables: number; rows: number; bytes: number; error?: string; durationMs: number };

/** One full backup now. Records the run in backup_runs when the database is reachable. */
export async function runBackup(env: Env = process.env): Promise<BackupOutcome> {
  const started = Date.now();
  const target = backupTarget(env);
  if (target.kind === "off") return { ok: false, destination: "", tables: 0, rows: 0, bytes: 0, error: target.reason, durationMs: 0 };
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const name = `rcs-backup-${stamp}.sql.gz`;
  const db = await getDb();
  let runId: number | null = null;
  try {
    if (db) {
      const [ins] = await db.insert(backupRuns).values({ destination: target.kind === "s3" ? `s3://${target.bucket}/${target.prefix}${name}` : path.join(target.dir, name) });
      runId = Number((ins as { insertId?: number }).insertId ?? 0) || null;
    }
    const dump = await dumpDatabase(env.DATABASE_URL!);
    const body = gzipSync(Buffer.from(dump.sql, "utf8"), { level: 9 });
    let destination: string;
    if (target.kind === "s3") destination = await uploadToS3(target, `${target.prefix}${name}`, body, env);
    else {
      fs.mkdirSync(target.dir, { recursive: true });
      destination = path.join(target.dir, name);
      const tmp = path.join(os.tmpdir(), name);
      fs.writeFileSync(tmp, body);
      fs.renameSync(tmp, destination);
      pruneLocal(target.dir, Math.max(1, Number(env.BACKUP_KEEP ?? 14) || 14));
    }
    const outcome: BackupOutcome = { ok: true, destination, tables: dump.tables, rows: dump.rows, bytes: body.length, durationMs: Date.now() - started };
    if (db && runId) await db.update(backupRuns).set({ finishedAt: new Date(), status: "ok", destination, tables: dump.tables, rows: dump.rows, bytes: body.length }).where(eq(backupRuns.id, runId)).catch(() => undefined);
    console.log(`[backup] ok → ${destination} (${dump.tables} tables, ${dump.rows} rows, ${body.length} bytes)`);
    return outcome;
  } catch (e) {
    const error = String((e as Error).message ?? e).slice(0, 500);
    if (db && runId) await db.update(backupRuns).set({ finishedAt: new Date(), status: "failed", error }).where(eq(backupRuns.id, runId)).catch(() => undefined);
    console.error("[backup] failed:", error);
    return { ok: false, destination: "", tables: 0, rows: 0, bytes: 0, error, durationMs: Date.now() - started };
  }
}

export type BackupStatus = { target: BackupTarget; lastOk: { at: string; destination: string; tables: number; rows: number; bytes: number } | null; lastRun: { at: string; status: string; error: string | null } | null; runs: number; nextRunAt: string | null };

export async function backupStatus(env: Env = process.env): Promise<BackupStatus> {
  const target = backupTarget(env);
  const db = await getDb();
  let lastOk: BackupStatus["lastOk"] = null, lastRun: BackupStatus["lastRun"] = null, runs = 0;
  if (db) {
    try {
      const recent = await db.select().from(backupRuns).orderBy(desc(backupRuns.startedAt)).limit(50);
      runs = recent.length;
      const ok = recent.find((r) => r.status === "ok");
      if (ok) lastOk = { at: (ok.finishedAt ?? ok.startedAt).toISOString(), destination: ok.destination, tables: ok.tables, rows: ok.rows, bytes: ok.bytes };
      if (recent[0]) lastRun = { at: recent[0].startedAt.toISOString(), status: recent[0].status, error: recent[0].error };
    } catch { /* table may not exist yet */ }
  }
  return { target, lastOk, lastRun, runs, nextRunAt: target.kind === "off" ? null : nextRunAt(env).toISOString() };
}

export function nextRunAt(env: Env = process.env, now = new Date()): Date {
  const hour = Math.min(23, Math.max(0, Number(env.BACKUP_HOUR_UTC ?? 4) || 0));
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0));
  if (next.getTime() <= now.getTime()) next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

let timer: NodeJS.Timeout | null = null;

/** Arms the daily run; returns false when backups are off. */
export function startBackupSchedule(env: Env = process.env): boolean {
  if (backupTarget(env).kind === "off") return false;
  const arm = () => {
    const wait = Math.max(5_000, nextRunAt(env).getTime() - Date.now());
    timer = setTimeout(async () => { await runBackup(env); arm(); }, wait);
    timer.unref?.();
  };
  arm();
  return true;
}

export function stopBackupSchedule() { if (timer) clearTimeout(timer); timer = null; }
