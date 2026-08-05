import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Callout.jsx reads --color-danger-bg / --color-info-bg / --color-info-text /
// --color-warn-bg / --color-warn-text directly as inline style values. Before
// this fix only --color-danger-text existed, so danger/info/warn Callouts
// rendered with `undefined` backgrounds (no visible tint). This asserts the
// token source defines the pairs Callout.jsx depends on, following the
// existing tint-pair convention (e.g. --color-success-bg: var(--emerald-12)).
const css = readFileSync(path.resolve(dirname, './tokens.css'), 'utf-8');

function tokenValue(name) {
  const m = css.match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : undefined;
}

describe('tokens.css — Callout tint pairs', () => {
  it('defines --color-danger-bg as the coral tint', () => {
    expect(tokenValue('color-danger-bg')).toBe('var(--coral-12)');
  });

  it('does not touch the existing --color-danger-text legacy alias', () => {
    expect(tokenValue('color-danger-text')).toBe('var(--coral)');
  });

  it('defines --color-warn-bg / --color-warn-text as the amber pair', () => {
    expect(tokenValue('color-warn-bg')).toBe('var(--amber-12)');
    expect(tokenValue('color-warn-text')).toBe('var(--amber)');
  });

  it('defines --color-info-bg / --color-info-text reusing the emerald/success signal', () => {
    expect(tokenValue('color-info-bg')).toBe('var(--emerald-12)');
    expect(tokenValue('color-info-text')).toBe('var(--emerald)');
  });

  it('leaves the existing success pair unchanged', () => {
    expect(tokenValue('color-success-bg')).toBe('var(--emerald-12)');
    expect(tokenValue('color-success-text')).toBe('var(--emerald)');
  });
});
