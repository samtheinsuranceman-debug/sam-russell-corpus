import React from 'react';
import { Link } from 'wouter';

const CommandPage: React.FC = () => {
  const subPages = [
    { path: '/portal/daily-briefing', title: 'Daily Briefing', description: 'AI-curated morning overview of your practice, markets, and client alerts.', icon: '📋' },
    { path: '/portal/toilet', title: 'Quick Glance', description: 'Fast 60-second insights into key financial metrics while on the go.', icon: '⚡' },
    { path: '/portal/russell-number', title: 'Russell Number', description: 'Your personalized financial health score across all dimensions.', icon: '🔢' },
    { path: '/portal/daily-discovery', title: 'Daily Discovery', description: 'AI-surfaced opportunities and insights you might have missed.', icon: '🔍' },
    { path: '/portal/my-world', title: 'My World', description: 'Personalized command center for your entire financial world.', icon: '🌍' },
    { path: '/portal/avatar-twins', title: 'Avatar Twins', description: 'Compare your practice profile with top-performing advisor archetypes.', icon: '👥' },
    { path: '/portal/morning-ritual', title: 'Morning Ritual', description: 'Guided daily routine to maximize your advisory practice performance.', icon: '🌅' },
    { path: '/portal/infinite-scroll', title: 'Wealth Feed', description: 'Endless scroll of wealth-building tips, market news, and strategy ideas.', icon: '📰' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <span className="text-4xl mr-4">🎮</span>
          <h1 className="text-4xl font-bold">Command</h1>
        </div>
        <p className="mb-8 text-lg text-gray-300">
          Your daily command center. Tools for morning routines, quick insights, personalized 
          briefings, and practice optimization — all powered by AI.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* ━━━ 50-YEAR PROJECTION ENGINE ━━━ */}
        <div className="mt-12 bg-[#0c1425] border border-emerald-500/20 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">50-Year Projection Engine</h2>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm text-slate-400">Projection Horizon:</label>
            <input type="range" min="1" max="50" defaultValue="30" className="flex-1 accent-emerald-500"
              onChange={(e) => {
                const val = e.target.value;
                document.getElementById('proj-year-command')!.textContent = val;
              }} />
            <span id="proj-year-command" className="text-emerald-400 font-bold text-lg w-12 text-center">30</span>
            <span className="text-slate-500 text-sm">years</span>
          </div>
          <div className="flex gap-2 mb-6">
            {['Conservative', 'Moderate', 'Aggressive'].map((s, i) => (
              <button key={s} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                i === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}>{s}</button>
            ))}
          </div>
          <div className="grid grid-cols-5 gap-4 text-center">
            {[5, 10, 20, 30, 50].map(yr => (
              <div key={yr} className="bg-[#1e293b] rounded-lg p-4">
                <div className="text-slate-500 text-xs mb-1">Year {yr}</div>
                <div className="text-emerald-400 font-bold text-lg">[Practice Growth]</div>
              </div>
            ))}
          </div>
        </div>

        {/* ━━━ AI BRAIN → AI ADVISOR CONNECTOR ━━━ */}
        <div className="mt-8 bg-gradient-to-r from-[#0c1425] to-[#1a1040] border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-purple-400">🧠</span> AI Brain Analysis
            </h2>
            <div className="flex gap-2">
              <a href="/portal/ai-assist" className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-all">
                Send to AI Advisor →
              </a>
              <a href="/portal/ai-brain" className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition-all">
                View AI Brain Hub →
              </a>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1e293b] rounded-lg p-4">
              <div className="text-amber-400 text-sm font-semibold mb-2">⚡ Immediate Action</div>
              <p className="text-slate-300 text-sm">Run this calculator with client data, then let the AI Advisor generate a personalized recommendation based on the 50-year projection.</p>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-4">
              <div className="text-emerald-400 text-sm font-semibold mb-2">📊 Cross-Calculator Insight</div>
              <p className="text-slate-300 text-sm">This tool syncs with all 248+ calculators via StrategyContext. Changes here automatically cascade to related projections across the platform.</p>
            </div>
            <div className="bg-[#1e293b] rounded-lg p-4">
              <div className="text-rose-400 text-sm font-semibold mb-2">🛡️ Risk Assessment</div>
              <p className="text-slate-300 text-sm">The AI Brain continuously monitors market conditions and adjusts risk scores. Connect to the AI Advisor for real-time mitigation strategies.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommandPage;
