# Estat actiu de depuracio

Actualitzat: 2026-07-21.

## Aplicat en codi

- Les lectures de Drive ja no descarreguen tot el lot d'imatges a l'inici: cada actiu es resol sota demanda i els errors queden en cache.
- El backend informa dels actius legacy, absents o invalids i permet a un gestor copiar els legacy a la carpeta canonica `assets`.
- Els esborrats de croniques i entrades de glossari son operacions atomiques: un actiu orfe d'un altre element no els bloqueja.
- Les dades URL legacy s'escriuen directament a `assets`; no al directori arrel de la campanya.
- El panell Opcions diferencia el cataleg compartit de Drive de la campanya oberta.

## Pendent abans de provar produccio

1. Fer backup del `campaign.json` de Drive.
2. Desplegar `apps-script/Code.gs` revisio `2026-07-21-drive-asset-repair`.
3. Recarregar l'app autenticada i executar `Repara imatges Drive` si apareix l'avís d'actius legacy.
4. Revisar manualment els elements que quedin com a `missing` o `invalid`.

Vegeu [DEBUG-RUNBOOK.md](./DEBUG-RUNBOOK.md) per al procediment curt.
