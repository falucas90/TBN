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
