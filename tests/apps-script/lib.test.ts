import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const lib = require('../../apps-script/lib.js');

// [date, routine, exercise, serie, weight, unit, reps, rir, orm, note]
const registro = [
  [new Date(2026, 10, 12), 'A', 'Predicador curl uni', 1, 10, 'kg', 8, 1, 13, ''],
  [new Date(2026, 10, 12), 'A', 'Predicador curl uni', 2, 10, 'kg', 7, 1, 13, ''],
  ['2026-11-14', 'B', 'Tras nuca', 1, 3, 'placas', 8, 1, 4, ''],
  ['2026-11-14', 'B', 'Tras nuca', 2, 2, 'placas', 9, 0, 3, 'cómodo'],
  ['2026-11-07', 'B', 'Tras nuca', 1, 3, 'placas', 10, 1, 4.4, ''],
  ['', '', '', '', '', '', '', '', '', ''],
  ['2026-11-14', 'B', 'Incline curl', 1, 15, 'kg', 7, 2, 19.5, ''],
];
const catalog = [
  ['Predicador curl uni', 'Bíceps', 'kg', 'A'],
  ['Tras nuca', 'Tríceps', 'placas', 'B'],
  ['Incline curl', 'Bíceps', 'kg', 'B'],
  ['', '', '', ''],
  ['Ignored after empty', 'X', 'kg', 'A'],
];

describe('computeState', () => {
  const s = lib.computeState(registro, catalog, '2026-11-15');
  it('finds last session and next routine', () => {
    expect(s.today).toBe('2026-11-15');
    expect(s.lastSession).toEqual({ date: '2026-11-14', routine: 'B' });
    expect(s.nextRoutine).toBe('A');
  });
  it('defaults to A with no data', () => {
    const e = lib.computeState([], catalog, '2026-11-15');
    expect(e.lastSession).toBeNull();
    expect(e.nextRoutine).toBe('A');
  });
  it('lists exercises in sheet order, stopping at first empty name', () => {
    expect(s.exercises.map((e: any) => e.name)).toEqual(['Predicador curl uni', 'Tras nuca', 'Incline curl']);
    expect(s.exercises[1]).toEqual({ name: 'Tras nuca', group: 'Tríceps', unit: 'placas', routine: 'B', order: 1 });
  });
  it('keeps all sets of the most recent date in row order', () => {
    expect(s.history['Tras nuca'].lastDate).toBe('2026-11-14');
    expect(s.history['Tras nuca'].lastSets).toEqual([
      { weight: 3, reps: 8, rir: 1 },
      { weight: 2, reps: 9, rir: 0 },
    ]);
  });
  it('computes best 1RM over all rows', () => {
    expect(s.history['Tras nuca'].best1rm).toBe(4.4);
    expect(s.history['Predicador curl uni'].lastDate).toBe('2026-11-12');
  });
  it('ties on max date go to the later row', () => {
    const r = [['2026-11-14', 'A', 'X', 1, 1, 'kg', 1, 0, 1, ''], ['2026-11-14', 'B', 'Y', 1, 1, 'kg', 1, 0, 1, '']];
    expect(lib.computeState(r, [], '2026-11-15').lastSession.routine).toBe('B');
  });
});

describe('dates', () => {
  it('parses iso dates', () => {
    expect(lib.parseIsoDate('2026-11-05')).toEqual({ y: 2026, m: 11, d: 5 });
    expect(() => lib.parseIsoDate('05/11/2026')).toThrow();
  });
  it('normalizes Date and string', () => {
    expect(lib.toIsoDate(new Date(2026, 0, 9))).toBe('2026-01-09');
    expect(lib.toIsoDate('2026-01-09')).toBe('2026-01-09');
  });
});

describe('entryToRows', () => {
  const entry = {
    id: 'a', date: '2026-11-15', routine: 'A', exercise: 'Banca', note: 'ok',
    sets: [{ weight: 40, reps: 8, rir: 1 }, { weight: 40.5, reps: 7, rir: 0 }],
  };
  it('builds rows with null formula columns and note only on first', () => {
    expect(lib.entryToRows(entry)).toEqual([
      ['2026-11-15', 'A', 'Banca', null, 40, null, 8, 1, null, 'ok'],
      ['2026-11-15', 'A', 'Banca', null, 40.5, null, 7, 0, null, ''],
    ]);
  });
  const bad = (patch: any, msg: RegExp) =>
    expect(() => lib.entryToRows({ ...entry, ...patch })).toThrow(msg);
  it('validates input', () => {
    bad({ exercise: ' ' }, /exercise/);
    bad({ sets: [] }, /sets/);
    bad({ sets: Array(4).fill(entry.sets[0]) }, /sets/);
    bad({ sets: [{ weight: 0, reps: 8, rir: 1 }] }, /weight/);
    bad({ sets: [{ weight: 10, reps: 1.5, rir: 1 }] }, /reps/);
    bad({ sets: [{ weight: 10, reps: 0, rir: 1 }] }, /reps/);
    bad({ sets: [{ weight: 10, reps: 5, rir: 11 }] }, /rir/);
    bad({ routine: 'C' }, /routine/);
    bad({ date: '15-11-2026' }, /date/);
  });
});
