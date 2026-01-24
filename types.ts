// Entity Types
export interface Player {
  name: string;
  level: number;
  currentHp: number;
  maxHp: number;
  currentMana: number;
  maxMana: number;
  armor: number;
  baseDamage: number;
  exp: number;
  gold: number;
}

export interface Enemy {
  id: string;
  name: string;
  level: number;
  maxHp: number;
  maxMana: number;
  baseDamage: number;
  spriteUrl: string; // Placeholder URL
  expReward: number;
  goldReward: number;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'consumable' | 'material';
  icon: string;
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
  cost: number; // Mana cost (unused for now but good for structure)
  tickCost: number; // How long it takes to cast
  damageMultiplier: number;
  description: string;
}

export interface CombatState {
  isActive: boolean;
  enemy: Enemy | null;
  
  // Battle snapshots
  currentEnemyHp: number;
  currentEnemyMana: number;
  currentPlayerHp: number;
  currentPlayerMana: number;
  
  combatLog: string[];
  tickCount: number;
  phase: 'active' | 'victory' | 'defeat';
  
  // Continuous Combat Tracking
  playerNextAttackTick: number;
  enemyNextAttackTick: number;
}