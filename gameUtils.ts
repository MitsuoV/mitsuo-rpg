
import { Player, Enemy, Item, InventoryItem, ItemMod, ModType } from './types';
import { HERO_CLASSES, ITEMS } from './constants';

export const getExpRequired = (level: number) => 100 + Math.pow(level - 1, 2) * 25;

export const getPlayerMaxHp = (level: number, base: number) => base + (level - 1) * 15;
export const getPlayerMaxMana = (level: number, base: number) => base + (level - 1) * 8;

export const calculatePlayerStats = (player: Player) => {
  const heroClass = HERO_CLASSES.find(h => h.name === player.heroClass) || HERO_CLASSES[0];
  
  // Base Stats from Class and Level
  let armor = heroClass.stats.armor; 
  let damage = heroClass.stats.damage + (player.level - 1) * 2;
  let maxMana = getPlayerMaxMana(player.level, heroClass.stats.mana);
  let skillPower = 0;

  // Add Equipment Stats and Mods
  if (player.equipment) {
    Object.values(player.equipment).forEach(instanceId => {
      if (instanceId) {
        // Find the actual item in inventory by its unique instanceId
        const inventoryItem = (player.inventory || []).find(i => i.instanceId === instanceId);
        
        if (inventoryItem) {
          const baseItem = ITEMS.find(i => i.id === inventoryItem.itemId);
          if (baseItem && baseItem.stats) {
            if (baseItem.stats.armor) armor += baseItem.stats.armor;
            if (baseItem.stats.damage) damage += baseItem.stats.damage;
            if (baseItem.stats.maxMana) maxMana += baseItem.stats.maxMana;
          }

          // Apply Mods
          if (inventoryItem.mods) {
            inventoryItem.mods.forEach(mod => {
              if (mod.type === 'damage') damage += mod.value;
              if (mod.type === 'armor') armor += mod.value;
              if (mod.type === 'skillPower') skillPower += mod.value;
            });
          }
        }
      }
    });
  }

  return { armor, damage, maxMana, skillPower };
};

export const scaleEnemy = (template: Enemy): Enemy => {
  const lvl = template.level;
  return {
    ...template,
    maxHp: (template.maxHp || 60) + (lvl * 15),
    baseDamage: (template.baseDamage || 10) + (lvl * 2),
    physicalResistance: (template.physicalResistance || 0) + Math.floor(lvl * 0.5),
    magicalResistance: (template.magicalResistance || 0) + Math.floor(lvl * 0.5),
    expReward: template.expReward || (lvl * 15),
    goldReward: template.goldReward || (lvl * 5),
    maxMana: template.maxMana || 0
  };
};

const generateMods = (itemType: 'weapon' | 'armor', tier: number): ItemMod[] => {
  const mods: ItemMod[] = [];
  // 1 to 3 mods guaranteed
  const modCount = Math.floor(Math.random() * 3) + 1; 
  
  for (let i = 0; i < modCount; i++) {
    // Determine mod type based on equipment type
    let availableTypes: ModType[] = [];
    if (itemType === 'weapon') availableTypes = ['damage', 'skillPower'];
    else availableTypes = ['armor'];

    const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    let value = 0;
    let name = '';

    // T1 Logic (Level 1-10)
    if (tier === 1) {
      if (type === 'damage') {
        value = Math.floor(Math.random() * 3) + 1; // +1 to +3
        name = 'Sharp';
      } else if (type === 'skillPower') {
        value = Number((Math.random() * 0.05 + 0.02).toFixed(2)); // +2% to +7%
        name = 'Arcane';
      } else if (type === 'armor') {
        value = Math.floor(Math.random() * 3) + 1; // +1 to +3
        name = 'Sturdy';
      }
    }

    mods.push({
      id: Math.random().toString(36).substr(2, 9),
      name,
      type,
      value,
      tier
    });
  }

  return mods;
};

// Create a unique instance of an item
export const createItemInstance = (itemId: string): InventoryItem | null => {
  const baseItem = ITEMS.find(i => i.id === itemId);
  if (!baseItem) return null;

  const itemType = baseItem.type === 'weapon' ? 'weapon' : 'armor';
  const mods = (baseItem.type === 'weapon' || baseItem.type === 'armor') 
    ? generateMods(itemType, 1) // Force Tier 1 for now
    : [];

  return {
    instanceId: Math.random().toString(36).substr(2, 9),
    itemId: itemId,
    mods: mods
  };
};

export const generateDrops = (enemyLevel: number): InventoryItem[] => {
  const drops: InventoryItem[] = [];
  
  // 100% Guaranteed Drop
  
  // Filter for Armor and Weapons only (plus consumable logic if needed, but keeping it focused on mods)
  // Logic: "All drops are equal" -> Pick any armor/weapon from the list with equal probability
  const potentialLoot = ITEMS.filter(i => i.type === 'armor' || i.type === 'weapon');
  
  if (potentialLoot.length > 0) {
    const randomItem = potentialLoot[Math.floor(Math.random() * potentialLoot.length)];
    const instance = createItemInstance(randomItem.id);
    if (instance) drops.push(instance);
  }

  return drops;
};

/**
 * Procedural Pixel Sprite Generator
 * Generates a 128x128 data URL representing the item
 */
const spriteCache: Record<string, string> = {};

export const generatePixelSprite = (item: Item & { theme?: string }): string => {
  // Defensive check for missing item definition
  if (!item || !item.id) return '';

  // If the item has a fixed sprite URL, return it immediately
  if (item.spriteUrl) return item.spriteUrl;
  
  if (spriteCache[item.id]) return spriteCache[item.id];

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deterministic seed based on ID
  let seed = 0;
  const idStr = String(item.id);
  for (let i = 0; i < idStr.length; i++) seed += idStr.charCodeAt(i);
  
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const themeColor = item.theme || '#94a3b8';
  
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, 16, 16);

  // Drawing Logic based on Slot
  ctx.fillStyle = themeColor;
  
  if (item.slot === 'head') {
    // Helmet Shape
    ctx.fillRect(4, 3, 8, 8);
    ctx.fillRect(5, 11, 6, 2);
    ctx.clearRect(6, 6, 4, 2); // Eye slit
  } else if (item.slot === 'chest') {
    // Tunic/Plate Shape
    ctx.fillRect(3, 4, 10, 8);
    ctx.fillRect(5, 12, 6, 2);
    ctx.fillRect(2, 5, 2, 4); // Sleeves
    ctx.fillRect(12, 5, 2, 4);
  } else if (item.slot === 'legs') {
    // Leg Shape
    ctx.fillRect(4, 4, 3, 9);
    ctx.fillRect(9, 4, 3, 9);
    ctx.fillRect(5, 3, 6, 2); // Waist
  } else if (item.slot === 'feet') {
    // Boot Shape
    ctx.fillRect(3, 8, 4, 6);
    ctx.fillRect(9, 8, 4, 6);
    ctx.fillRect(2, 12, 3, 2); // Toes
    ctx.fillRect(11, 12, 3, 2);
  } else if (item.type === 'weapon') {
    // Weapon logic
    if (item.classReq === 'Mage') {
        // Staff
        ctx.fillRect(7, 2, 2, 12);
        ctx.fillStyle = '#fde047'; // Glow
        ctx.fillRect(6, 1, 4, 3);
    } else if (item.classReq === 'Archer') {
        // Bow
        ctx.fillRect(4, 4, 2, 8);
        ctx.fillRect(5, 3, 4, 2);
        ctx.fillRect(5, 11, 4, 2);
        ctx.fillStyle = '#64748b'; // String
        ctx.fillRect(9, 4, 1, 8);
    } else {
        // Sword/Dagger
        ctx.fillRect(7, 2, 2, 10); // Blade
        ctx.fillStyle = '#78350f'; // Handle
        ctx.fillRect(6, 11, 4, 2); // Guard
        ctx.fillRect(7, 13, 2, 2); // Grip
    }
  } else {
    // Generic Box for items
    ctx.fillRect(4, 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 6, 4, 4);
  }

  // Add some shading
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(4, 4, 2, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(10, 4, 2, 8);

  // Scale to 128x128
  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = 128;
  finalCanvas.height = 128;
  const finalCtx = finalCanvas.getContext('2d');
  if (finalCtx) {
    finalCtx.imageSmoothingEnabled = false;
    finalCtx.drawImage(canvas, 0, 0, 128, 128);
  }

  const dataUrl = finalCanvas.toDataURL();
  spriteCache[item.id] = dataUrl;
  return dataUrl;
};
