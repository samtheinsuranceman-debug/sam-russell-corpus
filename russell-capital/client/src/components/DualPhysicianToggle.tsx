import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Heart, Calculator } from 'lucide-react';

interface SpouseData {
  specialty: string;
  income: number;
  studentDebt: number;
  studentDebtRate: number;
  retirementSavings: number;
  age: number;
  employerType: string;
}

interface DualPhysicianToggleProps {
  onToggle: (isDual: boolean, spouseData: SpouseData | null) => void;
  defaultEnabled?: boolean;
}

const specialties = [
  'Anesthesiology', 'Cardiology', 'Dermatology', 'Emergency Medicine', 'Family Medicine',
  'Internal Medicine', 'Neurology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'Surgery'
];

const DualPhysicianToggle: React.FC<DualPhysicianToggleProps> = ({ onToggle, defaultEnabled = false }) => {
  const [isDual, setIsDual] = useState(defaultEnabled);
  const [spouseData, setSpouseData] = useState<SpouseData>({
    specialty: 'Family Medicine', income: 0, studentDebt: 0, studentDebtRate: 5,
    retirementSavings: 0, age: 30, employerType: 'Private'
  });

  useEffect(() => {
    onToggle(isDual, isDual ? spouseData : null);
  }, [isDual, spouseData, onToggle]);

  const handleSpouseChange = (field: keyof SpouseData, value: string | number) => {
    setSpouseData(prev => ({ ...prev, [field]: value }));
  };

  const combinedIncome = isDual ? spouseData.income : 0;
  const combinedDebt = isDual ? spouseData.studentDebt : 0;
  const estimatedTaxRate = combinedIncome > 400000 ? 37 : combinedIncome > 200000 ? 32 : 24;

  return (
    <div className="space-y-4 text-white">
      <div className="flex items-center justify-between bg-slate-800 p-4 rounded-lg border border-slate-700">
        <Label htmlFor="dual-toggle" className="flex items-center gap-2 text-lg">
          <Users className="w-5 h-5" />
          {isDual ? 'Dual-Physician Household' : 'Single Physician'}
        </Label>
        <Switch
          id="dual-toggle"
          checked={isDual}
          onCheckedChange={checked => setIsDual(checked === true)}
        />
      </div>

      <Collapsible open={isDual} className="bg-slate-800 rounded-lg border border-slate-700">
        <CollapsibleTrigger className="p-4 w-full text-left flex items-center gap-2">
          <Heart className="w-5 h-5" />
          Spouse Financial Details
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Specialty</Label>
              <Select value={spouseData.specialty} onValueChange={val => handleSpouseChange('specialty', val)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select specialty" />
                </SelectTrigger>
                <SelectContent>
                  {specialties.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Annual Income ($)</Label>
              <Input type="number" value={spouseData.income} onChange={e => handleSpouseChange('income', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label>Student Debt ($)</Label>
              <Input type="number" value={spouseData.studentDebt} onChange={e => handleSpouseChange('studentDebt', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label>Debt Interest Rate (%)</Label>
              <Input type="number" step="0.1" value={spouseData.studentDebtRate} onChange={e => handleSpouseChange('studentDebtRate', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label>Retirement Savings ($)</Label>
              <Input type="number" value={spouseData.retirementSavings} onChange={e => handleSpouseChange('retirementSavings', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label>Age</Label>
              <Input type="number" value={spouseData.age} onChange={e => handleSpouseChange('age', Number(e.target.value))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
            <div>
              <Label>Employer Type</Label>
              <Select value={spouseData.employerType} onValueChange={val => handleSpouseChange('employerType', val)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select employer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Private">Private</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {isDual && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calculator className="w-5 h-5" />
              Combined Household Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base">
              Combined Income: ${combinedIncome.toLocaleString()} | Combined Student Debt: ${combinedDebt.toLocaleString()} | Estimated Joint Tax Rate: {estimatedTaxRate}%
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DualPhysicianToggle;