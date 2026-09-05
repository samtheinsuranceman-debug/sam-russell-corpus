import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const llmMocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./_core/llm", () => llmMocks);

import { invokePortalAI } from "./portalAI";

describe("invokePortalAI", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns trimmed server-side model content", async () => {
    llmMocks.invokeLLM.mockResolvedValue({
      model: "verified-model",
      choices: [{ message: { content: "  grounded answer  " } }],
    });

    await expect(invokePortalAI(
      { messages: [{ role: "user", content: "test" }] },
      { operation: "test" },
    )).resolves.toEqual({ content: "grounded answer", model: "verified-model" });
  });

  it("rejects empty output with a sanitized retry message", async () => {
    llmMocks.invokeLLM.mockResolvedValue({ model: "verified-model", choices: [{ message: { content: "  " } }] });
    await expect(invokePortalAI(
      { messages: [{ role: "user", content: "test" }] },
      { operation: "test" },
    )).rejects.toThrow("temporarily unavailable");
  });

  it("enforces the configured timeout without exposing provider details", async () => {
    llmMocks.invokeLLM.mockImplementation(() => new Promise(() => undefined));
    await expect(invokePortalAI(
      { messages: [{ role: "user", content: "test" }] },
      { operation: "test", timeoutMs: 5 },
    )).rejects.toThrow("timed out");
  });

  it("protects strategy generation, closing scripts, and advisor chat", () => {
    const router = readFileSync("server/routers.ts", "utf8");
    expect(router).toContain('{ operation: "generate_strategy" }');
    expect(router).toContain('{ operation: "closing_script", timeoutMs: 30_000 }');
    expect(router).toContain('{ operation: "advisor_chat" }');
    expect(router).not.toContain('?? "Unable to generate strategy."');
    expect(router).not.toContain('?? "Unable to generate script."');
  });
});
