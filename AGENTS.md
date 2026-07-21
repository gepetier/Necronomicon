# Necronomicon · context operatiu

## Projecte

SPA estàtica Vite amb JavaScript pla per a campanyes de rol. Mòduls: `Personatges`, `Cròniques`, `Glossari`, `Campanyes` i `Opcions`.

Fitxers principals: `main.js` (orquestració/UI), `styles.css` (estils), `data.js` (seed), `app/storage.js` (catàleg local), `app/cloud-sync.js` (client Drive) i `apps-script/Code.gs` (backend).

## Comandes

- `npm.cmd run dev`: Vite a `5173`; reutilitza'l si ja està actiu.
- `npm.cmd run verify:fast`: build + unitats.
- `npm.cmd run qa:smoke`: regressió curta i captures.
- `npm.cmd run qa:functional`, `qa:ui`, `qa:edit`, `qa:persistence`: suites dirigides.
- `npm.cmd run qa`: validació completa, sempre en seqüència.
- `npm.cmd run capture -- <alias>`: captures focalitzades.
- `npm.cmd run debug:status`: servidor, últim QA i captures.

## Flux obligatori

1. Llegeix `0-START-HERE.md` i `CURRENT-DEBUG.md`.
2. Fes el canvi mínim; executa `verify:fast`.
3. Tot canvi UI requereix captures desktop i mobile revisades.
4. Canvis de persistència/media requereixen `qa:persistence` i una prova de navegador real si toquen Drive o el picker natiu.
5. No executis suites QA en paral·lel: comparteixen el port `4173`.

## Decisions estables

- `campaign.json` a Drive és la font canònica. `data.js`, localStorage i IndexedDB són bootstrap/cache.
- Media d'usuari: fitxers a `assets` de Drive i referències `drive-asset://<id>`; IndexedDB només cacheja.
- `asset://...` sense blob local bloqueja una publicació completa: no s'ha d'ignorar silenciosament.
- Les operacions d'element (desat/eliminació) han de ser puntuals; evita publicacions completes per canvis locals d'una entrada.
- Referències de Cròniques mantenen `[[id|etiqueta]]`; glossari i personatges hi poden ser destinació.
- La barra lateral d'escriptori és col·lapsada per defecte; canvis visuals s'han de revisar en desktop i mòbil.
- Els esborranys de fitxa es conserven en tancar l'edició, però l'editor ha d'indicar-ho i oferir una acció explícita per descartar-los.
- En editar una fitxa, el botó de Notes ha de ser integrat al flux de l'editor; no pot cobrir camps en mòbil.

- La fitxa D&D manté l'estat temporal dins de la mateixa fitxa: HP i recursos són ajustables en lloc, mentre que les condicions viuen en una franja horitzontal inicial amb resum per ordre de finalització i menú desplegable.

## Estat actual

- Backend/client de sync: `2026-07-21-drive-asset-repair`.
- Càrrega d'actius Drive és diferida; els errors es cachegen i mostren un fallback visual en comptes de repetir peticions.
- `Opcions` pot reparar explícitament referències d'actius heretats que ja pertanyen a la campanya però són fora d'`assets`.
- Vegeu `CURRENT-DEBUG.md` per bloquejants reals i `DEBUG-RUNBOOK.md` per triatge.

## Darrera sessio

- 2026-07-21: integrada la franja d'estats D&D a la fitxa, amb resum temporal, les 15 condicions oficials, esgotament 1–6, controls de duració i atles d'icones WebP; revisada visualment en escriptori i mòbil.


- 2026-07-21: corregida la carrega i reparacio d'actius Drive: carrega diferida, diagnostics, migracio controlada de fitxers legacy a assets, fallback visual i esborrats atomics. Queda pendent desplegar Apps Script i executar la reparacio sobre les dades reals.
