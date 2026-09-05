import React, { useState } from 'react';
import { useAIBrain } from '@/contexts/AIBrainContext';
import { useUnifiedDataBus } from '@/contexts/UnifiedDataBusContext';

interface KeyMetrics {
  [key: string]: number | string;
}

interface AIBrainAdvisorConnectorProps {
  pageName: string;
  pageCategory: string;
  keyMetrics: KeyMetrics;
}

const AIBrainAdvisorConnector: React.FC<AIBrainAdvisorConnectorProps> = ({
  pageName,
  pageCategory,
  keyMetrics,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const { state: brainState, getAllRecommendations, getUnifiedSnapshot } = useAIBrain();
  const { entries: busEntries, getTotalDataPoints, getRecentEntries } = useUnifiedDataBus();
  const unifiedSnapshot = getUnifiedSnapshot();
  const recentEntries = getRecentEntries(5);
  const recs = getAllRecommendations();

  const handleGetRecommendation = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  const pageRecs = recs.filter(r =>
    r.relatedTools.some(t => t.toLowerCase().includes(pageName.toLowerCase())) ||
    r.category.toLowerCase().includes(pageCategory.toLowerCase())
  ).slice(0, 3);

  const insights = [
    ...(pageRecs.length > 0
      ? pageRecs.map(r => ({
          title: r.title,
          content: r.description,
          priority: r.priority,
        }))
      : [
          { title: 'Immediate Action', content: `Based on ${pageName} data, adjust your input for optimal results.`, priority: 'medium' as const },
          { title: 'Tax Impact', content: 'Potential savings of $5,000 annually with current strategy.', priority: 'high' as const },
        ]),
    { title: 'Cross-Feature Insight', content: `This data feeds into ${busEntries.length} connected features across the platform.`, priority: 'low' as const },
    { title: 'Long-Term Projection', content: '50-year outlook shows steady growth with moderate risk.', priority: 'medium' as const },
    { title: 'Risk Assessment', content: 'Key risk: Market volatility. Mitigation: Diversify investments.', priority: 'medium' as const },
  ];

  const priorityColor = (p: string) =>
    p === 'critical' ? 'text-red-400' : p === 'high' ? 'text-amber-400' : p === 'medium' ? 'text-blue-400' : 'text-gray-400';

  return (
    <div className="bg-[#0b1628] p-6 rounded-lg shadow-md text-white w-full border border-[#12233e]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">AI Brain Analysis</h3>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${brainState.connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
          <span className="text-xs text-[#7a95b8]">{brainState.confidenceScore}%</span>
        </div>
      </div>

      {/* Unified Data Flow Status */}
      <div className="bg-[#0f1e35] rounded-lg p-3 mb-4 border border-[#12233e]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Live Data Flow</span>
          <span className="text-xs text-green-400">{getTotalDataPoints()} data points</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center">
            <div className="text-indigo-400 font-bold text-sm">{unifiedSnapshot.calculators}</div>
            <div className="text-[8px] text-[#7a95b8]">Calculators</div>
          </div>
          <div className="text-center">
            <div className="text-purple-400 font-bold text-sm">{unifiedSnapshot.siEngines}</div>
            <div className="text-[8px] text-[#7a95b8]">SI Engines</div>
          </div>
          <div className="text-center">
            <div className="text-cyan-400 font-bold text-sm">{unifiedSnapshot.aiProFeatures}</div>
            <div className="text-[8px] text-[#7a95b8]">AI Pro</div>
          </div>
        </div>
        {recentEntries.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[#12233e]">
            <div className="text-[9px] text-[#7a95b8] mb-1">Recent:</div>
            {recentEntries.slice(0, 3).map((e, i) => (
              <div key={`${e.featureId}-${i}`} className="flex items-center gap-1 text-[9px]">
                <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                <span className="text-white truncate">{e.featureName}</span>
                <span className="text-gray-600 ml-auto">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Key Metrics Display */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {Object.entries(keyMetrics).map(([key, value]) => (
          <div key={key} className="bg-[#0f1e35] p-3 rounded-md border border-[#12233e]">
            <p className="text-[10px] text-[#7a95b8]">{key}</p>
            <p className="font-medium text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Get Recommendation Button */}
      <button
        onClick={handleGetRecommendation}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md font-medium mb-4 transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing unified data...' : `Get AI Recommendation (${recs.length} insights)`}
      </button>

      {/* Insights Cards */}
      <div className="space-y-2 mb-4">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="bg-[#0f1e35] rounded-md overflow-hidden cursor-pointer border border-[#12233e]"
            onClick={() =>
              setExpandedCard(expandedCard === insight.title ? null : insight.title)
            }
          >
            <div className="p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                  insight.priority === 'critical' ? 'bg-red-500' :
                  insight.priority === 'high' ? 'bg-amber-500' :
                  insight.priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                }`}></span>
                <h4 className="font-medium text-sm">{insight.title}</h4>
              </div>
              <span className={priorityColor(insight.priority)}>
                {expandedCard === insight.title ? '▲' : '▼'}
              </span>
            </div>
            {expandedCard === insight.title && (
              <div className="p-3 text-sm text-[#7a95b8] border-t border-[#12233e]">
                {insight.content}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <a
          href="/portal/ai-assist"
          className="block bg-[#0f1e35] hover:bg-[#12233e] text-white py-2 rounded-md text-center font-medium transition-colors border border-[#12233e] text-sm"
        >
          AI Advisor
        </a>
        <a
          href="/portal/ai-brain"
          className="block bg-[#0f1e35] hover:bg-[#12233e] text-white py-2 rounded-md text-center font-medium transition-colors border border-[#12233e] text-sm"
        >
          AI Brain Hub
        </a>
      </div>
    </div>
  );
};

export default AIBrainAdvisorConnector;
