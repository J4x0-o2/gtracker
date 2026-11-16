export type Routine = 'A' | 'B';

export interface Exercise {
  name: string;
  group: string;
  unit: string;
  /** "A" | "B" | "A/B" | "Alt" | "Inactivo" */
  routine: string;
  order: number;
}

export interface SetData {
  weight: number;
  reps: number;
  rir: number;
}

export interface History {
  lastDate: string;
  lastSets: SetData[];
  best1rm: number;
}

export interface AppState {
  today: string;
  lastSession: { date: string; routine: Routine } | null;
  nextRoutine: Routine;
  exercises: Exercise[];
  history: Record<string, History>;
}

export interface Entry {
  id: string;
  date: string;
  routine: Routine;
  exercise: string;
  sets: SetData[];
  note?: string;
}
