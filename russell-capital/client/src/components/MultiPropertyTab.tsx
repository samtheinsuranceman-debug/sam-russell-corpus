// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
import { NumberInput } from "@/components/NumberInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Home, Plus, Trash2, DollarSign, TrendingUp, PiggyBank,
  Fuel, Banknote, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  BarChart3, Building2, Zap,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import {
  runMultiPropertyMyga, createDefaultProperty, getDefaultMultiPropertyInput,
} from "@shared/multiPropertyMyga";
import type { MultiPropertyInput, PropertyInput, MultiPropertyResult } from "@shared/multiPropertyMyga";
import { ExportToSlides } from "@/components/ExportToSlides";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const PROPERTY_COLORS = [
  "#8b5cf6","#06b6d4","#f59e0b","#ec4899","#14b8a6",
  "#f97316","#6366f1","#84cc16","#e11d48","#0ea5e9",
  "#a855f7","#22d3ee","#fbbf24","#f472b6","#2dd4bf",
];
const MAX_PROPERTIES = 150;

export function MultiPropertyTab() {
  const [input, setInput] = useState<MultiPropertyInput>(getDefaultMultiPropertyInput());
  const [expandedProperties, setExpandedProperties] = useState<Set<number>>(new Set([1]));
  const [showAllYears, setShowAllYears] = useState(false);
  const [selectedPropertyView, setSelectedPropertyView] = useState<number | "all">("all");

  const addProperty = useCallback(() => {
    if (input.properties.length >= MAX_PROPERTIES) { toast.error("Maximum 150 properties"); return; }
    const nextId = Math.max(0, ...input.properties.map(p => p.id)) + 1;
    setInput(prev => ({ ...prev, properties: [...prev.properties, createDefaultProperty(nextId)] }));
    setExpandedProperties(prev => new Set([...prev, nextId]));
    toast.success("Property " + nextId + " added");
  }, [input.properties]);

  const removeProperty = useCallback((id: number) => {
    if (input.properties.length <= 1) { toast.error("At least one property required"); return; }
    setInput(prev => ({ ...prev, properties: prev.properties.filter(p => p.id !== id) }));
  }, [input.properties.length]);

  const updateProperty = useCallback((id: number, updates: Partial<PropertyInput>) => {
    setInput(prev => ({ ...prev, properties: prev.properties.map(p => p.id === id ? { ...p, ...updates } : p) }));
  }, []);

  const toggleExpand = useCallback((id: number) => {
    setExpandedProperties(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }, []);

  const addBulkProperties = useCallback((count: number) => {
    const remaining = MAX_PROPERTIES - input.properties.length;
    const toAdd = Math.min(count, remaining);
    if (toAdd <= 0) { toast.error("Maximum reached"); return; }
    const maxId = Math.max(0, ...input.properties.map(p => p.id));
    const newProps = Array.from({ length: toAdd }, (_, i) => createDefaultProperty(maxId + i + 1));
    setInput(prev => ({ ...prev, properties: [...prev.properties, ...newProps] }));
    toast.success(toAdd + " properties added (" + (input.properties.length + toAdd) + " total)");
  }, [input.properties]);

  const result = useMemo<MultiPropertyResult | null>(() => {
    try { return runMultiPropertyMyga(input); } catch (e) { console.error(e); return null; }
  }, [input]);

  const helocPaydownChart = useMemo(() => {
    if (!result) return [];
    return result.consolidatedProjection.map(row => ({
      year: "Yr " + row.year,
      helocBalance: Math.round(row.totalHelocBalance),
      principalPaid: Math.round(row.totalHelocPrincipalPaid),
      taxSavingsApplied: Math.round(row.taxSavingsToHelocPrincipal),
      cumulativePaid: Math.round(row.cumulativeHelocPrincipalPaid),
    }));
  }, [result]);

  const taxSavingsChart = useMemo(() => {
    if (!result) return [];
    return result.consolidatedProjection.map(row => ({
      year: "Yr " + row.year,
      federalSaved: Math.round(row.federalTaxSaved),
      stateSaved: Math.round(row.stateTaxSaved),
      totalSaved: Math.round(row.totalTaxSaved),
      cumulative: Math.round(row.cumulativeTaxSaved),
      carryforward: Math.round(row.creditCarryforwardOut),
    }));
  }, [result]);

  const incomeVsDeductionChart = useMemo(() => {
    if (!result) return [];
    return result.consolidatedProjection.map(row => ({
      year: "Yr " + row.year,
      householdIncome: Math.round(row.householdIncome),
      ogDeduction: Math.round(row.ogDeductionApplied),
      taxableAfter: Math.round(row.householdIncome - row.taxableIncomeReduction),
      creditCarryforward: Math.round(row.creditCarryforwardOut),
    }));
  }, [result]);

  const irmaaChart = useMemo(() => {
    if (!result) return [];
    return result.summary.irmaaImpact.map(row => ({
      year: "Yr " + row.year,
      originalSurcharge: Math.round(row.totalSurcharge),
      adjustedSurcharge: Math.round(row.totalSurcharge - row.surchargeReduction),
      savings: Math.round(row.surchargeReduction),
    }));
  }, [result]);

  const activeCount = input.properties.filter(p => p.active).length;
  const totalHeloc = input.properties.filter(p => p.active).reduce((s, p) => s + Math.max(0, p.homeValue * p.helocMaxLtv - p.mortgageBalance), 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <Card className="border-purple-500/30 bg-gradient-to-r from-purple-950/40 to-pink-950/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Home className="w-6 h-6 text-purple-400" />
                Multi-Property HELOC {">"} MYGA {">"} O&G Engine
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Add up to 150 properties. Each HELOC funds a MYGA, bank loan funds O&G investment.
                Tax savings from O&G depreciation pay down HELOC principal every year.
              </p>
            </div>
            <ExportToSlides pageTitle="Multi-Property MYGA Analysis" dataSummary={result ? activeCount + " properties, " + fmt(totalHeloc) + " total HELOC" : ""} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <p className="text-2xl font-bold text-purple-400">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Properties</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <p className="text-2xl font-bold text-cyan-400">{fmt(totalHeloc)}</p>
              <p className="text-xs text-muted-foreground">Total HELOC</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-400">{result ? fmt(result.summary.totalTaxSaved) : "$0"}</p>
              <p className="text-xs text-muted-foreground">Total Tax Saved</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-2xl font-bold text-amber-400">{result ? fmt(result.summary.totalNetBenefit) : "$0"}</p>
              <p className="text-xs text-muted-foreground">Total Net Benefit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* HOUSEHOLD INCOME & TAX SETTINGS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Household Income & Tax Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <Label className="text-xs">Annual Household Income</Label>
              <NumberInput value={input.household.annualIncome} onChange={(v) => setInput(prev => ({ ...prev, household: { ...prev.household, annualIncome: v } }))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Federal Tax Rate (%)</Label>
              <NumberInput value={input.household.federalTaxRate} onChange={(v) => setInput(prev => ({ ...prev, household: { ...prev.household, federalTaxRate: v } }))} step={1} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">State Tax Rate (%)</Label>
              <NumberInput value={input.household.stateTaxRate} onChange={(v) => setInput(prev => ({ ...prev, household: { ...prev.household, stateTaxRate: v } }))} step={0.5} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Filing Status</Label>
              <Select value={input.household.filingStatus} onValueChange={(v) => setInput(prev => ({ ...prev, household: { ...prev.household, filingStatus: v } }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="married">Married Filing Jointly</SelectItem>
                  <SelectItem value="single">Single</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Projection Years</Label>
              <NumberInput value={input.projectionYears} onChange={(v) => setInput(prev => ({ ...prev, projectionYears: v }))} step={1} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 mt-4">
            <div>
              <Label className="text-xs">MYGA Rate (%)</Label>
              <NumberInput value={input.mygaRate} onChange={(v) => setInput(prev => ({ ...prev, mygaRate: v }))} step={0.25} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bank LTV (%)</Label>
              <NumberInput value={input.bankLtv * 100} onChange={(v) => setInput(prev => ({ ...prev, bankLtv: v / 100 }))} step={5} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bank Loan Rate (%)</Label>
              <NumberInput value={input.bankLoanRate} onChange={(v) => setInput(prev => ({ ...prev, bankLoanRate: v }))} step={0.25} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">O&G Return (%)</Label>
              <NumberInput value={input.oilGasReturnRate} onChange={(v) => setInput(prev => ({ ...prev, oilGasReturnRate: v }))} step={1} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">O&G Depreciation Y1 (%)</Label>
              <NumberInput value={input.oilGasDepreciationY1} onChange={(v) => setInput(prev => ({ ...prev, oilGasDepreciationY1: v }))} step={5} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Tax Deployment</Label>
              <Select value={input.taxDeployment} onValueChange={(v) => setInput(prev => ({ ...prev, taxDeployment: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="payback_heloc">Pay HELOC Principal</SelectItem>
                  <SelectItem value="pay_bank_interest">Pay Bank Interest</SelectItem>
                  <SelectItem value="buy_more_myga">Buy More MYGA</SelectItem>
                  <SelectItem value="pay_bank_principal">Pay Bank Principal</SelectItem>
                  <SelectItem value="optimal_blend">Optimal Blend</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PROPERTY MANAGEMENT */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" /> Properties ({input.properties.length} / {MAX_PROPERTIES})
            </CardTitle>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={addProperty} className="bg-purple-600 hover:bg-purple-700"><Plus className="w-4 h-4 mr-1" /> Add Property</Button>
              <Button size="sm" variant="outline" onClick={() => addBulkProperties(5)}>+5</Button>
              <Button size="sm" variant="outline" onClick={() => addBulkProperties(10)}>+10</Button>
              <Button size="sm" variant="outline" onClick={() => addBulkProperties(25)}>+25</Button>
              <Button size="sm" variant="outline" onClick={() => addBulkProperties(50)}>+50</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {input.properties.map((prop, idx) => {
              const helocAvail = Math.max(0, prop.homeValue * prop.helocMaxLtv - prop.mortgageBalance);
              const isExpanded = expandedProperties.has(prop.id);
              const color = PROPERTY_COLORS[idx % PROPERTY_COLORS.length];
              return (
                <div key={prop.id} className={"border rounded-lg p-3 transition-all " + (prop.active ? "border-purple-500/30 bg-purple-500/5" : "border-muted/30 bg-muted/5 opacity-60")}>
                  <div className="flex items-center justify-between gap-3 cursor-pointer" onClick={() => toggleExpand(prop.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <Input value={prop.label} onChange={(e) => updateProperty(prop.id, { label: e.target.value })} className="h-7 w-40 text-sm font-medium" onClick={(e) => e.stopPropagation()} />
                      <Badge variant="outline" className="text-xs">HELOC: {fmt(helocAvail)}</Badge>
                      <Badge variant={prop.active ? "default" : "secondary"} className="text-xs">{prop.active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); updateProperty(prop.id, { active: !prop.active }); }}>{prop.active ? "Disable" : "Enable"}</Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={(e) => { e.stopPropagation(); removeProperty(prop.id); }}><Trash2 className="w-4 h-4" /></Button>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-muted/20">
                      <div><Label className="text-xs">Home Value</Label><NumberInput value={prop.homeValue} onChange={(v) => updateProperty(prop.id, { homeValue: v })} className="mt-1" /></div>
                      <div><Label className="text-xs">Mortgage Balance</Label><NumberInput value={prop.mortgageBalance} onChange={(v) => updateProperty(prop.id, { mortgageBalance: v })} className="mt-1" /></div>
                      <div><Label className="text-xs">HELOC Rate (%)</Label><NumberInput value={prop.helocRate} onChange={(v) => updateProperty(prop.id, { helocRate: v })} step={0.25} className="mt-1" /></div>
                      <div><Label className="text-xs">HELOC Max LTV (%)</Label><NumberInput value={prop.helocMaxLtv * 100} onChange={(v) => updateProperty(prop.id, { helocMaxLtv: v / 100 })} step={5} className="mt-1" /></div>
                      <div><Label className="text-xs">Entry Year</Label><NumberInput value={prop.entryYear} onChange={(v) => updateProperty(prop.id, { entryYear: Math.max(1, v) })} step={1} className="mt-1" /></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* RESULTS */}
      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="border-purple-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-purple-400">{result.summary.totalProperties}</p><p className="text-[10px] text-muted-foreground">Properties</p></CardContent></Card>
            <Card className="border-cyan-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-cyan-400">{fmt(result.summary.totalHelocOriginal)}</p><p className="text-[10px] text-muted-foreground">Total HELOC</p></CardContent></Card>
            <Card className="border-emerald-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-emerald-400">{fmt(result.summary.totalTaxSaved)}</p><p className="text-[10px] text-muted-foreground">Tax Saved</p></CardContent></Card>
            <Card className="border-amber-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-amber-400">{fmt(result.summary.totalHelocPrincipalPaid)}</p><p className="text-[10px] text-muted-foreground">HELOC Paid Down</p></CardContent></Card>
            <Card className="border-pink-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-pink-400">{fmt(result.summary.totalHelocRemaining)}</p><p className="text-[10px] text-muted-foreground">HELOC Remaining</p></CardContent></Card>
            <Card className="border-indigo-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-indigo-400">{fmt(result.summary.totalOGIncome)}</p><p className="text-[10px] text-muted-foreground">Total O&G Income</p></CardContent></Card>
            <Card className="border-teal-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-teal-400">{result.summary.propertiesPaidOff}</p><p className="text-[10px] text-muted-foreground">HELOCs Paid Off</p></CardContent></Card>
            <Card className="border-orange-500/20"><CardContent className="p-3 text-center"><p className="text-lg font-bold text-orange-400">{result.summary.averagePayoffYear ? "Yr " + result.summary.averagePayoffYear : "N/A"}</p><p className="text-[10px] text-muted-foreground">Avg Payoff Year</p></CardContent></Card>
          </div>

          {/* CHART 1: HELOC Paydown */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> HELOC Balance Paydown (All Properties Combined)</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={helocPaydownChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Area type="monotone" dataKey="helocBalance" name="HELOC Balance" fill="#8b5cf6" fillOpacity={0.3} stroke="#8b5cf6" />
                  <Bar dataKey="principalPaid" name="Principal Paid" fill="#10b981" />
                  <Bar dataKey="taxSavingsApplied" name="Tax Savings Applied" fill="#f59e0b" />
                  <Line type="monotone" dataKey="cumulativePaid" name="Cumulative Paid" stroke="#06b6d4" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CHART 2: Tax Savings */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><PiggyBank className="w-5 h-5 text-amber-400" /> Annual Tax Savings from O&G Depreciation</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={taxSavingsChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="federalSaved" name="Federal Tax Saved" stackId="tax" fill="#3b82f6" />
                  <Bar dataKey="stateSaved" name="State Tax Saved" stackId="tax" fill="#8b5cf6" />
                  <Line type="monotone" dataKey="cumulative" name="Cumulative Saved" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="carryforward" name="Credit Carryforward" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CHART 3: Income vs Deduction */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-400" /> Household Income vs O&G Deduction (Tax Credit Rollover)</CardTitle>
              <p className="text-xs text-muted-foreground">Shows how O&G depreciation reduces taxable income each year. Unused deductions carry forward.</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={incomeVsDeductionChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Bar dataKey="householdIncome" name="Household Income" fill="#6366f1" fillOpacity={0.3} />
                  <Bar dataKey="ogDeduction" name="O&G Deduction Applied" fill="#10b981" />
                  <Line type="monotone" dataKey="taxableAfter" name="Taxable After Deduction" stroke="#f59e0b" strokeWidth={2} />
                  <Line type="monotone" dataKey="creditCarryforward" name="Credit Carryforward" stroke="#ef4444" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* CHART 4: IRMAA Impact */}
          {result.summary.irmaaImpact.some((r) => r.totalSurcharge > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-400" /> IRMAA Impact Year-by-Year</CardTitle>
                <p className="text-xs text-muted-foreground">O&G deductions reduce MAGI, potentially lowering IRMAA tier and saving thousands in Medicare surcharges.</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={irmaaChart}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => "$" + (v / 1000).toFixed(0) + "k"} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Legend />
                    <Bar dataKey="originalSurcharge" name="Original IRMAA" fill="#ef4444" fillOpacity={0.4} />
                    <Bar dataKey="adjustedSurcharge" name="After O&G Deduction" fill="#10b981" />
                    <Bar dataKey="savings" name="IRMAA Savings" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-muted/30">
                      <th className="text-left py-2 px-2">Year</th><th className="text-right py-2 px-2">MAGI</th><th className="text-right py-2 px-2">Adjusted MAGI</th>
                      <th className="text-center py-2 px-2">Orig Tier</th><th className="text-center py-2 px-2">New Tier</th>
                      <th className="text-right py-2 px-2">Part B</th><th className="text-right py-2 px-2">Part D</th><th className="text-right py-2 px-2 text-emerald-400">Savings</th>
                    </tr></thead>
                    <tbody>
                      {result.summary.irmaaImpact.slice(0, showAllYears ? undefined : 10).map((row) => (
                        <tr key={row.year} className="border-b border-muted/10 hover:bg-muted/5">
                          <td className="py-2 px-2">Year {row.year}</td>
                          <td className="py-2 px-2 text-right">{fmt(row.magi)}</td>
                          <td className="py-2 px-2 text-right">{fmt(row.adjustedMagi)}</td>
                          <td className="py-2 px-2 text-center"><Badge variant="outline" className="text-[10px]">{row.tier}</Badge></td>
                          <td className="py-2 px-2 text-center"><Badge className={"text-[10px] " + (row.adjustedTier !== row.tier ? "bg-emerald-500/20 text-emerald-400" : "")}>{row.adjustedTier}</Badge></td>
                          <td className="py-2 px-2 text-right">{fmt(row.partBSurcharge)}</td>
                          <td className="py-2 px-2 text-right">{fmt(row.partDSurcharge)}</td>
                          <td className="py-2 px-2 text-right font-bold text-emerald-400">{fmt(row.surchargeReduction)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {result.summary.irmaaImpact.length > 10 && (
                    <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowAllYears(!showAllYears)}>
                      {showAllYears ? "Show Less" : "Show All " + result.summary.irmaaImpact.length + " Years"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CONSOLIDATED TABLE */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-400" /> Consolidated Year-by-Year Projection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-muted/30">
                    <th className="text-left py-2 px-2">Year</th><th className="text-right py-2 px-2">HELOC Bal</th><th className="text-right py-2 px-2">HELOC Int</th>
                    <th className="text-right py-2 px-2">HELOC Princ</th><th className="text-right py-2 px-2">MYGA Value</th><th className="text-right py-2 px-2">Bank Loan</th>
                    <th className="text-right py-2 px-2">O&G Income</th><th className="text-right py-2 px-2">O&G Deduction</th><th className="text-right py-2 px-2">Tax Saved</th>
                    <th className="text-right py-2 px-2">Tax to HELOC</th><th className="text-right py-2 px-2">Carryforward</th><th className="text-right py-2 px-2 text-emerald-400">Net Cash</th>
                  </tr></thead>
                  <tbody>
                    {result.consolidatedProjection.slice(0, showAllYears ? undefined : 15).map((row) => (
                      <tr key={row.year} className="border-b border-muted/10 hover:bg-muted/5">
                        <td className="py-2 px-2 font-medium">Yr {row.year}</td>
                        <td className="py-2 px-2 text-right">{fmt(row.totalHelocBalance)}</td>
                        <td className="py-2 px-2 text-right text-red-400">{fmt(row.totalHelocInterest)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400">{fmt(row.totalHelocPrincipalPaid)}</td>
                        <td className="py-2 px-2 text-right">{fmt(row.totalMygaValue)}</td>
                        <td className="py-2 px-2 text-right">{fmt(row.totalBankLoanBalance)}</td>
                        <td className="py-2 px-2 text-right text-cyan-400">{fmt(row.totalOGIncome)}</td>
                        <td className="py-2 px-2 text-right">{fmt(row.ogDeductionApplied)}</td>
                        <td className="py-2 px-2 text-right text-amber-400">{fmt(row.totalTaxSaved)}</td>
                        <td className="py-2 px-2 text-right text-purple-400">{fmt(row.taxSavingsToHelocPrincipal)}</td>
                        <td className="py-2 px-2 text-right text-red-300">{fmt(row.creditCarryforwardOut)}</td>
                        <td className="py-2 px-2 text-right font-bold text-emerald-400">{fmt(row.totalNetCashFlow)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-muted/50 font-bold">
                    <td className="py-2 px-2">TOTAL</td>
                    <td className="py-2 px-2 text-right">{fmt(result.summary.totalHelocRemaining)}</td>
                    <td className="py-2 px-2 text-right text-red-400">-</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{fmt(result.summary.totalHelocPrincipalPaid)}</td>
                    <td className="py-2 px-2 text-right">{fmt(result.summary.totalMygaValue)}</td>
                    <td className="py-2 px-2 text-right">-</td>
                    <td className="py-2 px-2 text-right text-cyan-400">{fmt(result.summary.totalOGIncome)}</td>
                    <td className="py-2 px-2 text-right">-</td>
                    <td className="py-2 px-2 text-right text-amber-400">{fmt(result.summary.totalTaxSaved)}</td>
                    <td className="py-2 px-2 text-right text-purple-400">-</td>
                    <td className="py-2 px-2 text-right">-</td>
                    <td className="py-2 px-2 text-right text-emerald-400">{fmt(result.summary.totalNetBenefit)}</td>
                  </tr></tfoot>
                </table>
                {result.consolidatedProjection.length > 15 && (
                  <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => setShowAllYears(!showAllYears)}>
                    {showAllYears ? "Show Less" : "Show All " + result.consolidatedProjection.length + " Years"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* HOW IT WORKS */}
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-amber-400" /> How the Multi-Property Strategy Works</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-400">Step 1: HELOC from Each Property</h4>
                  <p className="text-muted-foreground text-xs">Take a HELOC against each property. Amount = (Home Value x Max LTV) - Mortgage Balance. Provides capital without selling.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-cyan-400">Step 2: Purchase MYGA with HELOC Funds</h4>
                  <p className="text-muted-foreground text-xs">Use HELOC proceeds to purchase a MYGA at 7%+ guaranteed rate. Bank lends 70% LTV against the MYGA for additional capital.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-400">Step 3: Invest in Oil & Gas</h4>
                  <p className="text-muted-foreground text-xs">Bank loan invests in O&G programs. Year 1: 80% depreciation deduction. Years 2+: 8% ongoing. O&G income pays bank loan interest.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-400">Step 4: Tax Savings Pay HELOC</h4>
                  <p className="text-muted-foreground text-xs">O&G depreciation reduces taxable income. Federal + state tax savings apply directly to HELOC principal. Unused deductions carry forward.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
