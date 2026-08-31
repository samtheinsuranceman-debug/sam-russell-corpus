// @ts-nocheck
import { useState } from "react";
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Target,
  MessageCircle,
  TrendingUp,
  Star,
  ChevronRight,
  ThumbsUp,
  Eye,
  Clock,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Swords,
  BookOpen,
  Share2,
  Send,
  Plus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

/* ═══════════════════════════════════════════════════════════════════
   THE WAR ROOM — Where advisors become allies and rivals.
   War Stories. Challenges. Prediction Markets. Whisper Network.
   Every user becomes a broadcasting tower.
   ═══════════════════════════════════════════════════════════════════ */

function SwordsIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={props.size || 24} height={props.size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={props.className}>
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" x2="19" y1="19" y2="13" /><line x1="16" x2="20" y1="16" y2="20" /><line x1="19" x2="21" y1="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" /><line x1="5" x2="9" y1="14" y2="18" /><line x1="7" x2="4" y1="17" y2="20" /><line x1="3" x2="5" y1="19" y2="21" />
    </svg>
  );
}

function WarStories() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const { data: stories, isLoading } = trpc.experience.getWarStories.useQuery();
  const createStory = trpc.experience.createWarStory.useMutation({
    onSuccess: () => {
      utils.experience.getWarStories.invalidate();
      toast.success("+100 XP — War Story Published!", { icon: "📖" });
      setShowForm(false);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
    },
    onError: (err) => toast.error(err.message),
  });
  const likeStory = trpc.experience.likeWarStory.useMutation({
    onSuccess: () => {
      utils.experience.getWarStories.invalidate();
      toast.success("+10 XP", { icon: "👍" });
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  function handleSubmit() {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error("Title and content are required");
      return;
    }
    createStory.mutate({
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newTags.trim() || "General",
      isAnonymous,
    });
  }

  function timeAgo(dateStr: string | Date) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={24} />
        <span className="ml-2 text-sm text-slate-400">Loading war stories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* New Story Button / Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
        >
          <Plus size={16} className="mr-2" /> Share Your War Story (+100 XP)
        </Button>
      ) : (
        <div className="rounded-xl bg-[#0b1628] border border-amber-500/30 p-4 space-y-3">
          <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <BookOpen size={16} /> New War Story
          </h4>
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title — e.g. How I Saved a Client $340K"
            className="bg-[#0a1628] border-[#1a3055] text-xs text-white placeholder:text-slate-600"
          />
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Tell your story... What happened? What strategy did you use? What was the outcome?"
            className="bg-[#0a1628] border-[#1a3055] text-xs text-white placeholder:text-slate-600 min-h-[100px]"
          />
          <Input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="Tags (comma-separated) — e.g. Roth, Tax Strategy, IUL"
            className="bg-[#0a1628] border-[#1a3055] text-xs text-white placeholder:text-slate-600"
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-600"
              />
              Post anonymously
            </label>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-xs text-slate-400" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 text-xs"
                onClick={handleSubmit}
                disabled={createStory.isPending}
              >
                {createStory.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stories list */}
      {(!stories || stories.length === 0) ? (
        <div className="text-center py-12 text-slate-500">
          <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No war stories yet. Be the first to share!</p>
        </div>
      ) : (
        stories.map((story: any) => {
          const tags = story.tags ? story.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [];
          return (
            <div key={story.id} className="rounded-xl bg-[#0b1628] border border-[#1a3055] p-4 hover:border-white/10 transition-all">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">{story.isAnonymous ? "🦅" : "🎯"}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {story.isAnonymous ? "Anonymous Advisor" : (story.authorName || `Advisor #${story.userId}`)}
                    </span>
                    <span className="text-[10px] text-slate-500">{timeAgo(story.createdAt)}</span>
                    {story.likes > 10 && <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-400 px-1 py-0">🔥 HOT</Badge>}
                    <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 px-1 py-0">+100 XP</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{story.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
                    {story.content.length > 200 ? story.content.slice(0, 200) + "..." : story.content}
                  </p>
                  {tags.length > 0 && (
                    <div className="flex items-center gap-1 mb-2">
                      {tags.map((tag: string, j: number) => (
                        <Badge key={j} variant="outline" className="text-[9px] border-[#1a3055] text-slate-400 px-1.5 py-0">{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <button
                      className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors"
                      onClick={() => likeStory.mutate({ storyId: story.id })}
                    >
                      <ThumbsUp size={13} /> <span className="text-[10px]">{story.likes || 0}</span>
                    </button>
                    <button className="flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors">
                      <MessageCircle size={13} /> <span className="text-[10px]">Reply</span>
                    </button>
                    <button
                      className="flex items-center gap-1 text-slate-500 hover:text-violet-400 transition-colors"
                      onClick={() => toast.success("+25 XP — Story Shared!", { icon: "🔗" })}
                    >
                      <Share2 size={13} /> <span className="text-[10px]">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ChallengeSystem() {
  const challenges = [
    {
      title: "Roth Conversion Showdown", type: "1v1", status: "active",
      desc: "Who can find the biggest tax savings in a sample case?",
      challenger: "The Alchemist", challengerScore: 47200, yourScore: 52100,
      reward: "500 XP + Rare Badge", timeLeft: "4h 23m",
    },
    {
      title: "Speed Quote Championship", type: "tournament", status: "open",
      desc: "Generate the most accurate quotes in 10 minutes",
      participants: 24, reward: "1000 XP + Legendary Loot",
      timeLeft: "Starts in 2h",
    },
    {
      title: "Client Outreach Marathon", type: "team", status: "active",
      desc: "Your team vs. the world — most clients contacted in 24h",
      teamScore: 34, opponentScore: 28, reward: "750 XP + Team Badge",
      timeLeft: "18h left",
    },
    {
      title: "Tax Harvest Blitz", type: "solo", status: "open",
      desc: "Find the optimal tax-loss harvest for 5 sample portfolios",
      reward: "300 XP", timeLeft: "Open until Friday",
    },
  ];

  const typeColors: Record<string, string> = {
    "1v1": "border-red-500/30 text-red-400",
    tournament: "border-amber-500/30 text-amber-400",
    team: "border-blue-500/30 text-blue-400",
    solo: "border-emerald-500/30 text-emerald-400",
  };

  return (
    <div className="space-y-3">
      {challenges.map((c, i) => (
        <div key={i} className="rounded-xl bg-[#0b1628] border border-[#1a3055] p-4 hover:border-white/10 transition-all">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h4 className="text-sm font-bold text-white">{c.title}</h4>
                <Badge variant="outline" className={`text-[9px] ${typeColors[c.type]} px-1 py-0`}>{c.type.toUpperCase()}</Badge>
                <Badge variant="outline" className={`text-[9px] px-1 py-0 ${c.status === "active" ? "border-emerald-500/30 text-emerald-400" : "border-slate-500/30 text-slate-400"}`}>
                  {c.status === "active" ? "LIVE" : "OPEN"}
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400">{c.desc}</p>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-shrink-0">
              <Clock size={12} /> {c.timeLeft}
            </div>
          </div>

          {c.type === "1v1" && c.yourScore && (
            <div className="flex items-center gap-3 my-3 p-2 rounded-lg bg-[#0a1628] border border-[#1a3055]">
              <div className="flex-1 text-center">
                <div className="text-[10px] text-slate-400">You</div>
                <div className="text-lg font-black text-emerald-400">${(c.yourScore / 1000).toFixed(1)}K</div>
              </div>
              <div className="text-xs font-bold text-slate-500">VS</div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-slate-400">{c.challenger}</div>
                <div className="text-lg font-black text-red-400">${((c.challengerScore || 0) / 1000).toFixed(1)}K</div>
              </div>
            </div>
          )}

          {c.type === "team" && (
            <div className="flex items-center gap-3 my-3 p-2 rounded-lg bg-[#0a1628] border border-[#1a3055]">
              <div className="flex-1 text-center">
                <div className="text-[10px] text-slate-400">Your Team</div>
                <div className="text-lg font-black text-blue-400">{c.teamScore}</div>
              </div>
              <div className="text-xs font-bold text-slate-500">VS</div>
              <div className="flex-1 text-center">
                <div className="text-[10px] text-slate-400">Opponents</div>
                <div className="text-lg font-black text-red-400">{c.opponentScore}</div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-amber-400" />
              <span className="text-[10px] text-amber-400 font-semibold">{c.reward}</span>
            </div>
            <Button size="sm" variant="ghost" className="text-xs text-white hover:text-emerald-400" onClick={() => toast.success("Challenge accepted!", { icon: "⚔️" })}>
              {c.status === "active" ? "Continue" : "Join"} <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function PredictionMarket() {
  const utils = trpc.useUtils();
  const { data: questions, isLoading } = trpc.experience.getPredictionQuestions.useQuery();
  const { data: myPredictions } = trpc.experience.getMyPredictions.useQuery();
  const createQuestion = trpc.experience.createPredictionQuestion.useMutation({
    onSuccess: () => {
      utils.experience.getPredictionQuestions.invalidate();
      toast.success("+50 XP — Prediction Question Created!", { icon: "🔮" });
      setShowForm(false);
      setNewQuestion("");
      setNewCategory("general");
      setNewEndDate("");
    },
    onError: (err) => toast.error(err.message),
  });
  const vote = trpc.experience.voteOnPrediction.useMutation({
    onSuccess: () => {
      utils.experience.getPredictionQuestions.invalidate();
      toast.success("+25 XP — Vote Placed!", { icon: "📊" });
    },
    onError: (err) => toast.error(err.message),
  });

  const [showForm, setShowForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [newEndDate, setNewEndDate] = useState("");
  const [wagerAmount, setWagerAmount] = useState(50);

  function handleCreateQuestion() {
    if (!newQuestion.trim() || !newEndDate) {
      toast.error("Question and end date are required");
      return;
    }
    createQuestion.mutate({
      question: newQuestion.trim(),
      category: newCategory,
      endDate: new Date(newEndDate).toISOString(),
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-slate-400" size={24} />
        <span className="ml-2 text-sm text-slate-400">Loading prediction market...</span>
      </div>
    );
  }

  const categories = ["general", "macro", "markets", "products", "industry", "regulation"];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-slate-400">Predict the future. Earn XP. Prove you're the oracle.</p>
        <Badge variant="outline" className="text-[10px] border-violet-500/30 text-violet-400">
          +100 XP per correct prediction
        </Badge>
      </div>

      {/* New Question Button / Form */}
      {!showForm ? (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20"
        >
          <Plus size={16} className="mr-2" /> Create Prediction Question (+50 XP)
        </Button>
      ) : (
        <div className="rounded-xl bg-[#0b1628] border border-violet-500/30 p-4 space-y-3">
          <h4 className="text-sm font-bold text-violet-400 flex items-center gap-2">
            <TrendingUp size={16} /> New Prediction
          </h4>
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Will the Fed cut rates before July? Will S&P hit 6000?"
            className="bg-[#0a1628] border-[#1a3055] text-xs text-white placeholder:text-slate-600 min-h-[60px]"
          />
          <div className="flex gap-2">
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 bg-[#0a1628] border border-[#1a3055] rounded-md text-xs text-white px-2 py-1.5"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
            <Input
              type="date"
              value={newEndDate}
              onChange={(e) => setNewEndDate(e.target.value)}
              className="flex-1 bg-[#0a1628] border-[#1a3055] text-xs text-white"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400">Questions earn you 50 XP</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" className="text-xs text-slate-400" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button
                size="sm"
                className="bg-violet-500/20 border border-violet-500/30 text-violet-400 hover:bg-violet-500/30 text-xs"
                onClick={handleCreateQuestion}
                disabled={createQuestion.isPending}
              >
                {createQuestion.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Send size={14} className="mr-1" />}
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Wager selector */}
      <div className="flex items-center gap-2 px-2">
        <span className="text-[10px] text-slate-500">Wager per vote:</span>
        {[10, 25, 50, 100].map((w) => (
          <button
            key={w}
            onClick={() => setWagerAmount(w)}
            className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
              wagerAmount === w
                ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                : "border-[#1a3055] text-slate-500 hover:text-slate-300"
            }`}
          >
            {w} RC
          </button>
        ))}
      </div>

      {/* Questions list */}
      {(!questions || questions.length === 0) ? (
        <div className="text-center py-12 text-slate-500">
          <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No predictions yet. Create the first one!</p>
        </div>
      ) : (
        questions.map((p: any) => {
          const totalVotes = (p.yesCount || 0) + (p.noCount || 0);
          const yesOdds = totalVotes > 0 ? Math.round((p.yesCount / totalVotes) * 100) : 50;
          const endDateStr = new Date(p.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <div key={p.id} className="rounded-xl bg-[#0b1628] border border-[#1a3055] p-4 hover:border-white/10 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px] border-[#1a3055] text-slate-400 px-1 py-0">
                      {p.category?.charAt(0).toUpperCase() + p.category?.slice(1)}
                    </Badge>
                    <span className="text-[10px] text-slate-500">Ends {endDateStr}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{p.question}</h4>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-[10px] text-slate-500">{totalVotes} votes</div>
                  <div className="text-[10px] text-violet-400">{p.totalWager || 0} RC wagered</div>
                </div>
              </div>

              {/* Odds bar */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-6 rounded-lg overflow-hidden flex">
                  <div
                    className="bg-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400"
                    style={{ width: `${Math.max(yesOdds, 15)}%` }}
                  >
                    YES {yesOdds}%
                  </div>
                  <div
                    className="bg-red-500/30 flex items-center justify-center text-[10px] font-bold text-red-400"
                    style={{ width: `${Math.max(100 - yesOdds, 15)}%` }}
                  >
                    NO {100 - yesOdds}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-xs"
                  onClick={() => vote.mutate({ questionId: p.id, vote: "yes", wager: wagerAmount })}
                  disabled={vote.isPending}
                >
                  <ArrowUp size={14} className="mr-1" /> Bet YES ({wagerAmount} RC)
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs"
                  onClick={() => vote.mutate({ questionId: p.id, vote: "no", wager: wagerAmount })}
                  disabled={vote.isPending}
                >
                  <ArrowDown size={14} className="mr-1" /> Bet NO ({wagerAmount} RC)
                </Button>
              </div>
            </div>
          );
        })
      )}

      {/* My Predictions */}
      {myPredictions && myPredictions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-2">
            <BarChart3 size={14} /> Your Prediction History
          </h4>
          <div className="space-y-2">
            {myPredictions.map((p: any, i: number) => (
              <div key={i} className="rounded-lg bg-[#0a1628] border border-[#1a3055] p-3 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-white font-medium">{p.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={`text-[9px] px-1 py-0 ${
                      p.prediction === "yes" ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"
                    }`}>
                      {p.prediction?.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-slate-500">{p.wager} RC wagered</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[9px] px-1.5 py-0 ${
                  p.status === "pending" ? "border-amber-500/30 text-amber-400" :
                  p.status === "won" ? "border-emerald-500/30 text-emerald-400" :
                  "border-red-500/30 text-red-400"
                }`}>
                  {p.status?.toUpperCase() || "PENDING"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function WhisperNetwork() {
  const [message, setMessage] = useState("");
  const whispers = [
    { author: "Anonymous", text: "Heard from a wholesaler that Pacific Life is about to increase their FIA caps by 1.5%. Don't quote me on this.", time: "12m ago", upvotes: 34, verified: false },
    { author: "Insider", text: "The new AG49-B regulations are going to change everything about IUL illustrations. Start preparing your clients now.", time: "1h ago", upvotes: 89, verified: true },
    { author: "Anonymous", text: "A major carrier is about to launch a hybrid product that combines MYGA guarantees with FIA upside. Watch for announcements next week.", time: "3h ago", upvotes: 56, verified: false },
    { author: "The Oracle", text: "If you're not looking at premium financing for your high-net-worth clients right now, you're leaving money on the table. Rates are about to shift.", time: "5h ago", upvotes: 123, verified: true },
    { author: "Anonymous", text: "Just saw internal numbers — the top 1% of advisors on this platform are closing 3x more deals than the bottom 50%. The tools work if you use them.", time: "8h ago", upvotes: 201, verified: true },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gradient-to-br from-slate-900/50 to-[#0b1628] border border-[#1a3055] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Eye size={16} className="text-slate-400" />
          <span className="text-xs font-bold text-white">Drop a Whisper</span>
          <Badge variant="outline" className="text-[9px] border-slate-500/30 text-slate-400 px-1 py-0">Anonymous</Badge>
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share intel, tips, or industry whispers..."
            className="bg-[#0a1628] border-[#1a3055] text-xs text-white placeholder:text-slate-600"
          />
          <Button size="sm" className="bg-white/10 border border-white/20 text-white hover:bg-white/20"
            onClick={() => { if (message.trim()) { toast.success("+30 XP — Whisper Dropped!", { icon: "👁️" }); setMessage(""); } }}>
            <Send size={14} />
          </Button>
        </div>
      </div>

      {whispers.map((w, i) => (
        <div key={i} className="rounded-xl bg-[#0b1628] border border-[#1a3055] p-4 hover:border-white/10 transition-all">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm flex-shrink-0">
              👁️
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-semibold text-slate-300">{w.author}</span>
                {w.verified && <Badge variant="outline" className="text-[8px] border-emerald-500/30 text-emerald-400 px-1 py-0">✓ Verified</Badge>}
                <span className="text-[10px] text-slate-500">{w.time}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">{w.text}</p>
              <div className="flex items-center gap-3 mt-2">
                <button className="flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors" onClick={() => toast.success("+5 XP", { icon: "👍" })}>
                  <ArrowUp size={13} /> <span className="text-[10px]">{w.upvotes}</span>
                </button>
                <button className="flex items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors">
                  <MessageCircle size={13} /> <span className="text-[10px]">Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function WarRoom() {
  const [tab, setTab] = useState("stories");
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "WarRoom",
    strategyType: "war-room",
  });

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <CalculationSyncBar />
        <ClientSelectorBar
          clients={calcIntegration.clients}
          clientsLoading={calcIntegration.clientsLoading}
          selectedClientId={calcIntegration.selectedClientId}
          selectedClientName={calcIntegration.selectedClientName}
          onSelectClient={calcIntegration.selectClient}
          scenarios={calcIntegration.scenarios}
          scenariosLoading={calcIntegration.scenariosLoading}
          scenarioName={calcIntegration.scenarioName}
          onSetScenarioName={calcIntegration.setScenarioName}
          onSave={() => calcIntegration.saveScenario({}, {})}
          onLoad={(s) => calcIntegration.loadScenario(s)}
          isSaving={calcIntegration.isSaving}
          lastSavedAt={calcIntegration.lastSavedAt}
          calculatorName="WarRoom"
        />
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Target className="text-red-400" size={24} /> The War Room
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Where advisors become allies and rivals. Share. Compete. Predict. Dominate.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-[#0a1628] border border-[#1a3055]">
            <TabsTrigger value="stories" className="text-xs data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400">
              <BookOpen size={14} className="mr-1" /> War Stories
            </TabsTrigger>
            <TabsTrigger value="challenges" className="text-xs data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400">
              <SwordsIcon size={14} className="mr-1" /> Challenges
            </TabsTrigger>
            <TabsTrigger value="predictions" className="text-xs data-[state=active]:bg-violet-500/20 data-[state=active]:text-violet-400">
              <TrendingUp size={14} className="mr-1" /> Predictions
            </TabsTrigger>
            <TabsTrigger value="whispers" className="text-xs data-[state=active]:bg-slate-500/20 data-[state=active]:text-slate-300">
              <Eye size={14} className="mr-1" /> Whispers
            </TabsTrigger>

            <TabsTrigger value="generate-outcome" className="text-xs bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          <TabsContent value="stories" className="mt-4"><WarStories /></TabsContent>
          <TabsContent value="challenges" className="mt-4"><ChallengeSystem /></TabsContent>
          <TabsContent value="predictions" className="mt-4"><PredictionMarket /></TabsContent>
          <TabsContent value="whispers" className="mt-4"><WhisperNetwork /></TabsContent>

          <TabsContent value="generate-outcome" className="space-y-6 mt-4">
            <GenerateOutcomeTab
              strategyType="war-room"
              hasResults={true}
              resultData={{ storiesShared: 34, challengesCompleted: 12, predictionsAccuracy: 78, communityRank: 5, warScore: 920 }}
              metrics={[{ label: "Stories Shared", value: 34, format: "number" }, { label: "Challenges Won", value: 12, format: "number" }, { label: "Prediction Accuracy", value: 78, format: "number", highlight: true }, { label: "War Score", value: 920, format: "number" }]}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
