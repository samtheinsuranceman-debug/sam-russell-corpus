// @ts-nocheck

import React, { useState } from 'react';
import { Users, FileText, AlertTriangle, Target, Clock, MessageSquare, ChevronDown, ChevronRight, Copy, Download, Printer, Star, TrendingUp, Shield, DollarSign, Calendar } from 'lucide-react';
import { PageInsights } from "@/components/PageInsights";

export default function AdvisorMeetingPrep() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const talkingPoints = [
    { title: 'Review Client\'s Portfolio Performance', content: 'The client\'s portfolio has grown by $45,000 in the last quarter due to strong equity performance.' },
    { title: 'Discuss Recent Market Changes', content: 'Address the 2% market dip last month and its impact on the client\'s $500,000 investment in tech stocks.' },
    { title: 'Evaluate Insurance Needs', content: 'Recommend increasing life insurance coverage by $250,000 to cover the client\'s growing family needs.' },
    { title: 'Assess Retirement Goals', content: 'Client is on track for retirement at 65, with current savings projected at $1.2 million.' },
    { title: 'Analyze Tax Strategies', content: 'Suggest a Roth IRA conversion to save $8,000 in taxes next year.' },
    { title: 'Review Debt Management', content: 'Client\'s mortgage balance is $300,000; discuss refinancing options to reduce interest by 1%.' },
    { title: 'Explore New Investment Opportunities', content: 'Propose a $100,000 allocation to a diversified ETF with a 7% projected return.' },
    { title: 'Check for Beneficiary Updates', content: 'Ensure estate documents are updated, potentially avoiding $15,000 in unnecessary fees.' },
    { title: 'Discuss Emergency Fund Status', content: 'Client\'s emergency fund covers 6 months of expenses; recommend increasing to $50,000 for better security.' },
    { title: 'Plan for Education Savings', content: 'Allocate $20,000 to a 529 plan for the client\'s child, projecting $150,000 by college age.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-200 p-4 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">Meeting Preparation Intelligence</h1>
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <select className="bg-[#0d1526] border border-[#1e3a5f] p-2 rounded-md">
            <option>Select Client</option>
            <option>Client A</option>
            <option>Client B</option>
            <option>Client C</option>
          </select>
          <input type="date" className="bg-[#0d1526] border border-[#1e3a5f] p-2 rounded-md" />
        </div>
      </header>

      {/* Client Snapshot */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Users className="mr-2" /> Client Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Name:</strong> John Doe
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Age:</strong> 45
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Occupation:</strong> Software Engineer
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Net Worth:</strong> $1,200,000
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Risk Profile:</strong> Moderate
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Active Strategies:</strong> Diversified Equity and Bonds
          </div>
          <div className="bg-[#0d1526] p-4 rounded-md shadow">
            <strong>Last Meeting:</strong> March 15, 2023
          </div>
        </div>
      </section>

      {/* Talking Points */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <FileText className="mr-2" /> Talking Points
        </h2>
        <div className="space-y-2">
          {talkingPoints.map((point, index) => (
            <div key={index} className="bg-[#0d1526] border border-[#1e3a5f] rounded-md">
              <button 
                onClick={() => setExpandedIndex(index === expandedIndex ? null : index)}
                className="w-full text-left p-4 flex justify-between items-center hover:bg-[#162a4a] transition"
              >
                <span>{point.title}</span>
                {expandedIndex === index ? <ChevronDown className="ml-2" /> : <ChevronRight className="ml-2" />}
              </button>
              {expandedIndex === index && (
                <div className="p-4 border-t border-[#1e3a5f]">{point.content}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Risk Alerts */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <AlertTriangle className="mr-2 text-red-500" /> Risk Alerts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d1526] border border-red-500 p-4 rounded-md shadow">
            <AlertTriangle className="inline mr-2 text-red-500" /> Insurance Gap
            <p className="mt-2">Client lacks adequate life insurance coverage, exposing $500,000 in assets.</p>
          </div>
          <div className="bg-[#0d1526] border border-red-500 p-4 rounded-md shadow">
            <AlertTriangle className="inline mr-2 text-red-500" /> Concentration Risk
            <p className="mt-2">Over 60% of portfolio in tech stocks; recommend diversification to mitigate risk.</p>
          </div>
          <div className="bg-[#0d1526] border border-red-500 p-4 rounded-md shadow">
            <AlertTriangle className="inline mr-2 text-red-500" /> Estate Tax Exposure
            <p className="mt-2">Potential $100,000 in taxes upon inheritance; suggest estate planning strategies.</p>
          </div>
        </div>
      </section>

      {/* Product Recommendations */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Target className="mr-2" /> Product Recommendations
        </h2>
        <div className="overflow-x-auto"><table className="w-full bg-[#0d1526] border border-[#1e3a5f] rounded-md overflow-hidden">
          <thead>
            <tr className="border-b border-[#1e3a5f]">
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Fit Score</th>
              <th className="p-3 text-left">Projected Return</th>
              <th className="p-3 text-left">Tax Benefit</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Balanced ETF</td>
              <td className="p-3">85%</td>
              <td className="p-3">7%</td>
              <td className="p-3">Yes</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Roth IRA</td>
              <td className="p-3">90%</td>
              <td className="p-3">6%</td>
              <td className="p-3">Yes</td>
            </tr>
            <tr className="border-b border-[#1e3a5f]">
              <td className="p-3">Term Life Insurance</td>
              <td className="p-3">75%</td>
              <td className="p-3">N/A</td>
              <td className="p-3">No</td>
            </tr>
          </tbody>
        </table></div>
      </section>

      {/* Meeting Agenda */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Clock className="mr-2" /> Meeting Agenda
        </h2>
        <div className="space-y-4">
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 0:00 - Introduction and Welcome
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 0:10 - Review Client Snapshot
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 0:20 - Discuss Talking Points
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 0:40 - Address Risk Alerts
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 0:50 - Product Recommendations
          </div>
          <div className="flex items-center bg-[#0d1526] p-4 rounded-md">
            <Clock className="mr-2" /> 1:00 - Wrap Up and Next Steps
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <div className="flex flex-wrap justify-center space-x-4 mt-6">
        <button className="flex items-center bg-blue-600 p-3 rounded-md hover:bg-blue-700 transition">
          <Copy className="mr-2" /> Copy
        </button>
        <button className="flex items-center bg-green-600 p-3 rounded-md hover:bg-green-700 transition">
          <Download className="mr-2" /> Download
        </button>
        <button className="flex items-center bg-yellow-600 p-3 rounded-md hover:bg-yellow-700 transition">
          <Printer className="mr-2" /> Print
        </button>
        <button className="flex items-center bg-red-600 p-3 rounded-md hover:bg-red-700 transition">
          <MessageSquare className="mr-2" /> Email
        </button>
      </div>
      <PageInsights section="advisor-meeting-prep" />
    </div>
  );
}
