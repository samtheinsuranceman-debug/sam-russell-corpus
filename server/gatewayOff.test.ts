/**
 * The hosted gateway the platform shipped with has been removed outright
 * (owner's order of 23 Sep 2026). There is no opt-in: the Brain Hub chain is
 * the only transport, and invokeLLM's callers are answered by it.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { jsonInstructionFor, messageToChatText } from "./_core/llm";
import { PROVIDERS } from "@shared/aiProviders";

describe("no hosted gateway anywhere in the chain", () => {
  it("the provider catalogue has no internal gateway entry", () => {
    expect(PROVIDERS.some(p => p.id === "forge")).toBe(false);
  });

  it("the registry does not import the gateway module and reads no gateway variables", () => {
    const src = readFileSync(join(__dirname, "providerRegistry.ts"), "utf8");
    expect(src).not.toContain("_core/llm");
    expect(src).not.toContain("invokeLLM");
    expect(src).not.toMatch(/forgeGateway|gatewayFallback/); // the variables themselves: chinaAiBan.test.ts
  });

  it("the host environment reader carries no gateway variables", () => {
    const src = readFileSync(join(__dirname, "_core", "env.ts"), "utf8");
    expect(src).not.toMatch(/forgeApi|oAuthServerUrl/);
  });

  it("ultraAI carries no gateway member and no gateway lead", () => {
    const src = readFileSync(join(__dirname, "ultraAI.ts"), "utf8");
    expect(src).not.toContain("invokeLLM");
    expect(src).toContain("brainComplete");
  });
});

describe("invokeLLM through the Brain Hub chain", () => {
  it("is the only path: llm.ts carries no hosted gateway URL, key or fetch", () => {
    const src = readFileSync(join(__dirname, "_core", "llm.ts"), "utf8");
    expect(src).not.toMatch(/fetch\(/);
    expect(src).not.toMatch(/https?:\/\//);
    expect(src).not.toMatch(/FORGE/i);
    expect(src).toContain("invokeViaBrainHub");
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
