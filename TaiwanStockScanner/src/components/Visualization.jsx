import React from 'react';
import { MoreHorizontal } from 'lucide-react';

/**
 * Visualization component for decorative 3D effects.
 * @returns {JSX.Element}
 */
const Visualization = () => {
  return (
    <div className="absolute bottom-6 right-6 w-64 h-48 glass-panel-inner p-4 hidden xl:block shadow-2xl border-[var(--border-active)] bg-black/40 backdrop-blur-md">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-bold text-white tracking-widest">VISUALIZATION</span>
        <MoreHorizontal size={14} className="text-[var(--text-muted)]" />
      </div>
      <div className="relative w-full h-full">
        {/* Decorative glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 rounded-full bg-[var(--primary)] shadow-[0_0_20px_var(--primary)] animate-[pulseGlow_3s_infinite]"></div>
        <div className="absolute top-[40%] left-1/2 w-10 h-10 rounded-full bg-[var(--up-color)] shadow-[0_0_20px_var(--up-color)] opacity-80" style={{ animation: "pulseGlow 4s infinite 1s" }}></div>
        <div className="absolute bottom-1/4 right-[30%] w-6 h-6 rounded-full bg-[var(--down-color)] shadow-[0_0_15px_var(--down-color)] opacity-60" style={{ animation: "pulseGlow 2.5s infinite 2s" }}></div>
        <div className="absolute top-1/3 right-[15%] w-4 h-4 rounded-full bg-[var(--neutral-color)] shadow-[0_0_10px_var(--neutral-color)]" style={{ animation: "pulseGlow 3.5s infinite 0.5s" }}></div>
        
        {/* Axes lines */}
        <div className="absolute bottom-4 left-4 right-4 h-px bg-white/10"></div>
        <div className="absolute bottom-4 left-4 top-4 w-px bg-white/10"></div>
        <div className="absolute bottom-4 left-4 w-1 h-20 bg-white/10 transform origin-bottom-left" style={{ transform: "rotate(-45deg) scaleX(0.5)"}}></div>
        
        {/* Axes labels */}
        <span className="absolute bottom-1 right-2 text-[8px] text-[var(--text-muted)]">Market Cap</span>
        <span className="absolute top-2 left-6 text-[8px] text-[var(--text-muted)]">P/E</span>
      </div>
    </div>
  );
};

export default Visualization;
