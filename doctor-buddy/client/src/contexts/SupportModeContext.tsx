import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SupportMode = "friend" | "therapist" | "psychiatrist";

export type PrivacyPreferences = {
  ephemeralByDefault: boolean;
  personalizationMemory: boolean;
  shareWithCareTeam: boolean;
};

type SupportModeContextValue = {
  mode: SupportMode;
  setMode: (mode: SupportMode) => void;
  privacy: PrivacyPreferences;
  setPrivacy: (next: PrivacyPreferences) => void;
};

const SupportModeContext = createContext<SupportModeContextValue | null>(null);
const MODE_KEY = "doctorbuddy-support-mode-v1";
const PRIVACY_KEY = "doctorbuddy-privacy-preferences-v1";

const DEFAULT_PRIVACY: PrivacyPreferences = {
  // Privacy-first defaults. The user must affirmatively opt into memory or sharing.
  ephemeralByDefault: true,
  personalizationMemory: false,
  shareWithCareTeam: false,
};

export function SupportModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<SupportMode>(() => {
    const stored = localStorage.getItem(MODE_KEY);
    return stored === "therapist" || stored === "psychiatrist" || stored === "friend"
      ? stored
      : "friend";
  });
  const [privacy, setPrivacyState] = useState<PrivacyPreferences>(() => {
    try {
      const raw = localStorage.getItem(PRIVACY_KEY);
      if (!raw) return DEFAULT_PRIVACY;
      return { ...DEFAULT_PRIVACY, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_PRIVACY;
    }
  });

  useEffect(() => {
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem(PRIVACY_KEY, JSON.stringify(privacy));
  }, [privacy]);

  const value = useMemo<SupportModeContextValue>(() => ({
    mode,
    setMode: setModeState,
    privacy,
    setPrivacy: setPrivacyState,
  }), [mode, privacy]);

  return <SupportModeContext.Provider value={value}>{children}</SupportModeContext.Provider>;
}

export function useSupportMode() {
  const context = useContext(SupportModeContext);
  if (!context) throw new Error("useSupportMode must be used inside SupportModeProvider");
  return context;
}

export const SUPPORT_MODE_COPY: Record<SupportMode, {
  label: string;
  shortLabel: string;
  description: string;
  boundary: string;
  placeholder: string;
}> = {
  friend: {
    label: "Friend Zone",
    shortLabel: "Friend",
    description: "Warm, plainspoken, encouraging conversation with practical reflection and zero clinical posturing.",
    boundary: "A supportive communication style — not a human friend, therapist, or medical professional.",
    placeholder: "Tell me what's going on in your own words…",
  },
  therapist: {
    label: "Therapist Zone",
    shortLabel: "Therapist",
    description: "More structured reflection, careful questions, skills practice, values work, and pattern exploration.",
    boundary: "Therapist-style communication only. Doctor Buddy is not a licensed therapist and does not provide psychotherapy.",
    placeholder: "What would you like to understand, process, or work through?",
  },
  psychiatrist: {
    label: "Psychiatrist Zone",
    shortLabel: "Psychiatrist",
    description: "Precise, clinically literate education with clearer terminology, evidence framing, and care-team preparation.",
    boundary: "Psychiatrist-style educational communication only. No diagnosis, prescribing, dosing, or medication changes.",
    placeholder: "What would you like explained or organized for a clinician conversation?",
  },
};
