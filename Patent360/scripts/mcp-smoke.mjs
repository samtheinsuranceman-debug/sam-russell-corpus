#!/usr/bin/env node
/**
 * Smoke test for the Patent360 MCP Hub.
 *
 * Exercises the running server (default http://localhost:3000) end to end:
 *   1. health_check tool call
 *   2. echo tool call
 *   3. missing Authorization header -> 401 + WWW-Authenticate
 *   4. invalid Bearer token -> 401
 *   5. public GET /api/health
 *   6. tools list contains exactly ['health_check', 'echo']
 *
 * Exits 0 only if every test passes.
 */

import { Client } from "@modelcontextprotocol/client";

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const MCP_URL = `${BASE_URL}/mcp`;
const API_KEY = process.env.MCP_API_KEY || "test";

const results = [];

function ts() {
  return new Date().toISOString();
}

function record(name, passed, detail) {
  results.push({ name, passed, detail });
  const status = passed ? "PASS" : "FAIL";
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] [${status}] ${name}${detail ? " - " + detail : ""}`);
}

async function makeAuthedClient() {
  const client = new Client(
    { name: "patent360-smoke-test", version: "1.0.0" },
    { capabilities: {} }
  );

  await client.connect({
    url: MCP_URL,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  return client;
}

async function testHealthCheckTool(client) {
  try {
    const result = await client.callTool({ name: "health_check", arguments: {} });
    const content = extractJson(result);
    const ok = content && content.status === "ok" && typeof content.timestamp === "string";
    record("health_check tool", ok, ok ? undefined : JSON.stringify(result));
  } catch (err) {
    record("health_check tool", false, err.message);
  }
}

async function testEchoTool(client) {
  try {
    const result = await client.callTool({
      name: "echo",
      arguments: { message: "test" },
    });
    const content = extractJson(result);
    const ok = content && content.echoed === "test" && typeof content.timestamp === "string";
    record("echo tool", ok, ok ? undefined : JSON.stringify(result));
  } catch (err) {
    record("echo tool", false, err.message);
  }
}

async function testMissingAuth() {
  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const wwwAuth = res.headers.get("www-authenticate");
    const ok = res.status === 401 && !!wwwAuth;
    record("missing Authorization header rejected", ok, `status=${res.status} www-authenticate=${wwwAuth}`);
  } catch (err) {
    record("missing Authorization header rejected", false, err.message);
  }
}

async function testInvalidToken() {
  try {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer definitely-not-the-real-key",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const ok = res.status === 401;
    record("invalid Bearer token rejected", ok, `status=${res.status}`);
  } catch (err) {
    record("invalid Bearer token rejected", false, err.message);
  }
}

async function testPublicHealth() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();
    const ok = res.status === 200 && body.ok === true && typeof body.uptime === "number";
    record("GET /api/health public", ok, JSON.stringify(body));
  } catch (err) {
    record("GET /api/health public", false, err.message);
  }
}

async function testToolsList(client) {
  try {
    const result = await client.listTools();
    const names = (result.tools || []).map((t) => t.name).sort();
    const expected = ["echo", "health_check"];
    const ok = JSON.stringify(names) === JSON.stringify(expected);
    record("tools list is exactly [health_check, echo]", ok, JSON.stringify(names));
  } catch (err) {
    record("tools list is exactly [health_check, echo]", false, err.message);
  }
}

function extractJson(result) {
  try {
    if (result && Array.isArray(result.content)) {
      const textBlock = result.content.find((c) => c.type === "text");
      if (textBlock) {
        return JSON.parse(textBlock.text);
      }
    }
    if (result && result.structuredContent) {
      return result.structuredContent;
    }
    return null;
  } catch {
    return null;
  }
}

async function main() {
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] Starting Patent360 MCP Hub smoke tests against ${BASE_URL}`);

  await testPublicHealth();
  await testMissingAuth();
  await testInvalidToken();

  let client;
  try {
    client = await makeAuthedClient();
    await testHealthCheckTool(client);
    await testEchoTool(client);
    await testToolsList(client);
  } catch (err) {
    record("authenticated MCP client connection", false, err.message);
  } finally {
    if (client && typeof client.close === "function") {
      try {
        await client.close();
      } catch {
        // ignore close errors
      }
    }
  }

  const failed = results.filter((r) => !r.passed);
  // eslint-disable-next-line no-console
  console.log(`[${ts()}] ${results.length - failed.length}/${results.length} tests passed`);

  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`[${ts()}] Smoke test crashed: ${err.message}`);
  process.exit(1);
});
