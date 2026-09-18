import React, { useState, useEffect } from 'react';

interface ProjectionData {
  year: number;
  [key: string]: number | string;
}

interface ColumnDefinition {
  name: string;
  key: string;
  format?: (value: number | string) => string;
}

interface ProjectionSliderProps {
  projectionData: ProjectionData[];
  columns: ColumnDefinition[];
  onGenerateProjections: () => void;
}

const ProjectionSlider: React.FC<ProjectionSliderProps> = ({ projectionData, columns, onGenerateProjections }) => {
  const [selectedYears, setSelectedYears] = useState<number>(30);
  const [scenario, setScenario] = useState<'Conservative' | 'Moderate' | 'Aggressive'>('Moderate');

  // Filter projection data based on selected years
  const filteredData = projectionData.filter((data) => data.year <= selectedYears);

  // Calculate max value for primary metric (for mini chart scaling)
  const primaryMetricKey = columns[0]?.key || 'value';
  const maxValue = Math.max(...filteredData.map((d) => Number(d[primaryMetricKey])));

  return (
    <div className="bg-[#1e293b] p-6 rounded-lg shadow-md text-white w-full">
      {/* Header and Scenario Toggle */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold">Projection Timeline ({selectedYears} Years)</h3>
        <div className="flex gap-2">
          {['Conservative', 'Moderate', 'Aggressive'].map((opt) => (
            <button
              key={opt}
              className={`px-3 py-1 rounded-md text-sm ${
                scenario === opt ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300'
              }`}
              onClick={() => setScenario(opt as 'Conservative' | 'Moderate' | 'Aggressive')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Slider with Markers */}
      <div className="mb-6">
        <input
          type="range"
          min={1}
          max={50}
          value={selectedYears}
          onChange={(e) => setSelectedYears(Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          {[1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map((year) => (
            <span key={year} className={year === selectedYears ? 'text-emerald-500' : ''}>
              {year}
            </span>
          ))}
        </div>
      </div>

      {/* Mini Chart for Primary Metric */}
      <div className="mb-6 h-24 flex gap-1 items-end">
        {filteredData.map((data) => (
          <div
            key={data.year}
            className="bg-emerald-500 w-full"
            style={{
              height: `${(Number(data[primaryMetricKey]) / maxValue) * 100}%`,
            }}
            title={`Year ${data.year}: ${data[primaryMetricKey]}`}
          />
        ))}
      </div>

      {/* Projection Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="p-2 text-gray-400 text-sm">Year</th>
              {columns.map((col) => (
                <th key={col.key} className="p-2 text-gray-400 text-sm">
                  {col.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((data) => (
              <tr key={data.year} className="border-b border-gray-700 hover:bg-gray-800">
                <td className="p-2">{data.year}</td>
                {columns.map((col) => (
                  <td key={col.key} className="p-2">
                    {col.format ? col.format(data[col.key]) : data[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Generate Projections Button */}
      <button
        onClick={onGenerateProjections}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-md font-medium transition-colors"
      >
        Generate Projections
      </button>
    </div>
  );
};

export default ProjectionSlider;
