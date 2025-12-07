// ============================================
// DICE ROLLING AND TABLE RESOLUTION
// ============================================

import type { RollableTable, TableEntry, RollResult } from './types';

/**
 * Parse a dice formula like "1d6", "2d10", "1d100"
 */
export function parseDiceFormula(formula: string): { count: number; sides: number; modifier: number } {
  const match = formula.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}

/**
 * Roll a single die with N sides
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll dice according to a formula (e.g., "2d6+1")
 */
export function rollDice(formula: string): number {
  const { count, sides, modifier } = parseDiceFormula(formula);
  let total = modifier;
  for (let i = 0; i < count; i++) {
    total += rollDie(sides);
  }
  return total;
}

/**
 * Roll a specific die type
 */
export function d4(): number { return rollDie(4); }
export function d6(): number { return rollDie(6); }
export function d8(): number { return rollDie(8); }
export function d10(): number { return rollDie(10); }
export function d12(): number { return rollDie(12); }
export function d20(): number { return rollDie(20); }
export function d100(): number { return rollDie(100); }
export function d24(): number { return rollDie(24); }
export function d30(): number { return rollDie(30); }

/**
 * Roll 2d6 (common for encounter tables)
 */
export function roll2d6(): number {
  return d6() + d6();
}

/**
 * Find the matching entry for a roll value
 */
export function findEntry(table: RollableTable, roll: number): TableEntry | undefined {
  return table.entries.find(entry => roll >= entry.min && roll <= entry.max);
}

/**
 * Roll on a table and return the result
 */
export function rollOnTable(table: RollableTable): RollResult {
  const roll = rollDice(table.diceFormula);
  const entry = findEntry(table, roll);
  
  if (!entry) {
    console.warn(`No entry found for roll ${roll} on table ${table.id}`);
    return {
      tableId: table.id,
      roll,
      value: 'Unknown',
    };
  }
  
  return {
    tableId: table.id,
    roll,
    value: entry.value,
  };
}

/**
 * Roll on a table with subtable resolution
 * @param table The table to roll on
 * @param allTables Map of all available tables for subtable lookups
 */
export function rollOnTableWithSubtables(
  table: RollableTable,
  allTables: Map<string, RollableTable>
): RollResult {
  const roll = rollDice(table.diceFormula);
  const entry = findEntry(table, roll);
  
  if (!entry) {
    console.warn(`No entry found for roll ${roll} on table ${table.id}`);
    return {
      tableId: table.id,
      roll,
      value: 'Unknown',
    };
  }
  
  const result: RollResult = {
    tableId: table.id,
    roll,
    value: entry.value,
  };
  
  // Handle subtable reference
  if (entry.subTable) {
    const subTable = allTables.get(entry.subTable);
    if (subTable) {
      const count = entry.subTableCount || 1;
      result.subResults = [];
      for (let i = 0; i < count; i++) {
        result.subResults.push(rollOnTableWithSubtables(subTable, allTables));
      }
    } else {
      console.warn(`Subtable not found: ${entry.subTable}`);
    }
  }
  
  return result;
}

/**
 * Pick a random item from an array
 */
export function pickRandom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Pick N random items from an array (without replacement)
 */
export function pickRandomN<T>(array: T[], n: number): T[] {
  const shuffled = [...array].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, array.length));
}

/**
 * Roll a percentage check (1d100 <= threshold)
 */
export function percentageCheck(threshold: number): boolean {
  return d100() <= threshold;
}

/**
 * Roll a X-in-6 check (common in OSR games)
 */
export function chanceIn6(x: number): boolean {
  return d6() <= x;
}

/**
 * Flatten a roll result with subtables into a single string
 */
export function flattenRollResult(result: RollResult): string {
  let output = result.value;
  
  if (result.subResults && result.subResults.length > 0) {
    const subValues = result.subResults.map(flattenRollResult);
    // Replace [sub] placeholder or append
    if (output.includes('[sub]')) {
      output = output.replace('[sub]', subValues.join(', '));
    } else {
      output = `${output}: ${subValues.join(', ')}`;
    }
  }
  
  return output;
}
