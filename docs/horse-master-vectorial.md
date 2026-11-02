# Horse Master vectorial: 12 poses compartidas

Este módulo implementa el catálogo `/racers/` con un solo caballo maestro vectorial, trazado a partir del spritesheet BAT (170 x 2048 píxeles) suministrado por el proyecto. De las 12 celdas de 170 x 170 se conservaron los contornos y las poses, se suavizaron curvas cuadráticas y se generaron capas para pelaje, sombras, patas, crines, cola, cascos, cabezada y tinta. Los últimos 8 píxeles verticales no forman un cuadro adicional.

## Componentes
- `racers/horse-master.v1.json`: trayectorias por fotograma (sin PNG, FBX ni GLB).
- `racers/vector-horse.js`: geometría Path2D, paletas a partir de `TOKEN_ROSTER`, iluminación ilustrada, sombra en suelo y polvo visual. Expone `drawHorse()`, `paletteForToken()`, `createVectorHorseTexture(THREE,...)`.
- `racers/vector-preview.js`: visor basado en Three.js Sprite + CanvasTexture, con modo alternativo Canvas2D si WebGL no está disponible.
- `racers/racers.js`: usa el nuevo visor para los 100 tokens sin modificar el fixture.
- `racers/index.html`: textos del visor.

## Contrato visual
La animación recorre 12 poses a 12 fps constantes. El polvo usa solamente el índice de fotograma y una semilla visual; los precios NO modifican el ritmo de animación. En la pista, la fórmula determinará exclusivamente el progreso `raceProgress` y la posición sobre la curva. El sprite se mueve a esa posición sin introducir ninguna fuerza física ni efecto sobre la clasificación.

## Verificación
- 12 poses vectoriales verificadas, capas separadas.
- Validación del JS con `node --check`.
- Prueba aislada en Chromium con Three.js: carga del master, CanvasTexture/WebGL, dibujo y movimiento del sprite; resultado: `VECTORIAL · 12 POSES · SOMBRAS Y POLVO`.
- 12 fotogramas vectoriales dibujados en ~58 ms en prueba local (medida orientativa, no benchmark de 12 caballos en carrera).
- Ficha disponible para 100 tokens con colores derivados automáticamente del catálogo.

## Límites antes de producción de carrera
1. Las imágenes fuente contienen 170 x 170 píxeles de información por pose: las curvas vectoriales se pueden ampliar, pero no añaden detalles inexistentes.
2. Por ahora el sprite es lateral; para una pista ovalada deben prepararse ángulos alternativos o cambiar a modelos 3D en primeros planos.
3. El render se ha probado aislado, no como parte de una carga completa con doce caballos y efectos climáticos.
4. El código anterior de caballos 3D queda intacto para volver atrás o hacer una transición gradual.
