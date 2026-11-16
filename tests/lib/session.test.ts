// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { resolveSession, swapExercise, markDone, summary, loadSession, saveSession, toEntry } from '../../src/lib/session';
import type { AppState } from '../../src/lib/types';
import { catalog } from './catalog';

const state = (over: Partial<AppState> = {}): AppState => ({
  today: '2026-11-15',
  lastSession: { date: '2026-11-14', routine: 'B' },
  nextRoutine: 'A',
  exercises: catalog,
  history: { Banca: { lastDate: '2026-11-08', lastSets: [{ weight: 40, reps: 8, rir: 1 }], best1rm: 50 } },
  ...over,
});

beforeEach(() => localStorage.clear());

describe('resolveSession', () => {
  it('starts a new session with the next routine', () => {
    const s = resolveSession(null, state());
    expect(s.date).toBe('2026-11-15');
    expect(s.routine).toBe('A');
    expect(s.plan).toContain('Banca');
    expect(s.plan).not.toContain('Tras nuca');
    expect(s.done).toEqual([]);
  });
  it('keeps a stored session from today', () => {
    const stored = { ...resolveSession(null, state()), swaps: { x: 'y' } };
    expect(resolveSession(stored, state())).toBe(stored);
  });
  it('discards a stored session from another day', () => {
    const old = { ...resolveSession(null, state()), date: '2026-11-10' };
    expect(resolveSession(old, state())).not.toBe(old);
  });
  it('reuses the routine when already trained today', () => {
    const s = resolveSession(null, state({ lastSession: { date: '2026-11-15', routine: 'B' }, nextRoutine: 'A' }));
    expect(s.routine).toBe('B');
  });
});

describe('swap and done', () => {
  it('replaces a name in the plan', () => {
    const s = swapExercise(resolveSession(null, state()), 'Lateral polea', 'Lateral raises');
    expect(s.plan).toContain('Lateral raises');
    expect(s.plan).not.toContain('Lateral polea');
    expect(s.swaps).toEqual({ 'Lateral polea': 'Lateral raises' });
  });
  it('marks done, replacing a previous record of the same exercise', () => {
    let s = resolveSession(null, state());
    const sets = [{ weight: 42, reps: 8, rir: 1 }];
    s = markDone(s, 'Banca', sets, '', 50, 1000);
    s = markDone(s, 'Banca', sets, 'x', 50, 2000);
    expect(s.done).toHaveLength(1);
    expect(s.done[0]).toMatchObject({ name: 'Banca', note: 'x', at: 2000, prevBest: 50 });
  });
  it('builds an entry for the queue', () => {
    const s = resolveSession(null, state());
    expect(toEntry(s, 'Banca', [{ weight: 40, reps: 8, rir: 1 }], 'ok')).toEqual({
      date: '2026-11-15', routine: 'A', exercise: 'Banca', sets: [{ weight: 40, reps: 8, rir: 1 }], note: 'ok',
    });
  });
});

describe('summary', () => {
  it('counts exercises, sets and records', () => {
    let s = resolveSession(null, state());
    s = markDone(s, 'Banca', [{ weight: 42, reps: 8, rir: 1 }, { weight: 40, reps: 8, rir: 1 }], '', 50, 1);
    s = markDone(s, 'Pulldown', [{ weight: 5, reps: 8, rir: 1 }], '', undefined, 2);
    const r = summary(s);
    expect(r.exercises).toBe(2);
    expect(r.sets).toBe(3);
    expect(r.records).toHaveLength(1);
    expect(r.records[0]).toMatchObject({ name: 'Banca', delta: '+4.6' });
  });
});

describe('persistence', () => {
  it('round-trips through localStorage and tolerates garbage', () => {
    const s = resolveSession(null, state());
    saveSession(s);
    expect(loadSession()).toEqual(s);
    localStorage.setItem('gtracker.session', '{bad');
    expect(loadSession()).toBeNull();
  });
});
