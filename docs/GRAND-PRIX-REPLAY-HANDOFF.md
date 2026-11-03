# Cryptódromo | Handoff de Grandes Premios, Trofeos y Replays (preparado, NO DESPLEGADO)

Base: main 836bca88 (Alpha18 y laboratorio ZED fusionado).

## Objetivo
Esta rama prepara una ampliación deportiva aislada que el agente de estadio podrá incorporar al terminar su trabajo. No sustituye race-lab, visual-lab, el motor de precios ni /racers. No fue desplegada en Hostinger ni integrada en la transmisión 3D.

Implementado:
1. sports/grandPrix.js: 28 Grandes Premios sobre las 3.360 carreras semanales, cuatro por jornada, sin inventar carreras nuevas. Origen synthetic-v1 / CRP-DOSE-FAIR-V1.
2. Clasificación propia del Gran Campeonato con puntos de llegada FINISH_POINTS existentes; no modifica el campeonato general ni los bonus de parciales.
3. Trofeos de este ciclo reproducible y rivalidades calculadas por enfrentamientos dentro de las carreras sintéticas.
4. prepareGrandPrixReplay() y replayFrame() usan createOfficialRace() y positionAt() y no contienen otro motor para resolver carreras.
5. /grandes-premios/: calendario, palmarés, archivo, rivalidades y reproductor 2D interactivo. Vista preliminar y fallback si falta WebGL.
6. Pruebas y workflow CI.

## Reglas
- Slots de Grandes Premios: 119, 239, 359, 479 (índices desde cero) de cada jornada; aproximadamente 05:57, 11:57, 17:57 y 23:57 hora Buenos Aires.
- Son carreras del fixture ya existente con señalización y puntuación deportiva adicional.
- Solo el motor oficial determina el ganador. Sin boosters, reproducción, clima ni compras que alteren un resultado.
- Los trofeos no representan dinero, NFTs ni ventajas competitivas.
- La clasificación por defecto muestra únicamente turnos cuya hora programada de carrera ya terminó. Eso no certifica transmisión efectivamente observada.
- El archivo íntegro permite mostrar resultados predeterminados futuros, explícitamente marcados como sintéticos.
- El ciclo sintético se repite cada semana y su palmarés se reinicia. No hay registro de varias temporadas.

## Contrato para el agente de estadio
Importar desde /sports/grandPrix.js:
- listGrandPrix()
- getGrandPrixAt(dayIndex,slotIndex) -> evento o null
- grandPrixResult(event) -> resultado oficial y puntos deportivos
- grandPrixStandings(cutoff) -> clasificación filtrada por índice absoluto completado
- prepareGrandPrixReplay(event) -> perfiles oficiales, resultado, trayectorias
- replayFrame(replay,seconds) -> array {symbol,name,color,finalPlace,meters,fraction}

El renderizador 3D puede reutilizar sus propios caballos y animaciones para visualizar las posiciones, sin escribir sobre officialRanking() y sin sustituir el estadio actual sin pruebas visuales/móviles. Para el cierre y podio debe respetar finishOrchestrator y la autorización allTwelveHorsesCrossed.

## Navegación
Al fusionar la rama, enlazar /grandes-premios/ desde /estadisticas/, /laboratorio/ y el sitio institucional. La página está diseñada con /assets/race-site-hub.css y logo existente. No editar las rutas de otros agentes hasta coordinarlas.

## QA
node --check sports/grandPrix.js
node --check grandes-premios/grandPrixPage.js
node --experimental-default-type=module --test tests/grand-prix.mjs tests/official-race.mjs tests/track-splits.mjs tests/zed-sports-lab.mjs

Workflow: .github/workflows/grand-prix.yml

## Límites y pendientes
- Falta persistencia real de trofeos y campeonatos multisemana en servidor; el circuito actual solo es un ciclo sintético.
- Replay 2D completo, falta enganchar Three.js, cámaras, relator y ceremonia 3D tras finalizar el agente de estadio.
- Jamás habilitar apuestas monetarias con fixture precomputado y conocido.
- Sin wallets, depósitos, pagos, apuestas ni activos financieros en vivo.
- No se modificaron visual-lab/scene.js ni race-lab/source/src/main.js para evitar conflictos.
