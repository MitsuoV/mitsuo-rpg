
import React, { useState } from 'react';
import { RetroButton, RetroCard } from './Layout';
import { SKILLS } from '../constants';
import { Skill, Player } from '../types';
import { Trash2, Zap, Clock, Swords, Info, Check } from 'lucide-react';

interface SkillsViewProps {
  player: Player;
  onSave: (updatedPlayer: Player) => void;
  onBack: () => void;
}

export const SkillsView: React.FC<SkillsViewProps> = ({ player, onSave, onBack }) => {
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);

  const availableSkills = SKILLS.filter(s => !s.requiredClass || s.requiredClass === player.heroClass);

  const equipSkill = (skillId: string) => {
    if (player.equippedSkills.includes(skillId)) return;
    const firstEmpty = player.equippedSkills.findIndex(s => s === null);
    if (firstEmpty !== -1) {
      const newEquipped = [...player.equippedSkills];
      newEquipped[firstEmpty] = skillId;
      onSave({ ...player, equippedSkills: newEquipped });
    }
  };

  const unequipSkill = (index: number) => {
    const newEquipped = [...player.equippedSkills];
    newEquipped[index] = null;
    onSave({ ...player, equippedSkills: newEquipped });
  };

  const renderIcon = (skill: Skill, size: string = "w-full h-full") => {
    if (skill.icon.startsWith('http')) {
      return (
        <img 
          src={skill.icon} 
          alt={skill.name} 
          className={`pixelated ${size} object-cover transition-transform group-hover:scale-105`} 
        />
      );
    }
    return (
      <div className={`${size} flex items-center justify-center bg-gray-900 text-5xl md:text-6xl group-hover:scale-105 transition-transform`}>
        {skill.icon}
      </div>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 md:space-y-10 py-4 px-2 md:px-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-800/80 p-5 rounded-sm border-2 border-gray-700 backdrop-blur-sm">
        <RetroButton onClick={onBack} variant="primary" className="w-full md:w-auto text-[10px] py-2 px-6">
          « Back to Portal
        </RetroButton>
        <div className="text-center md:text-right">
          <h2 className="text-lg md:text-2xl font-bold text-yellow-400 tracking-tighter uppercase">Ability Tome</h2>
          <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-blue-400 font-bold mt-1">Class Path: {player.heroClass}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
        {/* Main Grid: 128x128 Style Responsive Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center gap-3 px-2 border-l-4 border-yellow-500">
            <Swords size={18} className="text-yellow-500" />
            <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest text-gray-300">Learned Techniques</h3>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-8 place-items-center">
            {availableSkills.map(skill => {
              const isEquipped = player.equippedSkills.includes(skill.id);
              return (
                <div 
                  key={skill.id}
                  onMouseEnter={() => setHoveredSkill(skill)}
                  onMouseLeave={() => setHoveredSkill(null)}
                  onClick={() => !isEquipped && equipSkill(skill.id)}
                  className={`
                    group relative flex flex-col items-center justify-center transition-all duration-300
                    ${isEquipped ? 'opacity-60 cursor-default' : 'cursor-pointer'}
                  `}
                >
                  {/* The Revolving Border Frame */}
                  <div className={`
                    revolving-border-container w-32 h-32 md:w-40 md:h-40
                    ${!isEquipped ? 'revolving-border-active' : 'bg-gray-800 border-4 border-gray-700'}
                    rounded-none flex items-center justify-center shadow-lg overflow-hidden
                  `}>
                    <div className="bg-gray-800 w-full h-full flex items-center justify-center relative overflow-hidden">
                      {renderIcon(skill)}
                      
                      {/* Removed MP requirement from overlay as requested */}

                      {/* Checkmark if equipped */}
                      {isEquipped && (
                        <div className="absolute top-1 left-1 bg-yellow-500 text-black p-0.5 border border-black z-20">
                          <Check size={8} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Skill Name Label */}
                  <div className="mt-3 w-full text-center">
                    <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-tighter text-gray-200 group-hover:text-yellow-400 truncate px-2">
                      {skill.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Hotbar and Intel */}
        <div className="lg:col-span-4 space-y-6 flex flex-col">
          <RetroCard title="Active Loadout" className="border-blue-900/50">
            <div className="grid grid-cols-5 lg:grid-cols-1 gap-2 md:gap-3">
              {player.equippedSkills.map((id, idx) => {
                const skill = SKILLS.find(s => s.id === id);
                return (
                  <div 
                    key={idx}
                    className={`
                      relative flex items-center lg:gap-4 p-1 lg:p-3 bg-gray-900 border-2 transition-all
                      ${skill ? 'border-gray-600' : 'border-dashed border-gray-800 opacity-40'}
                    `}
                  >
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-[8px] font-bold text-gray-400 z-10">
                      {idx + 1}
                    </div>
                    <div className="w-10 h-10 lg:w-14 lg:h-14 bg-gray-950 flex items-center justify-center p-0 shrink-0 overflow-hidden">
                      {skill ? (
                        renderIcon(skill, "w-full h-full")
                      ) : (
                        <div className="w-1 h-1 bg-gray-800 rounded-full"></div>
                      )}
                    </div>
                    <div className="hidden lg:block flex-1 overflow-hidden">
                      {skill ? (
                        <>
                          <div className="text-[9px] font-bold text-gray-100 uppercase truncate">{skill.name}</div>
                          <div className="text-[7px] text-yellow-600 font-bold uppercase mt-0.5">Power: x{skill.damageMultiplier}</div>
                        </>
                      ) : (
                        <span className="text-[7px] uppercase font-bold text-gray-700">Empty Slot</span>
                      )}
                    </div>
                    {skill && (
                      <button 
                        onClick={() => unequipSkill(idx)}
                        className="absolute right-1 top-1 lg:static p-1 text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </RetroCard>

          <RetroCard title="Technique Intel" className="flex-1 min-h-[180px] border-yellow-900/40">
            {hoveredSkill ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
                <div className="flex items-center gap-3 border-b border-gray-700 pb-3">
                  <div className="w-12 h-12 bg-gray-950 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {renderIcon(hoveredSkill, "w-full h-full")}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-[10px] font-bold text-yellow-500 uppercase truncate">{hoveredSkill.name}</div>
                    <div className="text-[7px] text-gray-500 font-bold uppercase mt-1">LV.{player.level} Mastery</div>
                  </div>
                </div>
                
                <p className="text-[9px] text-gray-400 italic leading-relaxed flex-1">
                  "{hoveredSkill.description}"
                </p>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                   <div className="bg-gray-950 p-2 border border-gray-800">
                      <div className="text-[6px] text-gray-600 uppercase font-bold mb-1">Mana Cost</div>
                      <div className="text-[10px] font-bold text-blue-400 flex items-center gap-1"><Zap size={8}/> {hoveredSkill.cost}</div>
                   </div>
                   <div className="bg-gray-950 p-2 border border-gray-800">
                      <div className="text-[6px] text-gray-600 uppercase font-bold mb-1">Cooldown</div>
                      <div className="text-[10px] font-bold text-purple-400 flex items-center gap-1"><Clock size={8}/> {hoveredSkill.cooldown}T</div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-6 opacity-30 grayscale">
                <Info size={30} className="text-gray-600 mb-3" />
                <p className="text-[8px] text-gray-500 uppercase font-bold tracking-widest leading-loose">
                  Highlight an arcane<br/>technique for data
                </p>
              </div>
            )}
          </RetroCard>
        </div>
      </div>
    </div>
  );
};
