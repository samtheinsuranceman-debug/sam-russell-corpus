// ============================================================
// Anthropic request headers. A key created at the organization level (not
// inside a workspace) is refused with "This API key is not scoped to a
// workspace" unless every request also carries the workspace's ID. Set
// ANTHROPIC_WORKSPACE_ID in the host's panel (Console → Settings →
// Workspaces → the workspace → its ID, which begins "wrksp_") and it is
// sent on every call; a key made inside a workspace needs nothing extra.
// ============================================================
export function anthropicHeaders(apiKey: string, env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const h: Record<string, string> = { "x-api-key": apiKey, "anthropic-version": "2023-06-01" };
  const ws = env.ANTHROPIC_WORKSPACE_ID?.trim();
  if (ws) h["anthropic-workspace-id"] = ws;
  return h;
}
