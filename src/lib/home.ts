import { categoryOfExercise } from './categories';
import { formatDateEs, formatLast } from './format';
import { suggestOrder } from './plan';
import type { Session } from './session';
import type { AppState, Exercise } from './types';

export const PREVIEW_COUNT = 4;

export interface HomeModel {
  routine: string;
  total: number;
  subtitle: string;
  first: { i: number; name: string; last: string; group: string }[];
  moreCount: number;
  lastSession: { title: string; subtitle: string } | null;
  cta: { label: string; continuing: boolean };
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

/** "Brazo y pierna primero": the first two distinct categories of the suggested order. */
function leadingCategories(ordered: Exercise[]): string {
  const cats = [...new Set(ordered.map(categoryOfExercise))].slice(0, 2);
  if (!cats.length) return '';
  return `${capitalize(cats.join(' y '))} primero`;
}

function lastSessionCard(state: AppState) {
  const last = state.lastSession;
  if (!last) return null;
  const logged = Object.values(state.history).filter((h) => h.lastDate === last.date);
  const sets = logged.reduce((n, h) => n + h.lastSets.length, 0);
  return {
    title: `Último entreno · Rutina ${last.routine}`,
    subtitle: `${formatDateEs(last.date)} · ${logged.length} ejercicios · ${sets} series`,
  };
}

export function homeModel(state: AppState, session: Session): HomeModel {
  const byName = new Map(state.exercises.map((e) => [e.name, e]));
  const planItems = session.plan.map((n) => byName.get(n)).filter((e): e is Exercise => !!e);
  const doneNames = session.done.map((d) => d.name);
  const doneItems = doneNames.map((n) => byName.get(n)).filter((e): e is Exercise => !!e);
  const remaining = planItems.filter((e) => !doneNames.includes(e.name));
  const ordered = suggestOrder(remaining, doneItems);
  const total = planItems.length;
  const done = doneNames.length;

  const subtitle = [`${total} ejercicios`, leadingCategories(ordered)].filter(Boolean).join(' · ');

  return {
    routine: session.routine,
    total,
    subtitle,
    first: ordered.slice(0, PREVIEW_COUNT).map((e, i) => ({
      i: i + 1,
      name: e.name,
      last: formatLast(state.history[e.name]?.lastSets, e.unit),
      group: categoryOfExercise(e),
    })),
    moreCount: Math.max(0, ordered.length - PREVIEW_COUNT),
    lastSession: lastSessionCard(state),
    cta: done > 0
      ? { label: `Continuar entreno · ${done}/${total}`, continuing: true }
      : { label: 'Empezar entreno', continuing: false },
  };
}
