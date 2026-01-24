import { Area, Enemy, Item, Player, Skill } from './types';

// Initial Player State
export const INITIAL_PLAYER: Player = {
  name: "Hero",
  level: 1,
  currentHp: 100,
  maxHp: 100,
  currentMana: 50,
  maxMana: 50,
  armor: 5,
  baseDamage: 10,
  exp: 0,
  gold: 0,
};

// Skills
export const SKILLS: Skill[] = [
  { id: 'attack', name: 'Attack', cost: 0, tickCost: 3, damageMultiplier: 1.0, description: 'A basic strike.' },
  // Empty slots for future expansion as per requirements
];

// Items (Sample)
export const ITEMS: Item[] = [
  { id: 'potion_small', name: 'Small Potion', description: 'Heals 20 HP', type: 'consumable', icon: '♥' },
  { id: 'rusty_sword', name: 'Rusty Sword', description: 'Better than nothing.', type: 'weapon', icon: '⚔' },
  { id: 'cloth_tunic', name: 'Cloth Tunic', description: 'Provides minimal warmth.', type: 'armor', icon: '👕' },
];

// Enemies
export const ENEMIES: Record<string, Enemy> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    level: 2,
    maxHp: 40,
    maxMana: 0,
    baseDamage: 5,
    spriteUrl: 'slime.jpeg',
    expReward: 15,
    goldReward: 5,
  },
  wolf: {
    id: 'wolf',
    name: 'Wolf',
    level: 5,
    maxHp: 80,
    maxMana: 20,
    baseDamage: 12,
    spriteUrl: 'https://picsum.photos/128/128?random=2',
    expReward: 35,
    goldReward: 12,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin',
    level: 8,
    maxHp: 120,
    maxMana: 30,
    baseDamage: 15,
    spriteUrl: 'https://picsum.photos/128/128?random=3',
    expReward: 50,
    goldReward: 25,
  }
};

// Areas
export const AREAS: Area[] = [
  {
    id: 'sunny_plains',
    name: 'Sunny Plains',
    description: 'A bright meadow perfect for beginners.',
    levelRange: '1-10',
    enemies: [ENEMIES.slime, ENEMIES.wolf, ENEMIES.goblin]
  }
];