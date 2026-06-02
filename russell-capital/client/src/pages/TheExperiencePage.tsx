import React from 'react';
import { Link } from 'wouter';

const TheExperiencePage: React.FC = () => {
  const subPages = [
    { path: '/portal/nerve-center', title: 'Nerve Center', description: 'Central hub for immersive client experiences and presentations.', icon: '🧠' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">✨</span>
          <h1 className="text-4xl font-bold">The Experience</h1>
        </div>
        <p className="mb-8 text-lg text-gray-300">
          Immersive tools that transform financial planning from a chore into 
          an engaging, memorable experience for both advisors and clients.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subPages.map((page) => (
            <Link key={page.path} href={page.path}
              className="bg-[#1a1f2a] border border-white/10 rounded-xl p-6 shadow-lg hover:bg-[#22c55e]/10 hover:scale-105 transition-all duration-300"
            >
              <div className="text-3xl mb-3">{page.icon}</div>
              <h2 className="text-xl font-semibold mb-2">{page.title}</h2>
              <p className="text-gray-400 text-sm">{page.description}</p>
            </Link>
          ))}
        </div>

        {/* AI Strategy Engine Integration */}
        <div className="mt-12 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-emerald-500/30 rounded-xl p-8">
          <div className="flex items-center mb-4">
            <span className="text-3xl mr-3">🧠</span>
            <h2 className="text-2xl font-bold text-emerald-400">AI Strategy Engine — Experience Intelligence</h2>
          </div>
          <p className="text-gray-300 mb-4">
            The AI Brain powers every aspect of The Experience. It dynamically generates personalized client 
            presentations by pulling real-time data from all 248+ calculators, tailoring the narrative to each 
            client's unique financial situation, goals, and risk profile. The result is a cinematic financial 
            planning experience that no other platform can deliver.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">AI-Powered Presentations</h3>
              <p className="text-gray-400 text-sm">The AI Strategy Engine auto-generates client-ready presentations with personalized charts, projections, and strategy recommendations pulled from your calculator results.</p>
            </div>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">Emotional Intelligence</h3>
              <p className="text-gray-400 text-sm">The AI adapts the experience based on client engagement signals — adjusting complexity, pacing, and emphasis to maximize understanding and buy-in.</p>
            </div>
            <div className="bg-[#0f172a] border border-white/10 rounded-lg p-4">
              <h3 className="text-emerald-400 font-semibold mb-2">Real-Time Scenario Modeling</h3>
              <p className="text-gray-400 text-sm">During live client meetings, the AI can instantly model "what-if" scenarios across all connected calculators, creating an interactive experience that builds trust.</p>
            </div>
          </div>
          <Link href="/portal/ai-brain" className="mt-6 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
            Open AI Brain Hub →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TheExperiencePage;
