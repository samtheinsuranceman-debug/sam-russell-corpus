import type { Request, Response } from "express";
import { runDailyAccountability } from "./accountability";
import { requireScheduledCron, scheduledFailure } from "./scheduledAuth";

export async function dailyRemindersHandler(req: Request, res: Response) {
  let taskUid: string | undefined;
  try {
    const user = await requireScheduledCron(req, res);
    if (!user) return;
    taskUid = user.taskUid;
    return res.json({ ok: true, ...(await runDailyAccountability()) });
  } catch (error) {
    return scheduledFailure(req, res, error, taskUid);
  }
}
