// ============================================================
// CONTAINER MEMORY — how much RAM this box is allowed. Railway and Docker
// expose the cgroup limit; a laptop exposes none. The data sweeps (Zillow's
// CSVs, BLS's state workbooks) need room, so the automatic first pass after
// boot runs only when the box has it; the owner's button always works and
// the log says why an automatic pass was skipped.
// ============================================================
import { readFileSync } from "node:fs";
import { totalmem } from "node:os";

/** Bytes the container may use: cgroup v2, then v1, then the host's total. */
export function containerMemoryBytes(): number {
  for (const p of ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"]) {
    try {
      const raw = readFileSync(p, "utf8").trim();
      if (raw && raw !== "max") { const n = Number(raw); if (Number.isFinite(n) && n > 0 && n < 2 ** 60) return n; }
    } catch { /* not this cgroup version */ }
  }
  return totalmem();
}

/** Automatic sweeps ask for this much; below it they wait for the owner's button. Override with SWEEP_MIN_MEMORY_MB. */
export function sweepAllowed(env: NodeJS.ProcessEnv = process.env, needMb = 1536): { ok: boolean; haveMb: number; needMb: number } {
  const need = Number(env.SWEEP_MIN_MEMORY_MB ?? needMb);
  const haveMb = Math.round(containerMemoryBytes() / 1_048_576);
  return { ok: haveMb >= need, haveMb, needMb: need };
}
