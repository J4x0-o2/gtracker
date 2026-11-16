import { describe, it, expect } from 'vitest';
import { formatLast, formatDateEs, formatTime, suggestedAfter } from '../../src/lib/format';

describe('format', () => {
  it('formats the last mark line', () => {
    expect(formatLast([{ weight: 18, reps: 9, rir: 1 }, { weight: 18, reps: 7, rir: 1 }], 'placas')).toBe('18 placas · 9-1, 7-1');
    expect(formatLast([{ weight: 45, reps: 8, rir: 1 }, { weight: 50, reps: 7, rir: 0 }], 'kg')).toBe('45–50 kg · 8-1, 7-0');
    expect(formatLast([{ weight: 12.5, reps: 8, rir: 2 }], 'kg')).toBe('12.5 kg · 8-2');
    expect(formatLast([], 'kg')).toBe('Sin registros');
    expect(formatLast(undefined, 'kg')).toBe('Sin registros');
  });

  it('formats Spanish dates', () => {
    expect(formatDateEs('2026-11-15')).toBe('Domingo 15 nov');
    expect(formatDateEs('2026-11-12')).toBe('Jueves 12 nov');
  });

  it('formats a time as HH:MM', () => {
    expect(formatTime(new Date(2026, 10, 15, 9, 5).getTime())).toBe('09:05');
  });

  it('suggests the opposite routine', () => {
    expect(suggestedAfter('A')).toBe('B');
    expect(suggestedAfter('B')).toBe('A');
  });
});
