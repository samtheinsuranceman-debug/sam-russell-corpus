import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

/**
 * Whether "/" is open to a signed-out visitor (the server's gateHomepage in /api/auth/mode).
 * While it is gated, or until the answer arrives, a "back to the homepage" link would bounce
 * the visitor straight to /login, so links use PUBLIC_HOME_FALLBACK instead.
 */
export const PUBLIC_HOME_FALLBACK = { href: "/calculators", label: "Browse the free calculators" } as const;

export function useHomepageOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let cancelled = false;
    apiFetch("/api/auth/mode", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { gateHomepage: true }))
      .then((m: { gateHomepage?: boolean }) => { if (!cancelled) setOpen(m.gateHomepage === false); })
      .catch(() => { /* stay gated */ });
    return () => { cancelled = true; };
  }, []);
  return open;
}
