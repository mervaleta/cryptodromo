# SATOSHI P0 · reparación de caché de módulos · 2026-11-04

Diagnóstico en Chromium real sobre race.cryptodromo.com (run 41899574084):
- LIVE, REPLAY y ARCHIVO: `The requested module './raceFixture.js' does not provide an export named 'getContinuousFixturePrice'`.
- VISITA 3D: `The requested module '/race-lab/source/src/stadium/presets.js' does not provide an export named 'WORLD_STADIUM_IDS'`.
- Los HTML y archivos solicitados con `?verify=` estaban actualizados, pero los importadores internos JS seguían solicitando rutas **sin versión**, que quedaron viejas en caché. Resultado: el grafo de módulos no podía evaluar ni inicializar WebGL, aunque el canvas estuviese en el DOM.
- Reparación: sufijo `?v=satoshi-cachefix-20261104-v3` propagado a cada dependencia nueva del fixture sintético y de los tres estadios, incluyendo los importadores anidados, más actualización de entradas HTML y URL de iframe TV.
- Se mantiene exactamente el mismo sistema deportivo, caballos y resultados. El cambio solo actualiza identidades de carga de JS, sin inventar datos.
- Verificar estado *real*: `#status` debe abandonar 'CARGANDO ESCENARIO 3D', `#start` habilitarse y los 12 corredores construirse; archivo debe mostrar repetición; `__crpStadiumQA.snapshot().courses` debe devolver tres trazados y canvas renderizado. Si falla, no declarar reparado.
