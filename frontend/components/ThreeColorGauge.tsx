import React from "react";
import { Cell, PieChart, Pie } from "recharts";

interface BiomarkerRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

interface BiomarkerConfig {
  ranges: BiomarkerRange[];
  unit: string;
  type: string;
  title: string;
  description: string;
}

interface DynamicBiomarkerGaugeProps {
  value: number;
  biomarkerConfig: BiomarkerConfig;
  width?: number;
}

const DynamicBiomarkerGauge: React.FC<DynamicBiomarkerGaugeProps> = ({
  value,
  biomarkerConfig,
  width = 400
}) => {
  const { ranges, unit, title } = biomarkerConfig;

  // Calculate the overall min and max from all ranges
  const overallMin = Math.min(...ranges.map(r => r.min));
  const overallMax = Math.max(...ranges.map(r => r.max));
  
  // Clamp value within bounds
  const chartValue = Math.max(overallMin, Math.min(overallMax, value));

  // Sort ranges by min value to ensure proper order
  const sortedRanges = [...ranges].sort((a, b) => a.min - b.min);

  // Calculate segments for each range
  const totalRange = overallMax - overallMin;
  const totalSegments = 30;
  
  const colorData = sortedRanges.map(range => {
    const rangeSize = range.max - range.min;
    const segments = Math.max(1, Math.round((rangeSize / totalRange) * totalSegments));
    
    return {
      value: segments,
      color: range.color,
      label: range.label,
      min: range.min,
      max: range.max
    };
  });

  // Adjust segments to ensure they sum to totalSegments
  const totalCalculated = colorData.reduce((sum, item) => sum + item.value, 0);
  if (totalCalculated !== totalSegments) {
    const difference = totalSegments - totalCalculated;
    // Distribute the difference across segments (prefer larger segments)
    const largestSegmentIndex = colorData.reduce((maxIndex, item, index) => 
      item.value > colorData[maxIndex].value ? index : maxIndex, 0);
    colorData[largestSegmentIndex].value += difference;
  }

  // Find which range the current value falls into
  const getCurrentRange = () => {
    return sortedRanges.find(range => 
      chartValue >= range.min && chartValue <= range.max
    ) || sortedRanges[0];
  };

  const currentRange = getCurrentRange();

  // Determine needle color based on current value
  const getCurrentColor = () => {
    return currentRange.color;
  };

  const Arrow = (props: any) => {
    const { cx, cy, outerRadius } = props;
    const RADIAN = Math.PI / 180;

    // Calculate the angle based on the current value position
    // For a semicircle from 180° (left) to 0° (right)
    const currentPosition = Math.max(0, Math.min(1, (chartValue - overallMin) / totalRange));
    const needleAngle = 180 - (currentPosition * 180);

    const sin = Math.sin(RADIAN * needleAngle);
    const cos = Math.cos(RADIAN * needleAngle);
    const needleLength = (outerRadius * 0.75);

    return (
      <g>
        {/* Needle line */}
        <line
          x1={cx}
          y1={cy}
          x2={cx + needleLength * cos}
          y2={cy - needleLength * sin}
          stroke="#1f2937"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Needle center point */}
        <circle
          cx={cx}
          cy={cy}
          r="6"
          fill="#1f2937"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </g>
    );
  };

  return (
    <div className="flex flex-col items-center">
      <PieChart width={width} height={width / 2 + 80}>
        {/* Min label */}
        <text
          x={width * 0.15}
          y={width / 2 + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-gray-500"
        >
          {overallMin}
        </text>

        {/* Max label */}
        <text
          x={width * 0.85}
          y={width / 2 + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-sm fill-gray-500"
        >
          {overallMax}
        </text>

        {/* Main gauge */}
        <Pie
          innerRadius="70%"
          outerRadius="95%"
          data={colorData}
          fill="#8884d8"
          startAngle={180}
          endAngle={0}
          cx={width / 2}
          cy={width / 2}
        >
          {colorData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>

        {/* Needle */}
        <g>
          <Arrow
            cx={width / 2}
            cy={width / 2}
            outerRadius={(width / 2) * 0.95}
          />
        </g>
      </PieChart>

      {/* Value Display */}
      <div className="text-center mt-4">
        <div className="text-2xl font-bold" style={{ color: getCurrentColor() }}>
          {chartValue.toFixed(1)}{unit}
        </div>
        {title && (
          <div className="text-sm text-gray-600 mt-1">
            {title}
          </div>
        )}
        {/* Current range indicator */}
        <div className="text-xs mt-1" style={{ color: getCurrentColor() }}>
          {currentRange.label}
        </div>
      </div>

      {/* Dynamic Legend */}
      <div className="flex justify-center flex-wrap gap-3 mt-4 max-w-md">
        {sortedRanges.map((range, index) => (
          <div key={index} className="flex items-center space-x-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: range.color }}
            ></div>
            <span className="text-xs text-gray-600">
              {range.label} ({range.min}-{range.max})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DynamicBiomarkerGauge;