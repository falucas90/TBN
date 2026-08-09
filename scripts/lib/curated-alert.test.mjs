import { describe, it, expect } from 'vitest';
import {
  DEFAULT_LISTING,
  CANONICAL_FUEL_TYPES,
  ALERT_ENV_VARS,
  parseListingOverrides,
  buildListing,
  validateListing,
} from './curated-alert.mjs';

describe('DEFAULT_LISTING (the smoke-test fixture)', () => {
  it('is exactly the original hardcoded PHEV fixture', () => {
    expect(DEFAULT_LISTING).toEqual({
      car_title: 'BMW 330e Touring (teste beta)',
      platform: 'Mobile.de',
      listing_url: 'https://www.mobile.de/auto-inserat/bmw-330e/example-crivo-test',
      price_original: 28500,
      cc: 1998,
      co2: 36,
      fuel_type: 'Gasolina',
      age_years: 3,
      transport_est: 800,
      market_price: 37500,
      flags: ['PHEV'],
    });
  });

  it('itself passes the data-contract validation (regression guard)', () => {
    expect(() => validateListing(DEFAULT_LISTING)).not.toThrow();
  });

  it('is frozen so a caller cannot mutate the shared default', () => {
    expect(() => {
      DEFAULT_LISTING.car_title = 'tampered';
    }).toThrow();
  });
});

describe('ALERT_ENV_VARS', () => {
  it('every override env var is ALERT_-prefixed (never a bare column name)', () => {
    // Bare names like CC or PLATFORM risk colliding with ambient shell vars
    // (CC especially — the C compiler env var). See scripts/lib/curated-alert.mjs.
    expect(ALERT_ENV_VARS.length).toBeGreaterThan(0);
    for (const name of ALERT_ENV_VARS) expect(name.startsWith('ALERT_')).toBe(true);
  });
});

describe('parseListingOverrides', () => {
  it('returns no overrides when no ALERT_* vars are set (bare smoke-test invocation)', () => {
    expect(parseListingOverrides({})).toEqual({});
  });

  it('ignores unrelated env vars, including ambient CC', () => {
    // The exact footgun ALERT_-prefixing avoids: a shell with CC=gcc set
    // must not leak into the alert's engine-displacement field.
    expect(parseListingOverrides({ CC: 'gcc', PATH: '/usr/bin', HOME: '/root' })).toEqual({});
  });

  it('parses every field when all ALERT_* vars are set', () => {
    const env = {
      ALERT_CAR_TITLE: '  Renault Captur E-Tech  ',
      ALERT_PLATFORM: 'AutoScout24',
      ALERT_LISTING_URL: 'https://www.autoscout24.de/angebote/renault-captur-example',
      ALERT_PRICE_ORIGINAL: '19500',
      ALERT_CC: '1598',
      ALERT_CO2: '28',
      ALERT_FUEL_TYPE: 'Híbrido (PHEV)',
      ALERT_AGE_YEARS: '2',
      ALERT_TRANSPORT_EST: '750',
      ALERT_MARKET_PRICE: '26900',
      ALERT_FLAGS: 'PHEV, Alta quilometragem',
    };
    expect(parseListingOverrides(env)).toEqual({
      car_title: 'Renault Captur E-Tech',
      platform: 'AutoScout24',
      listing_url: 'https://www.autoscout24.de/angebote/renault-captur-example',
      price_original: 19500,
      cc: 1598,
      co2: 28,
      fuel_type: 'Híbrido (PHEV)',
      age_years: 2,
      transport_est: 750,
      market_price: 26900,
      flags: ['PHEV', 'Alta quilometragem'],
    });
  });

  it('numeric fields are parsed to numbers, not left as strings', () => {
    const { price_original } = parseListingOverrides({ ALERT_PRICE_ORIGINAL: '19500' });
    expect(price_original).toBe(19500);
    expect(typeof price_original).toBe('number');
  });

  it('treats an empty string as "not provided" for every field', () => {
    expect(
      parseListingOverrides({ ALERT_CAR_TITLE: '', ALERT_CO2: '', ALERT_FLAGS: '' })
    ).toEqual({});
  });

  it('ALERT_FLAGS=none means an explicit empty list', () => {
    expect(parseListingOverrides({ ALERT_FLAGS: 'none' }).flags).toEqual([]);
    expect(parseListingOverrides({ ALERT_FLAGS: 'NONE' }).flags).toEqual([]);
  });

  it('ALERT_CC=0 is a valid override (electric vehicles have no displacement)', () => {
    expect(parseListingOverrides({ ALERT_CC: '0' }).cc).toBe(0);
  });

  it('rejects a non-integer numeric field', () => {
    expect(() => parseListingOverrides({ ALERT_PRICE_ORIGINAL: '28500.5' })).toThrow(
      /ALERT_PRICE_ORIGINAL.*whole number/
    );
  });

  it('rejects a non-numeric value in a numeric field', () => {
    expect(() => parseListingOverrides({ ALERT_CO2: 'thirty-six' })).toThrow(/ALERT_CO2/);
  });

  it('rejects a negative price', () => {
    expect(() => parseListingOverrides({ ALERT_PRICE_ORIGINAL: '-100' })).toThrow(
      /ALERT_PRICE_ORIGINAL.*>= 1/
    );
  });

  it('rejects a negative cc even though 0 is allowed', () => {
    expect(() => parseListingOverrides({ ALERT_CC: '-1' })).toThrow(/ALERT_CC.*>= 0/);
  });

  it('rejects a listing_url that is not an absolute URL', () => {
    expect(() => parseListingOverrides({ ALERT_LISTING_URL: 'not-a-url' })).toThrow(
      /ALERT_LISTING_URL/
    );
  });

  it('rejects a non-http(s) listing_url scheme', () => {
    expect(() => parseListingOverrides({ ALERT_LISTING_URL: 'javascript:alert(1)' })).toThrow(
      /ALERT_LISTING_URL.*http/
    );
  });

  it('collects every invalid field into one error instead of failing on the first', () => {
    let message = '';
    try {
      parseListingOverrides({
        ALERT_PRICE_ORIGINAL: 'not-a-number',
        ALERT_LISTING_URL: 'not-a-url',
      });
    } catch (err) {
      message = err.message;
    }
    expect(message).toMatch(/ALERT_PRICE_ORIGINAL/);
    expect(message).toMatch(/ALERT_LISTING_URL/);
  });
});

describe('buildListing', () => {
  it('with no overrides, reproduces DEFAULT_LISTING exactly and flags every field as defaulted', () => {
    const { listing, defaultedFields } = buildListing({});
    expect(listing).toEqual(DEFAULT_LISTING);
    expect(defaultedFields.sort()).toEqual(Object.keys(DEFAULT_LISTING).sort());
  });

  it('merges partial overrides on top of the fixture, field by field', () => {
    const { listing, defaultedFields } = buildListing({
      car_title: 'Renault Captur E-Tech',
      price_original: 19500,
    });
    expect(listing.car_title).toBe('Renault Captur E-Tech');
    expect(listing.price_original).toBe(19500);
    // Untouched fields keep the fixture's values.
    expect(listing.platform).toBe(DEFAULT_LISTING.platform);
    expect(listing.flags).toEqual(DEFAULT_LISTING.flags);
    expect(defaultedFields).not.toContain('car_title');
    expect(defaultedFields).not.toContain('price_original');
    expect(defaultedFields).toContain('platform');
    expect(defaultedFields).toContain('flags');
  });

  it('a fully-overridden row defaults nothing', () => {
    const overrides = {
      car_title: 'x', platform: 'x', listing_url: 'https://example.com/x',
      price_original: 1, cc: 0, co2: 0, fuel_type: 'Elétrico',
      age_years: 0, transport_est: 0, market_price: 1, flags: [],
    };
    const { defaultedFields } = buildListing(overrides);
    expect(defaultedFields).toEqual([]);
  });
});

describe('validateListing', () => {
  it('accepts every canonical fuel_type', () => {
    for (const fuel_type of CANONICAL_FUEL_TYPES) {
      // 'Híbrido (PHEV)' has its own cross-check (must carry the PHEV flag +
      // a co2 figure), covered separately below.
      const listing =
        fuel_type === 'Híbrido (PHEV)'
          ? { ...DEFAULT_LISTING, fuel_type, flags: ['PHEV'], co2: 40 }
          : { ...DEFAULT_LISTING, fuel_type, flags: [] };
      expect(() => validateListing(listing)).not.toThrow();
    }
  });

  it('rejects a non-canonical fuel_type (e.g. a lowercase typo)', () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, fuel_type: 'diesel' })
    ).toThrow(/fuel_type/);
  });

  it('rejects a PHEV-flagged listing with null co2 — the exact TECH_DEBT.md bug pattern', () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, flags: ['PHEV'], co2: null })
    ).toThrow(/co2 is missing/);
  });

  it('rejects a PHEV-flagged listing with undefined co2', () => {
    const listing = { ...DEFAULT_LISTING, flags: ['PHEV'] };
    delete listing.co2;
    expect(() => validateListing(listing)).toThrow(/co2 is missing/);
  });

  it('accepts a PHEV-flagged listing with a real co2 figure', () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, flags: ['PHEV'], co2: 40 })
    ).not.toThrow();
  });

  it('does not require co2 when the PHEV flag is absent', () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, flags: [], co2: null })
    ).not.toThrow();
  });

  it("rejects fuel_type 'Híbrido (PHEV)' when flags is missing the PHEV tag", () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, fuel_type: 'Híbrido (PHEV)', flags: ['Alta quilometragem'] })
    ).toThrow(/does not include 'PHEV'/);
  });

  it("accepts fuel_type 'Híbrido (PHEV)' paired with the PHEV flag and a co2 figure", () => {
    expect(() =>
      validateListing({ ...DEFAULT_LISTING, fuel_type: 'Híbrido (PHEV)', flags: ['PHEV'], co2: 40 })
    ).not.toThrow();
  });

  it('reports multiple problems in one thrown error', () => {
    let message = '';
    try {
      validateListing({ ...DEFAULT_LISTING, fuel_type: 'diesel', flags: ['PHEV'], co2: null });
    } catch (err) {
      message = err.message;
    }
    expect(message).toMatch(/fuel_type/);
    expect(message).toMatch(/co2 is missing/);
  });
});

describe('end-to-end: a realistic curated (non-fixture) listing', () => {
  it('parses, merges and validates cleanly', () => {
    const env = {
      ALERT_CAR_TITLE: 'VW Golf 1.6 TDI',
      ALERT_PLATFORM: 'Mobile.de',
      ALERT_PRICE_ORIGINAL: '15900',
      ALERT_CC: '1598',
      ALERT_CO2: '104',
      ALERT_FUEL_TYPE: 'Diesel',
      ALERT_AGE_YEARS: '4',
      ALERT_MARKET_PRICE: '21500',
      ALERT_FLAGS: 'none',
    };
    const overrides = parseListingOverrides(env);
    const { listing, defaultedFields } = buildListing(overrides);
    expect(() => validateListing(listing)).not.toThrow();
    expect(listing.flags).toEqual([]);
    expect(listing.fuel_type).toBe('Diesel');
    // transport_est and listing_url were not customized in this example.
    expect(defaultedFields).toEqual(expect.arrayContaining(['transport_est', 'listing_url']));
  });
});
