// ============================================================
// Platform seam — object storage
// ============================================================
// One swappable interface for audio / video / evidence blobs:
//   s3    → AWS S3 or any S3-compatible store (Cloudflare R2, MinIO) via the
//           AWS SDK already in the dependencies. Set S3_ENDPOINT for R2/MinIO.
//   forge → the legacy Manus presigned-URL gateway (kept for migration).
//   local → filesystem under ./.local-storage, served at /local-storage/*.
//           Lets the whole upload → transcribe → score loop run with no cloud.

import { promises as fs } from "fs";
import path from "path";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  storageProvider,
  S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_BASE_URL,
} from "./config";
import {
  storagePut as forgePut,
  storageGetSignedUrl as forgeSignedUrl,
} from "../storage";

export type PutResult = { key: string; url: string };

const LOCAL_DIR = path.resolve(process.cwd(), ".local-storage");

function withHash(relKey: string): string {
  const clean = relKey.replace(/^\/+/, "");
  const hash = randomHash();
  const dot = clean.lastIndexOf(".");
  return dot === -1 ? `${clean}_${hash}` : `${clean.slice(0, dot)}_${hash}${clean.slice(dot)}`;
}

function randomHash(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${process.pid}-${process.hrtime.bigint()}`)
    .replace(/-/g, "").slice(0, 8);
}

let _s3: S3Client | null = null;
function s3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      region: S3_REGION,
      ...(S3_ENDPOINT ? { endpoint: S3_ENDPOINT, forcePathStyle: true } : {}),
      credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
    });
  }
  return _s3;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<PutResult> {
  const provider = storageProvider();

  if (provider === "s3") {
    const key = withHash(relKey);
    const body = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
    await s3().send(new PutObjectCommand({ Bucket: S3_BUCKET, Key: key, Body: body, ContentType: contentType }));
    // Public base (CDN) if provided; otherwise a signed URL on read via storageGetSignedUrl.
    const url = S3_PUBLIC_BASE_URL ? `${S3_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}` : `/s3-storage/${key}`;
    return { key, url };
  }

  if (provider === "forge") {
    return forgePut(relKey, data, contentType);
  }

  // local filesystem
  const key = withHash(relKey);
  const dest = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await fs.writeFile(dest, typeof data === "string" ? Buffer.from(data) : Buffer.from(data));
  return { key, url: `/local-storage/${key}` };
}

export async function storageGetSignedUrl(relKey: string): Promise<string> {
  const provider = storageProvider();
  const key = relKey.replace(/^\/+/, "");

  if (provider === "s3") {
    return getSignedUrl(s3(), new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }), { expiresIn: 3600 });
  }
  if (provider === "forge") {
    return forgeSignedUrl(relKey);
  }
  return `/local-storage/${key}`;
}

// Permanent deletion — used by the 72-hour attachment purge. Best-effort: a
// missing object is success (already gone), and forge has no delete API so we
// log and continue (forge is a legacy path being migrated off).
export async function storageDelete(relKey: string): Promise<boolean> {
  const provider = storageProvider();
  const key = relKey.replace(/^\/+/, "");
  try {
    if (provider === "s3") {
      await s3().send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
      return true;
    }
    if (provider === "forge") {
      console.warn(`[storage] forge provider has no delete API — cannot purge ${key}`);
      return false;
    }
    await fs.unlink(path.join(LOCAL_DIR, key)).catch(() => {});
    return true;
  } catch (err) {
    console.error(`[storage] delete failed for ${key}:`, err instanceof Error ? err.message : err);
    return false;
  }
}

export const LOCAL_STORAGE_DIR = LOCAL_DIR;
