import React, { useState } from 'react';

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

  const handleGetRecommendation = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1000);
  };

  const insights = [
    { title: 'Immediate Action', content: `Based on ${pageName} data, adjust your input for optimal results.` },
    { title: 'Tax Impact', content: 'Potential savings of $5,000 annually with current strategy.' },
    { title: 'Long-Term Projection', content: '50-year outlook shows steady growth with moderate risk.' },
    { title: 'Cross-Calculator Insight', content: `This data impacts your ${pageCategory} calculators.` },
    { title: 'Risk Assessment', content: 'Key risk: Market volatility. Mitigation: Diversify investments.' },
  ];

  return (
    <div className="bg-[#1e293b] p-6 rounded-lg shadow-md text-white w-full">
      <h3 className="text-xl font-semibold mb-4">AI Brain Analysis</h3>

      {/* Key Metrics Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(keyMetrics).map(([key, value]) => (
          <div key={key} className="bg-gray-800 p-3 rounded-md">
            <p className="text-sm text-gray-400">{key}</p>
            <p className="font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Get Recommendation Button */}
      <button
        onClick={handleGetRecommendation}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md font-medium mb-6 transition-colors disabled:opacity-50"
        disabled={isLoading}
      >
        {isLoading ? 'Analyzing...' : 'Get AI Recommendation'}
      </button>

      {/* Insights Cards */}
      <div className="space-y-3 mb-6">
        {insights.map((insight) => (
          <div
            key={insight.title}
            className="bg-gray-800 rounded-md overflow-hidden cursor-pointer"
            onClick={() =>
              setExpandedCard(expandedCard === insight.title ? null : insight.title)
            }
          >
            <div className="p-3 flex justify-between items-center">
              <h4 className="font-medium">{insight.title}</h4>
              <span className="text-emerald-500">
                {expandedCard === insight.title ? '▲' : '▼'}
              </span>
            </div>
            {expandedCard === insight.title && (
              <div className="p-3 text-sm text-gray-300 border-t border-gray-700">
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
          className="block bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-center font-medium transition-colors"
        >
          Send to AI Advisor
        </a>
        <a
          href="/portal/ai-brain"
          className="block bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-center font-medium transition-colors"
        >
          View in AI Brain Hub
        </a>
      </div>
    </div>
  );
};

export default AIBrainAdvisorConnector;
