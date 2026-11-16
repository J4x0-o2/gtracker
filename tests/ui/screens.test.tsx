// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
import { Home } from '../../src/ui/Home';
import { Main } from '../../src/ui/Main';
import { Summary } from '../../src/ui/Summary';
import { markDone, resolveSession } from '../../src/lib/session';
import type { AppState } from '../../src/lib/types';
import { catalog } from '../lib/catalog';

const state: AppState = {
  today: '2026-11-15',
  lastSession: { date: '2026-11-14', routine: 'B' },
  nextRoutine: 'A',
  exercises: catalog,
  history: { Banca: { lastDate: '2026-11-08', lastSets: [{ weight: 40, reps: 8, rir: 1 }], best1rm: 50 } },
};

const noop = () => {};

describe('screens', () => {
  it('Main lists the plan with the suggested exercise and pending pill', () => {
    const root = document.createElement('div');
    const session = resolveSession(null, state);
    render(<Main state={state} session={session} pending={3} onOpen={noop} onBack={noop} onQueue={noop} onSettings={noop} onFinish={noop} />, root);
    expect(root.textContent).toContain('Rutina A');
    expect(root.textContent).toContain('Sin señal · 3 por enviar');
    expect(root.textContent).toContain('Sugerido: Predicador curl uni');
    expect(root.textContent).toContain('Última: 40 kg · 8-1');
  });

  it('Main has a back button to the home screen', () => {
    const root = document.createElement('div');
    let backed = 0;
    render(<Main state={state} session={resolveSession(null, state)} pending={0} onOpen={noop} onBack={() => backed++}
      onQueue={noop} onSettings={noop} onFinish={noop} />, root);
    (root.querySelector('[aria-label="Volver al inicio"]') as HTMLButtonElement).click();
    expect(backed).toBe(1);
  });

  it('Home previews the routine and offers to start or continue', () => {
    const root = document.createElement('div');
    const session = resolveSession(null, state);
    let started = 0;
    render(<Home state={state} session={session} pending={0} onStart={() => started++} onQueue={noop} onSettings={noop} />, root);
    expect(root.textContent).toContain('HOY TOCA');
    expect(root.textContent).toContain('Rutina A');
    expect(root.textContent).toContain('10 ejercicios · Brazo y pierna primero');
    expect(root.textContent).toContain('EMPIEZAS CON');
    expect(root.textContent).toContain('Predicador curl uni');
    expect(root.textContent).toContain('+ 6 más · el orden lo cambias durante el entreno');
    expect(root.textContent).toContain('Último entreno · Rutina B');
    expect(root.textContent).toContain('Sincronizado');
    (root.querySelector('.btn.start') as HTMLButtonElement).click();
    expect(started).toBe(1);

    const s2 = markDone(session, 'Predicador curl uni', [{ weight: 10, reps: 8, rir: 1 }], '', undefined);
    render(<Home state={{ ...state, lastSession: null }} session={s2} pending={2} onStart={noop} onQueue={noop} onSettings={noop} />, root);
    expect(root.textContent).toContain('Continuar entreno · 1/10');
    expect(root.textContent).toContain('Sin señal · 2 por enviar');
    expect(root.textContent).not.toContain('Último entreno');
  });

  it('Main blocks a third same-category item', () => {
    const root = document.createElement('div');
    let session = resolveSession(null, state);
    const s = [{ weight: 10, reps: 8, rir: 1 }];
    session = markDone(markDone(session, 'Squat Smith', s, '', undefined), 'Hamstring curl sentado', s, '', undefined);
    render(<Main state={state} session={session} pending={0} onOpen={noop} onBack={noop} onQueue={noop} onSettings={noop} onFinish={noop} />, root);
    expect(root.textContent).toContain('Pierna ×2 seguidas');
    expect(root.textContent).toContain('Terminar entreno');
  });

  it('Summary shows stats and the next routine preview', () => {
    const root = document.createElement('div');
    let session = resolveSession(null, state);
    session = markDone(session, 'Banca', [{ weight: 42, reps: 8, rir: 1 }], '', 50);
    render(<Summary state={state} session={session} pending={0} onDone={noop} />, root);
    expect(root.textContent).toContain('Entreno terminado · 1 de 10');
    expect(root.textContent).toContain('Todo enviado al Sheet');
    expect(root.textContent).toContain('RÉCORDS DE HOY');
    expect(root.textContent).toContain('PRÓXIMO ENTRENO · RUTINA B');
    expect(root.textContent).toContain('+ 6 más');
  });

  it('Summary title says the routine is complete only when every planned exercise is done', () => {
    const root = document.createElement('div');
    let session = resolveSession(null, state);
    for (const n of session.plan) session = markDone(session, n, [{ weight: 10, reps: 8, rir: 1 }], '', undefined);
    render(<Summary state={state} session={session} pending={0} onDone={noop} />, root);
    expect(root.textContent).toContain('Rutina A completada');
  });
});
