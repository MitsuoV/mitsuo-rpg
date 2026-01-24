
import React from 'react';

// A container with a retro border style
export const RetroCard: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => {
  return (
    <div className={`relative bg-gray-800 border-4 border-gray-600 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] p-4 ${className}`}>
      {title && (
        <div className="absolute -top-4 left-4 bg-gray-800 px-2 border-2 border-gray-600 text-yellow-400 text-xs font-bold uppercase tracking-wider">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

// A retro styled button
// Fix: Added className to the props interface to allow external styling and resolve TS errors
export const RetroButton: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  disabled?: boolean; 
  variant?: 'primary' | 'danger' | 'success';
  className?: string;
}> = ({ onClick, children, disabled, variant = 'primary', className = '' }) => {
  let bgClass = "bg-blue-600 hover:bg-blue-500";
  let borderClass = "border-blue-800";
  
  if (variant === 'danger') {
    bgClass = "bg-red-600 hover:bg-red-500";
    borderClass = "border-red-800";
  } else if (variant === 'success') {
    bgClass = "bg-green-600 hover:bg-green-500";
    borderClass = "border-green-800";
  }

  if (disabled) {
    bgClass = "bg-gray-600 cursor-not-allowed";
    borderClass = "border-gray-700";
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`
        ${bgClass} ${borderClass} ${className}
        text-white font-bold py-3 px-6 
        border-b-4 border-r-4 active:border-b-0 active:border-r-0 active:mt-1 active:ml-1 active:mr-[-1px] active:mb-[-1px]
        uppercase tracking-widest text-xs transition-all
      `}
    >
      {children}
    </button>
  );
};

// Stat Bar (Health/Mana)
export const StatBar: React.FC<{ current: number; max: number; color: string; label: string }> = ({ current, max, color, label }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-[10px] text-gray-400 uppercase">
        <span>{label}</span>
        <span>{Math.floor(current)}/{max}</span>
      </div>
      <div className="w-full h-4 bg-gray-900 border-2 border-gray-700 relative">
        <div 
          className={`h-full ${color} transition-all duration-300`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export const ScreenContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
};
