# Bitácora obligatoria de versiones · Maestro BTC

**Referencia única para cotejar cambios:** https://race.cryptodromo.com/racers/#BTC

Cada agente que cambie el modelo BTC debe registrar una entrada y asegurar que la ficha principal refleje la nueva versión. El registro que ve el usuario en la ficha sale de `racers/btc-master-revision.json` y NO constituye, por sí solo, verificación de Hostinger.

## Línea de base · 2026-11-04

- `masterId`: `btc-maya-2017-sculpt-gallop-20261104`.
- `buildId`: `btc-master-hindquarters-20261104-v5`.
- `status`: `needs_fix`.
- Render público: `/racers/#BTC` con variante `maya`.
- **Sin modificación del modelo en esta entrada:** se establece política, control de versiones visible y backlog.
- Defectos visibles reportados: mechones oscuros del cuello, mechones laterales desunidos, zona transparente detrás de las orejas y ojo sin globo/pupila grande.
- El GLB modificado localmente en una intervención anterior no afectó al groom de la ficha y NO se considera corregido.
- Siguiente iteración tras sanear geometría: físicas de crin y cola guiadas por el video de fuentes `212734.mp4`.

## Plantilla para cada próxima iteración

### YYYY-MM-DD · build `<nuevo-buildId>` · PR/commit
- **Problema y capturas ANTES:** descripción, ambos perfiles, frente, atrás, detalle
- **Solución en archivos de producción:** geometría, shaders, rig, groom, imports, paleta
- **Capturas DESPUÉS:** mismas cámaras y parámetros, reposo/galope/transición
- **Build visible de la ficha:** versión, estado y URL `/racers/#BTC`
- **QA local:** tests de navegador, anatomía, integridad, otros 99 tokens
- **QA Hostinger:** SHA/build realmente servido, fecha y evidencia
- **Incidencias restantes:** lista actualizada
- **Resultado:** `verified` | `pending_deploy` | `needs_fix`

No declarar `verified` únicamente por editar un GLB, abrir PR, ajustar código o pasar pruebas unitarias.

## 2026-11-04 · `btc-master-neck-cleanup-20261104-v6` · iteración 1
- **Antes:** `btc-master-hindquarters-20261104-v5`; guías largas de crin extendidas hacia el hombro y filamentos ventrales aislados.
- **Implementación real en Three.js:** nacimiento más cercano al crest, atenuación progresiva de longitud al llegar a la cruz, fin de trayectorias en `y=-0.0038`, menor caída ventral y límite geométrico del borde inferior. Sin transparencia ni recoloreo.
- **Archivos:** `racers/btc-maya-groom.js`, `racers/btc-maya-master.js`, `racers/btc-atelier-preview.js`, `racers/racers.js`, `racers/index.html` y tests.
- **QA:** contador `neckOutliers` incorporado a la ficha de diagnóstico y al test navegador. Comparativa visual antes/después y pruebas completas aún pendientes.
- **Publicación:** `pending_deploy`. El cambio de versión `?v=` está preparado, pero todavía no hay comprobación visual de la nueva versión en Hostinger.
- **Pendientes:** validar geometría desde todos los ángulos; cerrar discontinuidad nuca/orejas; modelar ojos esféricos 3D e iris configurable; no comenzar físicas de crin/cola hasta validar geometría.

## 2026-11-04 · `btc-master-ear-root-seal-20261104-v7` · iteración 2
- **Anterior:** `btc-master-neck-cleanup-20261104-v6`.
- **Causa geométrica diagnosticada:** retirar 380 triángulos correspondientes a las orejas originales dejaba 52 aristas de corte abiertas, en dos regiones de la nuca (26 por lado). Las nuevas orejas eran mallas independientes, por lo que no cerraban esas aberturas.
- **Reparación real en Three.js:** se identifican componentes de borde en la malla original, se agregan dos centros de reparación y se triangulan los 52 bordes con índices del MISMO `SkinnedMesh`. Conserva la cabeza, cuerpo y rig Gallop; no usa una placa superpuesta.
- **Verificaciones automatizadas:** conteos `earCutBorderEdges`, `integratedEarRootCapTriangles` y `earRootCapCenters`. Los tests de anatomía y de producción requieren 52 bordes reparados, dos centros, 5409 vértices (5406 originales + tapa de grupa + 2 cierres de orejas).
- **Cotejo visual:** debe confirmarse con perfil izquierdo/derecho, frente, atrás y nuca durante reposo/Gallop. Sin capturas cotejadas todavía.
- **Estado:** `pending_deploy`, no declarar publicado o terminado hasta verificar Hostinger y la ficha canónica BTC.
- **Siguiente:** ojos esféricos 3D con iris independiente y pupila equina, seguido por pulido anatómico y QA de 12 corredores.

## 2026-11-04 · `btc-master-spherical-eyes-20261104-v8` · iteración 3
- **Antes:** `btc-master-ear-root-seal-20261104-v7`; ojos planos con disco único del color del iris y sin pupila equina.
- **Corrección Three.js:** dos globos reales (`SphereGeometry`), integrados en un único `SkinnedMesh` con rig original `Head`, normales propias, material PBR y shader de iris colorizable con `eyeColor`. Pupila negra ovalada horizontal independiente del color del iris; córnea especular con clearcoat controlado. Geometría alojada en las órbitas originales, no sprites ni discos flotantes.
- **QA:** se añadieron métricas `eyeGlobes`, `irisEditable`, `blackEquinePupils`; tests de anatomía, producción y build de ficha actualizados.
- **Validación visual:** pendiente capturar comparativas idénticas en perfil, frente y tres cuartos, con ojos claros/oscuros y Gallop. No se ha validado el sombreador en GPU de producción.
- **Hostinger:** `pending_deploy`; construir en GitHub no equivale a publicación. Verificar el build real en `/racers/#BTC`.
- **Próximo:** revisar y corregir los resultados de WebGL, pulir proporciones, LOD y pelo antes de comenzar físicas.

## 2026-11-04 · `btc-master-hero-silhouette-20261104-v9` · estilización Three.js
- **Comparación antes:** `btc-master-spherical-eyes-20261104-v8`. En capturas aportadas por el usuario, flequillo separado de la crin detrás de las orejas; hebras oscuras pegadas al lateral del cuello; globo ocular con aspecto saliente. La referencia objetivo es un caballo estilizado premium, de melenas y cola oscuras, largas y de trazos agrupados, silueta luminosa y cabalgata potente.
- **Generación geométrica:** `racers/btc-maya-groom.js` añade 112 guías de crin en la coronilla, interpoladas desde la línea del flequillo hasta el inicio de las raíces cervicales. Las guías del puente se vinculan a `Head` como el flequillo y solapan las raíces próximas al cuello. Se limita la excursión lateral de las hebras cervicales y su altura mínima al crest; se eleva el volumen dorsal para evitar fibras sueltas sobre la garganta. Además se construye un lecho de 495 vértices suavemente curvado y skinned con transición Head/cuello bajo las guías, para cerrar vacíos entre orejas sin placas flotantes.
- **Cola:** recorrido en la propia malla, más horizontal al inicio y con caída y abanico progresivos hacia las puntas, sin incorporar aún simulación física nueva.
- **Ojos:** en `racers/btc-maya-master.js` se reduce el radio del globo de `0.000445` a `0.000385`, se centra algo más dentro de la órbita y se atenúa el brillo; se mantiene iris `eyeColor` y pupila equina negra.
- **Anatomía y materiales:** sección cervical levemente más esbelta; pelaje de respaldo más cálido y menos áspero cuando no hay perfil publicado; crin con reflejos PBR suaves. La edición de colores publicada por caballo sigue teniendo prioridad.
- **Ficha real:** `racers/index.html` → `racers/racers.js` → `racers/btc-atelier-preview.js` → `racers/btc-maya-master.js` → `racers/btc-maya-groom.js`, todo con identificador `btc-master-hero-silhouette-20261104-v9`. Cámara superior y tres cuartos agregadas para cotejos y evitar dependencias de parámetros de laboratorio.
- **QA automatizado:** `crownBridgeLocks=112`, `neckOutliers=0`, `eyeRadius<0.0004`, Gallop preservado, mismos tests de otros 99 símbolos y capturas adicionales de detalle/superior/tres cuartos.
- **Antes/después en producción:** pendiente confirmar por navegador y revisar imágenes de WebGL con los encuadres oficiales. **No se afirma calidad AAA alcanzada sólo por código y tests.**
- **Estado hasta publicar y validar:** `pending_deploy`. No se ha alterado estadio, precio, fixture, clasificaciones ni lógica de juego.

## 2026-11-04 · `btc-master-sculpted-locks-20261104-v10` · volumen heroico de crin y cola
- **Antes:** `btc-master-hero-silhouette-20261104-v9`, verificable en Hostinger y con capturas de seis cámaras en GitHub Actions. Aunque el flequillo se conecta por encima de las orejas, el grueso de la crin todavía parecía una banda plana y la cola un abanico estrecho; ojos y orejas necesitan revisión.
- **Nueva geometría Three.js:** 56 mechones hero extra (28 por lado) con elevación arqueada, longitud hacia atrás, anchos y terminaciones cónicas diferenciadas, realmente modelados como cintas cruzadas tridimensionales y skinned sobre el rig original. El pelo de fondo se reduce de 624 a 448 guías finas en crin y de 360 a 280 en cola para evitar filamentos negros flotantes sin aumentar excesivamente buffers.
- **Cola:** se ensancha cada grupo mayor y aumenta la dispersión vertical progresiva y el arco aerodinámico; sin agregar todavía un nuevo simulador de física.
- **Orejas:** pabellones 24% más cortos y discretamente más anchos en `btc-maya-ears.js`, conservando hueso `Head` y paredes 3D. **Ojo:** leve corrección de la distancia a la superficie para que el iris sea visible sin restaurar el globo sobresaliente de v8.
- **Contrato visual:** sigue conectado el flequillo a 112 guías de coronilla y 495 vértices de lecho capilar con skinning graduado. El maestro expone `heroLocks=56`, `crownBridgeLocks=112` y `rootBedVertices=495`.
- **QA:** pruebas Chromium local, normal/public y sobre Hostinger; capturas de perfil, frente, atrás, detalle, superior y tres cuartos. No modificar `Gallop`, fixture, rangos ni el resto del plantel.
- **Ficha:** scripts y versión cache-busting `btc-master-sculpted-locks-20261104-v10`, manifest visible actualizado. **Estado `pending_deploy` hasta comprobar la build real.**
- **Pendiente de aprobación artística:** verificar si los mechones se leen como volumen continuo y no aspas. Ajustar proporciones de cabeza/cuerpo y materiales en iteraciones posteriores a partir de las capturas reales, no sólo por tests.

## 2026-11-04 · `btc-master-solid-groom-20261104-v11` · retirar láminas de pelo
- **Antes:** Capturas reales de `btc-master-sculpted-locks-20261104-v10` en Chromium/WebGL: al elevar los 56 mechones hero se observan bordes afilados y superficies tipo cartón, además de algunas cintas que parecían atadas al cuello. El problema es geométrico: cada guía estaba representada por dos cintas planas cruzadas, sin una sección volumétrica natural.
- **Solución Three.js:** el generador en `racers/btc-maya-groom.js` conserva las guías arraigadas, pero construye un loft de 18 segmentos y **6 vértices alrededor de cada sección**, con radio decreciente, marco tangente ortonormal, índices cerrados por anillo, normales suaves, material PBR y pesos del rig Gallop original. No hay texturas de sprites, planos de cámara, Maya runtime ni modelos precalculados externos.
- **Continuidad:** se conserva el lecho de 495 vértices detrás de las orejas, las 112 guías de transición de flequillo y los 56 mechones hero elevados. Los extremos se acotan a la zona anatómica superior del cuello para no volver a colgar filamentos en el lateral.
- **Optimización:** la carga cae a 928 mechones totales al disminuir los filamentos finos, sustituidos por volúmenes de verdad en lugar de máscaras de transparencia. Se mantienen piel, ojos, orejas, materiales por caballo y el galope original.
- **QA:** nueva métrica `solidRingSides=6` y tests contra la ficha normal pública, el editor, otros tokens y múltiples vistas. Los tests de número de fibras se ajustan al cambio cualitativo de topología y no declaran calidad por contar líneas.
- **Caché:** versión `btc-master-solid-groom-20261104-v11` en toda la cadena de publicación desde `racers/index.html`. Estado `pending_deploy`, pendiente de aceptación visual y de que Hostinger sirva el nuevo build.
- **Siguientes:** inspeccionar los volúmenes redondos en reposo/Gallop, revisar si se requieren grupos de mechones aún más volumétricos y finalizar colocación/expresión ocular y cola para lograr la referencia estilizada.


## 2026-11-04 · `btc-master-procedural-hind-groom-20261104-v12` · corrección anatómica y crin sin filamentos de garganta
- **Defecto observado:** imagen de `/racers/#BTC` compartida por el usuario: mechones oscuros aislados y largos cayendo desde la crin cervical, grupa poco potente, muslos estrechos y articulaciones posteriores poco naturales durante Gallop. **No se acepta como corrección una imagen renderizada**, requiere Three.js en la ficha real.
- **Base:** v11 `btc-sculpted-hair-tubes-20261104-v11`, para conservar sus tubos anulares de seis lados y no borrar el trabajo del otro agente.
- **Groom Three.js:** `btc-maya-groom.js`: drape lateral más corto y cercano a cresta dorsal; arquear menos los 56 hero locks; acortar guías mayores y reducir finos cervicales de 272 a 48, manteniendo 112 raíces principales, 112 del puente de la nuca, 56 hero locks y lecho capilar de 495 vértices. Eliminar extensión por debajo de la cresta mediante coordenadas geométricas (no ocultar con opacidad).
- **Textura generada por código:** capas microcuticulares ancladas a coordenadas de reposo en `onBeforeCompile` del groom; sin PNG, sprites, descarga de texturas ni desplazamiento de livery. `btc-maya-hindquarters.js` genera variación de pelaje y sombreado muscular con GLSL determinista sobre la grupa.
- **Anatomía:** nuevo `sculptBTCHindquarters(positions)` ensancha y redondea malla contigua de grupa, glúteos, muslos, gaskin. Aplicación estricta en espacio del mesh Maya antes del skinning; protege corvejones bajos, menudillos y cascos; no crea bolas o cilindros externos.
- **Movimiento:** conserva sin reescrituras el clip original `Gallop` y sus huesos, ajustando pesos del alisado de la piel al área de articulación posterior para reducir pliegues e inversiones durante la flexión. No introduce movimientos falsos de patas independientes del rig.
- **Cadena canónica:** `racers/index.html` → `racers/racers.js` → `racers/btc-atelier-preview.js` → `racers/btc-maya-master.js` → `racers/btc-maya-groom.js` y `btc-maya-hindquarters.js`, todo con cache-bust v12. Maestro visible `racers/btc-master-revision.json` alineado con `BTC_MAYA_RENDER_BUILD`.
- **Pruebas:** nuevo `tests/btc-v12-anatomy-contract.mjs` prueba desplazamiento de ambos laterales, ausencia de cambios en cascos/anterior, shader procedural y versión. Tests Three.js WebGL y producción ampliados para reportar `looseNeckFibers`, `hindMaxExpansion`, `hindTextureGenerated`, Gallop y otros 99 tokens. CI debe adjuntar capturas de seis vistas.
- **Estado inicial:** `pending_deploy` hasta que CI del commit pase, el origen Hostinger presente el nuevo `buildId` y se inspeccionen capturas de ambos perfiles, frontal, trasera, detalle y fases de Gallop. No presentar como validado por mera modificación en GitHub.
- **Pendiente artístico:** determinar si el galope necesita nueva corrección de cinemática nativa con expertos de animación, sin tocar lógica de carrera ni clip original sin cotejo filmado; revisar topología y sombras a 30/60 FPS.

### v12 · control visual posterior sobre capturas reales del navegador
- Se descargaron y cotejaron **seis capturas reales de Chromium/WebGL** del v11 (PR #85) y del primer v12 (PR #87). La primera corrección eliminó el aspecto de cuerda colgante de la crin, pero el perfil todavía mostró los muslos demasiado delgados. **No se aprobó ese primer resultado.**
- Segunda pasada sobre `btc-maya-hindquarters.js`: se agrega grosor en el eje longitudinal (visible de perfil), no únicamente ancho lateral de malla, con crecimiento continuo de la sección de glúteos, muslos y gaskin. Para las transiciones del galope se suma una microcorrección de piel en shader según la fase real de `hoofPhase`; las matrices de huesos y el clip original `Gallop` **no se reemplazan**.
- Contratos reforzados: test de espesor sagital de pierna posterior en malla, shader vertex procedural, `hindGaitCorrective` y métricas del modelo en WebGL. Nueva captura después de esta segunda pasada requerida antes de declarar cumplida la anatomía.
- No desplegar a producción ni considerar finalizado si el smoke de Hostinger sigue mostrando v10/v11.


### Comprobación en el sitio público · 2026-11-04
- **Publicación confirmada:** merge PR #87 `90126f8`; workflow de producción `41895376031` aprobó el contenido v12 servido por Hostinger y WebGL Chromium contra `https://race.cryptodromo.com/racers/#BTC`. Comprobó variante `maya`, galope nativo activo, crin sin filamentos geométricos fuera del límite y ETH sin componentes BTC.
- **Evidencia real:** `btc-live-anatomical-verification` en GitHub Actions `41895376031`, captura `public-btc-anatomical.png`; capturas de seis ángulos en workflow de PR `41894499285`. Versiones v11/v12 comparadas mediante capturas WebGL, no mediante ImageGen.
- **Resultado de dirección artística:** se eliminaron las hebras del cuello y se redondeó la grupa; aún hay estrechamiento y flexión poco convincente en patas traseras, visible en la captura de producción. No se declara calidad AAA ni anatomía del galope resuelta.
- **Estado de manifiesto:** `needs_fix` (implementación desplegada y verificada, estética posterior pendiente). La fase de nuevas físicas se mantiene bloqueada hasta corregir y cotejar el muslo-corvejón con referencia.
- **Incidencia ajena a este cambio:** workflow `41895376040` del editor/admin terminó con HTTP 503 por credenciales PHP de administración no configuradas. La API pública de perfiles y `racers.js` respondieron 200; este problema no invalida la verificación del caballo y requiere al responsable del backend.

## 2026-11-04 · `btc-master-procedural-hind-groom-20261104-v12-fx1` · efectos de contacto visibles en la ficha BTC

- **Situación anterior:** el PR #91 agregaba un motor de huellas, polvareda y colisión de cuatro pezuñas exclusivamente para el estadio y un laboratorio aislado. La ficha canónica `/racers/#BTC` no mostraba ninguna diferencia; ese reclamo del usuario era correcto.
- **Implementación visible:** `racers/btc-terrain-stage.js` agrega a la ficha un piso 3D de tierra, arena o césped, textura procedural, huellas comprimidas, sombras, granos, polvo y briznas por cada apoyo animado. El suelo se desplaza bajo el galope estacionario para visualizar una secuencia de pisadas sin mover el cuerpo del caballo; humedad y vuelta a la tarima original son controles explícitos.
- **Motor compartido:** `visual-lab/hoofTerrainFX.js` reconoce los nodos de suela del rig Quaternius, preserva la fase animada y ofrece una API futura para las cuatro suelas del maestro. Las posiciones y efectos son puramente visuales.
- **Anatomía:** malla Maya de 5409 vértices, pelo, cascos, huesos y clip `Gallop` mantienen el comportamiento v12 sin ninguna modificación geométrica. `BTC_MAYA_RENDER_BUILD` se incrementa para registrar el cambio obligatorio de la ficha, no para presentar como mejorado el defecto del muslo-corvejón.
- **Versiones visibles:** cadena HTML → `racers.js` → `btc-atelier-preview.js` → `btc-maya-master.js` versionada con `hoof-btc-fiche-20261104-v1`; manifiesto `btc-master-revision.json` actualizado a la versión FX1 en estado `pending_deploy`.
- **QA:** pruebas específicas de la ficha `tests/hoof-btc-ficha-browser.mjs` para las tres superficies, humedad, pausa y contadores reales de impacto, además de pruebas del motor y compatibilidad del viejo maestro. El PR #89 del otro agente conserva íntegra su evolución anatómica v13b pendiente.
- **Pendiente:** confirmar build y nueva ficha pública servida por Hostinger, capturar pruebas visuales finales y después integrar de forma coordinada el maestro v13b sin sobrescribir el stage.

## 2026-11-04 · `btc-master-procedural-hind-groom-20261104-v12-fx1-lookdev1` · PR #105 · iteraciones de materiales y ficha
- **Antes:** BTC v12-fx1 con alta frecuencia procedural en pelaje/crin que puede generar aliasing en planos de TV y brillo artificial en contraluz. La ficha permanecía fijada a imports de caché de v12.
- **Iteración 1, cuerpo:** `racers/btc-maya-coat-lookdev.js` añade micropelaje orientado y tono de zonas con filtrado derivativo `fwidth`; se integra en el shader PBR del verdadero maestro Maya, no en un plano ni render de imagen.
- **Iteración 2, crin y cola:** el shader de fibras filtra la cutícula a distancia y reduce brillo especular; conserva las geometrías volumétricas, el vínculo al rig y la animación Gallop original.
- **Iteración 3, ficha:** `racers/index.html`, `racers/racers.js` y `racers/btc-atelier-preview.js` cargan y describen esta revisión por claves nuevas de caché; `racers/btc-master-revision.json` presenta el build y deuda visual explícita.
- **Aislamiento:** no se modifican datos financieros, apuestas, fixture, 99 caballos restantes ni el modelo de la pista.
- **QA:** contrato automático de lookdev y pruebas de regresión de la ficha; se requieren capturas reales Chromium/WebGL desde perfil/frente/atrás, galope, rendimiento y luego verificación de Hostinger.
- **Compatibilidad pendiente:** consolidar cambios anatómicos de PR #89, ojos/crin/cola de #99 y #100. No sobrescribirlos por merge automático.
- **Resultado:** `pending_deploy`; aprobado por código NO significa calidad AAA ni publicación en la ficha del sitio hasta merge y verificación del host.

## 2026-11-05 · `btc-maya-pose-anatomy-20261105-v1` · corrección por captura pública
- Referencia: captura aportada por el usuario que muestra nuca/crin discontinua, ancas con articulación antinatural, muslo-corvejón estrechado y huellas gigantes.
- Corrección de piel: eliminada deformación sinusoidal de muslo durante Gallop; restaurado el skinning lineal original con filtro de influencias cruzadas izquierda/derecha del tren posterior, basado en la iteración v13b del PR #89 (DQS experimental rechazado).
- Nuca: máscara suave de pesos hacia el hueso original Head en cresta occipital y borde de órbita, basada en la rama del PR #100; no añade props ni modifica clips.
- Terreno de la ficha: impresiones reducidas a 32% y máximo de 36 marcas; los defaults del estadio no cambian.
- Cadena de cachés y ficha `/racers/#BTC` actualizadas a versión v13. Pruebas y capturas todavía necesarias. Estado `pending_deploy`, no `verified` ni `AAA`.

## 2026-11-05 · `btc-maya-safety-original-20261105-v1` · control de calidad por captura del usuario
- Capturas de producción aportadas muestran iris y componentes oculares flotantes y deformaciones severas en muslo, babilla y corvejón. No marcar esta anatomía como AAA.
- Referencias veterinarias sobre la secuencia grupa/babilla/pierna/corvejón confirman que el corte abrupto no corresponde a una articulación real. La transferencia espacial desde un rig Quaternius a la superficie Maya no demuestra un skinning aceptable.
- **Medida inmediata en la ficha `/racers/#BTC`:** render predeterminado = modelo GLB original con su skinning y Gallop intactos; modelo Maya deja de ser el render principal, disponible únicamente con `?btcMaster=maya` para diagnóstico. Se retiraron sus overlays de esfera ocular/pupila/lagrimal flotantes.
- **Estado:** `needs_fix`: es un rollback anatómico seguro, no una solución completa del rig Maya ni mejora AAA. Restaurar Maya sólo después de 16 fases verificadas visualmente desde perfil, frente y atrás, con volumen y articulaciones correctas.

## 2026-11-05 · Referencia Three.js `webgl_morphtargets_horse` · diagnóstico de locomoción
- El usuario aclara que el archivo Maya sólo era referencia anatómica, **nunca** la malla obligatoria de producción. Se usará la anatomía de referencia para evaluar el caballo de Cryptódromo.
- Three.js muestra `Horse.glb` con GLTFLoader + `AnimationMixer` sobre una animación importada. El movimiento y las formas se evalúan como una secuencia authored, no a partir de rotaciones manuales independientes.
- Cryptódromo ya tiene un clip `Gallop` original, pero `race-lab/source/src/gaitRefiner.js` agrega correcciones de rotación a patas delanteras y traseras. Para aislar posibles sobrecorrecciones, **sólo el visor BTC** pasa `gaitCorrectionStrength:0` a `createHorse`; los corredores del estadio conservan el valor por defecto `.40`.
- Los `morph targets` de Horse.glb no se pueden trasplantar a otra malla con distinta topología sin correspondencia de vértices y una nueva secuencia de poses; no son un arreglo automático de las ancas. Antes de transferir cualquier sistema, cotejar las 16 fases de galope contra imágenes reales y los 4 apoyos.
- Conserva la cuarentena del modelo Maya defectuoso del PR #107 y la desactivación de sus piezas oculares flotantes. Este cambio no representa aprobación estética AAA.
- Fuente: https://github.com/mrdoob/three.js/blob/dev/examples/webgl_morphtargets_horse.html

## 2026-11-05 · `btc-native-horse-20261105-v1` · arquitectura 3D unificada
- Prioridad del usuario: modelo 3D en runtime, jamás sprites ni secuencias de imágenes, calidad visual primero.
- Una sola base fiable: GLB Quaternius nativo, bones + clip Gallop original (sin duplicar correcciones de articulaciones en visor BTC).
- `btcNativeLookdev.js`: capa PBR de microfibra direccional y pigmento, con filtro derivativo por píxel; sin textura de pelaje, sin planos/sprites, sin deformar vértices ni compartir mallas entre animales.
- `windMane.js` existente: anima los vértices originales de la crin con viento; se habilita en la vista BTC, no se agrega geometría falsa.
- Otros 99 corredores y motor de carrera conservan defaults y flags anteriores. Los experimentos Maya siguen aislados para referencias anatómicas. El objetivo AAA continúa pendiente de capturas humanas de 16 fases y análisis de calidad.

## 2026-11-05 · Restauración Hero V5 pase 10 tras regresión de variante
- **Causa:** `/racers/#BTC` había elegido `original` por defecto y dejó invisible el renderer geométrico V4/V5 ya implementado. No se perdieron los módulos.
- Se restaura **Hero V5 pase 10** en la ficha canónica BTC: malla y rig GLB originales, silueta corporal V4+V5, mechones sólidos y continuos de crin/cola, 7 huesos nativos de cola, 10 fases incrementales V5 y resorte/inercia procedural GPU acoplados al Gallop.
- El GLB original conserva el clip Gallop; el visor desactiva `gaitRefiner` aditivo para evitar torsiones. Con V5, `maneMotion=false` en la crin de shader GLB para impedir doble movimiento sobre el pelo; V5 gestiona su propia inercia.
- `?btcMaster=original` conserva rollback; `?btcMaster=maya` sigue exclusivamente diagnóstico. Los demás 99 corredores y el motor de apuestas/carrera no se modifican.
- No declarar AAA ni publicar como maestro de todos sin capturas Chromium/WebGL de 16 fases y aceptación visual del usuario.
