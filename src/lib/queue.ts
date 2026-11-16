import { get, set } from 'idb-keyval';
import type { Entry } from './types';
import type { PostResult } from './api';

const KEY = 'gtracker.queue';

export type EntryDraft = Omit<Entry, 'id'>;
export interface FlushResult { sent: number; remaining: number; error?: unknown }

// Serializes read-modify-write cycles so concurrent enqueue/flush never lose entries.
let chain: Promise<unknown> = Promise.resolve();
function exclusive<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

const read = async () => (await get<Entry[]>(KEY)) ?? [];

export const listQueue = (): Promise<Entry[]> => read();

export function enqueue(draft: EntryDraft): Promise<Entry> {
  return exclusive(async () => {
    const entry: Entry = { ...draft, id: crypto.randomUUID() };
    await set(KEY, [...(await read()), entry]);
    return entry;
  });
}

let inFlight: Promise<FlushResult> | null = null;

/** Sends all pending entries in one POST; acknowledged (saved or duplicate) ids are removed. */
export function flush(post: (entries: Entry[]) => Promise<PostResult>): Promise<FlushResult> {
  if (inFlight) return inFlight;
  inFlight = doFlush(post).finally(() => { inFlight = null; });
  return inFlight;
}

async function doFlush(post: (entries: Entry[]) => Promise<PostResult>): Promise<FlushResult> {
  const pending = await read();
  if (!pending.length) return { sent: 0, remaining: 0 };
  let res: PostResult;
  try {
    res = await post(pending);
  } catch (error) {
    return { sent: 0, remaining: pending.length, error };
  }
  const acked = new Set([...res.saved, ...res.duplicates]);
  return exclusive(async () => {
    const left = (await read()).filter((e) => !acked.has(e.id));
    await set(KEY, left);
    return { sent: pending.filter((e) => acked.has(e.id)).length, remaining: left.length };
  });
}

/** Calls `run` whenever the browser regains connectivity. Returns an unsubscribe function. */
export function startAutoFlush(run: () => void): () => void {
  window.addEventListener('online', run);
  return () => window.removeEventListener('online', run);
}
