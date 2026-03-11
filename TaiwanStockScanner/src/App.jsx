import React, { useState } from 'react';
import { 
  Search, 
  X, 
  TrendingUp, 
  Check,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScanner } from './lib/api';

function App() {
  const { scan, scanning, results, progress, error } = useScanner();
  
  const initialCriteria = {
    rsiMax: 30,
    jMax: 20
  };
  const [criteria, setCriteria] = useState(initialCriteria);

  const handleScan = () => scan(criteria);
  const handleReset = () => {
    setCriteria(initialCriteria);
    // 這裡我們不自動清理結果，讓使用者可以保留上一次的掃描，直到他們再次點擊掃描
  };

  return (
    <div className="min-h-screen bg-[#F2F4F7]">
      {/* 簡化版 Header */}
      <header className="bg-white border-b border-[#EAECF0] h-14 flex items-center px-4 md:px-8 justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 cursor-pointer">
            <div className="bg-[#C1272D] p-1.5 rounded">
              <TrendingUp className="text-white w-4 h-4" />
            </div>
            <span className="font-bold text-[#1D2939] text-lg tracking-tight">玩選大師 - 技術面篩選</span>
          </div>
        </div>
      </header>

      <main className="max-w-[1280px] mx-auto p-4 md:p-6 space-y-6">
        
        {/* 核心過濾控制面板 */}
        <section className="bg-white border border-[#EAECF0] rounded-xl overflow-hidden shadow-sm">
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-6">
              
              {/* RSI 控制區 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#F9FAFB] p-3 rounded-lg border border-[#EAECF0]">
                  <span className="text-sm font-bold text-[#344054] flex items-center gap-2">
                    強弱指標 RSI (≤) 
                  </span>
                  <span className="text-2xl font-bold text-[#C1272D] mono">{criteria.rsiMax}</span>
                </div>
                <div className="px-2">
                  <input 
                    type="range" min="0" max="100" 
                    value={criteria.rsiMax}
                    onChange={(e) => setCriteria({...criteria, rsiMax: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[11px] text-[#98A2B3]">強勢 (&gt;70)</span>
                    <span className="text-[11px] text-[#C1272D] font-bold">設定門檻</span>
                    <span className="text-[11px] text-[#98A2B3]">超賣 (&lt;30)</span>
                  </div>
                </div>
              </div>

              {/* J 控制區 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-[#F9FAFB] p-3 rounded-lg border border-[#EAECF0]">
                  <span className="text-sm font-bold text-[#344054] flex items-center gap-2">
                    KDJ 指標 J 值 (≤)
                  </span>
                  <span className="text-2xl font-bold text-[#C1272D] mono">{criteria.jMax}</span>
                </div>
                <div className="px-2">
                  <input 
                    type="range" min="0" max="100" 
                    value={criteria.jMax}
                    onChange={(e) => setCriteria({...criteria, jMax: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-[11px] text-[#98A2B3]">高檔</span>
                    <span className="text-[11px] text-[#C1272D] font-bold">底部反轉區</span>
                    <span className="text-[11px] text-[#98A2B3]">低檔鈍化</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 操作列與當前標籤 */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-6 border-t border-[#F2F4F7]">
              
              <div className="flex items-center gap-2 text-[13px] text-[#667085] font-medium">
                <span>目前啟用的篩選條件：</span>
                <span className="filter-pill bg-[#FEF3F2] border-[#FEE4E2] text-[#B42318] font-bold">RSI ≤ {criteria.rsiMax}</span>
                <span className="filter-pill bg-[#FEF3F2] border-[#FEE4E2] text-[#B42318] font-bold">J 值 ≤ {criteria.jMax}</span>
              </div>
              
              <div className="sm:ml-auto flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <button 
                  onClick={handleReset}
                  className="px-4 py-3 text-[13px] font-bold text-[#667085] bg-[#F9FAFB] border border-[#EAECF0] hover:bg-[#F2F4F7] rounded-lg flex items-center gap-1 transition-colors w-full sm:w-auto justify-center"
                >
                  <RefreshCw className="w-4 h-4" /> 恢復預設值
                </button>
                <button 
                  onClick={handleScan}
                  disabled={scanning}
                  className="bg-[#C1272D] hover:bg-[#A01F25] disabled:bg-[#EAECF0] disabled:text-[#98A2B3] text-white px-8 py-3 rounded-lg font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  {scanning ? `掃描中 ${progress}%` : '開始掃描'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 錯誤提示 */}
        {error && (
          <div className="p-4 bg-[#FEF3F2] border border-[#FEE4E2] text-[#B42318] rounded-lg text-sm font-medium">
             {error}
          </div>
        )}

        {/* 掃描結果列表 */}
        <section className="bg-white rounded-xl border border-[#EAECF0] shadow-sm overflow-hidden">
          
          <div className="px-6 py-4 border-b border-[#EAECF0] bg-[#F9FAFB] flex justify-between items-center">
             <h2 className="font-bold text-[#1D2939] text-[15px]">篩選結果 ({results.length} 筆)</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="wantgoo-table border-0 shadow-none rounded-none w-full">
              <thead>
                <tr>
                  <th className="w-1/4">股票名稱 (代號)</th>
                  <th className="text-right w-[15%]">成交價</th>
                  <th className="text-right w-[15%]">漲跌</th>
                  <th className="text-center w-[15%]">RSI 指標</th>
                  <th className="text-center w-[15%]">J 值指標</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {results.map((stock) => (
                    <motion.tr 
                      key={stock.Code}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-[#F9FAFB] transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1D2939] text-[15px]">{stock.Name}</span>
                          <span className="text-[12px] text-[#667085] mono bg-[#F2F4F7] px-1.5 py-0.5 rounded">{stock.Code}</span>
                        </div>
                      </td>
                      <td className="text-right font-bold mono text-[15px] text-[#1D2939]">{stock.ClosingPrice}</td>
                      <td className="text-right font-bold text-[14px]">
                        <span className={parseFloat(stock.Change) >= 0 ? 'text-[#E31D2D]' : 'text-[#008D41]'}>
                          {parseFloat(stock.Change) >= 0 ? '▲' : '▼'} {Math.abs(stock.Change)}
                        </span>
                      </td>
                      <td className="text-center">
                         <span className="font-bold text-[#1D2939] mono bg-[#F9FAFB] border border-[#EAECF0] px-3 py-1 rounded-full text-[13px]">
                           {stock.rsi}
                         </span>
                      </td>
                      <td className="text-center">
                        <span className="font-bold text-[#C1272D] mono text-[15px]">
                          {stock.j}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>

            {/* 無資料狀態 */}
            {results.length === 0 && !scanning && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-[#F2F4F7] rounded-full flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-[#98A2B3]" />
                </div>
                <h3 className="font-bold text-[#1D2939] text-base mb-1">等待執行掃描 / 無符合結果</h3>
                <p className="text-[13px] text-[#667085]">請調整上方的 RSI 與 J 值拉桿，然後點擊「開始掃描」按鈕</p>
              </div>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
