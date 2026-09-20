import { useSearch } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Stethoscope, ChevronRight } from "lucide-react";

export default function NavPlaceholder() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const title = params.get("t") || "Untitled Section";
  const breadcrumbStr = params.get("bc") || "";
  const crumbs = breadcrumbStr ? breadcrumbStr.split(" › ").filter(Boolean) : [];

  return (
    <AppShell>
      <div className="p-6 max-w-2xl mx-auto">
        {crumbs.length > 0 && (
          <nav className="flex items-center gap-1 flex-wrap mb-4 text-[11px] text-[#7a95b8]">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} className="opacity-40" />}
                <span>{c}</span>
              </span>
            ))}
            <ChevronRight size={10} className="opacity-40" />
            <span className="text-white font-semibold">{title}</span>
          </nav>
        )}

        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 border border-[#22c55e]/25 flex items-center justify-center flex-shrink-0">
            <Stethoscope size={20} className="text-[#22c55e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">{title}</h1>
            <p className="text-[#7a95b8] text-sm mt-1">Financial Health Clinic — Coming Soon</p>
          </div>
        </div>

        <div className="rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5 p-5 mb-4">
          <p className="text-sm text-white/80 leading-relaxed">
            This section of the <span className="text-[#22c55e] font-semibold">Russell Capital Financial Health Clinic</span> is
            being developed. Specialized tools and resources for{" "}
            <span className="text-white font-medium">{title}</span> will be available here soon.
          </p>
        </div>

        <div className="rounded-xl border border-[#12233e] bg-[#080f1e] p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#4a6a8e] font-bold mb-2">Navigation Context</p>
          <div className="flex flex-wrap gap-1.5">
            {crumbs.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#12233e] text-[11px] text-[#7a95b8]">
                {i > 0 && <ChevronRight size={8} className="opacity-40" />}
                {c}
              </span>
            ))}
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#22c55e]/15 border border-[#22c55e]/25 text-[11px] text-[#22c55e] font-semibold">
              {title}
            </span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
