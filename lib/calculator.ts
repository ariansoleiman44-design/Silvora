/**
 * Silage requirement calculator — pure functions, no UI.
 * All results are planning ESTIMATES.
 */

export interface CalculatorInput {
  animals: number;
  /** kg fresh silage per animal per day */
  perAnimalPerDay: number;
  /** feeding period in days */
  days: number;
  /** usable kg per bale */
  usablePerBale: number;
  /** waste allowance in percent, e.g. 8 */
  wastePercent: number;
  /** optional reserve in percent, e.g. 10 */
  reservePercent: number;
}

export interface CalculatorResult {
  /** kg fed before waste */
  netKg: number;
  /** kg required including waste allowance */
  totalKg: number;
  bales: number;
  reserveBales: number;
  balesWithReserve: number;
  /** Approximate consumption rate, for planning delivery cadence. */
  weeklyKg: number;
  monthlyKg: number;
}

/**
 * Herd presets for the planner. `perAnimalPerDay` is fresh silage in kg
 * and is a STARTING POINT for planning only — real intake depends on
 * ration design, animal weight, production stage and dry matter.
 */
export interface AnimalPreset {
  key: string;
  label: string;
  perAnimalPerDay: number;
}

export const animalPresets: AnimalPreset[] = [
  { key: "dairy", label: "Dairy cows (lactating)", perAnimalPerDay: 25 },
  { key: "dairy-dry", label: "Dairy cows (dry)", perAnimalPerDay: 15 },
  { key: "beef", label: "Beef cattle (finishing)", perAnimalPerDay: 20 },
  { key: "beef-store", label: "Beef cattle (store)", perAnimalPerDay: 14 },
  { key: "heifers", label: "Heifers / youngstock", perAnimalPerDay: 10 },
  { key: "sheep-goats", label: "Sheep & goats", perAnimalPerDay: 3 },
];

export const calculatorDefaults: CalculatorInput = {
  animals: 60,
  perAnimalPerDay: 25,
  days: 180,
  usablePerBale: 700,
  wastePercent: 8,
  reservePercent: 10,
};

export function calculateSilage(input: CalculatorInput): CalculatorResult {
  const animals = Math.max(0, input.animals);
  const perDay = Math.max(0, input.perAnimalPerDay);
  const days = Math.max(0, input.days);
  const perBale = Math.max(1, input.usablePerBale);
  const waste = Math.max(0, input.wastePercent) / 100;
  const reserve = Math.max(0, input.reservePercent) / 100;

  const netKg = animals * perDay * days;
  const totalKg = netKg * (1 + waste);
  const bales = Math.ceil(totalKg / perBale);
  const reserveBales = Math.ceil(bales * reserve);
  const perDayTotal = animals * perDay * (1 + waste);

  return {
    netKg,
    totalKg,
    bales,
    reserveBales,
    balesWithReserve: bales + reserveBales,
    weeklyKg: perDayTotal * 7,
    monthlyKg: perDayTotal * 30,
  };
}
