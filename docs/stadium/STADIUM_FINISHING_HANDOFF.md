# Terminación del complejo · paquete de preparación (NO desplegar todavía)

**Base revisada:** main 575eb847fe1aa4a502184f48c6061ee1acca32d8, 2026-11-02.
**Convivencia:** PR #12 Alpha17 (cámaras) y PR #13 Alpha18 (densidad de tribunas y barandas) siguen en borrador. No modificar ni fusionar esos módulos desde este paquete.

## Listo para integrar

`race-lab/source/src/stadium/surfaces.js` exporta `createStadiumSurfaces({THREE,seed,resolution})`.
Genera cinco superficies originales, sin archivos externos ni descargas: piedra, cubierta, grava, césped y pavimento. Son DataTexture RGBA repetibles, con mipmaps y liberación explícita de memoria. La semilla hace reproducible cada superficie. No se agrega dependencia externa ni se modifica el estadio publicado.

```js
import {createStadiumSurfaces} from '../race-lab/source/src/stadium/surfaces.js';
const surfaces=createStadiumSurfaces({THREE,seed:1024,resolution:128});
const stone=surfaces.make('stone',{repeatX:4,repeatY:2});
const wall=new THREE.MeshStandardMaterial({map:stone,roughness:.88});
// Al desmontar: wall.dispose(); surfaces.dispose();
```

## Orden de implementación después de Alpha17/18

1. Releer el nuevo `main` y las modificaciones de `visual-lab/scene.js`, `stadiumBackdrop.js` y `stadiumDistrict.js` antes de rebase. Evitar duplicar gradas, público, barandas, cámaras o iluminación.
2. Integrar primero las cinco texturas en **una sola sede** y medir GPU/CPU y captura visual. Mantener `quality=eco` sin materiales adicionales si cae el rendimiento.
3. Aplicar el mismo generador al museo `/estadio/` y las sedes Exchange y Horizon, usando las paletas de `presets.js`; evitar repetir textura por objeto.
4. Lluvia y niebla: reutilizar el controlador de clima existente; nunca crear dos sistemas simultáneos. Probar lluvia de noche, niebla de mañana, pista húmeda y transición día/noche.
5. Verificar acceso, boleterías, servicios, paddock y caballerizas desde las cámaras finales de Alpha17. Corregir solapamientos y clipping.
6. Revisar la densidad de tribunas y las barandas de Alpha18, luego optimizar instancing y LOD; no introducir nuevos espectadores hasta resolver ese PR.
7. Capturas comparables desktop y móvil, FPS medidos y pruebas de carrera completa de 180 s, resultados y fixture inalterados.
8. Publicar en Hostinger únicamente después de CI verde y revisión visual.

## Puertas de calidad

- `node --test tests/stadium-surfaces.mjs`, `tests/stadium-world.mjs`, `tests/stadium-live-integration.mjs`.
- No alterar precios, caballos, calendario, posiciones, llegadas ni cronómetro.
- No introducir dependencias con licencias incompatibles, assets sin licencia ni descargas en cada frame.
- Preservar la experiencia móvil; comparar calidad eco y alta.
- Si Alpha17/18 cambian interfaces, adaptar el puente de escenografía a la nueva API antes de activar las texturas.

## Fuentes open source para fase posterior

- Three.js Sky: https://threejs.org/docs/pages/Sky.html
- EZ-Tree: https://github.com/dgreenheck/ez-tree
- THREE.Terrain: https://github.com/IceCreamYou/THREE.Terrain

Son candidatos de investigación, no dependencias ya instaladas. Revisar licencia de cada versión y compatibilidad WebGL antes de integrar.

**Estado honesto:** código de materiales y pruebas preparado en rama aislada. No se ha fusionado ni verificado visualmente. No hay autorización para pisar el trabajo en curso de los demás agentes.
