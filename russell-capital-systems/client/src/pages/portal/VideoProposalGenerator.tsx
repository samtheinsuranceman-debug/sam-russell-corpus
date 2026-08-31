// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Video,
  Play,
  RefreshCw,
  Wand2,
  Send,
  Eye,
  Clock,
  BarChart3,
  Users,
  Copy,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Film,
  Mic,
  User,
  FileText,
  ChevronRight,
  Sparkles,
  Share2,
  Trash2,
  Edit3,
  Volume2,
  Monitor,
  ChevronDown,
  ChevronUp,
  Plus,
} from "lucide-react";

const CHAPTER_TYPES = [
  { value: "introduction", label: "Introduction", icon: User, color: "bg-blue-500/10 text-blue-400", description: "Warm welcome, preview what's covered" },
  { value: "current_situation", label: "Current Situation", icon: BarChart3, color: "bg-amber-500/10 text-amber-400", description: "Client's financial picture & opportunities" },
  { value: "recommended_strategy", label: "Recommended Strategy", icon: Sparkles, color: "bg-emerald-500/10 text-emerald-400", description: "Strategy explanation with actual numbers" },
  { value: "twenty_year_projection", label: "20-Year Projection", icon: ChevronRight, color: "bg-purple-500/10 text-purple-400", description: "Projected outcomes & milestones" },
  { value: "next_steps", label: "Next Steps", icon: Send, color: "bg-rose-500/10 text-rose-400", description: "Clear call to action & next steps" },
];

const STATUS_BADGES: Record<string, { label: string; variant: string; icon: any }> = {
  draft: { label: "Draft", variant: "secondary", icon: Edit3 },
  generating_script: { label: "Generating Script...", variant: "outline", icon: Loader2 },
  script_ready: { label: "Script Ready", variant: "default", icon: FileText },
  generating_video: { label: "Generating Video...", variant: "outline", icon: Loader2 },
  processing: { label: "Processing...", variant: "outline", icon: Loader2 },
  completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
  failed: { label: "Failed", variant: "destructive", icon: AlertCircle },
};

export default function VideoProposalGenerator() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("proposals");
  const [selectedProposalId, setSelectedProposalId] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState<string>("");
  const [newResolution, setNewResolution] = useState<"1080p" | "720p">("1080p");

  const proposalsQuery = trpc.videoProposal.list.useQuery(undefined, { refetchInterval: 10000 });
  const clientsQuery = trpc.client.list.useQuery();

  const createMutation = trpc.videoProposal.create.useMutation({
    onSuccess: (data) => {
      toast.success("Video proposal created");
      setShowCreateDialog(false);
      setNewTitle("");
      setNewClientId("");
      proposalsQuery.refetch();
      if (data?.id) {
        setSelectedProposalId(data.id);
        setActiveTab("editor");
      }
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteMutation = trpc.videoProposal.delete.useMutation({
    onSuccess: () => { toast.success("Proposal deleted"); proposalsQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const handleCreate = () => {
    if (!newTitle.trim()) { toast.error("Title is required"); return; }
    createMutation.mutate({
      title: newTitle,
      clientId: newClientId ? parseInt(newClientId) : undefined,
      resolution: newResolution,
    });
  };

  const proposals = proposalsQuery.data || [];
  const clients = clientsQuery.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Video Proposal Generator</h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">
              Create personalized AI avatar videos that present your client's financial strategy
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Proposal
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="proposals" className="gap-2"><Film className="w-4 h-4" /> All Proposals</TabsTrigger>
            <TabsTrigger value="editor" className="gap-2" disabled={!selectedProposalId}><Edit3 className="w-4 h-4" /> Script Editor</TabsTrigger>
            <TabsTrigger value="preview" className="gap-2" disabled={!selectedProposalId}><Eye className="w-4 h-4" /> Preview & Generate</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2" disabled={!selectedProposalId}><BarChart3 className="w-4 h-4" /> Engagement</TabsTrigger>
          </TabsList>

          {/* Proposals List */}
          <TabsContent value="proposals">
            {proposals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <Video className="w-8 h-8 text-violet-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Video Proposals Yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-6">
                    Create your first AI-powered video proposal. Select a client, generate personalized scripts, and produce a professional video with an AI avatar.
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create First Proposal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {proposals.filter(p => p.errorMessage !== "Deleted by user").map((proposal) => {
                  const statusInfo = STATUS_BADGES[proposal.status] || STATUS_BADGES.draft;
                  const StatusIcon = statusInfo.icon;
                  const clientName = clients.find(c => c.id === proposal.clientId)?.name;
                  return (
                    <Card key={proposal.id} className="hover:border-violet-500/30 transition-colors cursor-pointer" onClick={() => { setSelectedProposalId(proposal.id); setActiveTab("editor"); }}>
                      <CardContent className="flex items-center gap-4 py-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center shrink-0">
                          {proposal.status === "completed" && proposal.thumbnailUrl ? (
                            <img src={proposal.thumbnailUrl} alt="" className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Video className="w-6 h-6 text-violet-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{proposal.title}</h3>
                            <Badge variant={statusInfo.variant as any} className="gap-1 shrink-0">
                              <StatusIcon className={`w-3 h-3 ${statusInfo.icon === Loader2 ? "animate-spin" : ""}`} />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {clientName && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {clientName}</span>}
                            <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {proposal.resolution || "1080p"}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(proposal.createdAt).toLocaleDateString()}</span>
                            {proposal.totalDuration && <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {Math.round(proposal.totalDuration / 60)}m {proposal.totalDuration % 60}s</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {proposal.status === "completed" && proposal.shareToken && (
                            <Button variant="outline" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${window.location.origin}/video/${proposal.shareToken}`); toast.success("Share link copied!"); }}>
                              <Share2 className="w-3 h-3" /> Share
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); if (confirm("Delete this proposal?")) deleteMutation.mutate({ id: proposal.id }); }}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Script Editor */}
          <TabsContent value="editor">
            {selectedProposalId && <ScriptEditor proposalId={selectedProposalId} clients={clients} onGenerate={() => setActiveTab("preview")} />}
          </TabsContent>

          {/* Preview & Generate */}
          <TabsContent value="preview">
            {selectedProposalId && <VideoPreview proposalId={selectedProposalId} />}
          </TabsContent>

          {/* Engagement Analytics */}
          <TabsContent value="analytics">
            {selectedProposalId && <EngagementAnalytics proposalId={selectedProposalId} />}
          </TabsContent>
        </Tabs>

        {/* Create Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Video className="w-5 h-5 text-violet-400" /> New Video Proposal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label>Proposal Title</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Retirement Strategy for John & Jane Smith" className="mt-1" />
              </div>
              <div>
                <Label>Client (Optional)</Label>
                <Select value={newClientId} onValueChange={setNewClientId}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select a client..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No client selected</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resolution</Label>
                <Select value={newResolution} onValueChange={(v) => setNewResolution(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="w-full gap-2">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Proposal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


function ScriptEditor({ proposalId, clients, onGenerate }: { proposalId: number; clients: any[]; onGenerate: () => void }) {
  const proposalQuery = trpc.videoProposal.getById.useQuery({ id: proposalId });
  const [editingChapterId, setEditingChapterId] = useState<number | null>(null);
  const [editScript, setEditScript] = useState("");
  const [expandedChapter, setExpandedChapter] = useState<number | null>(null);
  const [strategyJson, setStrategyJson] = useState("{}");

  const generateScriptsMutation = trpc.videoProposal.generateScripts.useMutation({
    onSuccess: () => { toast.success("Scripts generated! Review and edit below."); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const updateChapterMutation = trpc.videoProposal.updateChapter.useMutation({
    onSuccess: () => { toast.success("Chapter updated"); setEditingChapterId(null); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const regenerateChapterMutation = trpc.videoProposal.regenerateChapter.useMutation({
    onSuccess: () => { toast.success("Chapter regenerated"); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const updateMutation = trpc.videoProposal.update.useMutation({
    onSuccess: () => { toast.success("Settings updated"); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const proposal = proposalQuery.data;
  if (!proposal) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const chapters = proposal.chapters || [];
  const clientName = clients.find(c => c.id === proposal.clientId)?.name;
  const totalDuration = chapters.reduce((sum, ch) => sum + (ch.durationEstimate || 0), 0);

  return (
    <div className="space-y-6">
      {/* Proposal Header */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">{proposal.title}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                {clientName && <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {clientName}</span>}
                <span className="flex items-center gap-1"><Monitor className="w-3 h-3" /> {proposal.resolution || "1080p"}</span>
                {chapters.length > 0 && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> ~{Math.round(totalDuration / 60)}m {totalDuration % 60}s estimated</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={STATUS_BADGES[proposal.status]?.variant as any} className="gap-1">
                {STATUS_BADGES[proposal.status]?.label || proposal.status}
              </Badge>
              {chapters.length > 0 && (
                <Button onClick={onGenerate} className="gap-2">
                  <Video className="w-4 h-4" /> Preview & Generate
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategy Data Input */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Strategy Data (Optional)</CardTitle>
          <CardDescription>Paste strategy data JSON to personalize the scripts with actual numbers</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={strategyJson}
            onChange={e => setStrategyJson(e.target.value)}
            placeholder='{"projectedTaxSavings": 250000, "projectedEquityGrowth": 1500000, ...}'
            className="font-mono text-xs h-24"
          />
        </CardContent>
      </Card>

      {/* Generate Scripts Button */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => {
            let strategyData = {};
            try { strategyData = JSON.parse(strategyJson); } catch { /* ignore */ }
            generateScriptsMutation.mutate({
              proposalId,
              clientId: proposal.clientId || undefined,
              strategyData,
            });
          }}
          disabled={generateScriptsMutation.isPending}
          className="gap-2"
          variant={chapters.length > 0 ? "outline" : "default"}
        >
          {generateScriptsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {chapters.length > 0 ? "Regenerate All Scripts" : "Generate AI Scripts"}
        </Button>
        {generateScriptsMutation.isPending && (
          <span className="text-sm text-muted-foreground animate-pulse">AI is writing personalized scripts for each chapter...</span>
        )}
      </div>

      {/* Chapter List */}
      {chapters.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Video Chapters ({chapters.length})</h3>
          {chapters.map((chapter, idx) => {
            const chapterInfo = CHAPTER_TYPES.find(ct => ct.value === chapter.chapterType) || CHAPTER_TYPES[0];
            const ChapterIcon = chapterInfo.icon;
            const isExpanded = expandedChapter === chapter.id;
            const isEditing = editingChapterId === chapter.id;

            return (
              <Card key={chapter.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setExpandedChapter(isExpanded ? null : chapter.id)}
                >
                  <div className={`w-8 h-8 rounded-lg ${chapterInfo.color} flex items-center justify-center shrink-0`}>
                    <ChapterIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-mono">Ch. {idx + 1}</span>
                      <h4 className="font-medium truncate">{chapter.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{chapter.script?.substring(0, 100)}...</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" /> ~{chapter.durationEstimate || 30}s
                    </Badge>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t px-4 pb-4 pt-3 space-y-3">
                    {isEditing ? (
                      <>
                        <Textarea
                          value={editScript}
                          onChange={e => setEditScript(e.target.value)}
                          className="min-h-[200px] text-sm"
                          placeholder="Edit the script..."
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateChapterMutation.mutate({ chapterId: chapter.id, script: editScript })} disabled={updateChapterMutation.isPending} className="gap-1">
                            {updateChapterMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} Save
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingChapterId(null)}>Cancel</Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{chapter.script}</p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1" onClick={() => { setEditingChapterId(chapter.id); setEditScript(chapter.script); }}>
                            <Edit3 className="w-3 h-3" /> Edit Script
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            disabled={regenerateChapterMutation.isPending}
                            onClick={() => {
                              let strategyData = {};
                              try { strategyData = JSON.parse(strategyJson); } catch { /* ignore */ }
                              regenerateChapterMutation.mutate({
                                proposalId,
                                chapterId: chapter.id,
                                chapterType: chapter.chapterType as any,
                                clientId: proposal.clientId || undefined,
                                strategyData,
                              });
                            }}
                          >
                            {regenerateChapterMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Regenerate
                          </Button>
                          <Button size="sm" variant="ghost" className="gap-1" onClick={() => { navigator.clipboard.writeText(chapter.script); toast.success("Script copied"); }}>
                            <Copy className="w-3 h-3" /> Copy
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wand2 className="w-10 h-10 text-violet-400 mb-3" />
            <h3 className="font-semibold mb-1">No Scripts Yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Click "Generate AI Scripts" above to create personalized chapter scripts based on your client's data.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


function VideoPreview({ proposalId }: { proposalId: number }) {
  const proposalQuery = trpc.videoProposal.getById.useQuery({ id: proposalId });
  const [selectedAvatarId, setSelectedAvatarId] = useState("");
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [pollingEnabled, setPollingEnabled] = useState(false);

  const avatarsQuery = trpc.videoProposal.listAvatars.useQuery(undefined, { retry: 1 });
  const voicesQuery = trpc.videoProposal.listVoices.useQuery(undefined, { retry: 1 });
  const quotaQuery = trpc.videoProposal.getQuota.useQuery(undefined, { retry: 1 });

  const statusQuery = trpc.videoProposal.checkVideoStatus.useQuery(
    { proposalId },
    { enabled: pollingEnabled, refetchInterval: pollingEnabled ? 5000 : false }
  );

  const updateMutation = trpc.videoProposal.update.useMutation({
    onSuccess: () => { toast.success("Settings saved"); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });
  const generateVideoMutation = trpc.videoProposal.generateVideo.useMutation({
    onSuccess: () => { toast.success("Video generation started! This may take 5-15 minutes."); setPollingEnabled(true); proposalQuery.refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const proposal = proposalQuery.data;

  useEffect(() => {
    if (proposal?.avatarId) setSelectedAvatarId(proposal.avatarId);
    if (proposal?.voiceId) setSelectedVoiceId(proposal.voiceId);
    if (proposal?.status === "processing" || proposal?.status === "generating_video") setPollingEnabled(true);
  }, [proposal]);

  useEffect(() => {
    if (statusQuery.data?.status === "completed" || statusQuery.data?.status === "failed") {
      setPollingEnabled(false);
      proposalQuery.refetch();
    }
  }, [statusQuery.data]);

  if (!proposal) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const avatars = avatarsQuery.data || [];
  const voices = voicesQuery.data || [];
  const quota = quotaQuery.data;
  const chapters = proposal.chapters || [];
  const isProcessing = proposal.status === "processing" || proposal.status === "generating_video";
  const isCompleted = proposal.status === "completed" && proposal.videoUrl;

  return (
    <div className="space-y-6">
      {/* Completed Video */}
      {isCompleted && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <h2 className="text-xl font-semibold">Video Ready!</h2>
            </div>
            <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4">
              <video
                src={proposal.videoUrl}
                controls
                className="w-full h-full"
                poster={proposal.thumbnailUrl || undefined}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button className="gap-2" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/video/${proposal.shareToken}`); toast.success("Share link copied!"); }}>
                <Share2 className="w-4 h-4" /> Copy Share Link
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => window.open(proposal.videoUrl, "_blank")}>
                <ExternalLink className="w-4 h-4" /> Open in New Tab
              </Button>
              {proposal.totalDuration && (
                <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> {Math.round(proposal.totalDuration / 60)}m {proposal.totalDuration % 60}s</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-violet-500/30 bg-violet-500/5">
          <CardContent className="flex items-center gap-4 py-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            </div>
            <div>
              <h3 className="font-semibold">Video is being generated...</h3>
              <p className="text-sm text-muted-foreground">This typically takes 5-15 minutes. You can leave this page and come back.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Avatar & Voice Selection */}
      {!isCompleted && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-violet-400" /> Select Avatar</CardTitle>
              <CardDescription>Choose the AI presenter for your video</CardDescription>
            </CardHeader>
            <CardContent>
              {avatarsQuery.isError ? (
                <div className="text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  HeyGen API not available. Please configure your API key in Settings → Secrets.
                </div>
              ) : avatars.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                  {avatars.slice(0, 18).map(avatar => (
                    <div
                      key={avatar.avatar_id}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${selectedAvatarId === avatar.avatar_id ? "border-violet-500 ring-2 ring-violet-500/30" : "border-transparent hover:border-muted-foreground/30"}`}
                      onClick={() => {
                        setSelectedAvatarId(avatar.avatar_id);
                        updateMutation.mutate({ proposalId, avatarId: avatar.avatar_id });
                      }}
                    >
                      <img src={avatar.preview_image_url} alt={avatar.avatar_name} className="w-full aspect-square object-cover" />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                        <p className="text-[10px] text-white truncate">{avatar.avatar_name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading avatars...
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Mic className="w-4 h-4 text-violet-400" /> Select Voice</CardTitle>
              <CardDescription>Choose the voice for the AI presenter</CardDescription>
            </CardHeader>
            <CardContent>
              {voicesQuery.isError ? (
                <div className="text-sm text-amber-400 bg-amber-500/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  HeyGen API not available.
                </div>
              ) : voices.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {voices.filter(v => v.language?.startsWith("en")).slice(0, 20).map(voice => (
                    <div
                      key={voice.voice_id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${selectedVoiceId === voice.voice_id ? "border-violet-500 bg-violet-500/10" : "border-transparent hover:bg-muted/50"}`}
                      onClick={() => {
                        setSelectedVoiceId(voice.voice_id);
                        updateMutation.mutate({ proposalId, voiceId: voice.voice_id });
                      }}
                    >
                      <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{voice.name}</p>
                        <p className="text-xs text-muted-foreground">{voice.gender} · {voice.language}</p>
                      </div>
                      {voice.preview_audio && (
                        <Button size="sm" variant="ghost" className="shrink-0" onClick={(e) => { e.stopPropagation(); new Audio(voice.preview_audio).play(); }}>
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading voices...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Script Preview */}
      {chapters.length > 0 && !isCompleted && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Script Preview ({chapters.length} chapters)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chapters.map((ch, idx) => {
                const info = CHAPTER_TYPES.find(ct => ct.value === ch.chapterType) || CHAPTER_TYPES[0];
                const Icon = info.icon;
                return (
                  <div key={ch.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className={`w-6 h-6 rounded ${info.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">Ch. {idx + 1}</span>
                        <span className="text-sm font-medium">{ch.title}</span>
                        <Badge variant="outline" className="text-[10px]">~{ch.durationEstimate}s</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{ch.script}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate Button */}
      {!isCompleted && !isProcessing && chapters.length > 0 && (
        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={() => generateVideoMutation.mutate({ proposalId })}
            disabled={generateVideoMutation.isPending || !selectedAvatarId || !selectedVoiceId}
            className="gap-2"
          >
            {generateVideoMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
            Generate Video with HeyGen
          </Button>
          {(!selectedAvatarId || !selectedVoiceId) && (
            <span className="text-sm text-amber-400">Please select an avatar and voice first</span>
          )}
          {quota && <Badge variant="outline">Credits remaining: {quota.remaining_quota}</Badge>}
        </div>
      )}
    </div>
  );
}


function EngagementAnalytics({ proposalId }: { proposalId: number }) {
  const proposalQuery = trpc.videoProposal.getById.useQuery({ id: proposalId });
  const proposal = proposalQuery.data;

  if (!proposal) return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const engagement = proposal.engagement || { totalViews: 0, uniqueViewers: 0, avgWatchPercent: 0, completionRate: 0, chapterHeatmap: [] };
  const chapters = proposal.chapters || [];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Views", value: engagement.totalViews, icon: Eye, color: "text-blue-400" },
          { label: "Unique Viewers", value: engagement.uniqueViewers, icon: Users, color: "text-emerald-400" },
          { label: "Avg Watch %", value: `${engagement.avgWatchPercent}%`, icon: BarChart3, color: "text-amber-400" },
          { label: "Completion Rate", value: `${engagement.completionRate}%`, icon: CheckCircle2, color: "text-violet-400" },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chapter Heatmap */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Chapter Engagement Heatmap</CardTitle>
          <CardDescription>See which chapters get the most attention and replays</CardDescription>
        </CardHeader>
        <CardContent>
          {engagement.chapterHeatmap.length > 0 ? (
            <div className="space-y-3">
              {chapters.map((ch, idx) => {
                const heatData = engagement.chapterHeatmap.find(h => h.chapterIndex === idx);
                const views = heatData?.views || 0;
                const replays = heatData?.replays || 0;
                const maxViews = Math.max(...engagement.chapterHeatmap.map(h => h.views), 1);
                const intensity = views / maxViews;

                return (
                  <div key={ch.id} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-12 shrink-0">Ch. {idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{ch.title}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span><Eye className="w-3 h-3 inline mr-1" />{views}</span>
                          <span><RefreshCw className="w-3 h-3 inline mr-1" />{replays}</span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(intensity * 100, 5)}%`,
                            background: `linear-gradient(90deg, rgb(139, 92, 246, ${0.3 + intensity * 0.7}), rgb(236, 72, 153, ${0.3 + intensity * 0.7}))`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Eye className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No engagement data yet. Share the video to start tracking.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Link */}
      {proposal.status === "completed" && proposal.shareToken && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-violet-400" />
              <div className="flex-1">
                <p className="text-sm font-medium">Client Share Link</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{window.location.origin}/video/{proposal.shareToken}</p>
              </div>
              <Button size="sm" variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/video/${proposal.shareToken}`); toast.success("Copied!"); }}>
                <Copy className="w-3 h-3" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
