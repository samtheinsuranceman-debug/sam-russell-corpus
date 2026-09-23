// ============================================================
// ROLE DASHBOARDS — /portal/physician, /portal/client, /portal/advisor.
//
// One page, three doors. Each role lands on its own dashboard with the
// same two instruments front and centre: the 12-AI system (eleven model
// voices plus the Russell rule engine, fanned out through ultra.panel)
// and the blue microphone that runs the spoken fact finder the moment
// it is pressed. Below them, the shortcuts that matter to that role.
// ============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearch } from "wouter";
import { AppShell } from "@/components/AppShell";
import AiIntake from "@/components/AiIntake";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useClientData } from "@/contexts/ClientDataContext";
import { INTAKE_ROLES, INTAKE_STORAGE_KEY, type IntakeRole } from "@shared/aiIntakeScript";
import { arrivalSkinsEnabled } from "@shared/arrivalSkins";
import { ArrivalField } from "@/components/ArrivalField";
import { readOwnerPreview, writeOwnerPreview } from "@/lib/arrivalSession";
import { useSoundSilence } from "@/contexts/ArrivalSoundContext";

const ROLE_STORAGE_KEY = "rcs_role_v1";

const SHORTCUTS: Record<IntakeRole, Array<{ label: string; path: string; blurb: string }>> = {
  physician: [
    { label: "Financial Assessment", path: "/portal/financial-assessment", blurb: "The full written fact finder; the spoken intake fills it in." },
    { label: "Calculator Chain", path: "/portal/chain", blurb: "Every calculator in a row, 10,000 simulations, one report." },
    { label: "Mortgage Killer", path: "/portal/mortgage-killer", blurb: "The recycling cycle that turns the mortgage into properties." },
    { label: "Tax Waterfall", path: "/portal/tax-waterfall", blurb: "Roth conversion sequencing against future taxation." },
    { label: "AI Financial Advisor", path: "/portal/ai-advisor", blurb: "Ask anything against your saved assessment." },
    { label: "Outside Forces", path: "/portal/outside-forces", blurb: "Money printing, credit, hard-asset inflation." },
  ],
  client: [
    { label: "Financial Assessment", path: "/portal/financial-assessment", blurb: "Your written fact finder, filled by the conversation." },
    { label: "Calculator Chain", path: "/portal/chain", blurb: "See the whole plan run end to end." },
    { label: "My Journey", path: "/portal/my-journey", blurb: "Where you are, where the plan takes you." },
    { label: "Income for Life", path: "/portal/income-for-life", blurb: "The guaranteed floor under everything else." },
    { label: "Zip Engine", path: "/portal/zip-engine", blurb: "Your ZIP's price and rent history, any window." },
    { label: "AI Financial Advisor", path: "/portal/ai-advisor", blurb: "Ask in plain words; get plain answers." },
  ],
  advisor: [
    { label: "AI Whisperer", path: "/portal/whisperer", blurb: "The live-call coach: when to stop talking, five questions, five objections, five reports every five minutes, texted to you." },
    { label: "Voice Studio", path: "/portal/voice", blurb: "Pick, hear and clone the ElevenLabs voice the whole site speaks with." },
    { label: "Advisor CRM", path: "/portal/dashboard", blurb: "Pipeline, clients, deals, the book." },
    { label: "Clients", path: "/portal/clients", blurb: "Every household, every assessment." },
    { label: "Calculator Chain", path: "/portal/chain", blurb: "Build the chain for a client and run 10,000 paths." },
    { label: "All Calculators", path: "/calculators", blurb: "The full catalog, auto-filled from the assessment." },
    { label: "Strategy Lab", path: "/portal/strategy", blurb: "Compare structures side by side." },
    { label: "Meeting Agenda", path: "/portal/meeting-agenda", blurb: "The next conversation, prepared." },
  ],
};

const ROLE_HEADLINES: Record<IntakeRole, { title: string; sub: string }> = {
  physician: { title: "Physician dashboard", sub: "Your income, your taxes, your legacy: twelve AI advisors and one conversation that fills every calculator." },
  client: { title: "Client dashboard", sub: "Press the microphone and tell the advisor about your money. It explains everything back and shows you what is coming." },
  advisor: { title: "Advisor dashboard", sub: "Run the spoken intake with a client, fan a question out to the twelve-AI panel, then open the chain." },
};

export default function RoleDashboard({ role }: { role: IntakeRole }) {
  const search = useSearch();
  const talk = useMemo(() => new URLSearchParams(search).get("talk") === "1", [search]);
  const [intakeOpen, setIntakeOpen] = useState(talk);
  const [autoStart, setAutoStart] = useState(talk);
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });
  const panel = trpc.ultra.panel.useMutation();
  const speak = trpc.ultra.speak.useMutation();
  const [question, setQuestion] = useState("");
  const [readAloud, setReadAloud] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  // The panel's answer, spoken in the site's voice (the owner's ElevenLabs clone).
  const sayAnswer = async (text: string) => {
    if (!text || !providers.data?.voiceOut) return;
    try {
      audioRef.current?.pause();
      setSpeaking(true);
      const audio = await speak.mutateAsync({ text: text.slice(0, 1900) });
      if (!audio.ok) { setSpeaking(false); return; }
      const el = new Audio(`data:${audio.mimeType};base64,${audio.audioBase64}`);
      audioRef.current = el;
      el.onended = () => setSpeaking(false);
      el.onerror = () => setSpeaking(false);
      await el.play();
    } catch { setSpeaking(false); }
  };
  const stopSpeaking = () => { audioRef.current?.pause(); setSpeaking(false); };
  const [hasIntake, setHasIntake] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(ROLE_STORAGE_KEY, role); } catch { /* private mode */ }
    try { setHasIntake(Boolean(localStorage.getItem(INTAKE_STORAGE_KEY))); } catch { /* none */ }
  }, [role]);

  const team = providers.data?.team ?? [];
  const configured = team.filter((t) => t.configured).length;
  const voices = [...team.map((t) => ({ id: t.id, label: t.label, on: t.configured })), { id: "rule-engine", label: "Russell rule engine", on: true }];

  const askPanel = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = question.trim();
    if (!q) return;
    const profile = clientData ? JSON.stringify(clientData).slice(0, 1500) : "";
    const r = await panel.mutateAsync({ question: q, profileSummary: profile }).catch(() => undefined);
    const spoken = r?.synthesis ?? r?.responses.find((x) => x.ok)?.text ?? "";
    if (readAloud && spoken) void sayAnswer(spoken);
  };

  // Return skins + sonic signature on the arrival field: off unless VITE_ARRIVAL_SKINS=on,
  // or the owner (an admin account) switches the preview on for their own browser.
  const isOwner = user?.role === "admin";
  const [ownerPreview, setOwnerPreview] = useState(() => readOwnerPreview());
  const arrivalOn = arrivalSkinsEnabled({ envFlag: import.meta.env.VITE_ARRIVAL_SKINS, isOwner, ownerPreview });
  const toggleOwnerPreview = () => { const next = !ownerPreview; writeOwnerPreview(next); setOwnerPreview(next); };
  // The arrival sound goes quiet during the spoken intake and while an answer is read aloud.
  useSoundSilence(intakeOpen || speaking);

  const name = user?.name ?? "";
  const roleMeta = INTAKE_ROLES[role];
  const head = ROLE_HEADLINES[role];

  return (
    <AppShell title={head.title} subtitle={head.sub}>
      <div className="mx-auto max-w-6xl px-4 py-8 text-white" data-testid={`role-dashboard-${role}`}>
        {arrivalOn && (
          <div className="mb-8">
            <ArrivalField userId={user?.id ?? null} name={name.split(" ")[0] || undefined} ownerCaption={isOwner} />
          </div>
        )}
        {isOwner && (
          <div className="mb-3 flex justify-end">
            <button type="button" onClick={toggleOwnerPreview} aria-pressed={ownerPreview} className="rounded-full border border-emerald-300/25 px-3 py-1 text-xs text-emerald-100/70 hover:text-emerald-100" data-testid="arrival-preview-toggle">
              Owner preview · arrival skins {ownerPreview ? "on" : "off"}
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-300">{roleMeta.label} · Russell Capital Systems</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">{head.title}</h1>
            {name && <p className="mt-1 text-sm text-emerald-200/70">Welcome, {name}.</p>}
            <p className="mt-2 max-w-2xl leading-7 text-emerald-100/70">{head.sub}</p>
          </div>
          <nav className="flex gap-1 rounded-xl border border-emerald-300/20 bg-black/30 p-1 text-sm" aria-label="Switch dashboard">
            {(Object.keys(INTAKE_ROLES) as IntakeRole[]).map((r) => (
              <Link key={r} href={INTAKE_ROLES[r].path} className={`rounded-lg px-3 py-1.5 font-semibold ${r === role ? "bg-emerald-500 text-white" : "text-emerald-100/60 hover:text-emerald-100"}`}>{INTAKE_ROLES[r].label}</Link>
            ))}
          </nav>
        </div>

        {/* The blue microphone: talk to it right away */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          {intakeOpen ? (
            <AiIntake role={role} autoStart={autoStart} onClose={() => { setIntakeOpen(false); setAutoStart(false); }} />
          ) : (
            <section className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-sky-300/25 bg-[#03110f]/85 p-8 text-center shadow-[0_30px_100px_rgba(2,132,199,.18)]" aria-label="Start the spoken fact finder">
              <button type="button" onClick={() => { setAutoStart(true); setIntakeOpen(true); }} aria-label="Talk to the AI advisor now" data-testid="role-mic"
                className="flex h-28 w-28 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_0_50px_rgba(14,165,233,.6)] transition hover:bg-sky-400 active:scale-95">
                <svg viewBox="0 0 24 24" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /><path d="M8 21h8" />
                </svg>
              </button>
              <h2 className="text-2xl font-semibold">Press and talk</h2>
              <p className="max-w-md leading-7 text-sky-100/70">{hasIntake ? "You have a conversation in progress. Press to pick it back up." : "The advisor asks about every asset, explains it all back, asks for your three wishes, and gives you the three questions you would ask in five, ten and fifteen years."}</p>
            </section>
          )}

          {/* The 12-AI system */}
          <section className="rounded-3xl border border-emerald-300/20 bg-white/[0.04] p-5" aria-label="Twelve-AI system">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">The 12-AI system</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">Twelve voices, one answer</h2>
            <p className="mt-2 text-sm leading-6 text-emerald-100/65">{providers.data ? `${configured} of ${team.length} model voices are switched on for this host, plus the rule engine that is always on.` : "Checking which voices are switched on…"}</p>
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="AI voices">
              {voices.map((v) => (
                <li key={v.id} className={`rounded-full border px-2.5 py-0.5 text-xs ${v.on ? "border-emerald-300/40 text-emerald-100" : "border-white/10 text-white/35"}`} title={v.on ? "configured" : "not configured on this host"}>{v.label}</li>
              ))}
            </ul>
            <form onSubmit={askPanel} className="mt-4">
              <label className="block text-sm text-emerald-100/70">Ask the panel
                <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={3} placeholder="e.g. Should I convert my 401k to Roth before I sell the practice?" data-testid="panel-question"
                  className="mt-1 w-full rounded-xl border border-emerald-300/25 bg-black/30 px-4 py-3 text-white placeholder:text-emerald-100/35 focus:border-emerald-300 focus:outline-none" />
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="submit" disabled={panel.isPending || !question.trim()} className="rounded-xl bg-emerald-500 px-5 py-2.5 font-semibold text-white hover:bg-emerald-400 disabled:opacity-50">
                  {panel.isPending ? "Asking every voice…" : "Ask all twelve"}
                </button>
                <label className="flex items-center gap-1.5 text-xs text-emerald-100/70"><input type="checkbox" className="accent-emerald-400" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} /> Read the answer aloud{providers.data && !providers.data.voiceOut ? " (voice not configured)" : ""}</label>
              </div>
            </form>
            {panel.data && (
              <div className="mt-4 space-y-3" data-testid="panel-answers">
                {panel.data.synthesis && (
                  <div className="rounded-xl border border-emerald-300/30 bg-emerald-500/10 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Synthesis</p>
                      {providers.data?.voiceOut && (
                        <button type="button" onClick={() => (speaking ? stopSpeaking() : void sayAnswer(panel.data!.synthesis!))} aria-label={speaking ? "Stop reading" : "Read aloud"} className={`rounded-full px-3 py-1 text-xs font-semibold ${speaking ? "bg-red-500/80" : "bg-sky-500 hover:bg-sky-400"}`}>{speaking ? "Stop" : speak.isPending ? "…" : "Hear it"}</button>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-6">{panel.data.synthesis}</p>
                  </div>
                )}
                {panel.data.responses.map((r) => (
                  <details key={r.id} className="rounded-xl border border-white/10 p-3 text-sm">
                    <summary className="cursor-pointer font-semibold">{r.label}{r.ok ? "" : " (unavailable)"}</summary>
                    <p className="mt-2 leading-6 text-emerald-50/85">{r.text}</p>
                  </details>
                ))}
                {panel.data.skipped.length > 0 && <p className="text-xs text-white/40">Not configured on this host: {panel.data.skipped.join(", ")}.</p>}
              </div>
            )}
          </section>
        </div>

        <section className="mt-10" aria-label={`${roleMeta.label} shortcuts`}>
          <h2 className="text-lg font-semibold text-emerald-100/85">Where to go next</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {SHORTCUTS[role].map((s) => (
              <Link key={s.path} href={s.path} className="rounded-2xl border border-emerald-300/15 bg-white/[0.03] p-4 transition hover:border-emerald-300/40 hover:bg-emerald-500/10">
                <p className="font-semibold">{s.label}</p>
                <p className="mt-1 text-sm leading-6 text-emerald-100/60">{s.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

export function PhysicianDashboard() { return <RoleDashboard role="physician" />; }
export function ClientDashboard() { return <RoleDashboard role="client" />; }
export function AdvisorDashboard() { return <RoleDashboard role="advisor" />; }
