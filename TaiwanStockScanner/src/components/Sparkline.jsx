import React, { useId } from 'react';

/**
 * Sparkline component to display a small trend chart.
 * @param {Object} props
 * @param {number[]} props.series - Data points to plot.
 * @param {string} props.color - Stroke color for the line.
 * @returns {JSX.Element}
 */
const Sparkline = ({ series, color }) => {
  const gradientId = useId();
  const data = Array.isArray(series) && series.length > 1 ? series : [0, 0];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 120;
  const height = 35;
  const step = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * step;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${width} ${height} L 0 ${height} Z`;
  
  return (
    <svg className="w-full h-8 volatility-chart" viewBox="0 0 120 35" preserveAspectRatio="none">
      <path 
        d={linePath} 
        fill="none" 
        stroke={color} 
        strokeWidth="2"
        strokeLinecap="round"
      />
      <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
        <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
      </linearGradient>
      <path 
        d={areaPath} 
        fill={`url(#${gradientId})`} 
      />
    </svg>
  );
};

export default Sparkline;
