#!/usr/bin/env node
/**
 * Local smoke test for the Patent360 MCP Hub.
 *
 * Assumes a server instance is already running (see README "Testing"
 * section). Exercises public routes, bearer auth, tool listing, tool
 * invocation, and rate limiting.
 *
 * Usage:
 *   PORT=3001 MCP_TOKEN=test-token npm run start &
 *   sleep 2
 *   BASE_URL=http://localhost:3001 MCP_TOKEN=test-token node scripts/smoke-test.js
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";
const TOKEN = process.env.MCP_TOKEN || "test-token";

let passed = 0;
let failed = 0;

function report(name, ok, details) {
  if (ok) {
    passed += 1;
    console.log(`PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL: ${name} ${details ? JSON.stringify(details) : ""}`);
  }
}

async function main() {
  // Test 1: GET /
  {
    const res = await fetch(`${BASE_URL}/`);
    const body = await res.json();
    report("GET / returns 200 JSON", res.status === 200 && typeof body === "object", {
      status: res.status,
    });
  }

  // Test 2: GET /api/health
  {
    const res = await fetch(`${BASE_URL}/api/health`);
    const body = await res.json();
    report(
      "GET /api/health returns ok:true",
      res.status === 200 && body.ok === true,
      { status: res.status, body }
    );
  }

  // Test 3: POST /mcp no auth
  {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });
    report(
      "POST /mcp no auth returns 401 with WWW-Authenticate",
      res.status === 401 && !!res.headers.get("www-authenticate"),
      { status: res.status }
    );
  }

  // Test 4: POST /mcp invalid token
  {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid-token",
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });
    report("POST /mcp invalid token returns 401", res.status === 401, {
      status: res.status,
    });
  }

  // Test 5: POST /mcp valid token, tools/list
  {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 1 }),
    });
    const body = await res.json().catch(() => ({}));
    const names = JSON.stringify(body);
    report(
      "POST /mcp tools/list includes health_check and echo",
      res.status === 200 &&
        names.includes("health_check") &&
        names.includes("echo"),
      { status: res.status, body }
    );
  }

  // Test 6: POST /mcp call health_check
  {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: "health_check", arguments: {} },
        id: 2,
      }),
    });
    const body = await res.json().catch(() => ({}));
    report(
      "POST /mcp call health_check succeeds",
      res.status === 200 && JSON.stringify(body).includes('"ok"'),
      { status: res.status, body }
    );
  }

  // Test 7: POST /mcp call echo
  {
    const res = await fetch(`${BASE_URL}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name: "echo", arguments: { text: "test" } },
        id: 3,
      }),
    });
    const body = await res.json().catch(() => ({}));
    report(
      "POST /mcp call echo returns echoed text",
      res.status === 200 && JSON.stringify(body).includes("test"),
      { status: res.status, body }
    );
  }

  // Test 8: rate limit
  {
    let lastStatus = 0;
    for (let i = 0; i < 105; i += 1) {
      const res = await fetch(`${BASE_URL}/mcp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({ jsonrpc: "2.0", method: "tools/list", id: 100 + i }),
      });
      lastStatus = res.status;
      if (lastStatus === 429) break;
    }
    report("Rate limit triggers 429 after excess requests", lastStatus === 429, {
      lastStatus,
    });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("smoke test crashed:", err);
  process.exit(1);
});
