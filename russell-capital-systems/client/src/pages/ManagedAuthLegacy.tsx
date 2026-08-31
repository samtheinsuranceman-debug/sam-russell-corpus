import { startLogin } from "@/const";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";

const routeCopy: Record<string, { label: string; title: string; body: string }> = {
  "/register": {
    label: "Account access",
    title: "Registration is managed securely",
    body: "Russell Capital Systems now provisions access through the managed identity service. Continue to sign in; approved accounts and roles are resolved server-side.",
  },
  "/forgot-password": {
    label: "Account recovery",
    title: "Password recovery has moved",
    body: "Local portal passwords have been retired. Continue to the secure identity service to recover or access your authorized account.",
  },
  "/reset-password": {
    label: "Account recovery",
    title: "Password reset links are retired",
    body: "The portal no longer stores or resets local passwords. Continue through secure sign in for identity-managed recovery.",
  },
  "/trial": {
    label: "Portal access",
    title: "Trial password access is retired",
    body: "Shared trial passwords and access codes are disabled. Continue with an authorized identity so portal activity and saved client data remain attributable and protected.",
  },
};

export default function ManagedAuthLegacy() {
  const copy = routeCopy[window.location.pathname] ?? routeCopy["/register"];

  return (
    <main className="min-h-screen grid place-items-center bg-[radial-gradient(circle_at_18%_12%,rgba(124,58,237,.28),transparent_32%),linear-gradient(145deg,#07060d,#100b1c_55%,#090710)] px-6 py-16 text-violet-50">
      <section className="w-full max-w-xl rounded-3xl border border-violet-400/20 bg-black/35 p-8 shadow-[0_30px_100px_rgba(76,29,149,.3)] backdrop-blur-xl sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-400/30">
          <ShieldCheck className="h-6 w-6 text-violet-300" />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-violet-300">{copy.label}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-base leading-7 text-violet-100/65">{copy.body}</p>
        <button
          type="button"
          onClick={() => startLogin("/portal/dashboard")}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-950/40 transition duration-200 hover:bg-violet-400 active:scale-[0.97]"
        >
          Continue to secure sign in <ArrowRight className="h-5 w-5" />
        </button>
        <a href="/" className="mt-5 flex items-center justify-center gap-2 text-sm text-violet-200/55 hover:text-violet-100">
          <ArrowLeft className="h-4 w-4" /> Return to homepage
        </a>
      </section>
    </main>
  );
}
