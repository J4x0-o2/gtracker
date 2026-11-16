import { describe, it, expect } from 'vitest';
import { categoryOf, priorityOf } from '../../src/lib/categories';
import { routineExercises, suggestOrder, isBlocked, alternativesFor } from '../../src/lib/plan';
import { catalog, byName } from './catalog';

const names = (xs: { name: string }[]) => xs.map((x) => x.name);

describe('categories', () => {
  it('maps groups to categories', () => {
    expect(categoryOf('Bíceps')).toBe('Brazo');
    expect(categoryOf('Tríceps')).toBe('Brazo');
    for (const g of ['Piernas', 'Isquios', 'Glúteo', 'Pantorrilla', 'Cuádriceps']) expect(categoryOf(g)).toBe('Pierna');
    expect(categoryOf('Hombro')).toBe('Hombro');
    expect(categoryOf('Cuello')).toBe('Cuello');
  });
  it('gives priorities', () => {
    expect(priorityOf('Brazo')).toBe(1);
    expect(priorityOf('Pierna')).toBe(2);
    expect(priorityOf('Hombro')).toBe(3);
    expect(priorityOf('Abdomen')).toBe(3);
    expect(priorityOf('Pecho')).toBe(4);
    expect(priorityOf('Espalda')).toBe(4);
    expect(priorityOf('Cuello')).toBe(3);
  });
});

describe('plan', () => {
  it('routineExercises keeps A, B and A/B in sheet order', () => {
    const b = routineExercises(catalog, 'B');
    expect(names(b)).not.toContain('Lateral raises');
    expect(names(b)).not.toContain('Incline Smith');
    expect(names(b)).toContain('Abs machine');
    expect(names(b)[0]).toBe('Tras nuca');
  });

  it('suggests the expected order for B', () => {
    expect(names(suggestOrder(routineExercises(catalog, 'B'), []))).toEqual([
      'Tras nuca', 'Incline curl', 'Cuádriceps extension', 'Hamstring curl sentado',
      'Military press machine', 'Abductor', 'Abs machine', 'Pec deck', 'Remo T', 'Pullover',
    ]);
  });

  it('suggests the expected order for A', () => {
    expect(names(suggestOrder(routineExercises(catalog, 'A'), []))).toEqual([
      'Predicador curl uni', 'Tricep extension', 'Squat Smith', 'Hamstring curl sentado',
      'Lateral polea', 'Calves prensa', 'Hip thrust machine', 'Abs machine', 'Banca', 'Pulldown',
    ]);
  });

  it('falls back to priority order when every option would triple up', () => {
    const rem = [byName('Calves prensa'), byName('Hip thrust machine')];
    const done = [byName('Squat Smith'), byName('Hamstring curl sentado')];
    expect(names(suggestOrder(rem, done))).toEqual(['Calves prensa', 'Hip thrust machine']);
  });

  it('blocks a third consecutive item of the same category', () => {
    const done = [byName('Cuádriceps extension'), byName('Hamstring curl sentado')];
    const remaining = routineExercises(catalog, 'B').filter((e) => !done.includes(e));
    expect(isBlocked(byName('Abductor'), done, remaining)).toBe(true);
    expect(isBlocked(byName('Tras nuca'), done, remaining)).toBe(false);
  });

  it('does not block when every remaining item is blocked', () => {
    const done = [byName('Squat Smith'), byName('Hamstring curl sentado')];
    const remaining = [byName('Calves prensa'), byName('Hip thrust machine')];
    expect(isBlocked(byName('Calves prensa'), done, remaining)).toBe(false);
  });

  it('does not block with fewer than two done', () => {
    expect(isBlocked(byName('Abductor'), [byName('Squat Smith')], [byName('Abductor')])).toBe(false);
  });

  it('finds alternatives in the same category, excluding plan and inactive', () => {
    const plan = names(routineExercises(catalog, 'A'));
    const alts = alternativesFor(byName('Lateral polea'), catalog, plan);
    expect(names(alts)).toEqual(['Lateral raises', 'Military press machine']);
    expect(names(alternativesFor(byName('Banca'), catalog, plan))).not.toContain('Incline Smith');
  });
});
