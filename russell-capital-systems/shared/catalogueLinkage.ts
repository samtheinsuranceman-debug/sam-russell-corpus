// ============================================================
// CATALOGUE ↔ MEMORY BANK LINKAGE — computed, not hand-set.
//
// WHY. `CalculatorEntry.engine` names the module behind a page and
// `MemoryGroup.modules` names the modules a brain group covers, but nothing
// joins them: `wired` on a group is a hand-typed boolean and a catalogue entry
// has no `memoryGroup`. The interop audit found the join is implicit and
// covers 37 of 116 entries. This module computes the join from the two
// registries so the number is measured every build, and `unlinkedEntries()`
// lists the pages the advisor can point at but no brain group knows.
// ============================================================
import { CALCULATORS, type CalculatorEntry } from "./calculatorCatalog";
import { MEMORY_GROUPS, type MemoryGroup } from "./aiMemoryBank";

export interface CatalogueLink {
  path: string;
  engine?: string;
  /** Ids of the memory groups whose modules include this entry's engine. */
  memoryGroups: string[];
}

export function catalogueLinkage(
  entries: readonly CalculatorEntry[] = CALCULATORS,
  groups: readonly MemoryGroup[] = MEMORY_GROUPS,
): CatalogueLink[] {
  const byModule = new Map<string, string[]>();
  for (const g of groups) for (const m of g.modules) byModule.set(m, [...(byModule.get(m) ?? []), g.id]);
  return entries.map(e => ({ path: e.path, engine: e.engine, memoryGroups: e.engine ? byModule.get(e.engine) ?? [] : [] }));
}

/** Entries with an engine that no memory group covers: the brain cannot reason about their figures. */
export function unlinkedEntries(entries?: readonly CalculatorEntry[], groups?: readonly MemoryGroup[]): CatalogueLink[] {
  return catalogueLinkage(entries, groups).filter(l => l.engine && l.memoryGroups.length === 0);
}

/** Entries with no engine at all: the page's maths is not in a shared module. */
export function engineless(entries: readonly CalculatorEntry[] = CALCULATORS): CalculatorEntry[] {
  return entries.filter(e => !e.engine);
}

/** A group is wired only if at least one catalogue entry reaches it: the computed replacement for the hand-set flag. */
export function computedWired(groups: readonly MemoryGroup[] = MEMORY_GROUPS, entries: readonly CalculatorEntry[] = CALCULATORS): Record<string, boolean> {
  const reached = new Set(catalogueLinkage(entries, groups).flatMap(l => l.memoryGroups));
  return Object.fromEntries(groups.map(g => [g.id, reached.has(g.id)]));
}

export function linkageSummary(entries?: readonly CalculatorEntry[], groups?: readonly MemoryGroup[]) {
  const links = catalogueLinkage(entries, groups);
  const withEngine = links.filter(l => l.engine);
  const linked = withEngine.filter(l => l.memoryGroups.length > 0);
  return { entries: links.length, withEngine: withEngine.length, linkedToAGroup: linked.length, unlinked: withEngine.length - linked.length, engineless: links.length - withEngine.length };
}
