import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Lock, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import HomeLeadFactFinder from "@/components/HomeLeadFactFinder";
import { SiteIdentity } from "@/components/SiteIdentity";
import manifesto from "@shared/homeManifesto.json";

// ============================================================
// THE HOMEPAGE — the sign, then the fifteen technologies straight away.
//
// The owner's brief (September 2026): the patents start on the very next
// screen after the sign and run all the way down over the city pictures;
// no picture is left empty; the declarations and "what to expect" pages are
// gone; the slogan rides the sign at night; the lead card is the last screen.
// All copy lives in shared/homeManifesto.json so the static homepage
// (docs/index.html) reads the same words.
// ============================================================

const CALENDLY_URL = "https://calendly.com/sam-RussellCapitalSystems/60min";

// Every image page: one full-bleed picture, crisp, nothing on top of it.
const PAGE = "relative isolate flex min-h-[100svh] items-end overflow-hidden bg-[#03090a]";
const PIC = "absolute inset-0 z-0 h-full w-full object-cover";
const GLOW = "text-white [text-shadow:_0_0_14px_rgba(52,211,153,.55),_0_0_36px_rgba(16,185,129,.35),_0_4px_18px_rgba(0,0,0,.9)]";
// The fifteen claims wear the pair chosen from Grok's boards, Title 01 "filament wrap" and
// Body 02 plaque white; the styles live in index.css as rc-patent-title / rc-filament / rc-patent-body.
// They run straight down from the sign over four city plates, so no picture is left empty.
// Fourteen plates, fourteen different cities, one technology each (the harbor carries two): four cut from
// the designer's concept frames with every word removed, four made new in the same palette, the rest original.
// Each plate is three screens tall so the city breathes above and below its plaque. Add a plate per patent.
const PLATES: Array<{ src: string; tall?: string; position?: string; label: string; from: number; to: number }> = [
  { src: "/rcs-city-horizon.webp", tall: "/rcs-city-canyon.webp", position: "center 58%", label: "The horizon", from: 0, to: 1 },
  { src: "/rcs-city-dusk.webp", tall: "/rcs-city-spire.webp", label: "The dusk skyline", from: 1, to: 2 },
  { src: "/rcs-city-rain.webp", label: "The rain street", from: 2, to: 3 },
  { src: "/rcs-city-skyway.webp", tall: "/rcs-city-flagship.webp", label: "The skyway", from: 3, to: 4 },
  { src: "/rcs-city-trails.webp", tall: "/rcs-city-interchange.webp", label: "The light trails", from: 4, to: 5 },
  { src: "/rcs-city-rooftop.webp", label: "The rooftop", from: 5, to: 6 },
  { src: "/rcs-city-emerald.webp", tall: "/rcs-city-lattice.webp", label: "The emerald towers", from: 6, to: 7 },
  { src: "/rcs-city-bridgeway.webp", label: "The bridge from the water", from: 7, to: 8 },
  { src: "/rcs-city-expressway.webp", tall: "/rcs-city-glass.webp", position: "center 45%", label: "The expressway", from: 8, to: 9 },
  { src: "/rcs-city-loops.webp", tall: "/rcs-city-pinnacle.webp", label: "The river loops", from: 9, to: 10 },
  { src: "/rcs-city-harbor.webp", label: "The harbor", from: 10, to: 12 },
  { src: "/rcs-city-grid.webp", label: "The grid from above", from: 12, to: 13 },
  { src: "/rcs-city-marina.webp", label: "The marina", from: 13, to: 14 },
  { src: "/rcs-city-river.webp", label: "The river", from: 14, to: 15 },
  { src: "/rcs-city-rail.webp", label: "The railway", from: 15, to: 16 },
  { src: "/rcs-city-lake.webp", label: "The park lake", from: 16, to: 17 },
  { src: "/rcs-city-tunnel.webp", label: "The tunnel", from: 17, to: 18 },
  { src: "/rcs-city-overlook.webp", label: "The overlook", from: 18, to: 19 },
];

function ManagedPortalAction({ href, children, className }: { href: string; children: React.ReactNode; className: string }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Link href={href} className={className}>{children}</Link>;
  return (
    <button type="button" className={className} onClick={() => { window.location.href = getLoginUrl(href); }}>
      {children}
    </button>
  );
}

/** The slogan: one line, moving slowly left to right along the bottom of the picture. Still under reduced motion. */
function SloganLine({ id }: { id?: string }) {
  return (
    <div id={id} className="rc-slogan-line pointer-events-none absolute inset-x-0 bottom-0 z-10 overflow-hidden border-t border-emerald-300/25 bg-[linear-gradient(180deg,rgba(3,9,10,0),rgba(3,9,10,.82))] py-5 sm:py-6" aria-label="Slogan">
      <p className={`rc-slogan-track whitespace-nowrap text-[clamp(1.05rem,1.85vw,1.7rem)] font-semibold tracking-[-.01em] ${GLOW}`} style={{ fontFamily: "DM Sans, sans-serif" }}>
        <span className="rc-slogan-copy">{manifesto.slogan}</span>
        <span className="rc-slogan-copy" aria-hidden="true">{manifesto.slogan}</span>
      </p>
    </div>
  );
}

/** A clean photograph filling the screen. `tall` is served under 768px when present. */
function ImagePage({ id, src, tall, alt, position, slogan, label }: { id?: string; src: string; tall?: string; alt: string; position?: string; slogan?: boolean; label: string }) {
  return (
    <section id={id} className={PAGE} aria-label={label}>
      <picture>
        {tall && <source media="(max-width: 767px)" srcSet={tall} />}
        <img src={src} alt={alt} className={PIC} style={{ objectPosition: position ?? "center" }} loading="lazy" decoding="async" />
      </picture>
      {slogan && <SloganLine />}
    </section>
  );
}

/** The founder's voice, read in the owner's cloned voice by the server when ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID are set; hidden otherwise. */
function FounderVoice() {
  const [ready, setReady] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const ok = () => setReady(true);
    el.addEventListener("loadedmetadata", ok);
    return () => el.removeEventListener("loadedmetadata", ok);
  }, []);
  return (
    <div className={ready ? "mx-auto mt-10 max-w-2xl rounded-2xl border border-emerald-300/35 bg-[#020c0a]/80 p-5 text-left backdrop-blur-md" : "hidden"} data-testid="founder-voice">
      <p className="text-[11px] font-extrabold uppercase tracking-[.22em] text-emerald-300">Hear it from Sam Russell</p>
      <p className="mt-1 text-sm text-white/75">One minute, in his own voice, on why this exists.</p>
      <audio ref={audio} controls preload="metadata" src="/api/founder-message.mp3" className="mt-3 w-full" aria-label="A message from Sam Russell" />
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const NAV = [
    { href: "#claims", label: "The technologies" },
    { href: "#planning-estimator", label: "Start" },
  ];

  return (
    <div id="main-content" tabIndex={-1} className="rc-homepage rc-homepage-type-scale relative min-h-screen bg-[#03090a] text-[#c8d8ec] outline-none">
      {/* ── NAV ── */}
      <nav className="rc-concept16-nav fixed inset-x-0 top-0 z-50" aria-label="Public navigation">
        <div className="container pt-4">
          <div className="flex min-h-[4.6rem] items-center justify-between gap-4 rounded-2xl border border-emerald-300/30 bg-[#020a09]/65 px-5 shadow-[0_24px_70px_rgba(0,0,0,.45)] backdrop-blur-xl lg:px-6">
            <a href="#top" className="flex min-w-0 items-center gap-3" aria-label="Russell Capital Systems homepage">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-300/55 bg-emerald-300/12 text-base font-black text-emerald-300 shadow-[inset_0_0_22px_rgba(52,211,153,.15),0_0_18px_rgba(52,211,153,.25)]">R</span>
              <span className="hidden truncate text-base font-bold text-white min-[420px]:inline lg:text-lg" style={{ fontFamily: "DM Sans, sans-serif" }}>Russell Capital Systems™</span>
            </a>
            <div className="hidden items-center gap-6 text-sm xl:flex">
              {NAV.map(({ href, label }) => <a key={href} href={href} className="text-white/80 transition-colors hover:text-emerald-300">{label}</a>)}
            </div>
            <div className="flex items-center gap-2">
              <ManagedPortalAction href="/portal/dashboard" className="rc-btn whitespace-nowrap border border-emerald-300/35 bg-emerald-300/10 text-sm text-white hover:bg-emerald-300/20"><Lock size={14} /> {isAuthenticated ? "Dashboard" : "Physician Login"}</ManagedPortalAction>
              <button type="button" className="rounded-lg border border-white/15 p-2 text-white xl:hidden" aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
            </div>
          </div>
          {menuOpen && (
            <div className="mt-2 rounded-2xl border border-emerald-300/20 bg-[#020a09]/95 p-3 shadow-xl backdrop-blur-xl xl:hidden">
              {NAV.map(({ href, label }) => <a key={href} href={href} className="block rounded-lg px-4 py-3 text-white/80 hover:bg-white/5 hover:text-emerald-300" onClick={() => setMenuOpen(false)}>{label}</a>)}
            </div>
          )}
        </div>
      </nav>

      {/* ── 1 · THE SIGN. Its words are the headline; nothing else on the picture. ── */}
      <header id="top" className={PAGE} aria-label="Financial and Tax Relief and Recovery for Physicians, Psychiatrists, and Surgeons">
        <picture>
          <source media="(max-width: 767px)" srcSet="/rcs-neon-a-tall.webp" width={1080} height={2160} />
          <img src="/rcs-neon-a.webp" alt="Neon sign reading Financial & Tax Relief and Recovery for Physicians, Psychiatrists, & Surgeons, over a glowing green city skyline" width={1920} height={1080} className={`${PIC} max-md:object-[center_12%] lg:object-[25%_center] xl:object-center`} fetchPriority="high" decoding="async" />
        </picture>
        <h1 className="sr-only">Financial &amp; Tax Relief and Recovery For Physicians, Psychiatrists, &amp; Surgeons</h1>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-6 z-10 flex justify-center text-[10px] font-bold uppercase tracking-[.3em] text-emerald-300/70">Scroll</div>
      </header>

      {/* ── 2 to 5 · THE FIFTEEN, starting on the very next screen. Four city plates, one after another, each
          carrying a run of the plaques; no picture is left empty and nothing sits between the sign and the patents. ── */}
      <div id="claims" aria-label="Patent-pending technologies">
        {PLATES.map((plate, i) => {
          const last = i === PLATES.length - 1;
          return (
            <section key={plate.src} className="rc-plate relative flex min-h-[300svh] items-center py-24 sm:py-32" aria-label={plate.label}>
              <picture>
                {plate.tall && <source media="(max-width: 767px)" srcSet={plate.tall} />}
                <img src={plate.src} alt="" aria-hidden="true" className="rc-plate-pic" style={{ objectPosition: plate.position ?? "center" }} loading="lazy" decoding="async" />
              </picture>
              <div className="rc-plate-shade" aria-hidden="true" />
              <div className="container relative z-10 max-w-5xl">
                {i === 0 && <p className="mb-8 text-[11px] font-extrabold uppercase tracking-[.26em] text-emerald-300/85">Patent-pending technologies</p>}
                <ol className="grid gap-8">
                  {manifesto.claims.slice(plate.from, plate.to).map(({ ref, name, lead, detail }) => (
                    <li key={ref} id={`claim-${ref}`} className="rc-plaque">
                      <p className="rc-plaque-eyebrow">Technology {ref} <span aria-hidden="true">·</span> Pending <span aria-hidden="true">·</span> Only at RCS</p>
                      <div className="rc-patent-title-wrap mt-3">
                        <h3 className="rc-patent-title text-[clamp(2.2rem,4.8vw,4.2rem)]">{name}</h3>
                        <svg className="rc-filament" viewBox="0 0 1000 14" preserveAspectRatio="none" aria-hidden="true"><path d="M0 7 C 120 1, 240 13, 360 7 S 600 1, 720 7 S 940 13, 1000 7" /></svg>
                      </div>
                      <p className="rc-patent-body rc-patent-lead mt-4 text-[clamp(2rem,3.6vw,3.1rem)] leading-[1.22]">{lead}</p>
                      <p className="rc-patent-body rc-patent-detail mt-4 max-w-4xl text-[clamp(1.8rem,2.95vw,2.5rem)] leading-[1.36]">{detail}</p>
                      <a href="#planning-estimator" className="rc-plaque-link mt-6">See the mechanism <span aria-hidden="true">→</span></a>
                    </li>
                  ))}
                </ol>
                {last && (
                  <>
                    <p className="mt-12 text-[.92rem] text-white/55">{manifesto.status}</p>
                    <p className="mx-auto mt-6 max-w-3xl text-[11px] leading-relaxed text-white/50">{manifesto.disclaimer}</p>
                    <FounderVoice />
                  </>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {/* ── 6 · THE SIGN AGAIN, at night. The slogan, one line. ── */}
      <ImagePage src="/rcs-neon-b.webp" tall="/rcs-neon-b-tall.webp" alt="Neon sign reading Financial & Tax Relief and Recovery for Physicians, Psychiatrists, & Surgeons over a green city at night" slogan label="The sign at night: the slogan" />

      {/* ── 7 · THE LEAD CARD. The only form on the page, and the last thing on it. ── */}
      <HomeLeadFactFinder />

      <footer className="border-t border-emerald-300/15 py-8">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-[#7a95b8] md:flex-row">
          <div>
            <div><span className="text-[#22c55e]">RCS</span> Russell Capital Systems™ © {new Date().getFullYear()}. All rights reserved.</div>
            <SiteIdentity />
          </div>
          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            <a href={CALENDLY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white">Book a review</a>
            <Link href="/calculators" className="hover:text-white">Calculators</Link>
            <Link href="/ultra-calculator" className="hover:text-white">Ultra Calculator</Link>
            <Link href="/fact-finder" className="hover:text-white">Fact Finder</Link>
            <Link href="/pricing" className="hover:text-white">Pricing</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
