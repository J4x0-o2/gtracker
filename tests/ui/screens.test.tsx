// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from 'preact';
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
    render(<Main state={state} session={session} pending={3} onOpen={noop} onQueue={noop} onSettings={noop} onFinish={noop} />, root);
    expect(root.textContent).toContain('Rutina A');
    expect(root.textContent).toContain('Sin señal · 3 por enviar');
    expect(root.textContent).toContain('Sugerido: Predicador curl uni');
    expect(root.textContent).toContain('Última: 40 kg · 8-1');
  });

  it('Main blocks a third same-category item', () => {
    const root = document.createElement('div');
    let session = resolveSession(null, state);
    const s = [{ weight: 10, reps: 8, rir: 1 }];
    session = markDone(markDone(session, 'Squat Smith', s, '', undefined), 'Hamstring curl sentado', s, '', undefined);
    render(<Main state={state} session={session} pending={0} onOpen={noop} onQueue={noop} onSettings={noop} onFinish={noop} />, root);
    expect(root.textContent).toContain('Pierna ×2 seguidas');
    expect(root.textContent).toContain('Terminar entreno');
  });

  it('Summary shows stats and the next routine preview', () => {
    const root = document.createElement('div');
    let session = resolveSession(null, state);
    session = markDone(session, 'Banca', [{ weight: 42, reps: 8, rir: 1 }], '', 50);
    render(<Summary state={state} session={session} pending={0} onDone={noop} />, root);
    expect(root.textContent).toContain('Rutina A completada');
    expect(root.textContent).toContain('Todo enviado al Sheet');
    expect(root.textContent).toContain('RÉCORDS DE HOY');
    expect(root.textContent).toContain('PRÓXIMO ENTRENO · RUTINA B');
    expect(root.textContent).toContain('+ 6 más');
  });
});
