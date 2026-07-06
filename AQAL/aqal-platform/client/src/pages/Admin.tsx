import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AdminSkeleton } from "@/components/ui/loading-skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Users, FileText, Tag, Shield, Search } from "lucide-react";
import BusinessHealth from "@/components/BusinessHealth";

export default function Admin() {
  const { user } = useAuth();
  const [promoForm, setPromoForm] = useState({
    code: "",
    influencerName: "",
    influencerEmail: "",
    discountPercent: 15,
    commissionPercent: 10,
    maxUses: 0,
  });

  // Queries
  const promoCodes = trpc.promo.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const stats = trpc.admin.stats.useQuery(undefined, { enabled: user?.role === "admin" });
  const users = trpc.admin.users.useQuery(undefined, { enabled: user?.role === "admin" });
  const assessments = trpc.admin.assessments.useQuery(undefined, { enabled: user?.role === "admin" });
  const evidenceList = trpc.admin.evidence.useQuery(undefined, { enabled: user?.role === "admin" });

  // Mutations
  const reviewEvidence = trpc.admin.reviewEvidence.useMutation({
    onSuccess: () => {
      toast.success("Evidence status updated!");
      evidenceList.refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const createPromo = trpc.promo.create.useMutation({
    onSuccess: () => {
      toast.success("Promo code created!");
      promoCodes.refetch();
      setPromoForm({ code: "", influencerName: "", influencerEmail: "", discountPercent: 15, commissionPercent: 10, maxUses: 0 });
    },
    onError: (e) => toast.error(e.message),
  });
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => { toast.success("User role updated!"); users.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const updateTier = trpc.admin.updateUserTier.useMutation({
    onSuccess: () => { toast.success("User tier updated!"); users.refetch(); stats.refetch(); },
    onError: (e) => toast.error(e.message),
  });
  const togglePromo = trpc.admin.togglePromo.useMutation({
    onSuccess: () => { toast.success("Promo code toggled!"); promoCodes.refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const dataLoading = stats.isLoading || users.isLoading || assessments.isLoading || evidenceList.isLoading;

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="glass-card p-8 text-center rounded-[var(--radius-container)]">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Admin access required.</p>
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return <AdminSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground" style={{ fontFamily: "Cormorant Garamond, serif" }}>
              AQAL Command Center
            </h1>
            <p className="text-muted-foreground mt-1">Platform administration & analytics</p>
          </div>
          <a href="/" className="text-primary hover:text-accent transition-colors">
            ← Back to Site
          </a>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: stats.data?.totalUsers ?? "—", icon: "👥" },
            { label: "Assessments", value: stats.data?.totalAssessments ?? "—", icon: "📊" },
            { label: "Active Members", value: stats.data?.activeMembers ?? "—", icon: "⭐" },
            { label: "Revenue (Est.)", value: stats.data?.estimatedRevenue ? `$${stats.data.estimatedRevenue.toLocaleString()}` : "—", icon: "💰" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{stat.icon}</span>
                <div>
                  <p className="text-muted-foreground text-sm">{stat.label}</p>
                   <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="health" className="space-y-4">
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="health" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Business Health</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Users</TabsTrigger>
            <TabsTrigger value="assessments" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Assessments</TabsTrigger>
            <TabsTrigger value="promos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Promo Codes</TabsTrigger>
            <TabsTrigger value="evidence" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Evidence Review</TabsTrigger>
            <TabsTrigger value="corpus" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Corpus Search</TabsTrigger>
          </TabsList>

          {/* Business Health Tab (Stage 6) */}
          <TabsContent value="health">
            <div className="glass-card p-6">
              <BusinessHealth />
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Registered Users</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tier</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Joined</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.data?.map((u: any) => (
                      <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white">{u.name || "—"}</td>
                        <td className="py-3 px-4 text-white/70">{u.email || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            u.membershipTier === "platinum" ? "bg-accent/20 text-accent" :
                            u.membershipTier === "gold" ? "bg-yellow-500/20 text-yellow-400" :
                            u.membershipTier === "silver" ? "bg-gray-400/20 text-gray-300" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {u.membershipTier || "free"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/70">{u.role}</td>
                        <td className="py-3 px-4 text-white/50">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1 flex-wrap">
                            <select
                              className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                              value={u.role}
                              onChange={(e) => updateRole.mutate({ userId: u.id, role: e.target.value as "user" | "admin" })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                            <select
                              className="bg-secondary border border-border rounded px-2 py-1 text-xs text-foreground"
                              value={u.membershipTier || "free"}
                              onChange={(e) => updateTier.mutate({ userId: u.id, tier: e.target.value as any })}
                            >
                              <option value="free">Free</option>
                              <option value="silver">Silver</option>
                              <option value="gold">Gold</option>
                              <option value="platinum">Platinum</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!users.data?.length && (
                      <tr><td colSpan={6}><EmptyState icon={Users} title="No users yet" description="Users will appear here once they sign up and complete their assessment." /></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-white mb-4">Assessment Queue</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-white/50 font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">User</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Questions</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Rarity</th>
                      <th className="text-left py-3 px-4 text-white/50 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.data?.map((a: any) => (
                      <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-white font-mono">#{a.id}</td>
                        <td className="py-3 px-4 text-white/70">{a.userName || `User #${a.userId}`}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            a.status === "complete" ? "bg-green-500/20 text-green-400" :
                            a.status === "processing" ? "bg-blue-500/20 text-blue-400" :
                            a.status === "failed" ? "bg-red-500/20 text-red-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {a.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-white/70">{a.completedQuestions}/{a.totalQuestions}</td>
                        <td className="py-3 px-4 text-accent font-bold">
                          {a.compositeRarity ? `1 in ${a.compositeRarity.toLocaleString()}` : "—"}
                        </td>
                        <td className="py-3 px-4 text-white/50">{new Date(a.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {!assessments.data?.length && (
                      <tr><td colSpan={6}><EmptyState icon={FileText} title="No assessments yet" description="Completed assessments will appear here for review." /></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promos">
            <div className="space-y-6">
              {/* Create Promo Form */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Create Influencer Promo Code</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Code (e.g., ALEX20)"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Input
                    placeholder="Influencer Name"
                    value={promoForm.influencerName}
                    onChange={(e) => setPromoForm(f => ({ ...f, influencerName: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Input
                    placeholder="Influencer Email"
                    value={promoForm.influencerEmail}
                    onChange={(e) => setPromoForm(f => ({ ...f, influencerEmail: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-white/50 text-sm whitespace-nowrap">Discount %</label>
                    <Input
                      type="number"
                      value={promoForm.discountPercent}
                      onChange={(e) => setPromoForm(f => ({ ...f, discountPercent: Number(e.target.value) }))}
                      className="bg-white/5 border-white/10 text-white w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-white/50 text-sm whitespace-nowrap">Commission %</label>
                    <Input
                      type="number"
                      value={promoForm.commissionPercent}
                      onChange={(e) => setPromoForm(f => ({ ...f, commissionPercent: Number(e.target.value) }))}
                      className="bg-white/5 border-white/10 text-white w-20"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-white/50 text-sm whitespace-nowrap">Max Uses</label>
                    <Input
                      type="number"
                      value={promoForm.maxUses}
                      onChange={(e) => setPromoForm(f => ({ ...f, maxUses: Number(e.target.value) }))}
                      className="bg-white/5 border-white/10 text-white w-20"
                      placeholder="0 = unlimited"
                    />
                  </div>
                </div>
                <Button
                  className="mt-4 bg-primary hover:bg-accent text-primary-foreground"
                  onClick={() => createPromo.mutate({
                    code: promoForm.code,
                    influencerName: promoForm.influencerName,
                    influencerEmail: promoForm.influencerEmail || undefined,
                    discountPercent: promoForm.discountPercent,
                    commissionPercent: promoForm.commissionPercent,
                    maxUses: promoForm.maxUses || undefined,
                  })}
                  disabled={!promoForm.code || !promoForm.influencerName || createPromo.isPending}
                >
                  {createPromo.isPending ? "Creating..." : "Create Promo Code"}
                </Button>
              </div>

              {/* Existing Promo Codes */}
              <div className="glass-card p-6">
                <h2 className="text-xl font-bold text-white mb-4">Active Promo Codes</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Code</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Influencer</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Discount</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Commission</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Uses</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Status</th>
                        <th className="text-left py-3 px-4 text-white/50 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {promoCodes.data?.map((p: any) => (
                        <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 text-accent font-mono font-bold">{p.code}</td>
                          <td className="py-3 px-4 text-white">{p.influencerName}</td>
                          <td className="py-3 px-4 text-white/70">{p.discountPercent}%</td>
                          <td className="py-3 px-4 text-accent">{p.commissionPercent}%</td>
                          <td className="py-3 px-4 text-white/70">
                            {p.usageCount}{p.maxUses ? `/${p.maxUses}` : ""}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${p.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {p.isActive ? "Active" : "Disabled"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              className={`h-7 px-2 text-xs ${p.isActive ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-green-400 hover:text-green-300 hover:bg-green-500/10"}`}
                              onClick={() => togglePromo.mutate({ promoId: p.id, isActive: !p.isActive })}
                            >
                              {p.isActive ? "Disable" : "Enable"}
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!promoCodes.data?.length && (
                        <tr><td colSpan={7}><EmptyState icon={Tag} title="No promo codes yet" description="Create your first promo code above to start tracking referrals." /></td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Evidence Review Tab */}
          <TabsContent value="evidence">
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Evidence Review Queue</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">ID</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">File</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Description</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evidenceList.data?.map((ev: any) => (
                      <tr key={ev.id} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 text-foreground font-mono">#{ev.id}</td>
                        <td className="py-3 px-4">
                          <a href={ev.fileUrl} target="_blank" rel="noopener" className="text-primary hover:text-accent underline">
                            {ev.fileName || "View File"}
                          </a>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{ev.fileType || "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{ev.description || "—"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            ev.status === "accepted" ? "bg-green-500/20 text-green-400" :
                            ev.status === "rejected" ? "bg-red-500/20 text-red-400" :
                            ev.status === "reviewed" ? "bg-blue-500/20 text-blue-400" :
                            "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground/70">{new Date(ev.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-green-400 hover:text-green-300 hover:bg-green-500/10 h-7 px-2 text-xs"
                              onClick={() => reviewEvidence.mutate({ evidenceId: ev.id, status: "accepted" })}
                              disabled={ev.status === "accepted"}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 px-2 text-xs"
                              onClick={() => reviewEvidence.mutate({ evidenceId: ev.id, status: "rejected" })}
                              disabled={ev.status === "rejected"}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!evidenceList.data?.length && (
                      <tr><td colSpan={7}><EmptyState icon={Shield} title="No evidence submissions yet" description="Evidence uploads from users will appear here for review." /></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Corpus Search Tab */}
          <TabsContent value="corpus">
            <CorpusSearchWidget />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================================
// CORPUS SEARCH WIDGET — Admin-only semantic search over Sam's corpus
// ============================================================
function CorpusSearchWidget() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const searchQuery = trpc.corpus.search.useQuery(
    { query: searchTerm, topK: 10 },
    { enabled: !!searchTerm, retry: false }
  );
  const statsQuery = trpc.corpus.stats.useQuery(undefined, { retry: false });

  const results = (searchQuery.data?.results ?? []).map((r: any) => ({ text: r.text, source: r.source, score: r.score }));

  const handleSearch = () => {
    if (!query.trim()) return;
    setSearchTerm(query.trim());
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Search className="w-5 h-5 text-primary" />
          Corpus Semantic Search
        </h2>
        {statsQuery.data && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {statsQuery.data.totalChunks.toLocaleString()} chunks · {statsQuery.data.vocabularySize.toLocaleString()} vocabulary
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Search across Sam's entire corpus (books, transcripts, journal entries) using semantic similarity.
      </p>

      <div className="flex gap-2 mb-6">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the corpus… e.g. 'integral development stages'"
          className="flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={searchQuery.isLoading || !query.trim()}>
          {searchQuery.isLoading ? "Searching…" : "Search"}
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((r, i) => (
            <div key={i} className="bg-secondary border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-muted-foreground truncate max-w-[70%]">{r.source}</span>
                <span className="font-mono text-[10px] text-accent">{(r.score * 100).toFixed(1)}% match</span>
              </div>
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && !searchQuery.isLoading && searchTerm && searchQuery.isSuccess && (
        <EmptyState icon={Search} title="No results found" description="Try different search terms or broader concepts." />
      )}
    </div>
  );
}
