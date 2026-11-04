# BTC Master · correcciones visuales prioritarias

**Ficha donde deben verse y cotejarse TODAS las iteraciones:** https://race.cryptodromo.com/racers/#BTC

Reporte de usuario del 4 de noviembre de 2026, acompañado de capturas del perfil del cuello y del área de orejas/ojos. Ninguno de estos defectos se declara resuelto.

## P0 · limpiar filamentos sobrantes del cuello
- Se observan pelos oscuros, largos y aislados que cuelgan del lateral del cuello/garganta, por debajo de la crin. No recortar a ciegas la crin dorsal.
- Inspeccionar `racers/btc-maya-groom.js`: raíces del peinado y curvas de guía; filtros de crecimiento en superficie y desplazamientos en shader.
- Mantener pelaje corto y crin dorsal. El arreglo previo de un GLB en ZIP local NO actualizó el modelo público.

## P0 · unir levemente los dos mechones laterales
- Reducir el hueco visual entre los dos grupos de crin alrededor de la línea dorsal/nuca. Deben parecer una sola crin con caída a ambos lados, no dos cortinas independientes.
- Usar transición gradual en las raíces sobre el crest y continuidad volumétrica; sin fusionar cada fibra en una tabla sólida ni introducir clipping en el cuello.
- Comprobar desde ambos perfiles, frontal, trasera y tres cuartos mientras corre.

## P0 · eliminar aparente transparencia detrás de las orejas
- Detrás de las orejas se ve fondo a través de una zona donde se esperan superficies continuas.
- Diagnóstico obligatorio antes de cerrar: comprobar si faltan caras en la unión cabeza/nuca/raíces de orejas, winding/normales, `side`, depthTest, frustum/culling o una perforación generada al retirar las orejas originales.
- `racers/btc-maya-master.js` actualmente elimina polígonos de orejas originales; `racers/btc-maya-ears.js` genera pabellones por separado. Verificar el borde abierto y cerrar el volumen real o recalcular topología, no poner una placa que flote.
- Aceptación: sin huecos transparentes desde ambos laterales, frente, atrás y en Gallop.

## P0 · globo ocular con iris editable y pupila grande
- Reemplazar aspecto plano/pequeño por un **globo ocular 3D** situado en la órbita, con córnea/brillo, iris visible y **pupila oscura amplia de proporción equina**, respetando párpados y la profundidad de la cuenca.
- No crear «ojos de caricatura» ni discos flotantes; el globo debe permanecer dentro de la órbita y seguir el hueso `Head`, sin parpadear fuera del cráneo al galopar.
- Mantener la pupila negra, y conectar el color editable de **iris** con el `eyeColor` del perfil que ya soportan `race-lab/source/src/data/horseProfileAdapter.js` y el administrador `/admin/horses/`; verificar que se aplique en la ficha publicada.
- Verificar ambos ojos desde cámaras frontal, perfil y tres cuartos. Evitar clipping/z-fighting con `racers/btc-maya-face-details.js` y el ojo anterior de `racers/btc-maya-master.js`.

## Orden de entrega
1. Resolver y validar P0, actualizar `racers/btc-master-revision.json` y ficha BTC, bitácora y comparativas.
2. Después, trabajar física dinámica de crin y cola usando el archivo fuente `212734.mp4`. Ver `docs/BTC-MANE-TAIL-PHYSICS-BRIEF.md`.

**Todos los defectos: estado actual `needs_fix`, pendientes de prueba visual y despliegue.**
