import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Settings2,
  Sparkles,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useClientData } from "@/contexts/ClientDataContext";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReportSection {
  id: string;
  title: string;
  /** Key-value data items for this section */
  items: Array<{ label: string; value: string; color?: string }>;
}

export interface ReportChartData {
  title: string;
  type: "line" | "bar" | "area" | "pie";
  data: Array<Record<string, any>>;
}

interface ReportGeneratorProps {
  /** Page/tool title for the report header */
  pageTitle: string;
  /** Function that returns current calculator sections */
  getSections: () => ReportSection[];
  /** Optional bullet points / key takeaways */
  getBullets?: () => string[];
  /** Optional advisor notes */
  notes?: string;
  /** Additional tools to include in a combined report */
  additionalTools?: Array<{
    id: string;
    name: string;
    getSections: () => ReportSection[];
    getBullets?: () => string[];
  }>;
  /** Button variant */
  variant?: "default" | "outline" | "ghost" | "secondary";
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon";
  /** Additional class names */
  className?: string;
  /** Whether to show the full dialog or just a simple button */
  simple?: boolean;
}

/**
 * ReportGenerator — Universal one-click client report generation.
 *
 * Features:
 * - Single-tool quick export (simple mode)
 * - Multi-tool combined report (dialog mode)
 * - Section selection for customized reports
 * - Advisor notes field
 * - Branded PDF with disclaimers
 */
export function ReportGenerator({
  pageTitle,
  getSections,
  getBullets,
  notes: defaultNotes,
  additionalTools = [],
  variant = "outline",
  size = "sm",
  className = "",
  simple = false,
}: ReportGeneratorProps) {
  const { data: clientData } = useClientData();
  const [open, setOpen] = useState(false);
  const [selectedTools, setSelectedTools] = useState<Set<string>>(new Set(["current"]));
  const [advisorNotes, setAdvisorNotes] = useState(defaultNotes || "");
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);

  const exportMut = trpc.strategyExport.generate.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Client report generated", {
        description: `${data.fileName} — ready for download`,
      });
      setOpen(false);
    },
    onError: (err) => {
      toast.error("Failed to generate report", { description: err.message });
    },
  });

  const handleQuickExport = () => {
    const sections = getSections();
    if (!sections.length) {
      toast.error("No data to export. Run the calculator first.");
      return;
    }
    exportMut.mutate({
      pageTitle,
      clientName: clientData?.clientName,
      sections: sections.map((s) => ({ title: s.title, items: s.items })),
      bullets: getBullets?.(),
      notes: advisorNotes || undefined,
    });
  };

  const handleCombinedExport = () => {
    const allSections: Array<{ title: string; items: Array<{ label: string; value: string; color?: string }> }> = [];
    const allBullets: string[] = [];

    // Current tool
    if (selectedTools.has("current")) {
      const sections = getSections();
      allSections.push(...sections.map((s) => ({ title: s.title, items: s.items })));
      const bullets = getBullets?.();
      if (bullets) allBullets.push(...bullets);
    }

    // Additional tools
    for (const tool of additionalTools) {
      if (selectedTools.has(tool.id)) {
        const sections = tool.getSections();
        allSections.push(...sections.map((s) => ({ title: `${tool.name} — ${s.title}`, items: s.items })));
        const bullets = tool.getBullets?.();
        if (bullets) allBullets.push(...bullets);
      }
    }

    if (!allSections.length) {
      toast.error("No sections selected. Please select at least one tool.");
      return;
    }

    const combinedTitle = selectedTools.size > 1
      ? `Combined Report: ${pageTitle} + ${additionalTools.filter((t) => selectedTools.has(t.id)).map((t) => t.name).join(", ")}`
      : pageTitle;

    exportMut.mutate({
      pageTitle: combinedTitle,
      clientName: clientData?.clientName,
      sections: allSections,
      bullets: allBullets.length > 0 ? allBullets : undefined,
      notes: advisorNotes || undefined,
    });
  };

  // Simple mode — just a button
  if (simple) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickExport}
        disabled={exportMut.isPending}
        className={className}
      >
        {exportMut.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
        ) : (
          <FileText className="h-4 w-4 mr-1.5" />
        )}
        Generate Report
      </Button>
    );
  }

  // Full dialog mode
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <FileText className="h-4 w-4 mr-1.5" />
          Generate Client Report
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-zinc-900 border-zinc-700/50 max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Generate Client Report
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            {clientData
              ? `Creating report for ${clientData.clientName}`
              : "Select sections and customize your report"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Tool selection */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Include Tools
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="current-tool"
                  checked={selectedTools.has("current")}
                  onCheckedChange={(checked) => {
                    const next = new Set(selectedTools);
                    if (checked) next.add("current");
                    else next.delete("current");
                    setSelectedTools(next);
                  }}
                />
                <Label htmlFor="current-tool" className="text-sm text-zinc-200 flex items-center gap-2">
                  {pageTitle}
                  <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400">
                    Current
                  </Badge>
                </Label>
              </div>
              {additionalTools.map((tool) => (
                <div key={tool.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`tool-${tool.id}`}
                    checked={selectedTools.has(tool.id)}
                    onCheckedChange={(checked) => {
                      const next = new Set(selectedTools);
                      if (checked) next.add(tool.id);
                      else next.delete(tool.id);
                      setSelectedTools(next);
                    }}
                  />
                  <Label htmlFor={`tool-${tool.id}`} className="text-sm text-zinc-200">
                    {tool.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Options */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Options
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-disclaimer"
                  checked={includeDisclaimer}
                  onCheckedChange={(checked) => setIncludeDisclaimer(!!checked)}
                />
                <Label htmlFor="include-disclaimer" className="text-sm text-zinc-300">
                  Include compliance disclaimers
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-charts"
                  checked={includeCharts}
                  onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                />
                <Label htmlFor="include-charts" className="text-sm text-zinc-300">
                  Include charts and visualizations
                </Label>
              </div>
            </div>
          </div>

          {/* Advisor notes */}
          <div>
            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Advisor Notes (Optional)
            </h4>
            <Textarea
              value={advisorNotes}
              onChange={(e) => setAdvisorNotes(e.target.value)}
              placeholder="Add personalized notes for this client..."
              className="bg-zinc-800/50 border-zinc-700/50 text-zinc-200 text-sm h-20 resize-none"
            />
          </div>

          {/* Generate button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleCombinedExport}
              disabled={exportMut.isPending || selectedTools.size === 0}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {exportMut.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-1.5" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
