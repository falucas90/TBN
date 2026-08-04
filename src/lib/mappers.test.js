import { describe, it, expect } from 'vitest';
import { mapSearch, mapAlert, mapProfile, mapCompany } from './mappers';

describe('mapSearch', () => {
  const row = {
    id: 7,
    title: 'BMW 320e',
    status: 'active',
    criteria: { brand: 'BMW' },
    sources: ['Mobile.de'],
    min_margin: 2000,
    alert_threshold: 1500,
    alert_channels: { whatsapp: false, email: true },
    daily_summary: true,
    matches_today: 4,
    avg_margin: 3200,
    created_at: '2026-01-01T00:00:00Z',
  };

  it('maps snake_case columns to camelCase fields', () => {
    const s = mapSearch(row);
    expect(s).toEqual({
      id: 7,
      title: 'BMW 320e',
      status: 'active',
      criteria: { brand: 'BMW' },
      sources: ['Mobile.de'],
      minMargin: 2000,
      alertThreshold: 1500,
      alertChannels: { whatsapp: false, email: true },
      dailySummary: true,
      matchesToday: 4,
      avgMargin: 3200,
      createdAt: '2026-01-01T00:00:00Z',
    });
  });

  it('defaults criteria to {} and sources to [] when null', () => {
    const s = mapSearch({ id: 1, criteria: null, sources: null });
    expect(s.criteria).toEqual({});
    expect(s.sources).toEqual([]);
  });

  it('defaults alertChannels to whatsapp off / email on when missing', () => {
    const s = mapSearch({ id: 1 });
    expect(s.alertChannels).toEqual({ whatsapp: false, email: true });
  });

  it('keeps an explicitly empty alertChannels object', () => {
    expect(mapSearch({ id: 1, alert_channels: {} }).alertChannels).toEqual({});
  });
});

describe('mapAlert', () => {
  const row = {
    id: 101,
    search_id: 1,
    date: 'Today',
    car_title: '2021 BMW 320e Touring',
    platform: 'Mobile.de',
    listing_url: 'https://www.mobile.de/x',
    price_original: 26500,
    cc: 1998,
    co2: 43,
    fuel_type: 'Petrol',
    age_years: 5,
    transport_est: 800,
    market_price: 33000,
    flags: ['PHEV'],
    user_status: 'contacted',
    created_at: '2026-02-02T10:00:00Z',
  };

  it('maps snake_case columns to camelCase fields', () => {
    const a = mapAlert(row);
    expect(a).toEqual({
      id: 101,
      searchId: 1,
      date: 'Today',
      carTitle: '2021 BMW 320e Touring',
      platform: 'Mobile.de',
      listingUrl: 'https://www.mobile.de/x',
      priceOriginal: 26500,
      cc: 1998,
      co2: 43,
      fuelType: 'Petrol',
      ageYears: 5,
      transportEst: 800,
      marketPrice: 33000,
      flags: ['PHEV'],
      userStatus: 'contacted',
      createdAt: '2026-02-02T10:00:00Z',
    });
  });

  it('defaults flags to [] when null', () => {
    expect(mapAlert({ id: 1, flags: null }).flags).toEqual([]);
  });

  it("defaults userStatus to 'new' when missing", () => {
    expect(mapAlert({ id: 1 }).userStatus).toBe('new');
  });

  it('keeps an explicit non-new userStatus', () => {
    expect(mapAlert({ id: 1, user_status: 'dismissed' }).userStatus).toBe('dismissed');
  });
});

describe('mapProfile', () => {
  it('maps snake_case columns to camelCase fields', () => {
    const p = mapProfile({
      id: 'uuid-1',
      full_name: 'Maria Silva',
      phone: '+351912345678',
      notif_channel: 'whatsapp',
      company_id: 'company-1',
      company_role: 'owner',
    });
    expect(p).toEqual({
      id: 'uuid-1',
      fullName: 'Maria Silva',
      phone: '+351912345678',
      notifChannel: 'whatsapp',
      companyId: 'company-1',
      companyRole: 'owner',
    });
  });

  it('passes through undefined for missing columns without defaults', () => {
    const p = mapProfile({ id: 'uuid-2' });
    expect(p.id).toBe('uuid-2');
    expect(p.fullName).toBeUndefined();
    expect(p.notifChannel).toBeUndefined();
  });
});

describe('mapCompany', () => {
  it('maps snake_case columns to camelCase fields', () => {
    const c = mapCompany({
      id: 'company-1',
      name: 'Stand Lisboa',
      nif: '123456789',
      status: 'active',
      default_transport_cost: 750,
      min_margin: 1800,
    });
    expect(c).toEqual({
      id: 'company-1',
      name: 'Stand Lisboa',
      nif: '123456789',
      status: 'active',
      defaultTransportCost: 750,
      minMargin: 1800,
    });
  });
});
