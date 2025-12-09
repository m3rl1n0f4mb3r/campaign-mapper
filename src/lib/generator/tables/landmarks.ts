// ============================================
// LANDMARK DETAIL TABLES (from PDF p.18-25)
// ============================================

import type { RollableTable } from '../types';

// Helper to create simple 1d10 entries
function createD10Entries(values: string[]): { id: string; min: number; max: number; value: string }[] {
  return values.map((value, index) => ({
    id: `e${index + 1}`,
    min: index + 1,
    max: index + 1,
    value,
  }));
}

// ============================================
// NATURAL LANDMARKS (p.18)
// ============================================

export const LANDMARK_FAUNA: RollableTable = {
  id: 'landmark-fauna',
  name: 'Natural Landmark - Fauna',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Animal boneyard',
    'Anthill',
    'Beaver dam',
    'Giant animal skeleton',
    'Giant bird nest',
    'Giant snail shell',
    'Huge galleries',
    'Location covered with crows',
    "Predator's hunting ground",
    'Ransacked area',
  ]),
};

export const LANDMARK_FLORA_A: RollableTable = {
  id: 'landmark-flora-a',
  name: 'Natural Landmark - Flora (A)',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Berry bush',
    'Bramble overgrown area',
    'Burnt area',
    'Centennial tree',
    'Dead tree',
    'Exotic tree',
    'Fallen tree',
    'Flower circle',
    'Fruit tree',
    'Giant flower',
  ]),
};

export const LANDMARK_FLORA_B: RollableTable = {
  id: 'landmark-flora-b',
  name: 'Natural Landmark - Flora (B)',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Giant mushroom',
    'Hollow tree',
    'Impenetrable thicket',
    'Mushroom circle',
    'Mushroom spot',
    'Mycelial proliferation',
    'Rare plant spot',
    'Root arch',
    'Tree alignment',
    'Water-filled plant',
  ]),
};

export const LANDMARK_GEOLOGY_A: RollableTable = {
  id: 'landmark-geology-a',
  name: 'Natural Landmark - Geology (A)',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Animal shaped rock',
    'Cave',
    'Chasm',
    'Crater',
    'Crystalline proliferation',
    'Giant crystal',
    'Lava pool',
    'Mudpit',
    'Pit',
    'Precious metal vein',
  ]),
};

export const LANDMARK_GEOLOGY_B: RollableTable = {
  id: 'landmark-geology-b',
  name: 'Natural Landmark - Geology (B)',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Ravine',
    'Rift',
    'Rock hole',
    'Rock needle',
    'Scree',
    'Sinkhole',
    'Stone arch',
    'Stone bridge',
    'Stone stairs',
    'Very big rock',
  ]),
};

export const LANDMARK_HYDROLOGY: RollableTable = {
  id: 'landmark-hydrology',
  name: 'Natural Landmark - Hydrology',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Ford',
    'Hotspring',
    'Lake',
    'Pond',
    'Rapids',
    'River',
    'Spring',
    'Stream',
    'Water-filled cave',
    'Waterfall',
  ]),
};

// ============================================
// ARTIFICIAL LANDMARKS (p.19)
// ============================================

export const LANDMARK_LABOR: RollableTable = {
  id: 'landmark-labor',
  name: 'Artificial Landmark - Labor',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Barn',
    'Felled trees',
    'Field',
    'Granary',
    'Labor camp',
    'Meadow',
    'Quarry',
    'Straw man',
    'Swidden field',
    'Water tower',
  ]),
};

export const LANDMARK_MYSTERY: RollableTable = {
  id: 'landmark-mystery',
  name: 'Artificial Landmark - Mystery',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Carved rock',
    'Dolmen',
    'Hanging bones',
    'Heads on spikes',
    'Masks',
    'Pile of bones',
    'Rock stack',
    'Standing stones',
    'Straw dolls',
    'Totem',
  ]),
};

export const LANDMARK_RUIN: RollableTable = {
  id: 'landmark-ruin',
  name: 'Artificial Landmark - Ruin',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Abandoned tavern',
    'Burnt barn',
    'Collapsed mine entrance',
    'Decrepit mansion',
    'Desecrated church',
    'Destroyed house',
    'Overgrown tower',
    'Pile of rubble',
    'Razed village',
    'Ruined castle',
  ]),
};

export const LANDMARK_SMALL_STRUCTURE: RollableTable = {
  id: 'landmark-small-structure',
  name: 'Artificial Landmark - Small Structure',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Bench',
    'Bivouac area',
    'Gazebo',
    "Hunter's cabin",
    'Hunting tower',
    'Kennel',
    'Outhouse',
    'Palisade',
    'Well',
    'Wooden fence',
  ]),
};

export const LANDMARK_TRAVEL: RollableTable = {
  id: 'landmark-travel',
  name: 'Artificial Landmark - Travel',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Boardwalks',
    'Boundary stone',
    'Bridge',
    'Broken bridge',
    'Danger sign',
    'Ledge',
    'Signboard',
    'Stairs',
    'Suspension bridge',
    'Zipline',
  ]),
};

export const LANDMARK_WORSHIP: RollableTable = {
  id: 'landmark-worship',
  name: 'Artificial Landmark - Worship',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Bell/Gong',
    'Calvary',
    'Cemetery',
    'Cross',
    'Holy place',
    'Idol',
    'Shrine',
    'Tomb',
    'Tumulus',
    'Vault',
  ]),
};

// ============================================
// MAGIC LANDMARKS (p.20-21)
// ============================================

export const LANDMARK_AREA_UNDER_SPELL: RollableTable = {
  id: 'landmark-area-under-spell',
  name: 'Magic Landmark - Area Under Spell',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Always snowy area',
    'Anti-magic zone',
    'Area bringing back the dead',
    'Area where nothing grows',
    'Bad luck area',
    'Dome of darkness',
    'Force field',
    'Incessant cyclone',
    'Protection from Evil',
    'Time is frozen',
  ]),
};

export const LANDMARK_ENCHANTED_ITEM: RollableTable = {
  id: 'landmark-enchanted-item',
  name: 'Magic Landmark - Enchanted Item',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Curative basin',
    'Enchanted bell',
    'Fertility stone',
    'Magic fountain/spring',
    'Magic fruits tree',
    'Mutation pit',
    'Stone of knowledge',
    'Sword stuck in a rock',
    'Visions pool',
    'Witch cauldron',
  ]),
};

export const LANDMARK_MAGIC_PATH: RollableTable = {
  id: 'landmark-magic-path',
  name: 'Magic Landmark - Magic Path',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Breathable water',
    'Glowing mushrooms trail',
    'Illusory path',
    'Invisible bridge',
    'Levitating staircase',
    'Magic mirror',
    'Rainbow bridge',
    'Riddle bridge',
    'Walkable water',
    'Wormhole',
  ]),
};

export const LANDMARK_MAGIC_REMAINS: RollableTable = {
  id: 'landmark-magic-remains',
  name: 'Magic Landmark - Magic Remains',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Area covered with fairy dust',
    'Bloody altar',
    'Corpse covered in crystals',
    'Corrupt area',
    'Destroyed golem',
    'Magic battlefield',
    'Old shrine',
    'Petrified travelers',
    'Remnants of a ceremony',
    'Signs of an explosion',
  ]),
};

export const LANDMARK_PLACE_OF_POWER: RollableTable = {
  id: 'landmark-place-of-power',
  name: 'Magic Landmark - Place of Power',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Ancient burial grounds',
    'Birthplace/Tomb of a saint',
    'Magic beacon',
    'Mana well',
    'Neolithic rock monument',
    'Preserved natural place',
    'Root of the World Tree',
    'Sacred waters',
    'Sun focal point',
    'Ziggurat of old',
  ]),
};

export const LANDMARK_STRANGE_PHENOMENON: RollableTable = {
  id: 'landmark-strange-phenomenon',
  name: 'Magic Landmark - Strange Phenomenon',
  category: 'landmarks',
  diceFormula: '1d10',
  entries: createD10Entries([
    'Everburning tree',
    'Evermelting ice',
    'Floating crystal',
    'Ghost building',
    'Luminous engravings',
    'Reverse waterfall',
    'Singing crystal',
    'Strong magnetism',
    'Talking rock',
    'Whispers in the wind',
  ]),
};

// ============================================
// CONTENT TABLES (p.22-23)
// ============================================

export const HAZARD_TABLE: RollableTable = {
  id: 'hazard',
  name: 'Hazard',
  category: 'content',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Acid pits' },
    { id: 'e2', min: 2, max: 2, value: 'Allergenic plants' },
    { id: 'e3', min: 3, max: 3, value: 'Ancient dormant illness' },
    { id: 'e4', min: 4, max: 4, value: 'Curse' },
    { id: 'e5', min: 5, max: 5, value: 'Dangerous footing' },
    { id: 'e6', min: 6, max: 6, value: 'Easy to get lost' },
    { id: 'e7', min: 7, max: 7, value: 'Fog' },
    { id: 'e8', min: 8, max: 8, value: 'Fumes (smoke, toxic, etc.)' },
    { id: 'e9', min: 9, max: 9, value: 'Ghosts' },
    { id: 'e10', min: 10, max: 10, value: 'Hallucinogenic spores' },
    { id: 'e11', min: 11, max: 11, value: 'Hidden pits' },
    { id: 'e12', min: 12, max: 12, value: 'Hunting traps' },
    { id: 'e13', min: 13, max: 13, value: 'Magic corruption' },
    { id: 'e14', min: 14, max: 14, value: 'Plague' },
    { id: 'e15', min: 15, max: 15, value: 'Quicksands' },
    { id: 'e16', min: 16, max: 16, value: 'Radiations' },
    { id: 'e17', min: 17, max: 17, value: 'Sabotage/Trap' },
    { id: 'e18', min: 18, max: 18, value: 'Unstable/Likely to break' },
    { id: 'e19', min: 19, max: 19, value: 'Venomous animals' },
    { id: 'e20', min: 20, max: 20, value: 'Volcanic area' },
  ],
};

export const EMPTY_INFO_TABLE: RollableTable = {
  id: 'empty-info',
  name: 'Empty Hex Information',
  category: 'content',
  diceFormula: '1d20',
  entries: [
    { id: 'e1', min: 1, max: 5, value: 'Info about nearby monsters' },
    { id: 'e2', min: 6, max: 6, value: 'Alchemy recipe' },
    { id: 'e3', min: 7, max: 7, value: 'Curative effects (water, plant)' },
    { id: 'e4', min: 8, max: 8, value: 'Directions to a settlement' },
    { id: 'e5', min: 9, max: 9, value: 'Dungeon location' },
    { id: 'e6', min: 10, max: 10, value: 'Future event' },
    { id: 'e7', min: 11, max: 11, value: 'Important past event' },
    { id: 'e8', min: 12, max: 12, value: 'Legend/Myth' },
    { id: 'e9', min: 13, max: 13, value: 'Local custom' },
    { id: 'e10', min: 14, max: 14, value: 'Password' },
    { id: 'e11', min: 15, max: 15, value: 'Secret passage location' },
    { id: 'e12', min: 16, max: 16, value: 'Spell/Ritual' },
    { id: 'e13', min: 17, max: 17, value: 'Tale about a magic weapon' },
    { id: 'e14', min: 18, max: 18, value: 'Toxicity of something' },
    { id: 'e15', min: 19, max: 19, value: 'Upcoming weather' },
    { id: 'e16', min: 20, max: 20, value: 'Words from a monster language' },
  ],
};

export const SPECIAL_TABLE: RollableTable = {
  id: 'special',
  name: 'Special Content',
  category: 'content',
  diceFormula: '1d10',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Arbitrate a dispute' },
    { id: 'e2', min: 2, max: 2, value: 'Prevent a threat' },
    { id: 'e3', min: 3, max: 3, value: 'Solve a puzzle/riddle' },
    { id: 'e4', min: 4, max: 6, value: 'Uncover a mystery' },
    { id: 'e5', min: 7, max: 10, value: 'NPC(s)/Monster(s) in need' },
  ],
};

// ============================================
// SPECIAL CONTENT SUB-TABLES (p.22-23)
// ============================================

export const DISPUTES_TABLE: RollableTable = {
  id: 'disputes',
  name: 'Disputes to Arbitrate',
  category: 'content',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Adultery' },
    { id: 'e2', min: 2, max: 2, value: 'Broken trade agreement' },
    { id: 'e3', min: 3, max: 3, value: 'Division of an inheritance' },
    { id: 'e4', min: 4, max: 4, value: 'Murder investigation' },
    { id: 'e5', min: 5, max: 5, value: 'Territorial boundaries' },
    { id: 'e6', min: 6, max: 6, value: 'Trial' },
  ],
};

export const THREATS_TABLE: RollableTable = {
  id: 'threats',
  name: 'Threats to Prevent',
  category: 'content',
  diceFormula: '1d6',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Evil ceremony' },
    { id: 'e2', min: 2, max: 2, value: 'Flood' },
    { id: 'e3', min: 3, max: 3, value: 'Frenzied migratory animals' },
    { id: 'e4', min: 4, max: 4, value: 'Magic corruption' },
    { id: 'e5', min: 5, max: 5, value: 'Plague' },
    { id: 'e6', min: 6, max: 6, value: 'Wildfire' },
  ],
};

export const MYSTERIES_TABLE: RollableTable = {
  id: 'mysteries',
  name: 'Mysteries to Uncover',
  category: 'content',
  diceFormula: '1d10',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Abductions' },
    { id: 'e2', min: 2, max: 2, value: 'Alleged ghost' },
    { id: 'e3', min: 3, max: 3, value: 'Curse' },
    { id: 'e4', min: 4, max: 4, value: 'Miracle' },
    { id: 'e5', min: 5, max: 5, value: 'Missing items' },
    { id: 'e6', min: 6, max: 6, value: 'Mutations' },
    { id: 'e7', min: 7, max: 7, value: 'Odd footprints/tracks' },
    { id: 'e8', min: 8, max: 8, value: 'Stalker' },
    { id: 'e9', min: 9, max: 9, value: 'Strange lights/noises' },
    { id: 'e10', min: 10, max: 10, value: 'Unexplained deaths' },
  ],
};

export const NPC_PROBLEMS_TABLE: RollableTable = {
  id: 'npc-problems',
  name: 'Potential Problems for NPCs',
  category: 'content',
  diceFormula: '1d10',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'Amnesia' },
    { id: 'e2', min: 2, max: 2, value: 'Attacked/Chased' },
    { id: 'e3', min: 3, max: 3, value: 'Disappearance' },
    { id: 'e4', min: 4, max: 4, value: 'Hunger/Thirst' },
    { id: 'e5', min: 5, max: 5, value: 'Imprisoned/Enslaved' },
    { id: 'e6', min: 6, max: 6, value: 'Injured/Sick' },
    { id: 'e7', min: 7, max: 7, value: 'Lost' },
    { id: 'e8', min: 8, max: 8, value: 'Stuck/Bogged down' },
    { id: 'e9', min: 9, max: 9, value: 'Theft' },
    { id: 'e10', min: 10, max: 10, value: 'Trapped' },
  ],
};

// Map subcategory to table
export const LANDMARK_DETAIL_TABLES: Record<string, RollableTable> = {
  fauna: LANDMARK_FAUNA,
  flora_a: LANDMARK_FLORA_A,
  flora_b: LANDMARK_FLORA_B,
  geology_a: LANDMARK_GEOLOGY_A,
  geology_b: LANDMARK_GEOLOGY_B,
  hydrology: LANDMARK_HYDROLOGY,
  labor: LANDMARK_LABOR,
  mystery: LANDMARK_MYSTERY,
  ruin: LANDMARK_RUIN,
  small_structure: LANDMARK_SMALL_STRUCTURE,
  travel: LANDMARK_TRAVEL,
  worship: LANDMARK_WORSHIP,
  area_under_spell: LANDMARK_AREA_UNDER_SPELL,
  enchanted_item: LANDMARK_ENCHANTED_ITEM,
  magic_path: LANDMARK_MAGIC_PATH,
  magic_remains: LANDMARK_MAGIC_REMAINS,
  place_of_power: LANDMARK_PLACE_OF_POWER,
  strange_phenomenon: LANDMARK_STRANGE_PHENOMENON,
};

export default {
  LANDMARK_DETAIL_TABLES,
  HAZARD_TABLE,
  EMPTY_INFO_TABLE,
  SPECIAL_TABLE,
  DISPUTES_TABLE,
  THREATS_TABLE,
  MYSTERIES_TABLE,
  NPC_PROBLEMS_TABLE,
};
