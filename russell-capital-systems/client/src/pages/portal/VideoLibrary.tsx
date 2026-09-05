import { AppShell } from "@/components/AppShell";
import { useState } from "react";
import {
  Play, Clock, Search, Star, ChevronRight, Video, Eye,
  DollarSign, Home as HomeIcon, TrendingUp, Wallet, ExternalLink
} from "lucide-react";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useAuth } from "@/_core/hooks/useAuth";

/* ─── Video Data ───────────────────────────────────────────────── */

interface VideoEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  driveEmbedId: string;
  featured?: boolean;
  tags: string[];
}

const VIDEOS: VideoEntry[] = [
  {
    id: "heather-story",
    title: "How Heather Erased $1.37M in Costs — Without Cheating the System",
    description: "A real client case study showing how structured IUL + HELOC arbitrage eliminated $1.37 million in lifetime costs. This is the story that makes advisors rethink everything they know about debt and insurance.",
    category: "Client Stories",
    duration: "8 min",
    icon: Star,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    driveEmbedId: "13XFd-qBjT5IW9B8BnloU6BY3Twmg7wRL",
    featured: true,
    tags: ["case study", "IUL", "HELOC", "cost elimination"],
  },
  {
    id: "roth-family",
    title: "Roth Conversion Family Story",
    description: "How one family converted their entire traditional IRA to Roth — tax-free — using the Zero-Percent Roth Conversion strategy. The 248-calculator brain sequenced every dollar to avoid triggering a single dollar of tax liability.",
    category: "Strategy Walkthroughs",
    duration: "10 min",
    icon: TrendingUp,
    color: "text-violet-400",
    bgColor: "bg-violet-500/10",
    borderColor: "border-violet-500/20",
    driveEmbedId: "1ob1UHlvIzQV9AFC5xig1-a9nBfVirwRq",
    featured: true,
    tags: ["roth conversion", "tax-free", "IRA", "family planning"],
  },
  {
    id: "debt-code",
    title: "How Structure Beats Income: The Debt Code",
    description: "Why high-income earners who structure debt correctly outperform those who simply earn more. This video breaks down the mathematical proof behind HELOC-to-IUL arbitrage and why the wealthy use debt as a tool, not a burden.",
    category: "Core Concepts",
    duration: "12 min",
    icon: DollarSign,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    driveEmbedId: "1eSZu_NUKm_lCkze_lES0wARoVb7ZjQEs",
    featured: true,
    tags: ["debt structure", "HELOC", "IUL", "arbitrage"],
  },
  {
    id: "liquidity-tool",
    title: "Liquidity Tool Functionality",
    description: "A technical walkthrough of the Russell Capital Systems™ Liquidity Tool — how it calculates available cash value, loan capacity, and optimal distribution timing across multiple IUL policies simultaneously.",
    category: "Platform Training",
    duration: "7 min",
    icon: Wallet,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/20",
    driveEmbedId: "15J5cqCMsHfSkgVYZGRF_1q-NkYoMlcyP",
    tags: ["liquidity", "cash value", "IUL", "platform"],
  },
  {
    id: "wealthy-debt",
    title: "How the Wealthy Use Debt (While You Fear It)",
    description: "The mindset shift that separates the top 1% from everyone else. This video reveals how the wealthy leverage debt to create tax-free wealth, while the middle class pays interest that enriches banks instead of building generational assets.",
    category: "Core Concepts",
    duration: "11 min",
    icon: HomeIcon,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/20",
    driveEmbedId: "1IbyZ3gYPXDZewrB2BO2Os-0StKhLbn9P",
    tags: ["wealthy mindset", "debt leverage", "tax-free", "generational wealth"],
  },
];

const CATEGORIES = ["All", ...Array.from(new Set(VIDEOS.map(v => v.category)))];

/* ─── Component ────────────────────────────────────────────────── */

export default function VideoLibrary() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

  const filtered = VIDEOS.filter(v => {
    const matchesSearch = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "All" || v.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const featured = VIDEOS.filter(v => v.featured);

  return (
    <AppShell title="Video Library" subtitle="Sam Russell's Strategy Breakdowns & Client Stories">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="rc-page-header mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500/20 to-violet-500/20 border border-rose-500/30">
            <Video className="w-7 h-7 text-rose-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Video Library</h1>
            <p className="text-sm text-muted-foreground">Strategy breakdowns, client stories, and platform training by Sam Russell</p>
          </div>
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rc-card p-4 text-center">
          <div className="text-2xl font-bold text-rose-400">{VIDEOS.length}</div>
          <div className="text-xs text-muted-foreground">Videos</div>
        </div>
        <div className="rc-card p-4 text-center">
          <div className="text-2xl font-bold text-violet-400">{CATEGORIES.length - 1}</div>
          <div className="text-xs text-muted-foreground">Categories</div>
        </div>
        <div className="rc-card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">48 min</div>
          <div className="text-xs text-muted-foreground">Total Runtime</div>
        </div>
      </div>

      {/* ── Search & Filter ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search videos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border/50 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "bg-card/50 text-muted-foreground border border-border/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Video Grid ───────────────────────────────────────── */}
      <div className="space-y-4 mb-8">
        {filtered.map((video) => (
          <div key={video.id} className={`rc-card border ${video.borderColor} overflow-hidden`}>
            {/* Video player area */}
            {playingVideo === video.id ? (
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://drive.google.com/file/d/${video.driveEmbedId}/preview`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={video.title}
                />
              </div>
            ) : (
              <button
                onClick={() => setPlayingVideo(video.id)}
                className="w-full p-6 flex items-center gap-4 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className={`p-4 rounded-xl ${video.bgColor} border ${video.borderColor} shrink-0 relative`}>
                  <video.icon className={`w-6 h-6 ${video.color}`} />
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rose-500">
                    <Play className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-white text-sm sm:text-base">{video.title}</h3>
                    {video.featured && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase shrink-0">Featured</span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{video.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" /> {video.duration}
                    </span>
                    <span className={`text-xs ${video.color}`}>{video.category}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
              </button>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rc-card p-12 text-center">
            <Video className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No videos match your search.</p>
          </div>
        )}
      </div>

      <NAICDisclaimer />
    </AppShell>
  );
}
