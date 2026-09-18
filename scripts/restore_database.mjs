#!/usr/bin/env node
// Restore a backup made by server/backups.ts (or "Back up now" on the
// site-health page) into the database named by DATABASE_URL.
//
//   DATABASE_URL="mysql://USER:PASS@HOST:3306/DBNAME" node scripts/restore_database.mjs backups/rcs-backup-2026-09-06T04-00-00.sql.gz
//   DATABASE_URL=... node scripts/restore_database.mjs s3://bucket/rcs-backups/rcs-backup-....sql.gz
//
// The dump is one statement per line (DROP, CREATE, INSERT batches), so the
// restore replays it line by line inside FOREIGN_KEY_CHECKS=0. Every table in
// the dump is replaced; tables not in the dump are left alone.
import { createReadStream } from "node:fs";
import { createGunzip } from "node:zlib";
import { createInterface } from "node:readline";
import mysql from "mysql2/promise";

const src = process.argv[2];
if (!src) { console.error("Usage: node scripts/restore_database.mjs <file.sql.gz | s3://bucket/key>"); process.exit(1); }
if (!process.env.DATABASE_URL) { console.error("DATABASE_URL is required."); process.exit(1); }

async function openStream(source) {
  if (source.startsWith("s3://")) {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const [, , bucket, ...rest] = source.split("/");
    const client = new S3Client({
      region: process.env.S3_REGION || process.env.AWS_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
      credentials: process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined,
    });
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: rest.join("/") }));
    return res.Body;
  }
  return createReadStream(source);
}

const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL, multipleStatements: false });
const lines = createInterface({ input: (await openStream(src)).pipe(createGunzip()), crlfDelay: Infinity });
let statements = 0, tables = 0;
await conn.query("SET FOREIGN_KEY_CHECKS = 0");
for await (const line of lines) {
  const s = line.trim();
  if (!s || s.startsWith("--")) continue;
  if (/^CREATE TABLE/i.test(s)) tables++;
  await conn.query(s.replace(/;$/, ""));
  statements++;
}
await conn.query("SET FOREIGN_KEY_CHECKS = 1");
await conn.end();
console.log(JSON.stringify({ ok: true, source: src, tables, statements }));
