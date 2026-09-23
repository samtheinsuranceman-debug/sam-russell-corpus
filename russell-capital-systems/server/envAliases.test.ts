import { describe, expect, it } from "vitest";
import { applyEnvAliases } from "./_core/envAliases";

describe("Railway variable aliases", () => {
  it("copies GOOGLE_AI_API_KEY to the names Gemini is read under", () => {
    const env: NodeJS.ProcessEnv = { GOOGLE_AI_API_KEY: "AIzaTEST" };
    applyEnvAliases(env);
    expect(env.GEMINI_API_KEY).toBe("AIzaTEST");
    expect(env.GOOGLE_API_KEY).toBe("AIzaTEST");
  });

  it("never overwrites a name that is already set", () => {
    const env: NodeJS.ProcessEnv = { GOOGLE_AI_API_KEY: "AIzaNEW", GEMINI_API_KEY: "AIzaOLD" };
    applyEnvAliases(env);
    expect(env.GEMINI_API_KEY).toBe("AIzaOLD");
    expect(env.GOOGLE_API_KEY).toBe("AIzaNEW");
  });

  it("does nothing when the source is empty", () => {
    const env: NodeJS.ProcessEnv = { REPLICATE_API_KEY: "  " };
    expect(applyEnvAliases(env)).toEqual([]);
    expect(env.REPLICATE_API_TOKEN).toBeUndefined();
  });
});
