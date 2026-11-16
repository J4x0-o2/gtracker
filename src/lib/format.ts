import type { Routine, SetData } from './types';

/** "18 placas · 9-1, 7-1" (reps-rir per set; weight range when it varies). */
export function formatLast(sets: SetData[] | undefined, unit: string): string {
  if (!sets || !sets.length) return 'Sin registros';
  const weights = sets.map((s) => s.weight);
  const lo = Math.min(...weights);
  const hi = Math.max(...weights);
  const w = lo === hi ? `${lo}` : `${lo}–${hi}`;
  return `${w} ${unit} · ${sets.map((s) => `${s.reps}-${s.rir}`).join(', ')}`;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function formatDateEs(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

export function formatTime(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export const suggestedAfter = (r: Routine): Routine => (r === 'A' ? 'B' : 'A');
