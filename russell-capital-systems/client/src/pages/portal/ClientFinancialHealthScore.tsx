// @ts-nocheck

import React, { useState } from 'react';
import { Heart, Shield, TrendingUp, DollarSign, Home, Briefcase, Umbrella, Scale, Target, Award, ChevronRight, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function ClientFinancialHealthScore() {
  const overallScore = 847;
  const grade = 'A+';

  const categories = [
    { name: 'Tax Efficiency', score: 92, icon: DollarSign },
    { name: 'Retirement Readiness', score: 88, icon: Award },
    { name: 'Insurance Coverage', score: 76, icon: Shield },
    { name: 'Estate Planning', score: 84, icon: Home },
    { name: 'Debt Management', score: 95, icon: Scale },
    { name: 'Investment Diversification', score: 82, icon: TrendingUp },
    { name: 'Emergency Fund', score: 90, icon: Umbrella },
    { name: 'Income Protection', score: 78, icon: Briefcase },
  ];

  const radarChartData = categories.map(cat => ({ subject: cat.name, A: cat.score }));

  const historyData = [
    { month: 'Jan 2023', score: 750 },
    { month: 'Feb 2023', score: 760 },
    { month: 'Mar 2023', score: 770 },
    { month: 'Apr 2023', score: 780 },
    { month: 'May 2023', score: 790 },
    { month: 'Jun 2023', score: 800 },
    { month: 'Jul 2023', score: 810 },
    { month: 'Aug 2023', score: 820 },
    { month: 'Sep 2023', score: 830 },
    { month: 'Oct 2023', score: 840 },
    { month: 'Nov 2023', score: 845 },
    { month: 'Dec 2023', score: 847 },
  ];

  const recommendations = [
    { title: 'Improve Insurance Coverage', improvement: 10, icon: AlertTriangle },
    { title: 'Enhance Emergency Fund', improvement: 5, icon: Info },
    { title: 'Optimize Investments', improvement: 8, icon: Target },
  ];

  const peerData = [
    { name: 'You', score: 847 },
    { name: 'Peers', score: 720 },
    { name: 'Top 10%', score: 900 },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-4">
      {/* HERO Section */}
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative w-64 h-64 animate-pulse">
          <svg className="w-full h-full">
            <circle
              cx="128"
              cy="128"
              r="100"
              fill="none"
              stroke="emerald-500"
              strokeWidth="10"
              strokeDasharray="628"
              strokeDashoffset="0"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <h1 className="text-5xl font-bold text-emerald-400">{overallScore}</h1>
            <p className="text-xl text-blue-300">/1000 ({grade})</p>
          </div>
        </div>
      </div>

      {/* BREAKDOWN Section */}
      <div className="my-8">
        <h2 className="text-2xl text-center mb-4 text-emerald-400">Category Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat, index) => (
            <div key={index} className="bg-[#0d1526] p-4 rounded-lg flex items-center shadow-lg hover:shadow-emerald-500 transition-shadow">
              <cat.icon className="mr-4 text-emerald-400" size={24} />
              <div>
                <h3 className="text-lg font-semibold">{cat.name}</h3>
                <p className="text-blue-300">{cat.score}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RADAR CHART Section */}
      <div className="my-8 bg-[#0d1526] p-6 rounded-lg">
        <h2 className="text-2xl mb-4 text-center text-emerald-400">Category Radar Chart</h2>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={150} data={radarChartData}>
            <PolarGrid stroke="#666" />
            <PolarAngleAxis dataKey="subject" stroke="#fff" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#fff" />
            <Radar name="Score" dataKey="A" stroke="emerald-400" fill="emerald-500" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* HISTORICAL TREND Section */}
      <div className="my-8 bg-[#0d1526] p-6 rounded-lg">
        <h2 className="text-2xl mb-4 text-center text-emerald-400">Historical Score Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={historyData}>
            <XAxis dataKey="month" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="blue-400" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* RECOMMENDATIONS Section */}
      <div className="my-8">
        <h2 className="text-2xl text-center mb-4 text-emerald-400">Recommendations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="bg-[#0d1526] p-4 rounded-lg flex flex-col items-center shadow-lg hover:shadow-blue-500 transition-shadow">
              <rec.icon className="mb-2 text-blue-400" size={32} />
              <h3 className="text-lg font-semibold">{rec.title}</h3>
              <p className="text-emerald-400">Gain {rec.improvement} points</p>
            </div>
          ))}
        </div>
      </div>

      {/* PEER COMPARISON Section */}
      <div className="my-8 bg-[#0d1526] p-6 rounded-lg">
        <h2 className="text-2xl mb-4 text-center text-emerald-400">Peer Comparison</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={peerData}>
            <XAxis dataKey="name" stroke="#fff" />
            <YAxis stroke="#fff" />
            <Tooltip />
            <Legend />
            <Bar dataKey="score" fill="emerald-500" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <PageInsights section="client-financial-health-score" />
    </div>
  );
}
