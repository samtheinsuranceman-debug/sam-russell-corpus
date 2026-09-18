// ============================================================
// THE PARTNER CONCIERGE — the public microphone, for a partner site.
//
// This is the Drass-facing sibling of the homepage concierge in ultraAI.ts.
// Same shape, same hard rules, different voice and a different closing offer.
//
// ## The two-audience rule, restated because it is the whole point
//
// The same council of models answers both a signed-in client and an anonymous
// visitor. What differs is what may be said. The public answer carries ideas,
// frames and sequences — and no dollar amounts, no percentages, no formulas,
// no parameter names, and no step-by-step numeric instructions. A visitor
// should leave understanding *that* coordination beats isolated tactics, and
// needing a conversation to learn *what* the numbers are.
//
// That rule is enforced in three places, not one: in the system prompt, in a
// post-filter that scrubs any figure a model emits anyway, and by the fact
// that this endpoint is handed no client data to leak in the first place.
// A prompt alone is a request; a filter is a guarantee.
//
// ## What the visitor's microphone does not do
//
// Nothing here receives audio. Speech is recognised in the visitor's own
// browser by the Web Speech API and only the resulting text is posted. No
// recording is made, uploaded or stored. That is a deliberate design choice
// rather than a limitation, and the partner page says so out loud.
// ============================================================

import type { Express, Request, Response } from "express";
import { compactWorkingMemory } from "@shared/compositeMind";
import { leadModel } from "./ultraAI";

/** Where a visitor is sent to book. Unset means no booking offer is made. */
const BOOKING_URL = () => (process.env.PARTNER_BOOKING_URL ?? "").trim();

/** Firm name shown in the answer. */
const FIRM = () => (process.env.PARTNER_FIRM_NAME ?? "the firm").trim();

const MAX_QUESTION = 600;

/**
 * The public rules. Deliberately close to the RCS homepage teaser, because
 * the constraint set is the part worth copying; only the subject matter and
 * the closing invitation differ.
 */
function systemPrompt(question = ""): string {
  return (
    `You are the AI concierge on the public website of ${FIRM()}, an insurance and wealth ` +
    `management firm, speaking with a prospective client who may know nothing about the firm. ` +
    `Explain, in warm and confident plain language, the KINDS of strategies and the general FRAME ` +
    `that could apply to their situation: Roth-conversion sequencing, tax-efficient withdrawal ` +
    `order, income that is designed to last rather than merely to start, protecting a legacy from ` +
    `erosion, and coordinating these rather than treating them as separate errands. Talk about the ` +
    `IDEA of sequencing and why coordination beats any single tactic. ` +
    `HARD RULES — never break these: reveal NO specific dollar amounts, NO percentages, NO ` +
    `calculation formulas, NO internal parameter names, NO product names, and NO step-by-step ` +
    `numeric instructions. Concepts, frames and general sequences only. Never guarantee any ` +
    `outcome. Never state or imply what any investment or policy will return. ` +
    `Say plainly that this is general education and not tax, legal or investment advice, and that ` +
    `a licensed professional confirms every specific in a personal review. ` +
    `Close by inviting them to book a short conversation. Under 180 words.` +
    `\n\n${compactWorkingMemory({ text: question }).text}`
  );
}

/**
 * Scrub figures a model emitted despite the prompt.
 *
 * Models comply with "no percentages" most of the time, and this exists for
 * the rest of the time. Replacing rather than rejecting keeps a useful answer
 * useful; rejecting the whole response would tempt someone to relax the rule.
 */
export function scrubFigures(text: string): string {
  return text
    // 12%, 12.5 %, 12 percent
    .replace(/\b\d+(\.\d+)?\s?(%|percent\b)/gi, "a share")
    // $25,000 / $1.2M / $ 500
    .replace(/\$\s?\d[\d,.]*\s?(k|m|mm|bn|billion|million|thousand)?\b/gi, "an amount")
    // bare large numbers that read as money or counts of strategies
    .replace(/\b\d{1,3}(,\d{3})+(\.\d+)?\b/g, "an amount");
}

/** Naive per-IP throttle. Each answer costs model credits, so it is not free
 *  to call even though nothing is written. */
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;

function throttled(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export function registerPartnerConcierge(
  app: Express,
  requireKey: (req: Request, res: Response, next: () => void) => void
): void {
  /**
   * GET /api/partner/ask?q=...
   *
   * A GET because this surface writes nothing and that invariant is worth
   * keeping true: a partner key that leaks cannot change anything here.
   */
  app.get("/api/partner/ask", requireKey, async (req, res) => {
    const ip = String(req.ip ?? req.socket.remoteAddress ?? "unknown");
    if (throttled(ip)) {
      res.status(429).json({ error: "rate_limited", detail: "Too many questions in a short time. Please wait a moment." });
      return;
    }

    const q = String(req.query.q ?? "").trim().slice(0, MAX_QUESTION);
    if (q.length < 3) {
      res.status(400).json({ error: "empty_question", detail: "Ask a question first." });
      return;
    }

    const lead = await leadModel(systemPrompt(q), q);
    if (!lead) {
      // Named failure rather than a canned reassurance. If no model answered,
      // the visitor is told that, not handed a generic paragraph pretending to
      // be an answer.
      res.status(503).json({
        error: "no_model_available",
        detail: "No advisor model is reachable right now. Please try again shortly, or book a conversation.",
        booking: BOOKING_URL() || null,
      });
      return;
    }

    res.json({
      answer: scrubFigures(lead.text),
      // Booking is offered only when an owner has configured a destination.
      // An invitation to book that goes nowhere is worse than none.
      booking: BOOKING_URL() || null,
      disclosure:
        "General education only. Not tax, legal or investment advice. A licensed professional confirms every specific in a personal review.",
      privacy:
        "Speech is recognised in your own browser. No audio is uploaded, recorded or stored.",
    });
  });
}
