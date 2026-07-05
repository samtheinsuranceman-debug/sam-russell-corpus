/**
 * Scheduled Drift Alert Handler
 * 
 * Runs on a daily heartbeat schedule. Checks the evaluation cadence
 * for drift (declining metrics over recent sessions) and notifies
 * the owner if any alerts are detected.
 */

import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { notifyOwner } from "./_core/notification";
import { getEvaluationReport } from "./corpus";

export async function driftAlertHandler(req: Request, res: Response) {
  try {
    // Authenticate — only cron can call this
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron || !user.taskUid) {
      return res.status(403).json({ error: "cron-only" });
    }

    // Get the evaluation report
    const report = getEvaluationReport();

    // Check for drift alerts
    if (report.driftAlerts.length > 0) {
      const alertContent = [
        "## Buddy Alignment Drift Detected",
        "",
        `**${report.driftAlerts.length} metric(s) declining:**`,
        "",
        ...report.driftAlerts.map(a => `- ${a}`),
        "",
        `**Last ${Math.min(report.entries.length, 5)} session scores:**`,
        "",
        ...report.entries.slice(0, 5).map(e =>
          `- Session ${e.sessionId}: ${e.overallScore}/10 (${new Date(e.timestamp).toISOString().split("T")[0]})`
        ),
        "",
        "Review the evaluation cadence and consider recalibration.",
      ].join("\n");

      const sent = await notifyOwner({
        title: `⚠️ Buddy Drift Alert: ${report.driftAlerts.length} metric(s) declining`,
        content: alertContent,
      });

      return res.json({
        ok: true,
        driftDetected: true,
        alertCount: report.driftAlerts.length,
        notificationSent: sent,
      });
    }

    // No drift — all good
    return res.json({
      ok: true,
      driftDetected: false,
      totalSessions: report.entries.length,
      latestScore: report.entries[0]?.overallScore ?? null,
    });
  } catch (error: any) {
    console.error("[DriftAlert] Error:", error);
    return res.status(500).json({
      error: error.message || "Unknown error",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      context: { url: req.url, taskUid: "unknown" },
      timestamp: new Date().toISOString(),
    });
  }
}
