import { startLogin } from "@/const";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";

function requestedReturnPath() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo") ?? "/portal/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/portal/dashboard";
}

export default function Login() {
  const returnPath = requestedReturnPath();

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-[#07060d] text-white">
      <section className="relative hidden overflow-hidden border-r border-violet-400/15 lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(124,58,237,.34),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(34,197,94,.16),transparent_30%),linear-gradient(155deg,#07060d,#100a1d_55%,#08070d)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-violet-300">Russell Capital Systems</p>
          <div className="max-w-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/20 bg-violet-500/10">
              <LockKeyhole className="h-7 w-7 text-violet-300" />
            </div>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight">One secure identity for every planning workflow.</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-violet-100/60">Managed OAuth protects client records, saved plans, scenarios, and advisor tools without client-side passwords or hidden bypasses.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-violet-200/60"><ShieldCheck className="h-4 w-4" /> Server-enforced access controls</div>
        </div>
      </section>
      <section className="grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-violet-400/20 bg-white/[0.045] p-8 shadow-[0_30px_100px_rgba(76,29,149,.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Advisor portal</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in securely</h2>
          <p className="mt-3 leading-7 text-violet-100/60">Continue with your authorized account. Password-gate access has been retired.</p>
          <button
            type="button"
            onClick={() => startLogin(returnPath)}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-950/40 transition duration-200 hover:bg-violet-400 active:scale-[0.97]"
          >
            Continue to sign in <ArrowRight className="h-5 w-5" />
          </button>
          <a href="/" className="mt-5 block text-center text-sm text-violet-200/55 hover:text-violet-100">Return to homepage</a>
        </div>
      </section>
    </main>
  );
}

