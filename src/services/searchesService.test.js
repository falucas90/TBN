import { describe, it, expect, beforeEach, vi } from 'vitest';

// The service keeps a module-level mutable mockStore seeded from mock-data,
// so reset modules and re-import before every test to get a fresh store.
let service;
let mockSearches;

beforeEach(async () => {
  vi.resetModules();
  service = await import('./searchesService');
  ({ mockSearches } = await import('../data/mock-data'));
});

describe('getSearches (mock mode)', () => {
  it('returns the seeded mock searches', async () => {
    const rows = await service.getSearches();
    expect(rows).toHaveLength(mockSearches.length);
    expect(rows[0].title).toBe('BMW 320e Station Wagons');
  });

  it('returns a copy: mutating the result does not affect the store', async () => {
    const rows = await service.getSearches();
    rows.pop();
    const again = await service.getSearches();
    expect(again).toHaveLength(mockSearches.length);
  });
});

describe('getSearchById (mock mode)', () => {
  it('finds a search by numeric id', async () => {
    const s = await service.getSearchById(1);
    expect(s?.title).toBe('BMW 320e Station Wagons');
  });

  it('coerces string ids when comparing', async () => {
    const s = await service.getSearchById('2');
    expect(s?.title).toBe('Renault Megane Diesel');
  });

  it('returns null for a missing id', async () => {
    expect(await service.getSearchById(999)).toBeNull();
  });
});

describe('createSearch (mock mode)', () => {
  it('assigns an id and appends to the store', async () => {
    const created = await service.createSearch({ title: 'Audi A4', status: 'active' });
    expect(created.id).toEqual(expect.any(Number));
    expect(created.title).toBe('Audi A4');

    const rows = await service.getSearches();
    expect(rows).toHaveLength(mockSearches.length + 1);
    expect(rows.at(-1)).toEqual(created);
  });

  it('makes the created search retrievable by id', async () => {
    const created = await service.createSearch({ title: 'Tesla Model 3' });
    const found = await service.getSearchById(created.id);
    expect(found).toEqual(created);
  });
});

describe('updateSearch (mock mode)', () => {
  it('merges the patch into the existing row and returns it', async () => {
    const updated = await service.updateSearch(1, { status: 'paused', minMargin: 4000 });
    expect(updated.status).toBe('paused');
    expect(updated.minMargin).toBe(4000);
    // untouched fields preserved
    expect(updated.title).toBe('BMW 320e Station Wagons');

    const fetched = await service.getSearchById(1);
    expect(fetched.status).toBe('paused');
  });

  it('is string/number id tolerant', async () => {
    const updated = await service.updateSearch('1', { title: 'Renamed' });
    expect(updated.title).toBe('Renamed');
  });

  it('returns null and leaves the store untouched for a missing id', async () => {
    const result = await service.updateSearch(999, { title: 'Ghost' });
    expect(result).toBeNull();
    expect(await service.getSearches()).toHaveLength(mockSearches.length);
  });
});

describe('deleteSearch (mock mode)', () => {
  it('removes the matching row', async () => {
    await service.deleteSearch(1);
    expect(await service.getSearches()).toHaveLength(mockSearches.length - 1);
    expect(await service.getSearchById(1)).toBeNull();
  });

  it('tolerates string ids', async () => {
    await service.deleteSearch('2');
    expect(await service.getSearchById(2)).toBeNull();
  });

  it('is a no-op for a missing id', async () => {
    await service.deleteSearch(999);
    expect(await service.getSearches()).toHaveLength(mockSearches.length);
  });
});
