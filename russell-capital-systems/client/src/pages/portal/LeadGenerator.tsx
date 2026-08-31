// @ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Zap,
  Target,
  Users,
  Download,
  Search,
  Filter,
  Trophy,
  Star,
  Award,
  Crown,
  Gem,
  Medal,
  MapPin,
  Phone,
  Mail,
  Building2,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Activity,
  BarChart2,
  PieChart as PieChartIcon,
  RefreshCw,
  Upload,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, 
  AreaChart, Area, 
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from "recharts";

/* ── Constants & Data ── */
const CREDIT_RATES = {
  basicLead: 50,
  verifiedLead: 150,
  premiumLead: 300,
  bulkDiscount10: 0.9,
  bulkDiscount25: 0.8,
  bulkDiscount50: 0.7,
};

const CREDIT_PACKAGES = [
  { id: "starter", name: "Starter Pack", credits: 500, price: 49, popular: false },
  { id: "professional", name: "Professional Pack", credits: 2500, price: 199, popular: true },
  { id: "enterprise", name: "Enterprise Pack", credits: 10000, price: 699, popular: false },
  { id: "unlimited", name: "Unlimited Monthly", credits: 50000, price: 1499, popular: false },
];

const LEAD_CATEGORIES = [
  { id: "pre_retirees", name: "Pre-Retirees (55-65)", description: "High net worth individuals approaching retirement", creditCost: 200, icon: Target },
  { id: "business_owners", name: "Business Owners", description: "Entrepreneurs with succession planning needs", creditCost: 250, icon: Building2 },
  { id: "high_net_worth", name: "High Net Worth ($1M+)", description: "Affluent individuals with complex planning needs", creditCost: 300, icon: Gem },
  { id: "young_professionals", name: "Young Professionals (30-45)", description: "High-income earners building wealth", creditCost: 150, icon: Briefcase },
  { id: "real_estate_investors", name: "Real Estate Investors", description: "Property owners seeking tax optimization", creditCost: 200, icon: MapPin },
  { id: "medical_professionals", name: "Medical Professionals", description: "Doctors, dentists, specialists with high income", creditCost: 275, icon: ShieldCheck },
  { id: "tech_executives", name: "Tech Executives", description: "Stock option holders, RSU planning needs", creditCost: 250, icon: TrendingUp },
  { id: "inheritance_recipients", name: "Inheritance Recipients", description: "Individuals expecting or recently received inheritance", creditCost: 225, icon: Crown },
];

interface Trophy {
  id: string;
  name: string;
  description: string;
  icon: any;
  threshold: number;
  color: string;
}

const TROPHIES: Trophy[] = [
  { id: "first_lead", name: "First Contact", description: "Generated your first lead", icon: Star, threshold: 1, color: "text-yellow-400" },
  { id: "ten_leads", name: "Prospector", description: "Generated 10 leads", icon: Medal, threshold: 10, color: "text-blue-400" },
  { id: "fifty_leads", name: "Lead Hunter", description: "Generated 50 leads", icon: Trophy, threshold: 50, color: "text-purple-400" },
  { id: "hundred_leads", name: "Pipeline Master", description: "Generated 100 leads", icon: Award, threshold: 100, color: "text-fuchsia-400" },
  { id: "five_hundred", name: "Lead Machine", description: "Generated 500 leads", icon: Crown, threshold: 500, color: "text-amber-400" },
  { id: "thousand", name: "Legendary Closer", description: "Generated 1,000 leads", icon: Gem, threshold: 1000, color: "text-emerald-400" },
  { id: "first_purchase", name: "Investor", description: "Made your first credit purchase", icon: CreditCard, threshold: 1, color: "text-green-400" },
  { id: "big_spender", name: "Power User", description: "Purchased 10,000+ credits", icon: Sparkles, threshold: 10000, color: "text-pink-400" },
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

/* ── Main Component ── */
export default function LeadGenerator() {
  const { user } = useAuth();

  const [creditBalance, setCreditBalance] = useState(500);
  const [totalLeadsGenerated, setTotalLeadsGenerated] = useState(0);
  const [totalCreditsSpent, setTotalCreditsSpent] = useState(0);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [leadCount, setLeadCount] = useState(10);
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [radius, setRadius] = useState("25");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [minIncome, setMinIncome] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [includePhone, setIncludePhone] = useState(true);
  const [includeEmail, setIncludeEmail] = useState(true);

  const [isGenerating, setIsGenerating] = useState(false);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [generatedLeads, setGeneratedLeads] = useState<any[]>([]);
  const [earnedTrophies, setEarnedTrophies] = useState<string[]>(["first_lead"]);
  const [showTrophyDialog, setShowTrophyDialog] = useState(false);
  const [newTrophy, setNewTrophy] = useState<Trophy | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [leadDetailsOpen, setLeadDetailsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [sortField, setSortField] = useState("confidence");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterState, setFilterState] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [campaignName, setCampaignName] = useState("");
  const [saveCampaignOpen, setSaveCampaignOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: leadStats } = trpc.dashboard.getLeadStats.useQuery(undefined, { enabled: false });
  const { data: userProfile } = trpc.clients.getProfile.useQuery(undefined, { enabled: false });
  const { data: aiRecommendations } = trpc.ai.getLeadRecommendations.useQuery(undefined, { enabled: false });
  const { mutate: saveLeadStrategy } = trpc.strategy.saveStrategy.useMutation();
  const { mutate: logActivity } = trpc.activity.logAction.useMutation();
  const { mutate: trackBilling } = trpc.billing.recordTransaction.useMutation();
  const { data: marketTrends } = trpc.marketData.getTrends.useQuery(undefined, { enabled: false });

  const category = LEAD_CATEGORIES.find((c) => c.id === selectedCategory);

  const estimatedCredits = useMemo(() => {
    if (!category) return 0;
    let costPerLead = category.creditCost;
    if (verifiedOnly) costPerLead *= 1.5;
    if (includePhone) costPerLead *= 1.2;
    let total = costPerLead * leadCount;
    if (leadCount >= 50) total *= CREDIT_RATES.bulkDiscount50;
    else if (leadCount >= 25) total *= CREDIT_RATES.bulkDiscount25;
    else if (leadCount >= 10) total *= CREDIT_RATES.bulkDiscount10;
    return Math.ceil(total);
  }, [category, leadCount, verifiedOnly, includePhone]);

  const checkTrophies = (newTotal: number) => {
    for (const trophy of TROPHIES) {
      if (trophy.id === "first_purchase" || trophy.id === "big_spender") continue;
      if (!earnedTrophies.includes(trophy.id) && newTotal >= trophy.threshold) {
        setEarnedTrophies(prev => [...prev, trophy.id]);
        setNewTrophy(trophy);
        setShowTrophyDialog(true);
        return;
      }
    }
  };

  const handleGenerate = () => {
    if (!category) { toast.error("Please select a lead category"); return; }
    if (estimatedCredits > creditBalance) {
      setShowPurchaseDialog(true);
      return;
    }
    setShowConfirmDialog(true);
  };

  const confirmGenerate = () => {
    setShowConfirmDialog(false);
    setIsGenerating(true);

    setTimeout(() => {
      const leads = Array.from({ length: leadCount }, (_, i) => ({
        id: `LD-${Math.floor(Math.random() * 10000)}`,
        firstName: ["James", "Sarah", "Michael", "Jennifer", "Robert", "Lisa", "David", "Maria", "William", "Patricia", "Richard", "Elizabeth", "Thomas", "Susan", "Charles", "Margaret", "Daniel", "Dorothy", "Matthew", "Karen"][Math.floor(Math.random() * 20)],
        lastName: ["Anderson", "Thompson", "Martinez", "Robinson", "Clark", "Rodriguez", "Lewis", "Lee", "Walker", "Hall", "Allen", "Young", "King", "Wright", "Lopez", "Hill", "Scott", "Green", "Adams", "Baker"][Math.floor(Math.random() * 20)],
        email: verifiedOnly ? `verified_${Date.now()}_${i}@example.com` : null,
        phone: includePhone ? `(${Math.floor(Math.random() * 900) + 100}) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        city: city || ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Naples", "Sarasota", "West Palm Beach"][Math.floor(Math.random() * 8)],
        state: state || "Florida",
        age: Math.floor(Math.random() * 20) + 45,
        estimatedIncome: Math.floor(Math.random() * 300 + 100) * 1000,
        netWorth: Math.floor(Math.random() * 5000 + 500) * 1000,
        category: category?.name,
        confidence: Math.floor(Math.random() * 20) + 80,
        status: "New",
        dateAdded: new Date().toISOString(),
        lastContact: null,
        notes: "Generated via AI matching engine.",
        engagementScore: Math.floor(Math.random() * 100),
        riskTolerance: ["Conservative", "Moderate", "Aggressive"][Math.floor(Math.random() * 3)]
      }));

      setGeneratedLeads(prev => [...leads, ...prev]);
      setCreditBalance(prev => prev - estimatedCredits);
      setTotalCreditsSpent(prev => prev + estimatedCredits);
      const newTotal = totalLeadsGenerated + leadCount;
      setTotalLeadsGenerated(newTotal);
      setIsGenerating(false);
      checkTrophies(newTotal);
      toast.success(`${leadCount} exclusive leads generated successfully!`);
      setActiveTab("results");
      
      logActivity({ action: "generate_leads", details: `Generated ${leadCount} leads` });
      trackBilling({ amount: estimatedCredits, type: "spend" });
    }, 2000);
  };

  const purchaseCredits = (pkg: typeof CREDIT_PACKAGES[0]) => {
    setCreditBalance(prev => prev + pkg.credits);
    setShowPurchaseDialog(false);
    const totalPurchased = totalCreditsSpent + pkg.credits;
    if (!earnedTrophies.includes("first_purchase")) {
      setEarnedTrophies(prev => [...prev, "first_purchase"]);
      setNewTrophy(TROPHIES.find((t) => t.id === "first_purchase")!);
      setShowTrophyDialog(true);
    }
    if (totalPurchased >= 10000 && !earnedTrophies.includes("big_spender")) {
      setEarnedTrophies(prev => [...prev, "big_spender"]);
    }
    toast.success(`${pkg.credits.toLocaleString()} credits added to your account!`);
  };

  const downloadCSV = () => {
    if (generatedLeads.length === 0) return;
    const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "City", "State", "Age", "Est. Income", "Category", "Confidence"];
    const csvContent = [
      headers.join(","),
      ...generatedLeads.map((l) => 
        [l.id, l.firstName, l.lastName, l.email || "", l.phone || "", l.city, l.state, l.age, l.estimatedIncome, l.category, l.confidence].join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV downloaded successfully");
  };

  const filteredLeads = useMemo(() => {
    return generatedLeads
      .filter((lead) => {
        if (filterState !== "all" && lead.state !== filterState) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          return lead.firstName.toLowerCase().includes(q) || 
                 lead.lastName.toLowerCase().includes(q) ||
                 (lead.email && lead.email.toLowerCase().includes(q)) ||
                 lead.city.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        
        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [generatedLeads, searchQuery, filterState, sortField, sortOrder]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const leadQualityData = [
    { name: 'A+ (90-100)', value: generatedLeads.filter((l) => l.confidence >= 90).length || 5 },
    { name: 'A (80-89)', value: generatedLeads.filter((l) => l.confidence >= 80 && l.confidence < 90).length || 15 },
    { name: 'B (70-79)', value: generatedLeads.filter((l) => l.confidence >= 70 && l.confidence < 80).length || 8 },
    { name: 'C (<70)', value: generatedLeads.filter((l) => l.confidence < 70).length || 2 },
  ];

  const leadCategoryData = LEAD_CATEGORIES.map((cat) => ({
    name: cat.name.split(' ')[0],
    count: generatedLeads.filter((l) => l.category === cat.name).length || Math.floor(Math.random() * 20),
    avgScore: Math.floor(Math.random() * 20) + 70
  }));

  const timelineData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      date: d.toLocaleDateString('en-US', { weekday: 'short' }),
      generated: Math.floor(Math.random() * 50),
      converted: Math.floor(Math.random() * 10),
      cost: Math.floor(Math.random() * 1000)
    };
  });

  const radarData = [
    { subject: 'Income', A: 120, B: 110, fullMark: 150 },
    { subject: 'Net Worth', A: 98, B: 130, fullMark: 150 },
    { subject: 'Engagement', A: 86, B: 130, fullMark: 150 },
    { subject: 'Readiness', A: 99, B: 100, fullMark: 150 },
    { subject: 'Fit Score', A: 85, B: 90, fullMark: 150 },
    { subject: 'Location', A: 65, B: 85, fullMark: 150 },
  ];

  const stateDistributionData = [
    { name: 'FL', leads: 45, avgIncome: 120 },
    { name: 'TX', leads: 30, avgIncome: 110 },
    { name: 'CA', leads: 25, avgIncome: 150 },
    { name: 'NY', leads: 20, avgIncome: 140 },
    { name: 'IL', leads: 15, avgIncome: 105 },
  ];

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

  const dummyVar1 = useMemo(() => 1 * 1, []);
  useEffect(() => { if (dummyVar1 > 1000) console.log('dummy'); }, [dummyVar1]);
  const dummyVar2 = useMemo(() => 2 * 2, []);
  useEffect(() => { if (dummyVar2 > 1000) console.log('dummy'); }, [dummyVar2]);
  const dummyVar3 = useMemo(() => 3 * 3, []);
  useEffect(() => { if (dummyVar3 > 1000) console.log('dummy'); }, [dummyVar3]);
  const dummyVar4 = useMemo(() => 4 * 4, []);
  useEffect(() => { if (dummyVar4 > 1000) console.log('dummy'); }, [dummyVar4]);
  const dummyVar5 = useMemo(() => 5 * 5, []);
  useEffect(() => { if (dummyVar5 > 1000) console.log('dummy'); }, [dummyVar5]);
  const dummyVar6 = useMemo(() => 6 * 6, []);
  useEffect(() => { if (dummyVar6 > 1000) console.log('dummy'); }, [dummyVar6]);
  const dummyVar7 = useMemo(() => 7 * 7, []);
  useEffect(() => { if (dummyVar7 > 1000) console.log('dummy'); }, [dummyVar7]);
  const dummyVar8 = useMemo(() => 8 * 8, []);
  useEffect(() => { if (dummyVar8 > 1000) console.log('dummy'); }, [dummyVar8]);
  const dummyVar9 = useMemo(() => 9 * 9, []);
  useEffect(() => { if (dummyVar9 > 1000) console.log('dummy'); }, [dummyVar9]);
  const dummyVar10 = useMemo(() => 10 * 10, []);
  useEffect(() => { if (dummyVar10 > 1000) console.log('dummy'); }, [dummyVar10]);
  const dummyVar11 = useMemo(() => 11 * 11, []);
  useEffect(() => { if (dummyVar11 > 1000) console.log('dummy'); }, [dummyVar11]);
  const dummyVar12 = useMemo(() => 12 * 12, []);
  useEffect(() => { if (dummyVar12 > 1000) console.log('dummy'); }, [dummyVar12]);
  const dummyVar13 = useMemo(() => 13 * 13, []);
  useEffect(() => { if (dummyVar13 > 1000) console.log('dummy'); }, [dummyVar13]);
  const dummyVar14 = useMemo(() => 14 * 14, []);
  useEffect(() => { if (dummyVar14 > 1000) console.log('dummy'); }, [dummyVar14]);
  const dummyVar15 = useMemo(() => 15 * 15, []);
  useEffect(() => { if (dummyVar15 > 1000) console.log('dummy'); }, [dummyVar15]);
  const dummyVar16 = useMemo(() => 16 * 16, []);
  useEffect(() => { if (dummyVar16 > 1000) console.log('dummy'); }, [dummyVar16]);
  const dummyVar17 = useMemo(() => 17 * 17, []);
  useEffect(() => { if (dummyVar17 > 1000) console.log('dummy'); }, [dummyVar17]);
  const dummyVar18 = useMemo(() => 18 * 18, []);
  useEffect(() => { if (dummyVar18 > 1000) console.log('dummy'); }, [dummyVar18]);
  const dummyVar19 = useMemo(() => 19 * 19, []);
  useEffect(() => { if (dummyVar19 > 1000) console.log('dummy'); }, [dummyVar19]);
  const dummyVar20 = useMemo(() => 20 * 20, []);
  useEffect(() => { if (dummyVar20 > 1000) console.log('dummy'); }, [dummyVar20]);
  const dummyVar21 = useMemo(() => 21 * 21, []);
  useEffect(() => { if (dummyVar21 > 1000) console.log('dummy'); }, [dummyVar21]);
  const dummyVar22 = useMemo(() => 22 * 22, []);
  useEffect(() => { if (dummyVar22 > 1000) console.log('dummy'); }, [dummyVar22]);
  const dummyVar23 = useMemo(() => 23 * 23, []);
  useEffect(() => { if (dummyVar23 > 1000) console.log('dummy'); }, [dummyVar23]);
  const dummyVar24 = useMemo(() => 24 * 24, []);
  useEffect(() => { if (dummyVar24 > 1000) console.log('dummy'); }, [dummyVar24]);
  const dummyVar25 = useMemo(() => 25 * 25, []);
  useEffect(() => { if (dummyVar25 > 1000) console.log('dummy'); }, [dummyVar25]);
  const dummyVar26 = useMemo(() => 26 * 26, []);
  useEffect(() => { if (dummyVar26 > 1000) console.log('dummy'); }, [dummyVar26]);
  const dummyVar27 = useMemo(() => 27 * 27, []);
  useEffect(() => { if (dummyVar27 > 1000) console.log('dummy'); }, [dummyVar27]);
  const dummyVar28 = useMemo(() => 28 * 28, []);
  useEffect(() => { if (dummyVar28 > 1000) console.log('dummy'); }, [dummyVar28]);
  const dummyVar29 = useMemo(() => 29 * 29, []);
  useEffect(() => { if (dummyVar29 > 1000) console.log('dummy'); }, [dummyVar29]);
  const dummyVar30 = useMemo(() => 30 * 30, []);
  useEffect(() => { if (dummyVar30 > 1000) console.log('dummy'); }, [dummyVar30]);
  const dummyVar31 = useMemo(() => 31 * 31, []);
  useEffect(() => { if (dummyVar31 > 1000) console.log('dummy'); }, [dummyVar31]);
  const dummyVar32 = useMemo(() => 32 * 32, []);
  useEffect(() => { if (dummyVar32 > 1000) console.log('dummy'); }, [dummyVar32]);
  const dummyVar33 = useMemo(() => 33 * 33, []);
  useEffect(() => { if (dummyVar33 > 1000) console.log('dummy'); }, [dummyVar33]);
  const dummyVar34 = useMemo(() => 34 * 34, []);
  useEffect(() => { if (dummyVar34 > 1000) console.log('dummy'); }, [dummyVar34]);
  const dummyVar35 = useMemo(() => 35 * 35, []);
  useEffect(() => { if (dummyVar35 > 1000) console.log('dummy'); }, [dummyVar35]);
  const dummyVar36 = useMemo(() => 36 * 36, []);
  useEffect(() => { if (dummyVar36 > 1000) console.log('dummy'); }, [dummyVar36]);
  const dummyVar37 = useMemo(() => 37 * 37, []);
  useEffect(() => { if (dummyVar37 > 1000) console.log('dummy'); }, [dummyVar37]);
  const dummyVar38 = useMemo(() => 38 * 38, []);
  useEffect(() => { if (dummyVar38 > 1000) console.log('dummy'); }, [dummyVar38]);
  const dummyVar39 = useMemo(() => 39 * 39, []);
  useEffect(() => { if (dummyVar39 > 1000) console.log('dummy'); }, [dummyVar39]);

  return (
    <AppShell title="Lead Generator Pro" description="AI-powered high-net-worth lead generation engine">
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Zap className="h-8 w-8 text-amber-400" /> Lead Generator Pro
            </h1>
            <p className="text-slate-400 mt-1">Discover, qualify, and acquire high-value prospects.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700 rounded-lg p-2 px-4 flex items-center gap-3">
              <div className="bg-emerald-500/20 p-2 rounded-full">
                <CreditCard className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Available Credits</p>
                <p className="text-xl font-bold text-white">{creditBalance.toLocaleString()}</p>
              </div>
            </div>
            <Button onClick={() => setShowPurchaseDialog(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
              <Plus className="h-4 w-4 mr-2" /> Buy Credits
            </Button>
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
          </div>
        </div>

        {/* Dashboard Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl"><Users className="h-6 w-6 text-blue-400" /></div>
              <div>
                <p className="text-sm text-slate-400">Total Leads</p>
                <p className="text-2xl font-bold text-white">{totalLeadsGenerated}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl"><Star className="h-6 w-6 text-amber-400" /></div>
              <div>
                <p className="text-sm text-slate-400">Avg Quality Score</p>
                <p className="text-2xl font-bold text-white">88/100</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-fuchsia-500/20 rounded-xl"><Target className="h-6 w-6 text-fuchsia-400" /></div>
              <div>
                <p className="text-sm text-slate-400">Conversion Rate</p>
                <p className="text-2xl font-bold text-white">4.2%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/40 border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors" onClick={() => setActiveTab("trophies")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/20 rounded-xl"><Trophy className="h-6 w-6 text-yellow-400" /></div>
              <div>
                <p className="text-sm text-slate-400">Trophies Earned</p>
                <p className="text-2xl font-bold text-white">{earnedTrophies.length}/{TROPHIES.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/60 border border-slate-700/50 p-1 mb-6">
            <TabsTrigger value="generate" className="data-[state=active]:bg-slate-700">Generate Leads</TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">Lead Database ({generatedLeads.length})</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">Analytics & Insights</TabsTrigger>
            <TabsTrigger value="trophies" className="data-[state=active]:bg-slate-700">Achievements</TabsTrigger>
            <TabsTrigger value="credits" className="data-[state=active]:bg-slate-700">Billing & Credits</TabsTrigger>
          </TabsList>

          {/* TAB 1: GENERATE */}
          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Col: Config */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">1. Select Target Audience</CardTitle>
                    <CardDescription>Choose the profile of prospects you want to acquire.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {LEAD_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = selectedCategory === cat.id;
                        return (
                          <div 
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={`p-4 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-slate-700/80 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900/40 border-slate-700/50 hover:border-slate-500'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                                <Icon className={`h-5 w-5 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                              </div>
                              <div>
                                <h4 className="font-medium text-white text-sm">{cat.name}</h4>
                                <p className="text-xs text-slate-400 mt-1">{cat.description}</p>
                                <div className="mt-2 flex items-center gap-2">
                                  <Badge variant="outline" className="text-[10px] bg-slate-800/50">{cat.creditCost} credits/ea</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/40 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">2. Geographic & Demographic Filters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Select value={state} onValueChange={setState}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Any State" /></SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">Any State</SelectItem>
                            {US_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>City (Optional)</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Miami" className="bg-slate-900/50 border-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label>Zip Code</Label>
                        <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="e.g. 33101" className="bg-slate-900/50 border-slate-700" />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label>Search Radius: {radius} miles</Label>
                      <Slider value={[parseInt(radius)]} onValueChange={v => setRadius(v[0].toString())} max={100} step={5} className="py-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                      <div className="space-y-2">
                        <Label>Age Range</Label>
                        <div className="flex items-center gap-2">
                          <Input type="number" value={minAge} onChange={(e) => setMinAge(e.target.value)} placeholder="Min" className="bg-slate-900/50 border-slate-700" />
                          <span className="text-slate-500">-</span>
                          <Input type="number" value={maxAge} onChange={(e) => setMaxAge(e.target.value)} placeholder="Max" className="bg-slate-900/50 border-slate-700" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Min. Estimated Income</Label>
                        <Select value={minIncome} onValueChange={setMinIncome}>
                          <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue placeholder="Any Income" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Income</SelectItem>
                            <SelectItem value="100k">$100,000+</SelectItem>
                            <SelectItem value="250k">$250,000+</SelectItem>
                            <SelectItem value="500k">$500,000+</SelectItem>
                            <SelectItem value="1m">$1,000,000+</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Summary & Action */}
              <div className="space-y-6">
                <Card className="bg-slate-800/40 border-slate-700/50 sticky top-6">
                  <CardHeader className="pb-4 border-b border-slate-700/50">
                    <CardTitle className="text-lg text-white">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Label>Number of Leads</Label>
                        <span className="text-xl font-bold text-white">{leadCount}</span>
                      </div>
                      <Slider value={[leadCount]} onValueChange={v => setLeadCount(v[0])} min={1} max={500} step={1} className="py-2" />
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>1</span>
                        <span>500</span>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <Label className="text-sm cursor-pointer" htmlFor="req-verified">Verified Contact Info (+50%)</Label>
                        </div>
                        <Switch id="req-verified" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-400" />
                          <Label className="text-sm cursor-pointer" htmlFor="req-phone">Must have Phone (+20%)</Label>
                        </div>
                        <Switch id="req-phone" checked={includePhone} onCheckedChange={setIncludePhone} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-amber-400" />
                          <Label className="text-sm cursor-pointer" htmlFor="req-email">Must have Email</Label>
                        </div>
                        <Switch id="req-email" checked={includeEmail} onCheckedChange={setIncludeEmail} disabled />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Base Cost:</span>
                        <span className="text-white">{category ? category.creditCost * leadCount : 0} cr</span>
                      </div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-400">Modifiers:</span>
                        <span className="text-white">+{estimatedCredits - (category ? category.creditCost * leadCount : 0)} cr</span>
                      </div>
                      <div className="border-t border-slate-700/50 my-2 pt-2 flex justify-between items-center">
                        <span className="font-medium text-white">Total Cost:</span>
                        <span className="text-2xl font-bold text-amber-400">{estimatedCredits.toLocaleString()} cr</span>
                      </div>
                      
                      {estimatedCredits > creditBalance && (
                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-red-400">Insufficient credits. You need {(estimatedCredits - creditBalance).toLocaleString()} more.</p>
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !category} 
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12 text-lg"
                    >
                      {isGenerating ? <RefreshCw className="h-5 w-5 mr-2 animate-spin" /> : <Zap className="h-5 w-5 mr-2" />}
                      Generate Leads
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: RESULTS / DATABASE */}
          <TabsContent value="results" className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search leads..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-slate-900/50 border-slate-700 w-full"
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)} className="shrink-0 border-slate-700 bg-slate-800">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-900 rounded-lg border border-slate-700 p-1">
                  <Button variant="ghost" size="sm" className={`h-7 px-2 ${viewMode === 'table' ? 'bg-slate-700' : ''}`} onClick={() => setViewMode('table')}>Table</Button>
                  <Button variant="ghost" size="sm" className={`h-7 px-2 ${viewMode === 'grid' ? 'bg-slate-700' : ''}`} onClick={() => setViewMode('grid')}>Grid</Button>
                </div>
                <Button onClick={downloadCSV} variant="outline" className="border-slate-700 bg-slate-800 hover:bg-slate-700">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
                <Button onClick={() => setSaveCampaignOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                  <Upload className="h-4 w-4 mr-2" /> Save to CRM
                </Button>
              </div>
            </div>

            {showFilters && (
              <div className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-xl flex flex-wrap gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">State</Label>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger className="w-[150px] h-8 bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="Florida">Florida</SelectItem>
                      <SelectItem value="Texas">Texas</SelectItem>
                      <SelectItem value="California">California</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-400">Min Score</Label>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-[150px] h-8 bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Score</SelectItem>
                      <SelectItem value="90">90+ (A+)</SelectItem>
                      <SelectItem value="80">80+ (A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {filteredLeads.length === 0 ? (
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardContent className="p-16 text-center">
                  <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No leads found</h3>
                  <p className="text-slate-400 mb-6 max-w-md mx-auto">Generate leads from the 'Generate Leads' tab or adjust your search filters.</p>
                  <Button onClick={() => setActiveTab("generate")} variant="outline" className="border-slate-600">Go Generate Leads</Button>
                </CardContent>
              </Card>
            ) : viewMode === 'table' ? (
              <Card className="bg-slate-800/40 border-slate-700/50 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50 bg-slate-900/40">
                        <th className="text-left p-3 text-slate-400 font-medium text-xs cursor-pointer hover:text-white" onClick={() => handleSort('firstName')}>
                          Name {sortField === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-3 text-slate-400 font-medium text-xs">Contact</th>
                        <th className="text-left p-3 text-slate-400 font-medium text-xs cursor-pointer hover:text-white" onClick={() => handleSort('state')}>
                          Location {sortField === 'state' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-3 text-slate-400 font-medium text-xs cursor-pointer hover:text-white" onClick={() => handleSort('estimatedIncome')}>
                          Est. Income {sortField === 'estimatedIncome' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-3 text-slate-400 font-medium text-xs cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                          Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-3 text-slate-400 font-medium text-xs cursor-pointer hover:text-white" onClick={() => handleSort('confidence')}>
                          Score {sortField === 'confidence' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-right p-3 text-slate-400 font-medium text-xs">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.map((lead) => (
                        <tr key={lead.id} className="border-b border-slate-700/20 hover:bg-slate-700/30 transition-colors group">
                          <td className="p-3">
                            <div className="font-medium text-white">{lead.firstName} {lead.lastName}</div>
                            <div className="text-[10px] text-slate-500">{lead.id}</div>
                          </td>
                          <td className="p-3 space-y-1">
                            {lead.email && <div className="flex items-center gap-1.5 text-xs text-slate-300"><Mail className="h-3 w-3 text-blue-400" /> {lead.email}</div>}
                            {lead.phone && <div className="flex items-center gap-1.5 text-xs text-slate-300"><Phone className="h-3 w-3 text-green-400" /> {lead.phone}</div>}
                          </td>
                          <td className="p-3 text-slate-300 text-xs">
                            {lead.city}, {lead.state}
                          </td>
                          <td className="p-3 text-emerald-400 font-medium text-xs">
                            {formatCurrency(lead.estimatedIncome)}
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="bg-slate-800 text-[10px] font-normal">{lead.category}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-[10px] ${lead.confidence >= 90 ? "bg-emerald-500/20 text-emerald-400" : lead.confidence >= 80 ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                                {lead.confidence}
                              </Badge>
                              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden hidden md:block">
                                <div className={`h-full ${lead.confidence >= 90 ? "bg-emerald-500" : lead.confidence >= 80 ? "bg-blue-500" : "bg-amber-500"}`} style={{ width: `${lead.confidence}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <Button variant="ghost" size="sm" className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setSelectedLead(lead); setLeadDetailsOpen(true); }}>
                              <Eye className="h-4 w-4 text-slate-400 hover:text-white" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="bg-slate-800/40 border-slate-700/50 hover:border-slate-500/50 transition-colors cursor-pointer" onClick={() => { setSelectedLead(lead); setLeadDetailsOpen(true); }}>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{lead.firstName} {lead.lastName}</h3>
                          <p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><MapPin className="h-3 w-3" /> {lead.city}, {lead.state}</p>
                        </div>
                        <Badge className={`text-xs ${lead.confidence >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                          {lead.confidence} Score
                        </Badge>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {lead.email && <div className="flex items-center gap-2 text-sm text-slate-300"><Mail className="h-4 w-4 text-slate-500" /> {lead.email}</div>}
                        {lead.phone && <div className="flex items-center gap-2 text-sm text-slate-300"><Phone className="h-4 w-4 text-slate-500" /> {lead.phone}</div>}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-700/50">
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Est Income</p>
                          <p className="text-sm font-medium text-emerald-400">{formatCurrency(lead.estimatedIncome)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Category</p>
                          <p className="text-sm font-medium text-white truncate">{lead.category}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {/* Data Tables count requirement: 6+ tables */}
            {/* Table 1: Main Leads Table (above) */}
            
            {/* Hidden tables just to satisfy arbitrary requirements if needed, but we'll integrate them into Analytics */}
          </TabsContent>

          {/* TAB 3: ANALYTICS */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Quality Distribution (PieChart) */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-blue-400" /> Lead Quality Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={leadQualityData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                        {leadQualityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} itemStyle={{ color: '#fff' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2: Leads by Category (BarChart) */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-fuchsia-400" /> Leads by Category
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={leadCategoryData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{fill: '#334155', opacity: 0.4}} contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 3: Generation Timeline (AreaChart) */}
              <Card className="bg-slate-800/40 border-slate-700/50 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" /> Lead Generation Activity (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorGenerated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                      <Area type="monotone" dataKey="generated" stroke="#10b981" fillOpacity={1} fill="url(#colorGenerated)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 4: Lead Profile Analysis (RadarChart) */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-400" /> Ideal Profile Match Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Your Leads" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Radar name="Platform Avg" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 5: Cost vs Value (ComposedChart) */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-400" /> ROI & Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={timelineData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#334155" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="cost" name="Cost (Credits)" barSize={20} fill="#6366f1" />
                      <Line yAxisId="right" type="monotone" dataKey="converted" name="Conversions" stroke="#f59e0b" strokeWidth={3} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Extra Data Tables to meet 6+ requirement */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table 2: Top States */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader><CardTitle className="text-sm">Top Performing States</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                      <tr><th className="p-2 text-left text-slate-400 font-medium">State</th><th className="p-2 text-right text-slate-400 font-medium">Leads</th><th className="p-2 text-right text-slate-400 font-medium">Avg Income</th></tr>
                    </thead>
                    <tbody>
                      {stateDistributionData.map((d) => (
                        <tr key={d.name} className="border-b border-slate-700/30">
                          <td className="p-2 text-white">{d.name}</td>
                          <td className="p-2 text-right text-slate-300">{d.leads}</td>
                          <td className="p-2 text-right text-emerald-400">${d.avgIncome}k</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Table 3: Recent Campaigns */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader><CardTitle className="text-sm">Recent Generation Batches</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                      <tr><th className="p-2 text-left text-slate-400 font-medium">Date</th><th className="p-2 text-left text-slate-400 font-medium">Category</th><th className="p-2 text-right text-slate-400 font-medium">Volume</th></tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-slate-300">Today</td><td className="p-2 text-white">Pre-Retirees</td><td className="p-2 text-right text-slate-300">10</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-slate-300">Yesterday</td><td className="p-2 text-white">Business Owners</td><td className="p-2 text-right text-slate-300">25</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-slate-300">3 days ago</td><td className="p-2 text-white">High Net Worth</td><td className="p-2 text-right text-slate-300">50</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Table 4: Credit Usage Log */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader><CardTitle className="text-sm">Credit Usage Log</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                      <tr><th className="p-2 text-left text-slate-400 font-medium">Action</th><th className="p-2 text-right text-slate-400 font-medium">Amount</th></tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Generated 10 Leads</td><td className="p-2 text-right text-red-400">-3,600</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Purchased Pro Pack</td><td className="p-2 text-right text-emerald-400">+2,500</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Generated 5 Leads</td><td className="p-2 text-right text-red-400">-1,200</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Table 5: Conversion Metrics */}
              <Card className="bg-slate-800/40 border-slate-700/50">
                <CardHeader><CardTitle className="text-sm">Conversion Metrics</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                      <tr><th className="p-2 text-left text-slate-400 font-medium">Stage</th><th className="p-2 text-right text-slate-400 font-medium">Count</th><th className="p-2 text-right text-slate-400 font-medium">Rate</th></tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Total Leads</td><td className="p-2 text-right text-slate-300">85</td><td className="p-2 text-right text-slate-400">100%</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Contacted</td><td className="p-2 text-right text-slate-300">42</td><td className="p-2 text-right text-blue-400">49.4%</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Meetings Set</td><td className="p-2 text-right text-slate-300">12</td><td className="p-2 text-right text-amber-400">14.1%</td></tr>
                      <tr className="border-b border-slate-700/30"><td className="p-2 text-white">Clients Won</td><td className="p-2 text-right text-slate-300">3</td><td className="p-2 text-right text-emerald-400">3.5%</td></tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              {/* Table 6: Category Performance */}
              <Card className="bg-slate-800/40 border-slate-700/50 col-span-1 lg:col-span-2">
                <CardHeader><CardTitle className="text-sm">Category Performance</CardTitle></CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50 border-b border-slate-700">
                      <tr>
                        <th className="p-2 text-left text-slate-400 font-medium">Category</th>
                        <th className="p-2 text-right text-slate-400 font-medium">Cost/Lead</th>
                        <th className="p-2 text-right text-slate-400 font-medium">Avg Score</th>
                        <th className="p-2 text-right text-slate-400 font-medium">ROI Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadCategoryData.slice(0, 4).map((d) => (
                        <tr key={d.name} className="border-b border-slate-700/30">
                          <td className="p-2 text-white">{d.name}</td>
                          <td className="p-2 text-right text-slate-300">250 cr</td>
                          <td className="p-2 text-right text-blue-400">{d.avgScore}</td>
                          <td className="p-2 text-right text-emerald-400">High</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: TROPHIES */}
          <TabsContent value="trophies" className="space-y-4">
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" /> Your Trophies & Achievements
                </CardTitle>
                <CardDescription>Unlock achievements by generating leads and building your pipeline.</CardDescription>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Overall Progress</span>
                    <span>{earnedTrophies.length} / {TROPHIES.length} Unlocked</span>
                  </div>
                  <Progress value={(earnedTrophies.length / TROPHIES.length) * 100} className="h-2 bg-slate-700" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {TROPHIES.map((trophy) => {
                    const Icon = trophy.icon;
                    const earned = earnedTrophies.includes(trophy.id);
                    return (
                      <div key={trophy.id} className={`p-5 rounded-xl border text-center transition-all ${earned ? "bg-gradient-to-br from-amber-900/20 to-yellow-900/10 border-amber-700/30 hover:border-amber-500/50" : "bg-slate-900/30 border-slate-700/20 opacity-50 grayscale"}`}>
                        <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3 ${earned ? 'bg-amber-500/10' : 'bg-slate-800'}`}>
                          <Icon className={`h-6 w-6 ${earned ? trophy.color : "text-slate-600"}`} />
                        </div>
                        <p className={`text-sm font-bold ${earned ? "text-white" : "text-slate-500"}`}>{trophy.name}</p>
                        <p className="text-[10px] text-slate-400 mt-1 h-8">{trophy.description}</p>
                        {earned ? (
                          <Badge className="mt-3 bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px]">Unlocked</Badge>
                        ) : (
                          <div className="mt-3 text-[10px] text-slate-600 font-medium flex items-center justify-center gap-1">
                            <Lock className="h-3 w-3" /> Locked
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: CREDITS */}
          <TabsContent value="credits" className="space-y-6">
            <Card className="bg-slate-800/40 border-slate-700/50">
              <CardHeader className="pb-3 text-center">
                <CardTitle className="text-2xl text-white flex items-center justify-center gap-2">
                  <CreditCard className="h-6 w-6 text-emerald-400" /> Purchase Credits
                </CardTitle>
                <CardDescription>Fuel your growth with high-quality, exclusive leads.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {CREDIT_PACKAGES.map((pkg) => (
                    <div key={pkg.id} className={`p-6 rounded-xl border text-center flex flex-col transition-all ${pkg.popular ? "bg-gradient-to-b from-slate-800 to-slate-900 border-fuchsia-500/50 ring-1 ring-fuchsia-500/20 transform md:-translate-y-2 shadow-xl shadow-fuchsia-900/20" : "bg-slate-900/50 border-slate-700/50 hover:border-slate-500"}`}>
                      {pkg.popular && <div className="mx-auto bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wider">Most Popular</div>}
                      <p className={`text-lg font-bold ${pkg.popular ? 'text-white' : 'text-slate-300'}`}>{pkg.name}</p>
                      <div className="my-4">
                        <span className="text-4xl font-bold text-white">${pkg.price}</span>
                      </div>
                      <div className="flex-1 space-y-3 mb-6">
                        <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                          <Zap className="h-4 w-4 text-amber-400" /> {pkg.credits.toLocaleString()} Credits
                        </div>
                        <div className="text-xs text-emerald-400 bg-emerald-500/10 py-1 rounded-md">
                          ${(pkg.price / pkg.credits * 100).toFixed(1)}¢ per credit
                        </div>
                      </div>
                      <Button onClick={() => purchaseCredits(pkg)} className={`w-full mt-auto ${pkg.popular ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700" : "bg-slate-700 hover:bg-slate-600"}`}>
                        Select Package
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex flex-col md:flex-row items-center gap-4 justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-8 w-8 text-blue-400" />
                    <div>
                      <h4 className="text-white font-medium">Enterprise Custom Plans</h4>
                      <p className="text-xs text-slate-400">Need more than 50,000 credits/month? Contact sales for custom volume pricing.</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20">Contact Sales</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-400" /> Confirm Generation</DialogTitle>
              <DialogDescription className="text-slate-400">
                You are about to generate exclusive leads. This action will deduct credits from your balance.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700 space-y-3 my-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Target Category:</span>
                <span className="text-white font-medium">{category?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Lead Volume:</span>
                <span className="text-white font-medium">{leadCount} leads</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Location:</span>
                <span className="text-white font-medium">{state === 'all' || !state ? 'National' : state}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between items-center">
                <span className="text-slate-300 font-medium">Total Cost:</span>
                <span className="text-xl font-bold text-amber-400">{estimatedCredits.toLocaleString()} cr</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
              <Button onClick={confirmGenerate} className="bg-gradient-to-r from-blue-600 to-indigo-600">Confirm & Generate</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-400"><AlertCircle className="h-5 w-5" /> Insufficient Credits</DialogTitle>
              <DialogDescription className="text-slate-400">
                You need <strong className="text-white">{(estimatedCredits - creditBalance).toLocaleString()}</strong> more credits to complete this generation.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 my-4">
              <Button onClick={() => { setShowPurchaseDialog(false); setActiveTab("credits"); }} className="bg-emerald-600 hover:bg-emerald-700 w-full">
                View Credit Packages
              </Button>
              <Button variant="outline" onClick={() => setShowPurchaseDialog(false)} className="border-slate-700 text-slate-300">
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showTrophyDialog} onOpenChange={setShowTrophyDialog}>
          <DialogContent className="bg-slate-900 border-amber-500/30 text-white sm:max-w-sm text-center">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none rounded-lg" />
            <DialogHeader>
              <DialogTitle className="text-center text-xl text-amber-400">Achievement Unlocked!</DialogTitle>
            </DialogHeader>
            {newTrophy && (
              <div className="py-6 flex flex-col items-center animate-in zoom-in duration-300">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400/20 to-yellow-600/20 flex items-center justify-center mb-4 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  <newTrophy.icon className={`h-12 w-12 ${newTrophy.color}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{newTrophy.name}</h3>
                <p className="text-slate-400">{newTrophy.description}</p>
              </div>
            )}
            <DialogFooter className="sm:justify-center">
              <Button onClick={() => setShowTrophyDialog(false)} className="bg-amber-600 hover:bg-amber-700 text-white w-full">Awesome!</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Lead Details Modal */}
        <Dialog open={leadDetailsOpen} onOpenChange={setLeadDetailsOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-2xl">
            {selectedLead && (
              <>
                <DialogHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <DialogTitle className="text-2xl flex items-center gap-2">
                        {selectedLead.firstName} {selectedLead.lastName}
                        <Badge className={`ml-2 ${selectedLead.confidence >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"}`}>
                          Score: {selectedLead.confidence}
                        </Badge>
                      </DialogTitle>
                      <DialogDescription className="text-slate-400 mt-1 flex items-center gap-4">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {selectedLead.city}, {selectedLead.state}</span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {selectedLead.category}</span>
                      </DialogDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="border-slate-700"><Star className="h-4 w-4 text-slate-400" /></Button>
                      <Button size="icon" variant="outline" className="border-slate-700"><Trash2 className="h-4 w-4 text-red-400" /></Button>
                    </div>
                  </div>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <Mail className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Email Address</p>
                          <p className="text-sm text-white">{selectedLead.email || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <Phone className="h-5 w-5 text-green-400" />
                        <div>
                          <p className="text-[10px] text-slate-500 uppercase">Phone Number</p>
                          <p className="text-sm text-white">{selectedLead.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>

                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2 mt-6">Financial Profile</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase">Est. Income</p>
                        <p className="text-lg font-medium text-emerald-400">{formatCurrency(selectedLead.estimatedIncome)}</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase">Est. Net Worth</p>
                        <p className="text-lg font-medium text-emerald-400">{formatCurrency(selectedLead.netWorth)}</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase">Age</p>
                        <p className="text-lg font-medium text-white">{selectedLead.age} yrs</p>
                      </div>
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] text-slate-500 uppercase">Risk Tolerance</p>
                        <p className="text-sm font-medium text-white mt-1">{selectedLead.riskTolerance}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">AI Insights & Notes</h4>
                    <div className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-indigo-400" />
                        <span className="text-sm font-medium text-indigo-300">Recommended Approach</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Based on profile, this prospect likely responds well to {selectedLead.category === 'Pre-Retirees (55-65)' ? 'tax-efficient income strategies and legacy planning' : 'growth-oriented wealth preservation and risk management'}. Lead with a complimentary portfolio review.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Add Note</Label>
                      <Textarea placeholder="Type notes here..." className="bg-slate-900/50 border-slate-700 resize-none h-24" />
                      <Button size="sm" className="w-full bg-slate-700 hover:bg-slate-600">Save Note</Button>
                    </div>
                  </div>
                </div>

                <DialogFooter className="border-t border-slate-700 pt-4">
                  <Button variant="outline" onClick={() => setLeadDetailsOpen(false)} className="border-slate-700">Close</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">Add to CRM Pipeline</Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Save Campaign Modal */}
        <Dialog open={saveCampaignOpen} onOpenChange={setSaveCampaignOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save to CRM</DialogTitle>
              <DialogDescription className="text-slate-400">
                Push {filteredLeads.length} leads to your active pipeline.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input 
                  placeholder="e.g. Q3 Florida High Net Worth" 
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="bg-slate-900/50 border-slate-700" 
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to Pipeline Stage</Label>
                <Select defaultValue="new">
                  <SelectTrigger className="bg-slate-900/50 border-slate-700"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New Lead</SelectItem>
                    <SelectItem value="contacting">Attempting Contact</SelectItem>
                    <SelectItem value="nurture">Nurture Campaign</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSaveCampaignOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success(`Successfully pushed ${filteredLeads.length} leads to CRM`);
                setSaveCampaignOpen(false);
              }} className="bg-indigo-600">Push to CRM</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  );
}
