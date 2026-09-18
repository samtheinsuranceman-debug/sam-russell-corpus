import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

/**
 * Batch 8 — Verify that Endgame, LiveCoPilot, SocialNarcotic, and WarRoom
 * are wired with useCalculatorIntegration, ClientSelectorBar, CalculationSyncBar,
 * and GenerateOutcomeTab (where applicable).
 */

const PAGES = [
  { name: "Endgame", file: "Endgame.tsx", strategyType: "endgame" },
  { name: "LiveCoPilot", file: "LiveCoPilot.tsx", strategyType: "live-copilot" },
  { name: "SocialNarcotic", file: "SocialNarcotic.tsx", strategyType: "social-narcotic" },
  { name: "WarRoom", file: "WarRoom.tsx", strategyType: "war-room" },
];

describe("Batch 8 — Wire remaining 4 experience pages", () => {
  for (const page of PAGES) {
    describe(page.name, () => {
      const filePath = resolve(__dirname, `../client/src/pages/portal/${page.file}`);
      const source = readFileSync(filePath, "utf-8");

      it("exports a default component", async () => {
        const mod = await import(`../client/src/pages/portal/${page.file.replace(".tsx", "")}`);
        expect(mod.default).toBeDefined();
        expect(typeof mod.default).toBe("function");
      });

      it("imports useCalculatorIntegration", () => {
        expect(source).toContain("useCalculatorIntegration");
      });

      it("imports ClientSelectorBar", () => {
        expect(source).toContain("ClientSelectorBar");
      });

      it("imports CalculationSyncBar", () => {
        expect(source).toContain("CalculationSyncBar");
      });

      it(`uses strategyType "${page.strategyType}"`, () => {
        expect(source).toContain(`strategyType: "${page.strategyType}"`);
      });

      it("renders ClientSelectorBar component", () => {
        expect(source).toContain("<ClientSelectorBar");
      });

      it("renders CalculationSyncBar component", () => {
        expect(source).toContain("<CalculationSyncBar");
      });

      it("passes calcIntegration props to ClientSelectorBar", () => {
        expect(source).toContain("calcIntegration.clients");
        expect(source).toContain("calcIntegration.selectClient");
        expect(source).toContain("calcIntegration.saveScenario");
      });
    });
  }

  describe("StrategyContext includes new types", () => {
    it("STRATEGY_LABELS includes live-copilot, social-narcotic, war-room", async () => {
      const { STRATEGY_LABELS } = await import("../client/src/contexts/StrategyContext");
      expect(STRATEGY_LABELS["live-copilot"]).toBe("Live Co-Pilot");
      expect(STRATEGY_LABELS["social-narcotic"]).toBe("Social Narcotic");
      expect(STRATEGY_LABELS["war-room"]).toBe("War Room");
    });

    it("STRATEGY_COLORS includes live-copilot, social-narcotic, war-room", async () => {
      const { STRATEGY_COLORS } = await import("../client/src/contexts/StrategyContext");
      expect(STRATEGY_COLORS["live-copilot"]).toBeDefined();
      expect(STRATEGY_COLORS["social-narcotic"]).toBeDefined();
      expect(STRATEGY_COLORS["war-room"]).toBeDefined();
    });

    it("STRATEGY_PATHS includes live-copilot, social-narcotic, war-room", async () => {
      const { STRATEGY_PATHS } = await import("../client/src/contexts/StrategyContext");
      expect(STRATEGY_PATHS["live-copilot"]).toBe("/portal/live-copilot");
      expect(STRATEGY_PATHS["social-narcotic"]).toBe("/portal/social-narcotic");
      expect(STRATEGY_PATHS["war-room"]).toBe("/portal/war-room");
    });
  });

  describe("GenerateOutcomeTab wiring", () => {
    it("SocialNarcotic has GenerateOutcomeTab", () => {
      const source = readFileSync(resolve(__dirname, "../client/src/pages/portal/SocialNarcotic.tsx"), "utf-8");
      expect(source).toContain("<GenerateOutcomeTab");
      expect(source).toContain('strategyType="social-narcotic"');
    });

    it("WarRoom has GenerateOutcomeTab", () => {
      const source = readFileSync(resolve(__dirname, "../client/src/pages/portal/WarRoom.tsx"), "utf-8");
      expect(source).toContain("<GenerateOutcomeTab");
      expect(source).toContain('strategyType="war-room"');
    });

    it("Endgame has GenerateOutcomeTab", () => {
      const source = readFileSync(resolve(__dirname, "../client/src/pages/portal/Endgame.tsx"), "utf-8");
      expect(source).toContain("<GenerateOutcomeTab");
      expect(source).toContain('strategyType="endgame"');
    });
  });
});
