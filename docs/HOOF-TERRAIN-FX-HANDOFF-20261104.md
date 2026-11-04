# Hoof / Terrain FX · handoff para el maestro BTC

**Fecha:** 4 de noviembre de 2026  
**Rama aislada:** `feat/hoof-terrain-fx-20261104`  
**Sincronización:** merge desde `main` `5b68519218bebe86e7b93f6eaa9eda85b29b45df` en `b09bbe438b66b711269f0e2e68d0fa3c981797d0`. Se respetaron los importadores `satoshi-cachefix-20261104-v3`.  
**Estado:** implementación y pruebas de lógica preparadas; **NO** fusionar ni anunciar como AAA validado sin pruebas visuales con el maestro anatómico definitivo. `main` y Hostinger no se modifican.

## Qué se solucionó

La carrera anterior emitía polvo desde una nube regenerada constantemente detrás del caballo y estampaba huellas al recorrer una distancia fija. En una curva esas marcas podían no corresponder a ninguna pezuña, y la nube nacía sin impactos.

El módulo nuevo usa cuatro eventos de apoyo diferenciados por caballo, sobre una secuencia de galope transverso: posterior exterior, posterior interior, anterior exterior, anterior interior y suspensión. El liderazgo de la mano podrá configurarse cuando el rig definitivo lo exponga. En el motor de carrera actual, el GLB ofrece `hoofPhase` y la fase sincroniza esos eventos. También hay un modo **prioritario** de colisión real que acepta coordenadas mundiales de las cuatro suelas.

**QA verificado en Chromium:** Three.js normaliza puntos y otros separadores de los nombres de nodos del GLB. El archivo exportado utiliza `BackLowerLeg.L_end` y `FrontLowerLeg.L_end`, pero los nodos en escena se llaman `BackLowerLegL_end` y `FrontLowerLegL_end`. Esa diferencia provocaba que el detector usara `phase` en vez de los marcadores. Resuelto en commit `c66c8ebd335731837e89da8e0adaea1b62d759ef`. **Acción `Hoof Terrain FX | Contacts and Regression` [#41907517908](https://github.com/mervaleta/cryptodromo/actions/runs/41907517908): `hoof-terrain` y `browser-qa` SUCCESS.** Hay capturas de tierra, arena y césped en el artefacto `hoof-fx-three-surfaces-btc`. No son prueba de FPS móvil ni de acabado AAA final.

**Mejora añadida durante el QA:** en el GLB actual, los nodos animados
`BackLowerLegL_end`, `BackLowerLegR_end`,
`FrontLowerLegL_end` y `FrontLowerLegR_end` permiten calcular
la posición de cada punta de casco a través de la cinemática real del
esqueleto (en orden LH/RH/LF/RF). Se emplea un desplazamiento vertical
provisional de 0,22 m calibrado para el caballo de 2,85 m. Esto habilita
aterrizajes geométricos aproximados desde ya. No representa aún el
volumen de colisión de la herradura final ni un sistema de IK.

La API esperada del futuro maestro es:

```js
model.getHoofContactPoints = () => [
  {x: leftHindWorld.x, y: leftHindWorld.y, z: leftHindWorld.z},
  {x: rightHindWorld.x,y: rightHindWorld.y,z: rightHindWorld.z},
  {x: leftForeWorld.x, y: leftForeWorld.y, z: leftForeWorld.z},
  {x: rightForeWorld.x,y: rightForeWorld.y,z: rightForeWorld.z}
];
// Entregar X, Y, Z de la cara INFERIOR de la pezuña, ya deformada por rig.
// No entregar la posición de la articulación por encima del casco.
```

Si la función existe y entrega cuatro posiciones finitas, `hoofContactSolver` usa aterrizaje, despegue e histéresis. Si no existe, lee los cuatro huesos terminales del GLB actual. Cuando faltan esos huesos, usa `hoofPhase`. Si tampoco existe, utiliza un reloj cosmético independiente. Ningún modo escribe posiciones deportivas ni datos de precios.

## Archivos añadidos

- `visual-lab/hoofContactSolver.js`: detector puro, cuatro patas, seguimiento de fase, transformación de contacto a XZ, modo suelas, teletransportes y reinicios.
- `visual-lab/hoofTerrainFX.js`: huellas por `THREE.InstancedMesh`, sombras de contacto por pezuña, un único `THREE.Points` con shader y buffers reciclados, respuesta por humedad, calidad y terreno.
- `visual-lab/hoof-fx-lab/index.html` + `lab.js`: laboratorio aislado para comparar **el BTC con la geometría Maya actual** superpuesta al galope original; un selector permite volver al GLB y comparar.
- `tests/hoof-terrain-fx.mjs`: pruebas de cuatro apoyos, direcciones, 12 corredores/60s, supresión de fantasmas, sensores reales, superficies y contrato de integración.
- `.github/workflows/hoof-terrain-fx.yml`: análisis de sintaxis y regresión CI.

## Ajustes de la transmisión en esta rama (NO en main)

- `visual-lab/scene.js`: mantiene `trackFX` para humedad/charcos pero oculta sus huellas falsas. Llama a `hoofFX.stepHorse()` **después** de `h.model.update()`, y `hoofFX.update()` por cuadro. Limpia buffers entre carreras y cambios de circuito.
- `visual-lab/index.html` + `stadiums/crypto/broadcast/index.html`: selector de **arena** añadido y versión de recurso actualizada.
- `visual-lab/proceduralGround.js`: microrelieve analítico para arena. La pista Genesis pasa de sintética a arena **en esta rama**; Muybridge es tierra y Vint Cerf es césped. La sintética sigue siendo seleccionable en el laboratorio.
- Modo de inspección: `?hoof-qa=1` habilita `window.__cryptodromoHoofQA.snapshot()` (lectura solamente).

## Respuesta visual por superficie

| Superficie | Golpe y huella | Material suspendido |
| --- | --- | --- |
| Tierra compactada | huella oscura, compactación moderada | polvo terroso, terrones de vida corta |
| Arena | huella más ancha, color ocre | granos claros que saltan y caen; leve nube seca |
| Césped | pequeña compresión oscura | briznas verdes; casi sin polvareda |
| Sintética | huella muy sutil | microgranos dispersos |
| Cualquiera mojada | marca más contrastada | supresión de polvo + gotas pequeñas de impacto |

Los presupuestos máximos están fijados en 220/740/1350 partículas visibles para eco/equilibrada/cinematográfica y 450/950/1700 marcas de huella. Una sola malla instanciada de huellas, otra de sombras y una sola pasada de puntos minimizan draw calls. Son límites de diseño, NO resultados medidos de FPS.

## Cómo inspeccionar visualmente

Con la rama desplegada en un entorno de prueba (no producción):
1. Abrir `/visual-lab/hoof-fx-lab/` y mirar el casco trasero, ambos delanteros y la fase aérea con cámara baja y zoom. Alternar modelo Maya/GLB.
2. Probar tierra, arena y césped con humedad 0%, 50% y 100%; comparar huella, grano, sombra y salpicaduras.
3. Probar los tres canales `/stadiums/crypto/broadcast/?track=muybridge|genesis|vint-cerf&hoof-qa=1` con 12 caballos y modo eco. Verificar que los FX siguen la tangente de cada pista.
4. En un replay, pausar/reanudar, cambiar carrera, completar 60 s y verificar que no quedan huellas de la carrera anterior ni nacen impactos durante presentación.
5. Registrar video de cámara baja, cámara lateral y toma aérea, tiempos de GPU/CPU, FPS p50/p95 y conteo de draw calls. Metas de **aprobación** (no medidas): 50+ FPS desktop y 30+ móvil con 12 animales, sin sobreposición de cascos, flotación ni huellas durante suspensión.

**Límite actual:** las cuatro puntas de hueso animadas se pueden seguir geométricamente, pero una punta de hueso con offset es una aproximación a la suela, no la superficie física final del casco. Falta el getter de cuatro suelas del agente 3D, el ajuste de altura final y el locking/IK durante la fase de apoyo; el fallback de fase solo se usa si no están los cuatro huesos. Para una producción AAA se requieren además validación visual cuadro a cuadro, geometría de suela definitiva, orientación de la mano del galope, variación volumétrica y LOD probado en hardware real.

## Integración cuando el agente termine

1. Actualizar esta rama contra el SHA de `main` aprobado y verificar diferencias en `scene.js`, `horseRenderer.js` y `racers/btc-maya-master.js`; **no sobrescribir ni revertir** cambios nuevos del maestro.
2. Congelar la API `getHoofContactPoints`, en orden LH/RH/LF/RF y coordenadas WORLD. Exponer el mismo contrato desde el maestro en broadcast si reemplaza al GLB de carrera.
3. Ejecutar `node --experimental-default-type=module --test tests/hoof-terrain-fx.mjs` y las pruebas oficiales más CI. Inspeccionar los tres circuitos en navegador con 12 animales antes del merge.
4. Tras aceptación, fusionar PR y comprobar despliegue Hostinger y caché. Esta rama no altera la clasificación oficial, input1/input2, dosis, mercados ni apuestas.

Referencias de técnica: gallop transverso de cuatro tiempos y suspensión (University of Minnesota / equine biomechanics); `THREE.InstancedMesh` para limitar draw calls.
