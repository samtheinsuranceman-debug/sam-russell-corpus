// ============================================================
// WEALTH GENOME — START HERE (/portal/genome-intake). A room inside the
// portal, not a second website.
//
//   1. Consent: the promise in writing, each acknowledgement ticked, the
//      consent recorded (time, version, text) before any personal question.
//   2. The script: John and Judy, the two AI guides, alternate lines. Mind
//      cluster first, then money, each opened with its permission line and
//      closed with a one-line reflection written from the pattern, not the
//      words. Every item can be skipped. A "no" to a cluster marks it
//      unknown and moves on.
//   3. Close: the raw mind answers are destroyed and the map is shown.
//
// Silent room: no audio beds; every line is on screen. "Session done" and
// "Book a review" are always there. Anything typed is screened for crisis
// before it leaves the browser (and again on the server); if it fires, the
// intake stops, what was said is deleted, and 988 is on screen.
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import GenomeMapPanel from "@/components/genome/GenomeMapPanel";
import { trpc } from "@/lib/trpc";
import {
  CONSENT_ACKS,
  GUIDES,
  LEGAL_NONCLAIMS,
  MIND_QUESTIONS,
  MONEY_QUESTIONS,
  PREVIEW_BADGE,
  SUPPORT_NOT_THERAPY,
  WHY_LINE,
  buildIntakeScript,
  type ClusterId,
  type GenomeMap,
  type ScriptStep,
} from "@shared/genomeIntake";
import { CRISIS_FOOTER, CRISIS_LIFELINE, CRISIS_MESSAGE, screenForCrisis } from "@shared/crisisScreen";
import { HOUSE_COLORS } from "@shared/firstLoginColdStart";

type Phase = "consent" | "script" | "closed" | "stopped" | "crisis";

const ROOM = "rounded-2xl border p-6 sm:p-8";
const BTN = "rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 focus:outline-none focus-visible:ring-2";
const BTN_PRIMARY = `${BTN} font-semibold`;

function Speaker({ step }: { step: ScriptStep }) {
  const g = GUIDES[step.speaker];
  return <p className="text-[11px] uppercase tracking-[0.18em] opacity-60" data-speaker={step.speaker}>{g.name} · {g.label}</p>;
}

export default function GenomeIntake() {
  const status = trpc.genomeIntake.status.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const consent = trpc.genomeIntake.consent.useMutation();
  const decide = trpc.genomeIntake.decide.useMutation();
  const answer = trpc.genomeIntake.answer.useMutation();
  const reflect = trpc.genomeIntake.reflect.useMutation();
  const close = trpc.genomeIntake.close.useMutation();
  const done = trpc.genomeIntake.done.useMutation();

  const script = useMemo(() => buildIntakeScript(), []);
  const [phase, setPhase] = useState<Phase>("consent");
  const [acks, setAcks] = useState({ adult18Plus: false, notDiagnosis: false, destroyKeep: false });
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [i, setI] = useState(0);
  const [declined, setDeclined] = useState<Record<ClusterId, boolean>>({ mind: false, money: false });
  const [reflection, setReflection] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [period, setPeriod] = useState<"year" | "month">("year");
  const [error, setError] = useState<string | null>(null);
  const [closed, setClosed] = useState<{ map: GenomeMap; reflections: { mind: string | null; money: string | null }; rawDeleted: number } | null>(null);

  const s = status.data;
  const booking = s?.bookingUrl ?? "/support";
  const busy = consent.isPending || decide.isPending || answer.isPending || reflect.isPending || close.isPending || done.isPending;
  const step = script[i];

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Something went wrong. Nothing was lost that we promised to keep.");

  /** Move to the next step. A declined cluster's questions are skipped; its reflection still says "unknown". */
  const advance = (from = i, dec = declined) => {
    let n = from + 1;
    while (script[n] && script[n]!.kind === "question" && dec[(script[n] as { cluster: ClusterId }).cluster]) n++;
    setNote(""); setAmount(""); setPeriod("year"); setReflection(null); setError(null);
    setI(n);
  };

  const begin = async () => {
    setError(null);
    try {
      const r = await consent.mutateAsync({ consentVersion: s!.consentVersion, acks });
      setSessionId(r.sessionId);
      setPhase("script");
      setI(0);
    } catch (e) { fail(e); }
  };

  const sessionDone = async () => {
    try { if (sessionId) await done.mutateAsync({ sessionId }); } catch { /* the sweep deletes it within the hour regardless */ }
    setPhase("stopped");
  };

  const permission = async (yes: boolean) => {
    if (!step || step.kind !== "permission" || !sessionId) return;
    try {
      await decide.mutateAsync({ sessionId, cluster: step.cluster, decision: yes ? "accepted" : "declined" });
      const dec = { ...declined, [step.cluster]: !yes };
      setDeclined(dec);
      advance(i, dec);
    } catch (e) { fail(e); }
  };

  const submit = async (payload: { kind: "choice"; choiceId: string } | { kind: "amount" } | { skip: true }) => {
    if (!step || step.kind !== "question" || !sessionId) return;
    const typed = note.trim();
    // Screen what was typed before it leaves this browser. If it fires, it is never sent.
    if ("kind" in payload && payload.kind === "choice" && typed && screenForCrisis(typed).stop) {
      try { await done.mutateAsync({ sessionId }); } catch { /* sweep */ }
      setPhase("crisis");
      return;
    }
    try {
      let a: Parameters<typeof answer.mutateAsync>[0]["answer"];
      if ("skip" in payload) a = { questionId: step.questionId, skip: true };
      else if (payload.kind === "choice") a = { questionId: step.questionId, kind: "choice", choiceId: payload.choiceId, ...(typed ? { note: typed } : {}) };
      else {
        const n = Number(amount.replace(/[$,\s]/g, ""));
        if (!Number.isFinite(n) || n < 0) { setError("An approximate number is enough — or skip it."); return; }
        a = { questionId: step.questionId, kind: "amount", amount: n, period };
      }
      const r = await answer.mutateAsync({ sessionId, answer: a });
      if ("crisis" in r && r.crisis) { setPhase("crisis"); return; }
      advance();
    } catch (e) { fail(e); }
  };

  // The reflection is written on the server from the pattern, when its step comes up.
  useEffect(() => {
    if (phase !== "script" || !step || step.kind !== "reflection" || !sessionId) return;
    let cancelled = false;
    reflect.mutateAsync({ sessionId, cluster: step.cluster })
      .then((r) => { if (!cancelled) setReflection(r.line); })
      .catch((e) => { if (!cancelled) fail(e); });
    return () => { cancelled = true; };
  }, [phase, i, sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = async () => {
    if (!sessionId) return;
    try {
      const r = await close.mutateAsync({ sessionId });
      setClosed({ map: r.map as GenomeMap, reflections: r.reflections, rawDeleted: r.rawDeleted });
      setPhase("closed");
      void status.refetch();
    } catch (e) { fail(e); }
  };

  const shell = (children: React.ReactNode) => (
    <AppShell title="Wealth Genome — Start here">
      <div className="mx-auto max-w-3xl space-y-4 pb-16">
        <div className={ROOM} style={{ background: HOUSE_COLORS.field, color: HOUSE_COLORS.ink, borderColor: `${HOUSE_COLORS.ink}22` }}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold tracking-[0.2em]">START HERE · WEALTH GENOME</p>
            {s?.preview && <span className="rounded-full border px-3 py-1 text-[11px] font-semibold" style={{ borderColor: HOUSE_COLORS.ink }} data-testid="preview-badge">{PREVIEW_BADGE}</span>}
          </div>
          {children}
          {error && <p className="mt-4 rounded-lg border border-[#C23B22]/40 bg-[#C23B22]/10 px-3 py-2 text-sm">{error}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-3 border-t pt-4 text-sm" style={{ borderColor: `${HOUSE_COLORS.ink}1a` }}>
            {phase === "script" && <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} onClick={sessionDone} disabled={busy}>Session done</button>}
            <a className="underline" href={booking} target={booking.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">Book a review</a>
            <span className="text-xs opacity-70">{CRISIS_FOOTER}</span>
          </div>
        </div>
      </div>
    </AppShell>
  );

  if (status.isLoading) return shell(<p className="text-sm">One moment…</p>);
  if (!s || !s.eligible) {
    return shell(
      <div className="space-y-3">
        <p className="text-lg">This room is not open yet.</p>
        <p className="text-sm opacity-80">It opens after counsel's review. Nothing you have done needs to change.</p>
        <Link href="/portal/dashboard" className="underline">Back to your dashboard</Link>
      </div>,
    );
  }

  if (phase === "crisis") {
    return shell(
      <div className="space-y-3" role="alert" data-testid="crisis-panel">
        {CRISIS_MESSAGE.map((line) => <p key={line} className="text-base">{line}</p>)}
        <div className="flex flex-wrap gap-3 pt-2">
          <a href={`tel:${CRISIS_LIFELINE.phone}`} className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink }}>Call {CRISIS_LIFELINE.phone}</a>
          <a href={`sms:${CRISIS_LIFELINE.phone}`} className={BTN} style={{ borderColor: HOUSE_COLORS.ink }}>{CRISIS_LIFELINE.text}</a>
          <a href={CRISIS_LIFELINE.url} target="_blank" rel="noopener noreferrer" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }}>{CRISIS_LIFELINE.name}</a>
        </div>
      </div>,
    );
  }

  if (phase === "stopped") {
    return shell(
      <div className="space-y-3">
        <p className="text-lg">Stopped.</p>
        <p className="text-sm">Your answers about how you think and feel from this session were deleted. No map was written. Any financial facts you gave are in your household file.</p>
        <Link href="/portal/dashboard" className="underline">Back to your dashboard</Link>
      </div>,
    );
  }

  if (phase === "closed" && closed) {
    return shell(
      <div className="space-y-4">
        <p className="text-lg">Your wealth genome.</p>
        <p className="text-sm opacity-80">{closed.rawDeleted} raw answer{closed.rawDeleted === 1 ? "" : "s"} about how you think and feel {closed.rawDeleted === 1 ? "was" : "were"} destroyed just now.</p>
        <GenomeMapPanel map={closed.map} reflections={closed.reflections} variant="cream" />
        <div className="flex flex-wrap gap-3">
          <Link href="/portal/wealth-genome" className="underline">See it on your Wealth Genome page</Link>
          <Link href="/portal/thomas-goldman" className="underline">Talk it through with your advisor</Link>
        </div>
      </div>,
    );
  }

  if (phase === "consent") {
    return shell(
      <div className="space-y-4">
        <p className="text-sm leading-relaxed opacity-80">{WHY_LINE}</p>
        <ul className="space-y-2 text-sm leading-relaxed" data-testid="consent-text">
          {s.consentLines.map((l) => <li key={l}>{l}</li>)}
        </ul>
        <div className="rounded-xl border p-4 text-sm" style={{ borderColor: `${HOUSE_COLORS.ink}22` }}>
          <p className="font-semibold">In plain words</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">{LEGAL_NONCLAIMS.map((l) => <li key={l}>{l}</li>)}<li>{SUPPORT_NOT_THERAPY}</li></ul>
        </div>
        <div className="space-y-2">
          {(Object.keys(CONSENT_ACKS) as Array<keyof typeof CONSENT_ACKS>).map((k) => (
            <label key={k} className="flex cursor-pointer items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" checked={acks[k]} onChange={(e) => setAcks((a) => ({ ...a, [k]: e.target.checked }))} />
              <span>{CONSENT_ACKS[k]}</span>
            </label>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink, background: HOUSE_COLORS.ink, color: HOUSE_COLORS.field }}
            disabled={busy || !acks.adult18Plus || !acks.notDiagnosis || !acks.destroyKeep} onClick={begin} data-testid="consent-agree">
            I agree — begin
          </button>
          <Link href="/portal/dashboard" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }}>Not now</Link>
        </div>
      </div>,
    );
  }

  // The script.
  if (!step) return shell(<p className="text-sm">One moment…</p>);

  if (step.kind === "permission") {
    return shell(
      <div className="space-y-4">
        <Speaker step={step} />
        <p className="text-xl leading-snug">{step.line}</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy} onClick={() => permission(true)}>Yes</button>
          <button type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy} onClick={() => permission(false)}>No, skip this part</button>
        </div>
      </div>,
    );
  }

  if (step.kind === "question") {
    const mind = MIND_QUESTIONS.find((q) => q.id === step.questionId);
    const money = MONEY_QUESTIONS.find((q) => q.id === step.questionId);
    return shell(
      <div className="space-y-4">
        <Speaker step={step} />
        {mind?.preface && <p className="text-base opacity-80">{mind.preface}</p>}
        <p className="text-xl leading-snug">{mind?.prompt ?? money?.prompt}</p>
        {mind && (
          <>
            <div className="flex flex-wrap gap-2">
              {mind.choices.map((c) => (
                <button key={c.id} type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy} onClick={() => submit({ kind: "choice", choiceId: c.id })}>{c.label}</button>
              ))}
            </div>
            {mind.sayMore && (
              <label className="block text-sm">
                <span className="opacity-70">Say more, if you want. Optional, never quoted back, and destroyed at the end.</span>
                <textarea className="mt-1 w-full rounded-lg border bg-white/70 p-2 text-sm" style={{ borderColor: `${HOUSE_COLORS.ink}33` }} rows={3} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
              </label>
            )}
          </>
        )}
        {money?.kind === "choice" && (
          <div className="flex flex-wrap gap-2">
            {money.choices.map((c) => (
              <button key={c.id} type="button" className={BTN} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy} onClick={() => submit({ kind: "choice", choiceId: c.id })}>{c.label}</button>
            ))}
          </div>
        )}
        {money?.kind === "amount" && (
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="block opacity-70">Approximate amount ($)</span>
              <input inputMode="numeric" className="mt-1 w-48 rounded-lg border bg-white/70 p-2" style={{ borderColor: `${HOUSE_COLORS.ink}33` }} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </label>
            {money.periods.length > 1 && (
              <select className="rounded-lg border bg-white/70 p-2 text-sm" style={{ borderColor: `${HOUSE_COLORS.ink}33` }} value={period} onChange={(e) => setPeriod(e.target.value as "year" | "month")}>
                <option value="year">a year</option>
                <option value="month">a month</option>
              </select>
            )}
            <button type="button" className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy || !amount.trim()} onClick={() => submit({ kind: "amount" })}>Continue</button>
          </div>
        )}
        {money && <p className="text-xs opacity-70">Kept in your household file so any recommendation can be checked later.</p>}
        <button type="button" className="text-sm underline" disabled={busy} onClick={() => submit({ skip: true })}>Skip this one</button>
      </div>,
    );
  }

  if (step.kind === "reflection") {
    return shell(
      <div className="space-y-4">
        <Speaker step={step} />
        <p className="text-xl leading-snug">{reflection ?? "…"}</p>
        <button type="button" className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink }} disabled={busy || reflection === null} onClick={() => advance()}>Continue</button>
      </div>,
    );
  }

  // Close.
  return shell(
    <div className="space-y-4">
      <Speaker step={step} />
      <p className="text-xl leading-snug">{step.line}</p>
      <button type="button" className={BTN_PRIMARY} style={{ borderColor: HOUSE_COLORS.ink, background: HOUSE_COLORS.ink, color: HOUSE_COLORS.field }} disabled={busy} onClick={finish} data-testid="close-and-destroy">
        Destroy the raw answers and show my map
      </button>
    </div>,
  );
}
