import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import {
  Mic, AlertTriangle, Trophy, Star, Shield, TrendingUp,
  TrendingDown, Play, BookOpen, LogOut, Loader2
} from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const [, navigate] = useLocation();
  const scoreQuery = trpc.impulseScore.get.useQuery(undefined, { enabled: isAuthenticated });
  const statsQuery = trpc.temptation.stats.useQuery(undefined, { enabled: isAuthenticated });
  const recordingsQuery = trpc.recordings.list.useQuery(undefined, { enabled: isAuthenticated });
  const calibrationQuery = trpc.calibration.get.useQuery(undefined, { enabled: isAuthenticated });
  const avatarQuery = trpc.calibration.getAvatar.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  // Redirect to onboarding if not completed
  if (calibrationQuery.data === undefined && !calibrationQuery.isLoading) {
    navigate("/onboarding");
    return null;
  }

  const score = scoreQuery.data?.score ?? 50;
  const status = scoreQuery.data?.status ?? "active";
  const lockMessage = scoreQuery.data?.message ?? "";
  const stats = statsQuery.data;
  const recordings = recordingsQuery.data ?? [];
  const failureRecordings = recordings.filter(r => r.type === "failure");
  const victoryRecordings = recordings.filter(r => r.type === "victory");

  // Avatar logic
  const avatarData = avatarQuery.data;
  const selfieUrl = avatarData?.selfieUrl;
  const failureAvatarUrl = avatarData?.failureAvatarUrl;
  const victoryAvatarUrl = avatarData?.victoryAvatarUrl;
  const lockedStatus = avatarData?.lockedStatus ?? "none";

  // Determine which avatar to show (positive-only: neutral → victory progression)
  const getDisplayAvatar = () => {
    if (lockedStatus === "victory_locked" && victoryAvatarUrl) return { url: victoryAvatarUrl, type: "victory" };
    if (score >= 75 && victoryAvatarUrl) return { url: victoryAvatarUrl, type: "victory" };
    if (selfieUrl) return { url: selfieUrl, type: "neutral" };
    return null;
  };

  const displayAvatar = getDisplayAvatar();

  const getScoreColor = () => {
    if (score >= 75) return "text-primary";
    if (score >= 50) return "text-warning";
    return "text-muted-foreground";
  };

  const getScoreGlow = () => {
    if (score >= 75) return "glow-success";
    return "";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-bold">Stop <span className="text-primary">Fatty</span></h1>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate("/subscription")} className="text-xs">
              <Star className="w-3 h-3 mr-1" /> Premium
            </Button>
            <span className="text-sm text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => navigate("/account")}>{user?.name || "User"}</span>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 space-y-8">
        {/* Impulse Control Score */}
        <Card className={`bg-card border-border ${getScoreGlow()}`}>
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Impulse Control Score</p>
            <div className={`text-7xl font-bold ${getScoreColor()} mb-2`}>
              {score}
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              {status === "building" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-muted-foreground text-sm font-medium">
                  <TrendingUp className="w-3 h-3" /> Building Momentum
                </span>
              )}
              {status === "active" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-secondary text-foreground text-sm font-medium">
                  <Shield className="w-3 h-3" /> Active Zone
                </span>
              )}
              {status === "royalty" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Trophy className="w-3 h-3" /> Royalty — Identity Locked
                </span>
              )}
            </div>
            {/* Score bar */}
            <div className="w-full max-w-md mx-auto h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${score}%`,
                  background: score >= 75 ? "oklch(0.72 0.19 145)" : score >= 50 ? "oklch(0.75 0.15 75)" : "oklch(0.65 0.1 280)",
                }}
              />
            </div>
            <div className="flex justify-between max-w-md mx-auto mt-1 text-xs text-muted-foreground">
              <span>0 — Starting</span>
              <span>100 — Royalty</span>
            </div>
            {lockMessage && (
              <p className="text-sm text-muted-foreground mt-4 italic">{lockMessage}</p>
            )}
            {/* Avatar Display */}
            <div className="mt-6 flex justify-center">
              {avatarQuery.isLoading ? (
                <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : displayAvatar ? (
                <div className={`relative w-24 h-24 rounded-full overflow-hidden border-4 shadow-lg transition-all duration-500 ${
                  displayAvatar.type === "victory" ? "border-primary shadow-primary/30 glow-gold" :
                  "border-border"
                }`}>
                  <img
                    src={displayAvatar.url}
                    alt={`Your ${displayAvatar.type} avatar`}
                    className="w-full h-full object-cover"
                  />
                  {displayAvatar.type === "victory" && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-lg">👑</div>
                  )}
                </div>
              ) : selfieUrl && (!failureAvatarUrl || !victoryAvatarUrl) ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-24 h-24 rounded-full bg-secondary border-2 border-border flex items-center justify-center relative overflow-hidden">
                    <img src={selfieUrl} alt="Your selfie" className="w-full h-full object-cover opacity-50" />
                    <Loader2 className="w-6 h-6 animate-spin text-primary absolute" />
                  </div>
                  <span className="text-xs text-muted-foreground">Generating your avatars...</span>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                  <span className="text-xs text-muted-foreground text-center px-2">Take selfie in onboarding</span>
                </div>
              )}
            </div>
            {displayAvatar?.type === "victory" && (
              <p className="text-xs text-primary mt-2 font-medium">This is who you are becoming. Royalty.</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Button
            className="h-auto py-6 flex flex-col gap-2 bg-destructive/10 hover:bg-destructive/20 text-destructive border border-destructive/20"
            variant="outline"
            onClick={() => navigate("/temptation")}
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="font-semibold">I'm Tempted</span>
            <span className="text-xs opacity-70">Log & interrupt</span>
          </Button>
          <Button
            className="h-auto py-6 flex flex-col gap-2 bg-destructive/5 hover:bg-destructive/10 text-orange-400 border border-orange-400/20"
            variant="outline"
            onClick={() => navigate("/record/failure")}
          >
            <Mic className="w-6 h-6" />
            <span className="font-semibold">Record Failure</span>
            <span className="text-xs opacity-70">I gave in</span>
          </Button>
          <Button
            className="h-auto py-6 flex flex-col gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
            variant="outline"
            onClick={() => navigate("/record/victory")}
          >
            <Trophy className="w-6 h-6" />
            <span className="font-semibold">Record Victory</span>
            <span className="text-xs opacity-70">I resisted!</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              <p className="text-xs text-muted-foreground">Total Temptations</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats?.resisted ?? 0}</p>
              <p className="text-xs text-muted-foreground">Resisted</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-destructive">{stats?.gaveIn ?? 0}</p>
              <p className="text-xs text-muted-foreground">Gave In</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-warning">{stats?.streakDays ?? 0}</p>
              <p className="text-xs text-muted-foreground">Current Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Check-in Gold Star */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning" /> Daily Gold Star
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Record 3-5 quick voice check-ins today to earn your gold star. Say what you're choosing and why. 5 seconds each.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= (recordings.filter(r => {
                        const today = new Date().toDateString();
                        return new Date(r.createdAt).toDateString() === today;
                      }).length || 0)
                        ? "bg-warning text-warning-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    ★
                  </div>
                ))}
              </div>
              <Button size="sm" onClick={() => navigate("/record/victory")} className="ml-auto">
                <Mic className="w-4 h-4 mr-1" /> Quick Check-in
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              10 consecutive gold star days = +10 points. Then 15 days = +20 points.
            </p>
          </CardContent>
        </Card>

        {/* Recording Library */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" /> Failure Recordings ({failureRecordings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {failureRecordings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recordings yet. Record after a setback to build your pattern interrupt library.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {failureRecordings.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                      <Play className="w-4 h-4 text-destructive shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{r.howTheyFeel || "Recording"}</p>
                        <p className="text-xs text-muted-foreground/60">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <audio src={r.fileUrl} controls className="h-8 w-32" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> Victory Recordings ({victoryRecordings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {victoryRecordings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recordings yet. Record after resisting to celebrate your wins.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {victoryRecordings.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center gap-2 p-2 rounded bg-secondary/50">
                      <Play className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground truncate">{r.prideDescription || "Recording"}</p>
                        <p className="text-xs text-muted-foreground/60">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <audio src={r.fileUrl} controls className="h-8 w-32" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Temptation Log */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" /> Recent Temptation Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TemptationLog />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function TemptationLog() {
  const entriesQuery = trpc.temptation.list.useQuery();
  const entries = entriesQuery.data ?? [];

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No temptation entries yet. Log your first one when it happens.</p>;
  }

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto">
      {entries.slice(0, 10).map(entry => (
        <div key={entry.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              entry.outcome === "resisted"
                ? "bg-primary/10 text-primary"
                : "bg-destructive/10 text-destructive"
            }`}>
              {entry.outcome === "resisted" ? "✓ Resisted" : "✗ Gave In"}
            </span>
            <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong className="text-foreground">Saw:</strong> {entry.sawFood}</p>
            <p><strong className="text-foreground">Said:</strong> {entry.saidToSelf}</p>
            <p><strong className="text-foreground">Felt:</strong> {entry.createdFeeling}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
