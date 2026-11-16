import { formatDateEs } from '../lib/format';
import { homeModel } from '../lib/home';
import type { Session } from '../lib/session';
import type { AppState } from '../lib/types';
import { Arrow, Calendar, Gear, NoSignal } from './Icons';

interface Props {
  state: AppState;
  session: Session;
  pending: number;
  onStart: () => void;
  onQueue: () => void;
  onSettings: () => void;
}

export function Home({ state, session, pending, onStart, onQueue, onSettings }: Props) {
  const m = homeModel(state, session);

  return (
    <div class="screen">
      <div class="topbar">
        <span class="date">{formatDateEs(state.today)}</span>
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

      <div class="hero">
        <img src="./icons/splash-figure.png" alt="" width={230} height={230} />
        <div class="hero-fade" />
        <span class="eyebrow">HOY TOCA</span>
        <h1 class="big hero-title">Rutina {m.routine}</h1>
        <span class="hero-sub">{m.subtitle}</span>
      </div>

      <div class="card">
        <span class="eyebrow muted">EMPIEZAS CON</span>
        {m.first.map((f) => (
          <div class="next-row" key={f.name}>
            <span class="i">{f.i}</span>
            <span class="col">
              <span class="name" style={{ fontSize: 14 }}>{f.name}</span>
              <span class="sub">Última: {f.last}</span>
            </span>
            <span class="chip">{f.group}</span>
          </div>
        ))}
        {m.moreCount > 0 && (
          <span class="hint">+ {m.moreCount} más · el orden lo cambias durante el entreno</span>
        )}
      </div>

      {m.lastSession && (
        <div class="last-card">
          <span class="last-ico"><Calendar color="#8A9AB2" /></span>
          <span class="col">
            <span class="name" style={{ fontSize: 14 }}>{m.lastSession.title}</span>
            <span class="sub">{m.lastSession.subtitle}</span>
          </span>
        </div>
      )}

      <div class="grow" />

      <button class="btn start" onClick={onStart}>
        {m.cta.label} <Arrow />
      </button>
    </div>
  );
}
