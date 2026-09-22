/**
 * Local persistence for the DSM-5 intake.
 *
 * The intake is public — a visitor can complete it before signing in and before
 * any database exists. Server persistence is an enhancement layered on top:
 * when `assessment.start` succeeds the answers go to the database too, but the
 * intake must never depend on it. It previously did, and a failed start left the
 * form unsubmittable with "Assessment session not found".
 *
 * Everything here is best-effort. Storage can be unavailable (private window,
 * blocked site data) or full, so every call is wrapped and every read tolerates
 * absent or corrupt data by returning null.
 */

import type { IntakeResult } from "@shared/intake/scoring";

const DRAFT_KEY = "drbuddy.intake.draft.v1";
const RESULT_KEY = "drbuddy.intake.result.v1";

export interface IntakeDraft {
  answers: Record<string, string>;
  currentIndex: number;
  /** Epoch ms of the last write, so a stale draft can be aged out. */
  updatedAt: number;
}

export interface StoredIntakeResult {
  id: string;
  result: IntakeResult;
  answers: Record<string, string>;
  completedAt: number;
  /** Server report id, when the assessment also persisted server-side. */
  serverReportId?: number | string;
}

/** Drafts older than this are discarded rather than silently resumed. */
export const DRAFT_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nothing to do */
  }
}

// ─── Draft ────────────────────────────────────────────────────────────────────

export function saveDraft(answers: Record<string, string>, currentIndex: number): boolean {
  return write(DRAFT_KEY, { answers, currentIndex, updatedAt: Date.now() } satisfies IntakeDraft);
}

/** The saved draft, or null when there is none, it is stale, or it is unreadable. */
export function loadDraft(): IntakeDraft | null {
  const draft = read<IntakeDraft>(DRAFT_KEY);
  if (!draft || typeof draft !== "object") return null;
  if (!draft.answers || typeof draft.answers !== "object") return null;
  if (typeof draft.updatedAt !== "number") return null;
  if (Date.now() - draft.updatedAt > DRAFT_MAX_AGE_MS) {
    remove(DRAFT_KEY);
    return null;
  }
  return {
    answers: draft.answers,
    currentIndex: typeof draft.currentIndex === "number" ? draft.currentIndex : 0,
    updatedAt: draft.updatedAt,
  };
}

export function clearDraft(): void {
  remove(DRAFT_KEY);
}

// ─── Completed result ─────────────────────────────────────────────────────────

/** Stable id for a locally-scored result, used in the report URL. */
export function localResultId(): string {
  return `local-${Date.now().toString(36)}`;
}

export function saveLocalResult(stored: StoredIntakeResult): boolean {
  return write(RESULT_KEY, stored);
}

export function loadLocalResult(id?: string): StoredIntakeResult | null {
  const stored = read<StoredIntakeResult>(RESULT_KEY);
  if (!stored || !stored.result) return null;
  if (id && stored.id !== id) return null;
  return stored;
}

export function clearLocalResult(): void {
  remove(RESULT_KEY);
}

/** True when the browser will actually retain what we write. */
export function storageAvailable(): boolean {
  try {
    const probe = "__drbuddy_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}
