import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';

type ConnectionStatus = 'connected' | 'syncing' | 'offline';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  pageContext: string;
  relatedTools: string[];
}

interface AIBrainState {
  connectionStatus: ConnectionStatus;
  activeCalculators: number;
  dataPointsProcessed: number;
  confidenceScore: number;
  lastSync: Date;
  recommendations: AIRecommendation[];
  pageConnections: Map<string, ConnectionStatus>;
}

interface AIBrainContextType {
  state: AIBrainState;
  getRecommendations: (pageContext: string) => AIRecommendation[];
  reportData: (pageContext: string, data: any) => void;
  checkConnection: () => ConnectionStatus;
  getCrossToolSuggestions: (pageContext: string) => string[];
}

const AIBrainContext = createContext<AIBrainContextType | undefined>(undefined);

export const useAIBrain = () => {
  const context = useContext(AIBrainContext);
  if (context === undefined) {
    throw new Error('useAIBrain must be used within an AIBrainProvider');
  }
  return context;
};

export const AIBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AIBrainState>({
    connectionStatus: 'syncing',
    activeCalculators: 248,
    dataPointsProcessed: 0,
    confidenceScore: 85,
    lastSync: new Date(),
    recommendations: [],
    pageConnections: new Map<string, ConnectionStatus>(),
  });

  useEffect(() => {
    // Simulate AI Brain connection
    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        connectionStatus: 'connected',
        recommendations: [
          { id: '1', title: 'Optimize Mortgage', description: 'Reduce interest by 15%', confidence: 92, pageContext: 'mortgage-killer', relatedTools: ['Tax Waterfall'] },
          { id: '2', title: 'Tax Strategy', description: 'Maximize deductions', confidence: 88, pageContext: 'tax-waterfall', relatedTools: ['Mortgage Killer'] },
          { id: '3', title: 'Investment Gap', description: 'Diversify portfolio', confidence: 78, pageContext: 'investment-planner', relatedTools: ['Risk Analyzer'] },
        ],
      }));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getRecommendations = useCallback(
    (pageContext: string) => state.recommendations.filter((r) => r.pageContext === pageContext),
    [state.recommendations]
  );

  const reportData = useCallback((pageContext: string, data: any) => {
    setState((prev) => {
      const updatedConnections = new Map(prev.pageConnections);
      updatedConnections.set(pageContext, 'connected');
      return {
        ...prev,
        dataPointsProcessed: prev.dataPointsProcessed + 1,
        lastSync: new Date(),
        pageConnections: updatedConnections,
      };
    });
    // Simulate processing data
    console.log(`AI Brain received data from ${pageContext}:`, data);
  }, []);

  const checkConnection = useCallback(() => state.connectionStatus, [state.connectionStatus]);

  const getCrossToolSuggestions = useCallback(
    (pageContext: string) => {
      const related = state.recommendations.find((r) => r.pageContext === pageContext)?.relatedTools || [];
      return related.map((tool) => `Based on ${pageContext} results, try ${tool} next.`);
    },
    [state.recommendations]
  );

  const value = {
    state,
    getRecommendations,
    reportData,
    checkConnection,
    getCrossToolSuggestions,
  };

  return <AIBrainContext.Provider value={value}>{children}</AIBrainContext.Provider>;
};

export const AIAdvisorWidget: React.FC = () => {
  const { state, getRecommendations } = useAIBrain();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-[#1e293b]/90 backdrop-blur-md p-6 rounded-lg shadow-lg w-96 border border-emerald-500/30">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            AI Brain Advisor
            <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </h3>
          <div className="space-y-4 mb-4">
            {getRecommendations('current-page').slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-3 bg-[#0f172a] rounded-md">
                <p className="text-white font-medium">{rec.title}</p>
                <p className="text-gray-300 text-sm">{rec.description}</p>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Ask AI Advisor..."
            className="w-full p-2 bg-[#0f172a] text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
          />
          <div className="grid grid-cols-3 gap-2">
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Run Full Analysis
            </button>
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Generate Report
            </button>
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Find Opportunities
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center bg-[#1e293b]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-500/30 hover:bg-[#1e293b]/100 transition-all"
        >
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI</span>
        </button>
      )}
    </div>
  );
};

export const AIBrainBanner: React.FC = () => {
  const { state, getRecommendations } = useAIBrain();
  const recCount = getRecommendations('current-page').length;
  const lastSyncMinutes = Math.floor((Date.now() - state.lastSync.getTime()) / 60000);

  return (
    <div className="bg-[#1e293b] p-4 flex items-center justify-between border-b border-emerald-500/20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI Brain Connected</span>
        </div>
        <span className="text-gray-300">{recCount} recommendations available</span>
        <span className="text-gray-300">Last analyzed: {lastSyncMinutes} minutes ago</span>
      </div>
      <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
        See Recommendations
      </button>
    </div>
  );
};

export const usePageAIConnection = (pageName: string, dataCallback: (data: any) => any) => {
  const { state, reportData, getRecommendations } = useAIBrain();

  useEffect(() => {
    reportData(pageName, dataCallback({}));
  }, [pageName, dataCallback, reportData]);

  return {
    recommendations: getRecommendations(pageName),
    reportData: (data: any) => reportData(pageName, data),
    isConnected: state.pageConnections.get(pageName) === 'connected',
  };
};
