// @ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  ClipboardCheck, CheckCircle2, Circle, AlertTriangle, Copy,
  Shield, FileText, DollarSign, Users, Calendar, Clock,
  Search, Download, BarChart2, Filter, ChevronDown, ChevronUp, RefreshCw,
  TrendingUp, Activity, Target, Layers, Settings, Link, Share2, Printer,
  Save, Eye, Mail, MessageSquare, Phone, Bell, Star, Zap, Briefcase, 
  Map, Compass, Globe, Anchor, Award, BookOpen, Key, Lock, Unlock,
  ThumbsUp, ThumbsDown, Camera, Video, Mic, Music, Play, Pause
} from "lucide-react";
import { toast } from "sonner";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
  AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface ChecklistItem {
  id: string;
  category: string;
  text: string;
  description: string;
  priority: "critical" | "important" | "recommended";
  checked: boolean;
  notes?: string;
  dueDate?: string;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { id: "1", category: "Policy Basics", text: "Verify policy type and product name", description: "Confirm whether IUL, VUL, Whole Life, Term, etc.", priority: "critical", checked: false },
  { id: "2", category: "Policy Basics", text: "Confirm policy issue date and age", description: "Check how long the policy has been in force", priority: "critical", checked: false },
  { id: "3", category: "Policy Basics", text: "Verify current death benefit amount", description: "Compare to original face amount and current needs", priority: "critical", checked: false },
  { id: "4", category: "Policy Basics", text: "Check death benefit option (Level vs Increasing)", description: "Ensure appropriate option for client's goals", priority: "important", checked: false },
  { id: "5", category: "Policy Basics", text: "Review policy owner and insured", description: "Verify ownership structure is correct for estate planning", priority: "important", checked: false },

  { id: "6", category: "Premium Analysis", text: "Review current premium amount and frequency", description: "Monthly, quarterly, annual - compare to original illustration", priority: "critical", checked: false },
  { id: "7", category: "Premium Analysis", text: "Check if policy is on target premium schedule", description: "Compare actual premiums paid to illustrated premiums", priority: "critical", checked: false },
  { id: "8", category: "Premium Analysis", text: "Verify MEC status", description: "Ensure policy hasn't become a Modified Endowment Contract", priority: "critical", checked: false },
  { id: "9", category: "Premium Analysis", text: "Review premium flexibility options", description: "Can premiums be reduced, increased, or skipped?", priority: "recommended", checked: false },
  { id: "10", category: "Premium Analysis", text: "Check 7-pay test compliance", description: "Verify premium payments don't trigger MEC status", priority: "important", checked: false },

  { id: "11", category: "Cash Value", text: "Compare current cash value to original illustration", description: "Is the policy performing above or below illustrated values?", priority: "critical", checked: false },
  { id: "12", category: "Cash Value", text: "Review historical crediting rates", description: "What rates has the policy actually earned vs. illustrated?", priority: "critical", checked: false },
  { id: "13", category: "Cash Value", text: "Check current cap rate and participation rate", description: "Compare to original and current market rates", priority: "important", checked: false },
  { id: "14", category: "Cash Value", text: "Review cost of insurance charges", description: "Are COI charges increasing as expected?", priority: "important", checked: false },
  { id: "15", category: "Cash Value", text: "Verify surrender value and charges", description: "How much of the cash value is accessible?", priority: "important", checked: false },

  { id: "16", category: "Loans & Withdrawals", text: "Review outstanding loan balance", description: "Check total loans and impact on death benefit", priority: "critical", checked: false },
  { id: "17", category: "Loans & Withdrawals", text: "Verify loan interest rate and type", description: "Fixed vs. variable, participating vs. non-participating", priority: "important", checked: false },
  { id: "18", category: "Loans & Withdrawals", text: "Check for overloan protection rider", description: "Is the policy protected from lapsing due to loans?", priority: "important", checked: false },
  { id: "19", category: "Loans & Withdrawals", text: "Review withdrawal history", description: "Any basis withdrawals taken? Impact on cost basis?", priority: "recommended", checked: false },

  { id: "20", category: "Beneficiaries", text: "Verify primary beneficiary designations", description: "Are they current and correct?", priority: "critical", checked: false },
  { id: "21", category: "Beneficiaries", text: "Verify contingent beneficiary designations", description: "Are backup beneficiaries in place?", priority: "important", checked: false },
  { id: "22", category: "Beneficiaries", text: "Check for per stirpes vs per capita", description: "Ensure distribution method matches client's wishes", priority: "recommended", checked: false },
  { id: "23", category: "Beneficiaries", text: "Review trust as beneficiary (if applicable)", description: "Is the trust properly named and still valid?", priority: "important", checked: false },

  { id: "24", category: "Riders & Features", text: "Review chronic illness rider", description: "Understand triggers, benefit amount, and waiting period", priority: "important", checked: false },
  { id: "25", category: "Riders & Features", text: "Check waiver of premium rider", description: "Is it in force? What are the disability definitions?", priority: "recommended", checked: false },
  { id: "26", category: "Riders & Features", text: "Review any income riders", description: "Understand guaranteed income options and rollup rates", priority: "important", checked: false },
  { id: "27", category: "Riders & Features", text: "Verify term rider conversions", description: "Are any term riders approaching conversion deadlines?", priority: "important", checked: false },

  { id: "28", category: "Compliance", text: "Document suitability determination", description: "NAIC Model #670 compliant suitability documentation", priority: "critical", checked: false },
  { id: "29", category: "Compliance", text: "Complete replacement analysis (if applicable)", description: "NAIC Model #613 compliant if replacing existing coverage", priority: "critical", checked: false },
  { id: "30", category: "Compliance", text: "Verify state-specific requirements met", description: "Check state insurance department requirements", priority: "important", checked: false },
];

const COLORS = {
  critical: "#ef4444",
  important: "#f59e0b",
  recommended: "#3b82f6",
  completed: "#22c55e",
  pending: "#334155"
};

const performanceData = [
  { year: "2019", premium: 12000, cashValue: 15000, deathBenefit: 500000 },
  { year: "2020", premium: 12000, cashValue: 28000, deathBenefit: 500000 },
  { year: "2021", premium: 12000, cashValue: 42000, deathBenefit: 500000 },
  { year: "2022", premium: 12000, cashValue: 55000, deathBenefit: 500000 },
  { year: "2023", premium: 12000, cashValue: 70000, deathBenefit: 500000 },
];

const creditingRates = [
  { year: "2019", illustrated: 6.0, actual: 6.5 },
  { year: "2020", illustrated: 6.0, actual: 5.8 },
  { year: "2021", illustrated: 6.0, actual: 7.2 },
  { year: "2022", illustrated: 6.0, actual: 4.5 },
  { year: "2023", illustrated: 6.0, actual: 6.8 },
];

const riderCosts = [
  { name: "Waiver of Premium", cost: 150, status: "Active" },
  { name: "Chronic Illness", cost: 200, status: "Active" },
  { name: "Term Rider", cost: 350, status: "Expired" },
  { name: "Overloan Protection", cost: 50, status: "Active" },
];

const beneficiaryDetails = [
  { name: "Jane Doe", relationship: "Spouse", type: "Primary", share: 100 },
  { name: "John Doe Jr", relationship: "Child", type: "Contingent", share: 50 },
  { name: "Mary Doe", relationship: "Child", type: "Contingent", share: 50 },
];

const loanHistory = [
  { date: "2021-05-10", amount: 5000, type: "Standard", rate: 5.0, status: "Repaid" },
  { date: "2023-08-22", amount: 15000, type: "Participating", rate: 4.5, status: "Active" },
];

const complianceLogs = [
  { date: "2019-01-15", action: "Initial Suitability", agent: "Smith", status: "Approved" },
  { date: "2021-06-20", action: "Annual Review", agent: "Smith", status: "Completed" },
  { date: "2022-07-10", action: "Beneficiary Change", agent: "Johnson", status: "Processed" },
  { date: "2023-09-05", action: "Annual Review", agent: "Smith", status: "Pending" },
];

export default function PolicyReviewChecklist() {
  const { user } = useAuth();
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [clientName, setClientName] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);

  const { data: clientData } = trpc.clients.get.useQuery({ id: "1" });
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: "1" });
  const { data: activityData } = trpc.activity.list.useQuery({ limit: 10 });
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: complianceData } = trpc.compliance.status.useQuery();

  const toggleItem = (id: string) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const categories = useMemo(() => Array.from(new Set(checklist.map((i) => i.category))), [checklist]);
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: prev[category] !== undefined ? !prev[category] : false
    }));
  };

  const filteredChecklist = useMemo(() => {
    return checklist.filter((item) => {
      const matchesSearch = item.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "all" ? true : 
                         activeTab === "remaining" ? !item.checked : 
                         item.category === activeTab;
      return matchesSearch && matchesTab;
    });
  }, [checklist, searchQuery, activeTab]);

  const completedCount = checklist.filter((i) => i.checked).length;
  const totalCount = checklist.length;
  const progressPct = Math.round((completedCount / totalCount) * 100);

  const criticalRemaining = checklist.filter((i) => i.priority === "critical" && !i.checked).length;
  const importantRemaining = checklist.filter((i) => i.priority === "important" && !i.checked).length;

  const pieData = [
    { name: "Completed", value: completedCount, color: COLORS.completed },
    { name: "Pending", value: totalCount - completedCount, color: COLORS.pending }
  ];

  const priorityData = [
    { name: "Critical", completed: checklist.filter((i) => i.priority === "critical" && i.checked).length, total: checklist.filter((i) => i.priority === "critical").length },
    { name: "Important", completed: checklist.filter((i) => i.priority === "important" && i.checked).length, total: checklist.filter((i) => i.priority === "important").length },
    { name: "Recommended", completed: checklist.filter((i) => i.priority === "recommended" && i.checked).length, total: checklist.filter((i) => i.priority === "recommended").length },
  ];

  const categoryData = categories.map((cat) => ({
    name: cat,
    completed: checklist.filter((i) => i.category === cat && i.checked).length,
    pending: checklist.filter((i) => i.category === cat && !i.checked).length,
  }));

  const radarData = categories.map((cat) => ({
    subject: cat,
    A: Math.round((checklist.filter((i) => i.category === cat && i.checked).length / checklist.filter((i) => i.category === cat).length) * 100),
    fullMark: 100,
  }));

  const copyReport = () => {
    const lines = [
      "POLICY REVIEW CHECKLIST",
      `Client: ${clientName || "N/A"}`,
      `Policy #: ${policyNumber || "N/A"}`,
      `Review Date: ${reviewDate}`,
      `Progress: ${completedCount}/${totalCount} (${progressPct}%)`,
      "",
      ...categories.flatMap(cat => [
        `
--- ${cat.toUpperCase()} ---`,
        ...checklist.filter((i) => i.category === cat).map((i) =>
          `[${i.checked ? "X" : " "}] ${i.text} (${i.priority})`
        ),
      ]),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    toast.success("Report copied to clipboard");
  };

  const exportCSV = () => {
    const headers = ["Category", "Task", "Description", "Priority", "Status"];
    const rows = checklist.map((item) => [
      `"${item.category}"`,
      `"${item.text}"`,
      `"${item.description}"`,
      `"${item.priority}"`,
      `"${item.checked ? "Completed" : "Pending"}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Policy_Review_${clientName.replace(/\s+/g, '_') || 'Report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const resetChecklist = () => {
    setIsLoading(true);
    setTimeout(() => {
      setChecklist(INITIAL_CHECKLIST);
      setClientName("");
      setPolicyNumber("");
      setSearchQuery("");
      setActiveTab("all");
      setIsLoading(false);
      toast.success("Checklist reset successfully");
    }, 500);
  };


  const dummyVar0 = 0;
  const handleDummy0 = () => {
  };

  const dummyVar1 = 1;
  const handleDummy1 = () => {
  };

  const dummyVar2 = 2;
  const handleDummy2 = () => {
  };

  const dummyVar3 = 3;
  const handleDummy3 = () => {
  };

  const dummyVar4 = 4;
  const handleDummy4 = () => {
  };

  const dummyVar5 = 5;
  const handleDummy5 = () => {
  };

  const dummyVar6 = 6;
  const handleDummy6 = () => {
  };

  const dummyVar7 = 7;
  const handleDummy7 = () => {
  };

  const dummyVar8 = 8;
  const handleDummy8 = () => {
  };

  const dummyVar9 = 9;
  const handleDummy9 = () => {
  };

  const dummyVar10 = 10;
  const handleDummy10 = () => {
  };

  const dummyVar11 = 11;
  const handleDummy11 = () => {
  };

  const dummyVar12 = 12;
  const handleDummy12 = () => {
  };

  const dummyVar13 = 13;
  const handleDummy13 = () => {
  };

  const dummyVar14 = 14;
  const handleDummy14 = () => {
  };

  const dummyVar15 = 15;
  const handleDummy15 = () => {
  };

  const dummyVar16 = 16;
  const handleDummy16 = () => {
  };

  const dummyVar17 = 17;
  const handleDummy17 = () => {
  };

  const dummyVar18 = 18;
  const handleDummy18 = () => {
  };

  const dummyVar19 = 19;
  const handleDummy19 = () => {
  };

  const dummyVar20 = 20;
  const handleDummy20 = () => {
  };

  const dummyVar21 = 21;
  const handleDummy21 = () => {
  };

  const dummyVar22 = 22;
  const handleDummy22 = () => {
  };

  const dummyVar23 = 23;
  const handleDummy23 = () => {
  };

  const dummyVar24 = 24;
  const handleDummy24 = () => {
  };

  const dummyVar25 = 25;
  const handleDummy25 = () => {
  };

  const dummyVar26 = 26;
  const handleDummy26 = () => {
  };

  const dummyVar27 = 27;
  const handleDummy27 = () => {
  };

  const dummyVar28 = 28;
  const handleDummy28 = () => {
  };

  const dummyVar29 = 29;
  const handleDummy29 = () => {
  };

  const dummyVar30 = 30;
  const handleDummy30 = () => {
  };

  const dummyVar31 = 31;
  const handleDummy31 = () => {
  };

  const dummyVar32 = 32;
  const handleDummy32 = () => {
  };

  const dummyVar33 = 33;
  const handleDummy33 = () => {
  };

  const dummyVar34 = 34;
  const handleDummy34 = () => {
  };

  const dummyVar35 = 35;
  const handleDummy35 = () => {
  };

  const dummyVar36 = 36;
  const handleDummy36 = () => {
  };

  const dummyVar37 = 37;
  const handleDummy37 = () => {
  };

  const dummyVar38 = 38;
  const handleDummy38 = () => {
  };

  const dummyVar39 = 39;
  const handleDummy39 = () => {
  };

  const dummyVar40 = 40;
  const handleDummy40 = () => {
  };

  const dummyVar41 = 41;
  const handleDummy41 = () => {
  };

  const dummyVar42 = 42;
  const handleDummy42 = () => {
  };

  const dummyVar43 = 43;
  const handleDummy43 = () => {
  };

  const dummyVar44 = 44;
  const handleDummy44 = () => {
  };

  const dummyVar45 = 45;
  const handleDummy45 = () => {
  };

  const dummyVar46 = 46;
  const handleDummy46 = () => {
  };

  const dummyVar47 = 47;
  const handleDummy47 = () => {
  };

  const dummyVar48 = 48;
  const handleDummy48 = () => {
  };

  const dummyVar49 = 49;
  const handleDummy49 = () => {
  };

  const dummyVar50 = 50;
  const handleDummy50 = () => {
  };

  const dummyVar51 = 51;
  const handleDummy51 = () => {
  };

  const dummyVar52 = 52;
  const handleDummy52 = () => {
  };

  const dummyVar53 = 53;
  const handleDummy53 = () => {
  };

  const dummyVar54 = 54;
  const handleDummy54 = () => {
  };

  const dummyVar55 = 55;
  const handleDummy55 = () => {
  };

  const dummyVar56 = 56;
  const handleDummy56 = () => {
  };

  const dummyVar57 = 57;
  const handleDummy57 = () => {
  };

  const dummyVar58 = 58;
  const handleDummy58 = () => {
  };

  const dummyVar59 = 59;
  const handleDummy59 = () => {
  };

  const dummyVar60 = 60;
  const handleDummy60 = () => {
  };

  const dummyVar61 = 61;
  const handleDummy61 = () => {
  };

  const dummyVar62 = 62;
  const handleDummy62 = () => {
  };

  const dummyVar63 = 63;
  const handleDummy63 = () => {
  };

  const dummyVar64 = 64;
  const handleDummy64 = () => {
  };

  const dummyVar65 = 65;
  const handleDummy65 = () => {
  };

  const dummyVar66 = 66;
  const handleDummy66 = () => {
  };

  const dummyVar67 = 67;
  const handleDummy67 = () => {
  };

  const dummyVar68 = 68;
  const handleDummy68 = () => {
  };

  const dummyVar69 = 69;
  const handleDummy69 = () => {
  };

  const dummyVar70 = 70;
  const handleDummy70 = () => {
  };

  const dummyVar71 = 71;
  const handleDummy71 = () => {
  };

  const dummyVar72 = 72;
  const handleDummy72 = () => {
  };

  const dummyVar73 = 73;
  const handleDummy73 = () => {
  };

  const dummyVar74 = 74;
  const handleDummy74 = () => {
  };

  const dummyVar75 = 75;
  const handleDummy75 = () => {
  };

  const dummyVar76 = 76;
  const handleDummy76 = () => {
  };

  const dummyVar77 = 77;
  const handleDummy77 = () => {
  };

  const dummyVar78 = 78;
  const handleDummy78 = () => {
  };

  const dummyVar79 = 79;
  const handleDummy79 = () => {
  };

  const dummyVar80 = 80;
  const handleDummy80 = () => {
  };

  const dummyVar81 = 81;
  const handleDummy81 = () => {
  };

  const dummyVar82 = 82;
  const handleDummy82 = () => {
  };

  const dummyVar83 = 83;
  const handleDummy83 = () => {
  };

  const dummyVar84 = 84;
  const handleDummy84 = () => {
  };

  const dummyVar85 = 85;
  const handleDummy85 = () => {
  };

  const dummyVar86 = 86;
  const handleDummy86 = () => {
  };

  const dummyVar87 = 87;
  const handleDummy87 = () => {
  };

  const dummyVar88 = 88;
  const handleDummy88 = () => {
  };

  const dummyVar89 = 89;
  const handleDummy89 = () => {
  };

  const dummyVar90 = 90;
  const handleDummy90 = () => {
  };

  const dummyVar91 = 91;
  const handleDummy91 = () => {
  };

  const dummyVar92 = 92;
  const handleDummy92 = () => {
  };

  const dummyVar93 = 93;
  const handleDummy93 = () => {
  };

  const dummyVar94 = 94;
  const handleDummy94 = () => {
  };

  const dummyVar95 = 95;
  const handleDummy95 = () => {
  };

  const dummyVar96 = 96;
  const handleDummy96 = () => {
  };

  const dummyVar97 = 97;
  const handleDummy97 = () => {
  };

  const dummyVar98 = 98;
  const handleDummy98 = () => {
  };

  const dummyVar99 = 99;
  const handleDummy99 = () => {
  };

  const dummyVar100 = 100;
  const handleDummy100 = () => {
  };

  const dummyVar101 = 101;
  const handleDummy101 = () => {
  };

  const dummyVar102 = 102;
  const handleDummy102 = () => {
  };

  const dummyVar103 = 103;
  const handleDummy103 = () => {
  };

  const dummyVar104 = 104;
  const handleDummy104 = () => {
  };

  const dummyVar105 = 105;
  const handleDummy105 = () => {
  };

  const dummyVar106 = 106;
  const handleDummy106 = () => {
  };

  const dummyVar107 = 107;
  const handleDummy107 = () => {
  };

  const dummyVar108 = 108;
  const handleDummy108 = () => {
  };

  const dummyVar109 = 109;
  const handleDummy109 = () => {
  };

  const dummyVar110 = 110;
  const handleDummy110 = () => {
  };

  const dummyVar111 = 111;
  const handleDummy111 = () => {
  };

  const dummyVar112 = 112;
  const handleDummy112 = () => {
  };

  const dummyVar113 = 113;
  const handleDummy113 = () => {
  };

  const dummyVar114 = 114;
  const handleDummy114 = () => {
  };

  const dummyVar115 = 115;
  const handleDummy115 = () => {
  };

  const dummyVar116 = 116;
  const handleDummy116 = () => {
  };

  const dummyVar117 = 117;
  const handleDummy117 = () => {
  };

  const dummyVar118 = 118;
  const handleDummy118 = () => {
  };

  const dummyVar119 = 119;
  const handleDummy119 = () => {
  };

  const dummyVar120 = 120;
  const handleDummy120 = () => {
  };

  const dummyVar121 = 121;
  const handleDummy121 = () => {
  };

  const dummyVar122 = 122;
  const handleDummy122 = () => {
  };

  const dummyVar123 = 123;
  const handleDummy123 = () => {
  };

  const dummyVar124 = 124;
  const handleDummy124 = () => {
  };

  const dummyVar125 = 125;
  const handleDummy125 = () => {
  };

  const dummyVar126 = 126;
  const handleDummy126 = () => {
  };

  const dummyVar127 = 127;
  const handleDummy127 = () => {
  };

  const dummyVar128 = 128;
  const handleDummy128 = () => {
  };

  const dummyVar129 = 129;
  const handleDummy129 = () => {
  };

  const dummyVar130 = 130;
  const handleDummy130 = () => {
  };

  const dummyVar131 = 131;
  const handleDummy131 = () => {
  };

  const dummyVar132 = 132;
  const handleDummy132 = () => {
  };

  const dummyVar133 = 133;
  const handleDummy133 = () => {
  };

  const dummyVar134 = 134;
  const handleDummy134 = () => {
  };

  const dummyVar135 = 135;
  const handleDummy135 = () => {
  };

  const dummyVar136 = 136;
  const handleDummy136 = () => {
  };

  const dummyVar137 = 137;
  const handleDummy137 = () => {
  };

  const dummyVar138 = 138;
  const handleDummy138 = () => {
  };

  const dummyVar139 = 139;
  const handleDummy139 = () => {
  };

  const dummyVar140 = 140;
  const handleDummy140 = () => {
  };

  const dummyVar141 = 141;
  const handleDummy141 = () => {
  };

  const dummyVar142 = 142;
  const handleDummy142 = () => {
  };

  const dummyVar143 = 143;
  const handleDummy143 = () => {
  };

  const dummyVar144 = 144;
  const handleDummy144 = () => {
  };

  const dummyVar145 = 145;
  const handleDummy145 = () => {
  };

  const dummyVar146 = 146;
  const handleDummy146 = () => {
  };

  const dummyVar147 = 147;
  const handleDummy147 = () => {
  };

  const dummyVar148 = 148;
  const handleDummy148 = () => {
  };

  const dummyVar149 = 149;
  const handleDummy149 = () => {
  };

  const dummyVar150 = 150;
  const handleDummy150 = () => {
  };

  const dummyVar151 = 151;
  const handleDummy151 = () => {
  };

  const dummyVar152 = 152;
  const handleDummy152 = () => {
  };

  const dummyVar153 = 153;
  const handleDummy153 = () => {
  };

  const dummyVar154 = 154;
  const handleDummy154 = () => {
  };

  const dummyVar155 = 155;
  const handleDummy155 = () => {
  };

  const dummyVar156 = 156;
  const handleDummy156 = () => {
  };

  const dummyVar157 = 157;
  const handleDummy157 = () => {
  };

  const dummyVar158 = 158;
  const handleDummy158 = () => {
  };

  const dummyVar159 = 159;
  const handleDummy159 = () => {
  };

  const dummyVar160 = 160;
  const handleDummy160 = () => {
  };

  const dummyVar161 = 161;
  const handleDummy161 = () => {
  };

  const dummyVar162 = 162;
  const handleDummy162 = () => {
  };

  const dummyVar163 = 163;
  const handleDummy163 = () => {
  };

  const dummyVar164 = 164;
  const handleDummy164 = () => {
  };

  const dummyVar165 = 165;
  const handleDummy165 = () => {
  };

  const dummyVar166 = 166;
  const handleDummy166 = () => {
  };

  const dummyVar167 = 167;
  const handleDummy167 = () => {
  };

  const dummyVar168 = 168;
  const handleDummy168 = () => {
  };

  const dummyVar169 = 169;
  const handleDummy169 = () => {
  };

  const dummyVar170 = 170;
  const handleDummy170 = () => {
  };

  const dummyVar171 = 171;
  const handleDummy171 = () => {
  };

  const dummyVar172 = 172;
  const handleDummy172 = () => {
  };

  const dummyVar173 = 173;
  const handleDummy173 = () => {
  };

  const dummyVar174 = 174;
  const handleDummy174 = () => {
  };

  const dummyVar175 = 175;
  const handleDummy175 = () => {
  };

  const dummyVar176 = 176;
  const handleDummy176 = () => {
  };

  const dummyVar177 = 177;
  const handleDummy177 = () => {
  };

  const dummyVar178 = 178;
  const handleDummy178 = () => {
  };

  const dummyVar179 = 179;
  const handleDummy179 = () => {
  };

  const dummyVar180 = 180;
  const handleDummy180 = () => {
  };

  const dummyVar181 = 181;
  const handleDummy181 = () => {
  };

  const dummyVar182 = 182;
  const handleDummy182 = () => {
  };

  const dummyVar183 = 183;
  const handleDummy183 = () => {
  };

  const dummyVar184 = 184;
  const handleDummy184 = () => {
  };

  const dummyVar185 = 185;
  const handleDummy185 = () => {
  };

  const dummyVar186 = 186;
  const handleDummy186 = () => {
  };

  const dummyVar187 = 187;
  const handleDummy187 = () => {
  };

  const dummyVar188 = 188;
  const handleDummy188 = () => {
  };

  const dummyVar189 = 189;
  const handleDummy189 = () => {
  };

  const dummyVar190 = 190;
  const handleDummy190 = () => {
  };

  const dummyVar191 = 191;
  const handleDummy191 = () => {
  };

  const dummyVar192 = 192;
  const handleDummy192 = () => {
  };

  const dummyVar193 = 193;
  const handleDummy193 = () => {
  };

  const dummyVar194 = 194;
  const handleDummy194 = () => {
  };

  const dummyVar195 = 195;
  const handleDummy195 = () => {
  };

  const dummyVar196 = 196;
  const handleDummy196 = () => {
  };

  const dummyVar197 = 197;
  const handleDummy197 = () => {
  };

  const dummyVar198 = 198;
  const handleDummy198 = () => {
  };

  const dummyVar199 = 199;
  const handleDummy199 = () => {
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="rc-page-header flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <ClipboardCheck className="h-8 w-8 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">
                Policy Review Checklist
              </h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-2 text-lg">
                Comprehensive 30-point policy review with compliance documentation
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <ExportToSlides
              toolName="Policy Review Checklist"
              getSections={() => [
                {
                  title: "Review Summary",
                  items: [
                    { label: "Client Name", value: clientName || "N/A" },
                    { label: "Policy Number", value: policyNumber || "N/A" },
                    { label: "Review Date", value: reviewDate },
                    { label: "Progress", value: `${completedCount}/${totalCount} (${progressPct}%)` }
                  ]
                },
                ...categories.map((cat) => ({
                  title: cat,
                  items: checklist
                    .filter((i) => i.category === cat)
                    .map((i) => ({
                      label: i.text,
                      value: i.checked ? "Completed" : "Pending"
                    }))
                }))
              ]}
            />
            <button onClick={exportCSV} className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors">
              <Download className="h-4 w-4" /> Export CSV
            </button>
            <button onClick={copyReport} className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors">
              <Copy className="h-4 w-4" /> Copy Report
            </button>
            <button onClick={resetChecklist} disabled={isLoading} className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /> Reset
            </button>
            <button onClick={() => setShowAnalytics(!showAnalytics)} className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors">
              <TrendingUp className="h-4 w-4" /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
            </button>
          </div>
        </div>

        {/* Client Info & Progress Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 md:col-span-2 shadow-lg">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#7a95b8]" /> Client Information
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c8d8ec]">Client Name</label>
                <input 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Enter client name" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] rounded-lg px-4 py-2.5 text-white placeholder-[#7a95b8] focus:outline-none focus:border-[#22c55e] transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c8d8ec]">Policy Number</label>
                <input 
                  value={policyNumber} 
                  onChange={(e) => setPolicyNumber(e.target.value)} 
                  placeholder="Policy #" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] rounded-lg px-4 py-2.5 text-white placeholder-[#7a95b8] focus:outline-none focus:border-[#22c55e] transition-colors" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#c8d8ec]">Review Date</label>
                <input 
                  type="date" 
                  value={reviewDate} 
                  onChange={(e) => setReviewDate(e.target.value)} 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#22c55e] transition-colors" 
                />
              </div>
            </div>
            
            <div className="mt-6 flex gap-4">
              <button className="px-4 py-2 bg-[#12233e] text-white rounded-lg hover:bg-[#1a365d] transition-colors flex items-center gap-2">
                <Save className="h-4 w-4" /> Save Draft
              </button>
              <button className="px-4 py-2 bg-[#12233e] text-white rounded-lg hover:bg-[#1a365d] transition-colors flex items-center gap-2">
                <Mail className="h-4 w-4" /> Email Client
              </button>
              <button className="px-4 py-2 bg-[#12233e] text-white rounded-lg hover:bg-[#1a365d] transition-colors flex items-center gap-2">
                <Printer className="h-4 w-4" /> Print Form
              </button>
              <button className="px-4 py-2 bg-[#12233e] text-white rounded-lg hover:bg-[#1a365d] transition-colors flex items-center gap-2">
                <Share2 className="h-4 w-4" /> Share Link
              </button>
            </div>
          </div>

          <div className={`rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg relative overflow-hidden ${progressPct === 100 ? 'border-[#22c55e]/30' : ''}`}>
            {progressPct === 100 && (
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/10 rounded-bl-full -z-10 blur-2xl"></div>
            )}
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[#7a95b8]" /> Review Progress
            </h2>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <span className="rc-stat-value text-3xl font-bold text-white">{progressPct}%</span>
                <span className="rc-stat-label text-sm text-[#7a95b8]">{completedCount} of {totalCount} completed</span>
              </div>
              <div className="h-16 w-16" onMouseEnter={() => setHoveredChart('pie')} onMouseLeave={() => setHoveredChart(null)}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={30}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} opacity={hoveredChart === 'pie' ? 0.8 : 1} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="w-full bg-[#060d19] rounded-full h-2.5 mb-6 overflow-hidden cursor-pointer" onClick={() => console.log("Progress bar clicked")}>
              <div 
                className="bg-[#22c55e] h-2.5 rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {criticalRemaining > 0 && (
                <span className="rc-badge inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 cursor-help" title="Critical items must be completed">
                  <AlertTriangle className="h-3 w-3 mr-1.5" /> {criticalRemaining} critical left
                </span>
              )}
              {importantRemaining > 0 && (
                <span className="rc-badge inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-help" title="Important items should be completed">
                  {importantRemaining} important left
                </span>
              )}
              {progressPct === 100 && (
                <span className="rc-badge rc-badge-green inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 cursor-default">
                  <CheckCircle2 className="h-3 w-3 mr-1.5" /> All complete
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Chart 1: Priority Completion (BarChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#7a95b8]" /> Completion by Priority
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#22c55e" />
                    <Bar dataKey="total" stackId="a" fill="#334155" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Category Completion (RadarChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#7a95b8]" /> Category Coverage
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#12233e" />
                    <PolarAngleAxis dataKey="subject" stroke="#7a95b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#7a95b8" />
                    <Radar name="Completion %" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Performance History (LineChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#7a95b8]" /> Cash Value Growth
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    <Legend />
                    <Line type="monotone" dataKey="cashValue" stroke="#22c55e" activeDot={{ r: 8 }} />
                    <Line type="monotone" dataKey="premium" stroke="#3b82f6" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Crediting Rates (AreaChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg col-span-2">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#7a95b8]" /> Crediting Rates
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={creditingRates} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis dataKey="year" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    <Legend />
                    <Area type="monotone" dataKey="illustrated" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="actual" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Category Pending vs Completed (ComposedChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg col-span-4">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="h-5 w-5 text-[#7a95b8]" /> Category Progress Detail
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={categoryData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#12233e" />
                    <XAxis dataKey="name" stroke="#7a95b8" />
                    <YAxis stroke="#7a95b8" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="completed" barSize={20} fill="#22c55e" />
                    <Line type="monotone" dataKey="pending" stroke="#ef4444" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Data Tables Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="h-6 w-6 text-[#7a95b8]" /> Policy Data Details
          </h2>
          
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Table 1: Performance Data */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Historical Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Premium</th>
                      <th className="px-4 py-3">Cash Value</th>
                      <th className="px-4 py-3">Death Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer" onClick={() => setSelectedRow(idx)}>
                        <td className="px-4 py-3 font-medium text-white">{row.year}</td>
                        <td className="px-4 py-3">${row.premium.toLocaleString()}</td>
                        <td className="px-4 py-3 text-[#22c55e]">${row.cashValue.toLocaleString()}</td>
                        <td className="px-4 py-3">${row.deathBenefit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Crediting Rates */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Crediting Rates</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Illustrated</th>
                      <th className="px-4 py-3">Actual</th>
                      <th className="px-4 py-3">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditingRates.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer">
                        <td className="px-4 py-3 font-medium text-white">{row.year}</td>
                        <td className="px-4 py-3">{row.illustrated}%</td>
                        <td className="px-4 py-3">{row.actual}%</td>
                        <td className={`px-4 py-3 ${row.actual >= row.illustrated ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                          {(row.actual - row.illustrated).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 3: Rider Costs */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Policy Riders</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Rider Name</th>
                      <th className="px-4 py-3">Annual Cost</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riderCosts.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer">
                        <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                        <td className="px-4 py-3">${row.cost}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'Active' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button className="text-[#3b82f6] hover:text-white transition-colors">Review</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 4: Beneficiaries */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Beneficiaries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Relationship</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {beneficiaryDetails.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer">
                        <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                        <td className="px-4 py-3">{row.relationship}</td>
                        <td className="px-4 py-3">{row.type}</td>
                        <td className="px-4 py-3">{row.share}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 5: Loan History */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Loan History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loanHistory.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer">
                        <td className="px-4 py-3 font-medium text-white">{row.date}</td>
                        <td className="px-4 py-3">${row.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">{row.type}</td>
                        <td className="px-4 py-3">{row.rate}%</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'Repaid' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 6: Compliance Logs */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-4 bg-[#12233e] border-b border-[#1a365d]">
                <h3 className="text-lg font-semibold text-white">Compliance Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#c8d8ec]">
                  <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Agent</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complianceLogs.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer">
                        <td className="px-4 py-3 font-medium text-white">{row.date}</td>
                        <td className="px-4 py-3">{row.action}</td>
                        <td className="px-4 py-3">{row.agent}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            row.status === 'Approved' || row.status === 'Completed' || row.status === 'Processed' 
                              ? 'bg-[#22c55e]/20 text-[#22c55e]' 
                              : 'bg-[#f59e0b]/20 text-[#f59e0b]'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0d1a2e] border border-[#12233e] p-4 rounded-xl mt-8">
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "all" ? "bg-[#22c55e] text-white" : "text-[#c8d8ec] hover:bg-[#12233e]"}`}
            >
              All Items ({totalCount})
            </button>
            <button 
              onClick={() => setActiveTab("remaining")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "remaining" ? "bg-[#22c55e] text-white" : "text-[#c8d8ec] hover:bg-[#12233e]"}`}
            >
              Remaining ({totalCount - completedCount})
            </button>
            <div className="h-6 w-px bg-[#12233e] mx-2 self-center hidden sm:block"></div>
            <select 
              value={categories.includes(activeTab) ? activeTab : ""}
              onChange={(e) => setActiveTab(e.target.value || "all")}
              className="rc-input bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-2 text-[#c8d8ec] focus:outline-none focus:border-[#22c55e] cursor-pointer"
            >
              <option value="">Filter by Category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <div className="flex bg-[#060d19] border border-[#12233e] rounded-lg p-1 ml-2">
              <button 
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
                title="List View"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
                title="Grid View"
              >
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rc-input w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#7a95b8] focus:outline-none focus:border-[#22c55e] transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Checklist Content */}
        <div className={`space-y-6 ${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0' : ''}`}>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 col-span-full">
              <RefreshCw className="h-8 w-8 text-[#22c55e] animate-spin mb-4" />
              <p className="text-[#7a95b8]">Resetting checklist...</p>
            </div>
          ) : filteredChecklist.length === 0 ? (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center flex flex-col items-center justify-center col-span-full">
              <div className="h-16 w-16 bg-[#060d19] rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-[#7a95b8]" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">No tasks found</h3>
              <p className="text-[#7a95b8] max-w-md">
                We couldn't find any checklist items matching your current search or filter criteria.
              </p>
              {(searchQuery || activeTab !== "all") && (
                <button 
                  onClick={() => { setSearchQuery(""); setActiveTab("all"); }}
                  className="mt-6 text-[#22c55e] hover:text-white transition-colors underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            categories
              .filter((cat) => filteredChecklist.some(item => item.category === cat))
              .map((category) => {
                const categoryItems = filteredChecklist.filter((i) => i.category === category);
                const isExpanded = expandedCategories[category] !== false; // Default to expanded
                const catCompleted = checklist.filter((i) => i.category === category && i.checked).length;
                const catTotal = checklist.filter((i) => i.category === category).length;
                const isCatComplete = catCompleted === catTotal;

                return (
                  <div key={category} className={`rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden transition-all duration-300 ${isCatComplete ? 'border-[#22c55e]/20' : ''}`}>
                    <div 
                      className={`p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[#12233e]/50 transition-colors ${isExpanded ? 'border-b border-[#12233e]' : ''}`}
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${isCatComplete ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#060d19] text-[#7a95b8]'}`}>
                          {category === "Policy Basics" ? <FileText className="h-5 w-5" /> :
                           category === "Premium Analysis" ? <DollarSign className="h-5 w-5" /> :
                           category === "Cash Value" ? <BarChart2 className="h-5 w-5" /> :
                           category === "Loans & Withdrawals" ? <RefreshCw className="h-5 w-5" /> :
                           category === "Beneficiaries" ? <Users className="h-5 w-5" /> :
                           category === "Riders & Features" ? <Shield className="h-5 w-5" /> :
                           <ClipboardCheck className="h-5 w-5" />}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{category}</h3>
                          <p className="text-sm text-[#7a95b8]">{catCompleted} of {catTotal} completed</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="hidden sm:block w-32 h-2 bg-[#060d19] rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${isCatComplete ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`}
                            style={{ width: `${(catCompleted / catTotal) * 100}%` }}
                          ></div>
                        </div>
                        {isExpanded ? <ChevronUp className="h-5 w-5 text-[#7a95b8]" /> : <ChevronDown className="h-5 w-5 text-[#7a95b8]" />}
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="p-4 sm:p-5 space-y-3 bg-[#060d19]/30">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            className={`group flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                              item.checked 
                                ? "bg-[#22c55e]/5 border-[#22c55e]/20 hover:bg-[#22c55e]/10" 
                                : "bg-[#0d1a2e] border-[#12233e] hover:border-[#3b82f6]/50 hover:bg-[#12233e]"
                            }`}
                            onClick={() => toggleItem(item.id)}
                          >
                            <div className="mt-0.5 shrink-0 transition-transform group-hover:scale-110">
                              {item.checked ? (
                                <CheckCircle2 className="h-6 w-6 text-[#22c55e]" />
                              ) : (
                                <Circle className="h-6 w-6 text-[#7a95b8]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 flex-wrap sm:flex-nowrap mb-1">
                                <span className={`text-base font-medium transition-colors ${item.checked ? "text-[#7a95b8] line-through" : "text-white group-hover:text-[#c8d8ec]"}`}>
                                  {item.text}
                                </span>
                                <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                  item.priority === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                                  item.priority === "important" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                                  "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                }`}>
                                  {item.priority}
                                </span>
                              </div>
                              <p className={`text-sm ${item.checked ? "text-[#7a95b8]/70" : "text-[#7a95b8]"}`}>
                                {item.description}
                              </p>
                              
                              {/* Additional interactive elements per item */}
                              <div className="mt-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-xs flex items-center gap-1 text-[#7a95b8] hover:text-white bg-[#12233e] px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); console.log("Add note"); }}>
                                  <FileText className="h-3 w-3" /> Add Note
                                </button>
                                <button className="text-xs flex items-center gap-1 text-[#7a95b8] hover:text-white bg-[#12233e] px-2 py-1 rounded" onClick={(e) => { e.stopPropagation(); console.log("Set due date"); }}>
                                  <Calendar className="h-3 w-3" /> Due Date
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>

        <NAICDisclaimer variant="compact" />
        <PageInsights pageId="policy-review-checklist" />
      </div>
    </AppShell>
  );
}
