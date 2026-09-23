/**
 * PolicyDisclosureLine — the one-line product disclosure (NAIC Model 570: name
 * the product as life insurance or an annuity), mounted at the head of every
 * engine that runs on a policy. The text and the route list live in
 * shared/policyDisclosure.ts so every page says the same thing.
 *
 * Where it mounts:
 *   - AppShell renders <PolicyDisclosureLine path={location} /> above the page.
 *   - gated() in App.tsx wraps every gated route in <PolicyDisclosureSlot>,
 *     which renders the same line itself only when no AppShell line claimed the
 *     slot. Listed routes that do not use AppShell (TimeMachineAG49,
 *     MortgageKillerV3, IulProjectionPage, MygaWaterfallPage…) used to show
 *     nothing; now they show the line, and AppShell pages do not show it twice.
 *   - Public pages that sit outside gated() (the homepage, /ultra-calculator)
 *     render it directly, by path or by kind.
 */
import React, { createContext, useContext, useLayoutEffect, useState, useCallback, useMemo, type ReactNode } from "react";
import { ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { POLICY_DISCLOSURE, policyKindForPath, type PolicyKind } from "@shared/policyDisclosure";

type SlotApi = { claim: () => () => void };
const SlotContext = createContext<SlotApi | null>(null);

type Props =
  | { path: string; kind?: undefined; className?: string }
  | { kind: PolicyKind; path?: undefined; className?: string };

export default function PolicyDisclosureLine(props: Props) {
  const slot = useContext(SlotContext);
  const kind = props.kind ?? policyKindForPath(props.path ?? "");
  // Tell an enclosing slot that the line is on screen, so it does not print a second copy.
  useLayoutEffect(() => {
    if (!slot || !kind) return;
    return slot.claim();
  }, [slot, kind]);
  if (!kind) return null;
  return <DisclosureText kind={kind} className={props.className} />;
}

function DisclosureText({ kind, className }: { kind: PolicyKind; className?: string }) {
  return (
    <p
      data-testid="policy-disclosure"
      data-policy-kind={kind}
      className={
        className ??
        "mb-4 flex items-start gap-2 rounded-lg border border-[#1e3a5f]/50 bg-[#0a0f1a]/50 px-3 py-2 text-xs text-slate-400"
      }
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
      <span>{POLICY_DISCLOSURE[kind]}</span>
    </p>
  );
}

/**
 * Wraps a gated route. Prints the line for the current route unless a
 * PolicyDisclosureLine inside the page (AppShell's) has claimed it.
 */
export function PolicyDisclosureSlot({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [claims, setClaims] = useState(0);
  const claim = useCallback(() => {
    setClaims((c) => c + 1);
    return () => setClaims((c) => c - 1);
  }, []);
  const api = useMemo<SlotApi>(() => ({ claim }), [claim]);
  const kind = policyKindForPath(location);
  return (
    <SlotContext.Provider value={api}>
      {kind && claims === 0 && (
        <div className="relative z-20 mx-auto max-w-6xl px-4 pt-3">
          <DisclosureText kind={kind} />
        </div>
      )}
      {children}
    </SlotContext.Provider>
  );
}
