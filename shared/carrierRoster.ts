/**
 * The carrier roster: every company the firm writes with, under the owner's
 * short codes (owner's instruction, 23 Sep 2026):
 *
 *   S   Securian (Minnesota Life)      N   Nationwide
 *   SY  Symetra                        LF  Lafayette Life
 *   MT  Mutual Trust Life              PC  Pacific Life
 *   AR  Ameritas                       MO  Mutual of Omaha
 *
 * One row per carrier, saying what the platform holds for it today and what
 * it does not. Nothing here is typed from memory: a cost structure comes from
 * the carrier's own cost summary (shared/costStructure.ts), loan terms from
 * its own illustration (shared/policyLoanMechanics.ts), ratings from its own
 * site (shared/mutualIulCarriers.ts). A carrier with none of those yet is
 * listed as pending, and the assistant sessions studying illustrations fill
 * it in by adding the source, not by editing this file's status by hand: the
 * status below is computed from what the other modules actually hold.
 */
import { COMPLETE_BASELINES, PENDING_BASELINES } from "./costStructure";
import { CARRIER_LOAN_PROFILES, type CarrierLoanProfile } from "./policyLoanMechanics";
import { MUTUAL_IUL_CARRIERS } from "./mutualIulCarriers";

export type CarrierCode = "S" | "N" | "SY" | "LF" | "MT" | "PC" | "AR" | "MO";

type RosterSeed = {
  code: CarrierCode;
  name: string;
  /** The cost-structure id, when the cost machine has or expects one. */
  costId?: string;
  /** How the loan engine names the carrier in CARRIER_LOAN_PROFILES. */
  loanCarrier?: string;
  /** The id in the ratings registry (MUTUAL_IUL_CARRIERS), when listed there. */
  ratingsId?: string;
};

const SEEDS: readonly RosterSeed[] = [
  { code: "S", name: "Securian (Minnesota Life)", costId: "mutual-s", loanCarrier: "Securian / Minnesota Life", ratingsId: "securian" },
  { code: "N", name: "Nationwide", costId: "mutual-n", loanCarrier: "Nationwide", ratingsId: "nationwide" },
  { code: "SY", name: "Symetra" },
  { code: "LF", name: "Lafayette Life", loanCarrier: "Lafayette Life" },
  { code: "MT", name: "Mutual Trust Life" },
  { code: "PC", name: "Pacific Life", costId: "mutual-pc", loanCarrier: "Pacific Life", ratingsId: "pacific-life" },
  { code: "AR", name: "Ameritas", ratingsId: "ameritas" },
  { code: "MO", name: "Mutual of Omaha", ratingsId: "mutual-of-omaha" },
];

export type HoldingStatus = "held" | "pending";

export interface CarrierRosterRow {
  code: CarrierCode;
  /** "Mutual Company S", the label every page uses. */
  label: string;
  name: string;
  /** Cost structure read off the carrier's own cost summary. */
  costStructure: { status: HoldingStatus; product: string | null; source: string | null };
  /** Loan terms read off the carrier's own illustration. */
  loanTerms: {
    status: HoldingStatus;
    product: string | null;
    kind: CarrierLoanProfile["kind"] | null;
    declaredCharged: string | null;
    declaredCredited: string | null;
    participatingCharged: string | null;
    participatingCredited: string | null;
    notes: readonly string[];
    source: string | null;
    asOf: string | null;
  };
  /** Financial-strength ratings read off the carrier's own site. */
  ratings: { status: HoldingStatus; count: number };
}

export function carrierLabel(code: CarrierCode): string {
  return `Mutual Company ${code}`;
}

function buildRow(seed: RosterSeed): CarrierRosterRow {
  const cost = seed.costId ? COMPLETE_BASELINES.find(b => b.carrierId === seed.costId) : undefined;
  const loan = seed.loanCarrier ? CARRIER_LOAN_PROFILES.find(p => p.carrier === seed.loanCarrier) : undefined;
  // A loan profile whose rate table is absent from the document (Pacific Life's
  // illustration runs no distributions) is not held terms, however full its notes.
  const loanHeld = Boolean(loan && loan.declaredCharged);
  const ratings = seed.ratingsId ? MUTUAL_IUL_CARRIERS.find(c => c.id === seed.ratingsId) : undefined;
  const verifiedRatings = ratings ? ratings.ratings.filter(r => r.verified).length : 0;
  return {
    code: seed.code,
    label: carrierLabel(seed.code),
    name: seed.name,
    costStructure: {
      status: cost ? "held" : "pending",
      product: cost?.product ?? null,
      source: cost?.source ?? null,
    },
    loanTerms: {
      status: loanHeld ? "held" : "pending",
      product: loan?.product ?? null,
      kind: loan?.kind ?? null,
      declaredCharged: loan?.declaredCharged ?? null,
      declaredCredited: loan?.declaredCredited ?? null,
      participatingCharged: loan?.participatingCharged ?? null,
      participatingCredited: loan?.participatingCredited ?? null,
      notes: loan?.notes ?? [],
      source: loan?.source ?? null,
      asOf: loan?.asOf ?? null,
    },
    ratings: { status: verifiedRatings > 0 ? "held" : "pending", count: verifiedRatings },
  };
}

export const CARRIER_ROSTER: readonly CarrierRosterRow[] = SEEDS.map(buildRow);

export function carrierByCode(code: CarrierCode): CarrierRosterRow | undefined {
  return CARRIER_ROSTER.find(r => r.code === code);
}

/** Cost baselines expected but not yet read, by roster code. */
export const PENDING_COST_CODES: readonly CarrierCode[] = SEEDS.filter(
  s => s.costId && PENDING_BASELINES.some(p => p.carrierId === s.costId),
).map(s => s.code);

/** Where each carrier's figures come from, for the app shell's source footer. */
export const CARRIER_ROSTER_SOURCES: readonly { label: string; asOf?: string }[] = CARRIER_ROSTER.flatMap(r => [
  ...(r.costStructure.source ? [{ label: `${r.label} cost structure: ${r.costStructure.source}` }] : []),
  ...(r.loanTerms.source ? [{ label: `${r.label} loan terms: ${r.loanTerms.source}`, asOf: r.loanTerms.asOf ?? undefined }] : []),
]);
