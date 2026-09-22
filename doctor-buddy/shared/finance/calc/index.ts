import type { CalcDef, CalcCategory } from './core';
import { growthCalcs } from './growth';
import { retirementCalcs } from './retirement';
import { taxCalcs } from './tax';
import { debtCalcs } from './debt';
import { protectionCalcs } from './protection';
import { estateCalcs } from './estate';
import { businessCalcs } from './business';
import { realEstateCalcs } from './realestate';
import { indexedLifeCalcs } from './indexedLife';
import { wholeLifeCalcs } from './wholeLife';

export * from './core';

/** Every calculator on the site, in the order the hub lists them. */
export const ALL_CALCS: CalcDef[] = [
  ...indexedLifeCalcs,
  ...wholeLifeCalcs,
  ...retirementCalcs,
  ...taxCalcs,
  ...debtCalcs,
  ...protectionCalcs,
  ...estateCalcs,
  ...businessCalcs,
  ...realEstateCalcs,
  ...growthCalcs,
];

export const calcById = (id: string): CalcDef | undefined => ALL_CALCS.find(c => c.id === id);

export function calcsByCategory(): Array<{ category: CalcCategory; calcs: CalcDef[] }> {
  const map = new Map<CalcCategory, CalcDef[]>();
  for (const c of ALL_CALCS) {
    const list = map.get(c.category) ?? [];
    list.push(c);
    map.set(c.category, list);
  }
  return Array.from(map.entries()).map(([category, calcs]) => ({ category, calcs }));
}
