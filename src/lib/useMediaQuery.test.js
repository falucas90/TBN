import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMediaQuery } from './useMediaQuery';

function createMatchMediaMock(initialMatches) {
  const listeners = new Set();
  const mqls = [];
  const state = { matches: initialMatches };
  const matchMedia = vi.fn((query) => {
    const mql = {
      media: query,
      get matches() { return state.matches; },
      addEventListener: vi.fn((type, cb) => { if (type === 'change') listeners.add(cb); }),
      removeEventListener: vi.fn((type, cb) => { listeners.delete(cb); }),
    };
    mqls.push(mql);
    return mql;
  });
  const setMatches = (matches) => { state.matches = matches; };
  const dispatchChange = (matches) => {
    state.matches = matches;
    listeners.forEach(cb => cb({ matches }));
  };
  return { matchMedia, setMatches, dispatchChange, listeners, mqls };
}

describe('useMediaQuery', () => {
  let mock;

  beforeEach(() => {
    mock = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', mock.matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the initial matchMedia result', () => {
    mock = createMatchMediaMock(true);
    vi.stubGlobal('matchMedia', mock.matchMedia);
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(true);
    expect(mock.matchMedia).toHaveBeenCalledWith('(max-width: 768px)');
  });

  it('returns false when the query does not match initially', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('subscribes to change events and updates when they fire', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(mock.listeners.size).toBe(1);

    act(() => mock.dispatchChange(true));
    expect(result.current).toBe(true);

    act(() => mock.dispatchChange(false));
    expect(result.current).toBe(false);
  });

  it('removes the change listener on unmount', () => {
    const { unmount } = renderHook(() => useMediaQuery('(max-width: 768px)'));
    expect(mock.listeners.size).toBe(1);

    unmount();
    expect(mock.listeners.size).toBe(0);
    const effectMql = mock.mqls.at(-1);
    expect(effectMql.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('re-subscribes when the query changes', () => {
    const { result, rerender } = renderHook(({ q }) => useMediaQuery(q), {
      initialProps: { q: '(max-width: 768px)' },
    });
    expect(result.current).toBe(false);

    // New query matches immediately: the effect re-reads mql.matches on setup.
    mock.setMatches(true);
    rerender({ q: '(min-width: 1024px)' });
    expect(mock.matchMedia).toHaveBeenLastCalledWith('(min-width: 1024px)');
    expect(result.current).toBe(true);
  });
});
