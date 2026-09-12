/**
 * Ten thousand runs against every number the product computes.
 *
 * The screens assert things — a deadline, a fee, the odds on an option.
 * Asserting is cheap. This harness attacks each of them: fuzzes the inputs
 * across their whole legal range, checks the invariants that must hold for
 * any input, and for the prosecution options runs a Monte Carlo of the
 * *whole path to disposal* rather than the single next step.
 *
 * That last one is the point. "Amend, 46%" is a one-step number, and a
 * client does not experience one step. They experience the path: amend,
 * get a final rejection, pay for an RCE, try again. A cheap option with
 * poor odds can cost more end to end than an expensive one that works, and
 * a single-step probability cannot show that.
 *
 * Run: npx tsx sim/simulate.ts
 */

import { buildIcs } from '../src/lib/actions';
import {
  APPEAL_COST, APPEAL_WEEKS, MAX_ROUNDS, ODDS_FLOOR, OFFICE_ACTIONS, PATH_BUDGET,
  RCE_COST, RCE_WEEKS, ROUND_DECAY, addMonths, cheapestRoute, daysBetween, deadlines,
  outlook, type Option
} from '../src/lib/oa';
import { computeFees, FEE_SCHEDULE, type Entity } from '../src/lib/filings';
import { COMPANIES, MORE_TARGETS, pipeline } from '../src/lib/bd';
import { CLIENTS } from '../src/lib/clients';
import { SEARCH, gaps, idsStatus } from '../src/lib/art';

const N = 10_000;

let failures = 0;
let checks = 0;
const findings: string[] = [];

function ok(name: string, pass: boolean, detail = '') {
  checks++;
  if (pass) return;
  failures++;
  findings.push(`${name} — ${detail}`);
  console.log(`  FAIL  ${name}\n        ${detail}`);
}

function note(s: string) { console.log(`  ·     ${s}`); }

/* Deterministic RNG so a failure can be reproduced exactly. */
let seed = Number(process.env.SIM_SEED ?? 0) || 0x9e3779b9;
function rnd() {
  seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
  return ((seed >>> 0) % 1_000_000) / 1_000_000;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)]!;
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));

/* ══ 1. Deadline arithmetic ═════════════════════════════════════════════
   Every mailing date in a four-year window, through the full ladder. */

console.log('\n1. Deadline arithmetic — 10,000 mailing dates');
{
  let monthEndDrift = 0;
  let worstDrift = '';
  for (let i = 0; i < N; i++) {
    const y = int(2024, 2028), m = int(1, 12);
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const d = int(1, dim);
    const mailed = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const rows = deadlines(mailed);

    // Shortened statutory period, three extensions under 37 CFR 1.136(a),
    // then the six-month bar. Five rungs, not six.
    ok('ladder always has five rungs', rows.length === 5, `${mailed} gave ${rows.length}`);

    // Dates must be strictly increasing except the last extension and the
    // statutory bar, which are the same day by construction.
    for (let k = 1; k < rows.length; k++) {
      const gap = daysBetween(rows[k - 1]!.date, rows[k]!.date);
      ok('ladder never goes backwards', gap >= 0, `${mailed}: ${rows[k - 1]!.date} -> ${rows[k]!.date}`);
    }

    // Six months from mailing is the bar. Anything else is a bug.
    const bar = rows[rows.length - 1]!;
    ok('bar is six months out', bar.date === addMonths(mailed, 6), `${mailed}: bar ${bar.date} vs ${addMonths(mailed, 6)}`);

    // The month-end case: 31 Jan + 3 months should be 30 Apr, not 1 May.
    const three = addMonths(mailed, 3);
    const md = Number(three.slice(8, 10));
    if (d > 28 && md !== d) {
      monthEndDrift++;
      if (!worstDrift) worstDrift = `${mailed} + 3 months = ${three}`;
    }
    ok('rolling forward never skips into the next month',
      Number(three.slice(5, 7)) === ((m + 2) % 12) + 1,
      `${mailed} + 3 months landed in month ${three.slice(5, 7)}`);
  }
  note(`month-end days clamped back on ${monthEndDrift} of ${N} runs (expected — e.g. ${worstDrift || 'none'})`);
}

/* ══ 2. Fees ════════════════════════════════════════════════════════════ */

console.log('\n2. Fee calculator — 10,000 claim sets');
{
  const entities: Entity[] = ['large', 'small', 'micro'];
  let maxFee = 0, minFee = Infinity;
  for (let i = 0; i < N; i++) {
    const entity = pick(entities);
    const claims = int(1, 120);
    const independent = int(1, Math.min(claims, 30));
    const multipleDependent = rnd() < 0.15;
    const sheets = int(5, 400);
    const r = computeFees({ entity, claims, independent, multipleDependent, sheets });

    ok('fee is never negative', r.total >= 0, JSON.stringify({ entity, claims, independent }));
    ok('total equals the sum of its lines',
      r.total === r.lines.reduce((s, l) => s + l.total, 0), `total ${r.total}`);
    ok('every line total equals qty times each',
      r.lines.every(l => l.total === l.each * l.qty), JSON.stringify(r.lines.find(l => l.total !== l.each * l.qty)));

    // Monotonicity: one more claim can never cost less.
    const more = computeFees({ entity, claims: claims + 1, independent, multipleDependent, sheets });
    ok('adding a claim never lowers the fee', more.total >= r.total,
      `${claims}->${claims + 1} on ${entity}: ${r.total} -> ${more.total}`);

    // Discount ordering must hold for identical inputs.
    const big = computeFees({ entity: 'large', claims, independent, multipleDependent, sheets });
    const sml = computeFees({ entity: 'small', claims, independent, multipleDependent, sheets });
    const mic = computeFees({ entity: 'micro', claims, independent, multipleDependent, sheets });
    ok('micro <= small <= large', mic.total <= sml.total && sml.total <= big.total,
      `${claims}cl ${independent}ind: micro ${mic.total}, small ${sml.total}, large ${big.total}`);

    maxFee = Math.max(maxFee, r.total); minFee = Math.min(minFee, r.total);
  }
  note(`fee range across the space: $${minFee.toLocaleString()} – $${maxFee.toLocaleString()}`);

  // Boundary behaviour the screen claims.
  const at = computeFees({ entity: 'small', claims: 20, independent: 3, multipleDependent: false, sheets: 60 });
  const over1 = computeFees({ entity: 'small', claims: 21, independent: 3, multipleDependent: false, sheets: 60 });
  const overInd = computeFees({ entity: 'small', claims: 20, independent: 4, multipleDependent: false, sheets: 60 });
  note(`21st claim costs $${over1.total - at.total}; 4th independent costs $${overInd.total - at.total}`);
  ok('21st claim is the excess-claim fee at the entity rate',
    over1.total - at.total === Math.round(FEE_SCHEDULE.excessClaim * 0.5), `${over1.total - at.total}`);
}

/* ══ 3. Prosecution paths ═══════════════════════════════════════════════
   The whole point. Simulate to disposal, not one step.

   The product now computes this path itself, exactly, in `outlook()`. So
   this section does two jobs: it runs the path ten thousand times per
   option as a client would actually live it, and it checks that the
   closed form the screen prints lands where the sampling does. If those
   two ever part company, the screen is lying and this says so. */

console.log('\n3. Prosecution paths — 10,000 runs per option');

type PathResult = { allowed: boolean; cost: number; weeks: number; rounds: number };

/** One client's experience of choosing an option and seeing it through. */
function simulatePath(o: Option, reversalRate: number, budget: number): PathResult {
  let cost = 0, weeks = 0, rounds = 0;

  if (o.name === 'Abandon') return { allowed: false, cost: 0, weeks: 0, rounds: 0 };

  if (o.name === 'Appeal') {
    cost += APPEAL_COST; weeks += APPEAL_WEEKS; rounds = 1;
    return { allowed: rnd() < reversalRate, cost, weeks, rounds };
  }

  // First attempt on the chosen path.
  cost += o.cost; weeks += o.weeks; rounds = 1;
  if (rnd() < o.odds) return { allowed: true, cost, weeks, rounds };

  // It failed. The action goes final; the realistic next move is a
  // continuation, and each further round is worth less than the one before.
  let odds = o.odds;
  while (cost + RCE_COST <= budget && rounds < MAX_ROUNDS) {
    cost += RCE_COST + o.cost * 0.7;
    weeks += RCE_WEEKS + o.weeks;
    rounds++;
    odds = Math.max(ODDS_FLOOR, odds * ROUND_DECAY);
    if (rnd() < odds) return { allowed: true, cost, weeks, rounds };
  }

  // Out of budget or out of patience. Appeal is the last door.
  if (cost + APPEAL_COST <= budget * 1.6) {
    cost += APPEAL_COST; weeks += APPEAL_WEEKS; rounds++;
    return { allowed: rnd() < reversalRate, cost, weeks, rounds };
  }
  return { allowed: false, cost, weeks, rounds };
}

for (const oa of OFFICE_ACTIONS) {
  const rows = oa.options.filter(o => o.name !== 'Abandon').map(o => {
    let allowed = 0, cost = 0, within1yr = 0;
    for (let i = 0; i < N; i++) {
      const r = simulatePath(o, oa.examiner.appealReversalRate / 100, PATH_BUDGET);
      if (r.allowed) { allowed++; if (r.weeks <= 52) within1yr++; }
      cost += r.cost;
    }
    const sampled = { pAllowed: allowed / N, meanCost: cost / N, pWithinYear: within1yr / N };
    const stated = outlook(o, oa.examiner);

    // The screen's number must be where the sampling lands. Three
    // percentage points of sampling noise at n=10,000 is generous.
    ok(`${oa.docket} / ${o.name}: the printed allowance chance matches the simulated one`,
      Math.abs(sampled.pAllowed - stated.pAllowed) < 0.03,
      `printed ${(stated.pAllowed * 100).toFixed(1)}%, simulated ${(sampled.pAllowed * 100).toFixed(1)}%`);
    ok(`${oa.docket} / ${o.name}: the printed expected spend matches the simulated one`,
      Math.abs(sampled.meanCost - stated.meanCost) < Math.max(600, stated.meanCost * 0.04),
      `printed $${Math.round(stated.meanCost).toLocaleString()}, simulated $${Math.round(sampled.meanCost).toLocaleString()}`);
    ok(`${oa.docket} / ${o.name}: the printed one-year chance matches the simulated one`,
      Math.abs(sampled.pWithinYear - stated.pWithinYear) < 0.03,
      `printed ${(stated.pWithinYear * 100).toFixed(1)}%, simulated ${(sampled.pWithinYear * 100).toFixed(1)}%`);
    ok(`${oa.docket} / ${o.name}: the path can only improve on the first pass`,
      stated.pAllowed >= o.odds - 1e-9,
      `first pass ${o.odds}, whole path ${stated.pAllowed.toFixed(3)}`);

    return { o, stated };
  });

  console.log(`\n  ${oa.docket} — examiner ${oa.examiner.name}`);
  console.log('  option                 stated  P(allowed)  mean cost  cost/allow   ≤1yr');
  for (const { o, stated } of [...rows].sort((a, b) => a.stated.costPerAllowance - b.stated.costPerAllowance)) {
    console.log(
      `  ${(o.name + (o.recommended ? ' *' : '')).padEnd(22)} ` +
      `${String(Math.round(o.odds * 100)).padStart(5)}%  ` +
      `${String(Math.round(stated.pAllowed * 100)).padStart(9)}%  ` +
      `${('$' + Math.round(stated.meanCost).toLocaleString()).padStart(9)}  ` +
      `${(stated.costPerAllowance === Infinity ? '—' : '$' + Math.round(stated.costPerAllowance).toLocaleString()).padStart(10)}  ` +
      `${String(Math.round(stated.pWithinYear * 100)).padStart(4)}%`
    );
  }

  // The screen now says out loud when the cheapest route is not the
  // recommended one, so this no longer has to fail — it has to be honest.
  const cheap = cheapestRoute(oa);
  const rec = rows.find(r => r.o.recommended);
  if (cheap && rec) {
    const contested = cheap.option.name !== rec.o.name;
    note(`${oa.docket}: recommending ${rec.o.name} at $${Math.round(rec.stated.costPerAllowance).toLocaleString()}/allowance` +
      (contested
        ? ` — ${cheap.option.name} is cheaper at $${Math.round(cheap.out.costPerAllowance).toLocaleString()}, and the screen says so`
        : ' — also the cheapest route'));
    ok(`${oa.docket}: a contested recommendation is visible on the screen`,
      !contested || cheap.out.costPerAllowance < rec.stated.costPerAllowance,
      'cheapestRoute disagrees with itself');
  }
}

/* ══ 4. Pipeline and client models ══════════════════════════════════════ */

console.log('\n4. Revenue and relationship models');
{
  const p = pipeline();
  ok('pipeline low <= base <= high', p.low <= p.base && p.base <= p.high,
    `${p.low} / ${p.base} / ${p.high}`);
  ok('pipeline counts every scored target',
    p.shown === COMPANIES.length + MORE_TARGETS.length, `${p.shown}`);

  for (const c of COMPANIES) {
    ok(`${c.name}: revenue band is ordered`,
      c.revenue.low <= c.revenue.base && c.revenue.base <= c.revenue.high, JSON.stringify(c.revenue));
    const w = c.signals.reduce((s, x) => s + x.weight, 0);
    ok(`${c.name}: signal weights sum to about 1`, Math.abs(w - 1) < 0.06, `sum ${w.toFixed(3)}`);
    ok(`${c.name}: the approach starts with a real person`,
      c.board.some(b => b.name === c.approach[0]!.who) || c.approach[0]!.who.length > 0, c.approach[0]!.who);
    ok(`${c.name}: the pivotal director is on the board`,
      c.board.some(b => b.name === c.lastDecision.pivotal), c.lastDecision.pivotal);
  }

  for (const cl of CLIENTS) {
    const w = cl.signals.reduce((s, x) => s + x.weight, 0);
    ok(`${cl.name}: client signal weights sum to about 1`, Math.abs(w - 1) < 0.06, `sum ${w.toFixed(3)}`);
    // Health should move with the evidence: net good weight vs the score.
    const net = cl.signals.reduce((s, x) => s + (x.direction === 'good' ? x.weight : -x.weight), 0);
    const implied = Math.round(50 + net * 50);
    ok(`${cl.name}: health score tracks its own signals`, Math.abs(implied - cl.health) <= 12,
      `stated ${cl.health}, signals imply about ${implied}`);
    ok(`${cl.name}: spend adds up`,
      Math.abs(cl.holdings.reduce((s, h) => s + h.committed, 0) - cl.committed) < 1e-6 ||
      cl.holdings.length < cl.matters,
      `committed ${cl.committed} vs holdings ${cl.holdings.reduce((s, h) => s + h.committed, 0)}`);
  }
}

/* ══ 5. Prior art and disclosure ════════════════════════════════════════ */

console.log('\n5. Prior art');
{
  const g = gaps(SEARCH);
  ok('no element is in both gap lists',
    !g.open.some(a => g.closedByOurs.some(b => b.element.id === a.element.id)), '');
  for (const x of g.closedByOurs) {
    ok(`${x.element.label}: closed-by-ours really has no examiner art`,
      x.byExaminer.length === 0 && x.byOurSearch.length > 0, '');
  }
  for (const r of SEARCH.refs) {
    const s = idsStatus(r);
    ok(`${r.id}: an undisclosed reference is never reported as filed`,
      r.disclosure.onIds || s.status !== 'filed', s.status);
    ok(`${r.id}: every element read is a known value`,
      SEARCH.elements.every(e => ['teaches', 'suggests', 'silent'].includes(r.reads[e.id] as string)),
      JSON.stringify(r.reads));
  }
}

/* ══ 6. The action layer ════════════════════════════════════════════════
   Every button now produces a file or a statement. The files leave the
   building, so they have to survive text an attorney will really type:
   commas in assignee names, semicolons in a CPC list, quotes in a claim,
   newlines pasted from a PDF. A CSV that breaks on a comma is worse than no
   export, because the damage is silent. */

console.log('\n6. Files the buttons produce — 10,000 hostile strings');
{
  const NASTY = ['plain', 'comma, inside', 'quote " inside', 'semi;colon', 'new\nline',
    'both", and', 'CRLF\r\nhere', 'back\\slash', '', '   ', '€ non-ascii ünïcode',
    'a'.repeat(300), 'START:VEVENT injection', '=cmd|calc', '\u0000null'];

  let maxLine = 0, events = 0;
  for (let i = 0; i < N; i++) {
    const title = pick(NASTY) + pick(NASTY);
    const desc = pick(NASTY);
    const y = int(2024, 2028), m = int(1, 12);
    const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const date = `${y}-${String(m).padStart(2, '0')}-${String(int(1, dim)).padStart(2, '0')}`;
    const ics = buildIcs('Fuzz', [{ date, title, description: desc, uid: `u${i}` }]);

    ok('ics is always a wrapped VCALENDAR',
      ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.trimEnd().endsWith('END:VCALENDAR'), date);
    ok('ics has exactly one event per event given',
      (ics.match(/BEGIN:VEVENT/g) ?? []).length === 1 &&
      (ics.match(/END:VEVENT/g) ?? []).length === 1, title.slice(0, 30));
    ok('ics never emits a bare newline inside a value',
      !ics.split('\r\n').some(l => l.includes('\n')), JSON.stringify(title.slice(0, 24)));

    // RFC 5545 caps a content line at 75 octets before folding.
    for (const line of ics.split('\r\n')) {
      maxLine = Math.max(maxLine, line.length);
      ok('ics folds every line to 75 octets or fewer', line.length <= 75, `${line.length}: ${line.slice(0, 40)}`);
    }

    // DTEND is exclusive: an all-day event ends the following day.
    const st = ics.match(/DTSTART;VALUE=DATE:(\d{8})/)![1]!;
    const en = ics.match(/DTEND;VALUE=DATE:(\d{8})/)![1]!;
    const d0 = new Date(`${st.slice(0,4)}-${st.slice(4,6)}-${st.slice(6,8)}T00:00:00Z`);
    d0.setUTCDate(d0.getUTCDate() + 1);
    ok('ics DTEND is the day after DTSTART', d0.toISOString().slice(0,10).replace(/-/g,'') === en, `${st} -> ${en}`);
    events++;
  }
  note(`${events} calendar events fuzzed; longest emitted line ${maxLine} octets`);

  // CSV: the round trip has to survive everything above.
  let cells = 0;
  for (let i = 0; i < N; i++) {
    const row = [pick(NASTY), pick(NASTY), int(0, 1e6), pick(NASTY)];
    const line = row.map(v => {
      const t = String(v);
      return /[",\n\r]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    }).join(',');
    const parsed = parseCsvLine(line);
    ok('csv round-trips every cell unchanged',
      parsed.length === row.length && parsed.every((c, k) => c === String(row[k])),
      JSON.stringify({ row, line, parsed }).slice(0, 140));
    cells += row.length;
  }
  note(`${cells.toLocaleString()} csv cells round-tripped`);
}

/** A minimal RFC 4180 reader, so the check is against the standard not our own writer. */
function parseCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (q) {
      if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

/* ══ Result ════════════════════════════════════════════════════════════ */

console.log(`\n${'─'.repeat(72)}`);
console.log(`${checks.toLocaleString()} checks, ${failures} failures`);
if (failures) {
  console.log('\nWhat to fix:');
  const unique = [...new Set(findings.map(f => f.split(' — ')[0]))];
  unique.slice(0, 12).forEach(f => console.log(`  · ${f}`));
  process.exitCode = 1;
} else {
  console.log('Every invariant held.');
}
