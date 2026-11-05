# Muybridge · auditoría del pabellón de dos torres

## Defecto que apareció en cámara aérea
La imagen de la carrera 005/480 muestra el edificio de dos torres sobre el propio
óvalo. El origen no era el archivo `crp-webapp-hostinger-v5-completo-patched-v3.zip`:
el LIVE actual se crea en `visual-lab/scene.js`.

Antes del arreglo, la recta posterior del óvalo se centra en `z=-72` con
ocupación de pista y baranda hasta aproximadamente `z=-93`. La fundación de
`93 × 27 m` estaba centrada en `z=-78`, con el edificio en `z=-78`.
Era una superposición estructural, no un efecto de caché.

## P0 incluido en este cambio
- Un **grupo independiente** `pavilion` desplaza las dos torres, fachada,
  fundamentos, cubierta y sus carteles en `z=-67`. La posición final de las
  torres pasa de `-78` a **`-145`**.
- La fundación principal abarca `z=-158.5..-131.5`. La plataforma de acceso
  termina en `z=-129.5`; ambas se ubican detrás de la baranda del óvalo,
  de la tribuna y de la calle de espectadores.
- El cartel de pista que estaba en `z=-36` pasa a `z=-103`, entre la baranda
  y la grada. El cartel global de meta no se desplaza con el edificio.
- La cubierta superior baja de `y=20.1` a `19.1`, de modo que
  su base coincide con el techo inferior. La cimentación baja `0.11` m
  para apoyarse en el terreno, sin crear nuevas plataformas de carrera.
- No se cambió geometría de carrera, gateras, trote, datos, coeficientes,
  velocidad oficial, ganador, fixture ni el estadio de autos.
- Los HTML de `/visual-lab/` y `/stadiums/crypto/broadcast/`
  invalidan la caché del módulo 3D.

## Evidencia automática / contrato
- `tests/muybridge-clubhouse-clearance.mjs` muestrea 1.001 puntos de cada
  trazado en nueve posiciones laterales y exige un margen positivo para
  todos los fundamentos. Verifica las dos cubiertas, la cota del piso y
  que el cartel de meta no pertenezca al grupo trasladado.
- `tests/muybridge-clubhouse-browser.mjs` ejecuta Chromium + WebGL,
  comprueba el world transform auténtico `VIP z=-145`, tres layouts
  y la visibilidad correcta del cartel de meta, y guarda tres capturas.
- El parámetro `?pavilion-qa=1` habilita
  `window.__cryptodromoPavilionQA.snapshot()` (solo lectura).

## P1: por mejorar en el edificio (no incluido en este parche geométrico)
1. **Acceso y circulación:** puerta principal, escalinatas/rampas, señal de
   accesibilidad y conexión material al paseo; comprobar que no cruza
   cercas ni público instanciado.
2. **Fachada:** ventanas con profundidad y marcos, ménsulas, pilares,
   puertas de vidrio y tratamientos distintos en plantas baja y VIP.
   No dejar bloques blancos lisos vistos desde railcam.
3. **Cubiertas y torres:** aleros, remates, canaletas, bajadas de agua,
   continuidad de tejas/material y volumetría apoyada en soportes.
4. **Iluminación:** puntos de luz cálidos detrás de ventanas, emisión baja
   diurna y mayor nocturna. Evitar spotlights con límites triangulares;
   adaptar temperatura a humedad y puesta de sol.
5. **Cartelería:** orientar letreros hacia las cámaras y pista pertinentes,
   legibilidad nocturna, denominaciones unificadas SATOSHI/MUYBRIDGE.
   Ningún panel debe aparecer espejado.
6. **Cámara y oclusiones:** examen en dron, railcam, foto finish y planos
   nocturnos. Ningún techo debe tapar caballos ni la meta.
7. **Rendimiento:** instanciar ventanas repetidas, materiales y geometrías
   compartidos, LOD de torres/visitantes y limitar sombras en móviles.
8. **Unificación:** `scene.js` y
   `race-lab/source/src/churchillStadium.js` contienen dos
   implementaciones del mismo pabellón. Conviene compartir identidad
   visual y parámetros, pero no sustituir ambas sin pruebas.
9. **Integridad escenográfica:** controles de colisión también contra
   `parade/scenery.js`, árboles de `stadiumBackdrop.js`, accesos y
   `stadiumDistrict.js`. Un test de pista limpia no basta para detectar
   una torre atravesando otra estructura.

## Criterio de publicación
No marcar PUBLICADO/VERIFICADO hasta que pase Chromium contra la versión
real de Hostinger. El ZIP v3 de otro despliegue NO reemplaza ni prueba
el `scene.js` público.
