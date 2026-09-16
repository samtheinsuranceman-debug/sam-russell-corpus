import { Dna } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AXES, AXIS_QUESTIONS, type DurabilityAxis } from "@shared/engines/wealthGenomeDurability";
import { genomeFromMetaPrograms } from "@shared/nlp/genomeBridge";
import type { MetaProgramReading } from "@shared/nlp/metaPrograms";

export const META_PROGRAMS_STORAGE_KEY = "doctorbuddy-metaprograms-v1";

/** Persist only the salient readings (no transcript) so the finance hub can show the same card later. */
export function saveMetaProgramReadings(readings: readonly MetaProgramReading[]) {
  try {
    const salient = readings.filter(r => r.leading && r.confidence >= 0.3).map(r => ({ ...r, poles: r.poles.map(p => ({ ...p, evidence: p.evidence.slice(0, 3) })) }));
    localStorage.setItem(META_PROGRAMS_STORAGE_KEY, JSON.stringify({ savedAt: Date.now(), readings: salient }));
  } catch { /* storage unavailable */ }
}

export function loadMetaProgramReadings(): MetaProgramReading[] {
  try {
    const raw = localStorage.getItem(META_PROGRAMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { readings?: MetaProgramReading[] };
    return Array.isArray(parsed.readings) ? parsed.readings : [];
  } catch { return []; }
}

const AXIS_LABEL: Record<DurabilityAxis, string> = {
  cognitive: "Cognitive: holding a decision you can't fully re-derive",
  emotional: "Emotional: holding through a bad statement",
  income: "Income: funding through a rough year",
  relational: "Relational: the other people in the decision",
};

/**
 * The Wealth Genome durability layer, read from how the person sorts.
 * Everything shown is framework evidence, marked as such by the engine, and
 * thin by design until real history is on file. It is educational; it makes
 * no decision and is never a reason to withhold anything.
 */
export default function DurabilityCard({ readings, source }: { readings: readonly MetaProgramReading[]; source: string }) {
  const { genome, bridged } = genomeFromMetaPrograms(readings);
  if (!bridged.length) return null;
  return (
    <Card className="border-white/10">
      <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Dna className="w-4 h-4 text-cyan-400" /> What a strategy would ask of you</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-xs">
        <p className="text-muted-foreground">From {source}. Coverage {Math.round(genome.coverage * 100)}%: this is a framework reading, the weakest kind of evidence, and it only becomes useful with real history.</p>
        {AXES.map(axis => {
          const r = genome.readings[axis];
          return (
            <div key={axis} className="rounded-md bg-white/[0.03] px-3 py-2">
              <p className="font-medium">{AXIS_LABEL[axis]}</p>
              {r.insufficient
                ? <p className="text-muted-foreground">Not enough to say. A question that would tell: "{AXIS_QUESTIONS[axis]}"</p>
                : <p>{r.score > 0.2 ? "Reads as likely to hold" : r.score < -0.2 ? "Reads as likely to need support" : "Reads as neither way"} (confidence {Math.round(r.confidence * 100)}%). {r.basis}</p>}
            </div>
          );
        })}
        <ul className="text-muted-foreground list-disc pl-4">
          {bridged.map((b, i) => <li key={i}>{b.program}: {b.pole}</li>)}
        </ul>
        <p className="text-muted-foreground">Educational only. Nothing here decides anything about you, and no reading is a reason to withhold any option.</p>
      </CardContent>
    </Card>
  );
}
