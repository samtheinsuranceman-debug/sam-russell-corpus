// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  UserPlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Shield,
  DollarSign,
  Target,
  Briefcase,
  FileText,
  Zap,
  Search,
  Download,
  Activity,
  Clock,
  AlertTriangle,
  CheckSquare,
  Calendar,
  Mail,
  Phone,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  FileSignature,
  Lock,
  BarChart2,
  Server,
} from "lucide-react";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Legend
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface OnboardingStep {
  id: number;
  title: string;
  icon: any;
  description: string;
  fields: { label: string; type: string; placeholder: string; key: string; options?: string[] }[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1, title: "Personal Information", icon: UserPlus, description: "Basic client contact and demographic information",
    fields: [
      { label: "First Name", type: "text", placeholder: "John", key: "firstName" },
      { label: "Last Name", type: "text", placeholder: "Smith", key: "lastName" },
      { label: "Email Address", type: "email", placeholder: "john@example.com", key: "email" },
      { label: "Phone Number", type: "tel", placeholder: "(555) 123-4567", key: "phone" },
      { label: "Date of Birth", type: "date", placeholder: "", key: "dob" },
      { label: "SSN (last 4)", type: "text", placeholder: "1234", key: "ssn4" },
      { label: "Marital Status", type: "select", placeholder: "Select…", key: "maritalStatus", options: ["Single", "Married", "Divorced", "Widowed"] },
      { label: "Number of Dependents", type: "number", placeholder: "0", key: "dependents" },
      { label: "Address Line 1", type: "text", placeholder: "123 Main St", key: "address1" },
      { label: "Address Line 2", type: "text", placeholder: "Apt 4B", key: "address2" },
      { label: "City", type: "text", placeholder: "New York", key: "city" },
      { label: "State", type: "text", placeholder: "NY", key: "state" },
      { label: "Zip Code", type: "text", placeholder: "10001", key: "zip" },
      { label: "Country", type: "text", placeholder: "USA", key: "country" },
    ]
  },
  {
    id: 2, title: "Employment & Income", icon: Briefcase, description: "Current employment and income details",
    fields: [
      { label: "Employer", type: "text", placeholder: "Acme Corporation", key: "employer" },
      { label: "Occupation", type: "text", placeholder: "Senior Engineer", key: "occupation" },
      { label: "Annual Income", type: "number", placeholder: "150000", key: "annualIncome" },
      { label: "Employment Status", type: "select", placeholder: "Select…", key: "employmentStatus", options: ["Employed", "Self-Employed", "Retired", "Unemployed"] },
      { label: "Years at Current Employer", type: "number", placeholder: "5", key: "yearsEmployed" },
      { label: "Filing Status", type: "select", placeholder: "Select…", key: "filingStatus", options: ["Single", "Married Filing Jointly", "Married Filing Separately", "Head of Household"] },
      { label: "Industry", type: "text", placeholder: "Technology", key: "industry" },
      { label: "Bonus/Commission", type: "number", placeholder: "20000", key: "bonus" },
    ]
  },
  {
    id: 3, title: "Financial Profile", icon: DollarSign, description: "Current assets, liabilities, and net worth",
    fields: [
      { label: "Total Investable Assets", type: "number", placeholder: "500000", key: "investableAssets" },
      { label: "Retirement Accounts (401k/IRA)", type: "number", placeholder: "250000", key: "retirementAccounts" },
      { label: "Real Estate Equity", type: "number", placeholder: "200000", key: "realEstateEquity" },
      { label: "Outstanding Mortgage", type: "number", placeholder: "300000", key: "mortgage" },
      { label: "Other Debts", type: "number", placeholder: "15000", key: "otherDebts" },
      { label: "Monthly Expenses", type: "number", placeholder: "8000", key: "monthlyExpenses" },
      { label: "Cash Savings", type: "number", placeholder: "50000", key: "cashSavings" },
      { label: "Brokerage Accounts", type: "number", placeholder: "100000", key: "brokerageAccounts" },
    ]
  },
  {
    id: 4, title: "Risk Profile & Goals", icon: Target, description: "Investment objectives and risk tolerance",
    fields: [
      { label: "Investment Objective", type: "select", placeholder: "Select…", key: "investmentObjective", options: ["Capital Preservation", "Income", "Growth & Income", "Growth", "Aggressive Growth"] },
      { label: "Risk Tolerance", type: "select", placeholder: "Select…", key: "riskTolerance", options: ["Conservative", "Moderately Conservative", "Moderate", "Moderately Aggressive", "Aggressive"] },
      { label: "Time Horizon", type: "select", placeholder: "Select…", key: "timeHorizon", options: ["Less than 3 years", "3-5 years", "5-10 years", "10-20 years", "20+ years"] },
      { label: "Primary Financial Goal", type: "select", placeholder: "Select…", key: "primaryGoal", options: ["Retirement Planning", "Wealth Accumulation", "Education Funding", "Estate Planning", "Tax Optimization", "Income Generation"] },
      { label: "Investment Experience", type: "select", placeholder: "Select…", key: "investmentExperience", options: ["None", "Limited", "Moderate", "Extensive", "Professional"] },
      { label: "Target Retirement Age", type: "number", placeholder: "65", key: "retirementAge" },
      { label: "Additional Goals / Notes", type: "textarea", placeholder: "Any specific financial goals or concerns…", key: "additionalGoals" },
    ]
  },
  {
    id: 5, title: "Insurance & Estate", icon: Shield, description: "Current insurance coverage and estate planning status",
    fields: [
      { label: "Life Insurance (Death Benefit)", type: "number", placeholder: "500000", key: "lifeInsurance" },
      { label: "Disability Insurance", type: "select", placeholder: "Select…", key: "disabilityInsurance", options: ["None", "Employer-provided only", "Individual policy", "Both employer and individual"] },
      { label: "Long-Term Care Insurance", type: "select", placeholder: "Select…", key: "ltcInsurance", options: ["None", "Traditional LTC", "Hybrid Life/LTC", "Self-insured"] },
      { label: "Estate Plan Status", type: "select", placeholder: "Select…", key: "estatePlan", options: ["No estate plan", "Basic will only", "Will + POA + Healthcare Directive", "Comprehensive trust-based plan"] },
      { label: "Last Estate Plan Review", type: "date", placeholder: "", key: "lastEstateReview" },
      { label: "Beneficiary Review Date", type: "date", placeholder: "", key: "beneficiaryReview" },
      { label: "Umbrella Liability", type: "number", placeholder: "1000000", key: "umbrellaLiability" },
      { label: "Trustee Name", type: "text", placeholder: "Jane Smith", key: "trusteeName" },
    ]
  },
  {
    id: 6, title: "Compliance & Agreements", icon: FileText, description: "Required disclosures, agreements, and compliance documentation",
    fields: [
      { label: "Accredited Investor", type: "select", placeholder: "Select…", key: "accreditedInvestor", options: ["Yes", "No", "Unsure"] },
      { label: "Politically Exposed Person (PEP)", type: "select", placeholder: "Select…", key: "pep", options: ["No", "Yes — domestic", "Yes — foreign"] },
      { label: "Referral Source", type: "select", placeholder: "Select…", key: "referralSource", options: ["Existing Client Referral", "Professional Referral", "Website/Online", "Seminar/Event", "Social Media", "Other"] },
      { label: "Form CRS Delivered", type: "select", placeholder: "Select…", key: "formCRS", options: ["Yes", "No"] },
      { label: "ADV Part 2 Delivered", type: "select", placeholder: "Select…", key: "advPart2", options: ["Yes", "No"] },
      { label: "Privacy Policy Delivered", type: "select", placeholder: "Select…", key: "privacyPolicy", options: ["Yes", "No"] },
      { label: "How did you hear about us?", type: "textarea", placeholder: "Details about referral or discovery…", key: "referralDetails" },
    ]
  },
];

const CHECKLIST_ITEMS = [
  "Client Information Form completed",
  "Form ADV Part 2A & 2B delivered",
  "Client Relationship Summary (Form CRS) delivered",
  "Privacy Policy notice delivered",
  "Investment Advisory Agreement signed",
  "Financial Planning Agreement signed",
  "Risk Tolerance Questionnaire completed",
  "Account transfer forms submitted (ACAT)",
  "Beneficiary designation forms completed",
  "Custodian new account application submitted",
  "Initial portfolio allocation approved",
  "First meeting scheduled",
  "Identity verification (KYC/AML) completed",
  "Suitability analysis documented",
  "Fee schedule acknowledged",
  "Discretionary trading authorization signed",
  "Margin agreement (if applicable)",
  "Options agreement (if applicable)",
  "E-delivery consent obtained",
  "Trusted contact person identified"
];

const PIPELINE_DATA = [
  { name: 'Prospect', count: 8, value: 8000000 },
  { name: 'In Progress', count: 3, value: 4500000 },
  { name: 'Pending Docs', count: 2, value: 1200000 },
  { name: 'Completed', count: 15, value: 25000000 },
];

const ONBOARDING_TRENDS = [
  { month: 'Jan', completed: 4, abandoned: 1, duration: 12 },
  { month: 'Feb', completed: 6, abandoned: 2, duration: 10 },
  { month: 'Mar', completed: 8, abandoned: 1, duration: 9 },
  { month: 'Apr', completed: 15, abandoned: 3, duration: 8 },
  { month: 'May', completed: 12, abandoned: 2, duration: 7 },
  { month: 'Jun', completed: 20, abandoned: 1, duration: 6 },
];

const SOURCE_DATA = [
  { name: 'Referrals', value: 45, color: '#3b82f6' },
  { name: 'Website', value: 25, color: '#10b981' },
  { name: 'Events', value: 20, color: '#f59e0b' },
  { name: 'Social', value: 10, color: '#8b5cf6' },
];

const RISK_DISTRIBUTION = [
  { name: 'Conservative', clients: 5, target: 10 },
  { name: 'Mod Cons', clients: 12, target: 15 },
  { name: 'Moderate', clients: 25, target: 30 },
  { name: 'Mod Agg', clients: 18, target: 20 },
  { name: 'Aggressive', clients: 8, target: 10 },
];

const RECENT_ACTIVITY = [
  { name: "Sarah Johnson", stage: "Completed", date: "2026-04-05", email: "sarah.j@email.com", aum: "$1.2M", advisor: "Mike R." },
  { name: "Michael Chen", stage: "Pending Docs", date: "2026-04-03", email: "m.chen@email.com", aum: "$850K", advisor: "Sarah L." },
  { name: "Emily Williams", stage: "In Progress", date: "2026-04-01", email: "emily.w@email.com", aum: "$2.5M", advisor: "Mike R." },
  { name: "David Brown", stage: "In Progress", date: "2026-03-28", email: "d.brown@email.com", aum: "$500K", advisor: "John D." },
  { name: "Lisa Anderson", stage: "Prospect", date: "2026-03-25", email: "l.anderson@email.com", aum: "$3.1M", advisor: "Sarah L." },
  { name: "Robert Taylor", stage: "Completed", date: "2026-03-20", email: "r.taylor@email.com", aum: "$1.8M", advisor: "John D." },
  { name: "Jennifer Martin", stage: "Completed", date: "2026-03-18", email: "j.martin@email.com", aum: "$920K", advisor: "Mike R." },
  { name: "William Davis", stage: "Prospect", date: "2026-03-15", email: "w.davis@email.com", aum: "$4.5M", advisor: "Sarah L." },
];

const COMPLIANCE_ALERTS = [
  { id: 1, client: "Michael Chen", issue: "Missing Signature on ADV Receipt", severity: "High", daysOpen: 4 },
  { id: 2, client: "Emily Williams", issue: "Stale ID Document", severity: "Medium", daysOpen: 12 },
  { id: 3, client: "David Brown", issue: "Incomplete Risk Profile", severity: "High", daysOpen: 2 },
  { id: 4, client: "Lisa Anderson", issue: "Missing Trusted Contact", severity: "Low", daysOpen: 15 },
];

const TASKS = [
  { id: 1, title: "Review Johnson ACAT Transfer", due: "Today", status: "Pending", priority: "High" },
  { id: 2, title: "Send Welcome Kit to Taylor", due: "Tomorrow", status: "Pending", priority: "Medium" },
  { id: 3, title: "Follow up with Chen on Docs", due: "Apr 14", status: "In Progress", priority: "High" },
  { id: 4, title: "Initial Plan Prep for Williams", due: "Apr 15", status: "Pending", priority: "Medium" },
  { id: 5, title: "Schedule Brown Discovery Call", due: "Apr 16", status: "Completed", priority: "Low" },
];

const DOCUMENTS = [
  { id: 1, name: "Investment Advisory Agreement v2.pdf", type: "PDF", size: "1.2 MB", date: "2026-04-01" },
  { id: 2, name: "Form ADV Part 2A 2026.pdf", type: "PDF", size: "3.5 MB", date: "2026-03-15" },
  { id: 3, name: "Client Relationship Summary (CRS).pdf", type: "PDF", size: "0.8 MB", date: "2026-03-15" },
  { id: 4, name: "Privacy Policy 2026.pdf", type: "PDF", size: "0.5 MB", date: "2026-01-10" },
  { id: 5, name: "Risk Tolerance Questionnaire.pdf", type: "PDF", size: "1.1 MB", date: "2026-02-20" },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ClientOnboardingAutomation() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("wizard");
  const [checklist, setChecklist] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [submitted, setSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [activeChart, setActiveChart] = useState("pipeline");
  const [taskFilter, setTaskFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [hoveredData, setHoveredData] = useState<any>(null);

  const { data: clientData } = useClientData();

  const { data: onboardingStats } = trpc.onboarding.getStats.useQuery();
  const { data: complianceData } = trpc.compliance.getAlerts.useQuery();
  const { data: pipelineMetrics } = trpc.pipeline.getMetrics.useQuery();
  const { data: clientPortalStatus } = trpc.clientPortal.getStatus.useQuery();
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: docsData } = trpc.docs.getTemplates.useQuery();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  };

  useEffect(() => {
    if (clientData) {
      const updates: Record<string, string> = {};
      if (clientData.clientName) {
        const parts = clientData.clientName.split(" ");
        if (parts.length > 0) updates.firstName = parts[0];
        if (parts.length > 1) updates.lastName = parts.slice(1).join(" ");
      }
      if (clientData.email) updates.email = clientData.email;
      if (clientData.dependents) updates.dependents = clientData.dependents.toString();
      if (clientData.annualIncome) updates.annualIncome = clientData.annualIncome.toString();
      if (clientData.filingStatus) {
        if (clientData.filingStatus === "single") updates.filingStatus = "Single";
        if (clientData.filingStatus === "joint") updates.filingStatus = "Married Filing Jointly";
        if (clientData.filingStatus === "hoh") updates.filingStatus = "Head of Household";
      }
      
      let investable = 0;
      if (clientData.taxableInvestments) investable += clientData.taxableInvestments;
      if (clientData.cashSavings) investable += clientData.cashSavings;
      if (investable > 0) updates.investableAssets = investable.toString();
      
      let retirement = 0;
      if (clientData.iraBalance) retirement += clientData.iraBalance;
      if (clientData.rothBalance) retirement += clientData.rothBalance;
      if (clientData.k401Balance) retirement += clientData.k401Balance;
      if (retirement > 0) updates.retirementAccounts = retirement.toString();
      
      if (clientData.realEstateEquity) updates.realEstateEquity = clientData.realEstateEquity.toString();
      if (clientData.mortgageBalance) updates.mortgage = clientData.mortgageBalance.toString();
      if (clientData.monthlyExpenses) updates.monthlyExpenses = clientData.monthlyExpenses.toString();
      if (clientData.lifeInsuranceDb) updates.lifeInsurance = clientData.lifeInsuranceDb.toString();
      
      if (Object.keys(updates).length > 0) {
        setFormData(prev => ({ ...prev, ...updates }));
      }
    }
  }, [clientData]);

  const step = ONBOARDING_STEPS[currentStep - 1];
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = Math.round((currentStep / totalSteps) * 100);
  const checklistProgress = Math.round((checklist.filter(Boolean).length / checklist.length) * 100);

  const updateField = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }));
  const toggleChecklist = (i: number) => setChecklist(prev => { const n = [...prev]; n[i] = !n[i]; return n; });
  const toggleAllChecklist = () => {
    const allChecked = checklist.every(Boolean);
    setChecklist(new Array(CHECKLIST_ITEMS.length).fill(!allChecked));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast.success("Client onboarding form submitted successfully! Welcome packet will be sent automatically.");
  };

  const handleExportCSV = () => {
    toast.success("Pipeline data exported to CSV");
  };

  const handleSendReminder = (clientName: string) => {
    toast.success(`Reminder sent to ${clientName}`);
  };

  const handleApproveDoc = (docId: number) => {
    toast.success(`Document ${docId} approved`);
  };

  const handleAssignTask = (taskId: number) => {
    toast.success(`Task ${taskId} assigned`);
  };

  const filteredActivity = useMemo(() => {
    return RECENT_ACTIVITY.filter((client) => {
      const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            client.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || client.stage === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const filteredTasks = useMemo(() => {
    return TASKS.filter((task) => {
      if (taskFilter === "All") return true;
      if (taskFilter === "Pending") return task.status === "Pending";
      if (taskFilter === "Completed") return task.status === "Completed";
      return true;
    });
  }, [taskFilter]);

  const renderCustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#060d19] border border-[#12233e] p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <FactFinderBadge className="mb-4" />
            <h1 className="rc-page-title flex items-center gap-2">
              <UserPlus className="w-8 h-8 text-[#22c55e]" /> 
              Client Onboarding Automation
            </h1>
            <p className="rc-page-subtitle mt-1">
              Streamlined client onboarding with automated data collection, compliance documentation, and welcome workflows. Inspired by Wealthbox and PreciseFP.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <button 
                onClick={handleRefresh}
                className={`rc-btn rc-btn-ghost p-2 ${isRefreshing ? 'animate-spin' : ''}`}
                title="Refresh Data"
              >
                <Activity className="w-5 h-5 text-[#7a95b8]" />
              </button>
              <ExportToSlides
                toolName="Client Onboarding Automation"
                getSections={() => [
                  {
                    title: "Onboarding Status",
                    items: [
                      { label: "Current Step", value: `${currentStep} of ${totalSteps}` },
                      { label: "Progress", value: `${progress}%` },
                      { label: "Checklist Progress", value: `${checklistProgress}%` },
                    ]
                  },
                  ...ONBOARDING_STEPS.map((step) => ({
                    title: step.title,
                    items: step.fields.map((f) => ({
                      label: f.label,
                      value: formData[f.key] || "Not provided"
                    }))
                  }))
                ]}
              />
            </div>
            <div className="text-xs text-[#7a95b8] flex items-center gap-1">
              <Clock className="w-3 h-3" /> Last updated: Just now
            </div>
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#3b82f6] hover:shadow-lg hover:shadow-[#3b82f6]/10 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#7a95b8] font-medium">Active Onboardings</p>
                <h3 className="text-2xl font-bold text-white mt-1">28</h3>
              </div>
              <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                <Users className="w-5 h-5 text-[#3b82f6]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <TrendingUp className="w-3 h-3 text-[#22c55e] mr-1" />
              <span className="text-[#22c55e] font-medium">+12%</span>
              <span className="text-[#7a95b8] ml-1">vs last month</span>
            </div>
          </div>
          
          <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#22c55e] hover:shadow-lg hover:shadow-[#22c55e]/10 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#7a95b8] font-medium">Avg Completion Time</p>
                <h3 className="text-2xl font-bold text-white mt-1">8.5 Days</h3>
              </div>
              <div className="p-2 bg-[#22c55e]/10 rounded-lg">
                <Clock className="w-5 h-5 text-[#22c55e]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <TrendingUp className="w-3 h-3 text-[#22c55e] mr-1" />
              <span className="text-[#22c55e] font-medium">-1.2 days</span>
              <span className="text-[#7a95b8] ml-1">vs last month</span>
            </div>
          </div>
          
          <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#f59e0b] hover:shadow-lg hover:shadow-[#f59e0b]/10 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#7a95b8] font-medium">Pending Signatures</p>
                <h3 className="text-2xl font-bold text-white mt-1">14</h3>
              </div>
              <div className="p-2 bg-[#f59e0b]/10 rounded-lg">
                <FileSignature className="w-5 h-5 text-[#f59e0b]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-[#f59e0b] font-medium">Action Required</span>
              <span className="text-[#7a95b8] ml-1">on 5 documents</span>
            </div>
          </div>
          
          <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#ef4444] hover:shadow-lg hover:shadow-[#ef4444]/10 transition-all cursor-pointer">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-[#7a95b8] font-medium">Compliance Alerts</p>
                <h3 className="text-2xl font-bold text-white mt-1">4</h3>
              </div>
              <div className="p-2 bg-[#ef4444]/10 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className="text-[#ef4444] font-medium">2 High Priority</span>
              <span className="text-[#7a95b8] ml-1">require attention</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#12233e] pb-px">
          {[
            { id: "wizard", label: "Onboarding Form", icon: UserPlus },
            { id: "checklist", label: "Compliance Checklist", icon: Shield },
            { id: "pipeline", label: "Pipeline Management", icon: BarChart2 },
            { id: "analytics", label: "Analytics & Reports", icon: PieChartIcon },
            { id: "documents", label: "Document Center", icon: FileText },
            { id: "tasks", label: "Tasks & Alerts", icon: CheckSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id 
                    ? "border-[#22c55e] text-white bg-[#22c55e]/5" 
                    : "border-transparent text-[#7a95b8] hover:text-white hover:border-[#12233e] hover:bg-[#12233e]/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="min-h-[600px]">
          {/* Wizard Tab */}
          {activeTab === "wizard" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rc-card sticky top-0 z-10 shadow-lg shadow-[#060d19]/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Step {currentStep} of {totalSteps}: {step.title}</span>
                  <span className="text-sm text-[#7a95b8]">{progress}% Complete</span>
                </div>
                <Progress value={progress} className="h-2 mb-4 bg-[#060d19]"  />
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-[#12233e]">
                  {ONBOARDING_STEPS.map((s) => {
                    const Icon = s.icon;
                    const isActive = s.id === currentStep;
                    const isComplete = s.id < currentStep;
                    return (
                      <button 
                        key={s.id} 
                        onClick={() => setCurrentStep(s.id)} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all duration-200 ${
                          isActive 
                            ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]" 
                            : isComplete 
                              ? "bg-[#22c55e]/10 text-[#22c55e] border border-transparent hover:border-[#22c55e]/30" 
                              : "text-[#7a95b8] border border-transparent hover:bg-[#12233e]"
                        }`}
                      >
                        {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        {s.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {submitted ? (
                <div className="rc-card border-[#22c55e]/30 bg-gradient-to-r from-[#0d1a2e] to-[#0a1b28] animate-in zoom-in duration-500">
                  <div className="py-16 text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <div className="absolute inset-0 bg-[#22c55e]/20 rounded-full animate-ping"></div>
                      <div className="relative flex items-center justify-center w-full h-full bg-[#22c55e]/10 rounded-full border-2 border-[#22c55e]">
                        <CheckCircle2 className="w-12 h-12 text-[#22c55e]" />
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Onboarding Complete!</h2>
                    <p className="text-[#c8d8ec] max-w-lg mx-auto mb-8 text-lg">
                      The client onboarding form has been submitted successfully. An automated welcome email with next steps, account opening instructions, and required documents will be sent to the client shortly.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                      <button className="rc-btn rc-btn-primary inline-flex items-center px-6 py-3" onClick={() => { setSubmitted(false); setCurrentStep(1); setFormData({}); }}>
                        <UserPlus className="w-5 h-5 mr-2" /> Start New Onboarding
                      </button>
                      <button className="rc-btn rc-btn-ghost inline-flex items-center px-6 py-3" onClick={() => setActiveTab("pipeline")}>
                        <BarChart2 className="w-5 h-5 mr-2" /> View Pipeline
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                  <div className="rc-card">
                    <div className="mb-6 border-b border-[#12233e] pb-4">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        {(() => { const Icon = step.icon; return <Icon className="w-6 h-6 text-[#22c55e]" />; })()}
                        {step.title}
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-2">{step.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {step.fields.map((field) => (
                        <div key={field.key} className={`space-y-2 ${field.type === "textarea" ? "md:col-span-2" : ""}`}>
                          <Label className="text-[#c8d8ec] text-sm font-medium flex items-center justify-between">
                            {field.label}
                            {formData[field.key] && <CheckCircle2 className="w-3 h-3 text-[#22c55e]" />}
                          </Label>
                          {field.type === "select" ? (
                            <Select value={formData[field.key] || ""} onValueChange={v => updateField(field.key, v)}>
                              <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white h-11 transition-all focus:ring-2 focus:ring-[#22c55e]/50">
                                <SelectValue placeholder={field.placeholder} />
                              </SelectTrigger>
                              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                                {field.options?.map((o) => <SelectItem key={o} value={o} className="hover:bg-[#12233e] focus:bg-[#12233e] focus:text-white cursor-pointer">{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          ) : field.type === "textarea" ? (
                            <Textarea 
                              placeholder={field.placeholder} 
                              value={formData[field.key] || ""} 
                              onChange={(e) => updateField(field.key, e.target.value)} 
                              rows={4}
                              className="rc-input bg-[#060d19] border-[#12233e] text-white resize-none focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/50 transition-all" 
                            />
                          ) : (
                            <Input 
                              type={field.type} 
                              placeholder={field.placeholder} 
                              value={formData[field.key] || ""} 
                              onChange={(e) => updateField(field.key, e.target.value)}
                              className="rc-input bg-[#060d19] border-[#12233e] text-white h-11 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/50 transition-all" 
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-6 bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                    <button 
                      className="rc-btn rc-btn-ghost inline-flex items-center px-4 py-2" 
                      onClick={() => setCurrentStep(Math.max(1, currentStep - 1))} 
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" /> Previous Step
                    </button>
                    
                    <div className="text-sm text-[#7a95b8] hidden sm:block">
                      Step {currentStep} of {totalSteps}
                    </div>
                    
                    {currentStep < totalSteps ? (
                      <button 
                        onClick={() => setCurrentStep(currentStep + 1)} 
                        className="rc-btn rc-btn-primary inline-flex items-center px-6 py-2"
                      >
                        Next Step <ArrowRight className="w-4 h-4 ml-2" />
                      </button>
                    ) : (
                      <button 
                        onClick={handleSubmit} 
                        className="rc-btn bg-gradient-to-r from-[#22c55e] to-[#16a34a] hover:from-[#16a34a] hover:to-[#15803d] text-white inline-flex items-center px-6 py-2 shadow-lg shadow-[#22c55e]/20"
                      >
                        <Zap className="w-4 h-4 mr-2" /> Complete Onboarding
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === "checklist" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="rc-card">
                <div className="mb-6 border-b border-[#12233e] pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      <Shield className="w-6 h-6 text-[#22c55e]" /> 
                      Onboarding Compliance Checklist
                    </h2>
                    <p className="text-sm text-[#7a95b8] mt-2">Track completion of all required onboarding documents and steps to ensure regulatory compliance.</p>
                  </div>
                  <button onClick={toggleAllChecklist} className="rc-btn rc-btn-ghost text-xs">
                    {checklist.every(Boolean) ? "Uncheck All" : "Check All"}
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 bg-gradient-to-r from-[#0d1a2e] to-[#060d19] p-6 rounded-xl border border-[#12233e]">
                  <div className="flex-1 w-full">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-[#c8d8ec]">Overall Completion Status</span>
                      <span className="text-sm font-bold text-[#22c55e]">{checklistProgress}%</span>
                    </div>
                    <Progress value={checklistProgress} className="h-3 bg-[#060d19]"  />
                    <p className="text-xs text-[#7a95b8] mt-2">
                      {checklistProgress === 100 ? "All requirements met. Ready for final review." : "Action required on pending items."}
                    </p>
                  </div>
                  
                  <div className="flex gap-4 w-full md:w-auto">
                    <div className="text-center px-6 py-3 bg-[#060d19] rounded-lg border border-[#12233e] flex-1">
                      <div className="text-3xl font-bold text-[#22c55e]">{checklist.filter(Boolean).length}</div>
                      <div className="text-xs text-[#7a95b8] uppercase tracking-wider mt-1">Completed</div>
                    </div>
                    <div className="text-center px-6 py-3 bg-[#060d19] rounded-lg border border-[#12233e] flex-1">
                      <div className="text-3xl font-bold text-[#f59e0b]">{checklist.length - checklist.filter(Boolean).length}</div>
                      <div className="text-xs text-[#7a95b8] uppercase tracking-wider mt-1">Pending</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CHECKLIST_ITEMS.map((item, i) => (
                    <div 
                      key={i} 
                      className={`flex items-start gap-4 p-5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                        checklist[i] 
                          ? "bg-[#22c55e]/5 border-[#22c55e]/30 shadow-[inset_0_0_10px_rgba(34,197,94,0.05)]" 
                          : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]/50 hover:bg-[#12233e]/30"
                      }`} 
                      onClick={() => toggleChecklist(i)}
                    >
                      <div className={`mt-0.5 rounded-full p-1 transition-colors ${checklist[i] ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] group-hover:text-white"}`}>
                        {checklist[i] ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 rounded-full border-2 border-current"></div>}
                      </div>
                      <div className="flex-1">
                        <span className={`text-sm font-medium leading-tight block mb-1 ${checklist[i] ? "text-[#22c55e] line-through opacity-80" : "text-[#c8d8ec]"}`}>
                          {item}
                        </span>
                        <span className="text-xs text-[#7a95b8]">
                          {checklist[i] ? "Completed today" : "Pending action"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pipeline Tab */}
          {activeTab === "pipeline" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Data Table 1: Pipeline Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { stage: "Prospect", count: 8, value: "$8.0M", color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/10", border: "border-[#3b82f6]/20", icon: Users },
                  { stage: "In Progress", count: 3, value: "$4.5M", color: "text-[#f0c040]", bg: "bg-[#f0c040]/10", border: "border-[#f0c040]/20", icon: Activity },
                  { stage: "Pending Docs", count: 2, value: "$1.2M", color: "text-[#a855f7]", bg: "bg-[#a855f7]/10", border: "border-[#a855f7]/20", icon: FileText },
                  { stage: "Completed", count: 15, value: "$25.0M", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/20", icon: CheckCircle2 },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={i} className={`rc-card flex flex-col p-6 ${s.bg} ${s.border} transition-transform hover:-translate-y-1 duration-200 cursor-pointer`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${s.bg} border ${s.border}`}>
                          <Icon className={`w-6 h-6 ${s.color}`} />
                        </div>
                        <span className={`text-2xl font-bold ${s.color}`}>{s.count}</span>
                      </div>
                      <div className="text-sm font-medium text-white mb-1">{s.stage}</div>
                      <div className="text-xs text-[#7a95b8]">Pipeline Value: <span className="text-white font-medium">{s.value}</span></div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rc-card lg:col-span-2 flex flex-col h-[600px]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#22c55e]" />
                      Active Onboarding Pipeline
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] rc-input bg-[#060d19] border-[#12233e] text-white h-9">
                          <SelectValue placeholder="Filter Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                          <SelectItem value="All">All Statuses</SelectItem>
                          <SelectItem value="Prospect">Prospect</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Pending Docs">Pending Docs</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1 sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                        <Input 
                          placeholder="Search clients..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="rc-input pl-9 bg-[#060d19] border-[#12233e] text-white h-9 w-full"
                        />
                      </div>
                      <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost h-9 px-3" title="Export CSV">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Data Table 2: Pipeline List */}
                  <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                      {filteredActivity.length > 0 ? (
                        filteredActivity.map((client, i) => (
                          <div 
                            key={i} 
                            className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                              selectedClient === client.name 
                                ? "bg-[#12233e]/50 border-[#22c55e]/50 shadow-md" 
                                : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]/50"
                            }`}
                            onClick={() => setSelectedClient(client.name === selectedClient ? null : client.name)}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#12233e] to-[#060d19] border border-[#22c55e]/30 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
                              {client.name.split(' ').map((n) => n[0]).join('')}
                            </div>
                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <div className="font-medium text-white truncate">{client.name}</div>
                                <div className="text-xs text-[#7a95b8] truncate flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {client.email}
                                </div>
                              </div>
                              <div className="hidden sm:block">
                                <div className="text-sm text-[#c8d8ec]">AUM: {client.aum}</div>
                                <div className="text-xs text-[#7a95b8] flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" /> {client.advisor}
                                </div>
                              </div>
                              <div className="flex items-center sm:justify-end gap-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
                                  client.stage === "Completed" ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20" : 
                                  client.stage === "Pending Docs" ? "bg-[#a855f7]/10 text-[#a855f7] border-[#a855f7]/20" : 
                                  client.stage === "In Progress" ? "bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/20" : 
                                  "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20"
                                }`}>
                                  {client.stage}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-xs text-[#7a95b8] w-20 text-right">{client.date}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleSendReminder(client.name); }}
                                className="p-1.5 text-[#7a95b8] hover:text-[#22c55e] hover:bg-[#22c55e]/10 rounded transition-colors"
                                title="Send Reminder"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {/* Expanded Details */}
                            {selectedClient === client.name && (
                              <div className="w-full mt-4 pt-4 border-t border-[#12233e] grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2">Next Steps</h4>
                                  <ul className="space-y-2">
                                    <li className="text-sm text-[#c8d8ec] flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#f0c040]"></div>
                                      Review ACAT Transfer Form
                                    </li>
                                    <li className="text-sm text-[#c8d8ec] flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#f0c040]"></div>
                                      Schedule Initial Allocation Call
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2">Missing Information</h4>
                                  <ul className="space-y-2">
                                    <li className="text-sm text-[#ef4444] flex items-center gap-2">
                                      <AlertTriangle className="w-3 h-3" />
                                      Beneficiary Designation
                                    </li>
                                    <li className="text-sm text-[#ef4444] flex items-center gap-2">
                                      <AlertTriangle className="w-3 h-3" />
                                      Driver's License Copy
                                    </li>
                                  </ul>
                                </div>
                                <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
                                  <button className="rc-btn rc-btn-ghost text-xs">View Full Profile</button>
                                  <button className="rc-btn rc-btn-primary text-xs">Update Status</button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-[#060d19] rounded-xl border border-[#12233e] border-dashed">
                          <Search className="w-10 h-10 text-[#7a95b8] mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium text-white mb-1">No clients found</h3>
                          <p className="text-sm text-[#7a95b8]">Try adjusting your search or filters</p>
                          <button 
                            onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                            className="mt-4 rc-btn rc-btn-ghost text-sm"
                          >
                            Clear Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  {/* Recharts 1: Pipeline Distribution */}
                  <div className="rc-card h-[290px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <PieChartIcon className="w-4 h-4 text-[#3b82f6]" />
                        Pipeline Distribution
                      </h3>
                      <button className="text-xs text-[#7a95b8] hover:text-white transition-colors">Details</button>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={PIPELINE_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                          <XAxis type="number" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis dataKey="name" type="category" stroke="#c8d8ec" fontSize={11} tickLine={false} axisLine={false} width={85} />
                          <RechartsTooltip content={renderCustomTooltip} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                          <Bar dataKey="count" name="Clients" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16}>
                            {PIPELINE_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.name === 'Completed' ? '#22c55e' : 
                                entry.name === 'Pending Docs' ? '#a855f7' : 
                                entry.name === 'In Progress' ? '#f0c040' : '#3b82f6'
                              } />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Recharts 2: Pipeline Value */}
                  <div className="rc-card h-[286px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#22c55e]" />
                        Pipeline Value ($)
                      </h3>
                    </div>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={PIPELINE_DATA}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {PIPELINE_DATA.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                entry.name === 'Completed' ? '#22c55e' : 
                                entry.name === 'Pending Docs' ? '#a855f7' : 
                                entry.name === 'In Progress' ? '#f0c040' : '#3b82f6'
                              } />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            formatter={(value: number) => `$${(value / 1000000).toFixed(1)}M`}
                            contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36} 
                            iconType="circle"
                            formatter={(value) => <span className="text-xs text-[#c8d8ec]">{value}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-[#22c55e]" />
                  Onboarding Analytics
                </h2>
                <div className="flex gap-2">
                  <Select defaultValue="6m">
                    <SelectTrigger className="w-[120px] rc-input bg-[#060d19] border-[#12233e] text-white h-9">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectItem value="1m">Last Month</SelectItem>
                      <SelectItem value="3m">Last 3 Months</SelectItem>
                      <SelectItem value="6m">Last 6 Months</SelectItem>
                      <SelectItem value="1y">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recharts 3: Onboarding Trends (Area Chart) */}
                <div className="rc-card h-[350px] flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-4">Completion Trends</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={ONBOARDING_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAbandoned" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={renderCustomTooltip} />
                        <Legend verticalAlign="top" height={36} iconType="circle" />
                        <Area type="monotone" dataKey="completed" name="Completed" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                        <Area type="monotone" dataKey="abandoned" name="Abandoned" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAbandoned)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recharts 4: Average Duration (Composed Chart) */}
                <div className="rc-card h-[350px] flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-4">Average Onboarding Duration (Days)</h3>
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={ONBOARDING_TRENDS} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <RechartsTooltip content={renderCustomTooltip} />
                        <Bar dataKey="duration" name="Avg Days" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                        <Line type="monotone" dataKey="duration" stroke="#f0c040" strokeWidth={3} dot={{ r: 4, fill: '#f0c040', strokeWidth: 2, stroke: '#060d19' }} activeDot={{ r: 6 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recharts 5: Risk Distribution (Radar Chart) */}
                <div className="rc-card h-[350px] flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-4">Client Risk Profile Distribution</h3>
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RISK_DISTRIBUTION}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#c8d8ec', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8', fontSize: 10 }} />
                        <Radar name="Current Clients" dataKey="clients" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                        <Radar name="Target Distribution" dataKey="target" stroke="#22c55e" fill="none" strokeDasharray="3 3" strokeWidth={2} />
                        <RechartsTooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                        <Legend iconType="circle" />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Data Table 3: Source Analytics */}
                <div className="rc-card h-[350px] flex flex-col">
                  <h3 className="text-sm font-semibold text-white mb-4">Lead Source Performance</h3>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Source</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Leads</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Conversion</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Avg AUM</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20 transition-colors">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Referrals
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">45</td>
                          <td className="py-3 px-4 text-sm text-[#22c55e] text-right">68%</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">$1.2M</td>
                        </tr>
                        <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20 transition-colors">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div> Website
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">25</td>
                          <td className="py-3 px-4 text-sm text-[#f0c040] text-right">32%</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">$450K</td>
                        </tr>
                        <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20 transition-colors">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div> Events
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">20</td>
                          <td className="py-3 px-4 text-sm text-[#22c55e] text-right">55%</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">$850K</td>
                        </tr>
                        <tr className="hover:bg-[#12233e]/20 transition-colors">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#8b5cf6]"></div> Social Media
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">10</td>
                          <td className="py-3 px-4 text-sm text-[#ef4444] text-right">15%</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">$250K</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-[#22c55e]" />
                  Document Center
                </h2>
                <button className="rc-btn rc-btn-primary text-sm px-4 py-2">
                  Upload Template
                </button>
              </div>

              {/* Data Table 4: Required Documents */}
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-[#12233e] pb-2">Standard Onboarding Packet</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-[#12233e] bg-[#060d19]">
                        <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider rounded-tl-lg">Document Name</th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Type</th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Last Updated</th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Status</th>
                        <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right rounded-tr-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOCUMENTS.map((doc) => (
                        <tr key={doc.id} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors group">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-3">
                            <div className="p-1.5 bg-[#ef4444]/10 text-[#ef4444] rounded">
                              <FileText className="w-4 h-4" />
                            </div>
                            {doc.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec]">{doc.type}</td>
                          <td className="py-3 px-4 text-sm text-[#7a95b8]">{doc.date}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20">
                              Active
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded" title="View">
                                <Search className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded" title="Download">
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19]">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#f0c040]" /> 
                    E-Signature Status
                  </h3>
                  <div className="space-y-4 mt-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#c8d8ec]">Completed</span>
                        <span className="text-white font-medium">45 / 50</span>
                      </div>
                      <Progress value={90} className="h-2 bg-[#060d19] [&>div]:bg-[#22c55e]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#c8d8ec]">Pending Client</span>
                        <span className="text-white font-medium">3 / 50</span>
                      </div>
                      <Progress value={6} className="h-2 bg-[#060d19] [&>div]:bg-[#f0c040]" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[#c8d8ec]">Pending Advisor</span>
                        <span className="text-white font-medium">2 / 50</span>
                      </div>
                      <Progress value={4} className="h-2 bg-[#060d19] [&>div]:bg-[#ef4444]" />
                    </div>
                  </div>
                </div>
                
                <div className="rc-card">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#3b82f6]" /> 
                    Custodian Integrations
                  </h3>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-center justify-between p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-bold text-[#0f172a] text-xs">SW</div>
                        <div>
                          <div className="text-sm font-medium text-white">Charles Schwab</div>
                          <div className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</div>
                        </div>
                      </div>
                      <button className="text-xs text-[#7a95b8] hover:text-white">Configure</button>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#002855] flex items-center justify-center font-bold text-white text-xs">Fid</div>
                        <div>
                          <div className="text-sm font-medium text-white">Fidelity</div>
                          <div className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</div>
                        </div>
                      </div>
                      <button className="text-xs text-[#7a95b8] hover:text-white">Configure</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Table 5: Tasks */}
                <div className="rc-card flex flex-col h-[500px]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <CheckSquare className="w-5 h-5 text-[#3b82f6]" />
                      My Tasks
                    </h2>
                    <Select value={taskFilter} onValueChange={setTaskFilter}>
                      <SelectTrigger className="w-[120px] rc-input bg-[#060d19] border-[#12233e] text-white h-8 text-xs">
                        <SelectValue placeholder="Filter" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="All">All Tasks</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                      {filteredTasks.map((task) => (
                        <div key={task.id} className={`p-4 rounded-xl border transition-all ${
                          task.status === "Completed" ? "bg-[#12233e]/20 border-[#12233e] opacity-70" : "bg-[#060d19] border-[#12233e] hover:border-[#3b82f6]/50"
                        }`}>
                          <div className="flex items-start gap-3">
                            <Checkbox 
                              checked={task.status === "Completed"} 
                              className={`mt-1 data-[state=checked]:bg-[#22c55e] data-[state=checked]:border-[#22c55e]`}
                            />
                            <div className="flex-1">
                              <div className={`text-sm font-medium mb-1 ${task.status === "Completed" ? "text-[#7a95b8] line-through" : "text-white"}`}>
                                {task.title}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-xs">
                                  <span className={`flex items-center gap-1 ${
                                    task.due === "Today" ? "text-[#ef4444]" : "text-[#7a95b8]"
                                  }`}>
                                    <Calendar className="w-3 h-3" /> {task.due}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                    task.priority === "High" ? "bg-[#ef4444]/10 text-[#ef4444]" : 
                                    task.priority === "Medium" ? "bg-[#f0c040]/10 text-[#f0c040]" : 
                                    "bg-[#3b82f6]/10 text-[#3b82f6]"
                                  }`}>
                                    {task.priority}
                                  </span>
                                </div>
                                {task.status !== "Completed" && (
                                  <button onClick={() => handleAssignTask(task.id)} className="text-xs text-[#3b82f6] hover:text-white transition-colors">
                                    Assign
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Data Table 6: Compliance Alerts */}
                <div className="rc-card flex flex-col h-[500px] border-[#ef4444]/30 bg-gradient-to-b from-[#0d1a2e] to-[#060d19]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
                      Compliance Alerts
                    </h2>
                    <span className="px-2.5 py-1 bg-[#ef4444]/20 text-[#ef4444] rounded-full text-xs font-bold">
                      {COMPLIANCE_ALERTS.length} Active
                    </span>
                  </div>
                  
                  <div className="flex-1 overflow-auto pr-2 custom-scrollbar">
                    <div className="space-y-3">
                      {COMPLIANCE_ALERTS.map((alert) => (
                        <div key={alert.id} className="p-4 rounded-xl bg-[#060d19] border border-[#ef4444]/30 hover:border-[#ef4444] transition-all relative overflow-hidden group">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                            alert.severity === "High" ? "bg-[#ef4444]" : 
                            alert.severity === "Medium" ? "bg-[#f59e0b]" : "bg-[#3b82f6]"
                          }`}></div>
                          <div className="pl-3">
                            <div className="flex justify-between items-start mb-1">
                              <div className="text-sm font-medium text-white">{alert.client}</div>
                              <span className="text-xs text-[#7a95b8] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {alert.daysOpen} days open
                              </span>
                            </div>
                            <div className="text-sm text-[#ef4444] mb-3">{alert.issue}</div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="rc-btn rc-btn-primary text-xs py-1 px-3 bg-[#ef4444] hover:bg-[#dc2626] border-none text-white">Resolve</button>
                              <button className="rc-btn rc-btn-ghost text-xs py-1 px-3">Ignore</button>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {COMPLIANCE_ALERTS.length === 0 && (
                        <div className="text-center py-12">
                          <Shield className="w-12 h-12 text-[#22c55e] mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium text-white mb-1">All Clear</h3>
                          <p className="text-sm text-[#7a95b8]">No active compliance alerts.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="mt-8 pt-6 border-t border-[#12233e] flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#7a95b8]">
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" /> Secure 256-bit Encryption
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Compliance Manual</a>
            <a href="#" className="hover:text-white transition-colors">Support</a>
            <a href="#" className="hover:text-white transition-colors">Feedback</a>
          </div>
        </div>
        
        <PageInsights pageId="client-onboarding" />
      </div>
    </AppShell>
  );
}
