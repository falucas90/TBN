import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { waitFor } from '@testing-library/react';
import App from './App';

// QA-added coverage for fix-batch-1 item 2 (docs/specs/fix-batch-1.md,
// AC2.1-AC2.5): no test existed for the new DealerRoute guard, so this file
// independently verifies the route-guard behavior against the spec rather
// than trusting the self-report. Exercised through the full App tree (mock
// auth mode, no Supabase env) since DealerRoute/AdminRoute are not exported
// from App.jsx.
//
// Mock-mode auth (src/context/AuthContext.jsx) determines role from the
// email used to log in ('admin' in the email -> admin, else dealer) and
// persists the session to localStorage under 'crivo.mock.session'. Seeding
// that key before render lets us start the app already "logged in" as a
// given role without going through the login form.

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    media: query,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  window.history.pushState({}, '', '/');
});

function seedSession(role) {
  localStorage.setItem(
    'crivo.mock.session',
    JSON.stringify({ email: role === 'admin' ? 'admin@crivo.pt' : 'dealer@crivo.pt', role })
  );
}

const DEALER_ROUTES = ['/dashboard', '/searches', '/searches/new', '/alerts', '/isv', '/settings'];
const ADMIN_ROUTES = ['/admin', '/admin/stands', '/admin/billing', '/admin/logs', '/admin/feedback'];

describe('App routing — DealerRoute guard (AC2.1)', () => {
  it.each(DEALER_ROUTES)('redirects an authenticated admin away from %s to /admin', async (route) => {
    seedSession('admin');
    window.history.pushState({}, '', route);
    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/admin'));
  });
});

describe('App routing — non-admin dealer access unchanged (AC2.2)', () => {
  it.each(DEALER_ROUTES)('leaves a non-admin authenticated user on %s', async (route) => {
    seedSession('dealer');
    window.history.pushState({}, '', route);
    render(<App />);

    // Give the guard a tick to (not) redirect, then assert we're still here.
    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.pathname).toBe(route);
  });
});

describe('App routing — admin route access unchanged (AC2.3)', () => {
  it.each(ADMIN_ROUTES)('allows an authenticated admin on %s', async (route) => {
    seedSession('admin');
    window.history.pushState({}, '', route);
    render(<App />);

    await new Promise((r) => setTimeout(r, 0));
    expect(window.location.pathname).toBe(route);
  });

  it.each(ADMIN_ROUTES)('redirects a non-admin authenticated user away from %s to /dashboard', async (route) => {
    seedSession('dealer');
    window.history.pushState({}, '', route);
    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
  });
});

// AC2.4 (unauthenticated -> /login) is NOT covered here: this repo's mock
// auth mode (src/context/AuthContext.jsx, `supabaseConfigured === false`)
// always initializes `currentUser` via `loadMockSession()`, which falls back
// to a logged-in MOCK_USER regardless of localStorage state — there is no
// reachable "unauthenticated" state to render in mock mode. DealerRoute's
// `if (!isAuthenticated) return <Navigate to="/login" replace />` is
// structurally identical to the pre-existing, already-shipped ProtectedRoute
// and AdminRoute guards (unchanged by this fix), so AC2.4 is verified by
// code inspection/symmetry rather than an executable test here.
