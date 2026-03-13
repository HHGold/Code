import { useState } from 'react';

async function fetchTseList() {
  try {
    const response = await fetch('/api/twse/v1/exchangeReport/STOCK_DAY_ALL');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.map(item => ({ ...item, Market: 'TSE' }));
  } catch (error) {
    console.error('Error fetching twse list:', error);
    return [];
  }
}

async function fetchTpexList() {
  try {
    const response = await fetch('/api/tpex/v1/tpex_mainboard_quotes');
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.map(item => ({
      Code: item.SecuritiesCompanyCode,
      Name: item.CompanyName,
      ClosingPrice: item.Close,
      Change: item.Change,
      Market: 'OTC'
    }));
  } catch (error) {
    console.error('Error fetching tpex list:', error);
    return [];
  }
}

const toYahooSymbol = (stock) => {
  const code = String(stock.Code || '').trim();
  if (!code) return null;
  const market = stock.Market;
  if (market === 'OTC') return `${code}.TWO`;
  return `${code}.TW`;
};

export function computeRsi(closes, period=6) {
  if (closes.length <= period) return 50;
  let gains = 0, losses = 0;
  for(let i=1; i<=period; i++) {
    const diff = closes[i] - closes[i-1];
    if(diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for(let i=period+1; i<closes.length; i++) {
    const diff = closes[i] - closes[i-1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + avgGain / avgLoss));
}

export function computeKDJ(closes, highs, lows, period=9) {
  if (closes.length < period) return { 
    current: { k: 50, d: 50, j: 50 }, 
    prev: { k: 50, d: 50, j: 50 } 
  };
  let k = 50, d = 50;
  let prevK = 50, prevD = 50, prevJ = 50;
  
  for (let i = 0; i < closes.length; i++) {
    let maxHigh = -Infinity;
    let minLow = Infinity;
    for (let j = Math.max(0, i - period + 1); j <= i; j++) {
      if (highs[j] > maxHigh) maxHigh = highs[j];
      if (lows[j] < minLow) minLow = lows[j];
    }
    const currentClose = closes[i];
    let rsv;
    if (maxHigh === minLow) rsv = 50;
    else rsv = ((currentClose - minLow) / (maxHigh - minLow)) * 100;
    
    if (i === closes.length - 2) {
      prevK = k;
      prevD = d;
      prevJ = 3 * k - 2 * d;
    }
    
    k = k * (2/3) + rsv * (1/3);
    d = d * (2/3) + k * (1/3);
  }
  const j = 3 * k - 2 * d;
  return { 
    current: { k, d, j }, 
    prev: { k: prevK, d: prevD, j: prevJ } 
  };
}

async function fetchYahooQuotes(symbols) {
  if (!symbols.length) return new Map();
  const result = new Map();
  const queue = [...symbols];
  const concurrency = 5;

  const worker = async () => {
    while (queue.length > 0) {
      const symbol = queue.shift();
      if (!symbol) continue;

      const url = `/api/yahoo/v8/finance/chart/${encodeURIComponent(symbol)}?range=100d&interval=1d`;
      try {
        const response = await fetch(url);
        if (!response.ok) continue;
        const data = await response.json();
        const chartData = data?.chart?.result?.[0];
        if (!chartData) continue;

        const meta = chartData.meta;
        const quote = chartData.indicators?.quote?.[0];
        if (!quote || !quote.close || quote.close.length < 2) continue;

        const timestamp = chartData.timestamp || [];
        const rawCloses = quote.close;
        const rawHighs = quote.high;
        const rawLows = quote.low;

        const closes = rawCloses.map((c, i) => c !== null ? c : (i > 0 ? rawCloses[i-1] : meta.chartPreviousClose || 0));
        const highs = rawHighs.map((h, i) => h !== null ? h : (i > 0 ? rawHighs[i-1] : meta.chartPreviousClose || 0));
        const lows = rawLows.map((l, i) => l !== null ? l : (i > 0 ? rawLows[i-1] : meta.chartPreviousClose || 0));

        if (meta.regularMarketPrice) closes[closes.length - 1] = meta.regularMarketPrice;
        if (meta.regularMarketDayHigh) highs[highs.length - 1] = Math.max(highs[highs.length - 1], meta.regularMarketDayHigh);
        if (meta.regularMarketDayLow) lows[lows.length - 1] = Math.min(lows[lows.length - 1], meta.regularMarketDayLow);

        const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
        const previousClose = closes[closes.length - 2];
        const change = currentPrice - previousClose;
        const changePercent = (change / previousClose) * 100;

        let lastTime = null;
        if (timestamp.length > 0) lastTime = timestamp[timestamp.length - 1];

        const validClosesForRsi = closes.filter(c => c > 0);
        const rsi = computeRsi(validClosesForRsi, 6);
        const kdj = computeKDJ(closes, highs, lows, 9);

        result.set(symbol, {
          regularMarketPrice: currentPrice,
          regularMarketChange: change,
          regularMarketChangePercent: changePercent,
          regularMarketTime: lastTime,
          rsi: rsi,
          k: kdj.current.k,
          d: kdj.current.d,
          j: kdj.current.j,
          prevK: kdj.prev.k,
          prevD: kdj.prev.d,
          prevJ: kdj.prev.j
        });
      } catch (err) {
        console.error(`Error fetching yahoo quote for ${symbol}:`, err);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }).map(() => worker()));
  return result;
}

export async function fetchStockList(options = { includeTse: true, includeOtc: true }) {
  const { includeTse, includeOtc } = options;
  const results = [];

  if (includeTse) {
    const tse = await fetchTseList();
    results.push(...tse);
  }

  if (includeOtc) {
    const otc = await fetchTpexList();
    results.push(...otc);
  }

  const map = new Map();
  results.forEach(item => {
    if (item?.Code) {
      map.set(item.Code, item);
    }
  });

  if (map.size === 0) {
    return [
      { Code: '2330', Name: 'TSMC', ClosingPrice: '900', Change: '+10' },
      { Code: '2317', Name: 'Hon Hai', ClosingPrice: '180', Change: '-2' },
      { Code: '2454', Name: 'MediaTek', ClosingPrice: '1200', Change: '+5' },
      { Code: '0050', Name: 'ETF 50', ClosingPrice: '160', Change: '0' },
      { Code: '2881', Name: 'Fubon', ClosingPrice: '75', Change: '+1' },
      { Code: '2603', Name: 'Evergreen', ClosingPrice: '170', Change: '-3' }
    ];
  }

  return Array.from(map.values());
}

export async function fetchStockHistory(symbol) {
  try {
    const response = await fetch(`https://openapi.twse.com.tw/v1/stock/STOCK_DAY_ALL`);
    const data = await response.json();
    return data.find(s => s.Code === symbol);
  } catch (error) {
    console.error(`Error fetching history for ${symbol}:`, error);
    return null;
  }
}

export function useScanner() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const scan = async (criteria) => {
    setScanning(true);
    setProgress(0);
    setError(null);

    const list = await fetchStockList({ includeTse: true, includeOtc: true });
    if (!list || list.length === 0) {
      setError('No stocks returned. Please check API availability or try again later.');
      setScanning(false);
      return;
    }

    const codeQuery = String(criteria.codeQuery || '').trim();
    const filteredList = codeQuery
      ? list.filter(item => String(item.Code || '').includes(codeQuery))
      : list;

    const subsetLimit = codeQuery ? filteredList.length : Math.min(filteredList.length, 600);
    const subsetList = filteredList.slice(0, subsetLimit);
    
    const symbols = subsetList.map((stock) => toYahooSymbol(stock)).filter(Boolean);
    setProgress(10);
    
    const yahooMap = await fetchYahooQuotes(symbols);
    setProgress(60);

    const matched = [];
    for (let i = 0; i < subsetList.length; i++) {
      const stock = subsetList[i];
      const symbol = toYahooSymbol(stock);
      const quote = symbol ? yahooMap.get(symbol) : null;
      
      const rsiValue = quote && quote.rsi ? quote.rsi : 50;
      const jValue = quote && quote.j ? quote.j : 50;

      const formatNum = (v) => typeof v === 'number' ? Number(v.toFixed(2)) : v;

      const enriched = {
        ...stock,
        rsi: (quote && typeof quote.rsi === 'number') ? quote.rsi.toFixed(2) : '--',
        k: (quote && typeof quote.k === 'number') ? quote.k.toFixed(2) : '--',
        d: (quote && typeof quote.d === 'number') ? quote.d.toFixed(2) : '--',
        j: (quote && typeof quote.j === 'number') ? quote.j.toFixed(2) : '--',
        prevK: quote?.prevK,
        prevD: quote?.prevD,
        prevJ: quote?.prevJ,
        ClosingPrice: formatNum(quote?.regularMarketPrice) ?? stock.ClosingPrice,
        Change: formatNum(quote?.regularMarketChange) ?? stock.Change,
        ChangePercent: formatNum(quote?.regularMarketChangePercent) ?? stock.ChangePercent,
        QuoteTime: quote?.regularMarketTime ?? null
      };

      if (codeQuery) {
        matched.push(enriched);
      } else if (rsiValue <= criteria.rsiMax && jValue <= criteria.jMax) {
        matched.push(enriched);
      }
      
      if (i % 20 === 0) {
        setProgress(60 + Math.round((i / subsetList.length) * 40));
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    setResults(matched);
    setProgress(100);
    setScanning(false);
  };

  return { scan, scanning, results, progress, error };
}
