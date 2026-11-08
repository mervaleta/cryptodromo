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
