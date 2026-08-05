import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AlertHistory from './AlertHistory';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

// AppLayout → useMediaQuery reads window.matchMedia, which jsdom doesn't
// implement; stub it desktop-sized like useMediaQuery.test.js does.
beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query) => ({
    media: query,
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })));
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// EVs are ISV-exempt in Portugal — calculateISV would otherwise tax them on
// the petrol table. Mirrors the IsvCalculator.jsx EV test's assertion style,
// but at the AlertHistory row level (alert.fuelType === 'Elétrico').
const evAlert = {
  id: 201,
  searchId: 1,
  userStatus: 'new',
  date: 'Today',
  createdAt: new Date().toISOString(),
  carTitle: '2023 Tesla Model 3',
  platform: 'Mobile.de',
  listingUrl: 'https://www.mobile.de',
  priceOriginal: 30000,
  cc: 0,
  co2: 0,
  fuelType: 'Elétrico',
  ageYears: 1,
  transportEst: 900,
  marketPrice: 35000,
  flags: [],
};

vi.mock('../services/alertsService', () => ({
  getAlerts: vi.fn(() => Promise.resolve([evAlert])),
}));

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/alerts']}>
      <AuthProvider>
        <ToastProvider>
          <AlertHistory />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('AlertHistory — EV ISV exemption', () => {
  it('produces isvPayable 0 for an Elétrico alert row (Landed PT === anúncio + transporte)', async () => {
    renderPage();
    expect(await screen.findByText('2023 Tesla Model 3')).toBeInTheDocument();

    // Landed PT = priceOriginal + isvPayable + transportEst.
    // With isvPayable correctly zeroed for EVs: 30000 + 0 + 900 = 30900.
    // Without the fix, calculateISV would tax cc=0/co2=0 on the petrol table
    // via its €100 cc floor, producing a non-zero, wrong Landed PT.
    // (locale grouping separator varies by ICU build, so match loosely)
    expect(screen.getByText(/€\s*30\D?900/)).toBeInTheDocument();
  });
});
