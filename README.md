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
- Panell flotant de notes personals dels jugadors per capítol
- Fallback responsive sense dependències externes

## Fitxers principals

- [index.html](C:\Users\Adri\Documents\Nigganomicron\index.html)
- [styles.css](C:\Users\Adri\Documents\Nigganomicron\styles.css)
- [main.js](C:\Users\Adri\Documents\Nigganomicron\main.js)

## Desenvolupament amb Vite

```bash
npm install
npm run dev
```

L'app quedarà disponible en local amb hot-reload perquè la navegació i l'estil es puguin iterar de forma àgil.

## Directori de recursos

S'ha afegit un directori `resources/` per desar arxius que després es podran enllaçar a les cròniques:

- `resources/notes-de-veu/` → notes de veu (`.mp3`, `.wav`, etc.)
- `resources/imatges/` → imatges de sessions, mapes o referències

## Possible evolució tècnica

Per optimitzar desenvolupament i manteniment, una evolució natural seria:

- **Petite-Vue / Vue** per modularitzar render i estat de la SPA.
- **TipTap o EditorJS** per una edició rica de cròniques més robusta que text pla.
- **Vite** per tenir dev server, hot reload i build més ràpid en desenvolupament.
