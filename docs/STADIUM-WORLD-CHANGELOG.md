# Cryptódromo World · bitácora de preparación (sin desplegar)
Corte de integración: `main` en `7c28e14afa418767a0b56fde1f62cbe55b611d88` (04-11-2026).  
Rama aislada: `prep/stadium-world-integration-20261104`.  
**Estado general: IMPLEMENTADO EN RAMA; 47 pruebas de contratos aprobadas en GitHub Actions (SHA `3689badc`), pendiente de revisión del HEAD y aprobación visual en Chromium/Hostinger.** No se fusionó ni desplegó.

## 2026-11-04 · SATOSHI v2 · fixture semanal íntegro + tres recorridos 3D
**Esta entrada actualiza el estado de los hallazgos y pendientes históricos descritos más abajo.**

### Fixture corregido, trazabilidad y archivo
- `race-lab/source/src/data/raceFixture.js` añade `getContinuousFixturePrice(symbol, absoluteMinute)` sin reescribir los 10.080 precios de minuto originales por activo. En el borde de la semana, continúa desde el precio final en vez de regresar abruptamente al precio inicial.
- `tripleRaceFixture.js` consume esta lectura continua y expone `TRIPLE_FIXTURE_VERSION='alpha19-triple-v2-continuous-week'`, `trackRaceNumber` (1–480 por pista) y `venueRaceNumber` (1–1.440 por jornada), preservando `number` para compatibilidad.
- El defecto afectaba la continuidad de las dos últimas carreras de la jornada 7 (minutos 1438 y 1439, Genesis y Vint Cerf). No se alteran ganadores válidos anteriores, algoritmos de ranking, coeficientes ni fixtures Alpha18.
- `worldRaceRecord.js` conserva las referencias legadas y propaga la versión explícita del fixture Alpha19.
- `tests/satoshi-complete-fixture-week.mjs` recorre exactamente 7 × 1.440 = **10.080 carreras, 120.960 participaciones y tres conjuntos de 3.360 carreras**; valida precios, límites de volatilidad, roster, horas y clasificación oficial.
- `scripts/audit-satoshi-week.mjs` exporta resultados de toda la semana (CSV), resumen por pista y SHA-256 del manifiesto. Es demostración reproducible, no cotización real ni base apta para apuestas.

### Tres pistas físicas · museo 3D
- **Muybridge:** óvalo principal de tierra, con perímetro visible y largada/meta común.
- **Genesis:** recta diagonal independiente al norte, de superficie sintética, gradas propias y conexión por paseo exterior.
- **Vint Cerf:** trazado en S sobre césped, dentro del infield de Muybridge, desplazado de la tribuna histórica para evitar que la pista atraviese edificios.
- `visual-lab/threeCoursePreview.js` centraliza la transformación espacial, añade seis mallas de banda de pista, barandas/postes, once separadores de carril por trazado, marcas de salida/meta, arcos rotulados, torres de iluminación, caminos y gradas Genesis; calidad variable y liberación explícita de recursos.
- `estadio/index.html` y `estadio/estadio.js` presentan selección y cámara de enfoque de las tres pistas, telemetría QA y actualización de caché. En el broadcast, `visual-lab/scene.js` vincula automáticamente Muybridge→tierra, Genesis→sintética y Vint→césped, sin cambiar datos deportivos.
- Muestreo geométrico exige al menos 10 m de separación entre bordes modelados; **no sustituye** revisión humana de texturas, cámara, accesibilidad o clipping 3D de toda la escenografía. El broadcast sigue utilizando una única pista renderizada por canal, sin montar tres WebGL simultáneos.

### Calidad verificada y pendiente
- **Validado en GitHub Actions:** contrato deportivo de semana completa, compatibilidad con Alpha18/Alpha19, diseño geométrico y 47 pruebas de Node sobre el SHA `3689badc`; resultado 47/47.
- **Pendiente de corroboración en el HEAD definitivo:** Chromium con Three.js y capturas de cada pista/estado; prueba completa del canal seleccionado y de vuelta a LIVE; empaquetado del manifiesto CSV; revisión de desempeño móvil y conformidad estética AAA.
- **No publicado:** Hostinger todavía puede servir versiones previas. No activar apuestas reales sobre resultados sintéticos conocidos por adelantado.

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

## Hallazgo histórico de CI · corregido en SATOSHI v2
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
