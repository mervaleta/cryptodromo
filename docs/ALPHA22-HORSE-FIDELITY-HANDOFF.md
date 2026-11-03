# Alpha22 · Horse Fidelity Studio
## IMPORTANT: integration target changed while Alpha22 was in development

Latest checked `main fef892d5` now includes **Alpha20 opt-in procedural LIVE horses**:
- `visual-lab/proceduralHorse.js` generates the existing procedural body, jockey and racing mantle.
- `visual-lab/proceduralMath.js` solves its two-bone IK.
- `visual-lab/proceduralGround.js` handles GPU ground materials.
- `visual-lab/horseRenderer.js` switches existing `horse-engine=legacy` and `horse-engine=procedural`.
- LIVE `visual-lab/scene.js` already calls that renderer; DO NOT introduce another horse loop or 12 more horses.

**Alpha22 is now a fidelity successor, NOT a competing active render engine.** Preserve Alpha20's existing `procedural` mode and all its tests. When approved, add a THIRD opt-in query choice `horse-engine=fidelity` that calls `createAlpha22RaceHorse` from `horseAdapter.js`. The new bridge accepts exactly Alpha20's existing options, retains a generated jockey/reins, a numbered saddlecloth, and prevents shared data mutations. Keep `legacy` default until visual/performance comparisons pass.

Illustrative, intentionally NOT applied to the active branch:

```js
// In visual-lab/horseRenderer.js, once other agents are finished:
import * as THREE from 'three';
import {createAlpha22RaceHorse} from './horse-fidelity/horseAdapter.js?v=alpha22-1';

export function selectedHorseRenderer(search=globalThis.location?.search||''){
 const requested=new URLSearchParams(search).get('horse-engine');
 return ['procedural','fidelity'].includes(requested)?requested:'legacy';
}
export async function createHorse(options={}){
 const selection=selectedHorseRenderer();
 if(selection==='fidelity')return createAlpha22RaceHorse({THREE,...options});
 if(selection==='procedural')return createProceduralRaceHorse(options);
 return createLegacyHorse(options);
}
```

**Do not replace `installProceduralGround`, existing weather, Alpha20 gates, Alpha19 fixtures, Alpha21 contacts, or `trackPoint`.** Alpha22's hoof phases follow .03/.14/.28/.43 like the staged Alpha21 contact detector; both only control rendering. The Alpha21 `bodyFollowThrough` adapter is for GLB bones and should not be added on top of Alpha22's independent head/neck rig. Use `racePolishKit` contact spray only after checking for already active spray to avoid a duplicate system.

The side-by-side tool in `/visual-lab/horse-fidelity-preview/` can now load Alpha20 `proceduralHorse.js` when that file exists (as it does on the latest main) and show both versions with one lighting/camera setup. In the original detached branch where Alpha20 source is absent, that comparison button degrades gracefully; the other 3 preview modes remain available.

---


## Procedural equine pipeline · original artwork · NO PNG · NO GLB

**Estado:** DESARROLLADO en rama `prep/alpha22-fully-procedural-horse-20261103`. **No está conectado al LIVE, no fusionar ni desplegar hasta reauditar los otros agentes.** Basado en `main d12f2bb` (3 noviembre 2026). Alpha21 galope/estadio está en PR #44 aparte; Alpha19 tres pistas en PR #43. No reemplazar `race-lab/source/src/horse.js` ni `visual-lab/scene.js` todavía.

### Referencia NONECG y autoría

El manual adjunto `Horses_Manual.pdf` describe un caballo realista animado para Maya/V-Ray, con gallop, walk, canter y variaciones de pelaje/pelo. El usuario especificó que NONECG sólo aporta objetivos de anatomía y look & feel. **Ningún archivo .ma, .mb, .max, FBX, textura ni modelo de NONECG se importa, adapta ni distribuye.** Nuestro caballo se genera con código original (secciones anatómicas, PBR analítico, geometría de pelo, rig jerárquico). Ningún caballo carga GLB, PNG, JPG, SVG, sprites o canvas textures. Las referencias de anatomía son estilización libre y proporciones de un caballo genérico, no copias de la malla NONECG.

### Archivos nuevos

- `visual-lab/horse-fidelity/horseProfiles.js`: 4 conformaciones (sangre pura, potencia, elegante, resistencia), 8 pelajes, identidad por seed, parámetros validados.
- `visual-lab/horse-fidelity/horseGeometry.js`: superficies 3D por loft de sección transversal suave; torso, cuello, cabeza, músculos, extremidades y zócalos.
- `visual-lab/horse-fidelity/horseShader.js`: material físico analítico con grano 3D, pigmentación, roughness, humedad y barro. Ningún mapa de imagen.
- `visual-lab/horse-fidelity/horseJockey.js`: jockey, casco, guantes, botas, brazos y riendas geométricos originales; visibilidad conmutable, altura prevista debajo de la gatera Alpha20.
- `visual-lab/horse-fidelity/horseGroom.js`: crin, flequillo y cola como tiras geométricas volumétricas entrecruzadas; estilos cortos/deportivos/largos, movimiento de viento.
- `visual-lab/horse-fidelity/horseRaceLivery.js`: mantilla geométrica curvada, colores del corredor y números 1-99 mediante segmentos 3D. Sin fuentes, sprites ni atlas.
- `visual-lab/horse-fidelity/horseGaitIK.js`: trayectoria analítica de cascos con apoyo/recuperación y resolución inversa de dos huesos por pata; conserva opción de movimiento anterior para comparar.
- `visual-lab/horse-fidelity/proceduralHorse.js`: ensamblador con rig original de articulaciones para galope en cuatro tiempos; ojos, orejas, hocico, cascos, marcas y APIs de carrera.
- `visual-lab/horse-fidelity/horseAdapter.js`: puente opt-in `fidelity` con contrato Alpha20 sin sobrescribir `procedural`/legacy con compatibilidad Alpha18 y recuperación del modo anterior.
- `visual-lab/horse-fidelity-preview/index.html` + `studio.js`: estudio 3D con 12 caballos, retrato y galope, cambio de look, iluminación de día/lluvia/noche.
- `tests/alpha22-horse-contract.mjs`, `tests/alpha22-horse-browser.mjs`, `.github/workflows/alpha22-procedural-horse.yml`: pruebas de determinismo, geometría, shaders, interacción y render WebGL.

### Contrato de uso

```js
import {createProceduralHorse} from './horse-fidelity/proceduralHorse.js';

const horse=createProceduralHorse({THREE,profile:{
 archetype:'sprinter',coat:'bay',maneStyle:'sport',tailStyle:'full',
 marking:'star',height:2.85,quality:'balanced',number:7,
 accent:'#f4a12c',seed:571
}});
scene.add(horse.root);
horse.play('Gallop');
horse.update(delta,1.23);            // clip visual, NO movimiento oficial
horse.root.position.set(x,0,z);     // x,z llegan del motor financiero actual
horse.setAppearance({coat:'#764735',accent:'#e9ae58',number:7});
horse.setWetness(.4);horse.setMud(.12);
horse.setBank(.05);horse.setWind(.8);
horse.dispose();                    // dispose de toda geometría/material creado
```

Protocolos existentes: `root, play, update, setAppearance, setWind, setWetness, setBank, setVisualQuality, setCoatFinish, dispose, hoofPhase`. **No modifica clasificación, input de precios, fixtures, reloj LIVE ni apuestas.** `hoofPhase` permite alimentar los contactos Alpha21; no usar simultáneamente su sistema de `bodyFollowThrough` GLB porque Alpha22 tiene su rig de cuello/cabeza propio. Los planos mantienen Y hacia arriba, hocico hacia +X y escala 2.85 para el contrato actual de pista.

### Plan de integración SAFE cuando termine el otro agente

1. Revisar `main` y los PR abiertos, especialmente #43 (Alpha19), #44 (Alpha21), #45 (fixture admin), y los que afecten `horse.js`, `scene.js`, shaders, layouts y escalas.
2. Comparar este visor con el caballo LIVE y las referencias NONECG en 4 ángulos (frente, lateral, tres cuartos, posterior), tres luces y tres fases del galope. **No considerar AAA aprobado por la mera existencia de shaders.**
3. Sólo después modificar el punto de `bootHorses()` de `scene.js` para optar por `createRaceHorseVisual({THREE,entry:e,index:i,quality,mode:'procedural',legacyFactory:createHorse})`. Conservar `createHorse` anterior y un feature flag de reversión; no modificar el motor de resultados.
4. En cada `setRace`, actualizar `horse.setAppearance({coat:e.coat,accent:e.color,number:i+1})`. Los caballos nuevos también aceptan colores hex libres.
5. Antes de fusionar Alpha21, usar **una** llamada a `horse.update` por frame. `hoofPhase` funciona con el detector Alpha21, pero omitir `bodyFollowThrough` sobre el rig procedural si se detectan correcciones incompatibles.
6. Ajustar escala y volumen contra gateras Alpha20. Las orejas del nuevo modelo pueden superar el roof actual de 3.02 con el origen de 2.85; necesita medición de clipping.
7. Comparar mallas/triángulos/draw calls y FPS desktop/móvil contra el GLB anterior; si es más pesado, implementar LOD/instancing y mantener fallback.
8. Hacer pruebas manuales de ojos, anatomía, crin, pezuñas, colisiones, sombras y expresividad; no usar imágenes o librerías de terceros para tapar fallas de rig.
9. Fusionar tras revisión, y sólo después verificar despliegue/Hostinger. Este PR no modifica `main`.

### Limitaciones artísticas explícitas

El ciclo paramétrico incluye cuatro apoyos, fase de vuelo, trayectorias de casco con contacto y un solver IK plano de dos eslabones, pero NO es una simulación biomecánica validada por captura de movimiento. El visor permite alternar `IK` y `oscilación anterior` para evaluar artísticamente. Las transiciones Idle/Walk/Gallop, contacto de suelo y vuelos requieren comparación cuadro a cuadro con referencias anatómicas antes de reemplazar el GLB en producción. El shader PBR analítico evita mapas, pero los rasgos más finos de pelo corto, musculatura bajo la piel y expresión de ojos requieren iteración de dirección de arte. El objetivo AAA es iterativo, no un sello automático.

La escena de prueba usa Three.js 0.187.0 del import map CDN sólo como motor 3D. **No descarga ningún modelo, icono ni textura para construir los caballos.**

### Compatibilidad al cierre de implementación

Mientras se preparaba Alpha22, `main` avanzó a `8621153d` incorporando la consola privada de fixture. La rama Alpha22 sólo agrega archivos nuevos y no pisa esa consola. El PR #47 debe seguir en borrador hasta que los otros agentes terminen sus ramas y se haga un diff actualizado. El inspector WebGL documenta draw calls/triángulos pero esas métricas de SwiftShader **no sustituyen perfiles GPU reales**.

**Prueba ART:** comparar en el estudio la misma toma Alpha20 vs Alpha22, con y sin jockey, y evaluar continuidad de musculatura/rodillas, profundidad de ojos y deslizamiento. El objetivo AAA visual sigue condicionado a esa inspección y no se declara acabado con una CI verde.
