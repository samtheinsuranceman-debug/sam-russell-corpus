import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { sdk, type AuthenticatedUser } from "./_core/sdk";
import { CRON_SECRET } from "./platform/config";

function externalCronSecretMatches(req: Request): boolean {
  if (!CRON_SECRET) return false;
  const header = req.headers?.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) return false;
  const candidate = header.slice(7);
  const expectedBuffer = Buffer.from(CRON_SECRET);
  const candidateBuffer = Buffer.from(candidate);
  return expectedBuffer.length === candidateBuffer.length
    && timingSafeEqual(expectedBuffer, candidateBuffer);
}

function externalCronUser(req: Request): AuthenticatedUser {
  const now = new Date();
  return {
    id: -1,
    openId: "cron_bluehost",
    name: "AQAL External Scheduler",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: `external:${req.path || req.originalUrl || "scheduled"}`,
    isCron: true,
  } as AuthenticatedUser;
}

export async function requireScheduledCron(req: Request, res: Response): Promise<AuthenticatedUser | null> {
  if (externalCronSecretMatches(req)) {
    return externalCronUser(req);
  }
  let user: AuthenticatedUser;
  try {
    user = await sdk.authenticateRequest(req);
  } catch {
    res.status(403).json({ error: "cron-only" });
    return null;
  }
  if (!user.isCron || !user.taskUid) {
    res.status(403).json({ error: "cron-only" });
    return null;
  }
  return user;
}

export function scheduledFailure(req: Request, res: Response, error: unknown, taskUid?: string) {
  const err = error instanceof Error ? error : new Error(String(error));
  return res.status(500).json({
    error: err.message,
    stack: err.stack,
    context: { url: req.originalUrl, taskUid: taskUid ?? null },
    timestamp: new Date().toISOString(),
  });
}
