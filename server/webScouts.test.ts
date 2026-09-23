import { afterEach, describe, expect, it } from "vitest";
import { liveScoutIds, nimbleBasic, nimbleSearch, parseNimble, parseYou, scoutContext, scoutSearch, youSearch } from "./webScouts";

const saved = { you: process.env.YOU_API_KEY, nimble: process.env.NIMBLE_API_KEY, youUrl: process.env.YOU_SEARCH_URL };
afterEach(() => {
  process.env.YOU_API_KEY = saved.you;
  process.env.NIMBLE_API_KEY = saved.nimble;
  process.env.YOU_SEARCH_URL = saved.youUrl;
  if (saved.you === undefined) delete process.env.YOU_API_KEY;
  if (saved.nimble === undefined) delete process.env.NIMBLE_API_KEY;
  if (saved.youUrl === undefined) delete process.env.YOU_SEARCH_URL;
});

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("web scouts", () => {
  it("lists only scouts whose key is set", () => {
    delete process.env.YOU_API_KEY;
    delete process.env.NIMBLE_API_KEY;
    expect(liveScoutIds()).toEqual([]);
    process.env.YOU_API_KEY = "k";
    expect(liveScoutIds()).toEqual(["you"]);
    process.env.NIMBLE_API_KEY = "n";
    expect(liveScoutIds()).toEqual(["you", "nimble"]);
  });

  it("parses the You.com web results shape", () => {
    const r = parseYou({ results: { web: [{ url: "https://a.gov/x", title: "A", snippets: ["one", "two"] }, { title: "no url" }] } });
    expect(r).toEqual([{ url: "https://a.gov/x", title: "A", snippet: "one two" }]);
  });

  it("walks Nimble's engine-specific JSON for linked, titled results", () => {
    const r = parseNimble({
      parsing: { entities: { OrganicResult: [{ title: "Fed", url: "https://federalreserve.gov" }, { title: "Fed", url: "https://federalreserve.gov" }] } },
      html_content: "<html>",
    });
    expect(r).toEqual([{ title: "Fed", url: "https://federalreserve.gov", snippet: "" }]);
  });

  it("encodes a raw user:pass Nimble credential and keeps a pre-encoded one", () => {
    expect(nimbleBasic("u:p")).toBe(Buffer.from("u:p").toString("base64"));
    expect(nimbleBasic("dTpw")).toBe("dTpw");
  });

  it("falls back to the second You.com host on a 404, and stops on a rejected key", async () => {
    process.env.YOU_API_KEY = "k";
    const hosts: string[] = [];
    const ok = await youSearch("q", 3, (async (url: string) => {
      hosts.push(new URL(url).host);
      return hosts.length === 1 ? jsonResponse(404, {}) : jsonResponse(200, { results: { web: [{ url: "https://x.com", title: "X" }] } });
    }) as any);
    expect(hosts).toEqual(["api.you.com", "ydc-index.io"]);
    expect(ok.ok).toBe(true);
    expect(ok.results).toHaveLength(1);

    let calls = 0;
    const denied = await youSearch("q", 3, (async () => {
      calls++;
      return jsonResponse(401, {});
    }) as any);
    expect(calls).toBe(1);
    expect(denied).toMatchObject({ ok: false, error: "You.com 401" });
  });

  it("never puts the key in a result or error", async () => {
    process.env.NIMBLE_API_KEY = "super-secret-value";
    const a = await nimbleSearch("q", 3, (async () => jsonResponse(500, {})) as any);
    expect(JSON.stringify(a)).not.toContain("super-secret-value");
  });

  it("asks only keyed scouts and renders a citable block", async () => {
    process.env.YOU_API_KEY = "k";
    delete process.env.NIMBLE_API_KEY;
    const answers = await scoutSearch("q", 2, (async () => jsonResponse(200, { results: { web: [{ url: "https://x.com", title: "X", description: "d" }] } })) as any);
    expect(answers.map(a => a.scoutId)).toEqual(["you"]);
    expect(scoutContext(answers)).toContain("[1] X — https://x.com");
  });
});
