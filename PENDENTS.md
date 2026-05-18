# Pendents

## Tancat avui

- `npm.cmd run qa:smoke` afegit com a loop rapid.
- `npm.cmd run capture:changed` i filtres de `capture-runner.mjs` afegits per captures focalitzades.
- Timeouts de Chrome afegits als runners de QA i captures per reduir processos headless penjats.
- `npm.cmd run qa:edit` OK en solitari.
- `npm.cmd run qa` OK en sequencia.
- `npm.cmd run test:unit` OK.
- `npm.cmd run build` OK.
- Captures regenerades per als canvis UI d'aquesta passada:
  - barra lateral amb `Exporta JSON` / `Importa JSON`
  - lectura de `Croniques` enfocada al bloc `Fites clau`
  - edicio de `Croniques` enfocada al bloc `Fites clau`

## Encara obert

- Si es vol una validacio manual estricta del flux `Exporta JSON` / `Importa JSON` amb `IndexedDB` i selector natiu de fitxers, fer-la en navegador real. El flux de backup ara comparteix helpers interns i el codi esta cobert per build + unit + QA del harness, pero el picker natiu i l'asset store no son un objectiu fiable per a automatitzacio headless en aquesta base.
- Revisar si el cataleg complet de captures s'ha de retallar ara que existeixen captures focalitzades.

## Context

- Fitxers tocats en aquest tancament:
  - `main.js`
  - `qa-runner.mjs`
  - `qa-harness.js`
  - `capture-harness.js`
  - `capture-runner.mjs`
  - `AGENTS.md`
  - `WORKFLOW.md`
- Captures noves escrites a `qa-results/captures/`.
