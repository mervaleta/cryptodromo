# Próxima fase del maestro BTC · físicas de crin y cola

**Estado: BLOCKED / NO INICIADA.** Antes se deben eliminar pelos sobrantes del cuello, unir mejor los mechones laterales, cerrar los huecos de orejas, modelar ojos y verificar visualmente https://race.cryptodromo.com/racers/#BTC.

## Referencia proporcionada
**`212734.mp4`**, archivo de video compartido en las fuentes de Cryptódromo. Inspección del archivo: 1920 × 1080, aproximadamente 10,5 segundos, 30 fps. Muestra un caballo blanco de perfil galopando, con crin larga sobre la línea dorsal del cuello y una cola que sigue el movimiento en la dirección de avance. Es una **referencia de comportamiento**, no una textura o animación para copiar directamente.

El video se encuentra en las fuentes aportadas al proyecto, no necesariamente dentro del repositorio. Antes de comenzar, los agentes deben poder ver ese recurso y comparar varias fases del galope.

## Objetivo de la iteración posterior
- **Crin:** anclaje de raíces a la línea dorsal del cuello; retraso de movimiento respecto de cabeza/cuello, retorno elástico, gravedad, separación ordenada de mechones y amortiguación. El movimiento del pelo debe responder a fases del Gallop sin que aparezcan filamentos saliendo de la garganta.
- **Cola:** raíz fija a grupa, movimiento secundario con inercia propia, estela aerodinámica suave hacia atrás, amortiguación y amplitud mayor en las puntas que en la raíz. Evitar cola rígida o vibración de alambres.
- **Dinámica:** desacoplar discretamente la oscilación por grupos de guías, variar viento/velocidad, paso temporal estable y acotado, evitar explosiones al pausar/reanudar, transición de idle a galope y variaciones de FPS.
- **Colisiones:** nunca atravesar cuero cabelludo/orejas/cuello con la crin ni penetrar la grupa con la cola; conservar la silueta natural desde todos los ángulos.
- **Rendimiento:** conservar la posibilidad de 12 corredores en la escena sin multiplicar meshes, materiales ni buffers de forma incontrolada.

## Aceptación
1. Registrar build nuevo en el manifiesto, actualizar la ficha BTC principal y bitácora con capturas comparables antes/después.
2. Video de diagnóstico de al menos una vuelta de galope y cámaras de perfil, tres cuartos, frente y trasera. Confrontarlo con varias fases de `212734.mp4`.
3. Chequear movimiento de crin/cola en reposo sin viento, galope con y sin viento, stop/resume y bajo FPS variable.
4. Mantener original Gallop, rig, piel, 99 caballos y reglas de carrera sin modificación.
5. Aceptar únicamente tras verificar el resultado real en Hostinger en `/racers/#BTC`.

**Esta etapa se desbloquea solo cuando las correcciones geométricas previas estén visualmente aprobadas.**
