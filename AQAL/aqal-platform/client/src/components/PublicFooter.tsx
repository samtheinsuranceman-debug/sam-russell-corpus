import { PrefetchLink } from "@/components/PrefetchLink";

const NAV_LINKS = [
  { label: "Science", href: "/science" },
  { label: "Pricing", href: "/pricing" },
  { label: "Assessment", href: "/assessment" },
];

export default function PublicFooter() {
  return (
    <footer className="relative w-full mt-auto pt-16 pb-10">
      {/* Gradient top border */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, oklch(0.7 0.2 240 / 0.5), oklch(0.82 0.16 195 / 0.4), oklch(0.7 0.2 240 / 0.5), transparent)",
        }}
      />

      <div className="container flex flex-col items-center gap-6">
        {/* Branding */}
        <div
          className="text-lg font-semibold tracking-widest"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            background: "linear-gradient(135deg, oklch(0.7 0.2 240), oklch(0.82 0.16 195))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AQAL
        </div>

        {/* Nav links */}
        <nav className="flex items-center gap-8">
          {NAV_LINKS.map(({ label, href }) => (
            <PrefetchLink
              key={href}
              href={href}
              className="text-sm text-muted-foreground/50 hover:text-accent transition-colors duration-200 tracking-wide"
            >
              {label}
            </PrefetchLink>
          ))}
        </nav>

        {/* Divider */}
        <div
          className="w-20 h-px"
          style={{
            background: "linear-gradient(90deg, transparent, oklch(0.7 0.2 240 / 0.3), transparent)",
          }}
        />

        {/* Tagline */}
        <p className="text-center text-[0.65rem] text-muted-foreground/30 tracking-widest uppercase max-w-sm leading-relaxed">
          Voice-first. Evidence-verified. Multi-AI consensus. Zero bias.
        </p>

        {/* Copyright */}
        <p className="text-[0.6rem] text-muted-foreground/20 tracking-wide">
          &copy; 2026 AQAL Intelligence &middot; 7 Patents Pending &middot; Proprietary methodology
        </p>
      </div>
    </footer>
  );
}
