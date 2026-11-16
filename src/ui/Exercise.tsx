import { useState } from 'preact/hooks';
import { categoryOfExercise } from '../lib/categories';
import { parseSet, type RawSet } from '../lib/sets';
import type { Exercise as Ex, History, SetData } from '../lib/types';
import { Back, Close, Plus, Swap } from './Icons';

interface Props {
  exercise: Ex;
  routine: string;
  index: number;
  total: number;
  history?: History;
  saving: boolean;
  onBack: () => void;
  onSwap: () => void;
  onFinish: (sets: SetData[], note: string) => void;
}

const MAX_SETS = 3;
const empty = (): RawSet => ({ weight: '', reps: '', rir: '' });

export function Exercise({ exercise, routine, index, total, history, saving, onBack, onSwap, onFinish }: Props) {
  const [rows, setRows] = useState<RawSet[]>([empty()]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const last = history?.lastSets ?? [];
  const hint = (i: number) => last[i] ?? last[0];
  const ph = (i: number, k: keyof SetData) => {
    const h = hint(i);
    return h ? String(h[k]) : '';
  };
  const update = (i: number, k: keyof RawSet, v: string) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  const finish = () => {
    const sets: SetData[] = [];
    for (let i = 0; i < rows.length; i++) {
      const p = parseSet(rows[i]);
      if (!p.ok) {
        setError(`Serie ${i + 1}: ${p.error}`);
        return;
      }
      sets.push(p.set);
    }
    setError('');
    onFinish(sets, note);
  };

  const field = (i: number, k: keyof RawSet, label: string, mode: 'decimal' | 'numeric') => (
    <label class="field">
      {label}
      <input class="num" type="text" inputMode={mode} autocomplete="off" enterKeyHint="next"
        placeholder={ph(i, k)} value={rows[i][k]} onInput={(e) => update(i, k, e.currentTarget.value)} />
    </label>
  );

  return (
    <div class="screen">
      <div class="exhead">
        <button class="icon-btn" aria-label="Volver a la rutina" onClick={onBack}><Back /></button>
        <span class="date">Rutina {routine} · {index} de {total}</span>
        <button class="icon-btn" aria-label="Cambiar por ejercicio alternativo" onClick={onSwap}><Swap /></button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 class="ex-title">{exercise.name}</h1>
        <div class="chips">
          <span class="chip lg">{categoryOfExercise(exercise)}</span>
          <span class="chip lg">{exercise.unit}</span>
          {history && history.best1rm > 0 && <span class="chip lg pr">Récord 1RM est. {history.best1rm}</span>}
        </div>
      </div>

      <div class="sets">
        {rows.map((_, i) => (
          <div class="set" key={i}>
            <div class="set-head">
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span class="set-label">SERIE {i + 1}</span>
                {i > 0 && i === rows.length - 1 && (
                  <button class="remove-set" aria-label="Quitar serie"
                    onClick={() => setRows((rs) => rs.slice(0, -1))}><Close /></button>
                )}
              </span>
              {hint(i) && <span class="hint">Última: {hint(i).weight} × {hint(i).reps} · {hint(i).rir}</span>}
            </div>
            <div class="fields">
              {field(i, 'weight', 'Peso', 'decimal')}
              {field(i, 'reps', 'Reps', 'numeric')}
              {field(i, 'rir', 'RIR', 'numeric')}
            </div>
          </div>
        ))}
        <button class="add" disabled={rows.length >= MAX_SETS} onClick={() => setRows((rs) => [...rs, empty()])}>
          <Plus /> {rows.length >= MAX_SETS ? 'Máximo 3 series' : 'Agregar serie'}
        </button>
        <input class="text" type="text" placeholder="Nota (opcional)" value={note}
          onInput={(e) => setNote(e.currentTarget.value)} />
        {error && <span class="error" role="alert">{error}</span>}
      </div>

      <div class="grow" />
      <button class="btn" disabled={saving} onClick={finish}>{saving ? 'Guardando…' : 'Terminar ejercicio'}</button>
    </div>
  );
}
