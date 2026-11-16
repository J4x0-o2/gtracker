import { categoryOfExercise, priorityOf } from './categories';
import type { Exercise } from './types';

export const MAX_IN_ROW = 2;

export function routineExercises(exercises: Exercise[], routine: string): Exercise[] {
  return exercises
    .filter((e) => e.routine === routine || e.routine === 'A/B')
    .sort((a, b) => a.order - b.order);
}

const rank = (a: Exercise, b: Exercise) =>
  priorityOf(categoryOfExercise(a)) - priorityOf(categoryOfExercise(b)) || a.order - b.order;

/** True when the last two done items share the category of `item`. */
function triples(item: Exercise, sequence: Exercise[]): boolean {
  if (sequence.length < MAX_IN_ROW) return false;
  const cat = categoryOfExercise(item);
  return sequence.slice(-MAX_IN_ROW).every((s) => categoryOfExercise(s) === cat);
}

export function suggestOrder(remaining: Exercise[], doneSequence: Exercise[]): Exercise[] {
  const pool = [...remaining].sort(rank);
  const seq = [...doneSequence];
  const out: Exercise[] = [];
  while (pool.length) {
    const i = Math.max(0, pool.findIndex((e) => !triples(e, seq)));
    const [pick] = pool.splice(i, 1);
    out.push(pick);
    seq.push(pick);
  }
  return out;
}

export function isBlocked(item: Exercise, doneSequence: Exercise[], remaining: Exercise[]): boolean {
  if (!triples(item, doneSequence)) return false;
  return !remaining.every((e) => triples(e, doneSequence));
}

export function alternativesFor(item: Exercise, exercises: Exercise[], planNames: string[]): Exercise[] {
  const cat = categoryOfExercise(item);
  return exercises
    .filter((e) => e.routine !== 'Inactivo' && categoryOfExercise(e) === cat
      && e.name !== item.name && !planNames.includes(e.name))
    .sort((a, b) => a.order - b.order);
}
