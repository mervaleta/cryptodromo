# Cryptódromo · 28 hitos reales V23 a V50

**Pedido del usuario 2026-11-07:** no mostrar avances, imágenes ni renders antes de completar una V50 genuinamente mejorada. La V21 pública no cumplió el objetivo. El prototipo V22 sigue aislado en PR #136.

**Esto es una lista de trabajo, NO evidencia de que se completaron 28 versiones.** Una versión sólo se acredita si tiene una modificación de geometría, animación o apariencia visible y validada, commit y capturas reales Chromium/WebGL comparables con el mejor paso anterior. Si empeora alguna vista, rechazarla y repetirla sin cambiar de número. Conservar el mejor hito reversible.

**Fuente primordial:** el archivo aportado Horse_VR_2017.ma contiene skinCluster1 de 5406 vértices y 70 influencias. La implementación actual adapta pesos a un rig GLB diferente. Priorizar recuperar los datos originales, en lugar de multiplicar polígonos para tapar deformaciones.

## 28 hitos condicionados a mejora real
- [ ] V23: estabilizar V22 sin fallback ni roturas · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V24: cerrar costura posterior continua · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V25: exportar pesos exactos del skinCluster1 Maya · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V26: exportar matrices inverse-bind y jerarquía propia · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V27: hornear y retargetear locomoción al rig original · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V28: recomponer hombro y grupa · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V29: preservar articulaciones de rodilla/corvejón/menudillo · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V30: modelar paredes de cascos y coronas · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V31: volumen real de cañas, tendones y ranillas · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V32: morfologías musculares ligadas a la pose · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V33: verificar proporciones equinas completas · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V34: cerrar la unión nuca-cuello · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V35: corregir quijada, garganta y testuz · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V36: globo ocular, anillos de párpado y lagrimal bilaterales · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V37: esculpir hocico, belfos y ollares · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V38: reconstruir orejas anatómicas · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V39: materiales físicos PBR por región · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V40: pelo corto direccional y filtrado · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V41: flequillo unido realmente al cuero cabelludo · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V42: crin volumétrica continua hasta la cruz · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V43: raíz de cola integrada en grupa · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V44: cola con inercia secundaria bien amortiguada · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V45: pezuñas y suelo sin patinaje · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V46: galope completo de 16 fases a tres velocidades · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V47: transiciones entre reposo y galope sin saltos · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V48: iluminación, cámaras y exposición de estudio · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V49: calidad y rendimiento en equipos reales · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente
- [ ] V50: validación integral con Hostinger, 6 cámaras y 16 fases · SHA: pendiente · fotos WebGL: pendientes · QA visual: pendiente

## Reglas estrictas
1. Hacer capturas auténticas izquierda, derecha, frente, atrás, tres cuartos y detalle; 16 fases distintas de Gallop; comparar pixel y silueta contra la mejor versión anterior.
2. Registrar los defectos del paso y rechazarlos sin renumerar si se agravan; código compilable o tests verdes solos NO demuestran mejora.
3. Preservar rollback, 99 otros caballos, estadio, fixture y precios. No clonar ni anunciar MODELO MAESTRO sin aprobación visual explícita.
4. No publicar prototipos intermedios al usuario. V50 sólo se presenta al comprobar build real servido por Hostinger en https://race.cryptodromo.com/racers/#BTC, con aceptación visual pendiente de la decisión del usuario.

## 2026-11-07 · diagnóstico V23 (NO acreditada)
- **SHA de corrección candidata:** `d93f46864915e81d4c559d74aa951c7a5a0a3260`.
- **Defecto raíz corregido en código:** la búsqueda de anclajes de la pata donante recorría todos los atributos de vértices de Maya, incluidos los que quedaron huérfanos al recortar el índice. Ahora sólo busca vértices referenciados por triángulos sobrevivientes, evitando atraer el injerto a tejido eliminado.
- **Estado:** sin capturas comparables Chromium/WebGL ni prueba visual de las 16 fases. No cuenta como V23 ni autoriza merge, Hostinger o anuncio. Deben correrse regresiones de malla, capturas reales y comparar contra V21 y V22 antes de aceptar.

## 2026-11-07 · V23 regression gate adicional (NO acreditada)
- **SHA:** `9c51c5f3428f64a93e986c9649fafbcc411c068e`.
- Se incorporó validación previa al render del donante posterior: coordenadas finitas, pesos normalizados, índices de huesos dentro del skeleton y triángulos no colapsados tras el ajuste de costura. En caso de corrupción se rechaza el candidato en vez de mostrar espinas WebGL.
- **Límite:** es defensa de integridad, no mejora visual demostrada. Falta ejecutar Chromium/WebGL, comparar seis vistas y 16 fases contra V21/V22 y comprobar CI. V23 sigue sin acreditar, PR #136 continúa aislado; no publicar.

## 2026-11-07 · preparación de rig original Maya (NO acreditada como V23/V25)
- **Commit:** `4f1a17202262eabb90bc140209da03bffa709870` (script nuevo `tools/btc/export_maya_skincluster.py`; commit inicial `50e7edb7285f1e6f9cbae2a4997719e4c9dbf87b`).
- **Trabajo concreto:** extractor no destructivo para ejecutar *dentro de Autodesk Maya*, leyendo `HorseRig1:skinCluster1`, orden real de influencias, índices lógicos, pesos por vértice y `bindPreMatrix`; valida normalización y escribe JSON de datos sin modificar la escena. Evita inferir pesos del caballo Quaternius.
- **Sin falsear resultados:** no se ejecutó Maya ni se generó un JSON real. No hay exportación GLB ni capturas Chromium/WebGL nuevas. V23 sigue pendiente de prueba comparativa de seis cámaras y 16 fases; V25 tampoco se acredita.
- **Siguiente:** ejecutar el script con `Horse_VR_2017.ma` en Maya, auditar que devuelve 5406 vértices y 70 influencias, verificar orden/espacios de matrices y construir una prueba de skinning contra deformación nativa antes de reemplazar el rig actual. No publicar.

## 2026-11-07 · control de integridad de exportación Maya (NO acreditado)
- **Commit:** `2542c2548baee1e5def37f3b2bad2a1fb8ca600f`.
- **Cambio:** `tools/btc/validate_maya_skincluster.py` comprueba fuera de Maya el esquema, 5406 vértices, 70 influencias, correspondencia de índices lógicos, matrices bind de 16 valores finitos, conexiones y normalización/unicidad de pesos por vértice. Rechaza JSON inconsistente antes de usarlo en el rig.
- **Estado:** aún no hay JSON real exportado desde `Horse_VR_2017.ma`, ejecución de la validación con ese JSON, capturas WebGL ni comparación de seis vistas y 16 fases. No cuenta V23 ni V25. No desplegar.

## 2026-11-07 · Maya bind-matrix serialization hardening (NO acreditada)
- **SHA:** `020c081ebde56e3e93153b89b0529e1deea0776d`.
- **Defecto:** `maya.cmds.getAttr` puede devolver matrices como tupla anidada de una fila de 16 elementos. El exportador usaba `list(matrix)`, produciendo una matriz con un solo elemento (la tupla interna), incompatible con el validador y con skinning fiel.
- **Corrección:** `flatten_matrix` acepta formas plana/anidada, exige exactamente 16 números finitos y se aplica a `bindPreMatrix` y `geometryMatrix`. No altera la escena Maya ni ningún caballo publicado.
- **Validación pendiente:** ejecutar dentro de Maya real con `Horse_VR_2017.ma`, verificar 70 matrices y 5406 filas, comparar deformación nativa, ejecutar WebGL Chromium seis vistas/16 fases y comprobar CI. Sin esas evidencias V23/V25 permanecen sin acreditar. No desplegar.

## 2026-11-07 · rechazo de metadatos Maya corruptos (NO acreditada)
- **Commit:** `5018ec7ed277485ed6e6814929bdeebc4545c26e`.
- **Corrección:** el validador de skinCluster exige ahora la identidad `HorseRig1:skinCluster1`, una escena de origen identificable y `geometryMatrix` finita de 16 valores; comprueba nombres y logical indices sin asumir que el JSON siempre contiene listas válidas. Evita admitir archivos incompletos o atribuidos a otro skinCluster.
- **Limitaciones:** no se ejecutó Maya ni Chromium/WebGL en esta intervención; no hay JSON original exportado ni imágenes A/B. Este endurecimiento de importación NO constituye mejora visual ni acredita V23/V25. PR #136 sigue aislado, sin despliegue.

## 2026-11-07 · rig Maya: rechazo de conexiones ambiguas (NO acreditada)
- **Commit:** `326e03061265abc144903fd9966e9524206303a6`.
- **Corrección:** el validador de exportación rechaza pesos booleanos, índices de influencia booleanos, matrices con valores booleanos, claves de matrices extra/ausentes y conexiones `matrix[]` ambiguas o no enlazadas a `worldMatrix[0]`. Reduce el riesgo de importar un rig corrupto sin tocar runtime BTC.
- **Estado:** no se ha ejecutado Maya ni se dispone de exportación original validada. No hay pruebas Chromium/WebGL A/B de seis cámaras y 16 fases; V23/V25 siguen sin acreditarse. La condición `worldMatrix[0]` debe contrastarse contra las conexiones efectivas del archivo Maya antes de aceptar un JSON real. No merge, no Hostinger, no anuncio.

## 2026-11-07 · reparacion sintactica del validador Maya (NO acreditada)
- **Commits:** `6363dff36f582b816455ed29de29f96c4954f7b3`, `de621cb56e9605e91b867a6d245806d373e9cef6`.
- **Defecto concreto:** `validate_maya_skincluster.py` contenia secuencias literales `\\n` al final de instrucciones Python, lo que impedia interpretar el archivo. Se restauraron los saltos de linea reales entre instrucciones, conservando los escapes dentro de cadenas de error.
- **Limite:** correccion del validador, no del aspecto WebGL. Sin exportacion Maya real ni evidencia visual A/B, V23 y V25 siguen sin acreditarse. Falta ejecutar `python -m py_compile tools/btc/validate_maya_skincluster.py`, prueba positiva/negativa con JSON real y Chromium/WebGL 6 vistas y 16 fases. No desplegar.

## 2026-11-07 · pruebas sintéticas de contrato Maya (NO acreditada)
- **Commit:** `b38f22808e07f698601f9023d7ef544405c6e6e1`.
- **Cambio:** se agregó `tools/btc/test_validate_maya_skincluster.py`, con fixture sintética de 5406 vértices y 70 influencias, caso positivo y rechazos de vértice faltante, pesos no normalizados, influencia repetida, matriz bind inválida, conexión ambigua y peso booleano.
- **Comando pendiente de ejecutar en CI/checkout:** `python -m unittest discover -s tools/btc -p 'test_validate_maya_skincluster.py'`.
- **Límite:** el fixture no proviene de Maya. No se ejecutó aquí la suite, ni Chromium/WebGL, ni hay comparativas A/B de seis cámaras y 16 fases. V23 y V25 continúan pendientes. Sin merge, despliegue ni anuncio.

## 2026-11-07 · Maya export negative regression coverage (NO acreditada)
- **Commit:** `025bec5e977ef52445ab64cf2705ffe201775f8f`.
- **Cambio aislado:** cinco casos negativos adicionales en `tools/btc/test_validate_maya_skincluster.py`: conexión de matriz faltante, índice de matriz extra, peso NaN, índice lógico booleano y par sparse malformado. Ningún archivo de producción del caballo ni de los otros corredores se modificó.
- **Prueba pendiente:** ejecutar `python -m unittest discover -s tools/btc -p 'test_validate_maya_skincluster.py'` en checkout/CI; la conexión GitHub de esta corrida no proporciona ejecución de shell/Chromium. No se adjudica éxito de tests no ejecutados.
- **Estado:** sin exportación Maya original ni comparativas WebGL A/B de seis cámaras y 16 fases. V23 sigue sin acreditar. No merge, no Hostinger, no anuncio.

## 2026-11-07 · Maya joint binding identity gate (NO acreditada)
- **Commits:** `3e092743415645d4442168eac83618f0cc0c4a93` y `0ed2a6a3dd6b22dae3a4768fdd8dbf917cf90270`.
- **Defecto corregido:** el validador aceptaba que `matrix[5]` apuntase a `joint6.worldMatrix[0]` aun cuando el índice lógico 5 correspondía a `joint5`, porque sólo verificaba el sufijo. Ahora compara la conexión completa contra la influencia de la misma posición; rechaza además conteos booleanos. Dos tests negativos agregados.
- **Limitación:** no se ejecutaron Maya, suite Python, Chromium/WebGL ni comparación A/B en esta corrida. Sin exportación original validada y 6 cámaras/16 fases, V23 sigue sin acreditarse. No merge ni publicación.

## 2026-11-08 · fail-closed de metadatos de influencias Maya (NO acreditada)
- **Commits:** `00dea11b750b3dcf9ffbb2b47b246d706b742af8`, `abc92935c206a78381e08becea4af341548d0cde`.
- **Defecto:** un JSON con `influences=null`, `influenceLogicalIndices=null`, índices lógicos string o nombres nulos podía provocar `TypeError` al iterar o indexar, en lugar de un rechazo explícito. Se agregó un guard previo a la lectura de matrices y cuatro regresiones negativas.
- **Alcance:** sólo herramientas de validación del rig BTC. No cambia geometría, galope, otros 99 corredores ni producción. No se ejecutó Maya ni Chromium/WebGL ni pruebas Python en esta corrida; no se atribuye éxito de tests no ejecutados.
- **Estado:** V23 y V25 sin acreditar. Falta checkout con ejecución de suite, exportación real de Maya y comparación WebGL de seis cámaras/16 fases. Sin merge, Hostinger ni anuncio.

## 2026-11-08 · sparse influence ID hardening (NO acreditada)
- **Commits:** `f5bb4e2147faf0e4c865e387542b965174852d17`, `32f2c86fbc496855d2befdaaca0d85156733e088`.
- **Defecto:** una fila de pesos con índice de influencia no hashable (por ejemplo una lista) provocaba `TypeError` en `ids.add(j)` antes de emitir el rechazo de validación. Ahora sólo agrega índices enteros al conjunto; índices inválidos se reportan como `ValueError`. Se añadieron dos casos de regresión negativos (lista y null).
- **Estado:** cambios sólo en herramientas del rig BTC, sin modificar geometría ni producción. Pruebas Python y capturas Chromium/WebGL no ejecutadas en esta intervención; no hay exportación Maya original ni comparación visual A/B. V23 y V25 siguen sin acreditar. No merge, no despliegue ni anuncio.

## 2026-11-08 · top-level JSON contract guard (NO acreditada)
- **Commits:** `4b8939fd1c6f20c61e8a245665ca39165913916b`, `562a8ffb6c49066921bdcd2f23d34a388035aeed`.
- **Defecto corregido:** `validate_maya_skincluster.py` llamaba `.get()` sobre la raíz JSON sin verificar que fuese un objeto. Los valores JSON `null`, `[]` o una cadena provocaban `AttributeError` en lugar de rechazo explícito. Ahora se exige objeto raíz y se añadieron tres pruebas negativas sintéticas.
- **Alcance:** exclusivamente herramientas BTC de importación Maya. No se ejecutaron aquí pruebas Python, Maya ni Chromium/WebGL; no hay comparación visual de seis cámaras y 16 fases ni exportación original. V23/V25 no acreditadas, sin merge ni despliegue.

## 2026-11-08 · V23 candidate: exact piecewise crop boundary (NOT credited)
- **Code SHA:** `96244933a738b3922f26aa7c683e7e56e76621ca` in `racers/btc-native-hind-limb-repair.js`.
- **Geometry defect addressed:** `cropMayaHind.distance` is a maximum of three signed fields, so it is piecewise linear, not globally linear along an edge. Interpolating the signed distances of endpoints can place the cut vertex away from the actual zero surface when the dominant plane switches. The intersection now bisects the original field for 28 steps and reuses the existing shared-edge cache; interpolated bone weights follow the solved edge parameter. This is an actual change to the candidate mesh positions, not a material/label update.
- **Unverified risk:** the field uses `max` and may cross zero more than once along an edge; bisection finds one crossing but does not resolve all disconnected kept intervals. An edge-level multi-crossing audit and six-camera, 16-phase Chromium/WebGL comparison against V21 and previous V22 are required. If any pose worsens, revert this commit.
- **Evidence:** no Chromium/WebGL screenshots, Maya export, browser regression or CI results obtained in this run. **V23 remains unchecked**, no merge, no Hostinger deployment, no user announcement.

## 2026-11-08 · guard de índices sparse no hashables (NO acreditada)
- **SHAs:** `78c6d2f1cc37ca61309f62c229c6ed5052e7f342` (validador), `48c43ff0551e08b65ddb2a7cdad14e582de27c5c` (regresión).
- **Defecto:** la condición `j in ids` evaluaba un índice sparse tipo lista o diccionario antes de rechazar su tipo; esto lanza `TypeError` y el test `assertRaises(ValueError)` no lo acepta. Ahora sólo consulta el conjunto para enteros y se agrega caso diccionario.
- **Evidencia faltante:** no se ejecutaron suite Python, Maya ni Chromium/WebGL en esta intervención; no hay A/B seis vistas y 16 fases. V23 continúa pendiente. Cambio exclusivo de herramientas BTC, sin merge ni despliegue.

## 2026-11-08 · V23 crop edge multi-crossing safety gate (NO acreditada)
- **Código:** `e01fb7e6bde1ffed779ae06295f87760dd3c527b` (`racers/btc-native-hind-limb-repair.js`).
- **Defecto abordado:** el campo de recorte `max(z-.0208, .0052-y, .0015-abs(x))` puede cruzar cero dos veces sobre una arista cuyos extremos se conservan. El clipper de un solo cruce habría unido superficies a través del intervalo eliminado, creando una cara que tapa un agujero. Se muestrea cada arista de triángulo mixto en 32 segmentos y se rechaza explícitamente una arista con múltiples transiciones, en lugar de fabricar geometría inválida. Esta guarda no implementa aún el split multiintervalo.
- **Riesgo pendiente:** el muestreo discreto no garantiza detectar intervalos más estrechos que 1/32 de arista. El rechazo puede hacer que el candidato V22 falle y deba corregirse el algoritmo de partición antes de publicarlo. No hay captura ni ejecución de WebGL/CI en esta corrida; no se acredita V23 ni mejora visual. Mantener rama aislada, no merge ni despliegue.


## 2026-11-08 · V23 fully-retained edge interval guard (NO acreditada)
- **Código SHA:** `95f8714d7dc90ce5bbfaf5c58953d54b6fc5bc14` (`racers/btc-native-hind-limb-repair.js`).
- **Defecto:** la guarda anterior sólo examinaba aristas de triángulos mixtos; una arista con ambos extremos retenidos puede atravesar el volumen eliminado y quedar como puente falso sin activar el control. Ahora se muestrean también las tres aristas de cada triángulo enteramente retenido y se rechaza el candidato si se detecta un intervalo oculto.
- **Riesgos:** control conservador de 31 muestras interiores por arista, no algoritmo de recorte multiintervalo; puede rechazar V22, y los intervalos más estrechos que el muestreo pueden escapar. Falta implementar clipping robusto, ejecutar pruebas de geometría, CI y Chromium/WebGL real seis cámaras/16 fases con comparativa A/B y SHA. Sin capturas ni QA visual, **V23 no se acredita**. No merge, no Hostinger, no anuncio.


## 2026-11-08 · V23 analytic crop-interval candidate (NO acreditada)
- **Código SHA:** `9607acd33ec2a6238ff955edfb0befc8613466e0` en `racers/btc-native-hind-limb-repair.js`.
- **Defecto abordado:** los chequeos de 32 muestras por arista podían omitir un intervalo eliminado estrecho y construir una cara sobre un hueco de la grupa. Ahora se intersecan exactamente las desigualdades lineales de z, y y ambos semiespacios laterales de x para hallar intervalos abiertos de recorte, sin depender de una resolución de muestreo. Se conserva rechazo conservador cuando el clipper no puede representar intervalos interiores; no se inventa una topología nueva.
- **Pendiente:** pruebas automatizadas de bordes degenerados y tangencias, CI, capturas reales Chromium/WebGL seis cámaras y 16 fases, comparación A/B contra V21 y mejor V22, SHA de los artefactos. No se ha demostrado mejora visual, ni se ha ejecutado WebGL en esta corrida. **V23 permanece sin acreditar**. No merge, Hostinger ni anuncio.

## 2026-11-08 · canonicalización de rutas DAG de Maya (NO acreditada)
- **Commit de código:** `2a14e0431875bb894594544030d1c5c150d68b70`.
- **Defecto corregido:** `cmds.listConnections` puede devolver un nombre corto de joint, mientras `MFnSkinCluster.influenceObjects().fullPathName()` devuelve la ruta DAG completa. El validador exige igualdad exacta, por lo que una exportación auténtica podía rechazarse falsamente. El exportador ahora resuelve cada fuente `worldMatrix[0]` a ruta DAG completa con `cmds.ls(..., long=True)` y rechaza nodos ambiguos o ausentes.
- **Alcance:** sólo script de extracción del rig BTC, sin cambio del caballo en producción. No se ejecutó Autodesk Maya, no se produjo JSON real ni se ejecutó Chromium/WebGL A/B; tampoco se certifica CI. V23/V25 continúan sin acreditar. No merge ni despliegue.

## 2026-11-08 · V23 analytic crop boundary regression (NO acreditada)
- **Commit:** `3625ccd6c2d9898ad90e3b0218c89dc359372d5a`, `tests/btc-v23-crop-intervals.mjs`.
- **Trabajo:** seis pruebas matemáticas independientes para la clasificación analítica de intervalos: fuera de z/y, doble cruce lateral, intervalo menor que un paso de muestreo, tangencia y corte de altura. Son pruebas del contrato de intervalos, NO una comparación de fotogramas ni una prueba de integración de la malla.
- **Bloqueo de ejecución:** el contenedor no resuelve `raw.githubusercontent.com`; no se pudo descargar el checkout para ejecutar `node --test`. No se atribuyen tests aprobados. Ejecutar el archivo desde un checkout con Node y luego Chromium/WebGL real, seis vistas y 16 fases A/B. No hay imágenes comparativas ni SHA de artefactos. V23 sigue pendiente, sin merge ni despliegue.

## 2026-11-08 · V23 hidden retained island guard (NOT credited)
- **Code SHA:** `1929d9e3218934b042990b5ee6fb43a9a407a85a` in `racers/btc-native-hind-limb-repair.js`.
- **Root defect:** the earlier interval checks handled all-kept and mixed triangles but skipped all-removed triangles. The removed set is a union of two lateral lobes; an edge with endpoints in opposite lobes can cross retained centerline skin. Deleting the whole triangle would create a spurious gap. Fully removed triangles now require every edge to have exactly one removed interval covering [0,1], otherwise fail closed pending multi-interval polygon splitting.
- **Focused mathematical check in connector JS runtime:** opposite lateral lobes yield intervals [0,.3125] and [.6875,1] and are rejected; same-side removed edge yields [0,1] and is accepted; edge crossing the height boundary yields [0,.54] and is rejected (3/3 expected). This is not a repository test run or a WebGL screenshot.
- **Risk:** this conservative gate can reject the V22 candidate on real Maya geometry. Needs integration test, real Chromium/WebGL six cameras and 16 Gallop phases, comparison A/B with SHA, and replacement by proper multi-interval clipping if triggered. No Maya export or CI claim. **V23 remains unchecked.** No merge or Hostinger deployment.

## 2026-11-08 · V23 fully removed island regression coverage (NO acreditada)
- **Commit de pruebas:** `8ff44519b8903cc1b4ac0e024b0e5bf6acd505f4` (`tests/btc-v23-removed-island-guard.mjs`).
- **Trabajo:** cinco pruebas matemáticas de la guarda para triángulos completamente eliminados: lóbulo lateral válido, dos lóbulos con isla retenida oculta, cruce de umbral de altura, tangencia lateral y triángulo con puente central. No altera geometría de producción ni otros corredores.
- **Validación pendiente:** ejecutar `node --test tests/btc-v23-removed-island-guard.mjs` en checkout/CI; la ejecución local de checkout está bloqueada por DNS de GitHub. No se ejecutaron WebGL Chromium, comparación A/B de seis cámaras y 16 fases ni Maya real. V23 sigue sin acreditar; sin merge, Hostinger ni anuncio.


## 2026-11-08 · V23 visual gate: V22 RECHAZADA (no hito)
- **Fuente WebGL real:** [Actions 42514804011](https://github.com/mervaleta/cryptodromo/actions/runs/42514804011), artifact [13631795037](https://github.com/mervaleta/cryptodromo/actions/runs/42514804011/artifacts/13631795037), source SHA `fd0de4ac708c3a8729ef04d4f8a5a2be37745af8`. Comparación contra [V21 artifact 13558229151](https://github.com/mervaleta/cryptodromo/actions/runs/42332885165/artifacts/13558229151).
- **Evidencia inspeccionada físicamente:** `rear-00.png`, `threeQuarter-08.png` y `profile-00.png` del ZIP V22, y `rear-00.png` V21. V22 mantiene triángulos oscuros desgarrados en grupa/raíz de cola y muslo posterior en vista trasera. En 3/4 fase 08 aparece además un fragmento aislado cerca del suelo. **No es una mejora aceptable frente a V21**; el defecto P0 persiste.
- **Métricas de runtime:** `removedMayaTriangles=1900`, `cutTriangles=124`, `addedCutVertices=124`, `isolatedMayaPosteriorIslandsRemoved=0`, `isolatedMayaPosteriorTrianglesRemoved=0`, `donorHindTriangles=7456`, `donorHoofTriangles=176`, `donorUpperInsetVertices=758`. Se grabaron 30 PNG auténticos, 16 fases perfil + vistas adicionales. El CI falló **después** de la captura, correctamente, por restos Maya no eliminados.
- **Diagnóstico de raíz:** el criterio de islas `count<=8 && meanY>.005 && meanZ<.002` no detecta ninguna, aunque hay desgarros visibles; los restos pueden estar unidos por aristas a un componente grande o quedar por encima del umbral. No elevar artificialmente los contadores ni retirar el assert. Hace falta aislar los triángulos defectuosos mediante coordenadas y conectividad de la malla original y probar una nueva cirugía geométrica con capturas A/B.
- **Decisión:** V23 sigue desmarcada, V22 no se despliega, no se modifica el build público V21. Prioridad siguiente: instrumentar identificación de caras Maya visibles en la región desgarrada y corregir el corte de malla, no más tests sintéticos del exportador.

## 2026-11-08 · V23 P0: cierre exacto de costura medial en raíz de cola (NO acreditada)
- **Raíz demostrada contra malla original**: decodificado BTC_EQUINE_MESH.position16/index16 (5406 vértices, 10790 triángulos). El recorte de cola de makeAnatomy deja 48 aristas exteriores: dos grupos de 24 aristas y 25 vértices por mitad. Cada grupo tiene DOS extremos de grado 1 compartidos (IDs originales 226 y 260, z≈.030277 y .032413). Son ARCOS ABIERTOS, no dos loops cerrados. Los dos abanicos previos dejaban ocho aristas sin vecino en la línea media, consistentes con el hueco negro de vista trasera.
- **Evidencia diferencial real previa a corrección**: [run #42516611733](https://github.com/mervaleta/cryptodromo/actions/runs/42516611733), [ZIP #13631617792](https://github.com/mervaleta/cryptodromo/actions/runs/42516611733/artifacts/13631617792). rear pose=0 normal, sin pelo de cola (btcHideTailQA), sin malla donante (btcHideDonorQA). El hueco central persistía sin cada uno de ellos; el injerto producía otra alteración angular lateral.
- **Correcciones solo BTC**: [4966bea](https://github.com/mervaleta/cryptodromo/commit/4966bea41d46f2ed5d70b4d15a9bac2298fa3d1e) recorta el collar superior del donante de z=.0268 a .0246; [38fa8b4](https://github.com/mervaleta/cryptodromo/commit/38fa8b4d835cbba73846504afbcd00d03da0ba9f) liga los centros de los fans a los pesos de sus bordes.
- **Cirugía topológica nueva**: [6ff2743](https://github.com/mervaleta/cryptodromo/commit/6ff27434ecb25ebc8a6dcaeecfbf8ceb622c563d) añade seis triángulos dirigidos entre los dos arcos abiertos y sus anillos interiores, y valida que cada arista del cap tenga exactamente dos caras de orientaciones contrarias. Los extremos se derivan por su grado=1. Una simulación de incidencias con la malla original arrojó cero aristas abiertas, cero usos triples y cero winding erróneo en el cap. Esto NO certifica deformación real WebGL ni rendimiento.
- **Prueba y ejecución**: [21e77cc](https://github.com/mervaleta/cryptodromo/commit/21e77cc913147fd2713402cbfc250eebc1de72ea) exige en Chromium dos centros ligados a sus bordes, seis triángulos mediales y cero bordes de cap abiertos; [workflow enfocado](https://github.com/mervaleta/cryptodromo/actions/workflows/btc-v22-hind-smoke.yml), último run [#42517331509](https://github.com/mervaleta/cryptodromo/actions/runs/42517331509). [e9dd92d](https://github.com/mervaleta/cryptodromo/commit/e9dd92dcfc717049708a5c18f0b0ecd7cb0042da) cancela QA obsoleto.
- **Siguiente paso obligatorio**: obtener ZIP de WebGL del run #42517331509 o reemplazo, comparar rear-00/rear-08 con ZIP antiguo #13631617792 y V21 #13558229151, repetir 16 fases si mejora. El gate de restos Maya aislados aún rechaza 0/0: no suprimir ni aprobar V23 sin reparar y comprobar. No merge, no deploy, V21 pública intacta.


## 2026-11-14 · BTC posterior distal-foot geometry A/B, Chromium real (V23 NO acreditada)
- **Código:** [d34070e](https://github.com/mervaleta/cryptodromo/commit/d34070e64eed3d950ebd71e5dc7898b1e2901ad8) corrige el descarte de cascos legítimos de 22 caras al usar un umbral específico de 3 caras para el material Hooves. [d63ef01](https://github.com/mervaleta/cryptodromo/commit/d63ef01a302006f8dc32a4f040254fcd7c2c5ee4) restringe el recorte distal de Maya a z<=.002: antes se eliminaban 3998 triángulos, el motor abortaba antes de generar un solo fotograma. El diagnóstico fue registrado en [72a664f](https://github.com/mervaleta/cryptodromo/commit/72a664f55fd45503a9d6a293256ae0a4151419e2) como error real de navegador, sin alterar el gate.
- **WebGL real:** [run #43649277060](https://github.com/mervaleta/cryptodromo/actions/runs/43649277060), [artifact #14135961152](https://github.com/mervaleta/cryptodromo/actions/runs/43649277060/artifacts/14135961152), 30 PNG (16 fases perfil y cinco cámaras). ZIP SHA256 `58cde23df1abffd2b349b41836a9d42616cf96a909b7c44fe47d64caa6e3b2f2`. También [run #43649277130](https://github.com/mervaleta/cryptodromo/actions/runs/43649277130) completó el ciclo de captura general. Métricas de malla: `removedMayaTriangles=2508`, `cutTriangles=144`, `addedCutVertices=258`, `donorHindTriangles=7104`, `donorHoofTriangles=176`, `isolatedMayaPosteriorIslandsRemoved=0`, `isolatedMayaPosteriorTrianglesRemoved=0`.
- **Comparación de PNG abiertos físicamente:** contra el [ZIP anterior #13908066085](https://github.com/mervaleta/cryptodromo/actions/runs/43136211801/artifacts/13908066085) y [V22 anterior #13631944728](https://github.com/mervaleta/cryptodromo/actions/runs/42517331509/artifacts/13631944728), en rear-00, rear-08, threeQuarter-00, threeQuarter-08, profile-00 y profile-08. Nuevo SHA256 `rear-00=7df4899abaeaf92c99ec...`, `rear-08=cbfb356b0b6171534c8e...`, `profile-00=08a95c65e4e6878383e1...`, `profile-08=2b903cb760fc45a28d8c...`. La partícula oscura separada bajo la pata posterior en perfil fase 00 deja de verse; persisten roturas en grupa/costura y deformaciones de las patas, por lo que la mejora NO es aceptable como V23.
- **Rechazo conservado:** el CI de 16 fases falla después de guardar imágenes porque el gate de dos restos Maya separados sigue reportando 0/0. No se tocó ese assert ni se modificó producción. El otro test de anatomía falla por 150 vs 144 caras de cierre (seis triángulos mediales ya existentes), pendiente de reconciliar con la topología original, sin suprimir la validación. **V23 sin marcar; V50 no validada.**

## 2026-11-23 · BTC collar UV seam welding (candidato aislado, V23 NO acreditada)
- Se inspeccionó físicamente rear-00.png del WebGL previo [run 43703166983, artifact 14157413825](https://github.com/mervaleta/cryptodromo/actions/runs/43703166983/artifacts/14157413825). Persisten cuñas visibles y uniones grupa-muslo abiertas.
- **Cambio real de malla skinned**: commit [8009891](https://github.com/mervaleta/cryptodromo/commit/80098910369edc8aa70557e4564febc97ba10941) en `racers/btc-native-hind-limb-repair.js`. El host projection anterior desplazaba cada vértice UV/material por separado; dos copias coincidentes de la misma posición podían terminar separadas físicamente. Ahora agrupa gemelos por posición antes de coser, valida todas sus caras incidentes contra inversión y aplica idénticos XYZ y pesos a todos. Conserva límites de desplazamiento, rechazo de caras y gate de restos Maya.
- **Validación disponible**: sintaxis JavaScript aprobada. NO se dispone aún de nuevos PNG WebGL ni de aceptación visual de este SHA. El conector de workflow para commits push devolvió lista vacía, por lo que **no afirmar que CI pasó**. Próximo paso obligatorio: localizar ejecución push del SHA 8009891, obtener artifact de 16 fases/seis cámaras, comparar rear-00/rear-08/3Q/perfil con 14157413825 y 14135961152; revertir si empeora o falla. V21 pública intacta. V23 sin acreditar, V50 sin anunciar.


## 2026-11-23 · BTC coincident-collar skin weights (candidato NO acreditado)
- Cambio real de deformación BTC aislado: `racers/btc-native-hind-limb-repair.js`, commit `dc040f73788622dc04c62714b26e88616937592d`. El reattachment del collar copiaba los pesos del primer índice UV a todas las copias coincidentes, aunque los vértices originales podían tener influencias distintas. Ahora combina los pesos de **todas** las copias físicas antes de interpolar la contribución Maya, normaliza los cuatro huesos dominantes y asigna el mismo blend a cada copia, para evitar separación durante Gallop.
- Sintaxis JS validada. `fetch_commit_workflow_runs` devolvió lista vacía para este push: **no hay WebGL ni aceptación demostrados**. Es necesario localizar el workflow BTC V22 de este SHA, obtener PNG reales de rear-00/rear-08/3Q/perfil, cotejar con artifact #14157413825 y #14135961152, y revertir si la deformación empeora. No se cambió el gate 0/0, ni producción, ni otros corredores. V23 sigue SIN acreditar. El candidato anterior de soldadura UV es `80098910369edc8aa70557e4564febc97ba10941` y tampoco tiene evidencia visual aceptada.


## 2026-11-25 · BTC hind-rim host-weight coupling A/B (RECHAZADO, V23 sin acreditar)
- **Candidato:** commit [0c45de5](https://github.com/mervaleta/cryptodromo/commit/0c45de5a8b1963278dfc03e858b0239aaf66703f), solo `racers/btc-native-hind-limb-repair.js`. Se probó transferir el peso Maya interpolado a los 98 vértices físicos del rim donante que tienen contraparte dentro de 4.5 mm; los 48 que admitían proyección geométrica segura conservaron el snap. La hipótesis era evitar que el puente skinned se despegara porque sus extremos seguían deformándose con distribuciones de huesos distintas.
- **WebGL real:** [smoke #45583543768](https://github.com/mervaleta/cryptodromo/actions/runs/45583543768), artifact #15008201153, ZIP SHA256 `783fd4f209d4bff7e1eca820d08994dfda26095526c65748fa3a5fd138e619e1`; [16 fases / seis cámaras #45583543760](https://github.com/mervaleta/cryptodromo/actions/runs/45583543760), artifact #15007283006, 30 PNG, ZIP SHA256 `2d509403a2838dabc8a06bfc4e4d5a26b5158fdfe488fd01c77dddc0fa6f7e7a`. Sintaxis, regresiones y render Chromium/WebGL completaron SUCCESS.
- **Métrica de deformación:** `rimHostWeightedVertices=98`, `sewnRimVertices=48`, `seamBridgeEdges=70/74`, `seamBridgeUnmatchedVertices=4`, `seamBridgeMaxGap=3.071 mm`, `seamBridgeMaxHostStep=4.846 mm`. El cambio alcanzó los 98 pesos esperados, pero no redujo los cuatro bordes sin puente.
- **Comparación física de imágenes:** rear-00/rear-08, profile-00/profile-08 y threeQuarter-00/08 contra el candidato anterior commit `3993318e88bb89e628118c7de6e1ebc67ae02357` (artifact #15006632409 y #15007252044). La silueta, la costura y el desgarro posterior permanecen esencialmente iguales; las diferencias de píxeles son residuales de render y no una mejora visible. El root de cola sigue mostrando la cavidad/estrella dentada incluso en `rear-00-no-tail.png`. **No acreditar V23.**
- **Decisión:** revertir este acoplamiento de pesos por no demostrar mejora visual. Mantener V21 pública, PR #136 draft, y los gates estrictos. Próxima raíz P0: resolver el cap real del dock de cola y la continuidad del collar mediante geometría visible, no más contadores. No publicar ni numerar versión.


## CHECKPOINT 2026-11-25 12:58 ART (CAP DE COLA MANIFOLD; V23 NO ACREDITADA)

**HEAD de rama:** `09033eb7cb91154feccd4138cbd1ddf20008e1e2` (PR #136 sigue draft/open; main y Hostinger no se tocaron).

### Reparación real probada
- `0e0d6d488f5a9ac0fc4ee73d430554d3148947ae` reemplazó la máscara ramificada de cola por un corte transversal real en `y=.0160`, con un único contorno de 24 aristas.
- CI detectó un defecto real de orientación: las 24 aristas interiores del cap compartían winding incorrecto. `92968d81b4266ca4a728beadb60ff16b60a52e57` orienta siempre el núcleo contra el borde interior del anillo, sin condicionar el winding al signo del área proyectada. El test de manifold dejó de fallar.
- `09033eb7cb91154feccd4138cbd1ddf20008e1e2` expone `tailDockCutPlaneY` en el snapshot runtime para que la QA compruebe el plano real, no una constante externa.

### Evidencia WebGL real
- Smoke Chromium/WebGL: run [45648806459](https://github.com/mervaleta/cryptodromo/actions/runs/45648806459), artifact #15039701498, ZIP SHA-256 `4712041a37701e14bd9a3ca0fe4ae44db2965be632c6052e45b809fe28bf342e`.
- Ciclo completo: run [45648806480](https://github.com/mervaleta/cryptodromo/actions/runs/45648806480), artifact #15038648716, ZIP SHA-256 `66afc2e3847476cacb35e76a38d51a317f84d3a45902546aeeeae39600a36dd4`. 30 PNG reales Chromium/WebGL, 16 hashes distintos de perfil y 3 diagnósticos aislados. El set actual contiene cinco cámaras nombradas (profile, threeQuarter, rear, front, detail), no seis; falta añadir top para cumplir el contrato completo.
- Baseline V21: artifact #13558229151, ZIP SHA-256 `4197bf1245a729d4693444512dbb2cb58881fb99372be1ca3453cbb1ea31d614`.
- Mejor candidato previo de geometría: artifact #15006632409, ZIP SHA-256 `b845dc33906ced8b1b6caf554fc146ca9bd475e03fd1a6c0a52f58b3dfeb54a1`.

### Métricas y decisión visual
- Tail dock: 24 aristas de borde, 70 triángulos de cap, 22 triángulos de núcleo, 0 autointersecciones proyectadas, 0 degenerados, 0 errores de winding y 0 bordes abiertos. La cavidad negra/estrella de la versión anterior desaparece en los píxeles, pero queda visible un disco plano tipo botón en la raíz; no está artísticamente integrado.
- Hind seam: host 74 aristas frente a donor 118; sólo 90 celdas bridge; **28 aristas sin emparejar**, 32 celdas de un triángulo, 4 vértices sin correspondencia, paso máximo de host 4.846 mm y gap medio 1.352 mm. En rear-04/rear-08/rear-12 y threeQuarter-08 siguen visibles cortes/grietas en la inserción de las patas, con patas posteriores demasiado finas y sin volumen muscular. El defecto P0 de grupa-muslo sigue abierto.
- Comparativa física: mejora clara de la raíz respecto del candidato #15006632409 (estrella negra -> cap cerrado/disco), sin regresión evidente de la silueta de patas; pero el seam de ancas continúa abierto y el resultado general sigue lejos de aprobación. Frente a V21 hay menos fragmentos en la grupa, pero no se acepta el caballo.
- `qa.json`: `liveHostingerVerified=false`, `AAAApproved=false`. La rama no se publicó. **V23 NO acreditada**: no contar esta mejora aislada como hito todavía; falta resolver la costura principal y la raíz de cola plana.

### Próximo trabajo obligatorio
1. Reemplazar la proyección independiente nearest-edge del seam por correspondencia ordenada de loops (zipper monotónico donor/host), emparejando los dos flancos y preservando skin weights; cerrar todas las aristas sin relajar asserts ni saltar celdas.
2. Capturar rear/profile/3Q/front/top/detail y las 16 fases; comparar cada cámara con V21 y #15006632409. No contar V23 hasta demostrar cierre visual del seam sin regresión.
3. Después del cierre, abordar el rig: el código todavía usa `makeSkinTransfer(source)` sobre el esqueleto Quaternius. Los scripts de exportación Maya están en el repo, pero en esta corrida no se encontró `Horse_VR_2017.ma` ni un JSON nativo de 70 influencias en repo, Library o `/mnt/data`; no afirmar que los pesos originales estén restaurados.
4. Mantener V21 pública y las ramas V4/V5 como rollback. No tocar los otros 99 corredores, fixture, apuestas, precios ni estadio.


## 2026-11-25 · BTC donor cut-rim arc skin coupling A/B (RECHAZADO, V23 sin acreditar)
- **Código:** commit [55e90aa](https://github.com/mervaleta/cryptodromo/commit/55e90aa83cc431ca960934da13f886f26b511b16), sólo `racers/btc-native-hind-limb-repair.js`. La hipótesis era que la abertura en fase 08 provenía de pesos distintos entre el rim donante y el puente skinned. El rim ahora recibe los pesos Maya interpolados desde su correspondencia exacta de arco; las copias UV/material coincidentes reciben el mismo skin. El collar superior pasa de 30% a 100% de influencia host en el corte z=.0200, con decaimiento suave hacia los pesos donantes a lo largo de 1.8 mm. No se movió el resto de la pata ni se tocó el clip Gallop.
- **Smoke Chromium/WebGL real:** run [45682075311](https://github.com/mervaleta/cryptodromo/actions/runs/45682075311), artifact [15054777682](https://github.com/mervaleta/cryptodromo/actions/runs/45682075311/artifacts/15054777682), ZIP SHA256 `c170746dd4414c6c639bd92c76550f8266372c5fad714c58ae6bd14584351355`. Se abrieron físicamente rear-00/rear-08, threeQuarter-00/08 y profile-00/08.
- **A/B contra el candidato previo:** smoke [45673685157](https://github.com/mervaleta/cryptodromo/actions/runs/45673685157), artifact #15050628691, ZIP SHA256 `0f721141ef78880bd3cf96231c18d4d31553bd008fd9d875dc9dc07e02e27bc7`. La abertura triangular del collar posterior en rear-08 permanece prácticamente idéntica; el cambio de píxeles es residual de render y no una mejora visual. rear-00 tampoco mejora de forma apreciable. El defecto es geométrico/topológico o de correspondencia de superficie, no queda resuelto por igualar pesos solamente.
- **Métricas aún malas del puente:** host rim 74 aristas, donor rim 118 aristas, gap máximo 4.388 mm, gap medio 3.421 mm y calidad mínima de triángulo 0.000869; 0 aristas sin emparejar en el zipper no equivale a una costura anatómica aceptable.
- **Ciclo completo:** run [45682075287](https://github.com/mervaleta/cryptodromo/actions/runs/45682075287) de 16 fases/seis cámaras seguía ejecutándose al registrar este checkpoint; todavía no hay artifact completo que permita aceptar o rechazar el cambio en las demás poses.
- **Decisión:** no acreditar V23, no modificar build público V21 y no publicar. Próxima raíz P0: corregir la geometría real del collar/puente para reducir la separación de contornos y eliminar la abertura en fase 08; conservar las aserciones estrictas. La restauración del skinCluster1 de 70 influencias sigue pendiente de exportación real del `Horse_VR_2017.ma`; el archivo original no está disponible en el repositorio ni en la Library/entorno de esta corrida, y el exportador Maya del repo no se ha ejecutado sobre el original.

## 2026-11-26 · BTC collar subdivision A/B y conformación parcial (sin hito V23)

### Tercer pase Loop: rechazado por topología
- Candidato `e521306f47003d556aa8939d66ceae5a79a8ba6f` aumentó la subdivisión del donante de dos a tres pases para dar más grados de libertad al collar.
- Chromium/WebGL smoke [run 45739644148](https://github.com/mervaleta/cryptodromo/actions/runs/45739644148), artifact #15080667499, produjo diagnóstico de arranque y ningún PNG. El ciclo de 16 fases [run 45739824513](https://github.com/mervaleta/cryptodromo/actions/runs/45739824513) también falló antes del primer PNG.
- Defecto geométrico exacto, sin relajar asserts: en el flanco z=-1 aparecieron dos paths donantes donde Maya tiene uno: un loop cerrado de 119 vértices y un path abierto adicional de 5 vértices/2.055 mm. No se aceptó esa topología. Se revirtió a dos pases en `084d2b86a8704a16f8c797eb8300a8059f8fe88a`; el test vuelve a exigir exactamente dos.

### Conformación parcial del collar: render real, mejora insuficiente
- Candidato geométrico `1b30d59fc223c2cd8534a8a55002a5a4675beb66`: limita el objetivo de proyección del rim al 35% para evitar pedir a la malla donante un desplazamiento completo de 3–4 mm en un único pase. No se cambió ningún gate.
- Smoke Chromium/WebGL [run 45740293131](https://github.com/mervaleta/cryptodromo/actions/runs/45740293131), artifact #15080349431, ZIP SHA-256 `91aee9a4f595d50b2d14e5efcd621164d821214c1df4a7685f7f951ff0e03fe4`. Diez PNG reales: rear/profile/threeQuarter en fases 00 y 08, más aislamiento no-donor/no-tail.
- A/B físico contra el candidato previo [run 45731702983](https://github.com/mervaleta/cryptodromo/actions/runs/45731702983), artifact #15077681015, ZIP SHA-256 `2351efeab9fb45dba21ff2214cdf09f79ef7634a0bd731146fb9f8fda0015181`. MAE RGB por cámara entre 0.32 y 0.55; menos del 2.1% de píxeles cambia más de 10 niveles. La abertura triangular de la unión grupa-muslo en rear-08 y el borde cortado de la inserción siguen visibles. **Cambio insuficiente para acreditar mejora visual.**
- Métricas del nuevo smoke: `seamWarpTargetFraction=0.35`, `seamWarpFactor=0.28319`, gap máximo 4.273 mm, gap medio 3.135 mm, calidad mínima del zipper 0.01023, 195 triángulos de puente, 0 aristas sin emparejar. La mejora de métricas frente al candidato previo es pequeña y no se traduce en integración anatómica visible. El cap de cola sigue siendo un disco plano.
- El ciclo completo de 16 fases/seis cámaras [run 45740293114](https://github.com/mervaleta/cryptodromo/actions/runs/45740293114) seguía ejecutándose al registrar este checkpoint; no se acredita todavía como candidato de ciclo completo.
- **Decisión:** no marcar V23, no desplegar y no tocar producción V21. Mantener el número sin avanzar. Siguiente raíz P0: abandonar el ajuste incremental del collar y resolver la unión como superficie continua/manifold con correspondencia de vértices y skinning coherente; la restauración del skinCluster1 de 70 influencias sigue bloqueada porque el archivo fuente `Horse_VR_2017.ma` y los dos archivos privados de pesos/bind matrices no están disponibles en el repositorio, Library ni `/mnt/data` de esta ejecución. Los scripts de extracción sí permanecen en PR #136.

## CHECKPOINT 2026-11-26 (CURVED HIND-SEAM CANDIDATE, V23 NOT CREDITED)
- Reviewed the current PR #136 head, issue #135, issue #137, `docs/BTC-MASTER-CHANGELOG.md`, and this ladder before changing geometry. Current isolated branch head is `a569a6af8c2fa558847b3c5c9b9eefe819da049e`; PR #136 remains unmerged. No production or other horse assets were changed.
- Prior full-cycle candidate `1b30d59` (artifact #15081392535) remained visually almost identical to its predecessor despite the .35 seam-warp target: rear/3Q/profile showed the same rump-to-hind-leg break. Its seam residual gap was 4.273 mm, with two virtual closures and a zipper minimum quality near .010.
- New code candidate: `racers/btc-native-hind-limb-repair.js` adds a six-row curved skinned transition strip (four intermediate rings) between donor and host rims, with blended normals and weights. It keeps the existing triangle-quality floor at .015; no assertion or quality threshold was relaxed. The intermediate-vertex cache is keyed by donor vertex AND physical host sample so corner samples cannot alias.
- Real Chromium/WebGL smoke run: [run 45748362514](https://github.com/mervaleta/cryptodromo/actions/runs/45748362514), artifact #15083933576, ZIP SHA256 `51711ecf977249f024ead95f12e6e433aa5fc9db02868b9ee9e1b57fee26dee8`. Opened rear-00/rear-08/3Q-00/08/profile-00/08 and the no-donor/no-tail diagnostics. The smoke workflow passed.
- Structural metrics: bridge triangles 698 (previous 195), six rows on the resampled path, one of two loop pairs resampled, min zipper quality .01302, max residual gap 4.273 mm, two virtual closures. The orphan gate now reports 2 isolated Maya posterior islands / 42 triangles removed, plus 4 residual components / 32 triangles removed. These are real topology metrics, not proof of a clean visible join.
- Pixel comparison against prior candidate artifact #15081392535: matching rear/3Q/profile frames have MAE only 0.22–0.34/255 after 800x600 normalization, with 0.93–1.39% of pixels changing by more than 10 levels. Physical inspection shows no material visual improvement; the same bulky rump/thin hind-limb junction and detached-looking tail groom remain. **Do not credit V23.** Keep the version number unchanged.
- Full 16-phase / six-camera Chromium-WebGL run [45748362258](https://github.com/mervaleta/cryptodromo/actions/runs/45748362258) is still running at this checkpoint. Next action: retrieve its complete artifact and strict gate result, compare all rear/3Q/profile frames against #15081392535 and V21 #13558229151, then decide whether to retain or revert the multi-ring bridge.
- Root defects to address next, not another numeric seam-warp tweak: (1) eliminate the host-side T-junction/virtual-closure attachment so the bridge shares the actual subdivided host boundary under skinning; (2) close the 4.273 mm donor/host residual gap without folding the collar; (3) recover the original Maya `Horse_VR_2017.ma` 70-influence skin and bind data. Issue #137 confirms those exact private exports were generated in an earlier local `/mnt/data/horse-audit` workspace but were not committed. They are not present in the current `/mnt/data` or Library listing, so do not claim the original 70-weight rig has been restored.
- Public deployment was not touched. No V23-V50 milestone is accepted, no AAA/MODELO MAESTRO label, and no user notification.
