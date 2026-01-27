
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Area, CombatState, Enemy, Player, Item, HeroClassData, Skill, CombatRewards, ItemSlot, InventoryItem } from './types';
import { INITIAL_PLAYER, ITEMS, AREAS, HERO_CLASSES, SKILLS, ASSETS } from './constants';
import { getExpRequired, getPlayerMaxHp, getPlayerMaxMana, calculatePlayerStats, scaleEnemy, generateDrops, generatePixelSprite } from './gameUtils';
import { RetroButton, RetroCard, ScreenContainer, StatBar } from './components/Layout';
import { BattleView } from './components/BattleView';
import { BattleSelectView } from './components/BattleSelectView';
import { AuthView } from './components/AuthView';
import { HeroCreationView } from './components/HeroCreationView';
import { CharacterSelectView } from './components/CharacterSelectView';
import { SkillsView } from './components/SkillsView';
import { ProfileView } from './components/ProfileView';
import { InventoryView } from './components/InventoryView';
import { DebugMenu } from './components/DebugMenu';
import { GlobalChat } from './components/GlobalChat';
import { AssetPreloader } from './components/AssetPreloader';
import { User, Package, Swords, Trophy, LogOut, ChevronRight, Zap, Maximize, Minimize, Wrench, X, Sparkles, Play } from 'lucide-react';
import { supabase } from './supabaseClient';

type Screen = 'landing' | 'profile' | 'inventory' | 'skills' | 'battle_select' | 'battle' | 'character_select' | 'hero_creation';

const TICK_RATE_MS = 1000; // 1 second per tick for slower, clearer combat

export default function App() {
  const [isAssetsLoaded, setIsAssetsLoaded] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState<Screen>('landing');
  const [allHeroes, setAllHeroes] = useState<Player[]>([]);
  const [player, setPlayer] = useState<Player>(INITIAL_PLAYER);
  const [isLoading, setIsLoading] = useState(true);
  const [showDebug, setShowDebug] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
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

  const combatTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn(`Fullscreen blocked: ${err.message}.`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

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
        .select('player_data')
        .eq('id', authUser.id)
        .maybeSingle();

      let heroes: Player[] = [];
      if (data && data.player_data && data.player_data.heroes) {
        heroes = data.player_data.heroes;
      }

      heroes = heroes.map(h => ({
        ...INITIAL_PLAYER,
        ...h,
        equipment: h?.equipment || INITIAL_PLAYER.equipment,
        inventory: Array.isArray(h?.inventory) ? h.inventory : [],
        equippedSkills: h?.equippedSkills || INITIAL_PLAYER.equippedSkills
      }));

      setAllHeroes(heroes);
      setCurrentScreen('character_select');
    } catch (err) {
      console.error("Failed to load player data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const savePlayerData = async (updatedHero: Player) => {
    const targetId = session?.user?.id;
    if (!targetId) return;

    const { armor, damage, maxMana, skillPower } = calculatePlayerStats(updatedHero);
    const finalHero = { ...updatedHero, armor, baseDamage: damage, maxMana, skillPower };

    const updatedList = (allHeroes || []).map(h => h.id === finalHero.id ? finalHero : h);
    
    setAllHeroes(updatedList);
    setPlayer(finalHero);

    await supabase.from('profiles').update({
      player_data: { heroes: updatedList },
      updated_at: new Date().toISOString(),
    }).eq('id', targetId);
  };

  const navigate = (screen: Screen) => setCurrentScreen(screen);

  const startCombat = (enemyTemplate: Enemy) => {
    const enemy = scaleEnemy(enemyTemplate);
    const { maxMana } = calculatePlayerStats(player);
    
    setCombatState({
      isActive: true,
      enemy: enemy,
      currentEnemyHp: enemy.maxHp,
      currentEnemyMana: enemy.maxMana,
      currentPlayerHp: player.currentHp > 0 ? player.currentHp : player.maxHp,
      currentPlayerMana: player.currentMana,
      combatLog: [`Engaged ${enemy.name} (Lvl ${enemy.level})!`],
      tickCount: 0,
      phase: 'active',
      playerNextAttackTick: 0,
      enemyNextAttackTick: 2,
      skillCooldowns: {}
    });
    navigate('battle');
  };

  const processCombatTick = useCallback(() => {
    setCombatState(prev => {
      if (prev.phase !== 'active' || !prev.enemy) return prev;

      let newLog = [...prev.combatLog];
      let p_hp = prev.currentPlayerHp;
      let e_hp = prev.currentEnemyHp;
      const tick = prev.tickCount + 1;
      let phase = prev.phase;
      let rewards = prev.rewards;

      if (tick >= prev.playerNextAttackTick) {
         const dmg = Math.max(1, Math.floor(player.baseDamage * (100 / (100 + prev.enemy.physicalResistance))));
         e_hp -= dmg;
         newLog.push(`You hit ${prev.enemy.name} for ${dmg} dmg.`);
      }

      if (e_hp > 0 && tick >= prev.enemyNextAttackTick) {
         const dmg = Math.max(1, Math.floor(prev.enemy.baseDamage * (100 / (100 + player.armor))));
         p_hp -= dmg;
         newLog.push(`${prev.enemy.name} hits you for ${dmg} dmg.`);
      }

      if (e_hp <= 0) {
        phase = 'victory';
        e_hp = 0;
        newLog.push(`VICTORY! ${prev.enemy.name} defeated.`);
        const exp = prev.enemy.expReward;
        const gold = prev.enemy.goldReward;
        const drops = generateDrops(prev.enemy.level);
        rewards = { exp, gold, items: drops };
      } else if (p_hp <= 0) {
        phase = 'defeat';
        p_hp = 0;
        newLog.push("DEFEATED! You have fallen...");
      }

      const p_mana = Math.min(player.maxMana, prev.currentPlayerMana + 1);

      return {
        ...prev,
        tickCount: tick,
        combatLog: newLog.slice(-10),
        currentPlayerHp: p_hp,
        currentEnemyHp: e_hp,
        currentPlayerMana: p_mana,
        phase,
        rewards,
        playerNextAttackTick: tick >= prev.playerNextAttackTick ? tick + 2 : prev.playerNextAttackTick,
        enemyNextAttackTick: tick >= prev.enemyNextAttackTick ? tick + 3 : prev.enemyNextAttackTick
      };
    });
  }, [player.baseDamage, player.armor, player.maxMana]);

  useEffect(() => {
    if (combatState.isActive && combatState.phase === 'active') {
      combatTimerRef.current = setInterval(processCombatTick, TICK_RATE_MS);
    } else {
      if (combatTimerRef.current) clearInterval(combatTimerRef.current);
    }
    return () => {
      if (combatTimerRef.current) clearInterval(combatTimerRef.current);
    };
  }, [combatState.isActive, combatState.phase, processCombatTick]);

  const handleUseSkill = (skillId: string) => {
    if (combatState.phase !== 'active' || !combatState.enemy) return;
    const skill = SKILLS.find(s => s.id === skillId);
    if (!skill) return;
    if (combatState.currentPlayerMana < skill.cost) {
      setCombatState(prev => ({...prev, combatLog: [...prev.combatLog, "Not enough mana!"]}));
      return;
    }
    if ((combatState.skillCooldowns[skillId] || 0) > combatState.tickCount) return;

    setCombatState(prev => {
       if (!prev.enemy) return prev;
       let dmg = player.baseDamage * skill.damageMultiplier * (1 + player.skillPower);
       const res = skill.isMagical ? prev.enemy.magicalResistance : prev.enemy.physicalResistance;
       dmg = Math.max(1, Math.floor(dmg * (100 / (100 + res))));
       const newEnemyHp = prev.currentEnemyHp - dmg;
       const newLog = [...prev.combatLog, `You cast ${skill.name} for ${dmg} damage!`];
       let phase = prev.phase;
       let rewards = prev.rewards;
       if (newEnemyHp <= 0) {
          phase = 'victory';
          newLog.push(`VICTORY! ${prev.enemy.name} defeated.`);
          rewards = { exp: prev.enemy.expReward, gold: prev.enemy.goldReward, items: generateDrops(prev.enemy.level) };
       }
       return {
         ...prev,
         currentEnemyHp: Math.max(0, newEnemyHp),
         currentPlayerMana: prev.currentPlayerMana - skill.cost,
         combatLog: newLog.slice(-10),
         phase,
         rewards,
         skillCooldowns: { ...prev.skillCooldowns, [skillId]: prev.tickCount + skill.cooldown }
       };
    });
  };

  const handleLeaveCombat = () => {
    const heroClass = HERO_CLASSES.find(c => c.name === player.heroClass) || HERO_CLASSES[0];
    if (combatState.phase === 'victory' && combatState.rewards) {
       const newExp = player.exp + combatState.rewards.exp;
       const newGold = player.gold + combatState.rewards.gold;
       const newInventory = [...player.inventory, ...(combatState.rewards.items || [])];
       const req = getExpRequired(player.level);
       let finalLevel = player.level;
       let finalExp = newExp;
       if (newExp >= req) { finalLevel++; finalExp = newExp - req; }
       const newMaxHp = getPlayerMaxHp(finalLevel, heroClass.stats.hp);
       const { maxMana: newMaxMana } = calculatePlayerStats({ ...player, level: finalLevel, inventory: newInventory });
       savePlayerData({ ...player, level: finalLevel, exp: finalExp, gold: newGold, inventory: newInventory, maxHp: newMaxHp, currentHp: newMaxHp, currentMana: newMaxMana });
    } else {
       const { maxMana } = calculatePlayerStats(player);
       savePlayerData({ ...player, currentHp: player.maxHp, currentMana: maxMana });
    }
    setCombatState(prev => ({ ...prev, isActive: false, phase: 'defeat' }));
    navigate('landing');
  };

  if (!isAssetsLoaded) {
    return <AssetPreloader onComplete={() => setIsAssetsLoaded(true)} />;
  }

  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-[#050505] to-black opacity-80"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-16 max-w-4xl w-full">
           <div className="logo-float w-full flex items-center justify-center px-4">
              <img src={ASSETS.LOGO} alt="Elyria RPG Logo" className="w-full max-w-[650px] md:max-w-[800px] h-auto object-contain pixelated" />
           </div>
           
           <div className="flex flex-col items-center gap-4 w-full max-w-xs animate-in slide-in-from-bottom-8 duration-1000">
             <button 
               onClick={() => setHasStarted(true)}
               className="group relative w-full bg-transparent overflow-hidden py-4 px-8 border-2 border-yellow-600/50 hover:border-yellow-400 text-yellow-500 font-bold uppercase tracking-[0.2em] transition-all hover:bg-yellow-900/20 active:scale-95"
             >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  <Play size={16} className="fill-current" /> Enter Realm
                </span>
                <div className="absolute inset-0 bg-yellow-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
             </button>
             
             <div className="text-[9px] text-gray-600 font-mono uppercase tracking-widest">
                v1.0.0 • Connected
             </div>
           </div>
        </div>
      </div>
    );
  }

  const renderLanding = () => (
    <ScreenContainer>
      <div className="flex flex-col items-center gap-8 text-center relative w-full">
        <button 
          onClick={toggleFullscreen}
          className="absolute -top-12 right-0 bg-slate-900 border-2 border-slate-700 p-2 text-slate-500 hover:text-yellow-500 hover:border-yellow-500 transition-all active:scale-95"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        <div className="space-y-6 w-full flex flex-col items-center pt-8">
          <div className="w-full max-w-[200px] md:max-w-[280px] mb-2 opacity-90">
            <img src={ASSETS.LOGO} alt="Elyria RPG" className="w-full h-auto object-contain pixelated" />
          </div>
          
          <div className="bg-slate-900/80 p-4 border-2 border-slate-700 max-w-sm w-full mx-auto shadow-xl backdrop-blur-sm relative z-10">
            <div className="flex justify-between items-center mb-2">
              <span className="text-yellow-500 text-xs font-bold uppercase tracking-wider">{player.name}</span>
              <div className="flex gap-2 items-center">
                <span className="text-cyan-400 text-[7px] border border-cyan-900/50 px-1 uppercase bg-cyan-950/30">{player.heroClass}</span>
                <span className="text-gray-400 text-[10px] uppercase font-mono">LVL {player.level}</span>
              </div>
            </div>
            <StatBar current={player.exp} max={getExpRequired(player.level)} color="bg-violet-600" label="EXP" />
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs mt-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <RetroButton onClick={() => navigate('profile')}><User size={14} className="mr-2" /> Profile</RetroButton>
            <RetroButton onClick={() => navigate('inventory')}><Package size={14} className="mr-2" /> Items</RetroButton>
          </div>
          <RetroButton onClick={() => navigate('skills')} className="bg-violet-900/80 hover:bg-violet-800 border-violet-950"><Zap size={16} className="mr-2" /> Skills</RetroButton>
          <RetroButton onClick={() => navigate('battle_select')} variant="danger"><Swords size={16} className="mr-2" /> Battle</RetroButton>
          <button onClick={() => navigate('character_select')} className="mt-4 flex items-center justify-center gap-2 text-[8px] text-slate-500 hover:text-yellow-500 uppercase transition-colors"><User size={10} /> Switch Character</button>
        </div>
        
        {session?.user?.user_metadata?.username === 'MitsuoV' && (
          <button onClick={() => setShowDebug(true)} className="fixed bottom-4 right-4 bg-red-900/50 text-red-100 p-2 border-2 border-red-500 rounded-full font-mono text-xs z-50 opacity-50 hover:opacity-100 flex items-center gap-2"><Wrench size={12} /> DEV</button>
        )}
      </div>
    </ScreenContainer>
  );

  if (isLoading) return <ScreenContainer><div className="text-yellow-500 animate-pulse text-[10px] uppercase tracking-widest font-bold">Synchronizing Cloud Save...</div></ScreenContainer>;

  if (!session) return (
    <ScreenContainer>
      <div className="flex flex-col items-center gap-2 text-center w-full">
        <div className="w-full max-w-[400px] md:max-w-[550px]">
          <img src={ASSETS.LOGO} alt="Elyria RPG" className="w-full h-auto object-contain pixelated" />
        </div>
        <AuthView />
      </div>
    </ScreenContainer>
  );

  return (
    <>
      {currentScreen === 'landing' && renderLanding()}
      {currentScreen === 'profile' && <ProfileView player={player} onEquip={(item, slot) => {
        const newEquip = { ...player.equipment, [slot]: item.instanceId };
        savePlayerData({ ...player, equipment: newEquip });
      }} onUnequip={(slot) => {
        const newEquip = { ...player.equipment, [slot]: null };
        savePlayerData({ ...player, equipment: newEquip });
      }} onBack={() => navigate('landing')} />}
      {currentScreen === 'inventory' && <InventoryView player={player} onBack={() => navigate('landing')} onEquip={(item, slot) => {
        const newEquip = { ...player.equipment, [slot]: item.instanceId };
        savePlayerData({ ...player, equipment: newEquip });
      }} />}
      {currentScreen === 'skills' && <ScreenContainer><SkillsView player={player} onSave={savePlayerData} onBack={() => navigate('landing')} /></ScreenContainer>}
      {currentScreen === 'battle_select' && <BattleSelectView onBack={() => navigate('landing')} onSelectEnemy={startCombat} />}
      {currentScreen === 'battle' && <ScreenContainer><BattleView player={player} combatState={combatState} onUseSkill={handleUseSkill} onLeave={handleLeaveCombat} /></ScreenContainer>}
      {currentScreen === 'character_select' && <ScreenContainer><CharacterSelectView heroes={allHeroes} onSelect={(h) => { setPlayer(h); navigate('landing'); }} onCreate={() => navigate('hero_creation')} onLogout={() => supabase.auth.signOut()} /></ScreenContainer>}
      {currentScreen === 'hero_creation' && <ScreenContainer><HeroCreationView onComplete={(h) => { const updated = [...allHeroes, h]; setAllHeroes(updated); setPlayer(h); navigate('landing'); }} isLoading={false} onCancel={() => navigate('character_select')} /></ScreenContainer>}
      {showDebug && <DebugMenu player={player} onUpdate={savePlayerData} onClose={() => setShowDebug(false)} />}
      {player.id !== INITIAL_PLAYER.id && <GlobalChat player={player} />}
    </>
  );
}
