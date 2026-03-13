import React from 'react';
import { Search, Settings, BarChart2, List, Plus, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import StockRow from './StockRow';

/**
 * SortIcon component for table headers.
 */
const SortIcon = ({ column, currentKey, direction }) => {
  if (currentKey !== column) return <MoreHorizontal size={12} className="opacity-20 ml-1 inline" />;
  return direction === 'asc' ? <TrendingUp size={12} className="ml-1 inline text-[var(--primary)]" /> : <TrendingDown size={12} className="ml-1 inline text-[var(--primary)]" />;
};

const toNumber = (value) => {
  const num = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

/**
 * StockTable component for displaying scan results.
 * @param {Object} props
 * @param {Array} props.results - Scanned results array.
 * @param {boolean} props.scanning - Scanning status.
 * @param {string} props.error - Error message if any.
 * @returns {JSX.Element}
 */
const StockTable = ({ results, scanning, error }) => {
  const [sortConfig, setSortConfig] = React.useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      key = null; // Reset to default
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = React.useMemo(() => {
    if (!sortConfig.key) return results;
    return [...results].sort((a, b) => {
      const aVal = toNumber(a[sortConfig.key]);
      const bVal = toNumber(b[sortConfig.key]);
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [results, sortConfig]);

  return (
    <div className="glass-panel overflow-hidden flex flex-col relative h-full min-h-0">
      <div className="p-5 border-b border-[var(--border-light)] flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-sm font-semibold text-white tracking-widest uppercase flex items-center gap-2">
          Stock List
          {results.length > 0 && <span className="text-[11px] bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-0.5 rounded-full">{results.length}</span>}
        </h2>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-[var(--bg-card-solid)] border border-[var(--border-light)] rounded-lg p-1">
            <button className="p-1.5 rounded-md bg-[var(--border-med)] text-white"><BarChart2 size={16} /></button>
            <button className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-white"><List size={16} /></button>
          </div>
          <button className="btn-icon"><Settings size={18} /></button>
          <button className="btn-primary px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1">
            <Plus size={16} /> Selecter
          </button>
          <button className="btn-icon"><MoreHorizontal size={18} /></button>
        </div>
      </div>

      {error && (
        <div className="mx-5 mt-5 p-4 rounded-lg bg-[var(--down-bg)] border border-[var(--down-color)]/30 text-[var(--down-color)] text-sm">
          {error}
        </div>
      )}

      <div className="overflow-auto p-5 pb-8 flex-1 min-h-0">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">股票代號</th>
              <th className="text-left font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">名稱</th>
              <th className="text-right font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">價格</th>
              <th className="text-right font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">漲跌</th>
              <th className="text-center hidden md:table-cell font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">走勢圖</th>
              <th 
                className="text-center cursor-pointer hover:text-white transition-colors font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2"
                onClick={() => handleSort('rsi')}
              >
                <div className="flex items-center justify-center">RSI <SortIcon column="rsi" currentKey={sortConfig.key} direction={sortConfig.direction} /></div>
              </th>
              <th 
                className="text-center cursor-pointer hover:text-white transition-colors font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2"
                onClick={() => handleSort('j')}
              >
                <div className="flex items-center justify-center">J值 <SortIcon column="j" currentKey={sortConfig.key} direction={sortConfig.direction} /></div>
              </th>
              <th className="text-center font-semibold text-[var(--text-muted)] text-xs uppercase tracking-wider pb-3 px-2">趨勢</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {sortedResults.length === 0 && !scanning && !error && (
                <tr>
                  <td colSpan="8" className="text-center py-20 text-[var(--text-muted)] border-none">
                     <div className="flex flex-col items-center gap-3">
                       <Search size={32} className="opacity-20" />
                       <p>尚無搜尋結果。請調整篩選條件並開始掃描。</p>
                     </div>
                  </td>
                </tr>
              )}
              
              {sortedResults.map((stock, i) => (
                <StockRow key={stock.Code} stock={stock} index={i} />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockTable;
