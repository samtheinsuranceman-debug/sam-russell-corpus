import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { Brain, Download, Share2, ExternalLink, BookOpen, Pill, Activity, AlertCircle, Copy, CheckCheck, Link as LinkIcon, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import NavBar from "@/components/NavBar";
import { exportClinicalReportPDF } from "@/lib/clinicalPdfExport";
import LocalIntakeReport from "@/components/LocalIntakeReport";

/** Ids produced by the local scorer, which have no server-side report. */
const LOCAL_ID_PREFIX = "local-";

export default function DiagnosticReport() {
  const { id } = useParams<{ id: string }>();

  // A locally-scored intake has no row to fetch. Render it from local storage
  // rather than querying for a numeric id that does not exist.
  if (id?.startsWith(LOCAL_ID_PREFIX)) {
    return <LocalIntakeReport id={id} />;
  }

  return <ServerDiagnosticReport />;
}

function ServerDiagnosticReport() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);

  const { data: report, isLoading, refetch } = trpc.report.get.useQuery({ id: parseInt(id || "0") });

  const handleExportPDF = async () => {
    if (!report) return;
    setPdfExporting(true);
    try {
      const diagnoses = Array.isArray((report as any).provisionalDiagnoses)
        ? ((report as any).provisionalDiagnoses as Array<{ condition?: string; name?: string; icdCode?: string; dsmCode?: string; confidence?: string; rationale?: string }>).map(d => ({
            condition: d.condition || d.name || "Unknown",
            icdCode: d.icdCode || d.dsmCode,
            confidence: d.confidence,
            rationale: d.rationale,
          }))
        : [];
      const treatments = Array.isArray((report as any).treatmentRecommendations)
        ? ((report as any).treatmentRecommendations as Array<{ category: string; title: string; description: string; evidenceLevel: string; citations: string[] }>)
        : [];
      exportClinicalReportPDF({
        reportId: (report as any).id,
        generatedAt: new Date((report as any).createdAt),
        provisionalDiagnoses: diagnoses,
        prsScore: (report as any).prsScore ?? undefined,
        prsBreakdown: ((report as any).prsBreakdown as Record<string, number>) ?? undefined,
        treatmentRecommendations: treatments,
      });
    } finally {
      setPdfExporting(false);
    }
  };

  const shareMutation = trpc.report.share.useMutation({
    onSuccess: (data) => {
      const url = `${window.location.origin}/shared/${data.shareToken}`;
      setShareUrl(url);
      setShareOpen(true);
    },
  });
  const revokeShareMutation = trpc.report.revokeShare.useMutation({
    onSuccess: async () => {
      setShareOpen(false);
      setShareUrl(null);
      await refetch();
    },
  });

  const handleCopy = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-16 text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Generating the Clinical Decision-Support Draft</h2>
          <p className="text-muted-foreground">The system is organizing your responses into a provisional draft for clinician review.</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-16 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Report Not Found</h2>
          <Button onClick={() => navigate("/assessment")} className="mt-4">Start New Assessment</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-4xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Clinical Decision-Support Draft</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Provisional Differential Report</h1>
            <p className="text-muted-foreground text-sm mt-1">Generated {new Date().toLocaleDateString()} · Human clinician review required</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm" className="border-border"
              onClick={handleExportPDF}
              disabled={pdfExporting}
            >
              <Download className="w-4 h-4 mr-1.5" /> {pdfExporting ? "Exporting..." : "Export PDF"}
            </Button>
            <Button
              variant="outline" size="sm"
              className="border-primary/40 text-primary hover:bg-primary/10"
              onClick={() => shareMutation.mutate({ reportId: parseInt(id || "0") })}
              disabled={shareMutation.isPending}
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              {shareMutation.isPending ? "Sharing..." : "Share with Provider"}
            </Button>
            {(report as any).sharedWithProvider && (
              <Button
                variant="outline" size="sm"
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                onClick={() => revokeShareMutation.mutate({ reportId: parseInt(id || "0") })}
                disabled={revokeShareMutation.isPending}
              >
                <Unlink className="w-4 h-4 mr-1.5" /> {revokeShareMutation.isPending ? "Revoking..." : "Revoke Share"}
              </Button>
            )}
          </div>

          {/* Share Dialog */}
          <Dialog open={shareOpen} onOpenChange={setShareOpen}>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-primary" />
                  Provider Share Link
                </DialogTitle>
                <DialogDescription>
                  Share this link with your mental health provider. They can view your full diagnostic report without needing an account.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
                  <span className="text-xs text-muted-foreground font-mono flex-1 truncate">{shareUrl}</span>
                  <Button size="sm" variant="outline" onClick={handleCopy} className="flex-shrink-0">
                    {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleCopy}>
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button variant="outline" onClick={() => setShareOpen(false)} className="border-border">
                    Done
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  This link provides read-only access to your report. You can revoke access by contacting support.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6">
          {/* Disclaimer */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-4 pb-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200/80">
                  <strong className="text-amber-400">Draft decision support — not an autonomous diagnosis.</strong> This report organizes screening data for review by an appropriately licensed clinician. The clinician's assessment, judgment, documentation, and treatment decisions remain controlling.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* AI Analysis */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="w-5 h-5 text-primary" />
                AI Differential Diagnosis Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <Streamdown>{(report as any).aiAnalysis || "Analysis pending..."}</Streamdown>
              </div>
            </CardContent>
          </Card>

          {/* Provisional Diagnoses */}
          {(report as any).provisionalDiagnoses && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  Provisional Diagnoses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {((report as any).provisionalDiagnoses as any[]).map((dx: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${dx.confidence === "high" ? "border-primary/50 text-primary" : dx.confidence === "moderate" ? "border-yellow-500/50 text-yellow-400" : "border-border text-muted-foreground"}`}>
                        {dx.confidence}
                      </Badge>
                      <div>
                        <p className="font-medium text-foreground text-sm">{dx.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{dx.dsmCode} · {dx.rationale}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Psychiatric Risk Score */}
          {(report as any).prsScore != null && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Psychiatric Risk Score™ (PRS)
                  <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 bg-emerald-400/5 text-xs font-mono ml-auto">
                    PATENT PENDING
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-5xl font-black font-mono text-emerald-400">{(report as any).prsScore}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">/ 1000</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {(report as any).prsScore >= 800 ? "Optimal" : (report as any).prsScore >= 600 ? "Resilient" : (report as any).prsScore >= 400 ? "Moderate Risk" : (report as any).prsScore >= 200 ? "Elevated Risk" : "Critical"}
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-1000 bg-emerald-400"
                        style={{ width: `${((report as any).prsScore / 1000) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your PRS is computed across 8 psychiatric domains. View the full breakdown on the{" "}
                      <a href="/prs" className="text-emerald-400 hover:underline">PRS page</a>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Treatment Recommendations */}
          {(report as any).treatmentRecommendations && (() => {
            // Try to parse as structured array; fall back to markdown
            let recs: any[] | null = null;
            try {
              const raw = (report as any).treatmentRecommendations;
              if (Array.isArray(raw)) recs = raw;
              else if (typeof raw === "string" && raw.trim().startsWith("[")) recs = JSON.parse(raw);
            } catch { recs = null; }

            const EVIDENCE_COLORS: Record<string, string> = {
              A: "border-emerald-400/40 text-emerald-400 bg-emerald-400/10",
              B: "border-blue-400/40 text-blue-400 bg-blue-400/10",
              C: "border-amber-400/40 text-amber-400 bg-amber-400/10",
            };
            const CATEGORY_COLORS: Record<string, string> = {
              pharmacotherapy: "text-violet-400",
              psychotherapy: "text-cyan-400",
              lifestyle: "text-emerald-400",
              referral: "text-amber-400",
            };

            return (
              <Card className="border-border bg-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Pill className="w-5 h-5 text-primary" />
                    Treatment Recommendations
                    {recs && <Badge variant="outline" className="border-primary/30 text-primary text-xs ml-auto">{recs.length} recommendations</Badge>}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recs ? (
                    <div className="space-y-3">
                      {recs.map((rec: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg bg-secondary/20 border border-border/50">
                          <div className="flex items-start gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="font-semibold text-sm text-foreground">{rec.title}</span>
                                {rec.category && (
                                  <span className={`text-xs font-medium capitalize ${CATEGORY_COLORS[rec.category] || "text-muted-foreground"}`}>
                                    {rec.category}
                                  </span>
                                )}
                                {rec.evidenceLevel && (
                                  <Badge variant="outline" className={`text-xs ${EVIDENCE_COLORS[rec.evidenceLevel] || "border-border text-muted-foreground"}`}>
                                    Evidence Level {rec.evidenceLevel}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                              {rec.citations && rec.citations.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {rec.citations.slice(0, 3).map((cite: string, j: number) => (
                                    <Badge key={j} variant="outline" className="text-xs border-border/50 text-muted-foreground">{cite}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-xs text-muted-foreground">
                          <span className="text-primary font-medium">Evidence Levels: </span>
                          A = Strong (RCTs), B = Moderate (observational), C = Expert consensus
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <Streamdown>{(report as any).treatmentRecommendations}</Streamdown>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {/* Research Links */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-primary" />
                Relevant Research
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {[
                  { title: "DSM-5 Diagnostic Criteria", url: "https://www.psychiatry.org/psychiatrists/practice/dsm", source: "APA" },
                  { title: "PubMed Mental Health Research", url: "https://pubmed.ncbi.nlm.nih.gov/?term=psychiatric+disorders", source: "NCBI" },
                  { title: "CDC Mental Health Resources", url: "https://www.cdc.gov/mentalhealth/", source: "CDC" },
                  { title: "NIMH Treatment Guidelines", url: "https://www.nimh.nih.gov/health/topics", source: "NIMH" },
                ].map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-colors group">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">{link.source}</Badge>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">{link.title}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/ai-advisory")} className="bg-primary text-primary-foreground">
              Get AI Advisory Session
            </Button>
            <Button variant="outline" onClick={() => navigate("/life-maps")} className="border-border">
              View Life Maps
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
