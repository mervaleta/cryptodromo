# BTC Reborn A0 | QA geométrica y WebGL (2026-11-10)

**Artefacto:** `btc-maya-source-assembly.glb`, obtenido de `Horse_VR_2017.ma` aportado por el propietario. **No se ha publicado en producción.**

## Inspección de la malla base
- 5,406 vértices y 10,790 triángulos, 1 componente conectado.
- 0 errores de continuidad de aristas al reconstruir caras desde Maya ASCII.
- 0 aristas no-manifold.
- 22 aristas frontera, distribuidas en **dos bucles de 11 vértices**.
- Centroides de los bucles en metros respecto del origen Maya: aprox. `[-0.065, 2.083, 1.025]` y `[0.065, 2.083, 1.025]`. Corresponden a la región de los **ojos**. No considerar la malla cerrada: validar unión con geometrías de ojos antes de aceptación.
- Se exportaron normales de vértice explícitas. La primera pasada sin normales era facetada y fue rechazada.

## Meshes del compuesto
- Caballo: 10,790 triángulos.
- Crin original Maya: 368.
- Cola original Maya: 508.
- Cuatro superficies de ojos: 760 triángulos cada una.
- Pestañas: 11,200.
- **Total: 25,906 triángulos**, 8 meshes.

## QA de navegación WebGL real
- Chromium en Xvfb con WebGL 2 SwiftShader: cargó el GLB en Three.js.
- Se capturaron perfil, frente, atrás, tres cuartos frontal, tres cuartos posterior y elevada, además de wireframe.
- Sin errores de consola ni pageerror.
- Contador del renderer: 25,908 triángulos (incluidos 2 del suelo), 10 draw calls.
- ~10–13 FPS en WebGL *por software*, **no extrapolable a GPU real**.
- No hay rig, skinning ni fase de galope exportados: la matriz temporal de 16 fases sigue pendiente.

## Bloqueantes antes de aprobación
1. Esculpir/retopologizar y revisar contorno de ojos y cabeza con su geometría de transición.
2. Mejorar crin/cola: sus meshes actuales son delgados y no equivalen a un groom realista.
3. Reconstituir rig y skinning equinos funcionales. El Maya ASCII declara 164 nodos joint, pero este export no conserva la jerarquía animable.
4. Crear galope de carrera con 16 fases verificables, a 60 FPS interpolados, y validar seis cámaras en todas las fases.
5. Materiales PBR, anatomía cercana, optimización de performance y aprobación explícita.

**Resultado:** prototipo técnico funcional, no caballo AAA terminado; V21 queda intacto.