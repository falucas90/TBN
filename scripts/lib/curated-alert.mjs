// scripts/lib/curated-alert.mjs
// ----------------------------------------------------------------------------
// Pure helpers for scripts/seed-test-alert.mjs: turn the optional ALERT_*
// env vars into overrides on top of the smoke-test fixture, and validate the
// result against the data contract (docs/DATA_CONTRACT.md,
// docs/BETA_CHECKLIST.md section E). No env reads beyond what's passed in, no
// network calls, no process.exit — kept side-effect free so it's easy to
// unit test (see curated-alert.test.mjs).
// ----------------------------------------------------------------------------

// The original smoke-test fixture (a realistic PHEV). Kept as the default for
// every field so `npm run seed:alert` with no ALERT_* vars set behaves
// exactly as before. Units must match the data contract exactly (see
// docs/BETA_CHECKLIST.md section E):
//   - price_original, market_price, transport_est : whole euros (integer)
//   - cc   : engine displacement in cm3 (integer)
//   - co2  : WLTP emissions in g/km (integer)
//   - age_years : whole years since registration (integer)
//   - fuel_type : 'Diesel' switches the ISV CO2 table; anything else uses petrol
//   - flags : must include 'PHEV' for the browser ISV calc to apply the PHEV rule
export const DEFAULT_LISTING = Object.freeze({
  car_title: 'BMW 330e Touring (teste beta)',
  platform: 'Mobile.de',
  listing_url: 'https://www.mobile.de/auto-inserat/bmw-330e/example-crivo-test',
  price_original: 28500, // euros
  cc: 1998, // cm3
  co2: 36, // g/km WLTP (<= 50 so the PHEV rule applies)
  fuel_type: 'Gasolina', // petrol CO2 table (only 'Diesel' switches the branch)
  age_years: 3, // whole years
  transport_est: 800, // euros
  market_price: 37500, // euros
  flags: ['PHEV'],
});

// Matches the calculator UI (src/pages/IsvCalculator.jsx) and the proposed
// canonical set in docs/DATA_CONTRACT.md #1. Only the exact string 'Diesel'
// switches the ISV calc (src/lib/isv.js) to the diesel CO2 table; every other
// value uses the petrol table, so a typo here silently taxes on the wrong
// table with no error.
export const CANONICAL_FUEL_TYPES = ['Diesel', 'Gasolina', 'Híbrido (PHEV)', 'Elétrico'];

// One entry per overridable field. envVar names are all ALERT_-prefixed
// (never bare column names like CC or PLATFORM) to avoid colliding with
// unrelated env vars a shell may already have set — CC in particular is a
// very common ambient var (C compiler path) that would otherwise get picked
// up by accident.
const FIELD_SPECS = [
  { key: 'car_title', envVar: 'ALERT_CAR_TITLE', kind: 'string' },
  { key: 'platform', envVar: 'ALERT_PLATFORM', kind: 'string' },
  { key: 'listing_url', envVar: 'ALERT_LISTING_URL', kind: 'url' },
  { key: 'price_original', envVar: 'ALERT_PRICE_ORIGINAL', kind: 'int', min: 1 },
  { key: 'cc', envVar: 'ALERT_CC', kind: 'int', min: 0 }, // 0 is valid (EVs)
  { key: 'co2', envVar: 'ALERT_CO2', kind: 'int', min: 0 },
  { key: 'fuel_type', envVar: 'ALERT_FUEL_TYPE', kind: 'string' },
  { key: 'age_years', envVar: 'ALERT_AGE_YEARS', kind: 'int', min: 0 },
  { key: 'transport_est', envVar: 'ALERT_TRANSPORT_EST', kind: 'int', min: 0 },
  { key: 'market_price', envVar: 'ALERT_MARKET_PRICE', kind: 'int', min: 1 },
  { key: 'flags', envVar: 'ALERT_FLAGS', kind: 'flags' },
];

export const ALERT_ENV_VARS = FIELD_SPECS.map((f) => f.envVar);

function parseString(raw) {
  const trimmed = raw.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseInt10(raw, min) {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  if (!Number.isInteger(n)) {
    throw new Error(`must be a whole number (integer), got "${raw}"`);
  }
  if (min !== undefined && n < min) {
    throw new Error(`must be >= ${min}, got ${n}`);
  }
  return n;
}

function parseUrl(raw) {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`must be an absolute URL (e.g. https://...), got "${raw}"`);
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`must use http or https, got "${raw}"`);
  }
  return trimmed;
}

function parseFlags(raw) {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  if (trimmed.toLowerCase() === 'none') return [];
  return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
}

/**
 * Reads the ALERT_* env vars from `env` (defaults to process.env) and turns
 * them into { key: value } overrides for DEFAULT_LISTING. A field left unset,
 * or set to an empty string, is simply absent from the returned object so the
 * caller can merge the result on top of DEFAULT_LISTING and fall back
 * per-field. ALERT_FLAGS=none means an explicit empty list (overriding the
 * fixture's default ['PHEV']); a comma-separated value ("PHEV,Alta
 * quilometragem") becomes an array.
 *
 * Throws a single Error whose message lists every invalid field, so a
 * curator fixing several fields at once sees all the problems in one run
 * instead of one failed run per typo.
 */
export function parseListingOverrides(env = process.env) {
  const overrides = {};
  const errors = [];

  for (const spec of FIELD_SPECS) {
    const raw = env[spec.envVar];
    if (raw === undefined) continue;
    try {
      let value;
      if (spec.kind === 'string') value = parseString(raw);
      else if (spec.kind === 'int') value = parseInt10(raw, spec.min);
      else if (spec.kind === 'url') value = parseUrl(raw);
      else if (spec.kind === 'flags') value = parseFlags(raw);
      if (value !== undefined) overrides[spec.key] = value;
    } catch (err) {
      errors.push(`${spec.envVar} ${err.message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Invalid listing field(s):\n  - ${errors.join('\n  - ')}`);
  }

  return overrides;
}

/**
 * Merges overrides on top of DEFAULT_LISTING. Also reports which fields kept
 * the fixture's default value, so the caller can warn a curator who
 * customized some fields but forgot others.
 */
export function buildListing(overrides) {
  const listing = { ...DEFAULT_LISTING, ...overrides };
  const defaultedFields = Object.keys(DEFAULT_LISTING).filter((k) => !(k in overrides));
  return { listing, defaultedFields };
}

/**
 * Re-checks the data-contract conventions that are easy to get wrong by hand
 * and are not enforced by any DB constraint (docs/TECH_DEBT.md — "No
 * server-side data integrity on public.alerts"):
 *   - fuel_type must be one of the canonical strings (docs/DATA_CONTRACT.md #1)
 *   - a PHEV flag must carry a real co2 figure (docs/DATA_CONTRACT.md #2/#4) —
 *     this is the exact null-co2 pattern behind the PHEV ISV bug in
 *     docs/TECH_DEBT.md, so this tool must never be able to produce it
 *   - 'Híbrido (PHEV)' fuel_type without the 'PHEV' flag never gets the ISV
 *     reduction (docs/DATA_CONTRACT.md #2) — almost always a forgotten flag
 * Throws with a single message listing every problem found.
 */
export function validateListing(listing) {
  const problems = [];

  if (listing.fuel_type != null && !CANONICAL_FUEL_TYPES.includes(listing.fuel_type)) {
    problems.push(
      `fuel_type "${listing.fuel_type}" is not one of the canonical values ` +
        `(${CANONICAL_FUEL_TYPES.join(', ')}). Only the exact string 'Diesel' ` +
        'switches the ISV calc to the diesel table (docs/DATA_CONTRACT.md #1) — ' +
        'anything else, including a near-miss typo, silently uses the petrol table.'
    );
  }

  const isPhevFlagged = Array.isArray(listing.flags) && listing.flags.includes('PHEV');

  if (isPhevFlagged && (listing.co2 === null || listing.co2 === undefined)) {
    problems.push(
      "flags includes 'PHEV' but co2 is missing. Set ALERT_CO2 to the low WLTP " +
        'g/km figure for this PHEV (docs/DATA_CONTRACT.md #4) — a PHEV alert with ' +
        'no co2 silently gets the full ISV reduction regardless of real emissions ' +
        '(the exact bug tracked in docs/TECH_DEBT.md).'
    );
  }

  if (listing.fuel_type === 'Híbrido (PHEV)' && !isPhevFlagged) {
    problems.push(
      "fuel_type is 'Híbrido (PHEV)' but flags does not include 'PHEV'. fuel_type " +
        "alone never triggers the ISV PHEV reduction (docs/DATA_CONTRACT.md #2) — " +
        "add 'PHEV' to ALERT_FLAGS."
    );
  }

  if (problems.length > 0) {
    throw new Error(`Listing fails the data contract:\n  - ${problems.join('\n  - ')}`);
  }
}
