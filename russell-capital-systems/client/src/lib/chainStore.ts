// The client-side chain: the row of calculators, each step's hand-off, the
// macro toggles and the profile the builder runs against. Kept in
// localStorage so a step added from any calculator page is waiting in the
// builder. A window event lets the dock and the builder stay in sync.
import { defaultChain, newStep, type ChainCalculatorId, type ChainStep } from "@shared/chainEngine";
import { defaultMacro, type MacroAssumptions } from "@shared/macroEngine";
import type { ClientProfile } from "@shared/ultraEngine";

export const CHAIN_STORE_KEY = "rcs_chain_v1";
export const CHAIN_EVENT = "rcs-chain-changed";

export type ChainStore = {
  steps: ChainStep[];
  macro: MacroAssumptions;
  /** A profile the client typed in the builder; null = derive from the shared fact finder. */
  profileOverride: ClientProfile | null;
  savedAt: number;
};

export function loadChain(): ChainStore {
  try {
    const raw = localStorage.getItem(CHAIN_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ChainStore>;
      if (Array.isArray(parsed.steps) && parsed.steps.length) {
        return { steps: parsed.steps, macro: { ...defaultMacro(), ...(parsed.macro ?? {}) }, profileOverride: parsed.profileOverride ?? null, savedAt: parsed.savedAt ?? 0 };
      }
    }
  } catch { /* private mode or corrupt value: start fresh */ }
  return { steps: defaultChain(), macro: defaultMacro(), profileOverride: null, savedAt: 0 };
}

export function saveChain(store: ChainStore): void {
  try { localStorage.setItem(CHAIN_STORE_KEY, JSON.stringify({ ...store, savedAt: Date.now() })); } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent(CHAIN_EVENT)); } catch { /* ignore */ }
}

export function updateChain(fn: (s: ChainStore) => ChainStore): ChainStore {
  const next = fn(loadChain());
  saveChain(next);
  return next;
}

export function addStep(calculator: ChainCalculatorId, years = 10, handoff?: Partial<ChainStep["handoff"]>): ChainStep {
  let step!: ChainStep;
  updateChain((s) => {
    step = newStep(calculator, years, undefined, { seed: s.steps.length + 1, taken: s.steps.map((x) => x.id) });
    if (handoff) step.handoff = { ...step.handoff, ...handoff };
    return { ...s, steps: [...s.steps, step] };
  });
  return step;
}

export function removeStep(id: string): void {
  updateChain((s) => ({ ...s, steps: s.steps.filter((x) => x.id !== id) }));
}

export function moveStep(id: string, dir: -1 | 1): void {
  updateChain((s) => {
    const i = s.steps.findIndex((x) => x.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= s.steps.length) return s;
    const steps = [...s.steps];
    [steps[i], steps[j]] = [steps[j], steps[i]];
    return { ...s, steps };
  });
}

export function patchStep(id: string, patch: Partial<ChainStep>): void {
  updateChain((s) => ({ ...s, steps: s.steps.map((x) => (x.id === id ? { ...x, ...patch, handoff: { ...x.handoff, ...(patch.handoff ?? {}) }, params: { ...(x.params ?? {}), ...(patch.params ?? {}) } } : x)) }));
}

export function resetChain(): void {
  saveChain({ steps: defaultChain(), macro: defaultMacro(), profileOverride: null, savedAt: 0 });
}
