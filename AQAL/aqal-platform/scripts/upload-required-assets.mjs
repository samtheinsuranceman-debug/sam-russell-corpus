import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error("Usage: node scripts/upload-required-assets.mjs /absolute/path/to/original-aqal-media");
  process.exit(2);
}

const required = [
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
];
const missingConfig = required.filter((name) => !process.env[name]);
if (missingConfig.length) {
  console.error(`Missing environment variables: ${missingConfig.join(", ")}`);
  process.exit(2);
}

const manifestUrl = new URL("../docs/required-storage-assets.txt", import.meta.url);
const manifest = (await readFile(manifestUrl, "utf8"))
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const client = new S3Client({
  region: process.env.S3_REGION || "auto",
  ...(process.env.S3_ENDPOINT
    ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true }
    : {}),
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const contentType = (name) => {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
};

let uploaded = 0;
for (const key of manifest) {
  const filePath = path.resolve(sourceDir, key);
  let body;
  try {
    body = await readFile(filePath);
  } catch {
    console.error(`Missing source file: ${filePath}`);
    process.exitCode = 1;
    continue;
  }

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType(key),
    }),
  );
  uploaded += 1;
  console.log(`UPLOADED  ${key}`);
}

if (process.exitCode) {
  console.error(`Upload incomplete: ${uploaded} of ${manifest.length} files uploaded.`);
  process.exit(process.exitCode);
}

console.log(`Upload complete: ${uploaded} required assets uploaded.`);
