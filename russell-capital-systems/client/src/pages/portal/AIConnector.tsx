/**
 * AI Connector — enter and rotate provider API keys inside the platform.
 *
 * Two doors: an owner-tier verified session gets you to this page, and the
 * vault passphrase gets you to the keys. The unlock is time-limited, so an
 * unattended laptop stops being an unattended key store.
 *
 * Keys go in and never come back out. There is no reveal button, because a
 * reveal button is a read endpoint and the first thing anyone who gets a
 * session does is call it. To check what a key is, look in the provider's own
 * console; to check it still works, press Test.
 */
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "../../../../server/routers";
import { cn } from "@/lib/utils";
import { looksLikeValidKey } from "@shared/aiProviders";
import { ADVISOR_NAME as ADVISOR_NAME_LABEL } from "@shared/aiAdvisor";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  ExternalLink,
  Eye,
  Globe,
  KeyRound,
  Loader2,
  Lock,
  LockOpen,
  Plug,
  RefreshCw,
  ShieldAlert,
  Trash2,
  XCircle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

export default function AIConnector() {
  const overview = trpc.vault.overview.useQuery(undefined, { refetchInterval: 60_000 });
  const utils = trpc.useUtils();
  const refresh = () => utils.vault.overview.invalidate();

  if (overview.isLoading) {
    return (
      <AppShell title="Brain Hub" subtitle="Provider keys, managed in-platform">
        <div className="flex items-center gap-2 text-slate-500 text-sm py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking the vault…
        </div>
      </AppShell>
    );
  }

  if (overview.error) {
    return (
      <AppShell title="Brain Hub" subtitle="Provider keys, managed in-platform">
        <Banner tone="error" title="Not available">
          {overview.error.message}
        </Banner>
      </AppShell>
    );
  }

  const data = overview.data!;

  return (
    <AppShell title="Brain Hub" subtitle="Fifty-five brains, forty MCP servers — keyed here or on Railway, never in code">
      <div className="max-w-5xl space-y-5 pb-10">
        {/* The Railway keys work whether or not the vault exists, so they are
            shown and testable before any vault gate — otherwise the page can
            read "one variable still needed" while seven brains are answering. */}
        <RailwayKeysPanel data={data} />

        {!data.vault.ready ? (
          <VaultSetupRequired reason={data.vault.reason} />
        ) : !data.access.configured ? (
          <SetPassphrase minLength={data.access.minPassphraseLength} onDone={refresh} />
        ) : !data.access.unlocked ? (
          <UnlockPanel
            lockedOut={data.access.lockedOut}
            lockedUntil={data.access.lockedUntil}
            attemptsRemaining={data.access.attemptsRemaining}
            onDone={refresh}
          />
        ) : (
          <UnlockedVault data={data} onChanged={refresh} />
        )}

        <AuditTrail />
      </div>
    </AppShell>
  );
}

// ─── Keys the hosting environment already holds ─────────────────────────────

type OverviewData = inferRouterOutputs<AppRouter>["vault"]["overview"];
type EnvTest = inferRouterOutputs<AppRouter>["vault"]["testEnvironment"][number];

/**
 * Every provider keyed by a Railway variable, with one button that makes a
 * real call on each and reports the outcome per variable. Needs the owner
 * session only; the vault is not involved, because these keys never enter it.
 */
function RailwayKeysPanel({ data }: { data: OverviewData }) {
  const fromEnv = data.fromEnvironment ?? [];
  const [results, setResults] = useState<EnvTest[] | null>(null);
  const test = trpc.vault.testEnvironment.useMutation({
    onSuccess: r => {
      setResults(r);
      const ok = r.filter(x => x.ok).length;
      if (ok === r.length) toast.success(`All ${ok} Railway key${ok === 1 ? "" : "s"} answered.`);
      else toast.warning(`${ok} of ${r.length} Railway keys answered. See each row.`);
    },
    onError: e => toast.error(e.message),
  });
  const nameOf = (id: string) => data.catalog.find(c => c.id === id)?.name ?? id;

  return (
    <section className="rounded-2xl border border-sky-500/30 bg-sky-500/[0.05] p-5 space-y-3" data-testid="railway-keys-panel">
      <div className="flex flex-wrap items-center gap-3">
        <Globe className="w-4 h-4 text-sky-400 shrink-0" />
        <h2 className="text-[14px] font-semibold text-white">
          {fromEnv.length === 0
            ? "No provider keys on Railway yet"
            : `${fromEnv.length} brain${fromEnv.length === 1 ? "" : "s"} keyed on Railway`}
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => test.mutate()}
          disabled={test.isPending || fromEnv.length === 0}
          className="ml-auto h-7 border-sky-500/40 bg-transparent text-sky-200 hover:text-white hover:border-sky-400"
        >
          {test.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
          {test.isPending ? "Calling each one…" : "Test the Railway keys"}
        </Button>
      </div>

      {fromEnv.length === 0 ? (
        <p className="text-[12.5px] text-slate-400 leading-relaxed">
          On Railway: your service → <strong>Variables</strong> → New Variable, named for the provider (for example{" "}
          <code className="text-amber-400">ANTHROPIC_API_KEY</code>, <code className="text-amber-400">MISTRAL_API_KEY</code>, or the
          uniform <code className="text-amber-400">RCS_BRAIN_&lt;PROVIDER&gt;_API_KEY</code>). Every accepted name is listed on the
          provider's row below once the vault is open.
        </p>
      ) : (
        <ul className="divide-y divide-sky-500/15">
          {fromEnv.map(id => {
            const r = results?.find(x => x.providerId === id);
            return (
              <li key={id} className="flex flex-wrap items-center gap-2 py-2 text-[13px]">
                <span className={cn("w-2 h-2 rounded-full shrink-0", r ? (r.ok ? "bg-emerald-400" : "bg-red-400") : "bg-sky-400")} />
                <span className="font-medium text-white">{nameOf(id)}</span>
                {r?.envName && <code className="text-[11px] text-slate-500">{r.envName}</code>}
                <span className={cn("ml-auto text-[12px]", r ? (r.ok ? "text-emerald-300" : "text-red-300") : "text-slate-500")}>
                  {r ? r.message : "Set on the server · not yet tested"}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Setup: the one env var ──────────────────────────────────────────────────

function VaultSetupRequired({ reason }: { reason: string | null }) {
  return (
    <div className="space-y-4">
      <Banner tone="error" title="One environment variable is still needed">
        {reason}
      </Banner>

      <section className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Why this one has to live outside the app</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          <code className="text-amber-400">RCS_VAULT_KEY</code> is the master key that encrypts every provider
          key you enter here. It cannot be stored in the database, because anything that can decrypt the
          database cannot live inside it. That is the whole point: if the database is ever dumped, backed up
          somewhere careless, or opened with a third-party tool, the API keys in it are ciphertext and stay
          ciphertext.
        </p>
        <p className="text-sm text-slate-400 leading-relaxed">
          So it is <strong className="text-slate-200">one variable, set once</strong>. Every provider key after
          that is managed on this page, with no redeploy.
        </p>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-slate-300">1. Choose a passcode</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            Anything you like: a phrase, a sentence, a string of words. No format, no minimum. The server
            stretches it into the encryption key. Longer is stronger, but nothing is required.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-[13px] font-medium text-slate-300">2. Set it where the app runs</p>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            On Railway: your service → <strong>Variables</strong> → New Variable →{" "}
            <code className="text-amber-400">RCS_VAULT_KEY</code> = your passcode. The service redeploys
            automatically.
          </p>
        </div>

        <Banner tone="warn" title="Keep a copy somewhere safe">
          If this value is lost, every stored provider key becomes unrecoverable and has to be re-entered. That
          takes a couple of minutes, but there is no recovering the old ones — which is exactly the property
          that makes the encryption worth having.
        </Banner>
      </section>
    </div>
  );
}

// ─── Setup: the passphrase ───────────────────────────────────────────────────

function SetPassphrase({ minLength, onDone }: { minLength: number; onDone: () => void }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);

  const mut = trpc.vault.setPassphrase.useMutation({
    onSuccess: () => {
      toast.success("Vault passphrase set. Unlock to add keys.");
      setValue("");
      setConfirm("");
      onDone();
    },
    onError: e => toast.error(e.message),
  });

  const tooShort = value.length > 0 && value.length < minLength;
  const mismatch = confirm.length > 0 && value !== confirm;
  const ready = value.length >= minLength && value === confirm;

  return (
    <section className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.05] p-5 space-y-4">
      <div className="flex items-start gap-3">
        <KeyRound className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-semibold text-white">Set your vault passphrase</h2>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            This is a second factor on top of your portal sign-in — only you know it, and it is required before
            any key can be added, changed, or deleted. Minimum {minLength} characters.
          </p>
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        <div className="space-y-1">
          <Label className="text-slate-300 text-[13px]">Passphrase</Label>
          <div className="relative">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={e => setValue(e.target.value)}
              autoComplete="new-password"
              className="bg-[#111827]/70 border-[#1e3a5f] text-white pr-10 focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400"
              aria-label={show ? "Hide passphrase" : "Show passphrase"}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
          <p className={cn("text-[11px]", tooShort ? "text-amber-400" : "text-slate-600")}>
            {value.length} / {minLength} characters
            {tooShort && " — keep going"}
          </p>
        </div>

        <div className="space-y-1">
          <Label className="text-slate-300 text-[13px]">Confirm</Label>
          <Input
            type={show ? "text" : "password"}
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
          />
          {mismatch && <p className="text-[11px] text-red-400">These do not match.</p>}
        </div>

        <Button
          onClick={() => mut.mutate({ newPassphrase: value })}
          disabled={!ready || mut.isPending}
          className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] font-semibold disabled:opacity-40"
        >
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
          Set passphrase
        </Button>
      </div>

      <Banner tone="warn" title="There is no reset link">
        Nobody can recover this for you — that is what makes it worth having. Store it where you store other
        irreplaceable things.
      </Banner>
    </section>
  );
}

// ─── Unlock ──────────────────────────────────────────────────────────────────

function UnlockPanel({
  lockedOut,
  lockedUntil,
  attemptsRemaining,
  onDone,
}: {
  lockedOut: boolean;
  lockedUntil: Date | null;
  attemptsRemaining: number;
  onDone: () => void;
}) {
  const [passphrase, setPassphrase] = useState("");
  const mut = trpc.vault.unlock.useMutation({
    onSuccess: () => {
      toast.success("Vault unlocked.");
      setPassphrase("");
      onDone();
    },
    onError: e => toast.error(e.message),
  });

  if (lockedOut) {
    return (
      <Banner tone="error" title="Vault locked">
        Too many failed attempts.
        {lockedUntil && ` Try again after ${new Date(lockedUntil).toLocaleTimeString()}.`}
      </Banner>
    );
  }

  return (
    <section className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 p-5 space-y-4">
      <div className="flex items-start gap-3">
        <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-base font-semibold text-white">Vault locked</h2>
          <p className="text-sm text-slate-400 mt-1">Enter your vault passphrase to manage provider keys.</p>
        </div>
      </div>

      <form
        className="flex gap-2 max-w-md"
        onSubmit={e => {
          e.preventDefault();
          if (passphrase) mut.mutate({ passphrase });
        }}
      >
        <Input
          type="password"
          value={passphrase}
          onChange={e => setPassphrase(e.target.value)}
          placeholder="Vault passphrase"
          autoComplete="off"
          className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
        />
        <Button
          type="submit"
          disabled={!passphrase || mut.isPending}
          className="shrink-0 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] font-semibold"
        >
          {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LockOpen className="w-4 h-4" />}
        </Button>
      </form>

      {attemptsRemaining < 5 && (
        <p className="text-[12px] text-amber-400">
          {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"} remaining before a 15-minute lockout.
        </p>
      )}
    </section>
  );
}

// ─── Unlocked ────────────────────────────────────────────────────────────────

/**
 * Derived from the router itself, so the UI cannot drift out of step with what
 * the server actually returns.
 */
type Overview = inferRouterOutputs<AppRouter>["vault"]["overview"];

function UnlockedVault({ data, onChanged }: { data: Overview; onChanged: () => void }) {
  const [remaining, setRemaining] = useState(data.access.expiresInMs);

  useEffect(() => {
    setRemaining(data.access.expiresInMs);
  }, [data.access.expiresInMs]);

  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining(r => Math.max(0, r - 1000)), 1000);
    return () => clearInterval(t);
  }, [remaining]);

  useEffect(() => {
    if (remaining === 0) onChanged();
  }, [remaining, onChanged]);

  const lockMut = trpc.vault.lock.useMutation({ onSuccess: onChanged });
  const testAll = trpc.vault.testAll.useMutation({
    onSuccess: results => {
      const ok = results.filter(r => r.ok).length;
      if (ok === results.length) toast.success(`All ${ok} provider${ok === 1 ? "" : "s"} answered.`);
      else toast.warning(`${ok} of ${results.length} answered. See the detail on each row.`);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const configured = data.providers.filter(p => p.configured);
  const fromEnv = data.fromEnvironment ?? [];
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <div className="space-y-4">
      {/* Unlock status */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] px-4 py-3">
        <LockOpen className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-[13px] text-emerald-300 font-medium">Vault unlocked</span>
        <span className="flex items-center gap-1 text-[12px] text-slate-500">
          <Clock className="w-3 h-3" />
          re-locks in {minutes}:{String(seconds).padStart(2, "0")}
        </span>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => testAll.mutate()}
            disabled={testAll.isPending || configured.length === 0}
            className="h-7 border-[#1e3a5f] bg-transparent text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
          >
            {testAll.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Zap className="w-3.5 h-3.5 mr-1" />}
            Test all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => lockMut.mutate()}
            className="h-7 border-[#1e3a5f] bg-transparent text-slate-400 hover:text-white"
          >
            <Lock className="w-3.5 h-3.5 mr-1" /> Lock now
          </Button>
        </div>
      </div>

      {/* Keys the hosting environment already holds. These answer whether or not
          the vault is set up, so saying "nothing configured" here would be a lie. */}
      {fromEnv.length > 0 && (
        <Banner tone="info" title={`${fromEnv.length} already live from your hosting environment`}>
          <strong>{fromEnv.map(id => data.catalog.find(c => c.id === id)?.name ?? id).join(", ")}</strong>{" "}
          {fromEnv.length === 1 ? "is" : "are"} working right now from a key set on the server — you do not
          need to re-enter {fromEnv.length === 1 ? "it" : "them"} below. Entering one here anyway is not
          wasted: a key you type in takes precedence, which is how you change a model or rotate a key without
          touching the server.
        </Banner>
      )}

      {configured.length === 0 && fromEnv.length === 0 && (
        <Banner tone="warn" title="No provider keys yet">
          Thomas is running on the built-in gateway — a fast, non-flagship model with a minimal reasoning
          budget. Adding one key below changes that for every AI feature on the platform, not just the advisor.
          Anthropic or OpenAI first; Perplexity if you want cited sources on the compliance pages.
        </Banner>
      )}

      {/* Routing order */}
      {configured.length > 1 && (
        <Banner tone="info" title="Routing order">
          Calls try each enabled provider in priority order (lowest number first) and use the first that
          answers. A provider that is down or rate limited is skipped automatically — but a provider that{" "}
          <strong>rejects its key</strong> stops the chain rather than failing over quietly, so a dead key
          gets noticed instead of silently costing you money somewhere else.
        </Banner>
      )}

      {/* Providers */}
      <div>
        <h2 className="text-[11px] uppercase tracking-wide text-slate-600 mb-2 px-1">
          AI providers · {configured.length} of {data.catalog.length} connected
        </h2>
        <div className="space-y-2.5">
          {data.catalog.map(provider => {
            const status = data.providers.find(p => p.providerId === provider.id);
            return (
              <ProviderRow
                key={provider.id}
                provider={provider}
                status={status}
                liveFromEnvironment={fromEnv.includes(provider.id)}
                onChanged={onChanged}
              />
            );
          })}
        </div>
      </div>

      {/* Any other API */}
      <CustomSection custom={data.custom} onChanged={onChanged} />

      {/* MCP servers */}
      <McpSection servers={data.mcp} onChanged={onChanged} />
    </div>
  );
}

// ─── Custom API endpoints ────────────────────────────────────────────────────

function CustomSection({ custom, onChanged }: { custom: Overview["custom"]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [chatPath, setChatPath] = useState("/v1/chat/completions");
  const [wireFormat, setWireFormat] = useState<"openai-compatible" | "anthropic" | "google-generative">("openai-compatible");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [note, setNote] = useState("");

  // The same form also takes an MCP endpoint, because whether a platform
  // offers an API, an MCP server, or both is the platform's decision and not
  // something the person filling this in should have to think about. Name it
  // once, fill in whichever half you have.
  const [mcpUrl, setMcpUrl] = useState("");
  const [mcpToken, setMcpToken] = useState("");
  const [mcpAuto, setMcpAuto] = useState(false);

  const hasApi = Boolean(baseUrl.trim() && model.trim() && apiKey.trim());
  const hasMcp = Boolean(mcpUrl.trim());

  const addMcp = trpc.vault.setMcpServer.useMutation();

  const reset = () => {
    setName(""); setBaseUrl(""); setModel(""); setApiKey(""); setNote("");
    setMcpUrl(""); setMcpToken(""); setMcpAuto(false);
    setAdding(false);
  };

  const add = trpc.vault.addCustomProvider.useMutation({
    onSuccess: async res => {
      toast.success(res.tested ? `${name} API connected — answered in ${res.latencyMs}ms.` : `${name} API saved.`);
      if (res.warning) toast.warning(res.warning);

      // If an MCP endpoint was given too, connect that in the same action.
      if (hasMcp) {
        try {
          const mcpRes = await addMcp.mutateAsync({
            label: name,
            url: mcpUrl.trim(),
            token: mcpToken.trim() || undefined,
            autoInvoke: mcpAuto,
          });
          toast.success(`${name} MCP connected — ${mcpRes.toolCount} tool${mcpRes.toolCount === 1 ? "" : "s"}.`);
        } catch (e: any) {
          // The API half already saved. Say what happened rather than rolling
          // back work that succeeded.
          toast.error(`${name} API saved, but the MCP endpoint failed: ${e.message}`);
        }
      }

      reset();
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  /** MCP-only: no API half to save first. */
  const submitMcpOnly = async () => {
    try {
      const res = await addMcp.mutateAsync({
        label: name,
        url: mcpUrl.trim(),
        token: mcpToken.trim() || undefined,
        autoInvoke: mcpAuto,
      });
      toast.success(`${name} connected — ${res.toolCount} tool${res.toolCount === 1 ? "" : "s"} discovered.`);
      reset();
      onChanged();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const remove = trpc.vault.deleteCustomProvider.useMutation({
    onSuccess: () => { toast.success("Removed."); onChanged(); },
    onError: e => toast.error(e.message),
  });

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-[11px] uppercase tracking-wide text-slate-600">
          Add any AI · {custom.length} added
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAdding(!adding)}
          className="ml-auto h-7 border-[#1e3a5f] bg-transparent text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
        >
          <Globe className="w-3.5 h-3.5 mr-1" /> {adding ? "Cancel" : "Add an AI"}
        </Button>
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed px-1">
        Any AI platform not in the list above. Give it a name, then fill in whichever half you have — an API
        key, an MCP endpoint, or both. Most platforms have one or the other; you do not need both.
      </p>

      {adding && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.04] p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Name" hint="What you want to call it">
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Reka"
                className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
            </Field>
            <Field label="API key">
              <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} autoComplete="off" spellCheck={false}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Base URL" hint="The API root, no trailing slash">
              <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.example.com" spellCheck={false}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
            </Field>
            <Field label="Completion path" hint="Usually /v1/chat/completions">
              <Input value={chatPath} onChange={e => setChatPath(e.target.value)} spellCheck={false}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Model" hint="Exact id this service expects">
              <Input value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. reka-core" spellCheck={false}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
            </Field>
            <Field label="API style" hint="Almost always the first one">
              <select value={wireFormat} onChange={e => setWireFormat(e.target.value as any)}
                className="w-full h-9 rounded-md bg-[#111827]/70 border border-[#1e3a5f] text-white text-sm px-3 outline-none focus:border-amber-500">
                <option value="openai-compatible" className="bg-[#0a0f1a]">OpenAI-compatible</option>
                <option value="anthropic" className="bg-[#0a0f1a]">Anthropic messages</option>
                <option value="google-generative" className="bg-[#0a0f1a]">Google generateContent</option>
              </select>
            </Field>
          </div>

          <Field label="Note" hint="Optional — what you use this one for">
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. cheap bulk summarisation"
              className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
          </Field>

          {/* MCP half — optional, same form */}
          <div className="pt-3 mt-1 border-t border-[#1e3a5f]/40 space-y-3">
            <div className="flex items-center gap-2">
              <Plug className="w-3.5 h-3.5 text-slate-500" />
              <h4 className="text-[12px] font-semibold text-slate-300 uppercase tracking-wide">
                MCP endpoint — optional
              </h4>
            </div>
            <p className="text-[11.5px] text-slate-600 leading-relaxed">
              Only if this platform publishes one. An MCP server gives {ADVISOR_NAME_LABEL} tools it can call;
              the API key above gives him the model itself. Many platforms offer only one.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="MCP URL" hint="Usually ends /mcp or /sse">
                <Input value={mcpUrl} onChange={e => setMcpUrl(e.target.value)} placeholder="https://mcp.example.com/mcp" spellCheck={false}
                  className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
              </Field>
              <Field label="MCP token" hint="Blank if the server is open">
                <Input type="password" value={mcpToken} onChange={e => setMcpToken(e.target.value)} autoComplete="off"
                  className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20" />
              </Field>
            </div>

            {hasMcp && (
              <label className="flex items-start gap-2 text-[12px] text-slate-400 cursor-pointer">
                <input type="checkbox" checked={mcpAuto} onChange={e => setMcpAuto(e.target.checked)} className="accent-amber-500 mt-0.5" />
                <span>
                  Allow automatic tool use.
                  <span className="text-slate-600"> Off by default — an MCP tool can write to real systems.</span>
                </span>
              </label>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => {
              if (hasApi) add.mutate({ name, baseUrl, chatPath, wireFormat, model, apiKey, note: note || undefined });
              else void submitMcpOnly();
            }}
            disabled={!name || (!hasApi && !hasMcp) || add.isPending || addMcp.isPending}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] font-semibold disabled:opacity-40"
          >
            {add.isPending || addMcp.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Globe className="w-3.5 h-3.5 mr-1.5" />}
            {hasApi && hasMcp ? "Test and connect both" : hasApi ? "Test and connect API" : hasMcp ? "Test and connect MCP" : "Fill in an API or an MCP endpoint"}
          </Button>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Everything is called for real before it saves. A typo in a path, a wrong API style or a dead MCP
            URL is rejected here rather than discovered mid-conversation.
          </p>
        </div>
      )}

      {custom.map(c => (
        <article key={c.slug} className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-slate-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[14px] font-semibold text-white">{c.name}</h3>
                <span className="text-[11px] text-slate-600">{c.wireFormat}</span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-0.5 truncate font-mono">
                {c.baseUrl}{c.chatPath} · {c.defaultModel}
              </p>
              {c.note && <p className="text-[11.5px] text-slate-600 mt-0.5">{c.note}</p>}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { if (confirm(`Remove ${c.name}?`)) remove.mutate({ slug: c.slug }); }}
              className="shrink-0 border-red-500/30 bg-transparent text-red-400/80 hover:text-red-400 hover:border-red-500/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-slate-300 text-[13px]">{label}</Label>
        {hint && <span className="text-[10.5px] text-slate-600">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

// ─── MCP ─────────────────────────────────────────────────────────────────────

function McpSection({ servers, onChanged }: { servers: Overview["mcp"]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [autoInvoke, setAutoInvoke] = useState(false);

  const add = trpc.vault.setMcpServer.useMutation({
    onSuccess: res => {
      toast.success(`${res.serverName} connected — ${res.toolCount} tool${res.toolCount === 1 ? "" : "s"} discovered.`);
      if (res.warning) toast.warning(res.warning);
      setLabel("");
      setUrl("");
      setToken("");
      setAdding(false);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <h2 className="text-[11px] uppercase tracking-wide text-slate-600">
          MCP servers · {servers.length} connected
        </h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setAdding(!adding)}
          className="ml-auto h-7 border-[#1e3a5f] bg-transparent text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
        >
          <Plug className="w-3.5 h-3.5 mr-1" /> {adding ? "Cancel" : "Add server"}
        </Button>
      </div>

      <p className="text-[12px] text-slate-500 leading-relaxed px-1">
        An MCP server gives {ADVISOR_NAME_LABEL} live tools — query a CRM, pull a carrier rate, search a
        document store. Paste the endpoint URL and a token if it needs one; the tools are discovered
        automatically on connect.
      </p>

      {adding && (
        <div className="rounded-2xl border border-amber-500/35 bg-amber-500/[0.04] p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-[13px]">Name</Label>
              <Input
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. Carrier Rate Lookup"
                className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-[13px]">Auth token</Label>
              <Input
                type="password"
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="Leave blank if the server is open"
                autoComplete="off"
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-slate-300 text-[13px]">Endpoint URL</Label>
            <Input
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://mcp.example.com/mcp"
              spellCheck={false}
              className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            />
            <p className="text-[10.5px] text-slate-600">
              Most servers live at a /mcp or /sse path rather than the site root. The URL is tested before
              anything is saved.
            </p>
          </div>

          <label className="flex items-start gap-2 text-[12.5px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoInvoke}
              onChange={e => setAutoInvoke(e.target.checked)}
              className="accent-amber-500 mt-0.5"
            />
            <span>
              Allow automatic tool use.
              <span className="text-slate-600">
                {" "}Off by default — an MCP tool can write to real systems, and a model deciding on its own to
                call one is a different risk from it answering a question. Turn this on only for servers you
                trust to be called without review.
              </span>
            </span>
          </label>

          <Button
            size="sm"
            onClick={() => add.mutate({ label, url, token: token || undefined, autoInvoke })}
            disabled={!label || !url || add.isPending}
            className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] font-semibold disabled:opacity-40"
          >
            {add.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plug className="w-3.5 h-3.5 mr-1.5" />}
            Connect and discover tools
          </Button>
        </div>
      )}

      {servers.map(server => (
        <McpRow key={server.slug} server={server} onChanged={onChanged} />
      ))}
    </section>
  );
}

function McpRow({ server, onChanged }: { server: Overview["mcp"][number]; onChanged: () => void }) {
  const [open, setOpen] = useState(false);

  const test = trpc.vault.testMcpServer.useMutation({
    onSuccess: r => {
      if (r.ok) toast.success(`${r.serverName} — ${r.tools.length} tool${r.tools.length === 1 ? "" : "s"}.`);
      else toast.error(r.message);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });
  const update = trpc.vault.updateMcpServer.useMutation({ onSuccess: onChanged, onError: e => toast.error(e.message) });
  const remove = trpc.vault.deleteMcpServer.useMutation({
    onSuccess: () => {
      toast.success(`${server.label} removed.`);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const dot = !server.enabled ? "bg-slate-700" : server.lastTestOk === true ? "bg-emerald-400" : server.lastTestOk === false ? "bg-red-400" : "bg-amber-400";

  return (
    <article className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left px-5 py-3.5" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-semibold text-white">{server.label}</h3>
              <span className="text-[11px] text-slate-600">
                {server.toolCount} tool{server.toolCount === 1 ? "" : "s"}
              </span>
              {server.autoInvoke ? (
                <span className="rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Auto-invoke on
                </span>
              ) : (
                <span className="rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-slate-700/40 text-slate-400 border border-slate-600/40">
                  Manual only
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate font-mono">{server.url}</p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-600 shrink-0 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-3 border-t border-[#1e3a5f]/30 pt-4">
          {server.lastTestDetail && (
            <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 border", server.lastTestOk ? "border-emerald-500/25 bg-emerald-500/[0.05]" : "border-red-500/25 bg-red-500/[0.05]")}>
              {server.lastTestOk ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className={cn("text-[12px] leading-relaxed", server.lastTestOk ? "text-emerald-200/85" : "text-red-200/85")}>
                {server.lastTestDetail}
              </p>
            </div>
          )}

          {server.tools.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-600 mb-1.5">Tools discovered</p>
              <ul className="space-y-1">
                {server.tools.map(tool => (
                  <li key={tool.name} className="text-[12px] text-slate-400 leading-relaxed">
                    <code className="text-amber-400/90">{server.slug}.{tool.name}</code>
                    {tool.description && <span className="text-slate-500"> — {tool.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => test.mutate({ slug: server.slug })}
              disabled={test.isPending}
              className="border-[#1e3a5f] bg-transparent text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
            >
              {test.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
              Test and refresh tools
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => update.mutate({ slug: server.slug, autoInvoke: !server.autoInvoke })}
              className={cn("bg-transparent", server.autoInvoke ? "border-amber-500/40 text-amber-400" : "border-[#1e3a5f] text-slate-400 hover:text-white")}
            >
              {server.autoInvoke ? "Disable auto-invoke" : "Allow auto-invoke"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => update.mutate({ slug: server.slug, enabled: !server.enabled })}
              className="border-[#1e3a5f] bg-transparent text-slate-400 hover:text-white"
            >
              {server.enabled ? "Disable" : "Enable"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (confirm(`Remove ${server.label}?`)) remove.mutate({ slug: server.slug });
              }}
              className="ml-auto border-red-500/30 bg-transparent text-red-400/80 hover:text-red-400 hover:border-red-500/50"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

function ProviderRow({
  provider,
  status,
  liveFromEnvironment,
  onChanged,
}: {
  provider: Overview["catalog"][number];
  status: Overview["providers"][number] | undefined;
  /** A key for this provider is already set on the server, outside the vault. */
  liveFromEnvironment?: boolean;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(status?.model || provider.defaultModel);
  const [priority, setPriority] = useState(status?.priority ?? 100);
  const [testFirst, setTestFirst] = useState(true);

  const setKey = trpc.vault.setKey.useMutation({
    onSuccess: res => {
      toast.success(
        res.tested
          ? `${provider.name} connected — answered in ${res.latencyMs}ms.`
          : `${provider.name} key saved (not tested).`,
      );
      if (res.warning) toast.info(res.warning);
      setApiKey("");
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const testKey = trpc.vault.testKey.useMutation({
    onSuccess: r => {
      if (r.ok) toast.success(`${provider.name} answered in ${r.latencyMs}ms.`);
      else toast.error(r.message);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const deleteKey = trpc.vault.deleteKey.useMutation({
    onSuccess: () => {
      toast.success(`${provider.name} key removed.`);
      onChanged();
    },
    onError: e => toast.error(e.message),
  });

  const updateProvider = trpc.vault.updateProvider.useMutation({
    onSuccess: onChanged,
    onError: e => toast.error(e.message),
  });

  const configured = status?.configured ?? false;
  const shape = apiKey ? looksLikeValidKey(provider.id, apiKey) : null;

  // A server-set key is working even with nothing in the vault, so the row must
  // not read as dark/unconfigured. Sky rather than emerald: it is live, but it
  // has not been tested from this page.
  const dot = !configured && liveFromEnvironment
    ? "bg-sky-400"
    : !configured
    ? "bg-slate-700"
    : status?.lastTestOk === true
      ? "bg-emerald-400"
      : status?.lastTestOk === false
        ? "bg-red-400"
        : "bg-amber-400";

  return (
    <article className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full text-left px-5 py-3.5" aria-expanded={open}>
        <div className="flex items-center gap-3">
          <span className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-[14px] font-semibold text-white">{provider.name}</h3>
              <span className="text-[11px] text-slate-600">{provider.country}</span>
              {configured && !status?.enabled && (
                <span className="rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-slate-700/40 text-slate-400 border border-slate-600/40">
                  Disabled
                </span>
              )}
              {liveFromEnvironment && !configured && (
                <span className="rounded px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  Live · server key
                </span>
              )}
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5 truncate">
              {!configured && liveFromEnvironment ? (
                <>Working from a key set on the server. Add one here to override it.</>
              ) : configured ? (
                <>
                  <span className="font-mono text-slate-400">{status?.maskedKey}</span>
                  {status?.model && <span className="text-slate-600"> · {status.model}</span>}
                  {status?.useCount ? <span className="text-slate-600"> · {status.useCount} calls</span> : null}
                </>
              ) : (
                provider.role
              )}
            </p>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-600 shrink-0 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 space-y-4 border-t border-[#1e3a5f]/30 pt-4">
          <p className="text-[13px] text-slate-400 leading-relaxed">{provider.role}</p>

          {provider.caution && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[12px] text-amber-200/85 leading-relaxed">{provider.caution}</p>
            </div>
          )}

          {status?.lastTestDetail && (
            <div className={cn("flex items-start gap-2 rounded-lg px-3 py-2 border", status.lastTestOk ? "border-emerald-500/25 bg-emerald-500/[0.05]" : "border-red-500/25 bg-red-500/[0.05]")}>
              {status.lastTestOk ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              )}
              <p className={cn("text-[12px] leading-relaxed", status.lastTestOk ? "text-emerald-200/85" : "text-red-200/85")}>
                {status.lastTestDetail}
                {status.lastTestedAt && (
                  <span className="text-slate-600"> · {new Date(status.lastTestedAt).toLocaleString()}</span>
                )}
              </p>
            </div>
          )}

          {/* Key entry */}
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label className="text-slate-300 text-[13px]">
                {configured ? "Replace API key" : "API key"}
              </Label>
              {provider.consoleUrl && (
                <a
                  href={provider.consoleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-500 hover:text-amber-400 inline-flex items-center gap-1"
                >
                  Get a key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <Input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder={provider.keyHint}
              autoComplete="off"
              spellCheck={false}
              className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
            />
            {shape?.warning && <p className="text-[11px] text-amber-400 leading-relaxed">{shape.warning}</p>}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-[13px]">Model</Label>
              <Input
                value={model}
                onChange={e => setModel(e.target.value)}
                list={`models-${provider.id}`}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white font-mono text-[13px] focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
              <datalist id={`models-${provider.id}`}>
                {provider.suggestedModels.map(m => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300 text-[13px]">Priority</Label>
              <Input
                type="number"
                min={1}
                max={999}
                value={priority}
                onChange={e => setPriority(Number(e.target.value))}
                className="bg-[#111827]/70 border-[#1e3a5f] text-white focus-visible:border-amber-500 focus-visible:ring-amber-500/20"
              />
              <p className="text-[10.5px] text-slate-600">Lower runs first in the chain.</p>
            </div>
          </div>

          <label className="flex items-center gap-2 text-[12.5px] text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={testFirst}
              onChange={e => setTestFirst(e.target.checked)}
              className="accent-amber-500"
            />
            Test the key before saving it
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => setKey.mutate({ providerId: provider.id, apiKey, model, priority, testFirst })}
              disabled={!apiKey || setKey.isPending}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-[#0a0f1a] font-semibold disabled:opacity-40"
            >
              {setKey.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <KeyRound className="w-3.5 h-3.5 mr-1.5" />}
              {configured ? "Rotate key" : "Connect"}
            </Button>

            {configured && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => testKey.mutate({ providerId: provider.id })}
                  disabled={testKey.isPending}
                  className="border-[#1e3a5f] bg-transparent text-slate-400 hover:text-amber-400 hover:border-amber-500/40"
                >
                  {testKey.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Zap className="w-3.5 h-3.5 mr-1.5" />}
                  Test
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateProvider.mutate({ providerId: provider.id, enabled: !status?.enabled })}
                  className="border-[#1e3a5f] bg-transparent text-slate-400 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  {status?.enabled ? "Disable" : "Enable"}
                </Button>

                {model !== status?.model || priority !== status?.priority ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateProvider.mutate({ providerId: provider.id, model, priority })}
                    className="border-amber-500/40 bg-transparent text-amber-400"
                  >
                    Save settings
                  </Button>
                ) : null}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm(`Remove the ${provider.name} key? Calls will fall through to the next provider in the chain.`)) {
                      deleteKey.mutate({ providerId: provider.id });
                    }
                  }}
                  className="ml-auto border-red-500/30 bg-transparent text-red-400/80 hover:text-red-400 hover:border-red-500/50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}

// ─── Audit ───────────────────────────────────────────────────────────────────

function AuditTrail() {
  const { data } = trpc.vault.auditLog.useQuery({ limit: 40 });
  const [open, setOpen] = useState(false);
  if (!data?.length) return null;

  return (
    <section className="rounded-2xl border border-[#1e3a5f]/60 bg-[#0a0f1a]/70 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-5 py-3" aria-expanded={open}>
        <ShieldAlert className="w-4 h-4 text-slate-600" />
        <h2 className="text-sm font-semibold text-white">Vault activity</h2>
        <span className="text-[11px] text-slate-600 ml-1">{data.length} recent events</span>
        <ChevronDown className={cn("w-4 h-4 text-slate-600 ml-auto transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <ul className="divide-y divide-[#1e3a5f]/20 max-h-80 overflow-y-auto">
          {data.map(entry => (
            <li key={entry.id} className="px-5 py-2 flex items-baseline gap-3 text-[12px]">
              <span
                className={cn(
                  "font-medium shrink-0 w-28",
                  entry.action === "unlock_failed" ? "text-red-400" : entry.action.startsWith("key_") ? "text-amber-400" : "text-slate-400",
                )}
              >
                {entry.action.replace(/_/g, " ")}
              </span>
              <span className="text-slate-500 truncate flex-1">
                {entry.providerId && <span className="text-slate-400">{entry.providerId}</span>}
                {entry.detail && <span> {entry.detail}</span>}
              </span>
              <span className="text-slate-700 shrink-0">{new Date(entry.createdAt).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ─── Shared ──────────────────────────────────────────────────────────────────

function Banner({
  tone,
  title,
  children,
}: {
  tone: "error" | "warn" | "info";
  title: string;
  children: React.ReactNode;
}) {
  const styles = {
    error: { box: "border-red-500/35 bg-red-500/[0.07]", text: "text-red-300", icon: XCircle },
    warn: { box: "border-amber-500/30 bg-amber-500/[0.06]", text: "text-amber-300", icon: AlertTriangle },
    info: { box: "border-[#1e3a5f]/60 bg-[#0a0f1a]/70", text: "text-slate-300", icon: AlertTriangle },
  }[tone];
  const Icon = styles.icon;

  return (
    <div className={cn("rounded-xl border p-4", styles.box)}>
      <div className="flex items-start gap-3">
        <Icon className={cn("w-4 h-4 shrink-0 mt-0.5", styles.text)} />
        <div className="space-y-1">
          <h3 className={cn("text-[13.5px] font-semibold", styles.text)}>{title}</h3>
          <div className="text-[13px] text-slate-300 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}
