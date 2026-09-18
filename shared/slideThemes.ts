/**
 * Slide Theme System — 4 visual themes for AI-generated presentations.
 * Used by both frontend (preview) and backend (PPTX generation).
 */

export interface SlideTheme {
  id: string;
  name: string;
  description: string;
  /** Primary background color (hex) */
  bgColor: string;
  /** Secondary/accent background for alternating slides */
  bgAlt: string;
  /** Title text color */
  titleColor: string;
  /** Body text color */
  textColor: string;
  /** Accent color for bullets, highlights, borders */
  accentColor: string;
  /** Subtitle / muted text color */
  subtitleColor: string;
  /** Font family for titles */
  titleFont: string;
  /** Font family for body text */
  bodyFont: string;
  /** Preview gradient CSS (for theme picker cards) */
  previewGradient: string;
}

export const SLIDE_THEMES: SlideTheme[] = [
  {
    id: "executive-dark",
    name: "Executive Dark",
    description: "Bold navy & emerald — boardroom authority",
    bgColor: "#0a1628",
    bgAlt: "#0f1f3a",
    titleColor: "#ffffff",
    textColor: "#c8d6e5",
    accentColor: "#22c55e",
    subtitleColor: "#64748b",
    titleFont: "Georgia",
    bodyFont: "Calibri",
    previewGradient: "linear-gradient(135deg, #0a1628 0%, #0f1f3a 50%, #22c55e 100%)",
  },
  {
    id: "clean-light",
    name: "Clean Light",
    description: "Crisp white & slate — modern minimalism",
    bgColor: "#ffffff",
    bgAlt: "#f8fafc",
    titleColor: "#0f172a",
    textColor: "#334155",
    accentColor: "#2563eb",
    subtitleColor: "#64748b",
    titleFont: "Calibri",
    bodyFont: "Calibri",
    previewGradient: "linear-gradient(135deg, #ffffff 0%, #f1f5f9 50%, #2563eb 100%)",
  },
  {
    id: "branded-gold",
    name: "Branded Gold",
    description: "Deep charcoal & gold — premium client-facing",
    bgColor: "#1a1a2e",
    bgAlt: "#16213e",
    titleColor: "#fbbf24",
    textColor: "#e2e8f0",
    accentColor: "#f59e0b",
    subtitleColor: "#94a3b8",
    titleFont: "Georgia",
    bodyFont: "Calibri",
    previewGradient: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #fbbf24 100%)",
  },
  {
    id: "emerald-pro",
    name: "Russell Capital",
    description: "Official Russell Capital Systems branding",
    bgColor: "#0b1120",
    bgAlt: "#111827",
    titleColor: "#22c55e",
    textColor: "#d1d5db",
    accentColor: "#10b981",
    subtitleColor: "#6b7280",
    titleFont: "Georgia",
    bodyFont: "Calibri",
    previewGradient: "linear-gradient(135deg, #0b1120 0%, #111827 50%, #10b981 100%)",
  },
];

export const DEFAULT_THEME_ID = "executive-dark";

export function getThemeById(id: string): SlideTheme {
  return SLIDE_THEMES.find((t) => t.id === id) || SLIDE_THEMES[0];
}
