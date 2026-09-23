import type { Express } from "express";
import { getWorkspaceByOwnerId, portalTokenCanAccessStorageKey } from "../db";
import { callerMayReadStorageKey } from "../storageOwnership";
import { FILE_URL_PREFIX, isStorageConfigured, storageGetSignedUrl } from "../storage";
import { sdk } from "./sdk";

const PUBLIC_ASSET_KEYS = new Set([
  "rcs-concept-16-clean-background_a6ddebf1.png",
  "divorce_calculator_explainer_3a588ea7.mp4",
]);

function isSafeStorageKey(key: string) {
  return key.length > 0 && key.length <= 512 && !key.startsWith("/") && !key.includes("..") && !key.includes("\\") && !key.includes("\0");
}

/**
 * A signed-in caller may read a key only when it belongs to their own workspace
 * (or to them), or when they are the admin; unknown prefixes are refused
 * (server/storageOwnership.ts). The workspace is looked up, never created.
 */
async function sessionMayReadKey(user: { id: number; role?: string | null }, key: string): Promise<boolean> {
  if (user.role === "admin") return true;
  const ws = await getWorkspaceByOwnerId(user.id);
  return callerMayReadStorageKey(key, { userId: user.id, role: user.role, workspaceId: ws?.id ?? null });
}

/** GET /files/{key}: checks access, then redirects to a short-lived signed URL on the firm's own bucket. */
export function registerStorageProxy(app: Express) {
  app.get(`${FILE_URL_PREFIX}*`, async (req, res) => {
    const key = (req.params as Record<string, string>)[0];
    if (!key || !isSafeStorageKey(key)) {
      res.status(400).send("Invalid storage key");
      return;
    }

    let authorized = PUBLIC_ASSET_KEYS.has(key);
    if (!authorized) {
      try {
        const user = await sdk.authenticateRequest(req);
        authorized = await sessionMayReadKey(user, key);
      } catch {
        authorized = false;
      }
    }
    if (!authorized) {
      // Client-portal links: the token is scoped to its own client's documents (db.ts).
      const portalToken = typeof req.query.portalToken === "string" ? req.query.portalToken : "";
      if (portalToken) authorized = await portalTokenCanAccessStorageKey(portalToken, key);
    }

    if (!authorized) {
      res.status(404).send("Not found");
      return;
    }

    if (!isStorageConfigured()) {
      res.status(503).send("File storage is not configured on this host");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch {
      console.error("[StorageProxy] signing failed");
      res.status(502).send("Storage backend error");
    }
  });
}
