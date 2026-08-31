// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Lock,
  Unlock,
  KeyRound,
  Mail,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  Scale,
  TrendingUp,
  TrendingDown,
  Coins,
  PiggyBank,
  BarChart3,
  Calculator,
  Brain,
  Clock,
  Wallet,
  AlertTriangle,
  Database,
  Search,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Filter,
  Calendar,
  Activity,
  Zap,
  Server,
  ShieldAlert,
  Globe,
  Layout,
  PieChartIcon,
  Folder,
  Box,
  LayoutDashboard,
  Layers,
  Monitor,
  HardDrive,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
  LineChart, Line, PieChart, Pie, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Legend
} from "recharts";

const HIDDEN_PAGES = [
  {
    category: "Strategy Calculators",
    pages: [
      { path: "/portal/iul-vs-roth", label: "IUL vs Roth (Original)", icon: Scale, description: "Original IUL vs Roth comparison calculator", views: 1250, status: "Archived", lastAccessed: "2026-03-15", size: "1.2MB" },
      { path: "/portal/tax-waterfall", label: "Tax Waterfall (Original)", icon: TrendingDown, description: "Original tax waterfall analysis", views: 850, status: "Archived", lastAccessed: "2026-02-28", size: "0.8MB" },
      { path: "/portal/crypto-corner", label: "Crypto Currency Corner (Original)", icon: Coins, description: "Original cryptocurrency analysis tools", views: 420, status: "Archived", lastAccessed: "2026-01-10", size: "2.1MB" },
    ],
  },
  {
    category: "Annuity Calculators",
    pages: [
      { path: "/portal/lifetime-income", label: "Lifetime Guaranteed Income (Original)", icon: Shield, description: "Original lifetime income calculator", views: 2100, status: "Archived", lastAccessed: "2026-04-01", size: "1.5MB" },
      { path: "/portal/existing-annuities", label: "Your Existing Annuities (Original)", icon: PiggyBank, description: "Original existing annuity review", views: 1800, status: "Archived", lastAccessed: "2026-03-22", size: "1.1MB" },
      { path: "/portal/growth-annuities", label: "Growth Annuities (Original)", icon: TrendingUp, description: "Original growth annuity calculator", views: 1650, status: "Archived", lastAccessed: "2026-03-18", size: "1.3MB" },
    ],
  },
  {
    category: "Other Calculators",
    pages: [
      { path: "/portal/income-timeline", label: "Income Timeline (Original)", icon: Clock, description: "Original income timeline projections", views: 920, status: "Archived", lastAccessed: "2026-02-15", size: "0.9MB" },
      { path: "/portal/index-backtester", label: "Index Backtester (Original)", icon: BarChart3, description: "Original index backtesting tool", views: 1450, status: "Archived", lastAccessed: "2026-03-05", size: "3.2MB" },
      { path: "/portal/policy-loans", label: "Policy Loans (Original)", icon: Wallet, description: "Original policy loan calculator", views: 780, status: "Archived", lastAccessed: "2026-01-20", size: "0.7MB" },
      { path: "/portal/strategy", label: "Strategy Lab (Original)", icon: Brain, description: "Original strategy lab", views: 2200, status: "Archived", lastAccessed: "2026-04-10", size: "4.5MB" },
    ],
  },
  {
    category: "Annuity Data",
    pages: [
      { path: "/portal/annuity-memory", label: "Annuity Memory — 50-State Database", icon: Database, description: "Complete 50-state annuity data store with guaranty limits, product rankings, and availability", views: 3500, status: "Active", lastAccessed: "2026-04-12", size: "15.8MB" },
    ],
  },
  {
    category: "Internal Tools",
    pages: [
      { path: "/portal/commission-tracker", label: "Commission Tracker", icon: Wallet, description: "Commission tracking dashboard with deal-level breakdowns", views: 4200, status: "Active", lastAccessed: "2026-04-12", size: "5.2MB" },
      { path: "/portal/commission-calculator", label: "Commission Calculator", icon: Calculator, description: "Multi-product commission tracking with team splits and projections", views: 3800, status: "Active", lastAccessed: "2026-04-11", size: "2.8MB" },
      { path: "/portal/pipeline", label: "Deals Pipeline", icon: BarChart3, description: "Deal tracking kanban board with smart closing scripts and stage management", views: 5100, status: "Active", lastAccessed: "2026-04-12", size: "8.4MB" },
    ],
  },
];

const ACCESS_LOGS = [
  { id: 1, user: "admin@russellcapital.com", action: "Viewed Tax Waterfall", ip: "192.168.1.105", date: "2026-04-12 10:23:45", status: "Success" },
  { id: 2, user: "j.smith@russellcapital.com", action: "Exported Index Backtester Data", ip: "10.0.0.52", date: "2026-04-11 14:15:22", status: "Success" },
  { id: 3, user: "unknown", action: "Failed Login Attempt", ip: "45.22.19.101", date: "2026-04-11 09:05:11", status: "Failed" },
  { id: 4, user: "admin@russellcapital.com", action: "Unlocked Hidden Material", ip: "192.168.1.105", date: "2026-04-10 16:45:00", status: "Success" },
  { id: 5, user: "m.johnson@russellcapital.com", action: "Viewed Strategy Lab", ip: "10.0.0.88", date: "2026-04-09 11:30:15", status: "Success" },
  { id: 6, user: "admin@russellcapital.com", action: "Downloaded Annuity Database", ip: "192.168.1.105", date: "2026-04-08 15:20:10", status: "Success" },
];

const SYSTEM_HEALTH_DATA = [
  { time: "00:00", cpu: 45, memory: 60, network: 25 },
  { time: "04:00", cpu: 30, memory: 55, network: 15 },
  { time: "08:00", cpu: 65, memory: 75, network: 55 },
  { time: "12:00", cpu: 85, memory: 85, network: 80 },
  { time: "16:00", cpu: 70, memory: 80, network: 65 },
  { time: "20:00", cpu: 50, memory: 65, network: 35 },
];

const CATEGORY_DISTRIBUTION = [
  { name: "Strategy", value: 3, color: "#3b82f6" },
  { name: "Annuity", value: 3, color: "#10b981" },
  { name: "Other", value: 4, color: "#f59e0b" },
  { name: "Data", value: 1, color: "#8b5cf6" },
  { name: "Internal", value: 3, color: "#ef4444" },
];

const VIEWS_BY_CATEGORY = [
  { category: "Strategy", views: 2520 },
  { category: "Annuity", views: 5550 },
  { category: "Other", views: 5350 },
  { category: "Data", views: 3500 },
  { category: "Internal", views: 13100 },
];

const ARCHIVE_GROWTH = [
  { month: "Jan", items: 5, size: 12 },
  { month: "Feb", items: 8, size: 18 },
  { month: "Mar", items: 12, size: 28 },
  { month: "Apr", items: 14, size: 35 },
];

const SECURITY_METRICS = [
  { subject: "Authentication", A: 95, B: 80, fullMark: 100 },
  { subject: "Encryption", A: 100, B: 90, fullMark: 100 },
  { subject: "Access Control", A: 85, B: 75, fullMark: 100 },
  { subject: "Audit Logging", A: 90, B: 85, fullMark: 100 },
  { subject: "Vulnerability", A: 80, B: 70, fullMark: 100 },
  { subject: "Compliance", A: 95, B: 90, fullMark: 100 },
];

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (dateString: string) => {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(undefined, options);
};

function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<"request" | "verify">("request");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  const verifyMut = trpc.hiddenMaterial.verifyPassword.useMutation();
  const requestResetMut = trpc.hiddenMaterial.requestResetCode.useMutation();
  const resetPasswordMut = trpc.hiddenMaterial.resetPassword.useMutation();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLockedOut && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    } else if (isLockedOut && lockoutTimer === 0) {
      setIsLockedOut(false);
      setLoginAttempts(0);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) {
      toast.error(`Account locked. Try again in ${lockoutTimer} seconds.`);
      return;
    }

    setError("");
    try {
      const result = await verifyMut.mutateAsync({ password });
      if (result.verified) {
        toast.success("Access granted");
        setLoginAttempts(0);
        onUnlock();
      }
    } catch (err: any) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 5) {
        setIsLockedOut(true);
        setLockoutTimer(300); // 5 minutes
        toast.error("Too many failed attempts. Account locked for 5 minutes.");
      } else {
        const msg = err?.message ?? "Incorrect password";
        setError(msg);
        toast.error(`${msg}. ${5 - newAttempts} attempts remaining.`);
      }
    }
  };

  const handleRequestReset = async () => {
    try {
      const result = await requestResetMut.mutateAsync();
      toast.success(result.message);
      setResetStep("verify");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to send reset code");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    try {
      await resetPasswordMut.mutateAsync({ code: resetCode, newPassword });
      toast.success("Password reset successfully! You can now log in with your new password.");
      setShowReset(false);
      setResetStep("request");
      setResetCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to reset password");
    }
  };

  if (showReset) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="rc-card w-full max-w-md border-[#f0c040]/30 bg-gradient-to-b from-[#0d1a2e] to-[#060d19] shadow-2xl shadow-[#f0c040]/10">
          <div className="text-center pb-6 border-b border-[#1a2e4c] mb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-[#f0c040]/20 to-[#f0c040]/5 flex items-center justify-center mb-4 ring-4 ring-[#f0c040]/10">
              <KeyRound className="w-10 h-10 text-[#f0c040]" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Reset Password</h2>
            <p className="text-sm text-[#7a95b8] mt-2 max-w-[280px] mx-auto">
              {resetStep === "request"
                ? "A 6-digit verification code will be sent to the registered email address."
                : "Enter the 6-digit code from your email and set a new secure password."}
            </p>
          </div>
          <div className="pt-2">
            {resetStep === "request" ? (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-400 font-medium uppercase tracking-wider mb-1">Recovery Email</p>
                    <p className="text-sm text-[#c8d8ec] font-mono">sam***@gmail.com</p>
                  </div>
                </div>
                <button
                  onClick={handleRequestReset}
                  className="rc-btn rc-btn-primary w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] hover:from-[#f0c040]/90 hover:to-[#d4a017]/90 text-black border-none py-3 text-base font-semibold shadow-lg shadow-[#f0c040]/20 transition-all hover:scale-[1.02]"
                  disabled={requestResetMut.isPending}
                >
                  {requestResetMut.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" /> Sending...
                    </span>
                  ) : "Send Verification Code"}
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="rc-btn rc-btn-ghost w-full text-[#7a95b8] hover:text-white py-3 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#f0c040]" /> Verification Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="------"
                    className="rc-input text-center text-3xl tracking-[0.5em] font-mono py-4 bg-[#0a1526] border-[#1a2e4c] focus:border-[#f0c040] focus:ring-[#f0c040]/20"
                    maxLength={6}
                  />
                </div>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-sm font-medium text-[#c8d8ec] mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        className="rc-input pr-10 bg-[#0a1526] border-[#1a2e4c]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Confirm Password</label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="rc-input bg-[#0a1526] border-[#1a2e4c]"
                    />
                  </div>
                </div>
                <div className="pt-2">
                  <button
                    type="submit"
                    className="rc-btn rc-btn-primary w-full bg-gradient-to-r from-[#f0c040] to-[#d4a017] hover:from-[#f0c040]/90 hover:to-[#d4a017]/90 text-black border-none py-3 text-base font-semibold shadow-lg shadow-[#f0c040]/20 transition-all hover:scale-[1.02]"
                    disabled={resetPasswordMut.isPending || resetCode.length !== 6 || !newPassword || !confirmPassword}
                  >
                    {resetPasswordMut.isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin" /> Resetting...
                      </span>
                    ) : "Reset Password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setResetStep("request"); setResetCode(""); }}
                    className="rc-btn rc-btn-ghost w-full text-[#7a95b8] hover:text-white mt-2"
                  >
                    Resend Code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="rc-card w-full max-w-md border-red-500/30 bg-gradient-to-b from-[#0d1a2e] to-[#060d19] shadow-2xl shadow-red-500/10">
        <div className="text-center pb-6 border-b border-[#1a2e4c] mb-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mb-4 ring-4 ring-red-500/10">
            <Lock className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Restricted Area</h2>
          <p className="text-sm text-[#7a95b8] mt-2 max-w-[280px] mx-auto">
            This section contains archived and internal tools. Please enter the master password to continue.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#c8d8ec] mb-2 flex items-center justify-between">
              <span>Master Password</span>
              {isLockedOut && (
                <span className="text-red-400 text-xs font-mono bg-red-400/10 px-2 py-1 rounded">
                  Locked: {Math.floor(lockoutTimer / 60)}:{(lockoutTimer % 60).toString().padStart(2, '0')}
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Enter master password"
                className={`rc-input pr-10 py-3 bg-[#0a1526] text-lg ${error ? "border-red-500 focus:ring-red-500/20" : "border-[#1a2e4c]"}`}
                disabled={isLockedOut}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white transition-colors"
                disabled={isLockedOut}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                <AlertTriangle className="w-4 h-4" /> {error}
              </p>
            )}
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              className={`rc-btn rc-btn-primary w-full py-3 text-base font-semibold transition-all ${
                isLockedOut 
                  ? "bg-[#1a2e4c] text-[#7a95b8] cursor-not-allowed border-none" 
                  : "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white border-none shadow-lg shadow-red-500/20 hover:scale-[1.02]"
              }`}
              disabled={verifyMut.isPending || !password || isLockedOut}
            >
              {verifyMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Verifying...
                </span>
              ) : isLockedOut ? (
                <span className="flex items-center justify-center gap-2">
                  <Lock className="w-5 h-5" /> Account Locked
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Unlock className="w-5 h-5" /> Unlock Access
                </span>
              )}
            </button>
          </div>
          
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setShowReset(true)}
              className="text-sm text-[#7a95b8] hover:text-[#f0c040] transition-colors flex items-center justify-center gap-1.5 mx-auto"
            >
              <KeyRound className="w-4 h-4" /> Forgot master password?
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UnlockedContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"directory" | "analytics" | "system" | "logs">("directory");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { data: serverStatus, refetch: refetchStatus } = trpc.hiddenMaterial.getServerStatus.useQuery(undefined, {
    enabled: activeTab === "system",
  });
  
  const { data: analyticsData } = trpc.hiddenMaterial.getAnalytics.useQuery(undefined, {
    enabled: activeTab === "analytics",
  });

  const { data: auditLogs } = trpc.hiddenMaterial.getAuditLogs.useQuery({ limit: 50 }, {
    enabled: activeTab === "logs",
  });

  const handleRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    refetchStatus();
    toast.success("Data refreshed");
  }, [refetchStatus]);

  const filteredPages = useMemo(() => {
    return HIDDEN_PAGES.map((section) => ({
      ...section,
      pages: section.pages.filter((page) => 
        (page.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
         page.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (!selectedCategory || section.category === selectedCategory)
      )
    })).filter((section) => section.pages.length > 0);
  }, [searchTerm, selectedCategory]);

  const totalPages = useMemo(() => {
    return HIDDEN_PAGES.reduce((sum, section) => sum + section.pages.length, 0);
  }, []);

  const totalViews = useMemo(() => {
    return HIDDEN_PAGES.reduce((sum, section) => 
      sum + section.pages.reduce((pSum, page) => pSum + page.views, 0)
    , 0);
  }, []);

  const activePages = useMemo(() => {
    return HIDDEN_PAGES.reduce((sum, section) => 
      sum + section.pages.filter((p) => p.status === "Active").length
    , 0);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1526] border-[#1a2e4c]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-sm font-medium text-[#7a95b8]">Total Archives</h3>
          </div>
          <div className="text-2xl font-bold text-white">{totalPages}</div>
          <div className="text-xs text-[#7a95b8] mt-1">Across {HIDDEN_PAGES.length} categories</div>
        </div>
        
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1526] border-[#1a2e4c]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Eye className="w-5 h-5 text-green-400" />
            </div>
            <h3 className="text-sm font-medium text-[#7a95b8]">Total Views</h3>
          </div>
          <div className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</div>
          <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +12% this month
          </div>
        </div>
        
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1526] border-[#1a2e4c]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-sm font-medium text-[#7a95b8]">Active Tools</h3>
          </div>
          <div className="text-2xl font-bold text-white">{activePages}</div>
          <div className="text-xs text-[#7a95b8] mt-1">{totalPages - activePages} archived</div>
        </div>
        
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1526] border-[#1a2e4c]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-sm font-medium text-[#7a95b8]">Security Status</h3>
          </div>
          <div className="text-2xl font-bold text-green-400 flex items-center gap-2">
            Secure <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="text-xs text-[#7a95b8] mt-1">Last audit: Today</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#1a2e4c] pb-px">
        <button
          onClick={() => setActiveTab("directory")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "directory" 
              ? "border-red-500 text-white bg-red-500/5" 
              : "border-transparent text-[#7a95b8] hover:text-white hover:bg-white/5"
          }`}
        >
          <Folder className="w-4 h-4" /> Archive Directory
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "analytics" 
              ? "border-red-500 text-white bg-red-500/5" 
              : "border-transparent text-[#7a95b8] hover:text-white hover:bg-white/5"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics & Usage
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "system" 
              ? "border-red-500 text-white bg-red-500/5" 
              : "border-transparent text-[#7a95b8] hover:text-white hover:bg-white/5"
          }`}
        >
          <Server className="w-4 h-4" /> System Health
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "logs" 
              ? "border-red-500 text-white bg-red-500/5" 
              : "border-transparent text-[#7a95b8] hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-4 h-4" /> Audit Logs
        </button>
      </div>

      {/* Tab Content: Directory */}
      {activeTab === "directory" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Controls */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0d1a2e] p-4 rounded-xl border border-[#1a2e4c]">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
              <input
                type="text"
                placeholder="Search archives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rc-input pl-9 w-full bg-[#0a1526] border-[#1a2e4c]"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              <div className="flex items-center gap-1 bg-[#0a1526] p-1 rounded-lg border border-[#1a2e4c]">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#1a2e4c] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  title="Grid View"
                >
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#1a2e4c] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  title="List View"
                >
                  <Layout className="w-4 h-4" />
                </button>
              </div>
              
              <div className="h-6 w-px bg-[#1a2e4c]"></div>
              
              <select
                value={selectedCategory || ""}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="rc-input bg-[#0a1526] border-[#1a2e4c] py-2 text-sm min-w-[150px]"
              >
                <option value="">All Categories</option>
                {HIDDEN_PAGES.map((c) => (
                  <option key={c.category} value={c.category}>{c.category}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredPages.length === 0 ? (
            <div className="text-center py-12 bg-[#0d1a2e] rounded-xl border border-[#1a2e4c] border-dashed">
              <div className="w-16 h-16 rounded-full bg-[#1a2e4c] flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-[#7a95b8]" />
              </div>
              <h3 className="text-lg font-medium text-white">No archives found</h3>
              <p className="text-[#7a95b8] mt-1">Try adjusting your search or category filter</p>
              <button 
                onClick={() => { setSearchTerm(""); setSelectedCategory(null); }}
                className="mt-4 rc-btn rc-btn-ghost text-red-400 hover:text-red-300"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {filteredPages.map((section, idx) => (
                <div key={idx} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#1a2e4c] pb-2">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-red-500" />
                      {section.category}
                    </h2>
                    <span className="rc-badge rc-badge-gray">{section.pages.length} items</span>
                  </div>
                  
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {section.pages.map((page, pIdx) => (
                        <Link key={pIdx} href={page.path}>
                          <div className="rc-card h-full group cursor-pointer hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 bg-[#0d1a2e] border-[#1a2e4c]">
                            <div className="flex items-start justify-between mb-4">
                              <div className="p-3 rounded-xl bg-[#1a2e4c] group-hover:bg-red-500/20 transition-colors">
                                <page.icon className="w-6 h-6 text-[#7a95b8] group-hover:text-red-400 transition-colors" />
                              </div>
                              <span className={`rc-badge text-xs ${page.status === 'Active' ? 'rc-badge-green' : 'rc-badge-gray'}`}>
                                {page.status}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-white mb-2 group-hover:text-red-400 transition-colors flex items-center gap-2">
                              {page.label}
                            </h3>
                            <p className="text-sm text-[#7a95b8] mb-4 line-clamp-2 min-h-[40px]">
                              {page.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-[#5c7394] pt-4 border-t border-[#1a2e4c]">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> {page.views.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <HardDrive className="w-3.5 h-3.5" /> {page.size}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {formatDate(page.lastAccessed)}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="rc-table-container">
                      <table className="rc-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th className="text-right">Views</th>
                            <th className="text-right">Size</th>
                            <th className="text-right">Last Accessed</th>
                            <th></th>
                          </tr>
                        </thead>
                        <tbody>
                          {section.pages.map((page, pIdx) => (
                            <tr key={pIdx} className="group hover:bg-[#1a2e4c]/30">
                              <td>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-[#1a2e4c] group-hover:bg-red-500/20 transition-colors">
                                    <page.icon className="w-4 h-4 text-[#7a95b8] group-hover:text-red-400" />
                                  </div>
                                  <span className="font-medium text-white group-hover:text-red-400 transition-colors">{page.label}</span>
                                </div>
                              </td>
                              <td className="text-[#7a95b8] max-w-xs truncate" title={page.description}>{page.description}</td>
                              <td>
                                <span className={`rc-badge text-xs ${page.status === 'Active' ? 'rc-badge-green' : 'rc-badge-gray'}`}>
                                  {page.status}
                                </span>
                              </td>
                              <td className="text-right text-[#c8d8ec]">{page.views.toLocaleString()}</td>
                              <td className="text-right text-[#c8d8ec]">{page.size}</td>
                              <td className="text-right text-[#c8d8ec]">{formatDate(page.lastAccessed)}</td>
                              <td className="text-right">
                                <Link href={page.path}>
                                  <button className="rc-btn rc-btn-ghost text-red-400 hover:text-red-300 p-2">
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Analytics */}
      {activeTab === "analytics" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution Chart */}
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-blue-400" /> Archive Distribution
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CATEGORY_DISTRIBUTION}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {CATEGORY_DISTRIBUTION.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#1a2e4c', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Views by Category Chart */}
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-400" /> Views by Category
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={VIEWS_BY_CATEGORY} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4c" vertical={false} />
                    <XAxis dataKey="category" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} />
                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#1a2e4c', color: '#fff' }}
                      cursor={{ fill: '#1a2e4c', opacity: 0.4 }}
                    />
                    <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {VIEWS_BY_CATEGORY.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Archive Growth Trend */}
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c] lg:col-span-2">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" /> Archive Growth Trend
              </h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={ARCHIVE_GROWTH} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4c" vertical={false} />
                    <XAxis dataKey="month" stroke="#7a95b8" />
                    <YAxis yAxisId="left" stroke="#7a95b8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#1a2e4c', color: '#fff' }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="items" name="Total Items" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="size" name="Storage Size (MB)" stroke="#f43f5e" strokeWidth={3} dot={{ r: 6, fill: '#0d1a2e', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: System Health */}
      {activeTab === "system" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">System Diagnostics</h2>
            <button onClick={handleRefresh} className="rc-btn rc-btn-ghost text-[#7a95b8] hover:text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh Data
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c] p-6 text-center">
              <Monitor className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">99.9%</div>
              <div className="text-sm text-[#7a95b8]">Server Uptime</div>
              <div className="mt-4 pt-4 border-t border-[#1a2e4c] text-xs text-green-400">Operational</div>
            </div>
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c] p-6 text-center">
              <Database className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">45ms</div>
              <div className="text-sm text-[#7a95b8]">Database Latency</div>
              <div className="mt-4 pt-4 border-t border-[#1a2e4c] text-xs text-green-400">Optimal</div>
            </div>
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c] p-6 text-center">
              <Globe className="w-8 h-8 text-green-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">12.4k</div>
              <div className="text-sm text-[#7a95b8]">Requests / Hour</div>
              <div className="mt-4 pt-4 border-t border-[#1a2e4c] text-xs text-[#7a95b8]">Normal Load</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Resource Usage Chart */}
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" /> Resource Utilization (24h)
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SYSTEM_HEALTH_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a2e4c" vertical={false} />
                    <XAxis dataKey="time" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#1a2e4c', color: '#fff' }}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="cpu" name="CPU %" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCpu)" />
                    <Area type="monotone" dataKey="memory" name="Memory %" stroke="#10b981" fillOpacity={1} fill="url(#colorMemory)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Security Radar Chart */}
            <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c]">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-400" /> Security Posture
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={SECURITY_METRICS}>
                    <PolarGrid stroke="#1a2e4c" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#1a2e4c" tick={{ fill: '#7a95b8' }} />
                    <Radar name="Current Posture" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                    <Radar name="Industry Baseline" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    <Legend />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#1a2e4c', color: '#fff' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: Audit Logs */}
      {activeTab === "logs" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rc-card bg-[#0d1a2e] border-[#1a2e4c] p-0 overflow-hidden">
            <div className="p-4 border-b border-[#1a2e4c] flex justify-between items-center bg-[#0a1526]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#7a95b8]" /> Access Audit Trail
              </h3>
              <div className="flex items-center gap-2">
                <button className="rc-btn rc-btn-ghost text-[#7a95b8] hover:text-white p-2">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="rc-btn rc-btn-ghost text-[#7a95b8] hover:text-white p-2">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="rc-table w-full">
                <thead className="bg-[#0a1526]">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Timestamp</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#7a95b8] uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Action</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#7a95b8] uppercase tracking-wider">IP Address</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2e4c]">
                  {(auditLogs || ACCESS_LOGS).map((log, idx) => (
                    <tr key={idx} className="hover:bg-[#1a2e4c]/30 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-[#c8d8ec] font-mono">{log.date}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-white">{log.user}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-[#c8d8ec]">{log.action}</td>
                      <td className="py-3 px-4 whitespace-nowrap text-sm text-[#7a95b8] font-mono">{log.ip}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'Success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {log.status === 'Success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-[#1a2e4c] bg-[#0a1526] flex justify-between items-center text-sm text-[#7a95b8]">
              <span>Showing {(auditLogs || ACCESS_LOGS).length} entries</span>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded bg-[#1a2e4c] text-white disabled:opacity-50" disabled>Previous</button>
                <button className="px-3 py-1 rounded bg-[#1a2e4c] text-white">Next</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Box */}
      <div className="mt-8 p-5 bg-gradient-to-br from-[#0d1a2e] to-[#0a1526] border border-[#1a2e4c] rounded-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <Database className="w-4 h-4 text-red-500" />
          About This Archive
        </h4>
        <p className="text-sm text-[#c8d8ec] leading-relaxed max-w-4xl relative z-10">
          These tools and calculators were the original systems used on the Russell Capital platform prior to the 2026 compliance update.
          They have been replaced with NAIC AG 49-A/B compliant versions that use proper "would have been" language, mandatory disclaimers, and educational framing.
          The new compliant versions are accessible from the main sidebar navigation. These legacy versions are maintained strictly for historical reference, 
          audit purposes, and internal analysis.
        </p>
      </div>
      
      <div className="mt-8">
        <NAICDisclaimer variant="compact" showsProjections showsCashValues />
      </div>
    </div>
  );
}

export default function HiddenMaterial() {
  const [unlocked, setUnlocked] = useState(false);
  const { user } = useAuth();

  const trackViewMut = trpc.hiddenMaterial.trackPageView.useMutation();
  
  useEffect(() => {
    if (unlocked && user) {
      trackViewMut.mutate({ page: "HiddenMaterial_Dashboard", userId: user.id }).catch(console.error);
    }
  }, [unlocked, user]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 md:p-6 pb-24">
        <div className="rc-page-header flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-red-600 to-red-800 rounded-xl shadow-lg shadow-red-900/30 border border-red-500/20">
                {unlocked ? <Unlock className="w-6 h-6 text-white" /> : <Lock className="w-6 h-6 text-white" />}
              </div>
              <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">Hidden Material</h1>
              {unlocked && (
                <span className="ml-3 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-xs font-medium text-green-400 flex items-center gap-1.5 animate-in fade-in">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                  Access Granted
                </span>
              )}
            </div>
            <p className="rc-page-subtitle text-base text-[#7a95b8] max-w-2xl">
              Password-protected archive of original calculators, legacy tools, and system diagnostics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unlocked && (
              <button 
                onClick={() => setUnlocked(false)}
                className="rc-btn rc-btn-ghost text-[#7a95b8] hover:text-red-400 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" /> Lock Session
              </button>
            )}
            <ExportToSlides
              toolName="Hidden Material"
              getSections={() => [{
                title: "Hidden Material Archive",
                items: [
                  { label: "Status", value: unlocked ? "Unlocked" : "Locked" },
                  { label: "Description", value: "Password-protected archive of original calculators and tools." },
                  { label: "Total Archived Items", value: HIDDEN_PAGES.reduce((sum, section) => sum + section.pages.length, 0).toString() },
                  { label: "Categories", value: HIDDEN_PAGES.length.toString() }
                ]
              }]}
            />
          </div>
        </div>

        <div className="relative">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px]"></div>
          </div>
          
          <div className="relative z-10">
            {unlocked ? <UnlockedContent /> : <PasswordGate onUnlock={() => setUnlocked(true)} />}
          </div>
        </div>
      </div>
      <PageInsights pageId="hidden-material" />
    </AppShell>
  );
}
