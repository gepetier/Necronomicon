# Google Drive backend

Aquest backend fa de pont entre la pàgina estàtica i Google Drive. La UI no escriu directament a Drive: envia peticions a aquest Apps Script, que s'executa amb el compte propietari de Drive i desa `campaign.json` dins la carpeta configurada.

## Configuració actual

- Carpeta Drive: `1zyOcMrfnJ88RJ7PKWesT16ciS3MrlQI6`
- Fitxer de dades: `campaign.json`
- Carpeta d'imatges: `assets` (es crea automàticament dins la carpeta Drive)

## Pas 1: crear el projecte Apps Script

1. Obre `https://script.google.com/`.
2. Crea un projecte nou.
3. Copia tot el contingut de `apps-script/Code.gs` al fitxer `Code.gs` del projecte.
4. Revisa `SERVICE_USER_EMAIL`; ha de ser el correu que ja consta com a superadmin del `campaign.json`.
5. Desa el projecte.

## Pas 2: desplegar com a Web App

1. Ves a `Deploy` > `New deployment`.
2. Tria el tipus `Web app`.
3. Configura:
   - `Execute as`: `Me`
   - `Who has access`: `Anyone`
4. Prem `Deploy`.
5. Autoritza els permisos que demani Google.
6. Copia la URL acabada en `/exec`.

## Pas 3: passar la URL al client

La URL `/exec` activa és:

`https://script.google.com/macros/s/AKfycbwPm3QcltPGib-vwLWiElMZuELd-tq5aS2qohR_oNZt96IiPNOwumMYoIw7KZKJmBfXKQ/exec`

Amb aquesta URL el client pot:

- demanar un nom superficial en entrar;
- recordar el nom en aquest navegador;
- carregar `campaign.json` de Drive;
- desar canvis de fitxa/personatges;
- afegir la pestanya `Opcions > Permisos`.

## Notes de funcionament

- El `campaign.json` de Drive és sempre la font canònica; `data.js` i localStorage no l'han de substituir automàticament.
- Les imatges pujades es desen com a fitxers separats dins `assets`; el JSON només conserva referències `drive-asset://...`.
- Apps Script s'executa amb el compte propietari del desplegament i és l'única identitat que accedeix a Drive. No hi ha login de Google per als jugadors.
- `SERVICE_ACCESS_KEY` és una clau compartida del client, no un secret: qualsevol usuari que obri l'app la pot veure. Els noms són noms de sessió, no identitats verificades.
- Totes les sessions comparteixen els permisos de `SERVICE_USER_EMAIL`; no serveix per a control d'accés real entre persones.
- Les escriptures mantenen el bloqueig durant tota la transacció i fan control de revisió per evitar sobreescriure canvis simultanis.
- Cada desat complet crea una còpia `campaign-backup-...json` a la mateixa carpeta Drive.
- Després d'actualitzar `Code.gs`, crea una versió i un desplegament nous: editar el codi no actualitza automàticament la URL `/exec` desplegada.
- No posis credencials de Drive ni secrets personals dins el client. Aquest model és adequat per a una campanya privada, no per a dades sensibles.

## Purga total de media legacy

Quan es vulgui reiniciar totes les imatges de Cròniques i Glossari:

1. Copia la versió actual de `apps-script/Code.gs` a Apps Script i desa-la.
2. Al selector de funcions, tria `purgeLegacyChronicleAndGlossaryImages` i prem `Executa` una sola vegada.
3. La funció crea primer un `campaign-backup-...manual-media-purge.json`, elimina les referències d'imatge de Cròniques i Glossari i envia a la paperera els fitxers d'imatge orfes d'`assets`.
4. Les imatges encara referenciades per Personatges, inclosos els retrats, es conserven.
5. Comprova el resultat del registre d'execució i desplega una versió nova del Web App.

No tornis a executar la funció després de pujar les imatges noves. Els fitxers purgats romanen recuperables a la paperera de Drive fins que es buidi manualment.
