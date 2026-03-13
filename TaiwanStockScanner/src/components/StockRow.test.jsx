import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StockRow from './StockRow';

describe('StockRow Component', () => {
  const mockStock = {
    Code: '2330',
    Name: '台積電',
    ClosingPrice: '600',
    QuoteTime: 1710134400, // example timestamp
    Change: '10',
    rsi: '65',
    j: '80',
    k: '70',
    d: '60',
    prevK: '65',
    prevD: '58',
    prevJ: '75'
  };

  it('should render stock code and name', () => {
    // Note: StockRow renders a <tr>, which should be wrapped in <table><tbody> for proper rendering
    render(
      <table>
        <tbody>
          <StockRow stock={mockStock} index={0} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('2330')).toBeInTheDocument();
    expect(screen.getByText('台積電')).toBeInTheDocument();
  });

  it('should render the closing price and change correctly', () => {
    render(
      <table>
        <tbody>
          <StockRow stock={mockStock} index={0} />
        </tbody>
      </table>
    );
    
    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });
});
