
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
import { InventoryView } from './components/InventoryView';
import { DebugMenu } from './components/DebugMenu';
import { GlobalChat } from './components/GlobalChat';
import { User, Package, Swords, Trophy, LogOut, ChevronRight, Zap, Maximize, Minimize, Wrench, X, Sparkles, Play } from 'lucide-react';
import { supabase } from './supabaseClient';

type Screen = 'landing' | 'profile' | 'inventory' | 'skills' | 'battle_select' | 'battle' | 'character_select' | 'hero_creation';

const TICK_RATE_MS = 500;
const LOGO_URL = "https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/elyria%20logo.png";

export default function App() {
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

  // --- Render Title Screen ---
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Mystical Background Layers */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-950 via-[#050505] to-black opacity-80"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center gap-16 max-w-4xl w-full">
           <div className="logo-float w-full flex items-center justify-center px-4">
              <img src={LOGO_URL} alt="Elyria RPG Logo" className="w-full max-w-[650px] md:max-w-[800px] h-auto object-contain pixelated" />
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

  // --- Main Render Logic ---

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
          {/* Main Menu Logo - Static and Smaller */}
          <div className="w-full max-w-[200px] md:max-w-[280px] mb-2 opacity-90">
            <img src={LOGO_URL} alt="Elyria RPG" className="w-full h-auto object-contain pixelated" />
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
          <img src={LOGO_URL} alt="Elyria RPG" className="w-full h-auto object-contain pixelated" />
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
      {currentScreen === 'battle_select' && <ScreenContainer><div className="text-center py-20 text-gray-500 uppercase text-xs">Battle Select...</div><RetroButton onClick={() => navigate('landing')}>Back</RetroButton></ScreenContainer>}
      {currentScreen === 'character_select' && <ScreenContainer><CharacterSelectView heroes={allHeroes} onSelect={(h) => { setPlayer(h); navigate('landing'); }} onCreate={() => navigate('hero_creation')} onLogout={() => supabase.auth.signOut()} /></ScreenContainer>}
      {currentScreen === 'hero_creation' && <ScreenContainer><HeroCreationView onComplete={(h) => { const updated = [...allHeroes, h]; setAllHeroes(updated); setPlayer(h); navigate('landing'); }} isLoading={false} onCancel={() => navigate('character_select')} /></ScreenContainer>}
      {showDebug && <DebugMenu player={player} onUpdate={savePlayerData} onClose={() => setShowDebug(false)} />}
      {player.id !== INITIAL_PLAYER.id && <GlobalChat player={player} />}
    </>
  );
}