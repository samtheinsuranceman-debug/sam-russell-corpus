// ============================================================
// ALTERNATIVE LINES OF CREDIT — the per-idea page, /portal/alt-credit/:slug.
//
// One component serves both halves of the tab: the routes that bring capital
// IN and the strategies that put it back OUT. They are different shapes, so
// each gets its own renderer below, but they share a URL space on purpose —
// a client reading about a securities-backed line and a client reading about
// private mortgage notes are the same client at two points in one decision,
// and the cross-links between the two only work if they live together.
//
// Nothing on this page is typed as prose. Every paragraph, risk, example and
// lender detail is read from shared/altCredit/, which is what makes the tests
// in server/altCredit.test.ts able to say anything about what a client sees.
// ============================================================
import { Link, useParams } from "wouter";
import { AppShell } from "@/components/AppShell";
import { ShieldAlert, ArrowLeft, ExternalLink, CircleHelp } from "lucide-react";
import { route, CREDIT_ROUTES } from "@shared/altCredit/routes";
import { strategy, DEPLOYMENT_STRATEGIES } from "@shared/altCredit/deployment";
import { lendersFor } from "@shared/altCredit/lenders";
import {
  ALT_CREDIT_DISCLOSURE, FAMILY_LABEL, NOT_VERIFIED_LABEL,
  type Verified, type Lender, type RiskFactor, type WorkedExample, type CommonQuestion,
} from "@shared/altCredit/types";

const CARD = "rounded-2xl border border-amber-400/20 bg-white/[0.04]";
const H2 = "text-xl font-semibold tracking-tight text-emerald-300";
const EYEBROW = "text-[11px] uppercase tracking-[0.2em] text-slate-400";

const LIKELIHOOD_TONE: Record<RiskFactor["likelihood"], string> = {
  rare: "text-slate-400 border-white/15",
  occasional: "text-amber-200 border-amber-400/30",
  common: "text-orange-200 border-orange-400/35",
  "near-certain": "text-rose-200 border-rose-400/40",
};

const VERDICT_TONE: Record<WorkedExample["verdict"], string> = {
  "strong fit": "text-emerald-300 border-emerald-400/35",
  workable: "text-amber-200 border-amber-400/30",
  "poor fit": "text-orange-200 border-orange-400/35",
  "wrong tool": "text-rose-200 border-rose-400/40",
};

/** Route paths carry no titles of their own, so the page names them for the reader. */
const PATH_LABELS: Record<string, string> = {
  "/portal/alt-credit": "Alternative Lines of Credit",
  "/portal/mortgage-killer": "Mortgage Killer",
  "/portal/house-recycling": "House Recycling",
  "/portal/real-estate-mogul": "Real Estate Mogul",
  "/portal/mortgage-ledger": "The Mortgage Ledger",
  "/portal/liquidity-routes": "Liquidity Without the Bank",
  "/portal/how-a-figure-is-made": "How a Figure Gets Made",
  "/portal/tax-bracket-optimizer": "Tax Bracket Optimizer",
  "/portal/qbi-optimizer": "QBI Optimizer",
  "/portal/ecological-drivers": "Ecological Drivers of Retirement Success",
};

function labelFor(path: string): string {
  if (PATH_LABELS[path]) return PATH_LABELS[path];
  const slug = path.replace("/portal/alt-credit/", "").replace("/portal/", "");
  return route(slug)?.title ?? strategy(slug)?.title
    ?? slug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function Score({ n, label }: { n: number; label: string }) {
  const tone = n >= 7 ? "bg-emerald-400" : n >= 5 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-2.5">
      <span className={EYEBROW}>{label}</span>
      <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
        <span className={`block h-full ${tone}`} style={{ width: `${n * 10}%` }} />
      </span>
      <span className="text-[12px] font-semibold tabular-nums text-white">{n}/10</span>
    </div>
  );
}

/**
 * Renders a Verified<T> honestly. A confirmed value shows its source and the
 * date it was read; an unconfirmed one shows what to do instead, and never a
 * plausible-looking blank that a reader would mistake for a fact.
 */
function Fact<T>({ label, v, render }: { label: string; v: Verified<T>; render?: (t: T) => string }) {
  return (
    <div className="border-t border-white/5 py-2 first:border-t-0">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      {v.verified ? (
        <>
          <dd className="text-[13.5px] text-slate-200">{render ? render(v.value) : String(v.value)}</dd>
          <dd className="mt-0.5 text-[11px] text-slate-500">Read from {v.source} on {v.asOf}</dd>
        </>
      ) : (
        <>
          <dd className="text-[13.5px] italic text-slate-500">{NOT_VERIFIED_LABEL}</dd>
          <dd className="mt-0.5 text-[11px] text-slate-500">
            {v.whyNot}{v.checkAt ? <> — check at <span className="text-slate-400">{v.checkAt}</span></> : null}
          </dd>
        </>
      )}
    </div>
  );
}

function LenderCard({ l }: { l: Lender }) {
  return (
    <article className={`${CARD} p-5`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[17px] font-semibold text-white" style={{ textWrap: "balance" }}>{l.name}</h3>
        <a href={l.url} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-[12px] text-amber-300 hover:underline">
          {l.url.replace(/^https?:\/\//, "")} <ExternalLink className="h-3 w-3" aria-hidden />
        </a>
      </div>
      <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">{l.what}</p>
      {l.identifiers.length > 0 && (
        <p className="mt-2 text-[12px] text-slate-500">{l.identifiers.join(" · ")}</p>
      )}
      <dl className="mt-3 grid gap-x-6 sm:grid-cols-2">
        <Fact label="Rates" v={l.rates} />
        <Fact label="Maximum advance" v={l.maxAdvance} />
        <Fact label="Terms" v={l.terms} />
        <Fact label="Loan size" v={l.loanSize} />
        <Fact label="Phone" v={l.phone} />
        <Fact label="Address" v={l.address} />
        <Fact label="In business since" v={l.founded} render={(y) => String(y)} />
        <Fact label="BBB rating" v={l.bbbRating} />
        <Fact label="Google reviews" v={l.googleReviews}
              render={(g) => `${g.count.toLocaleString("en-US")} reviews, ${g.rating.toFixed(1)} of 5`} />
        <Fact label="Where they will not lend" v={l.restrictions} />
      </dl>
      {l.underwriting.length > 0 && (
        <div className="mt-3">
          <p className={EYEBROW}>What they underwrite to</p>
          <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-slate-300">
            {l.underwriting.map((u) => <li key={u} className="pl-4 -indent-4 before:mr-2 before:text-slate-600 before:content-['—']">{u}</li>)}
          </ul>
        </div>
      )}
      {l.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-[12.5px] leading-relaxed text-slate-400">
          {l.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
      )}
    </article>
  );
}

function Risks({ risks }: { risks: readonly RiskFactor[] }) {
  if (!risks.length) return null;
  return (
    <section className="mt-10">
      <h2 className={H2}>What goes wrong</h2>
      <div className="mt-4 flex flex-col gap-3">
        {risks.map((r) => (
          <div key={r.risk} className={`${CARD} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{r.risk}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${LIKELIHOOD_TONE[r.likelihood]}`}>
                {r.likelihood}
              </span>
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">
              <span className="text-slate-500">What it costs: </span>{r.consequence}
            </p>
            <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-300">
              <span className="text-slate-500">What reduces it: </span>{r.mitigation}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Examples({ examples }: { examples: readonly WorkedExample[] }) {
  if (!examples.length) return null;
  return (
    <section className="mt-10">
      <h2 className={H2}>Worked at real figures</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {examples.map((e) => (
          <article key={e.who} className={`${CARD} p-5`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{e.who}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${VERDICT_TONE[e.verdict]}`}>
                {e.verdict}
              </span>
            </div>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className={EYEBROW}>Where they stand</p>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-slate-300">
                  {e.position.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </div>
              <div>
                <p className={EYEBROW}>What this does</p>
                <ul className="mt-1.5 space-y-1 text-[13px] leading-relaxed text-slate-300">
                  {e.outcome.map((o) => <li key={o}>{o}</li>)}
                </ul>
              </div>
            </div>
            <p className="mt-3 border-t border-white/10 pt-3 text-[13.5px] leading-relaxed text-slate-200">{e.why}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Questions({ questions }: { questions: readonly CommonQuestion[] }) {
  if (!questions.length) return null;
  return (
    <section className="mt-10">
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-emerald-300">
        <CircleHelp className="h-4 w-4" aria-hidden /> What people actually ask
      </h2>
      <div className="mt-4 flex flex-col gap-3">
        {questions.map((q) => (
          <div key={q.question} className={`${CARD} p-5`}>
            <h3 className="text-[15.5px] font-semibold text-white" style={{ textWrap: "balance" }}>{q.question}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-300">{q.answer}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Related({ paths }: { paths: readonly string[] }) {
  const links = ["/portal/alt-credit", ...paths.filter((p) => p !== "/portal/alt-credit")];
  return (
    <section className="mt-12 border-t border-white/10 pt-6">
      <p className={EYEBROW}>Read next</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((p) => (
          <Link key={p} to={p}
                className="rounded-full border border-amber-400/25 px-3.5 py-1.5 text-[13px] text-amber-200 transition-colors hover:border-amber-400/60 hover:text-amber-100">
            {labelFor(p)}
          </Link>
        ))}
      </div>
    </section>
  );
}

function Body({ paragraphs }: { paragraphs: readonly string[] }) {
  return (
    <div className="mt-6 flex max-w-[68ch] flex-col gap-4">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-[15px] leading-[1.75] text-slate-300">{p}</p>
      ))}
    </div>
  );
}

function Steps({ title, steps }: { title: string; steps: readonly string[] }) {
  if (!steps.length) return null;
  return (
    <section className="mt-10">
      <h2 className={H2}>{title}</h2>
      <ol className="mt-4 flex flex-col gap-2.5">
        {steps.map((s, i) => (
          <li key={s} className="flex gap-3 text-[14px] leading-relaxed text-slate-300">
            <span className="mt-0.5 shrink-0 text-[12px] tabular-nums text-amber-300/60">{String(i + 1).padStart(2, "0")}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
        <Link to="/portal/alt-credit"
              className="inline-flex items-center gap-1.5 text-[13px] text-amber-300 hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Alternative Lines of Credit
        </Link>
        {children}
        <div className="mt-10 flex items-start gap-2.5 rounded-xl border border-rose-400/30 bg-rose-400/[0.07] p-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden />
          <p className="text-[12.5px] leading-relaxed text-slate-300">{ALT_CREDIT_DISCLOSURE}</p>
        </div>
      </div>
    </AppShell>
  );
}

export default function AltCreditDetail() {
  const { slug = "" } = useParams<{ slug: string }>();
  const r = route(slug);
  const s = r ? undefined : strategy(slug);

  if (!r && !s) {
    return (
      <Shell>
        <h1 className="mt-6 text-2xl font-bold text-white">No page at that address</h1>
        <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-slate-300">
          There are {CREDIT_ROUTES.length} borrowing routes and {DEPLOYMENT_STRATEGIES.length} deployment
          strategies in this section, and <span className="text-slate-400">{slug || "(nothing)"}</span> is not one
          of them. Go back to the index and pick from the list.
        </p>
      </Shell>
    );
  }

  if (r) {
    const lenders = lendersFor(r.lenderIds);
    return (
      <Shell>
        <header className="mt-6 border-b border-white/10 pb-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">
            {String(r.n).padStart(2, "0")} · {FAMILY_LABEL[r.family]}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
            {r.title}
          </h1>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-slate-300">{r.description}</p>
          <div className="mt-4"><Score n={r.scoreForRentalOwner} label="For a rental owner" /></div>
          <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-slate-400">{r.scoreReasoning}</p>
        </header>

        <Body paragraphs={r.body} />

        <Steps title="How the underwriting actually runs" steps={r.underwritingMechanics} />

        <section className="mt-10">
          <h2 className={H2}>What is pledged</h2>
          <p className="mt-3 max-w-[68ch] text-[14.5px] leading-relaxed text-slate-300">{r.collateral}</p>
        </section>

        {lenders.length > 0 && (
          <section className="mt-10">
            <h2 className={H2}>Who does this</h2>
            <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-slate-400">
              Named because they publish what they do, not because anyone is paid to name them. A detail shown
              without a source below is a detail this system could not confirm — go and get it from the company
              before you rely on it.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              {lenders.map((l) => <LenderCard key={l.id} l={l} />)}
            </div>
          </section>
        )}

        <Risks risks={r.risks} />
        <Examples examples={r.examples} />
        <Questions questions={r.questions} />
        <Related paths={r.relatedPaths} />
      </Shell>
    );
  }

  const sgy = s!;
  const providers = lendersFor(sgy.providerIds);
  return (
    <Shell>
      <header className="mt-6 border-b border-white/10 pb-6">
        <p className="text-[11px] uppercase tracking-[0.3em] text-amber-300/70">
          {String(sgy.n).padStart(2, "0")} · Putting capital out
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl" style={{ textWrap: "balance" }}>
          {sgy.title}
        </h1>
        <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed text-slate-300">{sgy.description}</p>
        <div className="mt-4"><Score n={sgy.riskRewardScore} label="Risk and reward" /></div>
        <p className="mt-2 max-w-[64ch] text-[13px] leading-relaxed text-slate-400">{sgy.scoreReasoning}</p>
        <dl className="mt-5 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
          <div><dt className={EYEBROW}>What it targets</dt><dd className="text-slate-200">{sgy.targetReturn}</dd></div>
          <div><dt className={EYEBROW}>What it keeps after losses</dt><dd className="text-slate-200">{sgy.netOfLosses}</dd></div>
          <div><dt className={EYEBROW}>One turn of capital</dt><dd className="text-slate-200">{sgy.termMonths.min}–{sgy.termMonths.max} months</dd></div>
          <div><dt className={EYEBROW}>Turns in a borrowing year</dt>
               <dd className="text-slate-200 tabular-nums">{(12 / sgy.termMonths.max).toFixed(1)}–{(12 / sgy.termMonths.min).toFixed(1)}</dd></div>
        </dl>
      </header>

      <Body paragraphs={sgy.body} />

      <Steps title="How the money gets out and back" steps={sgy.mechanics} />

      <section className="mt-10">
        <h2 className={H2}>Collateral, and what it is worth in a default</h2>
        <p className="mt-3 max-w-[68ch] text-[14.5px] leading-relaxed text-slate-300">{sgy.collateral}</p>
        {sgy.secondaryGuarantees.length > 0 && (
          <>
            <p className="mt-5 text-[11px] uppercase tracking-[0.2em] text-slate-400">
              Secondary guarantees, insurance and recourse
            </p>
            <ul className="mt-2 flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-slate-300">
              {sgy.secondaryGuarantees.map((g) => (
                <li key={g} className="pl-4 -indent-4 before:mr-2 before:text-slate-600 before:content-['—']">{g}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {sgy.eligibility.length > 0 && (
        <section className="mt-10">
          <h2 className={H2}>Whether you are allowed to do this at all</h2>
          <ul className="mt-3 flex flex-col gap-1.5 text-[13.5px] leading-relaxed text-slate-300">
            {sgy.eligibility.map((e) => (
              <li key={e} className="pl-4 -indent-4 before:mr-2 before:text-slate-600 before:content-['—']">{e}</li>
            ))}
          </ul>
        </section>
      )}

      {providers.length > 0 && (
        <section className="mt-10">
          <h2 className={H2}>Who operates in this</h2>
          <div className="mt-4 flex flex-col gap-3">
            {providers.map((l) => <LenderCard key={l.id} l={l} />)}
          </div>
        </section>
      )}

      <Risks risks={sgy.risks} />
      <Questions questions={sgy.questions} />
      <Related paths={sgy.relatedPaths} />
    </Shell>
  );
}
