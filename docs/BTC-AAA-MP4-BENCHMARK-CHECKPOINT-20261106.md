# Cryptódromo · BTC AAA · benchmark visual previo a implementación
**Checkpoint:** 2026-11-06 (ART)  
**Estado:** investigación y rechazo de V20b como caballo maestro. SIN cambios de producción.  
**Referencia canónica:** https://race.cryptodromo.com/racers/#BTC  
**Base de esta rama:** `main` `0cfeb06655e636d53ad77a940c99e29f0dec6220`.

## Objetivo no negociable
Caballo 3D master con anatomía de pura sangre, locomoción convincente y continuidad de cabeza, cuello, dorso, grupa, músculos y cuatro extremidades. Evaluación real de silueta, pelo, ojos, texturas, materiales y contacto con el suelo. Comparable visualmente con Rival Stars Horse Racing Desktop y Winning Post 10 2026. **No significa que compiló ni que pasó WebGL.** No declarar maestro, no extender a otros 99 sin aprobación visual explícita del usuario.

## Material obligatorio: estudio del video original `212734.mp4`
El video original del proyecto se abrió y se decodificó (no se utilizó una recreación):
- H.264 1920x1080; 316 frames; duración 10.503991s; FPS estimados 30.0976316.
- Sujeto: caballo gris claro en galope de perfil derecho sobre chroma verde; cámara fija. No hay piso de contacto visible, así que no es posible confirmar con rigor biomecánico el apoyo exacto de cada pezuña solo por la altura en píxeles.
- Extracción de todo el video: plancha con 21 muestras a intervalos de 0.5 s.
- Muestreo adicional: 105 fotogramas a 10 muestras/s; plancha de 16 poses del fotograma nativo 66 al 96, de dos en dos, tiempo 2.19–3.19 s.
- Periodicidad reproducible: comparación MSE de máscaras de silueta cromakey 192x108, intervalo de estabilidad 30:220, mínimos a desplazamientos 29 y 57 frames: aprox. **0.96 s por ciclo**, no un número arbitrario.
- Descripción de secuencia: 2.19–2.39 s recuperación y recogida anterior progresiva; 2.46–2.66 s recogida con proyección de anteriores; 2.72–2.99 s extensión/proyección y avance del tren posterior; 3.06–3.19 s retorno hacia recuperación. Son **etiquetas visuales aproximadas**, no contactos certificados.
- Crin: se desplaza hacia atrás con cambios de curvatura y retraso respecto de cuello/cabeza. Cola: amplitud más marcada en extremo, base continua con grupa. Aplicar el video como referencia de comportamiento y proporciones, no como gold standard incuestionable de física.

## Material externo investigado
1. **Rival Stars Horse Racing / Desktop Edition:** modo carrera, gráficos desktop, Photo Mode, creación de caballos. Captura de movimiento utilizada para animación según entrevista al equipo de PikPok / material oficial de la franquicia. Benchmark: amplitud y naturalidad de zancada, ritmo de cabeza/cuello, conservación de silueta y galope visto desde diferentes cámaras.  
   https://www.rivalstarshorseracing.com/  
   https://www.themanequest.com/blog/2024/4/24/we-expect-to-support-the-game-for-years-to-come-insights-on-rival-stars-horse-racing-from-pikpok-ceo-mario-wynands
2. **Winning Post 10 2026:** artículo técnico CGWORLD (2026-08-26) documenta modelo base de alta calidad + blendshapes para distintos cuerpos, deformaciones musculares dependientes de pose, shader PBR con brillos anisotrópicos para pelaje, hair shader separado para crin/cola, base motion con animaciones aditivas, animación de curvas, tres familias de cámara y VFX de arena ligados a huesos de pezuñas. Referencias cinematográficas de campo, color charts, luces HDRI. La implementación concreta es del motor propietario Katana: llevar principios a WebGL, no trasplantar código.  
   https://cgworld.jp/article/202608-cgw336-wp10.html  
   https://www.gamecity.ne.jp/winningpost10/2026/
3. **G1 Jockey / Gallop Racer:** buenas lecciones históricas de cámara intercambiable, encuadre y dinámica de carrera, control de aceleración, posición y resistencia. No usar su nivel de detalle visual de hace 20 años como vara estética.  
   https://www.gamespot.com/articles/gallop-racer-preview/1100-2775968/  
   https://www.gamespot.com/reviews/gallop-racer-2006-review/1900-6152772/

## Código y activos identificados
- Cadena de ficha canónica descrita en `racers/AGENTS.md`: `index.html → racers.js → btc-atelier-preview.js → btc-maya-master.js → btc-maya-groom.js` y dependencias.
- En `main`, `racers/btc-master-revision.json`: build `btc-v20b-native-hind-gallop-20261105`, status `needs_visual_qa`. El log histórico confirma múltiples desvíos de variante `original`, `v5`, `maya`; **no descartar V4/V5** por cambios de selector.
- PR #132 V20b **fusionado en main** (2026-11-05); 484 triángulos de miembros posteriores + 44 de cascos del GLB original con skinning nativo, extracción de 1977 triángulos Maya distales. Esto mejora integridad del rig frente a V16 pero NO cierra el gap estético.
- Archivos locales aportados: `Horse_VR_2017.ma` (82MB), `Horse_VR_2017.mb` (65MB), `Horse_VR_2018.mb` (67MB); ZIP `cryptodromo-horses.zip` con `horse.glb` Quaternius y cliente Three.js, y ZIPs históricos CRP. No atribuir a Quaternius un nivel AAA que no tiene: la malla local tiene aproximadamente 4400 vértices en 8 primitivas y aspecto base low-poly. **Pendiente análisis profundo de topología Maya y renders actuales en navegador**.
- V20b evidencia **real de Chromium/WebGL**: Actions run https://github.com/mervaleta/cryptodromo/actions/runs/42089387495, artefacto #13445446252, `btc-v20b-all-16-gallop-poses-and-three-views`: 16 PNG `profile-00..15`, 4 PNG tres cuartos, 2 PNG trasera y `qa.json`. En el JSON se declara `liveHostingerVerified:false` y `AAAApproved:false`. La existencia de un artefacto real no prueba la publicación o el nivel AAA.
- `docs/BTC-MASTER-CHANGELOG.md`, `docs/BTC-MASTER-VISUAL-BACKLOG.md`, `docs/BTC-MANE-TAIL-PHYSICS-BRIEF.md`: aún pendientes nuca, orejas, ojos, hocico, crin y cola; ordenar geometría antes que física capilar. Cuidar coexistencia de ramas/PR activos.

## Evaluación visual independiente sobre 22 capturas V20b reales
**Resultado: RECHAZADO para certificación AAA y clonación.** Se observan:
- **Anatomía:** pérdida de riqueza de hombro, cuello, anca y cadenas musculares; transiciones rígidas respecto del MP4 y benchmarks. Apariencia de escultura suavizada en vez de piel sobre musculatura funcional.
- **Cabeza/ojos/hocico:** ojos poco expresivos, ollares y región ocular insuficientes para una primer plano AAA; aparente falta de globo ocular y superficies finas convincentes. No afirmar defecto geométrico exacto sin inspección de malla.
- **Crin/cola:** crin oscura casi plana en dorsal; cola voluminosa en forma de cinta/cordón que parece separada; en vistas traseras, la raíz muestra aristas/cortes muy notables y unión antinatural.
- **Galope:** 16 cuadros muestran continuidad de las patas, pero no prueban las fases de contacto y suspensión frente a suelo; la proyección y recogida global son menos convincentes que MP4; no se acepta sin sincronización exacta y más ángulos.
- **Material:** color naranja/castaño homogéneo, falta microrrelieve y variación natural de pelo corto, ojos y pezuñas; iluminación de QA con fondo negro y piso simplificado no permite certificar look final.
- **Evidencia insuficiente:** no hay frente ni perfil contralateral en este artefacto y no se comprobó build efectivo Hostinger desde navegador público en esta sesión.

## Protocolo antes de modificar
1. Fijar baseline **visual** de producción y baseline de mejor candidato accesible, guardando commit, `buildId`, ruta y fotogramas. No existe baseline AAA aprobado: `bestVisualApproved = none`. V20b sólo baseline parcial para patas.
2. Capturar mismas cámaras desde ambos perfiles, frente, posterior, tres cuartos; mismo FOV, distancia, luz, phase y estado del caballo. Repetir 16 fases, idle, transiciones, pausa/resume.
3. Comparar por regiones: cabeza y hocico; nuca/orejas (sin agujeros); dorso, grupa y unión cola; muslo, babilla, corvejón y caña de cada pata; pezuñas y contacto; iris/pupila/córnea; materiales de cuerpo y pelo.
4. Arreglar primero **topología, skinning y silueta**; nunca maquillar una pata rota con shader o FX. Descartar automáticamente las iteraciones con partes desprendidas, deformación de corvejón o clipping.
5. Después lookdev: ojos esféricos inset, reflejos físicos, PBR/albedo/normal/roughness/AO, micropelaje sin ruido; crin y cola con raíces sólidas, guías, colisión y amortiguación; musculatura correctiva según fase.
6. Para cada iteración: lado-a-lado baseline/candidato en navegador, registrar qué mejoró/empeoró; rollback si regresión. Actualizar `racers/btc-master-revision.json`, changelog y caches SOLO en cambio efectivo del maestro.
7. Verificar **Hostinger canónico sin flags** `/racers/#BTC`, tomar capturas del servidor real y cotejar version. No confundir merge PR con deploy.
8. Prohibido anunciar **MODELO MAESTRO**, dar AAA por verde o tocar otros 99 sin aprobación visual explícita.

## Próximo trabajo todavía no realizado
- Render del modelo **actual** en ambos perfiles, frente, posterior y tres cuartos desde Hostinger/Chromium real; comparar a tiempos sincronizados con el MP4.
- Análisis del rig real y topología de archivos Maya originales, unión cuello-orejas y tren posterior.
- Matriz de regresiones V4 vs V5 vs V16/V18/V20b con PNG equivalentes, incluyendo cada módulo hair/groom, shader y sus importadores activos.
- Corroborar el build `btc-v20b-native-hind-gallop-20261105` realmente servido en Hostinger; sin red en el entorno local no se pudo abrir ese host.
- No se ha modificado caballo, rig, motor, precio, apuestas, selector predeterminado ni 99 corredores.

**Checkpoint reproducible en GitHub:** este documento y artefactos Actions enlazados. El MP4 fuente permanece en archivos del proyecto; las planchas de extracción se generan sin alterar el video.