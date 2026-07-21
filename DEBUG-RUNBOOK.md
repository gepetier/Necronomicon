# Runbook de depuracio

## Arrencada en 30 segons

```powershell
node debug-status.mjs
npm.cmd run build
npm.cmd run test:unit
```

El primer comandament mostra si Vite esta escoltant a `5173`, l'ultim resultat de QA i quantes captures hi ha disponibles. Reutilitza el servidor existent; no iniciis una segona instancia. Per aixecar-lo: `npm.cmd run dev`.

## Escull la validacio minima

| Canvi | Validacio | Despres |
| --- | --- | --- |
| Logica o dades | `npm.cmd run build`, `npm.cmd run test:unit` | `npm.cmd run qa:functional` si afecta flux d'usuari |
| UI | `npm.cmd run qa:smoke` | revisa les captures a `qa-results/captures/` |
| Editor, referencies o multimedia | `npm.cmd run qa:edit` | prova manual en navegador real |
| Storage, migracions o imatges | `npm.cmd run qa:persistence` | prova Drive manual si hi ha login |
| Abans de commit | `npm.cmd run qa` | executa en sequencia, mai en paral·lel |

Per capturar nomes l'area afectada: `npm.cmd run capture -- glossary`, `chronicles`, `characters`, `options`, `desktop`, `mobile` o `changed`.

## Triage de media i Drive

1. A `Opcions > Diagnosi de connexio`, compara l'ID de **campanya oberta** amb el de **campanya sincronitzada**. Si divergeixen, atura qualsevol publicacio.
2. Identifica l'URL que falla a la consola:
   - `asset://...` = token local absent o encara pendent a IndexedDB.
   - `drive-asset://...` = fitxer Drive que ha de viure a `campanya/assets` i ser autoritzat per al mateix usuari.
   - `resources/...` = asset local empaquetat; no pot ser l'origen canonic d'una pujada d'usuari.
3. Recorre el log de pujada persistent: picker → preparacio → IndexedDB → cua de sync → Drive.
4. Conserva l'ID de l'actiu fallit. Busca'l a `main.js`, `app/cloud-sync.js` i `apps-script/Code.gs` abans de reintentar.

L'error *"El fitxer no pertany a la carpeta d'actius de la campanya"* es una incoherencia de dades/Drive. Reintentar el renderitzat no el corregeix.

## Mapa de fitxers

| Domini | Fitxers |
| --- | --- |
| Render i interficie | `main.js`, `styles.css`, `index.html` |
| Dades i migracions | `data.js`, `main.js` |
| Cache local | `app/storage.js` |
| Cua i API de Drive | `app/cloud-sync.js`, `apps-script/Code.gs` |
| Permisos | `app/permissions.js`, `apps-script/Code.gs` |
| QA funcional/UI | `qa-runner.mjs`, `qa-harness.js` |
| Captures | `capture-runner.mjs`, `capture-harness.js` |

## Proteccions operatives

- `campaign.json` a Drive es la font canonica. `data.js`, localStorage i IndexedDB son bootstrap/cache.
- No premis `Publica a Drive`, `Importa JSON`, `Esborra` ni `Desa permisos` durant una inspeccio sense autoritzacio explicita.
- Abans de desplegar Apps Script, fes backup del `campaign.json` i crea una versio nova del Web App.
- Les suites comparteixen el port `4173`; executa-les una darrere l'altra.
