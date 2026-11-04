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

En el navegador, `window.__cryptodromoAutodromoQA.snapshot()` permite verificar que hay 100 identidades, 12 autos instanciados, pista elegida, fuente sintética y ganador oficial. Los tests de Node comprueban reglas y fixture; **no sustituyen** una revisión visual ni medidas de FPS en desktop y móvil.

## Pendientes antes de promoción
- Capturas de tres vistas y mediciones reales de FPS/consumo WebGL en Chrome, Firefox y móvil medio.
- Modelado premium del monoplaza, detalles de carrocería y calidad de gradas, público y materiales.
- Revisión de interacciones y cámara de cada trazado, accesibilidad y fallbacks si falla CDN/WebGL.
- Incorporar la entrada al hub de estadios cuando los demás agentes concluyan, con una integración coordinada.
- Verificar la URL desplegada en Hostinger. Mergear GitHub no acredita por sí solo que la página se haya actualizado.

## Seguridad de cambios
Solo se añadieron archivos dentro de `autodromo/`, `tests/autodromo.mjs` y un workflow. No se cambió `visual-lab/scene.js`, `race-lab/source/src/main.js`, `fixture`, `racers`, ni los archivos del maestro BTC.
