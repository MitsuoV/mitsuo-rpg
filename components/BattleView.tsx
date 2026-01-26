
import React, { useEffect, useState, useRef } from 'react';
import { CombatState, Player, Skill, Item } from '../types';
import { RetroButton, StatBar } from './Layout';
import { SKILLS, ITEMS } from '../constants';
import { Zap, Trophy, Coins, Box } from 'lucide-react';
import { generatePixelSprite } from '../gameUtils';

interface BattleViewProps {
  player: Player;
  combatState: CombatState;
  onLeave: () => void;
  onUseSkill: (skillId: string) => void;
}

export const BattleView: React.FC<BattleViewProps> = ({ 
  player, 
  combatState, 
  onLeave,
  onUseSkill
}) => {
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [combatState.combatLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (combatState.phase !== 'active') return;
      const key = e.key;
      if (['1', '2', '3', '4', '5'].includes(key)) {
        const index = parseInt(key) - 1;
        const skillId = player.equippedSkills[index];
        if (skillId) {
          onUseSkill(skillId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combatState.phase, player.equippedSkills, onUseSkill]);

  const { enemy, currentEnemyHp, currentPlayerHp, currentPlayerMana } = combatState;

  const renderIcon = (icon: string, sizeClass: string = "text-2xl") => {
    if (icon.startsWith('http')) {
      return <img src={icon} alt="icon" className="w-full h-full object-contain pixelated" />;
    }
    return <span className={sizeClass}>{icon}</span>;
  };

  if (!enemy) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-600 uppercase text-xs">
      Missing Combat Data
    </div>
  );

  return (
    <div className="relative h-[80vh] w-full flex flex-col justify-between">
      
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[50vh]">
        <div className="absolute top-2 left-2 md:top-4 md:left-4 w-40 md:w-64 max-h-32 md:max-h-48 z-0 pointer-events-none md:pointer-events-auto">
           <div className="text-[8px] text-gray-500 uppercase font-bold mb-1 tracking-widest opacity-50">Combat Log</div>
           <div ref={scrollRef} className="w-full h-full max-h-[150px] overflow-y-auto space-y-1 scrollbar-hide">
             {combatState.combatLog.map((entry, i) => {
               let colorClass = "text-gray-400";
               if (entry.includes("You hit") || entry.includes("You cast")) colorClass = "text-green-400";
               else if (entry.includes("hits you")) colorClass = "text-red-400";
               else if (entry.includes("VICTORY")) colorClass = "text-yellow-400 font-bold";
               else if (entry.includes("DEFEAT")) colorClass = "text-red-600 font-bold";
               return ( <div key={i} className={`text-[8px] md:text-[9px] font-mono leading-tight ${colorClass} text-shadow-sm`}>{entry}</div> );
             })}
           </div>
        </div>

        <div className="relative z-10">
          <img src={enemy.spriteUrl} alt={enemy.name} className={`w-64 h-64 md:w-80 md:h-80 object-contain pixelated drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transition-all duration-500 ${currentEnemyHp <= 0 ? 'opacity-0 scale-50 filter grayscale blur-sm' : ''}`} />
        </div>

        <div className="mt-4 w-48 md:w-64 space-y-1 z-10 bg-gray-900/40 p-2 rounded-lg backdrop-blur-sm">
           <div className="flex justify-between items-end text-red-500 font-black text-xs uppercase tracking-widest drop-shadow-md"><span>{enemy.name}</span><span className="text-[10px] text-gray-400">Lv.{enemy.level}</span></div>
           <div className="h-2 w-full bg-gray-950 border border-gray-700 overflow-hidden">
              <div className="h-full bg-red-600 transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, (currentEnemyHp / enemy.maxHp) * 100))}%` }} />
           </div>
           <div className="text-center text-[10px] text-white font-mono font-bold drop-shadow-md">{Math.ceil(currentEnemyHp)} / {enemy.maxHp}</div>
        </div>
      </div>

      <div className="w-full bg-gray-900/90 border-t-4 border-gray-700 p-4 md:p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] backdrop-blur-md z-20">
         <div className="max-w-3xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4 md:gap-12">
               <StatBar current={currentPlayerHp} max={player.maxHp} color="bg-green-500" label={`HP: ${Math.floor(currentPlayerHp)}`} />
               <StatBar current={currentPlayerMana} max={player.maxMana} color="bg-blue-500" label={`MP: ${Math.floor(currentPlayerMana)}`} />
            </div>

            <div className="flex justify-center items-end min-h-[5rem]">
              {combatState.phase === 'victory' && combatState.rewards ? (
                   <div className="w-full flex flex-col gap-4">
                      <div className="bg-gray-800 border-2 border-yellow-500 p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg animate-in slide-in-from-bottom-2">
                          <div className="flex items-center gap-6">
                             <div className="flex items-center gap-2"><Trophy size={16} className="text-purple-400" /><span className="text-sm font-bold text-white">+{combatState.rewards.exp} XP</span></div>
                             <div className="flex items-center gap-2"><Coins size={16} className="text-yellow-400" /><span className="text-sm font-bold text-white">+{combatState.rewards.gold} Gold</span></div>
                          </div>
                          {combatState.rewards.items && combatState.rewards.items.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap">
                               <div className="text-[10px] uppercase font-bold text-gray-400 mr-2">Found:</div>
                               {combatState.rewards.items.map((invItem, idx) => {
                                 const itemDef = ITEMS.find(i => i.id === invItem.itemId);
                                 if (!itemDef) return null;
                                 return (
                                   <div key={idx} className="flex items-center gap-2 bg-gray-900 px-2 py-1 border border-gray-600" title={itemDef.name}>
                                      <div className="w-6 h-6 shrink-0"><img src={generatePixelSprite(itemDef)} alt={itemDef.name} className="w-full h-full object-contain pixelated" /></div>
                                      <span className="text-[10px] text-green-300 font-bold">{itemDef.name}</span>
                                   </div>
                                 );
                               })}
                            </div>
                          )}
                      </div>
                      <RetroButton onClick={onLeave} variant="success" className="w-full animate-bounce">CLAIM REWARDS & RETURN</RetroButton>
                   </div>
              ) : combatState.phase === 'defeat' ? (
                   <RetroButton onClick={onLeave} variant="danger" className="w-full md:w-1/2">DEFEATED... RETREAT</RetroButton>
              ) : (
                 <div className="flex justify-center gap-2 md:gap-4">
                   {player.equippedSkills.map((skillId, idx) => {
                     const skill = skillId ? SKILLS.find(s => s.id === skillId) : null;
                     const nextAvailable = skillId ? (combatState.skillCooldowns[skillId] || 0) : 0;
                     const onCooldown = nextAvailable > combatState.tickCount;
                     const cooldownLeft = Math.max(0, nextAvailable - combatState.tickCount);
                     const canAfford = skill ? currentPlayerMana >= skill.cost : true;
                     const isHovered = hoveredSkill?.id === skill?.id;
                     return (
                       <div key={idx} className="relative group" onMouseEnter={() => skill && setHoveredSkill(skill)} onMouseLeave={() => setHoveredSkill(null)}>
                         {isHovered && skill && (
                           <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-40 bg-gray-900 border-2 border-yellow-500 p-2 text-center shadow-xl z-50 pointer-events-none">
                              <div className="text-[9px] font-bold text-yellow-400 uppercase mb-1">{skill.name}</div>
                              <div className="text-[7px] text-gray-300 leading-tight">{skill.description}</div>
                              <div className="mt-1 flex justify-center gap-2 text-[7px] font-mono"><span className="text-blue-300">{skill.cost} MP</span><span className="text-red-300">{skill.damageMultiplier}x DMG</span></div>
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-500 rotate-45"></div>
                           </div>
                         )}
                         <button onClick={() => skill && !onCooldown && canAfford && onUseSkill(skill.id)} disabled={!skill || onCooldown || !canAfford} className={`relative w-12 h-12 md:w-16 md:h-16 border-2 rounded-lg flex flex-col items-center justify-center transition-all duration-100 ${!skill ? 'border-gray-800 bg-gray-950/50' : onCooldown ? 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed' : !canAfford ? 'border-blue-900 bg-gray-900 opacity-80 cursor-not-allowed' : 'border-gray-500 bg-gray-800 hover:border-yellow-400 hover:bg-gray-700 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-95'}`}>
                            {skill ? ( <> <div className="p-2 w-full h-full flex items-center justify-center">{renderIcon(skill.icon, "text-xl md:text-2xl")}</div> {onCooldown && ( <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg backdrop-blur-[1px]"><span className="text-white font-bold text-sm">{cooldownLeft}</span></div> )} {!canAfford && !onCooldown && ( <div className="absolute inset-0 flex items-center justify-center"><Zap size={16} className="text-blue-500/80" /></div> )} <div className="absolute top-0 right-1 text-[8px] font-mono text-gray-500">{idx + 1}</div> </> ) : ( <div className="w-1 h-1 bg-gray-800 rounded-full" /> )}
                         </button>
                       </div>
                     );
                   })}
                 </div>
              )}
            </div>
         </div>
      </div>
    </div>
  );
};
