import { describe, it, expect } from 'vitest';
import { parseWeight, parseSet, estimate1rm, isRecord } from '../../src/lib/sets';

describe('sets', () => {
  it('parses decimal comma and dot', () => {
    expect(parseWeight('12,5')).toBe(12.5);
    expect(parseWeight('12.5')).toBe(12.5);
    expect(parseWeight(' 40 ')).toBe(40);
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('abc')).toBeNull();
    expect(parseWeight('1,2,3')).toBeNull();
  });

  it('validates a set row', () => {
    expect(parseSet({ weight: '12,5', reps: '8', rir: '1' })).toEqual({ ok: true, set: { weight: 12.5, reps: 8, rir: 1 } });
    expect(parseSet({ weight: '0', reps: '8', rir: '1' }).ok).toBe(false);
    expect(parseSet({ weight: '10', reps: '0', rir: '1' }).ok).toBe(false);
    expect(parseSet({ weight: '10', reps: '8.5', rir: '1' }).ok).toBe(false);
    expect(parseSet({ weight: '10', reps: '8', rir: '' }).ok).toBe(false);
    expect(parseSet({ weight: '10', reps: '8', rir: '11' }).ok).toBe(false);
    expect(parseSet({ weight: '10', reps: '8', rir: '0' }).ok).toBe(true);
  });

  it('estimates 1RM rounded to one decimal', () => {
    expect(estimate1rm(15, 7, 2)).toBe(19.5);
    expect(estimate1rm(10, 8, 1)).toBe(13);
    expect(estimate1rm(3, 8, 1)).toBe(3.9);
  });

  it('detects records only against a known best', () => {
    const sets = [{ weight: 10, reps: 8, rir: 1 }];
    expect(isRecord(sets, 12)).toBe(true);
    expect(isRecord(sets, 13)).toBe(false);
    expect(isRecord(sets, 0)).toBe(false);
    expect(isRecord(sets, undefined)).toBe(false);
  });
});
