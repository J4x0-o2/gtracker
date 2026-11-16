const KEY = 'gtracker.config';

export interface Config { url: string; token: string }

export function getConfig(): Config {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return { url: String(raw.url ?? ''), token: String(raw.token ?? '') };
  } catch {
    return { url: '', token: '' };
  }
}

export function saveConfig(c: Config): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ url: c.url.trim(), token: c.token.trim() }));
  } catch { /* storage unavailable */ }
}

export function isConfigured(): boolean {
  const c = getConfig();
  return !!c.url && !!c.token;
}
