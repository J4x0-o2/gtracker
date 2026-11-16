import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { clear } from 'idb-keyval';
import { enqueue, listQueue, flush } from '../../src/lib/queue';

const draft = (exercise: string) => ({
  date: '2026-11-15', routine: 'A' as const, exercise, sets: [{ weight: 10, reps: 8, rir: 1 }],
});

beforeEach(async () => { await clear(); });

describe('queue', () => {
  it('enqueues with a generated id and lists in order', async () => {
    const a = await enqueue(draft('Banca'));
    await enqueue(draft('Pulldown'));
    expect(a.id).toMatch(/[0-9a-f-]{36}/);
    expect((await listQueue()).map((e) => e.exercise)).toEqual(['Banca', 'Pulldown']);
  });

  it('flush sends everything in one POST and removes saved + duplicates', async () => {
    const a = await enqueue(draft('Banca'));
    const b = await enqueue(draft('Pulldown'));
    let calls = 0;
    const r = await flush(async (entries) => {
      calls++;
      expect(entries).toHaveLength(2);
      return { saved: [a.id], duplicates: [b.id] };
    });
    expect(calls).toBe(1);
    expect(r).toEqual({ sent: 2, remaining: 0 });
    expect(await listQueue()).toEqual([]);
  });

  it('keeps entries that were not acknowledged', async () => {
    const a = await enqueue(draft('Banca'));
    await enqueue(draft('Pulldown'));
    const r = await flush(async () => ({ saved: [a.id], duplicates: [] }));
    expect(r).toEqual({ sent: 1, remaining: 1 });
    expect((await listQueue()).map((e) => e.exercise)).toEqual(['Pulldown']);
  });

  it('keeps everything and reports the error on failure', async () => {
    await enqueue(draft('Banca'));
    const err = new Error('offline');
    const r = await flush(async () => { throw err; });
    expect(r).toEqual({ sent: 0, remaining: 1, error: err });
    expect(await listQueue()).toHaveLength(1);
  });

  it('does not post when empty', async () => {
    let called = false;
    const r = await flush(async () => { called = true; return { saved: [], duplicates: [] }; });
    expect(called).toBe(false);
    expect(r).toEqual({ sent: 0, remaining: 0 });
  });

  it('entries enqueued during a flush survive', async () => {
    const a = await enqueue(draft('Banca'));
    const r = await flush(async () => {
      await enqueue(draft('Late'));
      return { saved: [a.id], duplicates: [] };
    });
    expect(r.remaining).toBe(1);
    expect((await listQueue())[0].exercise).toBe('Late');
  });
});
