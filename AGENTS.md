# Cryptódromo · reglas obligatorias para agentes

Estas reglas aplican a todos los agentes que modifiquen este repositorio, incluidos quienes trabajen exclusivamente en geometría, material, pelaje, animación, exportación o infraestructura 3D.

## Modelo maestro BTC: una única ficha de comparación

**Ficha canónica:** https://race.cryptodromo.com/racers/#BTC

CUALQUIER modificación del maestro BTC (anatomía, malla, rig, skinning, GLB, shaders, crin, cola, ojos, orejas, materiales, groom, animaciones o loaders) **DEBE actualizar en la misma entrega la ficha canónica**. El resultado debe verse en el modelo predeterminado de BTC SIN parámetros de laboratorio. No basta un ZIP local, preview alternativo, rama no fusionada ni captura.

En cada cambio:
1. Actualizar los archivos realmente consumidos por la ficha y su cadena de versiones/cache desde `racers/index.html` hasta el renderizador modificado.
2. Cambiar `racers/btc-master-revision.json` (nuevo `buildId`, estado real, mejoras y defectos pendientes). El `buildId` debe coincidir con `BTC_MAYA_RENDER_BUILD` del maestro activo.
3. Completar `docs/BTC-MASTER-CHANGELOG.md` con archivos y antes/después. La ficha BTC muestra el registro y el estado, pero no reemplaza la comprobación visual.
4. Comparar perfil izquierdo y derecho, frontal, trasera y detalle; reposo, galope y transiciones. Verificar URL real de Hostinger, no solo GitHub. Si producción no se verificó, dejar `pending_deploy` o `needs_fix`.
5. Conservar separación de los otros 99 caballos y no alterar resultados, precios o fixture.

**No se considera terminado un cambio del maestro si https://race.cryptodromo.com/racers/#BTC sigue mostrando la versión anterior.**

## Orden de trabajo vigente · 2026-11-04

1. **Defectos de forma/geométricos abiertos:** eliminar filamentos largos del cuello bajo la crin, acercar/continuar los mechones laterales a la raíz superior, cerrar la aparente transparencia detrás de ambas orejas, y modelar globos oculares con iris ajustable y pupila equina grande (ver `docs/BTC-MASTER-VISUAL-BACKLOG.md`).
2. **Siguiente etapa, luego de aceptar la geometría:** mejorar físicas de movimiento de crin y cola comparando fases del galope con el video `212734.mp4` aportado en las fuentes. Ver `docs/BTC-MANE-TAIL-PHYSICS-BRIEF.md`.

Consultar `racers/AGENTS.md` antes de editar el maestro.
