import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Brain, Mic, Shield, Trophy, Star, ArrowRight,
  Sparkles, Target, TrendingUp, Bell
} from "lucide-react";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  if (isAuthenticated && !loading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero py-20 sm:py-32 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Patent Pending Technology
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6">
            Stop <span className="text-primary">Fatty</span>
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-4 font-light">
            The first weight loss app that doesn't count calories.
          </p>
          <p className="text-base text-muted-foreground mb-10 max-w-xl mx-auto">
            We interrupt the decision-making strategy in your brain BEFORE you reach for the food.
            Using your own voice. Your own words. Your own consequences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="py-6 px-8 text-lg font-semibold"
              onClick={() => window.location.href = getLoginUrl()}
            >
              Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="py-6 px-8 text-lg"
              onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
            >
              How It Works
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            7-day free trial. Then $9.99/month. Cancel anytime.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Three steps. No calorie counting. No diet plans. Just rewiring the decision that happens
            in the 3 seconds before you reach for food.
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            <Card className="gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">1. NLP Calibration</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We map your exact decision-making strategy — what you see, say, and feel before you
                  break a commitment. Then we know exactly where to interrupt it.
                </p>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-accent/30 flex items-center justify-center mb-5">
                  <Mic className="w-6 h-6 text-accent-foreground" />
                </div>
                <h3 className="font-bold text-lg mb-3">2. Record Your Truth</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Record yourself AFTER you fail. How you feel. What you said. What your future looks like.
                  Then hear it back the NEXT time you're tempted.
                </p>
              </CardContent>
            </Card>
            <Card className="gradient-card border-border shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3">3. Pattern Interrupt</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When temptation hits, the app plays YOUR OWN VOICE describing the consequences.
                  Your brain can't argue with itself. The pattern breaks.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Built for Real Change</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border">
              <TrendingUp className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Impulse Control Score</h4>
                <p className="text-sm text-muted-foreground">A dynamic credit score that rises every time you resist temptation. Watch yourself get stronger — your score only goes up.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border">
              <Star className="w-6 h-6 text-warning shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Daily Gold Stars</h4>
                <p className="text-sm text-muted-foreground">Check in 3-5 times daily with quick voice recordings. Build streaks. Earn bonus points. Stay accountable.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border">
              <Trophy className="w-6 h-6 text-primary shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Victory Recordings</h4>
                <p className="text-sm text-muted-foreground">Celebrate your wins in your own voice. Build a library of pride that reinforces your new identity.</p>
              </div>
            </div>
            <div className="flex gap-4 p-6 rounded-xl bg-card border border-border">
              <Target className="w-6 h-6 text-destructive shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold mb-1">Decision Architecture Journal</h4>
                <p className="text-sm text-muted-foreground">Track every temptation: what you saw, what you said, what you felt, what happened. See your patterns emerge.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Why Different */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-6">Why We're Different</h2>
          <div className="prose prose-lg mx-auto text-center">
            <p className="text-muted-foreground leading-relaxed mb-6">
              Every other weight loss app fights the <strong className="text-foreground">behavior</strong> — counting calories, tracking macros,
              logging steps. They treat the symptom.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              <strong className="text-foreground">Stop Fatty fights the decision architecture.</strong> The 3-second internal process your brain runs
              before you reach for food: you see a trigger, you say something to yourself, you create a feeling,
              and then you act. We interrupt that sequence using your own voice — because your brain cannot argue
              with its own evidence.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              This is <strong className="text-foreground">Neuro-Linguistic Programming (NLP)</strong> applied to weight loss for the first time
              in a consumer app. It's not willpower. It's not discipline. It's strategy interruption.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Patent Pending — U.S. Application Filed
            </div>
          </div>
        </div>
      </section>

      {/* Dr. Buddy Coming Soon */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="max-w-2xl mx-auto">
          <Card className="border-primary/20 shadow-sm glow-gold">
            <CardContent className="p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Coming Soon</p>
              <h3 className="text-2xl font-bold mb-3">Dr. Buddy — AI Therapist</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Stop Fatty interrupts one pattern. Dr. Buddy rewires ALL of them.
                Deep generative change powered by NLP and AI — addressing the root causes,
                not just the symptoms.
              </p>
              <Button variant="outline" className="gap-2">
                <Bell className="w-4 h-4" /> Notify Me When It Launches
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Break the Pattern?</h2>
          <p className="text-muted-foreground mb-8">
            Start your 7-day free trial. No credit card required. Cancel anytime.
          </p>
          <Button
            size="lg"
            className="py-6 px-10 text-lg font-semibold"
            onClick={() => window.location.href = getLoginUrl()}
          >
            Start Free Trial <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 Stop Fatty. Patent Pending. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Built with Neuro-Linguistic Programming principles.
          </p>
        </div>
      </footer>
    </div>
  );
}
