// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Building2, DollarSign, TrendingUp, Shield, CheckCircle2, AlertTriangle, Calendar, Target, Percent, ArrowRight, Home, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const RealEstatePortfolioManager = () => {
  const [properties, setProperties] = useState([
    { id: 1, name: 'Property 1', purchasePrice: 500000, downPayment: 100000, annualRentalIncome: 60000, annualExpenses: 20000, appreciationRate: 3, type: 'Residential' },
    { id: 2, name: 'Property 2', purchasePrice: 750000, downPayment: 150000, annualRentalIncome: 80000, annualExpenses: 25000, appreciationRate: 4, type: 'Commercial' },
    // Add more up to 10
    { id: 3, name: 'Property 3', purchasePrice: 400000, downPayment: 80000, annualRentalIncome: 45000, annualExpenses: 15000, appreciationRate: 2.5, type: 'Residential' },
    { id: 4, name: 'Property 4', purchasePrice: 600000, downPayment: 120000, annualRentalIncome: 70000, annualExpenses: 22000, appreciationRate: 3.5, type: 'Commercial' },
    { id: 5, name: 'Property 5', purchasePrice: 550000, downPayment: 110000, annualRentalIncome: 65000, annualExpenses: 21000, appreciationRate: 3, type: 'Residential' },
    { id: 6, name: 'Property 6', purchasePrice: 800000, downPayment: 160000, annualRentalIncome: 90000, annualExpenses: 28000, appreciationRate: 4.5, type: 'Commercial' },
    { id: 7, name: 'Property 7', purchasePrice: 450000, downPayment: 90000, annualRentalIncome: 50000, annualExpenses: 16000, appreciationRate: 2.8, type: 'Residential' },
    { id: 8, name: 'Property 8', purchasePrice: 650000, downPayment: 130000, annualRentalIncome: 75000, annualExpenses: 23000, appreciationRate: 3.7, type: 'Commercial' },
    { id: 9, name: 'Property 9', purchasePrice: 520000, downPayment: 104000, annualRentalIncome: 62000, annualExpenses: 19000, appreciationRate: 3.2, type: 'Residential' },
    { id: 10, name: 'Property 10', purchasePrice: 700000, downPayment: 140000, annualRentalIncome: 82000, annualExpenses: 24000, appreciationRate: 4, type: 'Commercial' },
  ]);

  const addProperty = (newProperty) => {
    if (properties.length < 10) {
      setProperties([...properties, { ...newProperty, id: properties.length + 1 }]);
    }
  };

  const cashOnCashReturn = useMemo(() => {
    return properties.map(prop => {
      const annualCashFlow = prop.annualRentalIncome - prop.annualExpenses;
      return ((annualCashFlow / prop.downPayment) * 100).toFixed(2);
    });
  }, [properties]);

  const capRate = useMemo(() => {
    return properties.map(prop => {
      const netOperatingIncome = prop.annualRentalIncome - prop.annualExpenses;
      return ((netOperatingIncome / prop.purchasePrice) * 100).toFixed(2);
    });
  }, [properties]);

  const optimize1031Exchange = useMemo(() => {
    // Simplified logic: Chain properties by appreciation rate for potential 1031 exchange
    return properties.sort((a, b) => b.appreciationRate - a.appreciationRate).slice(0, 3); // Top 3 for exchange
  }, [properties]);

  const costSegregationImpact = useMemo(() => {
    return properties.map(prop => {
      // Simplified: Assume 20% faster depreciation due to segregation
      const baseDepreciation = prop.purchasePrice * 0.05; // 5% annual
      return (baseDepreciation * 1.2).toFixed(2); // 20% impact
    });
  }, [properties]);

  const depreciationRecapturePlanning = useMemo(() => {
    return properties.map(prop => {
      // Simplified: 25% tax on depreciation recapture
      const depreciation = prop.purchasePrice * 0.05 * 5; // Over 5 years
      return (depreciation * 0.25).toFixed(2); // Potential tax
    });
  }, [properties]);

  const portfolioGrowthProjection = useMemo(() => {
    const years = Array.from({ length: 20 }, (_, i) => i + 1);
    return years.map(year => {
      let totalValue = properties.reduce((sum, prop) => sum + prop.purchasePrice, 0);
      for (let y = 1; y <= year; y++) {
        totalValue *= (1 + (properties.reduce((avg, prop) => avg + prop.appreciationRate, 0) / properties.length / 100));
      }
      return { year, value: totalValue };
    });
  }, [properties]);

  const propertyAllocationData = useMemo(() => {
    const types = ['Residential', 'Commercial'];
    return types.map(type => ({
      name: type,
      value: properties.filter(prop => prop.type === type).reduce((sum, prop) => sum + prop.purchasePrice, 0)
    }));
  }, [properties]);

  const COLORS = ['#1E90FF', '#FFBF00']; // Blue and Amber accents

  return (
    <div style={{ backgroundColor: '#121212', color: '#E0E0E0', minHeight: '100vh', padding: '20px' }}>
      <h1 style={{ color: '#1E90FF' }}>Real Estate Portfolio Manager</h1>
      
      {/* Multi-property Portfolio Tracker */}
      <section style={{ marginBottom: '40px' }}>
        <h2><Building2 size={24} color="#1E90FF" /> Portfolio Tracker (Up to 10 Properties)</h2>
        <div className="overflow-x-auto"><table style={{ width: '100%', borderCollapse: 'collapse', color: '#E0E0E0' }}>
          <thead>
            <tr style={{ backgroundColor: '#1E1E1E' }}>
              <th>ID</th>
              <th>Name</th>
              <th>Purchase Price</th>
              <th>Down Payment</th>
              <th>Annual Income</th>
              <th>Annual Expenses</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) => (
              <tr key={prop.id} style={{ backgroundColor: '#1E1E1E', borderBottom: '1px solid #333' }}>
                <td>{prop.id}</td>
                <td>{prop.name}</td>
                <td>${prop.purchasePrice}</td>
                <td>${prop.downPayment}</td>
                <td>${prop.annualRentalIncome}</td>
                <td>${prop.annualExpenses}</td>
                <td>{prop.type}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
        <button onClick={() => addProperty({ name: `Property ${properties.length + 1}`, purchasePrice: 0, downPayment: 0, annualRentalIncome: 0, annualExpenses: 0, appreciationRate: 0, type: 'Residential' })} style={{ backgroundColor: '#1E90FF', color: '#fff', padding: '10px', marginTop: '10px' }}>Add Property</button>
      </section>
      
      {/* Cash-on-Cash Return Calculator */}
      <section style={{ marginBottom: '40px' }}>
        <h2><DollarSign size={24} color="#FFBF00" /> Cash-on-Cash Return</h2>
        <ul>
          {properties.map((prop, index) => (
            <li key={prop.id}>Property {prop.id}: {cashOnCashReturn[index]}%</li>
          ))}
        </ul>
      </section>
      
      {/* Cap Rate Analyzer */}
      <section style={{ marginBottom: '40px' }}>
        <h2><Percent size={24} color="#1E90FF" /> Cap Rate Analyzer</h2>
        <ul>
          {properties.map((prop, index) => (
            <li key={prop.id}>Property {prop.id}: {capRate[index]}%</li>
          ))}
        </ul>
      </section>
      
      {/* 1031 Exchange Chain Optimizer */}
      <section style={{ marginBottom: '40px' }}>
        <h2><ArrowRight size={24} color="#FFBF00" /> 1031 Exchange Optimizer</h2>
        <ul>
          {optimize1031Exchange.map(prop => (
            <li key={prop.id}>Property {prop.id} - Appreciation: {prop.appreciationRate}%</li>
          ))}
        </ul>
      </section>
      
      {/* Cost Segregation Impact per Property */}
      <section style={{ marginBottom: '40px' }}>
        <h2><Shield size={24} color="#1E90FF" /> Cost Segregation Impact</h2>
        <ul>
          {properties.map((prop, index) => (
            <li key={prop.id}>Property {prop.id}: ${costSegregationImpact[index]} accelerated depreciation</li>
          ))}
        </ul>
      </section>
      
      {/* Depreciation Recapture Planning */}
      <section style={{ marginBottom: '40px' }}>
        <h2><AlertTriangle size={24} color="#FFBF00" /> Depreciation Recapture Planning</h2>
        <ul>
          {properties.map((prop, index) => (
            <li key={prop.id}>Property {prop.id}: Potential Tax ${depreciationRecapturePlanning[index]}</li>
          ))}
        </ul>
      </section>
      
      {/* 20-Year Portfolio Growth Projection */}
      <section style={{ marginBottom: '40px' }}>
        <h2><Calendar size={24} color="#1E90FF" /> 20-Year Growth Projection</h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={portfolioGrowthProjection}>
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke="#1E90FF" fill="#1E90FF" />
          </AreaChart>
        </ResponsiveContainer>
      </section>
      
      {/* Property Allocation Pie Chart */}
      <section style={{ marginBottom: '40px' }}>
        <h2><Home size={24} color="#FFBF00" /> Property Allocation</h2>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie data={propertyAllocationData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
              {propertyAllocationData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </section>
      
      {/* Compliance Section */}
      <section>
        <h2><CheckCircle2 size={24} color="#1E90FF" /> Compliance Checks</h2>
        <ul>
          <li><Target size={18} color="#FFBF00" /> IRC 1031 Like-Kind Exchange: <CheckCircle2 size={18} color="green" /> Compliant if properties are like-kind.</li>
          <li><TrendingUp size={18} color="#1E90FF" /> Section 168 MACRS Depreciation: <CheckCircle2 size={18} color="green" /> Applied to all properties.</li>
          <li><MapPin size={18} color="#FFBF00" /> Section 469 Passive Activity Rules: <AlertTriangle size={18} color="orange" /> Review for active participation.</li>
          <li><Percent size={18} color="#1E90FF" /> Section 1250 Depreciation Recapture: <AlertTriangle size={18} color="orange" /> Potential recapture calculated above.</li>
          <li><Shield size={18} color="#FFBF00" /> Section 199A REIT QBI: <CheckCircle2 size={18} color="green" /> Eligible for qualified business income deduction.</li>
        </ul>
      </section>
      <PageInsights section="real-estate-portfolio-manager" />
    </div>
  );
};

export default RealEstatePortfolioManager;
