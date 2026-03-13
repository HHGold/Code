import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { motion as Motion } from 'framer-motion';
import Sparkline from './Sparkline';

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

const TrendIndicator = ({ stock }) => {
  const k = toNumber(stock.k);
  const d = toNumber(stock.d);
  const jVal = toNumber(stock.j);
  const pk = toNumber(stock.prevK);
  const pd = toNumber(stock.prevD);
  const pj = toNumber(stock.prevJ);

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

const StockRow = ({ stock, index }) => {
  const changeVal = toNumber(stock.Change);
  const isUp = changeVal >= 0;
  const base = toNumber(stock.ClosingPrice);
  const series = buildSeries(base, changeVal, seedFromCode(stock.Code));
  
  return (
    <Motion.tr 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
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
        {stock.QuoteTime ? (
          <div className="text-[10px] text-[var(--text-muted)]">
            收盤 {formatQuoteDate(stock.QuoteTime)}
          </div>
        ) : null}
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
        <TrendIndicator stock={stock} />
      </td>
    </Motion.tr>
  );
};

export default StockRow;
