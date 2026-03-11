const parseCsvLine = (line) => {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  result.push(current);
  return result.map((value) => value.trim());
};

const parseCsv = (text) => {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(parseCsvLine);
};

const toNumber = (value) => {
  const num = parseFloat(String(value).replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
};

export async function fetchTaiexDailyHistory(limit = 60) {
  try {
    const response = await fetch('/api/twse-web/indicesReport/MI_5MINS_HIST?response=open_data');
    if (!response.ok) throw new Error('Failed to fetch TAIEX history');
    const text = await response.text();
    const rows = parseCsv(text);
    if (rows.length <= 1) return [];

    const dataRows = rows.slice(1);
    const values = dataRows
      .map((row) => toNumber(row[row.length - 1]))
      .filter((value) => value !== null);

    return values.slice(-limit);
  } catch (error) {
    console.error('Error fetching TAIEX history:', error);
    return [];
  }
}

export async function fetchTxDailyHistory(limit = 60) {
  try {
    const response = await fetch('/api/taifex/data_gov/taifex_open_data.asp?data_name=DailyMarketReportFut');
    if (!response.ok) throw new Error('Failed to fetch TAIFEX daily data');
    const text = await response.text();
    const rows = parseCsv(text);
    if (rows.length <= 1) return null;

    const header = rows[0];
    const idx = (name) => header.indexOf(name);

    const iContract = idx('契約');
    const iSession = idx('交易時段');
    const iMonth = idx('到期月份(週別)');
    const iDate = idx('日期');
    const iLast = idx('最後成交價');
    const iChange = idx('漲跌價');
    const iChangePct = idx('漲跌%');

    const dataRows = rows.slice(1).filter((row) => {
      const contract = row[iContract];
      const session = row[iSession] || '';
      return contract === 'TX' && session.includes('一般');
    });

    if (dataRows.length === 0) return null;

    const byDate = new Map();
    for (const row of dataRows) {
      const date = row[iDate];
      if (!date) continue;
      const list = byDate.get(date) || [];
      list.push(row);
      byDate.set(date, list);
    }

    const dates = Array.from(byDate.keys()).sort();
    const series = [];
    let lastChange = null;
    let lastChangePct = '';
    let lastValue = null;

    for (const date of dates.slice(-limit)) {
      const rowsForDate = byDate.get(date) || [];
      let target = rowsForDate[0];
      if (rowsForDate.length > 1) {
        target = rowsForDate
          .slice()
          .sort((a, b) => {
            const ma = a[iMonth] || '';
            const mb = b[iMonth] || '';
            return ma.localeCompare(mb);
          })[0];
      }

      const last = toNumber(target[iLast]);
      if (last !== null) {
        series.push(last);
        lastValue = last;
        lastChange = toNumber(target[iChange]);
        lastChangePct = target[iChangePct] || '';
      }
    }

    if (series.length === 0) return null;

    return {
      last: lastValue,
      change: lastChange,
      changePct: lastChangePct,
      series
    };
  } catch (error) {
    console.error('Error fetching TX daily data:', error);
    return null;
  }
}
