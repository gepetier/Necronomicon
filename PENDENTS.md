# Pendents

## Oberts d'aquesta passada

- Revisar el layout desktop de l'editor de `Glossari`: les captures `glossary-edit-desktop.png` i `glossary-edit-references-desktop.png` apunten a un desbordament horitzontal o a una composició trencada.
- Actualitzar `AGENTS.md` amb els canvis nous:
  - editor ric amb referències temàtiques també a `Personatges` i `Glossari`
  - suggerència `Multimedia` quan hi ha text seleccionat
- Si es vol deixar el QA fi:
  - `npm.cmd run qa:edit` genera `qa-results/summary.json` amb `PASS` a desktop i mòbil, però el procés pare no acaba net; convé revisar `qa-runner.mjs` o el tancament del servidor fill.

## Estat validat

- `npm.cmd run build` OK
- `npm.cmd run qa:functional` OK
- `npm.cmd run qa:ui` OK
- `qa-results/summary.json` mostra `edit` OK a desktop i mòbil
- Captures correctes per:
  - `character-editor-references-desktop.png`
  - `character-editor-references-mobile.png`
  - `chronicles-edit-references-desktop.png`
  - `chronicles-edit-references-mobile.png`
  - `glossary-edit-references-mobile.png`

