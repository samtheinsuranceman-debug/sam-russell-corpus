// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Streamdown } from "@/components/StreamdownLite";
import {
  Heart,
  FileText,
  Users,
  Gift,
  Shield,
  Scroll,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Crown,
  Star,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Baby,
  Home,
  DollarSign,
  Feather,
} from "lucide-react";


interface AssetDistribution {
  beneficiaryName: string;
  relationship: string;
  assetType: string;
  assetDescription: string;
  estimatedValue?: number;
  percentage?: number;
  conditions?: string;
}

interface GuardianDesignation {
  childName: string;
  childAge: number;
  primaryGuardian: string;
  primaryGuardianRelation: string;
  alternateGuardian?: string;
  alternateGuardianRelation?: string;
  specialInstructions?: string;
}

interface SpecialBequest {
  recipientName: string;
  relationship: string;
  item: string;
  type: "heirloom" | "charitable" | "conditional" | "memorial" | "educational";
  conditions?: string;
  emotionalNote?: string;
}


const STEPS = [
  { id: 1, title: "Select Client", icon: Users, description: "Choose whose legacy to write" },
  { id: 2, title: "Family Review", icon: Heart, description: "Review family & estate data" },
  { id: 3, title: "Personal Letter", icon: Feather, description: "Your words from the heart" },
  { id: 4, title: "Asset Distribution", icon: DollarSign, description: "Who receives what" },
  { id: 5, title: "Guardians", icon: Shield, description: "Protect the children" },
  { id: 6, title: "Special Bequests", icon: Gift, description: "Heirlooms & gifts" },
  { id: 7, title: "Final Wishes", icon: Star, description: "Last messages & preferences" },
  { id: 8, title: "Generate", icon: Sparkles, description: "AI creates your legacy" },
];

const TONE_OPTIONS = [
  { value: "heartfelt", label: "Heartfelt", emoji: "💕", description: "Warm, emotional, deeply personal — the kind of letter that makes families weep with gratitude" },
  { value: "formal", label: "Formal", emoji: "⚖️", description: "Dignified, precise, authoritative — reads like a document from a top estate attorney" },
  { value: "spiritual", label: "Spiritual", emoji: "✨", description: "Faith-filled, reverent, eternal — references spiritual bonds that transcend this life" },
  { value: "practical", label: "Practical", emoji: "📋", description: "Clear, organized, actionable — every instruction is unambiguous and easy to follow" },
];

const ASSET_TYPES = [
  { value: "real_estate", label: "Real Estate" },
  { value: "financial", label: "Financial Accounts" },
  { value: "personal", label: "Personal Property" },
  { value: "business", label: "Business Interest" },
  { value: "insurance", label: "Life Insurance" },
  { value: "retirement", label: "Retirement Account" },
];

const BEQUEST_TYPES = [
  { value: "heirloom", label: "Family Heirloom" },
  { value: "charitable", label: "Charitable Gift" },
  { value: "conditional", label: "Conditional Gift" },
  { value: "memorial", label: "Memorial Gift" },
  { value: "educational", label: "Education Fund" },
];


export default function WillWriter() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [tone, setTone] = useState<"formal" | "heartfelt" | "spiritual" | "practical">("heartfelt");
  const [personalLetterPrompt, setPersonalLetterPrompt] = useState("");
  const [executorName, setExecutorName] = useState("");
  const [executorRelation, setExecutorRelation] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [finalWishes, setFinalWishes] = useState("");
  const [assets, setAssets] = useState<AssetDistribution[]>([]);
  const [guardians, setGuardians] = useState<GuardianDesignation[]>([]);
  const [bequests, setBequests] = useState<SpecialBequest[]>([]);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [showDrafts, setShowDrafts] = useState(false);

  const clientsQuery = trpc.clients.list.useQuery();
  const familyContext = trpc.willWriter.getFamilyContext.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const draftsQuery = trpc.willWriter.listDrafts.useQuery();

  const generateMutation = trpc.willWriter.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedDoc(data.generatedDocument);
      toast.success(`Will generated! +${data.xpEarned} XP, +${data.coinsEarned} RC`);
      setStep(8);
    },
    onError: (err) => toast.error(err.message),
  });
  const deleteDraftMutation = trpc.willWriter.deleteDraft.useMutation({
    onSuccess: () => { draftsQuery.refetch(); toast.success("Draft deleted"); },
  });

  const selectedClient = useMemo(() => {
    if (!selectedClientId || !clientsQuery.data) return null;
    return (clientsQuery.data as any[]).find((c: any) => c.id === selectedClientId);
  }, [selectedClientId, clientsQuery.data]);

  const fc = familyContext.data;

  const addAsset = () => setAssets([...assets, { beneficiaryName: "", relationship: "", assetType: "financial", assetDescription: "", }]);
  const removeAsset = (i: number) => setAssets(assets.filter((_, idx) => idx !== i));
  const updateAsset = (i: number, field: keyof AssetDistribution, value: any) => {
    const copy = [...assets];
    (copy[i] as any)[field] = value;
    setAssets(copy);
  };

  const addGuardian = () => setGuardians([...guardians, { childName: "", childAge: 0, primaryGuardian: "", primaryGuardianRelation: "" }]);
  const removeGuardian = (i: number) => setGuardians(guardians.filter((_, idx) => idx !== i));
  const updateGuardian = (i: number, field: keyof GuardianDesignation, value: any) => {
    const copy = [...guardians];
    (copy[i] as any)[field] = value;
    setGuardians(copy);
  };

  const addBequest = () => setBequests([...bequests, { recipientName: "", relationship: "", item: "", type: "heirloom" }]);
  const removeBequest = (i: number) => setBequests(bequests.filter((_, idx) => idx !== i));
  const updateBequest = (i: number, field: keyof SpecialBequest, value: any) => {
    const copy = [...bequests];
    (copy[i] as any)[field] = value;
    setBequests(copy);
  };

  const handleGenerate = () => {
    if (!selectedClientId) return;
    generateMutation.mutate({
      clientId: selectedClientId,
      tone,
      personalLetterPrompt: personalLetterPrompt || undefined,
      executorName: executorName || undefined,
      executorRelation: executorRelation || undefined,
      specialInstructions: specialInstructions || undefined,
      assetDistribution: assets.filter(a => a.beneficiaryName && a.assetDescription),
      guardianDesignations: guardians.filter(g => g.childName && g.primaryGuardian),
      specialBequests: bequests.filter(b => b.recipientName && b.item),
      finalWishes: finalWishes || undefined,
    });
  };

  const canProceed = () => {
    switch (step) {
      case 1: return !!selectedClientId;
      case 2: return !!fc;
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1: return renderClientSelect();
      case 2: return renderFamilyReview();
      case 3: return renderPersonalLetter();
      case 4: return renderAssetDistribution();
      case 5: return renderGuardians();
      case 6: return renderBequests();
      case 7: return renderFinalWishes();
      case 8: return renderGenerated();
      default: return null;
    }
  };

  const renderClientSelect = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-4">
          <Scroll className="w-10 h-10 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Begin the Legacy</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Select a client to create their last will and testament. We'll pull their family data, 
          financial information, and property records to craft a deeply personal document.
        </p>
      </div>

      <div className="grid gap-3 max-w-2xl mx-auto">
        {clientsQuery.isLoading && <p className="text-center text-muted-foreground">Loading clients...</p>}
        {(clientsQuery.data as any[] | undefined)?.map((client: any) => (
          <Card
            key={client.id}
            className={`cursor-pointer transition-all hover:border-amber-500/50 ${selectedClientId === client.id ? "border-amber-500 bg-amber-500/5" : "border-border/50"}`}
            onClick={() => setSelectedClientId(client.id)}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">{client.name || `${client.firstName} ${client.lastName}`}</p>
                <p className="text-sm text-muted-foreground">
                  {client.state && `${client.state} · `}
                  {client.spouseName && `Spouse: ${client.spouseName} · `}
                  Net Worth: ${Number(client.totalNetWorth ?? 0).toLocaleString()}
                </p>
              </div>
              {selectedClientId === client.id && <CheckCircle2 className="w-5 h-5 text-amber-400" />}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Previous Drafts */}
      {draftsQuery.data && draftsQuery.data.length > 0 && (
        <div className="max-w-2xl mx-auto mt-8">
          <button onClick={() => setShowDrafts(!showDrafts)} className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 mb-3">
            <BookOpen className="w-4 h-4" />
            {showDrafts ? "Hide" : "Show"} Previous Drafts ({draftsQuery.data.length})
          </button>
          {showDrafts && (
            <div className="space-y-2">
              {draftsQuery.data.map((draft) => (
                <Card key={draft.id} className="border-border/30">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{draft.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {draft.tone} · {draft.status} · {new Date(draft.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{draft.status}</Badge>
                      <Button variant="ghost" size="sm" onClick={() => deleteDraftMutation.mutate({ id: draft.id })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderFamilyReview = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Family & Estate Review</h2>
        <p className="text-muted-foreground">Review the data we've gathered. This information shapes every word of the will.</p>
      </div>

      {familyContext.isLoading && <p className="text-center text-muted-foreground">Loading family data...</p>}
      {fc && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Family */}
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" /> Family</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Client:</span> <span className="text-white font-medium">{fc.clientName}</span></p>
              {fc.spouseName && <p><span className="text-muted-foreground">Spouse:</span> <span className="text-white font-medium">{fc.spouseName}</span></p>}
              {fc.children.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Children:</p>
                  {fc.children.map((c, i) => (
                    <p key={i} className="ml-3 text-white">• {c.name}, age {c.age}</p>
                  ))}
                </div>
              )}
              {fc.grandchildren.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-1">Grandchildren:</p>
                  {fc.grandchildren.map((g, i) => (
                    <p key={i} className="ml-3 text-white">• {g.name}, age {g.age} (child of {g.parentName})</p>
                  ))}
                </div>
              )}
              {fc.children.length === 0 && <p className="text-muted-foreground italic">No children on record</p>}
            </CardContent>
          </Card>

          {/* Estate Value */}
          <Card className="border-green-500/20 bg-green-500/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-400" /> Estate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Total Estate:</span> <span className="text-green-400 font-bold text-lg">${fc.totalEstateValue.toLocaleString()}</span></p>
              <Separator className="my-2" />
              <p><span className="text-muted-foreground">IRA:</span> <span className="text-white">${fc.retirementAccounts.ira.toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Roth IRA:</span> <span className="text-white">${fc.retirementAccounts.roth.toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">401(k):</span> <span className="text-white">${fc.retirementAccounts.k401.toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Life Insurance DB:</span> <span className="text-white">${fc.lifeInsurance.deathBenefit.toLocaleString()}</span></p>
              <p><span className="text-muted-foreground">Life Insurance CV:</span> <span className="text-white">${fc.lifeInsurance.cashValue.toLocaleString()}</span></p>
            </CardContent>
          </Card>

          {/* Properties */}
          {fc.properties.length > 0 && (
            <Card className="border-blue-500/20 bg-blue-500/5 md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2"><Home className="w-5 h-5 text-blue-400" /> Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {fc.properties.map((p, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded bg-background/50">
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.type}</p>
                      </div>
                      <p className="text-sm text-blue-400 font-medium">${p.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tone Selection */}
          <Card className="border-purple-500/20 bg-purple-500/5 md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2"><Feather className="w-5 h-5 text-purple-400" /> Choose the Voice</CardTitle>
              <CardDescription>How should this will feel when read aloud at the kitchen table?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {TONE_OPTIONS.map((t) => (
                  <div
                    key={t.value}
                    onClick={() => setTone(t.value as any)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-purple-500/50 ${tone === t.value ? "border-purple-500 bg-purple-500/10" : "border-border/30"}`}
                  >
                    <p className="font-semibold text-white mb-1">{t.emoji} {t.label}</p>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderPersonalLetter = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 mb-4">
          <Heart className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">A Letter From the Heart</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          This is the most important part. What would {fc?.clientName ?? "the client"} want to say to 
          {fc?.spouseName ? ` ${fc.spouseName},` : ""} {fc?.children.length ? `their children,` : ""} and 
          everyone they love? Give the AI guidance, and it will write something unforgettable.
        </p>
      </div>

      <Card className="border-red-500/20">
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              What themes, memories, or messages should the letter include?
            </label>
            <Textarea
              value={personalLetterPrompt}
              onChange={(e) => setPersonalLetterPrompt(e.target.value)}
              placeholder={`Example: "Tell my wife how much our 30 years together meant to me. Tell my children I'm proud of who they've become. Remind them to take care of each other. Mention our family vacations at the lake house — those were the best days of my life."`}
              rows={6}
              className="bg-background/50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              The more detail you provide, the more personal and powerful the letter will be. 
              Leave blank for the AI to write based on family data alone.
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Executor Name</label>
              <Input
                value={executorName}
                onChange={(e) => setExecutorName(e.target.value)}
                placeholder="Who will execute the will?"
                className="bg-background/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-2 block">Executor Relationship</label>
              <Input
                value={executorRelation}
                onChange={(e) => setExecutorRelation(e.target.value)}
                placeholder="e.g., Eldest son, Attorney, Spouse"
                className="bg-background/50"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-white mb-2 block">Special Instructions for the AI</label>
            <Textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requests? e.g., 'Include a Bible verse', 'Mention the family business', 'Reference our charity work'"
              rows={3}
              className="bg-background/50"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAssetDistribution = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Asset Distribution</h2>
        <p className="text-muted-foreground">Who receives what? Add specific distributions or let the AI suggest based on family structure.</p>
      </div>

      {assets.map((asset, i) => (
        <Card key={i} className="border-border/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Badge variant="outline">Distribution #{i + 1}</Badge>
              <Button variant="ghost" size="sm" onClick={() => removeAsset(i)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Beneficiary name" value={asset.beneficiaryName} onChange={(e) => updateAsset(i, "beneficiaryName", e.target.value)} className="bg-background/50" />
              <Input placeholder="Relationship (e.g., Son, Daughter)" value={asset.relationship} onChange={(e) => updateAsset(i, "relationship", e.target.value)} className="bg-background/50" />
              <Select value={asset.assetType} onValueChange={(v) => updateAsset(i, "assetType", v)}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASSET_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Percentage of estate" value={asset.percentage ?? ""} onChange={(e) => updateAsset(i, "percentage", Number(e.target.value) || undefined)} className="bg-background/50" />
            </div>
            <Input placeholder="Description (e.g., 'Primary residence at 123 Oak St')" value={asset.assetDescription} onChange={(e) => updateAsset(i, "assetDescription", e.target.value)} className="bg-background/50" />
            <Input placeholder="Conditions (optional)" value={asset.conditions ?? ""} onChange={(e) => updateAsset(i, "conditions", e.target.value)} className="bg-background/50" />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addAsset} className="w-full border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
        <Plus className="w-4 h-4 mr-2" /> Add Distribution
      </Button>

      {assets.length === 0 && (
        <p className="text-center text-muted-foreground text-sm italic">
          No specific distributions added. The AI will suggest a fair distribution based on family structure and estate composition.
        </p>
      )}
    </div>
  );

  const renderGuardians = () => {
    const minorChildren = fc?.children.filter(c => c.age < 18) ?? [];
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 mb-4">
            <Baby className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Guardian Designations</h2>
          <p className="text-muted-foreground">
            {minorChildren.length > 0
              ? `${fc?.clientName} has ${minorChildren.length} minor child${minorChildren.length > 1 ? "ren" : ""}. Who will care for them?`
              : "No minor children on record. You can still add guardian designations if needed."}
          </p>
        </div>

        {/* Auto-populate from minor children */}
        {minorChildren.length > 0 && guardians.length === 0 && (
          <Button
            variant="outline"
            onClick={() => setGuardians(minorChildren.map(c => ({
              childName: c.name, childAge: c.age,
              primaryGuardian: "", primaryGuardianRelation: "",
            })))}
            className="w-full border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
          >
            <Users className="w-4 h-4 mr-2" /> Auto-fill from {minorChildren.length} minor child{minorChildren.length > 1 ? "ren" : ""}
          </Button>
        )}

        {guardians.map((g, i) => (
          <Card key={i} className="border-blue-500/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{g.childName || `Child #${i + 1}`}</Badge>
                <Button variant="ghost" size="sm" onClick={() => removeGuardian(i)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="Child's name" value={g.childName} onChange={(e) => updateGuardian(i, "childName", e.target.value)} className="bg-background/50" />
                <Input type="number" placeholder="Child's age" value={g.childAge || ""} onChange={(e) => updateGuardian(i, "childAge", Number(e.target.value))} className="bg-background/50" />
                <Input placeholder="Primary guardian" value={g.primaryGuardian} onChange={(e) => updateGuardian(i, "primaryGuardian", e.target.value)} className="bg-background/50" />
                <Input placeholder="Relationship" value={g.primaryGuardianRelation} onChange={(e) => updateGuardian(i, "primaryGuardianRelation", e.target.value)} className="bg-background/50" />
                <Input placeholder="Alternate guardian (optional)" value={g.alternateGuardian ?? ""} onChange={(e) => updateGuardian(i, "alternateGuardian", e.target.value)} className="bg-background/50" />
                <Input placeholder="Alternate relationship" value={g.alternateGuardianRelation ?? ""} onChange={(e) => updateGuardian(i, "alternateGuardianRelation", e.target.value)} className="bg-background/50" />
              </div>
              <Textarea placeholder="Special instructions for this child's care (optional)" value={g.specialInstructions ?? ""} onChange={(e) => updateGuardian(i, "specialInstructions", e.target.value)} rows={2} className="bg-background/50" />
            </CardContent>
          </Card>
        ))}

        <Button variant="outline" onClick={addGuardian} className="w-full border-dashed border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
          <Plus className="w-4 h-4 mr-2" /> Add Guardian Designation
        </Button>
      </div>
    );
  };

  const renderBequests = () => (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 mb-4">
          <Gift className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Special Bequests</h2>
        <p className="text-muted-foreground">
          The grandmother's ring. The family cabin. The donation to the alma mater. 
          These are the gifts that carry stories.
        </p>
      </div>

      {bequests.map((b, i) => (
        <Card key={i} className="border-amber-500/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{b.item || `Bequest #${i + 1}`}</Badge>
              <Button variant="ghost" size="sm" onClick={() => removeBequest(i)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input placeholder="Recipient name" value={b.recipientName} onChange={(e) => updateBequest(i, "recipientName", e.target.value)} className="bg-background/50" />
              <Input placeholder="Relationship" value={b.relationship} onChange={(e) => updateBequest(i, "relationship", e.target.value)} className="bg-background/50" />
              <Input placeholder="Item or gift description" value={b.item} onChange={(e) => updateBequest(i, "item", e.target.value)} className="bg-background/50" />
              <Select value={b.type} onValueChange={(v) => updateBequest(i, "type", v)}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BEQUEST_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Conditions (optional)" value={b.conditions ?? ""} onChange={(e) => updateBequest(i, "conditions", e.target.value)} className="bg-background/50" />
            <Textarea placeholder="Personal note attached to this gift (optional — this is the emotional part)" value={b.emotionalNote ?? ""} onChange={(e) => updateBequest(i, "emotionalNote", e.target.value)} rows={2} className="bg-background/50" />
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addBequest} className="w-full border-dashed border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
        <Plus className="w-4 h-4 mr-2" /> Add Special Bequest
      </Button>
    </div>
  );

  const renderFinalWishes = () => (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 mb-4">
          <Star className="w-8 h-8 text-purple-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Final Wishes</h2>
        <p className="text-muted-foreground">
          The last words. Funeral preferences, memorial wishes, organ donation, 
          and any final messages to the world.
        </p>
      </div>

      <Card className="border-purple-500/20">
        <CardContent className="p-6">
          <Textarea
            value={finalWishes}
            onChange={(e) => setFinalWishes(e.target.value)}
            placeholder={`Example: "I want to be cremated and have my ashes scattered at Lake Tahoe where we spent every summer. Play 'What a Wonderful World' at the service. Donate my organs. Tell everyone to celebrate, not mourn — I lived a good life."`}
            rows={8}
            className="bg-background/50"
          />
          <p className="text-xs text-muted-foreground mt-3">
            Leave blank and the AI will write thoughtful final wishes based on the client's profile and tone selection.
          </p>
        </CardContent>
      </Card>

      {/* Generate Button Preview */}
      <Card className="border-green-500/20 bg-green-500/5">
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-2">Ready to Generate</h3>
          <p className="text-sm text-muted-foreground mb-4">
            On the next step, our AI will craft a complete, emotionally powerful last will and testament 
            for {fc?.clientName ?? "the client"} using everything you've provided.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline">Tone: {tone}</Badge>
            <Badge variant="outline">{assets.length} distributions</Badge>
            <Badge variant="outline">{guardians.length} guardians</Badge>
            <Badge variant="outline">{bequests.length} bequests</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderGenerated = () => (
    <div className="space-y-6 max-w-4xl mx-auto">
      {generateMutation.isPending && (
        <div className="text-center py-20">
          <Loader2 className="w-12 h-12 text-amber-400 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Crafting the Legacy...</h2>
          <p className="text-muted-foreground">
            The AI is writing a deeply personal will for {fc?.clientName ?? "the client"}. 
            This takes 15-30 seconds.
          </p>
        </div>
      )}

      {generatedDoc && (
        <>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30 mb-4">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Legacy Document Complete</h2>
            <p className="text-muted-foreground">
              Review the document below. It has been saved as a draft and can be edited or regenerated.
            </p>
          </div>

          <Card className="border-amber-500/20">
            <CardContent className="p-8">
              <div className="prose prose-invert max-w-none prose-headings:text-amber-400 prose-strong:text-white prose-p:text-gray-300">
                <Streamdown>{generatedDoc}</Streamdown>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => { setGeneratedDoc(null); setStep(3); }}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Edit & Regenerate
            </Button>
            <Button onClick={() => {
              navigator.clipboard.writeText(generatedDoc);
              toast.success("Document copied to clipboard");
            }} className="bg-amber-600 hover:bg-amber-700">
              <FileText className="w-4 h-4 mr-2" /> Copy to Clipboard
            </Button>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <p className="text-xs text-red-400">
                This is a planning draft — NOT legal advice. Review with a licensed estate planning attorney before execution.
              </p>
            </div>
          </div>
        </>
      )}

      {!generateMutation.isPending && !generatedDoc && (
        <div className="text-center py-12">
          <Button onClick={handleGenerate} size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-6 text-lg">
            <Sparkles className="w-5 h-5 mr-2" /> Generate the Will
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b border-border/30 bg-gradient-to-r from-amber-500/5 via-background to-orange-500/5">
          <div className="container py-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Scroll className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Will Writer</h1>
                <p className="text-sm text-muted-foreground">AI-Powered Legacy Document Generator</p>
              </div>
            </div>

            {/* Step Progress */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isComplete = step > s.id;
                return (
                  <div key={s.id} className="flex items-center">
                    <button
                      onClick={() => s.id <= step && setStep(s.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        isActive ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                        isComplete ? "text-green-400 hover:bg-green-500/10" :
                        "text-muted-foreground"
                      }`}
                    >
                      {isComplete ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{s.title}</span>
                    </button>
                    {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-muted-foreground/30 mx-1 shrink-0" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container py-8">
          {renderStep()}
        </div>

        {/* Navigation */}
        {step < 8 && (
          <div className="border-t border-border/30 bg-background/80 backdrop-blur sticky bottom-0">
            <div className="container py-4 flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {step === 7 ? (
                <Button
                  onClick={handleGenerate}
                  disabled={!selectedClientId || generateMutation.isPending}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
                >
                  {generateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Generate Will
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(Math.min(8, step + 1))}
                  disabled={!canProceed()}
                >
                  Next <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
