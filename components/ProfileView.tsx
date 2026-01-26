
import React, { useState } from 'react';
import { Player, Item, ItemSlot, InventoryItem } from '../types';
import { ITEMS, HERO_CLASSES } from '../constants';
import { RetroCard, RetroButton, StatBar, ScreenContainer } from './Layout';
import { Shield, Swords, Trophy, Heart, Activity, X, LogOut, Sparkles } from 'lucide-react';
import { getExpRequired, generatePixelSprite } from '../gameUtils';

interface ProfileViewProps {
  player: Player;
  onEquip: (item: InventoryItem, slot: ItemSlot) => void;
  onUnequip: (slot: ItemSlot) => void;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ player, onEquip, onUnequip, onBack }) => {
  const [selectedSlot, setSelectedSlot] = useState<ItemSlot | null>(null);

  const inventory = player?.inventory || [];
  const equipment = player?.equipment || { head: null, chest: null, legs: null, feet: null, mainHand: null, offHand: null };

  // Helper to render an equipment slot
  const EquipmentSlot = ({ label, slot, icon: Icon, className = "" }: { label: string; slot: ItemSlot; icon?: any; className?: string }) => {
    const equippedInstanceId = equipment[slot as keyof typeof equipment];
    // Find item data in inventory
    const inventoryItem = inventory.find(i => i.instanceId === equippedInstanceId);
    const itemDef = inventoryItem ? ITEMS.find(i => i.id === inventoryItem.itemId) : null;

    return (
      <button 
        onClick={() => setSelectedSlot(slot)}
        className={`group relative w-16 h-16 md:w-20 md:h-20 border-4 ${selectedSlot === slot ? 'border-yellow-500 bg-gray-800' : 'border-gray-700 bg-gray-950'} flex flex-col items-center justify-center transition-all hover:border-yellow-500/50 ${className}`}
      >
        {itemDef ? (
           <img src={generatePixelSprite(itemDef)} alt={itemDef.name} className="w-full h-full object-contain pixelated" />
        ) : Icon ? (
           <Icon size={24} className="text-gray-700 group-hover:text-gray-600 mb-1" />
        ) : (
           <div className="text-2xl opacity-20">?</div>
        )}
        
        <span className="text-[6px] md:text-[8px] text-gray-400 uppercase font-black absolute bottom-1 bg-black/50 px-1 rounded-sm">{label}</span>
        
        {/* Mod indicator dot */}
        {inventoryItem && inventoryItem.mods && inventoryItem.mods.length > 0 && (
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-400 rounded-full animate-pulse shadow-sm"></div>
        )}

        <div className="absolute inset-0 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] pointer-events-none"></div>
      </button>
    );
  };

  // Filter compatible items from inventory (exclude already equipped ones)
  const equippedInstanceIds = Object.values(equipment).filter(Boolean);
  
  const compatibleItems = selectedSlot 
    ? inventory
        .filter(invItem => !equippedInstanceIds.includes(invItem.instanceId)) // Only unequipped
        .map(invItem => {
            const def = ITEMS.find(i => i.id === invItem.itemId);
            return def ? { ...invItem, def } : null;
        })
        .filter((item): item is InventoryItem & { def: Item } => !!item && item.def.slot === selectedSlot)
    : [];
  
  const currentEquippedId = selectedSlot ? equipment[selectedSlot as keyof typeof equipment] : null;

  const heroClassData = HERO_CLASSES.find(c => c.name === player.heroClass);

  return (
    <ScreenContainer>
      <div className="flex flex-col gap-6 w-full max-w-4xl relative">
        
        {/* Modal for Item Selection */}
        {selectedSlot && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <RetroCard title={`Select ${selectedSlot}`} className="w-full max-w-md max-h-[80vh] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-xs text-gray-400 uppercase font-bold">Gear</span>
                 <button onClick={() => setSelectedSlot(null)} className="text-red-500 hover:text-white"><X size={20}/></button>
              </div>

              {currentEquippedId && (
                <div className="mb-4">
                  <RetroButton 
                    variant="danger" 
                    className="w-full py-2 text-[10px]"
                    onClick={() => {
                      onUnequip(selectedSlot);
                      setSelectedSlot(null);
                    }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <LogOut size={12} /> Unequip Current
                    </div>
                  </RetroButton>
                </div>
              )}
              
              <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                {compatibleItems.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-gray-600 uppercase tracking-widest">
                    No matching gear found in bag
                  </div>
                ) : (
                  compatibleItems.map((item, idx) => {
                     const isClassValid = !item.def.classReq || item.def.classReq === player.heroClass;
                     const modCount = item.mods ? item.mods.length : 0;
                     
                     return (
                      <button 
                        key={`${item.instanceId}-${idx}`}
                        disabled={!isClassValid}
                        onClick={() => {
                          onEquip(item, selectedSlot);
                          setSelectedSlot(null);
                        }}
                        className={`
                          w-full flex items-center gap-4 p-3 border border-gray-700 transition-all text-left group
                          ${isClassValid ? 'bg-gray-900 hover:border-yellow-500 hover:bg-gray-800' : 'bg-gray-950 opacity-50 cursor-not-allowed'}
                        `}
                      >
                        <div className="w-12 h-12 bg-black flex items-center justify-center border border-gray-600 shrink-0 relative">
                          <img src={generatePixelSprite(item.def)} alt={item.def.name} className="w-full h-full object-contain pixelated" />
                          {modCount > 0 && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full" />}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between">
                              <div className={`text-sm font-bold ${isClassValid ? 'text-gray-200 group-hover:text-yellow-400' : 'text-red-500'}`}>{item.def.name}</div>
                              <div className="flex flex-col items-end">
                                {item.def.levelReq && item.def.levelReq > player.level && (
                                  <span className="text-[8px] text-red-500 font-bold uppercase">Lvl {item.def.levelReq} Req</span>
                                )}
                                {item.def.classReq && (
                                  <span className={`text-[8px] font-bold uppercase ${isClassValid ? 'text-green-500' : 'text-red-500'}`}>{item.def.classReq} Only</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Mods Preview */}
                            {modCount > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.mods.map((m, i) => (
                                        <span key={i} className="text-[8px] px-1 bg-yellow-900/30 text-yellow-500 border border-yellow-800 rounded">{m.name}</span>
                                    ))}
                                </div>
                            )}

                            <div className="flex gap-2 mt-1">
                              {item.def.stats?.damage && <span className="text-[8px] text-red-400 font-bold">+{item.def.stats.damage} DMG</span>}
                              {item.def.stats?.armor && <span className="text-[8px] text-gray-300 font-bold">+{item.def.stats.armor} ARM</span>}
                              {item.def.stats?.maxMana && <span className="text-[8px] text-blue-300 font-bold">+{item.def.stats.maxMana} MANA</span>}
                            </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </RetroCard>
          </div>
        )}

        {/* Header with Class Symbol Display */}
        <div className="flex items-center gap-6 border-b-4 border-gray-700 pb-6">
           <RetroButton onClick={onBack} className="px-4 py-2 text-[10px] shrink-0">« Back</RetroButton>
           
           <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-900 border-2 border-gray-700 rounded p-1 flex items-center justify-center overflow-hidden shrink-0">
              {heroClassData?.icon && heroClassData.icon.startsWith('http') ? (
                <img src={heroClassData.icon} alt="Class Symbol" className="w-full h-full object-contain pixelated" />
              ) : (
                <span className="text-3xl">{heroClassData?.icon || '👤'}</span>
              )}
           </div>

           <div className="flex flex-col">
             <h2 className="text-2xl text-yellow-400 uppercase leading-none tracking-tight font-black">{player.name}</h2>
             <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Lvl {player.level} {player.heroClass}</span>
                <div className="w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
                <span className="text-[10px] text-yellow-600 font-mono font-bold tracking-tighter">{player.gold} GP</span>
             </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Armory Section */}
           <RetroCard title="Armory" className="relative bg-gray-900/40 min-h-[400px]">
              <div className="relative h-full flex flex-col items-center justify-center py-8 z-0">
                 <div className="mb-4">
                    <EquipmentSlot label="Helm" slot="head" icon={Shield} />
                 </div>
                 <div className="flex items-center gap-4 md:gap-8 mb-4">
                    <EquipmentSlot label="Off-Hand" slot="offHand" icon={Shield} className="translate-y-4" />
                    <EquipmentSlot label="Chest" slot="chest" icon={Shield} />
                    <EquipmentSlot label="Main-Hand" slot="mainHand" icon={Swords} className="translate-y-4" />
                 </div>
                 <div className="flex flex-col items-center gap-4">
                    <EquipmentSlot label="Legs" slot="legs" icon={Shield} />
                    <EquipmentSlot label="Boots" slot="feet" icon={Activity} />
                 </div>
                 <div className="mt-8 text-[8px] text-gray-600 uppercase tracking-widest font-bold">
                    Tap a slot to equip items
                 </div>
              </div>
           </RetroCard>

           {/* Stats Section */}
           <div className="space-y-4">
              <RetroCard title="Vitals" className="border-green-900/30">
                 <div className="space-y-4 p-2">
                    <StatBar 
                      current={player.currentHp} 
                      max={player.maxHp} 
                      color="bg-red-600" 
                      label="Health Points" 
                    />
                    <StatBar 
                      current={player.currentMana} 
                      max={player.maxMana} 
                      color="bg-blue-600" 
                      label="Mana Reserves" 
                    />
                 </div>
              </RetroCard>

              <RetroCard title="Combat Attributes" className="border-red-900/30">
                <div className="grid grid-cols-2 gap-4 p-2 font-mono">
                   <div className="bg-gray-950/50 p-3 border border-gray-800 flex flex-col items-center">
                      <span className="text-[8px] text-gray-500 uppercase mb-1">Damage</span>
                      <div className="flex items-center gap-2 text-red-500 font-bold">
                         <Swords size={12} />
                         <span className="text-sm">{player.baseDamage}</span>
                      </div>
                   </div>
                   <div className="bg-gray-950/50 p-3 border border-gray-800 flex flex-col items-center">
                      <span className="text-[8px] text-gray-500 uppercase mb-1">Armor</span>
                      <div className="flex items-center gap-2 text-gray-300 font-bold">
                         <Shield size={12} />
                         <span className="text-sm">{player.armor.toFixed(1)}</span>
                      </div>
                   </div>
                   <div className="bg-gray-950/50 p-3 border border-gray-800 flex flex-col items-center">
                      <span className="text-[8px] text-gray-500 uppercase mb-1">Skill Pwr</span>
                      <div className="flex items-center gap-2 text-blue-400 font-bold">
                         <Sparkles size={12} />
                         <span className="text-sm">+{(player.skillPower * 100).toFixed(0)}%</span>
                      </div>
                   </div>
                   <div className="bg-gray-950/50 p-3 border border-gray-800 flex flex-col items-center">
                      <span className="text-[8px] text-gray-500 uppercase mb-1">Gold</span>
                      <div className="flex items-center gap-2 text-yellow-500 font-bold">
                         <Trophy size={12} />
                         <span className="text-sm">{player.gold}</span>
                      </div>
                   </div>
                </div>
              </RetroCard>

              <RetroCard title="Progression">
                 <div className="p-2 space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-gray-400 mb-1">
                       <span>Experience</span>
                       <span className="font-mono">{player.exp} / {getExpRequired(player.level)}</span>
                    </div>
                    <StatBar 
                      current={player.exp} 
                      max={getExpRequired(player.level)} 
                      color="bg-purple-600" 
                      label="Next Level" 
                    />
                 </div>
              </RetroCard>
           </div>
        </div>
      </div>
    </ScreenContainer>
  );
};
