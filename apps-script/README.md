# Google Drive backend

Aquest backend fa de pont entre la pagina estatica i Google Drive. La UI no escriu directament a Drive: envia peticions a aquest Apps Script, que valida el login Google i desa `campaign.json` dins la carpeta configurada.

## Configuracio actual

- OAuth client id: `386167885974-voguggv8fbvmqioec1p38vu3qf1fj33f.apps.googleusercontent.com`
- Carpeta Drive: `1zyOcMrfnJ88RJ7PKWesT16ciS3MrlQI6`
- Fitxer de dades: `campaign.json`

## Pas 1: crear el projecte Apps Script

1. Obre `https://script.google.com/`.
2. Crea un projecte nou.
3. Copia tot el contingut de `apps-script/Code.gs` al fitxer `Code.gs` del projecte.
4. Canvia `CHANGE_ME@gmail.com` pel correu Google que ha de tenir permisos de DM inicials.
5. Desa el projecte.

## Pas 2: desplegar com a Web App

1. Ves a `Deploy` > `New deployment`.
2. Tria el tipus `Web app`.
3. Configura:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone with Google account`
4. Prem `Deploy`.
5. Autoritza els permisos que demani Google.
6. Copia la URL acabada en `/exec`.

## Pas 3: passar la URL al client

La URL `/exec` activa es:

`https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec`

Amb aquesta URL el client pot:

- mostrar login Google nomes entrar;
- recordar la sessio al navegador;
- carregar `campaign.json` de Drive;
- desar canvis de fitxa/personatges segons permisos;
- afegir la pestanya `Opcions > Permisos`.

## Notes de funcionament

- El `campaign.json` de Drive es sempre la font canonica; `data.js` i localStorage no l'han de substituir automaticament.
- El primer usuari DM surt de `BOOTSTRAP_ADMIN_EMAILS`.
- Les lectures només retornen les campanyes accessibles per a l'usuari autenticat.
- Les escriptures mantenen el bloqueig durant tota la transacció i fan control de revisió per evitar sobreescriure canvis simultanis.
- Cada desat complet crea una copia `campaign-backup-...json` a la mateixa carpeta Drive.
- Els permisos viuen dins el mateix JSON, per tant es poden editar des de la UI quan la pestanya de permisos estigui connectada.
- Després d'actualitzar `Code.gs`, crea una versió i un desplegament nous: editar el codi no actualitza automàticament la URL `/exec` desplegada.
- No posis tokens secrets dins el client. El client nomes ha de tenir el client id public de Google i la URL publica del Web App; la credencial d'usuari es conserva només durant la sessió del navegador.
