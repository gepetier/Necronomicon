# Workflow

## Loop ràpid

1. Fes el canvi.
2. Executa `npm.cmd run qa:smoke`.
3. Revisa les captures afectades a `qa-results/captures/`.
4. Si és un canvi UI, itera fins que desktop i mobile siguin satisfactoris.
5. Executa `npm.cmd run qa` abans de tancar canvis amb impacte ampli.

## Comandes

- `npm.cmd run qa:smoke`: funcional desktop + UI mobile + captura crítica inicial.
- `npm.cmd run qa`: funcional, UI i edició en desktop i mobile.
- `npm.cmd run capture`: regenera tot el catàleg de captures.
- `npm.cmd run capture:changed`: regenera el subconjunt habitual per canvis recents.
- `npm.cmd run capture:smoke`: captura només la pantalla inicial desktop/mobile.

## Captures focalitzades

`capture-runner.mjs` accepta filtres per nom d'escenari, nom de fitxer o àlies:

- `npm.cmd run capture -- chronicles`
- `npm.cmd run capture -- sidebar`
- `npm.cmd run capture -- glossary`
- `npm.cmd run capture -- options`
- `npm.cmd run capture -- chronicles-read`

Els filtres són inclusius: si passes més d'un terme, captura qualsevol escenari que coincideixi amb algun d'ells.

## Checklist UI

- `npm.cmd run build` passa.
- QA rellevant passa (`qa:smoke`, suite específica o `qa` complet).
- Captures desktop revisades.
- Captures mobile revisades.
- `AGENTS.md` actualitzat si canvia una decisió estable.
