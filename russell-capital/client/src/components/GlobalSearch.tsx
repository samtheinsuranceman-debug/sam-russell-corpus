// @ts-nocheck
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Search, X, ArrowRight, Sparkles, Clock, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import { ALL_TOOLS, CATEGORY_COLORS, type ToolEntry } from "@/lib/toolSearchIndex";

const MAX_RESULTS = 12;
const RECENT_KEY = "rc_recent_tools";

function getRecentTools(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]").slice(0, 5);
  } catch { return []; }
}

function addRecentTool(path: string) {
  try {
    const recent = getRecentTools().filter(p => p !== path);
    recent.unshift(path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
  } catch {}
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [, navigate] = useLocation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) {
      const recent = getRecentTools();
      return recent.map(path => ALL_TOOLS.find(t => t.path === path)).filter(Boolean).slice(0, 5) as ToolEntry[];
    }
    const q = query.toLowerCase().trim();
    const terms = q.split(/\s+/);
    const scored = ALL_TOOLS.map(tool => {
      const label = tool.label.toLowerCase();
      const path = tool.path.toLowerCase();
      const keywords = tool.keywords.toLowerCase();
      const category = tool.category.toLowerCase();
      const combined = `${label} ${path} ${keywords} ${category}`;
      let score = 0;
      let allMatch = true;
      for (const term of terms) {
        if (!combined.includes(term)) { allMatch = false; break; }
        if (label.startsWith(term)) score += 100;
        else if (label.includes(term)) score += 60;
        if (path.includes(term)) score += 40;
        if (keywords.includes(term)) score += 20;
        if (category.includes(term)) score += 30;
      }
      if (label === q) score += 500;
      if (label.startsWith(q)) score += 200;
      return { tool, score, match: allMatch };
    }).filter(s => s.match && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map(s => s.tool);
    return scored;
  }, [query]);

  useEffect(() => { setSelectedIdx(0); }, [results]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIdx]) { e.preventDefault(); goTo(results[selectedIdx].path); }
    else if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
  }, [results, selectedIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); inputRef.current?.focus(); setFocused(true); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function goTo(path: string) {
    addRecentTool(path);
    navigate(path);
    setQuery("");
    setFocused(false);
  }

  const isRecent = !query.trim();

  return (
    <div ref={wrapperRef} className="relative hidden md:block flex-1 max-w-md mx-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a8e]" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search 593 tools... (Ctrl+K)"
          className="w-full pl-9 pr-8 py-1.5 rounded-lg bg-[#0b1628] border border-[#12233e] text-sm text-white placeholder-[#4a6a8e] outline-none focus:border-[#22c55e]/40 focus:ring-1 focus:ring-[#22c55e]/20 transition-all"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a6a8e] hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>
      {focused && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a1225] border border-[#1a3055] rounded-xl shadow-2xl z-50 overflow-hidden max-h-[420px] overflow-y-auto">
          {isRecent && (
            <div className="px-3 py-2 text-[10px] font-semibold text-[#4a6a8e] uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={10} /> Recent Tools
            </div>
          )}
          {results.map((tool, i) => (
            <button
              key={tool.path}
              onClick={() => goTo(tool.path)}
              onMouseEnter={() => setSelectedIdx(i)}
              className={`w-full px-3 py-2.5 flex items-center gap-3 text-left transition-colors ${
                i === selectedIdx ? "bg-[#22c55e]/10 border-l-2 border-[#22c55e]" : "border-l-2 border-transparent hover:bg-[#0f1d35]"
              }`}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CATEGORY_COLORS[tool.category] || "#666" }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate font-medium">{tool.label}</div>
                <div className="text-[10px] text-[#4a6a8e] truncate">{tool.category}</div>
              </div>
              <ChevronRight size={12} className="text-[#4a6a8e] shrink-0" />
            </button>
          ))}
          {!isRecent && (
            <div className="px-3 py-2 text-[10px] text-[#4a6a8e] border-t border-[#12233e] flex items-center justify-between">
              <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-[#12233e] rounded text-[9px]">↑↓</kbd> navigate
                <kbd className="px-1 py-0.5 bg-[#12233e] rounded text-[9px] ml-1">↵</kbd> open
              </span>
            </div>
          )}
          <button
            onClick={() => { navigate("/portal/tool-explorer"); setFocused(false); setQuery(""); }}
            className="w-full px-3 py-2.5 flex items-center gap-2 text-left border-t border-[#12233e] hover:bg-[#0f1d35] transition-colors"
          >
            <Sparkles size={12} className="text-[#22c55e]" />
            <span className="text-xs text-[#22c55e] font-medium">Browse all 593 tools by category</span>
            <ArrowRight size={12} className="text-[#22c55e] ml-auto" />
          </button>
        </div>
      )}
      {focused && !isRecent && results.length === 0 && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#0a1225] border border-[#1a3055] rounded-xl shadow-2xl z-50 p-4 text-center">
          <p className="text-sm text-[#4a6a8e]">No tools found for "{query}"</p>
          <button
            onClick={() => { navigate("/portal/tool-explorer"); setFocused(false); setQuery(""); }}
            className="mt-2 text-xs text-[#22c55e] hover:underline"
          >
            Browse all tools by category
          </button>
        </div>
      )}
    </div>
  );
}
