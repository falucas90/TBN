import { describe, it, expect } from 'vitest';
import { calculateISV } from './isv';

// Expected values are computed by hand from the 2026 rate table in isv.js:
//   cc:      ≤1000 → cc·1.0 | ≤1250 → cc·1.15 | >1250 → cc·5.2 − 2900   (floor: 100)
//   diesel:  ≤79 → 5 | ≤99 → 21·co2 − 1659 | ≤115 → 58·co2 − 5322 | >115 → 150·co2 − 15950
//   petrol:  ≤99 → 10 | ≤115 → 18·co2 − 1782 | ≤145 → 48·co2 − 5232 | >145 → 135·co2 − 17975

describe('cc component brackets', () => {
  it('bracket 1 (≤1000cc) taxes at 1.0x', () => {
    const r = calculateISV(900, 50, 'Petrol', 0, false, false);
    expect(r.ccComponent).toBe(900);
    expect(r.co2Component).toBe(10);
    expect(r.isvPayable).toBe(910);
  });

  it('applies the €100 minimum floor on the cc component', () => {
    const r = calculateISV(50, 50, 'Petrol', 0, false, false);
    expect(r.ccComponent).toBe(100);
    expect(r.isvPayable).toBe(110);
  });

  it('bracket 2 (1001–1250cc) taxes at 1.15x', () => {
    expect(calculateISV(1200, 50, 'Petrol', 0, false, false).ccComponent).toBe(1380);
  });

  it('bracket 3 (>1250cc) taxes at 5.2x − 2900', () => {
    expect(calculateISV(2000, 50, 'Petrol', 0, false, false).ccComponent).toBe(7500);
  });

  it('handles bracket boundaries at 1000 and 1250cc', () => {
    expect(calculateISV(1000, 50, 'Petrol', 0, false, false).ccComponent).toBe(1000);
    expect(calculateISV(1001, 50, 'Petrol', 0, false, false).ccComponent).toBeCloseTo(1151.15, 2);
    expect(calculateISV(1250, 50, 'Petrol', 0, false, false).ccComponent).toBeCloseTo(1437.5, 2);
    expect(calculateISV(1251, 50, 'Petrol', 0, false, false).ccComponent).toBeCloseTo(3605.2, 2);
  });
});

describe('CO2 component — diesel', () => {
  const co2 = (g) => calculateISV(1000, g, 'Diesel', 0, false, false).co2Component;

  it('charges the €5 base up to 79 g/km', () => {
    expect(co2(50)).toBe(5);
    expect(co2(79)).toBe(5);
  });

  it('bracket 80–99 g/km', () => {
    expect(co2(80)).toBe(21);   // 21·80 − 1659
    expect(co2(99)).toBe(420);  // 21·99 − 1659
  });

  it('bracket 100–115 g/km', () => {
    expect(co2(100)).toBe(478);  // 58·100 − 5322
    expect(co2(115)).toBe(1348); // 58·115 − 5322
  });

  it('bracket >115 g/km', () => {
    expect(co2(116)).toBe(1450);  // 150·116 − 15950
    expect(co2(150)).toBe(6550);  // 150·150 − 15950
  });
});

describe('CO2 component — petrol', () => {
  const co2 = (g) => calculateISV(1000, g, 'Petrol', 0, false, false).co2Component;

  it('charges the €10 base up to 99 g/km', () => {
    expect(co2(50)).toBe(10);
    expect(co2(99)).toBe(10);
  });

  it('bracket 100–115 g/km', () => {
    expect(co2(100)).toBe(18);   // 18·100 − 1782
    expect(co2(115)).toBe(288);  // 18·115 − 1782
  });

  it('bracket 116–145 g/km', () => {
    expect(co2(116)).toBe(336);   // 48·116 − 5232
    expect(co2(145)).toBe(1728);  // 48·145 − 5232
  });

  it('bracket >145 g/km', () => {
    expect(co2(146)).toBe(1735);  // 135·146 − 17975
  });

  it('non-diesel fuel types use the petrol table', () => {
    expect(calculateISV(1000, 100, 'Gasolina', 0, false, false).co2Component).toBe(18);
  });
});

describe('age discounts', () => {
  // cc 2000 → 7500, diesel co2 150 → 6550, subtotal 14050
  const SUBTOTAL = 14050;
  const atAge = (age) => calculateISV(2000, 150, 'Diesel', age, false, false);

  it.each([
    [0, 0.0],
    [1, 0.10],
    [2, 0.20],
    [3, 0.28],
    [4, 0.35],
    [5, 0.43],
    [6, 0.52],
    [7, 0.55],
    [10, 0.55], // 7+ caps at 55%
  ])('age %i years → %d discount', (age, discount) => {
    const r = atAge(age);
    expect(r.subtotal).toBe(SUBTOTAL);
    expect(r.ageDiscountAmount).toBeCloseTo(SUBTOTAL * discount, 2);
    expect(r.isvPayable).toBeCloseTo(SUBTOTAL * (1 - discount), 2);
  });

  it('non-EU vehicles get no age discount', () => {
    const r = calculateISV(2000, 150, 'Diesel', 7, false, true);
    expect(r.ageDiscountAmount).toBe(0);
    expect(r.isvPayable).toBe(SUBTOTAL);
  });
});

describe('PHEV reduction', () => {
  it('applies the 75% reduction when co2 ≤ 50', () => {
    // cc 1998 → 7489.6, petrol co2 45 → 10, subtotal 7499.6, age 5 → ×0.57, PHEV → ×0.25
    const r = calculateISV(1998, 45, 'Petrol', 5, true, false);
    expect(r.isvPayable).toBeCloseTo(7499.6 * 0.57 * 0.25, 2);
  });

  it('does not apply when co2 > 50', () => {
    const phev = calculateISV(1000, 51, 'Petrol', 0, true, false);
    const plain = calculateISV(1000, 51, 'Petrol', 0, false, false);
    expect(phev.isvPayable).toBe(plain.isvPayable);
  });
});

describe('invariants', () => {
  it('never returns a negative ISV', () => {
    const cases = [
      calculateISV(1, 1, 'Diesel', 10, true, false),
      calculateISV(0, 0, 'Petrol', 7, true, false),
      calculateISV(800, 30, 'Petrol', 7, true, false),
    ];
    for (const r of cases) expect(r.isvPayable).toBeGreaterThanOrEqual(0);
  });

  it('subtotal equals cc + co2 components', () => {
    const r = calculateISV(1600, 120, 'Diesel', 3, false, false);
    expect(r.subtotal).toBeCloseTo(r.ccComponent + r.co2Component, 10);
  });
});
