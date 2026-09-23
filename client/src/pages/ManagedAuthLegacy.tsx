import { startLogin } from "@/const";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { PUBLIC_HOME_FALLBACK, useHomepageOpen } from "@/hooks/useHomepageOpen";

const routeCopy: Record<string, { label: string; title: string; body: string }> = {
  "/register": {
    label: "Account access",
    title: "Access is by invitation",
    body: "Russell Capital Systems does not take open registrations. Invited visitors sign in with their email and the entrance passcode they were given; approved accounts and roles are resolved server-side.",
  },
  "/forgot-password": {
    label: "Account recovery",
    title: "Password recovery has moved",
    body: "Visitor passwords are not stored. Invited visitors use the entrance passcode; if you have lost it, ask the firm for it again.",
  },
  "/reset-password": {
    label: "Account recovery",
    title: "Password reset links are retired",
    body: "The portal does not store or reset visitor passwords. Continue to sign in with the entrance passcode the firm gave you.",
  },
  "/trial": {
    label: "Portal access",
    title: "Trial password access is retired",
    body: "Shared trial passwords and access codes are disabled. Continue with an authorized identity so portal activity and saved client data remain attributable and protected.",
  },
};

export default function ManagedAuthLegacy() {
  const copy = routeCopy[window.location.pathname] ?? routeCopy["/register"];
  const homeOpen = useHomepageOpen();

  return (
    <div className="relative min-h-screen grid place-items-center bg-[#04100c] px-6 py-16 text-emerald-50">
      {/* The boulevard's two text-free edges, one per side on wide screens; the seam sits behind the card. */}
      <img src="/rcs-city-boulevard.webp" alt="Rain-washed boulevard at night lined with lamps, trees and green banners" className="absolute inset-y-0 left-0 h-full w-full object-cover object-center brightness-[.6] saturate-[1.1] md:w-1/2" loading="lazy" decoding="async" />
      <img src="/rcs-city-boulevard-r.webp" alt="" aria-hidden="true" className="absolute inset-y-0 right-0 hidden h-full w-1/2 object-cover object-center brightness-[.6] saturate-[1.1] md:block" loading="lazy" decoding="async" />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(16,185,129,.28),transparent_32%),linear-gradient(145deg,rgba(7,6,13,.55),rgba(16,11,28,.45)_55%,rgba(9,7,16,.7))]" />
      <section className="relative z-10 w-full max-w-xl rounded-3xl border border-emerald-400/20 bg-black/35 p-8 shadow-[0_30px_100px_rgba(6,95,70,.3)] backdrop-blur-xl sm:p-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <ShieldCheck className="h-6 w-6 text-emerald-300" />
        </div>
        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">{copy.label}</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="mt-4 text-base leading-7 text-emerald-100/65">{copy.body}</p>
        <button
          type="button"
          onClick={() => startLogin("/portal/dashboard")}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-lg shadow-emerald-950/40 transition duration-200 hover:bg-emerald-800 active:scale-[0.97]"
        >
          Continue to secure sign in <ArrowRight className="h-5 w-5" />
        </button>
        {/* While the homepage is gated, "/" bounces a signed-out visitor to /login. */}
        <a href={homeOpen ? "/" : PUBLIC_HOME_FALLBACK.href} className="mt-5 flex items-center justify-center gap-2 text-sm text-emerald-200/70 hover:text-emerald-100">
          <ArrowLeft className="h-4 w-4" /> {homeOpen ? "Return to homepage" : PUBLIC_HOME_FALLBACK.label}
        </a>
      </section>
    </div>
  );
}
