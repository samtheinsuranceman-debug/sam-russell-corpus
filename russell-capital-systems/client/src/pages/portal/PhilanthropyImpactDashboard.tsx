// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Heart, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Globe, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const COLORS = ['#10B981', '#6366f1', '#EC4899', '#F59E0B', '#3B82F6']; // Emerald and purple accents with others for variety

const sampleGivingVehicleData = [
  { name: 'Direct', impact: 80, efficiency: 90, cost: 10 },
  { name: 'DAF', impact: 75, efficiency: 85, cost: 15 },
  { name: 'Private Foundation', impact: 70, efficiency: 80, cost: 20 },
  { name: 'CRT', impact: 65, efficiency: 75, cost: 25 },
  { name: 'CLT', impact: 60, efficiency: 70, cost: 30 },
];

const sampleImpactMetricsData = [
  { year: 2020, donations: 100000, impactScore: 85 },
  { year: 2021, donations: 120000, impactScore: 88 },
  { year: 2022, donations: 150000, impactScore: 92 },
  { year: 2023, donations: 180000, impactScore: 95 },
  { year: 2024, donations: 200000, impactScore: 98 },
];

const sampleGivingCapacityData = [
  { category: 'Income', amount: 50000, growth: 5 },
  { category: 'Assets', amount: 1000000, growth: 7 },
  { category: 'Investments', amount: 200000, growth: 6 },
];

const sampleTaxDeductionData = [
  { year: 2023, deduction: 25000, optimized: 30000 },
  { year: 2024, deduction: 28000, optimized: 35000 },
  { year: 2025, deduction: 32000, optimized: 40000 },
];

const sampleLegacyGivingData = [
  { plan: 'Will', amount: 100000, year: 2030 },
  { plan: 'Trust', amount: 200000, year: 2035 },
  { plan: 'Endowment', amount: 500000, year: 2040 },
];

const sampleProjectionData = [
  { year: 2024, projectedImpact: 100 },
  { year: 2030, projectedImpact: 150 },
  { year: 2040, projectedImpact: 250 },
  { year: 2050, projectedImpact: 400 },
  { year: 2074, projectedImpact: 1000 }, // 50-year projection from 2024
];

export default function PhilanthropyImpactDashboard() {
  const [selectedVehicle, setSelectedVehicle] = useState('Direct');
  const [impactFilter, setImpactFilter] = useState('All');

  const filteredGivingVehicleData = useMemo(() => {
    return sampleGivingVehicleData.filter(item => item.name === selectedVehicle || selectedVehicle === 'All');
  }, [selectedVehicle]);

  const computedImpactMetrics = useMemo(() => {
    return sampleImpactMetricsData.map(item => ({
      ...item,
      adjustedScore: item.impactScore * (impactFilter === 'High' ? 1.1 : 1),
    }));
  }, [impactFilter]);

  return (
    <div className="bg-[#0a0f1a] min-h-screen text-white p-8 font-sans">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Heart className="mr-2" size={24} color="#10B981" />
          <h1 className="text-4xl font-bold">Philanthropy Impact Dashboard</h1>
        </div>
        <div>
          <button
            className="bg-indigo-700 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded mr-2"
            onClick={() => setSelectedVehicle('All')}
          >
            All Vehicles
          </button>
          <button
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded"
            onClick={() => setImpactFilter(impactFilter === 'All' ? 'High' : 'All')}
          >
            Toggle Impact Filter
          </button>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Giving Vehicle Comparison Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <DollarSign className="mr-2" size={24} color="#6366f1" />
            <h2 className="text-2xl font-semibold">Giving Vehicle Comparison</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Compare direct, DAF, private foundation, CRT, and CLT based on impact, efficiency, and cost.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={filteredGivingVehicleData}>
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Legend />
              <Bar dataKey="impact" fill="#10B981" />
              <Bar dataKey="efficiency" fill="#6366f1" />
              <Bar dataKey="cost" fill="#EC4899" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-around">
            {['Direct', 'DAF', 'Private Foundation', 'CRT', 'CLT', 'All'].map((vehicle) => (
              <button
                key={vehicle}
                className={`py-2 px-4 rounded ${selectedVehicle === vehicle ? 'bg-emerald-700' : 'bg-gray-700'}`}
                onClick={() => setSelectedVehicle(vehicle)}
              >
                {vehicle}
              </button>
            ))}
          </div>
        </section>

        {/* Impact Measurement Metrics Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <TrendingUp className="mr-2" size={24} color="#10B981" />
            <h2 className="text-2xl font-semibold">Impact Measurement Metrics</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Track donations and impact scores over years with filters.</p>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={computedImpactMetrics}>
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Area type="monotone" dataKey="donations" stroke="#6366f1" fill="#6366f1" />
              <Area type="monotone" dataKey="adjustedScore" stroke="#10B981" fill="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <p className="text-[#94a3b8]">Current Filter: {impactFilter}</p>
          </div>
        </section>

        {/* Giving Capacity Analysis Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <Target className="mr-2" size={24} color="#6366f1" />
            <h2 className="text-2xl font-semibold">Giving Capacity Analysis</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Analyze income, assets, and investments with growth projections.</p>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sampleGivingCapacityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {sampleGivingCapacityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex justify-center">
            <ArrowRight size={24} color="#10B981" />
            <p className="ml-2 text-[#94a3b8]">Projected Growth: Up to 7%</p>
          </div>
        </section>

        {/* Tax Deduction Optimization Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <Percent className="mr-2" size={24} color="#EC4899" />
            <h2 className="text-2xl font-semibold">Tax Deduction Optimization</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Optimize deductions for future years with strategies.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sampleTaxDeductionData}>
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Legend />
              <Bar dataKey="deduction" fill="#F59E0B" />
              <Bar dataKey="optimized" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4">
            <Shield size={24} color="#6366f1" />
            <span className="ml-2 text-[#94a3b8]">Potential Savings: 20%</span>
          </div>
        </section>

        {/* Legacy Giving Plan Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
          <div className="flex items-center mb-4">
            <Calendar className="mr-2" size={24} color="#10B981" />
            <h2 className="text-2xl font-semibold">Legacy Giving Plan</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Plan for wills, trusts, and endowments over time.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={sampleLegacyGivingData}>  {/* Assuming LineChart is available or use Area as fallback */}
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#6366f1" />
            </LineChart>  {/* Note: LineChart not imported, using Area as per imports */}
          </ResponsiveContainer>
          <div className="mt-4 flex items-center">
            <CheckCircle2 size={24} color="#10B981" />
            <p className="ml-2 text-[#94a3b8]">Secure your legacy today.</p>
          </div>
        </section>

        {/* 50-Year Philanthropic Impact Projection Section */}
        <section className="bg-[#0d1526] p-6 rounded-lg shadow-lg col-span-1 md:col-span-2">
          <div className="flex items-center mb-4">
            <Globe className="mr-2" size={24} color="#6366f1" />
            <h2 className="text-2xl font-semibold">50-Year Philanthropic Impact Projection</h2>
          </div>
          <p className="mb-4 text-[#94a3b8]">Project your impact from 2024 to 2074.</p>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={sampleProjectionData}>
              <XAxis dataKey="year" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip />
              <Area type="monotone" dataKey="projectedImpact" stroke="#10B981" fill="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center">
            <Users size={24} color="#EC4899" />
            <p className="ml-2 text-[#94a3b8]">Estimated Beneficiaries: 1,000,000 by 2074</p>
            <AlertTriangle className="ml-4" size={24} color="#F59E0B" />
            <p className="ml-2 text-[#94a3b8]">Projections based on current trends.</p>
          </div>
        </section>
      </main>
      <footer className="mt-8 text-center text-gray-500">
        <p>Powered by Philanthropy Insights © 2024</p>
      </footer>
      <PageInsights section="philanthropy-impact-dashboard" />
    </div>
  );
}
