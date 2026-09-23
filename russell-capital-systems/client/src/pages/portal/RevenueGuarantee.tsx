// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Shield,
  DollarSign,
  CheckCircle,
  Star,
  Trophy,
  Clock,
  Sparkles,
  Calculator,
  Users,
  Heart,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   SECRET #83 — THE REVENUE GUARANTEE (WIRED TO BACKEND)
   ═══════════════════════════════════════════════════════════════════ */

function ROICalculator() {
  const [monthlyFee, setMonthlyFee] = useState(297);
  const [clientsPerMonth, setClientsPerMonth] = useState(2);
  const [avgPremium, setAvgPremium] = useState(50000);
  const [avgCommission, setAvgCommission] = useState(7);

  const annualCost = monthlyFee * 12;
  const revenuePerClient = avgPremium * (avgCommission / 100);
  const annualRevenue = revenuePerClient * clientsPerMonth * 12;
  const roi = annualCost > 0 ? ((annualRevenue - annualCost) / annualCost * 100) : 0;
  const multiplier = annualCost > 0 ? (annualRevenue / annualCost) : 0;

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-900/10 border-emerald-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-white flex items-center gap-2">
            <Calculator size={16} className="text-emerald-400" /> ROI Calculator
          </CardTitle>
          <p className="text-xs text-slate-500">See exactly how much money Russell Capital makes you.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Monthly Subscription</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-2 top-2.5 text-slate-500" />
                <Input type="number" value={monthlyFee} onChange={e => setMonthlyFee(Number(e.target.value))} className="bg-slate-900/50 border-slate-700 text-sm h-9 pl-7" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium">New Clients/Month</label>
              <Input type="number" value={clientsPerMonth} onChange={e => setClientsPerMonth(Number(e.target.value))} className="bg-slate-900/50 border-slate-700 text-sm h-9" />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Avg Premium</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-2 top-2.5 text-slate-500" />
                <Input type="number" value={avgPremium} onChange={e => setAvgPremium(Number(e.target.value))} className="bg-slate-900/50 border-slate-700 text-sm h-9 pl-7" />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-medium">Avg Commission %</label>
              <Input type="number" value={avgCommission} onChange={e => setAvgCommission(Number(e.target.value))} className="bg-slate-900/50 border-slate-700 text-sm h-9" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-red-400 font-medium">Annual Cost</p>
            <p className="text-xl font-black text-red-400">${annualCost.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">${monthlyFee}/mo x 12</p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-[10px] text-emerald-400 font-medium">Annual Revenue</p>
            <p className="text-xl font-black text-emerald-400">${annualRevenue.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">{clientsPerMonth * 12} clients</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border-yellow-500/30">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-yellow-400 font-bold mb-2">Your Return on Investment</p>
          <p className="text-5xl font-black text-yellow-400">{multiplier.toFixed(0)}x</p>
          <p className="text-sm text-white mt-2">For every $1 you spend, you make <span className="text-yellow-400 font-bold">${multiplier.toFixed(2)}</span> back</p>
          <p className="text-xs text-slate-500 mt-1">{roi.toFixed(0)}% ROI</p>
          <div className="mt-4 bg-black/20 rounded-xl p-3">
            <p className="text-xs text-emerald-400 font-bold">Net Profit: ${(annualRevenue - annualCost).toLocaleString()}/year</p>
            <p className="text-[10px] text-slate-500">That's ${Math.round((annualRevenue - annualCost) / 12).toLocaleString()}/month in your pocket</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ObjectionEliminator() {
  const objections = [
    { objection: "It's too expensive", response: "Hypothetically, at $297/month, one extra client every 8.5 months at the commission you enter would cover the cost. Run the ROI calculator with your own numbers; results depend on you, and we do not publish an average.", icon: DollarSign, color: "text-emerald-400", stat: "Your numbers" },
    { objection: "I don't have time to learn a new platform", response: "The Morning Ritual takes 90 seconds. The Toilet Dashboard works while you're in the bathroom. Our AI does the heavy lifting — you just approve and send.", icon: Clock, color: "text-blue-400", stat: "90 sec/day" },
    { objection: "I already have a CRM", response: "This isn't a CRM. This is a wealth-building game that happens to manage clients. Your CRM doesn't have AI strategy recommendations, gamified quests, or a pet that grows with your business.", icon: Sparkles, color: "text-emerald-400", stat: "69+ tools" },
    { objection: "What if it doesn't work for me?", response: "Cancel any time; your access runs to the end of the period you paid for. Subscription payments are non-refundable, as the Pricing page states, so try the tools on a real case before you commit.", icon: Shield, color: "text-yellow-400", stat: "Cancel anytime" },
    { objection: "I'm not tech-savvy", response: "If you can scroll TikTok, you can use Russell Capital. Our interface is designed for one-thumb operation. The AI handles the complexity.", icon: Heart, color: "text-pink-400", stat: "1-thumb UX" },
    { objection: "My clients won't use it", response: "Your clients don't need to use it. YOU use it to serve them better. When they see their Client Portal with hypothetical projections based on their facts, the conversation gets easier.", icon: Users, color: "text-cyan-400", stat: "Client Portal" },
  ];

  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Shield size={18} className="text-yellow-400" /> Objection Eliminator
        </h3>
        <p className="text-xs text-slate-500">Every objection, answered plainly.</p>
      </div>
      {objections.map((obj, i) => {
        const Icon = obj.icon;
        const isExpanded = expanded === i;
        return (
          <Card key={i} className={`border cursor-pointer transition-all ${isExpanded ? "bg-slate-800/80 border-slate-600" : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70"}`}
            onClick={() => setExpanded(isExpanded ? null : i)}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Icon size={14} className={obj.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-400">"{obj.objection}"</p>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] shrink-0">{obj.stat}</Badge>
              </div>
              {isExpanded && (
                <div className="mt-3 pl-11">
                  <p className="text-xs text-emerald-400 font-bold mb-1">The Truth:</p>
                  <p className="text-xs text-white/80 leading-relaxed">{obj.response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function GuaranteeTiers() {
  // Made consistent with /pricing on 23 Sep 2026. This page used to promise "we refund every penny",
  // a 30-day refund, a 90-day refund and a 6-month ROI refund while /pricing said every payment is
  // non-refundable. The stricter /pricing terms govern; this page now says the same thing.
  const terms = [
    { name: "Payments", period: "Every plan", promise: "All subscription payments, monthly or annual, are non-refundable, as stated on the Pricing page.", icon: "🧾", color: "border-blue-500/30 bg-blue-500/5" },
    { name: "Cancellation", period: "Any time", promise: "Cancel whenever you like. The cancellation takes effect at the end of the current billing period, and you keep access until then.", icon: "🛡️", color: "border-yellow-500/30 bg-yellow-500/5" },
    { name: "The Lifetime Promise", period: "Forever", promise: "If at any point you feel the platform isn't working for you, talk to Sam directly.", icon: "💎", color: "border-emerald-500/30 bg-emerald-500/5" },
  ];

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Trophy size={18} className="text-yellow-400" /> Our Terms
        </h3>
        <p className="text-xs text-slate-500">Plain terms, the same as the Pricing page.</p>
      </div>
      {terms.map((tier, i) => (
        <Card key={i} className={`${tier.color} border`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{tier.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-white">{tier.name}</p>
                  <Badge className="bg-black/20 text-white/60 border-white/10 text-[10px]">{tier.period}</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">{tier.promise}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function SocialProof() {
  // The four testimonials that lived here ("Mike T.", "Sarah L."…) had no source, consent or date on file.
  // Testimonials must be genuine and current (16 CFR 255; NAIC Model 570 §5.Q), so none are shown until real ones exist.
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Star size={18} className="text-yellow-400" /> What Advisors Say
        </h3>
      </div>
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <p className="text-xs text-slate-400">
            No testimonials are shown yet. We will publish them only when they are real, current, and given with the advisor's consent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function RevenueGuaranteePage() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "RevenueGuarantee",
    strategyType: "annuity-income",
  });

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("calculator");

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            <Shield className="text-yellow-400" /> The Revenue Case
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            A hypothetical return-on-subscription calculator, run on your own numbers. Results are not guaranteed.
            Subscription payments are non-refundable (see Pricing); cancel any time.
          </p>
        </div>

        <ClientSelectorBar
          clients={calcIntegration.clients}
          clientsLoading={calcIntegration.clientsLoading}
          selectedClientId={calcIntegration.selectedClientId}
          selectedClientName={calcIntegration.selectedClientName}
          onSelectClient={calcIntegration.selectClient}
          scenarios={calcIntegration.scenarios}
          scenariosLoading={calcIntegration.scenariosLoading}
          scenarioName={calcIntegration.scenarioName}
          onSetScenarioName={calcIntegration.setScenarioName}
          onSave={() => calcIntegration.saveScenario({}, {})}
          onLoad={(s) => calcIntegration.loadScenario(s)}
          isSaving={calcIntegration.isSaving}
          lastSavedAt={calcIntegration.lastSavedAt}
          calculatorName="RevenueGuarantee"
        />
        <Card className="bg-gradient-to-r from-yellow-500/10 to-emerald-500/10 border-yellow-500/20">
          <CardContent className="p-6 text-center">
            <p className="text-xs text-yellow-400 font-bold">Hypothetical ROI</p>
            <p className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-emerald-400">24x</p>
            <p className="text-sm text-white mt-1">Per dollar of subscription, in this example</p>
            <p className="text-xs text-slate-500 mt-1">Example only: 2 additional clients/month at $50K average premium and 7% commission. Not an average of actual advisors; your results will differ.</p>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50 border border-slate-700/50">
            <TabsTrigger value="calculator" className="text-xs">ROI Calculator</TabsTrigger>
            <TabsTrigger value="objections" className="text-xs">Objections</TabsTrigger>
            <TabsTrigger value="guarantees" className="text-xs">Terms</TabsTrigger>
            <TabsTrigger value="proof" className="text-xs">Testimonials</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator"><ROICalculator /></TabsContent>
          <TabsContent value="objections"><ObjectionEliminator /></TabsContent>
          <TabsContent value="guarantees"><GuaranteeTiers /></TabsContent>
          <TabsContent value="proof"><SocialProof /></TabsContent>
        </Tabs>

        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/20 border-emerald-500/30">
          <CardContent className="p-6 text-center space-y-3">
            <CheckCircle className="text-emerald-400 mx-auto" size={32} />
            <h3 className="text-lg font-black text-white">Clear Terms. Your Numbers.</h3>
            <p className="text-xs text-slate-400">
              Use Russell Capital to model more cases, more clearly, for your clients.
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <CheckCircle size={12} className="text-emerald-400" /> Non-refundable, as on the Pricing page
              <CheckCircle size={12} className="text-emerald-400" /> Cancel anytime
              <CheckCircle size={12} className="text-emerald-400" /> Access through the paid period
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
