import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Brain, Heart, BookOpen, Activity, AlertTriangle, BarChart3, TrendingUp,
  LayoutDashboard, Menu, X, FlaskConical, Dna, Settings, Pill, Stethoscope,
  Bot, Shield, Users, BrainCircuit, Landmark, ClipboardList
} from "lucide-react";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";

/**
 * The nav is split deliberately.
 *
 * Every item used to sit in the desktop bar at once. With nine long labels plus
 * three action buttons the row wrapped to two lines at 1920px and clipped its
 * right-hand buttons below that, so "Sign In" was unreachable on a laptop. The
 * primary set is what a clinician reaches for in a session; everything else
 * lives one click away in the overflow menu, which is available at every width.
 */
const PRIMARY_NAV = [
  { label: "Support", href: "/support-lab", icon: BrainCircuit },
  { label: "Finance", href: "/finance", icon: Landmark },
  { label: "Check-In", href: "/progress", icon: Activity },
  { label: "Journal", href: "/journal", icon: Heart },
  { label: "Crisis", href: "/crisis", icon: AlertTriangle },
];

const WELLNESS_NAV = [
  { label: "Fact Finder", href: "/finance/fact-finder", icon: ClipboardList },
  { label: "Conditions", href: "/conditions", icon: BookOpen },
  { label: "Research", href: "/research", icon: BookOpen },
  { label: "Wellness Plan", href: "/wellness-plan", icon: Heart },
  { label: "Medication Organizer", href: "/medications", icon: Pill },
];

const CLINICAL_NAV = [
  { label: "Physician Wellness", href: "/physician-wellness", icon: Users },
  { label: "Vital Signs", href: "/vital-signs", icon: BarChart3 },
  { label: "Risk Score", href: "/prs", icon: TrendingUp },
  { label: "Digital Twin", href: "/digital-twin", icon: Dna },
  { label: "FDA Compliance", href: "/fda-compliance", icon: Shield },
];

const SECONDARY_NAV = CLINICAL_TOOLS_ENABLED ? [...WELLNESS_NAV, ...CLINICAL_NAV] : WELLNESS_NAV;

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export default function NavBar() {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Fetch unread Digital Twin alerts for badge
  const { data: twinData } = trpc.digitalTwin.getMyTwin.useQuery(undefined, {
    enabled: isAuthenticated && CLINICAL_TOOLS_ENABLED,
    refetchInterval: 60_000, // poll every 60s
    retry: false,
  });
  const unreadAlerts = (twinData?.twin?.activeAlerts as any[] | undefined)?.filter(
    (a: any) => !a.acknowledged
  ).length ?? 0;

  const itemClass = (href: string) =>
    `relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      location === href
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`;

  // On desktop the overflow menu only needs the items the bar could not show.
  // On mobile the bar shows nothing, so the menu carries everything.
  const menuPrimary = PRIMARY_NAV;
  const menuSecondary = SECONDARY_NAV;

  return (
    <>
    {/*
      The nav is fixed, so it is out of flow and would otherwise sit on top of
      the first thing each page renders. Fifteen pages were clipping their own
      headings under it. One spacer here fixes every page, including future ones,
      instead of a top-padding patch repeated per page.
    */}
    <div className="h-16" aria-hidden="true" />
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="container">
        <div className="flex items-center justify-between gap-2 h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center glow-green-sm group-hover:bg-primary/20 transition-colors shrink-0">
              <FlaskConical className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-sm text-foreground tracking-tight whitespace-nowrap">Doctor Buddy</span>
              <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{CLINICAL_TOOLS_ENABLED ? "clinical decision support" : "wellness support"}</span>
            </div>
          </Link>

          {/* Desktop Nav — primary items only */}
          <div className="hidden lg:flex items-center gap-0.5 min-w-0">
            {PRIMARY_NAV.map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <button className={itemClass(href)}>
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </button>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/assessment" className="hidden sm:block">
              <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 whitespace-nowrap">
                <Brain className="w-3.5 h-3.5 mr-1.5" />
                {CLINICAL_TOOLS_ENABLED ? "Clinical Intake" : "Wellness Check-In"}
              </Button>
            </Link>

            {isAuthenticated ? (
              <Link href={CLINICAL_TOOLS_ENABLED ? "/dashboard" : "/patient"} className="hidden sm:block">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap">
                  <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" />
                  {CLINICAL_TOOLS_ENABLED ? "Dashboard" : "My Space"}
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()} className="hidden sm:block">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign In
                </Button>
              </a>
            )}

            {/* Overflow menu — present at every width, so nothing is unreachable */}
            <button
              className="p-2 text-muted-foreground hover:text-foreground relative"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              {unreadAlerts > 0 && !menuOpen && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadAlerts > 9 ? "9+" : unreadAlerts}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Menu */}
        {menuOpen && (
          <div className="border-t border-border/50 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              {/* Primary items repeat here on mobile, where the bar shows none. */}
              <div className="lg:hidden contents">
                {menuPrimary.map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                    <button className={`w-full justify-start ${itemClass(href)}`}>
                      <Icon className="w-4 h-4 shrink-0" />
                      {label}
                    </button>
                  </Link>
                ))}
              </div>

              {menuSecondary.map(({ label, href, icon: Icon }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}>
                  <button className={`w-full justify-start ${itemClass(href)}`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    {label}
                    {href === "/digital-twin" && unreadAlerts > 0 && (
                      <span className="ml-auto w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                        {unreadAlerts > 9 ? "9+" : unreadAlerts}
                      </span>
                    )}
                  </button>
                </Link>
              ))}
            </div>

            {/* Portals */}
            <div className="mt-3 pt-3 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
              <Link href="/patient" onClick={() => setMenuOpen(false)}>
                <button className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  location === "/patient" ? "bg-violet-500/20 text-violet-400" : "text-violet-400/70 hover:text-violet-300 hover:bg-violet-900/20"
                }`}>
                  <Bot className="w-4 h-4 shrink-0" />
                  {CLINICAL_TOOLS_ENABLED ? "Patient Portal" : "My Space"}
                </button>
              </Link>
              {CLINICAL_TOOLS_ENABLED && isAuthenticated && user?.role === "admin" && (
                <Link href="/psychiatrist" onClick={() => setMenuOpen(false)}>
                  <button className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    location === "/psychiatrist" ? "bg-cyan-500/20 text-cyan-400" : "text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-900/20"
                  }`}>
                    <Stethoscope className="w-4 h-4 shrink-0" />
                    Psychiatrist Portal
                  </button>
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/settings" onClick={() => setMenuOpen(false)}>
                  <button className={`w-full justify-start ${itemClass("/settings")}`}>
                    <Settings className="w-4 h-4 shrink-0" />
                    Settings
                  </button>
                </Link>
              )}
            </div>

            {/* Small-screen actions, which the bar hides below sm */}
            <div className="mt-3 pt-3 border-t border-border/30 flex flex-col gap-2 sm:hidden">
              <Link href="/assessment" onClick={() => setMenuOpen(false)}>
                <Button size="sm" variant="outline" className="w-full border-primary/30 text-primary">
                  <Brain className="w-3.5 h-3.5 mr-1.5" /> {CLINICAL_TOOLS_ENABLED ? "Clinical Intake" : "Wellness Check-In"}
                </Button>
              </Link>
              {isAuthenticated ? (
                <Link href={CLINICAL_TOOLS_ENABLED ? "/dashboard" : "/patient"} onClick={() => setMenuOpen(false)}>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground">
                    <LayoutDashboard className="w-3.5 h-3.5 mr-1.5" /> {CLINICAL_TOOLS_ENABLED ? "Dashboard" : "My Space"}
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="sm" className="w-full bg-primary text-primary-foreground">Sign In</Button>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
    </>
  );
}
