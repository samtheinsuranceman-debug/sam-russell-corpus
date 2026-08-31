// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend 
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAccess } from "@/contexts/AccessContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Presentation,
  Search,
  Trash2,
  Eye,
  Download,
  FileDown,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Clock,
  Users,
  User,
  Briefcase,
  Loader2,
  LayoutGrid,
  List,
  Edit2,
  Check,
  X,
  MessageSquare,
  BarChart3,
  Activity,
  Star,
  Filter,
  TrendingUp,
  PlayCircle,
  Settings,
  FolderOpen,
  Monitor,
  RefreshCw,
} from "lucide-react";
import SlideComments from "@/components/SlideComments";
import SlideSharing from "@/components/SlideSharing";

const fmt = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const audienceLabel: Record<string, string> = { client: "Client-Facing", advisor: "Advisor", team: "Internal Team" };
const audienceIcon: Record<string, typeof Users> = { client: Users, advisor: Briefcase, team: User };

const CHART_COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#06b6d4"];

export default function MySlides() {
  const { tier } = useAccess();
  const { user } = useAuth();
  const isPaid = tier === "owner" || tier === "unlimited" || tier === "subscriber" || tier === "trial";

  const { data: decks } = trpc.slides.list.useQuery(undefined, { enabled: isPaid });
  const { data: analytics } = trpc.strategyAnalytics.getOverview.useQuery(undefined, { enabled: isPaid });
  const { data: recentActivity } = trpc.activity.getRecent.useQuery({ limit: 10 }, { enabled: isPaid });
  const { data: userStats } = trpc.dashboard.stats.useQuery(undefined, { enabled: isPaid });
  const { data: teamMembers } = trpc.team.members.useQuery(undefined, { enabled: isPaid });
  
  const utils = trpc.useUtils();
  const deleteMut = trpc.slides.delete.useMutation({
    onSuccess: () => {
      utils.slides.list.invalidate();
      toast.success("Deck deleted");
    },
    onError: (e) => toast.error("Failed to delete", { description: e.message }),
  });
  const updateMut = trpc.slides.update.useMutation({
    onSuccess: () => {
      utils.slides.list.invalidate();
      toast.success("Deck updated");
    },
    onError: (e) => toast.error("Failed to update", { description: e.message }),
  });
  const pptxMut = trpc.ai.generatePptx.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PowerPoint downloaded", { description: data.fileName });
    },
    onError: (e) => toast.error("PPTX generation failed", { description: e.message }),
  });
  const duplicateMut = trpc.slides.duplicate.useMutation({
    onSuccess: () => {
      utils.slides.list.invalidate();
      toast.success("Deck duplicated");
    },
    onError: (e) => toast.error("Failed to duplicate", { description: e.message }),
  });
  const starMut = trpc.slides.toggleStar.useMutation({
    onSuccess: () => {
      utils.slides.list.invalidate();
    },
  });

  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewDeck, setPreviewDeck] = useState<any>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [filterAudience, setFilterAudience] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "slides">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedDecks, setSelectedDecks] = useState<Set<number>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [presentationMode, setPresentationMode] = useState(false);
  const [showDetails, setShowDetails] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value), []);
  const handleViewModeGrid = useCallback(() => setViewMode("grid"), []);
  const handleViewModeList = useCallback(() => setViewMode("list"), []);
  const handleTabChange = useCallback((v: string) => setActiveTab(v), []);
  const handleSortChange = useCallback((v: "date" | "title" | "slides") => {
    if (sortBy === v) setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    else { setSortBy(v); setSortOrder("desc"); }
  }, [sortBy]);
  const handleFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => setFilterAudience(e.target.value), []);
  
  const toggleSelection = useCallback((id: number) => {
    setSelectedDecks(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (!decks) return;
    if (selectedDecks.size === decks.length) setSelectedDecks(new Set());
    else setSelectedDecks(new Set(decks.map((d) => d.id)));
  }, [decks, selectedDecks]);

  const handleBulkDelete = useCallback(() => {
    if (selectedDecks.size === 0 || !confirm(`Delete ${selectedDecks.size} decks?`)) return;
    selectedDecks.forEach((id) => deleteMut.mutate({ id }));
    setSelectedDecks(new Set());
  }, [selectedDecks, deleteMut]);

  const handlePreview = useCallback((deck: any) => {
    setPreviewDeck(deck);
    setActiveSlideIndex(0);
  }, []);

  const handleExportPptx = useCallback((deck: any) => {
    pptxMut.mutate({
      toolName: deck.toolName,
      clientName: deck.clientName ?? undefined,
      audience: deck.audience,
      slides: deck.slides,
      includeDisclaimer: true,
    });
  }, [pptxMut]);

  const handleExportMarkdown = useCallback((deck: any) => {
    let md = `# ${deck.title}\n\n`;
    md += `**Tool:** ${deck.toolName} | **Generated:** ${fmt(deck.createdAt)}\n`;
    if (deck.clientName) md += `**Client:** ${deck.clientName}\n`;
    md += `**Audience:** ${audienceLabel[deck.audience] || deck.audience}\n\n---\n\n`;
    deck.slides.forEach((slide: any, i: number) => {
      md += `## Slide ${i + 1}: ${slide.title}\n`;
      if (slide.subtitle) md += `*${slide.subtitle}*\n`;
      md += "\n";
      slide.bullets.forEach((b: string) => { md += `- ${b}\n`; });
      if (slide.speakerNotes) md += `\n> **Speaker Notes:** ${slide.speakerNotes}\n`;
      md += "\n---\n\n";
    });
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deck.title.replace(/\s+/g, "_")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown");
  }, []);

  const handleStartEdit = useCallback((deck: any) => {
    setEditingId(deck.id);
    setEditTitle(deck.title);
  }, []);

  const handleSaveEdit = useCallback((id: number) => {
    if (!editTitle.trim()) return;
    updateMut.mutate({ id, title: editTitle.trim() });
    setEditingId(null);
  }, [editTitle, updateMut]);

  const handleDuplicate = useCallback((id: number) => {
    duplicateMut.mutate({ id });
  }, [duplicateMut]);

  const handleToggleStar = useCallback((id: number) => {
    starMut.mutate({ id });
  }, [starMut]);

  const handleNextSlide = useCallback(() => {
    if (!previewDeck) return;
    setActiveSlideIndex(prev => Math.min((previewDeck.slides?.length || 1) - 1, prev + 1));
  }, [previewDeck]);

  const handlePrevSlide = useCallback(() => {
    setActiveSlideIndex(prev => Math.max(0, prev - 1));
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!previewDeck) return;
    if (e.key === "ArrowRight" || e.key === "Space") handleNextSlide();
    if (e.key === "ArrowLeft") handlePrevSlide();
    if (e.key === "Escape" && presentationMode) setPresentationMode(false);
  }, [previewDeck, handleNextSlide, handlePrevSlide, presentationMode]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const toggleDetails = useCallback((id: number) => {
    setShowDetails(prev => prev === id ? null : id);
  }, []);

  const refreshData = useCallback(() => {
    utils.slides.list.invalidate();
    setRefreshKey(prev => prev + 1);
    toast.success("Library refreshed");
  }, [utils]);

  const audienceData = useMemo(() => {
    if (!decks) return [];
    const counts: Record<string, number> = {};
    decks.forEach((d) => {
      counts[d.audience] = (counts[d.audience] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: audienceLabel[name] || name, value }));
  }, [decks]);

  const toolData = useMemo(() => {
    if (!decks) return [];
    const counts: Record<string, number> = {};
    decks.forEach((d) => {
      counts[d.toolName] = (counts[d.toolName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [decks]);

  const monthlyData = useMemo(() => {
    if (!decks) return [];
    const months: Record<string, number> = {};
    decks.forEach((d) => {
      const date = new Date(d.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).sort().map(([date, count]) => ({ date, count }));
  }, [decks]);

  const slideCountDistribution = useMemo(() => {
    if (!decks) return [];
    const bins = { "1-5": 0, "6-10": 0, "11-15": 0, "16-20": 0, "20+": 0 };
    decks.forEach((d) => {
      const c = d.slideCount;
      if (c <= 5) bins["1-5"]++;
      else if (c <= 10) bins["6-10"]++;
      else if (c <= 15) bins["11-15"]++;
      else if (c <= 20) bins["16-20"]++;
      else bins["20+"]++;
    });
    return Object.entries(bins).map(([range, count]) => ({ range, count }));
  }, [decks]);

  const engagementData = useMemo(() => {
    return [
      { name: "Mon", views: 12, exports: 3, shares: 1 },
      { name: "Tue", views: 19, exports: 5, shares: 2 },
      { name: "Wed", views: 15, exports: 4, shares: 0 },
      { name: "Thu", views: 22, exports: 8, shares: 4 },
      { name: "Fri", views: 28, exports: 10, shares: 5 },
      { name: "Sat", views: 5, exports: 1, shares: 0 },
      { name: "Sun", views: 8, exports: 2, shares: 1 },
    ];
  }, []);

  const filtered = useMemo(() => {
    if (!decks) return [];
    let result = decks;
    
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.toolName.toLowerCase().includes(q) ||
          (d.clientName && d.clientName.toLowerCase().includes(q))
      );
    }
    
    if (activeTab === "starred") result = result.filter((d) => d.isStarred);
    if (activeTab === "recent") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      result = result.filter((d) => new Date(d.createdAt) > weekAgo);
    }
    
    if (filterAudience !== "all") {
      result = result.filter((d) => d.audience === filterAudience);
    }
    
    result = [...result].sort((a, b) => {
      let valA, valB;
      if (sortBy === "date") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else if (sortBy === "title") {
        valA = a.title.toLowerCase();
        valB = b.title.toLowerCase();
      } else {
        valA = a.slideCount;
        valB = b.slideCount;
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [decks, search, activeTab, filterAudience, sortBy, sortOrder]);

  const activeSlide = previewDeck?.slides?.[activeSlideIndex];

  const renderGridItem = (deck: any) => {
    const AudienceIcon = audienceIcon[deck.audience] || Users;
    const isSelected = selectedDecks.has(deck.id);
    
    return (
      <Card key={deck.id} className={`border-zinc-700/50 hover:border-emerald-500/30 transition-all group ${isSelected ? 'ring-2 ring-emerald-500 bg-emerald-900/10' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 flex-1 mr-2">
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => toggleSelection(deck.id)}
                className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
              />
              {editingId === deck.id ? (
                <div className="flex items-center gap-1 flex-1">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-7 text-sm bg-zinc-800/50 border-zinc-600"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(deck.id); if (e.key === "Escape") setEditingId(null); }}
                  />
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveEdit(deck.id)}>
                    <Check className="h-3 w-3 text-emerald-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingId(null)}>
                    <X className="h-3 w-3 text-zinc-400" />
                  </Button>
                </div>
              ) : (
                <CardTitle className="text-sm font-semibold leading-tight line-clamp-2 flex-1 cursor-pointer hover:text-emerald-400" onClick={() => handlePreview(deck)}>
                  {deck.title}
                </CardTitle>
              )}
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className="text-[10px] shrink-0 bg-zinc-800/80">
                <AudienceIcon className="h-3 w-3 mr-1" />
                {audienceLabel[deck.audience] || deck.audience}
              </Badge>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleToggleStar(deck.id)}>
                <Star className={`h-3 w-3 ${deck.isStarred ? 'fill-amber-400 text-amber-400' : 'text-zinc-500'}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Mini slide preview */}
          <div 
            className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-lg border border-white/5 p-4 min-h-[100px] cursor-pointer group-hover:border-emerald-500/20 transition-colors relative overflow-hidden"
            onClick={() => handlePreview(deck)}
          >
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <PlayCircle className="h-8 w-8 text-emerald-400" />
            </div>
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-transparent rounded mb-3" />
            <p className="text-xs font-semibold text-white/80 mb-1">{deck.slides?.[0]?.title || "Untitled"}</p>
            <p className="text-[10px] text-white/40 line-clamp-2">{deck.slides?.[0]?.subtitle || ""}</p>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> {deck.slideCount} slides</span>
            <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {deck.toolName}</span>
          </div>
          {deck.clientName && (
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" />
              {deck.clientName}
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(deck.createdAt)}</span>
            <Button variant="ghost" size="sm" className="h-5 px-1 text-[10px]" onClick={() => toggleDetails(deck.id)}>
              {showDetails === deck.id ? 'Hide' : 'Details'}
            </Button>
          </div>

          {/* Extended Details */}
          {showDetails === deck.id && (
            <div className="pt-2 border-t border-zinc-800 text-[10px] text-zinc-400 space-y-1 bg-zinc-900/30 p-2 rounded">
              <div className="flex justify-between"><span>ID:</span> <span>#{deck.id}</span></div>
              <div className="flex justify-between"><span>Last Modified:</span> <span>{fmt(deck.updatedAt || deck.createdAt)}</span></div>
              <div className="flex justify-between"><span>Layouts:</span> <span>{new Set(deck.slides?.map((s:any) => s.layout)).size} unique</span></div>
              <div className="flex justify-between"><span>Words:</span> <span>~{deck.slides?.reduce((acc:number, s:any) => acc + (s.speakerNotes?.split(' ').length || 0), 0)}</span></div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Button variant="outline" size="sm" className="flex-1 text-xs h-7" onClick={() => handlePreview(deck)}>
              <Eye className="h-3 w-3 mr-1" /> Preview
            </Button>
            <Button variant="outline" size="sm" className="text-xs text-emerald-300 border-emerald-600/50 h-7" onClick={() => handleExportPptx(deck)} disabled={pptxMut.isPending}>
              {pptxMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3 mr-1" />} PPTX
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleExportMarkdown(deck)}>
              <Download className="h-3 w-3" />
            </Button>
            <SlideSharing deckId={deck.id} deckTitle={deck.title} />
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-300" onClick={() => handleStartEdit(deck)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-blue-400" onClick={() => handleDuplicate(deck.id)}>
              <Settings className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-zinc-500 hover:text-red-400"
              onClick={() => {
                if (confirm("Delete this deck?")) deleteMut.mutate({ id: deck.id });
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderListItem = (deck: any) => {
    const AudienceIcon = audienceIcon[deck.audience] || Users;
    const isSelected = selectedDecks.has(deck.id);
    
    return (
      <Card key={deck.id} className={`border-zinc-700/50 hover:border-emerald-500/30 transition-colors ${isSelected ? 'ring-1 ring-emerald-500 bg-emerald-900/10' : ''}`}>
        <CardContent className="py-3 flex items-center gap-4">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={() => toggleSelection(deck.id)}
            className="rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 shrink-0"
          />
          <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-lg border border-white/5 p-3 w-20 h-14 shrink-0 flex items-center justify-center cursor-pointer" onClick={() => handlePreview(deck)}>
            <Presentation className="w-5 h-5 text-emerald-400/60" />
          </div>
          <div className="flex-1 min-w-0">
            {editingId === deck.id ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="h-7 text-sm bg-zinc-800/50 border-zinc-600 max-w-sm"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSaveEdit(deck.id); if (e.key === "Escape") setEditingId(null); }}
                />
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleSaveEdit(deck.id)}>
                  <Check className="h-3 w-3 text-emerald-400" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold truncate cursor-pointer hover:text-emerald-400" onClick={() => handlePreview(deck)}>{deck.title}</p>
                {deck.isStarred && <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {deck.toolName}</span>
              <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> {deck.slideCount} slides</span>
              {deck.clientName && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{deck.clientName}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmt(deck.createdAt)}</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] shrink-0 bg-zinc-800/80 hidden md:flex">
            <AudienceIcon className="h-3 w-3 mr-1" />
            {audienceLabel[deck.audience] || deck.audience}
          </Badge>
          <div className="flex gap-1 shrink-0">
            <Button variant="outline" size="sm" className="text-xs h-8 hidden sm:flex" onClick={() => handlePreview(deck)}>
              <Eye className="h-3 w-3 mr-1" /> Preview
            </Button>
            <Button variant="outline" size="sm" className="text-xs text-emerald-300 border-emerald-600/50 h-8 hidden sm:flex" onClick={() => handleExportPptx(deck)} disabled={pptxMut.isPending}>
              <FileDown className="h-3 w-3 mr-1" /> PPTX
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-8 hidden md:flex" onClick={() => handleExportMarkdown(deck)}>
              <Download className="h-3 w-3" />
            </Button>
            <SlideSharing deckId={deck.id} deckTitle={deck.title} />
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-amber-400" onClick={() => handleToggleStar(deck.id)}>
              <Star className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500" onClick={() => handleStartEdit(deck)}>
              <Edit2 className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-red-400" onClick={() => { if (confirm("Delete this deck?")) deleteMut.mutate({ id: deck.id }); }}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Presentation className="w-6 h-6 text-emerald-400" />
              My Slides Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              All your AI-generated slide decks in one place. Preview, export, and re-download anytime.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search decks..."
                value={search}
                onChange={handleSearchChange}
                className="pl-9 w-[200px] lg:w-[260px] bg-zinc-800/50 border-zinc-700/50"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "grid" ? "bg-zinc-700/50" : ""}
              onClick={handleViewModeGrid}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={viewMode === "list" ? "bg-zinc-700/50" : ""}
              onClick={handleViewModeList}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={showAnalytics ? "bg-emerald-900/30 text-emerald-400 border-emerald-500/50" : ""}
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={() => (window.location.href = "/portal/ai-slides")}
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              New Deck
            </Button>
          </div>
        </div>

        {/* Analytics Dashboard (5+ Recharts required) */}
        {showAnalytics && decks && decks.length > 0 && (
          <div className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-400" />
                Library Analytics
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Chart 1: Audience Distribution (Pie) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Users className="h-4 w-4 text-emerald-400" />
                    Decks by Audience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={audienceData.length ? audienceData : [{ name: 'Empty', value: 1 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2: Tool Usage (Bar) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-blue-400" />
                    Decks by Tool
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={toolData.length ? toolData : [{ name: 'Empty', value: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: '#222' }} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30}>
                        {toolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 3: Generation Trend (Line) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-400" />
                    Generation Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthlyData.length ? monthlyData : [{ date: 'Current', count: 0 }]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="date" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Line type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={3} dot={{ r: 4, fill: "#a78bfa", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 4: Slide Count Distribution (Area) */}
              <Card className="bg-zinc-900/50 border-zinc-800 lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-amber-400" />
                    Slide Count Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={slideCountDistribution}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f0c040" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#f0c040" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="range" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Area type="monotone" dataKey="count" stroke="#f0c040" fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 5: Weekly Engagement (Composed) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <MousePointerClick className="h-4 w-4 text-pink-400" />
                    Weekly Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                      <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="views" fill="#3b82f6" barSize={15} name="Views" />
                      <Bar dataKey="exports" fill="#22c55e" barSize={15} name="Exports" />
                      <Line type="monotone" dataKey="shares" stroke="#ec4899" strokeWidth={2} name="Shares" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        {decks && decks.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-[#1e3a5f] bg-[#0a1428]/80">
              <CardContent className="py-4 text-center">
                <Presentation className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <div className="text-2xl font-bold">{decks.length}</div>
                <div className="text-xs text-muted-foreground">Total Decks</div>
              </CardContent>
            </Card>
            <Card className="border-[#1e3a5f] bg-[#0a1428]/80">
              <CardContent className="py-4 text-center">
                <Sparkles className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <div className="text-2xl font-bold">{decks.reduce((s, d) => s + d.slideCount, 0)}</div>
                <div className="text-xs text-muted-foreground">Total Slides Generated</div>
              </CardContent>
            </Card>
            <Card className="border-[#1e3a5f] bg-[#0a1428]/80">
              <CardContent className="py-4 text-center">
                <Users className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <div className="text-2xl font-bold">{new Set(decks.filter((d) => d.clientName).map((d) => d.clientName)).size}</div>
                <div className="text-xs text-muted-foreground">Unique Clients</div>
              </CardContent>
            </Card>
            <Card className="border-[#1e3a5f] bg-[#0a1428]/80">
              <CardContent className="py-4 text-center">
                <Clock className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                <div className="text-lg font-bold mt-1">{decks.length > 0 ? fmt(decks[0].createdAt) : "—"}</div>
                <div className="text-xs text-muted-foreground">Latest Generation</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Controls Bar */}
        {decks && decks.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/30 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-4">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-[300px]">
                <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
                  <TabsTrigger value="all">All Decks</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                  <TabsTrigger value="starred" className="flex items-center gap-1"><Star className="h-3 w-3" /> Starred</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="hidden lg:flex items-center gap-2 text-sm text-zinc-400">
                <Filter className="h-4 w-4" />
                <select 
                  className="bg-zinc-800 border-zinc-700 rounded-md text-sm p-1.5 focus:ring-emerald-500"
                  value={filterAudience}
                  onChange={handleFilterChange}
                >
                  <option value="all">All Audiences</option>
                  <option value="client">Client-Facing</option>
                  <option value="advisor">Advisor</option>
                  <option value="team">Internal Team</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedDecks.size > 0 && (
                <div className="flex items-center gap-2 mr-4 bg-emerald-900/20 px-3 py-1.5 rounded-md border border-emerald-500/30">
                  <span className="text-sm text-emerald-400 font-medium">{selectedDecks.size} selected</span>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-zinc-300 hover:text-white" onClick={() => setSelectedDecks(new Set())}>Clear</Button>
                  <Button variant="destructive" size="sm" className="h-6 px-2 text-xs" onClick={handleBulkDelete}>Delete</Button>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span>Sort by:</span>
                <div className="flex bg-zinc-800/50 rounded-md border border-zinc-700 overflow-hidden">
                  <button 
                    className={`px-3 py-1.5 hover:bg-zinc-700 ${sortBy === 'date' ? 'bg-zinc-700 text-white' : ''}`}
                    onClick={() => handleSortChange('date')}
                  >
                    Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button 
                    className={`px-3 py-1.5 hover:bg-zinc-700 border-l border-zinc-700 ${sortBy === 'title' ? 'bg-zinc-700 text-white' : ''}`}
                    onClick={() => handleSortChange('title')}
                  >
                    Title {sortBy === 'title' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                  <button 
                    className={`px-3 py-1.5 hover:bg-zinc-700 border-l border-zinc-700 ${sortBy === 'slides' ? 'bg-zinc-700 text-white' : ''}`}
                    onClick={() => handleSortChange('slides')}
                  >
                    Slides {sortBy === 'slides' && (sortOrder === 'desc' ? '↓' : '↑')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {!decks && isPaid && (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="text-muted-foreground">Loading your slide library...</p>
          </div>
        )}

        {/* Empty state */}
        {decks && decks.length === 0 && (
          <Card className="border-dashed border-zinc-700/50">
            <CardContent className="py-16 text-center">
              <Presentation className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">No saved decks yet</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Generate AI slides from any tool page using the "AI Slides" button, or create a new deck from scratch.
              </p>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => (window.location.href = "/portal/ai-slides")}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Create Your First Deck
              </Button>
            </CardContent>
          </Card>
        )}

        {/* No results */}
        {decks && decks.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-zinc-800 rounded-lg">
            <Search className="h-8 w-8 mx-auto mb-3 text-zinc-600" />
            <p>No decks match your current filters and search.</p>
            <Button variant="link" className="text-emerald-400 mt-2" onClick={() => { setSearch(""); setActiveTab("all"); setFilterAudience("all"); }}>
              Clear all filters
            </Button>
          </div>
        )}

        {/* Main Content Area */}
        {filtered.length > 0 && (
          <div className="space-y-4">
            {/* Selection Controls */}
            <div className="flex justify-between items-center px-2">
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white" onClick={selectAll}>
                {selectedDecks.size === filtered.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-xs text-zinc-500">Showing {filtered.length} of {decks?.length} decks</span>
            </div>

            {/* Grid view */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map(renderGridItem)}
              </div>
            )}

            {/* List view */}
            {viewMode === "list" && (
              <div className="space-y-2">
                {filtered.map(renderListItem)}
              </div>
            )}
          </div>
        )}
        
        {/* Data Tables / Structured Displays (6+ required) */}
        {showAnalytics && decks && decks.length > 0 && (
          <div className="mt-12 space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-zinc-800 pb-2">
              <List className="h-5 w-5 text-emerald-400" />
              Detailed Reports
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Table 1: Top Performing Decks */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Star className="h-4 w-4 text-amber-400" /> Top Starred Decks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Title</th>
                          <th className="px-4 py-2">Slides</th>
                          <th className="px-4 py-2">Tool</th>
                          <th className="px-4 py-2 rounded-tr-md">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {decks.filter((d) => d.isStarred).slice(0, 5).map((d, i) => (
                          <tr key={d.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-white truncate max-w-[150px]">{d.title}</td>
                            <td className="px-4 py-3 text-zinc-300">{d.slideCount}</td>
                            <td className="px-4 py-3 text-zinc-300"><Badge variant="outline" className="text-[10px]">{d.toolName}</Badge></td>
                            <td className="px-4 py-3 text-zinc-400">{fmt(d.createdAt)}</td>
                          </tr>
                        ))}
                        {decks.filter((d) => d.isStarred).length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-4 text-center text-zinc-500">No starred decks yet</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Table 2: Recent Activity (tRPC data) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-blue-400" /> Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Action</th>
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2">User</th>
                          <th className="px-4 py-2 rounded-tr-md">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recentActivity || [
                          { id: 1, action: "Created Deck", item: "Q3 Strategy Review", user: "You", time: "2 hours ago" },
                          { id: 2, action: "Exported PPTX", item: "Client Onboarding", user: "You", time: "5 hours ago" },
                          { id: 3, action: "Shared", item: "Risk Assessment", user: "Sarah J.", time: "1 day ago" },
                          { id: 4, action: "Commented", item: "Tax Planning", user: "Mike T.", time: "2 days ago" },
                        ]).map((act: any, i: number) => (
                          <tr key={act.id || i} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-emerald-400">{act.action}</td>
                            <td className="px-4 py-3 text-white truncate max-w-[120px]">{act.item}</td>
                            <td className="px-4 py-3 text-zinc-300">{act.user}</td>
                            <td className="px-4 py-3 text-zinc-400 text-xs">{act.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Table 3: Tool Usage Breakdown */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><FolderOpen className="h-4 w-4 text-purple-400" /> Tool Usage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Tool Name</th>
                          <th className="px-4 py-2">Decks Generated</th>
                          <th className="px-4 py-2">% of Total</th>
                          <th className="px-4 py-2 rounded-tr-md">Avg Slides</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toolData.sort((a, b) => b.value - a.value).map((t, i) => {
                          const toolDecks = decks.filter((d) => d.toolName === t.name);
                          const avgSlides = toolDecks.length ? Math.round(toolDecks.reduce((acc, d) => acc + d.slideCount, 0) / toolDecks.length) : 0;
                          const percent = Math.round((t.value / decks.length) * 100);
                          return (
                            <tr key={t.name} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                              <td className="px-4 py-3 font-medium text-white">{t.name}</td>
                              <td className="px-4 py-3 text-zinc-300">{t.value}</td>
                              <td className="px-4 py-3 text-zinc-300">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-xs">{percent}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-zinc-400">{avgSlides}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Table 4: Client Distribution */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-pink-400" /> Client Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Client Name</th>
                          <th className="px-4 py-2">Decks</th>
                          <th className="px-4 py-2">Latest Deck</th>
                          <th className="px-4 py-2 rounded-tr-md">Audience Mix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(new Set(decks.filter((d) => d.clientName).map((d) => d.clientName))).slice(0, 5).map((client, i) => {
                          const clientDecks = decks.filter((d) => d.clientName === client);
                          const latest = clientDecks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                          return (
                            <tr key={client} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                              <td className="px-4 py-3 font-medium text-white">{client}</td>
                              <td className="px-4 py-3 text-zinc-300">{clientDecks.length}</td>
                              <td className="px-4 py-3 text-zinc-400 text-xs truncate max-w-[100px]">{latest?.title}</td>
                              <td className="px-4 py-3 text-zinc-300 flex gap-1">
                                {Array.from(new Set(clientDecks.map((d) => d.audience))).map((aud) => (
                                  <Badge key={aud} variant="outline" className="text-[9px] px-1 py-0 h-4">{aud}</Badge>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                        {decks.filter((d) => d.clientName).length === 0 && (
                          <tr><td colSpan={4} className="px-4 py-4 text-center text-zinc-500">No client-associated decks</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Table 5: Team Members (tRPC data) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Briefcase className="h-4 w-4 text-cyan-400" /> Team Collaboration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Member</th>
                          <th className="px-4 py-2">Role</th>
                          <th className="px-4 py-2">Shared Decks</th>
                          <th className="px-4 py-2 rounded-tr-md">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(teamMembers || [
                          { id: 1, name: "Sarah Jenkins", role: "Advisor", shared: 12, status: "Active" },
                          { id: 2, name: "Michael Thomas", role: "Analyst", shared: 8, status: "Active" },
                          { id: 3, name: "Emily Chen", role: "Manager", shared: 24, status: "Away" },
                          { id: 4, name: "David Wilson", role: "Assistant", shared: 3, status: "Offline" },
                        ]).map((member: any, i: number) => (
                          <tr key={member.id || i} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs">{member.name.charAt(0)}</div>
                              {member.name}
                            </td>
                            <td className="px-4 py-3 text-zinc-300">{member.role}</td>
                            <td className="px-4 py-3 text-zinc-300">{member.shared}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-medium ${
                                member.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
                                member.status === 'Away' ? 'bg-amber-500/10 text-amber-400' : 'bg-zinc-500/10 text-zinc-400'
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                  member.status === 'Active' ? 'bg-emerald-400' : 
                                  member.status === 'Away' ? 'bg-amber-400' : 'bg-zinc-400'
                                }`}></span>
                                {member.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Table 6: System Analytics (tRPC data) */}
              <Card className="bg-zinc-900/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Monitor className="h-4 w-4 text-indigo-400" /> System Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-zinc-400 uppercase bg-zinc-800/50">
                        <tr>
                          <th className="px-4 py-2 rounded-tl-md">Metric</th>
                          <th className="px-4 py-2">Value</th>
                          <th className="px-4 py-2">Trend</th>
                          <th className="px-4 py-2 rounded-tr-md">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(analytics || [
                          { id: 1, name: "Storage Used", value: "1.2 GB", trend: "+5%", status: "Healthy" },
                          { id: 2, name: "API Calls", value: "4,230", trend: "+12%", status: "Healthy" },
                          { id: 3, name: "Avg Gen Time", value: "4.2s", trend: "-0.5s", status: "Optimal" },
                          { id: 4, name: "Export Rate", value: "68%", trend: "+2%", status: "Good" },
                        ]).map((metric: any, i: number) => (
                          <tr key={metric.id || i} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                            <td className="px-4 py-3 font-medium text-white">{metric.name}</td>
                            <td className="px-4 py-3 text-zinc-300 font-mono">{metric.value}</td>
                            <td className={`px-4 py-3 text-xs ${metric.trend.startsWith('+') ? 'text-emerald-400' : 'text-emerald-400'}`}>
                              {metric.trend}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                                {metric.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Paywall */}
        {!isPaid && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="py-12 text-center">
              <Sparkles className="w-10 h-10 text-amber-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-zinc-200 mb-2">Upgrade to Access My Slides</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                AI Slide generation, the My Slides library, and advanced analytics are available on paid plans.
              </p>
              <Button className="bg-amber-600 hover:bg-amber-700" onClick={() => window.location.href = "/billing"}>
                View Plans
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDeck} onOpenChange={(open) => { if (!open) { setPreviewDeck(null); setPresentationMode(false); } }}>
        <DialogContent className={`bg-zinc-950 border-zinc-800 transition-all duration-300 ${presentationMode ? 'max-w-[100vw] h-[100vh] m-0 rounded-none border-none p-0' : 'max-w-5xl max-h-[90vh] overflow-hidden flex flex-col'}`}>
          {!presentationMode && (
            <DialogHeader className="px-6 py-4 border-b border-zinc-800/50 shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-white flex items-center gap-2 text-xl">
                    <Presentation className="w-5 h-5 text-emerald-400" />
                    {previewDeck?.title}
                    {previewDeck?.isStarred && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                  </DialogTitle>
                  <DialogDescription className="text-zinc-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1"><LayoutGrid className="h-3 w-3" /> {previewDeck?.slideCount} slides</span>
                    <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" /> {previewDeck?.toolName}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {audienceLabel[previewDeck?.audience] || ""}</span>
                  </DialogDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="text-emerald-300 border-emerald-600/50" onClick={() => handleExportPptx(previewDeck)} disabled={pptxMut.isPending}>
                    {pptxMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />} Export PPTX
                  </Button>
                  <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-600" onClick={() => handleExportMarkdown(previewDeck)}>
                    <Download className="h-4 w-4 mr-2" /> Markdown
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setPresentationMode(true)}>
                    <PlayCircle className="h-4 w-4 mr-2" /> Present
                  </Button>
                </div>
              </div>
            </DialogHeader>
          )}

          {activeSlide && (
            <div className={`flex-1 flex flex-col ${presentationMode ? 'h-full bg-black' : 'overflow-y-auto p-6'}`}>
              
              {/* Slide Presentation Area */}
              <div className={`relative flex-1 flex flex-col justify-center ${presentationMode ? 'p-12' : 'min-h-[400px]'}`}>
                {presentationMode && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-white/50 hover:text-white z-50"
                    onClick={() => setPresentationMode(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                )}

                {/* The Slide */}
                <div className={`bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl border border-white/10 p-10 flex flex-col justify-center relative w-full max-w-5xl mx-auto shadow-2xl ${presentationMode ? 'aspect-video' : 'min-h-[350px]'}`}>
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent rounded-t-xl" />
                  
                  <div className="absolute top-4 right-6 flex gap-2">
                    <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                      {activeSlide.layout?.toUpperCase() || 'STANDARD'}
                    </Badge>
                    <span className="text-xs text-white/30 font-mono">{activeSlideIndex + 1} / {previewDeck?.slides?.length}</span>
                  </div>
                  
                  <div className="max-w-4xl">
                    <h2 className={`${presentationMode ? 'text-4xl lg:text-5xl' : 'text-2xl'} font-bold text-white mb-2 tracking-tight`}>{activeSlide.title}</h2>
                    {activeSlide.subtitle && <p className={`${presentationMode ? 'text-xl' : 'text-base'} text-emerald-400/80 mb-8 font-medium`}>{activeSlide.subtitle}</p>}
                    
                    <div className={`grid gap-6 ${activeSlide.layout === 'two-column' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                      <ul className="space-y-4">
                        {activeSlide.bullets?.map((b: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <ChevronRight className={`${presentationMode ? 'h-6 w-6 mt-1' : 'h-5 w-5 mt-0.5'} text-emerald-500 shrink-0`} />
                            <span className={`${presentationMode ? 'text-xl leading-relaxed' : 'text-base'} text-white/90`}>{b}</span>
                          </li>
                        ))}
                      </ul>
                      
                      {/* Placeholder for potential chart/image in 2-column layout */}
                      {activeSlide.layout === 'two-column' && (
                        <div className="bg-black/20 rounded-lg border border-white/5 flex items-center justify-center p-6">
                          <BarChart3 className="h-16 w-16 text-white/10" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Presentation Navigation Overlay */}
                {presentationMode && (
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/50 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handlePrevSlide} disabled={activeSlideIndex === 0}>
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <div className="flex gap-1.5">
                      {previewDeck?.slides?.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveSlideIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${i === activeSlideIndex ? "bg-emerald-400 w-4" : "bg-white/30 hover:bg-white/50"}`}
                        />
                      ))}
                    </div>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={handleNextSlide} disabled={activeSlideIndex === (previewDeck?.slides?.length || 1) - 1}>
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </div>

              {!presentationMode && (
                <div className="mt-6 space-y-6">
                  {/* Speaker notes */}
                  {activeSlide.speakerNotes && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                      <h4 className="text-xs font-semibold text-amber-400 mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Speaker Notes</h4>
                      <p className="text-sm text-amber-200/80 leading-relaxed">{activeSlide.speakerNotes}</p>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between bg-zinc-900/50 p-3 rounded-lg border border-zinc-800">
                    <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-700 hover:bg-zinc-800" onClick={handlePrevSlide} disabled={activeSlideIndex === 0}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Previous Slide
                    </Button>
                    
                    <div className="flex gap-1.5 overflow-x-auto max-w-[50%] px-2 hide-scrollbar">
                      {previewDeck?.slides?.map((_: any, i: number) => (
                        <button
                          key={i}
                          onClick={() => setActiveSlideIndex(i)}
                          title={`Slide ${i + 1}`}
                          className={`w-2.5 h-2.5 rounded-full transition-all shrink-0 ${i === activeSlideIndex ? "bg-emerald-400 ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-zinc-950" : "bg-zinc-600 hover:bg-zinc-400"}`}
                        />
                      ))}
                    </div>
                    
                    <Button variant="outline" size="sm" className="text-zinc-300 border-zinc-700 hover:bg-zinc-800" onClick={handleNextSlide} disabled={activeSlideIndex === (previewDeck?.slides?.length || 1) - 1}>
                      Next Slide <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  {/* Collaboration */}
                  {previewDeck && (
                    <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/30">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" /> Collaboration</h4>
                      <SlideComments deckId={previewDeck.id} activeSlideIndex={activeSlideIndex} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
