// ============================================================
// REAL ESTATE CAPITAL STACK ENGINE — one call, the whole stack.
//
// ## What this is, and why it exists
//
// The capital-stack logic is spread across five modules, each of which is
// the right size for what it does: `cycleEngine` holds the five mechanisms
// and the twenty-year simulation, `thresholds` holds every gate and the
// documented ways it moves, `sequenceOrderings` holds role fitness and the
// contract rules that make some orders illegal, `sequencePlanner` holds
// per-asset legality and the search, `sequenceArchetypes` holds the named
// shapes. That separation is correct and should not be collapsed.
//
// What was missing was a front door. A caller who wants "everything the
// capital stack knows about THIS household" had to import five modules and
// know the order to call them in. This is that front door: one `Situation`
// in, one `CapitalStack` out, with nothing new invented — every field is
// computed by the module that owns it.
//
// ## What it adds beyond re-export
//
// Three things the individual modules cannot answer alone:
//
//   1. `available` / `blocked` — which mechanisms this household can use at
//      all, with the reason for each refusal, derived by asking the planner
//      about the opening position rather than by reading a rule list.
//   2. `bindingThresholds` — of the fourteen gates, the ones that actually
//      bind THIS household, with the best documented variant for each. A
//      seasoning rule does not bind someone with no reserve to deploy.
//   3. `nearestArchetype` — the named shape this household most resembles,
//      scored on the situation fields rather than asserted.
//
// ## What it deliberately does not do
//
// It does not rank strategies (that is the genome's job), does not price
// anything (the provider records do), and does not decide. It reports what
// the stack permits, what gates it, and what the search found.
// ============================================================

import { MECHANISMS, type Mechanism, type MechanismId, simulateCycle, type CycleInput, type CycleResult } from './cycleEngine';
import { THRESHOLDS, bestVariant, type Threshold } from './thresholds';
import { ORDER_RULES, ROLE_FITNESS, type OrderRule } from './sequenceOrderings';
import {
  type Situation, type Plan, type MoveId, MOVES, move, initialState, refusal, legalMoves,
  rankPlans, enumeratePlans, describeSequence,
} from './sequencePlanner';
import { ARCHETYPES, type Archetype } from './sequenceArchetypes';

export type {
  Mechanism, MechanismId, CycleInput, CycleResult, Threshold, OrderRule,
  Situation, Plan, MoveId, Archetype,
};
export {
  MECHANISMS, simulateCycle, THRESHOLDS, ORDER_RULES, ROLE_FITNESS, MOVES,
  ARCHETYPES, rankPlans, enumeratePlans, describeSequence, refusal, legalMoves,
};

/** A mechanism this household cannot currently use, and the reason. */
export interface BlockedMechanism {
  readonly mechanism: MechanismId;
  /** Every move for this mechanism was refused; these are the reasons. */
  readonly reasons: readonly string[];
}

/** A gate that actually binds this household, with the best documented way down. */
export interface BindingThreshold {
  readonly id: string;
  readonly name: string;
  readonly mechanism: MechanismId;
  readonly standard: number;
  readonly unit: Threshold['unit'];
  /** The best legitimate variant, or the standard when none improves on it. */
  readonly best: number;
  readonly via: string;
  /** True when no variant exists — a statute or a counterparty's contract. */
  readonly fixed: boolean;
  readonly why: string;
}

export interface ArchetypeMatch {
  readonly archetype: Archetype;
  /** 0–100. How closely the household resembles this shape. */
  readonly closeness: number;
  /** The fields that matched and the fields that did not. */
  readonly matched: readonly string[];
  readonly differs: readonly string[];
}

export interface CapitalStack {
  readonly situation: Situation;
  /** Mechanisms with at least one legal opening move. */
  readonly available: readonly MechanismId[];
  readonly blocked: readonly BlockedMechanism[];
  /** Gates that bind a mechanism this household can actually reach. */
  readonly bindingThresholds: readonly BindingThreshold[];
  /** Count of legal plans at depth 4 — the size of the space, computed. */
  readonly legalPlanCount: number;
  /** Best plans against the household's stated goal. */
  readonly plans: readonly Plan[];
  readonly nearestArchetype: ArchetypeMatch | null;
  /** Every archetype scored, best first. */
  readonly archetypeMatches: readonly ArchetypeMatch[];
}

/** How closely a household resembles an archetype's preset situation. */
function matchArchetype(s: Situation, a: Archetype): ArchetypeMatch {
  const p = a.situation;
  const matched: string[] = [];
  const differs: string[] = [];
  let score = 0;
  let weight = 0;

  const band = (label: string, actual: number, preset: number, w: number, tolerance: number) => {
    weight += w;
    if (preset === 0 && actual === 0) { matched.push(label); score += w; return; }
    const scale = Math.max(Math.abs(preset), 1);
    const off = Math.abs(actual - preset) / scale;
    if (off <= tolerance) { matched.push(label); score += w * (1 - off / Math.max(tolerance, 1e-9)) ; }
    else differs.push(`${label} (${actual} vs ${preset})`);
  };
  const exact = (label: string, actual: unknown, preset: unknown, w: number) => {
    weight += w;
    if (actual === preset) { matched.push(label); score += w; }
    else differs.push(`${label} (${String(actual)} vs ${String(preset)})`);
  };

  // Rentals and goal carry the most weight: they are what separates the shapes.
  band('rentals', s.rentals, p.rentals, 3, 0.6);
  exact('goal', s.goal, p.goal, 3);
  exact('documentation', s.documentation, p.documentation, 2);
  band('surplus', s.monthlySurplus, p.monthlySurplus, 2, 0.7);
  band('reserve', s.reserve, p.reserve, 1, 1.0);
  band('rental LTV', s.avgRentalLtv, p.avgRentalLtv, 1, 0.5);
  exact('insurable', s.insurable, p.insurable, 1);
  exact('off-market access', s.offMarketAccess, p.offMarketAccess, 1);

  return {
    archetype: a,
    closeness: Math.round((score / Math.max(weight, 1)) * 100),
    matched,
    differs,
  };
}

/**
 * Everything the capital stack knows about one household.
 *
 * `depth` bounds the plan search; `top` bounds how many plans come back.
 * The legal-plan count is always taken at depth 4 so the number is
 * comparable across households.
 */
export function capitalStack(s: Situation, opts: { depth?: number; top?: number } = {}): CapitalStack {
  const st = initialState(s);

  // Which mechanisms have a legal opening move, and why the others do not.
  const legal = new Set(legalMoves(st, s).map((id) => move(id).mechanism));
  const available: MechanismId[] = [];
  const blocked: BlockedMechanism[] = [];
  for (const m of MECHANISMS) {
    if (legal.has(m.id)) { available.push(m.id); continue; }
    const reasons = MOVES.filter((mv) => mv.mechanism === m.id)
      .map((mv) => refusal(st, s, mv.id)?.reason)
      .filter((r): r is string => typeof r === 'string');
    blocked.push({ mechanism: m.id, reasons: Array.from(new Set(reasons)) });
  }

  // A threshold binds when it gates a mechanism the household can reach.
  const reachable = new Set(available);
  const bindingThresholds: BindingThreshold[] = THRESHOLDS
    .filter((t) => reachable.has(t.mechanism))
    .map((t) => {
      const b = bestVariant(t);
      return {
        id: t.id, name: t.name, mechanism: t.mechanism, standard: t.standard, unit: t.unit,
        best: b.value, via: b.via, fixed: Boolean(t.fixed),
        why: t.fixed ? t.fixed.reason : t.why,
      };
    });

  const archetypeMatches = ARCHETYPES.map((a) => matchArchetype(s, a))
    .sort((x, y) => y.closeness - x.closeness);

  return {
    situation: s,
    available,
    blocked,
    bindingThresholds,
    legalPlanCount: enumeratePlans(s, 4).count,
    plans: rankPlans(s, { depth: opts.depth ?? 8, width: 30, top: opts.top ?? 5 }),
    nearestArchetype: archetypeMatches[0] ?? null,
    archetypeMatches,
  };
}

/** A one-paragraph reading of the stack, for an advisor brief or an AI channel. */
export function describeStack(cs: CapitalStack): string {
  const near = cs.nearestArchetype;
  const parts: string[] = [];
  parts.push(
    `${cs.available.length} of ${MECHANISMS.length} mechanisms are open to this household; ` +
    `${cs.legalPlanCount.toLocaleString()} legal plans exist at four stages.`,
  );
  if (cs.blocked.length) {
    parts.push(
      `Closed: ${cs.blocked.map((b) => `${b.mechanism} (${b.reasons[0] ?? 'no legal move'})`).join('; ')}.`,
    );
  }
  const fixed = cs.bindingThresholds.filter((t) => t.fixed);
  if (fixed.length) parts.push(`${fixed.length} binding gate${fixed.length === 1 ? '' : 's'} cannot be moved: ${fixed.map((t) => t.name).join(', ')}.`);
  if (near) parts.push(`Closest named shape: ${near.archetype.name} at ${near.closeness}% — ${near.archetype.who}`);
  const best = cs.plans[0];
  if (best) parts.push(`Best plan against "${cs.situation.goal}": ${describeSequence(best.moves)}. ${best.verdict}`);
  return parts.join(' ');
}

export const CAPITAL_STACK_DISCLOSURE =
  'This is a façade over cycleEngine, thresholds, sequenceOrderings, sequencePlanner and sequenceArchetypes. It computes nothing of its own beyond which mechanisms are open, which gates bind, and which named shape the household most resembles; every other figure is produced by the module that owns it. Refusals carry the clause that causes them. Nothing here prices a product or ranks a strategy — the provider records and the genome do those.';
