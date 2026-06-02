import { useState, useEffect, useCallback, createContext, useContext, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import ComplianceDisclosure from "@/pages/ComplianceDisclosure";
import { isOwnerBypassEmail } from "@shared/accessControl";

/* ═══════════════════════════════════════════════════════════════════════════
   ComplianceGate — Deep Surgical Rewrite
   
   DESIGN PRINCIPLES:
   1. SYNCHRONOUS-FIRST: Check localStorage before ANY network request.
      If localStorage says "signed" → render children on the FIRST frame.
      Zero spinners. Zero loading states. Zero network dependency.
   
   2. SINGLE STATE MACHINE: The gate has exactly 3 states:
      - SIGNED   → render children (determined synchronously from localStorage)
      - UNSIGNED → render ComplianceDisclosure form
      - CHECKING → ONLY for authenticated users whose localStorage is empty
                   AND whose DB compliance status hasn't resolved yet.
                   This state has a hard 800ms ceiling before falling through
                   to UNSIGNED.
   
   3. AUTH IS BACKGROUND: Auth loading NEVER blocks rendering.
      Auth resolves in the background. If it resolves to "authenticated",
      we upgrade the compliance tracking to DB-backed. If it doesn't,
      localStorage remains the source of truth. Either way, the user
      sees content or the form immediately.
   
   4. NO DUPLICATE AUTH QUERIES: This component uses useAuth() which
      shares the same React Query cache as every other consumer.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Session Context ─── */
interface SessionContextValue {
  sessionId: number | null;
}
const SessionContext = createContext<SessionContextValue>({ sessionId: null });
export function useSession() {
  return useContext(SessionContext);
}

/* ─── Page Title Map ─── */
const PAGE_TITLES: Record<string, string> = {
  "/portal/dashboard": "Dashboard",
  "/portal/clients": "Clients",
  "/portal/pipeline": "Pipeline",
  "/portal/strategies": "Strategies",
  "/portal/knowledge": "Knowledge Library",
  "/portal/team": "Team",
  "/portal/audit": "Audit Log",
  "/portal/settings": "Settings",
  "/portal/roth-engine": "Roth Conversion Engine",
  "/portal/iul-engine": "IUL Growth Engine",
  "/portal/real-estate": "Real Estate Modeling",
  "/portal/tax-bracket": "Tax Bracket Waterfall",
  "/portal/estate-tax": "Estate Tax Impact",
  "/portal/income-timeline": "Income Timeline",
  "/portal/competitive-analysis": "Competitive Analysis",
  "/portal/iul-vs-roth": "IUL vs Roth Comparison",
  "/portal/premium-financing": "Premium Financing",
  "/portal/policy-loan": "Policy Loan Optimizer",
  "/portal/carrier-ratings": "Carrier Ratings",
  "/portal/quick-quote": "Quick Quote Widget",
  "/portal/inflation": "Inflation Adjustment",
  "/portal/compliance": "Compliance",
  "/portal/compliance/alerts": "Compliance Alerts",
  "/portal/compliance/export": "Compliance Export",
  "/portal/compliance/website-usage": "Website Usage",
  "/portal/advisor-performance": "Advisor Performance",
  "/portal/rebalancing": "Smart Rebalancing",
  "/portal/report-builder": "Report Builder",
  "/portal/communication-log": "Communication Log",
  "/portal/household-view": "Multi-Policy Household View",
  "/portal/mortgage-killer": "Mortgage Killer Strategy",
  "/portal/ecological-drivers": "Ecological Drivers",
  "/portal/referrals": "Referrals",
  "/portal/documents": "Document Vault",
  "/portal/meetings": "Meetings",
  "/portal/onboarding": "Onboarding",
};

function getPageTitle(path: string): string {
  if (PAGE_TITLES[path]) return PAGE_TITLES[path];
  for (const [key, title] of Object.entries(PAGE_TITLES)) {
    if (path.startsWith(key)) return title;
  }
  const segments = path.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "Unknown";
  return last.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

/* ─── localStorage compliance (synchronous, zero network) ─── */
const ANON_COMPLIANCE_KEY = "rc_anon_compliance_signed";
const ANON_COMPLIANCE_EXPIRY_KEY = "rc_anon_compliance_expiry";

/** Pure synchronous check — no side effects, no network, no async */
function readLocalCompliance(): boolean {
  try {
    const signed = localStorage.getItem(ANON_COMPLIANCE_KEY);
    const expiry = localStorage.getItem(ANON_COMPLIANCE_EXPIRY_KEY);
    if (signed === "true" && expiry) {
      if (Date.now() < Number(expiry)) return true;
      // Expired — clean up
      localStorage.removeItem(ANON_COMPLIANCE_KEY);
      localStorage.removeItem(ANON_COMPLIANCE_EXPIRY_KEY);
    }
    return false;
  } catch {
    return false;
  }
}

function writeLocalCompliance() {
  try {
    localStorage.setItem(ANON_COMPLIANCE_KEY, "true");
    localStorage.setItem(ANON_COMPLIANCE_EXPIRY_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
  } catch { /* ignore */ }
}

/* ─── ComplianceGate ─── */
interface ComplianceGateProps {
  children: React.ReactNode;
  returnTo?: string;
}

export default function ComplianceGate({ children, returnTo }: ComplianceGateProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [location] = useLocation();
  const lastLoggedPath = useRef<string>("");

  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ CRITICAL: Initialize signed state SYNCHRONOUSLY from localStorage  │
  // │ This runs on the FIRST render frame — no useEffect, no async.     │
  // │ If localStorage says signed → children render immediately.         │
  // └─────────────────────────────────────────────────────────────────────┘
  const localSigned = useMemo(() => readLocalCompliance(), []);
  
  // The "signed" state starts from localStorage truth. It can be upgraded
  // by DB-backed compliance for authenticated users, but it NEVER downgrades
  // from true to false (that would cause a flash of the compliance form).
  const [signed, setSigned] = useState<boolean>(localSigned);
  const [sessionId, setSessionId] = useState<number | null>(null);

  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ DB-backed compliance — ONLY for authenticated users.               │
  // │ This query is enabled lazily: it won't fire until auth resolves.   │
  // │ It NEVER blocks rendering because `signed` is already resolved     │
  // │ from localStorage above.                                           │
  // └─────────────────────────────────────────────────────────────────────┘
  const { data: complianceStatus } =
    trpc.complianceTracking.hasSignedThisSession.useQuery(undefined, {
      enabled: isAuthenticated && !!user,
      refetchOnWindowFocus: false,
      retry: false,
    });

  const logPageMut = trpc.complianceTracking.logPageVisit.useMutation();

  // When DB compliance resolves for authenticated users, upgrade state
  useEffect(() => {
    if (!isAuthenticated || !user || !complianceStatus) return;
    
    if (complianceStatus.signed) {
      setSigned(true);
      if (complianceStatus.sessionId) {
        setSessionId(complianceStatus.sessionId);
      }
    }
    // If DB says NOT signed but localStorage says signed, we keep signed=true
    // (localStorage is the primary source; DB is supplementary tracking)
  }, [isAuthenticated, user, complianceStatus]);

  // Handle compliance signing callback
  const handleSigned = useCallback((newSessionId: number) => {
    // ALWAYS write to localStorage — this is the primary source of truth
    writeLocalCompliance();
    setSigned(true);

    if (isAuthenticated && user) {
      // Also track in DB for authenticated users
      setSessionId(newSessionId);
      const title = getPageTitle(location);
      logPageMut.mutate({ sessionId: newSessionId, pagePath: location, pageTitle: title });
      lastLoggedPath.current = location;
    }
  }, [isAuthenticated, user, location, logPageMut]);

  // Track page navigation (authenticated users only, fire-and-forget)
  useEffect(() => {
    if (!signed || !sessionId || !isAuthenticated) return;
    if (location === lastLoggedPath.current) return;
    if (location === "/compliance" || location === "/portal/compliance-disclosure") return;
    const title = getPageTitle(location);
    logPageMut.mutate({ sessionId, pagePath: location, pageTitle: title });
    lastLoggedPath.current = location;
  }, [location, signed, sessionId, isAuthenticated, logPageMut]);

  // End session on window close (authenticated users only)
  useEffect(() => {
    if (!sessionId || !isAuthenticated) return;
    const handleUnload = () => {
      const payload = JSON.stringify([
        { id: 1, jsonrpc: "2.0", method: "complianceTracking.endSession", params: { sessionId } },
      ]);
      navigator.sendBeacon(
        "/api/rpc/complianceTracking.endSession",
        new Blob([payload], { type: "application/json" })
      );
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [sessionId, isAuthenticated]);

  // ┌─────────────────────────────────────────────────────────────────────┐
  // │ RENDER DECISION                                                     │
  // │ Owner bypass → always render children (no compliance form)          │
  // │ signed=true  → render children (instant, from localStorage)        │
  // │ signed=false → render ComplianceDisclosure form                    │
  // └─────────────────────────────────────────────────────────────────────┘

  // Owner bypass — Sam never sees the compliance form
  // Layer 1: Auth-based check
  const isOwnerByAuth = isAuthenticated && user?.email && isOwnerBypassEmail(user.email);
  // Layer 2: localStorage marker
  let isOwnerByStorage = false;
  try {
    const storedOwnerEmail = localStorage.getItem("rc_owner_email");
    if (storedOwnerEmail && isOwnerBypassEmail(storedOwnerEmail)) isOwnerByStorage = true;
  } catch (_) {}
  // Layer 3: URL token
  const ownerTokenParam = new URLSearchParams(window.location.search).get("owner_token");
  const isOwnerByToken = ownerTokenParam && isOwnerBypassEmail(ownerTokenParam);
  const isOwner = isOwnerByAuth || isOwnerByStorage || !!isOwnerByToken;

  if (!signed && !isOwner) {
    return (
      <ComplianceDisclosure
        returnTo={returnTo}
        onSigned={handleSigned}
        isAnonymous={!isAuthenticated}
      />
    );
  }

  return (
    <SessionContext.Provider value={{ sessionId }}>
      {children}
    </SessionContext.Provider>
  );
}
