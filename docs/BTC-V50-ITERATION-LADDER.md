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
