import React, { useState } from 'react';
import { Area, Enemy } from '../types';
import { RetroCard, RetroButton, ScreenContainer } from './Layout';
import { generatePixelSprite } from '../gameUtils';
import { Map, Swords, Shield, Zap, Heart, ChevronLeft, ChevronRight, Skull } from 'lucide-react';
import { AREAS } from '../constants';

interface BattleSelectViewProps {
  onSelectEnemy: (enemy: Enemy) => void;
  onBack: () => void;
}

export const BattleSelectView: React.FC<BattleSelectViewProps> = ({ onSelectEnemy, onBack }) => {
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);

  const handleNextArea = () => {
    setCurrentAreaIndex((prev) => (prev + 1) % AREAS.length);
  };

  const handlePrevArea = () => {
    setCurrentAreaIndex((prev) => (prev - 1 + AREAS.length) % AREAS.length);
  };

  if (!selectedArea) {
    return (
      <ScreenContainer>
        <div className="flex flex-col gap-4 md:gap-6 w-full max-w-2xl px-2">
          <div className="flex items-center justify-between bg-gray-900/80 p-3 md:p-4 border-b-4 border-gray-700 backdrop-blur-sm z-10">
            <RetroButton onClick={onBack} className="text-[9px] md:text-[10px] py-1.5 md:py-2 px-3 md:px-4">« Main Menu</RetroButton>
            <div className="flex items-center gap-2 md:gap-3">
              <Map size={16} className="text-yellow-500 md:w-6 md:h-6" />
              <h1 className="text-sm md:text-2xl font-bold uppercase tracking-widest text-gray-200">World Map</h1>
            </div>
            <div className="w-8 md:w-10"></div> {/* Spacer */}
          </div>

          <div className="relative w-full h-[65vh] md:h-96 bg-gray-900 border-4 border-gray-700 rounded-lg overflow-hidden group shadow-2xl">
             {/* Carousel Track */}
             <div 
               className="flex h-full transition-transform duration-500 ease-in-out" 
               style={{ transform: `translateX(-${currentAreaIndex * 100}%)` }}
             >
                {AREAS.map((area) => (
                  <div key={area.id} className="w-full h-full flex-shrink-0 relative">
                     {/* Background Image */}
                     <div 
                       className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                       style={{ 
                         backgroundImage: `url(${area.backgroundImage || 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/sunny%20plains.jpeg'})` 
                       }}
                     />
                     {/* Dark Overlay for Legibility */}
                     <div className="absolute inset-0 bg-black/60" />
                     
                     {/* Content Overlay */}
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 text-center z-10 space-y-4 md:space-y-6">
                        <div className="space-y-2">
                          <h2 className="text-2xl md:text-5xl font-black text-yellow-500 uppercase tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                            {area.name}
                          </h2>
                          <div className="inline-flex items-center gap-2 md:gap-4 bg-black/50 px-3 md:px-4 py-1 md:py-2 border border-gray-600 rounded-full backdrop-blur-sm">
                             <span className="text-[8px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">Levels {area.levelRange}</span>
                             <span className="w-1 h-1 bg-gray-500 rounded-full"></span>
                             <span className="flex items-center gap-1 text-[8px] md:text-xs font-bold text-red-400 uppercase tracking-widest"><Skull size={10} className="md:w-3 md:h-3"/> {area.enemies.length} Threats</span>
                          </div>
                        </div>

                        <p className="max-w-xs md:max-w-md text-[8px] md:text-xs text-gray-300 font-mono leading-relaxed bg-black/40 p-3 md:p-4 rounded border border-gray-700/50 line-clamp-4 md:line-clamp-none">
                          {area.description}
                        </p>

                        <div className="pt-2">
                           <RetroButton onClick={() => setSelectedArea(area)} variant="success" className="px-6 md:px-8 py-2.5 md:py-3 text-[10px] md:text-sm animate-pulse">
                              Enter Region
                           </RetroButton>
                        </div>
                     </div>
                  </div>
                ))}
             </div>

             {/* Navigation Arrows */}
             <button 
               onClick={handlePrevArea} 
               className="absolute left-0 top-1/2 -translate-y-1/2 p-2 md:p-4 text-gray-400 hover:text-white hover:bg-black/20 transition-all z-20"
               disabled={AREAS.length <= 1}
             >
               <ChevronLeft size={32} className="md:w-12 md:h-12 drop-shadow-lg" />
             </button>
             <button 
               onClick={handleNextArea} 
               className="absolute right-0 top-1/2 -translate-y-1/2 p-2 md:p-4 text-gray-400 hover:text-white hover:bg-black/20 transition-all z-20"
               disabled={AREAS.length <= 1}
             >
               <ChevronRight size={32} className="md:w-12 md:h-12 drop-shadow-lg" />
             </button>

             {/* Pagination Dots */}
             <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {AREAS.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full transition-all ${idx === currentAreaIndex ? 'bg-yellow-500 w-3 md:w-4' : 'bg-gray-600'}`}
                  />
                ))}
             </div>
          </div>
        </div>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <div className="flex flex-col gap-4 md:gap-6 w-full max-w-4xl h-[85vh] md:h-[80vh] px-2">
        {/* Header */}
        <div className="flex items-center justify-between bg-gray-900/80 p-3 md:p-4 border-b-4 border-gray-700 backdrop-blur-sm shrink-0">
          <RetroButton onClick={() => setSelectedArea(null)} className="text-[9px] md:text-[10px] py-1.5 md:py-2 px-3 md:px-4">
             <div className="flex items-center gap-1.5 md:gap-2"><ChevronLeft size={10} className="md:w-3 md:h-3"/> Return</div>
          </RetroButton>
          <div className="text-center">
            <h2 className="text-xs md:text-lg font-bold uppercase tracking-widest text-yellow-500">{selectedArea.name}</h2>
            <div className="text-[7px] md:text-[8px] text-gray-500 uppercase font-bold tracking-widest">Select Target</div>
          </div>
          <div className="w-16 md:w-24"></div> {/* Spacer */}
        </div>

        {/* Enemy List */}
        <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-1 md:pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900 pb-4">
          {selectedArea.enemies.map((enemy, idx) => (
            <button
              key={idx}
              onClick={() => onSelectEnemy(enemy)}
              className="w-full bg-gray-900/80 border-2 border-gray-700 hover:border-red-500 hover:bg-gray-800 transition-all p-3 md:p-4 flex items-center gap-4 md:gap-6 group"
            >
              {/* Sprite Section */}
              <div className="w-16 h-16 md:w-32 md:h-32 bg-black/50 border border-gray-600 flex items-center justify-center shrink-0 relative overflow-hidden group-hover:border-red-500/50 transition-colors">
                 <div className="absolute inset-0 bg-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                 <img 
                   src={enemy.spriteUrl || generatePixelSprite({ id: 'enemy_placeholder', name: '?', description: 'Unknown', type: 'consumable', icon: '💀' })} 
                   alt={enemy.name}
                   className="w-full h-full object-contain pixelated relative z-10 group-hover:scale-110 transition-transform duration-300"
                 />
              </div>

              {/* Info Section */}
              <div className="flex-1 flex flex-col justify-center h-full space-y-2 md:space-y-3 text-left">
                 <div className="flex justify-between items-end border-b border-gray-800 pb-1.5 md:pb-2">
                    <h3 className="text-xs md:text-xl font-black text-gray-200 uppercase tracking-tighter group-hover:text-red-500 transition-colors truncate">
                      {enemy.name}
                    </h3>
                    <span className="text-[7px] md:text-xs font-mono text-gray-500 font-bold bg-gray-950 px-1.5 md:px-2 py-0.5 rounded ml-2 whitespace-nowrap">LVL {enemy.level}</span>
                 </div>

                 <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="flex flex-col gap-0.5 md:gap-1">
                       <span className="text-[6px] md:text-[8px] uppercase font-bold text-gray-500">Vitality</span>
                       <div className="flex items-center gap-1.5 md:gap-2 text-red-400 font-bold font-mono">
                          <Heart size={10} className="md:w-3.5 md:h-3.5 fill-current" />
                          <span className="text-[9px] md:text-sm">{enemy.maxHp} HP</span>
                       </div>
                    </div>
                    
                    <div className="flex flex-col gap-0.5 md:gap-1">
                        <span className="text-[6px] md:text-[8px] uppercase font-bold text-gray-500">Defenses</span>
                        <div className="flex gap-2 md:gap-4">
                          <div className="flex items-center gap-1 md:gap-1.5 text-gray-300" title="Physical Resistance">
                              <Shield size={10} className="md:w-3.5 md:h-3.5" />
                              <span className="text-[9px] md:text-xs font-mono font-bold">{enemy.physicalResistance}</span>
                          </div>
                          <div className="flex items-center gap-1 md:gap-1.5 text-blue-300" title="Magical Resistance">
                              <Zap size={10} className="md:w-3.5 md:h-3.5" />
                              <span className="text-[9px] md:text-xs font-mono font-bold">{enemy.magicalResistance}</span>
                          </div>
                        </div>
                    </div>
                 </div>
              </div>

              {/* Action Prompt */}
              <div className="hidden md:flex flex-col items-center justify-center pl-6 border-l border-gray-800 opacity-50 group-hover:opacity-100 transition-opacity">
                 <Swords size={24} className="text-red-500 mb-2" />
                 <span className="text-[8px] uppercase font-bold text-red-400 tracking-widest">Engage</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </ScreenContainer>
  );
};