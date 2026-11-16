import type { Exercise } from './types';

export type Category = string;

const MAP: Record<string, Category> = {
  'Bíceps': 'Brazo',
  'Tríceps': 'Brazo',
  Piernas: 'Pierna',
  Isquios: 'Pierna',
  'Glúteo': 'Pierna',
  Pantorrilla: 'Pierna',
  'Cuádriceps': 'Pierna',
};

const PRIORITY: Record<string, number> = { Brazo: 1, Pierna: 2, Hombro: 3, Abdomen: 3, Pecho: 4, Espalda: 4 };

export const categoryOf = (group: string): Category => MAP[group] ?? group;
export const priorityOf = (category: Category): number => PRIORITY[category] ?? 3;
export const categoryOfExercise = (e: Pick<Exercise, 'group'>): Category => categoryOf(e.group);
