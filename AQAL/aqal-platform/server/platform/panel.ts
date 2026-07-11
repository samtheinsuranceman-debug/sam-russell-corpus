// ============================================================
// Multi-AI scoring panel — fan one prompt out to every configured model
// ============================================================
// The high-confidence tier calls each panel member (different developers) in
// parallel via an OpenAI-compatible chat endpoint, and the caller runs the
// results through consensusScores(). Members that error out are dropped, not
// fatal. If fewer than two members are configured, callers fall back to the
// single-model path.

import type { InvokeParams, InvokeResult } from "../_core/llm";
import { enabledPanel, type PanelMember } from "./config";

async function invokeMember(m: PanelMember, params: InvokeParams): Promise<InvokeResult | null> {
  try {
    const res = await fetch(`${m.base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${m.key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: m.model,
        messages: params.messages,
        ...(params.response_format ? { response_format: params.response_format } : {}),
      }),
    });
    if (!res.ok) {
      console.warn(`[panel] ${m.name} (${m.developer}) → HTTP ${res.status}`);
      return null;
    }
    return (await res.json()) as InvokeResult;
  } catch (err) {
    console.warn(`[panel] ${m.name} (${m.developer}) failed:`, err);
    return null;
  }
}

// Run the same params across every configured member, in parallel. Returns each
// member's raw result; failures are omitted.
export async function runPanel(
  params: InvokeParams,
): Promise<Array<{ member: PanelMember; result: InvokeResult }>> {
  const members = enabledPanel();
  const settled = await Promise.all(
    members.map(async (m) => {
      const result = await invokeMember(m, params);
      return result ? { member: m, result } : null;
    }),
  );
  return settled.filter(
    (x): x is { member: PanelMember; result: InvokeResult } => x !== null,
  );
}

// How many models are wired for the consensus panel right now.
export function panelSize(): number {
  return enabledPanel().length;
}

// The developer names of the active panel — for honest UI ("scored by …").
export function panelDevelopers(): string[] {
  return enabledPanel().map((m) => `${m.name} (${m.developer})`);
}
