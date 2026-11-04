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

## 2026-11-04 · `btc-face-poll-tail-20261104-v14` · corrección geométrica de la ficha BTC

- **Referencia de aceptación del usuario:** capturas reales de `https://race.cryptodromo.com/racers/#BTC` donde los ojos muestran pequeños fragmentos oscuros, la crin tiene acabado demasiado plástico, la cola casi no se mueve y la nuca se hunde en pleno galope. Las imágenes conceptuales posteriores NO están instaladas como imágenes en el sitio: son solo objetivo visual de calidad.
- **Ojos:** `btc-maya-eye-layout.js` define un único marco bilateral para globo ocular y párpado; `btc-maya-master.js` genera ojos elipsoidales dentro de las órbitas, iris real con sombreado/limbo, pupila ecuestre horizontal y brillo córneo; `btc-maya-face-details.js` sustituye los parches proyectados punto por punto (origen de polígonos sueltos) por párpados continuos asociados exclusivamente al hueso `Head`.
- **Nuca/cuello:** `btc-maya-poll-bridge.js` limita una elevación suave de la malla Maya sobre la nuca y regulariza los pesos de `Head` a `Neck3` sobre la franja de transición sin cambiar el clip `Gallop`. La cama de raíces recibe el mismo estabilizador.
- **Crin y cola:** `btc-maya-groom.js` aumenta hebras finas, reduce radios de las estructuras más gruesas, cambia a material PBR mate de bajo brillo y conserva hebras volumétricas skinned. `btc-maya-tail-spring.js` calcula dinámica secundaria críticamente amortiguada de las puntas, con la raíz inmóvil y control de fase/velocidad/viento sin modificar los huesos `Tail1..Tail7`.
- **Diagnóstico real:** nueva cámara de seguimiento `Ojos y nuca · acercamiento` en el visor estándar BTC, métricas de ojos/poll y rugosidad de pelo en `window.__cryptodromoBTCAtelierQA`.
- **No modifica:** el caballo de los otros 99 tokens, la física oficial de clasificación, el resultado de carrera, el GLB original, el fixture, apuestas o los parámetros financieros. Los trabajos de músculo y patas traseras de PR #89 v13b se mantienen independientes.
- **Estado:** `pending_deploy`. Verificar **capturas y fases reales de Chromium en la ficha**, test de ojo/poll/cola, y publicación efectiva de Hostinger antes de marcarlo `verified`.
