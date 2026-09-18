/**
 * Finding business owners who need capital, and reaching them without buying a lawsuit.
 *
 * ## Two channels, two completely different legal regimes
 *
 * Email and text are not the same risk and must not share a code path.
 *
 * EMAIL is governed by CAN-SPAM. There is no opt-in requirement — cold commercial email
 * to a business is lawful. What is required: accurate header and sender information, a
 * subject line that is not deceptive, a valid physical postal address in every message,
 * a working opt-out, and honoring that opt-out within ten business days. Every-three-days
 * cadence is aggressive but it is legal. This engine sends it.
 *
 * SMS is governed by the TCPA, and this is where the money is lost. Automated marketing
 * texts require prior express written consent, and the narrow business-to-business
 * carve-out covers manually dialed calls to verified LANDLINES for non-marketing purposes
 * — it does not cover an automated campaign to a business owner's mobile. Statutory
 * damages are $500 per text, trebled to $1,500 for a willful violation, with no cap.
 * A thousand-recipient campaign run without consent is a seven-figure exposure before
 * anyone reads the message. So `buildSmsCampaign()` throws without a consent record per
 * recipient. There is no flag to turn that off.
 *
 * (One narrowing: the Fifth Circuit held in Bradford v. Sovereign Pest Control, February
 * 2026, that the statute requires only prior express consent rather than the FCC's
 * written standard. That covers Texas, Louisiana, and Mississippi and nowhere else. This
 * engine holds every state to the written standard, because a multi-state campaign
 * priced off the most permissive circuit is a campaign priced wrong.)
 *
 * ## Finding the ones who need money — lawfully
 *
 * The question was how to find businesses that are behind. The tempting answer — a
 * revenue-share with tax offices for names of filers whose revenue dropped — is a
 * criminal offense for the preparer. IRC section 7216 makes knowing or reckless
 * disclosure or USE of return information for any purpose other than preparing the
 * return a misdemeanor: up to a year and a fine per disclosure, plus $250 per disclosure
 * civilly under section 6713, plus referral to the IRS Office of Professional
 * Responsibility. A commission for the referral does not fix it; it establishes the
 * motive. There is a lawful route through section 7216 consent, and it is in the legal
 * memo, but it requires the taxpayer's specific written consent BEFORE the preparer says
 * a word, which means the preparer asks their client, not us.
 *
 * What this engine uses instead is public record and observable signal, which is both
 * legal and, for this purpose, better — a UCC filing tells you someone already borrowed,
 * which is a stronger buying signal than a bad quarter ever was. See `DistressSignal`.
 */

import type { Month } from './industryRisk';
import { tradesNeedingCapital } from './industryRisk';

export type Channel = 'email' | 'sms' | 'avatar-video-email' | 'direct-mail' | 'social-dm';

/**
 * Observable, lawfully obtainable indicators that a business needs capital.
 *
 * Every one of these is either public record or the owner's own published behavior.
 * None requires a confidential source, and none touches tax return information.
 */
export type DistressSignal =
  /** UCC-1 financing statement on file. Public. They have borrowed before and will again. */
  | 'ucc-filing-existing'
  /** Multiple UCC-1s stacked from different secured parties. Public. Often over-levered. */
  | 'ucc-stacking'
  /** State or federal tax lien filed. Public record at the county or Secretary of State. */
  | 'tax-lien-filed'
  /** Civil judgment entered against the business. Public docket. */
  | 'judgment-entered'
  /** Business license or contractor registration lapsed or in renewal grace. Public registry. */
  | 'license-lapsed'
  /** Job postings pulled down or headcount ads stopped. Publicly observable. */
  | 'hiring-reversal'
  /** Reviews mention delays, deposits taken without work, or supply problems. Public. */
  | 'review-sentiment-decline'
  /** The trade's own calendar says they need pre-season capital right now. */
  | 'seasonal-window'
  /** Equipment listed for sale by the owner. Public marketplace. */
  | 'equipment-liquidation';

export interface SignalWeight {
  readonly signal: DistressSignal;
  /** Higher means a stronger indication they will take a call. */
  readonly buyingIntent: number;
  /** Higher means worse credit. A strong buyer who cannot repay is not a lead. */
  readonly creditConcern: number;
  readonly lawfulSource: string;
}

/**
 * Weighted deliberately so that intent and risk are scored SEPARATELY.
 *
 * The trap in distress-based prospecting is treating desperation as a buying signal.
 * It is, and it is also a default signal, and a scoring model that collapses the two
 * will hand back a list of businesses eager to sign and unable to pay. Stacked UCCs
 * score high intent AND high concern for exactly that reason.
 */
export const SIGNAL_WEIGHTS: readonly SignalWeight[] = [
  { signal: 'seasonal-window', buyingIntent: 8, creditConcern: 0, lawfulSource: 'Trade calendar (this engine).' },
  { signal: 'ucc-filing-existing', buyingIntent: 7, creditConcern: 2, lawfulSource: 'Secretary of State UCC search. Public.' },
  { signal: 'hiring-reversal', buyingIntent: 5, creditConcern: 4, lawfulSource: 'Public job boards.' },
  { signal: 'ucc-stacking', buyingIntent: 9, creditConcern: 8, lawfulSource: 'Secretary of State UCC search. Public.' },
  { signal: 'license-lapsed', buyingIntent: 4, creditConcern: 6, lawfulSource: 'State licensing registry. Public.' },
  { signal: 'review-sentiment-decline', buyingIntent: 3, creditConcern: 5, lawfulSource: 'Public review platforms.' },
  { signal: 'tax-lien-filed', buyingIntent: 6, creditConcern: 9, lawfulSource: 'County recorder / Secretary of State. Public.' },
  { signal: 'judgment-entered', buyingIntent: 5, creditConcern: 9, lawfulSource: 'Public court docket.' },
  { signal: 'equipment-liquidation', buyingIntent: 4, creditConcern: 8, lawfulSource: 'Public marketplace listings.' },
] as const;

export interface Prospect {
  readonly id: string;
  readonly businessName: string;
  readonly naics: string;
  readonly state: string;
  readonly ownerEmail?: string;
  readonly ownerMobile?: string;
  readonly signals: readonly DistressSignal[];
}

export interface ScoredProspect {
  readonly id: string;
  readonly businessName: string;
  readonly intentScore: number;
  readonly concernScore: number;
  readonly tier: 'call-first' | 'work' | 'underwrite-hard' | 'decline';
  readonly reasons: readonly string[];
  readonly plain: string;
}

export function scoreProspect(p: Prospect, month: Month): ScoredProspect {
  const seasonal = tradesNeedingCapital(month).some((t) => t.naics === p.naics);
  const signals = seasonal && !p.signals.includes('seasonal-window')
    ? [...p.signals, 'seasonal-window' as DistressSignal]
    : p.signals;

  let intent = 0;
  let concern = 0;
  const reasons: string[] = [];
  for (const s of signals) {
    const w = SIGNAL_WEIGHTS.find((x) => x.signal === s);
    if (!w) continue;
    intent += w.buyingIntent;
    concern += w.creditConcern;
    reasons.push(`${s} (intent +${w.buyingIntent}, concern +${w.creditConcern}) — ${w.lawfulSource}`);
  }

  // High intent with low concern is the whole business. High intent with high concern
  // is the thing that looks like the whole business and is not.
  let tier: ScoredProspect['tier'];
  if (intent >= 8 && concern <= 4) tier = 'call-first';
  else if (intent >= 6 && concern <= 8) tier = 'work';
  else if (intent >= 5) tier = 'underwrite-hard';
  else tier = 'decline';

  return {
    id: p.id,
    businessName: p.businessName,
    intentScore: intent,
    concernScore: concern,
    tier,
    reasons,
    plain:
      `${p.businessName}: intent ${intent}, credit concern ${concern} — ${tier}. ` +
      (tier === 'underwrite-hard'
        ? 'Wants money badly and shows real credit damage. Those two facts are the same fact. Bank statements before a quote.'
        : tier === 'call-first'
          ? 'Needs capital on schedule, not in trouble. This is the lend.'
          : tier === 'decline'
            ? 'No live signal. Leave in nurture, do not spend a call.'
            : 'Workable with verification.'),
  };
}

export interface ConsentRecord {
  readonly prospectId: string;
  /** How consent was captured — a web form, a signed doc, a checked box with timestamp. */
  readonly method: string;
  /** ISO timestamp. */
  readonly capturedAt: string;
  /** The exact disclosure text shown at the moment of consent. */
  readonly disclosureShown: string;
  /** The phone number consent was given for. Must match the number messaged. */
  readonly number: string;
  readonly revokedAt?: string;
}

export class MissingConsentError extends Error {
  constructor(ids: readonly string[]) {
    super(
      `Refused to build an SMS campaign: ${ids.length} recipient(s) have no valid consent record ` +
        `(${ids.slice(0, 5).join(', ')}${ids.length > 5 ? ', …' : ''}). ` +
        'Automated marketing texts require prior express written consent. Statutory damages are ' +
        '$500 per message, trebled to $1,500 if willful, uncapped. There is no B2B exemption for ' +
        'an automated campaign to a mobile number. Capture consent, then send.',
    );
    this.name = 'MissingConsentError';
  }
}

export interface Script {
  readonly id: string;
  readonly subject?: string;
  readonly body: string;
  /** Set when the message is delivered as a generated-avatar video. */
  readonly avatarPersona?: string;
}

export class AvatarDisclosureError extends Error {
  constructor(scriptId: string) {
    super(
      `Script ${scriptId} is delivered as a synthetic avatar video but carries no AI disclosure. ` +
        'A generated likeness presented as a real person recording a message is a deception claim ' +
        'under the FTC Act and under a growing set of state synthetic-media statutes. Disclose it ' +
        'in the message body. Disclosed, it is a legitimate and effective format.',
    );
    this.name = 'AvatarDisclosureError';
  }
}

export interface CampaignConfig {
  readonly channel: Channel;
  readonly scripts: readonly Script[];
  /** Days between touches to the same prospect. */
  readonly cadenceDays: number;
  /** Maximum touches before the prospect moves to long-nurture. */
  readonly maxTouches: number;
  readonly physicalPostalAddress: string;
  readonly optOutInstruction: string;
  /** Referral incentive offered, if any. */
  readonly referralDiscountPct?: number;
}

export interface Touch {
  readonly prospectId: string;
  readonly channel: Channel;
  readonly scriptId: string;
  /** Days from campaign start. */
  readonly dayOffset: number;
  readonly body: string;
}

export class CanSpamError extends Error {
  constructor(missing: string) {
    super(
      `Refused to build an email campaign: ${missing}. CAN-SPAM requires a valid physical postal ` +
        'address and a working opt-out in every commercial message, and requires opt-outs be ' +
        'honored within ten business days. Penalties run per message.',
    );
    this.name = 'CanSpamError';
  }
}

function rotate<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}

/**
 * Build the touch schedule for a campaign.
 *
 * Scripts rotate so no prospect sees the same message twice in a sequence — which is
 * both better marketing and the thing that keeps a domain out of a spam trap.
 */
export function buildEmailCampaign(
  prospects: readonly Prospect[],
  config: CampaignConfig,
  suppressed: ReadonlySet<string> = new Set(),
): Touch[] {
  if (!config.physicalPostalAddress?.trim()) throw new CanSpamError('no physical postal address');
  if (!config.optOutInstruction?.trim()) throw new CanSpamError('no opt-out instruction');
  if (config.scripts.length === 0) throw new Error('No scripts supplied.');

  for (const s of config.scripts) {
    if (s.avatarPersona && !/\b(ai|synthetic|generated|avatar)\b/i.test(s.body)) {
      throw new AvatarDisclosureError(s.id);
    }
  }

  const touches: Touch[] = [];
  for (const p of prospects) {
    if (suppressed.has(p.id) || !p.ownerEmail) continue;
    for (let t = 0; t < config.maxTouches; t++) {
      const script = rotate(config.scripts, t);
      const footer =
        `\n\n---\n${config.physicalPostalAddress}\n${config.optOutInstruction}` +
        (config.referralDiscountPct
          ? `\nRefer another owner: ${config.referralDiscountPct}% off your cost if they close.`
          : '');
      touches.push({
        prospectId: p.id,
        channel: config.channel,
        scriptId: script.id,
        dayOffset: t * config.cadenceDays,
        body: script.body + footer,
      });
    }
  }
  return touches;
}

export function buildSmsCampaign(
  prospects: readonly Prospect[],
  config: CampaignConfig,
  consents: readonly ConsentRecord[],
  suppressed: ReadonlySet<string> = new Set(),
): Touch[] {
  const valid = new Map<string, ConsentRecord>();
  for (const c of consents) {
    if (c.revokedAt) continue;
    if (!c.method?.trim() || !c.capturedAt?.trim() || !c.disclosureShown?.trim()) continue;
    valid.set(c.prospectId, c);
  }

  const targets = prospects.filter((p) => !suppressed.has(p.id) && p.ownerMobile);
  const missing = targets
    .filter((p) => {
      const c = valid.get(p.id);
      return !c || c.number !== p.ownerMobile;
    })
    .map((p) => p.id);
  if (missing.length) throw new MissingConsentError(missing);

  if (config.scripts.length === 0) throw new Error('No scripts supplied.');

  const touches: Touch[] = [];
  for (const p of targets) {
    for (let t = 0; t < config.maxTouches; t++) {
      const script = rotate(config.scripts, t);
      touches.push({
        prospectId: p.id,
        channel: 'sms',
        scriptId: script.id,
        dayOffset: t * config.cadenceDays,
        body: `${script.body} Reply STOP to opt out.`,
      });
    }
  }
  return touches;
}

/**
 * The season-driven target list: who to email this month and what to say to them.
 *
 * This is the engine's actual edge over a bought list. A roofer contacted in March is
 * being offered material money before the season. The same roofer contacted in October
 * is being offered a bailout. Same business, same message, opposite response rate.
 */
export function monthlyTargetList(
  prospects: readonly Prospect[],
  month: Month,
): { readonly inWindow: readonly ScoredProspect[]; readonly plain: string } {
  const needing = new Set(tradesNeedingCapital(month).map((t) => t.naics));
  const scored = prospects
    .filter((p) => needing.has(p.naics))
    .map((p) => scoreProspect(p, month))
    .filter((s) => s.tier !== 'decline')
    .sort((a, b) => b.intentScore - a.intentScore || a.concernScore - b.concernScore);

  const trades = tradesNeedingCapital(month).map((t) => t.name).join(', ');
  return {
    inWindow: scored,
    plain:
      `Month ${month}: ${scored.length} prospects inside a pre-season capital window. ` +
      `Trades in window: ${trades || 'none'}.`,
  };
}

export const PROSPECTING_RULES = {
  neverDone: [
    'An automated text to a mobile number without a matching, unrevoked written consent record.',
    'A commercial email without a physical postal address and a working opt-out.',
    'A synthetic avatar video that does not disclose that it is synthetic.',
    'Paying a tax preparer for the identity of a client whose revenue fell. That is IRC 7216, and it is criminal for the preparer.',
    'Obtaining a business’s financial condition from any source the business did not publish or consent to release.',
    'Treating desperation as a buying signal without scoring it separately as a credit signal.',
  ],
} as const;
