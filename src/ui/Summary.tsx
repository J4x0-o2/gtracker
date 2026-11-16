import { categoryOfExercise } from '../lib/categories';
import { suggestedAfter } from '../lib/format';
import { routineExercises, suggestOrder } from '../lib/plan';
import { summary, type Session } from '../lib/session';
import type { AppState } from '../lib/types';
import { Check, Trend } from './Icons';

interface Props {
  state: AppState;
  session: Session;
  pending: number;
  onDone: () => void;
}

export function Summary({ state, session, pending, onDone }: Props) {
  const s = summary(session, state.history);
  const nextRoutine = suggestedAfter(session.routine);
  const preview = suggestOrder(routineExercises(state.exercises, nextRoutine), []);
  const shown = preview.slice(0, 4);

  return (
    <div class="screen" style={{ paddingTop: 28 }}>
      <div class="center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span class="check-ring"><Check size={30} color="#38B6FF" /></span>
        <h1 style={{ fontSize: 30 }}>Rutina {session.routine} completada</h1>
        <span class="pill" style={{ border: 0, background: 'none' }}>
          <span class={pending ? 'dot amber' : 'dot'} />
          {pending ? `${pending} por enviar al Sheet` : 'Todo enviado al Sheet'}
        </span>
      </div>

      <div class="tiles">
        <div class="tile"><b>{s.exercises}</b><span class="hint">Ejercicios</span></div>
        <div class="tile"><b>{s.sets}</b><span class="hint">Series</span></div>
        <div class="tile"><b>{s.records.length}</b><span class="hint">Récords</span></div>
      </div>

      {s.records.length > 0 && (
        <div class="list" style={{ gap: 8 }}>
          <span class="eyebrow" style={{ letterSpacing: '0.12em' }}>RÉCORDS DE HOY</span>
          {s.records.map((r) => (
            <div class="pr-row" key={r.name}>
              <Trend />
              <span class="col">
                <span class="name">{r.name}</span>
                <span class="sub">{r.detail}</span>
              </span>
              <span class="delta">{r.delta}</span>
            </div>
          ))}
        </div>
      )}

      <div class="card">
        <span class="eyebrow muted">PRÓXIMO ENTRENO · RUTINA {nextRoutine}</span>
        {shown.map((e, i) => (
          <div class="next-row" key={e.name}>
            <span class="i">{i + 1}</span>
            <span class="name" style={{ fontSize: 14, fontWeight: 500, flexGrow: 1 }}>{e.name}</span>
            <span class="chip">{categoryOfExercise(e)}</span>
          </div>
        ))}
        {preview.length > shown.length && <span class="hint">+ {preview.length - shown.length} más</span>}
      </div>

      <div class="grow" />
      <button class="btn" onClick={onDone}>Listo</button>
    </div>
  );
}
