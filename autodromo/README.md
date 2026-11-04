# Autódromo Crypto · Prueba de concepto aislada

## Ruta
`/autodromo/` (archivo `autodromo/index.html`). No cambia el hipódromo ni sus animaciones, espectadores, cámaras o estadio en producción.

## Qué reutiliza, sin duplicar el motor
- `race-lab/source/src/data/tokenRoster.js`: catálogo oficial de **100** tokens. Se asigna una librea procedimental estable y un número 001–100 a cada token.
- `race-lab/source/src/data/tripleRaceFixture.js`: **1440** carreras sintéticas por día, **480 por pista**, 12 tokens por carrera, siempre de la misma semana determinista; los canales están escalonados un minuto.
- `visual-lab/tripleLiveSchedule.js`: slots de **180 segundos** por pista, con carrera de **60 segundos** y los restantes **120 segundos** de intervalo. Se usa el reloj de Buenos Aires.
- `race-lab/source/src/data/officialRace.js`: `createOfficialRace()`, `positionAt()` y `officialRanking()`. Ningún elemento del autódromo puede alterar el resultado.

## Escenarios nuevos
- **Vector**: circuito de velocidad con rectas y curvas largas (`muybridge`).
- **Delta**: circuito técnico con cambios de dirección (`genesis`).
- **Neón**: trazado urbano nocturno (`vint-cerf`).

Son identidades visuales del segundo estadio; los IDs que reciben la programación se conservaron para reutilizar el fixture compartido.

El código de `autodromo/car.js` genera chasis, nosecone, alerones, halo, ruedas y texturas/ticker por Canvas. No usa archivos de coches externos, fotos, escuderías oficiales, marcas de F1 ni assets cuya licencia no se haya validado. Los tres trazados son mallas construidas con `CatmullRomCurve3`. El único requisito runtime es Three.js 0.187.0, versión del proyecto, cargada desde el mismo CDN utilizado en `grandes-premios/replay-3d/`.

## Pole position, grilla y adelantamientos

- **Clasificación previa:** al anunciar cada carrera, se calcula para los 12 seleccionados la variación porcentual entre el cierre sintético del minuto inmediatamente previo a la largada y el cierre de hasta **tres minutos antes**, ambos ya conocidos. Mayor variación previa = mejor lugar de salida; empate por ticker alfabético. No se consultan las dos velas que decidirán la carrera. Si la cinta semanal empieza antes de contar con 3 minutos, se usa todo el histórico anterior disponible.
- **Grilla real 2 × 6:** pole (P1) en columna izquierda, P2 en derecha y cinco filas adicionales; filas separadas **15 m**, con segunda columna **5 m** retrasada y los dos carriles a **±6 m** respecto del eje de pista.
- **Presentación:** en los **10 segundos anteriores** a la siguiente carrera, las cámaras muestran la formación; en la largada, los doce autos parten desde esas posiciones diferentes. La preferencia de grilla se atenúa a cero antes del segundo **45** y nunca modifica la distancia oficial ni la clasificación definitiva.
- **Adelantamientos:** `createOfficialRace()` sigue asignando nueve dosis para los primeros 45 s y tres para los últimos 15 s, con los coeficientes exactos del motor original. `positionAt(profile,t)` genera su movimiento; la posición provisional ordena la distancia descontando temporalmente la diferencia de grilla. Para que no se superpongan doce modelos 3D grandes cuando los datos de mercado producen distancias muy próximas, `visualMeters` introduce una separación suave que **preserva el orden** de `trackMeters`. Es sólo visual y no alimenta el resultado.
- **Ganador inmutable:** `officialRanking(createOfficialRace(entries))` ordena `finishTime` y no recibe ni grid, ni `visualMeters`, ni clima, ni carril. La fórmula original sigue siendo `D=1000*(1+(91*input1+120*input2)/1200)`. El arreglo de las dosis cambia los adelantamientos, no sus sumas.
- **Fuente:** semana `synthetic-v1`, repetible. La pole es una **clasificación derivada del pasado sintético**, no una sesión real de clasificación ni datos de mercado en vivo.

## Adelantamientos sin superposición · Traffic Director

La versión visual `traffic-director-v1` consume los mismos `trackMeters` y `positionAt()` de `CRP-DOSE-FAIR-V1` pero **no escribe de regreso** en el motor oficial. Los autos empiezan en su grilla 2×6 y, durante la carrera:

1. El planificador mira 2,8 segundos hacia adelante en la distancia oficial prevista de cada competidor.
2. Un auto que alcanza a otro reserva una trayectoria lateral libre dentro de la pista (seis carriles visuales) y cambia de carril de forma progresiva, con límite de 8 metros de desplazamiento lateral por segundo.
3. Cada fotograma debe respetar una envolvente de seguridad entre carrocerías. Si todos los carriles están ocupados, **el auto visual posterior espera** detrás; las variaciones de precio y la distancia de llegada permanecen intactas.
4. La carrocería gira levemente hacia la trayectoria elegida para evitar desplazamientos laterales antinaturales. El resultado y los tiempos se siguen leyendo exclusivamente de `officialRanking()`.

El sistema precalcula 301 muestras para los 60 segundos y las interpola. También aplica protección entre muestras para evitar que dos trayectorias válidas se crucen al reproducirse a 60 FPS.

QA automática: `node --experimental-default-type=module --test tests/autodromo-traffic.mjs` examina las trayectorias de nueve carreras completas a 10 Hz, exige que el ganador y los metros oficiales permanezcan inmutables y que ningún par de carrocerías invada la envolvente. La prueba Chromium revisa posiciones mundiales de los coches sobre la pista. El estado puede inspeccionarse mediante `window.__cryptodromoAutodromoQA.auditTraffic(.1)`.

## Cómo probar
1. Abrir `/autodromo/` mediante un servidor HTTP estático que sirva la raíz del repositorio.
2. Elegir Vector / Delta / Neón. Cada pista tiene un reloj real del fixture, no un fixture propio.
3. Pulsar **Probar carrera ahora**. Reproduce en 60 s los 12 participantes de la carrera programada; 2× o 4× acelera exclusivamente la visualización.
4. Verificar que el orden final coincide con `officialRanking(createOfficialRace(fixture.entries))`.
5. Volver a programación. Las carreras en curso duran 60 s; hasta la siguiente largada se conserva la clasificación de esa tanda.

El prototipo no está conectado a cotizaciones reales, no contiene monetización, no paga premios y no permite apuestas. **Todos los resultados son precomputables**. No habilitar apuestas sobre datos sintéticos conocidos.

## Pruebas
```sh
node --experimental-default-type=module --test tests/autodromo.mjs
node --check autodromo/app.js
node --check autodromo/car.js
node --check autodromo/circuit.js
```

En el navegador, `window.__cryptodromoAutodromoQA.snapshot()` permite verificar que hay 100 identidades, 12 autos instanciados, pista elegida, fuente sintética y ganador oficial.

El workflow `autodromo-browser.yml` monta Chromium con SwiftShader, verifica que existen los doce autos WebGL, cambia las tres pistas, usa la cámara de persecución y ejecuta un replay. Adjunta capturas de cada circuito, de la grilla de pole y de la vista móvil a GitHub Actions. Los tests de Node comprueban reglas y fixture; **no sustituyen** una revisión visual ni medidas de FPS en desktop y móvil.

## Pendientes antes de promoción
- Capturas de tres vistas y mediciones reales de FPS/consumo WebGL en Chrome, Firefox y móvil medio.
- Modelado premium del monoplaza, detalles de carrocería y calidad de gradas, público y materiales.
- Revisión de interacciones y cámara de cada trazado, accesibilidad y fallbacks si falla CDN/WebGL.
- Incorporar la entrada al hub de estadios cuando los demás agentes concluyan, con una integración coordinada.
- Verificar la URL desplegada en Hostinger. Mergear GitHub no acredita por sí solo que la página se haya actualizado.

## Seguridad de cambios
Solo se añadieron archivos dentro de `autodromo/`, `tests/autodromo.mjs` y un workflow. No se cambió `visual-lab/scene.js`, `race-lab/source/src/main.js`, `fixture`, `racers`, ni los archivos del maestro BTC.
