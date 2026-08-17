import { useAuth } from "@/_core/hooks/useAuth";
import { beginAuth } from "@/lib/agreement";
import { trpc } from "@/lib/trpc";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, User, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

// ============================================================
// PUBLIC LAYOUT — Atelier Direction
// Warm. Understated. Cormorant Garamond logo. JetBrains Mono labels.
// No glow. No gradients. No Orbitron. Authority through restraint.
// ============================================================

type NavItem = { href: string; label: string } | { label: string; children: { href: string; label: string }[] };

const navLinks: NavItem[] = [
  { href: "/about", label: "About" },
  { href: "/method", label: "The Method" },
  { href: "/science", label: "Science" },
  { href: "/pricing", label: "Pricing" },
  { href: "/assessment", label: "Assessment" },
  { label: "Tools", children: [
    { href: "/weakness-finder", label: "Weakness-Finder" },
    { href: "/blind-side", label: "Blind-Side Analyzer" },
    { href: "/synergy-report", label: "Synergy Report" },
    { href: "/research-library", label: "Research Library" },
    { href: "/archetypes", label: "Intelligence Archetypes" },
    { href: "/verification", label: "Verification Ledger" },
  ]},
  { label: "Network", children: [
    { href: "/matches", label: "Your Matches" },
    { href: "/messages", label: "Messages" },
    { href: "/goals", label: "Goals & Clocks" },
    { href: "/beliefs", label: "Belief Paradigm" },
    { href: "/ecological-interventions", label: "Ecological Interventions" },
    { href: "/meta-systems", label: "Meta-Systems" },
    { href: "/scenario-intelligence", label: "Scenario Intelligence" },
  ]},
  { href: "/leaderboard", label: "Leaderboard" },
];

const flatNavLinks = navLinks.flatMap((item) =>
  'children' in item ? item.children : [item]
);

// Unread-messages chip — polls lightly; renders nothing when inbox is clear.
function UnreadMessagesBadge() {
  const q = trpc.messaging.threads.useQuery(undefined, {
    refetchInterval: 60_000,
    retry: false,
    staleTime: 30_000,
  });
  const unread = (q.data ?? []).reduce((s, t) => s + (t.unread || 0), 0);
  if (!unread) return null;
  return (
    <Link href="/messages" title={`${unread} unread message${unread === 1 ? "" : "s"}`}>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-primary/25 text-primary text-xs font-mono hover:bg-primary/5 cursor-pointer">
        ✉ {unread}
      </span>
    </Link>
  );
}

export function PublicHeader() {
  const { user, loading } = useAuth();
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-200 ${
          scrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border/30"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <span
              className="text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em' }}
            >
              AQAL
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              if ('children' in item) {
                return <ToolsDropdown key={item.label} item={item} location={location} />;
              }
              return (
                <Link key={item.href} href={item.href}>
                  <span
                    className={`px-3 py-1.5 text-sm transition-colors cursor-pointer ${
                      location === item.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Auth CTA */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-16 h-8 rounded-sm bg-muted/30 animate-pulse" />
            ) : user ? (
              <>
                <UnreadMessagesBadge />
                <Link href="/portal">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/20 text-primary hover:bg-primary/5 gap-2 rounded-sm"
                  >
                    <User className="w-3.5 h-3.5" />
                    {user.name?.split(" ")[0] || "Dashboard"}
                  </Button>
                </Link>
              </>
            ) : (
              <Button
                onClick={() => (beginAuth())}
                size="sm"
                className="bg-primary text-primary-foreground rounded-sm hover:bg-primary/90"
              >
                Sign In
              </Button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/30 px-4 pb-4"
          >
            <nav className="flex flex-col gap-1 pt-2">
              {flatNavLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span
                    className={`block px-3 py-2.5 text-sm transition-colors ${
                      location === link.href
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </span>
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-border/30">
                {user ? (
                  <Link href="/portal">
                    <span className="block px-3 py-2.5 text-sm text-primary">
                      My Dashboard
                    </span>
                  </Link>
                ) : (
                  <Button
                    onClick={() => (beginAuth())}
                    className="w-full bg-primary text-primary-foreground rounded-sm"
                  >
                    Sign In
                  </Button>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </header>
      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}

// ============================================================
// TOOLS DROPDOWN — Desktop hover dropdown for tools
// ============================================================
function ToolsDropdown({ item, location }: { item: { label: string; children: { href: string; label: string }[] }; location: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isActive = item.children.some((c) => location === c.href);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <button
        className={`px-3 py-1.5 text-sm transition-colors cursor-pointer flex items-center gap-1 ${
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        {item.label}
        <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute top-full left-0 mt-1 py-1.5 min-w-[180px] rounded-md border border-border/40 bg-background/95 backdrop-blur-md shadow-lg z-[200]"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
        >
          {item.children.map((child) => (
            <Link key={child.href} href={child.href}>
              <span
                className={`block px-4 py-2 text-sm transition-colors cursor-pointer ${
                  location === child.href
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                }`}
              >
                {child.label}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function PublicFooter() {
  return (
    <footer className="border-t border-border/30 mt-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <span
              className="text-lg text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              AQAL
            </span>
            <p className="mt-2 text-sm text-muted-foreground/60 leading-relaxed max-w-xs">
              Voice-first intelligence assessment. A panel of independent AIs. Evidence-verified.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/40 mb-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem' }}>
              Platform
            </span>
            <Link href="/science">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Science</span>
            </Link>
            <Link href="/pricing">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Pricing</span>
            </Link>
            <Link href="/assessment">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Assessment</span>
            </Link>
            <Link href="/leaderboard">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Leaderboard</span>
            </Link>
            <Link href="/lines">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">The 32 Lines</span>
            </Link>
            <Link href="/which-archetype">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">2-Minute Teaser Quiz</span>
            </Link>
          </div>

          {/* Trust & Legal */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-muted-foreground/40 mb-1"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem' }}>
              Trust & Security
            </span>
            <span className="text-sm text-muted-foreground/60">Private & Encrypted</span>
            <span className="text-sm text-muted-foreground/60">Bank-Grade Encryption</span>
            <span className="text-sm text-muted-foreground/60 flex flex-col leading-tight">
              7 Patents Pending
              <span className="text-xs text-muted-foreground/35">Proprietary methodology</span>
            </span>
            <Link href="/terms">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
            </Link>
            <Link href="/privacy">
              <span className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground/40">
            &copy; {new Date().getFullYear()} AQAL Intelligence. 7 Patents Pending &middot; Proprietary methodology.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/terms">
              <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer">Terms</span>
            </Link>
            <Link href="/privacy">
              <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer">Privacy</span>
            </Link>
            <Link href="/login">
              <span className="text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors cursor-pointer">Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  );
}
