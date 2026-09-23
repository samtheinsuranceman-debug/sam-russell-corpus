// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Heart, Shield, DollarSign, TrendingUp, Users, CheckCircle2, AlertTriangle, Calendar, Scale, Lock, ArrowRight, Crown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageInsights } from "@/components/PageInsights";

export default function SLATPlanner() {
  const [combinedEstate, setCombinedEstate] = useState(30000000); // Default $30,000,000

  const chartData = useMemo(() => {
    const growthRate = 0.08; // 8% growth rate
    const years = 30;
    const initialWithoutSLAT = combinedEstate;
    const initialWithSLATTrust = 27220000; // $27.22M in trusts
    const initialRemainingEstate = combinedEstate - 27220000; // $2.78M remaining

    return Array.from({ length: years + 1 }, (_, i) => ({
      year: i,
      withoutSLAT: initialWithoutSLAT * Math.pow(1 + growthRate, i),
      withSLATTrust: initialWithSLATTrust * Math.pow(1 + growthRate, i),
      remainingEstate: initialRemainingEstate * Math.pow(1 + growthRate, i),
    }));
  }, [combinedEstate]);

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      {/* HEADER Section */}
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold text-rose-400 mb-4">SLAT Planner — Spousal Limited Access Trust</h1>
        <div className="flex justify-center items-center">
          <DollarSign className="mr-2 text-yellow-500" size={24} />
          <p className="text-xl">Combined Estate Input: </p>
          <input
            type="number"
            value={combinedEstate}
            onChange={(e) => setCombinedEstate(Number(e.target.value))}
            className="ml-2 px-4 py-2 bg-[#0d1526] border border-rose-400 text-rose-400 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="$30,000,000"
          />
        </div>
      </header>

      {/* Exemption under current law: $15M per person in 2026, indexed, no sunset — P.L. 119-21 § 70106 amending IRC § 2010(c)(3), https://www.congress.gov/119/plaws/publ21/PLAW-119publ21.pdf; Rev. Proc. 2025-32, https://www.irs.gov/pub/irs-drop/rp-25-32.pdf (read 23 Sep 2026).
          Was an "Exemption Sunset Warning" ($13.61M → ~$7M in 2026, "use it or lose it"). */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12 flex items-start border-l-4 border-emerald-500">
        <Shield className="mr-4 text-emerald-300" size={32} />
        <div>
          <h2 className="text-2xl font-semibold text-emerald-300 mb-2">Exemption Under Current Law</h2>
          <p className="text-lg">2026 exemption: $15M per person ($30M for a couple), indexed for inflation</p>
          <p className="text-lg">Scheduled sunset: none — P.L. 119-21 (July 2025) made it permanent</p>
          <p className="text-lg text-slate-300">What if Congress lowers it later? Gifts already made under a higher exemption are not clawed back (Treas. Reg. § 20.2010-1(c)).</p>
        </div>
      </div>

      {/* DUAL SLAT STRUCTURE Section — funding at the 2026 exemption ($15M; source above); $15M × 1.08^30 = $150.9M.
          Was $13.61M → $136M. */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-rose-400">
          <h2 className="text-3xl font-bold text-yellow-500 mb-4 flex items-center">
            <Heart className="mr-2" size={24} /> Spouse A's SLAT (for Spouse B)
          </h2>
          <p className="flex items-center mb-2"><DollarSign className="mr-2 text-rose-400" size={20} /> Funding: $15M (full 2026 exemption)</p>
          <p className="flex items-center mb-2"><Users className="mr-2 text-yellow-500" size={20} /> Beneficiary: Spouse B + children</p>
          <p className="flex items-center mb-2"><Shield className="mr-2 text-rose-400" size={20} /> Trustee: Independent trustee</p>
          <p className="flex items-center"><TrendingUp className="mr-2 text-yellow-500" size={20} /> Growth at 8%: $151M in 30 years</p>
        </div>
        <div className="bg-[#0d1526] p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h2 className="text-3xl font-bold text-rose-400 mb-4 flex items-center">
            <Heart className="mr-2" size={24} /> Spouse B's SLAT (for Spouse A)
          </h2>
          <p className="flex items-center mb-2"><DollarSign className="mr-2 text-yellow-500" size={20} /> Funding: $15M (full 2026 exemption)</p>
          <p className="flex items-center mb-2"><Users className="mr-2 text-rose-400" size={20} /> Beneficiary: Spouse A + children</p>
          <p className="flex items-center mb-2"><Shield className="mr-2 text-yellow-500" size={20} /> Trustee: Independent trustee</p>
          <p className="flex items-center"><TrendingUp className="mr-2 text-rose-400" size={20} /> Growth at 8%: $151M in 30 years</p>
        </div>
      </div>

      {/* WEALTH PROJECTION Section */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold text-rose-400 mb-6 flex items-center">
          <TrendingUp className="mr-2" size={28} /> Wealth Projection (Over 30 Years)
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={chartData}>
            <XAxis dataKey="year" stroke="#FFD700" />
            <YAxis stroke="#FFD700" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="withoutSLAT" stroke="#FF6347" fill="#FF6347" name="Without SLAT" />
            <Area type="monotone" dataKey="withSLATTrust" stroke="#FFD700" fill="#FFD700" name="With Dual SLAT Trusts" />
            <Area type="monotone" dataKey="remainingEstate" stroke="#9ACD32" fill="#9ACD32" name="Remaining Estate" />
          </AreaChart>
        </ResponsiveContainer>
        <div className="mt-6 text-lg">
          <p className="flex items-center mb-2"><CheckCircle2 className="mr-2 text-green-500" size={20} /> Without SLAT: $30M grows to $300M, estate tax at 40% = $120M</p>
          <p className="flex items-center mb-2"><CheckCircle2 className="mr-2 text-green-500" size={20} /> With Dual SLAT: $27.22M in trusts grows to $272M, estate tax = $0</p>
          <p className="flex items-center mb-2"><AlertTriangle className="mr-2 text-yellow-500" size={20} /> Remaining $2.78M in estate: Grows to $27.8M, tax = $11.1M</p>
          <p className="flex items-center"><Crown className="mr-2 text-rose-400" size={20} /> NET SAVINGS: $108.9M in estate taxes avoided</p>
        </div>
      </div>

      {/* RECIPROCAL TRUST DOCTRINE WARNING Section */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md mb-12 border-l-4 border-yellow-500">
        <h2 className="text-3xl font-bold text-rose-400 mb-4 flex items-center">
          <Scale className="mr-2" size={28} /> Reciprocal Trust Doctrine Warning
        </h2>
        <ul className="list-disc pl-6 text-lg">
          <li className="mb-2">Must avoid identical terms to prevent IRS challenges.</li>
          <li className="mb-2">Different trustees recommended for each SLAT.</li>
          <li className="mb-2">Use different distribution standards for added distinction.</li>
          <li className="mb-2">Stagger funding dates to avoid reciprocity.</li>
          <li className="mb-2">Implement different investment strategies for each trust.</li>
        </ul>
      </div>

      {/* ACCESS PROVISIONS Section */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg mb-12">
        <h2 className="text-3xl font-bold text-yellow-500 mb-4 flex items-center">
          <Lock className="mr-2" size={28} /> Access Provisions
        </h2>
        <ul className="list-disc pl-6 text-lg">
          <li className="mb-2">HEMS distributions to the beneficiary spouse for health, education, maintenance, and support.</li>
          <li className="mb-2">Loan provisions from the trust to provide indirect access without triggering estate inclusion.</li>
          <li className="mb-2">Trust-owned residence for rent-free use by the beneficiary spouse.</li>
          <li className="mb-2">Trust credit card for approved expenses, ensuring indirect access.</li>
          <li className="mb-2">These provisions allow effective indirect access while removing assets from the estate for tax purposes.</li>
        </ul>
      </div>

      {/* COMPARISON TABLE Section */}
      <div className="bg-gray-700 p-6 rounded-lg shadow-md mb-12">
        <h2 className="text-3xl font-bold text-rose-400 mb-4 flex items-center">
          <ArrowRight className="mr-2" size={28} /> Comparison Table
        </h2>
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0d1526]">
              <th className="p-4 border-b border-rose-400">Feature</th>
              <th className="p-4 border-b border-rose-400">SLAT</th>
              <th className="p-4 border-b border-rose-400">IDGT</th>
              <th className="p-4 border-b border-rose-400">ILIT</th>
              <th className="p-4 border-b border-rose-400">Outright Gift</th>
            </tr>
          </thead>
          <tbody>
            <tr className="even:bg-[#0a0f1a]">
              <td className="p-4 border-b border-[#1e3a5f]">Estate Removal</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
            </tr>
            <tr className="odd:bg-[#0d1526]">
              <td className="p-4 border-b border-[#1e3a5f]">Spouse Access</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">No</td>
              <td className="p-4 border-b border-[#1e3a5f]">No</td>
              <td className="p-4 border-b border-[#1e3a5f]">No</td>
            </tr>
            <tr className="even:bg-[#0a0f1a]">
              <td className="p-4 border-b border-[#1e3a5f]">Income Tax</td>
              <td className="p-4 border-b border-[#1e3a5f]">Grantor</td>
              <td className="p-4 border-b border-[#1e3a5f]">Grantor</td>
              <td className="p-4 border-b border-[#1e3a5f]">Grantor</td>
              <td className="p-4 border-b border-[#1e3a5f]">Donee</td>
            </tr>
            <tr className="odd:bg-[#0d1526]">
              <td className="p-4 border-b border-[#1e3a5f]">Creditor Protection</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">No</td>
            </tr>
            <tr className="even:bg-[#0a0f1a]">
              <td className="p-4 border-b border-[#1e3a5f]">GST Planning</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Yes</td>
              <td className="p-4 border-b border-[#1e3a5f]">Limited</td>
            </tr>
          </tbody>
        </table></div>
      </div>

      {/* IRS COMPLIANCE Section */}
      <div className="bg-[#0d1526] p-6 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-yellow-500 mb-4 flex items-center">
          <Calendar className="mr-2" size={28} /> IRS Compliance
        </h2>
        <ul className="list-disc pl-6 text-lg">
          <li className="mb-2">IRC §2511: Completed gift upon funding the SLAT.</li>
          <li className="mb-2">IRC §2523: Not eligible for marital deduction (intentional design).</li>
          <li className="mb-2">IRC §677: Grantor trust status for income tax purposes.</li>
          <li className="mb-2">Gift tax return (Form 709) required for reporting the transfer.</li>
        </ul>
      </div>
      <PageInsights section="s-l-a-t-planner" />
    </div>
  );
}
