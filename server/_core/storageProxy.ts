import type { Express } from "express";
import { portalTokenCanAccessStorageKey } from "../db";
import { FILE_URL_PREFIX, isStorageConfigured, storageGetSignedUrl } from "../storage";
import { sdk } from "./sdk";

const PUBLIC_ASSET_KEYS = new Set([
  "rcs-concept-16-clean-background_a6ddebf1.png",
  "divorce_calculator_explainer_3a588ea7.mp4",
]);

function isSafeStorageKey(key: string) {
  return key.length > 0 && key.length <= 512 && !key.startsWith("/") && !key.includes("..") && !key.includes("\\") && !key.includes("\0");
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
        await sdk.authenticateRequest(req);
        authorized = true;
      } catch {
        const portalToken = typeof req.query.portalToken === "string" ? req.query.portalToken : "";
        authorized = await portalTokenCanAccessStorageKey(portalToken, key);
      }
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
