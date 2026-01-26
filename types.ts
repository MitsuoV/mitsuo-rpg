
// Entity Types
export interface EquipmentSlots {
  head: string | null; // Stores instanceId
  chest: string | null;
  legs: string | null;
  feet: string | null;
  mainHand: string | null;
  offHand: string | null;
}

export type ModType = 'damage' | 'armor' | 'skillPower';

export interface ItemMod {
  id: string;
  name: string;
  type: ModType;
  value: number;
  tier: number;
}

export interface InventoryItem {
  instanceId: string; // Unique ID for this specific drop
  itemId: string;     // Reference to the base ITEM constant
  mods: ItemMod[];
}

export interface Player {
  id: string;        
  name: string;      
  heroClass: string; 
  level: number;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  armor: number;
  baseDamage: number;
  skillPower: number; // Percent bonus
  exp: number;
  gold: number;
  inventory: InventoryItem[]; 
  equippedSkills: (string | null)[]; 
  equipment: EquipmentSlots;
}

export interface HeroClassData {
  id: string;
  name: string;
  description: string;
  icon: string;
  stats: {
    hp: number;
    mana: number;
    damage: number;
    armor: number;
  };
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  maxMana: number;
  baseDamage: number;
  physicalResistance: number;
  magicalResistance: number;
  spriteUrl: string; 
  expReward: number;
  goldReward: number;
}

export type ItemSlot = 'head' | 'chest' | 'legs' | 'feet' | 'mainHand' | 'offHand' | 'consumable' | 'material';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  slot?: ItemSlot;
  icon: string;
  levelReq?: number;
  classReq?: string; 
  spriteUrl?: string; 
  stats?: {
    damage?: number;
    armor?: number;
    maxMana?: number;
  };
}

export interface Area {
  id: string;
  name: string;
  description: string;
  levelRange: string;
  enemies: Enemy[];
}

// Combat Types
export interface Skill {
  id: string;
  name: string;
  cost: number; 
  tickCost: number; 
  damageMultiplier: number;
  cooldown: number; 
  description: string;
  icon: string; 
  requiredClass?: string;
  isMagical?: boolean;
}

export interface CombatRewards {
  exp: number;
  gold: number;
  items: InventoryItem[];
}

export interface CombatState {
  isActive: boolean;
  enemy: Enemy | null;
  currentEnemyHp: number;
  currentEnemyMana: number;
  currentPlayerHp: number;
  currentPlayerMana: number;
  combatLog: string[];
  tickCount: number;
  phase: 'active' | 'victory' | 'defeat';
  playerNextAttackTick: number;
  enemyNextAttackTick: number;
  skillCooldowns: Record<string, number>; 
  rewards?: CombatRewards; 
}
