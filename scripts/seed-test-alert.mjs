// seed-test-alert.mjs
// ----------------------------------------------------------------------------
// Operator helper for the closed beta: inserts ONE realistic alert row into
// public.alerts for a given user (and optionally a given search) so you can
// validate the realtime + email path end to end.
//
// Inserting a row should:
//   1. Push a realtime postgres_changes INSERT → the app shows a toast and
//      increments the Alertas unread badge (src/context/AlertsContext.jsx).
//   2. Fire the Database Webhook → the notify-alert edge function sends the
//      instant email (only if the linked search has alert_channels.email = true
//      AND status = 'active'; see supabase/functions/notify-alert/index.ts).
//
// This uses the SERVICE ROLE key, which bypasses RLS — run it only from a
// trusted machine and never commit the key.
//
// Usage:
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   TEST_USER_ID=<auth-user-uuid> \
//   [TEST_SEARCH_ID=<search-uuid>] \
//   node scripts/seed-test-alert.mjs
//
// Or via npm:  npm run seed:alert   (export the env vars first)
// ----------------------------------------------------------------------------
//
// Curated real listings (interim manual bridge — docs/DECISIONS.md,
// "2026-08-04 — Interim bridge: disclosed curation + honesty fix batch"):
// every field below is optional and, unless overridden, falls back to the
// same fixture PHEV used by the smoke test above, so the plain invocation
// keeps working unchanged. Set any subset of these to hand-insert a real
// listing instead (units and conventions: docs/DATA_CONTRACT.md,
// docs/BETA_CHECKLIST.md section E):
//   ALERT_CAR_TITLE, ALERT_PLATFORM, ALERT_LISTING_URL (absolute http(s) URL),
//   ALERT_PRICE_ORIGINAL, ALERT_CC, ALERT_CO2 (all whole numbers),
//   ALERT_FUEL_TYPE (must be exactly 'Diesel' | 'Gasolina' | 'Híbrido (PHEV)' |
//   'Elétrico'), ALERT_AGE_YEARS, ALERT_TRANSPORT_EST, ALERT_MARKET_PRICE,
//   ALERT_FLAGS (comma-separated, e.g. "PHEV,Alta quilometragem";
//   ALERT_FLAGS=none for an explicit empty list).
//
// Example — a real (non-PHEV) diesel listing, targeting the same user/search
// as any other run:
//   ALERT_CAR_TITLE="VW Golf 1.6 TDI" ALERT_PLATFORM="AutoScout24" \
//   ALERT_LISTING_URL="https://www.autoscout24.de/angebote/<real-id>" \
//   ALERT_PRICE_ORIGINAL=15900 ALERT_CC=1598 ALERT_CO2=104 \
//   ALERT_FUEL_TYPE="Diesel" ALERT_AGE_YEARS=4 ALERT_TRANSPORT_EST=800 \
//   ALERT_MARKET_PRICE=21500 ALERT_FLAGS=none \
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
//   TEST_USER_ID=<auth-user-uuid> TEST_SEARCH_ID=<search-uuid> \
//   node scripts/seed-test-alert.mjs
//
// If a field is left unset it keeps the fixture's value (e.g. omitting
// ALERT_FLAGS on a PHEV keeps flags = ['PHEV']) — the script warns which
// fields are still defaulted whenever at least one field was overridden, and
// hard-fails on the data-contract traps that produce silently wrong numbers
// (a PHEV flag with no co2, a fuel_type that isn't one of the canonical
// strings, a non-integer or negative price).
// ----------------------------------------------------------------------------

import { createClient } from '@supabase/supabase-js';
import { parseListingOverrides, buildListing, validateListing } from './lib/curated-alert.mjs';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  TEST_USER_ID,
  TEST_SEARCH_ID,
} = process.env;

const missing = [];
if (!SUPABASE_URL) missing.push('SUPABASE_URL');
if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
if (!TEST_USER_ID) missing.push('TEST_USER_ID');

if (missing.length > 0) {
  console.error(
    `Missing required env var(s): ${missing.join(', ')}\n\n` +
      'Usage:\n' +
      '  SUPABASE_URL=https://<ref>.supabase.co \\\n' +
      '  SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \\\n' +
      '  TEST_USER_ID=<auth-user-uuid> \\\n' +
      '  [TEST_SEARCH_ID=<search-uuid>] \\\n' +
      '  node scripts/seed-test-alert.mjs'
  );
  process.exit(1);
}

// Build the listing: the fixture PHEV (see scripts/lib/curated-alert.mjs),
// with any ALERT_* env vars overriding individual fields. Validates against
// the data-contract conventions that have no DB constraint behind them.
let listing;
let defaultedFields;
try {
  const overrides = parseListingOverrides(process.env);
  ({ listing, defaultedFields } = buildListing(overrides));
  validateListing(listing);

  if (Object.keys(overrides).length > 0 && defaultedFields.length > 0) {
    console.warn(
      `Note: not overridden, still using the fixture's value: ${defaultedFields.join(', ')}.\n` +
        "If this is a real curated listing, double-check those are right for THIS car — " +
        "especially 'flags' (fixture default is ['PHEV']) and 'listing_url' (fixture default " +
        'is a fake example link).'
    );
  }
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// See docs/BETA_CHECKLIST.md section E for the full column-by-column contract.
const row = {
  user_id: TEST_USER_ID,
  // search_id is optional in the schema, but notify-alert requires it to send
  // the email, so include it when provided.
  ...(TEST_SEARCH_ID ? { search_id: TEST_SEARCH_ID } : {}),
  date: 'Today',
  ...listing,
  user_status: 'new',
};

const { data, error } = await supabase
  .from('alerts')
  .insert(row)
  .select('id')
  .single();

if (error) {
  console.error('Failed to insert test alert:', error.message);
  process.exit(1);
}

console.log(`Inserted test alert id: ${data.id}`);
console.log('Expected: realtime toast + Alertas unread badge increment in the app.');
console.log(
  TEST_SEARCH_ID
    ? 'Expected: notify-alert email IF the search is active and alert_channels.email = true.'
    : 'No TEST_SEARCH_ID provided — notify-alert will NOT send an email (it needs search_id). ' +
        'Pass TEST_SEARCH_ID to test the email path.'
);
