// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fetchState, postEntries, loadCachedState, ApiError } from '../../src/lib/api';

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('fetchState', () => {
  it('GETs with the token and caches the state', async () => {
    const f = vi.fn().mockResolvedValue(ok({ ok: true, today: '2026-11-15', exercises: [] }));
    vi.stubGlobal('fetch', f);
    const s = await fetchState('https://x/exec', 'a b');
    expect(f.mock.calls[0][0]).toBe('https://x/exec?token=a%20b');
    expect(s.today).toBe('2026-11-15');
    expect(loadCachedState()?.today).toBe('2026-11-15');
  });
  it('throws unauthorized', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ ok: false, error: 'unauthorized' })));
    await expect(fetchState('u', 't')).rejects.toMatchObject({ kind: 'unauthorized' });
  });
  it('throws network on fetch failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(fetchState('u', 't')).rejects.toMatchObject({ kind: 'network' });
  });
  it('throws server on http errors and ok:false', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(fetchState('u', 't')).rejects.toBeInstanceOf(ApiError);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ ok: false, error: 'boom' })));
    await expect(fetchState('u', 't')).rejects.toMatchObject({ kind: 'server', message: 'boom' });
  });
});

describe('postEntries', () => {
  it('POSTs text/plain JSON and returns ids', async () => {
    const f = vi.fn().mockResolvedValue(ok({ ok: true, saved: ['1'], duplicates: ['2'] }));
    vi.stubGlobal('fetch', f);
    const r = await postEntries('https://x/exec', 'tok', [{ id: '1' } as never]);
    expect(r).toEqual({ saved: ['1'], duplicates: ['2'] });
    const [, init] = f.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers['Content-Type']).toBe('text/plain;charset=utf-8');
    expect(JSON.parse(init.body)).toEqual({ token: 'tok', entries: [{ id: '1' }] });
  });
  it('maps errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ ok: false, error: 'unauthorized' })));
    await expect(postEntries('u', 't', [])).rejects.toMatchObject({ kind: 'unauthorized' });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('x')));
    await expect(postEntries('u', 't', [])).rejects.toMatchObject({ kind: 'network' });
  });
});
