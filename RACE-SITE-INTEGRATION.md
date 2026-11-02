# Integración institucional y de la demo

El inicio conserva la carrera en `/`; la presentación institucional queda en `/institucional/`. El logo, el encabezado, la navegación, el pie y el ancho máximo de 1480 px se comparten entre carrera, corredores y páginas informativas. Las rutas institucionales heredadas conservan páginas de continuidad.

El HTML de raíz carga la misma fuente editable de carrera que `race-lab/source/`. El estadio agrega gradas, cartel narrativo, luces nocturnas, texturas locales y público instanciado; los caballos 3D usan el modelo Quaternius CC0, con pelaje, color, símbolo y animaciones conectados al catálogo y al fixture. Si el GLB no se puede cargar, queda disponible el modelo procedural y el fallback 2D.

La carrera permanece de demostración: fixture sintético, sin cotizaciones en vivo, apuestas ni transacciones. Para detalles de recursos, origen y licencias, consultar `ASSET_CREDITS.md`.
