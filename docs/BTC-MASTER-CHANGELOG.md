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
