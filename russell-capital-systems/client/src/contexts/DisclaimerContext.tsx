import { createContext, useContext, useEffect, type ReactNode } from "react";

/**
 * Disclosures always render.
 *
 * This context used to hold a "Demo Mode" switch that any signed-in user could
 * flip from the sidebar. It hid NAICDisclaimer and ComplianceFooter on every
 * page and persisted the choice in localStorage, which meant a projection could
 * be shown to a client with no "hypothetical", no claims-paying caveat and no
 * product disclosure beside it. Model 570 requires those disclosures to be
 * present and not minimized, so there is nothing for a switch to switch.
 *
 * The context and hook stay so existing imports keep compiling, but
 * showDisclaimers is always true and setShowDisclaimers does nothing. A demo
 * mode may hide other things; it may never hide a disclosure.
 * server/copyComplianceGuard.test.ts fails if a disclosure component returns
 * null on a user-settable flag again.
 */
interface DisclaimerContextValue {
  /** Always true. Disclosures are not optional. */
  showDisclaimers: true;
  /** Kept for source compatibility; ignores its argument. */
  setShowDisclaimers: (v: boolean) => void;
}

const VALUE: DisclaimerContextValue = {
  showDisclaimers: true,
  setShowDisclaimers: () => {},
};

const DisclaimerContext = createContext<DisclaimerContextValue>(VALUE);

/** The key the old toggle wrote. Cleared once so a stale "false" cannot linger. */
const LEGACY_STORAGE_KEY = "rc_disclaimer_mode";

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {}
  }, []);

  return <DisclaimerContext.Provider value={VALUE}>{children}</DisclaimerContext.Provider>;
}

export function useDisclaimer() {
  return useContext(DisclaimerContext);
}
