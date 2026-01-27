
import React from 'react';

// A container with a retro border style
export const RetroCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => {
  return (
    <div className={`relative bg-slate-900/90 border-4 border-slate-700 shadow-[0_0_20px_rgba(0,0,0,0.5)] p-4 backdrop-blur-sm ${className}`}>
      {title && (
        <div className="absolute -top-4 left-4 bg-slate-900 px-3 py-1 border-2 border-slate-600 text-yellow-500 text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-lg">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

// A retro styled button
export const RetroButton: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  disabled?: boolean; 
  variant?: 'primary' | 'danger' | 'success';
  className?: string;
}> = ({ onClick, children, disabled, variant = 'primary', className = '' }) => {
  // Default: Mystical Blue/Indigo
  let bgClass = "bg-indigo-900 hover:bg-indigo-800 text-yellow-100";
  let borderClass = "border-indigo-950";
  
  if (variant === 'danger') {
    bgClass = "bg-red-900/80 hover:bg-red-800 text-red-100";
    borderClass = "border-red-950";
  } else if (variant === 'success') {
    bgClass = "bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100";
    borderClass = "border-emerald-950";
  }

  if (disabled) {
    bgClass = "bg-slate-800 text-slate-500 cursor-not-allowed";
    borderClass = "border-slate-900";
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        ${bgClass} ${borderClass} ${className}
        font-bold py-3 px-6 
        border-2 border-b-4 
        active:border-b-2 active:mt-0.5
        uppercase tracking-widest text-xs transition-all
        shadow-lg
      `}
    >
      {children}
    </button>
  );
};

// Stat Bar (Health/Mana)
export const StatBar: React.FC<{ current: number; max: number; color: string; label?: string }> = ({ current, max, color, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className="flex flex-col gap-1 w-full">
      {label && (
        <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
          <span>{label}</span>
          {!label.includes('/') && !label.includes(':') && <span>{Math.floor(current)}/{max}</span>}
        </div>
      )}
      <div className="w-full h-3 md:h-4 bg-slate-950 border border-slate-700 relative overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-300 relative`} 
          style={{ width: `${percentage}%` }}
        >
          {/* Shine effect */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20"></div>
        </div>
      </div>
    </div>
  );
};

export const ScreenContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-in fade-in duration-500">
        {children}
      </div>
    </div>
  );
};