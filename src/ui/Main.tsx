import { categoryOfExercise } from '../lib/categories';
import { formatDateEs, formatLast } from '../lib/format';
import { isBlocked, suggestOrder } from '../lib/plan';
import type { Session } from '../lib/session';
import type { AppState, Exercise } from '../lib/types';
import { Arrow, Back, Check, Gear, Lock, NoSignal } from './Icons';

interface Props {
  state: AppState;
  session: Session;
  pending: number;
  onOpen: (name: string) => void;
  onBack: () => void;
  onQueue: () => void;
  onSettings: () => void;
  onFinish: () => void;
}

export function Main({ state, session, pending, onOpen, onBack, onQueue, onSettings, onFinish }: Props) {
  const byName = new Map(state.exercises.map((e) => [e.name, e]));
  const planItems = session.plan.map((n) => byName.get(n)).filter((e): e is Exercise => !!e);
  const doneNames = session.done.map((d) => d.name);
  const doneItems = doneNames.map((n) => byName.get(n)).filter((e): e is Exercise => !!e);
  const remaining = planItems.filter((e) => !doneNames.includes(e.name));
  const ordered = suggestOrder(remaining, doneItems);
  const next = ordered.find((e) => !isBlocked(e, doneItems, remaining)) ?? ordered[0];
  const total = planItems.length;
  const pct = total ? Math.round((doneItems.length / total) * 100) : 0;

  const lastLine = (e: Exercise) => 'Última: ' + formatLast(state.history[e.name]?.lastSets, e.unit);

  return (
    <div class="screen">
      <div class="topbar">
        <span style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button class="icon-btn" aria-label="Volver al inicio" onClick={onBack}><Back /></button>
          <span class="date">{formatDateEs(state.today)}</span>
        </span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {pending > 0 ? (
            <button class="pill warn" onClick={onQueue}>
              <NoSignal /> Sin señal · {pending} por enviar
            </button>
          ) : (
            <span class="pill"><span class="dot" /> Sincronizado</span>
          )}
          <button class="icon-btn" aria-label="Ajustes" onClick={onSettings}><Gear /></button>
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span class="eyebrow">HOY TOCA</span>
        <div class="title-row">
          <h1 class="big">Rutina {session.routine}</h1>
          <span class="date">{doneItems.length} / {total} hechos</span>
        </div>
        <div class="progress"><div style={{ width: `${pct}%` }} /></div>
        <span class="hint">Toca cualquier ejercicio para empezarlo · máx. 2 seguidos del mismo grupo</span>
      </div>

      <div class="list grow">
        {doneItems.map((e) => (
          <button class="row done" key={e.name} onClick={() => onOpen(e.name)}>
            <span class="badge done"><Check /></span>
            <span class="col">
              <span class="name">{e.name}</span>
              <span class="sub">Registrado hoy</span>
            </span>
            <span class="chip">{categoryOfExercise(e)}</span>
          </button>
        ))}
        {ordered.map((e, i) => {
          const blocked = isBlocked(e, doneItems, remaining);
          const cat = categoryOfExercise(e);
          if (blocked) {
            return (
              <div class="row blocked" key={e.name} aria-disabled="true">
                <span class="badge blocked"><Lock /></span>
                <span class="col">
                  <span class="name" style={{ color: 'var(--muted)' }}>{e.name}</span>
                  <span class="sub amber">{cat} ×2 seguidas · haz otro grupo antes</span>
                </span>
                <span class="chip">{cat}</span>
              </div>
            );
          }
          const isNext = e === next;
          return (
            <button class={`row${isNext ? ' next' : ''}`} key={e.name} onClick={() => onOpen(e.name)}>
              <span class={`badge${isNext ? ' next' : ''}`}>{doneItems.length + i + 1}</span>
              <span class="col">
                <span class="name">{e.name}</span>
                <span class={`sub${isNext ? ' neon' : ''}`}>{(isNext ? 'Sugerido · ' : '') + lastLine(e)}</span>
              </span>
              <span class="chip">{cat}</span>
            </button>
          );
        })}
      </div>

      {doneItems.length >= 1 && (
        <button class="btn plain" onClick={onFinish}>Terminar entreno</button>
      )}
      {next && (
        <button class="btn" onClick={() => onOpen(next.name)}>
          Sugerido: {next.name} <Arrow />
        </button>
      )}
    </div>
  );
}
