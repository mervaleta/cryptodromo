# Cryptódromo · integración de landing, sedes y transmisión Alpha19

**Actualización 4 de noviembre de 2026.** La raíz `/` deja de ser la carrera y presenta una landing para elegir entre ocho estadios financieros. Cada sede tiene su página en `/stadiums/{slug}/`. Las siete sedes adicionales ofrecen calendario editorial y recorrido 3D; **no** ofrecen feeds conectados, ganadores ni apuestas.

## Estadio Satoshi Nakamoto
- `/stadiums/crypto/`: home del estadio, tres pistas con relojes independientes.
- `/stadiums/crypto/live/`: tres canales sintéticos en paralelo, con un único visor WebGL activo por vez para limitar uso de GPU.
- `/stadiums/crypto/broadcast/?track=muybridge|genesis|vint-cerf`: la antigua experiencia 3D de `/`, reutilizada para los tres fixtures.
- `/stadiums/crypto/archive/`: archivo reproducible de 7 jornadas × 1.440 carreras; filtro por pista, ticker, resultados calculados con `officialRace.js`, enlace de replay manual.
- `/estadio/?venue=crypto`: semilla 3D con tres trazados visibles simultáneamente. Es geometría de exhibición separada de resultados.

Las pistas son **Eadweard Muybridge**, **Genesis** y **Vint Cerf**. Son 480 carreras diarias por pista, un comienzo de ciclo cada 180 segundos y largadas a los 30 segundos de cada minuto correspondiente. Las secuencias dependen de `tripleRaceFixture.js` y `tripleLiveSchedule.js`, reutilizando la misma historia sintética precargada. No hay cotizaciones ni apuestas reales.

## Contratos de compatibilidad
- `/fixture/`, `/resultados/`, rankings y Grandes Premios originales continúan con el fixture Alpha18 de 480 carreras. Se enlaza al nuevo archivo del Satoshi desde esas páginas y no se reescriben los datos históricos.
- No alterar el caballo maestro de `/racers/#BTC`, galope, pelajes ni el `officialRace.js` para cambiar escenarios.
- El ranking de las carreras Alpha19 y los resultados del archivo se calculan con `officialRanking(createOfficialRace(race.entries))`. El renderizador solo visualiza.
- Mantener siempre visible que los resultados son **sintéticos y reproducibles** y que la palabra LIVE refiere al reloj de simulación.
- `robots.txt`, `sitemap.xml` y menú global tienen rutas a la nueva experiencia, sin activar apuestas.

## Verificación
La regresión específica está en `tests/alpha19-stadium-hub.mjs` y `.github/workflows/alpha19-stadium-hub.yml`; hay que comprobar también las suites de estadios, World, cámaras y browser, y la URL real de Hostinger. Un commit fusionado no demuestra por sí mismo que Hostinger haya desplegado los assets.

La siguiente pasada de diseño visual AAA debe pulir la separación física, gradas, terreno, accesos y cámaras de los tres trazados, además de conservar el contrato de datos del maestro BTC.
