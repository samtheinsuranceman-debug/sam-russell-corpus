// @ts-nocheck
/**
 * ClientSelectorBar — Reusable component that provides client selection,
 * scenario save/load, and integration status for any calculator page.
 */
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Save, FolderOpen, Clock, CheckCircle2, Loader2 } from "lucide-react";

interface ClientSelectorBarProps {
  clients: any[];
  clientsLoading: boolean;
  selectedClientId: number | null;
  selectedClientName: string;
  onSelectClient: (id: number, name: string) => void;
  scenarios: any[];
  scenariosLoading: boolean;
  scenarioName: string;
  onSetScenarioName: (name: string) => void;
  onSave: () => void;
  onLoad: (scenario: any) => void;
  isSaving: boolean;
  lastSavedAt: Date | null;
  calculatorName: string;
}

export function ClientSelectorBar({
  clients,
  clientsLoading,
  selectedClientId,
  selectedClientName,
  onSelectClient,
  scenarios,
  scenariosLoading,
  scenarioName,
  onSetScenarioName,
  onSave,
  onLoad,
  isSaving,
  lastSavedAt,
  calculatorName,
}: ClientSelectorBarProps) {
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 mb-4">
      {/* Client Selector */}
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Select
          value={selectedClientId?.toString() || ""}
          onValueChange={(val) => {
            const client = clients.find((c: any) => String(c.id) === val);
            if (client) onSelectClient(client.id, client.name || client.firstName + " " + client.lastName || "Client");
          }}
        >
          <SelectTrigger className="w-[200px] h-8 text-sm">
            <SelectValue placeholder={clientsLoading ? "Loading..." : "Select client"} />
          </SelectTrigger>
          <SelectContent>
            {clients.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim() || `Client #${c.id}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Scenario Name */}
      <Input
        value={scenarioName}
        onChange={(e) => onSetScenarioName(e.target.value)}
        placeholder="Scenario name..."
        className="w-[180px] h-8 text-sm"
      />

      {/* Save Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onSave}
        disabled={isSaving}
        className="h-8"
      >
        {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
        Save
      </Button>

      {/* Load Button */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="h-8">
            <FolderOpen className="h-3 w-3 mr-1" />
            Load ({scenarios.length})
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Scenario — {calculatorName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {scenariosLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : scenarios.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No saved scenarios yet</p>
            ) : (
              scenarios.map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onLoad(s);
                    setLoadDialogOpen(false);
                  }}
                  className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  {s.clientName && (
                    <span className="text-xs text-muted-foreground">Client: {s.clientName}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status */}
      {lastSavedAt && (
        <Badge variant="secondary" className="h-6 text-xs gap-1">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          Saved {lastSavedAt.toLocaleTimeString()}
        </Badge>
      )}

      {selectedClientName && (
        <Badge variant="outline" className="h-6 text-xs">
          {selectedClientName}
        </Badge>
      )}
    </div>
  );
}
