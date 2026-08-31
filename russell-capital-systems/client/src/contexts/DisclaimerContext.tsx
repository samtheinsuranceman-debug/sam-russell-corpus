import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface DisclaimerContextValue {
  /** true = show disclaimers (compliance mode), false = hide (demo mode) */
  showDisclaimers: boolean;
  setShowDisclaimers: (v: boolean) => void;
}

const DisclaimerContext = createContext<DisclaimerContextValue>({
  showDisclaimers: true,
  setShowDisclaimers: () => {},
});

const STORAGE_KEY = "rc_disclaimer_mode";

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [showDisclaimers, setShowDisclaimers] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showDisclaimers));
    } catch {}
  }, [showDisclaimers]);

  return (
    <DisclaimerContext.Provider value={{ showDisclaimers, setShowDisclaimers }}>
      {children}
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer() {
  return useContext(DisclaimerContext);
}
