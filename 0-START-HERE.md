# Comencar aqui

1. Executa `node debug-status.mjs` per saber si Vite esta actiu i quin QA va fallar per ultim cop.
2. Llegeix [CURRENT-DEBUG.md](./CURRENT-DEBUG.md) per veure bloquejants reals abans de modificar persistencia o Drive.
3. Segueix [DEBUG-RUNBOOK.md](./DEBUG-RUNBOOK.md) per escollir la prova minima i trobar el fitxer responsable.
4. Consulta `AGENTS.md` nomes per decisions estables d'arquitectura; evita usar-ne l'historial com a llista de treball.

Flux curt: canvi minim → build + unitats → QA dirigida → captura afectada → QA complet abans de publicar.
