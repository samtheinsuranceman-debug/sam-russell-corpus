import { useMemo, useState } from "react";
import { Banknote, DollarSign, TrendingUp, ArrowUpDown, Calendar, Target, Percent, Shield, CheckCircle2, AlertTriangle, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from "recharts";
import { PageInsights } from "@/components/PageInsights";

// ============================================================
// CASH FLOW OPTIMIZER
// All amounts are annual and entered by the visitor. Every rate and split the page uses
// (how the surplus is deployed, the assumed growth and cash rates, the stress-test
// shocks) is an input with a neutral default; nothing is fixed in the code.
// ============================================================

type IncomeKey = "w2" | "form1099" | "k1" | "rental" | "dividends" | "capitalGains";
type ExpenseKey = "housing" | "utilities" | "food" | "transportation" | "entertainment" | "other";

const INCOME_FIELDS: ReadonlyArray<{ key: IncomeKey; label: string }> = [
  { key: "w2", label: "W-2" },
  { key: "form1099", label: "1099" },
  { key: "k1", label: "K-1" },
  { key: "rental", label: "Rental" },
  { key: "dividends", label: "Dividends" },
  { key: "capitalGains", label: "Capital Gains" },
];

const EXPENSE_FIELDS: ReadonlyArray<{ key: ExpenseKey; label: string; suggestion: string }> = [
  { key: "housing", label: "Housing", suggestion: "Review the mortgage rate and refinancing options" },
  { key: "utilities", label: "Utilities", suggestion: "Compare providers and efficiency upgrades" },
  { key: "food", label: "Food", suggestion: "Meal planning" },
  { key: "transportation", label: "Transportation", suggestion: "Compare ownership and commuting costs" },
  { key: "entertainment", label: "Entertainment", suggestion: "Audit recurring subscriptions" },
  { key: "other", label: "Other", suggestion: "Review and categorise" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const zeros = <K extends string>(keys: ReadonlyArray<{ key: K }>) =>
  Object.fromEntries(keys.map((k) => [k.key, 0])) as Record<K, number>;

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const num = (v: string) => parseFloat(v) || 0;

const inputStyle = { padding: "6px", margin: "4px", backgroundColor: "#2d3748", color: "#fff", border: "1px solid #38bdf8", borderRadius: 4 };

const CashFlowOptimizer = () => {
  const [incomes, setIncomes] = useState<Record<IncomeKey, number>>(() => zeros(INCOME_FIELDS));
  const [expenses, setExpenses] = useState<Record<ExpenseKey, number>>(() => zeros(EXPENSE_FIELDS));

  // Assumptions, all set by the visitor.
  const [debtPct, setDebtPct] = useState(40);
  const [investPct, setInvestPct] = useState(40);
  const [growthRate, setGrowthRate] = useState(5);
  const [cashRate, setCashRate] = useState(0);
  const [years, setYears] = useState(50);
  const [incomeLossPct, setIncomeLossPct] = useState(50);
  const [marketDropPct, setMarketDropPct] = useState(30);
  const [expenseRisePct, setExpenseRisePct] = useState(20);

  const insurancePct = Math.max(0, 100 - debtPct - investPct);

  const totalIncome = useMemo(() => Object.values(incomes).reduce((s, v) => s + v, 0), [incomes]);
  const totalExpenses = useMemo(() => Object.values(expenses).reduce((s, v) => s + v, 0), [expenses]);
  const surplus = totalIncome - totalExpenses;

  const deployment = useMemo(
    () => [
      { name: "Debt Payoff", pct: debtPct, value: (surplus * debtPct) / 100, icon: ArrowUpDown },
      { name: "Invest", pct: investPct, value: (surplus * investPct) / 100, icon: TrendingUp },
      { name: "Insurance Premium", pct: insurancePct, value: (surplus * insurancePct) / 100, icon: Shield },
    ],
    [surplus, debtPct, investPct, insurancePct],
  );
  const invested = deployment[1].value;

  const incomeData = INCOME_FIELDS.map((f) => ({ name: f.label, value: incomes[f.key] }));
  const monthlyData = MONTHS.map((month, i) => ({ month, value: (surplus / 12) * (i + 1) }));

  // Cumulative value of investing the invested share each year at the assumed growth rate,
  // against holding the same contributions at the assumed cash rate.
  const savingsComparison = useMemo(() => {
    const rows: { year: string; invested: number; cash: number }[] = [];
    let a = 0;
    let b = 0;
    const n = Math.max(1, Math.min(100, Math.round(years)));
    for (let y = 1; y <= n; y++) {
      a = (a + invested) * (1 + growthRate / 100);
      b = (b + invested) * (1 + cashRate / 100);
      rows.push({ year: `Year ${y}`, invested: Math.round(a), cash: Math.round(b) });
    }
    return rows;
  }, [invested, growthRate, cashRate, years]);
  const finalRow = savingsComparison[savingsComparison.length - 1];

  const stress = {
    jobLoss: totalIncome * (1 - incomeLossPct / 100) - totalExpenses,
    marketCrash: -invested * (marketDropPct / 100),
    disability: totalIncome - totalExpenses * (1 + expenseRisePct / 100),
  };

  const pctInput = (label: string, value: number, set: (v: number) => void, step = 1) => (
    <label style={{ display: "inline-block", marginRight: 12 }}>
      {label}
      <input type="number" step={step} value={value} onChange={(e) => set(num(e.target.value))} style={{ ...inputStyle, width: 90 }} />
    </label>
  );

  return (
    <div style={{ backgroundColor: "#1a202c", color: "#ffffff", minHeight: "100vh", padding: "20px" }}>
      <h1 style={{ color: "#38bdf8" }}>Cash Flow Optimizer</h1>
      <p>Enter annual amounts. Every assumption below is yours to set.</p>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <DollarSign color="#e11d48" /> Income Waterfall
        </h2>
        <div>
          {INCOME_FIELDS.map((f) => (
            <input
              key={f.key}
              type="number"
              placeholder={`${f.label} income`}
              aria-label={`${f.label} income`}
              onChange={(e) => setIncomes((prev) => ({ ...prev, [f.key]: num(e.target.value) }))}
              style={inputStyle}
            />
          ))}
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={incomeData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" name="Annual income" fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <Banknote color="#e11d48" /> Expense Categorization
        </h2>
        <div>
          {EXPENSE_FIELDS.map((f) => (
            <input
              key={f.key}
              type="number"
              placeholder={f.label}
              aria-label={`${f.label} expense`}
              onChange={(e) => setExpenses((prev) => ({ ...prev, [f.key]: num(e.target.value) }))}
              style={inputStyle}
            />
          ))}
        </div>
        <ul>
          {EXPENSE_FIELDS.map((f) => (
            <li key={f.key}>
              {f.label}: {money(expenses[f.key])} - Suggestion: {f.suggestion}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <Percent color="#38bdf8" /> Surplus
        </h2>
        <p>
          Income {money(totalIncome)} less expenses {money(totalExpenses)} = surplus <strong>{money(surplus)}</strong> a year.
          Route it to pre-tax accounts first, then Roth, then taxable.
        </p>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <Target color="#e11d48" /> Surplus Deployment
        </h2>
        <div>
          {pctInput("Debt payoff %", debtPct, setDebtPct)}
          {pctInput("Invest %", investPct, setInvestPct)}
          <span>Insurance premium %: {insurancePct} (the remainder)</span>
        </div>
        <ul>
          {deployment.map((item) => (
            <li key={item.name}>
              <item.icon color="#38bdf8" /> {item.name} ({item.pct}%): {money(item.value)}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <Calendar color="#e11d48" /> Cumulative Surplus Through the Year
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="value" name="Cumulative surplus" fill="#38bdf8" stroke="#e11d48" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <Zap color="#38bdf8" /> Invested vs Held as Cash
        </h2>
        <div>
          {pctInput("Assumed growth rate %", growthRate, setGrowthRate, 0.1)}
          {pctInput("Assumed cash rate %", cashRate, setCashRate, 0.1)}
          {pctInput("Years", years, setYears)}
        </div>
        <p>
          After {savingsComparison.length} years: invested {money(finalRow?.invested ?? 0)} vs cash {money(finalRow?.cash ?? 0)}.
        </p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={savingsComparison}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="invested" name="Invested at assumed growth rate" fill="#38bdf8" />
            <Line dataKey="cash" name="Held at assumed cash rate" stroke="#e11d48" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section style={{ marginBottom: "40px" }}>
        <h2>
          <AlertTriangle color="#e11d48" /> Cash Flow Stress Test
        </h2>
        <div>
          {pctInput("Income lost %", incomeLossPct, setIncomeLossPct)}
          {pctInput("Market drop %", marketDropPct, setMarketDropPct)}
          {pctInput("Expense rise %", expenseRisePct, setExpenseRisePct)}
        </div>
        <ul>
          <li>Surplus after losing {incomeLossPct}% of income: {money(stress.jobLoss)}</li>
          <li>Change in this year&apos;s invested amount after a {marketDropPct}% drop: {money(stress.marketCrash)}</li>
          <li>Surplus after a {expenseRisePct}% rise in expenses (e.g. disability): {money(stress.disability)}</li>
        </ul>
      </section>

      <section>
        <h2>
          <CheckCircle2 color="#38bdf8" /> Gross Income
        </h2>
        <p>Gross income (IRC 61) from the amounts entered: {money(totalIncome)}. Adjusted gross and taxable income need deductions this page does not collect.</p>
      </section>
      <PageInsights pageId="cash-flow-optimizer" />
    </div>
  );
};

export default CashFlowOptimizer;
