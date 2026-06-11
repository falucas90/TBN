# Crivo

Sourcing intelligence for Portuguese car dealers. Crivo monitors European car marketplaces (Mobile.de, AutoScout24, and others), fires margin-based alerts on matching listings, and estimates the Portuguese ISV import tax so dealers can see real landed cost and margin before buying.

UI copy is in European Portuguese.

## Stack

- **Frontend:** React 18 + Vite (plain JSX, no TypeScript)
- **Routing:** react-router-dom 7
- **Backend:** Supabase (Postgres + RLS, Auth, Edge Functions)
- **Styling:** plain CSS with design tokens (`src/styles/tokens.css`)
- **Tests:** Vitest

## Getting started

```bash
npm install
npm run dev
```

With no environment variables set, the app runs in **mock mode**: auth is bypassed and data comes from `src/data/mock-data.js`. This is the zero-setup path for UI development.

To run against Supabase, copy the example env file and fill in your project's values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (CI fails on any error) |
| `npm test` | Vitest run (ISV calculator unit tests) |

## Supabase setup

1. Apply the SQL migrations in `supabase/migrations/` **in order** (SQL Editor or `supabase db push`).
2. Deploy the edge functions (both require the service-role key, available to functions by default):
   ```bash
   supabase functions deploy update-user-role
   supabase functions deploy delete-account
   ```
3. To grant a user admin access, set `{"role": "admin"}` in their `app_metadata` (Dashboard → Authentication → Users). The Admin panel and audit log are only visible to admins.

### Notifications

Two edge functions deliver email notifications (via [Resend](https://resend.com)): `notify-alert` sends an instant email when an alert row is inserted, and `daily-summary` sends a per-user digest of the last 24 hours.

1. Deploy with `--no-verify-jwt` — the callers are a Database Webhook and a cron job, not logged-in users; auth is the shared `x-webhook-secret` header instead:
   ```bash
   supabase functions deploy notify-alert --no-verify-jwt
   supabase functions deploy daily-summary --no-verify-jwt
   ```
2. Set the required secrets:
   ```bash
   supabase secrets set WEBHOOK_SECRET=<random-string> RESEND_API_KEY=<resend-key> ALERT_FROM_EMAIL=alertas@crivo.pt
   ```
   `ALERT_FROM_EMAIL` is optional (defaults to `alertas@crivo.pt`). Without `RESEND_API_KEY` the functions log the composed email and return `{ "sent": false }` — safe to deploy before keys exist.
3. Create the Database Webhook for instant alerts (Dashboard → Database → Webhooks → Create):
   - Table: `alerts`, event: **INSERT**
   - Type: HTTP request, method **POST**, URL: `https://<PROJECT-REF>.supabase.co/functions/v1/notify-alert`
   - Add a custom HTTP header `x-webhook-secret` with the same value as the `WEBHOOK_SECRET` secret.
4. Schedule the daily digest at 08:00 Europe/Lisbon with pg_cron + pg_net (pg_cron runs in UTC — Lisbon is UTC+0 in winter, UTC+1 in summer):
   ```sql
   create extension if not exists pg_cron;
   create extension if not exists pg_net;

   select cron.schedule(
     'crivo-daily-summary',
     '0 8 * * *', -- 08:00 UTC; use '0 7 * * *' for 08:00 Lisbon during summer time
     $$
     select net.http_post(
       url     := 'https://<PROJECT-REF>.supabase.co/functions/v1/daily-summary',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'x-webhook-secret', '<WEBHOOK-SECRET>'
       ),
       body    := '{}'::jsonb
     );
     $$
   );
   ```
   The same snippet lives (commented out, with instructions) in `supabase/migrations/006_notification_cron.sql`.

WhatsApp delivery is not implemented yet — it requires WhatsApp Business API credentials (see the TODO in `supabase/functions/notify-alert/index.ts`).

Before launching the closed beta, follow the step-by-step provisioning and end-to-end smoke runbook in [`docs/BETA_CHECKLIST.md`](docs/BETA_CHECKLIST.md).

## Error monitoring

Error monitoring with [Sentry](https://sentry.io) is optional and disabled by default. Set `VITE_SENTRY_DSN` in `.env` to your project's DSN to enable it — uncaught render errors caught by the error boundary are then reported with the current build mode as the environment. When the variable is unset, Sentry is never initialized and the app behaves exactly as before.

## Deployment

The app is a static SPA (Vite → `dist/`) and deploys to any static host. Config for the two common targets is committed: `vercel.json` and `netlify.toml` (plus `public/_redirects` as a fallback).

### Build environment variables

Set these on the host so the production build talks to your Supabase project (without them the build still succeeds but ships in mock mode):

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | yes | Supabase anon/public key |
| `VITE_SENTRY_DSN` | optional | Sentry DSN to enable [error monitoring](#error-monitoring) |

### Vercel

Import the repo, pick the **Vite** framework preset (or "Other"), leave build command `npm run build` and output directory `dist` — both are also pinned in `vercel.json`. Add the env vars above under Settings → Environment Variables, then deploy. The `rewrites` rule in `vercel.json` sends every path to `/index.html`; Vercel serves existing static files (including `/assets/*`) before applying rewrites, so the catch-all does not shadow real assets.

### Netlify

Import the repo; build command `npm run build` and publish directory `dist` come from `netlify.toml`. Set framework to "Vite" or "Other", add the env vars above under Site settings → Environment variables, then deploy. The `/* → /index.html` redirect (in both `netlify.toml` and `public/_redirects`) provides the SPA fallback.

### Before first deploy

The frontend is useless without its backend. Complete the [Supabase setup](#supabase-setup) first:

1. Apply migrations `001`–`006` from `supabase/migrations/` **in order**.
2. Deploy the 4 edge functions: `update-user-role` and `delete-account` (default JWT verification), and `notify-alert` and `daily-summary` with `--no-verify-jwt` (see [Notifications](#notifications)).
3. Set the function secrets (`WEBHOOK_SECRET`, `RESEND_API_KEY`, optional `ALERT_FROM_EMAIL`) and wire up the Database Webhook and daily-summary cron job.
4. Set the build env vars above on the host.

### SPA routing

The app uses `BrowserRouter` with real paths (`/searches`, `/alerts`, `/isv`, …). Deep links and refreshes only work because the host rewrites unknown paths to `/index.html` — the `rewrites`/`redirects` rules above. Removing them brings back 404s on direct navigation to client routes.

## Project structure

```
src/
├── App.jsx                # Routes + providers (auth, toasts, error boundary)
├── components/
│   ├── ui/                # Buttons, cards, badges, primitives
│   ├── layout/            # AppLayout, Sidebar
│   └── forms/             # FormField, CurrencyInput
├── context/               # AuthContext, ToastContext
├── lib/
│   ├── isv.js             # Portuguese ISV import-tax calculator (+ tests)
│   ├── supabase.js        # Client init; exports `supabaseConfigured`
│   └── mappers.js         # snake_case DB rows → camelCase objects
├── services/              # searches / alerts / profiles / auth (Supabase or mock)
├── pages/                 # Login, Signup, Searches, CreateSearch, AlertHistory, Settings, Admin…
└── data/mock-data.js      # Mock-mode fixtures
supabase/
├── migrations/            # Schema, RLS policies, audit log
└── functions/             # Edge functions (admin ops, account deletion)
```

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, tests, and build on every push to `main` and on every pull request.
