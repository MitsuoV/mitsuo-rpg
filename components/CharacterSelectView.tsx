
import React, { useState } from 'react';
import { Player } from '../types';
import { RetroCard, RetroButton } from './Layout';
import { ChevronLeft, ChevronRight, Plus, LogOut } from 'lucide-react';
import { HERO_CLASSES } from '../constants';

interface CharacterSelectViewProps {
  heroes: Player[];
  onSelect: (hero: Player) => void;
  onCreate: () => void;
  onLogout: () => void;
}

export const CharacterSelectView: React.FC<CharacterSelectViewProps> = ({ heroes = [], onSelect, onCreate, onLogout }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const heroCount = heroes?.length || 0;

  const handleNext = () => {
    if (heroCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % heroCount);
  };

  const handlePrev = () => {
    if (heroCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + heroCount) % heroCount);
  };

  if (heroCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-8">
        <h2 className="text-xl text-yellow-500 font-bold uppercase tracking-widest">No Heroes Found</h2>
        <RetroButton onClick={onCreate} variant="success" className="animate-pulse">
          <div className="flex items-center gap-2">
            <Plus size={16} /> Create First Hero
          </div>
        </RetroButton>
        <button onClick={onLogout} className="text-[10px] text-gray-500 hover:text-red-500 uppercase">
          Logout
        </button>
      </div>
    );
  }

  const currentHero = heroes[currentIndex];
  const heroClassIcon = HERO_CLASSES.find(c => c.name === currentHero.heroClass)?.icon || '👤';

  const renderHeroIcon = (icon: string) => {
    if (icon && icon.startsWith('http')) {
      return <img src={icon} alt="Class Icon" className="w-full h-full object-contain pixelated" />;
    }
    return <span className="text-8xl">{icon || '👤'}</span>;
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-lg mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl text-yellow-500 font-bold uppercase tracking-widest drop-shadow-md">Choose Your Hero</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4 w-full">
        <button 
          onClick={handlePrev}
          className="p-2 text-gray-600 hover:text-yellow-500 transition-colors disabled:opacity-10"
          disabled={heroCount <= 1}
        >
          <ChevronLeft size={48} />
        </button>

        <div className="flex-1">
          <RetroCard className="transform transition-all duration-300 min-h-[400px] flex flex-col items-center justify-center gap-8 border-yellow-500/30 bg-gray-900/40">
             {/* Significantly Larger Symbol as Main Highlight */}
             <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-950/80 border-4 border-gray-800 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(251,191,36,0.1)] overflow-hidden p-4 group">
                <div className="w-full h-full transition-transform duration-500 group-hover:scale-110">
                  {renderHeroIcon(heroClassIcon)}
                </div>
             </div>
             
             <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-white uppercase tracking-tighter drop-shadow-lg">{currentHero.name}</h2>
                <div className="inline-block px-4 py-1 bg-yellow-500/10 border border-yellow-500/40 text-[10px] text-yellow-500 uppercase font-black tracking-widest">
                   Level {currentHero.level} {currentHero.heroClass}
                </div>
             </div>
             
             <RetroButton onClick={() => onSelect(currentHero)} className="w-full text-sm py-4 shadow-xl">
                Enter Realm
             </RetroButton>
          </RetroCard>
        </div>

        <button 
          onClick={handleNext}
          className="p-2 text-gray-600 hover:text-yellow-500 transition-colors disabled:opacity-10"
          disabled={heroCount <= 1}
        >
          <ChevronRight size={48} />
        </button>
      </div>

      <div className="flex gap-6 items-center">
        <button onClick={onCreate} className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 uppercase font-bold tracking-widest transition-colors">
            <Plus size={14} /> New Journey
        </button>
        <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
        <button onClick={onLogout} className="flex items-center gap-2 text-[10px] text-gray-600 hover:text-red-500 uppercase font-bold tracking-widest transition-colors">
            <LogOut size={14} /> Exit Game
        </button>
      </div>

      <div className="text-[9px] text-gray-700 uppercase tracking-[0.2em] font-black">
         Hero {currentIndex + 1} / {heroCount}
      </div>
    </div>
  );
};
