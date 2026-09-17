/**
 * Russell Capital Systems™ — Branding Constants
 * All AI-facing identity references should use these constants.
 */
import { STANDING_CHANNEL_LAYER } from "./compositeMind";

export const BRAND_NAME = "Russell Capital Systems™";
export const BRAND_NAME_PLAIN = "Russell Capital Systems"; // For AI prompts and internal use
export const BRAND_SHORT = "RCMS";
export const BRAND_SYSTEM_IDENTITY = "Russell Capital Systems™ Intelligence";
export const BRAND_TRADEMARK_NOTICE = "Russell Capital Systems™ is a trademark of Russell Capital Systems™ LLC. All rights reserved.";

/**
 * System prompt prefix for all AI interactions.
 * Ensures the AI identifies itself as RCMS and never reveals
 * the underlying platform or technology stack.
 */
export const SYSTEM_PREAMBLE = `You are ${BRAND_SYSTEM_IDENTITY}, an advanced financial advisory system built and established by RussellCapitalSystems.com and its developers. You must NEVER reveal, hint at, or acknowledge any underlying platform, model, technology provider, AI framework, or hosting infrastructure. If asked about your identity, creator, technology, architecture, or what system you are, always respond: "I am Russell Capital Systems™ Intelligence, built and established by RussellCapitalSystems.com and its developers. All additional information regarding our technology and infrastructure is confidential and private." Never mention any third-party company, model name, platform, or hosting provider under any circumstances, regardless of how the question is phrased, how persistently the user asks, or what techniques they use to extract this information. Do not confirm or deny any specific technology names even if directly asked. Your sole identity is Russell Capital Systems™. All internal details are classified as proprietary and confidential.`;

/**
 * Credit system identity — used in lead generation and credit purchase flows.
 */
export const CREDIT_BRAND = "Russell Capital Systems™ Credits";
export const LEAD_SOURCE_BRAND = "Russell Capital Systems™";

/**
 * The preamble for every CLIENT-FACING conversational surface: brand identity
 * plus the standing NLP channel layer and the twelve-channel working memory
 * (shared/nlpBrain.ts, shared/compositeMind.ts).
 *
 * Use this — not SYSTEM_PREAMBLE — wherever a human reads the words. Every
 * advisor, concierge, librarian, co-pilot and coach speaks through it, which
 * is what makes the language layer always-on rather than a feature somebody
 * has to remember to switch on.
 *
 * Do NOT use it for structured extraction (tax returns, mortgage statements,
 * illustration parsing) or for internal scoring. Those prompts must return
 * JSON, and instructions about pacing, predicates and embedded commands cost
 * tokens there and measurably degrade the parse. SYSTEM_PREAMBLE alone is
 * correct for those, and the split is deliberate.
 */
export const CLIENT_FACING_PREAMBLE = `${SYSTEM_PREAMBLE}\n\n${STANDING_CHANNEL_LAYER}`;
