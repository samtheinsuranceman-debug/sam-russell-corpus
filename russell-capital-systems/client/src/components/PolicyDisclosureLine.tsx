/**
 * PolicyDisclosureLine — the one-line product disclosure, mounted by the app
 * shell at the head of every engine that runs on a policy. The text and the
 * route list live in shared/policyDisclosure.ts so every page says the same
 * thing.
 */
import { ShieldCheck } from "lucide-react";
import { POLICY_DISCLOSURE, policyKindForPath } from "@shared/policyDisclosure";

export default function PolicyDisclosureLine({ path }: { path: string }) {
  const kind = policyKindForPath(path);
  if (!kind) return null;
  return (
    <p
      data-testid="policy-disclosure"
      className="mb-4 flex items-start gap-2 rounded-lg border border-[#1e3a5f]/50 bg-[#0a0f1a]/50 px-3 py-2 text-xs text-slate-400"
    >
      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />
      <span>{POLICY_DISCLOSURE[kind]}</span>
    </p>
  );
}
