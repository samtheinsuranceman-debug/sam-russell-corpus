/**
 * Board D32 (22 Sep 2026): the built-in Manus Forge gateway is not the
 * platform's last resort. It is off unless the operator opts in, the Brain Hub
 * chain never slides into it, and invokeLLM's callers are answered by the chain.
 */
import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { forgeGatewayAllowed, jsonInstructionFor, messageToChatText } from "./_core/llm";
import { forgeGatewayEnabled } from "./providerRegistry";

const saved = { allow: process.env.RCS_ALLOW_FORGE_GATEWAY, key: process.env.BUILT_IN_FORGE_API_KEY };
afterEach(() => {
  if (saved.allow === undefined) delete process.env.RCS_ALLOW_FORGE_GATEWAY; else process.env.RCS_ALLOW_FORGE_GATEWAY = saved.allow;
  if (saved.key === undefined) delete process.env.BUILT_IN_FORGE_API_KEY; else process.env.BUILT_IN_FORGE_API_KEY = saved.key;
});

describe("Manus Forge gateway is opt-in only (D32)", () => {
  it("a Forge key alone does not enable the gateway; the explicit opt-in does", () => {
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
    delete process.env.RCS_ALLOW_FORGE_GATEWAY;
    expect(forgeGatewayEnabled()).toBe(false);
    process.env.RCS_ALLOW_FORGE_GATEWAY = "1";
    expect(forgeGatewayEnabled()).toBe(true);
  });

  it("the opt-in without a key is still off", () => {
    process.env.RCS_ALLOW_FORGE_GATEWAY = "1";
    delete process.env.BUILT_IN_FORGE_API_KEY;
    expect(forgeGatewayEnabled()).toBe(false);
  });

  it("the registry no longer imports the gateway module, and brainComplete has no fallback branch", () => {
    const src = readFileSync(join(__dirname, "providerRegistry.ts"), "utf8");
    expect(src).not.toContain("_core/llm");
    expect(src).not.toContain("invokeLLM");
    expect(src).not.toMatch(/providerId:\s*"forge",\s*model:\s*"gateway"/);
  });

  it("ultraAI carries no Manus member and no gateway lead", () => {
    const src = readFileSync(join(__dirname, "ultraAI.ts"), "utf8");
    expect(src).not.toContain('id: "manus"');
    expect(src).not.toContain("invokeLLM");
    expect(src).toContain("brainComplete");
  });
});

describe("invokeLLM through the Brain Hub chain", () => {
  it("is the default path when the gateway is off", () => {
    delete process.env.RCS_ALLOW_FORGE_GATEWAY;
    expect(forgeGatewayAllowed()).toBe(false);
  });

  it("flattens text parts and maps tool/function roles to user", () => {
    expect(messageToChatText({ role: "system", content: "s" })).toEqual({ role: "system", content: "s" });
    expect(messageToChatText({ role: "user", content: [{ type: "text", text: "a" }, "b"] })).toEqual({ role: "user", content: "a\nb" });
    expect(messageToChatText({ role: "tool", content: "result", tool_call_id: "x" })).toEqual({ role: "user", content: "result" });
  });

  it("refuses image and file content rather than dropping it silently", () => {
    expect(() => messageToChatText({ role: "user", content: [{ type: "image_url", image_url: { url: "https://x/y.png" } }] })).toThrow(/image_url/);
  });

  it("turns a response_format into a standing instruction", () => {
    expect(jsonInstructionFor(undefined)).toBeNull();
    expect(jsonInstructionFor({ type: "text" })).toBeNull();
    expect(jsonInstructionFor({ type: "json_object" })).toMatch(/single valid JSON object/);
    const withSchema = jsonInstructionFor({ type: "json_schema", json_schema: { name: "plan", schema: { type: "object", properties: { steps: { type: "array" } } } } });
    expect(withSchema).toContain('"plan"');
    expect(withSchema).toContain('"steps"');
  });
});
