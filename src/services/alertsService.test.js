import { describe, it, expect, beforeEach, vi } from 'vitest';

// updateAlertStatus mutates the mockAlerts objects in place, so reset modules
// and re-import before every test to get fresh mock data.
let service;
let mockAlerts;

beforeEach(async () => {
  vi.resetModules();
  service = await import('./alertsService');
  ({ mockAlerts } = await import('../data/mock-data'));
});

describe('getAlerts (mock mode)', () => {
  it('returns all mock alerts', async () => {
    const alerts = await service.getAlerts();
    expect(alerts).toHaveLength(mockAlerts.length);
    expect(alerts.map(a => a.id)).toEqual([101, 102]);
  });

  it('returns a copy: mutating the result array does not affect the store', async () => {
    const alerts = await service.getAlerts();
    alerts.length = 0;
    expect(await service.getAlerts()).toHaveLength(mockAlerts.length);
  });
});

describe('getAlertsBySearch (mock mode)', () => {
  it('returns only alerts for the given searchId', async () => {
    const alerts = await service.getAlertsBySearch(1);
    expect(alerts).toHaveLength(2);
    expect(alerts.every(a => a.searchId === 1)).toBe(true);
  });

  it('returns an empty array when no alerts match', async () => {
    expect(await service.getAlertsBySearch(999)).toEqual([]);
  });

  it('matches a string searchId against numeric ids (URL params arrive as strings)', async () => {
    const alerts = await service.getAlertsBySearch('1');
    expect(alerts).toHaveLength(2);
  });
});

describe('updateAlertStatus (mock mode)', () => {
  it('mutates the matching alert userStatus', async () => {
    await service.updateAlertStatus(101, 'contacted');
    const alerts = await service.getAlerts();
    expect(alerts.find(a => a.id === 101).userStatus).toBe('contacted');
    // other alerts untouched
    expect(alerts.find(a => a.id === 102).userStatus).toBe('new');
  });

  it('tolerates string ids', async () => {
    await service.updateAlertStatus('102', 'dismissed');
    const alerts = await service.getAlerts();
    expect(alerts.find(a => a.id === 102).userStatus).toBe('dismissed');
  });

  it('is a no-op for an unknown id', async () => {
    await service.updateAlertStatus(999, 'contacted');
    const alerts = await service.getAlerts();
    expect(alerts.every(a => a.userStatus === 'new')).toBe(true);
  });
});

describe('getAlertCountSince (mock mode)', () => {
  it('counts all alerts when the cutoff is in the distant past', async () => {
    expect(await service.getAlertCountSince('2000-01-01T00:00:00.000Z')).toBe(mockAlerts.length);
  });

  it('counts no alerts when the cutoff is in the future', async () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(await service.getAlertCountSince(future)).toBe(0);
  });

  it('excludes alerts older than the cutoff', async () => {
    // Cutoff 1 hour ago: only the alert created "now" qualifies,
    // the one created 24h ago does not.
    const cutoff = new Date(Date.now() - 3600000).toISOString();
    expect(await service.getAlertCountSince(cutoff)).toBe(1);
  });

  it('treats alerts with a missing createdAt as recent', async () => {
    mockAlerts.push({ id: 999, searchId: 2, userStatus: 'new' });
    const future = new Date(Date.now() + 86400000).toISOString();
    expect(await service.getAlertCountSince(future)).toBe(1);
  });
});
