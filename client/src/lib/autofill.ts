// Auto-fill any calculator page from the shared client profile without
// wiring each page by hand: match every visible number/text input's label
// (aria-label, <label for>, placeholder, wrapping label text) against the
// profile vocabulary and set it the way React expects (native setter + input
// event). Pages that already read the profile are untouched by design; this
// is for the calculators that keep their own local inputs.
import type { ClientFactFinderData } from "@/contexts/ClientDataContext";

type Rule = { test: RegExp; value: (d: ClientFactFinderData) => number | null };

const RULES: Rule[] = [
  { test: /spouse.*(age)|age.*spouse|partner.*age/i, value: (d) => d.spouseAge || null },
  { test: /retire(ment)? ?age|retire at/i, value: (d) => d.retirementAge || null },
  { test: /\b(current|client|your|primary)?\s*age\b/i, value: (d) => d.age || null },
  { test: /spouse.*income|income.*spouse/i, value: (d) => d.spouseIncome || null },
  { test: /pension/i, value: (d) => d.pensionIncome || null },
  { test: /social security/i, value: (d) => d.socialSecurityEstimate || null },
  { test: /annual (gross )?income|w-?2|salary|earnings|household income|gross income/i, value: (d) => d.annualIncome || null },
  { test: /monthly expense/i, value: (d) => d.monthlyExpenses || null },
  { test: /annual expense|living expense|household expense/i, value: (d) => (d.monthlyExpenses ? d.monthlyExpenses * 12 : null) },
  { test: /mortgage (balance|principal)|loan balance|remaining balance/i, value: (d) => d.mortgageBalance || null },
  { test: /mortgage (rate|interest)|interest rate/i, value: (d) => d.mortgageRate || null },
  { test: /years? (left|remaining)|remaining term/i, value: (d) => d.mortgageYearsLeft || null },
  { test: /heloc (rate|interest)/i, value: (d) => d.helocRate || null },
  { test: /home (value|price)|property value|house value/i, value: (d) => d.homeValue || null },
  { test: /home equity|equity/i, value: (d) => d.realEstateEquity || null },
  { test: /taxable (investments?|account|brokerage)|brokerage|liquid invest/i, value: (d) => d.taxableInvestments || null },
  { test: /cash (savings|reserve)|savings balance|emergency/i, value: (d) => d.cashSavings || null },
  { test: /roth/i, value: (d) => d.rothBalance || null },
  { test: /401\s?\(?k\)?|403\s?\(?b\)?|tsp/i, value: (d) => d.k401Balance || null },
  { test: /\bira\b|traditional/i, value: (d) => d.iraBalance || null },
  { test: /tax[- ]deferred|qualified (assets|accounts)|retirement (accounts|balance|savings)|portfolio value/i, value: (d) => (d.iraBalance + d.rothBalance + d.k401Balance) || null },
  { test: /cash value|iul.*value|policy.*value/i, value: (d) => d.lifeInsuranceCv || null },
  { test: /death benefit|face amount/i, value: (d) => d.lifeInsuranceDb || null },
  { test: /annual premium|premium/i, value: (d) => d.annualPremium || null },
  { test: /annuity (value|balance)/i, value: (d) => d.annuityValue || null },
  { test: /other debt|consumer debt|credit card|student/i, value: (d) => d.otherDebt || null },
  { test: /income needed|desired income|target income|annual need/i, value: (d) => d.annualIncomeNeeded || null },
  { test: /legacy|inheritance goal/i, value: (d) => d.legacyGoal || null },
  { test: /net worth/i, value: (d) => (d.cashSavings + d.taxableInvestments + d.iraBalance + d.rothBalance + d.k401Balance + d.homeValue - d.mortgageBalance - d.otherDebt) || null },
];

function labelFor(el: HTMLInputElement): string {
  const parts: string[] = [];
  if (el.getAttribute("aria-label")) parts.push(el.getAttribute("aria-label")!);
  if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) parts.push(l.textContent ?? ""); }
  const wrap = el.closest("label"); if (wrap) parts.push(wrap.textContent ?? "");
  if (el.placeholder) parts.push(el.placeholder);
  if (el.name) parts.push(el.name.replace(/[_-]/g, " "));
  if (!parts.length) { const prev = el.previousElementSibling; if (prev && /LABEL|SPAN|P|DIV/.test(prev.tagName)) parts.push(prev.textContent ?? ""); }
  return parts.join(" | ").trim();
}

function setReactValue(el: HTMLInputElement, value: string): void {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
}

export type AutofillResult = { filled: Array<{ label: string; value: number }>; skipped: number };

/** Fill the numeric inputs on the current page from the profile. Returns what it touched. */
export function autofillFromProfile(d: ClientFactFinderData | null | undefined, root: ParentNode = document): AutofillResult {
  const out: AutofillResult = { filled: [], skipped: 0 };
  if (!d) return out;
  const inputs = Array.from(root.querySelectorAll<HTMLInputElement>('input[type="number"], input[inputmode="numeric"], input[inputmode="decimal"], input[type="text"]'));
  for (const el of inputs) {
    if (el.disabled || el.readOnly || el.closest("[data-chain-dock]")) continue;
    const label = labelFor(el);
    if (!label) { out.skipped++; continue; }
    const rule = RULES.find((r) => r.test.test(label));
    const v = rule?.value(d);
    if (v == null || !Number.isFinite(v)) { out.skipped++; continue; }
    // Percent-style fields get rates; money fields get whole dollars.
    const isPct = /%|rate|pct|percent/i.test(label) && !/mortgage (balance|principal)/i.test(label);
    const value = isPct ? String(Math.round(v * 100) / 100) : String(Math.round(v));
    if (el.value === value) continue;
    setReactValue(el, value);
    out.filled.push({ label: label.split(" | ")[0].slice(0, 40), value: Number(value) });
  }
  return out;
}
