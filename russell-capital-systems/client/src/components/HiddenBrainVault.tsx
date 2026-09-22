/**
 * Hidden Brain Vault — the folder at the bottom of every tab, owner only.
 *
 * Renders nothing for anyone but the owner. For the owner it is a faint dot
 * under "Sign out". Tap it and the sixteen-word key is asked for; the right
 * key unlocks the vault for twenty minutes and opens the Brain Hub, where the
 * forty brains and forty MCP servers are keyed.
 *
 * The first time, there is no key yet. The dot mints one — sixteen words
 * shown once, four rows of four — and the owner writes them down. They are
 * never shown again and never stored anywhere in plaintext.
 *
 * Nothing secret ever reaches this component: the server answers "owner or
 * not", "locked or unlocked", and counts. Keys and tokens stay on the server.
 */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Copy, KeyRound, Lock, Unlock, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { vaultKeyShapeProblem } from "@shared/vaultKey";

export default function HiddenBrainVault() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [entry, setEntry] = useState("");
  const [minted, setMinted] = useState<string[] | null>(null);

  const whoami = trpc.vault.whoami.useQuery(undefined, { retry: false, staleTime: 5 * 60_000 });
  const isOwner = whoami.data?.owner === true;

  const overview = trpc.vault.overview.useQuery(undefined, { enabled: isOwner && open, retry: false });
  const utils = trpc.useUtils();

  const unlock = trpc.vault.unlock.useMutation({
    onSuccess: () => {
      toast.success("Vault unlocked for twenty minutes.");
      setEntry("");
      void utils.vault.overview.invalidate();
      navigate("/portal/brain-hub");
    },
    onError: e => toast.error(e.message),
  });
  const lock = trpc.vault.lock.useMutation({
    onSuccess: () => {
      toast.success("Vault locked.");
      void utils.vault.overview.invalidate();
    },
  });
  const initialize = trpc.vault.initializeKey.useMutation({
    onSuccess: r => {
      setMinted(r.rows);
      void utils.vault.overview.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  // Never leave the panel open on a route change.
  const [location] = useLocation();
  useEffect(() => {
    setOpen(false);
  }, [location]);

  if (!isOwner) return null;

  const access = overview.data?.access;
  const limits = overview.data?.limits;
  const shape = entry ? vaultKeyShapeProblem(entry) : null;

  return (
    <div className="mt-2">
      {/* The dot. Nearly invisible until hovered — this is meant to be found, not advertised. */}
      <button
        type="button"
        aria-label="Brain vault"
        onClick={() => setOpen(v => !v)}
        className="block mx-auto w-4 h-4 rounded-full opacity-25 hover:opacity-100 focus:opacity-100 transition-opacity text-[#c9a227] focus:outline-none"
      >
        <span className="block w-1.5 h-1.5 mx-auto rounded-full bg-current" />
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-[#c9a227]/40 bg-[#0b1526] p-3 text-[11px] text-[#dbe4f0] shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-[#c9a227]">
              <KeyRound size={12} />
              Brain vault
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="opacity-60 hover:opacity-100">
              <X size={12} />
            </button>
          </div>

          {overview.isLoading && <div className="text-[#7a95b8]">Checking the vault…</div>}

          {overview.data && !overview.data.vault.ready && (
            <div className="text-amber-300 leading-snug">
              The server has no <code>RCS_VAULT_KEY</code>. Set one on Railway, then come back. Brains keyed as environment variables still work.
            </div>
          )}

          {minted && (
            <div className="mb-2">
              <div className="text-amber-300 font-semibold mb-1">Your sixteen-word key. Write it down. It is not shown again.</div>
              <div className="font-mono text-[10px] leading-relaxed bg-black/40 rounded p-2 space-y-0.5">
                {minted.map((row, i) => (
                  <div key={i}>{row}</div>
                ))}
              </div>
              <button
                type="button"
                className="mt-1 inline-flex items-center gap-1 text-[#c9a227] hover:underline"
                onClick={() => {
                  void navigator.clipboard?.writeText(minted.join(" ").replace(/\s+/g, " "));
                  toast.success("Key copied. Paste it somewhere safe, then clear the clipboard.");
                }}
              >
                <Copy size={10} /> Copy once
              </button>
            </div>
          )}

          {overview.data && overview.data.vault.ready && access && !access.configured && !minted && (
            <div>
              <p className="text-[#7a95b8] mb-2 leading-snug">No key exists yet. Mint the sixteen words now; you will see them once.</p>
              <button
                type="button"
                disabled={initialize.isPending}
                onClick={() => initialize.mutate()}
                className="w-full rounded bg-[#c9a227] text-black font-semibold py-1.5 disabled:opacity-50"
              >
                {initialize.isPending ? "Minting…" : "Mint the key"}
              </button>
            </div>
          )}

          {access?.configured && !access.unlocked && (
            <form
              onSubmit={e => {
                e.preventDefault();
                if (shape) return toast.error(shape);
                unlock.mutate({ passphrase: entry });
              }}
            >
              <textarea
                value={entry}
                onChange={e => setEntry(e.target.value)}
                rows={3}
                placeholder="sixteen words, any order of case or spacing"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded bg-black/40 border border-[#12233e] p-2 font-mono text-[10px] text-white placeholder:text-[#4b5f7d]"
              />
              {shape && entry && <div className="text-amber-300 mt-1 leading-snug">{shape}</div>}
              {access.lockedOut && <div className="text-red-300 mt-1">Locked after too many attempts. Try later.</div>}
              <button
                type="submit"
                disabled={unlock.isPending || access.lockedOut}
                className="mt-2 w-full inline-flex items-center justify-center gap-1 rounded bg-[#c9a227] text-black font-semibold py-1.5 disabled:opacity-50"
              >
                <Unlock size={11} /> {unlock.isPending ? "Checking…" : "Unlock"}
              </button>
              <div className="text-[#4b5f7d] mt-1">{access.attemptsRemaining} attempts remaining</div>
            </form>
          )}

          {access?.unlocked && (
            <div>
              <div className="text-emerald-300 mb-1">Unlocked · {Math.ceil(access.expiresInMs / 60000)} min left</div>
              {limits && (
                <div className="text-[#7a95b8] mb-2">
                  Brains {limits.brainsKeyed + limits.brainsFromEnvironment}/{limits.maxBrains} · MCP {limits.mcpConfigured}/{limits.maxMcp}
                </div>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => navigate("/portal/brain-hub")}
                  className="flex-1 rounded bg-[#c9a227] text-black font-semibold py-1.5"
                >
                  Open Brain Hub
                </button>
                <button
                  type="button"
                  onClick={() => lock.mutate()}
                  aria-label="Lock"
                  className="rounded border border-[#12233e] px-2 hover:bg-white/5"
                >
                  <Lock size={11} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
