// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, Plus, Play, Pause, Trash2, Users, FileText, Clock, Send, BarChart3 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";

const CAMPAIGN_TYPES = [
  { value: "welcome", label: "Welcome Series", desc: "Onboard new clients" },
  { value: "nurture", label: "Lead Nurture", desc: "Warm up prospects" },
  { value: "reengagement", label: "Re-engagement", desc: "Win back inactive clients" },
  { value: "educational", label: "Educational", desc: "Share financial insights" },
  { value: "custom", label: "Custom", desc: "Build your own sequence" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-emerald-500/20 text-emerald-400",
  paused: "bg-amber-500/20 text-amber-400",
  completed: "bg-blue-500/20 text-blue-400",
};

export default function EmailCampaignManager() {
  const utils = trpc.useUtils();
  const campaignsQuery = trpc.emailCampaigns.list.useQuery(undefined, { staleTime: 30_000 });
  const campaigns = campaignsQuery.data ?? [];
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<string>("custom");
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const [showAddTemplate, setShowAddTemplate] = useState(false);
  const [tplName, setTplName] = useState("");
  const [tplSubject, setTplSubject] = useState("");
  const [tplBody, setTplBody] = useState("");
  const [tplDelay, setTplDelay] = useState(0);

  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollClientId, setEnrollClientId] = useState<string>("");

  const templatesQuery = trpc.emailCampaigns.listTemplates.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId, staleTime: 30_000 }
  );
  const templates = templatesQuery.data ?? [];

  const enrollmentsQuery = trpc.emailCampaigns.listEnrollments.useQuery(
    { campaignId: selectedCampaignId! },
    { enabled: !!selectedCampaignId, staleTime: 30_000 }
  );
  const enrollments = enrollmentsQuery.data ?? [];

  const createMut = trpc.emailCampaigns.create.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.list.invalidate();
      setShowCreate(false);
      setNewName(""); setNewDesc(""); setNewType("custom");
      toast.success("Campaign created");
    },
  });

  const updateMut = trpc.emailCampaigns.update.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.list.invalidate();
      toast.success("Campaign updated");
    },
  });

  const deleteMut = trpc.emailCampaigns.delete.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.list.invalidate();
      if (selectedCampaignId) setSelectedCampaignId(null);
      toast.success("Campaign deleted");
    },
  });

  const addTemplateMut = trpc.emailCampaigns.addTemplate.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.listTemplates.invalidate({ campaignId: selectedCampaignId! });
      setShowAddTemplate(false);
      setTplName(""); setTplSubject(""); setTplBody(""); setTplDelay(0);
      toast.success("Email template added");
    },
  });

  const deleteTemplateMut = trpc.emailCampaigns.deleteTemplate.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.listTemplates.invalidate({ campaignId: selectedCampaignId! });
      toast.success("Template removed");
    },
  });

  const enrollMut = trpc.emailCampaigns.enroll.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.listEnrollments.invalidate({ campaignId: selectedCampaignId! });
      setShowEnroll(false);
      setEnrollClientId("");
      toast.success("Client enrolled in campaign");
    },
  });

  const unenrollMut = trpc.emailCampaigns.unenroll.useMutation({
    onSuccess: () => {
      utils.emailCampaigns.listEnrollments.invalidate({ campaignId: selectedCampaignId! });
      toast.success("Client unenrolled");
    },
  });

  const sendNextMut = trpc.emailCampaigns.sendNext.useMutation({
    onSuccess: (data: any) => {
      utils.emailCampaigns.listEnrollments.invalidate({ campaignId: selectedCampaignId! });
      toast.success(`Sent ${data.sent} of ${data.totalEnrollments} emails`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const sendTestMut = trpc.emailCampaigns.sendTest.useMutation({
    onSuccess: (data: any) => {
      if (data.sent) toast.success("Test email sent to your inbox!");
      else toast.error(`Test email failed: ${data.reason}`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-400" /> Email Campaign Manager
            </h1>
            <p className="text-muted-foreground mt-1">
              Create drip campaigns, manage email templates, and enroll clients in automated sequences
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Email Campaign Manager"
              getSections={() => [
                {
                  title: "Email Campaigns Summary",
                  items: [
                    { label: "Total Campaigns", value: campaigns.length.toString() },
                    { label: "Active Campaigns", value: campaigns.filter((c) => c.status === "active").length.toString() },
                    { label: "Selected Campaign", value: selectedCampaign ? selectedCampaign.name : "None" }
                  ]
                }
              ]}
            />
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-1" /> New Campaign</Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Email Campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Campaign Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., New Client Welcome Series" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description..." />
                </div>
                <div>
                  <Label>Campaign Type</Label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label} — {t.desc}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => createMut.mutate({ name: newName, description: newDesc, campaignType: newType as any })} disabled={!newName || createMut.isPending} className="w-full">
                  Create Campaign
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Campaign Analytics */}
        {campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" /> Campaign Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={(() => {
                        const counts: Record<string, number> = {};
                        campaigns.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
                        return Object.entries(counts).map(([name, value]) => ({ name, value }));
                      })()}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                      paddingAngle={3} dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {["#22c55e", "#3b82f6", "#f59e0b", "#6366f1"].map((c, i) => (
                        <Cell key={i} fill={c} />
                      ))}
                    </Pie>
                    <RTooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" /> Campaigns by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={(() => {
                      const counts: Record<string, number> = {};
                      campaigns.forEach((c) => { counts[c.campaignType] = (counts[c.campaignType] || 0) + 1; });
                      return Object.entries(counts).map(([name, count]) => ({ name, count }));
                    })()}
                    margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <RTooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                    <Bar dataKey="count" name="Campaigns" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign List */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Campaigns ({campaigns.length})</p>
            {campaigns.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                  <p className="text-sm text-muted-foreground">No campaigns yet</p>
                </CardContent>
              </Card>
            ) : (
              campaigns.map((c) => (
                <Card
                  key={c.id}
                  className={`cursor-pointer transition-all ${selectedCampaignId === c.id ? "ring-2 ring-blue-500/50 border-blue-500/30" : "hover:border-muted-foreground/30"}`}
                  onClick={() => setSelectedCampaignId(c.id)}
                >
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{c.description || "No description"}</p>
                      </div>
                      <Badge className={`text-[10px] ml-2 ${STATUS_COLORS[c.status] ?? ""}`}>{c.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="capitalize">{c.campaignType}</span>
                      <span>·</span>
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Campaign Detail */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedCampaign ? (
              <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                  <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-medium text-muted-foreground">Select a campaign to manage</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Campaign Header */}
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg font-bold">{selectedCampaign.name}</h2>
                        <p className="text-sm text-muted-foreground">{selectedCampaign.description || "No description"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedCampaign.status === "draft" && (
                          <Button size="sm" onClick={() => updateMut.mutate({ id: selectedCampaign.id, status: "active" })}>
                            <Play className="w-3 h-3 mr-1" /> Activate
                          </Button>
                        )}
                        {selectedCampaign.status === "active" && (
                          <Button size="sm" variant="outline" onClick={() => updateMut.mutate({ id: selectedCampaign.id, status: "paused" })}>
                            <Pause className="w-3 h-3 mr-1" /> Pause
                          </Button>
                        )}
                        {selectedCampaign.status === "paused" && (
                          <Button size="sm" onClick={() => updateMut.mutate({ id: selectedCampaign.id, status: "active" })}>
                            <Play className="w-3 h-3 mr-1" /> Resume
                          </Button>
                        )}
                        {selectedCampaign.status === "active" && templates.length > 0 && enrollments.length > 0 && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => sendNextMut.mutate({ campaignId: selectedCampaign.id })}
                            disabled={sendNextMut.isPending}
                          >
                            <Send className="w-3 h-3 mr-1" /> {sendNextMut.isPending ? "Sending..." : "Send Emails"}
                          </Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => deleteMut.mutate({ id: selectedCampaign.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Email Templates */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Email Sequence ({templates.length} emails)
                      </CardTitle>
                      <Dialog open={showAddTemplate} onOpenChange={setShowAddTemplate}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Add Email</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Add Email to Sequence</DialogTitle></DialogHeader>
                          <div className="space-y-3 mt-2">
                            <div>
                              <Label>Email Name</Label>
                              <Input value={tplName} onChange={(e) => setTplName(e.target.value)} placeholder="e.g., Welcome Email" />
                            </div>
                            <div>
                              <Label>Subject Line</Label>
                              <Input value={tplSubject} onChange={(e) => setTplSubject(e.target.value)} placeholder="e.g., Welcome to Russell Capital Systems™" />
                            </div>
                            <div>
                              <Label>Email Body (HTML or plain text)</Label>
                              <textarea
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[120px]"
                                value={tplBody}
                                onChange={(e) => setTplBody(e.target.value)}
                                placeholder="Dear {{clientName}},\n\nWelcome to Russell Capital Systems™..."
                              />
                            </div>
                            <div>
                              <Label>Send Delay (days after enrollment)</Label>
                              <NumberInput value={tplDelay} onChange={setTplDelay} min={0} />
                            </div>
                            <Button
                              onClick={() => addTemplateMut.mutate({
                                campaignId: selectedCampaignId!, name: tplName, subject: tplSubject,
                                body: tplBody, delayDays: tplDelay, sortOrder: templates.length,
                              })}
                              disabled={!tplName || !tplSubject || !tplBody || addTemplateMut.isPending}
                              className="w-full"
                            >
                              Add to Sequence
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No emails in this campaign yet. Add your first email above.</p>
                    ) : (
                      <div className="space-y-2">
                        {templates.map((t: any, i: number) => (
                          <div key={t.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 group">
                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{t.name}</p>
                              <p className="text-xs text-muted-foreground truncate">Subject: {t.subject}</p>
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              <Clock className="w-3 h-3 mr-1" /> Day {t.delayDays}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              title="Send test email to yourself"
                              onClick={() => sendTestMut.mutate({ templateId: t.id, campaignId: selectedCampaignId! })}
                              disabled={sendTestMut.isPending}
                            >
                              <Send className="w-3 h-3 text-muted-foreground hover:text-blue-400" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100"
                              onClick={() => deleteTemplateMut.mutate({ id: t.id })}
                            >
                              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Enrolled Clients */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4" /> Enrolled Clients ({enrollments.length})
                      </CardTitle>
                      <Dialog open={showEnroll} onOpenChange={setShowEnroll}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline"><Plus className="w-3 h-3 mr-1" /> Enroll Client</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Enroll Client in Campaign</DialogTitle></DialogHeader>
                          <div className="space-y-3 mt-2">
                            <div>
                              <Label>Select Client</Label>
                              <Select value={enrollClientId} onValueChange={setEnrollClientId}>
                                <SelectTrigger><SelectValue placeholder="Choose a client..." /></SelectTrigger>
                                <SelectContent>
                                  {clients.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name} — {c.email}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              onClick={() => {
                                const client = clients.find((c) => c.id === Number(enrollClientId));
                                if (!client) return;
                                enrollMut.mutate({
                                  campaignId: selectedCampaignId!,
                                  clientId: client.id,
                                  clientEmail: client.email ?? "",
                                  clientName: client.name,
                                });
                              }}
                              disabled={!enrollClientId || enrollMut.isPending}
                              className="w-full"
                            >
                              Enroll in Campaign
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {enrollments.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No clients enrolled yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {enrollments.map((e) => (
                          <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 group">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{e.clientName || "Unknown"}</p>
                              <p className="text-xs text-muted-foreground">{e.clientEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                Step {e.currentStep}/{templates.length}
                              </Badge>
                              <Badge className={`text-[10px] ${e.status === "active" ? "bg-emerald-500/20 text-emerald-400" : e.status === "unsubscribed" ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"}`}>
                                {e.status}
                              </Badge>
                              {e.status === "active" && (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                  onClick={() => unenrollMut.mutate({ id: e.id })}
                                >
                                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
