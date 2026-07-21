# Compendi de Campanya

SPA estàtica per centralitzar la informació d'una campanya de D&D amb estètica de llibre vell i fantasia medieval.

## Mòduls

- `Personatges`: grid inicial amb 4 cartes, detall del PJ i pestanyes de `Lore`, `Fitxa`, `Inventari` i `Història personal`
- `Cròniques`: llibre navegable per sessions amb índex lateral i edició de capítols
- `Glossari`: compendi ric d'ubicacions, races, monstres, faccions i objectes

## Funcionalitats

- Navegació lateral fixa
- Mode edició
- Persistència local amb `localStorage` i sincronització opcional amb Google Drive
- Exportació i importació de JSON
- Cròniques editables amb cos de capítol, imatges i notes de veu vinculades
- Referències vinculables al Glossari amb suggerència automàtica en escriure
- Fallback responsive sense dependències externes

## Fitxers principals

- [index.html](./index.html)
- [styles.css](./styles.css)
- [main.js](./main.js)

## QA

- `npm.cmd run qa:smoke` executa una validació ràpida i una captura crítica inicial
- `npm.cmd run qa` executa el test funcional i el de UI en `desktop` i `mobile`
- `npm.cmd run qa:functional` executa només els casos funcionals
- `npm.cmd run qa:ui` executa només els casos de layout/UI
- `npm.cmd run capture:changed` regenera un subconjunt de captures útil per iterar canvis UI
- `npm.cmd run capture -- chronicles` regenera captures focalitzades per filtre o àlies
- Els artefactes es guarden a `qa-results/`, incloent els HTML de cada escenari i `summary.json`
- Vegeu [WORKFLOW.md](./WORKFLOW.md) per al loop recomanat.

## Directori de recursos

S'ha afegit un directori `resources/` per desar arxius que després es podran enllaçar a les cròniques:

- `resources/notes-de-veu/` → notes de veu (`.mp3`, `.wav`, etc.)
- `resources/imatges/` → imatges de sessions, mapes o referències


## Depuració

- `npm.cmd run debug:status` mostra l'estat local de Vite, QA i captures.
- Vegeu [0-START-HERE.md](./0-START-HERE.md) i [DEBUG-RUNBOOK.md](./DEBUG-RUNBOOK.md) per al flux curt.
