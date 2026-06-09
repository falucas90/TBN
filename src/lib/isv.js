// ISV rate tables by tax year. Add a new entry each January.
const RATE_TABLES = {
  2026: {
    ccBrackets: [
      { max: 1000, rate: 1.0,  base: 0 },
      { max: 1250, rate: 1.15, base: 0 },
      { max: Infinity, rate: 5.2, base: -2900 },
    ],
    co2Diesel: [
      { max: 79,       rate: 0,   base: 5 },
      { max: 99,       rate: 21,  base: -79 * 21 + 5 },
      { max: 115,      rate: 58,  base: -99 * 58 + 420 },
      { max: Infinity, rate: 150, base: -115 * 150 + 1300 },
    ],
    co2Petrol: [
      { max: 99,       rate: 0,   base: 10 },
      { max: 115,      rate: 18,  base: -99 * 18 },
      { max: 145,      rate: 48,  base: -115 * 48 + 288 },
      { max: Infinity, rate: 135, base: -145 * 135 + 1600 },
    ],
    ageDiscounts: [
      { minAge: 7, discount: 0.55 },
      { minAge: 6, discount: 0.52 },
      { minAge: 5, discount: 0.43 },
      { minAge: 4, discount: 0.35 },
      { minAge: 3, discount: 0.28 },
      { minAge: 2, discount: 0.20 },
      { minAge: 1, discount: 0.10 },
      { minAge: 0, discount: 0.00 },
    ],
  },
};

function getActiveRates() {
  const year = new Date().getFullYear();
  // Use the most recent table available
  const available = Object.keys(RATE_TABLES).map(Number).sort((a, b) => b - a);
  const key = available.find(y => y <= year) ?? available[0];
  return RATE_TABLES[key];
}

function applyBracket(value, brackets) {
  for (const b of brackets) {
    if (value <= b.max) return Math.max(0, value * b.rate + b.base);
  }
  return 0;
}

export function calculateISV(cc, co2, fuelType, ageYears, isPhev, isNonEu) {
  const rates = getActiveRates();

  const ccTax = Math.max(100, applyBracket(cc, rates.ccBrackets));

  const isDiesel = fuelType === 'Diesel';
  const co2Tax = applyBracket(co2, isDiesel ? rates.co2Diesel : rates.co2Petrol);

  const subtotal = ccTax + co2Tax;

  let ageDiscountPercent = 0;
  if (!isNonEu) {
    const row = rates.ageDiscounts.find(r => ageYears >= r.minAge);
    ageDiscountPercent = row ? row.discount : 0;
  }

  let totalISV = subtotal * (1 - ageDiscountPercent);

  if (isPhev && co2 <= 50) totalISV *= 0.25;

  return {
    ccComponent: ccTax,
    co2Component: co2Tax,
    subtotal,
    ageDiscountAmount: subtotal * ageDiscountPercent,
    isvPayable: Math.max(0, totalISV),
  };
}
