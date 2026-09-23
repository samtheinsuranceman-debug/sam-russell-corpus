import { useState, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { STATE_TAX_DATA, calculateStateTax } from '@/data/stateTaxEngine';
import { MapPin } from 'lucide-react';

interface StateTaxSelectorProps {
  income: number;
  filingStatus?: 'single' | 'mfj';
  onStateChange?: (stateAbbr: string, stateTax: number, effectiveRate: number, marginalRate: number) => void;
  className?: string;
  compact?: boolean;
}

const stateOptions = Object.entries(STATE_TAX_DATA)
  .map(([abbr, info]) => ({ abbr, name: info.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function StateTaxSelector({
  income,
  filingStatus = 'single',
  onStateChange,
  className = '',
  compact = false,
}: StateTaxSelectorProps) {
  const [selectedState, setSelectedState] = useState('');

  const stateTaxResult = useMemo(() => {
    if (!selectedState) return null;
    return calculateStateTax(income, selectedState, filingStatus);
  }, [selectedState, income, filingStatus]);

  const handleChange = (abbr: string) => {
    setSelectedState(abbr);
    const result = calculateStateTax(income, abbr, filingStatus);
    onStateChange?.(abbr, result.tax, result.effectiveRate, result.marginalRate);
  };

  const formatDollars = (n: number) => {
    if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return '$' + (n / 1_000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
        <Select value={selectedState} onValueChange={handleChange}>
          <SelectTrigger className="bg-slate-800 border-slate-700 w-48">
            <SelectValue placeholder="Select State" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
            {stateOptions.map(s => (
              <SelectItem key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {stateTaxResult && (
          <span className="text-sm text-slate-300">
            State Tax: <span className="text-emerald-400 font-semibold">{formatDollars(stateTaxResult.tax)}</span>
            {' '}({(stateTaxResult.effectiveRate * 100).toFixed(1)}% eff.)
          </span>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <Label className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">State Tax Impact</Label>
        </div>
        <Select value={selectedState} onValueChange={handleChange}>
          <SelectTrigger className="bg-slate-800 border-slate-700 mb-3">
            <SelectValue placeholder="Select your state for tax analysis" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 max-h-60">
            {stateOptions.map(s => (
              <SelectItem key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {stateTaxResult && (
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-2 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">State Tax</p>
              <p className="text-lg font-bold text-emerald-400">{formatDollars(stateTaxResult.tax)}</p>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Effective Rate</p>
              <p className="text-lg font-bold text-cyan-400">{(stateTaxResult.effectiveRate * 100).toFixed(2)}%</p>
            </div>
            <div className="text-center p-2 bg-slate-900/50 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Marginal Rate</p>
              <p className="text-lg font-bold text-amber-400">{(stateTaxResult.marginalRate * 100).toFixed(2)}%</p>
            </div>
          </div>
        )}
        {stateTaxResult && selectedState && STATE_TAX_DATA[selectedState]?.notes && (
          <p className="text-xs text-slate-500 mt-2 italic">{STATE_TAX_DATA[selectedState].notes}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default StateTaxSelector;
