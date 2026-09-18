import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

/** Where an unauthenticated visitor is sent: the entrance page, which returns them here afterwards. */
export function entranceHref(returnPath: string): string {
  const safe = returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/portal/dashboard";
  return `/login?returnTo=${encodeURIComponent(safe)}`;
}

export default function ManagedAuthGuard({ children, returnPath }: { children: ReactNode; returnPath: string }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#050b0a] text-emerald-100">
        <div className="flex items-center gap-3 text-sm text-emerald-200/80">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
          Verifying secure access…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,.24),transparent_34%),linear-gradient(145deg,#04100c,#071411_55%,#050b0a)] px-6 text-emerald-50">
        <section className="w-full max-w-lg rounded-3xl border border-emerald-400/20 bg-black/35 p-8 shadow-[0_28px_90px_rgba(6,95,70,.35)] backdrop-blur-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
            <LockKeyhole className="h-6 w-6 text-emerald-300" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Russell Capital Systems</p>
          <h1 className="text-3xl font-semibold tracking-tight">Sign in to continue</h1>
          <p className="mt-3 leading-7 text-emerald-100/65">This page is inside the site. Enter with your email and passcode, read the acknowledgements, and you will be brought straight back here.</p>
          <a
            href={entranceHref(returnPath)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/40 transition duration-200 hover:bg-emerald-400 active:scale-[0.97]"
          >
            <ShieldCheck className="h-5 w-5" />
            Go to the entrance
          </a>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
