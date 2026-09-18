import type { Express } from "express";
import { portalTokenCanAccessStorageKey } from "../db";
import { ENV } from "./env";
import { sdk } from "./sdk";

const PUBLIC_ASSET_KEYS = new Set([
  "rcs-concept-16-clean-background_a6ddebf1.png",
  "divorce_calculator_explainer_3a588ea7.mp4",
]);

function isSafeStorageKey(key: string) {
  return key.length > 0 && key.length <= 512 && !key.startsWith("/") && !key.includes("..") && !key.includes("\\") && !key.includes("\0");
}

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
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

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(500).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL("v1/storage/presign/get", ENV.forgeApiUrl.replace(/\/+$/, "") + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, { headers: { Authorization: `Bearer ${ENV.forgeApiKey}` } });
      if (!forgeResp.ok) {
        console.error(`[StorageProxy] backend status ${forgeResp.status}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = (await forgeResp.json()) as { url?: string };
      if (!url) {
        res.status(502).send("Storage backend error");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch {
      console.error("[StorageProxy] request failed");
      res.status(502).send("Storage proxy error");
    }
  });
}
