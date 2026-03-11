import { describe, it, expect } from 'vitest';
import { calculateRSI, calculateKDJ } from './indicators';

describe('Technical Indicators', () => {
  const mockPrices = [
    { close: 100, high: 105, low: 95 },
    { close: 102, high: 106, low: 98 },
    { close: 104, high: 108, low: 100 },
    { close: 103, high: 105, low: 101 },
    { close: 105, high: 107, low: 102 },
    { close: 107, high: 110, low: 105 },
    { close: 106, high: 108, low: 104 },
    { close: 108, high: 112, low: 106 },
    { close: 110, high: 115, low: 108 },
    { close: 112, high: 116, low: 110 },
  ];

  it('calculates RSI correctly', () => {
    const rsi = calculateRSI(mockPrices, 6);
    expect(rsi.length).toBe(mockPrices.length);
    expect(typeof rsi[rsi.length - 1]).toBe('number');
    // Basic directional check: prices were mostly rising
    expect(rsi[rsi.length - 1]).toBeGreaterThan(50);
  });

  it('calculates KDJ correctly', () => {
    const kdj = calculateKDJ(mockPrices, 9, 3, 3);
    const last = kdj[kdj.length - 1];
    expect(last).toHaveProperty('k');
    expect(last).toHaveProperty('d');
    expect(last).toHaveProperty('j');
    expect(last.k).toBeGreaterThan(0);
    expect(last.k).toBeLessThan(100);
  });
});
