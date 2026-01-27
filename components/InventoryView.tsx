
import React, { useState } from 'react';
import { Player, InventoryItem, Item, ItemSlot } from '../types';
import { ITEMS } from '../constants';
import { RetroCard, RetroButton, ScreenContainer } from './Layout';
import { generatePixelSprite } from '../gameUtils';
import { X, Shield, Swords, Zap, Info, Package } from 'lucide-react';

interface InventoryViewProps {
  player: Player;
  onEquip: (item: InventoryItem, slot: ItemSlot) => void;
  onBack: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ player, onEquip, onBack }) => {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  // CSS for the scrolling text marquee
  const marqueeStyle = `
    @keyframes marquee {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    .animate-marquee {
      display: inline-block;
      white-space: nowrap;
      animation: marquee 5s linear infinite;
    }
    .marquee-container:hover .animate-marquee {
      animation-play-state: paused;
    }
  `;

  const handleEquip = () => {
    if (!selectedItem) return;
    const def = ITEMS.find(i => i.id === selectedItem.itemId);
    if (def && def.slot) {
      onEquip(selectedItem, def.slot);
      setSelectedItem(null);
    }
  };

  const getRarityColor = (modCount: number) => {
    if (modCount >= 3) return 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]'; // Legendary
    if (modCount >= 2) return 'border-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'; // Rare
    if (modCount >= 1) return 'border-blue-400 shadow-[0_0_5px_rgba(96,165,250,0.5)]';   // Magic
    return 'border-gray-700'; // Common
  };

  const renderItemDetail = () => {
    if (!selectedItem) return null;
    const def = ITEMS.find(i => i.id === selectedItem.itemId);
    if (!def) return null;

    const modCount = selectedItem.mods ? selectedItem.mods.length : 0;
    const isEquipped = Object.values(player.equipment).includes(selectedItem.instanceId);
    const canEquip = (!def.classReq || def.classReq === player.heroClass) && (!def.levelReq || player.level >= def.levelReq);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <RetroCard className="w-full max-w-sm border-yellow-600/50 shadow-2xl relative">
          <button 
            onClick={() => setSelectedItem(null)} 
            className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors z-10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center gap-6 p-2">
            {/* Header / Icon */}
            <div className="relative group">
              <div className={`w-32 h-32 bg-gray-950 border-4 ${getRarityColor(modCount)} flex items-center justify-center relative overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 to-transparent opacity-50"></div>
                <img src={generatePixelSprite(def)} alt={def.name} className="w-full h-full object-contain pixelated relative z-10 drop-shadow-lg" />
              </div>
              {modCount > 0 && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 border border-black uppercase tracking-wider">
                  {modCount} Mods
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center space-y-2 w-full">
              <h2 className={`text-xl font-bold uppercase tracking-tight ${modCount > 0 ? 'text-yellow-400' : 'text-gray-200'}`}>
                {def.name}
              </h2>
              <div className="flex justify-center gap-2 text-[10px] uppercase font-bold text-gray-500">
                <span className="bg-gray-900 px-2 py-1 border border-gray-800 rounded">{def.type}</span>
                {def.slot && <span className="bg-gray-900 px-2 py-1 border border-gray-800 rounded">{def.slot}</span>}
              </div>
            </div>

            {/* Stats Block */}
            <div className="w-full bg-gray-900/50 border border-gray-700 p-4 space-y-3 font-mono text-xs">
              <p className="text-gray-400 italic text-center text-[10px] leading-relaxed border-b border-gray-800 pb-2 mb-2">"{def.description}"</p>
              
              <div className="space-y-1">
                {def.stats?.damage && (
                  <div className="flex justify-between text-red-400 font-bold">
                    <span className="flex items-center gap-2"><Swords size={12}/> Base Damage</span>
                    <span>{def.stats.damage}</span>
                  </div>
                )}
                {def.stats?.armor && (
                  <div className="flex justify-between text-gray-300 font-bold">
                    <span className="flex items-center gap-2"><Shield size={12}/> Armor</span>
                    <span>{def.stats.armor}</span>
                  </div>
                )}
                {def.stats?.maxMana && (
                  <div className="flex justify-between text-blue-400 font-bold">
                    <span className="flex items-center gap-2"><Zap size={12}/> Mana Capacity</span>
                    <span>+{def.stats.maxMana}</span>
                  </div>
                )}
              </div>

              {/* Mods */}
              {selectedItem.mods && selectedItem.mods.length > 0 && (
                <div className="pt-2 border-t border-gray-800 mt-2 space-y-1">
                  {selectedItem.mods.map((mod, idx) => (
                    <div key={idx} className="flex justify-between text-yellow-500 text-[10px]">
                      <span className="uppercase tracking-wide">+ {mod.name}</span>
                      <span>{mod.type === 'skillPower' ? `+${(mod.value * 100).toFixed(0)}%` : `+${mod.value}`} {mod.type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements Warning */}
            {!canEquip && (
              <div className="text-red-500 text-[10px] uppercase font-bold border border-red-900/50 bg-red-900/10 px-4 py-2 w-full text-center">
                 Requires: {def.levelReq ? `Lvl ${def.levelReq} ` : ''} {def.classReq ? def.classReq : ''}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 w-full mt-2">
              <RetroButton onClick={() => setSelectedItem(null)} variant="primary" className="flex-1">
                Close
              </RetroButton>
              {(def.type === 'weapon' || def.type === 'armor') && (
                <RetroButton 
                  onClick={handleEquip} 
                  disabled={isEquipped || !canEquip}
                  variant={isEquipped ? 'primary' : 'success'} 
                  className="flex-1"
                >
                  {isEquipped ? 'Equipped' : 'Equip Item'}
                </RetroButton>
              )}
            </div>
          </div>
        </RetroCard>
      </div>
    );
  };

  return (
    <ScreenContainer>
      <style>{marqueeStyle}</style>
      <div className="flex flex-col h-[80vh] w-full max-w-4xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-gray-900/80 p-4 border-b-4 border-gray-700 backdrop-blur-sm z-10">
           <RetroButton onClick={onBack} className="text-[10px] py-2 px-4">« Return</RetroButton>
           <div className="flex items-center gap-3">
              <Package className="text-yellow-500" />
              <h1 className="text-xl md:text-2xl font-bold uppercase tracking-widest text-gray-200">Inventory</h1>
           </div>
           <div className="text-[10px] text-gray-500 font-bold uppercase hidden md:block">
              {player.inventory.length} Items
           </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
           {player.inventory.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-600 space-y-4">
                <Package size={48} className="opacity-20" />
                <p className="text-xs uppercase tracking-widest font-bold">Bag is empty</p>
             </div>
           ) : (
             <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
                {player.inventory.map((item, idx) => {
                  const def = ITEMS.find(i => i.id === item.itemId);
                  if (!def) return null;
                  
                  const modCount = item.mods ? item.mods.length : 0;
                  const isEquipped = Object.values(player.equipment).includes(item.instanceId);

                  return (
                    <button 
                      key={item.instanceId}
                      onClick={() => setSelectedItem(item)}
                      className={`
                        group relative aspect-square bg-gray-900 flex flex-col items-center justify-center 
                        border-2 ${getRarityColor(modCount)} hover:border-yellow-200 transition-all active:scale-95
                      `}
                    >
                       {/* Equipped Indicator */}
                       {isEquipped && (
                         <div className="absolute top-1 right-1 bg-green-600 w-2 h-2 rounded-full border border-black z-20 shadow-md" title="Equipped" />
                       )}

                       {/* Sprite Highlight */}
                       <div className="w-2/3 h-2/3 flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300">
                          <img src={generatePixelSprite(def)} alt={def.name} className="w-full h-full object-contain pixelated drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" />
                       </div>

                       {/* Scrolling Name Label */}
                       <div className="absolute bottom-0 left-0 w-full h-6 bg-black/90 border-t border-gray-800 flex items-center overflow-hidden">
                          <div className="marquee-container w-full overflow-hidden px-1">
                             <div className={`${def.name.length > 9 ? 'animate-marquee pl-1' : 'text-center'} text-[8px] md:text-[9px] font-bold text-gray-300 uppercase whitespace-nowrap`}>
                                {def.name.length > 9 ? (
                                  <>
                                    <span>{def.name}</span>
                                    <span className="mx-4 text-gray-600">•</span>
                                    <span>{def.name}</span>
                                    <span className="mx-4 text-gray-600">•</span>
                                  </>
                                ) : (
                                  def.name
                                )}
                             </div>
                          </div>
                       </div>
                    </button>
                  );
                })}
             </div>
           )}
        </div>

        {/* Detail Modal Overlay */}
        {selectedItem && renderItemDetail()}
      </div>
    </ScreenContainer>
  );
};
