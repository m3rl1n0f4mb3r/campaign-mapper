// ============================================
// SETTLEMENT DETAIL TABLES (from PDF p.32-57)
// ============================================

import type { RollableTable } from '../types';

// Helper for simple numbered entries
function createEntries(values: string[], startAt: number = 1): { id: string; min: number; max: number; value: string }[] {
  return values.map((value, index) => ({
    id: `e${index + 1}`,
    min: startAt + index,
    max: startAt + index,
    value,
  }));
}

// ============================================
// HAMLET TABLES (p.32-33)
// ============================================

export const HAMLET_BUILDING: RollableTable = {
  id: 'hamlet-building',
  name: 'Hamlet Main Building',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Brewery/Vineyard', 'Chapel', 'Farm/Ranch', 'Manor', 'Mill', 'Mine',
    'Sawmill', 'Shop', 'Tavern', 'Toll', 'Tourney grounds', 'Watchtower',
  ]),
};

export const HAMLET_LAYOUT: RollableTable = {
  id: 'hamlet-layout',
  name: 'Hamlet Layout',
  category: 'settlements',
  diceFormula: '1d3',
  entries: createEntries(['Linear along road', 'Clustered', 'Scattered']),
};

export const HAMLET_SECRET: RollableTable = {
  id: 'hamlet-secret',
  name: 'Hamlet Secret',
  category: 'settlements',
  diceFormula: '1d6',
  entries: createEntries([
    'Cannibals', 'Cultists', 'Dopplegangers', 'Inbred', 'Lycanthropes/Vampires', 'Murderers',
  ]),
};

// ============================================
// VILLAGE TABLES (p.34-37)
// ============================================

export const VILLAGE_SIZE: RollableTable = {
  id: 'village-size',
  name: 'Village Size',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 2, value: 'small' },
    { id: 'e2', min: 3, max: 5, value: 'medium' },
    { id: 'e3', min: 6, max: 6, value: 'big' },
  ],
};

export const VILLAGE_OCCUPATION: RollableTable = {
  id: 'village-occupation',
  name: 'Village Additional Occupation',
  category: 'settlements',
  diceFormula: '1d6',
  entries: createEntries([
    'Brewing/Viticulture', 'Fishing', 'Hunting', 'Logging', 'Mining', 'Pottery',
  ]),
};

export const VILLAGE_LAYOUT: RollableTable = {
  id: 'village-layout',
  name: 'Village Layout',
  category: 'settlements',
  diceFormula: '1d3',
  entries: createEntries(['Grid', 'Organic/Scattered', 'Linear']),
};

export const VILLAGE_SPECIAL_LOCATION: RollableTable = {
  id: 'village-special-location',
  name: 'Village Special Location',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Abandoned building', 'Apothecary', 'Bakery', 'Burnt/Ruined building', 'Butcher',
    'Castle-farm', 'Church', "Famous person's house", 'General store', 'Graveyard',
    'Guard post', 'Guildhouse', 'Gypsy wagon', 'Horse stables', 'Library',
    'Mill', 'Monument/Memorial', 'Orchard', 'School', 'Tailor',
  ]),
};

export const VILLAGE_DEFENSE: RollableTable = {
  id: 'village-defense',
  name: 'Village Defense',
  category: 'settlements',
  diceFormula: '1d8',
  entries: [
    { id: 'e1', min: 1, max: 3, value: 'Wooden palisade' },
    { id: 'e2', min: 4, max: 5, value: 'Motte (mound)' },
    { id: 'e3', min: 6, max: 6, value: 'Chevaux de frise' },
    { id: 'e4', min: 7, max: 7, value: 'Moat (trench)' },
    { id: 'e5', min: 8, max: 8, value: 'Watchtowers' },
  ],
};

export const VILLAGE_NOTABLE_NPC: RollableTable = {
  id: 'village-notable-npc',
  name: 'Village Notable NPC',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Aggressive guard', 'Annoying minstrel', 'Bandit in disguise', 'Beggar who knows a lot',
    'Curious waitress', 'Cute dog', 'Frightened peasant', 'Lonely widow',
    'Misunderstood witch', 'Old fool/hag', 'One-handed lumberjack', 'Retired mercenary',
    'Seasoned adventurer', 'Sick child', 'Stubborn magician', 'Talented craftsman',
    'Traveling merchant', 'Troubled hunter', 'Vampire/Werewolf hunter', 'Village idiot',
  ]),
};

export const VILLAGE_RULER: RollableTable = {
  id: 'village-ruler',
  name: 'Village Ruler',
  category: 'settlements',
  diceFormula: '1d8',
  entries: createEntries([
    'Bandits', 'Council', 'Mayor', 'Merchant', 'Priest', 'Vampire/Lycanthrope',
    'Village elder', 'Witch',
  ]),
};

export const VILLAGE_SECRET: RollableTable = {
  id: 'village-secret',
  name: 'Village Secret',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Animals turned human', 'Curse', 'Elder god cult', 'Eternal youth', 'Hidden treasure',
    'Hiding outlaws', 'Hivemind', 'Inability to leave', 'Pact with a demon',
    'Sadistic rituals', 'Secret society', 'Underground galleries',
  ]),
};

export const VILLAGE_EVENT: RollableTable = {
  id: 'village-event',
  name: 'Village Event',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Adventurers passing by', 'Announcement by a crier', 'Ceremony (wedding, etc.)',
    'Controlled by monsters', 'Disappearances', 'Famine', 'Festival/Fair', 'Fire',
    'Looting', 'Market day', 'Plague', 'Visit of a notable (lord, etc.)',
  ]),
};

// ============================================
// CITY TABLES (p.38-43)
// ============================================

export const CITY_SIZE: RollableTable = {
  id: 'city-size',
  name: 'City Size',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 2, value: 'small' },
    { id: 'e2', min: 3, max: 5, value: 'medium' },
    { id: 'e3', min: 6, max: 6, value: 'big' },
  ],
};

export const CITY_OCCUPATION: RollableTable = {
  id: 'city-occupation',
  name: 'City Main Occupation',
  category: 'settlements',
  diceFormula: '1d10',
  entries: createEntries([
    'Brewing/Viticulture', 'Cattle breeding', 'Farming', 'Fishing', 'Hunting',
    'Logging', 'Metallurgy', 'Mining', 'Pottery', 'Trading',
  ]),
};

export const CITY_CHARACTERISTIC: RollableTable = {
  id: 'city-characteristic',
  name: 'City Characteristic',
  category: 'settlements',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'Nothing special' },
    { id: 'e2', min: 6, max: 6, value: 'Corrupt' },
    { id: 'e3', min: 7, max: 7, value: 'Crowded' },
    { id: 'e4', min: 8, max: 8, value: 'Destroyed' },
    { id: 'e5', min: 9, max: 9, value: 'Dry' },
    { id: 'e6', min: 10, max: 10, value: 'Filthy' },
    { id: 'e7', min: 11, max: 11, value: 'Holy city' },
    { id: 'e8', min: 12, max: 12, value: 'Humid' },
    { id: 'e9', min: 13, max: 13, value: 'Narrow' },
    { id: 'e10', min: 14, max: 14, value: 'Noisy' },
    { id: 'e11', min: 15, max: 15, value: 'Open' },
    { id: 'e12', min: 16, max: 16, value: 'Renowned' },
    { id: 'e13', min: 17, max: 17, value: 'Silent' },
    { id: 'e14', min: 18, max: 18, value: 'Tiered' },
    { id: 'e15', min: 19, max: 19, value: 'Unsafe' },
    { id: 'e16', min: 20, max: 20, value: 'Windy' },
  ],
};

export const CITY_APPEARANCE: RollableTable = {
  id: 'city-appearance',
  name: 'City Appearance',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Cluttered', 'Cobblestone', 'Colorful', 'Covered with art', 'Dark', 'Eerie',
    'Flowers', 'Geometric', 'Huge windows', 'Light', 'Lots of canals', 'Lots of stairs',
    'Misaligned buildings', 'Red bricks', 'Stark', 'Tall towers', 'White marble',
    'Wondrous', 'Wooden', 'Specific color scheme',
  ]),
};

export const CITY_SPECIAL_LOCATION: RollableTable = {
  id: 'city-special-location',
  name: 'City Special Location',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Abandoned building', 'Aqueduct', 'Archaeological site', 'Bridge', 'Burnt/Ruined building',
    'Calvary', 'Carriage stop', 'Construction site', 'Famous street', 'Fighting pit',
    'Fountain', 'Gallows', 'Junkyard', 'Market hall', 'Military cemetery',
    'Monument/Memorial', 'Park', 'Pilgrimage', 'Plaza', 'Slave pit',
  ]),
};

export const CITY_NOTABLE_NPC: RollableTable = {
  id: 'city-notable-npc',
  name: 'City Notable NPC',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Aggressive guard', 'Annoying minstrel', 'Bandit in disguise', 'Beggar who knows a lot',
    'Clever orphan', 'Corrupted official', 'Curious waitress', 'Distracted scholar',
    'Haughty nobleman', 'Lonely widow', 'Nervous tax collector', 'Penniless merchant',
    'Princess on the run', 'Retired mercenary', 'Seasoned adventurer', 'Shady diplomat',
    'Stubborn wizard', 'Talented craftsman', 'Traveler from a distant land', 'Vampire/Werewolf hunter',
  ]),
};

export const CITY_RULER: RollableTable = {
  id: 'city-ruler',
  name: 'City Ruler',
  category: 'settlements',
  diceFormula: '1d8',
  entries: [
    { id: 'e1', min: 1, max: 2, value: 'Noble' },
    { id: 'e2', min: 3, max: 3, value: 'Clergy' },
    { id: 'e3', min: 4, max: 4, value: 'Council' },
    { id: 'e4', min: 5, max: 5, value: 'Mayor' },
    { id: 'e5', min: 6, max: 6, value: "Merchants' guild" },
    { id: 'e6', min: 7, max: 7, value: "Thieves' guild" },
    { id: 'e7', min: 8, max: 8, value: 'Vampire' },
  ],
};

export const CITY_EVENT: RollableTable = {
  id: 'city-event',
  name: 'City Event',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Announcement by a crier', 'Assassination', 'Ceremony (wedding, etc.)', 'Disappearances',
    'Festival/Fair', 'Fire', 'Market day', 'Plague', 'Siege/Looting', 'Tournament',
    'Vermin invasion', 'Visit of a religious person',
  ]),
};

// ============================================
// CASTLE TABLES (p.44-48)
// ============================================

export const CASTLE_CONDITION: RollableTable = {
  id: 'castle-condition',
  name: 'Castle Condition',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Perfect' },
    { id: 'e2', min: 2, max: 3, value: 'Worn' },
    { id: 'e3', min: 4, max: 5, value: 'Aged' },
    { id: 'e4', min: 6, max: 6, value: 'Crumbling' },
  ],
};

export const CASTLE_KEEP_SHAPE: RollableTable = {
  id: 'castle-keep-shape',
  name: 'Castle Keep Shape',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 3, value: 'Square/Rectangle' },
    { id: 'e2', min: 4, max: 5, value: 'Round' },
    { id: 'e3', min: 6, max: 6, value: 'Shell (hollow cylinder)' },
  ],
};

export const CASTLE_DEFENSIVE_STRUCTURE: RollableTable = {
  id: 'castle-defensive-structure',
  name: 'Castle Defensive Structure',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 3, value: 'Stone walls and towers' },
    { id: 'e2', min: 4, max: 4, value: 'Moat (trench)' },
    { id: 'e3', min: 5, max: 5, value: 'Motte (mound)' },
    { id: 'e4', min: 6, max: 6, value: 'Wooden palisade' },
  ],
};

export const CASTLE_WALL_SHAPE: RollableTable = {
  id: 'castle-wall-shape',
  name: 'Castle Wall Shape',
  category: 'settlements',
  diceFormula: '1d8',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Square/Rectangle (4 towers)' },
    { id: 'e2', min: 2, max: 2, value: 'Trapezium (4 towers)' },
    { id: 'e3', min: 3, max: 3, value: 'Pentagon (5 towers)' },
    { id: 'e4', min: 4, max: 4, value: 'Hexagon (6 towers)' },
    { id: 'e5', min: 5, max: 5, value: 'Octagon (8 towers)' },
    { id: 'e6', min: 6, max: 6, value: 'Star (10 towers)' },
    { id: 'e7', min: 7, max: 7, value: 'Cross (12 towers)' },
    { id: 'e8', min: 8, max: 8, value: 'Circle (1d3+3 towers)' },
  ],
};

export const CASTLE_EVENT: RollableTable = {
  id: 'castle-event',
  name: 'Castle Event',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Assassination', 'Big monster attack', 'Ceremony (wedding, etc.)', 'Festival/Fair',
    'Fire', 'Plague', 'Resources/Gold dwindling', 'Rival lord scouting', 'Siege/Looting',
    'Small monsters wanting to establish a lair nearby', 'Tournament', 'Visit of a notable person',
  ]),
};

// ============================================
// TOWER TABLES (p.49-52)
// ============================================

export const TOWER_LEVELS: RollableTable = {
  id: 'tower-levels',
  name: 'Tower Aboveground Levels',
  category: 'settlements',
  diceFormula: '1d12',
  entries: [
    { id: 'e1', min: 1, max: 1, value: '1' },
    { id: 'e2', min: 2, max: 3, value: '2' },
    { id: 'e3', min: 4, max: 6, value: '3' },
    { id: 'e4', min: 7, max: 9, value: '4' },
    { id: 'e5', min: 10, max: 11, value: '5' },
    { id: 'e6', min: 12, max: 12, value: '6' },
  ],
};

export const TOWER_MATERIAL: RollableTable = {
  id: 'tower-material',
  name: 'Tower Material',
  category: 'settlements',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'Cobblestone' },
    { id: 'e2', min: 6, max: 10, value: 'Wood' },
    { id: 'e3', min: 11, max: 13, value: 'Bricks' },
    { id: 'e4', min: 14, max: 16, value: 'Sandstone' },
    { id: 'e5', min: 17, max: 18, value: 'Limestone' },
    { id: 'e6', min: 19, max: 19, value: 'Marble' },
    { id: 'e7', min: 20, max: 20, value: 'Metal' },
  ],
};

export const TOWER_SHAPE: RollableTable = {
  id: 'tower-shape',
  name: 'Tower Shape',
  category: 'settlements',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'Square' },
    { id: 'e2', min: 6, max: 10, value: 'Round' },
    { id: 'e3', min: 11, max: 13, value: 'Conical' },
    { id: 'e4', min: 14, max: 16, value: 'Tilted' },
    { id: 'e5', min: 17, max: 17, value: 'Asymmetrical' },
    { id: 'e6', min: 18, max: 18, value: 'S-shaped' },
    { id: 'e7', min: 19, max: 19, value: 'Stacked' },
    { id: 'e8', min: 20, max: 20, value: 'Twisted' },
  ],
};

export const TOWER_TOP_LEVEL: RollableTable = {
  id: 'tower-top-level',
  name: 'Tower Top Level',
  category: 'settlements',
  diceFormula: '1d20',
  entries: createEntries([
    'Aviary', 'Beacon', 'Duel platform', 'Foghorn', 'Golden apple tree',
    'Greenhouse', 'High security prison', 'Landing platform', 'Lightning rod',
    'Lookout post', 'Magic searchlight', 'Monster nest', 'Observatory',
    'Panic room', 'Ruined/Overgrown', 'Siege engine', 'Throne room',
    'Treasure room', 'Weather station', 'Windmill',
  ]),
};

// ============================================
// ABBEY TABLES (p.53-57)
// ============================================

export const ABBEY_SIZE: RollableTable = {
  id: 'abbey-size',
  name: 'Abbey Size',
  category: 'settlements',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'small' },
    { id: 'e2', min: 6, max: 6, value: 'major' },
  ],
};

export const ABBEY_GARDEN: RollableTable = {
  id: 'abbey-garden',
  name: 'Abbey Garden Type',
  category: 'settlements',
  diceFormula: '1d4',
  entries: createEntries([
    'Flower garden', 'Fountain', 'Kitchen garden', 'Physic garden (medicine)',
  ]),
};

export const ABBEY_FARMING: RollableTable = {
  id: 'abbey-farming',
  name: 'Abbey Farming Activity',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Barley (beer)', 'Chickens (meat, eggs)', 'Cotton', 'Cows (meat, milk, cheese)',
    'Goats (meat, milk, cheese)', 'Grapes (wine)', 'Hops (beer)', 'Orchard (fruits, preserves)',
    'Pigs (meat)', 'Sheep (meat, wool)', 'Vegetables', 'Wheat (flour, bread)',
  ]),
};

export const ABBEY_FAME: RollableTable = {
  id: 'abbey-fame',
  name: 'Abbey Fame Reason',
  category: 'settlements',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Age' },
    { id: 'e2', min: 2, max: 2, value: 'Architecture' },
    { id: 'e3', min: 3, max: 3, value: 'Cattle baptism' },
    { id: 'e4', min: 4, max: 4, value: 'Curative (hot) springs' },
    { id: 'e5', min: 5, max: 5, value: 'Domain and landscapes' },
    { id: 'e6', min: 6, max: 6, value: 'Grave of well known bishop' },
    { id: 'e7', min: 7, max: 7, value: 'Key religious celebration' },
    { id: 'e8', min: 8, max: 8, value: 'Meals served to travelers' },
    { id: 'e9', min: 9, max: 9, value: 'Pilgrimage' },
    { id: 'e10', min: 10, max: 10, value: 'Power' },
    { id: 'e11', min: 11, max: 11, value: 'Quality of products' },
    { id: 'e12', min: 12, max: 20, value: 'Religious artifact' },
  ],
};

export const ABBEY_EVENT: RollableTable = {
  id: 'abbey-event',
  name: 'Abbey Event',
  category: 'settlements',
  diceFormula: '1d12',
  entries: createEntries([
    'Broken device', 'Cowls shrunken/dyed in red', 'Demonic corruption',
    'Disappearance of the abbot', 'Drought/Flood', 'Festival/Fair', 'Fire',
    'Looting', 'Moles/Rats infestation', 'Plague', 'Scandal', 'Visit of a notable person',
  ]),
};

// ============================================
// DISPOSITION TABLE (shared across settlement types)
// ============================================

export const DISPOSITION: RollableTable = {
  id: 'disposition',
  name: 'Disposition',
  category: 'settlements',
  diceFormula: '2d6',
  entries: [
    { id: 'e1', min: 2, max: 2, value: 'Attack on sight' },
    { id: 'e2', min: 3, max: 5, value: 'Hostile' },
    { id: 'e3', min: 6, max: 8, value: 'Neutral' },
    { id: 'e4', min: 9, max: 11, value: 'Welcoming' },
    { id: 'e5', min: 12, max: 12, value: 'Enthusiastic' },
  ],
};

// Export grouped by settlement type
export const SETTLEMENT_TABLES = {
  hamlet: {
    building: HAMLET_BUILDING,
    layout: HAMLET_LAYOUT,
    secret: HAMLET_SECRET,
    disposition: DISPOSITION,
  },
  village: {
    size: VILLAGE_SIZE,
    occupation: VILLAGE_OCCUPATION,
    layout: VILLAGE_LAYOUT,
    specialLocation: VILLAGE_SPECIAL_LOCATION,
    defense: VILLAGE_DEFENSE,
    notableNpc: VILLAGE_NOTABLE_NPC,
    ruler: VILLAGE_RULER,
    secret: VILLAGE_SECRET,
    event: VILLAGE_EVENT,
    disposition: DISPOSITION,
  },
  city: {
    size: CITY_SIZE,
    occupation: CITY_OCCUPATION,
    characteristic: CITY_CHARACTERISTIC,
    appearance: CITY_APPEARANCE,
    specialLocation: CITY_SPECIAL_LOCATION,
    notableNpc: CITY_NOTABLE_NPC,
    ruler: CITY_RULER,
    event: CITY_EVENT,
    disposition: DISPOSITION,
  },
  castle: {
    condition: CASTLE_CONDITION,
    keepShape: CASTLE_KEEP_SHAPE,
    defensiveStructure: CASTLE_DEFENSIVE_STRUCTURE,
    wallShape: CASTLE_WALL_SHAPE,
    event: CASTLE_EVENT,
    disposition: DISPOSITION,
  },
  tower: {
    levels: TOWER_LEVELS,
    material: TOWER_MATERIAL,
    shape: TOWER_SHAPE,
    topLevel: TOWER_TOP_LEVEL,
    disposition: DISPOSITION,
  },
  abbey: {
    size: ABBEY_SIZE,
    garden: ABBEY_GARDEN,
    farming: ABBEY_FARMING,
    fame: ABBEY_FAME,
    event: ABBEY_EVENT,
    disposition: DISPOSITION,
  },
};

export default SETTLEMENT_TABLES;
