# STADIUM-AAA-PROGRESS
**Hipódromo Satoshi Nakamoto · checkpoint 2026-11-04 ART / 2026-11-05 UTC**
**Decisión:** TODAVÍA NO ES ESTADIO AAA. No afirmar publicación ni certificación visual.

## Baseline verificable
- Base de esta rama: main `b5b0bd673a4a4827f74f360f55976e9d9b66917a`.
- Rama aislada: `feat/satoshi-aaa-audience-20261105`.
- Mejor versión visual conocida: **no certificada en esta sesión**. Hay cambios preexistentes de PR #102/#104 en main, que no deben deshacerse.
- Archivo principal del estadio: `visual-lab/scene.js`; entorno de gradería instanciada: `visual-lab/stadiumDensity.js`.
- URL del sitio: https://race.cryptodromo.com/visual-lab/ y https://race.cryptodromo.com/stadiums/crypto/live/ (NO validadas después de este PR).
- Archivo de criterios y referencias: `docs/stadium/STADIUM-AAA-VISUAL-BIBLE.md`.

## Iteración 1: espectadores humanos instanciados [código listo, QA pendiente]
1. Reemplazó el cuerpo cilíndrico y cabeza esférica aislados por ocho grupos instanciados de silueta articulada: torsos, cabezas, pelo, brazos, manos, piernas, zapatos, sombreros.
2. Ropa, piel, pelo y postura varían por semilla fija; algunos espectadores levantan un brazo. Sin `Math.random()`, sin nuevas dependencias, sin luces ni sombras por persona.
3. Mantiene el público detrás de la valla, en `z<=-36.5` (centros de fila), lejos del límite de carrera `z=-20.2` y de la barrera `z=-31.5`.
4. Conserva geometrías y materiales compartidos, recursos liberados por `dispose()`; ocho draw groups de público, cualquiera sea la población.
5. Instrumentación QA de solo lectura con `?audience-qa=1`, aislada del motor de carrera.
6. Actualiza cache chain `stadiumDensity.js` -> `scene.js` -> `visual-lab/index.html` y `stadiums/crypto/broadcast/index.html`.
7. No modifica ganador, precios, fixture, caballo BTC, rigs, apuestas ni ningún activo financiero.

## Archivos modificados
- `visual-lab/stadiumDensity.js` (siluetas, vestuario, postura, estadísticas).
- `visual-lab/scene.js` (versión de import y QA no mutable).
- `visual-lab/index.html` y `stadiums/crypto/broadcast/index.html` (cache).
- `tests/stadium-aaa-audience.mjs` y `tests/stadium-aaa-audience-browser.mjs`.
- `.github/workflows/stadium-aaa-audience.yml`.
- `docs/stadium/STADIUM-AAA-VISUAL-BIBLE.md`.
- Este checkpoint.

## Pruebas y capturas
- Contrato Node: `node --experimental-default-type=module --test tests/stadium-aaa-audience.mjs tests/stadium-clean-photo-finish-tv.mjs`.
- Capturas de Chromium real: workflow `Satoshi AAA audience - real browser and crowd geometry`, artefacto `satoshi-aaa-audience-render`. Vistas: panorámica diurna, railcam diurna, railcam nocturna y óvalo.
- **Estado a la creación:** CI por ejecutar y capturas por inspeccionar. No confundir código de screenshot con haber visto el render.
- Producción de Hostinger: sin evidencia postintegración; PR no fusionado.
- Rendimiento: sin medición FPS por GPU ni visual review. Los draw groups son presupuesto estático, no fps.

## PR activos/conflictos
- PR #100, #99, #89 y #64: familia BTC, NO TOCAR. PR #95: agenda mundial; PR #84: identidad CRC.
- PR #102 y #104 introdujeron cambios recientes en escenario/cámaras; la rama parte de main con esos cambios y no los revierte.
- No se modifican `race-lab/source/src/data/`, `racers/`, `parade/scenery.js` ni la programación.
- Antes de fusionar: comparar contra el main **del momento**, no el baseline histórico; repetir tests de integración.

## Defectos todavía abiertos (P0/P1)
- Público necesita evaluación cercana real: sombreado, poses coherentes con asientos, estabilidad en distintas cámaras; estático sin reacción sincronizada a largada/meta.
- Verificar que las tres pistas son simultáneamente coherentes desde vista general y que edificios, vegetación y accesos no invaden sus barreras (no basta un control sólo de público).
- Arquitectura del pabellón: vanos profundos, marquesinas, soportes, escalinatas, palcos y encuentros con graderías todavía no aprobados.
- Césped/tierra/sintética: repetición de textura, drenajes, rugosidad y polvo pendiente de benchmark.
- Iluminación nocturna y lluvia: requieren luminancia física legible, sin fog artificial excesivo.
- Cámara de meta, transmisión y rendimiento en móviles modestos: no aprobados como AAA.
- Capturas comparables baseline/branch y Hostinger pendientes.
- QA de seguridad e integridad global fuera del cambio de escenario no está completo.

## Próxima acción exacta para otro agente
1. Abrir la rama y PR, leer los resultados de CI. Si el mock o la escena WebGL fallan, corregir la rama; no fusionar por compilar.
2. Abrir las cuatro capturas `satoshi-aaa-audience-render` y comparar con las escenas anteriores desde las mismas cámaras. Registrar puntos flojos y una decisión visual explícita.
3. Medir FPS 5p, media, draw calls y memoria en escritorio real y emulación móvil con doce corredores; no confundir SwiftShader con GPU de consumo.
4. Tras aprobación visual, fusionar con main actual, comprobar versiones `?v=` de Hostinger y repetir capturas públicas de las tres pistas.
5. Continuar con geometría de fachadas/cubiertas y materialidad PBR; actualizar este archivo tras cada iteración.

## Criterios pendientes de aceptación
[ ] Capturas reales revisadas y aprobadas en 8 posiciones de arquitectura, 7 de competencia, 6 de ambiente y 6 de rendimiento.
[ ] Sin intersecciones en pistas, edificios, tribunas, caminos o vegetación.
[ ] Compensación visual nocturna diurna y clima, sin errores WebGL.
[ ] 12 caballos y 60 s por carrera, con tres ciclos de 180 s sin regresiones.
[ ] Referencias de rendimiento 30 FPS modestos / 60 FPS escritorio capaz.
[ ] Comprobación del commit real servido por Hostinger.
[ ] Evidencia de ninguna regresión respecto del baseline.

**No declarar `Candidato AAA` por pruebas de Node; sólo después de la revisión visual completa.**
