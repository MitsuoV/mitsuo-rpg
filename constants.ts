
import { Area, Enemy, Item, Player, Skill, HeroClassData } from './types';

export const ASSETS = {
  LOGO: "https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/elyria%20logo.png",
  SLIME_SPRITESHEET: "https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/spritesheet_1769528145290.png",
  STARDUST: "https://www.transparenttextures.com/patterns/stardust.png"
};

export const HERO_CLASSES: HeroClassData[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'High survivability and strong armor.',
    icon: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/warrior.png',
    stats: { hp: 130, mana: 40, damage: 12, armor: 0 }
  },
  {
    id: 'archer',
    name: 'Archer',
    description: 'High damage and balanced mana.',
    icon: '🏹',
    stats: { hp: 105, mana: 55, damage: 14, armor: 0 }
  },
  {
    id: 'assassin',
    name: 'Assassin',
    description: 'High damage but low armor.',
    icon: '🗡️',
    stats: { hp: 95, mana: 60, damage: 16, armor: 0 }
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Highest mana and damage potential.',
    icon: '🔮',
    stats: { hp: 85, mana: 80, damage: 18, armor: 0 }
  }
];

export const INITIAL_PLAYER: Player = {
  id: 'init_1',
  name: "Hero",
  heroClass: "Unknown",
  level: 1,
  currentHp: 100,
  maxHp: 100,
  currentMana: 50,
  maxMana: 50,
  armor: 0,
  baseDamage: 10,
  skillPower: 0,
  exp: 0,
  gold: 0,
  inventory: [],
  equippedSkills: [null, null, null, null, null],
  equipment: {
    head: null,
    chest: null,
    legs: null,
    feet: null,
    mainHand: null,
    offHand: null
  }
};

export const SKILLS: Skill[] = [
  { 
    id: 'wild_swing', 
    name: 'Wild Swing', 
    cost: 10, 
    tickCost: 5, 
    damageMultiplier: 1.2, 
    cooldown: 5, 
    description: 'A heavy strike that trades mana for raw impact.', 
    icon: 'https://raw.githubusercontent.com/MitsuoV/game-assets/0f3c76713fa515f4ead9bcaa6fa5e176af089fbb/wild%20swing.png',
    requiredClass: 'Warrior',
    isMagical: false
  }
];

export const ITEMS: (Item & { theme?: string })[] = [
  { id: 'potion_small', name: 'Small Potion', description: 'Heals 20 HP', type: 'consumable', slot: 'consumable', icon: '♥', theme: '#ef4444' },
  { id: 'rusty_helm', name: 'Rusty Helm', description: 'A dented metal helmet.', type: 'armor', slot: 'head', icon: '🪖', levelReq: 1, stats: { armor: 3 }, theme: '#94a3b8' },
  { id: 'rusty_plate', name: 'Rusty Platebody', description: 'Heavy and covered in rust.', type: 'armor', slot: 'chest', icon: '🥋', levelReq: 1, stats: { armor: 6 }, theme: '#94a3b8' },
  { id: 'rusty_greaves', name: 'Rusty Greaves', description: 'Protects the shins.', type: 'armor', slot: 'legs', icon: '🦵', levelReq: 1, stats: { armor: 3 }, theme: '#94a3b8' },
  { id: 'rusty_boots', name: 'Rusty Boots', description: 'Clanking metal boots.', type: 'armor', slot: 'feet', icon: '👢', levelReq: 1, stats: { armor: 2 }, theme: '#94a3b8' },
  { id: 'wooden_sword', name: 'Wooden Sword', description: 'Good for practice.', type: 'weapon', slot: 'mainHand', icon: '⚔️', levelReq: 1, classReq: 'Warrior', stats: { damage: 3 }, theme: '#b45309', spriteUrl: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/wooden%20sword.png' },
  { id: 'leather_cap', name: 'Leather Cap', description: 'Lightweight headgear.', type: 'armor', slot: 'head', icon: '🧢', levelReq: 1, stats: { armor: 1, maxMana: 5 }, theme: '#78350f' },
  { id: 'leather_tunic', name: 'Leather Tunic', description: 'Standard issue leather armor.', type: 'armor', slot: 'chest', icon: '🧥', levelReq: 1, stats: { armor: 3, maxMana: 10 }, theme: '#78350f' },
  { id: 'leather_chaps', name: 'Leather Chaps', description: 'Flexible legwear.', type: 'armor', slot: 'legs', icon: '👖', levelReq: 1, stats: { armor: 1, maxMana: 5 }, theme: '#78350f' },
  { id: 'leather_boots', name: 'Leather Boots', description: 'Sturdy walking boots.', type: 'armor', slot: 'feet', icon: '👞', levelReq: 1, stats: { armor: 1, maxMana: 5 }, theme: '#78350f' },
  { id: 'short_bow', name: 'Short Bow', description: 'A simple wooden bow.', type: 'weapon', slot: 'mainHand', icon: '🏹', levelReq: 1, classReq: 'Archer', stats: { damage: 3 }, theme: '#4ade80' },
  { id: 'cracked_dagger', name: 'Cracked Dagger', description: 'Sharp enough to cut.', type: 'weapon', slot: 'mainHand', icon: '🗡️', levelReq: 1, classReq: 'Assassin', stats: { damage: 4 }, theme: '#334155', spriteUrl: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/cracked%20dagger.png' },
  { id: 'ragged_hood', name: 'Ragged Hood', description: 'Smells of old books.', type: 'armor', slot: 'head', icon: '🧙', levelReq: 1, stats: { armor: 0, maxMana: 15 }, theme: '#3b82f6' },
  { id: 'ragged_robe', name: 'Ragged Robe', description: 'Offers little protection.', type: 'armor', slot: 'chest', icon: '👘', levelReq: 1, stats: { armor: 1, maxMana: 25 }, theme: '#3b82f6' },
  { id: 'ragged_trousers', name: 'Ragged Trousers', description: 'Tattered pants.', type: 'armor', slot: 'legs', icon: '👖', levelReq: 1, stats: { armor: 0, maxMana: 15 }, theme: '#3b82f6' },
  { id: 'ragged_boots', name: 'Ragged Boots', description: 'Worn out cloth shoes.', type: 'armor', slot: 'feet', icon: '👟', levelReq: 1, stats: { armor: 0, maxMana: 10 }, theme: '#3b82f6' },
  { id: 'old_staff', name: 'Old Staff', description: 'Focuses arcane energy.', type: 'weapon', slot: 'mainHand', icon: '🦯', levelReq: 1, classReq: 'Mage', stats: { damage: 2, maxMana: 20 }, theme: '#a855f7' },
];

export const ENEMIES: Record<string, Enemy> = {
  slime: {
    id: 'slime',
    name: 'Slime',
    level: 1,
    maxHp: 60,
    maxMana: 0,
    baseDamage: 10,
    physicalResistance: 2,
    magicalResistance: 0,
    spriteUrl: 'https://raw.githubusercontent.com/MitsuoV/game-assets/cf423adc274863cc7674b078c9f36007b6b94584/slime.png',
    expReward: 15,
    goldReward: 5,
  },
  wolf: {
    id: 'wolf',
    name: 'Forest Wolf',
    level: 3,
    maxHp: 120,
    maxMana: 0,
    baseDamage: 18,
    physicalResistance: 5,
    magicalResistance: 2,
    spriteUrl: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/wolf.png',
    expReward: 40,
    goldReward: 15,
  },
  goblin: {
    id: 'goblin',
    name: 'Goblin Scout',
    level: 5,
    maxHp: 160,
    maxMana: 20,
    baseDamage: 24,
    physicalResistance: 8,
    magicalResistance: 4,
    spriteUrl: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/goblin%20scout.png',
    expReward: 80,
    goldReward: 30,
  }
};

export const AREAS: Area[] = [
  {
    id: 'sunny_plains',
    name: 'Sunny Plains',
    description: 'A bright meadow perfect for beginners.',
    levelRange: '1-5',
    enemies: [
      { ...ENEMIES.slime, level: 1 },
      { ...ENEMIES.slime, level: 2 },
      { ...ENEMIES.wolf, level: 3 },
      { ...ENEMIES.goblin, level: 5 }
    ],
    backgroundImage: 'https://raw.githubusercontent.com/MitsuoV/game-assets/refs/heads/main/sunny%20plains.jpeg'
  }
];
