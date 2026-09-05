import { useState, useMemo } from 'react';
import { useAIBrain, AIBrainProvider } from '@/contexts/AIBrainContext';
import { useUnifiedDataBus, FEATURE_RELATIONSHIPS, type DataEntry } from '@/contexts/UnifiedDataBusContext';

function AIBrainHubContent() {
  const { state, getAllRecommendations, getFinancialHealth, getUnifiedSnapshot } = useAIBrain();
  const { entries, getTotalDataPoints, getRecentEntries } = useUnifiedDataBus();
  const [activeTab, setActiveTab] = useState('Neural Dashboard');
  const allRecs = getAllRecommendations();
  const health = getFinancialHealth();
  const snapshot = getUnifiedSnapshot();
  const recentEntries = getRecentEntries(20);
  const totalDataPoints = getTotalDataPoints();

  const tabs = [
    'Neural Dashboard', 'Cross-Tool Intelligence', 'Data Flow Map',
    'AI Recommendations', 'Feature Connections', 'System Health'
  ];

  const siEntries = useMemo(() => entries.filter(e => e.category === 'si-engine'), [entries]);
  const aiProEntries = useMemo(() => entries.filter(e => e.category === 'ai-pro-suite'), [entries]);
  const calcEntries = useMemo(() => entries.filter(e => e.category === 'calculator'), [entries]);

  const priorityColors: Record<string, string> = {
    critical: 'border-red-500/50 bg-red-500/10',
    high: 'border-amber-500/50 bg-amber-500/10',
    medium: 'border-blue-500/50 bg-blue-500/10',
    low: 'border-gray-500/50 bg-gray-500/10',
  };

  const priorityBadge: Record<string, string> = {
    critical: 'bg-red-500 text-white',
    high: 'bg-amber-500 text-white',
    medium: 'bg-blue-500 text-white',
    low: 'bg-gray-500 text-white',
  };

  const categoryColor: Record<string, string> = {
    'calculator': 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
    'si-engine': 'text-purple-400 bg-purple-500/20 border-purple-500/30',
    'ai-pro-suite': 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30',
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-gray-300 p-6">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-white text-5xl font-bold tracking-wider">
          AI Brain Command Center
        </h1>
        <p className="text-gray-400 text-lg mt-2">
          Unified Intelligence Hub — {entries.length} Features Connected, {totalDataPoints} Data Points Flowing
        </p>
        {/* Live Stats Bar */}
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></span>
            <span className="text-indigo-400 font-semibold">{snapshot.calculators} Calculators</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></span>
            <span className="text-purple-400 font-semibold">{snapshot.siEngines} SI Engines</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse"></span>
            <span className="text-cyan-400 font-semibold">{snapshot.aiProFeatures} AI Pro Features</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-green-400 font-semibold">{state.confidenceScore}% Confidence</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                : 'bg-[#1e293b] text-gray-400 hover:bg-[#2d3748]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'Neural Dashboard' && (
          <div className="space-y-6">
            {/* Live Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#1e293b] p-6 rounded-lg border border-indigo-500/30">
                <div className="text-gray-400 text-sm mb-1">Total Connected Features</div>
                <div className="text-4xl font-bold text-white">{entries.length}</div>
                <div className="text-indigo-400 text-xs mt-1">of 164 possible</div>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-lg border border-purple-500/30">
                <div className="text-gray-400 text-sm mb-1">Data Points Processed</div>
                <div className="text-4xl font-bold text-white">{totalDataPoints}</div>
                <div className="text-purple-400 text-xs mt-1">across all sources</div>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-lg border border-cyan-500/30">
                <div className="text-gray-400 text-sm mb-1">AI Insights Generated</div>
                <div className="text-4xl font-bold text-white">{allRecs.length}</div>
                <div className="text-cyan-400 text-xs mt-1">{allRecs.filter(r => r.priority === 'critical').length} critical</div>
              </div>
              <div className="bg-[#1e293b] p-6 rounded-lg border border-emerald-500/30">
                <div className="text-gray-400 text-sm mb-1">Financial Health</div>
                <div className={`text-4xl font-bold ${health.score >= 80 ? 'text-emerald-400' : health.score >= 60 ? 'text-amber-400' : health.score > 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {health.score > 0 ? `${health.score}/100` : 'N/A'}
                </div>
                <div className="text-emerald-400 text-xs mt-1">{health.breakdown.length} categories scored</div>
              </div>
            </div>

            {/* Intelligence Engines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Calculator Intelligence', count: calcEntries.length, total: 105, color: 'indigo', desc: 'Tax, retirement, insurance, estate, and physician-specific calculators feeding real-time financial analysis' },
                { name: 'Sister Invention Engines', count: siEntries.length, total: 27, color: 'purple', desc: 'IUL compliance, carrier strength, client retention, generational wealth, and 23 more proprietary engines' },
                { name: 'AI Pro Suite Features', count: aiProEntries.length, total: 32, color: 'cyan', desc: 'Strategy lab, risk dashboard, wealth simulator, deal closer, and 28 more advanced AI features' },
              ].map((module) => (
                <div key={module.name} className={`bg-[#1e293b] p-6 rounded-lg border ${module.color === 'indigo' ? 'border-indigo-500/30' : module.color === 'purple' ? 'border-purple-500/30' : 'border-cyan-500/30'}`}>
                  <h3 className="text-white text-xl font-bold">{module.name}</h3>
                  <p className="text-gray-400 text-sm mt-1">{module.desc}</p>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Active</span>
                      <span className={`font-semibold ${module.color === 'indigo' ? 'text-indigo-400' : module.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'}`}>{module.count} / {module.total}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${module.color === 'indigo' ? 'bg-indigo-500' : module.color === 'purple' ? 'bg-purple-500' : 'bg-cyan-500'}`} style={{ width: `${Math.min(100, (module.count / module.total) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confidence Score */}
            <div className="bg-[#1e293b] p-6 rounded-lg border border-emerald-500/30">
              <h2 className="text-white text-2xl font-bold mb-2">AI Brain Confidence Score: {state.confidenceScore}%</h2>
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${state.confidenceScore}%` }}></div>
              </div>
              <p className="text-gray-400 text-sm mt-2">Confidence increases as more features report data. Connect all 164 features for maximum accuracy.</p>
            </div>
          </div>
        )}

        {activeTab === 'Cross-Tool Intelligence' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] p-6 rounded-lg border border-indigo-500/30">
              <h2 className="text-white text-2xl font-bold mb-4">Live Data Stream</h2>
              <p className="text-gray-400 mb-4">Real-time data flowing from all connected features into the AI Brain</p>
              {recentEntries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No data flowing yet</p>
                  <p className="text-sm mt-1">Run calculators, SI engines, or AI Pro features to see live data here</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {recentEntries.map((entry, i) => (
                    <DataEntryCard key={`${entry.featureId}-${i}`} entry={entry} categoryColor={categoryColor} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Data Flow Map' && (
          <div className="space-y-6">
            <div className="bg-[#1e293b] p-6 rounded-lg border border-indigo-500/30">
              <h2 className="text-white text-2xl font-bold mb-4">Feature Interconnection Map</h2>
              <p className="text-gray-400 mb-6">How all 164 features feed into each other and the AI Brain</p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h3 className="text-indigo-400 font-semibold text-center mb-3">Data Sources</h3>
                  {[
                    { label: '105 Calculators', count: calcEntries.length, color: 'indigo' },
                    { label: '27 SI Engines', count: siEntries.length, color: 'purple' },
                    { label: '32 AI Pro Features', count: aiProEntries.length, color: 'cyan' },
                  ].map(src => (
                    <div key={src.label} className={`bg-[#0f172a] p-4 rounded-lg border ${src.color === 'indigo' ? 'border-indigo-500/30' : src.color === 'purple' ? 'border-purple-500/30' : 'border-cyan-500/30'} text-center`}>
                      <div className={`font-bold text-xl ${src.color === 'indigo' ? 'text-indigo-400' : src.color === 'purple' ? 'text-purple-400' : 'text-cyan-400'}`}>{src.count}</div>
                      <div className="text-gray-400 text-sm">{src.label}</div>
                      <div className="text-gray-500 text-xs mt-1">active</div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center">
                  <div className="bg-gradient-to-br from-indigo-600/30 to-purple-600/30 p-8 rounded-2xl border-2 border-indigo-500/50 text-center relative">
                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-2xl animate-pulse">&larr;</div>
                    <div className="absolute -right-4 top-1/2 -translate-y-1/2 text-cyan-400 text-2xl animate-pulse">&rarr;</div>
                    <div className="text-4xl mb-2">&#x1f9e0;</div>
                    <div className="text-white text-xl font-bold">AI Brain</div>
                    <div className="text-gray-300 text-sm mt-1">{totalDataPoints} data points</div>
                    <div className="text-emerald-400 text-sm font-semibold mt-1">{state.confidenceScore}% confidence</div>
                    <div className="text-gray-400 text-xs mt-2">{allRecs.length} insights generated</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-emerald-400 font-semibold text-center mb-3">AI Outputs</h3>
                  {[
                    { label: 'AI Advisor Widget', desc: 'Floating recommendations', icon: '&#x1f4a1;' },
                    { label: 'AI Assist Page', desc: 'Full strategy analysis', icon: '&#x1f3af;' },
                    { label: 'Cross-Feature Insights', desc: 'Synergy detection', icon: '&#x1f517;' },
                    { label: 'Financial Health Score', desc: `${health.score}/100`, icon: '&#x2764;&#xfe0f;' },
                  ].map(out => (
                    <div key={out.label} className="bg-[#0f172a] p-3 rounded-lg border border-emerald-500/30 flex items-center gap-3">
                      <span className="text-2xl" dangerouslySetInnerHTML={{ __html: out.icon }}></span>
                      <div>
                        <div className="text-white text-sm font-medium">{out.label}</div>
                        <div className="text-gray-500 text-xs">{out.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-lg border border-purple-500/30">
              <h3 className="text-white text-xl font-bold mb-4">Feature Relationships ({FEATURE_RELATIONSHIPS.length} connections)</h3>
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#1e293b]">
                    <tr className="text-gray-400 border-b border-gray-700">
                      <th className="text-left py-2 px-3">Source</th>
                      <th className="text-left py-2 px-3">Relationship</th>
                      <th className="text-left py-2 px-3">Target</th>
                      <th className="text-left py-2 px-3">Data Keys</th>
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURE_RELATIONSHIPS.slice(0, 30).map((rel, i) => (
                      <tr key={i} className="border-b border-gray-800 hover:bg-[#0f172a]">
                        <td className="py-2 px-3 text-indigo-300">{rel.sourceId}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            rel.relationship === 'feeds-into' ? 'bg-emerald-500/20 text-emerald-300' :
                            rel.relationship === 'validates' ? 'bg-amber-500/20 text-amber-300' :
                            rel.relationship === 'depends-on' ? 'bg-red-500/20 text-red-300' :
                            'bg-blue-500/20 text-blue-300'
                          }`}>
                            {rel.relationship}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-cyan-300">{rel.targetId}</td>
                        <td className="py-2 px-3 text-gray-500 text-xs">{rel.dataKeys.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'AI Recommendations' && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] p-6 rounded-lg border border-emerald-500/30">
              <h2 className="text-white text-2xl font-bold mb-4">All AI Recommendations ({allRecs.length})</h2>
              {allRecs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-lg">No recommendations yet</p>
                  <p className="text-sm mt-1">Run calculators and features to generate AI-powered insights</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {allRecs.map(rec => (
                    <div key={rec.id} className={`p-4 rounded-lg border ${priorityColors[rec.priority]}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${priorityBadge[rec.priority]}`}>
                          {rec.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-gray-700 text-gray-300">{rec.category}</span>
                        <span className="text-gray-500 text-xs ml-auto">{rec.confidence}% confidence</span>
                      </div>
                      <p className="text-white font-medium">{rec.title}</p>
                      <p className="text-gray-300 text-sm mt-1">{rec.description}</p>
                      {rec.relatedTools.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.relatedTools.map(tool => (
                            <span key={tool} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">{tool}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Feature Connections' && (
          <div className="space-y-6">
            {[
              { title: 'Calculator Features', data: calcEntries, color: 'indigo', borderClass: 'border-indigo-500/30' },
              { title: 'Sister Invention Engines', data: siEntries, color: 'purple', borderClass: 'border-purple-500/30' },
              { title: 'AI Pro Suite Features', data: aiProEntries, color: 'cyan', borderClass: 'border-cyan-500/30' },
            ].map(group => (
              <div key={group.title} className={`bg-[#1e293b] p-6 rounded-lg border ${group.borderClass}`}>
                <h3 className="text-white text-xl font-bold mb-4">{group.title} ({group.data.length} active)</h3>
                {group.data.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No features reporting data yet. Run features in this category to see them here.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.data.map(entry => (
                      <div key={entry.featureId} className="bg-[#0f172a] p-3 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                          <span className="text-white text-sm font-medium">{entry.featureName}</span>
                        </div>
                        <div className="text-gray-500 text-xs">{Object.keys(entry.payload).length} data points</div>
                        <div className="text-gray-600 text-xs mt-1">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'System Health' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1e293b] p-6 rounded-lg border border-emerald-500/30">
                <h3 className="text-white text-xl font-bold mb-4">System Status</h3>
                <div className="space-y-3">
                  {[
                    { label: 'AI Brain', status: state.connectionStatus, detail: `${state.confidenceScore}% confidence` },
                    { label: 'UnifiedDataBus', status: 'connected' as const, detail: `${entries.length} features, ${totalDataPoints} data points` },
                    { label: 'Calculator Bridge', status: 'connected' as const, detail: `${calcEntries.length} calculators synced` },
                    { label: 'SI Engine Pipeline', status: siEntries.length > 0 ? 'connected' as const : 'syncing' as const, detail: `${siEntries.length} engines active` },
                    { label: 'AI Pro Suite Pipeline', status: aiProEntries.length > 0 ? 'connected' as const : 'syncing' as const, detail: `${aiProEntries.length} features active` },
                    { label: 'Recommendation Engine', status: 'connected' as const, detail: `${allRecs.length} insights generated` },
                  ].map(sys => (
                    <div key={sys.label} className="flex items-center justify-between p-3 bg-[#0f172a] rounded">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${sys.status === 'connected' ? 'bg-green-500' : sys.status === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span className="text-white text-sm">{sys.label}</span>
                      </div>
                      <span className="text-gray-400 text-xs">{sys.detail}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#1e293b] p-6 rounded-lg border border-indigo-500/30">
                <h3 className="text-white text-xl font-bold mb-4">Health Breakdown</h3>
                {health.breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {health.breakdown.map(cat => (
                      <div key={cat.category}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 capitalize">{cat.label}</span>
                          <span className={`font-semibold ${cat.score >= 80 ? 'text-emerald-400' : cat.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>
                            {cat.score}/100
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${cat.score >= 80 ? 'bg-emerald-500' : cat.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${cat.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Run calculators to generate health scores</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1e293b] p-6 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white text-lg font-bold">Last Sync</h3>
                  <p className="text-gray-400 text-sm">{state.lastSync.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-sm">Feature Relationships Mapped</div>
                  <div className="text-indigo-400 font-bold text-2xl">{FEATURE_RELATIONSHIPS.length}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ━━━ AI BRAIN → AI ADVISOR CONNECTOR ━━━ */}
      <div className="mt-8 bg-gradient-to-r from-[#0c1425] to-[#1a1040] border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">&#x1f9e0;</span> AI Brain &harr; All Features Connected
          </h2>
          <div className="flex gap-2">
            <a href="/portal/ai-assist" className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-all">
              Send to AI Advisor &rarr;
            </a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-amber-400 text-sm font-semibold mb-2">&#x26a1; Unified Intelligence</div>
            <p className="text-slate-300 text-sm">All 164 features (105 calculators + 27 SI engines + 32 AI Pro Suite) feed data into the AI Brain in real-time for holistic analysis.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-emerald-400 text-sm font-semibold mb-2">&#x1f4ca; Cross-Feature Synergy</div>
            <p className="text-slate-300 text-sm">The AI Brain detects patterns across all tools — tax strategies inform estate plans, insurance analysis feeds retirement projections, and compliance checks validate everything.</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-4">
            <div className="text-rose-400 text-sm font-semibold mb-2">&#x1f6e1;&#xfe0f; Continuous Monitoring</div>
            <p className="text-slate-300 text-sm">Every calculation, engine run, and AI analysis is captured and cross-referenced. The more features you use, the smarter the AI Brain becomes.</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

function DataEntryCard({ entry, categoryColor }: { entry: DataEntry; categoryColor: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const colorClass = categoryColor[entry.category] || 'text-gray-400 bg-gray-500/20 border-gray-500/30';

  return (
    <div className="bg-[#0f172a] p-4 rounded-lg border border-gray-700 cursor-pointer hover:border-gray-600 transition-all" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
          <span className="text-white font-medium text-sm">{entry.featureName}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] border ${colorClass}`}>
            {entry.category}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-gray-500 text-xs">{Object.keys(entry.payload).length} data points</span>
          <span className="text-gray-600 text-xs">{new Date(entry.timestamp).toLocaleTimeString()}</span>
          <span className="text-gray-500">{expanded ? '\u25b2' : '\u25bc'}</span>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(entry.payload).slice(0, 12).map(([key, value]) => (
              <div key={key} className="bg-[#1e293b] p-2 rounded text-xs">
                <div className="text-gray-500">{key}</div>
                <div className="text-white font-medium truncate">
                  {typeof value === 'number' ? value.toLocaleString() : String(value)}
                </div>
              </div>
            ))}
          </div>
          {Object.keys(entry.payload).length > 12 && (
            <p className="text-gray-600 text-xs mt-2">+{Object.keys(entry.payload).length - 12} more data points</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AIBrainHubPage() {
  return (
    <AIBrainProvider>
      <AIBrainHubContent />
    </AIBrainProvider>
  );
}
