import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("audit repair regression guardrails", () => {
  it("keeps the public homepage physician-focused and free of public AUM/demo claims", () => {
    const source = read("client/src/pages/Landing.tsx");
    expect(source).toMatch(/physician/i);
    expect(source).not.toMatch(/Assets Under Management|Investor Demo Mode|Seeded scenarios|\$47\.8M/);
  });

  it("keeps legacy administrator and executive routes on managed authentication", () => {
    const source = read("client/src/pages/AdministratorPortal.tsx") + read("client/src/pages/ExecutiveEntrance.tsx");
    expect(source).not.toMatch(/\/api\/(admin|executive)\/login|localStorage\.setItem|isOwnerBypassEmail/);
    expect(source).toMatch(/getLoginUrl/);
  });

  it("keeps financial-input AI protected and public email PIN retired", () => {
    const source = read("server/routers.ts");
    expect(source).toMatch(/comboRecommend:\s*protectedProcedure/);
    expect(source).not.toMatch(/Math\.random\(\)[\s\S]{0,300}pre_checkout/);
  });

  it("keeps placeholder-heavy pages truthful", () => {
    const source = read("client/src/pages/portal/AIMeetingNotes.tsx") + read("client/src/pages/portal/LegalPaymentFolder.tsx") + read("client/src/pages/portal/Billing.tsx");
    expect(source).not.toMatch(/Action 34|Math\.floor\(Math\.random|inv_1|4242|Alice Smith/);
  });

  it("keeps production JSX runtime explicit", () => {
    const build = read("scripts/build.mjs");
    const injection = read("scripts/react-runtime-inject.mjs");
    expect(build).toContain('jsx: "automatic"');
    expect(build).toContain('inject: [path.join(root, "scripts", "react-runtime-inject.mjs")]');
    expect(build).not.toContain("banner:");
    expect(injection).toContain('import * as React from "react"');
  });
});
