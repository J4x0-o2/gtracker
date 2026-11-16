import { formatDateEs } from '../lib/format';
import type { Entry } from '../lib/types';
import { Download, NoSignal } from './Icons';

interface Props {
  today: string;
  entries: Entry[];
  sentNames: string[];
  retrying: boolean;
  onRetry: () => void;
  onClose: () => void;
}

export function Queue({ today, entries, sentNames, retrying, onRetry, onClose }: Props) {
  return (
    <div class="screen">
      <div class="topbar">
        <span class="date">{formatDateEs(today)}</span>
        {entries.length > 0 && (
          <span class="pill warn"><NoSignal /> Sin señal · {entries.length} por enviar</span>
        )}
      </div>

      <div class="card">
        <div class="card-head">
          <span class="box"><Download /></span>
          <span class="col">
            <span class="name" style={{ fontSize: 16 }}>Guardado en el teléfono</span>
            <span class="sub" style={{ fontSize: 13 }}>Se envía solo al Sheet cuando vuelva la conexión.</span>
          </span>
        </div>
      </div>

      <div class="list">
        <span class="eyebrow muted">EN COLA</span>
        {entries.length === 0 && <span class="hint">No hay nada pendiente.</span>}
        {entries.map((e) => (
          <div class="qrow" key={e.id}>
            <span class="dot amber" />
            <span class="col">
              <span class="name">{e.exercise}</span>
              <span class="sub">{e.sets[0].weight} · {e.sets.length} {e.sets.length === 1 ? 'serie' : 'series'}</span>
            </span>
            <span class="sub">{formatDateEs(e.date)}</span>
          </div>
        ))}
      </div>

      {sentNames.length > 0 && (
        <div class="list">
          <span class="eyebrow muted">YA EN EL SHEET</span>
          <div class="sent-row">
            <span class="dot" />
            <span>{sentNames.join(', ')}</span>
          </div>
        </div>
      )}

      <div class="grow" />
      <button class="btn ghost" disabled={retrying || entries.length === 0} onClick={onRetry}>
        {retrying ? 'Enviando…' : 'Reintentar envío ahora'}
      </button>
      <button class="btn" onClick={onClose}>Seguir entrenando</button>
    </div>
  );
}
