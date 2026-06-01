---
defract:
  version: 1
  generated_at: "2026-06-01T00:00:00Z"
  updated_at: "2026-06-01T00:00:00Z"
  source: extracted
---

# Project Profile

## Overview

**autoseek** is a Portuguese-language frontend SPA for automotive dealers to monitor European car marketplaces (Mobile.de, AutoScout24), configure margin-based search alerts, and estimate Portuguese ISV (vehicle import tax) for sourced vehicles. All data is currently mocked; there is no backend.

## Stack

- **Runtime**: Node.js (version unspecified)
- **Frontend**: React 18.3.1, Vite 5.4.10
- **Routing**: react-router-dom 7.14.0
- **Icons**: lucide-react 1.8.0
- **Styling**: Plain CSS with CSS custom properties (`src/styles/tokens.css`), no CSS framework
- **Testing**: None
- **Package manager**: npm (package-lock.json present)
- **CI/CD**: None

## Conventions

- JSX (not TSX) — no TypeScript; ESLint targets `*.{js,jsx}` — `eslint.config.js`
- Default exports for pages and components; named exports via barrel `index.js` in `components/ui/` and `components/forms/`
- Context API for cross-cutting state (auth, toasts) — no Redux or Zustand
- Inline style objects for per-component layout; shared design tokens via CSS custom properties — `src/styles/tokens.css`
- Portuguese UI copy throughout all pages and toast messages
- Auth is mocked: `AuthContext` starts authenticated (`useState(true)`) to allow UI development — `src/context/AuthContext.jsx:7`
- All domain data lives in `src/data/mock-data.js` (searches, alerts, user)

## File Structure

```
src/
├── App.jsx                  # Root: routing tree + context providers
├── main.jsx                 # Entry point
├── components/
│   ├── ui/                  # Badge, Button, Card, StatCard, Slider, Toggle, etc.
│   ├── layout/              # AppLayout, Sidebar
│   └── forms/               # FormField, CurrencyInput, PlatformCheckbox
├── context/
│   ├── AuthContext.jsx      # Mock auth context
│   └── ToastContext.jsx     # Toast notification context
├── data/
│   └── mock-data.js         # mockSearches, mockAlerts, mockUser
├── lib/
│   └── isv.js               # Portuguese ISV tax calculator (2026 approximation)
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Searches.jsx         # Main dashboard: active searches + stats
│   ├── CreateSearch.jsx     # Multi-step search configuration form
│   ├── AlertHistory.jsx     # Grouped alert feed with brand/margin filters
│   └── Settings.jsx
└── styles/
    ├── tokens.css           # CSS custom properties (colors, radii, shadows)
    ├── global.css           # Base reset + body font (Inter)
    └── components.css       # Shared component styles
```

## Key Dependencies

### Frontend
- `react@18.3.1` — UI library
- `react-dom@18.3.1` — DOM renderer
- `react-router-dom@7.14.0` — client-side routing
- `lucide-react@1.8.0` — icon set
- `vite@5.4.10` — dev server and bundler
- `@vitejs/plugin-react@4.3.3` — Babel-based Fast Refresh

## Build Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Project-Specific Notes

- The ISV calculator in `src/lib/isv.js` implements a 2026 Portuguese tax approximation covering engine displacement, CO2 emissions, vehicle age discounts, and PHEV exemptions. It is not yet wired to alert cards — `mockAlerts` uses hardcoded `isvEst` values instead.
- `AlertHistory.jsx` declares `filterBrand` and `filterMargin` state but does not apply them to the displayed alert list — filters are UI-only stubs.
- `App.jsx` has no catch-all route; unknown paths render nothing.
- No environment files, backend config, or credentials exist — the project is entirely client-side with no `.env` files to carry over into new worktrees.
- Repository: https://github.com/falucas90/TBN.git
