// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Stethoscope, GraduationCap, Target, DollarSign, Home, Shield } from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

interface QuizAnswers {
  trainingStage: string;
  specialty: string;
  income: number;
  loanBalance: number;
  priorities: string[];
  dualPhysician: boolean;
}

interface Calculator {
  name: string;
  reason: string;
  link: string;
}

const QUESTIONS = 6;
const SPECIALTIES = [
  'Internal Medicine', 'Family Medicine', 'Pediatrics', 'Surgery', 'Anesthesiology',
  'Radiology', 'Emergency Medicine', 'Psychiatry', 'OB/GYN', 'Cardiology',
  'Orthopedics', 'Dermatology'
];
const PRIORITIES = [
  'Debt Payoff', 'Tax Optimization', 'Retirement', 'Real Estate',
  'Insurance', 'Wealth Building', 'Estate Planning'
];

const OnboardingQuiz: React.FC = () => {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>({
    trainingStage: '',
    specialty: '',
    income: 50000,
    loanBalance: 0,
    priorities: [],
    dualPhysician: false
  });
  const [results, setResults] = useState<{ score: number; calculators: Calculator[]; actions: string[] } | null>(null);

  useEffect(() => {
    if (step > QUESTIONS && !results) {
      calculateResults();
    }
  }, [step, results]);

  const calculateResults = () => {
    const score = Math.min(100, Math.max(20, answers.income / 10000 + (answers.loanBalance < 50000 ? 20 : 0)));
    const calculators: Calculator[] = [
      { name: 'Debt Repayment Planner', reason: 'High student loans need strategic payoff', link: '/calculators/debt' },
      { name: 'Retirement Forecast', reason: 'Long-term planning is critical', link: '/calculators/retirement' },
      ...(answers.priorities.includes('Tax Optimization') ? [{ name: 'Tax Strategy Analyzer', reason: 'Optimize your tax burden', link: '/calculators/tax' }] : []),
      ...(answers.priorities.includes('Real Estate') ? [{ name: 'Property Investment ROI', reason: 'Evaluate real estate opportunities', link: '/calculators/real-estate' }] : []),
      ...(answers.dualPhysician ? [{ name: 'Dual Income Planner', reason: 'Maximize dual-physician finances', link: '/calculators/dual-income' }] : []),
      ...(answers.income > 200000 ? [{ name: 'Wealth Accelerator', reason: 'Grow high income effectively', link: '/calculators/wealth' }] : [])
    ].slice(0, 10);
    const actions = [
      'Review loan repayment options',
      'Set up retirement contributions',
      ...(answers.loanBalance > 100000 ? ['Consider loan forgiveness programs'] : []),
      ...(answers.dualPhysician ? ['Coordinate spousal benefits'] : [])
    ];
    setResults({ score, calculators, actions });
  };

  const handleNext = () => setStep(prev => Math.min(prev + 1, QUESTIONS + 1));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  const updateAnswer = <K extends keyof QuizAnswers>(key: K, value: QuizAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  };

  const savePlan = () => {
    localStorage.setItem('financialPlan', JSON.stringify({ answers, results }));
    alert('Your financial plan outline has been saved!');
  };

  const renderQuestion = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><GraduationCap /> Training Stage?</h2>
            {['Medical Student', 'Resident', 'Fellow', 'Attending', 'Retired'].map(stage => (
              <Button key={stage} variant={answers.trainingStage === stage ? 'default' : 'outline'} className="w-full text-left justify-start" onClick={() => updateAnswer('trainingStage', stage)}>
                {stage}
              </Button>
            ))}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Stethoscope /> Specialty?</h2>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map(spec => (
                <Button key={spec} variant={answers.specialty === spec ? 'default' : 'outline'} className="text-left justify-start" onClick={() => updateAnswer('specialty', spec)}>
                  {spec}
                </Button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><DollarSign /> Annual Income?</h2>
            <Slider value={[answers.income]} onValueChange={([val]) => updateAnswer('income', val)} min={50000} max={1000000} step={10000} className="w-full" />
            <p className="text-emerald-400">${answers.income.toLocaleString()}</p>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><DollarSign /> Student Loan Balance?</h2>
            <Slider value={[answers.loanBalance]} onValueChange={([val]) => updateAnswer('loanBalance', val)} min={0} max={500000} step={5000} className="w-full" />
            <p className="text-emerald-400">${answers.loanBalance.toLocaleString()}</p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Target /> Financial Priorities?</h2>
            {PRIORITIES.map(priority => (
              <div key={priority} className="flex items-center gap-2">
                <Checkbox checked={answers.priorities.includes(priority)} onCheckedChange={checked => {
                  updateAnswer('priorities', checked ? [...answers.priorities, priority] : answers.priorities.filter(p => p !== priority));
                }} />
                <span>{priority}</span>
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2"><Home /> Dual-Physician Household?</h2>
            <div className="flex gap-4">
              <Button variant={answers.dualPhysician ? 'default' : 'outline'} onClick={() => updateAnswer('dualPhysician', true)}>Yes</Button>
              <Button variant={!answers.dualPhysician ? 'default' : 'outline'} onClick={() => updateAnswer('dualPhysician', false)}>No</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderResults = () => results && (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2"><Shield className="text-emerald-500" /> Your Financial Plan Outline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Financial Health Score</h3>
          <Progress value={results.score} className="w-full" />
          <p className="text-emerald-400 mt-1">{results.score.toFixed(0)}/100</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Recommended Calculators</h3>
          <div className="space-y-4">
            {results.calculators.map((calc, idx) => (
              <div key={calc.name} className="p-4 bg-[#0d1526] rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <Badge variant="default">{idx + 1}</Badge> {calc.name}
                </h4>
                <p className="text-[#94a3b8] text-sm">{calc.reason}</p>
                <Button variant="link" className="text-emerald-400 mt-2 p-0" onClick={() => window.location.href = calc.link}>Access Calculator</Button>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Critical Actions</h3>
          <ul className="list-disc list-inside text-[#94a3b8] space-y-1">
            {results.actions.map(action => <li key={action}>{action}</li>)}
          </ul>
        </div>
        <Button className="w-full bg-emerald-500 hover:bg-emerald-600" onClick={savePlan}>Save My Plan</Button>
      </CardContent>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-[#0d1526] border-[#1e3a5f] shadow-lg">
        <AnimatePresence mode="wait">
          {step <= QUESTIONS ? (
            <motion.div key={`step-${step}`} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="space-y-6">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2"><Stethoscope className="text-emerald-500" /> Financial Physical</CardTitle>
                <Progress value={(step / QUESTIONS) * 100} className="w-full" />
                <p className="text-sm text-[#7a95b8]">Step {step} of {QUESTIONS}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                {renderQuestion()}
                <div className="flex gap-4">
                  {step > 1 && <Button variant="outline" onClick={handleBack} className="border-[#1e3a5f]">Back</Button>}
                  <Button onClick={handleNext} className="bg-emerald-500 hover:bg-emerald-600" disabled={!answers.trainingStage || (step === 2 && !answers.specialty)}>
                    {step === QUESTIONS ? 'See Your Profile' : 'Next'}
                  </Button>
                </div>
              </CardContent>
            </motion.div>
          ) : (
            renderResults()
          )}
        </AnimatePresence>
      </Card>
      <PageInsights section="onboarding-quiz" />
    </div>
  );
};

export default OnboardingQuiz;