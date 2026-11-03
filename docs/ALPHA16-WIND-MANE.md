# Crines con viento | integración Alpha 16

**Estado:** integrada en rama de revisión, con el mismo GLB que usan carrera, Parade y ficha de corredor.

## Por qué se cambió el enfoque inicial

El prototipo `feature/horse-mane-wind-ready-20261102` añadía planos al cuello, pero todavía no tenía un anclaje calibrado. Al revisar el caballo actual, comprobamos que `horse.glb.gz` ya incluye un material y una primitiva skinned **Hair**. En el archivo fuente inspeccionado, la crin ocupa coordenadas locales Y negativas, mientras que la cola ocupa Y positivas. El esqueleto incluye Neck1, Neck2, Neck3 y Head. Esta implementación deforma exclusivamente las puntas de la crin *antes del skinning*, con el movimiento nativo del cuello. No introduce planos, huesos, draw calls ni texturas.

## Implementación

- `race-lab/source/src/windMane.js`: modifica el shader del material Hair de cada caballo (material ya clonado por `horse.js`); estira suavemente las puntas ~12-18 % y aplica una oscilación con dos frecuencias. Más viento o galope implica mayor amplitud. El modo `prefers-reduced-motion` conserva la crin extendida, sin oscilación.
- `race-lab/source/src/horse.js`: instancia el efecto por caballo y llama `update` en el mismo loop de animación. Expone `setWind` y `maneWindEnabled`; limpia sus uniformes al disponer del caballo.
- `visual-lab/scene.js`: sincroniza viento con la capa de nubes y la lluvia, sin modificar carreras, cámaras, cruce de meta, fixtures o resultados.
- `parade/parade.js`: utiliza la misma crin para la animación Walk y ajusta la brisa entre ambiente despejado y húmedo.
- `racers/horse-preview.js`: reutiliza el mismo efecto en la ficha 3D. Versiones de scripts renovadas para evitar módulos antiguos en caché.
- **Compatibilidad:** el módulo valida las dimensiones de la primitiva Hair. Si un nuevo GLB cambia su geometría, el efecto se desactiva sin bloquear la carga del caballo. Recalibrar las coordenadas antes de habilitarlo para un modelo distinto.

## Verificación

- `node --experimental-default-type=module --test tests/wind-mane.mjs tests/wind-mane-integration.mjs`
- `node --test tests/alpha16-parade.mjs tests/official-race.mjs`
- `node tests/wind-mane-browser.mjs` desde un servidor local, con Chromium y Playwright disponibles.
- El test de navegador exige 12 caballos con crines activas, que el viento cambie con la lluvia y que no haya errores de compilación de shader.

## Reversión

Revertir el PR de integración restaura `horse.js` y los scripts de Alpha 16. El modelo `horse.glb.gz` y sus clips **no fueron alterados**.
