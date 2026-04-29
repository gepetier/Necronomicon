# Pendents

## Tancat avui

- `npm.cmd run qa:edit` OK en solitari.
- `npm.cmd run qa` OK en seqüència.
- `npm.cmd run test:unit` OK.
- `npm.cmd run build` OK.
- Captures regenerades per als canvis UI d'aquesta passada:
  - barra lateral amb `Exporta JSON` / `Importa JSON`
  - lectura de `Cròniques` enfocada al bloc `Fites clau`
  - edició de `Cròniques` enfocada al bloc `Fites clau`

## Encara obert

- Si es vol una validació manual estricta del flux `Exporta JSON` / `Importa JSON` amb `IndexedDB` i selector natiu de fitxers, fer-la en navegador real. El flux de backup ara comparteix helpers interns i el codi està cobert per build + unit + QA del harness, però el picker natiu i l'asset store no són un objectiu fiable per a automatització headless en aquesta base.
- Decidir si els escenaris de captura nous (`sidebar-tools`, `chronicles-read-highlights`, `chronicles-edit-highlights`) es mantenen com a part fixa del catàleg de captures.

## Context

- Fitxers tocats en aquest tancament:
  - `main.js`
  - `qa-runner.mjs`
  - `qa-harness.js`
  - `capture-harness.js`
  - `capture-runner.mjs`
  - `AGENTS.md`
- Captures noves escrites a `qa-results/captures/`.
