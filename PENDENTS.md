# Pendents

## Tancat avui

- `npm.cmd run qa:smoke` afegit com a loop rapid.
- `npm.cmd run capture:changed` i filtres de `capture-runner.mjs` afegits per captures focalitzades.
- Timeouts de Chrome afegits als runners de QA i captures per reduir processos headless penjats.
- `npm.cmd run qa:edit` OK en solitari.
- `npm.cmd run qa` OK en sequencia.
- `npm.cmd run test:unit` OK.
- `npm.cmd run build` OK.
- Retorn de `Cròniques` cap a personatges implementat amb el mateix xip `Torna a la crònica` que el glossari.
- Catàleg de captures per defecte retallat a escenaris focalitzats; `capture:changed` cobreix els canvis recents.
- Captures regenerades per als canvis UI d'aquesta passada:
  - barra lateral amb `Exporta JSON` / `Importa JSON`
  - lectura de `Croniques` enfocada al bloc `Fites clau`
  - edicio de `Croniques` enfocada al bloc `Fites clau`

## Encara obert

- Abans de deploy, fer backup del `campaign.json` de Drive, que es sempre la font canonica; no substituir-lo amb `data.js` o localStorage sense una importacio o fusio revisada explicitament.
- Validar en navegador real el login Google i el desat contra Apps Script quan el client OAuth tingui autoritzats els origins de GitHub Pages i `localhost`.
- Si es vol una validacio manual estricta del flux `Exporta JSON` / `Importa JSON` amb `IndexedDB` i selector natiu de fitxers, fer-la en navegador real. El flux de backup ara comparteix helpers interns i el codi esta cobert per build + unit + QA del harness, pero el picker natiu i l'asset store no son un objectiu fiable per a automatitzacio headless en aquesta base.

## Context

- Fitxers tocats en aquest tancament:
  - `main.js`
  - `app/cloud-sync.js`
  - `app/storage.js`
  - `index.html`
  - `styles.css`
  - `apps-script/Code.gs`
  - `apps-script/README.md`
  - `qa-harness.js`
  - `capture-harness.js`
  - `capture-runner.mjs`
  - `resources/landing-cover-texture.jpg`
  - `resources/landing-sigil-cutout.png`
  - `AGENTS.md`
- Captures noves escrites a `qa-results/captures/`.
