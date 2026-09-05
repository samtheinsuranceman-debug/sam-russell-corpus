import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { VoiceInput } from "@/components/VoiceInput";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { AlertTriangle, ArrowLeft, CheckCircle, Volume2, Shield } from "lucide-react";

type Phase = "interrupt" | "journal" | "outcome" | "done";

export default function Temptation() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [phase, setPhase] = useState<Phase>("interrupt");
  const [journal, setJournal] = useState({
    sawFood: "",
    saidToSelf: "",
    createdFeeling: "",
    outcome: "" as "resisted" | "gave_in" | "",
    outcomeDescription: "",
    temptationIntensity: 5,
  });
  const [interruptPlayed, setInterruptPlayed] = useState(false);

  const interruptQuery = trpc.recordings.getPatternInterrupt.useQuery(undefined, { enabled: isAuthenticated });
  const logMutation = trpc.temptation.log.useMutation();

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

  const handlePlayInterrupt = () => {
    setInterruptPlayed(true);
  };

  const handleSubmit = async () => {
    if (!journal.outcome) return;
    await logMutation.mutateAsync({
      sawFood: journal.sawFood,
      saidToSelf: journal.saidToSelf,
      createdFeeling: journal.createdFeeling,
      outcome: journal.outcome as "resisted" | "gave_in",
      outcomeDescription: journal.outcomeDescription,
      temptationIntensity: journal.temptationIntensity,
      patternInterruptPlayed: interruptPlayed,
    });
    setPhase("done");
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto">
        <Button variant="ghost" className="mb-6" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Phase 1: Pattern Interrupt */}
        {phase === "interrupt" && (
          <Card className="bg-card border-border border-destructive/30">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2">STOP.</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Before you act — listen to yourself.
              </p>

              {interruptQuery.data ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <div className="flex items-center gap-2 mb-3">
                      <Volume2 className="w-5 h-5 text-destructive" />
                      <span className="text-sm font-medium text-destructive">Your Pattern Interrupt</span>
                    </div>
                    <audio
                      src={interruptQuery.data.fileUrl}
                      controls
                      autoPlay
                      onPlay={handlePlayInterrupt}
                      className="w-full"
                    />
                    {interruptQuery.data.howTheyFeel && (
                      <p className="text-sm text-muted-foreground mt-3 italic">
                        You said: "{interruptQuery.data.howTheyFeel}"
                      </p>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    This is YOU. This is how you felt LAST time. Do you want to feel this way again?
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-secondary border border-border">
                  <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No failure recordings yet. After your first setback, record how you feel — it becomes your future pattern interrupt.
                  </p>
                </div>
              )}

              <div className="mt-8 space-y-3">
                <Button
                  className="w-full py-5"
                  variant="outline"
                  onClick={() => setPhase("journal")}
                >
                  Continue to Journal Entry
                </Button>
                <Button
                  className="w-full py-5 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setJournal(j => ({ ...j, outcome: "resisted" }));
                    setPhase("outcome");
                  }}
                >
                  I Resisted! Log Victory
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 2: Journal the decision architecture */}
        {phase === "journal" && (
          <Card className="bg-card border-border">
            <CardContent className="p-8">
              <h2 className="text-xl font-bold mb-2">Walk Through Your Decision</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Map exactly what happened in your brain. Speak or type your answers.
              </p>

              <div className="space-y-5">
                <VoiceInput
                  label="1. What did you SEE? (The trigger)"
                  value={journal.sawFood}
                  onChange={(val) => setJournal(j => ({ ...j, sawFood: val }))}
                  placeholder="Pizza on the counter, coworker eating chips, ad on TV..."
                  minHeight="60px"
                />
                <VoiceInput
                  label="2. What did you SAY to yourself?"
                  value={journal.saidToSelf}
                  onChange={(val) => setJournal(j => ({ ...j, saidToSelf: val }))}
                  placeholder="'One piece won't hurt' or 'I'll start fresh Monday'..."
                  minHeight="60px"
                />
                <VoiceInput
                  label="3. What FEELING did you create?"
                  value={journal.createdFeeling}
                  onChange={(val) => setJournal(j => ({ ...j, createdFeeling: val }))}
                  placeholder="Craving in my stomach, excitement, comfort-seeking..."
                  minHeight="60px"
                />
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Temptation Intensity (1-10)
                  </label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[journal.temptationIntensity]}
                      onValueChange={([v]) => setJournal(j => ({ ...j, temptationIntensity: v }))}
                      min={1}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-lg font-bold w-8 text-center">{journal.temptationIntensity}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="py-5 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setJournal(j => ({ ...j, outcome: "gave_in" }));
                    setPhase("outcome");
                  }}
                >
                  I Gave In
                </Button>
                <Button
                  className="py-5 bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setJournal(j => ({ ...j, outcome: "resisted" }));
                    setPhase("outcome");
                  }}
                >
                  I Resisted!
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Phase 3: Outcome */}
        {phase === "outcome" && (
          <Card className="bg-card border-border">
            <CardContent className="p-8">
              <div className="text-center mb-6">
                {journal.outcome === "resisted" ? (
                  <>
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-primary">You Resisted!</h2>
                    <p className="text-sm text-muted-foreground mt-1">Your score is going UP.</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                    </div>
                    <h2 className="text-xl font-bold text-destructive">You Gave In</h2>
                    <p className="text-sm text-muted-foreground mt-1">No judgment. Record how you feel — awareness builds strength.</p>
                  </>
                )}
              </div>

              <p className="text-foreground text-sm mb-4 bg-secondary/50 rounded-lg p-3 border border-border text-center">
                What did you <span className="font-bold">see</span>, <span className="font-bold">say/hear</span> &amp; <span className="font-bold">feel</span> right before you made the decision?
              </p>

              <VoiceInput
                label={journal.outcome === "resisted"
                  ? "What helped you resist? (optional)"
                  : "What happened? (optional)"
                }
                value={journal.outcomeDescription}
                onChange={(val) => setJournal(j => ({ ...j, outcomeDescription: val }))}
                placeholder={journal.outcome === "resisted"
                  ? "Hearing my own voice reminded me..."
                  : "I ate the whole thing and now I feel..."
                }
                minHeight="60px"
              />

              <Button
                className="w-full py-5 mt-6"
                onClick={handleSubmit}
                disabled={logMutation.isPending}
              >
                {logMutation.isPending ? "Saving..." : "Save Entry"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Phase 4: Done */}
        {phase === "done" && (
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Entry Logged</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Every entry builds your self-awareness. The pattern is becoming visible.
              </p>
              <div className="space-y-3">
                <Button className="w-full" onClick={() => navigate("/dashboard")}>
                  Back to Dashboard
                </Button>
                {journal.outcome === "gave_in" && (
                  <Button variant="outline" className="w-full" onClick={() => navigate("/record/failure")}>
                    Record How You Feel Now
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
