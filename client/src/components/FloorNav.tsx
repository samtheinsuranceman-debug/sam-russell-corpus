/**
 * The four-floor navigation: Body, Wound, Work, Talk.
 *
 * Replaces the left rail when the nav flag is on (localStorage `nav=floors`,
 * `?nav=floors` once, or VITE_NAV_FLOORS=on at build). Off by default, so
 * production is unchanged until the owner flips it.
 *
 *   - The stairs: four words, always visible. The floor you are on reads
 *     1.25x larger. Desktop: in the top bar. Phone: a bottom bar.
 *   - The floor panel: at most seven short links, the advisor doors on Work
 *     only, and "All tools".
 *   - All tools: a command-palette index of the whole floor (or every floor),
 *     searchable, so no page the rail reached is lost.
 *
 * Keyboard: the stairs are a tab list (Left/Right/Home/End). The index is a
 * dialog with a combobox (Up/Down/Enter/Escape) and a focus trap, and focus
 * returns to the button that opened it. See shared/floors.ts for the data.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ComponentType, type KeyboardEvent, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, X } from "lucide-react";
import {
  ACTIVE_WORD_SCALE,
  ADVISOR_DOORS,
  FLOORS,
  FLOOR_BLURB,
  FLOOR_FEATURED,
  NAV_MODE_EVENT,
  NAV_MODE_KEY,
  floorForLocation,
  floorOf,
  matchesQuery,
  resolveNavMode,
  type FloorId,
  type NavEntry,
} from "@shared/floors";

export type FloorNavEntry = NavEntry & { icon?: ComponentType<{ size?: number; className?: string }> };
export type NavMode = "floors" | "classic";

/* ─── The flag ────────────────────────────────────────────────────────────── */

function readStoredMode(): string | null {
  try {
    return localStorage.getItem(NAV_MODE_KEY);
  } catch {
    return null; // private mode or blocked storage: fall back to the env flag
  }
}

function envFlag(): string | undefined {
  return import.meta.env.VITE_NAV_FLOORS as string | undefined;
}

/** Switch the nav for this browser. "classic" is an explicit opt-out, even when the env flag is on. */
export function setNavMode(mode: NavMode) {
  try {
    localStorage.setItem(NAV_MODE_KEY, mode);
  } catch {
    /* storage blocked: the switch lasts until reload */
  }
  window.dispatchEvent(new Event(NAV_MODE_EVENT));
}

/** Current nav mode; re-reads when the switch changes in this tab or another. */
export function useNavMode(): NavMode {
  const [mode, setMode] = useState<NavMode>(() => resolveNavMode(readStoredMode(), envFlag()));
  useEffect(() => {
    // A shared preview link: ?nav=floors or ?nav=classic sets the switch once.
    try {
      const q = new URLSearchParams(window.location.search).get("nav");
      if (q === "floors" || q === "classic") setNavMode(q);
    } catch {
      /* no URL API: ignore */
    }
    const sync = () => setMode(resolveNavMode(readStoredMode(), envFlag()));
    window.addEventListener(NAV_MODE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(NAV_MODE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return mode;
}

/* ─── Floor state ─────────────────────────────────────────────────────────── */

export type FloorNavState = {
  entries: readonly FloorNavEntry[];
  location: string;
  /** The floor the current page is on, if it is on one. */
  current: FloorId | null;
  /** The floor whose panel is showing. */
  selected: FloorId;
  select: (f: FloorId) => void;
  indexOpen: boolean;
  openIndex: (trigger?: HTMLElement | null) => void;
  closeIndex: () => void;
};

export function useFloorNav(entries: readonly FloorNavEntry[]): FloorNavState {
  const [location] = useLocation();
  const current = useMemo(() => floorForLocation(location, entries), [location, entries]);
  const [selected, setSelected] = useState<FloorId>(current ?? "Body");
  const [indexOpen, setIndexOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  // Moving to a page moves the stairs to that page's floor.
  useEffect(() => {
    if (current) setSelected(current);
  }, [current]);

  const openIndex = useCallback((trigger?: HTMLElement | null) => {
    triggerRef.current = trigger ?? (document.activeElement as HTMLElement | null);
    setIndexOpen(true);
  }, []);
  const closeIndex = useCallback(() => {
    setIndexOpen(false);
    const t = triggerRef.current;
    if (t && typeof t.focus === "function") window.setTimeout(() => t.focus(), 0);
  }, []);

  return { entries, location, current, selected, select: setSelected, indexOpen, openIndex, closeIndex };
}

function isCurrentPath(location: string, path: string) {
  return location === path || (path !== "/portal" && location.startsWith(`${path}/`));
}

/* ─── The stairs (desktop, in the top bar) ────────────────────────────────── */

const PANEL_ID = "rc-floor-panel";
const tabId = (f: FloorId) => `rc-floor-tab-${f}`;

export function FloorStairs({ state }: { state: FloorNavState }) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next = -1;
    if (e.key === "ArrowRight") next = (i + 1) % FLOORS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + FLOORS.length) % FLOORS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = FLOORS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const f = FLOORS[next];
    state.select(f);
    refs.current[f]?.focus();
  };
  return (
    <nav aria-label="Floors" className="rc-stairs-wrap">
      <div role="tablist" aria-label="Floors" className="rc-stairs" style={{ ["--rc-stair-scale" as string]: String(ACTIVE_WORD_SCALE) }}>
        {FLOORS.map((f, i) => {
          const selected = state.selected === f;
          return (
            <button
              key={f}
              ref={(el) => { refs.current[f] = el; }}
              type="button"
              role="tab"
              id={tabId(f)}
              aria-selected={selected}
              aria-controls={PANEL_ID}
              aria-current={state.current === f ? "location" : undefined}
              tabIndex={selected ? 0 : -1}
              data-active={selected ? "true" : undefined}
              className="rc-stair"
              title={FLOOR_BLURB[f]}
              onClick={() => state.select(f)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              {f}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ─── The floor's links ───────────────────────────────────────────────────── */

function FloorLinks({ floor, location, onNavigate }: { floor: FloorId; location: string; onNavigate?: () => void }) {
  return (
    <ul className="rc-floor-links">
      {FLOOR_FEATURED[floor].map((l) => {
        const here = isCurrentPath(location, l.path);
        return (
          <li key={l.path}>
            <Link href={l.path} onClick={onNavigate} aria-current={here ? "page" : undefined} className="rc-floor-link" data-active={here ? "true" : undefined}>
              {l.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Clients, pipeline, presentations, AI assist. Rendered on Work only. */
function AdvisorDoors({ location, onNavigate }: { location: string; onNavigate?: () => void }) {
  const inside = ADVISOR_DOORS.some((d) => isCurrentPath(location, d.path));
  const [open, setOpen] = useState(inside);
  const listId = useId();
  useEffect(() => {
    if (inside) setOpen(true);
  }, [inside]);
  return (
    <div className="rc-floor-doors">
      <button type="button" className="rc-floor-link rc-floor-doors-toggle" aria-expanded={open} aria-controls={listId} onClick={() => setOpen((o) => !o)}>
        Advisor doors
      </button>
      <ul id={listId} hidden={!open} className="rc-floor-links rc-floor-doors-list" aria-label="Advisor doors">
        {ADVISOR_DOORS.map((d) => {
          const here = isCurrentPath(location, d.path);
          return (
            <li key={d.path}>
              <Link href={d.path} onClick={onNavigate} aria-current={here ? "page" : undefined} className="rc-floor-link" data-active={here ? "true" : undefined}>
                {d.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function AllToolsButton({ state, floor }: { state: FloorNavState; floor: FloorId }) {
  const count = useMemo(() => state.entries.filter((e) => floorOf(e) === floor).length, [state.entries, floor]);
  return (
    <button type="button" className="rc-floor-all" aria-haspopup="dialog" onClick={(e) => state.openIndex(e.currentTarget)}>
      <Search size={13} aria-hidden="true" />
      All tools <span className="rc-floor-count">{count}</span>
    </button>
  );
}

/** The panel under the top bar on desktop. */
export function FloorPanel({ state, utilities }: { state: FloorNavState; utilities?: ReactNode }) {
  const floor = state.selected;
  return (
    <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(floor)} className="rc-floor-panel">
      <span className="sr-only">{FLOOR_BLURB[floor]}</span>
      <FloorLinks floor={floor} location={state.location} />
      {floor === "Work" && <AdvisorDoors location={state.location} />}
      <AllToolsButton state={state} floor={floor} />
      {utilities && <div className="rc-floor-utilities">{utilities}</div>}
    </div>
  );
}

/* ─── Phone: the four words at the bottom, and a sheet per floor ──────────── */

export function FloorBottomBar({ state, utilities }: { state: FloorNavState; utilities?: ReactNode }) {
  const [sheet, setSheet] = useState<FloorId | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const close = useCallback(() => {
    setSheet((s) => {
      if (s) window.setTimeout(() => buttonRefs.current[s]?.focus(), 0);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!sheet) return;
    sheetRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheet, close]);

  // Navigating closes the sheet.
  useEffect(() => {
    setSheet(null);
  }, [state.location]);

  return (
    <>
      {sheet && <div className="rc-floor-sheet-scrim" aria-hidden="true" onClick={close} />}
      {sheet && (
        <div ref={sheetRef} id="rc-floor-sheet" role="dialog" aria-modal="false" aria-label={`${sheet}: ${FLOOR_BLURB[sheet]}`} className="rc-floor-sheet">
          <div className="rc-floor-sheet-head">
            <span className="rc-floor-sheet-title">{sheet}</span>
            <button type="button" className="rc-floor-icon-btn" aria-label="Close" onClick={close}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <FloorLinks floor={sheet} location={state.location} onNavigate={() => setSheet(null)} />
          {sheet === "Work" && <AdvisorDoors location={state.location} onNavigate={() => setSheet(null)} />}
          <AllToolsButton state={state} floor={sheet} />
          {utilities && <div className="rc-floor-utilities">{utilities}</div>}
        </div>
      )}
      <nav aria-label="Floors" className="rc-floors-bottom">
        {FLOORS.map((f) => {
          const active = state.selected === f;
          return (
            <button
              key={f}
              ref={(el) => { buttonRefs.current[f] = el; }}
              type="button"
              className="rc-floor-bottom-word"
              data-active={active ? "true" : undefined}
              aria-current={state.current === f ? "location" : undefined}
              aria-expanded={sheet === f}
              aria-controls="rc-floor-sheet"
              onClick={() => {
                state.select(f);
                setSheet((s) => (s === f ? null : f));
              }}
            >
              {f}
            </button>
          );
        })}
      </nav>
    </>
  );
}

/* ─── All tools: the per-floor index, command-palette style ───────────────── */

type Group = { key: string; floor: FloorId; items: FloorNavEntry[] };

export function FloorIndex({ state }: { state: FloorNavState }) {
  const [, navigate] = useLocation();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<"floor" | "all">("floor");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();
  const floor = state.selected;

  useEffect(() => {
    if (!state.indexOpen) return;
    setQuery("");
    setScope("floor");
    setActive(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [state.indexOpen]);

  const results = useMemo(
    () => state.entries.filter((e) => (scope === "all" || floorOf(e) === floor) && matchesQuery(e, query)),
    [state.entries, scope, floor, query],
  );

  const groups = useMemo(() => {
    const out: Group[] = [];
    const byKey = new Map<string, Group>();
    for (const e of results) {
      const f = floorOf(e);
      const key = `${scope === "all" ? `${f} · ` : ""}${e.section}${e.subLabel ? ` / ${e.subLabel}` : ""}`;
      let g = byKey.get(key);
      if (!g) {
        g = { key, floor: f, items: [] };
        byKey.set(key, g);
        out.push(g);
      }
      g.items.push(e);
    }
    return out;
  }, [results, scope]);

  // Options in on-screen order, so the arrow keys follow what is shown.
  const ordered = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => {
    setActive(0);
  }, [query, scope]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!state.indexOpen) return null;

  const optionId = (i: number) => `${baseId}-opt-${i}`;
  const go = (path: string) => {
    state.closeIndex();
    navigate(path);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(ordered.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && ordered[active]) {
      e.preventDefault();
      go(ordered[active].path);
    }
  };

  // Keep Tab inside the dialog; Escape closes it.
  const onDialogKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      state.closeIndex();
      return;
    }
    if (e.key !== "Tab" || !dialogRef.current) return;
    const focusables = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])'),
    ).filter((el) => !el.hasAttribute("disabled"));
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const titleId = `${baseId}-title`;
  const listId = `${baseId}-list`;
  let n = -1;

  return (
    <div className="rc-floor-index-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) state.closeIndex(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="rc-floor-index" onKeyDown={onDialogKey}>
        <div className="rc-floor-index-head">
          <h2 id={titleId} className="rc-floor-index-title">
            {scope === "all" ? "Every floor" : `${floor}: all tools`}
          </h2>
          <button type="button" className="rc-floor-icon-btn" aria-label="Close" onClick={state.closeIndex}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="rc-floor-index-search">
          <Search size={14} aria-hidden="true" className="rc-floor-index-search-icon" />
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={ordered[active] ? optionId(active) : undefined}
            aria-label={scope === "all" ? "Search every floor" : `Search the ${floor} floor`}
            placeholder={scope === "all" ? "Search every floor" : `Search ${floor}`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            className="rc-floor-index-input"
          />
        </div>
        <div className="rc-floor-index-scope" role="group" aria-label="Where to search">
          <button type="button" aria-pressed={scope === "floor"} className="rc-floor-chip" onClick={() => setScope("floor")}>
            {floor}
          </button>
          <button type="button" aria-pressed={scope === "all"} className="rc-floor-chip" onClick={() => setScope("all")}>
            All floors
          </button>
          <span className="rc-floor-index-count" aria-live="polite">
            {results.length === 0 ? "No pages match" : `${results.length} page${results.length === 1 ? "" : "s"}`}
          </span>
        </div>
        <ul ref={listRef} id={listId} role="listbox" aria-label="Pages" className="rc-floor-index-list">
          {groups.map((g) => (
            <li key={g.key} role="presentation">
              <div className="rc-floor-index-group" aria-hidden="true">{g.key}</div>
              <ul role="group" aria-label={g.key}>
                {g.items.map((e) => {
                  n += 1;
                  const i = n;
                  const here = isCurrentPath(state.location, e.path);
                  return (
                    <li
                      key={e.path}
                      id={optionId(i)}
                      role="option"
                      aria-selected={i === active}
                      aria-current={here ? "page" : undefined}
                      data-index={i}
                      data-active={i === active ? "true" : undefined}
                      className="rc-floor-index-option"
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(e.path)}
                    >
                      <span className="rc-floor-index-label">{e.label}</span>
                      <span className="rc-floor-index-path">{e.path}</span>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
