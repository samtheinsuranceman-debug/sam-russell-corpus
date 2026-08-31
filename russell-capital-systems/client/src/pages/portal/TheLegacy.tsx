// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// THE LEGACY — Sacred Seven #6 · Will & estate drafting
// will_drafts: title, status, tone (formal/heartfelt/spiritual/practical),
// personalLetter, assetDistribution, guardianDesignations, specialBequests,
// finalWishes, executor, familyContext, generatedDocument/pdfUrl. Front-end
// builds the draft + live preview; wire mutations + PDF generation later.
// ───────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ScrollText, Plus, Trash2, HeartPulse, FileDown, Feather, Church, Scale, HandHeart,
} from "lucide-react";
import { GENOME, GlowCard, GenomeOrb, GenomeBackdrop, SectionLabel } from "./_genome/GenomeKit";

const TONES = [
  { id: "formal",    label: "Formal",    icon: Scale,     blurb: "Precise, legal, unambiguous." },
  { id: "heartfelt", label: "Heartfelt", icon: HandHeart, blurb: "Warm, personal, loving." },
  { id: "spiritual", label: "Spiritual", icon: Church,    blurb: "Faith-rooted, eternal perspective." },
  { id: "practical", label: "Practical", icon: Feather,   blurb: "Clear, direct, actionable." },
];

export default function TheLegacy() {
  const [tone, setTone] = useState("heartfelt");
  const [title, setTitle] = useState("The Russell Family Legacy");
  const [executor, setExecutor] = useState({ name: "", relation: "" });
  const [letter, setLetter] = useState("");
  const [finalWishes, setFinalWishes] = useState("");
  const [assets, setAssets] = useState([{ asset: "Primary residence", to: "Spouse", pct: 100 }]);
  const [guardians, setGuardians] = useState([{ child: "", guardian: "" }]);
  const [bequests, setBequests] = useState([{ item: "", to: "" }]);
  const [reflected, setReflected] = useState(false);

  const upd = (setter, list, i, key, val) => setter(list.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));

  return (
    <AppShell title="The Legacy" subtitle="A living will — written from the unified field, for those you love">
      <div className="relative mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_420px]">
        <GenomeBackdrop />

        {/* Builder */}
        <div className="space-y-6">
          <GlowCard className="p-6">
            <SectionLabel icon={ScrollText}>Document</SectionLabel>
            <div className="mt-3 space-y-1.5">
              <Label className="text-xs text-slate-400">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="mt-5">
              <Label className="text-xs text-slate-400">Tone</Label>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TONES.map((t) => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      tone === t.id ? "border-violet-400/60 bg-violet-500/15" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                    }`}>
                    <t.icon className={`h-4 w-4 ${tone === t.id ? "text-violet-200" : "text-slate-400"}`} />
                    <p className="mt-1.5 text-sm font-medium text-white">{t.label}</p>
                    <p className="text-[11px] text-slate-500">{t.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <SectionLabel>Executor</SectionLabel>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Input placeholder="Executor name" value={executor.name} onChange={(e) => setExecutor({ ...executor, name: e.target.value })} />
              <Input placeholder="Relationship" value={executor.relation} onChange={(e) => setExecutor({ ...executor, relation: e.target.value })} />
            </div>
          </GlowCard>

          <GlowCard className="p-6">
            <SectionLabel>Personal letter</SectionLabel>
            <Textarea rows={5} className="mt-3" placeholder="From the unified field, what do you want them to know?" value={letter} onChange={(e) => setLetter(e.target.value)} />
          </GlowCard>

          <ListEditor title="Asset distribution" icon={Plus} rows={assets}
            onAdd={() => setAssets([...assets, { asset: "", to: "", pct: 0 }])}
            onRemove={(i) => setAssets(assets.filter((_, idx) => idx !== i))}
            render={(r, i) => (
              <>
                <Input placeholder="Asset" value={r.asset} onChange={(e) => upd(setAssets, assets, i, "asset", e.target.value)} />
                <Input placeholder="Beneficiary" value={r.to} onChange={(e) => upd(setAssets, assets, i, "to", e.target.value)} />
                <Input type="number" placeholder="%" className="w-20" value={r.pct} onChange={(e) => upd(setAssets, assets, i, "pct", +e.target.value)} />
              </>
            )} />

          <ListEditor title="Guardian designations" icon={Plus} rows={guardians}
            onAdd={() => setGuardians([...guardians, { child: "", guardian: "" }])}
            onRemove={(i) => setGuardians(guardians.filter((_, idx) => idx !== i))}
            render={(r, i) => (
              <>
                <Input placeholder="Child / dependent" value={r.child} onChange={(e) => upd(setGuardians, guardians, i, "child", e.target.value)} />
                <Input placeholder="Guardian" value={r.guardian} onChange={(e) => upd(setGuardians, guardians, i, "guardian", e.target.value)} />
              </>
            )} />

          <ListEditor title="Special bequests" icon={Plus} rows={bequests}
            onAdd={() => setBequests([...bequests, { item: "", to: "" }])}
            onRemove={(i) => setBequests(bequests.filter((_, idx) => idx !== i))}
            render={(r, i) => (
              <>
                <Input placeholder="Item" value={r.item} onChange={(e) => upd(setBequests, bequests, i, "item", e.target.value)} />
                <Input placeholder="Recipient" value={r.to} onChange={(e) => upd(setBequests, bequests, i, "to", e.target.value)} />
              </>
            )} />

          <GlowCard className="p-6">
            <SectionLabel>Final wishes</SectionLabel>
            <Textarea rows={3} className="mt-3" placeholder="Service, values, words for the road ahead…" value={finalWishes} onChange={(e) => setFinalWishes(e.target.value)} />
          </GlowCard>
        </div>

        {/* Preview + reflection */}
        <div className="space-y-6 lg:sticky lg:top-4 lg:self-start">
          <GlowCard className="p-6 text-center">
            <SectionLabel icon={HeartPulse} className="justify-center">Somatic reflection</SectionLabel>
            <div className="my-5 flex justify-center">
              <GenomeOrb size={104} active={reflected} label={reflected ? "Centered" : "Before you finalize"} onClick={() => setReflected(true)} />
            </div>
            <p className="text-xs text-slate-400">{reflected ? "Reflection logged to ai_memory_notes" : "Feel the sternum-click. Sign from the unified field."}</p>
          </GlowCard>

          <GlowCard className="overflow-hidden">
            <div className="border-b border-white/8 px-5 py-3"><SectionLabel icon={ScrollText}>Live preview · {TONES.find((t) => t.id === tone)?.label}</SectionLabel></div>
            <div className="max-h-[420px] space-y-4 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-slate-300">
              <h3 className="text-center text-lg font-semibold text-white">{title || "Untitled"}</h3>
              {executor.name && <p className="text-center text-xs text-slate-500">Executor: {executor.name}{executor.relation ? ` (${executor.relation})` : ""}</p>}
              {letter && <p className="whitespace-pre-wrap border-l-2 border-violet-400/40 pl-3 italic">{letter}</p>}
              {assets.some((a) => a.asset) && (
                <div><p className="mb-1 font-medium text-white">Asset distribution</p>
                  <ul className="space-y-0.5">{assets.filter((a) => a.asset).map((a, i) => <li key={i}>• {a.asset} → {a.to || "—"} ({a.pct}%)</li>)}</ul></div>
              )}
              {guardians.some((g) => g.child) && (
                <div><p className="mb-1 font-medium text-white">Guardians</p>
                  <ul className="space-y-0.5">{guardians.filter((g) => g.child).map((g, i) => <li key={i}>• {g.child} → {g.guardian || "—"}</li>)}</ul></div>
              )}
              {bequests.some((b) => b.item) && (
                <div><p className="mb-1 font-medium text-white">Special bequests</p>
                  <ul className="space-y-0.5">{bequests.filter((b) => b.item).map((b, i) => <li key={i}>• {b.item} → {b.to || "—"}</li>)}</ul></div>
              )}
              {finalWishes && <div><p className="mb-1 font-medium text-white">Final wishes</p><p className="whitespace-pre-wrap">{finalWishes}</p></div>}
            </div>
            <div className="border-t border-white/8 p-4">
              <Button disabled={!reflected} className="w-full bg-violet-500 hover:bg-violet-400">
                <FileDown className="mr-2 h-4 w-4" /> {reflected ? "Generate & save will_drafts" : "Reflect first to finalize"}
              </Button>
            </div>
          </GlowCard>
        </div>
      </div>
    </AppShell>
  );
}

function ListEditor({ title, rows, render, onAdd, onRemove }) {
  return (
    <GlowCard className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <SectionLabel>{title}</SectionLabel>
        <Button size="sm" variant="ghost" onClick={onAdd} className="h-7 text-xs text-violet-300"><Plus className="mr-1 h-3.5 w-3.5" /> Add</Button>
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2">
            {render(r, i)}
            <Button size="icon" variant="ghost" onClick={() => onRemove(i)} className="h-9 w-9 shrink-0 text-slate-500 hover:text-rose-400"><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
      </div>
    </GlowCard>
  );
}
