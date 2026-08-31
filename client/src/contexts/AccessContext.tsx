import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export type AccessTier = "none" | "trial" | "unlimited" | "subscriber" | "owner";

interface AccessState {
  tier: AccessTier;
  authenticated: boolean;
  loading: boolean;
  remainingAccesses: number | null;
  sessionSeconds: number;
  sessionExpired: boolean;
  trialExpired: boolean;
  email: string | null;
  error: string | null;
  enterWithPassword: (password: string, email?: string) => Promise<void>;
  clearAccess: () => void;
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
  enterWithPassword: async () => {
    throw new Error("Password access has been retired. Use secure sign in.");
  },
  clearAccess: () => {},
  canAccess: false,
});

export function useAccess() {
  return useContext(AccessContext);
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const tier: AccessTier = user?.role === "admin" ? "owner" : isAuthenticated ? "subscriber" : "none";

  const enterWithPassword = useCallback(async () => {
    throw new Error("Password access has been retired. Use secure sign in.");
  }, []);

  const clearAccess = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <AccessContext.Provider
      value={{
        tier,
        authenticated: isAuthenticated,
        loading,
        remainingAccesses: null,
        sessionSeconds: 0,
        sessionExpired: false,
        trialExpired: false,
        email: user?.email ?? null,
        error: null,
        enterWithPassword,
        clearAccess,
        canAccess: isAuthenticated,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}
