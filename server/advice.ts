// ============================================================
// SIGNED ADVICE LOG — every recommendation the AI team gives a client is
// recorded on the Plan Ledger as an "advice" event carrying: the question,
// the answer, which model voices contributed, WHICH FACTS were used (by key,
// with a hash of each value so the ledger proves what the advice saw without
// repeating the figure), the assumptions and rules that applied, the rule
// version, and the disclaimers. The whole payload is signed (HMAC-SHA256
// with the server's advice key) so anyone can later verify it was not
// altered. verifyAdvice() recomputes the signature.
// ============================================================
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { ClientFactFinder } from "@shared/clientFactFinder";
import { currentRules } from "@shared/taxRules";
import { recordEvent } from "./ledger";

export type AdvicePayload = {
  question: string;
  answer: string;
  via: string;
  voices: string[];
  dataUsed: Array<{ key: string; hash: string }>;
  assumptions: string[];
  rulesApplied: string[];
  rulesVersion: string;
  disclaimers: string[];
  at: string;
};

export type SignedAdvice = { payload: AdvicePayload; signature: string; alg: "HMAC-SHA256"; keyId: string };

export const STANDARD_DISCLAIMERS = [
  "General education and projection under stated assumptions; not tax, legal, or investment advice.",
  "No outcome is guaranteed. A licensed advisor and the tax professional team review every strategy for suitability and IRS compliance before anything is implemented.",
  "Every figure referenced comes from the client's own Financial Assessment; nothing was invented.",
];

export function adviceSigningKey(env: NodeJS.ProcessEnv = process.env): string {
  return env.ADVICE_SIGNING_KEY || env.JWT_SECRET || "";
}

function stable(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(stable);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v as Record<string, unknown>).sort().map((k) => [k, stable((v as Record<string, unknown>)[k])]));
  return v;
}

/** Short content hash of a value: proves which value was seen without storing it in the advice record. */
export function hashValue(v: unknown): string {
  return createHash("sha256").update(JSON.stringify(stable(v ?? null))).digest("hex").slice(0, 16);
}

/** Every answered field of the assessment, as (key, hash) pairs. */
export function factsUsed(data: ClientFactFinder | null | undefined): Array<{ key: string; hash: string }> {
  const out: Array<{ key: string; hash: string }> = [];
  if (!data) return out;
  for (const sid of Object.keys(data.sections ?? {}).sort()) {
    const sec = data.sections[sid] ?? {};
    for (const k of Object.keys(sec).sort()) {
      const v = sec[k];
      if (v === null || v === undefined || v === "") continue;
      out.push({ key: `${sid}.${k}`, hash: hashValue(v) });
    }
  }
  for (const lk of Object.keys(data.lists ?? {}).sort()) {
    const l = data.lists[lk];
    if (Array.isArray(l) && l.length) out.push({ key: `lists.${lk}`, hash: hashValue(l) });
  }
  return out;
}

export function canonicalAdvice(p: AdvicePayload): string {
  return JSON.stringify(stable(p));
}

export function signAdvice(p: AdvicePayload, secret: string): string {
  return createHmac("sha256", secret).update(canonicalAdvice(p)).digest("hex");
}

export function keyIdFor(secret: string): string {
  return createHash("sha256").update(secret).digest("hex").slice(0, 8);
}

export function buildSignedAdvice(input: Omit<AdvicePayload, "at" | "rulesVersion" | "disclaimers"> & { at?: Date; rulesVersion?: string; disclaimers?: string[] }, secret = adviceSigningKey()): SignedAdvice {
  const payload: AdvicePayload = {
    question: input.question.slice(0, 4000),
    answer: input.answer.slice(0, 20_000),
    via: input.via,
    voices: input.voices,
    dataUsed: input.dataUsed,
    assumptions: input.assumptions,
    rulesApplied: input.rulesApplied,
    rulesVersion: input.rulesVersion ?? currentRules(input.at ?? new Date()).version,
    disclaimers: input.disclaimers ?? STANDARD_DISCLAIMERS,
    at: (input.at ?? new Date()).toISOString(),
  };
  const s = secret || "unsigned";
  return { payload, signature: signAdvice(payload, s), alg: "HMAC-SHA256", keyId: keyIdFor(s) };
}

export function verifyAdvice(value: unknown, secret = adviceSigningKey()): { ok: boolean; reason: string } {
  const v = value as Partial<SignedAdvice> | null;
  if (!v || typeof v !== "object" || !v.payload || typeof v.signature !== "string") return { ok: false, reason: "not a signed advice record" };
  const s = secret || "unsigned";
  if (v.keyId && v.keyId !== keyIdFor(s)) return { ok: false, reason: "signed with a different key" };
  const expected = signAdvice(v.payload as AdvicePayload, s);
  const a = Buffer.from(expected, "hex"), b = Buffer.from(v.signature, "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, reason: "signature does not match the payload" };
  return { ok: true, reason: "signature verified" };
}

/** Append a signed advice record to the subject's chain. Never throws. */
export async function recordAdvice(ids: { userId?: number | null; clientId?: number | null; leadId?: number | null; workspaceId?: number | null }, input: Parameters<typeof buildSignedAdvice>[0], opts: { key?: string; actorName?: string | null } = {}): Promise<SignedAdvice> {
  const signed = buildSignedAdvice(input);
  const q = input.question.length > 80 ? `${input.question.slice(0, 77)}…` : input.question;
  await recordEvent({
    kind: "advice", source: "ai", key: opts.key ?? "advice.librarian", label: "Signed advice",
    value: signed, actorName: opts.actorName ?? null,
    summary: `Advice on "${q}" — ${signed.payload.voices.length || 1} voice${signed.payload.voices.length === 1 ? "" : "s"}, ${signed.payload.dataUsed.length} facts used, rules ${signed.payload.rulesVersion}, signed`,
    ...ids,
  });
  return signed;
}
