/**
 * AccessContext — Portal Access Enforcement Layer
 *
 * UPDATED: ALL users must enter one of 3 approved passwords to access the dashboard.
 * No auto-bypass for any email. No trial access. No free pass.
 *
 * Approved passwords: 18aLiHeap*, Welcome@7, Mike12(?)
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { SESSION_VERSION } from "@shared/accessControl";

// Session keys — versioned to invalidate old sessions when SESSION_VERSION changes
const SESSION_STORAGE_KEY = `rc_access_tier_v${SESSION_VERSION}`;
const SESSION_EMAIL_KEY = `rc_session_email_v${SESSION_VERSION}`;

export type AccessTier = "none" | "unlimited" | "subscriber" | "owner";

interface AccessState {
  tier: AccessTier;
  authenticated: boolean;
  loading: boolean;
  /** Remaining trial accesses — always null (trial disabled) */
  remainingAccesses: number | null;
  /** Seconds used in current session */
  sessionSeconds: number;
  /** Whether the current session has exceeded limit */
  sessionExpired: boolean;
  /** Whether trial is expired — always false (trial disabled) */
  trialExpired: boolean;
  /** Email associated with the access session */
  email: string | null;
  /** Error message if access was denied */
  error: string | null;
  /** Enter via password gate */
  enterWithPassword: (password: string, email?: string) => Promise<void>;
  /** Clear the access session */
  clearAccess: () => void;
  /** Whether the user can access the portal */
  canAccess: boolean;
}

const AccessContext = createContext<AccessState>({
  tier: "none",
  authenticated: false,
  loading: true,
  remainingAccesses: null,
  sessionSeconds: 0,
  sessionExpired: false,
  trialExpired: false,
  email: null,
  error: null,
  enterWithPassword: async () => {},
  clearAccess: () => {},
  canAccess: false,
});

export function useAccess() {
  return useContext(AccessContext);
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [tier, setTier] = useState<AccessTier>(() => {
    // Clean up ALL old session keys from previous versions
    cleanOldSessionKeys();
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored && ["unlimited", "subscriber", "owner"].includes(stored)) {
      return stored as AccessTier;
    }
    return "none";
  });
  const [email, setEmail] = useState<string | null>(() => sessionStorage.getItem(SESSION_EMAIL_KEY));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Password gate mutation
  const passwordGateMut = trpc.auth.passwordGate.useMutation();

  // ── NO AUTO-BYPASS — Everyone must enter a password ──
  useEffect(() => {
    if (authLoading) return;
    // If we already have a valid tier from sessionStorage, keep it
    if (tier !== "none") {
      setLoading(false);
      return;
    }
    // Otherwise, user needs to enter a password
    setLoading(false);
  }, [authLoading, tier]);

  // ── Password gate entry ──
  const enterWithPassword = useCallback(async (password: string, inputEmail?: string) => {
    setError(null);
    if (!inputEmail) {
      setError("Email is required.");
      throw new Error("Email is required.");
    }
    try {
      const result = await passwordGateMut.mutateAsync({ password, email: inputEmail });
      if (result.access === "unlimited") {
        setTier("unlimited");
        setEmail(result.email);
        sessionStorage.setItem(SESSION_STORAGE_KEY, "unlimited");
        sessionStorage.setItem(SESSION_EMAIL_KEY, result.email);
      }
    } catch (e: any) {
      setError(e.message || "Invalid access password.");
      throw e;
    }
  }, [passwordGateMut]);

  // ── Clear access ──
  const clearAccess = useCallback(() => {
    setTier("none");
    setEmail(null);
    setError(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_EMAIL_KEY);
    // Also clear any old localStorage owner markers
    try { localStorage.removeItem("rc_owner_email"); } catch (_) {}
  }, []);

  // canAccess is ONLY true if user has passed the password gate
  const canAccess = tier === "owner" || tier === "unlimited" || tier === "subscriber";

  return (
    <AccessContext.Provider
      value={{
        tier,
        authenticated: canAccess,
        loading: loading || authLoading,
        remainingAccesses: null,
        sessionSeconds: 0,
        sessionExpired: false,
        trialExpired: false,
        email,
        error,
        enterWithPassword,
        clearAccess,
        canAccess,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}

/**
 * Clean up old session storage keys from previous versions.
 * This effectively "kicks out" all users who had old sessions.
 */
function cleanOldSessionKeys() {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith("rc_") && !key.includes(`_v${SESSION_VERSION}`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => sessionStorage.removeItem(k));
  // Also clear old localStorage markers
  try { localStorage.removeItem("rc_owner_email"); } catch (_) {}
  // Clear old non-versioned keys
  try {
    sessionStorage.removeItem("rc_access_tier");
    sessionStorage.removeItem("rc_session_email");
    sessionStorage.removeItem("rc_session_start");
  } catch (_) {}
}
