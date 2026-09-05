import { useAuth } from "@/_core/hooks/useAuth";
import { beginAuth } from "@/lib/agreement";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine, ArrowLeft } from "lucide-react";
import CommitmentPanel from "@/components/CommitmentPanel";

// Standalone route for the Personal Commitment Agreement. Full-width so the mic
// narration flow has room. Also embedded in the Portal "Commitment" tab.
export default function Commitment() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground font-mono text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <Card className="p-10 bg-secondary border-border text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <PenLine className="w-6 h-6 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-semibold mb-3">Sign in to make your commitment</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your Personal Commitment Agreement is private to you. Sign in to record it and return to it any time.
          </p>
          <Button onClick={beginAuth} className="w-full bg-primary text-primary-foreground">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[880px] mx-auto px-5 py-10">
        <Link href="/portal" className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to your portal
        </Link>
        <CommitmentPanel />
      </div>
    </div>
  );
}
