import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Pill, Plus, CheckCircle, XCircle, AlertTriangle, Sparkles,
  Trash2, ChevronDown, ChevronUp, Shield
} from "lucide-react";

const SEVERITY_CONFIG = {
  mild: { color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30", label: "Mild" },
  moderate: { color: "text-orange-400 bg-orange-400/10 border-orange-400/30", label: "Moderate" },
  severe: { color: "text-red-400 bg-red-400/10 border-red-400/30", label: "Severe" },
};

const RISK_CONFIG = {
  low: { color: "text-green-400", label: "Low Risk" },
  moderate: { color: "text-yellow-400", label: "Moderate Risk" },
  high: { color: "text-red-400", label: "High Risk" },
};

export default function MedicationTracker() {
  const { isAuthenticated, loading, user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInteractionChecker, setShowInteractionChecker] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", genericName: "", dosage: "", frequency: "",
    prescribedFor: "", prescribedBy: "", startDate: "", notes: "",
  });

  const { data: medications, refetch } = trpc.medications.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addMed = trpc.medications.add.useMutation({
    onSuccess: () => {
      refetch();
      setShowAddForm(false);
      setForm({ name: "", genericName: "", dosage: "", frequency: "", prescribedFor: "", prescribedBy: "", startDate: "", notes: "" });
      toast.success("Medication added.");
    },
    onError: () => toast.error("Failed to add medication."),
  });

  const removeMed = trpc.medications.remove.useMutation({
    onSuccess: () => { refetch(); toast.success("Medication removed."); },
  });

  const logTaken = trpc.medications.logTaken.useMutation({
    onSuccess: (_, vars) => toast.success(vars.skipped ? "Dose marked as skipped." : "Dose logged as taken."),
  });

  const checkInteractions = trpc.medications.checkInteractions.useMutation({
    onSuccess: (data) => {
      setInteractionResult(data);
      setShowInteractionChecker(true);
    },
    onError: () => toast.error("Interaction check failed. Please try again."),
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-24 flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container py-24 max-w-md text-center">
          <Pill className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Keep a personal medication list and dose log. Interaction analysis is not available in the public wellness edition.</p>
          <a href={getLoginUrl()}><Button className="bg-primary text-primary-foreground">Sign In</Button></a>
        </div>
      </div>
    );
  }

  const activeMeds = medications?.filter(m => m.isActive) || [];

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Pill className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Medication Management</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Medication Tracker</h1>
              <p className="text-muted-foreground text-sm">
                Keep a personal medication list and record doses you report. Doctor Buddy does not tell you to start, stop, change, or dose a medication.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {CLINICAL_TOOLS_ENABLED && user?.role === "admin" && activeMeds.length >= 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground"
                  onClick={() => checkInteractions.mutate({ medications: activeMeds.map(m => m.name) })}
                  disabled={checkInteractions.isPending}
                >
                  {checkInteractions.isPending
                    ? <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 animate-pulse" /> Checking...</span>
                    : <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Check Interactions</span>
                  }
                </Button>
              )}
              <Button
                size="sm"
                className="bg-primary text-primary-foreground"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Medication
              </Button>
            </div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <Card className="border-primary/30 bg-primary/5 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add New Medication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Medication Name *</label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Sertraline"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Generic Name</label>
                  <Input
                    value={form.genericName}
                    onChange={e => setForm(p => ({ ...p, genericName: e.target.value }))}
                    placeholder="e.g. Zoloft"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dosage</label>
                  <Input
                    value={form.dosage}
                    onChange={e => setForm(p => ({ ...p, dosage: e.target.value }))}
                    placeholder="e.g. 50mg"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Frequency</label>
                  <Input
                    value={form.frequency}
                    onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}
                    placeholder="e.g. Once daily"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prescribed For</label>
                  <Input
                    value={form.prescribedFor}
                    onChange={e => setForm(p => ({ ...p, prescribedFor: e.target.value }))}
                    placeholder="e.g. Depression"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Prescribing Physician</label>
                  <Input
                    value={form.prescribedBy}
                    onChange={e => setForm(p => ({ ...p, prescribedBy: e.target.value }))}
                    placeholder="e.g. Dr. Smith"
                    className="bg-secondary/20 border-border text-foreground text-sm h-8"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowAddForm(false)} className="border-border text-muted-foreground">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground"
                  onClick={() => {
                    if (!form.name.trim()) { toast.error("Medication name is required."); return; }
                    addMed.mutate(form);
                  }}
                  disabled={addMed.isPending}
                >
                  {addMed.isPending ? "Adding..." : "Add Medication"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interaction Results */}
        {showInteractionChecker && interactionResult && (
          <Card className="border-border bg-card mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" /> Drug Interaction Analysis
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${RISK_CONFIG[interactionResult.overallRisk as keyof typeof RISK_CONFIG]?.color || "text-muted-foreground"}`}>
                    {RISK_CONFIG[interactionResult.overallRisk as keyof typeof RISK_CONFIG]?.label || "Unknown Risk"}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setShowInteractionChecker(false)} className="h-6 w-6 p-0">
                    <XCircle className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">{interactionResult.summary}</p>
              {interactionResult.interactions?.length > 0 ? (
                <div className="space-y-2">
                  {interactionResult.interactions.map((interaction: any, i: number) => {
                    const sev = SEVERITY_CONFIG[interaction.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.mild;
                    return (
                      <div key={i} className={`p-3 rounded-lg border ${sev.color}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs font-semibold">{interaction.drug1} + {interaction.drug2}</span>
                          <Badge className={`text-[10px] ml-auto ${sev.color}`}>{sev.label}</Badge>
                        </div>
                        <p className="text-xs leading-snug mb-1">{interaction.description}</p>
                        <p className="text-[11px] opacity-80"><span className="font-medium">Recommendation:</span> {interaction.recommendation}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-300">No significant interactions detected between your current medications.</p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground italic">
                This analysis is for informational purposes only. Always consult your prescribing physician before making any changes to your medications.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Medication List */}
        {activeMeds.length === 0 ? (
          <Card className="border-border bg-card">
            <CardContent className="pt-12 pb-12 text-center">
              <Pill className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">No Medications Added</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add medications you already use to organize your own list and dose log. For interactions, dosing, or medication changes, use a pharmacist or licensed prescriber.
              </p>
              <Button onClick={() => setShowAddForm(true)} className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Add First Medication
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {activeMeds.map(med => (
              <Card key={med.id} className="border-border bg-card hover:border-primary/30 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-foreground">{med.name}</h3>
                      {med.genericName && <p className="text-xs text-muted-foreground">{med.genericName}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-red-400"
                      onClick={() => removeMed.mutate({ id: med.id })}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {med.dosage && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Dosage: </span>
                        <span className="text-foreground font-medium">{med.dosage}</span>
                      </div>
                    )}
                    {med.frequency && (
                      <div className="text-xs">
                        <span className="text-muted-foreground">Frequency: </span>
                        <span className="text-foreground font-medium">{med.frequency}</span>
                      </div>
                    )}
                    {med.prescribedFor && (
                      <div className="text-xs col-span-2">
                        <span className="text-muted-foreground">For: </span>
                        <span className="text-foreground">{med.prescribedFor}</span>
                      </div>
                    )}
                    {med.prescribedBy && (
                      <div className="text-xs col-span-2">
                        <span className="text-muted-foreground">Prescribed by: </span>
                        <span className="text-foreground">{med.prescribedBy}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 h-7 text-xs"
                      onClick={() => logTaken.mutate({ medicationId: med.id, skipped: false })}
                      disabled={logTaken.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Taken
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-border text-muted-foreground h-7 text-xs"
                      onClick={() => logTaken.mutate({ medicationId: med.id, skipped: true })}
                      disabled={logTaken.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Skipped
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center mt-8 max-w-lg mx-auto">
          The Doctor Buddy Medication Tracker is for personal record-keeping only. Always follow your physician's instructions and never adjust medications without professional guidance.
        </p>
      </div>
    </div>
  );
}
