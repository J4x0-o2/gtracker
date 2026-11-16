import { useState } from 'preact/hooks';
import { fetchState, ApiError } from '../lib/api';
import { getConfig, saveConfig } from '../lib/config';
import { Back } from './Icons';

interface Props {
  onSaved: () => void;
  onCancel?: () => void;
  notice?: string;
}

export function Setup({ onSaved, onCancel, notice }: Props) {
  const initial = getConfig();
  const [url, setUrl] = useState(initial.url);
  const [token, setToken] = useState(initial.token);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const test = async () => {
    setBusy(true);
    setResult(null);
    try {
      const s = await fetchState(url.trim(), token.trim());
      setResult({ ok: true, text: `Conexión correcta · ${s.exercises.length} ejercicios` });
    } catch (e) {
      const kind = e instanceof ApiError ? e.kind : 'server';
      const text = kind === 'unauthorized' ? 'Token incorrecto'
        : kind === 'network' ? 'Sin conexión o URL incorrecta'
        : 'El servidor respondió con un error';
      setResult({ ok: false, text });
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    saveConfig({ url, token });
    onSaved();
  };

  return (
    <div class="screen">
      <div class="exhead">
        {onCancel ? (
          <button class="icon-btn" aria-label="Volver" onClick={onCancel}><Back /></button>
        ) : <span />}
      </div>
      <h1 class="big" style={{ fontSize: 32 }}>Conectar con el Sheet</h1>
      <span class="hint">Pega la URL del Web App y el token que mostró setup() en Apps Script. Se guardan solo en este teléfono.</span>
      {notice && <span class="error">{notice}</span>}
      <div class="form">
        <label>
          URL del Web App
          <input class="text" type="url" inputMode="url" autocapitalize="off" autocomplete="off"
            placeholder="https://script.google.com/macros/s/…/exec"
            value={url} onInput={(e) => setUrl(e.currentTarget.value)} />
        </label>
        <label>
          Token
          <input class="text" type="password" autocapitalize="off" autocomplete="off"
            value={token} onInput={(e) => setToken(e.currentTarget.value)} />
        </label>
        {result && <span class={result.ok ? 'ok' : 'error'} role="status">{result.text}</span>}
      </div>
      <div class="grow" />
      <button class="btn ghost" disabled={busy || !url.trim() || !token.trim()} onClick={test}>
        {busy ? 'Probando…' : 'Probar conexión'}
      </button>
      <button class="btn" disabled={!url.trim() || !token.trim()} onClick={save}>Guardar</button>
    </div>
  );
}
