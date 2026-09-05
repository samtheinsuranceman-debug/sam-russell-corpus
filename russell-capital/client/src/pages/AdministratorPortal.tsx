import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, KeyRound, Users, BarChart3, Settings, Activity, FileText, Eye, Database, Globe, Clock } from "lucide-react";
import { toast } from "sonner";
import { isOwnerBypassEmail } from "@shared/accessControl";

type Step = "email" | "pin" | "dashboard";

interface AdminStats {
  totalUsers: number;
  totalClients: number;
  totalDeals: number;
  totalTrialLogins: number;
  totalScenarios: number;
}

interface UserRecord {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  loginMethod: string | null;
  loginCount: number;
  createdAt: string;
  lastSignedIn: string;
  onboardingCompleted: boolean;
}

export default function AdministratorPortal() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [userId, setUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pinExpiry, setPinExpiry] = useState<string | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [userList, setUserList] = useState<UserRecord[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "activity" | "settings">("overview");
  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user is already authenticated as admin, skip to dashboard
  useEffect(() => {
    if (!authLoading && user && user.role === "admin") {
      if (user.email && isOwnerBypassEmail(user.email)) {
        setStep("dashboard");
        loadAdminData();
      }
    }
  }, [authLoading, user]);

  const loadAdminData = async () => {
    setLoadingStats(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
      ]);
      if (statsRes.ok) {
        const stats = await statsRes.json();
        setAdminStats(stats);
      }
      if (usersRes.ok) {
        const users = await usersRes.json();
        setUserList(users);
      }
    } catch (e) {
      console.error("Failed to load admin data:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  // Step 1: Verify email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || "Access denied");
        return;
      }
      setUserId(data.userId);
      setPinExpiry(data.expiresAt);
      setStep("pin");
      toast.success("Verification PIN sent to your registered phone");
      // Focus first PIN input
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify PIN
  const handlePinSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const pinCode = pin.join("");
    if (pinCode.length !== 4) {
      setError("Please enter the complete 4-digit PIN");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pin: pinCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid PIN");
        setPin(["", "", "", ""]);
        setTimeout(() => pinRefs.current[0]?.focus(), 100);
        return;
      }
      toast.success("Administrator access granted");
      setStep("dashboard");
      loadAdminData();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // PIN input handling
  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    if (value && index < 3) {
      pinRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 4 digits entered
    if (index === 3 && value) {
      const fullPin = newPin.join("");
      if (fullPin.length === 4) {
        setTimeout(() => handlePinSubmit(), 100);
      }
    }
  };

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs.current[index - 1]?.focus();
    }
  };

  // ─── Email Step ─────────────────────────────────────────────────────────────
  if (step === "email") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-500/25 mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Administrator Portal</h1>
            <p className="text-red-400/80 text-sm mt-1">Russell Capital Solutions™ — Restricted Access</p>
          </div>

          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-red-400" />
                Step 1: Identity Verification
              </CardTitle>
              <CardDescription className="text-slate-400">
                Enter your administrator email address
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-slate-300">Administrator Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="sam@russellcapitalsystems.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-red-500 focus:ring-red-500/20"
                      autoComplete="email"
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-2.5 shadow-lg shadow-red-500/25"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Continue <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <p className="text-slate-500 text-xs text-center">
                  This portal is exclusively for the site administrator.
                  <br />Unauthorized access attempts are logged.
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-slate-600 text-xs mt-6">
            &copy; {new Date().getFullYear()} Russell Capital Solutions™
          </p>
        </div>
      </div>
    );
  }

  // ─── PIN Step ───────────────────────────────────────────────────────────────
  if (step === "pin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/30 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/10 via-transparent to-transparent" />
        <div className="relative w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 shadow-lg shadow-red-500/25 mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Verify Your Identity</h1>
            <p className="text-red-400/80 text-sm mt-1">Enter the 4-digit PIN sent to your phone</p>
          </div>

          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" />
                Step 2: SMS Verification
              </CardTitle>
              <CardDescription className="text-slate-400">
                A 4-digit PIN was sent to your registered phone number ending in ****0594
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex justify-center gap-3">
                  {pin.map((digit, i) => (
                    <Input
                      key={i}
                      ref={(el) => { pinRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handlePinChange(i, e.target.value)}
                      onKeyDown={(e) => handlePinKeyDown(i, e)}
                      className="w-14 h-14 text-center text-2xl font-bold bg-slate-800/50 border-slate-700 text-white focus:border-red-500 focus:ring-red-500/20"
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                {pinExpiry && (
                  <p className="text-slate-500 text-xs text-center">
                    PIN expires at {new Date(pinExpiry).toLocaleTimeString()}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading || pin.join("").length !== 4}
                  className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-2.5 shadow-lg shadow-red-500/25"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying PIN...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Verify &amp; Enter
                    </div>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setPin(["", "", "", ""]);
                      setError("");
                    }}
                    className="text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    &larr; Back to email
                  </button>
                  <span className="mx-3 text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => {
                      setPin(["", "", "", ""]);
                      setError("");
                      handleEmailSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Resend PIN
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Admin Dashboard ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Administrator Portal</h1>
              <p className="text-xs text-slate-500">Russell Capital Solutions™</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">
              {user?.email || email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/portal/dashboard")}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              Advisor Portal
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {[
              { id: "overview" as const, label: "Overview", icon: BarChart3 },
              { id: "users" as const, label: "User Management", icon: Users },
              { id: "activity" as const, label: "Site Activity", icon: Activity },
              { id: "settings" as const, label: "Site Settings", icon: Settings },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-red-500 text-red-400"
                    : "border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: adminStats?.totalUsers ?? "—", icon: Users, color: "from-blue-600 to-blue-500" },
                { label: "Total Clients", value: adminStats?.totalClients ?? "—", icon: FileText, color: "from-emerald-600 to-emerald-500" },
                { label: "Total Deals", value: adminStats?.totalDeals ?? "—", icon: BarChart3, color: "from-purple-600 to-purple-500" },
                { label: "Trial Logins", value: adminStats?.totalTrialLogins ?? "—", icon: Eye, color: "from-amber-600 to-amber-500" },
                { label: "Scenarios", value: adminStats?.totalScenarios ?? "—", icon: Database, color: "from-red-600 to-red-500" },
              ].map((stat) => (
                <Card key={stat.label} className="bg-slate-900/60 border-slate-800">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-white">{loadingStats ? "..." : stat.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Links */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "Website Usage Logs", desc: "View user activity, session logs, and compliance records", path: "/portal/website-usage", icon: Activity },
                  { label: "Enterprise Admin", desc: "Workspace metrics, audit logs, and admin actions", path: "/portal/enterprise", icon: Globe },
                  { label: "Commission Tracker", desc: "Track advisor commissions and revenue projections", path: "/portal/commission-tracker", icon: BarChart3 },
                  { label: "Compliance Audit", desc: "Review compliance signatures and disclosure records", path: "/portal/compliance-audit", icon: FileText },
                  { label: "Team Management", desc: "Manage team members, roles, and permissions", path: "/portal/team-management", icon: Users },
                  { label: "Billing & Subscriptions", desc: "Manage subscription plans and payment settings", path: "/portal/billing", icon: Settings },
                ].map((link) => (
                  <Card
                    key={link.path}
                    className="bg-slate-900/60 border-slate-800 hover:border-red-500/30 transition-colors cursor-pointer group"
                    onClick={() => navigate(link.path)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-red-500/10 transition-colors">
                          <link.icon className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white group-hover:text-red-400 transition-colors">{link.label}</h3>
                          <p className="text-xs text-slate-500 mt-1">{link.desc}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div>
              <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-white">Application Server</p>
                        <p className="text-xs text-slate-500">Running — healthy</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-white">Database</p>
                        <p className="text-xs text-slate-500">Connected — responsive</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                      <div>
                        <p className="text-sm font-medium text-white">Domain</p>
                        <p className="text-xs text-slate-500">www.russellcapitalsystems.com — active</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Registered Users</h2>
              <span className="text-sm text-slate-500">{userList.length} total</span>
            </div>
            <Card className="bg-slate-900/60 border-slate-800">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">User</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Role</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Login Method</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Logins</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Last Active</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-6 py-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingStats ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Loading users...</td></tr>
                      ) : userList.length === 0 ? (
                        <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No users found</td></tr>
                      ) : (
                        userList.map((u) => (
                          <tr key={u.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                            <td className="px-6 py-4">
                              <div>
                                <p className="text-sm font-medium text-white">{u.name || "—"}</p>
                                <p className="text-xs text-slate-500">{u.email || "—"}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                u.role === "admin" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-slate-700/50 text-slate-400"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">{u.loginMethod || "—"}</td>
                            <td className="px-6 py-4 text-sm text-slate-400">{u.loginCount}</td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Site Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 border-slate-800 cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => navigate("/portal/website-usage")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Website Usage Logs</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    View detailed user session logs, page activity, time spent on each tool, and compliance records.
                    Password-protected for administrator access only.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800 cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => navigate("/portal/compliance-audit-trail")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Compliance Audit Trail</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Review all compliance signatures, legal disclaimers, and e-signature records.
                    Full audit trail for regulatory compliance.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800 cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => navigate("/portal/enterprise")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Enterprise Dashboard</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Workspace metrics, seat utilization, and enterprise-level audit logs.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800 cursor-pointer hover:border-red-500/30 transition-colors" onClick={() => navigate("/portal/owner-oversight")}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Eye className="w-6 h-6 text-red-400" />
                    <h3 className="text-lg font-semibold text-white">Owner Oversight</h3>
                  </div>
                  <p className="text-sm text-slate-400">
                    Real-time monitoring of advisor activities, client interactions, and platform usage patterns.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Site Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Subscription Gate</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Status</span>
                      <span className="text-sm font-medium text-amber-400">Deferred (Open Access)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Re-enable Date</span>
                      <span className="text-sm text-slate-300">May 10, 2026</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Owner Exempt</span>
                      <span className="text-sm font-medium text-emerald-400">Always (Permanent)</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800">
                      All users currently have free access after agreeing to the compliance disclaimer.
                      When re-enabled, the owner's email remains permanently exempt.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Domain Configuration</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Primary Domain</span>
                      <span className="text-sm text-emerald-400">www.russellcapitalsystems.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Redirect Domains</span>
                      <span className="text-sm text-slate-300">russellcap.com, www.russellcap.com</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">SSL</span>
                      <span className="text-sm font-medium text-emerald-400">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Administrator Accounts</h3>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-sm font-medium text-white">samtheinsuranceman@gmail.com</p>
                      <p className="text-xs text-slate-500 mt-1">Primary — Auto-login, unlimited access, admin role</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                      <p className="text-sm font-medium text-white">sam@russellcapitalsystems.com</p>
                      <p className="text-xs text-slate-500 mt-1">Secondary — 2FA admin portal, unlimited access, admin role</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-800">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Compliance</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">AG49 Disclosure</span>
                      <span className="text-sm text-emerald-400">Active (1 per page)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">Terms Gate</span>
                      <span className="text-sm text-emerald-400">Active (all users)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">E-Signature</span>
                      <span className="text-sm text-emerald-400">Required on every login</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
