import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Archive,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  FilePlus2,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Save,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const WORKFLOW_STAGES = ["discovery", "analysis", "strategy", "review", "implementation", "complete"] as const;
const STATUS_LABELS = {
  draft: "Draft",
  active: "Active",
  review: "In review",
  completed: "Completed",
  archived: "Archived",
} as const;

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not saved";
  return new Date(value).toLocaleString();
}

export default function PlanningCases() {
  const utils = trpc.useUtils();
  const casesQuery = trpc.planningCases.list.useQuery();
  const clientsQuery = trpc.clients.list.useQuery();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState("");
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState<keyof typeof STATUS_LABELS>("draft");
  const [stage, setStage] = useState<(typeof WORKFLOW_STAGES)[number]>("discovery");
  const [objectives, setObjectives] = useState("");
  const [riskNotes, setRiskNotes] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [note, setNote] = useState("");

  const cases = casesQuery.data ?? [];
  const clients = clientsQuery.data ?? [];
  const selectedCase = trpc.planningCases.get.useQuery(
    { id: selectedId ?? 0 },
    { enabled: selectedId !== null },
  );
  const notesQuery = trpc.planningCases.notes.useQuery(
    { planningCaseId: selectedId ?? 0 },
    { enabled: selectedId !== null },
  );

  useEffect(() => {
    if (!selectedId && cases.length > 0) setSelectedId(cases[0].id);
  }, [cases, selectedId]);

  useEffect(() => {
    const item = selectedCase.data;
    if (!item) return;
    const assumptions = (item.assumptions ?? {}) as Record<string, unknown>;
    const results = (item.results ?? {}) as Record<string, unknown>;
    setTitle(item.title);
    setStatus(item.status);
    setStage(item.currentStage as (typeof WORKFLOW_STAGES)[number]);
    setObjectives(typeof assumptions.objectives === "string" ? assumptions.objectives : "");
    setRiskNotes(typeof assumptions.riskNotes === "string" ? assumptions.riskNotes : "");
    setResultSummary(typeof results.summary === "string" ? results.summary : "");
  }, [selectedCase.data]);

  const clientNameById = useMemo(
    () => new Map(clients.map(client => [client.id, client.name])),
    [clients],
  );

  const createCase = trpc.planningCases.create.useMutation({
    onSuccess: async created => {
      await utils.planningCases.list.invalidate();
      if (created?.id) setSelectedId(created.id);
      setNewTitle("");
      setNewClientId("");
      setShowCreate(false);
      toast.success("Planning case created");
    },
    onError: error => toast.error(error.message),
  });

  const updateCase = trpc.planningCases.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.planningCases.list.invalidate(),
        selectedId ? utils.planningCases.get.invalidate({ id: selectedId }) : Promise.resolve(),
      ]);
      toast.success("Planning case saved");
    },
    onError: error => toast.error(error.message),
  });

  const addNote = trpc.planningCases.addNote.useMutation({
    onSuccess: async () => {
      if (selectedId) await utils.planningCases.notes.invalidate({ planningCaseId: selectedId });
      setNote("");
      toast.success("Note saved");
    },
    onError: error => toast.error(error.message),
  });

  const saveCurrent = () => {
    if (!selectedId) return;
    updateCase.mutate({
      id: selectedId,
      title,
      status,
      currentStage: stage,
      assumptions: { objectives, riskNotes },
      results: { summary: resultSummary },
      workflowState: {
        completedSteps: WORKFLOW_STAGES.slice(0, Math.max(0, WORKFLOW_STAGES.indexOf(stage))),
        activeStage: stage,
      },
    });
  };

  return (
    <AppShell title="Planning Cases" subtitle="Persistent client planning workflows">
      <div className="mx-auto max-w-[1500px] space-y-6 p-4 md:p-7">
        <section className="overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-950/80 via-slate-950/90 to-fuchsia-950/55 p-6 shadow-2xl shadow-violet-950/40">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-violet-300">
                <ClipboardList className="h-4 w-4" /> Durable planning workspace
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Every recommendation has a saved case.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Link planning work to a real client, retain assumptions and results, record advisor notes, and advance the workflow without losing context between sessions.
              </p>
            </div>
            <Button onClick={() => setShowCreate(value => !value)} className="bg-violet-500 text-white hover:bg-violet-400">
              <FilePlus2 className="mr-2 h-4 w-4" /> New planning case
            </Button>
          </div>
        </section>

        {showCreate && (
          <section className="rounded-2xl border border-violet-400/20 bg-slate-950/75 p-5 shadow-xl">
            <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="space-y-2 text-sm text-slate-300">
                <span>Case title</span>
                <Input value={newTitle} onChange={event => setNewTitle(event.target.value)} placeholder="Morgan household retirement plan" />
              </label>
              <label className="space-y-2 text-sm text-slate-300">
                <span>Linked client</span>
                <select value={newClientId} onChange={event => setNewClientId(event.target.value)} className="h-10 w-full rounded-md border border-violet-400/20 bg-slate-950 px-3 text-sm text-white">
                  <option value="">No client selected</option>
                  {clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </label>
              <Button
                disabled={newTitle.trim().length < 2 || createCase.isPending}
                onClick={() => createCase.mutate({ title: newTitle.trim(), clientId: newClientId ? Number(newClientId) : null, caseType: "comprehensive" })}
              >
                {createCase.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FilePlus2 className="mr-2 h-4 w-4" />}
                Create
              </Button>
            </div>
          </section>
        )}

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-violet-400/15 bg-slate-950/70 p-3 shadow-xl">
            <div className="flex items-center justify-between px-2 py-2">
              <div>
                <p className="text-sm font-semibold text-white">Planning cases</p>
                <p className="text-xs text-slate-400">{cases.length} saved workflow{cases.length === 1 ? "" : "s"}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => casesQuery.refetch()} aria-label="Refresh planning cases">
                <RefreshCw className={`h-4 w-4 ${casesQuery.isFetching ? "animate-spin" : ""}`} />
              </Button>
            </div>

            {casesQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-violet-300"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : casesQuery.isError ? (
              <div className="m-2 rounded-xl border border-red-400/20 bg-red-950/30 p-4 text-sm text-red-200">
                <CircleAlert className="mb-2 h-5 w-5" /> {casesQuery.error.message}
              </div>
            ) : cases.length === 0 ? (
              <div className="m-2 rounded-xl border border-dashed border-violet-400/25 p-6 text-center">
                <ClipboardList className="mx-auto mb-3 h-8 w-8 text-violet-300" />
                <p className="text-sm font-medium text-white">No planning cases yet</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Create the first case to persist assumptions, results, and advisor notes.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cases.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${selectedId === item.id ? "border-violet-400/45 bg-violet-500/15" : "border-transparent bg-white/[0.03] hover:border-violet-400/20 hover:bg-violet-500/10"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="line-clamp-2 text-sm font-semibold text-white">{item.title}</p>
                      {item.status === "archived" && <Archive className="h-4 w-4 shrink-0 text-slate-500" />}
                    </div>
                    <p className="mt-2 text-xs text-violet-200">{clientNameById.get(item.clientId ?? -1) ?? "Unlinked case"}</p>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span className="capitalize">{item.currentStage}</span>
                      <span>{formatDate(item.lastSavedAt)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </aside>

          <main className="min-w-0">
            {!selectedId ? (
              <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-violet-400/25 bg-slate-950/50 p-10 text-center">
                <div><Users className="mx-auto mb-4 h-10 w-10 text-violet-300" /><p className="font-medium text-white">Select or create a planning case</p></div>
              </div>
            ) : selectedCase.isLoading ? (
              <div className="flex min-h-[520px] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-violet-300" /></div>
            ) : selectedCase.isError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-950/30 p-6 text-red-200">{selectedCase.error.message}</div>
            ) : (
              <div className="space-y-5">
                <section className="rounded-2xl border border-violet-400/15 bg-slate-950/70 p-5 shadow-xl">
                  <div className="grid gap-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
                    <label className="space-y-2 text-sm text-slate-300"><span>Case title</span><Input value={title} onChange={event => setTitle(event.target.value)} /></label>
                    <label className="space-y-2 text-sm text-slate-300"><span>Status</span><select value={status} onChange={event => setStatus(event.target.value as keyof typeof STATUS_LABELS)} className="h-10 w-full rounded-md border border-violet-400/20 bg-slate-950 px-3 text-sm text-white">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                    <label className="space-y-2 text-sm text-slate-300"><span>Current stage</span><select value={stage} onChange={event => setStage(event.target.value as (typeof WORKFLOW_STAGES)[number])} className="h-10 w-full rounded-md border border-violet-400/20 bg-slate-950 px-3 text-sm capitalize text-white">{WORKFLOW_STAGES.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
                    <Button onClick={saveCurrent} disabled={updateCase.isPending}><Save className="mr-2 h-4 w-4" />{updateCase.isPending ? "Saving" : "Save case"}</Button>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {WORKFLOW_STAGES.map((value, index) => {
                      const activeIndex = WORKFLOW_STAGES.indexOf(stage);
                      const complete = index < activeIndex;
                      const active = value === stage;
                      return <button key={value} onClick={() => setStage(value)} className={`rounded-xl border px-2 py-3 text-center text-[11px] font-medium capitalize ${active ? "border-violet-300/60 bg-violet-500/25 text-white" : complete ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/[0.02] text-slate-500"}`}>{complete && <CheckCircle2 className="mx-auto mb-1 h-4 w-4" />}{value}</button>;
                    })}
                  </div>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                  <section className="rounded-2xl border border-violet-400/15 bg-slate-950/70 p-5 shadow-xl">
                    <h2 className="font-semibold text-white">Discovery assumptions</h2>
                    <p className="mt-1 text-xs text-slate-400">Saved with this case—not held only in the browser.</p>
                    <label className="mt-5 block space-y-2 text-sm text-slate-300"><span>Objectives and priorities</span><Textarea value={objectives} onChange={event => setObjectives(event.target.value)} rows={6} placeholder="Retirement timing, liquidity needs, estate priorities…" /></label>
                    <label className="mt-4 block space-y-2 text-sm text-slate-300"><span>Risk and constraints</span><Textarea value={riskNotes} onChange={event => setRiskNotes(event.target.value)} rows={4} placeholder="Risk tolerance, tax constraints, compliance concerns…" /></label>
                  </section>
                  <section className="rounded-2xl border border-violet-400/15 bg-slate-950/70 p-5 shadow-xl">
                    <h2 className="font-semibold text-white">Recommendation summary</h2>
                    <p className="mt-1 text-xs text-slate-400">Capture the current conclusion while calculators and reports retain their own detailed records.</p>
                    <Textarea className="mt-5" value={resultSummary} onChange={event => setResultSummary(event.target.value)} rows={12} placeholder="Summarize the recommended strategy, evidence, tradeoffs, and next decision…" />
                  </section>
                </div>

                <section className="rounded-2xl border border-violet-400/15 bg-slate-950/70 p-5 shadow-xl">
                  <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold text-white">Case notes</h2><p className="mt-1 text-xs text-slate-400">Advisor, client, compliance, and system notes are timestamped and persisted.</p></div><MessageSquarePlus className="h-5 w-5 text-violet-300" /></div>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row"><Textarea value={note} onChange={event => setNote(event.target.value)} rows={3} placeholder="Add a decision, follow-up, or compliance note…" /><Button className="sm:self-end" disabled={!note.trim() || addNote.isPending} onClick={() => addNote.mutate({ planningCaseId: selectedId, noteType: "advisor", content: note.trim() })}>{addNote.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquarePlus className="mr-2 h-4 w-4" />}Save note</Button></div>
                  <div className="mt-5 space-y-3">
                    {notesQuery.isLoading ? <Loader2 className="h-5 w-5 animate-spin text-violet-300" /> : (notesQuery.data ?? []).length === 0 ? <p className="rounded-xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No notes have been added.</p> : (notesQuery.data ?? []).map(item => <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="flex items-center justify-between gap-3"><span className="text-xs font-semibold uppercase tracking-wider text-violet-300">{item.noteType}</span><span className="text-xs text-slate-500">{formatDate(item.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">{item.content}</p></article>)}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
