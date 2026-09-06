// ============================================================
// SEO CATALOGUE — one place that says, for every public page, what its
// title, description and canonical path are, and which paths must never be
// indexed. The server injects these into the HTML it serves (so crawlers see
// them without JavaScript) and the client applies the same values as the
// visitor navigates. Shared so the two can never disagree.
// ============================================================

export const SITE_NAME = "Russell Capital Systems";
export const SITE_TAGLINE = "Financial & Tax Relief and Recovery for Physicians, Psychiatrists, & Surgeons";
export const DEFAULT_DESCRIPTION =
  "Coordinated tax, practice, risk, retirement and legacy planning for physicians and medical practice owners. Every strategy sequenced, every figure sourced.";
/** The image crawlers and social cards show when a page has no better one. */
export const DEFAULT_IMAGE = "/rcs-neon-banner.webp";

export type PublicPage = {
  path: string;
  title: string;
  description: string;
  /** Sitemap priority 0–1; the homepage is 1. */
  priority: number;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  /** Set when the page must be reachable but never indexed (sign-in forms). */
  noindex?: boolean;
  /** Breadcrumb trail below the homepage, for BreadcrumbList structured data. */
  crumbs?: Array<{ name: string; path: string }>;
};

/** Every page a visitor can reach without signing in. Order = sitemap order. */
export const PUBLIC_PAGES: PublicPage[] = [
  { path: "/", title: `${SITE_NAME} — ${SITE_TAGLINE}`, description: DEFAULT_DESCRIPTION, priority: 1, changefreq: "weekly" },
  { path: "/calculators", title: "Physician Financial Calculators", description: "The full catalogue of retirement, tax, mortgage, annuity and estate calculators built for physicians and practice owners. Run any of them free.", priority: 0.9, changefreq: "weekly", crumbs: [{ name: "Calculators", path: "/calculators" }] },
  { path: "/ultra-calculator", title: "Ultra Calculator — one machine for the whole plan", description: "Enter your practice income, debt, savings and goals once and see taxes, retirement income, mortgage payoff and estate exposure computed together.", priority: 0.9, changefreq: "monthly", crumbs: [{ name: "Calculators", path: "/calculators" }, { name: "Ultra Calculator", path: "/ultra-calculator" }] },
  { path: "/fact-finder", title: "Physician Fact Finder — start your plan", description: "A guided discovery form for physicians: income, practice, debt, family and goals. Everything you enter stays in your own profile.", priority: 0.8, changefreq: "monthly", crumbs: [{ name: "Fact Finder", path: "/fact-finder" }] },
  { path: "/pricing", title: "Pricing", description: "Plans for physicians, practice owners and the advisors who serve them. See what every tier includes.", priority: 0.7, changefreq: "monthly", crumbs: [{ name: "Pricing", path: "/pricing" }] },
  { path: "/support", title: "Support", description: "Reach the Russell Capital Systems team, read the help articles, and see how to get started.", priority: 0.5, changefreq: "monthly", crumbs: [{ name: "Support", path: "/support" }] },
  { path: "/privacy", title: "Privacy Policy", description: "How Russell Capital Systems collects, stores, protects and uses your information.", priority: 0.3, changefreq: "yearly", crumbs: [{ name: "Privacy", path: "/privacy" }] },
  { path: "/terms", title: "Terms of Service", description: "The terms that govern use of the Russell Capital Systems platform.", priority: 0.3, changefreq: "yearly", crumbs: [{ name: "Terms", path: "/terms" }] },
  // Reachable, never indexed.
  { path: "/login", title: "Sign in", description: "Sign in to the Russell Capital Systems portal.", priority: 0.1, changefreq: "yearly", noindex: true },
  { path: "/register", title: "Create your account", description: "Create a Russell Capital Systems account.", priority: 0.1, changefreq: "yearly", noindex: true },
  { path: "/forgot-password", title: "Reset your password", description: "Request a password reset link.", priority: 0.1, changefreq: "yearly", noindex: true },
];

/** Path prefixes that are private, tokenised or transactional: robots stay out. */
export const NOINDEX_PREFIXES = [
  "/portal", "/administrator", "/executive", "/onboarding", "/trial", "/invite",
  "/reset-password", "/shared", "/shared-slides", "/video", "/client-portal", "/api", "/404",
];

export function isNoindexPath(path: string): boolean {
  const p = normalizePath(path);
  if (NOINDEX_PREFIXES.some((pre) => p === pre || p.startsWith(`${pre}/`))) return true;
  return PUBLIC_PAGES.some((pg) => pg.path === p && pg.noindex);
}

/** Strips query, hash and trailing slash so `/pricing/?x=1` and `/pricing` agree. */
export function normalizePath(path: string): string {
  const bare = path.split(/[?#]/)[0] || "/";
  const trimmed = bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
  return trimmed || "/";
}

export type PageSeo = {
  path: string;
  title: string;
  description: string;
  robots: "index,follow" | "noindex,nofollow";
  image: string;
  crumbs: Array<{ name: string; path: string }>;
  known: boolean;
};

/** Humanises an unknown path (`/portal/tax-schedule` → "Tax Schedule"). */
function humanize(path: string): string {
  const last = normalizePath(path).split("/").filter(Boolean).pop() ?? "";
  return last.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function seoFor(path: string): PageSeo {
  const p = normalizePath(path);
  const page = PUBLIC_PAGES.find((pg) => pg.path === p);
  if (page) {
    return {
      path: p,
      title: p === "/" ? page.title : `${page.title} | ${SITE_NAME}`,
      description: page.description,
      robots: page.noindex ? "noindex,nofollow" : "index,follow",
      image: DEFAULT_IMAGE,
      crumbs: page.crumbs ?? [],
      known: true,
    };
  }
  const label = humanize(p);
  return {
    path: p,
    title: label ? `${label} | ${SITE_NAME}` : SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    robots: isNoindexPath(p) ? "noindex,nofollow" : "index,follow",
    image: DEFAULT_IMAGE,
    crumbs: [],
    known: false,
  };
}

/** The pages a sitemap lists: public, indexable, no parameters. */
export function sitemapPages(): PublicPage[] {
  return PUBLIC_PAGES.filter((pg) => !pg.noindex);
}

/** Business identity the host may publish (Local SEO). Nothing is invented: every field comes from the environment and is omitted when unset. */
export type BusinessIdentity = {
  name: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  hours?: string;
  areaServed?: string;
  googleBusinessProfile?: string;
  sameAs: string[];
};

export function businessIdentityFrom(env: Record<string, string | undefined>): BusinessIdentity {
  const pick = (k: string) => { const v = env[k]?.trim(); return v ? v : undefined; };
  const sameAs = (env.BUSINESS_SAME_AS ?? "").split(",").map((s) => s.trim()).filter((s) => /^https?:\/\//.test(s));
  const gbp = pick("GOOGLE_BUSINESS_PROFILE_URL");
  return {
    name: pick("BUSINESS_NAME") ?? SITE_NAME,
    phone: pick("BUSINESS_PHONE"),
    email: pick("BUSINESS_EMAIL"),
    street: pick("BUSINESS_STREET"),
    city: pick("BUSINESS_CITY"),
    region: pick("BUSINESS_STATE"),
    postalCode: pick("BUSINESS_POSTAL_CODE"),
    country: pick("BUSINESS_COUNTRY") ?? (pick("BUSINESS_STREET") ? "US" : undefined),
    hours: pick("BUSINESS_HOURS"),
    areaServed: pick("BUSINESS_AREA_SERVED"),
    googleBusinessProfile: gbp,
    sameAs: gbp && !sameAs.includes(gbp) ? [...sameAs, gbp] : sameAs,
  };
}

/** True when name + address + phone are all present — the "NAP" Local SEO needs consistent everywhere. */
export function hasNap(b: BusinessIdentity): boolean {
  return Boolean(b.name && b.phone && b.street && b.city && b.region && b.postalCode);
}

/** JSON-LD graph for a page: the organisation (a ProfessionalService when an address exists), the site, and the breadcrumb trail. */
export function structuredData(origin: string, seo: PageSeo, biz: BusinessIdentity): Record<string, unknown> {
  const org: Record<string, unknown> = {
    "@type": hasNap(biz) ? ["FinancialService", "ProfessionalService", "Organization"] : "Organization",
    "@id": `${origin}/#organization`,
    name: biz.name,
    url: `${origin}/`,
    logo: `${origin}${DEFAULT_IMAGE}`,
    description: DEFAULT_DESCRIPTION,
  };
  if (biz.phone) org.telephone = biz.phone;
  if (biz.email) org.email = biz.email;
  if (biz.street && biz.city) {
    org.address = { "@type": "PostalAddress", streetAddress: biz.street, addressLocality: biz.city, addressRegion: biz.region, postalCode: biz.postalCode, addressCountry: biz.country };
  }
  if (biz.hours) org.openingHours = biz.hours;
  if (biz.areaServed) org.areaServed = biz.areaServed;
  if (biz.sameAs.length) org.sameAs = biz.sameAs;

  const graph: Record<string, unknown>[] = [
    org,
    { "@type": "WebSite", "@id": `${origin}/#website`, url: `${origin}/`, name: SITE_NAME, publisher: { "@id": `${origin}/#organization` } },
    { "@type": "WebPage", "@id": `${origin}${seo.path}#webpage`, url: `${origin}${seo.path}`, name: seo.title, description: seo.description, isPartOf: { "@id": `${origin}/#website` } },
  ];
  if (seo.crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Home", path: "/" }, ...seo.crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${origin}${c.path}` })),
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
