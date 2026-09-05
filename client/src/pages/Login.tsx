import { startLogin } from "@/const";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

function requestedReturnPath() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo") ?? "/portal/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/portal/dashboard";
}

type AuthMode = { managedOAuth: boolean; ownerLogin: boolean };

export default function Login() {
  const returnPath = requestedReturnPath();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { managedOAuth: false, ownerLogin: false }))
      .then((m: AuthMode) => { if (!cancelled) setMode(m); })
      .catch(() => { if (!cancelled) setMode({ managedOAuth: false, ownerLogin: false }); });
    return () => { cancelled = true; };
  }, []);

  async function submitOwnerLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch("/api/auth/owner-login", {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setError(body.error ?? "Sign-in failed."); return; }
      window.location.href = returnPath;
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-violet-300/25 bg-black/30 px-4 py-3 text-white placeholder:text-violet-100/35 focus:border-violet-300 focus:outline-none";

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
            <p className="mt-5 max-w-lg text-lg leading-8 text-violet-100/60">Server-enforced sessions protect client records, saved plans, scenarios, advisor tools, and the lead inbox. No built-in passwords, no hidden bypasses.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-violet-200/60"><ShieldCheck className="h-4 w-4" /> Server-enforced access controls</div>
        </div>
      </section>
      <section className="grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-violet-400/20 bg-white/[0.045] p-8 shadow-[0_30px_100px_rgba(76,29,149,.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">Advisor portal</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in securely</h2>

          {mode === null && <p className="mt-3 leading-7 text-violet-100/60">Checking sign-in options…</p>}

          {mode?.ownerLogin && (
            <form onSubmit={submitOwnerLogin} className="mt-5" aria-label="Owner sign-in">
              <p className="leading-7 text-violet-100/60">Owner sign-in for this installation.</p>
              <label className="mt-4 block text-sm text-violet-100/70">Email
                <input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="mt-3 block text-sm text-violet-100/70">Password
                <input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-950/40 transition duration-200 hover:bg-violet-400 active:scale-[0.97] disabled:opacity-60">
                {busy ? "Signing in…" : "Sign in"} <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {mode?.managedOAuth && (
            <>
              <p className="mt-3 leading-7 text-violet-100/60">{mode.ownerLogin ? "Or continue with your authorized account." : "Continue with your authorized account."}</p>
              <button type="button" onClick={() => startLogin(returnPath)}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition duration-200 active:scale-[0.97] ${mode.ownerLogin ? "border border-violet-300/30 text-violet-100 hover:bg-violet-500/15" : "bg-violet-500 text-white shadow-lg shadow-violet-950/40 hover:bg-violet-400"}`}>
                Continue to sign in <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}

          {mode && !mode.ownerLogin && !mode.managedOAuth && (
            <p className="mt-3 leading-7 text-violet-100/60">
              Sign-in is not configured on this host yet. The site owner sets <code className="text-violet-200">OWNER_EMAIL</code> and <code className="text-violet-200">OWNER_PASSWORD_HASH</code> in the server environment (see LAUNCH.md, section 4).
            </p>
          )}

          <a href="/" className="mt-5 block text-center text-sm text-violet-200/55 hover:text-violet-100">Return to homepage</a>
        </div>
      </section>
    </main>
  );
}
