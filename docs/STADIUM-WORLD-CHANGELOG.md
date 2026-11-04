# Cryptódromo World · bitácora de preparación (sin desplegar)
Corte de integración: `main` en `7c28e14afa418767a0b56fde1f62cbe55b611d88` (04-11-2026).  
Rama aislada: `prep/stadium-world-integration-20261104`.  
**Estado general: IMPLEMENTADO EN RAMA; PENDIENTE DE CI, REVISIÓN Y HOSTINGER.** No confundir un archivo nuevo con una función comprobada en vivo.

## Iteración P0 · Satoshi broadcast
- **Origen:** falta `#present-horse-3d` en `stadiums/crypto/broadcast/index.html`, aunque `visual-lab/scene.js` lo exige. Error conocido: `Cannot read properties of null (reading 'append')`.
- **Corrección implementada:** el HTML del canal recibe el mismo contenedor de vista previa que `visual-lab/index.html`; `presentationHorse.js` tolera la ausencia opcional del contenedor y la imposibilidad de reservar un segundo WebGL sin derribar la carrera principal. Los parámetros `?v=` de escena y presentador cambian para evitar una caché antigua.
- **Archivos:** `stadiums/crypto/broadcast/index.html`, `visual-lab/presentationHorse.js`, `visual-lab/scene.js`.
- **Riesgos:** no hay comprobación en navegador real ni prueba de Hostinger en esta preparación. La presentación secundaria puede degradarse a `unavailable` cuando no haya segundo contexto WebGL; el motor principal debe seguir funcionando. No se tocó ni duplicó el maestro BTC.
- **Pruebas nuevas:** `tests/stadium-broadcast-contract.mjs` revisa las referencias DOM del motor; `tests/stadium-world-browser-acceptance.mjs` ejecuta tres canales en Chromium, carrera/replay, llegada, resultados y capturas.
- **Estado de publicación:** NO PUBLICADO. **Estado verificable:** sólo lectura y edición de la rama, sin evidencias de Hostinger.

## Corrección adicional · relojes escalonados de las tres pistas
- **Defecto confirmado en la presentación del hub:** `assets/crypto-venue.js` mostraba el tiempo restante de la fase actual (`race/results/presentation`), que se reinicia cada 60 s. Como las tres pistas están desfasadas precisamente 60 s, los tres contadores mostraban el mismo valor aunque los ciclos ya eran independientes.
- **Corrección aislada:** `assets/crypto-channel-countdown.js` transforma el estado de cada canal en tiempo hasta **su próxima largada** mediante `secondsToNext`. `assets/crypto-venue.js` muestra ese tiempo y usa `next.label` y `next.slot` en lugar del turno actual. `stadiums/crypto/live/index.html` invalida la caché de ese script.
- **Ejemplo reproducible:** 2026-11-04 14:42:14 (Buenos Aires) debe mostrar Muybridge 00:16, Genesis 01:16, Vint Cerf 02:16; siguientes largadas 14:42:30, 14:43:30 y 14:44:30 respectivamente. Las tres pueden denominarse carrera 295/480, ya que el número es por pista.
- **Prueba:** `tests/stadium-staggered-countdowns.mjs`, con casos de fases, límites de largada, medianoche y diferencia constante de 60 s. **Estado: implementado en la rama; NO publicado ni validado todavía en Hostinger.**
- No se alteraron `tripleLiveSchedule.js`, `raceFixture.js`, `tripleRaceFixture.js`, posiciones ni resultado oficial.

## Iteración preparatoria · contrato deportivo
- **Problema:** Alpha18 (480 carreras diarias) y Alpha19 (tres pistas × 480 = 1.440) coexisten con URL, índices y semánticas diferentes.
- **Implementación aislada:** `race-lab/source/src/data/worldRaceRecord.js` expone `resolveWorldRace({family,dayIndex,slot,trackId?})` para obtener clave única, versión de fixture, participantes, cotizaciones sintéticas usadas, hora local, pista, clasificación oficial, ganador, podio y URL de replay cuando está disponible.
- Las referencias Alpha18 permanecen identificadas como `legacy`, sin atribuírselas retroactivamente a Muybridge. No se cambian `officialRace.js`, fixtures, precios, cámara o coeficientes.
- **Prueba:** `tests/stadium-world-record.mjs`. **Migración de consumidores:** PENDIENTE; no declarar igualdad en producción de ficha/archivo/estadísticas antes de migrar y probar.
- **Versionado:** schema `world-race-record-v1`. Mantener las claves históricas externas y crear alias explícitos si es necesario.
- **Estado de publicación:** NO PUBLICADO.

## Estado real de la red de estadios según catálogo y fuentes actuales

| Estadio | Pistas | Catálogo y ficha | Visita 3D | Fixture / reloj | Resultados y transmisión |
|---|---|---|---|---|---|
| Satoshi Nakamoto | Muybridge, Genesis, Vint Cerf | Sí, en código | Maqueta triple existente; no certificada sin solapes | Alpha19 sintético, relojes independientes en código | Motor + archivo + broadcast existentes; fallo DOM corregido únicamente en rama, aún sin QA real |
| MERVAL | Clásico de Palermo, Pista del Plata | Sí | Preset procedural navegable, diseño final pendiente | Programación **editorial** | Sin motores/ganadores conectados |
| Wall Street | Main Street, Heritage Track | Sí | Preset procedural navegable, diseño final pendiente | Editorial | Sin motores/ganadores conectados |
| Tokio | Neon Circuit | Sí | Preset procedural navegable, diseño final pendiente | Editorial | Sin motor de motos ni resultados |
| Londres | Royal Turf | Sí | Preset procedural navegable, diseño final pendiente | Editorial | Sin motores/ganadores conectados |
| Commodities | Mines Trail, Desert Classic | Sí | Preset procedural navegable, diseño final pendiente | Editorial | Sin motores de camiones ni resultados |
| Forex | World Circuit | Sí | Preset procedural navegable, diseño final pendiente | Editorial | Sin motores de autos ni resultados |
| Champions | Grand Final | Sí | Preset procedural navegable, diseño final pendiente | Clasificación editorial pendiente | **No** crear resultados hasta acordar método intermercado |

**Contabilidad:** 8 sedes, 13 pistas. Una ficha HTML, una escenografía procedural y una programación editorial no son una carrera funcional. La calidad AAA y la física tridimensional integrada siguen pendientes de comparación visual y rendimiento.

## Iteración preparatoria · separación física de tres trazados
- La maqueta de Satoshi ya contiene Muybridge, Genesis y Vint Cerf en posiciones tridimensionales distintas. Se expuso su transformación existente como `stadiumCoursePoint()` desde `visual-lab/threeCoursePreview.js`, sin alterar mallas, cámaras ni reglas deportivas.
- `tests/stadium-course-clearance.mjs` realiza un muestreo de los bordes de las tres pistas para detectar intersecciones obvias. Este muestreo NO certifica ausencia de clipping de todos los triángulos, accesos o modelos 3D ni prueba que el broadcast use esas coordenadas.
- **Pendiente de integración:** adaptar recorrido, gateras, metas, cámaras y entorno del broadcast al sistema común de coordenadas y probarlo visualmente.

## Hallazgo de CI · bloqueo deportivo previo a la integración
- Las pruebas de referencia Alpha19 que incorporan el extremo de la semana sintética detectaron `Price volatility outside supported race domain: 1INCH` al usar `createOfficialRace` sobre ciertas carreras. Es un fallo real del contrato de datos/ranking y NO debe esconderse reduciendo el rango de las pruebas.
- **Hipótesis técnica a confirmar:** `getTripleRaceFixture` obtiene velas mediante `getFixturePrice()` con módulo 7 días, lo que puede empalmar el último minuto del día 7 con los precios del comienzo de la semana sin continuidad de precios. Investigar también el paso día/mes y cambios de jornada.
- La rama NO modifica `officialRace.js`, ni corrige precios artificialmente; cualquier reparación del dataset requiere verificar que los resultados válidos anteriores no cambian y documentar la semántica de continuidad sintética.
- QA histórico del estadio detectó también una prueba que exigía 20m de separación entre cintas con distancia real muestreada de 16.8m entre Muybridge y Genesis, sin intersección; se fijó un requisito explícito de más de 10m para no confundir separación estrecha con solape.
- Una prueba antigua exigía parámetro cache `alpha19-...`; la nueva versión del broadcast conserva ese prefijo. Estado de los demás controles: verificar el CI más reciente, no inferir éxito por una ejecución antigua.

## Pendientes ordenados para próximos cambios
1. **P0:** CI de rama y 3 carreras completas en Chromium; comprobar preview, doce modelos, largada, meta, resultado, replay y vuelta a LIVE. Probar versión servida por Hostinger sólo luego de integrar.
2. **P1:** homologar coordenadas y tangentes de `threeCoursePreview.js` con `trackPoint()`, evitar solapes, gateras y metas propias. Reconciliar vista aérea del recinto con el trazado elegido en broadcast; no duplicar terreno o clima.
3. **P1:** migrar controladamente los consumidores al contrato de carrera y conservar rutas legadas; comparar winner/podio/participantes/hora en archivo, transmisión, fixture y estadísticas.
4. **P2:** MERVAL como mercado piloto, con dataset identificado y sesiones BYMA verificadas; recién después reutilizar el adaptador en las otras sedes.
5. **P2:** arquitectura específica, materiales, cámaras, iluminación, cartelería, público y LOD por mercado. Medir FPS, draw calls y GPU antes de afirmar AAA.
6. **P2 seguridad:** revisar secretos y permisos del deploy; documentos anteriores mencionan exposición histórica de `.ssh_pass`. El árbol del `main` usado aquí **no muestra ese archivo**, pero esto no descarta su presencia histórica ni acredita una rotación; tratar cualquier credencial que haya sido expuesta. Mantener apuesta real, pagos y retiros fuera de alcance.

## Criterios de evidencia
Estados admitidos: **PLANIFICADA**, **IMPLEMENTADA EN RAMA**, **VALIDADA LOCALMENTE**, **FUSIONADA**, **PUBLICADA**, **VERIFICADA EN HOSTINGER**.
Un test de Node no sustituye Chromium con WebGL; HTTP 200 no sustituye una carrera completa. La siguiente entrada deberá registrar SHAs, nuevas capturas de pantalla, CI y versión efectiva publicada. No adjudicar FPS inventados.
