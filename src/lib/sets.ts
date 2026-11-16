import type { SetData } from './types';

export function parseWeight(raw: string): number | null {
  const s = raw.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

function parseInteger(raw: string): number | null {
  const s = raw.trim();
  return /^\d+$/.test(s) ? Number(s) : null;
}

export interface RawSet { weight: string; reps: string; rir: string }
export type ParsedSet = { ok: true; set: SetData } | { ok: false; error: string };

export function parseSet(raw: RawSet): ParsedSet {
  const weight = parseWeight(raw.weight);
  if (weight === null || weight <= 0) return { ok: false, error: 'Peso inválido' };
  const reps = parseInteger(raw.reps);
  if (reps === null || reps < 1) return { ok: false, error: 'Reps inválidas' };
  const rir = parseInteger(raw.rir);
  if (rir === null || rir > 10) return { ok: false, error: 'RIR inválido (0-10)' };
  return { ok: true, set: { weight, reps, rir } };
}

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function estimate1rm(weight: number, reps: number, rir: number): number {
  return round1(weight * (1 + (reps + rir) / 30));
}

export function best1rmOf(sets: SetData[]): number {
  return Math.max(0, ...sets.map((s) => estimate1rm(s.weight, s.reps, s.rir)));
}

/** A record needs a known previous best (> 0); first-ever logs are not records. */
export function isRecord(sets: SetData[], best1rm: number | undefined): boolean {
  return !!best1rm && best1rm > 0 && best1rmOf(sets) > best1rm;
}
