import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("core internet integrations", () => {
  it("keeps core AI calls server-side and bounded", () => {
    const adapter = readFileSync("server/portalAI.ts", "utf8");
    const router = readFileSync("server/routers.ts", "utf8");
    expect(adapter).toContain("DEFAULT_TIMEOUT_MS = 45_000");
    expect(adapter).toContain("invokeLLM(params)");
    expect(adapter).toContain("Your saved data was not changed; please retry.");
    expect(router).toContain('{ operation: "generate_strategy" }');
    expect(router).toContain('{ operation: "advisor_chat" }');
    expect(router).toContain('{ operation: "closing_script", timeoutMs: 30_000 }');
  });

  it("removes random market prices and returns transparent source metadata", () => {
    const router = readFileSync("server/routers.ts", "utf8");
    const start = router.indexOf("marketData: router({");
    const end = router.indexOf("strategyExport: router({", start);
    const block = router.slice(start, end);
    expect(block).not.toContain("Math.random");
    expect(block).toContain('source: "unavailable"');
    expect(block).toContain('source: "live"');
    expect(block).toContain("No verified live equity source configured");
    expect(block).toContain('await import("./dataFeedService")');
  });

  it("loads the source-aware market widget and dashboard modules", async () => {
    const [widget, dashboard] = await Promise.all([
      import("../client/src/components/MarketDataWidget"),
      import("../client/src/pages/portal/MarketDataDashboard"),
    ]);
    expect(widget.default).toBeTypeOf("function");
    expect(dashboard.default).toBeTypeOf("function");
  });

  it("exposes loading, retry, unavailable, provenance, and real CSV states", () => {
    const widget = readFileSync("client/src/components/MarketDataWidget.tsx", "utf8");
    const dashboard = readFileSync("client/src/pages/portal/MarketDataDashboard.tsx", "utf8");
    expect(widget).toContain("isLoading");
    expect(widget).toContain("isError");
    expect(widget).toContain("Unavailable");
    expect(widget).toContain("each quote labels its source");
    expect(dashboard).toContain("Source transparency:");
    expect(dashboard).toContain("Verified data feeds are unavailable.");
    expect(dashboard).toContain("new Blob([csv]");
    expect(dashboard).toContain("Received feed snapshot exported");
    expect(dashboard).not.toContain('setTimeout(() => {\n      toast.success("Market data exported to CSV")');
  });
});
