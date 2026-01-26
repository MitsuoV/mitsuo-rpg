
import React, { useState, useEffect, useCallback } from 'react';
import { Area, CombatState, Enemy, Player, Item, HeroClassData, Skill, CombatRewards, ItemSlot, InventoryItem } from './types';
import { INITIAL_PLAYER, ITEMS, AREAS, HERO_CLASSES, SKILLS } from './constants';
import { getExpRequired, getPlayerMaxHp, getPlayerMaxMana, calculatePlayerStats, scaleEnemy, generateDrops, generatePixelSprite } from './gameUtils';
import { RetroButton, RetroCard, ScreenContainer, StatBar } from './components/Layout';
import { BattleView } from './components/BattleView';
import { AuthView } from './components/AuthView';
import { HeroCreationView } from './components/HeroCreationView';
import { CharacterSelectView } from './components/CharacterSelectView';
import { SkillsView } from './components/SkillsView';
import { ProfileView } from './components/ProfileView';
import { DebugMenu } from './components/DebugMenu';
import { GlobalChat } from './components/GlobalChat';
import { User, Package, Swords, Trophy, LogOut, ChevronRight, Zap, Shield, Heart, Activity, Wrench, X, Sparkles } from 'lucide-react';
import { supabase } from './supabaseClient';

// Screen Types
type Screen = 'landing' | 'profile' | 'inventory' | 'skills' | 'battle_select' | 'battle' | 'character_select' | 'hero_creation';

// Combat Constants
const TICK_RATE_MS = 500;
const PLAYER_ATTACK_INTERVAL = 3; 
const ENEMY_ATTACK_INTERVAL = 4;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [allHeroes, setAllHeroes] = useState<Player[]>([]);
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  
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
    phase: 'defeat',
    playerNextAttackTick: 0,
    enemyNextAttackTick: 0,
    skillCooldowns: {}
  });

  // --- Logic: Auth & Data Sync ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadPlayerData(session.user);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        loadPlayerData(session.user);
      } else {
        setPlayer(INITIAL_PLAYER);
        setAllHeroes([]);
        setCurrentScreen('landing'); 
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadPlayerData = async (authUser: any) => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('player_data, username, email')
        .eq('id', authUser.id)
        .maybeSingle();

      let heroes: Player[] = [];
      if (data && data.player_data) {
        if (data.player_data.heroes && Array.isArray(data.player_data.heroes)) {
             heroes = data.player_data.heroes;
        } else if (data.player_data.heroClass) {
             // Migration logic would go here if needed, but for now assuming new structure or handling errors
             heroes = [{ ...data.player_data, id: data.player_data.id || 'legacy_1', equipment: INITIAL_PLAYER.equipment }];
        }
      }

      // Ensure inventory is array of objects (Migration check)
      heroes = heroes.map(h => {
        let safeInventory = h?.inventory || [];
        // Legacy check: if inventory contains strings, clear it or migrate it (clearing to avoid crashes for this demo)
        if (safeInventory.length > 0 && typeof safeInventory[0] === 'string') {
            safeInventory = [];
        }
        return {
          ...INITIAL_PLAYER,
          ...h,
          equipment: h?.equipment || INITIAL_PLAYER.equipment,
          inventory: safeInventory,
          equippedSkills: h?.equippedSkills || INITIAL_PLAYER.equippedSkills
        };
      });

      setAllHeroes(heroes);
      setCurrentScreen('character_select');

    } catch (err) {
      console.error("Failed to load player data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeroCreationComplete = async (newHero: Player) => {
    setIsLoading(true);
    try {
      const targetId = session?.user?.id;
      if (!targetId) return;

      const { armor, damage, maxMana, skillPower } = calculatePlayerStats(newHero);
      const readyHero = { ...newHero, armor, baseDamage: damage, maxMana, skillPower, currentMana: maxMana };

      const updatedHeroes = [...(allHeroes || []), readyHero];

      const { error } = await supabase.from('profiles').upsert({
        id: targetId,
        player_data: { heroes: updatedHeroes },
        updated_at: new Date().toISOString(),
        username: session.user.user_metadata?.username || undefined, 
      });

      if (error) throw error;

      setAllHeroes(updatedHeroes);
      setPlayer(readyHero);
      setCurrentScreen('landing');
    } catch (err) {
      console.error("Hero creation save failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayerData = async (updatedHero: Player) => {
    const targetId = session?.user?.id;
    if (!targetId) return;

    const { armor, damage, maxMana, skillPower } = calculatePlayerStats(updatedHero);
    const newCurrentMana = Math.min(updatedHero.currentMana, maxMana);
    const finalHero = { ...updatedHero, armor, baseDamage: damage, maxMana, skillPower, currentMana: newCurrentMana };

    const updatedList = (allHeroes || []).map(h => h.id === finalHero.id ? finalHero : h);
    
    setAllHeroes(updatedList);
    setPlayer(finalHero);

    await supabase.from('profiles').update({
      player_data: { heroes: updatedList },
      updated_at: new Date().toISOString(),
    }).eq('id', targetId);
  };

  const handleProfileSelect = (selectedHero: Player) => {
      const heroWithEquip = {
        ...selectedHero,
        equipment: selectedHero.equipment || INITIAL_PLAYER.equipment
      };
      setPlayer(heroWithEquip);
      setCurrentScreen('landing');
  };

  const handleEquipItem = (inventoryItem: InventoryItem, slot: ItemSlot) => {
    const itemDef = ITEMS.find(i => i.id === inventoryItem.itemId);
    if (!itemDef) return;

    if (itemDef.levelReq && player.level < itemDef.levelReq) {
      alert(`Level ${itemDef.levelReq} required to equip this item.`);
      return;
    }
    if (itemDef.classReq && itemDef.classReq !== player.heroClass) {
      alert(`Only ${itemDef.classReq}s can equip this item.`);
      return;
    }

    let newInventory = [...(player.inventory || [])];
    let newEquipment = { ...(player.equipment || INITIAL_PLAYER.equipment) };
    
    // Remove item from inventory logic changed: standard practice in this RPG is keep in inventory but mark equipped
    // The previous implementation replaced IDs in the slot.
    newEquipment[slot as keyof typeof newEquipment] = inventoryItem.instanceId;

    const updatedPlayer: Player = {
      ...player,
      equipment: newEquipment
    };
    
    savePlayerData(updatedPlayer);
    setSelectedInventoryItem(null); 
  };

  const handleUnequipItem = (slot: ItemSlot) => {
    const newEquipment = { ...(player.equipment || INITIAL_PLAYER.equipment) };
    newEquipment[slot as keyof typeof newEquipment] = null;

    savePlayerData({
        ...player,
        equipment: newEquipment
    });
  };

  const startBattle = (enemyTemplate: Enemy) => {
    const scaledEnemy = scaleEnemy(enemyTemplate);
    setCombatState({
      isActive: true,
      enemy: scaledEnemy,
      currentEnemyHp: scaledEnemy.maxHp,
      currentEnemyMana: scaledEnemy.maxMana,
      currentPlayerHp: player.currentHp,
      currentPlayerMana: player.currentMana,
      combatLog: [`You encountered a ${scaledEnemy.name} (Lvl ${scaledEnemy.level})!`],
      tickCount: 0,
      phase: 'active',
      playerNextAttackTick: PLAYER_ATTACK_INTERVAL,
      enemyNextAttackTick: ENEMY_ATTACK_INTERVAL,
      skillCooldowns: {},
      rewards: undefined
    });
    navigate('battle');
  };

  const handleUseSkill = useCallback((skillId: string) => {
    setCombatState(prev => {
      if (prev.phase !== 'active' || !prev.enemy) return prev;
      const skill = SKILLS.find(s => s.id === skillId);
      if (!skill) return prev;
      const nextAvailable = prev.skillCooldowns[skillId] || 0;
      if (prev.currentPlayerMana < skill.cost || nextAvailable > prev.tickCount) return prev;

      // Calculate Skill Damage with Skill Power
      const skillPowerMultiplier = 1 + (player.skillPower || 0);
      const rawDmg = (player.baseDamage * skill.damageMultiplier) * skillPowerMultiplier;
      
      // Resistance Check (Physical vs Magical)
      const resistance = skill.isMagical ? prev.enemy.magicalResistance : prev.enemy.physicalResistance;
      const reducedDmg = Math.max(1, rawDmg - resistance);
      
      const newEnemyHp = Math.max(0, prev.currentEnemyHp - reducedDmg);
      const newMana = prev.currentPlayerMana - skill.cost;
      
      const newLog = [...(prev.combatLog || [])];
      newLog.push(`[Tick ${prev.tickCount}] You cast ${skill.name} for ${Math.floor(reducedDmg)} damage!`);
      if (newLog.length > 20) newLog.shift();

      let phase: CombatState['phase'] = prev.phase;
      let rewards: CombatRewards | undefined = undefined;

      if (newEnemyHp <= 0) {
        phase = 'victory';
        newLog.push(`VICTORY! ${prev.enemy.name} defeated.`);
        const droppedItems = generateDrops(prev.enemy.level);
        rewards = { exp: prev.enemy.expReward, gold: prev.enemy.goldReward, items: droppedItems };
      }

      return {
        ...prev,
        currentEnemyHp: newEnemyHp,
        currentPlayerMana: newMana,
        combatLog: newLog,
        phase,
        rewards,
        playerNextAttackTick: prev.tickCount + skill.tickCost,
        skillCooldowns: { ...prev.skillCooldowns, [skillId]: prev.tickCount + skill.cooldown }
      };
    });
  }, [player.baseDamage, player.skillPower]);

  const endBattle = () => {
    setPlayer(prev => {
        const classData = HERO_CLASSES.find(c => c.name === prev.heroClass) || HERO_CLASSES[0];
        let newLevel = prev.level;
        let newExp = prev.exp;
        let newGold = prev.gold;
        let newInventory = [...(prev.inventory || [])];

        if (combatState.phase === 'victory' && combatState.rewards) {
            newExp += combatState.rewards.exp;
            newGold += combatState.rewards.gold;
            // Push new items to inventory
            (combatState.rewards.items || []).forEach(item => { newInventory.push(item); });
            while (newExp >= getExpRequired(newLevel)) { newExp -= getExpRequired(newLevel); newLevel++; }
        }

        const finalMaxHp = getPlayerMaxHp(newLevel, classData.stats.hp);
        const finalMaxMana = getPlayerMaxMana(newLevel, classData.stats.mana);
        // We calculate stats here to ensure armor/dmg is correct before saving
        const stats = calculatePlayerStats({ ...prev, inventory: newInventory, level: newLevel });

        const updated: Player = { 
            ...prev, 
            level: newLevel, 
            exp: newExp, 
            gold: newGold, 
            maxHp: finalMaxHp, 
            maxMana: finalMaxMana, 
            currentHp: finalMaxHp, 
            currentMana: finalMaxMana, 
            inventory: newInventory,
            armor: stats.armor,
            baseDamage: stats.damage,
            skillPower: stats.skillPower
        };
        savePlayerData(updated);
        return updated;
    });
    setCombatState(prev => ({ ...prev, phase: 'defeat', enemy: null, rewards: undefined }));
    navigate('landing');
  };

  useEffect(() => {
    if (combatState.phase !== 'active' || !combatState.enemy) return;
    const interval = setInterval(() => {
      setCombatState(prev => {
        if (prev.phase !== 'active' || !prev.enemy) return prev;
        const nextTick = prev.tickCount + 1;
        const newLog = [...(prev.combatLog || [])];
        let { currentEnemyHp, currentPlayerHp, playerNextAttackTick, enemyNextAttackTick } = prev;
        let phase: CombatState['phase'] = prev.phase;
        let rewards: CombatRewards | undefined = undefined;

        if (nextTick >= playerNextAttackTick) {
            // Basic Attacks are Physical
            const reducedDmg = Math.max(1, player.baseDamage - prev.enemy.physicalResistance);
            currentEnemyHp -= reducedDmg;
            newLog.push(`[Tick ${nextTick}] You hit ${prev.enemy.name} for ${Math.floor(reducedDmg)} damage!`);
            playerNextAttackTick = nextTick + PLAYER_ATTACK_INTERVAL;
        }

        if (currentEnemyHp > 0 && nextTick >= enemyNextAttackTick) {
             const reducedDmg = Math.max(1, prev.enemy.baseDamage - player.armor);
             currentPlayerHp -= reducedDmg;
             newLog.push(`[Tick ${nextTick}] ${prev.enemy.name} hits you for ${Math.floor(reducedDmg)} damage!`);
             enemyNextAttackTick = nextTick + ENEMY_ATTACK_INTERVAL;
        }

        if (currentEnemyHp <= 0) {
            currentEnemyHp = 0; phase = 'victory'; newLog.push(`VICTORY! ${prev.enemy.name} defeated.`);
            const droppedItems = generateDrops(prev.enemy.level);
            rewards = { exp: prev.enemy.expReward, gold: prev.enemy.goldReward, items: droppedItems };
        } else if (currentPlayerHp <= 0) {
            currentPlayerHp = 0; phase = 'defeat'; newLog.push(`DEFEAT! You were knocked out.`);
        }

        if (newLog.length > 20) newLog.shift();
        return { ...prev, tickCount: nextTick, currentEnemyHp, currentPlayerHp, combatLog: newLog, phase, rewards, playerNextAttackTick, enemyNextAttackTick };
      });
    }, TICK_RATE_MS);
    return () => clearInterval(interval);
  }, [combatState.phase, combatState.enemy?.id, player.baseDamage, player.armor]);

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  if (isLoading) { return <ScreenContainer><div className="text-yellow-500 animate-pulse text-[10px] uppercase tracking-widest font-bold">Synchronizing Cloud Save...</div></ScreenContainer>; }

  if (!session) {
    return (
      <ScreenContainer>
        <div className="flex flex-col items-center gap-12 text-center">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl text-yellow-500 font-bold drop-shadow-lg tracking-widest leading-none">PIXEL QUEST</h1>
            <p className="text-gray-500 text-[8px] uppercase tracking-tighter">Your legend is saved in the cloud</p>
          </div>
          <AuthView />
        </div>
      </ScreenContainer>
    );
  }

  if (currentScreen === 'character_select') {
      return (
          <ScreenContainer>
              <CharacterSelectView heroes={allHeroes || []} onSelect={handleProfileSelect} onCreate={() => navigate('hero_creation')} onLogout={() => supabase.auth.signOut()} />
          </ScreenContainer>
      );
  }

  if (currentScreen === 'hero_creation') {
    return (
      <ScreenContainer>
        <HeroCreationView onComplete={handleHeroCreationComplete} isLoading={isLoading} onCancel={(allHeroes?.length || 0) > 0 ? () => navigate('character_select') : undefined} />
      </ScreenContainer>
    );
  }

  const isDev = session?.user?.user_metadata?.username === 'MitsuoV';

  const renderLanding = () => (
    <ScreenContainer>
      <div className="flex flex-col items-center gap-8 text-center relative">
        <div className="space-y-4 w-full">
          <h1 className="text-4xl md:text-6xl text-yellow-500 font-bold drop-shadow-lg tracking-widest leading-none">PIXEL QUEST</h1>
          <div className="bg-gray-800 p-4 border-2 border-gray-700 max-w-sm mx-auto shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">{player.name}</span>
              <div className="flex gap-2 items-center">
                <span className="text-blue-400 text-[7px] border border-blue-900 px-1 uppercase">{player.heroClass}</span>
                <span className="text-gray-400 text-[10px] uppercase font-mono">LVL {player.level}</span>
              </div>
            </div>
            <StatBar current={player.exp} max={getExpRequired(player.level)} color="bg-purple-600" label="EXP" />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <div className="grid grid-cols-2 gap-4">
            <RetroButton onClick={() => navigate('profile')}><User size={14} className="mr-2" /> Profile</RetroButton>
            <RetroButton onClick={() => navigate('inventory')}><Package size={14} className="mr-2" /> Items</RetroButton>
          </div>
          <RetroButton onClick={() => navigate('skills')} className="bg-purple-700 hover:bg-purple-600 border-purple-900"><Zap size={16} className="mr-2" /> Skills</RetroButton>
          <RetroButton onClick={() => navigate('battle_select')} variant="danger"><Swords size={16} className="mr-2" /> Battle</RetroButton>
          <button onClick={() => setCurrentScreen('character_select')} className="mt-4 flex items-center justify-center gap-2 text-[8px] text-gray-600 hover:text-yellow-500 uppercase transition-colors"><User size={10} /> Switch Character</button>
        </div>
        {isDev && ( <button onClick={() => setShowDebug(true)} className="fixed bottom-4 right-4 bg-red-900 text-red-100 p-2 border-2 border-red-500 rounded-full font-mono text-xs z-50 opacity-50 hover:opacity-100 flex items-center gap-2"><Wrench size={12} /> DEV</button> )}
      </div>
    </ScreenContainer>
  );

  const renderInventory = () => {
    // Filter out items that are currently equipped
    const equippedInstanceIds = Object.values(player.equipment || {}).filter(Boolean);
    const bagItems = (player.inventory || []).filter(invItem => invItem && !equippedInstanceIds.includes(invItem.instanceId));

    return (
      <ScreenContainer>
        <div className="flex flex-col gap-6 h-[80vh] relative">
          
          {/* Header */}
          <div className="flex items-center gap-4 border-b-4 border-gray-700 pb-4">
            <RetroButton onClick={() => navigate('landing')}>Back</RetroButton>
            <h2 className="text-xl text-yellow-400 uppercase">Inventory</h2>
            <span className="ml-auto text-xs text-gray-500">{bagItems?.length || 0} Items</span>
          </div>
          
          {/* Inventory Grid */}
          <RetroCard className="flex-1 overflow-hidden flex flex-col bg-gray-900/80">
            {!bagItems || bagItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-600 uppercase text-[10px] tracking-widest font-bold gap-4">
                <Package size={48} className="opacity-20" />
                Your bag is empty...
              </div>
            ) : (
              <div className="overflow-y-auto pr-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 p-2">
                {bagItems.map((invItem, idx) => {
                  const itemDef = ITEMS.find(i => i.id === invItem.itemId);
                  if (!itemDef) return null;
                  
                  // Rarity Border based on Mod count
                  const modCount = invItem.mods ? invItem.mods.length : 0;
                  const borderColor = modCount >= 3 ? 'border-orange-500' : modCount >= 2 ? 'border-yellow-400' : modCount >= 1 ? 'border-blue-400' : 'border-gray-700';

                  return (
                    <button 
                      key={`${invItem.instanceId}-${idx}`} 
                      onClick={() => setSelectedInventoryItem(invItem)}
                      className={`group flex flex-col items-center gap-2 bg-gray-800 p-2 border-2 ${borderColor} hover:border-white hover:-translate-y-1 transition-all shadow-lg active:scale-95 relative`}
                    >
                      {/* Main Highlight Sprite */}
                      <div className="w-16 h-16 bg-gray-900 border border-gray-600 flex items-center justify-center overflow-hidden">
                         <img 
                            src={generatePixelSprite(itemDef)} 
                            alt={itemDef.name} 
                            className="w-full h-full object-contain pixelated group-hover:scale-110 transition-transform duration-300" 
                          />
                      </div>
                      
                      {/* Mod Indicator */}
                      {modCount > 0 && (
                          <div className="absolute top-1 right-1 flex gap-0.5">
                              {Array.from({length: modCount}).map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                              ))}
                          </div>
                      )}

                      {/* Item Name with Auto-Scroll if needed */}
                      <div className="w-full h-6 relative overflow-hidden bg-black/30 rounded px-1 flex items-center">
                         <div className={`text-[8px] font-bold text-gray-200 uppercase whitespace-nowrap ${(itemDef.name?.length || 0) > 10 ? 'marquee-container' : 'text-center w-full'}`}>
                            <div className={(itemDef.name?.length || 0) > 10 ? 'marquee-content' : ''}>
                               {itemDef.name}
                            </div>
                         </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </RetroCard>

          {/* Item Details Modal */}
          {selectedInventoryItem && (
             <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <RetroCard className="w-full max-w-sm relative border-yellow-500 shadow-[0_0_20px_rgba(0,0,0,0.2)]">
                   <button 
                      onClick={() => setSelectedInventoryItem(null)} 
                      className="absolute top-2 right-2 text-red-500 hover:text-white transition-colors"
                   >
                      <X size={24} />
                   </button>
                   
                   {(() => {
                        const itemDef = ITEMS.find(i => i.id === selectedInventoryItem.itemId)!;
                        return (
                           <div className="flex flex-col items-center gap-6 p-4">
                              {/* Large Sprite Display */}
                              <div className="w-32 h-32 bg-gray-900 border-4 border-gray-700 p-2 shadow-inner">
                                 <img 
                                    src={generatePixelSprite(itemDef)} 
                                    alt={itemDef.name} 
                                    className="w-full h-full object-contain pixelated" 
                                 />
                              </div>
                              
                              <div className="text-center space-y-2 w-full">
                                 <h3 className="text-lg font-bold text-yellow-400 uppercase tracking-wider">{itemDef.name}</h3>
                                 <div className="h-px w-1/2 bg-gray-700 mx-auto"></div>
                                 <p className="text-[10px] text-gray-400 uppercase italic">"{itemDef.description}"</p>
                              </div>

                              {/* Stats Grid */}
                              <div className="w-full space-y-2">
                                  {itemDef.stats && (
                                    <div className="grid grid-cols-2 gap-2 w-full">
                                       {itemDef.stats.damage && (
                                          <div className="bg-gray-900 p-2 border border-red-900/50 flex justify-between items-center">
                                             <span className="text-[8px] text-gray-500 uppercase font-bold">Base Dmg</span>
                                             <span className="text-red-400 font-bold">+{itemDef.stats.damage}</span>
                                          </div>
                                       )}
                                       {itemDef.stats.armor && (
                                          <div className="bg-gray-900 p-2 border border-gray-700 flex justify-between items-center">
                                             <span className="text-[8px] text-gray-500 uppercase font-bold">Base Arm</span>
                                             <span className="text-gray-300 font-bold">+{itemDef.stats.armor}</span>
                                          </div>
                                       )}
                                       {itemDef.stats.maxMana && (
                                          <div className="bg-gray-900 p-2 border border-blue-900/50 flex justify-between items-center">
                                             <span className="text-[8px] text-gray-500 uppercase font-bold">Mana</span>
                                             <span className="text-blue-400 font-bold">+{itemDef.stats.maxMana}</span>
                                          </div>
                                       )}
                                    </div>
                                  )}

                                  {/* Mods Section */}
                                  {selectedInventoryItem.mods && selectedInventoryItem.mods.length > 0 && (
                                      <div className="mt-2 pt-2 border-t border-gray-800">
                                          <div className="flex items-center gap-2 mb-2 text-yellow-500 text-[10px] font-bold uppercase">
                                              <Sparkles size={10} /> Enchants
                                          </div>
                                          <div className="space-y-1">
                                              {selectedInventoryItem.mods.map((mod, i) => (
                                                  <div key={i} className="flex justify-between items-center text-[9px] bg-gray-900/50 px-2 py-1 rounded">
                                                      <span className="text-gray-400 uppercase">{mod.name}</span>
                                                      <span className="text-green-400 font-mono">
                                                          {mod.type === 'skillPower' ? `+${(mod.value * 100).toFixed(0)}% Skill Pwr` : `+${mod.value} ${mod.type === 'damage' ? 'Dmg' : 'Arm'}`}
                                                      </span>
                                                  </div>
                                              ))}
                                          </div>
                                      </div>
                                  )}
                              </div>

                              {/* Requirements */}
                              <div className="flex gap-4 text-[8px] font-bold uppercase">
                                 {itemDef.levelReq && (
                                    <span className={player.level >= itemDef.levelReq ? 'text-green-500' : 'text-red-500'}>
                                       Lvl {itemDef.levelReq} Req
                                    </span>
                                 )}
                                 {itemDef.classReq && (
                                    <span className={player.heroClass === itemDef.classReq ? 'text-green-500' : 'text-red-500'}>
                                       {itemDef.classReq} Only
                                    </span>
                                 )}
                              </div>

                              {/* Action Button */}
                              {itemDef.slot && (
                                 <RetroButton 
                                    onClick={() => handleEquipItem(selectedInventoryItem, itemDef.slot!)}
                                    className="w-full mt-2"
                                    variant="primary"
                                 >
                                    Equip Item
                                 </RetroButton>
                              )}
                           </div>
                        );
                   })()}
                </RetroCard>
             </div>
          )}
        </div>
      </ScreenContainer>
    );
  };

  const renderBattleSelect = () => (
    <ScreenContainer>
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 border-b-4 border-gray-700 pb-4">
           <RetroButton onClick={() => navigate('landing')}>Back</RetroButton>
           <h2 className="text-xl text-red-500 uppercase">Select Battle</h2>
        </div>
        <RetroCard title="Select Area">
           <div className="flex flex-col gap-2">
              {(AREAS || []).map(area => (
                 <button key={area.id} onClick={() => setSelectedArea(area)} className={`p-4 text-left border-2 transition-all ${selectedArea.id === area.id ? 'border-yellow-500 bg-gray-700' : 'border-gray-600 bg-gray-800 hover:bg-gray-700'}`}>
                    <div className="flex justify-between mb-1">
                       <span className="font-bold tracking-wider">{area.name}</span>
                       <span className="text-xs text-gray-400 font-mono">Level {area.levelRange}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{area.description}</div>
                 </button>
              ))}
           </div>
        </RetroCard>
        <RetroCard title="Select Enemy">
            <div className="grid grid-cols-1 gap-2">
               {(selectedArea?.enemies || []).map((enemy, idx) => {
                  const scaled = scaleEnemy(enemy);
                  return (
                    <button key={`${enemy.id}-${idx}`} onClick={() => startBattle(enemy)} className="flex items-center justify-between p-4 bg-gray-900 border border-gray-700 hover:border-red-500 group transition-all">
                       <div className="flex items-center gap-4 text-left">
                          <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-xs group-hover:bg-red-900 transition-colors"><Swords size={12} /></div>
                          <div>
                             <div className="text-sm font-bold text-gray-200 group-hover:text-red-400 transition-colors">{enemy.name}</div>
                             <div className="text-[10px] text-gray-500 flex items-center gap-2 font-mono"><span className="text-red-400">Lv.{enemy.level}</span><ChevronRight size={8} /><span className="text-gray-400">{scaled.maxHp} HP</span></div>
                             <div className="text-[8px] text-gray-600 font-mono flex gap-2">
                                <span>DEF: {scaled.physicalResistance}</span>
                                <span>RES: {scaled.magicalResistance}</span>
                             </div>
                          </div>
                       </div>
                    </button>
                  );
               })}
            </div>
        </RetroCard>
      </div>
    </ScreenContainer>
  );

  return (
    <>
      {currentScreen === 'landing' && renderLanding()}
      {currentScreen === 'profile' && ( <ProfileView player={player} onEquip={handleEquipItem} onUnequip={handleUnequipItem} onBack={() => navigate('landing')} /> )}
      {currentScreen === 'inventory' && renderInventory()}
      {currentScreen === 'skills' && ( <ScreenContainer> <SkillsView player={player} onSave={savePlayerData} onBack={() => navigate('landing')} /> </ScreenContainer> )}
      {currentScreen === 'battle_select' && renderBattleSelect()}
      {currentScreen === 'battle' && ( <ScreenContainer> <BattleView player={player} combatState={combatState} onLeave={endBattle} onUseSkill={handleUseSkill} /> </ScreenContainer> )}
      {currentScreen === 'character_select' && ( <ScreenContainer> <CharacterSelectView heroes={allHeroes || []} onSelect={handleProfileSelect} onCreate={() => navigate('hero_creation')} onLogout={() => supabase.auth.signOut()} /> </ScreenContainer> )}
      {currentScreen === 'hero_creation' && ( <ScreenContainer> <HeroCreationView onComplete={handleHeroCreationComplete} isLoading={isLoading} onCancel={(allHeroes?.length || 0) > 0 ? () => navigate('character_select') : undefined} /> </ScreenContainer> )}
      {showDebug && ( <DebugMenu player={player} onUpdate={savePlayerData} onClose={() => setShowDebug(false)} /> )}
      {session && player.id !== INITIAL_PLAYER.id && <GlobalChat player={player} />}
    </>
  );
}
