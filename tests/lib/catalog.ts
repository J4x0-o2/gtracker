import type { Exercise } from '../../src/lib/types';

const rows: [string, string, string, string][] = [
  ['Predicador curl uni', 'Bíceps', 'kg', 'A'],
  ['Tricep extension', 'Tríceps', 'placas', 'A'],
  ['Tras nuca', 'Tríceps', 'placas', 'B'],
  ['Incline curl', 'Bíceps', 'kg', 'B'],
  ['Squat Smith', 'Piernas', 'kg', 'A'],
  ['Cuádriceps extension', 'Piernas', 'placas', 'B'],
  ['Hamstring curl sentado', 'Isquios', 'placas', 'A/B'],
  ['Calves prensa', 'Pantorrilla', 'kg', 'A'],
  ['Hip thrust machine', 'Glúteo', 'kg', 'A'],
  ['Abductor', 'Glúteo', 'kg', 'B'],
  ['Lateral polea', 'Hombro', 'placas', 'A'],
  ['Lateral raises', 'Hombro', 'kg', 'Alt'],
  ['Military press machine', 'Hombro', 'kg', 'B'],
  ['Abs machine', 'Abdomen', 'kg', 'A/B'],
  ['Banca', 'Pecho', 'kg', 'A'],
  ['Pec deck', 'Pecho', 'placas', 'B'],
  ['Pulldown', 'Espalda', 'placas', 'A'],
  ['Remo T', 'Espalda', 'kg', 'B'],
  ['Pullover', 'Espalda', 'placas', 'B'],
  ['Incline Smith', 'Pecho', 'kg', 'Inactivo'],
];

export const catalog: Exercise[] = rows.map(([name, group, unit, routine], order) => ({
  name, group, unit, routine, order,
}));

export const byName = (n: string) => catalog.find((e) => e.name === n)!;
