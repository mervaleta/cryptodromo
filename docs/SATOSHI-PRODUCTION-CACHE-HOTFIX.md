# SATOSHI P0 · reparación de caché de módulos · 2026-11-04

Diagnóstico en Chromium real sobre race.cryptodromo.com (run 41899574084):
- LIVE, REPLAY y ARCHIVO: `The requested module './raceFixture.js' does not provide an export named 'getContinuousFixturePrice'`.
- VISITA 3D: `The requested module '/race-lab/source/src/stadium/presets.js' does not provide an export named 'WORLD_STADIUM_IDS'`.
- Los HTML y archivos solicitados con `?verify=` estaban actualizados, pero los importadores internos JS seguían solicitando rutas **sin versión**, que quedaron viejas en caché. Resultado: el grafo de módulos no podía evaluar ni inicializar WebGL, aunque el canvas estuviese en el DOM.
- Reparación: sufijo `?v=satoshi-cachefix-20261104-v3` propagado a cada dependencia nueva del fixture sintético y de los tres estadios, incluyendo los importadores anidados, más actualización de entradas HTML y URL de iframe TV.
- Se mantiene exactamente el mismo sistema deportivo, caballos y resultados. El cambio solo actualiza identidades de carga de JS, sin inventar datos.
- Verificar estado *real*: `#status` debe abandonar 'CARGANDO ESCENARIO 3D', `#start` habilitarse y los 12 corredores construirse; archivo debe mostrar repetición; `__crpStadiumQA.snapshot().courses` debe devolver tres trazados y canvas renderizado. Si falla, no declarar reparado.

## Verificación pública después del despliegue
- Hotfix #90 fusionado en main: `c3384c81034ef6eafec34401fa79b4290120b8f2`.
- Chromium público [#41901573307](https://github.com/mervaleta/cryptodromo/actions/runs/41901573307): **PASS**. LIVE quedó en `CAMPO PREPARADO · 12 CORREDORES`, canvas 845×475 y avance de tiempo; archivo Genesis presentó 480 carreras (24 filas en la primera página), y la visita 3D Satoshi renderizó tres pistas, seis bandas de pista, 42 focos y 364 llamadas de dibujo en la captura muestreada. Sin errores JavaScript ni HTTP.
- Prueba de extremo a extremo sobre Hostinger [#41900831999](https://github.com/mervaleta/cryptodromo/actions/runs/41900831999): **PASS** Muybridge/Genesis/Vint Cerf, archivo→replay automático→LIVE, y un solo iframe sin recursión. Evidencia de capturas en artefacto de Actions.
- Dos fallos previos de la suite estaban asociados al test mismo: inspeccionaba `#start` solo dentro del iframe incluso en la vista standalone, y una captura larga de WebGL excedió el timeout. La versión posterior corrige ambas condiciones sin cambiar el motor.
- Pendiente fuera de este incidente: diseño AAA y optimización visual del caballo; no atribuir a esta corrección un rediseño.
