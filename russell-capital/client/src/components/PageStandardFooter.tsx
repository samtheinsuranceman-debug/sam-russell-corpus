import React, { useState, useEffect } from 'react';
import ProjectionSlider from './ProjectionSlider';
import AIBrainAdvisorConnector from './AIBrainAdvisorConnector';

interface ProjectionData {
  year: number;
  [key: string]: number | string;
}

interface ColumnDefinition {
  name: string;
  key: string;
  format?: (value: number | string) => string;
}

interface KeyMetrics {
  [key: string]: number | string;
}

interface PageStandardFooterProps {
  projectionData: ProjectionData[];
  columns: ColumnDefinition[];
  pageName: string;
  pageCategory: string;
  keyMetrics: KeyMetrics;
  onGenerateOutcome: () => void;
  onShareWithClient: () => void;
  onExportPDF: () => void;
}

const PageStandardFooter: React.FC<PageStandardFooterProps> = ({
  projectionData,
  columns,
  pageName,
  pageCategory,
  keyMetrics,
  onGenerateOutcome,
  onShareWithClient,
  onExportPDF,
}) => {
  const [lastSynced, setLastSynced] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(true);

  useEffect(() => {
    // Simulate sync timestamp
    const now = new Date().toLocaleString();
    setLastSynced(now);
    // Simulate connection status
    setIsConnected(true);
  }, []);

  return (
    <footer className="bg-[#1e293b] p-6 text-white w-full mt-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={onGenerateOutcome}
            className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md font-medium transition-colors"
          >
            Generate Outcome
          </button>
          <button
            onClick={onShareWithClient}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md font-medium transition-colors"
          >
            Share with Client
          </button>
          <button
            onClick={onExportPDF}
            className="bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md font-medium transition-colors"
          >
            Export PDF
          </button>
        </div>

        {/* Sync Status */}
        <div className="flex justify-between items-center text-sm text-gray-400 mb-6">
          <span>
            Sync to StrategyContext:{' '}
            <span className={isConnected ? 'text-emerald-500' : 'text-red-500'}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </span>
          <span>Last synced: {lastSynced}</span>
        </div>

        {/* Projection Slider */}
        <ProjectionSlider
          projectionData={projectionData}
          columns={columns}
          onGenerateProjections={onGenerateOutcome}
        />

        {/* AI Brain Connector */}
        <AIBrainAdvisorConnector
          pageName={pageName}
          pageCategory={pageCategory}
          keyMetrics={keyMetrics}
        />
      </div>
    </footer>
  );
};

export default PageStandardFooter;
