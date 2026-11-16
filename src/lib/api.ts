import type { AppState, Entry } from './types';

export type ApiErrorKind = 'network' | 'unauthorized' | 'server';

export class ApiError extends Error {
  constructor(public kind: ApiErrorKind, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const STATE_KEY = 'gtracker.state';

async function call(url: string, init?: RequestInit): Promise<Record<string, unknown>> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    throw new ApiError('network', e instanceof Error ? e.message : 'network error');
  }
  if (!res.ok) throw new ApiError('server', `HTTP ${res.status}`);
  let body: Record<string, unknown>;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('server', 'Invalid response');
  }
  if (body.ok === false) {
    const msg = String(body.error ?? 'error');
    throw new ApiError(msg === 'unauthorized' ? 'unauthorized' : 'server', msg);
  }
  return body;
}

export async function fetchState(url: string, token: string): Promise<AppState> {
  const body = await call(`${url}?token=${encodeURIComponent(token)}`);
  const state = body as unknown as AppState;
  try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  return state;
}

export function loadCachedState(): AppState | null {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? (JSON.parse(raw) as AppState) : null;
  } catch {
    return null;
  }
}

export interface PostResult { saved: string[]; duplicates: string[] }

export async function postEntries(url: string, token: string, entries: Entry[]): Promise<PostResult> {
  const body = await call(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ token, entries }),
  });
  return { saved: (body.saved as string[]) ?? [], duplicates: (body.duplicates as string[]) ?? [] };
}
