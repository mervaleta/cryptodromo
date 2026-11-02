# Cryptódromo | parciales y campeonato: preparado, sin activar

## Regla histórica recuperada

Se revisó el backup CRP original: crp-webapp-hostinger-v5-completo.zip, archivo src/mock/engine.js, función core() y constante POINTS.

- Distancia: 1.000 metros; 12 competidores.
- Cuatro marcas históricas: 200, 400, 600 y 800 metros.
- El primero en llegar a cada marca, por menor tiempo acumulado, recibe +1 punto de récord parcial. Un caballo puede obtener más de una bonificación.
- Tabla de llegada para las posiciones 1 a 12: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1, 0, 0.
- Puntaje de carrera = puntos de llegada + bonus en los cuatro parciales, máximo histórico +4.
- Ranking del campeonato: suma de puntos de las carreras terminadas. Son puntos deportivos; no intervienen apuestas ni premios económicos.

## Modo de cuartos, listo para la nueva escenografía

El nuevo preset quarters presenta 250, 500, 750 y 1.000 metros. Premia +1 al primero en cruzar los tres primeros parciales. La cuarta marca es la llegada y recibe los puntos de clasificación, pero no otro +1. Así no se bonifica dos veces la meta. Esta adaptación es propuesta para el nuevo estadio, no una regla del backup. El preset legacy conserva la regla exacta de cuatro bonificaciones.

La medición distingue liderar una marca acumulada de registrar la vuelta o sector individual más rápido. La regla histórica es el primero en llegar a la marca acumulada, aunque los datos de tiempos sectoriales también están disponibles para futuros gráficos.

## Compatibilidad y seguridad

El módulo trackSplits.js recibe directamente los perfiles de createOfficialRace(entries). Calcula tiempos de paso por interpolación entre las muestras acumuladas del motor; para la llegada a 1.000 m usa SIEMPRE profile.finishTime para respetar la clasificación oficial y no cambiar el ganador.

No modifica el motor de carrera, la duración, el fixture, el ranking actual ni los datos de precio. No incorpora una nueva fuente de aleatoriedad. Los pasos intermedios siguen el desplazamiento visual determinista del motor, y sus bonus tienen que quedar documentados como mecánica adicional de campeonato, separada de la definición del ganador oficial.

El tablero no revela posiciones finales ni puntos de llegada antes del cierre. Al terminar los 60 s deben cumplirse además las condiciones de la transmisión para habilitar finishAuthorized. Las bonificaciones visibles durante la carrera son provisionales.

## Archivos

- race-lab/source/src/data/trackSplits.js: reglas, tiempos de cruce, premios y campeonato.
- visual-lab/trackSplitsPanel.js: panel para 4 parciales y 12 corredores, sin dependencias de Three.js.
- visual-lab/trackSplitsPanel.css: estilos separados con prefijo crp-split.
- tests/track-splits.mjs: ocho pruebas automatizadas.

## Integración al terminar el agente de estadio

Insertar en la vista del estadio:

    <link rel="stylesheet" href="/visual-lab/trackSplitsPanel.css?v=splits-v1">
    <div id="race-splits" aria-live="off"></div>

Conectar en el controlador de la carrera (referencia; adaptar nombres):

    import {mountTrackSplitsPanel} from '/visual-lab/trackSplitsPanel.js?v=splits-v1';

    const splitPanel = mountTrackSplitsPanel(
      document.querySelector('#race-splits'),
      {mode:'quarters'}
    );
    splitPanel.setRace(officialProfiles);

    // Durante la carrera, a 2 Hz como máximo:
    splitPanel.update(elapsedSeconds, {
      finishAuthorized: allTwelveHorsesCrossed
    });

    // En cada nueva carrera:
    splitPanel.setRace(officialProfiles);

    // Al desmontar la pantalla:
    splitPanel.dispose();

El valor allTwelveHorsesCrossed debe provenir del controlador real de la retransmisión, no suponerse porque el reloj indique 60 s. El tablero se integra como elemento de interfaz separado; si se quieren postes tridimensionales sobre las curvas hay que usar el mapeo espacial del estadio una vez que el otro agente finalice sus modificaciones.

Para agregación del campeonato se usa aggregateSplitChampionship([...carrerasTerminadas]); nunca incluir carreras futuras, aun cuando el fixture sintético permita calcularlas por adelantado.

## Comprobación

Ejecutar en la raíz del repositorio (Node 22):

    node --experimental-default-type=module --test tests/track-splits.mjs

La preparación se mantiene en esta rama feature. No se debe fusionar ni copiar estos scripts al sitio LIVE hasta coordinar con el otro agente.


## Integración efectiva Alpha 15 (2 de noviembre de 2026)

Se integró con el motor y la transmisión existentes, sin sobrescribir el trabajo de estadio: scene.js invoca el módulo sobre perfiles broadcastDistance de raceChoreography, y respeta la autorización de llegada de finishOrchestrator. El tablero se ubica entre la clasificación y el programa LIVE. Hay postes y líneas de marca en la pista (trackSplitMarkers.js), reposicionados al seleccionar un trazado recto, en S u oval, o al alternar el reglamento. Los postes son exclusivamente escénicos.

Los datos de la carrera se publican además en /resultados/ y se agregan por ciclo de 3.360 competencias sintéticas en /estadisticas/, con procesamiento por tandas asíncronas. Ambos usan por defecto los cuartos 250/500/750 m (+3 máx.). El modo de puntuación histórica de 200/400/600/800 m (+4 máx.) permanece disponible en el tablero de carrera. La meta de 1.000 m siempre utiliza finishTime oficial y sólo se revela después del control de cruce de los 12 caballos.
