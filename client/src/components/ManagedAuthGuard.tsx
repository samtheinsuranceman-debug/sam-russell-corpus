import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export default function ManagedAuthGuard({ children, returnPath }: { children: ReactNode; returnPath: string }) {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[70vh] grid place-items-center bg-[#090712] text-violet-100">
        <div className="flex items-center gap-3 text-sm text-violet-200/80">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
          Verifying secure access…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_20%_10%,rgba(124,58,237,.24),transparent_34%),linear-gradient(145deg,#07060d,#100b1c_55%,#090710)] px-6 text-violet-50">
        <section className="w-full max-w-lg rounded-3xl border border-violet-400/20 bg-black/35 p-8 shadow-[0_28px_90px_rgba(76,29,149,.35)] backdrop-blur-xl">
          <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/30">
            <LockKeyhole className="h-6 w-6 text-violet-300" />
          </div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Russell Capital Systems</p>
          <h1 className="text-3xl font-semibold tracking-tight">Secure portal access</h1>
          <p className="mt-3 leading-7 text-violet-100/65">Sign in through the managed identity service. Legacy trial passwords, backdoors, and email bypasses are disabled.</p>
          <button
            type="button"
            onClick={() => startLogin(returnPath)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-950/40 transition duration-200 hover:bg-violet-400 active:scale-[0.97]"
          >
            <ShieldCheck className="h-5 w-5" />
            Continue to secure sign in
          </button>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
