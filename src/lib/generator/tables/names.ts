// ============================================
// NAME GENERATION TABLES (from PDF p.28-31)
// ============================================

import type { RollableTable } from '../types';

/**
 * Name structure table (1d30)
 * Determines how name components are combined
 * A=Buildings, B=Nouns, C=Names, D=CityNames, E=Adjectives, F=SettlementTypes, G=Directions, H=Nature
 */
export const NAME_STRUCTURE: RollableTable = {
  id: 'name-structure',
  name: 'Settlement Name Structure',
  description: 'How name components are combined',
  category: 'names',
  diceFormula: '1d30',
  entries: [
    { id: 'e1', min: 1, max: 1, value: 'BA' },      // Robin Bank
    { id: 'e2', min: 2, max: 2, value: 'BF' },      // Orchid Bourg
    { id: 'e3', min: 3, max: 3, value: 'BHF' },     // Knight Pass City
    { id: 'e4', min: 4, max: 4, value: 'BH' },      // Oak Burrow
    { id: 'e5', min: 5, max: 5, value: 'CA' },      // Ilia Road
    { id: 'e6', min: 6, max: 6, value: 'CF' },      // Bernard Ville
    { id: 'e7', min: 7, max: 7, value: 'CH' },      // Fanny Fall
    { id: 'e8', min: 8, max: 8, value: 'D' },       // Ourar
    { id: 'e9', min: 9, max: 9, value: 'DA' },      // Haye Market
    { id: 'e10', min: 10, max: 10, value: 'DF' },   // Bayley Village
    { id: 'e11', min: 11, max: 11, value: 'DH' },   // Rundur Forest
    { id: 'e12', min: 12, max: 12, value: 'D-by-sea' },
    { id: 'e13', min: 13, max: 13, value: 'D-in-D' },
    { id: 'e14', min: 14, max: 14, value: 'D-le-D' },
    { id: 'e15', min: 15, max: 15, value: 'D-les-bains' },
    { id: 'e16', min: 16, max: 16, value: 'D-on-the-hill' },
    { id: 'e17', min: 17, max: 17, value: 'Dington' },
    { id: 'e18', min: 18, max: 18, value: 'Dsby' },
    { id: 'e19', min: 19, max: 19, value: 'Dthorpe' },
    { id: 'e20', min: 20, max: 20, value: 'Dton' },
    { id: 'e21', min: 21, max: 21, value: 'EA' },   // Black Forge
    { id: 'e22', min: 22, max: 22, value: 'EB' },   // Gold Pine
    { id: 'e23', min: 23, max: 23, value: 'ED' },   // Crystal Carm
    { id: 'e24', min: 24, max: 24, value: 'EF' },   // Brave Town
    { id: 'e25', min: 25, max: 25, value: 'EH' },   // Coal Wood
    { id: 'e26', min: 26, max: 26, value: 'GB' },   // Mount Birch
    { id: 'e27', min: 27, max: 27, value: 'GD' },   // Haute Galgar
    { id: 'e28', min: 28, max: 28, value: 'Trou-au-D' },
    { id: 'e29', min: 29, max: 29, value: 'Trou-de-D' },
    { id: 'e30', min: 30, max: 30, value: 'Val-D' },
  ],
};

// A) Buildings, Outdoors (1d30)
export const NAME_BUILDINGS: string[] = [
  'Abbey', 'Arch', 'Bank', 'Barrack', 'Bench', 'Bridge', 'Castle', 'Chapel',
  'Church', 'Court', 'Cross', 'Farm', 'Forge', 'Gate', 'Hall', 'Home',
  'Hospital', 'House', 'Inn', 'Mall', 'Market', 'Mill', 'Mine', 'Post',
  'Road', 'Stall', 'Temple', 'Tower', 'Union', 'Wall',
];

// B) Nouns (1d100)
export const NAME_NOUNS: string[] = [
  'Acorn', 'Angel', 'Apple', 'Atelier', 'Autumn', 'Axe', 'Baker', 'Bard',
  'Baron', 'Barrow', 'Berry', 'Birch', 'Bird', 'Boar', 'Book', 'Bow',
  'Butcher', 'Candle', 'Cheese', 'Cloud', 'Corn', 'Cow', 'Crow', 'Dawn',
  'Day', 'Deer', 'Demon', 'Dragon', 'Dream', 'Dusk', 'Dust', 'Dwarf',
  'Eagle', 'Elf', 'Feather', 'Fire', 'Fish', 'Flower', 'Fog', 'Fox',
  'Frog', 'Ghost', 'Gnoll', 'Goblin', 'Grave', 'Halfling', 'Hare', 'Hawk',
  'Heaven', 'Hell', 'Hook', 'Hope', 'Horn', 'Horse', 'Hunter', 'Knight',
  'Kobold', 'Leaf', 'Letter', 'Lion', 'Mage', 'Moon', 'Night', 'Oak',
  'Orchid', 'Pine', 'Pork', 'Rabbit', 'Rain', 'Ram', 'River', 'Robin',
  'Rose', 'Salt', 'Seed', 'Sky', 'Snake', 'Snow', 'Sorrow', 'Spice',
  'Spring', 'Squirrel', 'Star', 'Summer', 'Sun', 'Sword', 'Thief', 'Thorn',
  'Thunder', 'Toad', 'Tournament', 'Tulip', 'Violet', 'Warrior', 'Water', 'Wind',
  'Winter', 'Witch', 'Wolf', 'Wyvern',
];

// C) First names, Titles (1d20)
export const NAME_FIRSTNAMES: string[] = [
  'Anna', 'Arthur', 'Bernard', 'Charles', 'Elizabeth', 'Fanny', 'George', 'Helen',
  'Ilia', 'John', 'Kathleen', 'King', 'Louis', 'Marcus', 'Mary', 'Nicholas',
  'Prince', 'Princess', 'Queen', 'Tilly',
];

// D) City names (1d24)
export const NAME_CITYNAMES: string[] = [
  'Avery', 'Bayley', 'Carm', 'Dun', 'Ensal', 'Folton', 'Galgar', 'Haye',
  'Idar', 'Julvet', 'Kanth', 'Loy', 'Marsan', 'Nisme', 'Ourar', 'Peulin',
  'Rundur', 'Solin', 'Thaas', 'Unvary', 'Vanau', 'Wark', 'Yverne', 'Zalek',
];

// E) Adjectives, Colors (1d100, pairs)
export const NAME_ADJECTIVES: string[] = [
  'Bad', 'Black', 'Bloody', 'Blue', 'Bony', 'Brave', 'Brown', 'Burnt',
  'Charming', 'Coal', 'Cold', 'Copper', 'Coral', 'Crystal', 'Damp', 'Dark',
  'Dry', 'Dusty', 'False', 'Fast', 'Free', 'Giant', 'Glass', 'Golden',
  'Good', 'Gray', 'Great', 'Green', 'Hidden', 'Hot', 'Indigo', 'Iron',
  'Light', 'Long', 'Metal', 'Mithral', 'Obsidian', 'Purple', 'Red', 'Rock',
  'Royal', 'Silent', 'Silver', 'Small', 'Stone', 'True', 'White', 'Wild',
  'Wine', 'Yellow',
];

// F) Settlement types (1d20)
export const NAME_SETTLEMENT_TYPES: string[] = [
  'Borough', 'Bourg', 'Camp', 'Cester', 'Citadel', 'City', 'County', 'Dorf',
  'Ham', 'Hamlet', 'Haven', 'Heim', 'Keep', 'Stead', 'Town', 'Village',
  'Ville', 'Ward', 'Wihr', 'Worth',
];

// G) Directions, Adjectives (1d20)
export const NAME_DIRECTIONS: string[] = [
  'Bottom', 'Down', 'East', 'Far', 'Fort', 'Haute', 'High', 'Little',
  'Lost', 'Low', 'Mount', 'New', 'North', 'Old', 'Port', 'Saint',
  'South', 'Under', 'Up', 'West',
];

// H) Nature, Topography (1d100, pairs)
export const NAME_NATURE: string[] = [
  'Bay', 'Beach', 'Bone', 'Break', 'Burrow', 'Cliff', 'Corner', 'Creek',
  'Dale', 'End', 'Fall', 'Field', 'Forest', 'Garden', 'Glade', 'Glen',
  'Grove', 'Heid', 'Helm', 'Hill', 'Hold', 'Hole', 'Hollow', 'Island',
  'Lake', 'Land', 'Limit', 'Marsh', 'Mont', 'Moor', 'Mount', 'Mountain',
  'Park', 'Pass', 'Path', 'Peak', 'Plain', 'Point', 'Pool', 'Rest',
  'Run', 'Source', 'Summit', 'Trail', 'Tree', 'Valley', 'View', 'Way',
  'Well', 'Wood',
];

// Castle name components
export const CASTLE_NAME_FIRST: string[] = [
  'Apple', 'Battle', 'Black', 'Bleak', 'Bloody', 'Bright', 'Broken', 'Cloud',
  'Dark', 'Dawn', 'Dragon', 'Dusk', 'Fire', 'Golden', 'Hammer', 'Hawk',
  'Horse', 'Ice', 'Light', 'Lion', 'Moon', 'Oak', 'Raven', 'Red',
  'River', 'Rose', 'Silver', 'Star', 'Stone', 'Windy',
];

export const CASTLE_NAME_SECOND: string[] = [
  'Bane', 'Bridge', 'Fall', 'Fang', 'Foot', 'Heart', 'Herd', 'Hold',
  'Hook', 'Keep', 'Maw', 'Mist', 'Moor', 'Peak', 'Rock', 'Shield',
  'Skull', 'Song', 'Soul', 'Storm', 'Thorn', 'Vale', 'Way', 'Wood',
];

// Abbey names
export const ABBEY_NAME_PREFIXES: string[] = [
  'Blessed-Land',
  'Clear-Water',
  'Fruitful-Garden',
  'Good-Help',
  'Good-Hope',
  'Good-Relief',
  'Our-Lady-of-Chastity',
  'Our-Lady-of-Mercy',
  'Our-Lady-of-the-Poor',
  'Peaceful-Soul',
  'Sacred-Heart',
];

export const SAINTS: string[] = [
  'Adélie', 'Agath', 'Alexia', 'Aubreda', 'Bardolphus', 'Barthélemy', 'Beatrix',
  'Bérengérius', 'Bernardus', 'Cecilia', 'Cédany', 'Émelote', 'Gaufridus', 'Geffrey',
  'Géroldin', 'Guillotin', 'Jaclyn', 'Jacomus', 'Madeleine', 'Marion', 'Mariorie',
  'Martin', 'Mary', 'Melchior', 'Paul', 'Pétasse', 'Peter', 'Remy', 'Thomasse', 'Victor',
];

// Map component letters to arrays
export const NAME_COMPONENTS: Record<string, string[]> = {
  A: NAME_BUILDINGS,
  B: NAME_NOUNS,
  C: NAME_FIRSTNAMES,
  D: NAME_CITYNAMES,
  E: NAME_ADJECTIVES,
  F: NAME_SETTLEMENT_TYPES,
  G: NAME_DIRECTIONS,
  H: NAME_NATURE,
};

export default {
  NAME_STRUCTURE,
  NAME_COMPONENTS,
  CASTLE_NAME_FIRST,
  CASTLE_NAME_SECOND,
  ABBEY_NAME_PREFIXES,
  SAINTS,
};
