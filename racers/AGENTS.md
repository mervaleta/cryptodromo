# Maestro BTC · protocolo de ficha pública

**Punto de control obligatorio:** https://race.cryptodromo.com/racers/#BTC

Todos los agentes que cambien geometría, pelo, crin, cola, orejas, ojos, paletas, animación o cualquier recurso del maestro BTC tienen que reflejar y verificar el cambio EN ESTA FICHA, sin flags ni parámetros experimentales.

**Cadena de publicación actual:** `racers/index.html` → `racers/racers.js` → `racers/btc-atelier-preview.js` → `racers/btc-maya-master.js` → `racers/btc-maya-groom.js` y dependencias. Un GLB suelto no cambia automáticamente el groom procedural.

Cada iteración del maestro debe actualizar:
- Código de producción realmente usado en la variante principal `maya`.
- `racers/btc-master-revision.json` con build/estado y `docs/BTC-MASTER-CHANGELOG.md` con el cambio y su evidencia.
- `?v=` e imports necesarios, para invalidar el cache de Hostinger/navegador.
- La ficha pública con número de build; comparar capturas antes/después desde ambos perfiles, frente, atrás, detalle, en reposo y galope.
- QA en Hostinger. Si el SHA no está desplegado/validado, NO marcarlo como corregido.

**Pendientes 2026-11-04:** filamentos largos colgando bajo la crin en el cuello; dos mechones laterales demasiado separados; glitch/transparencia detrás de orejas que podría ser una zona sin caras, culling o profundidad; ojos con esfera interna y pupila grande. El color de iris debe conectarse al `eyeColor` que ya figura en los perfiles del editor, manteniendo la pupila negra y la anatomía 3D.

**Fase siguiente, NO anticipar:** simulación física de crin y cola, comparada con `212734.mp4` de las fuentes, una vez que los defectos geométricos estén solucionados. Ver `docs/BTC-MANE-TAIL-PHYSICS-BRIEF.md`.

Ni el rig Gallop ni el motor de resultados ni los otros 99 caballos deben alterarse por estos cambios.
