// ============================================================
// VOICE STUDIO — /portal/voice (owner only)
//
// Every ElevenLabs voice the workspace can use, the owner's own clones
// first. Press play to hear the advisor's opening line in that voice,
// press "Use this voice" and the whole site speaks with it at once: the
// blue microphone, the spoken fact finder, the founder message, the
// journey guides. Upload one to five recordings to clone a new voice.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";

export default function VoiceStudio() {
  const utils = trpc.useUtils();
  const current = trpc.voice.current.useQuery();
  const list = trpc.voice.list.useQuery(undefined, { retry: false });
  const preview = trpc.voice.preview.useMutation();
  const use = trpc.voice.use.useMutation({ onSuccess: () => { utils.voice.current.invalidate(); utils.voice.list.invalidate(); utils.ultra.providers.invalidate(); } });
  const clone = trpc.voice.clone.useMutation({ onSuccess: () => { utils.voice.current.invalidate(); utils.voice.list.invalidate(); } });
  const [playing, setPlaying] = useState<string | null>(null);
  const [line, setLine] = useState("");
  const [filter, setFilter] = useState<"own" | "all">("own");
  const [cloneName, setCloneName] = useState("");
  const [cloneFiles, setCloneFiles] = useState<File[]>([]);
  const [cloneStatus, setCloneStatus] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cache = useRef<Map<string, string>>(new Map());
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const play = async (voiceId: string, provider: "elevenlabs" | "heygen" | "cartesia") => {
    audioRef.current?.pause();
    if (playing === voiceId) { setPlaying(null); return; }
    setPlaying(voiceId);
    try {
      const key = `${voiceId}:${line.trim()}`;
      let src = cache.current.get(key);
      if (!src) {
        const r = await preview.mutateAsync({ provider, voiceId, text: line.trim() || undefined });
        src = `data:${r.mimeType};base64,${r.audioBase64}`;
        cache.current.set(key, src);
      }
      const el = new Audio(src);
      audioRef.current = el;
      el.onended = () => setPlaying((p) => (p === voiceId ? null : p));
      await el.play();
    } catch {
      setPlaying(null);
    }
  };

  const doClone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName.trim() || !cloneFiles.length) return;
    setCloneStatus("Uploading and cloning… about a minute.");
    try {
      const files = await Promise.all(cloneFiles.slice(0, 5).map(async (f) => ({ name: f.name, mimeType: f.type || "audio/mpeg", base64: await toBase64(f) })));
      const r = await clone.mutateAsync({ name: cloneName.trim(), files, useNow: true });
      setCloneStatus(`Cloned as ${r.voiceId}${r.active ? " and now speaking for the site." : "."}`);
      setCloneName(""); setCloneFiles([]);
    } catch (err) {
      setCloneStatus((err as Error).message);
    }
  };

  const voices = (list.data?.voices ?? []).filter((v) => filter === "all" || v.own);
  const active = current.data?.voiceId ?? null;
  const activeProvider = current.data?.provider ?? null;
  const activeName = list.data?.voices.find((v) => v.voiceId === active && v.provider === activeProvider)?.name ?? current.data?.name ?? null;

  return (
    <AppShell title="Voice Studio" subtitle="Pick the voice the site speaks with, hear it, or clone a new one.">
      <div className="mx-auto max-w-5xl px-4 py-8 text-white" data-testid="voice-studio">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-sky-300">Owner · ElevenLabs</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight">Voice Studio</h1>
            <p className="mt-2 max-w-2xl leading-7 text-sky-100/70">Whatever you choose here is the voice of the blue microphone, the spoken fact finder, the founder message and the journey guides, at once, no redeploy.</p>
          </div>
          <Link href="/portal/advisor" className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/10">Advisor dashboard</Link>
        </div>

        <section className="mt-6 rounded-2xl border border-sky-300/25 bg-sky-500/10 p-4" aria-label="Current voice">
          {current.error ? <p className="text-sm text-amber-200">{current.error.message}</p> : (
            <p className="text-sm">
              <span className="text-sky-200/70">Speaking now:</span> <span className="font-semibold">{activeName ?? active ?? "no voice set"}</span>{activeProvider && <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-xs">{activeProvider}</span>}
              {current.data && <span className="text-sky-200/60"> · {current.data.source === "studio" ? "picked here" : current.data.source === "environment" ? `from the host's environment${current.data.env.heygenVoiceName ? ` (HEYGEN_VOICE_NAME = ${current.data.env.heygenVoiceName})` : ""}` : "nothing configured"}{current.data.keys.heygen ? "" : " · HEYGEN_API_KEY missing"}{current.data.keys.elevenlabs ? "" : " · ELEVENLABS_API_KEY missing"}</span>}
            </p>
          )}
          <label className="mt-3 block text-sm text-sky-100/70">Line to audition (optional)
            <input value={line} onChange={(e) => { setLine(e.target.value); cache.current.clear(); }} placeholder="Leave empty for the advisor's opening line" className="mt-1 w-full rounded-xl border border-sky-300/25 bg-black/30 px-3 py-2 text-white placeholder:text-white/30" />
          </label>
        </section>

        <div className="mt-6 flex items-center gap-2 text-sm">
          <button type="button" onClick={() => setFilter("own")} className={`rounded-lg px-3 py-1.5 ${filter === "own" ? "bg-sky-500 text-white" : "border border-white/15"}`}>My voices</button>
          <button type="button" onClick={() => setFilter("all")} className={`rounded-lg px-3 py-1.5 ${filter === "all" ? "bg-sky-500 text-white" : "border border-white/15"}`}>All voices</button>
          <span className="text-white/50">{list.isLoading ? "Loading…" : `${voices.length} voice${voices.length === 1 ? "" : "s"}`}</span>
        </div>
        {list.error && <p className="mt-3 text-sm text-amber-200">{list.error.message}</p>}
        {list.data?.errors.map((e) => <p key={e} className="mt-2 text-sm text-amber-200">{e}</p>)}

        <ul className="mt-3 grid gap-3 sm:grid-cols-2" data-testid="voice-list">
          {voices.map((v) => (
            <li key={`${v.provider}:${v.voiceId}`} className={`rounded-2xl border p-4 ${v.active ? "border-emerald-300/60 bg-emerald-500/10" : "border-white/10 bg-white/[0.03]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{v.name}{v.active && <span className="ml-2 rounded-full bg-emerald-500/30 px-2 py-0.5 text-xs">speaking now</span>}</p>
                  <p className="text-xs text-white/50"><span className={`rounded px-1 ${v.provider === "heygen" ? "bg-amber-500/30" : v.provider === "cartesia" ? "bg-emerald-500/30" : "bg-sky-500/30"}`}>{v.provider}</span> · {v.category}{v.labels.gender ? ` · ${v.labels.gender}` : ""}{v.labels.accent ? ` · ${v.labels.accent}` : ""}{v.labels.age ? ` · ${v.labels.age}` : ""}</p>
                  {v.description && <p className="mt-1 line-clamp-2 text-xs text-white/60">{v.description}</p>}
                </div>
                <button type="button" onClick={() => void play(v.voiceId, v.provider)} aria-label={playing === v.voiceId ? `Stop ${v.name}` : `Play ${v.name}`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${playing === v.voiceId ? "bg-red-500/80" : "bg-sky-500 hover:bg-sky-400"}`}>
                  {playing === v.voiceId ? <span className="block h-3.5 w-3.5 bg-white" /> : <span className="ml-0.5 block h-0 w-0 border-y-[8px] border-l-[13px] border-y-transparent border-l-white" />}
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={v.active || use.isPending} onClick={() => use.mutate({ provider: v.provider, voiceId: v.voiceId })} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold hover:bg-white/20 disabled:opacity-40">{v.active ? "In use" : "Use this voice"}</button>
                <span className="self-center text-[10px] text-white/30">{v.voiceId}</span>
              </div>
            </li>
          ))}
        </ul>
        {use.data && !use.data.saved && <p className="mt-2 text-sm text-amber-200">{use.data.reason}</p>}
        {preview.error && <p className="mt-2 text-sm text-amber-200">{preview.error.message}</p>}

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-5" aria-label="Clone a voice">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">Clone a new voice</p>
          <h2 className="mt-1 text-2xl font-semibold">Your voice, from your recordings</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">One to five clean recordings of you talking, one to three minutes in total, no music. ElevenLabs makes an instant clone in about a minute and the site starts speaking with it. Your HeyGen clones are already listed above under their own badge.</p>
          <form onSubmit={doClone} className="mt-4 grid gap-3">
            <input value={cloneName} onChange={(e) => setCloneName(e.target.value)} placeholder="Name, e.g. Sam Russell — advisor" className="rounded-xl border border-white/15 bg-black/30 px-3 py-2.5 text-white placeholder:text-white/30" />
            <input type="file" accept="audio/*,video/mp4" multiple onChange={(e) => setCloneFiles(Array.from(e.target.files ?? []).slice(0, 5))} className="text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-white" />
            {cloneFiles.length > 0 && <p className="text-xs text-white/50">{cloneFiles.map((f) => `${f.name} (${Math.round(f.size / 1024)} KB)`).join(" · ")}</p>}
            <button type="submit" disabled={!cloneName.trim() || !cloneFiles.length || clone.isPending} className="w-fit rounded-xl bg-sky-500 px-5 py-2.5 font-semibold hover:bg-sky-400 disabled:opacity-50">{clone.isPending ? "Cloning…" : "Clone and use it"}</button>
            {cloneStatus && <p className="text-sm text-white/70">{cloneStatus}</p>}
          </form>
        </section>
      </div>
    </AppShell>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(new Error("Could not read the file"));
    r.readAsDataURL(file);
  });
}
