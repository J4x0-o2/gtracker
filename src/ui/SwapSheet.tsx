import { useState } from 'preact/hooks';
import { categoryOfExercise } from '../lib/categories';
import { formatLast } from '../lib/format';
import type { Exercise, History } from '../lib/types';
import { Check } from './Icons';

interface Props {
  exercise: Exercise;
  alternatives: Exercise[];
  others: Exercise[];
  history: Record<string, History>;
  onPick: (name: string) => void;
  onJump: (name: string) => void;
  onCancel: () => void;
}

export function SwapSheet({ exercise, alternatives, others, history, onPick, onJump, onCancel }: Props) {
  const [selected, setSelected] = useState<string | null>(alternatives[0]?.name ?? null);

  return (
    <div class="backdrop" onClick={onCancel}>
      <div class="sheet" role="dialog" aria-label="Cambiar ejercicio" onClick={(e) => e.stopPropagation()}>
        <div class="grab" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <h2 style={{ fontSize: 22 }}>Cambiar {exercise.name}</h2>
          <span class="hint" style={{ fontSize: 13 }}>
            ¿La máquina está ocupada? Elige una alternativa del mismo grupo.
          </span>
        </div>

        <span class="eyebrow">ALTERNATIVAS · {categoryOfExercise(exercise).toUpperCase()}</span>
        {alternatives.length === 0 && <span class="hint">No hay alternativas disponibles.</span>}
        {alternatives.map((a) => (
          <button key={a.name} class={`alt${selected === a.name ? ' sel' : ''}`} onClick={() => setSelected(a.name)}>
            <span class="col">
              <span class="name">{a.name}</span>
              <span class="sub">Última: {formatLast(history[a.name]?.lastSets, a.unit)}</span>
            </span>
            {selected === a.name && <span class="badge done" style={{ width: 24, height: 24 }}><Check size={14} /></span>}
          </button>
        ))}

        {others.length > 0 && (
          <>
            <span class="eyebrow muted">O SALTA A OTRO DE LA RUTINA</span>
            <div class="jump">
              {others.map((o) => <button key={o.name} onClick={() => onJump(o.name)}>{o.name}</button>)}
            </div>
          </>
        )}

        <button class="btn" disabled={!selected} onClick={() => selected && onPick(selected)}>
          {selected ? `Usar ${selected}` : 'Elige una alternativa'}
        </button>
        <button class="btn plain" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
