# Cryptodromo — Race Lab

Demo independiente de carrera modular en Three.js, con controles de clima, hora, superficie y variación de precios ficticios.

- `index.html` y `assets/`: versión estática lista para servir en `/race-lab/`.
- `source/`: proyecto Vite editable completo.

El render utiliza WebGL cuando está disponible y Canvas 2D como compatibilidad. Los precios son de muestra y no hay apuestas con dinero real.

Para trabajar en el código: ejecutar `npm ci` y `npm run dev` desde `source/`. Para compilar: `npm run build`; el resultado queda en `source/dist/`.

La publicación en cryptodromo.com requiere que el hosting despliegue esta carpeta; un commit en GitHub no garantiza que el servidor esté conectado a este repo.
