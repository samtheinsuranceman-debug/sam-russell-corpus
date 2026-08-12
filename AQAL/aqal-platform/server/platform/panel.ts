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
  limit = 0,
): Promise<Array<{ member: PanelMember; result: InvokeResult }>> {
  // limit > 0 → run only the first N configured members (free tier's capped
  // consensus). 0 → the full panel (paid tier). Order = config order, so the
  // strongest general models (GPT, Claude, Gemini) are chosen first.
  const members = limit > 0 ? enabledPanel().slice(0, limit) : enabledPanel();
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

export type PanelMemberHealth = {
  id: string;
  name: string;
  developer: string;
  model: string;
  keySource: string;       // which env var actually supplied this member's key
  ok: boolean;
  status: number | null;   // HTTP status, or null if the request threw
  latencyMs: number;
  note: string;            // human-readable pass/fail reason
};

// Which env var is actually supplying each member's key — surfaced in health
// output so a green check can't hide a fallback. Cohere/AI21 legitimately ride
// OPENROUTER_API_KEY by design, but the readout must SAY so; and Gemini shows
// which of its two accepted names was found.
function keySourceFor(id: string): string {
  const has = (k: string) => !!process.env[k];
  switch (id) {
    case "openai": return has("OPENAI_API_KEY") ? "OPENAI_API_KEY" : "missing";
    case "anthropic": return has("ANTHROPIC_API_KEY") ? "ANTHROPIC_API_KEY" : "missing";
    case "google": return has("GOOGLE_API_KEY") ? "GOOGLE_API_KEY" : has("GEMINI_API_KEY") ? "GEMINI_API_KEY" : "missing";
    case "xai": return has("XAI_API_KEY") ? "XAI_API_KEY" : "missing";
    case "llama": return has("GROQ_API_KEY") ? "GROQ_API_KEY" : "missing";
    case "mistral": return has("MISTRAL_API_KEY") ? "MISTRAL_API_KEY" : "missing";
    case "cohere": return has("COHERE_API_KEY") ? "COHERE_API_KEY" : has("OPENROUTER_API_KEY") ? "OPENROUTER_API_KEY (fallback)" : "missing";
    case "ai21": return has("AI21_API_KEY") ? "AI21_API_KEY" : has("OPENROUTER_API_KEY") ? "OPENROUTER_API_KEY (fallback)" : "missing";
    default: return "unknown";
  }
}

// Live health check: ping every CONFIGURED member with a tiny structured request
// and report which ones actually respond with usable JSON. This is what turns
// "silently dropped" providers into a visible checklist — so you can confirm a
// real N-model consensus before launch instead of assuming it. Costs one tiny
// call per member; admin-only.
export async function panelHealth(): Promise<PanelMemberHealth[]> {
  const members = enabledPanel();
  const probe: InvokeParams = {
    messages: [
      { role: "system", content: "Reply with a compact JSON object and nothing else." },
      { role: "user", content: 'Return exactly {"ok":true}.' },
    ],
    response_format: { type: "json_object" as any },
  } as InvokeParams;

  return Promise.all(
    members.map(async (m): Promise<PanelMemberHealth> => {
      const started = Date.now();
      const base = { id: m.id, name: m.name, developer: m.developer, model: m.model, keySource: keySourceFor(m.id) };
      try {
        const res = await fetch(`${m.base.replace(/\/$/, "")}/chat/completions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${m.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model: m.model, messages: probe.messages, ...(probe.response_format ? { response_format: probe.response_format } : {}) }),
        });
        const latencyMs = Date.now() - started;
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          return { ...base, ok: false, status: res.status, latencyMs, note: `HTTP ${res.status}${body ? ` — ${body.slice(0, 140)}` : ""}` };
        }
        const json = (await res.json()) as any;
        const content = json?.choices?.[0]?.message?.content;
        const ok = typeof content === "string" && content.length > 0;
        return { ...base, ok, status: res.status, latencyMs, note: ok ? "Responded with content" : "200 but no message content (model/format mismatch)" };
      } catch (err: any) {
        return { ...base, ok: false, status: null, latencyMs: Date.now() - started, note: `Request failed: ${err?.message ?? "network error"}` };
      }
    }),
  );
}

// The developer names of the active panel — for honest UI ("scored by …").
export function panelDevelopers(): string[] {
  return enabledPanel().map((m) => `${m.name} (${m.developer})`);
}
