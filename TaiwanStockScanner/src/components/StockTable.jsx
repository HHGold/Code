import React from 'react';
import { Search, Settings, BarChart2, List, Plus, MoreHorizontal, TrendingUp, TrendingDown } from 'lucide-react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import Sparkline from './Sparkline';

/**
 * StockTable component for displaying scan results.
 * @param {Object} props
 * @param {Array} props.results - Scanned results array.
 * @param {boolean} props.scanning - Scanning status.
 * @param {string} props.error - Error message if any.
 * @returns {JSX.Element}
 */
const toNumber = (value) => {
  const num = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(num) ? num : 0;
};

const formatQuoteDate = (unixSeconds) => {
  if (!unixSeconds) return '';
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
};

const createRng = (seed) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
};

const seedFromCode = (code) => {
  let seed = 0;
  const text = String(code);
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }
  return seed || 1;
};

const buildSeries = (base, delta, seed, points = 24) => {
  const rng = createRng(seed);
  const start = base - delta;
  const end = base;
  const noiseScale = Math.max(base * 0.01, 0.5);
  const data = [];
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    const drift = start + (end - start) * t;
    const noise = (rng() - 0.5) * noiseScale;
    data.push(drift + noise);
  }
  return data;
};

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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <MoreHorizontal size={12} className="opacity-20 ml-1 inline" />;
    return sortConfig.direction === 'asc' ? <TrendingUp size={12} className="ml-1 inline text-[var(--primary)]" /> : <TrendingDown size={12} className="ml-1 inline text-[var(--primary)]" />;
  };

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
          <table>
            <thead>
              <tr>
                <th>股票代號</th>
                <th>名稱</th>
                <th className="text-right">價格</th>
                <th className="text-right">漲跌</th>
                <th className="text-center hidden md:table-cell">走勢圖</th>
                <th 
                  className="text-center cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('rsi')}
                >
                  <div className="flex items-center justify-center">RSI <SortIcon column="rsi" /></div>
                </th>
                <th 
                  className="text-center cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('j')}
                >
                  <div className="flex items-center justify-center">J值 <SortIcon column="j" /></div>
                </th>
                <th className="text-center">趨勢</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
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
                
                {sortedResults.map((stock, i) => {
                  const changeVal = toNumber(stock.Change);
                  const isUp = changeVal >= 0;
                  const base = toNumber(stock.ClosingPrice);
                  const series = buildSeries(base, changeVal, seedFromCode(stock.Code));
                  
                  // Trend Logic
                  const k = toNumber(stock.k);
                  const d = toNumber(stock.d);
                  const jVal = toNumber(stock.j);
                  const pk = toNumber(stock.prevK);
                  const pd = toNumber(stock.prevD);
                  const pj = toNumber(stock.prevJ);

                  const getTrend = () => {
                    // Golden Cross: K crosses D upward
                    const isGoldenCross = pk <= pd && k > d;
                    // Death Cross: K crosses D downward
                    const isDeathCross = pk >= pd && k < d;

                    if (isGoldenCross && (jVal < 10 || pj < 0)) {
                      return <span className="badge uptrend px-2 py-1">超賣 (買)</span>;
                    }
                    if (isDeathCross && (jVal > 90 || pj > 100)) {
                      return <span className="badge downtrend px-2 py-1">超買 (賣)</span>;
                    }
                    
                    if (k > d) return <span className="badge opacity-50 px-2 py-1">偏多</span>;
                    if (k < d) return <span className="badge opacity-50 px-2 py-1">偏空</span>;
                    return <span className="badge neutral px-2 py-1">盤整</span>;
                  };
                  
                  return (
                    <Motion.tr 
                      key={stock.Code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/5 flex items-center justify-center text-xs font-bold shadow-inner">
                            {stock.Name.charAt(0)}
                          </div>
                          <span className="mono font-bold text-white text-base tracking-wider">{stock.Code}</span>
                        </div>
                      </td>
                      <td>
                        <a
                          href={`https://tw.stock.yahoo.com/quote/${stock.Code}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[var(--text-muted)] font-bold text-base hover:text-white transition-colors"
                        >
                          {stock.Name}
                        </a>
                      </td>
                      <td className="text-right mono text-white">
                        <div>{stock.ClosingPrice}</div>
                        {stock.QuoteTime && (
                          <div className="text-[10px] text-[var(--text-muted)]">
                            收盤 {formatQuoteDate(stock.QuoteTime)}
                          </div>
                        )}
                      </td>
                      <td className="text-right font-medium">
                        <span className={`flex items-center justify-end gap-1 ${isUp ? "text-[var(--up-color)]" : "text-[var(--down-color)]"}`}>
                          {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />} {Math.abs(changeVal)}
                        </span>
                      </td>
                      <td className="w-32 hidden md:table-cell">
                        <Sparkline 
                          series={series} 
                          color={isUp ? 'var(--up-color)' : 'var(--down-color)'} 
                        />
                      </td>
                      <td className="text-center mono text-[var(--text-label)]">
                        {stock.rsi}
                      </td>
                      <td className="text-center mono font-bold text-[var(--primary)]">
                        {stock.j}
                      </td>
                      <td className="text-center">
                        {getTrend()}
                      </td>
                    </Motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
     </div>
  );
};

export default StockTable;
