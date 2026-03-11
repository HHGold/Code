import { useState, useEffect } from 'react';

/**
 * 獲取所有上市股票清單
 */
export async function fetchStockList() {
  try {
    // 使用 Vite Proxy 避免 CORS 問題
    const response = await fetch('/api/twse/v1/exchangeReport/STOCK_DAY_ALL');
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stock list:', error);
    // 降級方案：如果 API 失敗，回傳一組模擬數據供測試 UI
    return [
      { Code: '2330', Name: '台積電', ClosingPrice: '900', Change: '+10' },
      { Code: '2317', Name: '鴻海', ClosingPrice: '180', Change: '-2' },
      { Code: '2454', Name: '聯發科', ClosingPrice: '1200', Change: '+5' },
      { Code: '0050', Name: '元大台灣50', ClosingPrice: '160', Change: '0' },
      { Code: '2881', Name: '富邦金', ClosingPrice: '75', Change: '+1' },
      { Code: '2603', Name: '長榮', ClosingPrice: '170', Change: '-3' }
    ];
  }
}

/**
 * 獲取特定股票的歷史數據 (本月)
 * @param {string} symbol - 股票代碼 (e.g., 2330)
 */
export async function fetchStockHistory(symbol) {
  try {
    const response = await fetch(`https://openapi.twse.com.tw/v1/stock/STOCK_DAY_ALL`);
    const data = await response.json();
    // 這裡的公開 API 其實是回傳所有股票今日數據
    // 如果要真正的歷史數據進行 KDJ 計算，通常需要取得過去 30 天的資料
    // 對於 MVP，我們先假設使用者要篩選的是基於「近期趨勢」
    return data.find(s => s.Code === symbol);
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    return null;
  }
}

/**
 * 自定義 Hook 用於掃描符合指標的股票
 */
export function useScanner() {
  const [stocks, setStocks] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const scan = async (criteria) => {
    setScanning(true);
    setProgress(0);
    setError(null);
    
    // 1. 獲取初始清單
    const list = await fetchStockList();
    if (!list || list.length === 0) {
      setError('無法獲取股票資料，請檢查網路連線或稍後再試。');
      setScanning(false);
      return;
    }

    setStocks(list);
    const matched = [];
    const total = Math.min(list.length, 500); // 批次處理，上限 500 檔避免效能問題

    // 2. 篩選過程
    for (let i = 0; i < total; i++) {
      const stock = list[i];
      
      // 這裡暫時仍使用模擬數據，確保 UI 邏輯正常
      const dummyRsi = Math.random() * 100;
      const dummyK = Math.random() * 100;
      const dummyD = Math.random() * 100;
      const dummyJ = Math.random() * 100;

      if (dummyRsi <= criteria.rsiMax && dummyJ <= criteria.jMax) {
        matched.push({
          ...stock,
          rsi: dummyRsi.toFixed(2),
          k: dummyK.toFixed(2),
          d: dummyD.toFixed(2),
          j: dummyJ.toFixed(2)
        });
      }
      
      if (i % 20 === 0) {
        setProgress(Math.round((i / total) * 100));
        // 使用非同步釋放主線程，避免 UI 凍結
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    setResults(matched);
    setProgress(100);
    setScanning(false);
  };

  return { scan, scanning, results, progress, error };
}
