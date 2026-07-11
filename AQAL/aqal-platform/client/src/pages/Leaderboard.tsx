import { useState } from "react";
import { motion } from "framer-motion";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Trophy, Crown, Medal, Star, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getLoginUrl } from "@/const";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

export default function Leaderboard() {
  const { user, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const utils = trpc.useUtils();

  const { data: leaderboard, isLoading } = trpc.leaderboard.list.useQuery({ limit: 50 });
  const { data: myEntry } = trpc.leaderboard.myEntry.useQuery(undefined, { enabled: !!user });

  const joinMutation = trpc.leaderboard.join.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success("You're on the leaderboard!");
        utils.leaderboard.list.invalidate();
        utils.leaderboard.myEntry.invalidate();
      } else {
        toast.error(result.error || "Failed to join");
      }
    },
  });

  const toggleMutation = trpc.leaderboard.toggleVisibility.useMutation({
    onSuccess: () => {
      toast.success("Visibility updated");
      utils.leaderboard.list.invalidate();
      utils.leaderboard.myEntry.invalidate();
    },
  });

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />;
    if (index === 1) return <Medal className="w-5 h-5 text-gray-300 drop-shadow-[0_0_6px_rgba(209,213,219,0.4)]" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_6px_rgba(217,119,6,0.4)]" />;
    return <span className="text-sm font-mono text-muted-foreground/60">#{index + 1}</span>;
  };

  const formatRarity = (rarity: number) => {
    if (rarity >= 1000000) return `1 in ${(rarity / 1000000).toFixed(1)}M`;
    if (rarity >= 1000) return `1 in ${(rarity / 1000).toFixed(1)}K`;
    return `1 in ${rarity.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <PublicHeader />
      {/* Gradient mesh */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-[15%] right-[20%] w-[500px] h-[500px] rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-[30%] left-[10%] w-[400px] h-[400px] rounded-full bg-purple-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 container max-w-4xl pt-24 pb-12 px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/20 bg-amber-500/[0.05] mb-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs tracking-widest uppercase text-amber-400/80" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Global Rankings</span>
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-light mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Rarity Leaderboard</h1>
          <p className="text-muted-foreground/70 max-w-md mx-auto">The rarest intelligence profiles on the planet. Where do you rank?</p>
          {!user && (
            <div className="flex justify-center gap-4 mt-6">
              <Link href="/assessment">
                <Button size="sm" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium">Take Assessment</Button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Join Section (if user is logged in but not on leaderboard) */}
        {user && !myEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Join the Leaderboard</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Opt-in to display your rarity score publicly. You can hide it anytime.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={() => joinMutation.mutate({ displayName })}
                    disabled={!displayName.trim() || joinMutation.isPending}
                  >
                    {joinMutation.isPending ? "Joining..." : "Join"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Visibility Toggle (if user is on leaderboard) */}
        {user && myEntry && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="border-primary/30">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="font-medium">Your entry: <span className="text-primary">{myEntry.displayName}</span></p>
                  <p className="text-sm text-muted-foreground">
                    Rarity: {formatRarity(myEntry.compositeRarity)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="visibility" className="text-sm">
                    {myEntry.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Label>
                  <Switch
                    id="visibility"
                    checked={!!myEntry.isPublic}
                    onCheckedChange={(checked) => toggleMutation.mutate({ isPublic: checked })}
                  />
                  <span className="text-sm text-muted-foreground">
                    {myEntry.isPublic ? "Visible" : "Hidden"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Top Rarity Scores
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-12 bg-muted rounded-lg" />
                  ))}
                </div>
              ) : !leaderboard || leaderboard.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 blur-[30px] bg-amber-500/20 rounded-full" />
                    <Trophy className="relative w-16 h-16 text-amber-400/40" />
                  </div>
                  <p className="text-lg font-light mb-2">The throne awaits.</p>
                  <p className="text-sm text-muted-foreground/60">Complete your assessment and be the first to claim your rank.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {leaderboard.map((entry, index) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-200 ${
                        index === 0 ? "bg-gradient-to-r from-amber-500/15 to-amber-500/5 border border-amber-500/30 shadow-[0_0_20px_rgba(251,191,36,0.1)]" :
                        index === 1 ? "bg-gradient-to-r from-gray-300/10 to-gray-300/5 border border-gray-300/20" :
                        index === 2 ? "bg-gradient-to-r from-amber-700/10 to-amber-700/5 border border-amber-700/20" :
                        "border border-transparent hover:border-border/50 hover:bg-muted/30"
                      }`}
                    >
                      <div className="w-10 flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${index === 0 ? 'text-amber-200' : ''}`}>{entry.displayName}</p>
                        {entry.topPowerCombo && (
                          <p className="text-xs text-muted-foreground/60 truncate mt-0.5">{entry.topPowerCombo}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <Badge variant="outline" className={`font-mono text-xs ${
                          index === 0 ? 'border-amber-500/40 text-amber-300' :
                          index === 1 ? 'border-gray-400/30 text-gray-300' :
                          index === 2 ? 'border-amber-700/30 text-amber-500' : ''
                        }`}>
                          {formatRarity(entry.compositeRarity)}
                        </Badge>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Not logged in CTA */}
        {!user && !authLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 text-center"
          >
            <p className="text-muted-foreground mb-3">Want to join the leaderboard?</p>
            <Button asChild>
              <a href={getLoginUrl()}>Sign In & Take Assessment</a>
            </Button>
          </motion.div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
