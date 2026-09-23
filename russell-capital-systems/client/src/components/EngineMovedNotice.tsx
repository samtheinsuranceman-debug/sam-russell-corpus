/**
 * EngineMovedNotice — what a route shows when its page was an unfinished stub.
 *
 * Three routes (/portal/iul-projection, /portal/myga-waterfall,
 * /portal/income-annuity) rendered placeholder tabs, a fixed "Page Insights
 * Score: 92/100" that nothing computed, and hard-coded projections that ignored
 * their own inputs. Fabricated scores and numbers on a live route are
 * misleading (FTC Act §5; NAIC Model 570 §4.A), so each route now says plainly
 * where the working engine is. The product disclosure line is printed above
 * this by PolicyDisclosureSlot in App.tsx.
 */
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function EngineMovedNotice({ title, summary, href, linkLabel }: { title: string; summary: string; href: string; linkLabel: string }) {
  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 text-white">
      <div className="mx-auto max-w-2xl space-y-4 pt-8">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-300">{summary}</p>
        <Link href={href} className="inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-4 py-2 font-semibold text-white hover:bg-[#1ca34d]">
          {linkLabel} <ArrowRight className="h-4 w-4" />
        </Link>
        <p className="pt-6 text-xs text-gray-500">
          Everything on this site is hypothetical and educational, based on the facts you enter; it is not tax, legal or investment advice.
          Life insurance and annuities are issued by insurance companies, and guarantees are subject to the issuing insurer's claims-paying ability.
        </p>
      </div>
    </div>
  );
}
