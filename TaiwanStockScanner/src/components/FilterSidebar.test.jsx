import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FilterSidebar from './FilterSidebar';

describe('FilterSidebar Component', () => {
  const mockCriteria = {
    rsiMax: 70,
    jMax: 80,
    codeQuery: ''
  };
  const mockSetCriteria = vi.fn();
  const mockHandleReset = vi.fn();
  const mockHandleScan = vi.fn();

  it('renders all filter controls', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={false} 
        progress={0} 
      />
    );
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('RSI (Max)')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('J Value (Max)')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/輸入代號/)).toBeInTheDocument();
  });

  it('calls setCriteria when slider value changes', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={false} 
        progress={0} 
      />
    );
    
    const rsiSlider = screen.getAllByRole('slider')[0]; // RSI is first
    fireEvent.change(rsiSlider, { target: { value: '50' } });
    
    expect(mockSetCriteria).toHaveBeenCalledWith(expect.objectContaining({ rsiMax: 50 }));
  });

  it('calls handleReset when reset button is clicked', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={false} 
        progress={0} 
      />
    );
    
    const resetButton = screen.getByText(/Reset Filters/);
    fireEvent.click(resetButton);
    expect(mockHandleReset).toHaveBeenCalled();
  });

  it('calls handleScan when scan button is clicked', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={false} 
        progress={0} 
      />
    );
    
    const scanButton = screen.getByText('搜尋');
    fireEvent.click(scanButton);
    expect(mockHandleScan).toHaveBeenCalled();
  });

  it('calls handleScan when Enter is pressed in codeQuery input', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={false} 
        progress={0} 
      />
    );
    
    const codeInput = screen.getByPlaceholderText(/輸入代號/);
    fireEvent.change(codeInput, { target: { value: '2330' } });
    fireEvent.keyDown(codeInput, { key: 'Enter', code: 'Enter' });
    expect(mockHandleScan).toHaveBeenCalled();
  });

  it('shows progress and disables button while scanning', () => {
    render(
      <FilterSidebar 
        criteria={mockCriteria} 
        setCriteria={mockSetCriteria} 
        handleReset={mockHandleReset} 
        handleScan={mockHandleScan} 
        scanning={true} 
        progress={45} 
      />
    );
    
    expect(screen.getByText(/掃描中... 45%/)).toBeInTheDocument();
    const scanButton = screen.getByRole('button', { name: /掃描中/ });
    expect(scanButton).toBeDisabled();
  });
});
