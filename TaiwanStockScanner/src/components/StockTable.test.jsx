import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import StockTable from './StockTable';

// Mock common dependencies to focus on table logic
vi.mock('./StockRow', () => ({
  default: ({ stock }) => (
    <tr data-testid="stock-row">
      <td>{stock.Code}</td>
      <td>{stock.rsi}</td>
      <td>{stock.j}</td>
    </tr>
  )
}));

describe('StockTable Component', () => {
  const mockResults = [
    { Code: '2330', Name: '台積電', ClosingPrice: '600', Change: '10', rsi: '60', j: '80' },
    { Code: '2317', Name: '鴻海', ClosingPrice: '150', Change: '-2', rsi: '40', j: '20' },
  ];

  it('renders loading or empty state correctly', () => {
    render(<StockTable results={[]} scanning={false} error="" />);
    expect(screen.getByText(/尚無搜尋結果/)).toBeInTheDocument();
  });

  it('renders stock rows when results are provided', () => {
    render(<StockTable results={mockResults} scanning={false} error="" />);
    const rows = screen.getAllByTestId('stock-row');
    expect(rows).toHaveLength(2);
    expect(screen.getByText('2330')).toBeInTheDocument();
    expect(screen.getByText('2317')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'API Connection Failed';
    render(<StockTable results={[]} scanning={false} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('handles sorting when header is clicked', () => {
    render(<StockTable results={mockResults} scanning={false} error="" />);
    
    // Initial order (as provided)
    let rows = screen.getAllByTestId('stock-row');
    expect(rows[0]).toHaveTextContent('2330');

    // Click RSI to sort (asc by default)
    const rsiHeader = screen.getByText(/RSI/);
    fireEvent.click(rsiHeader);

    // After sort: 2317 (rsi: 40) should be first, 2330 (rsi: 60) second
    rows = screen.getAllByTestId('stock-row');
    expect(rows[0]).toHaveTextContent('2317');
    
    // Click again for desc
    fireEvent.click(rsiHeader);
    rows = screen.getAllByTestId('stock-row');
    expect(rows[0]).toHaveTextContent('2330');
  });
});
