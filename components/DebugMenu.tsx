
import React, { useState } from 'react';
import { Player, Item } from '../types';
import { ITEMS, HERO_CLASSES } from '../constants';
import { getPlayerMaxHp, getPlayerMaxMana, calculatePlayerStats, createItemInstance } from '../gameUtils';
import { RetroCard, RetroButton } from './Layout';
import { X, Plus, Trash2, RefreshCw } from 'lucide-react';

interface DebugMenuProps {
  player: Player;
  onUpdate: (player: Player) => void;
  onClose: () => void;
}

export const DebugMenu: React.FC<DebugMenuProps> = ({ player, onUpdate, onClose }) => {
  const [levelInput, setLevelInput] = useState(player.level.toString());
  const [goldInput, setGoldInput] = useState(player.gold.toString());

  const handleUpdateStats = () => {
    const newLevel = parseInt(levelInput) || 1;
    const newGold = parseInt(goldInput) || 0;
    
    const heroClass = HERO_CLASSES.find(c => c.name === player.heroClass) || HERO_CLASSES[0];
    const maxHp = getPlayerMaxHp(newLevel, heroClass.stats.hp);
    const maxMana = getPlayerMaxMana(newLevel, heroClass.stats.mana);
    
    const tempPlayer = { ...player, level: newLevel };
    const { armor, damage, skillPower } = calculatePlayerStats(tempPlayer);

    onUpdate({
      ...player,
      level: newLevel,
      gold: newGold,
      maxHp,
      maxMana,
      currentHp: maxHp,
      currentMana: maxMana,
      armor,
      baseDamage: damage,
      skillPower
    });
  };

  const handleAddItem = (item: Item) => {
    const instance = createItemInstance(item.id);
    if (!instance) return;
    
    onUpdate({
      ...player,
      inventory: [...(player.inventory || []), instance]
    });
  };

  const handleRemoveItem = (index: number) => {
    const newInv = [...(player.inventory || [])];
    newInv.splice(index, 1);
    onUpdate({
      ...player,
      inventory: newInv
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 overflow-y-auto">
      <RetroCard title="DEV CONSOLE: MitsuoV" className="w-full max-w-2xl border-red-500 shadow-red-900/50">
        <div className="flex justify-between mb-4 border-b border-gray-700 pb-2">
            <span className="text-red-500 font-bold animate-pulse">ADMIN ACCESS GRANTED</span>
            <button onClick={onClose}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-4">
                <h3 className="text-xs uppercase font-bold text-gray-400 border-b border-gray-800">Player Stats</h3>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Level</label>
                        <input className="w-full bg-gray-900 border border-gray-600 p-1 text-xs" value={levelInput} onChange={e => setLevelInput(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-500">Gold</label>
                        <input className="w-full bg-gray-900 border border-gray-600 p-1 text-xs" value={goldInput} onChange={e => setGoldInput(e.target.value)} />
                    </div>
                </div>
                <RetroButton onClick={handleUpdateStats} className="w-full py-2 text-[10px]" variant="danger">
                    <RefreshCw size={12} className="mr-2 inline" /> Update & Heal
                </RetroButton>
            </div>

            <div className="space-y-4">
                 <h3 className="text-xs uppercase font-bold text-gray-400 border-b border-gray-800">Inventory Dump</h3>
                 <div className="h-40 overflow-y-auto bg-gray-950 p-2 border border-gray-800 space-y-1">
                    {(player.inventory || []).map((invItem, idx) => {
                        const item = ITEMS.find(i => i.id === invItem.itemId);
                        const modCount = invItem.mods ? invItem.mods.length : 0;
                        return (
                            <div key={idx} className="flex justify-between items-center bg-gray-900 p-1 px-2 border border-gray-800">
                                <span className="text-[10px] text-gray-300">
                                    {item?.name || invItem.itemId} <span className="text-yellow-500">({modCount} Mods)</span>
                                </span>
                                <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-white"><Trash2 size={10} /></button>
                            </div>
                        );
                    })}
                 </div>
            </div>

            <div className="md:col-span-2 space-y-2">
                <h3 className="text-xs uppercase font-bold text-gray-400 border-b border-gray-800">Item Spawner</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {ITEMS.map(item => (
                        <button key={item.id} onClick={() => handleAddItem(item)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 border border-gray-600 text-left">
                            <span className="text-lg">{item.icon}</span>
                            <span className="text-[9px] font-bold text-gray-300 truncate">{item.name}</span>
                            <Plus size={10} className="ml-auto text-green-500" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </RetroCard>
    </div>
  );
};
