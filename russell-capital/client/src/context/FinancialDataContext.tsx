import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

/**
 * FinancialData — the single shared client dataset.
 *
 * Known canonical fields are listed for editor autocomplete, but the index
 * signature lets any tool read/write its own keys too. Enter a value once on
 * any page and every nested tool that uses the same canonical key sees it.
 */
export interface FinancialData {
  currentAge?: number;
  retirementAge?: number;
  annualIncome?: number;
  currentTaxBracket?: number; // percentage, e.g. 37
  retirementTaxBracket?: number; // percentage
  traditionalIRABalance?: number;
  filingStatus?: string;
  projectionYears?: number;
  growthRate?: number; // percentage
  liquidAssets?: number;
  totalDebt?: number;
  [key: string]: unknown;
}

interface FinancialDataContextValue {
  data: FinancialData;
  setField: (key: string, value: unknown) => void;
  setMany: (patch: Partial<FinancialData>) => void;
  reset: () => void;
}

const STORAGE_KEY = "rcs.financialData.v1";

function loadInitial(): FinancialData {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as FinancialData;
    }
  } catch {
    /* ignore corrupt/unavailable storage */
  }
  return {};
}

const FinancialDataContext = createContext<FinancialDataContextValue | null>(null);

export function FinancialDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FinancialData>(loadInitial);

  // Persist so the dataset survives navigation and refreshes within a session.
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      /* ignore */
    }
  }, [data]);

  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  const setMany = useCallback((patch: Partial<FinancialData>) => {
    setData((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => setData({}), []);

  return (
    <FinancialDataContext.Provider value={{ data, setField, setMany, reset }}>
      {children}
    </FinancialDataContext.Provider>
  );
}

/** Access the whole shared dataset and its mutators. */
export function useFinancialData(): FinancialDataContextValue {
  const ctx = useContext(FinancialDataContext);
  if (!ctx) {
    // Safe fallback if a tool renders outside the provider (e.g. isolated tests):
    // behaves like local-only state so the page still works.
    const [local, setLocal] = useState<FinancialData>({});
    return {
      data: local,
      setField: (k, v) => setLocal((p) => ({ ...p, [k]: v })),
      setMany: (patch) => setLocal((p) => ({ ...p, ...patch })),
      reset: () => setLocal({}),
    };
  }
  return ctx;
}

/**
 * useSharedField — a DROP-IN replacement for useState that is backed by the
 * shared FinancialData store. Same [value, setValue] tuple contract as
 * useState, so converting a page is a one-line change:
 *
 *   const [income, setIncome] = useState(100000);
 *   // becomes
 *   const [income, setIncome] = useSharedField("annualIncome", 100000);
 *
 * Every tool using the same key stays in sync automatically.
 */
export function useSharedField<T>(
  key: string,
  fallback: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const { data, setField } = useFinancialData();
  const value = (data[key] === undefined ? fallback : (data[key] as T));
  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(value)
          : next;
      setField(key, resolved);
    },
    [key, value, setField],
  );
  return [value, setValue];
}
