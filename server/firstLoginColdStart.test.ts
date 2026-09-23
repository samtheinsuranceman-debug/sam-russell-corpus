/**
 * First-login cold start — acceptance tests from RCS-FIRST-LOGIN-MANAGER.json
 * (AT01–AT05, AT08, AT12), as amended by the perception review (opaque 1.0 s
 * readable hold, gentle constant-velocity approach) and the regulatory review
 * (the ask is made once; missed or shut, a quiet "Start here" link stays).
 *
 * The overlay only samples shared/firstLoginColdStart.ts, so the behaviour is
 * proved here on the pure functions, plus source scans of the component.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import {
  APPROACH_RAMP,
  DEFAULT_GREETING,
  HOUSE_COLORS,
  MOTION_CURVES,
  PLATE_BEAT,
  PLATE_CLICK_TARGET,
  PLATE_LINES,
  PLATE_MAX_WORDS,
  REDUCED_MOTION_CROSSFADE_S,
  STILL_BEATS,
  STILL_READABLE_HOLD_S,
  VECTION,
  arrivalsAfterMiss,
  buildColdStartTimeline,
  coldStartAllowedOn,
  gentleProgress,
  initialRecycleState,
  isObject,
  objectsOnScreen,
  passEnd,
  plateRetired,
  readableWindow,
  recycleReducer,
  samplePass,
  showStartHereLink,
  timelineEndS,
  type ObjectPass,
  type StillId,
} from "@shared/firstLoginColdStart";
import { CALCULATORS } from "@shared/calculatorCatalog";

const APP = path.resolve(__dirname, "..");
const ALL: ReadonlySet<StillId> = new Set(["STILL_MOUNTAIN", "STILL_DINNER", "STILL_WEDDING"]);
const objects = (reducedMotion = false, available: ReadonlySet<StillId> = ALL) =>
  buildColdStartTimeline({ available, reducedMotion, coin: () => true }).filter(isObject);
const plateOf = (os: ObjectPass[]) => os.find((o) => o.asset === "PLATE_START_HERE")!;
const stillsOf = (os: ObjectPass[]) => os.filter((o) => o.asset !== "PLATE_START_HERE");

describe("AT01 — cold start plays mountain, dinner, wedding, plate in order", () => {
  it("in spec order at 4 s, 8 s, 12 s, 16 s", () => {
    const os = objects();
    expect(os.map((o) => o.asset)).toEqual(["STILL_MOUNTAIN", "STILL_DINNER", "STILL_WEDDING", "PLATE_START_HERE"]);
    expect(os.map((o) => o.atS)).toEqual([4, 8, 12, 16]);
  });

  it("opens on the greeting and the household line, as captions", () => {
    const lines = buildColdStartTimeline({ available: ALL, reducedMotion: false }).filter((e) => e.kind === "line");
    expect(lines).toEqual([
      { kind: "line", atS: 0.2, text: DEFAULT_GREETING },
      { kind: "line", atS: 0.4, text: "This is the household." },
    ]);
    const custom = buildColdStartTimeline({ available: ALL, reducedMotion: false, greeting: "Hello there." });
    expect(custom[0]).toMatchObject({ text: "Hello there." });
  });

  it("a missing still is skipped, never substituted; the plate still comes at 16 s", () => {
    const os = objects(false, new Set<StillId>(["STILL_DINNER"]));
    expect(os.map((o) => o.asset)).toEqual(["STILL_DINNER", "PLATE_START_HERE"]);
    expect(plateOf(os).atS).toBe(16);
    expect(objects(false, new Set()).map((o) => o.asset)).toEqual(["PLATE_START_HERE"]);
  });

  it("never more than two objects on screen, and never two asks at once (VR05)", () => {
    const os = objects();
    for (let t = 0; t <= timelineEndS(os) + 0.5; t += 0.05) {
      const on = objectsOnScreen(os, t);
      expect(on.length).toBeLessThanOrEqual(VECTION.maxObjectsOnScreen);
      expect(on.filter((o) => o.asset === "PLATE_START_HERE").length).toBeLessThanOrEqual(1);
    }
  });

  it("the whole pass ends inside the 45 s continuous-flow cap", () => {
    expect(timelineEndS(objects())).toBeLessThan(VECTION.restAfterS);
  });

  it("stills enter from a side (coin flip); the plate always comes down the centre", () => {
    const os = buildColdStartTimeline({ available: ALL, reducedMotion: false, coin: () => false }).filter(isObject);
    expect(stillsOf(os).every((o) => o.entrySide === "right")).toBe(true);
    expect(plateOf(os).entrySide).toBe("center");
  });

  it("the greeting names no one: the default is generic and any other greeting comes from configuration", () => {
    expect(DEFAULT_GREETING).toBe("Hi. Welcome home.");
    expect(DEFAULT_GREETING).not.toMatch(/to see [A-Z]/);
    const overlay = readFileSync(path.join(APP, "client/src/components/firstLogin/ColdStartOverlay.tsx"), "utf8");
    expect(overlay).toContain("greeting: cfg.data?.greeting ?? undefined");
  });
});

describe("AT02 — faces readable before they go to glass", () => {
  it("every still holds fully opaque for one shared readable hold of at least 1.0 s (≥ the spec's 600 ms)", () => {
    expect(STILL_READABLE_HOLD_S).toBeGreaterThanOrEqual(1.0);
    for (const o of stillsOf(objects())) {
      const w = readableWindow(o);
      expect(w.seconds).toBeGreaterThanOrEqual(0.6);
      expect(w.seconds).toBeCloseTo(STILL_READABLE_HOLD_S, 6);
      for (let t = w.startS + 0.001; t < w.endS; t += 0.05) {
        const smp = samplePass(o, t);
        expect(smp.phase).toBe("hold");
        expect(smp.opacity).toBe(1);
      }
    }
  });

  it("glass comes only after the readable window: opacity falls to zero during the exit", () => {
    for (const o of stillsOf(objects())) {
      const w = readableWindow(o);
      expect(samplePass(o, w.endS - 0.01).opacity).toBe(1);
      const exitMid = samplePass(o, w.endS + o.exitS / 2);
      expect(exitMid.phase).toBe("exit");
      expect(exitMid.opacity).toBeLessThan(1);
      expect(samplePass(o, passEnd(o) + 0.01).opacity).toBe(0);
    }
  });
});

describe("AT03 — the plate is larger than the stills and holds 1.4 s opaque", () => {
  it("peaks at 1.15, above every still at any moment of its pass", () => {
    const os = objects();
    const plate = plateOf(os);
    const stillMax = Math.max(...stillsOf(os).map((o) => Math.max(...o.scale)));
    expect(plate.scale[1]).toBe(1.15);
    expect(plate.scale[1]).toBeGreaterThan(stillMax);
  });

  it("holds fully opaque for 1.4 s", () => {
    const plate = plateOf(objects());
    expect(plate.holdS).toBe(1.4);
    const start = plate.atS + plate.approachS;
    for (let t = start + 0.001; t < start + 1.4; t += 0.05) expect(samplePass(plate, t)).toMatchObject({ phase: "hold", opacity: 1, scale: 1.15 });
  });

  it("carries at most six words, so it can be read in the hold; it works as text with no art", () => {
    const words = PLATE_LINES.join(" ").split(/\s+/).filter(Boolean);
    expect(words.length).toBeLessThanOrEqual(PLATE_MAX_WORDS);
    expect(PLATE_LINES[0]).toBe("START HERE");
    const overlay = readFileSync(path.join(APP, "client/src/components/firstLogin/ColdStartOverlay.tsx"), "utf8");
    expect(overlay).toContain("{PLATE_LINES[0]}");
  });
});

describe("AT04 (amended) — the ask is made once; missed or shut, a quiet link stays", () => {
  it("one plate per session in the timeline", () => {
    expect(objects().filter((o) => o.asset === "PLATE_START_HERE")).toHaveLength(1);
  });

  it("a miss retires the plate: nothing flies back, and the Start here link shows", () => {
    const s = recycleReducer(initialRecycleState(), { type: "plate_missed" });
    expect(plateRetired(s)).toBe(true);
    expect(arrivalsAfterMiss(s)).toEqual([]);
    expect(showStartHereLink(s)).toBe(true);
  });

  it("shutting it (VR03) does the same; taking it shows no link", () => {
    const shut = recycleReducer(initialRecycleState(), { type: "dismiss" });
    expect(plateRetired(shut)).toBe(true);
    expect(showStartHereLink(shut)).toBe(true);
    const taken = recycleReducer(initialRecycleState(), { type: "plate_clicked" });
    expect(showStartHereLink(taken)).toBe(false);
  });

  it("no random return schedule anywhere in the recycle code", () => {
    const src = readFileSync(path.join(APP, "shared/firstLoginColdStart.ts"), "utf8");
    expect(src).not.toMatch(/Math\.random/);
  });
});

describe("AT05 — a click on the plate opens consent, not an engine", () => {
  it("goes to the genome intake", () => {
    expect(PLATE_CLICK_TARGET).toBe("/portal/genome-intake");
  });

  it("which is not a calculator or engine route", () => {
    const engineRoutes = new Set(CALCULATORS.map((c) => c.path));
    expect(engineRoutes.size).toBeGreaterThan(10);
    expect(engineRoutes.has(PLATE_CLICK_TARGET)).toBe(false);
  });

  it("is routed in App.tsx to the intake page, whose first screen is consent", () => {
    const app = readFileSync(path.join(APP, "client/src/App.tsx"), "utf8");
    expect(app).toContain('<Route path="/portal/genome-intake" component={gated(GenomeIntake, "/portal/genome-intake")} />');
    const page = readFileSync(path.join(APP, "client/src/pages/portal/GenomeIntake.tsx"), "utf8");
    expect(page).toContain('useState<Phase>("consent")');
  });

  it("the overlay's plate button opens consent and nothing else", () => {
    const overlay = readFileSync(path.join(APP, "client/src/components/firstLogin/ColdStartOverlay.tsx"), "utf8");
    expect(overlay).toMatch(/onClick=\{openConsent\}/);
    expect(overlay).toMatch(/navigate\(PLATE_CLICK_TARGET\)/);
  });

  it("never plays on the Door or on the intake itself", () => {
    for (const p of ["/login", "/register", "/forgot-password", "/portal/genome-intake"]) expect(coldStartAllowedOn(p)).toBe(false);
    for (const p of ["/", "/portal/dashboard"]) expect(coldStartAllowedOn(p)).toBe(true);
  });
});

describe("AT08 — prefers-reduced-motion kills the scale-through", () => {
  it("no object changes size; stills crossfade 800 ms; the plate sits static in the centre", () => {
    const os = objects(true);
    expect(os.map((o) => o.asset)).toEqual(["STILL_MOUNTAIN", "STILL_DINNER", "STILL_WEDDING", "PLATE_START_HERE"]);
    for (const o of os) {
      expect(new Set(o.scale).size).toBe(1);
      expect(o.entrySide).toBe("center");
      expect(o.approachS).toBe(REDUCED_MOTION_CROSSFADE_S);
      expect(o.exitS).toBe(REDUCED_MOTION_CROSSFADE_S);
      for (let t = o.atS; t <= passEnd(o); t += 0.05) expect(samplePass(o, t).scale).toBe(o.scale[0]);
    }
    expect(REDUCED_MOTION_CROSSFADE_S).toBe(0.8);
  });

  it("the plate is still larger than the stills and still readable", () => {
    const os = objects(true);
    expect(plateOf(os).scale[0]).toBeGreaterThan(Math.max(...stillsOf(os).map((o) => o.scale[0])));
    expect(readableWindow(stillsOf(os)[0]!).seconds).toBeGreaterThanOrEqual(STILL_READABLE_HOLD_S);
  });

  it("filaments are off under reduced motion and after Halt", () => {
    const overlay = readFileSync(path.join(APP, "client/src/components/firstLogin/ColdStartOverlay.tsx"), "utf8");
    expect(overlay).toContain("const reduced = prefersReduced || halted;");
    expect(overlay).toContain("<Filaments running={!reduced} />");
    expect(overlay).toContain("prefers-reduced-motion: reduce");
  });
});

describe("AT12 — no expand–contract oscillation exists in the code", () => {
  it("every motion curve's scale keyframes rise strictly", () => {
    for (const c of Object.values(MOTION_CURVES)) {
      expect(c.scale[1]).toBeGreaterThan(c.scale[0]);
      expect(c.scale[2]).toBeGreaterThan(c.scale[1]);
    }
    for (const b of STILL_BEATS) expect(b.peakScale).toBeGreaterThan(MOTION_CURVES.ghost_through.scale[0]);
    expect(PLATE_BEAT.peakScale).toBeLessThan(MOTION_CURVES.ask_through.scale[2]);
  });

  it("sampled scale never falls, for every object, at 10 ms resolution", () => {
    for (const reduced of [false, true]) {
      for (const o of objects(reduced)) {
        let prev = -Infinity;
        for (let t = o.atS - 0.5; t <= passEnd(o) + 0.5; t += 0.01) {
          const s = samplePass(o, t).scale;
          expect(s).toBeGreaterThanOrEqual(prev - 1e-12);
          prev = s;
        }
      }
    }
  });

  it("the approach is gentle: monotone, constant velocity in the middle, peak speed bounded", () => {
    let prev = 0;
    const cruise = 1 / (1 - APPROACH_RAMP);
    for (let i = 1; i <= 1000; i++) {
      const x = i / 1000;
      const y = gentleProgress(x);
      expect(y).toBeGreaterThanOrEqual(prev);
      const speed = (y - prev) * 1000;
      expect(speed).toBeLessThanOrEqual(cruise + 1e-6);
      if (x > APPROACH_RAMP + 0.01 && x < 1 - APPROACH_RAMP - 0.01) expect(speed).toBeCloseTo(cruise, 3);
      prev = y;
    }
    expect(gentleProgress(0)).toBe(0);
    expect(gentleProgress(1)).toBeCloseTo(1, 12);
  });

  it("no alternating, yo-yo, mirrored or looping scale animation in the first-login code", () => {
    const dir = path.join(APP, "client/src/components/firstLogin");
    const files = [...readdirSync(dir).map((f) => path.join(dir, f)), path.join(APP, "shared/firstLoginColdStart.ts")];
    for (const f of files) {
      const src = readFileSync(f, "utf8").split("\n").filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*")).join("\n");
      expect(src, f).not.toMatch(/\balternate(-reverse)?\b/);
      expect(src, f).not.toMatch(/yoyo|repeatType|mirror/i);
      expect(src, f).not.toMatch(/animation[^;\n]*infinite/i);
      expect(src, f).not.toMatch(/Math\.sin\([^)]*(now|time|t)\b[^)]*\)\s*\*[^;\n]*scale/i);
      expect(src, f).not.toMatch(/@keyframes/);
    }
  });

  it("filaments move outward only, at the spec's peripheral speed", () => {
    const src = readFileSync(path.join(APP, "client/src/components/firstLogin/Filaments.tsx"), "utf8");
    expect(src).toContain("s.r += VECTION.peripheralFilamentSpeedPxS * dt;");
    expect(src).not.toMatch(/s\.r\s*-=/);
    expect(VECTION.peripheralFilamentSpeedPxS).toBe(28);
  });
});

describe("House colours", () => {
  it("cream field and ink as specified; filaments dark enough to see on cream; neutral token names", () => {
    expect(HOUSE_COLORS.field).toBe("#F4EFE6");
    expect(HOUSE_COLORS.ink).toBe("#1C1A17");
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
    };
    const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x! + 0.05) / (y! + 0.05); };
    expect(contrast(HOUSE_COLORS.accentOnDark, HOUSE_COLORS.field)).toBeLessThan(1.3); // why the light mint is not used on cream
    expect(contrast(HOUSE_COLORS.filament, HOUSE_COLORS.field)).toBeGreaterThan(2.5);
    // The pulse marks an edge (a UI boundary), so WCAG 1.4.11's 3:1 for non-text contrast applies.
    expect(contrast(HOUSE_COLORS.accentPulse, HOUSE_COLORS.field)).toBeGreaterThan(3);
    for (const k of Object.keys(HOUSE_COLORS)) expect(k).toMatch(/^(field|ink|filament|accentPulse|accentOnDark)$/);
  });
});
