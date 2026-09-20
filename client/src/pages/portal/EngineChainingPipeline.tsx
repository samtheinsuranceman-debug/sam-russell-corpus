// @ts-nocheck
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Play, Plus, Trash2, Link2, Clock, CheckCircle, XCircle, Layers, Zap, Save } from 'lucide-react';
import { toast } from "sonner";
import { PageInsights } from "@/components/PageInsights";

interface ChainStep {
  engineId: string;
  label: string;
  order: number;
  inputs: Record<string, any>;
}

export default function EngineChainingPipeline() {

  const templates = trpc.chains.getTemplateChains.useQuery();
  const engines = trpc.chains.getAvailableEngines.useQuery();
  const myChains = trpc.chains.getMyChains.useQuery();
  const runHistory = trpc.chains.getChainRuns.useQuery({ limit: 10 });
  const runChain = trpc.chains.runChain.useMutation();
  const saveChain = trpc.chains.createChain.useMutation();

  const [steps, setSteps] = useState<ChainStep[]>([]);
  const [chainName, setChainName] = useState("");
  const [chainDesc, setChainDesc] = useState("");
  const [runResult, setRunResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"templates" | "builder" | "history">("templates");

  const addStep = (engineId: string) => {
    const engine = engines.data?.find(e => e.id === engineId);
    if (!engine) return;
    setSteps(prev => [...prev, {
      engineId,
      label: engine.name,
      order: prev.length + 1,
      inputs: {},
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));
  };

  const loadTemplate = (template: any) => {
    setSteps(template.steps.map((s: any) => ({ ...s, inputs: {} })));
    setChainName(template.name);
    setChainDesc(template.description);
    setActiveTab("builder");
    toast.success(`${template.name} loaded with ${template.steps.length} steps`);
  };

  const handleRun = async () => {
    if (steps.length < 2) {
      toast.error("Need at least 2 steps");
      return;
    }
    try {
      const result = await runChain.mutateAsync({ steps });
      setRunResult(result);
      toast.success(`Chain completed! ${result.successCount}/${result.steps.length} steps succeeded in ${result.totalTimeMs}ms`);
    } catch (err: any) {
      toast.error(`Chain failed: ${err.message}`);
    }
  };

  const handleSave = async () => {
    if (!chainName || steps.length < 2) {
      toast.error("Name required and at least 2 steps");
      return;
    }
    try {
      await saveChain.mutateAsync({ name: chainName, description: chainDesc, steps });
      toast.success("Chain saved!");
      myChains.refetch();
    } catch (err: any) {
      toast.error(`Save failed: ${err.message}`);
    }
  };

  return (
    <AppShell title="Engine Chaining" subtitle="Build sequential pipelines of proprietary engines">
      <div className="space-y-6">
        {/* Tab Navigation */}
        <div className="flex gap-2">
          {(["templates", "builder", "history"] as const).map(tab => (
            <Button key={tab} variant={activeTab === tab ? "default" : "outline"} size="sm" onClick={() => setActiveTab(tab)}>
              {tab === "templates" ? <Layers className="h-4 w-4 mr-1" /> : tab === "builder" ? <Link2 className="h-4 w-4 mr-1" /> : <Clock className="h-4 w-4 mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.data?.map(tpl => (
              <Card key={tpl.id} className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => loadTemplate(tpl)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{tpl.name}</CardTitle>
                    <Badge variant="outline">{tpl.category}</Badge>
                  </div>
                  <CardDescription>{tpl.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 flex-wrap">
                    {tpl.steps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">{step.label}</Badge>
                        {idx < tpl.steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-3 w-full" variant="outline" onClick={(e) => { e.stopPropagation(); loadTemplate(tpl); }}>
                    <Play className="h-3 w-3 mr-1" /> Load Template
                  </Button>
                </CardContent>
              </Card>
            ))}
            {/* Saved Chains */}
            {myChains.data && myChains.data.length > 0 && (
              <>
                <div className="col-span-full mt-4"><h3 className="text-lg font-semibold">Your Saved Chains</h3></div>
                {myChains.data.map((chain: any) => (
                  <Card key={chain.id} className="hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => { setSteps((chain.steps as any[]).map((s: any) => ({ ...s, inputs: {} }))); setChainName(chain.name); setChainDesc(chain.description); setActiveTab("builder"); }}>
                    <CardHeader>
                      <CardTitle className="text-base">{chain.name}</CardTitle>
                      <CardDescription>{chain.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Runs: {chain.runCount}</span>
                        {chain.lastRunAt && <span>Last: {new Date(chain.lastRunAt).toLocaleDateString()}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        )}

        {/* Builder Tab */}
        {activeTab === "builder" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Chain Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Chain name..." value={chainName} onChange={e => setChainName(e.target.value)} />
                <Textarea placeholder="Description (optional)..." value={chainDesc} onChange={e => setChainDesc(e.target.value)} rows={2} />
              </CardContent>
            </Card>

            {/* Pipeline Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Pipeline Steps ({steps.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary text-sm font-bold shrink-0">{step.order}</div>
                    {idx > 0 && <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 -ml-1 -mr-1" />}
                    <div className="flex-1 p-3 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{step.label}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeStep(idx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Engine: {step.engineId}</p>
                    </div>
                  </div>
                ))}

                {/* Add Step */}
                <div className="flex gap-2">
                  <Select onValueChange={addStep}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Add an engine step..." /></SelectTrigger>
                    <SelectContent>
                      {engines.data?.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" disabled><Plus className="h-4 w-4" /></Button>
      <PageInsights section="engine-chaining-pipeline" />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-3">
                  <Button onClick={handleRun} disabled={steps.length < 2 || runChain.isPending} className="flex-1">
                    {runChain.isPending ? <><Clock className="h-4 w-4 mr-1 animate-spin" /> Running...</> : <><Zap className="h-4 w-4 mr-1" /> Run Chain</>}
                  </Button>
                  <Button variant="outline" onClick={handleSave} disabled={!chainName || steps.length < 2}>
                    <Save className="h-4 w-4 mr-1" /> Save
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Run Results */}
            {runResult && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-400" /> Chain Results
                    <Badge variant="outline" className="ml-auto">{runResult.totalTimeMs}ms total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {runResult.steps.map((step: any, idx: number) => (
                    <div key={idx} className={`p-3 rounded-lg border ${step.success ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {step.success ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-red-400" />}
                          <span className="font-medium text-sm">{step.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{step.executionTimeMs}ms</span>
                      </div>
                      {step.error && <p className="text-xs text-red-400">{step.error}</p>}
                      {step.success && step.result && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View result data</summary>
                          <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto max-h-40">{JSON.stringify(step.result, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                  ))}
                  <div className="text-center text-sm text-muted-foreground pt-2">
                    {runResult.successCount}/{runResult.steps.length} steps completed successfully
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Run History</CardTitle>
            </CardHeader>
            <CardContent>
              {runHistory.data && runHistory.data.length > 0 ? (
                <div className="space-y-2">
                  {runHistory.data.map((run: any) => (
                    <div key={run.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Badge variant={run.status === "completed" ? "default" : "destructive"}>{run.status}</Badge>
                        <span className="text-sm">{(run.stepResults as any[])?.length ?? 0} steps</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{run.totalTimeMs}ms</span>
                        <span>{new Date(run.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-muted-foreground">No chain runs yet. Build and run a pipeline to see history.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
