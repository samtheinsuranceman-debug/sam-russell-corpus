// @ts-nocheck
import { useState, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Trash2, Download, Eye, Printer, CheckCircle, XCircle, Clock, Sparkles, BookOpen } from 'lucide-react';
import { toast } from "sonner";
import { PageInsights } from "@/components/PageInsights";

interface ReportEngine {
  engineId: string;
  name: string;
  category: string;
  inputs: Record<string, any>;
}

export default function ClientReportBuilder() {

  const templates = trpc.reportBuilder.getTemplates.useQuery();
  const availableEngines = trpc.reportBuilder.getAvailableEngines.useQuery();
  const generateReport = trpc.reportBuilder.generateReport.useMutation();
  const reportRef = useRef<HTMLDivElement>(null);

  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [reportTitle, setReportTitle] = useState("Comprehensive Financial Analysis");
  const [advisorName, setAdvisorName] = useState("Sam Russell");
  const [companyName, setCompanyName] = useState("Russell Capital Solutions");
  const [selectedEngines, setSelectedEngines] = useState<ReportEngine[]>([]);
  // Reports always carry the disclaimer (copy-compliance review S-a).
  const includeDisclaimer = true;
  const [includeBranding, setIncludeBranding] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [activeView, setActiveView] = useState<"setup" | "preview">("setup");

  const addEngine = (engineId: string) => {
    const engine = availableEngines.data?.find(e => e.id === engineId);
    if (!engine || selectedEngines.find(e => e.engineId === engineId)) return;
    setSelectedEngines(prev => [...prev, { engineId, name: engine.name, category: engine.category, inputs: {} }]);
  };

  const removeEngine = (engineId: string) => {
    setSelectedEngines(prev => prev.filter(e => e.engineId !== engineId));
  };

  const loadTemplate = (tpl: any) => {
    const engines = tpl.engines.map((id: string) => {
      const engine = availableEngines.data?.find(e => e.id === id);
      return engine ? { engineId: id, name: engine.name, category: engine.category, inputs: {} } : null;
    }).filter(Boolean);
    setSelectedEngines(engines);
    setReportTitle(tpl.name);
    toast.success(`${tpl.name} loaded with ${engines.length} engines`);
  };

  const handleGenerate = async () => {
    if (!clientName) { toast.error("Client name required"); return; }
    if (selectedEngines.length === 0) { toast.error("Select at least one engine"); return; }
    try {
      const result = await generateReport.mutateAsync({
        clientName, clientEmail: clientEmail || undefined,
        advisorName, companyName, reportTitle,
        engines: selectedEngines.map(e => ({ engineId: e.engineId, inputs: e.inputs })),
        includeDisclaimer, includeBranding,
      });
      setReport(result);
      setActiveView("preview");
      toast.success(`Report generated! ${result.metadata.successfulEngines}/${result.metadata.totalEnginesRun} engines completed`);
    } catch (err: any) {
      toast.error(`Generation failed: ${err.message}`);
    }
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <html><head><title>${reportTitle}</title>
          <style>
            body { font-family: 'Georgia', serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
            h1 { color: #0f3460; border-bottom: 3px solid #e94560; padding-bottom: 10px; }
            h2 { color: #16213e; margin-top: 30px; }
            h3 { color: #0f3460; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .success { border-left: 4px solid #10b981; }
            .failed { border-left: 4px solid #ef4444; }
            .meta { color: #666; font-size: 0.9em; }
            .disclaimer { font-size: 0.8em; color: #888; border-top: 1px solid #ddd; padding-top: 15px; margin-top: 30px; }
            pre { background: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 0.85em; overflow-x: auto; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
            th { background: #f0f0f0; }
            @media print { body { padding: 20px; } .no-print { display: none; } }
          </style></head><body>
          ${reportRef.current.innerHTML}
          </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const categoryColors: Record<string, string> = {
    "IUL & Policy": "bg-blue-500/10 text-blue-400",
    "Tax & Wealth": "bg-emerald-500/10 text-emerald-400",
    "Client Intelligence": "bg-indigo-500/10 text-indigo-400",
    "Practice Management": "bg-amber-500/10 text-amber-400",
    "Retirement": "bg-rose-500/10 text-rose-400",
    "Wealth Strategy": "bg-cyan-500/10 text-cyan-400",
    "Compliance": "bg-gray-500/10 text-[#7a95b8]",
  };

  return (
    <AppShell title="Client Report Builder" subtitle="Generate branded multi-engine reports for client meetings">
      <div className="space-y-6">
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button variant={activeView === "setup" ? "default" : "outline"} size="sm" onClick={() => setActiveView("setup")}>
            <FileText className="h-4 w-4 mr-1" /> Setup
          </Button>
          <Button variant={activeView === "preview" ? "default" : "outline"} size="sm" onClick={() => setActiveView("preview")} disabled={!report}>
            <Eye className="h-4 w-4 mr-1" /> Preview
          </Button>
        </div>

        {activeView === "setup" && (
          <>
            {/* Report Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Report Templates</CardTitle>
                <CardDescription>Quick-start with pre-built report configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {templates.data?.map(tpl => (
                    <div key={tpl.id} className="p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors" onClick={() => loadTemplate(tpl)}>
                      <p className="font-medium text-sm">{tpl.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{tpl.description}</p>
                      <Badge variant="outline" className="mt-2 text-xs">{tpl.engines.length} engines</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Client & Report Info */}
            <Card>
              <CardHeader><CardTitle className="text-base">Report Details</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client Name *</Label>
                  <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="John & Jane Smith" />
                </div>
                <div className="space-y-2">
                  <Label>Client Email</Label>
                  <Input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="client@email.com" type="email" />
                </div>
                <div className="space-y-2">
                  <Label>Report Title</Label>
                  <Input value={reportTitle} onChange={e => setReportTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Advisor Name</Label>
                  <Input value={advisorName} onChange={e => setAdvisorName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                </div>
                <div className="flex items-center gap-6 pt-6">
                  <div className="flex items-center gap-2">
                    {/* Disclaimers are always included in a generated report. */}
                    <Checkbox id="disclaimer" checked disabled />
                    <Label htmlFor="disclaimer" className="text-sm">Disclaimer (always included)</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="branding" checked={includeBranding} onCheckedChange={(v) => setIncludeBranding(!!v)} />
                    <Label htmlFor="branding" className="text-sm">Include Branding</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engine Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> Report Sections ({selectedEngines.length} engines)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEngines.map((engine, idx) => (
                  <div key={engine.engineId} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <span className="text-sm font-bold text-primary w-6">{idx + 1}</span>
                    <div className="flex-1">
                      <span className="font-medium text-sm">{engine.name}</span>
                      <Badge variant="outline" className={`ml-2 text-xs ${categoryColors[engine.category] || ""}`}>{engine.category}</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeEngine(engine.engineId)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                ))}
                <Select onValueChange={addEngine}>
                  <SelectTrigger><SelectValue placeholder="Add an engine section..." /></SelectTrigger>
                  <SelectContent>
                    {availableEngines.data?.filter(e => !selectedEngines.find(s => s.engineId === e.id)).map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name} ({e.category})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button onClick={handleGenerate} disabled={!clientName || selectedEngines.length === 0 || generateReport.isPending} className="w-full mt-4" size="lg">
                  {generateReport.isPending ? <><Clock className="h-4 w-4 mr-2 animate-spin" /> Generating Report...</> : <><FileText className="h-4 w-4 mr-2" /> Generate Report</>}
                </Button>
              </CardContent>
            </Card>
          </>
        )}

        {/* Report Preview */}
        {activeView === "preview" && report && (
          <>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handlePrint}><Printer className="h-4 w-4 mr-1" /> Print / Save PDF</Button>
            </div>
            <Card className="border-primary/20">
              <CardContent className="pt-6" ref={reportRef}>
                {/* Report Header */}
                {report.branding && (
                  <div className="text-center mb-8 pb-6 border-b-2 border-primary/30">
                    <h1 className="text-3xl font-bold text-primary">{report.branding.company}</h1>
                    <p className="text-sm text-muted-foreground mt-1">{report.branding.tagline}</p>
                  </div>
                )}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold">{report.metadata.title}</h2>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div><span className="text-muted-foreground">Prepared for:</span> <strong>{report.metadata.clientName}</strong></div>
                    <div><span className="text-muted-foreground">Prepared by:</span> <strong>{report.metadata.advisorName}</strong></div>
                    <div><span className="text-muted-foreground">Date:</span> <strong>{report.metadata.generatedAt}</strong></div>
                    <div><span className="text-muted-foreground">Engines:</span> <strong>{report.metadata.successfulEngines}/{report.metadata.totalEnginesRun}</strong></div>
                  </div>
      <PageInsights section="client-report-builder" />
                </div>

                {/* Report Sections */}
                {report.sections.map((section: any, idx: number) => (
                  <div key={idx} className={`mb-6 p-4 rounded-lg border ${section.success ? "border-border" : "border-red-500/30 bg-red-500/5"}`}>
                    <div className="flex items-center gap-2 mb-3">
                      {section.success ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                      <h3 className="text-lg font-semibold">{section.engineName}</h3>
                      <Badge variant="outline" className="text-xs">{section.category}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">{section.executionTimeMs}ms</span>
                    </div>
                    {section.error && <p className="text-sm text-red-400">{section.error}</p>}
                    {section.success && section.result && (
                      <div className="text-sm">
                        {typeof section.result === "object" ? (
                          <div className="space-y-2">
                            {Object.entries(section.result).slice(0, 10).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between py-1 border-b border-border/30">
                                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                                <span className="font-medium">
                                  {typeof value === "number" ? value.toLocaleString() : typeof value === "boolean" ? (value ? "Yes" : "No") : typeof value === "object" ? JSON.stringify(value).slice(0, 80) + "..." : String(value)}
                                </span>
                              </div>
                            ))}
                            {Object.keys(section.result).length > 10 && (
                              <details className="text-xs">
                                <summary className="cursor-pointer text-muted-foreground">View all {Object.keys(section.result).length} fields</summary>
                                <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto max-h-60">{JSON.stringify(section.result, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ) : (
                          <p>{String(section.result)}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Disclaimer */}
                {report.disclaimer && (
                  <div className="mt-8 pt-6 border-t border-border text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Important Disclosure</p>
                    <p>{report.disclaimer.text}</p>
                    <p className="mt-2">{report.disclaimer.complianceNote}</p>
                  </div>
                )}

                {/* Footer */}
                {report.branding && (
                  <div className="mt-6 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                    <p>{report.branding.copyright}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
