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


## Iteración 7 · publicación verificada, fallas de CI y fachada VIP (2026-11-05)
- **PUBLICACIÓN:** main actual comprobado `40bb62b26c657a48552700ba7313aae01d1ecea7` (revisar si cambió posteriormente); `visual-lab/index.html` en main sigue cargando `scene.js?v=muybridge-clearance-20261104-v3` y NO contiene cámara `architecture` ni ajustes AAA. Rama PR #115 usa `scene.js?v=satoshi-pavilion-frieze-night-20261105-v7`. Por lo tanto los cambios AAA siguen únicamente en la rama GitHub; no afirmar publicados en Hostinger. Web externa inaccesible desde el entorno de esta ejecución y DNS del contenedor no resolvió el dominio.
- HEAD 2273e28: Satoshi Stadium PASS run 41968730387; audiencia geometry+WebGL PASS 41968729855; pabellón geometry+WebGL PASS 41968729630. **NO integrar sólo por estos éxitos:** Alpha17 camera FAIL run 41968729653 (screenshot de Parade al final de la prueba agotó 40 segundos), photo-finish/director FAIL run 41968729659 (transición Genesis sin completarse en 15 s). Los contratos de photo finish sí aprobaron.
- Correctivo de QA #1: `tests/alpha17-camera-browser.mjs` captura ahora píxeles reales directamente por Chrome DevTools Protocol en lugar del protocolo Playwright con timeout tras cargar fonts. Conserva la captura, la validación de las cámaras y los controles.
- Correctivo de QA #2: `tests/stadium-clean-photo-finish-browser.mjs` espera específicamente el iframe **del nuevo canal Genesis** y verifica que el estado `ready` y transición finalizada corresponden al mismo canal. Aumenta el presupuesto de espera para SwiftShader a 45 s, pero sigue fallando si la transición realmente no termina y deja telemetría diagnóstica.
- Evidencia fotográfica REAL revisada: `satoshi-aaa-audience-render` artifact #13389900624 (run 41968729855) y `muybridge-clubhouse-three-courses` artifact #13388519733 (run 41968729630). La fachada capturada en `muybridge-clubhouse-genesis-architecture.png` muestra el cartel de 64×4.7 m ocultando la planta superior, y el pabellón nocturno muy oscuro. El estadio no llega a AAA visualmente.
- Correctivo arquitectónico: el cartel `CRYPTÓDROMO · SATOSHI NAKAMOTO` pasa de y=18.2,z=-72,w=64,h=4.7 a la placa discreta sobre pórtico y=7.7,z=-67.5,w=42,h=1.65; se recupera la lectura de ventanas y cornisas. Test de clearance actualizado.
- Iluminación VIP: dos luces SpotLight con temperatura cálida, sin sombras, dentro del límite de explanada y separadas de los reflectores de carrera. Sólo se encienden en `night` y calidad balanced/high. Calidad eco las apaga; pruebas de instancia/estado ambiental y capturas WebGL actualizadas.
- Import `satoshiPavilionDetail.js` y página `scene.js` con clave de caché nueva v7. No cambiar caballo BTC, pricing, fixture, apuestas o carrera.
- Metría SwiftShader del artefacto previo: frame pacing extremadamente lento (aproximadamente 2–4 FPS en headless software rasterizer en vistas evaluadas), NO extrapolar a GPU real. Muestras y tiempos se guardan en JSON; las tasas corresponden a entorno CPU y son insuficientes para aprobación de rendimiento.
- **Estado:** PR #115 permanece draft, no fusionada ni publicada. Tests más recientes lanzados por los commits; verificar sus conclusiones y revisar fotografías nuevas antes de cualquier deploy. Próximo paso: analizar nuevas imágenes de fachada y canal Genesis, y resolver regresiones verdaderas si los checks siguen fallando.

## Iteración 8 · revisión independiente de PNG y cola CI (2026-11-05 02:44 ART)
- PR #115 sigue draft, HEAD `77ecaff70ad20e543b75cb87e3419e1b2a575105`; main `40bb62b26c657a48552700ba7313aae01d1ecea7`. Comparación GitHub: rama 96 commits adelante, 6 detrás; no rebase automático por trabajo concurrente.
- Descargado y abierto el ZIP real de Actions #41968729855, artefacto `13389900624`, 12 PNG + frame-pacing JSON. Se revisó mosaico de imágenes reales, no sólo metadatos. `03-rail-night.png` y `comparison/after-rail-night.png` presentan oclusión masiva del encuadre por cubierta oscura y estructura transversal: la cámara rail no permite leer pista/caballos en esa toma. En `02-rail-day.png` una columna negra atraviesa el primer plano; `01-overview-day.png` muestra horizonte deslavado y pista poco legible. Estas capturas son del HEAD previo a la iteración 7, no demuestran que la nueva iluminación o placa corrijan la cámara.
- Clasificación P0 visual: encuadre rail nocturno tapado por techo/estructura. No mover cámaras compartidas ni caballos sin diagnosticar la geometría y la intención del director de TV; antes de corregir, exigir screenshot del nuevo HEAD y una prueba de visibilidad desde rail día/noche. Evitar aprobar por aserciones DOM/WebGL.
- En HEAD 77ecaff, Actions `41974287189` Satoshi Stadium SUCCESS y `41974287108` Starting Gates SUCCESS. Audience `41974287301`, pavilion `41974287288` y photo finish `41974287099` todavía QUEUED; Alpha17 `41974287239` IN_PROGRESS al consultar. No confundir checks parciales con aprobación del conjunto.
- Bloqueo temporal: faltan los nuevos PNG del HEAD para evaluar placa, focos y cámara; no fusionar ni publicar. FPS GPU real y revisión de las tres pistas siguen pendientes.

## Iteración 9 · CI de pabellón y reparación del contrato (2026-11-05)
- Main comprobado `40bb62b26c657a48552700ba7313aae01d1ecea7`; rama 97 commits por delante y 6 por detrás, sin rebase ni fusión.
- En Actions `41974287288`, WebGL del pabellón PASS pero geometry FAIL: `tests/satoshi-pavilion-detail.mjs:69` intentaba iterar `layer.children` sobre dos `SpotLight` directos añadidos a la raíz; `TypeError: layer.children is not iterable`. Es un error de la prueba, no evidencia de geometría rota.
- Corrección `5aa34273cda8f68d9efa6173cb56a8534b4dc671`: distinguir grupos de lotes instanciados de focos directos, exigir que estos sean `THREE.SpotLight` y que no proyecten sombras; mantener comprobación de todos los lotes y de limpieza GPU. **Esperar CI nuevo antes de declarar PASS**.
- Actions `41974287099` photo-finish contratos y Chromium PASS; `41974287301` geometría audiencia PASS y WebGL CANCELLED; `41974287239` cámara CANCELLED pese a pasos de QA completos. No tomar cancelaciones como aprobación.
- P0 visual previo: cubierta/columna ocluye railcam nocturna. Sin nuevas capturas visualmente revisadas del HEAD corregido ni FPS GPU real, no se certifica AAA. PR #115 permanece draft; no publicar.


## Iteración 10 · diagnóstico CI real y reparación de capturas (2026-11-05)
- Main comprobado `40bb62b26c657a48552700ba7313aae01d1ecea7`; rama divergente 99 commits adelante y 6 detrás antes de estos cambios. PR #115 sigue aislada, draft, sin merge/deploy.
- CI en commit `d1254cd`: audiencia WebGL FAIL [41982475068](https://github.com/mervaleta/cryptodromo/actions/runs/41982475068) por `page.screenshot` timeout 30s en `tests/stadium-aaa-audience-browser.mjs:51`; el log confirma que fonts cargaron pero Chromium no entregó el screenshot bajo SwiftShader. Geometry PASS. Se reemplazaron cuatro capturas por `Page.captureScreenshot` de CDP, guardando los mismos PNG y exigiendo datos de píxeles no vacíos. Commit `c6bdc8aa270717127a12a4d861b2c3a9921568f5`; **requiere rerun y revisión de PNG**.
- Pabellón [41982475101](https://github.com/mervaleta/cryptodromo/actions/runs/41982475101): WebGL PASS, geometry FAIL porque el test trataba los `lamp.target` (dos objetos de dirección de SpotLight, hijos legítimos del root) como objetos no permitidos. Ahora exige exactamente dos SpotLight y dos targets únicos y valida que ninguna luz proyecta sombras, sin eliminar verificaciones de lotes ni dispose. Commit `1d01ace8c29f00085e1ad77c3c16067058c3c389`; **requiere rerun**.
- CI del mismo commit: Satoshi Stadium [41982475050](https://github.com/mervaleta/cryptodromo/actions/runs/41982475050), Alpha17 [41982475069](https://github.com/mervaleta/cryptodromo/actions/runs/41982475069) y photo finish [41982475058](https://github.com/mervaleta/cryptodromo/actions/runs/41982475058) SUCCESS.
- P0 visual sigue siendo la oclusión de railcam nocturna por cubierta/estructura, observada en PNG anteriores; no atribuir su reparación a estos cambios de pruebas. Falta inspección de nuevas capturas, validación de tres pistas, gameplay y FPS en GPU real. AAA NO certificado; NO fusionar/publicar.


## Iteración 11 · robustez de evidencia comparativa (2026-11-05)
- Main verificado `40bb62b26c657a48552700ba7313aae01d1ecea7`; PR #115 draft, HEAD anterior `19890d5558f41a81501ba4bda5397d04608f7533`, divergencia 102 adelante / 6 detrás. No se rebasó ni fusionó.
- La comparación `tests/stadium-aaa-audience-comparison.mjs` todavía usaba `page.screenshot()` pese al timeout SwiftShader ya observado en el test de audiencia. Se reemplazó por `Page.captureScreenshot` mediante CDP y se conserva la exigencia de datos PNG no vacíos, seis capturas, WebGL, frames, ausencia de errores y presentación desactivada. Commit `706791fb048488d0e36ad9704d5bfdb600d44215`.
- El conector GitHub disponible no expone listado de ejecuciones/artefactos de Actions y el contenedor no pudo resolver `api.github.com`; no se pudieron descargar ni inspeccionar capturas NUEVAS ni comprobar CI de este HEAD. Consultar https://github.com/mervaleta/cryptodromo/actions/workflows/stadium-aaa-audience.yml y artefacto `satoshi-aaa-audience-render` después de la ejecución. No atribuir éxito a este cambio antes del resultado.
- P0 visual sin corregir: cubierta/estructura tapa railcam nocturna en PNG previos. Este commit solo repara fiabilidad de captura; no es reparación de escena. Antes de alterar geometría o cámara compartida, comparar las capturas nuevas con el baseline y medir visibilidad de pista, de día y noche. Sin GPU real ni gameplay tres pistas, AAA sigue NO certificado; PR draft, no deploy.


## Iteración 12 · revisión de Actions 420022 y PNG reales (2026-11-05 07:21 ART)
- main sigue en `40bb62b26c657a48552700ba7313aae01d1ecea7`; PR #115 draft, HEAD previo `430baa56c02d73c0d5e8f0eee8e2c4fbfdd11588`, rama 104 commits adelante / 6 detrás. Sin merge, rebase ni deploy.
- CI HEAD previo: audiencia run https://github.com/mervaleta/cryptodromo/actions/runs/42002219878 geometry PASS, webgl FAIL: `after/rail/noon: no animation frames`. Pabellón https://github.com/mervaleta/cryptodromo/actions/runs/42002219955 geometry PASS, webgl FAIL: Playwright screenshot timeout 30 s. TV https://github.com/mervaleta/cryptodromo/actions/runs/42002219937 browser FAIL al hacer click en lluvia; fuera del alcance de esta iteración y no atribuido todavía a la PR.
- Artefacto REAL de audiencia https://github.com/mervaleta/cryptodromo/actions/runs/42002219878/artifacts/13404215743 descargado y revisado (11 PNG y pacing JSON). `03-rail-night.png` continúa casi enteramente tapada por cubierta oscura; `02-rail-day.png` contiene columna dominante. Además `comparison/after-overview-noon.png` y `comparison/after-rail-noon.png` muestran la pantalla `RESULTADOS CONFIRMADOS`, no una toma válida del estadio. El flujo de comparación avanza hasta resultados durante su ejecución prolongada. La aserción de WebGL por sí sola no evita ese falso positivo.
- Commit `2f37b48`: captura de pabellón por CDP con validación de PNG y bounds de #stage para evitar el timeout de Playwright, sin relajar controles de geometría, noche ni cámara.
- Commit `f7d3724`: comparación rechaza explícitamente capturas con resultados oficiales visibles. **No resuelve todavía** el estado de carrera ni la oclusión P0; exige nuevo fixture estable/manual antes de dar por buenas las capturas.
- Pendientes: reejecutar Actions en nuevo HEAD, revisar PNG de las tres pistas, resolver oclusión de rail sin modificar cámaras compartidas, medir FPS en GPU real. AAA NO certificado.


## Iteración 13 · CI HEAD 78cb69b y baseline histórico (2026-11-05 08:25 ART)
- main verificado `40bb62b26c657a48552700ba7313aae01d1ecea7`; PR #115 abierta y draft. No merge, rebase ni deploy.
- Actions de HEAD `78cb69b`: audiencia [42010165168](https://github.com/mervaleta/cryptodromo/actions/runs/42010165168) geometry PASS, browser WebGL inicial PASS, visibilidad de presentación PASS, pero comparación FAIL en `tests/stadium-aaa-audience-comparison.mjs:30` por timeout esperando quitar `is-presenting` del baseline histórico. Artefacto parcial real [13407171000](https://github.com/mervaleta/cryptodromo/actions/runs/42010165168/artifacts/13407171000), 7 archivos; no se inspeccionaron sus PNG en esta iteración, no hay aprobación visual.
- Corrección aislada `504bd6c`: en baseline `before` se elimina exclusivamente la capa DOM de presentación para comparación de arquitectura; no se altera el motor ni la escena ni el candidato. En candidato `after` se conserva la transición real a modo manual, con timeout 20 s y aserciones de visibilidad, WebGL, resultados oficiales y frame pacing. Necesita CI y comparación de PNG antes de afirmar PASS.
- Pabellón [42010165076](https://github.com/mervaleta/cryptodromo/actions/runs/42010165076) geometry/WebGL PASS. Estadio, cámara Alpha17 y fotofinish PASS en HEAD anterior. TV ambiente [42010165265](https://github.com/mervaleta/cryptodromo/actions/runs/42010165265) FAIL por timeout de `page.screenshot` en `tests/winner-replay-env-browser.mjs:72` después de confirmar slow motion y ganador; no se modifica ese test de otro ámbito. Hoof Terrain FX [42010166438](https://github.com/mervaleta/cryptodromo/actions/runs/42010166438) FAIL, fuera de alcance; diagnosticar responsable antes de atribuir regresión.
- P0 visual sin resolver: cubierta y columna obstruyen rail nocturna/diurna según capturas anteriores. Sin nuevos PNG inspeccionados ni benchmark GPU real ni gameplay tres pistas, AAA NO certificado. Mantener draft y no publicar.


## Iteración 14 · inspección directa de evidencia parcial (2026-11-05 08:40 ART)
- Se descargó y abrió realmente el ZIP de Actions #42010165168, artefacto #13407171000 (7 archivos: cuatro vistas, dos capturas de presentación y frame-pacing). Se construyó un mosaico de los seis PNG, inspeccionado visualmente. El run corresponde a HEAD `78cb69b`, NO a la corrección posterior `504bd6c`.
- `03-rail-night.png`: cubierta y travesaños negros ocupan prácticamente toda la vista de pista, aunque se distinguen puntos de iluminación. `02-rail-day.png`: columna negra vertical corta el primer plano; `01-overview-day.png`: horizonte excesivamente pálido y contraste insuficiente. `04-oval-clearance.png` muestra pista, pero no certifica gameplay ni todas las intersecciones.
- La evidencia de presentación muestra una pantalla de ganador durante la captura, útil para comprobar composición pero NO para evaluar pista limpia. La comparación baseline/candidato no generó sus seis imágenes porque falló antes, tal como indica el CI de ese run.
- Se mantiene P0 de oclusión real; no mover cámaras compartidas ni alterar geometría a ciegas. Próxima corrección requiere localizar exactamente el objeto de cubierta/columna y verificar un encuadre limpio con capturas de la nueva rama, en rail día y noche, sin alterar cámaras de otros agentes. No existe medición GPU real ni certificación de las tres pistas. PR #115 draft, sin merge/deploy.


## Iteración 15 · revisión del HEAD f57dcdd y evidencia WebGL nueva (2026-11-05 10:14 ART)
- Main actual verificado `3fa5393bf50ff189a955142aaa3c18da0cf7eca6`; rama `f57dcddcbc362323bf8a8843adc86dfa5bd9f68e`, 110 commits adelante y 11 detrás. Main incorporó TV PR #117 y cambios BTC concurrentes: **no rebase ni merge automático**.
- Actions del HEAD: audiencia [42020938960](https://github.com/mervaleta/cryptodromo/actions/runs/42020938960) SUCCESS; pabellón [42020939022](https://github.com/mervaleta/cryptodromo/actions/runs/42020939022) SUCCESS; estadio [42020939161](https://github.com/mervaleta/cryptodromo/actions/runs/42020939161) SUCCESS; cámara [42020939119](https://github.com/mervaleta/cryptodromo/actions/runs/42020939119) SUCCESS; foto-finish [42020938957](https://github.com/mervaleta/cryptodromo/actions/runs/42020938957) SUCCESS. Hoof Terrain FX [42020938996](https://github.com/mervaleta/cryptodromo/actions/runs/42020938996) FAILURE, fuera de alcance; no modificar el trabajo de otro agente.
- Descargado y abierto el ZIP **real** de audiencia, [artefacto 13411024839](https://github.com/mervaleta/cryptodromo/actions/runs/42020938960/artifacts/13411024839), 12 PNG y JSON de frame pacing. Capturas de HEAD f57dcdd, no de un commit antiguo.
- P0 visual CONFIRMADO: `03-rail-night.png` sigue mayormente negro, cubierto por cubierta y vigas que atraviesan la imagen; `02-rail-day.png` conserva columna dominante en primer plano. `comparison/before-rail-night.png` también presenta la oclusión, mientras `comparison/after-rail-night.png` muestra pista y corredores legibles en un momento distinto (00:52): evidencia de dependencia del momento/posición, NO de reparación consistente. Comparación no es equivalente temporalmente: before 00:00, after 00:52; panorama before 00:00 y after 00:05. La panorámica sigue muy pálida.
- Diagnóstico de código: en `visual-lab/scene.js`, modo `rail` posiciona la cámara relativa a `trackPoint` con offset normal 14 y altura 2.8; el punto de carrera y la cámara evolucionan con el tiempo. El test captura a ~00:00, mientras comparación captura a tiempos posteriores. Aún no está identificado inequívocamente el mesh o la geometría responsable de la oclusión; **no mover cámara compartida ni eliminar cubierta a ciegas**.
- Próxima acción: instrumentar una prueba de oclusión con raycast desde cámara a puntos visibles de la pista, registrar nombres/IDs de intersecciones y medir porcentaje de pantalla cubierto en posiciones de salida y carrera para día/noche; después aplicar corrección local al estadio con PNG de regresión del mismo timestamp. Repetir QA en las tres pistas, gameplay y GPU real. No se alteró escena ni tests en esta iteración porque el diagnóstico geométrico todavía es insuficiente.
- PR #115 sigue sin integración ni publicación; AAA NO certificado pese al CI verde parcial.
