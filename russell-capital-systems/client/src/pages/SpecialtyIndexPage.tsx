// ============================================================
// FOR EVERY KIND OF DOCTOR — the index of the specialty landing pages.
// ============================================================
import { Link } from "wouter";
import PageBackdrop from "@/components/PageBackdrop";
import { trpc } from "@/lib/trpc";
import { CAREER_PATHS, FAMILY_LABEL, trainingYears, type Family } from "@shared/careerEngine";
import { ArrowRight, Stethoscope } from "lucide-react";

const FAMILIES: Family[] = ["physician", "surgeon", "psychiatry", "dentist", "dental-specialist", "veterinarian", "attorney"];

export default function SpecialtyIndexPage() {
  const status = trpc.career.status.useQuery(undefined, { staleTime: 5 * 60_000, retry: false });
  return (
    <div className="relative min-h-screen bg-[#070b14] text-white">
      <PageBackdrop src="/rcs-city-skyway.webp" phoneSrc="/rcs-city-flagship.webp" alt="Green-lit skyline at night with a lit highway sweeping through the city" fade="#070b14" brightness=".45" />
      <div className="relative mx-auto max-w-5xl px-4 py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80"><Stethoscope size={12} className="mr-1 inline" /> The Career Ledger</p>
        <h1 className="mt-2 text-3xl font-semibold">For every kind of doctor, and the professions beside them</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">One page per specialty: how many years the training takes, with the accreditor's page; what the Bureau of Labor Statistics says your specialty earns in every state, with the year; what the degree and the loan really cost under the federal rate for each year; what the residency years forgo; and where you stand beside peers who entered their own numbers. Every figure has a source or is yours.</p>
        {status.data && <p className="mt-2 text-xs text-white/50">Record on this host: BLS {status.data.bls.years.length ? `${Math.min(...status.data.bls.years)}–${Math.max(...status.data.bls.years)}` : "not read yet"} · NCES {status.data.nces.national ? `${status.data.nces.national.from}–${status.data.nces.national.to}` : "not read yet"} · {status.data.paths} specialties.</p>}
        {FAMILIES.map((f) => (
          <section key={f} className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/60">{FAMILY_LABEL[f]}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CAREER_PATHS.filter((p) => p.family === f).map((p) => (
                <Link key={p.slug} href={`/for/${p.slug}`} className="rounded-2xl border border-emerald-400/20 bg-white/[0.04] p-4 hover:border-emerald-300/50">
                  <div className="font-semibold">{p.title}</div>
                  <div className="mt-1 text-xs text-white/60">{trainingYears(p)} years from the first day of the degree · BLS {p.soc.code}</div>
                  <div className="mt-2 text-xs text-emerald-300">Open the ledger <ArrowRight size={11} className="inline" /></div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
