import React, { useState } from 'react';
import { useScanner } from './lib/api';

// Subcomponents
import FilterSidebar from './components/FilterSidebar';
import StockTable from './components/StockTable';

/**
 * Main Application component for Taiwan Stock Scanner.
 * @returns {JSX.Element}
 */
export default function App() {
  const { scan, scanning, results, progress, error } = useScanner();
  
  const initialCriteria = {
    rsiMax: 30,
    jMax: 20,
    codeQuery: ''
  };
  const [criteria, setCriteria] = useState(initialCriteria);

  const handleScan = () => scan(criteria);
  const handleReset = () => setCriteria(initialCriteria);

  return (
    <div className="h-screen overflow-hidden p-4 md:p-8 font-sans">
      <div className="h-full max-w-[1400px] mx-auto space-y-6 flex flex-col">
        
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 flex-1 min-h-0">
          
          {/* Side Filters Section */}
          <FilterSidebar 
            criteria={criteria}
            setCriteria={setCriteria}
            handleReset={handleReset}
            handleScan={handleScan}
            scanning={scanning}
            progress={progress}
          />

          {/* Main Content Section */}
          <div className="relative min-h-0">
            <StockTable 
              results={results}
              scanning={scanning}
              error={error}
            />
            
          </div>

        </div>
      </div>
    </div>
  );
}
