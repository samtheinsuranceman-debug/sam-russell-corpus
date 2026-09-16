import { useParams } from "wouter";
import { Brain, AlertCircle, Shield, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import NavBar from "@/components/NavBar";

export default function SharedReport() {
  const { token } = useParams<{ token: string }>();
  const { data: report, isLoading } = trpc.report.getByToken.useQuery({ token: token || "" }, { enabled: !!token });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-16 text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading shared report...</p>
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
          <p className="text-muted-foreground text-sm">This shared report link may have expired or been revoked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Shared Clinical Decision-Support Draft — Provider View</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Provisional Differential Report</h1>
          <p className="text-muted-foreground text-sm mt-1">Shared on {new Date((report as any).createdAt).toLocaleDateString()} · Human clinician review required</p>
        </div>

        <Card className="border-amber-500/30 bg-amber-500/5 mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-200/80">
                <strong className="text-amber-400">Draft decision support only.</strong> This AI-generated report may organize screening information and possible differentials, but it does not establish a diagnosis, prescription, medical order, or treatment plan. An appropriately licensed clinician remains responsible for evaluation and decisions.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          {(report as any).aiAnalysis && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="w-5 h-5 text-primary" /> AI Differential Diagnosis Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <Streamdown>{(report as any).aiAnalysis}</Streamdown>
                </div>
              </CardContent>
            </Card>
          )}

          {(report as any).provisionalDiagnoses && (
            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle className="text-lg">Provisional Diagnoses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {((report as any).provisionalDiagnoses as any[]).map((dx: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${dx.confidence === "high" ? "border-primary/50 text-primary" : "border-yellow-500/50 text-yellow-400"}`}>
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

          <Separator />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>This report was shared through the separately configured clinical edition. Handle it under your organization's privacy, security, minimum-necessary, and record-retention policies. For questions, contact the responsible care team or privacy office.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
