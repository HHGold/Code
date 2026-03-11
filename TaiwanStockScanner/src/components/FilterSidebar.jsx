import React from 'react';
import { RefreshCw, Search } from 'lucide-react';

/**
 * FilterSidebar component for stock scanning criteria.
 * @param {Object} props
 * @param {Object} props.criteria - Current scan criteria.
 * @param {Function} props.setCriteria - Function to update criteria.
 * @param {Function} props.handleReset - Reset action.
 * @param {Function} props.handleScan - Scan action.
 * @param {boolean} props.scanning - Scanning status.
 * @param {number} props.progress - Scanning progress.
 * @returns {JSX.Element}
 */
const FilterSidebar = ({ criteria, setCriteria, handleReset, handleScan, scanning, progress }) => {
  return (
    <div className="glass-panel p-6 flex flex-col min-h-0 lg:sticky lg:top-6 lg:h-[calc(100vh-6rem)]">
      <h2 className="text-lg font-semibold mb-6 text-white text-shadow-sm">Filters</h2>

      <div className="space-y-8">
        {/* RSI Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-label)] font-medium">RSI (Max)</span>
            <span className="text-white mono bg-white/10 px-2 py-0.5 rounded">{criteria.rsiMax}</span>
          </div>
          <input 
            type="range" 
            min="0" max="100" 
            value={criteria.rsiMax}
            onChange={(e) => setCriteria({ ...criteria, rsiMax: parseInt(e.target.value) })}
          />
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] mono">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* J Value Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--text-label)] font-medium">J Value (Max)</span>
            <span className="text-white mono bg-white/10 px-2 py-0.5 rounded">{criteria.jMax}</span>
          </div>
          <input 
            type="range" 
            min="-20" max="100" 
            value={criteria.jMax}
            onChange={(e) => setCriteria({ ...criteria, jMax: parseInt(e.target.value) })}
          />
          <div className="flex justify-between text-[11px] text-[var(--text-muted)] mono">
            <span>-20</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        {/* Stock Code Search */}
        <div className="space-y-3">
          <span className="text-[var(--text-label)] font-medium text-sm">股票代號</span>
          <input
            type="text"
            value={criteria.codeQuery}
            onChange={(e) => setCriteria({ ...criteria, codeQuery: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleScan();
              }
            }}
            placeholder="輸入代號，如 2330"
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-active)]"
          />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
        <button 
          onClick={handleReset}
          className="w-full py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 border border-white/10"
        >
          <RefreshCw size={16} /> Reset Filters
        </button>
        <button 
          onClick={handleScan}
          disabled={scanning}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          {scanning ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
          {scanning ? `掃描中... ${progress}%` : '搜尋'}
        </button>
        <div className="text-[11px] text-[var(--text-muted)] text-center">
          支援完整代號或部分比對
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
