import { routineExercises } from './plan';
import { estimate1rm, best1rmOf, round1 } from './sets';
import type { AppState, Entry, History, Routine, SetData } from './types';

const KEY = 'gtracker.session';

export interface DoneItem {
  name: string;
  sets: SetData[];
  note: string;
  at: number;
  /** Best 1RM for this exercise before today's log (undefined when none). */
  prevBest?: number;
}

export interface Session {
  date: string;
  routine: Routine;
  plan: string[];
  done: DoneItem[];
  swaps: Record<string, string>;
}

export function resolveSession(stored: Session | null, state: AppState): Session {
  if (stored && stored.date === state.today) return stored;
  const routine: Routine =
    state.lastSession && state.lastSession.date === state.today ? state.lastSession.routine : state.nextRoutine;
  return {
    date: state.today,
    routine,
    plan: routineExercises(state.exercises, routine).map((e) => e.name),
    done: [],
    swaps: {},
  };
}

export function swapExercise(s: Session, from: string, to: string): Session {
  return {
    ...s,
    plan: s.plan.map((n) => (n === from ? to : n)),
    swaps: { ...s.swaps, [from]: to },
  };
}

export function markDone(
  s: Session, name: string, sets: SetData[], note: string, prevBest: number | undefined, at = Date.now(),
): Session {
  const item: DoneItem = { name, sets, note, at, prevBest };
  return { ...s, done: [...s.done.filter((d) => d.name !== name), item] };
}

export function toEntry(s: Session, name: string, sets: SetData[], note: string): Omit<Entry, 'id'> {
  const e: Omit<Entry, 'id'> = { date: s.date, routine: s.routine, exercise: name, sets };
  if (note.trim()) e.note = note.trim();
  return e;
}

export interface RecordLine { name: string; detail: string; delta: string }

export function summary(s: Session, history: Record<string, History> = {}) {
  const records: RecordLine[] = [];
  for (const d of s.done) {
    const prev = d.prevBest ?? history[d.name]?.best1rm;
    const best = best1rmOf(d.sets);
    if (!prev || prev <= 0 || best <= prev) continue;
    const top = d.sets.reduce((a, b) =>
      estimate1rm(b.weight, b.reps, b.rir) > estimate1rm(a.weight, a.reps, a.rir) ? b : a);
    records.push({
      name: d.name,
      detail: `${top.weight} × ${top.reps} · 1RM est. ${best}`,
      delta: `+${round1(best - prev)}`,
    });
  }
  return {
    exercises: s.done.length,
    sets: s.done.reduce((n, d) => n + d.sets.length, 0),
    records,
  };
}

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ }
}
