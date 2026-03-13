import { describe, it, expect } from 'vitest';
import { computeRsi, computeKDJ } from './api';

describe('Financial Logic Coverage', () => {
  describe('computeRsi', () => {
    it('returns default 50 if history is too short', () => {
      expect(computeRsi([100, 105], 6)).toBe(50);
    });

    it('returns 100 on continuous gains (zero loss)', () => {
      expect(computeRsi([100, 110, 120, 130, 140, 150, 160, 170], 6)).toBe(100);
    });

    it('calculates RSI correctly for simple trend', () => {
      const data = [100, 110, 105, 115, 110, 120, 115, 125, 120, 130];
      const result = computeRsi(data, 6);
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(100);
    });
  });

  describe('computeKDJ', () => {
    it('returns default for short data', () => {
      const result = computeKDJ([100], [110], [90], 9);
      expect(result.current.k).toBe(50);
    });

    it('handles flat prices correctly (all same)', () => {
      const data = new Array(15).fill(100);
      const result = computeKDJ(data, data, data, 9);
      expect(result.current.k).toBeCloseTo(50);
      expect(result.current.d).toBeCloseTo(50);
      expect(result.current.j).toBeCloseTo(50);
    });

    it('calculates KDJ values for normal trend', () => {
      const closes = [10, 11, 12, 11, 10, 9, 8, 9, 10, 11, 12, 13, 14, 15];
      const highs = closes.map(c => c + 1);
      const lows = closes.map(c => c - 1);
      const result = computeKDJ(closes, highs, lows, 9);
      expect(result.current.k).toBeDefined();
      expect(result.current.d).toBeDefined();
      expect(result.current.j).toBeDefined();
      expect(result.prev.k).toBeDefined();
    });
  });
});
