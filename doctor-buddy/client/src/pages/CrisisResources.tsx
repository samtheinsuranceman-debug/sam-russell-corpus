import NavBar from "@/components/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Phone, MessageSquare, Globe, AlertTriangle, Heart,
  Shield, Users, BookOpen, ExternalLink, ChevronRight
} from "lucide-react";

const CRISIS_LINES = [
  {
    name: "988 Suicide & Crisis Lifeline",
    number: "988",
    description: "Call or text 988 — available 24/7 for anyone in suicidal crisis or emotional distress.",
    type: "call/text",
    available: "24/7",
    color: "border-red-500/30 bg-red-500/5",
    badge: "bg-red-500/20 text-red-400",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free, 24/7 crisis support via text message. Connect with a trained crisis counselor.",
    type: "text",
    available: "24/7",
    color: "border-orange-500/30 bg-orange-500/5",
    badge: "bg-orange-500/20 text-orange-400",
  },
  {
    name: "Veterans Crisis Line",
    number: "988, then Press 1",
    description: "Confidential crisis support for veterans, service members, and their families.",
    type: "call/text/chat",
    available: "24/7",
    color: "border-blue-500/30 bg-blue-500/5",
    badge: "bg-blue-500/20 text-blue-400",
  },
  {
    name: "SAMHSA National Helpline",
    number: "1-800-662-4357",
    description: "Free, confidential treatment referral and information service for mental health and substance use.",
    type: "call",
    available: "24/7",
    color: "border-purple-500/30 bg-purple-500/5",
    badge: "bg-purple-500/20 text-purple-400",
  },
  {
    name: "NAMI Helpline",
    number: "1-800-950-6264",
    description: "National Alliance on Mental Illness — information, resource referrals, and support.",
    type: "call",
    available: "Mon–Fri 10am–10pm ET",
    color: "border-green-500/30 bg-green-500/5",
    badge: "bg-green-500/20 text-green-400",
  },
  {
    name: "Trans Lifeline",
    number: "877-565-8860",
    description: "Peer support hotline run by and for trans people. Operators are trans-identified.",
    type: "call",
    available: "24/7",
    color: "border-pink-500/30 bg-pink-500/5",
    badge: "bg-pink-500/20 text-pink-400",
  },
];

const SAFETY_PLAN_STEPS = [
  {
    step: 1,
    title: "Recognize Warning Signs",
    description: "Identify the thoughts, images, moods, situations, and behaviors that are warning signs for you.",
    icon: AlertTriangle,
    color: "text-yellow-400",
  },
  {
    step: 2,
    title: "Internal Coping Strategies",
    description: "Things you can do on your own to distract from the crisis — activities that take your mind off the urge.",
    icon: Heart,
    color: "text-pink-400",
  },
  {
    step: 3,
    title: "Social Contacts for Distraction",
    description: "People and social settings that provide distraction — not necessarily discussing the crisis.",
    icon: Users,
    color: "text-blue-400",
  },
  {
    step: 4,
    title: "People to Ask for Help",
    description: "Family members or friends who can help when you are in crisis. Tell them what you need.",
    icon: Phone,
    color: "text-green-400",
  },
  {
    step: 5,
    title: "Professional & Crisis Resources",
    description: "Clinicians, crisis lines, and emergency services you can contact during a crisis.",
    icon: Shield,
    color: "text-primary",
  },
  {
    step: 6,
    title: "Make the Environment Safe",
    description: "Remove or secure means that could be used for self-harm. Ask a trusted person to help.",
    icon: Shield,
    color: "text-red-400",
  },
];

const ONLINE_RESOURCES = [
  { name: "NAMI — Mental Health Resources", url: "https://nami.org", description: "Comprehensive mental health education and advocacy." },
  { name: "MentalHealth.gov", url: "https://mentalhealth.gov", description: "U.S. government mental health information portal." },
  { name: "Psychology Today — Find a Therapist", url: "https://psychologytoday.com/us/therapists", description: "Search for licensed therapists by location and specialty." },
  { name: "Open Path Collective", url: "https://openpathcollective.org", description: "Affordable therapy sessions for those in financial need." },
  { name: "7 Cups — Free Online Therapy", url: "https://7cups.com", description: "Free emotional support from trained listeners, 24/7." },
];

import { usePageTitle } from "@/lib/usePageTitle";
export default function CrisisResources() {
  usePageTitle("Crisis resources");
  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-4xl">

        {/* Emergency Banner */}
        <div className="mb-8 p-4 rounded-xl border border-red-500/40 bg-red-500/10 flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-red-300 text-sm">If you are in immediate danger, call 911 or go to your nearest emergency room.</p>
            <p className="text-xs text-red-400/80 mt-0.5">This page provides crisis resources and is not a substitute for emergency medical care.</p>
          </div>
          <a href="tel:911">
            <Button size="sm" className="bg-red-500 hover:bg-red-600 text-white shrink-0">
              <Phone className="w-3.5 h-3.5 mr-1.5" /> Call 911
            </Button>
          </a>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Mental Health Crisis Support</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Crisis Resources</h1>
          <p className="text-muted-foreground text-sm">
            You are not alone. Trained crisis counselors are available 24/7 to provide free, confidential support.
            Reaching out is a sign of strength.
          </p>
        </div>

        {/* Crisis Hotlines */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" /> Crisis Hotlines
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CRISIS_LINES.map(line => (
              <Card key={line.name} className={`border ${line.color}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm font-semibold text-foreground leading-snug">{line.name}</CardTitle>
                    <Badge className={`text-[10px] shrink-0 ${line.badge}`}>{line.available}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground mb-3">{line.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-foreground font-mono">{line.number}</span>
                    <a href={`tel:${line.number.replace(/\D/g, "")}`}>
                      <Button size="sm" variant="outline" className="border-current/30 text-xs h-7">
                        <Phone className="w-3 h-3 mr-1" /> Call Now
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Safety Plan Framework */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" /> Stanley-Brown Safety Planning Framework
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            A safety plan is a prioritized written list of coping strategies and sources of support you can use during a crisis.
            Work through these steps with your therapist or counselor.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {SAFETY_PLAN_STEPS.map(({ step, title, description, icon: Icon, color }) => (
              <Card key={step} className="border-border bg-card">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <div className="w-7 h-7 rounded-full bg-secondary/50 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {step}
                      </div>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Online Resources */}
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Online Resources
          </h2>
          <div className="space-y-2">
            {ONLINE_RESOURCES.map(resource => (
              <a
                key={resource.name}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-secondary/30 transition-colors group"
              >
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{resource.name}</p>
                  <p className="text-xs text-muted-foreground">{resource.description}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-3" />
              </a>
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <div className="p-4 rounded-lg border border-border bg-secondary/20 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">Medical Disclaimer</p>
          <p>
            The resources listed on this page are provided for informational purposes only. Doctor Buddy is not a licensed
            mental health provider and does not provide medical advice, diagnosis, or treatment. If you are experiencing a
            mental health emergency, please contact emergency services or a licensed mental health professional immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
