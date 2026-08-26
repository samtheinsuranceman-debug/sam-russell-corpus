// Minimal browser globals so client-only components render under node for
// the full-site audit. The real app is client-rendered; this is audit-only.
const storage = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, String(v)),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: (i: number) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
};
const w: any = globalThis as any;
w.window = w;
w.self = w;
w.localStorage = storage();
w.sessionStorage = storage();
try { if (!w.navigator) w.navigator = { userAgent: "audit", language: "en-US", languages: ["en-US"] }; } catch { /* node exposes a read-only navigator; it suffices */ }
w.matchMedia = w.matchMedia ?? ((q: string) => ({ matches: false, media: q, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }));
w.addEventListener = w.addEventListener ?? (() => {});
w.removeEventListener = w.removeEventListener ?? (() => {});
w.innerWidth = 1280;
w.innerHeight = 800;
w.devicePixelRatio = 1;
w.scrollTo = () => {};
w.requestAnimationFrame = w.requestAnimationFrame ?? ((cb: any) => setTimeout(cb, 0));
w.cancelAnimationFrame = w.cancelAnimationFrame ?? clearTimeout;
w.location = w.location ?? { href: "https://www.joinaqal.com/", origin: "https://www.joinaqal.com", pathname: "/", search: "", hash: "", hostname: "www.joinaqal.com" };
w.IntersectionObserver = w.IntersectionObserver ?? class { observe() {} unobserve() {} disconnect() {} };
w.ResizeObserver = w.ResizeObserver ?? class { observe() {} unobserve() {} disconnect() {} };
w.getComputedStyle = w.getComputedStyle ?? (() => ({ getPropertyValue: () => "" }));
export {};
