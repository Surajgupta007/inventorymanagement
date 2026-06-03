/**
 * Unit Conversion Utilities
 *
 * Storage strategy:
 *   weight  → base unit = grams (g)
 *   volume  → base unit = milliliters (mL)
 *   count   → base unit = unit
 *
 * All quantities in the DB are in base units.
 * Conversions are applied:
 *   - BEFORE saving  (toBaseUnit)
 *   - BEFORE display (fromBaseUnit)
 *   - DURING price calculation (see calculateLineTotal)
 */

export type WeightUnit = 'g' | 'kg' | 'mg';
export type VolumeUnit = 'mL' | 'L';
export type CountUnit = 'unit';
export type SupportedUnit = WeightUnit | VolumeUnit | CountUnit;

/** Conversion factors to base unit. Multiply input by factor to get base unit value. */
const TO_BASE: Record<SupportedUnit, number> = {
  // Weight: base = g
  g: 1,
  kg: 1_000,
  mg: 0.001,
  // Volume: base = mL
  mL: 1,
  L: 1_000,
  // Count: base = unit
  unit: 1,
};

/** All units grouped by dimension */
export const UNITS_BY_DIMENSION = {
  weight: ['g', 'kg', 'mg'] as WeightUnit[],
  volume: ['mL', 'L'] as VolumeUnit[],
  count: ['unit'] as CountUnit[],
};

/** Display labels */
export const UNIT_LABELS: Record<SupportedUnit, string> = {
  g: 'Grams (g)',
  kg: 'Kilograms (kg)',
  mg: 'Milligrams (mg)',
  mL: 'Milliliters (mL)',
  L: 'Liters (L)',
  unit: 'Units (each)',
};

/** Short display labels */
export const UNIT_SHORT: Record<SupportedUnit, string> = {
  g: 'g',
  kg: 'kg',
  mg: 'mg',
  mL: 'mL',
  L: 'L',
  unit: 'unit',
};

export type Dimension = 'weight' | 'volume' | 'count';

/** Base unit for each dimension */
export const BASE_UNIT: Record<Dimension, SupportedUnit> = {
  weight: 'g',
  volume: 'mL',
  count: 'unit',
};

/**
 * Convert a quantity from any supported unit to the base unit.
 * e.g. toBaseUnit(2, 'kg') → 2000 (grams)
 */
export function toBaseUnit(quantity: number, fromUnit: SupportedUnit): number {
  const factor = TO_BASE[fromUnit];
  if (factor === undefined) {
    throw new Error(`Unsupported unit: ${fromUnit}`);
  }
  return quantity * factor;
}

/**
 * Convert a quantity from base unit to any supported unit.
 * e.g. fromBaseUnit(2000, 'kg') → 2 (kilograms)
 */
export function fromBaseUnit(baseQty: number, toUnit: SupportedUnit): number {
  const factor = TO_BASE[toUnit];
  if (factor === undefined) {
    throw new Error(`Unsupported unit: ${toUnit}`);
  }
  return baseQty / factor;
}

/**
 * Convert between any two supported units of the same dimension.
 */
export function convertUnits(
  quantity: number,
  fromUnit: SupportedUnit,
  toUnit: SupportedUnit
): number {
  const inBase = toBaseUnit(quantity, fromUnit);
  return fromBaseUnit(inBase, toUnit);
}

/**
 * Calculate the total INR price for an order line.
 *
 * @param orderedQty    Quantity in the ordered unit (e.g., 2 kg)
 * @param orderedUnit   The unit the user chose (e.g., 'kg')
 * @param pricePerBase  Price per base unit in INR (e.g., ₹0.10 per gram)
 * @returns             Total in INR and base quantity
 */
export function calculateLineTotal(
  orderedQty: number,
  orderedUnit: SupportedUnit,
  pricePerBase: number
): { baseQty: number; lineTotal: number } {
  const baseQty = toBaseUnit(orderedQty, orderedUnit);
  const lineTotal = baseQty * pricePerBase;
  return { baseQty, lineTotal };
}

/** Format a number as Indian Rupees */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Get supported units for a dimension */
export function getUnitsForDimension(dimension: Dimension): SupportedUnit[] {
  return UNITS_BY_DIMENSION[dimension] as SupportedUnit[];
}
