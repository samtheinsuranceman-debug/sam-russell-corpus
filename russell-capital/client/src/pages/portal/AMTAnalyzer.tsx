// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { useSharedField } from "@/context/FinancialDataContext";
import { AlertTriangle, DollarSign, TrendingUp, Target, Percent, ArrowRight, Shield, CheckCircle2, Calculator, Layers, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function AMTAnalyzer() {
  const [agi, setAgi] = useState(0); // Adjusted Gross Income
  const [exemptions, setExemptions] = useState(0); // AMT Exemptions
  const [itemizedDeductions, setItemizedDeductions] = useState(0); // Itemized Deductions
  const [saltDeduction, setSaltDeduction] = useState(0); // State and Local Tax Deduction
  const [isoExercises, setIsoExercises] = useState(0); // ISO Exercises Amount
  const [amtcCredit, setAmtcCredit] = useState(0); // AMT Credit Carryforward
  const [projectionYears, setProjectionYears] = useSharedField("projectionYears", 50); // Years for projection
  const [incomeGrowthRate, setIncomeGrowthRate] = useState(0.03); // Annual Income Growth Rate

  // AMT Calculation Engine (Form 6251 Walkthrough)
  const calculateAMT = useMemo(() => {
    const tentativeMinimumTax = agi - exemptions;
    const amt = Math.max(0, tentativeMinimumTax * 0.26 - 0.07 * tentativeMinimumTax); // Simplified AMT formula
    return amt;
  }, [agi, exemptions]);

  // AMT Exemption Phase-Out Calculator
  const exemptionPhaseOut = useMemo(() => {
    if (agi > 500000) { // Example threshold
      return exemptions * (1 - (agi - 500000) / 1000000); // Simplified phase-out
    }
    return exemptions;
  }, [agi, exemptions]);

  // ISO Exercise AMT Trap Analyzer
  const isoAMTTrap = useMemo(() => {
    const isoBargain = isoExercises * 0.15; // Example: 15% of ISO exercises as potential trap
    return isoBargain > 0 ? isoBargain : 0;
  }, [isoExercises]);

  // SALT Deduction AMT Impact
  const saltImpact = useMemo(() => {
    const amtAdjustment = saltDeduction > 10000 ? saltDeduction - 10000 : 0; // SALT cap at $10k for AMT
    return amtAdjustment;
  }, [saltDeduction]);

  // AMT Credit Carryforward Tracker
  const amtcTracker = useMemo(() => {
    return amtcCredit * 0.9; // Example: 90% carryforward rate
  }, [amtcCredit]);

  // AMT vs Regular Tax Crossover Point
  const crossoverPoint = useMemo(() => {
    const regularTax = agi * 0.22; // Example: 22% regular tax rate
    return calculateAMT > regularTax ? calculateAMT - regularTax : 0;
  }, [agi, calculateAMT]);

  // Strategies to Minimize AMT
  const strategies = [
    { name: 'Timing ISO Exercises', description: 'Delay exercises to avoid AMT triggers.' },
    { name: 'Bunching Deductions', description: 'Combine deductions in one year to exceed thresholds.' },
    { name: 'Installment Sales', description: 'Spread gains over multiple years to minimize AMT impact.' },
  ];

  // 50-Year AMT Exposure Projection
  const projectAMTExposure = useMemo(() => {
    const data = [];
    for (let year = 1; year <= projectionYears; year++) {
      const projectedAgi = agi * Math.pow(1 + incomeGrowthRate, year);
      const projectedAMT = calculateAMT * Math.pow(1 + incomeGrowthRate, year); // Simplified projection
      data.push({ year, projectedAMT });
    }
    return data;
  }, [agi, calculateAMT, incomeGrowthRate, projectionYears]);

  // Compliance Data
  const complianceInfo = {
    ircSections: 'IRC 55-59: AMT rules',
    section56: 'AMT adjustments for depreciation, etc.',
    section57: 'Tax preferences like ISO exercises',
    section53: 'AMT credit rules',
    section422: 'ISO qualification rules',
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#ffffff', fontFamily: 'Arial, sans-serif', padding: '40px', minHeight: '100vh' }}>
      <h1 style={{ color: '#ffd700', display: 'flex', alignItems: 'center' }}><Calculator size={32} /> AMT Analyzer</h1>
      
      {/* AMT Calculation Engine Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><DollarSign size={24} /> AMT Calculation Engine (Form 6251 Walkthrough)</h2>
        <p>Enter your Adjusted Gross Income and Exemptions to calculate AMT.</p>
        <input 
          type="number" 
          placeholder="Adjusted Gross Income" 
          onChange={(e) => setAgi(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <input 
          type="number" 
          placeholder="AMT Exemptions" 
          onChange={(e) => setExemptions(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <p style={{ color: '#ffd700' }}>Calculated AMT: ${calculateAMT.toFixed(2)}</p>
      </section>

      {/* AMT Exemption Phase-Out Calculator Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><Target size={24} /> AMT Exemption Phase-Out Calculator</h2>
        <p>Phase-out based on AGI: {exemptionPhaseOut.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={[{name: 'Phase-Out', value: exemptionPhaseOut}]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ffd700" />
          </BarChart>
        </ResponsiveContainer>
      </section>

      {/* ISO Exercise AMT Trap Analyzer Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><AlertTriangle size={24} /> ISO Exercise AMT Trap Analyzer</h2>
        <input 
          type="number" 
          placeholder="ISO Exercises Amount" 
          onChange={(e) => setIsoExercises(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <p>Potential AMT Trap: ${isoAMTTrap.toFixed(2)}</p>
      </section>

      {/* SALT Deduction AMT Impact Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><Percent size={24} /> SALT Deduction AMT Impact</h2>
        <input 
          type="number" 
          placeholder="SALT Deduction" 
          onChange={(e) => setSaltDeduction(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <p>AMT Impact from SALT: ${saltImpact.toFixed(2)}</p>
      </section>

      {/* AMT Credit Carryforward Tracker Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><Shield size={24} /> AMT Credit Carryforward Tracker</h2>
        <input 
          type="number" 
          placeholder="AMT Credit" 
          onChange={(e) => setAmtcCredit(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <p>Carryforward Amount: ${amtcTracker.toFixed(2)}</p>
      </section>

      {/* AMT vs Regular Tax Crossover Point Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><TrendingUp size={24} /> AMT vs Regular Tax Crossover Point</h2>
        <p>Crossover Amount: ${crossoverPoint.toFixed(2)}</p>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={[{name: 'Crossover', value: crossoverPoint}]}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#ff4500" />
            <Line dataKey="value" stroke="#ffd700" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      {/* Strategies to Minimize AMT Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><ArrowRight size={24} /> Strategies to Minimize AMT</h2>
        <ul style={{ color: '#ffd700' }}>
          {strategies.map((strategy, index) => (
            <li key={index}>{strategy.name}: {strategy.description}</li>
          ))}
        </ul>
      </section>

      {/* 50-Year AMT Exposure Projection Section */}
      <section style={{ marginBottom: '40px', padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><BarChart3 size={24} /> 50-Year AMT Exposure Projection</h2>
        <input 
          type="number" 
          placeholder="Income Growth Rate (e.g., 0.03 for 3%)" 
          onChange={(e) => setIncomeGrowthRate(parseFloat(e.target.value))} 
          style={{ margin: '10px 0', padding: '10px', backgroundColor: '#333', color: '#fff', border: '1px solid #ffd700' }} 
        />
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectAMTExposure}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="projectedAMT" stroke="#ff4500" fill="#ffd700" />
          </AreaChart>
        </ResponsiveContainer>
      </section>

      {/* Compliance Section */}
      <section style={{ padding: '20px', backgroundColor: '#1e1e1e', borderRadius: '8px' }}>
        <h2 style={{ color: '#ff4500' }}><CheckCircle2 size={24} /> Compliance Information</h2>
        <p>IRC Sections: {complianceInfo.ircSections}</p>
        <p>Section 56: {complianceInfo.section56}</p>
        <p>Section 57: {complianceInfo.section57}</p>
        <p>Section 53: {complianceInfo.section53}</p>
        <p>Section 422: {complianceInfo.section422}</p>
        <p style={{ color: '#ffd700' }}>Ensure compliance with AMT rules for accurate tax filing. <Zap size={18} /></p>
      </section>

      {/* Additional Footer for Theme Accents */}
      <footer style={{ marginTop: '40px', textAlign: 'center', color: '#ff4500' }}>
        <Layers size={24} /> Powered by AMT Analyzer - Dark Theme with Yellow/Red Accents
      </footer>
      <PageInsights section="a-m-t-analyzer" />
    </div>
  );
}
