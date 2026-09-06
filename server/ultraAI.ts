// ============================================================
// ULTRA AI ORCHESTRATOR — the AI layer behind the Ultra Calculator
// and the every-page voice advisor.
//
// SECURITY CONTRACT (non-negotiable):
// - API keys are read ONLY from environment variables on the server.
//   They are never accepted from the client, never echoed in any
//   response, never logged, and never stored in the codebase.
// - Set them in the HOST'S environment panel:
//     ANTHROPIC_API_KEY      (Claude — the lead/tether model)
//     OPENAI_API_KEY         (ChatGPT)
//     XAI_API_KEY            (Grok)
//     GEMINI_API_KEY         (Gemini)
//     PERPLEXITY_API_KEY     (Perplexity)
//     OPENROUTER_API_KEY     (OpenRouter — routes to many models)
//     MISTRAL_API_KEY        (Mistral)
//     GROQ_API_KEY           (Groq)
//     BUILT_IN_FORGE_API_KEY (Manus — the built-in Forge gateway)
//     ELEVENLABS_API_KEY + ELEVENLABS_VOICE_ID  (voice output)
// - Any provider without a key is skipped and reported as
//   "not configured" — the panel degrades gracefully, and with zero
//   keys the plan endpoint falls back to deterministic rules.
// ============================================================
import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { MODULE_CATALOG, type ModuleKey } from "@shared/ultraEngine";
import { ADVISOR_MODES, MODE_IDS, SINGLE_MODES, modeDef, type AdvisorMode } from "@shared/advisorModes";
import { buildAnswerPdf } from "./answerPdf";
import { mailMode, sendMail } from "./_core/mailer";
import { recordEvent } from "./ledger";

// Owner's standing rule (2026-09-06): DeepSeek is not part of this platform and
// must not be added back as a provider, a panel voice, or an OpenRouter route.
type ProviderId = "claude" | "chatgpt" | "grok" | "gemini" | "perplexity" | "openrouter" | "mistral" | "groq" | "cohere" | "together" | "manus";

export type Provider = {
  id: ProviderId;
  label: string;
  envKey: string;
  call: (apiKey: string, system: string, user: string) => Promise<string>;
};

const TIMEOUT_MS = 45_000;

async function timedFetch(url: string, init: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function openAiCompatible(baseUrl: string, model: string, apiKey: string, system: string, user: string): Promise<string> {
  const res = await timedFetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: 1500, messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ] }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("empty response");
  return text;
}

const PROVIDERS: Provider[] = [
  {
    id: "claude", label: "Claude (lead)", envKey: "ANTHROPIC_API_KEY",
    call: async (apiKey, system, user) => {
      const res = await timedFetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1500, system, messages: [{ role: "user", content: user }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = data.content?.filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
      if (!text) throw new Error("empty response");
      return text;
    },
  },
  { id: "chatgpt", label: "ChatGPT", envKey: "OPENAI_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.openai.com/v1", "gpt-4o", k, s, u) },
  { id: "grok", label: "Grok", envKey: "XAI_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.x.ai/v1", "grok-3", k, s, u) },
  { id: "perplexity", label: "Perplexity", envKey: "PERPLEXITY_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.perplexity.ai", "sonar-pro", k, s, u) },
  { id: "openrouter", label: "OpenRouter", envKey: "OPENROUTER_API_KEY",
    call: (k, s, u) => openAiCompatible("https://openrouter.ai/api/v1", "anthropic/claude-sonnet-4.5", k, s, u) },
  { id: "mistral", label: "Mistral", envKey: "MISTRAL_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.mistral.ai/v1", "mistral-large-latest", k, s, u) },
  { id: "groq", label: "Groq", envKey: "GROQ_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.groq.com/openai/v1", "llama-3.3-70b-versatile", k, s, u) },
  // Cohere's OpenAI-compatible endpoint (Command A).
  { id: "cohere", label: "Cohere", envKey: "COHERE_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.cohere.ai/compatibility/v1", "command-a-03-2025", k, s, u) },
  { id: "together", label: "Together AI", envKey: "TOGETHER_API_KEY",
    call: (k, s, u) => openAiCompatible("https://api.together.xyz/v1", "meta-llama/Llama-3.3-70B-Instruct-Turbo", k, s, u) },
  {
    // Manus routes through the built-in Forge gateway (OpenAI-compatible),
    // keyed by BUILT_IN_FORGE_API_KEY. We reuse invokeLLM so the gateway's
    // own default model and retry/backoff logic apply — the apiKey argument
    // is ignored because invokeLLM reads the key from the server env itself.
    id: "manus", label: "Manus", envKey: "BUILT_IN_FORGE_API_KEY",
    call: async (_apiKey, system, user) => {
      const res = await invokeLLM({ messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ], maxTokens: 1500 });
      const raw = res.choices[0]?.message?.content;
      const text = typeof raw === "string" ? raw.trim()
        : Array.isArray(raw) ? raw.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("\n").trim() : "";
      if (!text) throw new Error("empty response");
      return text;
    },
  },
  {
    id: "gemini", label: "Gemini", envKey: "GEMINI_API_KEY",
    call: async (apiKey, system, user) => {
      const res = await timedFetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
          }),
        },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n").trim();
      if (!text) throw new Error("empty response");
      return text;
    },
  },
];

export function configuredProviders(): Provider[] {
  return PROVIDERS.filter((p) => Boolean(process.env[p.envKey]));
}

export const ADVISOR_SYSTEM =
  "You are the AI planning advisor inside Russell Capital Systems' Ultra Calculator. " +
  "You explain financial projection scenarios in plain language. You NEVER guarantee returns, " +
  "never give individualized tax or legal advice (recommend licensed professionals for that), " +
  "label every number as a projection under stated assumptions, and never invent facts about " +
  "the client that were not provided.";

// Public homepage concierge. This prompt DELIBERATELY withholds the firm's
// proprietary method ("the secret sauce"): it names the strategy pillars and
// the general frame, but gives NO dollar amounts, NO percentages, NO formulas,
// and NO step-by-step numeric sequences. The detailed math lives behind the
// planning estimator and the licensed-advisor review, never in a public answer.
const PUBLIC_TEASER_SYSTEM =
  "You are the AI concierge on the Russell Capital Systems PUBLIC homepage, speaking to a prospective " +
  "client — often a physician, psychiatrist, or surgeon — who may know nothing about the firm yet. " +
  "Explain, in warm and confident plain language, the KINDS of strategies and the general FRAME that " +
  "could apply to their situation: accelerated mortgage payoff, lowering tax liability, Roth-conversion " +
  "sequencing, oil & gas drilling deductions, and trust-owned Index Universal Life used together — a " +
  "coordinated combination designed to help make wealth resilient and hard to touch ('divorce-proof'). " +
  "Talk about the IDEA of combining strategies in a sequence and why coordination beats any single tactic. " +
  "HARD RULES — never break these: reveal NO specific dollar amounts, NO percentages, NO calculation " +
  "formulas, NO exact number-of-combinations, NO named internal parameters, and NO step-by-step numeric " +
  "instructions. Keep it to concepts, frames, and general sequences only. Never guarantee any outcome. " +
  "State plainly that this is general education, not tax, legal, or investment advice, and that a licensed " +
  "professional confirms every specific in a personal review. Close by inviting them to complete the short " +
  "planning estimator and book a thorough evaluation. Under 180 words.";

/** Lead-model call: Claude direct if keyed, else the built-in Forge LLM, else null. */
export async function leadModel(system: string, user: string): Promise<{ text: string; via: string } | null> {
  const claude = PROVIDERS[0];
  const key = process.env[claude.envKey];
  if (key) {
    try { return { text: await claude.call(key, system, user), via: "claude" }; }
    catch (e) { console.warn("[ultraAI] claude failed:", String(e).slice(0, 120)); }
  }
  try {
    const res = await invokeLLM({ messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ], maxTokens: 1500 });
    const raw = res.choices[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim()
      : Array.isArray(raw) ? raw.filter((p) => p.type === "text").map((p) => (p as { text: string }).text).join("\n").trim() : "";
    if (text) return { text, via: "builtin" };
  } catch (e) { console.warn("[ultraAI] builtin LLM failed:", String(e).slice(0, 120)); }
  return null;
}

// Deterministic module triage — the zero-keys fallback and the baseline the
// AI plan is checked against. Rule-based from the profile facts alone.
export function ruleBasedPlan(facts: {
  hasMortgage: boolean; hasPositiveCashflow: boolean; homeEquity: number;
  wantsRentalIncome: boolean; wantsProtection: boolean; wantsGuaranteedIncome: boolean;
}): Array<{ module: ModuleKey; status: "necessary" | "optional" | "skip"; reason: string }> {
  const out: Array<{ module: ModuleKey; status: "necessary" | "optional" | "skip"; reason: string }> = [];
  out.push({ module: "investmentGrowth", status: "necessary", reason: "Every projection needs a growth engine for invested assets and surplus cash." });
  out.push({
    module: "mortgageKiller",
    status: facts.hasMortgage && facts.hasPositiveCashflow ? "necessary" : facts.hasMortgage ? "optional" : "skip",
    reason: facts.hasMortgage
      ? facts.hasPositiveCashflow
        ? "There is a mortgage and surplus cash — the recycle engine is the core of this plan."
        : "There is a mortgage but little surplus; the cycle will run slowly until cash flow improves."
      : "No mortgage to kill — the recycling pattern has nothing to work on.",
  });
  out.push({
    module: "realEstate",
    status: facts.hasMortgage || facts.wantsRentalIncome ? "necessary" : "optional",
    reason: facts.wantsRentalIncome
      ? "Rental income is a stated goal — appreciation and STR/LTR yields must be modeled."
      : facts.hasMortgage
        ? "The mortgage-killer cycles produce properties; appreciation and rental modeling completes that picture."
        : "Only relevant if the client acquires property later.",
  });
  out.push({
    module: "equityDeployment",
    status: facts.homeEquity > 100_000 ? "optional" : "skip",
    reason: facts.homeEquity > 100_000
      ? `Roughly $${Math.round(facts.homeEquity).toLocaleString()} of equity is idle — deploying part of it is a real option, with the lien risk explained.`
      : "Too little idle equity for deployment to matter yet.",
  });
  out.push({
    module: "trustIUL",
    status: facts.wantsProtection ? "necessary" : "optional",
    reason: facts.wantsProtection
      ? "Divorce/creditor protection and tax-advantaged income were requested — the trust-owned IUL is the protection-first vehicle in this strategy."
      : "Valuable for tax-free income layering and living benefits, but not required by the stated goals.",
  });
  out.push({
    module: "incomeAnnuity",
    status: facts.wantsGuaranteedIncome ? "necessary" : "optional",
    reason: facts.wantsGuaranteedIncome
      ? "A guaranteed-style income floor was requested."
      : "Adds an income floor in later windows; include it if sequence-of-returns risk worries the client.",
  });
  return out;
}

const profileSummarySchema = z.object({
  summary: z.string().max(20_000), // plain-text client facts, spoken or typed
  goals: z.string().max(5_000).default(""),
});

const UNCONFIGURED = "The AI advisor is not configured yet — the site owner needs to add an AI key in the server's environment panel (see docs/ULTRA_AI_ENV.md).";
type AnswerSectionOut = { id: AdvisorMode; title: string; text: string; via?: string };
type AskInput = { question: string; pagePath: string; profileSummary: string };

/** One answer in one mode: the shared system prompt plus the mode's instruction and word budget. */
async function answerInMode(input: AskInput, mode: AdvisorMode): Promise<{ text: string; via: string } | null> {
  const def = modeDef(mode);
  return leadModel(
    ADVISOR_SYSTEM,
    `The user is on page "${input.pagePath}" of Russell Capital Systems.\n` +
    (input.profileSummary ? `Their stated profile:\n${input.profileSummary}\n\n` : "No profile has been shared yet.\n\n") +
    `They asked: "${input.question}"\n\n` +
    `Answer mode — ${def.label}. ${def.instruction}\n` +
    `Speak to them directly and concretely. Under ${def.maxWords} words. If the profile is missing facts you need, say which.`,
  );
}

/** All five single modes, in parallel, in the order the PDF prints them. */
async function answerAllModes(input: AskInput): Promise<AnswerSectionOut[] | null> {
  const answers = await Promise.all(SINGLE_MODES.map((m) => answerInMode(input, m)));
  if (answers.every((a) => a === null)) return null;
  return SINGLE_MODES.map((m, i) => ({ id: m, title: modeDef(m).label, text: answers[i]?.text ?? "This mode did not answer; try again in a moment.", via: answers[i]?.via }));
}

export const ultraRouter = router({
  // Which AI teammates are configured — names only, never key material.
  providers: publicProcedure.query(() => ({
    lead: "claude",
    team: PROVIDERS.map((p) => ({ id: p.id, label: p.label, configured: Boolean(process.env[p.envKey]) })),
    voiceOut: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID),
    mailOut: mailMode() !== "none",
    modes: ADVISOR_MODES.map((m) => ({ id: m.id, label: m.label, short: m.short, blurb: m.blurb })),
    note: "Keys are set in the server's environment panel only.",
  })),

  // Module triage: which calculators are 100% necessary vs optional for THIS
  // client, with on-screen explanations. AI-ranked when a model is available,
  // deterministic rules otherwise — and the catalog text ships either way.
  plan: publicProcedure
    .input(profileSummarySchema.extend({
      facts: z.object({
        hasMortgage: z.boolean(),
        hasPositiveCashflow: z.boolean(),
        homeEquity: z.number(),
        wantsRentalIncome: z.boolean(),
        wantsProtection: z.boolean(),
        wantsGuaranteedIncome: z.boolean(),
      }),
    }))
    .mutation(async ({ input }) => {
      const baseline = ruleBasedPlan(input.facts);
      const lead = await leadModel(
        ADVISOR_SYSTEM,
        `Client facts:\n${input.summary}\n\nGoals:\n${input.goals}\n\n` +
        `Available calculator modules:\n${(Object.keys(MODULE_CATALOG) as ModuleKey[])
          .map((k) => `- ${k}: ${MODULE_CATALOG[k].name} — ${MODULE_CATALOG[k].whenNecessary}`).join("\n")}\n\n` +
        `A rule-based triage said:\n${baseline.map((b) => `- ${b.module}: ${b.status} (${b.reason})`).join("\n")}\n\n` +
        `In under 250 words: confirm or adjust which modules are NECESSARY vs OPTIONAL for this client, ` +
        `and explain in plain language what each included module contributes and under which circumstances ` +
        `the optional ones become relevant. Projections only — no guarantees.`,
      );
      return {
        modules: baseline,
        catalog: MODULE_CATALOG,
        aiCommentary: lead?.text ?? null,
        aiVia: lead?.via ?? "rules-only",
      };
    }),

  // Every-page advisor: "what does this page mean for me, given my profile?"
  // Six ways to answer — direct, deeper, integrated, what's-in-it-for-you,
  // legal with citations, or all five — chosen by the person asking.
  ask: publicProcedure
    .input(z.object({
      question: z.string().min(1).max(4_000),
      pagePath: z.string().max(200).default("/"),
      profileSummary: z.string().max(20_000).default(""),
      mode: z.enum(MODE_IDS).default("surface"),
    }))
    .mutation(async ({ input }) => {
      if (input.mode === "all") {
        const sections = await answerAllModes(input);
        if (!sections) return { answer: UNCONFIGURED, via: "unconfigured", mode: input.mode, sections: [] as AnswerSectionOut[] };
        return { answer: sections.map((s) => `${s.title.toUpperCase()}\n${s.text}`).join("\n\n"), via: sections[0]?.via ?? "lead", mode: input.mode, sections };
      }
      const lead = await answerInMode(input, input.mode);
      if (!lead) return { answer: UNCONFIGURED, via: "unconfigured", mode: input.mode, sections: [] as AnswerSectionOut[] };
      return { answer: lead.text, via: lead.via, mode: input.mode, sections: [{ id: input.mode, title: modeDef(input.mode).label, text: lead.text, via: lead.via }] };
    }),

  // The whole answering process as a PDF, emailed on request. Consent is
  // explicit (the person confirms the address and ticks the box), sealed on
  // the ledger when the asker is signed in, and nothing is sent without mail
  // being configured on the host.
  emailAnswer: publicProcedure
    .input(z.object({
      question: z.string().min(1).max(4_000),
      pagePath: z.string().max(200).default("/"),
      profileSummary: z.string().max(20_000).default(""),
      email: z.string().email().max(200),
      confirmEmail: z.string().max(200),
      consent: z.literal(true),
      sections: z.array(z.object({ id: z.enum(MODE_IDS), title: z.string().max(80), text: z.string().max(12_000), via: z.string().max(60).optional() })).max(6).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const email = input.email.trim().toLowerCase();
      if (email !== input.confirmEmail.trim().toLowerCase()) return { sent: false as const, reason: "The two email addresses do not match." };
      if (mailMode() === "none") return { sent: false as const, reason: "Email is not switched on for this site yet (the owner sets RESEND_API_KEY or SMTP_* on the host)." };
      const sections = input.sections?.length ? input.sections : await answerAllModes(input);
      if (!sections) return { sent: false as const, reason: UNCONFIGURED };
      const generatedAt = new Date();
      const pdf = await buildAnswerPdf({ question: input.question, pagePath: input.pagePath, sections, generatedAt, recipient: email });
      const stamp = generatedAt.toISOString().slice(0, 10);
      const result = await sendMail({
        to: email,
        subject: `Your question, answered six ways — ${stamp}`,
        text: `You asked: "${input.question.trim()}"\n\nThe full answering process — direct, deeper, integrated, what's in it for you, and the legal view with citations — is attached as a PDF so you can review it at your own pace.\n\nEducation and projections only, not tax, legal or investment advice.\n\nRussell Capital Systems`,
        attachments: [{ filename: `rcs-answer-${stamp}.pdf`, content: pdf, contentType: "application/pdf" }],
        category: "transactional",
      });
      if (ctx.user?.id) {
        void recordEvent({ kind: "consent", source: "client", key: "advisor.emailAnswer", label: "Client asked for the answer by email", value: { email, pagePath: input.pagePath, sections: sections.map((s) => s.id), sent: result.sent }, summary: `${result.sent ? "Emailed" : "Could not email"} the six-way answer to ${email}`, actorName: ctx.user.name ?? null, userId: ctx.user.id }).catch(() => undefined);
      }
      return result.sent ? { sent: true as const, to: email, sections: sections.length } : { sent: false as const, reason: result.reason ?? "The mail service refused the message." };
    }),

  // Multi-AI panel: fan the same question out to every configured provider,
  // then have the lead model synthesize. Unconfigured providers are reported,
  // not faked — the answer never pretends a model voted when it didn't.
  panel: publicProcedure
    .input(z.object({
      question: z.string().min(1).max(6_000),
      profileSummary: z.string().max(20_000).default(""),
    }))
    .mutation(async ({ input }) => {
      const team = configuredProviders();
      const userMsg =
        (input.profileSummary ? `Client profile:\n${input.profileSummary}\n\n` : "") +
        `Question: ${input.question}\n\nAnswer in under 150 words. Projections only — no guarantees.`;
      const results = await Promise.all(team.map(async (p) => {
        try {
          return { id: p.id, label: p.label, ok: true as const, text: await p.call(process.env[p.envKey]!, ADVISOR_SYSTEM, userMsg) };
        } catch (e) {
          return { id: p.id, label: p.label, ok: false as const, text: `unavailable (${String(e).slice(0, 60)})` };
        }
      }));
      const skipped = PROVIDERS.filter((p) => !process.env[p.envKey]).map((p) => p.label);
      const answered = results.filter((r) => r.ok);
      let synthesis: string | null = null;
      if (answered.length > 1) {
        const lead = await leadModel(
          ADVISOR_SYSTEM,
          `${answered.length} AI advisors answered the same client question. Synthesize where they agree, ` +
          `flag where they disagree, in under 150 words.\n\n` +
          answered.map((r) => `--- ${r.label} ---\n${r.text}`).join("\n\n"),
        );
        synthesis = lead?.text ?? null;
      }
      return { responses: results, skipped, synthesis };
    }),

  // PUBLIC homepage concierge: press-the-mic / type-a-question. Fans the
  // question out to every configured AI using the teaser prompt (no numbers,
  // no formulas — concepts and frames only), then the lead model synthesizes
  // ONE warm answer. Returns the answer plus the names of the AIs that
  // contributed, so the page can say "answered by 9 AI advisors" honestly.
  homepagePanel: publicProcedure
    .input(z.object({
      question: z.string().min(1).max(4_000),
      contextSummary: z.string().max(8_000).default(""),
    }))
    .mutation(async ({ input }) => {
      const team = configuredProviders();
      const userMsg =
        (input.contextSummary ? `What the visitor has shared so far:\n${input.contextSummary}\n\n` : "") +
        `The visitor asked: "${input.question}"\n\n` +
        `Answer per your hard rules — concepts and frames only, no numbers or formulas.`;
      const results = await Promise.all(team.map(async (p) => {
        try {
          return { id: p.id, label: p.label, ok: true as const, text: await p.call(process.env[p.envKey]!, PUBLIC_TEASER_SYSTEM, userMsg) };
        } catch (e) {
          return { id: p.id, label: p.label, ok: false as const, text: `unavailable (${String(e).slice(0, 60)})` };
        }
      }));
      const contributors = results.filter((r) => r.ok).map((r) => r.label);
      let answer: string | null = null;
      if (contributors.length > 0) {
        const lead = await leadModel(
          PUBLIC_TEASER_SYSTEM,
          `${contributors.length} AI advisors each answered the same visitor question below. ` +
          `Synthesize them into ONE warm, plain-language answer that follows every hard rule ` +
          `(concepts and frames only — absolutely no dollar amounts, percentages, or formulas). ` +
          `Under 180 words.\n\nVisitor question: "${input.question}"\n\n` +
          results.filter((r) => r.ok).map((r) => `--- ${r.label} ---\n${r.text}`).join("\n\n"),
        );
        answer = lead?.text ?? results.find((r) => r.ok)?.text ?? null;
      }
      return {
        answer: answer ??
          "Our AI concierge isn't switched on yet — but a Russell Capital Systems advisor can walk you " +
          "through how accelerated mortgage payoff, tax-liability reduction, Roth-conversion sequencing, " +
          "oil & gas deductions, and trust-owned Index Universal Life combine into one coordinated plan. " +
          "Complete the short estimator below and book a thorough evaluation.",
        contributors,
        contributorCount: contributors.length,
        configured: team.length > 0,
      };
    }),

  // Voice output via ElevenLabs (the owner's cloned voice) — env-keyed only.
  speak: publicProcedure
    .input(z.object({ text: z.string().min(1).max(2_000) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      const voiceId = process.env.ELEVENLABS_VOICE_ID;
      if (!apiKey || !voiceId) {
        return { ok: false as const, reason: "Voice output not configured (ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID)." };
      }
      const res = await timedFetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`, {
        method: "POST",
        headers: { "content-type": "application/json", "xi-api-key": apiKey },
        body: JSON.stringify({ text: input.text, model_id: "eleven_multilingual_v2" }),
      });
      if (!res.ok) return { ok: false as const, reason: `voice service error (HTTP ${res.status})` };
      const audio = Buffer.from(await res.arrayBuffer()).toString("base64");
      return { ok: true as const, audioBase64: audio, mimeType: "audio/mpeg" };
    }),
});
