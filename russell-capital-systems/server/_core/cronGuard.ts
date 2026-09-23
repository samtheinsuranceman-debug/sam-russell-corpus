import type { NextFunction, Request, Response } from "express";

/**
 * Fail-closed gate for every `/api/cron/*` endpoint.
 *
 * - `CRON_SECRET` unset  → 503. The scheduler is not configured, so no cron
 *   job may run; an open endpoint would let anyone trigger digests, emails
 *   and snapshots. Previously each handler ran unauthenticated in this case.
 * - secret set, wrong    → 403 (unchanged behaviour).
 * - secret set, matches  → next().
 *
 * The secret is read on every request (not at import) so tests and hot
 * reconfiguration see the current environment.
 */
export function cronGuard(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    res.status(503).json({ error: "CRON_SECRET is not configured; cron endpoints are disabled" });
    return;
  }
  const supplied = typeof req.query.secret === "string" ? req.query.secret : req.get("x-cron-secret");
  if (supplied !== secret) {
    res.status(403).json({ error: "Invalid cron secret" });
    return;
  }
  next();
}
