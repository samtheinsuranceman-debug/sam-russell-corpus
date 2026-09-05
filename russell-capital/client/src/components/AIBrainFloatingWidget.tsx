import React, { useState } from 'react';
import { useAIBrain } from '@/contexts/AIBrainContext';
import { useUnifiedDataBus } from '@/contexts/UnifiedDataBusContext';

const AIBrainFloatingWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const { state: brainState, getAllRecommendations, getUnifiedSnapshot } = useAIBrain();
  const { getTotalDataPoints, getRecentEntries } = useUnifiedDataBus();
  const recs = getAllRecommendations();
  const snapshot = getUnifiedSnapshot();
  const recentEntries = getRecentEntries(3);
  const totalActive = snapshot.calculators + snapshot.siEngines + snapshot.aiProFeatures;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="bg-[#0b1628]/95 backdrop-blur-md p-5 rounded-xl shadow-xl w-96 border border-emerald-500/30 relative overflow-hidden"
          style={{
            boxShadow: '0 10px 30px -15px rgba(0, 255, 128, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-white text-lg font-semibold flex items-center">
                AI Brain
                <span className="ml-2 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  {brainState.confidenceScore}%
                </span>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Unified Data Flow Status Bar */}
            <div className="bg-[#0f1e35] rounded-lg p-3 mb-3 border border-[#12233e]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-[#7a95b8] font-medium uppercase tracking-wider">Unified Data Flow</span>
                <span className="text-[10px] text-green-400">{getTotalDataPoints()} pts</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                  <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min((totalActive / 164) * 100, 100)}%` }}></div>
                </div>
                <span className="text-[10px] text-white font-bold">{totalActive}/164</span>
              </div>
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-indigo-400 font-bold text-xs">{snapshot.calculators}</div>
                  <div className="text-[7px] text-[#7a95b8]">CALC</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold text-xs">{snapshot.siEngines}</div>
                  <div className="text-[7px] text-[#7a95b8]">SI</div>
                </div>
                <div>
                  <div className="text-cyan-400 font-bold text-xs">{snapshot.aiProFeatures}</div>
                  <div className="text-[7px] text-[#7a95b8]">PRO</div>
                </div>
              </div>
            </div>

            {/* Top Recommendations */}
            <div className="space-y-2 mb-3 max-h-44 overflow-y-auto">
              {recs.length > 0 ? recs.slice(0, 4).map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 bg-[#0f1e35] rounded-lg border border-[#12233e] hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        rec.priority === 'critical' ? 'bg-red-500' :
                        rec.priority === 'high' ? 'bg-amber-500' :
                        rec.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}></span>
                      <p className="text-white font-medium text-sm">{rec.title}</p>
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                      {rec.confidence}%
                    </span>
                  </div>
                  <p className="text-[#7a95b8] text-xs ml-3">{rec.description}</p>
                </div>
              )) : (
                <div className="text-center py-4 text-[#7a95b8] text-xs">
                  Run any feature to see AI recommendations
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentEntries.length > 0 && (
              <div className="mb-3 bg-[#0f1e35] rounded-lg p-2 border border-[#12233e]">
                <div className="text-[9px] text-[#7a95b8] mb-1 uppercase tracking-wider">Recent Activity</div>
                {recentEntries.map((e, i) => (
                  <div key={`${e.featureId}-${i}`} className="flex items-center gap-1.5 py-0.5 text-[10px]">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    <span className="text-white truncate flex-1">{e.featureName}</span>
                    <span className="text-gray-600">{new Date(e.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <a href="/portal/ai-assist" className="flex items-center justify-center gap-1.5 p-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-white rounded-lg transition-colors text-xs">
                <span>AI Advisor</span>
              </a>
              <a href="/portal/ai-brain" className="flex items-center justify-center gap-1.5 p-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-white rounded-lg transition-colors text-xs">
                <span>Brain Hub</span>
              </a>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask the AI Brain anything..."
              className="w-full p-2 bg-[#0f1e35] text-white rounded-lg border border-[#12233e] focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-500 text-sm"
            />
          </div>
        </div>
      </div>

      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center bg-[#0b1628]/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-emerald-500/30 hover:border-emerald-500/50 transition-all group"
          style={{
            boxShadow: '0 4px 10px -2px rgba(0, 255, 128, 0.15)',
          }}
        >
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium text-sm">AI</span>
          {totalActive > 0 && (
            <span className="ml-2 text-[10px] text-emerald-400 bg-emerald-900/30 px-1.5 py-0.5 rounded-full group-hover:bg-emerald-900/50">
              {totalActive}
            </span>
          )}
        </button>
      )}
    </div>
  );
};

export default AIBrainFloatingWidget;
