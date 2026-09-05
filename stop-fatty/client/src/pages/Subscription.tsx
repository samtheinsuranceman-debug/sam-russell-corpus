import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";
import { Check, Crown, Zap, Star, Loader2 } from "lucide-react";

export default function Subscription() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const raffleQuery = trpc.impulseScore.raffle.useQuery(undefined, { enabled: isAuthenticated });
  const raffle = raffleQuery.data;

  const cancelSub = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled. You'll retain access until the end of your billing period.");
    },
    onError: () => {
      toast.error("Failed to cancel subscription. Please try again.");
    },
  });

  const createCheckout = trpc.subscription.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast.success("Redirecting to checkout...");
        window.open(data.url, "_blank");
      }
      setCheckoutLoading(false);
    },
    onError: (err) => {
      toast.error("Failed to create checkout session: " + err.message);
      setCheckoutLoading(false);
    },
  });

  const handleSubscribe = () => {
    setCheckoutLoading(true);
    createCheckout.mutate({ origin: window.location.origin });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center mb-10">
          <Crown className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Unlock Your Full Potential</h1>
          <p className="text-muted-foreground">
            Your 7-day free trial gives you full access. Then $9.99/month to keep your momentum.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="bg-card border-primary/30 mb-8">
          <CardContent className="p-8">
            <div className="flex items-baseline justify-center gap-1 mb-6">
              <span className="text-5xl font-bold">$9.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>

            <div className="space-y-4 mb-8">
              <Feature text="Unlimited audio recordings (failure & victory)" />
              <Feature text="Pattern interrupt playback on every temptation" />
              <Feature text="Full NLP calibration & strategy mapping" />
              <Feature text="Impulse Control Score tracking" />
              <Feature text="Daily Gold Star engagement system" />
              <Feature text="Avatar identity lock-in system" />
              <Feature text="Monthly raffle eligibility ($500+ prizes)" />
              <Feature text="Temptation journal with pattern analysis" />
            </div>

            <Button
              className="w-full py-6 text-lg font-semibold"
              size="lg"
              onClick={handleSubscribe}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {checkoutLoading ? "Creating checkout..." : "Start 7-Day Free Trial"}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Cancel anytime. No charge during trial period. Powered by Stripe.
            </p>
          </CardContent>
        </Card>

        {/* Raffle Qualification */}
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Star className="w-6 h-6 text-warning" />
              <h3 className="font-semibold">Monthly Cash Raffle</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribers who maintain a score of 75+ for 90 consecutive days qualify for our monthly cash raffle.
              Prize pool grows with our community.
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Subscribed</p>
                <p className="font-bold text-sm">{raffle?.monthsSubscribed ?? 0} / 6 mo</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Score 75+</p>
                <p className="font-bold text-sm">{raffle?.daysAt75Plus ?? 0} / 90 days</p>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <p className="text-xs text-muted-foreground">Status</p>
                <p className={`font-bold text-sm ${raffle?.eligible ? "text-primary" : "text-muted-foreground"}`}>{raffle?.status ?? "Loading..."}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Subscription */}
        <Card className="bg-card border-destructive/30 mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Cancel Subscription</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Cancel your subscription. You'll keep access until the end of your current billing period.
            </p>
            <Button
              variant="outline"
              className="text-red-600 border-red-300 hover:bg-red-50"
              onClick={() => {
                if (confirm("Are you sure you want to cancel your subscription?")) {
                  cancelSub.mutate();
                }
              }}
              disabled={cancelSub.isPending}
            >
              {cancelSub.isPending ? "Cancelling..." : "Cancel Subscription"}
            </Button>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
          <br />
          <Button variant="link" className="text-destructive text-xs" onClick={() => navigate("/account")}>
            Delete Account
          </Button>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
        <Check className="w-3 h-3 text-primary" />
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
}
