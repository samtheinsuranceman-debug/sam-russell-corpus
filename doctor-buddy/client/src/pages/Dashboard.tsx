import { useLocation } from "wouter";
import { Brain, FileText, BookOpen, Heart, Activity, Map, Calendar, Shield, LogIn } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const { data: reports } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated });
  const { data: assessments } = trpc.assessment.myAssessments.useQuery(undefined, { enabled: isAuthenticated });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-16 text-center">
          <Brain className="w-8 h-8 text-primary animate-pulse mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-16 text-center max-w-md mx-auto">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground text-sm mb-6">Create a free account to save your assessments, track your mental health journey, and share reports with your provider.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground">
              <LogIn className="w-4 h-4 mr-2" /> Sign In / Create Account
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const quickLinks = [
    { label: "Start Assessment", href: "/assessment", icon: Brain, color: "text-primary" },
    { label: "Research Library", href: "/research", icon: BookOpen, color: "text-blue-400" },
    { label: "Vital Signs", href: "/vital-signs", icon: Activity, color: "text-green-400" },
    { label: "Risk Score", href: "/prs", icon: Map, color: "text-yellow-400" },
    { label: "Crisis Resources", href: "/crisis", icon: Heart, color: "text-red-400" },
    { label: "Life Maps", href: "/life-maps", icon: Calendar, color: "text-purple-400" },
    ...(user?.role === "admin" ? [{ label: "Admin Audit Panel", href: "/admin", icon: Shield, color: "text-red-400" }] : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.name?.split(" ")[0] || "User"}</h1>
          <p className="text-muted-foreground text-sm mt-1">Your personal health intelligence dashboard</p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
          {quickLinks.map(({ label, href, icon: Icon, color }) => (
            <button key={href} onClick={() => navigate(href)}
              className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:bg-secondary/30 transition-all text-left card-hover">
              <Icon className={`w-5 h-5 ${color} flex-shrink-0`} />
              <span className="text-sm font-medium text-foreground">{label}</span>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Reports */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> My Diagnostic Reports
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!reports || reports.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No reports yet</p>
                  <Button size="sm" onClick={() => navigate("/assessment")} className="bg-primary text-primary-foreground">
                    Start Assessment
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {(reports as any[]).slice(0, 5).map((r: any) => (
                    <button key={r.id} onClick={() => navigate(`/report/${r.id}`)}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border hover:border-primary/50 transition-colors text-left">
                      <div>
                        <p className="text-sm font-medium text-foreground">Assessment Report #{r.id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="outline" className="text-xs border-primary/30 text-primary">View</Badge>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Assessments */}
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" /> Assessment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!assessments || assessments.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No assessments completed</p>
                  <Button size="sm" onClick={() => navigate("/assessment")} className="bg-primary text-primary-foreground">
                    Take Assessment
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  {(assessments as any[]).slice(0, 5).map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">Assessment #{a.id}</p>
                        <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()} · {a.currentQuestionIndex}/100 questions</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${a.status === "completed" ? "border-primary/30 text-primary" : "border-yellow-500/30 text-yellow-400"}`}>
                        {a.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
