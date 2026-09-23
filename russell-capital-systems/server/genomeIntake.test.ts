/**
 * Wealth Genome intake, first build — acceptance tests AT10 and AT11 from
 * RCS-FIRST-LOGIN-MANAGER.json, plus the rules around them: the flag, consent
 * before any personal question, permission per cluster, skip means skip,
 * retention by class (mind destroyed, money kept in the household file), the
 * legal hold, the crisis stop, the map keeping tendencies only, and the map
 * never feeding a recommendation.
 *
 * Everything runs against the in-memory store; the MySQL store implements
 * the same interface (server/genomeIntakeDb.ts).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { TRPCError } from "@trpc/server";
import {
  ALL_QUESTIONS,
  CLOSE_LINE,
  CONSENT_VERSION,
  GUIDES,
  MIND_QUESTIONS,
  MONEY_QUESTIONS,
  PERMISSION_LINES,
  PROFILE_SECTION,
  RAW_ANSWER_MAX_AGE_MS,
  RAW_ANSWER_TTL_MS,
  buildGenomeMap,
  buildIntakeScript,
  consentLines,
  consentSnapshot,
  effectiveRetention,
  genomeLinesForAdvisor,
  intakeCopy,
  parseRetentionOverrides,
  type RawAnswer,
} from "@shared/genomeIntake";
import { createMemoryStore, runGenomeRawSweep, setGenomeStoreForTests, type GenomeIntakeStore } from "./genomeIntakeDb";
import {
  acceptAssetUrl,
  assertOwnHousehold,
  closeSession,
  coldStartConfig,
  consentIsCurrent,
  decideCluster,
  endSession,
  intakeAccess,
  putAnswer,
  readMap,
  recordConsent,
  reflectCluster,
  setLegalHold,
  withdrawConsent,
  type Access,
  type Viewer,
} from "./genomeIntake";
import { genomeIntakeRouter } from "./genomeIntakeRouter";
import { assertCleanCopy } from "@shared/copyGuard";

const APP = path.resolve(__dirname, "..");
const OWNER: Viewer = { id: 1, role: "admin" };
const ALICE: Viewer = { id: 101, role: "user" };
const BOB: Viewer = { id: 202, role: "user" };
const ACCESS: Access = { live: true, eligible: true, preview: false };
const ACKS = { adult18Plus: true, notDiagnosis: true, destroyKeep: true };
const T0 = new Date("2026-09-23T15:00:00Z");
const later = (ms: number) => new Date(T0.getTime() + ms);

let store: GenomeIntakeStore;
beforeEach(() => { store = createMemoryStore(); });

async function consented(v: Viewer = ALICE) {
  const { sessionId } = await recordConsent(store, v, ACCESS, CONSENT_VERSION, ACKS, T0);
  return sessionId;
}

const choice = (questionId: string, choiceId: string, note?: string): RawAnswer => ({ questionId, kind: "choice", choiceId, ...(note ? { note } : {}) });
const amount = (questionId: string, n: number, period: "year" | "month" = "year"): RawAnswer => ({ questionId, kind: "amount", amount: n, period });

/** Consent, both clusters accepted, every question answered. */
async function fullRun(v: Viewer = ALICE) {
  const id = await consented(v);
  await decideCluster(store, v, id, "mind", "accepted", T0);
  await putAnswer(store, v, id, choice("mind.tired", "drift", "When I am wiped out I stop opening the statements."), T0);
  await putAnswer(store, v, id, choice("mind.works", "raise"), T0);
  await putAnswer(store, v, id, choice("mind.fight", "wheel"), T0);
  await putAnswer(store, v, id, choice("mind.badly", "busy"), T0);
  await putAnswer(store, v, id, choice("mind.calm", "sometimes"), T0);
  await decideCluster(store, v, id, "money", "accepted", T0);
  await putAnswer(store, v, id, amount("money.income", 347_250), T0);
  await putAnswer(store, v, id, amount("money.expenses", 14_600, "month"), T0);
  await putAnswer(store, v, id, choice("money.w2", "both"), T0);
  await putAnswer(store, v, id, amount("money.taxes", 81_300), T0);
  return id;
}

// ─── The flag ─────────────────────────────────────────────────────────────

describe("GENOME_INTAKE_LIVE — off by default; owner preview only", () => {
  it("off: consumers are not eligible, the owner runs it as a preview", () => {
    expect(intakeAccess(ALICE, {})).toEqual({ live: false, eligible: false, preview: false });
    expect(intakeAccess(OWNER, {})).toEqual({ live: false, eligible: true, preview: true });
    expect(intakeAccess(null, {})).toMatchObject({ eligible: false });
  });

  it("on: every signed-in consumer, no preview badge", () => {
    for (const v of ["1", "true", "on"]) expect(intakeAccess(ALICE, { GENOME_INTAKE_LIVE: v })).toEqual({ live: true, eligible: true, preview: false });
    expect(intakeAccess(ALICE, { GENOME_INTAKE_LIVE: "0" }).eligible).toBe(false);
  });

  it("a consumer sees no cold start while the flag is off: no stills, no greeting", async () => {
    const env = { FIRST_LOGIN_STILL_MOUNTAIN_URL: "/files/first-login/mountain.webp" };
    const c = await coldStartConfig(ALICE, async () => null, env);
    expect(c).toMatchObject({ eligible: false, preview: false, stills: {}, greeting: null });
    const o = await coldStartConfig(OWNER, async () => null, env);
    expect(o).toMatchObject({ eligible: true, preview: true, stills: { STILL_MOUNTAIN: "/files/first-login/mountain.webp" } });
  });

  it("the router refuses a consumer before counsel's review", async () => {
    const prev = process.env.GENOME_INTAKE_LIVE;
    delete process.env.GENOME_INTAKE_LIVE;
    setGenomeStoreForTests(store);
    try {
      const caller = genomeIntakeRouter.createCaller({ user: ALICE, req: {}, res: {} } as never);
      await expect(caller.consent({ consentVersion: CONSENT_VERSION, acks: ACKS })).rejects.toMatchObject({ code: "FORBIDDEN" });
      const owner = genomeIntakeRouter.createCaller({ user: OWNER, req: {}, res: {} } as never);
      await expect(owner.consent({ consentVersion: CONSENT_VERSION, acks: ACKS })).resolves.toMatchObject({ consentVersion: CONSENT_VERSION });
    } finally {
      setGenomeStoreForTests(null);
      if (prev === undefined) delete process.env.GENOME_INTAKE_LIVE; else process.env.GENOME_INTAKE_LIVE = prev;
    }
  });
});

describe("Cold-start configuration", () => {
  it("stills come from the firm's /files/ storage or https; anything else is ignored, never replaced", async () => {
    expect(acceptAssetUrl("/files/first-login/dinner.webp")).toBe("/files/first-login/dinner.webp");
    expect(acceptAssetUrl("https://cdn.example.org/a.jpg")).toBe("https://cdn.example.org/a.jpg");
    for (const bad of ["http://x/a.jpg", "javascript:alert(1)", "/files/../secret", "", "data:image/png;base64,AA"]) expect(acceptAssetUrl(bad)).toBeNull();
    const c = await coldStartConfig(OWNER, async () => null, { FIRST_LOGIN_STILL_DINNER_URL: "ftp://nope" });
    expect(c.stills).toEqual({});
  });

  it("an owner setting beats the environment; the greeting is configurable", async () => {
    const settings: Record<string, string> = { "firstLogin.still_wedding_url": "/files/w.webp", "firstLogin.greeting": "Good evening." };
    const c = await coldStartConfig(OWNER, async (k) => settings[k] ?? null, { FIRST_LOGIN_STILL_WEDDING_URL: "/files/env.webp", FIRST_LOGIN_GREETING: "Env hello." });
    expect(c.stills.STILL_WEDDING).toBe("/files/w.webp");
    expect(c.greeting).toBe("Good evening.");
    const d = await coldStartConfig(OWNER, async () => null, { FIRST_LOGIN_GREETING: "Env hello." });
    expect(d.greeting).toBe("Env hello.");
  });

  it("Book a review always has somewhere to go", async () => {
    expect((await coldStartConfig(ALICE, async () => null, {})).bookingUrl).toBe("/support");
    expect((await coldStartConfig(ALICE, async () => null, { CALENDLY_URL: "https://calendly.com/x" })).bookingUrl).toBe("https://calendly.com/x");
  });
});

// ─── Consent ──────────────────────────────────────────────────────────────

describe("Consent before any health-like question (buddy_lock)", () => {
  it("records time, version, the exact text and each acknowledgement", async () => {
    const id = await consented();
    const s = (await store.getSession(id))!;
    expect(s).toMatchObject({ userId: ALICE.id, consentVersion: CONSENT_VERSION, adult18Plus: true, ackNotDiagnosis: true, ackDestroyKeep: true, withdrawnAt: null });
    expect(s.consentedAt).toEqual(T0);
    expect(s.consentTextSnapshot).toBe(consentSnapshot());
    expect(consentIsCurrent(s)).toBe(true);
  });

  it("every acknowledgement is required, and a stale version is refused", async () => {
    await expect(recordConsent(store, ALICE, ACCESS, CONSENT_VERSION, { ...ACKS, adult18Plus: false }, T0)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(recordConsent(store, ALICE, ACCESS, "genome-consent-old", ACKS, T0)).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("no question can be answered without a consent session", async () => {
    await expect(putAnswer(store, ALICE, 999, choice("mind.tired", "drift"), T0)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(decideCluster(store, ALICE, 999, "mind", "accepted", T0)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("a consent whose text no longer matches stops the flow", async () => {
    const id = await consented();
    const s = (await store.getSession(id))!;
    expect(consentIsCurrent({ ...s, consentTextSnapshot: `${s.consentTextSnapshot} (edited)` })).toBe(false);
    expect(consentIsCurrent({ ...s, withdrawnAt: T0 })).toBe(false);
  });

  it("the consent text is pinned to its version: change one, change both", () => {
    const sha = createHash("sha256").update(consentSnapshot()).digest("hex").slice(0, 16);
    expect({ version: CONSENT_VERSION, sha }).toEqual({ version: "genome-consent-2026-09-23.6", sha: expect.stringMatching(/^[0-9a-f]{16}$/) });
    expect(PINNED[CONSENT_VERSION], `consent text changed: bump CONSENT_VERSION and pin its new hash (${sha})`).toBe(sha);
  });

  it("says, in plain words, what the regulators asked for", () => {
    const text = consentLines().join(" ");
    expect(text).toContain("optional and you can revoke it");
    expect(text).toContain("licensed insurance agent to discuss insurance and annuity options");
    expect(text).toContain("We destroy your answers about how you think and feel. Financial facts you give us are kept in your household file so any recommendation can be checked later.");
    expect(text).toContain("Kept in your household file: approximate income, approximate expenses, W-2 or not, approximate taxes last year.");
    expect(text).toMatch(/Destroyed at the end: how you handle money when tired/);
    expect(text).toContain("not medical or mental-health care");
    expect(text).toContain("AI guides: software, not people");
    expect(text).toContain("not a diagnosis");
    expect(text).toContain("legal hold");
    expect(text).toContain("no product or strategy recommendation is based on it");
    expect(text).not.toMatch(/\d\s*%\s*(per|a)\s*year/i);
  });
});

/** Version → first 16 hex of sha256(consent snapshot). Edit the text, bump the version, pin the new hash. */
const PINNED: Record<string, string> = {
  "genome-consent-2026-09-23.6": "cd76db719095e474",
};

// ─── Permission, interleave, skip ─────────────────────────────────────────

describe("Permission every cluster; mind then money; skip means skip", () => {
  it("the permission lines are the spec's, word for word", () => {
    expect(PERMISSION_LINES.mind).toBe("May I ask a few questions about how your mind and energy work under pressure? You can skip any item. Raw answers are destroyed when we finish. We keep only the map.");
    expect(PERMISSION_LINES.money).toBe("May I ask a financial question? Approximate numbers are enough.");
    expect(CLOSE_LINE).toBe("We are going to destroy the raw answers now. What remains is your wealth genome.");
  });

  it("the script interleaves: permission, questions, reflection — mind first, then money — then the close", () => {
    const script = buildIntakeScript();
    const kinds = script.map((s) => (s.kind === "question" ? `q:${s.cluster}` : s.kind === "close" ? "close" : `${s.kind}:${s.cluster}`));
    expect(kinds[0]).toBe("permission:mind");
    expect(kinds.indexOf("reflection:mind")).toBeLessThan(kinds.indexOf("permission:money"));
    expect(kinds[kinds.length - 1]).toBe("close");
    expect(kinds.filter((k) => k === "q:mind")).toHaveLength(MIND_QUESTIONS.length);
    expect(kinds.filter((k) => k === "q:money")).toHaveLength(4);
    expect(MIND_QUESTIONS.map((q) => q.prompt).slice(0, 4)).toEqual([
      "When you are tired, do you tighten control of money or let it drift?",
      "When something works, do you raise the bet or lock the gain?",
      "Who do you become in a fight about money with the person you love?",
      "When a case or a market goes badly, do you go quiet, go busy, or go to someone?",
    ]);
    expect(MONEY_QUESTIONS.map((q) => q.prompt)).toEqual([
      "Approximate household income, year or month?",
      "Approximate household expenses?",
      "W-2 or not?",
      "Approximate taxes last year?",
    ]);
  });

  it("control 71: no question asks for a name, so no spouse's name can ever be used", () => {
    for (const q of ALL_QUESTIONS) expect(`${q.prompt} ${"preface" in q ? q.preface ?? "" : ""}`).not.toMatch(/\bname\b/i);
  });

  it("every step has a speaker, alternating John and Judy from the start", () => {
    const script = buildIntakeScript();
    expect(script.slice(0, 4).map((s) => s.speaker)).toEqual(["john", "judy", "john", "judy"]);
    for (const s of script) expect(GUIDES[s.speaker].label).toBe("AI guide");
  });

  it("money cannot be asked before the mind cluster is answered or declined", async () => {
    const id = await consented();
    await expect(decideCluster(store, ALICE, id, "money", "accepted", T0)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("no answer without that cluster's permission", async () => {
    const id = await consented();
    await expect(putAnswer(store, ALICE, id, choice("mind.tired", "drift"), T0)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("declining a cluster marks that limb unknown and argues no further", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "declined", T0);
    await decideCluster(store, ALICE, id, "money", "accepted", T0);
    await putAnswer(store, ALICE, id, amount("money.income", 120_000), T0);
    const { line } = await reflectCluster(store, ALICE, id, "mind", T0);
    expect(line).toContain("stays unknown");
    const { map } = await closeSession(store, ALICE, id, T0);
    expect(map.limbs).toEqual({ mind: "unknown", money: "mapped" });
    expect(map.axes.every((a) => a.lean === "unknown")).toBe(true);
  });

  it("a skipped item keeps nothing, and removes an earlier raw answer to it", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "accepted", T0);
    await putAnswer(store, ALICE, id, choice("mind.tired", "drift"), T0);
    expect(await store.listRaw(id)).toHaveLength(1);
    await expect(putAnswer(store, ALICE, id, { questionId: "mind.tired", skip: true }, T0)).resolves.toMatchObject({ stored: false, skipped: true });
    expect(await store.listRaw(id)).toHaveLength(0);
  });
});

// ─── Retention by class ───────────────────────────────────────────────────

describe("Retention by class: mind destroyed, money kept in the household file", () => {
  it("each question carries its class; defaults are mind=destroy, money=profile", () => {
    for (const q of ALL_QUESTIONS) expect(q.retention).toBe(q.cluster === "mind" ? "destroy" : "profile");
  });

  it("counsel can move an item by configuration, and the consent text follows", () => {
    const o = parseRetentionOverrides("money.taxes=destroy, mind.nope=profile, money.w2=keep");
    expect(o).toEqual({ "money.taxes": "destroy" });
    expect(effectiveRetention("money.taxes", o)).toBe("destroy");
    expect(consentLines(o).join(" ")).toMatch(/Destroyed at the end: [^.]*approximate taxes last year/);
    expect(consentSnapshot(o)).not.toBe(consentSnapshot());
  });

  it("money answers go to the fact-finder, never to the raw table; mind answers go to the raw table only", async () => {
    await fullRun();
    const raw = await store.listRaw(1);
    expect(raw.map((r) => r.questionId).sort()).toEqual(MIND_QUESTIONS.map((q) => q.id).sort());
    const kept = await store.listProfileAnswers(ALICE.id);
    expect(kept.map((k) => k.answer.questionId).sort()).toEqual(MONEY_QUESTIONS.map((q) => q.id).sort());
    expect(kept.find((k) => k.answer.questionId === "money.income")!.answer).toMatchObject({ amount: 347_250, period: "year" });
    expect(PROFILE_SECTION).toBe("genomeIntake");
  });
});

// ─── AT11 ─────────────────────────────────────────────────────────────────

describe("AT11 — raw genome answers are deleted: at close, and by the scheduled sweep", () => {
  it("close writes the map and leaves no raw row behind; the money facts stay in the household file", async () => {
    const id = await fullRun();
    expect(await store.countRaw()).toBe(MIND_QUESTIONS.length);
    const r = await closeSession(store, ALICE, id, later(60_000));
    expect(r.rawDeleted).toBe(MIND_QUESTIONS.length);
    expect(await store.countRaw()).toBe(0);
    expect(await store.listRaw(id)).toEqual([]);
    expect((await store.listProfileAnswers(ALICE.id)).length).toBe(4);
    expect((await store.getSession(id))!.status).toBe("closed");
  });

  it("an abandoned session's raw answers are deleted by the sweep once they expire", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "accepted", T0);
    await putAnswer(store, ALICE, id, choice("mind.tired", "tighten"), T0);
    await putAnswer(store, ALICE, id, choice("mind.works", "lock"), T0);
    expect(await runGenomeRawSweep(store, later(RAW_ANSWER_TTL_MS - 1000))).toEqual({ rawDeleted: 0, sessionsAbandoned: 0 });
    expect(await store.countRaw()).toBe(2);
    expect(await runGenomeRawSweep(store, later(RAW_ANSWER_TTL_MS + 1000))).toEqual({ rawDeleted: 2, sessionsAbandoned: 1 });
    expect(await store.countRaw()).toBe(0);
    expect((await store.getSession(id))!.status).toBe("abandoned");
    await expect(closeSession(store, ALICE, id, later(RAW_ANSWER_TTL_MS + 2000))).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("the sweep also enforces a 24-hour ceiling, whatever a row's expiry says", async () => {
    const id = await consented();
    await store.putRaw({ sessionId: id, userId: ALICE.id, answer: choice("mind.badly", "quiet"), expiresAt: new Date(Date.now() + 10 * RAW_ANSWER_MAX_AGE_MS), legalHold: false });
    expect(await store.countRaw()).toBe(1);
    await runGenomeRawSweep(store, new Date(Date.now() + RAW_ANSWER_MAX_AGE_MS + 60_000));
    expect(await store.countRaw()).toBe(0);
  });

  it("'Session done' deletes the raw answers at once and writes no map", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "accepted", T0);
    await putAnswer(store, ALICE, id, choice("mind.tired", "tighten"), T0);
    expect(await endSession(store, ALICE, id, T0)).toEqual({ rawDeleted: 1 });
    expect(await store.countRaw()).toBe(0);
    expect(await store.getMap(ALICE.id)).toBeNull();
  });

  it("declining a cluster after answering it deletes what was said in it", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "accepted", T0);
    await putAnswer(store, ALICE, id, choice("mind.tired", "tighten"), T0);
    await decideCluster(store, ALICE, id, "mind", "declined", T0);
    expect(await store.countRaw()).toBe(0);
  });

  it("a legal hold suspends deletion — at close and in the sweep — until released", async () => {
    const id = await fullRun();
    await setLegalHold(store, ALICE.id, true);
    await putAnswer(store, ALICE, id, choice("mind.calm", "calm"), T0); // written while held
    const r = await closeSession(store, ALICE, id, later(60_000));
    expect(r.rawDeleted).toBe(0);
    await runGenomeRawSweep(store, later(RAW_ANSWER_MAX_AGE_MS * 2));
    expect(await store.countRaw()).toBe(MIND_QUESTIONS.length);
    await setLegalHold(store, ALICE.id, false);
    await runGenomeRawSweep(store, later(RAW_ANSWER_MAX_AGE_MS * 2));
    expect(await store.countRaw()).toBe(0);
  });

  it("the sweep is scheduled in the process and reachable from cron, behind CRON_SECRET", () => {
    const index = readFileSync(path.join(APP, "server/_core/index.ts"), "utf8");
    expect(index).toContain("startGenomeRawSweep()");
    expect(index).toContain('app.get("/api/cron/genome-raw-sweep"');
    expect(index.indexOf('app.use("/api/cron", cronGuard)')).toBeLessThan(index.indexOf("/api/cron/genome-raw-sweep"));
  });
});

// ─── AT10 ─────────────────────────────────────────────────────────────────

describe("AT10 — a consumer cannot query another household", () => {
  it("the household guard: own id yes, another id no, the owner may review", () => {
    expect(() => assertOwnHousehold(ALICE, ALICE.id)).not.toThrow();
    expect(() => assertOwnHousehold(ALICE, BOB.id)).toThrow(TRPCError);
    expect(() => assertOwnHousehold(OWNER, BOB.id)).not.toThrow();
  });

  it("another household's session is invisible: every call on it is NOT_FOUND", async () => {
    const bobs = await fullRun(BOB);
    for (const call of [
      () => putAnswer(store, ALICE, bobs, choice("mind.tired", "drift"), T0),
      () => decideCluster(store, ALICE, bobs, "mind", "declined", T0),
      () => reflectCluster(store, ALICE, bobs, "mind", T0),
      () => closeSession(store, ALICE, bobs, T0),
      () => endSession(store, ALICE, bobs, T0),
    ]) await expect(call()).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await store.countRaw()).toBe(MIND_QUESTIONS.length);
  });

  it("another household's map is refused to a consumer, server side", async () => {
    await closeSession(store, BOB, await fullRun(BOB), T0);
    await expect(readMap(store, ALICE, BOB.id)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await readMap(store, ALICE, ALICE.id)).toBeNull();
    expect(await readMap(store, OWNER, BOB.id)).not.toBeNull();
  });

  it("through the router: mapFor is owner-only, myMap returns only one's own", async () => {
    const prev = process.env.GENOME_INTAKE_LIVE;
    process.env.GENOME_INTAKE_LIVE = "1";
    setGenomeStoreForTests(store);
    try {
      await closeSession(store, BOB, await fullRun(BOB), T0);
      const alice = genomeIntakeRouter.createCaller({ user: ALICE, req: {}, res: {} } as never);
      await expect(alice.mapFor({ userId: BOB.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(await alice.myMap()).toBeNull();
      const bob = genomeIntakeRouter.createCaller({ user: BOB, req: {}, res: {} } as never);
      expect((await bob.myMap())?.map.limbs).toEqual({ mind: "mapped", money: "mapped" });
      const owner = genomeIntakeRouter.createCaller({ user: OWNER, req: {}, res: {} } as never);
      expect(await owner.mapFor({ userId: BOB.id })).not.toBeNull();
      await expect(alice.legalHold({ userId: BOB.id, hold: true })).rejects.toMatchObject({ code: "FORBIDDEN" });
    } finally {
      setGenomeStoreForTests(null);
      if (prev === undefined) delete process.env.GENOME_INTAKE_LIVE; else process.env.GENOME_INTAKE_LIVE = prev;
    }
  });
});

// ─── The map keeps tendencies only ────────────────────────────────────────

describe("The map: tendencies and bands; no quotes, no numbers as typed, no labels", () => {
  it("reads the pattern axes and bands, deterministically", async () => {
    const { map, reflections } = await closeSession(store, ALICE, await fullRun(), T0);
    expect(map.axes).toEqual([
      { axis: "control_drift", lean: "mixed" },
      { axis: "solo_shared", lean: "solo" },
      { axis: "freeze_act", lean: "act" },
      { axis: "excite_lock", lean: "excite" },
    ]);
    expect(map.money).toEqual({ incomeBand: "i2", expenseBand: "e2", taxBand: "t2", w2: "both" });
    expect(reflections.mind).toMatch(/^So the pattern I am hearing is: /);
    expect(reflections.money).toBe("So the picture, approximately: income in the $250k–$500k band; expenses in the $120k–$250k band; some W-2 and some not; and taxes last year in the $75k–$150k band.");
    const again = buildGenomeMap(
      [choice("mind.tired", "drift"), choice("mind.works", "raise"), choice("mind.fight", "wheel"), choice("mind.badly", "busy"), choice("mind.calm", "sometimes"),
        amount("money.income", 347_250), amount("money.expenses", 14_600, "month"), choice("money.w2", "both"), amount("money.taxes", 81_300)],
      { mind: "accepted", money: "accepted" }, CONSENT_VERSION, T0);
    expect(again.axes).toEqual(map.axes);
    expect(again.money).toEqual(map.money);
  });

  it("never contains a typed note, an exact figure, or a condition word", async () => {
    const { map, reflections } = await closeSession(store, ALICE, await fullRun(), T0);
    const advisor = genomeLinesForAdvisor(map);
    const text = JSON.stringify({ map, reflections, advisor });
    for (const leak of ["statements", "wiped out", "347250", "347,250", "14600", "81300", "81,300"]) expect(text).not.toContain(leak);
    // The kept data itself carries no condition word at all…
    expect(JSON.stringify({ map, reflections })).not.toMatch(/\b(anxious|anxiety|depress\w*|bipolar|adhd|disorder|diagnos\w*|medication|meds)\b/i);
    // …and what the advisor reads only ever says what it is NOT.
    expect(() => assertCleanCopy(advisor, "advisor lines")).not.toThrow();
  });

  it("uses the site's durability engine, as stated evidence", async () => {
    const { map } = await closeSession(store, ALICE, await fullRun(), T0);
    expect(Object.keys(map.durability).sort()).toEqual(["cognitive", "emotional", "income", "relational"]);
    expect(map.notObserved.join(" ")).toContain("Behaviour in a real drawdown");
  });

  it("withdrawal deletes the map; the household file keeps the financial facts", async () => {
    await closeSession(store, ALICE, await fullRun(), T0);
    expect(await withdrawConsent(store, ALICE, T0)).toMatchObject({ mapDeleted: true });
    expect(await store.getMap(ALICE.id)).toBeNull();
    expect((await store.listProfileAnswers(ALICE.id)).length).toBe(4);
  });
});

// ─── Crisis ───────────────────────────────────────────────────────────────

describe("Crisis stop: a disclosure ends the intake and deletes what was said", () => {
  it("the note is never stored; every raw answer of the session is deleted; the session ends", async () => {
    const id = await consented();
    await decideCluster(store, ALICE, id, "mind", "accepted", T0);
    await putAnswer(store, ALICE, id, choice("mind.tired", "drift"), T0);
    const r = await putAnswer(store, ALICE, id, choice("mind.works", "lock", "Honestly some days I want to die."), T0);
    expect(r).toEqual({ stored: false, crisis: true });
    expect(await store.countRaw()).toBe(0);
    expect((await store.getSession(id))!.status).toBe("abandoned");
    await expect(putAnswer(store, ALICE, id, choice("mind.badly", "quiet"), T0)).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });

  it("the page screens typed text before it leaves the browser, and shows 988", () => {
    const page = readFileSync(path.join(APP, "client/src/pages/portal/GenomeIntake.tsx"), "utf8");
    expect(page).toContain("screenForCrisis(typed).stop");
    expect(page).toContain("CRISIS_LIFELINE.phone");
    expect(page).toContain("CRISIS_FOOTER");
  });
});

// ─── Not a recommendation engine; not a game ──────────────────────────────

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) { if (name !== "node_modules") out.push(...sourceFiles(full)); }
    else if (/\.(tsx?|mjs)$/.test(name) && !/\.test\.ts$/.test(name)) out.push(full);
  }
  return out;
}

describe("The map is context only: no engine or recommendation reads it", () => {
  const ALLOWED = new Set([
    "shared/genomeIntake.ts",
    "server/genomeIntake.ts", "server/genomeIntakeDb.ts", "server/genomeIntakeRouter.ts", "server/routers.ts", "server/_core/index.ts",
    // The advisor conversation reads the household's own map as background, and is told not to recommend from it.
    "server/thomasGoldmanRouter.ts",
    // Display only.
    "client/src/pages/portal/GenomeIntake.tsx", "client/src/pages/WealthGenomePage.tsx", "client/src/components/genome/GenomeMapPanel.tsx",
    "client/src/components/firstLogin/ColdStartOverlay.tsx",
  ]);

  it("only the intake, its storage, the advisor's context and the display pages touch the map or the raw answers", () => {
    const offenders: string[] = [];
    for (const f of [...sourceFiles(path.join(APP, "server")), ...sourceFiles(path.join(APP, "shared")), ...sourceFiles(path.join(APP, "client/src"))]) {
      const rel = path.relative(APP, f).split(path.sep).join("/");
      const src = readFileSync(f, "utf8");
      const touches = /genomeIntake(Db)?["']|@shared\/genomeIntake["']|genome_raw_answers|genome_maps|genomeMaps\b|genomeRawAnswers\b/.test(src);
      if (touches && !ALLOWED.has(rel) && rel !== "drizzle/schema.ts") offenders.push(rel);
    }
    expect(offenders, "a file outside the allow-list reads the genome map or raw answers — engines and recommendations must not").toEqual([]);
  });

  it("the advisor is told it is context, not a basis for recommendations", () => {
    const src = readFileSync(path.join(APP, "server/thomasGoldmanRouter.ts"), "utf8");
    expect(src).toContain("Do not base any product or strategy recommendation on it.");
    expect(src).toContain("readMap(genomeStore(), ctx.user, ctx.user.id)");
  });

  it("no points, streaks, coins or loot anywhere in the flow", () => {
    const files = [
      "shared/genomeIntake.ts", "shared/firstLoginColdStart.ts", "server/genomeIntake.ts", "server/genomeIntakeRouter.ts", "server/genomeIntakeDb.ts",
      "client/src/pages/portal/GenomeIntake.tsx", "client/src/components/firstLogin/ColdStartOverlay.tsx", "client/src/components/genome/GenomeMapPanel.tsx",
    ];
    for (const f of files) {
      const code = readFileSync(path.join(APP, f), "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
      expect(code, f).not.toMatch(/\b(xp|awardXp|addXp|coins|streaks?|loot|gamification|useGamification|achievement)\b/i);
    }
  });

  it("the copy on every intake screen is in the copy list the guard checks", () => {
    expect(intakeCopy().length).toBeGreaterThan(40);
  });
});
