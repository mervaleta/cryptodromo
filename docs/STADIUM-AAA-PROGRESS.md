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
- `tests/stadium-aaa-audience.mjs`, `tests/stadium-aaa-audience-browser.mjs` y `tests/stadium-aaa-audience-comparison.mjs`.
- `.github/workflows/stadium-aaa-audience.yml`.
- `docs/stadium/STADIUM-AAA-VISUAL-BIBLE.md`.
- `tests/stadium-live-integration.mjs` y `tests/winner-replay-env-contract.mjs` (claves esperadas de caché sin alterar el motor).
- Este checkpoint.

## Pruebas y capturas
- Contrato Node: `node --experimental-default-type=module --test tests/stadium-aaa-audience.mjs tests/stadium-clean-photo-finish-tv.mjs`.
- Capturas de Chromium real: workflow `Satoshi AAA audience - real browser and crowd geometry`, artefacto `satoshi-aaa-audience-render`. Vistas: panorámica diurna, railcam diurna, railcam nocturna y óvalo.
- **CI de audiencia verificado:** Actions #41960445118 completado con geometry SUCCESS y webgl SUCCESS. Chromium/WebGL renderizó y subió 4 capturas reales, artefacto #13385815192. Capturas todavía por inspeccionar visualmente antes de aprobar calidad. La prueba inicial falló por selector oculto, corregida y validada en ejecución sucesiva.
- Producción de Hostinger: sin evidencia postintegración; PR no fusionado.
- Rendimiento: sin medición FPS por GPU ni visual review. Los draw groups son presupuesto estático, no fps.

## Iteración 2 · pabellón VIP estructural, balcón y cubierta (código integrado; QA en curso)
- Problema confirmado en geometría: cuerpo principal con base y=4.5, fundación hasta y=1.215, discontinuidad visual ~3.285m. Implementada planta baja con dos alas, vestíbulo, columnas que llegan al suelo y pórtico soportado.
- Añadidos accesos acristalados, capiteles, entablamento, balcón continuo, barandillas, cornisa denticulada, elementos de cubierta y frontón central entre torres.
- Nuevos materiales: piedra clara, hierro verde azulado, bronce, vidrio y lentes emisivos cálidos en nocturna, sin agregar nuevos focos dinámicos.
- Nueva geometría independiente: visual-lab/satoshiPavilionDetail.js, posición relativa al mismo grupo VIP, limitación de footprint local X [-35.5,35.5], Z [-5.2,14.6]; sin invadir pistas ni cambiar cámaras.
- Rendimiento: InstancedMesh con geometrías reutilizables; eco desactiva sólo ornamentación, no soportes; dispose libera recursos.
- Tests: tests/satoshi-pavilion-detail.mjs y tests/muybridge-clubhouse-browser.mjs, con capturas reales en tres pistas de día y noche. Workflow .github/workflows/muybridge-clubhouse.yml.
- Cache bust en visual-lab/index.html, stadiums/crypto/broadcast/index.html y contratos que verifican URLs correctas.
- Referencias: https://www.kentuckyderby.com/living-traditions/twin-spires/ ; https://sah-archipedia.org/buildings/KY-01-111-0018 ; https://old.palermo.com.ar/es/institucional/c/tribunas .
- Estado de QA: ejecución disparada para revisión, todavía no aprobada al registrar este punto. Falta comparación visual antes/después y medición FPS.
- Deuda: ventanas originales aún usan paneles planos; falta profundidad de huecos, mejores materiales, contraste de sombras y revisión desde cerca.

## Iteración 3 · público de las tribunas históricas (código integrado; pendiente de verificación WebGL)
- Hallazgo: scene.js conservaba dos mallas antiguas (torso cilíndrico + cabeza esférica) para entre 260 y 980 aficionados. La primera iteración solo corregía el público de las gradas de proximidad.
- Nuevo módulo visual-lab/stadiumGrandstandCrowd.js construye figuras completas instanciadas: torso, cabeza, pelo, brazos, manos, pantalones, zapatos y sombreros.
- Se conservaron las ubicaciones x/y/z, filas, rotación y colores del generador original mediante la misma semilla fija. No se cambió el evento de fotofinish ni la animación de banderines.
- El gobernador de calidad ahora usa grandstandCrowd.setPopulation() para reducir grupos proporcionalmente, sin amputar partes ni superar el aforo de las mallas.
- El interruptor de público sigue ocultando todas las partes; se incorporó liberación de mallas y materiales en pagehide, e instrumentación de solo lectura en audience-qa=1.
- Contrato nuevo tests/stadium-grandstand-crowd.mjs, CI del estadio ampliada. Pruebas Chromium de audiencia verifican ambos sistemas.
- Nuevas URLs de escena cache-busted a satoshi-grandstand-people-20261105-v3; tests de referencias de versión también actualizados.
- Comparación reproducible: el workflow de audiencia ahora inicia dos servidores, uno desde baseline b5b0bd6 y otro desde la rama, para six capturas pareadas (panorámica, rail de día y noche) a través de tests/stadium-aaa-audience-comparison.mjs.
- Estado de CI: ejecuciones de esta iteración disparadas, algunas en cola; no afirmar aprobación visual ni datos de rendimiento por el solo cambio.
- Pendiente: inspección de las capturas reales, chequeo de que los nuevos brazos y sombreros no ocluyen a los caballos, y métricas FPS en dispositivos reales.

## Iteración 4 · inspección REAL, corrección de transmisión y presupuesto de draw calls (2026-11-05)

**Evidencia examinada, no inventada:** se descargaron y revisaron los PNG reales de GitHub Actions `#41960445118` (artefacto `13385815192`: panorama, railcam día/noche y óvalo) y de `#41962178792` (artefacto `13386620743`: tres recorridos día/noche). Esas capturas iniciales NO permiten aprobar AAA: el pase de lista cubría la escena con una máscara casi negra, la automática podía estar en noche cuando el archivo decía 'day', la cámara aérea no fotografiaba el pabellón de cerca y el perfil software GPU omitía ornamentación.

**Implementado en la rama, pendiente de nueva captura visual certificada:**
- `visual-lab/index.html` y `stadiums/crypto/broadcast/index.html`: composición de presentación con velo oscuro concentrado a izquierda, transparencia progresiva hacia 3D, tarjeta de corredor menor, franja de roster más ligera, versión móvil. La máscara previa de fondo completo hacía inútiles varias capturas.
- `visual-lab/scene.js`: toma de arquitectura `architecture` apuntando al pabellón VIP; se añade a los dos selectores de cámara. No altera director de transmisión ni posiciones oficiales. QA de ornamento activado y diagnóstico de lotes escenográficos.
- `tests/muybridge-clubhouse-browser.mjs`: ahora activa modo manual de QA sin pase de lista, fuerza verdadero mediodía y calidad equilibrada, registra fachada y cuatro vistas por trazado en día/noche y exige ornamentación realmente renderizada.
- `tests/stadium-aaa-audience-browser.mjs`, `tests/stadium-aaa-audience-comparison.mjs`: manual y calidad equilibrada para no confundir una máscara o modo eco con escena aprobada. Comparación baseline/candidato y medición aproximada de frame pacing SwiftShader, expresamente NO equivalente a FPS en GPU real.
- `tests/stadium-presentation-visibility-browser.mjs`: pasa la presentación real de corredor por el DOM/Three y comprueba el velo 90° que respeta el estadio, de día y noche.

**Rendimiento escenográfico medible en teoría (ahorro no medido todavía con GPU):**
- `visual-lab/stadiumStaticBatches.js` reemplaza exactamente 404 parantes de baranda, 100 postes de cierre exterior y 78 marcadores individuales (582 objetos) por tres InstancedMesh, conservando x/y/z y dimensiones. El ahorro potencial es de 579 grupos de dibujo.
- Los árboles perimetrales que antes eran hasta 3 piezas por árbol (155 árboles, hasta 465 meshes en escritorio) pasan a no más de cuatro InstancedMesh; se conserva distribución por semilla y márgenes de pista. Ahorro potencial de hasta 461 grupos extra.
- `tests/stadium-static-batches.mjs` verifica posiciones extremas, dimensiones, liberación de recursos y no ocupación de carriles. En navegador, `?stadium-perf-qa=1` expone estadísticas de solo lectura.
- `visual-lab/stadiumBackdrop.js` da parapetos asentados sin huecos y vidrieras instanciadas al horizonte de edificios; emisión nocturna controlable, ocultación de arbolado por control TV y liberación de geometrías. Se agregan sólo dos lotes 3D para parapetos/ventanas en comparación con las cajas sin detalle.
- Se agregó cancelación de ejecuciones obsoletas **solo** al workflow propio `stadium-aaa-audience.yml` para reducir saturación de CI por commits sucesivos; ningún workflow de otros agentes fue alterado.

**Barreras actuales, no negociar:** los jobs de GitHub Actions más recientes permanecían EN COLA a la última consulta. El éxito `#41962178792` certificó carga WebGL/contratos pero sus PNG aún estaban oscurecidos por presentación y cámara inadecuada; la nueva batería corrige la cobertura, pero NO se puede declarar que ya pasó sin nuevos resultados. Falta revisar la estética de las capturas posteriores al ajuste, FPS con GPU real, y validar el deploy de Hostinger; PR #115 sigue draft y sin publicar. Auto seguimiento de hora activado por pedido del usuario.

## Estado de pruebas concurrentes
- Audiencia y geometría: PASS en Actions #41960445118; cuatro capturas Chromium reales.
- Satoshi Nakamoto Stadium: PASS en #41960445027.
- Stadium clean/photo finish/director: contratos PASS, pero Chromium FAIL en #41960445067 por timeout esperando la transición a Genesis (test browser línea 51); investigar antes de integrar. No está demostrado que la PR haya introducido la falla.
- Alpha17 camera console: run #41960445018 CANCELLED; no certificada.
- Dos contratos inicialmente fallaron por la URL con caché vieja de scene.js; actualizados a la nueva clave y el workflow Satoshi ahora pasa.

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
- Capturas comparables baseline/branch y Hostinger pendientes. El script adicional `tests/stadium-aaa-audience-comparison.mjs` requiere ambos servidores (4173 candidato, 4174 baseline) y aún no se ejecutó en CI.
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

## Iteración 5 · guardas de evidencia WebGL (2026-11-05)
- Main verificado en `fbb115a69136dc767930f809905cbb4c927ed1ad`, dos commits posteriores al ancestro común `b5b0bd673a4a4827f74f360f55976e9d9b66917a`; se trata de un cambio BTC revertido, no rebasar ni modificar el trabajo de ese agente sin revisión.
- PR #115 sigue draft y sin merge. El endpoint de estado combinado no reportó statuses para HEAD `6552d406ef708891da3690dc828e9cb05e62667f`; esto NO confirma ni niega los resultados de GitHub Actions, que deben revisarse en la pestaña Checks.
- Defecto crítico del proceso de QA: `stadium-aaa-audience-comparison.mjs` podía producir seis PNG y JSON de pacing aun con WebGL no inicializado o errores JavaScript. Se incorporaron aserciones de contexto WebGL, tamaño de canvas, fotogramas y errores de ejecución en cada vista. Commit `9ac65bdda5f0288a9e0a26d99323da598262a79f`.
- Esta corrección es de test, NO corrige ni certifica estética, arquitectura o rendimiento del estadio. Capturas nuevas, inspección humana, tres pistas y GPU real siguen pendientes. Mantener PR en draft; no fusionar ni publicar.

## Iteración 6 · evidencia sin velo y revisión CI (2026-11-05)
- Main actual: `40bb62b26c657a48552700ba7313aae01d1ecea7`. PR #115: draft, mergeable, HEAD previo `2273e28bdcedb29caf182534f67536ce05098165`. No se integró ni publicó.
- CI del HEAD 2273e28: audiencia WebGL/geometry PASS (run 41968729855), pabellón PASS (41968729630), estadio PASS (41968730387). Fallas independientes: Alpha17 camera run 41968729653, screenshot timeout de 40 s en tests/alpha17-camera-browser.mjs:108; clean/photo finish run 41968729659, waitForFunction timeout de 15 s en tests/stadium-clean-photo-finish-browser.mjs:51. No está demostrado que sean regresiones de esta PR; no silenciar fallas ni modificar tests de otros agentes sin diagnóstico.
- Riesgo visual prioritario confirmado en el checkpoint previo: las capturas comparativas podían estar tapadas por la presentación. Se ajustó `tests/stadium-aaa-audience-comparison.mjs` para entrar a modo manual y verificar explícitamente que ni `is-presenting` ni el overlay visible cubren cada captura; timeout de screenshot ampliado a 45 s. Commit `aaf307145ae542775bc1820f70e2c023b3cee736`.
- La API GitHub expone artefactos pero no sus PNG binarios en esta conexión; no fue posible inspeccionar visualmente los últimos screenshots. Este cambio de test necesita nueva ejecución CI, capturas inspeccionadas y benchmark GPU real. La condición AAA sigue NO CUMPLIDA.
- Próximo: verificar que el baseline antiguo soporta el paso a modo manual; si falla, adaptar el fixture sin desactivar la aserción de visibilidad del candidato. Comparar imágenes reales de las tres pistas, conservar PR draft.
