// ============================================================
// THE IUL ENGINE'S LINKS — tRPC. CPI and M2 from FRED beside the
// backtester's credited history for the chosen index account; the
// tax-equivalent yield at the client's marginal rate; the liquidity
// contrast and the crediting note as text.
// ============================================================
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getFactFinderForUser } from "./factFinderDb";
import { fetchFredObservationsSince } from "./_core/fred";
import { marginalFromBracket } from "./inheritanceRouter";
import { ALL_INDEX_OPTIONS, MAX_YEAR, MIN_YEAR, getCreditingHistory } from "@shared/indexCreditingData";
import { ACCOUNT_VALUE_CREDITING, CORRELATION_CAVEAT, IUL_LINK_SOURCES, LIQUIDITY_CONTRAST, decemberOverDecember, pairYears, splitByMedian, taxEquivalentYield } from "@shared/iulLinks";

let macroMemo: { at: number; value: { cpi: Record<number, number>; m2: Record<number, number>; cpiAsOf: string | null; m2AsOf: string | null } } | null = null;
async function macro(env: NodeJS.ProcessEnv = process.env) {
  if (macroMemo && Date.now() - macroMemo.at < 6 * 60 * 60 * 1000) return macroMemo.value;
  const read = async (id: string) => { try { const obs = await fetchFredObservationsSince(id, `${MIN_YEAR - 1}-01-01`, env); return { yoy: decemberOverDecember(obs), asOf: obs[obs.length - 1]?.date ?? null }; } catch { return { yoy: {}, asOf: null }; } };
  const [c, m] = await Promise.all([read("CPIAUCSL"), read("M2SL")]);
  macroMemo = { at: Date.now(), value: { cpi: c.yoy, m2: m.yoy, cpiAsOf: c.asOf, m2AsOf: m.asOf } };
  return macroMemo.value;
}
export function _clearIulLinksMemoForTests() { macroMemo = null; }

const MARGINAL_ROWS = [0.22, 0.24, 0.32, 0.35, 0.37];

export const iulLinksRouter = router({
  /** The record: each index account's credited rate by year beside CPI and M2, with the split and the correlation. Public: no client data. */
  history: publicProcedure.input(z.object({ optionId: z.string().max(60).optional() }).default({})).query(async ({ input }) => {
    const opt = ALL_INDEX_OPTIONS.find((o) => o.id === input.optionId) ?? ALL_INDEX_OPTIONS[0]!;
    const mac = await macro();
    const credited = getCreditingHistory(opt, Math.max(MIN_YEAR, opt.availableFrom), MAX_YEAR);
    const pairs = pairYears(credited, mac.cpi, mac.m2);
    const avg = credited.length ? credited.reduce((s, h) => s + h.creditedRate, 0) / credited.length / 100 : 0;
    const last10 = credited.slice(-10);
    const avg10 = last10.length ? last10.reduce((s, h) => s + h.creditedRate, 0) / last10.length / 100 : 0;
    return {
      option: { id: opt.id, name: opt.name, carrier: opt.carrier, cap: opt.cap, floor: opt.floor, participation: opt.participation, availableFrom: opt.availableFrom, description: opt.description },
      options: ALL_INDEX_OPTIONS.map((o) => ({ id: o.id, name: o.name, carrier: o.carrier })),
      pairs, averages: { record: avg, last10: avg10, years: credited.length },
      cpi: splitByMedian(pairs, "cpi"), m2: splitByMedian(pairs, "m2"), asOf: { cpi: mac.cpiAsOf, m2: mac.m2AsOf },
      caveat: CORRELATION_CAVEAT, liquidity: LIQUIDITY_CONTRAST, crediting: ACCOUNT_VALUE_CREDITING, sources: IUL_LINK_SOURCES,
    };
  }),

  /** The tax-equivalent table for the signed-in client: their marginal rate from the Fact Finder, plus the standard rows. */
  taxEquivalent: protectedProcedure.input(z.object({ rate: z.number().min(0).max(1), stateRate: z.number().min(0).max(0.2).default(0), niit: z.boolean().default(false) })).query(async ({ ctx, input }) => {
    const ff = await getFactFinderForUser(ctx.user.id).catch(() => null);
    const data = ff?.data as { sections?: Record<string, Record<string, unknown>> } | undefined;
    const mine = marginalFromBracket(data?.sections?.taxes?.marginalBracket);
    const niitRate = input.niit ? 0.038 : 0;
    const rows = Array.from(new Set([...MARGINAL_ROWS, ...(mine != null ? [mine] : [])])).sort((a, b) => a - b).map((m) => ({ marginalRate: m, mine: m === mine, taxable: taxEquivalentYield(input.rate, m, input.stateRate, niitRate) }));
    return { rate: input.rate, mine, stateRate: input.stateRate, niitRate, rows, note: "Tax-equivalent yield = credited rate ÷ (1 − marginal − state − net investment income tax). It is the return a taxable account would need to keep the same amount after tax; it says nothing about which account grows faster." };
  }),
});
