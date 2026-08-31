import React, { useState } from 'react';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  affectedTools: string[];
}

const AIBrainFloatingWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');

  // Mock recommendations for the current page
  const recommendations: Recommendation[] = [
    { id: '1', title: 'Mortgage Optimization', description: 'Refinance at 3.5% to save $12K/year', confidence: 92, affectedTools: ['Mortgage Killer', 'Cash Flow'] },
    { id: '2', title: 'Tax Deduction', description: 'Claim home office for $3K savings', confidence: 88, affectedTools: ['Tax Waterfall'] },
    { id: '3', title: 'Investment Gap', description: 'Diversify into REITs for stability', confidence: 78, affectedTools: ['Investment Planner'] },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className={`transform transition-all duration-300 ease-in-out ${
          isExpanded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="bg-[#1e293b]/90 backdrop-blur-md p-6 rounded-xl shadow-xl w-96 border border-emerald-500/30 relative overflow-hidden"
          style={{
            boxShadow: '0 10px 30px -15px rgba(0, 255, 128, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Gradient border overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-xl opacity-50 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-semibold flex items-center">
                AI Brain Advisor
                <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M14.293 5.293a1 1 0 011.414 0l.293.293a1 1 0 010 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414l-.293.293a1 1 0 01-1.414 0L10 11.414l-4.293 4.293a1 1 0 01-1.414 0l-.293-.293a1 1 0 010-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414l.293-.293a1 1 0 011.414 0L10 8.586l4.293-4.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="space-y-3 mb-6 max-h-56 overflow-y-auto">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 bg-[#0f172a]/80 rounded-lg border border-emerald-700/20 hover:border-emerald-500/40 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-white font-medium">{rec.title}</p>
                    <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">
                      {rec.confidence}%
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm mb-2">{rec.description}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">
                      Tools: {rec.affectedTools.join(', ')}
                    </span>
                    <button className="text-emerald-400 hover:text-emerald-300 font-medium">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 0 000 4z" />
                  <path
                    fillRule="evenodd"
                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Analyze Client</span>
              </button>
              <button className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H7.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Find Opportunities</span>
              </button>
              <button className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.963 7.963 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0114.5 4c-1.669 0-3.218.51-4.5 1.385A7.962 7.962 0 005.5 4z" />
                </svg>
                <span className="text-sm">Generate Report</span>
              </button>
              <button className="flex items-center justify-center space-x-1.5 p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-lg transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                  <path
                    fillRule="evenodd"
                    d="M8.293 9.293a1 1 0 011.414 0L11 10.586V9a1 1 0 112 0v1.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm">Cross-Tool Insights</span>
              </button>
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything..."
              className="w-full p-2 bg-[#0f172a]/80 text-white rounded-lg border border-gray-700/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center bg-[#1e293b]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-500/30 hover:bg-[#1e293b]/100 hover:border-emerald-500/50 transition-all"
          style={{
            boxShadow: '0 4px 10px -2px rgba(0, 255, 128, 0.15)',
          }}
        >
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI</span>
        </button>
      )}
    </div>
  );
};

export default AIBrainFloatingWidget;
