// ───────────────────────────────────────────────────────────────────────────
// SI-028 · Physician Loan Refinancing Optimizer (PLRO)
// PSLF net present value with compounded program risk, IUL cash value as
// refinancing collateral, and the dual-benefit debt restructuring path.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, GraduationCap, AlertTriangle, Lock, Scale } from "lucide-react";
import { PageInsights } from "@/components/PageInsights";

const fmt = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const REC_STYLE: Record<string, string> = {
  pursue_pslf: "border-emerald-400/40 text-emerald-300",
  refinance_with_collateral: "border-sky-400/40 text-sky-300",
  refinance: "border-sky-400/40 text-sky-300",
  too_close_to_call: "border-amber-400/40 text-amber-300",
};

export default function PhysicianLoanRefi() {
  const [loanBalance, setLoanBalance] = useState(320_000);
  const [currentRate, setCurrentRate] = useState(6.8);
  const [annualIncome, setAnnualIncome] = useState(240_000);
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(4);
  const [marginalTaxRate, setMarginalTaxRate] = useState(37);
  const [householdSize, setHouseholdSize] = useState(3);
  const [paymentsAlreadyMade, setPaymentsAlreadyMade] = useState(36);
  const [inQualifyingEmployment, setInQualifyingEmployment] = useState(true);
  const [employmentContinuity, setEmploymentContinuity] = useState(85);
  const [programContinuation, setProgramContinuation] = useState(80);
  const [certificationCompliance, setCertificationCompliance] = useState(95);
  const [refinanceRate, setRefinanceRate] = useState(5.9);
  const [refinanceTermYears, setRefinanceTermYears] = useState(10);
  const [iulCashValue, setIulCashValue] = useState(90_000);
  const [iulCreditingRate, setIulCreditingRate] = useState(6);
  const [discountRate, setDiscountRate] = useState(5);

  const run = trpc.si.physicianLoanRefi.useMutation({
    onSuccess: () => toast.success("Refinancing analysis complete"),
    onError: e => toast.error(e.message),
  });

  const analyze = () =>
    run.mutate({
      loanBalance,
      currentRate: currentRate / 100,
      annualIncome,
      incomeGrowthRate: incomeGrowthRate / 100,
      marginalTaxRate: marginalTaxRate / 100,
      householdSize,
      paymentsAlreadyMade,
      inQualifyingEmployment,
      employmentContinuityProbability: employmentContinuity / 100,
      programContinuationProbability: programContinuation / 100,
      certificationComplianceProbability: certificationCompliance / 100,
      refinanceRate: refinanceRate / 100,
      refinanceTermYears,
      iulCashValue,
      iulCreditingRate: iulCreditingRate / 100,
      discountRate: discountRate / 100,
    });

  const result = run.data;

  return (
    <AppShell
      title="Physician Loan Refinancing Optimizer"
      subtitle="SI-028 · PSLF arbitrage, IUL collateral integration, and dual-benefit debt restructuring"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-500" />
              Loan and employment profile
            </CardTitle>
            <CardDescription>
              Calibrated for balances above $100,000. Refinancing federal loans privately forfeits PSLF permanently —
              the decision cannot be reversed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Loan balance</Label>
                <Input type="number" value={loanBalance} onChange={e => setLoanBalance(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Current rate %</Label>
                <Input type="number" step="0.1" value={currentRate} onChange={e => setCurrentRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Annual income</Label>
                <Input type="number" value={annualIncome} onChange={e => setAnnualIncome(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Income growth %</Label>
                <Input type="number" step="0.1" value={incomeGrowthRate} onChange={e => setIncomeGrowthRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Household size</Label>
                <Input type="number" value={householdSize} onChange={e => setHouseholdSize(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Marginal tax %</Label>
                <Input type="number" value={marginalTaxRate} onChange={e => setMarginalTaxRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Qualifying payments made</Label>
                <Input type="number" max={120} value={paymentsAlreadyMade} onChange={e => setPaymentsAlreadyMade(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Discount rate %</Label>
                <Input type="number" step="0.1" value={discountRate} onChange={e => setDiscountRate(+e.target.value)} />
              </div>
            </div>

            <div className="rounded-lg border p-4">
              <label className="flex items-center gap-2 font-medium">
                <input type="checkbox" checked={inQualifyingEmployment} onChange={e => setInQualifyingEmployment(e.target.checked)} />
                In qualifying public-service employment (501(c)(3) or government)
              </label>
              {inQualifyingEmployment ? (
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Program survives: {programContinuation}%</Label>
                    <Input type="range" min={0} max={100} value={programContinuation} onChange={e => setProgramContinuation(+e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Stays in qualifying job: {employmentContinuity}%</Label>
                    <Input type="range" min={0} max={100} value={employmentContinuity} onChange={e => setEmploymentContinuity(+e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Certification kept current: {certificationCompliance}%</Label>
                    <Input type="range" min={0} max={100} value={certificationCompliance} onChange={e => setCertificationCompliance(+e.target.value)} />
                  </div>
                  <p className="text-xs text-muted-foreground md:col-span-3">
                    These compound. Joint probability is{" "}
                    <strong>
                      {Math.round((programContinuation / 100) * (employmentContinuity / 100) * (certificationCompliance / 100) * 100)}%
                    </strong>
                    , not the highest single factor.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Refinance rate %</Label>
                <Input type="number" step="0.1" value={refinanceRate} onChange={e => setRefinanceRate(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Refinance term (yrs)</Label>
                <Input type="number" value={refinanceTermYears} onChange={e => setRefinanceTermYears(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">IUL cash value</Label>
                <Input type="number" value={iulCashValue} onChange={e => setIulCashValue(+e.target.value)} />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">IUL crediting %</Label>
                <Input type="number" step="0.1" value={iulCreditingRate} onChange={e => setIulCreditingRate(+e.target.value)} />
              </div>
            </div>

            <Button onClick={analyze} disabled={run.isPending} className="w-full md:w-auto">
              {run.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Analyze refinancing decision
            </Button>
          </CardContent>
        </Card>

        {result ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5" />
                    Decision
                  </CardTitle>
                  <Badge variant="outline" className={REC_STYLE[result.recommendation]}>
                    {result.recommendation.replace(/_/g, " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Joint PSLF probability</p>
                  <p className="mt-1 text-2xl font-semibold">{Math.round(result.pslf.jointProbability * 100)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">PSLF NPV (raw)</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.pslf.rawNPV)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">PSLF NPV (risk-adjusted)</p>
                  <p className="mt-1 text-2xl font-semibold">{fmt(result.pslf.riskAdjustedNPV)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Decision margin</p>
                  <p className={`mt-1 text-2xl font-semibold ${result.decisionMargin >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                    {result.decisionMargin >= 0 ? "+" : ""}
                    {fmt(result.decisionMargin)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Repayment plan projections (SLFAM)</CardTitle>
                <CardDescription>
                  {result.pslf.monthsRemaining} qualifying payments remain. Recommended plan:{" "}
                  <strong>{result.pslf.projections.find(p => p.plan === result.pslf.recommendedPlan)?.label}</strong>
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[660px] text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="pb-2 pr-3">Plan</th>
                      <th className="pb-2 pr-3">First-year payment</th>
                      <th className="pb-2 pr-3">Total paid</th>
                      <th className="pb-2 pr-3">Balance forgiven</th>
                      <th className="pb-2">PV of payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.pslf.projections.map(p => (
                      <tr
                        key={p.plan}
                        className={`border-b border-border/40 ${p.plan === result.pslf.recommendedPlan ? "bg-emerald-500/5" : ""}`}
                      >
                        <td className="py-2 pr-3 font-medium">{p.label}</td>
                        <td className="py-2 pr-3">{fmt(p.firstYearMonthlyPayment)}/mo</td>
                        <td className="py-2 pr-3">{fmt(p.totalPaidToForgiveness)}</td>
                        <td className="py-2 pr-3 font-semibold text-emerald-400">{fmt(p.balanceForgiven)}</td>
                        <td className="py-2">{fmt(p.presentValueOfPayments)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-muted-foreground">
                  Forgiveness tax: {fmt(result.pslf.forgivenessTax)} — PSLF forgiveness is excluded from gross income
                  under IRC § 108(f)(1).
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>IUL collateral integration (ICIE)</CardTitle>
                <CardDescription>
                  Pledged cash value is {Math.round(result.collateral.cashValueToLoanRatio * 100)}% of the balance,
                  earning a {(result.collateral.rateReduction * 100).toFixed(2)}% rate reduction.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Payment without collateral</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.collateral.monthlyPaymentBase)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Payment with collateral</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.collateral.monthlyPaymentCollateralized)}/mo</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Interest saved</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.collateral.interestSaved)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Reinforcing cycle value</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-500">{fmt(result.collateral.reinforcingCycleCashValue)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dual-benefit structure</CardTitle>
                <CardDescription>
                  PSLF clears the debt while the payment differential funds IUL — the combination neither path
                  produces alone.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Monthly differential</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.dualBenefit.monthlyDifferential)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">IUL at forgiveness</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.dualBenefit.iulValueAtForgiveness)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Combined benefit</p>
                  <p className="mt-1 text-lg font-semibold">{fmt(result.dualBenefit.combinedBenefit)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">vs. best single strategy</p>
                  <p className={`mt-1 text-lg font-semibold ${result.dualBenefit.advantageOverBestSingle >= 0 ? "text-emerald-500" : "text-rose-400"}`}>
                    {result.dualBenefit.advantageOverBestSingle >= 0 ? "+" : ""}
                    {fmt(result.dualBenefit.advantageOverBestSingle)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-rose-400" />
                  Permanently forfeited by refinancing
                </CardTitle>
                <CardDescription>
                  Refinance at {(result.refinance.rate * 100).toFixed(2)}% · {fmt(result.refinance.monthlyPayment)}/mo ·{" "}
                  {fmt(result.refinance.totalInterest)} total interest
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {result.refinance.forfeited.map((f, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {result.criticalFindings.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                    Critical findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    {result.criticalFindings.map((f, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Authority</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {result.irsReferences.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>
          </>
        ) : null}

        <PageInsights pageId="physician-loan-refi" />
      </div>
    </AppShell>
  );
}
