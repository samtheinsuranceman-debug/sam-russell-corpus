import type { Express, Request, Response } from "express";
import { storageGetSignedUrl } from "../platform/storage";

async function serveStorageObject(req: Request, res: Response) {
  const key = (req.params as Record<string, string>)[0];
  if (!key) {
    res.status(400).send("Missing storage key");
    return;
  }

  try {
    const url = await storageGetSignedUrl(key);
    if (!url) {
      res.status(502).send("Empty signed URL from storage provider");
      return;
    }

    res.set("Cache-Control", "no-store");
    res.redirect(307, url);
  } catch (err) {
    console.error("[StorageProxy] failed:", err);
    res.status(502).send("Storage proxy error");
  }
}

export function registerStorageProxy(app: Express) {
  app.get("/aqal-storage/*", serveStorageObject);
}
