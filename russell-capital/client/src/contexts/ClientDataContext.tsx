import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Normalized client data shape that all calculators can consume.
 * Fields map to both the clients table and the household_fact_finders table.
 */
export interface ClientFactFinderData {
  // Identity
  clientId: number;
  clientName: string;
  email: string;
  phone: string;
  // Personal
  age: number;
  state: string;
  filingStatus: "single" | "joint" | "hoh";
  spouseName: string;
  spouseAge: number;
  dependents: number;
  // Income
  annualIncome: number;
  spouseIncome: number;
  monthlyExpenses: number;
  // Assets
  cashSavings: number;
  taxableInvestments: number;
  realEstateEquity: number;
  homeValue: number;
  // Retirement
  iraBalance: number;
  rothBalance: number;
  k401Balance: number;
  pensionIncome: number;
  socialSecurityEstimate: number;
  // Insurance
  lifeInsuranceCv: number;
  lifeInsuranceDb: number;
  annualPremium: number;
  annuityValue: number;
  hasLTC: boolean;
  // Debt
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalMortgageInterest: number;
  otherDebt: number;
  // School Debt
  schoolDebt: number;
  schoolInterestRate: number;
  spouseSchoolDebt: number;
  spouseSchoolInterestRate: number;
  // HELOC
  helocRate: number;
  helocMaxLtv: number;
  // Goals
  retirementAge: number;
  annualIncomeNeeded: number;
  legacyGoal: number;
  riskTolerance: number;
  // Children & Grandchildren (from household fact finder)
  children: Array<{
    id: string; name: string; age: number; income: number;
    ira: number; rothIra: number; cash: number;
    homeValue: number; homeEquity: number;
    mortgageBalance: number; mortgageRate: number; mortgageYearsLeft: number; totalInterest: number;
    schoolDebt: number; schoolInterestRate: number;
  }>;
  grandchildren: Array<{
    id: string; name: string; age: number; parentId: string;
    homeValue: number; homeEquity: number;
    mortgageBalance: number; mortgageRate: number; mortgageYearsLeft: number; totalInterest: number;
  }>;
}

interface ClientDataContextType {
  /** Currently selected client ID (persisted in localStorage) */
  selectedClientId: number | null;
  /** Set the active client — triggers data reload */
  setSelectedClientId: (id: number | null) => void;
  /** The merged Fact Finder data for the selected client */
  data: ClientFactFinderData | null;
  /** Whether data is currently loading */
  loading: boolean;
  /** All available clients for the selector */
  clients: Array<{ id: number; name: string }>;
  /** Whether clients list is loading */
  clientsLoading: boolean;
}

const ClientDataContext = createContext<ClientDataContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
  data: null,
  loading: false,
  clients: [],
  clientsLoading: false,
});

const STORAGE_KEY = "rc_selected_client_id";

function n(v: any): number {
  if (v === null || v === undefined) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

export function ClientDataProvider({ children: childrenProp }: { children: ReactNode }) {
  // Use shared auth hook — single source of truth, no duplicate trpc.auth.me query
  const { isAuthenticated } = useAuth();

  const [selectedClientId, setSelectedClientIdRaw] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? Number(stored) : null;
    } catch { return null; }
  });

  const setSelectedClientId = useCallback((id: number | null) => {
    setSelectedClientIdRaw(id);
    try {
      if (id !== null) localStorage.setItem(STORAGE_KEY, String(id));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  // Fetch all clients for the selector (only when authenticated)
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 30_000, enabled: isAuthenticated, retry: false });
  const clientsList = (clientsQuery.data ?? [])
    .filter((c: any) => c.name.toLowerCase() !== "heather scenario")
    .map((c: any) => ({ id: c.id, name: c.name }));

  // Fetch the selected client's full record (only when authenticated)
  const clientQuery = trpc.clients.list.useQuery(undefined, {
    staleTime: 30_000,
    enabled: selectedClientId !== null && isAuthenticated,
    retry: false,
  });

  // Fetch the household fact finder for the selected client (only when authenticated)
  const factFinderQuery = trpc.household.getFactFinder.useQuery(
    { clientId: selectedClientId! },
    { enabled: selectedClientId !== null && isAuthenticated, staleTime: 30_000, retry: false }
  );

  // Parse notes field for extra data that the onboarding wizard stores there
  const parseNotesData = useCallback((notes: string | null | undefined) => {
    if (!notes) return {};
    const parsed: Record<string, any> = {};
    const patterns: [string, RegExp, (v: string) => any][] = [
      ["spouseName", /Spouse:\s*(.+?)\s*\(age/i, (v: string) => v.trim()],
      ["spouseAge", /\(age\s*(\d+)\)/i, (v: string) => Number(v)],
      ["dependents", /Dependents:\s*(\d+)/i, (v: string) => Number(v)],
      ["spouseIncome", /Spouse Income:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["monthlyExpenses", /Monthly Expenses:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["pensionIncome", /Pension:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["socialSecurityEstimate", /SS Estimate:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["lifeInsuranceDb", /Death Benefit:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["annuityValue", /Annuity Value:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["hasLTC", /Has LTC:\s*(true|false)/i, (v: string) => v.toLowerCase() === "true"],
      ["retirementAge", /Retirement Age:\s*(\d+)/i, (v: string) => Number(v)],
      ["annualIncomeNeeded", /Income Needed:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["legacyGoal", /Legacy Goal:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["riskTolerance", /Risk Tolerance:\s*(\d+)/i, (v: string) => Number(v)],
    ];
    for (const [key, regex, transform] of patterns) {
      const match = notes.match(regex);
      if (match) parsed[key] = transform(match[1]);
    }
    return parsed;
  }, []);

  // Merge client record + fact finder + notes into unified data
  const [data, setData] = useState<ClientFactFinderData | null>(null);
  const loading = (selectedClientId !== null) && (clientQuery.isLoading || factFinderQuery.isLoading);

  useEffect(() => {
    if (!selectedClientId || !clientQuery.data) {
      setData(null);
      return;
    }
    const client = (clientQuery.data as any[]).find((c: any) => c.id === selectedClientId);
    if (!client) { setData(null); return; }

    const ff = factFinderQuery.data as any;
    const notesData = parseNotesData(client.notes);

    const merged: ClientFactFinderData = {
      clientId: client.id,
      clientName: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      age: ff?.primaryAge ?? client.age ?? notesData.age ?? 50,
      state: client.state ?? "Texas",
      filingStatus: client.filingStatus ?? "joint",
      spouseName: ff?.spouseName ?? notesData.spouseName ?? "",
      spouseAge: ff?.spouseAge ?? notesData.spouseAge ?? 0,
      dependents: notesData.dependents ?? 0,
      annualIncome: n(ff?.primaryIncome ?? client.income ?? 0),
      spouseIncome: n(ff?.spouseIncome ?? notesData.spouseIncome ?? 0),
      monthlyExpenses: notesData.monthlyExpenses ?? 12000,
      cashSavings: n(ff?.primaryCash ?? 0),
      taxableInvestments: n(client.taxableAssets ?? 0),
      realEstateEquity: n(ff?.primaryHomeEquity ?? client.realEstateEquity ?? 0),
      homeValue: n(ff?.primaryHomeValue ?? 0),
      iraBalance: n(ff?.primaryIra ?? client.iraBalance ?? 0),
      rothBalance: n(ff?.primaryRothIra ?? client.rothBalance ?? 0),
      k401Balance: 0,
      pensionIncome: notesData.pensionIncome ?? 0,
      socialSecurityEstimate: notesData.socialSecurityEstimate ?? 3500,
      lifeInsuranceCv: n(client.lifeInsuranceCv ?? 0),
      lifeInsuranceDb: n(ff?.primaryDeathBenefit ?? notesData.lifeInsuranceDb ?? 0),
      annualPremium: n(ff?.primaryAnnualPremium ?? 0),
      annuityValue: notesData.annuityValue ?? 0,
      hasLTC: notesData.hasLTC ?? false,
      mortgageBalance: n(ff?.primaryMortgageBalance ?? 0),
      mortgageRate: n(ff?.primaryMortgageRate ?? 6.5),
      mortgageYearsLeft: ff?.primaryMortgageYearsLeft ?? 25,
      totalMortgageInterest: n(ff?.primaryTotalInterest ?? 0),
      otherDebt: 0,
      schoolDebt: n(ff?.primarySchoolDebt ?? 0),
      schoolInterestRate: n(ff?.primarySchoolInterestRate ?? 6.8),
      spouseSchoolDebt: n(ff?.spouseSchoolDebt ?? 0),
      spouseSchoolInterestRate: n(ff?.spouseSchoolInterestRate ?? 6.8),
      helocRate: n(ff?.helocRate ?? 8.5),
      helocMaxLtv: n(ff?.helocMaxLtv ?? 80),
      retirementAge: notesData.retirementAge ?? 65,
      annualIncomeNeeded: notesData.annualIncomeNeeded ?? 150000,
      legacyGoal: notesData.legacyGoal ?? 2000000,
      riskTolerance: notesData.riskTolerance ?? 5,
      children: (ff?.children as any[]) ?? [],
      grandchildren: (ff?.grandchildren as any[]) ?? [],
    };
    setData(merged);
  }, [selectedClientId, clientQuery.data, factFinderQuery.data, parseNotesData]);

  return (
    <ClientDataContext.Provider value={{
      selectedClientId,
      setSelectedClientId,
      data,
      loading,
      clients: clientsList,
      clientsLoading: isAuthenticated ? clientsQuery.isLoading : false,
    }}>
      {childrenProp}
    </ClientDataContext.Provider>
  );
}

/** Hook to access the active client's Fact Finder data from any page */
export function useClientData() {
  return useContext(ClientDataContext);
}

/**
 * Reusable "Fact Finder" badge component to show when data is auto-filled.
 * Import and render at the top of any calculator page.
 */
export function FactFinderBadge({ className = "" }: { className?: string }) {
  const { data } = useClientData();
  if (!data) return null;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      Auto-filled from {data.clientName}'s Fact Finder
    </div>
  );
}
