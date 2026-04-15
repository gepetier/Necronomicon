# Compendi de Campanya

SPA estàtica per centralitzar la informació d'una campanya de D&D amb estètica de llibre vell i fantasia medieval.

## Mòduls

- `Personatges`: grid inicial amb 4 cartes, detall del PJ i pestanyes de `Lore`, `Fitxa`, `Inventari` i `Història personal`
- `Cròniques`: llibre navegable per sessions amb índex lateral i edició de capítols
- `Glossari`: compendi ric d'ubicacions, races, monstres, faccions i objectes

## Funcionalitats

- Navegació lateral fixa
- Mode edició
- Persistència amb `localStorage`
- Exportació i importació de JSON
- Cròniques editables amb cos de capítol, imatges i notes de veu vinculades
- Referències vinculables al Glossari amb suggerència automàtica en escriure
- Fallback responsive sense dependències externes

## Fitxers principals

- [index.html](C:\Users\adriagardela\WebstormProjects\Necronomicon\index.html)
- [styles.css](C:\Users\adriagardela\WebstormProjects\Necronomicon\styles.css)
- [main.js](C:\Users\adriagardela\WebstormProjects\Necronomicon\main.js)

## QA

- `npm.cmd run qa` executa el test funcional i el de UI en `desktop` i `mobile`
- `npm.cmd run qa:functional` executa només els casos funcionals
- `npm.cmd run qa:ui` executa només els casos de layout/UI
- Els artefactes es guarden a `qa-results/`, incloent els HTML de cada escenari i `summary.json`

## Directori de recursos

S'ha afegit un directori `resources/` per desar arxius que després es podran enllaçar a les cròniques:

- `resources/notes-de-veu/` → notes de veu (`.mp3`, `.wav`, etc.)
- `resources/imatges/` → imatges de sessions, mapes o referències

