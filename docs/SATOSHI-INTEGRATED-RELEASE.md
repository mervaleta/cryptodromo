# Satoshi · implementación conjunta #79 + #86

- Base: `main@b226005767f4b3b3464c079252295be7e4dec0c0`, con los cambios recientes del caballo BTC preservados.
- Origen de deportes/estadio: PR #79 (`alpha19-triple-v2-continuous-week`).
- Origen de player 3D y archivo: PR #86 (`satoshi-tv-single-player`).
- Controles compartidos fusionados expresamente: `scene.js` conserva replay automático, numeración 001–480 por canal, superficie por pista y fixture continuo; `crypto-archive.js` conserva link a TV con precios del fixture corregido.
- Cuenta de carreras: 10.080 por semana, 3.360 por pista, con 12 participantes en cada una.
- Instalación: revisar CI combinada, fusionar PR de integración y verificar en `https://race.cryptodromo.com/stadiums/crypto/live/` y `/stadiums/crypto/archive/`.
- El deploy real se considera correcto solo si los tres canales abren un canvas, el archivo reproduce una carrera y ninguna ruta presenta una página dentro de sí misma.
- Sin apuestas ni cotizaciones de mercado reales. No se modifica el caballo maestro BTC.
