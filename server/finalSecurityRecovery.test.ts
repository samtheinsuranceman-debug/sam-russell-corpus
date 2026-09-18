import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("final recovered security and provenance guardrails", () => {
  it("keeps storage access session- or token-scoped outside exact public assets", () => {
    const source = read("server/_core/storageProxy.ts");
    expect(source).toContain("PUBLIC_ASSET_KEYS");
    expect(source).toContain("sdk.authenticateRequest(req)");
    expect(source).toContain("portalTokenCanAccessStorageKey");
    expect(source).not.toContain("forgeResp.text()");
  });

  it("binds anonymous video engagement to a bounded share token", () => {
    const source = read("server/routers.ts");
    const block = source.slice(source.indexOf("trackEngagement: publicProcedure"), source.indexOf("liveCoPilot: router"));
    expect(block).toContain('token: z.string().min(16).max(256)');
    expect(block).toContain("getVideoProposalByShareToken(input.token)");
    expect(block).toContain("proposal.id !== input.proposalId");
    expect(block).toContain("percentWatched: z.number().finite().min(0).max(100)");
  });

  it("keeps portal-token listing tenant scoped and orphan tokens fail closed", () => {
    const db = read("server/db.ts");
    expect(db).toContain("getPortalTokensByClient(clientId: number, workspaceId: number)");
    expect(db).toContain("eq(clientPortalTokens.workspaceId, workspaceId)");
    expect(db).toContain("getClientById(row.clientId, row.workspaceId)");
    expect(db).toContain("portalTokenCanAccessStorageKey");
  });

  it("keeps Data API calls abortable, bounded, transient-only, and redacted", () => {
    const source = read("server/_core/dataApi.ts");
    expect(source).toContain("AbortController");
    expect(source).toContain("MAX_RESPONSE_BYTES");
    expect(source).toContain("TRANSIENT_STATUSES");
    expect(source).not.toContain("response.statusText");
    expect(source).not.toContain("detail ?");
  });

  it("sanitizes outbound email HTML and removes the retired reset-code mailer", () => {
    const source = read("server/email.ts");
    expect(source).toContain("function sanitizeEmailHtml");
    expect(source).not.toContain("sendHiddenMaterialResetCode");
    expect(source).not.toMatch(/^\s*html,\s*$/m);
    expect(source).not.toMatch(/console\.(?:log|info|warn|error)\([^\n]*\$\{/);
  });

  it("does not invent MYGA state availability or synthetic carrier records", () => {
    const feeds = read("server/dataFeedService.ts");
    const carriers = read("server/carrierRatingsService.ts");
    expect(feeds).toMatch(/getMYGARates[\s\S]*return \[\]/);
    expect(feeds).not.toContain("state: state || r.state");
    expect(carriers).not.toMatch(/A Mutual Life Insurance Company|COMDEX|Math\.random/);
  });

  it("removes internal stacks from client-visible tRPC errors", () => {
    const source = read("server/_core/trpc.ts");
    expect(source).toContain('internal ? "Internal server error"');
    expect(source).toContain("stack: undefined");
  });
});
