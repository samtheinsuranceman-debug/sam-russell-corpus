// ============================================================
// The pointer from every mortgage-destruction page into the
// Alternative Lines of Credit tab.
//
// Those pages all assume the capital already exists — a HELOC is drawn, a
// policy is funded, a property is bought. The tab this links to is where the
// capital comes from when a bank says no, which is the step they skip. One
// component so the wording stays identical on all of them and so a moved
// route is one edit rather than four.
// ============================================================
import { Link } from "wouter";
import { Landmark } from "lucide-react";

export function AltCreditLink({ context }: { context?: string }) {
  return (
    <div className="mt-6 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-4">
      <div className="flex items-start gap-2.5">
        <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
        <div>
          <p className="text-[13.5px] leading-relaxed text-slate-200">
            {context ?? "This page assumes the line of credit exists."} If a bank has already said no — or the
            property is an investment rather than a residence, which is usually why they said no — there are
            fifteen other routes to the same capital, each with named lenders, published rates and the
            underwriting gate stated before the pitch.
          </p>
          <Link to="/portal/alt-credit"
                className="mt-2 inline-block text-[13px] font-medium text-amber-300 hover:underline">
            Alternative Lines of Credit for Rental Properties →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AltCreditLink;
