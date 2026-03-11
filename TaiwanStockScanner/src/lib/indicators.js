/**
 * 計算相對強弱指標 (RSI)
 * @param {Array} data - 包含 close 的物件陣列
 * @param {number} periods - 週期，預設通常為 14
 */
export function calculateRSI(data, periods = 14) {
  if (!data || data.length <= periods) return Array(data?.length || 0).fill(null);

  const results = Array(data.length).fill(null);
  let gains = 0;
  let losses = 0;

  // 初始化第一個平均漲跌
  for (let i = 1; i <= periods; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / periods;
  let avgLoss = losses / periods;
  results[periods] = 100 - (100 / (1 + avgGain / avgLoss));

  // 計算後續值 (使用線性平滑法)
  for (let i = periods + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (periods - 1) + gain) / periods;
    avgLoss = (avgLoss * (periods - 1) + loss) / periods;

    results[i] = 100 - (100 / (1 + avgGain / avgLoss));
  }

  return results;
}

/**
 * 計算 KDJ 指標
 * @param {Array} data - 包含 high, low, close 的物件陣列
 * @param {number} n - 週期，預設 9
 * @param {number} m1 - K 的權重週期，預設 3
 * @param {number} m2 - D 的權重週期，預設 3
 */
export function calculateKDJ(data, n = 9, m1 = 3, m2 = 3) {
  const results = [];
  let prevK = 50;
  let prevD = 50;

  for (let i = 0; i < data.length; i++) {
    if (i < n - 1) {
      results.push({ k: 50, d: 50, j: 50 });
      continue;
    }

    const slice = data.slice(i - n + 1, i + 1);
    const highN = Math.max(...slice.map(d => d.high));
    const lowN = Math.min(...slice.map(d => d.low));
    
    // RSV = (今日收盤價 - 最近 n 日最低價) / (最近 n 日最高價 - 最近 n 日最低價) * 100
    const rsv = highN === lowN ? 50 : ((data[i].close - lowN) / (highN - lowN)) * 100;

    const k = (rsv + (m1 - 1) * prevK) / m1;
    const d = (k + (m2 - 1) * prevD) / m2;
    const j = 3 * k - 2 * d;

    results.push({ k, d, j });
    prevK = k;
    prevD = d;
  }

  return results;
}
