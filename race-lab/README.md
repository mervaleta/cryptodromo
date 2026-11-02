# Cryptodromo Race — sitio y demo

El punto de entrada publicado es el `index.html` de la raíz en `race.cryptodromo.com`. Comparte logo, navegación, ancho y pie con `/racers/` y el sitio institucional.

La escena usa Three.js 0.187.0. El HTML principal importa el módulo editable de `race-lab/source/src/`; la hoja de estilos y el fixture permanecen versionados junto al código. El import map fija Three.js y sus módulos auxiliares a la misma versión.

El estadio usa geometría y texturas generadas localmente: luces nocturnas, superficie con variación visual y público instanciado con movimiento ligero. Los caballos usan el modelo animado Quaternius CC0 de `race-lab/source/assets/horse.glb.gz`, se descomprime en el navegador y conserva un modelo procedural de respaldo si no se puede cargar.

El fixture sintético contiene 100 activos y 7 días de precios por minuto. Hay 480 carreras programadas por día, con 12 participantes por carrera y selección reproducible de estrellas, principales y desafiantes. No hace solicitudes a precios reales.
