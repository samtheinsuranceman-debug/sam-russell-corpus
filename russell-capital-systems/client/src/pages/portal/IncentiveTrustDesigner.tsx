// @ts-nocheck

import React, { useState, useMemo } from 'react';
import { Award, DollarSign, TrendingUp, Target, Calendar, Percent, ArrowRight, Shield, CheckCircle2, AlertTriangle, Users, Star } from 'lucide-react';
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { PageInsights } from "@/components/PageInsights";

const IncentiveTrustDesigner = () => {
  // State for incentive categories
  const [educationIncentives, setEducationIncentives] = useState('');
  const [careerIncentives, setCareerIncentives] = useState('');
  const [philanthropyIncentives, setPhilanthropyIncentives] = useState('');
  const [healthIncentives, setHealthIncentives] = useState('');
  const [familyIncentives, setFamilyIncentives] = useState('');

  // State for distribution triggers
  const [triggers, setTriggers] = useState([
    { id: 1, description: 'Achieve degree', condition: '' },
    { id: 2, description: 'Job milestone', condition: '' },
  ]);

  // State for protections
  const [spendthriftProtection, setSpendthriftProtection] = useState(false);
  const [substanceAbuseProvisions, setSubstanceAbuseProvisions] = useState(false);
  const [matchingDistribution, setMatchingDistribution] = useState(0); // Percentage

  // State for trustee guidelines
  const [trusteeGuidelines, setTrusteeGuidelines] = useState('');

  // State for projection data
  const [projectionData, setProjectionData] = useState([
    { year: 0, value: 100000 },
    { year: 10, value: 150000 },
    { year: 20, value: 200000 },
    { year: 30, value: 250000 },
    { year: 40, value: 300000 },
    { year: 50, value: 350000 },
  ]);

  // State for compliance selections
  const [complianceOptions, setComplianceOptions] = useState({
    utcSection411: false,
    section814: false,
    stateSpendthrift: false,
    claflinDoctrine: false,
    inReEstate: false,
    publicPolicy: false,
  });

  // Memoized chart data for 50-year projection
  const memoizedProjectionData = useMemo(() => projectionData, [projectionData]);

  // Sample data for charts
  const radarData = [
    { subject: 'Education', A: 80, fullMark: 100 },
    { subject: 'Career', A: 70, fullMark: 100 },
    { subject: 'Philanthropy', A: 90, fullMark: 100 },
    { subject: 'Health', A: 85, fullMark: 100 },
    { subject: 'Family', A: 75, fullMark: 100 },
  ];

  const barData = [
    { name: 'Year 10', value: 150000 },
    { name: 'Year 20', value: 200000 },
    { name: 'Year 30', value: 250000 },
    { name: 'Year 40', value: 300000 },
    { name: 'Year 50', value: 350000 },
  ];

  const pieData = [
    { name: 'Education', value: 30 },
    { name: 'Career', value: 25 },
    { name: 'Philanthropy', value: 20 },
    { name: 'Health', value: 15 },
    { name: 'Family', value: 10 },
  ];

  const COLORS = ['#10B981', '#F59E0B', '#6366F1', '#EC4899', '#6366f1']; // Emerald, Amber accents

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-gray-100 p-8 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-400 flex items-center">
          <Award className="mr-2" /> Incentive Trust Designer
        </h1>
        <p className="text-[#7a95b8]">Build and visualize incentive trusts with behavioral provisions.</p>
      </header>

      {/* Incentive Provision Categories Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center">
          <Target className="mr-2" /> Incentive Provision Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[#94a3b8]">Education Incentives</label>
            <input
              type="text"
              value={educationIncentives}
              onChange={(e) => setEducationIncentives(e.target.value)}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
              placeholder="e.g., Funding for college degrees"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8]">Career Incentives</label>
            <input
              type="text"
              value={careerIncentives}
              onChange={(e) => setCareerIncentives(e.target.value)}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
              placeholder="e.g., Bonuses for promotions"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8]">Philanthropy Incentives</label>
            <input
              type="text"
              value={philanthropyIncentives}
              onChange={(e) => setPhilanthropyIncentives(e.target.value)}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
              placeholder="e.g., Matching donations"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8]">Health Incentives</label>
            <input
              type="text"
              value={healthIncentives}
              onChange={(e) => setHealthIncentives(e.target.value)}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
              placeholder="e.g., Rewards for fitness goals"
            />
          </div>
          <div>
            <label className="block text-[#94a3b8]">Family Incentives</label>
            <input
              type="text"
              value={familyIncentives}
              onChange={(e) => setFamilyIncentives(e.target.value)}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
              placeholder="e.g., Support for family planning"
            />
          </div>
        </div>
      </section>

      {/* Distribution Trigger Builder Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4 flex items-center">
          <Calendar className="mr-2" /> Distribution Trigger Builder
        </h2>
        {triggers.map((trigger) => (
          <div key={trigger.id} className="mb-4 p-4 bg-[#0d1526] rounded shadow">
            <input
              type="text"
              value={trigger.condition}
              onChange={(e) => {
                const newTriggers = triggers.map(t => t.id === trigger.id ? { ...t, condition: e.target.value } : t);
                setTriggers(newTriggers);
              }}
              className="w-full p-2 rounded bg-gray-700 border border-[#1e3a5f] text-gray-100"
              placeholder={`Condition for ${trigger.description}`}
            />
          </div>
        ))}
        <button
          onClick={() => setTriggers([...triggers, { id: triggers.length + 1, description: 'New Trigger', condition: '' }])}
          className="bg-amber-500 hover:bg-amber-600 text-gray-900 px-4 py-2 rounded flex items-center"
        >
          <ArrowRight className="mr-2" /> Add Trigger
        </button>
      </section>

      {/* Protections Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center">
          <Shield className="mr-2" /> Protections and Provisions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={spendthriftProtection}
                onChange={() => setSpendthriftProtection(!spendthriftProtection)}
                className="mr-2"
              />
              <Shield className="mr-2" /> Spendthrift Protection
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={substanceAbuseProvisions}
                onChange={() => setSubstanceAbuseProvisions(!substanceAbuseProvisions)}
                className="mr-2"
              />
              <AlertTriangle className="mr-2" /> Substance Abuse Provisions
            </label>
          </div>
          <div>
            <label className="block text-[#94a3b8]">Matching Distribution Program (%)</label>
            <input
              type="number"
              value={matchingDistribution}
              onChange={(e) => setMatchingDistribution(Number(e.target.value))}
              className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Trustee Discretion Guidelines Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4 flex items-center">
          <Users className="mr-2" /> Trustee Discretion Guidelines
        </h2>
        <textarea
          value={trusteeGuidelines}
          onChange={(e) => setTrusteeGuidelines(e.target.value)}
          className="w-full p-2 rounded bg-[#0d1526] border border-[#1e3a5f] text-gray-100 h-32"
          placeholder="Define guidelines for trustee decisions..."
        />
      </section>

      {/* 50-Year Beneficiary Outcome Projection Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold text-amber-400 mb-4 flex items-center">
          <TrendingUp className="mr-2" /> 50-Year Beneficiary Outcome Projection
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={memoizedProjectionData}>
            <XAxis dataKey="year" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#10B981" />
          </BarChart>
        </ResponsiveContainer>
        <p className="mt-4 text-[#7a95b8]">Projection based on current incentives. Adjust data to see changes.</p>
      </section>

      {/* Additional Charts for Visualization */}
      <section className="mb-12">
        <h3 className="text-xl font-semibold text-emerald-400 mb-4">Incentive Radar Chart</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart outerRadius={90} data={radarData}>
            <PolarGrid stroke="#4B5563" />
            <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#9CA3AF" />
            <Radar name="Incentives" dataKey="A" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.6} />
            <Legend />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </section>

      <section className="mb-12">
        <h3 className="text-xl font-semibold text-amber-400 mb-4">Category Distribution Pie Chart</h3>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
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
        <h2 className="text-2xl font-semibold text-emerald-400 mb-4 flex items-center">
          <CheckCircle2 className="mr-2" /> Compliance and Legal Provisions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.utcSection411}
                onChange={() => setComplianceOptions({ ...complianceOptions, utcSection411: !complianceOptions.utcSection411 })}
                className="mr-2"
              />
              <Star className="mr-2" /> UTC Section 411 Modification
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.section814}
                onChange={() => setComplianceOptions({ ...complianceOptions, section814: !complianceOptions.section814 })}
                className="mr-2"
              />
              <Shield className="mr-2" /> Section 814 Accumulation Trusts
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.stateSpendthrift}
                onChange={() => setComplianceOptions({ ...complianceOptions, stateSpendthrift: !complianceOptions.stateSpendthrift })}
                className="mr-2"
              />
              <AlertTriangle className="mr-2" /> State Spendthrift Trust Statutes
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.claflinDoctrine}
                onChange={() => setComplianceOptions({ ...complianceOptions, claflinDoctrine: !complianceOptions.claflinDoctrine })}
                className="mr-2"
              />
              <CheckCircle2 className="mr-2" /> Claflin Doctrine
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.inReEstate}
                onChange={() => setComplianceOptions({ ...complianceOptions, inReEstate: !complianceOptions.inReEstate })}
                className="mr-2"
              />
              <Users className="mr-2" /> In re Estate of Feinberg
            </label>
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={complianceOptions.publicPolicy}
                onChange={() => setComplianceOptions({ ...complianceOptions, publicPolicy: !complianceOptions.publicPolicy })}
                className="mr-2"
              />
              <AlertTriangle className="mr-2" /> Public Policy Limitations
            </label>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-[#7a95b8]">
        <p>Designed with dark theme and emerald/amber accents for optimal visualization.</p>
      </footer>
      <PageInsights section="incentive-trust-designer" />
    </div>
  );
};

export default IncentiveTrustDesigner;
