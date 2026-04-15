export function calculateISV(cc, co2, fuelType, ageYears, isPhev, isNonEu) {
  // Rough 2026 Portuguese ISV approximation
  
  let ccTax = 0;
  if (cc <= 1000) ccTax = cc * 1.0;
  else if (cc <= 1250) ccTax = cc * 1.15;
  else ccTax = cc * 5.2 - 2900; 
  if (ccTax < 0) ccTax = 100;

  let co2Tax = 0;
  if (fuelType === 'Diesel') {
    if (co2 <= 79) co2Tax = 5;
    else if (co2 <= 99) co2Tax = (co2 - 79) * 21;
    else if (co2 <= 115) co2Tax = (co2 - 99) * 58 + 420;
    else co2Tax = (co2 - 115) * 150 + 1300;
  } else {
    // Petrol
    if (co2 <= 99) co2Tax = 10;
    else if (co2 <= 115) co2Tax = (co2 - 99) * 18;
    else if (co2 <= 145) co2Tax = (co2 - 115) * 48 + 288;
    else co2Tax = (co2 - 145) * 135 + 1600;
  }

  let subtotal = ccTax + co2Tax;
  
  // Age discount
  let ageDiscountPercent = 0;
  if (!isNonEu) {
    if (ageYears >= 1 && ageYears < 2) ageDiscountPercent = 0.10;
    else if (ageYears >= 2 && ageYears < 3) ageDiscountPercent = 0.20;
    else if (ageYears >= 3 && ageYears < 4) ageDiscountPercent = 0.28;
    else if (ageYears >= 4 && ageYears < 5) ageDiscountPercent = 0.35;
    else if (ageYears >= 5 && ageYears < 6) ageDiscountPercent = 0.43;
    else if (ageYears >= 6 && ageYears < 7) ageDiscountPercent = 0.52;
    else if (ageYears >= 7) ageDiscountPercent = 0.55; 
  }
  
  let totalISV = subtotal * (1 - ageDiscountPercent);

  // PHEV discount applies to 25% payable (75% discount)
  // Usually requires <50g CO2 and range >50km
  if (isPhev && co2 <= 50) {
    totalISV *= 0.25; 
  }

  return {
    ccComponent: ccTax,
    co2Component: co2Tax,
    subtotal: subtotal,
    ageDiscountAmount: subtotal * ageDiscountPercent,
    isvPayable: Math.max(0, totalISV)
  };
}
