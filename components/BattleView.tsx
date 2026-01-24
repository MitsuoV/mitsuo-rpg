import React, { useEffect, useRef, useState } from 'react';
import { CombatState, Player } from '../types';
import { RetroButton, RetroCard, StatBar } from './Layout';

interface BattleViewProps {
  player: Player;
  combatState: CombatState;
  onLeave: () => void;
}

/**
 * A robust component for pixel art sprites.
 * Handles loading/error states and uses mix-blend-mode to remove white backgrounds.
 */
const PixelSprite: React.FC<{ src: string; alt: string; isDead?: boolean }> = ({ src, alt, isDead }) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-48 h-48 bg-[#f8fafc] border-8 border-gray-900 shadow-[0_0_20px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden group">
      {/* Sprite floor shadow effect */}
      <div className="absolute bottom-4 w-24 h-4 bg-black/10 rounded-[100%] blur-[4px]"></div>
      
      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-gray-400 animate-pulse uppercase">
          Initializing Sprite...
        </div>
      )}
      
      <img 
        src={src} 
        alt={alt} 
        onLoad={() => setLoading(false)}
        className={`w-full h-full object-contain pixelated transition-all duration-300
          ${isDead ? 'opacity-30 grayscale translate-y-4 scale-90 rotate-12' : 'group-hover:scale-110 group-hover:-translate-y-2'}
          ${error || loading ? 'opacity-0' : 'opacity-100'}
        `}
        style={{ mixBlendMode: 'multiply' }}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
      />
      
      {error && (
        <div className="flex flex-col items-center justify-center text-center p-4">
           <span className="text-3xl mb-2">🚫</span>
           <span className="text-[8px] text-red-500 font-bold uppercase leading-tight">Sprite Asset<br/>Not Found</span>
           <span className="text-[6px] text-gray-500 mt-2 font-mono">{src}</span>
        </div>
      )}
    </div>
  );
};

export const BattleView: React.FC<BattleViewProps> = ({ 
  player, 
  combatState, 
  onLeave 
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll combat log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatState.combatLog]);

  const { enemy, currentEnemyHp, currentEnemyMana, currentPlayerHp, currentPlayerMana } = combatState;

  if (!enemy) return (
    <div className="flex flex-col items-center justify-center h-64 border-4 border-dashed border-gray-700 text-gray-600 uppercase text-xs">
      Missing Combat Data
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header / Top Bar */}
      <div className="flex justify-between items-center bg-gray-800 p-2 border-b-2 border-gray-700 shadow-md">
        <span className="text-yellow-500 text-[10px] tracking-[0.2em] font-bold">ENGAGEMENT LOG</span>
        <span className="text-gray-500 text-[10px] font-mono">T: {combatState.tickCount.toString().padStart(4, '0')}</span>
      </div>

      {/* Battle Scene */}
      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        
        {/* Enemy Side */}
        <RetroCard className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-800/60 border-red-900/40">
           <PixelSprite 
             src={enemy.spriteUrl} 
             alt={enemy.name} 
             isDead={currentEnemyHp <= 0} 
           />
           
           <div className="w-full space-y-3">
             <div className="flex justify-between items-end">
               <span className="text-red-500 font-bold text-xs uppercase tracking-wider">{enemy.name}</span>
               <span className="text-[10px] text-gray-500 font-mono">L.{enemy.level}</span>
             </div>
             <StatBar current={currentEnemyHp} max={enemy.maxHp} color="bg-red-600" label="HP" />
             <StatBar current={currentEnemyMana} max={enemy.maxMana} color="bg-blue-600" label="MP" />
           </div>
        </RetroCard>

        {/* VS Indicator */}
        <div className="flex items-center justify-center py-4 md:py-0">
          <div className="relative group">
            <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full scale-150 group-hover:bg-red-500/40 transition-all"></div>
            <div className="relative w-12 h-12 rounded-full border-4 border-gray-700 bg-gray-950 flex items-center justify-center text-gray-400 font-black text-xs italic z-10">
              VS
            </div>
          </div>
        </div>

        {/* Player Side */}
        <RetroCard className="flex-1 flex flex-col items-center justify-center gap-6 bg-gray-800/60 border-green-900/40">
           {/* Player Avatar */}
           <div className="w-48 h-48 bg-gray-900 border-8 border-gray-700 flex flex-col items-center justify-center text-gray-600 text-[10px] uppercase p-6 text-center shadow-inner">
              <span className="text-4xl mb-3 filter grayscale opacity-50">⚔️</span>
              <span className="tracking-widest">{player.name}</span>
           </div>

           <div className="w-full space-y-3">
             <div className="flex justify-between items-end">
               <span className="text-green-500 font-bold text-xs uppercase tracking-wider">HERO STATUS</span>
               <span className="text-[10px] text-gray-500 font-mono">L.{player.level}</span>
             </div>
             <StatBar current={currentPlayerHp} max={player.maxHp} color="bg-green-600" label="HP" />
             <StatBar current={currentPlayerMana} max={player.maxMana} color="bg-blue-600" label="MP" />
           </div>
        </RetroCard>
      </div>

      {/* Combat Log */}
      <RetroCard title="Battle Narrative" className="h-44 overflow-hidden flex flex-col border-gray-700 shadow-2xl">
        <div ref={logContainerRef} className="overflow-y-auto flex-1 space-y-2 font-mono text-[9px] leading-normal pr-4 custom-scrollbar">
          {combatState.combatLog.length === 0 ? (
            <span className="text-gray-700 italic uppercase tracking-tighter">Synchronizing battlefield data...</span>
          ) : (
            combatState.combatLog.map((log, idx) => {
              const isPlayerAction = log.includes("You hit");
              const isVictory = log.includes("VICTORY");
              return (
                <div key={idx} className={`border-b border-gray-800/60 pb-1 last:border-0 ${isVictory ? 'text-yellow-400 font-bold' : isPlayerAction ? 'text-green-300' : 'text-gray-400'}`}>
                  <span className="text-gray-700 mr-2 font-bold">{isVictory ? '★' : '»'}</span>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </RetroCard>

      {/* Action Bar */}
      <div className="flex justify-center min-h-[60px]">
        {combatState.phase === 'victory' && (
           <div className="w-full max-w-sm">
             <RetroButton onClick={onLeave} variant="success" className="w-full shadow-lg shadow-green-900/20">
               TRIUMPH: CLAIM SPOILS
             </RetroButton>
           </div>
        )}
        {combatState.phase === 'defeat' && (
           <div className="w-full max-w-sm">
             <RetroButton onClick={onLeave} variant="danger" className="w-full shadow-lg shadow-red-900/20">
               CRITICAL FAILURE: WITHDRAW
             </RetroButton>
           </div>
        )}
        
        {combatState.phase === 'active' && (
            <div className="w-full bg-gray-950/80 border-4 border-gray-800 p-3 text-center rounded-sm shadow-2xl">
                <div className="flex justify-around items-center text-[10px] uppercase font-bold tracking-widest text-gray-400">
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-gray-600">Offensive</span>
                        <span className="text-green-500 font-mono">{Math.max(0, combatState.playerNextAttackTick - combatState.tickCount)}</span>
                    </div>
                    <div className="h-10 w-[2px] bg-gray-800/50"></div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-gray-600">Defensive</span>
                        <span className="text-red-500 font-mono">{Math.max(0, combatState.enemyNextAttackTick - combatState.tickCount)}</span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};