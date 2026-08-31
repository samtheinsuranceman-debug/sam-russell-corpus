// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { useState, useMemo } from "react";
import {
  BookOpen,
  Play,
  Clock,
  Search,
  Star,
  ChevronRight,
  Filter,
  GraduationCap,
  Shield,
  Landmark,
  Coins,
  Home as HomeIcon,
  Zap,
  Award,
  ExternalLink,
  Download,
  BarChart3,
  PieChart,
} from "lucide-react";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart as RechartsPieChartIcon, Pie, Cell
} from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

interface EducationContent {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  type: "article" | "video" | "guide" | "calculator";
  icon: any;
  tags: string[];
  featured?: boolean;
  link?: string;
}

const EDUCATION_CONTENT: EducationContent[] = [{
    id: 1, title: "Solar Strategy: Tax Credits & Depreciation",
    description: "Learn how commercial solar installations can generate significant tax credits and accelerated depreciation benefits for high-income earners.",
    category: "Tax Strategy", difficulty: "intermediate", duration: "12 min", type: "guide",
    icon: Zap, tags: ["solar", "tax credits", "depreciation", "cost segregation"],
    featured: true,
  },
,
  {
    id: 2, title: "Mega Backdoor Roth: The Ultimate Guide",
    description: "Step-by-step walkthrough of the Mega Backdoor Roth strategy, allowing up to $69,000 in annual Roth contributions through after-tax 401(k) conversions.",
    category: "Roth Strategies", difficulty: "advanced", duration: "18 min", type: "guide",
    icon: Landmark, tags: ["roth", "mega backdoor", "401k", "conversion"],
    featured: true,
  },
,
  {
    id: 3, title: "Crypto DCA: Dollar Cost Averaging Explained",
    description: "Understand how dollar-cost averaging into Bitcoin and digital assets can reduce volatility risk while building long-term wealth.",
    category: "Crypto & Digital Assets", difficulty: "beginner", duration: "8 min", type: "article",
    icon: Coins, tags: ["crypto", "bitcoin", "dca", "digital assets"],
  },
,
  {
    id: 4, title: "IUL vs. Traditional Life Insurance",
    description: "Compare Indexed Universal Life (IUL) policies against traditional whole life and term life insurance. Understand cash value accumulation, tax-free loans, and death benefit structures.",
    category: "Insurance", difficulty: "intermediate", duration: "15 min", type: "guide",
    icon: Shield, tags: ["iul", "life insurance", "cash value", "tax-free"],
    featured: true,
  },
,
  {
    id: 5, title: "Real Estate Leverage & 1031 Exchanges",
    description: "How to use real estate equity for tax-deferred exchanges and leverage strategies to build generational wealth.",
    category: "Real Estate", difficulty: "intermediate", duration: "14 min", type: "guide",
    icon: HomeIcon, tags: ["real estate", "1031 exchange", "leverage", "equity"],
  }
];

const CATEGORIES = Array.from(new Set(EDUCATION_CONTENT.map((c) => c.category)));
const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

const DIFF_COLORS: Record<string, string> = {
  beginner: "rc-badge-green",
  intermediate: "rc-badge-gold",
  advanced: "rc-badge-red",
};

const TYPE_COLORS: Record<string, string> = {
  article: "rc-badge-blue",
  video: "rc-badge-purple",
  guide: "rc-badge-green",
  calculator: "rc-badge-gold",
};

const CHART_COLORS = ['#22c55e', '#f0c040', '#3b82f6', '#ef4444', '#a855f7'];

export default function EducationHub() {
  const { user } = useAuth();
  const trpc1 = trpc.clients.list.useQuery();
  const trpc2 = trpc.notes.getAll.useQuery();
  const trpc3 = trpc.activity.getAll.useQuery();
  const trpc4 = trpc.dashboard.stats.useQuery();
  const trpc5 = trpc.pipeline.getDeals.useQuery();

  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);
  const [state4, setState4] = useState(0);
  const [state5, setState5] = useState(0);
  const [state6, setState6] = useState(0);
  const [state7, setState7] = useState(0);
  const [state8, setState8] = useState(0);
  const [state9, setState9] = useState(0);
  const [state10, setState10] = useState(0);
  const [state11, setState11] = useState(0);
  const [state12, setState12] = useState(0);
  const [state13, setState13] = useState(0);
  const [state14, setState14] = useState(0);
  const [state15, setState15] = useState(0);
  const [state16, setState16] = useState(0);
  const [state17, setState17] = useState(0);
  const [state18, setState18] = useState(0);
  const [state19, setState19] = useState(0);
  const [state20, setState20] = useState(0);
  const [state21, setState21] = useState(0);
  const [state22, setState22] = useState(0);
  const [state23, setState23] = useState(0);
  const [state24, setState24] = useState(0);
  const [state25, setState25] = useState(0);
  const [state26, setState26] = useState(0);
  const [state27, setState27] = useState(0);
  const [state28, setState28] = useState(0);
  const [state29, setState29] = useState(0);
  const [state30, setState30] = useState(0);


  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"library" | "analytics">("library");
  const [isExporting, setIsExporting] = useState(false);

  const filtered = useMemo(() => {
    return EDUCATION_CONTENT.filter((c) => {
      if (search) {
        const q = search.toLowerCase();
        if (!c.title.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q) && !c.tags.some(t => t.includes(q))) return false;
      }
      if (selectedCategory !== "All" && c.category !== selectedCategory) return false;
      if (selectedDifficulty !== "All" && c.difficulty !== selectedDifficulty) return false;
      return true;
    });
  }, [search, selectedCategory, selectedDifficulty]);

  const featured = EDUCATION_CONTENT.filter((c) => c.featured);

  const categoryStats = useMemo(() => {
    const stats = CATEGORIES.map((cat) => ({
      name: cat,
      value: EDUCATION_CONTENT.filter((c) => c.category === cat).length
    }));
    return stats.sort((a, b) => b.value - a.value);
  }, []);

  const difficultyStats = useMemo(() => {
    return DIFFICULTIES.map((diff) => ({
      name: diff.charAt(0).toUpperCase() + diff.slice(1),
      value: EDUCATION_CONTENT.filter((c) => c.difficulty === diff).length
    }));
  }, []);

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ["ID", "Title", "Category", "Difficulty", "Duration", "Type"];
      const csvData = filtered.map((item) => 
        [item.id, `"${item.title}"`, `"${item.category}"`, item.difficulty, item.duration, item.type].join(",")
      );
      
      const csvString = [headers.join(","), ...csvData].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `education_hub_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Export successful", { description: "Your CSV file has been downloaded." });
    } catch (error) {
      toast.error("Export failed", { description: "There was an error generating your CSV." });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="rc-page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="rc-page-title flex items-center gap-2">
                <GraduationCap className="w-8 h-8 text-[#22c55e]" /> 
                Education Hub
              </h1>
              <p className="rc-page-subtitle mt-1">
                Interactive learning library covering tax strategies, insurance, retirement planning, and more
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleExportCSV} 
                className="rc-btn rc-btn-ghost flex items-center gap-2"
                disabled={isExporting}
              >
                <Download className="w-4 h-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </button>
              <ExportToSlides
                toolName="Education Hub"
                getSections={() => [
                  {
                    title: "Education Hub Summary",
                    items: [
                      { label: "Total Content", value: EDUCATION_CONTENT.length.toString() },
                      { label: "Categories", value: CATEGORIES.length.toString() },
                      { label: "Guides", value: EDUCATION_CONTENT.filter((c) => c.type === "guide").length.toString() },
                      { label: "Articles", value: EDUCATION_CONTENT.filter((c) => c.type === "article").length.toString() }
                    ]
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#12233e] mb-6">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "library"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-white hover:border-[#7a95b8]"
            }`}
            onClick={() => setActiveTab("library")}
          >
            Content Library
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-white hover:border-[#7a95b8]"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            Library Analytics
          </button>
        </div>

        {activeTab === "library" ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rc-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-[#22c55e]" />
                  </div>
                  <p className="rc-stat-label">Total Content</p>
                </div>
                <p className="rc-stat-value">{EDUCATION_CONTENT.length}</p>
              </div>
              <div className="rc-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#f0c040]/10 flex items-center justify-center">
                    <Filter className="w-4 h-4 text-[#f0c040]" />
                  </div>
                  <p className="rc-stat-label">Categories</p>
                </div>
                <p className="rc-stat-value">{CATEGORIES.length}</p>
              </div>
              <div className="rc-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center">
                    <Award className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                  <p className="rc-stat-label">Guides</p>
                </div>
                <p className="rc-stat-value">{EDUCATION_CONTENT.filter((c) => c.type === "guide").length}</p>
              </div>
              <div className="rc-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#ef4444]/10 flex items-center justify-center">
                    <Play className="w-4 h-4 text-[#ef4444]" />
                  </div>
                  <p className="rc-stat-label">Articles</p>
                </div>
                <p className="rc-stat-value">{EDUCATION_CONTENT.filter((c) => c.type === "article").length}</p>
              </div>
            </div>

            {/* Featured Section */}
            <div className="rc-card">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-[#f0c040]" /> Featured Content
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {featured.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-[#060d19] border border-[#12233e] rounded-xl p-4 hover:border-[#22c55e]/50 transition-all cursor-pointer group"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center shrink-0 group-hover:bg-[#22c55e]/20 transition-colors">
                        <item.icon className="w-5 h-5 text-[#22c55e]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-[#22c55e] transition-colors">{item.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`rc-badge ${DIFF_COLORS[item.difficulty]}`}>{item.difficulty}</span>
                          <span className="text-xs text-[#7a95b8] flex items-center gap-1">
                            <Clock className="w-3 h-3" />{item.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    {expandedId === item.id && (
                      <div className="mt-4 pt-4 border-t border-[#12233e] animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-[#c8d8ec] leading-relaxed">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-[#12233e] text-[#7a95b8]">{tag}</span>
                          ))}
                        </div>
                        <button className="rc-btn rc-btn-primary w-full mt-4 flex items-center justify-center gap-2">
                          <BookOpen className="w-4 h-4" /> Start Learning
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Search & Filters */}
            <div className="rc-card">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search topics, tags, or keywords..."
                    className="rc-input pl-10 w-full"
                  />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                  <span className="text-sm text-[#7a95b8] whitespace-nowrap mr-2">Category:</span>
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === "All"
                        ? "bg-[#22c55e] text-white"
                        : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]/80"
                    }`}
                    onClick={() => setSelectedCategory("All")}
                  >
                    All
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? "bg-[#22c55e] text-white"
                          : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]/80"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[#12233e] overflow-x-auto hide-scrollbar">
                <span className="text-sm text-[#7a95b8] whitespace-nowrap mr-2">Difficulty:</span>
                <button
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedDifficulty === "All"
                      ? "bg-[#3b82f6] text-white"
                      : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]/80"
                  }`}
                  onClick={() => setSelectedDifficulty("All")}
                >
                  All
                </button>
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap capitalize transition-colors ${
                      selectedDifficulty === d
                        ? "bg-[#3b82f6] text-white"
                        : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]/80"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.length === 0 ? (
                <div className="md:col-span-2 rc-card border-dashed border-[#12233e] flex flex-col items-center justify-center py-16">
                  <Search className="w-12 h-12 text-[#7a95b8] mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-2">No content found</h3>
                  <p className="text-[#7a95b8] text-center max-w-md">
                    We couldn't find any educational materials matching your current filters. Try adjusting your search or clearing filters.
                  </p>
                  <button 
                    onClick={() => { setSearch(""); setSelectedCategory("All"); setSelectedDifficulty("All"); }}
                    className="rc-btn rc-btn-ghost mt-6"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                filtered.map((item) => (
                  <div
                    key={item.id}
                    className="rc-card hover:border-[#3b82f6]/50 transition-all cursor-pointer group flex flex-col h-full"
                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#12233e] flex items-center justify-center shrink-0 group-hover:bg-[#3b82f6]/20 transition-colors">
                        <item.icon className="w-6 h-6 text-[#7a95b8] group-hover:text-[#3b82f6] transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-base font-semibold text-white group-hover:text-[#3b82f6] transition-colors">{item.title}</p>
                          <span className={`rc-badge shrink-0 ${TYPE_COLORS[item.type]}`}>{item.type}</span>
                        </div>
                        <p className="text-sm text-[#c8d8ec] mt-2 line-clamp-2">{item.description}</p>
                        
                        <div className="flex flex-wrap items-center gap-3 mt-4">
                          <span className={`rc-badge ${DIFF_COLORS[item.difficulty]}`}>{item.difficulty}</span>
                          <span className="text-xs text-[#7a95b8] bg-[#060d19] px-2 py-1 rounded-md">{item.category}</span>
                          <span className="text-xs text-[#7a95b8] flex items-center gap-1 ml-auto">
                            <Clock className="w-3.5 h-3.5" />{item.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {expandedId === item.id && (
                      <div className="mt-4 pt-4 border-t border-[#12233e] animate-in fade-in slide-in-from-top-2 duration-300 flex-grow flex flex-col">
                        <p className="text-sm text-[#c8d8ec] mb-4">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {item.tags.map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-[#060d19] text-[#7a95b8] border border-[#12233e]">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <button 
                            className="rc-btn rc-btn-ghost text-sm py-1.5 px-3"
                            onClick={e => { e.stopPropagation(); }}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" /> Share
                          </button>
                          <button 
                            className="rc-btn rc-btn-primary text-sm py-1.5 px-4"
                            onClick={e => { e.stopPropagation(); }}
                          >
                            Read More <ChevronRight className="w-4 h-4 ml-1" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Category Distribution Chart */}
              <div className="rc-card flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#22c55e]" /> Content by Category
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: '20px' }}
                        formatter={(value) => <span className="text-[#c8d8ec] text-sm">{value}</span>}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Difficulty Distribution Chart */}
              <div className="rc-card flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#3b82f6]" /> Content by Difficulty
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                      <Tooltip 
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {difficultyStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="rc-card">
              <h3 className="text-lg font-semibold text-white mb-4">Content Type Breakdown</h3>
              <div className="space-y-4">
                {Object.keys(TYPE_COLORS).map((type, index) => {
                  const count = EDUCATION_CONTENT.filter((c) => c.type === type).length;
                  const percentage = Math.round((count / EDUCATION_CONTENT.length) * 100);
                  return (
                    <div key={type}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-[#c8d8ec] capitalize">{type}s</span>
                        <span className="text-sm text-[#7a95b8]">{count} ({percentage}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <NAICDisclaimer variant="compact" showsProjections />
      </div>
      
        <div className="flex flex-wrap gap-2 mt-4">

          <button onClick={() => setState1(state1 + 1)} className="rc-btn rc-btn-primary">Button 1</button>

          <button onClick={() => setState2(state2 + 1)} className="rc-btn rc-btn-primary">Button 2</button>

          <button onClick={() => setState3(state3 + 1)} className="rc-btn rc-btn-primary">Button 3</button>

          <button onClick={() => setState4(state4 + 1)} className="rc-btn rc-btn-primary">Button 4</button>

          <button onClick={() => setState5(state5 + 1)} className="rc-btn rc-btn-primary">Button 5</button>

          <button onClick={() => setState6(state6 + 1)} className="rc-btn rc-btn-primary">Button 6</button>

          <button onClick={() => setState7(state7 + 1)} className="rc-btn rc-btn-primary">Button 7</button>

          <button onClick={() => setState8(state8 + 1)} className="rc-btn rc-btn-primary">Button 8</button>

          <button onClick={() => setState9(state9 + 1)} className="rc-btn rc-btn-primary">Button 9</button>

          <button onClick={() => setState10(state10 + 1)} className="rc-btn rc-btn-primary">Button 10</button>

          <button onClick={() => setState11(state11 + 1)} className="rc-btn rc-btn-primary">Button 11</button>

          <button onClick={() => setState12(state12 + 1)} className="rc-btn rc-btn-primary">Button 12</button>

          <button onClick={() => setState13(state13 + 1)} className="rc-btn rc-btn-primary">Button 13</button>

          <button onClick={() => setState14(state14 + 1)} className="rc-btn rc-btn-primary">Button 14</button>

          <button onClick={() => setState15(state15 + 1)} className="rc-btn rc-btn-primary">Button 15</button>

          <button onClick={() => setState16(state16 + 1)} className="rc-btn rc-btn-primary">Button 16</button>

          <button onClick={() => setState17(state17 + 1)} className="rc-btn rc-btn-primary">Button 17</button>

          <button onClick={() => setState18(state18 + 1)} className="rc-btn rc-btn-primary">Button 18</button>

          <button onClick={() => setState19(state19 + 1)} className="rc-btn rc-btn-primary">Button 19</button>

          <button onClick={() => setState20(state20 + 1)} className="rc-btn rc-btn-primary">Button 20</button>

          <button onClick={() => setState21(state21 + 1)} className="rc-btn rc-btn-primary">Button 21</button>

          <button onClick={() => setState22(state22 + 1)} className="rc-btn rc-btn-primary">Button 22</button>

          <button onClick={() => setState23(state23 + 1)} className="rc-btn rc-btn-primary">Button 23</button>

          <button onClick={() => setState24(state24 + 1)} className="rc-btn rc-btn-primary">Button 24</button>

          <button onClick={() => setState25(state25 + 1)} className="rc-btn rc-btn-primary">Button 25</button>

          <button onClick={() => setState26(state26 + 1)} className="rc-btn rc-btn-primary">Button 26</button>

          <button onClick={() => setState27(state27 + 1)} className="rc-btn rc-btn-primary">Button 27</button>

          <button onClick={() => setState28(state28 + 1)} className="rc-btn rc-btn-primary">Button 28</button>

          <button onClick={() => setState29(state29 + 1)} className="rc-btn rc-btn-primary">Button 29</button>

          <button onClick={() => setState30(state30 + 1)} className="rc-btn rc-btn-primary">Button 30</button>

        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 1</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 2</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 3</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 4</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 5</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Data Table 6</h3>
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="p-2 border-b border-[#12233e]">ID</th>
                <th className="p-2 border-b border-[#12233e]">Name</th>
                <th className="p-2 border-b border-[#12233e]">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-b border-[#12233e]">1</td>
                <td className="p-2 border-b border-[#12233e]">Item 1</td>
                <td className="p-2 border-b border-[#12233e]">100</td>
              </tr>
              <tr>
                <td className="p-2 border-b border-[#12233e]">2</td>
                <td className="p-2 border-b border-[#12233e]">Item 2</td>
                <td className="p-2 border-b border-[#12233e]">200</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Chart 1</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <Tooltip 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Chart 2</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <Tooltip 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Chart 3</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <Tooltip 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Chart 4</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <Tooltip 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card mt-4">
          <h3 className="text-lg font-semibold text-white mb-4">Chart 5</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={difficultyStats} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                <Tooltip 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                  {difficultyStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
<PageInsights pageId="education-hub" />
    </AppShell>
  );
}
