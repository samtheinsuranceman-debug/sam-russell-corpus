import { useAuth } from "@/_core/hooks/useAuth";
import { entranceHref } from "@/components/ManagedAuthGuard";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

// ============================================================
// THE FRONT DOOR
// The homepage is the website, and the website opens only after the entrance:
// an unsigned visitor to "/" is sent to /login (email + passcode + the five
// acknowledgements) and returned here once the session cookie exists. The
// server decides whether the door is closed (gateHomepage in /api/auth/mode),
// so the owner can open the homepage to the public with one variable.
// ============================================================

type Gate = "checking" | "open" | "closed";

export default function EntranceGate({ children, returnPath = "/" }: { children: ReactNode; returnPath?: string }) {
  const { loading, isAuthenticated } = useAuth();
  const [gate, setGate] = useState<Gate>("checking");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { gateHomepage: true }))
      .then((m: { gateHomepage?: boolean }) => { if (!cancelled) setGate(m.gateHomepage === false ? "open" : "closed"); })
      .catch(() => { if (!cancelled) setGate("closed"); });
    return () => { cancelled = true; };
  }, []);

  const mustEnter = gate === "closed" && !loading && !isAuthenticated;

  useEffect(() => {
    if (mustEnter) window.location.replace(entranceHref(returnPath));
  }, [mustEnter, returnPath]);

  if (gate === "open" || isAuthenticated) return <>{children}</>;

  return (
    <div className="min-h-screen grid place-items-center bg-[#03090a] text-emerald-100">
      <div className="flex items-center gap-3 text-sm text-emerald-200/80">
        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
        {mustEnter ? "Opening the entrance…" : "One moment…"}
      </div>
    </div>
  );
}
