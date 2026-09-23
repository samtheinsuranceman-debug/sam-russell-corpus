// ============================================================
// FILE STORAGE — uploads go to the firm's own S3-compatible bucket (AWS S3,
// Cloudflare R2, Backblaze B2, MinIO…), the same kind of store the database
// backups use (server/backups.ts). Downloads are served as /files/{key} by
// server/_core/storageProxy.ts, which checks access and then redirects to a
// short-lived signed URL.
//
// Host environment:
//   STORAGE_S3_BUCKET   the bucket (required; with it unset, storage is off and
//                       every upload fails with a clear "not configured" error)
//   STORAGE_S3_PREFIX   key prefix inside the bucket (default "files/")
//   S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY  credentials
// ============================================================

export const FILE_URL_PREFIX = "/files/";

type Env = Record<string, string | undefined>;

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("File storage is not configured on this host (set STORAGE_S3_BUCKET and the S3_* credentials).");
    this.name = "StorageNotConfiguredError";
  }
}

export type StorageConfig = { bucket: string; prefix: string; region: string; endpoint?: string; accessKeyId?: string; secretAccessKey?: string };

export function storageConfig(env: Env = process.env): StorageConfig | null {
  const bucket = env.STORAGE_S3_BUCKET?.trim();
  if (!bucket) return null;
  return {
    bucket,
    prefix: (env.STORAGE_S3_PREFIX ?? "files/").replace(/^\/+/, ""),
    region: env.S3_REGION || env.AWS_REGION || "auto",
    endpoint: env.S3_ENDPOINT || undefined,
    accessKeyId: env.S3_ACCESS_KEY_ID || undefined,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY || undefined,
  };
}

export function isStorageConfigured(env: Env = process.env): boolean {
  return storageConfig(env) !== null;
}

function requireConfig(): StorageConfig {
  const cfg = storageConfig();
  if (!cfg) throw new StorageNotConfiguredError();
  return cfg;
}

async function s3Client(cfg: StorageConfig) {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: cfg.region,
    endpoint: cfg.endpoint,
    forcePathStyle: Boolean(cfg.endpoint),
    credentials: cfg.accessKeyId && cfg.secretAccessKey ? { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey } : undefined,
  });
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const cfg = requireConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const { PutObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client(cfg);
  const body = typeof data === "string" ? Buffer.from(data, "utf8") : Buffer.from(data);
  await client.send(new PutObjectCommand({ Bucket: cfg.bucket, Key: cfg.prefix + key, Body: body, ContentType: contentType }));
  return { key, url: `${FILE_URL_PREFIX}${key}` };
}

export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `${FILE_URL_PREFIX}${key}` };
}

/** A signed download URL valid for five minutes. */
export async function storageGetSignedUrl(relKey: string, expiresInSeconds = 300): Promise<string> {
  const cfg = requireConfig();
  const key = normalizeKey(relKey);
  const [{ GetObjectCommand }, { getSignedUrl }] = await Promise.all([
    import("@aws-sdk/client-s3"),
    import("@aws-sdk/s3-request-presigner"),
  ]);
  const client = await s3Client(cfg);
  return getSignedUrl(client, new GetObjectCommand({ Bucket: cfg.bucket, Key: cfg.prefix + key }), { expiresIn: expiresInSeconds });
}

/** Read a stored object's bytes directly from the bucket, refusing anything larger than `maxBytes`. */
export async function storageGetBytes(relKey: string, maxBytes = 15 * 1024 * 1024): Promise<{ body: Buffer; contentType: string }> {
  const cfg = requireConfig();
  const key = normalizeKey(relKey);
  const { GetObjectCommand } = await import("@aws-sdk/client-s3");
  const client = await s3Client(cfg);
  const res = await client.send(new GetObjectCommand({ Bucket: cfg.bucket, Key: cfg.prefix + key }));
  if (typeof res.ContentLength === "number" && res.ContentLength > maxBytes) throw new Error(`Stored file is larger than ${maxBytes} bytes`);
  const bytes = res.Body ? await res.Body.transformToByteArray() : new Uint8Array();
  if (bytes.byteLength > maxBytes) throw new Error(`Stored file is larger than ${maxBytes} bytes`);
  return { body: Buffer.from(bytes), contentType: res.ContentType ?? "application/octet-stream" };
}
