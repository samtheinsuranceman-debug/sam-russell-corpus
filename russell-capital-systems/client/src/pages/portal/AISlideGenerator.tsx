import { useState, useMemo } from "react";
import { PieChart as RPieChart, Pie, Cell, BarChart as RBarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAccess } from "@/contexts/AccessContext";
import ThemePicker from "@/components/ThemePicker";
import { DEFAULT_THEME_ID, getThemeById } from "@shared/slideThemes";
import {
  Sparkles, Presentation, ChevronRight, ChevronLeft, Download, Eye, Maximize2, Minimize2,
  Loader2, BarChart3, Shield, DollarSign, TrendingUp, Clock, FileText, Copy,
  Zap, Target, PieChart, Scale, Lock, Layers, FileDown, Save, Search, Plus, Trash2, ArrowRight
} from "lucide-react";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";

const LAYOUT_ICONS: Record<string, any> = {
  title: Presentation,
  content: FileText,
  comparison: BarChart3,
  metrics: DollarSign,
  timeline: Clock,
  summary: Target,
};

const LAYOUT_COLORS: Record<string, string> = {
  title: "text-violet-400 bg-violet-500/10 border-violet-500/20",
  content: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  comparison: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  metrics: "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20",
  timeline: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  summary: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const TOPIC_PRESETS = [
  { id: "roth_conversion", label: "Roth Conversion Strategy", icon: TrendingUp, prompt: "Create a comprehensive Roth conversion strategy presentation covering tax bracket optimization, multi-year conversion ladder, Solar Strategy benefits, and projected tax-free retirement income." },
  { id: "iul_strategy", label: "IUL Policy Overview", icon: Shield, prompt: "Build a presentation explaining Indexed Universal Life insurance — how it works, historical performance based on Ibbotson data, floor/cap protection, tax-free policy loans, and comparison to traditional investments." },
  { id: "estate_planning", label: "Estate Planning", icon: Scale, prompt: "Create an estate planning presentation covering wealth transfer strategies, trust structures, estate tax minimization, beneficiary optimization, and multi-generational wealth preservation." },
  { id: "retirement_income", label: "Retirement Income Plan", icon: PieChart, prompt: "Build a retirement income presentation showing income gap analysis, Social Security optimization, annuity income riders, withdrawal sequencing, and guaranteed lifetime income strategies." },
  { id: "mortgage_killer", label: "Mortgage Killer IUL", icon: Zap, prompt: "Create a Mortgage Killer IUL presentation showing how IUL cash value can eliminate mortgage debt, HELOC integration, interest savings analysis, and total opportunity cost accomplished." },
  { id: "solar_strategy", label: "Solar Strategy", icon: Sparkles, prompt: "Build a Solar Strategy presentation explaining the multi-stage approach: Roth conversion → solar ITC bonus (20-28%) → new annuity bonus (10-26%) → tax-free guaranteed income for life, with before/after comparisons." },
  { id: "tax_planning", label: "Tax Optimization", icon: DollarSign, prompt: "Create a tax planning presentation covering tax bracket management, Roth conversion timing, tax-loss harvesting, IRMAA avoidance, and long-term tax savings projections." },
  { id: "annuity_review", label: "Annuity Review & 1035", icon: Layers, prompt: "Build an annuity review presentation with replacement radar scoring, 1035 exchange analysis, surrender charge evaluation, and comparison of current vs. recommended products." },
];

interface GeneratedSlide {
  title: string;
  subtitle: string;
  bullets: string[];
  speakerNotes: string;
  layout: string;
}

export default function AISlideGenerator() {
  const { data: clients, isLoading: clientsLoading } = trpc.clients.list.useQuery();
  const { tier } = useAccess();
  const isPaid = tier === "owner" || tier === "unlimited" || tier === "subscriber" || tier === "trial";

  const [prompt, setPrompt] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("none");
  const [slideCount, setSlideCount] = useState<number>(8);
  const [audience, setAudience] = useState<"client" | "advisor" | "team">("client");
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("generator");

  const { data: slideQuota, refetch: refetchQuota } = trpc.slides.remainingToday.useQuery(undefined, {
    staleTime: 30_000,
  });

  const pptxMut = trpc.ai.generatePptx.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      if (data.isTrialExport) {
        toast.success("PowerPoint downloaded (Trial)", {
          description: "This file contains a 'Generated with Trial' watermark. Upgrade to remove it.",
          duration: 8000,
        });
      } else {
        toast.success("PowerPoint downloaded", { description: data.fileName });
      }
    },
    onError: (err) => toast.error("PPTX generation failed", { description: err.message }),
  });

  const saveMut = trpc.slides.save.useMutation({
    onSuccess: () => {
      toast.success("Saved to My Slides library", {
        action: { label: "View Library", onClick: () => (window.location.href = "/portal/my-slides") },
      });
    },
    onError: (err) => toast.error("Failed to save", { description: err.message }),
  });

  const handleExportPptx = () => {
    if (!slides.length) return;
    const selectedClient = clients?.find((c) => String(c.id) === selectedClientId);
    pptxMut.mutate({
      toolName: "AI Slide Generator",
      clientName: selectedClient ? selectedClient.name : undefined,
      audience,
      themeId,
      slides,
      includeDisclaimer,
    });
  };

  const handleSave = () => {
    if (!slides.length) return;
    const selectedClient = clients?.find((c) => String(c.id) === selectedClientId);
    saveMut.mutate({
      title: prompt.slice(0, 100) || "Untitled Deck",
      toolName: "AI Slide Generator",
      clientName: selectedClient ? selectedClient.name : undefined,
      audience,
      slides,
    });
  };

  const generateMut = trpc.ai.generateSlidesFromPrompt.useMutation({
    onSuccess: (data) => {
      refetchQuota();
      if (data.slides.length > 0) {
        setSlides(data.slides);
        setActiveSlideIndex(0);
        setPreviewMode(true);
        toast.success(`Generated ${data.slides.length} slides`, {
          description: data.clientName ? `Personalized for ${data.clientName}` : "Ready for review",
        });
      } else {
        toast.error("No slides generated. Try a more specific prompt.");
      }
    },
    onError: (err) => {
      toast.error("Failed to generate slides", { description: err.message });
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Enter a prompt or select a topic preset");
      return;
    }
    generateMut.mutate({
      prompt: prompt.trim(),
      clientId: selectedClientId && selectedClientId !== "none" ? Number(selectedClientId) : undefined,
      slideCount,
      audience,
    });
  };

  const handlePresetClick = (preset: typeof TOPIC_PRESETS[0]) => {
    setPrompt(preset.prompt);
    toast.info(`Loaded "${preset.label}" preset — click Generate to create slides`);
  };

  const handleExportMarkdown = () => {
    if (!slides.length) return;
    let md = `# Russell Capital Systems™ Presentation\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    md += `**Audience:** ${audience === "client" ? "Client-Facing" : audience === "advisor" ? "Advisor" : "Internal Team"}\n\n---\n\n`;

    slides.forEach((slide, i) => {
      md += `## Slide ${i + 1}: ${slide.title}\n`;
      if (slide.subtitle) md += `*${slide.subtitle}*\n`;
      md += "\n";
      slide.bullets.forEach((b) => { md += `- ${b}\n`; });
      if (slide.speakerNotes) md += `\n> **Speaker Notes:** ${slide.speakerNotes}\n`;
      md += "\n---\n\n";
    });

    if (includeDisclaimer) {
      md += "\n## Disclaimer\n\nThis presentation is for educational and informational purposes only. It does not constitute financial, tax, or legal advice. Past performance does not guarantee future results. Illustrations shown are hypothetical and may not reflect actual outcomes. Consult with a qualified financial professional before making any investment decisions.\n\n*Russell Capital Systems™ — All Rights Reserved*\n";
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RCS_Presentation_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  };

  const handleExportHTML = () => {
    if (!slides.length) return;
    let html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Russell Capital Systems™ Presentation</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;background:#0f172a;color:#e2e8f0}
.slide{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:4rem 6rem;border-bottom:1px solid rgba(255,255,255,0.1);page-break-after:always}
.slide-num{font-size:0.75rem;color:rgba(255,255,255,0.3);margin-bottom:1rem;text-transform:uppercase;letter-spacing:0.1em}
h1{font-size:2.5rem;font-weight:700;margin-bottom:0.5rem;background:linear-gradient(135deg,#22c55e,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
h2{font-size:1.1rem;color:rgba(255,255,255,0.5);margin-bottom:2rem;font-weight:400}
ul{list-style:none;padding:0}
li{padding:0.75rem 0;padding-left:2rem;position:relative;font-size:1.15rem;line-height:1.6;border-bottom:1px solid rgba(255,255,255,0.05)}
li::before{content:'▸';position:absolute;left:0;color:#22c55e;font-weight:700}
.brand{position:fixed;bottom:1rem;right:2rem;font-size:0.7rem;color:rgba(255,255,255,0.2)}
.notes{margin-top:2rem;padding:1rem;background:rgba(255,255,255,0.03);border-radius:0.5rem;font-size:0.85rem;color:rgba(255,255,255,0.4);font-style:italic}
@media print{.slide{min-height:auto;padding:2rem}.brand{display:none}}
</style></head><body>\n`;

    slides.forEach((slide, i) => {
      html += `<div class="slide"><div class="slide-num">Slide ${i + 1} of ${slides.length}</div><h1>${escapeHtml(slide.title)}</h1><h2>${escapeHtml(slide.subtitle)}</h2><ul>${slide.bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>`;
      if (showSpeakerNotes && slide.speakerNotes) {
        html += `<div class="notes">📝 ${escapeHtml(slide.speakerNotes)}</div>`;
      }
      html += `</div>\n`;
    });

    if (includeDisclaimer) {
      html += `<div class="slide"><h1>Disclaimer</h1><p style="margin-top:2rem;line-height:1.8;color:rgba(255,255,255,0.5)">This presentation is for educational and informational purposes only. It does not constitute financial, tax, or legal advice. Past performance does not guarantee future results. Illustrations shown are hypothetical and may not reflect actual outcomes. Consult with a qualified financial professional before making any investment decisions.</p></div>\n`;
    }

    html += `<div class="brand">Russell Capital Systems™</div></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RCS_Presentation_${new Date().toISOString().slice(0, 10)}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as HTML presentation");
  };

  const handleExportCSV = () => {
    if (!slides.length) return;
    const headers = ["Slide Number", "Layout", "Title", "Subtitle", "Bullets", "Speaker Notes"];
    const csvContent = [
      headers.join(","),
      ...slides.map((s, i) => [
        i + 1,
        s.layout,
        `"${s.title.replace(/"/g, '""')}"`,
        `"${s.subtitle.replace(/"/g, '""')}"`,
        `"${s.bullets.join("; ").replace(/"/g, '""')}"`,
        `"${s.speakerNotes.replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RCS_Presentation_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as CSV");
  };

  const handleCopyToClipboard = () => {
    if (!slides.length) return;
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.subtitle}\n${s.bullets.map((b) => `  • ${b}`).join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Slides copied to clipboard");
  };

  const activeSlide = slides[activeSlideIndex];

  const chartColors = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"];
  const tooltipStyle = { background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 };

  const layoutDistribution = useMemo(() => {
    if (!slides.length) return [];
    const counts = slides.reduce((acc, slide) => {
      acc[slide.layout] = (acc[slide.layout] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [slides]);

  const slideLengths = useMemo(() => {
    if (!slides.length) return [];
    return slides.map((slide, i) => ({
      name: `Slide ${i + 1}`,
      bullets: slide.bullets.length,
      notesLength: slide.speakerNotes.length
    }));
  }, [slides]);

  const filteredPresets = useMemo(() => {
    if (!searchTerm) return TOPIC_PRESETS;
    const lowerSearch = searchTerm.toLowerCase();
    return TOPIC_PRESETS.filter((p) => 
      p.label.toLowerCase().includes(lowerSearch) || 
      p.prompt.toLowerCase().includes(lowerSearch)
    );
  }, [searchTerm]);

  if (!isPaid) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="rc-card border-[#f0c040]/30 bg-[#f0c040]/5 max-w-md w-full">
            <div className="p-8 text-center space-y-4">
              <Lock className="h-16 w-16 text-[#f0c040] mx-auto" />
              <h2 className="text-xl font-bold text-white">AI Slide Generator™</h2>
              <p className="text-[#7a95b8]">
                This premium feature is available to paid subscribers. Upgrade your plan to generate
                AI-powered slide presentations from any tool on the platform.
              </p>
              <button className="rc-btn rc-btn-primary w-full mt-4" onClick={() => window.location.href = "/pricing"}>
                View Plans & Upgrade
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (fullscreenPreview && activeSlide) {
    const Icon = LAYOUT_ICONS[activeSlide.layout] || Presentation;
    return (
      <div className="fixed inset-0 z-50 bg-[#0d1a2e] flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-black/40 border-b border-[#12233e]">
          <div className="flex items-center gap-3">
            <span className="rc-badge rc-badge-green text-xs">
              {activeSlide.layout.toUpperCase()}
            </span>
            <span className="text-[#7a95b8] text-sm">Slide {activeSlideIndex + 1} of {slides.length}</span>
          </div>
          <div className="flex gap-2">
            <button className="rc-btn rc-btn-ghost text-[#c8d8ec]" onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </button>
            <button className="rc-btn rc-btn-ghost text-[#c8d8ec]" onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </button>
            <button className="rc-btn rc-btn-ghost text-white border border-[#12233e]" onClick={() => setFullscreenPreview(false)}>
              <Minimize2 className="h-4 w-4 mr-1" /> Exit
            </button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="w-full max-w-5xl aspect-[16/9] rounded-2xl border border-[#12233e] shadow-2xl p-12 flex flex-col justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${getThemeById(themeId).bgAlt}, ${getThemeById(themeId).bgColor})` }}>
            {/* Decorative accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#22c55e] via-[#10b981] to-transparent" />
            <div className="absolute top-4 right-6 opacity-10">
              <Icon className="h-24 w-24 text-[#22c55e]" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <Icon className="h-8 w-8 text-[#22c55e]" />
              <h1 className="text-3xl font-bold text-white">{activeSlide.title}</h1>
            </div>
            {activeSlide.subtitle && <p className="text-lg text-white/50 mb-8">{activeSlide.subtitle}</p>}
            <ul className="space-y-3 max-w-3xl">
              {activeSlide.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3">
                  <ChevronRight className="h-5 w-5 text-[#22c55e] mt-0.5 shrink-0" />
                  <span className="text-lg text-white/90">{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="px-6 py-2 bg-black/40 border-t border-[#12233e] flex items-center justify-between">
          <p className="text-[#7a95b8] text-xs">Russell Capital Systems™ — Confidential</p>
          {showSpeakerNotes && activeSlide.speakerNotes && (
            <p className="text-[#7a95b8] text-xs italic max-w-xl truncate">📝 {activeSlide.speakerNotes}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="rc-page-title flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-[#22c55e]" />
              AI Slide Generator™
              <span className="rc-badge rc-badge-green text-xs ml-2">PRO</span>
            </h1>
            <p className="rc-page-subtitle mt-1">
              Generate polished, branded presentations from any topic or tool data with AI
            </p>
          </div>
          {slides.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button className="rc-btn rc-btn-ghost" onClick={() => { setPreviewMode(true); setFullscreenPreview(true); }}>
                <Maximize2 className="h-4 w-4 mr-1" /> Fullscreen
              </button>
              <button className="rc-btn rc-btn-ghost" onClick={handleExportMarkdown}>
                <Download className="h-4 w-4 mr-1" /> Markdown
              </button>
              <button className="rc-btn rc-btn-ghost" onClick={handleExportHTML}>
                <FileText className="h-4 w-4 mr-1" /> HTML
              </button>
              <button className="rc-btn rc-btn-ghost" onClick={handleExportCSV}>
                <BarChart3 className="h-4 w-4 mr-1" /> CSV
              </button>
              <button className="rc-btn rc-btn-ghost text-[#22c55e] hover:bg-[#22c55e]/10" onClick={handleExportPptx} disabled={pptxMut.isPending}>
                {pptxMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileDown className="h-4 w-4 mr-1" />} PowerPoint
              </button>
              <button className="rc-btn rc-btn-ghost text-[#f0c040] hover:bg-[#f0c040]/10" onClick={handleSave} disabled={saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
              </button>
              <button className="rc-btn rc-btn-ghost" onClick={handleCopyToClipboard}>
                <Copy className="h-4 w-4 mr-1" /> Copy
              </button>
            </div>
          )}
        </div>

        {/* Stats Row */}
        {slides.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rc-card">
              <div className="rc-stat-label">Total Slides</div>
              <div className="rc-stat-value">{slides.length}</div>
            </div>
            <div className="rc-card">
              <div className="rc-stat-label">Total Bullets</div>
              <div className="rc-stat-value">{slides.reduce((acc, s) => acc + s.bullets.length, 0)}</div>
            </div>
            <div className="rc-card">
              <div className="rc-stat-label">Avg Words/Slide</div>
              <div className="rc-stat-value">
                {Math.round(slides.reduce((acc, s) => acc + s.bullets.join(" ").split(" ").length, 0) / slides.length)}
              </div>
            </div>
            <div className="rc-card">
              <div className="rc-stat-label">Layouts Used</div>
              <div className="rc-stat-value">{layoutDistribution.length}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-[#12233e]">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "generator" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("generator")}
          >
            Generator
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "analytics" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics
          </button>
        </div>

        {activeTab === "generator" && (
          <>
            {/* Topic Presets */}
            <div className="rc-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white flex items-center gap-2">
                  <Zap className="h-4 w-4 text-[#f0c040]" />
                  Quick Topic Presets
                </h2>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                  <input
                    type="text"
                    className="rc-input pl-8 w-full text-sm"
                    placeholder="Search presets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {filteredPresets.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      className="rc-btn rc-btn-ghost justify-start text-xs h-auto py-2 px-3 border border-[#12233e] hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 transition-colors"
                      onClick={() => handlePresetClick(preset)}
                    >
                      <Icon className="h-4 w-4 mr-2 text-[#22c55e] shrink-0" />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  );
                })}
                {filteredPresets.length === 0 && (
                  <div className="col-span-full text-center py-4 text-[#7a95b8] text-sm">
                    No presets found matching "{searchTerm}"
                  </div>
                )}
              </div>
            </div>

            {/* Generation Controls */}
            <div className="rc-card">
              <h2 className="text-sm font-medium text-white mb-4">Generation Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#c8d8ec] mb-1 block">Presentation Prompt</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the presentation you want to create... e.g., 'Create a Roth conversion strategy presentation for a 58-year-old client with $1.2M IRA showing tax savings over 5 years'"
                    rows={4}
                    className="rc-input w-full"
                  />
                  <p className="text-xs text-[#7a95b8] mt-1 text-right">{prompt.length}/2000 characters</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#c8d8ec] mb-1 block">Client (Optional)</label>
                    <select 
                      className="rc-input w-full" 
                      value={selectedClientId} 
                      onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                      <option value="none">No client</option>
                      {(clients ?? []).map((c) => (
                        <option key={c.id} value={String(c.id)}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#c8d8ec] mb-1 block">Audience</label>
                    <select 
                      className="rc-input w-full"
                      value={audience} 
                      onChange={(e) => setAudience(e.target.value as any)}
                    >
                      <option value="client">Client-Facing</option>
                      <option value="advisor">Advisor</option>
                      <option value="team">Internal Team</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#c8d8ec] mb-1 block">Slide Count</label>
                    <select 
                      className="rc-input w-full"
                      value={String(slideCount)} 
                      onChange={(e) => setSlideCount(Number(e.target.value))}
                    >
                      {[3, 4, 5, 6, 8, 10, 12, 15, 20].map((n) => (
                        <option key={n} value={String(n)}>{n} slides</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={handleGenerate}
                      disabled={generateMut.isPending || !prompt.trim() || (slideQuota?.remaining !== null && slideQuota?.remaining !== undefined && slideQuota.remaining <= 0)}
                      className="rc-btn rc-btn-primary w-full h-[42px]"
                    >
                      {generateMut.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...</>
                      ) : slideQuota?.remaining !== null && slideQuota?.remaining !== undefined && slideQuota.remaining <= 0 ? (
                        <><Lock className="h-4 w-4 mr-2" /> Daily Limit Reached</>
                      ) : (
                        <><Sparkles className="h-4 w-4 mr-2" /> Generate Slides</>
                      )}
                    </button>
                    {slideQuota?.tier === "trial" && slideQuota.remaining !== null && (
                      <span className={`text-xs font-medium ${slideQuota.remaining <= 0 ? "text-red-400" : slideQuota.remaining === 1 ? "text-amber-400" : "text-[#c8d8ec]/60"}`}>
                        {slideQuota.remaining <= 0
                          ? "Upgrade for unlimited slides"
                          : `${slideQuota.remaining} of ${slideQuota.limit} generations remaining today`}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[#c8d8ec] mb-2 block">Slide Theme</label>
                  <ThemePicker value={themeId} onChange={setThemeId} />
                </div>

                <div className="flex gap-6 pt-2 border-t border-[#12233e]">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="includeDisclaimer"
                      checked={includeDisclaimer} 
                      onChange={(e) => setIncludeDisclaimer(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    <label htmlFor="includeDisclaimer" className="text-sm text-[#c8d8ec]">Include Disclaimer</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="showSpeakerNotes"
                      checked={showSpeakerNotes} 
                      onChange={(e) => setShowSpeakerNotes(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    <label htmlFor="showSpeakerNotes" className="text-sm text-[#c8d8ec]">Show Speaker Notes</label>
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Slides Preview */}
            {slides.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Slide List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[#7a95b8]">Slides ({slides.length})</h3>
                    <button className="rc-btn rc-btn-ghost text-xs py-1 h-auto" onClick={() => setFullscreenPreview(true)}>
                      <Eye className="h-3 w-3 mr-1" /> Preview
                    </button>
                  </div>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                    {slides.map((slide, i) => {
                      const Icon = LAYOUT_ICONS[slide.layout] || Presentation;
                      const colorClass = LAYOUT_COLORS[slide.layout] || "text-white/60 bg-white/5 border-white/10";
                      return (
                        <div
                          key={i}
                          onClick={() => setActiveSlideIndex(i)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            i === activeSlideIndex
                              ? "border-[#22c55e] bg-[#22c55e]/10 shadow-lg shadow-[#22c55e]/5"
                              : "border-[#12233e] bg-[#0d1a2e] hover:border-[#22c55e]/50"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg border ${colorClass}`}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium text-[#c8d8ec] truncate flex-1">{slide.title}</span>
                            <span className="rc-badge rc-badge-blue text-[10px] shrink-0 px-1.5 py-0.5">{i + 1}</span>
                          </div>
                          <p className="text-[10px] text-[#7a95b8] mt-2 truncate">{slide.subtitle}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Slide Detail */}
                <div className="lg:col-span-3">
                  {activeSlide && (
                    <div className="rc-card overflow-hidden p-0">
                      {/* Slide Preview Card */}
                      <div className="p-8 min-h-[320px] flex flex-col justify-center relative" style={{ background: `linear-gradient(135deg, ${getThemeById(themeId).bgAlt}, ${getThemeById(themeId).bgColor})` }}>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#22c55e] via-[#10b981] to-transparent" />
                        <div className="absolute top-4 right-4">
                          <span className={`rc-badge text-[10px] border ${LAYOUT_COLORS[activeSlide.layout] || ""}`}>
                            {activeSlide.layout.toUpperCase()}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{activeSlide.title}</h2>
                        {activeSlide.subtitle && <p className="text-sm text-white/50 mb-6">{activeSlide.subtitle}</p>}
                        <ul className="space-y-2">
                          {activeSlide.bullets.map((b, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 text-[#22c55e] mt-0.5 shrink-0" />
                              <span className="text-sm text-white/85">{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Speaker Notes */}
                      {showSpeakerNotes && activeSlide.speakerNotes && (
                        <div className="p-4 bg-[#0a1424] border-t border-[#12233e]">
                          <p className="text-xs text-[#7a95b8] italic">
                            📝 <strong className="text-[#c8d8ec]">Speaker Notes:</strong> {activeSlide.speakerNotes}
                          </p>
                        </div>
                      )}

                      {/* Navigation */}
                      <div className="p-3 flex items-center justify-between border-t border-[#12233e] bg-[#0d1a2e]">
                        <button className="rc-btn rc-btn-ghost text-xs" onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}>
                          <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                        </button>
                        <span className="text-xs text-[#7a95b8]">
                          Slide {activeSlideIndex + 1} of {slides.length}
                        </span>
                        <button className="rc-btn rc-btn-ghost text-xs" onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}>
                          Next <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Empty state */}
            {slides.length === 0 && !generateMut.isPending && (
              <div className="rc-card py-16 text-center border-dashed border-[#12233e]">
                <Presentation className="h-16 w-16 text-[#7a95b8] mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold text-white mb-2">No Slides Yet</h3>
                <p className="text-sm text-[#7a95b8] max-w-md mx-auto">
                  Select a topic preset or write a custom prompt above, then click Generate to create
                  a polished, branded slide deck powered by AI.
                </p>
              </div>
            )}

            {/* Loading state */}
            {generateMut.isPending && (
              <div className="rc-card py-16 text-center">
                <div className="relative mx-auto w-16 h-16 mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-[#22c55e]/20 border-t-[#22c55e] animate-spin" />
                  <Sparkles className="absolute inset-3 h-10 w-10 text-[#22c55e] animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Generating Your Presentation...</h3>
                <p className="text-sm text-[#7a95b8]">
                  AI is crafting {slideCount} branded slides. This typically takes 10-20 seconds.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            {slides.length === 0 ? (
              <div className="rc-card py-16 text-center border-dashed border-[#12233e]">
                <BarChart3 className="h-16 w-16 text-[#7a95b8] mx-auto mb-4 opacity-40" />
                <h3 className="text-lg font-semibold text-white mb-2">No Analytics Available</h3>
                <p className="text-sm text-[#7a95b8] max-w-md mx-auto">
                  Generate a presentation first to see analytics on slide layouts and content density.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rc-card">
                  <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-[#22c55e]" />
                    Slide Layouts
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RPieChart>
                      <Pie
                        data={layoutDistribution.length ? layoutDistribution : [{ name: "No Data", value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {(layoutDistribution.length ? layoutDistribution : [{ name: "No Data", value: 1 }]).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={layoutDistribution.length ? chartColors[index % chartColors.length] : "#12233e"} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={tooltipStyle} />
                    </RPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="rc-card">
                  <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#3b82f6]" />
                    Content Density
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <RBarChart data={slideLengths.length ? slideLengths : [{ name: "No Data", bullets: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={tooltipStyle} cursor={{ fill: "#ffffff05" }} />
                      <Bar dataKey="bullets" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </RBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        <NAICDisclaimer />
        <PageInsights pageId="ai-slide-generator" />
      </div>
    </AppShell>
  );
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
