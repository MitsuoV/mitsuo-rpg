
import React, { useState } from 'react';
import { RetroButton, RetroCard } from './Layout';
import { HERO_CLASSES } from '../constants';
import { Player } from '../types';

interface HeroCreationViewProps {
  onComplete: (hero: Player) => void;
  isLoading: boolean;
  onCancel?: () => void;
}

export const HeroCreationView: React.FC<HeroCreationViewProps> = ({ onComplete, isLoading, onCancel }) => {
  const [heroName, setHeroName] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const isNameValid = /^[a-zA-Z0-9]{3,16}$/.test(heroName);
  const canInitialize = isNameValid && selectedClassId !== null;

  const handleInitialize = () => {
    if (!canInitialize) return;

    const classData = HERO_CLASSES.find(c => c.id === selectedClassId)!;
    
    const newHero: Player = {
      id: Math.random().toString(36).substr(2, 9), // Simple client-side ID
      name: heroName,
      heroClass: classData.name,
      level: 1,
      currentHp: classData.stats.hp,
      maxHp: classData.stats.hp,
      currentMana: classData.stats.mana,
      maxMana: classData.stats.mana,
      armor: classData.stats.armor,
      baseDamage: classData.stats.damage,
      // Fix: Added missing skillPower property
      skillPower: 0,
      exp: 0,
      gold: 0,
      inventory: [],
      equippedSkills: [null, null, null, null, null],
      equipment: {
        head: null,
        chest: null,
        legs: null,
        feet: null,
        mainHand: null,
        offHand: null
      }
    };

    onComplete(newHero);
  };

  const renderClassIcon = (icon: string) => {
    if (icon.startsWith('http')) {
      return <img src={icon} alt="Class Icon" className="w-full h-full object-contain pixelated" />;
    }
    return <span className="text-2xl">{icon}</span>;
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex items-center justify-between">
         {onCancel && (
           <button onClick={onCancel} className="text-[10px] uppercase text-gray-500 hover:text-white">
             « Cancel
           </button>
         )}
         <div className="text-center space-y-2 flex-1">
            <h1 className="text-2xl text-yellow-500 font-bold uppercase tracking-widest">Create Your Hero</h1>
            <p className="text-[10px] text-gray-500 uppercase">Class selection determines your starting stats</p>
         </div>
         {onCancel && <div className="w-8"></div>}
      </div>

      <RetroCard title="Hero Identity">
        <div className="p-2 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] text-gray-400 uppercase font-bold">Hero Name</label>
            <input 
              type="text" 
              value={heroName}
              onChange={(e) => setHeroName(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
              className={`w-full bg-gray-900 border-2 ${heroName && !isNameValid ? 'border-red-500' : 'border-gray-700'} p-3 text-sm text-white focus:border-yellow-500 outline-none font-mono tracking-wider`}
              placeholder="HERO NAME"
              maxLength={16}
            />
            <div className="flex justify-between text-[7px] uppercase font-bold tracking-tighter mt-1">
              <span className={heroName.length >= 3 ? 'text-green-500' : 'text-gray-600'}>3-16 Characters</span>
              <span className={/^[a-zA-Z0-9]+$/.test(heroName) ? 'text-green-500' : 'text-gray-600'}>Alphanumeric Only</span>
            </div>
          </div>
        </div>
      </RetroCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HERO_CLASSES.map((cls) => (
          <button
            key={cls.id}
            onClick={() => setSelectedClassId(cls.id)}
            className={`text-left transition-all relative group ${selectedClassId === cls.id ? 'scale-105 z-10' : 'opacity-70 hover:opacity-100'}`}
          >
            <RetroCard 
              className={`h-full ${selectedClassId === cls.id ? 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'border-gray-700'}`}
            >
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-900 border-2 border-gray-700 flex items-center justify-center overflow-hidden p-1">
                  {renderClassIcon(cls.icon)}
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-bold uppercase ${selectedClassId === cls.id ? 'text-yellow-400' : 'text-gray-300'}`}>
                    {cls.name}
                  </h3>
                  <p className="text-[8px] text-gray-500 uppercase leading-tight mt-1">{cls.description}</p>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-3 font-mono text-[8px] uppercase">
                    <div className="flex justify-between text-green-500 border-b border-gray-800">
                      <span>HP</span>
                      <span>{cls.stats.hp}</span>
                    </div>
                    <div className="flex justify-between text-blue-400 border-b border-gray-800">
                      <span>MP</span>
                      <span>{cls.stats.mana}</span>
                    </div>
                    <div className="flex justify-between text-red-500 border-b border-gray-800">
                      <span>DMG</span>
                      <span>{cls.stats.damage}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 border-b border-gray-800">
                      <span>ARM</span>
                      <span>{cls.stats.armor}</span>
                    </div>
                  </div>
                </div>
              </div>
            </RetroCard>
            {selectedClassId === cls.id && (
              <div className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1 uppercase">Selected</div>
            )}
          </button>
        ))}
      </div>

      <RetroButton 
        disabled={!canInitialize || isLoading}
        onClick={handleInitialize}
        variant="success"
        className="w-full py-4 text-sm"
      >
        {isLoading ? 'Saving Legend...' : 'Initialize Hero'}
      </RetroButton>
    </div>
  );
};
