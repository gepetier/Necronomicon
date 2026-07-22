# Estat actiu de depuracio

Actualitzat: 2026-07-22.

## Aplicat en codi

- La versio de dades 12 elimina una sola vegada totes les referencies d'imatge de Croniques i Glossari, inclosos els tokens `{{media:image|...}}`.
- El seed i el paquet public ja no inclouen imatges de glossari legacy; els retrats de Personatges i els recursos visuals de la interfície es conserven.
- El backend `2026-07-22-media-purge` incorpora `purgeLegacyChronicleAndGlossaryImages()`: fa backup, neteja el JSON i envia a la paperera els actius orfes.
- La purga preserva qualsevol fitxer encara referenciat fora de Croniques i Glossari, especialment retrats.

## Pendent a Drive

1. Copiar `apps-script/Code.gs` actualitzat a Apps Script.
2. Executar manualment `purgeLegacyChronicleAndGlossaryImages` una sola vegada abans de pujar imatges noves.
3. Revisar els comptadors retornats i la copia `campaign-backup-...manual-media-purge.json`.
4. Desplegar la revisio `2026-07-22-media-purge` i recarregar l'app.
5. Verificar que Croniques i Glossari no contenen `drive-asset://`, `asset://` ni media inline; despres es poden tornar a pujar les imatges.

## Validacio local

- `verify:fast`: correcte, 46 proves unitaries.
- Captures desktop i mobile generades; Glossari mostra placeholders i Croniques no mostra media legacy.
- `qa:persistence`: persistencia de les entrades i imatges noves correcta; queda un fals negatiu preexistent a l'opacitat inicial del tooltip, tot i que el contingut i la imatge persisteixen.

Vegeu [DEBUG-RUNBOOK.md](./DEBUG-RUNBOOK.md) i [apps-script/README.md](./apps-script/README.md).