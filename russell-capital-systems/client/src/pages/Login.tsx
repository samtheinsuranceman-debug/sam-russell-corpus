import { startLogin } from "@/const";
import { LOGIN_DISCLAIMERS } from "@shared/loginDisclaimers";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function requestedReturnPath() {
  const params = new URLSearchParams(window.location.search);
  const value = params.get("returnTo") ?? "/portal/dashboard";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/portal/dashboard";
}

type AuthMode = { managedOAuth: boolean; ownerLogin: boolean; ownerTotp?: boolean; guestLogin?: boolean };
const NO_MODE: AuthMode = { managedOAuth: false, ownerLogin: false, guestLogin: false };

export default function Login() {
  const returnPath = requestedReturnPath();
  const [mode, setMode] = useState<AuthMode | null>(null);
  const [tab, setTab] = useState<"guest" | "owner">("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsCode, setNeedsCode] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/mode", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : NO_MODE))
      .then((m: AuthMode) => {
        if (cancelled) return;
        setMode(m);
        if (!m.guestLogin && m.ownerLogin) setTab("owner");
      })
      .catch(() => { if (!cancelled) setMode(NO_MODE); });
    return () => { cancelled = true; };
  }, []);

  const acknowledgements = useMemo(() => LOGIN_DISCLAIMERS.filter((d) => accepted[d.id]).map((d) => d.id), [accepted]);
  const allAccepted = acknowledgements.length === LOGIN_DISCLAIMERS.length;
  const showOwner = tab === "owner" && mode?.ownerLogin;
  const showGuest = tab === "guest" && mode?.guestLogin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!allAccepted) { setError("Check every acknowledgement to continue."); return; }
    setBusy(true); setError(null);
    const path = showOwner ? "/api/auth/owner-login" : "/api/auth/guest-login";
    try {
      const res = await fetch(path, {
        method: "POST", credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, code: code || undefined, acknowledgements }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { if (body.needsCode) setNeedsCode(true); setError(body.error ?? "Sign-in failed."); return; }
      window.location.href = returnPath;
    } catch {
      setError("Could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-1 w-full rounded-xl border border-emerald-300/25 bg-black/30 px-4 py-3 text-white placeholder:text-emerald-100/35 focus:border-emerald-300 focus:outline-none";
  const tabBtn = (active: boolean) => `flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${active ? "bg-emerald-500 text-white" : "text-emerald-100/60 hover:text-emerald-100"}`;

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.05fr_.95fr] bg-[#04100c] text-white">
      <section className="relative hidden overflow-hidden border-r border-emerald-400/15 lg:block">
        <img src="/rcs-city-glass.webp" alt="Green-lit skyscrapers at night above a dark river" className="absolute inset-0 h-full w-full object-cover object-center brightness-[.7] saturate-[1.15]" loading="lazy" decoding="async" />
        <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_28%_20%,rgba(16,185,129,.34),transparent_32%),radial-gradient(circle_at_70%_70%,rgba(34,197,94,.16),transparent_30%),linear-gradient(155deg,#04100c,#071411_55%,#050b0a)]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.26em] text-emerald-300">Russell Capital Systems</p>
          <div className="max-w-xl">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-500/10">
              <LockKeyhole className="h-7 w-7 text-emerald-300" />
            </div>
            <h1 className="text-5xl font-semibold leading-tight tracking-tight">The entrance.</h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-emerald-100/60">Your email and the passcode you were given open every planning engine on the site. Read the five acknowledgements first; the door does not open until each one is checked.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-200/60"><ShieldCheck className="h-4 w-4" /> Server-enforced access controls</div>
        </div>
      </section>
      <section className="grid place-items-center px-6 py-16">
        <div className="w-full max-w-md rounded-3xl border border-emerald-400/20 bg-white/[0.045] p-8 shadow-[0_30px_100px_rgba(6,95,70,.28)] backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">Russell Capital Systems</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">Sign in</h2>

          {mode === null && <p className="mt-3 leading-7 text-emerald-100/60">Checking sign-in options…</p>}

          {mode?.guestLogin && mode?.ownerLogin && (
            <div className="mt-5 flex gap-1 rounded-xl border border-emerald-300/20 bg-black/30 p-1" role="tablist" aria-label="Sign-in type">
              <button type="button" role="tab" aria-selected={tab === "guest"} className={tabBtn(tab === "guest")} onClick={() => { setTab("guest"); setError(null); }}>Passcode</button>
              <button type="button" role="tab" aria-selected={tab === "owner"} className={tabBtn(tab === "owner")} onClick={() => { setTab("owner"); setError(null); }}>Owner</button>
            </div>
          )}

          {(showGuest || showOwner) && (
            <form onSubmit={submit} className="mt-5" aria-label={showOwner ? "Owner sign-in" : "Passcode sign-in"}>
              <p className="leading-7 text-emerald-100/60">
                {showOwner ? "Owner sign-in for this installation." : "Any email, plus the passcode you were given."}
              </p>
              <label className="mt-4 block text-sm text-emerald-100/70">Email
                <input className={input} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </label>
              <label className="mt-3 block text-sm text-emerald-100/70">{showOwner ? "Password" : "Passcode"}
                <input className={input} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </label>
              {showOwner && (mode?.ownerTotp || needsCode) && (
                <label className="mt-3 block text-sm text-emerald-100/70">Authenticator code
                  <input className={input} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="6-digit code" required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
                </label>
              )}

              <fieldset className="mt-6 rounded-2xl border border-emerald-300/20 bg-black/25 p-4">
                <legend className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Before you enter</legend>
                <ul className="space-y-3">
                  {LOGIN_DISCLAIMERS.map((d) => (
                    <li key={d.id}>
                      <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-emerald-100/75">
                        <input type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-emerald-500" checked={Boolean(accepted[d.id])}
                          onChange={(e) => setAccepted((a) => ({ ...a, [d.id]: e.target.checked }))} required aria-required="true" />
                        <span><span className="font-semibold text-emerald-100">{d.title}.</span> {d.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-emerald-200/55">
                  <a href="/terms" className="underline hover:text-emerald-100">Terms of Use</a> · <a href="/privacy" className="underline hover:text-emerald-100">Privacy Policy</a>
                </p>
              </fieldset>

              {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
              <button type="submit" disabled={busy || !allAccepted}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/40 transition duration-200 hover:bg-emerald-400 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "Signing in…" : allAccepted ? "Enter the site" : `Check all ${LOGIN_DISCLAIMERS.length} to continue`} <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          )}

          {mode?.managedOAuth && (
            <>
              <p className="mt-3 leading-7 text-emerald-100/60">{mode.ownerLogin || mode.guestLogin ? "Or continue with your authorized account." : "Continue with your authorized account."}</p>
              <button type="button" onClick={() => startLogin(returnPath)}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition duration-200 active:scale-[0.97] ${mode.ownerLogin || mode.guestLogin ? "border border-emerald-300/30 text-emerald-100 hover:bg-emerald-500/15" : "bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-400"}`}>
                Continue to sign in <ArrowRight className="h-5 w-5" />
              </button>
            </>
          )}

          {mode && !mode.ownerLogin && !mode.managedOAuth && !mode.guestLogin && (
            <p className="mt-3 leading-7 text-emerald-100/60">
              Sign-in is not configured on this host yet. The site owner sets <code className="text-emerald-200">GUEST_PASSCODE_HASH</code> or <code className="text-emerald-200">OWNER_EMAIL</code> and <code className="text-emerald-200">OWNER_PASSWORD_HASH</code> in the server environment (see LAUNCH.md, section 4).
            </p>
          )}

          <a href="/" className="mt-5 block text-center text-sm text-emerald-200/55 hover:text-emerald-100">Return to homepage</a>
        </div>
      </section>
    </main>
  );
}
