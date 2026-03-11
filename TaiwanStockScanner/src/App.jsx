import React, { useEffect, useState } from 'react';
import { useScanner } from './lib/api';
import { fetchTaiexDailyHistory, fetchTxDailyHistory } from './lib/marketData';

// Subcomponents
import MarketIndices from './components/MarketIndices';
import FilterSidebar from './components/FilterSidebar';
import StockTable from './components/StockTable';

const initialIndices = [
  { name: '今日大盤', value: '--', change: '--', trend: 'up', series: [0, 0] },
  { name: '台指期', value: '--', change: '--', trend: 'up', series: [0, 0] },
  { name: 'NASDAQ', value: '16,234.12', change: '+1.89%', trend: 'up', series: [16020, 16080, 16110, 16140, 16180, 16210, 16230, 16260, 16290, 16310, 16330, 16234] }
];

/**
 * Main Application component for Taiwan Stock Scanner.
 * @returns {JSX.Element}
 */
export default function App() {
  const { scan, scanning, results, progress, error } = useScanner();
  const [indices, setIndices] = useState(initialIndices);
  
  const initialCriteria = {
    rsiMax: 30,
    jMax: 20,
    codeQuery: ''
  };
  const [criteria, setCriteria] = useState(initialCriteria);

  const handleScan = () => scan(criteria);
  const handleReset = () => setCriteria(initialCriteria);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const taiexSeries = await fetchTaiexDailyHistory(60);
      const txDaily = await fetchTxDailyHistory(60);

      if (!active) return;

      const next = [...initialIndices];

      if (taiexSeries.length >= 2) {
        const last = taiexSeries[taiexSeries.length - 1];
        const prev = taiexSeries[taiexSeries.length - 2];
        const change = last - prev;
        const changePct = prev ? (change / prev) * 100 : 0;
        next[0] = {
          ...next[0],
          value: last.toFixed(2),
          change: `${change >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
          trend: change >= 0 ? 'up' : 'down',
          series: taiexSeries
        };
      }

      if (txDaily && txDaily.series.length >= 2) {
        const changeText = txDaily.changePct || (txDaily.change !== null ? `${txDaily.change >= 0 ? '+' : ''}${txDaily.change}` : '--');
        next[1] = {
          ...next[1],
          value: txDaily.last !== null ? txDaily.last.toFixed(1) : '--',
          change: changeText,
          trend: txDaily.change !== null ? (txDaily.change >= 0 ? 'up' : 'down') : 'up',
          series: txDaily.series
        };
      }

      setIndices(next);
    };

    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="h-screen overflow-hidden p-4 md:p-8 font-sans">
      <div className="h-full max-w-[1400px] mx-auto space-y-6 flex flex-col">
        
        {/* Top Indices Section */}
        <MarketIndices indices={indices} />

        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0">
          
          {/* Side Filters Section */}
          <FilterSidebar 
            criteria={criteria}
            setCriteria={setCriteria}
            handleReset={handleReset}
            handleScan={handleScan}
            scanning={scanning}
            progress={progress}
          />

          {/* Main Content Section */}
          <div className="relative min-h-0">
            <StockTable 
              results={results}
              scanning={scanning}
              error={error}
            />
            
          </div>

        </div>
      </div>
    </div>
  );
}
