/**
 * IbbotsonCredibilityOverlay — "Show Me the Math" credibility engine.
 * 
 * Drop this onto ANY projection page. It renders a button that opens a
 * slide-over panel showing the exact Ibbotson historical data behind the
 * numbers, a methodology summary, and a one-click "How We Calculate" PDF-ready view.
 * 
 * Props:
 *   capRate / floorRate — the IUL parameters used in the host page's projection
 *   startYear / endYear — optional date range filter
 *   projectionLabel — what the host page is projecting (e.g. "Mortgage Killer IUL Growth")
 */
import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, BarChart3, Shield, TrendingUp, History, Award, CheckCircle2, ArrowUpRight, Copy, Printer,
} from "lucide-react";
import {
  SP500_ANNUAL_RETURNS, IBBOTSON_START_YEAR, IBBOTSON_END_YEAR,
  runIbbotsonModel, getIbbotsonSummary, type IbbotsonSummary,
} from "@shared/ibbotsonModel";
import { toast } from "sonner";

interface Props {
  capRate?: number;
  floorRate?: number;
  startYear?: number;
  endYear?: number;
  projectionLabel?: string;
  compact?: boolean;
}

export function IbbotsonCredibilityOverlay({
  capRate = 8,
  floorRate = 0,
  startYear = IBBOTSON_START_YEAR,
  endYear = IBBOTSON_END_YEAR,
  projectionLabel = "IUL Projection",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const summary: IbbotsonSummary = useMemo(
    () => getIbbotsonSummary({ capRate, floorRate, startYear, endYear }),
    [capRate, floorRate, startYear, endYear],
  );

  const yearCount = endYear - startYear + 1;

  const handleCopyMethodology = () => {
    const text = `Russell Capital Systems™ — Projection Methodology\n\nProjection: ${projectionLabel}\nData Source: Ibbotson SBBI (Stocks, Bonds, Bills, and Inflation)\nPeriod: ${startYear}–${endYear} (${yearCount} years)\nIndex: S&P 500 Total Return (incl. dividends)\nCap Rate: ${capRate}%  |  Floor: ${floorRate}%\nAvg Credited Rate: ${summary.averageCreditedRate.toFixed(2)}%\nCAGR: ${summary.cagr.toFixed(2)}%\nPositive Years: ${summary.positiveYears}/${yearCount} (${((summary.positiveYears / yearCount) * 100).toFixed(0)}%)\nWorst S&P Year: ${summary.worstSP500Year.year} (${summary.worstSP500Year.rate.toFixed(1)}%)\nBest Credited Year: ${summary.bestCreditedYear.year} (+${summary.bestCreditedYear.rate.toFixed(1)}%)\n\nSource: NYU Stern / Damodaran, Morningstar/CRSP Ibbotson dataset.\nRegulatory: Subject to NAIC AG 49-A / AG 49-B.`;
    navigator.clipboard.writeText(text);
    toast.success("Methodology copied to clipboard");
  };

  const handlePrint = () => {
    window.print();
  };

  // Compact trigger button for embedding in other pages
  const triggerButton = compact ? (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
      <BookOpen className="h-3.5 w-3.5" /> Show Me the Math
    </Button>
  ) : (
    <Button variant="outline" className="gap-2">
      <BookOpen className="h-4 w-4" /> Show Me the Math
      <Badge variant="secondary" className="text-[10px] ml-1">{yearCount} yrs</Badge>
    </Button>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{triggerButton}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto bg-background">
        <SheetHeader className="pb-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-lg">How We Calculate</SheetTitle>
              <SheetDescription className="text-xs">
                {projectionLabel} — backed by {yearCount} years of Ibbotson data
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-5 py-5">
          {/* Trust Badge Row */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs"><History className="h-3 w-3" /> {yearCount} Years</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><Award className="h-3 w-3" /> Ibbotson SBBI</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><Shield className="h-3 w-3" /> AG 49-A/B</Badge>
            <Badge variant="outline" className="gap-1 text-xs"><TrendingUp className="h-3 w-3" /> S&P 500 TR</Badge>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border-primary/20">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-primary">{summary.averageCreditedRate.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Avg Credited Rate</div>
                <div className="text-[10px] text-muted-foreground">Cap {capRate}% / Floor {floorRate}%</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-emerald-400">{summary.cagr.toFixed(1)}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">CAGR</div>
                <div className="text-[10px] text-muted-foreground">{startYear}–{endYear}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-green-400">{summary.positiveYears}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Positive Years</div>
                <Progress value={(summary.positiveYears / yearCount) * 100} className="h-1.5 mt-1" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold text-red-400">{yearCount - summary.positiveYears}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Negative Years</div>
                <div className="text-[10px] text-muted-foreground">Floor protected at {floorRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Worst / Best Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
              <div className="text-xs text-muted-foreground mb-1">Worst Year (S&P)</div>
              <div className="text-lg font-bold text-red-400">{summary.worstSP500Year.rate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{summary.worstSP500Year.year}</div>
              <div className="text-xs text-emerald-400 mt-1">
                <Shield className="h-3 w-3 inline mr-0.5" />
                IUL credited: {floorRate}% (floor protected)
              </div>
            </div>
            <div className="p-3 rounded-lg border border-green-500/20 bg-green-500/5">
              <div className="text-xs text-muted-foreground mb-1">Best Credited Year</div>
              <div className="text-lg font-bold text-green-400">+{summary.bestCreditedYear.rate.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground">{summary.bestCreditedYear.year}</div>
              <div className="text-xs text-amber-400 mt-1">
                <TrendingUp className="h-3 w-3 inline mr-0.5" />
                IUL credited: {capRate}% (cap applied)
              </div>
            </div>
          </div>

          {/* Methodology Explanation */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Methodology
              </h4>
              <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                <p>
                  This projection uses <strong className="text-foreground">S&P 500 Total Return data</strong> (including
                  reinvested dividends) from the Ibbotson SBBI dataset, originally compiled by
                  <strong className="text-foreground"> Roger G. Ibbotson</strong> and Rex A. Sinquefield at the University
                  of Chicago, now maintained by Morningstar/CRSP.
                </p>
                <p>
                  Each year's market return is passed through the IUL crediting mechanism: returns above
                  the <strong className="text-foreground">{capRate}% cap</strong> are capped, and returns below
                  the <strong className="text-foreground">{floorRate}% floor</strong> are floored — meaning the
                  policy value never decreases due to market losses.
                </p>
                <p>
                  Over {yearCount} years ({startYear}–{endYear}), this produces an average credited rate
                  of <strong className="text-foreground">{summary.averageCreditedRate.toFixed(2)}%</strong> and
                  a CAGR of <strong className="text-foreground">{summary.cagr.toFixed(2)}%</strong>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Provenance */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <h4 className="font-semibold text-sm">Data Provenance</h4>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {[
                  { label: "Primary Source", value: "Ibbotson SBBI (Morningstar/CRSP)" },
                  { label: "Secondary Source", value: "NYU Stern / Aswath Damodaran" },
                  { label: "Index", value: "S&P 500 Total Return (dividends reinvested)" },
                  { label: "Period", value: `${startYear}–${endYear} (${yearCount} years)` },
                  { label: "Cap Rate Applied", value: `${capRate}%` },
                  { label: "Floor Rate Applied", value: `${floorRate}%` },
                  { label: "Regulatory Framework", value: "NAIC AG 49-A / AG 49-B" },
                ].map(row => (
                  <div key={row.label} className="flex justify-between">
                    <span>{row.label}</span>
                    <span className="font-medium text-foreground">{row.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Regulatory Disclosure */}
          <div className="p-3 rounded-lg bg-muted/30 border text-[10px] text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Regulatory Note:</strong> IUL illustrations are subject to
            NAIC Actuarial Guideline 49-A (AG 49-A) and AG 49-B, which govern maximum illustrated rates.
            This is an educational tool, not a policy illustration as defined by state insurance regulations.
            Past performance does not guarantee future results. Actual crediting rates depend on carrier,
            product design, and market conditions at time of crediting.
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleCopyMethodology}>
              <Copy className="h-3.5 w-3.5" /> Copy Methodology
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handlePrint}>
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" asChild>
              <a href="/portal/ibbotson-charts">
                <ArrowUpRight className="h-3.5 w-3.5" /> Full Charts
              </a>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default IbbotsonCredibilityOverlay;
