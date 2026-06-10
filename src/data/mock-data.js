export const mockSearches = [
  {
    id: 1,
    title: 'BMW 320e Station Wagons',
    status: 'active',
    criteria: {
      brand: 'BMW',
      model: '3 Series',
      minYear: 2021,
      maxMileage: 80000,
      fuel: 'PHEV'
    },
    matchesToday: 3,
    avgMargin: 3500,
    sources: ['Mobile.de', 'AutoScout24']
  },
  {
    id: 2,
    title: 'Renault Megane Diesel',
    status: 'paused',
    criteria: {
      brand: 'Renault',
      model: 'Megane',
      minYear: 2019,
      maxMileage: 120000,
      fuel: 'Diesel'
    },
    matchesToday: 0,
    avgMargin: 1800,
    sources: ['Mobile.de']
  }
];

export const mockAlerts = [
  {
    id: 101,
    searchId: 1,
    userStatus: 'new',
    date: 'Today',
    createdAt: new Date().toISOString(),
    carTitle: '2021 BMW 320e Touring M-Sport',
    platform: 'Mobile.de',
    listingUrl: 'https://www.mobile.de',
    priceOriginal: 26500,
    cc: 1998,
    co2: 43,
    fuelType: 'Petrol',
    ageYears: 5,
    isvEst: 450,
    transportEst: 800,
    totalCost: 27750,
    marketPrice: 33000,
    marginEst: 3500,
    flags: ['PHEV']
  },
  {
    id: 102,
    searchId: 1,
    userStatus: 'new',
    date: 'Yesterday',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    carTitle: '2020 Volvo V60 T6 Recharge',
    platform: 'AutoScout24',
    listingUrl: 'https://www.autoscout24.com',
    priceOriginal: 28900,
    cc: 1969,
    co2: 35,
    fuelType: 'Petrol',
    ageYears: 6,
    isvEst: 600,
    transportEst: 800,
    totalCost: 30300,
    marketPrice: 34500,
    marginEst: 4200,
    flags: ['PHEV', 'Uncertain CO2']
  }
];
