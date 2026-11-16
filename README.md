# GTracker

A phone-first gym logging PWA. Each exercise you finish is appended to the `Registro` sheet of a
Google Sheet (`GTracker - Registro Gym`), keeping the sheet's existing format. It suggests the next
exercise (never 3 in a row from the same muscle category), shows last session's marks as
placeholders, and works without signal by queueing entries on the phone.

Version **1.0.0** · UI in Spanish, code in English.

## Architecture

```
PWA (Vite + TypeScript + Preact, GitHub Pages)
  |  GET  ?token=...        -> state (last session, next routine, catalog, history)
  |  POST text/plain JSON   -> entries (idempotent by entry id)
  v
Apps Script Web App (container-bound to the Sheet, apps-script/)
  v
Google Sheet: Registro | Ejercicios | (_sync, hidden)
```

- `src/lib/` pure, tested logic: ordering/blocking (`plan.ts`), categories, set parsing and 1RM
  (`sets.ts`), session state (`session.ts`), API client (`api.ts`), offline queue on IndexedDB
  (`queue.ts`), config (`config.ts`).
- `src/ui/` Preact screens: splash, setup, main, exercise, swap sheet, queue, summary.
- `apps-script/` backend. `lib.js` is pure (unit tested from Vitest); `Code.js` holds the Apps
  Script entry points.
- `docs/design/` approved reference designs. `odd/tasks/gtracker-v1.md` is the feature document.
- The Web App URL and token are entered once in the app and stored in `localStorage`; they are
  never part of the bundle. Apps Script responses are not cached by the service worker (the app
  keeps its own copy of the last good state for offline start).

### Sheet format

`Registro` (row 1 headers): A Fecha | B Rutina (A/B) | C Ejercicio | D Serie (formula) | E Peso |
F Unidad (formula) | G Reps | H RIR | I 1RM est. (formula) | J Notas. Formulas in D, F, I are
prefilled down to row 1501. The backend writes only A, B, C, E, G, H, J on the first row whose
column C is empty and never touches D/F/I (if it runs past the last formula row it copies them
down first).

`Ejercicios` (row 1 headers): A Ejercicio | B Grupo muscular | C Unidad (kg/placas/lb) |
D Rutina (A, B, A/B, Alt, Inactivo). Sheet order is the tie-breaker for the suggested order.

1RM est. = `weight * (1 + (reps + rir) / 30)`, rounded to one decimal.

## Backend setup (once, by the owner)

1. Install clasp: `npm i -g @google/clasp` (or use `npx @google/clasp`) and run `clasp login`.
2. Create the bound project, from the repo root:
   `clasp create --type sheets --parentId <YOUR_SHEET_ID> --rootDir apps-script`
   (or open the Sheet, Extensions > Apps Script, and paste `appsscript.json`, `lib.js`, `Code.js`).
3. `clasp push` (`.claspignore` only ships the three Apps Script files; `.clasp.json` is git-ignored).
4. In the Apps Script editor run `setup()` once and authorize. It creates the `TOKEN` script
   property (shown in the execution log), the hidden `_sync` sheet, and resets number formats to
   "General" on `Registro!E2:E`, `Marcas!F6:F65`, `Marcas!H6:H65`, `Progreso!C5:C44`.
   Copy the token from the log. `rotateToken()` replaces it.
5. Deploy > New deployment > Web app: Execute as **Me**, Who has access **Anyone**. Copy the
   `/exec` URL. After later code changes, create a new deployment version.
6. Open the PWA > Setup: paste the URL and token, tap "Probar conexión", then "Guardar".

## Development

```
npm install
npm run dev        # Vite dev server
npm test           # Vitest (apps-script lib, src/lib, UI smoke tests)
npm run build      # typecheck + production build into dist/
npm run preview    # serve dist/
```

Strict TDD is used for the logic: write the failing test first (`npx vitest run`), then implement.

### GitHub Pages

The build uses `base: './'`, so it works from a repository subpath. Publish the contents of
`dist/` (for example with a GitHub Actions Pages workflow running `npm ci && npm run build`).
Navigation is state-based, so no server rewrites are needed. Note that the token lives in each
phone's `localStorage`, not in the repository.

## Novedades en 1.0.0

- Primera versión: registro por ejercicio con hasta 3 series, placeholders de la última sesión,
  orden sugerido por categoría (Brazo, Pierna, Hombro/Abdomen, Pecho/Espalda) sin 3 seguidos del
  mismo grupo, cambio de ejercicio por alternativa, cola sin conexión con reintento automático,
  resumen del entreno con récords de 1RM estimado.
- Backend en Apps Script con token, idempotencia por id de entrada y sin tocar las fórmulas de la hoja.
