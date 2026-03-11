import React from 'react';
import Sparkline from './Sparkline';

/**
 * MarketIndices component to display top market badges.
 * @param {Object} props
 * @param {Array} props.indices - List of market indices data.
 * @returns {JSX.Element}
 */
const MarketIndices = ({ indices }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {indices.map(idx => (
        <div key={idx.name} className="glass-panel p-5 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-[15px] font-medium text-white">{idx.name}</h3>
            <span className={`text-[13px] font-bold ${idx.trend === 'up' ? 'text-[var(--up-color)]' : 'text-[var(--down-color)]'}`}>
              {idx.change}
            </span>
          </div>
          <div className="mt-2">
            <Sparkline 
              series={idx.series} 
              color={idx.trend === 'up' ? 'var(--up-color)' : 'var(--down-color)'} 
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketIndices;
