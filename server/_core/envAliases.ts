/**
 * Spellings the owner typed into Railway that differ from the names the code
 * reads. Railway cannot rename a variable, so the server copies each one to
 * the name the code expects at startup, before any module reads it. A name
 * that is already set is never overwritten.
 */
export const ENV_ALIASES: ReadonlyArray<{ from: string; to: string[] }> = [
  // Google AI Studio key: the Brain Hub reads GOOGLE_API_KEY, the advisor team GEMINI_API_KEY.
  { from: "GOOGLE_AI_API_KEY", to: ["GEMINI_API_KEY", "GOOGLE_API_KEY"] },
  // Replicate documents REPLICATE_API_TOKEN.
  { from: "REPLICATE_API_KEY", to: ["REPLICATE_API_TOKEN"] },
];

export function applyEnvAliases(env: NodeJS.ProcessEnv = process.env): string[] {
  const applied: string[] = [];
  for (const { from, to } of ENV_ALIASES) {
    const value = env[from]?.trim();
    if (!value) continue;
    for (const name of to) {
      if (env[name]?.trim()) continue;
      env[name] = value;
      applied.push(`${from}→${name}`);
    }
  }
  return applied;
}

applyEnvAliases();
