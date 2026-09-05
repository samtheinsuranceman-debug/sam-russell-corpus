/**
 * ExportToSlides — Universal drop-in button for any tool/calculator page.
 *
 * Usage:
 *   <ExportToSlides
 *     toolName="Roth Conversion Ladder"
 *     getSections={() => [{ title: "Conversion Plan", items: [{ label: "Year 1", value: "$45,000" }] }]}
 *     getBullets={() => ["Tax savings of $12,000 in Year 1"]}
 *   />
 *
 * It collects the current tool's structured data, sends it to the AI,
 * and opens an inline slide preview + export dialog.
 */
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useClientData } from "@/contexts/ClientDataContext";
import { useAccess } from "@/contexts/AccessContext";
import ThemePicker from "@/components/ThemePicker";
import { DEFAULT_THEME_ID, getThemeById } from "@shared/slideThemes";
import { toast } from "sonner";
import {
  Presentation,
  Sparkles,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Download,
  FileText,
  Copy,
  Maximize2,
  Lock,
  FileDown,
  Save,
} from "lucide-react";

export interface SlideSection {
  title: string;
  items: Array<{ label: string; value: string }>;
}

interface ExportToSlidesProps {
  /** Name of the source tool/calculator */
  toolName: string;
  /** Function that returns current tool data sections */
  getSections: () => SlideSection[];
  /** Optional key takeaways */
  getBullets?: () => string[];
  /** Optional advisor notes */
  notes?: string;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional class names */
  className?: string;
}

interface GeneratedSlide {
  title: string;
  subtitle: string;
  bullets: string[];
  speakerNotes: string;
  layout: string;
}

export function ExportToSlides({
  toolName,
  getSections,
  getBullets,
  notes: defaultNotes,
  variant = "outline",
  size = "sm",
  className = "",
}: ExportToSlidesProps) {
  const { data: clientData } = useClientData();
  const { tier } = useAccess();
  // Allow ALL access tiers (including trial / auto-entry users) to use Slides features
  const isPaid = tier === "owner" || tier === "unlimited" || tier === "subscriber";

  const [open, setOpen] = useState(false);
  const [slides, setSlides] = useState<GeneratedSlide[]>([]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [advisorNotes, setAdvisorNotes] = useState(defaultNotes || "");
  const [slideCount, setSlideCount] = useState(6);
  const [audience, setAudience] = useState<"client" | "advisor" | "team">("client");
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  const pptxMut = trpc.ai.generatePptx.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PowerPoint downloaded", { description: data.fileName });
    },
    onError: (err) => toast.error("PPTX generation failed", { description: err.message }),
  });

  const saveMut = trpc.slides.save.useMutation({
    onSuccess: () => {
      toast.success("Saved to My Slides library", { action: { label: "View Library", onClick: () => (window.location.href = "/portal/my-slides") } });
    },
    onError: (err) => toast.error("Failed to save", { description: err.message }),
  });

  const handleExportPptx = () => {
    if (!slides.length) return;
    pptxMut.mutate({ toolName, clientName: clientData?.clientName, audience, themeId, slides, includeDisclaimer });
  };

  const handleSave = () => {
    if (!slides.length) return;
    saveMut.mutate({
      title: `${toolName} — ${audience === "client" ? "Client" : audience === "advisor" ? "Advisor" : "Team"} Deck`,
      toolName,
      clientName: clientData?.clientName,
      audience,
      slides,
    });
  };

  const generateMut = trpc.ai.generateSlides.useMutation({
    onSuccess: (data) => {
      if (data.slides.length > 0) {
        setSlides(data.slides);
        setActiveSlideIndex(0);
        toast.success(`Generated ${data.slides.length} slides from ${toolName}`);
      } else {
        toast.error("No slides generated. Ensure the tool has data to export.");
      }
    },
    onError: (err) => {
      toast.error("Failed to generate slides", { description: err.message });
    },
  });

  const handleGenerate = useCallback(() => {
    const sections = getSections();
    if (!sections.length) {
      toast.error("No data to export. Run the calculator first.");
      return;
    }
    generateMut.mutate({
      toolName,
      clientName: clientData?.clientName,
      clientAge: clientData?.age ? Number(clientData.age) : undefined,
      clientIncome: clientData?.annualIncome ? Number(clientData.annualIncome) : undefined,
      clientIraBalance: clientData?.iraBalance ? Number(clientData.iraBalance) : undefined,
      sections: sections.map((s) => ({ title: s.title, items: s.items })),
      bullets: getBullets?.(),
      advisorNotes: advisorNotes || undefined,
      slideCount,
      audience,
    });
  }, [getSections, getBullets, clientData, toolName, advisorNotes, slideCount, audience]);

  const handleExportMarkdown = () => {
    if (!slides.length) return;
    let md = `# ${toolName} — Russell Capital Solutions™\n\n`;
    md += `**Generated:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n`;
    if (clientData?.clientName) md += `**Client:** ${clientData.clientName}\n`;
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
      md += "\n## Disclaimer\n\nThis presentation is for educational and informational purposes only. It does not constitute financial, tax, or legal advice. Past performance does not guarantee future results.\n\n*Russell Capital Solutions™*\n";
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${toolName.replace(/\s+/g, "_")}_Slides_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  };

  const handleCopy = () => {
    if (!slides.length) return;
    const text = slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.subtitle}\n${s.bullets.map(b => `  • ${b}`).join("\n")}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Slides copied to clipboard");
  };

  const activeSlide = slides[activeSlideIndex];

  // If not paid, show locked button
  if (!isPaid) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} opacity-60 cursor-not-allowed`}
        onClick={() => toast.info("AI Slides is a premium feature. Upgrade to unlock.", { action: { label: "View Plans", onClick: () => window.location.href = "/pricing" } })}
      >
        <Lock className="h-4 w-4 mr-1.5" />
        AI Slides
        <Badge className="ml-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[9px] px-1">PRO</Badge>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Presentation className="h-4 w-4 mr-1.5" />
          AI Slides
          <Badge className="ml-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[9px] px-1">AI</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700/50 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            Export to AI Slides — {toolName}
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {clientData
              ? `Generating slides for ${clientData.clientName} using ${toolName} data`
              : `Transform ${toolName} data into a polished presentation`}
          </DialogDescription>
        </DialogHeader>

        {/* Controls */}
        {slides.length === 0 && (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-zinc-400">Audience</Label>
                <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
                  <SelectTrigger className="mt-1 bg-zinc-800/50 border-zinc-700/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="client">Client-Facing</SelectItem>
                    <SelectItem value="advisor">Advisor</SelectItem>
                    <SelectItem value="team">Internal Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-zinc-400">Slides</Label>
                <Select value={String(slideCount)} onValueChange={(v) => setSlideCount(Number(v))}>
                  <SelectTrigger className="mt-1 bg-zinc-800/50 border-zinc-700/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 8, 10, 12].map((n) => (
                      <SelectItem key={n} value={String(n)}>{n} slides</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="flex items-center gap-2">
                  <Switch checked={includeDisclaimer} onCheckedChange={setIncludeDisclaimer} />
                  <Label className="text-xs text-zinc-300">Disclaimer</Label>
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-zinc-400">Advisor Notes (Optional)</Label>
              <Textarea
                value={advisorNotes}
                onChange={(e) => setAdvisorNotes(e.target.value)}
                placeholder="Add context or emphasis for the AI..."
                className="bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-sm h-16 resize-none mt-1"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-400 mb-2 block">Slide Theme</Label>
              <ThemePicker value={themeId} onChange={setThemeId} compact />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generateMut.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {generateMut.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating {slideCount} Slides...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Slides from {toolName}</>
              )}
            </Button>
          </div>
        )}

        {/* Slide Preview */}
        {slides.length > 0 && activeSlide && (
          <div className="space-y-3">
            {/* Export buttons */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600" onClick={handleExportMarkdown}>
                <Download className="h-3 w-3 mr-1" /> Markdown
              </Button>
              <Button variant="outline" size="sm" className="text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/30" onClick={handleExportPptx} disabled={pptxMut.isPending}>
                {pptxMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />} PowerPoint
              </Button>
              <Button variant="outline" size="sm" className="text-amber-300 border-amber-600/50 hover:bg-amber-900/30" onClick={handleSave} disabled={saveMut.isPending}>
                {saveMut.isPending ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />} Save
              </Button>
              <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600" onClick={handleCopy}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
              <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600" onClick={() => { setSlides([]); setActiveSlideIndex(0); }}>
                Regenerate
              </Button>
            </div>

            {/* Slide card — themed */}
            <div
              className="rounded-xl border border-white/10 p-8 min-h-[280px] flex flex-col justify-center relative"
              style={{ background: `linear-gradient(135deg, ${getThemeById(themeId).bgAlt}, ${getThemeById(themeId).bgColor})` }}
            >
              <div className="absolute top-0 left-0 w-full h-1 rounded-t-xl" style={{ background: `linear-gradient(to right, ${getThemeById(themeId).accentColor}, transparent)` }} />
              <div className="absolute top-3 right-4">
                <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                  {activeSlide.layout.toUpperCase()}
                </Badge>
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: getThemeById(themeId).titleColor }}>{activeSlide.title}</h2>
              {activeSlide.subtitle && <p className="text-sm mb-5" style={{ color: getThemeById(themeId).subtitleColor }}>{activeSlide.subtitle}</p>}
              <ul className="space-y-2">
                {activeSlide.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: getThemeById(themeId).accentColor }} />
                    <span className="text-sm" style={{ color: getThemeById(themeId).textColor }}>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Speaker notes */}
            {activeSlide.speakerNotes && (
              <p className="text-xs text-zinc-500 italic px-2">📝 {activeSlide.speakerNotes}</p>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))} disabled={activeSlideIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <div className="flex gap-1">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlideIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === activeSlideIndex ? "bg-emerald-400" : "bg-zinc-600 hover:bg-zinc-500"}`}
                  />
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-zinc-400" onClick={() => setActiveSlideIndex(Math.min(slides.length - 1, activeSlideIndex + 1))} disabled={activeSlideIndex === slides.length - 1}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Loading state */}
        {generateMut.isPending && (
          <div className="py-12 text-center">
            <div className="relative mx-auto w-12 h-12 mb-3">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Sparkles className="absolute inset-2 h-8 w-8 text-emerald-400 animate-pulse" />
            </div>
            <p className="text-sm text-zinc-400">Crafting your presentation...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
