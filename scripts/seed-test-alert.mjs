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

import { createClient } from '@supabase/supabase-js';

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

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// A realistic PHEV alert. Units must match the data contract exactly
// (see docs/BETA_CHECKLIST.md section E):
//   - price_original, market_price, transport_est : whole euros (integer)
//   - cc   : engine displacement in cm3 (integer)
//   - co2  : WLTP emissions in g/km (integer)
//   - age_years : whole years since registration (integer)
//   - fuel_type : 'Diesel' switches the ISV CO2 table; anything else uses petrol
//   - flags : must include 'PHEV' for the browser ISV calc to apply the PHEV rule
//
// These numbers are chosen so the client-side margin (market_price minus
// price_original, ISV and transport) comes out positive.
const row = {
  user_id: TEST_USER_ID,
  // search_id is optional in the schema, but notify-alert requires it to send
  // the email, so include it when provided.
  ...(TEST_SEARCH_ID ? { search_id: TEST_SEARCH_ID } : {}),
  date: 'Today',
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
