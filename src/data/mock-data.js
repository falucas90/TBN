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
    date: 'Today',
    carTitle: '2021 BMW 320e Touring M-Sport',
    platform: 'Mobile.de',
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
    date: 'Yesterday',
    carTitle: '2020 Volvo V60 T6 Recharge',
    platform: 'AutoScout24',
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

export const mockUsers = [
  {
    id: 1,
    name: 'Francisco Lucas',
    company: 'FL Motors',
    email: 'francisco@flmotors.pt',
    password: 'dealer123',
    role: 'dealer',
    status: 'active',
    plan: 'Pro Sourcing',
    defaultTransportCost: 800
  },
  {
    id: 2,
    name: 'Admin Crivo',
    company: 'Crivo',
    email: 'admin@crivo.pt',
    password: 'admin123',
    role: 'admin',
    status: 'active',
    plan: 'Admin',
    defaultTransportCost: 0
  }
];
