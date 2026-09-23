// ============================================================
// VERIFICATION → HIVE — turn a vitest JSON report into `verification`
// events, one per verification engine, so Samuel Goldman knows which
// guarantees held on the build the visitor is using.
//
// WHY. The trunk runs seven verification engines as tests (AG 49-A, patent
// status, route manifest, schema file, S&P series audit, Time Machine
// compliance, brand guard). Their outcomes today reach a CI log and nothing
// else. The interop audit found no page and no prompt that surfaces them.
// After `vitest run --reporter=json --outputFile=verify.json`, this module
// maps each file to its engine name and records pass/fail per engine into
// the hive's working memory for the system user, where `buildHiveContext`
// keeps the latest outcome per engine and hands it to every member.
//
// Pure: the JSON is parsed, nothing is fetched; `record` is injected.
// ============================================================
import type { HiveMemoryEvent } from "@shared/hiveMind";
import { HIVE_VERIFIERS } from "./hiveMind";

/** The subset of vitest's JSON reporter we read (jest-compatible shape). */
export interface VitestJsonReport {
  testResults: { name: string; status: "passed" | "failed" | "skipped" | string; assertionResults?: { status: string; fullName?: string }[] }[];
}

/** Test file (basename, without extension) → verification engine name in the hive roster. */
export const VERIFIER_FILES: Record<string, (typeof HIVE_VERIFIERS)[number]> = {
  "ag49Validator": "ag49Validator",
  "ag49": "ag49Validator",
  "ag49a": "ag49Validator",
  "time-machine-ag49": "ag49Validator",
  "patentStatus": "patentStatus",
  "patentClaimGuard": "patentStatus",
  "routeManifest": "routeManifest",
  "routes": "routeManifest",
  "grok-merge.smoke": "routeManifest",
  "managed-port.smoke": "routeManifest",
  "pr3bPortedPages": "routeManifest",
  "navigation-organization": "routeManifest",
  "databaseSchemaFile": "databaseSchemaFile",
  "sp500SeriesAudit": "sp500SeriesAudit",
  "timeMachineCompliance": "timeMachineCompliance",
  "integrationAudit": "integrationScorecard",
  "concept16Homepage": "brandGuard",
};

function baseName(path: string): string {
  const file = path.split(/[\\/]/).pop() ?? path;
  return file.replace(/\.(test|spec)\.(ts|tsx)$/, "");
}

/** Reduce a report to one event per verifier: fail if any of its files failed, pass if all passed, unverified if none ran. */
export function verificationEventsFromReport(report: VitestJsonReport, buildRef: string): HiveMemoryEvent[] {
  const byEngine = new Map<string, { passed: number; failed: number; files: string[] }>();
  for (const v of HIVE_VERIFIERS) byEngine.set(v, { passed: 0, failed: 0, files: [] });
  for (const r of report.testResults) {
    const engine = VERIFIER_FILES[baseName(r.name)];
    if (!engine) continue;
    const agg = byEngine.get(engine)!;
    const failedAssertions = (r.assertionResults ?? []).filter(a => a.status === "failed").length;
    if (r.status === "failed" || failedAssertions > 0) agg.failed += 1; else if (r.status === "passed") agg.passed += 1;
    agg.files.push(baseName(r.name));
  }
  const events: HiveMemoryEvent[] = [];
  for (const [engine, agg] of Array.from(byEngine.entries())) {
    const outcome: HiveMemoryEvent["outcome"] = agg.failed > 0 ? "fail" : agg.passed > 0 ? "pass" : "unverified";
    events.push({ kind: "verification", engine, outcome, payload: { buildRef, files: agg.files, passed: agg.passed, failed: agg.failed }, source: `vitest json report @ ${buildRef}` });
  }
  return events;
}

/** Records the events for the system user (id 0 by convention on the trunk's ledger). */
export async function informVerification(
  report: VitestJsonReport,
  buildRef: string,
  record: (userId: number, event: HiveMemoryEvent) => Promise<unknown>,
  systemUserId = 0,
): Promise<number> {
  const events = verificationEventsFromReport(report, buildRef);
  for (const e of events) await record(systemUserId, e);
  return events.length;
}
