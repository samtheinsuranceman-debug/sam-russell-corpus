/**
 * Smoke-test client for the Patent360 MCP Hub.
 *
 * Demonstrates authenticating against POST /mcp and invoking both
 * registered tools using plain fetch (no MCP client SDK dependency
 * required to exercise the HTTP surface). Intended to be run manually
 * against a locally running instance:
 *
 *   MCP_API_KEY=your-32-plus-char-key npm run build && npm start &
 *   MCP_API_KEY=your-32-plus-char-key BASE_URL=http://localhost:3000 \
 *     npx tsx examples/client.ts
 *
 * This script is a demonstration/smoke aid, not an automated test. It
 * does not run as part of CI and its output should not be treated as a
 * pass/fail signal for the build.
 */

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const API_KEY = process.env.MCP_API_KEY;

if (!API_KEY) {
  console.error("MCP_API_KEY environment variable is required to run this example");
  process.exit(1);
}

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: { name, arguments: args },
    }),
  });

  if (!res.ok) {
    throw new Error(`tool call failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

async function main(): Promise<void> {
  console.log(`Checking landing page at ${BASE_URL}/ ...`);
  const landing = await fetch(`${BASE_URL}/`);
  console.log(`  -> status ${landing.status}`);

  console.log(`Checking health at ${BASE_URL}/api/health ...`);
  const health = await fetch(`${BASE_URL}/api/health`);
  console.log(`  -> ${JSON.stringify(await health.json())}`);

  console.log("Calling health_check tool over /mcp ...");
  console.log(`  -> ${JSON.stringify(await callTool("health_check", {}))}`);

  console.log("Calling echo tool over /mcp ...");
  console.log(`  -> ${JSON.stringify(await callTool("echo", { text: "hello patent360" }))}`);
}

main().catch((err) => {
  console.error("smoke script failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
