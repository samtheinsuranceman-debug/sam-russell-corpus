import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Swords, Trophy, Zap, ArrowRight } from "lucide-react";
import { Link, useParams } from "wouter";
import { beginAuth } from "@/lib/agreement";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

export default function Challenge() {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();

  const { data: challenge, isLoading } = trpc.challenge.get.useQuery(
    { token: token || "" },
    { enabled: !!token }
  );

  const acceptMutation = trpc.challenge.accept.useMutation();

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center space-y-4">
            <Swords className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Challenge Not Found</h2>
            <p className="text-muted-foreground">This challenge link may have expired or is invalid.</p>
            <Link href="/">
              <Button>Go Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const formatRarity = (rarity: number) => {
    if (rarity >= 1000000) return `1 in ${(rarity / 1000000).toFixed(1)}M`;
    if (rarity >= 1000) return `1 in ${(rarity / 1000).toFixed(1)}K`;
    return `1 in ${rarity.toLocaleString()}`;
  };

  const handleAccept = () => {
    if (!user) {
      beginAuth();
      return;
    }
    acceptMutation.mutate({ token: token || "" });
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      {/* Gradient mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[20%] left-[30%] w-[500px] h-[500px] rounded-full bg-red-500/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[20%] w-[400px] h-[400px] rounded-full bg-orange-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-lg pt-24 pb-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-br from-red-500/20 via-orange-500/10 to-transparent p-8 text-center border-b border-border/50">
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <Swords className="w-16 h-16 mx-auto text-red-400 mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">You've Been Challenged!</h1>
              <p className="text-muted-foreground">
                <span className="text-foreground font-semibold">{challenge.senderName}</span> thinks they're rarer than you.
              </p>
            </div>

            <CardContent className="pt-6 space-y-6">
              {/* Challenger Stats */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Challenger's Rarity</p>
                  <p className="text-xl font-bold font-mono text-primary">
                    {formatRarity(challenge.senderRarity)}
                  </p>
                </div>
                <Badge variant="outline" className="text-red-400 border-red-400/30">
                  <Zap className="w-3 h-3 mr-1" /> Challenge
                </Badge>
              </div>

              {/* Status */}
              {challenge.status === "completed" ? (
                <div className="py-4 space-y-4">
                  <Trophy className="w-10 h-10 mx-auto text-amber-400 mb-2" />
                  <p className="font-semibold text-center">Challenge Completed!</p>
                  {/* Comparison View */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-400/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Challenger</p>
                      <p className="font-semibold text-sm">{challenge.senderName}</p>
                      <p className="text-lg font-bold font-mono text-red-400">{formatRarity(challenge.senderRarity)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-400/20 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Challenged</p>
                      <p className="font-semibold text-sm">{challenge.recipientName || "Recipient"}</p>
                      <p className="text-lg font-bold font-mono text-blue-400">
                        {challenge.recipientRarity ? formatRarity(challenge.recipientRarity) : "—"}
                      </p>
                    </div>
                  </div>
                  {challenge.recipientRarity && (
                    <p className="text-center text-sm font-medium">
                      {challenge.senderRarity > challenge.recipientRarity
                        ? `🏆 ${challenge.senderName} is rarer!`
                        : challenge.recipientRarity > challenge.senderRarity
                        ? `🏆 ${challenge.recipientName || "Recipient"} is rarer!`
                        : "🤝 It's a tie!"}
                    </p>
                  )}
                  <div className="flex gap-2 justify-center">
                    <Link href="/leaderboard">
                      <Button variant="outline" size="sm">View Leaderboard</Button>
                    </Link>
                    <Link href="/portal">
                      <Button size="sm">View Your Profile</Button>
                    </Link>
                  </div>
                </div>
              ) : challenge.status === "accepted" ? (
                <div className="text-center py-4">
                  <p className="font-semibold text-amber-400 mb-2">Challenge Accepted!</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Now take the assessment to see who's rarer.
                  </p>
                  <Link href="/assessment">
                    <Button className="gap-2">
                      Take Assessment <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-sm text-muted-foreground">
                    Think you're rarer? Take the AQAL 32-Dimension Intelligence Assessment and find out.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleAccept}
                      disabled={acceptMutation.isPending}
                      className="w-full gap-2"
                      size="lg"
                    >
                      <Swords className="w-4 h-4" />
                      {acceptMutation.isPending ? "Accepting..." : "Accept Challenge"}
                    </Button>
                    <Link href="/">
                      <Button variant="ghost" className="w-full text-muted-foreground">
                        Maybe later
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      <PublicFooter />
    </div>
  );
}
