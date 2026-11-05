# CRYPTÓDROMO · BTC · protocolo obligatorio de benchmark y estado de bloqueo

**Fecha de corte:** 2026-11-05 (America/Argentina/Buenos_Aires).  
**Base inmutable de auditoría:** `b5b0bd673a4a4827f74f360f55976e9d9b66917a`.  
**Ficha única exigida:** https://race.cryptodromo.com/racers/#BTC  
**ESTADO:** NO APROBADO / REQUIERE QA VISUAL EN NAVEGADOR / NO AAA / NO CLONAR LOS OTROS 99.

## Material estudiado
- Se decodificó el MP4 original `212734.mp4` completo: 316 cuadros a 1920 × 1080, 10,503991 s, ~30,1 fps. Se generaron planchas de 24 cuadros distribuidos, 24 cuadros consecutivos y ocho cotejos de poses frente al GLB. Las planchas y el informe ampliado se entregaron como artefactos en la conversación.
- El video es un caballo blanco animado sobre verde, **no una grabación real con suelo visible**. La extensión, flexión, recogida, recuperación y pelo se pueden observar, pero el contacto exacto con el terreno no puede certificarse solo con el croma.
- Periodicidad de referencia estimada por autocorrelación visual: ~28–29 cuadros (~0,93–0,96 s).
- Referencias exteriores: Rival Stars Horse Racing Desktop (movimiento y puesta en escena), Winning Post 10 2026 y artículo CGWORLD https://cgworld.jp/article/202608-cgw336-wp10.html (musculatura por blendshape, movimiento aditivo, materiales/pelo direccionales y cámaras), G1 Jockey / Gallop Racer (lectura de carreras y cámaras).

## Fuente GLB y Maya
- `cryptodromo-horses/assets/horse.glb` extraído del ZIP del proyecto, activo estilizado Quaternius, 8 primitivas y aproximadamente 4400 vértices; 50 huesos skinned, Gallop original 43 canales, duración **0,583333313 s**.
- Se calcularon offline 16 poses por skinning y cinco perspectivas a partir del GLB. **No son capturas WebGL de Hero V5 ni de la URL canónica**.
- Comparar por fase normalizada, no por segundo cronológico: velocidad de bucle nominal muy distinta al MP4.
- `Horse_VR_2017.ma` contiene alrededor de 164 joint nodes y 31 skinClusters detectados en texto. El Maya detallado **no es automáticamente compatible con el rig Quaternius de producción**. El retarget de skin por proximidad de `btc-maya-master.js` requiere pruebas específicas de deformación en ancas, babillas y corvejones.
- Existen también `Horse_VR_2017.mb` y `Horse_VR_2018.mb`; no se certificó su rig visualmente al faltar ejecución Maya.

## Selección efectiva del BTC en código main
`racers/index.html` → `racers/racers.js` → `racers/btc-atelier-preview.js` → `racers/btc-hero-v5.js` → V4 + silk shell + rig nativo. BTC directo elige `enhanced`; `?btcMaster=original` es rollback manual; `?btcMaster=maya` es variante de diagnóstico. `racers/btc-master-revision.json` registra `btc-restore-v5-hair-gallop-20261105-v1`, estado `needs_visual_qa`. No hay prueba de que Hostinger muestre ese mismo SHA.

## Preservación obligatoria
- GLB nativo: rig/clip Gallop; geometría estilizada, sin anatomía AAA.
- V4: fibras/locks skinned; no descartar la evolución.
- V5 pase 10 + `btc-silk-shell-v5.js`: candidato que recupera crin y cola volumétricas con inercia, pero **sin aceptación visual todavía**.
- `btc-hair-v15.js`: deformación horneada de la malla original, distinta del groom V5.
- Maya: `btc-maya-body-data.js`, `btc-maya-master.js`, `btc-maya-hindquarters.js`, `btc-maya-pose-volume.js`, `btc-maya-ears.js`, `btc-maya-face-details.js`, `btc-maya-groom.js`; conservar como estudio anatómico, no reemplazo público accidental.
- PR #89 (ancascorvejones, v13b), PR #99 y #100 (ojos/nuca/groom) siguen como trabajos que **no deben fusionarse a ciegas**.
- Evidencia/contratos en `tests/btc-maya-anatomy-browser.mjs`, `tests/btc-v5-visual-iterations.mjs`, `tests/btc-public-master-browser.mjs`; tests verdes no equivalen a aprobación visual.

## Defectos prioritarios (P0)
1. Ruptura/estrechamientos de ancas y patas traseras en fases del Gallop; conservar la conexión de muslo, babilla, corvejón, caña y pezuña.
2. Ojos o fragmentos flotantes fuera de las órbitas y continuidad cabeza/cuello.
3. Posibles perforaciones en bases de orejas y occipital.
4. Fibras sueltas bajo la crin, raíces separadas, dos sistemas de pelo superpuestos.
5. Pelaje excesivamente plástico y masa capilar que no sigue ritmo/inercia del galope.
6. Deslizamiento o penetración de cascos, a medir contra suelo visible.
7. Regresiones de rendimiento, shaders o imports, y cache en Hostinger.

## Próximo paso de ejecución (bloqueado)
1. Releer main y detectar concurrencia; fijar un SHA y guardar rollback V5 en rama de trabajo.
2. Abrir **URL canónica sin query** y tomar capturas WebGL verdaderas en perfil izquierdo/derecho, frente, atrás, 3/4 y detalle, en reposo y 16 fases del ciclo. Repetir sobre V4/V5/GLB original y Maya diagnóstico.
3. Comparar capturas fase por fase contra `212734.mp4` y referencias de juegos, con matriz anatómica y criterios P0.
4. Elegir UNA corrección de P0 a la vez, implementar en rama aislada y reproducir capturas. Revertir si empeora alguna perspectiva.
5. Publicar únicamente cuando se valide el código y caché real de Hostinger; actualizar revisión y bitácora. NO declarar maestro ni replicar 99 sin aprobación visual explícita.

**Bloqueo actual:** Chromium de este entorno no consigue WebGL/SwiftShader y la navegación directa al Hostinger no entregó un render comprobable. La investigación offline pudo producir evidencia geométrica, pero no verifica las superficies y galope V5 reales en producción. Por eso no se modificó el código ni se promocionó ningún caballo como AAA.

**Línea base recuperable, NO mejor versión visualmente comprobada:** `btc-restore-v5-hair-gallop-20261105-v1` observada en main. Mejor versión visualmente comprobada: **todavía indeterminada**, falta comparación de capturas reales. Evitar la pérdida de mejoras en cualquiera de las ramas mencionadas.

**Artefactos del diagnóstico entregados junto al informe de esta conversación:** `mp4_todo_el_video.jpg`, `mp4_secuencia_consecutiva.jpg`, `mp4_vs_glb_8_fases.jpg`, `glb_cpu_skin_gallop_16.jpg`, `glb_cpu_skin_5_angulos.jpg`, `INFORME_BENCHMARK_BTC_2026-11-05.md`, `estado.json`.
