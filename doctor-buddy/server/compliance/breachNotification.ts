/**
 * Security-incident notification tracker.
 *
 * Public consumer-wellness deployments can fall under the FTC Health Breach
 * Notification Rule even when HIPAA does not apply. Separately configured
 * covered-entity/business-associate deployments may instead/also trigger HIPAA
 * and state duties. This module deliberately records a conservative outer
 * deadline and requires jurisdiction-aware review rather than pretending one
 * rule covers every incident.
 */
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db";
import { recordAudit } from "./auditLog";
import { PUBLIC_WELLNESS_MODE } from "./releasePolicy";

export const NOTIFICATION_WINDOW_DAYS = 60;
export const MEDIA_NOTICE_THRESHOLD = 500;

export interface AffectedJurisdiction {
  jurisdiction: string;
  residents: number;
}

export interface BreachReport {
  breachType: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  affectedUsers: number[];
  /** Counts by state, DC, territory, or possession when known. */
  affectedJurisdictions?: AffectedJurisdiction[];
  containmentActions: string;
  reportedBy: number;
  discoveredAt?: Date;
}

export function notificationDeadlineFor(discoveredAt: Date): Date {
  return new Date(discoveredAt.getTime() + NOTIFICATION_WINDOW_DAYS * 86_400_000);
}

/**
 * FTC HBNR media notice is jurisdiction-sensitive: at least 500 residents of
 * a single state, DC, territory, or possession. Call this with the largest
 * known affected-resident count for one such jurisdiction, not total users.
 */
export function requiresMediaNotice(largestAffectedJurisdictionCount: number): boolean {
  return largestAffectedJurisdictionCount >= MEDIA_NOTICE_THRESHOLD;
}

function normalizeJurisdictions(input: AffectedJurisdiction[] | undefined): AffectedJurisdiction[] {
  if (!input?.length) return [];
  return input
    .map(item => ({
      jurisdiction: String(item.jurisdiction || "").trim().slice(0, 120),
      residents: Math.max(0, Math.floor(Number(item.residents) || 0)),
    }))
    .filter(item => item.jurisdiction && item.residents > 0);
}

export async function reportBreach(report: BreachReport) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { breachIncidents } = await import("../../drizzle/schema");

  const discoveredAt = report.discoveredAt ?? new Date();
  const affectedCount = report.affectedUsers.length;
  const affectedJurisdictions = normalizeJurisdictions(report.affectedJurisdictions);
  const largestAffectedJurisdictionCount = affectedJurisdictions.reduce(
    (largest, item) => Math.max(largest, item.residents),
    0,
  );
  const deadline = notificationDeadlineFor(discoveredAt);
  const mediaNotice = requiresMediaNotice(largestAffectedJurisdictionCount);
  const mediaThresholdReviewRequired = mediaNotice || affectedCount >= MEDIA_NOTICE_THRESHOLD;
  const regime = PUBLIC_WELLNESS_MODE
    ? "FTC HBNR / state consumer-health review"
    : "HIPAA / FTC / state applicability review";

  const result = await db.insert(breachIncidents).values({
    breachType: report.breachType,
    description: report.description,
    severity: report.severity,
    affectedUsers: report.affectedUsers,
    affectedCount,
    affectedJurisdictions,
    containmentActions: report.containmentActions,
    reportedBy: report.reportedBy,
    discoveredAt,
    notificationDeadline: deadline,
    requiresMediaNotice: mediaNotice,
    status: "open",
  });
  const breachId = (result as unknown as { insertId?: number }).insertId ?? null;

  await recordAudit({
    actorId: report.reportedBy,
    action: "breach.reported",
    resourceType: "breachIncident",
    resourceId: breachId,
    detail: {
      severity: report.severity,
      affectedCount,
      affectedJurisdictions,
      largestAffectedJurisdictionCount,
      mediaNotice,
      mediaThresholdReviewRequired,
      regime,
    },
  });

  const obligations = [
    `Escalate immediately for privacy/security review. For rules using a 60-day outer limit, the conservative outer date tracked here is ${deadline.toISOString().slice(0, 10)}; notification may be required sooner and without unreasonable delay.`,
    PUBLIC_WELLNESS_MODE
      ? "Evaluate FTC Health Breach Notification Rule and applicable state consumer-health/breach laws; do not assume HIPAA controls the incident."
      : "Evaluate HIPAA Breach Notification Rule, FTC applicability, contractual duties, and applicable state law.",
  ];

  if (mediaNotice) {
    obligations.push(
      "Known jurisdiction counts show at least 500 affected residents in one state/DC/territory/possession. Perform immediate media-notice review for that locale in addition to individual and regulator notice analysis.",
    );
  } else if (mediaThresholdReviewRequired) {
    obligations.push(
      "500+ people are affected in total, but the stored jurisdiction counts do not establish a media-notice duty. Determine affected residents by state/DC/territory/possession immediately; do not infer media notice from the total count alone.",
    );
  } else {
    obligations.push(
      "Under 500 affected people are currently recorded. Regulator timing can still differ by governing rule, so preserve the incident record and complete the applicable-law review.",
    );
  }

  return {
    breachId,
    regime,
    affectedCount,
    affectedJurisdictions,
    largestAffectedJurisdictionCount,
    notificationDeadline: deadline,
    requiresMediaNotice: mediaNotice,
    mediaThresholdReviewRequired,
    obligations,
  };
}

export async function getBreachHistory(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  const { breachIncidents } = await import("../../drizzle/schema");
  return await db.select().from(breachIncidents)
    .orderBy(desc(breachIncidents.discoveredAt))
    .limit(Math.min(Math.max(limit, 1), 200));
}

export async function resolveBreachIncident(breachId: number, notes: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const { breachIncidents } = await import("../../drizzle/schema");

  await db.update(breachIncidents)
    .set({ status: "resolved", resolvedAt: new Date(), resolutionNotes: notes })
    .where(eq(breachIncidents.id, breachId));

  await recordAudit({
    action: "breach.resolved",
    resourceType: "breachIncident",
    resourceId: breachId,
    detail: { notes },
  });
  return { success: true };
}
