# Crines con viento | preparación para Alpha 16

**Estado:** módulo aislado, no conectado a producción.

Se comprobó que el caballo 3D actual se instancia desde `race-lab/source/src/horse.js` y utiliza un GLB comprimido, `horse.glb.gz`, animado mediante un mixer y un refinador de galope. No conviene modificar ni sustituir el esqueleto, el archivo GLB o las claves de la animación mientras otros agentes trabajan en los caballos.

Se preparó `race-lab/source/src/windMane.js`: nueve mechones ligeros de planos, alargados aproximadamente 10-20% frente a una crin corta, con oscilación discreta ligada al viento y la velocidad. El movimiento se desactiva para usuarios que prefieren movimiento reducido. El módulo expone `createWindMane({anchor,coat,length,seed})`, `update(delta,{wind,speed,reducedMotion})`, `setColor` y `dispose`.

**Antes de activarlo** hay que inspeccionar el GLB vigente, determinar el nodo exacto del cuello y la orientación local de los mechones. En caso de que el otro agente cambie el modelo, recalibrar el anclaje, longitud y color. Sin ese ajuste, los mechones podrían aparecer en una posición incorrecta. También habrá que enlazar la intensidad del viento con el clima del estadio, llamar a update dentro del loop existente y liberar los recursos en dispose.

No se cambió `horse.js`, `scene.js`, el motor oficial ni los archivos del estadio. Integrar cuando finalicen los otros agentes.
