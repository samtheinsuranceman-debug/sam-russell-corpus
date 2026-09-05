import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { LINE_NAMES, SITEMAP_PATHS, pairSlug } from "@shared/seo";
import { LINE_DYNAMICS, dynamicsFor } from "./lineDynamics";

const projectRoot = path.resolve(import.meta.dirname, "../../..");
const readProjectFile = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

describe("500 line dynamics data", () => {
  it("covers exactly all 32 canonical intelligence lines", () => {
    expect(LINE_NAMES).toHaveLength(32);
    expect(Object.keys(LINE_DYNAMICS).sort()).toEqual([...LINE_NAMES].sort());
    for (const line of LINE_NAMES) expect(dynamicsFor(line)).toBe(LINE_DYNAMICS[line]);
  });

  it("uses complete dossiers and valid non-self partner references", () => {
    for (const [line, dossier] of Object.entries(LINE_DYNAMICS)) {
      expect(dossier.selfReg.length).toBeGreaterThan(80);
      expect(dossier.trio.emergent.length).toBeGreaterThan(80);
      expect(dossier.weakCluster.failure.length).toBeGreaterThan(80);
      expect(dossier.controlling.length).toBeGreaterThan(80);
      expect(dossier.trio.partners).toHaveLength(2);
      expect(dossier.weakCluster.partners.length).toBeGreaterThanOrEqual(3);

      for (const partner of [...dossier.trio.partners, ...dossier.weakCluster.partners]) {
        expect(LINE_NAMES).toContain(partner);
        expect(partner).not.toBe(line);
      }
      for (const partner of dossier.trio.partners) {
        expect(SITEMAP_PATHS).toContain(`/pair/${pairSlug(line, partner)}`);
      }
    }
  });
});

describe("500 interaction wiring", () => {
  it("opens full canonical line pages from both homepage information actions", () => {
    const source = readProjectFile("client/src/pages/Home.tsx");
    expect(source).toContain("dialNavigate(`/line/${lineSlug(sel.name)}`)");
    expect(source).toContain("dialNavigate(`/line/${lineSlug(l.name)}`)");
    expect(source).toContain("aria-label={`About ${l.name} — full page`}");
  });

  it("renders the dossier with safe framing and existing recovery paths", () => {
    const source = readProjectFile("client/src/pages/LineDetail.tsx");
    expect(source).toContain('import { dynamicsFor } from "@/lib/lineDynamics"');
    expect(source).toContain("Signs you may be high in it");
    expect(source).toContain("The power trio — emergent property");
    expect(source).toContain("The weakness cluster — when lows compound");
    expect(source).toContain("not diagnoses or guarantees");
    expect(source).toContain('href="/weakness-finder"');
    expect(source).toContain("<GoDeeper");
  });
});

describe("500 internet binding preservation", () => {
  it("binds the assigned production port without dropping protected routes", () => {
    const source = readProjectFile("server/_core/index.ts");
    expect(source).toContain('process.env.NODE_ENV === "development"');
    expect(source).toContain("? await findAvailablePort(preferredPort)");
    expect(source).toContain(": preferredPort");
    expect(source).toContain('process.env.BIND_HOST || "0.0.0.0"');
    expect(source).toContain("canonicalRedirectLocation");
    expect(source).toContain('/api/webhooks/twilio/inbound');
    expect(source).toContain('/api/unsubscribe');
    expect(source).toContain('/api/scheduled/daily-reminders');
    expect(source).toContain('/health');
  });
});
