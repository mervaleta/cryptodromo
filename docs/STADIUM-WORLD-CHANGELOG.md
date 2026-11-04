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
