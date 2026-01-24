
import React, { useState, useEffect } from 'react';
import { Area, CombatState, Enemy, Player } from './types';
import { INITIAL_PLAYER, ITEMS, SKILLS, AREAS } from './constants';
import { RetroButton, RetroCard, ScreenContainer } from './components/Layout';
import { BattleView } from './components/BattleView';
import { User, Package, Swords, Trophy } from 'lucide-react';

// Screen Types
type Screen = 'landing' | 'profile' | 'inventory' | 'battle_select' | 'battle';

// Combat Constants
const TICK_RATE_MS = 500;
const PLAYER_ATTACK_INTERVAL = 3; // Attacks every 3 ticks
const ENEMY_ATTACK_INTERVAL = 4; // Attacks every 4 ticks

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [inventory] = useState(ITEMS); 
  
  // Battle State
  const [selectedArea, setSelectedArea] = useState<Area>(AREAS[0]);
  const [combatState, setCombatState] = useState<CombatState>({
    isActive: false,
    enemy: null,
    currentEnemyHp: 0,
    currentEnemyMana: 0,
    currentPlayerHp: 0,
    currentPlayerMana: 0,
    combatLog: [],
    tickCount: 0,
    phase: 'defeat', // Initial phase set to non-active to prevent effect trigger
    playerNextAttackTick: 0,
    enemyNextAttackTick: 0,
  });

  // --- Logic: Navigation ---
  const navigate = (screen: Screen) => setCurrentScreen(screen);

  // --- Logic: Battle Setup ---
  const startBattle = (enemyTemplate: Enemy) => {
    setCombatState({
      isActive: true,
      enemy: { ...enemyTemplate },
      currentEnemyHp: enemyTemplate.maxHp,
      currentEnemyMana: enemyTemplate.maxMana,
      currentPlayerHp: player.currentHp, // Snapshot current player HP
      currentPlayerMana: player.currentMana,
      combatLog: [`You encountered a ${enemyTemplate.name} (Lvl ${enemyTemplate.level})!`],
      tickCount: 0,
      phase: 'active',
      playerNextAttackTick: PLAYER_ATTACK_INTERVAL,
      enemyNextAttackTick: ENEMY_ATTACK_INTERVAL,
    });
    navigate('battle');
  };

  const endBattle = () => {
    // Apply battle results to main player state
    setPlayer(prev => {
        let newExp = prev.exp;
        let newGold = prev.gold;
        let finalHp = combatState.currentPlayerHp;

        if (combatState.phase === 'victory' && combatState.enemy) {
            newExp += combatState.enemy.expReward;
            newGold += combatState.enemy.goldReward;
        } else if (combatState.phase === 'defeat') {
            // Penalty: Revive with 10% HP
            finalHp = Math.floor(prev.maxHp * 0.1); 
        }

        return {
            ...prev,
            currentHp: finalHp,
            exp: newExp,
            gold: newGold
        };
    });

    // Reset battle state to prevent loop issues
    setCombatState(prev => ({ ...prev, phase: 'defeat', enemy: null }));
    navigate('landing');
  };

  // --- Logic: Continuous Battle Loop ---
  useEffect(() => {
    if (combatState.phase !== 'active' || !combatState.enemy) return;

    const interval = setInterval(() => {
      setCombatState(prev => {
        // Double check phase and enemy exist in this tick
        if (prev.phase !== 'active' || !prev.enemy) return prev;

        const nextTick = prev.tickCount + 1;
        const newLog = [...prev.combatLog];
        let { currentEnemyHp, currentPlayerHp, playerNextAttackTick, enemyNextAttackTick } = prev;
        
        // Fix: Explicitly type phase to allow assignment of 'victory' and 'defeat'
        // Otherwise it is inferred as just 'active' due to the guard clause above
        let phase: CombatState['phase'] = prev.phase;

        // --- Player Turn ---
        if (nextTick >= playerNextAttackTick) {
            const dmg = player.baseDamage; 
            currentEnemyHp -= dmg;
            newLog.push(`[Tick ${nextTick}] You hit ${prev.enemy.name} for ${dmg} damage!`);
            playerNextAttackTick = nextTick + PLAYER_ATTACK_INTERVAL;
        }

        // --- Enemy Turn ---
        if (currentEnemyHp > 0 && nextTick >= enemyNextAttackTick) {
             const dmg = prev.enemy.baseDamage;
             currentPlayerHp -= dmg;
             newLog.push(`[Tick ${nextTick}] ${prev.enemy.name} hits you for ${dmg} damage!`);
             enemyNextAttackTick = nextTick + ENEMY_ATTACK_INTERVAL;
        }

        // --- Check Outcome ---
        if (currentEnemyHp <= 0) {
            currentEnemyHp = 0;
            phase = 'victory';
            newLog.push(`VICTORY! You defeated ${prev.enemy.name}.`);
        } else if (currentPlayerHp <= 0) {
            currentPlayerHp = 0;
            phase = 'defeat';
            newLog.push(`DEFEAT! You were knocked out.`);
        }

        // Keep log size manageable
        if (newLog.length > 20) newLog.shift();

        return {
            ...prev,
            tickCount: nextTick,
            currentEnemyHp,
            currentPlayerHp,
            combatLog: newLog,
            phase,
            playerNextAttackTick,
            enemyNextAttackTick
        };
      });
    }, TICK_RATE_MS);

    return () => clearInterval(interval);
  }, [combatState.phase, combatState.enemy?.id, player.baseDamage]);

  // --- Renderers ---

  const renderLanding = () => (
    <ScreenContainer>
      <div className="flex flex-col items-center gap-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl text-yellow-500 font-bold drop-shadow-lg tracking-widest">
            PIXEL QUEST
          </h1>
          <p className="text-gray-400 text-xs md:text-sm max-w-md mx-auto leading-relaxed">
            Embark on a modular journey. Battle monsters, collect loot, and grow your stats in this text-based RPG.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <RetroButton onClick={() => navigate('profile')}>
            <div className="flex items-center justify-center gap-3">
              <User size={16} /> Profile
            </div>
          </RetroButton>
          <RetroButton onClick={() => navigate('inventory')}>
            <div className="flex items-center justify-center gap-3">
              <Package size={16} /> Inventory
            </div>
          </RetroButton>
          <RetroButton onClick={() => navigate('battle_select')} variant="danger">
            <div className="flex items-center justify-center gap-3">
              <Swords size={16} /> Battle
            </div>
          </RetroButton>
        </div>
      </div>
    </ScreenContainer>
  );

  const renderProfile = () => (
    <ScreenContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b-4 border-gray-700 pb-4">
           <RetroButton onClick={() => navigate('landing')}>Back</RetroButton>
           <h2 className="text-xl text-yellow-400 uppercase">Character Profile</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Equipment Slots */}
           <RetroCard title="Equipment">
              <div className="grid grid-cols-3 gap-4 place-items-center p-4">
                 <div className="w-16 h-16 border-2 border-gray-600 bg-gray-900 flex items-center justify-center text-gray-700 text-[10px]">Helm</div>
                 <div className="col-start-2 w-16 h-16 border-2 border-gray-600 bg-gray-900 flex items-center justify-center text-gray-700 text-[10px]">Chest</div>
                 <div className="col-start-3 w-16 h-16 border-2 border-gray-600 bg-gray-900 flex items-center justify-center text-gray-700 text-[10px]">Sword</div>
                 <div className="col-start-2 w-16 h-16 border-2 border-gray-600 bg-gray-900 flex items-center justify-center text-gray-700 text-[10px]">Legs</div>
                 <div className="col-start-2 row-start-3 w-16 h-16 border-2 border-gray-600 bg-gray-900 flex items-center justify-center text-gray-700 text-[10px]">Boots</div>
              </div>
           </RetroCard>

           {/* Stats */}
           <RetroCard title="Stats">
              <div className="space-y-4 p-2">
                 <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Name</span>
                    <span className="text-white">{player.name}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Level</span>
                    <span className="text-yellow-400">{player.level}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Health</span>
                    <span className="text-green-400">{player.currentHp}/{player.maxHp}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Mana</span>
                    <span className="text-blue-400">{player.currentMana}/{player.maxMana}</span>
                 </div>
                 <div className="flex justify-between border-b border-gray-700 pb-2">
                    <span className="text-gray-400">Damage</span>
                    <span className="text-red-400">{player.baseDamage}</span>
                 </div>
                 <div className="flex justify-between pb-2">
                    <span className="text-gray-400">Armor</span>
                    <span className="text-gray-300">{player.armor}</span>
                 </div>
                 <div className="mt-4 pt-4 border-t-2 border-gray-600 flex justify-between">
                    <span className="text-yellow-600 flex items-center gap-2"><Trophy size={12}/> Gold</span>
                    <span>{player.gold}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-purple-400 flex items-center gap-2">EXP</span>
                    <span>{player.exp}</span>
                 </div>
              </div>
           </RetroCard>
        </div>
      </div>
    </ScreenContainer>
  );

  const renderInventory = () => (
    <ScreenContainer>
      <div className="flex flex-col gap-6 h-[80vh]">
         <div className="flex items-center gap-4 border-b-4 border-gray-700 pb-4">
           <RetroButton onClick={() => navigate('landing')}>Back</RetroButton>
           <h2 className="text-xl text-yellow-400 uppercase">Inventory</h2>
           <span className="ml-auto text-xs text-gray-500">{inventory.length} Items</span>
        </div>
        
        <RetroCard className="flex-1 overflow-hidden flex flex-col">
           <div className="overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-2">
              {inventory.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex items-center gap-4 bg-gray-900 p-3 border border-gray-700 hover:border-gray-500 transition-colors">
                   <div className="w-10 h-10 bg-gray-800 flex items-center justify-center text-2xl border border-gray-600">
                     {item.icon}
                   </div>
                   <div>
                      <div className="text-sm font-bold text-gray-200">{item.name}</div>
                      <div className="text-[10px] text-gray-500">{item.description}</div>
                   </div>
                   <div className="ml-auto text-[10px] uppercase bg-gray-800 px-2 py-1 rounded text-gray-400">
                      {item.type}
                   </div>
                </div>
              ))}
           </div>
        </RetroCard>
      </div>
    </ScreenContainer>
  );

  const renderBattleSelect = () => (
    <ScreenContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b-4 border-gray-700 pb-4">
           <RetroButton onClick={() => navigate('landing')}>Back</RetroButton>
           <h2 className="text-xl text-red-500 uppercase">Select Battle</h2>
        </div>

        <RetroCard title="Select Area">
           <div className="flex flex-col gap-2">
              {AREAS.map(area => (
                 <button 
                   key={area.id}
                   onClick={() => setSelectedArea(area)}
                   className={`p-4 text-left border-2 ${selectedArea.id === area.id ? 'border-yellow-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}
                 >
                    <div className="flex justify-between mb-1">
                       <span className="font-bold">{area.name}</span>
                       <span className="text-xs text-gray-400">Lvl {area.levelRange}</span>
                    </div>
                    <div className="text-xs text-gray-500">{area.description}</div>
                 </button>
              ))}
           </div>
        </RetroCard>

        <RetroCard title="Select Enemy">
            <div className="grid grid-cols-1 gap-2">
               {selectedArea.enemies.map(enemy => (
                  <button
                    key={enemy.id}
                    onClick={() => startBattle(enemy)}
                    className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 hover:border-red-500 group transition-all"
                  >
                     <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs group-hover:bg-red-900">
                           <Swords size={12} />
                        </div>
                        <div className="text-left">
                           <div className="text-sm font-bold text-gray-200 group-hover:text-red-400">{enemy.name}</div>
                           <div className="text-[10px] text-gray-500">Level {enemy.level}</div>
                        </div>
                     </div>
                     <div className="text-[10px] text-red-500 opacity-0 group-hover:opacity-100 uppercase font-bold">
                        Fight
                     </div>
                  </button>
               ))}
            </div>
        </RetroCard>
      </div>
    </ScreenContainer>
  );

  return (
    <>
      {currentScreen === 'landing' && renderLanding()}
      {currentScreen === 'profile' && renderProfile()}
      {currentScreen === 'inventory' && renderInventory()}
      {currentScreen === 'battle_select' && renderBattleSelect()}
      {currentScreen === 'battle' && (
        <ScreenContainer>
          <BattleView 
            player={player} 
            combatState={combatState}
            onLeave={endBattle}
          />
        </ScreenContainer>
      )}
    </>
  );
}
