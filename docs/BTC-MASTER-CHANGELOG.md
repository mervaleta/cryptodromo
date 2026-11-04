# Bitácora obligatoria de versiones · Maestro BTC

**Referencia única para cotejar cambios:** https://race.cryptodromo.com/racers/#BTC

Cada agente que cambie el modelo BTC debe registrar una entrada y asegurar que la ficha principal refleje la nueva versión. El registro que ve el usuario en la ficha sale de `racers/btc-master-revision.json` y NO constituye, por sí solo, verificación de Hostinger.

## Línea de base · 2026-11-04

- `masterId`: `btc-maya-2017-sculpt-gallop-20261104`.
- `buildId`: `btc-master-hindquarters-20261104-v5`.
- `status`: `needs_fix`.
- Render público: `/racers/#BTC` con variante `maya`.
- **Sin modificación del modelo en esta entrada:** se establece política, control de versiones visible y backlog.
- Defectos visibles reportados: mechones oscuros del cuello, mechones laterales desunidos, zona transparente detrás de las orejas y ojo sin globo/pupila grande.
- El GLB modificado localmente en una intervención anterior no afectó al groom de la ficha y NO se considera corregido.
- Siguiente iteración tras sanear geometría: físicas de crin y cola guiadas por el video de fuentes `212734.mp4`.

## Plantilla para cada próxima iteración

### YYYY-MM-DD · build `<nuevo-buildId>` · PR/commit
- **Problema y capturas ANTES:** descripción, ambos perfiles, frente, atrás, detalle
- **Solución en archivos de producción:** geometría, shaders, rig, groom, imports, paleta
- **Capturas DESPUÉS:** mismas cámaras y parámetros, reposo/galope/transición
- **Build visible de la ficha:** versión, estado y URL `/racers/#BTC`
- **QA local:** tests de navegador, anatomía, integridad, otros 99 tokens
- **QA Hostinger:** SHA/build realmente servido, fecha y evidencia
- **Incidencias restantes:** lista actualizada
- **Resultado:** `verified` | `pending_deploy` | `needs_fix`

No declarar `verified` únicamente por editar un GLB, abrir PR, ajustar código o pasar pruebas unitarias.
