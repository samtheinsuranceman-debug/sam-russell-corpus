import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Nav reachability.
 *
 * The 2026-09-19 audit found 160 of 330 routes registered in App.tsx with no
 * entry in the sidebar — built, routed, tested, and unreachable. Half the site
 * was invisible, and the only reason anyone knew is that somebody counted.
 *
 * This test is the counting, made permanent. A page added to App.tsx without a
 * menu entry fails here, so the site cannot silently grow a second invisible
 * half.
 */

const root = resolve(__dirname, '..');
const appSrc = readFileSync(resolve(root, 'client/src/App.tsx'), 'utf8');
const navSrc = readFileSync(resolve(root, 'client/src/components/AppShell.tsx'), 'utf8');

function matchAll(src: string, re: RegExp): string[] {
  const out: string[] = [];
  let m = re.exec(src);
  while (m !== null) {
    out.push(m[1]);
    m = re.exec(src);
  }
  return out;
}

/** Every route registered in the router. */
const routes = matchAll(appSrc, /path="([^"]+)"/g);

/**
 * Every path the sidebar links to.
 *
 * Scoped to the NAV_SECTIONS block deliberately. AppShell also declares a short
 * mobile bar that repeats a handful of top-level destinations, and counting
 * those would report false duplicates.
 */
const navStart = navSrc.indexOf('const NAV_SECTIONS: NavSection[] = [');
const navEnd = navSrc.indexOf('\n];', navStart);
const navBlock = navSrc.slice(navStart, navEnd);
const navPaths = matchAll(navBlock, /path:\s*"([^"]+)"/g);

/**
 * Public and auth pages live outside the portal sidebar by design — a logged
 * out visitor has no sidebar. Listed explicitly so the exemption is a decision
 * rather than a hole.
 */
const OUTSIDE_SIDEBAR = [
  '/', '/404', '/login', '/register', '/pricing', '/privacy', '/terms', '/support',
  '/trial', '/invite', '/forgot-password', '/reset-password', '/for', '/onboarding',
  '/administrator', '/executive', '/fact-finder', '/calculators', '/ultra-calculator',
];

const portalRoutes = routes.filter((r) => r.indexOf(':') === -1 && OUTSIDE_SIDEBAR.indexOf(r) === -1);
const navSet: Record<string, boolean> = {};
for (const p of navPaths) navSet[p] = true;

describe('every page the router serves is reachable from the menu', () => {
  it('parses a sane number of routes and nav links', () => {
    expect(routes.length).toBeGreaterThan(300);
    expect(navPaths.length).toBeGreaterThan(280);
  });

  it('leaves no route stranded without a menu entry', () => {
    const stranded = portalRoutes.filter((r) => !navSet[r]);
    expect(
      stranded,
      `${stranded.length} route(s) have no menu entry. Add them to NAV_SECTIONS in ` +
        `AppShell.tsx, or to OUTSIDE_SIDEBAR here if they are genuinely public:\n  ` +
        stranded.join('\n  '),
    ).toEqual([]);
  });

  it('has no menu link pointing at a route that does not exist', () => {
    const routeSet: Record<string, boolean> = {};
    for (const r of routes) routeSet[r] = true;
    const dead = navPaths.filter((p) => !routeSet[p]);
    expect(dead, `menu links with no route (these 404):\n  ${dead.join('\n  ')}`).toEqual([]);
  });

  it('links each page exactly once, so the menu has no duplicate entries', () => {
    const seen: Record<string, number> = {};
    for (const p of navPaths) seen[p] = (seen[p] || 0) + 1;
    const dupes = Object.keys(seen).filter((p) => seen[p] > 1);
    expect(dupes, `paths appearing more than once in the menu:\n  ${dupes.join('\n  ')}`).toEqual([]);
  });

  it('the exemption list is real — every entry is an actual route', () => {
    const routeSet: Record<string, boolean> = {};
    for (const r of routes) routeSet[r] = true;
    for (const p of OUTSIDE_SIDEBAR) {
      expect(routeSet[p], `${p} is exempted from the sidebar but is not a route`).toBe(true);
    }
  });
});

describe('the menu is structured rather than flat', () => {
  const sectionLabels = matchAll(navBlock, /^\s{4}label:\s*"([^"]+)",$/gm);
  const subLabels = matchAll(navBlock, /subLabel:\s*"([^"]+)"/g);

  it('has a manageable number of top-level sections', () => {
    expect(sectionLabels.length).toBeGreaterThan(5);
    expect(sectionLabels.length).toBeLessThanOrEqual(12);
  });

  it('uses subgroups, so a large section does not render as one flat list', () => {
    // The audit found four sections over 20 items with no nesting available.
    expect(subLabels.length).toBeGreaterThanOrEqual(15);
  });

  it('dropped the section names nobody could identify', () => {
    for (const dead of ['Secondary Information', 'New Client Welcome List']) {
      expect(sectionLabels.indexOf(dead), `"${dead}" is back as a top-level section`).toBe(-1);
    }
  });

  it('every subgroup name is a noun phrase, not a number', () => {
    for (const s of subLabels) {
      expect(s.length, s).toBeGreaterThan(2);
      expect(/^\d/.test(s), `subgroup "${s}" starts with a digit`).toBe(false);
    }
  });
});

describe('the menu can be searched', () => {
  it('renders a search input wired to a filter', () => {
    expect(navSrc).toMatch(/navQuery/);
    expect(navSrc).toMatch(/filteredSections/);
    expect(navSrc).toMatch(/aria-label="Search the menu"/);
  });

  it('the filter matches item, subgroup and section labels', () => {
    expect(navSrc).toMatch(/sg\.subLabel\.toLowerCase\(\)\.includes\(q\)/);
    expect(navSrc).toMatch(/section\.label\.toLowerCase\(\)\.includes\(q\)/);
  });

  it('renders the sections through the filter, not the raw list', () => {
    expect(navSrc).toMatch(/\) : filteredSections\.map\(/);
  });
});
