import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CLAIMS,
  claim,
  claimsByStatus,
  offerableClaims,
  portfolioCounts,
} from "../shared/patentCatalog";
import {
  APPLICATIONS,
  STAGE,
  mayClaimPatentPending,
  mayClaimPatented,
  portfolioSentence,
  assertClaimPermitted,
} from "../shared/patentStatus";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("patent catalog — every claimed path must resolve", () => {
  // This is the test the registry exists for. If an engine is renamed or a page
  // is deleted, the claim that cited it fails here rather than surviving on a
  // sheet that nobody rechecks.
  it("every `engine` path exists on disk", () => {
    const missing = CLAIMS.filter((c) => c.engine && !existsSync(resolve(REPO, c.engine)))
      .map((c) => `${c.ref} -> ${c.engine}`);
    expect(missing).toEqual([]);
  });

  it("every `page` path exists on disk", () => {
    const missing = CLAIMS.filter((c) => c.page && !existsSync(resolve(REPO, c.page)))
      .map((c) => `${c.ref} -> ${c.page}`);
    expect(missing).toEqual([]);
  });

  it("a built claim must name at least one path", () => {
    for (const c of claimsByStatus("built")) {
      expect(c.engine ?? c.page, `${c.ref} is 'built' but names no code`).toBeTruthy();
    }
  });

  it("a claim with no implementation must explain itself", () => {
    for (const c of [...claimsByStatus("none"), ...claimsByStatus("dropped")]) {
      expect(c.note, `${c.ref} is '${c.status}' with no note`).toBeTruthy();
      expect((c.note ?? "").length).toBeGreaterThan(40);
    }
  });

  it("references are unique and well-formed", () => {
    const refs = CLAIMS.map((c) => c.ref);
    expect(new Set(refs).size).toBe(refs.length);
    for (const r of refs) expect(r).toMatch(/^(PAT|SI|E)-\d{2,3}$/);
  });

  it("only built claims are offerable to partner sites", () => {
    for (const c of offerableClaims()) expect(c.status).toBe("built");
  });

  it("counts add up", () => {
    const c = portfolioCounts();
    expect(c.built + c.partial + c.none + c.dropped).toBe(CLAIMS.length);
    expect(c.built).toBeGreaterThan(0);
  });

  it("lookup is case-insensitive and refuses unknowns", () => {
    expect(claim("pat-002")?.title).toContain("HELOC");
    expect(claim("PAT-999")).toBeNull();
  });
});

describe("patent status — false marking cannot be turned on by asserting it", () => {
  it("no application is on file today, so no pending claim is permitted", () => {
    expect(APPLICATIONS).toHaveLength(0);
    expect(STAGE).toBe("drafted");
    expect(mayClaimPatentPending()).toBe(false);
    expect(mayClaimPatented()).toBe(false);
  });

  it("the one true sentence says drafted, not pending", () => {
    const s = portfolioSentence();
    expect(s).toContain("none filed");
    expect(s.toLowerCase()).not.toContain("patent pending.");
  });

  it("rendering a pending claim throws rather than printing", () => {
    expect(() => assertClaimPermitted("pending")).toThrow(/false marking/i);
    expect(() => assertClaimPermitted("patented")).toThrow(/false marking/i);
  });

  it("E-16 is recorded as withdrawn on compliance grounds, not merely unbuilt", () => {
    const e16 = claim("E-16");
    expect(e16?.status).toBe("dropped");
    expect(e16?.note).toMatch(/#582/);
    expect(e16?.note).toMatch(/8A\(4\)/);
  });
});
