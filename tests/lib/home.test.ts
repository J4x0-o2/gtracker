import { describe, it, expect } from 'vitest';
import { homeModel } from '../../src/lib/home';
import { markDone, resolveSession } from '../../src/lib/session';
import type { AppState, History, SetData } from '../../src/lib/types';
import { catalog } from './catalog';

const set = (weight = 10): SetData => ({ weight, reps: 8, rir: 1 });

// Routine B exercises logged on 2026-11-14: 9 exercises, 17 sets (8 x 2 + 1).
const lastB = ['Tras nuca', 'Incline curl', 'Cuádriceps extension', 'Hamstring curl sentado', 'Abductor',
  'Military press machine', 'Pec deck', 'Remo T', 'Pullover'];
const history: Record<string, History> = Object.fromEntries(
  lastB.map((n, i) => [n, {
    lastDate: '2026-11-14',
    lastSets: i === 8 ? [set()] : [set(), set()],
    best1rm: 50,
  }]),
);
history['Banca'] = { lastDate: '2026-11-08', lastSets: [set(40)], best1rm: 50 };
history['Predicador curl uni'] = { lastDate: '2026-11-08', lastSets: [{ weight: 12.5, reps: 7, rir: 0 }], best1rm: 20 };

const state: AppState = {
  today: '2026-11-16',
  lastSession: { date: '2026-11-14', routine: 'B' },
  nextRoutine: 'A',
  exercises: catalog,
  history,
};

describe('homeModel', () => {
  it('previews the routine with categories and the first four suggested exercises', () => {
    const m = homeModel(state, resolveSession(null, state));
    expect(m.routine).toBe('A');
    expect(m.total).toBe(10);
    expect(m.subtitle).toBe('10 ejercicios · Brazo y pierna primero');
    expect(m.first.map((f) => f.name)).toEqual(
      ['Predicador curl uni', 'Tricep extension', 'Squat Smith', 'Hamstring curl sentado']);
    expect(m.first[0]).toEqual({ i: 1, name: 'Predicador curl uni', last: '12.5 kg · 7-0', group: 'Brazo' });
    expect(m.first[1].last).toBe('Sin registros');
    expect(m.first[3].i).toBe(4);
    expect(m.moreCount).toBe(6);
  });

  it('uses a single category when the first two suggestions share it', () => {
    const s: AppState = { ...state, exercises: catalog.filter((e) => e.group !== 'Piernas' && e.group !== 'Isquios'
      && e.group !== 'Glúteo' && e.group !== 'Pantorrilla') };
    const m = homeModel(s, resolveSession(null, s));
    expect(m.subtitle).toBe('6 ejercicios · Brazo y hombro primero');
    const arms: AppState = { ...state, exercises: catalog.filter((e) => e.group === 'Bíceps' || e.group === 'Tríceps') };
    const a = homeModel(arms, resolveSession(null, arms));
    expect(a.subtitle).toBe('2 ejercicios · Brazo primero');
    expect(a.moreCount).toBe(0);
  });

  it('computes the last session exercises and sets from history', () => {
    const m = homeModel(state, resolveSession(null, state));
    expect(m.lastSession).toEqual({
      title: 'Último entreno · Rutina B',
      subtitle: 'Sábado 14 nov · 9 ejercicios · 17 series',
    });
  });

  it('hides the last session card when there is none', () => {
    const s: AppState = { ...state, lastSession: null };
    expect(homeModel(s, resolveSession(null, s)).lastSession).toBeNull();
  });

  it('offers Empezar when nothing is done and Continuar with progress otherwise', () => {
    const fresh = resolveSession(null, state);
    expect(homeModel(state, fresh).cta).toEqual({ label: 'Empezar entreno', continuing: false });
    const started = markDone(markDone(fresh, 'Predicador curl uni', [set()], '', undefined),
      'Tricep extension', [set()], '', undefined);
    const m = homeModel(state, started);
    expect(m.cta).toEqual({ label: 'Continuar entreno · 2/10', continuing: true });
    // Preview only lists what is left, following the same ordering rule.
    expect(m.first[0].name).toBe('Squat Smith');
    expect(m.moreCount).toBe(4);
    expect(m.total).toBe(10);
  });

  it('keeps the last session card when it was today', () => {
    const s: AppState = { ...state, today: '2026-11-14', lastSession: { date: '2026-11-14', routine: 'B' } };
    const m = homeModel(s, resolveSession(null, s));
    expect(m.lastSession?.title).toBe('Último entreno · Rutina B');
  });
});
