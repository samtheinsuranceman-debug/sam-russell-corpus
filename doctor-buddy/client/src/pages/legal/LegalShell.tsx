import { Link } from "wouter";
import NavBar from "@/components/NavBar";
import { PUBLIC_LEGAL_LAST_UPDATED } from "@shared/legalVersions";

export default function LegalShell({ title, updated = PUBLIC_LEGAL_LAST_UPDATED, children }: { title: string; updated?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="container max-w-3xl py-10">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-[0.18em] text-cyan-400 mb-2">Doctor Buddy</div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground">Last updated: {updated}</p>
        </div>
        <article className="prose prose-invert prose-sm max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-cyan-400">
          {children}
        </article>
        <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/health-data-privacy">Consumer Health Data Privacy</Link><Link href="/medical-disclaimer">Wellness & Medical Disclaimer</Link><Link href="/financial-disclaimer">Financial Education Disclaimer</Link><Link href="/subscription-terms">Subscription Terms</Link>
        </div>
      </main>
    </div>
  );
}
