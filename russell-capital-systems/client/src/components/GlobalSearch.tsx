import { useState, useRef, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const SEARCHABLE_PAGES = [
  { path: "/portal", label: "Dashboard", keywords: "home overview stats" },
  { path: "/portal/clients", label: "Clients", keywords: "contacts people" },
  { path: "/portal/pipeline", label: "Pipeline", keywords: "deals opportunities funnel" },
  { path: "/portal/meetings", label: "Meetings", keywords: "calendar schedule" },
  { path: "/portal/strategy", label: "Strategy Lab", keywords: "roth iul conversion" },
  { path: "/portal/mortgage-killer", label: "Mortgage Killer", keywords: "heloc payoff" },
  { path: "/portal/quick-quote", label: "Quick Quote", keywords: "estimate premium" },
  { path: "/portal/billing", label: "Billing", keywords: "subscription payment" },
  { path: "/portal/knowledge", label: "Knowledge", keywords: "docs library" },
  { path: "/portal/team", label: "Team", keywords: "members advisors" },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [, navigate] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Use shared auth hook — no duplicate trpc.auth.me query
  const { isAuthenticated } = useAuth();
  const { data: clients } = trpc.clients.list.useQuery(undefined, {
    enabled: focused && query.length > 0 && isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const pages = SEARCHABLE_PAGES.filter(
      (p) => p.label.toLowerCase().includes(q) || p.keywords.includes(q)
    ).map((p) => ({ type: "page" as const, label: p.label, path: p.path }));

    const clientMatches = (clients ?? [])
      .filter((c: any) => (c.name ?? "").toLowerCase().includes(q))
      .slice(0, 4)
      .map((c: any) => ({
        type: "client" as const,
        label: c.name ?? "Unknown",
        path: `/portal/clients/${c.id}`,
      }));

    return [...pages.slice(0, 4), ...clientMatches];
  }, [query, clients]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="relative hidden md:block flex-1 max-w-xs mx-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a8e]" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search... (Ctrl+K)"
          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0b1628] border border-[#12233e] text-sm text-white placeholder-[#4a6a8e] outline-none focus:border-[#22c55e]/40 transition-colors"
        />
      </div>
      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0b1628] border border-[#1a3055] rounded-lg shadow-xl z-50 overflow-hidden">
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.path}-${i}`}
              onClick={() => {
                navigate(r.path);
                setQuery("");
                setFocused(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#12233e] transition-colors"
            >
              <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] uppercase">
                {r.type}
              </span>
              <span className="text-sm text-white truncate">{r.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
