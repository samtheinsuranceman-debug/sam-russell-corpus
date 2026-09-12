import { Link, useLocation, useRoute } from 'wouter';
import { Bar, Button, Icon, PageHead } from '../components/ui';
import { needsBackend } from '../lib/actions';
import {
  APPEAL_WEEKS, BASIS_DIFFICULTY, BASIS_LABEL, MAX_ROUNDS, MONEY, OFFICE_ACTIONS,
  MONEY_ABOUT, PATH_BUDGET, TODAY, cheapestRoute, daysBetween, daysLeft, deadlines, outlook,
  recommended, urgency, type Outlook
} from '../lib/oa';

const DIFF_LABEL = { low: 'usually moves', medium: 'moves with work', high: 'hard to move' } as const;

/**
 * One sentence saying what the path number means that the first-pass number
 * does not. Written out rather than left to the reader, because the whole
 * value of the second row is the gap between the two.
 */
function pathRead(name: string, odds: number, out: Outlook): string {
  if (name === 'Appeal') {
    return `One shot, ${APPEAL_WEEKS} weeks, no second chances and nothing inside a year. ` +
      `Worth it only where the rejection is wrong on the law rather than fixable on the claims.`;
  }
  const gap = Math.round((out.pAllowed - odds) * 100);
  const rounds = out.meanRounds.toFixed(1);
  if (gap >= 25) {
    return `The first pass is ${Math.round(odds * 100)}%, but persistence gets there: ` +
      `${Math.round(out.pAllowed * 100)}% eventually, over about ${rounds} rounds. ` +
      `The cost is the rounds, not the odds.`;
  }
  if (out.pWithinYear < 0.4 && out.pAllowed > 0.6) {
    return `It gets there — ${Math.round(out.pAllowed * 100)}% eventually — but mostly not this ` +
      `year. About ${rounds} rounds on average.`;
  }
  return `${Math.round(out.pAllowed * 100)}% eventually over about ${rounds} rounds, ` +
    `${Math.round(out.pWithinYear * 100)}% of it inside a year.`;
}

export function OfficeActionDetail() {
  const [, params] = useRoute('/app/office-actions/:id');
  const [, setLocation] = useLocation();
  const oa = OFFICE_ACTIONS.find(o => o.id === params?.id);

  if (!oa) {
    return (
      <>
        <PageHead title="Not found" sub="No office action with that identifier." />
        <Link href="/app/office-actions"><a className="bd-open">Back to office actions</a></Link>
      </>
    );
  }

  const d = daysLeft(oa);
  const u = urgency(d);
  const rows = deadlines(oa.mailed);
  const ex = oa.examiner;
  const interviewLift = ex.allowanceAfterInterview - ex.allowanceRate;
  /* The cheapest route to an allowance is not always the one we recommend. */
  const cheapest = cheapestRoute(oa);
  const rec = recommended(oa);

  return (
    <>
      <div className="bd-crumb">
        <Link href="/app/office-actions"><a>Office actions</a></Link>
        <span>/</span>
        <span className="id">{oa.docket}</span>
        {oa.final && <span className="oa-final">Final</span>}
      </div>

      <PageHead
        title={oa.title}
        sub={`${oa.docket} · ${oa.appNo} · ${oa.client} · ${oa.attorney} · mailed ${oa.mailed}`}
        action={
          <div className="row">
            <Button
              variant="ghost"
              icon="database"
              onClick={() => needsBackend(
                'Opening the file wrapper',
                `The wrapper for ${oa.appNo} lives in USPTO Patent Center. Reading it needs the ` +
                'Patent Examination Data API and a credential this build does not carry.'
              )}
            >
              Open the file wrapper
            </Button>
            <Button icon="pen" onClick={() => setLocation('/app/drafting')}>Draft the response</Button>
          </div>
        }
      />

      {/* ── The clock ─────────────────────────────────────────────────── */}
      <div className="oa-clock">
        <div className={`oa-clock-fig oa-${u}`}>
          <span className="label">Unextended response due</span>
          <strong>{d < 0 ? `${Math.abs(d)} days over` : `${d} days`}</strong>
          <span className="small muted">{rows[0]!.date} · no fee if filed by this date</span>
        </div>
        <div className="oa-ladder">
          {rows.map(r => {
            const left = daysBetween(TODAY, r.date);
            return (
              <div className={`oa-rung${r.statutory ? ' is-bar' : ''}`} key={r.label}>
                <div className="oa-rung-date id">{r.date}</div>
                <div>
                  <div className="oa-rung-label">{r.label}</div>
                  <div className="small muted">{r.note}</div>
                </div>
                <div className="oa-rung-right">
                  <span className="num">{r.fee ? MONEY(r.fee) : '—'}</span>
                  <span className="small muted">{left < 0 ? 'passed' : `${left}d`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── The examiner ──────────────────────────────────────────────── */}
      <h2 className="bd-h2">The examiner</h2>
      <div className="oa-examiner">
        <div className="oa-ex-head">
          <div>
            <div className="bd-person-name">{ex.name}</div>
            <div className="small muted">Art unit {ex.artUnit} · {ex.yearsAtOffice} years at the office</div>
          </div>
        </div>
        <div className="oa-ex-stats">
          <div className="oa-stat">
            <span className="label">Allowance rate</span>
            <strong>{ex.allowanceRate}%</strong>
            <Bar pct={ex.allowanceRate} />
          </div>
          <div className="oa-stat">
            <span className="label">After an interview</span>
            <strong style={{ color: interviewLift >= 15 ? 'var(--accent-300)' : undefined }}>
              {ex.allowanceAfterInterview}%
            </strong>
            <Bar pct={ex.allowanceAfterInterview} />
            <span className="small muted">
              {interviewLift >= 15 ? `+${interviewLift} points — worth taking` : `+${interviewLift} points — barely moves`}
            </span>
          </div>
          <div className="oa-stat">
            <span className="label">Actions to disposal</span>
            <strong>{ex.avgActionsToDisposal}</strong>
            <span className="small muted">average across his docket</span>
          </div>
          <div className="oa-stat">
            <span className="label">Reversed on appeal</span>
            <strong style={{ color: ex.appealReversalRate >= 45 ? 'var(--accent-300)' : undefined }}>
              {ex.appealReversalRate}%
            </strong>
            <Bar pct={ex.appealReversalRate} />
          </div>
        </div>
        <p className="oa-ex-note">{ex.note}</p>
      </div>

      {/* ── What is rejected ──────────────────────────────────────────── */}
      <h2 className="bd-h2">What is rejected</h2>
      <div className="oa-claims-bar">
        <div className="oa-claims-fill" style={{ width: `${(oa.claimsRejected / oa.claimsTotal) * 100}%` }} />
        <span>
          {oa.claimsRejected} of {oa.claimsTotal} claims rejected
          {oa.claimsAllowable > 0 && <b> · {oa.claimsAllowable} indicated allowable</b>}
        </span>
      </div>

      {oa.rejections.map((r, i) => (
        <div className="oa-rejection" key={i}>
          <div className="oa-rej-head">
            <div>
              <span className={`oa-basis oa-basis-${r.basis.replace(/[^a-z0-9]/gi, '')}`}>§{r.basis}</span>
              <span className="oa-rej-title">{BASIS_LABEL[r.basis]}</span>
            </div>
            <span className={`oa-diff oa-diff-${BASIS_DIFFICULTY[r.basis]}`}>
              {DIFF_LABEL[BASIS_DIFFICULTY[r.basis]]}
            </span>
          </div>
          <div className="oa-rej-claims">
            <span className="label">Claims</span>
            {r.claims.map(c => <span className="oa-claim" key={c}>{c}</span>)}
          </div>

          <span className="label">What the examiner said</span>
          <p className="oa-rej-text">{r.examinerReasoning}</p>

          {r.references.length > 0 && (
            <>
              <span className="label">The art he is relying on</span>
              <div className="oa-refs">
                {r.references.map(ref => (
                  <div className="oa-ref" key={ref.id}>
                    <div className="oa-ref-head">
                      <span className="id">{ref.id}</span>
                      <span className="small muted">{ref.assignee} · {ref.date}</span>
                    </div>
                    <div className="oa-ref-title">{ref.title}</div>
                    <div className="oa-ref-mapped">
                      <span className="label">Mapped onto</span>
                      {ref.mappedTo.map(m => <span className="oa-chip" key={m}>{m}</span>)}
                    </div>
                    {ref.gap && (
                      <div className="oa-gap">
                        <Icon name="search" size={13} />
                        <p>{ref.gap}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="oa-assessment">
            <span className="label">Our read</span>
            <p>{r.assessment}</p>
          </div>
        </div>
      ))}

      {/* ── Options ───────────────────────────────────────────────────── */}
      <h2 className="bd-h2">Options, costed</h2>

      {cheapest && rec && cheapest.option.name !== rec.name && (
        <div className="oa-contest">
          <Icon name="alert" size={16} />
          <p>
            We recommend <b>{rec.name}</b>, but <b>{cheapest.option.name}</b> is the cheaper
            route to an allowance once the whole path is costed —{' '}
            {MONEY_ABOUT(cheapest.out.costPerAllowance)} against{' '}
            {MONEY_ABOUT(outlook(rec, oa.examiner).costPerAllowance)} per allowance. We still
            recommend {rec.name} because {cheapest.out.pWithinYear < outlook(rec, oa.examiner).pWithinYear
              ? 'it is very much faster, and the client has told us speed matters here'
              : 'of the ground it keeps, which the cheaper route gives up'}. The number is
            here so you can take the other one.
          </p>
        </div>
      )}

      <div className="oa-options">
        {oa.options.map(o => {
          const out = outlook(o, oa.examiner);
          const finite = out.costPerAllowance < Infinity;
          return (
            <div className={`oa-option${o.recommended ? ' is-rec' : ''}`} key={o.name}>
              <div className="oa-opt-head">
                <div className="bd-person-name">
                  {o.name}
                  {o.recommended && <span className="bd-tag-pivotal">Recommended</span>}
                  {cheapest?.option.name === o.name && !o.recommended && (
                    <span className="bd-tag-pivotal">Cheapest per allowance</span>
                  )}
                </div>
                <div className="oa-opt-nums">
                  <span><b className="num">{MONEY(o.cost)}</b><span className="label">fee</span></span>
                  <span><b className="num">{o.weeks}w</b><span className="label">time</span></span>
                  <span>
                    <b className="num" style={{ color: o.odds >= 0.55 ? 'var(--accent-300)' : o.odds < 0.35 ? 'var(--alert)' : undefined }}>
                      {Math.round(o.odds * 100)}%
                    </b>
                    <span className="label">first pass</span>
                  </span>
                </div>
              </div>
              <Bar pct={o.odds * 100} color={o.odds >= 0.55 ? 'var(--accent-500)' : o.odds < 0.35 ? 'var(--alert)' : 'var(--warn)'} />

              {/* The same option, costed all the way to disposal. */}
              {o.name !== 'Abandon' && (
                <div className="oa-path">
                  <span className="label">All the way through</span>
                  <div className="oa-path-nums">
                    <div>
                      <b className="num">{Math.round(out.pAllowed * 100)}%</b>
                      <span className="label">ever allowed</span>
                    </div>
                    <div>
                      <b className="num">{finite ? MONEY_ABOUT(out.costPerAllowance) : '—'}</b>
                      <span className="label">per allowance</span>
                    </div>
                    <div>
                      <b className="num" style={{ color: out.pWithinYear < 0.2 ? 'var(--warn)' : undefined }}>
                        {Math.round(out.pWithinYear * 100)}%
                      </b>
                      <span className="label">allowed inside a year</span>
                    </div>
                    <div>
                      <b className="num">{MONEY_ABOUT(out.meanCost)}</b>
                      <span className="label">expected spend</span>
                    </div>
                  </div>
                  <p className="oa-path-read">{pathRead(o.name, o.odds, out)}</p>
                </div>
              )}

              <div className="oa-opt-grid">
                <div><span className="label">What it gets you</span><p>{o.gives}</p></div>
                <div><span className="label">What it costs you</span><p>{o.costs}</p></div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="small muted" style={{ marginTop: 22 }}>
        The first-pass figure is this examiner's own disposal history for the path in question,
        not a general average — which is the point, since the same strategy is worth very
        different money in front of different examiners. "All the way through" costs the whole
        path rather than the next step: a failed response goes final, the next move is a
        continuation, each further round is worth 28% less than the last, and prosecution stops
        at {MONEY(PATH_BUDGET)} or {MAX_ROUNDS} rounds, with appeal as the last door. Those are
        expected values from a stated model, not a forecast — the assumptions are in
        lib/oa.ts and a ten-thousand-run simulation checks them. Deadlines are computed from the
        mailing date on the action.
        Demonstration dataset: the matter, examiner, art unit and references here are invented for
        this build, and nothing on this page is a filing or legal advice.
      </p>
    </>
  );
}
