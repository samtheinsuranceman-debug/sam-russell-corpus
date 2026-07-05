import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Users, TrendingUp, Copy, ExternalLink, BarChart3, Rocket, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";

export default function InfluencerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const { data: myCodes, isLoading: codesLoading } = trpc.influencer.myCodes.useQuery(
    undefined,
    { enabled: !!user }
  );

  const { data: stats, isLoading: statsLoading } = trpc.influencer.stats.useQuery(
    { code: selectedCode || "" },
    { enabled: !!selectedCode }
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Influencer Dashboard</h2>
            <p className="text-muted-foreground">Sign in to view your referral stats and earnings.</p>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/assess?promo=${code}`;
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Gradient mesh background */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-5xl py-12 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <h1 className="display-2">Influencer Dashboard</h1>
            <Link href="/">
              <Button variant="outline" size="sm">← Back to Home</Button>
            </Link>
          </div>
          <p className="text-muted-foreground">Track your referrals, earnings, and impact.</p>
        </motion.div>

        {/* Promo Codes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-lg font-semibold mb-4">Your Promo Codes</h2>
          {codesLoading ? (
            <div className="animate-pulse h-20 bg-muted rounded-lg" />
          ) : !myCodes || myCodes.length === 0 ? (
            <InfluencerOnboarding />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {myCodes.map((code) => (
                <Card
                  key={code.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${selectedCode === code.code ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedCode(code.code)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <code className="text-lg font-mono font-bold text-primary">{code.code}</code>
                      <Badge variant={code.isActive ? "default" : "secondary"}>
                        {code.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{code.discountPercent}% discount</span>
                      <span>{code.commissionPercent}% commission</span>
                      <span>{code.usageCount} uses</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); copyLink(code.code); }}
                      >
                        <Copy className="w-3 h-3 mr-1" /> Copy Link
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats Section */}
        {selectedCode && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Separator className="mb-8" />
            <h2 className="text-lg font-semibold mb-4">
              Stats for <code className="text-primary">{selectedCode}</code>
            </h2>

            {statsLoading ? (
              <div className="grid gap-4 md:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse h-24 bg-muted rounded-lg" />
                ))}
              </div>
            ) : stats ? (
              <>
                {/* Stat Cards */}
                <div className="grid gap-4 md:grid-cols-4 mb-8">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Users className="w-4 h-4" /> Total Referrals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{stats.totalReferrals}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Total Revenue
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${((stats.totalRevenue || 0) / 100).toFixed(2)}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Your Commission
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-emerald-500">
                        ${((stats.totalCommission || 0) / 100).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <DollarSign className="w-4 h-4" /> Pending Payout
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-amber-500">
                        ${((stats.pendingCommission || 0) / 100).toFixed(2)}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Payments Table */}
                {stats.recentPayments && stats.recentPayments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent Referral Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-muted-foreground">
                              <th className="pb-2">Date</th>
                              <th className="pb-2">Amount</th>
                              <th className="pb-2">Commission</th>
                              <th className="pb-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stats.recentPayments.map((payment: any) => (
                              <tr key={payment.id} className="border-b last:border-0">
                                <td className="py-2">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </td>
                                <td className="py-2">${(payment.amountCents / 100).toFixed(2)}</td>
                                <td className="py-2 text-emerald-500">
                                  ${(payment.commissionCents / 100).toFixed(2)}
                                </td>
                                <td className="py-2">
                                  <Badge variant={payment.status === "paid" ? "default" : "secondary"}>
                                    {payment.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No stats available for this code yet.
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function InfluencerOnboarding() {
  const [code, setCode] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const utils = trpc.useUtils();

  const requestCode = trpc.promo.requestCode.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccess(data.code!);
        toast.success(`Your promo code "${data.code}" is live!`);
        utils.influencer.myCodes.invalidate();
      } else {
        toast.error(data.error || "Failed to create code");
      }
    },
    onError: (err) => {
      toast.error(err.message || "Something went wrong");
    },
  });

  if (success) {
    return (
      <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardContent className="py-8 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-400" />
          <h3 className="text-xl font-semibold">You're In!</h3>
          <p className="text-muted-foreground">
            Your promo code <code className="text-emerald-400 font-mono font-bold">{success}</code> is now active.
          </p>
          <p className="text-sm text-muted-foreground">
            Share your unique link with your audience. You'll earn 15% commission on every assessment purchased through your code.
          </p>
          <div className="flex items-center justify-center gap-2 pt-2">
            <code className="text-sm bg-muted px-3 py-1.5 rounded">
              {window.location.origin}/assess?promo={success}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/assess?promo=${success}`);
                toast.success("Link copied!");
              }}
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="py-8 space-y-6">
        <div className="text-center space-y-3">
          <Rocket className="w-10 h-10 mx-auto text-primary" />
          <h3 className="text-xl font-semibold">Become an AQAL Influencer</h3>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Get your own promo code, share it with your audience, and earn 15% commission on every assessment purchased through your link.
          </p>
          <p className="text-xs text-amber-400/80">
            Requirement: Complete your free assessment first to unlock influencer status.
          </p>
        </div>

        <div className="max-w-sm mx-auto space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Choose Your Promo Code</label>
            <Input
              placeholder="e.g. YOURNAME"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
              maxLength={32}
              className="font-mono text-center text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.length >= 3) {
                  requestCode.mutate({ desiredCode: code });
                }
              }}
            />
            <p className="text-xs text-muted-foreground text-center">
              3-32 characters. Letters, numbers, hyphens, and underscores only.
            </p>
          </div>

          <Button
            className="w-full"
            disabled={code.length < 3 || requestCode.isPending}
            onClick={() => requestCode.mutate({ desiredCode: code })}
          >
            {requestCode.isPending ? "Creating..." : "Claim My Code"}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">How it works:</span> Take the free assessment → Get your profile → Share your code → Earn 15% on every sale
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="text-center space-y-1">
            <DollarSign className="w-5 h-5 mx-auto text-emerald-400" />
            <p className="text-sm font-medium">15% Commission</p>
            <p className="text-xs text-muted-foreground">On every sale</p>
          </div>
          <div className="text-center space-y-1">
            <Users className="w-5 h-5 mx-auto text-blue-400" />
            <p className="text-sm font-medium">10% Discount</p>
            <p className="text-xs text-muted-foreground">For your audience</p>
          </div>
          <div className="text-center space-y-1">
            <TrendingUp className="w-5 h-5 mx-auto text-amber-400" />
            <p className="text-sm font-medium">Real-time Stats</p>
            <p className="text-xs text-muted-foreground">Track everything</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
