# Release notes Alpha16 · desfile 3D, dron y estadio con vida

**Fecha:** 2026-11-02 · **Integración:** PR [#11](https://github.com/mervaleta/cryptodromo/pull/11), fusionada en `main` sin modificar el contrato CRP.

## Enlaces públicos
- Carrera principal: https://race.cryptodromo.com/
- Visual Lab: https://race.cryptodromo.com/visual-lab/
- **Modo Parade:** https://race.cryptodromo.com/parade/
- Estadio institucional: https://race.cryptodromo.com/estadio/
- Estadísticas: https://race.cryptodromo.com/estadisticas/

## Qué se integró
- `parade/`: interfaz independiente con 100 tokens y 9 tandas de hasta 12, usando el mismo `horse.glb.gz` y la animación **Walk** confirmada en Chromium/CI; cada caballo debe completar una vuelta antes del siguiente lote.
- `parade/drone.js`: vuelo libre con flechas/WASD (strafe independiente), Q/E yaw, R/F elevación, T/G pitch, Shift velocidad, rotación por ratón, zoom/FOV; modos órbita y seguimiento.
- `parade/scenery.js`: 3 tribunas cortas que suman 324 unidades, 6 puestos, 4 carpas, 3 vehículos de mantenimiento, 32 fardos, 14 caminantes, 48 lámparas emisivas y cuatro luces reales sin sombra.
- `visual-lab/scene.js`: incorpora `createParadeVillage()`, retira la platea de 810 metros y conserva el pabellón VIP, las cámaras, la física de carrera, el fixture, los parciales y la meta.
- `visual-lab/stadiumBackdrop.js`: traslada bosque, ciudad y camino de servicio detrás del nuevo paseo gastronómico para evitar superposiciones.
- `parade/parade.js`: iluminación solar según hora de Buenos Aires, ambientación día/noche, corrección de penumbra nocturna con un único fill direccional sin sombras, carteles y aleros emisivos.
- Todas las páginas del campeonato incluyen enlaces a Modo Parade.

## Reglas deportivas preservadas
- La simulación en vivo se mantiene independiente, con sus **180 segundos**: 60 de carrera, 60 de resultados y 60 de presentación.
- Ninguna función de desfile modifica `createOfficialRace`, `raceFixture`, `officialRanking` o `trackSplits`.
- El **Parade no genera ganadores, apuestas ni resultados**. Solo reutiliza las identidades y sus pelajes.
- Los bots de apuestas conservan su modalidad exclusivamente ilustrativa y sin transacciones.

## Respaldo previo a la integración
- Snapshot de Alpha 15: rama `backup/main-2026-11-02-alpha15`, GitHub Actions [ZIP y Git bundle](https://github.com/mervaleta/cryptodromo/actions/runs/41523615441).
- Snapshot del main con los cambios del agente de parciales antes del merge: `backup/main-pre-alpha16-splits-20261102`, SHA `ac6323016201acb36033515182b3de4c51351821`.
- El ZIP/Git bundle respalda el repositorio y no incluye secretos o bases de datos privadas de Hostinger.

## Validación
- `node --test tests/alpha16-parade.mjs` para 100 corredores, una vuelta por grupo, dron y ausencia de dependencias financieras.
- `node tests/alpha16-parade-browser.mjs` ejecutado desde servidor local en CI, con capturas de día/noche y comprobación del GLB en Chromium.
- `node tests/alpha15-fast-smoke.mjs` visita Hostinger y comprueba Parade, Visual Lab, resultados, crónicas, apuestas, fixture y estadísticas.
- `.github/workflows/stadium-check.yml` mantiene pruebas del estadio principal y de tres recintos independientes.
- `.github/workflows/visual-lab.yml` valida escena, carga de 12 corredores, animación, clima, meta y clasificadores sintéticos.
- Corregida incompatibilidad de módulos de `estadisticas/stats.js` con versiones anteriores del fixture, responsable del error de deck al calcular bonus de parciales.

## Próxima pasada artística hacia AAA
1. Comprobar detalladamente capturas cinematográficas antes de clasificar el entorno como definitivo; los puestos y carpas son todavía geometría simple procedural.
2. Cambiar LOD0 de alimentos, camiones, toldos y herramientas por glTF/GLB con materiales PBR documentados en `docs/ALPHA16-ASSET-SOURCES.md`, sin sobrecargar dispositivos móviles.
3. Añadir señales de actividad no intrusivas: vendedores, público animado, logística lenta y vehículos **solo fuera de pista**.
4. Revisar cámara de inspección cercana, luces bajo techo y sombras de ruedas/objetos. Evitar 48 luces reales: conservar instancing y emisividad.
5. Conservar estándares de rendimiento, mínimo de draw calls y 12 GLB simultáneos.
