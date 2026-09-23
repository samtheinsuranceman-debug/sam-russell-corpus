// Reads a vitest JSON report and records one `verification` event per verifier
// into the hive's working memory for the system user, so Samuel Goldman can say
// which guarantees held on the build that is serving the visitor.
//
//   npx vitest run --reporter=json --outputFile=verify.json
//   npx tsx scripts/inform-verification.ts verify.json $(git rev-parse --short HEAD)
//
// With no DATABASE_URL the events land in the in-memory buffer and are printed,
// which is still a useful local check.
import { readFileSync } from "node:fs";
import { informVerification, verificationEventsFromReport, type VitestJsonReport } from "../server/verificationInform";
import { recordHiveEvent } from "../server/hiveMemoryDb";

const [file = "verify.json", buildRef = "unknown"] = process.argv.slice(2);
const report = JSON.parse(readFileSync(file, "utf8")) as VitestJsonReport;
const events = verificationEventsFromReport(report, buildRef);
for (const e of events) console.log(`${e.engine}: ${e.outcome}`);
informVerification(report, buildRef, recordHiveEvent)
  .then((n) => { console.log(`recorded ${n} verification events for build ${buildRef}`); process.exit(events.some((e) => e.outcome === "fail") ? 1 : 0); })
  .catch((err) => { console.error(err); process.exit(2); });
