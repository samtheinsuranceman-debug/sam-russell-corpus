import { useMemo } from "react";

interface RiskGaugeProps {
  score: number; // 0-100
  size?: number;
  label?: string;
}

export function RiskGauge({ score, size = 160, label = "Risk Score" }: RiskGaugeProps) {
  const { color, level, strokeDasharray, strokeDashoffset } = useMemo(() => {
    const clamped = Math.max(0, Math.min(100, score));
    let color: string;
    let level: string;

    if (clamped <= 30) {
      color = "#22c55e";
      level = "Low";
    } else if (clamped <= 60) {
      color = "#eab308";
      level = "Medium";
    } else if (clamped <= 80) {
      color = "#f97316";
      level = "High";
    } else {
      color = "#ef4444";
      level = "Critical";
    }

    // Arc calculation: 240 degree arc (from 150 to 390 degrees)
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const arcLength = (240 / 360) * circumference;
    const filledLength = (clamped / 100) * arcLength;

    return {
      color,
      level,
      strokeDasharray: `${arcLength} ${circumference}`,
      strokeDashoffset: arcLength - filledLength,
    };
  }, [score]);

  const center = size / 2;
  const radius = 60;
  const scaleFactor = size / 160;

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size * 0.75}
        viewBox={`0 0 160 120`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke="#12233e"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          transform="rotate(150 80 80)"
        />
        {/* Filled arc */}
        <circle
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(150 80 80)"
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 6px ${color}40)` }}
        />
        {/* Score text */}
        <text
          x="80"
          y="72"
          textAnchor="middle"
          className="fill-white font-bold"
          fontSize="28"
        >
          {Math.round(score)}
        </text>
        <text
          x="80"
          y="92"
          textAnchor="middle"
          fontSize="11"
          style={{ fill: color }}
          className="font-semibold"
        >
          {level}
        </text>
      </svg>
      <span className="text-xs text-[#7a95b8] -mt-1">{label}</span>
    </div>
  );
}
