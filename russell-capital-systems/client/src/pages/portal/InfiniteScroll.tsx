// @ts-nocheck
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  Heart, Share2, Bookmark, BookmarkCheck, Eye, ChevronUp, ChevronDown,
  Sparkles, Crown, Flame, X, Copy, Mail, MessageCircle,
  Twitter, Facebook, Linkedin, ArrowRight, Play,
  TrendingUp, DollarSign, Shield, Target, Brain, Gift, AlertTriangle,
  Trophy, Zap
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════
   THE INFINITE SCROLL OF WEALTH
   TikTok-style vertical swipe feed of financial content.
   Addiction-optimized: curiosity gaps, variable ratio reinforcement,
   dopamine micro-hits, and mega reel reward spikes every 6-7 cards.
   ═══════════════════════════════════════════════════════════════════════ */

interface Slide { order: number; text: string; duration: number; }

interface Reel {
  id: number; category: string; title: string; hookText: string;
  emotion: string; isMega: boolean; slides: Slide[] | string;
  ctaText: string; ctaAction: string; musicMood: string;
  bgGradient: string; iconEmoji: string; readTimeSeconds: number;
  sortOrder: number; viewCount: number; likeCount: number;
  saveCount: number; shareCount: number;
}

const EMOTION_GRADIENTS: Record<string, string> = {
  triumphant: "from-amber-900 via-yellow-950 to-black",
  inspiring: "from-emerald-900 via-teal-950 to-black",
  shocking: "from-red-900 via-rose-950 to-black",
  educational: "from-blue-900 via-indigo-950 to-black",
  heartwarming: "from-pink-900 via-rose-950 to-black",
  cautionary: "from-orange-900 via-amber-950 to-black",
  exciting: "from-violet-900 via-purple-950 to-black",
  devastating: "from-gray-900 via-slate-950 to-black",
  funny: "from-cyan-900 via-sky-950 to-black",
  mysterious: "from-indigo-900 via-violet-950 to-black",
};

const EMOTION_ACCENTS: Record<string, string> = {
  triumphant: "text-amber-400", inspiring: "text-emerald-400",
  shocking: "text-red-400", educational: "text-blue-400",
  heartwarming: "text-pink-400", cautionary: "text-orange-400",
  exciting: "text-violet-400", devastating: "text-gray-400",
  funny: "text-cyan-400", mysterious: "text-indigo-400",
};

const CATEGORY_ICONS: Record<string, typeof DollarSign> = {
  financial_wins: Trophy, financial_losses: AlertTriangle,
  financial_comebacks: Flame, money_secrets: Brain,
  tax_tips: Target, real_estate: TrendingUp, crypto: Zap,
  iul_advantages: Shield, annuity: Gift, wealthy_habits: Crown,
  default: DollarSign,
};

function parseSlides(raw: Slide[] | string): Slide[] {
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return [{ order: 1, text: String(raw), duration: 5 }]; }
}

function ReelCard({
  reel, isActive, onLike, onSave, onShare, isLiked, isSaved, interactionsUsed,
}: {
  reel: Reel; isActive: boolean;
  onLike: () => void; onSave: () => void; onShare: () => void;
  isLiked: boolean; isSaved: boolean;
  interactionsUsed: Record<string, boolean>;
}) {
  const slides = useMemo(() => parseSlides(reel.slides), [reel.slides]);
  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isActive || slides.length <= 1) return;
    setSlideIndex(0);
    const advance = () => {
      setSlideIndex(prev => {
        const next = prev + 1;
        if (next >= slides.length) return 0; // Loop
        return next;
      });
    };
    const dur = (slides[0]?.duration || 5) * 1000;
    slideTimerRef.current = setInterval(advance, dur);
    return () => { if (slideTimerRef.current) clearInterval(slideTimerRef.current); };
  }, [isActive, slides]);

  const gradient = EMOTION_GRADIENTS[reel.emotion] || EMOTION_GRADIENTS.educational;
  const accent = EMOTION_ACCENTS[reel.emotion] || "text-blue-400";
  const IconComp = CATEGORY_ICONS[reel.category] || CATEGORY_ICONS.default;

  return (
    <div className={`relative w-full h-full bg-gradient-to-b ${gradient} flex flex-col overflow-hidden snap-start`}>
      {/* Mega reel glow effect */}
      {reel.isMega && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />
        </div>
      )}

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-4 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{reel.iconEmoji}</span>
          <Badge variant="outline" className={`${accent} border-current/30 text-xs uppercase tracking-wider`}>
            {reel.category.replace(/_/g, " ")}
          </Badge>
          {reel.isMega && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 animate-pulse">
              <Crown className="w-3 h-3 mr-1" /> MEGA
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 text-white/40 text-xs">
          <Eye className="w-3 h-3" /> {reel.viewCount.toLocaleString()}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative">
        {/* Hook text */}
        <h2 className={`font-bold text-white mb-4 leading-tight text-center ${reel.isMega ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"}`}>
          {reel.hookText}
        </h2>

        {/* Slide content */}
        <div className="relative w-full max-w-2xl min-h-[120px] flex items-center justify-center">
          {slides.map((slide, i) => (
            <div
              key={i}
              className={`absolute inset-0 flex items-center justify-center transition-all duration-700 ${
                i === slideIndex ? "opacity-100 scale-100" : "opacity-0 scale-95"
              }`}
            >
              <p className={`text-white/90 font-medium leading-relaxed text-center max-w-lg ${reel.isMega ? "text-xl md:text-2xl" : "text-lg md:text-xl"}`}>
                {slide.text}
              </p>
            </div>
          ))}
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="flex gap-1.5 mt-4">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === slideIndex ? `w-6 ${accent.replace("text-", "bg-")}` : "w-1.5 bg-white/20"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA button */}
      {reel.ctaText && (
        <div className="px-6 pb-2">
          <Button
            size="sm"
            className={`w-full ${reel.isMega
              ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400"
              : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
            }`}
            onClick={() => toast.info("Feature coming soon")}
          >
            {reel.ctaText} <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Bottom interaction bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-4">
          {/* Like — disappears after use */}
          {!interactionsUsed.like ? (
            <button onClick={onLike} className="flex items-center gap-1 group transition-all">
              <Heart className={`w-6 h-6 transition-all ${isLiked ? "fill-red-500 text-red-500 scale-110" : "text-white/60 group-hover:text-red-400"}`} />
              <span className="text-xs text-white/50">{reel.likeCount + (isLiked ? 1 : 0)}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 opacity-30">
              <Heart className="w-6 h-6 fill-red-500 text-red-500" />
              <span className="text-xs text-white/50">{reel.likeCount + 1}</span>
            </div>
          )}

          {/* Save — disappears after use */}
          {!interactionsUsed.save ? (
            <button onClick={onSave} className="flex items-center gap-1 group transition-all">
              {isSaved
                ? <BookmarkCheck className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
                : <Bookmark className="w-6 h-6 text-white/60 group-hover:text-emerald-400" />
              }
              <span className="text-xs text-white/50">{reel.saveCount + (isSaved ? 1 : 0)}</span>
            </button>
          ) : (
            <div className="flex items-center gap-1 opacity-30">
              <BookmarkCheck className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
              <span className="text-xs text-white/50">{reel.saveCount + 1}</span>
            </div>
          )}

          {/* Share */}
          <button onClick={onShare} className="flex items-center gap-1 group transition-all">
            <Share2 className="w-6 h-6 text-white/60 group-hover:text-blue-400" />
            <span className="text-xs text-white/50">{reel.shareCount}</span>
          </button>
        </div>

        {/* Music mood indicator */}
        <div className="flex items-center gap-1 text-white/30 text-xs">
          <Play className="w-3 h-3" /> {reel.musicMood}
        </div>
      </div>
    </div>
  );
}

function ShareModal({ reel, onClose, onShare }: { reel: Reel; onClose: () => void; onShare: (platform: string) => void }) {
  const shareUrl = `${window.location.origin}/reels/${reel.id}`;
  const shareText = `${reel.hookText}\n\n${reel.title}\n\n🔥 Watch more at www.russellcap.com`;

  const shareOptions = [
    { name: "Copy Link", icon: Copy, action: () => { navigator.clipboard.writeText(shareUrl); toast.success("Link copied!"); onShare("copy"); } },
    { name: "Email", icon: Mail, action: () => { window.open(`mailto:?subject=${encodeURIComponent(reel.title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl + "\n\n---\nSent from Russell Capital Systems\nwww.russellcap.com")}`); onShare("email"); } },
    { name: "Text", icon: MessageCircle, action: () => { window.open(`sms:?body=${encodeURIComponent(shareText + " " + shareUrl + "\n\nwww.russellcap.com")}`); onShare("sms"); } },
    { name: "Twitter", icon: Twitter, action: () => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`); onShare("twitter"); } },
    { name: "Facebook", icon: Facebook, action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`); onShare("facebook"); } },
    { name: "LinkedIn", icon: Linkedin, action: () => { window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`); onShare("linkedin"); } },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md bg-gray-900 rounded-t-2xl p-6 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-lg">Share this reel</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-white/60 text-sm mb-4 line-clamp-2">{reel.hookText}</p>
        <div className="grid grid-cols-3 gap-3">
          {shareOptions.map(opt => (
            <button
              key={opt.name}
              onClick={opt.action}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <opt.icon className="w-6 h-6 text-white/70" />
              <span className="text-xs text-white/50">{opt.name}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-white/20 text-xs mt-4">www.russellcap.com</p>
      </div>
    </div>
  );
}

export default function InfiniteScroll() {
  const { isAuthenticated } = useAuth();
  const [activeIndex, setActiveIndex] = useState(0);
  const [allReels, setAllReels] = useState<Reel[]>([]);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);
  const [shareReel, setShareReel] = useState<Reel | null>(null);
  const [interactionsUsed, setInteractionsUsed] = useState<Record<number, Record<string, boolean>>>({});
  const [likedReels, setLikedReels] = useState<Set<number>>(new Set());
  const [savedReels, setSavedReels] = useState<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const touchStartY = useRef(0);
  const fetchedCursors = useRef<Set<string>>(new Set());

  const { data: initialData, isLoading } = trpc.reels.feed.useQuery(
    { limit: 15 },
    { enabled: allReels.length === 0 }
  );

  const { data: moreData } = trpc.reels.feed.useQuery(
    { cursor: nextCursor, limit: 15 },
    { enabled: !!nextCursor && !fetchedCursors.current.has(String(nextCursor)) }
  );

  const recordView = trpc.reels.recordView.useMutation();
  const toggleLikeMut = trpc.reels.toggleLike.useMutation();
  const toggleSaveMut = trpc.reels.toggleSave.useMutation();
  const recordShareMut = trpc.reels.recordShare.useMutation();

  useEffect(() => {
    if (initialData?.items && allReels.length === 0) {
      setAllReels(initialData.items as Reel[]);
      setHasMore(initialData.hasMore);
      if (initialData.nextCursor) setNextCursor(initialData.nextCursor);
    }
  }, [initialData]);

  useEffect(() => {
    if (moreData?.items) {
      fetchedCursors.current.add(String(nextCursor));
      setAllReels(prev => {
        const ids = new Set(prev.map(r => r.id));
        const fresh = (moreData.items as Reel[]).filter(r => !ids.has(r.id));
        return [...prev, ...fresh];
      });
      setHasMore(moreData.hasMore);
      if (moreData.nextCursor) setNextCursor(moreData.nextCursor);
    }
  }, [moreData]);

  useEffect(() => {
    const reel = allReels[activeIndex];
    if (!reel) return;
    if (isAuthenticated) recordView.mutate({ reelId: reel.id });

    const html = document.documentElement;
    html.removeAttribute("data-reel-emotion");
    if (reel.isMega) {
      html.setAttribute("data-reel-emotion", "mega");
    } else if (["triumphant", "exciting", "inspiring"].includes(reel.emotion)) {
      html.setAttribute("data-reel-emotion", "excitement");
    } else if (["shocking", "devastating", "cautionary"].includes(reel.emotion)) {
      html.setAttribute("data-reel-emotion", "alert");
    }
    const timer = setTimeout(() => html.removeAttribute("data-reel-emotion"), 5000);
    return () => clearTimeout(timer);
  }, [activeIndex, allReels.length]);

  useEffect(() => {
    if (activeIndex >= allReels.length - 5 && hasMore && nextCursor) {
    }
  }, [activeIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === " ") { e.preventDefault(); goNext(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); goPrev(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeIndex, allReels.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isScrolling.current) return;
      if (Math.abs(e.deltaY) > 30) {
        isScrolling.current = true;
        if (e.deltaY > 0) goNext(); else goPrev();
        setTimeout(() => { isScrolling.current = false; }, 600);
      }
    };

    const handleTouchStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const handleTouchEnd = (e: TouchEvent) => {
      const diff = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goNext(); else goPrev();
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [activeIndex, allReels.length]);

  const goNext = useCallback(() => {
    setActiveIndex(prev => Math.min(prev + 1, allReels.length - 1));
  }, [allReels.length]);

  const goPrev = useCallback(() => {
    setActiveIndex(prev => Math.max(prev - 1, 0));
  }, []);

  const handleLike = useCallback((reelId: number) => {
    if (!isAuthenticated) { toast.error("Sign in to like reels"); return; }
    const wasLiked = likedReels.has(reelId);
    setLikedReels(prev => { const s = new Set(prev); wasLiked ? s.delete(reelId) : s.add(reelId); return s; });
    setInteractionsUsed(prev => ({ ...prev, [reelId]: { ...prev[reelId], like: true } }));
    toggleLikeMut.mutate({ reelId });
  }, [isAuthenticated, likedReels]);

  const handleSave = useCallback((reelId: number) => {
    if (!isAuthenticated) { toast.error("Sign in to save reels"); return; }
    const wasSaved = savedReels.has(reelId);
    setSavedReels(prev => { const s = new Set(prev); wasSaved ? s.delete(reelId) : s.add(reelId); return s; });
    setInteractionsUsed(prev => ({ ...prev, [reelId]: { ...prev[reelId], save: true } }));
    toggleSaveMut.mutate({ reelId });
    toast.success(wasSaved ? "Removed from saved" : "Saved to your collection!");
  }, [isAuthenticated, savedReels]);

  const handleShare = useCallback((reelId: number, platform: string) => {
    if (isAuthenticated) recordShareMut.mutate({ reelId, platform });
    setShareReel(null);
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center bg-black">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-amber-400 animate-pulse mx-auto mb-4" />
            <p className="text-white/60 text-lg">Loading your wealth feed...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (allReels.length === 0) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center bg-black">
          <div className="text-center">
            <DollarSign className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-white/60 text-lg">No reels available yet</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div
        ref={containerRef}
        className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-black"
        style={{ touchAction: "none" }}
      >
        {/* Reel stack */}
        <div
          className="absolute inset-0 transition-transform duration-500 ease-out"
          style={{ transform: `translateY(-${activeIndex * 100}%)` }}
        >
          {allReels.map((reel, i) => (
            <div key={reel.id} className="w-full" style={{ height: "100%" }}>
              <ReelCard
                reel={reel}
                isActive={i === activeIndex}
                onLike={() => handleLike(reel.id)}
                onSave={() => handleSave(reel.id)}
                onShare={() => setShareReel(reel)}
                isLiked={likedReels.has(reel.id)}
                isSaved={savedReels.has(reel.id)}
                interactionsUsed={interactionsUsed[reel.id] || {}}
              />
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            disabled={activeIndex >= allReels.length - 1}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white disabled:opacity-20 transition-all"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
          <div className="flex flex-col gap-0.5">
            {allReels.slice(Math.max(0, activeIndex - 3), activeIndex + 4).map((r, i) => {
              const actualIdx = Math.max(0, activeIndex - 3) + i;
              return (
                <div
                  key={r.id}
                  className={`rounded-full transition-all duration-300 ${
                    actualIdx === activeIndex
                      ? `w-1.5 h-6 ${r.isMega ? "bg-amber-400" : "bg-emerald-400"}`
                      : "w-1 h-2 bg-white/20"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Reel counter */}
        <div className="absolute top-4 right-4 z-20 text-white/30 text-xs font-mono">
          {activeIndex + 1} / {allReels.length}
        </div>
      </div>

      {/* Share modal */}
      {shareReel && (
        <ShareModal
          reel={shareReel}
          onClose={() => setShareReel(null)}
          onShare={(platform) => handleShare(shareReel.id, platform)}
        />
      )}
    </AppShell>
  );
}
