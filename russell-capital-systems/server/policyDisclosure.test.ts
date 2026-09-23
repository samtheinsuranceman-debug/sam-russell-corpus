/**
 * Policy disclosure and the AG 49 label (owner's decision, 23 Sep 2026).
 *
 * The engines are mechanics, not illustrations: the crediting rate is an
 * assumption the visitor sets. No client-facing text may state "AG 49 max
 * 7.5%" as if the guideline named that number, and every engine that runs on
 * a policy carries the one-line product disclosure.
 */
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { ANNUITY_PATHS, LIFE_POLICY_PATHS, POLICY_DISCLOSURE, policyKindForPath } from "../shared/policyDisclosure";

const root = resolve(__dirname, "..");
const appSrc = readFileSync(join(root, "client/src/App.tsx"), "utf8");
const shellSrc = readFileSync(join(root, "client/src/components/AppShell.tsx"), "utf8");

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx?$/.test(e) && !/\.test\.|\.bak\./.test(e)) out.push(p);
  }
  return out;
}

describe("policy disclosure", () => {
  it("names life insurance and annuities in plain words", () => {
    expect(POLICY_DISCLOSURE.life).toMatch(/permanent life insurance policy/);
    expect(POLICY_DISCLOSURE.annuity).toMatch(/annuity contract/);
  });

  it("covers the flagship engines and routes every listed path", () => {
    for (const p of ["/portal/mortgage-killer", "/portal/household-wealth", "/portal/time-machine-ag49", "/portal/premium-financing", "/portal/infinite-banking"]) {
      expect(policyKindForPath(p), p).toBe("life");
    }
    expect(policyKindForPath("/portal/myga-waterfall")).toBe("annuity");
    // tax-waterfall now carries the line (it models IUL policy loans); a page that runs on no policy stays null.
    expect(policyKindForPath("/portal/forgiveness")).toBeNull();
    expect(policyKindForPath("/portal/mortgage-killer?tab=x")).toBe("life");
    for (const p of [...LIFE_POLICY_PATHS, ...ANNUITY_PATHS]) {
      // Mechanism dossiers are served by one parameter route.
      const routed = appSrc.includes(`path="${p}"`) || (p.startsWith("/portal/mechanism/") && appSrc.includes('path="/portal/mechanism/:'));
      expect(routed, `${p} is not a route in App.tsx`).toBe(true);
    }
  });

  it("is mounted by the app shell", () => {
    expect(shellSrc).toMatch(/<PolicyDisclosureLine path=\{location\} \/>/);
  });

  it("is also mounted by gated(), so listed routes that render outside the app shell still show it", () => {
    // TimeMachineAG49, MortgageKillerV3, IulProjectionPage and MygaWaterfallPage have no AppShell.
    const gatedFn = appSrc.slice(appSrc.indexOf("function gated("), appSrc.indexOf("function FrontDoor("));
    expect(gatedFn).toContain("<PolicyDisclosureSlot>");
  });
});

describe("no text states AG 49 as a 7.5% cap", () => {
  it("finds no 'AG 49 max 7.5%' style claim in client or shared code", () => {
    const offenders: string[] = [];
    const claim = /(AG[ -]?49|Actuarial Guideline 49)[^\n]{0,160}7\.5|7\.5%?[^\n]{0,20}\(?(NAIC )?AG[ -]?49 max|AG[ -]?49[- ]compliant|AG 49 laws/i;
    for (const f of [...walk(join(root, "client/src")), ...walk(join(root, "shared"))]) {
      // policyDisclosure records the decision; ag49Products records the old claim it corrected;
      // iulComplianceEngine builds real carrier illustrations, where "AG 49 compliant" is the right term.
      if (f.endsWith("policyDisclosure.ts") || f.endsWith("ag49Products.ts") || f.endsWith("iulComplianceEngine.ts")) continue;
      readFileSync(f, "utf8").split("\n").forEach((line, i) => {
        if (claim.test(line)) offenders.push(`${f.slice(root.length + 1)}:${i + 1}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});
