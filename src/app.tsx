import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { ApiError, fetchState, loadCachedState, postEntries } from './lib/api';
import { getConfig, isConfigured } from './lib/config';
import { alternativesFor, isBlocked } from './lib/plan';
import { enqueue, flush, listQueue, startAutoFlush } from './lib/queue';
import {
  loadSession, markDone, resolveSession, saveSession, swapExercise, toEntry, type Session,
} from './lib/session';
import type { AppState, Entry, SetData } from './lib/types';
import { Exercise } from './ui/Exercise';
import { Home } from './ui/Home';
import { Main } from './ui/Main';
import { Queue } from './ui/Queue';
import { Setup } from './ui/Setup';
import { Splash } from './ui/Splash';
import { Summary } from './ui/Summary';
import { SwapSheet } from './ui/SwapSheet';

type Screen = 'splash' | 'setup' | 'home' | 'main' | 'exercise' | 'queue' | 'summary';

export function App() {
  const [screen, setScreen] = useState<Screen>(isConfigured() ? 'splash' : 'setup');
  const [state, setState] = useState<AppState | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [queue, setQueue] = useState<Entry[]>([]);
  const [current, setCurrent] = useState<string | null>(null);
  const [swapOpen, setSwapOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [toast, setToast] = useState<{ text: string; warn: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const toastTimer = useRef<number | undefined>(undefined);

  const showToast = (text: string, warn = false) => {
    setToast({ text, warn });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3200);
  };

  const refreshQueue = useCallback(async () => setQueue(await listQueue()), []);

  const flushNow = useCallback(async () => {
    const { url, token } = getConfig();
    if (!url || !token) return null;
    const r = await flush((entries) => postEntries(url, token, entries));
    await refreshQueue();
    return r;
  }, [refreshQueue]);

  const start = useCallback(async () => {
    setScreen('splash');
    const { url, token } = getConfig();
    let s: AppState | null = null;
    try {
      s = await fetchState(url, token);
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'unauthorized') {
        setNotice('El token no es válido. Revísalo y vuelve a probar.');
        setScreen('setup');
        return;
      }
      s = loadCachedState();
    }
    if (!s) {
      setNotice('No se pudo cargar la rutina y no hay datos guardados. Revisa la conexión y la URL.');
      setScreen('setup');
      return;
    }
    const sess = resolveSession(loadSession(), s);
    saveSession(sess);
    setState(s);
    setSession(sess);
    setNotice('');
    await refreshQueue();
    setScreen('home');
    void flushNow();
  }, [flushNow, refreshQueue]);

  useEffect(() => {
    if (isConfigured()) void start();
  }, [start]);

  useEffect(() => startAutoFlush(() => void flushNow()), [flushNow]);

  const update = (s: Session) => {
    saveSession(s);
    setSession(s);
  };

  const open = (name: string) => {
    setCurrent(name);
    setScreen('exercise');
  };

  const finishExercise = async (name: string, sets: SetData[], note: string) => {
    if (!session || !state) return;
    setSaving(true);
    const draft = toEntry(session, name, sets, note);
    try {
      await enqueue(draft);
      const next = markDone(session, name, sets, note, state.history[name]?.best1rm);
      update(next);
      const r = await flushNow();
      if (r && r.remaining === 0) showToast('Enviado al Sheet');
      else showToast('Guardado en el teléfono · se enviará al volver la señal', true);
      const allDone = next.plan.every((n) => next.done.some((d) => d.name === n));
      setScreen(allDone ? 'summary' : 'main');
    } catch {
      showToast('No se pudo guardar. Inténtalo de nuevo.', true);
    } finally {
      setSaving(false);
    }
  };

  const retry = async () => {
    setRetrying(true);
    const r = await flushNow();
    setRetrying(false);
    if (r && r.remaining === 0) showToast('Enviado al Sheet');
    else showToast('Sigue sin conexión · se reintentará solo', true);
  };

  let body;
  if (screen === 'setup') {
    body = <Setup notice={notice} onSaved={() => void start()} onCancel={state ? () => setScreen('home') : undefined} />;
  } else if (!state || !session || screen === 'splash') {
    body = <Splash />;
  } else if (screen === 'queue') {
    const queued = new Set(queue.map((e) => e.exercise));
    body = (
      <Queue today={state.today} entries={queue} retrying={retrying} onRetry={() => void retry()}
        sentNames={session.done.map((d) => d.name).filter((n) => !queued.has(n))}
        onClose={() => setScreen('main')} />
    );
  } else if (screen === 'summary') {
    body = <Summary state={state} session={session} pending={queue.length} onDone={() => setScreen('home')} />;
  } else if (screen === 'exercise' && current) {
    const ex = state.exercises.find((e) => e.name === current);
    if (!ex) {
      body = <Splash />;
    } else {
      // Position = how many exercises are already done today, plus this one.
      const idx = session.done.filter((d) => d.name !== current).length;
      const alternatives = alternativesFor(ex, state.exercises, session.plan);
      const byName = (n: string) => state.exercises.find((e) => e.name === n);
      const doneSeq = session.done.map((d) => byName(d.name)).filter((e): e is NonNullable<typeof e> => !!e);
      const remaining = state.exercises.filter((e) =>
        session.plan.includes(e.name) && !session.done.some((d) => d.name === e.name));
      // Jump targets skip exercises the two-in-a-row rule blocks right now.
      const others = remaining.filter((e) => e.name !== current && !isBlocked(e, doneSeq, remaining));
      body = (
        <>
          <Exercise key={current} exercise={ex} routine={session.routine} index={idx + 1} total={session.plan.length}
            history={state.history[current]} saving={saving}
            onBack={() => setScreen('main')} onSwap={() => setSwapOpen(true)}
            onFinish={(sets, note) => void finishExercise(current, sets, note)} />
          {swapOpen && (
            <SwapSheet exercise={ex} alternatives={alternatives} others={others} history={state.history}
              onCancel={() => setSwapOpen(false)}
              onJump={(n) => { setSwapOpen(false); open(n); }}
              onPick={(n) => { update(swapExercise(session, current, n)); setSwapOpen(false); setCurrent(n); }} />
          )}
        </>
      );
    }
  } else if (screen === 'home') {
    body = (
      <Home state={state} session={session} pending={queue.length} onStart={() => setScreen('main')}
        onQueue={() => setScreen('queue')} onSettings={() => setScreen('setup')} />
    );
  } else {
    body = (
      <Main state={state} session={session} pending={queue.length} onOpen={open}
        onBack={() => setScreen('home')}
        onQueue={() => setScreen('queue')} onSettings={() => setScreen('setup')}
        onFinish={() => setScreen('summary')} />
    );
  }

  return (
    <>
      {body}
      {toast && <div class={`toast${toast.warn ? ' warn' : ''}`} role="status">{toast.text}</div>}
    </>
  );
}
